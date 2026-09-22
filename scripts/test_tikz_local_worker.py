"""Offline tests for per-question progress and cancellation."""

from pathlib import Path
from types import SimpleNamespace
import tempfile
import unittest
from unittest.mock import patch

from scripts.tikz_local_worker import run_worker


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
        raise AssertionError(f"Unexpected request: {method} {path}")


class LocalWorkerJobTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.args = SimpleNamespace(
            url="https://example.onrender.com", apply=True, limit=50,
            max_questions=0, timeout=10,
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
        api = FakeApi(cancelled_after=3)
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


if __name__ == "__main__":
    unittest.main()
