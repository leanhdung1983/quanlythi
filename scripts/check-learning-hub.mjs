// Read-only diagnostics. Never import core.js (its startup can seed the database).
import "dotenv/config";
import mysql from "mysql2/promise";
import { readFile } from "node:fs/promises";
import { normalizeLearningCatalog } from '../shared/learningGrades.js';
const cloud =
  process.env.DB_HOST && !/localhost|127\.0\.0\.1/.test(process.env.DB_HOST);
const db = await mysql.createConnection({
  host: process.env.DB_HOST || "127.0.0.1",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "id6_question_bank",
  port: Number(process.env.DB_PORT || 3306),
  connectTimeout: 15000,
  ssl: cloud
    ? {
        minVersion: "TLSv1.2",
        rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== "false",
      }
    : undefined,
});
try {
  // TiDB does not implement READ ONLY transactions. This script issues SELECTs only.
  // Run the production catalog query verbatim; no duplicated diagnostic SQL.
  const source = await readFile(
    new URL("../api/routes/learningHub.routes.js", import.meta.url),
    "utf8",
  );
  const sql = source.match(
    /query\(\s*`(SELECT u\.id,[\s\S]*?)`,\s*\[\s*req\.user\.id/,
  )?.[1];
  if (!sql) throw new Error("Catalog SQL not found");
  const [accounts] = await db.query(
    "SELECT id FROM users WHERE role='ADMIN' LIMIT 1",
  );
  const id = accounts[0]?.id || 0;
  const started = performance.now();
  const [catalog] = await db.query(sql, [id, id, id, "ADMIN"]);
  const [counts] = await db.query(
    "SELECT (SELECT COUNT(*) FROM lesson_sections) AS sections,(SELECT COUNT(*) FROM user_lesson_progress) AS progress,(SELECT COUNT(*) FROM lesson_authoring_drafts) AS drafts",
  );
  console.log(
    JSON.stringify({
      ok: true,
      catalog_units: catalog.length,
      units_by_stored_grade: catalog.reduce((counts, unit) => { counts[unit.grade_code] = (counts[unit.grade_code] || 0) + 1; return counts; }, {}),
      units_by_display_grade: normalizeLearningCatalog(catalog).reduce((counts, unit) => { counts[unit.grade_code] = (counts[unit.grade_code] || 0) + 1; return counts; }, {}),
      query_ms: Math.round(performance.now() - started),
      counts: counts[0],
      missing_names: catalog.filter(
        (u) => !u.name || !u.chapter_name || !u.subject_name,
      ).length,
      read_only: true,
    }),
  );
} finally {
  await db.end();
}
