// ================================================================
// ÔN TẬP CHƯƠNG I: HÀM SỐ & PHƯƠNG TRÌNH LƯỢNG GIÁC - TOÁN 11 KNTT
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

  s = s.replace(/\\(sin|cos|tan|cot|lim|max|min|log|ln|exp|arcsin|arccos|arctan)/g, (m, fn) => savePlaceholder('<mi class="m-fn">' + fn + '</mi>'));

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

  playCannon() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    // Âm thanh tiếng súng pháo nổ
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }
}

const sound = new SoundManager();

// --- 2. TRẠNG THÁI ỨNG DỤNG (APP STATE) ---
const STORAGE_KEY = 'toan11_ontap_chuong1_state';

const defaultState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Tướng Lượng Giác Toàn Năng',
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

// --- 3. ĐẤU TRƯỜNG SGK: 10 CÂU HỎI TRẮC NGHIỆM TỔNG HỢP (BÀI 1.23 - 1.30) ---
const quizData = [
  {
    id: 1,
    title: "Câu 1 (SGK 1.23): Giá trị lượng giác của góc",
    pts: 20,
    question: "Cho góc lượng giác $\\alpha$ thỏa mãn $\\frac{\\pi}{2} < \\alpha < \\pi$ và $\\sin\\alpha = \\frac{1}{3}$. Giá trị của $\\cos\\alpha$ là:",
    options: [
      { text: "$-\\frac{2\\sqrt{2}}{3}$", correct: true },
      { text: "$\\frac{2\\sqrt{2}}{3}$", correct: false },
      { text: "$-\\frac{8}{9}$", correct: false },
      { text: "$\\frac{2}{3}$", correct: false }
    ],
    explanation: "Vì $\\frac{\\pi}{2} < \\alpha < \\pi$ (góc phần tư thứ II) nên $\\cos\\alpha < 0$.<br>Do đó $\\cos\\alpha = -\\sqrt{1 - \\sin^2\\alpha} = -\\sqrt{1 - \\frac{1}{9}} = -\\frac{\\sqrt{8}}{3} = -\\frac{2\\sqrt{2}}{3}$."
  },
  {
    id: 2,
    title: "Câu 2 (SGK 1.24): Rút gọn biểu thức lượng giác",
    pts: 20,
    question: "Rút gọn biểu thức $A = \\frac{\\sin 2a + \\sin a}{1 + \\cos 2a + \\cos a}$ (với điều kiện biểu thức có nghĩa), ta được kết quả là:",
    options: [
      { text: "$\\tan a$", correct: true },
      { text: "$\\cot a$", correct: false },
      { text: "$\\sin a$", correct: false },
      { text: "$\\cos a$", correct: false }
    ],
    explanation: "Áp dụng $\\sin 2a = 2\\sin a \\cos a$ và $1 + \\cos 2a = 2\\cos^2 a$:<br>$$A = \\frac{2\\sin a \\cos a + \\sin a}{2\\cos^2 a + \\cos a} = \\frac{\\sin a(2\\cos a + 1)}{\\cos a(2\\cos a + 1)} = \\frac{\\sin a}{\\cos a} = \\tan a$$."
  },
  {
    id: 3,
    title: "Câu 3 (SGK 1.25): Tính chẵn lẻ và chu kì",
    pts: 20,
    question: "Trong các hàm số sau đây, hàm số nào là **hàm số chẵn** và tuần hoàn với chu kì $\\pi$?",
    options: [
      { text: "$y = \\cos 2x$", correct: true },
      { text: "$y = \\sin 2x$", correct: false },
      { text: "$y = \\tan x$", correct: false },
      { text: "$y = \\cos x$", correct: false }
    ],
    explanation: "• $y = \\cos 2x$: là hàm số chẵn vì $\\cos(2(-x)) = \\cos(-2x) = \\cos 2x$. Chu kì $T = \\frac{2\\pi}{2} = \\pi$. Thỏa mãn cả 2 điều kiện!<br>• $y = \\sin 2x$ và $y = \\tan x$ là các hàm số lẻ.<br>• $y = \\cos x$ có chu kì $2\\pi$."
  },
  {
    id: 4,
    title: "Câu 4 (SGK 1.26): Tập xác định hàm số lượng giác",
    pts: 20,
    question: "Tập xác định của hàm số $y = \\frac{\\tan x}{\\cos x - 1}$ là:",
    options: [
      { text: "$D = \\mathbb{R} \\setminus \\left(\\left\\{\\frac{\\pi}{2} + k\\pi\\right\\} \\cup \\{k2\\pi\\}\\right) \\quad (k \\in \\mathbb{Z})$", correct: true },
      { text: "$D = \\mathbb{R} \\setminus \\{k\\pi, k \\in \\mathbb{Z}\\}$", correct: false },
      { text: "$D = \\mathbb{R} \\setminus \\left\\{\\frac{\\pi}{2} + k\\pi, k \\in \\mathbb{Z}\\right\\}$", correct: false },
      { text: "$D = \\mathbb{R} \\setminus \\{k2\\pi, k \\in \\mathbb{Z}\\}$", correct: false }
    ],
    explanation: "Hàm số xác định khi và chỉ khi:<br>1) $\\tan x$ xác định $\\iff \\cos x \\ne 0 \\iff x \\ne \\frac{\\pi}{2} + k\\pi$<br>2) Mẫu số $\\cos x - 1 \\ne 0 \\iff \\cos x \\ne 1 \\iff x \\ne k2\\pi$<br>Vậy $D = \\mathbb{R} \\setminus \\left(\\left\\{\\frac{\\pi}{2} + k\\pi\\right\\} \\cup \\{k2\\pi\\}\\right)$ ($k \\in \\mathbb{Z}$)."
  },
  {
    id: 5,
    title: "Câu 5 (SGK 1.27): Giá trị lớn nhất của hàm số",
    pts: 20,
    question: "Giá trị lớn nhất của hàm số $y = \\sqrt{3}\\sin x - \\cos x + 2$ trên $\\mathbb{R}$ là:",
    options: [
      { text: "$M = 4$", correct: true },
      { text: "$M = 2$", correct: false },
      { text: "$M = \\sqrt{3} + 2$", correct: false },
      { text: "$M = 3$", correct: false }
    ],
    explanation: "Biến đổi biểu thức:<br>$$\\sqrt{3}\\sin x - \\cos x = 2\\left(\\frac{\\sqrt{3}}{2}\\sin x - \\frac{1}{2}\\cos x\\right) = 2\\sin\\left(x - \\frac{\\pi}{6}\\right)$$<br>Vì $\\sin\\left(x - \\frac{\\pi}{6}\\right) \\le 1$ nên $\\max\\limits_{\\mathbb{R}} y = 2(1) + 2 = 4$."
  },
  {
    id: 6,
    title: "Câu 6 (SGK 1.28): Nghiệm của phương trình lượng giác",
    pts: 20,
    question: "Nghiệm của phương trình $\\sin\\left(x + \\frac{\\pi}{3}\\right) = -\\frac{\\sqrt{3}}{2}$ là:",
    options: [
      { text: "$\\left[\\begin{array}{l} x = -\\frac{2\\pi}{3} + k2\\pi \\\\ x = \\pi + k2\\pi \\end{array}\\right. (k \\in \\mathbb{Z})$", correct: true },
      { text: "$\\left[\\begin{array}{l} x = k2\\pi \\\\ x = \\frac{2\\pi}{3} + k2\\pi \\end{array}\\right. (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = \\pm \\frac{2\\pi}{3} + k2\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = -\\frac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: false }
    ],
    explanation: "Vì $-\\frac{\\sqrt{3}}{2} = \\sin\\left(-\\frac{\\pi}{3}\\right)$, phương trình tương đương:<br>$$\\left[\\begin{array}{l} x + \\frac{\\pi}{3} = -\\frac{\\pi}{3} + k2\\pi \\iff x = -\\frac{2\\pi}{3} + k2\\pi \\\\ x + \\frac{\\pi}{3} = \\pi - \\left(-\\frac{\\pi}{3}\\right) + k2\\pi \\iff x + \\frac{\\pi}{3} = \\frac{4\\pi}{3} + k2\\pi \\iff x = \\pi + k2\\pi \\end{array}\\right.$$"
  },
  {
    id: 7,
    title: "Câu 7 (SGK 1.29): Số nghiệm trên khoảng",
    pts: 20,
    question: "Số nghiệm của phương trình $\\cos 2x = 0$ trên khoảng $(0; 2\\pi)$ là:",
    options: [
      { text: "4 nghiệm", correct: true },
      { text: "2 nghiệm", correct: false },
      { text: "3 nghiệm", correct: false },
      { text: "5 nghiệm", correct: false }
    ],
    explanation: "$\\cos 2x = 0 \\iff 2x = \\frac{\\pi}{2} + k\\pi \\iff x = \\frac{\\pi}{4} + k\\frac{\\pi}{2}$ ($k \\in \\mathbb{Z}$).<br>Cho $0 < \\frac{\\pi}{4} + k\\frac{\\pi}{2} < 2\\pi \\iff -\\frac{1}{4} < \\frac{k}{2} < \\frac{7}{4} \\iff -0.5 < k < 3.5$.<br>Do $k \\in \\mathbb{Z}$ nên $k \\in \\{0, 1, 2, 3\\}$. Có đúng 4 nghiệm phân biệt ($x = \\frac{\\pi}{4}, \\frac{3\\pi}{4}, \\frac{5\\pi}{4}, \\frac{7\\pi}{4}$)."
  },
  {
    id: 8,
    title: "Câu 8 (SGK 1.30): Ứng dụng dao động con lắc",
    pts: 20,
    question: "Một con lắc đơn dao động điều hòa với li độ góc $\\theta(t) = 0.1\\cos(\\pi t)\\,\\text{rad}$ (với $t$ tính bằng giây). Thời gian con lắc thực hiện hết một dao động toàn phần (chu kì $T$) là:",
    options: [
      { text: "$2\\,\\text{giây}$", correct: true },
      { text: "$1\\,\\text{giây}$", correct: false },
      { text: "$0.5\\,\\text{giây}$", correct: false },
      { text: "$\\pi\\,\\text{giây}$", correct: false }
    ],
    explanation: "Tần số góc của dao động là $\\omega = \\pi\\,\\text{rad/s}$.<br>Chu kì dao động toàn phần là $T = \\frac{2\\pi}{\\omega} = \\frac{2\\pi}{\\pi} = 2\\,\\text{giây}$."
  },
  {
    id: 9,
    title: "Câu 9: Giải phương trình tích",
    pts: 20,
    question: "Phương trình $\\sin 2x - \\cos x = 0$ có các họ nghiệm là:",
    options: [
      { text: "$x = \\frac{\\pi}{2} + k\\pi, x = \\frac{\\pi}{6} + k2\\pi, x = \\frac{5\\pi}{6} + k2\\pi \\ (k \\in \\mathbb{Z})$", correct: true },
      { text: "$x = k\\pi, x = \\pm \\frac{\\pi}{3} + k2\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = \\frac{\\pi}{2} + k2\\pi, x = \\frac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = \\pm \\frac{\\pi}{6} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: false }
    ],
    explanation: "Ta có $2\\sin x \\cos x - \\cos x = 0 \\iff \\cos x(2\\sin x - 1) = 0$.<br>• $\\cos x = 0 \\iff x = \\frac{\\pi}{2} + k\\pi$<br>• $\\sin x = \\frac{1}{2} \\iff x = \\frac{\\pi}{6} + k2\\pi$ hoặc $x = \\frac{5\\pi}{6} + k2\\pi$ ($k \\in \\mathbb{Z}$)."
  },
  {
    id: 10,
    title: "Câu 10: Tầm xa pháo binh cực đại",
    pts: 20,
    question: "Tầm xa của viên đạn bắn đi từ khẩu pháo với vận tốc $v_0$ dưới góc bắn $\\alpha$ được tính bởi $d(\\alpha) = \\frac{v_0^2 \\sin 2\\alpha}{g}$ ($0^\\circ < \\alpha < 90^\\circ$). Để viên đạn bay xa nhất, góc bắn $\\alpha$ phải bằng bao nhiêu?",
    options: [
      { text: "$\\alpha = 45^\\circ$", correct: true },
      { text: "$\\alpha = 30^\\circ$", correct: false },
      { text: "$\\alpha = 60^\\circ$", correct: false },
      { text: "$\\alpha = 90^\\circ$", correct: false }
    ],
    explanation: "Vì $0^\\circ < \\alpha < 90^\\circ \\implies 0^\\circ < 2\\alpha < 180^\\circ$. Ta có $\\sin 2\\alpha \\le 1$.<br>Tầm xa đạt giá trị lớn nhất khi $\\sin 2\\alpha = 1 \\iff 2\\alpha = 90^\\circ \\iff \\alpha = 45^\\circ$."
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

// --- 4. INTERACTIVE LAB 1: ALL-IN-ONE EXPLORER ---
let lab1Alpha = 45; // degrees

function drawLab1() {
  const canvas = document.getElementById('lab1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = 150;
  const cy = h / 2;
  const R = 100;

  ctx.clearRect(0, 0, w, h);

  // Trục toạ độ đường tròn
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(cx + R + 25, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, h - 25); ctx.lineTo(cx, 25); ctx.stroke();

  // Đường tròn đơn vị
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.stroke();

  const rad = (lab1Alpha * Math.PI) / 180;
  const cosV = Math.cos(rad);
  const sinV = Math.sin(rad);

  const mx = cx + R * cosV;
  const my = cy - R * sinV;

  // Cung quét góc alpha
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, 30, 0, -rad, lab1Alpha < 0);
  ctx.stroke();

  // Tia OM
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx, my); ctx.stroke();
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(mx, my, 5, 0, 2 * Math.PI); ctx.fill();

  // Đường dóng ngang sang vùng vẽ sóng bên phải
  const waveStartX = cx + R + 40;
  ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(waveStartX, my); ctx.stroke();
  ctx.setLineDash([]);

  // Vẽ đồ thị sóng hình sin bên phải
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(waveStartX, cy); ctx.lineTo(w - 15, cy); ctx.stroke();

  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let px = waveStartX; px < w - 15; px++) {
    const xAngle = rad + ((px - waveStartX) / 45) * Math.PI;
    const yVal = cy - R * Math.sin(xAngle);
    if (px === waveStartX) ctx.moveTo(px, yVal);
    else ctx.lineTo(px, yVal);
  }
  ctx.stroke();

  // Cập nhật text giá trị
  const sinEl = document.getElementById('valSin');
  const cosEl = document.getElementById('valCos');
  const tanEl = document.getElementById('valTan');
  const cotEl = document.getElementById('valCot');
  const dispAngle = document.getElementById('lab1AngleDisp');

  if (dispAngle) dispAngle.textContent = `${lab1Alpha}° (${((lab1Alpha * Math.PI) / 180 / Math.PI).toFixed(2)}π)`;
  if (sinEl) sinEl.textContent = sinV.toFixed(4);
  if (cosEl) cosEl.textContent = cosV.toFixed(4);

  if (Math.abs(cosV) < 1e-4) {
    if (tanEl) tanEl.textContent = 'Không xác định';
  } else {
    if (tanEl) tanEl.textContent = (sinV / cosV).toFixed(4);
  }

  if (Math.abs(sinV) < 1e-4) {
    if (cotEl) cotEl.textContent = 'Không xác định';
  } else {
    if (cotEl) cotEl.textContent = (cosV / sinV).toFixed(4);
  }

  unlockBadge(0);
}

function setAlpha(deg) {
  lab1Alpha = deg;
  const slider = document.getElementById('sliderAlpha');
  if (slider) slider.value = deg;
  drawLab1();
  sound.playClick();
}

// --- 5. INTERACTIVE LAB 2: MÔ PHỎNG QUỸ ĐẠO BẮN PHÁO BINH ---
let gunAngle = 45; // degrees
let muzzleV0 = 60; // m/s
const g = 9.8;
let projectileAnimFrame = null;
let projectileT = 0;
let isFiring = false;
const flightTrajectory = [];

function drawLab2() {
  const canvas = document.getElementById('lab2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const groundY = h - 45;
  const originX = 50;

  // Mặt đất
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(10, groundY); ctx.lineTo(w - 10, groundY); ctx.stroke();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
  ctx.fillRect(10, groundY, w - 20, 40);

  // Khẩu pháo
  const rad = (gunAngle * Math.PI) / 180;
  const barrelLen = 35;
  const barrelEndX = originX + barrelLen * Math.cos(rad);
  const barrelEndY = groundY - barrelLen * Math.sin(rad);

  // Nòng pháo
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 7;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(originX, groundY); ctx.lineTo(barrelEndX, barrelEndY); ctx.stroke();
  ctx.lineCap = 'butt';

  // Bánh xe pháo
  ctx.fillStyle = '#64748b';
  ctx.beginPath(); ctx.arc(originX, groundY, 12, 0, 2 * Math.PI); ctx.fill();
  ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.stroke();

  // Tính toán vật lý
  const dRange = (muzzleV0 * muzzleV0 * Math.sin(2 * rad)) / g;
  const hMax = (muzzleV0 * muzzleV0 * Math.sin(rad) * Math.sin(rad)) / (2 * g);
  const totalFlightT = (2 * muzzleV0 * Math.sin(rad)) / g;

  // Tỉ lệ scale để vừa khung canvas
  const scale = (w - 120) / 450; // pixels per meter

  // Vẽ quỹ đạo đường đạn lý thuyết nét đứt
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  const numSteps = 50;
  for (let i = 0; i <= numSteps; i++) {
    const t = (i / numSteps) * totalFlightT;
    const xM = muzzleV0 * Math.cos(rad) * t;
    const yM = muzzleV0 * Math.sin(rad) * t - 0.5 * g * t * t;
    const px = originX + xM * scale;
    const py = groundY - yM * scale;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();
  ctx.setLineDash([]);

  // Điểm chạm đích
  const targetPx = originX + dRange * scale;
  ctx.fillStyle = '#10b981';
  ctx.beginPath(); ctx.arc(targetPx, groundY, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillText(`🚩 ${dRange.toFixed(1)}m`, targetPx - 20, groundY + 18);

  // Vẽ vệt bay thực tế khi đang bắn
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  for (let i = 0; i < flightTrajectory.length; i++) {
    const pt = flightTrajectory[i];
    if (i === 0) ctx.moveTo(pt.x, pt.y);
    else ctx.lineTo(pt.x, pt.y);
  }
  ctx.stroke();

  // Viên đạn
  if (isFiring && flightTrajectory.length > 0) {
    const currentPt = flightTrajectory[flightTrajectory.length - 1];
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath(); ctx.arc(currentPt.x, currentPt.y, 5, 0, 2 * Math.PI); ctx.fill();
  }

  // Cập nhật text
  const rangeEl = document.getElementById('lab2RangeText');
  const maxHEl = document.getElementById('lab2MaxHText');
  const tFlightEl = document.getElementById('lab2FlightTime');

  if (rangeEl) rangeEl.textContent = `${dRange.toFixed(2)} m`;
  if (maxHEl) maxHEl.textContent = `${hMax.toFixed(2)} m`;
  if (tFlightEl) tFlightEl.textContent = `${totalFlightT.toFixed(2)} giây`;

  if (isFiring) {
    projectileT += 0.08;
    const xM = muzzleV0 * Math.cos(rad) * projectileT;
    const yM = muzzleV0 * Math.sin(rad) * projectileT - 0.5 * g * projectileT * projectileT;
    const px = originX + xM * scale;
    const py = groundY - yM * scale;

    flightTrajectory.push({ x: px, y: py });

    if (projectileT >= totalFlightT || py >= groundY) {
      isFiring = false;
      projectileAnimFrame = null;
      if (Math.abs(gunAngle - 45) <= 1) unlockBadge(1);
    } else {
      projectileAnimFrame = requestAnimationFrame(drawLab2);
    }
  }
}

function fireCannon() {
  sound.playCannon();
  isFiring = true;
  projectileT = 0;
  flightTrajectory.length = 0;
  if (projectileAnimFrame) cancelAnimationFrame(projectileAnimFrame);
  drawLab2();
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
        setTimeout(() => { drawLab1(); drawLab2(); }, 50);
      }
      if (target === 'arena') {
        renderQuiz();
      }
    });
  });

  // Lab 1
  const sAlpha = document.getElementById('sliderAlpha');
  if (sAlpha) {
    sAlpha.addEventListener('input', function() {
      lab1Alpha = parseFloat(this.value);
      drawLab1();
    });
  }

  // Lab 2
  const sGun = document.getElementById('sliderGunAngle');
  const sV0 = document.getElementById('sliderV0');
  const btnFire = document.getElementById('btnFireCannon');
  const btnReset = document.getElementById('btnResetCannon');

  if (sGun) {
    sGun.addEventListener('input', function() {
      gunAngle = parseFloat(this.value);
      const d = document.getElementById('lab2AngleVal');
      if (d) {
        if (gunAngle === 45) {
          d.innerHTML = '<strong>45° (Tầm xa cực đại!)</strong>';
        } else {
          d.textContent = `${gunAngle}°`;
        }
      }
      flightTrajectory.length = 0;
      drawLab2();
    });
  }

  if (sV0) {
    sV0.addEventListener('input', function() {
      muzzleV0 = parseFloat(this.value);
      const d = document.getElementById('lab2V0Val');
      if (d) d.textContent = `${muzzleV0} m/s`;
      flightTrajectory.length = 0;
      drawLab2();
    });
  }

  if (btnFire) {
    btnFire.addEventListener('click', fireCannon);
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      isFiring = false;
      if (projectileAnimFrame) cancelAnimationFrame(projectileAnimFrame);
      flightTrajectory.length = 0;
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
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình Ôn Tập Chương I?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        saveState();
        updateHUD();
        renderQuiz();
        drawLab1();
        drawLab2();
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
