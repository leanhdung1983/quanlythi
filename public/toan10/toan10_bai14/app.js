/**
 * BÀI 14: CÁC SỐ ĐẶC TRƯNG ĐO ĐỘ PHÂN TÁN - TOÁN 10 KNTT
 * Pure Vanilla JavaScript ES6+ • Web Audio API • 2D Canvas • Offline MathML
 */

// === 1. AUDIO SYNTHESIZER (WEB AUDIO API) ===
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playTone(freq, type, duration, delay = 0, gainLevel = 0.15) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    setTimeout(() => {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // audio handling
      }
    }, delay * 1000);
  }

  playCorrect() {
    this.playTone(523.25, 'sine', 0.15, 0, 0.2);
    this.playTone(659.25, 'sine', 0.15, 0.1, 0.2);
    this.playTone(783.99, 'sine', 0.25, 0.2, 0.25);
  }

  playWrong() {
    this.playTone(329.63, 'sawtooth', 0.2, 0, 0.2);
    this.playTone(261.63, 'sawtooth', 0.3, 0.15, 0.2);
  }

  playClick() {
    this.playTone(800, 'triangle', 0.04, 0, 0.08);
  }

  playLevelUp() {
    this.playTone(440, 'triangle', 0.12, 0, 0.2);
    this.playTone(554.37, 'triangle', 0.12, 0.1, 0.2);
    this.playTone(659.25, 'triangle', 0.15, 0.2, 0.2);
    this.playTone(880, 'triangle', 0.3, 0.3, 0.25);
  }

  playFanfare() {
    const notes = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5];
    const delays = [0, 0.12, 0.24, 0.36, 0.48, 0.65];
    notes.forEach((n, i) => this.playTone(n, 'triangle', 0.25, delays[i], 0.25));
  }
}

const sfx = new SoundEffects();

// === 2. MATHML OFFLINE TOKENIZER & RENDERER ===
const mathSymbols = [
  // Greek capital
  ["\\Delta", "<mi>&#916;</mi>"],
  ["\\Sigma", "<mo>&#8721;</mo>"],
  ["\\Omega", "<mi>&#937;</mi>"],

  // Greek lowercase
  ["\\delta", "<mi>&#948;</mi>"],
  ["\\sigma", "<mi>&#963;</mi>"],
  ["\\mu", "<mi>&#956;</mi>"],
  ["\\alpha", "<mi>&#945;</mi>"],
  ["\\beta", "<mi>&#946;</mi>"],
  ["\\gamma", "<mi>&#947;</mi>"],
  ["\\pi", "<mi>&#960;</mi>"],
  ["\\theta", "<mi>&#952;</mi>"],

  // Relational & Operations
  ["\\approx", "<mo>&#8776;</mo>"],
  ["\\pm", "<mo>&#177;</mo>"],
  ["\\mp", "<mo>&#8723;</mo>"],
  ["\\leq", "<mo>&#8804;</mo>"],
  ["\\geq", "<mo>&#8805;</mo>"],
  ["\\le", "<mo>&#8804;</mo>"],
  ["\\ge", "<mo>&#8805;</mo>"],
  ["\\neq", "<mo>&#8800;</mo>"],
  ["\\ne", "<mo>&#8800;</mo>"],
  ["\\times", "<mo>&#215;</mo>"],
  ["\\cdot", "<mo>&#8901;</mo>"],
  ["\\div", "<mo>&#247;</mo>"],
  ["\\sim", "<mo>&#8764;</mo>"],

  // Arrows & Logic
  ["\\implies", "<mo>&#8658;</mo>"],
  ["\\iff", "<mo>&#8660;</mo>"],
  ["\\to", "<mo>&#8594;</mo>"],
  ["\\rightarrow", "<mo>&#8594;</mo>"],

  // Sets & Infinity
  ["\\infty", "<mo>&#8734;</mo>"],
  ["\\in", "<mo>&#8712;</mo>"],
  ["\\notin", "<mo>&#8713;</mo>"],
  ["\\subset", "<mo>&#8834;</mo>"],
  ["\\subseteq", "<mo>&#8838;</mo>"],
  ["\\cup", "<mo>&#8746;</mo>"],
  ["\\cap", "<mo>&#8745;</mo>"],
  ["\\emptyset", "<mo>&#8709;</mo>"],

  // Dots & Spaces
  ["\\dots", "<mo>&#8230;</mo>"],
  ["\\ldots", "<mo>&#8230;</mo>"],
  ["\\cdots", "<mo>&#8943;</mo>"],
  ["\\quad", "<mspace width=\"1em\"/>"],
  ["\\qquad", "<mspace width=\"2em\"/>"],
  ["\\,", "<mspace width=\"0.2em\"/>"],
  ["\\;", "<mspace width=\"0.4em\"/>"],
  ["\\!", ""],

  // Escaped characters
  ["\\{", "<mo>{</mo>"],
  ["\\}", "<mo>}</mo>"],
  ["\\%", "<mo>%</mo>"]
];

function tokenizePlainMath(raw) {
  if (!raw) return '';
  let out = '';
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];

    if (/\s/.test(ch)) {
      out += ' ';
      i++;
      continue;
    }

    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < raw.length && /[0-9,\.]/.test(raw[i])) {
        if ((raw[i] === ',' || raw[i] === '.') && (i + 1 >= raw.length || !/[0-9]/.test(raw[i + 1]))) {
          break;
        }
        num += raw[i];
        i++;
      }
      out += '<mn>' + num + '</mn>';
      continue;
    }

    if (/[a-zA-ZÀ-ỹ]/.test(ch)) {
      let word = '';
      while (i < raw.length && /[a-zA-ZÀ-ỹ]/.test(raw[i])) {
        word += raw[i];
        i++;
      }
      const lower = word.toLowerCase();
      if (['sin', 'cos', 'tan', 'cot', 'log', 'ln', 'lim', 'max', 'min'].includes(lower)) {
        out += `<mi class="m-fn">${word}</mi>`;
      } else if (word.length === 1) {
        out += `<mi>${word}</mi>`;
      } else {
        out += `<mtext>${word}</mtext>`;
      }
      continue;
    }

    if (/[\+\-\service\*\=\/\<\>\(\)\[\]\{\}\,\;\:\!\?\|\'\%]/.test(ch)) {
      let op = ch;
      if (op === '<') op = '&lt;';
      else if (op === '>') op = '&gt;';
      out += `<mo>${op}</mo>`;
      i++;
      continue;
    }

    out += `<mo>${ch}</mo>`;
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

  // 1. Text blocks: \text{...}
  s = s.replace(/\\text\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mtext>' + c + '</mtext>'));
  s = s.replace(/"([^"]*)"/g, (m, c) => savePlaceholder('<mtext>&ldquo;' + c + '&rdquo;</mtext>'));

  // 2. Cases system: \begin{cases} ... \end{cases}
  s = s.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (m, body) => {
    const rows = body.split('\\\\').map(r => r.trim()).filter(Boolean);
    const tableRows = rows.map(r => {
      const parts = r.split('&').map(p => '<mtd>' + convertLatexToMathMLBody(p.trim(), placeholders) + '</mtd>').join('');
      return '<mtr>' + parts + '</mtr>';
    }).join('');
    return savePlaceholder('<mrow><mo>{</mo><mtable>' + tableRows + '</mtable></mrow>');
  });

  // 3. Extensible arrows: \xrightarrow{...}
  s = s.replace(/\\xrightarrow\{([^{}]+)\}/g, (m, c) => {
    return savePlaceholder('<mover accent="false"><mo>&#8594;</mo><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></mover>');
  });

  // 4. Overlines, hats, bars: \overline{...}, \bar{...}, \hat{...}
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => {
    return savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>');
  });
  s = s.replace(/\\bar\{([^{}]+)\}/g, (m, c) => {
    return savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>');
  });
  s = s.replace(/\\hat\{([^{}]+)\}/g, (m, c) => {
    return savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>^</mo></mover>');
  });
  s = s.replace(/\\vec\{([^{}]+)\}/g, (m, c) => {
    return savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>');
  });
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => {
    return savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>');
  });

  // 5. Roots: \sqrt[n]{x}, \sqrt{x}
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, (m, n, x) => {
    return savePlaceholder('<mroot><mrow>' + convertLatexToMathMLBody(x, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow></mroot>');
  });
  let prevSqrt;
  do {
    prevSqrt = s;
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => {
      return savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>');
    });
  } while (s !== prevSqrt);

  // 6. Fractions: \frac{a}{b}
  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => {
      return savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>');
    });
  } while (s !== prevFrac);

  // 7. Summation: \sum_{i=1}^n or \sum
  s = s.replace(/\\sum_\{([^{}]+)\}\^\{([^{}]+)\}/g, (m, lower, upper) => {
    return savePlaceholder('<munderover><mo>&#8721;</mo><mrow>' + convertLatexToMathMLBody(lower, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(upper, placeholders) + '</mrow></munderover>');
  });
  s = s.replace(/\\sum_\{([^{}]+)\}/g, (m, lower) => {
    return savePlaceholder('<munder><mo>&#8721;</mo><mrow>' + convertLatexToMathMLBody(lower, placeholders) + '</mrow></munder>');
  });
  s = s.replace(/\\sum/g, savePlaceholder('<mo>&#8721;</mo>'));

  // 8. Degree notation
  s = s.replace(/\^\{\\circ\}/g, savePlaceholder('<mo>&#176;</mo>'));
  s = s.replace(/\^\\circ/g, savePlaceholder('<mo>&#176;</mo>'));

  // 9. Symbols from table
  for (const [k, v] of mathSymbols) {
    if (s.includes(k)) {
      s = s.split(k).join(savePlaceholder(v));
    }
  }

  // 10. Superscripts & Subscripts
  let prevSup;
  do {
    prevSup = s;
    s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)\^\{([^{}]+)\}/g, (m, b, exp) => {
      return savePlaceholder('<msup><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(exp, placeholders) + '</mrow></msup>');
    });
    s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)\^([a-zA-Z0-9])/g, (m, b, exp) => {
      return savePlaceholder('<msup><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(exp, placeholders) + '</mrow></msup>');
    });
  } while (s !== prevSup);

  let prevSub;
  do {
    prevSub = s;
    s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)_\{([^{}]+)\}/g, (m, b, sub) => {
      return savePlaceholder('<msub><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(sub, placeholders) + '</mrow></msub>');
    });
    s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)_([a-zA-Z0-9])/g, (m, b, sub) => {
      return savePlaceholder('<msub><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(sub, placeholders) + '</mrow></msub>');
    });
  } while (s !== prevSub);

  // 11. Tokenize remaining segments outside placeholders
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

function latexToMathML(latex, display = false) {
  if (typeof window !== "undefined" && window.katex && typeof window.katex.renderToString === "function") {
    try {
      let s = latex.trim();
      s = s.replace(/(^|[^\\])%/g, '$1\\%');
      return window.katex.renderToString(s, {
        throwOnError: false,
        displayMode: display,
        strict: false
      });
    } catch (e) {
      console.warn("KaTeX render error:", e);
    }
  }
  const placeholders = [];
  const body = convertLatexToMathMLBody(latex, placeholders);
  const dispAttr = display ? ' display="block"' : '';
  const cls = display ? 'math-block' : 'math-inline';
  return `<span class="${cls}"><math xmlns="http://www.w3.org/1998/Math/MathML"${dispAttr}><mrow>${body}</mrow></math></span>`;
}

function formatMathText(str) {
  if (typeof str !== 'string' || !str) return str || '';
  if (typeof window !== "undefined" && window.katex && typeof window.katex.renderToString === "function") {
    str = str.replace(/\$\$([\s\S]*?)\$\$/g, (m, latex) => {
      try {
        let s = latex.trim().replace(/(^|[^\\])%/g, '$1\\%');
        return window.katex.renderToString(s, { throwOnError: false, displayMode: true, strict: false });
      } catch(e) { return m; }
    });
    str = str.replace(/\$([^\$\n]+?)\$/g, (m, latex) => {
      try {
        let s = latex.trim().replace(/(^|[^\\])%/g, '$1\\%');
        return window.katex.renderToString(s, { throwOnError: false, displayMode: false, strict: false });
      } catch(e) { return m; }
    });
    return str;
  }
  // MathML Fallback
  str = str.replace(/\$\$([\s\S]*?)\$\$/g, (m, latex) => latexToMathML(latex, true));
  str = str.replace(/\$([^\$\n]+?)\$/g, (m, latex) => latexToMathML(latex, false));
  return str;
}

function renderMathInTree(root = document.body) {
  if (!root) return;
  if (typeof renderMathInElement === "function") {
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
      console.warn("KaTeX renderMathInElement error:", e);
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
      if (node.nodeValue && node.nodeValue.includes('$')) {
        return NodeFilter.FILTER_ACCEPT;
      }
      return NodeFilter.FILTER_REJECT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) {
    nodes.push(walker.currentNode);
  }

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

// === 3. STATE MANAGEMENT ===
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Kiểm Soát Biến Động',
  stars: 5,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const nameEl = document.getElementById('userNameDisplay');
  const avatarEl = document.getElementById('avatarBtn');
  const certName = document.getElementById('certStudentName');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = appState.streak;
  if (starEl) starEl.textContent = '★'.repeat(appState.stars) + '☆'.repeat(5 - appState.stars);
  if (nameEl) nameEl.textContent = appState.userName;
  if (avatarEl) avatarEl.textContent = appState.avatar;
  if (certName) certName.textContent = appState.userName;
}

function unlockBadge(idx, title) {
  if (!appState.badges[idx]) {
    appState.badges[idx] = true;
    const badgeEl = document.getElementById(`badge-${idx + 1}`);
    if (badgeEl) {
      badgeEl.classList.remove('locked');
      badgeEl.classList.add('unlocked');
    }
    sfx.playLevelUp();
  }
}

// === 4. QUIZ DATA (10 QUESTIONS FROM SGK TRANG 88 - 89) ===
const quizData = [
  {
    id: 1,
    title: "Bài 5.11(1) SGK Trang 88: Mức Độ Tập Trung Và Độ Lệch Chuẩn",
    pts: 20,
    question: "Khẳng định: \"Nếu các giá trị của mẫu số liệu càng tập trung quanh giá trị trung bình thì độ lệch chuẩn càng lớn\", đúng hay sai?",
    options: [
      { text: "A. Đúng", correct: false },
      { text: "B. Sai, độ lệch chuẩn càng nhỏ (gần 0)", correct: true },
      { text: "C. Độ lệch chuẩn không thay đổi", correct: false },
      { text: "D. Chỉ đúng khi mẫu có ít hơn 10 phần tử", correct: false }
    ],
    explanation: "Độ lệch chuẩn $s = \\sqrt{\\frac{\\sum (x_i - \\bar{x})^2}{n}}$ đo mức độ phân tán. Khi các giá trị càng gần sát $\\bar{x}$, hiệu $(x_i - \\bar{x})$ càng nhỏ, do đó độ lệch chuẩn càng bé."
  },
  {
    id: 2,
    title: "Bài 5.11(2,3) SGK Trang 88: Thông Tin Sử Dụng Trong $R$ và $\\Delta_Q$",
    pts: 20,
    question: "Trong hai khẳng định sau: (I) Khoảng biến thiên $R$ chỉ sử dụng thông tin $x_{\\max}$ và $x_{\\min}$; (II) Khoảng tứ phân vị $\\Delta_Q$ có sử dụng thông tin $x_{\\max}$ và $x_{\\min}$:",
    options: [
      { text: "A. Cả hai khẳng định đều đúng", correct: false },
      { text: "B. Khẳng định (I) đúng, khẳng định (II) sai", correct: true },
      { text: "C. Khẳng định (I) sai, khẳng định (II) đúng", correct: false },
      { text: "D. Cả hai khẳng định đều sai", correct: false }
    ],
    explanation: "Khoảng biến thiên $R = x_{\\max} - x_{\\min}$ chỉ dùng 2 giá trị cực biên. Khoảng tứ phân vị $\\Delta_Q = Q_3 - Q_1$ chỉ phụ thuộc vào $Q_1$ và $Q_3$, hoàn toàn không sử dụng $x_{\\max}$ hay $x_{\\min}$."
  },
  {
    id: 3,
    title: "Bài 5.11(5) SGK Trang 88: Dấu Của Các Số Đo Độ Phân Tán",
    pts: 20,
    question: "Khẳng định: \"Tất cả các số đo độ phân tán ($R, \\Delta_Q, s^2, s$) đều không âm\", đúng hay sai?",
    options: [
      { text: "A. Đúng, chúng luôn $\\ge 0$", correct: true },
      { text: "B. Sai, phương sai có thể nhận giá trị âm", correct: false },
      { text: "C. Sai, khoảng tứ phân vị có thể âm khi dữ liệu giảm dần", correct: false },
      { text: "D. Sai khi số trung bình mang dấu âm", correct: false }
    ],
    explanation: "Vì $x_{\\max} \\ge x_{\\min} \\implies R \\ge 0$; $Q_3 \\ge Q_1 \\implies \\Delta_Q \\ge 0$; phương sai là tổng bình phương nên $s^2 \\ge 0$; độ lệch chuẩn $s = \\sqrt{s^2} \\ge 0$."
  },
  {
    id: 4,
    title: "Bài 5.12 SGK Trang 88: So Sánh Phương Sai Trên Biểu Đồ Chấm",
    pts: 20,
    question: "Mẫu A có các điểm trải đều từ 3 đến 9 (mỗi điểm có 2 chấm); Mẫu B có các điểm tập trung dày đặc ở 5, 6, 7 (điểm 6 có 5 chấm, các điểm khác ít). Mẫu nào có phương sai lớn hơn?",
    options: [
      { text: "A. Mẫu A có phương sai lớn hơn mẫu B", correct: true },
      { text: "B. Mẫu B có phương sai lớn hơn mẫu A", correct: false },
      { text: "C. Hai mẫu có phương sai bằng nhau vì cùng trung bình bằng 6", correct: false },
      { text: "D. Không thể kết luận nếu không tính số liệu cụ thể", correct: false }
    ],
    explanation: "Cả hai mẫu đều có $\\bar{x} = 6$. Ở mẫu B, đa số điểm tập trung sát 6 nên độ lệch $(x_i - \\bar{x})^2$ rất nhỏ. Ở mẫu A, dữ liệu dàn trải rộng sang 3 và 9 nên phương sai của A lớn hơn nhiều."
  },
  {
    id: 5,
    title: "Bài 5.13a SGK Trang 88: Nhân Mỗi Giá Trị Với 2",
    pts: 20,
    question: "Nếu nhân mỗi giá trị của mẫu số liệu với $2$, các số đo độ phân tán ($R, \\Delta_Q, s, s^2$) sẽ biến đổi thế nào?",
    options: [
      { text: "A. $R, \\Delta_Q, s$ tăng gấp 2 lần; phương sai $s^2$ tăng gấp 4 lần", correct: true },
      { text: "B. Tất cả $R, \\Delta_Q, s, s^2$ đều tăng gấp 2 lần", correct: false },
      { text: "C. $R$ và $\\Delta_Q$ tăng 2 lần, còn $s$ và $s^2$ không đổi", correct: false },
      { text: "D. Tất cả đều không đổi", correct: false }
    ],
    explanation: "Khi $y_i = 2x_i$: $R' = 2x_{\\max} - 2x_{\\min} = 2R$; $\\Delta_Q' = 2Q_3 - 2Q_1 = 2\\Delta_Q$; $s' = 2s$; và $(s')^2 = (2s)^2 = 4s^2$."
  },
  {
    id: 6,
    title: "Bài 5.13b SGK Trang 88: Cộng Mỗi Giá Trị Với 2",
    pts: 20,
    question: "Nếu cộng mỗi giá trị của mẫu số liệu với $2$ (ví dụ cộng 2 điểm chuyên cần), các số đo độ phân tán ($R, \\Delta_Q, s, s^2$) thay đổi thế nào?",
    options: [
      { text: "A. Tất cả đều tăng thêm 2 đơn vị", correct: false },
      { text: "B. Tất cả đều không thay đổi", correct: true },
      { text: "C. Phương sai tăng thêm 4 đơn vị", correct: false },
      { text: "D. Khoảng biến thiên tăng thêm 2 đơn vị", correct: false }
    ],
    explanation: "Khi tịnh tiến $y_i = x_i + 2$: $R' = (x_{\\max}+2) - (x_{\\min}+2) = R$; $\\Delta_Q' = (Q_3+2) - (Q_1+2) = \\Delta_Q$; và vì $\\bar{y} = \\bar{x} + 2$ nên $(y_i - \\bar{y}) = (x_i - \\bar{x})$, dẫn tới phương sai $s^2$ và độ lệch chuẩn $s$ hoàn toàn không đổi!"
  },
  {
    id: 7,
    title: "Bài 5.14a,b SGK Trang 88: Phân Bố Thuế Thuốc Lá 51 Thành Phố",
    pts: 20,
    question: "Mẫu số liệu thuế thuốc lá: $x_{\\min} = 2,5; Q_1 = 36; Q_2 = 60; Q_3 = 100; x_{\\max} = 205$. Tỉ lệ thành phố có mức thuế lớn hơn 36 là bao nhiêu?",
    options: [
      { text: "A. $25\\%$", correct: false },
      { text: "B. $50\\%$", correct: false },
      { text: "C. $75\\%$", correct: true },
      { text: "D. $90\\%$", correct: false }
    ],
    explanation: "Vì $Q_1 = 36$ là tứ phân vị thứ nhất, chia mẫu thành $25\\%$ phần tử nhỏ hơn hoặc bằng 36 và $75\\%$ phần tử lớn hơn hoặc bằng 36."
  },
  {
    id: 8,
    title: "Bài 5.14c SGK Trang 88: Khoảng Tứ Phân Vị Thuế Thuốc Lá",
    pts: 20,
    question: "Khoảng tứ phân vị $\\Delta_Q$ của mẫu số liệu thuế thuốc lá ở câu trên là:",
    options: [
      { text: "A. $\\Delta_Q = 64$", correct: true },
      { text: "B. $\\Delta_Q = 40$", correct: false },
      { text: "C. $\\Delta_Q = 202,5$", correct: false },
      { text: "D. $\\Delta_Q = 75$", correct: false }
    ],
    explanation: "Áp dụng định nghĩa khoảng tứ phân vị: $\\Delta_Q = Q_3 - Q_1 = 100 - 36 = 64$."
  },
  {
    id: 9,
    title: "Ví Dụ 4 SGK Trang 87: Hàng Rào Dò Tìm Giá Trị Bất Thường",
    pts: 20,
    question: "Cho mẫu số liệu có $Q_1 = 135$ và $Q_3 = 205$. Hai hàng rào xác định giá trị bất thường (dị biệt) là:",
    options: [
      { text: "A. $Q_1 - 1,5\\Delta_Q = 30$ và $Q_3 + 1,5\\Delta_Q = 310$", correct: true },
      { text: "B. $Q_1 - \\Delta_Q = 65$ và $Q_3 + \\Delta_Q = 275$", correct: false },
      { text: "C. $Q_1 - 2\\Delta_Q = -5$ và $Q_3 + 2\\Delta_Q = 345$", correct: false },
      { text: "D. $0$ và $340$", correct: false }
    ],
    explanation: "Ta có $\\Delta_Q = 205 - 135 = 70$. Hàng rào dưới: $Q_1 - 1,5\\Delta_Q = 135 - 1,5 \\times 70 = 30$. Hàng rào trên: $Q_3 + 1,5\\Delta_Q = 205 + 1,5 \\times 70 = 310$."
  },
  {
    id: 10,
    title: "Luyện Tập 4 SGK Trang 87: Kiểm Tra Giá Trị 10 và 100",
    pts: 20,
    question: "Mẫu số liệu có $Q_1 = 56$ và $Q_3 = 84$. Trong hai giá trị $10$ và $100$, giá trị nào là giá trị bất thường?",
    options: [
      { text: "A. Chỉ có giá trị 10 là giá trị bất thường", correct: true },
      { text: "B. Chỉ có giá trị 100 là giá trị bất thường", correct: false },
      { text: "C. Cả 10 và 100 đều là giá trị bất thường", correct: false },
      { text: "D. Không có giá trị nào là bất thường", correct: false }
    ],
    explanation: "Ta có $\\Delta_Q = 84 - 56 = 28$. Hàng rào dưới: $56 - 1,5 \\times 28 = 56 - 42 = 14$. Hàng rào trên: $84 + 1,5 \\times 28 = 84 + 42 = 126$. Vì $10 < 14$ nên $10$ là giá trị bất thường; còn $14 \\le 100 \\le 126$ nên $100$ là giá trị bình thường."
  }
];

function renderQuiz() {
  const container = document.getElementById("quizContainer");
  if (!container) return;

  container.innerHTML = quizData.map((q, idx) => {
    const isAnswered = appState.answered[q.id] !== undefined;
    const selectedIdx = isAnswered ? appState.answered[q.id] : -1;

    return `
      <div class="quiz-card" id="quizCard-${q.id}">
        <div class="quiz-card-header">
          <span class="quiz-num">Câu ${idx + 1}: ${q.title}</span>
          <span class="quiz-pts">+${q.pts} XP</span>
        </div>
        <div class="quiz-question">${formatMathText(q.question)}</div>
        <div class="quiz-options">
          ${q.options.map((opt, oIdx) => {
            let cls = "quiz-opt-btn";
            if (isAnswered) {
              if (opt.correct) cls += " correct";
              else if (selectedIdx === oIdx) cls += " wrong";
            }
            const cleanText = opt.text.replace(/^[A-D]\.\s*/, '');
            return `
              <button class="${cls}" data-qid="${q.id}" data-oidx="${oIdx}" ${isAnswered ? "disabled" : ""}>
                <span style="font-weight: 700; color: var(--cyan-neon); font-size: 1.05rem;">${String.fromCharCode(65 + oIdx)}.</span>
                <span style="flex: 1;">${formatMathText(cleanText)}</span>
              </button>
            `;
          }).join("")}
        </div>
        <div class="explanation-box ${isAnswered ? "show" : ""}" id="expl-${q.id}">
          <strong style="color: var(--cyan-neon);">💡 Lời giải chi tiết:</strong><br>
          ${formatMathText(q.explanation)}
        </div>
      </div>
    `;
  }).join("");

  updateArenaStats();
  renderMathInTree(container);

  container.querySelectorAll(".quiz-opt-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const qid = parseInt(btn.dataset.qid);
      const oidx = parseInt(btn.dataset.oidx);
      handleAnswer(qid, oidx);
    });
  });
}

function handleAnswer(qid, oidx) {
  if (appState.answered[qid] !== undefined) return;
  const q = quizData.find(item => item.id === qid);
  if (!q) return;

  const isCorrect = q.options[oidx].correct;
  appState.answered[qid] = oidx;

  if (isCorrect) {
    appState.xp += q.pts;
    appState.streak += 1;
    sfx.playCorrect();
  } else {
    appState.streak = 0;
    sfx.playWrong();
  }

  if (appState.streak >= 3) unlockBadge(2, "Bách Phát Bách Trúng");
  if (appState.xp >= 160) unlockBadge(3, "Chiến Thần Độ Phân Tán");

  const totalAnswered = Object.keys(appState.answered).length;
  if (totalAnswered === 10) {
    const allCorrect = quizData.every(item => item.options[appState.answered[item.id]]?.correct);
    if (allCorrect) {
      unlockBadge(4, "Đại Kiện Tướng Phương Sai");
      sfx.playFanfare();
    }
  }

  updateHUD();
  renderQuiz();
}

function updateArenaStats() {
  const count = Object.keys(appState.answered).length;
  const progressEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progressEl) progressEl.textContent = `${count}/10`;
  if (scoreEl) scoreEl.textContent = `${appState.xp} XP`;
}

// === 5. INTERACTIVE LAB 1: BOX PLOT & OUTLIER DETECTOR ===
class BoxPlotLab {
  constructor() {
    this.canvas = document.getElementById('boxPlotCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.caseIdx = 0; // 0: Natri, 1: Cinema, 2: Unemployment
    this.datasets = [
      {
        name: 'Natri Ngũ Cốc (Ví dụ 4 SGK)',
        data: [0, 50, 70, 100, 130, 140, 140, 150, 160, 180, 180, 180, 190, 200, 200, 210, 210, 220, 290, 340],
        unit: 'mg'
      },
      {
        name: 'Ghế Trống Rạp Chiếu Phim (Ví dụ 2 SGK)',
        data: [7, 8, 11, 13, 15, 18, 19, 20, 22],
        unit: 'ghế'
      },
      {
        name: 'Tỉ Lệ Thất Nghiệp Quốc Gia (Bài 5.16 SGK)',
        data: [3.2, 3.6, 4.4, 4.5, 5.0, 5.4, 6.0, 6.7, 7.0, 7.2, 7.7, 7.8, 8.4, 8.6, 8.7],
        unit: '%'
      }
    ];
    this.initControls();
    this.draw();
  }

  initControls() {
    const bN = document.getElementById('btnSetNatri');
    const bC = document.getElementById('btnSetCinema');
    const bU = document.getElementById('btnSetUnemploy');

    if (bN) {
      bN.addEventListener('click', () => {
        this.caseIdx = 0;
        this.setActive(bN);
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }

    if (bC) {
      bC.addEventListener('click', () => {
        this.caseIdx = 1;
        this.setActive(bC);
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }

    if (bU) {
      bU.addEventListener('click', () => {
        this.caseIdx = 2;
        this.setActive(bU);
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }
  }

  setActive(btn) {
    document.querySelectorAll('#tab-labs .lab-card:nth-child(1) .lab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  calcStats() {
    const raw = [...this.datasets[this.caseIdx].data].sort((a, b) => a - b);
    const n = raw.length;

    const getMedian = (arr) => {
      const len = arr.length;
      return len % 2 === 1 ? arr[Math.floor(len / 2)] : (arr[len / 2 - 1] + arr[len / 2]) / 2;
    };

    const q2 = getMedian(raw);
    let leftHalf = [], rightHalf = [];
    if (n % 2 === 1) {
      leftHalf = raw.slice(0, Math.floor(n / 2));
      rightHalf = raw.slice(Math.floor(n / 2) + 1);
    } else {
      leftHalf = raw.slice(0, n / 2);
      rightHalf = raw.slice(n / 2);
    }

    const q1 = getMedian(leftHalf);
    const q3 = getMedian(rightHalf);
    const deltaQ = q3 - q1;
    const lowerFence = q1 - 1.5 * deltaQ;
    const upperFence = q3 + 1.5 * deltaQ;

    // Detect outliers
    const outliers = raw.filter(x => x < lowerFence || x > upperFence);
    const valid = raw.filter(x => x >= lowerFence && x <= upperFence);

    const minValid = valid.length ? valid[0] : raw[0];
    const maxValid = valid.length ? valid[valid.length - 1] : raw[raw.length - 1];

    return { raw, q1, q2, q3, deltaQ, lowerFence, upperFence, outliers, minValid, maxValid };
  }

  updateMetrics() {
    const { deltaQ, lowerFence, upperFence, outliers } = this.calcStats();
    const unit = this.datasets[this.caseIdx].unit;

    const elIQR = document.getElementById('outIQR');
    const elLow = document.getElementById('outFenceLower');
    const elUp = document.getElementById('outFenceUpper');
    const elOut = document.getElementById('outOutliers');

    if (elIQR) elIQR.textContent = `${deltaQ.toFixed(2)} ${unit}`;
    if (elLow) elLow.textContent = `${lowerFence.toFixed(2)} ${unit}`;
    if (elUp) elUp.textContent = `${upperFence.toFixed(2)} ${unit}`;

    if (elOut) {
      if (outliers.length === 0) {
        elOut.textContent = 'Không có giá trị bất thường';
        elOut.className = 'badge-cyan';
      } else {
        elOut.textContent = `${outliers.join(', ')} ${unit}`;
        elOut.className = 'badge-green';
      }
    }

    unlockBadge(1, "Thợ Săn Ngoại Lai");
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // BG
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const { raw, q1, q2, q3, lowerFence, upperFence, outliers, minValid, maxValid } = this.calcStats();
    const minVal = Math.min(raw[0], lowerFence);
    const maxVal = Math.max(raw[raw.length - 1], upperFence);
    const pad = (maxVal - minVal) * 0.12 || 1;
    const rMin = minVal - pad;
    const rMax = maxVal + pad;

    const toX = (val) => 60 + ((val - rMin) / (rMax - rMin)) * (w - 120);
    const boxY = h / 2 - 10;
    const boxH = 50;

    // Axis
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, boxY + boxH / 2);
    ctx.lineTo(w - 40, boxY + boxH / 2);
    ctx.stroke();

    // Box [Q1, Q3]
    const xQ1 = toX(q1);
    const xQ3 = toX(q3);
    const xQ2 = toX(q2);

    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.fillRect(xQ1, boxY, xQ3 - xQ1, boxH);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(xQ1, boxY, xQ3 - xQ1, boxH);

    // Median line Q2
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xQ2, boxY);
    ctx.lineTo(xQ2, boxY + boxH);
    ctx.stroke();

    // Whiskers (Râu)
    const xMinValid = toX(minValid);
    const xMaxValid = toX(maxValid);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    // Left whisker
    ctx.beginPath();
    ctx.moveTo(xMinValid, boxY + boxH / 2);
    ctx.lineTo(xQ1, boxY + boxH / 2);
    ctx.moveTo(xMinValid, boxY + 12);
    ctx.lineTo(xMinValid, boxY + boxH - 12);
    ctx.stroke();

    // Right whisker
    ctx.beginPath();
    ctx.moveTo(xQ3, boxY + boxH / 2);
    ctx.lineTo(xMaxValid, boxY + boxH / 2);
    ctx.moveTo(xMaxValid, boxY + 12);
    ctx.lineTo(xMaxValid, boxY + boxH - 12);
    ctx.stroke();

    // Outlier Fences (dashed lines)
    const xLowFence = toX(lowerFence);
    const xUpFence = toX(upperFence);

    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xLowFence, boxY - 20);
    ctx.lineTo(xLowFence, boxY + boxH + 20);
    ctx.moveTo(xUpFence, boxY - 20);
    ctx.lineTo(xUpFence, boxY + boxH + 20);
    ctx.stroke();
    ctx.setLineDash([]);

    // Outlier dots (Red)
    outliers.forEach(val => {
      const x = toX(val);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(x, boxY + boxH / 2, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#f87171';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${val}`, x, boxY + boxH / 2 - 14);
    });

    // Labels
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Q₁ = ${q1.toFixed(1)}`, xQ1, boxY + boxH + 24);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Q₂ = ${q2.toFixed(1)}`, xQ2, boxY - 12);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Q₃ = ${q3.toFixed(1)}`, xQ3, boxY + boxH + 24);

    ctx.fillStyle = '#eab308';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(`Rào dưới: ${lowerFence.toFixed(1)}`, xLowFence, boxY - 26);
    ctx.fillText(`Rào trên: ${upperFence.toFixed(1)}`, xUpFence, boxY - 26);
  }
}

// === 6. INTERACTIVE LAB 2: TRANSFORM SIMULATOR ===
class TransformLab {
  constructor() {
    this.canvas = document.getElementById('transformCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.k = 1.0;
    this.c = 0.0;
    this.caseMode = 0; // 0: Students (An vs Binh), 1: Soccer
    this.rawA = [9.2, 8.7, 9.5, 6.8, 8.0, 8.0, 7.3, 6.5]; // An
    this.rawB = [8.2, 8.1, 8.0, 7.8, 8.3, 7.9, 7.6, 8.1]; // Bình
    this.initControls();
    this.draw();
  }

  initControls() {
    const sK = document.getElementById('sliderK');
    const sC = document.getElementById('sliderC');
    const vK = document.getElementById('valK');
    const vC = document.getElementById('valC');

    if (sK) {
      sK.addEventListener('input', (e) => {
        this.k = parseFloat(e.target.value);
        if (vK) vK.textContent = this.k.toFixed(1);
        this.updateMetrics();
        this.draw();
      });
    }

    if (sC) {
      sC.addEventListener('input', (e) => {
        this.c = parseFloat(e.target.value);
        if (vC) vC.textContent = (this.c >= 0 ? `+${this.c.toFixed(1)}` : `${this.c.toFixed(1)}`);
        this.updateMetrics();
        this.draw();
      });
    }

    const bStu = document.getElementById('btnCaseStudents');
    const bSoc = document.getElementById('btnCaseSoccer');

    if (bStu) {
      bStu.addEventListener('click', () => {
        this.caseMode = 0;
        this.setActive(bStu);
        this.rawA = [9.2, 8.7, 9.5, 6.8, 8.0, 8.0, 7.3, 6.5];
        this.rawB = [8.2, 8.1, 8.0, 7.8, 8.3, 7.9, 7.6, 8.1];
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }

    if (bSoc) {
      bSoc.addEventListener('click', () => {
        this.caseMode = 1;
        this.setActive(bSoc);
        this.rawA = [41, 81, 44, 47, 52]; // Leicester
        this.rawB = [47, 47, 61, 49, 54]; // Everton
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }
  }

  setActive(btn) {
    document.querySelectorAll('#tab-labs .lab-card:nth-child(2) .lab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  calcStats(arr) {
    const transformed = arr.map(x => x * this.k + this.c);
    const n = transformed.length;
    const mean = transformed.reduce((a, b) => a + b, 0) / n;
    const min = Math.min(...transformed);
    const max = Math.max(...transformed);
    const range = max - min;
    const variance = transformed.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    return { transformed, mean, min, max, range, variance, std };
  }

  updateMetrics() {
    const statsA = this.calcStats(this.rawA);
    const elR = document.getElementById('outTransR');
    const elVar = document.getElementById('outTransVar');
    const elStd = document.getElementById('outTransStd');
    const elRule = document.getElementById('outTransRule');

    if (elR) elR.textContent = statsA.range.toFixed(2);
    if (elVar) elVar.textContent = statsA.variance.toFixed(2);
    if (elStd) elStd.textContent = statsA.std.toFixed(2);

    if (elRule) {
      if (this.k === 1.0 && this.c !== 0.0) {
        elRule.textContent = 'Cộng c: R, s, s² hoàn toàn KHÔNG ĐỔI!';
      } else if (this.k !== 1.0) {
        elRule.textContent = `Nhân k: R và s tăng ${this.k} lần; s² tăng ${Math.pow(this.k, 2).toFixed(1)} lần!`;
      } else {
        elRule.textContent = 'Mẫu chuẩn ban đầu';
      }
    }

    unlockBadge(1, "Thợ Săn Ngoại Lai");
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // BG
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    const statsA = this.calcStats(this.rawA);
    const statsB = this.calcStats(this.rawB);

    const all = [...statsA.transformed, ...statsB.transformed];
    const minVal = Math.min(...all);
    const maxVal = Math.max(...all);
    const pad = (maxVal - minVal) * 0.12 || 2;
    const rMin = minVal - pad;
    const rMax = maxVal + pad;

    const toX = (val) => 60 + ((val - rMin) / (rMax - rMin)) * (w - 120);

    const labelA = this.caseMode === 0 ? 'An' : 'Leicester City';
    const labelB = this.caseMode === 0 ? 'Bình (Học đều hơn)' : 'Everton (Ổn định hơn)';

    // Row A
    const yA = 70;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, yA);
    ctx.lineTo(w - 40, yA);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${labelA}: s = ${statsA.std.toFixed(2)}, R = ${statsA.range.toFixed(2)}`, 40, yA - 15);

    statsA.transformed.forEach(val => {
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(toX(val), yA, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Row B
    const yB = 160;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, yB);
    ctx.lineTo(w - 40, yB);
    ctx.stroke();

    ctx.fillStyle = '#34d399';
    ctx.fillText(`${labelB}: s = ${statsB.std.toFixed(2)}, R = ${statsB.range.toFixed(2)}`, 40, yB - 15);

    statsB.transformed.forEach(val => {
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(toX(val), yB, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Summary Note
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Độ lệch chuẩn s nhỏ hơn chứng tỏ dữ liệu đồng đều, ổn định hơn và ít phân tán hơn!', w / 2, h - 18);
  }
}

// === 7. INITIALIZATION & EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', () => {
  renderMathInTree(document.body);

  const tabs = document.querySelectorAll('.lesson-tabs .nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const activeContent = document.getElementById(`tab-${target}`);
      if (activeContent) activeContent.classList.add('active');

      sfx.playClick();
      if (target === 'theory') unlockBadge(0, "Làm Chủ Độ Phân Tán");
      if (target === 'labs') unlockBadge(1, "Thợ Săn Ngoại Lai");
    });
  });

  const soundBtn = document.getElementById('soundToggle') || document.getElementById('soundToggleBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      sfx.enabled = appState.sound;
      soundBtn.textContent = appState.sound ? '🔊' : '🔇';
      soundBtn.title = appState.sound ? 'Tắt âm thanh' : 'Bật âm thanh';
      if (appState.sound) sfx.playClick();
    });
  }

  const resetBtn = document.getElementById('resetProgress') || document.getElementById('resetProgressBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có muốn đặt lại toàn bộ điểm số và bài làm?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        document.querySelectorAll('.badge-item').forEach(b => {
          b.classList.remove('unlocked');
          b.classList.add('locked');
        });
        renderQuiz();
        updateArenaStats();
        updateHUD();
        sfx.playClick();
      }
    });
  }

  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const closeAvatarBtn = document.getElementById('closeAvatarModalBtn');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      avatarModal.style.display = 'flex';
      sfx.playClick();
    });
  }

  if (closeAvatarBtn && avatarModal) {
    closeAvatarBtn.addEventListener('click', () => {
      avatarModal.style.display = 'none';
      sfx.playClick();
    });
  }

  document.querySelectorAll('.avatar-choice').forEach(choice => {
    choice.addEventListener('click', () => {
      appState.avatar = choice.dataset.avatar;
      const titleMap = {
        '👑': 'Đại Kiện Tướng Phân Tán',
        '🚀': 'Phi Hành Gia Vũ Trụ',
        '🧙‍♂️': 'Phù Thủy Thống Kê',
        '🦁': 'Sư Tử Dũng Mãnh',
        '💎': 'Bậc Thầy Kiểm Soát',
        '🦉': 'Cú Thông Thái',
        '🎯': 'Xạ Thủ Logic',
        '🏅': 'Quán Quân Đo Lường'
      };
      appState.userTitle = titleMap[appState.avatar] || 'Chiến Binh Logic';
      updateHUD();
      if (avatarModal) avatarModal.style.display = 'none';
      sfx.playTone(600, 'triangle', 0.1);
    });
  });

  const btnPrintCert = document.getElementById('btnPrintCert');
  if (btnPrintCert) {
    btnPrintCert.addEventListener('click', () => {
      sfx.playClick();
      window.print();
    });
  }

  renderQuiz();
  new BoxPlotLab();
  new TransformLab();
  updateHUD();

  unlockBadge(0, "Làm Chủ Độ Phân Tán");
});

// Đảm bảo quét và render KaTeX toàn trang ngay khi tải và khi DOM sẵn sàng
function triggerMathRender() {
  if (typeof renderMathInTree === "function") {
    renderMathInTree(document.body);
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", triggerMathRender);
} else {
  triggerMathRender();
}
