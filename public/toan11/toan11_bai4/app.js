// ================================================================
// BÀI 4: PHƯƠNG TRÌNH LƯỢNG GIÁC CƠ BẢN - TOÁN 11 KNTT
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
}

const sound = new SoundManager();

// --- 2. TRẠNG THÁI ỨNG DỤNG (APP STATE) ---
const STORAGE_KEY = 'toan11_bai4_state';

const defaultState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Thợ Săn Nghiệm Lượng Giác',
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
    title: "Câu 1: Nghiệm của phương trình sin cơ bản",
    pts: 20,
    question: "Tất cả các nghiệm của phương trình $\\sin x = \\frac{1}{2}$ là:",
    options: [
      { text: "$\\left[\\begin{array}{l} x = \\frac{\\pi}{6} + k2\\pi \\\\ x = \\frac{5\\pi}{6} + k2\\pi \\end{array}\\right. (k \\in \\mathbb{Z})$", correct: true },
      { text: "$\\left[\\begin{array}{l} x = \\frac{\\pi}{3} + k2\\pi \\\\ x = \\frac{2\\pi}{3} + k2\\pi \\end{array}\\right. (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = \\pm \\frac{\\pi}{6} + k2\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = \\frac{\\pi}{6} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: false }
    ],
    explanation: "Vì $\\sin\\frac{\\pi}{6} = \\frac{1}{2}$, áp dụng công thức nghiệm của $\\sin x = \\sin\\alpha$:<br>$$\\left[\\begin{array}{l} x = \\frac{\\pi}{6} + k2\\pi \\\\ x = \\pi - \\frac{\\pi}{6} + k2\\pi = \\frac{5\\pi}{6} + k2\\pi \\end{array}\\right. \\quad (k \\in \\mathbb{Z})$$."
  },
  {
    id: 2,
    title: "Câu 2: Trường hợp đặc biệt của cos",
    pts: 20,
    question: "Nghiệm của phương trình $\\cos x = 0$ là:",
    options: [
      { text: "$x = \\frac{\\pi}{2} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: true },
      { text: "$x = k\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = \\frac{\\pi}{2} + k2\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = k2\\pi \\quad (k \\in \\mathbb{Z})$", correct: false }
    ],
    explanation: "Trên đường tròn lượng giác, các điểm có hoành độ bằng 0 là hai điểm cực trị trên trục tung $B(0; 1)$ và $B'(0; -1)$, tương ứng với các góc $x = \\frac{\\pi}{2} + k\\pi$ ($k \\in \\mathbb{Z}$)."
  },
  {
    id: 3,
    title: "Câu 3: Điều kiện có nghiệm của phương trình",
    pts: 20,
    question: "Phương trình nào dưới đây **VÔ NGHIỆM**?",
    options: [
      { text: "$\\sin x = 2$", correct: true },
      { text: "$\\cos x = -0.5$", correct: false },
      { text: "$\\tan x = 100$", correct: false },
      { text: "$\\sin x = -1$", correct: false }
    ],
    explanation: "Phương trình $\\sin x = m$ có nghiệm khi và chỉ khi $|m| \\le 1$. Do $2 > 1$ nên phương trình $\\sin x = 2$ vô nghiệm."
  },
  {
    id: 4,
    title: "Câu 4: Nghiệm của phương trình tan",
    pts: 20,
    question: "Tất cả các nghiệm của phương trình $\\tan x = \\sqrt{3}$ là:",
    options: [
      { text: "$x = \\frac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: true },
      { text: "$x = \\frac{\\pi}{6} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = \\pm \\frac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = \\frac{\\pi}{3} + k2\\pi \\quad (k \\in \\mathbb{Z})$", correct: false }
    ],
    explanation: "Vì $\\tan\\frac{\\pi}{3} = \\sqrt{3}$, nên nghiệm là $x = \\frac{\\pi}{3} + k\\pi$ ($k \\in \\mathbb{Z}$)."
  },
  {
    id: 5,
    title: "Câu 5: Đếm số nghiệm trên đoạn kín",
    pts: 20,
    question: "Số nghiệm của phương trình $\\sin x = 0$ trên đoạn $[0; 2\\pi]$ là:",
    options: [
      { text: "3 nghiệm", correct: true },
      { text: "2 nghiệm", correct: false },
      { text: "1 nghiệm", correct: false },
      { text: "4 nghiệm", correct: false }
    ],
    explanation: "Ta có $\\sin x = 0 \\iff x = k\\pi$ ($k \\in \\mathbb{Z}$).<br>Cho $0 \\le k\\pi \\le 2\\pi \\iff 0 \\le k \\le 2 \\implies k \\in \\{0, 1, 2\\}$.<br>Các nghiệm cụ thể là $x = 0$, $x = \\pi$, $x = 2\\pi$. Vậy có tất cả 3 nghiệm."
  },
  {
    id: 6,
    title: "Câu 6: Phương trình chứa góc nhân đôi",
    pts: 20,
    question: "Nghiệm của phương trình $\\cos 2x = -\\frac{1}{2}$ là:",
    options: [
      { text: "$x = \\pm \\frac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: true },
      { text: "$x = \\pm \\frac{2\\pi}{3} + k2\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = \\pm \\frac{\\pi}{6} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = \\frac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: false }
    ],
    explanation: "Vì $\\cos\\frac{2\\pi}{3} = -\\frac{1}{2}$, ta có:<br>$$2x = \\pm \\frac{2\\pi}{3} + k2\\pi \\iff x = \\pm \\frac{\\pi}{3} + k\\pi \\quad (k \\in \\mathbb{Z})$$."
  },
  {
    id: 7,
    title: "Câu 7: Phương trình sin bằng cos",
    pts: 20,
    question: "Tất cả các nghiệm của phương trình $\\sin x = \\cos x$ là:",
    options: [
      { text: "$x = \\frac{\\pi}{4} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: true },
      { text: "$x = \\frac{\\pi}{4} + k2\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = -\\frac{\\pi}{4} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = \\pm \\frac{\\pi}{4} + k2\\pi \\quad (k \\in \\mathbb{Z})$", correct: false }
    ],
    explanation: "Vì $\\cos x = 0$ không là nghiệm, chia cả hai vế cho $\\cos x$, phương trình tương đương:<br>$$\\tan x = 1 \\iff x = \\frac{\\pi}{4} + k\\pi \\quad (k \\in \\mathbb{Z})$$."
  },
  {
    id: 8,
    title: "Câu 8: Phương trình bậc hai quy về cơ bản",
    pts: 20,
    question: "Nghiệm của phương trình $\\sin^2 x - 3\\sin x + 2 = 0$ là:",
    options: [
      { text: "$x = \\frac{\\pi}{2} + k2\\pi \\quad (k \\in \\mathbb{Z})$", correct: true },
      { text: "$x = k\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = \\pm \\frac{\\pi}{2} + k2\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "Vô nghiệm", correct: false }
    ],
    explanation: "Đặt $t = \\sin x$ ($-1 \\le t \\le 1$), ta có $t^2 - 3t + 2 = 0 \\iff t = 1$ (thỏa mãn) hoặc $t = 2$ (loại).<br>Với $\\sin x = 1 \\iff x = \\frac{\\pi}{2} + k2\\pi$ ($k \\in \\mathbb{Z}$)."
  },
  {
    id: 9,
    title: "Câu 9: Nghiệm của phương trình cot",
    pts: 20,
    question: "Nghiệm của phương trình $\\cot x = -1$ là:",
    options: [
      { text: "$x = -\\frac{\\pi}{4} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: true },
      { text: "$x = \\frac{\\pi}{4} + k\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = \\frac{3\\pi}{4} + k2\\pi \\quad (k \\in \\mathbb{Z})$", correct: false },
      { text: "$x = -\\frac{\\pi}{4} + k2\\pi \\quad (k \\in \\mathbb{Z})$", correct: false }
    ],
    explanation: "Vì $\\cot\\left(-\\frac{\\pi}{4}\\right) = -1$, nghiệm của phương trình là $x = -\\frac{\\pi}{4} + k\\pi$ ($k \\in \\mathbb{Z}$)."
  },
  {
    id: 10,
    title: "Câu 10: Ứng dụng thực tế - Vòng quay mặt trời",
    pts: 20,
    question: "Độ cao $h$ (mét) của một ca bin trên vòng đu quay mặt trời sau $t$ phút kể từ lúc bắt đầu quay được cho bởi công thức $h(t) = 30 - 25\\cos\\left(\\frac{\\pi t}{5}\\right)$. Thời điểm đầu tiên ($t > 0$) ca bin đạt độ cao $42.5\\text{ m}$ là:",
    options: [
      { text: "$t = \\frac{10}{3}\\text{ phút}$ ($3\\text{ phút } 20\\text{ giây}$)", correct: true },
      { text: "$t = 5\\text{ phút}$", correct: false },
      { text: "$t = 2.5\\text{ phút}$", correct: false },
      { text: "$t = \\frac{5}{3}\\text{ phút}$ ($1\\text{ phút } 40\\text{ giây}$)", correct: false }
    ],
    explanation: "Giải phương trình $30 - 25\\cos\\left(\\frac{\\pi t}{5}\\right) = 42.5$:<br>$$-25\\cos\\left(\\frac{\\pi t}{5}\\right) = 12.5 \\iff \\cos\\left(\\frac{\\pi t}{5}\\right) = -\\frac{1}{2}$$<br>Nghiệm dương nhỏ nhất là $\\frac{\\pi t}{5} = \\frac{2\\pi}{3} \\iff t = \\frac{10}{3}\\text{ phút} = 3\\text{ phút } 20\\text{ giây}$."
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

// --- 4. INTERACTIVE LAB 1: RADAR QUÉT NGHIỆM ĐƯỜNG TRÒN ---
let currentEqType = 'sin'; // 'sin', 'cos', 'tan'
let paramM = 0.50;

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
  ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(w - 20, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, h - 20); ctx.lineTo(cx, 20); ctx.stroke();
  ctx.fillStyle = '#94a3b8'; ctx.font = '12px sans-serif';
  ctx.fillText('x (cos)', w - 45, cy - 8);
  ctx.fillText('y (sin)', cx + 8, 28);
  ctx.fillText('O', cx - 14, cy + 14);

  // Đường tròn lượng giác
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.7)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.stroke();

  const statusEl = document.getElementById('lab1StatusText');
  const rootsBox = document.getElementById('lab1RootsBox');

  if (currentEqType === 'sin') {
    // Đường thẳng y = m
    const lineY = cy - paramM * R;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(30, lineY); ctx.lineTo(w - 30, lineY); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`y = ${paramM.toFixed(2)}`, 35, lineY - 6);

    if (Math.abs(paramM) > 1.0) {
      if (statusEl) statusEl.innerHTML = '<span style="color: #f43f5e;">VÔ NGHIỆM (Vì |m| > 1, đường thẳng không cắt đường tròn)</span>';
      if (rootsBox) rootsBox.innerHTML = '<p style="color: #f43f5e;">Phương trình $\\sin x = ' + paramM.toFixed(2) + '$ vô nghiệm trên $\\mathbb{R}$.</p>';
    } else {
      const alphaRad = Math.asin(paramM);
      const alphaDeg = (alphaRad * 180) / Math.PI;
      const alpha2Rad = Math.PI - alphaRad;
      const alpha2Deg = 180 - alphaDeg;

      const p1x = cx + R * Math.cos(alphaRad);
      const p1y = cy - R * Math.sin(alphaRad);
      const p2x = cx + R * Math.cos(alpha2Rad);
      const p2y = cy - R * Math.sin(alpha2Rad);

      // Tia 1
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p1x, p1y); ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(p1x, p1y, 6, 0, 2 * Math.PI); ctx.fill();
      ctx.fillText(`M₁(${alphaDeg.toFixed(1)}°)`, p1x + 8, p1y - 6);

      // Tia 2
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p2x, p2y); ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(p2x, p2y, 6, 0, 2 * Math.PI); ctx.fill();
      ctx.fillText(`M₂(${alpha2Deg.toFixed(1)}°)`, p2x - 70, p2y - 6);

      if (statusEl) statusEl.innerHTML = `<span style="color: #10b981;">Có nghiệm: 2 điểm biểu diễn trên đường tròn</span>`;
      if (rootsBox) {
        rootsBox.innerHTML = `<p>• $x_1 = ${alphaDeg.toFixed(1)}^\\circ + k360^\\circ$ ($${(alphaRad / Math.PI).toFixed(2)}\\pi + k2\\pi$)</p>
                              <p>• $x_2 = ${alpha2Deg.toFixed(1)}^\\circ + k360^\\circ$ ($${(alpha2Rad / Math.PI).toFixed(2)}\\pi + k2\\pi$)</p>`;
      }
    }
  } else if (currentEqType === 'cos') {
    // Đường thẳng x = m
    const lineX = cx + paramM * R;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(lineX, 30); ctx.lineTo(lineX, h - 30); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`x = ${paramM.toFixed(2)}`, lineX + 6, 45);

    if (Math.abs(paramM) > 1.0) {
      if (statusEl) statusEl.innerHTML = '<span style="color: #f43f5e;">VÔ NGHIỆM (Vì |m| > 1, đường thẳng không cắt đường tròn)</span>';
      if (rootsBox) rootsBox.innerHTML = '<p style="color: #f43f5e;">Phương trình $\\cos x = ' + paramM.toFixed(2) + '$ vô nghiệm trên $\\mathbb{R}$.</p>';
    } else {
      const alphaRad = Math.acos(paramM);
      const alphaDeg = (alphaRad * 180) / Math.PI;

      const p1x = cx + R * Math.cos(alphaRad);
      const p1y = cy - R * Math.sin(alphaRad);
      const p2x = cx + R * Math.cos(-alphaRad);
      const p2y = cy - R * Math.sin(-alphaRad);

      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p1x, p1y); ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(p1x, p1y, 6, 0, 2 * Math.PI); ctx.fill();
      ctx.fillText(`M₁(${alphaDeg.toFixed(1)}°)`, p1x + 8, p1y - 6);

      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(p2x, p2y); ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(p2x, p2y, 6, 0, 2 * Math.PI); ctx.fill();
      ctx.fillText(`M₂(-${alphaDeg.toFixed(1)}°)`, p2x + 8, p2y + 16);

      if (statusEl) statusEl.innerHTML = `<span style="color: #10b981;">Có nghiệm: Đối xứng qua trục hoành</span>`;
      if (rootsBox) {
        rootsBox.innerHTML = `<p>• $x = \\pm ${alphaDeg.toFixed(1)}^\\circ + k360^\\circ$ ($\\pm ${(alphaRad / Math.PI).toFixed(2)}\\pi + k2\\pi$)</p>`;
      }
    }
  } else if (currentEqType === 'tan') {
    // Trục tiếp tuyến tan x = 1
    const tanX = cx + R;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(tanX, 20); ctx.lineTo(tanX, h - 20); ctx.stroke();
    ctx.fillText('Trục tan', tanX + 6, 30);

    const alphaRad = Math.atan(paramM);
    const alphaDeg = (alphaRad * 180) / Math.PI;
    const tanPtY = cy - paramM * R;

    // Điểm trên trục tan
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(tanX, tanPtY, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillText(`T(1; ${paramM.toFixed(2)})`, tanX + 8, tanPtY + 4);

    // Tia nối từ O qua T cắt đường tròn tại 2 điểm đối xứng qua O
    const p1x = cx + R * Math.cos(alphaRad);
    const p1y = cy - R * Math.sin(alphaRad);
    const p2x = cx - R * Math.cos(alphaRad);
    const p2y = cy + R * Math.sin(alphaRad);

    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(p2x, p2y); ctx.lineTo(tanX, tanPtY); ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(p1x, p1y, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.beginPath(); ctx.arc(p2x, p2y, 5, 0, 2 * Math.PI); ctx.fill();

    if (statusEl) statusEl.innerHTML = `<span style="color: #10b981;">Luôn có nghiệm với mọi m</span>`;
    if (rootsBox) {
      rootsBox.innerHTML = `<p>• $x = ${alphaDeg.toFixed(1)}^\\circ + k180^\\circ$ ($${(alphaRad / Math.PI).toFixed(2)}\\pi + k\\pi$)</p>`;
    }
  }

  renderMathInTree(rootsBox);
  unlockBadge(0);
}

function setPresetM(val) {
  paramM = val;
  const slider = document.getElementById('sliderM');
  const disp = document.getElementById('lab1MVal');
  if (slider) slider.value = val;
  if (disp) disp.textContent = val.toFixed(2);
  drawLab1();
  drawLab2();
  sound.playClick();
}

// --- 5. INTERACTIVE LAB 2: MÁY ĐẾM NGHIỆM TRÊN ĐOẠN ---
let intervalA = 0; // * pi
let intervalB = 2; // * pi

function drawLab2() {
  const canvas = document.getElementById('lab2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;

  ctx.clearRect(0, 0, w, h);

  const stepX = 40; // 40px tương ứng 1 rad
  const stepY = 60; // 60px tương ứng 1 đơn vị

  // Vùng đoạn [a; b] tô màu mờ
  const startPx = cx + intervalA * Math.PI * stepX;
  const endPx = cx + intervalB * Math.PI * stepX;

  ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
  ctx.fillRect(startPx, 0, endPx - startPx, h);

  // Đường viền biên giới hạn
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);
  ctx.beginPath(); ctx.moveTo(startPx, 0); ctx.lineTo(startPx, h); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(endPx, 0); ctx.lineTo(endPx, h); ctx.stroke();
  ctx.setLineDash([]);

  // Trục Ox, Oy
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(10, cy); ctx.lineTo(w - 10, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(cx, h - 10); ctx.lineTo(cx, 10); ctx.stroke();

  // Đồ thị y = f(x)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  let started = false;
  for (let px = 0; px < w; px += 2) {
    const xVal = (px - cx) / stepX;
    let yVal = 0;
    if (currentEqType === 'sin') yVal = Math.sin(xVal);
    else if (currentEqType === 'cos') yVal = Math.cos(xVal);
    else if (currentEqType === 'tan') {
      const cosVal = Math.cos(xVal);
      if (Math.abs(cosVal) < 0.08) { started = false; continue; }
      yVal = Math.tan(xVal);
    }

    const py = cy - yVal * stepY;
    if (py < -30 || py > h + 30) { started = false; continue; }

    if (!started) { ctx.moveTo(px, py); started = true; }
    else { ctx.lineTo(px, py); }
  }
  ctx.stroke();

  // Đường thẳng y = m
  const mPy = cy - paramM * stepY;
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(10, mPy); ctx.lineTo(w - 10, mPy); ctx.stroke();
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`y = ${paramM.toFixed(2)}`, 20, mPy - 6);

  // Tìm các nghiệm trong đoạn [a; b]
  const rootsFound = [];
  const minX = intervalA * Math.PI;
  const maxX = intervalB * Math.PI;

  if (currentEqType === 'sin') {
    if (Math.abs(paramM) <= 1.0) {
      const a1 = Math.asin(paramM);
      const a2 = Math.PI - a1;
      // Duyệt k từ -5 đến 5
      for (let k = -5; k <= 5; k++) {
        const r1 = a1 + k * 2 * Math.PI;
        const r2 = a2 + k * 2 * Math.PI;
        if (r1 >= minX - 1e-4 && r1 <= maxX + 1e-4) rootsFound.push(r1);
        if (Math.abs(r1 - r2) > 1e-4 && r2 >= minX - 1e-4 && r2 <= maxX + 1e-4) rootsFound.push(r2);
      }
    }
  } else if (currentEqType === 'cos') {
    if (Math.abs(paramM) <= 1.0) {
      const a1 = Math.acos(paramM);
      for (let k = -5; k <= 5; k++) {
        const r1 = a1 + k * 2 * Math.PI;
        const r2 = -a1 + k * 2 * Math.PI;
        if (r1 >= minX - 1e-4 && r1 <= maxX + 1e-4) rootsFound.push(r1);
        if (Math.abs(r1 - r2) > 1e-4 && r2 >= minX - 1e-4 && r2 <= maxX + 1e-4) rootsFound.push(r2);
      }
    }
  } else if (currentEqType === 'tan') {
    const a1 = Math.atan(paramM);
    for (let k = -5; k <= 5; k++) {
      const r = a1 + k * Math.PI;
      if (r >= minX - 1e-4 && r <= maxX + 1e-4) rootsFound.push(r);
    }
  }

  // Loại bỏ nghiệm trùng
  rootsFound.sort((a, b) => a - b);
  const uniqueRoots = rootsFound.filter((val, idx, arr) => idx === 0 || Math.abs(val - arr[idx - 1]) > 1e-4);

  // Vẽ các chấm nghiệm sáng chói
  uniqueRoots.forEach(r => {
    const rx = cx + r * stepX;
    const ry = mPy;
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(rx, ry, 6, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();
  });

  // Cập nhật text kết quả
  const countEl = document.getElementById('lab2CountText');
  const listEl = document.getElementById('lab2RootsList');

  if (countEl) countEl.textContent = `${uniqueRoots.length} nghiệm`;
  if (listEl) {
    if (uniqueRoots.length === 0) {
      listEl.innerHTML = '<span style="color: var(--text-muted);">Không có nghiệm nào thuộc đoạn xét này.</span>';
    } else {
      listEl.innerHTML = uniqueRoots.map((r, i) => {
        return `<div>• $x_{${i + 1}} \\approx ${(r / Math.PI).toFixed(2)}\\pi$ (${r.toFixed(3)} rad)</div>`;
      }).join('');
      renderMathInTree(listEl);
    }
  }

  unlockBadge(1);
}

function setIntervalPreset(a, b) {
  intervalA = a;
  intervalB = b;
  const sA = document.getElementById('sliderIntervalA');
  const sB = document.getElementById('sliderIntervalB');
  const dA = document.getElementById('lab2StartVal');
  const dB = document.getElementById('lab2EndVal');
  if (sA) sA.value = a;
  if (sB) sB.value = b;
  if (dA) dA.textContent = `${a}π`;
  if (dB) dB.textContent = `${b}π`;
  drawLab2();
  sound.playClick();
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

  // Lab 1 controls
  const btnSin = document.getElementById('btnEqSin');
  const btnCos = document.getElementById('btnEqCos');
  const btnTan = document.getElementById('btnEqTan');
  const sM = document.getElementById('sliderM');

  const eqBtns = [
    { btn: btnSin, type: 'sin' },
    { btn: btnCos, type: 'cos' },
    { btn: btnTan, type: 'tan' }
  ];

  eqBtns.forEach(item => {
    if (item.btn) {
      item.btn.addEventListener('click', () => {
        eqBtns.forEach(b => b.btn.classList.remove('active'));
        item.btn.classList.add('active');
        currentEqType = item.type;
        drawLab1();
        drawLab2();
        sound.playClick();
      });
    }
  });

  if (sM) {
    sM.addEventListener('input', function() {
      paramM = parseFloat(this.value);
      const valDisp = document.getElementById('lab1MVal');
      if (valDisp) valDisp.textContent = paramM.toFixed(2);
      drawLab1();
      drawLab2();
    });
  }

  // Lab 2 interval controls
  const sIntA = document.getElementById('sliderIntervalA');
  const sIntB = document.getElementById('sliderIntervalB');

  if (sIntA) {
    sIntA.addEventListener('input', function() {
      intervalA = parseFloat(this.value);
      const d = document.getElementById('lab2StartVal');
      if (d) d.textContent = `${intervalA}π`;
      drawLab2();
    });
  }

  if (sIntB) {
    sIntB.addEventListener('input', function() {
      intervalB = parseFloat(this.value);
      const d = document.getElementById('lab2EndVal');
      if (d) d.textContent = `${intervalB}π`;
      drawLab2();
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
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình học Bài 4?')) {
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
