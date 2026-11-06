import bcrypt from 'bcryptjs';
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



    it('forgot-password generates OTP and returns debug OTP in simulation', async () => {
        queryResults = [
            [{ id: 10, username: 'hocsinh_a', full_name: 'Nguyễn Văn A', email: 'hocsinha@gmail.com' }],
            { affectedRows: 1 }
        ];

        const res = await fetch(`${baseUrl}/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'hocsinha@gmail.com' })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);
        expect(data.debug_otp).toBeDefined();
        expect(data.debug_otp).toMatch(/^\d{6}$/);

        const updateCall = calls.find(c => c.sql.includes('UPDATE users SET reset_password_otp = ?'));
        expect(updateCall).toBeDefined();
        expect(updateCall.params[0]).toBe(data.debug_otp);
    });

    it('reset-password validates OTP and updates password hash', async () => {
        const futureDate = new Date(Date.now() + 10 * 60 * 1000);
        queryResults = [
            [{ id: 10, username: 'hocsinh_a', reset_password_otp: '654321', reset_password_expires: futureDate }],
            { affectedRows: 1 }
        ];

        const res = await fetch(`${baseUrl}/reset-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'hocsinha@gmail.com',
                otp: '654321',
                new_password: 'new_password_2026'
            })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);

        const updateCall = calls.find(c => c.sql.includes('UPDATE users SET password_hash = ?'));
        expect(updateCall).toBeDefined();
        expect(updateCall.params[1]).toBe(10);
    });

    it('change-password verifies current password and updates password hash', async () => {
        currentUser = { id: 10, role: 'STUDENT' };
        const currentHash = await bcrypt.hash('old_pass_123', 10);
        queryResults = [
            [{ id: 10, password_hash: currentHash }],
            { affectedRows: 1 }
        ];

        const res = await fetch(`${baseUrl}/change-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                current_password: 'old_pass_123',
                new_password: 'new_secure_password_456'
            })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);

        const updateCall = calls.find(c => c.sql.includes('UPDATE users SET password_hash = ? WHERE id = ?'));
        expect(updateCall).toBeDefined();
        expect(updateCall.params[1]).toBe(10);
    });

    it('student registration stores extended student fields', async () => {
        queryResults = [
            [], // username exists check
            [], // email exists check
            { insertId: 105 }
        ];

        const res = await fetch(`${baseUrl}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                username: 'em_linh_10a1',
                password: 'password2026',
                full_name: 'Trần Thị Linh',
                email: 'linh@gmail.com',
                school: 'THPT Chu Văn An',
                role: 'STUDENT',
                phone: '0912345678',
                parent_phone: '0987654321',
                class_name: '10A1',
                grade_id: 10,
                gender: 'Nữ'
            })
        });

        expect(res.status).toBe(200);
        const data = await res.json();
        expect(data.success).toBe(true);

        const insertCall = calls.find(c => c.sql.includes('INSERT INTO users'));
        expect(insertCall).toBeDefined();
        // check phone, parent_phone, class_name
        expect(insertCall.params).toContain('0912345678');
        expect(insertCall.params).toContain('0987654321');
        expect(insertCall.params).toContain('10A1');
        expect(insertCall.params).toContain(10);
        expect(insertCall.params).toContain('Nữ');
    });

});
