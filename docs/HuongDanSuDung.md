# Hướng dẫn sử dụng Hệ thống Quản lý Học tập và Khảo thí

Tài liệu này hướng dẫn chi tiết cách sử dụng các chức năng trên hệ thống dành cho 3 nhóm đối tượng: **Học sinh**, **Giáo viên** và **Quản trị viên (Admin)**.

---

## 1. Giới thiệu chung và Phân quyền Tài khoản

### Các loại tài khoản
- **Tài khoản Miễn phí (Free - Học sinh):** Cho phép truy cập vào các chức năng ôn luyện, làm bài thi trực tuyến, thi thích ứng và xem thống kê kết quả học tập cá nhân.
- **Tài khoản Pro (Giáo viên / Chuyên gia):** Bao gồm toàn bộ tính năng của tài khoản Free, được cấp thêm quyền tạo đề thi, quản lý ngân hàng câu hỏi, ma trận đề thi và các công cụ hỗ trợ chuẩn hoá dữ liệu (Converter, Render hình vẽ).
- **Tài khoản Quản trị viên (Admin):** Toàn quyền kiểm soát hệ thống, quản lý người dùng, cấu hình dữ liệu chuẩn, duyệt lỗi và phân tích chất lượng câu hỏi.

### Cách đăng ký và nâng cấp tài khoản Pro
1. **Đăng ký:** Người dùng truy cập trang Đăng nhập/Đăng ký để tạo tài khoản mới. Mặc định tài khoản tạo mới sẽ là tài khoản Miễn phí (Học sinh).
2. **Nâng cấp Pro:** Để nâng cấp lên tài khoản Giáo viên (Pro), người dùng cần liên hệ với Quản trị viên (Admin) của nhà trường/trung tâm để được xét duyệt và cấp quyền trên hệ thống, hoặc sử dụng mã kích hoạt (nếu có).

---

## 2. Hướng dẫn dành cho Học sinh (Tài khoản Free)

1. **Dashboard (Bảng điều khiển):**
   - Xem tổng quan các bài tập, kỳ thi sắp tới và tiến độ học tập cá nhân.

2. **Learning (Học tập & Ôn luyện):**
   - Truy cập vào các chuyên đề học tập, xem tài liệu, bài giảng và làm các bài tập tự luyện theo từng dạng toán/chủ đề.

3. **Online Exam (Thi trực tuyến):**
   - Tham gia vào các kỳ thi chính thức hoặc bài kiểm tra do giáo viên giao.
   - Hệ thống đếm ngược thời gian làm bài, tự động nộp bài khi hết giờ và cung cấp kết quả/đáp án chi tiết (nếu giáo viên cho phép).

4. **Adaptive Test (Thi trắc nghiệm thích ứng):**
   - Làm bài thi thông minh: Hệ thống sẽ tự động điều chỉnh độ khó của câu hỏi tiếp theo dựa trên việc bạn trả lời đúng hay sai ở câu hỏi trước đó. Giúp đánh giá chính xác năng lực thực tế.

5. **User Profile (Hồ sơ cá nhân):**
   - Thay đổi thông tin cá nhân, mật khẩu.
   - Xem lại lịch sử các bài thi đã làm và theo dõi biểu đồ tiến bộ.

---

## 3. Hướng dẫn dành cho Giáo viên (Tài khoản Pro)

Tài khoản Giáo viên có đầy đủ quyền hạn của Học sinh, kèm theo các công cụ nghiệp vụ sau:

1. **Question Bank (Ngân hàng câu hỏi):**
   - Thêm mới, chỉnh sửa, xóa và quản lý danh sách các câu hỏi.
   - Lọc câu hỏi theo khối lớp, môn học, chương, bài, độ khó (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) và dạng câu hỏi.

2. **Exam Generator (Tạo đề thi & Ma trận):**
   - **Tạo ma trận:** Chọn cấu trúc đề thi bằng cách điền số lượng câu hỏi cho từng mức độ khó của từng dạng bài/chủ đề.
   - Hệ thống tính toán tổng số điểm và tổng số câu hỏi. (Lưu ý: Sau khi ấn *Lưu ma trận*, các ô đếm số lượng sẽ tự động reset về 0 để bạn có thể lên một cấu trúc mới).
   - Tự động bốc ngẫu nhiên câu hỏi từ Ngân hàng dựa trên ma trận đã thiết lập để tạo thành đề thi hoàn chỉnh.
   - Xuất đề thi ra định dạng file Word (.docx) hoặc LaTeX.

3. **Converter (Công cụ chuyển đổi):**
   - Hỗ trợ biên dịch, chuyển đổi định dạng các file tài liệu/câu hỏi thô sang chuẩn đầu vào của hệ thống.

4. **TikZ Batch Renderer (Công cụ render hình vẽ):**
   - Tự động biên dịch hàng loạt các đoạn code vẽ hình TikZ trong Toán học/Vật lý thành hình ảnh, giúp tối ưu hiển thị trên nền tảng web mà không bị vỡ nét.

---

## 4. Hướng dẫn dành cho Quản trị viên (Admin)

Admin là người vận hành và kiểm soát chất lượng hệ thống, bao gồm các chức năng:

1. **Admin Users (Quản lý người dùng):**
   - Duyệt tài khoản, thay đổi phân quyền (nâng cấp Học sinh lên Giáo viên, hoặc giáng quyền).
   - Quản lý trạng thái hoạt động của người dùng (Khóa/Mở khóa tài khoản).

2. **Metadata Manager (Quản lý cấu trúc dữ liệu):**
   - Thiết lập cây thư mục kiến thức: Khối lớp -> Môn học -> Chương -> Bài -> Dạng bài.
   - Các giáo viên sẽ dựa vào chuẩn Metadata này để gắn thẻ (tag) cho câu hỏi của mình.

3. **Id Assigner (Gán ID tự động):**
   - Quét các câu hỏi mới được đưa vào hệ thống và tự động cấp phát mã định danh (ID) chuẩn theo quy tắc cấu trúc Metadata.

4. **Duplicate Manager (Quản lý trùng lặp):**
   - Quét và phát hiện các câu hỏi có nội dung giống hoặc gần giống nhau trong hệ thống để Admin xử lý (giữ lại hoặc xóa bớt), đảm bảo sự sạch sẽ của Ngân hàng câu hỏi.

5. **Error Manager (Quản lý báo lỗi):**
   - Tiếp nhận các báo cáo lỗi từ Học sinh/Giáo viên (như sai đề, sai đáp án, lỗi công thức). Admin có thể xem xét, chỉnh sửa trực tiếp và đóng cảnh báo lỗi.

6. **IRT Analysis (Phân tích thông số IRT):**
   - Sử dụng Lý thuyết Khảo thí Hiện đại (Item Response Theory) để đánh giá câu hỏi (độ khó, độ phân biệt, độ đoán mạt) dựa trên dữ liệu hàng ngàn lượt làm bài của học sinh. Giúp Admin loại bỏ các câu hỏi quá khó hoặc câu hỏi lỗi.

7. **Dashboard (Bảng điều khiển Admin) & Source Viewer:**
   - Theo dõi số liệu tổng quan của toàn hệ thống (số người dùng, số câu hỏi, lưu lượng sử dụng).
   - Xem nhanh các source code/cấu hình máy chủ nếu có quyền System Admin.
