// ================================================================
// BÀI 5: DÃY SỐ - TOÁN 11 KNTT
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
const STORAGE_KEY = 'toan11_bai5_state';

const defaultState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nhà Thám Hiểm Dãy Số',
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
    title: "Câu 1: Định nghĩa dãy số vô hạn",
    pts: 20,
    question: "Dãy số vô hạn $(u_n)$ là một hàm số xác định trên tập hợp nào sau đây?",
    options: [
      { text: "Tập hợp số thực $\\mathbb{R}$", correct: false },
      { text: "Tập hợp số nguyên $\\mathbb{Z}$", correct: false },
      { text: "Tập hợp số nguyên dương $\\mathbb{N}^*$", correct: true },
      { text: "Nửa khoảng $[0; +\\infty)$", correct: false }
    ],
    explanation: "Theo định nghĩa trong SGK Toán 11 Kết Nối Tri Thức: Mỗi hàm số $u$ xác định trên tập hợp các số nguyên dương $\\mathbb{N}^* = \\{1, 2, 3, \\dots\\}$ được gọi là một dãy số vô hạn (gọi tắt là dãy số)."
  },
  {
    id: 2,
    title: "Câu 2: Tính các số hạng đầu tiên",
    pts: 20,
    question: "Cho dãy số $(u_n)$ có số hạng tổng quát $u_n = \\frac{n - 1}{2n + 1}$. Bốn số hạng đầu tiên $u_1, u_2, u_3, u_4$ lần lượt là:",
    options: [
      { text: "$0; \\frac{1}{5}; \\frac{2}{7}; \\frac{3}{9}$", correct: true },
      { text: "$1; \\frac{1}{5}; \\frac{2}{7}; \\frac{1}{3}$", correct: false },
      { text: "$0; \\frac{1}{3}; \\frac{2}{5}; \\frac{3}{7}$", correct: false },
      { text: "$0; \\frac{2}{5}; \\frac{3}{7}; \\frac{4}{9}$", correct: false }
    ],
    explanation: "Thay lần lượt $n = 1, 2, 3, 4$ vào công thức $u_n$:\n• $u_1 = \\frac{1-1}{2(1)+1} = 0$\n• $u_2 = \\frac{2-1}{2(2)+1} = \\frac{1}{5}$\n• $u_3 = \\frac{3-1}{2(3)+1} = \\frac{2}{7}$\n• $u_4 = \\frac{4-1}{2(4)+1} = \\frac{3}{9} = \\frac{1}{3}$."
  },
  {
    id: 3,
    title: "Câu 3: Tìm số hạng tổng quát",
    pts: 20,
    question: "Cho dãy số có các số hạng đầu là: $1, 4, 9, 16, 25, \\dots$. Công thức số hạng tổng quát $u_n$ của dãy số là:",
    options: [
      { text: "$u_n = 2n - 1$", correct: false },
      { text: "$u_n = n^2$", correct: true },
      { text: "$u_n = 2^n$", correct: false },
      { text: "$u_n = n(n + 1)$", correct: false }
    ],
    explanation: "Quan sát các số hạng:\n• $u_1 = 1 = 1^2$\n• $u_2 = 4 = 2^2$\n• $u_3 = 9 = 3^2$\n• $u_4 = 16 = 4^2$\nDo đó, công thức số hạng tổng quát là $u_n = n^2$ với mọi $n \\in \\mathbb{N}^*$."
  },
  {
    id: 4,
    title: "Câu 4: Dãy số cho bởi hệ thức truy hồi",
    pts: 20,
    question: "Cho dãy số $(u_n)$ xác định bởi $u_1 = 3$ và $u_n = 2u_{n-1} + 1$ với mọi $n \\ge 2$. Giá trị của số hạng $u_4$ bằng:",
    options: [
      { text: "$15$", correct: false },
      { text: "$31$", correct: true },
      { text: "$23$", correct: false },
      { text: "$63$", correct: false }
    ],
    explanation: "Tính từng bước theo hệ thức truy hồi:\n• $u_1 = 3$\n• $u_2 = 2u_1 + 1 = 2(3) + 1 = 7$\n• $u_3 = 2u_2 + 1 = 2(7) + 1 = 15$\n• $u_4 = 2u_3 + 1 = 2(15) + 1 = 31$."
  },
  {
    id: 5,
    title: "Câu 5: Khảo sát tính tăng của dãy số",
    pts: 20,
    question: "Khảo sát tính tăng, giảm của dãy số $(u_n)$ với $u_n = \\frac{2n - 1}{n + 1}$. Khẳng định nào sau đây là đúng?",
    options: [
      { text: "$(u_n)$ là dãy số tăng", correct: true },
      { text: "$(u_n)$ là dãy số giảm", correct: false },
      { text: "$(u_n)$ là dãy không tăng không giảm", correct: false },
      { text: "$(u_n)$ là dãy số hằng", correct: false }
    ],
    explanation: "Xét hiệu $H = u_{n+1} - u_n$:\n$$H = \\frac{2(n+1) - 1}{(n+1) + 1} - \\frac{2n - 1}{n + 1} = \\frac{2n + 1}{n + 2} - \\frac{2n - 1}{n + 1}$$\nQuy đồng mẫu số:\n$$H = \\frac{(2n+1)(n+1) - (2n-1)(n+2)}{(n+2)(n+1)} = \\frac{(2n^2 + 3n + 1) - (2n^2 + 3n - 2)}{(n+2)(n+1)} = \\frac{3}{(n+2)(n+1)} > 0$$\nVì $H > 0$ với mọi $n \\in \\mathbb{N}^*$, nên dãy số $(u_n)$ là dãy số tăng."
  },
  {
    id: 6,
    title: "Câu 6: Nhận biết dãy số giảm",
    pts: 20,
    question: "Trong các dãy số $(u_n)$ sau, dãy số nào là dãy số giảm?",
    options: [
      { text: "$u_n = 2^n$", correct: false },
      { text: "$u_n = \\frac{1}{3^n}$", correct: true },
      { text: "$u_n = 3n - 2$", correct: false },
      { text: "$u_n = n^2 + n$", correct: false }
    ],
    explanation: "Với $u_n = \\frac{1}{3^n} > 0$, ta xét tỉ số:\n$$T = \\frac{u_{n+1}}{u_n} = \\frac{1}{3^{n+1}} : \\frac{1}{3^n} = \\frac{1}{3} < 1$$\nVì $T < 1$ và các số hạng đều dương nên dãy số $(u_n)$ là dãy số giảm."
  },
  {
    id: 7,
    title: "Câu 7: Dãy số không tăng, không giảm",
    pts: 20,
    question: "Dãy số nào sau đây là dãy số không tăng và cũng không giảm?",
    options: [
      { text: "$u_n = (-1)^n \\cdot n$", correct: true },
      { text: "$u_n = \\frac{n+1}{n}$", correct: false },
      { text: "$u_n = 5 - 2n$", correct: false },
      { text: "$u_n = 3^n$", correct: false }
    ],
    explanation: "Xét $u_n = (-1)^n \\cdot n$: các số hạng đầu là $u_1 = -1, u_2 = 2, u_3 = -3, u_4 = 4, \\dots$\nVì $u_1 < u_2$ nhưng $u_2 > u_3$, dãy đổi dấu luân phiên và giá trị dao động nên dãy không tăng và cũng không giảm."
  },
  {
    id: 8,
    title: "Câu 8: Khảo sát tính bị chặn của dãy số",
    pts: 20,
    question: "Khẳng định nào sau đây về tính bị chặn của dãy số $u_n = \\frac{n}{n + 1}$ là đúng nhất?",
    options: [
      { text: "Dãy số bị chặn dưới nhưng không bị chặn trên", correct: false },
      { text: "Dãy số bị chặn trên nhưng không bị chặn dưới", correct: false },
      { text: "Dãy số bị chặn, thỏa mãn $\\frac{1}{2} \\le u_n < 1, \\forall n \\in \\mathbb{N}^*$", correct: true },
      { text: "Dãy số không bị chặn", correct: false }
    ],
    explanation: "Với mọi $n \\in \\mathbb{N}^*$, ta có $n \\ge 1 \\implies u_n = \\frac{n}{n+1} \\ge \\frac{1}{1+1} = \\frac{1}{2}$ (bị chặn dưới).\nMặt khác, $u_n = \\frac{n}{n+1} = 1 - \\frac{1}{n+1} < 1$ (bị chặn trên bởi $1$).\nVậy dãy số $(u_n)$ bị chặn vì $\\frac{1}{2} \\le u_n < 1, \\forall n \\in \\mathbb{N}^*$."
  },
  {
    id: 9,
    title: "Câu 9: Dãy số bị chặn một phía",
    pts: 20,
    question: "Dãy số nào sau đây bị chặn dưới nhưng không bị chặn trên?",
    options: [
      { text: "$u_n = \\frac{1}{n}$", correct: false },
      { text: "$u_n = 2n^2 + 1$", correct: true },
      { text: "$u_n = -3n + 2$", correct: false },
      { text: "$u_n = \\sin n$", correct: false }
    ],
    explanation: "Với $u_n = 2n^2 + 1$, vì $n \\ge 1$ nên $u_n \\ge 2(1)^2 + 1 = 3$, do đó dãy bị chặn dưới bởi $3$.\nKhi $n$ tăng không giới hạn thì $u_n$ tăng ra $+\\infty$, không có số thực $M$ nào thỏa mãn $u_n \\le M$ với mọi $n \\in \\mathbb{N}^*$, nên dãy không bị chặn trên."
  },
  {
    id: 10,
    title: "Câu 10: Ứng dụng thực tế SGK (Tăng trưởng vi khuẩn)",
    pts: 20,
    question: "Một quần thể vi khuẩn ban đầu có $1$ tế bào. Sau mỗi chu kỳ $20$ phút, mỗi tế bào tự phân đôi thành $2$ tế bào mới. Gọi $u_n$ là số lượng vi khuẩn sau $n$ chu kỳ phân đôi. Sau $2$ giờ (tương ứng với $n = 6$ chu kỳ), số tế bào vi khuẩn là:",
    options: [
      { text: "$32$ tế bào", correct: false },
      { text: "$64$ tế bào", correct: true },
      { text: "$128$ tế bào", correct: false },
      { text: "$256$ tế bào", correct: false }
    ],
    explanation: "Sau 1 chu kỳ ($20$ phút), số tế bào là $u_1 = 2^1 = 2$.\nSau 2 chu kỳ ($40$ phút), số tế bào là $u_2 = 2^2 = 4$.\nSau $n$ chu kỳ, số tế bào vi khuẩn là $u_n = 2^n$.\nThời gian $2$ giờ = $120$ phút = $6$ chu kỳ ($n = 6$).\nVậy sau $2$ giờ có $u_6 = 2^6 = 64$ tế bào vi khuẩn."
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

// --- 4. PHÒNG THÍ NGHIỆM LAB 1: MÁY KHẢO SÁT ĐỒ THỊ DÃY SỐ ---
const seqFunctions = {
  frac1: {
    fn: (n) => n / (n + 1),
    formulaLatex: "$u_n = \\frac{n}{n+1}$",
    monotonic: "Dãy số tăng nghiêm ngặt ($u_{n+1} - u_n = \\frac{1}{(n+2)(n+1)} > 0$)",
    bounded: "Bị chặn: Bị chặn dưới bởi $\\frac{1}{2}$, bị chặn trên bởi $1$ ($\\frac{1}{2} \\le u_n < 1$)",
    yMin: 0,
    yMax: 1.2,
    lowerBound: 0.5,
    upperBound: 1.0
  },
  geom_dec: {
    fn: (n) => Math.pow(0.5, n),
    formulaLatex: "$u_n = \\frac{1}{2^n} = 0.5^n$",
    monotonic: "Dãy số giảm nghiêm ngặt (tỉ số $\\frac{u_{n+1}}{u_n} = 0.5 < 1$)",
    bounded: "Bị chặn: Bị chặn dưới bởi $0$, bị chặn trên bởi $\\frac{1}{2}$ ($0 < u_n \\le 0.5$)",
    yMin: -0.1,
    yMax: 0.6,
    lowerBound: 0.0,
    upperBound: 0.5
  },
  alt_osc: {
    fn: (n) => (Math.pow(-1, n)) / n,
    formulaLatex: "$u_n = \\frac{(-1)^n}{n}$",
    monotonic: "Dãy số đan dấu không tăng và không giảm (dao động quanh $0$)",
    bounded: "Bị chặn: Bị chặn dưới bởi $-1$, bị chặn trên bởi $0.5$ ($-1 \\le u_n \\le 0.5$)",
    yMin: -1.2,
    yMax: 0.8,
    lowerBound: -1.0,
    upperBound: 0.5
  },
  quad: {
    fn: (n) => Math.pow(n - 3, 2) + 1,
    formulaLatex: "$u_n = (n - 3)^2 + 1$",
    monotonic: "Không tăng không giảm trên $\\mathbb{N}^*$ (giảm từ $n=1$ đến $n=3$, tăng khi $n \\ge 3$)",
    bounded: "Bị chặn dưới bởi $1$ ($u_n \\ge 1$), KHÔNG bị chặn trên",
    yMin: 0,
    yMax: 12,
    lowerBound: 1.0,
    upperBound: null
  },
  linear_inc: {
    fn: (n) => 2 * n - 1,
    formulaLatex: "$u_n = 2n - 1$",
    monotonic: "Dãy số tăng nghiêm ngặt (hiệu số $u_{n+1} - u_n = 2 > 0$)",
    bounded: "Bị chặn dưới bởi $1$ ($u_n \\ge 1$), KHÔNG bị chặn trên",
    yMin: 0,
    yMax: 25,
    lowerBound: 1.0,
    upperBound: null
  }
};

function initLab1() {
  const canvas = document.getElementById('seqCanvas');
  const presetSel = document.getElementById('seqPreset');
  const slider = document.getElementById('numPointsSlider');
  const sliderVal = document.getElementById('numPointsVal');
  const formulaText = document.getElementById('lab1FormulaText');
  const monoText = document.getElementById('lab1MonotonicText');
  const boundText = document.getElementById('lab1BoundedText');

  if (!canvas || !presetSel || !slider) return;

  function drawSeq() {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const N = parseInt(slider.value, 10);
    if (sliderVal) sliderVal.textContent = N;

    const presetKey = presetSel.value;
    const model = seqFunctions[presetKey] || seqFunctions.frac1;

    if (formulaText) renderMath(formulaText, model.formulaLatex);
    if (monoText) renderMixedText(monoText, model.monotonic);
    if (boundText) renderMixedText(boundText, model.bounded);

    // Padding
    const padL = 60;
    const padR = 40;
    const padT = 40;
    const padB = 50;

    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    let yMin = model.yMin;
    let yMax = model.yMax;

    // Tọa độ ánh xạ
    function xCoord(n) {
      return padL + ((n - 1) / (N - 1 || 1)) * plotW;
    }
    function yCoord(val) {
      return padT + plotH - ((val - yMin) / (yMax - yMin)) * plotH;
    }

    // Lưới tọa độ
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.lineWidth = 1;

    // Trục y = 0
    const zeroY = yCoord(0);
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.moveTo(padL, zeroY);
    ctx.lineTo(w - padR, zeroY);
    ctx.stroke();

    // Trục x và vạch chia n
    ctx.font = '13px monospace';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';

    for (let n = 1; n <= N; n++) {
      const cx = xCoord(n);
      ctx.beginPath();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
      ctx.moveTo(cx, padT);
      ctx.lineTo(cx, h - padB);
      ctx.stroke();

      ctx.fillText(`n=${n}`, cx, h - padB + 20);
    }

    // Vẽ đường cận chặn dưới (nếu có)
    if (model.lowerBound !== null && model.lowerBound !== undefined) {
      const ly = yCoord(model.lowerBound);
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padL, ly);
      ctx.lineTo(w - padR, ly);
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.textAlign = 'right';
      ctx.fillText(`Chặn dưới m = ${model.lowerBound}`, w - padR - 10, ly - 8);
      ctx.restore();
    }

    // Vẽ đường cận chặn trên (nếu có)
    if (model.upperBound !== null && model.upperBound !== undefined) {
      const uy = yCoord(model.upperBound);
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(padL, uy);
      ctx.lineTo(w - padR, uy);
      ctx.stroke();
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'right';
      ctx.fillText(`Chặn trên M = ${model.upperBound}`, w - padR - 10, uy - 8);
      ctx.restore();
    }

    // Vẽ các điểm (n, u_n)
    const points = [];
    for (let n = 1; n <= N; n++) {
      const val = model.fn(n);
      points.push({ n, val, cx: xCoord(n), cy: yCoord(val) });
    }

    // Nối nét đứt mờ giữa các điểm để thấy rõ xu hướng
    ctx.save();
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    points.forEach((pt, idx) => {
      if (idx === 0) ctx.moveTo(pt.cx, pt.cy);
      else ctx.lineTo(pt.cx, pt.cy);
    });
    ctx.stroke();
    ctx.restore();

    // Vẽ từng điểm rời rạc và giá trị
    points.forEach((pt) => {
      // Đường dóng dọc xuống trục
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.setLineDash([2, 3]);
      ctx.beginPath();
      ctx.moveTo(pt.cx, zeroY);
      ctx.lineTo(pt.cx, pt.cy);
      ctx.stroke();
      ctx.restore();

      // Vòng tròn điểm phát sáng
      ctx.save();
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(pt.cx, pt.cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();
      ctx.restore();

      // Giá trị số cạnh điểm
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px monospace';
      ctx.textAlign = 'center';
      const formattedVal = Math.abs(pt.val) < 0.001 ? '0' : Number(pt.val.toFixed(2));
      ctx.fillText(formattedVal, pt.cx, pt.cy - 12);
    });
  }

  presetSel.onchange = () => {
    sound.playClick();
    drawSeq();
    unlockBadge(1); // Chuyên gia khảo sát
  };
  slider.oninput = () => {
    drawSeq();
  };

  drawSeq();
}

// --- 5. PHÒNG THÍ NGHIỆM LAB 2: CỖ MÁY TRUY HỒI & TĂNG TRƯỞNG LŨY TIẾN ---
function initLab2() {
  const canvas = document.getElementById('recurCanvas');
  const typeSel = document.getElementById('recurType');
  const genSlider = document.getElementById('recGenSlider');
  const genVal = document.getElementById('recGenVal');
  const stepsBox = document.getElementById('recurStepsBox');

  if (!canvas || !typeSel || !genSlider) return;

  function calculateAndDraw() {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const n = parseInt(genSlider.value, 10);
    if (genVal) genVal.textContent = n;

    const type = typeSel.value;
    const series = [];
    let logSteps = [];

    if (type === 'fibonacci') {
      let a = 1, b = 1;
      series.push(1);
      logSteps.push("Thế hệ 1: F_1 = 1");
      if (n >= 2) {
        series.push(1);
        logSteps.push("Thế hệ 2: F_2 = 1");
      }
      for (let i = 3; i <= n; i++) {
        let c = a + b;
        series.push(c);
        logSteps.push(`Thế hệ ${i}: F_${i} = F_${i-1} + F_${i-2} = ${b} + ${a} = ${c}`);
        a = b;
        b = c;
      }
    } else if (type === 'hanoi') {
      let hVal = 1;
      series.push(1);
      logSteps.push("1 đĩa: H_1 = 1 bước chuyển (2^1 - 1)");
      for (let i = 2; i <= n; i++) {
        hVal = 2 * hVal + 1;
        series.push(hVal);
        logSteps.push(`${i} đĩa: H_${i} = 2*H_${i-1} + 1 = 2*${series[i-2]} + 1 = ${hVal} bước (2^${i} - 1)`);
      }
    } else if (type === 'pop_growth') {
      let pVal = 10;
      series.push(10);
      logSteps.push("Chu kỳ 1: P_1 = 10 tế bào");
      for (let i = 2; i <= n; i++) {
        pVal = pVal * 2;
        series.push(pVal);
        logSteps.push(`Chu kỳ ${i}: P_${i} = 2 * P_${i-1} = 2 * ${series[i-2]} = ${pVal} tế bào`);
      }
    } else {
      let uVal = 2;
      series.push(2);
      logSteps.push("Số hạng 1: u_1 = 2");
      for (let i = 2; i <= n; i++) {
        uVal = uVal + 3;
        series.push(uVal);
        logSteps.push(`Số hạng ${i}: u_${i} = u_${i-1} + 3 = ${series[i-2]} + 3 = ${uVal}`);
      }
    }

    if (stepsBox) {
      stepsBox.innerHTML = `<strong>📋 Tiến trình truy hồi từng thế hệ:</strong><br>${logSteps.slice(-5).join('<br>')}`;
    }

    // Vẽ biểu đồ cột trực quan trên Canvas
    const padL = 60;
    const padR = 40;
    const padT = 30;
    const padB = 40;

    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const maxVal = Math.max(...series, 1);
    const colW = Math.min(plotW / series.length - 8, 45);

    // Trục đáy
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padL, h - padB);
    ctx.lineTo(w - padR, h - padB);
    ctx.stroke();

    series.forEach((val, idx) => {
      const stepN = idx + 1;
      const barH = (val / maxVal) * plotH;
      const x = padL + (idx / (series.length || 1)) * plotW + (plotW / series.length - colW) / 2;
      const y = h - padB - barH;

      // Cột gradient phát sáng
      const grad = ctx.createLinearGradient(0, y, 0, h - padB);
      grad.addColorStop(0, '#f59e0b');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0.8)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(x, y, colW, barH, [6, 6, 0, 0]);
      ctx.fill();

      // Viền
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Nhãn giá trị trên cột
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(val > 9999 ? val.toExponential(1) : val, x + colW / 2, y - 8);

      // Nhãn thế hệ
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`n=${stepN}`, x + colW / 2, h - padB + 20);
    });
  }

  typeSel.onchange = () => {
    sound.playClick();
    calculateAndDraw();
    unlockBadge(1);
  };
  genSlider.oninput = () => {
    calculateAndDraw();
  };

  calculateAndDraw();
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
