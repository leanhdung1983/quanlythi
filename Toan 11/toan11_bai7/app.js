// ================================================================
// BÀI 7: CẤP SỐ NHÂN - TOÁN 11 KNTT
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
const STORAGE_KEY = 'toan11_bai7_state';

const defaultState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nhà Chinh Phục Cấp Số Nhân',
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
    title: "Câu 1: Nhận biết cấp số nhân",
    pts: 20,
    question: "Dãy số nào sau đây là một cấp số nhân?",
    options: [
      { text: "$1; 3; 5; 7; 9$", correct: false },
      { text: "$2; 6; 18; 54; 162$", correct: true },
      { text: "$1; 4; 9; 16; 25$", correct: false },
      { text: "$2; 4; 6; 8; 10$", correct: false }
    ],
    explanation: "Trong dãy $2; 6; 18; 54; 162$, tỉ số giữa số hạng sau và số hạng đứng ngay trước nó luôn không đổi:\n$$\\frac{6}{2} = \\frac{18}{6} = \\frac{54}{18} = \\frac{162}{54} = 3$$\nDo đó đây là cấp số nhân có số hạng đầu $u_1 = 2$ và công bội $q = 3$."
  },
  {
    id: 2,
    title: "Câu 2: Xác định $u_1$ và công bội $q$",
    pts: 20,
    question: "Cho cấp số nhân $(u_n)$ có số hạng tổng quát $u_n = 3 \\cdot 2^n$. Số hạng đầu $u_1$ và công bội $q$ của cấp số nhân lần lượt là:",
    options: [
      { text: "$u_1 = 3; q = 2$", correct: false },
      { text: "$u_1 = 6; q = 2$", correct: true },
      { text: "$u_1 = 6; q = 3$", correct: false },
      { text: "$u_1 = 3; q = 6$", correct: false }
    ],
    explanation: "Thay $n = 1$: $u_1 = 3 \\cdot 2^1 = 6$.\nThay $n = 2$: $u_2 = 3 \\cdot 2^2 = 12$.\nCông bội $q = \\frac{u_2}{u_1} = \\frac{12}{6} = 2$."
  },
  {
    id: 3,
    title: "Câu 3: Tính số hạng thứ $n$",
    pts: 20,
    question: "Cho cấp số nhân $(u_n)$ có số hạng đầu $u_1 = 3$ và công bội $q = 2$. Giá trị của số hạng thứ $6$ ($u_6$) bằng:",
    options: [
      { text: "$96$", correct: true },
      { text: "$192$", correct: false },
      { text: "$48$", correct: false },
      { text: "$64$", correct: false }
    ],
    explanation: "Áp dụng công thức số hạng tổng quát $u_n = u_1 \\cdot q^{n-1}$ với $n = 6$:\n$$u_6 = 3 \\cdot 2^{6-1} = 3 \\cdot 2^5 = 3 \\cdot 32 = 96$$."
  },
  {
    id: 4,
    title: "Câu 4: Tìm công bội $q$",
    pts: 20,
    question: "Cho cấp số nhân $(u_n)$ có $u_1 = 2$ và $u_4 = 54$. Công bội $q$ của cấp số nhân bằng:",
    options: [
      { text: "$q = 2$", correct: false },
      { text: "$q = 3$", correct: true },
      { text: "$q = 4$", correct: false },
      { text: "$q = \\pm 3$", correct: false }
    ],
    explanation: "Theo công thức số hạng tổng quát:\n$$u_4 = u_1 \\cdot q^3 \\Leftrightarrow 54 = 2 \\cdot q^3 \\Leftrightarrow q^3 = 27 \\Leftrightarrow q = 3$$."
  },
  {
    id: 5,
    title: "Câu 5: Tính chất trung bình nhân",
    pts: 20,
    question: "Tìm tất cả các giá trị của $x$ để ba số $2, x, 18$ theo thứ tự đó lập thành một cấp số nhân:",
    options: [
      { text: "$x = 6$", correct: false },
      { text: "$x = \\pm 6$", correct: true },
      { text: "$x = -6$", correct: false },
      { text: "$x = 9$", correct: false }
    ],
    explanation: "Ba số $a, b, c$ lập thành một cấp số nhân khi và chỉ khi $b^2 = a \\cdot c$. Do đó:\n$$x^2 = 2 \\cdot 18 = 36 \\Leftrightarrow x = \\pm 6$$\nVới $x = 6$ ta có CSN $2, 6, 18$ ($q = 3$); với $x = -6$ ta có CSN $2, -6, 18$ ($q = -3$)."
  },
  {
    id: 6,
    title: "Câu 6: Tính tổng $n$ số hạng đầu $S_n$",
    pts: 20,
    question: "Cho cấp số nhân $(u_n)$ có số hạng đầu $u_1 = 2$ và công bội $q = 3$. Tổng của $6$ số hạng đầu tiên ($S_6$) bằng:",
    options: [
      { text: "$728$", correct: true },
      { text: "$729$", correct: false },
      { text: "$242$", correct: false },
      { text: "$1458$", correct: false }
    ],
    explanation: "Áp dụng công thức tính tổng $S_n = \\frac{u_1(q^n - 1)}{q - 1}$ với $n = 6$:\n$$S_6 = \\frac{2(3^6 - 1)}{3 - 1} = 3^6 - 1 = 729 - 1 = 728$$."
  },
  {
    id: 7,
    title: "Câu 7: Xác định cấp số nhân từ hai số hạng",
    pts: 20,
    question: "Cho cấp số nhân $(u_n)$ thỏa mãn $u_2 = 6$ và $u_5 = 48$. Số hạng đầu $u_1$ và công bội $q$ của cấp số nhân là:",
    options: [
      { text: "$u_1 = 3; q = 2$", correct: true },
      { text: "$u_1 = 2; q = 3$", correct: false },
      { text: "$u_1 = 3; q = -2$", correct: false },
      { text: "$u_1 = 6; q = 2$", correct: false }
    ],
    explanation: "Ta có tỉ số:\n$$\\frac{u_5}{u_2} = \\frac{u_1 \\cdot q^4}{u_1 \\cdot q} = q^3 = \\frac{48}{6} = 8 \\Rightarrow q = 2$$\nTừ đó suy ra số hạng đầu: $u_1 = \\frac{u_2}{q} = \\frac{6}{2} = 3$."
  },
  {
    id: 8,
    title: "Câu 8: Xác định vị trí số hạng trong dãy",
    pts: 20,
    question: "Cho cấp số nhân $(u_n)$ có $u_1 = 3$ và công bội $q = 2$. Số $384$ là số hạng thứ bao nhiêu của cấp số nhân?",
    options: [
      { text: "Số hạng thứ $7$", correct: false },
      { text: "Số hạng thứ $8$", correct: true },
      { text: "Số hạng thứ $9$", correct: false },
      { text: "Số hạng thứ $6$", correct: false }
    ],
    explanation: "Giải phương trình số hạng tổng quát $u_n = 384$:\n$$3 \\cdot 2^{n-1} = 384 \\Leftrightarrow 2^{n-1} = 128 = 2^7 \\Leftrightarrow n - 1 = 7 \\Leftrightarrow n = 8$$\nVậy số $384$ là số hạng thứ $8$ của cấp số nhân."
  },
  {
    id: 9,
    title: "Câu 9: Tính tổng chuỗi cấp số nhân",
    pts: 20,
    question: "Tính giá trị của tổng $S = 1 + \\frac{1}{2} + \\frac{1}{4} + \\frac{1}{8} + \\dots + \\frac{1}{256}$:",
    options: [
      { text: "$\\frac{511}{256}$", correct: true },
      { text: "$\\frac{255}{128}$", correct: false },
      { text: "$2$", correct: false },
      { text: "$\\frac{1023}{512}$", correct: false }
    ],
    explanation: "Dãy số $1, \\frac{1}{2}, \\frac{1}{4}, \\dots, \\frac{1}{256}$ là cấp số nhân có $u_1 = 1$, công bội $q = \\frac{1}{2}$.\nSố hạng cuối $u_n = 1 \\cdot \\left(\\frac{1}{2}\\right)^{n-1} = \\frac{1}{256} = \\left(\\frac{1}{2}\\right)^8 \\Rightarrow n = 9$.\nTổng $S = \\frac{u_1(1 - q^n)}{1 - q} = \\frac{1 \\cdot [1 - (1/2)^9]}{1 - 1/2} = 2 \\cdot \\left(1 - \\frac{1}{512}\\right) = 2 \\cdot \\frac{511}{512} = \\frac{511}{256}$."
  },
  {
    id: 10,
    title: "Câu 10: Ứng dụng thực tế SGK (Độ dày tờ giấy gấp)",
    pts: 20,
    question: "Một tờ giấy có độ dày ban đầu là $0.1\\text{ mm}$. Giả sử sau mỗi lần gấp đôi, độ dày của tập giấy tăng gấp đôi. Sau $10$ lần gấp liên tiếp, độ dày của khối giấy xấp xỉ bằng:",
    options: [
      { text: "$10.24\\text{ cm}$", correct: true },
      { text: "$1.024\\text{ m}$", correct: false },
      { text: "$5.12\\text{ cm}$", correct: false },
      { text: "$20.48\\text{ cm}$", correct: false }
    ],
    explanation: "Độ dày của khối giấy sau $n$ lần gấp lập thành một cấp số nhân $u_n = u_0 \\cdot 2^n$ với độ dày ban đầu $u_0 = 0.1\\text{ mm}$.\nSau $10$ lần gấp:\n$$u_{10} = 0.1 \\cdot 2^{10} = 0.1 \\cdot 1024 = 102.4\\text{ mm} = 10.24\\text{ cm}$$."
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
      const statusText = isCorrect ? '✅ CHÍNH XÁC! +20 XP' : '❌ CHƯA ĐÚNG';

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

// --- 4. PHÒNG THÍ NGHIỆM LAB 1: MÁY KHẢO SÁT CẤP SỐ NHÂN ---
function initLab1() {
  const canvas = document.getElementById('gpCanvas');
  const u1Input = document.getElementById('gpU1');
  const u1Val = document.getElementById('gpU1Val');
  const qInput = document.getElementById('gpQ');
  const qVal = document.getElementById('gpQVal');
  const nInput = document.getElementById('gpN');
  const nVal = document.getElementById('gpNVal');

  const formulaGp = document.getElementById('lab1GpFormula');
  const currentUn = document.getElementById('lab1GpUn');
  const currentSn = document.getElementById('lab1GpSn');

  if (!canvas || !u1Input || !qInput || !nInput) return;

  function drawGP() {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const u1 = !isNaN(parseFloat(u1Input.value)) ? parseFloat(u1Input.value) : 1;
    const q = !isNaN(parseFloat(qInput.value)) ? parseFloat(qInput.value) : 2;
    const N = !isNaN(parseInt(nInput.value, 10)) ? parseInt(nInput.value, 10) : 6;

    if (u1Val) u1Val.textContent = u1;
    if (qVal) qVal.textContent = q;
    if (nVal) nVal.textContent = N;

    const terms = [];
    let curVal = u1;
    terms.push({ n: 1, val: curVal });
    for (let i = 2; i <= N; i++) {
      curVal = curVal * q;
      terms.push({ n: i, val: curVal });
    }

    const un = terms[N - 1].val;
    let Sn;
    if (q === 1) Sn = N * u1;
    else Sn = (u1 * (1 - Math.pow(q, N))) / (1 - q);

    if (formulaGp) renderMath(formulaGp, `u_n = ${u1} \\cdot (${q})^{n-1}`);
    if (currentUn) renderMath(currentUn, `u_{${N}} = ${Number(un.toFixed(2))}`);
    if (currentSn) renderMath(currentSn, `S_{${N}} = ${Number(Sn.toFixed(2))}`);

    const padL = 60;
    const padR = 40;
    const padT = 40;
    const padB = 50;

    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const allVals = terms.map(t => t.val);
    let minV = Math.min(0, ...allVals);
    let maxV = Math.max(0, ...allVals);
    const span = Math.max(maxV - minV, 2);
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

    // Nối đường cong hàm số mũ qua các điểm
    ctx.save();
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    terms.forEach((t, idx) => {
      if (idx === 0) ctx.moveTo(xCoord(t.n), yCoord(t.val));
      else ctx.lineTo(xCoord(t.n), yCoord(t.val));
    });
    ctx.stroke();
    ctx.restore();

    // Vẽ từng cột và điểm
    const colW = Math.min(plotW / N - 14, 40);

    terms.forEach((t) => {
      const cx = xCoord(t.n);
      const cy = yCoord(t.val);

      const barTop = Math.min(cy, zeroY);
      const barHeight = Math.abs(cy - zeroY);

      const grad = ctx.createLinearGradient(0, barTop, 0, barTop + barHeight);
      grad.addColorStop(0, t.val >= 0 ? '#10b981' : '#f43f5e');
      grad.addColorStop(1, 'rgba(30, 27, 75, 0.4)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(cx - colW / 2, barTop, colW, barHeight, [4, 4, 0, 0]);
      ctx.fill();

      // Viền cột
      ctx.strokeStyle = t.val >= 0 ? '#34d399' : '#fb7185';
      ctx.lineWidth = 1;
      ctx.stroke();

      // Điểm tròn phát sáng
      ctx.save();
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 8;
      ctx.fillStyle = '#34d399';
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
      const dispV = Math.abs(t.val) > 9999 ? t.val.toExponential(1) : Number(t.val.toFixed(2));
      ctx.fillText(dispV, cx, cy < zeroY ? cy - 10 : cy + 18);

      // Nhãn n ở trục dưới
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.fillText(`u_${t.n}`, cx, h - padB + 20);
    });
  }

  u1Input.oninput = () => { drawGP(); unlockBadge(1); };
  qInput.oninput = () => { drawGP(); unlockBadge(1); };
  nInput.oninput = () => { drawGP(); unlockBadge(1); };

  drawGP();
}

// --- 5. PHÒNG THÍ NGHIỆM LAB 2: BÀN CỜ VUA HẠT THÓC SISSA ---
function initLab2() {
  const canvas = document.getElementById('chessCanvas');
  const slider = document.getElementById('chessSquareSlider');
  const sliderVal = document.getElementById('chessSquareVal');
  const statsBox = document.getElementById('chessStatsBox');

  const btn8 = document.getElementById('btnPreset8');
  const btn16 = document.getElementById('btnPreset16');
  const btn32 = document.getElementById('btnPreset32');
  const btn64 = document.getElementById('btnPreset64');

  if (!canvas || !slider) return;

  function formatBigIntScientific(bigIntVal) {
    const s = bigIntVal.toString();
    if (s.length <= 9) return Number(s).toLocaleString('vi-VN');
    const exp = s.length - 1;
    const mantissa = s[0] + '.' + s.substring(1, 4);
    return `${mantissa} \\times 10^{${exp}}`;
  }

  function drawChessBoard() {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const k = !isNaN(parseInt(slider.value, 10)) ? parseInt(slider.value, 10) : 16;
    if (sliderVal) sliderVal.textContent = k;

    // BigInt tính toán số hạt thóc chính xác
    const grainsAtK = 2n ** BigInt(k - 1);
    const totalGrains = (2n ** BigInt(k)) - 1n;

    // Ước tính khối lượng (1 hạt thóc ~ 0.025 gam = 0.000025 kg = 2.5e-8 tấn)
    // 1 tấn ~ 40,000,000 hạt thóc (4e7 hạt)
    const grainsPerTon = 40000000n;
    const tons = totalGrains / grainsPerTon;

    if (statsBox) {
      statsBox.innerHTML = `
        <strong>🌾 Phân tích bài toán bàn cờ vua cổ Ấn Độ:</strong><br>
        • Ô thứ $k = ${k}$: Số hạt thóc là $u_{${k}} = 2^{${k-1}} = \\mathbf{${formatBigIntScientific(grainsAtK)}}$ hạt.<br>
        • Tổng số hạt thóc trên $${k}$ ô đầu: $S_{${k}} = 2^{${k}} - 1 = \\mathbf{${formatBigIntScientific(totalGrains)}}$ hạt.<br>
        • <em>Ước tính khối lượng thực tế:</em> Xấp xỉ <strong>${formatBigIntScientific(tons)} tấn thóc</strong> (nhiều hơn sản lượng lúa gạo toàn thế giới sản xuất trong hàng thế kỷ)!
      `;
      renderMathInTree(statsBox);
    }

    // Vẽ mô phỏng 64 ô cờ vua (8x8)
    const boardSize = Math.min(h - 30, 280);
    const startX = (w - boardSize) / 2;
    const startY = 15;
    const sqSize = boardSize / 8;

    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const sqIndex = row * 8 + col + 1;
        const x = startX + col * sqSize;
        const y = startY + row * sqSize;

        const isDark = (row + col) % 2 === 1;
        const isActive = sqIndex <= k;
        const isCurrent = sqIndex === k;

        if (isCurrent) {
          ctx.fillStyle = '#f59e0b'; // Ô hiện tại màu vàng
        } else if (isActive) {
          ctx.fillStyle = isDark ? '#3b82f6' : '#60a5fa'; // Ô đã phủ
        } else {
          ctx.fillStyle = isDark ? '#1e293b' : '#334155'; // Ô chưa phủ
        }

        ctx.fillRect(x, y, sqSize, sqSize);

        ctx.strokeStyle = '#0f172a';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, sqSize, sqSize);

        // Số thứ tự ô
        ctx.fillStyle = isActive ? '#ffffff' : '#64748b';
        ctx.font = '10px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(sqIndex, x + sqSize / 2, y + sqSize / 2 + 3);
      }
    }
  }

  slider.oninput = () => { drawChessBoard(); unlockBadge(1); };

  if (btn8) btn8.onclick = () => { slider.value = 8; drawChessBoard(); sound.playClick(); };
  if (btn16) btn16.onclick = () => { slider.value = 16; drawChessBoard(); sound.playClick(); };
  if (btn32) btn32.onclick = () => { slider.value = 32; drawChessBoard(); sound.playClick(); };
  if (btn64) btn64.onclick = () => { slider.value = 64; drawChessBoard(); sound.playClick(); };

  drawChessBoard();
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
