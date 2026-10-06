import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'node:fs/promises';
// Deliberately avoids importing core.js: no seed or unrelated DB mutations.
const cloud = process.env.DB_HOST && !/localhost|127\.0\.0\.1/.test(process.env.DB_HOST);
const conn = await mysql.createConnection({ host: process.env.DB_HOST || '127.0.0.1', user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '', database: process.env.DB_NAME || 'id6_question_bank', port: Number(process.env.DB_PORT || 3306),
    ssl: cloud ? { minVersion: 'TLSv1.2', rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' } : undefined });
try {
    const sql = await fs.readFile(new URL('../migrations/20261006_eduloop.sql', import.meta.url), 'utf8');
    await conn.query(sql);
    console.log('EduLoop migration complete. Existing tables unchanged.');
} finally { await conn.end(); }
