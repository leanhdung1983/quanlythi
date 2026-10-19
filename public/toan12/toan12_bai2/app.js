// ================================================================
// BÀI 2: GIÁ TRỊ LỚN NHẤT VÀ GIÁ TRỊ NHỎ NHẤT CỦA HÀM SỐ - TOÁN 12 KNTT
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

// --- 2. TRẠNG THÁI ỨNG DỤNG (STATE MANAGEMENT) ---
const STATE_KEY = 'toan12_bai2_state_v1';
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Tối Ưu Hóa 12',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: {
    interval: false,
    optimizer: false,
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
  const allOtherUnlocked = appState.badges.interval && appState.badges.optimizer && appState.badges.streak && appState.badges.arena;
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
    title: "Câu 1: Định nghĩa chuẩn xác về Giá Trị Lớn Nhất",
    pts: 20,
    question: "Cho hàm số $y = f(x)$ xác định trên tập hợp $D$. Số $M$ được gọi là giá trị lớn nhất của $f(x)$ trên $D$ nếu thỏa mãn điều kiện nào sau đây?",
    options: [
      { text: "$f(x) \\le M$ với mọi $x \\in D$.", correct: false },
      { text: "$f(x) \\ge M$ với mọi $x \\in D$ và tồn tại $x_0 \\in D$ sao cho $f(x_0) = M$.", correct: false },
      { text: "$f(x) \\le M$ với mọi $x \\in D$ và tồn tại $x_0 \\in D$ sao cho $f(x_0) = M$.", correct: true },
      { text: "Tồn tại $x_0 \\in D$ sao cho $f(x_0) = M$ và $f'(x_0) = 0$.", correct: false }
    ],
    explanation: "Theo định nghĩa SGK Toán 12: Số $M$ là GTLN của $f(x)$ trên $D$ khi và chỉ khi $f(x) \\le M, \\forall x \\in D$ và phải có ít nhất một điểm $x_0 \\in D$ để hàm số chạm tới giá trị $M$ ($f(x_0) = M$)."
  },
  {
    id: 2,
    title: "Câu 2 (SGK 1.10a): GTLN của hàm số bậc hai trên $\\mathbb{R}$",
    pts: 20,
    question: "Tìm giá trị lớn nhất của hàm số $y = -x^2 + 4x + 3$ trên $\\mathbb{R}$.",
    options: [
      { text: "$\\max\\limits_{\\mathbb{R}} y = 3$", correct: false },
      { text: "$\\max\\limits_{\\mathbb{R}} y = 7$", correct: true },
      { text: "$\\max\\limits_{\\mathbb{R}} y = 2$", correct: false },
      { text: "Hàm số không có giá trị lớn nhất trên $\\mathbb{R}$.", correct: false }
    ],
    explanation: "Ta có $y' = -2x + 4 = 0 \\Leftrightarrow x = 2$. Vì $a = -1 < 0$ nên đồ thị là parabol có bề lõm quay xuống dưới, đỉnh tại $x = 2$. Giá trị lớn nhất là $y(2) = -(2)^2 + 4(2) + 3 = 7$."
  },
  {
    id: 3,
    title: "Câu 3 (SGK 1.12a): Tìm $\\max, \\min$ trên đoạn $[-1; 2]$",
    pts: 20,
    question: "Giá trị lớn nhất $M$ và giá trị nhỏ nhất $m$ của hàm số $y = 2x^3 - 6x + 3$ trên đoạn $[-1; 2]$ lần lượt là:",
    options: [
      { text: "$M = 7$ và $m = -1$", correct: true },
      { text: "$M = 7$ và $m = 3$", correct: false },
      { text: "$M = 3$ và $m = -1$", correct: false },
      { text: "$M = 11$ và $m = -1$", correct: false }
    ],
    explanation: "Đạo hàm $y' = 6x^2 - 6 = 0 \\Leftrightarrow x = \\pm 1$. Các điểm thuộc $[-1; 2]$ là $x = -1, x = 1, x = 2$. Tính các giá trị: $y(-1) = 7$, $y(1) = -1$, $y(2) = 2(8) - 12 + 3 = 7$. Do đó $M = \\max \\{7; -1; 7\\} = 7$ và $m = \\min \\{7; -1; 7\\} = -1$."
  },
  {
    id: 4,
    title: "Câu 4: GTNN của tổng đại số trên khoảng $(0; +\\infty)$",
    pts: 20,
    question: "Tìm giá trị nhỏ nhất của hàm số $y = x + \\frac{4}{x}$ trên khoảng $(0; +\\infty)$.",
    options: [
      { text: "$\\min\\limits_{(0; +\\infty)} y = 2$", correct: false },
      { text: "$\\min\\limits_{(0; +\\infty)} y = 4$", correct: true },
      { text: "$\\min\\limits_{(0; +\\infty)} y = 5$", correct: false },
      { text: "Không tồn tại GTNN vì khoảng mở.", correct: false }
    ],
    explanation: "Với $x > 0$, áp dụng bất đẳng thức Cô-si (AM-GM): $y = x + \\frac{4}{x} \\ge 2\\sqrt{x \\cdot \\frac{4}{x}} = 4$. Dấu bằng xảy ra khi $x = \\frac{4}{x} \\Leftrightarrow x = 2 \\in (0; +\\infty)$. Hoặc dùng đạo hàm $y' = 1 - \\frac{4}{x^2} = 0 \\Leftrightarrow x = 2$ cho $y(2) = 4$."
  },
  {
    id: 5,
    title: "Câu 5 (SGK Ví dụ 4): GTLN của hàm trùng phương trên $[0; 4]$",
    pts: 20,
    question: "Tìm giá trị lớn nhất của hàm số $y = x^4 - 4x^2 + 3$ trên đoạn $[0; 4]$.",
    options: [
      { text: "$\\max\\limits_{[0; 4]} y = 3$", correct: false },
      { text: "$\\max\\limits_{[0; 4]} y = -1$", correct: false },
      { text: "$\\max\\limits_{[0; 4]} y = 195$", correct: true },
      { text: "$\\max\\limits_{[0; 4]} y = 4$", correct: false }
    ],
    explanation: "Đạo hàm $y' = 4x^3 - 8x = 4x(x^2 - 2) = 0 \\Leftrightarrow x = 0$ hoặc $x = \\sqrt{2}$ (vì $x \\in [0; 4]$). Tính các giá trị: $y(0) = 3$, $y(\\sqrt{2}) = (\\sqrt{2})^4 - 4(\\sqrt{2})^2 + 3 = 4 - 8 + 3 = -1$, $y(4) = 4^4 - 4(4^2) + 3 = 256 - 64 + 3 = 195$. Vậy GTLN là $195$."
  },
  {
    id: 6,
    title: "Câu 6 (SGK 1.10c): GTNN của phân thức trên khoảng $(1; +\\infty)$",
    pts: 20,
    question: "Giá trị nhỏ nhất của hàm số $y = \\frac{x^2 - 2x + 3}{x - 1}$ trên khoảng $(1; +\\infty)$ là:",
    options: [
      { text: "$\\min\\limits_{(1; +\\infty)} y = 2\\sqrt{2}$", correct: true },
      { text: "$\\min\\limits_{(1; +\\infty)} y = 2$", correct: false },
      { text: "$\\min\\limits_{(1; +\\infty)} y = 3$", correct: false },
      { text: "$\\min\\limits_{(1; +\\infty)} y = 1 + \\sqrt{2}$", correct: false }
    ],
    explanation: "Ta biến đổi: $y = \\frac{(x - 1)^2 + 2}{x - 1} = (x - 1) + \\frac{2}{x - 1}$. Vì $x > 1 \\Rightarrow x - 1 > 0$. Áp dụng BĐT Cô-si: $y \\ge 2\\sqrt{(x - 1) \\cdot \\frac{2}{x - 1}} = 2\\sqrt{2}$. Dấu bằng đạt khi $x - 1 = \\sqrt{2} \\Leftrightarrow x = 1 + \\sqrt{2} \\in (1; +\\infty)$."
  },
  {
    id: 7,
    title: "Câu 7 (SGK 1.13): Bài toán tối ưu chu vi hình chữ nhật",
    pts: 20,
    question: "Trong tất cả các hình chữ nhật có chu vi bằng $24\\text{ cm}$, hình chữ nhật có diện tích lớn nhất bằng bao nhiêu?",
    options: [
      { text: "$24\\text{ cm}^2$", correct: false },
      { text: "$32\\text{ cm}^2$", correct: false },
      { text: "$36\\text{ cm}^2$", correct: true },
      { text: "$48\\text{ cm}^2$", correct: false }
    ],
    explanation: "Nửa chu vi là $x + y = 12 \\Rightarrow y = 12 - x$ với $0 < x < 12$. Diện tích $S(x) = x(12 - x) = 12x - x^2$. Đạo hàm $S'(x) = 12 - 2x = 0 \\Leftrightarrow x = 6\\text{ cm} \\Rightarrow y = 6\\text{ cm}$ (hình vuông). Diện tích cực đại $S_{\\max} = 6 \\times 6 = 36\\text{ cm}^2$."
  },
  {
    id: 8,
    title: "Câu 8 (SGK 1.14): Thiết kế chiếc hộp hở đáy vuông thể tích cực đại",
    pts: 20,
    question: "Một chiếc hộp không nắp có đáy hình vuông cạnh $x$ và diện tích toàn phần là $108\\text{ cm}^2$. Kích thước cạnh đáy $x$ để thể tích hộp lớn nhất là:",
    options: [
      { text: "$x = 3\\text{ cm}$", correct: false },
      { text: "$x = 4\\text{ cm}$", correct: false },
      { text: "$x = 6\\text{ cm}$", correct: true },
      { text: "$x = 8\\text{ cm}$", correct: false }
    ],
    explanation: "Diện tích không nắp: $S = x^2 + 4xh = 108 \\Rightarrow h = \\frac{108 - x^2}{4x}$. Thể tích $V(x) = x^2 h = \\frac{108x - x^3}{4} = 27x - \\frac{1}{4}x^3$. Đạo hàm $V'(x) = 27 - \\frac{3}{4}x^2 = 0 \\Leftrightarrow x^2 = 36 \\Leftrightarrow x = 6\\text{ cm}$ (vì $x > 0$). Khi đó $h = 3\\text{ cm}$ và $V_{\\max} = 108\\text{ cm}^3$."
  },
  {
    id: 9,
    title: "Câu 9 (SGK Vận dụng trang 18): Mô hình lây lan dịch bệnh",
    pts: 20,
    question: "Số người nhiễm bệnh sau $t$ tuần được mô hình hóa bởi $N(t) = -t^3 + 12t^2$ với $0 \\le t \\le 12$ (trăm người). Số người nhiễm bệnh đạt tối đa vào tuần thứ mấy?",
    options: [
      { text: "Tuần thứ $4$", correct: false },
      { text: "Tuần thứ $6$", correct: false },
      { text: "Tuần thứ $8$", correct: true },
      { text: "Tuần thứ $12$", correct: false }
    ],
    explanation: "Xét hàm $N(t)$ trên đoạn $[0; 12]$. Đạo hàm $N'(t) = -3t^2 + 24t = -3t(t - 8) = 0 \\Leftrightarrow t = 0$ hoặc $t = 8$. Vì $N(0) = 0, N(12) = 0$ và $N(8) = -(8)^3 + 12(8)^2 = -512 + 768 = 256$ (trăm người). Do đó dịch bệnh đạt đỉnh tại tuần thứ $8$ với $25\\,600$ người."
  },
  {
    id: 10,
    title: "Câu 10: Phân biệt khẳng định đúng về cực trị và $\\max/\\min$",
    pts: 20,
    question: "Cho hàm số $y = f(x)$ liên tục trên đoạn $[a; b]$. Khẳng định nào sau đây là KHẲNG ĐỊNH ĐÚNG?",
    options: [
      { text: "Nếu $x_0$ là điểm cực đại của hàm số thì $f(x_0)$ luôn là giá trị lớn nhất trên $[a; b]$.", correct: false },
      { text: "Hàm số liên tục trên đoạn $[a; b]$ luôn tồn tại cả giá trị lớn nhất và giá trị nhỏ nhất trên đoạn đó.", correct: true },
      { text: "Giá trị cực tiểu của hàm số không bao giờ lớn hơn giá trị cực đại.", correct: false },
      { text: "Điểm đạt giá trị lớn nhất của hàm số trên $[a; b]$ bắt buộc phải là nghiệm của phương trình $f'(x) = 0$.", correct: false }
    ],
    explanation: "Theo định lý Weierstrass, mọi hàm số liên tục trên một đoạn $[a; b]$ đều luôn đạt được giá trị lớn nhất và giá trị nhỏ nhất trên đoạn đó. Các phương án khác sai vì: $\\max$ có thể đạt tại đầu mút $a$ hoặc $b$ (nơi đạo hàm không triệt tiêu), và cực trị chỉ mang tính cục bộ nên giá trị cực tiểu hoàn toàn có thể lớn hơn một giá trị cực đại ở nhánh khác."
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
        lesson: 'toan12_bai2',
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

// --- 5. LOGIC PHÒNG THÍ NGHIỆM LAB 1 (KÍNH LÚP QUÉT ĐOẠN [a; b]) ---
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderA = document.getElementById('lab1SliderA');
  const sliderB = document.getElementById('lab1SliderB');
  const valA = document.getElementById('lab1ValA');
  const valB = document.getElementById('lab1ValB');
  const valFa = document.getElementById('lab1ValFa');
  const valFb = document.getElementById('lab1ValFb');
  const resultBox = document.getElementById('lab1ResultBox');

  // f(x) = 2x^3 - 6x + 3
  function f(x) {
    return 2 * Math.pow(x, 3) - 6 * x + 3;
  }

  function draw() {
    let a = parseFloat(sliderA.value);
    let b = parseFloat(sliderB.value);
    if (a >= b) {
      a = b - 0.1;
      sliderA.value = a.toFixed(1);
    }

    if (valA) valA.textContent = `$${a.toFixed(1)}$`;
    if (valB) valB.textContent = `$${b.toFixed(1)}$`;

    const fa = f(a);
    const fb = f(b);
    if (valFa) valFa.textContent = `$${fa.toFixed(2)}$`;
    if (valFb) valFb.textContent = `$${fb.toFixed(2)}$`;

    // Xét các điểm dừng x = -1 và x = 1 nếu rơi vào [a, b]
    let candidates = [
      { x: a, y: fa, label: 'f(a)' },
      { x: b, y: fb, label: 'f(b)' }
    ];
    if (a <= -1 && -1 <= b) candidates.push({ x: -1, y: f(-1), label: 'f(-1) [CĐ]' });
    if (a <= 1 && 1 <= b) candidates.push({ x: 1, y: f(1), label: 'f(1) [CT]' });

    candidates.sort((c1, c2) => c1.y - c2.y);
    const minPt = candidates[0];
    const maxPt = candidates[candidates.length - 1];

    if (resultBox) {
      resultBox.innerHTML = `$\\max = ${maxPt.y.toFixed(2)}$ tại $x = ${maxPt.x.toFixed(1)}$ | $\\min = ${minPt.y.toFixed(2)}$ tại $x = ${minPt.x.toFixed(1)}$`;
      renderMathInTree(resultBox);
    }

    // Canvas drawing
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Coordinate mapping: X in [-2.5, 3.0], Y in [-6, 12]
    const xMin = -2.5, xMax = 3.0, yMin = -6, yMax = 12;
    function toCanvasX(x) { return (x - xMin) / (xMax - xMin) * (W - 80) + 40; }
    function toCanvasY(y) { return H - 40 - (y - yMin) / (yMax - yMin) * (H - 80); }

    // Background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let gx = -2; gx <= 3; gx += 1) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(gx), 0);
      ctx.lineTo(toCanvasX(gx), H);
      ctx.stroke();
    }
    for (let gy = -4; gy <= 10; gy += 2) {
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(gy));
      ctx.lineTo(W, toCanvasY(gy));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    // Ox
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(W, toCanvasY(0));
    ctx.stroke();
    // Oy
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), H);
    ctx.stroke();

    // Shaded interval [a, b]
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fillRect(toCanvasX(a), 0, toCanvasX(b) - toCanvasX(a), H);

    // Vertical boundary lines
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(a), 0);
    ctx.lineTo(toCanvasX(a), H);
    ctx.moveTo(toCanvasX(b), 0);
    ctx.lineTo(toCanvasX(b), H);
    ctx.stroke();
    ctx.setLineDash([]);

    // Curve f(x)
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let px = 0; px <= W; px += 2) {
      const rx = xMin + (px - 40) / (W - 80) * (xMax - xMin);
      const ry = f(rx);
      const cy = toCanvasY(ry);
      if (px === 0) ctx.moveTo(px, cy);
      else ctx.lineTo(px, cy);
    }
    ctx.stroke();

    // Highlight segment [a, b]
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    let started = false;
    for (let rx = a; rx <= b; rx += 0.02) {
      const cx = toCanvasX(rx);
      const cy = toCanvasY(f(rx));
      if (!started) { ctx.moveTo(cx, cy); started = true; }
      else ctx.lineTo(cx, cy);
    }
    ctx.stroke();

    // Endpoints
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(toCanvasX(a), toCanvasY(fa), 6, 0, Math.PI * 2);
    ctx.arc(toCanvasX(b), toCanvasY(fb), 6, 0, Math.PI * 2);
    ctx.fill();

    // Max point (Gold)
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(toCanvasX(maxPt.x), toCanvasY(maxPt.y), 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Min point (Emerald)
    ctx.fillStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(toCanvasX(minPt.x), toCanvasY(minPt.y), 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Labels
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText(`Max (${maxPt.x.toFixed(1)}; ${maxPt.y.toFixed(1)})`, toCanvasX(maxPt.x) - 30, toCanvasY(maxPt.y) - 14);
    ctx.fillText(`Min (${minPt.x.toFixed(1)}; ${minPt.y.toFixed(1)})`, toCanvasX(minPt.x) - 30, toCanvasY(minPt.y) + 20);

    unlockBadge('interval');
  }

  sliderA.oninput = () => { sound.playClick(); draw(); };
  sliderB.oninput = () => { sound.playClick(); draw(); };

  const btnSGK = document.getElementById('btnPresetSGK');
  if (btnSGK) {
    btnSGK.onclick = () => {
      sliderA.value = '-1.0';
      sliderB.value = '2.0';
      sound.playClick();
      draw();
    };
  }

  const btnSmall = document.getElementById('btnPresetSmall');
  if (btnSmall) {
    btnSmall.onclick = () => {
      sliderA.value = '0.0';
      sliderB.value = '1.5';
      sound.playClick();
      draw();
    };
  }

  draw();
}

// --- 6. LOGIC PHÒNG THÍ NGHIỆM LAB 2 (TỐI ƯU HỘP THỂ TÍCH LỚN NHẤT) ---
function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderX = document.getElementById('lab2SliderX');
  const valX = document.getElementById('lab2ValX');
  const valH = document.getElementById('lab2ValH');
  const valV = document.getElementById('lab2ValV');
  const statusBox = document.getElementById('lab2StatusBox');

  // S = x^2 + 4xh = 108 => h = (108 - x^2) / (4x)
  // V = x^2 * h = (108x - x^3) / 4
  function getBoxParams(x) {
    const h = (108 - x * x) / (4 * x);
    const v = (108 * x - Math.pow(x, 3)) / 4;
    return { h: Math.max(0.1, h), v: Math.max(0, v) };
  }

  function draw() {
    const x = parseFloat(sliderX.value);
    const { h, v } = getBoxParams(x);

    if (valX) valX.textContent = `$${x.toFixed(1)}\\text{ cm}$`;
    if (valH) valH.textContent = `$${h.toFixed(2)}\\text{ cm}$`;
    if (valV) valV.textContent = `$${v.toFixed(2)}\\text{ cm}^3$`;

    if (Math.abs(x - 6.0) < 0.25) {
      if (statusBox) {
        statusBox.style.borderColor = '#10b981';
        statusBox.style.background = 'rgba(16, 185, 129, 0.2)';
        statusBox.innerHTML = `🎉 <strong>CHÍNH XÁC KÍCH THƯỚC TỐI ƯU!</strong> Cạnh đáy $x = 6.0\\text{ cm}$, chiều cao $h = 3.0\\text{ cm}$ mang lại thể tích hộp lớn nhất tuyệt đối $V_{\\max} = 108.0\\text{ cm}^3$!`;
        renderMathInTree(statusBox);
      }
      unlockBadge('optimizer');
    } else {
      if (statusBox) {
        statusBox.style.borderColor = 'rgba(99, 102, 241, 0.55)';
        statusBox.style.background = 'rgba(99, 102, 241, 0.15)';
        statusBox.innerHTML = `Thể tích hiện tại là $${v.toFixed(2)}\\text{ cm}^3$. Hãy thử dịch chuyển thanh trượt $x$ về mốc $6.0\\text{ cm}$ để đạt thể tích cực đại!`;
        renderMathInTree(statusBox);
      }
    }

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Left side: 3D Box perspective rendering
    const boxCenterX = 180;
    const boxCenterY = 220;
    const scale = 14;

    const dx = x * scale * 0.7;
    const dy = x * scale * 0.4;
    const dh = h * scale;

    // Draw bottom face (isometric)
    ctx.fillStyle = 'rgba(99, 102, 241, 0.3)';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(boxCenterX, boxCenterY);
    ctx.lineTo(boxCenterX + dx, boxCenterY - dy * 0.5);
    ctx.lineTo(boxCenterX, boxCenterY - dy);
    ctx.lineTo(boxCenterX - dx, boxCenterY - dy * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Draw vertical edges
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    // Front vertex
    ctx.beginPath();
    ctx.moveTo(boxCenterX, boxCenterY);
    ctx.lineTo(boxCenterX, boxCenterY - dh);
    ctx.stroke();
    // Right vertex
    ctx.beginPath();
    ctx.moveTo(boxCenterX + dx, boxCenterY - dy * 0.5);
    ctx.lineTo(boxCenterX + dx, boxCenterY - dy * 0.5 - dh);
    ctx.stroke();
    // Left vertex
    ctx.beginPath();
    ctx.moveTo(boxCenterX - dx, boxCenterY - dy * 0.5);
    ctx.lineTo(boxCenterX - dx, boxCenterY - dy * 0.5 - dh);
    ctx.stroke();

    // Front-left face
    ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.beginPath();
    ctx.moveTo(boxCenterX, boxCenterY);
    ctx.lineTo(boxCenterX - dx, boxCenterY - dy * 0.5);
    ctx.lineTo(boxCenterX - dx, boxCenterY - dy * 0.5 - dh);
    ctx.lineTo(boxCenterX, boxCenterY - dh);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Front-right face
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.beginPath();
    ctx.moveTo(boxCenterX, boxCenterY);
    ctx.lineTo(boxCenterX + dx, boxCenterY - dy * 0.5);
    ctx.lineTo(boxCenterX + dx, boxCenterY - dy * 0.5 - dh);
    ctx.lineTo(boxCenterX, boxCenterY - dh);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Labels on box
    ctx.fillStyle = '#fff';
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillText(`x = ${x.toFixed(1)} cm`, boxCenterX - dx / 2 - 25, boxCenterY + 16);
    ctx.fillText(`h = ${h.toFixed(1)} cm`, boxCenterX + dx + 8, boxCenterY - dh / 2);

    // Right side: Graph of V(x)
    const graphLeft = 380;
    const graphRight = W - 30;
    const graphBottom = H - 50;
    const graphTop = 40;

    // Grid and axes for V(x)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(graphLeft, graphBottom);
    ctx.lineTo(graphRight, graphBottom);
    ctx.lineTo(graphRight, graphTop);
    ctx.stroke();

    // Curve of V(x) = 27x - 0.25x^3 from x = 0 to 10.39
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let cx = 0; cx <= 10.39; cx += 0.2) {
      const cv = (108 * cx - Math.pow(cx, 3)) / 4;
      const px = graphLeft + (cx / 10.5) * (graphRight - graphLeft);
      const py = graphBottom - (cv / 120) * (graphBottom - graphTop);
      if (cx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Peak marker at x = 6, V = 108
    const peakX = graphLeft + (6.0 / 10.5) * (graphRight - graphLeft);
    const peakY = graphBottom - (108 / 120) * (graphBottom - graphTop);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(peakX, graphBottom);
    ctx.lineTo(peakX, peakY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(peakX, peakY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Current point on curve
    const curX = graphLeft + (x / 10.5) * (graphRight - graphLeft);
    const curY = graphBottom - (v / 120) * (graphBottom - graphTop);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(curX, curY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Graph labels
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('V (cm³)', graphLeft + 5, graphTop - 10);
    ctx.fillText('x (cm)', graphRight - 15, graphBottom + 20);
    ctx.fillText('V_max = 108', peakX - 35, peakY - 10);
  }

  sliderX.oninput = () => { sound.playClick(); draw(); };

  const btnOpt = document.getElementById('btnLab2Optimal');
  if (btnOpt) {
    btnOpt.onclick = () => {
      sliderX.value = '6.0';
      sound.playClick();
      draw();
    };
  }

  const btnNar = document.getElementById('btnLab2Narrow');
  if (btnNar) {
    btnNar.onclick = () => {
      sliderX.value = '2.0';
      sound.playClick();
      draw();
    };
  }

  const btnWid = document.getElementById('btnLab2Wide');
  if (btnWid) {
    btnWid.onclick = () => {
      sliderX.value = '9.0';
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
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập của Bài 2 không?')) {
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
