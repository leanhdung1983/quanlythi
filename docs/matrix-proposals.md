# Đề xuất và xuất ma trận

## Tạo bản nháp

- Nút **AI đề xuất** trong mỗi bài mở bản nháp 12 câu, mặc định chi tiết từng dạng.
- Có thể chọn 1–100 câu, mục tiêu cơ bản/cân đối/vận dụng và phân bổ theo dạng hoặc tổng quát theo bài, rồi tạo lại.
- Chỉ sử dụng câu công khai hoặc câu thuộc giáo viên đang đăng nhập, có ID6 hợp lệ và loại TN/TF/KQ. AI được cung cấp tên dạng trong danh mục cùng số câu theo mức độ thực có.
- Yêu cầu AI có giới hạn 35 giây, từng lần gọi dịch vụ có giới hạn 20 giây. Nút Dừng hoặc đóng cửa sổ hủy yêu cầu; trình duyệt có giới hạn chờ riêng 55 giây để xử lý sự cố kết nối.
- Khi thiếu API key, AI lỗi, trả sai cấu trúc/số câu hoặc quá thời gian, hệ thống trả bản nháp phân bổ theo ngân hàng, kèm thông báo nguồn. Nút **Tự phân bổ theo ngân hàng** không gọi AI.
- Số câu được giới hạn theo khả năng ngân hàng; không bổ sung câu từ bài khác. Giáo viên phải kiểm tra số câu và điểm trước khi áp dụng/lưu. Tạo đề xuất không tự lưu hay giao bài.

## Xuất ma trận tổng quát theo bài

Các khóa kết thúc `-*` vẫn được lưu và dùng để chọn dạng ngẫu nhiên khi tạo đề. Khi xuất Word hoặc LaTeX, hệ thống chia số câu theo từng dạng có trong danh mục và số câu theo loại/mức độ, ưu tiên phủ nhiều dạng trước khi lặp lại.

Phân bổ xuất được đánh dấu **phân bổ dự kiến**, có tên dạng và năng lực tương ứng; không khẳng định đây là các dạng cố định của mọi lượt đề. Số câu đã chọn riêng theo dạng được trừ khỏi khả năng phân bổ để tránh đếm trùng. Tổng số câu từng phần và mức độ không thay đổi. Nếu thiếu dữ liệu hoặc câu phù hợp, phần còn lại hiển thị rõ **chưa đủ dữ liệu phân bổ chi tiết**.

Bảng ma trận tổng hợp liệt kê các dạng dự kiến trong cột nội dung. Bảng đặc tả có từng dòng dạng và số câu theo mức độ. Word dùng trang ngang để phù hợp bảng nhiều cột.
