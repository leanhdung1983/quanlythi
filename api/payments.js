import crypto from 'node:crypto';

export const paymentSchema = [
    `CREATE TABLE IF NOT EXISTS pro_payment_orders (
        id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL, code VARCHAR(40) NOT NULL UNIQUE,
        amount INT UNSIGNED NOT NULL, status VARCHAR(16) NOT NULL DEFAULT 'PENDING',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL, paid_at DATETIME NULL,
        INDEX(user_id, status)
    ) ENGINE=InnoDB`,
    `CREATE TABLE IF NOT EXISTS pro_payment_transactions (
        transaction_id VARCHAR(64) PRIMARY KEY, order_id BIGINT UNSIGNED NULL,
        amount BIGINT UNSIGNED NOT NULL, reference_code VARCHAR(128) NULL,
        status VARCHAR(32) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB`
];

export function paymentConfig(env = process.env) {
    const rawKey = String(env.SEPAY_WEBHOOK_KEY || '').trim().replace(/^["']|["']$/g, '');
    const key = rawKey;
    const rawAccount = String(env.PAYMENT_MB_ACCOUNT || '').trim().replace(/^["']|["']$/g, '').replace(/[\s.-]/g, '');
    const account = rawAccount;
    const accountName = String(env.PAYMENT_MB_ACCOUNT_NAME || '').trim().replace(/^["']|["']$/g, '');
    const studentPrice = Number(String(env.PRO_STUDENT_PRICE || 200000).replace(/[.,đ\s"']/g, ''));
    const teacherPrice = Number(String(env.PRO_TEACHER_PRICE || 300000).replace(/[.,đ\s"']/g, ''));
    const rawEnabled = String(env.PAYMENT_ENABLED || '').trim().toLowerCase();
    const isEnabled = rawEnabled === '1' || rawEnabled === 'true' || rawEnabled === 'yes' || rawEnabled === 'on';
    const enabled = isEnabled && key.length >= 32 && /^\d{6,30}$/.test(account)
        && !!accountName.trim() && [studentPrice, teacherPrice].every(n => Number.isSafeInteger(n) && n > 0 && n <= 100000000);
    return { enabled, key, account, accountName, studentPrice, teacherPrice };
}

export function paymentDiagnostics(env = process.env) {
    const cfg = paymentConfig(env);
    const rawEnabled = String(env.PAYMENT_ENABLED || '').trim().toLowerCase();
    const isEnabled = rawEnabled === '1' || rawEnabled === 'true' || rawEnabled === 'yes' || rawEnabled === 'on';
    const issues = [];
    if (!isEnabled) issues.push(`PAYMENT_ENABLED chưa bật (hiện tại: '${env.PAYMENT_ENABLED || ''}', cần đặt là '1' hoặc 'true')`);
    if (!cfg.account || !/^\d{6,30}$/.test(cfg.account)) issues.push(`PAYMENT_MB_ACCOUNT không hợp lệ (cần 6-30 số, hiện tại: '${cfg.account || 'trống'}')`);
    if (!cfg.accountName) issues.push(`PAYMENT_MB_ACCOUNT_NAME còn trống`);
    if (cfg.key.length < 32) issues.push(`SEPAY_WEBHOOK_KEY quá ngắn (cần tối thiểu 32 ký tự, hiện tại: ${cfg.key.length} ký tự)`);
    if (![cfg.studentPrice, cfg.teacherPrice].every(n => Number.isSafeInteger(n) && n > 0 && n <= 100000000)) issues.push(`Giá gói PRO_STUDENT_PRICE hoặc PRO_TEACHER_PRICE không hợp lệ`);
    return { enabled: cfg.enabled, issues };
}

export function validWebhookKey(header, key) {
    if (!key || typeof header !== 'string') return false;
    const expected = Buffer.from(`Apikey ${key}`);
    const actual = Buffer.from(header);
    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export function parseTransfer(body, config) {
    if (!body || body.transferType !== 'in' || String(body.accountNumber) !== config.account
        || !['MB', 'MBBank'].includes(body.gateway)) return null;
    const id = String(body.id ?? '');
    const amount = Number(body.transferAmount);
    if (!/^\d{1,64}$/.test(id) || /^0+$/.test(id) || (typeof body.id === 'number' && !Number.isSafeInteger(body.id)) || !Number.isSafeInteger(amount) || amount <= 0) return null;
    // Reject ambiguous content instead of assigning money to the wrong order.
    const codes = [...new Set(`${body.code || ''} ${body.content || ''}`.toUpperCase().match(/\bID6PRO[A-F0-9]{24}\b/g) || [])];
    return { id, amount, code: codes.length === 1 ? codes[0] : null, reference: String(body.referenceCode || '').slice(0, 128) };
}

export function presentOrder(order, config) {
    return { ...order, amount: Number(order.amount), account: config.account, account_name: config.accountName,
        qr_url: `https://img.vietqr.io/image/MB-${config.account}-compact.png?amount=${order.amount}&addInfo=${encodeURIComponent(order.code)}&accountName=${encodeURIComponent(config.accountName)}` };
}

export async function createPaymentOrder(pool, userId, config) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const [[user]] = await conn.query('SELECT id,role FROM users WHERE id=? FOR UPDATE', [userId]);
        if (!user || !['STUDENT', 'TEACHER'].includes(user.role)) throw Object.assign(new Error('Tài khoản không hỗ trợ mua gói Pro.'), { status: 403 });
        const amount = user.role === 'TEACHER' ? config.teacherPrice : config.studentPrice;
        const [[existing]] = await conn.query("SELECT * FROM pro_payment_orders WHERE user_id=? AND status='PENDING' AND expires_at>NOW() AND amount=? ORDER BY id DESC LIMIT 1", [userId, amount]);
        let order = existing;
        if (!order) {
            const code = `ID6PRO${crypto.randomBytes(12).toString('hex').toUpperCase()}`;
            const [result] = await conn.query("INSERT INTO pro_payment_orders(user_id,code,amount,expires_at) VALUES (?,?,?,DATE_ADD(NOW(), INTERVAL 24 HOUR))", [userId, code, amount]);
            [[order]] = await conn.query('SELECT * FROM pro_payment_orders WHERE id=?', [result.insertId]);
        }
        await conn.commit();
        return presentOrder(order, config);
    } catch (error) { await conn.rollback(); throw error; }
    finally { conn.release(); }
}

export async function settleTransfer(pool, transfer) {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        // The unique transaction ID also serializes concurrent webhook retries.
        await conn.query("INSERT INTO pro_payment_transactions(transaction_id,amount,reference_code,status) VALUES (?,?,?,'RECEIVED')", [transfer.id, transfer.amount, transfer.reference]);
        const [[order]] = transfer.code ? await conn.query('SELECT *,expires_at>NOW() AS valid FROM pro_payment_orders WHERE code=? FOR UPDATE', [transfer.code]) : [[]];
        let status = 'UNMATCHED';
        if (order) {
            status = order.status === 'PAID' ? 'ORDER_ALREADY_PAID' : !Number(order.valid) ? 'EXPIRED_ORDER' : transfer.amount !== Number(order.amount) ? 'AMOUNT_MISMATCH' : 'PAID';
            if (status === 'PAID') {
                const [result] = await conn.query("UPDATE users SET is_pro=1,expiry_date=DATE_ADD(GREATEST(COALESCE(expiry_date,NOW()),NOW()), INTERVAL 1 YEAR) WHERE id=?", [order.user_id]);
                if (!result.affectedRows) status = 'USER_NOT_FOUND';
                else await conn.query("UPDATE pro_payment_orders SET status='PAID',paid_at=NOW() WHERE id=?", [order.id]);
            }
        }
        await conn.query('UPDATE pro_payment_transactions SET order_id=?,status=? WHERE transaction_id=?', [order?.id || null, status, transfer.id]);
        await conn.commit();
        return status;
    } catch (error) {
        await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY') return 'DUPLICATE';
        throw error;
    } finally { conn.release(); }
}
