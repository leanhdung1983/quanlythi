// ================================================================
// BÀI 4: KHẢO SÁT SỰ BIẾN THIÊN VÀ VẼ ĐỒ THỊ CỦA HÀM SỐ - TOÁN 12 KNTT
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
const STATE_KEY = 'toan12_bai4_state_v1';
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nghệ Nhân Khảo Sát Đồ Thị 12',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: {
    cubic_studio: false,
    rational_morpher: false,
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
  const allOtherUnlocked = appState.badges.cubic_studio && appState.badges.rational_morpher && appState.badges.streak && appState.badges.arena;
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
    title: "Câu 1: Tâm đối xứng của đồ thị hàm đa thức bậc ba",
    pts: 20,
    question: "Đồ thị của mọi hàm số đa thức bậc ba $y = ax^3 + bx^2 + cx + d$ ($a \\ne 0$) luôn có tâm đối xứng là điểm nào sau đây?",
    options: [
      { text: "Gốc tọa độ $O(0; 0)$", correct: false },
      { text: "Điểm cực đại của đồ thị", correct: false },
      { text: "Điểm uốn $I$ có hoành độ thỏa mãn $y'' = 0$ ($x_0 = -\\frac{b}{3a}$)", correct: true },
      { text: "Giao điểm của đồ thị với trục tung $Oy$", correct: false }
    ],
    explanation: "Theo SGK Toán 12: Đồ thị hàm đa thức bậc ba luôn có một tâm đối xứng duy nhất, đó chính là điểm uốn $I(x_0; y_0)$ với hoành độ là nghiệm của đạo hàm cấp hai $y'' = 6ax + 2b = 0 \\Leftrightarrow x_0 = -\\frac{b}{3a}$."
  },
  {
    id: 2,
    title: "Câu 2 (SGK 1.21a): Khảo sát các điểm đặc biệt của hàm bậc ba",
    pts: 20,
    question: "Cho hàm số $y = -x^3 + 3x + 1$. Tọa độ các điểm cực trị và điểm uốn của đồ thị lần lượt là:",
    options: [
      { text: "Cực tiểu $(-1; -1)$, cực đại $(1; 3)$, điểm uốn $I(0; 1)$", correct: true },
      { text: "Cực tiểu $(1; 3)$, cực đại $(-1; -1)$, điểm uốn $I(0; 1)$", correct: false },
      { text: "Cực tiểu $(-1; 0)$, cực đại $(1; 4)$, điểm uốn $I(0; 2)$", correct: false },
      { text: "Không có cực trị, điểm uốn $I(0; 1)$", correct: false }
    ],
    explanation: "Đạo hàm $y' = -3x^2 + 3 = 0 \\Leftrightarrow x = \\pm 1$. Vì $a = -1 < 0$ nên qua $x = -1$ đạo hàm đổi dấu từ âm sang dương (đạt cực tiểu tại $(-1; -1)$); qua $x = 1$ đạo hàm đổi dấu từ dương sang âm (đạt cực đại tại $(1; 3)$). Đạo hàm cấp hai $y'' = -6x = 0 \\Leftrightarrow x = 0 \\Rightarrow I(0; 1)$ là điểm uốn."
  },
  {
    id: 3,
    title: "Câu 3 (SGK 1.22a): Tính đơn điệu của hàm phân thức bậc 1 trên bậc 1",
    pts: 20,
    question: "Cho hàm số $y = \\frac{2x + 1}{x + 1}$. Phát biểu nào sau đây là ĐÚNG về chiều biến thiên của hàm số?",
    options: [
      { text: "Hàm số đồng biến trên $\\mathbb{R} \\setminus \\{-1\\}$.", correct: false },
      { text: "Hàm số đồng biến trên từng khoảng $(-\\infty; -1)$ và $(-1; +\\infty)$, không có cực trị.", correct: true },
      { text: "Hàm số nghịch biến trên từng khoảng xác định.", correct: false },
      { text: "Hàm số đạt cực tiểu tại $x = -1$.", correct: false }
    ],
    explanation: "Tập xác định $D = \\mathbb{R} \\setminus \\{-1\\}$. Đạo hàm $y' = \\frac{2(1) - 1(1)}{(x + 1)^2} = \\frac{1}{(x + 1)^2} > 0$ với mọi $x \\ne -1$. Do đó hàm số đồng biến trên từng khoảng xác định $(-\\infty; -1)$ và $(-1; +\\infty)$. Lưu ý: Không dùng ký hiệu $\\mathbb{R} \\setminus \\{-1\\}$ hay dấu hợp $\\cup$ khi kết luận khoảng đơn điệu."
  },
  {
    id: 4,
    title: "Câu 4 (SGK 1.22b): Tâm đối xứng của phân thức bậc 1 trên bậc 1",
    pts: 20,
    question: "Tìm tọa độ tâm đối xứng $I$ của đồ thị hàm số $y = \\frac{x + 3}{1 - x}$.",
    options: [
      { text: "$I(-1; 1)$", correct: false },
      { text: "$I(1; 1)$", correct: false },
      { text: "$I(1; -1)$", correct: true },
      { text: "$I(-3; 0)$", correct: false }
    ],
    explanation: "Ta viết lại: $y = \\frac{x + 3}{-x + 1}$. Tiệm cận đứng là $x = 1$. Tiệm cận ngang là $y = \\frac{1}{-1} = -1$. Giao điểm hai đường tiệm cận chính là tâm đối xứng của Hyperbol: $I(1; -1)$."
  },
  {
    id: 5,
    title: "Câu 5 (SGK 1.23a): Tiệm cận xiên của phân thức bậc 2 trên bậc 1",
    pts: 20,
    question: "Tìm phương trình đường tiệm cận xiên của đồ thị hàm số $y = \\frac{2x^2 - x + 4}{x - 1}$.",
    options: [
      { text: "$y = 2x + 1$", correct: true },
      { text: "$y = 2x - 1$", correct: false },
      { text: "$y = 2x + 3$", correct: false },
      { text: "$y = x + 1$", correct: false }
    ],
    explanation: "Chia tử số cho mẫu số: $2x^2 - x + 4 = (2x + 1)(x - 1) + 5 \\Rightarrow y = 2x + 1 + \\frac{5}{x - 1}$. Vì $\\lim\\limits_{x \\to \\pm\\infty} \\frac{5}{x - 1} = 0$, nên đường tiệm cận xiên là $y = 2x + 1$."
  },
  {
    id: 6,
    title: "Câu 6 (SGK 1.23b): Khảo sát điểm cực trị của hàm phân thức bậc 2 trên 1",
    pts: 20,
    question: "Đồ thị hàm số $y = \\frac{x^2 + 2x + 1}{x + 3}$ có bao nhiêu điểm cực trị?",
    options: [
      { text: "$0$ điểm cực trị", correct: false },
      { text: "$1$ điểm cực trị", correct: false },
      { text: "$2$ điểm cực trị nằm về hai phía của đường tiệm cận đứng $x = -3$", correct: true },
      { text: "$3$ điểm cực trị", correct: false }
    ],
    explanation: "Ta có $y = \\frac{(x+1)^2}{x+3}$. Đạo hàm: $y' = \\frac{2(x+1)(x+3) - (x+1)^2}{(x+3)^2} = \\frac{(x+1)[2x+6 - x - 1]}{(x+3)^2} = \\frac{(x+1)(x+5)}{(x+3)^2}$. Phương trình $y' = 0 \\Leftrightarrow x = -1$ hoặc $x = -5$. Cả hai nghiệm đều khác $-3$, do đó đồ thị có đúng $2$ điểm cực trị nằm đối xứng qua tâm $I(-3; -4)$ và về hai phía của tiệm cận đứng $x = -3$."
  },
  {
    id: 7,
    title: "Câu 7 (SGK 1.24): Nồng độ hóa chất trong bình phản ứng",
    pts: 20,
    question: "Nồng độ KOH trong cốc khi đổ thêm $x$ (ml) dung dịch khác là $C(x) = \\frac{8x + 3000}{x + 30}$ (mg/ml) với $x \\ge 0$. Nhận định nào sau đây là ĐÚNG?",
    options: [
      { text: "Nồng độ KOH luôn tăng theo lượng dung dịch đổ thêm.", correct: false },
      { text: "Nồng độ KOH luôn giảm theo $x$ nhưng không bao giờ xuống dưới $8\\text{ mg/ml}$.", correct: true },
      { text: "Nồng độ KOH sẽ tiến dần về $0\\text{ mg/ml}$ khi đổ rất nhiều.", correct: false },
      { text: "Nồng độ KOH đạt cực tiểu tại $x = 30\\text{ ml}$.", correct: false }
    ],
    explanation: "Đạo hàm $C'(x) = \\frac{8(30) - 3000(1)}{(x + 30)^2} = \\frac{-2760}{(x + 30)^2} < 0, \\forall x \\ge 0$. Do đó hàm số $C(x)$ nghịch biến (nồng độ luôn giảm). Mặt khác $\\lim\\limits_{x \\to +\\infty} C(x) = 8\\text{ mg/ml}$, nghĩa là nồng độ dung dịch trong cốc tiệm cận với nồng độ dung dịch đổ thêm ($8\\text{ mg/ml}$) và luôn lớn hơn $8\\text{ mg/ml}$."
  },
  {
    id: 8,
    title: "Câu 8 (SGK 1.25): Khảo sát mạch điện trở song song",
    pts: 20,
    question: "Mắc song song điện trở $8\\,\\Omega$ với một biến trở $x\\,\\Omega$ thì điện trở tương đương là $R(x) = \\frac{8x}{x + 8}$ ($x > 0$). Vì sao $R(x)$ không bao giờ vượt quá $8\\,\\Omega$?",
    options: [
      { text: "Vì $R(x)$ có tiệm cận đứng $x = -8$.", correct: false },
      { text: "Vì $R'(x) < 0$ với mọi $x > 0$.", correct: false },
      { text: "Vì đường thẳng $R = 8$ là tiệm cận ngang của đồ thị và hàm số đồng biến tăng tiến về $8$.", correct: true },
      { text: "Vì điện trở của nguồn bị giới hạn.", correct: false }
    ],
    explanation: "Ta có $R'(x) = \\frac{64}{(x + 8)^2} > 0$ nên $R(x)$ tăng nghiêm ngặt khi $x$ tăng. Mặt khác $\\lim\\limits_{x \\to +\\infty} R(x) = \\lim\\limits_{x \\to +\\infty} \\frac{8}{1 + 8/x} = 8\\,\\Omega$. Đồ thị có tiệm cận ngang $R = 8$ và nằm hoàn toàn phía dưới đường tiệm cận, do đó điện trở tương đương không bao giờ vượt quá $8\\,\\Omega$."
  },
  {
    id: 9,
    title: "Câu 9: Trục đối xứng của đồ thị hàm phân thức hữu tỉ",
    pts: 20,
    question: "Đồ thị hàm số phân thức bậc 1/bậc 1 và bậc 2/bậc 1 có bao nhiêu trục đối xứng?",
    options: [
      { text: "Không có trục đối xứng nào.", correct: false },
      { text: "Đúng $1$ trục đối xứng là tiệm cận đứng.", correct: false },
      { text: "Đúng $2$ trục đối xứng vuông góc nhau (là hai đường phân giác của các góc tạo bởi các đường tiệm cận).", correct: true },
      { text: "Vô số trục đối xứng.", correct: false }
    ],
    explanation: "Theo tính chất hình học SGK Toán 12: Đồ thị hàm phân thức nhận hai đường phân giác của các góc tạo bởi hai đường tiệm cận làm hai trục đối xứng vuông góc với nhau."
  },
  {
    id: 10,
    title: "Câu 10: Nhận dạng đồ thị qua hệ số $a$ và điểm cắt trục tung",
    pts: 20,
    question: "Đồ thị hàm số bậc ba $y = ax^3 + bx^2 + cx + d$ có nhánh ngoài cùng bên phải đi lên và cắt trục tung tại điểm có tung độ dương. Dấu của các hệ số $a$ và $d$ là:",
    options: [
      { text: "$a > 0$ và $d > 0$", correct: true },
      { text: "$a < 0$ và $d > 0$", correct: false },
      { text: "$a > 0$ và $d < 0$", correct: false },
      { text: "$a < 0$ và $d < 0$", correct: false }
    ],
    explanation: "Khi $x \\to +\\infty$, đồ thị đi lên nghĩa là $\\lim\\limits_{x \\to +\\infty} y = +\\infty \\Rightarrow a > 0$. Giao điểm với trục tung $Oy$ đạt tại $x = 0 \\Rightarrow y(0) = d$. Vì điểm cắt nằm phía trên gốc tọa độ nên $d > 0$."
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
        lesson: 'toan12_bai4',
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

// --- 5. LOGIC PHÒNG THÍ NGHIỆM LAB 1 (STUDIO ĐỒ THỊ BẬC BA) ---
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderX = document.getElementById('lab1SliderX');
  const valX = document.getElementById('lab1ValX');
  const dispX = document.getElementById('lab1DispX');
  const dispY = document.getElementById('lab1DispY');
  const valSlope = document.getElementById('lab1ValSlope');
  const valD2 = document.getElementById('lab1ValD2');
  const statusBox = document.getElementById('lab1StatusBox');

  // y = -x^3 + 3x + 1
  // y' = -3x^2 + 3
  // y'' = -6x
  function f(x) { return -Math.pow(x, 3) + 3 * x + 1; }
  function df(x) { return -3 * x * x + 3; }
  function d2f(x) { return -6 * x; }

  function draw() {
    const x = parseFloat(sliderX.value);
    const y = f(x);
    const slope = df(x);
    const d2 = d2f(x);

    if (valX) valX.textContent = `$${x.toFixed(2)}$`;
    if (dispX) dispX.textContent = `$${x.toFixed(2)}$`;
    if (dispY) dispY.textContent = `$${y.toFixed(2)}$`;
    if (valSlope) valSlope.textContent = `$${slope.toFixed(2)}$`;
    if (valD2) valD2.textContent = `$${d2.toFixed(2)}$`;

    if (statusBox) {
      if (Math.abs(x) < 0.08) {
        statusBox.innerHTML = `⭐ <strong>ĐIỂM UỐN & TÂM ĐỐI XỨNG:</strong> Tại $x = 0$, $y'' = 0$. Điểm $I(0; 1)$ là tâm đối xứng của toàn bộ đồ thị!`;
      } else if (Math.abs(x - (-1)) < 0.08) {
        statusBox.innerHTML = `🔷 <strong>ĐIỂM CỰC TIỂU:</strong> Tại $x = -1$, tiếp tuyến nằm ngang ($y' = 0$), giá trị cực tiểu $y = -1$.`;
      } else if (Math.abs(x - 1) < 0.08) {
        statusBox.innerHTML = `🔶 <strong>ĐIỂM CỰC ĐẠI:</strong> Tại $x = 1$, tiếp tuyến nằm ngang ($y' = 0$), giá trị cực đại $y = 3$.`;
      } else {
        statusBox.innerHTML = `Hệ số góc tiếp tuyến hiện tại là $k = ${slope.toFixed(2)}$. Di chuyển $x$ qua các điểm đặc biệt để quan sát tiếp tuyến đổi chiều!`;
      }
      renderMathInTree(statusBox);
    }

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Coordinate mapping: x in [-2.5, 2.5], y in [-4, 6]
    const xMin = -2.5, xMax = 2.5, yMin = -4, yMax = 6;
    function toCanvasX(cx) { return (cx - xMin) / (xMax - xMin) * (W - 80) + 40; }
    function toCanvasY(cy) { return H - 40 - (cy - yMin) / (yMax - yMin) * (H - 80); }

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let gx = -2; gx <= 2; gx += 1) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(gx), 0);
      ctx.lineTo(toCanvasX(gx), H);
      ctx.stroke();
    }
    for (let gy = -3; gy <= 5; gy += 2) {
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

    // Curve
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let px = 0; px <= W; px += 2) {
      const rx = xMin + (px - 40) / (W - 80) * (xMax - xMin);
      const ry = f(rx);
      const cy = toCanvasY(ry);
      if (px === 0) ctx.moveTo(px, cy);
      else ctx.lineTo(px, cy);
    }
    ctx.stroke();

    // Tangent line at current x
    const tangLen = 1.2;
    const x1 = x - tangLen;
    const y1 = y - slope * tangLen;
    const x2 = x + tangLen;
    const y2 = y + slope * tangLen;

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(toCanvasX(x1), toCanvasY(y1));
    ctx.lineTo(toCanvasX(x2), toCanvasY(y2));
    ctx.stroke();
    ctx.setLineDash([]);

    // Inflection point I(0; 1)
    ctx.fillStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(toCanvasX(0), toCanvasY(1), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Extrema points (-1; -1) and (1; 3)
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(toCanvasX(-1), toCanvasY(-1), 6, 0, Math.PI * 2);
    ctx.arc(toCanvasX(1), toCanvasY(3), 6, 0, Math.PI * 2);
    ctx.fill();

    // Current point M
    ctx.fillStyle = '#f43f5e';
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(toCanvasX(x), toCanvasY(y), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Labels
    ctx.fillStyle = '#f59e0b';
    ctx.font = '11px "Segoe UI", sans-serif';
    ctx.fillText('Điểm uốn I(0; 1)', toCanvasX(0) + 10, toCanvasY(1) - 8);

    ctx.fillStyle = '#10b981';
    ctx.fillText('CT(-1; -1)', toCanvasX(-1) - 50, toCanvasY(-1) + 18);
    ctx.fillText('CĐ(1; 3)', toCanvasX(1) + 8, toCanvasY(3) - 8);

    unlockBadge('cubic_studio');
  }

  sliderX.oninput = () => { sound.playClick(); draw(); };

  const btnMin = document.getElementById('btnLab1Min');
  if (btnMin) btnMin.onclick = () => { sliderX.value = '-1.0'; sound.playClick(); draw(); };

  const btnInf = document.getElementById('btnLab1Inflection');
  if (btnInf) btnInf.onclick = () => { sliderX.value = '0.0'; sound.playClick(); draw(); };

  const btnMax = document.getElementById('btnLab1Max');
  if (btnMax) btnMax.onclick = () => { sliderX.value = '1.0'; sound.playClick(); draw(); };

  draw();
}

// --- 6. LOGIC PHÒNG THÍ NGHIỆM LAB 2 (MÁY BIẾN HÌNH PHÂN THỨC) ---
function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let mode = '11'; // '11' = bậc 1/1, '21' = bậc 2/1

  const btn11 = document.getElementById('btnMode11');
  const btn21 = document.getElementById('btnMode21');
  const sliderX = document.getElementById('lab2SliderX');
  const valX = document.getElementById('lab2ValX');
  const formulaDesc = document.getElementById('lab2FormulaDesc');
  const asymptoteDesc = document.getElementById('lab2AsymptoteDesc');
  const centerDesc = document.getElementById('lab2CenterDesc');

  function draw() {
    const x = parseFloat(sliderX.value);
    if (valX) valX.textContent = `$${x.toFixed(1)}$`;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (mode === '11') {
      // y = (2x + 1) / (x + 1)
      // Asymptotes: x = -1, y = 2. Center: I(-1; 2)
      const xMin = -5, xMax = 4, yMin = -4, yMax = 8;
      function toCanvasX(cx) { return (cx - xMin) / (xMax - xMin) * (W - 80) + 40; }
      function toCanvasY(cy) { return H - 40 - (cy - yMin) / (yMax - yMin) * (H - 80); }

      // Axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(0)); ctx.lineTo(W, toCanvasY(0));
      ctx.moveTo(toCanvasX(0), 0); ctx.lineTo(toCanvasX(0), H);
      ctx.stroke();

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
      // Branch 1: [-5, -1.1]
      ctx.beginPath();
      let started = false;
      for (let cx = xMin; cx <= -1.08; cx += 0.05) {
        const cy = (2 * cx + 1) / (cx + 1);
        const px = toCanvasX(cx), py = toCanvasY(cy);
        if (py >= -100 && py <= H + 100) {
          if (!started) { ctx.moveTo(px, py); started = true; }
          else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Branch 2: [-0.92, 4]
      ctx.beginPath();
      started = false;
      for (let cx = -0.92; cx <= xMax; cx += 0.05) {
        const cy = (2 * cx + 1) / (cx + 1);
        const px = toCanvasX(cx), py = toCanvasY(cy);
        if (py >= -100 && py <= H + 100) {
          if (!started) { ctx.moveTo(px, py); started = true; }
          else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Center I(-1; 2)
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(toCanvasX(-1), toCanvasY(2), 6, 0, Math.PI * 2);
      ctx.fill();

      // Current point M
      if (Math.abs(x - (-1)) > 0.15) {
        const my = (2 * x + 1) / (x + 1);
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(toCanvasX(x), toCanvasY(my), 6, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.fillStyle = '#a855f7';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('Tâm I(-1; 2)', toCanvasX(-1) + 10, toCanvasY(2) - 8);
    } else {
      // y = (x^2 - x + 1) / (x - 1) = x + 1/(x - 1)
      // Asymptotes: x = 1, y = x. Center: I(1; 1)
      const xMin = -4, xMax = 6, yMin = -6, yMax = 8;
      function toCanvasX(cx) { return (cx - xMin) / (xMax - xMin) * (W - 80) + 40; }
      function toCanvasY(cy) { return H - 40 - (cy - yMin) / (yMax - yMin) * (H - 80); }

      // Axes
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(0)); ctx.lineTo(W, toCanvasY(0));
      ctx.moveTo(toCanvasX(0), 0); ctx.lineTo(toCanvasX(0), H);
      ctx.stroke();

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
      ctx.moveTo(toCanvasX(xMin), toCanvasY(xMin));
      ctx.lineTo(toCanvasX(xMax), toCanvasY(xMax));
      ctx.stroke();
      ctx.setLineDash([]);

      // Curve
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2.5;
      // Branch 1: [-4, 0.9]
      ctx.beginPath();
      let started = false;
      for (let cx = xMin; cx <= 0.88; cx += 0.05) {
        const cy = cx + 1 / (cx - 1);
        const px = toCanvasX(cx), py = toCanvasY(cy);
        if (py >= -100 && py <= H + 100) {
          if (!started) { ctx.moveTo(px, py); started = true; }
          else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Branch 2: [1.12, 6]
      ctx.beginPath();
      started = false;
      for (let cx = 1.12; cx <= xMax; cx += 0.05) {
        const cy = cx + 1 / (cx - 1);
        const px = toCanvasX(cx), py = toCanvasY(cy);
        if (py >= -100 && py <= H + 100) {
          if (!started) { ctx.moveTo(px, py); started = true; }
          else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();

      // Extrema: (0; -1) local max, (2; 3) local min
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(toCanvasX(0), toCanvasY(-1), 6, 0, Math.PI * 2);
      ctx.arc(toCanvasX(2), toCanvasY(3), 6, 0, Math.PI * 2);
      ctx.fill();

      // Center I(1; 1)
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(toCanvasX(1), toCanvasY(1), 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#a855f7';
      ctx.font = '11px "Segoe UI", sans-serif';
      ctx.fillText('Tâm I(1; 1)', toCanvasX(1) + 10, toCanvasY(1) - 8);
      ctx.fillStyle = '#10b981';
      ctx.fillText('Cực đại (0; -1)', toCanvasX(0) - 75, toCanvasY(-1) + 18);
      ctx.fillText('Cực tiểu (2; 3)', toCanvasX(2) + 8, toCanvasY(3) - 8);
    }

    unlockBadge('rational_morpher');
  }

  btn11.onclick = () => {
    sound.playClick();
    mode = '11';
    btn11.style.background = 'rgba(99,102,241,0.3)';
    btn11.style.borderColor = '#818cf8';
    btn21.style.background = '';
    btn21.style.borderColor = '';
    if (formulaDesc) formulaDesc.innerHTML = '• Phương trình: $y = \\frac{2x+1}{x+1}$';
    if (asymptoteDesc) asymptoteDesc.innerHTML = '• Tiệm cận: Đứng $x = -1$, Ngang $y = 2$';
    if (centerDesc) centerDesc.innerHTML = '• Tâm đối xứng: $I(-1; 2)$';
    renderMathInTree(document.getElementById('tab-labs'));
    draw();
  };

  btn21.onclick = () => {
    sound.playClick();
    mode = '21';
    btn21.style.background = 'rgba(99,102,241,0.3)';
    btn21.style.borderColor = '#818cf8';
    btn11.style.background = '';
    btn11.style.borderColor = '';
    if (formulaDesc) formulaDesc.innerHTML = '• Phương trình: $y = \\frac{x^2 - x + 1}{x - 1} = x + \\frac{1}{x - 1}$';
    if (asymptoteDesc) asymptoteDesc.innerHTML = '• Tiệm cận: Đứng $x = 1$, Xiên $y = x$';
    if (centerDesc) centerDesc.innerHTML = '• Tâm đối xứng: $I(1; 1)$ (Cực đại $(0; -1)$, Cực tiểu $(2; 3)$)';
    renderMathInTree(document.getElementById('tab-labs'));
    draw();
  };

  sliderX.oninput = () => { sound.playClick(); draw(); };

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
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập của Bài 4 không?')) {
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
