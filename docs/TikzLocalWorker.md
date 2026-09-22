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

## Bấm nút trên web để biên dịch

Trên Windows, có thể nhấp đúp `CHAY_TIKZ_SVG_LOCAL.bat`, nhập URL Render và
chọn mục **1**. File BAT tự kiểm tra Python, TeX, công cụ SVG và không lưu mật
khẩu. Có thể tạo shortcut của file này ra Desktop; không di chuyển riêng file
BAT khỏi thư mục dự án.

Trên máy local, mở terminal tại thư mục dự án và khởi động worker **một lần**:

```powershell
python scripts/tikz_local_worker.py --url https://TEN-DICH-VU.onrender.com --daemon
```

Đăng nhập bằng tài khoản ADMIN khi được hỏi và giữ terminal chạy. Trong
**Source & SVG Viewer**, chờ trạng thái **Worker: Đang kết nối**, rồi bấm
**Quét và biên dịch**. Render lưu công việc trong database; worker chủ động
nhận việc qua HTTPS, biên dịch local và gửi SVG về. Trang web cập nhật tiến độ
mỗi 10 giây. Nếu worker chưa bật, công việc ở trạng thái chờ. Nút **Dừng công
việc** ngăn các câu tiếp theo sau bước đang xử lý; lô có thể chạy lại, và
không ghi đè SVG đã có. Không mở hai worker với cùng tài khoản để tránh
tranh lô. Nếu máy tắt giữa lô, worker khác có thể nhận lại sau khi lease cũ
hết hạn; con trỏ chỉ tiến sau khi xử lý từng câu.

Sau khi bật lại máy, cần mở worker và đăng nhập lại. Script hỏi mật khẩu ADMIN
trong terminal; hiện chưa có chế độ chạy không tương tác vì không lưu mật khẩu
vào file hoặc tham số dòng lệnh.
Worker hỏi Render khoảng mỗi 10 giây khi chờ việc; trên gói Render Free điều
này có thể giữ dịch vụ luôn thức và tiêu thụ giờ chạy miễn phí. Chỉ bật worker
khi cần xử lý hình rồi tắt bằng Ctrl+C.

## Chạy thủ công / kiểm kê thử

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

## Sửa các câu biên dịch lỗi

Nếu LaTeX hoặc SVG lỗi, worker không gửi hình đó vào `question_images`. Giao
diện quản trị hiển thị mục **Các câu biên dịch hình bị lỗi**, gồm ID câu hỏi,
hash hình và thông báo chi tiết. Bấm **Sửa mã TikZ**, sửa trực tiếp rồi chọn
**Lưu & Đặt lại**. Mã mới được lưu vào câu hỏi, trạng thái trở về chưa dựng và
lỗi cũ được xoá; lần bấm **Quét và biên dịch** kế tiếp sẽ xử lý lại câu này.
