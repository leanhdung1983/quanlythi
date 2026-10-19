// ==========================================
// TOÁN 12 - BÀI 12: TÍCH PHÂN
// KẾT NỐI TRI THỨC VỚI CUỘC SỐNG
// ==========================================

// Web Audio API Sound System
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type, duration, gainVal = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
  playClick() {
    this.playTone(600, 'sine', 0.08, 0.05);
  }
  playCorrect() {
    this.playTone(523.25, 'sine', 0.12, 0.1);
    setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.1), 100);
    setTimeout(() => this.playTone(783.99, 'sine', 0.25, 0.12), 220);
  }
  playWrong() {
    this.playTone(330, 'sawtooth', 0.15, 0.08);
    setTimeout(() => this.playTone(220, 'sawtooth', 0.25, 0.08), 120);
  }
  playLevelUp() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.2, 0.1), idx * 100);
    });
  }
  playFanfare() {
    const notes = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5];
    const delays = [0, 120, 240, 360, 480, 650];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.35, 0.12), delays[idx]);
    });
  }
}

const sounds = new SoundSystem();

// KaTeX & MathML Fallback Parser
function renderMathInTree(root = document.body) {
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
      console.warn('KaTeX error:', e);
    }
  }
  fallbackRenderMathML(root);
}

function fallbackRenderMathML(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement && (node.parentElement.tagName === 'SCRIPT' || node.parentElement.tagName === 'STYLE' || node.parentElement.closest('math'))) {
      continue;
    }
    if (node.nodeValue.includes('$')) {
      textNodes.push(node);
    }
  }

  textNodes.forEach(tNode => {
    const parent = tNode.parentNode;
    if (!parent) return;
    const text = tNode.nodeValue;
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g);
    if (parts.length <= 1) return;

    const frag = document.createDocumentFragment();
    parts.forEach(part => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const mathCode = part.slice(2, -2).trim();
        const span = document.createElement('span');
        span.className = 'math-block';
        span.innerHTML = latexToMathML(mathCode, true);
        frag.appendChild(span);
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const mathCode = part.slice(1, -1).trim();
        const span = document.createElement('span');
        span.className = 'math-inline';
        span.innerHTML = latexToMathML(mathCode, false);
        frag.appendChild(span);
      } else if (part.length > 0) {
        frag.appendChild(document.createTextNode(part));
      }
    });
    parent.replaceChild(frag, tNode);
  });
}

const mathSymbols = [
  ["\\mathbb{R}", "<mi class=\"m-bb\">&#8477;</mi>"],
  ["\\mathbb{N}", "<mi class=\"m-bb\">&#8469;</mi>"],
  ["\\mathbb{Z}", "<mi class=\"m-bb\">&#8484;</mi>"],
  ["\\int", "<mo>&#8747;</mo>"],
  ["\\approx", "<mo>&#8776;</mo>"],
  ["\\neq", "<mo>&#8800;</mo>"],
  ["\\ne", "<mo>&#8800;</mo>"],
  ["\\leq", "<mo>&#8804;</mo>"],
  ["\\le", "<mo>&#8804;</mo>"],
  ["\\geq", "<mo>&#8805;</mo>"],
  ["\\ge", "<mo>&#8805;</mo>"],
  ["\\pm", "<mo>&#177;</mo>"],
  ["\\times", "<mo>&#215;</mo>"],
  ["\\cdot", "<mo>&#8901;</mo>"],
  ["\\in", "<mo>&#8712;</mo>"],
  ["\\notin", "<mo>&#8713;</mo>"],
  ["\\infty", "<mo>&#8734;</mo>"],
  ["\\alpha", "<mi>&#945;</mi>"],
  ["\\beta", "<mi>&#946;</mi>"],
  ["\\pi", "<mi>&#960;</mi>"],
  ["\\sin", "<mi class=\"m-fn\">sin</mi>"],
  ["\\cos", "<mi class=\"m-fn\">cos</mi>"],
  ["\\tan", "<mi class=\"m-fn\">tan</mi>"],
  ["\\cot", "<mi class=\"m-fn\">cot</mi>"],
  ["\\ln", "<mi class=\"m-fn\">ln</mi>"],
  ["\\log", "<mi class=\"m-fn\">log</mi>"],
  ["\\quad", "<mspace width=\"0.8em\"/>"],
  ["\\qquad", "<mspace width=\"1.5em\"/>"],
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
      while (i < raw.length && /[0-9\\.]/.test(raw[i])) { num += raw[i]; i++; }
      out += '<mn>' + num + '</mn>';
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      out += '<mi>' + ch + '</mi>';
      i++;
      continue;
    }
    if (/[\\+\\-\\=\\/\\<\\>\\(\\)\\[\\]\\{\\}\\,\\;\\:\\!\\?\\|\\']/.test(ch)) {
      let op = ch;
      if (op === '<') op = '&lt;';
      else if (op === '>') op = '&gt;';
      out += '<mo>' + op + '</mo>';
      i++;
      continue;
    }
    if (/\\s/.test(ch)) { out += ' '; i++; continue; }
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

  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, (m, n, x) => savePlaceholder('<mroot><mrow>' + convertLatexToMathMLBody(x, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow></mroot>'));
  let prevSqrt;
  do {
    prevSqrt = s;
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));
  } while (s !== prevSqrt);

  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
  } while (s !== prevFrac);

  for (const [k, v] of mathSymbols) {
    if (s.includes(k)) s = s.split(k).join(savePlaceholder(v));
  }

  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)\^\{([^{}]+)\}/g, (m, b, exp) => savePlaceholder('<msup><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(exp, placeholders) + '</mrow></msup>'));
  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)\^([a-zA-Z0-9])/g, (m, b, exp) => savePlaceholder('<msup><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(exp, placeholders) + '</mrow></msup>'));
  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)_\{([^{}]+)\}/g, (m, b, sub) => savePlaceholder('<msub><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(sub, placeholders) + '</mrow></msub>'));
  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)_([a-zA-Z0-9])/g, (m, b, sub) => savePlaceholder('<msub><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(sub, placeholders) + '</mrow></msub>'));

  const parts = s.split(/(\uE000\d+\uE001)/g);
  let finalOut = '';
  for (const part of parts) {
    if (!part) continue;
    const phMatch = part.match(/^\uE000(\d+)\uE001$/);
    if (phMatch) {
      let phContent = placeholders[parseInt(phMatch[1])];
      if (phContent) {
        while (phContent.includes('\uE000')) {
          phContent = phContent.replace(/\uE000(\d+)\uE001/g, (m, idx) => placeholders[parseInt(idx)] || '');
        }
        finalOut += phContent;
      }
    } else {
      finalOut += tokenizePlainMath(part);
    }
  }
  return finalOut;
}

function latexToMathML(latex, isBlock = false) {
  if (typeof window !== "undefined" && window.katex && typeof window.katex.renderToString === "function") {
    try {
      return window.katex.renderToString(latex, { throwOnError: false, displayMode: isBlock });
    } catch (e) {}
  }
  const placeholders = [];
  const body = convertLatexToMathMLBody(latex, placeholders);
  return '<math xmlns="http://www.w3.org/1998/Math/MathML"' + (isBlock ? ' display="block"' : '') + '><mrow>' + body + '</mrow></math>';
}

function formatMathText(str) {
  if (typeof str !== 'string') return str;
  let res = str.replace(/\$\$([\s\S]+?)\$\$/g, (m, c) => '<div class="math-block">' + latexToMathML(c, true) + '</div>');
  res = res.replace(/\$([^\$\n]+?)\$/g, (m, c) => '<span class="math-inline">' + latexToMathML(c, false) + '</span>');
  return res;
}

// App State
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Tích Phân Newton-Leibniz',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// Quiz Data - 10 câu hỏi chuẩn SGK Toán 12 KNTT Bài 12 (Trang 18)
const quizData = [
  {
    id: 1,
    title: "Câu 1 (Bài 4.8b SGK - Ý nghĩa hình học của tích phân)",
    pts: 20,
    question: "Sử dụng ý nghĩa hình học của tích phân, tính giá trị của $\\int_{-3}^3 \\sqrt{9 - x^2}dx$:",
    options: [
      { text: "A. $\\frac{9\\pi}{2}$", correct: true },
      { text: "B. $9\\pi$", correct: false },
      { text: "C. $18$", correct: false },
      { text: "D. $\\frac{9\\pi}{4}$", correct: false }
    ],
    explanation: "Đồ thị $y = \\sqrt{9 - x^2}$ là nửa phía trên trục hoành của đường tròn tâm $O$, bán kính $R = 3$. Tích phân $\\int_{-3}^3 \\sqrt{9 - x^2}dx$ chính là diện tích nửa hình tròn này: $S = \\frac{1}{2}\\pi R^2 = \\frac{1}{2}\\pi (3^2) = \\frac{9\\pi}{2}$."
  },
  {
    id: 2,
    title: "Câu 2 (Bài 4.9d SGK - Tính chất tuyến tính của tích phân)",
    pts: 20,
    question: "Cho $\\int_0^3 f(x)dx = 5$ và $\\int_0^3 g(x)dx = 2$. Giá trị của $\\int_0^3 [2f(x) - 3g(x)]dx$ bằng:",
    options: [
      { text: "A. $4$", correct: true },
      { text: "B. $16$", correct: false },
      { text: "C. $10$", correct: false },
      { text: "D. $-1$", correct: false }
    ],
    explanation: "Áp dụng tính chất tuyến tính của tích phân: $\\int_0^3 [2f(x) - 3g(x)]dx = 2\\int_0^3 f(x)dx - 3\\int_0^3 g(x)dx = 2(5) - 3(2) = 10 - 6 = 4$."
  },
  {
    id: 3,
    title: "Câu 3 (Bài 4.10a SGK - Tích phân hàm đa thức)",
    pts: 20,
    question: "Tính tích phân $I = \\int_0^3 (3x - 1)^2 dx$:",
    options: [
      { text: "A. $57$", correct: true },
      { text: "B. $78$", correct: false },
      { text: "C. $63$", correct: false },
      { text: "D. $51$", correct: false }
    ],
    explanation: "Khai triển biểu thức: $(3x - 1)^2 = 9x^2 - 6x + 1$. Tích phân: $I = \\left. \\left(3x^3 - 3x^2 + x\\right) \\right|_0^3 = (3\\cdot 27 - 3\\cdot 9 + 3) - 0 = 81 - 27 + 3 = 57$."
  },
  {
    id: 4,
    title: "Câu 4 (Bài 4.10b SGK - Tích phân hàm lượng giác)",
    pts: 20,
    question: "Tính tích phân $I = \\int_0^{\\pi/2} (1 + \\sin x)dx$:",
    options: [
      { text: "A. $\\frac{\\pi}{2} + 1$", correct: true },
      { text: "B. $\\frac{\\pi}{2} - 1$", correct: false },
      { text: "C. $\\pi + 1$", correct: false },
      { text: "D. $\\frac{\\pi}{2}$", correct: false }
    ],
    explanation: "Một nguyên hàm của $1 + \\sin x$ là $x - \\cos x$. Ta có: $I = \\left. (x - \\cos x) \\right|_0^{\\pi/2} = \\left(\\frac{\\pi}{2} - \\cos\\frac{\\pi}{2}\\right) - (0 - \\cos 0) = \\left(\\frac{\\pi}{2} - 0\\right) - (-1) = \\frac{\\pi}{2} + 1$."
  },
  {
    id: 5,
    title: "Câu 5 (Bài 4.10c SGK - Tích phân hàm số mũ)",
    pts: 20,
    question: "Tính tích phân $I = \\int_0^1 (e^{2x} + 3x^2)dx$:",
    options: [
      { text: "A. $\\frac{e^2 + 1}{2}$", correct: true },
      { text: "B. $\\frac{e^2 - 1}{2}$", correct: false },
      { text: "C. $e^2 + 1$", correct: false },
      { text: "D. $\\frac{e^2 + 3}{2}$", correct: false }
    ],
    explanation: "Nguyên hàm: $\\int (e^{2x} + 3x^2)dx = \\frac{e^{2x}}{2} + x^3$. Do đó: $I = \\left. \\left(\\frac{e^{2x}}{2} + x^3\\right) \\right|_0^1 = \\left(\\frac{e^2}{2} + 1\\right) - \\left(\\frac{1}{2} + 0\\right) = \\frac{e^2 - 1}{2} + 1 = \\frac{e^2 + 1}{2}$."
  },
  {
    id: 6,
    title: "Câu 6 (Bài 4.10d SGK - Tích phân chứa dấu giá trị tuyệt đối)",
    pts: 20,
    question: "Tính tích phân $I = \\int_1^2 |2x + 1|dx$:",
    options: [
      { text: "A. $4$", correct: true },
      { text: "B. $5$", correct: false },
      { text: "C. $3$", correct: false },
      { text: "D. $6$", correct: false }
    ],
    explanation: "Với mọi $x \\in [1; 2]$, ta có $2x + 1 > 0$ nên $|2x + 1| = 2x + 1$. Khi đó: $I = \\int_1^2 (2x + 1)dx = \\left. (x^2 + x) \\right|_1^2 = (4 + 2) - (1 + 1) = 6 - 2 = 4$."
  },
  {
    id: 7,
    title: "Câu 7 (Luyện tập tính chất - Đổi cận và chèn cận)",
    pts: 20,
    question: "Cho $\\int_0^2 f(x)dx = 3$ và $\\int_2^5 f(x)dx = -1$. Giá trị của tích phân $\\int_5^0 f(x)dx$ bằng:",
    options: [
      { text: "A. $-2$", correct: true },
      { text: "B. $2$", correct: false },
      { text: "C. $-4$", correct: false },
      { text: "D. $4$", correct: false }
    ],
    explanation: "Áp dụng tính chất chèn cận: $\\int_0^5 f(x)dx = \\int_0^2 f(x)dx + \\int_2^5 f(x)dx = 3 + (-1) = 2$. Do quy ước đảo cận: $\\int_5^0 f(x)dx = -\\int_0^5 f(x)dx = -2$."
  },
  {
    id: 8,
    title: "Câu 8 (Bài 4.11a SGK - Độ dịch chuyển trong chuyển động)",
    pts: 20,
    question: "Một vật chuyển động có vận tốc $v(t) = t^2 - t - 6$ (m/s). Độ dịch chuyển của vật trong khoảng thời gian $1 \\le t \\le 4$ là:",
    options: [
      { text: "A. $-4{,}5\\text{ m}$", correct: true },
      { text: "B. $10{,}17\\text{ m}$", correct: false },
      { text: "C. $4{,}5\\text{ m}$", correct: false },
      { text: "D. $-9{,}0\\text{ m}$", correct: false }
    ],
    explanation: "Độ dịch chuyển: $\\Delta s = \\int_1^4 v(t)dt = \\int_1^4 (t^2 - t - 6)dt = \\left. \\left(\\frac{t^3}{3} - \\frac{t^2}{2} - 6t\\right) \\right|_1^4 = \\left(\\frac{64}{3} - 8 - 24\\right) - \\left(\\frac{1}{3} - \\frac{1}{2} - 6\\right) = -\\frac{32}{3} - \\left(-\\frac{37}{6}\\right) = -\\frac{9}{2} = -4{,}5\\text{ m}$."
  },
  {
    id: 9,
    title: "Câu 9 (Bài 4.11b SGK - Tổng quãng đường chuyển động)",
    pts: 20,
    question: "Với vận tốc $v(t) = t^2 - t - 6$ (m/s), tổng quãng đường vật thực sự đi được trong khoảng thời gian $1 \\le t \\le 4$ là:",
    options: [
      { text: "A. $\\frac{61}{6}\\text{ m} \\approx 10{,}17\\text{ m}$", correct: true },
      { text: "B. $4{,}5\\text{ m}$", correct: false },
      { text: "C. $8{,}33\\text{ m}$", correct: false },
      { text: "D. $\\frac{55}{6}\\text{ m}$", correct: false }
    ],
    explanation: "Ta có $v(t) = (t - 3)(t + 2)$. Trên $[1; 3]$ thì $v(t) \\le 0$, trên $[3; 4]$ thì $v(t) \\ge 0$. Tổng quãng đường là $S = \\int_1^4 |v(t)|dt = -\\int_1^3 (t^2 - t - 6)dt + \\int_3^4 (t^2 - t - 6)dt = -\\left(-\\frac{22}{3}\\right) + \\frac{17}{6} = \\frac{22}{3} + \\frac{17}{6} = \\frac{61}{6}\\text{ m} \\approx 10{,}17\\text{ m}$."
  },
  {
    id: 10,
    title: "Câu 10 (Vận dụng 2 SGK Trang 17 - Nhiệt độ trung bình trong ngày)",
    pts: 20,
    question: "Nhiệt độ $T$ $(\\text{°C})$ từ 6 giờ sáng đến 12 giờ trưa được mô hình hóa bởi $T(t) = 20 + 1{,}5(t - 6)$ ($6 \\le t \\le 12$). Nhiệt độ trung bình trong khoảng thời gian này là:",
    options: [
      { text: "A. $24{,}5\\text{ °C}$", correct: true },
      { text: "B. $29{,}0\\text{ °C}$", correct: false },
      { text: "C. $22{,}5\\text{ °C}$", correct: false },
      { text: "D. $25{,}0\\text{ °C}$", correct: false }
    ],
    explanation: "Áp dụng định nghĩa giá trị trung bình: $\\mu = \\frac{1}{12 - 6}\\int_6^{12} [20 + 1{,}5(t - 6)]dt$. Đặt $u = t - 6 \\Rightarrow \\mu = \\frac{1}{6}\\int_0^6 (20 + 1{,}5u)du = \\frac{1}{6}\\left. \\left(20u + 0{,}75u^2\\right) \\right|_0^6 = \\frac{1}{6}(120 + 27) = \\frac{147}{6} = 24{,}5\\text{ °C}$."
  }
];

// Document Ready
document.addEventListener('DOMContentLoaded', () => {
  renderMathInTree(document.body);
  initHUD();
  initTabs();
  initLab1();
  initLab2();
  initArena();
  initCertAndModal();
});

function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const sections = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sounds.playClick();
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      tab.classList.add('active');
      const target = document.getElementById('tab-' + tab.dataset.tab);
      if (target) {
        target.classList.add('active');
        renderMathInTree(target);
      }

      if (tab.dataset.tab === 'theory' && !appState.badges[0]) {
        unlockBadge(0);
      }
    });
  });
}

function initHUD() {
  const soundToggle = document.getElementById('soundToggle');
  const resetBtn = document.getElementById('resetProgress');

  soundToggle.addEventListener('click', () => {
    appState.sound = !appState.sound;
    sounds.enabled = appState.sound;
    soundToggle.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
  });

  resetBtn.addEventListener('click', () => {
    if (confirm('Làm mới lại tiến trình học tập Bài 12?')) {
      appState.xp = 0;
      appState.streak = 0;
      appState.stars = 2;
      appState.answered = {};
      appState.badges = [false, false, false, false, false];
      updateHUD();
      initArena();
      for (let i = 1; i <= 5; i++) {
        const b = document.getElementById('badge-' + i);
        if (b) b.classList.remove('unlocked');
      }
      sounds.playTone(300, 'sine', 0.2);
    }
  });

  updateHUD();
}

function updateHUD() {
  document.getElementById('xpDisplay').textContent = appState.xp;
  document.getElementById('streakDisplay').textContent = '🔥 ' + appState.streak;
  document.getElementById('arenaScore').textContent = appState.xp + ' XP';

  let starStr = '';
  for (let i = 1; i <= 5; i++) starStr += i <= appState.stars ? '⭐' : '☆';
  document.getElementById('starRating').textContent = starStr;

  const certXP = document.getElementById('certXP');
  if (certXP) certXP.textContent = appState.xp + ' XP';
  const certRank = document.getElementById('certRank');
  if (certRank) {
    if (appState.xp >= 180) certRank.textContent = 'Xuất Sắc 🏆';
    else if (appState.xp >= 140) certRank.textContent = 'Giỏi 🌟';
    else certRank.textContent = 'Đạt Yêu Cầu 👍';
  }
}

function addXP(amount) {
  appState.xp += amount;
  if (appState.xp >= 100 && appState.stars < 3) {
    appState.stars = 3;
    sounds.playLevelUp();
  }
  if (appState.xp >= 160 && appState.stars < 4) {
    appState.stars = 4;
    sounds.playLevelUp();
  }
  if (appState.xp >= 200 && appState.stars < 5) {
    appState.stars = 5;
    sounds.playFanfare();
  }
  updateHUD();
}

function unlockBadge(index) {
  if (appState.badges[index]) return;
  appState.badges[index] = true;
  const badgeCard = document.getElementById('badge-' + (index + 1));
  if (badgeCard) badgeCard.classList.add('unlocked');
  sounds.playLevelUp();
}

// ==========================================
// LAB 1: TỔNG RIEMANN & XẤP XỈ DIỆN TÍCH
// ==========================================
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const selectFunc = document.getElementById('lab1FuncSelect');
  const sliderN = document.getElementById('lab1SliderN');
  const sliderB = document.getElementById('lab1SliderB');
  const valN = document.getElementById('lab1ValN');
  const valB = document.getElementById('lab1ValB');
  const output = document.getElementById('lab1Output');

  function drawLab1() {
    const fnType = selectFunc.value;
    const n = parseInt(sliderN.value);
    const b = parseFloat(sliderB.value);
    valN.textContent = n;
    valB.textContent = b.toFixed(1);

    const a = 0;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const ox = 50;
    const oy = h - 45;
    const scaleX = (w - 90) / 3.2;
    const scaleY = (h - 80) / 4.5;

    // Grid & Axes
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x <= 3.2; x += 0.5) {
      const px = ox + x * scaleX;
      ctx.beginPath(); ctx.moveTo(px, 20); ctx.lineTo(px, oy); ctx.stroke();
    }
    for (let y = 0; y <= 4.5; y += 1) {
      const py = oy - y * scaleY;
      ctx.beginPath(); ctx.moveTo(ox, py); ctx.lineTo(w - 20, py); ctx.stroke();
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(20, oy); ctx.lineTo(w - 20, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, h - 20); ctx.lineTo(ox, 20); ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('x', w - 15, oy + 15);
    ctx.fillText('y', ox - 15, 18);
    ctx.fillText('0', ox - 10, oy + 15);

    // Math function definitions
    let f, exactIntegral, fnTeX;
    if (fnType === 'quad') {
      f = x => x * x;
      exactIntegral = (b * b * b) / 3;
      fnTeX = 'f(x) = x^2';
    } else if (fnType === 'sqrt') {
      f = x => Math.sqrt(x);
      exactIntegral = (2 / 3) * Math.pow(b, 1.5);
      fnTeX = 'f(x) = \\sqrt{x}';
    } else if (fnType === 'trig') {
      f = x => Math.sin(x) + 1.2;
      exactIntegral = (1.2 * b) - Math.cos(b) + 1;
      fnTeX = 'f(x) = \\sin x + 1{,}2';
    } else {
      f = x => Math.exp(0.5 * x);
      exactIntegral = 2 * (Math.exp(0.5 * b) - 1);
      fnTeX = 'f(x) = e^{0{,}5x}';
    }

    // 1. Draw Riemann Rectangles (Left endpoint sum)
    const deltaX = (b - a) / n;
    let riemannSum = 0;

    ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 1;

    for (let i = 0; i < n; i++) {
      const xi = a + i * deltaX;
      const xMid = xi + deltaX / 2;
      const yi = f(xMid);
      riemannSum += yi * deltaX;

      const px = ox + xi * scaleX;
      const rectW = deltaX * scaleX;
      const rectH = yi * scaleY;
      const py = oy - rectH;

      ctx.fillRect(px, py, rectW, rectH);
      ctx.strokeRect(px, py, rectW, rectH);
    }

    // 2. Draw Continuous Curve f(x)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let started = false;
    for (let px = ox; px <= ox + 3.2 * scaleX; px += 2) {
      const x = (px - ox) / scaleX;
      const y = f(x);
      const py = oy - y * scaleY;
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 3. Mark bounds a and b
    const pb = ox + b * scaleX;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(pb, oy); ctx.lineTo(pb, oy - f(b) * scaleY); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`b = ${b.toFixed(1)}`, pb - 15, oy + 15);

    // Legends & Stats
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`Hàm ${fnTeX}`, 60, 30);
    ctx.fillStyle = '#818cf8';
    ctx.fillText(`Tổng Riemann (${n} dải): S_n ≈ ${riemannSum.toFixed(4)}`, 60, 50);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`Tích phân chính xác: ∫ f(x)dx = ${exactIntegral.toFixed(4)}`, 60, 70);

    const error = Math.abs(riemannSum - exactIntegral);
    output.innerHTML = `
      <strong>📊 Phân tích hội tụ tích phân:</strong><br>
      • Hàm số: $${fnTeX}$ trên $[0; ${b.toFixed(1)}]$.<br>
      • Tổng Riemann ($n = ${n}$ hình chữ nhật): $S_{${n}} = \\sum_{i=1}^{${n}} f(x_i^*)\\Delta x = \\mathbf{${riemannSum.toFixed(4)}}$.<br>
      • Giá trị tích phân chuẩn Newton-Leibniz: $I = \\int_0^{${b.toFixed(1)}} f(x)dx = \\mathbf{${exactIntegral.toFixed(4)}}$.<br>
      • Sai số xấp xỉ: $\\Delta = |S_{${n}} - I| = \\mathbf{${error.toFixed(4)}}$. Khi tăng $n \\to \\infty$, sai số tiệm cận về $0$!
    `;
    renderMathInTree(output);

    if (!appState.badges[2]) unlockBadge(2);
  }

  selectFunc.addEventListener('change', drawLab1);
  sliderN.addEventListener('input', drawLab1);
  sliderB.addEventListener('input', drawLab1);
  drawLab1();
}

// ==========================================
// LAB 2: PHANH XE KHẨN CẤP - ĐỘ DỊCH CHUYỂN VS QUÃNG ĐƯỜNG
// ==========================================
function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderT = document.getElementById('lab2SliderT');
  const valT = document.getElementById('lab2ValT');
  const btnPlay = document.getElementById('lab2BtnPlay');
  const output = document.getElementById('lab2Output');

  let isPlaying = false;
  let animId = null;

  function renderLab2() {
    const t = parseFloat(sliderT.value);
    valT.textContent = t.toFixed(1);

    // v(t) = t^2 - t - 6 on [1; 4]
    const v = t => t * t - t - 6;
    const vCurrent = v(t);

    // Integral of v(t): F(t) = t^3/3 - t^2/2 - 6t
    const F = t => (t * t * t) / 3 - (t * t) / 2 - 6 * t;
    const deltaS = F(t) - F(1); // displacement from t=1

    // Total distance traveled S
    let totalDist = 0;
    if (t <= 3) {
      totalDist = Math.abs(F(t) - F(1));
    } else {
      totalDist = Math.abs(F(3) - F(1)) + Math.abs(F(t) - F(3));
    }

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Upper lane: Track & Car (y: 0 to 130)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, 130);

    // Track line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(30, 90); ctx.lineTo(w - 30, 90); ctx.stroke();

    // Zero mark on track
    const trackX0 = 240;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(trackX0, 75); ctx.lineTo(trackX0, 105); ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('Vị trí t=1s (mốc 0m)', trackX0 - 45, 120);

    // Car position on track: displacement scale: 18 px per meter
    const carX = trackX0 + deltaS * 18;
    const carY = 82;

    // Draw Car 🚗
    ctx.save();
    ctx.translate(carX, carY);
    if (vCurrent < 0) ctx.scale(-1, 1); // reverse direction when reversing

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.roundRect(-22, -14, 44, 18, 4);
    ctx.fill();

    // Cabin
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.roundRect(-10, -24, 24, 12, 3);
    ctx.fill();

    // Wheels
    ctx.fillStyle = '#1e293b';
    ctx.beginPath(); ctx.arc(-12, 4, 6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(12, 4, 6, 0, Math.PI * 2); ctx.fill();

    ctx.restore();

    // Status on track
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`⏱ Thời gian: t = ${t.toFixed(1)} s`, 20, 25);
    ctx.fillStyle = vCurrent < 0 ? '#f43f5e' : '#10b981';
    ctx.fillText(`🚗 Vận tốc: v(t) = ${vCurrent.toFixed(2)} m/s (${vCurrent < 0 ? 'Lùi lại ⬅️' : 'Tiến tới ➡️'})`, 20, 45);

    // 2. Lower graph: v(t) on [1; 4] (y: 140 to 310)
    const gLeft = 60;
    const gRight = w - 40;
    const gZeroY = 240;
    const scaleT = (gRight - gLeft) / 3.0; // from t=1 to 4
    const scaleV = 10; // 1 m/s = 10px

    // Axis
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(gLeft, gZeroY); ctx.lineTo(gRight, gZeroY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(gLeft, 145); ctx.lineTo(gLeft, 305); ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('v (m/s)', gLeft - 38, 155);
    ctx.fillText('t=1s', gLeft - 8, gZeroY + 15);
    ctx.fillText('t=3s (đổi chiều)', gLeft + 2 * scaleT - 35, gZeroY + 15);
    ctx.fillText('t=4s', gRight - 20, gZeroY + 15);

    // Shaded areas under v(t)
    ctx.beginPath();
    ctx.moveTo(gLeft, gZeroY);
    for (let u = 1; u <= t; u += 0.05) {
      const px = gLeft + (u - 1) * scaleT;
      const py = gZeroY - v(u) * scaleV;
      ctx.lineTo(px, py);
    }
    const curPx = gLeft + (t - 1) * scaleT;
    ctx.lineTo(curPx, gZeroY);
    ctx.closePath();
    ctx.fillStyle = vCurrent < 0 ? 'rgba(244, 63, 94, 0.3)' : 'rgba(16, 185, 129, 0.3)';
    ctx.fill();

    // Curve v(u)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let u = 1; u <= 4; u += 0.05) {
      const px = gLeft + (u - 1) * scaleT;
      const py = gZeroY - v(u) * scaleV;
      if (u === 1) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Current point
    const curPy = gZeroY - vCurrent * scaleV;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(curPx, curPy, 4.5, 0, Math.PI * 2); ctx.fill();

    output.innerHTML = `
      <strong>📈 Kết quả phân tích động học trên $[1; ${t.toFixed(1)}]$:</strong><br>
      • Vận tốc tức thời: $v(${t.toFixed(1)}) = ${vCurrent.toFixed(2)}\\text{ m/s}$. Tại $t = 3\\text{ s}$, vận tốc triệt tiêu $v(3) = 0$ và vật đổi chiều chuyển động!<br>
      • <strong>Độ dịch chuyển (có dấu):</strong> $\\Delta s = \\int_1^{${t.toFixed(1)}} v(u)du = \\mathbf{${deltaS.toFixed(2)}\\text{ mét}}$ (vật đang ở bên ${deltaS < 0 ? 'trái' : 'phải'} vị trí ban đầu).<br>
      • <strong>Tổng quãng đường đã đi (luôn dương):</strong> $S = \\int_1^{${t.toFixed(1)}} |v(u)|du = \\mathbf{${totalDist.toFixed(2)}\\text{ mét}}$. Khi $t = 4\\text{ s}$: $\\Delta s = -4{,}5\\text{ m}$ nhưng $S = \\frac{61}{6} \\approx 10{,}17\\text{ m}$!
    `;
    renderMathInTree(output);
  }

  sliderT.addEventListener('input', renderLab2);

  btnPlay.addEventListener('click', () => {
    if (isPlaying) {
      isPlaying = false;
      cancelAnimationFrame(animId);
      btnPlay.textContent = '▶ Chạy chuyển động';
      return;
    }

    isPlaying = true;
    btnPlay.textContent = '⏸ Tạm dừng';
    sliderT.value = '1.0';

    function step() {
      if (!isPlaying) return;
      let cur = parseFloat(sliderT.value);
      if (cur < 4.0) {
        cur += 0.03;
        sliderT.value = cur.toString();
        renderLab2();
        animId = requestAnimationFrame(step);
      } else {
        isPlaying = false;
        btnPlay.textContent = '▶ Chạy chuyển động';
      }
    }
    animId = requestAnimationFrame(step);
  });

  renderLab2();
}

// ==========================================
// TAB 3: ĐẤU TRƯỜNG SGK
// ==========================================
function initArena() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  quizData.forEach((q) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard-${q.id}`;

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `<span>${q.title}</span><span class="quiz-pts">+${q.pts} XP</span>`;
    card.appendChild(header);

    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    const optGrid = document.createElement('div');
    optGrid.className = 'quiz-options-grid';

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = opt.text;
      btn.dataset.correct = opt.correct;
      btn.dataset.qid = q.id;
      btn.dataset.optIndex = optIndex;

      btn.addEventListener('click', () => handleOptionClick(btn, q, card));
      optGrid.appendChild(btn);
    });
    card.appendChild(optGrid);

    const expBox = document.createElement('div');
    expBox.className = 'explanation-box';
    expBox.id = `expBox-${q.id}`;
    expBox.innerHTML = `<strong>💡 Lời giải chi tiết:</strong><br>${q.explanation}`;
    card.appendChild(expBox);

    container.appendChild(card);
  });

  document.getElementById('arenaProgress').textContent = `0/${quizData.length}`;
  renderMathInTree(container);
}

function handleOptionClick(btn, q, card) {
  if (appState.answered[q.id]) return;

  appState.answered[q.id] = true;
  const isCorrect = btn.dataset.correct === 'true';
  const optBtns = card.querySelectorAll('.quiz-opt-btn');

  optBtns.forEach(b => {
    b.disabled = true;
    if (b.dataset.correct === 'true') {
      b.classList.add('correct');
    }
  });

  if (isCorrect) {
    btn.classList.add('correct');
    sounds.playCorrect();
    appState.streak++;
    addXP(q.pts);
  } else {
    btn.classList.add('wrong');
    sounds.playWrong();
    appState.streak = 0;
  }

  const expBox = document.getElementById(`expBox-${q.id}`);
  if (expBox) {
    expBox.classList.add('show');
    renderMathInTree(expBox);
  }

  const answeredCount = Object.keys(appState.answered).length;
  document.getElementById('arenaProgress').textContent = `${answeredCount}/${quizData.length}`;

  if (!appState.badges[0]) unlockBadge(0);
  if (appState.streak >= 3 && !appState.badges[1]) unlockBadge(1);
  if (appState.xp >= 160 && !appState.badges[3]) unlockBadge(3);

  if (answeredCount === quizData.length) {
    if (appState.xp >= 200 && !appState.badges[4]) {
      unlockBadge(4);
      sounds.playFanfare();
    }
  }
}

// Certificate and Avatar Modal
function initCertAndModal() {
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const closeBtn = document.getElementById('btnCloseAvatarModal');
  const avatarOpts = document.querySelectorAll('.avatar-opt');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      sounds.playClick();
      avatarModal.style.display = 'flex';
      avatarModal.classList.add('active');
    });
  }

  if (closeBtn && avatarModal) {
    closeBtn.addEventListener('click', () => {
      sounds.playClick();
      avatarModal.style.display = 'none';
      avatarModal.classList.remove('active');
    });
  }

  avatarOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      appState.avatar = opt.dataset.avatar;
      appState.userName = opt.dataset.name;
      document.getElementById('avatarBtn').textContent = appState.avatar;
      document.getElementById('userNameDisplay').textContent = `${appState.userName} 🌟`;
      document.getElementById('certStudentName').textContent = appState.userName;
      sounds.playClick();
      avatarModal.style.display = 'none';
      avatarModal.classList.remove('active');
    });
  });

  const btnPrint = document.getElementById('btnPrintCert');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      sounds.playClick();
      window.print();
    });
  }
}
