// ================================================================
// Luyện Tập Chung: Tần Số & Tần Số Tương Đối - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ltc_chuong7_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nhà Phân Tích Dữ Liệu 9',
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
    "title": "Câu 1: Chuyển đổi tần số tương đối sang số lượng",
    "pts": 20,
    "question": "Một xí nghiệp có 400 công nhân. Thống kê độ tuổi cho thấy nhóm dưới 30 tuổi chiếm $35\\%$. Số công nhân dưới 30 tuổi là:",
    "options": [
      {
        "text": "140 người",
        "correct": true
      },
      {
        "text": "120 người",
        "correct": false
      },
      {
        "text": "160 người",
        "correct": false
      },
      {
        "text": "100 người",
        "correct": false
      }
    ],
    "explanation": "Số công nhân $= 400 \\times 35\\% = 400 \\times 0,35 = 140$ người."
  },
  {
    "id": 2,
    "title": "Câu 2: Góc ở tâm hình quạt",
    "pts": 20,
    "question": "Góc ở tâm của hình quạt tròn biểu diễn một giá trị có tần số tương đối $15\\%$ là:",
    "options": [
      {
        "text": "$54^\\circ$",
        "correct": true
      },
      {
        "text": "$15^\\circ$",
        "correct": false
      },
      {
        "text": "$45^\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      }
    ],
    "explanation": "$\\alpha = 15\\% \\times 360^\\circ = 0,15 \\times 360^\\circ = 54^\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tìm kích thước mẫu từ tần số và phần trăm",
    "pts": 20,
    "question": "Trong cuộc bầu cử lớp trưởng, bạn Nam được 24 phiếu bầu, chiếm $60\\%$ tổng số phiếu. Tổng số học sinh tham gia bỏ phiếu là:",
    "options": [
      {
        "text": "40 học sinh",
        "correct": true
      },
      {
        "text": "36 học sinh",
        "correct": false
      },
      {
        "text": "50 học sinh",
        "correct": false
      },
      {
        "text": "45 học sinh",
        "correct": false
      }
    ],
    "explanation": "Kích thước mẫu $N = \\frac{24}{60\\%} = \\frac{24}{0,6} = 40$ học sinh."
  },
  {
    "id": 4,
    "title": "Câu 4: Bảng tần số tương đối",
    "pts": 20,
    "question": "Một hộp có 50 viên bi gồm bi xanh, đỏ, vàng. Biết bi xanh có 20 viên, bi đỏ có 15 viên. Tần số tương đối của bi vàng là:",
    "options": [
      {
        "text": "30%",
        "correct": true
      },
      {
        "text": "35%",
        "correct": false
      },
      {
        "text": "25%",
        "correct": false
      },
      {
        "text": "40%",
        "correct": false
      }
    ],
    "explanation": "Số bi vàng là $50 - (20 + 15) = 15$ viên. Tần số tương đối $= \\frac{15}{50} \\times 100\\% = 30\\%$."
  },
  {
    "id": 5,
    "title": "Câu 5: So sánh tần số hai mẫu",
    "pts": 20,
    "question": "Tỉ lệ thất nghiệp ở Tỉnh A là $4\\%$ trên lực lượng lao động 1 triệu người. Tỉ lệ thất nghiệp ở Tỉnh B là $6\\%$ trên lực lượng lao động 500 nghìn người. Tỉnh nào có số người thất nghiệp nhiều hơn?",
    "options": [
      {
        "text": "Tỉnh A nhiều hơn (40 nghìn so với 30 nghìn)",
        "correct": true
      },
      {
        "text": "Tỉnh B nhiều hơn vì tỉ lệ 6% lớn hơn 4%",
        "correct": false
      },
      {
        "text": "Hai tỉnh có số người thất nghiệp bằng nhau",
        "correct": false
      },
      {
        "text": "Không so sánh được",
        "correct": false
      }
    ],
    "explanation": "Tỉnh A: $1\\,000\\,000 \\times 4\\% = 40\\,000$ người. Tỉnh B: $500\\,000 \\times 6\\% = 30\\,000$ người. Vậy Tỉnh A nhiều người thất nghiệp hơn dù tỉ lệ thấp hơn."
  },
  {
    "id": 6,
    "title": "Câu 6: Biểu đồ cột kép so sánh",
    "pts": 20,
    "question": "Để so sánh điểm trung bình môn Toán và môn Văn của các lớp khối 9, ta nên sử dụng biểu đồ nào?",
    "options": [
      {
        "text": "Biểu đồ cột kép",
        "correct": true
      },
      {
        "text": "Biểu đồ hình quạt tròn",
        "correct": false
      },
      {
        "text": "Biểu đồ tranh",
        "correct": false
      },
      {
        "text": "Bảng số liệu thô",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ cột kép là công cụ tối ưu để so sánh trực diện hai dãy số liệu của cùng một tập hợp đối tượng (các lớp khối 9)."
  },
  {
    "id": 7,
    "title": "Câu 7: Tính phần trăm chênh lệch",
    "pts": 20,
    "question": "Thị phần của Hãng X là $45\\%$, Hãng Y là $25\\%$. Thị phần của Hãng X nhiều hơn Hãng Y bao nhiêu điểm phần trăm?",
    "options": [
      {
        "text": "20 điểm phần trăm",
        "correct": true
      },
      {
        "text": "80%",
        "correct": false
      },
      {
        "text": "10 điểm phần trăm",
        "correct": false
      },
      {
        "text": "25 điểm phần trăm",
        "correct": false
      }
    ],
    "explanation": "Hiệu số $= 45\\% - 25\\% = 20$ điểm phần trăm."
  },
  {
    "id": 8,
    "title": "Câu 8: Tổng góc ở tâm quạt tròn",
    "pts": 20,
    "question": "Tổng số đo góc ở tâm của tất cả các hình quạt trong một biểu đồ hình quạt tròn luôn bằng:",
    "options": [
      {
        "text": "$360^\\circ$",
        "correct": true
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      },
      {
        "text": "$100^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Một hình tròn trọn vẹn luôn có số đo góc ở tâm là $360^\\circ$."
  },
  {
    "id": 9,
    "title": "Câu 9: Tần số tương đối lớn nhất",
    "pts": 20,
    "question": "Trong mẫu số liệu có 5 nhóm, biết 4 nhóm có tần số tương đối lần lượt là $10\\%,\\ 20\\%,\\ 25\\%,\\ 15\\%$. Tần số tương đối của nhóm thứ 5 là:",
    "options": [
      {
        "text": "30%",
        "correct": true
      },
      {
        "text": "20%",
        "correct": false
      },
      {
        "text": "35%",
        "correct": false
      },
      {
        "text": "25%",
        "correct": false
      }
    ],
    "explanation": "$100\\% - (10\\% + 20\\% + 25\\% + 15\\%) = 100\\% - 70\\% = 30\\%$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tần số tương đối 100%",
    "pts": 20,
    "question": "Khi nào một giá trị có tần số tương đối bằng $100\\%$?",
    "options": [
      {
        "text": "Khi tất cả các cá thể trong mẫu đều nhận cùng giá trị đó",
        "correct": true
      },
      {
        "text": "Khi kích thước mẫu bằng 100",
        "correct": false
      },
      {
        "text": "Khi tần số của nó bằng 100",
        "correct": false
      },
      {
        "text": "Không bao giờ xảy ra",
        "correct": false
      }
    ],
    "explanation": "Khi $m_i = N$, tức toàn bộ mẫu dữ liệu đều chỉ nhận duy nhất một giá trị đó thì $f_i = \\frac{N}{N} \\times 100\\% = 100\\%$."
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
                const inN = document.getElementById('inN');
                const inM = document.getElementById('inM');
                const btn = document.getElementById('btnCalcConv');
                const out1 = document.getElementById('lab1Output');

                function calculateConversion() {
                    const N = Math.max(1, parseInt(inN.value) || 1);
                    let m = Math.max(0, parseInt(inM.value) || 0);
                    if (m > N) { m = N; inM.value = N; }

                    const f = (m / N) * 100;
                    const angleDeg = (m / N) * 360;
                    const angleRad = (angleDeg * Math.PI) / 180;

                    const cw = c1.width;
                    const ch = c1.height;
                    const ox = 180;
                    const oy = ch / 2;
                    const R = 100;

                    ctx.clearRect(0, 0, cw, ch);

                    // Full circle background
                    ctx.fillStyle = '#334155';
                    ctx.beginPath(); ctx.arc(ox, oy, R, 0, Math.PI * 2); ctx.fill();

                    // Sector for m
                    ctx.fillStyle = '#06b6d4';
                    ctx.beginPath();
                    ctx.moveTo(ox, oy);
                    ctx.arc(ox, oy, R, -Math.PI / 2, -Math.PI / 2 + angleRad);
                    ctx.closePath();
                    ctx.fill();

                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2; ctx.stroke();

                    // Info box on right
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(340, 40, 230, 230);
                    ctx.strokeStyle = '#475569';
                    ctx.strokeRect(340, 40, 230, 230);

                    ctx.fillStyle = '#f8fafc';
                    ctx.font = 'bold 14px sans-serif';
                    ctx.fillText('KẾT QUẢ QUY ĐỔI', 360, 75);

                    ctx.font = '13px sans-serif';
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillText(`• Tần số m = ${m}`, 360, 115);
                    ctx.fillStyle = '#cbd5e1';
                    ctx.fillText(`• Cỡ mẫu N = ${N}`, 360, 145);
                    ctx.fillStyle = '#34d399';
                    ctx.fillText(`• Tần số tương đối f = ${f.toFixed(2)}%`, 360, 175);
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillText(`• Góc ở tâm α = ${angleDeg.toFixed(2)}°`, 360, 205);

                    out1.innerHTML = `<strong>Công thức:</strong> $f = \\frac{${m}}{${N}} \\times 100\\% = ${f.toFixed(2)}\\%$ | <strong>Góc ở tâm:</strong> $\\alpha = ${f.toFixed(2)}\\% \\times 360^\\circ = ${angleDeg.toFixed(2)}^\\circ$.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                btn.addEventListener('click', calculateConversion);
                [inN, inM].forEach(el => el.addEventListener('input', calculateConversion));
                calculateConversion();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const slF = document.getElementById('slFood');
                const slS = document.getElementById('slStudy');
                const out2 = document.getElementById('lab2Output');

                function updateBudget() {
                    const food = parseFloat(slF.value);
                    const study = parseFloat(slS.value);
                    document.getElementById('vFood').textContent = food + '%';
                    document.getElementById('vStudy').textContent = study + '%';

                    const house = 25;
                    const save = Math.max(0, 100 - food - study - house);

                    const items = [
                        { name: 'Ăn uống', pct: food, color: '#f59e0b' },
                        { name: 'Nhà ở', pct: house, color: '#3b82f6' },
                        { name: 'Học tập', pct: study, color: '#10b981' },
                        { name: 'Tiết kiệm', pct: save, color: '#a855f7' }
                    ];

                    const cw = c2.width;
                    const ch = c2.height;
                    const ox = 160;
                    const oy = ch / 2;
                    const R = 100;

                    ctx2.clearRect(0, 0, cw, ch);

                    let stA = -Math.PI / 2;
                    items.forEach((it, idx) => {
                        const ang = (it.pct / 100) * Math.PI * 2;
                        const enA = stA + ang;

                        ctx2.fillStyle = it.color;
                        ctx2.beginPath();
                        ctx2.moveTo(ox, oy);
                        ctx2.arc(ox, oy, R, stA, enA);
                        ctx2.closePath();
                        ctx2.fill();
                        ctx2.strokeStyle = '#0f172a';
                        ctx2.lineWidth = 2; ctx2.stroke();
                        stA = enA;

                        // Legend
                        const ly = 50 + idx * 45;
                        ctx2.fillStyle = it.color;
                        ctx2.fillRect(320, ly, 18, 18);
                        ctx2.fillStyle = '#ffffff';
                        ctx2.font = 'bold 13px sans-serif';
                        ctx2.fillText(`${it.name}: ${it.pct}%`, 350, ly + 14);
                        ctx2.fillStyle = '#94a3b8';
                        ctx2.font = '11px sans-serif';
                        ctx2.fillText(`Góc: ${(it.pct * 3.6).toFixed(1)}°`, 350, ly + 30);
                    });

                    out2.innerHTML = `<strong>Tổng tỉ trọng:</strong> $${food}\\% + ${house}\\% + ${study}\\% + ${save}\\% = 100\\%$. Tỉ lệ tiết kiệm đạt <strong>${save}%</strong>.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slF.addEventListener('input', updateBudget);
                slS.addEventListener('input', updateBudget);
                updateBudget();
            
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
