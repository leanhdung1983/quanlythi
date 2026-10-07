"""Audit and compile missing TikZ drawings locally, then sync via authenticated admin API.

Dry-run is the default. Use --apply to write SVGs to the Render database.
No database credentials or API keys are stored by this script.
"""

import argparse
from collections import OrderedDict
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeout
import getpass
import http.client
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
import threading
import uuid
from http.cookiejar import CookieJar
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import HTTPCookieProcessor, Request, build_opener

PROJECT_ROOT = Path(__file__).resolve().parents[1]
EX_TEST_STYLE = PROJECT_ROOT / "template" / "ex_test.sty"
MAX_SVG_BYTES = 24_000_000

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

LATEX_TEMPLATE = r"""
\documentclass[tikz,border=2pt]{standalone}
\usepackage[utf8]{vietnam}
\usepackage{amsmath,amssymb,amsfonts}
\usepackage[hidelinks]{hyperref}
\usepackage[dvipsnames,svgnames,x11names]{xcolor}
\usepackage{pgfplots,tkz-tab,tkz-euclide,tikz-3dplot}
\usepackage{ex_test}
\pgfplotsset{compat=1.15}
\usetikzlibrary{arrows,arrows.meta,calc,intersections,angles,quotes,shapes,trees,snakes,decorations.pathreplacing,decorations.pathmorphing,decorations.markings,backgrounds,positioning,patterns}
\providecommand{\skipInterval}{0.5cm}
\definecolor{roofRedSide}{RGB}{194,55,50}
\definecolor{roofRedBottom}{RGB}{145,33,30}
\definecolor{colRedDark}{RGB}{180,0,0}
\definecolor{colRedLight}{RGB}{255,100,100}
\definecolor{colBlueDark}{RGB}{0,0,150}
\definecolor{colBlueLight}{RGB}{100,100,255}
\definecolor{colGreenDark}{RGB}{0,120,0}
\begin{document}
%CONTENT%
\end{document}
"""


class ApiError(RuntimeError):
    def __init__(self, message, status=None, retryable=False):
        super().__init__(message)
        self.status = status
        self.retryable = retryable


class AdminApi:
    def __init__(self, base_url):
        parsed = urlparse(base_url)
        if parsed.scheme != "https" and not (parsed.scheme == "http" and parsed.hostname in ("localhost", "127.0.0.1")):
            raise ValueError("URL phải dùng HTTPS (trừ localhost để kiểm thử).")
        self.base_url = base_url.rstrip("/")
        self.opener = build_opener(HTTPCookieProcessor(CookieJar()))

    def request(self, method, path, data=None):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8") if data is not None else None
        for attempt in range(4):
            request = Request(
                self.base_url + path, data=payload, method=method,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
            )
            try:
                with self.opener.open(request, timeout=180 if path.endswith('/ai-fix') else 45) as response:
                    result = json.loads(response.read().decode("utf-8"))
                    if not isinstance(result, dict):
                        raise ValueError('API không trả về đối tượng JSON hợp lệ.')
                    return result
            except HTTPError as error:
                text = error.read().decode("utf-8", errors="replace")
                error.close()
                retryable = error.code in (408, 429) or error.code >= 500
                if retryable and attempt < 3:
                    retry_after = error.headers.get("Retry-After", "")
                    delay = int(retry_after) if retry_after.isdigit() else 2 ** (attempt + 1)
                    time.sleep(min(60, max(1, delay)))
                    continue
                try:
                    body = json.loads(text)
                    message = body.get("error") or body.get("message") or text
                except ValueError:
                    message = text[:300]
                raise ApiError(f"HTTP {error.code}: {message}", status=error.code, retryable=retryable) from error
            except (URLError, TimeoutError, ConnectionError, http.client.HTTPException, OSError, ValueError) as error:
                if attempt < 3:
                    time.sleep(2 ** (attempt + 1))
                    continue
                raise ApiError(f"Không thể kết nối API Render: {getattr(error, 'reason', error)}", retryable=True) from error

    def login(self):
        username = input("Tên đăng nhập quản trị: ").strip()
        password = getpass.getpass("Mật khẩu (không lưu): ")
        result = self.request("POST", "/api/login", {"username": username, "password": password})
        if result.get("user", {}).get("role") != "ADMIN":
            raise RuntimeError("Tài khoản này không có quyền ADMIN.")


def clean_svg(svg):
    svg = re.sub(r"<!--.*?-->", "", svg, flags=re.DOTALL)
    svg = re.sub(r"<metadata\b[^>]*>.*?</metadata>", "", svg, flags=re.DOTALL | re.IGNORECASE)
    svg = re.sub(r"<\?xml.*?\?>", "", svg, flags=re.DOTALL)
    svg = re.sub(r"<!DOCTYPE.*?>", "", svg, flags=re.DOTALL | re.IGNORECASE)
    return svg.strip()


def validate_svg_references(svg):
    ids = set(re.findall(r'\bid=["\']([^"\']+)["\']', svg))
    references = re.findall(r'(?:xlink:href|href)=["\']#([^"\']+)["\']', svg)
    missing = sorted(set(references) - ids)
    if missing:
        raise RuntimeError("SVG thiếu định nghĩa nét chữ/hình: " + ", ".join(missing[:5]))


def run_tool(command, work, timeout, environment=None, cancel_event=None):
    """Bound the whole TeX process tree, including font-generation children."""
    options = {"start_new_session": True} if os.name != "nt" else {
        "creationflags": subprocess.CREATE_NO_WINDOW | subprocess.CREATE_NEW_PROCESS_GROUP,
    }
    with (work / "tool-output.log").open("wb") as output:
        process = subprocess.Popen(command, cwd=work, env=environment, stdout=output,
                                   stderr=subprocess.STDOUT, **options)
        try:
            deadline = time.monotonic() + timeout
            while True:
                if cancel_event and cancel_event.is_set():
                    raise InterruptedError('Biên dịch đã dừng theo yêu cầu.')
                remaining = deadline - time.monotonic()
                if remaining <= 0:
                    raise subprocess.TimeoutExpired(command, timeout)
                try:
                    process.wait(timeout=min(1, remaining))
                    break
                except subprocess.TimeoutExpired:
                    continue
        except BaseException:
            if os.name == "nt":
                subprocess.run(["taskkill", "/PID", str(process.pid), "/T", "/F"],
                               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                               timeout=10, creationflags=subprocess.CREATE_NO_WINDOW, check=False)
            else:
                import signal
                try:
                    os.killpg(process.pid, signal.SIGKILL)
                except ProcessLookupError:
                    pass
            process.wait(timeout=10)
            raise
    with (work / "tool-output.log").open("rb") as output:
        output.seek(max(0, output.seek(0, 2) - 8000))
        tail = output.read()
    return subprocess.CompletedProcess(command, process.returncode, tail)


def compile_svg(source, timeout, cancel_event=None):
    if not EX_TEST_STYLE.is_file():
        raise RuntimeError(f"Thiếu bộ style ex_test: {EX_TEST_STYLE}")
    if not shutil.which("pdflatex"):
        raise RuntimeError("Không tìm thấy pdflatex trong PATH.")
    if not shutil.which("dvisvgm") and not shutil.which("pdf2svg"):
        raise RuntimeError("Cần dvisvgm hoặc pdf2svg trong PATH.")
    with tempfile.TemporaryDirectory(prefix="id6_tikz_", ignore_cleanup_errors=True) as directory:
        work = Path(directory)
        shutil.copy2(EX_TEST_STYLE, work / "ex_test.sty")
        (work / "drawing.tex").write_text(LATEX_TEMPLATE.replace("%CONTENT%", source), encoding="utf-8")
        environment = os.environ.copy()
        environment.update({"openin_any": "p", "openout_any": "p", "shell_escape": "f"})
        latex = run_tool(
            ["pdflatex", "-no-shell-escape", "-halt-on-error", "-file-line-error",
             "-interaction=nonstopmode", "drawing.tex"],
            work, timeout, environment, cancel_event,
        )
        pdf = work / "drawing.pdf"
        if latex.returncode or not pdf.is_file():
            output = latex.stdout.decode("utf-8", errors="replace")
            errors = [line.strip() for line in output.splitlines() if line.startswith("!") or "Error:" in line]
            raise RuntimeError("LaTeX lỗi: " + (" | ".join(errors[:3]) or output[-400:]))
        svg = work / "drawing.svg"
        commands = []
        if shutil.which("dvisvgm"):
            # Convert every glyph to paths. This prevents math signs and variation-table
            # labels from disappearing on devices that do not have the TeX fonts.
            commands.append(["dvisvgm", "--pdf", "--no-fonts=0", "--optimize=all", "--exact-bbox", "--output=drawing.svg", "drawing.pdf"])
        if shutil.which("pdf2svg"):
            commands.append(["pdf2svg", "drawing.pdf", "drawing.svg"])
        errors = []
        converted = False
        for command in commands:
            try:
                conversion = run_tool(command, work, timeout, cancel_event=cancel_event)
            except subprocess.TimeoutExpired:
                errors.append(f"{command[0]} quá thời gian {timeout}s")
                continue
            if conversion.returncode == 0 and svg.is_file():
                converted = True
                break
            errors.append(conversion.stdout.decode("utf-8", errors="replace")[-300:])
        if not converted:
            raise RuntimeError("PDF → SVG lỗi: " + " | ".join(errors))
        result = clean_svg(svg.read_text(encoding="utf-8"))
        if not re.search(r"<svg\b", result, re.IGNORECASE) or not result.endswith("</svg>"):
            raise RuntimeError("Công cụ chuyển đổi không trả về SVG hợp lệ.")
        if len(result.encode("utf-8")) > MAX_SVG_BYTES:
            raise RuntimeError("SVG vượt giới hạn an toàn 24 MB.")
        validate_svg_references(result)
        return result


class WorkerHeartbeat:
    def __init__(self, api, job, interval=15):
        self.api, self.job, self.interval = api, job, interval
        self.stop_event = threading.Event()
        self.cancelled = threading.Event()
        self.error = None
        self.thread = None

    def start(self):
        if self.job:
            self.thread = threading.Thread(target=self._run, name="tikz-heartbeat", daemon=True)
            self.thread.start()

    def _run(self):
        while not self.stop_event.wait(self.interval):
            try:
                if self.job.get("workerId"):
                    self.api.request("POST", "/api/admin/tikz-worker/heartbeat", {"workerId": self.job["workerId"]})
                result = self.api.request("POST", "/api/admin/tikz-jobs/{}/heartbeat".format(self.job["id"]), {"token": self.job["token"]})
                if result["status"] == "CANCEL_REQUESTED":
                    self.cancelled.set()
            except ApiError as error:
                if error.status in (401, 403, 409):
                    self.error = error
                    self.cancelled.set()
                    return
            except (RuntimeError, OSError):
                pass

    def check(self):
        if self.error:
            raise self.error
        return not self.cancelled.is_set()

    def stop(self):
        self.stop_event.set()
        if self.thread:
            self.thread.join(timeout=1)


def run_worker(args, api=None, job=None):
    if api is None:
        api = AdminApi(args.url)
        api.login()
    cursor = job["afterId"] if job else 0
    scanned = synced = failed = 0
    outcomes = []
    # SVGs can be tens of MB. Keep only a small LRU instead of retaining the
    # entire database run in RAM (which previously made long jobs crash).
    compiled = OrderedDict()
    workers = max(1, getattr(args, "workers", 4))
    cache_limit = max(4, workers * 4)
    executor = ThreadPoolExecutor(max_workers=workers)
    spool_directory = tempfile.TemporaryDirectory(prefix='tikz_svg_batch_', ignore_cleanup_errors=True)
    spool = Path(spool_directory.name)
    heartbeat = WorkerHeartbeat(api, job)
    heartbeat.start()

    def save_report():
        if outcomes:
            report = Path(args.report)
            try:
                report.parent.mkdir(parents=True, exist_ok=True)
                report.write_text(json.dumps(outcomes, ensure_ascii=False, indent=2), encoding="utf-8")
                print(f"Báo cáo lỗi: {report}")
            except OSError as error:
                print(f"Không ghi được báo cáo local, vẫn tiếp tục xử lý: {error}")

    def job_heartbeat():
        if not heartbeat.check():
            return False
        if not job:
            return True
        response = api.request("POST", f"/api/admin/tikz-jobs/{job['id']}/heartbeat", {"token": job["token"]})
        return response["status"] != "CANCEL_REQUESTED"

    def job_progress(question_id, synced_before, failed_before):
        if job:
            api.request("POST", f"/api/admin/tikz-jobs/{job['id']}/progress", {
                "token": job["token"], "afterId": question_id,
                "synced": synced - synced_before, "failed": failed - failed_before,
            })
            job["afterId"] = max(job["afterId"], question_id)

    def job_checkpoint(question_id):
        if job and question_id > 0:
            api.request("POST", f"/api/admin/tikz-jobs/{job['id']}/progress", {
                "token": job["token"], "afterId": question_id,
                "synced": 0, "failed": 0, "scanned": 0,
            })
            job["afterId"] = max(job["afterId"], question_id)

    def remember_compiled(hash_value, svg):
        compiled[hash_value] = svg
        compiled.move_to_end(hash_value)
        while len(compiled) > cache_limit:
            compiled.popitem(last=False)
        while len(compiled) > 1 and sum(len(value.encode('utf-8')) for value in compiled.values()) > 64_000_000:
            compiled.popitem(last=False)

    def wait_for_compile(future):
        """Keep the remote lease alive while TeX is busy on the local machine."""
        while True:
            try:
                return future.result(timeout=20 if job else None)
            except FutureTimeout:
                if not job_heartbeat():
                    future.cancel()
                    raise InterruptedError("Công việc đã được yêu cầu dừng.")

    def compile_to_file(hash_value, source):
        svg = compile_svg(source, args.timeout, heartbeat.cancelled)
        path = spool / (hash_value + '.svg')
        path.write_text(svg, encoding='utf-8')
        return path

    try:
      while True:
        for cached_file in spool.glob('*.svg'):
            cached_file.unlink()
        page = api.request("GET", "/api/admin/tikz-audit?" + urlencode({
            "afterId": cursor, "limit": args.limit, "actionable": 1,
        }))
        if not heartbeat.check():
            save_report()
            return "CANCELLED"
        # Queue each unique drawing once. Completed futures retain only paths,
        # allowing other lanes to keep working while the first drawing is slow.
        # The spool is cleared per page, and SVG text stays in the bounded LRU.
        futures = {}
        source_queue = []
        if args.apply:
            remaining = args.max_questions - scanned if args.max_questions else len(page["data"])
            for question in page["data"][:remaining]:
                if question['status'] in ('READY', 'NO_TIKZ', 'MALFORMED_SOURCE'):
                    continue
                for image in question["images"]:
                    hash_value = image["hash"]
                    if (image["needsAction"] and not image["exists"] and image["source"]
                            and hash_value not in compiled
                            and all(queued[0] != hash_value for queued in source_queue)):
                        source_queue.append((hash_value, image["source"]))
        for hash_value, source in source_queue:
            futures[hash_value] = executor.submit(compile_to_file, hash_value, source)
        for question in page["data"]:
            if question['status'] in ('READY', 'NO_TIKZ'):
                continue
            if args.max_questions and scanned >= args.max_questions:
                break
            if not job_heartbeat():
                save_report()
                return "CANCELLED"
            synced_before, failed_before = synced, failed
            scanned += 1
            if question["status"] in ("MALFORMED_SOURCE", "SOURCE_MISMATCH", "OTHER_IMAGE"):
                reason = {
                    "MALFORMED_SOURCE": "Mã TikZ hoặc placeholder không hợp lệ; cần sửa nguồn trước khi biên dịch.",
                    "SOURCE_MISMATCH": "Mã TikZ gốc không còn liên kết với nội dung hiện tại.",
                    "OTHER_IMAGE": "Câu có hình không phải TikZ; cần kiểm tra tài nguyên gốc thủ công.",
                }[question["status"]]
                outcomes.append({"id": question["id"], "status": question["status"], "error": reason})
                print(f"[CẦN KIỂM TRA] #{question['id']}: {reason}")
                if question["status"] != "OTHER_IMAGE":
                    failed += 1
                if question["status"] == "MALFORMED_SOURCE":
                    job_progress(question["id"], synced_before, failed_before)
                    continue
            for image_index, image in enumerate(question["images"]):
                if not image["needsAction"]:
                    continue
                # The question-level heartbeat already checked cancellation.
                # Check again only between multiple drawings, saving one HTTPS
                # round trip for the common one-drawing question.
                if image_index > 0 and not job_heartbeat():
                    save_report()
                    return "CANCELLED"
                hash_value = image["hash"]
                label = f"#{question['id']} / {hash_value[:10]}"
                if not image["source"] and not image["exists"]:
                    error = "Placeholder thiếu SVG và không còn mã TikZ gốc."
                    if args.apply:
                        api.request("POST", "/api/admin/tikz-audit/failure", {
                            "questionId": question["id"], "hash": hash_value, "error": error,
                        })
                    failed += 1
                    outcomes.append({"id": question["id"], "hash": hash_value, "error": error})
                    print(f"[THIẾU NGUỒN] {label}")
                    continue
                if not args.apply:
                    print(f"[CẦN XỬ LÝ] {label} {'đã có SVG' if image['exists'] else 'cần biên dịch'}")
                    continue
                try:
                    svg = None
                    if not image["exists"]:
                        if hash_value not in compiled:
                            future = futures.pop(hash_value, None)
                            if future:
                                svg_result = wait_for_compile(future).read_text(encoding='utf-8')
                            elif (spool / (hash_value + '.svg')).is_file():
                                svg_result = (spool / (hash_value + '.svg')).read_text(encoding='utf-8')
                            else:
                                svg_result = compile_svg(image["source"], args.timeout, heartbeat.cancelled)
                            remember_compiled(hash_value, svg_result)
                        else:
                            compiled.move_to_end(hash_value)
                        svg = compiled[hash_value]
                    api.request("POST", "/api/admin/tikz-audit/sync", {
                        "questionId": question["id"], "hash": hash_value, "svg": svg,
                    })
                    synced += 1
                    print(f"[ĐÃ LƯU] {label}")
                except InterruptedError:
                    heartbeat.check()
                    save_report()
                    return "CANCELLED"
                except ApiError as error:
                    if error.retryable or error.status in (401, 403):
                        raise
                    # Upload errors must never be mistaken for a TeX failure.
                    failed += 1
                    outcomes.append({"id": question["id"], "hash": hash_value, "error": str(error)[:1000]})
                    print(f"[KHÔNG LƯU] {label}: {error}")
                    try:
                        api.request("POST", "/api/admin/tikz-audit/failure", {"questionId": question["id"], "hash": hash_value, "error": str(error)[:1000]})
                    except ApiError as report_error:
                        if report_error.retryable or report_error.status in (401, 403):
                            raise
                except (RuntimeError, subprocess.TimeoutExpired, OSError) as error:
                    message = str(error)[:1000]
                    repair_stage = 'ai'
                    try:
                        repaired = api.request("POST", "/api/admin/tikz-audit/ai-fix", {
                            "questionId": question["id"], "hash": hash_value, "error": message,
                        })
                        fixed_svg = wait_for_compile(executor.submit(
                            compile_svg, repaired["fixedSource"], args.timeout, heartbeat.cancelled,
                        ))
                        repair_stage = 'sync'
                        api.request("POST", "/api/admin/tikz-audit/sync", {
                            "questionId": question["id"], "hash": hash_value, "svg": fixed_svg,
                        })
                        remember_compiled(hash_value, fixed_svg)
                        synced += 1
                        print(f"[AI ĐÃ SỬA VÀ LƯU] {label}")
                        continue
                    except InterruptedError:
                        heartbeat.check()
                        save_report()
                        return "CANCELLED"
                    except ApiError as ai_error:
                        if ai_error.status in (401, 403) or (ai_error.retryable and (ai_error.status != 502 or repair_stage == 'sync')):
                            raise
                        message = f"{message} | AI sửa thất bại: {str(ai_error)}"[:1000]
                    except (RuntimeError, subprocess.TimeoutExpired, KeyError, OSError) as ai_error:
                        message = f"{message} | AI sửa thất bại: {str(ai_error)}"[:1000]
                    failed += 1
                    outcomes.append({"id": question["id"], "hash": hash_value, "error": message})
                    print(f"[LỖI] {label}: {message}")
                    try:
                        api.request("POST", "/api/admin/tikz-audit/failure", {
                            "questionId": question["id"], "hash": hash_value, "error": message,
                        })
                    except ApiError as report_error:
                        if report_error.retryable or report_error.status in (401, 403):
                            raise
                        print(f"[KHÔNG LƯU ĐƯỢC BÁO CÁO] {report_error}")
            job_progress(question["id"], synced_before, failed_before)
        if args.max_questions and scanned >= args.max_questions:
            break
        if not page["hasMore"]:
            break
        if page["afterId"] <= cursor:
            raise RuntimeError("Con trỏ quét không tiến; dừng để tránh bỏ sót dữ liệu.")
        # The server may return an empty actionable page after checking stored
        # hashes. Persist its scan cursor so a reconnect does not rescan it.
        job_checkpoint(page["afterId"])
        cursor = page["afterId"]
        print(f"Đã quét {scanned} câu, đồng bộ {synced} hình, lỗi {failed}.")
    finally:
        heartbeat.cancelled.set()
        heartbeat.stop()
        executor.shutdown(wait=True, cancel_futures=True)
        spool_directory.cleanup()
        save_report()
    print(f"HOÀN TẤT: quét {scanned} câu, đồng bộ {synced} hình, lỗi {failed}.")
    save_report()
    return "COMPLETED"


def process_claimed_job(args, api, claimed):
    """Transient outages never close a job; reload its persisted cursor on every retry."""
    attempt = 0
    while True:
        try:
            remote = api.request('GET', '/api/admin/tikz-jobs/{}'.format(claimed['id']))['job']
            if remote['status'] in ('COMPLETED', 'CANCELLED', 'FAILED'):
                return remote['status']
            claimed['afterId'] = remote['afterId']
            status = run_worker(args, api=api, job=claimed)
            if status == 'COMPLETED':
                beat = api.request('POST', '/api/admin/tikz-jobs/{}/heartbeat'.format(claimed['id']), {'token': claimed['token']})
                if beat['status'] == 'CANCEL_REQUESTED':
                    status = 'CANCELLED'
            api.request('POST', '/api/admin/tikz-jobs/{}/finish'.format(claimed['id']), {
                'token': claimed['token'], 'status': status,
            })
            return status
        except ApiError as error:
            if error.status == 409:
                print('Lô đã đổi worker hoặc nhận lệnh dừng; tải lại trạng thái trước khi nhận lô tiếp theo.')
                return 'LEASE_LOST'
            if error.status == 401:
                print('Phiên quản trị đã hết hạn. Đăng nhập lại để tiếp tục từ điểm đã lưu.')
                api.login()
            elif not error.retryable:
                raise
            attempt += 1
            delay = min(60, 5 * attempt)
            print(f"[LÔ #{claimed['id']}] Tạm mất kết nối, thử lại sau {delay}s từ điểm đã lưu: {error}")
            time.sleep(delay)
        except Exception as error:
            # A malformed page or a permanent local configuration error must be visible.
            api.request('POST', '/api/admin/tikz-jobs/{}/finish'.format(claimed['id']), {
                'token': claimed['token'], 'status': 'FAILED', 'error': str(error)[:1000],
            })
            raise


def run_daemon(args):
    api = AdminApi(args.url)
    api.login()
    worker_id = str(uuid.uuid4())
    args.apply = True  # A queued job is created only by an ADMIN clicking the web button.
    args.max_questions = 0
    print(f"Worker local đang chờ lệnh từ Render ({worker_id}). Nhấn Ctrl+C để dừng.")
    while True:
        try:
            api.request("POST", "/api/admin/tikz-worker/heartbeat", {"workerId": worker_id})
            claimed = api.request("POST", "/api/admin/tikz-worker/claim", {"workerId": worker_id})["job"]
            if claimed:
                claimed['workerId'] = worker_id
                print(f"[LÔ #{claimed['id']}] Bắt đầu từ ID câu hỏi {claimed['afterId']}.")
                process_claimed_job(args, api, claimed)
            else:
                time.sleep(10)
        except Exception as error:
            print(f"Worker không kết nối được: {error}")
            if "HTTP 401" in str(error):
                api.login()
            time.sleep(10)


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Quét và biên dịch TikZ từ Render bằng TeX local.")
    parser.add_argument("--url", required=True, help="URL dịch vụ Render, ví dụ https://quanlythi.onrender.com")
    parser.add_argument("--apply", action="store_true", help="Cho phép lưu SVG và cập nhật database; mặc định chỉ kiểm kê.")
    parser.add_argument("--daemon", action="store_true", help="Chờ nút trên web và tự xử lý lô công việc bằng TeX local.")
    parser.add_argument("--limit", type=int, default=25, choices=range(1, 101), metavar="1..100")
    parser.add_argument("--timeout", type=int, default=90, help="Thời gian tối đa cho mỗi bước biên dịch (giây).")
    parser.add_argument("--workers", type=int, default=4, choices=range(1, 9), metavar="1..8",
                        help="Số hình biên dịch song song; mặc định 4, có thể tăng đến 8 nếu máy đủ tài nguyên.")
    parser.add_argument("--max-questions", type=int, default=0, help="Dừng sau N câu để chạy thử.")
    parser.add_argument("--report", default=str(PROJECT_ROOT / "output" / "tikz_worker_errors.json"))
    arguments = parser.parse_args()
    try:
        if arguments.daemon:
            run_daemon(arguments)
        else:
            run_worker(arguments)
    except KeyboardInterrupt:
        print("Worker đã dừng theo yêu cầu.")
