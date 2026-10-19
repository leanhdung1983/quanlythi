// ================================================================
// BÀI 5: ỨNG DỤNG ĐẠO HÀM ĐỂ GIẢI QUYẾT MỘT SỐ VẤN ĐỀ THỰC TIỄN - TOÁN 12 KNTT
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
const STATE_KEY = 'toan12_bai5_state_v1';
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Tối Ưu Thực Tiễn 12',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: {
    biz_profit: false,
    cable_optimizer: false,
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
  const allOtherUnlocked = appState.badges.biz_profit && appState.badges.cable_optimizer && appState.badges.streak && appState.badges.arena;
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
    title: "Câu 1 (SGK 1.26a): Phương trình vận tốc và gia tốc chuyển động",
    pts: 20,
    question: "Một hạt chuyển động trên trục thẳng đứng có tọa độ $y = t^3 - 12t + 3$ ($t \\ge 0$, đơn vị: mét, giây). Biểu thức vận tốc $v(t)$ và gia tốc $a(t)$ của hạt lần lượt là:",
    options: [
      { text: "$v(t) = 3t^2 - 12$ và $a(t) = 6t$", correct: true },
      { text: "$v(t) = 3t^2 + 12$ và $a(t) = 6t$", correct: false },
      { text: "$v(t) = t^2 - 12$ và $a(t) = 2t$", correct: false },
      { text: "$v(t) = 6t$ và $a(t) = 6$", correct: false }
    ],
    explanation: "Theo định nghĩa vật lý: Vận tốc là đạo hàm bậc nhất của li độ $v(t) = y'(t) = 3t^2 - 12$. Gia tốc là đạo hàm bậc hai của li độ (đạo hàm của vận tốc) $a(t) = v'(t) = 6t$."
  },
  {
    id: 2,
    title: "Câu 2 (SGK 1.26b): Chiều chuyển động theo dấu vận tốc",
    pts: 20,
    question: "Hạt chuyển động có li độ $y = t^3 - 12t + 3$ ($t \\ge 0$). Hạt chuyển động hướng lên trên khi nào?",
    options: [
      { text: "Khi $0 \\le t < 2$", correct: false },
      { text: "Khi $t > 2$ giây", correct: true },
      { text: "Khi $t = 2$ giây", correct: false },
      { text: "Với mọi $t \\ge 0$", correct: false }
    ],
    explanation: "Hạt chuyển động lên trên theo chiều dương khi và chỉ khi vận tốc mang dấu dương: $v(t) = 3t^2 - 12 > 0 \\Leftrightarrow t^2 > 4 \\Leftrightarrow t > 2$ (vì $t \\ge 0$)."
  },
  {
    id: 3,
    title: "Câu 3 (SGK 1.26c): Quãng đường thực tế đi được",
    pts: 20,
    question: "Tính tổng quãng đường mà hạt có $y = t^3 - 12t + 3$ đi được trong khoảng thời gian $0 \\le t \\le 3$ giây.",
    options: [
      { text: "$9\\text{ m}$", correct: false },
      { text: "$16\\text{ m}$", correct: false },
      { text: "$23\\text{ m}$", correct: true },
      { text: "$27\\text{ m}$", correct: false }
    ],
    explanation: "Vận tốc đổi dấu tại thời điểm dừng $t = 2$ ($v(2) = 0$). Tại $t = 0: y(0) = 3$. Tại $t = 2: y(2) = 8 - 24 + 3 = -13$. Tại $t = 3: y(3) = 27 - 36 + 3 = -6$. Giai đoạn 1 ($0 \\to 2\\text{s}$): hạt đi xuống quãng đường $|-13 - 3| = 16\\text{ m}$. Giai đoạn 2 ($2 \\to 3\\text{s}$): hạt quay đầu đi lên quãng đường $|-6 - (-13)| = 7\\text{ m}$. Tổng quãng đường đi được là $16 + 7 = 23\\text{ m}$."
  },
  {
    id: 4,
    title: "Câu 4 (SGK 1.27a): Khái niệm Chi Phí Biên",
    pts: 20,
    question: "Chi phí sản xuất $x$ đơn vị hàng hóa là $C(x) = 23000 + 50x - 0.5x^2 + 0.00175x^3$ (trăm nghìn đồng). Hàm chi phí biên $C'(x)$ là:",
    options: [
      { text: "$C'(x) = 50 - x + 0.00525x^2$", correct: true },
      { text: "$C'(x) = 50 - 0.5x + 0.00175x^2$", correct: false },
      { text: "$C'(x) = 23000 + 50 - x$", correct: false },
      { text: "$C'(x) = 50 - 2x + 0.00525x^2$", correct: false }
    ],
    explanation: "Chi phí biên là đạo hàm của hàm chi phí tổng: $C'(x) = (23000)' + (50x)' - (0.5x^2)' + (0.00175x^3)' = 50 - x + 0.00525x^2$."
  },
  {
    id: 5,
    title: "Câu 5 (SGK 1.27b): Ý nghĩa kinh tế của giá trị Chi Phí Biên",
    pts: 20,
    question: "Giá trị $C'(100) = 2.5$ (trăm nghìn đồng) mang ý nghĩa kinh tế nào sau đây?",
    options: [
      { text: "Chi phí trung bình để sản xuất $100$ sản phẩm là $2.5$ trăm nghìn đồng.", correct: false },
      { text: "Doanh nghiệp bị lỗ $2.5$ trăm nghìn đồng tại sản phẩm thứ $100$.", correct: false },
      { text: "Chi phí phát sinh xấp xỉ để sản xuất thêm đơn vị sản phẩm thứ $101$ là khoảng $2.5$ trăm nghìn đồng.", correct: true },
      { text: "Lợi nhuận thu được khi bán sản phẩm thứ $100$ là $2.5$ trăm nghìn đồng.", correct: false }
    ],
    explanation: "Theo định nghĩa giải tích kinh tế SGK Toán 12: Chi phí biên tại $x$ là $C'(x) \\approx C(x+1) - C(x)$, biểu thị tốc độ gia tăng chi phí và xấp xỉ chi phí bỏ ra để sản xuất thêm một đơn vị sản phẩm tiếp theo (đơn vị thứ $101$)."
  },
  {
    id: 6,
    title: "Câu 6 (SGK 1.28): Tối ưu hóa doanh thu cho thuê chung cư",
    pts: 20,
    question: "Khu chung cư có $100$ căn hộ cho thuê giá $8\\text{ triệu đồng/tháng}$. Cứ tăng giá thuê thêm $100\\text{ nghìn đồng}$ ($0.1\\text{ triệu}$) thì có thêm $1$ căn hộ bị bỏ trống. Người quản lý nên đặt giá thuê bao nhiêu để doanh thu lớn nhất?",
    options: [
      { text: "$8.5\\text{ triệu đồng/tháng}$", correct: false },
      { text: "$9.0\\text{ triệu đồng/tháng}$", correct: true },
      { text: "$9.5\\text{ triệu đồng/tháng}$", correct: false },
      { text: "$10.0\\text{ triệu đồng/tháng}$", correct: false }
    ],
    explanation: "Gọi số lần tăng giá $100\\text{ nghìn}$ là $x$ ($x$ nguyên, $0 \\le x \\le 100$). Giá thuê mới là $8 + 0.1x$ (triệu), số căn cho thuê là $100 - x$. Doanh thu $R(x) = (100 - x)(8 + 0.1x) = 800 + 2x - 0.1x^2$. Đạo hàm $R'(x) = 2 - 0.2x = 0 \\Leftrightarrow x = 10$. Vậy nên tăng giá $10$ lần (tăng $1\\text{ triệu}$), giá thuê tối ưu là $8 + 1 = 9\\text{ triệu đồng/tháng}$ cho doanh thu cực đại $810\\text{ triệu đồng}$."
  },
  {
    id: 7,
    title: "Câu 7 (SGK 1.29a): Khảo sát hàm cầu hàng hóa",
    pts: 20,
    question: "Hàm cầu của một sản phẩm là $p = \\frac{354}{1 + 0.01x}$ ($x \\ge 0$, đơn vị: nghìn đồng). Khi giá bán là $240\\text{ nghìn đồng}$, số lượng đơn vị sản phẩm bán được là bao nhiêu?",
    options: [
      { text: "$40.5$ đơn vị", correct: false },
      { text: "$47.5$ đơn vị", correct: true },
      { text: "$52.0$ đơn vị", correct: false },
      { text: "$60.0$ đơn vị", correct: false }
    ],
    explanation: "Thay $p = 240$ vào hàm cầu: $240 = \\frac{354}{1 + 0.01x} \\Leftrightarrow 1 + 0.01x = \\frac{354}{240} = 1.475 \\Leftrightarrow 0.01x = 0.475 \\Leftrightarrow x = 47.5$ đơn vị sản phẩm."
  },
  {
    id: 8,
    title: "Câu 8 (SGK 1.29b): Ý nghĩa tiệm cận của hàm cầu khi giá giảm về 0",
    pts: 20,
    question: "Xét hàm số lượng cầu $x(p) = 100\\left(\\frac{354}{p} - 1\\right)$ với $p > 0$. Giới hạn $\\lim\\limits_{p \\to 0^+} x(p) = +\\infty$ mang ý nghĩa thực tiễn nào?",
    options: [
      { text: "Khi giá bán tiến dần về $0$ (miễn phí), nhu cầu tiêu thụ của thị trường có xu hướng tăng vô hạn.", correct: true },
      { text: "Doanh thu sẽ đạt cực đại khi giá bán bằng $0$.", correct: false },
      { text: "Hàng hóa sẽ không ai mua nếu giá quá rẻ.", correct: false },
      { text: "Chi phí sản xuất sẽ bằng $0$ khi giá bán bằng $0$.", correct: false }
    ],
    explanation: "Khi giá bán $p$ giảm dần về $0$ (gần như tặng không), theo quy luật cung cầu tâm lý người tiêu dùng, số lượng đơn vị sản phẩm được tiêu thụ $x(p)$ sẽ bùng nổ tiến ra vô cực (đường tiệm cận đứng $p = 0$)."
  },
  {
    id: 9,
    title: "Câu 9 (SGK 1.46): Bài toán công trình kéo cáp điện biển",
    pts: 20,
    question: "Đảo $C$ cách bờ $B$ đoạn $4\\text{ km}$, $AB = 10\\text{ km}$. Cáp biển $50\\text{ triệu/km}$, cáp đất liền $30\\text{ triệu/km}$. Vị trí điểm nối $M$ trên $AB$ cách $B$ bao nhiêu km để tổng chi phí nhỏ nhất?",
    options: [
      { text: "$x = 0\\text{ km}$", correct: false },
      { text: "$x = 3\\text{ km}$", correct: true },
      { text: "$x = 4\\text{ km}$", correct: false },
      { text: "$x = 5\\text{ km}$", correct: false }
    ],
    explanation: "Hàm tổng chi phí $T(x) = 50\\sqrt{x^2 + 16} + 30(10 - x)$ với $0 \\le x \\le 10$. Đạo hàm $T'(x) = \\frac{50x}{\\sqrt{x^2 + 16}} - 30 = 0 \\Leftrightarrow 5x = 3\\sqrt{x^2 + 16} \\Leftrightarrow 25x^2 = 9(x^2 + 16) \\Leftrightarrow 16x^2 = 144 \\Leftrightarrow x = 3\\text{ km}$. Khi đó tổng chi phí nhỏ nhất đạt $460\\text{ triệu đồng}$."
  },
  {
    id: 10,
    title: "Câu 10: Tốc độ dòng máu chảy trong động mạch",
    pts: 20,
    question: "Tốc độ dòng máu chảy qua một động mạch hình trụ bán kính $R$ tại khoảng cách $r$ tính từ trục tâm động mạch là $v(r) = k(R^2 - r^2)$ ($k > 0, 0 \\le r \\le R$). Dòng máu chảy nhanh nhất tại vị trí nào?",
    options: [
      { text: "Tại thành động mạch ($r = R$)", correct: false },
      { text: "Tại chính giữa khoảng cách ($r = R/2$)", correct: false },
      { text: "Tại trục tâm chính giữa của động mạch ($r = 0$)", correct: true },
      { text: "Tốc độ dòng máu bằng nhau tại mọi điểm.", correct: false }
    ],
    explanation: "Vì $k > 0$ và $r^2 \\ge 0$, ta có $v(r) = k(R^2 - r^2) \\le k R^2$. Dấu bằng xảy ra khi $r = 0$. Về mặt vật lý học dòng chảy (định luật Poiseuille), tại thành mạch có lực ma sát lớn nhất nên vận tốc bằng $0$, còn tại tâm trục động mạch ma sát nhỏ nhất nên vận tốc dòng máu đạt cực đại $v_{\\max} = k R^2$."
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
        lesson: 'toan12_bai5',
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

// --- 5. LOGIC PHÒNG THÍ NGHIỆM LAB 1 (TỐI ƯU HÓA LỢI NHUẬN) ---
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderX = document.getElementById('lab1SliderX');
  const valX = document.getElementById('lab1ValX');
  const valPrice = document.getElementById('lab1ValPrice');
  const valRev = document.getElementById('lab1ValRev');
  const valProfit = document.getElementById('lab1ValProfit');
  const statusBox = document.getElementById('lab1StatusBox');

  // p(x) = 19 - 0.005x
  // R(x) = 19x - 0.005x^2
  // C(x) = 12000 - 3x
  // P(x) = -0.005x^2 + 22x - 12000
  function p(x) { return 19 - 0.005 * x; }
  function R(x) { return 19 * x - 0.005 * x * x; }
  function P(x) { return -0.005 * x * x + 22 * x - 12000; }

  function draw() {
    const x = parseFloat(sliderX.value);
    const price = p(x);
    const rev = R(x);
    const profit = P(x);

    if (valX) valX.textContent = `$${x}$ chiếc`;
    if (valPrice) valPrice.textContent = `$${price.toFixed(2)}\\text{ triệu}$`;
    if (valRev) valRev.textContent = `$${rev.toFixed(0)}\\text{ triệu}$`;
    if (valProfit) valProfit.textContent = `$${profit.toFixed(0)}\\text{ triệu}$`;

    if (Math.abs(x - 2200) < 50) {
      if (statusBox) {
        statusBox.style.borderColor = '#10b981';
        statusBox.style.background = 'rgba(16, 185, 129, 0.2)';
        statusBox.innerHTML = `🎉 <strong>CHÍNH XÁC ĐIỂM CỰC ĐẠI LỢI NHUẬN!</strong> Sản xuất $2200$ chiếc với giá $8.0\\text{ triệu}$ mang lại lợi nhuận kỷ lục $12\,200\\text{ triệu}$ ($12.2\\text{ tỷ đồng}$)!`;
        renderMathInTree(statusBox);
      }
      unlockBadge('biz_profit');
    } else {
      if (statusBox) {
        statusBox.style.borderColor = 'rgba(99, 102, 241, 0.55)';
        statusBox.style.background = 'rgba(99, 102, 241, 0.15)';
        statusBox.innerHTML = `Lợi nhuận hiện tại là $${profit.toFixed(0)}\\text{ triệu}$. Hãy thử chỉnh $x$ về $2200$ để lợi nhuận đạt mức tối đa!`;
        renderMathInTree(statusBox);
      }
    }

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Coord mapping: x in [800, 3400], y in [0, 22000]
    const xMin = 800, xMax = 3400, yMin = 0, yMax = 22000;
    function toCanvasX(cx) { return (cx - xMin) / (xMax - xMin) * (W - 80) + 40; }
    function toCanvasY(cy) { return H - 40 - (cy - yMin) / (yMax - yMin) * (H - 80); }

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let gx = 1000; gx <= 3000; gx += 500) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(gx), 0);
      ctx.lineTo(toCanvasX(gx), H);
      ctx.stroke();
    }
    for (let gy = 5000; gy <= 20000; gy += 5000) {
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(gy));
      ctx.lineTo(W, toCanvasY(gy));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(0)); ctx.lineTo(W, toCanvasY(0));
    ctx.moveTo(toCanvasX(1000), 0); ctx.lineTo(toCanvasX(1000), H);
    ctx.stroke();

    // Curve Revenue R(x) (Gold)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let cx = 800; cx <= 3400; cx += 50) {
      const cy = R(cx);
      const px = toCanvasX(cx), py = toCanvasY(cy);
      if (cx === 800) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Curve Profit P(x) (Emerald)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let cx = 800; cx <= 3400; cx += 50) {
      const cy = P(cx);
      const px = toCanvasX(cx), py = toCanvasY(cy);
      if (cx === 800) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Peak of Profit at x = 2200, P = 12200
    const peakX = toCanvasX(2200);
    const peakY = toCanvasY(12200);
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(peakX, toCanvasY(0));
    ctx.lineTo(peakX, peakY);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(peakX, peakY, 6, 0, Math.PI * 2);
    ctx.fill();

    // Current point on Profit
    const curX = toCanvasX(x);
    const curY = toCanvasY(profit);
    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(curX, curY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Labels
    ctx.fillStyle = '#f59e0b';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('Doanh thu R(x)', toCanvasX(2800), toCanvasY(R(2800)) - 10);

    ctx.fillStyle = '#10b981';
    ctx.fillText('Lợi nhuận P(x)', toCanvasX(2900), toCanvasY(P(2900)) + 20);
    ctx.fillText('P_max (2200; 12.2 tỷ)', peakX - 55, peakY - 12);
  }

  sliderX.oninput = () => { sound.playClick(); draw(); };

  const btnOpt = document.getElementById('btnLab1Optimal');
  if (btnOpt) btnOpt.onclick = () => { sliderX.value = '2200'; sound.playClick(); draw(); };

  const btnLow = document.getElementById('btnLab1Low');
  if (btnLow) btnLow.onclick = () => { sliderX.value = '1000'; sound.playClick(); draw(); };

  const btnHigh = document.getElementById('btnLab1High');
  if (btnHigh) btnHigh.onclick = () => { sliderX.value = '3000'; sound.playClick(); draw(); };

  draw();
}

// --- 6. LOGIC PHÒNG THÍ NGHIỆM LAB 2 (KÉO CÁP ĐIỆN BIỂN) ---
function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderX = document.getElementById('lab2SliderX');
  const valX = document.getElementById('lab2ValX');
  const valSea = document.getElementById('lab2ValSeaLen');
  const valLand = document.getElementById('lab2ValLandLen');
  const valCost = document.getElementById('lab2ValTotalCost');
  const statusBox = document.getElementById('lab2StatusBox');

  // T(x) = 50 * sqrt(x^2 + 16) + 30 * (10 - x)
  function T(x) {
    return 50 * Math.sqrt(x * x + 16) + 30 * (10 - x);
  }

  function draw() {
    const x = parseFloat(sliderX.value);
    const seaLen = Math.sqrt(x * x + 16);
    const landLen = 10 - x;
    const totalCost = T(x);

    if (valX) valX.textContent = `$${x.toFixed(1)}\\text{ km}$`;
    if (valSea) valSea.textContent = `$${seaLen.toFixed(2)}\\text{ km}$`;
    if (valLand) valLand.textContent = `$${landLen.toFixed(2)}\\text{ km}$`;
    if (valCost) valCost.textContent = `$${totalCost.toFixed(2)}\\text{ triệu}$`;

    if (Math.abs(x - 3.0) < 0.2) {
      if (statusBox) {
        statusBox.style.borderColor = '#10b981';
        statusBox.style.background = 'rgba(16, 185, 129, 0.2)';
        statusBox.innerHTML = `🎉 <strong>VỊ TRÍ ĐẶT CÁP TỐI ƯU TUYỆT ĐỐI!</strong> Điểm nối $M$ cách $B$ đúng $3.0\\text{ km}$ mang lại tổng chi phí thi công nhỏ nhất là $460.0\\text{ triệu đồng}$!`;
        renderMathInTree(statusBox);
      }
      unlockBadge('cable_optimizer');
    } else {
      if (statusBox) {
        statusBox.style.borderColor = 'rgba(99, 102, 241, 0.55)';
        statusBox.style.background = 'rgba(99, 102, 241, 0.15)';
        statusBox.innerHTML = `Tổng chi phí hiện tại: $${totalCost.toFixed(2)}\\text{ triệu}$. Hãy thử kéo điểm $M$ về mốc $x = 3.0\\text{ km}$ để chi phí đạt mức thấp nhất!`;
        renderMathInTree(statusBox);
      }
    }

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Geometry layout: Left side represents map
    // Shore line AB: along y = 200, B at (70, 200), A at (320, 200) => distance 10km => scale = 25 px/km
    const shoreY = 200;
    const bX = 60;
    const aX = 310;
    const kmScale = 25;

    // Sea area (top left)
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.fillRect(0, 0, aX + 30, shoreY);

    // Land area (bottom)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.1)';
    ctx.fillRect(0, shoreY, W, H - shoreY);

    // Shoreline
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, shoreY);
    ctx.lineTo(W, shoreY);
    ctx.stroke();

    // Island C: 4km offshore from B => C is at (bX, shoreY - 4 * kmScale) = (60, 100)
    const cX = bX;
    const cY = shoreY - 4 * kmScale;

    // Point M on shoreline: x km from B => mX = bX + x * kmScale
    const mX = bX + x * kmScale;
    const mY = shoreY;

    // Sea Cable CM
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cX, cY);
    ctx.lineTo(mX, mY);
    ctx.stroke();

    // Land Cable MA
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(mX, mY);
    ctx.lineTo(aX, mY);
    ctx.stroke();

    // Distance perpendicular CB (dashed)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cX, cY);
    ctx.lineTo(bX, shoreY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Nodes
    function drawNode(nx, ny, label, color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(nx, ny, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px "Segoe UI", sans-serif';
      ctx.fillText(label, nx - 4, ny - 10);
    }
    drawNode(cX, cY, 'C (Đảo)', '#06b6d4');
    drawNode(bX, shoreY, 'B', '#94a3b8');
    drawNode(aX, shoreY, 'A (Nhà máy)', '#10b981');
    drawNode(mX, mY, `M (x=${x.toFixed(1)})`, '#f43f5e');

    // Right side: Cost curve T(x)
    const gLeft = 360, gRight = W - 25;
    const gBottom = H - 40, gTop = 40;

    // Grid for T(x)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(gLeft, gBottom); ctx.lineTo(gRight, gBottom);
    ctx.moveTo(gLeft, gBottom); ctx.lineTo(gLeft, gTop);
    ctx.stroke();

    // Curve T(x): x in [0, 10], cost in [450, 520]
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let cx = 0; cx <= 10; cx += 0.2) {
      const cost = T(cx);
      const px = gLeft + (cx / 10) * (gRight - gLeft);
      const py = gBottom - ((cost - 450) / 70) * (gBottom - gTop);
      if (cx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Min point at x = 3, T = 460
    const minPX = gLeft + (3 / 10) * (gRight - gLeft);
    const minPY = gBottom - ((460 - 450) / 70) * (gBottom - gTop);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(minPX, minPY, 5, 0, Math.PI * 2);
    ctx.fill();

    // Current point on cost curve
    const curPX = gLeft + (x / 10) * (gRight - gLeft);
    const curPY = gBottom - ((totalCost - 450) / 70) * (gBottom - gTop);
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(curPX, curPY, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('Chi phí T(x) [triệu]', gLeft + 5, gTop - 8);
    ctx.fillText('x (km)', gRight - 20, gBottom + 18);
    ctx.fillStyle = '#10b981';
    ctx.fillText('Min = 460 tr (x=3)', minPX - 35, minPY - 10);
  }

  sliderX.oninput = () => { sound.playClick(); draw(); };

  const btnOpt = document.getElementById('btnLab2Optimal');
  if (btnOpt) btnOpt.onclick = () => { sliderX.value = '3.0'; sound.playClick(); draw(); };

  const btnPerp = document.getElementById('btnLab2Perp');
  if (btnPerp) btnPerp.onclick = () => { sliderX.value = '0.0'; sound.playClick(); draw(); };

  const btnDirect = document.getElementById('btnLab2Direct');
  if (btnDirect) btnDirect.onclick = () => { sliderX.value = '10.0'; sound.playClick(); draw(); };

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
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập của Bài 5 không?')) {
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
