// ================================================================
// BÀI 22: TÍNH CHẤT CƠ BẢN CỦA PHÂN THỨC ĐẠI SỐ - TOÁN 8 KNTT
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
  userTitle: 'Bậc Thầy Quy Đồng & Rút Gọn 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai22_state';

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
    "title": "Câu 1: Áp dụng tính chất cơ bản",
    "pts": 20,
    "question": "Phân thức $\\frac{x - y}{3}$ bằng phân thức nào sau đây khi đổi dấu?",
    "options": [
      {
        "text": "$\\frac{y - x}{-3}$",
        "correct": true
      },
      {
        "text": "$\\frac{y - x}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{x - y}{-3}$",
        "correct": false
      },
      {
        "text": "$\\frac{-x - y}{3}$",
        "correct": false
      }
    ],
    "explanation": "Theo quy tắc đổi dấu: $\\frac{A}{B} = \\frac{-A}{-B}$. Do đó $\\frac{x - y}{3} = \\frac{-(x - y)}{-3} = \\frac{y - x}{-3}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Rút gọn đơn thức trong phân thức",
    "pts": 20,
    "question": "Rút gọn phân thức $\\frac{12x^3y^2}{18x^2y^4}$ ta được kết quả tối giản là:",
    "options": [
      {
        "text": "$\\frac{2x}{3y^2}$",
        "correct": true
      },
      {
        "text": "$\\frac{2x^2}{3y^2}$",
        "correct": false
      },
      {
        "text": "$\\frac{3x}{2y^2}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3xy^2}$",
        "correct": false
      }
    ],
    "explanation": "Chia cả tử và mẫu cho nhân tử chung $6x^2y^2$: Tử còn $12x^3y^2 : 6x^2y^2 = 2x$; Mẫu còn $18x^2y^4 : 6x^2y^2 = 3y^2$. Kết quả là $\\frac{2x}{3y^2}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Rút gọn bằng hằng đẳng thức",
    "pts": 20,
    "question": "Rút gọn phân thức $\\frac{x^2 - 4x + 4}{x - 2}$ với $x \\neq 2$ ta được:",
    "options": [
      {
        "text": "$x - 2$",
        "correct": true
      },
      {
        "text": "$x + 2$",
        "correct": false
      },
      {
        "text": "$x - 4$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Ta có $x^2 - 4x + 4 = (x - 2)^2$. Do đó $\\frac{(x - 2)^2}{x - 2} = x - 2$."
  },
  {
    "id": 4,
    "title": "Câu 4: Rút gọn có đổi dấu",
    "pts": 20,
    "question": "Rút gọn phân thức $\\frac{5x - 10}{4 - 2x}$ với $x \\neq 2$ thu được:",
    "options": [
      {
        "text": "$-\\frac{5}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{5}{2}$",
        "correct": false
      },
      {
        "text": "$-5$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      }
    ],
    "explanation": "Tử thức: $5(x - 2)$; Mẫu thức: $2(2 - x) = -2(x - 2)$. Chia cả tử và mẫu cho $(x - 2)$ được $\\frac{5}{-2} = -\\frac{5}{2}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tìm mẫu thức chung",
    "pts": 20,
    "question": "Mẫu thức chung có bậc thấp nhất của hai phân thức $\\frac{1}{2x^2y}$ và $\\frac{1}{3xy^3}$ là:",
    "options": [
      {
        "text": "$6x^2y^3$",
        "correct": true
      },
      {
        "text": "$6x^3y^4$",
        "correct": false
      },
      {
        "text": "$5x^2y^3$",
        "correct": false
      },
      {
        "text": "$6xy$",
        "correct": false
      }
    ],
    "explanation": "Hệ số: $\\text{BCNN}(2, 3) = 6$. Lũy thừa của $x$: lấy số mũ lớn nhất là $x^2$. Lũy thừa của $y$: lấy số mũ lớn nhất là $y^3$. Vậy $\\text{MTC} = 6x^2y^3$."
  },
  {
    "id": 6,
    "title": "Câu 6: Nhân tử phụ khi quy đồng",
    "pts": 20,
    "question": "Khi quy đồng mẫu thức hai phân thức $\\frac{x}{x^2 - 1}$ và $\\frac{2}{x + 1}$, nhân tử phụ của phân thức thứ hai là:",
    "options": [
      {
        "text": "$x - 1$",
        "correct": true
      },
      {
        "text": "$x + 1$",
        "correct": false
      },
      {
        "text": "$x^2 - 1$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\text{MTC} = x^2 - 1 = (x - 1)(x + 1)$. Nhân tử phụ của phân thức thứ hai là $\\text{MTC} : (x + 1) = x - 1$."
  },
  {
    "id": 7,
    "title": "Câu 7: Phát hiện sai lầm rút gọn",
    "pts": 20,
    "question": "Khẳng định nào sau đây là <strong>sai</strong>?",
    "options": [
      {
        "text": "$\\frac{x + 2}{x^2 + 4} = \\frac{1}{x + 2}$",
        "correct": true
      },
      {
        "text": "$\\frac{x^2 - 9}{x + 3} = x - 3$ (với $x \\neq -3$)",
        "correct": false
      },
      {
        "text": "$\\frac{3(x + 1)}{6(x + 1)} = \\frac{1}{2}$ (với $x \\neq -1$)",
        "correct": false
      },
      {
        "text": "$\\frac{-x}{-y} = \\frac{x}{y}$",
        "correct": false
      }
    ],
    "explanation": "Đa thức $x^2 + 4$ không phân tích thành $(x + 2)^2$ hay có nhân tử $x + 2$, nên không thể rút gọn thành $\\frac{1}{x + 2}$ được. Đây là sai lầm triệt tiêu số hạng rời rạc."
  },
  {
    "id": 8,
    "title": "Câu 8: Rút gọn phân thức bậc ba",
    "pts": 20,
    "question": "Rút gọn phân thức $M = \\frac{x^3 - 1}{x^2 + x + 1}$ với mọi $x \\in \\mathbb{R}$:",
    "options": [
      {
        "text": "$x - 1$",
        "correct": true
      },
      {
        "text": "$x + 1$",
        "correct": false
      },
      {
        "text": "$x^2 - 1$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng hằng đẳng thức hiệu hai lập phương: $x^3 - 1 = (x - 1)(x^2 + x + 1)$. Chia cả tử và mẫu cho $x^2 + x + 1 > 0$ ta được $x - 1$."
  },
  {
    "id": 9,
    "title": "Câu 9: Mẫu thức chung phân thức chứa hiệu",
    "pts": 20,
    "question": "Mẫu thức chung đơn giản nhất của hai phân thức $\\frac{1}{x - 3}$ và $\\frac{1}{3 - x}$ là:",
    "options": [
      {
        "text": "$x - 3$ (sau khi đổi dấu $\\frac{1}{3 - x} = \\frac{-1}{x - 3}$)",
        "correct": true
      },
      {
        "text": "$(x - 3)(3 - x)$",
        "correct": false
      },
      {
        "text": "$x^2 - 9$",
        "correct": false
      },
      {
        "text": "$3$",
        "correct": false
      }
    ],
    "explanation": "Vì $3 - x = -(x - 3)$, ta áp dụng quy tắc đổi dấu $\\frac{1}{3 - x} = \\frac{-1}{x - 3}$. Khi đó mẫu thức chung đơn giản nhất chính là $x - 3$."
  },
  {
    "id": 10,
    "title": "Câu 10: Rút gọn biểu thức hai biến",
    "pts": 20,
    "question": "Rút gọn phân thức $P = \\frac{x^2 - y^2}{2x + 2y}$ (với $x + y \\neq 0$):",
    "options": [
      {
        "text": "$\\frac{x - y}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{x + y}{2}$",
        "correct": false
      },
      {
        "text": "$x - y$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      }
    ],
    "explanation": "Tử thức: $(x - y)(x + y)$; Mẫu thức: $2(x + y)$. Chia cả tử và mẫu cho $(x + y)$ ta được $\\frac{x - y}{2}$."
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
                const inK = document.getElementById('coeffK22');
                const inM = document.getElementById('coeffM22');
                const outEl = document.getElementById('lab1Output22');

                function gcd(a, b) {
                    a = Math.abs(a); b = Math.abs(b);
                    while (b) { let t = b; b = a % b; a = t; }
                    return a || 1;
                }

                function update() {
                    const k = parseInt(inK.value) || 1;
                    const m = parseInt(inM.value) || 1;
                    const g = gcd(k, m);
                    const simpK = k / g;
                    const simpM = m / g;

                    outEl.innerHTML = `<strong>Ban đầu:</strong> $\\frac{${k}(x - 2)(x + 3)}{${m}(x - 2)(x + 1)}$ &nbsp;$\\xrightarrow{\\text{Chia cả tử và mẫu cho } ${g}(x - 2)}$&nbsp; <strong>Tối giản:</strong> $\\frac{${simpK}(x + 3)}{${simpM}(x + 1)}$`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Trực quan hóa các khối nhân tử
                    ctx.fillStyle = '#6366f1';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('TRIỆT TIÊU NHÂN TỬ CHUNG TRÊN TỬ VÀ MẪU:', 40, 40);

                    // Khối tử
                    ctx.fillStyle = '#1e293b';
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(40, 65, 100, 45);
                    ctx.strokeRect(150, 65, 110, 45);
                    ctx.strokeRect(270, 65, 110, 45);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = '14px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText('Hệ số: ' + k, 90, 92);
                    ctx.fillText('(x - 2)', 205, 92);
                    ctx.fillText('(x + 3)', 325, 92);

                    // Dấu gạch chéo triệt tiêu trên (x - 2)
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(155, 105); ctx.lineTo(255, 70);
                    ctx.stroke();

                    // Dấu chia ngang
                    ctx.strokeStyle = '#94a3b8';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(40, 125); ctx.lineTo(380, 125);
                    ctx.stroke();

                    // Khối mẫu
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(40, 140, 100, 45);
                    ctx.strokeRect(150, 140, 110, 45);
                    ctx.strokeRect(270, 140, 110, 45);

                    ctx.fillStyle = '#ffffff';
                    ctx.fillText('Hệ số: ' + m, 90, 167);
                    ctx.fillText('(x - 2)', 205, 167);
                    ctx.fillText('(x + 1)', 325, 167);

                    // Dấu gạch chéo triệt tiêu dưới (x - 2)
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(155, 180); ctx.lineTo(255, 145);
                    ctx.stroke();

                    // Kết quả tối giản bên phải
                    ctx.fillStyle = '#10b981';
                    ctx.font = 'bold 22px Segoe UI';
                    ctx.fillText('➔', 420, 130);

                    ctx.fillStyle = '#f8fafc';
                    ctx.font = 'bold 16px Segoe UI';
                    ctx.textAlign = 'left';
                    ctx.fillText(`=  ${simpK}(x + 3)`, 460, 110);
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(455, 125); ctx.lineTo(560, 125); ctx.stroke();
                    ctx.fillText(`   ${simpM}(x + 1)`, 460, 150);
                }

                [inK, inM].forEach(el => el.addEventListener('input', update));
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const inA = document.getElementById('inA22');
                const inB = document.getElementById('inB22');
                const outEl = document.getElementById('lab2Output22');

                function gcd(a, b) {
                    a = Math.abs(a); b = Math.abs(b);
                    while (b) { let t = b; b = a % b; a = t; }
                    return a || 1;
                }
                function lcm(a, b) {
                    return Math.abs(a * b) / gcd(a, b);
                }

                function draw() {
                    const a = parseInt(inA.value) || 1;
                    const b = parseInt(inB.value) || 1;
                    const m = lcm(a, b);
                    const sub1 = `${m / a}x`;
                    const sub2 = `${m / b}(x - 1)`;

                    outEl.innerHTML = `<strong>Mẫu 1:</strong> $${a}x(x - 1)$ &nbsp;|&nbsp; <strong>Mẫu 2:</strong> $${b}x^2$ <br><strong>Mẫu thức chung (MTC):</strong> $${m}x^2(x - 1)$ &nbsp;|&nbsp; <strong>Nhân tử phụ 1:</strong> $${sub1}$ &nbsp;|&nbsp; <strong>Nhân tử phụ 2:</strong> $${sub2}$`;
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
                    ctx.fillText(`BCNN(${a}, ${b}) = ${m}`, 40, 45);

                    ctx.fillStyle = '#cbd5e1';
                    ctx.font = '14px Segoe UI';
                    ctx.fillText('Số mũ x lớn nhất: x²', 40, 75);
                    ctx.fillText('Nhân tử bậc nhất: (x - 1)', 40, 105);

                    // Khối MTC phát sáng
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(40, 130, w - 80, 65);
                    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
                    ctx.fillRect(40, 130, w - 80, 65);

                    ctx.fillStyle = '#f59e0b';
                    ctx.font = 'bold 20px Times New Roman';
                    ctx.textAlign = 'center';
                    ctx.fillText(`MTC = ${m}x²(x - 1)`, w / 2, 170);
                    ctx.textAlign = 'left';
                }

                [inA, inB].forEach(el => el.addEventListener('input', draw));
                draw();
            
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
