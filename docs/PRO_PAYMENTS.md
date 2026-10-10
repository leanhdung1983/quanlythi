# Tự động nâng cấp Pro khi chuyển khoản MB

## Bật trên máy chủ

1. Kết nối tài khoản MB nhận tiền với SePay: https://docs.sepay.vn/ket-noi-mb-api.html .
2. Thiết lập biến môi trường trên máy chủ (không đưa khóa vào mã nguồn):
   - `PAYMENT_ENABLED=1`
   - `PAYMENT_MB_ACCOUNT`: số tài khoản MB thực tế nhận tiền.
   - `PAYMENT_MB_ACCOUNT_NAME`: tên chủ tài khoản.
   - `SEPAY_WEBHOOK_KEY`: khóa ngẫu nhiên ít nhất 32 ký tự.
   - `PRO_STUDENT_PRICE=100000`, `PRO_TEACHER_PRICE=300000`: giá theo VND, có thể thay đổi.
3. Khởi động lại ứng dụng. Hai bảng InnoDB `pro_payment_orders`, `pro_payment_transactions` được tạo lúc khởi động; tài khoản cơ sở dữ liệu cần quyền CREATE TABLE. Có thể chạy SQL ở `migrations/20261010_pro_payments.sql` trước khi khởi động nếu tài khoản ứng dụng không có quyền này.
4. Trong SePay tạo webhook cho đúng tài khoản MB, sự kiện **Có tiền vào**, URL **https://TEN-MIEN-CUA-BAN/api/payments/sepay/webhook**, xác thực **API Key** với khóa giống `SEPAY_WEBHOOK_KEY`. Header được gửi là `Authorization: Apikey <khóa>`. Nếu lọc mã thanh toán, dùng tiền tố `ID6PRO`.
5. Thử bằng tài khoản thử nghiệm và giao dịch thử trước khi nhận thanh toán thật. Không gửi giao dịch giả vào hệ thống thật: thông báo đã xác thực có thể kích hoạt Pro.

## Sử dụng và đối chiếu

- Người dùng vào Hồ sơ cá nhân, bấm **Tạo mã thanh toán Pro**. Số tiền do máy chủ tính theo vai trò; mã ngẫu nhiên có hạn 24 giờ. Tạo lại trong thời hạn sẽ trả cùng yêu cầu còn chờ, cùng mức giá.
- Chuyển đúng số tiền, đúng tài khoản và nguyên nội dung mã trên QR. Hệ thống chỉ xử lý giao dịch tiền vào MB / MBBank gửi đúng khóa webhook.
- Sau khi nhận xác nhận hợp lệ, hệ thống cập nhật giao dịch, yêu cầu và tài khoản trong cùng một transaction. Tài khoản Pro còn hạn được cộng một năm từ hạn hiện có; tài khoản Free/hết hạn được cấp một năm từ thời điểm xác nhận.
- Trang Hồ sơ tự kiểm tra mỗi 5 giây khi còn mở và cập nhật hạn Pro khi yêu cầu được thanh toán. Khi mở lại trang, bấm tạo mã để lấy lại yêu cầu còn chờ hoặc **Kiểm tra trạng thái Pro** để lấy quyền hiện tại.
- Quản trị viên vào Quản trị người dùng, bấm **Xem / làm mới giao dịch Pro** để xem 200 giao dịch gần nhất. Giao dịch sai số tiền, không khớp mã, mã hết hạn, mã đã trả hoặc tài khoản bị xóa được ghi nhận nhưng không tự kích hoạt. Đối chiếu mã tham chiếu trên MB trước khi xử lý thủ công; không tự ghép giao dịch sai mã hoặc cộng dồn nhiều khoản nhỏ.
- Thông báo lặp có cùng ID SePay không cộng thêm hạn. Chuyển lần thứ hai vào cùng mã đã thanh toán cũng không tự gia hạn: tạo yêu cầu mới cho lần mua tiếp theo.
- Giao dịch ngoài tài khoản MB đã cấu hình hoặc tiền ra được bỏ qua. Lỗi DB trả lỗi để SePay gửi lại. Giữ nguyên khóa/tài khoản cấu hình trong lúc có yêu cầu chưa thanh toán.
- Nội dung kiểu cũ `ID6PRO tên_người_dùng` cần quản trị viên đối chiếu thủ công; chỉ mã mới do máy chủ tạo được tự động xử lý.

Tài liệu webhook: https://docs.sepay.vn/tich-hop-webhooks.html . Tính năng chỉ hoạt động trên hệ thống đã triển khai có HTTPS và đã kết nối SePay; sửa mã nguồn không tự tạo kết nối ngân hàng.
