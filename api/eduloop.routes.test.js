import express from 'express';
import { beforeAll, afterAll, beforeEach, describe, it, expect, vi } from 'vitest';
let user, manager, member, row, updated;
vi.mock('./core.js', () => ({
    canManageClass: async () => manager,
    query: async (sql, params) => {
        if (sql.includes('FROM class_students')) return member ? [{}] : [];
        if (sql.includes('FROM eduloop_recommendations')) return row ? [row] : [];
        if (sql.startsWith('UPDATE eduloop')) { if (row.status !== 'PENDING') return { affectedRows: 0 }; updated = params; return { affectedRows: 1 }; }
        if (sql.includes('FROM exam_results')) return [];
        if (sql.includes('FROM questions q JOIN question_types')) return [{ id: 4, id_full: '2D1H1-1', type: 'TN' }];
        return [];
    }
}));
let server, base, approvedPractice;
beforeAll(async () => {
    const routes = await import('./routes/eduloop.routes.js'); approvedPractice = routes.approvedPractice;
    const app = express(); app.use(express.json()); app.use((req, _res, next) => { req.user = user; next(); }); app.use(routes.default);
    server = await new Promise(resolve => { const s = app.listen(0, '127.0.0.1', () => resolve(s)); });
    base = `http://127.0.0.1:${server.address().port}`;
});
afterAll(() => server?.close());
beforeEach(() => {
    user = { id: 7, role: 'STUDENT' }; manager = false; member = true; updated = null;
    row = { id: 1, class_id: 2, student_id: 7, created_by: 9, status: 'PENDING', payload: [{ question_id: 4, skill: '2D1H1-1', reason: 'Evidence' }] };
});
const decision = status => fetch(base + '/eduloop/recommendations/1/decision', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, note: 'Teacher review' }) });
describe('EduLoop authorization and approval', () => {
    it('offers real practice forms without requiring or inventing student history', async () => {
        const response = await fetch(base + '/eduloop/practice-catalog');
        expect(response.status).toBe(200);
        const result = await response.json();
        expect(result.data[0].key).toBe('2-D-1-1-1');
        expect(result.data[0].available).toBe(1);
        expect(result.data[0]).not.toHaveProperty('rate');
        expect(result.data[0]).not.toHaveProperty('attempts');
    });
    it('allows self map, blocks other student and unmanaged class', async () => {
        expect((await fetch(base + '/eduloop/map')).status).toBe(200);
        expect((await fetch(base + '/eduloop/map?student_id=8')).status).toBe(403);
        expect((await fetch(base + '/eduloop/map?class_id=2')).status).toBe(403);
    });
    it('student cannot approve and teacher must own class and active membership', async () => {
        expect((await decision('APPROVED')).status).toBe(403);
        user = { id: 9, role: 'TEACHER' };
        expect((await decision('APPROVED')).status).toBe(403);
        manager = true; member = false;
        expect((await decision('APPROVED')).status).toBe(403);
        member = true;
        expect((await decision('APPROVED')).status).toBe(200);
        expect(updated).toEqual(['APPROVED', 'Teacher review', 9, 1]);
        row.status = 'APPROVED'; expect((await decision('REJECTED')).status).toBe(409);
    });
    it('approved practice cannot bypass approval or access another student', async () => {
        const req = () => ({ user, body: { recommendation_id: 1 } });
        await expect(approvedPractice(req())).rejects.toMatchObject({ status: 409 });
        row.status = 'REJECTED'; await expect(approvedPractice(req())).rejects.toMatchObject({ status: 409 });
        row.status = 'APPROVED'; user.id = 8; await expect(approvedPractice(req())).rejects.toMatchObject({ status: 403 });
        user.id = 7; member = false; await expect(approvedPractice(req())).rejects.toMatchObject({ status: 403 });
        member = true; expect((await approvedPractice(req())).data[0].id).toBe(4);
        row.payload[0].skill = '2D1V1-2'; await expect(approvedPractice(req())).rejects.toMatchObject({ status: 409 });
    });
    it('validates decisions and progress authorization', async () => {
        user = { id: 9, role: 'TEACHER' }; manager = true;
        expect((await decision('UNKNOWN')).status).toBe(400);
        user = { id: 8, role: 'STUDENT' }; manager = false;
        expect((await fetch(base + '/eduloop/recommendations/1/progress')).status).toBe(403);
    });
});
