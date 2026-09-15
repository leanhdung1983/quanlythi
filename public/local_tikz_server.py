import subprocess
import os
import tempfile
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

app = FastAPI()

# BẮT BUỘC: Cấu hình CORS để React (ví dụ chạy ở port 3000) có thể gọi được API ở port 5000
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Trên local có thể để "*", lên production nên giới hạn lại domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/render")
async def render_tikz(request: Request):
    # Lấy raw data từ body (do Frontend gửi header 'Content-Type': 'text/plain')
    body_bytes = await request.body()
    latex_code = body_bytes.decode('utf-8')

    # Sử dụng thư mục tạm để tự động dọn dẹp file rác
    with tempfile.TemporaryDirectory() as temp_dir:
        tex_file = os.path.join(temp_dir, 'temp.tex')
        pdf_file = os.path.join(temp_dir, 'temp.pdf')
        svg_file = os.path.join(temp_dir, 'output.svg')

        # Ghi mã LaTeX ra file
        with open(tex_file, 'w', encoding='utf-8') as f:
            f.write(latex_code)

        try:
            # 1. Biên dịch TEX sang PDF
            result_tex = subprocess.run(
                ['pdflatex', '-interaction=nonstopmode', '-output-directory', temp_dir, tex_file],
                capture_output=True,
                text=True
            )
            
            if result_tex.returncode != 0:
                # Tìm kiếm lỗi có ích trong log LaTeX
                log_content = result_tex.stdout
                error_msg = "Lỗi biên dịch LaTeX. Xem log chi tiết ở dòng dưới."
                lines = log_content.split('\n')
                for i, line in enumerate(lines):
                    if line.startswith('!'):
                        error_msg = line
                        if i + 1 < len(lines):
                            error_msg += " " + lines[i+1].strip()
                        break
                        
                return JSONResponse(
                    status_code=400, 
                    content={"error": f"Lỗi pdflatex: {error_msg}\n{log_content[-500:]}"}
                )
            
            # 2. Convert PDF sang SVG
            result_svg = subprocess.run(
                ['pdf2svg', pdf_file, svg_file],
                capture_output=True,
                text=True
            )
            
            if result_svg.returncode != 0:
                return JSONResponse(
                    status_code=400, 
                    content={"error": f"Lỗi pdf2svg: {result_svg.stderr}"}
                )

            # Đọc nội dung SVG
            with open(svg_file, 'r', encoding='utf-8') as f:
                svg_content = f.read()

            # Trả về JSON đúng cấu trúc Frontend đang bắt: jsonResponse.success && jsonResponse.svg
            return {"success": True, "svg": svg_content}

        except Exception as e:
            return JSONResponse(
                status_code=500, 
                content={"error": f"Lỗi server nội bộ: {str(e)}"}
            )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
