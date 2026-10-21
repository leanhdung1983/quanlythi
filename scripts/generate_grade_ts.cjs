const fs = require('fs');

// Generate src/data/grade6Lessons.ts
const t6 = JSON.parse(fs.readFileSync('tmp_toan6.json', 'utf8'));

let g6Ts = `export interface Grade6Lesson {
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

export const GRADE_6_CHAPTERS = ${JSON.stringify(t6.chapters, null, 2)};

export const GRADE_6_LESSONS: Grade6Lesson[] = ${JSON.stringify(t6.lessons, null, 2)};
`;

fs.writeFileSync('src/data/grade6Lessons.ts', g6Ts, 'utf8');
console.log('Created src/data/grade6Lessons.ts successfully');

// Generate src/data/grade11Lessons.ts
const t11 = JSON.parse(fs.readFileSync('tmp_toan11.json', 'utf8'));

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
console.log('Created src/data/grade11Lessons.ts successfully');
