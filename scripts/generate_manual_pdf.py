# -*- coding: utf-8 -*-
"""
Script tạo file PDF Hướng Dẫn Sử Dụng Hệ Thống Quản Lý Khảo Thí và Học Tập (Bản Cập Nhật Mới Nhất)
Bao gồm:
- Phân biệt rõ ràng quyền lợi giữa Tài khoản Miễn phí (Free) và Tài khoản Chuyên gia (PRO).
- Bảng giá chi tiết các gói nâng cấp PRO dành cho Học sinh (200.000đ/năm) và Giáo viên (300.000đ/năm).
- Hướng dẫn quy trình nạp tiền & kích hoạt PRO tự động qua quét mã QR MB Bank / SePay.
- Hướng dẫn học sinh vào lớp (kèm 3 mã đề xuất tự do: THY6TO, WWHXNV, W0DBUX).
- Hướng dẫn giáo viên tạo ma trận đề thi, giao bài tập LMS, quản lý bảng điểm và xuất Excel.
"""

import os
import subprocess
import sys
import shutil

HTML_CONTENT = """<!DOCTYPE html>
<html lang="vi">
<head>
<meta charset="UTF-8">
<title>Hướng Dẫn Sử Dụng Hệ Thống Khảo Thí Và Học Tập Trực Tuyến</title>
<style>
  @page {
    size: A4;
    margin: 13mm 13mm 15mm 13mm;
    @bottom-right {
      content: counter(page);
    }
  }

  * {
    box-sizing: border-box;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
    color: #1e293b;
    line-height: 1.52;
    font-size: 13px;
    margin: 0;
    padding: 0;
    background: #ffffff;
  }

  .page-break {
    page-break-before: always;
  }

  .avoid-break {
    page-break-inside: avoid;
  }

  /* Cover Page */
  .cover {
    min-height: 255mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: 18mm 12mm 15mm 12mm;
    text-align: center;
    background: linear-gradient(145deg, #f8fafc 0%, #e0e7ff 45%, #ede9fe 100%);
    border-radius: 20px;
    border: 2px solid #c7d2fe;
    page-break-after: always;
  }

  .cover-badge {
    display: inline-block;
    background: #4f46e5;
    color: #ffffff;
    font-weight: 700;
    font-size: 12.5px;
    padding: 6px 18px;
    border-radius: 9999px;
    letter-spacing: 1px;
    text-transform: uppercase;
    box-shadow: 0 4px 10px rgba(79, 70, 229, 0.25);
  }

  .cover-title {
    font-size: 30px;
    font-weight: 800;
    color: #1e1b4b;
    margin: 18px 0 10px 0;
    line-height: 1.25;
  }

  .cover-subtitle {
    font-size: 17px;
    font-weight: 600;
    color: #4338ca;
    margin-bottom: 20px;
  }

  .cover-desc {
    max-width: 660px;
    margin: 0 auto;
    font-size: 13.5px;
    color: #475569;
    line-height: 1.6;
  }

  .cover-meta {
    margin-top: 30px;
    display: flex;
    justify-content: center;
    gap: 20px;
  }

  .meta-card {
    background: rgba(255, 255, 255, 0.92);
    border: 1px solid #e2e8f0;
    border-radius: 12px;
    padding: 10px 20px;
    font-size: 12px;
    color: #334155;
    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  }

  .meta-card strong {
    color: #1e293b;
    display: block;
    font-size: 13.5px;
  }

  /* Headings */
  h1 {
    font-size: 20px;
    color: #1e1b4b;
    border-bottom: 2.5px solid #4f46e5;
    padding-bottom: 5px;
    margin-top: 20px;
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  h2 {
    font-size: 15.5px;
    color: #312e81;
    margin-top: 16px;
    margin-bottom: 8px;
    border-left: 4px solid #6366f1;
    padding-left: 8px;
  }

  h3 {
    font-size: 13.5px;
    color: #1e293b;
    margin-top: 10px;
    margin-bottom: 5px;
  }

  p {
    margin-top: 4px;
    margin-bottom: 7px;
  }

  /* Callouts & Alert Boxes */
  .callout {
    border-radius: 10px;
    padding: 9px 13px;
    margin: 9px 0;
    font-size: 12.5px;
    border-left: 4px solid transparent;
  }

  .callout-info {
    background: #eef2ff;
    border-color: #4f46e5;
    color: #312e81;
  }

  .callout-success {
    background: #f0fdf4;
    border-color: #16a34a;
    color: #14532d;
  }

  .callout-warning {
    background: #fffbeb;
    border-color: #f59e0b;
    color: #78350f;
  }

  .callout-purple {
    background: #faf5ff;
    border-color: #a855f7;
    color: #581c87;
  }

  /* Step Badge */
  .step-list {
    list-style: none;
    padding-left: 0;
    margin: 8px 0;
  }

  .step-item {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    margin-bottom: 10px;
    background: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 9px 13px;
  }

  .step-number {
    background: #4f46e5;
    color: #ffffff;
    font-weight: 700;
    font-size: 12.5px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .step-content {
    flex: 1;
  }

  .step-title {
    font-weight: 700;
    color: #0f172a;
    font-size: 13px;
    margin-bottom: 2px;
  }

  /* Table styling */
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 9px 0;
    font-size: 12.2px;
  }

  th, td {
    padding: 7px 9px;
    border: 1px solid #cbd5e1;
    text-align: left;
  }

  th {
    background: #f1f5f9;
    color: #1e293b;
    font-weight: 700;
  }

  tr:nth-child(even) td {
    background: #f8fafc;
  }

  /* Mockup Frame */
  .mockup-card {
    border: 1.5px solid #cbd5e1;
    border-radius: 12px;
    background: #ffffff;
    box-shadow: 0 4px 10px rgba(0,0,0,0.05);
    margin: 10px 0 14px 0;
    overflow: hidden;
  }

  .mockup-header {
    background: #f1f5f9;
    border-bottom: 1px solid #e2e8f0;
    padding: 7px 12px;
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 700;
    color: #475569;
  }

  .mockup-dots {
    display: flex;
    gap: 4px;
  }

  .mockup-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
  }

  .dot-red { background: #ef4444; }
  .dot-yellow { background: #f59e0b; }
  .dot-green { background: #10b981; }

  .mockup-body {
    padding: 12px;
  }

  /* Badge Pills */
  .pill {
    display: inline-block;
    padding: 2px 7px;
    border-radius: 6px;
    font-size: 10.5px;
    font-weight: 700;
  }

  .pill-code {
    font-family: Consolas, monospace;
    font-size: 12px;
    font-weight: 800;
    background: #eef2ff;
    color: #4338ca;
    padding: 2px 6px;
    border-radius: 5px;
    border: 1px solid #c7d2fe;
  }

  .pill-green { background: #dcfce7; color: #15803d; }
  .pill-amber { background: #fef3c7; color: #b45309; }
  .pill-red { background: #fee2e2; color: #b91c1c; }
  .pill-indigo { background: #e0e7ff; color: #4338ca; }
  .pill-purple { background: #f3e8ff; color: #7e22ce; }
  .pill-gold { background: #fef08a; color: #854d0e; border: 1px solid #facc15; }

  /* Pricing Cards */
  .pricing-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 15px;
    margin: 12px 0;
  }

  .pricing-card {
    border-radius: 14px;
    padding: 14px;
    border: 2px solid #e2e8f0;
    background: #ffffff;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    box-shadow: 0 4px 10px rgba(0,0,0,0.04);
  }

  .pricing-card-pro {
    border-color: #818cf8;
    background: linear-gradient(180deg, #ffffff 0%, #f5f3ff 100%);
  }

  .price-tag {
    font-size: 24px;
    font-weight: 800;
    color: #4f46e5;
    margin: 6px 0;
  }

  .price-period {
    font-size: 12px;
    font-weight: normal;
    color: #64748b;
  }

  .diagram-container {
    text-align: center;
    margin: 12px 0;
  }
</style>
</head>
<body>

<!-- TRANG BÌA -->
<div class="cover">
  <div>
    <div class="cover-badge">TÀI LIỆU HƯỚNG DẪN CHÍNH THỨC 2026</div>
    <div class="cover-title">HỆ THỐNG KHẢO THÍ VÀ QUẢN LÝ HỌC TẬP TRỰC TUYẾN</div>
    <div class="cover-subtitle">Sổ Tay Hướng Dẫn Vận Hành, Chọn Lớp &amp; Nâng Cấp Tài Khoản PRO</div>
    <p class="cover-desc">
      Tài liệu hướng dẫn trực quan, toàn diện: quy trình đăng ký tham gia lớp học, 
      làm bài thi trực tuyến, các hạn chế của tài khoản Free và đặc quyền khi nâng cấp PRO,
      bảng giá niêm yết và hướng dẫn quét mã QR thanh toán kích hoạt PRO tự động qua SePay / MB Bank.
    </p>
  </div>

  <div class="diagram-container">
    <!-- SVG Minh Họa Tổng Quan Hệ Thống -->
    <svg width="600" height="190" viewBox="0 0 600 190" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="10" y="8" width="580" height="174" rx="16" fill="#ffffff" stroke="#c7d2fe" stroke-width="2"/>
      
      <!-- Box Giáo Viên -->
      <g transform="translate(35, 25)">
        <rect width="155" height="135" rx="12" fill="#eff6ff" stroke="#3b82f6" stroke-width="1.5"/>
        <circle cx="77.5" cy="38" r="20" fill="#3b82f6"/>
        <path d="M77.5 30c-3.5 0-6 2.5-6 6s2.5 6 6 6 6-2.5 6-6-2.5-6-6-6zm0 15c-6 0-12 3-12 7v2h24v-2c0-4-6-7-12-7z" fill="#ffffff"/>
        <text x="77.5" y="74" text-anchor="middle" font-weight="bold" fill="#1e3a8a" font-size="12">GIÁO VIÊN</text>
        <rect x="25" y="82" width="105" height="18" rx="4" fill="#dbeafe"/>
        <text x="77.5" y="94" text-anchor="middle" font-weight="bold" fill="#1d4ed8" font-size="9.5">PRO: 300.000đ/năm</text>
        <text x="77.5" y="112" text-anchor="middle" fill="#64748b" font-size="9.5">Tạo lớp &amp; Ma trận đề</text>
        <text x="77.5" y="125" text-anchor="middle" fill="#64748b" font-size="9.5">Giao bài &amp; Xuất Excel</text>
      </g>

      <!-- Trung Tâm Tương Tác / Cấp Mã -->
      <g transform="translate(225, 35)">
        <rect width="150" height="115" rx="14" fill="#faf5ff" stroke="#8b5cf6" stroke-width="1.5"/>
        <text x="75" y="28" text-anchor="middle" font-weight="bold" fill="#5b21b6" font-size="11.5">KHÔNG GIAN LỚP HỌC</text>
        <text x="75" y="46" text-anchor="middle" fill="#7c3aed" font-weight="600" font-size="10.5">Mã Lớp Học Riêng</text>
        <rect x="25" y="52" width="100" height="20" rx="5" fill="#ede9fe" stroke="#c4b5fd"/>
        <text x="75" y="66" text-anchor="middle" font-weight="bold" fill="#6d28d9" font-size="10.5" font-family="monospace">ABC123</text>
        <rect x="15" y="80" width="120" height="26" rx="5" fill="#f5f3ff" stroke="#ddd6fe"/>
        <text x="75" y="93" text-anchor="middle" font-weight="bold" fill="#4338ca" font-size="9">3 Mã Lớp Tự Do:</text>
        <text x="75" y="103" text-anchor="middle" fill="#6366f1" font-size="8.5" font-family="monospace">THY6TO | WWHXNV | W0DBUX</text>
      </g>

      <!-- Box Học Sinh -->
      <g transform="translate(410, 25)">
        <rect width="155" height="135" rx="12" fill="#f0fdf4" stroke="#22c55e" stroke-width="1.5"/>
        <circle cx="77.5" cy="38" r="20" fill="#22c55e"/>
        <path d="M77.5 30c-3.5 0-6 2.5-6 6s2.5 6 6 6 6-2.5 6-6-2.5-6-6-6zm0 15c-6 0-12 3-12 7v2h24v-2c0-4-6-7-12-7z" fill="#ffffff"/>
        <text x="77.5" y="74" text-anchor="middle" font-weight="bold" fill="#14532d" font-size="12">HỌC SINH</text>
        <rect x="25" y="82" width="105" height="18" rx="4" fill="#dcfce7"/>
        <text x="77.5" y="94" text-anchor="middle" font-weight="bold" fill="#15803d" font-size="9.5">PRO: 200.000đ/năm</text>
        <text x="77.5" y="112" text-anchor="middle" fill="#64748b" font-size="9.5">Vào lớp bằng mã</text>
        <text x="77.5" y="125" text-anchor="middle" fill="#64748b" font-size="9.5">Thi trực tuyến &amp; Luyện tập</text>
      </g>

      <!-- Đường liên kết -->
      <path d="M190 85 H225" stroke="#3b82f6" stroke-width="2" stroke-dasharray="4 3"/>
      <path d="M410 85 H375" stroke="#22c55e" stroke-width="2" stroke-dasharray="4 3"/>
    </svg>
  </div>

  <div class="cover-meta">
    <div class="meta-card">
      <strong>Phiên bản</strong>
      Hệ thống Khảo thí 2.1
    </div>
    <div class="meta-card">
      <strong>Áp dụng cho</strong>
      Khối 10, Khối 11, Khối 12
    </div>
    <div class="meta-card">
      <strong>Hỗ trợ kích hoạt PRO</strong>
      Tự động quét QR qua SePay / MB
    </div>
  </div>
</div>

<!-- MỤC 1: PHÂN BIỆT RÕ RÀNG TÀI KHOẢN FREE VÀ PRO -->
<div class="avoid-break">
  <h1>1. Phân Biệt Tài Khoản Miễn Phí (Free) &amp; Tài Khoản Nâng Cấp (PRO)</h1>
  <p>
    Trên hệ thống, mọi tài khoản khi mới đăng ký mặc định là <strong>Tài khoản Miễn phí (Free Tier)</strong>. 
    Tài khoản Free bị <strong>giới hạn một số tính năng và số lượt sử dụng trong ngày</strong>. 
    Để sử dụng toàn bộ tính năng và không giới hạn công cụ, người dùng cần nâng cấp lên <strong>Tài khoản Chuyên gia (PRO Member)</strong>.
  </p>

  <div class="callout callout-warning">
    <strong>Lưu ý quan trọng về chính sách sử dụng:</strong><br>
    • <strong>Học sinh dùng tài khoản Free</strong> sẽ có giới hạn về số lần thi thử trong ngày (tối đa 2 lần/ngày) và bị giới hạn xem lời giải chi tiết hoặc luyện tập chuyên sâu.<br>
    • <strong>Học sinh nâng cấp PRO</strong> sẽ được thi thử không giới hạn, xem toàn bộ lời giải chi tiết và mở khóa kho luyện thi thích ứng.<br>
    • <strong>Giáo viên nâng cấp PRO</strong> sẽ mở khóa toàn bộ công cụ ma trận đề, ngân hàng câu hỏi, công cụ nhận diện TikZ/LaTeX và xuất bảng điểm.
  </div>

  <h2>Bảng so sánh chi tiết quyền lợi giữa Tài khoản FREE và PRO:</h2>
  <table>
    <thead>
      <tr>
        <th style="width: 25%;">Tính năng / Công cụ</th>
        <th style="width: 37%;">Tài khoản Miễn phí (Free Tier)</th>
        <th style="width: 38%;">Tài khoản Nâng cấp (PRO Member) <span class="pill pill-gold">👑 KHUYÊN DÙNG</span></th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>DÀNH CHO HỌC SINH:</strong><br>Số lần thi thử / ngày</td>
        <td><strong style="color: #b91c1c;">Tối đa 2 lần / ngày</strong><br><span style="font-size: 11px; color: #64748b;">(Hết 2 lượt hệ thống sẽ khóa nút vào thi cho đến ngày hôm sau)</span></td>
        <td><strong style="color: #15803d;">KHÔNG GIỚI HẠN</strong><br><span style="font-size: 11px; color: #64748b;">(Thi thử, làm lại bài tập không hạn chế số lần)</span></td>
      </tr>
      <tr>
        <td>Xem lời giải chi tiết &amp; Phân tích đáp án</td>
        <td>Giới hạn, chỉ xem được đáp án đúng/sai cơ bản ở một số câu.</td>
        <td><strong style="color: #15803d;">Mở khóa 100%</strong> lời giải từng bước, công thức chi tiết và phương pháp giải nhanh.</td>
      </tr>
      <tr>
        <td>Luyện thi thích ứng (Adaptive Test) &amp; EduLoop</td>
        <td>Giới hạn số lượng câu hỏi và chủ đề luyện tập.</td>
        <td>Luyện tập thông minh theo thuật toán IRT cá nhân hóa toàn bộ ngân hàng câu hỏi.</td>
      </tr>
      <tr>
        <td>Lưu trữ lịch sử &amp; Biểu đồ tiến bộ</td>
        <td>Chỉ lưu kết quả gần nhất.</td>
        <td>Lưu trữ không giới hạn toàn bộ lịch sử thi và phân tích biểu đồ năng lực.</td>
      </tr>
      <tr>
        <td><strong>DÀNH CHO GIÁO VIÊN:</strong><br>Soạn đề &amp; Ma trận đề thi</td>
        <td>Giới hạn số lượng ma trận và số lượt xuất đề.</td>
        <td><strong style="color: #15803d;">Không giới hạn</strong> tạo ma trận, bốc đề tự động từ ngân hàng chuẩn Bộ GD&amp;ĐT.</td>
      </tr>
      <tr>
        <td>Bộ công cụ Pro Tool (TikZ, IRT, Gán ID, Converter)</td>
        <td>Bị khóa hoặc giới hạn số lượng tác vụ xử lý.</td>
        <td><strong style="color: #15803d;">Mở khóa toàn bộ</strong> công cụ biên dịch TikZ, phân tích câu hỏi IRT, gán ID chuẩn hóa.</td>
      </tr>
      <tr>
        <td>Quản lý lớp học &amp; Giao bài tập LMS</td>
        <td>Giới hạn số lớp và số học sinh.</td>
        <td>Quản lý không giới hạn lớp học, giao bài tập phân tầng, xuất Excel bảng điểm.</td>
      </tr>
    </tbody>
  </table>
</div>

<!-- MỤC 2: HƯỚNG DẪN DÀNH CHO HỌC SINH -->
<div class="page-break"></div>
<h1>2. Hướng Dẫn Chi Tiết Dành Cho Học Sinh</h1>

<h2>2.1. Đăng ký &amp; Đăng nhập tài khoản</h2>
<ul class="step-list">
  <li class="step-item">
    <div class="step-number">1</div>
    <div class="step-content">
      <div class="step-title">Tạo tài khoản mới</div>
      <div>Chọn <strong>Đăng ký ngay</strong> tại màn hình đăng nhập. Điền đầy đủ: Họ tên, Tên đăng nhập (username), Mật khẩu và Tên trường học.</div>
    </div>
  </li>
  <li class="step-item">
    <div class="step-number">2</div>
    <div class="step-content">
      <div class="step-title">Đăng nhập vào hệ thống</div>
      <div>Nhập tài khoản vừa tạo để đăng nhập. Mặc định tài khoản ban đầu là gói <strong>Free</strong>. Học sinh có thể nâng cấp lên <strong>PRO</strong> bất cứ lúc nào tại trang Hồ sơ cá nhân.</div>
    </div>
  </li>
</ul>

<h2>2.2. Tham gia lớp học (Vào lớp bằng mã hoặc 3 mã tự do)</h2>
<p>
  Tại menu điều hướng bên trái, chọn <strong>Lớp học của tôi</strong>. Tại đây học sinh thực hiện tham gia lớp:
</p>

<!-- Mockup Giao Diện Chọn Lớp Của Học Sinh -->
<div class="mockup-card">
  <div class="mockup-header">
    <div class="mockup-dots">
      <div class="mockup-dot dot-red"></div>
      <div class="mockup-dot dot-yellow"></div>
      <div class="mockup-dot dot-green"></div>
    </div>
    <span>MINH HỌA GIAO DIỆN: CHỌN VÀ THAM GIA LỚP HỌC</span>
  </div>
  <div class="mockup-body" style="background: #f8fafc;">
    <div style="display: flex; gap: 14px; flex-wrap: wrap;">
      
      <!-- Cột Trái -->
      <div style="flex: 1; min-width: 270px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;">
        <div style="font-weight: bold; color: #1e293b; font-size: 13px; margin-bottom: 8px;">Danh sách lớp học</div>
        
        <!-- Nhập mã riêng của giáo viên -->
        <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 10px; padding: 9px; margin-bottom: 10px;">
          <div style="font-size: 12px; font-weight: bold; color: #166534; margin-bottom: 3px;">Tìm và tham gia lớp bằng mã</div>
          <div style="font-size: 11px; color: #15803d; margin-bottom: 6px;">Nhập mã lớp do giáo viên cung cấp:</div>
          <div style="display: flex; gap: 6px;">
            <div style="flex: 1; background: #ffffff; border: 1px solid #86efac; border-radius: 6px; padding: 4px 8px; font-size: 12px; font-family: monospace; color: #334155;">ABC123</div>
            <button style="background: #16a34a; color: white; border: none; border-radius: 6px; padding: 4px 10px; font-size: 11px; font-weight: bold;">Tham gia</button>
          </div>
        </div>

        <!-- 3 Mã Đề Xuất Cho Học Sinh Tự Do -->
        <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 10px; padding: 9px;">
          <div style="font-size: 12px; font-weight: bold; color: #312e81; margin-bottom: 2px;">Mã đề xuất cho học sinh tự do:</div>
          <div style="font-size: 10.5px; color: #64748b; margin-bottom: 7px;">Học sinh chưa có mã lớp riêng có thể bấm chọn nhanh khối lớp bên dưới:</div>
          
          <div style="display: flex; flex-direction: column; gap: 5px;">
            <!-- Lớp 10 -->
            <div style="background: #ffffff; border: 1px solid #e0e7ff; border-radius: 6px; padding: 6px 9px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: bold; font-size: 11.5px; color: #1e293b;">Lớp 10 - Tự do</div>
                <span class="pill-code">THY6TO</span>
              </div>
              <span style="background: #4f46e5; color: white; padding: 3px 8px; border-radius: 5px; font-size: 11px; font-weight: bold;">Vào lớp</span>
            </div>

            <!-- Lớp 11 -->
            <div style="background: #ffffff; border: 1px solid #e0e7ff; border-radius: 6px; padding: 6px 9px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: bold; font-size: 11.5px; color: #1e293b;">Lớp 11 - Tự do</div>
                <span class="pill-code">WWHXNV</span>
              </div>
              <span style="background: #4f46e5; color: white; padding: 3px 8px; border-radius: 5px; font-size: 11px; font-weight: bold;">Vào lớp</span>
            </div>

            <!-- Lớp 12 -->
            <div style="background: #ffffff; border: 1px solid #e0e7ff; border-radius: 6px; padding: 6px 9px; display: flex; justify-content: space-between; align-items: center;">
              <div>
                <div style="font-weight: bold; font-size: 11.5px; color: #1e293b;">Lớp 12 - Tự do</div>
                <span class="pill-code">W0DBUX</span>
              </div>
              <span style="background: #4f46e5; color: white; padding: 3px 8px; border-radius: 5px; font-size: 11px; font-weight: bold;">Vào lớp</span>
            </div>
          </div>
        </div>

      </div>

      <!-- Cột Phải -->
      <div style="flex: 1.5; min-width: 300px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #f1f5f9; padding-bottom: 6px; margin-bottom: 8px;">
          <div>
            <span style="font-size: 13.5px; font-weight: bold; color: #1e293b;">Lớp 12 - Tự do</span>
            <span class="pill pill-green" style="margin-left: 6px;">Đang tham gia</span>
          </div>
          <span style="color: #ef4444; font-size: 11px; font-weight: 600;">Rời lớp</span>
        </div>

        <div style="font-size: 12px; font-weight: bold; color: #475569; margin-bottom: 6px;">Danh sách bài tập ({2})</div>
        
        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px; margin-bottom: 6px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #1e293b; font-size: 12px;">Đề Ôn Tập Khảo Sát Khối 12</strong>
            <span class="pill pill-green">🟢 Đang mở</span>
          </div>
          <div style="font-size: 10.5px; color: #64748b; margin-top: 3px;">
            ⏱ 45 phút &nbsp;|&nbsp; 🔁 Lần làm: 0/2 &nbsp;|&nbsp; 👁️ Cho xem giải
          </div>
          <div style="text-align: right; margin-top: 4px;">
            <span style="background: #4f46e5; color: white; font-size: 10.5px; font-weight: bold; padding: 2px 10px; border-radius: 5px;">Vào thi</span>
          </div>
        </div>

        <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 8px 10px;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <strong style="color: #64748b; font-size: 12px;">Kiểm Tra 15 Phút: Đạo Hàm</strong>
            <span class="pill pill-red">🔴 Quá hạn</span>
          </div>
          <div style="font-size: 10.5px; color: #94a3b8; margin-top: 3px;">
            Hạn chót: 20:00 - 10/10/2026
          </div>
        </div>

      </div>

    </div>
  </div>
</div>

<div class="callout callout-info">
  <strong>Quy tắc bảo mật mã lớp:</strong><br>
  • Học sinh tự do: Được cung cấp sẵn 3 mã công khai cho 3 khối (10: <span class="pill-code">THY6TO</span>, 11: <span class="pill-code">WWHXNV</span>, 12: <span class="pill-code">W0DBUX</span>).<br>
  • Các lớp học khác của trường hoặc thầy cô: Hoàn toàn được ẩn đi để bảo mật đề thi nội bộ. Học sinh chỉ có thể vào khi được thầy/cô cấp mã riêng.
</div>

<h2>2.3. Quy trình làm bài thi trực tuyến (Online Exam)</h2>
<p>
  Khi bấm <strong>"Vào thi"</strong>, học sinh bước vào giao diện làm bài chuyên nghiệp:
</p>
<ul>
  <li><strong>Đồng hồ đếm ngược:</strong> Hiển thị thời gian còn lại chính xác. Khi hết giờ, bài làm sẽ tự động được gửi về máy chủ.</li>
  <li><strong>Bảng câu hỏi bên phải:</strong> Cho phép chuyển nhanh đến câu bất kỳ, đánh dấu các câu đã chọn và câu còn sót.</li>
  <li><strong>Công thức toán &amp; hình vẽ:</strong> Hiển thị sắc nét bằng chuẩn LaTeX và TikZ vector.</li>
  <li><strong>Chống mất bài:</strong> Hệ thống tự động sao lưu bài làm vào bộ nhớ máy; rớt mạng hay mất điện đăng nhập lại vẫn giữ nguyên bài đã làm.</li>
  <li><strong>Chấm điểm &amp; Lời giải:</strong> Sau khi nộp, điểm số hiển thị tức thì. Học sinh tài khoản PRO được xem toàn bộ lời giải chi tiết từng bước.</li>
</ul>

<!-- MỤC 3: HƯỚNG DẪN DÀNH CHO GIÁO VIÊN -->
<div class="page-break"></div>
<h1>3. Hướng Dẫn Chi Tiết Dành Cho Giáo Viên</h1>

<h2>3.1. Quản lý lớp học &amp; Cấp mã lớp</h2>
<p>
  Tại trang <strong>Lớp học của tôi</strong>, giáo viên có quyền quản lý toàn diện:
</p>
<ul class="step-list">
  <li class="step-item">
    <div class="step-number">1</div>
    <div class="step-content">
      <div class="step-title">Tạo lớp học mới</div>
      <div>Nhập tên lớp vào ô "Tên lớp mới..." (ví dụ: <em>12A1 - Toán Thầy Dũng</em>) rồi nhấn nút <strong>(+)</strong>.</div>
    </div>
  </li>
  <li class="step-item">
    <div class="step-number">2</div>
    <div class="step-content">
      <div class="step-title">Lấy mã lớp gửi học sinh</div>
      <div>Hệ thống sinh mã lớp 6 ký tự viết hoa (ví dụ: <span class="pill-code">ABC123</span>). Giáo viên sao chép mã này gửi cho học sinh trong lớp để tham gia.</div>
    </div>
  </li>
  <li class="step-item">
    <div class="step-number">3</div>
    <div class="step-content">
      <div class="step-title">Thêm / Xóa học sinh</div>
      <div>Giáo viên có thể thêm trực tiếp học sinh bằng email/username qua nút <strong>"+ Thêm HS"</strong>, hoặc xóa học sinh ra khỏi lớp khi cần.</div>
    </div>
  </li>
</ul>

<h2>3.2. Soạn đề thi theo ma trận chuẩn (Exam Generator)</h2>
<p>
  Công cụ <strong>Tạo đề &amp; Ma trận</strong> giúp giáo viên tạo đề thi trắc nghiệm theo đúng phân loại của Bộ GD&amp;ĐT:
</p>
<ul>
  <li><strong>Cấu trúc ma trận:</strong> Phân bổ số lượng câu theo 4 mức độ: <em>Nhận biết (N) - Thông hiểu (H) - Vận dụng (V) - Vận dụng cao (C)</em>.</li>
  <li><strong>3 dạng thức trắc nghiệm:</strong> Nhiều lựa chọn (4 phương án), Đúng/Sai (4 mệnh đề a, b, c, d) và Trả lời ngắn.</li>
  <li><strong>Xuất bản:</strong> Hỗ trợ xuất đề ra định dạng Word (.docx) kèm bảng đáp án và lời giải chi tiết để in phát cho học sinh làm bài trên giấy.</li>
</ul>

<h2>3.3. Giao bài tập LMS nâng cao cho nhiều lớp</h2>
<p>
  Bấm nút <strong>"+ Giao bài"</strong> tại khung Bài tập của lớp để thiết lập thông số:
</p>

<!-- Mockup LMS Config -->
<div class="mockup-card">
  <div class="mockup-header">
    <div class="mockup-dots">
      <div class="mockup-dot dot-red"></div>
      <div class="mockup-dot dot-yellow"></div>
      <div class="mockup-dot dot-green"></div>
    </div>
    <span>MINH HỌA GIAO DIỆN: CẤU HÌNH GIAO BÀI TẬP LMS CHO LỚP HỌC</span>
  </div>
  <div class="mockup-body" style="background: #ffffff;">
    <div style="border: 1px solid #cbd5e1; border-radius: 10px; padding: 10px; background: #f8fafc;">
      <div style="font-weight: bold; color: #1e1b4b; font-size: 12.5px; margin-bottom: 8px;">
        ⚙️ Cấu hình thông số bài tập LMS
      </div>

      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; font-size: 11.5px;">
        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
          <label style="font-weight: bold; color: #475569; display: block;">🕒 Thời gian mở đề:</label>
          <div style="font-family: monospace; color: #1e293b; background: #f1f5f9; padding: 3px; border-radius: 4px; margin-top: 2px;">
            2026-10-15T08:00 (08:00 ngày 15/10/2026)
          </div>
        </div>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
          <label style="font-weight: bold; color: #475569; display: block;">📅 Hạn chót nộp bài:</label>
          <div style="font-family: monospace; color: #1e293b; background: #f1f5f9; padding: 3px; border-radius: 4px; margin-top: 2px;">
            2026-10-16T22:00 (22:00 ngày 16/10/2026)
          </div>
        </div>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
          <label style="font-weight: bold; color: #475569; display: block;">🔁 Số lượt làm tối đa:</label>
          <div style="font-family: monospace; color: #1e293b; background: #f1f5f9; padding: 3px; border-radius: 4px; margin-top: 2px;">
            2 lần (Lấy điểm cao nhất)
          </div>
        </div>

        <div style="background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
          <label style="font-weight: bold; color: #475569; display: block;">👁️ Chế độ xem lời giải:</label>
          <div style="color: #16a34a; font-weight: bold; margin-top: 3px;">
            ☑️ Cho xem giải sau khi nộp
          </div>
        </div>
      </div>

      <div style="margin-top: 8px; background: white; border: 1px solid #e2e8f0; border-radius: 6px; padding: 6px 8px;">
        <label style="font-weight: bold; color: #475569; font-size: 11px;">🏫 Giao đồng thời cho nhiều lớp:</label>
        <div style="display: flex; gap: 8px; margin-top: 3px; font-size: 11px;">
          <span style="background: #eef2ff; color: #4338ca; padding: 2px 7px; border-radius: 4px; font-weight: bold;">☑ 12A1</span>
          <span style="background: #eef2ff; color: #4338ca; padding: 2px 7px; border-radius: 4px; font-weight: bold;">☑ 12A2</span>
          <span style="background: #f1f5f9; color: #64748b; padding: 2px 7px; border-radius: 4px;">☐ 12A3</span>
        </div>
      </div>
    </div>
  </div>
</div>

<h2>3.4. Bảng điểm trực tuyến &amp; Xuất Excel (CSV)</h2>
<ul>
  <li><strong>Cập nhật thời gian thực (Realtime):</strong> Bảng điểm tự động làm mới mỗi 15 giây khi giáo viên đang mở trang.</li>
  <li><strong>Thống kê chi tiết:</strong> Điểm số từng lần làm bài, thời gian nộp chính xác, điểm trung bình toàn lớp.</li>
  <li><strong>Xuất Excel:</strong> Bấm <strong>Xuất Excel</strong> để tải file điểm định dạng CSV chuẩn Unicode tiếng Việt phục vụ báo cáo.</li>
</ul>

<!-- MỤC 4: BẢNG GIÁ & HƯỚNG DẪN NÂNG CẤP PRO -->
<div class="page-break"></div>
<h1>4. Bảng Giá Chi Tiết &amp; Hướng Dẫn Nâng Cấp Tài Khoản PRO</h1>

<p>
  Hệ thống áp dụng chính sách nâng cấp tài khoản PRO với mức chi phí ưu đãi dành riêng cho học sinh và giáo viên. 
  Gói PRO có thời hạn sử dụng <strong>1 năm (365 ngày)</strong> và được tích hợp thanh toán tự động qua <strong>Ngân hàng Quân Đội (MB Bank) / SePay</strong>.
</p>

<!-- BẢNG GIÁ NIÊM YẾT -->
<div class="pricing-grid">
  <!-- Gói Học Sinh -->
  <div class="pricing-card pricing-card-pro">
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 800; color: #166534; font-size: 13px; text-transform: uppercase;">🎓 GÓI PRO HỌC SINH</span>
        <span class="pill pill-green">DÀNH CHO HỌC SINH</span>
      </div>
      <div class="price-tag">200.000đ <span class="price-period">/ 1 năm</span></div>
      <p style="font-size: 11.5px; color: #64748b; margin-bottom: 10px;">Chỉ khoảng ~16.000đ/tháng để bứt phá điểm số môn Toán</p>
      
      <ul style="list-style: none; padding-left: 0; font-size: 12px; line-height: 1.6; color: #334155;">
        <li>✅ <strong>Không giới hạn số lượt thi thử</strong> mỗi ngày</li>
        <li>✅ <strong>Xem 100% lời giải chi tiết</strong> &amp; phương pháp giải nhanh</li>
        <li>✅ <strong>Mở khóa toàn bộ kho thi thích ứng (Adaptive Test)</strong></li>
        <li>✅ <strong>Lưu trữ lịch sử làm bài không giới hạn</strong></li>
        <li>✅ Ưu tiên hỗ trợ giải đáp thắc mắc chuyên môn</li>
      </ul>
    </div>
    <div style="margin-top: 10px; background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 6px; text-align: center; font-size: 11px; color: #15803d; font-weight: bold;">
      Tự động kích hoạt ngay sau khi chuyển khoản
    </div>
  </div>

  <!-- Gói Giáo Viên -->
  <div class="pricing-card pricing-card-pro">
    <div>
      <div style="display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: 800; color: #4338ca; font-size: 13px; text-transform: uppercase;">👨‍🏫 GÓI PRO GIÁO VIÊN</span>
        <span class="pill pill-indigo">DÀNH CHO GIÁO VIÊN</span>
      </div>
      <div class="price-tag">300.000đ <span class="price-period">/ 1 năm</span></div>
      <p style="font-size: 11.5px; color: #64748b; margin-bottom: 10px;">Chỉ 25.000đ/tháng sở hữu trọn bộ công cụ khảo thí chuyên nghiệp</p>
      
      <ul style="list-style: none; padding-left: 0; font-size: 12px; line-height: 1.6; color: #334155;">
        <li>✅ <strong>Quản lý ngân hàng câu hỏi không giới hạn</strong></li>
        <li>✅ <strong>Tạo ma trận &amp; xuất đề thi Word (.docx) / PDF</strong></li>
        <li>✅ <strong>Mở khóa toàn bộ công cụ:</strong> TikZ, IRT, Gán ID, Converter</li>
        <li>✅ <strong>Quản lý lớp học &amp; giao bài tập LMS</strong> không giới hạn</li>
        <li>✅ <strong>Bảng điểm trực tuyến &amp; xuất file Excel</strong> đầy đủ</li>
      </ul>
    </div>
    <div style="margin-top: 10px; background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 8px; padding: 6px; text-align: center; font-size: 11px; color: #4338ca; font-weight: bold;">
      Tự động kích hoạt ngay sau khi chuyển khoản
    </div>
  </div>
</div>

<h2>4.1. Quy trình 4 bước nâng cấp tài khoản PRO tự động (Quét mã QR)</h2>

<div class="step-list">
  <li class="step-item">
    <div class="step-number">1</div>
    <div class="step-content">
      <div class="step-title">Bước 1: Truy cập trang Hồ sơ cá nhân (User Profile)</div>
      <div>Đăng nhập vào hệ thống, bấm vào tên tài khoản ở góc trên cùng bên phải hoặc chọn mục <strong>Hồ sơ cá nhân</strong> trên thanh menu.</div>
    </div>
  </li>

  <li class="step-item">
    <div class="step-number">2</div>
    <div class="step-content">
      <div class="step-title">Bước 2: Bấm nút "Tạo mã thanh toán Pro"</div>
      <div>
        Kéo xuống khung màu tím <em>Nâng cấp lên PRO</em> (hoặc <em>Gia hạn gói PRO</em>), bấm nút <strong>Tạo mã thanh toán Pro</strong>.
        Hệ thống sẽ tự động tính toán số tiền tương ứng theo vai trò của bạn: <strong>200.000đ</strong> (Học sinh) hoặc <strong>300.000đ</strong> (Giáo viên).
      </div>
    </div>
  </li>

  <li class="step-item">
    <div class="step-number">3</div>
    <div class="step-content">
      <div class="step-title">Bước 3: Quét mã QR hoặc Chuyển khoản MB Bank</div>
      <div>
        Màn hình sẽ hiển thị <strong>Mã QR thanh toán</strong> kèm thông tin chi tiết:
        <ul>
          <li><strong>Ngân hàng thụ hưởng:</strong> MB Bank (Ngân hàng Quân Đội).</li>
          <li><strong>Số tiền:</strong> Đúng số tiền hiển thị trên đơn hàng (200.000đ hoặc 300.000đ).</li>
          <li><strong>Nội dung chuyển khoản:</strong> Là mã giao dịch duy nhất do hệ thống tạo (ví dụ: <span class="pill-code">ID6PRO_XXXXXX</span>). <em>Bắt buộc phải giữ nguyên nội dung chuyển khoản để hệ thống tự động nhận diện!</em></li>
        </ul>
      </div>
    </div>
  </li>

  <li class="step-item">
    <div class="step-number">4</div>
    <div class="step-content">
      <div class="step-title">Bước 4: Hệ thống tự động kích hoạt gói PRO trong 10-30 giây</div>
      <div>
        Ngay khi tài khoản MB Bank nhận được tiền, dịch vụ SePay Webhook sẽ tự động cập nhật tài khoản của bạn lên <strong>PRO 1 năm</strong> mà không cần bất kỳ thao tác thủ công nào. 
        Nếu màn hình chưa nhảy trạng thái, bạn chỉ cần bấm nút <strong>"Kiểm tra trạng thái Pro"</strong> để làm mới.
      </div>
    </div>
  </li>
</ul>

<!-- Mockup Màn Hình Thanh Toán QR Tại Hồ Sơ Cá Nhân -->
<div class="mockup-card">
  <div class="mockup-header">
    <div class="mockup-dots">
      <div class="mockup-dot dot-red"></div>
      <div class="mockup-dot dot-yellow"></div>
      <div class="mockup-dot dot-green"></div>
    </div>
    <span>MINH HỌA GIAO DIỆN: THANH TOÁN TỰ ĐỘNG NÂNG CẤP PRO TẠI HỒ SƠ CÁ NHÂN</span>
  </div>
  <div class="mockup-body" style="background: linear-gradient(135deg, #4f46e5 0%, #7e22ce 100%); color: white; border-radius: 8px; padding: 14px;">
    <div style="display: flex; gap: 20px; align-items: center; flex-wrap: wrap;">
      
      <!-- Cột thông tin gói -->
      <div style="flex: 1.2; min-width: 280px;">
        <div style="font-size: 18px; font-weight: 800; margin-bottom: 6px; display: flex; align-items: center; gap: 6px;">
          👑 Nâng cấp lên gói PRO (1 Năm)
        </div>
        <p style="font-size: 12px; color: #e0e7ff; margin-bottom: 10px;">
          Mở khóa toàn bộ tính năng không giới hạn. Tự động kích hoạt ngay sau khi chuyển khoản.
        </p>

        <!-- Khung tài khoản nhận -->
        <div style="background: rgba(255, 255, 255, 0.15); border: 1px solid rgba(255, 255, 255, 0.25); border-radius: 8px; padding: 8px 10px; font-size: 11.5px;">
          <div style="color: #c7d2fe; font-size: 10px; font-weight: bold; text-transform: uppercase;">Ngân hàng Quân Đội (MB Bank)</div>
          <div style="font-family: monospace; font-size: 15px; font-weight: bold; margin: 2px 0;">SỐ TÀI KHOẢN MB CỦA HỆ THỐNG</div>
          <div style="color: #ffffff; font-weight: 600;">CHỦ TÀI KHOẢN HỆ THỐNG KHẢO THÍ</div>
          
          <div style="margin-top: 6px; border-top: 1px dashed rgba(255,255,255,0.25); padding-top: 6px;">
            <div style="color: #fef08a; font-size: 10px; font-weight: bold; text-transform: uppercase;">Nội dung chuyển khoản (bắt buộc đúng mã):</div>
            <div style="background: rgba(0,0,0,0.3); color: #facc15; font-family: monospace; font-weight: bold; padding: 3px 6px; border-radius: 4px; display: inline-block; margin-top: 2px;">
              ID6PRO_98A72F
            </div>
          </div>
        </div>
      </div>

      <!-- Cột QR Code -->
      <div style="flex: 0.8; min-width: 200px; display: flex; flex-direction: column; align-items: center; background: white; border-radius: 12px; padding: 12px; color: #1e293b;">
        <!-- Giả lập QR box -->
        <div style="width: 130px; height: 130px; border: 2px solid #6366f1; border-radius: 8px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f8fafc;">
          <svg width="60" height="60" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" stroke-width="2">
            <rect x="3" y="3" width="7" height="7"></rect>
            <rect x="14" y="3" width="7" height="7"></rect>
            <rect x="14" y="14" width="7" height="7"></rect>
            <rect x="3" y="14" width="7" height="7"></rect>
          </svg>
          <span style="font-size: 9px; color: #6366f1; font-weight: bold; margin-top: 4px;">VIETQR / SEPAY</span>
        </div>
        <div style="font-weight: 800; font-size: 16px; color: #4f46e5; margin-top: 6px;">200.000đ</div>
        <div style="font-size: 10px; color: #64748b;">Mở app ngân hàng quét mã</div>
      </div>

    </div>
  </div>
</div>

<div class="callout callout-warning">
  <strong>3 Lưu ý quan trọng khi chuyển khoản để được kích hoạt tự động 100%:</strong><br>
  1. <strong>Chuyển đúng số tiền:</strong> Chuyển chính xác số tiền hệ thống thông báo (200.000đ cho Học sinh, 300.000đ cho Giáo viên). Không chuyển thiếu hoặc thừa.<br>
  2. <strong>Giữ nguyên nội dung chuyển khoản:</strong> Nội dung chuyển khoản là mã định danh giao dịch duy nhất của bạn. Nếu xóa hoặc gõ sai nội dung, hệ thống không thể tự động nhận diện và bạn phải gửi tin nhắn đối soát thủ công cho Admin.<br>
  3. <strong>Thời hạn mã thanh toán:</strong> Mỗi mã thanh toán có thời hạn hiệu lực trong vòng <strong>24 giờ</strong>. Nếu quá thời gian này bạn chưa chuyển, vui lòng bấm nút "Tạo mã thanh toán Pro" để lấy mã mới.
</div>

<!-- MỤC 5: CÂU HỎI THƯỜNG GẶP (FAQ) -->
<div class="page-break"></div>
<h1>5. Câu Hỏi Thường Gặp (FAQ) &amp; Xử Lý Sự Cố</h1>

<div class="avoid-break">
  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 13px; margin-bottom: 9px;">
    <strong style="color: #1e1b4b; font-size: 13px;">1. Tôi đã chuyển khoản nhưng tài khoản vẫn chưa nhảy lên PRO thì phải làm sao?</strong>
    <p style="margin-top: 3px; color: #334155; font-size: 12.3px;">
      Đầu tiên, bạn hãy quay lại trang <strong>Hồ sơ cá nhân</strong> và nhấn nút <strong>"Kiểm tra trạng thái Pro"</strong> để hệ thống đồng bộ dữ liệu mới nhất. 
      Nếu sau 2-3 phút vẫn chưa được kích hoạt, có thể do bạn gõ sai nội dung chuyển khoản hoặc chuyển sai số tiền. 
      Bạn hãy chụp lại biên lai chuyển khoản (có mã tham chiếu giao dịch) và gửi cho Quản trị viên (Admin) để được đối chiếu và kích hoạt thủ công.
    </p>
  </div>

  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 13px; margin-bottom: 9px;">
    <strong style="color: #1e1b4b; font-size: 13px;">2. Tài khoản PRO của tôi còn 2 tháng nữa mới hết hạn, nếu tôi gia hạn bây giờ thì có bị mất ngày cũ không?</strong>
    <p style="margin-top: 3px; color: #334155; font-size: 12.3px;">
      <strong>Không bị mất.</strong> Hệ thống áp dụng cơ chế cộng dồn thông minh: Khi bạn thanh toán gia hạn, hệ thống sẽ tự động cộng thêm 1 năm (365 ngày) bắt đầu từ ngày hết hạn hiện tại của bạn, bảo toàn 100% thời gian đã mua.
    </p>
  </div>

  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 13px; margin-bottom: 9px;">
    <strong style="color: #1e1b4b; font-size: 13px;">3. Học sinh tự do chưa có mã lớp riêng thì chọn lớp nào để ôn thi?</strong>
    <p style="margin-top: 3px; color: #334155; font-size: 12.3px;">
      Tại trang <strong>Lớp học của tôi</strong>, học sinh chỉ cần bấm trực tiếp vào nút <strong>"Vào lớp"</strong> của khối tương ứng:<br>
      • Khối 10: Lớp 10 - Tự do (Mã <span class="pill-code">THY6TO</span>)<br>
      • Khối 11: Lớp 11 - Tự do (Mã <span class="pill-code">WWHXNV</span>)<br>
      • Khối 12: Lớp 12 - Tự do (Mã <span class="pill-code">W0DBUX</span>)<br>
      Tất cả bài tập chung của khối sẽ hiển thị ngay để bạn ôn luyện.
    </p>
  </div>

  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 13px; margin-bottom: 9px;">
    <strong style="color: #1e1b4b; font-size: 13px;">4. Học sinh tài khoản Free bị giới hạn gì so với tài khoản Pro?</strong>
    <p style="margin-top: 3px; color: #334155; font-size: 12.3px;">
      Học sinh dùng tài khoản Free chỉ được làm tối đa <strong>2 lượt thi thử / ngày</strong> và bị giới hạn xem lời giải chi tiết. 
      Khi nâng cấp lên PRO (200.000đ/năm), học sinh được thi không giới hạn số lần, xem 100% lời giải chi tiết và mở khóa kho luyện thi thích ứng thông minh.
    </p>
  </div>

  <div style="background: #ffffff; border: 1px solid #e2e8f0; border-radius: 10px; padding: 9px 13px; margin-bottom: 9px;">
    <strong style="color: #1e1b4b; font-size: 13px;">5. Đang làm bài thi mà bị mất điện hoặc ngắt kết nối mạng thì có bị mất bài không?</strong>
    <p style="margin-top: 3px; color: #334155; font-size: 12.3px;">
      <strong>Không.</strong> Hệ thống tự động ghi nhận câu trả lời sau từng thao tác click và lưu vào bộ nhớ tạm của trình duyệt. 
      Khi có điện hoặc có mạng trở lại, học sinh chỉ cần mở lại trang bài thi, toàn bộ các câu trả lời đã chọn sẽ được khôi phục nguyên vẹn.
    </p>
  </div>
</div>

<div class="callout callout-purple" style="margin-top: 18px; text-align: center;">
  <strong>HỆ THỐNG KHẢO THÍ VÀ QUẢN LÝ HỌC TẬP TRỰC TUYẾN</strong><br>
  Hỗ trợ kỹ thuật &amp; Đối soát giao dịch: Vui lòng liên hệ Quản trị viên hệ thống hoặc sử dụng tính năng <em>Báo lỗi câu hỏi</em> trên thanh điều hướng.
</div>

</body>
</html>
"""

def generate_pdf():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.dirname(script_dir)
    
    html_path = os.path.join(project_root, "HUONG_DAN_SU_DUNG.html")
    pdf_path = os.path.join(project_root, "HUONG_DAN_SU_DUNG_HE_THONG_THI.pdf")
    docs_pdf_path = os.path.join(project_root, "docs", "HUONG_DAN_SU_DUNG_HE_THONG_THI.pdf")
    
    with open(html_path, "w", encoding="utf-8") as f:
        f.write(HTML_CONTENT)
    print(f"[OK] Da tao file HTML: {html_path}")
    
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Google\Chrome\Application\chrome.exe"
    ]
    
    browser_exe = None
    for p in edge_paths:
        if os.path.exists(p):
            browser_exe = p
            break
            
    if not browser_exe:
        print("[ERROR] Khong tim thay trinh duyet Edge hoac Chrome!")
        sys.exit(1)
        
    print(f"[INFO] Su dung browser: {browser_exe}")
    
    file_url = f"file:///{os.path.abspath(html_path).replace(os.sep, '/')}"
    
    cmd = [
        browser_exe,
        "--headless=new",
        "--disable-gpu",
        "--run-all-compositor-stages-before-draw",
        "--no-pdf-header-footer",
        f"--print-to-pdf={pdf_path}",
        file_url
    ]
    
    print("[INFO] Dang render sang PDF...")
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    
    if os.path.exists(pdf_path) and os.path.getsize(pdf_path) > 0:
        print(f"[SUCCESS] Da tao thanh cong file PDF: {pdf_path} (Kich thuoc: {os.path.getsize(pdf_path)} bytes)")
        # Copy to docs/ as well
        shutil.copyfile(pdf_path, docs_pdf_path)
        print(f"[SUCCESS] Da sao chep vao thu muc docs: {docs_pdf_path}")
    else:
        print(f"[ERROR] Tao PDF that bai. Stderr: {result.stderr}")
        sys.exit(1)

if __name__ == "__main__":
    generate_pdf()
