# Đồng bộ điểm sau khi sửa ma trận hoặc đáp án

- Giữ nguyên đề thực tế đã phát: câu hỏi, thứ tự câu, thứ tự lựa chọn và câu trả lời học sinh đã nộp.
- Cấu hình điểm mới của ma trận áp dụng cho mọi bài đã nộp thuộc ma trận đó. Chia điểm từng phần theo số câu thực tế trong bài đã thi.
- Sửa đáp án tại ngân hàng câu hỏi (sửa từng câu, cập nhật hàng loạt, xác nhận bản sửa hoặc phục hồi phiên bản) chấm lại các bài có câu đó trong cùng giao dịch lưu câu hỏi; cập nhật cả đáp án của phiên đang làm. Điểm của phiên đang làm chỉ được tính khi nộp.
- Đáp án trắc nghiệm được ghép bằng nội dung lựa chọn và vị trí gốc, không dùng nhãn A/B/C/D sau khi đảo. Hỗ trợ đúng/sai, kể cả bốn ý đều sai, và đáp án ngắn.
- Lịch sử cá nhân, lịch sử tổng hợp, kết quả theo ma trận và bảng điểm lớp kiểm tra lại đáp án/cấu hình hiện tại khi tải. Bước này sửa được dữ liệu cũ hoặc sửa ngân hàng qua đường khác.
- `result_detail.questions` chứa đề đã thi với đáp án dùng để chấm hiện tại; `submitted_questions` giữ bản trước lần đồng bộ đầu tiên. `answers` luôn giữ nguyên.
- Thay cấu trúc ma trận chỉ tác động đề phát cho lượt tiếp theo. Không thêm câu chưa thi vào bài đã nộp.
- Nếu sửa nội dung lựa chọn khiến không còn ghép được với đề cũ, giữ kết quả cũ của câu đó và báo số bài cần kiểm tra khi lưu câu hỏi. Không đoán đáp án theo nhãn đã đảo.
- Điểm sửa thủ công được giữ khi cấu hình và đáp án không đổi. Khi thay đáp án/cấu hình chấm, điểm được tính lại theo yêu cầu đồng bộ.

## Kiểm tra

Các kiểm thử `examRegrade.test.js`, `historyRegrade.routes.test.js`, `matrixRegrade.routes.test.js` và `examSubmission.routes.test.js` kiểm tra đổi đáp án sau đảo lựa chọn, đổi thang điểm, giữ bản nộp, phiên đang làm, lịch sử và việc nộp lại không tạo kết quả mới.
