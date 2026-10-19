// ================================================================
// BÀI 1: TÍNH ĐƠN ĐIỆU VÀ CỰC TRỊ CỦA HÀM SỐ - TOÁN 12 KNTT
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
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));

  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
  } while (s !== prevFrac);

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
  if (typeof str !== 'string' || !str) return str || '';
  if (typeof window !== "undefined" && window.katex && typeof window.katex.renderToString === "function") {
    str = str.replace(/\$\$([\s\S]*?)\$\$/g, (m, latex) => {
      try {
        let s = latex.trim().replace(/(^|[^\\])%/g, '$1\\%');
        return window.katex.renderToString(s, { throwOnError: false, displayMode: true, strict: false });
      } catch (e) { return m; }
    });
    str = str.replace(/\$([^\$\n]+?)\$/g, (m, latex) => {
      try {
        let s = latex.trim().replace(/(^|[^\\])%/g, '$1\\%');
        return window.katex.renderToString(s, { throwOnError: false, displayMode: false, strict: false });
      } catch (e) { return m; }
    });
    return str;
  }
  str = str.replace(/\$\$([\s\S]*?)\$\$/g, (m, latex) => latexToMathML(latex, true));
  str = str.replace(/\$([^\$\n]+?)\$/g, (m, latex) => latexToMathML(latex, false));
  return str;
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
    } catch (e) {
      console.warn("KaTeX renderMathInElement error:", e);
    }
  }
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'textarea', 'option', 'noscript'].includes(tag) || parent.closest('.katex') || parent.closest('math')) {
        return NodeFilter.FILTER_REJECT;
      }
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

// --- 1. ÂM THANH WEB AUDIO API ---
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
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq = 440, type = 'sine', duration = 0.15, vol = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
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
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playCorrect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.12, 0.15), idx * 70);
    });
  }

  playWrong() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.playTone(260, 'sawtooth', 0.2, 0.2);
    setTimeout(() => this.playTone(195, 'sawtooth', 0.3, 0.2), 150);
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    [440, 554.37, 659.25, 880, 1108.7].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.18, 0.15), i * 90);
    });
  }

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.22, 0.2), idx * 110);
    });
  }
}

const sound = new SoundController();

// --- 2. TRẠNG THÁI TOÀN CỤC (STATE) ---
const STATE_KEY = 'toan12_bai1_dondieu_cuctri_state';

const appState = {
  xp: 0,
  streak: 0,
  maxStreak: 0,
  avatar: '👑',
  userTitle: 'Chuyên Gia Giải Tích 12',
  userName: 'Chiến Binh Logic',
  badges: {
    derivative: false,
    extrema: false,
    streak: false,
    arena: false,
    master: false
  },
  soundEnabled: true,
  answered: {}
};

function loadState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      Object.assign(appState, JSON.parse(saved));
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
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
  const allOtherUnlocked = appState.badges.derivative && appState.badges.extrema && appState.badges.streak && appState.badges.arena;
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
    title: "Câu 1 (SGK 1.30): Điều kiện đủ của tính đồng biến",
    pts: 20,
    question: "Cho hàm số $y = f(x)$ có đạo hàm trên khoảng $(a; b)$. Phát biểu nào sau đây là đúng?",
    options: [
      { text: "Nếu $f'(x) \\ge 0$ với mọi $x \\in (a; b)$ thì hàm số đồng biến trên $(a; b)$.", correct: false },
      { text: "Nếu $f'(x) > 0$ với mọi $x \\in (a; b)$ thì hàm số $y = f(x)$ đồng biến trên $(a; b)$.", correct: true },
      { text: "Hàm số $y = f(x)$ đồng biến trên $(a; b)$ khi và chỉ khi $f'(x) \\ge 0$ với mọi $x \\in (a; b)$.", correct: false },
      { text: "Hàm số $y = f(x)$ đồng biến trên $(a; b)$ khi và chỉ khi $f'(x) > 0$ với mọi $x \\in (a; b)$.", correct: false }
    ],
    explanation: "Theo định lý SGK Toán 12: Nếu $f'(x) > 0$ với mọi $x \\in (a; b)$ thì hàm số $y = f(x)$ đồng biến trên $(a; b)$. Chiều ngược lại không đúng vì đạo hàm có thể bằng $0$ tại một số điểm rời rạc (ví dụ hàm $y = x^3$ đồng biến trên $\\mathbb{R}$ nhưng $y'(0) = 0$)."
  },
  {
    id: 2,
    title: "Câu 2 (SGK 1.2a): Xét tính đồng biến của hàm bậc ba",
    pts: 20,
    question: "Hàm số $y = \\frac{1}{3}x^3 - 2x^2 + 3x + 1$ đồng biến trên những khoảng nào sau đây?",
    options: [
      { text: "Khoảng $(1; 3)$.", correct: false },
      { text: "Các khoảng $(-\\infty; 1)$ và $(3; +\\infty)$.", correct: true },
      { text: "Khoảng $(-\\infty; 3)$.", correct: false },
      { text: "Khoảng $(1; +\\infty)$.", correct: false }
    ],
    explanation: "Ta có $y' = x^2 - 4x + 3 = (x - 1)(x - 3)$. Cho $y' = 0 \\Leftrightarrow x = 1$ hoặc $x = 3$. Xét dấu tam thức bậc hai: $y' > 0$ khi $x < 1$ hoặc $x > 3$. Do đó hàm số đồng biến trên từng khoảng $(-\\infty; 1)$ và $(3; +\\infty)$."
  },
  {
    id: 3,
    title: "Câu 3 (SGK 1.2b): Tính đơn điệu trên toàn tập xác định",
    pts: 20,
    question: "Xét chiều biến thiên của hàm số $y = -x^3 + 2x^2 - 5x + 3$. Kết luận nào sau đây là chính xác?",
    options: [
      { text: "Hàm số nghịch biến trên toàn bộ $\\mathbb{R}$.", correct: true },
      { text: "Hàm số đồng biến trên toàn bộ $\\mathbb{R}$.", correct: false },
      { text: "Hàm số đồng biến trên $(-\\infty; 1)$ và nghịch biến trên $(1; +\\infty)$.", correct: false },
      { text: "Hàm số nghịch biến trên $(-\\infty; -1)$ và đồng biến trên $(-1; +\\infty)$.", correct: false }
    ],
    explanation: "Ta có $y' = -3x^2 + 4x - 5$. Biệt thức $\\Delta' = 2^2 - (-3)(-5) = 4 - 15 = -11 < 0$. Vì hệ số $a = -3 < 0$ và $\\Delta' < 0$ nên $y' < 0$ với mọi $x \\in \\mathbb{R}$. Do đó hàm số nghịch biến trên $\\mathbb{R}$."
  },
  {
    id: 4,
    title: "Câu 4 (SGK 1.3a): Đơn điệu của hàm phân thức bậc nhất",
    pts: 20,
    question: "Tìm các khoảng đơn điệu của hàm số $y = \\frac{2x - 1}{x + 2}$.",
    options: [
      { text: "Hàm số nghịch biến trên từng khoảng $(-\\infty; -2)$ và $(-2; +\\infty)$.", correct: false },
      { text: "Hàm số đồng biến trên $\\mathbb{R} \\setminus \\{-2\\}$.", correct: false },
      { text: "Hàm số đồng biến trên từng khoảng $(-\\infty; -2)$ và $(-2; +\\infty)$.", correct: true },
      { text: "Hàm số đồng biến trên toàn bộ khoảng $(-\\infty; +\\infty)$.", correct: false }
    ],
    explanation: "Tập xác định: $D = \\mathbb{R} \\setminus \\{-2\\}$. Ta có đạo hàm $y' = \\frac{2 \\cdot 2 - (-1) \\cdot 1}{(x + 2)^2} = \\frac{5}{(x + 2)^2} > 0, \\forall x \\ne -2$. Chú ý: Phải kết luận đồng biến trên từng khoảng riêng biệt $(-\\infty; -2)$ và $(-2; +\\infty)$, không dùng ký hiệu hợp hay trừ tập hợp."
  },
  {
    id: 5,
    title: "Câu 5 (SGK 1.7a): Tìm điểm cực trị của hàm số bậc ba",
    pts: 20,
    question: "Cho hàm số $y = 2x^3 - 9x^2 + 12x - 5$. Điểm cực đại và điểm cực tiểu của hàm số lần lượt là:",
    options: [
      { text: "Điểm cực đại $x = 1$ và điểm cực tiểu $x = 2$.", correct: true },
      { text: "Điểm cực đại $x = 2$ và điểm cực tiểu $x = 1$.", correct: false },
      { text: "Điểm cực đại $x = 0$ và điểm cực tiểu $x = -1$.", correct: false },
      { text: "Điểm cực đại $y = 0$ và điểm cực tiểu $y = -1$.", correct: false }
    ],
    explanation: "Ta có $y' = 6x^2 - 18x + 12 = 6(x - 1)(x - 2) = 0 \\Leftrightarrow x = 1$ hoặc $x = 2$. Bảng xét dấu: khi $x$ qua $1$, $y'$ đổi dấu từ $(+)$ sang $(-)$ nên $x = 1$ là điểm cực đại. Khi $x$ qua $2$, $y'$ đổi dấu từ $(-)$ sang $(+)$ nên $x = 2$ là điểm cực tiểu."
  },
  {
    id: 6,
    title: "Câu 6 (SGK 1.7b): Số điểm cực trị của hàm trùng phương",
    pts: 20,
    question: "Hàm số $y = x^4 - 4x^2 + 2$ có bao nhiêu điểm cực trị?",
    options: [
      { text: "1 điểm cực trị.", correct: false },
      { text: "2 điểm cực trị.", correct: false },
      { text: "3 điểm cực trị.", correct: true },
      { text: "Không có cực trị.", correct: false }
    ],
    explanation: "Ta có $y' = 4x^3 - 8x = 4x(x^2 - 2) = 0 \\Leftrightarrow x = 0$ hoặc $x = \\pm\\sqrt{2}$. Đạo hàm đổi dấu qua cả 3 nghiệm đơn này. Vì vậy hàm số có đúng 3 điểm cực trị (1 điểm cực đại $x = 0$ và 2 điểm cực tiểu $x = \\pm\\sqrt{2}$)."
  },
  {
    id: 7,
    title: "Câu 7 (SGK 1.6): Đọc đồ thị đạo hàm cấp một",
    pts: 20,
    question: "Cho đồ thị hàm số đạo hàm $y = f'(x)$ cắt trục hoành tại các điểm $x = 0, x = 2, x = 4, x = 6$. Biết rằng trên khoảng $(0; 2)$ thì $f'(x) < 0$, trên khoảng $(2; 4)$ thì $f'(x) > 0$. Hỏi hàm số $y = f(x)$ đạt cực tiểu tại điểm nào?",
    options: [
      { text: "$x = 0$.", correct: false },
      { text: "$x = 2$.", correct: true },
      { text: "$x = 4$.", correct: false },
      { text: "$x = 6$.", correct: false }
    ],
    explanation: "Khi $x$ đi qua $x = 2$ từ trái sang phải, giá trị $f'(x)$ đổi dấu từ âm ($< 0$) sang dương ($> 0$). Theo quy tắc điều kiện đủ về cực trị, hàm số $y = f(x)$ đạt cực tiểu tại $x = 2$."
  },
  {
    id: 8,
    title: "Câu 8 (SGK 1.7d): Giá trị cực đại của hàm căn thức",
    pts: 20,
    question: "Tìm giá trị cực đại ($y_{\\text{CĐ}}$) của hàm số $y = \\sqrt{4x - 2x^2}$.",
    options: [
      { text: "$y_{\\text{CĐ}} = 1$.", correct: false },
      { text: "$y_{\\text{CĐ}} = \\sqrt{2}$.", correct: true },
      { text: "$y_{\\text{CĐ}} = 2$.", correct: false },
      { text: "$y_{\\text{CĐ}} = 0$.", correct: false }
    ],
    explanation: "Điều kiện xác định: $4x - 2x^2 \\ge 0 \\Leftrightarrow 0 \\le x \\le 2$. Với $x \\in (0; 2)$, ta có $y' = \\frac{4 - 4x}{2\\sqrt{4x - 2x^2}} = \\frac{2(1 - x)}{\\sqrt{4x - 2x^2}} = 0 \\Leftrightarrow x = 1$. Qua $x = 1$, đạo hàm đổi dấu từ $(+)$ sang $(-)$ nên $x = 1$ là điểm cực đại. Giá trị cực đại là $y(1) = \\sqrt{4(1) - 2(1)^2} = \\sqrt{2}$."
  },
  {
    id: 9,
    title: "Câu 9 (SGK 1.8): Cực trị tại điểm không có đạo hàm",
    pts: 20,
    question: "Cho hàm số $y = f(x) = |x|$. Nhận xét nào sau đây về điểm $x = 0$ là đúng?",
    options: [
      { text: "Hàm số không có đạo hàm tại $x = 0$ nên $x = 0$ không phải là điểm cực trị.", correct: false },
      { text: "Hàm số có đạo hàm tại $x = 0$ và đạt cực tiểu tại $x = 0$.", correct: false },
      { text: "Hàm số không có đạo hàm tại $x = 0$ nhưng vẫn đạt cực tiểu tại $x = 0$.", correct: true },
      { text: "Hàm số đạt cực đại tại $x = 0$.", correct: false }
    ],
    explanation: "Hàm số $y = |x|$ liên tục tại $x = 0$. Với mọi $x \\ne 0$, ta luôn có $f(x) = |x| > 0 = f(0)$. Theo định nghĩa cực trị, $x = 0$ là điểm cực tiểu của hàm số, dù đạo hàm tại đây không tồn tại (đạo hàm bên trái bằng $-1$, bên phải bằng $1$)."
  },
  {
    id: 10,
    title: "Câu 10 (SGK 1.5): Ứng dụng thực tiễn mô hình tăng trưởng dân số",
    pts: 20,
    question: "Số dân của một thị trấn sau $t$ năm kể từ năm 2000 được mô tả bởi hàm số $N(t) = \\frac{25t + 10}{t + 5}$ ($t \\ge 0$, đơn vị: nghìn người). Đạo hàm $N'(t)$ và xu hướng dân số của thị trấn là:",
    options: [
      { text: "$N'(t) = \\frac{115}{(t + 5)^2} > 0$; số dân thị trấn luôn tăng theo thời gian.", correct: true },
      { text: "$N'(t) = -\\frac{115}{(t + 5)^2} < 0$; số dân thị trấn luôn giảm theo thời gian.", correct: false },
      { text: "$N'(t) = \\frac{135}{(t + 5)^2} > 0$; số dân thị trấn vượt ngưỡng 100 nghìn người.", correct: false },
      { text: "$N'(t) = \\frac{25}{(t + 5)^2} > 0$; số dân thị trấn tăng đến vô cùng.", correct: false }
    ],
    explanation: "Đạo hàm: $N'(t) = \\frac{25 \\cdot 5 - 10 \\cdot 1}{(t + 5)^2} = \\frac{115}{(t + 5)^2} > 0$ với mọi $t \\ge 0$. Vì $N'(t) > 0$ nên dân số thị trấn luôn tăng, đồng thời $\\lim\\limits_{t \\to +\\infty} N(t) = 25$ nên dân số tăng nhưng không vượt quá ngưỡng 25 nghìn người."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let totalAnswered = 0;
  let correctCount = 0;

  quizData.forEach((q, qIndex) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard-${q.id}`;

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `<span>${q.title}</span><span class="quiz-pts">+${q.pts} XP</span>`;
    card.appendChild(header);

    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = formatMathText(q.question);
    card.appendChild(questionP);

    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'quiz-options-grid';

    const isAnswered = appState.answered[q.id] !== undefined;
    if (isAnswered) totalAnswered++;

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-label">${String.fromCharCode(65 + optIndex)}</span><span>${formatMathText(opt.text)}</span>`;

      if (isAnswered) {
        btn.disabled = true;
        const chosen = appState.answered[q.id];
        if (optIndex === chosen) {
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
        if (chosen === optIndex && opt.correct) correctCount++;
      } else {
        btn.onclick = () => handleAnswer(q.id, optIndex);
      }
      optionsGrid.appendChild(btn);
    });
    card.appendChild(optionsGrid);

    const expBox = document.createElement('div');
    expBox.className = 'explanation-box' + (isAnswered ? ' show' : '');
    expBox.id = `expBox-${q.id}`;
    expBox.innerHTML = `<strong>💡 Lời giải chi tiết:</strong><br>${formatMathText(q.explanation)}`;
    card.appendChild(expBox);

    container.appendChild(card);
  });

  const progressEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progressEl) progressEl.textContent = `${totalAnswered}/${quizData.length}`;
  if (scoreEl) scoreEl.textContent = `${correctCount * 20} XP`;

  if (totalAnswered === quizData.length) {
    showArenaSummary(correctCount);
  }

  renderMathInTree(container);
}

function handleAnswer(questionId, chosenIndex) {
  if (appState.answered[questionId] !== undefined) return;
  const q = quizData.find(item => item.id === questionId);
  if (!q) return;

  appState.answered[questionId] = chosenIndex;
  const isCorrect = q.options[chosenIndex].correct;

  // Cập nhật giao diện thẻ câu hỏi ngay tại chỗ (không reload toàn trang)
  const card = document.getElementById(`quizCard-${questionId}`);
  if (card) {
    const buttons = card.querySelectorAll('.quiz-opt-btn');
    buttons.forEach((btn, optIndex) => {
      btn.disabled = true;
      if (optIndex === chosenIndex) {
        btn.classList.add(isCorrect ? 'correct' : 'wrong');
        const iconSpan = document.createElement('span');
        iconSpan.className = 'opt-status-icon';
        iconSpan.textContent = isCorrect ? ' ✓ Đúng' : ' ✕ Sai';
        iconSpan.style.marginLeft = 'auto';
        iconSpan.style.fontWeight = 'bold';
        btn.appendChild(iconSpan);
      } else if (q.options[optIndex].correct) {
        btn.classList.add('correct');
        const iconSpan = document.createElement('span');
        iconSpan.className = 'opt-status-icon';
        iconSpan.textContent = ' ✓ Đáp án đúng';
        iconSpan.style.marginLeft = 'auto';
        iconSpan.style.fontWeight = 'bold';
        btn.appendChild(iconSpan);
      }
    });

    const expBox = document.getElementById(`expBox-${questionId}`);
    if (expBox) {
      expBox.classList.add('show');
    }
  }

  if (isCorrect) {
    appState.streak++;
    if (appState.streak > appState.maxStreak) appState.maxStreak = appState.streak;
    sound.playCorrect();
    addXP(q.pts);
    if (appState.streak >= 5) unlockBadge('streak');
  } else {
    appState.streak = 0;
    sound.playWrong();
    updateHud();
    saveState();
  }

  const answeredCount = Object.keys(appState.answered).length;
  let correctTotal = 0;
  for (const [qid, ansIdx] of Object.entries(appState.answered)) {
    const question = quizData.find(item => item.id === parseInt(qid));
    if (question && question.options[ansIdx].correct) correctTotal++;
  }

  const progressEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progressEl) progressEl.textContent = `${answeredCount}/${quizData.length}`;
  if (scoreEl) scoreEl.textContent = `${correctTotal * 20} XP`;

  if (correctTotal >= 8) unlockBadge('arena');
  if (correctTotal === 10) unlockBadge('master');

  if (answeredCount === quizData.length) {
    showArenaSummary(correctTotal);
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
        lesson: 'toan12_bai1',
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

// --- 4. PHÒNG THÍ NGHIỆM ĐỘNG (LAB 1 & LAB 2) ---
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  const slider = document.getElementById('lab1SliderX');
  const valXEl = document.getElementById('lab1ValX');
  const valYEl = document.getElementById('lab1ValY');
  const valDerivEl = document.getElementById('lab1ValDeriv');
  const statusBadge = document.getElementById('lab1StatusBadge');
  const btnCrit1 = document.getElementById('btnPresetCrit1');
  const btnCrit2 = document.getElementById('btnPresetCrit2');

  if (!canvas || !slider) return;
  const ctx = canvas.getContext('2d');

  function f(x) {
    return (1 / 3) * Math.pow(x, 3) - Math.pow(x, 2) - 3 * x + 1;
  }
  function df(x) {
    return Math.pow(x, 2) - 2 * x - 3;
  }

  const originX = 260;
  const originY = 200;
  const scaleX = 45;
  const scaleY = 16;

  function toScreenX(x) { return originX + x * scaleX; }
  function toScreenY(y) { return originY - y * scaleY; }

  function draw() {
    const curX = parseFloat(slider.value);
    const curY = f(curX);
    const curDeriv = df(curX);

    if (valXEl) valXEl.textContent = `$${curX.toFixed(2)}$`;
    if (valYEl) valYEl.textContent = `$${curY.toFixed(2)}$`;
    if (valDerivEl) valDerivEl.textContent = `$${curDeriv.toFixed(2)}$`;

    if (statusBadge) {
      if (Math.abs(curDeriv) < 0.15) {
        statusBadge.style.background = 'rgba(245,158,11,0.2)';
        statusBadge.style.borderColor = '#f59e0b';
        statusBadge.style.color = '#fbbf24';
        statusBadge.textContent = '⚖️ Tiếp tuyến nằm ngang: Điểm tới hạn (f\'(x) ≈ 0)';
      } else if (curDeriv > 0) {
        statusBadge.style.background = 'rgba(16,185,129,0.2)';
        statusBadge.style.borderColor = '#10b981';
        statusBadge.style.color = '#34d399';
        statusBadge.textContent = '📈 Hàm số ĐỒNG BIẾN (f\'(x) > 0, tiếp tuyến dốc lên)';
      } else {
        statusBadge.style.background = 'rgba(244,63,94,0.2)';
        statusBadge.style.borderColor = '#f43f5e';
        statusBadge.style.color = '#fb7185';
        statusBadge.textContent = '📉 Hàm số NGHỊCH BIẾN (f\'(x) < 0, tiếp tuyến dốc xuống)';
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = -5; x <= 8; x++) {
      ctx.beginPath();
      ctx.moveTo(toScreenX(x), 0);
      ctx.lineTo(toScreenX(x), canvas.height);
      ctx.stroke();
    }
    for (let y = -12; y <= 12; y += 2) {
      ctx.beginPath();
      ctx.moveTo(0, toScreenY(y));
      ctx.lineTo(canvas.width, toScreenY(y));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(canvas.width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, canvas.height);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.fillText('x', canvas.width - 15, originY - 8);
    ctx.fillText('y', originX + 8, 15);
    ctx.fillText('O', originX - 14, originY + 14);

    // Plot f(x)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= canvas.width; px += 2) {
      const mathX = (px - originX) / scaleX;
      const mathY = f(mathX);
      const py = toScreenY(mathY);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Critical points dots
    const critPoints = [
      { x: -1, y: f(-1), label: 'Cực Đại (-1; 2.67)' },
      { x: 3, y: f(3), label: 'Cực Tiểu (3; -8.0)' }
    ];
    critPoints.forEach(pt => {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(toScreenX(pt.x), toScreenY(pt.y), 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fde68a';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.fillText(pt.label, toScreenX(pt.x) + 8, toScreenY(pt.y) - 6);
    });

    // Tangent Line
    const tangentLength = 2.0;
    const tanX1 = curX - tangentLength;
    const tanY1 = curY - curDeriv * tangentLength;
    const tanX2 = curX + tangentLength;
    const tanY2 = curY + curDeriv * tangentLength;

    ctx.strokeStyle = curDeriv >= 0 ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(toScreenX(tanX1), toScreenY(tanY1));
    ctx.lineTo(toScreenX(tanX2), toScreenY(tanY2));
    ctx.stroke();

    // Current point M
    ctx.fillStyle = '#fb923c';
    ctx.beginPath();
    ctx.arc(toScreenX(curX), toScreenY(curY), 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    unlockBadge('derivative');
  }

  slider.oninput = draw;
  if (btnCrit1) btnCrit1.onclick = () => { slider.value = -1; draw(); };
  if (btnCrit2) btnCrit2.onclick = () => { slider.value = 3; draw(); };
  draw();
}

function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  const slider = document.getElementById('lab2SliderX');
  const valXEl = document.getElementById('lab2ValX');
  const valDerivEl = document.getElementById('lab2ValDeriv');
  const statusBox = document.getElementById('lab2StatusBox');
  const btnMin1 = document.getElementById('btnLab2Min1');
  const btnMax = document.getElementById('btnLab2Max');
  const btnMin2 = document.getElementById('btnLab2Min2');

  if (!canvas || !slider) return;
  const ctx = canvas.getContext('2d');

  function g(x) { return Math.pow(x, 4) - 2 * Math.pow(x, 2); }
  function dg(x) { return 4 * Math.pow(x, 3) - 4 * x; }

  const originX = 300;
  const originY = 190;
  const scaleX = 90;
  const scaleY = 70;

  function toScreenX(x) { return originX + x * scaleX; }
  function toScreenY(y) { return originY - y * scaleY; }

  function draw() {
    const curX = parseFloat(slider.value);
    const curY = g(curX);
    const curDeriv = dg(curX);

    if (valXEl) valXEl.textContent = `$${curX.toFixed(2)}$`;
    if (valDerivEl) valDerivEl.textContent = `$${curDeriv.toFixed(2)}$`;

    if (statusBox) {
      if (Math.abs(curX - 0) < 0.08) {
        statusBox.style.background = 'rgba(245,158,11,0.2)';
        statusBox.style.borderColor = '#f59e0b';
        statusBox.textContent = '⭐ Điểm Cực Đại x = 0 (y = 0): Đạo hàm f\'(x) đổi dấu từ DƯƠNG sang ÂM!';
      } else if (Math.abs(curX - (-1)) < 0.08) {
        statusBox.style.background = 'rgba(16,185,129,0.2)';
        statusBox.style.borderColor = '#10b981';
        statusBox.textContent = '🔷 Điểm Cực Tiểu x = -1 (y = -1): Đạo hàm f\'(x) đổi dấu từ ÂM sang DƯƠNG!';
      } else if (Math.abs(curX - 1) < 0.08) {
        statusBox.style.background = 'rgba(16,185,129,0.2)';
        statusBox.style.borderColor = '#10b981';
        statusBox.textContent = '🔷 Điểm Cực Tiểu x = 1 (y = -1): Đạo hàm f\'(x) đổi dấu từ ÂM sang DƯƠNG!';
      } else if (curX < -1) {
        statusBox.textContent = 'Hàm số đang NGHỊCH BIẾN trên (-∞; -1), f\'(x) < 0.';
      } else if (curX < 0) {
        statusBox.textContent = 'Hàm số đang ĐỒNG BIẾN trên (-1; 0), f\'(x) > 0.';
      } else if (curX < 1) {
        statusBox.textContent = 'Hàm số đang NGHỊCH BIẾN trên (0; 1), f\'(x) < 0.';
      } else {
        statusBox.textContent = 'Hàm số đang ĐỒNG BIẾN trên (1; +∞), f\'(x) > 0.';
      }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, originY);
    ctx.lineTo(canvas.width, originY);
    ctx.moveTo(originX, 0);
    ctx.lineTo(originX, canvas.height);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.fillText('x', canvas.width - 15, originY - 8);
    ctx.fillText('y', originX + 8, 15);
    ctx.fillText('O', originX - 14, originY + 14);

    // Curve
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= canvas.width; px += 2) {
      const mathX = (px - originX) / scaleX;
      if (mathX < -2.2 || mathX > 2.2) continue;
      const mathY = g(mathX);
      const py = toScreenY(mathY);
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Key Extrema points
    const pts = [
      { x: -1, y: -1, color: '#38bdf8', label: 'CT(-1; -1)' },
      { x: 0, y: 0, color: '#f59e0b', label: 'CĐ(0; 0)' },
      { x: 1, y: -1, color: '#38bdf8', label: 'CT(1; -1)' }
    ];
    pts.forEach(p => {
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(toScreenX(p.x), toScreenY(p.y), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px Segoe UI, sans-serif';
      ctx.fillText(p.label, toScreenX(p.x) - 15, toScreenY(p.y) + (p.y >= 0 ? -10 : 18));
    });

    // Current explorer point
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(toScreenX(curX), toScreenY(curY), 6.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    unlockBadge('extrema');
  }

  slider.oninput = draw;
  if (btnMin1) btnMin1.onclick = () => { slider.value = -1; draw(); };
  if (btnMax) btnMax.onclick = () => { slider.value = 0; draw(); };
  if (btnMin2) btnMin2.onclick = () => { slider.value = 1; draw(); };
  draw();
}

// --- 5. KHỞI CHẠY HỆ THỐNG ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  renderQuiz();
  initLab1();
  initLab2();

  // Tabs Switcher
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sound.playTone(550, 'sine', 0.08, 0.08);
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      if (target) {
        target.classList.add('active');
        renderMathInTree(target);
      }
    });
  });

  // Sound Toggle
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.soundEnabled = !appState.soundEnabled;
      sound.enabled = appState.soundEnabled;
      soundBtn.textContent = appState.soundEnabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      saveState();
    });
  }

  // Reset Progress
  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập của Bài 1 không?')) {
        localStorage.removeItem(STATE_KEY);
        location.reload();
      }
    });
  }

  // Avatar Modal Handlers
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const avatarChoices = document.querySelectorAll('.avatar-choice');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      avatarModal.style.display = 'flex';
      avatarModal.classList.add('active');
    });
  }
  if (btnCloseModal && avatarModal) {
    btnCloseModal.addEventListener('click', () => {
      avatarModal.style.display = 'none';
      avatarModal.classList.remove('active');
      updateHud();
      saveState();
    });
  }
  avatarChoices.forEach(choice => {
    choice.addEventListener('click', () => {
      avatarChoices.forEach(c => c.classList.remove('selected'));
      choice.classList.add('selected');
      appState.avatar = choice.dataset.avatar;
      appState.userTitle = choice.dataset.title;
      sound.playTone(660, 'sine', 0.1, 0.1);
    });
  });

  // Date on Certificate
  const dateEl = document.getElementById('certDate');
  if (dateEl) {
    const today = new Date();
    dateEl.textContent = `Đà Nẵng, ngày ${today.getDate()} tháng ${today.getMonth() + 1} năm ${today.getFullYear()}`;
  }
});
