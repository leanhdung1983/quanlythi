# SOURCE_AUDIT — QuanLyThi / EduLoop AI

Audit trước khi sửa, 06/10/2026. Source: C:/Users/HKC/Desktop/quanlythi; Git working tree sạch.

- Frontend: React 18 + TypeScript, Vite, Tailwind; App.tsx, Layout.tsx, AdaptiveTest.tsx, ClassManagement.tsx, IRTAnalysis.tsx. API cùng origin /api, cookie phiên.
- Backend: Express ES modules; server.js → api/index.js → routes/*.routes.js; api/core.js quản lý MySQL, seed schema, session và quyền lớp.
- Database: MySQL/mysql2. questions (legacy_full_id, unit_id, level_id, type_id, competencies, difficulty_index, discrimination_index); id6_metadata; grades/subjects/chapters/units/levels; exam_results (user_id, matrix_id, status, result_detail JSON chứa questions/answers, created_at); users; classes (teacher_id); class_students (student_id, status); class_assignments; lesson_sections/user_lesson_progress; activity_limits.
- Luồng adaptive: POST /api/adaptive/generate đọc kết quả COMPLETED, gom câu TN/KQ sai, tìm legacy_full_id cùng dạng, bổ sung RAND(), gọi Gemini viết nhận xét nếu có key. Frontend parse LaTeX, tạo phiên POST /api/exam/start rồi nộp POST /api/exam-results. Không có bảng adaptive riêng.
- IRT hiện có: GET /api/irt/analysis tính tỷ lệ sai theo câu và cảnh báo theo level; không thấy thuật toán CAT/theta hay hiệu chỉnh tham số IRT. Không diễn giải difficulty_index thành tham số b của IRT.
- Chấm điểm dùng api/scoring.js; TF có điểm từng phần, KQ chuẩn hóa số và đáp án thay thế. Adaptive cũ chưa xử lý TF và chuẩn hóa KQ giống bộ chấm.
- Bất cập: không có bản đồ lỗ hổng, mẫu bằng chứng, so sánh trước-sau hoặc duyệt giáo viên; intro có số liệu demo cố định (3 bài, 4 dạng, tiết kiệm 70%).

## Phương án bổ sung tương thích
Thêm module phân tích minh chứng, router /api/eduloop, trang /eduloop; tái sử dụng ID6 và snapshot bài thi. Một bảng mới eduloop_recommendations lưu đề xuất, baseline, thời điểm duyệt và nhật ký quyết định. Không sửa/xóa bảng cũ. Migration riêng idempotent. Giữ endpoint adaptive cũ; thêm recommendation_id tùy chọn để chạy kế hoạch APPROVED bằng giao diện thi hiện có. Tách kết quả chưa đủ mẫu, không suy diễn nguyên nhân sai hay tác động nhân quả. Tái sử dụng quyền lớp, kiểm tra thành viên APPROVED và quyền tự xem của học sinh.
