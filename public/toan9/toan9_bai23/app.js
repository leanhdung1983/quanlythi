// ================================================================
// Bài 23: Bảng Tần Số Tương Đối & Biểu Đồ Tần Số Tương Đối - TOÁN 9 KNTT
// Pure Vanilla JS - Web Audio API - Canvas 2D - KaTeX / MathML Fallback
// ================================================================

// --- 0. BỘ PARSER CÔNG THỨC TOÁN LATEX SANG NATIVE MATHML (OFFLINE FALLBACK) ---
const mathSymbols = [
  ["\\mathbb{R}", "<mi class=\"m-bb\">&#8477;</mi>"],
  ["\\mathbb{N}", "<mi class=\"m-bb\">&#8469;</mi>"],
  ["\\mathbb{Z}", "<mi class=\"m-bb\">&#8484;</mi>"],
  ["\\mathbb{Q}", "<mi class=\"m-bb\">&#8474;</mi>"],
  ["\\Leftrightarrow", "<mo>&#8660;</mo>"],
  ["\\Rightarrow", "<mo>&#8658;</mo>"],
  ["\\Leftarrow", "<mo>&#8656;</mo>"],
  ["\\approx", "<mo>&#8776;</mo>"],
  ["\\forall", "<mo>&#8704;</mo>"],
  ["\\exists", "<mo>&#8707;</mo>"],
  ["\\infty", "<mo>&#8734;</mo>"],
  ["\\pm", "<mo>&#177;</mo>"],
  ["\\mp", "<mo>&#8723;</mo>"],
  ["\\ge", "<mo>&#8805;</mo>"],
  ["\\le", "<mo>&#8804;</mo>"],
  ["\\geq", "<mo>&#8805;</mo>"],
  ["\\leq", "<mo>&#8804;</mo>"],
  ["\\ne", "<mo>&#8800;</mo>"],
  ["\\neq", "<mo>&#8800;</mo>"],
  ["\\to", "<mo>&#8594;</mo>"],
  ["\\in", "<mo>&#8712;</mo>"],
  ["\\notin", "<mo>&#8713;</mo>"],
  ["\\Delta", "<mi>&#916;</mi>"],
  ["\\delta", "<mi>&#948;</mi>"],
  ["\\alpha", "<mi>&#945;</mi>"],
  ["\\beta", "<mi>&#946;</mi>"],
  ["\\gamma", "<mi>&#947;</mi>"],
  ["\\theta", "<mi>&#952;</mi>"],
  ["\\pi", "<mi>&#960;</mi>"],
  ["\\times", "<mo>&#215;</mo>"],
  ["\\cdot", "<mo>&#8901;</mo>"],
  ["\\setminus", "<mo>&#8726;</mo>"],
  ["\\cup", "<mo>&#8746;</mo>"],
  ["\\cap", "<mo>&#8745;</mo>"],
  ["\\frown", "<mo>&#8978;</mo>"],
  ["\\smile", "<mo>&#8979;</mo>"]
];

function tokenizePlainMath(raw) {
  if (!raw) return '';
  let out = '';
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < raw.length && /[0-9\.]/.test(raw[i])) { num += raw[i]; i++; }
      out += '<mn>' + num + '</mn>';
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      out += '<mi>' + ch + '</mi>';
      i++;
      continue;
    }
    if (/[\+\-\*/<>()\[\]\{},;:\!\?\|']/.test(ch)) {
      let op = ch;
      if (op === '<') op = '&lt;';
      else if (op === '>') op = '&gt;';
      out += '<mo>' + op + '</mo>';
      i++;
      continue;
    }
    if (/\s/.test(ch)) { out += ' '; i++; continue; }
    out += ch;
    i++;
  }
  return out;
}

function convertLatexToMathMLBody(latex, placeholders = []) {
  let s = latex.trim();
  function savePlaceholder(html) {
    const idx = placeholders.length;
    placeholders.push(html);
    return '\uE000' + idx + '\uE001';
  }

  s = s.replace(/\\text\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mtext>' + c + '</mtext>'));
  s = s.replace(/\\mathbf\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="bold">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\mathrm\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="normal">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\mathit\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="italic">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\widehat\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>^</mo></mover>'));
  s = s.replace(/\\circ/g, savePlaceholder('<mo>&#176;</mo>'));
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\vec\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\(overparen|wideparen|overgroup|overarc|arc)\{([^{}]+)\}/g, (m, cmd, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#9180;</mo></mover>'));
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));

  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
  } while (s !== prevFrac);

  s = s.replace(/\\left\[/g, '[');
  s = s.replace(/\\right\./g, '');
  s = s.replace(/\\left\(/g, '(');
  s = s.replace(/\\right\)/g, ')');
  s = s.replace(/\\left\\\{/g, '{');
  s = s.replace(/\\right\\\}/g, '}');
  s = s.replace(/\\limits/g, '');
  s = s.replace(/\\,/g, ' ');
  s = s.replace(/\\quad/g, '   ');

  for (const [k, v] of mathSymbols) {
    const rx = new RegExp(k.replace(/\\/g, '\\\\') + '(?![a-zA-Z])', 'g');
    if (rx.test(s)) s = s.replace(rx, savePlaceholder(v));
  }

  s = s.replace(/_\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msub><mrow></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msub>'));
  s = s.replace(/\^\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msup><mrow></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msup>'));
  s = s.replace(/_([a-zA-Z0-9])/g, (m, c) => savePlaceholder('<msub><mrow></mrow><mrow>' + tokenizePlainMath(c) + '</mrow></msub>'));
  s = s.replace(/\^([a-zA-Z0-9])/g, (m, c) => savePlaceholder('<msup><mrow></mrow><mrow>' + tokenizePlainMath(c) + '</mrow></msup>'));

  const parts = s.split(/(\uE000\d+\uE001)/g);
  let res = '';
  for (const part of parts) {
    if (part.startsWith('\uE000') && part.endsWith('\uE001')) res += part;
    else res += tokenizePlainMath(part);
  }

  for (let i = placeholders.length - 1; i >= 0; i--) {
    res = res.split('\uE000' + i + '\uE001').join(placeholders[i]);
  }
  return res;
}

function latexToMathML(latex, display = false) {
  const inner = convertLatexToMathMLBody(latex);
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${display ? ' display="block"' : ''} class="${display ? 'math-block' : 'math-inline'}">${inner}</math>`;
}

function formatMathText(str) {
  if (!str) return '';
  str = str.replace(/\$\$([\s\S]*?)\$\$/g, (m, c) => latexToMathML(c, true));
  str = str.replace(/\$([^\$\n]+?)\$/g, (m, c) => latexToMathML(c, false));
  return str;
}

function renderMathInTree(root) {
  if (!root) return;
  if (typeof renderMathInElement === 'function') {
    try {
      renderMathInElement(root, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        macros: {
          '\\overparen': '\\overgroup{#1}',
          '\\wideparen': '\\overgroup{#1}',
          '\\overarc': '\\overgroup{#1}',
          '\\arc': '\\overgroup{#1}'
        },
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {
      console.warn('KaTeX render error, falling back to MathML:', e);
    }
  }

  // MathML Fallback
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.includes('$')) {
      textNodes.push(node);
    }
  }

  textNodes.forEach(tn => {
    const parent = tn.parentNode;
    if (!parent) return;
    const tag = parent.nodeName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'textarea' || tag === 'code') return;
    const span = document.createElement('span');
    span.innerHTML = formatMathText(tn.nodeValue);
    parent.replaceChild(span, tn);
  });
}

// --- 1. WEB AUDIO API SOUND SYSTEM ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration, type = 'sine', gainVal = 0.1) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  playClick() {
    this.playTone(800, 0.05, 'triangle', 0.08);
  }

  playCorrect() {
    if (!this.enabled) return;
    this.playTone(523.25, 0.1, 'sine', 0.12);
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.12), 100);
    setTimeout(() => this.playTone(783.99, 0.25, 'triangle', 0.15), 220);
  }

  playWrong() {
    if (!this.enabled) return;
    this.playTone(320, 0.15, 'sawtooth', 0.1);
    setTimeout(() => this.playTone(240, 0.25, 'sawtooth', 0.1), 120);
  }

  playLevelUp() {
    if (!this.enabled) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.18, 'sine', 0.15), i * 120);
    });
  }

  playFanfare() {
    if (!this.enabled) return;
    const melody = [523, 659, 783, 1046, 783, 1046];
    melody.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.22, 'triangle', 0.18), i * 140);
    });
  }
}

const sound = new SoundController();

// --- 2. GAMIFICATION STATE & LOCALSTORAGE ---
const STORAGE_KEY = 'toan9_toan9_bai23_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Tỉ Lệ Thống Kê 9',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      appState = Object.assign(appState, parsed);
    }
  } catch (e) {
    console.warn('Could not load state:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn('Could not save state:', e);
  }
}

function updateHUD() {
  const avBtn = document.getElementById('avatarBtn');
  const nameEl = document.getElementById('userNameDisplay');
  const titleEl = document.getElementById('userTitle');
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const soundBtn = document.getElementById('soundToggle');

  if (avBtn) avBtn.textContent = appState.avatar;
  if (nameEl) nameEl.textContent = `${appState.userName} 🌟`;
  if (titleEl) titleEl.textContent = appState.userTitle;
  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (soundBtn) soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';

  // Stars (1-5 dựa trên XP)
  let s = 1;
  if (appState.xp >= 160) s = 5;
  else if (appState.xp >= 120) s = 4;
  else if (appState.xp >= 80) s = 3;
  else if (appState.xp >= 40) s = 2;
  appState.stars = s;
  if (starEl) starEl.textContent = '⭐'.repeat(s) + '☆'.repeat(5 - s);

  // Update Badges UI
  appState.badges.forEach((unlocked, idx) => {
    const el = document.getElementById(`badge-${idx + 1}`);
    if (el) {
      if (unlocked) el.classList.remove('locked');
      else el.classList.add('locked');
    }
  });

  // Update Certificate info
  const certName = document.getElementById('certStudentName');
  if (certName) certName.textContent = appState.userName;
}

function unlockBadge(idx) {
  if (!appState.badges[idx]) {
    appState.badges[idx] = true;
    sound.playLevelUp();
    saveState();
    updateHUD();
  }
}

// --- 3. ĐẤU TRƯỜNG SGK QUIZ DATA ---
const quizData = [
  {
    "id": 1,
    "title": "Câu 1: Công thức tính tần số tương đối",
    "pts": 20,
    "question": "Công thức tính tần số tương đối $f_i$ của giá trị có tần số $m_i$ trong mẫu kích thước $N$ là:",
    "options": [
      {
        "text": "$f_i = \\frac{m_i}{N} \\times 100\\%$",
        "correct": true
      },
      {
        "text": "$f_i = \\frac{N}{m_i} \\times 100\\%$",
        "correct": false
      },
      {
        "text": "$f_i = m_i \\times N \\times 100\\%$",
        "correct": false
      },
      {
        "text": "$f_i = \\frac{m_i}{100} \\times N$",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa chuẩn: $f_i = \\frac{m_i}{N} \\times 100\\%$."
  },
  {
    "id": 2,
    "title": "Câu 2: Tổng các tần số tương đối",
    "pts": 20,
    "question": "Tổng các tần số tương đối của tất cả các giá trị trong một mẫu số liệu luôn bằng:",
    "options": [
      {
        "text": "100%",
        "correct": true
      },
      {
        "text": "360%",
        "correct": false
      },
      {
        "text": "$N$",
        "correct": false
      },
      {
        "text": "50%",
        "correct": false
      }
    ],
    "explanation": "Tổng tất cả các tần số tương đối luôn bằng 100% (hoặc bằng 1)."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính góc ở tâm hình quạt tròn",
    "pts": 20,
    "question": "Trong biểu đồ hình quạt tròn, một nhóm có tần số tương đối là $20\\%$ thì góc ở tâm của hình quạt tương ứng có số đo là:",
    "options": [
      {
        "text": "$72^\\circ$",
        "correct": true
      },
      {
        "text": "$20^\\circ$",
        "correct": false
      },
      {
        "text": "$36^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Góc ở tâm $\\alpha = 20\\% \\times 360^\\circ = 0,2 \\times 360^\\circ = 72^\\circ$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính tần số từ tần số tương đối",
    "pts": 20,
    "question": "Một trường có 500 học sinh. Kết quả khảo sát môn thể thao yêu thích cho thấy môn Bóng đá có tần số tương đối là $42\\%$. Số học sinh thích bóng đá là:",
    "options": [
      {
        "text": "210 học sinh",
        "correct": true
      },
      {
        "text": "200 học sinh",
        "correct": false
      },
      {
        "text": "420 học sinh",
        "correct": false
      },
      {
        "text": "250 học sinh",
        "correct": false
      }
    ],
    "explanation": "Số học sinh $m = 500 \\times 42\\% = 500 \\times 0,42 = 210$ học sinh."
  },
  {
    "id": 5,
    "title": "Câu 5: Góc 90 độ tương ứng với bao nhiêu %?",
    "pts": 20,
    "question": "Trên một biểu đồ hình quạt tròn, góc ở tâm của hình quạt biểu diễn khối lượng rác hữu cơ là $90^\\circ$. Tần số tương đối của rác hữu cơ là:",
    "options": [
      {
        "text": "25%",
        "correct": true
      },
      {
        "text": "50%",
        "correct": false
      },
      {
        "text": "30%",
        "correct": false
      },
      {
        "text": "20%",
        "correct": false
      }
    ],
    "explanation": "$f = \\frac{90^\\circ}{360^\\circ} \\times 100\\% = \\frac{1}{4} \\times 100\\% = 25\\%$."
  },
  {
    "id": 6,
    "title": "Câu 6: Đọc bảng tần số tương đối",
    "pts": 20,
    "question": "Cho bảng tần số tương đối về phương tiện đến trường của 200 học sinh:<div class=\"quiz-table-wrap\"><table class=\"quiz-table\"><thead><tr><th>Phương tiện</th><th>Xe đạp</th><th>Đi bộ</th><th>Xe buýt</th><th>Xe máy điện</th></tr></thead><tbody><tr><td>Tần số tương đối</td><td>45%</td><td>15%</td><td>$f\\%$</td><td>20%</td></tr></tbody></table></div>Tần số tương đối $f\\%$ của học sinh đi xe buýt là:",
    "options": [
      {
        "text": "20%",
        "correct": true
      },
      {
        "text": "25%",
        "correct": false
      },
      {
        "text": "15%",
        "correct": false
      },
      {
        "text": "30%",
        "correct": false
      }
    ],
    "explanation": "$f\\% = 100\\% - (45\\% + 15\\% + 20\\%) = 100\\% - 80\\% = 20\\%$."
  },
  {
    "id": 7,
    "title": "Câu 7: Tính số lượng tuyệt đối",
    "pts": 20,
    "question": "Ở Câu 6, số học sinh đến trường bằng xe đạp là:",
    "options": [
      {
        "text": "90 học sinh",
        "correct": true
      },
      {
        "text": "45 học sinh",
        "correct": false
      },
      {
        "text": "100 học sinh",
        "correct": false
      },
      {
        "text": "80 học sinh",
        "correct": false
      }
    ],
    "explanation": "Số học sinh $= 200 \\times 45\\% = 90$ học sinh."
  },
  {
    "id": 8,
    "title": "Câu 8: So sánh tần số tương đối",
    "pts": 20,
    "question": "Lớp 9A có 12 học sinh giỏi trên tổng số 40 bạn. Lớp 9B có 14 học sinh giỏi trên tổng số 50 bạn. Lớp nào có tỉ lệ học sinh giỏi cao hơn?",
    "options": [
      {
        "text": "Lớp 9A cao hơn (30% so với 28%)",
        "correct": true
      },
      {
        "text": "Lớp 9B cao hơn vì có 14 bạn giỏi",
        "correct": false
      },
      {
        "text": "Hai lớp có tỉ lệ bằng nhau",
        "correct": false
      },
      {
        "text": "Không thể so sánh được",
        "correct": false
      }
    ],
    "explanation": "Tỉ lệ lớp 9A: $\\frac{12}{40} = 30\\%$. Tỉ lệ lớp 9B: $\\frac{14}{50} = 28\\%$. Vậy 9A cao hơn."
  },
  {
    "id": 9,
    "title": "Câu 9: Góc bẹt 180 độ trong quạt tròn",
    "pts": 20,
    "question": "Hình quạt tròn có góc ở tâm bằng $180^\\circ$ (nửa hình tròn) tương ứng với tần số tương đối là:",
    "options": [
      {
        "text": "50%",
        "correct": true
      },
      {
        "text": "100%",
        "correct": false
      },
      {
        "text": "25%",
        "correct": false
      },
      {
        "text": "75%",
        "correct": false
      }
    ],
    "explanation": "$\\frac{180^\\circ}{360^\\circ} \\times 100\\% = 50\\%$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ưu điểm của biểu đồ hình quạt tròn",
    "pts": 20,
    "question": "Biểu đồ hình quạt tròn thích hợp nhất khi cần thể hiện:",
    "options": [
      {
        "text": "Tỉ trọng thành phần của từng nhóm so với toàn thể",
        "correct": true
      },
      {
        "text": "Sự biến thiên theo thời gian",
        "correct": false
      },
      {
        "text": "Tọa độ địa lý của số liệu",
        "correct": false
      },
      {
        "text": "Giá trị âm của số liệu",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ hình quạt tròn biểu diễn trực quan nhất tỉ trọng của các phần nhỏ cấu thành nên một tổng thể 100%."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let answeredCount = 0;

  quizData.forEach((q, qidx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    if (q.question && (q.question.includes('<table') || q.question.includes('quiz-table') || q.question.length > 250)) {
      card.classList.add('full-width');
    }
    card.id = `qcard-${q.id}`;

    const isAnswered = appState.answered[String(q.id)] !== undefined;
    if (isAnswered) answeredCount++;

    let headerHtml = `
      <div class="quiz-card-header">
        <span class="quiz-badge">${q.title}</span>
        <span class="quiz-points">+${q.pts} XP</span>
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options quiz-options-grid">
    `;

    q.options.forEach((opt, oidx) => {
      let optClass = 'quiz-opt-btn';
      let disabled = isAnswered ? 'disabled' : '';
      if (isAnswered) {
        if (opt.correct) optClass += ' correct';
        else if (appState.answered[String(q.id)] === oidx) optClass += ' wrong';
      }

      headerHtml += `
        <button class="${optClass}" data-qid="${q.id}" data-oidx="${oidx}" ${disabled}>
          <span class="opt-label">${String.fromCharCode(65 + oidx)}.</span>
          <span class="opt-text">${opt.text}</span>
        </button>
      `;
    });

    headerHtml += `</div>`;

    const showExp = isAnswered ? 'show' : '';
    let expStatusHtml = '';
    if (isAnswered) {
      const isCorrect = q.options[appState.answered[String(q.id)]].correct;
      expStatusHtml = `<div class="exp-status" style="margin-bottom: 8px; font-weight: 700; color: ${isCorrect ? '#34d399' : '#f87171'};">${isCorrect ? '✅ CHÍNH XÁC! +20 XP' : '❌ CHƯA ĐÚNG'}</div>`;
    }

    headerHtml += `
      <div class="explanation-box ${showExp}" id="exp-${q.id}">
        ${expStatusHtml}
        <strong>💡 Lời giải chi tiết:</strong> ${q.explanation}
      </div>
    `;

    card.innerHTML = headerHtml;
    container.appendChild(card);
  });

  // Gắn sự kiện click
  container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const qid = this.getAttribute('data-qid');
      const oidx = parseInt(this.getAttribute('data-oidx'));
      handleAnswer(qid, oidx);
    });
  });

  // Cập nhật header arena
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  const answeredKeys = Object.keys(appState.answered);
  let correctCount = 0;
  answeredKeys.forEach(k => {
    const q = quizData.find(item => String(item.id) === String(k));
    if (q && q.options[appState.answered[k]].correct) correctCount++;
  });

  if (progEl) progEl.textContent = `${answeredKeys.length}/10`;
  if (scoreEl) scoreEl.textContent = `${correctCount * 20} XP`;

  // Mở khóa huy hiệu 3, 4, 5
  if (appState.streak >= 5) unlockBadge(2);
  if (correctCount >= 8) unlockBadge(3);
  if (correctCount === 10) {
    unlockBadge(4);
    sound.playFanfare();
  }

  renderMathInTree(container);
}

function handleAnswer(qid, oidx) {
  if (appState.answered[String(qid)] !== undefined) return;
  const q = quizData.find(item => String(item.id) === String(qid));
  if (!q) return;

  appState.answered[String(qid)] = oidx;
  const isCorrect = q.options[oidx].correct;

  if (isCorrect) {
    appState.xp += q.pts;
    appState.streak += 1;
    sound.playCorrect();
  } else {
    appState.streak = 0;
    sound.playWrong();
  }

  saveState();
  updateHUD();
  renderQuiz();
}

// --- 4. TABS & MODAL CONTROLLER ---
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const panes = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sound.playClick();
      const target = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const pane = document.getElementById(`tab-${target}`);
      if (pane) pane.classList.add('active');

      if (target === 'theory') unlockBadge(0);
      if (target === 'labs') {
        unlockBadge(1);
        initLabs();
      }
    });
  });
}

function initAvatarModal() {
  const btn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const closeBtn = document.getElementById('btnCloseModal');
  const choices = document.querySelectorAll('.avatar-choice');

  if (btn && modal) {
    btn.addEventListener('click', () => {
      sound.playClick();
      modal.style.display = 'flex';
    });
  }

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      sound.playClick();
      modal.style.display = 'none';
    });
  }

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  choices.forEach(choice => {
    choice.addEventListener('click', () => {
      sound.playClick();
      const av = choice.getAttribute('data-avatar');
      const ti = choice.getAttribute('data-title');
      appState.avatar = av;
      appState.userTitle = ti;
      saveState();
      updateHUD();
      modal.style.display = 'none';
    });
  });
}

// --- 5. TIỆN ÍCH HEADER ---
function initHeaderActions() {
  const soundBtn = document.getElementById('soundToggle');
  const resetBtn = document.getElementById('resetProgress');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      sound.enabled = appState.sound;
      sound.playClick();
      saveState();
      updateHUD();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn đặt lại toàn bộ điểm và huy hiệu của bài này?')) {
        localStorage.removeItem(STORAGE_KEY);
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        saveState();
        updateHUD();
        renderQuiz();
      }
    });
  }
}

// --- 6. PHÒNG THÍ NGHIỆM TƯƠNG TÁC (LAB 1 & LAB 2) ---
function initLabs() {
  try {
    
                const c1 = document.getElementById('labCanvas1');
                const ctx = c1.getContext('2d');
                const iM = document.getElementById('clbMath');
                const iL = document.getElementById('clbLit');
                const iE = document.getElementById('clbEng');
                const iT = document.getElementById('clbIT');
                const out1 = document.getElementById('lab1Output');

                function updateRelative() {
                    const mM = Math.max(1, parseInt(iM.value) || 1);
                    const mL = Math.max(1, parseInt(iL.value) || 1);
                    const mE = Math.max(1, parseInt(iE.value) || 1);
                    const mT = Math.max(1, parseInt(iT.value) || 1);
                    const N = mM + mL + mE + mT;

                    const data = [
                        { name: 'Toán', val: mM, color: '#38bdf8' },
                        { name: 'Văn', val: mL, color: '#ec4899' },
                        { name: 'Anh', val: mE, color: '#10b981' },
                        { name: 'Tin', val: mT, color: '#f59e0b' }
                    ];

                    const cw = c1.width;
                    const ch = c1.height;
                    const ox = 180;
                    const oy = ch / 2;
                    const R = 110;

                    ctx.clearRect(0, 0, cw, ch);

                    let startAngle = -Math.PI / 2;

                    data.forEach((d, i) => {
                        const pct = d.val / N;
                        const angle = pct * Math.PI * 2;
                        const endAngle = startAngle + angle;

                        ctx.fillStyle = d.color;
                        ctx.beginPath();
                        ctx.moveTo(ox, oy);
                        ctx.arc(ox, oy, R, startAngle, endAngle);
                        ctx.closePath();
                        ctx.fill();

                        ctx.strokeStyle = '#0f172a';
                        ctx.lineWidth = 2;
                        ctx.stroke();

                        startAngle = endAngle;

                        // Legend table on the right
                        const ly = 60 + i * 50;
                        ctx.fillStyle = d.color;
                        ctx.fillRect(360, ly, 20, 20);
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 13px sans-serif';
                        ctx.fillText(`${d.name}: ${d.val} (${(pct * 100).toFixed(1)}%)`, 390, ly + 15);
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '11px sans-serif';
                        ctx.fillText(`Góc ở tâm: ${(pct * 360).toFixed(1)}°`, 390, ly + 32);
                    });

                    // Center hole for donut look
                    ctx.fillStyle = '#0f172a';
                    ctx.beginPath(); ctx.arc(ox, oy, 40, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#f8fafc';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText(`N = ${N}`, ox - 20, oy + 4);

                    out1.innerHTML = `<strong>Tổng kích thước mẫu:</strong> $N = ${N}$ học sinh. Câu lạc bộ chiếm tỉ trọng lớn nhất: <strong>Anh (${((mE/N)*100).toFixed(1)}%)</strong>.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                [iM, iL, iE, iT].forEach(el => el.addEventListener('input', updateRelative));
                updateRelative();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const slA = document.getElementById('slG9A');
                const slB = document.getElementById('slG9B');
                const out2 = document.getElementById('lab2Output');

                function drawDoubleBar() {
                    const gA = parseFloat(slA.value);
                    const gB = parseFloat(slB.value);
                    document.getElementById('vG9A').textContent = gA + '%';
                    document.getElementById('vG9B').textContent = gB + '%';

                    const kA = 40;
                    const kB = 35;
                    const tA = 100 - gA - kA;
                    const tB = 100 - gB - kB;

                    const cw = c2.width;
                    const ch = c2.height;
                    const padL = 60;
                    const padB = 50;
                    const chartH = ch - padB - 40;
                    const chartW = cw - padL - 40;

                    ctx2.clearRect(0, 0, cw, ch);

                    // Axes
                    ctx2.strokeStyle = '#64748b';
                    ctx2.lineWidth = 2;
                    ctx2.beginPath();
                    ctx2.moveTo(padL, 30);
                    ctx2.lineTo(padL, ch - padB);
                    ctx2.lineTo(cw - 30, ch - padB);
                    ctx2.stroke();

                    // Grid
                    ctx2.strokeStyle = '#1e293b';
                    for (let p = 0; p <= 60; p += 10) {
                        const py = (ch - padB) - (p / 60) * chartH;
                        ctx2.beginPath(); ctx2.moveTo(padL, py); ctx2.lineTo(cw - 30, py); ctx2.stroke();
                        ctx2.fillStyle = '#94a3b8';
                        ctx2.font = '11px sans-serif';
                        ctx2.fillText(p + '%', padL - 34, py + 4);
                    }

                    const categories = [
                        { name: 'Giỏi', a: gA, b: gB },
                        { name: 'Khá', a: kA, b: kB },
                        { name: 'Trung bình', a: tA, b: tB }
                    ];

                    const grpW = chartW / 3;
                    const barW = 32;

                    categories.forEach((cat, idx) => {
                        const cx = padL + idx * grpW + grpW / 2;

                        // Bar 9A (Blue)
                        const hA = (cat.a / 60) * chartH;
                        ctx2.fillStyle = '#38bdf8';
                        ctx2.fillRect(cx - barW - 3, (ch - padB) - hA, barW, hA);
                        ctx2.fillStyle = '#ffffff';
                        ctx2.font = '11px sans-serif';
                        ctx2.fillText(cat.a + '%', cx - barW + 2, (ch - padB) - hA - 5);

                        // Bar 9B (Green)
                        const hB = (cat.b / 60) * chartH;
                        ctx2.fillStyle = '#34d399';
                        ctx2.fillRect(cx + 3, (ch - padB) - hB, barW, hB);
                        ctx2.fillStyle = '#ffffff';
                        ctx2.fillText(cat.b + '%', cx + 6, (ch - padB) - hB - 5);

                        // Cat label
                        ctx2.fillStyle = '#e2e8f0';
                        ctx2.font = '13px sans-serif';
                        ctx2.fillText(cat.name, cx - 18, ch - padB + 22);
                    });

                    // Legend
                    ctx2.fillStyle = '#38bdf8'; ctx2.fillRect(cw - 180, 20, 16, 16);
                    ctx2.fillStyle = '#ffffff'; ctx2.fillText('Lớp 9A', cw - 158, 33);
                    ctx2.fillStyle = '#34d399'; ctx2.fillRect(cw - 100, 20, 16, 16);
                    ctx2.fillText('Lớp 9B', cw - 78, 33);

                    out2.innerHTML = `Biểu đồ cột tần số tương đối kép giúp loại bỏ chênh lệch về sĩ số để so sánh chính xác tỉ lệ cơ cấu học lực giữa hai tập hợp.`;
                }

                slA.addEventListener('input', drawDoubleBar);
                slB.addEventListener('input', drawDoubleBar);
                drawDoubleBar();
            
    if (typeof initLab2 === 'function') initLab2();
  } catch(e) { console.error('Lỗi khởi tạo Lab 2:', e); }
}

// --- 7. KHỞI CHẠY DOMCONTENTLOADED ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  sound.enabled = appState.sound;
  updateHUD();
  initTabs();
  initAvatarModal();
  initHeaderActions();
  renderQuiz();
  initLabs();
});
