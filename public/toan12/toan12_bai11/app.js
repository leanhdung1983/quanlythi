// ==========================================
// TOÁN 12 - BÀI 11: NGUYÊN HÀM
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
  userTitle: 'Bậc Thầy Nguyên Hàm 12',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// Quiz Data - 10 câu hỏi chuẩn SGK Toán 12 KNTT Bài 11 (Trang 11)
const quizData = [
  {
    id: 1,
    title: "Câu 1 (Bài 4.2a SGK - Nguyên hàm đa thức)",
    pts: 20,
    question: "Họ các nguyên hàm của hàm số $f(x) = 3x^2 + 2x - 1$ trên $\\mathbb{R}$ là:",
    options: [
      { text: "A. $F(x) = x^3 + x^2 - x + C$", correct: true },
      { text: "B. $F(x) = 6x + 2 + C$", correct: false },
      { text: "C. $F(x) = 3x^3 + 2x^2 - x + C$", correct: false },
      { text: "D. $F(x) = x^3 + 2x^2 - x + C$", correct: false }
    ],
    explanation: "Áp dụng công thức nguyên hàm hàm số lũy thừa: $\\int (3x^2 + 2x - 1)dx = 3\\cdot\\frac{x^3}{3} + 2\\cdot\\frac{x^2}{2} - x + C = x^3 + x^2 - x + C$."
  },
  {
    id: 2,
    title: "Câu 2 (Bài 4.4a SGK - Nguyên hàm lượng giác)",
    pts: 20,
    question: "Tìm họ nguyên hàm $\\int \\left(2\\cos x - \\frac{3}{\\sin^2 x}\\right)dx$ trên các khoảng xác định:",
    options: [
      { text: "A. $2\\sin x + 3\\cot x + C$", correct: true },
      { text: "B. $-2\\sin x - 3\\cot x + C$", correct: false },
      { text: "C. $2\\sin x - 3\\cot x + C$", correct: false },
      { text: "D. $2\\sin x + 3\\tan x + C$", correct: false }
    ],
    explanation: "Ta có: $\\int \\cos x dx = \\sin x + C$ và $\\int \\frac{1}{\\sin^2 x}dx = -\\cot x + C$. Do đó: $\\int \\left(2\\cos x - \\frac{3}{\\sin^2 x}\\right)dx = 2\\sin x - 3(-\\cot x) + C = 2\\sin x + 3\\cot x + C$."
  },
  {
    id: 3,
    title: "Câu 3 (Bài 4.3d SGK - Nguyên hàm hàm số mũ và lũy thừa)",
    pts: 20,
    question: "Tìm họ nguyên hàm $\\int \\left(2^x + \\frac{3}{x^2}\\right)dx$ trên khoảng $(0; +\\infty)$:",
    options: [
      { text: "A. $\\frac{2^x}{\\ln 2} - \\frac{3}{x} + C$", correct: true },
      { text: "B. $2^x\\ln 2 - \\frac{3}{x} + C$", correct: false },
      { text: "C. $\\frac{2^x}{\\ln 2} + \\frac{3}{x} + C$", correct: false },
      { text: "D. $2^x - \\frac{6}{x^3} + C$", correct: false }
    ],
    explanation: "Áp dụng bảng nguyên hàm: $\\int 2^x dx = \\frac{2^x}{\\ln 2} + C$ và $\\int \\frac{3}{x^2}dx = 3\\int x^{-2}dx = 3\\cdot\\frac{x^{-1}}{-1} + C = -\\frac{3}{x} + C$. Vậy kết quả là $\\frac{2^x}{\\ln 2} - \\frac{3}{x} + C$."
  },
  {
    id: 4,
    title: "Câu 4 (Bài 4.5 SGK - Xác định hằng số C của nguyên hàm)",
    pts: 20,
    question: "Cho hàm số $y = f(x)$ xác định trên $(0; +\\infty)$. Biết $f'(x) = 2x + \\frac{1}{x^2}$ với mọi $x \\in (0; +\\infty)$ và $f(1) = 1$. Giá trị của $f(4)$ là:",
    options: [
      { text: "A. $\\frac{67}{4}$", correct: true },
      { text: "B. $\\frac{63}{4}$", correct: false },
      { text: "C. $16$", correct: false },
      { text: "D. $\\frac{65}{4}$", correct: false }
    ],
    explanation: "Ta có $f(x) = \\int \\left(2x + \\frac{1}{x^2}\\right)dx = x^2 - \\frac{1}{x} + C$. Vì $f(1) = 1 \\Rightarrow 1^2 - 1 + C = 1 \\Rightarrow C = 1$. Do đó $f(x) = x^2 - \\frac{1}{x} + 1$. Khi đó $f(4) = 4^2 - \\frac{1}{4} + 1 = 17 - 0{,}25 = 16{,}75 = \\frac{67}{4}$."
  },
  {
    id: 5,
    title: "Câu 5 (Bài 4.3b SGK - Nguyên hàm hàm căn thức)",
    pts: 20,
    question: "Tìm họ nguyên hàm $\\int \\sqrt{x}(7x^2 - 3)dx$ với $x > 0$:",
    options: [
      { text: "A. $2x^3\\sqrt{x} - 2x\\sqrt{x} + C$", correct: true },
      { text: "B. $7x^3\\sqrt{x} - 3x\\sqrt{x} + C$", correct: false },
      { text: "C. $\\frac{14}{5}x^2\\sqrt{x} - 2x\\sqrt{x} + C$", correct: false },
      { text: "D. $2x^3\\sqrt{x} + 2x\\sqrt{x} + C$", correct: false }
    ],
    explanation: "Biến đổi hàm dưới dấu nguyên hàm về dạng lũy thừa: $\\sqrt{x}(7x^2 - 3) = 7x^{5/2} - 3x^{1/2}$. Nguyên hàm: $\\int (7x^{5/2} - 3x^{1/2})dx = 7\\cdot\\frac{x^{7/2}}{7/2} - 3\\cdot\\frac{x^{3/2}}{3/2} + C = 2x^{7/2} - 2x^{3/2} + C = 2x^3\\sqrt{x} - 2x\\sqrt{x} + C$."
  },
  {
    id: 6,
    title: "Câu 6 (Bài 4.4b SGK - Nguyên hàm lượng giác hạ bậc)",
    pts: 20,
    question: "Tìm họ nguyên hàm $\\int 4\\sin^2\\frac{x}{2}dx$:",
    options: [
      { text: "A. $2x - 2\\sin x + C$", correct: true },
      { text: "B. $2x + 2\\sin x + C$", correct: false },
      { text: "C. $4x - 4\\sin x + C$", correct: false },
      { text: "D. $x - \\sin x + C$", correct: false }
    ],
    explanation: "Sử dụng công thức hạ bậc lượng giác: $\\sin^2\\frac{x}{2} = \\frac{1 - \\cos x}{2} \\Rightarrow 4\\sin^2\\frac{x}{2} = 2(1 - \\cos x) = 2 - 2\\cos x$. Do đó $\\int (2 - 2\\cos x)dx = 2x - 2\\sin x + C$."
  },
  {
    id: 7,
    title: "Câu 7 (Bài 4.4d SGK - Nguyên hàm hàm lượng giác biến đổi)",
    pts: 20,
    question: "Tìm họ nguyên hàm $\\int (x + \\tan^2 x)dx$ trên các khoảng xác định:",
    options: [
      { text: "A. $\\frac{x^2}{2} + \\tan x - x + C$", correct: true },
      { text: "B. $\\frac{x^2}{2} + \\tan x + x + C$", correct: false },
      { text: "C. $\\frac{x^2}{2} + \\frac{\\tan^3 x}{3} + C$", correct: false },
      { text: "D. $\\frac{x^2}{2} - \\tan x - x + C$", correct: false }
    ],
    explanation: "Sử dụng biến đổi: $1 + \\tan^2 x = \\frac{1}{\\cos^2 x} \\Rightarrow \\tan^2 x = \\frac{1}{\\cos^2 x} - 1$. Khi đó: $\\int (x + \\tan^2 x)dx = \\int \\left(x + \\frac{1}{\\cos^2 x} - 1\\right)dx = \\frac{x^2}{2} + \\tan x - x + C$."
  },
  {
    id: 8,
    title: "Câu 8 (Bài 4.6 SGK - Tìm hàm số từ hệ số góc tiếp tuyến)",
    pts: 20,
    question: "Cho hàm số $y = f(x)$ có đồ thị $(C)$. Biết hệ số góc tiếp tuyến tại điểm $M(x; f(x))$ là $k_M = (x - 1)^2$ và điểm $M$ trùng với gốc tọa độ khi nó nằm trên trục tung. Hàm số $f(x)$ là:",
    options: [
      { text: "A. $f(x) = \\frac{x^3}{3} - x^2 + x$", correct: true },
      { text: "B. $f(x) = \\frac{x^3}{3} - x^2 + x - \\frac{1}{3}$", correct: false },
      { text: "C. $f(x) = 2(x - 1)$", correct: false },
      { text: "D. $f(x) = \\frac{(x - 1)^3}{3}$", correct: false }
    ],
    explanation: "Hệ số góc tiếp tuyến chính là đạo hàm: $f'(x) = (x - 1)^2 = x^2 - 2x + 1$. Suy ra $f(x) = \\int (x^2 - 2x + 1)dx = \\frac{x^3}{3} - x^2 + x + C$. Khi $M$ nằm trên trục tung ($x = 0$) thì nó trùng gốc tọa độ $(0; 0) \\Rightarrow f(0) = 0 \\Rightarrow C = 0$. Vậy $f(x) = \\frac{x^3}{3} - x^2 + x$."
  },
  {
    id: 9,
    title: "Câu 9 (Bài 4.7 SGK - Chuyển động viên đạn và độ cao cực đại)",
    pts: 20,
    question: "Một viên đạn được bắn thẳng đứng lên từ mặt đất với vận tốc $v(t) = 160 - 9{,}8t$ (m/s). Độ cao lớn nhất mà viên đạn đạt được (làm tròn đến chữ số thập phân thứ nhất) là:",
    options: [
      { text: "A. $1306{,}1\\text{ m}$", correct: true },
      { text: "B. $1280{,}0\\text{ m}$", correct: false },
      { text: "C. $1420{,}5\\text{ m}$", correct: false },
      { text: "D. $1150{,}8\\text{ m}$", correct: false }
    ],
    explanation: "Độ cao $h(t) = \\int v(t)dt = \\int (160 - 9{,}8t)dt = 160t - 4{,}9t^2 + C$. Bắn từ mặt đất nên $h(0) = 0 \\Rightarrow C = 0 \\Rightarrow h(t) = 160t - 4{,}9t^2$. Viên đạn đạt độ cao lớn nhất khi vận tốc triệt tiêu: $v(t) = 0 \\Leftrightarrow 160 - 9{,}8t = 0 \\Leftrightarrow t = \\frac{160}{9{,}8} \\approx 16{,}3265\\text{ s}$. Độ cao cực đại: $h_{max} = 160(16{,}3265) - 4{,}9(16{,}3265)^2 \\approx 1306{,}1\\text{ m}$."
  },
  {
    id: 10,
    title: "Câu 10 (Vận dụng SGK Trang 8 - Doanh thu và doanh thu biên)",
    pts: 20,
    question: "Một công ty công nghệ có tốc độ biến động doanh thu khi bán $x$ con chip là hàm doanh thu biên $M_R(x) = 300 - 0{,}1x$ (nghìn đồng/chip). Biết khi chưa bán chip nào thì doanh thu bằng $0$. Doanh thu của công ty khi bán được $1000$ con chip là:",
    options: [
      { text: "A. $250\\text{ triệu đồng}$", correct: true },
      { text: "B. $300\\text{ triệu đồng}$", correct: false },
      { text: "C. $200\\text{ triệu đồng}$", correct: false },
      { text: "D. $290\\text{ triệu đồng}$", correct: false }
    ],
    explanation: "Vì $R'(x) = M_R(x)$ nên doanh thu là nguyên hàm: $R(x) = \\int (300 - 0{,}1x)dx = 300x - 0{,}05x^2 + C$. Do $R(0) = 0 \\Rightarrow C = 0$. Khi bán $x = 1000$ con chip: $R(1000) = 300(1000) - 0{,}05(1000^2) = 300\\,000 - 50\\,000 = 250\\,000\\text{ nghìn đồng} = 250\\text{ triệu đồng}$."
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
    if (confirm('Làm mới lại tiến trình học tập Bài 11?')) {
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
// LAB 1: KÍNH HIỂN VI NGUYÊN HÀM & CHÙM HỌ ĐƯỜNG CONG
// ==========================================
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const selectFunc = document.getElementById('lab1FuncSelect');
  const sliderC = document.getElementById('lab1SliderC');
  const sliderX0 = document.getElementById('lab1SliderX0');
  const valC = document.getElementById('lab1ValC');
  const valX0 = document.getElementById('lab1ValX0');
  const output = document.getElementById('lab1Output');

  function drawLab1() {
    const fnType = selectFunc.value;
    const cVal = parseFloat(sliderC.value);
    const x0 = parseFloat(sliderX0.value);
    valC.textContent = cVal.toFixed(1);
    valX0.textContent = x0.toFixed(1);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const ox = w / 2;
    const oy = h / 2;
    const scale = 38;

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let px = ox % scale; px < w; px += scale) {
      ctx.beginPath(); ctx.moveTo(px, 0); ctx.lineTo(px, h); ctx.stroke();
    }
    for (let py = oy % scale; py < h; py += scale) {
      ctx.beginPath(); ctx.moveTo(0, py); ctx.lineTo(w, py); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('x', w - 15, oy - 8);
    ctx.fillText('y', ox + 8, 15);
    ctx.fillText('O', ox - 12, oy + 14);

    // Mathematical definition for f(x) and F(x)
    let f, F, fName, FName;
    if (fnType === 'linear') {
      f = x => 2 * x;
      F = (x, C) => x * x + C;
      fName = 'f(x) = 2x';
      FName = 'F(x) = x^2 + C';
    } else if (fnType === 'quad') {
      f = x => 3 * x * x - 1;
      F = (x, C) => x * x * x - x + C;
      fName = 'f(x) = 3x^2 - 1';
      FName = 'F(x) = x^3 - x + C';
    } else if (fnType === 'trig') {
      f = x => Math.cos(x);
      F = (x, C) => Math.sin(x) + C;
      fName = 'f(x) = \\cos x';
      FName = 'F(x) = \\sin x + C';
    } else {
      f = x => Math.exp(x);
      F = (x, C) => Math.exp(x) + C;
      fName = 'f(x) = e^x';
      FName = 'F(x) = e^x + C';
    }

    // 1. Draw Derivative f(x) (dashed purple)
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.8;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= w; px += 2) {
      const x = (px - ox) / scale;
      const y = f(x);
      const py = oy - y * scale;
      if (py >= -100 && py <= h + 100) {
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Draw Family of Antiderivatives (Ghost curves)
    const ghostConstants = [-3, -1.5, 1.5, 3];
    ghostConstants.forEach(cGhost => {
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      let st = false;
      for (let px = 0; px <= w; px += 2) {
        const x = (px - ox) / scale;
        const y = F(x, cGhost);
        const py = oy - y * scale;
        if (py >= -100 && py <= h + 100) {
          if (!st) { ctx.moveTo(px, py); st = true; }
          else ctx.lineTo(px, py);
        }
      }
      ctx.stroke();
    });

    // 3. Draw Selected Antiderivative F(x) + C (Solid Cyan)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    started = false;
    for (let px = 0; px <= w; px += 2) {
      const x = (px - ox) / scale;
      const y = F(x, cVal);
      const py = oy - y * scale;
      if (py >= -100 && py <= h + 100) {
        if (!started) { ctx.moveTo(px, py); started = true; }
        else ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // 4. Tangent line at x0 on selected curve
    const y0 = F(x0, cVal);
    const slope = f(x0);
    const px0 = ox + x0 * scale;
    const py0 = oy - y0 * scale;

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    const dx = 1.8;
    const pxL = ox + (x0 - dx) * scale;
    const pyL = oy - (y0 - slope * dx) * scale;
    const pxR = ox + (x0 + dx) * scale;
    const pyR = oy - (y0 + slope * dx) * scale;
    ctx.beginPath();
    ctx.moveTo(pxL, pyL);
    ctx.lineTo(pxR, pyR);
    ctx.stroke();

    // Point (x0, y0)
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px0, py0, 5, 0, Math.PI * 2);
    ctx.fill();

    // Legend
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`F(x) + C (C = ${cVal.toFixed(1)})`, 20, 25);
    ctx.fillStyle = '#a855f7';
    ctx.fillText(`Hàm f(x) (đạo hàm)`, 20, 45);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`Tiếp tuyến tại x₀ = ${x0.toFixed(1)}: k = f(x₀) = ${slope.toFixed(2)}`, 20, 65);

    output.innerHTML = `
      <strong>💡 Khám phá toán học:</strong><br>
      • Hàm số ban đầu: $f(x) = ${fName}$.<br>
      • Họ nguyên hàm: $F(x) = ${FName}$. Tại $C = ${cVal.toFixed(1)}$, đồ thị đi qua điểm $(0; ${cVal.toFixed(1)})$.<br>
      • Hệ số góc tiếp tuyến tại $x_0 = ${x0.toFixed(1)}$: $k = F'(${x0.toFixed(1)}) = f(${x0.toFixed(1)}) = \\mathbf{${slope.toFixed(2)}}$. Mọi đường cong trong họ khi dịch chuyển $C$ đều có chung hệ số góc tiếp tuyến tại cùng hoành độ $x_0$!
    `;
    renderMathInTree(output);

    if (!appState.badges[2]) unlockBadge(2);
  }

  selectFunc.addEventListener('change', drawLab1);
  sliderC.addEventListener('input', drawLab1);
  sliderX0.addEventListener('input', drawLab1);
  drawLab1();
}

// ==========================================
// LAB 2: MÁY BAY CẤT CÁNH & TÍCH LŨY QUÃNG ĐƯỜNG
// ==========================================
function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sliderT = document.getElementById('lab2SliderT');
  const sliderA = document.getElementById('lab2SliderA');
  const valT = document.getElementById('lab2ValT');
  const valA = document.getElementById('lab2ValA');
  const btnPlay = document.getElementById('lab2BtnPlay');
  const output = document.getElementById('lab2Output');

  let isPlaying = false;
  let animId = null;

  function renderLab2() {
    const t = parseFloat(sliderT.value);
    const a = parseFloat(sliderA.value);
    valT.textContent = t.toFixed(0);
    valA.textContent = a.toFixed(1);

    const v0 = 5;
    const vCurrent = v0 + a * t;
    const sCurrent = v0 * t + 0.5 * a * t * t;
    const sMax = v0 * 30 + 0.5 * a * 30 * 30;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // 1. Draw Runway (Upper half: y from 0 to 140)
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, w, 140);

    // Runway markings
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, 138); ctx.lineTo(w, 138);
    ctx.stroke();

    // Center dash lines
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 3;
    ctx.setLineDash([16, 12]);
    ctx.beginPath();
    ctx.moveTo(0, 70); ctx.lineTo(w, 70);
    ctx.stroke();
    ctx.setLineDash([]);

    // Plane position on runway
    const runwayProgress = Math.min(sCurrent / sMax, 1);
    const planeX = 30 + runwayProgress * (w - 100);
    const planeY = t >= 28 ? 70 - (t - 28) * 15 : 70;

    // Draw Airplane (Stylized ✈️)
    ctx.save();
    ctx.translate(planeX, planeY);
    if (t >= 28) ctx.rotate(-0.15);

    // Fuselage
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.ellipse(0, 0, 26, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Wings
    ctx.fillStyle = '#818cf8';
    ctx.beginPath();
    ctx.moveTo(-6, 0); ctx.lineTo(-14, -22); ctx.lineTo(-4, -22); ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(-6, 0); ctx.lineTo(-14, 22); ctx.lineTo(-4, 22); ctx.lineTo(8, 0);
    ctx.closePath();
    ctx.fill();

    // Tail fin
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(-20, 0); ctx.lineTo(-28, -14); ctx.lineTo(-22, -14); ctx.lineTo(-14, 0);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // Status text on Runway
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`✈️ Vận tốc: ${vCurrent.toFixed(1)} m/s (${(vCurrent * 3.6).toFixed(0)} km/h)`, 20, 25);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`🏁 Quãng đường: ${sCurrent.toFixed(1)} m`, 20, 45);

    // 2. Draw v(t) graph & Area (Lower half: y from 150 to 310)
    const gLeft = 50;
    const gRight = w - 30;
    const gTop = 160;
    const gBottom = 300;

    // Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(gLeft, gTop); ctx.lineTo(gLeft, gBottom);
    ctx.lineTo(gRight, gBottom);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText('v (m/s)', gLeft - 38, gTop + 10);
    ctx.fillText('t (s)', gRight - 15, gBottom + 15);
    ctx.fillText('0', gLeft - 10, gBottom + 12);
    ctx.fillText('30s', gRight - 15, gBottom + 12);

    // Draw shaded area under v(t) up to current t
    const tScale = (gRight - gLeft) / 30;
    const maxV = v0 + a * 30;
    const vScale = (gBottom - gTop - 20) / maxV;

    const curPx = gLeft + t * tScale;

    ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.beginPath();
    ctx.moveTo(gLeft, gBottom);
    for (let u = 0; u <= t; u += 0.5) {
      const px = gLeft + u * tScale;
      const py = gBottom - (v0 + a * u) * vScale;
      ctx.lineTo(px, py);
    }
    ctx.lineTo(curPx, gBottom);
    ctx.closePath();
    ctx.fill();

    // Line v(u)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let u = 0; u <= 30; u += 1) {
      const px = gLeft + u * tScale;
      const py = gBottom - (v0 + a * u) * vScale;
      if (u === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Current point
    const curPy = gBottom - vCurrent * vScale;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(curPx, curPy, 4.5, 0, Math.PI * 2);
    ctx.fill();

    // Area Label
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`Diện tích tích phân = s(t) = ${sCurrent.toFixed(0)} m`, gLeft + 15, gTop + 35);

    output.innerHTML = `
      <strong>🛫 Động học tích phân chạy đà:</strong><br>
      • Vận tốc tức thời: $v(t) = ${v0} + ${a.toFixed(1)}t$ (m/s). Tại $t = ${t}\\text{ s} \\Rightarrow v = \\mathbf{${vCurrent.toFixed(1)}}\\text{ m/s}$.<br>
      • Quãng đường là nguyên hàm: $s(t) = \\int_0^t (${v0} + ${a.toFixed(1)}u)du = 5t + ${(a/2).toFixed(2)}t^2 = \\mathbf{${sCurrent.toFixed(1)}}\\text{ mét}$.<br>
      • Khi rời đường băng ở $t = 30\\text{ s}$: Vận tốc đạt $v(30) = ${v0 + a * 30}\\text{ m/s}$ và quãng đường đã chạy là $s(30) = ${sMax.toFixed(0)}\\text{ mét}$.
    `;
    renderMathInTree(output);
  }

  sliderT.addEventListener('input', renderLab2);
  sliderA.addEventListener('input', renderLab2);

  btnPlay.addEventListener('click', () => {
    if (isPlaying) {
      isPlaying = false;
      cancelAnimationFrame(animId);
      btnPlay.textContent = '▶ Tự động chạy';
      return;
    }

    isPlaying = true;
    btnPlay.textContent = '⏸ Tạm dừng';
    sliderT.value = '0';

    function step() {
      if (!isPlaying) return;
      let cur = parseFloat(sliderT.value);
      if (cur < 30) {
        cur += 0.2;
        sliderT.value = cur.toString();
        renderLab2();
        animId = requestAnimationFrame(step);
      } else {
        isPlaying = false;
        btnPlay.textContent = '▶ Tự động chạy';
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
