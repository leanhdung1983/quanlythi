# Hệ thống Quản lý Học tập và Khảo thí ID6 (ID6 Question Bank Manager)

Hệ thống quản trị ngân hàng câu hỏi chuẩn ID6, tạo đề thi ma trận, thi trực tuyến, thi thích ứng IRT và học tập tương tác.

---

## 📁 Cấu trúc Thư mục Dự án

```text
id6-question-bank-manager/
├── api/                  # Backend Express Router và các API endpoints
│   ├── index.js          # Xử lý toàn bộ logic nghiệp vụ (Auth, Questions, Exams, Classes, etc.)
│   └── cron.js           # Endpoint giữ kết nối định kỳ (Keep-alive) cho Vercel/Render
├── docs/                 # Tài liệu hướng dẫn sử dụng và tài liệu hệ thống
│   ├── HuongDanSuDung.md # Hướng dẫn chi tiết cho Học sinh, Giáo viên và Quản trị viên
│   └── project_prompts.md# Tổng hợp đặc tả kỹ thuật và prompt phát triển
├── public/               # Tài nguyên tĩnh và công cụ cho client
│   └── local_tikz_server.py # Server biên dịch TikZ cục bộ cho người dùng
├── scripts/              # Các script hỗ trợ quản trị và khởi tạo
│   └── seed-course.js    # Script mẫu khởi tạo bài học tương tác
├── src/                  # Toàn bộ mã nguồn Frontend (React + TypeScript + Tailwind)
│   ├── components/       # Các UI components dùng chung (Layout, MathRenderer, TikZ, etc.)
│   ├── pages/            # Các trang chức năng của hệ thống
│   ├── services/         # API client, xác thực (authStore), AI service, parser
│   ├── utils/            # Tiện ích xử lý dữ liệu, ma trận, chấm điểm, ID6
│   ├── App.tsx           # Router chính và phân quyền truy cập
│   ├── index.tsx         # Entry point React
│   └── types.ts          # Định nghĩa kiểu dữ liệu TypeScript toàn hệ thống
├── database.sql          # Script khởi tạo cơ sở dữ liệu MySQL/TiDB
├── redis.js              # Cấu hình bộ nhớ đệm Redis
├── server.js             # Máy chủ khởi chạy Express tích hợp Vite
├── package.json          # Cấu hình dependencies và lệnh chạy
├── tsconfig.json         # Cấu hình TypeScript
└── vite.config.ts        # Cấu hình đóng gói Vite
```

---

## 🚀 Hướng dẫn Cài đặt & Chạy ứng dụng

### 1. Yêu cầu Môi trường
- **Node.js**: Phiên bản 18.0.0 trở lên
- **MySQL hoặc TiDB Cloud**: CSDL cho hệ thống (chạy script `database.sql`)
- **Redis** *(Tùy chọn)*: Để bật cache tăng tốc truy vấn

### 2. Cấu hình Biến Môi trường
Tạo file `.env` từ `.env.example` và cấu hình thông số kết nối:
```bash
DB_HOST=127.0.0.1
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=id6_question_bank
DB_PORT=3306
GEMINI_API_KEY=your_gemini_api_key
```

### 3. Cài đặt Dependencies & Khởi chạy
```bash
# Cài đặt thư viện
npm install

# Khởi chạy chế độ phát triển (Development)
npm run dev

# Đóng gói sản phẩm (Production Build)
npm run build

# Khởi chạy chế độ Production
npm start
```

---

## 📖 Tài liệu Hướng dẫn Sử dụng
Vui lòng tham khảo chi tiết tại:
👉 [docs/HuongDanSuDung.md](docs/HuongDanSuDung.md)
