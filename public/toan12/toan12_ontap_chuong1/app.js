// ================================================================
// ÔN TẬP CHƯƠNG I: ỨNG DỤNG ĐẠO HÀM ĐỂ KHẢO SÁT VÀ VẼ ĐỒ THỊ - TOÁN 12 KNTT
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
const STATE_KEY = 'toan12_ontap_chuong1_state_v1';
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Giải Tích Chương I',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: {
    review_studio: false,
    lens_simulator: false,
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
  const allOtherUnlocked = appState.badges.review_studio && appState.badges.lens_simulator && appState.badges.streak && appState.badges.arena;
  if (allOtherUnlocked && !appState.badges.master) {
    appState.badges.master = true;
    sound.playFanfare();
    updateHud();
    saveState();
  }
}

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG SGK 10 CÂU (BÀI 1.30 ĐẾN 1.39 SGK KNTT TRANG 42-43) ---
const quizData = [
  {
    id: 1,
    title: "Câu 1 (SGK 1.30): Điều kiện đủ của tính đồng biến",
    pts: 20,
    question: "Cho hàm số $y = f(x)$ có đạo hàm trên khoảng $(a; b)$. Phát biểu nào sau đây là ĐÚNG?",
    options: [
      { text: "Nếu $f'(x) \\ge 0$ với mọi $x \\in (a; b)$ thì hàm số $y = f(x)$ đồng biến trên $(a; b)$.", correct: false },
      { text: "Nếu $f'(x) > 0$ với mọi $x \\in (a; b)$ thì hàm số $y = f(x)$ đồng biến trên $(a; b)$.", correct: true },
      { text: "Hàm số $y = f(x)$ đồng biến trên $(a; b)$ khi và chỉ khi $f'(x) \\ge 0$ với mọi $x \\in (a; b)$.", correct: false },
      { text: "Hàm số $y = f(x)$ đồng biến trên $(a; b)$ khi và chỉ khi $f'(x) > 0$ với mọi $x \\in (a; b)$.", correct: false }
    ],
    explanation: "Định lý SGK Toán 12 khẳng định: Nếu $f'(x) > 0$ với mọi $x \\in (a; b)$ thì hàm số đồng biến trên $(a; b)$. Phương án A sai vì nếu $f'(x) = 0$ trên cả khoảng thì hàm là hàm hằng; các phương án C, D sai vì không phải điều kiện tương đương khi chưa nói rõ đạo hàm triệt tiêu tại hữu hạn điểm."
  },
  {
    id: 2,
    title: "Câu 2 (SGK 1.31): Hàm số nghịch biến trên $\\mathbb{R}$",
    pts: 20,
    question: "Hàm số nào sau đây nghịch biến trên $\\mathbb{R}$?",
    options: [
      { text: "$y = -x^3 + 3x^2 - 9x$", correct: true },
      { text: "$y = -x^3 + x + 1$", correct: false },
      { text: "$y = \\frac{x - 1}{x - 2}$", correct: false },
      { text: "$y = 2x^2 + 3x + 2$", correct: false }
    ],
    explanation: "Xét $y = -x^3 + 3x^2 - 9x$: $y' = -3x^2 + 6x - 9 = -3(x^2 - 2x + 3) = -3[(x-1)^2 + 2] < 0$ với mọi $x \\in \\mathbb{R}$. Do đó hàm số này nghịch biến trên $\\mathbb{R}$. Hàm phân thức ở câu C không xác định tại $x = 2$ nên không thể nghịch biến trên $\\mathbb{R}$."
  },
  {
    id: 3,
    title: "Câu 3 (SGK 1.32): Hàm số không có cực trị",
    pts: 20,
    question: "Hàm số nào dưới đây KHÔNG có cực trị?",
    options: [
      { text: "$y = |x|$", correct: false },
      { text: "$y = x^4$", correct: false },
      { text: "$y = -x^3 + x$", correct: false },
      { text: "$y = \\frac{2x - 1}{x + 1}$", correct: true }
    ],
    explanation: "Hàm phân thức bậc nhất trên bậc nhất $y = \\frac{2x - 1}{x + 1}$ có đạo hàm $y' = \\frac{3}{(x + 1)^2} > 0$ với mọi $x \\ne -1$. Đạo hàm không đổi dấu và không bao giờ triệt tiêu, do đó hàm số không có bất kỳ điểm cực trị nào."
  },
  {
    id: 4,
    title: "Câu 4 (SGK 1.33): Giá trị cực tiểu của hàm số $y = x^2 \\ln x$",
    pts: 20,
    question: "Giá trị cực tiểu của hàm số $y = x^2 \\ln x$ là:",
    options: [
      { text: "$-\\frac{1}{e}$", correct: false },
      { text: "$-\\frac{1}{e^2}$", correct: false },
      { text: "$-\\frac{1}{2e}$", correct: true },
      { text: "$\\frac{1}{2e}$", correct: false }
    ],
    explanation: "Tập xác định $x > 0$. Đạo hàm: $y' = 2x \\ln x + x^2 \\cdot \\frac{1}{x} = x(2\\ln x + 1)$. Cho $y' = 0 \\Leftrightarrow 2\\ln x + 1 = 0 \\Leftrightarrow \\ln x = -\\frac{1}{2} \\Leftrightarrow x = e^{-1/2} = \\frac{1}{\\sqrt{e}}$. Qua điểm này, đạo hàm đổi dấu từ âm sang dương nên hàm số đạt cực tiểu. Giá trị cực tiểu là: $y(e^{-1/2}) = (e^{-1/2})^2 \\ln(e^{-1/2}) = e^{-1} \\left(-\\frac{1}{2}\\right) = -\\frac{1}{2e}$."
  },
  {
    id: 5,
    title: "Câu 5 (SGK 1.34): Giá trị lớn nhất của $y = (x - 2)^2 e^x$ trên $[1; 3]$",
    pts: 20,
    question: "Giá trị lớn nhất của hàm số $y = (x - 2)^2 e^x$ trên đoạn $[1; 3]$ là:",
    options: [
      { text: "$0$", correct: false },
      { text: "$e^3$", correct: true },
      { text: "$e^4$", correct: false },
      { text: "$e$", correct: false }
    ],
    explanation: "Đạo hàm: $y' = 2(x - 2)e^x + (x - 2)^2 e^x = (x - 2)e^x [2 + x - 2] = x(x - 2)e^x$. Trong đoạn $[1; 3]$, phương trình $y' = 0$ có nghiệm $x = 2$. Tính các giá trị: $y(1) = (1 - 2)^2 e^1 = e$, $y(2) = 0$, $y(3) = (3 - 2)^2 e^3 = e^3$. So sánh: $0 < e < e^3$, do đó giá trị lớn nhất là $e^3$ tại $x = 3$."
  },
  {
    id: 6,
    title: "Câu 6 (SGK 1.35): Xác định tiệm cận từ giới hạn",
    pts: 20,
    question: "Cho hàm số $y = f(x)$ thỏa mãn: $\\lim\\limits_{x \\to 2^+} f(x) = 1; \\lim\\limits_{x \\to 2^-} f(x) = 1; \\lim\\limits_{x \\to -\\infty} f(x) = 2$ và $\\lim\\limits_{x \\to +\\infty} f(x) = 2$. Khẳng định nào sau đây là ĐÚNG?",
    options: [
      { text: "Đường thẳng $x = 2$ là tiệm cận đứng của đồ thị hàm số.", correct: false },
      { text: "Đường thẳng $y = 2$ là tiệm cận ngang của đồ thị hàm số.", correct: true },
      { text: "Đường thẳng $y = 1$ là tiệm cận ngang của đồ thị hàm số.", correct: false },
      { text: "Đường thẳng $x = 2$ là tiệm cận ngang của đồ thị hàm số.", correct: false }
    ],
    explanation: "Vì $\\lim\\limits_{x \\to \\pm\\infty} f(x) = 2$ nên đường thẳng $y = 2$ là đường tiệm cận ngang của đồ thị hàm số. Tại $x = 2$, giới hạn hai bên bằng $1$ (hữu hạn, không phải vô cực) nên $x = 2$ không phải là tiệm cận đứng."
  },
  {
    id: 7,
    title: "Câu 7 (SGK 1.36): Tiệm cận xiên của phân thức",
    pts: 20,
    question: "Tiệm cận xiên của đồ thị hàm số $y = \\frac{x^2 + 2x - 2}{x + 2}$ là:",
    options: [
      { text: "$y = -2$", correct: false },
      { text: "$y = 1$", correct: false },
      { text: "$y = x + 2$", correct: false },
      { text: "$y = x$", correct: true }
    ],
    explanation: "Chia tử số cho mẫu số: $x^2 + 2x - 2 = x(x + 2) - 2 \\Rightarrow y = x - \\frac{2}{x + 2}$. Vì $\\lim\\limits_{x \\to \\pm\\infty} [y - x] = \\lim\\limits_{x \\to \\pm\\infty} \\left(-\\frac{2}{x + 2}\\right) = 0$, nên đường thẳng $y = x$ chính là đường tiệm cận xiên."
  },
  {
    id: 8,
    title: "Câu 8 (SGK 1.37): Đọc bảng biến thiên phát hiện khẳng định SAI",
    pts: 20,
    question: "Cho hàm số $y = f(x)$ xác định trên $\\mathbb{R} \\setminus \\{1; 3\\}$, có bảng biến thiên: Tại $-\\infty$ có $y=1$; khi $x \\to 1^-$ thì $y \\to -1$; khi $x \\to 1^+$ thì $y \\to 7$; khi $x \\to 3^-$ thì $y \\to +\\infty$; khi $x \\to 3^+$ thì $y \\to -4$; tại $+\\infty$ có $y=-1$. Khẳng định nào sau đây là SAI?",
    options: [
      { text: "Đường thẳng $y = 1$ là tiệm cận ngang của đồ thị hàm số đã cho.", correct: false },
      { text: "Đường thẳng $y = -1$ là tiệm cận ngang của đồ thị hàm số đã cho.", correct: false },
      { text: "Đường thẳng $x = 3$ là tiệm cận đứng của đồ thị hàm số đã cho.", correct: false },
      { text: "Đường thẳng $x = 1$ là tiệm cận đứng của đồ thị hàm số đã cho.", correct: true }
    ],
    explanation: "Khẳng định D là SAI. Tại điểm $x = 1$, giới hạn bên trái là $\\lim\\limits_{x \\to 1^-} f(x) = -1$ và giới hạn bên phải là $\\lim\\limits_{x \\to 1^+} f(x) = 7$. Cả hai giới hạn này đều là số hữu hạn, không có giới hạn nào bằng $\\pm\\infty$. Do đó $x = 1$ KHÔNG PHẢI là tiệm cận đứng."
  },
  {
    id: 9,
    title: "Câu 9 (SGK 1.38): Nhận dạng đồ thị phân thức Hình 1.37",
    pts: 20,
    question: "Đồ thị trong Hình 1.37 có tiệm cận đứng $x = -1$, tiệm cận ngang $y = 2$ và cắt trục tung tại điểm $(0; 1)$. Đây là đồ thị của hàm số nào?",
    options: [
      { text: "$y = \\frac{x + 2}{x + 1}$", correct: false },
      { text: "$y = \\frac{2x + 1}{x + 1}$", correct: true },
      { text: "$y = \\frac{x - 1}{x + 1}$", correct: false },
      { text: "$y = \\frac{x + 3}{1 - x}$", correct: false }
    ],
    explanation: "Xét hàm $y = \\frac{2x + 1}{x + 1}$: Tiệm cận đứng là nghiệm mẫu $x = -1$. Tiệm cận ngang là tỉ số hệ số $y = \\frac{2}{1} = 2$. Giao điểm với trục tung $Oy$ tại $x = 0 \\Rightarrow y = 1$ (điểm $(0; 1)$). Cắt trục hoành tại $x = -0.5$. Tất cả các đặc điểm đều trùng khớp 100% với Hình 1.37 SGK."
  },
  {
    id: 10,
    title: "Câu 10 (SGK 1.39): Nhận dạng đồ thị phân thức Hình 1.38",
    pts: 20,
    question: "Đồ thị trong Hình 1.38 có tiệm cận đứng $x = -1$, tiệm cận xiên $y = x$, cắt trục tung tại $(0; 1)$ và trục hoành tại $(-1; 0)$. Đây là đồ thị của hàm số nào?",
    options: [
      { text: "$y = x - \\frac{1}{x + 1}$", correct: false },
      { text: "$y = \\frac{2x + 1}{x + 1}$", correct: false },
      { text: "$y = \\frac{x^2 - x + 1}{x + 1}$", correct: false },
      { text: "$y = \\frac{x^2 + x + 1}{x + 1}$", correct: true }
    ],
    explanation: "Biến đổi hàm số câu D: $y = \\frac{x(x + 1) + 1}{x + 1} = x + \\frac{1}{x + 1}$. Khi đó: Tiệm cận đứng là $x = -1$. Tiệm cận xiên là $y = x$. Khi $x = 0 \\Rightarrow y = 1$ (đi qua $(0; 1)$). Vì vậy câu D là đáp án chính xác của Hình 1.38 SGK."
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
        lesson: 'toan12_ontap_chuong1',
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

// --- 5. LOGIC PHÒNG THÍ NGHIỆM LAB 1 (MÁY THẨM TRA ĐỒ THỊ TOÀN NĂNG) ---
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let funcType = 'cubic'; // 'cubic', 'rat1', 'rat2'
  const btnCubic = document.getElementById('btnCubic');
  const btnRat1 = document.getElementById('btnRat1');
  const btnRat2 = document.getElementById('btnRat2');

  const sliderX = document.getElementById('lab1SliderX');
  const valX = document.getElementById('lab1ValX');
  const dispX = document.getElementById('lab1DispX');
  const dispY = document.getElementById('lab1DispY');
  const valSlope = document.getElementById('lab1ValSlope');
  const statusBox = document.getElementById('lab1StatusBox');

  function evalFunc(x) {
    if (funcType === 'cubic') {
      // y = x^3 - 3x + 1
      return { y: Math.pow(x, 3) - 3 * x + 1, dy: 3 * x * x - 3 };
    } else if (funcType === 'rat1') {
      // y = (2x+1)/(x+1)
      if (Math.abs(x + 1) < 0.02) return null;
      return { y: (2 * x + 1) / (x + 1), dy: 1 / Math.pow(x + 1, 2) };
    } else {
      // y = x + 1/(x-1)
      if (Math.abs(x - 1) < 0.02) return null;
      return { y: x + 1 / (x - 1), dy: 1 - 1 / Math.pow(x - 1, 2) };
    }
  }

  function draw() {
    let x = parseFloat(sliderX.value);
    const res = evalFunc(x);

    if (valX) valX.textContent = `$${x.toFixed(2)}$`;
    if (dispX) dispX.textContent = `$${x.toFixed(2)}$`;
    if (dispY) dispY.textContent = res ? `$${res.y.toFixed(2)}$` : '$\\infty$';
    if (valSlope) valSlope.textContent = res ? `$${res.dy.toFixed(2)}$` : '$\\infty$';

    if (statusBox) {
      if (funcType === 'cubic') {
        statusBox.innerHTML = `Đồ thị bậc ba $y = x^3 - 3x + 1$. Tâm đối xứng là điểm uốn $I(0; 1)$, cực đại $(-1; 3)$, cực tiểu $(1; -1)$.`;
      } else if (funcType === 'rat1') {
        statusBox.innerHTML = `Đồ thị phân thức $y = \\frac{2x+1}{x+1}$. Tiệm cận đứng $x = -1$, ngang $y = 2$, tâm đối xứng $I(-1; 2)$.`;
      } else {
        statusBox.innerHTML = `Đồ thị phân thức $y = x + \\frac{1}{x-1}$. Tiệm cận đứng $x = 1$, xiên $y = x$, tâm đối xứng $I(1; 1)$.`;
      }
      renderMathInTree(statusBox);
    }

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Coord mapping
    const xMin = -3.5, xMax = 3.5, yMin = -5, yMax = 7;
    function toCanvasX(cx) { return (cx - xMin) / (xMax - xMin) * (W - 80) + 40; }
    function toCanvasY(cy) { return H - 40 - (cy - yMin) / (yMax - yMin) * (H - 80); }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(0)); ctx.lineTo(W, toCanvasY(0));
    ctx.moveTo(toCanvasX(0), 0); ctx.lineTo(toCanvasX(0), H);
    ctx.stroke();

    if (funcType === 'cubic') {
      // Curve
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (let px = 0; px <= W; px += 2) {
        const rx = xMin + (px - 40) / (W - 80) * (xMax - xMin);
        const ry = Math.pow(rx, 3) - 3 * rx + 1;
        const cy = toCanvasY(ry);
        if (px === 0) ctx.moveTo(px, cy);
        else ctx.lineTo(px, cy);
      }
      ctx.stroke();

      // Inflection point I(0; 1)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(toCanvasX(0), toCanvasY(1), 6, 0, Math.PI * 2);
      ctx.fill();
    } else if (funcType === 'rat1') {
      // Tiệm cận đứng x = -1
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(toCanvasX(-1), 0); ctx.lineTo(toCanvasX(-1), H);
      ctx.stroke();

      // Tiệm cận ngang y = 2
      ctx.strokeStyle = '#06b6d4';
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(2)); ctx.lineTo(W, toCanvasY(2));
      ctx.stroke();
      ctx.setLineDash([]);

      // Curve
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2.5;
      // Branch 1
      ctx.beginPath();
      let st = false;
      for (let rx = xMin; rx <= -1.08; rx += 0.05) {
        const ry = (2 * rx + 1) / (rx + 1);
        const px = toCanvasX(rx), py = toCanvasY(ry);
        if (py >= -100 && py <= H + 100) {
          if (!st) { ctx.moveTo(px, py); st = true; } else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      // Branch 2
      ctx.beginPath();
      st = false;
      for (let rx = -0.92; rx <= xMax; rx += 0.05) {
        const ry = (2 * rx + 1) / (rx + 1);
        const px = toCanvasX(rx), py = toCanvasY(ry);
        if (py >= -100 && py <= H + 100) {
          if (!st) { ctx.moveTo(px, py); st = true; } else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Center I(-1; 2)
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(toCanvasX(-1), toCanvasY(2), 6, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Tiệm cận đứng x = 1
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(toCanvasX(1), 0); ctx.lineTo(toCanvasX(1), H);
      ctx.stroke();

      // Tiệm cận xiên y = x
      ctx.strokeStyle = '#f59e0b';
      ctx.beginPath();
      ctx.moveTo(toCanvasX(xMin), toCanvasY(xMin)); ctx.lineTo(toCanvasX(xMax), toCanvasY(xMax));
      ctx.stroke();
      ctx.setLineDash([]);

      // Curve
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2.5;
      // Branch 1
      ctx.beginPath();
      let st = false;
      for (let rx = xMin; rx <= 0.88; rx += 0.05) {
        const ry = rx + 1 / (rx - 1);
        const px = toCanvasX(rx), py = toCanvasY(ry);
        if (py >= -100 && py <= H + 100) {
          if (!st) { ctx.moveTo(px, py); st = true; } else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
      // Branch 2
      ctx.beginPath();
      st = false;
      for (let rx = 1.12; rx <= xMax; rx += 0.05) {
        const ry = rx + 1 / (rx - 1);
        const px = toCanvasX(rx), py = toCanvasY(ry);
        if (py >= -100 && py <= H + 100) {
          if (!st) { ctx.moveTo(px, py); st = true; } else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Center I(1; 1)
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(toCanvasX(1), toCanvasY(1), 6, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tangent line at current x
    if (res) {
      const mx = toCanvasX(x);
      const my = toCanvasY(res.y);

      const tLen = 1.0;
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x - tLen), toCanvasY(res.y - res.dy * tLen));
      ctx.lineTo(toCanvasX(x + tLen), toCanvasY(res.y + res.dy * tLen));
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f43f5e';
      ctx.shadowColor = '#f43f5e';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(mx, my, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }

    unlockBadge('review_studio');
  }

  btnCubic.onclick = () => {
    sound.playClick();
    funcType = 'cubic';
    btnCubic.style.background = 'rgba(99,102,241,0.3)';
    btnCubic.style.borderColor = '#818cf8';
    btnRat1.style.background = ''; btnRat1.style.borderColor = '';
    btnRat2.style.background = ''; btnRat2.style.borderColor = '';
    draw();
  };

  btnRat1.onclick = () => {
    sound.playClick();
    funcType = 'rat1';
    btnRat1.style.background = 'rgba(99,102,241,0.3)';
    btnRat1.style.borderColor = '#818cf8';
    btnCubic.style.background = ''; btnCubic.style.borderColor = '';
    btnRat2.style.background = ''; btnRat2.style.borderColor = '';
    draw();
  };

  btnRat2.onclick = () => {
    sound.playClick();
    funcType = 'rat2';
    btnRat2.style.background = 'rgba(99,102,241,0.3)';
    btnRat2.style.borderColor = '#818cf8';
    btnCubic.style.background = ''; btnCubic.style.borderColor = '';
    btnRat1.style.background = ''; btnRat1.style.borderColor = '';
    draw();
  };

  sliderX.oninput = () => { sound.playClick(); draw(); };

  draw();
}

// --- 6. LOGIC PHÒNG THÍ NGHIỆM LAB 2 (THẤU KÍNH HỘI TỤ & TIỆM CẬN) ---
function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderP = document.getElementById('lab2SliderP');
  const valP = document.getElementById('lab2ValP');
  const valQ = document.getElementById('lab2ValQ');
  const valMag = document.getElementById('lab2ValMag');
  const statusBox = document.getElementById('lab2StatusBox');

  // f = 10 cm, 1/p + 1/q = 1/f => q(p) = (10*p) / (p - 10)
  function getQ(p) {
    if (p <= 10) return 9999;
    return (10 * p) / (p - 10);
  }

  function draw() {
    const p = parseFloat(sliderP.value);
    const q = getQ(p);
    const k = -(q / p);

    if (valP) valP.textContent = `$${p.toFixed(1)}\\text{ cm}$`;
    if (valQ) valQ.textContent = `$${q.toFixed(2)}\\text{ cm}$`;
    if (valMag) valMag.textContent = `$${k.toFixed(2)}$`;

    if (statusBox) {
      if (Math.abs(p - 20.0) < 0.6) {
        statusBox.innerHTML = `⭐ <strong>ĐỐI XỨNG $2f$:</strong> Khi vật ở khoảng cách $p = 20\\text{ cm} = 2f$, ảnh thực hiện ra ở đúng $q = 20\\text{ cm}$ với độ phóng đại $|k| = 1.0$ (kích thước ảnh bằng đúng vật)!`;
      } else if (p < 13.0) {
        statusBox.innerHTML = `⚠️ <strong>TIỆM CẬN ĐỨNG $p = 10$:</strong> Khi dịch vật sát về tiêu cự $f = 10\\text{ cm}$, khoảng cách ảnh $q = ${q.toFixed(1)}\\text{ cm}$ phóng ra xa vô cực!`;
      } else {
        statusBox.innerHTML = `Khi $p$ càng ra xa, khoảng cách ảnh $q$ ép sát về tiệm cận ngang $q = f = 10\\text{ cm}$!`;
      }
      renderMathInTree(statusBox);
    }

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Optical Axis layout
    const axisY = 170;
    const lensX = 260; // position of the thin lens
    const f = 10;
    const pxScale = 6; // 6 pixels per cm

    // Optical Axis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, axisY);
    ctx.lineTo(W, axisY);
    ctx.stroke();

    // Convex Lens (Thấu kính hội tụ)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(lensX, axisY - 110);
    ctx.lineTo(lensX, axisY + 110);
    ctx.stroke();

    // Lens arrows
    ctx.fillStyle = '#06b6d4';
    function drawArrowHead(ax, ay, angle) {
      ctx.save();
      ctx.translate(ax, ay);
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.moveTo(-6, -6); ctx.lineTo(0, 0); ctx.lineTo(6, -6);
      ctx.stroke();
      ctx.restore();
    }
    drawArrowHead(lensX, axisY - 110, 0);
    drawArrowHead(lensX, axisY + 110, Math.PI);

    // Focal points F and F'
    const fx = lensX - f * pxScale;
    const fPrimeX = lensX + f * pxScale;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(fx, axisY, 4, 0, Math.PI * 2);
    ctx.arc(fPrimeX, axisY, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('F (10)', fx - 12, axisY + 16);
    ctx.fillText("F' (10)", fPrimeX - 10, axisY + 16);
    ctx.fillText('O', lensX - 14, axisY + 16);

    // Object M (arrow pointing up)
    const objH = 45;
    const objX = lensX - p * pxScale;
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(objX, axisY);
    ctx.lineTo(objX, axisY - objH);
    ctx.stroke();
    drawArrowHead(objX, axisY - objH, 0);

    ctx.fillStyle = '#10b981';
    ctx.fillText(`Vật (p=${p.toFixed(0)})`, objX - 25, axisY - objH - 8);

    // Image M' (arrow pointing down)
    const imgH = objH * Math.abs(k);
    const imgX = lensX + Math.min(q, 45) * pxScale;
    if (q < 50) {
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(imgX, axisY);
      ctx.lineTo(imgX, axisY + imgH);
      ctx.stroke();
      drawArrowHead(imgX, axisY + imgH, Math.PI);

      ctx.fillStyle = '#f43f5e';
      ctx.fillText(`Ảnh M' (q=${q.toFixed(1)})`, imgX - 20, axisY + imgH + 16);

      // Light ray 1: parallel to axis, refracts through F'
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(objX, axisY - objH);
      ctx.lineTo(lensX, axisY - objH);
      ctx.lineTo(imgX, axisY + imgH);
      ctx.stroke();

      // Light ray 2: through optical center O undeflected
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.beginPath();
      ctx.moveTo(objX, axisY - objH);
      ctx.lineTo(lensX, axisY);
      ctx.lineTo(imgX, axisY + imgH);
      ctx.stroke();
    }

    unlockBadge('lens_simulator');
  }

  sliderP.oninput = () => { sound.playClick(); draw(); };

  const btnNear = document.getElementById('btnLab2NearF');
  if (btnNear) btnNear.onclick = () => { sliderP.value = '12.0'; sound.playClick(); draw(); };

  const btnEq = document.getElementById('btnLab2Equal2F');
  if (btnEq) btnEq.onclick = () => { sliderP.value = '20.0'; sound.playClick(); draw(); };

  const btnFar = document.getElementById('btnLab2Far');
  if (btnFar) btnFar.onclick = () => { sliderP.value = '35.0'; sound.playClick(); draw(); };

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
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập của Ôn Tập Chương I không?')) {
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
