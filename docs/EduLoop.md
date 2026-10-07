# Bàn giao EduLoop AI / QuanLyThi Adaptive

EduLoop được tích hợp vào hệ thống hiện có mà không đổi tên nội bộ hoặc viết lại các luồng cũ.

## Đã tích hợp
- Trang mới /#/eduloop, menu “EduLoop · Kỹ năng” trên desktop và mobile.
- Learning Gap Map theo lớp hoặc học sinh, nhóm ID6 với chương, bài, dạng/kỹ năng và mức độ; hiển thị số lượt, tỷ lệ đúng, số học sinh cần ôn và các bài/câu làm bằng chứng. Dùng description trong id6_metadata nếu có; dạng ID6 là đại diện kỹ năng, chưa phải ontology kỹ năng độc lập.
- Chỉ dùng bài COMPLETED có snapshot questions/answers. Chuẩn hóa KQ theo bộ chấm hiện có, TF có tín dụng từng phần; loại TL chưa chấm, dữ liệu JSON lỗi và ID6 thiếu. Dưới 3 lượt: chưa đủ mẫu. Đề xuất ưu tiên dạng dưới 70%, tối đa 4 dạng và 10 câu, không trộn ngẫu nhiên vào kế hoạch duyệt. Mỗi câu có lý do và tối đa 20 minh chứng gần nhất.
- Giáo viên chọn lớp/học sinh, tạo đề xuất PENDING, đọc lý do rồi APPROVED/REJECTED kèm ghi chú. Lưu người tạo, người duyệt, mốc duyệt và baseline. Quyết định đã lưu không bị ghi đè; muốn điều chỉnh cần tạo đề xuất mới. Kế hoạch tự động dựa trên quy tắc minh chứng, không cần Gemini API key.
- Học sinh tải kế hoạch APPROVED và làm bài trong AdaptiveTest hiện có. Backend kiểm tra chủ sở hữu, lớp đã duyệt, trạng thái duyệt và câu hỏi hiện còn được phép dùng. Nếu nội dung/ID6 thay đổi sau khi tạo kế hoạch, yêu cầu tạo và duyệt lại.
- Progress Tracking theo ID6 trước/sau thời điểm duyệt, số mẫu mỗi phía và chênh lệch điểm phần trăm; chỉ tính delta khi mỗi phía có ít nhất 3 lượt. Đây là so sánh quan sát, không chứng minh tác động nhân quả. Bao gồm mọi bài hoàn thành cùng ID6, không chỉ bài EduLoop. Mốc thời gian lấy created_at của bài thi (thời điểm tạo phiên).
- Endpoint adaptive cũ vẫn hoạt động, giữ trường success/data/ai_analysis; thêm evidence và approval. Sửa nhận diện TF/KQ để nhất quán bộ chấm; đánh dấu câu ngẫu nhiên không có bằng chứng. Giữ phần nhận xét Gemini cũ; nhận xét đó là gợi ý cần giáo viên xem xét.
- IRTAnalysis và difficulty_index/discrimination_index hiện có được giữ. Audit chưa thấy CAT/theta thực; kế hoạch mới không quảng bá tỷ lệ đúng thành năng lực IRT.

## File sửa
- api/index.js — gắn router mới dưới middleware phiên hiện có.
- api/routes/ai.routes.js — nhận recommendation_id tùy chọn; bổ sung bằng chứng adaptive cũ và chấm đúng TF/KQ.
- src/App.tsx — route /eduloop.
- src/components/Layout.tsx — menu mới.
- src/pages/AdaptiveTest.tsx — tải kế hoạch duyệt, hiển thị lý do, liên kết tiến độ; bỏ số liệu demo cố định.
- src/services/api.ts — nối API EduLoop và tham số đề xuất tùy chọn.

## File thêm
- api/eduloop.js — phân tích, nhóm ID6 và lựa chọn câu hỏi.
- api/routes/eduloop.routes.js — phân quyền, đề xuất, quyết định và tiến độ.
- api/eduloop.test.js; api/eduloop.routes.test.js — kiểm thử minh chứng và quyền duyệt.
- src/pages/EduLoop.tsx
- migrations/20261006_eduloop.sql
- scripts/migrate-eduloop.mjs
- docs/EduLoop.md — bản hướng dẫn này trong project.

## Chạy
### Học sinh mới và ôn theo dạng

Học sinh chưa có lịch sử vẫn được chọn khối lớp, bài học và từng dạng có câu hỏi trong mục **Bắt đầu ôn từng dạng của bài**. Danh sách chỉ là gợi ý theo chương trình; không tạo tỷ lệ đúng, minh chứng hay kết luận năng lực giả. Sau khi nộp bài, kết quả thực tế được đưa vào bản đồ kỹ năng.

`GET /api/eduloop/practice-catalog` đọc ngân hàng chung đã đăng nhập, cùng phạm vi dữ liệu với `/questions` và tạo đề thi. Không dùng `is_public` để loại ngân hàng nhập cũ vì cờ này hiện mặc định 0. Không cập nhật cờ công khai hay dữ liệu câu hỏi trong database.

`POST /api/adaptive/generate` nhận mã kỹ năng ID6 (giữ đúng mức độ) hoặc khóa dạng `2-D-1-1-1` (gộp các mức trong cùng dạng). Truy vấn nhận mã cũ/khối 10–12, sau đó xác nhận lại phạm vi bằng bộ chuẩn hóa ID6. Chỉ dùng TN/TF/KQ, không chèn câu từ dạng khác khi thiếu. Nếu chưa có lịch sử và chưa chọn dạng, API yêu cầu chọn dạng thay vì tạo bài ngẫu nhiên không có căn cứ. Việc tải câu không phụ thuộc Gemini.

Tài khoản miễn phí vẫn có hạn mức hai lượt tự ôn mỗi ngày. Chỉ ghi nhận lượt sau khi có đề hợp lệ; yêu cầu sai mã, không có câu hoặc yêu cầu chọn dạng không bị trừ. Phép cập nhật hạn mức có điều kiện để xử lý các yêu cầu đồng thời. Lượt đã bị trừ bởi phiên bản cũ không được tự sửa vì không có nhật ký đủ để xác định từng lần thất bại. Kế hoạch giáo viên duyệt giữ nguyên kiểm tra chủ sở hữu, thành viên lớp và trạng thái duyệt.

### AI đề xuất ma trận bài học

Giáo viên mở bài trong Học trực tuyến → AI đề xuất ma trận; hoặc mở Học lại trong EduLoop rồi chọn AI đề xuất ma trận cho bài đó. Cần cấu hình Gemini API Key. AI đọc nội dung bài học và số câu được phép dùng theo ID6, loại TN/TF/KQ và mức N/H/V/C; đề xuất được kiểm tra để không vượt số câu sẵn có hoặc đưa dạng ngoài bài vào ma trận.

Giáo viên chỉnh tên, số câu, thời gian và tổng điểm các phần (tổng bằng 10), rồi chọn Đã kiểm tra · Lưu ma trận. Trước bước này không ghi dữ liệu. Ma trận được lưu vào thư viện hiện có với nguồn bài học; không tự thay ma trận đã giao hoặc tự giao cho lớp. Bài chưa có câu hỏi phù hợp hoặc chưa có API Key sẽ báo rõ thay vì tạo dữ liệu giả.

Trong thư mục project, cấu hình kết nối DB đang dùng vào .env (tham khảo .env.example): DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME. Không nhập mật khẩu vào chat.

```powershell
cd C:\Users\HKC\Desktop\quanlythi
node scripts/migrate-eduloop.mjs
npm run dev
```

Migration chỉ CREATE TABLE IF NOT EXISTS eduloop_recommendations; không ALTER/DROP bảng cũ, không backfill kết quả. Chạy lại an toàn; cần quyền CREATE và REFERENCES trên DB hiện tại. Script không import core.js nên không chạy seed ngoài ý muốn. Nếu chưa migration, dữ liệu đề xuất trả thông báo cần migration; ôn tập cũ và Gap Map từ bảng cũ vẫn hoạt động.

Mở http://localhost:3000/#/eduloop (hoặc port đã cấu hình). Giáo viên chọn lớp và học sinh → Tải bản đồ → Tạo đề xuất → đọc minh chứng → Duyệt. Học sinh vào EduLoop → Ôn tập kế hoạch đã duyệt → nộp qua bộ chấm cũ → xem tiến độ. Hạn mức bắt đầu bài thi của tài khoản miễn phí vẫn áp dụng theo hệ thống cũ. Tải câu từ kế hoạch giáo viên duyệt không trừ review_count của tự luyện.

```powershell
npm test
npm run build
```

## Kiểm chứng và giới hạn
- Toàn bộ bộ kiểm thử: 200 tests/31 files đã qua, gồm 8 kiểm thử EduLoop trước lần tinh chỉnh cuối; kết quả cuối xem VERIFICATION.md.
- TypeScript + Vite production build đã qua.
- Runtime production server/import: GET /api/ping = 200; GET / = 200; GET /api/eduloop/map chưa đăng nhập = 401. Server kiểm tra đã tự dừng.
- Ngày 06/10/2026: kết nối thành công DB TiDB từ `.env`, chạy migration EduLoop thành công hai lần. Đã xác nhận bảng `eduloop_recommendations` có đủ 11 cột, chỉ mục và 4 khóa ngoại theo migration; bảng hiện có 0 đề xuất. Không in thông tin bí mật từ `.env`. Toàn bộ 200 kiểm thử/31 file đã qua. Chưa kiểm chứng luồng đăng nhập → duyệt → nộp với DB thật.
- Bộ kiểm thử API dùng dữ liệu giả, không thay thế kiểm tra trên DB triển khai. Không tuyên bố triển khai production hoàn tất.
- Hiện đọc toàn bộ lịch sử thuộc phạm vi lớp/học sinh; với dữ liệu lớn cần thêm phân trang/tiền tổng hợp sau khi đo thực tế.
- Không sửa API/schema cũ. Gỡ lớp mới bằng cách gỡ route/menu mới và tham số tùy chọn; giữ bảng mới để bảo toàn nhật ký duyệt. Không cần migration ngược phá hủy dữ liệu.

## Bản online Render
Người dùng xác nhận bản online: https://quanlythi.onrender.com. render.yaml cấu hình build npm ci && npm run build, start npm start và health check /api/ping. DB_HOST, DB_USER, DB_PASSWORD được cấu hình ngoài source (sync: false), không thể lấy từ URL website. Công cụ đọc web không truy cập được trang trong lượt kiểm tra này; không kết luận website ngừng hoạt động.

Để đưa thay đổi lên bản online: đưa các file source đã sửa lên repo liên kết với Render bằng quy trình deploy đang dùng. Migration đã chạy thành công trên DB cấu hình trong `.env` ngày 06/10/2026; cần bảo đảm Render sử dụng cùng DB. Chưa push/commit/deploy trong lượt kiểm tra DB này; bản online chưa được xác nhận có EduLoop, và luồng đăng nhập đầy đủ trên DB thật chưa được kiểm chứng.
