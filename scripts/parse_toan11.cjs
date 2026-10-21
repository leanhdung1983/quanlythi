const fs = require('fs');

function parseToan11() {
  const content = fs.readFileSync('Toan 11/index.html', 'utf8');

  const gradientColors = {
    1: { color: 'from-indigo-600 to-violet-700', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    2: { color: 'from-cyan-600 to-blue-700', badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    3: { color: 'from-emerald-600 to-teal-700', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    4: { color: 'from-amber-600 to-orange-700', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
    5: { color: 'from-sky-600 to-blue-700', badgeColor: 'bg-sky-50 text-sky-700 border-sky-200' },
    6: { color: 'from-teal-600 to-emerald-700', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' },
    7: { color: 'from-pink-600 to-rose-700', badgeColor: 'bg-pink-50 text-pink-700 border-pink-200' },
    8: { color: 'from-indigo-600 to-violet-700', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    9: { color: 'from-teal-600 to-cyan-700', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' },
    10: { color: 'from-amber-600 to-orange-700', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
    11: { color: 'from-emerald-600 to-teal-700', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
  };

  const chapterThemeColors = {
    1: 'indigo',
    2: 'cyan',
    3: 'emerald',
    4: 'amber',
    5: 'sky',
    6: 'teal',
    7: 'pink',
    8: 'indigo',
    9: 'teal',
    10: 'amber',
    11: 'emerald'
  };

  const chapters = [];
  const lessons = [];

  const sections = content.split('<section class="chapter-section"');
  let chapterIndex = 0;
  let unitIndex = 0;

  for (let i = 1; i < sections.length; i++) {
    const section = sections[i];
    chapterIndex++;

    const badgeMatch = section.match(/<span class="chapter-badge"[^>]*>([\s\S]*?)<\/span>/);
    const h2Match = section.match(/<h2>([^<]+)<\/h2>/);
    const pMatch = section.match(/<\/h2>\s*<p>([\s\S]*?)<\/p>/);

    let rawBadge = badgeMatch ? badgeMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : `Chương ${chapterIndex}`;
    let chName = h2Match ? h2Match[1].replace(/&amp;/g, '&').trim() : `Chương ${chapterIndex}`;
    let chDesc = pMatch ? pMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : `Chương ${chapterIndex} Toán 11 Kết Nối Tri Thức.`;

    const grad = gradientColors[chapterIndex] || gradientColors[10];

    chapters.push({
      num: chapterIndex,
      name: chName,
      badge: rawBadge,
      desc: chDesc,
      color: grad.color,
      badgeColor: grad.badgeColor
    });

    const articleRegex = /<article class="lesson-card[^"]*"([^>]*)>([\s\S]*?)<\/article>/g;
    let artMatch;
    while ((artMatch = articleRegex.exec(section)) !== null) {
      unitIndex++;
      const artAttr = artMatch[1];
      const artBody = artMatch[2];

      const tagMatch = artBody.match(/<span class="lesson-tag"[^>]*>([\s\S]*?)<\/span>/);
      const tag = tagMatch ? tagMatch[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim() : `Bài ${unitIndex}`;

      const titleMatch = artBody.match(/<h3 class="lesson-title">([^<]+)<\/h3>/);
      let title = titleMatch ? titleMatch[1].replace(/&amp;/g, '&').trim() : `Bài ${unitIndex}`;

      const descMatch = artBody.match(/<p class="lesson-desc">([\s\S]*?)<\/p>/);
      const desc = descMatch ? descMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim() : title;

      const labMatch = artBody.match(/<div class="lesson-labs-box">[\s\S]*?<span>(.*?)<\/span>/);
      let labs = '🧪 2 Labs Canvas • ⚔️ Đấu trường';
      if (labMatch) {
        labs = labMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim();
      }

      const linkMatch = artBody.match(/href="([^"#]+\/index\.html)[^"]*"/);
      let folder = '';
      if (linkMatch) {
        const fullLink = linkMatch[1];
        folder = fullLink.split('/')[0];
      } else {
        const idMatch = artAttr.match(/id="([^"]+)"/);
        folder = idMatch ? idMatch[1] : `bai${unitIndex}`;
      }

      lessons.push({
        id: folder,
        folder: folder,
        chapterNumber: chapterIndex,
        chapterName: chName,
        chapterBadge: `Chương ${chapterIndex} · ${tag.split('•')[0].trim()}`,
        themeColor: chapterThemeColors[chapterIndex] || 'indigo',
        unitNumber: unitIndex,
        title: title,
        tag: tag.split('•')[0].trim(),
        desc: desc,
        labs: labs,
        url: `/toan11/${folder}/index.html`
      });
    }
  }

  return { chapters, lessons };
}

console.log('Re-parsing Toan 11...');
const t11 = parseToan11();
console.log(`Toan 11 chapters: ${t11.chapters.length}, lessons: ${t11.lessons.length}`);
fs.writeFileSync('tmp_toan11.json', JSON.stringify(t11, null, 2));

let g11Ts = `export interface Grade11Lesson {
  id: string;
  folder: string;
  chapterNumber: number;
  chapterName: string;
  chapterBadge: string;
  themeColor: string;
  unitNumber: number;
  title: string;
  tag: string;
  desc: string;
  labs: string;
  url: string;
}

export const GRADE_11_CHAPTERS = ${JSON.stringify(t11.chapters, null, 2)};

export const GRADE_11_LESSONS: Grade11Lesson[] = ${JSON.stringify(t11.lessons, null, 2)};
`;

fs.writeFileSync('src/data/grade11Lessons.ts', g11Ts, 'utf8');
console.log('Updated src/data/grade11Lessons.ts successfully');
