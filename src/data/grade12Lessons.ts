export interface Grade12Lesson {
  id: string;
  folder: string;
  chapterNumber: number;
  chapterName: string;
  chapterBadge: string;
  themeColor: string; // indigo, cyan, emerald, amber, purple, blue, pink
  unitNumber: number;
  title: string;
  tag: string;
  desc: string;
  labs: string;
  url: string;
}

export const GRADE_12_CHAPTERS = [
  {
    num: 1,
    name: "Ứng Dụng Đạo Hàm Để Khảo Sát Và Vẽ Đồ Thị Của Hàm Số",
    badge: "CHƯƠNG I · GIẢI TÍCH 12 · SGK KNTT",
    desc: "Tính đơn điệu, cực trị, GTLN-GTNN, đường tiệm cận, khảo sát hàm số và bài toán tối ưu thực tiễn.",
    color: "from-indigo-600 to-violet-700",
    badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200"
  },
  {
    num: 2,
    name: "Toạ Độ Của Vectơ Trong Không Gian",
    badge: "CHƯƠNG II · HÌNH HỌC 12 · SGK KNTT",
    desc: "Vectơ không gian, quy tắc hình hộp, hệ trục toạ độ Oxyz và biểu thức toạ độ các phép toán.",
    color: "from-cyan-600 to-blue-700",
    badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200"
  },
  {
    num: 3,
    name: "Các Số Đặc Trưng Đo Mức Độ Phân Tán Cho Mẫu Số Liệu Ghép Nhóm",
    badge: "CHƯƠNG III · THỐNG KÊ 12 · SGK KNTT",
    desc: "Khoảng biến thiên, khoảng tứ phân vị, phương sai và độ lệch chuẩn của mẫu số liệu ghép nhóm.",
    color: "from-emerald-600 to-teal-700",
    badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200"
  },
  {
    num: 4,
    name: "Nguyên Hàm, Tích Phân Và Ứng Dụng",
    badge: "CHƯƠNG IV · GIẢI TÍCH 12 · SGK KNTT",
    desc: "Nguyên hàm, tích phân Newton-Leibniz, tính diện tích hình phẳng và thể tích khối tròn xoay.",
    color: "from-amber-600 to-orange-700",
    badgeColor: "bg-amber-50 text-amber-700 border-amber-200"
  },
  {
    num: 5,
    name: "Phương Pháp Toạ Độ Trong Không Gian Oxyz",
    badge: "CHƯƠNG V · HÌNH HỌC 12 · SGK KNTT",
    desc: "Phương trình mặt phẳng, phương trình đường thẳng, công thức tính góc và phương trình mặt cầu.",
    color: "from-purple-600 to-fuchsia-700",
    badgeColor: "bg-purple-50 text-purple-700 border-purple-200"
  },
  {
    num: 6,
    name: "Một Số Yếu Tố Xác Suất",
    badge: "CHƯƠNG VI · XÁC SUẤT 12 · SGK KNTT",
    desc: "Xác suất có điều kiện, sơ đồ hình cây, công thức xác suất toàn phần và định lý Bayes.",
    color: "from-blue-600 to-indigo-700",
    badgeColor: "bg-blue-50 text-blue-700 border-blue-200"
  },
  {
    num: 7,
    name: "Ôn Tập Cuối Năm Toàn Diện",
    badge: "TỔNG HỢP TOÀN KHÓA · SGK KNTT",
    desc: "Tổng hợp toàn diện 6 chương Toán 12, kính vạn hoa giải tích và trạm không gian Oxyz 3D.",
    color: "from-pink-600 to-rose-700",
    badgeColor: "bg-pink-50 text-pink-700 border-pink-200"
  }
];

export const GRADE_12_LESSONS: Grade12Lesson[] = [
  // CHƯƠNG I: Đạo hàm (6 bài)
  {
    id: "toan12_bai1",
    folder: "toan12_bai1",
    chapterNumber: 1,
    chapterName: "Ứng Dụng Đạo Hàm Để Khảo Sát Và Vẽ Đồ Thị Của Hàm Số",
    chapterBadge: "Chương I · Bài 1",
    themeColor: "indigo",
    unitNumber: 1,
    title: "Tính Đơn Điệu Và Cực Trị Của Hàm Số",
    tag: "Đạo Hàm & Biến Thiên",
    desc: "Xét dấu đạo hàm f'(x), định lý đơn điệu, điều kiện cần và đủ của cực đại, cực tiểu và lập bảng biến thiên.",
    labs: "Tiếp Tuyến Trượt Dốc & Cán Cân Đạo Hàm Cực Trị",
    url: "/toan12/toan12_bai1/index.html"
  },
  {
    id: "toan12_bai2",
    folder: "toan12_bai2",
    chapterNumber: 1,
    chapterName: "Ứng Dụng Đạo Hàm Để Khảo Sát Và Vẽ Đồ Thị Của Hàm Số",
    chapterBadge: "Chương I · Bài 2",
    themeColor: "indigo",
    unitNumber: 2,
    title: "Giá Trị Lớn Nhất Và Nhỏ Nhất Của Hàm Số",
    tag: "Tối Ưu Hoá",
    desc: "Định nghĩa max min trên tập xác định, thuật toán tìm GTLN và GTNN trên đoạn kín [a; b], bài toán tối ưu hộp mở.",
    labs: "Kính Lúp Quét Đoạn [a; b] & Tối Ưu Hộp Thể Tích",
    url: "/toan12/toan12_bai2/index.html"
  },
  {
    id: "toan12_bai3",
    folder: "toan12_bai3",
    chapterNumber: 1,
    chapterName: "Ứng Dụng Đạo Hàm Để Khảo Sát Và Vẽ Đồ Thị Của Hàm Số",
    chapterBadge: "Chương I · Bài 3",
    themeColor: "indigo",
    unitNumber: 3,
    title: "Đường Tiệm Cận Của Đồ Thị Hàm Số",
    tag: "Tiệm Cận",
    desc: "Định nghĩa và phương pháp xác định tiệm cận đứng, tiệm cận ngang và tiệm cận xiên qua phép tính giới hạn lim.",
    labs: "Radar Tiệm Cận Đứng/Ngang & Thấu Kính Tiệm Cận Xiên",
    url: "/toan12/toan12_bai3/index.html"
  },
  {
    id: "toan12_bai4",
    folder: "toan12_bai4",
    chapterNumber: 1,
    chapterName: "Ứng Dụng Đạo Hàm Để Khảo Sát Và Vẽ Đồ Thị Của Hàm Số",
    chapterBadge: "Chương I · Bài 4",
    themeColor: "indigo",
    unitNumber: 4,
    title: "Khảo Sát Sự Biến Thiên Và Vẽ Đồ Thị Của Hàm Số",
    tag: "Khảo Sát Hàm Số",
    desc: "Quy trình 3 bước khảo sát toàn diện hàm số bậc ba, phân thức bậc nhất trên bậc nhất và bậc hai trên bậc nhất.",
    labs: "Studio Bậc Ba Điểm Uốn & Máy Biến Hình Phân Thức",
    url: "/toan12/toan12_bai4/index.html"
  },
  {
    id: "toan12_bai5",
    folder: "toan12_bai5",
    chapterNumber: 1,
    chapterName: "Ứng Dụng Đạo Hàm Để Khảo Sát Và Vẽ Đồ Thị Của Hàm Số",
    chapterBadge: "Chương I · Bài 5",
    themeColor: "indigo",
    unitNumber: 5,
    title: "Ứng Dụng Đạo Hàm Để Giải Quyết Vấn Đề Thực Tiễn",
    tag: "Toán Thực Tế",
    desc: "Mô hình hóa toán học các bài toán kinh tế, sản xuất, kỹ thuật và xây dựng hạ tầng bằng công cụ giải tích.",
    labs: "Tối Ưu Hóa Chi Phí Sản Xuất & Mô Hình Góc Nhìn Tối Đại",
    url: "/toan12/toan12_bai5/index.html"
  },
  {
    id: "toan12_ontap_chuong1",
    folder: "toan12_ontap_chuong1",
    chapterNumber: 1,
    chapterName: "Ứng Dụng Đạo Hàm Để Khảo Sát Và Vẽ Đồ Thị Của Hàm Số",
    chapterBadge: "Chương I · Tổng Ôn",
    themeColor: "indigo",
    unitNumber: 6,
    title: "Bài Tập Cuối Chương I - Tổng Ôn Ứng Dụng Đạo Hàm",
    tag: "Tổng Kết Chương I",
    desc: "Hệ thống hóa toàn bộ kiến thức Chương I, làm 10 câu trắc nghiệm tổng hợp SGK KNTT và cấp Bằng khen danh dự.",
    labs: "Đấu Trường Giải Tích Đa Năng & Bản Đồ Tư Duy Đạo Hàm",
    url: "/toan12/toan12_ontap_chuong1/index.html"
  },

  // CHƯƠNG II: Vectơ & Oxyz (4 bài)
  {
    id: "toan12_bai6",
    folder: "toan12_bai6",
    chapterNumber: 2,
    chapterName: "Toạ Độ Của Vectơ Trong Không Gian",
    chapterBadge: "Chương II · Bài 6",
    themeColor: "cyan",
    unitNumber: 1,
    title: "Vectơ Trong Không Gian",
    tag: "Vectơ Không Gian",
    desc: "Mở rộng khái niệm vectơ vào không gian, quy tắc hình hộp, trọng tâm tứ diện, góc giữa hai vectơ và tích vô hướng.",
    labs: "Quy Tắc Hình Hộp 3D Động & Cân Bằng Lực Tứ Diện Không Gian",
    url: "/toan12/toan12_bai6/index.html"
  },
  {
    id: "toan12_bai7",
    folder: "toan12_bai7",
    chapterNumber: 2,
    chapterName: "Toạ Độ Của Vectơ Trong Không Gian",
    chapterBadge: "Chương II · Bài 7",
    themeColor: "cyan",
    unitNumber: 2,
    title: "Hệ Toạ Độ Trong Không Gian",
    tag: "Hệ Trục Oxyz",
    desc: "Hệ trục toạ độ Oxyz, vectơ đơn vị, toạ độ điểm M, hình chiếu vuông góc, toạ độ trung điểm và trọng tâm tứ diện.",
    labs: "Không Gian Oxyz 3D Tương Tác Kéo Thả & Máy Chiếu Toạ Độ Điểm",
    url: "/toan12/toan12_bai7/index.html"
  },
  {
    id: "toan12_bai8",
    folder: "toan12_bai8",
    chapterNumber: 2,
    chapterName: "Toạ Độ Của Vectơ Trong Không Gian",
    chapterBadge: "Chương II · Bài 8",
    themeColor: "cyan",
    unitNumber: 3,
    title: "Biểu Thức Toạ Độ Của Các Phép Toán Vectơ",
    tag: "Đại Số Vectơ Oxyz",
    desc: "Phép cộng, trừ, nhân vectơ với một số, tích vô hướng, độ dài vectơ, khoảng cách giữa 2 điểm và góc giữa 2 vectơ.",
    labs: "Máy Tính Vectơ Không Gian Đa Chiều & Radar Đo Khoảng Cách 3D",
    url: "/toan12/toan12_bai8/index.html"
  },
  {
    id: "toan12_ontap_chuong2",
    folder: "toan12_ontap_chuong2",
    chapterNumber: 2,
    chapterName: "Toạ Độ Của Vectơ Trong Không Gian",
    chapterBadge: "Chương II · Tổng Ôn",
    themeColor: "cyan",
    unitNumber: 4,
    title: "Bài Tập Cuối Chương II - Tổng Ôn Vectơ & Oxyz",
    tag: "Tổng Kết Chương II",
    desc: "Tổng ôn toàn diện phương pháp vectơ không gian, giải 10 câu trắc nghiệm tổng hợp và mở khóa chứng nhận A4.",
    labs: "Trạm Thí Nghiệm Không Gian Oxyz Đa Năng",
    url: "/toan12/toan12_ontap_chuong2/index.html"
  },

  // CHƯƠNG III: Thống kê (3 bài)
  {
    id: "toan12_bai9",
    folder: "toan12_bai9",
    chapterNumber: 3,
    chapterName: "Các Số Đặc Trưng Đo Mức Độ Phân Tán Cho Mẫu Số Liệu Ghép Nhóm",
    chapterBadge: "Chương III · Bài 9",
    themeColor: "emerald",
    unitNumber: 1,
    title: "Khoảng Biến Thiên Và Khoảng Tứ Phân Vị Của Mẫu Ghép Nhóm",
    tag: "Thống Kê Mô Tả",
    desc: "Khoảng biến thiên R, xác định nhóm chứa tứ phân vị và công thức tính Q1, Q2, Q3, khoảng tứ phân vị và giá trị dị biệt.",
    labs: "Mô Phỏng Biểu Đồ Hộp Tương Tác & Máy So Sánh Tứ Phân Vị",
    url: "/toan12/toan12_bai9/index.html"
  },
  {
    id: "toan12_bai10",
    folder: "toan12_bai10",
    chapterNumber: 3,
    chapterName: "Các Số Đặc Trưng Đo Mức Độ Phân Tán Cho Mẫu Số Liệu Ghép Nhóm",
    chapterBadge: "Chương III · Bài 10",
    themeColor: "emerald",
    unitNumber: 2,
    title: "Phương Sai Và Độ Lệch Chuẩn Của Mẫu Số Liệu Ghép Nhóm",
    tag: "Đo Độ Phân Tán",
    desc: "Giá trị đại diện nhóm, số trung bình, công thức phương sai s^2 và độ lệch chuẩn s, đo lường mức độ rủi ro trong đầu tư.",
    labs: "Máy Tính Phân Tán Mẫu Ghép Nhóm & Đường Cong Phân Bố Chuẩn",
    url: "/toan12/toan12_bai10/index.html"
  },
  {
    id: "toan12_ontap_chuong3",
    folder: "toan12_ontap_chuong3",
    chapterNumber: 3,
    chapterName: "Các Số Đặc Trưng Đo Mức Độ Phân Tán Cho Mẫu Số Liệu Ghép Nhóm",
    chapterBadge: "Chương III · Tổng Ôn",
    themeColor: "emerald",
    unitNumber: 3,
    title: "Bài Tập Cuối Chương III - Tổng Ôn Thống Kê Phân Tán",
    tag: "Tổng Kết Chương III",
    desc: "Hệ thống hoá toàn diện R, Delta_Q, s^2, s. Đấu trường 10 câu SGK KNTT trang 85-86, nhận bằng khen A4 tốt nghiệp Tập 1.",
    labs: "Tuổi Thọ 20 Con Hổ SGK & Đánh Giá Độ Ổn Định Hai Nguồn Dữ Liệu",
    url: "/toan12/toan12_ontap_chuong3/index.html"
  },

  // CHƯƠNG IV: Tích phân (4 bài)
  {
    id: "toan12_bai11",
    folder: "toan12_bai11",
    chapterNumber: 4,
    chapterName: "Nguyên Hàm, Tích Phân Và Ứng Dụng",
    chapterBadge: "Chương IV · Bài 11",
    themeColor: "amber",
    unitNumber: 1,
    title: "Nguyên Hàm",
    tag: "Nguyên Hàm Cơ Bản",
    desc: "Khái niệm họ nguyên hàm, bảng nguyên hàm cơ bản, tính chất tuyến tính, phương pháp đổi biến số và nguyên hàm từng phần.",
    labs: "Máy Quét Đạo Hàm Ngược (Antiderivative) & Xưởng Từng Phần Số Học",
    url: "/toan12/toan12_bai11/index.html"
  },
  {
    id: "toan12_bai12",
    folder: "toan12_bai12",
    chapterNumber: 4,
    chapterName: "Nguyên Hàm, Tích Phân Và Ứng Dụng",
    chapterBadge: "Chương IV · Bài 12",
    themeColor: "amber",
    unitNumber: 2,
    title: "Tích Phân",
    tag: "Định Nghĩa & Tính Chất",
    desc: "Định nghĩa tích phân từ tổng Riemann, công thức Newton-Leibniz F(b)-F(a), tính chất tuyến tính, chèn cận và ý nghĩa cơ học.",
    labs: "Máy Chia Tổng Riemann Tương Tác & Máy Đo Quãng Đường Chuyển Động",
    url: "/toan12/toan12_bai12/index.html"
  },
  {
    id: "toan12_bai13",
    folder: "toan12_bai13",
    chapterNumber: 4,
    chapterName: "Nguyên Hàm, Tích Phân Và Ứng Dụng",
    chapterBadge: "Chương IV · Bài 13",
    themeColor: "amber",
    unitNumber: 3,
    title: "Ứng Dụng Hình Học Của Tích Phân",
    tag: "Diện Tích & Thể Tích",
    desc: "Tính diện tích hình phẳng giới hạn bởi đồ thị hàm số, thể tích vật thể mặt cắt S(x) và thể tích khối tròn xoay quanh Ox.",
    labs: "Máy Cắt Lát & Quét Diện Tích Hình Phẳng & Máy Tiện Khối Tròn Xoay 3D",
    url: "/toan12/toan12_bai13/index.html"
  },
  {
    id: "toan12_ontap_chuong4",
    folder: "toan12_ontap_chuong4",
    chapterNumber: 4,
    chapterName: "Nguyên Hàm, Tích Phân Và Ứng Dụng",
    chapterBadge: "Chương IV · Tổng Ôn",
    themeColor: "amber",
    unitNumber: 4,
    title: "Bài Tập Cuối Chương IV - Tổng Ôn Nguyên Hàm & Tích Phân",
    tag: "Tổng Kết Chương IV",
    desc: "Tổng ôn toàn diện Chương IV, Đấu trường 10 câu SGK trang 27-28, mô phỏng chế tác bình gốm tròn xoay và cấp bằng A4.",
    labs: "Trạm Tích Phân Đa Năng & Xưởng Chế Tác Bình Gốm Tròn Xoay (Bài 4.35)",
    url: "/toan12/toan12_ontap_chuong4/index.html"
  },

  // CHƯƠNG V: Oxyz (5 bài)
  {
    id: "toan12_bai14",
    folder: "toan12_bai14",
    chapterNumber: 5,
    chapterName: "Phương Pháp Toạ Độ Trong Không Gian Oxyz",
    chapterBadge: "Chương V · Bài 14",
    themeColor: "purple",
    unitNumber: 1,
    title: "Phương Trình Mặt Phẳng",
    tag: "Mặt Phẳng Oxyz",
    desc: "Vectơ pháp tuyến, phương trình tổng quát mặt phẳng, phương trình đoạn chắn, khoảng cách từ điểm đến mặt phẳng.",
    labs: "Xoay Mặt Phẳng 3D & VTPT & Đo Khoảng Cách Từ Điểm Đến Mặt Phẳng",
    url: "/toan12/toan12_bai14/index.html"
  },
  {
    id: "toan12_bai15",
    folder: "toan12_bai15",
    chapterNumber: 5,
    chapterName: "Phương Pháp Toạ Độ Trong Không Gian Oxyz",
    chapterBadge: "Chương V · Bài 15",
    themeColor: "purple",
    unitNumber: 2,
    title: "Phương Trình Đường Thẳng Trong Không Gian",
    tag: "Đường Thẳng Oxyz",
    desc: "Vectơ chỉ phương, phương trình tham số, phương trình chính tắc đường thẳng, xét vị trí tương đối giữa hai đường thẳng.",
    labs: "Bắn Tia Laser Đường Thẳng 3D & Kính Soi Vị Trí Tương Đối",
    url: "/toan12/toan12_bai15/index.html"
  },
  {
    id: "toan12_bai16",
    folder: "toan12_bai16",
    chapterNumber: 5,
    chapterName: "Phương Pháp Toạ Độ Trong Không Gian Oxyz",
    chapterBadge: "Chương V · Bài 16",
    themeColor: "purple",
    unitNumber: 3,
    title: "Công Thức Tính Góc Trong Không Gian",
    tag: "Tính Góc 3D",
    desc: "Góc giữa 2 đường thẳng, góc giữa đường thẳng và mặt phẳng, góc giữa 2 mặt phẳng, quy tắc cùng loài cos khác loài sin.",
    labs: "Thước Đo Góc Không Gian Động & Máy Đo Độ Dốc Mái Nhà Thái",
    url: "/toan12/toan12_bai16/index.html"
  },
  {
    id: "toan12_bai17",
    folder: "toan12_bai17",
    chapterNumber: 5,
    chapterName: "Phương Pháp Toạ Độ Trong Không Gian Oxyz",
    chapterBadge: "Chương V · Bài 17",
    themeColor: "purple",
    unitNumber: 4,
    title: "Phương Trình Mặt Cầu",
    tag: "Mặt Cầu Oxyz",
    desc: "Phương trình chính tắc (x-a)^2+(y-b)^2+(z-c)^2=R^2, phương trình khai triển, điều kiện tạo mặt cầu, giao điểm vệ tinh GPS.",
    labs: "Máy Tạo Quả Cầu 3D Tương Tác & Trạm Định Vị Vệ Tinh GPS Toàn Cầu",
    url: "/toan12/toan12_bai17/index.html"
  },
  {
    id: "toan12_ontap_chuong5",
    folder: "toan12_ontap_chuong5",
    chapterNumber: 5,
    chapterName: "Phương Pháp Toạ Độ Trong Không Gian Oxyz",
    chapterBadge: "Chương V · Tổng Ôn",
    themeColor: "purple",
    unitNumber: 5,
    title: "Bài Tập Cuối Chương V - Tổng Ôn Phương Pháp Toạ Độ Oxyz",
    tag: "Tổng Kết Chương V",
    desc: "Tổng ôn toàn diện phương pháp toạ độ không gian, 10 câu trắc nghiệm SGK KNTT trang 61-63, trạm khảo sát Oxyz đa năng.",
    labs: "Trạm Khảo Sát Không Gian Oxyz Đa Năng & Mô Phỏng Đường Chân Trời",
    url: "/toan12/toan12_ontap_chuong5/index.html"
  },

  // CHƯƠNG VI: Xác suất (3 bài)
  {
    id: "toan12_bai18",
    folder: "toan12_bai18",
    chapterNumber: 6,
    chapterName: "Một Số Yếu Tố Xác Suất",
    chapterBadge: "Chương VI · Bài 18",
    themeColor: "blue",
    unitNumber: 1,
    title: "Xác Suất Có Điều Kiện",
    tag: "Xác Suất Có Điều Kiện",
    desc: "Khái niệm P(B|A), quy tắc nhân xác suất, sơ đồ hình cây 2 tầng, nghịch lý Monty Hall và ứng dụng bảng thống kê 2x2.",
    labs: "Mô Phỏng 3 Cánh Cửa Monty Hall Tương Tác & Bảng Thống Kê 2x2",
    url: "/toan12/toan12_bai18/index.html"
  },
  {
    id: "toan12_bai19",
    folder: "toan12_bai19",
    chapterNumber: 6,
    chapterName: "Một Số Yếu Tố Xác Suất",
    chapterBadge: "Chương VI · Bài 19",
    themeColor: "blue",
    unitNumber: 2,
    title: "Công Thức Xác Suất Toàn Phần Và Công Thức Bayes",
    tag: "Bayes & Toàn Phần",
    desc: "Hệ đầy đủ các biến cố, công thức xác suất toàn phần P(B), định lý Bayes suy diễn xác suất hậu nghiệm P(A|B) trong chẩn đoán y tế.",
    labs: "Cây Xác Suất Động Thời Gian Thực & Bộ Lọc Spam Bayes",
    url: "/toan12/toan12_bai19/index.html"
  },
  {
    id: "toan12_ontap_chuong6",
    folder: "toan12_ontap_chuong6",
    chapterNumber: 6,
    chapterName: "Một Số Yếu Tố Xác Suất",
    chapterBadge: "Chương VI · Tổng Ôn",
    themeColor: "blue",
    unitNumber: 3,
    title: "Bài Tập Cuối Chương VI - Tổng Ôn Xác Suất Có Điều Kiện",
    tag: "Tổng Kết Chương VI",
    desc: "Tổng hợp toàn diện Chương VI, Đấu trường 10 câu SGK trang 79-80, máy tính cây Bayes đa tầng và cấp chứng nhận A4.",
    labs: "Máy Tính Cây Xác Suất Toàn Phần & Ma Trận Hiệu Quả Thuốc Bảng 2x2",
    url: "/toan12/toan12_ontap_chuong6/index.html"
  },

  // TỔNG KẾT TOÀN KHÓA (1 bài)
  {
    id: "toan12_ontap_cuoinam",
    folder: "toan12_ontap_cuoinam",
    chapterNumber: 7,
    chapterName: "Ôn Tập Cuối Năm Toàn Diện",
    chapterBadge: "Tốt Nghiệp · Lớp 12",
    themeColor: "pink",
    unitNumber: 1,
    title: "Bài Tập Ôn Tập Cuối Năm - Toàn Bộ Chương Trình Toán 12",
    tag: "Tốt Nghiệp Toàn Khóa",
    desc: "Tổng hợp toàn diện 6 chương Toán 12, Đấu trường 10 câu SGK trang 90-91, kính vạn hoa giải tích và cấp Bằng Tốt Nghiệp A4.",
    labs: "Kính Vạn Hoa Giải Tích 12 (Omni Calculus) & Trạm Không Gian Oxyz 3D",
    url: "/toan12/toan12_ontap_cuoinam/index.html"
  }
];
