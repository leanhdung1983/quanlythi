// ================================================================
// BÀI 24: PHÉP NHÂN VÀ PHÉP CHIA PHÂN THỨC ĐẠI SỐ - TOÁN 8 KNTT
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
  ["\\cap", "<mo>&#8745;</mo>"]
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
    renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      strict: false
    });
  } else {
    // Fallback MathML
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && (n.nodeValue.includes('$') || n.nodeValue.includes('$$'))) {
        nodes.push(n);
      }
    }
    nodes.forEach(node => {
      const span = document.createElement('span');
      span.innerHTML = formatMathText(node.nodeValue);
      if (node.parentNode) node.parentNode.replaceChild(span, node);
    });
  }
}

// --- 1. WEB AUDIO API SYNTHESIZER ---
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.ctx = new AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type = 'sine', duration = 0.15, vol = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
  playClick() { this.playTone(600, 'sine', 0.05, 0.08); }
  playCorrect() {
    this.playTone(523.25, 'triangle', 0.1, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.18, 0.12), 80);
  }
  playWrong() {
    this.playTone(280, 'sawtooth', 0.18, 0.1);
    setTimeout(() => this.playTone(220, 'sawtooth', 0.24, 0.1), 120);
  }
  playLevelUp() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'sine', 0.15, 0.12), idx * 90);
    });
  }
  playFanfare() {
    [523, 659, 783, 1046, 783, 1046].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.22, 0.15), idx * 130);
    });
  }
}
const sound = new SoundManager();

// --- 2. GAME STATE & GAMIFICATION ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Nhân Chia Đại Số 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai24_state';

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {}
}

function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const p = JSON.parse(s);
      Object.assign(appState, p);
    }
  } catch (e) {}
}

function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const userEl = document.getElementById('userNameDisplay');
  const titleEl = document.getElementById('userTitle');
  const avatarEl = document.getElementById('avatarBtn');
  const soundEl = document.getElementById('soundToggle');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (userEl) userEl.textContent = `${appState.userName} 🌟`;
  if (titleEl) titleEl.textContent = appState.userTitle;
  if (avatarEl) avatarEl.textContent = appState.avatar;
  if (soundEl) soundEl.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';

  // Cấp độ sao
  let starStr = '⭐☆☆☆☆';
  if (appState.xp >= 200) starStr = '⭐⭐⭐⭐⭐';
  else if (appState.xp >= 160) starStr = '⭐⭐⭐⭐☆';
  else if (appState.xp >= 100) starStr = '⭐⭐⭐☆☆';
  else if (appState.xp >= 40) starStr = '⭐⭐☆☆☆';
  if (starEl) starEl.textContent = starStr;

  // Cập nhật huy hiệu
  for (let i = 1; i <= 5; i++) {
    const b = document.getElementById(`badge-${i}`);
    if (b) {
      if (appState.badges[i - 1]) b.classList.remove('locked');
      else b.classList.add('locked');
    }
  }

  // Tên trên chứng nhận
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
    "title": "Câu 1: Phép nhân hai đơn thức phân thức",
    "pts": 20,
    "question": "Kết quả của phép nhân $\\frac{3x}{5y} \\cdot \\frac{10y}{9x^2}$ là:",
    "options": [
      {
        "text": "$\\frac{2}{3x}$",
        "correct": true
      },
      {
        "text": "$\\frac{2x}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{30xy}{45x^2y}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": false
      }
    ],
    "explanation": "Nhân tử với tử, mẫu với mẫu: $\\frac{3x \\cdot 10y}{5y \\cdot 9x^2} = \\frac{30xy}{45x^2y} = \\frac{2}{3x}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Phân thức nghịch đảo",
    "pts": 20,
    "question": "Phân thức nghịch đảo của phân thức $\\frac{x - 1}{x^2 + 2}$ (với $x \\neq 1$) là:",
    "options": [
      {
        "text": "$\\frac{x^2 + 2}{x - 1}$",
        "correct": true
      },
      {
        "text": "$\\frac{1 - x}{x^2 + 2}$",
        "correct": false
      },
      {
        "text": "$\\frac{x^2 + 2}{1 - x}$",
        "correct": false
      },
      {
        "text": "$-\\frac{x - 1}{x^2 + 2}$",
        "correct": false
      }
    ],
    "explanation": "Phân thức nghịch đảo của $\\frac{A}{B}$ là $\\frac{B}{A}$. Do đó nghịch đảo của $\\frac{x - 1}{x^2 + 2}$ là $\\frac{x^2 + 2}{x - 1}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Phép nhân triệt tiêu nhị thức",
    "pts": 20,
    "question": "Thực hiện phép tính $\\frac{x - 2}{x + 3} \\cdot \\frac{x^2 - 9}{x^2 - 4}$ (với điều kiện xác định):",
    "options": [
      {
        "text": "$\\frac{x - 3}{x + 2}$",
        "correct": true
      },
      {
        "text": "$\\frac{x + 3}{x - 2}$",
        "correct": false
      },
      {
        "text": "$\\frac{x - 3}{x - 2}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Phân tích thành nhân tử: $\\frac{x - 2}{x + 3} \\cdot \\frac{(x - 3)(x + 3)}{(x - 2)(x + 2)} = \\frac{x - 3}{x + 2}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Phép chia hai phân thức cơ bản",
    "pts": 20,
    "question": "Kết quả của phép chia $\\frac{4x^2}{3y} : \\frac{2x}{9y^2}$ là:",
    "options": [
      {
        "text": "$6xy$",
        "correct": true
      },
      {
        "text": "$\\frac{8x^3}{27y^3}$",
        "correct": false
      },
      {
        "text": "$\\frac{6x}{y}$",
        "correct": false
      },
      {
        "text": "$6$",
        "correct": false
      }
    ],
    "explanation": "Nhân với phân thức nghịch đảo: $\\frac{4x^2}{3y} \\cdot \\frac{9y^2}{2x} = \\frac{36x^2y^2}{6xy} = 6xy$."
  },
  {
    "id": 5,
    "title": "Câu 5: Chia một phân thức cho một đa thức",
    "pts": 20,
    "question": "Thực hiện phép chia $\\frac{x^2 - 1}{x} : (x + 1)$ (với $x \\neq 0, x \\neq -1$):",
    "options": [
      {
        "text": "$\\frac{x - 1}{x}$",
        "correct": true
      },
      {
        "text": "$\\frac{x + 1}{x}$",
        "correct": false
      },
      {
        "text": "$\\frac{(x - 1)(x + 1)^2}{x}$",
        "correct": false
      },
      {
        "text": "$x - 1$",
        "correct": false
      }
    ],
    "explanation": "Coi đa thức $x + 1 = \\frac{x + 1}{1}$. Nghịch đảo là $\\frac{1}{x + 1}$. Phép tính: $\\frac{(x - 1)(x + 1)}{x} \\cdot \\frac{1}{x + 1} = \\frac{x - 1}{x}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Chia một đa thức cho một phân thức",
    "pts": 20,
    "question": "Thực hiện phép tính $(x^2 - 4) : \\frac{x + 2}{x}$ (với $x \\neq 0, x \\neq -2$):",
    "options": [
      {
        "text": "$x(x - 2)$",
        "correct": true
      },
      {
        "text": "$\\frac{x - 2}{x}$",
        "correct": false
      },
      {
        "text": "$x - 2$",
        "correct": false
      },
      {
        "text": "$\\frac{x(x + 2)}{x - 2}$",
        "correct": false
      }
    ],
    "explanation": "Nhân nghịch đảo: $(x - 2)(x + 2) \\cdot \\frac{x}{x + 2} = x(x - 2) = x^2 - 2x$."
  },
  {
    "id": 7,
    "title": "Câu 7: Áp dụng tính chất phân phối",
    "pts": 20,
    "question": "Tính nhanh giá trị của biểu thức $P = \\frac{x}{x + 1} \\cdot \\frac{x + 2}{x + 3} + \\frac{x}{x + 1} \\cdot \\frac{1}{x + 3}$:",
    "options": [
      {
        "text": "$\\frac{x}{x + 1}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{x + 3}$",
        "correct": false
      },
      {
        "text": "$\\frac{x(x + 3)}{(x + 1)(x + 3)}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Đặt $\\frac{x}{x + 1}$ làm nhân tử chung: $P = \\frac{x}{x + 1} \\left(\\frac{x + 2}{x + 3} + \\frac{1}{x + 3}\\right) = \\frac{x}{x + 1} \\cdot \\frac{x + 3}{x + 3} = \\frac{x}{x + 1} \\cdot 1 = \\frac{x}{x + 1}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Dãy phép tính nhân liên tiếp",
    "pts": 20,
    "question": "Tích của $\\frac{x - 1}{x} \\cdot \\frac{x - 2}{x - 1} \\cdot \\frac{x - 3}{x - 2}$ bằng:",
    "options": [
      {
        "text": "$\\frac{x - 3}{x}$",
        "correct": true
      },
      {
        "text": "$\\frac{x - 1}{x - 3}$",
        "correct": false
      },
      {
        "text": "$\\frac{x}{x - 3}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Triệt tiêu chéo liên tiếp $x - 1$ và $x - 2$, ta còn lại tử của phân thức cuối cùng là $x - 3$ và mẫu của phân thức đầu tiên là $x$. Kết quả là $\\frac{x - 3}{x}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Thứ tự ưu tiên phép tính",
    "pts": 20,
    "question": "Kết quả của biểu thức $K = \\frac{x}{x + 1} : \\frac{x}{x + 2} \\cdot \\frac{x + 1}{x + 2}$ là:",
    "options": [
      {
        "text": "$1$",
        "correct": true
      },
      {
        "text": "$\\left(\\frac{x + 1}{x + 2}\\right)^2$",
        "correct": false
      },
      {
        "text": "$x$",
        "correct": false
      },
      {
        "text": "$\\frac{x^2}{(x + 1)^2}$",
        "correct": false
      }
    ],
    "explanation": "Thực hiện phép tính từ trái sang phải: Bước 1: $\\frac{x}{x + 1} : \\frac{x}{x + 2} = \\frac{x}{x + 1} \\cdot \\frac{x + 2}{x} = \\frac{x + 2}{x + 1}$. Bước 2: $\\frac{x + 2}{x + 1} \\cdot \\frac{x + 1}{x + 2} = 1$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng thực tế tính diện tích hình chữ nhật",
    "pts": 20,
    "question": "Một hình chữ nhật có diện tích $S = \\frac{x^2 - 16}{x + 2}\\text{ (m}^2\\text{)}$ và chiều rộng $b = \\frac{x - 4}{x + 2}\\text{ (m)}$. Chiều dài $a$ của hình chữ nhật đó là:",
    "options": [
      {
        "text": "$x + 4\\text{ (m)}$",
        "correct": true
      },
      {
        "text": "$x - 4\\text{ (m)}$",
        "correct": false
      },
      {
        "text": "$\\frac{x + 4}{x + 2}\\text{ (m)}$",
        "correct": false
      },
      {
        "text": "$(x - 4)^2\\text{ (m)}$",
        "correct": false
      }
    ],
    "explanation": "Chiều dài $a = S : b = \\frac{x^2 - 16}{x + 2} : \\frac{x - 4}{x + 2} = \\frac{(x - 4)(x + 4)}{x + 2} \\cdot \\frac{x + 2}{x - 4} = x + 4\\text{ (m)}$."
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

      // Tự động mở khóa Huy hiệu 1 & 2 khi chuyển tab
      if (target === 'theory') unlockBadge(0);
      if (target === 'labs') unlockBadge(1);

      // Kích hoạt render KaTeX nếu chuyển sang tab ẩn
      if (pane) renderMathInTree(pane);
    });
  });
}

function initAvatarModal() {
  const modal = document.getElementById('avatarModal');
  const avatarBtn = document.getElementById('avatarBtn');
  const closeBtn = document.getElementById('btnCloseModal');
  const choices = document.querySelectorAll('.avatar-choice');

  if (!modal || !avatarBtn) return;

  avatarBtn.addEventListener('click', () => {
    sound.playClick();
    modal.style.display = 'flex';
  });

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
  // Khởi tạo Lab 1
  try {
    
                const canvas = document.getElementById('labCanvas1');
                const ctx = canvas.getContext('2d');
                const inK = document.getElementById('inK24');
                const inM = document.getElementById('inM24');
                const outEl = document.getElementById('lab1Output24');

                function gcd(a, b) {
                    a = Math.abs(a); b = Math.abs(b);
                    while (b) { let t = b; b = a % b; a = t; }
                    return a || 1;
                }

                function update() {
                    const k = parseInt(inK.value) || 1;
                    const m = parseInt(inM.value) || 1;
                    const numCoeff = 2 * k;
                    const denCoeff = 3 * m;
                    const g = gcd(numCoeff, denCoeff);
                    const sNum = numCoeff / g;
                    const sDen = denCoeff / g;

                    outEl.innerHTML = `<strong>Tích ban đầu:</strong> $\\frac{2x}{3y} \\cdot \\frac{${k}y^2}{${m}x^2} = \\frac{${numCoeff}xy^2}{${denCoeff}x^2y}$ &nbsp;$\\xrightarrow{\\text{Rút gọn cho } ${g}xy}$&nbsp; <strong>Kết quả:</strong> $\\frac{${sNum}y}{${sDen}x}$`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#38bdf8';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('QUY TRÌNH NHÂN VÀ TRIỆT TIÊU CHÉO:', 40, 40);

                    // Khối 1
                    ctx.fillStyle = '#1e293b';
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(40, 70, 90, 70);
                    ctx.fillRect(40, 70, 90, 70);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 16px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText('2x', 85, 95);
                    ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(50, 105); ctx.lineTo(120, 105); ctx.stroke();
                    ctx.fillText('3y', 85, 128);

                    // Dấu nhân
                    ctx.fillStyle = '#f59e0b';
                    ctx.font = 'bold 24px Segoe UI';
                    ctx.fillText('×', 155, 112);

                    // Khối 2
                    ctx.fillStyle = '#1e293b';
                    ctx.strokeStyle = '#6366f1';
                    ctx.strokeRect(180, 70, 90, 70);
                    ctx.fillRect(180, 70, 90, 70);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 16px Segoe UI';
                    ctx.fillText(`${k}y²`, 225, 95);
                    ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(190, 105); ctx.lineTo(260, 105); ctx.stroke();
                    ctx.fillText(`${m}x²`, 225, 128);

                    // Dấu mũi tên kết quả
                    ctx.fillStyle = '#10b981';
                    ctx.font = 'bold 24px Segoe UI';
                    ctx.fillText('=', 300, 112);

                    // Khối kết quả
                    ctx.fillStyle = '#1e293b';
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(330, 65, 120, 80);
                    ctx.fillRect(330, 65, 120, 80);
                    ctx.fillStyle = '#10b981';
                    ctx.font = 'bold 18px Segoe UI';
                    ctx.fillText(`${sNum}y`, 390, 97);
                    ctx.strokeStyle = '#10b981'; ctx.beginPath(); ctx.moveTo(345, 105); ctx.lineTo(435, 105); ctx.stroke();
                    ctx.fillText(`${sDen}x`, 390, 132);
                }

                [inK, inM].forEach(el => el.addEventListener('input', update));
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const btnFlip = document.getElementById('btnFlip');
                const outEl = document.getElementById('lab2Output24');

                let isFlipped = false;

                function render() {
                    if (!isFlipped) {
                        outEl.innerHTML = `<strong>Dạng chia:</strong> $\\frac{x^2 - 1}{x + 2} : \\frac{x - 1}{x^2 - 4}$ &nbsp;|&nbsp; <em>Bấm nút để biến đổi thành phép nhân nghịch đảo!</em>`;
                    } else {
                        outEl.innerHTML = `<strong>Dạng nhân nghịch đảo:</strong> $\\frac{x^2 - 1}{x + 2} \\cdot \\frac{x^2 - 4}{x - 1} = \\frac{(x - 1)(x + 1)}{x + 2} \\cdot \\frac{(x - 2)(x + 2)}{x - 1} = <span style="color:#34d399; font-weight:bold;">(x + 1)(x - 2)</span>$`;
                    }
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#f8fafc';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText(isFlipped ? 'PHÉP NHÂN NGHỊCH ĐẢO (ĐÃ ĐẢO TỬ VÀ MẪU):' : 'PHÉP CHIA BAN ĐẦU:', 40, 40);

                    // Phân thức 1 cố định
                    ctx.fillStyle = '#1e293b';
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(40, 65, 120, 75);
                    ctx.fillRect(40, 65, 120, 75);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '15px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText('x² - 1', 100, 95);
                    ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(50, 105); ctx.lineTo(150, 105); ctx.stroke();
                    ctx.fillText('x + 2', 100, 128);

                    // Dấu toán tử
                    ctx.fillStyle = isFlipped ? '#10b981' : '#f59e0b';
                    ctx.font = 'bold 28px Segoe UI';
                    ctx.fillText(isFlipped ? '×' : ':', 195, 110);

                    // Phân thức 2
                    ctx.fillStyle = '#1e293b';
                    ctx.strokeStyle = isFlipped ? '#10b981' : '#f59e0b';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(230, 65, 120, 75);
                    ctx.fillRect(230, 65, 120, 75);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = '15px Segoe UI';
                    if (!isFlipped) {
                        ctx.fillText('x - 1', 290, 95);
                        ctx.strokeStyle = '#94a3b8'; ctx.beginPath(); ctx.moveTo(240, 105); ctx.lineTo(340, 105); ctx.stroke();
                        ctx.fillText('x² - 4', 290, 128);
                    } else {
                        ctx.fillText('x² - 4', 290, 95);
                        ctx.strokeStyle = '#10b981'; ctx.beginPath(); ctx.moveTo(240, 105); ctx.lineTo(340, 105); ctx.stroke();
                        ctx.fillText('x - 1', 290, 128);
                    }

                    if (isFlipped) {
                        ctx.fillStyle = '#34d399';
                        ctx.font = 'bold 16px Segoe UI';
                        ctx.textAlign = 'left';
                        ctx.fillText('= (x + 1)(x - 2)', 375, 110);
                    }
                }

                btnFlip.addEventListener('click', () => {
                    isFlipped = !isFlipped;
                    render();
                });
                render();
            
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
