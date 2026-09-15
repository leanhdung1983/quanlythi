"""Audit and compile missing TikZ drawings locally, then sync via authenticated admin API.

Dry-run is the default. Use --apply to write SVGs to the Render database.
No database credentials or API keys are stored by this script.
"""

import argparse
import getpass
import json
import os
from pathlib import Path
import re
import shutil
import subprocess
import sys
import tempfile
import time
from http.cookiejar import CookieJar
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlparse
from urllib.request import HTTPCookieProcessor, Request, build_opener

PROJECT_ROOT = Path(__file__).resolve().parents[1]
EX_TEST_STYLE = PROJECT_ROOT / "template" / "ex_test.sty"
MAX_SVG_BYTES = 1_900_000

if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

LATEX_TEMPLATE = r"""
\documentclass[tikz,border=2pt]{standalone}
\usepackage[utf8]{vietnam}
\usepackage{amsmath,amssymb,amsfonts}
\usepackage[dvipsnames,svgnames,x11names]{xcolor}
\usepackage{pgfplots,tkz-tab,tkz-euclide,tikz-3dplot}
\usepackage{ex_test}
\pgfplotsset{compat=1.15}
\usetikzlibrary{arrows,arrows.meta,calc,intersections,angles,quotes,shapes,decorations.pathreplacing,backgrounds,positioning,patterns}
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


class AdminApi:
    def __init__(self, base_url):
        parsed = urlparse(base_url)
        if parsed.scheme != "https" and not (parsed.scheme == "http" and parsed.hostname in ("localhost", "127.0.0.1")):
            raise ValueError("URL phải dùng HTTPS (trừ localhost để kiểm thử).")
        self.base_url = base_url.rstrip("/")
        self.opener = build_opener(HTTPCookieProcessor(CookieJar()))

    def request(self, method, path, data=None):
        payload = json.dumps(data).encode("utf-8") if data is not None else None
        for attempt in range(4):
            request = Request(
                self.base_url + path, data=payload, method=method,
                headers={"Content-Type": "application/json", "Accept": "application/json"},
            )
            try:
                with self.opener.open(request, timeout=45) as response:
                    return json.loads(response.read().decode("utf-8"))
            except HTTPError as error:
                text = error.read().decode("utf-8", errors="replace")
                if error.code in (429, 502, 503, 504) and attempt < 3:
                    retry_after = error.headers.get("Retry-After", "")
                    delay = int(retry_after) if retry_after.isdigit() else 2 ** (attempt + 1)
                    time.sleep(min(60, max(1, delay)))
                    continue
                try:
                    body = json.loads(text)
                    message = body.get("error") or body.get("message") or text
                except ValueError:
                    message = text[:300]
                raise RuntimeError(f"HTTP {error.code}: {message}") from error
            except URLError as error:
                if attempt < 3:
                    time.sleep(2 ** (attempt + 1))
                    continue
                raise RuntimeError(f"Không thể kết nối API Render: {error.reason}") from error

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


def compile_svg(source, timeout):
    if not EX_TEST_STYLE.is_file():
        raise RuntimeError(f"Thiếu bộ style ex_test: {EX_TEST_STYLE}")
    if not shutil.which("pdflatex"):
        raise RuntimeError("Không tìm thấy pdflatex trong PATH.")
    if not shutil.which("dvisvgm") and not shutil.which("pdf2svg"):
        raise RuntimeError("Cần dvisvgm hoặc pdf2svg trong PATH.")
    with tempfile.TemporaryDirectory(prefix="id6_tikz_") as directory:
        work = Path(directory)
        shutil.copy2(EX_TEST_STYLE, work / "ex_test.sty")
        (work / "drawing.tex").write_text(LATEX_TEMPLATE.replace("%CONTENT%", source), encoding="utf-8")
        environment = os.environ.copy()
        environment.update({"openin_any": "p", "openout_any": "p", "shell_escape": "f"})
        latex = subprocess.run(
            ["pdflatex", "-no-shell-escape", "-halt-on-error", "-file-line-error",
             "-interaction=nonstopmode", "drawing.tex"],
            cwd=work, env=environment, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            timeout=timeout, check=False,
        )
        pdf = work / "drawing.pdf"
        if latex.returncode or not pdf.is_file():
            output = latex.stdout.decode("utf-8", errors="replace")
            errors = [line.strip() for line in output.splitlines() if line.startswith("!") or "Error:" in line]
            raise RuntimeError("LaTeX lỗi: " + (" | ".join(errors[:3]) or output[-400:]))
        svg = work / "drawing.svg"
        commands = []
        if shutil.which("dvisvgm"):
            commands.append(["dvisvgm", "--pdf", "--output=drawing.svg", "drawing.pdf"])
        if shutil.which("pdf2svg"):
            commands.append(["pdf2svg", "drawing.pdf", "drawing.svg"])
        errors = []
        converted = False
        for command in commands:
            conversion = subprocess.run(
                command, cwd=work, stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
                timeout=timeout, check=False,
            )
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
            raise RuntimeError("SVG vượt giới hạn 1,9 MB.")
        return result


def run_worker(args):
    api = AdminApi(args.url)
    api.login()
    cursor = 0
    scanned = synced = failed = 0
    outcomes = []
    compiled = {}
    while True:
        page = api.request("GET", "/api/admin/tikz-audit?" + urlencode({"afterId": cursor, "limit": args.limit}))
        for question in page["data"]:
            if args.max_questions and scanned >= args.max_questions:
                break
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
                    continue
            for image in question["images"]:
                if not image["needsAction"]:
                    continue
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
                            compiled[hash_value] = compile_svg(image["source"], args.timeout)
                        svg = compiled[hash_value]
                    api.request("POST", "/api/admin/tikz-audit/sync", {
                        "questionId": question["id"], "hash": hash_value, "svg": svg,
                    })
                    synced += 1
                    print(f"[ĐÃ LƯU] {label}")
                except (RuntimeError, subprocess.TimeoutExpired) as error:
                    message = str(error)[:1000]
                    failed += 1
                    outcomes.append({"id": question["id"], "hash": hash_value, "error": message})
                    print(f"[LỖI] {label}: {message}")
                    try:
                        api.request("POST", "/api/admin/tikz-audit/failure", {
                            "questionId": question["id"], "hash": hash_value, "error": message,
                        })
                    except RuntimeError as report_error:
                        print(f"[KHÔNG LƯU ĐƯỢC BÁO CÁO] {report_error}")
        if args.max_questions and scanned >= args.max_questions:
            break
        if not page["hasMore"]:
            break
        if page["afterId"] <= cursor:
            raise RuntimeError("Con trỏ quét không tiến; dừng để tránh bỏ sót dữ liệu.")
        cursor = page["afterId"]
        print(f"Đã quét {scanned} câu, đồng bộ {synced} hình, lỗi {failed}.")
    print(f"HOÀN TẤT: quét {scanned} câu, đồng bộ {synced} hình, lỗi {failed}.")
    if outcomes:
        report = Path(args.report)
        report.parent.mkdir(parents=True, exist_ok=True)
        report.write_text(json.dumps(outcomes, ensure_ascii=False, indent=2), encoding="utf-8")
        print(f"Báo cáo lỗi: {report}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Quét và biên dịch TikZ từ Render bằng TeX local.")
    parser.add_argument("--url", required=True, help="URL dịch vụ Render, ví dụ https://quanlythi.onrender.com")
    parser.add_argument("--apply", action="store_true", help="Cho phép lưu SVG và cập nhật database; mặc định chỉ kiểm kê.")
    parser.add_argument("--limit", type=int, default=50, choices=range(1, 101), metavar="1..100")
    parser.add_argument("--timeout", type=int, default=90, help="Thời gian tối đa cho mỗi bước biên dịch (giây).")
    parser.add_argument("--max-questions", type=int, default=0, help="Dừng sau N câu để chạy thử.")
    parser.add_argument("--report", default=str(PROJECT_ROOT / "output" / "tikz_worker_errors.json"))
    run_worker(parser.parse_args())
