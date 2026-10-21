// ================================================================
// BÀI 2: CÔNG THỨC LƯỢNG GIÁC - TOÁN 11 KNTT
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

  // MathML fallback
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
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
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
const STORAGE_KEY = 'toan11_bai2_state';

const defaultState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Biến Đổi Lượng Giác',
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

  // Cập nhật huy hiệu
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
    title: "Câu 1: Giá trị lượng giác của góc 15°",
    pts: 20,
    question: "Áp dụng công thức cộng $\\cos(a - b) = \\cos a \\cos b + \\sin a \\sin b$, giá trị chính xác của $\\cos 15^\\circ = \\cos(45^\\circ - 30^\\circ)$ là:",
    options: [
      { text: "$\\frac{\\sqrt{6} + \\sqrt{2}}{4}$", correct: true },
      { text: "$\\frac{\\sqrt{6} - \\sqrt{2}}{4}$", correct: false },
      { text: "$\\frac{\\sqrt{3} + 1}{2}$", correct: false },
      { text: "$\\frac{\\sqrt{2} + 1}{4}$", correct: false }
    ],
    explanation: "Ta có $15^\\circ = 45^\\circ - 30^\\circ$. Do đó:<br>$$\\cos 15^\\circ = \\cos 45^\\circ \\cos 30^\\circ + \\sin 45^\\circ \\sin 30^\\circ = \\frac{\\sqrt{2}}{2} \\cdot \\frac{\\sqrt{3}}{2} + \\frac{\\sqrt{2}}{2} \\cdot \\frac{1}{2} = \\frac{\\sqrt{6} + \\sqrt{2}}{4}$$."
  },
  {
    id: 2,
    title: "Câu 2: Rút gọn biểu thức lượng giác",
    pts: 20,
    question: "Rút gọn biểu thức $A = \\sin(x + y)\\cos y - \\cos(x + y)\\sin y$, ta được kết quả là:",
    options: [
      { text: "$\\cos x$", correct: false },
      { text: "$\\sin x$", correct: true },
      { text: "$\\sin(x + 2y)$", correct: false },
      { text: "$\\cos(x + 2y)$", correct: false }
    ],
    explanation: "Áp dụng công thức cộng $\\sin(a - b) = \\sin a \\cos b - \\cos a \\sin b$ với $a = x + y$ và $b = y$:<br>$$A = \\sin((x + y) - y) = \\sin x$$."
  },
  {
    id: 3,
    title: "Câu 3: Tính sin góc nhân đôi",
    pts: 20,
    question: "Cho $\\sin a = \\frac{3}{5}$ với $\\frac{\\pi}{2} < a < \\pi$. Giá trị của $\\sin 2a$ bằng:",
    options: [
      { text: "$\\frac{24}{25}$", correct: false },
      { text: "$-\\frac{24}{25}$", correct: true },
      { text: "$-\\frac{7}{25}$", correct: false },
      { text: "$\\frac{12}{25}$", correct: false }
    ],
    explanation: "Vì $\\frac{\\pi}{2} < a < \\pi$ nên $\\cos a < 0$.<br>$$\\cos a = -\\sqrt{1 - \\sin^2 a} = -\\sqrt{1 - \\frac{9}{25}} = -\\frac{4}{5}$$<br>Áp dụng công thức nhân đôi:<br>$$\\sin 2a = 2\\sin a \\cos a = 2 \\cdot \\frac{3}{5} \\cdot \\left(-\\frac{4}{5}\\right) = -\\frac{24}{25}$$."
  },
  {
    id: 4,
    title: "Câu 4: Tính cos góc nhân đôi",
    pts: 20,
    question: "Cho $\\cos a = \\frac{1}{3}$. Giá trị của $\\cos 2a$ bằng:",
    options: [
      { text: "$-\\frac{7}{9}$", correct: true },
      { text: "$\\frac{7}{9}$", correct: false },
      { text: "$-\\frac{8}{9}$", correct: false },
      { text: "$\\frac{2}{3}$", correct: false }
    ],
    explanation: "Áp dụng công thức nhân đôi $\\cos 2a = 2\\cos^2 a - 1$:<br>$$\\cos 2a = 2 \\cdot \\left(\\frac{1}{3}\\right)^2 - 1 = 2 \\cdot \\frac{1}{9} - 1 = -\\frac{7}{9}$$."
  },
  {
    id: 5,
    title: "Câu 5: Nhận diện khẳng định sai về công thức",
    pts: 20,
    question: "Trong các khẳng định sau, khẳng định nào **SAI**?",
    options: [
      { text: "$\\sin 2a = 2\\sin a \\cos a$", correct: false },
      { text: "$\\cos(a + b) = \\cos a \\cos b - \\sin a \\sin b$", correct: false },
      { text: "$\\cos 2a = \\sin^2 a - \\cos^2 a$", correct: true },
      { text: "$\\sin(a + b) = \\sin a \\cos b + \\cos a \\sin b$", correct: false }
    ],
    explanation: "Khẳng định $\\cos 2a = \\sin^2 a - \\cos^2 a$ là SAI vì công thức đúng phải là:<br>$$\\cos 2a = \\cos^2 a - \\sin^2 a = 2\\cos^2 a - 1 = 1 - 2\\sin^2 a$$."
  },
  {
    id: 6,
    title: "Câu 6: Biến đổi tích thành tổng",
    pts: 20,
    question: "Biến đổi tích $P = \\cos 4x \\cos 2x$ thành tổng, ta được kết quả là:",
    options: [
      { text: "$\\frac{1}{2}(\\cos 6x + \\cos 2x)$", correct: true },
      { text: "$\\frac{1}{2}(\\cos 6x - \\cos 2x)$", correct: false },
      { text: "$\\cos 6x + \\cos 2x$", correct: false },
      { text: "$\\frac{1}{2}(\\sin 6x + \\sin 2x)$", correct: false }
    ],
    explanation: "Áp dụng công thức $\\cos a \\cos b = \\frac{1}{2}[\\cos(a - b) + \\cos(a + b)]$:<br>$$P = \\frac{1}{2}[\\cos(4x - 2x) + \\cos(4x + 2x)] = \\frac{1}{2}(\\cos 2x + \\cos 6x) = \\frac{1}{2}(\\cos 6x + \\cos 2x)$$."
  },
  {
    id: 7,
    title: "Câu 7: Biến đổi tổng thành tích",
    pts: 20,
    question: "Biến đổi biểu thức $Q = \\sin 5x - \\sin 3x$ thành tích, ta được kết quả là:",
    options: [
      { text: "$2\\cos 4x \\sin x$", correct: true },
      { text: "$2\\sin 4x \\cos x$", correct: false },
      { text: "$-2\\cos 4x \\sin x$", correct: false },
      { text: "$2\\cos 8x \\sin 2x$", correct: false }
    ],
    explanation: "Áp dụng công thức $\\sin u - \\sin v = 2\\cos\\frac{u + v}{2}\\sin\\frac{u - v}{2}$:<br>$$Q = 2\\cos\\left(\\frac{5x + 3x}{2}\\right)\\sin\\left(\\frac{5x - 3x}{2}\\right) = 2\\cos 4x \\sin x$$."
  },
  {
    id: 8,
    title: "Câu 8: Tính tan góc nhân đôi",
    pts: 20,
    question: "Cho $\\tan a = 2$. Giá trị của $\\tan 2a$ bằng:",
    options: [
      { text: "$-\\frac{4}{3}$", correct: true },
      { text: "$\\frac{4}{3}$", correct: false },
      { text: "$-\\frac{4}{5}$", correct: false },
      { text: "$\\frac{4}{5}$", correct: false }
    ],
    explanation: "Áp dụng công thức nhân đôi của $\\tan$:<br>$$\\tan 2a = \\frac{2\\tan a}{1 - \\tan^2 a} = \\frac{2 \\cdot 2}{1 - 2^2} = \\frac{4}{1 - 4} = -\\frac{4}{3}$$."
  },
  {
    id: 9,
    title: "Câu 9: Tích cos các góc liên hoàn",
    pts: 20,
    question: "Giá trị của tích $M = \\cos 20^\\circ \\cos 40^\\circ \\cos 80^\\circ$ là:",
    options: [
      { text: "$\\frac{1}{8}$", correct: true },
      { text: "$\\frac{1}{4}$", correct: false },
      { text: "$\\frac{\\sqrt{3}}{8}$", correct: false },
      { text: "$\\frac{1}{16}$", correct: false }
    ],
    explanation: "Nhân hai vế với $2\\sin 20^\\circ$:<br>$$2\\sin 20^\\circ \\cdot M = (2\\sin 20^\\circ \\cos 20^\\circ)\\cos 40^\\circ \\cos 80^\\circ = \\sin 40^\\circ \\cos 40^\\circ \\cos 80^\\circ$$<br>$$= \\frac{1}{2}(2\\sin 40^\\circ \\cos 40^\\circ)\\cos 80^\\circ = \\frac{1}{2}\\sin 80^\\circ \\cos 80^\\circ = \\frac{1}{4}\\sin 160^\\circ = \\frac{1}{4}\\sin 20^\\circ$$<br>Do đó $M = \\frac{\\frac{1}{4}\\sin 20^\\circ}{2\\sin 20^\\circ} = \\frac{1}{8}$."
  },
  {
    id: 10,
    title: "Câu 10: Ứng dụng âm học và hiện tượng phách",
    pts: 20,
    question: "Trong phòng thí nghiệm âm học, hai âm thoa phát ra hai sóng âm có phương trình $u_1 = A\\cos(2\\pi \\cdot 440 t)$ và $u_2 = A\\cos(2\\pi \\cdot 444 t)$ (với $t$ tính bằng giây). Áp dụng công thức biến đổi tổng thành tích, tần số phách (số lần âm thanh to cực đại trong một giây) mà tai người nghe được là:",
    options: [
      { text: "$4\\,\\text{Hz}$", correct: true },
      { text: "$2\\,\\text{Hz}$", correct: false },
      { text: "$442\\,\\text{Hz}$", correct: false },
      { text: "$884\\,\\text{Hz}$", correct: false }
    ],
    explanation: "Biến đổi tổng thành tích:<br>$$u_1 + u_2 = 2A\\cos\\left(2\\pi \\cdot \\frac{444 - 440}{2} t\\right)\\cos\\left(2\\pi \\cdot \\frac{444 + 440}{2} t\\right) = 2A\\cos(2\\pi \\cdot 2 t)\\cos(2\\pi \\cdot 442 t)$$<br>Biên độ biến thiên là $|2A\\cos(2\\pi \\cdot 2 t)|$. Chu kì biến thiên biên độ là nửa chu kì của hàm $\\cos$, do đó tần số phách đúng bằng $|f_1 - f_2| = |444 - 440| = 4\\,\\text{Hz}$."
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

  if (appState.streak >= 3) unlockBadge(2); // Badge 3
  if (appState.xp >= 160) unlockBadge(3);  // Badge 4
  if (correctCount === 10) {
    unlockBadge(4);                        // Badge 5
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

// --- 4. INTERACTIVE LAB 1: MÁY KIỂM CHỨNG CÔNG THỨC LƯỢNG GIÁC ---
let angleA = 60;
let angleB = 45;
let currentFormula = 'cos_sub';

function calculateFormulaValues() {
  const radA = (angleA * Math.PI) / 180;
  const radB = (angleB * Math.PI) / 180;
  let lhs = 0;
  let rhs = 0;

  switch (currentFormula) {
    case 'cos_sub':
      lhs = Math.cos(radA - radB);
      rhs = Math.cos(radA) * Math.cos(radB) + Math.sin(radA) * Math.sin(radB);
      break;
    case 'cos_add':
      lhs = Math.cos(radA + radB);
      rhs = Math.cos(radA) * Math.cos(radB) - Math.sin(radA) * Math.sin(radB);
      break;
    case 'sin_sub':
      lhs = Math.sin(radA - radB);
      rhs = Math.sin(radA) * Math.cos(radB) - Math.cos(radA) * Math.sin(radB);
      break;
    case 'sin_add':
      lhs = Math.sin(radA + radB);
      rhs = Math.sin(radA) * Math.cos(radB) + Math.cos(radA) * Math.sin(radB);
      break;
    case 'sin_double':
      lhs = Math.sin(2 * radA);
      rhs = 2 * Math.sin(radA) * Math.cos(radA);
      break;
    case 'cos_double':
      lhs = Math.cos(2 * radA);
      rhs = 2 * Math.cos(radA) * Math.cos(radA) - 1;
      break;
    case 'prod_to_sum':
      lhs = Math.cos(radA) * Math.cos(radB);
      rhs = 0.5 * (Math.cos(radA - radB) + Math.cos(radA + radB));
      break;
    case 'sum_to_prod':
      lhs = Math.cos(radA) + Math.cos(radB);
      rhs = 2 * Math.cos((radA + radB) / 2) * Math.cos((radA - radB) / 2);
      break;
  }

  const diff = Math.abs(lhs - rhs);
  return { lhs, rhs, diff };
}

function drawLab1() {
  const canvas = document.getElementById('lab1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const R = 130;

  ctx.clearRect(0, 0, w, h);

  // Lưới toạ độ
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Trục Ox, Oy
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(30, cy); ctx.lineTo(w - 30, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, h - 30); ctx.lineTo(cx, 30); ctx.stroke();
  ctx.fillStyle = '#94a3b8'; ctx.font = '12px sans-serif';
  ctx.fillText('x (cos)', w - 50, cy - 8);
  ctx.fillText('y (sin)', cx + 8, 38);
  ctx.fillText('O', cx - 14, cy + 14);

  // Đường tròn đơn vị
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.stroke();

  const radA = (angleA * Math.PI) / 180;
  const radB = (angleB * Math.PI) / 180;

  const ax = cx + R * Math.cos(radA);
  const ay = cy - R * Math.sin(radA);

  const bx = cx + R * Math.cos(radB);
  const by = cy - R * Math.sin(radB);

  // Cung quét góc b
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.5)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 40, 0, -radB, true);
  ctx.stroke();

  // Tia Ob
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(bx, by); ctx.stroke();
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath(); ctx.arc(bx, by, 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillText(`b (${angleB}°)`, bx + 6, by - 6);

  // Cung quét góc a
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(cx, cy, 55, 0, -radA, true);
  ctx.stroke();

  // Tia Oa
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(ax, ay); ctx.stroke();
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(ax, ay, 5, 0, 2 * Math.PI); ctx.fill();
  ctx.fillText(`a (${angleA}°)`, ax + 6, ay - 6);

  // Vẽ góc hiệu a - b nếu có
  const radDiff = radA - radB;
  const diffDeg = angleA - angleB;
  const dx = cx + R * Math.cos(radDiff);
  const dy = cy - R * Math.sin(radDiff);

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(dx, dy); ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`a - b (${diffDeg}°)`, dx + 6, dy + 14);

  // Cập nhật text hiển thị
  const { lhs, rhs, diff } = calculateFormulaValues();
  const lhsEl = document.getElementById('lhsVal');
  const rhsEl = document.getElementById('rhsVal');
  const diffEl = document.getElementById('diffVal');
  if (lhsEl) lhsEl.textContent = lhs.toFixed(5);
  if (rhsEl) rhsEl.textContent = rhs.toFixed(5);
  if (diffEl) {
    if (diff < 1e-5) {
      diffEl.innerHTML = '<span style="color: #10b981;">0.000000 (Đẳng thức tuyệt đối đúng!)</span>';
    } else {
      diffEl.textContent = diff.toFixed(6);
    }
  }

  unlockBadge(0); // Huy hiệu 1
}

function setSpecialAngles(a, b) {
  angleA = a;
  angleB = b;
  const sA = document.getElementById('lab1SliderA');
  const sB = document.getElementById('lab1SliderB');
  const dA = document.getElementById('lab1AngleADisp');
  const dB = document.getElementById('lab1AngleBDisp');
  if (sA) sA.value = a;
  if (sB) sB.value = b;
  if (dA) dA.textContent = `${a}° (${((a * Math.PI) / 180 / Math.PI).toFixed(2)}π)`;
  if (dB) dB.textContent = `${b}° (${((b * Math.PI) / 180 / Math.PI).toFixed(2)}π)`;
  drawLab1();
  sound.playClick();
}

// --- 5. INTERACTIVE LAB 2: MÔ PHỎNG HIỆN TƯỢNG PHÁCH VỚI WEB AUDIO API ---
let f1 = 440; // Hz
let f2 = 444; // Hz
let osc1 = null;
let osc2 = null;
let gainBeat = null;
let isPlayingBeat = false;
let beatAnimFrame = null;
let wavePhase = 0;

function drawLab2Wave() {
  const canvas = document.getElementById('lab2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  // Trục toạ độ giữa
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();

  // Vẽ đường bao biến thiên biên độ (Envelope): A_phach(t) = 2 cos((w1 - w2)/2 * t)
  const fBeat = Math.abs(f1 - f2);
  const fCarrier = (f1 + f2) / 2;

  const amp = 85;
  const scaleT = 0.00003; // Scale thời gian trên màn hình

  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);

  // Đường bao trên
  ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const t = (x + wavePhase) * scaleT;
    const env = amp * Math.cos(Math.PI * fBeat * t);
    const y = cy - Math.abs(env);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Đường bao dưới
  ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const t = (x + wavePhase) * scaleT;
    const env = amp * Math.cos(Math.PI * fBeat * t);
    const y = cy + Math.abs(env);
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Vẽ sóng tổng hợp: u(t) = 2A cos((w1 - w2)/2 * t) * sin((w1 + w2)/2 * t)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = 0; x < w; x++) {
    const t = (x + wavePhase) * scaleT;
    const env = amp * Math.cos(Math.PI * fBeat * t);
    const carrier = Math.sin(2 * Math.PI * fCarrier * t);
    const y = cy - env * carrier;
    if (x === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();

  // Cập nhật thông số hiển thị
  const fCarrEl = document.getElementById('fCarrierText');
  const fBeatEl = document.getElementById('fBeatText');
  const tBeatEl = document.getElementById('tBeatText');

  if (fCarrEl) fCarrEl.textContent = `${fCarrier.toFixed(1)} Hz`;
  if (fBeatEl) fBeatEl.textContent = `${fBeat.toFixed(1)} Hz`;
  if (tBeatEl) {
    if (fBeat > 0) {
      tBeatEl.textContent = `${(1 / fBeat).toFixed(3)} giây`;
    } else {
      tBeatEl.textContent = 'Vô cùng (Không có phách)';
    }
  }

  if (isPlayingBeat) {
    wavePhase += 3;
    beatAnimFrame = requestAnimationFrame(drawLab2Wave);
  }
}

function startBeatAudio() {
  sound.init();
  if (!sound.ctx) return;
  stopBeatAudio();

  const now = sound.ctx.currentTime;
  osc1 = sound.ctx.createOscillator();
  osc2 = sound.ctx.createOscillator();
  gainBeat = sound.ctx.createGain();

  osc1.type = 'sine';
  osc2.type = 'sine';
  osc1.frequency.setValueAtTime(f1, now);
  osc2.frequency.setValueAtTime(f2, now);

  gainBeat.gain.setValueAtTime(0.08, now);

  osc1.connect(gainBeat);
  osc2.connect(gainBeat);
  gainBeat.connect(sound.ctx.destination);

  osc1.start();
  osc2.start();

  isPlayingBeat = true;
  drawLab2Wave();
  unlockBadge(1); // Huy hiệu 2: Bậc Thầy Âm Học
}

function stopBeatAudio() {
  if (osc1) {
    try { osc1.stop(); osc1.disconnect(); } catch (e) {}
    osc1 = null;
  }
  if (osc2) {
    try { osc2.stop(); osc2.disconnect(); } catch (e) {}
    osc2 = null;
  }
  isPlayingBeat = false;
  if (beatAnimFrame) {
    cancelAnimationFrame(beatAnimFrame);
    beatAnimFrame = null;
  }
  drawLab2Wave();
}

// --- 6. KHỞI TẠO VÀ LẮNG NGHE SỰ KIỆN (DOM READY) ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateHUD();

  // KaTeX initial render
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
        setTimeout(() => { drawLab1(); drawLab2Wave(); }, 50);
      }
      if (target === 'arena') {
        renderQuiz();
      }
    });
  });

  // Sự kiện Lab 1
  const formSel = document.getElementById('formulaSelect');
  const sA = document.getElementById('lab1SliderA');
  const sB = document.getElementById('lab1SliderB');
  const grpB = document.getElementById('groupAngleB');

  if (formSel) {
    formSel.addEventListener('change', function() {
      currentFormula = this.value;
      if (grpB) {
        if (currentFormula === 'sin_double' || currentFormula === 'cos_double') {
          grpB.style.display = 'none';
        } else {
          grpB.style.display = 'block';
        }
      }
      drawLab1();
      sound.playClick();
    });
  }

  if (sA) {
    sA.addEventListener('input', function() {
      angleA = parseFloat(this.value);
      const dA = document.getElementById('lab1AngleADisp');
      if (dA) dA.textContent = `${angleA}° (${((angleA * Math.PI) / 180 / Math.PI).toFixed(2)}π)`;
      drawLab1();
    });
  }

  if (sB) {
    sB.addEventListener('input', function() {
      angleB = parseFloat(this.value);
      const dB = document.getElementById('lab1AngleBDisp');
      if (dB) dB.textContent = `${angleB}° (${((angleB * Math.PI) / 180 / Math.PI).toFixed(2)}π)`;
      drawLab1();
    });
  }

  // Sự kiện Lab 2
  const f1S = document.getElementById('f1Slider');
  const f2S = document.getElementById('f2Slider');
  const btnPlay = document.getElementById('btnPlayBeat');
  const btnStop = document.getElementById('btnStopBeat');

  if (f1S) {
    f1S.addEventListener('input', function() {
      f1 = parseFloat(this.value);
      const d1 = document.getElementById('f1Disp');
      if (d1) d1.textContent = `${f1} Hz`;
      if (osc1 && sound.ctx) osc1.frequency.setValueAtTime(f1, sound.ctx.currentTime);
      drawLab2Wave();
    });
  }

  if (f2S) {
    f2S.addEventListener('input', function() {
      f2 = parseFloat(this.value);
      const d2 = document.getElementById('f2Disp');
      if (d2) d2.textContent = `${f2} Hz`;
      if (osc2 && sound.ctx) osc2.frequency.setValueAtTime(f2, sound.ctx.currentTime);
      drawLab2Wave();
    });
  }

  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      startBeatAudio();
    });
  }

  if (btnStop) {
    btnStop.addEventListener('click', () => {
      stopBeatAudio();
      sound.playClick();
    });
  }

  // HUD Reset
  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình học Bài 2?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        saveState();
        updateHUD();
        renderQuiz();
        drawLab1();
        drawLab2Wave();
        sound.playClick();
      }
    });
  }

  // Sound Toggle
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
  drawLab2Wave();
  renderQuiz();
});
