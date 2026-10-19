import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';

// Load parsed 26 lessons metadata
const lessons = JSON.parse(fs.readFileSync('scripts/parsed_all_26_lessons.json', 'utf8'));
console.log(`Loaded ${lessons.length} lessons from scripts/parsed_all_26_lessons.json`);

async function syncLessonsToDB() {
  const db = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'id6_question_bank',
    port: Number(process.env.DB_PORT || 3306),
    ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: false }
  });

  try {
    console.log('Connected to DB.');

    // 1. Get Grade 12 ID
    const [grades] = await db.query("SELECT id, code FROM grades WHERE code IN ('2', '12') ORDER BY CASE WHEN code = '2' THEN 1 ELSE 2 END LIMIT 1");
    if (!grades.length) throw new Error('Grade 12 not found');
    const gradeId = grades[0].id;
    console.log(`Using Grade 12 (id: ${gradeId}, code: ${grades[0].code})`);

    // 2. Ensure Subject IDs
    const [subjects] = await db.query("SELECT id, code FROM subjects");
    const subjMap = new Map(subjects.map(s => [s.code, s.id]));
    const mathSubjId = subjMap.get('D') || subjMap.get('T') || subjects[0].id;
    const geomSubjId = subjMap.get('H') || mathSubjId;

    // 3. Ensure Chapters 1 to 7 exist for Grade 12
    const chapterDefs = [
      { num: 1, name: 'Ứng dụng đạo hàm để khảo sát và vẽ đồ thị của hàm số', subj: mathSubjId },
      { num: 2, name: 'Toạ độ của vectơ trong không gian', subj: geomSubjId },
      { num: 3, name: 'Các số đặc trưng đo mức độ phân tán cho mẫu số liệu ghép nhóm', subj: mathSubjId },
      { num: 4, name: 'Nguyên hàm, tích phân và ứng dụng', subj: mathSubjId },
      { num: 5, name: 'Phương trình mặt phẳng, đường thẳng, mặt cầu trong không gian Oxyz', subj: geomSubjId },
      { num: 6, name: 'Một số yếu tố xác suất', subj: mathSubjId },
      { num: 7, name: 'Ôn tập cuối năm toàn diện', subj: mathSubjId }
    ];

    const chapterIdMap = new Map();

    for (const cDef of chapterDefs) {
      const [existing] = await db.query(
        "SELECT id, name FROM chapters WHERE grade_id = ? AND chapter_number = ? LIMIT 1",
        [gradeId, cDef.num]
      );
      if (existing.length) {
        chapterIdMap.set(cDef.num, existing[0].id);
        console.log(`Chapter ${cDef.num} exists (id: ${existing[0].id}): ${existing[0].name}`);
      } else {
        const [res] = await db.query(
          "INSERT INTO chapters (grade_id, subject_id, chapter_number, name) VALUES (?, ?, ?, ?)",
          [gradeId, cDef.subj, cDef.num, cDef.name]
        );
        chapterIdMap.set(cDef.num, res.insertId);
        console.log(`Created Chapter ${cDef.num} (id: ${res.insertId}): ${cDef.name}`);
      }
    }

    // 4. Define precise unit targets for each lesson
    const unitConfigs = [
      // CHƯƠNG I: Đạo hàm (SGK KNTT)
      {
        lessonIdx: 0, // toan12_bai1
        chNum: 1,
        findSql: "SELECT id FROM units WHERE id = 83",
        createData: { uNum: 1, name: 'Bài 1: Tính đơn điệu của hàm số' }
      },
      {
        lessonIdx: 0, // toan12_bai1 also attached to extreme points unit
        chNum: 1,
        findSql: "SELECT id FROM units WHERE id = 84",
        createData: { uNum: 2, name: 'Bài 1: Cực trị của hàm số' }
      },
      {
        lessonIdx: 1, // toan12_bai2
        chNum: 1,
        findSql: "SELECT id FROM units WHERE id = 85",
        createData: { uNum: 3, name: 'Bài 2: Giá trị lớn nhất và nhỏ nhất của hàm số' }
      },
      {
        lessonIdx: 2, // toan12_bai3
        chNum: 1,
        findSql: "SELECT id FROM units WHERE id = 86",
        createData: { uNum: 4, name: 'Bài 3: Đường tiệm cận của đồ thị hàm số' }
      },
      {
        lessonIdx: 3, // toan12_bai4
        chNum: 1,
        findSql: "SELECT id FROM units WHERE id = 87",
        createData: { uNum: 5, name: 'Bài 4: Khảo sát sự biến thiên và vẽ đồ thị của hàm số' }
      },
      {
        lessonIdx: 4, // toan12_bai5
        chNum: 1,
        findSql: "SELECT id FROM units WHERE chapter_id = ? AND unit_number = 6",
        createData: { uNum: 6, name: 'Bài 5: Ứng dụng đạo hàm giải quyết vấn đề thực tiễn' }
      },
      {
        lessonIdx: 5, // toan12_ontap_chuong1
        chNum: 1,
        findSql: "SELECT id FROM units WHERE chapter_id = ? AND unit_number = 7",
        createData: { uNum: 7, name: 'Bài tập cuối chương I: Ứng dụng đạo hàm' }
      },

      // CHƯƠNG II: Vectơ & Oxyz
      {
        lessonIdx: 6, // toan12_bai6
        chNum: 2,
        findSql: "SELECT id FROM units WHERE id = 95",
        createData: { uNum: 1, name: 'Bài 6: Vectơ trong không gian' }
      },
      {
        lessonIdx: 7, // toan12_bai7
        chNum: 2,
        findSql: "SELECT id FROM units WHERE id = 96",
        createData: { uNum: 2, name: 'Bài 7: Hệ toạ độ trong không gian' }
      },
      {
        lessonIdx: 8, // toan12_bai8
        chNum: 2,
        findSql: "SELECT id FROM units WHERE chapter_id = ? AND unit_number = 3",
        createData: { uNum: 3, name: 'Bài 8: Biểu thức toạ độ của các phép toán vectơ' }
      },
      {
        lessonIdx: 9, // toan12_ontap_chuong2
        chNum: 2,
        findSql: "SELECT id FROM units WHERE chapter_id = ? AND unit_number = 4",
        createData: { uNum: 4, name: 'Bài tập cuối chương II: Vectơ và toạ độ trong không gian' }
      },

      // CHƯƠNG III: Thống kê
      {
        lessonIdx: 10, // toan12_bai9
        chNum: 3,
        findSql: "SELECT id FROM units WHERE id = 88",
        createData: { uNum: 1, name: 'Bài 9: Khoảng biến thiên và khoảng tứ phân vị của mẫu số liệu ghép nhóm' }
      },
      {
        lessonIdx: 11, // toan12_bai10
        chNum: 3,
        findSql: "SELECT id FROM units WHERE id = 89",
        createData: { uNum: 2, name: 'Bài 10: Phương sai và độ lệch chuẩn của mẫu số liệu ghép nhóm' }
      },
      {
        lessonIdx: 12, // toan12_ontap_chuong3
        chNum: 3,
        findSql: "SELECT id FROM units WHERE chapter_id = ? AND unit_number = 3",
        createData: { uNum: 3, name: 'Bài tập cuối chương III: Các số đặc trưng đo mức độ phân tán' }
      },

      // CHƯƠNG IV: Tích phân
      {
        lessonIdx: 13, // toan12_bai11
        chNum: 4,
        findSql: "SELECT id FROM units WHERE id = 90",
        createData: { uNum: 1, name: 'Bài 11: Nguyên hàm' }
      },
      {
        lessonIdx: 14, // toan12_bai12
        chNum: 4,
        findSql: "SELECT id FROM units WHERE id = 91",
        createData: { uNum: 2, name: 'Bài 12: Tích phân' }
      },
      {
        lessonIdx: 15, // toan12_bai13
        chNum: 4,
        findSql: "SELECT id FROM units WHERE id = 92",
        createData: { uNum: 3, name: 'Bài 13: Ứng dụng hình học của tích phân' }
      },
      {
        lessonIdx: 16, // toan12_ontap_chuong4
        chNum: 4,
        findSql: "SELECT id FROM units WHERE chapter_id = ? AND unit_number = 4",
        createData: { uNum: 4, name: 'Bài tập cuối chương IV: Nguyên hàm, tích phân và ứng dụng' }
      },

      // CHƯƠNG V: Oxyz
      {
        lessonIdx: 17, // toan12_bai14
        chNum: 5,
        findSql: "SELECT id FROM units WHERE id = 97",
        createData: { uNum: 1, name: 'Bài 14: Phương trình mặt phẳng' }
      },
      {
        lessonIdx: 18, // toan12_bai15
        chNum: 5,
        findSql: "SELECT id FROM units WHERE id = 98",
        createData: { uNum: 2, name: 'Bài 15: Phương trình đường thẳng trong không gian' }
      },
      {
        lessonIdx: 19, // toan12_bai16
        chNum: 5,
        findSql: "SELECT id FROM units WHERE chapter_id = ? AND (unit_number = 4 OR name LIKE '%góc%')",
        createData: { uNum: 4, name: 'Bài 16: Công thức tính góc trong không gian' }
      },
      {
        lessonIdx: 20, // toan12_bai17
        chNum: 5,
        findSql: "SELECT id FROM units WHERE id = 99",
        createData: { uNum: 3, name: 'Bài 17: Phương trình mặt cầu trong không gian' }
      },
      {
        lessonIdx: 21, // toan12_ontap_chuong5
        chNum: 5,
        findSql: "SELECT id FROM units WHERE chapter_id = ? AND unit_number = 5",
        createData: { uNum: 5, name: 'Bài tập cuối chương V: Phương pháp toạ độ trong không gian Oxyz' }
      },

      // CHƯƠNG VI: Xác suất
      {
        lessonIdx: 22, // toan12_bai18
        chNum: 6,
        findSql: "SELECT id FROM units WHERE id = 93",
        createData: { uNum: 1, name: 'Bài 18: Xác suất có điều kiện' }
      },
      {
        lessonIdx: 23, // toan12_bai19
        chNum: 6,
        findSql: "SELECT id FROM units WHERE id = 94",
        createData: { uNum: 2, name: 'Bài 19: Công thức xác suất toàn phần và công thức Bayes' }
      },
      {
        lessonIdx: 24, // toan12_ontap_chuong6
        chNum: 6,
        findSql: "SELECT id FROM units WHERE chapter_id = ? AND unit_number = 3",
        createData: { uNum: 3, name: 'Bài tập cuối chương VI: Xác suất có điều kiện và công thức Bayes' }
      },

      // CHƯƠNG VII: Ôn tập cuối năm
      {
        lessonIdx: 25, // toan12_ontap_cuoinam
        chNum: 7,
        findSql: "SELECT id FROM units WHERE chapter_id = ? AND unit_number = 1",
        createData: { uNum: 1, name: 'Bài tập ôn tập cuối năm: Toàn bộ chương trình Toán lớp 12' }
      }
    ];

    let sectionsCreated = 0;

    for (const cfg of unitConfigs) {
      const lesson = lessons[cfg.lessonIdx];
      const chId = chapterIdMap.get(cfg.chNum);

      let unitId = null;

      // Check existing
      const params = cfg.findSql.includes('?') ? [chId] : [];
      const [found] = await db.query(cfg.findSql, params);

      if (found.length) {
        unitId = found[0].id;
      } else {
        const [ins] = await db.query(
          "INSERT INTO units (chapter_id, unit_number, name) VALUES (?, ?, ?)",
          [chId, cfg.createData.uNum, cfg.createData.name]
        );
        unitId = ins.insertId;
        console.log(`Created new unit (id: ${unitId}, unit_number: ${cfg.createData.uNum}): ${cfg.createData.name}`);
      }

      console.log(`Processing Lesson [${lesson.lessonKey}] -> Unit ID ${unitId}`);

      // Clear old sections for this unit
      await db.query("DELETE FROM lesson_sections WHERE unit_id = ?", [unitId]);

      const lessonDir = lesson.href.split('/')[0];
      const fullUrl = `/toan12/${lesson.href}`;
      const labsUrl = `/toan12/${lessonDir}/index.html#labs`;
      const arenaUrl = `/toan12/${lessonDir}/index.html#arena`;
      const badgesUrl = `/toan12/${lessonDir}/index.html#badges`;

      const sectionRows = [
        {
          title: `📖 Bản Đồ Tri Thức & Lý Thuyết Cốt Lõi`,
          content: `### ${lesson.title}\n\n**Chủ đề:** ${lesson.tag}\n\n**Trọng tâm kiến thức:**\n${lesson.desc}\n\n💡 *Trải nghiệm không gian học tập tương tác số hóa với KaTeX offline sắc nét, 2 phòng thí nghiệm mô phỏng động, đấu trường 10 câu trắc nghiệm và hệ thống chứng nhận danh dự.*`,
          interactive_html: fullUrl,
          order_index: 1
        },
        {
          title: `🧪 Phòng Thí Nghiệm Động (Canvas 2D/3D)`,
          content: `### Mô Phỏng Trực Quan & Thí Nghiệm Số\n\n**Các trạm thí nghiệm thực hành:**\n${lesson.labs ? `- ${lesson.labs}` : '- Khảo sát tương tác với mô hình động thời gian thực.'}\n\n👉 *Học sinh trực tiếp kéo thanh trượt tham số để quan sát sự thay đổi tức thì của hàm số, vectơ hoặc hình học không gian.*`,
          interactive_html: labsUrl,
          order_index: 2
        },
        {
          title: `⚔️ Đấu Trường Trắc Nghiệm 10 Câu (Arena Quiz)`,
          content: `### Đấu Trường Trắc Nghiệm Tương Tác 10 Câu\n\n- Tích hợp âm thanh Web Audio API phản hồi tức thì khi chọn đáp án.\n- Lời giải chi tiết và phân tích cặn kẽ sau mỗi câu hỏi.\n- Điểm số tự động đồng bộ lên hồ sơ học tập của bạn ngay sau khi hoàn thành.`,
          interactive_html: arenaUrl,
          order_index: 3
        },
        {
          title: `🏆 Bảng Vàng Thành Tích, Huy Hiệu & Bằng Khen A4`,
          content: `### Vinh Danh & Chứng Nhận Hoàn Thành\n\n- Mở khóa 5 huy hiệu danh giá theo từng mốc tiến trình.\n- Cấp Giấy chứng nhận hoàn thành bài học chuẩn in A4 mang tên bạn.`,
          interactive_html: badgesUrl,
          order_index: 4
        }
      ];

      for (const s of sectionRows) {
        await db.query(
          "INSERT INTO lesson_sections (unit_id, title, content, interactive_html, order_index) VALUES (?, ?, ?, ?, ?)",
          [unitId, s.title, s.content, s.interactive_html, s.order_index]
        );
        sectionsCreated++;
      }
    }

    console.log(`\n🎉 SYNC COMPLETED SUCCESSFULLY!`);
    console.log(`- Total Sections Created: ${sectionsCreated}`);

  } finally {
    await db.end();
  }
}

syncLessonsToDB().catch(console.error);
