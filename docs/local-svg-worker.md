# Biên dịch SVG bằng máy local

Máy cần Python, `pdflatex` và `dvisvgm` (hoặc `pdf2svg`) trong PATH. Bộ style `template/ex_test.sty` đi kèm dự án phải có mặt.

Sau khi cập nhật mã nguồn, khởi động lại worker bằng bản mới:

```powershell
python scripts/tikz_local_worker.py --url https://quanlythi.onrender.com --daemon
```

Đăng nhập bằng tài khoản quản trị. Worker không lưu mật khẩu. Vào **Mã nguồn & SVG → Quét và biên dịch SVG bằng máy local**, rồi bấm **Quét và biên dịch**. Nếu dịch vụ dùng địa chỉ khác, thay URL trong lệnh bằng địa chỉ dịch vụ thực tế.

Có thể đóng trang web; máy local và worker phải tiếp tục chạy. Máy tắt/ngủ thì biên dịch tạm dừng. Khi mở lại worker, lô chưa hoàn tất có thể được nhận lại sau khi quyền của worker cũ hết hạn (10 phút không có heartbeat).

Worker giữ heartbeat riêng trong lúc TeX, AI và tải SVG đang làm việc. Khi mất mạng hoặc dịch vụ tạm lỗi, worker thử kết nối lại với khoảng chờ tăng dần, tối đa 60 giây; không đánh dấu lô thất bại chỉ vì đã thử ba lần. Mỗi lần tiếp tục, worker đọc con trỏ đã lưu trên server, kể cả khi phản hồi lưu tiến độ bị mất.

Mỗi hình có giới hạn thời gian cho từng bước biên dịch (mặc định 90 giây). Tiến trình bị treo và các tiến trình con được dừng trước khi xử lý hình tiếp theo. Có thể dùng `--timeout 180` nếu máy chậm hoặc hình phức tạp. Mặc định biên dịch hai hình song song; dùng `--workers 1` nếu máy ít bộ nhớ.

Hình đã có SVG hợp lệ được bỏ qua. Lỗi kết nối/lưu dữ liệu không được gửi sang AI như lỗi TeX. Hình lỗi TeX được thử sửa bằng AI một lần nếu có API key hợp lệ, rồi biên dịch lại và lọc SVG trước khi lưu. Hình vẫn lỗi được ghi vào **Các câu biên dịch hình bị lỗi** và báo cáo `output/tikz_worker_errors.json`; các câu khác tiếp tục được xử lý. Mã hình thiếu nguồn, thiếu định nghĩa riêng hoặc không phải TikZ cần bổ sung/sửa nguồn; worker không tự bịa hình thay thế.

Kiểm thử không kết nối database thật:

```powershell
python -m unittest scripts.test_tikz_local_worker
```
