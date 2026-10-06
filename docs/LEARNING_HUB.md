# Không gian học tập mới

## Luồng sử dụng

- Học sinh: Thư viện → lọc khối/môn, tìm tên bài → mở bài → đọc kiến thức, ví dụ, video hoặc hoạt động → đánh dấu đã học → luyện tập tại chỗ.
- Vị trí đọc được nhớ riêng theo tài khoản trên trình duyệt; tiến độ hoàn thành lưu trên máy chủ. Nếu mục cũ không còn tồn tại, mở mục đầu tiên chưa học.
- Luyện tập tự kiểm tra dùng câu công khai/câu của chính người dùng, hoặc ma trận đã gắn. Đáp án và lời giải chỉ mở sau khi kiểm tra. Không ghi điểm kiểm tra chính thức hoặc bằng chứng năng lực EduLoop.
- Nút EduLoop mở luồng ôn cá nhân/adaptive hiện có; không tạo thêm bộ adaptive riêng.
- Giáo viên: Studio giáo viên → chọn bài → soạn theo mẫu hoặc nhờ AI → kiểm tra → lưu nháp riêng → xuất bản. Có thể sửa văn bản các mục mình đã xuất bản; quản trị viên sửa nội dung dùng chung.
- Quản trị viên thêm chương/bài vào cấu trúc hiện có. Mã lớp cũ 0/1/2 được hiển thị đúng thành 10/11/12.

## Dữ liệu và quyền

Không xóa hay tạo lại chương, bài, mục kiến thức, ma trận, bản nháp và tiến độ. Giữ ID các mục cũ, video, HTML tương tác và liên kết ma trận. Trình sửa mục chỉ cập nhật tiêu đề/nội dung, không thay các liên kết hoặc tiến độ.

API mới `/api/learning/catalog`, `/api/learning/units/:id`, `/api/learning/sections/:id` dùng phiên đăng nhập hiện có. Tiến độ và bản nháp trong thư viện là của tài khoản hiện tại. Quyền sửa của giáo viên dựa trên danh sách mục đã xuất bản trong bản nháp của chính mình, không dựa vào dữ liệu phía trình duyệt.

Quyền học miễn phí giữ chính sách cũ: bài đầu mỗi chương; Pro học toàn bộ. Kiểm tra thống nhất ở API nội dung, API tiến độ và API luyện tập, kể cả gọi URL trực tiếp. POST tiến độ bỏ qua `user_id` gửi lên và dùng tài khoản đã đăng nhập. iframe cũ giữ sandbox chỉ chạy script; sự kiện hoàn thành phải đến từ chính iframe đang hiển thị.

Không cần migration mới. Cần bảng `lesson_authoring_drafts` đã được bổ sung trong chức năng soạn bài nhanh trước đó (`scripts/migrate-lesson-authoring.mjs`).

## Kiểm thử

`npm test` kiểm tra điều hướng, quyền Pro, quyền sửa, lưu tiến độ và các tính năng cũ. `npm run build` kiểm tra TypeScript và bản sản xuất.

`node scripts/check-learning-hub.mjs` chỉ đọc DB từ `.env`, thực thi chính truy vấn thư viện mới, báo số lượng tổng hợp và thời gian; không in thông tin kết nối/khóa và không import mô-đun khởi động có seed DB.

`tests/fixtures/learning-hub.html` là bản thử giao diện dùng dữ liệu giả; chặn toàn bộ yêu cầu mạng ngoài các tình huống được giả lập. Không phải màn hình sản xuất, không ghi DB hay gọi AI thật.
