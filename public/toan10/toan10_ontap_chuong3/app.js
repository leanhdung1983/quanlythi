/* ================================================================
   BÀI TẬP CUỐI CHƯƠNG III: HỆ THỨC LƯỢNG TRONG TAM GIÁC - TOÁN 10
   Bộ sách: Kết Nối Tri Thức Với Cuộc Sống (Trang 44 - 45)
   Pure Vanilla JS • Web Audio API • 2D Canvas • MathML Offline
   Trường THPT Lương Thế Vinh - Đà Nẵng
   ================================================================ */

// --- 0. BỘ PARSER CÔNG THỨC TOÁN LATEX SANG NATIVE MATHML (100% OFFLINE, ZERO EXTERNAL LIBS) ---
const mathSymbols = [
  ["\\mathbb{N}^*", "<msub><mi class=\"m-bb\">&#8469;</mi><mo>*</mo></msub>"],
  ["\\mathbb{R}", "<mi class=\"m-bb\">&#8477;</mi>"],
  ["\\mathbb{N}", "<mi class=\"m-bb\">&#8469;</mi>"],
  ["\\mathbb{Z}", "<mi class=\"m-bb\">&#8484;</mi>"],
  ["\\mathbb{Q}", "<mi class=\"m-bb\">&#8474;</mi>"],
  ["\\Leftrightarrow", "<mo>&#8660;</mo>"],
  ["\\Rightarrow", "<mo>&#8658;</mo>"],
  ["\\Leftarrow", "<mo>&#8656;</mo>"],
  ["\\subseteq", "<mo>&#8838;</mo>"],
  ["\\supseteq", "<mo>&#8839;</mo>"],
  ["\\setminus", "<mo>&#8726;</mo>"],
  ["\\emptyset", "<mo>&#8709;</mo>"],
  ["\\approx", "<mo>&#8776;</mo>"],
  ["\\equiv", "<mo>&#8801;</mo>"],
  ["\\forall", "<mo>&#8704;</mo>"],
  ["\\exists", "<mo>&#8707;</mo>"],
  ["\\notin", "<mo>&#8713;</mo>"],
  ["\\subset", "<mo>&#8834;</mo>"],
  ["\\supset", "<mo>&#8835;</mo>"],
  ["\\infty", "<mo>&#8734;</mo>"],
  ["\\ldots", "<mo>&#8230;</mo>"],
  ["\\dots", "<mo>&#8230;</mo>"],
  ["\\times", "<mo>&#215;</mo>"],
  ["\\cdot", "<mo>&#8901;</mo>"],
  ["\\perp", "<mo>&#8869;</mo>"],
  ["\\parallel", "<mo>&#8741;</mo>"],
  ["\\angle", "<mo>&#8736;</mo>"],
  ["\\alpha", "<mi>&#945;</mi>"],
  ["\\beta", "<mi>&#946;</mi>"],
  ["\\gamma", "<mi>&#947;</mi>"],
  ["\\Delta", "<mi>&#916;</mi>"],
  ["\\delta", "<mi>&#948;</mi>"],
  ["\\lambda", "<mi>&#955;</mi>"],
  ["\\sigma", "<mi>&#963;</mi>"],
  ["\\omega", "<mi>&#969;</mi>"],
  ["\\theta", "<mi>&#952;</mi>"],
  ["\\pi", "<mi>&#960;</mi>"],
  ["\\mu", "<mi>&#956;</mi>"],
  ["\\sin", "<mi class=\"m-fn\">sin</mi>"],
  ["\\cos", "<mi class=\"m-fn\">cos</mi>"],
  ["\\tan", "<mi class=\"m-fn\">tan</mi>"],
  ["\\cot", "<mi class=\"m-fn\">cot</mi>"],
  ["\\geq", "<mo>&#8805;</mo>"],
  ["\\leq", "<mo>&#8804;</mo>"],
  ["\\neq", "<mo>&#8800;</mo>"],
  ["\\div", "<mo>&#247;</mo>"],
  ["\\sim", "<mo>&#8764;</mo>"],
  ["\\neg", "<mo>&#172;</mo>"],
  ["\\cup", "<mo>&#8746;</mo>"],
  ["\\cap", "<mo>&#8745;</mo>"],
  ["\\mid", "<mo>&#8739;</mo>"],
  ["\\ge", "<mo>&#8805;</mo>"],
  ["\\le", "<mo>&#8804;</mo>"],
  ["\\ne", "<mo>&#8800;</mo>"],
  ["\\pm", "<mo>&#177;</mo>"],
  ["\\mp", "<mo>&#8723;</mo>"],
  ["\\to", "<mo>&#8594;</mo>"],
  ["\\in", "<mo>&#8712;</mo>"],
  ["\\circ", "<mo>&#176;</mo>"],
  ["\\{", "<mo>{</mo>"],
  ["\\}", "<mo>}</mo>"],
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
    if (/[\+\-\service\*\=\/\<\>\(\)\[\]\{\}\,\;\:\!\?\|\']/.test(ch)) {
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

  // 1. Text blocks
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

  // 3. Overline & accents
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\widehat\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>^</mo></mover>'));

  // 4. Roots: \sqrt[n]{x}, \sqrt{x}
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, (m, n, x) => savePlaceholder('<mroot><mrow>' + convertLatexToMathMLBody(x, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow></mroot>'));
  let prevSqrt;
  do {
    prevSqrt = s;
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));
  } while (s !== prevSqrt);

  // 5. Fractions: \frac{a}{b}
  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
  } while (s !== prevFrac);

  // 6. Degree notations: 30^\circ or ^\circ or ^{\circ} BEFORE general symbol replacement
  s = s.replace(/\^\{\\circ\}/g, savePlaceholder('<mo>&#176;</mo>'));
  s = s.replace(/\^\\circ/g, savePlaceholder('<mo>&#176;</mo>'));

  // 7. Handle symbol replacements
  for (const [k, v] of mathSymbols) {
    if (s.includes(k)) {
      s = s.split(k).join(savePlaceholder(v));
    }
  }

  // 8. Superscripts & subscripts
  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)\^\{([^{}]+)\}/g, (m, b, exp) => {
    return savePlaceholder('<msup><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(exp, placeholders) + '</mrow></msup>');
  });
  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)\^([a-zA-Z0-9])/g, (m, b, exp) => {
    return savePlaceholder('<msup><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(exp, placeholders) + '</mrow></msup>');
  });
  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)_\{([^{}]+)\}/g, (m, b, sub) => {
    return savePlaceholder('<msub><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(sub, placeholders) + '</mrow></msub>');
  });
  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)_([a-zA-Z0-9])/g, (m, b, sub) => {
    return savePlaceholder('<msub><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(sub, placeholders) + '</mrow></msub>');
  });

  // 9. Tokenize the remaining plain segments outside placeholders
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

// --- 1. ÂM THANH WEB AUDIO API (100% OFFLINE) ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
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
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
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
      gain.gain.setValueAtTime(0.18, now + idx * 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.07);
      osc.stop(now + idx * 0.07 + 0.2);
    });
  }

  playWrong() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [280, 210];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);
      gain.gain.setValueAtTime(0.15, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.12 + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.2);
    });
  }

  playBadgeUnlock() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const melody = [440, 554.37, 659.25, 880];
    melody.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.32);
    });
  }
}

const sound = new SoundController();

// --- 2. QUẢN LÝ TIẾN TRÌNH & TRẠNG THÁI (STATE) ---
const STORAGE_KEY = "toan10_ontap_chuong3_state";

const defaultState = {
  avatar: "👑",
  userName: "Chiến Binh Logic",
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: {
    review: false,
    median: false,
    sport: false,
    arena: false,
    master: false
  }
};

let appState = { ...defaultState };

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      appState = { ...defaultState, ...JSON.parse(saved) };
    }
  } catch (e) {
    appState = { ...defaultState };
  }
  sound.enabled = appState.sound;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {}
}

function updateHUD() {
  document.getElementById("avatarBtn").textContent = appState.avatar;
  document.getElementById("userNameDisplay").textContent = `${appState.userName} 🌟`;
  document.getElementById("certStudentName").textContent = appState.userName;
  document.getElementById("xpDisplay").textContent = appState.xp;
  document.getElementById("streakDisplay").textContent = `🔥 ${appState.streak}`;
  document.getElementById("soundToggle").textContent = appState.sound ? "🔊 Âm thanh: BẬT" : "🔈 Âm thanh: TẮT";

  let stars = "⭐☆☆☆☆";
  let title = "Tập Sự Tổng Ôn Chương III";
  if (appState.xp >= 200) {
    stars = "⭐⭐⭐⭐⭐";
    title = "Đại Kiện Tướng Hệ Thức Lượng Toàn Năng";
  } else if (appState.xp >= 150) {
    stars = "⭐⭐⭐⭐☆";
    title = "Cao Thủ Lượng Giác & Tam Giác K10";
  } else if (appState.xp >= 100) {
    stars = "⭐⭐⭐☆☆";
    title = "Chuyên Viên Trung Tuyến Heron";
  } else if (appState.xp >= 50) {
    stars = "⭐⭐☆☆☆";
    title = "Chiến Binh Ôn Tập Năng Động";
  }
  document.getElementById("starRating").textContent = stars;
  document.getElementById("userTitle").textContent = title;
  document.getElementById("certHonorsTitle").textContent = `${title.toUpperCase()} 🏅`;

  updateBadgesUI();
}

function checkUnlockBadge(key) {
  if (!appState.badges[key]) {
    appState.badges[key] = true;
    sound.playBadgeUnlock();
    saveState();
    updateBadgesUI();
  }
}

function updateBadgesUI() {
  const badgeMap = {
    review: "badge-review",
    median: "badge-median",
    sport: "badge-sport",
    arena: "badge-arena",
    master: "badge-master"
  };

  for (const [key, id] of Object.entries(badgeMap)) {
    const el = document.getElementById(id);
    if (el) {
      if (appState.badges[key]) {
        el.classList.remove("locked");
        el.classList.add("unlocked");
      } else {
        el.classList.remove("unlocked");
        el.classList.add("locked");
      }
    }
  }

  if (appState.badges.review && appState.badges.median && appState.badges.sport && appState.badges.arena) {
    if (!appState.badges.master) {
      checkUnlockBadge("master");
    }
  }
}

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG SGK (10 CÂU BÀI 3.12 - 3.19 TRANG 44 - 45) ---
const quizData = [
  {
    id: 1,
    title: "Bài 3.12a (SGK Trang 44) - Diện Tích Tam Giác Có Góc 135°",
    pts: 20,
    question: "Cho tam giác $ABC$ có $\\widehat{B} = 135^\\circ$. Khẳng định nào sau đây là ĐÚNG?",
    options: [
      { text: "$S = \\frac{\\sqrt{2}}{4}ca$", correct: true },
      { text: "$S = \\frac{1}{2}ca$", correct: false },
      { text: "$S = -\\frac{\\sqrt{2}}{4}ac$", correct: false },
      { text: "$S = \\frac{\\sqrt{2}}{4}bc$", correct: false }
    ],
    explanation: "Áp dụng công thức tính diện tích theo 2 cạnh và góc xen giữa:<br>$$S = \\frac{1}{2}ca \\sin B = \\frac{1}{2}ca \\sin 135^\\circ = \\frac{1}{2}ca \\cdot \\frac{\\sqrt{2}}{2} = \\frac{\\sqrt{2}}{4}ca$$"
  },
  {
    id: 2,
    title: "Bài 3.12b (SGK Trang 44) - Bán Kính Đường Tròn Ngoại Tiếp R",
    pts: 20,
    question: "Cho tam giác $ABC$ có $\\widehat{B} = 135^\\circ$. Bán kính đường tròn ngoại tiếp $R$ thỏa mãn đẳng thức nào sau đây?",
    options: [
      { text: "$R = \\frac{\\sqrt{2}}{2}b$", correct: true },
      { text: "$R = \\frac{a}{\\sin A}$", correct: false },
      { text: "$R = \\frac{\\sqrt{2}}{2}c$", correct: false },
      { text: "$R = \\frac{\\sqrt{2}}{2}a$", correct: false }
    ],
    explanation: "Theo định lí sin trong tam giác $ABC$:<br>$$2R = \\frac{b}{\\sin B} = \\frac{b}{\\sin 135^\\circ} = \\frac{b}{\\frac{\\sqrt{2}}{2}} = b\\sqrt{2} \\implies R = \\frac{b\\sqrt{2}}{2} = \\frac{\\sqrt{2}}{2}b$$"
  },
  {
    id: 3,
    title: "Bài 3.12c (SGK Trang 44) - Định Lí Côsin Cho Góc B",
    pts: 20,
    question: "Cho tam giác $ABC$ có $\\widehat{B} = 135^\\circ$. Khẳng định nào sau đây là ĐÚNG?",
    options: [
      { text: "$b^2 = c^2 + a^2 - 2ca\\cos 135^\\circ$", correct: true },
      { text: "$a^2 = b^2 + c^2 + \\sqrt{2}ab$", correct: false },
      { text: "$\\frac{b}{\\sin A} = \\frac{a}{\\sin B}$", correct: false },
      { text: "$\\sin B = -\\frac{\\sqrt{2}}{2}$", correct: false }
    ],
    explanation: "Theo định lí côsin đối với cạnh $b$ và góc $B$:<br>$$b^2 = c^2 + a^2 - 2ca\\cos B = c^2 + a^2 - 2ca\\cos 135^\\circ$$<br>(Lưu ý: $\\cos 135^\\circ = -\\frac{\\sqrt{2}}{2}$ nên $b^2 = c^2 + a^2 + \\sqrt{2}ca$)."
  },
  {
    id: 4,
    title: "Bài 3.13a (SGK Trang 44) - Đẳng Thức Nào Đúng Về Tam Giác ABC?",
    pts: 20,
    question: "Cho tam giác $ABC$. Khẳng định nào sau đây là ĐÚNG?",
    options: [
      { text: "$r = \\frac{2S}{a+b+c}$", correct: true },
      { text: "$S = \\frac{abc}{4r}$", correct: false },
      { text: "$a^2 = b^2 + c^2 + 2bc\\cos A$", correct: false },
      { text: "$S = r(a+b+c)$", correct: false }
    ],
    explanation: "Ta có công thức diện tích qua bán kính đường tròn nội tiếp:<br>$$S = pr = \\frac{a+b+c}{2} \\cdot r \\implies r = \\frac{2S}{a+b+c}$$"
  },
  {
    id: 5,
    title: "Bài 3.13b (SGK Trang 44) - Mối Quan Hệ Lượng Giác 3 Góc Tam Giác",
    pts: 20,
    question: "Trong tam giác $ABC$, khẳng định nào sau đây luôn ĐÚNG?",
    options: [
      { text: "$\\sin A = \\sin(B + C)$", correct: true },
      { text: "$\\cos A = \\cos(B + C)$", correct: false },
      { text: "$\\cos A > 0$", correct: false },
      { text: "$\\sin A \\le 0$", correct: false }
    ],
    explanation: "Trong tam giác $ABC$, tổng ba góc bằng $180^\\circ \\implies A = 180^\\circ - (B + C)$.<br>Vì $A$ và $(B+C)$ là hai góc bù nhau nên sin của chúng bằng nhau:<br>$$\\sin A = \\sin(180^\\circ - (B + C)) = \\sin(B + C)$$<br>(Trong khi đó $\\cos A = -\\cos(B+C)$)."
  },
  {
    id: 6,
    title: "Bài 3.14a (SGK Trang 44) - Tính Giá Trị Biểu Thức Lượng Giác M",
    pts: 20,
    question: "Tính giá trị của biểu thức: $M = \\sin 45^\\circ \\cdot \\cos 45^\\circ + \\sin 30^\\circ$.",
    options: [
      { text: "$M = 1$", correct: true },
      { text: "$M = \\frac{1}{2}$", correct: false },
      { text: "$M = \\frac{\\sqrt{2}}{2}$", correct: false },
      { text: "$M = \\frac{3}{4}$", correct: false }
    ],
    explanation: "Thay các giá trị góc đặc biệt vào:<br>• $\\sin 45^\\circ = \\frac{\\sqrt{2}}{2}$<br>• $\\cos 45^\\circ = \\frac{\\sqrt{2}}{2}$<br>• $\\sin 30^\\circ = \\frac{1}{2}$<br>Ta được: $M = \\frac{\\sqrt{2}}{2} \\cdot \\frac{\\sqrt{2}}{2} + \\frac{1}{2} = \\frac{2}{4} + \\frac{1}{2} = \\frac{1}{2} + \\frac{1}{2} = 1$."
  },
  {
    id: 7,
    title: "Bài 3.15 (SGK Trang 44) - Tính Cạnh a & Bán Kính R Của Tam Giác",
    pts: 20,
    question: "Cho tam giác $ABC$ có $\\widehat{B} = 60^\\circ, \\widehat{C} = 45^\\circ, b = AC = 10$. Bán kính ngoại tiếp $R$ và cạnh $a$ xấp xỉ bằng:",
    options: [
      { text: "$R \\approx 5,77$ và $a \\approx 11,15$", correct: true },
      { text: "$R \\approx 11,55$ và $a \\approx 8,50$", correct: false },
      { text: "$R \\approx 7,07$ và $a \\approx 14,14$", correct: false },
      { text: "$R \\approx 10,00$ và $a \\approx 12,25$", correct: false }
    ],
    explanation: "• Theo định lí sin: $2R = \\frac{b}{\\sin B} = \\frac{10}{\\sin 60^\\circ} = \\frac{10}{\\frac{\\sqrt{3}}{2}} = \\frac{20\\sqrt{3}}{3} \\implies R = \\frac{10\\sqrt{3}}{3} \\approx 5,77$.<br>• Góc $\\widehat{A} = 180^\\circ - (60^\\circ + 45^\\circ) = 75^\\circ$.<br>• Cạnh $a = 2R \\sin A = \\frac{20\\sqrt{3}}{3} \\sin 75^\\circ \\approx 11,547 \\times 0,9659 \\approx 11,15$."
  },
  {
    id: 8,
    title: "Bài 3.16c (SGK Trang 44) - Công Thức Độ Dài Đường Trung Tuyến",
    pts: 20,
    question: "Cho tam giác $ABC$ có độ dài 3 cạnh là $a, b, c$. Công thức tính độ dài đường trung tuyến $m_a$ kẻ từ đỉnh $A$ là:",
    options: [
      { text: "$m_a^2 = \\frac{2(b^2 + c^2) - a^2}{4}$", correct: true },
      { text: "$m_a^2 = \\frac{b^2 + c^2 - a^2}{2}$", correct: false },
      { text: "$m_a^2 = \\frac{2(b^2 + c^2) + a^2}{4}$", correct: false },
      { text: "$m_a^2 = \\frac{a^2 + b^2 + c^2}{3}$", correct: false }
    ],
    explanation: "Đây là công thức độ dài đường trung tuyến trong tam giác chứng minh từ định lí côsin trong hai tam giác $AMB$ và $AMC$ với hai góc kề bù $\\widehat{AMB} + \\widehat{AMC} = 180^\\circ$:<br>$$m_a^2 = \\frac{2(b^2 + c^2) - a^2}{4}$$"
  },
  {
    id: 9,
    title: "Bài 3.17 (SGK Trang 44) - Nhận Dạng Góc Tù Qua Cạnh",
    pts: 20,
    question: "Nếu một tam giác $ABC$ có $b^2 + c^2 < a^2$ thì khẳng định nào sau đây là ĐÚNG?",
    options: [
      { text: "Góc $A$ là góc tù", correct: true },
      { text: "Góc $A$ là góc nhọn", correct: false },
      { text: "Góc $A$ là góc vuông", correct: false },
      { text: "Không xác định được loại góc $A$", correct: false }
    ],
    explanation: "Từ định lí côsin: $\\cos A = \\frac{b^2 + c^2 - a^2}{2bc}$.<br>Vì $b^2 + c^2 < a^2$ nên tử số $b^2 + c^2 - a^2 < 0$. Mẫu số $2bc > 0$.<br>Do đó $\\cos A < 0 \\implies 90^\\circ < \\widehat{A} < 180^\\circ$ (góc $A$ là góc tù)."
  },
  {
    id: 10,
    title: "Bài 3.19 (SGK Trang 45) - Khoảng Cách Sân Bóng Chày",
    pts: 20,
    question: "Sân bóng chày hình vuông cạnh $27,4$ m. Vị trí ném bóng $P$ nằm trên đường chéo nối gôn Nhà với gôn 2, cách gôn Nhà $18,44$ m. Khoảng cách từ vị trí ném bóng tới gôn 1 và gôn 3 xấp xỉ bằng:",
    options: [
      { text: "$19,40$ m", correct: true },
      { text: "$22,50$ m", correct: false },
      { text: "$15,20$ m", correct: false },
      { text: "$27,40$ m", correct: false }
    ],
    explanation: "Trong hình vuông, đường chéo hợp với cạnh một góc $45^\\circ$. Xét tam giác tạo bởi gôn Nhà ($H$), vị trí ném bóng ($P$) và gôn 1 ($G_1$):<br>• $HP = 18,44$ m<br>• $HG_1 = 27,4$ m<br>• $\\widehat{PHG_1} = 45^\\circ$<br>Áp dụng định lí côsin:<br>$$PG_1^2 = HP^2 + HG_1^2 - 2 \\cdot HP \\cdot HG_1 \\cos 45^\\circ$$<br>$$PG_1^2 = 18,44^2 + 27,4^2 - 2(18,44)(27,4)\\cos 45^\\circ \\approx 340,03 + 750,76 - 714,54 = 376,25$$<br>$$\\implies PG_1 = \\sqrt{376,25} \\approx 19,40 \\text{ m}$$<br>Do đối xứng, khoảng cách tới gôn 3 cũng bằng $19,40$ m."
  }
];

// --- 4. KHỞI TẠO ĐẤU TRƯỜNG ARENA ---
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
            return `
              <button class="${cls}" data-qid="${q.id}" data-oidx="${oIdx}" ${isAnswered ? "disabled" : ""}>
                <span style="font-weight: 700; color: var(--cyan-neon);">${String.fromCharCode(65 + oIdx)}.</span>
                <span>${formatMathText(opt.text)}</span>
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
    sound.playCorrect();
  } else {
    appState.streak = 0;
    sound.playWrong();
  }

  if (appState.xp >= 160) {
    checkUnlockBadge("arena");
  }

  saveState();
  updateHUD();
  renderQuiz();
}

function updateArenaStats() {
  const answeredCount = Object.keys(appState.answered).length;
  document.getElementById("arenaProgress").textContent = `${answeredCount}/10`;
  document.getElementById("arenaScore").textContent = `${appState.xp} XP`;
}

// --- 5. PHÒNG THÍ NGHIỆM 1: ĐƯỜNG TRUNG TUYẾN & PHÂN LOẠI TAM GIÁC ---
const medCanvas = document.getElementById("medianCanvas");
const medCtx = medCanvas ? medCanvas.getContext("2d") : null;

const sliderMedA = document.getElementById("medA");
const sliderMedB = document.getElementById("medB");
const sliderMedC = document.getElementById("medC");

let mA = 6;
let mB = 8;
let mC = 10;

function drawMedianLab() {
  if (!medCtx) return;
  const w = medCanvas.width;
  const h = medCanvas.height;
  medCtx.clearRect(0, 0, w, h);

  if (mA + mB <= mC || mA + mC <= mB || mB + mC <= mA) {
    medCtx.fillStyle = "#f43f5e";
    medCtx.font = "bold 14px 'Inter', sans-serif";
    medCtx.textAlign = "center";
    medCtx.fillText("⚠️ Không thỏa mãn bất đẳng thức tam giác!", w / 2, h / 2);
    medCtx.textAlign = "left";
    return;
  }

  // Góc A và phân loại
  const cosA = (mB * mB + mC * mC - mA * mA) / (2 * mB * mC);
  const angleA_deg = (Math.acos(cosA) * 180) / Math.PI;

  const pyth = mB * mB + mC * mC - mA * mA;
  let angleType = "Góc Nhọn (< 90°)";
  let typeColor = "#10b981";

  if (Math.abs(pyth) < 0.01) {
    angleType = "Góc Vuông (90°)";
    typeColor = "#38bdf8";
  } else if (pyth < 0) {
    angleType = "Góc Tù (> 90°)";
    typeColor = "#f43f5e";
  }

  // Trung tuyến ma: ma^2 = (2(b^2+c^2)-a^2)/4
  const ma_sq = (2 * (mB * mB + mC * mC) - mA * mA) / 4;
  const ma_len = Math.sqrt(Math.max(0, ma_sq));

  document.getElementById("typeAngleA").textContent = angleType;
  document.getElementById("typeAngleA").style.color = typeColor;
  document.getElementById("pythCheck").textContent = `${pyth.toFixed(1)} (${pyth > 0 ? "> 0" : (pyth < 0 ? "< 0" : "= 0")})`;
  document.getElementById("valMa").textContent = ma_len.toFixed(2);
  document.getElementById("checkMa").textContent = `ma² = ${ma_sq.toFixed(2)}`;

  // Tọa độ vẽ: Đặt BC nằm ngang
  const scale = 19;
  const baseY = h - 55;
  const B = { x: 90, y: baseY };
  const C_pt = { x: B.x + mA * scale, y: baseY };

  // Đỉnh A
  const cosB = (mA * mA + mC * mC - mB * mB) / (2 * mA * mC);
  const angleB_rad = Math.acos(cosB);
  const A = {
    x: B.x + mC * Math.cos(angleB_rad) * scale,
    y: B.y - mC * Math.sin(angleB_rad) * scale
  };

  // Cân chỉnh giữa canvas
  const minX = Math.min(A.x, B.x, C_pt.x);
  const maxX = Math.max(A.x, B.x, C_pt.x);
  const offX = (w - (maxX - minX)) / 2 - minX;
  A.x += offX;
  B.x += offX;
  C_pt.x += offX;

  // 3 trung điểm
  const Ma = { x: (B.x + C_pt.x) / 2, y: (B.y + C_pt.y) / 2 };
  const Mb = { x: (A.x + C_pt.x) / 2, y: (A.y + C_pt.y) / 2 };
  const Mc = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };

  // Trọng tâm G: giao 3 trung tuyến
  const G = {
    x: (A.x + B.x + C_pt.x) / 3,
    y: (A.y + B.y + C_pt.y) / 3
  };

  // Tô tam giác
  medCtx.beginPath();
  medCtx.moveTo(A.x, A.y);
  medCtx.lineTo(B.x, B.y);
  medCtx.lineTo(C_pt.x, C_pt.y);
  medCtx.closePath();
  medCtx.fillStyle = "rgba(99, 102, 241, 0.12)";
  medCtx.fill();

  // 3 đường trung tuyến
  medCtx.strokeStyle = "rgba(245, 158, 11, 0.85)"; // ma
  medCtx.lineWidth = 2.5;
  medCtx.beginPath();
  medCtx.moveTo(A.x, A.y);
  medCtx.lineTo(Ma.x, Ma.y);
  medCtx.stroke();

  medCtx.strokeStyle = "rgba(56, 189, 248, 0.5)"; // mb
  medCtx.lineWidth = 1.5;
  medCtx.beginPath();
  medCtx.moveTo(B.x, B.y);
  medCtx.lineTo(Mb.x, Mb.y);
  medCtx.moveTo(C_pt.x, C_pt.y);
  medCtx.lineTo(Mc.x, Mc.y);
  medCtx.stroke();

  // Viền tam giác
  medCtx.strokeStyle = "rgba(99, 102, 241, 0.9)";
  medCtx.lineWidth = 2;
  medCtx.beginPath();
  medCtx.moveTo(A.x, A.y);
  medCtx.lineTo(B.x, B.y);
  medCtx.lineTo(C_pt.x, C_pt.y);
  medCtx.closePath();
  medCtx.stroke();

  // Điểm G
  medCtx.beginPath();
  medCtx.arc(G.x, G.y, 4, 0, 2 * Math.PI);
  medCtx.fillStyle = "#f59e0b";
  medCtx.fill();
  medCtx.font = "bold 12px 'Inter', sans-serif";
  medCtx.fillText("G", G.x + 6, G.y - 4);

  // Nhãn các đỉnh
  medCtx.fillStyle = "#fff";
  medCtx.fillText("A", A.x - 4, A.y - 10);
  medCtx.fillText("B", B.x - 16, B.y + 16);
  medCtx.fillText("C", C_pt.x + 8, C_pt.y + 16);
  medCtx.fillStyle = "#f59e0b";
  medCtx.fillText("M_a", Ma.x - 8, Ma.y + 18);

  checkUnlockBadge("median");
}

if (sliderMedA) {
  sliderMedA.addEventListener("input", (e) => {
    mA = parseFloat(e.target.value);
    document.getElementById("medAVal").textContent = mA;
    drawMedianLab();
  });
}
if (sliderMedB) {
  sliderMedB.addEventListener("input", (e) => {
    mB = parseFloat(e.target.value);
    document.getElementById("medBVal").textContent = mB;
    drawMedianLab();
  });
}
if (sliderMedC) {
  sliderMedC.addEventListener("input", (e) => {
    mC = parseFloat(e.target.value);
    document.getElementById("medCVal").textContent = mC;
    drawMedianLab();
  });
}

// --- 6. PHÒNG THÍ NGHIỆM 2: SÂN BÓNG CHÀY & HẢI TRÌNH ĐÓN TÀU ---
const pracCanvas = document.getElementById("practicalCanvas");
const pracCtx = pracCanvas ? pracCanvas.getContext("2d") : null;

let labMode = "baseball"; // hoặc 'ship'

const btnModeBaseball = document.getElementById("btnModeBaseball");
const btnModeShip = document.getElementById("btnModeShip");
const baseballControls = document.getElementById("baseballControls");
const shipControls = document.getElementById("shipControls");

const sliderPitcher = document.getElementById("pitcherDist");
const sliderShipTime = document.getElementById("shipTime");

let pitcherDistVal = 18.44; // mét
let shipTimeVal = 2.0; // giờ

function drawPracticalLab() {
  if (!pracCtx) return;
  const w = pracCanvas.width;
  const h = pracCanvas.height;
  pracCtx.clearRect(0, 0, w, h);

  if (labMode === "baseball") {
    drawBaseballDiamond(w, h);
  } else {
    drawMaritimePursuit(w, h);
  }
}

function drawBaseballDiamond(w, h) {
  const ox = w / 2;
  const oy = h - 45;
  const side_px = 140; // 27.4m

  // Sân cỏ
  pracCtx.fillStyle = "rgba(22, 101, 52, 0.25)";
  pracCtx.beginPath();
  pracCtx.arc(ox, oy, 190, -Math.PI * 0.8, -Math.PI * 0.2);
  pracCtx.lineTo(ox, oy);
  pracCtx.fill();

  // 4 gôn hình vuông:
  // H (gôn Nhà) tại đáy: (ox, oy)
  // G1 (gôn 1) bên phải: quay 45 độ
  // G2 (gôn 2) trên đỉnh
  // G3 (gôn 3) bên trái
  const diag_px = side_px * Math.SQRT2;
  const H = { x: ox, y: oy };
  const G2 = { x: ox, y: oy - diag_px };
  const G1 = { x: ox + side_px * Math.cos(Math.PI / 4), y: oy - side_px * Math.sin(Math.PI / 4) };
  const G3 = { x: ox - side_px * Math.cos(Math.PI / 4), y: oy - side_px * Math.sin(Math.PI / 4) };

  // Đường chạy giữa các gôn
  pracCtx.strokeStyle = "rgba(245, 158, 11, 0.8)";
  pracCtx.lineWidth = 2.5;
  pracCtx.beginPath();
  pracCtx.moveTo(H.x, H.y);
  pracCtx.lineTo(G1.x, G1.y);
  pracCtx.lineTo(G2.x, G2.y);
  pracCtx.lineTo(G3.x, G3.y);
  pracCtx.closePath();
  pracCtx.stroke();

  // Đường chéo H - G2
  pracCtx.setLineDash([4, 4]);
  pracCtx.strokeStyle = "rgba(255, 255, 255, 0.3)";
  pracCtx.lineWidth = 1.5;
  pracCtx.beginPath();
  pracCtx.moveTo(H.x, H.y);
  pracCtx.lineTo(G2.x, G2.y);
  pracCtx.stroke();
  pracCtx.setLineDash([]);

  // Vị trí ném bóng P
  const ratioP = pitcherDistVal / (27.4 * Math.SQRT2);
  const Px = ox;
  const Py = oy - diag_px * ratioP;

  // Đoạn nối từ P tới G1 và G3
  pracCtx.strokeStyle = "rgba(56, 189, 248, 0.9)";
  pracCtx.lineWidth = 2;
  pracCtx.beginPath();
  pracCtx.moveTo(Px, Py);
  pracCtx.lineTo(G1.x, G1.y);
  pracCtx.moveTo(Px, Py);
  pracCtx.lineTo(G3.x, G3.y);
  pracCtx.stroke();

  // Vẽ các gôn
  const bases = [
    { pt: H, label: "Gôn Nhà (Home)", color: "#fff" },
    { pt: G1, label: "Gôn 1", color: "#fef08a" },
    { pt: G2, label: "Gôn 2", color: "#fef08a" },
    { pt: G3, label: "Gôn 3", color: "#fef08a" }
  ];

  bases.forEach(b => {
    pracCtx.fillStyle = b.color;
    pracCtx.fillRect(b.pt.x - 5, b.pt.y - 5, 10, 10);
    pracCtx.font = "bold 11px 'Inter', sans-serif";
    pracCtx.fillText(b.label, b.pt.x + 8, b.pt.y + 4);
  });

  // Điểm ném bóng P
  pracCtx.beginPath();
  pracCtx.arc(Px, Py, 6, 0, 2 * Math.PI);
  pracCtx.fillStyle = "#f43f5e";
  pracCtx.fill();
  pracCtx.strokeStyle = "#fff";
  pracCtx.stroke();

  pracCtx.fillStyle = "#fda4af";
  pracCtx.font = "bold 12px 'Inter', sans-serif";
  pracCtx.fillText("Vị trí ném (P)", Px + 10, Py - 4);

  // Tính khoảng cách PG1 theo định lí côsin
  const dSq = pitcherDistVal * pitcherDistVal + 27.4 * 27.4 - 2 * pitcherDistVal * 27.4 * Math.cos(Math.PI / 4);
  const dReal = Math.sqrt(Math.max(0, dSq));
  document.getElementById("distBase1").textContent = `PG₁ = PG₃ = ${dReal.toFixed(2)} m`;

  checkUnlockBadge("sport");
}

function drawMaritimePursuit(w, h) {
  // Biển xanh
  pracCtx.fillStyle = "rgba(15, 23, 42, 0.6)";
  pracCtx.fillRect(0, 0, w, h);

  const Ax = 80;
  const Ay = h - 60;
  const scale = 1.9;

  // Tàu B ban đầu cách A 53 km hướng N34°E
  // Góc 34° so với phương Bắc
  const rad34 = (34 * Math.PI) / 180;
  const Bx = Ax + 53 * Math.sin(rad34) * scale;
  const By = Ay - 53 * Math.cos(rad34) * scale;

  // Tàu B đi về hướng Đông với v = 30 km/h sau thời gian t
  const distB = 30 * shipTimeVal;
  const Cx = Bx + distB * scale;
  const Cy = By; // Đi ngang về hướng đông

  // Tàu A đi thẳng với v = 50 km/h
  const distA = 50 * shipTimeVal;

  // Quỹ đạo tàu B
  pracCtx.strokeStyle = "rgba(244, 63, 94, 0.8)";
  pracCtx.lineWidth = 2.5;
  pracCtx.beginPath();
  pracCtx.moveTo(Bx, By);
  pracCtx.lineTo(Cx, Cy);
  pracCtx.stroke();

  // Quỹ đạo tàu A
  pracCtx.strokeStyle = "rgba(16, 185, 129, 0.9)";
  pracCtx.lineWidth = 2.5;
  pracCtx.beginPath();
  pracCtx.moveTo(Ax, Ay);
  pracCtx.lineTo(Cx, Cy);
  pracCtx.stroke();

  // Đoạn ban đầu AB
  pracCtx.setLineDash([4, 4]);
  pracCtx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  pracCtx.beginPath();
  pracCtx.moveTo(Ax, Ay);
  pracCtx.lineTo(Bx, By);
  pracCtx.stroke();
  pracCtx.setLineDash([]);

  // Điểm A
  pracCtx.beginPath();
  pracCtx.arc(Ax, Ay, 6, 0, 2 * Math.PI);
  pracCtx.fillStyle = "#10b981";
  pracCtx.fill();
  pracCtx.fillStyle = "#fff";
  pracCtx.font = "bold 12px 'Inter', sans-serif";
  pracCtx.fillText("Tàu A", Ax - 40, Ay + 16);

  // Điểm B
  pracCtx.beginPath();
  pracCtx.arc(Bx, By, 6, 0, 2 * Math.PI);
  pracCtx.fillStyle = "#f43f5e";
  pracCtx.fill();
  pracCtx.fillText("Tàu B", Bx - 30, By - 10);

  // Điểm C (Điểm đón)
  pracCtx.beginPath();
  pracCtx.arc(Cx, Cy, 7, 0, 2 * Math.PI);
  pracCtx.fillStyle = "#f59e0b";
  pracCtx.fill();
  pracCtx.fillText("Gặp nhau (C)", Cx - 10, Cy - 12);

  // Update text readout
  document.getElementById("shipB_dist").textContent = `${distB.toFixed(1)} km`;
  document.getElementById("shipA_dist").textContent = `${distA.toFixed(1)} km`;

  checkUnlockBadge("sport");
}

if (btnModeBaseball) {
  btnModeBaseball.addEventListener("click", () => {
    labMode = "baseball";
    btnModeBaseball.classList.add("active");
    btnModeShip.classList.remove("active");
    baseballControls.style.display = "block";
    shipControls.style.display = "none";
    drawPracticalLab();
    sound.playClick();
  });
}

if (btnModeShip) {
  btnModeShip.addEventListener("click", () => {
    labMode = "ship";
    btnModeShip.classList.add("active");
    btnModeBaseball.classList.remove("active");
    baseballControls.style.display = "none";
    shipControls.style.display = "block";
    drawPracticalLab();
    sound.playClick();
  });
}

if (sliderPitcher) {
  sliderPitcher.addEventListener("input", (e) => {
    pitcherDistVal = parseFloat(e.target.value);
    document.getElementById("pitcherVal").textContent = `${pitcherDistVal} m`;
    drawPracticalLab();
  });
}

if (sliderShipTime) {
  sliderShipTime.addEventListener("input", (e) => {
    shipTimeVal = parseFloat(e.target.value);
    document.getElementById("shipTimeVal").textContent = `${shipTimeVal.toFixed(1)} giờ`;
    drawPracticalLab();
  });
}

// --- 7. TABS NAVIGATION & MODAL AVATAR ---
function setupTabs() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      sound.playClick();
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));

      tab.classList.add("active");
      const targetId = `tab-${tab.dataset.tab}`;
      const targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.classList.add("active");
        renderMathInTree(targetEl);
      }

      if (tab.dataset.tab === "labs") {
        setTimeout(() => {
          drawMedianLab();
          drawPracticalLab();
        }, 50);
      }
    });
  });
}

function setupModal() {
  const modal = document.getElementById("avatarModal");
  const btnOpen = document.getElementById("avatarBtn");
  const btnClose = document.getElementById("btnCloseAvatarModal");

  btnOpen.addEventListener("click", () => {
    sound.playClick();
    modal.style.display = "flex";
  });

  btnClose.addEventListener("click", () => {
    sound.playClick();
    modal.style.display = "none";
  });

  document.querySelectorAll(".avatar-choice").forEach(btn => {
    btn.addEventListener("click", () => {
      sound.playClick();
      appState.avatar = btn.dataset.avatar;
      saveState();
      updateHUD();
      modal.style.display = "none";
    });
  });
}

// Reset tiến trình
document.getElementById("resetProgress").addEventListener("click", () => {
  if (confirm("Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình học tập của Tổng Ôn Chương III?")) {
    sound.playClick();
    localStorage.removeItem(STORAGE_KEY);
    appState = { ...defaultState };
    saveState();
    updateHUD();
    renderQuiz();
    drawMedianLab();
    drawPracticalLab();
  }
});

// Sound Toggle
document.getElementById("soundToggle").addEventListener("click", () => {
  appState.sound = !appState.sound;
  sound.enabled = appState.sound;
  saveState();
  updateHUD();
  if (sound.enabled) sound.playClick();
});

// --- 8. KHỞI CHẠY HỆ THỐNG ---
window.addEventListener("DOMContentLoaded", () => {
  loadState();
  updateHUD();
  setupTabs();
  setupModal();
  renderQuiz();

  // Khởi tạo đồ họa canvas
  drawMedianLab();
  drawPracticalLab();

  // Kiểm tra badge review
  checkUnlockBadge("review");

  // Render MathML toàn trang
  renderMathInTree(document.body);
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
