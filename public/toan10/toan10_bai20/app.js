/* ================================================================
   BÀI 20: VỊ TRÍ TƯƠNG ĐỐI GIỮA HAI ĐƯỜNG THẲNG. GÓC VÀ KHOẢNG CÁCH
   Toán 10 Tập 2 (KNTT) • Logic: Web Audio API, Canvas Labs, Đấu Trường SGK 10 Câu.
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
  ["\\cos", "<mi class=\"m-fn\">cos</mi>"],
  ["\\sin", "<mi class=\"m-fn\">sin</mi>"],
  ["\\tan", "<mi class=\"m-fn\">tan</mi>"],
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

  s = s.replace(/\\overrightarrow\{([^}]+)\}/g, (match, inner) => {
    return savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(inner, placeholders) + '</mrow><mo>&#8594;</mo></mover>');
  });

  s = s.replace(/\\vec\{([^}]+)\}/g, (match, inner) => {
    return savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(inner, placeholders) + '</mrow><mo>&#8594;</mo></mover>');
  });

  s = s.replace(/\\(?:dfrac|frac)\{([^{}]+)\}\{([^{}]+)\}/g, (match, num, den) => {
    return savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(num, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(den, placeholders) + '</mrow></mfrac>');
  });

  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, (match, root, rad) => {
    return savePlaceholder('<mroot><mrow>' + convertLatexToMathMLBody(rad, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(root, placeholders) + '</mrow></mroot>');
  });
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (match, rad) => {
    return savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(rad, placeholders) + '</mrow></msqrt>');
  });

  s = s.replace(/\\text\{([^}]+)\}/g, (match, txt) => {
    return savePlaceholder('<mtext>' + txt + '</mtext>');
  });

  for (const [cmd, sym] of mathSymbols) {
    if (s.includes(cmd)) {
      s = s.split(cmd).join(savePlaceholder(sym));
    }
  }

  s = s.replace(/[^\uE000-\uE001]+/g, (chunk) => tokenizePlainMath(chunk));
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

// === 1. WEB AUDIO API ===
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
  userTitle: 'Chuyên Gia Góc & Khoảng Cách',
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
    title: "Bài tập 7.7a (SGK tr.41) - Vị trí tương đối hai đường thẳng",
    pts: 20,
    question: "Vị trí tương đối của hai đường thẳng $\\Delta_1: 3\\sqrt{2}x + \\sqrt{2}y - \\sqrt{3} = 0$ và $\\Delta_2: 6x + 2y - \\sqrt{6} = 0$ là:",
    options: [
      { text: "Trùng nhau", correct: true },
      { text: "Song song", correct: false },
      { text: "Cắt nhau nhưng không vuông góc", correct: false },
      { text: "Vuông góc với nhau", correct: false }
    ],
    explanation: "Xét tỉ số các hệ số:\n$$\\dfrac{6}{3\\sqrt{2}} = \\sqrt{2}, \\quad \\dfrac{2}{\\sqrt{2}} = \\sqrt{2}, \\quad \\dfrac{-\\sqrt{6}}{-\\sqrt{3}} = \\sqrt{2}$$\nVì $\\dfrac{a_2}{a_1} = \\dfrac{b_2}{b_1} = \\dfrac{c_2}{c_1} = \\sqrt{2}$ nên hai đường thẳng $\\Delta_1$ và $\\Delta_2$ trùng nhau."
  },
  {
    id: 2,
    title: "Bài tập 7.7b (SGK tr.41) - Hai đường thẳng song song",
    pts: 20,
    question: "Vị trí tương đối của hai đường thẳng $d_1: x - \\sqrt{3}y + 2 = 0$ và $d_2: \\sqrt{3}x - 3y + 2 = 0$ là:",
    options: [
      { text: "Song song", correct: true },
      { text: "Trùng nhau", correct: false },
      { text: "Cắt nhau tại một điểm", correct: false },
      { text: "Vuông góc với nhau", correct: false }
    ],
    explanation: "Xét tỉ số các hệ số:\n$$\\dfrac{\\sqrt{3}}{1} = \\sqrt{3}, \\quad \\dfrac{-3}{-\\sqrt{3}} = \\sqrt{3}, \\quad \\dfrac{2}{2} = 1$$\nVì $\\dfrac{a_2}{a_1} = \\dfrac{b_2}{b_1} = \\sqrt{3} \\ne \\dfrac{c_2}{c_1} = 1$ nên hai đường thẳng $d_1$ và $d_2$ song song với nhau."
  },
  {
    id: 3,
    title: "Bài tập 7.7c (SGK tr.41) - Toạ độ giao điểm của hai đường thẳng",
    pts: 20,
    question: "Toạ độ giao điểm của hai đường thẳng $m_1: x - 2y + 1 = 0$ và $m_2: 3x + y - 2 = 0$ là:",
    options: [
      { text: "$\\left(\\dfrac{3}{7}; \\dfrac{5}{7}\\right)$", correct: true },
      { text: "$\\left(\\dfrac{5}{7}; \\dfrac{3}{7}\\right)$", correct: false },
      { text: "$\\left(-\\dfrac{3}{7}; \\dfrac{5}{7}\\right)$", correct: false },
      { text: "$(1; 1)$", correct: false }
    ],
    explanation: "Giải hệ phương trình xác định giao điểm:\n$$\\begin{cases} x - 2y = -1 \\\\ 3x + y = 2 \\end{cases} \\iff \\begin{cases} x - 2y = -1 \\\\ 6x + 2y = 4 \\end{cases} \\iff \\begin{cases} 7x = 3 \\implies x = \\dfrac{3}{7} \\\\ y = 2 - 3x = 2 - \\dfrac{9}{7} = \\dfrac{5}{7} \\end{cases}$$"
  },
  {
    id: 4,
    title: "Bài tập 7.8a (SGK tr.41) - Tính góc giữa hai đường thẳng",
    pts: 20,
    question: "Góc $\\varphi$ giữa hai đường thẳng $\\Delta_1: \\sqrt{3}x + y - 4 = 0$ và $\\Delta_2: x + \\sqrt{3}y + 3 = 0$ bằng:",
    options: [
      { text: "$30^\\circ$", correct: true },
      { text: "$45^\\circ$", correct: false },
      { text: "$60^\\circ$", correct: false },
      { text: "$90^\\circ$", correct: false }
    ],
    explanation: "Hai đường thẳng có VTPT $\\vec{n}_1 = (\\sqrt{3}; 1)$ và $\\vec{n}_2 = (1; \\sqrt{3})$. Áp dụng công thức tính góc:\n$$\\cos\\varphi = \\dfrac{|\\vec{n}_1 \\cdot \\vec{n}_2|}{|\\vec{n}_1| \\cdot |\\vec{n}_2|} = \\dfrac{|\\sqrt{3}(1) + 1(\\sqrt{3})|}{\\sqrt{3 + 1} \\cdot \\sqrt{1 + 3}} = \\dfrac{2\\sqrt{3}}{2 \\times 2} = \\dfrac{\\sqrt{3}}{2} \\implies \\varphi = 30^\\circ$$"
  },
  {
    id: 5,
    title: "Bài tập 7.8b (SGK tr.41) - Góc giữa hai đường thẳng tham số",
    pts: 20,
    question: "Góc giữa hai đường thẳng $d_1: \\begin{cases} x = -1 + 2t \\\\ y = 3 + 4t \\end{cases}$ và $d_2: \\begin{cases} x = 3 + s \\\\ y = 1 - 3s \\end{cases}$ bằng:",
    options: [
      { text: "$45^\\circ$", correct: true },
      { text: "$30^\\circ$", correct: false },
      { text: "$60^\\circ$", correct: false },
      { text: "$90^\\circ$", correct: false }
    ],
    explanation: "VTCP của $d_1$ là $\\vec{u}_1 = (2; 4)$ (chọn $\\vec{u}_1 = (1; 2)$) và của $d_2$ là $\\vec{u}_2 = (1; -3)$:\n$$\\cos\\varphi = \\dfrac{|\\vec{u}_1 \\cdot \\vec{u}_2|}{|\\vec{u}_1| \\cdot |\\vec{u}_2|} = \\dfrac{|1(1) + 2(-3)|}{\\sqrt{1 + 4} \\cdot \\sqrt{1 + 9}} = \\dfrac{|-5|}{\\sqrt{5} \\cdot \\sqrt{10}} = \\dfrac{5}{5\\sqrt{2}} = \\dfrac{\\sqrt{2}}{2} \\implies \\varphi = 45^\\circ$$"
  },
  {
    id: 6,
    title: "Bài tập 7.9a (SGK tr.41) - Tính khoảng cách từ điểm đến đường thẳng",
    pts: 20,
    question: "Khoảng cách từ điểm $A(0; -2)$ đến đường thẳng $\\Delta: x + y - 4 = 0$ bằng:",
    options: [
      { text: "$3\\sqrt{2}$", correct: true },
      { text: "$6$", correct: false },
      { text: "$2\\sqrt{3}$", correct: false },
      { text: "$\\sqrt{2}$", correct: false }
    ],
    explanation: "Áp dụng công thức khoảng cách từ điểm $A(x_0; y_0) = (0; -2)$ đến $\\Delta: x + y - 4 = 0$:\n$$d(A, \\Delta) = \\dfrac{|ax_0 + by_0 + c|}{\\sqrt{a^2 + b^2}} = \\dfrac{|1(0) + 1(-2) - 4|}{\\sqrt{1^2 + 1^2}} = \\dfrac{|-6|}{\\sqrt{2}} = \\dfrac{6}{\\sqrt{2}} = 3\\sqrt{2}$$"
  },
  {
    id: 7,
    title: "Bài tập 7.9b (SGK tr.41) - Đường thẳng song song",
    pts: 20,
    question: "Phương trình đường thẳng $a$ đi qua điểm $M(-1; 0)$ và song song với $\\Delta: x + y - 4 = 0$ là:",
    options: [
      { text: "$x + y + 1 = 0$", correct: true },
      { text: "$x + y - 1 = 0$", correct: false },
      { text: "$x - y + 1 = 0$", correct: false },
      { text: "$x + y - 4 = 0$", correct: false }
    ],
    explanation: "Đường thẳng $a \\parallel \\Delta$ nên có cùng VTPT $\\vec{n} = (1; 1)$, phương trình có dạng $x + y + c = 0$ ($c \\ne -4$).\nVì $M(-1; 0) \\in a$ nên: $-1 + 0 + c = 0 \\implies c = 1$. Vậy phương trình là $x + y + 1 = 0$."
  },
  {
    id: 8,
    title: "Bài tập 7.9c (SGK tr.41) - Đường thẳng vuông góc",
    pts: 20,
    question: "Phương trình đường thẳng $b$ đi qua điểm $N(0; 3)$ và vuông góc với $\\Delta: x + y - 4 = 0$ là:",
    options: [
      { text: "$x - y + 3 = 0$", correct: true },
      { text: "$x + y - 3 = 0$", correct: false },
      { text: "$x - y - 3 = 0$", correct: false },
      { text: "$2x - y + 3 = 0$", correct: false }
    ],
    explanation: "Đường thẳng $b \\perp \\Delta$ nên VTPT của $\\Delta$ là $\\vec{n}_\\Delta = (1; 1)$ trở thành VTCP của $b$. Suy ra VTPT của $b$ là $\\vec{n}_b = (1; -1)$.\nPhương trình đường thẳng $b$ qua $N(0; 3)$:\n$$1(x - 0) - 1(y - 3) = 0 \\iff x - y + 3 = 0$$"
  },
  {
    id: 9,
    title: "Bài tập 7.10 (SGK tr.41) - Đường cao & diện tích tam giác",
    pts: 20,
    question: "Cho tam giác $ABC$ có $A(1; 2), B(3; 2)$ và $C(-2; -1)$. Độ dài đường cao $h_A$ và diện tích $S_{ABC}$ lần lượt là:",
    options: [
      { text: "$h_A = \\dfrac{6}{\\sqrt{34}}$ và $S_{ABC} = 3$", correct: true },
      { text: "$h_A = \\dfrac{3}{\\sqrt{34}}$ và $S_{ABC} = 6$", correct: false },
      { text: "$h_A = 3$ và $S_{ABC} = 6$", correct: false },
      { text: "$h_A = \\dfrac{6}{\\sqrt{17}}$ và $S_{ABC} = 3$", correct: false }
    ],
    explanation: "Ta có $\\overrightarrow{BC} = (-2 - 3; -1 - 2) = (-5; -3) \\implies$ VTPT của đường thẳng $BC$ là $\\vec{n} = (3; -5)$.\nPhương trình đường thẳng $BC$ qua $B(3; 2)$:\n$$3(x - 3) - 5(y - 2) = 0 \\iff 3x - 5y + 1 = 0$$\nĐường cao $h_A = d(A, BC) = \\dfrac{|3(1) - 5(2) + 1|}{\\sqrt{3^2 + (-5)^2}} = \\dfrac{|-6|}{\\sqrt{34}} = \\dfrac{6}{\\sqrt{34}}$.\nĐộ dài cạnh đáy $BC = \\sqrt{(-5)^2 + (-3)^2} = \\sqrt{34}$.\nDiện tích: $S_{ABC} = \\dfrac{1}{2} BC \\cdot h_A = \\dfrac{1}{2} \\sqrt{34} \\cdot \\dfrac{6}{\\sqrt{34}} = 3$."
  },
  {
    id: 10,
    title: "Bài tập 7.12 (SGK tr.41) - Định vị nguồn âm thanh",
    pts: 20,
    question: "Ba thiết bị ghi tín hiệu đặt tại $O(0; 0), A(1; 0)$ và $B(1; 3)$ nhận được tín hiệu âm thanh cùng một thời điểm. Toạ độ vị trí phát tín hiệu là:",
    options: [
      { text: "$\\left(\\dfrac{1}{2}; \\dfrac{3}{2}\\right)$", correct: true },
      { text: "$(1; 1)$", correct: false },
      { text: "$\\left(\\dfrac{2}{3}; 1\\right)$", correct: false },
      { text: "$\\left(1; \\dfrac{3}{2}\\right)$", correct: false }
    ],
    explanation: "Do cùng nhận được tín hiệu tại một thời điểm với vận tốc truyền âm không đổi nên điểm phát tín hiệu $M(x; y)$ cách đều ba điểm $O, A, B$.\nTam giác $OAB$ vuông tại $A$ (vì $A(1; 0)$ cùng hoành độ với $B(1; 3)$ và cùng tung độ với $O(0; 0)$). Điểm cách đều ba đỉnh của tam giác vuông chính là trung điểm của cạnh huyền $OB$:\n$$M = \\left(\\dfrac{0 + 1}{2}; \\dfrac{0 + 3}{2}\\right) = \\left(\\dfrac{1}{2}; \\dfrac{3}{2}\\right)$$"
  }
];

// === 4. HUD & QUIZ RENDERING ===
function updateHUD() {
  document.getElementById('xpDisplay').textContent = appState.xp;
  document.getElementById('streakDisplay').textContent = `🔥 ${appState.streak}`;
  document.getElementById('userNameDisplay').textContent = `${appState.userName} 🌟`;
  document.getElementById('userTitle').textContent = appState.userTitle;
  document.getElementById('avatarBtn').textContent = appState.avatar;

  let starStr = '⭐⭐☆☆☆';
  if (appState.xp >= 200) starStr = '⭐⭐⭐⭐⭐';
  else if (appState.xp >= 160) starStr = '⭐⭐⭐⭐☆';
  else if (appState.xp >= 100) starStr = '⭐⭐⭐☆☆';
  document.getElementById('starRating').textContent = starStr;

  const answeredCount = Object.keys(appState.answered).length;
  document.getElementById('arenaProgress').textContent = `${answeredCount}/10`;
  document.getElementById('arenaScore').textContent = `${appState.xp} XP`;

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
    q.options.forEach((opt, idx) => {
      if (opt.correct) allBtns[idx].classList.add('correct');
    });
  }

  const expl = document.getElementById(`expl_${qid}`);
  if (expl) {
    expl.classList.add('show');
    renderMathInTree(expl);
  }

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

// === 5. INTERACTIVE LAB 1: VỊ TRÍ TƯƠNG ĐỐI & GÓC HAI ĐƯỜNG THẲNG ===
function initLab1() {
  const canvas = document.getElementById('relCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sA1 = document.getElementById('sliderA1');
  const sB1 = document.getElementById('sliderB1');
  const sC1 = document.getElementById('sliderC1');

  const sA2 = document.getElementById('sliderA2');
  const sB2 = document.getElementById('sliderB2');
  const sC2 = document.getElementById('sliderC2');

  function draw() {
    let a1 = parseFloat(sA1.value);
    let b1 = parseFloat(sB1.value);
    let c1 = parseFloat(sC1.value);

    let a2 = parseFloat(sA2.value);
    let b2 = parseFloat(sB2.value);
    let c2 = parseFloat(sC2.value);

    // Prevent both a and b = 0
    if (a1 === 0 && b1 === 0) { a1 = 1; sA1.value = 1; }
    if (a2 === 0 && b2 === 0) { a2 = 1; sA2.value = 1; }

    document.getElementById('labelD1').textContent = formatLineEq(a1, b1, c1);
    document.getElementById('labelD2').textContent = formatLineEq(a2, b2, c2);

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 28;

    ctx.clearRect(0, 0, w, h);

    // Grid & Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = cx % scale; x < w; x += scale) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = cy % scale; y < h; y += scale) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

    // Draw Line 1 (Cyan)
    drawLine(ctx, a1, b1, c1, '#06b6d4', cx, cy, scale, w, h);

    // Draw Line 2 (Gold)
    drawLine(ctx, a2, b2, c2, '#f59e0b', cx, cy, scale, w, h);

    // Analyze Relation: D = a1*b2 - a2*b1
    const D = a1 * b2 - a2 * b1;
    const Dx = -c1 * b2 - (-c2) * b1;
    const Dy = a1 * (-c2) - a2 * (-c1);

    const dot = a1 * a2 + b1 * b2;
    const len1 = Math.sqrt(a1 * a1 + b1 * b1);
    const len2 = Math.sqrt(a2 * a2 + b2 * b2);
    const cosPhi = Math.abs(dot) / (len1 * len2);
    const phiDeg = (Math.acos(Math.min(1, Math.max(0, cosPhi))) * 180) / Math.PI;

    document.getElementById('readoutCos').textContent = `cos φ = ${cosPhi.toFixed(3)}`;
    document.getElementById('readoutAngle').textContent = `φ = ${phiDeg.toFixed(1)}°`;

    if (Math.abs(D) > 1e-5) {
      const interX = Dx / D;
      const interY = Dy / D;
      const canX = cx + interX * scale;
      const canY = cy - interY * scale;

      // Draw Intersection Point
      ctx.fillStyle = '#fb7185';
      ctx.beginPath();
      ctx.arc(canX, canY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      if (Math.abs(dot) < 1e-4) {
        document.getElementById('readoutRelState').textContent = '⚡ Vuông góc nhau';
        document.getElementById('readoutRelState').style.color = '#34d399';
      } else {
        document.getElementById('readoutRelState').textContent = '✂️ Cắt nhau tại 1 điểm duy nhất';
        document.getElementById('readoutRelState').style.color = 'var(--cyan-neon)';
      }
      document.getElementById('readoutInter').textContent = `M(${interX.toFixed(2)}; ${interY.toFixed(2)})`;
    } else {
      // D == 0: Parallel or Coincident
      document.getElementById('readoutInter').textContent = 'Không có điểm giao duy nhất';
      if (Math.abs(Dx) < 1e-5 && Math.abs(Dy) < 1e-5) {
        document.getElementById('readoutRelState').textContent = '♾️ Trùng nhau (vô số điểm chung)';
        document.getElementById('readoutRelState').style.color = 'var(--gold-accent)';
      } else {
        document.getElementById('readoutRelState').textContent = '⏸️ Song song (không có điểm chung)';
        document.getElementById('readoutRelState').style.color = '#fb7185';
      }
    }

    unlockBadge(1);
    unlockBadge(2);
  }

  function formatLineEq(a, b, c) {
    let s = '';
    if (a !== 0) s += `${a}x `;
    if (b > 0 && a !== 0) s += `+ ${b}y `;
    else if (b !== 0) s += `${b}y `;
    if (c > 0) s += `+ ${c} = 0`;
    else if (c < 0) s += `- ${Math.abs(c)} = 0`;
    else s += `= 0`;
    return s;
  }

  function drawLine(context, a, b, c, color, cx, cy, scale, w, h) {
    context.strokeStyle = color;
    context.lineWidth = 2.5;
    context.beginPath();
    if (b !== 0) {
      const x1 = -cx / scale;
      const y1 = (-a * x1 - c) / b;
      const x2 = cx / scale;
      const y2 = (-a * x2 - c) / b;
      context.moveTo(cx + x1 * scale, cy - y1 * scale);
      context.lineTo(cx + x2 * scale, cy - y2 * scale);
    } else {
      const xConst = -c / a;
      context.moveTo(cx + xConst * scale, 0);
      context.lineTo(cx + xConst * scale, h);
    }
    context.stroke();
  }

  [sA1, sB1, sC1, sA2, sB2, sC2].forEach(s => s.addEventListener('input', draw));
  draw();
}

// === 6. INTERACTIVE LAB 2: DISTANCE CALCULATOR ===
function initLab2() {
  const canvas = document.getElementById('distCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sMx = document.getElementById('sliderMx');
  const sMy = document.getElementById('sliderMy');
  const sDa = document.getElementById('sliderDa');
  const sDb = document.getElementById('sliderDb');
  const sDc = document.getElementById('sliderDc');

  function draw() {
    const mx = parseFloat(sMx.value);
    const my = parseFloat(sMy.value);
    let a = parseFloat(sDa.value);
    let b = parseFloat(sDb.value);
    const c = parseFloat(sDc.value);

    if (a === 0 && b === 0) { a = 3; sDa.value = 3; }

    document.getElementById('labelPointM').textContent = `M(${mx.toFixed(1)}; ${my.toFixed(1)})`;
    document.getElementById('labelLineDelta').textContent = `${a}x + ${b}y + (${c}) = 0`;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 28;

    ctx.clearRect(0, 0, w, h);

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = cx % scale; x < w; x += scale) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = cy % scale; y < h; y += scale) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

    // Line Delta
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (b !== 0) {
      const x1 = -cx / scale;
      const y1 = (-a * x1 - c) / b;
      const x2 = cx / scale;
      const y2 = (-a * x2 - c) / b;
      ctx.moveTo(cx + x1 * scale, cy - y1 * scale);
      ctx.lineTo(cx + x2 * scale, cy - y2 * scale);
    } else {
      const xConst = -c / a;
      ctx.moveTo(cx + xConst * scale, 0);
      ctx.lineTo(cx + xConst * scale, h);
    }
    ctx.stroke();

    // Distance computation
    const num = Math.abs(a * mx + b * my + c);
    const den = Math.sqrt(a * a + b * b);
    const dist = num / den;

    // Foot H of perpendicular line from M to Delta:
    // H = M - t * (a, b) where a*(mx - t*a) + b*(my - t*b) + c = 0
    // t = (a*mx + b*my + c) / (a^2 + b^2)
    const t = (a * mx + b * my + c) / (a * a + b * b);
    const hx = mx - t * a;
    const hy = my - t * b;

    const canMx = cx + mx * scale;
    const canMy = cy - my * scale;
    const canHx = cx + hx * scale;
    const canHy = cy - hy * scale;

    // Draw perpendicular segment MH
    ctx.strokeStyle = '#fb7185';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(canMx, canMy);
    ctx.lineTo(canHx, canHy);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Point M
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(canMx, canMy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.fillText('M', canMx + 8, canMy - 8);

    // Draw Point H
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(canHx, canHy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.fillText('H', canHx + 8, canHy + 12);

    // Update Readouts
    document.getElementById('readoutNumerator').textContent = `|${a}(${mx}) + ${b}(${my}) + (${c})| = ${num.toFixed(2)}`;
    document.getElementById('readoutDenominator').textContent = `√(${a}² + ${b}²) = ${den.toFixed(2)}`;
    document.getElementById('readoutDistance').textContent = `${dist.toFixed(2)} đơn vị`;
    document.getElementById('readoutFootH').textContent = `H(${hx.toFixed(2)}; ${hy.toFixed(2)})`;

    unlockBadge(3);
  }

  [sMx, sMy, sDa, sDb, sDc].forEach(s => s.addEventListener('input', draw));
  draw();
}

// === 7. INITIALIZATION & EVENTS ===
document.addEventListener('DOMContentLoaded', () => {
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

  const soundToggle = document.getElementById('soundToggle');
  soundToggle.addEventListener('click', () => {
    appState.sound = !appState.sound;
    sfx.enabled = appState.sound;
    soundToggle.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
  });

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

  const btnPrintCert = document.getElementById('btnPrintCert');
  if (btnPrintCert) {
    btnPrintCert.addEventListener('click', () => {
      window.print();
    });
  }

  renderQuiz();
  updateHUD();
  initLab1();
  initLab2();

  renderMathInTree(document.body);
});
