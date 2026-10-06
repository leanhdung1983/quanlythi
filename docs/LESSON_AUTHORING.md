# Soạn bài nhanh cho Học trực tuyến

## Luồng sử dụng

Chọn bài trong Học trực tuyến → **Soạn bài nhanh · AI** (hoặc **Thêm mục**) → dùng mẫu, nhập trực tiếp hoặc dán giáo án/Markdown/LaTeX → yêu cầu AI soạn bản nháp → xem đề xuất và áp dụng → chỉnh từng khối, xem trước → lưu bản nháp → xác nhận đã kiểm tra → **Duyệt & xuất bản**.

- Các khối: nội dung, công thức, ví dụ có lời giải, ghi nhớ/lỗi thường gặp, video YouTube và luyện tập bằng ma trận công khai.
- Không cần tự viết mã HTML tương tác. Nút định dạng hỗ trợ đậm, danh sách và công thức; nội dung vẫn lưu ở dạng Markdown/LaTeX tương thích bộ hiển thị cũ.
- AI có thể rút gọn, giải thích dễ hiểu hơn hoặc thêm ví dụ cho một khối; kết quả cần duyệt trước khi thay khối đang soạn.
- Yêu cầu AI giới hạn chờ 90 giây ở máy chủ, có nút **Dừng AI** và giữ nguyên nội dung khi lỗi. Dừng yêu cầu không đảm bảo Gemini hủy xử lý/tính phí phần đã gửi; hệ thống ngừng chờ và không tiếp tục thử model khác sau khi hủy.
- Dán tài liệu tối đa 40.000 ký tự. Tài liệu được gửi tới Gemini khi bấm AI; không dán dữ liệu cá nhân học sinh. Nhập file Word/PDF và OCR chưa nằm trong phiên bản này.
- Bản nháp được lưu riêng theo giáo viên trên DB, có phiên bản để tránh hai tab ghi đè. Trình duyệt lưu dự phòng nội dung đang gõ; bấm **Lưu bản nháp** để sử dụng trên máy khác. Tài liệu nguồn/yêu cầu AI chỉ được lưu dự phòng tại trình duyệt, không nằm trong bản nháp máy chủ.
- Xuất bản thêm các mục vào bài học dùng chung, không thay/xóa các mục hoặc tiến độ cũ. Xuất bản lại cùng bản nháp không nhân đôi nội dung. Bài đã xuất bản có thể sao chép làm bản nháp mới; sửa/xóa các mục hiện có vẫn theo quyền quản trị viên.
- Ma trận gắn vào bài phải công khai để học sinh truy cập. Nếu chưa có ma trận, không thêm khối luyện tập; bài vẫn có mục **Bài tập vận dụng** theo ngân hàng của bài.
- Nội dung mới hiển thị được trong EduLoop, gồm công thức, video và nút luyện theo ma trận. Phần tự kiểm tra trong bài học dùng bộ đọc câu hỏi và đối chiếu TN/TF/KQ có sẵn, chỉ mở đáp án/lời giải sau khi học sinh bấm kiểm tra; tự luận cần đối chiếu thủ công. Kết quả tự kiểm tra hiện không ghi vào điểm kiểm tra chính thức hoặc hồ sơ adaptive.

## Cơ sở thiết kế

Hướng dẫn [IES/What Works Clearinghouse](https://ies.ed.gov/ncee/wwc/PracticeGuide/1) đề xuất xen kẽ ví dụ có lời giải với bài tập giải quyết vấn đề và sử dụng câu hỏi truy hồi kiến thức. Mẫu bài học vì vậy có kiến thức ngắn, ví dụ theo bước, ghi nhớ/lỗi thường gặp và luyện tập. Đây là định hướng thiết kế, không phải cam kết hiệu quả học tập của tính năng.

[Gemini structured outputs](https://ai.google.dev/gemini-api/docs/generate-content/structured-output) cho phép yêu cầu cấu trúc JSON theo schema. Backend vẫn kiểm tra loại khối, độ dài và cấu trúc khi nhận kết quả: JSON đúng cấu trúc không đồng nghĩa kiến thức đúng. AI không sinh HTML/JavaScript, video hoặc ID ma trận và không tự xuất bản.

## Cài đặt và kiểm tra

Chạy `node scripts/migrate-lesson-authoring.mjs` với cấu hình `.env`. Migration chỉ tạo bảng `lesson_authoring_drafts`, không sửa dữ liệu bài học. Seed mới cũng tạo bảng này; `database.sql` đã được cập nhật.

API mới dưới `/api/lesson-authoring`: giáo viên/quản trị viên tạo và quản lý bản nháp của chính mình, gọi AI và xuất bản. API AI cũ `/admin/ai/generate-lesson-sections` trả 410 để không còn ghi thẳng nội dung AI vào bài. Không cache API đọc bài học theo URL dùng chung, tránh bỏ qua kiểm tra quyền và hiển thị nội dung cũ sau xuất bản.

Giao diện kiểm thử bằng dữ liệu giả tại `/tests/fixtures/lesson-composer.html` khi chạy Vite. Fixture chặn mọi yêu cầu mạng ngoài các phản hồi giả lập, không gọi Gemini hoặc xuất bản vào DB thật. Kiểm thử thực với Gemini cần khóa đã cấu hình; nội dung AI luôn cần giáo viên kiểm tra chuyên môn.

Xuất bản dùng transaction, khóa bản nháp và bài học, kiểm tra phiên bản và ma trận công khai trước khi thêm nội dung. Lỗi ở bất kỳ khối nào rollback toàn bộ; bản nháp chưa xuất bản vẫn được giữ.
