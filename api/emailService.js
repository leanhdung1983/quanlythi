import nodemailer from 'nodemailer';

/**
 * Cấu hình Transporter gửi email
 * Đọc từ biến môi trường: SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE
 */
let transporter = null;

export function getTransporter() {
    if (transporter) return transporter;

    const host = process.env.SMTP_HOST;
    const port = parseInt(process.env.SMTP_PORT || '587');
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = process.env.SMTP_SECURE === 'true' || port === 465;

    if (host && user && pass) {
        transporter = nodemailer.createTransport({
            host,
            port,
            secure,
            auth: { user, pass },
            tls: {
                rejectUnauthorized: process.env.NODE_ENV === 'production'
            }
        });
        console.log(`📧 [EMAIL] Đã kết nối máy chủ SMTP: ${host}:${port} (tài khoản: ${user})`);
    } else {
        transporter = null;
    }
    return transporter;
}

/**
 * Gửi email đặt lại mật khẩu kèm mã OTP 6 chữ số
 */
export async function sendPasswordResetEmail({ to, fullName, otp, expiresMinutes = 15 }) {
    const sender = process.env.SMTP_FROM || process.env.SMTP_USER || '"Hệ thống Khảo thí ID6" <no-reply@id6.edu.vn>';
    const subject = `[ID6] Mã xác nhận đặt lại mật khẩu: ${otp}`;
    
    const html = `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
        <meta charset="utf-8">
        <title>Mã đặt lại mật khẩu</title>
        <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; margin: 0; padding: 24px; color: #1e293b; }
            .container { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 32px 24px; text-align: center; color: #ffffff; }
            .header h1 { margin: 0; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
            .header p { margin: 8px 0 0 0; opacity: 0.9; font-size: 13px; }
            .body { padding: 32px 24px; line-height: 1.6; }
            .greeting { font-size: 16px; font-weight: 600; color: #0f172a; margin-bottom: 12px; }
            .otp-box { background: #f0fdf4; border: 2px dashed #22c55e; border-radius: 12px; padding: 20px; text-align: center; margin: 24px 0; }
            .otp-code { font-family: monospace; font-size: 32px; font-weight: 900; letter-spacing: 6px; color: #15803d; }
            .otp-note { margin-top: 8px; font-size: 12px; color: #166534; font-weight: 500; }
            .warning { font-size: 13px; color: #64748b; background: #f8fafc; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #f59e0b; margin-top: 20px; }
            .footer { padding: 20px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #f1f5f9; background: #fcfcfc; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Hệ Sinh Thái Khảo Thí ID6</h1>
                <p>Khôi phục & Đặt lại mật khẩu</p>
            </div>
            <div class="body">
                <div class="greeting">Xin chào ${fullName || 'bạn'},</div>
                <p>Hệ thống nhận được yêu cầu khôi phục mật khẩu cho tài khoản liên kết với địa chỉ email này. Vui lòng sử dụng mã OTP dưới đây để hoàn tất việc kích hoạt và đặt lại mật khẩu mới:</p>
                
                <div class="otp-box">
                    <div class="otp-code">${otp}</div>
                    <div class="otp-note">Mã xác nhận có hiệu lực trong vòng ${expiresMinutes} phút</div>
                </div>

                <div class="warning">
                    <strong>Lưu ý bảo mật:</strong> Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này hoặc liên hệ ngay với giáo viên quản lý của bạn. Tuyệt đối không chia sẻ mã này cho bất kỳ ai.
                </div>
            </div>
            <div class="footer">
                &copy; ${new Date().getFullYear()} ID6 Question Bank & Exam System. All rights reserved.
            </div>
        </div>
    </body>
    </html>
    `;

    const mailClient = getTransporter();
    if (!mailClient) {
        console.warn(`⚠️ [EMAIL] Chưa cấu hình SMTP. Mã OTP cho tài khoản ${to} (${fullName}) là: [${otp}]`);
        return {
            delivered: false,
            simulated: true,
            otp,
            message: 'Hệ thống đang hoạt động ở chế độ thử nghiệm. Mã OTP đã được sinh thành công.'
        };
    }

    try {
        const info = await mailClient.sendMail({
            from: sender,
            to,
            subject,
            html,
            text: `Xin chào ${fullName || 'bạn'},\nMã xác thực đặt lại mật khẩu ID6 của bạn là: ${otp}.\nMã có hiệu lực trong ${expiresMinutes} phút.`
        });
        console.log(`✅ [EMAIL] Đã gửi email đặt lại mật khẩu tới ${to}: ${info.messageId}`);
        return { delivered: true, messageId: info.messageId };
    } catch (err) {
        console.error(`❌ [EMAIL] Lỗi gửi email tới ${to}:`, err.message);
        return {
            delivered: false,
            error: err.message,
            otp,
            message: 'Không thể kết nối máy chủ email SMTP.'
        };
    }
}
