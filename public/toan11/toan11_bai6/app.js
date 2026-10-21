// ================================================================
// BÀI 6: CẤP SỐ CỘNG - TOÁN 11 KNTT
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
  ["\\dots", "<mo>&#8230;</mo>"],
  ["\\cdots", "<mo>&#8943;</mo>"],
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
    const escapedK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(escapedK + '(?![a-zA-Z])', 'g');
    if (rx.test(s)) s = s.replace(rx, savePlaceholder(v));
  }

  s = s.replace(/([a-zA-Z0-9\)])_\{([^{}]+)\}/g, (m, b, c) => savePlaceholder('<msub><mrow><mi>' + b + '</mi></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msub>'));
  s = s.replace(/([a-zA-Z0-9\)])_([0-9a-zA-Z])/g, (m, b, c) => savePlaceholder('<msub><mrow><mi>' + b + '</mi></mrow><mrow>' + (isNaN(c) ? '<mi>' + c + '</mi>' : '<mn>' + c + '</mn>') + '</mrow></msub>'));
  s = s.replace(/([a-zA-Z0-9\)])\^\{([^{}]+)\}/g, (m, b, c) => savePlaceholder('<msup><mrow><mi>' + b + '</mi></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msup>'));
  s = s.replace(/([a-zA-Z0-9\)])\^([0-9a-zA-Z])/g, (m, b, c) => savePlaceholder('<msup><mrow><mi>' + b + '</mi></mrow><mrow>' + (isNaN(c) ? '<mi>' + c + '</mi>' : '<mn>' + c + '</mn>') + '</mrow></msup>'));
  s = s.replace(/_\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msub><mrow></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msub>'));
  s = s.replace(/\^\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msup><mrow></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msup>'));
  s = s.replace(/\^([0-9a-zA-Z])/g, (m, c) => savePlaceholder('<msup><mrow></mrow><mrow><mn>' + c + '</mn></mrow></msup>'));

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
const STORAGE_KEY = 'toan11_bai6_state';

const defaultState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Cấp Số Cộng',
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
    title: "Câu 1: Nhận biết cấp số cộng",
    pts: 20,
    question: "Dãy số nào sau đây là một cấp số cộng?",
    options: [
      { text: "$1; 3; 6; 10; 15$", correct: false },
      { text: "$1; -2; 4; -8; 16$", correct: false },
      { text: "$2; 5; 8; 11; 14$", correct: true },
      { text: "$1; 4; 9; 16; 25$", correct: false }
    ],
    explanation: "Trong dãy $2; 5; 8; 11; 14$: hiệu giữa hai số hạng liên tiếp luôn không đổi:\n$$5 - 2 = 8 - 5 = 11 - 8 = 14 - 11 = 3$$\nDo đó đây là cấp số cộng có số hạng đầu $u_1 = 2$ và công sai $d = 3$."
  },
  {
    id: 2,
    title: "Câu 2: Xác định $u_1$ và công sai $d$",
    pts: 20,
    question: "Cho cấp số cộng $(u_n)$ có số hạng tổng quát $u_n = 5 - 2n$. Số hạng đầu $u_1$ và công sai $d$ của cấp số cộng lần lượt là:",
    options: [
      { text: "$u_1 = 5; d = -2$", correct: false },
      { text: "$u_1 = 3; d = -2$", correct: true },
      { text: "$u_1 = 3; d = 2$", correct: false },
      { text: "$u_1 = 5; d = 2$", correct: false }
    ],
    explanation: "Thay $n = 1$: $u_1 = 5 - 2(1) = 3$.\nThay $n = 2$: $u_2 = 5 - 2(2) = 1$.\nCông sai $d = u_2 - u_1 = 1 - 3 = -2$."
  },
  {
    id: 3,
    title: "Câu 3: Tính số hạng thứ $n$",
    pts: 20,
    question: "Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 2$ và công sai $d = 3$. Giá trị của số hạng thứ $10$ ($u_{10}$) bằng:",
    options: [
      { text: "$27$", correct: false },
      { text: "$29$", correct: true },
      { text: "$32$", correct: false },
      { text: "$30$", correct: false }
    ],
    explanation: "Áp dụng công thức số hạng tổng quát $u_n = u_1 + (n - 1)d$:\n$$u_{10} = 2 + (10 - 1) \\cdot 3 = 2 + 9 \\cdot 3 = 2 + 27 = 29$$."
  },
  {
    id: 4,
    title: "Câu 4: Tìm công sai $d$",
    pts: 20,
    question: "Cho cấp số cộng $(u_n)$ có $u_1 = -3$ và $u_6 = 27$. Công sai $d$ của cấp số cộng bằng:",
    options: [
      { text: "$d = 5$", correct: false },
      { text: "$d = 6$", correct: true },
      { text: "$d = 7$", correct: false },
      { text: "$d = 4$", correct: false }
    ],
    explanation: "Theo công thức số hạng tổng quát:\n$$u_6 = u_1 + 5d \\Leftrightarrow 27 = -3 + 5d \\Leftrightarrow 5d = 30 \\Leftrightarrow d = 6$$."
  },
  {
    id: 5,
    title: "Câu 5: Tính chất trung bình cộng",
    pts: 20,
    question: "Tìm giá trị của $x$ để ba số $x, 5, 2x + 1$ theo thứ tự đó lập thành một cấp số cộng:",
    options: [
      { text: "$x = 2$", correct: false },
      { text: "$x = 3$", correct: true },
      { text: "$x = 4$", correct: false },
      { text: "$x = 1$", correct: false }
    ],
    explanation: "Ba số $a, b, c$ lập thành cấp số cộng khi và chỉ khi $a + c = 2b$. Do đó:\n$$x + (2x + 1) = 2 \\cdot 5 \\Leftrightarrow 3x + 1 = 10 \\Leftrightarrow 3x = 9 \\Leftrightarrow x = 3$$."
  },
  {
    id: 6,
    title: "Câu 6: Tính tổng $n$ số hạng đầu $S_n$",
    pts: 20,
    question: "Cho cấp số cộng $(u_n)$ có số hạng đầu $u_1 = 4$ và công sai $d = 3$. Tổng của $20$ số hạng đầu tiên ($S_{20}$) bằng:",
    options: [
      { text: "$620$", correct: false },
      { text: "$650$", correct: true },
      { text: "$710$", correct: false },
      { text: "$590$", correct: false }
    ],
    explanation: "Áp dụng công thức tính tổng $S_n = \\frac{n[2u_1 + (n - 1)d]}{2}$ với $n = 20$:\n$$S_{20} = \\frac{20[2 \\cdot 4 + (20 - 1) \\cdot 3]}{2} = 10 \\cdot [8 + 57] = 10 \\cdot 65 = 650$$."
  },
  {
    id: 7,
    title: "Câu 7: Xác định cấp số cộng từ hai số hạng",
    pts: 20,
    question: "Một cấp số cộng $(u_n)$ thỏa mãn $u_3 = 8$ và $u_7 = 20$. Số hạng đầu $u_1$ và công sai $d$ của cấp số cộng là:",
    options: [
      { text: "$u_1 = 2; d = 3$", correct: true },
      { text: "$u_1 = 1; d = 3$", correct: false },
      { text: "$u_1 = 2; d = 4$", correct: false },
      { text: "$u_1 = 3; d = 2$", correct: false }
    ],
    explanation: "Biểu diễn $u_3$ và $u_7$ theo $u_1$ và $d$:\n$$\\begin{cases} u_1 + 2d = 8 \\\\ u_1 + 6d = 20 \\end{cases}$$\nLấy phương trình dưới trừ phương trình trên: $4d = 12 \\Rightarrow d = 3$.\nThay vào: $u_1 = 8 - 2(3) = 2$."
  },
  {
    id: 8,
    title: "Câu 8: Xác định vị trí số hạng trong dãy",
    pts: 20,
    question: "Cho cấp số cộng $(u_n)$ có $u_1 = 1$ và công sai $d = 4$. Số $81$ là số hạng thứ bao nhiêu của cấp số cộng?",
    options: [
      { text: "Số hạng thứ $20$", correct: false },
      { text: "Số hạng thứ $21$", correct: true },
      { text: "Số hạng thứ $22$", correct: false },
      { text: "Số hạng thứ $19$", correct: false }
    ],
    explanation: "Giải phương trình số hạng tổng quát $u_n = 81$:\n$$1 + (n - 1) \\cdot 4 = 81 \\Leftrightarrow 4(n - 1) = 80 \\Leftrightarrow n - 1 = 20 \\Leftrightarrow n = 21$$\nVậy số $81$ là số hạng thứ $21$ của dãy số."
  },
  {
    id: 9,
    title: "Câu 9: Tính tổng chuỗi cấp số cộng",
    pts: 20,
    question: "Tính giá trị của tổng $S = 1 + 5 + 9 + 13 + \\dots + 97$:",
    options: [
      { text: "$1225$", correct: true },
      { text: "$1250$", correct: false },
      { text: "$1176$", correct: false },
      { text: "$1300$", correct: false }
    ],
    explanation: "Dãy số $1, 5, 9, \\dots, 97$ là cấp số cộng có $u_1 = 1, d = 4$.\nTìm số số hạng $n$: $1 + (n - 1) \\cdot 4 = 97 \\Leftrightarrow 4(n - 1) = 96 \\Leftrightarrow n = 25$.\nTổng $S = \\frac{n(u_1 + u_n)}{2} = \\frac{25(1 + 97)}{2} = \\frac{25 \\cdot 98}{2} = 25 \\cdot 49 = 1225$."
  },
  {
    id: 10,
    title: "Câu 10: Ứng dụng thực tế SGK (Ghế rạp hát)",
    pts: 20,
    question: "Một rạp hát có $20$ hàng ghế. Hàng đầu tiên có $15$ ghế, mỗi hàng tiếp theo nhiều hơn hàng ngay trước nó $2$ ghế. Tổng số ghế của toàn bộ rạp hát là:",
    options: [
      { text: "$640$ ghế", correct: false },
      { text: "$680$ ghế", correct: true },
      { text: "$700$ ghế", correct: false },
      { text: "$720$ ghế", correct: false }
    ],
    explanation: "Số ghế của các hàng lập thành một cấp số cộng với số hạng đầu $u_1 = 15$, công sai $d = 2$, và số hàng ghế $n = 20$.\nTổng số ghế trong rạp hát là:\n$$S_{20} = \\frac{20[2 \\cdot 15 + (20 - 1) \\cdot 2]}{2} = 10 \\cdot (30 + 38) = 10 \\cdot 68 = 680 \\text{ ghế}$$."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;

  const progressEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  const total = quizData.length;
  const answeredCount = Object.keys(appState.answered).length;
  let correctCount = 0;

  quizData.forEach(q => {
    if (appState.answered[q.id] !== undefined) {
      if (q.options[appState.answered[q.id]] && q.options[appState.answered[q.id]].correct) {
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
      const isCorrect = q.options[selectedIdx] && q.options[selectedIdx].correct;
      const statusClass = isCorrect ? 'status-correct' : 'status-wrong';
      const statusText = isCorrect ? '✅ CHÍNH XAC! +20 XP' : '❌ CHƯA ĐÚNG';

      expBox = `<div class="explanation-box show">
        <div class="exp-status ${statusClass}">${statusText}</div>
        <div class="exp-content">${q.explanation.replace(/\n/g, '<br>')}</div>
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
  if (correctCount * 20 >= 160) unlockBadge(3);
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
  const isCorrect = q.options[oidx] && q.options[oidx].correct;

  if (isCorrect) {
    sound.playCorrect();
    appState.xp += q.pts;
    appState.streak += 1;
  } else {
    sound.playWrong();
    appState.streak = 0;
  }

  saveState();
  updateHUD();
  renderQuiz();
}
window.handleAnswer = handleAnswer;

// --- 4. PHÒNG THÍ NGHIỆM LAB 1: BẬC THANG CẤP SỐ CỘNG & ĐỒ THỊ ---
function initLab1() {
  const canvas = document.getElementById('apCanvas');
  const u1Slider = document.getElementById('u1Slider');
  const u1Val = document.getElementById('u1Val');
  const dSlider = document.getElementById('dSlider');
  const dVal = document.getElementById('dVal');
  const nSlider = document.getElementById('nSlider');
  const nVal = document.getElementById('nVal');

  const formulaAp = document.getElementById('lab1FormulaAp');
  const currentUn = document.getElementById('lab1CurrentUn');
  const currentSn = document.getElementById('lab1CurrentSn');

  if (!canvas || !u1Slider || !dSlider || !nSlider) return;

  function drawAP() {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const u1 = !isNaN(parseFloat(u1Slider.value)) ? parseFloat(u1Slider.value) : 2;
    const d = !isNaN(parseFloat(dSlider.value)) ? parseFloat(dSlider.value) : 3;
    const N = !isNaN(parseInt(nSlider.value, 10)) ? parseInt(nSlider.value, 10) : 8;

    if (u1Val) u1Val.textContent = u1;
    if (dVal) dVal.textContent = d;
    if (nVal) nVal.textContent = N;

    const terms = [];
    for (let i = 1; i <= N; i++) {
      terms.push({ n: i, val: u1 + (i - 1) * d });
    }

    const un = terms[N - 1].val;
    const Sn = (N * (u1 + un)) / 2;

    const constTerm = u1 - d;
    const constSign = constTerm >= 0 ? `+ ${constTerm}` : `- ${Math.abs(constTerm)}`;
    if (formulaAp) renderMath(formulaAp, `u_n = ${u1} + (n - 1) \\cdot ${d} = ${d}n ${constSign}`);
    if (currentUn) renderMath(currentUn, `u_{${N}} = ${un}`);
    if (currentSn) renderMath(currentSn, `S_{${N}} = ${Sn}`);

    const padL = 60;
    const padR = 40;
    const padT = 40;
    const padB = 50;

    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const allVals = terms.map(t => t.val);
    let minV = Math.min(0, ...allVals);
    let maxV = Math.max(0, ...allVals);
    const span = Math.max(maxV - minV, 5);
    minV -= span * 0.1;
    maxV += span * 0.15;

    function xCoord(n) {
      return padL + ((n - 1) / (N - 1 || 1)) * plotW;
    }
    function yCoord(v) {
      return padT + plotH - ((v - minV) / (maxV - minV)) * plotH;
    }

    // Trục y = 0
    const zeroY = yCoord(0);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.moveTo(padL, zeroY);
    ctx.lineTo(w - padR, zeroY);
    ctx.stroke();

    // Vẽ đường thẳng tuyến tính y = d*x + (u1 - d)
    ctx.save();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([6, 6]);
    ctx.beginPath();
    ctx.moveTo(xCoord(1), yCoord(terms[0].val));
    ctx.lineTo(xCoord(N), yCoord(terms[N - 1].val));
    ctx.stroke();
    ctx.restore();

    // Vẽ từng cột bậc thang và điểm
    const colW = Math.min(plotW / N - 14, 40);

    terms.forEach((t) => {
      const cx = xCoord(t.n);
      const cy = yCoord(t.val);

      // Cột bậc thang từ trục 0 đến điểm
      const barTop = Math.min(cy, zeroY);
      const barHeight = Math.abs(cy - zeroY);

      const grad = ctx.createLinearGradient(0, barTop, 0, barTop + barHeight);
      grad.addColorStop(0, t.val >= 0 ? 'rgba(6, 182, 212, 0.6)' : 'rgba(239, 68, 68, 0.6)');
      grad.addColorStop(1, 'rgba(30, 27, 75, 0.4)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(cx - colW / 2, barTop, colW, barHeight, [4, 4, 0, 0]);
      ctx.fill();

      // Viền cột
      ctx.strokeStyle = t.val >= 0 ? '#38bdf8' : '#f87171';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Điểm tròn phát sáng
      ctx.save();
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();

      // Giá trị u_n trên điểm
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(t.val, cx, cy < zeroY ? cy - 10 : cy + 18);

      // Nhãn n ở trục dưới
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText(`u_${t.n}`, cx, h - padB + 20);
    });

    // Vẽ chỉ số công sai d giữa 2 cột đầu
    if (N >= 2) {
      const x1 = xCoord(1);
      const x2 = xCoord(2);
      const y1 = yCoord(terms[0].val);
      const y2 = yCoord(terms[1].val);

      ctx.save();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x2, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      ctx.fillStyle = '#f59e0b';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'left';
      ctx.fillText(`d=${d}`, x2 + 6, (y1 + y2) / 2);
      ctx.restore();
    }
  }

  u1Slider.oninput = () => { drawAP(); unlockBadge(1); };
  dSlider.oninput = () => { drawAP(); unlockBadge(1); };
  nSlider.oninput = () => { drawAP(); unlockBadge(1); };

  drawAP();
}

// --- 5. PHÒNG THÍ NGHIỆM LAB 2: MÁY XẾP GẠCH GAUSS & RẠP HÁT ---
function initLab2() {
  const canvas = document.getElementById('theatreCanvas');
  const u1Input = document.getElementById('theatreU1');
  const u1Val = document.getElementById('theatreU1Val');
  const dInput = document.getElementById('theatreD');
  const dVal = document.getElementById('theatreDVal');
  const rowsInput = document.getElementById('theatreRows');
  const rowsVal = document.getElementById('theatreRowsVal');
  const explainBox = document.getElementById('gaussExplainBox');

  if (!canvas || !u1Input || !dInput || !rowsInput) return;

  function drawTheatre() {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const u1 = parseInt(u1Input.value, 10);
    const d = parseInt(dInput.value, 10);
    const rows = parseInt(rowsInput.value, 10);

    if (u1Val) u1Val.textContent = u1;
    if (dVal) dVal.textContent = d;
    if (rowsVal) rowsVal.textContent = rows;

    const rowCounts = [];
    for (let r = 1; r <= rows; r++) {
      rowCounts.push(u1 + (r - 1) * d);
    }

    const un = rowCounts[rows - 1];
    const totalSeats = (rows * (u1 + un)) / 2;

    if (explainBox) {
      explainBox.innerHTML = `
        <strong>💡 Phân tích phương pháp ghép cặp Gauss:</strong><br>
        • Hàng $1$ có $u_1 = ${u1}$ ghế; Hàng cuối ($n = ${rows}$) có $u_{${rows}} = ${u1} + (${rows}-1) \\cdot ${d} = ${un}$ ghế.<br>
        • Ghép cặp đối xứng: $u_1 + u_{${rows}} = ${u1} + ${un} = ${u1 + un}$ ghế. Mọi cặp đối xứng đều có tổng đúng bằng <strong>${u1 + un}</strong>.<br>
        • Tổng số ghế toàn rạp: $S_{${rows}} = \\frac{${rows} \\times (${u1} + ${un})}{2} = \\mathbf{${totalSeats}}$ ghế.
      `;
      renderMathInTree(explainBox);
    }

    const padL = 70;
    const padR = 140;
    const padT = 30;
    const padB = 30;

    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const maxSeats = Math.max(...rowCounts, 1);
    const rowH = Math.min(plotH / rows - 4, 26);

    rowCounts.forEach((seats, idx) => {
      const rowNum = idx + 1;
      const y = padT + idx * (plotH / rows);
      const barW = (seats / maxSeats) * plotW;

      // Hàng ghế rạp hát (hình chữ nhật bo tròn dạng dãy ghế)
      const grad = ctx.createLinearGradient(padL, 0, padL + barW, 0);
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, '#06b6d4');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(padL, y, barW, rowH, 4);
      ctx.fill();

      // Viền
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Nhãn hàng ghế
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'right';
      ctx.fillText(`Hàng ${rowNum}`, padL - 10, y + rowH / 2 + 4);

      // Số ghế của hàng
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'left';
      ctx.fillText(`${seats} ghế`, padL + barW + 10, y + rowH / 2 + 4);
    });

    // Vẽ đường bao hình thang minh họa mặt cắt khán đài
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, padT);
    ctx.lineTo(padL + (rowCounts[0] / maxSeats) * plotW, padT);
    ctx.lineTo(padL + (rowCounts[rows - 1] / maxSeats) * plotW, padT + (rows - 1) * (plotH / rows) + rowH);
    ctx.lineTo(padL, padT + (rows - 1) * (plotH / rows) + rowH);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  u1Input.oninput = () => { drawTheatre(); unlockBadge(1); };
  dInput.oninput = () => { drawTheatre(); unlockBadge(1); };
  rowsInput.oninput = () => { drawTheatre(); unlockBadge(1); };

  drawTheatre();
}

// --- 6. SETUP TABS, MODALS & EVENT HANDLERS ---
function setupTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sound.playClick();
      const target = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const activeContent = document.getElementById(`tab-${target}`);
      if (activeContent) {
        activeContent.classList.add('active');
        if (target === 'arena') {
          renderQuiz();
        } else {
          renderMathInTree(activeContent);
        }
      }
    });
  });
}

function setupAvatarModal() {
  const avatarBtn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const btnClose = document.getElementById('btnCloseAvatarModal');
  const btnSave = document.getElementById('btnSaveAvatar');
  const nameInput = document.getElementById('inputStudentName');
  const optBtns = document.querySelectorAll('.avatar-opt');

  let chosenAvatar = appState.avatar;

  if (avatarBtn && modal) {
    avatarBtn.onclick = () => {
      sound.playClick();
      modal.style.display = 'flex';
      modal.classList.add('active');
      if (nameInput) nameInput.value = appState.userName;
    };
  }

  if (btnClose && modal) {
    btnClose.onclick = () => {
      sound.playClick();
      modal.style.display = 'none';
      modal.classList.remove('active');
    };
  }

  optBtns.forEach(btn => {
    btn.onclick = () => {
      sound.playClick();
      optBtns.forEach(b => b.style.borderColor = 'transparent');
      btn.style.borderColor = '#818cf8';
      chosenAvatar = btn.getAttribute('data-avatar');
    };
  });

  if (btnSave && modal) {
    btnSave.onclick = () => {
      sound.playCorrect();
      appState.avatar = chosenAvatar;
      if (nameInput && nameInput.value.trim()) {
        appState.userName = nameInput.value.trim();
      }
      saveState();
      updateHUD();
      modal.style.display = 'none';
      modal.classList.remove('active');
    };
  }
}

function setupAudioToggle() {
  const btn = document.getElementById('soundToggle');
  if (!btn) return;
  btn.onclick = () => {
    appState.sound = !appState.sound;
    sound.enabled = appState.sound;
    btn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
    saveState();
    if (appState.sound) sound.playClick();
  };
}

function setupReset() {
  const btn = document.getElementById('resetProgress');
  if (!btn) return;
  btn.onclick = () => {
    if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập của bài này không?')) {
      localStorage.removeItem(STORAGE_KEY);
      appState = { ...defaultState };
      saveState();
      updateHUD();
      renderQuiz();
      sound.playClick();
    }
  };
}

function setupPrintCert() {
  const btn = document.getElementById('btnPrintCert');
  if (!btn) return;
  btn.onclick = () => {
    sound.playClick();
    window.print();
  };
}

// --- 7. KHỞI TẠO TỔNG THỂ KHI TẢI TRANG ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  sound.enabled = appState.sound;

  const sndBtn = document.getElementById('soundToggle');
  if (sndBtn) sndBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';

  updateHUD();

  // KaTeX render ngay lập tức toàn bộ DOM body
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

  setupTabs();
  setupAvatarModal();
  setupAudioToggle();
  setupReset();
  setupPrintCert();

  renderQuiz();
  initLab1();
  initLab2();

  // Mở khóa ngay huy hiệu 1 (Khởi động)
  unlockBadge(0);

  // Render toán học KaTeX / MathML toàn trang
  renderMathInTree(document.body);
});
