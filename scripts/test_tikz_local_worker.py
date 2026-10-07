"""Offline tests for per-question progress and cancellation."""

from pathlib import Path
from types import SimpleNamespace
import tempfile
import io
import json
import subprocess
import sys
import threading
import unittest
from unittest.mock import patch, Mock
from urllib.error import HTTPError
from urllib.parse import parse_qs, urlparse

from scripts.tikz_local_worker import run_worker, AdminApi, ApiError, WorkerHeartbeat, process_claimed_job, run_tool


class FakeApi:
    def __init__(self, cancelled_after=None):
        self.progress = []
        self.syncs = []
        self.failures = []
        self.beats = 0
        self.cancelled_after = cancelled_after

    def request(self, method, path, data=None):
        if method == "GET" and path.startswith("/api/admin/tikz-audit?"):
            return {
                "data": [
                    {"id": 1, "status": "PENDING", "images": [
                        {"hash": "a" * 64, "source": "tikz", "exists": False, "needsAction": True},
                    ]},
                    {"id": 2, "status": "PENDING", "images": [
                        {"hash": "a" * 64, "source": "tikz", "exists": False, "needsAction": True},
                    ]},
                ],
                "hasMore": False, "afterId": 2,
            }
        if path.endswith("/heartbeat"):
            self.beats += 1
            return {"status": "CANCEL_REQUESTED" if self.cancelled_after and self.beats >= self.cancelled_after else "RUNNING"}
        if path.endswith("/progress"):
            self.progress.append(data)
            return {"success": True}
        if path.endswith("/sync"):
            self.syncs.append(data)
            return {"success": True}
        if path.endswith("/failure"):
            self.failures.append(data)
            return {"success": True}
        if path.endswith("/ai-fix"):
            return {"success": True, "fixedSource": "fixed tikz"}
        raise AssertionError(f"Unexpected request: {method} {path}")


class LocalWorkerJobTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.args = SimpleNamespace(
            url="https://example.onrender.com", apply=True, limit=50,
            max_questions=0, timeout=10,
            workers=2,
            report=str(Path(self.tmp.name) / "report.json"),
        )
        self.job = {"id": 8, "afterId": 0, "token": "f" * 64}

    def tearDown(self):
        self.tmp.cleanup()

    def test_advances_cursor_after_each_question_and_reuses_compiled_svg(self):
        api = FakeApi()
        with patch("scripts.tikz_local_worker.compile_svg", return_value="<svg></svg>") as compile_svg:
            status = run_worker(self.args, api=api, job=self.job)
        self.assertEqual(status, "COMPLETED")
        self.assertEqual([progress["afterId"] for progress in api.progress], [1, 2])
        self.assertEqual(len(api.syncs), 2)
        compile_svg.assert_called_once()

    def test_stops_before_the_next_question_without_advancing_its_cursor(self):
        api = FakeApi(cancelled_after=2)
        with patch("scripts.tikz_local_worker.compile_svg", return_value="<svg></svg>"):
            status = run_worker(self.args, api=api, job=self.job)
        self.assertEqual(status, "CANCELLED")
        self.assertEqual([progress["afterId"] for progress in api.progress], [1])

    def test_compile_failure_is_reported_and_never_uploaded_as_svg(self):
        api = FakeApi()
        with patch("scripts.tikz_local_worker.compile_svg", side_effect=RuntimeError("LaTeX loi tai dong 12")):
            status = run_worker(self.args, api=api, job=self.job)
        self.assertEqual(status, "COMPLETED")
        self.assertEqual(api.syncs, [])
        self.assertEqual(len(api.failures), 2)
        self.assertTrue(all("dong 12" in item["error"] for item in api.failures))

    def test_upload_outage_never_triggers_ai_or_advances_the_question(self):
        api = FakeApi()
        original = api.request
        paths = []
        def request(method, path, data=None):
            paths.append(path)
            if path.endswith('/sync'):
                raise ApiError('HTTP 503', status=503, retryable=True)
            return original(method, path, data)
        api.request = request
        with patch('scripts.tikz_local_worker.compile_svg', return_value='<svg></svg>'):
            with self.assertRaises(ApiError):
                run_worker(self.args, api=api, job=self.job)
        self.assertFalse(any(path.endswith('/ai-fix') for path in paths))
        self.assertEqual(api.progress, [])
        self.assertEqual(self.job['afterId'], 0)

    def test_keeps_retrying_beyond_three_outages_and_reloads_durable_cursor(self):
        api = Mock()
        reads = iter([0, 1, 2, 3, 4])
        def request(method, path, data=None):
            if method == 'GET':
                return {'job': {'status': 'RUNNING', 'afterId': next(reads)}}
            if path.endswith('/heartbeat'):
                return {'status': 'RUNNING'}
            return {'success': True}
        api.request.side_effect = request
        seen = []
        def worker(args, api, job):
            seen.append(job['afterId'])
            if len(seen) < 5:
                raise ApiError('offline', retryable=True)
            return 'COMPLETED'
        with patch('scripts.tikz_local_worker.run_worker', side_effect=worker), patch('scripts.tikz_local_worker.time.sleep'):
            self.assertEqual(process_claimed_job(self.args, api, self.job), 'COMPLETED')
        self.assertEqual(seen, [0, 1, 2, 3, 4])
        finishes = [call.args[2] for call in api.request.call_args_list if call.args[1].endswith('/finish')]
        self.assertEqual([item['status'] for item in finishes], ['COMPLETED'])

    def test_lost_progress_ack_resumes_after_saved_question_without_uploading_it_twice(self):
        class DurableApi(FakeApi):
            cursor = 0
            lost_ack = False
            def request(self, method, path, data=None):
                if method == 'GET' and path == '/api/admin/tikz-jobs/8':
                    return {'job': {'status': 'RUNNING', 'afterId': self.cursor}}
                if method == 'GET' and path.startswith('/api/admin/tikz-audit?'):
                    page = super().request(method, path, data)
                    cursor = int(parse_qs(urlparse(path).query)['afterId'][0])
                    page['data'] = [q for q in page['data'] if q['id'] > cursor]
                    return page
                if path.endswith('/progress'):
                    self.cursor = max(self.cursor, data['afterId'])
                    if not self.lost_ack:
                        self.lost_ack = True
                        raise ApiError('Response lost', retryable=True)
                if path.endswith('/finish'):
                    return {'success': True}
                return super().request(method, path, data)
        api = DurableApi()
        with patch('scripts.tikz_local_worker.compile_svg', return_value='<svg></svg>'), patch('scripts.tikz_local_worker.time.sleep'):
            self.assertEqual(process_claimed_job(self.args, api, self.job), 'COMPLETED')
        self.assertEqual([item['questionId'] for item in api.syncs], [1, 2])
        self.assertEqual(self.job['afterId'], 2)

    def test_cancellation_during_ai_recompile_does_not_mark_failure_or_advance(self):
        api = FakeApi()
        def compile(source, *_args):
            if source == 'fixed tikz':
                raise InterruptedError('cancelled')
            raise RuntimeError('TeX error')
        with patch('scripts.tikz_local_worker.compile_svg', side_effect=compile):
            self.assertEqual(run_worker(self.args, api=api, job=self.job), 'CANCELLED')
        self.assertEqual(api.progress, [])
        self.assertEqual(api.failures, [])


class ApiResilienceTests(unittest.TestCase):
    def test_socket_timeout_is_retried_and_valid_json_is_returned(self):
        api = AdminApi('https://example.com')
        response = Mock()
        response.__enter__ = Mock(return_value=response)
        response.__exit__ = Mock(return_value=False)
        response.read.return_value = b'{"success":true}'
        api.opener = Mock()
        api.opener.open.side_effect = [TimeoutError('timeout')] * 3 + [response]
        with patch('scripts.tikz_local_worker.time.sleep'):
            self.assertEqual(api.request('GET', '/api/test'), {'success': True})
        self.assertEqual(api.opener.open.call_count, 4)

    def test_server_500_is_retryable_but_validation_400_is_not(self):
        for status, count in [(500, 4), (400, 1)]:
            api = AdminApi('https://example.com')
            api.opener = Mock()
            api.opener.open.side_effect = lambda *_args, **_kwargs: (_ for _ in ()).throw(HTTPError('https://example.com', status, 'error', {}, io.BytesIO(b'{"error":"test"}')))
            with patch('scripts.tikz_local_worker.time.sleep'):
                with self.assertRaises(ApiError) as raised:
                    api.request('POST', '/api/test', {})
            self.assertEqual(raised.exception.retryable, status == 500)
            self.assertEqual(api.opener.open.call_count, count)

    def test_independent_heartbeat_keeps_presence_live_during_blocking_work(self):
        event = threading.Event()
        api = Mock()
        def request(_method, path, _data):
            if path.endswith('/tikz-worker/heartbeat'):
                event.set()
            return {'status':'RUNNING'}
        api.request.side_effect = request
        heartbeat = WorkerHeartbeat(api, {'id':1,'token':'a'*64,'workerId':'worker'}, interval=0.01)
        heartbeat.start()
        try:
            self.assertTrue(event.wait(1))
            self.assertTrue(heartbeat.check())
        finally:
            heartbeat.stop()

    def test_timeout_kills_local_process_and_next_tool_can_run(self):
        with tempfile.TemporaryDirectory() as directory:
            work = Path(directory)
            with self.assertRaises(subprocess.TimeoutExpired):
                run_tool([sys.executable, '-c', 'import time;time.sleep(20)'], work, 0.1)
            result = run_tool([sys.executable, '-c', 'print("ready")'], work, 5)
            self.assertEqual(result.returncode, 0)
            self.assertIn(b'ready', result.stdout)


if __name__ == "__main__":
    unittest.main()
