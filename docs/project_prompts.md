# Tổng hợp Prompt xây dựng Hệ thống Ngân hàng Câu hỏi ID6

Dưới đây là chuỗi các prompt (câu lệnh) chi tiết để bạn có thể yêu cầu AI (như Claude, GPT-4, hoặc Gemini) xây dựng lại toàn bộ dự án "Hệ thống Ngân hàng Câu hỏi ID6" từ đầu.

---

## Giai đoạn 1: Khởi tạo dự án & Thiết lập Cơ sở dữ liệu

**Prompt 1: Khởi tạo dự án và Backend cơ bản**
> "Hãy tạo cho tôi một dự án Full-stack với React (Vite, TypeScript, Tailwind CSS) ở frontend và Node.js (Express) ở backend. 
> 1. Thiết lập `server.js` (hoặc `api/index.js`) chạy trên cổng 3000, phục vụ API và Vite middleware trong môi trường dev.
> 2. Sử dụng MySQL làm cơ sở dữ liệu (tạo file `database.sql` chứa cấu trúc các bảng: `users`, `questions`, `matrices`, `exam_results`, `metadata`, `question_types`, v.v.).
> 3. Cấu hình kết nối DB bằng `mysql2/promise` và đọc biến môi trường từ `.env`."

---

## Giai đoạn 2: Xác thực Người dùng (Authentication)

**Prompt 2: Đăng nhập và Phân quyền**
> "Thêm tính năng đăng nhập và quản lý trạng thái người dùng (Zustand hoặc Context API). 
> 1. Xây dựng API `/api/auth/login` (chưa cần mã hóa mật khẩu phức tạp nếu chạy nội bộ, hoặc dùng bcrypt) trả về thông tin user.
> 2. Có 3 Role: `ADMIN`, `TEACHER`, `STUDENT`. 
> 3. Tạo màn hình Login với thiết kế UI hiện đại bằng Tailwind CSS.
> 4. Tạo Sidebar Navigation thay đổi menu tùy theo role của user."

---

## Giai đoạn 3: Phân tích và Hiển thị LaTeX (Parser & MathRenderer)

**Prompt 3: Xử lý LaTeX và MathJax / KaTeX**
> "Tạo một component `MathRenderer` bằng React để hiển thị công thức toán học LaTeX.
> 1. Hỗ trợ các môi trường như `\begin{ex}...\end{ex}`, `\choice`, `\loigiai{...}`.
> 2. Tạo một file `parser.ts` để phân tích file text chứa nhiều câu hỏi LaTeX, trích xuất ID câu hỏi, dạng câu hỏi (Trắc nghiệm, Tự luận, Đúng/Sai, Trả lời ngắn).
> 3. Nhận dạng cấu trúc ID6: `[Lớp][Môn][Chương][Mức độ][Bài]-[Dạng]` (ví dụ: `[12D1H2-1]`)."

---

## Giai đoạn 4: Quản lý Ngân hàng Câu hỏi (Question Bank)

**Prompt 4: Giao diện và API Ngân hàng câu hỏi**
> "Xây dựng trang Quản lý Ngân hàng câu hỏi (`QuestionBank.tsx`).
> 1. Tạo API lấy danh sách câu hỏi có phân trang, lọc theo Khối, Môn, Chương, Bài, Mức độ, Loại câu hỏi, Trạng thái ID (lỗi/chưa phân loại) và thanh tìm kiếm.
> 2. Frontend sử dụng table hoặc grid để hiển thị, tích hợp `MathRenderer` để xem trước nội dung LaTeX.
> 3. Tính năng chỉnh sửa nhanh (inline edit) mã LaTeX và lưu trực tiếp xuống CSDL."

---

## Giai đoạn 5: Công cụ Gán ID hàng loạt (ID Assigner)

**Prompt 5: Giao diện Gán ID thông minh**
> "Xây dựng màn hình `IdAssigner.tsx` giúp giáo viên gán ID cho câu hỏi hàng loạt.
> 1. Cho phép tải file .tex hoặc dán text LaTeX thủ công. Hoặc tải câu hỏi chưa có ID từ CSDL.
> 2. Phân tích nội dung, tách thành từng câu. Ở sidebar hiển thị danh sách các câu đã tách.
> 3. Ở vùng làm việc chính, cho phép chọn cấp độ: Khối -> Môn -> Chương -> Bài -> Dạng -> Mức độ, và tự động nối thành ID chuẩn.
> 4. Tính năng 'Áp dụng hàng loạt' (Batch Apply) cho tất cả các câu trong file. Cuối cùng, có nút 'Lưu vào CSDL'."

---

## Giai đoạn 6: Sinh Đề Thi và Ma trận (Exam Generator)

**Prompt 6: Thiết kế Ma trận & Sinh đề thi**
> "Xây dựng trang `ExamGenerator.tsx` dành cho Giáo viên.
> 1. Cho phép giáo viên kéo thả hoặc nhập số lượng câu hỏi cần lấy cho từng Dạng và Mức độ (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao) thuộc từng phần (Trắc nghiệm, Đúng sai, Trả lời ngắn, Tự luận).
> 2. API backend nhận JSON ma trận này, random truy xuất các câu hỏi khớp ID từ CSDL (tối ưu truy vấn tránh table scan).
> 3. Lưu trữ ma trận vào bảng `matrix_templates` để dùng lại sau này.
> 4. Xuất đề thi ra dạng file Word hoặc PDF (LaTeX biên dịch)."

---

## Giai đoạn 7: Học trực tuyến và Làm bài thi (Online Learning & Exam)

**Prompt 7: Giao diện làm bài Online cho Học sinh**
> "Xây dựng tính năng Học tập (`Learning.tsx`) và Thi trực tuyến (`OnlineExam.tsx`).
> 1. Học sinh có thể chọn một Ma trận (đã lưu) để tạo bài luyện tập động (`DynamicPractice.tsx`).
> 2. Component làm bài thi hiển thị câu hỏi chia theo nhóm (Trắc nghiệm nhiều lựa chọn, Đúng/Sai, Điền khuyết).
> 3. Có đồng hồ đếm ngược. Khi nộp bài sẽ chấm điểm, hiển thị câu đúng/sai, số điểm đạt được và lời giải chi tiết (`\loigiai`).
> 4. Lưu kết quả thi vào bảng `exam_results`."

---

## Giai đoạn 8: Các tính năng nâng cao (AI & Tiện ích)

**Prompt 8: Tích hợp AI Converter (PDF/Word sang LaTeX)**
> "Tạo một trang `Converter.tsx` cho phép người dùng cấu hình Gemini API Key.
> 1. Người dùng upload file Word (.docx) hoặc PDF.
> 2. Đọc nội dung file, gửi lên Gemini API (dùng SDK `@google/genai`) yêu cầu chuyển đổi sang định dạng LaTeX chuẩn ID6.
> 3. Hiển thị kết quả LaTeX trả về và cho phép đẩy thẳng vào Ngân hàng."

**Prompt 9: Phát hiện câu hỏi trùng lặp & Render TikZ**
> "Thêm trang Quản lý Trùng lặp (`DuplicateManager.tsx`) và Render ảnh (`TikZBatchRenderer.tsx`).
> 1. Quản lý trùng lặp: Ở backend, khi thêm câu hỏi, tự động chuẩn hóa chuỗi LaTeX (bỏ khoảng trắng, comment) và mã hóa SHA-256. API tìm các câu có cùng Hash.
> 2. TikZ Renderer: Gọi backend chạy Python subprocess để dịch mã TikZ sang ảnh PNG/SVG (hoặc gọi API bên ngoài), hiển thị thay thế cho mã TikZ trên UI."

---
*Lưu ý: Các prompt này mang tính chất định hướng kiến trúc tổng thể. Khi xây dựng thực tế, bạn có thể gửi từng prompt một và yêu cầu AI tinh chỉnh, sửa lỗi dần dần cho đến khi hoàn thiện.*
