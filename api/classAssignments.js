export function assignmentInput(body) {
    const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
    if (!Array.isArray(body.class_ids) || !body.class_ids.length || body.class_ids.length > 100) fail('Chọn từ 1 đến 100 lớp.');
    const ids = [...new Set(body.class_ids.map(Number))].sort((a, b) => a - b);
    const matrixId = Number(body.matrix_id);
    if (![...ids, matrixId].every(id => Number.isSafeInteger(id) && id > 0)) fail('Mã lớp hoặc ma trận không hợp lệ.');
    const open = body.open_time ? new Date(body.open_time) : null;
    const deadline = body.deadline ? new Date(body.deadline) : null;
    if ((open && isNaN(open.getTime())) || (deadline && isNaN(deadline.getTime()))) fail('Thời gian giao bài không hợp lệ.');
    if (open && deadline && open >= deadline) fail('Hạn nộp phải sau thời gian mở đề.');
    const attempts = Number(body.max_attempts ?? 0);
    if (!Number.isSafeInteger(attempts) || attempts < 0) fail('Số lượt thi phải là số nguyên không âm.');
    if (body.allow_review !== undefined && typeof body.allow_review !== 'boolean') fail('Quyền xem lời giải không hợp lệ.');
    return { ids, matrixId, open, deadline, attempts, review: body.allow_review === false ? 0 : 1 };
}

export async function assignClasses(pool, user, body) {
    const input = assignmentInput(body);
    const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
    if (!user || !['ADMIN', 'TEACHER'].includes(user.role)) fail(403, 'Chỉ giáo viên được giao bài.');
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        // Both single and bulk assignments lock classes in a stable order to prevent duplicate inserts.
        const [classes] = await conn.query(`SELECT id, teacher_id FROM classes WHERE id IN (${input.ids.map(() => '?').join(',')}) ORDER BY id FOR UPDATE`, input.ids);
        if (classes.length !== input.ids.length) fail(404, 'Có lớp không còn tồn tại.');
        if (user.role !== 'ADMIN' && classes.some(c => Number(c.teacher_id) !== Number(user.id))) fail(403, 'Bạn không có quyền giao bài cho một trong các lớp đã chọn.');
        const [[matrix]] = await conn.query('SELECT created_by, is_public FROM matrix_templates WHERE id = ? FOR UPDATE', [input.matrixId]);
        if (!matrix) fail(404, 'Ma trận không tồn tại.');
        if (user.role !== 'ADMIN' && !Number(matrix.is_public) && Number(matrix.created_by) !== Number(user.id)) fail(403, 'Bạn không có quyền sử dụng ma trận này.');
        const assigned = [], skipped = [];
        for (const id of input.ids) {
            const [existing] = await conn.query('SELECT id FROM class_assignments WHERE class_id = ? AND matrix_id = ?', [id, input.matrixId]);
            if (existing.length) { skipped.push(id); continue; }
            await conn.query('INSERT INTO class_assignments (class_id, matrix_id, open_time, deadline, max_attempts, allow_review) VALUES (?, ?, ?, ?, ?, ?)', [id, input.matrixId, input.open, input.deadline, input.attempts, input.review]);
            assigned.push(id);
        }
        await conn.commit();
        return { assigned, skipped };
    } catch (error) { await conn.rollback(); throw error; }
    finally { conn.release(); }
}
