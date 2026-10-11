import express from 'express';
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

let calls = [];
let queryResults = [];
let currentUser = { id: 1, role: 'ADMIN' };

vi.mock('./core.js', () => ({
    query: vi.fn(async (sql, params) => {
        calls.push({ sql, params });
        return queryResults.shift() || [];
    }),
    loginAttempts: new Map(),
    signSession: () => 'signed-token',
    isAdmin: req => req.user?.role === 'ADMIN',
    isSelfOrAdmin: (req, userId) => req.user?.role === 'ADMIN' || Number(req.user?.id) === Number(userId),
    requireAdmin: (req, res) => {
        if (req.user?.role !== 'ADMIN') {
            res.status(403).json({ error: 'Chỉ Quản trị viên mới được phép thực hiện thao tác này.' });
            return false;
        }
        return true;
    },
    SESSION_DURATION_MS: 3600000
}));

let server, baseUrl;
beforeAll(async () => {
    const { default: router } = await import('./routes/auth.routes.js');
    const app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
        req.user = currentUser;
        next();
    });
    app.use('/api', router);
    server = await new Promise(resolve => {
        const instance = app.listen(0, '127.0.0.1', () => resolve(instance));
    });
    baseUrl = `http://127.0.0.1:${server.address().port}/api`;
});

beforeEach(() => {
    calls = [];
    queryResults = [];
    currentUser = { id: 1, role: 'ADMIN' };
});

afterAll(() => server?.close());

describe('Auth routes role handling', () => {
    it('registers a teacher directly with TEACHER role without requiring code', async () => {
        queryResults = [
            [],
            { insertId: 99 }
        ];

        const res = await fetch(`${baseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'gv_toan_01',
                password: 'password12345',
                full_name: 'Nguyễn Văn Giáo',
                role: 'TEACHER'
            })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.role).toBe('TEACHER');

        const insertCall = calls.find(c => c.sql.includes('INSERT INTO users'));
        expect(insertCall).toBeDefined();
        expect(insertCall.params[5]).toBe('TEACHER');
    });

    it('registers a normal student with STUDENT role', async () => {
        queryResults = [
            [],
            { insertId: 100 }
        ];

        const res = await fetch(`${baseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'hocsinh_01',
                password: 'password12345',
                role: 'STUDENT'
            })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.role).toBe('STUDENT');
        const insertCall = calls.find(c => c.sql.includes('INSERT INTO users'));
        expect(insertCall.params[5]).toBe('STUDENT');
    });

    it('admin creates a user with TEACHER role via POST /users', async () => {
        queryResults = [
            [],
            { insertId: 101 }
        ];

        const res = await fetch(`${baseUrl}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'gv_created_by_admin',
                password: 'password123',
                full_name: 'Cô Lan',
                role: 'TEACHER'
            })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.role).toBe('TEACHER');
        const insertCall = calls.find(c => c.sql.includes('INSERT INTO users'));
        expect(insertCall.params[5]).toBe('TEACHER');
    });

    it('admin updates user role to TEACHER via PUT /users/:id/profile', async () => {
        queryResults = [
            { affectedRows: 1 }
        ];

        const res = await fetch(`${baseUrl}/users/42/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: 'Thầy Hùng',
                role: 'TEACHER'
            })
        });

        expect(res.status).toBe(200);
        const updateCall = calls.find(c => c.sql.includes('UPDATE users SET'));
        expect(updateCall).toBeDefined();
        expect(updateCall.sql).toContain('role = ?');
        expect(updateCall.params).toContain('TEACHER');
    });

    it('non-admin user cannot escalate role via profile update', async () => {
        currentUser = { id: 42, role: 'STUDENT' };
        queryResults = [
            { affectedRows: 1 }
        ];

        const res = await fetch(`${baseUrl}/users/42/profile`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                full_name: 'Em Nam',
                role: 'TEACHER'
            })
        });

        expect(res.status).toBe(200);
        const updateCall = calls.find(c => c.sql.includes('UPDATE users SET'));
        expect(updateCall.sql).not.toContain('role = ?');
    });
});
