/**
 * ÔN TẬP CUỐI CHƯƠNG V: MẪU SỐ LIỆU KHÔNG GHÉP NHÓM - TOÁN 10 KNTT
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
  userTitle: 'Tổng Chỉ Huy Thống Kê',
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

// === 4. QUIZ DATA (10 QUESTIONS FROM SGK TRANG 89 - 91) ===
const quizData = [
  {
    id: 1,
    title: "Bài 5.17 SGK Trang 89: Độ Chính Xác Thang Chia Cân",
    pts: 20,
    question: "Khi cân một bao gạo bằng một cân treo với thang chia $0,2\\text{ kg}$ thì độ chính xác $d$ của phép cân là:",
    options: [
      { text: "A. $0,1\\text{ kg}$", correct: true },
      { text: "B. $0,2\\text{ kg}$", correct: false },
      { text: "C. $0,3\\text{ kg}$", correct: false },
      { text: "D. $0,4\\text{ kg}$", correct: false }
    ],
    explanation: "Theo chú ý SGK Trang 75: Trong các phép đo, độ chính xác $d$ của số gần đúng bằng một nửa đơn vị của vạch chia nhỏ nhất của thước đo: $d = \\frac{0,2}{2} = 0,1\\text{ kg}$."
  },
  {
    id: 2,
    title: "Bài 5.18 SGK Trang 89: So Sánh Phương Sai Và Độ Lệch Chuẩn",
    pts: 20,
    question: "Trong hai mẫu số liệu, khẳng định: \"Mẫu nào có phương sai lớn hơn thì có độ lệch chuẩn lớn hơn\", đúng hay sai?",
    options: [
      { text: "A. Đúng", correct: true },
      { text: "B. Sai", correct: false },
      { text: "C. Chỉ đúng khi hai mẫu có cùng số phần tử", correct: false },
      { text: "D. Chỉ đúng khi số trung bình bằng nhau", correct: false }
    ],
    explanation: "Vì độ lệch chuẩn $s = \\sqrt{s^2}$ là hàm đồng biến với $s^2 \\ge 0$. Do đó $s_1^2 > s_2^2 \\iff s_1 > s_2$."
  },
  {
    id: 3,
    title: "Bài 5.19 SGK Trang 89: Tỉ Lệ Dữ Liệu Nằm Giữa $Q_1$ và $Q_3$",
    pts: 20,
    question: "Khẳng định: \"Có $25\\%$ giá trị của mẫu số liệu nằm giữa $Q_1$ và $Q_3$\", đúng hay sai?",
    options: [
      { text: "A. Đúng", correct: false },
      { text: "B. Sai, có khoảng $50\\%$ giá trị nằm giữa $Q_1$ và $Q_3$", correct: true },
      { text: "C. Sai, có $75\\%$ giá trị nằm giữa $Q_1$ và $Q_3$", correct: false },
      { text: "D. Sai, có $100\\%$ giá trị nằm giữa $Q_1$ và $Q_3$", correct: false }
    ],
    explanation: "Tứ phân vị chia mẫu thành 4 phần đều nhau (mỗi phần $25\\%$). Khoảng giữa $Q_1$ và $Q_3$ chứa 2 phần phân vị liên tiếp (từ $Q_1$ đến $Q_2$ là $25\\%$, từ $Q_2$ đến $Q_3$ là $25\\%$) nên tổng cộng chứa khoảng $50\\%$ số liệu."
  },
  {
    id: 4,
    title: "Bài 5.20 SGK Trang 89: Nhận Diện Số Đo Độ Phân Tán",
    pts: 20,
    question: "Số đặc trưng nào sau đây đo độ phân tán của mẫu số liệu?",
    options: [
      { text: "A. Số trung bình", correct: false },
      { text: "B. Mốt", correct: false },
      { text: "C. Trung vị", correct: false },
      { text: "D. Độ lệch chuẩn", correct: true }
    ],
    explanation: "Số trung bình, mốt, trung vị là các số đặc trưng đo xu thế trung tâm. Chỉ có độ lệch chuẩn (cùng với phương sai, khoảng biến thiên, khoảng tứ phân vị) là số đặc trưng đo độ phân tán."
  },
  {
    id: 5,
    title: "Bài 5.21 SGK Trang 89: Cộng Thêm 0,5 Điểm Chuyên Cần",
    pts: 20,
    question: "Điểm các môn học của An: $8, 9, 7, 6, 5, 7, 3$. Nếu An được cộng thêm mỗi môn $0,5$ điểm chuyên cần thì số đặc trưng nào sau đây KHÔNG thay đổi?",
    options: [
      { text: "A. Số trung bình", correct: false },
      { text: "B. Trung vị", correct: false },
      { text: "C. Độ lệch chuẩn", correct: true },
      { text: "D. Tứ phân vị", correct: false }
    ],
    explanation: "Khi cộng thêm hằng số $c = 0,5$ vào mọi giá trị ($y_i = x_i + 0,5$), số trung bình, trung vị và các tứ phân vị đều tăng thêm $0,5$. Riêng độ lệch chuẩn (đo độ phân tán) hoàn toàn không thay đổi."
  },
  {
    id: 6,
    title: "Bài 5.22 SGK Trang 89: Lương Khởi Điểm Của 5 Sinh Viên",
    pts: 20,
    question: "Lương khởi điểm của 5 sinh viên (triệu đồng): $3,5; 9,2; 9,2; 9,5; 10,5$. Tại sao nên dùng trung vị $M_e = 9,2$ thay cho số trung bình $\\bar{x} = 8,38$?",
    options: [
      { text: "A. Vì giá trị $3,5$ triệu đồng là giá trị bất thường thấp kéo tụt số trung bình xuống", correct: true },
      { text: "B. Vì số trung bình lớn hơn mức lương cao nhất", correct: false },
      { text: "C. Vì trung vị luôn lớn hơn số trung bình", correct: false },
      { text: "D. Vì mẫu số liệu có mốt bằng $9,2$", correct: false }
    ],
    explanation: "Trong 5 sinh viên có tới 4 người nhận lương từ 9,2 đến 10,5 triệu đồng. Mức lương 3,5 triệu là quá thấp (dị biệt) khiến số trung bình $\\bar{x} = 8,38$ không phản ánh được mức lương phổ biến của nhóm. Trung vị $M_e = 9,2$ triệu đồng đại diện chính xác hơn."
  },
  {
    id: 7,
    title: "Bài 5.23 SGK Trang 89: So Sánh Điểm Toán Và Tiếng Anh 11 HS",
    pts: 20,
    question: "Tính toán mẫu số liệu điểm 11 HS: Môn Toán ($s_{\\text{Toán}} \\approx 23,2$); Môn Tiếng Anh ($s_{\\text{Anh}} \\approx 11,8$). Kết luận nào ĐÚNG?",
    options: [
      { text: "A. Học sinh học đều môn Tiếng Anh hơn môn Toán", correct: true },
      { text: "B. Học sinh học đều môn Toán hơn môn Tiếng Anh", correct: false },
      { text: "C. Mức độ học đều của hai môn như nhau vì cùng 11 học sinh", correct: false },
      { text: "D. Điểm Toán có độ phân tán nhỏ hơn điểm Tiếng Anh", correct: false }
    ],
    explanation: "Độ lệch chuẩn môn Tiếng Anh ($s_{\\text{Anh}} \\approx 11,8$) nhỏ hơn rất nhiều so với môn Toán ($s_{\\text{Toán}} \\approx 23,2$). Độ lệch chuẩn càng nhỏ thì mức độ phân tán càng thấp, chứng tỏ học sinh học môn Tiếng Anh đồng đều hơn."
  },
  {
    id: 8,
    title: "Bài 5.24 SGK Trang 90: Dân Số 11 Tỉnh/Thành ĐBSH Năm 2018",
    pts: 20,
    question: "Dân số (triệu người) 11 tỉnh ĐBSH: Hà Nội ($7,52$); 10 tỉnh còn lại đều từ $0,81$ đến $2,01$. Nên dùng số đặc trưng nào để đại diện cho dân số các tỉnh?",
    options: [
      { text: "A. Trung vị $M_e = 1,79$ triệu người", correct: true },
      { text: "B. Số trung bình $\\bar{x} = 2,19$ triệu người", correct: false },
      { text: "C. Mốt $M_o = 7,52$ triệu người", correct: false },
      { text: "D. Khoảng biến thiên $R = 6,71$ triệu người", correct: false }
    ],
    explanation: "Hà Nội ($7,52$ triệu người) là đô thị đặc biệt với dân số vượt trội hẳn so với các tỉnh còn lại (outlier). Giá trị này đẩy số trung bình lên $2,19$ triệu (lớn hơn 10/11 tỉnh thành). Trung vị $M_e = 1,79$ triệu người là số đại diện phù hợp nhất."
  },
  {
    id: 9,
    title: "Bài 5.25 SGK Trang 90: Số Trường THPT ĐBSH và ĐBSCL",
    pts: 20,
    question: "Khoảng biến thiên của ĐBSH là $R_1 = 187 - 23 = 164$ trường; của ĐBSCL là $R_2 = 42 - 15 = 27$ trường. Tại sao $R_1$ lại gấp hơn 6 lần $R_2$?",
    options: [
      { text: "A. Do Hà Nội có $187$ trường THPT, là giá trị ngoại lai cực lớn kéo dãn khoảng biến thiên", correct: true },
      { text: "B. Vì ĐBSCL không có trường THPT nào đạt chuẩn", correct: false },
      { text: "C. Do ĐBSH có số tỉnh ít hơn ĐBSCL", correct: false },
      { text: "D. Do phương pháp thống kê của hai vùng khác nhau", correct: false }
    ],
    explanation: "Hà Nội là thủ đô có quy mô học sinh và trường lớp rất lớn ($187$ trường, trong khi tỉnh đứng thứ hai của ĐBSH chỉ có 57 trường). Khoảng biến thiên $R$ phụ thuộc trực tiếp vào $x_{\\max}$ nên bị kéo dãn cực lớn bởi giá trị bất thường này."
  },
  {
    id: 10,
    title: "Bài 5.26 SGK Trang 90: Quy Tròn Tỉ Lệ Suy Dinh Dưỡng",
    pts: 20,
    question: "Mẫu số liệu tỉ lệ trẻ suy dinh dưỡng của 10 tỉnh: Khi làm tròn các giá trị đến hàng đơn vị thì sai số tuyệt đối của phép làm tròn không vượt quá bao nhiêu?",
    options: [
      { text: "A. $0,5\\%$", correct: true },
      { text: "B. $1\\%$", correct: false },
      { text: "C. $0,1\\%$", correct: false },
      { text: "D. $0,25\\%$", correct: false }
    ],
    explanation: "Theo nhận xét SGK Trang 77: Khi thay số đúng bởi số quy tròn đến một hàng nào đó thì sai số tuyệt đối không vượt quá nửa đơn vị hàng làm tròn. Hàng đơn vị có đơn vị là $1$, do đó sai số tuyệt đối không vượt quá $\\frac{1}{2} = 0,5\\%$."
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
  if (appState.xp >= 160) unlockBadge(3, "Chiến Thần Tổng Ôn");

  const totalAnswered = Object.keys(appState.answered).length;
  if (totalAnswered === 10) {
    const allCorrect = quizData.every(item => item.options[appState.answered[item.id]]?.correct);
    if (allCorrect) {
      unlockBadge(4, "Đại Kiện Tướng Thống Kê K10");
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

// === 5. INTERACTIVE LAB 1: MASTER STATISTICS SUITE ===
class MasterStatLab {
  constructor() {
    this.canvas = document.getElementById('masterStatCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.caseIdx = 0;
    this.datasets = [
      {
        name: 'Bài 5.22: Lương Sinh Viên',
        data: [3.5, 9.2, 9.2, 9.5, 10.5],
        unit: 'tr'
      },
      {
        name: 'Bài 5.23: Điểm Toán 11 HS',
        data: [62, 91, 43, 31, 57, 63, 80, 37, 43, 5, 78],
        unit: 'đ'
      },
      {
        name: 'Bài 5.23: Điểm Tiếng Anh 11 HS',
        data: [65, 57, 55, 37, 62, 70, 73, 49, 65, 41, 64],
        unit: 'đ'
      },
      {
        name: 'Bài 5.26: Trẻ Suy Dinh Dưỡng',
        data: [5.5, 13.8, 10.2, 12.2, 11.0, 7.4, 11.4, 13.1, 12.5, 13.4],
        unit: '%'
      }
    ];
    this.initControls();
    this.draw();
  }

  initControls() {
    const b522 = document.getElementById('btnProb522');
    const bMath = document.getElementById('btnProb523Math');
    const bEng = document.getElementById('btnProb523Eng');
    const b526 = document.getElementById('btnProb526');

    const list = [b522, bMath, bEng, b526];
    list.forEach((btn, idx) => {
      if (btn) {
        btn.addEventListener('click', () => {
          this.caseIdx = idx;
          list.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          this.updateMetrics();
          this.draw();
          sfx.playClick();
        });
      }
    });
  }

  calcStats() {
    const raw = [...this.datasets[this.caseIdx].data].sort((a, b) => a - b);
    const n = raw.length;
    const mean = raw.reduce((a, b) => a + b, 0) / n;

    const getMedian = (arr) => {
      const len = arr.length;
      return len % 2 === 1 ? arr[Math.floor(len / 2)] : (arr[len / 2 - 1] + arr[len / 2]) / 2;
    };

    const q2 = getMedian(raw);
    let left = [], right = [];
    if (n % 2 === 1) {
      left = raw.slice(0, Math.floor(n / 2));
      right = raw.slice(Math.floor(n / 2) + 1);
    } else {
      left = raw.slice(0, n / 2);
      right = raw.slice(n / 2);
    }

    const q1 = getMedian(left);
    const q3 = getMedian(right);
    const deltaQ = q3 - q1;
    const variance = raw.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    return { raw, mean, q1, q2, q3, deltaQ, variance, std, min: raw[0], max: raw[raw.length - 1] };
  }

  updateMetrics() {
    const { mean, q2, std, deltaQ } = this.calcStats();
    const unit = this.datasets[this.caseIdx].unit;

    const elM = document.getElementById('outMasterMean');
    const elMed = document.getElementById('outMasterMedian');
    const elStd = document.getElementById('outMasterStd');
    const elIQR = document.getElementById('outMasterIQR');

    if (elM) elM.textContent = `${mean.toFixed(2)} ${unit}`;
    if (elMed) elMed.textContent = `${q2.toFixed(2)} ${unit}`;
    if (elStd) elStd.textContent = `${std.toFixed(2)} ${unit}`;
    if (elIQR) elIQR.textContent = `${deltaQ.toFixed(2)} ${unit}`;

    unlockBadge(1, "Nhà Khoa Học Dữ Liệu");
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

    const { raw, mean, q1, q2, q3, min, max } = this.calcStats();
    const pad = (max - min) * 0.15 || 2;
    const rMin = Math.max(0, min - pad);
    const rMax = max + pad;

    const toX = (val) => 60 + ((val - rMin) / (rMax - rMin)) * (w - 120);

    // Box Plot top half
    const boxY = 45;
    const boxH = 45;

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
    const xMin = toX(min);
    const xMax = toX(max);

    ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.fillRect(xQ1, boxY, xQ3 - xQ1, boxH);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(xQ1, boxY, xQ3 - xQ1, boxH);

    // Median Q2
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xQ2, boxY);
    ctx.lineTo(xQ2, boxY + boxH);
    ctx.stroke();

    // Whiskers
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xMin, boxY + boxH / 2);
    ctx.lineTo(xQ1, boxY + boxH / 2);
    ctx.moveTo(xMin, boxY + 10);
    ctx.lineTo(xMin, boxY + boxH - 10);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xQ3, boxY + boxH / 2);
    ctx.lineTo(xMax, boxY + boxH / 2);
    ctx.moveTo(xMax, boxY + 10);
    ctx.lineTo(xMax, boxY + boxH - 10);
    ctx.stroke();

    // Dot Plot bottom half
    const dotBaseY = h - 50;
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, dotBaseY);
    ctx.lineTo(w - 40, dotBaseY);
    ctx.stroke();

    const counts = {};
    raw.forEach(val => {
      counts[val] = (counts[val] || 0) + 1;
      const x = toX(val);
      const y = dotBaseY - counts[val] * 12;
      ctx.fillStyle = '#0ea5e9';
      ctx.beginPath();
      ctx.arc(x, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Mean Line (Gold)
    const xMean = toX(mean);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xMean, 30);
    ctx.lineTo(xMean, dotBaseY + 15);
    ctx.stroke();
    ctx.setLineDash([]);

    // Text labels
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.textAlign = 'center';
    ctx.fillText(`x̄ = ${mean.toFixed(2)}`, xMean, 22);

    ctx.fillStyle = '#10b981';
    ctx.fillText(`Me = ${q2.toFixed(1)}`, xQ2, boxY + boxH + 18);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Q₁: ${q1.toFixed(1)}`, xQ1, boxY - 8);
    ctx.fillText(`Q₃: ${q3.toFixed(1)}`, xQ3, boxY - 8);
  }
}

// === 6. INTERACTIVE LAB 2: PARALLEL BOX PLOT (ĐBSH vs ĐBSCL) ===
class ParallelBoxLab {
  constructor() {
    this.canvas = document.getElementById('parallelBoxCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.includeHanoi = true;
    this.initControls();
    this.draw();
  }

  initControls() {
    const btn = document.getElementById('btnToggleHanoi');
    if (btn) {
      btn.addEventListener('click', () => {
        this.includeHanoi = !this.includeHanoi;
        btn.textContent = this.includeHanoi ? '🏙️ Ngoại Lai Hà Nội: ĐANG BẬT (187 trường)' : '🏙️ Ngoại Lai Hà Nội: ĐÃ LOẠI BỎ (Max 57)';
        btn.classList.toggle('active', this.includeHanoi);
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }
  }

  calcStats(data) {
    const s = [...data].sort((a, b) => a - b);
    const n = s.length;

    const getMedian = (arr) => {
      const len = arr.length;
      return len % 2 === 1 ? arr[Math.floor(len / 2)] : (arr[len / 2 - 1] + arr[len / 2]) / 2;
    };

    const q2 = getMedian(s);
    let left = [], right = [];
    if (n % 2 === 1) {
      left = s.slice(0, Math.floor(n / 2));
      right = s.slice(Math.floor(n / 2) + 1);
    } else {
      left = s.slice(0, n / 2);
      right = s.slice(n / 2);
    }

    const q1 = getMedian(left);
    const q3 = getMedian(right);
    const deltaQ = q3 - q1;

    return { s, q1, q2, q3, deltaQ, min: s[0], max: s[s.length - 1] };
  }

  updateMetrics() {
    let rawA = [187, 34, 35, 46, 54, 57, 37, 39, 23, 57, 27];
    if (!this.includeHanoi) {
      rawA = [34, 35, 46, 54, 57, 37, 39, 23, 57, 27];
    }
    const rawB = [33, 34, 33, 29, 24, 39, 42, 24, 23, 19, 24, 15, 26];

    const statsA = this.calcStats(rawA);
    const statsB = this.calcStats(rawB);

    const elMedA = document.getElementById('outCompMedA');
    const elMedB = document.getElementById('outCompMedB');
    const elIQRA = document.getElementById('outCompIQRA');
    const elIQRB = document.getElementById('outCompIQRB');

    if (elMedA) elMedA.textContent = `${statsA.q2.toFixed(1)} trường`;
    if (elMedB) elMedB.textContent = `${statsB.q2.toFixed(1)} trường`;
    if (elIQRA) elIQRA.textContent = `${statsA.deltaQ.toFixed(1)}`;
    if (elIQRB) elIQRB.textContent = `${statsB.deltaQ.toFixed(1)}`;

    unlockBadge(1, "Nhà Khoa Học Dữ Liệu");
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

    let rawA = [187, 34, 35, 46, 54, 57, 37, 39, 23, 57, 27];
    if (!this.includeHanoi) {
      rawA = [34, 35, 46, 54, 57, 37, 39, 23, 57, 27];
    }
    const rawB = [33, 34, 33, 29, 24, 39, 42, 24, 23, 19, 24, 15, 26];

    const statsA = this.calcStats(rawA);
    const statsB = this.calcStats(rawB);

    const maxVal = Math.max(statsA.max, statsB.max);
    const toX = (val) => 60 + ((val - 10) / (maxVal + 15 - 10)) * (w - 120);

    // Draw Box A (ĐBSH)
    const yA = 70;
    this.drawBoxPlot(ctx, statsA, yA, toX, '#0ea5e9', 'Đồng Bằng Sông Hồng');

    // Draw Box B (ĐBSCL)
    const yB = 165;
    this.drawBoxPlot(ctx, statsB, yB, toX, '#10b981', 'Đồng Bằng Sông Cửu Long');

    // Legend
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Ngoại lai Hà Nội (187 trường) kéo dãn hộp ĐBSH về phía bên phải!', w / 2, h - 18);
  }

  drawBoxPlot(ctx, st, y, toX, color, label) {
    const xMin = toX(st.min);
    const xQ1 = toX(st.q1);
    const xQ2 = toX(st.q2);
    const xQ3 = toX(st.q3);
    const xMax = toX(st.max);
    const boxH = 34;

    // Axis line
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(40, y + boxH / 2);
    ctx.lineTo(toX(200), y + boxH / 2);
    ctx.stroke();

    // Box
    ctx.fillStyle = color === '#0ea5e9' ? 'rgba(14, 165, 233, 0.25)' : 'rgba(16, 185, 129, 0.25)';
    ctx.fillRect(xQ1, y, xQ3 - xQ1, boxH);
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(xQ1, y, xQ3 - xQ1, boxH);

    // Median
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xQ2, y);
    ctx.lineTo(xQ2, y + boxH);
    ctx.stroke();

    // Whiskers
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xMin, y + boxH / 2);
    ctx.lineTo(xQ1, y + boxH / 2);
    ctx.moveTo(xMin, y + 8);
    ctx.lineTo(xMin, y + boxH - 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(xQ3, y + boxH / 2);
    ctx.lineTo(xMax, y + boxH / 2);
    ctx.moveTo(xMax, y + 8);
    ctx.lineTo(xMax, y + boxH - 8);
    ctx.stroke();

    // Label
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = color;
    ctx.textAlign = 'left';
    ctx.fillText(`${label} (Min: ${st.min}, Me: ${st.q2.toFixed(1)}, Max: ${st.max})`, 40, y - 10);
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
      if (target === 'theory') unlockBadge(0, "Học Giả Thống Kê");
      if (target === 'labs') unlockBadge(1, "Nhà Khoa Học Dữ Liệu");
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
        '👑': 'Vua Thống Kê K-12',
        '🚀': 'Phi Hành Gia Vũ Trụ',
        '🧙‍♂️': 'Phù Thủy Số Liệu',
        '🦁': 'Sư Tử Dũng Mãnh',
        '💎': 'Kiến Trúc Sư Dữ Liệu',
        '🦉': 'Cú Thông Thái',
        '🎯': 'Xạ Thủ Logic',
        '🏅': 'Quán Quân Toàn Năng'
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
  new MasterStatLab();
  new ParallelBoxLab();
  updateHUD();

  unlockBadge(0, "Học Giả Thống Kê");
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
