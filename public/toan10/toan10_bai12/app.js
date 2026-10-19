/**
 * BÀI 12: SỐ GẦN ĐÚNG VÀ SAI SỐ - TOÁN 10 KNTT
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
        // audio context handling
      }
    }, delay * 1000);
  }

  playCorrect() {
    this.playTone(523.25, 'sine', 0.15, 0, 0.2);       // C5
    this.playTone(659.25, 'sine', 0.15, 0.1, 0.2);     // E5
    this.playTone(783.99, 'sine', 0.25, 0.2, 0.25);    // G5
  }

  playWrong() {
    this.playTone(329.63, 'sawtooth', 0.2, 0, 0.2);   // E4
    this.playTone(261.63, 'sawtooth', 0.3, 0.15, 0.2); // C4
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
  userTitle: 'Nhà Khai Phá Số Liệu',
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

// === 4. QUIZ DATA (10 QUESTIONS FROM SGK TRANG 77) ===
const quizData = [
  {
    id: 1,
    title: "Bài 5.1a SGK Trang 77: Cân Túi Gạo",
    pts: 20,
    question: "Kết quả cân một túi gạo ghi là $10,2\\text{ kg}$. Giá trị $10,2\\text{ kg}$ này là:",
    options: [
      { text: "A. Số đúng tuyệt đối", correct: false },
      { text: "B. Số gần đúng của khối lượng thực tế", correct: true },
      { text: "C. Độ chính xác của phép cân", correct: false },
      { text: "D. Sai số tương đối của phép đo", correct: false }
    ],
    explanation: "Khối lượng thực tế của túi gạo bị ảnh hưởng bởi độ nhạy của cân, áp suất không khí, nhiệt độ,... Do đó kết quả $10,2\\text{ kg}$ hiển thị trên cân là số gần đúng."
  },
  {
    id: 2,
    title: "Bài 5.1b,c SGK Trang 77: Bán Kính Trái Đất",
    pts: 20,
    question: "Trong các khẳng định sau về các số liệu địa lí và thiên văn, khẳng định nào ĐÚNG?",
    options: [
      { text: "A. Bán kính Trái Đất là $6\\,371\\text{ km}$ là số đúng tuyệt đối", correct: false },
      { text: "B. Trái Đất quay một vòng quanh Mặt Trời mất 365 ngày là số đúng tuyệt đối", correct: false },
      { text: "C. Cả bán kính Trái Đất $6\\,371\\text{ km}$ và chu kì 365 ngày đều là các số gần đúng", correct: true },
      { text: "D. Số vòng quay của Trái Đất là một số vô tỉ", correct: false }
    ],
    explanation: "Trái Đất có hình phỏng cầu elipsoid không hoàn hảo nên bán kính $6\\,371\\text{ km}$ là số gần đúng. Thời gian thực Trái Đất quay quanh Mặt Trời là khoảng $365,2422$ ngày nên 365 ngày cũng là số gần đúng."
  },
  {
    id: 3,
    title: "Bài 5.2a SGK Trang 77: Độ Cao Ngọn Núi $1\\,235 \\pm 5\\text{ m}$",
    pts: 20,
    question: "Đo độ cao một ngọn núi cho kết quả là $1\\,235 \\pm 5\\text{ m}$. Kết quả này có ý nghĩa gì?",
    options: [
      { text: "A. Chiều cao thực tế $\\bar{a}$ của ngọn núi nằm trong đoạn $[1\\,230\\text{ m}; 1\\,240\\text{ m}]$ với độ chính xác $d = 5\\text{ m}$", correct: true },
      { text: "B. Chiều cao ngọn núi chắc chắn đúng bằng $1\\,235\\text{ m}$", correct: false },
      { text: "C. Độ cao sai lệch ít nhất là $5\\text{ m}$", correct: false },
      { text: "D. Độ chính xác của phép đo là $10\\text{ m}$", correct: false }
    ],
    explanation: "Ta viết $\\bar{a} = 1\\,235 \\pm 5\\text{ m}$, nghĩa là số gần đúng $a = 1\\,235\\text{ m}$, độ chính xác $d = 5\\text{ m}$. Chiều cao đúng $\\bar{a}$ nằm trong đoạn $[1\\,235 - 5; 1\\,235 + 5] = [1\\,230; 1\\,240]\\text{ m}$."
  },
  {
    id: 4,
    title: "Bài 5.2b SGK Trang 77: Quy Tròn Độ Cao Ngọn Núi",
    pts: 20,
    question: "Quy tròn số gần đúng $a = 1\\,235\\text{ m}$ với độ chính xác $d = 5\\text{ m}$ theo quy tắc SGK:",
    options: [
      { text: "A. $1\\,230\\text{ m}$", correct: false },
      { text: "B. $1\\,200\\text{ m}$", correct: false },
      { text: "C. $1\\,240\\text{ m}$", correct: true },
      { text: "D. $1\\,000\\text{ m}$", correct: false }
    ],
    explanation: "Độ chính xác $d = 5$ ở hàng đơn vị ($5 < 10$). Theo quy tắc SGK, ta làm tròn số $a$ đến hàng chục. Chữ số hàng chục là $3$, chữ số ngay sau nó là $5 \\ge 5$ nên tăng lên $1$ đơn vị thành $4$. Vậy số quy tròn là $1\\,240\\text{ m}$."
  },
  {
    id: 5,
    title: "Bài 5.3 SGK Trang 77: Căn Bậc Ba $\\sqrt[3]{7}$",
    pts: 20,
    question: "Số gần đúng của $\\sqrt[3]{7}$ với độ chính xác $d = 0,0005$ là:",
    options: [
      { text: "A. $1,91$", correct: false },
      { text: "B. $1,913$", correct: true },
      { text: "C. $1,9129$", correct: false },
      { text: "D. $1,91293$", correct: false }
    ],
    explanation: "Bấm máy tính: $\\sqrt[3]{7} \\approx 1,912931...$ Vì $d = 0,0005 < 0,001$ (hàng phần nghìn) nên ta làm tròn đến hàng phần nghìn (chữ số thập phân thứ 3). Chữ số sau nó là $9 \\ge 5$ nên chữ số $2$ tăng lên thành $3$. Kết quả: $1,913$."
  },
  {
    id: 6,
    title: "Bài 5.4 SGK Trang 77: Hằng Số Hubble Vũ Trụ",
    pts: 20,
    question: "Ba phép đo hằng số Hubble $H_0$ (đơn vị km/s/Mpc): PP1: $67,31 \\pm 0,96$; PP2: $67,90 \\pm 0,55$; PP3: $67,74 \\pm 0,46$. Phương pháp nào chính xác nhất theo sai số tương đối?",
    options: [
      { text: "A. Phương pháp 1 (PP1)", correct: false },
      { text: "B. Phương pháp 2 (PP2)", correct: false },
      { text: "C. Phương pháp 3 (PP3)", correct: true },
      { text: "D. Cả ba phương pháp có độ chính xác như nhau", correct: false }
    ],
    explanation: "Ta đánh giá sai số tương đối $\\delta = \\frac{d}{|a|}$:\\n$\\delta_1 \\le \\frac{0,96}{67,31} \\approx 1,43\\%$;\\n$\\delta_2 \\le \\frac{0,55}{67,90} \\approx 0,81\\%$;\\n$\\delta_3 \\le \\frac{0,46}{67,74} \\approx 0,68\\%$.\\nVì $\\delta_3$ nhỏ nhất nên Phương pháp 3 chính xác nhất."
  },
  {
    id: 7,
    title: "Bài 5.5 SGK Trang 77: Tính Chu Vi Đường Tròn $R = 2\\text{ cm}$",
    pts: 20,
    question: "An lấy $\\pi \\approx 3,14 \\implies S_1 = 2\\pi R = 12,56\\text{ cm}$. Bình lấy $\\pi \\approx 3,1 \\implies S_2 = 12,4\\text{ cm}$. Giá trị của bạn nào chính xác hơn?",
    options: [
      { text: "A. Kết quả của An chính xác hơn vì $3,14$ gần số đúng $\\pi$ hơn $3,1$", correct: true },
      { text: "B. Kết quả của Bình chính xác hơn", correct: false },
      { text: "C. Cả hai kết quả đều chính xác tuyệt đối", correct: false },
      { text: "D. Không thể so sánh được", correct: false }
    ],
    explanation: "Ta có $|\\pi - 3,14| \\approx 0,00159 < |\\pi - 3,1| \\approx 0,04159$. Sai số của An nhỏ hơn rất nhiều nên kết quả $12,56\\text{ cm}$ của An chính xác hơn."
  },
  {
    id: 8,
    title: "Bài 5.6a SGK Trang 77: Làm Tròn $8\\,316,4$ Đến Hàng Chục",
    pts: 20,
    question: "Làm tròn số $8\\,316,4$ đến hàng chục và ước lượng sai số tuyệt đối của số quy tròn:",
    options: [
      { text: "A. Số quy tròn là $8\\,310$, sai số tuyệt đối $\\le 6,4$", correct: false },
      { text: "B. Số quy tròn là $8\\,320$, sai số tuyệt đối $\\le 5$", correct: true },
      { text: "C. Số quy tròn là $8\\,320$, sai số tuyệt đối $\\le 10$", correct: false },
      { text: "D. Số quy tròn là $8\\,300$, sai số tuyệt đối $\\le 16,4$", correct: false }
    ],
    explanation: "Làm tròn $8\\,316,4$ đến hàng chục: chữ số ngay sau nó là $6 \\ge 5$ nên làm tròn thành $8\\,320$. Khi thay số đúng bởi số quy tròn đến một hàng nào đó thì sai số tuyệt đối không vượt quá nửa đơn vị hàng làm tròn: $\\Delta \\le \\frac{10}{2} = 5$."
  },
  {
    id: 9,
    title: "Bài 5.6b SGK Trang 77: Làm Tròn $9,754$ Đến Hàng Phần Trăm",
    pts: 20,
    question: "Làm tròn số $9,754$ đến hàng phần trăm và ước lượng sai số tuyệt đối của phép quy tròn:",
    options: [
      { text: "A. Số quy tròn là $9,75$, sai số tuyệt đối $\\le 0,005$", correct: true },
      { text: "B. Số quy tròn là $9,76$, sai số tuyệt đối $\\le 0,01$", correct: false },
      { text: "C. Số quy tròn là $9,75$, sai số tuyệt đối $\\le 0,004$", correct: false },
      { text: "D. Số quy tròn là $9,8$, sai số tuyệt đối $\\le 0,05$", correct: false }
    ],
    explanation: "Hàng phần trăm có chữ số $5$, chữ số sau nó là $4 < 5$ nên giữ nguyên là $9,75$. Nửa đơn vị hàng làm tròn là $\\frac{0,01}{2} = 0,005$. Vậy sai số tuyệt đối không vượt quá $0,005$ (thực tế sai lệch là $|9,754 - 9,75| = 0,004 \\le 0,005$)."
  },
  {
    id: 10,
    title: "Luyện Tập 4 SGK Trang 77: Quy Tròn Số Với Độ Chính Xác $d = 300$",
    pts: 20,
    question: "Cho số gần đúng $a = 11\\,251\\,900$ với độ chính xác $d = 300$. Số quy tròn của $a$ là:",
    options: [
      { text: "A. $11\\,251\\,000$", correct: false },
      { text: "B. $11\\,252\\,000$", correct: true },
      { text: "C. $11\\,251\\,900$", correct: false },
      { text: "D. $11\\,250\\,000$", correct: false }
    ],
    explanation: "Vì $d = 300 < 1\\,000$ (hàng nghìn) nên ta làm tròn đến hàng nghìn. Chữ số hàng nghìn là $1$, chữ số ngay sau nó là $9 \\ge 5$ nên tăng $1$ đơn vị thành $2$. Vậy số quy tròn là $11\\,252\\,000$."
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
  if (appState.xp >= 160) unlockBadge(3, "Chuyên Gia Đo Lường");

  const totalAnswered = Object.keys(appState.answered).length;
  if (totalAnswered === 10) {
    const allCorrect = quizData.every(item => item.options[appState.answered[item.id]]?.correct);
    if (allCorrect) {
      unlockBadge(4, "Đại Kiện Tướng Số Liệu");
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

// === 5. INTERACTIVE LAB 1: KHOẢNG TIN CẬY & SAI SỐ TUYỆT ĐỐI ===
class ErrorLab {
  constructor() {
    this.canvas = document.getElementById('errorCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.a = 13.1;
    this.d = 0.2;
    this.initControls();
    this.draw();
  }

  initControls() {
    const sA = document.getElementById('sliderA');
    const sD = document.getElementById('sliderD');
    const vA = document.getElementById('valA');
    const vD = document.getElementById('valD');

    if (sA) {
      sA.addEventListener('input', (e) => {
        this.a = parseFloat(e.target.value);
        if (vA) vA.textContent = this.a.toFixed(1);
        this.updateMetrics();
        this.draw();
      });
    }

    if (sD) {
      sD.addEventListener('input', (e) => {
        this.d = parseFloat(e.target.value);
        if (vD) vD.textContent = this.d.toFixed(2);
        this.updateMetrics();
        this.draw();
      });
    }

    const btnEverest = document.getElementById('btnPresetEverest');
    if (btnEverest) {
      btnEverest.addEventListener('click', () => {
        this.a = 18.0; // scale representing 8848
        this.d = 0.15;
        this.setSliderValues(this.a, this.d);
        this.updateMetricsEverest();
        this.draw();
        sfx.playClick();
      });
    }

    const btnRice = document.getElementById('btnPresetRice');
    if (btnRice) {
      btnRice.addEventListener('click', () => {
        this.a = 10.0;
        this.d = 0.4;
        this.setSliderValues(this.a, this.d);
        this.updateMetricsRice();
        this.draw();
        sfx.playClick();
      });
    }

    const btnCup = document.getElementById('btnPresetCup');
    if (btnCup) {
      btnCup.addEventListener('click', () => {
        this.a = 13.1;
        this.d = 0.2;
        this.setSliderValues(this.a, this.d);
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }
  }

  setSliderValues(a, d) {
    const sA = document.getElementById('sliderA');
    const sD = document.getElementById('sliderD');
    const vA = document.getElementById('valA');
    const vD = document.getElementById('valD');
    if (sA) sA.value = a;
    if (sD) sD.value = d;
    if (vA) vA.textContent = a.toFixed(1);
    if (vD) vD.textContent = d.toFixed(2);
  }

  updateMetrics() {
    const lower = (this.a - this.d).toFixed(2);
    const upper = (this.a + this.d).toFixed(2);
    const rel = ((this.d / this.a) * 100).toFixed(2);

    const intEl = document.getElementById('outInterval');
    const errEl = document.getElementById('outMaxError');
    const relEl = document.getElementById('outRelError');

    if (intEl) intEl.textContent = `[${lower} ; ${upper}]`;
    if (errEl) errEl.textContent = `≤ ${this.d.toFixed(2)} cm`;
    if (relEl) relEl.textContent = `≤ ${rel} %`;
    unlockBadge(1, "Kỹ Sư Hiệu Chuẩn");
  }

  updateMetricsEverest() {
    const intEl = document.getElementById('outInterval');
    const errEl = document.getElementById('outMaxError');
    const relEl = document.getElementById('outRelError');
    if (intEl) intEl.textContent = '[8 843 m ; 8 853 m]';
    if (errEl) errEl.textContent = '≤ 5 m';
    if (relEl) relEl.textContent = '≤ 0.057 %';
    unlockBadge(1, "Kỹ Sư Hiệu Chuẩn");
  }

  updateMetricsRice() {
    const intEl = document.getElementById('outInterval');
    const errEl = document.getElementById('outMaxError');
    const relEl = document.getElementById('outRelError');
    if (intEl) intEl.textContent = '[4.80 kg ; 5.20 kg]';
    if (errEl) errEl.textContent = '≤ 0.20 kg';
    if (relEl) relEl.textContent = '≤ 4.00 %';
    unlockBadge(1, "Kỹ Sư Hiệu Chuẩn");
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Coordinate mapping
    const minX = 4;
    const maxX = 26;
    const toScreenX = (val) => 60 + ((val - minX) / (maxX - minX)) * (w - 120);
    const baseY = h / 2 + 30;

    // Grid ruler lines
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let x = minX; x <= maxX; x += 1) {
      const sx = toScreenX(x);
      const isMajor = x % 5 === 0;
      ctx.beginPath();
      ctx.moveTo(sx, baseY - (isMajor ? 16 : 8));
      ctx.lineTo(sx, baseY + (isMajor ? 16 : 8));
      ctx.stroke();

      if (isMajor) {
        ctx.fillStyle = '#94a3b8';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${x}`, sx, baseY + 32);
      }
    }

    // Main axis line
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, baseY);
    ctx.lineTo(w - 40, baseY);
    ctx.stroke();

    // Confidence interval band [a - d, a + d]
    const xLeft = toScreenX(this.a - this.d);
    const xRight = toScreenX(this.a + this.d);
    const xMid = toScreenX(this.a);

    // Band fill
    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx.fillRect(xLeft, baseY - 40, xRight - xLeft, 80);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.strokeRect(xLeft, baseY - 40, xRight - xLeft, 80);

    // Error brackets
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    // left bracket
    ctx.beginPath();
    ctx.moveTo(xLeft + 8, baseY - 35);
    ctx.lineTo(xLeft, baseY - 35);
    ctx.lineTo(xLeft, baseY + 35);
    ctx.lineTo(xLeft + 8, baseY + 35);
    ctx.stroke();
    // right bracket
    ctx.beginPath();
    ctx.moveTo(xRight - 8, baseY - 35);
    ctx.lineTo(xRight, baseY - 35);
    ctx.lineTo(xRight, baseY + 35);
    ctx.lineTo(xRight - 8, baseY + 35);
    ctx.stroke();

    // Target needle 'a'
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(xMid, baseY - 60);
    ctx.lineTo(xMid, baseY + 60);
    ctx.stroke();
    ctx.setLineDash([]);

    // Circle needle head
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(xMid, baseY - 60, 6, 0, Math.PI * 2);
    ctx.fill();

    // Labels
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`a = ${this.a.toFixed(1)}`, xMid, baseY - 70);

    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#6ee7b7';
    ctx.fillText(`a - d = ${(this.a - this.d).toFixed(2)}`, xLeft, baseY - 46);
    ctx.fillText(`a + d = ${(this.a + this.d).toFixed(2)}`, xRight, baseY - 46);

    // Arrow indicator for precision d
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(xMid, baseY + 50);
    ctx.lineTo(xRight, baseY + 50);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.fillText(`± d = ${this.d.toFixed(2)}`, (xMid + xRight) / 2, baseY + 64);
  }
}

// === 6. INTERACTIVE LAB 2: MÁY QUY TRÒN & SO SÁNH HAI PHÉP ĐO ===
class CompareLab {
  constructor() {
    this.canvas = document.getElementById('compareCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.caseMode = 1; // 1: Rice, 2: Cosmo, 3: Hubble
    this.d1 = 0.20;
    this.d2 = 0.50;
    this.initControls();
    this.draw();
  }

  initControls() {
    const s1 = document.getElementById('sliderD1');
    const s2 = document.getElementById('sliderD2');
    const v1 = document.getElementById('valD1');
    const v2 = document.getElementById('valD2');

    if (s1) {
      s1.addEventListener('input', (e) => {
        this.d1 = parseFloat(e.target.value);
        if (v1) v1.textContent = this.d1.toFixed(2);
        this.updateMetrics();
        this.draw();
      });
    }

    if (s2) {
      s2.addEventListener('input', (e) => {
        this.d2 = parseFloat(e.target.value);
        if (v2) v2.textContent = this.d2.toFixed(2);
        this.updateMetrics();
        this.draw();
      });
    }

    const bProd = document.getElementById('btnCaseProduction');
    const bCosmo = document.getElementById('btnCaseCosmo');
    const bHubble = document.getElementById('btnCaseHubble');

    if (bProd) {
      bProd.addEventListener('click', () => {
        this.caseMode = 1;
        this.setActiveCaseBtn(bProd);
        this.d1 = 0.20; this.d2 = 0.50;
        this.updateSliders(this.d1, this.d2);
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }

    if (bCosmo) {
      bCosmo.addEventListener('click', () => {
        this.caseMode = 2;
        this.setActiveCaseBtn(bCosmo);
        this.d1 = 0.026; this.d2 = 0.021;
        this.updateSliders(this.d1, this.d2);
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }

    if (bHubble) {
      bHubble.addEventListener('click', () => {
        this.caseMode = 3;
        this.setActiveCaseBtn(bHubble);
        this.d1 = 0.96; this.d2 = 0.46;
        this.updateSliders(this.d1, this.d2);
        this.updateMetrics();
        this.draw();
        sfx.playClick();
      });
    }
  }

  setActiveCaseBtn(btn) {
    document.querySelectorAll('.control-row .lab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  }

  updateSliders(d1, d2) {
    const s1 = document.getElementById('sliderD1');
    const s2 = document.getElementById('sliderD2');
    const v1 = document.getElementById('valD1');
    const v2 = document.getElementById('valD2');
    if (s1) { s1.value = d1; }
    if (s2) { s2.value = d2; }
    if (v1) v1.textContent = d1.toFixed(3);
    if (v2) v2.textContent = d2.toFixed(3);
  }

  updateMetrics() {
    let a1 = 5.0, a2 = 20.0;
    if (this.caseMode === 2) { a1 = 13.807; a2 = 13.799; }
    else if (this.caseMode === 3) { a1 = 67.31; a2 = 67.74; }

    const delta1 = (this.d1 / a1) * 100;
    const delta2 = (this.d2 / a2) * 100;

    const el1 = document.getElementById('outDelta1');
    const el2 = document.getElementById('outDelta2');
    const elWin = document.getElementById('outWinner');

    if (el1) el1.textContent = `${delta1.toFixed(3)} %`;
    if (el2) el2.textContent = `${delta2.toFixed(3)} %`;

    if (elWin) {
      if (Math.abs(delta1 - delta2) < 0.001) {
        elWin.textContent = 'Hai phép đo có chất lượng ngang nhau!';
        elWin.className = 'badge-gold';
      } else if (delta1 < delta2) {
        elWin.textContent = 'Phép đo 1 chính xác hơn (sai số tương đối nhỏ hơn)!';
        elWin.className = 'badge-cyan';
      } else {
        elWin.textContent = 'Phép đo 2 chính xác hơn (sai số tương đối nhỏ hơn)!';
        elWin.className = 'badge-green';
      }
    }
    unlockBadge(1, "Kỹ Sư Hiệu Chuẩn");
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0f172a');
    grad.addColorStop(1, '#090d16');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    let a1 = 5.0, a2 = 20.0, name1 = 'Dây chuyền A (5 kg)', name2 = 'Dây chuyền B (20 kg)';
    if (this.caseMode === 2) {
      a1 = 13.807; a2 = 13.799;
      name1 = 'Phương pháp 1 (13.807 tỷ năm)';
      name2 = 'Phương pháp 2 (13.799 tỷ năm)';
    } else if (this.caseMode === 3) {
      a1 = 67.31; a2 = 67.74;
      name1 = 'Hubble PP1 (67.31 km/s/Mpc)';
      name2 = 'Hubble PP3 (67.74 km/s/Mpc)';
    }

    const delta1 = (this.d1 / a1) * 100;
    const delta2 = (this.d2 / a2) * 100;
    const maxDelta = Math.max(delta1, delta2, 5.0);

    // Bar 1
    const barY1 = 60;
    const barY2 = 150;
    const barMaxWidth = w - 320;
    const len1 = (delta1 / maxDelta) * barMaxWidth;
    const len2 = (delta2 / maxDelta) * barMaxWidth;

    // Label 1
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.textAlign = 'left';
    ctx.fillText(`${name1}: ± ${this.d1.toFixed(3)}`, 40, barY1 - 10);

    // Bar 1 bg
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, barY1, barMaxWidth, 28);
    // Bar 1 fill
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(40, barY1, Math.max(len1, 4), 28);
    // Value text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`δ₁ ≈ ${delta1.toFixed(3)} %`, 50 + len1, barY1 + 19);

    // Label 2
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = '#34d399';
    ctx.fillText(`${name2}: ± ${this.d2.toFixed(3)}`, 40, barY2 - 10);

    // Bar 2 bg
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(40, barY2, barMaxWidth, 28);
    // Bar 2 fill
    ctx.fillStyle = '#10b981';
    ctx.fillRect(40, barY2, Math.max(len2, 4), 28);
    // Value text
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`δ₂ ≈ ${delta2.toFixed(3)} %`, 50 + len2, barY2 + 19);

    // Comparison summary footer
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Thanh ngắn hơn biểu thị sai số tương đối nhỏ hơn → Chất lượng phép đo cao hơn!', w / 2, h - 25);
  }
}

// === 7. INITIALIZATION & EVENT LISTENERS ===
document.addEventListener('DOMContentLoaded', () => {
  // Render formulas in HTML text
  renderMathInTree(document.body);

  // Initialize tabs
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

      if (target === 'theory') unlockBadge(0, "Khởi Động Đo Đạc");
      if (target === 'labs') unlockBadge(1, "Kỹ Sư Hiệu Chuẩn");
    });
  });

  // Sound toggle button
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

  // Reset button
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
        '👑': 'Đại Kiện Tướng Số Liệu',
        '🚀': 'Phi Hành Gia Vũ Trụ',
        '🧙‍♂️': 'Phù Thủy Thống Kê',
        '🦁': 'Sư Tử Dũng Mãnh',
        '💎': 'Bậc Thầy Tính Toán',
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

  // Certificate Print Button
  const btnPrintCert = document.getElementById('btnPrintCert');
  if (btnPrintCert) {
    btnPrintCert.addEventListener('click', () => {
      sfx.playClick();
      window.print();
    });
  }

  // Render Quiz & Labs
  renderQuiz();
  new ErrorLab();
  new CompareLab();
  updateHUD();

  // Initial badge check
  unlockBadge(0, "Khởi Động Đo Đạc");
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
