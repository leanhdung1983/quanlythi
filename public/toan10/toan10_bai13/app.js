/**
 * BÀI 13: CÁC SỐ ĐẶC TRƯNG ĐO XU THẾ TRUNG TÂM - TOÁN 10 KNTT
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
  userTitle: 'Chuyên Gia Thống Kê',
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

// === 4. QUIZ DATA (10 QUESTIONS FROM SGK TRANG 82 - 84) ===
const quizData = [
  {
    id: 1,
    title: "Bài 5.7a SGK Trang 82: Điểm Ghi Được Của 5 Cầu Thủ Bóng Rổ",
    pts: 20,
    question: "Số điểm mà 5 vận động viên bóng rổ ghi được trong một trận đấu là: $9, 8, 15, 8, 20$. Số trung bình $\\bar{x}$ của mẫu số liệu là:",
    options: [
      { text: "A. $\\bar{x} = 10$", correct: false },
      { text: "B. $\\bar{x} = 12$", correct: true },
      { text: "C. $\\bar{x} = 14$", correct: false },
      { text: "D. $\\bar{x} = 8$", correct: false }
    ],
    explanation: "Số trung bình là tổng các giá trị chia cho $n = 5$: $\\bar{x} = \\frac{9 + 8 + 15 + 8 + 20}{5} = \\frac{60}{5} = 12$."
  },
  {
    id: 2,
    title: "Bài 5.7a SGK Trang 82: Trung Vị và Mốt Điểm Bóng Rổ",
    pts: 20,
    question: "Với mẫu số liệu điểm bóng rổ $9, 8, 15, 8, 20$, trung vị $M_e$ và mốt $M_o$ lần lượt là:",
    options: [
      { text: "A. $M_e = 8$ và $M_o = 9$", correct: false },
      { text: "B. $M_e = 9$ và $M_o = 8$", correct: true },
      { text: "C. $M_e = 12$ và $M_o = 8$", correct: false },
      { text: "D. $M_e = 15$ và $M_o = 20$", correct: false }
    ],
    explanation: "Sắp xếp mẫu số liệu không giảm: $8, 8, 9, 15, 20$. Vì $n = 5$ lẻ nên trung vị là số ở chính giữa: $M_e = 9$. Giá trị $8$ xuất hiện 2 lần (nhiều nhất) nên $M_o = 8$."
  },
  {
    id: 3,
    title: "Bài 5.7b SGK Trang 82: Trung Vị Giá Giày ($n = 8$)",
    pts: 20,
    question: "Giá của một số loại giày (nghìn đồng): $350, 300, 650, 300, 450, 500, 300, 250$. Trung vị $M_e$ của mẫu số liệu là:",
    options: [
      { text: "A. $300$ nghìn đồng", correct: false },
      { text: "B. $325$ nghìn đồng", correct: true },
      { text: "C. $350$ nghìn đồng", correct: false },
      { text: "D. $387,5$ nghìn đồng", correct: false }
    ],
    explanation: "Sắp xếp không giảm: $250, 300, 300, 300, 350, 450, 500, 650$. Vì $n = 8$ chẵn nên trung vị là trung bình cộng của 2 số chính giữa (vị trí 4 và 5): $M_e = \\frac{300 + 350}{2} = 325$ nghìn đồng."
  },
  {
    id: 4,
    title: "Bài 5.7b SGK Trang 82: Mốt Và Quyết Định Nhập Hàng",
    pts: 20,
    question: "Mốt của giá các loại giày trên là bao nhiêu và cửa hàng nên nhập loại giày nào nhiều nhất?",
    options: [
      { text: "A. $M_o = 300$ nghìn đồng; nên nhập loại 300 nghìn đồng nhiều nhất", correct: true },
      { text: "B. $M_o = 650$ nghìn đồng; nên nhập loại 650 nghìn đồng nhiều nhất", correct: false },
      { text: "C. $M_o = 325$ nghìn đồng; nên nhập loại 325 nghìn đồng", correct: false },
      { text: "D. Mẫu không có mốt", correct: false }
    ],
    explanation: "Giá $300$ nghìn đồng xuất hiện 3 lần (nhiều nhất) nên $M_o = 300$ nghìn đồng. Cửa hàng nên nhập nhiều loại giày có giá này vì đây là phân khúc được ưa chuộng nhất."
  },
  {
    id: 5,
    title: "Bài 5.7c SGK Trang 82: Tứ Phân Vị Kênh Truyền Hình Cáp",
    pts: 20,
    question: "Số kênh truyền hình cáp của các hãng: $30, 32, 33, 34, 34, 35, 36, 38$. Bộ ba tứ phân vị $Q_1, Q_2, Q_3$ là:",
    options: [
      { text: "A. $Q_1 = 32; Q_2 = 34; Q_3 = 35$", correct: false },
      { text: "B. $Q_1 = 32,5; Q_2 = 34; Q_3 = 35,5$", correct: true },
      { text: "C. $Q_1 = 33; Q_2 = 34; Q_3 = 36$", correct: false },
      { text: "D. $Q_1 = 31; Q_2 = 34; Q_3 = 37$", correct: false }
    ],
    explanation: "Mẫu đã sắp xếp: $30, 32, 33, 34, 34, 35, 36, 38$ ($n = 8$).\\n$Q_2 = \\frac{34 + 34}{2} = 34$.\\nNửa trái: $30, 32, 33, 34 \\implies Q_1 = \\frac{32 + 33}{2} = 32,5$.\\nNửa phải: $34, 35, 36, 38 \\implies Q_3 = \\frac{35 + 36}{2} = 35,5$."
  },
  {
    id: 6,
    title: "Bài 5.8a SGK Trang 82: Số Mặt Trăng Của Các Hành Tinh",
    pts: 20,
    question: "Số mặt trăng: Thủy (0), Kim (0), Đất (1), Hỏa (2), Mộc (63), Thổ (34), Thiên Vương (27), Hải Vương (13). Tại sao nên dùng trung vị thay cho số trung bình?",
    options: [
      { text: "A. Vì số trung bình $\\bar{x} = 17,5$ bị kéo lệch quá nhiều bởi giá trị ngoại lai dị biệt (Mộc tinh 63, Thổ tinh 34)", correct: true },
      { text: "B. Vì số trung bình không tính được khi có số 0", correct: false },
      { text: "C. Vì trung vị bằng 0", correct: false },
      { text: "D. Vì số hành tinh là số chẵn", correct: false }
    ],
    explanation: "Mẫu sắp xếp: $0, 0, 1, 2, 13, 27, 34, 63$. Đa số hành tinh có rất ít mặt trăng (0 đến 2), nhưng Sao Mộc (63) và Sao Thổ (34) quá lớn khiến $\\bar{x} = 17,5$ không phản ánh được mức phổ biến. Trung vị $M_e = \\frac{2 + 13}{2} = 7,5$ thích hợp hơn nhiều."
  },
  {
    id: 7,
    title: "Bài 5.8b SGK Trang 82: Đường Chuyền Bóng Thành Công",
    pts: 20,
    question: "Số đường chuyền thành công của một số cầu thủ: $14, 20, 23, 24, 32$. Số trung bình $\\bar{x}$ và trung vị $M_e$ là:",
    options: [
      { text: "A. $\\bar{x} = 22,6$ và $M_e = 23$", correct: true },
      { text: "B. $\\bar{x} = 23$ và $M_e = 20$", correct: false },
      { text: "C. $\\bar{x} = 22,6$ và $M_e = 22$", correct: false },
      { text: "D. $\\bar{x} = 25$ và $M_e = 23$", correct: false }
    ],
    explanation: "Tổng số đường chuyền: $14 + 20 + 23 + 24 + 32 = 113$. $\\bar{x} = \\frac{113}{5} = 22,6$. Giá trị chính giữa là $23$ nên $M_e = 23$."
  },
  {
    id: 8,
    title: "Bài 5.9 SGK Trang 84: Học Sinh Giỏi Quốc Gia Của 10 Trường",
    pts: 20,
    question: "Số HSG của 10 trường: $0, 0, 0, 0, 0, 0, 0, 4, 6, 10$. Giải thích tại sao tứ phân vị thứ nhất $Q_1$ và trung vị $Q_2$ trùng nhau:",
    options: [
      { text: "A. Vì có trên $50\\%$ số trường không có học sinh giỏi nào (giá trị 0 chiếm tới 7 trường)", correct: true },
      { text: "B. Do công thức tính tứ phân vị bị sai lệch", correct: false },
      { text: "C. Vì kích thước mẫu $n = 10$ là số chẵn", correct: false },
      { text: "D. Vì $Q_1$ và $Q_2$ luôn luôn bằng nhau trong mọi mẫu số liệu", correct: false }
    ],
    explanation: "Mẫu có 10 giá trị, trong đó có tới 7 số $0$. Nửa bên trái gồm 5 số $0 \\implies Q_1 = 0$. Hai số chính giữa ở vị trí 5 và 6 đều là $0 \\implies Q_2 = 0$. Sự trùng nhau này phản ánh thực tế phần lớn các trường không có giải."
  },
  {
    id: 9,
    title: "Bài 5.10 SGK Trang 84: Ảnh Hưởng Khi Bỏ Số Liệu Sân Mỹ Đình",
    pts: 20,
    question: "Số chỗ ngồi 5 sân bóng: Cẩm Phả ($20\\,120$), Thiên Trường ($21\\,315$), Hàng Đẫy ($23\\,405$), Thanh Hoá ($20\\,120$), Mỹ Đình ($37\\,546$). Nếu bỏ đi số liệu sân Mỹ Đình thì:",
    options: [
      { text: "A. Số trung bình $\\bar{x}$ giảm mạnh nhất, trung vị và mốt hầu như thay đổi rất ít", correct: true },
      { text: "B. Mốt thay đổi nhiều nhất", correct: false },
      { text: "C. Trung vị giảm mạnh hơn số trung bình", correct: false },
      { text: "D. Cả ba đại lượng đều không đổi", correct: false }
    ],
    explanation: "Sân Mỹ Đình ($37\\,546$) là giá trị cực lớn (ngoại lai). Lúc đầu $\\bar{x} \\approx 24\\,501$; khi bỏ Mỹ Đình, $\\bar{x} = 21\\,240$ (giảm tới hơn 3 200 chỗ ngồi). Trong khi đó mốt vẫn là $20\\,120$ và trung vị chỉ dịch từ $21\\,315$ sang $20\\,717,5$."
  },
  {
    id: 10,
    title: "Luyện Tập 3 SGK Trang 82: Tứ Phân Vị Từ Bảng Tần Số",
    pts: 20,
    question: "Số lần học tiếng Anh online trong tuần: Giá trị $0, 1, 2, 3, 4, 5$ tương ứng tần số $2, 4, 6, 12, 8, 3$ ($n = 35$). Tứ phân vị $Q_1, Q_2, Q_3$ là:",
    options: [
      { text: "A. $Q_1 = 2; Q_2 = 3; Q_3 = 4$", correct: true },
      { text: "B. $Q_1 = 1; Q_2 = 3; Q_3 = 4$", correct: false },
      { text: "C. $Q_1 = 2; Q_2 = 3; Q_3 = 3$", correct: false },
      { text: "D. $Q_1 = 2,5; Q_2 = 3; Q_3 = 4,5$", correct: false }
    ],
    explanation: "Kích thước $n = 35$ lẻ. Trung vị $Q_2$ là số ở vị trí 18 $\\implies Q_2 = 3$.\\nNửa trái gồm 17 số (vị trí 1 đến 17), $Q_1$ là số ở vị trí 9. Cộng dồn tần số: $2 + 4 = 6 < 9 \\le 2 + 4 + 6 = 12 \\implies Q_1 = 2$.\\nNửa phải gồm 17 số (vị trí 19 đến 35), $Q_3$ ở vị trí $18 + 9 = 27$. Cộng dồn đến giá trị 3 là $24 < 27 \\le 24 + 8 = 32 \\implies Q_3 = 4$."
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
  if (appState.xp >= 160) unlockBadge(3, "Chiến Thần Đấu Trường");

  const totalAnswered = Object.keys(appState.answered).length;
  if (totalAnswered === 10) {
    const allCorrect = quizData.every(item => item.options[appState.answered[item.id]]?.correct);
    if (allCorrect) {
      unlockBadge(4, "Đại Kiện Tướng Thống Kê");
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

// === 5. INTERACTIVE LAB 1: XU THẾ TRUNG TÂM & OUTLIER SIMULATOR ===
class TendencyLab {
  constructor() {
    this.canvas = document.getElementById('tendencyCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.caseMode = 1; // 1: Salary, 2: Whale, 3: Moon
    this.outlierVal = 20;
    this.baseData = [4, 4, 4, 4, 4];
    this.initControls();
    this.draw();
  }

  initControls() {
    const sOut = document.getElementById('sliderOutlier');
    const vOut = document.getElementById('valOutlier');

    if (sOut) {
      sOut.addEventListener('input', (e) => {
        this.outlierVal = parseFloat(e.target.value);
        if (vOut) vOut.textContent = this.outlierVal;
        this.updateMetrics();
        this.draw();
      });
    }

    const bSal = document.getElementById('btnCaseSalary');
    const bWhale = document.getElementById('btnCaseWhale');
    const bMoon = document.getElementById('btnCaseMoon');

    if (bSal) {
      bSal.addEventListener('click', () => {
        this.caseMode = 1;
        this.setActiveBtn(bSal);
        this.baseData = [4, 4, 4, 4, 4];
        this.outlierVal = 20;
        this.resetSlider(4, 60, 20);
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }

    if (bWhale) {
      bWhale.addEventListener('click', () => {
        this.caseMode = 2;
        this.setActiveBtn(bWhale);
        this.baseData = [31, 48, 51, 52, 53, 53];
        this.outlierVal = 112;
        this.resetSlider(50, 150, 112);
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }

    if (bMoon) {
      bMoon.addEventListener('click', () => {
        this.caseMode = 3;
        this.setActiveBtn(bMoon);
        this.baseData = [0, 0, 1, 2, 13, 27, 34];
        this.outlierVal = 63;
        this.resetSlider(30, 100, 63);
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }
  }

  setActiveBtn(btn) {
    document.querySelectorAll('.control-row .lab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  resetSlider(min, max, val) {
    const s = document.getElementById('sliderOutlier');
    const v = document.getElementById('valOutlier');
    if (s) { s.min = min; s.max = max; s.value = val; }
    if (v) v.textContent = val;
  }

  calcStats() {
    const full = [...this.baseData, this.outlierVal].sort((a, b) => a - b);
    const n = full.length;
    const mean = full.reduce((a, b) => a + b, 0) / n;
    const median = n % 2 === 1 ? full[Math.floor(n / 2)] : (full[n / 2 - 1] + full[n / 2]) / 2;

    // Mode
    const freq = {};
    full.forEach(x => freq[x] = (freq[x] || 0) + 1);
    let maxF = 0, mode = full[0];
    for (let k in freq) {
      if (freq[k] > maxF) { maxF = freq[k]; mode = parseFloat(k); }
    }

    return { full, mean, median, mode };
  }

  updateMetrics() {
    const { mean, median, mode } = this.calcStats();
    const elMean = document.getElementById('outMean');
    const elMed = document.getElementById('outMedian');
    const elMod = document.getElementById('outMode');
    const elIns = document.getElementById('outInsight');

    const unit = this.caseMode === 1 ? ' tr' : (this.caseMode === 2 ? ' ft' : '');
    if (elMean) elMean.textContent = `${mean.toFixed(2)}${unit}`;
    if (elMed) elMed.textContent = `${median.toFixed(2)}${unit}`;
    if (elMod) elMod.textContent = `${mode.toFixed(2)}${unit}`;

    if (elIns) {
      elIns.textContent = `Trung Vị = ${median.toFixed(1)}${unit} kiên định!`;
    }
    unlockBadge(1, "Nhà Phân Tích Dữ Liệu");
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

    const { full, mean, median, mode } = this.calcStats();
    const minVal = Math.min(...full);
    const maxVal = Math.max(...full);
    const pad = (maxVal - minVal) * 0.15 || 5;
    const rangeMin = Math.max(0, minVal - pad);
    const rangeMax = maxVal + pad;

    const toX = (val) => 60 + ((val - rangeMin) / (rangeMax - rangeMin)) * (w - 120);
    const baseY = h - 60;

    // Axis
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, baseY);
    ctx.lineTo(w - 40, baseY);
    ctx.stroke();

    // Dot Plot
    const counts = {};
    full.forEach(val => {
      counts[val] = (counts[val] || 0) + 1;
      const x = toX(val);
      const y = baseY - counts[val] * 16;
      ctx.fillStyle = val === this.outlierVal ? '#ef4444' : '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, y, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.stroke();
    });

    // Mean Line (Gold)
    const xMean = toX(mean);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xMean, 40);
    ctx.lineTo(xMean, baseY + 15);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`x̄ = ${mean.toFixed(2)}`, xMean, 32);

    // Median Line (Emerald)
    const xMed = toX(median);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(xMed, 70);
    ctx.lineTo(xMed, baseY + 15);
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.fillText(`Me = ${median.toFixed(2)}`, xMed, 62);

    // Mode Indicator (Purple)
    const xMod = toX(mode);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xMod, 100);
    ctx.lineTo(xMod, baseY + 15);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#c084fc';
    ctx.fillText(`Mo = ${mode}`, xMod, 92);

    // Legend
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('— Số Trung Bình (bị kéo lệch)', 40, h - 15);
    ctx.fillStyle = '#10b981';
    ctx.fillText('— Trung Vị (vững vàng)', 230, h - 15);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('● Giá trị dị biệt (Outlier)', 400, h - 15);
  }
}

// === 6. INTERACTIVE LAB 2: QUARTILE ANALYZER ===
class QuartileLab {
  constructor() {
    this.canvas = document.getElementById('quartileCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.datasetIdx = 0; // 0: Class A, 1: Class B, 2: Natri
    this.datasets = [
      {
        name: 'Lớp A (25 HS)',
        data: [2, 7, 6, 3, 9, 8, 6, 7, 9, 2, 5, 7, 5, 9, 8, 8, 7, 4, 3, 5, 5, 4, 5, 7, 7]
      },
      {
        name: 'Lớp B (25 HS)',
        data: [6, 7, 6, 4, 7, 9, 3, 8, 7, 5, 5, 6, 8, 7, 4, 5, 3, 10, 7, 9, 6, 7, 6, 7, 5]
      },
      {
        name: 'Hàm lượng Natri (Ví dụ 3)',
        data: [0, 50, 70, 100, 130, 140, 140, 150, 160, 180, 180, 180, 190, 200, 200, 210, 210, 220, 290, 340]
      }
    ];
    this.initControls();
    this.draw();
  }

  initControls() {
    const bA = document.getElementById('btnClassA');
    const bB = document.getElementById('btnClassB');
    const bN = document.getElementById('btnNatri');

    if (bA) {
      bA.addEventListener('click', () => {
        this.datasetIdx = 0;
        this.setActive(bA);
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }
    if (bB) {
      bB.addEventListener('click', () => {
        this.datasetIdx = 1;
        this.setActive(bB);
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }
    if (bN) {
      bN.addEventListener('click', () => {
        this.datasetIdx = 2;
        this.setActive(bN);
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

  calcQuartiles() {
    const s = [...this.datasets[this.datasetIdx].data].sort((a, b) => a - b);
    const n = s.length;
    const mean = s.reduce((a, b) => a + b, 0) / n;

    // Median Q2
    const q2 = n % 2 === 1 ? s[Math.floor(n / 2)] : (s[n / 2 - 1] + s[n / 2]) / 2;

    // Half left & right
    let leftHalf = [], rightHalf = [];
    if (n % 2 === 1) {
      leftHalf = s.slice(0, Math.floor(n / 2));
      rightHalf = s.slice(Math.floor(n / 2) + 1);
    } else {
      leftHalf = s.slice(0, n / 2);
      rightHalf = s.slice(n / 2);
    }

    const getMedian = (arr) => {
      const len = arr.length;
      return len % 2 === 1 ? arr[Math.floor(len / 2)] : (arr[len / 2 - 1] + arr[len / 2]) / 2;
    };

    const q1 = getMedian(leftHalf);
    const q3 = getMedian(rightHalf);

    return { s, mean, q1, q2, q3, min: s[0], max: s[s.length - 1] };
  }

  updateMetrics() {
    const { q1, q2, q3, mean } = this.calcQuartiles();
    const elQ1 = document.getElementById('outQ1');
    const elQ2 = document.getElementById('outQ2');
    const elQ3 = document.getElementById('outQ3');
    const elMean = document.getElementById('outMeanClass');

    if (elQ1) elQ1.textContent = q1.toFixed(2);
    if (elQ2) elQ2.textContent = q2.toFixed(2);
    if (elQ3) elQ3.textContent = q3.toFixed(2);
    if (elMean) elMean.textContent = mean.toFixed(2);

    unlockBadge(1, "Nhà Phân Tích Dữ Liệu");
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

    const { s, q1, q2, q3, min, max } = this.calcQuartiles();
    const rangeMin = Math.max(0, min - (max - min) * 0.1);
    const rangeMax = max + (max - min) * 0.1;

    const toX = (val) => 60 + ((val - rangeMin) / (rangeMax - rangeMin)) * (w - 120);
    const baseY = h / 2 + 10;

    // Draw 4 bands
    const xMin = toX(min);
    const xQ1 = toX(q1);
    const xQ2 = toX(q2);
    const xQ3 = toX(q3);
    const xMax = toX(max);

    const bands = [
      { x1: xMin, x2: xQ1, color: 'rgba(56, 189, 248, 0.25)', label: '25% Đầu' },
      { x1: xQ1, x2: xQ2, color: 'rgba(16, 185, 129, 0.25)', label: '25% Kế' },
      { x1: xQ2, x2: xQ3, color: 'rgba(245, 158, 11, 0.25)', label: '25% Kế' },
      { x1: xQ3, x2: xMax, color: 'rgba(168, 85, 247, 0.25)', label: '25% Cuối' }
    ];

    bands.forEach(b => {
      ctx.fillStyle = b.color;
      ctx.fillRect(b.x1, baseY - 35, b.x2 - b.x1, 70);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(b.label, (b.x1 + b.x2) / 2, baseY - 45);
    });

    // Base line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, baseY);
    ctx.lineTo(w - 40, baseY);
    ctx.stroke();

    // Data points
    s.forEach(val => {
      const x = toX(val);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath();
      ctx.arc(x, baseY, 4, 0, Math.PI * 2);
      ctx.fill();
    });

    // Quartile markers
    const markers = [
      { x: xMin, label: `Min: ${min}`, color: '#94a3b8' },
      { x: xQ1, label: `Q₁: ${q1.toFixed(1)}`, color: '#38bdf8' },
      { x: xQ2, label: `Q₂ (Me): ${q2.toFixed(1)}`, color: '#10b981' },
      { x: xQ3, label: `Q₃: ${q3.toFixed(1)}`, color: '#f59e0b' },
      { x: xMax, label: `Max: ${max}`, color: '#c084fc' }
    ];

    markers.forEach(m => {
      ctx.strokeStyle = m.color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(m.x, baseY - 35);
      ctx.lineTo(m.x, baseY + 35);
      ctx.stroke();

      ctx.fillStyle = m.color;
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(m.label, m.x, baseY + 52);
    });
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
      if (target === 'theory') unlockBadge(0, "Thấu Thị Xu Thế");
      if (target === 'labs') unlockBadge(1, "Nhà Phân Tích Dữ Liệu");
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

  // Avatar Modal
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
        '👑': 'Đại Kiện Tướng Thống Kê',
        '🚀': 'Phi Hành Gia Vũ Trụ',
        '🧙‍♂️': 'Phù Thủy Số Liệu',
        '🦁': 'Sư Tử Dũng Mãnh',
        '💎': 'Bậc Thầy Trung Vị',
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
  new TendencyLab();
  new QuartileLab();
  updateHUD();

  unlockBadge(0, "Thấu Thị Xu Thế");
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
