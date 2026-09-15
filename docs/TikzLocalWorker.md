# Kiểm kê và biên dịch TikZ trên máy local

Chức năng quản trị **Source & SVG Viewer → Quét toàn bộ câu hỏi** đọc toàn bộ bảng
`questions` theo ID tăng dần. Nó đối chiếu TikZ, `[TIKZ_HASH:...]` và bảng
`question_images`, không sửa dữ liệu khi quét. Câu có TikZ lỗi, hình không phải
TikZ hoặc SVG thiếu mã nguồn được liệt kê để xem thủ công.

`scripts/tikz_local_worker.py` đăng nhập qua API bằng tài khoản ADMIN; chương
trình không kết nối trực tiếp TiDB/MySQL và không lưu mật khẩu. Cần Python 3,
`pdflatex`, `dvisvgm` (hoặc `pdf2svg`) trong PATH và bộ LaTeX có TikZ,
`tkz-tab`, `tkz-euclide`, `standalone`, `ex_test`. Style `ex_test.sty` trong
`template/` được sao chép vào thư mục biên dịch tạm.

Trước khi áp dụng hàng loạt, sao lưu database. Dùng URL Render của **repo mới**:

```powershell
python scripts/tikz_local_worker.py --url https://TEN-DICH-VU.onrender.com
python scripts/tikz_local_worker.py --url https://TEN-DICH-VU.onrender.com --apply --max-questions 10
python scripts/tikz_local_worker.py --url https://TEN-DICH-VU.onrender.com --apply
```

Lệnh đầu chỉ kiểm kê (dry-run). Lệnh thứ hai thử tối đa 10 câu đầu theo ID;
nếu chúng không có TikZ, vẫn phải thử một lô lớn hơn trước khi chạy toàn bộ.
Lệnh cuối biên dịch và gửi SVG qua API quản trị. Máy local phải bật trong thời
gian chạy; Render không tự gọi ngược về `localhost`. Chỉ khi SVG được lưu và
mọi mã TikZ trong câu đã thay thành placeholder, trạng thái mới được đánh dấu
hoàn tất. Các khối thất bại giữ nguyên để có thể chạy lại. Báo cáo lỗi được
lưu mặc định ở `output/tikz_worker_errors.json` trên máy local.

Biên dịch dùng `-no-shell-escape`, giới hạn thời gian mỗi bước (`--timeout`,
mặc định 90 giây), thư mục tạm riêng và giới hạn SVG 1,9 MB. Không chỉnh
các file Python cũ chứa thông tin database rồi đẩy chúng lên GitHub. Nếu
thông tin DB đã từng được lưu trong mã, đổi mật khẩu DB trước khi sử dụng tiếp.
