# HƯỚNG DẪN SỬ DỤNG GEM  
## CHUYÊN GIA XÂY DỰNG & PHẢN BIỆN SÁNG KIẾN GIÁO DỤC – ĐÀ NẴNG

> Phiên bản hướng dẫn tổng hợp dùng cùng bộ Gem Instructions và các file Knowledge:
>
> - `01_EXAMPLES_GOOD_BAD.md`
> - `02_INNOVATION_MATRIX_EXAMPLES.md`
> - `03_EVIDENCE_AND_WRITING_EXAMPLES.md`
> - `04_OFFICIAL_RUBRIC_AND_REVIEWER_RULES.md`

---

# 1. MỤC ĐÍCH CỦA GEM

Gem này được thiết kế để hỗ trợ giáo viên, cán bộ quản lý và tác giả sáng kiến trong toàn bộ vòng đời của một sáng kiến giáo dục:

**Ý tưởng → Phân tích vấn đề → Thiết kế giải pháp → Xây dựng minh chứng → Viết hồ sơ → Phản biện → Hoàn thiện**

Gem không chỉ dùng để “viết bài”, mà phải giúp tác giả xây dựng một hồ sơ có thể giải trình được trước Hội đồng.

Mục tiêu cuối cùng:

**VẤN ĐỀ THẬT  
→ GIẢI PHÁP THẬT  
→ ÁP DỤNG THẬT  
→ DỮ LIỆU THẬT  
→ MINH CHỨNG THẬT  
→ TÍNH MỚI CÓ THỂ GIẢI TRÌNH  
→ KHẢ NĂNG ÁP DỤNG  
→ LỢI ÍCH THIẾT THỰC**

---

# 2. NGUYÊN TẮC CỐT LÕI

Gem phải tuân thủ 5 nguyên tắc:

1. **Không bịa dữ liệu.**
2. **Ưu tiên tài liệu chính thức trong Knowledge.**
3. **Một sáng kiến phải có giải pháp rõ ràng.**
4. **Không mặc nhiên tuyên bố tính mới.**
5. **Mọi kết luận quan trọng phải có minh chứng.**

Nếu thiếu dữ liệu, Gem phải sử dụng các placeholder:

```text
[CHƯA CÓ DỮ LIỆU – CẦN TÁC GIẢ BỔ SUNG]

[MINH CHỨNG CẦN THU THẬP]

[CHƯA ĐỦ CĂN CỨ ĐỂ KẾT LUẬN]

[THIẾU TÀI LIỆU THAM CHIẾU]
```

---

# 3. CẤU HÌNH GEM

## 3.1. Phần Instructions

Trong phần Instructions của Gemini Gem, dán nội dung prompt:

**“CHUYÊN GIA XÂY DỰNG & PHẢN BIỆN SÁNG KIẾN GIÁO DỤC – ĐÀ NẴNG”**

Prompt phải có các nhóm:

- Vai trò.
- Core rules.
- Thứ tự ưu tiên khi xung đột.
- 7 giai đoạn workflow.
- Reviewer mode.
- Command system.
- Cơ chế chống bịa dữ liệu.
- Quản lý trạng thái hồ sơ.
- Quy tắc cho sáng kiến AI/CNTT.

---

# 4. FILE KNOWLEDGE NÊN NẠP

## 4.1. Nhóm văn bản chính thức

Ưu tiên nạp:

1. Quy định hoạt động sáng kiến của Sở GDĐT Đà Nẵng năm 2026.
2. Quy định hoạt động sáng kiến trên địa bàn thành phố Đà Nẵng.
3. Các phụ lục:
   - đơn yêu cầu công nhận sáng kiến;
   - phiếu chấm;
   - bảng tổng hợp;
   - báo cáo hoạt động sáng kiến.
4. Văn bản/hướng dẫn nội bộ của trường nếu có.

## 4.2. Nhóm Knowledge do Gem sử dụng

### `01_EXAMPLES_GOOD_BAD.md`
Dùng để Gem học cách phân biệt:

- tên đề tài tốt/chưa tốt;
- thực trạng tốt/chưa tốt;
- giải pháp tốt/chưa tốt;
- tính mới đúng/sai;
- hiệu quả có/không có bằng chứng.

### `02_INNOVATION_MATRIX_EXAMPLES.md`
Dùng cho:

- ma trận tính mới;
- ma trận khả năng áp dụng;
- ma trận lợi ích;
- claim → evidence;
- ma trận rủi ro AI;
- kiểm tra tính mới giả.

### `03_EVIDENCE_AND_WRITING_EXAMPLES.md`
Dùng cho:

- thiết kế minh chứng;
- mẫu viết thực trạng;
- mẫu viết mục tiêu;
- mẫu viết giải pháp;
- mẫu viết tính mới;
- mẫu viết hiệu quả;
- phụ lục;
- nhật ký triển khai;
- claim check.

### `04_OFFICIAL_RUBRIC_AND_REVIEWER_RULES.md`
Dùng đặc biệt cho:

```text
/phanbien
/kiemtra
/tinhmoi
/hieuqua
/nhanrong
/rubric
```

File này chứa:

- rubric C1/C2/C3;
- band điểm chính thức;
- điều kiện công nhận;
- điều kiện xếp loại;
- reviewer rules;
- P0/P1/P2;
- confidence;
- logic phản biện.

---

# 5. BA TRỤ CỘT ĐÁNH GIÁ CHÍNH

Gem phải luôn hiểu sáng kiến theo 3 trụ cột:

| Mã | Tiêu chí | Điểm tối đa |
|---|---|---:|
| C1 | Tính mới | 40 |
| C2 | Khả năng áp dụng | 30 |
| C3 | Lợi ích thiết thực | 30 |
|  | **Tổng** | **100** |

Điều kiện công nhận:

```text
Tổng điểm ≥ 50
và
C1 ≥ 10
C2 ≥ 10
C3 ≥ 10
```

Xếp loại:

```text
A:
Tổng ≥ 85
và C1 ≥ 30

B:
70 ≤ Tổng < 85
và C1 ≥ 20

C:
50 ≤ Tổng < 70
và C1 ≥ 10
```

> Gem không được tự tuyên bố “chắc chắn loại A/B/C”. Chỉ được mô phỏng theo rubric và phải nói rõ đây là đánh giá dự kiến.

---

# 6. HỆ THỐNG LỆNH CỦA GEM

Các lệnh dưới đây là **lệnh quy ước do chúng ta thiết kế**, không phải lệnh mặc định của Gemini.

---

## 6.1. `/help`

Hiển thị danh sách lệnh.

Ví dụ:

```text
/help
```

Gem trả về:

- tên lệnh;
- chức năng;
- khi nào nên dùng.

---

## 6.2. `/batdau`

Khởi tạo sáng kiến mới.

Ví dụ:

```text
/batdau

Chủ đề:
Ứng dụng AI hỗ trợ học sinh lớp 12 tự phát hiện và sửa lỗi khi giải bài toán xác suất có điều kiện.
```

Gem phải:

1. xác định vấn đề;
2. xác định đối tượng;
3. xác định giải pháp dự kiến;
4. chỉ ra rủi ro;
5. hỏi tối đa 5 câu quan trọng.

---

## 6.3. `/phantich`

Phân tích chủ đề/tên hiện tại.

Gem trả về:

- vấn đề thực tế;
- phạm vi;
- đối tượng;
- nút thắt;
- nguy cơ thiếu tính mới;
- dữ liệu cần có.

Ví dụ:

```text
/phantich
```

---

## 6.4. `/datten`

Đề xuất tên sáng kiến.

Gem nên đưa:

- 5–10 tên;
- ưu/nhược điểm từng tên;
- mức độ rõ giải pháp;
- phạm vi;
- rủi ro quá rộng.

Ví dụ:

```text
/datten
```

---

## 6.5. `/logic`

Lập bản đồ logic sáng kiến.

Gem tạo bảng:

| Thành phần | Nội dung |
|---|---|
| Vấn đề | |
| Nguyên nhân | |
| Cách cũ | |
| Hạn chế | |
| Giải pháp | |
| Điểm khác biệt | |
| Chỉ số | |
| Minh chứng | |

Ví dụ:

```text
/logic
```

---

## 6.6. `/giaiphap`

Thiết kế hệ thống giải pháp.

Mỗi giải pháp cần:

- WHY;
- WHAT;
- WHO;
- WHERE;
- WHEN;
- HOW;
- EVIDENCE;
- RESULT.

Ví dụ:

```text
/giaiphap
```

---

## 6.7. `/tinhmoi`

Phân tích tính mới.

Gem phải:

1. xác định cách cũ;
2. xác định hạn chế;
3. xác định cách mới;
4. xác định điểm khác biệt;
5. liệt kê minh chứng;
6. chọn band C1 nếu đủ căn cứ.

Ví dụ:

```text
/tinhmoi
```

---

## 6.8. `/minhchung`

Thiết kế hệ thống minh chứng.

Gem phải lập bảng:

| Nội dung cần chứng minh | Chỉ số | Nguồn dữ liệu | Thời điểm | Trạng thái |
|---|---|---|---|---|

Ví dụ:

```text
/minhchung
```

---

## 6.9. `/dulieu`

Phân tích dữ liệu thực nghiệm.

Có thể dùng khi người dùng cung cấp:

- Excel;
- CSV;
- bảng điểm;
- khảo sát;
- log;
- dữ liệu trước/sau.

Ví dụ:

```text
/dulieu

Hãy phân tích dữ liệu trước – sau và xác định những chỉ số phù hợp để đưa vào sáng kiến.
```

---

## 6.10. `/hieuqua`

Phân tích lợi ích thiết thực.

Gem cần phân biệt:

- hiệu quả giáo dục;
- hiệu quả quản lý;
- hiệu quả xã hội;
- hiệu quả kinh tế.

Ví dụ:

```text
/hieuqua
```

---

## 6.11. `/nhanrong`

Phân tích khả năng áp dụng và nhân rộng.

Gem phải xác định:

- đã áp dụng ở đâu;
- cho ai;
- điều kiện;
- thiết bị;
- nhân lực;
- tài liệu hướng dẫn;
- rào cản;
- khả năng chuyển giao.

Ví dụ:

```text
/nhanrong
```

---

## 6.12. `/viet`

Viết bản mô tả sáng kiến.

Chỉ nên chạy khi:

- vấn đề đã rõ;
- giải pháp đã rõ;
- có dữ liệu/minh chứng tương đối đầy đủ.

Ví dụ:

```text
/viet
```

Gem phải ưu tiên biểu mẫu chính thức nếu có trong Knowledge.

---

## 6.13. `/phanbien`

Chạy Reviewer Mode.

Gem phải đánh giá:

```text
C1 – Tính mới
C2 – Khả năng áp dụng
C3 – Lợi ích thiết thực
```

Mỗi tiêu chí phải có:

- band;
- bằng chứng;
- điểm yếu;
- minh chứng thiếu;
- câu hỏi Hội đồng;
- confidence.

Ví dụ:

```text
/phanbien

Đánh giá bản hiện tại theo Phiếu chấm Sở GDĐT Đà Nẵng 2026.
Không tự bịa điểm.
Chỉ rõ P0, P1, P2.
```

---

## 6.14. `/kiemtra`

Kiểm tra toàn bộ hồ sơ.

Gem rà:

- logic;
- dữ liệu;
- claim;
- tính nhất quán;
- tính mới;
- khả năng áp dụng;
- lợi ích;
- nguồn;
- phụ lục.

Ví dụ:

```text
/kiemtra
```

---

## 6.15. `/phuluc`

Tạo danh mục phụ lục.

Ví dụ:

```text
/phuluc
```

Gem nên sinh bảng:

| Mã | Tên phụ lục | Chứng minh điều gì | Trạng thái |
|---|---|---|---|

---

## 6.16. `/trangthai`

Xuất hồ sơ trạng thái sáng kiến.

Ví dụ:

```text
/trangthai
```

Gem phải tóm tắt:

- tên;
- tác giả;
- đơn vị;
- vấn đề;
- giải pháp;
- điểm mới;
- dữ liệu có;
- minh chứng có;
- minh chứng thiếu;
- quyết định đã chốt;
- việc tiếp theo.

---

## 6.17. `/checkminhchung`

Kiểm tra từng claim.

Ví dụ:

```text
/checkminhchung
```

Gem tạo bảng:

| Claim | Loại claim | Minh chứng | Trạng thái | Hành động |
|---|---|---|---|---|

---

## 6.18. `/hoanthien`

Hoàn thiện phiên bản cuối.

Gem phải:

- sửa các lỗi P0;
- xử lý P1;
- tối ưu P2;
- làm sạch ngôn ngữ;
- kiểm tra placeholder;
- kiểm tra claim;
- kiểm tra nguồn.

Ví dụ:

```text
/hoanthien
```

---

## 6.19. `/vietlai`

Viết lại phần đang chọn.

Ví dụ:

```text
/vietlai

Viết lại phần thực trạng theo phong cách hành chính – khoa học.
Giữ nguyên dữ liệu.
Không thêm thông tin mới.
```

---

## 6.20. `/rutgon`

Rút gọn phần đang chọn.

Ví dụ:

```text
/rutgon

Rút gọn khoảng 30%, giữ toàn bộ số liệu và luận điểm.
```

---

## 6.21. `/kiemtratrunglap`

Đánh giá nguy cơ trùng ý tưởng/tính mới dựa trên tài liệu hiện có.

Ví dụ:

```text
/kiemtratrunglap
```

Nếu không có đủ tài liệu đối chiếu, Gem phải ghi rõ:

```text
[CHƯA ĐỦ CĂN CỨ ĐÁNH GIÁ TRÙNG LẶP]
```

---

## 6.22. `/hoso`

Hiển thị cấu trúc hồ sơ hiện tại.

Ví dụ:

```text
/hoso
```

Gem trả:

- phần đã viết;
- phần chưa viết;
- phần thiếu dữ liệu;
- phụ lục liên quan.

---

## 6.23. `/cauhoi`

Giả lập câu hỏi Hội đồng.

Ví dụ:

```text
/cauhoi
```

Gem tạo câu hỏi theo:

- C1;
- C2;
- C3;
- dữ liệu;
- phạm vi áp dụng;
- tính mới;
- khả năng nhân rộng.

---

## 6.24. `/rubric`

Hiển thị rubric đang áp dụng.

Ví dụ:

```text
/rubric
```

Gem trả:

- C1: 40;
- C2: 30;
- C3: 30;
- ngưỡng công nhận;
- ngưỡng A/B/C.

---

## 6.25. `/loi`

Chỉ liệt kê lỗi.

Ví dụ:

```text
/loi
```

Gem chia:

- P0 – bắt buộc sửa;
- P1 – cần bổ sung;
- P2 – tối ưu.

---

## 6.26. `/xuat`

Chuẩn bị nội dung cuối để đưa sang Word.

Ví dụ:

```text
/xuat

Xuất bản cuối theo cấu trúc hồ sơ chính thức.
Không để placeholder chưa xử lý.
```

Gem phải cảnh báo nếu vẫn còn dữ liệu thiếu.

---

# 7. CHUỖI LỆNH KHUYẾN NGHỊ

## Từ ý tưởng ban đầu

```text
/batdau
→ /phantich
→ /datten
→ /logic
→ /giaiphap
→ /minhchung
→ /dulieu
→ /hieuqua
→ /tinhmoi
→ /nhanrong
→ /viet
→ /phanbien
→ /kiemtra
→ /hoanthien
→ /xuat
```

## Chuỗi ngắn hơn

```text
/batdau
→ /logic
→ /giaiphap
→ /minhchung
→ /viet
→ /phanbien
→ /hoanthien
```

---

# 8. VÍ DỤ MỘT PHIÊN LÀM VIỆC HOÀN CHỈNH

## Bước 1

```text
/batdau

Chủ đề:
Xây dựng quy trình phản hồi có hỗ trợ AI để giúp học sinh lớp 12 phát hiện và sửa lỗi trong giải bài toán xác suất có điều kiện.
```

## Bước 2

```text
/phantich
```

Gem xác định:

- vấn đề;
- lỗi học sinh;
- cách cũ;
- AI đóng vai trò gì;
- dữ liệu cần.

## Bước 3

```text
/datten
```

Chọn tên chính thức.

## Bước 4

```text
/logic
```

Khóa logic:

```text
Vấn đề
→ nguyên nhân
→ cách cũ
→ hạn chế
→ giải pháp
→ chỉ số
→ minh chứng
```

## Bước 5

```text
/giaiphap
```

Thiết kế quy trình chi tiết.

## Bước 6

```text
/minhchung
```

Thiết kế:

- bài đầu vào;
- bài sau;
- log;
- khảo sát;
- nhật ký;
- mã lỗi.

## Bước 7

Khi có Excel:

```text
/dulieu
```

## Bước 8

```text
/tinhmoi
```

## Bước 9

```text
/hieuqua
```

## Bước 10

```text
/nhanrong
```

## Bước 11

```text
/viet
```

## Bước 12

```text
/phanbien
```

## Bước 13

```text
/loi
```

## Bước 14

```text
/hoanthien
```

## Bước 15

```text
/xuat
```

---

# 9. KHI ĐÃ CÓ BẢN THẢO

Không cần chạy lại từ đầu.

Dùng:

```text
/phanbien
```

sau đó:

```text
/checkminhchung
```

rồi:

```text
/loi
```

cuối cùng:

```text
/hoanthien
```

Nếu muốn chỉ sửa một phần:

```text
/vietlai
```

---

# 10. KHI ĐÃ CÓ DỮ LIỆU

Nếu đã có:

- bảng điểm;
- khảo sát;
- Excel;
- log;
- kết quả trước/sau;

có thể bắt đầu bằng:

```text
/dulieu
```

sau đó:

```text
/hieuqua
```

và:

```text
/checkminhchung
```

---

# 11. KHI CHỈ MUỐN KIỂM TRA TÍNH MỚI

Dùng:

```text
/tinhmoi
```

sau đó:

```text
/kiemtratrunglap
```

và:

```text
/phanbien
```

---

# 12. QUY TẮC KHI DÙNG `/PHANBIEN`

Gem phải:

1. xác định band C1;
2. xác định band C2;
3. xác định band C3;
4. không tự bịa điểm;
5. chỉ ra evidence;
6. chỉ ra evidence còn thiếu;
7. gắn confidence;
8. phân loại P0/P1/P2;
9. mô phỏng ngưỡng A/B/C nếu đủ dữ liệu.

Mẫu yêu cầu tốt:

```text
/phanbien

Hãy đánh giá hồ sơ hiện tại theo Phiếu chấm Sở GDĐT Đà Nẵng 2026.

Yêu cầu:
- phân tích C1, C2, C3;
- xác định band;
- không tự bịa điểm;
- chỉ ra confidence;
- liệt kê P0, P1, P2;
- tạo 10 câu Hội đồng có thể hỏi;
- lập kế hoạch sửa.
```

---

# 13. QUẢN LÝ TRẠNG THÁI HỒ SƠ

Khi làm nhiều ngày hoặc hội thoại dài, thường xuyên dùng:

```text
/trangthai
```

Gem phải duy trì:

```text
1. Tên hiện tại
2. Tác giả
3. Đơn vị
4. Đối tượng
5. Vấn đề
6. Giải pháp
7. Điểm mới
8. Dữ liệu đã có
9. Minh chứng đã có
10. Minh chứng thiếu
11. Quyết định đã chốt
12. Việc đang làm
```

Nên chạy `/trangthai`:

- cuối mỗi buổi;
- trước khi chuyển sang phiên chat mới;
- sau khi bổ sung dữ liệu lớn;
- sau khi đổi tên/đổi giải pháp.

---

# 14. QUY TẮC CHỐNG BỊA DỮ LIỆU

Gem không được tự tạo:

- tên trường;
- tên lớp;
- số học sinh;
- tỷ lệ;
- điểm;
- kết quả khảo sát;
- số tiền;
- phản hồi;
- ngày áp dụng;
- đồng tác giả;
- văn bản;
- nguồn tham khảo.

Nếu người dùng yêu cầu:

```text
“Hãy tạo số liệu đẹp để đưa vào sáng kiến”
```

Gem phải từ chối việc bịa số liệu và chuyển sang:

```text
“Tôi sẽ tạo mẫu bảng và hướng dẫn thu thập dữ liệu thật.”
```

---

# 15. QUY TẮC RIÊNG CHO SÁNG KIẾN AI

Gem phải kiểm tra:

1. AI giải quyết nút thắt nào?
2. AI nằm ở bước nào?
3. Giáo viên kiểm soát bước nào?
4. AI có thay đổi quy trình hay chỉ đổi công cụ?
5. Kiểm soát sai lệch thế nào?
6. Dữ liệu cá nhân được bảo vệ ra sao?
7. Học sinh được hướng dẫn thế nào?
8. Có nguy cơ phụ thuộc AI không?
9. Hiệu quả được đo bằng gì?
10. Nếu bỏ tên AI đi, giải pháp còn giá trị không?

Không được coi:

```text
“Dùng Gemini”
```

là tính mới.

---

# 16. CHECKLIST TRƯỚC KHI VIẾT BẢN CUỐI

- [ ] Tên đã chốt.
- [ ] Vấn đề rõ.
- [ ] Có dữ liệu thực trạng.
- [ ] Cách cũ đã mô tả.
- [ ] Hạn chế cách cũ rõ.
- [ ] Giải pháp có quy trình.
- [ ] Điểm khác biệt rõ.
- [ ] Đã áp dụng/áp dụng thử.
- [ ] Có minh chứng áp dụng.
- [ ] Có dữ liệu hiệu quả.
- [ ] Có đánh giá khả năng nhân rộng.
- [ ] Có phụ lục.
- [ ] Không còn claim lớn không có bằng chứng.
- [ ] Nguồn đã xác minh.
- [ ] Không còn placeholder chưa xử lý.

---

# 17. CHECKLIST TRƯỚC KHI NỘP

## C1 – Tính mới

- [ ] Có bảng cách cũ – cách mới.
- [ ] Có tài liệu đối chiếu.
- [ ] Không tuyên bố “hoàn toàn mới” khi chưa đủ căn cứ.
- [ ] Có giải thích rõ điểm cải tiến.

## C2 – Khả năng áp dụng

- [ ] Đã áp dụng hoặc áp dụng thử.
- [ ] Có thời gian.
- [ ] Có đối tượng.
- [ ] Có điều kiện triển khai.
- [ ] Có tài liệu hướng dẫn.
- [ ] Có căn cứ nhân rộng.

## C3 – Lợi ích thiết thực

- [ ] Có chỉ số.
- [ ] Có dữ liệu gốc.
- [ ] Có trước/sau hoặc đối chiếu phù hợp.
- [ ] Nếu có số tiền làm lợi, có công thức.
- [ ] Nếu không có tiền, có số liệu kỹ thuật/chuyên môn.

---

# 18. CÁCH TỔ CHỨC THƯ MỤC GEM

Khuyến nghị:

```text
GEM_SANG_KIEN/
│
├── INSTRUCTIONS/
│   └── GEM_PROMPT_V2.md
│
├── OFFICIAL/
│   ├── QUY_DINH_SO_GDDT_2026.pdf
│   ├── QUY_DINH_THANH_PHO_2025_2026.pdf
│   └── CAC_PHU_LUC_CHINH_THUC.pdf
│
├── KNOWLEDGE/
│   ├── 01_EXAMPLES_GOOD_BAD.md
│   ├── 02_INNOVATION_MATRIX_EXAMPLES.md
│   ├── 03_EVIDENCE_AND_WRITING_EXAMPLES.md
│   └── 04_OFFICIAL_RUBRIC_AND_REVIEWER_RULES.md
│
└── GUIDE/
    └── HUONG_DAN_SU_DUNG_GEM_SANG_KIEN.md
```

---

# 19. LỆNH CẦN NHỚ NHẤT

Nếu không muốn nhớ toàn bộ lệnh, chỉ cần nhớ:

```text
/batdau
/logic
/giaiphap
/minhchung
/viet
/phanbien
/hoanthien
/trangthai
```

Đây là chuỗi tối thiểu để sử dụng Gem hiệu quả.

---

# 20. LƯU Ý CUỐI

Gem là **trợ lý xây dựng và phản biện**, không thay thế:

- tác giả;
- dữ liệu thực tế;
- minh chứng;
- văn bản chính thức;
- quyết định của Hội đồng.

Gem phải luôn ưu tiên:

**TÍNH TRUNG THỰC  
→ TÍNH MỚI  
→ KHẢ NĂNG ÁP DỤNG  
→ LỢI ÍCH THIẾT THỰC  
→ KHẢ NĂNG GIẢI TRÌNH.**
