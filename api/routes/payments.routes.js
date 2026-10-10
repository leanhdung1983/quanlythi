import express from 'express';
import { pool, query, requireAdmin } from '../core.js';
import { paymentConfig, validWebhookKey, parseTransfer, createPaymentOrder, settleTransfer, presentOrder } from '../payments.js';

const router = express.Router();

router.post('/payments/sepay/webhook', async (req, res) => {
    const config = paymentConfig();
    if (!config.enabled) return res.status(503).json({ success: false, error: 'Thanh toán tự động chưa được cấu hình.' });
    if (!validWebhookKey(req.get('authorization'), config.key)) return res.status(401).json({ success: false });
    const transfer = parseTransfer(req.body, config);
    if (!transfer) return res.json({ success: true, status: 'IGNORED' });
    try {
        const status = await settleTransfer(pool, transfer);
        res.json({ success: true, status });
    } catch (error) {
        console.error('[Payments] Settlement failed:', error.code || 'unknown');
        res.status(500).json({ success: false, error: 'Không xử lý được giao dịch. Vui lòng gửi lại.' });
    }
});

router.post('/payments/pro/orders', async (req, res) => {
    if (!req.user?.id) return res.status(401).json({ error: 'Vui lòng đăng nhập.' });
    const config = paymentConfig();
    if (!config.enabled) return res.status(503).json({ error: 'Thanh toán tự động chưa được cấu hình. Vui lòng liên hệ quản trị viên.' });
    try { res.json({ success: true, data: await createPaymentOrder(pool, req.user.id, config) }); }
    catch (error) { res.status(error.status || 500).json({ error: error.status ? error.message : 'Không tạo được yêu cầu thanh toán.' }); }
});

router.get('/payments/pro/orders/:code', async (req, res) => {
    if (!req.user?.id) return res.status(401).json({ error: 'Vui lòng đăng nhập.' });
    try {
        const [order] = await query('SELECT *,expires_at<=NOW() AS expired FROM pro_payment_orders WHERE code=? AND user_id=?', [req.params.code, req.user.id]);
        if (!order) return res.status(404).json({ error: 'Không tìm thấy yêu cầu thanh toán.' });
        const [user] = await query('SELECT is_pro,expiry_date FROM users WHERE id=?', [req.user.id]);
        res.json({ success: true, data: presentOrder({ ...order, status: order.status === 'PENDING' && Number(order.expired) ? 'EXPIRED' : order.status }, paymentConfig()), user });
    } catch { res.status(500).json({ error: 'Không kiểm tra được thanh toán.' }); }
});

router.get('/admin/payments', async (req, res) => {
    if (!requireAdmin(req, res)) return;
    try {
        const rows = await query(`SELECT t.*,o.code,u.username FROM pro_payment_transactions t
            LEFT JOIN pro_payment_orders o ON o.id=t.order_id LEFT JOIN users u ON u.id=o.user_id
            ORDER BY t.created_at DESC LIMIT 200`);
        res.json({ success: true, data: rows, enabled: paymentConfig().enabled });
    } catch { res.status(500).json({ error: 'Không tải được giao dịch.' }); }
});

export default router;
