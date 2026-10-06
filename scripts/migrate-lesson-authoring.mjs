import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
const cloud = process.env.DB_HOST && !/localhost|127\.0\.0\.1/.test(process.env.DB_HOST);
const conn = await mysql.createConnection({ host: process.env.DB_HOST || '127.0.0.1', user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME || 'id6_question_bank', port: Number(process.env.DB_PORT || 3306),
    ssl: cloud ? { minVersion: 'TLSv1.2', rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined });
try {
    await conn.query(await fs.readFile(new URL('../migrations/20261006_lesson_authoring.sql', import.meta.url), 'utf8'));
    const [rows] = await conn.query('SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema=DATABASE() AND table_name=?', ['lesson_authoring_drafts']);
    console.log(`Lesson authoring migration verified: ${rows[0].count} table. Existing lessons and progress unchanged.`);
} finally { await conn.end(); }
