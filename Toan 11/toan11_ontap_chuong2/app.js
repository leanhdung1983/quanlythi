// ================================================================
// ÔN TẬP CHƯƠNG II: DÃY SỐ, CẤP SỐ CỘNG & CẤP SỐ NHÂN - TOÁN 11 KNTT
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
const STORAGE_KEY = 'toan11_ontap_chuong2_state';

const defaultState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Sư Phụ Chương II',
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

// --- 3. ĐẤU TRƯỜNG SGK: 10 CÂU HỎI TRẮC NGHIỆM TỔNG HỢP CHƯƠNG II ---
const quizData = [
  {
    id: 1,
    title: "Câu 1: Khảo sát tính tăng và bị chặn",
    pts: 20,
    question: "Cho dãy số $(u_n)$ với $u_n = \\frac{2n}{n + 1}$. Khẳng định nào sau đây là đúng?",
    options: [
      { text: "Dãy số tăng và bị chặn", correct: true },
      { text: "Dãy số giảm và bị chặn", correct: false },
      { text: "Dãy số tăng và không bị chặn", correct: false },
      { text: "Dãy số giảm và không bị chặn", correct: false }
    ],
    explanation: "Xét hiệu số:\n$$u_{n+1} - u_n = \\frac{2(n+1)}{n+2} - \\frac{2n}{n+1} = \\frac{2}{(n+2)(n+1)} > 0, \\quad \\forall n \\in \\mathbb{N}^*$$\nDo đó dãy số tăng. Mặt khác, vì $n \\ge 1$ nên $1 \\le u_n = 2 - \\frac{2}{n+1} < 2$, do đó dãy số bị chặn."
  },
  {
    id: 2,
    title: "Câu 2: Dãy vừa là CSC vừa là CSN",
    pts: 20,
    question: "Dãy số nào sau đây vừa là một cấp số cộng, vừa là một cấp số nhân?",
    options: [
      { text: "$1; 2; 3; 4; 5$", correct: false },
      { text: "$1; 2; 4; 8; 16$", correct: false },
      { text: "$5; 5; 5; 5; 5$", correct: true },
      { text: "$0; 1; 2; 3; 4$", correct: false }
    ],
    explanation: "Dãy số hằng $5; 5; 5; 5; 5$ là cấp số cộng có công sai $d = 0$, đồng thời cũng là cấp số nhân có công bội $q = 1$."
  },
  {
    id: 3,
    title: "Câu 3: Hệ phương trình cấp số cộng",
    pts: 20,
    question: "Cho cấp số cộng $(u_n)$ thỏa mãn $u_2 + u_4 = 10$ và $u_3 + u_5 = 14$. Giá trị của số hạng đầu $u_1$ và công sai $d$ lần lượt là:",
    options: [
      { text: "$u_1 = 1; d = 2$", correct: true },
      { text: "$u_1 = 2; d = 2$", correct: false },
      { text: "$u_1 = 1; d = 3$", correct: false },
      { text: "$u_1 = 3; d = 2$", correct: false }
    ],
    explanation: "Biểu diễn theo $u_1$ và $d$:\n$$\\begin{cases} (u_1 + d) + (u_1 + 3d) = 10 \\\\ (u_1 + 2d) + (u_1 + 4d) = 14 \\end{cases} \\Leftrightarrow \\begin{cases} 2u_1 + 4d = 10 \\\\ 2u_1 + 6d = 14 \\end{cases}$$\nTrừ hai phương trình: $2d = 4 \\Rightarrow d = 2$. Thay vào phương trình đầu: $2u_1 + 8 = 10 \\Rightarrow u_1 = 1$."
  },
  {
    id: 4,
    title: "Câu 4: Kỹ thuật đặt 3 số liên tiếp",
    pts: 20,
    question: "Ba số hạng liên tiếp của một cấp số cộng tăng có tổng bằng $15$ và tích bằng $80$. Ba số đó là:",
    options: [
      { text: "$2; 5; 8$", correct: true },
      { text: "$1; 5; 9$", correct: false },
      { text: "$3; 5; 7$", correct: false },
      { text: "$4; 5; 6$", correct: false }
    ],
    explanation: "Đặt 3 số là $a - d, a, a + d$ với $d > 0$.\nTổng: $(a - d) + a + (a + d) = 3a = 15 \\Rightarrow a = 5$.\nTích: $(5 - d) \\cdot 5 \\cdot (5 + d) = 80 \\Leftrightarrow 25 - d^2 = 16 \\Leftrightarrow d^2 = 9 \\Rightarrow d = 3$.\nVậy ba số đó là $2; 5; 8$."
  },
  {
    id: 5,
    title: "Câu 5: Tính tổng $S_n$ cấp số nhân đan dấu",
    pts: 20,
    question: "Cho cấp số nhân $(u_n)$ có số hạng đầu $u_1 = 3$ và công bội $q = -2$. Tổng của $7$ số hạng đầu tiên ($S_7$) bằng:",
    options: [
      { text: "$129$", correct: true },
      { text: "$-127$", correct: false },
      { text: "$255$", correct: false },
      { text: "$-129$", correct: false }
    ],
    explanation: "Áp dụng công thức $S_n = \\frac{u_1(1 - q^n)}{1 - q}$ với $n = 7$:\n$$S_7 = \\frac{3[1 - (-2)^7]}{1 - (-2)} = \\frac{3[1 - (-128)]}{3} = 1 + 128 = 129$$."
  },
  {
    id: 6,
    title: "Câu 6: Tìm số hạng vượt ngưỡng",
    pts: 20,
    question: "Cho cấp số cộng $(u_n)$ có $u_1 = -2$ và công sai $d = 5$. Số hạng đầu tiên của dãy nhận giá trị lớn hơn $100$ là:",
    options: [
      { text: "$u_{21}$", correct: false },
      { text: "$u_{22}$", correct: true },
      { text: "$u_{20}$", correct: false },
      { text: "$u_{23}$", correct: false }
    ],
    explanation: "Giải bất phương trình $u_n > 100$:\n$$-2 + (n - 1) \\cdot 5 > 100 \\Leftrightarrow 5(n - 1) > 102 \\Leftrightarrow n - 1 > 20.4 \\Leftrightarrow n > 21.4$$\nDo $n \\in \\mathbb{N}^*$, giá trị nguyên nhỏ nhất của $n$ là $n = 22$. Số hạng đó là $u_{22} = -2 + 21 \\cdot 5 = 103$."
  },
  {
    id: 7,
    title: "Câu 7: Mối liên hệ 3 số vừa CSC vừa CSN",
    pts: 20,
    question: "Cho ba số dương $a, b, c$ theo thứ tự vừa lập thành một cấp số cộng, vừa lập thành một cấp số nhân. Mối liên hệ giữa ba số là:",
    options: [
      { text: "$a = b = c$", correct: true },
      { text: "$a = 2b = 3c$", correct: false },
      { text: "$a + c = b$", correct: false },
      { text: "$a^2 = b \\cdot c$", correct: false }
    ],
    explanation: "Vì $a, b, c$ lập thành CSC nên $b = \\frac{a + c}{2}$.\nVì $a, b, c$ lập thành CSN nên $b^2 = ac$.\nThế vào: $\\left(\\frac{a + c}{2}\\right)^2 = ac \\Leftrightarrow a^2 + 2ac + c^2 = 4ac \\Leftrightarrow (a - c)^2 = 0 \\Leftrightarrow a = c$.\nKhi đó $b = \\frac{a + a}{2} = a$. Vậy $a = b = c$."
  },
  {
    id: 8,
    title: "Câu 8: Ứng dụng lãi kép ngân hàng SGK",
    pts: 20,
    question: "Bác An gửi $100$ triệu đồng vào ngân hàng với lãi suất $6\\%$/năm theo hình thức lãi kép kỳ hạn 1 năm. Số tiền cả gốc lẫn lãi bác An nhận được sau $5$ năm xấp xỉ bằng:",
    options: [
      { text: "$130$ triệu đồng", correct: false },
      { text: "$133.82$ triệu đồng", correct: true },
      { text: "$135.50$ triệu đồng", correct: false },
      { text: "$128.25$ triệu đồng", correct: false }
    ],
    explanation: "Theo công thức lãi kép cấp số nhân $A_n = A_0(1 + r)^n$:\n$$A_5 = 100 \\cdot (1 + 0.06)^5 = 100 \\cdot (1.06)^5 \\approx 100 \\cdot 1.338225 = 133.82 \\text{ triệu đồng}$$."
  },
  {
    id: 9,
    title: "Câu 9: Bài toán quả bóng nảy SGK",
    pts: 20,
    question: "Một quả bóng được thả rơi từ độ cao $100\\text{ m}$. Sau mỗi lần chạm đất, quả bóng nảy lên độ cao bằng $\\frac{1}{2}$ độ cao trước đó. Tổng quãng đường quả bóng di chuyển đến khi chạm đất lần thứ $5$ bằng:",
    options: [
      { text: "$275\\text{ m}$", correct: false },
      { text: "$287.5\\text{ m}$", correct: true },
      { text: "$300\\text{ m}$", correct: false },
      { text: "$250\\text{ m}$", correct: false }
    ],
    explanation: "Quãng đường di chuyển gồm:\n• Rơi lần 1: $100\\text{ m}$.\n• Nảy lên và rơi lần 2: $2 \\times 50 = 100\\text{ m}$.\n• Nảy lên và rơi lần 3: $2 \\times 25 = 50\\text{ m}$.\n• Nảy lên và rơi lần 4: $2 \\times 12.5 = 25\\text{ m}$.\n• Nảy lên và rơi lần 5: $2 \\times 6.25 = 12.5\\text{ m}$.\nTổng quãng đường: $S = 100 + 100 + 50 + 25 + 12.5 = 287.5\\text{ m}$."
  },
  {
    id: 10,
    title: "Câu 10: Ba cạnh tam giác vuông lập thành CSC",
    pts: 20,
    question: "Cho ba cạnh của một tam giác vuông lập thành một cấp số cộng có công sai $d > 0$. Nếu cạnh huyền của tam giác vuông bằng $25$, thì chu vi của tam giác vuông đó là:",
    options: [
      { text: "$50$", correct: false },
      { text: "$60$", correct: true },
      { text: "$70$", correct: false },
      { text: "$55$", correct: false }
    ],
    explanation: "Gọi ba cạnh tam giác vuông là $a - d, a, a + d$ với cạnh huyền $a + d = 25$ ($d > 0$).\nTheo định lý Pythagore:\n$$(a - d)^2 + a^2 = (a + d)^2 \\Leftrightarrow a^2 - 4ad = 0 \\Leftrightarrow a = 4d$$\nThay vào cạnh huyền: $4d + d = 5d = 25 \\Rightarrow d = 5 \\Rightarrow a = 20$.\nBa cạnh tam giác vuông là $15, 20, 25$. Chu vi là: $15 + 20 + 25 = 60$."
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

// --- 4. PHÒNG THÍ NGHIỆM LAB 1: ĐỒ THỊ SO SÁNH SONG SONG CSC VS CSN ---
function initLab1() {
  const canvas = document.getElementById('compCanvas');
  const u1Input = document.getElementById('compU1');
  const u1Val = document.getElementById('compU1Val');
  const dInput = document.getElementById('compD');
  const dVal = document.getElementById('compDVal');
  const qInput = document.getElementById('compQ');
  const qVal = document.getElementById('compQVal');
  const nInput = document.getElementById('compN');
  const nVal = document.getElementById('compNVal');

  const apStatus = document.getElementById('compApStatus');
  const gpStatus = document.getElementById('compGpStatus');

  if (!canvas || !u1Input || !dInput || !qInput || !nInput) return;

  function drawComp() {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const u1 = !isNaN(parseFloat(u1Input.value)) ? parseFloat(u1Input.value) : 2;
    const d = !isNaN(parseFloat(dInput.value)) ? parseFloat(dInput.value) : 3;
    const q = !isNaN(parseFloat(qInput.value)) ? parseFloat(qInput.value) : 1.5;
    const N = !isNaN(parseInt(nInput.value, 10)) ? parseInt(nInput.value, 10) : 6;

    if (u1Val) u1Val.textContent = u1;
    if (dVal) dVal.textContent = d;
    if (qVal) qVal.textContent = q;
    if (nVal) nVal.textContent = N;

    const apTerms = [];
    const gpTerms = [];
    let curGp = u1;

    for (let i = 1; i <= N; i++) {
      apTerms.push({ n: i, val: u1 + (i - 1) * d });
      gpTerms.push({ n: i, val: curGp });
      curGp = curGp * q;
    }

    const lastAp = apTerms[N - 1].val;
    const lastGp = gpTerms[N - 1].val;
    const SnAp = (N * (u1 + lastAp)) / 2;
    const SnGp = (u1 * (1 - Math.pow(q, N))) / (1 - q);

    if (apStatus) renderMath(apStatus, `u_{${N}} = ${lastAp} \\quad (S_{${N}} = ${SnAp})`);
    if (gpStatus) renderMath(gpStatus, `v_{${N}} \\approx ${lastGp.toFixed(2)} \\quad (S_{${N}} \\approx ${SnGp.toFixed(2)})`);

    const padL = 60;
    const padR = 40;
    const padT = 30;
    const padB = 40;

    const plotW = w - padL - padR;
    const plotH = h - padT - padB;

    const allVals = [...apTerms.map(t => t.val), ...gpTerms.map(t => t.val)];
    const maxV = Math.max(...allVals, 10);

    function xCoord(n) {
      return padL + ((n - 1) / (N - 1 || 1)) * plotW;
    }
    function yCoord(v) {
      return padT + plotH - (v / maxV) * plotH;
    }

    // Trục hoành và vạch chia
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padL, h - padB);
    ctx.lineTo(w - padR, h - padB);
    ctx.stroke();

    for (let i = 1; i <= N; i++) {
      const cx = xCoord(i);
      ctx.fillStyle = '#94a3b8';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`n=${i}`, cx, h - padB + 20);
    }

    // Đường thẳng Cấp Số Cộng (vàng cam)
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    apTerms.forEach((t, idx) => {
      const cx = xCoord(t.n);
      const cy = yCoord(t.val);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.restore();

    // Điểm Cấp Số Cộng
    apTerms.forEach(t => {
      const cx = xCoord(t.n);
      const cy = yCoord(t.val);
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Đường cong Cấp Số Nhân (xanh ngọc)
    ctx.save();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    gpTerms.forEach((t, idx) => {
      const cx = xCoord(t.n);
      const cy = yCoord(t.val);
      if (idx === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    });
    ctx.stroke();
    ctx.restore();

    // Điểm Cấp Số Nhân
    gpTerms.forEach(t => {
      const cx = xCoord(t.n);
      const cy = yCoord(t.val);
      ctx.fillStyle = '#34d399';
      ctx.beginPath();
      ctx.arc(cx, cy, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Chú thích nhãn
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText("● CSC Tuyến Tính", padL + 20, padT + 15);
    ctx.fillStyle = '#34d399';
    ctx.fillText("● CSN Hàm Số Mũ", padL + 160, padT + 15);
  }

  u1Input.oninput = () => { drawComp(); unlockBadge(1); };
  dInput.oninput = () => { drawComp(); unlockBadge(1); };
  qInput.oninput = () => { drawComp(); unlockBadge(1); };
  nInput.oninput = () => { drawComp(); unlockBadge(1); };

  drawComp();
}

// --- 5. PHÒNG THÍ NGHIỆM LAB 2: MÁY GIẢI ĐA NĂNG CẤP SỐ ---
function initLab2() {
  const typeSel = document.getElementById('solverType');
  const u1Input = document.getElementById('inputU1');
  const stepInput = document.getElementById('inputStep');
  const stepLabel = document.getElementById('labelStep');
  const nInput = document.getElementById('inputN');
  const solveBtn = document.getElementById('btnSolve');
  const outputBox = document.getElementById('solverOutputBox');

  if (!typeSel || !solveBtn) return;

  typeSel.onchange = () => {
    sound.playClick();
    if (typeSel.value === 'ap') {
      if (stepLabel) renderMixedText(stepLabel, 'Công sai $d$:');
      stepInput.value = '3';
    } else {
      if (stepLabel) renderMixedText(stepLabel, 'Công bội $q$:');
      stepInput.value = '2';
    }
    solve();
  };

  function solve() {
    const isAp = typeSel.value === 'ap';
    const u1 = parseFloat(u1Input.value) || 1;
    const step = parseFloat(stepInput.value) || 1;
    const n = parseInt(nInput.value, 10) || 5;

    let stepsHtml = '';
    const terms = [];

    if (isAp) {
      const d = step;
      const un = u1 + (n - 1) * d;
      const Sn = (n * (u1 + un)) / 2;

      for (let i = 1; i <= Math.min(n, 8); i++) {
        terms.push(u1 + (i - 1) * d);
      }

      stepsHtml = `
        <strong>🔍 KẾT QUẢ GIẢI CẤP SỐ CỘNG:</strong><br>
        1. <strong>Số hạng tổng quát:</strong> $u_n = u_1 + (n - 1)d = ${u1} + (n - 1) \\cdot ${d}$<br>
        2. <strong>Số hạng thứ $n = ${n}$:</strong> $u_{${n}} = ${u1} + (${n} - 1) \\cdot ${d} = \\mathbf{${un}}$<br>
        3. <strong>Tổng của $n = ${n}$ số hạng đầu:</strong> $S_{${n}} = \\frac{${n}(${u1} + ${un})}{2} = \\mathbf{${Sn}}$<br>
        4. <strong>Các số hạng đầu tiên:</strong> $${terms.join(', ')}${n > 8 ? ', \\dots' : ''}
      `;
    } else {
      const q = step;
      const un = u1 * Math.pow(q, n - 1);
      let Sn;
      if (q === 1) Sn = n * u1;
      else Sn = (u1 * (1 - Math.pow(q, n))) / (1 - q);

      let cur = u1;
      for (let i = 1; i <= Math.min(n, 8); i++) {
        terms.push(Number(cur.toFixed(2)));
        cur = cur * q;
      }

      stepsHtml = `
        <strong>🔍 KẾT QUẢ GIẢI CẤP SỐ NHÂN:</strong><br>
        1. <strong>Số hạng tổng quát:</strong> $u_n = u_1 \\cdot q^{n-1} = ${u1} \\cdot (${q})^{n-1}$<br>
        2. <strong>Số hạng thứ $n = ${n}$:</strong> $u_{${n}} = ${u1} \\cdot (${q})^{${n-1}} = \\mathbf{${un > 99999 ? un.toExponential(2) : un.toFixed(2)}}$<br>
        3. <strong>Tổng của $n = ${n}$ số hạng đầu:</strong> $S_{${n}} = \\mathbf{${Sn > 99999 ? Sn.toExponential(2) : Sn.toFixed(2)}}$<br>
        4. <strong>Các số hạng đầu tiên:</strong> $${terms.join(', ')}${n > 8 ? ', \\dots' : ''}
      `;
    }

    if (outputBox) {
      outputBox.innerHTML = stepsHtml;
      renderMathInTree(outputBox);
    }
  }

  solveBtn.onclick = () => {
    sound.playCorrect();
    solve();
    unlockBadge(1);
  };

  solve();
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
