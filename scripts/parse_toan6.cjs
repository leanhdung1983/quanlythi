const fs = require('fs');
const path = require('path');

// 1. PARSE TOÁN 6
function parseToan6() {
  const content = fs.readFileSync('Toan 6/index.html', 'utf8');

  // Regex chapters
  // <div class="chapter-block" data-chapter="ch1">
  //   <div class="chapter-title-bar">
  //     <h3>Chương I: Tập Hợp Các Số Tự Nhiên</h3>
  // or <div class="chapter-block" data-chapter="exp"> ...
  
  const chapterColors = {
    1: 'indigo',
    2: 'cyan',
    3: 'emerald',
    4: 'amber',
    5: 'rose',
    6: 'purple',
    7: 'sky',
    8: 'teal',
    9: 'indigo',
    10: 'amber'
  };

  const gradientColors = {
    1: { color: 'from-indigo-600 to-violet-700', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    2: { color: 'from-cyan-600 to-blue-700', badgeColor: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
    3: { color: 'from-emerald-600 to-teal-700', badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    4: { color: 'from-amber-600 to-orange-700', badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
    5: { color: 'from-rose-600 to-pink-700', badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
    6: { color: 'from-purple-600 to-fuchsia-700', badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
    7: { color: 'from-sky-600 to-blue-700', badgeColor: 'bg-sky-50 text-sky-700 border-sky-200' },
    8: { color: 'from-teal-600 to-emerald-700', badgeColor: 'bg-teal-50 text-teal-700 border-teal-200' },
    9: { color: 'from-indigo-600 to-violet-700', badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
    10: { color: 'from-amber-500 via-yellow-500 to-orange-600', badgeColor: 'bg-amber-50 text-amber-800 border-amber-300' }
  };

  const chapters = [];
  const lessons = [];

  // Match volume sections and chapter blocks
  const chapterBlockRegex = /<div class="chapter-block" data-chapter="([^"]+)">([\s\S]*?)<\/div>\s*<\/div>/g;
  let chMatch;
  let chapterIndex = 0;
  let unitIndex = 0;

  // Let's split by chapter blocks more reliably
  const chParts = content.split('<div class="chapter-block"');
  for (let i = 1; i < chParts.length; i++) {
    const part = chParts[i];
    chapterIndex++;
    
    const h3Match = part.match(/<div class="chapter-title-bar">[\s\S]*?<h3>([^<]+)<\/h3>/);
    let fullChapterTitle = h3Match ? h3Match[1].trim() : `Chương ${chapterIndex}`;
    
    // Extract chapter name
    let chName = fullChapterTitle;
    let chNum = chapterIndex;
    if (fullChapterTitle.includes(':')) {
      const sp = fullChapterTitle.split(':');
      chName = sp.slice(1).join(':').trim();
    }

    const grad = gradientColors[chNum] || gradientColors[10];

    chapters.push({
      num: chNum,
      name: chName,
      badge: fullChapterTitle.toUpperCase() + ' • SGK KNTT TOÁN 6',
      desc: `Toàn bộ hệ thống bài học tương tác số hóa, phòng thí nghiệm trực quan và đấu trường SGK môn Toán Lớp 6 - ${chName}.`,
      color: grad.color,
      badgeColor: grad.badgeColor
    });

    // Find all <a href="./([^/]+)/index.html" class="lesson-card...
    const cardRegex = /<a href="\.\/([^/"]+)\/index\.html" class="lesson-card([^"]*)"([^>]*)>([\s\S]*?)<\/a>/g;
    let cardMatch;
    while ((cardMatch = cardRegex.exec(part)) !== null) {
      unitIndex++;
      const folder = cardMatch[1].trim();
      const cardClass = cardMatch[2];
      const cardAttributes = cardMatch[3];
      const cardInner = cardMatch[4];

      const badgeMatch = cardInner.match(/<span class="lesson-badge">([^<]+)<\/span>/);
      const tag = badgeMatch ? badgeMatch[1].trim() : `Bài ${unitIndex}`;

      const titleMatch = cardInner.match(/<h4 class="card-title">([^<]+)<\/h4>/);
      const title = titleMatch ? titleMatch[1].trim() : folder;

      // Extract features/labs
      const featMatches = [...cardInner.matchAll(/<span class="feature-tag">([^<]+)<\/span>/g)].map(m => m[1].trim());
      const labs = featMatches.length > 0 ? featMatches.join(' • ') : '🧪 2 Labs Canvas • ⚔️ Đấu trường';

      // Page / desc
      const footerMatch = cardInner.match(/<span style="font-size: 0\.75rem; color: var\(--text-dim\);">([^<]+)<\/span>/);
      const pageInfo = footerMatch ? footerMatch[1].trim() : '';

      // Extract data-tags for desc
      const tagsMatch = cardAttributes.match(/data-tags="([^"]+)"/);
      const tagWords = tagsMatch ? tagsMatch[1] : '';
      const desc = `${title} (SGK Toán 6 Kết Nối Tri Thức${pageInfo ? ` - ${pageInfo}` : ''}). Trọng tâm: ${tagWords || title}. Tích hợp phòng thí nghiệm mô phỏng và đấu trường củng cố kiến thức.`;

      lessons.push({
        id: folder,
        folder: folder,
        chapterNumber: chNum,
        chapterName: chName,
        chapterBadge: `Chương ${chNum} · ${tag}`,
        themeColor: chapterColors[chNum] || 'indigo',
        unitNumber: unitIndex,
        title: title,
        tag: tag,
        desc: desc,
        labs: labs,
        url: `/toan6/${folder}/index.html`
      });
    }
  }

  return { chapters, lessons };
}

console.log('Parsing Toan 6...');
const t6 = parseToan6();
console.log(`Toan 6 chapters: ${t6.chapters.length}, lessons: ${t6.lessons.length}`);
fs.writeFileSync('tmp_toan6.json', JSON.stringify(t6, null, 2));
