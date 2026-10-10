import express from 'express';
import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
const mocks = vi.hoisted(() => ({ settle: vi.fn(), create: vi.fn(), query: vi.fn() }));
vi.mock('./core.js', () => ({ pool: {}, query: mocks.query, requireAdmin: (req, res) => req.user?.role === 'ADMIN' || (res.status(403).json({ error: 'Forbidden' }), false) }));
vi.mock('./payments.js', async importOriginal => ({ ...await importOriginal(), settleTransfer: mocks.settle, createPaymentOrder: mocks.create }));
let server, base;
beforeAll(async () => {
    const { default: router } = await import('./routes/payments.routes.js');
    const app = express();
    app.use(express.json());
    app.use((req, res, next) => { if (req.get('x-test-role')) req.user = { id: 7, role: req.get('x-test-role') }; next(); });
    app.use(router);
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    base = `http://127.0.0.1:${server.address().port}`;
});
afterAll(async () => { vi.unstubAllEnvs(); await new Promise(resolve => server.close(resolve)); });
beforeEach(() => {
    vi.clearAllMocks();
    for (const [key, value] of Object.entries({ PAYMENT_ENABLED: '1', PAYMENT_MB_ACCOUNT: '0123456789', PAYMENT_MB_ACCOUNT_NAME: 'TEST', SEPAY_WEBHOOK_KEY: 'x'.repeat(32) })) vi.stubEnv(key, value);
});
const transfer = { id: 1, gateway: 'MBBank', accountNumber: '0123456789', transferType: 'in', transferAmount: 100000, content: 'ID6PRO' + 'A'.repeat(24) };
const webhook = (auth, body = transfer) => fetch(base + '/payments/sepay/webhook', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(auth ? { Authorization: auth } : {}) }, body: JSON.stringify(body) });
describe('payment API authorization', () => {
    it('rejects missing and wrong keys without processing', async () => {
        expect((await webhook()).status).toBe(401);
        expect((await webhook('Apikey incorrect')).status).toBe(401);
        expect(mocks.settle).not.toHaveBeenCalled();
    });
    it('allows a valid webhook without a browser session and acknowledges successful processing', async () => {
        mocks.settle.mockResolvedValue('PAID');
        const res = await webhook('Apikey ' + 'x'.repeat(32));
        expect(res.status).toBe(200);
        expect(await res.json()).toEqual({ success: true, status: 'PAID' });
        expect(mocks.settle).toHaveBeenCalledOnce();
    });
    it('returns retriable errors on database failure', async () => {
        mocks.settle.mockRejectedValue(new Error('DB down'));
        expect((await webhook('Apikey ' + 'x'.repeat(32))).status).toBe(500);
    });
    it('does not accept webhooks while disabled', async () => {
        vi.stubEnv('PAYMENT_ENABLED', '0');
        expect((await webhook('Apikey ' + 'x'.repeat(32))).status).toBe(503);
        expect(mocks.settle).not.toHaveBeenCalled();
    });
    it('requires login for orders and uses authenticated user instead of request body', async () => {
        expect((await fetch(base + '/payments/pro/orders', { method: 'POST' })).status).toBe(401);
        mocks.create.mockResolvedValue({ code: 'test' });
        expect((await fetch(base + '/payments/pro/orders', { method: 'POST', headers: { 'x-test-role': 'STUDENT', 'Content-Type': 'application/json' }, body: JSON.stringify({ user_id: 999, amount: 1 }) })).status).toBe(200);
        expect(mocks.create.mock.calls[0][1]).toBe(7);
    });
    it('scopes status checks to the authenticated owner', async () => {
        mocks.query.mockResolvedValue([]);
        expect((await fetch(base + '/payments/pro/orders/OTHER', { headers: { 'x-test-role': 'STUDENT' } })).status).toBe(404);
        expect(mocks.query.mock.calls[0][1]).toEqual(['OTHER', 7]);
    });
    it('restricts the transaction list to admins', async () => {
        expect((await fetch(base + '/admin/payments', { headers: { 'x-test-role': 'STUDENT' } })).status).toBe(403);
        expect(mocks.query).not.toHaveBeenCalled();
    });
});
