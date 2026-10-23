// ================================================================
// Bài 26: Xác Suất Của Biến Cố Liên Quan Tới Phép Thử - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai26_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Bậc Thầy Xác Suất Cổ Điển 9',
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
    "title": "Câu 1: Xác suất gieo được mặt chẵn",
    "pts": 20,
    "question": "Gieo một con xúc xắc 6 mặt cân đối. Xác suất để xuất hiện mặt có số chấm là số chẵn bằng:",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{6}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": false
      }
    ],
    "explanation": "Có 3 kết quả thuận lợi là $\\{2, 4, 6\\}$. Do đó $P = \\frac{3}{6} = \\frac{1}{2}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Xác suất tung 2 đồng xu cùng ngửa",
    "pts": 20,
    "question": "Tung hai đồng xu phân biệt. Xác suất để cả hai đồng xu đều xuất hiện mặt ngửa là:",
    "options": [
      {
        "text": "$\\frac{1}{4}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{3}$",
        "correct": false
      }
    ],
    "explanation": "Không gian mẫu $n(\\Omega) = 4$. Chỉ có 1 kết quả cả hai cùng ngửa là $NN$. Vậy $P = \\frac{1}{4}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Xác suất của biến cố chắc chắn",
    "pts": 20,
    "question": "Xác suất của một biến cố chắc chắn luôn bằng:",
    "options": [
      {
        "text": "1",
        "correct": true
      },
      {
        "text": "0",
        "correct": false
      },
      {
        "text": "0,5",
        "correct": false
      },
      {
        "text": "100",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa, biến cố chắc chắn có xác suất $P(\\Omega) = \\frac{n(\\Omega)}{n(\\Omega)} = 1$."
  },
  {
    "id": 4,
    "title": "Câu 4: Xác suất của biến cố không thể",
    "pts": 20,
    "question": "Xác suất của một biến cố không thể luôn bằng:",
    "options": [
      {
        "text": "0",
        "correct": true
      },
      {
        "text": "1",
        "correct": false
      },
      {
        "text": "-1",
        "correct": false
      },
      {
        "text": "Không xác định",
        "correct": false
      }
    ],
    "explanation": "Biến cố không thể có 0 kết quả thuận lợi: $P(\\varnothing) = \\frac{0}{n(\\Omega)} = 0$."
  },
  {
    "id": 5,
    "title": "Câu 5: Công thức biến cố đối",
    "pts": 20,
    "question": "Nếu xác suất bắn trúng bia của một xạ thủ là $0,85$ thì xác suất để xạ thủ đó bắn trượt là:",
    "options": [
      {
        "text": "0,15",
        "correct": true
      },
      {
        "text": "0,25",
        "correct": false
      },
      {
        "text": "0,85",
        "correct": false
      },
      {
        "text": "0,05",
        "correct": false
      }
    ],
    "explanation": "Biến cố bắn trượt là biến cố đối của bắn trúng: $P(\\text{trượt}) = 1 - P(\\text{trúng}) = 1 - 0,85 = 0,15$."
  },
  {
    "id": 6,
    "title": "Câu 6: Lấy bi trong túi",
    "pts": 20,
    "question": "Một hộp có 4 viên bi xanh, 5 viên bi đỏ và 1 viên bi vàng (kích thước giống hệt nhau). Lấy ngẫu nhiên 1 viên bi. Xác suất lấy được viên bi màu đỏ là:",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{5}{9}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{10}$",
        "correct": false
      }
    ],
    "explanation": "Tổng số bi $N = 4 + 5 + 1 = 10$. Có 5 bi đỏ thuận lợi. Xác suất $P = \\frac{5}{10} = \\frac{1}{2}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Rút thẻ chia hết cho 5",
    "pts": 20,
    "question": "Rút ngẫu nhiên một thẻ từ tập hợp 25 thẻ đánh số từ 1 đến 25. Xác suất để rút được thẻ mang số chia hết cho 5 là:",
    "options": [
      {
        "text": "$\\frac{1}{5}$",
        "correct": true
      },
      {
        "text": "$\\frac{5}{24}$",
        "correct": false
      },
      {
        "text": "$\\frac{4}{25}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{4}$",
        "correct": false
      }
    ],
    "explanation": "Các số chia hết cho 5 từ 1 đến 25 là: 5, 10, 15, 20, 25 (có 5 số). Xác suất $P = \\frac{5}{25} = \\frac{1}{5}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tổng số chấm bằng 7 khi gieo 2 xúc xắc",
    "pts": 20,
    "question": "Gieo đồng thời hai con xúc xắc cân đối. Xác suất để tổng số chấm xuất hiện trên hai con xúc xắc bằng 7 là:",
    "options": [
      {
        "text": "$\\frac{1}{6}$",
        "correct": true
      },
      {
        "text": "$\\frac{7}{36}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{12}$",
        "correct": false
      },
      {
        "text": "$\\frac{5}{36}$",
        "correct": false
      }
    ],
    "explanation": "Không gian mẫu $n(\\Omega) = 36$. Các cặp có tổng bằng 7 là: $(1;6), (2;5), (3;4), (4;3), (5;2), (6;1)$ (có 6 cặp). Xác suất $P = \\frac{6}{36} = \\frac{1}{6}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Xác suất có ít nhất một mặt sấp",
    "pts": 20,
    "question": "Tung hai đồng xu phân biệt. Xác suất để có ít nhất một đồng xu xuất hiện mặt sấp là:",
    "options": [
      {
        "text": "$\\frac{3}{4}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{4}$",
        "correct": false
      },
      {
        "text": "1",
        "correct": false
      }
    ],
    "explanation": "Biến cố đối là \"không có đồng xu nào sấp\" (tức cả 2 cùng ngửa: $NN$), có xác suất $\\frac{1}{4}$. Do đó xác suất ít nhất 1 sấp là $1 - \\frac{1}{4} = \\frac{3}{4}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Giới hạn của giá trị xác suất",
    "pts": 20,
    "question": "Trong các giá trị sau, giá trị nào KHÔNG THỂ là xác suất của một biến cố?",
    "options": [
      {
        "text": "1,25",
        "correct": true
      },
      {
        "text": "0,75",
        "correct": false
      },
      {
        "text": "0",
        "correct": false
      },
      {
        "text": "95%",
        "correct": false
      }
    ],
    "explanation": "Xác suất của mọi biến cố luôn thỏa mãn $0 \\le P(E) \\le 1$. Giá trị $1,25 > 1$ nên không thể là xác suất."
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
                const btnSpin = document.getElementById('btnSpinWheel');
                const btnSpin100 = document.getElementById('btnSpin100');
                const out1 = document.getElementById('lab1Output');

                // 8 sectors: 3 Yellow (Vàng), 3 Blue (Xanh), 2 Red (Đỏ)
                const sectors = [
                    { name: 'Vàng', color: '#f59e0b' },
                    { name: 'Xanh', color: '#3b82f6' },
                    { name: 'Đỏ', color: '#ef4444' },
                    { name: 'Vàng', color: '#f59e0b' },
                    { name: 'Xanh', color: '#3b82f6' },
                    { name: 'Vàng', color: '#f59e0b' },
                    { name: 'Đỏ', color: '#ef4444' },
                    { name: 'Xanh', color: '#3b82f6' }
                ];

                let currentAngle = 0;
                let isSpinning = false;
                let counts = { 'Vàng': 0, 'Xanh': 0, 'Đỏ': 0 };
                let totalSpins = 0;

                function renderWheel() {
                    const cw = c1.width;
                    const ch = c1.height;
                    const ox = 170;
                    const oy = ch / 2;
                    const R = 110;
                    const numSec = sectors.length;
                    const arc = (Math.PI * 2) / numSec;

                    ctx.clearRect(0, 0, cw, ch);

                    // Draw sectors
                    ctx.save();
                    ctx.translate(ox, oy);
                    ctx.rotate(currentAngle);

                    sectors.forEach((sec, i) => {
                        const ang = i * arc;
                        ctx.fillStyle = sec.color;
                        ctx.beginPath();
                        ctx.moveTo(0, 0);
                        ctx.arc(0, 0, R, ang, ang + arc);
                        ctx.closePath();
                        ctx.fill();
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 2; ctx.stroke();

                        // Sector label
                        ctx.save();
                        ctx.rotate(ang + arc / 2);
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 12px sans-serif';
                        ctx.fillText(sec.name, R * 0.55, 4);
                        ctx.restore();
                    });
                    ctx.restore();

                    // Center pin
                    ctx.fillStyle = '#0f172a';
                    ctx.beginPath(); ctx.arc(ox, oy, 16, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#f8fafc'; ctx.lineWidth = 2; ctx.stroke();

                    // Pointer (Arrow on top pointing down)
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.moveTo(ox, oy - R - 6);
                    ctx.lineTo(ox - 10, oy - R - 24);
                    ctx.lineTo(ox + 10, oy - R - 24);
                    ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2; ctx.stroke();

                    // Stats on right
                    const tx = 330;
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px sans-serif';
                    ctx.fillText('Bảng so sánh Xác Suất Lý Thuyết & Tần Suất:', tx, 50);

                    const pTheo = { 'Vàng': '3/8 (37.5%)', 'Xanh': '3/8 (37.5%)', 'Đỏ': '2/8 = 1/4 (25%)' };
                    const cols = { 'Vàng': '#f59e0b', 'Xanh': '#38bdf8', 'Đỏ': '#f43f5e' };

                    let idx = 0;
                    for (const k of ['Vàng', 'Xanh', 'Đỏ']) {
                        const sy = 80 + idx * 55;
                        ctx.fillStyle = cols[k];
                        ctx.fillRect(tx, sy, 16, 16);
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 13px sans-serif';
                        ctx.fillText(`Ô ${k}: Lý thuyết = ${pTheo[k]}`, tx + 24, sy + 13);

                        const expRate = totalSpins > 0 ? ((counts[k] / totalSpins) * 100).toFixed(1) : '0.0';
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '12px sans-serif';
                        ctx.fillText(`Thực tế: ${counts[k]} lần (${expRate}%)`, tx + 24, sy + 30);
                        idx++;
                    }

                    out1.innerHTML = `<strong>Tổng số lần quay:</strong> $N = ${totalSpins}$. Theo Luật số lớn của Bernoulli, khi số lần thử đủ lớn, tần suất thực tế sẽ tiệm cận xác suất lý thuyết.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                function spin() {
                    if (isSpinning) return;
                    isSpinning = true;
                    let speed = Math.random() * 0.3 + 0.4;
                    const friction = 0.985;

                    function animate() {
                        currentAngle += speed;
                        speed *= friction;
                        renderWheel();

                        if (speed > 0.002) {
                            requestAnimationFrame(animate);
                        } else {
                            isSpinning = false;
                            // Determine pointer sector at angle -PI/2
                            const numSec = sectors.length;
                            const arc = (Math.PI * 2) / numSec;
                            const normAngle = (2 * Math.PI - (currentAngle % (2 * Math.PI)) - Math.PI / 2 + 2 * Math.PI) % (2 * Math.PI);
                            const winIndex = Math.floor(normAngle / arc) % numSec;
                            const winSec = sectors[winIndex];
                            counts[winSec.name]++;
                            totalSpins++;
                            renderWheel();
                        }
                    }
                    animate();
                }

                btnSpin.addEventListener('click', spin);
                btnSpin100.addEventListener('click', () => {
                    for (let i = 0; i < 100; i++) {
                        const r = Math.floor(Math.random() * sectors.length);
                        counts[sectors[r].name]++;
                        totalSpins++;
                    }
                    renderWheel();
                });

                renderWheel();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const btnDraw = document.getElementById('btnDrawCard');
                const btnAll = document.getElementById('btnDrawAllCards');
                const out2 = document.getElementById('lab2Output');

                let picked = 7;

                function isPrime(n) {
                    if (n < 2) return false;
                    for (let i = 2; i * i <= n; i++) if (n % i === 0) return false;
                    return true;
                }

                function renderCards() {
                    const cw = c2.width;
                    const ch = c2.height;
                    ctx2.clearRect(0, 0, cw, ch);

                    // Draw 20 cards grid 4x5
                    const startX = 30;
                    const startY = 30;
                    const cardW = 44;
                    const cardH = 55;

                    for (let i = 1; i <= 20; i++) {
                        const col = (i - 1) % 5;
                        const row = Math.floor((i - 1) / 5);
                        const cx = startX + col * (cardW + 10);
                        const cy = startY + row * (cardH + 10);

                        const isSel = i === picked;
                        ctx2.fillStyle = isSel ? '#f59e0b' : '#1e293b';
                        ctx2.beginPath();
                        ctx2.roundRect(cx, cy, cardW, cardH, 6);
                        ctx2.fill();
                        ctx2.strokeStyle = isSel ? '#ffffff' : '#334155';
                        ctx2.lineWidth = isSel ? 3 : 1;
                        ctx2.stroke();

                        ctx2.fillStyle = isSel ? '#0f172a' : '#f8fafc';
                        ctx2.font = 'bold 16px sans-serif';
                        ctx2.fillText(i, cx + (i < 10 ? 16 : 11), cy + 34);
                    }

                    // Analysis on right
                    const rx = 320;
                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 14px sans-serif';
                    ctx2.fillText(`Thẻ vừa rút: [ ${picked} ]`, rx, 50);

                    const even = picked % 2 === 0;
                    const div3 = picked % 3 === 0;
                    const prime = isPrime(picked);

                    ctx2.font = '13px sans-serif';
                    ctx2.fillStyle = even ? '#4ade80' : '#f87171';
                    ctx2.fillText(`• Biến cố A (Số chẵn): ${even ? 'THỎA MÃN ✅' : 'Không thỏa ❌'}`, rx, 90);
                    ctx2.fillStyle = '#94a3b8';
                    ctx2.fillText(`  P(A) = 10/20 = 50%`, rx + 16, 110);

                    ctx2.fillStyle = div3 ? '#4ade80' : '#f87171';
                    ctx2.fillText(`• Biến cố B (Chia hết cho 3): ${div3 ? 'THỎA MÃN ✅' : 'Không thỏa ❌'}`, rx, 145);
                    ctx2.fillStyle = '#94a3b8';
                    ctx2.fillText(`  P(B) = 6/20 = 30% (các số: 3, 6, 9, 12, 15, 18)`, rx + 16, 165);

                    ctx2.fillStyle = prime ? '#4ade80' : '#f87171';
                    ctx2.fillText(`• Biến cố C (Số nguyên tố): ${prime ? 'THỎA MÃN ✅' : 'Không thỏa ❌'}`, rx, 200);
                    ctx2.fillStyle = '#94a3b8';
                    ctx2.fillText(`  P(C) = 8/20 = 40% (2, 3, 5, 7, 11, 13, 17, 19)`, rx + 16, 220);

                    out2.innerHTML = `<strong>Không gian mẫu:</strong> $n(\Omega) = 20$. Thẻ rút được là <strong>${picked}</strong>.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                btnDraw.addEventListener('click', () => {
                    picked = Math.floor(Math.random() * 20) + 1;
                    renderCards();
                });
                btnAll.addEventListener('click', renderCards);

                renderCards();
            
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
