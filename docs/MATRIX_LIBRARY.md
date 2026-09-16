# Thư viện ma trận theo khối lớp

Vào **Ma trận / Tạo đề**. Danh sách bên trái được tổ chức theo khối đối tượng thi, sau đó theo mục đích đề. Có tìm kiếm theo tên/mã, bộ lọc người tạo, học kỳ, năm học, trạng thái, Đại số/Hình học và chương kiến thức.

## Phân loại

- Khối 10/11/12 là khối đối tượng làm đề, không nhất thiết là toàn bộ khối kiến thức trong đề.
- Đề tốt nghiệp có cả kiến thức 11 và 12 có thể đặt đối tượng Khối 12; thẻ ma trận vẫn hiển thị cả hai khối kiến thức.
- Chọn **Liên khối** khi dùng chung cho nhiều khối.
- Ma trận cũ chưa khai báo mục đích nằm trong **Chưa phân loại**. Không suy đoán mục đích bằng tên đề.
- **Bản nháp / Sẵn sàng sử dụng / Lưu trữ** chỉ là trạng thái biên tập. Không tự đổi quyền công khai, lịch giao bài hay trạng thái bài đã nộp.

## Thao tác

1. Bấm **Mở ma trận** để xem hoặc chỉnh sửa nội dung.
2. Bấm **Phân loại / cấu hình** để đặt khối, mục đích, năm học, học kỳ, trạng thái và cấu hình thi.
3. Để phân loại nhiều ma trận cũ, tích chọn từng ma trận hoặc chọn kết quả đang lọc; mở **Phân loại hàng loạt**, chọn thuộc tính cần đổi rồi xác nhận.

Phân loại hàng loạt giới hạn 100 ma trận/lần và chỉ cho phép ma trận của chính giáo viên (quản trị viên có quyền toàn bộ). Một lỗi bất kỳ sẽ rollback toàn bộ giao dịch. Không đổi ID, cấu trúc câu hỏi, cấu hình điểm, liên kết lớp hoặc lịch sử thi.

## Tương thích dữ liệu

Dữ liệu cũ dạng đối tượng, JSON chuỗi hoặc JSON bị mã hóa hai lần đều được đọc qua cùng bộ chuẩn hóa. Chỉ các ô có số câu lớn hơn 0 được tính vào phạm vi kiến thức. Khi không xác định được khối, ma trận nằm trong nhóm riêng để kiểm tra, không tự xếp theo ô đầu tiên.

Phân loại được lưu trong `matrix_data.catalog`; cấu trúc câu hỏi và cấu hình chấm điểm giữ ở `matrix` và `settings`. Cột `grade_id` lưu lớp thực tế (10/11/12), còn mã nội bộ ID6 0/1/2 được chuẩn hóa ở biên đọc/lưu. Không cần xóa hoặc tạo lại ma trận cũ.
