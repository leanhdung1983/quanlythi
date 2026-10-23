// ================================================================
// Luyện Tập Chung: Sơ Đồ Cây & Bảng Hai Chiều - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ltc_chuong8_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chiến Binh Sơ Đồ Cây 9',
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
    "title": "Câu 1: Số kết quả khi gieo 2 con xúc xắc",
    "pts": 20,
    "question": "Gieo đồng thời hai con xúc xắc phân biệt. Số phần tử của không gian mẫu $n(\\Omega)$ là:",
    "options": [
      {
        "text": "36",
        "correct": true
      },
      {
        "text": "12",
        "correct": false
      },
      {
        "text": "18",
        "correct": false
      },
      {
        "text": "24",
        "correct": false
      }
    ],
    "explanation": "Mỗi con xúc xắc có 6 kết quả. Theo quy tắc nhân: $n(\\Omega) = 6 \\times 6 = 36$."
  },
  {
    "id": 2,
    "title": "Câu 2: Số kết quả thuận lợi cho mặt giống nhau",
    "pts": 20,
    "question": "Gieo hai con xúc xắc. Biến cố \"Hai con xúc xắc xuất hiện số chấm giống nhau\" (số đôi) có bao nhiêu kết quả thuận lợi?",
    "options": [
      {
        "text": "6 kết quả",
        "correct": true
      },
      {
        "text": "1 kết quả",
        "correct": false
      },
      {
        "text": "12 kết quả",
        "correct": false
      },
      {
        "text": "36 kết quả",
        "correct": false
      }
    ],
    "explanation": "Các kết quả là $(1;1), (2;2), (3;3), (4;4), (5;5), (6;6)$ (có đúng 6 kết quả thuận lợi)."
  },
  {
    "id": 3,
    "title": "Câu 3: Xác suất gieo được số đôi",
    "pts": 20,
    "question": "Xác suất để gieo được hai mặt có số chấm giống nhau ở Câu 2 là:",
    "options": [
      {
        "text": "$\\frac{1}{6}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{36}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{12}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      }
    ],
    "explanation": "$P = \\frac{6}{36} = \\frac{1}{6}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Sơ đồ cây chọn trang phục",
    "pts": 20,
    "question": "Bạn An có 3 chiếc áo sơ mi khác nhau và 2 chiếc quần tây khác nhau. Số cách chọn một bộ trang phục gồm 1 áo và 1 quần là:",
    "options": [
      {
        "text": "6 cách",
        "correct": true
      },
      {
        "text": "5 cách",
        "correct": false
      },
      {
        "text": "8 cách",
        "correct": false
      },
      {
        "text": "9 cách",
        "correct": false
      }
    ],
    "explanation": "Theo sơ đồ cây hoặc quy tắc nhân: $3 \\times 2 = 6$ cách phối đồ."
  },
  {
    "id": 5,
    "title": "Câu 5: Xác suất tổng số chấm lớn hơn 10",
    "pts": 20,
    "question": "Gieo hai con xúc xắc. Xác suất để tổng số chấm xuất hiện lớn hơn 10 là:",
    "options": [
      {
        "text": "$\\frac{1}{12}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{6}$",
        "correct": false
      },
      {
        "text": "$\\frac{5}{36}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{18}$",
        "correct": false
      }
    ],
    "explanation": "Tổng lớn hơn 10 nghĩa là tổng bằng 11 hoặc 12. Các cặp thuận lợi là $(5;6), (6;5), (6;6)$ (có 3 cặp). Xác suất $P = \\frac{3}{36} = \\frac{1}{12}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tung đồng xu 3 lần",
    "pts": 20,
    "question": "Tung một đồng xu liên tiếp 3 lần. Số kết quả có thể xảy ra của phép thử là:",
    "options": [
      {
        "text": "8",
        "correct": true
      },
      {
        "text": "6",
        "correct": false
      },
      {
        "text": "9",
        "correct": false
      },
      {
        "text": "16",
        "correct": false
      }
    ],
    "explanation": "Mỗi lần tung có 2 kết quả. Tung 3 lần: $2 \\times 2 \\times 2 = 2^3 = 8$ kết quả."
  },
  {
    "id": 7,
    "title": "Câu 7: Xác suất cả 3 lần cùng sấp",
    "pts": 20,
    "question": "Ở Câu 6, xác suất để cả 3 lần tung đều xuất hiện mặt sấp là:",
    "options": [
      {
        "text": "$\\frac{1}{8}$",
        "correct": true
      },
      {
        "text": "$\\frac{3}{8}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{4}$",
        "correct": false
      }
    ],
    "explanation": "Chỉ có 1 kết quả là $SSS$. Vậy $P = \\frac{1}{8}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Chọn ngẫu nhiên 2 bạn từ nhóm 4 người",
    "pts": 20,
    "question": "Nhóm gồm 4 bạn: A, B, C, D. Chọn ngẫu nhiên 2 bạn đi trực nhật. Số cách chọn là:",
    "options": [
      {
        "text": "6 cách",
        "correct": true
      },
      {
        "text": "8 cách",
        "correct": false
      },
      {
        "text": "12 cách",
        "correct": false
      },
      {
        "text": "16 cách",
        "correct": false
      }
    ],
    "explanation": "Liệt kê các cặp không phân biệt thứ tự: $\\{AB, AC, AD, BC, BD, CD\\}$ (tổng cộng 6 cách)."
  },
  {
    "id": 9,
    "title": "Câu 9: Xác suất An được chọn",
    "pts": 20,
    "question": "Ở Câu 8, xác suất để bạn A có tên trong 2 bạn được chọn là:",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": false
      }
    ],
    "explanation": "Các cặp có bạn A là: $AB, AC, AD$ (có 3 cặp). Xác suất $P = \\frac{3}{6} = \\frac{1}{2}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ưu điểm của bảng hai chiều",
    "pts": 20,
    "question": "Bảng hai chiều thuận lợi nhất khi giải dạng toán nào?",
    "options": [
      {
        "text": "Phép thử gồm 2 công đoạn kết hợp (như gieo 2 xúc xắc, chọn 2 đối tượng)",
        "correct": true
      },
      {
        "text": "Phép thử gồm 5 công đoạn",
        "correct": false
      },
      {
        "text": "Phép thử chỉ có 1 kết quả",
        "correct": false
      },
      {
        "text": "Không thể dùng để tính xác suất",
        "correct": false
      }
    ],
    "explanation": "Bảng 2 chiều có 2 trục (hàng và cột) nên hoàn hảo cho phép thử gồm 2 công đoạn độc lập."
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
                const btnAll = document.getElementById('btnAnimTree');
                const btnRand = document.getElementById('btnTraceBranch');
                const out1 = document.getElementById('lab1Output');

                let highlightPath = null;

                function drawTree() {
                    const cw = c1.width;
                    const ch = c1.height;
                    ctx.clearRect(0, 0, cw, ch);

                    const rootX = 60;
                    const rootY = ch / 2;

                    // Root Node
                    ctx.fillStyle = '#6366f1';
                    ctx.beginPath(); ctx.arc(rootX, rootY, 22, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px sans-serif';
                    ctx.fillText('Bắt đầu', rootX - 20, rootY + 4);

                    const level1 = [
                        { name: 'Sấp (S)', code: 'S', y: rootY - 70 },
                        { name: 'Ngửa (N)', code: 'N', y: rootY + 70 }
                    ];

                    const level1X = 220;
                    const level2X = 390;
                    const outcomeX = 490;

                    level1.forEach(l1 => {
                        // Line root to l1
                        const isHL1 = highlightPath && highlightPath.c1 === l1.code;
                        ctx.strokeStyle = isHL1 ? '#f59e0b' : '#475569';
                        ctx.lineWidth = isHL1 ? 3.5 : 1.5;
                        ctx.beginPath(); ctx.moveTo(rootX + 22, rootY); ctx.lineTo(level1X - 22, l1.y); ctx.stroke();

                        // Node l1
                        ctx.fillStyle = isHL1 ? '#f59e0b' : '#334155';
                        ctx.beginPath(); ctx.arc(level1X, l1.y, 22, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px sans-serif';
                        ctx.fillText(l1.code, level1X - 5, l1.y + 4);

                        // Level 2 (cards 1, 2, 3)
                        [1, 2, 3].forEach((c, idx) => {
                            const l2Y = l1.y - 35 + idx * 35;
                            const isHL2 = isHL1 && highlightPath.c2 === c;

                            ctx.strokeStyle = isHL2 ? '#10b981' : '#334155';
                            ctx.lineWidth = isHL2 ? 3.5 : 1;
                            ctx.beginPath(); ctx.moveTo(level1X + 22, l1.y); ctx.lineTo(level2X - 16, l2Y); ctx.stroke();

                            // Node l2
                            ctx.fillStyle = isHL2 ? '#10b981' : '#1e293b';
                            ctx.beginPath(); ctx.arc(level2X, l2Y, 16, 0, Math.PI * 2); ctx.fill();
                            ctx.fillStyle = '#ffffff'; ctx.font = '11px sans-serif';
                            ctx.fillText('Số ' + c, level2X - 12, l2Y + 4);

                            // Outcome text
                            ctx.fillStyle = isHL2 ? '#4ade80' : '#cbd5e1';
                            ctx.font = isHL2 ? 'bold 13px sans-serif' : '12px sans-serif';
                            ctx.fillText(`&rarr; (${l1.code}; ${c})`, outcomeX, l2Y + 4);
                        });
                    });

                    // Stage labels
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText('Công đoạn 1: Tung xu', 160, 25);
                    ctx.fillText('Công đoạn 2: Rút thẻ', 340, 25);
                    ctx.fillText('Kết quả Ω', outcomeX, 25);

                    if (highlightPath) {
                        out1.innerHTML = `Nhánh được chọn: <strong>(${highlightPath.c1}; ${highlightPath.c2})</strong>. Có tất cả $2 \\times 3 = 6$ kết quả đồng khả năng trong $\Omega$.`;
                    } else {
                        out1.innerHTML = `Sơ đồ hình cây biểu diễn đầy đủ không gian mẫu: $\Omega = \\{(S;1), (S;2), (S;3), (N;1), (N;2), (N;3)\\}$. Số phần tử $n(\Omega) = 6$.`;
                    }
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                btnAll.addEventListener('click', () => {
                    highlightPath = null;
                    drawTree();
                });

                btnRand.addEventListener('click', () => {
                    const c1 = Math.random() < 0.5 ? 'S' : 'N';
                    const c2 = Math.floor(Math.random() * 3) + 1;
                    highlightPath = { c1, c2 };
                    drawTree();
                });

                drawTree();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const bSum7 = document.getElementById('btnSum7');
                const bDouble = document.getElementById('btnDouble');
                const bSum9 = document.getElementById('btnSumGE9');
                const out2 = document.getElementById('lab2Output');

                let filterMode = 'sum7';

                function drawDiceTable() {
                    const cw = c2.width;
                    const ch = c2.height;
                    ctx2.clearRect(0, 0, cw, ch);

                    const ox = 70;
                    const oy = 40;
                    const cellW = 42;
                    const cellH = 38;

                    // Headers X
                    ctx2.fillStyle = '#38bdf8';
                    ctx2.font = 'bold 12px sans-serif';
                    ctx2.fillText('Xúc xắc 2 &rarr;', ox + 60, oy - 15);
                    for (let j = 1; j <= 6; j++) {
                        ctx2.fillText(j, ox + (j - 0.5) * cellW - 4, oy - 2);
                    }

                    // Headers Y
                    ctx2.fillText('Xúc xắc 1', 5, oy + 120);
                    for (let i = 1; i <= 6; i++) {
                        ctx2.fillText(i, ox - 18, oy + (i - 0.5) * cellH + 4);
                    }

                    let matchCount = 0;

                    for (let i = 1; i <= 6; i++) {
                        for (let j = 1; j <= 6; j++) {
                            const px = ox + (j - 1) * cellW;
                            const py = oy + (i - 1) * cellH;

                            let isMatch = false;
                            if (filterMode === 'sum7' && i + j === 7) isMatch = true;
                            if (filterMode === 'double' && i === j) isMatch = true;
                            if (filterMode === 'sum9' && i + j >= 9) isMatch = true;

                            if (isMatch) matchCount++;

                            ctx2.fillStyle = isMatch ? '#10b981' : '#1e293b';
                            ctx2.fillRect(px, py, cellW - 2, cellH - 2);
                            ctx2.strokeStyle = isMatch ? '#34d399' : '#334155';
                            ctx2.lineWidth = 1;
                            ctx2.strokeRect(px, py, cellW - 2, cellH - 2);

                            ctx2.fillStyle = isMatch ? '#ffffff' : '#94a3b8';
                            ctx2.font = '11px sans-serif';
                            ctx2.fillText(`${i},${j}`, px + 8, py + cellH / 2 + 4);
                        }
                    }

                    // Legend and prob on right
                    const rx = 350;
                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 14px sans-serif';
                    ctx2.fillText('KẾT QUẢ THỐNG KÊ', rx, 80);

                    ctx2.font = '13px sans-serif';
                    ctx2.fillStyle = '#cbd5e1';
                    ctx2.fillText(`Tổng số ô không gian mẫu: 36`, rx, 115);
                    ctx2.fillStyle = '#34d399';
                    ctx2.fillText(`Số kết quả thuận lợi: ${matchCount}`, rx, 145);
                    ctx2.fillStyle = '#fbbf24';
                    const prob = (matchCount / 36);
                    ctx2.fillText(`Xác suất P = ${matchCount}/36 ≈ ${(prob * 100).toFixed(1)}%`, rx, 175);

                    out2.innerHTML = `Bảng hai chiều cho thấy trọn vẹn $36$ ô kết quả đồng khả năng. Số ô màu xanh là $n(E) = ${matchCount} \\implies P(E) = \\frac{${matchCount}}{36} = ${(matchCount/36).toFixed(3)}$.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                bSum7.addEventListener('click', () => { filterMode = 'sum7'; drawDiceTable(); });
                bDouble.addEventListener('click', () => { filterMode = 'double'; drawDiceTable(); });
                bSum9.addEventListener('click', () => { filterMode = 'sum9'; drawDiceTable(); });

                drawDiceTable();
            
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
