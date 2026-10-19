// ================================================================
// BÀI 3: ĐƯỜNG TIỆM CẬN CỦA ĐỒ THỊ HÀM SỐ - TOÁN 12 KNTT
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
    if (/[\+\-\*\=\/\<\>\(\)\[\]\{\}\,\;\:\!\?\|\']/.test(ch)) {
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
  s = s.replace(/\\(lim|max|min)\\s*\\limits\\s*\\{([^{}]+)\\}/g, '\\\\limits_{}');
  s = s.replace(/\\(lim|max|min)\\s*\\limits\\s*_\\{([^{}]+)\\}/g, (m, op, sub) => savePlaceholder('<munder><mo>' + op + '</mo><mrow>' + convertLatexToMathMLBody(sub, placeholders) + '</mrow></munder>'));
  s = s.replace(/\\(lim|max|min)\\s*\\limits\\s*_([a-zA-Z0-9])/g, (m, op, sub) => savePlaceholder('<munder><mo>' + op + '</mo><mrow>' + convertLatexToMathMLBody(sub, placeholders) + '</mrow></munder>'));

  function savePlaceholder(html) {
    const idx = placeholders.length;
    placeholders.push(html);
    return '\uE000' + idx + '\uE001';
  }

  s = s.replace(/\\text\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mtext>' + c + '</mtext>'));
  s = s.replace(/"([^"]*)"/g, (m, c) => savePlaceholder('<mtext>&ldquo;' + c + '&rdquo;</mtext>'));
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\widehat\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>^</mo></mover>'));

  let prevSqrt;
  do {
    prevSqrt = s;
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));
  } while (s !== prevSqrt);

  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
  } while (s !== prevFrac);

  s = s.replace(/\^\{\\circ\}/g, savePlaceholder('<mo>&#176;</mo>'));
  s = s.replace(/\^\\circ/g, savePlaceholder('<mo>&#176;</mo>'));

  for (const [k, v] of mathSymbols) {
    if (s.includes(k)) s = s.split(k).join(savePlaceholder(v));
  }

  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)\^\{([^{}]+)\}/g, (m, b, exp) => savePlaceholder('<msup><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(exp, placeholders) + '</mrow></msup>'));
  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)\^([a-zA-Z0-9])/g, (m, b, exp) => savePlaceholder('<msup><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(exp, placeholders) + '</mrow></msup>'));
  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)_\{([^{}]+)\}/g, (m, b, sub) => savePlaceholder('<msub><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(sub, placeholders) + '</mrow></msub>'));
  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)_([a-zA-Z0-9])/g, (m, b, sub) => savePlaceholder('<msub><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(sub, placeholders) + '</mrow></msub>'));

  const parts = s.split(/(\uE000\d+\uE001)/g);
  let finalOut = '';
  for (const part of parts) {
    if (!part) continue;
    const phMatch = part.match(/^\uE000(\d+)\uE001$/);
    if (phMatch) {
      let phContent = placeholders[parseInt(phMatch[1])];
      if (phContent) {
        while (phContent.includes('\uE000')) {
          phContent = phContent.replace(/\uE000(\d+)\uE001/g, (m, idx) => placeholders[parseInt(idx)] || '');
        }
        finalOut += phContent;
      }
    } else {
      finalOut += tokenizePlainMath(part);
    }
  }
  return finalOut;
}

function latexToMathML(latex, isBlock = false) {
  latex = latex.replace(/\\(lim|max|min)\\s*\\limits\\s*\\{([^{}]+)\\}/g, '\\\\limits_{}');
  if (typeof window !== "undefined" && window.katex && typeof window.katex.renderToString === "function") {
    try {
      return window.katex.renderToString(latex, { throwOnError: false, displayMode: isBlock });
    } catch (e) {}
  }
  const placeholders = [];
  const body = convertLatexToMathMLBody(latex, placeholders);
  return '<math xmlns="http://www.w3.org/1998/Math/MathML"' + (isBlock ? ' display="block"' : '') + '><mrow>' + body + '</mrow></math>';
}

function formatMathText(str) {
  if (typeof str !== 'string') return str;
  let res = str.replace(/\$\$([\s\S]+?)\$\$/g, (m, c) => '<div class="math-block">' + latexToMathML(c, true) + '</div>');
  res = res.replace(/\$([^\$\n]+?)\$/g, (m, c) => '<span class="math-inline">' + latexToMathML(c, false) + '</span>');
  return res;
}

function renderMathInTree(root = document.body) {
  if (!root) return;
  if (typeof renderMathInElement === "function") {
    try {
      renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {}
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const p = node.parentElement ? node.parentElement.tagName.toLowerCase() : '';
      if (p === 'script' || p === 'style' || p === 'textarea') return NodeFilter.FILTER_REJECT;
      return (node.nodeValue && node.nodeValue.includes('$')) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(node => {
    const text = node.nodeValue;
    if (!text || !text.includes('$')) return;
    const formatted = formatMathText(text);
    if (formatted !== text) {
      const temp = document.createElement('span');
      temp.innerHTML = formatted;
      node.replaceWith(...temp.childNodes);
    }
  });
}

// --- 1. HỆ THỐNG ÂM THANH WEB AUDIO API ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }
  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
  playCorrect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.15, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.2);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.22);
    });
  }
  playWrong() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.25);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }
  playLevelUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.08);
      gain.gain.setValueAtTime(0.2, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.32);
    });
  }
  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, t: 0, d: 0.15 },
      { f: 659.25, t: 0.15, d: 0.15 },
      { f: 783.99, t: 0.30, d: 0.2 },
      { f: 1046.50, t: 0.50, d: 0.45 }
    ];
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(n.f, now + n.t);
      gain.gain.setValueAtTime(0.22, now + n.t);
      gain.gain.exponentialRampToValueAtTime(0.001, now + n.t + n.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + n.t);
      osc.stop(now + n.t + n.d + 0.05);
    });
  }
}
const sound = new SoundController();

// --- 2. TRẠNG THÁI ỨNG DỤNG ---
const STATE_KEY = 'toan12_bai3_state_v1';
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Tiệm Cận Đồ Thị 12',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: {
    asymptote_horiz: false,
    asymptote_slant: false,
    streak: false,
    arena: false,
    master: false
  }
};

function loadState() {
  try {
    const raw = localStorage.getItem(STATE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      appState = Object.assign(appState, parsed);
    }
  } catch (e) {
    console.warn('LocalStorage load error:', e);
  }
  updateHud();
}

function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

function addXP(amount) {
  appState.xp += amount;
  sound.playLevelUp();
  updateHud();
  checkMasterBadge();
  saveState();
}

function updateHud() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starRatingEl = document.getElementById('starRating');
  const avatarBtn = document.getElementById('avatarBtn');
  const userTitleEl = document.getElementById('userTitle');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const certStudentName = document.getElementById('certStudentName');
  const certHonorsTitle = document.getElementById('certHonorsTitle');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (avatarBtn) avatarBtn.textContent = appState.avatar;
  if (userTitleEl) userTitleEl.textContent = appState.userTitle;
  if (userNameDisplay) userNameDisplay.textContent = `${appState.userName} 🌟`;

  const cleanStudentName = appState.userName.replace(/[^\p{L}\p{N}\s]/gu, '').trim() || appState.userName;
  if (certStudentName) certStudentName.textContent = cleanStudentName;
  if (certHonorsTitle) certHonorsTitle.textContent = `${appState.userTitle} 🏅`;

  let stars = '⭐☆☆☆☆';
  if (appState.xp >= 400) stars = '⭐⭐⭐⭐⭐';
  else if (appState.xp >= 300) stars = '⭐⭐⭐⭐☆';
  else if (appState.xp >= 200) stars = '⭐⭐⭐☆☆';
  else if (appState.xp >= 100) stars = '⭐⭐☆☆☆';
  if (starRatingEl) starRatingEl.textContent = stars;

  for (const [key, unlocked] of Object.entries(appState.badges)) {
    const el = document.getElementById(`badge-${key}`);
    if (el) {
      if (unlocked) {
        el.classList.add('unlocked');
        el.classList.remove('locked');
      } else {
        el.classList.remove('unlocked');
        el.classList.add('locked');
      }
    }
  }
}

function unlockBadge(key) {
  if (!appState.badges[key]) {
    appState.badges[key] = true;
    sound.playLevelUp();
    updateHud();
    checkMasterBadge();
    saveState();
  }
}

function checkMasterBadge() {
  const allOtherUnlocked = appState.badges.asymptote_horiz && appState.badges.asymptote_slant && appState.badges.streak && appState.badges.arena;
  if (allOtherUnlocked && !appState.badges.master) {
    appState.badges.master = true;
    sound.playFanfare();
    updateHud();
    saveState();
  }
}

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG SGK 10 CÂU ---
const quizData = [
  {
    id: 1,
    title: "Câu 1: Định nghĩa chuẩn về Đường Tiệm Cận Ngang",
    pts: 20,
    question: "Đường thẳng $y = y_0$ được gọi là đường tiệm cận ngang của đồ thị hàm số $y = f(x)$ nếu thỏa mãn điều kiện nào sau đây?",
    options: [
      { text: "$\\lim\\limits_{x \to y_0} f(x) = +\\infty$ hoặc $\\lim\\limits_{x \to y_0} f(x) = -\\infty$", correct: false },
      { text: "$\\lim\\limits_{x \to +\\infty} f(x) = y_0$ hoặc $\\lim\\limits_{x \to -\\infty} f(x) = y_0$", correct: true },
      { text: "$\\lim\\limits_{x \to 0} f(x) = y_0$", correct: false },
      { text: "$f'(x) = 0$ khi $x \\to \\pm\\infty$", correct: false }
    ],
    explanation: "Theo SGK Toán 12: Đường thẳng $y = y_0$ là tiệm cận ngang của đồ thị hàm số $y = f(x)$ nếu ít nhất một trong hai giới hạn $\\lim\\limits_{x \to +\\infty} f(x) = y_0$ hoặc $\\lim\\limits_{x \to -\\infty} f(x) = y_0$ thỏa mãn."
  },
  {
    id: 2,
    title: "Câu 2: Định nghĩa chuẩn về Đường Tiệm Cận Đứng",
    pts: 20,
    question: "Đường thẳng $x = x_0$ là tiệm cận đứng của đồ thị hàm số $y = f(x)$ nếu thỏa mãn điều kiện nào?",
    options: [
      { text: "$\\lim\\limits_{x \to x_0} f(x) = 0$", correct: false },
      { text: "$\\lim\\limits_{x \to +\\infty} f(x) = x_0$", correct: false },
      { text: "Ít nhất một trong các giới hạn một bên $\\lim\\limits_{x \\to x_0^+} f(x)$ hoặc $\\lim\\limits_{x \\to x_0^-} f(x)$ bằng $+\\infty$ hoặc $-\\infty$", correct: true },
      { text: "Hàm số không xác định tại $x_0$", correct: false }
    ],
    explanation: "Định nghĩa tiệm cận đứng yêu cầu giá trị của hàm số $f(x)$ phải bùng nổ ra vô cực ($+\\infty$ hoặc $-\\infty$) khi biến số $x$ tiến dần về $x_0$ từ bên trái hoặc bên phải."
  },
  {
    id: 3,
    title: "Câu 3 (SGK 1.16): Tiệm cận của hàm đối xứng chẵn",
    pts: 20,
    question: "Tìm các đường tiệm cận ngang và tiệm cận đứng của đồ thị hàm số $y = \\frac{2x^2}{x^2 - 1}$.",
    options: [
      { text: "Tiệm cận ngang $y = 2$; hai tiệm cận đứng $x = 1, x = -1$", correct: true },
      { text: "Tiệm cận ngang $y = 0$; hai tiệm cận đứng $x = 1, x = -1$", correct: false },
      { text: "Tiệm cận ngang $y = 2$; một tiệm cận đứng $x = 1$", correct: false },
      { text: "Không có tiệm cận ngang; hai tiệm cận đứng $x = \\pm 1$", correct: false }
    ],
    explanation: "Ta có: $\\lim\\limits_{x \\to \\pm\\infty} \\frac{2x^2}{x^2 - 1} = \\lim\\limits_{x \\to \\pm\\infty} \\frac{2}{1 - 1/x^2} = 2 \\Rightarrow$ tiệm cận ngang $y = 2$. Mẫu số $x^2 - 1 = 0 \\Leftrightarrow x = \\pm 1$. Vì tử số tại $\\pm 1$ bằng $2 \\ne 0$ nên $\\lim\\limits_{x \\to 1^\\pm} y = \\pm\\infty$ và $\\lim\\limits_{x \\to -1^\\pm} y = \\mp\\infty$. Do đó có hai tiệm cận đứng $x = 1$ và $x = -1$."
  },
  {
    id: 4,
    title: "Câu 4 (SGK 1.17): Bẫy nghiệm triệt tiêu ở mẫu",
    pts: 20,
    question: "Đường thẳng $x = 1$ có phải là tiệm cận đứng của đồ thị hàm số $y = \\frac{x^2 + 2x - 3}{x - 1}$ không? Vì sao?",
    options: [
      { text: "Có, vì $x = 1$ làm cho mẫu số bằng $0$.", correct: false },
      { text: "Không, vì giới hạn $\\lim\\limits_{x \\to 1} y = 4$ là một số hữu hạn, không tiến ra vô cực.", correct: true },
      { text: "Có, vì đồ thị gián đoạn tại $x = 1$.", correct: false },
      { text: "Không, vì đồ thị có tiệm cận xiên nên không có tiệm cận đứng.", correct: false }
    ],
    explanation: "Ta biến đổi: $\\frac{x^2 + 2x - 3}{x - 1} = \\frac{(x - 1)(x + 3)}{x - 1} = x + 3$ với mọi $x \\ne 1$. Do đó $\\lim\\limits_{x \\to 1} y = \\lim\\limits_{x \\to 1} (x + 3) = 4$. Vì giới hạn không phải là vô cực nên đường thẳng $x = 1$ KHÔNG PHẢI là tiệm cận đứng!"
  },
  {
    id: 5,
    title: "Câu 5 (SGK 1.18a): Tiệm cận của hàm phân thức bậc 1 trên bậc 1",
    pts: 20,
    question: "Tìm các đường tiệm cận đứng và tiệm cận ngang của đồ thị hàm số $y = \\frac{3 - x}{2x + 1}$.",
    options: [
      { text: "Tiệm cận đứng $x = -\\frac{1}{2}$, tiệm cận ngang $y = -\\frac{1}{2}$", correct: true },
      { text: "Tiệm cận đứng $x = \\frac{1}{2}$, tiệm cận ngang $y = 3$", correct: false },
      { text: "Tiệm cận đứng $x = -\\frac{1}{2}$, tiệm cận ngang $y = \\frac{3}{2}$", correct: false },
      { text: "Tiệm cận đứng $x = 3$, tiệm cận ngang $y = -1$", correct: false }
    ],
    explanation: "Mẫu số triệt tiêu tại $2x + 1 = 0 \\Leftrightarrow x = -\\frac{1}{2}$ (tử số bằng $3 - (-0.5) = 3.5 \\ne 0$) nên tiệm cận đứng là $x = -\\frac{1}{2}$. Tiệm cận ngang: $\\lim\\limits_{x \\to \\pm\\infty} \\frac{-x + 3}{2x + 1} = -\\frac{1}{2}$, do đó $y = -\\frac{1}{2}$."
  },
  {
    id: 6,
    title: "Câu 6 (SGK 1.18b): Xác định tiệm cận xiên bằng phép chia đa thức",
    pts: 20,
    question: "Tìm đường tiệm cận xiên của đồ thị hàm số $y = \\frac{2x^2 + x - 1}{x + 2}$.",
    options: [
      { text: "$y = 2x + 3$", correct: false },
      { text: "$y = 2x - 3$", correct: true },
      { text: "$y = 2x - 1$", correct: false },
      { text: "$y = x - 3$", correct: false }
    ],
    explanation: "Thực hiện phép chia đa thức tử cho mẫu: $2x^2 + x - 1 = (2x - 3)(x + 2) + 5$. Do đó $y = 2x - 3 + \\frac{5}{x + 2}$. Vì $\\lim\\limits_{x \\to \\pm\\infty} [y - (2x - 3)] = \\lim\\limits_{x \\to \\pm\\infty} \\frac{5}{x + 2} = 0$, nên đường tiệm cận xiên là $y = 2x - 3$."
  },
  {
    id: 7,
    title: "Câu 7 (SGK 1.19): Ý nghĩa thực tiễn của tiệm cận chi phí trung bình",
    pts: 20,
    question: "Một công ty sản xuất chi phí $C(x) = 2x + 50$ (triệu đồng). Chi phí sản xuất trung bình mỗi sản phẩm là $f(x) = \\frac{C(x)}{x}$. Giới hạn $\\lim\\limits_{x \\to +\\infty} f(x) = 2$ nói lên điều gì?",
    options: [
      { text: "Tổng chi phí tối đa của công ty là $2$ triệu đồng.", correct: false },
      { text: "Khi số lượng sản phẩm sản xuất càng lớn thì chi phí sản xuất trung bình cho mỗi sản phẩm sẽ tiến dần về $2$ triệu đồng.", correct: true },
      { text: "Công ty sẽ bị lỗ $2$ triệu đồng nếu sản xuất quá nhiều.", correct: false },
      { text: "Mỗi sản phẩm luôn có giá bán cố định là $2$ triệu đồng.", correct: false }
    ],
    explanation: "Hàm chi phí trung bình $f(x) = 2 + \\frac{50}{x}$. Khi sản lượng $x$ tăng lên rất lớn ($x \\to +\\infty$), phần chi phí cố định phân bổ $\\frac{50}{x} \\to 0$, do đó chi phí trung bình tiệm cận về mức chi phí biến đổi là $2$ triệu đồng/sản phẩm (đường tiệm cận ngang $y = 2$)."
  },
  {
    id: 8,
    title: "Câu 8 (SGK 1.20): Tiệm cận xiên của hàm chu vi hình chữ nhật",
    pts: 20,
    question: "Một mảnh vườn hình chữ nhật diện tích $144\\text{ m}^2$ có cạnh $x$ (m). Biểu thức chu vi là $P(x) = 2\\left(x + \\frac{144}{x}\\right) = 2x + \\frac{288}{x}$ với $x > 0$. Đồ thị hàm số $P(x)$ có tiệm cận xiên là:",
    options: [
      { text: "$y = 2x + 144$", correct: false },
      { text: "$y = 2x$", correct: true },
      { text: "$y = x$", correct: false },
      { text: "$y = 288x$", correct: false }
    ],
    explanation: "Xét hiệu $P(x) - 2x = \\frac{288}{x}$. Khi $x \\to +\\infty$ thì $\\lim\\limits_{x \\to +\\infty} [P(x) - 2x] = 0$. Theo định nghĩa, đường thẳng $y = 2x$ chính là đường tiệm cận xiên của đồ thị hàm số chu vi $P(x)$."
  },
  {
    id: 9,
    title: "Câu 9: Số đường tiệm cận của hàm chứa căn thức",
    pts: 20,
    question: "Tổng số đường tiệm cận (đứng và ngang) của đồ thị hàm số $y = \\frac{x + 1}{\\sqrt{x^2 - 1}}$ là bao nhiêu?",
    options: [
      { text: "$1$", correct: false },
      { text: "$2$", correct: false },
      { text: "$3$", correct: true },
      { text: "$4$", correct: false }
    ],
    explanation: "Tập xác định: $x^2 - 1 > 0 \\Leftrightarrow x \\in (-\\infty; -1) \\cup (1; +\\infty)$. Khi $x \\to +\\infty: y = \\frac{x(1 + 1/x)}{x\\sqrt{1 - 1/x^2}} \\to 1 \\Rightarrow y = 1$ là tiệm cận ngang. Khi $x \\to -\\infty: \\sqrt{x^2 - 1} = |x|\\sqrt{1 - 1/x^2} = -x\\sqrt{1 - 1/x^2} \\Rightarrow y \\to -1 \\Rightarrow y = -1$ là tiệm cận ngang. Tại $x \\to 1^+: y \\to +\\infty \\Rightarrow x = 1$ là tiệm cận đứng. Tại $x \\to -1^-: y = \\frac{\\sqrt{-(x+1)}^2}{-\\sqrt{-(x+1)}\\sqrt{1-x}} \\to 0$ (hữu hạn, không phải TC đứng). Vậy đồ thị có đúng $3$ đường tiệm cận ($y = 1, y = -1, x = 1$)."
  },
  {
    id: 10,
    title: "Câu 10: Nhận xét tâm đối xứng tạo bởi các đường tiệm cận",
    pts: 20,
    question: "Giao điểm của tiệm cận đứng và tiệm cận xiên (hoặc ngang) của đồ thị hàm phân thức có tính chất hình học đặc biệt nào?",
    options: [
      { text: "Luôn là điểm cực đại của đồ thị hàm số.", correct: false },
      { text: "Là tâm đối xứng của đồ thị hàm số.", correct: true },
      { text: "Là điểm mà tại đó hàm số đạt giá trị lớn nhất.", correct: false },
      { text: "Luôn nằm trên trục hoành $Ox$.", correct: false }
    ],
    explanation: "Theo tính chất hình học trong SGK Toán 12: Đồ thị hàm phân thức bậc 1/bậc 1 nhận giao điểm của 2 đường tiệm cận (đứng và ngang) làm tâm đối xứng; đồ thị hàm phân thức bậc 2/bậc 1 nhận giao điểm của tiệm cận đứng và tiệm cận xiên làm tâm đối xứng."
  }
];

// --- 4. RENDER ĐẤU TRƯỜNG & TƯƠNG TÁC TỨC THÌ ---
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let answeredCount = 0;
  let scoreTotal = 0;

  quizData.forEach((q, idx) => {
    const isAnswered = appState.answered[q.id] !== undefined;
    if (isAnswered) {
      answeredCount++;
      if (appState.answered[q.id].correct) scoreTotal += q.pts;
    }

    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard-${q.id}`;

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `
      <span class="quiz-badge">${q.title}</span>
      <span class="quiz-pts">+${q.pts} XP</span>
    `;
    card.appendChild(header);

    const questionText = document.createElement('div');
    questionText.className = 'quiz-question';
    questionText.innerHTML = formatMathText(q.question);
    card.appendChild(questionText);

    const optGrid = document.createElement('div');
    optGrid.className = 'quiz-options-grid';

    q.options.forEach((opt, optIdx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      const label = String.fromCharCode(65 + optIdx);
      btn.innerHTML = `<span class="opt-label">${label}</span><span>${formatMathText(opt.text)}</span>`;

      if (isAnswered) {
        btn.disabled = true;
        const userChoice = appState.answered[q.id].selected;
        if (optIdx === userChoice) {
          btn.classList.add(opt.correct ? 'correct' : 'wrong');
          const iconSpan = document.createElement('span');
          iconSpan.className = 'opt-status-icon';
          iconSpan.textContent = opt.correct ? ' ✓ Đúng' : ' ✕ Sai';
          iconSpan.style.marginLeft = 'auto';
          iconSpan.style.fontWeight = 'bold';
          btn.appendChild(iconSpan);
        } else if (opt.correct) {
          btn.classList.add('correct');
          const iconSpan = document.createElement('span');
          iconSpan.className = 'opt-status-icon';
          iconSpan.textContent = ' ✓ Đáp án đúng';
          iconSpan.style.marginLeft = 'auto';
          iconSpan.style.fontWeight = 'bold';
          btn.appendChild(iconSpan);
        }
      } else {
        btn.onclick = () => handleAnswer(q.id, optIdx, opt.correct);
      }

      optGrid.appendChild(btn);
    });
    card.appendChild(optGrid);

    const expBox = document.createElement('div');
    expBox.className = `explanation-box ${isAnswered ? 'show' : ''}`;
    expBox.id = `exp-${q.id}`;
    expBox.innerHTML = `<strong>💡 Lời giải chi tiết:</strong> ${formatMathText(q.explanation)}`;
    card.appendChild(expBox);

    container.appendChild(card);
  });

  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progEl) progEl.textContent = `${answeredCount}/${quizData.length}`;
  if (scoreEl) scoreEl.textContent = `${scoreTotal} XP`;

  if (answeredCount === quizData.length) {
    showArenaSummary(Object.values(appState.answered).filter(a => a.correct).length);
  }

  renderMathInTree(container);
}

function handleAnswer(questionId, optionIdx, isCorrect) {
  if (appState.answered[questionId] !== undefined) return;
  const q = quizData.find(item => item.id === questionId);
  if (!q) return;

  appState.answered[questionId] = { selected: optionIdx, correct: isCorrect };

  // Cập nhật thẻ câu hỏi tại chỗ (in-place)
  const card = document.getElementById(`quizCard-${questionId}`);
  if (card) {
    const buttons = card.querySelectorAll('.quiz-opt-btn');
    buttons.forEach((btn, optIdx) => {
      btn.disabled = true;
      if (optIdx === optionIdx) {
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        const iconSpan = document.createElement('span');
        iconSpan.className = 'opt-status-icon';
        iconSpan.textContent = isCorrect ? ' ✓ Đúng' : ' ✕ Sai';
        iconSpan.style.marginLeft = 'auto';
        iconSpan.style.fontWeight = 'bold';
        btn.appendChild(iconSpan);
      } else if (q.options[optIdx].correct) {
        btn.classList.add('correct');
        const iconSpan = document.createElement('span');
        iconSpan.className = 'opt-status-icon';
        iconSpan.textContent = ' ✓ Đáp án đúng';
        iconSpan.style.marginLeft = 'auto';
        iconSpan.style.fontWeight = 'bold';
        btn.appendChild(iconSpan);
      }
    });

    const expBox = document.getElementById(`exp-${questionId}`);
    if (expBox) {
      expBox.classList.add('show');
    }
  }

  if (isCorrect) {
    sound.playCorrect();
    appState.streak++;
    addXP(20);
    if (appState.streak >= 5) unlockBadge('streak');
  } else {
    sound.playWrong();
    appState.streak = 0;
  }

  const answeredValues = Object.values(appState.answered);
  const correctCount = answeredValues.filter(a => a.correct).length;
  const totalCount = answeredValues.length;

  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progEl) progEl.textContent = `${totalCount}/${quizData.length}`;
  if (scoreEl) scoreEl.textContent = `${correctCount * 20} XP`;

  if (correctCount >= 8) unlockBadge('arena');
  if (correctCount === 10) unlockBadge('master');

  saveState();
  updateHud();

  if (totalCount === quizData.length) {
    showArenaSummary(correctCount);
  }
}

function showArenaSummary(correctTotal) {
  try {
    if (window.parent && window.parent !== window) {
      const qLen = typeof quizData !== 'undefined' && quizData.length ? quizData.length : 10;
      const calcScore = Math.min(10, Math.max(0, Math.round((correctTotal / qLen) * 10)));
      window.parent.postMessage({
        type: 'LESSON_COMPLETE',
        score: calcScore,
        lesson: 'toan12_bai3',
        correct: correctTotal,
        total: qLen
      }, '*');
    }
  } catch (err) {
    console.warn('PostMessage error:', err);
  }
  const container = document.getElementById('quizContainer');
  if (!container) return;
  const existing = document.getElementById('arenaSummaryBanner');
  if (existing) existing.remove();

  const banner = document.createElement('div');
  banner.className = 'arena-summary-banner';
  banner.id = 'arenaSummaryBanner';
  const pct = Math.round((correctTotal / quizData.length) * 100);
  banner.innerHTML = `
    <h3>🎉 Chúc Mừng Bạn Đã Hoàn Thành Đấu Trường!</h3>
    <p>Kết quả: <strong>${correctTotal}/${quizData.length} câu đúng</strong> (${pct}%) • Tích lũy <strong>${correctTotal * 20} XP</strong></p>
    <div class="arena-summary-actions">
      <button class="btn-retake" id="btnRetakeArena">🔄 Làm Lại Đấu Trường Để Cải Thiện Điểm</button>
      <a href="#tab-badges" class="btn-primary" id="btnGoToBadges">🏆 Xem Huy Hiệu & Nhận Bằng A4</a>
    </div>
  `;
  container.appendChild(banner);

  const btnRetake = document.getElementById('btnRetakeArena');
  if (btnRetake) {
    btnRetake.onclick = () => {
      appState.answered = {};
      saveState();
      renderQuiz();
      sound.playTone(520, 'sine', 0.15, 0.1);
      const firstCard = document.getElementById('quizCard-1');
      if (firstCard) firstCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    };
  }

  const btnGoBadges = document.getElementById('btnGoToBadges');
  if (btnGoBadges) {
    btnGoBadges.onclick = (e) => {
      e.preventDefault();
      const badgeTab = document.querySelector('[data-tab="badges"]');
      if (badgeTab) badgeTab.click();
    };
  }
}

// --- 5. LOGIC PHÒNG THÍ NGHIỆM LAB 1 (MÁY THĂM DÒ TIỆM CẬN ĐỨNG & NGANG) ---
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderX = document.getElementById('lab1SliderX');
  const valX = document.getElementById('lab1ValX');
  const dispX = document.getElementById('lab1DispX');
  const dispY = document.getElementById('lab1DispY');
  const distVert = document.getElementById('lab1DistVert');
  const distHoriz = document.getElementById('lab1DistHoriz');
  const statusBox = document.getElementById('lab1StatusBox');

  // y = (3 - x) / (2x + 1)
  // Pole at x = -0.5, Asymptote at y = -0.5
  function f(x) {
    if (Math.abs(2 * x + 1) < 0.01) return null;
    return (3 - x) / (2 * x + 1);
  }

  function draw() {
    let x = parseFloat(sliderX.value);
    if (Math.abs(x - (-0.5)) < 0.05) {
      x = x >= -0.5 ? -0.45 : -0.55;
      sliderX.value = x.toFixed(2);
    }

    const y = f(x);
    if (valX) valX.textContent = `$${x.toFixed(2)}$`;
    if (dispX) dispX.textContent = `$${x.toFixed(2)}$`;
    if (dispY) dispY.textContent = y !== null ? `$${y.toFixed(2)}$` : '$\\infty$';

    const dV = Math.abs(x - (-0.5));
    const dH = y !== null ? Math.abs(y - (-0.5)) : 999;
    if (distVert) distVert.textContent = `$${dV.toFixed(2)}$`;
    if (distHoriz) distHoriz.textContent = `$${dH.toFixed(2)}$`;

    if (statusBox) {
      if (dV < 0.2) {
        statusBox.innerHTML = `⚠️ <strong>ĐIỂM SÁT TIỆM CẬN ĐỨNG!</strong> Khoảng cách tới $x = -0.5$ chỉ còn $${dV.toFixed(2)}$. Giá trị $y$ vọt lên $${y.toFixed(1)}$ phóng ra vô cực!`;
      } else if (dH < 0.15) {
        statusBox.innerHTML = `🔵 <strong>ĐIỂM TIỆM CẬN NGANG!</strong> Khi $x$ ra xa, giá trị $y$ ép sát vào tiệm cận ngang $y = -0.50$ (khoảng cách chỉ còn $${dH.toFixed(2)}$)!`;
      } else {
        statusBox.innerHTML = `Điểm $M(${x.toFixed(2)}; ${y.toFixed(2)})$ đang nằm trên nhánh Hyperbol. Di chuyển thanh trượt để cảm nhận sự áp sát của các đường tiệm cận!`;
      }
      renderMathInTree(statusBox);
    }

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Coord transform: x in [-5, 4], y in [-6, 6]
    const xMin = -5, xMax = 4, yMin = -6, yMax = 6;
    function toCanvasX(cx) { return (cx - xMin) / (xMax - xMin) * (W - 80) + 40; }
    function toCanvasY(cy) { return H - 40 - (cy - yMin) / (yMax - yMin) * (H - 80); }

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let gx = -4; gx <= 3; gx += 1) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(gx), 0);
      ctx.lineTo(toCanvasX(gx), H);
      ctx.stroke();
    }
    for (let gy = -4; gy <= 4; gy += 2) {
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(gy));
      ctx.lineTo(W, toCanvasY(gy));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(W, toCanvasY(0));
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), H);
    ctx.stroke();

    // Tiệm cận đứng x = -0.5 (Đỏ đứt nét phát sáng)
    const poleX = toCanvasX(-0.5);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(poleX, 0);
    ctx.lineTo(poleX, H);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Tiệm cận ngang y = -0.5 (Cyan đứt nét phát sáng)
    const horizY = toCanvasY(-0.5);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(0, horizY);
    ctx.lineTo(W, horizY);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

    // Intersection center I(-0.5; -0.5)
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(poleX, horizY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Curve left branch: x in [-5, -0.55]
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let cx = xMin; cx <= -0.54; cx += 0.04) {
      const cy = f(cx);
      const px = toCanvasX(cx);
      const py = toCanvasY(cy);
      if (py >= -100 && py <= H + 100) {
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Curve right branch: x in [-0.46, 4]
    ctx.beginPath();
    started = false;
    for (let cx = -0.46; cx <= xMax; cx += 0.04) {
      const cy = f(cx);
      const px = toCanvasX(cx);
      const py = toCanvasY(cy);
      if (py >= -100 && py <= H + 100) {
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Current point M(x; y)
    if (y !== null) {
      const mx = toCanvasX(x);
      const my = toCanvasY(y);

      // Distance guidelines
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(poleX, my); // to vertical asymptote
      ctx.moveTo(mx, my);
      ctx.lineTo(mx, horizY); // to horizontal asymptote
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f59e0b';
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.arc(mx, my, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Labels
    ctx.fillStyle = '#fb7185';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('x = -0.5 (TC đứng)', poleX + 6, 25);

    ctx.fillStyle = '#06b6d4';
    ctx.fillText('y = -0.5 (TC ngang)', W - 120, horizY - 8);

    ctx.fillStyle = '#a855f7';
    ctx.fillText('Tâm I(-0.5; -0.5)', poleX + 8, horizY + 16);

    unlockBadge('asymptote_horiz');
  }

  sliderX.oninput = () => { sound.playClick(); draw(); };

  const btnLeft = document.getElementById('btnNearPoleLeft');
  if (btnLeft) {
    btnLeft.onclick = () => {
      sliderX.value = '-0.6';
      sound.playClick();
      draw();
    };
  }

  const btnRight = document.getElementById('btnNearPoleRight');
  if (btnRight) {
    btnRight.onclick = () => {
      sliderX.value = '-0.4';
      sound.playClick();
      draw();
    };
  }

  const btnInf = document.getElementById('btnFarInfinity');
  if (btnInf) {
    btnInf.onclick = () => {
      sliderX.value = '3.8';
      sound.playClick();
      draw();
    };
  }

  draw();
}

// --- 6. LOGIC PHÒNG THÍ NGHIỆM LAB 2 (TIỆM CẬN XIÊN) ---
function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderX = document.getElementById('lab2SliderX');
  const valX = document.getElementById('lab2ValX');
  const valY = document.getElementById('lab2ValY');
  const valYslant = document.getElementById('lab2ValYslant');
  const deltaY = document.getElementById('lab2DeltaY');
  const statusBox = document.getElementById('lab2StatusBox');

  // y = (2x^2 + x - 1) / (x + 2) = 2x - 3 + 5 / (x + 2)
  // Pole at x = -2, Slant asymptote: y = 2x - 3
  function f(x) {
    if (Math.abs(x + 2) < 0.02) return null;
    return (2 * x * x + x - 1) / (x + 2);
  }
  function slant(x) {
    return 2 * x - 3;
  }

  function draw() {
    let x = parseFloat(sliderX.value);
    if (Math.abs(x - (-2)) < 0.1) {
      x = x >= -2 ? -1.85 : -2.15;
      sliderX.value = x.toFixed(1);
    }

    const y = f(x);
    const ys = slant(x);
    const dy = Math.abs(5 / (x + 2));

    if (valX) valX.textContent = `$${x.toFixed(1)}$`;
    if (valY) valY.textContent = y !== null ? `$${y.toFixed(2)}$` : '$\\infty$';
    if (valYslant) valYslant.textContent = `$${ys.toFixed(2)}$`;
    if (deltaY) deltaY.textContent = `$${dy.toFixed(2)}$`;

    if (statusBox) {
      if (dy < 0.6) {
        statusBox.innerHTML = `✨ <strong>TIẾP CẬN SIÊU GẦN!</strong> Tại $x = ${x.toFixed(1)}$, khoảng cách thẳng đứng $|\Delta y| = \\frac{5}{|x + 2|} = ${dy.toFixed(2)}$. Đồ thị gần như trùng khít với đường tiệm cận xiên $y = 2x - 3$!`;
      } else {
        statusBox.innerHTML = `Độ lệch hiện tại là $|\Delta y| = ${dy.toFixed(2)}$. Thử bấm các nút phía trên để đưa $x$ tiến về $\\pm\\infty$ và quan sát sai lệch triệt tiêu!`;
      }
      renderMathInTree(statusBox);
    }

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Coord mapping: x in [-8, 5], y in [-18, 10]
    const xMin = -8, xMax = 5, yMin = -18, yMax = 10;
    function toCanvasX(cx) { return (cx - xMin) / (xMax - xMin) * (W - 80) + 40; }
    function toCanvasY(cy) { return H - 40 - (cy - yMin) / (yMax - yMin) * (H - 80); }

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let gx = -7; gx <= 4; gx += 2) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(gx), 0);
      ctx.lineTo(toCanvasX(gx), H);
      ctx.stroke();
    }
    for (let gy = -15; gy <= 8; gy += 5) {
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(gy));
      ctx.lineTo(W, toCanvasY(gy));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(W, toCanvasY(0));
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), H);
    ctx.stroke();

    // Tiệm cận đứng x = -2 (Đỏ)
    const poleX = toCanvasX(-2);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(poleX, 0);
    ctx.lineTo(poleX, H);
    ctx.stroke();

    // Tiệm cận xiên y = 2x - 3 (Cam neon)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(xMin), toCanvasY(slant(xMin)));
    ctx.lineTo(toCanvasX(xMax), toCanvasY(slant(xMax)));
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.setLineDash([]);

    // Curve left branch: [-8, -2.1]
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let cx = xMin; cx <= -2.1; cx += 0.05) {
      const cy = f(cx);
      const px = toCanvasX(cx);
      const py = toCanvasY(cy);
      if (py >= -150 && py <= H + 150) {
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Curve right branch: [-1.9, 5]
    ctx.beginPath();
    started = false;
    for (let cx = -1.9; cx <= xMax; cx += 0.05) {
      const cy = f(cx);
      const px = toCanvasX(cx);
      const py = toCanvasY(cy);
      if (py >= -150 && py <= H + 150) {
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Current point M on curve & N on slant asymptote
    if (y !== null) {
      const mx = toCanvasX(x);
      const my = toCanvasY(y);
      const ny = toCanvasY(ys);

      // Connecting vertical segment representing delta y
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.lineTo(mx, ny);
      ctx.stroke();

      // Point N on slant
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(mx, ny, 5, 0, Math.PI * 2);
      ctx.fill();

      // Point M on curve
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(mx, my, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    // Center of symmetry I(-2; -7)
    const intY = toCanvasY(-7);
    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(poleX, intY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Labels
    ctx.fillStyle = '#fb7185';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('x = -2 (TC đứng)', poleX + 6, 25);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText('y = 2x - 3 (TC xiên)', toCanvasX(2), toCanvasY(slant(2)) - 10);

    ctx.fillStyle = '#a855f7';
    ctx.fillText('Tâm I(-2; -7)', poleX + 8, intY + 16);

    unlockBadge('asymptote_slant');
  }

  sliderX.oninput = () => { sound.playClick(); draw(); };

  const btnNear = document.getElementById('btnLab2NearPole');
  if (btnNear) {
    btnNear.onclick = () => {
      sliderX.value = '-1.5';
      sound.playClick();
      draw();
    };
  }

  const btnPos = document.getElementById('btnLab2PosInf');
  if (btnPos) {
    btnPos.onclick = () => {
      sliderX.value = '3.8';
      sound.playClick();
      draw();
    };
  }

  const btnNeg = document.getElementById('btnLab2NegInf');
  if (btnNeg) {
    btnNeg.onclick = () => {
      sliderX.value = '-6.5';
      sound.playClick();
      draw();
    };
  }

  draw();
}

// --- 7. TABS NAVIGATION & MODAL AVATAR & RESET ---
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.onclick = () => {
      sound.playClick();
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const target = tab.dataset.tab;
      document.querySelectorAll('.tab-content').forEach(c => {
        if (c.id === `tab-${target}`) c.classList.add('active');
        else c.classList.remove('active');
      });
    };
  });
}

function initAvatarModal() {
  const modal = document.getElementById('avatarModal');
  const avatarBtn = document.getElementById('avatarBtn');
  const closeBtn = document.getElementById('btnCloseModal');
  const choices = document.querySelectorAll('.avatar-choice');

  if (avatarBtn && modal) {
    avatarBtn.onclick = () => {
      sound.playClick();
      modal.style.display = 'flex';
      modal.classList.add('active');
    };
  }

  if (closeBtn && modal) {
    closeBtn.onclick = () => {
      sound.playClick();
      modal.style.display = 'none';
      modal.classList.remove('active');
    };
  }

  choices.forEach(ch => {
    ch.onclick = () => {
      sound.playClick();
      appState.avatar = ch.dataset.avatar;
      appState.userTitle = ch.dataset.title;
      choices.forEach(c => c.classList.remove('selected'));
      ch.classList.add('selected');
      updateHud();
      saveState();
    };
  });
}

function initActions() {
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.onclick = () => {
      appState.sound = !appState.sound;
      sound.enabled = appState.sound;
      soundToggle.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      saveState();
    };
  }

  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.onclick = () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập của Bài 3 không?')) {
        localStorage.removeItem(STATE_KEY);
        location.reload();
      }
    };
  }

  const certDate = document.getElementById('certDate');
  if (certDate) {
    const today = new Date();
    certDate.textContent = `Đà Nẵng, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
  }
}

// --- KHỞI CHẠY ỨNG DỤNG ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTabs();
  initAvatarModal();
  initActions();
  initLab1();
  initLab2();
  renderQuiz();
  renderMathInTree(document.body);
});
