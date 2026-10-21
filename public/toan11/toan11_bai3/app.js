// ================================================================
// BÀI 3: HÀM SỐ LƯỢNG GIÁC - TOÁN 11 KNTT
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
  ["\\varphi", "<mi>&#966;</mi>"],
  ["\\omega", "<mi>&#969;</mi>"],
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

  s = s.replace(/([a-zA-Z0-9\)])_\{([^{}]+)\}/g, (m, b, c) => savePlaceholder('<msub><mrow><mi>' + b + '</mi></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msub>'));
  s = s.replace(/([a-zA-Z0-9\)])_([0-9a-zA-Z])/g, (m, b, c) => savePlaceholder('<msub><mrow><mi>' + b + '</mi></mrow><mrow>' + (isNaN(c) ? '<mi>' + c + '</mi>' : '<mn>' + c + '</mn>') + '</mrow></msub>'));
  s = s.replace(/_\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msub><mrow></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msub>'));
  s = s.replace(/_([0-9a-zA-Z])/g, (m, c) => savePlaceholder('<msub><mrow></mrow><mrow>' + (isNaN(c) ? '<mi>' + c + '</mi>' : '<mn>' + c + '</mn>') + '</mrow></msub>'));
  s = s.replace(/([a-zA-Z0-9\)])\^\{([^{}]+)\}/g, (m, b, c) => savePlaceholder('<msup><mrow><mi>' + b + '</mi></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msup>'));
  s = s.replace(/([a-zA-Z0-9\)])\^([0-9a-zA-Z])/g, (m, b, c) => savePlaceholder('<msup><mrow><mi>' + b + '</mi></mrow><mrow>' + (isNaN(c) ? '<mi>' + c + '</mi>' : '<mn>' + c + '</mn>') + '</mrow></msup>'));
  s = s.replace(/\^\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msup><mrow></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msup>'));
  s = s.replace(/\^([0-9a-zA-Z])/g, (m, c) => savePlaceholder('<msup><mrow></mrow><mrow>' + (isNaN(c) ? '<mi>' + c + '</mi>' : '<mn>' + c + '</mn>') + '</mrow></msup>'));

  s = s.replace(/\\(sin|cos|tan|cot|lim|max|min|log|ln|exp)/g, (m, fn) => savePlaceholder('<mi class="m-fn">' + fn + '</mi>'));

  let tokenized = '';
  let lastIdx = 0;
  const phRegex = /\uE000(\d+)\uE001/g;
  let match;
  while ((match = phRegex.exec(s)) !== null) {
    const rawChunk = s.substring(lastIdx, match.index);
    tokenized += tokenizePlainMath(rawChunk);
    tokenized += match[0];
    lastIdx = match.index + match[0].length;
  }
  tokenized += tokenizePlainMath(s.substring(lastIdx));

  let res = tokenized;
  for (let idx = 0; idx < placeholders.length; idx++) {
    res = res.split('\uE000' + idx + '\uE001').join(placeholders[idx]);
  }
  return res;
}

function latexToMathML(latex, display = false) {
  const inner = convertLatexToMathMLBody(latex);
  const dispAttr = display ? ' display="block"' : '';
  const cls = display ? ' class="math-block"' : ' class="math-inline"';
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${dispAttr}${cls}>${inner}</math>`;
}

function formatMathText(str) {
  if (!str) return '';
  return str
    .replace(/\$\$([\s\S]+?)\$\$/g, (m, eq) => latexToMathML(eq, true))
    .replace(/\$([^\$\n]+?)\$/g, (m, eq) => latexToMathML(eq, false));
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
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {
      console.warn('KaTeX render warning, using MathML fallback:', e);
    }
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const nodesToReplace = [];
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeValue && n.nodeValue.includes('$')) {
      if (n.parentElement && !['SCRIPT', 'STYLE', 'TEXTAREA'].includes(n.parentElement.tagName)) {
        nodesToReplace.push(n);
      }
    }
  }

  for (const node of nodesToReplace) {
    const span = document.createElement('span');
    span.innerHTML = formatMathText(node.nodeValue);
    node.parentNode.replaceChild(span, node);
  }
}

// Hàm render công thức toán học chuyên dụng trực tiếp vào 1 phần tử (Ưu tiên KaTeX)
function renderMath(target, latex, isBlock = false) {
  if (!target) return;
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return;

  let s = (latex || '').trim();
  if (s.startsWith('$$') && s.endsWith('$$')) {
    s = s.slice(2, -2).trim();
    isBlock = true;
  } else if (s.startsWith('$') && s.endsWith('$')) {
    s = s.slice(1, -1).trim();
  }

  // 1. Ưu tiên hàng đầu: KaTeX offline
  if (typeof katex !== 'undefined' && typeof katex.render === 'function') {
    try {
      katex.render(s, el, {
        displayMode: isBlock,
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {
      console.warn('KaTeX render error:', e);
    }
  }

  // 2. Dự phòng: MathML
  el.innerHTML = latexToMathML(s, isBlock);
}

function renderMixedText(target, textWithMath) {
  if (!target) return;
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return;

  el.innerHTML = textWithMath;
  renderMathInTree(el);
}

// --- 1. WEB AUDIO API SYNTHESIZER ---
class SoundManager {
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

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.06, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
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
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.07);
      gain.gain.setValueAtTime(0.12, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.25);
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
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.28);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.28);
  }

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [
      { f: 523.25, d: 0.15 },
      { f: 659.25, d: 0.15 },
      { f: 783.99, d: 0.15 },
      { f: 1046.50, d: 0.45 }
    ];
    let offset = 0;
    notes.forEach(n => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(n.f, now + offset);
      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + n.d);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + n.d);
      offset += n.d * 0.85;
    });
  }
}

const sound = new SoundManager();

// --- 2. TRẠNG THÁI ỨNG DỤNG (APP STATE) ---
const STORAGE_KEY = 'toan11_bai3_state';

const defaultState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Đồ Thị Hàm Sóng',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

let appState = { ...defaultState };

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      appState = { ...defaultState, ...parsed };
    }
  } catch (e) {
    console.warn('Cannot load state:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn('Cannot save state:', e);
  }
}

function updateHUD() {
  const avatarBtn = document.getElementById('avatarBtn');
  const userDisp = document.getElementById('userNameDisplay');
  const titleDisp = document.getElementById('userTitle');
  const xpDisp = document.getElementById('xpDisplay');
  const streakDisp = document.getElementById('streakDisplay');
  const starRating = document.getElementById('starRating');
  const certName = document.getElementById('certStudentName');

  if (avatarBtn) avatarBtn.textContent = appState.avatar;
  if (userDisp) userDisp.textContent = `${appState.userName} 🌟`;
  if (titleDisp) titleDisp.textContent = appState.userTitle;
  if (xpDisp) xpDisp.textContent = appState.xp;
  if (streakDisp) streakDisp.textContent = `🔥 ${appState.streak}`;
  if (certName) certName.textContent = appState.userName;

  let starCount = 2;
  if (appState.xp >= 60) starCount = 3;
  if (appState.xp >= 140) starCount = 4;
  if (appState.xp >= 200) starCount = 5;
  appState.stars = starCount;

  if (starRating) {
    let starsStr = '';
    for (let i = 1; i <= 5; i++) {
      starsStr += i <= starCount ? '⭐' : '☆';
    }
    starRating.textContent = starsStr;
  }

  for (let i = 0; i < 5; i++) {
    const bEl = document.getElementById(`badge-${i + 1}`);
    if (bEl) {
      if (appState.badges[i]) {
        bEl.style.opacity = '1';
        bEl.style.transform = 'scale(1.03)';
        bEl.style.boxShadow = '0 0 15px rgba(99, 102, 241, 0.4)';
      } else {
        bEl.style.opacity = '0.45';
        bEl.style.transform = 'scale(1)';
        bEl.style.boxShadow = 'none';
      }
    }
  }
}

function unlockBadge(idx) {
  if (!appState.badges[idx]) {
    appState.badges[idx] = true;
    saveState();
    updateHUD();
    sound.playCorrect();
  }
}

// --- 3. ĐẤU TRƯỜNG SGK: 10 CÂU HỎI TRẮC NGHIỆM CHUẨN KNTT ---
const quizData = [
  {
    id: 1,
    title: "Câu 1: Tập xác định của hàm số tan",
    pts: 20,
    question: "Tập xác định của hàm số $y = \\tan x$ là:",
    options: [
      { text: "$D = \\mathbb{R} \\setminus \\left\\{\\frac{\\pi}{2} + k\\pi, k \\in \\mathbb{Z}\\right\\}$", correct: true },
      { text: "$D = \\mathbb{R} \\setminus \\{k\\pi, k \\in \\mathbb{Z}\\}$", correct: false },
      { text: "$D = \\mathbb{R}$", correct: false },
      { text: "$D = \\mathbb{R} \\setminus \\left\\{\\frac{\\pi}{2} + k2\\pi, k \\in \\mathbb{Z}\\right\\}$", correct: false }
    ],
    explanation: "Hàm số $y = \\tan x = \\frac{\\sin x}{\\cos x}$ xác định khi và chỉ khi $\\cos x \\ne 0 \\Leftrightarrow x \\ne \\frac{\\pi}{2} + k\\pi$ ($k \\in \\mathbb{Z}$). Do đó $D = \\mathbb{R} \\setminus \\left\\{\\frac{\\pi}{2} + k\\pi, k \\in \\mathbb{Z}\\right\\}$."
  },
  {
    id: 2,
    title: "Câu 2: Tập xác định của hàm phân thức lượng giác",
    pts: 20,
    question: "Tập xác định của hàm số $y = \\frac{1}{\\sin x}$ là:",
    options: [
      { text: "$D = \\mathbb{R} \\setminus \\{k\\pi, k \\in \\mathbb{Z}\\}$", correct: true },
      { text: "$D = \\mathbb{R} \\setminus \\left\\{\\frac{\\pi}{2} + k\\pi, k \\in \\mathbb{Z}\\right\\}$", correct: false },
      { text: "$D = [-1; 1]$", correct: false },
      { text: "$D = \\mathbb{R} \\setminus \\{0\\}$", correct: false }
    ],
    explanation: "Hàm số xác định khi mẫu số khác 0: $\\sin x \\ne 0 \\Leftrightarrow x \\ne k\\pi$ ($k \\in \\mathbb{Z}$). Do đó $D = \\mathbb{R} \\setminus \\{k\\pi, k \\in \\mathbb{Z}\\}$."
  },
  {
    id: 3,
    title: "Câu 3: Tính chẵn lẻ của hàm số",
    pts: 20,
    question: "Trong các khẳng định sau về tính chẵn - lẻ của các hàm số lượng giác, khẳng định nào **ĐÚNG**?",
    options: [
      { text: "$y = \\cos x$ là hàm số chẵn, $y = \\sin x$ là hàm số lẻ", correct: true },
      { text: "$y = \\cos x$ là hàm số lẻ, $y = \\sin x$ là hàm số chẵn", correct: false },
      { text: "Cả hai hàm số $y = \\sin x$ và $y = \\cos x$ đều là hàm số chẵn", correct: false },
      { text: "Hàm số $y = \\tan x$ là hàm số chẵn", correct: false }
    ],
    explanation: "Ta có $\\cos(-x) = \\cos x$ nên $y = \\cos x$ là hàm số chẵn. Lại có $\\sin(-x) = -\\sin x$ nên $y = \\sin x$ là hàm số lẻ."
  },
  {
    id: 4,
    title: "Câu 4: Chu kì tuần hoàn của sin 2x",
    pts: 20,
    question: "Chu kì tuần hoàn của hàm số $y = \\sin 2x$ là:",
    options: [
      { text: "$\\pi$", correct: true },
      { text: "$2\\pi$", correct: false },
      { text: "$\\frac{\\pi}{2}$", correct: false },
      { text: "$4\\pi$", correct: false }
    ],
    explanation: "Hàm số $y = \\sin(\\omega x + \\varphi)$ với $\\omega > 0$ tuần hoàn với chu kì $T = \\frac{2\\pi}{\\omega}$. Với $\\omega = 2$, ta có $T = \\frac{2\\pi}{2} = \\pi$."
  },
  {
    id: 5,
    title: "Câu 5: Chu kì tuần hoàn của hàm tan",
    pts: 20,
    question: "Chu kì tuần hoàn của hàm số $y = \\tan 3x$ là:",
    options: [
      { text: "$\\frac{\\pi}{3}$", correct: true },
      { text: "$\\pi$", correct: false },
      { text: "$\\frac{2\\pi}{3}$", correct: false },
      { text: "$3\\pi$", correct: false }
    ],
    explanation: "Hàm số $y = \\tan(\\omega x + \\varphi)$ với $\\omega > 0$ tuần hoàn với chu kì $T = \\frac{\\pi}{\\omega}$. Với $\\omega = 3$, chu kì là $T = \\frac{\\pi}{3}$."
  },
  {
    id: 6,
    title: "Câu 6: Giá trị lớn nhất và nhỏ nhất",
    pts: 20,
    question: "Giá trị lớn nhất và nhỏ nhất của hàm số $y = 3\\sin\\left(2x - \\frac{\\pi}{4}\\right) + 1$ lần lượt là:",
    options: [
      { text: "$M = 4$ và $m = -2$", correct: true },
      { text: "$M = 3$ và $m = -3$", correct: false },
      { text: "$M = 4$ và $m = 1$", correct: false },
      { text: "$M = 2$ và $m = -2$", correct: false }
    ],
    explanation: "Với mọi $x \\in \\mathbb{R}$, ta luôn có $-1 \\le \\sin\\left(2x - \\frac{\\pi}{4}\\right) \\le 1$.<br>Nhân cả ba vế với 3 rồi cộng 1:<br>$$-3 + 1 \\le y \\le 3 + 1 \\iff -2 \\le y \\le 4$$<br>Do đó giá trị lớn nhất là $\\max\\limits_{\\mathbb{R}} y = 4$ và giá trị nhỏ nhất là $\\min\\limits_{\\mathbb{R}} y = -2$."
  },
  {
    id: 7,
    title: "Câu 7: Khoảng đồng biến của hàm sin",
    pts: 20,
    question: "Hàm số $y = \\sin x$ đồng biến trên khoảng nào dưới đây?",
    options: [
      { text: "$\\left(-\\frac{\\pi}{2}; \\frac{\\pi}{2}\\right)$", correct: true },
      { text: "$(0; \\pi)$", correct: false },
      { text: "$\\left(\\frac{\\pi}{2}; \\frac{3\\pi}{2}\\right)$", correct: false },
      { text: "$\\left(-\\pi; 0\\right)$", correct: false }
    ],
    explanation: "Theo định nghĩa SGK, hàm số $y = \\sin x$ đồng biến trên mỗi khoảng $\\left(-\\frac{\\pi}{2} + k2\\pi; \\frac{\\pi}{2} + k2\\pi\\right)$. Khi $k = 0$, hàm số đồng biến trên khoảng $\\left(-\\frac{\\pi}{2}; \\frac{\\pi}{2}\\right)$."
  },
  {
    id: 8,
    title: "Câu 8: Điểm thuộc đồ thị hàm cos",
    pts: 20,
    question: "Đồ thị của hàm số $y = \\cos x$ đi qua điểm nào trong các điểm sau đây?",
    options: [
      { text: "$P(0; 1)$", correct: true },
      { text: "$Q(0; 0)$", correct: false },
      { text: "$R\\left(\\frac{\\pi}{2}; 1\\right)$", correct: false },
      { text: "$S(\\pi; 1)$", correct: false }
    ],
    explanation: "Thay toạ độ $x = 0$ vào hàm số, ta có $y = \\cos 0 = 1$. Vậy đồ thị đi qua điểm $P(0; 1)$."
  },
  {
    id: 9,
    title: "Câu 9: Tập giá trị của hàm bậc hai theo cos",
    pts: 20,
    question: "Tập giá trị $T$ của hàm số $y = 2\\cos^2 x + 3$ là:",
    options: [
      { text: "$T = [3; 5]$", correct: true },
      { text: "$T = [1; 5]$", correct: false },
      { text: "$T = [3; 4]$", correct: false },
      { text: "$T = [-2; 2]$", correct: false }
    ],
    explanation: "Vì $-1 \\le \\cos x \\le 1$ nên $0 \\le \\cos^2 x \\le 1$.<br>Do đó $2 \\cdot 0 + 3 \\le 2\\cos^2 x + 3 \\le 2 \\cdot 1 + 3 \\iff 3 \\le y \\le 5$. Vậy $T = [3; 5]$."
  },
  {
    id: 10,
    title: "Câu 10: Ứng dụng thực tế - Mô hình thủy triều",
    pts: 20,
    question: "Mực nước tại một vịnh biển trong ngày (tính từ 0 giờ đến 24 giờ) được mô phỏng bởi hàm số $h(t) = 3\\cos\\left(\\frac{\\pi t}{6}\\right) + 5$ (với $h$ tính bằng mét, $t$ tính bằng giờ). Mực nước cao nhất là bao nhiêu mét và đạt lúc mấy giờ?",
    options: [
      { text: "$8\\text{ m}$, đạt lúc $t = 0\\text{ h}$ và $t = 12\\text{ h}$", correct: true },
      { text: "$5\\text{ m}$, đạt lúc $t = 6\\text{ h}$", correct: false },
      { text: "$8\\text{ m}$, chỉ đạt duy nhất lúc $t = 6\\text{ h}$", correct: false },
      { text: "$11\\text{ m}$, đạt lúc $t = 12\\text{ h}$", correct: false }
    ],
    explanation: "Vì $\\cos\\left(\\frac{\\pi t}{6}\\right) \\le 1$ nên $\\max\\limits_{[0; 24]} h(t) = 3(1) + 5 = 8\\text{ m}$.<br>Đạt được khi $\\cos\\left(\\frac{\\pi t}{6}\\right) = 1 \\iff \\frac{\\pi t}{6} = k2\\pi \\iff t = 12k$. Với $t \\in [0; 24]$, ta nhận các giá trị $t = 0\\text{ h}$, $t = 12\\text{ h}$, $t = 24\\text{ h}$."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  const progressEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (!container) return;

  const total = quizData.length;
  const answeredCount = Object.keys(appState.answered).length;
  let correctCount = 0;

  quizData.forEach(q => {
    if (appState.answered[q.id] !== undefined) {
      if (q.options[appState.answered[q.id]].correct) {
        correctCount++;
      }
    }
  });

  if (progressEl) progressEl.textContent = `${answeredCount} / ${total}`;
  if (scoreEl) scoreEl.textContent = `Điểm Arena: ${correctCount * 20} XP`;

  container.innerHTML = quizData.map((q, qIndex) => {
    const isAnswered = appState.answered[q.id] !== undefined;
    const selectedIdx = appState.answered[q.id];

    let optButtons = q.options.map((opt, oIdx) => {
      let optClass = 'quiz-opt-btn';
      let disabled = isAnswered ? 'disabled' : '';

      if (isAnswered) {
        if (opt.correct) {
          optClass += ' correct';
        } else if (selectedIdx === oIdx) {
          optClass += ' wrong';
        }
      }

      return `<button class="${optClass}" ${disabled} onclick="handleAnswer(${q.id}, ${oIdx})">
        <span class="opt-label">${String.fromCharCode(65 + oIdx)}</span>
        <span class="opt-text">${opt.text}</span>
      </button>`;
    }).join('');

    let expBox = '';
    if (isAnswered) {
      const isCorrect = q.options[selectedIdx].correct;
      const statusClass = isCorrect ? 'status-correct' : 'status-wrong';
      const statusText = isCorrect ? '✅ CHÍNH XÁC! +20 XP' : '❌ CHƯA ĐÚNG';

      expBox = `<div class="explanation-box show">
        <div class="exp-status ${statusClass}">${statusText}</div>
        <div class="exp-content">${q.explanation}</div>
      </div>`;
    }

    return `<div class="quiz-card" id="qcard-${q.id}">
      <div class="quiz-card-header">
        <span class="quiz-tag">${q.title}</span>
        <span class="quiz-points">+${q.pts} XP</span>
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options">${optButtons}</div>
      ${expBox}
    </div>`;
  }).join('');

  if (appState.streak >= 3) unlockBadge(2);
  if (appState.xp >= 160) unlockBadge(3);
  if (correctCount === 10) {
    unlockBadge(4);
    sound.playFanfare();
  }

  renderMathInTree(container);
}

function handleAnswer(qid, oidx) {
  if (appState.answered[qid] !== undefined) return;
  const q = quizData.find(item => item.id === qid);
  if (!q) return;

  appState.answered[qid] = oidx;
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

// --- 4. INTERACTIVE LAB 1: MÁY KHẢO SÁT ĐỒ THỊ SÓNG & ĐIỂM ĐỘNG ---
let currentFuncType = 'sin'; // sin, cos, tan, cot, sincos
let paramA = 1.0;
let paramOmega = 1.0;
let paramPhi = 0.0;
let paramB = 0.0;
let paramX0 = 0.0; // Vị trí điểm quét động
let isScanningWave = false;
let scanAnimFrame = null;
let scanDirection = 1;

function drawLab1() {
  const canvas = document.getElementById('lab1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // 1. Lưới toạ độ
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  const stepX = 48; // 48px tương ứng 1 radian (~150.8px per π)
  const stepY = 46; // 46px tương ứng 1 đơn vị biên độ

  for (let x = cx % stepX; x < w; x += stepX) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = cy % stepY; y < h; y += stepY) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Đường biên y = 1 và y = -1 chuẩn SGK
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.25)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(0, cy - stepY); ctx.lineTo(w, cy - stepY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, cy + stepY); ctx.lineTo(w, cy + stepY); ctx.stroke();
  ctx.setLineDash([]);

  // 2. Trục toạ độ Ox, Oy
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  // Ox
  ctx.beginPath(); ctx.moveTo(10, cy); ctx.lineTo(w - 10, cy); ctx.stroke();
  // Oy
  ctx.beginPath(); ctx.moveTo(cx, h - 10); ctx.lineTo(cx, 10); ctx.stroke();

  // Mũi tên Ox, Oy
  ctx.fillStyle = '#64748b';
  ctx.beginPath(); ctx.moveTo(w - 10, cy); ctx.lineTo(w - 20, cy - 5); ctx.lineTo(w - 20, cy + 5); ctx.fill();
  ctx.beginPath(); ctx.moveTo(cx, 10); ctx.lineTo(cx - 5, 20); ctx.lineTo(cx + 5, 20); ctx.fill();

  ctx.fillStyle = '#cbd5e1'; ctx.font = 'bold 12px sans-serif';
  ctx.fillText('x', w - 18, cy - 9);
  ctx.fillText('y', cx + 10, 18);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('O', cx - 14, cy + 15);

  // Vạch dấu mốc radian trên Ox (-2π, -3π/2, -π, -π/2, π/2, π, 3π/2, 2π)
  const marks = [
    { v: -2 * Math.PI, label: '-2π' },
    { v: -1.5 * Math.PI, label: '-3π/2' },
    { v: -Math.PI, label: '-π' },
    { v: -0.5 * Math.PI, label: '-π/2' },
    { v: 0.5 * Math.PI, label: 'π/2' },
    { v: Math.PI, label: 'π' },
    { v: 1.5 * Math.PI, label: '3π/2' },
    { v: 2 * Math.PI, label: '2π' }
  ];

  ctx.font = '11px sans-serif';
  marks.forEach(m => {
    const mx = cx + m.v * stepX;
    if (mx > 20 && mx < w - 20) {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(mx, cy - 4); ctx.lineTo(mx, cy + 4); ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(m.label, mx - (m.label.length * 3), cy + 18);
    }
  });

  // Vạch dấu đơn vị trên Oy (-2, -1, 1, 2)
  [-2, -1, 1, 2].forEach(val => {
    const my = cy - val * stepY;
    if (my > 20 && my < h - 20) {
      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(cx - 4, my); ctx.lineTo(cx + 4, my); ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(val.toString(), cx - 18, my + 4);
    }
  });

  // 3. Tiệm cận đứng cho tan và cot
  if (currentFuncType === 'tan') {
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    for (let k = -3; k <= 3; k++) {
      const asympX = (Math.PI / 2 - paramPhi + k * Math.PI) / paramOmega;
      const px = cx + asympX * stepX;
      if (px > 10 && px < w - 10) {
        ctx.beginPath(); ctx.moveTo(px, 10); ctx.lineTo(px, h - 10); ctx.stroke();
        ctx.fillStyle = '#fda4af';
        ctx.fillText(`x = ${(asympX / Math.PI).toFixed(1)}π`, px - 20, 22);
      }
    }
    ctx.setLineDash([]);
  } else if (currentFuncType === 'cot') {
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([5, 5]);
    for (let k = -3; k <= 3; k++) {
      const asympX = (-paramPhi + k * Math.PI) / paramOmega;
      const px = cx + asympX * stepX;
      if (px > 10 && px < w - 10) {
        ctx.beginPath(); ctx.moveTo(px, 10); ctx.lineTo(px, h - 10); ctx.stroke();
        ctx.fillStyle = '#fda4af';
        ctx.fillText(`x = ${(asympX / Math.PI).toFixed(1)}π`, px - 20, 22);
      }
    }
    ctx.setLineDash([]);
  }

  // 4. Vẽ đồ thị hàm số
  if (currentFuncType === 'sincos') {
    // Chế độ so sánh: vẽ sin x (cyan) và cos x (purple)
    // Vẽ sin(x)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let px = 0; px < w; px += 2) {
      const xv = (px - cx) / stepX;
      const yv = Math.sin(xv);
      const py = cy - yv * stepY;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Vẽ cos(x)
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let px = 0; px < w; px += 2) {
      const xv = (px - cx) / stepX;
      const yv = Math.cos(xv);
      const py = cy - yv * stepY;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Mũi tên tịnh tiến π/2 giữa đỉnh cos(0; 1) và sin(π/2; 1)
    const pCosX = cx;
    const pCosY = cy - 1 * stepY;
    const pSinX = cx + (Math.PI / 2) * stepX;
    const pSinY = cy - 1 * stepY;

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pSinX, pSinY - 14); ctx.lineTo(pCosX, pCosY - 14); ctx.stroke();
    // Mũi tên trỏ sang trái
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.moveTo(pCosX, pCosY - 14); ctx.lineTo(pCosX + 8, pCosY - 18); ctx.lineTo(pCosX + 8, pCosY - 10); ctx.fill();
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Tịnh tiến trái π/2: cos(x) = sin(x + π/2)', pCosX + 16, pCosY - 20);

    // Chú thích góc
    ctx.fillStyle = '#38bdf8'; ctx.fillText('y = sin(x)', w - 85, 35);
    ctx.fillStyle = '#c084fc'; ctx.fillText('y = cos(x)', w - 85, 52);
  } else {
    // Vẽ hàm đơn
    ctx.strokeStyle = currentFuncType === 'sin' ? '#38bdf8' : (currentFuncType === 'cos' ? '#c084fc' : (currentFuncType === 'tan' ? '#10b981' : '#f59e0b'));
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    let started = false;
    for (let px = 0; px < w; px += 2) {
      const xVal = (px - cx) / stepX;
      let yVal = 0;

      if (currentFuncType === 'sin') {
        yVal = paramA * Math.sin(paramOmega * xVal + paramPhi) + paramB;
      } else if (currentFuncType === 'cos') {
        yVal = paramA * Math.cos(paramOmega * xVal + paramPhi) + paramB;
      } else if (currentFuncType === 'tan') {
        const cosVal = Math.cos(paramOmega * xVal + paramPhi);
        if (Math.abs(cosVal) < 0.05) {
          started = false;
          continue;
        }
        yVal = paramA * Math.tan(paramOmega * xVal + paramPhi) + paramB;
      } else if (currentFuncType === 'cot') {
        const sinVal = Math.sin(paramOmega * xVal + paramPhi);
        if (Math.abs(sinVal) < 0.05) {
          started = false;
          continue;
        }
        yVal = paramA * (1 / Math.tan(paramOmega * xVal + paramPhi)) + paramB;
      }

      const py = cy - yVal * stepY;

      if (py < -80 || py > h + 80) {
        started = false;
        continue;
      }

      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  }

  // 5. Tính toán toạ độ và vẽ ĐIỂM QUÉT ĐỘNG M(x0, y0)
  let y0 = 0;
  let isValidPoint = true;

  if (currentFuncType === 'sin' || currentFuncType === 'sincos') {
    y0 = currentFuncType === 'sincos' ? Math.sin(paramX0) : (paramA * Math.sin(paramOmega * paramX0 + paramPhi) + paramB);
  } else if (currentFuncType === 'cos') {
    y0 = paramA * Math.cos(paramOmega * paramX0 + paramPhi) + paramB;
  } else if (currentFuncType === 'tan') {
    const cosV = Math.cos(paramOmega * paramX0 + paramPhi);
    if (Math.abs(cosV) < 0.03) isValidPoint = false;
    else y0 = paramA * Math.tan(paramOmega * paramX0 + paramPhi) + paramB;
  } else if (currentFuncType === 'cot') {
    const sinV = Math.sin(paramOmega * paramX0 + paramPhi);
    if (Math.abs(sinV) < 0.03) isValidPoint = false;
    else y0 = paramA * (1 / Math.tan(paramOmega * paramX0 + paramPhi)) + paramB;
  }

  const pM_X = cx + paramX0 * stepX;
  const pM_Y = cy - y0 * stepY;

  if (isValidPoint && pM_X >= 0 && pM_X <= w && pM_Y >= 0 && pM_Y <= h) {
    // Đường dóng nét đứt xuống Ox và Oy
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    // Xuống Ox
    ctx.beginPath(); ctx.moveTo(pM_X, pM_Y); ctx.lineTo(pM_X, cy); ctx.stroke();
    // Sang Oy
    ctx.beginPath(); ctx.moveTo(pM_X, pM_Y); ctx.lineTo(cx, pM_Y); ctx.stroke();
    ctx.setLineDash([]);

    // Dấu toạ độ trên Ox và Oy
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(pM_X, cy, 3.5, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(cx, pM_Y, 3.5, 0, 2 * Math.PI); ctx.fill();

    // Hào quang điểm M
    const radGrad = ctx.createRadialGradient(pM_X, pM_Y, 2, pM_X, pM_Y, 14);
    radGrad.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
    radGrad.addColorStop(1, 'rgba(245, 158, 11, 0.0)');
    ctx.fillStyle = radGrad;
    ctx.beginPath(); ctx.arc(pM_X, pM_Y, 14, 0, 2 * Math.PI); ctx.fill();

    // Chấm sáng trung tâm
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(pM_X, pM_Y, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nhãn điểm M
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#fef08a';
    ctx.fillText(`M(${paramX0.toFixed(2)}; ${y0.toFixed(2)})`, pM_X + 8, pM_Y - 8);
  }

  // 6. Cập nhật thông số văn bản hiển thị bằng KaTeX sắc nét
  const valX0Disp = document.getElementById('lab1ValX0');
  const coordDisp = document.getElementById('lab1PointCoord');
  const statusDisp = document.getElementById('lab1PointStatus');
  const formulaEl = document.getElementById('lab1FormulaText');
  const periodEl = document.getElementById('lab1PeriodText');
  const maxEl = document.getElementById('lab1MaxText');
  const minEl = document.getElementById('lab1MinText');

  if (valX0Disp) {
    const piVal = (paramX0 / Math.PI).toFixed(2);
    renderMath(valX0Disp, `x_0 = ${piVal}\\pi \\approx ${paramX0.toFixed(2)}`);
  }

  if (coordDisp) {
    if (isValidPoint) {
      renderMath(coordDisp, `M(${paramX0.toFixed(2)}; ${y0.toFixed(2)})`);
    } else {
      renderMath(coordDisp, `M(${paramX0.toFixed(2)}; \\pm\\infty) \\text{ (Không xác định)}`);
    }
  }

  if (statusDisp) {
    if (!isValidPoint) {
      statusDisp.innerHTML = '<span style="color: #f43f5e; font-weight: 700;">⚡ Điểm rơi trên Tiệm Cận Đứng!</span>';
    } else {
      const eps = 0.08;
      if (Math.abs(paramX0) < eps && Math.abs(y0) < eps) {
        statusDisp.innerHTML = '<span style="color: #f59e0b; font-weight: 700;">🟡 Đang ở Gốc toạ độ $O(0; 0)$</span>';
      } else if (currentFuncType === 'sin' || currentFuncType === 'cos' || currentFuncType === 'sincos') {
        const peakVal = currentFuncType === 'sincos' ? 1.0 : (paramB + Math.abs(paramA));
        const troughVal = currentFuncType === 'sincos' ? -1.0 : (paramB - Math.abs(paramA));
        if (Math.abs(y0 - peakVal) < eps) {
          statusDisp.innerHTML = '<span style="color: #10b981; font-weight: 700;">🟢 Đang ở Đỉnh Cực Đại (GTLN)</span>';
        } else if (Math.abs(y0 - troughVal) < eps) {
          statusDisp.innerHTML = '<span style="color: #f43f5e; font-weight: 700;">🔴 Đang ở Đáy Cực Tiểu (GTNN)</span>';
        } else if (Math.abs(y0) < eps) {
          statusDisp.innerHTML = '<span style="color: #38bdf8; font-weight: 600;">🔵 Đang cắt Trục Hoành $Ox$</span>';
        } else {
          const deltaY = (Math.sin(paramX0 + 0.01) - Math.sin(paramX0 - 0.01));
          statusDisp.innerHTML = deltaY > 0 ? '<span style="color: #34d399;">📈 Sóng đang vươn lên (Đồng biến)</span>' : '<span style="color: #fb7185;">📉 Sóng đang hạ xuống (Nghịch biến)</span>';
        }
      } else if (currentFuncType === 'tan') {
        statusDisp.innerHTML = '<span style="color: #34d399;">📈 Đang đồng biến tăng lên $+∞$</span>';
      } else if (currentFuncType === 'cot') {
        statusDisp.innerHTML = '<span style="color: #fbbf24;">📉 Đang nghịch biến giảm xuống $-∞$</span>';
      }
    }
    renderMathInTree(statusDisp);
  }

  let period = (currentFuncType === 'tan' || currentFuncType === 'cot') ? (Math.PI / paramOmega) : (2 * Math.PI / paramOmega);

  if (formulaEl) {
    if (currentFuncType === 'sincos') {
      renderMath(formulaEl, `y_1 = \\sin x \\quad \\text{và} \\quad y_2 = \\cos x = \\sin\\left(x + \\frac{\\pi}{2}\\right)`);
    } else {
      let fn = currentFuncType;
      let aStr = '';
      if (paramA === -1) aStr = '-';
      else if (paramA !== 1) aStr = paramA.toFixed(1);

      let wStr = '';
      if (paramOmega !== 1) wStr = paramOmega.toFixed(1);

      let pStr = '';
      if (paramPhi !== 0) {
        const phiFrac = (paramPhi / Math.PI).toFixed(2);
        pStr = paramPhi > 0 ? ` + ${phiFrac}\\pi` : ` - ${Math.abs(phiFrac)}\\pi`;
      }

      let bStr = '';
      if (paramB !== 0) {
        bStr = paramB > 0 ? ` + ${paramB.toFixed(1)}` : ` - ${Math.abs(paramB).toFixed(1)}`;
      }

      let inner = (wStr || pStr) ? `(${wStr}x${pStr})` : ` x`;
      let latexFormula = `y = ${aStr}\\${fn}${inner}${bStr}`;
      renderMath(formulaEl, latexFormula);
    }
  }

  if (periodEl) {
    if (currentFuncType === 'sincos') {
      renderMath(periodEl, `T = 2\\pi \\approx 6.28`);
    } else {
      const isHalf = (currentFuncType === 'tan' || currentFuncType === 'cot');
      const numPi = isHalf ? `\\pi` : `2\\pi`;
      if (paramOmega === 1) {
        const valStr = isHalf ? `\\approx 3.14` : `\\approx 6.28`;
        renderMath(periodEl, `T = ${numPi} ${valStr}`);
      } else {
        renderMath(periodEl, `T = \\frac{${numPi}}{${paramOmega.toFixed(2)}} \\approx ${period.toFixed(2)}`);
      }
    }
  }

  if (maxEl && minEl) {
    if (currentFuncType === 'sin' || currentFuncType === 'cos' || currentFuncType === 'sincos') {
      const top = currentFuncType === 'sincos' ? 1.0 : (paramB + Math.abs(paramA));
      const bot = currentFuncType === 'sincos' ? -1.0 : (paramB - Math.abs(paramA));
      maxEl.textContent = top.toFixed(2);
      minEl.textContent = bot.toFixed(2);
    } else {
      maxEl.textContent = 'Không có GTLN (+∞)';
      minEl.textContent = 'Không có GTNN (-∞)';
    }
  }

  unlockBadge(0);
}

// --- 5. INTERACTIVE LAB 2: MÔ HÌNH PISTON VÀ SÓNG HÌNH SIN ---
let pistonAngle = 0;
let isPlayingPiston = true;
let pistonAnimFrame = null;
let pistonSpeed = 1.0;
const waveHistory = [];

function drawLab2() {
  const canvas = document.getElementById('lab2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const wheelCx = 130;
  const wheelCy = h / 2;
  const wheelR = 75;

  // 1. Trục toạ độ bánh xe
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(wheelCx - wheelR - 20, wheelCy); ctx.lineTo(wheelCx + wheelR + 20, wheelCy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(wheelCx, wheelCy - wheelR - 20); ctx.lineTo(wheelCx, wheelCy + wheelR + 20); ctx.stroke();

  // Vành bánh xe tròn quay đều
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(wheelCx, wheelCy, wheelR, 0, 2 * Math.PI);
  ctx.stroke();

  // Điểm chốt trên đĩa tròn
  const pinX = wheelCx + wheelR * Math.cos(pistonAngle);
  const pinY = wheelCy - wheelR * Math.sin(pistonAngle);

  // Thanh truyền từ tâm đến chốt (bán kính crank)
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(wheelCx, wheelCy); ctx.lineTo(pinX, pinY); ctx.stroke();

  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(pinX, pinY, 6, 0, 2 * Math.PI); ctx.fill();

  // 2. Thanh piston trượt đứng
  const pistonX = wheelCx + wheelR + 40;
  const pistonY = pinY;

  // Thanh dóng ngang nối từ chốt tròn sang đầu trượt piston
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
  ctx.setLineDash([4, 4]);
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(pinX, pinY); ctx.lineTo(pistonX, pistonY); ctx.stroke();
  ctx.setLineDash([]);

  // Khung rãnh trượt của Piston
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(pistonX, wheelCy - wheelR - 15); ctx.lineTo(pistonX, wheelCy + wheelR + 15); ctx.stroke();

  // Cục Piston trượt
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(pistonX - 10, pistonY - 14, 20, 28);
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(pistonX - 10, pistonY - 14, 20, 28);

  // 3. Đường sóng hình sin do đầu bút vẽ ra (cuộn ngang sang phải)
  const penX = pistonX;
  const penY = pistonY;

  waveHistory.unshift(penY);
  if (waveHistory.length > 360) waveHistory.pop();

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < waveHistory.length; i++) {
    const wx = penX + i;
    const wy = waveHistory[i];
    if (i === 0) ctx.moveTo(wx, wy);
    else ctx.lineTo(wx, wy);
  }
  ctx.stroke();

  // Trục giữa của dải sóng
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(penX, wheelCy); ctx.lineTo(w, wheelCy); ctx.stroke();

  // Cập nhật text toạ độ đứng
  const pYEl = document.getElementById('pistonYVal');
  if (pYEl) {
    pYEl.textContent = `${(wheelR * Math.sin(pistonAngle)).toFixed(1)} px (${Math.sin(pistonAngle).toFixed(3)}R)`;
  }

  if (isPlayingPiston) {
    pistonAngle += 0.035 * pistonSpeed;
    pistonAnimFrame = requestAnimationFrame(drawLab2);
  }
}

function startPiston() {
  if (!isPlayingPiston) {
    isPlayingPiston = true;
    drawLab2();
  }
  unlockBadge(1);
}

function stopPiston() {
  isPlayingPiston = false;
  if (pistonAnimFrame) {
    cancelAnimationFrame(pistonAnimFrame);
    pistonAnimFrame = null;
  }
}

// --- 6. KHỞI TẠO VÀ LẮNG NGHE SỰ KIỆN (DOM READY) ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateHUD();

  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false,
      strict: false
    });
  }

  // Chuyển Tab
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  navTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const target = this.getAttribute('data-tab');
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      this.classList.add('active');
      const targetContent = document.getElementById(`tab-${target}`);
      if (targetContent) targetContent.classList.add('active');

      sound.playClick();

      if (target === 'labs') {
        setTimeout(() => { drawLab1(); if (!isPlayingPiston) drawLab2(); }, 50);
      }
      if (target === 'arena') {
        renderQuiz();
      }
    });
  });

  // Lab 1 controls
  const btnSin = document.getElementById('btnFuncSin');
  const btnCos = document.getElementById('btnFuncCos');
  const btnTan = document.getElementById('btnFuncTan');
  const btnCot = document.getElementById('btnFuncCot');
  const btnSinCos = document.getElementById('btnFuncSinCos');
  const sA = document.getElementById('sliderA');
  const sOmega = document.getElementById('sliderOmega');
  const sPhi = document.getElementById('sliderPhi');
  const sB = document.getElementById('sliderB');
  const sX0 = document.getElementById('sliderX0');
  const btnScan = document.getElementById('btnScanWave');
  const btnResetScan = document.getElementById('btnResetScan');

  const funcBtns = [
    { btn: btnSin, type: 'sin' },
    { btn: btnCos, type: 'cos' },
    { btn: btnTan, type: 'tan' },
    { btn: btnCot, type: 'cot' },
    { btn: btnSinCos, type: 'sincos' }
  ];

  funcBtns.forEach(item => {
    if (item.btn) {
      item.btn.addEventListener('click', () => {
        funcBtns.forEach(b => { if (b.btn) b.btn.classList.remove('active'); });
        item.btn.classList.add('active');
        currentFuncType = item.type;
        drawLab1();
        sound.playClick();
      });
    }
  });

  if (sA) {
    sA.addEventListener('input', function() {
      paramA = parseFloat(this.value);
      const valDisp = document.getElementById('lab1ValA');
      if (valDisp) valDisp.textContent = paramA.toFixed(1);
      drawLab1();
    });
  }

  if (sOmega) {
    sOmega.addEventListener('input', function() {
      paramOmega = parseFloat(this.value);
      const valDisp = document.getElementById('lab1ValOmega');
      if (valDisp) valDisp.textContent = paramOmega.toFixed(2);
      drawLab1();
    });
  }

  if (sPhi) {
    sPhi.addEventListener('input', function() {
      paramPhi = parseFloat(this.value);
      const valDisp = document.getElementById('lab1ValPhi');
      if (valDisp) valDisp.textContent = `${(paramPhi / Math.PI).toFixed(2)}π`;
      drawLab1();
    });
  }

  if (sB) {
    sB.addEventListener('input', function() {
      paramB = parseFloat(this.value);
      const valDisp = document.getElementById('lab1ValB');
      if (valDisp) valDisp.textContent = paramB.toFixed(1);
      drawLab1();
    });
  }

  if (sX0) {
    sX0.addEventListener('input', function() {
      paramX0 = parseFloat(this.value);
      drawLab1();
    });
  }

  function runWaveScan() {
    if (!isScanningWave) return;
    paramX0 += 0.04 * scanDirection;
    if (paramX0 >= 2 * Math.PI) {
      paramX0 = 2 * Math.PI;
      scanDirection = -1;
    } else if (paramX0 <= -2 * Math.PI) {
      paramX0 = -2 * Math.PI;
      scanDirection = 1;
    }
    if (sX0) sX0.value = paramX0.toFixed(2);
    drawLab1();
    scanAnimFrame = requestAnimationFrame(runWaveScan);
  }

  if (btnScan) {
    btnScan.addEventListener('click', () => {
      isScanningWave = !isScanningWave;
      if (isScanningWave) {
        btnScan.textContent = '⏸️ Tạm Dừng Quét';
        btnScan.style.background = 'rgba(244, 63, 94, 0.3)';
        runWaveScan();
      } else {
        btnScan.textContent = '▶️ Quét Tự Động';
        btnScan.style.background = 'rgba(99, 102, 241, 0.25)';
        if (scanAnimFrame) cancelAnimationFrame(scanAnimFrame);
      }
      sound.playClick();
    });
  }

  if (btnResetScan) {
    btnResetScan.addEventListener('click', () => {
      if (isScanningWave) {
        isScanningWave = false;
        if (btnScan) {
          btnScan.textContent = '▶️ Quét Tự Động';
          btnScan.style.background = 'rgba(99, 102, 241, 0.25)';
        }
        if (scanAnimFrame) cancelAnimationFrame(scanAnimFrame);
      }
      paramX0 = 0.0;
      if (sX0) sX0.value = 0.0;
      drawLab1();
      sound.playClick();
    });
  }

  // Lab 2 controls
  const speedSlider = document.getElementById('lab2SpeedSlider');
  const btnPlayPiston = document.getElementById('btnPlayPiston');
  const btnResetPiston = document.getElementById('btnResetPiston');

  if (speedSlider) {
    speedSlider.addEventListener('input', function() {
      pistonSpeed = parseFloat(this.value);
      const valDisp = document.getElementById('lab2SpeedVal');
      if (valDisp) valDisp.textContent = `${pistonSpeed.toFixed(1)}x`;
    });
  }

  if (btnPlayPiston) {
    btnPlayPiston.addEventListener('click', () => {
      if (isPlayingPiston) {
        stopPiston();
        btnPlayPiston.textContent = '▶️ Tiếp Tục';
      } else {
        startPiston();
        btnPlayPiston.textContent = '⏸️ Tạm Dừng';
      }
      sound.playClick();
    });
  }

  if (btnResetPiston) {
    btnResetPiston.addEventListener('click', () => {
      pistonAngle = 0;
      waveHistory.length = 0;
      drawLab2();
      sound.playClick();
    });
  }

  // HUD controls
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', function() {
      appState.sound = !appState.sound;
      sound.enabled = appState.sound;
      this.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      sound.playClick();
      saveState();
    });
  }

  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình học Bài 3?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        saveState();
        updateHUD();
        renderQuiz();
        drawLab1();
        sound.playClick();
      }
    });
  }

  // Avatar Modal
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const closeModalBtn = document.getElementById('btnCloseModal');
  const avatarChoices = document.querySelectorAll('.avatar-choice');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      avatarModal.style.display = 'flex';
      sound.playClick();
    });
  }

  if (closeModalBtn && avatarModal) {
    closeModalBtn.addEventListener('click', () => {
      avatarModal.style.display = 'none';
      sound.playClick();
    });
  }

  avatarChoices.forEach(choice => {
    choice.addEventListener('click', function() {
      const a = this.getAttribute('data-avatar');
      const t = this.getAttribute('data-title');
      appState.avatar = a;
      appState.userTitle = t;
      updateHUD();
      sound.playClick();
      saveState();
      if (avatarModal) avatarModal.style.display = 'none';
    });
  });

  // Nút in giấy chứng nhận
  const btnPrint = document.getElementById('btnPrintCert');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // Khởi động các Lab và Quiz
  drawLab1();
  drawLab2();
  renderQuiz();
});
