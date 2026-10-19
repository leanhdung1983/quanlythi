// ==========================================
// TOÁN 12 - BÀI 13: ỨNG DỤNG HÌNH HỌC CỦA TÍCH PHÂN
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
  userTitle: 'Kiến Trúc Sư Tích Phân Hình Học',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// Quiz Data - 10 câu hỏi chuẩn SGK Toán 12 KNTT Bài 13 (Trang 25-26)
const quizData = [
  {
    id: 1,
    title: "Câu 1 (Bài 4.14 SGK - Diện tích giữa parabol và đường thẳng)",
    pts: 20,
    question: "Diện tích hình phẳng giới hạn bởi parabol $y = 5x - x^2$ và đường thẳng $y = x$ bằng:",
    options: [
      { text: "A. $\\frac{32}{3}$", correct: true },
      { text: "B. $\\frac{64}{3}$", correct: false },
      { text: "C. $16$", correct: false },
      { text: "D. $\\frac{16}{3}$", correct: false }
    ],
    explanation: "Phương trình hoành độ giao điểm: $5x - x^2 = x \\Leftrightarrow x(4 - x) = 0 \\Leftrightarrow x = 0$ hoặc $x = 4$. Trên $[0; 4]$, parabol $5x - x^2 \\ge x$. Diện tích: $S = \\int_0^4 (5x - x^2 - x)dx = \\int_0^4 (4x - x^2)dx = \\left. \\left(2x^2 - \\frac{x^3}{3}\\right) \\right|_0^4 = 32 - \\frac{64}{3} = \\frac{32}{3}$."
  },
  {
    id: 2,
    title: "Câu 2 (Bài 4.15a SGK - Diện tích giữa hàm mũ và parabol)",
    pts: 20,
    question: "Diện tích hình phẳng giới hạn bởi $y = e^x$, $y = x^2 - 1$ và hai đường thẳng $x = -1, x = 1$ bằng:",
    options: [
      { text: "A. $e - \\frac{1}{e} + \\frac{4}{3}$", correct: true },
      { text: "B. $e - \\frac{1}{e} - \\frac{4}{3}$", correct: false },
      { text: "C. $e + \\frac{1}{e} + \\frac{4}{3}$", correct: false },
      { text: "D. $e - \\frac{1}{e} + \\frac{2}{3}$", correct: false }
    ],
    explanation: "Với mọi $x \\in [-1; 1]$, ta có $e^x > 0 \\ge x^2 - 1$. Do đó: $S = \\int_{-1}^1 (e^x - x^2 + 1)dx = \\left. \\left(e^x - \\frac{x^3}{3} + x\\right) \\right|_{-1}^1 = \\left(e - \\frac{1}{3} + 1\\right) - \\left(e^{-1} + \\frac{1}{3} - 1\\right) = e - e^{-1} + \\frac{4}{3}$."
  },
  {
    id: 3,
    title: "Câu 3 (Bài 4.15d SGK - Diện tích giữa căn thức và parabol)",
    pts: 20,
    question: "Diện tích hình phẳng giới hạn bởi đồ thị hàm số $y = \\sqrt{x}$, $y = x^2$ và hai đường thẳng $x = 0, x = 1$ bằng:",
    options: [
      { text: "A. $\\frac{1}{3}$", correct: true },
      { text: "B. $\\frac{2}{3}$", correct: false },
      { text: "C. $\\frac{1}{2}$", correct: false },
      { text: "D. $\\frac{1}{6}$", correct: false }
    ],
    explanation: "Trên $[0; 1]$, ta có $\\sqrt{x} \\ge x^2$. Diện tích: $S = \\int_0^1 (\\sqrt{x} - x^2)dx = \\left. \\left(\\frac{2}{3}x^{3/2} - \\frac{x^3}{3}\\right) \\right|_0^1 = \\frac{2}{3} - \\frac{1}{3} = \\frac{1}{3}$."
  },
  {
    id: 4,
    title: "Câu 4 (Bài 4.15c SGK - Diện tích giới hạn bởi hai parabol)",
    pts: 20,
    question: "Diện tích hình phẳng giới hạn bởi hai parabol $y = 9 - x^2$ và $y = 2x^2$ trên đoạn $[-\\sqrt{3}; \\sqrt{3}]$ bằng:",
    options: [
      { text: "A. $12\\sqrt{3}$", correct: true },
      { text: "B. $6\\sqrt{3}$", correct: false },
      { text: "C. $18\\sqrt{3}$", correct: false },
      { text: "D. $24\\sqrt{3}$", correct: false }
    ],
    explanation: "Phương trình hoành độ giao điểm: $9 - x^2 = 2x^2 \\Leftrightarrow 3x^2 = 9 \\Leftrightarrow x = \\pm\\sqrt{3}$. Vì $9 - x^2 \\ge 2x^2$ trên $[-\\sqrt{3}; \\sqrt{3}]$, diện tích là: $S = \\int_{-\\sqrt{3}}^{\\sqrt{3}} (9 - 3x^2)dx = 2\\int_0^{\\sqrt{3}} (9 - 3x^2)dx = 2\\left. \\left(9x - x^3\\right) \\right|_0^{\\sqrt{3}} = 2(9\\sqrt{3} - 3\\sqrt{3}) = 12\\sqrt{3}$."
  },
  {
    id: 5,
    title: "Câu 5 (Ứng dụng thiết diện - Thể tích vật thể S(x))",
    pts: 20,
    question: "Một vật thể nằm giữa hai mặt phẳng $x = 0$ và $x = 2$. Biết rằng thiết diện của vật thể vuông góc với trục $Ox$ tại hoành độ $x \\in [0; 2]$ là một hình vuông có cạnh bằng $2\\sqrt{x}$. Thể tích của vật thể đó là:",
    options: [
      { text: "A. $8$", correct: true },
      { text: "B. $16$", correct: false },
      { text: "C. $4$", correct: false },
      { text: "D. $\\frac{16}{3}$", correct: false }
    ],
    explanation: "Thiết diện vuông góc với $Ox$ tại hoành độ $x$ có diện tích: $S(x) = (2\\sqrt{x})^2 = 4x$. Thể tích vật thể: $V = \\int_0^2 S(x)dx = \\int_0^2 4x dx = \\left. 2x^2 \\right|_0^2 = 2(4) - 0 = 8$."
  },
  {
    id: 6,
    title: "Câu 6 (Ví dụ 7 SGK - Thể tích khối tròn xoay căn thức)",
    pts: 20,
    question: "Thể tích khối tròn xoay sinh ra khi quay hình phẳng giới hạn bởi $y = \\sqrt{x}$, $y = 0$, $x = 0$ và $x = 1$ quanh trục hoành $Ox$ là:",
    options: [
      { text: "A. $\\frac{\\pi}{2}$", correct: true },
      { text: "B. $\\frac{2\\pi}{3}$", correct: false },
      { text: "C. $\\pi$", correct: false },
      { text: "D. $\\frac{\\pi}{3}$", correct: false }
    ],
    explanation: "Công thức thể tích khối tròn xoay quanh trục $Ox$: $V = \\pi \\int_0^1 (\\sqrt{x})^2 dx = \\pi \\int_0^1 x dx = \\left. \\frac{\\pi x^2}{2} \\right|_0^1 = \\frac{\\pi}{2}$."
  },
  {
    id: 7,
    title: "Câu 7 (Bài 4.17 SGK - Thể tích khối tròn xoay của parabol)",
    pts: 20,
    question: "Thể tích khối tròn xoay sinh ra khi quay hình phẳng giới hạn bởi $y = 2x - x^2$ và $y = 0$ xung quanh trục hoành $Ox$ là:",
    options: [
      { text: "A. $\\frac{16\\pi}{15}$", correct: true },
      { text: "B. $\\frac{8\\pi}{15}$", correct: false },
      { text: "C. $\\frac{4\\pi}{3}$", correct: false },
      { text: "D. $\\frac{32\\pi}{15}$", correct: false }
    ],
    explanation: "Phương trình hoành độ giao điểm với $Ox$: $2x - x^2 = 0 \\Leftrightarrow x = 0$ hoặc $x = 2$. Thể tích: $V = \\pi \\int_0^2 (2x - x^2)^2 dx = \\pi \\int_0^2 (4x^2 - 4x^3 + x^4)dx = \\pi \\left. \\left(\\frac{4x^3}{3} - x^4 + \\frac{x^5}{5}\\right) \\right|_0^2 = \\pi \\left(\\frac{32}{3} - 16 + \\frac{32}{5}\\right) = \\pi \\left(\\frac{160 - 240 + 96}{15}\\right) = \\frac{16\\pi}{15}$."
  },
  {
    id: 8,
    title: "Câu 8 (Ví dụ 8 SGK - Thể tích khối cầu bán kính R)",
    pts: 20,
    question: "Quay nửa hình tròn giới hạn bởi $y = \\sqrt{R^2 - x^2}$ và trục hoành trên đoạn $[-R; R]$ quanh trục $Ox$ ta được khối cầu bán kính $R$. Thể tích khối cầu là:",
    options: [
      { text: "A. $\\frac{4}{3}\\pi R^3$", correct: true },
      { text: "B. $\\frac{2}{3}\\pi R^3$", correct: false },
      { text: "C. $4\\pi R^2$", correct: false },
      { text: "D. $2\\pi R^3$", correct: false }
    ],
    explanation: "Thể tích: $V = \\pi \\int_{-R}^R (R^2 - x^2)dx = 2\\pi \\int_0^R (R^2 - x^2)dx = 2\\pi \\left. \\left(R^2 x - \\frac{x^3}{3}\\right) \\right|_0^R = 2\\pi \\left(R^3 - \\frac{R^3}{3}\\right) = 2\\pi \\cdot \\frac{2R^3}{3} = \\frac{4}{3}\\pi R^3$."
  },
  {
    id: 9,
    title: "Câu 9 (Bài 4.18 SGK - Thể tích khối chỏm cầu)",
    pts: 20,
    question: "Một khối chỏm cầu có bán kính $R = 5\\text{ cm}$ và chiều cao $h = 2\\text{ cm}$. Thể tích khối chỏm cầu này bằng:",
    options: [
      { text: "A. $\\frac{52\\pi}{3}\\text{ cm}^3$", correct: true },
      { text: "B. $\\frac{44\\pi}{3}\\text{ cm}^3$", correct: false },
      { text: "C. $20\\pi\\text{ cm}^3$", correct: false },
      { text: "D. $\\frac{64\\pi}{3}\\text{ cm}^3$", correct: false }
    ],
    explanation: "Khối chỏm cầu là khối tròn xoay của cung tròn $y = \\sqrt{R^2 - x^2}$ trên $[R - h; R] = [3; 5]$ quanh $Ox$. Công thức: $V = \\pi h^2\\left(R - \\frac{h}{3}\\right) = \\pi (2^2)\\left(5 - \\frac{2}{3}\\right) = 4\\pi \\cdot \\frac{13}{3} = \\frac{52\\pi}{3}\\text{ cm}^3$."
  },
  {
    id: 10,
    title: "Câu 10 (Bài 4.19 SGK - Khối nón sinh bởi tam giác vuông)",
    pts: 20,
    question: "Cho tam giác vuông $OAB$ có cạnh $OA = a$ nằm trên trục $Ox$ và $\\widehat{AOB} = \\alpha$ ($0 < \\alpha < \\frac{\\pi}{4}$). Thể tích khối tròn xoay sinh ra khi quay miền tam giác $OAB$ quanh trục $Ox$ là:",
    options: [
      { text: "A. $\\frac{1}{3}\\pi a^3 \\tan^2\\alpha$", correct: true },
      { text: "B. $\\pi a^3 \\tan^2\\alpha$", correct: false },
      { text: "C. $\\frac{1}{3}\\pi a^3 \\sin^2\\alpha$", correct: false },
      { text: "D. $\\frac{1}{2}\\pi a^3 \\tan^2\\alpha$", correct: false }
    ],
    explanation: "Cạnh $AB$ vuông góc với $Ox$ tại $A(a; 0)$. Ta có $AB = OA\\cdot\\tan\\alpha = a\\tan\\alpha$. Cạnh $OB$ có phương trình $y = x\\tan\\alpha$ với $x \\in [0; a]$. Quay miền tam giác $OAB$ quanh $Ox$ được khối nón có bán kính đáy $R = AB = a\\tan\\alpha$ và chiều cao $h = OA = a$. Thể tích: $V = \\pi \\int_0^a (x\\tan\\alpha)^2 dx = \\pi\\tan^2\\alpha \\left. \\frac{x^3}{3} \\right|_0^a = \\frac{1}{3}\\pi a^3\\tan^2\\alpha$."
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
    if (confirm('Làm mới lại tiến trình học tập Bài 13?')) {
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
// LAB 1: MÁY QUÉT DIỆN TÍCH GIỮA HAI ĐƯỜNG CONG
// ==========================================
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const selectPair = document.getElementById('lab1PairSelect');
  const sliderX = document.getElementById('lab1SliderX');
  const valX = document.getElementById('lab1ValX');
  const btnScan = document.getElementById('lab1BtnScan');
  const output = document.getElementById('lab1Output');

  let isScanning = false;
  let animId = null;

  function drawLab1() {
    const pair = selectPair.value;
    const curX = parseFloat(sliderX.value);
    valX.textContent = curX.toFixed(1);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    let f, g, aBound, bBound, xMaxView, yMaxView, fName, gName, exactArea;
    if (pair === 'parab_line') {
      f = x => 5 * x - x * x;
      g = x => x;
      aBound = 0; bBound = 4;
      xMaxView = 5; yMaxView = 7;
      fName = 'f(x) = 5x - x^2';
      gName = 'g(x) = x';
      exactArea = 32 / 3;
      sliderX.min = '0'; sliderX.max = '4';
    } else if (pair === 'two_parab') {
      f = x => 4 - x * x;
      g = x => x * x;
      aBound = -Math.SQRT2; bBound = Math.SQRT2;
      xMaxView = 2.5; yMaxView = 5;
      fName = 'f(x) = 4 - x^2';
      gName = 'g(x) = x^2';
      exactArea = (16 * Math.SQRT2) / 3;
      sliderX.min = (-Math.SQRT2).toFixed(1); sliderX.max = Math.SQRT2.toFixed(1);
    } else {
      f = x => Math.sqrt(x);
      g = x => x * x;
      aBound = 0; bBound = 1;
      xMaxView = 1.4; yMaxView = 1.4;
      fName = 'f(x) = \\sqrt{x}';
      gName = 'g(x) = x^2';
      exactArea = 1 / 3;
      sliderX.min = '0'; sliderX.max = '1';
    }

    const ox = 60;
    const oy = h - 40;
    const scaleX = (w - 100) / xMaxView;
    const scaleY = (h - 70) / yMaxView;

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = 0; x <= xMaxView; x += 1) {
      const px = ox + x * scaleX;
      ctx.beginPath(); ctx.moveTo(px, 20); ctx.lineTo(px, oy); ctx.stroke();
    }
    for (let y = 0; y <= yMaxView; y += 1) {
      const py = oy - y * scaleY;
      ctx.beginPath(); ctx.moveTo(ox, py); ctx.lineTo(w - 20, py); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(20, oy); ctx.lineTo(w - 20, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, h - 20); ctx.lineTo(ox, 20); ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('x', w - 15, oy + 15);
    ctx.fillText('y', ox - 15, 18);
    ctx.fillText('0', ox - 10, oy + 15);

    // 1. Shaded area between f(x) and g(x) up to curX
    ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
    ctx.beginPath();
    let started = false;
    for (let u = aBound; u <= curX; u += 0.05) {
      const px = ox + u * scaleX;
      const py = oy - f(u) * scaleY;
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    for (let u = curX; u >= aBound; u -= 0.05) {
      const px = ox + u * scaleX;
      const py = oy - g(u) * scaleY;
      ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();

    // 2. Draw Curve f(x) (Cyan)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    started = false;
    for (let u = 0; u <= xMaxView; u += 0.05) {
      const px = ox + u * scaleX;
      const py = oy - f(u) * scaleY;
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 3. Draw Curve g(x) (Pink)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    started = false;
    for (let u = 0; u <= xMaxView; u += 0.05) {
      const px = ox + u * scaleX;
      const py = oy - g(u) * scaleY;
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // 4. Scanning vertical strip at curX
    const scanPx = ox + curX * scaleX;
    const scanY1 = oy - f(curX) * scaleY;
    const scanY2 = oy - g(curX) * scaleY;

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(scanPx, scanY1); ctx.lineTo(scanPx, scanY2);
    ctx.stroke();

    // End points on strip
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(scanPx, scanY1, 4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(scanPx, scanY2, 4, 0, Math.PI * 2); ctx.fill();

    // Current stripped height
    const stripHeight = Math.abs(f(curX) - g(curX));

    // Legends
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`${fName}`, 80, 30);
    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`${gName}`, 80, 50);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`Vi phân quét tại x = ${curX.toFixed(1)}: |f - g| = ${stripHeight.toFixed(2)}`, 80, 70);

    // Approximate integrated area up to curX
    let currentArea = 0;
    const step = 0.01;
    for (let u = aBound; u <= curX; u += step) {
      currentArea += Math.abs(f(u) - g(u)) * step;
    }

    output.innerHTML = `
      <strong>📐 Máy quét vi phân tích phân diện tích:</strong><br>
      • Hai đường cong: $${fName}$ và $${gName}$.<br>
      • Hoành độ giao điểm: $x = ${aBound.toFixed(2)}$ và $x = ${bBound.toFixed(2)}$.<br>
      • Chiều cao dải vi phân quét tại $x = ${curX.toFixed(1)}$: $h(x) = |f(x) - g(x)| = \\mathbf{${stripHeight.toFixed(2)}}$.<br>
      • Diện tích đã quét: $S(x) = \\int_{${aBound.toFixed(1)}}^{${curX.toFixed(1)}} |f - g|dx = \\mathbf{${currentArea.toFixed(3)}}$. Diện tích trọn vẹn toàn miền: $S = \\mathbf{${exactArea.toFixed(3)}}$.
    `;
    renderMathInTree(output);

    if (!appState.badges[2]) unlockBadge(2);
  }

  selectPair.addEventListener('change', drawLab1);
  sliderX.addEventListener('input', drawLab1);

  btnScan.addEventListener('click', () => {
    if (isScanning) {
      isScanning = false;
      cancelAnimationFrame(animId);
      btnScan.textContent = '▶ Tự động quét';
      return;
    }

    isScanning = true;
    btnScan.textContent = '⏸ Tạm dừng';
    sliderX.value = sliderX.min;

    function step() {
      if (!isScanning) return;
      let cur = parseFloat(sliderX.value);
      const maxVal = parseFloat(sliderX.max);
      if (cur < maxVal) {
        cur += (maxVal - parseFloat(sliderX.min)) / 120;
        sliderX.value = Math.min(cur, maxVal).toString();
        drawLab1();
        animId = requestAnimationFrame(step);
      } else {
        isScanning = false;
        btnScan.textContent = '▶ Tự động quét';
      }
    }
    animId = requestAnimationFrame(step);
  });

  drawLab1();
}

// ==========================================
// LAB 2: MÁY TIỆN KHỐI TRÒN XOAY 3D
// ==========================================
function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const selectSolid = document.getElementById('lab2SolidSelect');
  const sliderAngle = document.getElementById('lab2SliderAngle');
  const valAngle = document.getElementById('lab2ValAngle');
  const btnRotate = document.getElementById('lab2BtnRotate');
  const output = document.getElementById('lab2Output');

  let isRotating = false;
  let animId = null;

  function renderLab2() {
    const solidType = selectSolid.value;
    const angleDeg = parseInt(sliderAngle.value);
    valAngle.textContent = angleDeg + '°';

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    let f, a, b, exactVol, texF;
    if (solidType === 'cone') {
      f = x => 0.5 * x;
      a = 0; b = 3;
      exactVol = Math.PI * (0.25 * 27 / 3); // pi * 0.25 * 9 = 2.25 pi ≈ 7.068
      texF = 'f(x) = 0{,}5x';
    } else if (solidType === 'parab') {
      f = x => Math.sqrt(x);
      a = 0; b = 3;
      exactVol = Math.PI * (9 / 2); // 4.5 pi ≈ 14.137
      texF = 'f(x) = \\sqrt{x}';
    } else if (solidType === 'sphere') {
      f = x => Math.sqrt(Math.max(0, 4 - x * x));
      a = -2; b = 2;
      exactVol = (4 / 3) * Math.PI * 8; // 32/3 pi ≈ 33.51
      texF = 'f(x) = \\sqrt{4 - x^2}';
    } else {
      f = x => 1 + 0.3 * Math.sin(2 * x);
      a = 0; b = 3;
      exactVol = 10.25; // approx
      texF = 'f(x) = 1 + 0{,}3\\sin(2x)';
    }

    const ox = w / 2 - 40;
    const oy = h / 2;
    const scaleX = 45;
    const scaleY = 40;

    // Draw Ox Axis
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, oy); ctx.lineTo(w - 30, oy);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Ox', w - 25, oy + 15);

    // Draw 3D Solid of revolution wireframe
    const numRings = 14;
    const stepX = (b - a) / numRings;

    // Ellipses at slices
    for (let i = 0; i <= numRings; i++) {
      const x = a + i * stepX;
      const r = f(x);
      const px = ox + x * scaleX;
      const py = oy;
      const rx = r * scaleY * Math.sin((angleDeg * Math.PI) / 180) * 0.35;
      const ry = r * scaleY;

      if (ry > 1) {
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.45)';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.ellipse(px, py, Math.abs(rx), ry, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Upper and Lower Silhouette curves
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let started = false;
    for (let x = a; x <= b; x += 0.05) {
      const px = ox + x * scaleX;
      const py = oy - f(x) * scaleY;
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.strokeStyle = '#06b6d4';
    ctx.beginPath();
    started = false;
    for (let x = a; x <= b; x += 0.05) {
      const px = ox + x * scaleX;
      const py = oy + f(x) * scaleY;
      if (!started) { ctx.moveTo(px, py); started = true; }
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // End caps
    const pA = ox + a * scaleX;
    const pB = ox + b * scaleX;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(pA, oy - f(a) * scaleY); ctx.lineTo(pA, oy + f(a) * scaleY); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(pB, oy - f(b) * scaleY); ctx.lineTo(pB, oy + f(b) * scaleY); ctx.stroke();

    // Info header
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`Khối tròn xoay quay quanh Ox (Góc quay: ${angleDeg}°)`, 20, 25);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`Thể tích V = π ∫ f²(x)dx ≈ ${exactVol.toFixed(3)} (đvtt)`, 20, 45);

    output.innerHTML = `
      <strong>🏺 Máy tiện khối tròn xoay 3D:</strong><br>
      • Đường biên sinh: $${texF}$ trên $[${a}; ${b}]$.<br>
      • Thiết diện vuông góc với trục hoành tại hoành độ $x$ là hình tròn bán kính $R(x) = f(x)$, diện tích $S(x) = \\pi [f(x)]^2$.<br>
      • Thể tích khối tròn xoay chuẩn mực: $V = \\pi \\int_{${a}}^{${b}} [f(x)]^2 dx = \\mathbf{${exactVol.toFixed(3)}\\text{ (đvtt)}}$.
    `;
    renderMathInTree(output);
  }

  selectSolid.addEventListener('change', renderLab2);
  sliderAngle.addEventListener('input', renderLab2);

  btnRotate.addEventListener('click', () => {
    if (isRotating) {
      isRotating = false;
      cancelAnimationFrame(animId);
      btnRotate.textContent = '🔄 Xoay 360°';
      return;
    }

    isRotating = true;
    btnRotate.textContent = '⏸ Tạm dừng';
    sliderAngle.value = '30';

    function step() {
      if (!isRotating) return;
      let cur = parseInt(sliderAngle.value);
      if (cur < 360) {
        cur += 4;
        sliderAngle.value = Math.min(cur, 360).toString();
        renderLab2();
        animId = requestAnimationFrame(step);
      } else {
        isRotating = false;
        btnRotate.textContent = '🔄 Xoay 360°';
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
