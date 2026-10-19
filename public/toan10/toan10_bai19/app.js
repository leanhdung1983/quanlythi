/* ================================================================
   BÀI 19: PHƯƠNG TRÌNH ĐƯỜNG THẲNG - TOÁN 10 TẬP 2 (KNTT)
   Logic: Web Audio API, Canvas 2D Interactive Labs, Đấu Trường SGK 10 Câu,
   Offline MathML Parser & KaTeX Delimiter Formatter, Printable A4 Certificate.
   ================================================================ */

// === 0. OFFLINE MATHML PARSER & KATEX FALLBACK ===
const mathSymbols = [
  ["\\mathbb{R}", "<mi class=\"m-bb\">&#8477;</mi>"],
  ["\\mathbb{N}", "<mi class=\"m-bb\">&#8469;</mi>"],
  ["\\mathbb{Z}", "<mi class=\"m-bb\">&#8484;</mi>"],
  ["\\mathbb{Q}", "<mi class=\"m-bb\">&#8474;</mi>"],
  ["\\Leftrightarrow", "<mo>&#8660;</mo>"],
  ["\\Rightarrow", "<mo>&#8658;</mo>"],
  ["\\iff", "<mo>&#8660;</mo>"],
  ["\\implies", "<mo>&#8658;</mo>"],
  ["\\approx", "<mo>&#8776;</mo>"],
  ["\\equiv", "<mo>&#8801;</mo>"],
  ["\\forall", "<mo>&#8704;</mo>"],
  ["\\exists", "<mo>&#8707;</mo>"],
  ["\\times", "<mo>&#215;</mo>"],
  ["\\cdot", "<mo>&#8901;</mo>"],
  ["\\perp", "<mo>&#8869;</mo>"],
  ["\\parallel", "<mo>&#8741;</mo>"],
  ["\\alpha", "<mi>&#945;</mi>"],
  ["\\beta", "<mi>&#946;</mi>"],
  ["\\Delta", "<mi>&#916;</mi>"],
  ["\\delta", "<mi>&#948;</mi>"],
  ["\\varphi", "<mi>&#966;</mi>"],
  ["\\pi", "<mi>&#960;</mi>"],
  ["\\geq", "<mo>&#8805;</mo>"],
  ["\\leq", "<mo>&#8804;</mo>"],
  ["\\ge", "<mo>&#8805;</mo>"],
  ["\\le", "<mo>&#8804;</mo>"],
  ["\\neq", "<mo>&#8800;</mo>"],
  ["\\ne", "<mo>&#8800;</mo>"],
  ["\\pm", "<mo>&#177;</mo>"],
  ["\\in", "<mo>&#8712;</mo>"],
  ["\\notin", "<mo>&#8713;</mo>"],
  ["\\circ", "<mo>&#176;</mo>"],
  ["\\quad", "<mspace width=\"0.8em\"/>"],
  ["\\;", "<mspace width=\"0.4em\"/>"],
  ["\\,", "<mspace width=\"0.2em\"/>"]
];

function tokenizePlainMath(raw) {
  if (!raw) return '';
  let out = '';
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < raw.length && /[0-9\.]/.test(raw[i])) {
        num += raw[i];
        i++;
      }
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
    if (/\s/.test(ch)) {
      out += ' ';
      i++;
      continue;
    }
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

  // Handle \overrightarrow{...}
  s = s.replace(/\\overrightarrow\{([^}]+)\}/g, (match, inner) => {
    return savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(inner, placeholders) + '</mrow><mo>&#8594;</mo></mover>');
  });

  // Handle \vec{...}
  s = s.replace(/\\vec\{([^}]+)\}/g, (match, inner) => {
    return savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(inner, placeholders) + '</mrow><mo>&#8594;</mo></mover>');
  });

  // Handle \dfrac, \frac
  s = s.replace(/\\(?:dfrac|frac)\{([^{}]+)\}\{([^{}]+)\}/g, (match, num, den) => {
    return savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(num, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(den, placeholders) + '</mrow></mfrac>');
  });

  // Handle \sqrt[n]{x} and \sqrt{x}
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, (match, root, rad) => {
    return savePlaceholder('<mroot><mrow>' + convertLatexToMathMLBody(rad, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(root, placeholders) + '</mrow></mroot>');
  });
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (match, rad) => {
    return savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(rad, placeholders) + '</mrow></msqrt>');
  });

  // Handle \text{...}
  s = s.replace(/\\text\{([^}]+)\}/g, (match, txt) => {
    return savePlaceholder('<mtext>' + txt + '</mtext>');
  });

  // Replace math symbols
  for (const [cmd, sym] of mathSymbols) {
    if (s.includes(cmd)) {
      s = s.split(cmd).join(savePlaceholder(sym));
    }
  }

  // Tokenize remaining math
  s = s.replace(/[^\uE000-\uE001]+/g, (chunk) => tokenizePlainMath(chunk));

  // Restore placeholders
  s = s.replace(/\uE000(\d+)\uE001/g, (match, idx) => placeholders[parseInt(idx, 10)]);
  return s;
}

function latexToMathML(latex, display = false) {
  const inner = convertLatexToMathMLBody(latex);
  const dispAttr = display ? ' display="block"' : '';
  const cls = display ? ' class="math-block"' : ' class="math-inline"';
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${dispAttr}${cls}>${inner}</math>`;
}

function formatMathText(str) {
  if (!str) return '';
  let out = str.replace(/\$\$([^\$]+?)\$\$/g, (m, f) => latexToMathML(f, true));
  out = out.replace(/\$([^\$\n]+?)\$/g, (m, f) => latexToMathML(f, false));
  return out;
}

function renderMathInTree(root) {
  if (!root) return;
  if (typeof renderMathInElement === 'function') {
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
    } catch (e) {
      console.warn("KaTeX render error, falling back to MathML:", e);
    }
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      const tag = parent.tagName.toLowerCase();
      if (['script', 'style', 'textarea', 'option', 'noscript'].includes(tag) || parent.closest('.katex') || parent.closest('math')) {
        return NodeFilter.FILTER_REJECT;
      }
      return node.nodeValue && node.nodeValue.includes('$') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
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

// === 1. WEB AUDIO API SOUND CONTROLLER ===
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
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq = 440, type = 'sine', duration = 0.15, vol = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playCorrect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.12, 0.15), idx * 70);
    });
  }

  playWrong() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.playTone(260, 'sawtooth', 0.2, 0.2);
    setTimeout(() => this.playTone(195, 'sawtooth', 0.3, 0.2), 150);
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    [440, 554.37, 659.25, 880, 1108.7].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.18, 0.15), i * 90);
    });
  }

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.22, 0.2), idx * 110);
    });
  }
}

const sfx = new SoundController();

// === 2. APP STATE ===
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Hình Học Toạ Độ',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// === 3. SGK ARENA QUIZ DATA (10 QUESTIONS) ===
const quizData = [
  {
    id: 1,
    title: "Khái niệm VTPT & VTCP của đường thẳng",
    pts: 20,
    question: "Cho đường thẳng $\\Delta: 2x - 3y + 6 = 0$. Một vectơ pháp tuyến $\\vec{n}$ và một vectơ chỉ phương $\\vec{u}$ của $\\Delta$ lần lượt là:",
    options: [
      { text: "$\\vec{n} = (2; -3)$ và $\\vec{u} = (3; 2)$", correct: true },
      { text: "$\\vec{n} = (2; 3)$ và $\\vec{u} = (-3; 2)$", correct: false },
      { text: "$\\vec{n} = (-3; 2)$ và $\\vec{u} = (2; -3)$", correct: false },
      { text: "$\\vec{n} = (2; -3)$ và $\\vec{u} = (-3; -2)$", correct: false }
    ],
    explanation: "Đường thẳng $ax + by + c = 0$ có một VTPT là $\\vec{n} = (a; b) = (2; -3)$. Vectơ chỉ phương $\\vec{u} \\perp \\vec{n} \\implies \\vec{n} \\cdot \\vec{u} = 0$, do đó chọn $\\vec{u} = (-b; a) = (3; 2)$ (vì $2(3) + (-3)(2) = 0$)."
  },
  {
    id: 2,
    title: "Bài tập 7.1a (SGK tr.34) - Lập PTTQ khi biết điểm và VTPT",
    pts: 20,
    question: "Phương trình tổng quát của đường thẳng $\\Delta_1$ đi qua điểm $A(1; 3)$ và có vectơ pháp tuyến $\\vec{n} = (2; 1)$ là:",
    options: [
      { text: "$2x + y - 5 = 0$", correct: true },
      { text: "$2x + y + 5 = 0$", correct: false },
      { text: "$x + 2y - 7 = 0$", correct: false },
      { text: "$2x - y + 1 = 0$", correct: false }
    ],
    explanation: "Đường thẳng qua $A(x_0; y_0) = (1; 3)$ có VTPT $\\vec{n} = (a; b) = (2; 1)$ có phương trình:\n$$a(x - x_0) + b(y - y_0) = 0 \\iff 2(x - 1) + 1(y - 3) = 0 \\iff 2x + y - 5 = 0$$"
  },
  {
    id: 3,
    title: "Bài tập 7.1b (SGK tr.34) - Lập PTTS khi biết điểm và VTCP",
    pts: 20,
    question: "Phương trình tham số của đường thẳng $\\Delta_2$ đi qua điểm $B(-2; 1)$ và có vectơ chỉ phương $\\vec{v} = (3; 2)$ là:",
    options: [
      { text: "$\\begin{cases} x = -2 + 3t \\\\ y = 1 + 2t \\end{cases}$", correct: true },
      { text: "$\\begin{cases} x = 3 - 2t \\\\ y = 2 + t \\end{cases}$", correct: false },
      { text: "$\\begin{cases} x = -2 + 2t \\\\ y = 1 + 3t \\end{cases}$", correct: false },
      { text: "$\\begin{cases} x = 2 + 3t \\\\ y = -1 + 2t \\end{cases}$", correct: false }
    ],
    explanation: "Phương trình tham số của đường thẳng đi qua điểm $B(x_0; y_0) = (-2; 1)$ và có VTCP $\\vec{v} = (u_1; u_2) = (3; 2)$ là:\n$$\\begin{cases} x = x_0 + u_1 t \\\\ y = y_0 + u_2 t \\end{cases} \\iff \\begin{cases} x = -2 + 3t \\\\ y = 1 + 2t \\end{cases} \\quad (t \\in \\mathbb{R})$$"
  },
  {
    id: 4,
    title: "Bài tập 7.1c (SGK tr.34) - Lập PTTS đường thẳng qua hai điểm",
    pts: 20,
    question: "Phương trình tham số của đường thẳng $AB$ đi qua hai điểm $A(1; 3)$ và $B(-2; 1)$ là:",
    options: [
      { text: "$\\begin{cases} x = 1 - 3t \\\\ y = 3 - 2t \\end{cases}$", correct: true },
      { text: "$\\begin{cases} x = 1 + 2t \\\\ y = 3 + 3t \\end{cases}$", correct: false },
      { text: "$\\begin{cases} x = -2 + t \\\\ y = 1 + 3t \\end{cases}$", correct: false },
      { text: "$\\begin{cases} x = 1 - 2t \\\\ y = 3 + 3t \\end{cases}$", correct: false }
    ],
    explanation: "Đường thẳng $AB$ đi qua điểm $A(1; 3)$ và nhận $\\overrightarrow{AB} = (-2 - 1; 1 - 3) = (-3; -2)$ làm VTCP. Do đó PTTS là:\n$$\\begin{cases} x = 1 - 3t \\\\ y = 3 - 2t \\end{cases} \\quad (t \\in \\mathbb{R})$$"
  },
  {
    id: 5,
    title: "Bài tập 7.2 (SGK tr.34) - Phương trình tổng quát các trục toạ độ",
    pts: 20,
    question: "Phương trình tổng quát của trục hoành $Ox$ và trục tung $Oy$ trong mặt phẳng $Oxy$ lần lượt là:",
    options: [
      { text: "$Ox: y = 0$ và $Oy: x = 0$", correct: true },
      { text: "$Ox: x = 0$ và $Oy: y = 0$", correct: false },
      { text: "$Ox: x + y = 0$ và $Oy: x - y = 0$", correct: false },
      { text: "$Ox: y = 1$ và $Oy: x = 1$", correct: false }
    ],
    explanation: "Trục hoành $Ox$ đi qua $O(0; 0)$ và có VTPT $\\vec{j} = (0; 1)$ nên có PTTQ: $0(x - 0) + 1(y - 0) = 0 \\iff y = 0$. Trục tung $Oy$ qua $O(0; 0)$ có VTPT $\\vec{i} = (1; 0)$ nên có PTTQ: $1(x - 0) + 0(y - 0) = 0 \\iff x = 0$."
  },
  {
    id: 6,
    title: "Bài tập 7.3a (SGK tr.34) - Chuyển phương trình tham số sang tổng quát",
    pts: 20,
    question: "Cho đường thẳng $\\Delta_1: \\begin{cases} x = 1 + 2t \\\\ y = 3 + 5t \\end{cases}$. Phương trình tổng quát của $\\Delta_1$ là:",
    options: [
      { text: "$5x - 2y + 1 = 0$", correct: true },
      { text: "$2x + 5y - 17 = 0$", correct: false },
      { text: "$5x + 2y - 11 = 0$", correct: false },
      { text: "$5x - 2y - 1 = 0$", correct: false }
    ],
    explanation: "Cách 1: Khử $t$:\n$$t = \\dfrac{x - 1}{2} = \\dfrac{y - 3}{5} \\implies 5(x - 1) = 2(y - 3) \\iff 5x - 5 = 2y - 6 \\iff 5x - 2y + 1 = 0$$\nCách 2: VTCP $\\vec{u} = (2; 5) \\implies$ VTPT $\\vec{n} = (5; -2)$. Qua điểm $(1; 3)$: $5(x - 1) - 2(y - 3) = 5x - 2y + 1 = 0$."
  },
  {
    id: 7,
    title: "Bài tập 7.3b (SGK tr.34) - Chuyển phương trình tổng quát sang tham số",
    pts: 20,
    question: "Một phương trình tham số của đường thẳng $\\Delta_2: 2x + 3y - 5 = 0$ là:",
    options: [
      { text: "$\\begin{cases} x = 1 + 3t \\\\ y = 1 - 2t \\end{cases}$", correct: true },
      { text: "$\\begin{cases} x = 1 + 2t \\\\ y = 1 + 3t \\end{cases}$", correct: false },
      { text: "$\\begin{cases} x = -2 + 3t \\\\ y = 3 + 2t \\end{cases}$", correct: false },
      { text: "$\\begin{cases} x = 2 + 3t \\\\ y = -3 - 2t \\end{cases}$", correct: false }
    ],
    explanation: "Đường thẳng có VTPT $\\vec{n} = (2; 3) \\implies$ VTCP $\\vec{u} = (3; -2)$. Điểm $M(1; 1)$ thuộc đường thẳng vì $2(1) + 3(1) - 5 = 0$. Do đó PTTS là $\\begin{cases} x = 1 + 3t \\\\ y = 1 - 2t \\end{cases}$."
  },
  {
    id: 8,
    title: "Bài tập 7.4a (SGK tr.34) - Lập phương trình đường cao tam giác",
    pts: 20,
    question: "Cho tam giác $ABC$ có $A(1; 2), B(3; 0)$ và $C(-2; -1)$. Phương trình đường cao kẻ từ đỉnh $A$ là:",
    options: [
      { text: "$5x + y - 7 = 0$", correct: true },
      { text: "$5x - y - 3 = 0$", correct: false },
      { text: "$x - 5y + 9 = 0$", correct: false },
      { text: "$5x + y + 7 = 0$", correct: false }
    ],
    explanation: "Đường cao $AH$ vuông góc với $BC$, do đó nhận $\\overrightarrow{BC} = (-2 - 3; -1 - 0) = (-5; -1)$ làm VTPT, hoặc cùng phương với $\\vec{n} = (5; 1)$.\nĐường thẳng đi qua $A(1; 2)$ có phương trình:\n$$5(x - 1) + 1(y - 2) = 0 \\iff 5x + y - 7 = 0$$"
  },
  {
    id: 9,
    title: "Bài tập 7.5 (SGK tr.34) - Phương trình đường thẳng theo đoạn chắn",
    pts: 20,
    question: "Đường thẳng $\\Delta$ cắt trục hoành tại $A(4; 0)$ và cắt trục tung tại $B(0; -3)$ có phương trình tổng quát là:",
    options: [
      { text: "$3x - 4y - 12 = 0$", correct: true },
      { text: "$3x + 4y - 12 = 0$", correct: false },
      { text: "$4x - 3y - 12 = 0$", correct: false },
      { text: "$3x - 4y + 12 = 0$", correct: false }
    ],
    explanation: "Áp dụng phương trình đoạn chắn với $a = 4, b = -3$:\n$$\\dfrac{x}{4} + \\dfrac{y}{-3} = 1 \\iff \\dfrac{x}{4} - \\dfrac{y}{3} = 1 \\iff 3x - 4y = 12 \\iff 3x - 4y - 12 = 0$$"
  },
  {
    id: 10,
    title: "Bài tập 7.6 (SGK tr.35) - Ứng dụng toạ độ hoá chuyến bay",
    pts: 20,
    question: "Chuyến bay từ Hà Nội (vĩ độ $21,2^\\circ$) đến Đà Nẵng (vĩ độ $16,1^\\circ$) có toạ độ vĩ độ $x = 21,2 - \\dfrac{153}{40}t$ ($t$ tính bằng giờ). Thời gian bay là:",
    options: [
      { text: "$\\dfrac{4}{3}$ giờ (1 giờ 20 phút)", correct: true },
      { text: "$1$ giờ $15$ phút", correct: false },
      { text: "$1$ giờ $30$ phút", correct: false },
      { text: "$\\dfrac{5}{4}$ giờ (1 giờ 15 phút)", correct: false }
    ],
    explanation: "Khi máy bay đến Đà Nẵng, vĩ độ $x = 16,1^\\circ$. Ta có phương trình:\n$$21,2 - \\dfrac{153}{40}t = 16,1 \\iff \\dfrac{153}{40}t = 21,2 - 16,1 = 5,1$$\n$$t = \\dfrac{5,1 \\times 40}{153} = \\dfrac{204}{153} = \\dfrac{4}{3} \\text{ (giờ)} = 1 \\text{ giờ } 20 \\text{ phút}$$\nTại thời điểm $t = 1$ h, $x = 21,2 - 3,825 = 17,375^\\circ > 17^\\circ$, máy bay chưa qua vĩ tuyến 17."
  }
];

// === 4. HUD & QUIZ RENDERING ===
function updateHUD() {
  document.getElementById('xpDisplay').textContent = appState.xp;
  document.getElementById('streakDisplay').textContent = `🔥 ${appState.streak}`;
  document.getElementById('userNameDisplay').textContent = `${appState.userName} 🌟`;
  document.getElementById('userTitle').textContent = appState.userTitle;
  document.getElementById('avatarBtn').textContent = appState.avatar;

  // Star rating based on XP
  let starStr = '⭐⭐☆☆☆';
  if (appState.xp >= 200) starStr = '⭐⭐⭐⭐⭐';
  else if (appState.xp >= 160) starStr = '⭐⭐⭐⭐☆';
  else if (appState.xp >= 100) starStr = '⭐⭐⭐☆☆';
  document.getElementById('starRating').textContent = starStr;

  // Progress in Arena
  const answeredCount = Object.keys(appState.answered).length;
  document.getElementById('arenaProgress').textContent = `${answeredCount}/10`;
  document.getElementById('arenaScore').textContent = `${appState.xp} XP`;

  // Certificate student name
  const certName = document.getElementById('certStudentName');
  if (certName) certName.textContent = appState.userName;
}

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  const letters = ['A', 'B', 'C', 'D'];

  quizData.forEach(q => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard_${q.id}`;

    let optsHtml = '';
    q.options.forEach((opt, idx) => {
      optsHtml += `
        <button class="quiz-opt-btn" data-qid="${q.id}" data-idx="${idx}">
          <span class="quiz-opt-letter">${letters[idx]}</span>
          <span class="quiz-opt-text">${opt.text}</span>
        </button>
      `;
    });

    card.innerHTML = `
      <div class="quiz-card-header">
        <span class="quiz-num">CÂU ${q.id}</span>
        <span class="quiz-title">${q.title}</span>
        <span class="quiz-pts">+${q.pts} XP</span>
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options-grid">${optsHtml}</div>
      <div class="explanation-box" id="expl_${q.id}">
        <strong>💡 Lời giải chi tiết:</strong><br>
        <div style="margin-top: 6px; line-height: 1.6;">${q.explanation}</div>
      </div>
    `;

    container.appendChild(card);
  });

  // Bind option clicks
  container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const qid = parseInt(this.dataset.qid, 10);
      const idx = parseInt(this.dataset.idx, 10);
      handleQuizAnswer(qid, idx, this);
    });
  });

  renderMathInTree(container);
}

function handleQuizAnswer(qid, chosenIdx, btnEl) {
  if (appState.answered[qid]) return;
  appState.answered[qid] = true;

  const q = quizData.find(item => item.id === qid);
  if (!q) return;

  const card = document.getElementById(`quizCard_${qid}`);
  const allBtns = card.querySelectorAll('.quiz-opt-btn');
  allBtns.forEach(b => b.classList.add('disabled'));

  const isCorrect = q.options[chosenIdx].correct;

  if (isCorrect) {
    btnEl.classList.add('correct');
    appState.xp += q.pts;
    appState.streak += 1;
    sfx.playCorrect();
  } else {
    btnEl.classList.add('wrong');
    appState.streak = 0;
    sfx.playWrong();
    // Highlight correct answer
    q.options.forEach((opt, idx) => {
      if (opt.correct) allBtns[idx].classList.add('correct');
    });
  }

  // Show explanation
  const expl = document.getElementById(`expl_${qid}`);
  if (expl) {
    expl.classList.add('show');
    renderMathInTree(expl);
  }

  // Check badges
  if (appState.xp >= 160) unlockBadge(4);
  const correctCount = quizData.filter(item => {
    const cardEl = document.getElementById(`quizCard_${item.id}`);
    const correctBtn = cardEl ? cardEl.querySelector('.quiz-opt-btn.correct') : null;
    return correctBtn && !correctBtn.classList.contains('wrong');
  }).length;

  if (correctCount === 10) {
    unlockBadge(5);
    sfx.playFanfare();
  }

  updateHUD();
}

function unlockBadge(badgeNum) {
  const badgeIdx = badgeNum - 1;
  if (appState.badges[badgeIdx]) return;
  appState.badges[badgeIdx] = true;

  const badgeEl = document.getElementById(`badge-${badgeNum}`);
  if (badgeEl) {
    badgeEl.classList.remove('locked');
    badgeEl.classList.add('unlocked');
  }
}

// === 5. INTERACTIVE LAB 1: OXY LINE VISUALIZER ===
function initLab1() {
  const canvas = document.getElementById('lineCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sA = document.getElementById('sliderA');
  const sB = document.getElementById('sliderB');
  const sC = document.getElementById('sliderC');

  function draw() {
    const a = parseFloat(sA.value);
    const b = parseFloat(sB.value);
    const c = parseFloat(sC.value);

    document.getElementById('valA').textContent = a;
    document.getElementById('valB').textContent = b;
    document.getElementById('valC').textContent = c;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 26; // pixels per unit

    ctx.clearRect(0, 0, w, h);

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = cx % scale; x < w; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = cy % scale; y < h; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    // Ox
    ctx.beginPath();
    ctx.moveTo(0, cy);
    ctx.lineTo(w, cy);
    ctx.stroke();
    // Oy
    ctx.beginPath();
    ctx.moveTo(cx, 0);
    ctx.lineTo(cx, h);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.fillText('x', w - 14, cy - 6);
    ctx.fillText('y', cx + 6, 14);
    ctx.fillText('O', cx - 12, cy + 14);

    // Draw Line: a*x + b*y + c = 0
    if (a !== 0 || b !== 0) {
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.beginPath();

      if (b !== 0) {
        // y = (-a*x - c)/b
        const x1 = -cx / scale;
        const y1 = (-a * x1 - c) / b;
        const x2 = cx / scale;
        const y2 = (-a * x2 - c) / b;

        ctx.moveTo(cx + x1 * scale, cy - y1 * scale);
        ctx.lineTo(cx + x2 * scale, cy - y2 * scale);
      } else {
        // x = -c/a
        const xConst = -c / a;
        ctx.moveTo(cx + xConst * scale, 0);
        ctx.lineTo(cx + xConst * scale, h);
      }
      ctx.stroke();

      // Find an anchor point on the line for vectors
      let px = 0, py = 0;
      if (b !== 0) {
        px = 0;
        py = -c / b;
      } else {
        px = -c / a;
        py = 0;
      }
      const canPx = cx + px * scale;
      const canPy = cy - py * scale;

      // Draw Normal Vector n = (a; b)
      ctx.strokeStyle = '#fb7185';
      ctx.fillStyle = '#fb7185';
      ctx.lineWidth = 2.5;
      const nLen = Math.sqrt(a * a + b * b) || 1;
      const nScale = 1.8;
      const nEndX = canPx + (a / nLen) * scale * nScale;
      const nEndY = canPy - (b / nLen) * scale * nScale;

      drawArrow(ctx, canPx, canPy, nEndX, nEndY);
      ctx.fillText('n', nEndX + 4, nEndY - 4);

      // Draw Direction Vector u = (-b; a)
      ctx.strokeStyle = '#34d399';
      ctx.fillStyle = '#34d399';
      ctx.lineWidth = 2.5;
      const uEndX = canPx + (-b / nLen) * scale * nScale;
      const uEndY = canPy - (a / nLen) * scale * nScale;

      drawArrow(ctx, canPx, canPy, uEndX, uEndY);
      ctx.fillText('u', uEndX + 4, uEndY - 4);

      // Point P on line
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(canPx, canPy, 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Update Readouts
    let genStr = '';
    if (a !== 0) genStr += `${a}x `;
    if (b > 0 && a !== 0) genStr += `+ ${b}y `;
    else if (b !== 0) genStr += `${b}y `;
    if (c > 0) genStr += `+ ${c} = 0`;
    else if (c < 0) genStr += `- ${Math.abs(c)} = 0`;
    else genStr += `= 0`;

    document.getElementById('readoutGeneral').textContent = genStr;
    document.getElementById('readoutNormal').textContent = `n = (${a}; ${b})`;
    document.getElementById('readoutDirection').textContent = `u = (${-b}; ${a})`;

    if (b !== 0) {
      const k = -a / b;
      document.getElementById('readoutSlope').textContent = `k = ${k.toFixed(2)}`;
    } else {
      document.getElementById('readoutSlope').textContent = 'k không xác định (đường thẳng đứng)';
    }

    let interStr = '';
    if (a !== 0) interStr += `Ox(${-c / a}; 0) `;
    else interStr += `Ox: song song `;
    if (b !== 0) interStr += `Oy(0; ${-c / b})`;
    else interStr += `Oy: song song`;
    document.getElementById('readoutIntercepts').textContent = interStr;

    unlockBadge(1);
    unlockBadge(2);
  }

  function drawArrow(context, fromx, fromy, tox, toy) {
    const headlen = 8;
    const dx = tox - fromx;
    const dy = toy - fromy;
    const angle = Math.atan2(dy, dx);
    context.beginPath();
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.stroke();
    context.beginPath();
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    context.closePath();
    context.fill();
  }

  [sA, sB, sC].forEach(s => s.addEventListener('input', draw));
  draw();
}

// === 6. INTERACTIVE LAB 2: FLIGHT RADAR SIMULATOR ===
function initLab2() {
  const canvas = document.getElementById('flightCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sT = document.getElementById('sliderT');
  const btnPlay = document.getElementById('btnPlayFlight');
  const btnReset = document.getElementById('btnResetFlight');

  let animId = null;
  let isPlaying = false;

  function render(t) {
    document.getElementById('valT').textContent = `${parseFloat(t).toFixed(2)} giờ`;

    // Coordinates: x = 21.2 - 3.825*t ; y = 105.8 + 1.8*t
    const lat = 21.2 - (153 / 40) * t;
    const lon = 105.8 + (9 / 5) * t;

    document.getElementById('flightCoords').textContent = `${lat.toFixed(2)}° B ; ${lon.toFixed(2)}° Đ`;

    const lat17Status = document.getElementById('lat17Status');
    if (lat <= 17.0) {
      lat17Status.textContent = '✅ ĐÃ VƯỢT QUA VĨ TUYẾN 17° BẮC';
      lat17Status.style.color = '#34d399';
      unlockBadge(3);
    } else {
      lat17Status.textContent = '⏳ Chưa qua vĩ tuyến 17° Bắc';
      lat17Status.style.color = '#94a3b8';
    }

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Radar background grid
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.lineWidth = 1;
    for (let r = 50; r <= 200; r += 50) {
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Mapping lat [15.5, 22.0] and lon [105.0, 109.0] to canvas
    function mapCoords(currLat, currLon) {
      const px = 40 + ((currLon - 105.0) / 4.0) * (w - 80);
      const py = 40 + ((22.0 - currLat) / 6.5) * (h - 80);
      return { x: px, y: py };
    }

    // Latitude 17 line
    const p17Left = mapCoords(17.0, 105.0);
    const p17Right = mapCoords(17.0, 109.0);
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    ctx.beginPath();
    ctx.moveTo(p17Left.x, p17Left.y);
    ctx.lineTo(p17Right.x, p17Right.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fb7185';
    ctx.font = '11px Segoe UI, sans-serif';
    ctx.fillText('Vĩ tuyến 17° Bắc (Hiệp định Genève)', p17Left.x + 10, p17Left.y - 6);

    // Flight route Hanoi -> Da Nang
    const pHanoi = mapCoords(21.2, 105.8);
    const pDaNang = mapCoords(16.1, 108.2);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pHanoi.x, pHanoi.y);
    ctx.lineTo(pDaNang.x, pDaNang.y);
    ctx.stroke();

    // Hanoi marker
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(pHanoi.x, pHanoi.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.fillText('Hà Nội (Nội Bài)', pHanoi.x + 10, pHanoi.y - 4);

    // Da Nang marker
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(pDaNang.x, pDaNang.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('Đà Nẵng', pDaNang.x + 10, pDaNang.y + 14);

    // Current Plane position
    const pCur = mapCoords(lat, lon);
    // Trail
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pHanoi.x, pHanoi.y);
    ctx.lineTo(pCur.x, pCur.y);
    ctx.stroke();

    // Plane icon
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(pCur.x, pCur.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = '16px Segoe UI, sans-serif';
    ctx.fillText('✈️', pCur.x - 9, pCur.y + 6);
  }

  sT.addEventListener('input', () => {
    if (isPlaying) stopAnim();
    render(parseFloat(sT.value));
  });

  function stopAnim() {
    isPlaying = false;
    cancelAnimationFrame(animId);
    btnPlay.textContent = '▶️ Tiếp Tục Bay';
  }

  btnPlay.addEventListener('click', () => {
    if (isPlaying) {
      stopAnim();
    } else {
      isPlaying = true;
      btnPlay.textContent = '⏸️ Tạm Dừng';
      let curr = parseFloat(sT.value);
      if (curr >= 1.33) curr = 0;

      function step() {
        curr += 0.006;
        if (curr > 1.333) {
          curr = 1.333;
          sT.value = curr;
          render(curr);
          stopAnim();
          btnPlay.textContent = '▶️ Bay Lại';
          sfx.playFanfare();
          return;
        }
        sT.value = curr;
        render(curr);
        animId = requestAnimationFrame(step);
      }
      animId = requestAnimationFrame(step);
    }
  });

  btnReset.addEventListener('click', () => {
    stopAnim();
    sT.value = 0;
    btnPlay.textContent = '▶️ Bắt Đầu Bay';
    render(0);
  });

  render(0);
}

// === 7. INITIALIZATION & EVENTS ===
document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `tab-${tab.dataset.tab}`;
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
        renderMathInTree(targetContent);
      }
      sfx.playTone(520, 'sine', 0.08, 0.05);
    });
  });

  // Sound toggle
  const soundToggle = document.getElementById('soundToggle');
  soundToggle.addEventListener('click', () => {
    appState.sound = !appState.sound;
    sfx.enabled = appState.sound;
    soundToggle.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
  });

  // Reset Progress
  const resetBtn = document.getElementById('resetProgress');
  resetBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ điểm và huy hiệu không?')) {
      appState.xp = 0;
      appState.streak = 0;
      appState.answered = {};
      appState.badges = [false, false, false, false, false];
      document.querySelectorAll('.badge-item').forEach(b => {
        b.classList.remove('unlocked');
        b.classList.add('locked');
      });
      renderQuiz();
      updateHUD();
    }
  });

  // Avatar Modal
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const avatarChoices = document.querySelectorAll('.avatar-choice');

  avatarBtn.addEventListener('click', () => {
    avatarModal.style.display = 'flex';
    avatarModal.classList.add('active');
  });

  avatarChoices.forEach(choice => {
    choice.addEventListener('click', () => {
      avatarChoices.forEach(c => c.classList.remove('selected'));
      choice.classList.add('selected');
      appState.avatar = choice.dataset.avatar;
      appState.userTitle = choice.dataset.title;
      sfx.playTone(660, 'sine', 0.1, 0.1);
    });
  });

  btnCloseModal.addEventListener('click', () => {
    avatarModal.style.display = 'none';
    avatarModal.classList.remove('active');
    updateHUD();
  });

  // Certificate Print
  const btnPrintCert = document.getElementById('btnPrintCert');
  if (btnPrintCert) {
    btnPrintCert.addEventListener('click', () => {
      window.print();
    });
  }

  // Init Components
  renderQuiz();
  updateHUD();
  initLab1();
  initLab2();

  renderMathInTree(document.body);
});
