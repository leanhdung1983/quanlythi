import { describe, it, expect, vi } from 'vitest';
import { paymentConfig, validWebhookKey, parseTransfer, settleTransfer, createPaymentOrder } from './payments.js';

const config = paymentConfig({ PAYMENT_ENABLED: '1', PAYMENT_MB_ACCOUNT: '0123456789', PAYMENT_MB_ACCOUNT_NAME: 'TEST', SEPAY_WEBHOOK_KEY: 'x'.repeat(32) });
const code = 'ID6PRO' + 'A'.repeat(24);
const body = { id: 123, gateway: 'MBBank', accountNumber: config.account, transferType: 'in', transferAmount: 100000, content: `MB ${code} thanh toan`, referenceCode: 'FT123' };

function database(order = { id: 1, user_id: 7, amount: 100000, status: 'PENDING', valid: 1 }) {
    let row = { ...order };
    let entries = new Map();
    let renewals = 0;
    let snapshot;
    let fail = false;
    const conn = {
        beginTransaction: vi.fn(async () => { snapshot = { row: { ...row }, entries: new Map(entries), renewals }; }),
        commit: vi.fn(async () => {}),
        rollback: vi.fn(async () => { row = snapshot.row; entries = snapshot.entries; renewals = snapshot.renewals; }),
        release: vi.fn(),
        query: vi.fn(async (sql, params) => {
            if (sql.startsWith('INSERT INTO pro_payment_transactions')) {
                if (entries.has(params[0])) throw Object.assign(new Error('duplicate'), { code: 'ER_DUP_ENTRY' });
                entries.set(params[0], 'RECEIVED'); return [{ affectedRows: 1 }];
            }
            if (sql.startsWith('SELECT *,expires_at')) return [[row]];
            if (sql.startsWith('UPDATE users')) {
                if (fail) throw new Error('DB unavailable');
                renewals++; return [{ affectedRows: 1 }];
            }
            if (sql.startsWith('UPDATE pro_payment_orders')) { row.status = 'PAID'; return [{ affectedRows: 1 }]; }
            if (sql.startsWith('UPDATE pro_payment_transactions')) { entries.set(params[2], params[1]); return [{ affectedRows: 1 }]; }
            throw new Error('Unexpected query: ' + sql);
        })
    };
    return { pool: { getConnection: async () => conn }, conn, entries: () => entries, renewals: () => renewals, fail: value => { fail = value; } };
}

describe('MB automatic Pro payments', () => {
    it('fails closed without configuration or a strong webhook key', () => {
        expect(paymentConfig({}).enabled).toBe(false);
        expect(paymentConfig({ PAYMENT_ENABLED: '1', SEPAY_WEBHOOK_KEY: 'short' }).enabled).toBe(false);
        expect(config.enabled).toBe(true);
        expect(config.studentPrice).toBe(200000);
        expect(validWebhookKey(`Apikey ${config.key}`, config.key)).toBe(true);
        expect(validWebhookKey('Apikey wrong', config.key)).toBe(false);
        expect(validWebhookKey(undefined, config.key)).toBe(false);
    });
    it('only accepts incoming MB transfers into the configured account', () => {
        expect(parseTransfer(body, config)).toMatchObject({ id: '123', amount: 100000, code });
        for (const change of [{ transferType: 'out' }, { accountNumber: '99999' }, { gateway: 'Vietcombank' }, { id: null }, { id: 0 }, { id: Number.MAX_SAFE_INTEGER + 1 }, { transferAmount: 0 }, { transferAmount: 1.5 }]) expect(parseTransfer({ ...body, ...change }, config)).toBeNull();
        expect(parseTransfer({ ...body, content: `${code} ID6PRO${'B'.repeat(24)}` }, config).code).toBeNull();
    });
    it('activates once, acknowledges retries, and does not extend twice for another transfer to the paid order', async () => {
        const db = database();
        const transfer = parseTransfer(body, config);
        expect(await settleTransfer(db.pool, transfer)).toBe('PAID');
        expect(await settleTransfer(db.pool, transfer)).toBe('DUPLICATE');
        expect(await settleTransfer(db.pool, { ...transfer, id: '124' })).toBe('ORDER_ALREADY_PAID');
        expect(db.renewals()).toBe(1);
        expect(db.conn.query.mock.calls.find(([sql]) => sql.startsWith('UPDATE users'))[0]).toContain('GREATEST(COALESCE(expiry_date,NOW()),NOW())');
    });
    it.each([
        [{ amount: 300000 }, 'AMOUNT_MISMATCH'],
        [{ valid: 0 }, 'EXPIRED_ORDER']
    ])('records rejected payment without granting Pro: %s', async (change, expected) => {
        const db = database({ id: 1, user_id: 7, amount: 100000, status: 'PENDING', valid: 1, ...change });
        expect(await settleTransfer(db.pool, parseTransfer(body, config))).toBe(expected);
        expect(db.renewals()).toBe(0);
        expect(db.entries().get('123')).toBe(expected);
    });
    it('records unmatched codes for reconciliation', async () => {
        const db = database();
        expect(await settleTransfer(db.pool, { ...parseTransfer(body, config), code: null })).toBe('UNMATCHED');
        expect(db.renewals()).toBe(0);
    });
    it('rolls back the ledger on DB failure so a retry can activate', async () => {
        const db = database();
        db.fail(true);
        await expect(settleTransfer(db.pool, parseTransfer(body, config))).rejects.toThrow('DB unavailable');
        expect(db.entries().size).toBe(0);
        db.fail(false);
        expect(await settleTransfer(db.pool, parseTransfer(body, config))).toBe('PAID');
        expect(db.renewals()).toBe(1);
    });
    it('uses the server role price and reuses an existing pending order', async () => {
        const conn = { beginTransaction: vi.fn(), commit: vi.fn(), rollback: vi.fn(), release: vi.fn(), query: vi.fn(async (sql, params) => {
            if (sql.includes('FROM users')) return [[{ id: 7, role: 'TEACHER' }]];
            expect(params).toEqual([7, 300000]);
            return [[{ id: 1, user_id: 7, amount: 300000, code, status: 'PENDING' }]];
        }) };
        const result = await createPaymentOrder({ getConnection: async () => conn }, 7, config);
        expect(result.amount).toBe(300000);
        expect(result.qr_url).toContain(code);
        expect(conn.query).toHaveBeenCalledTimes(2);
    });
});
