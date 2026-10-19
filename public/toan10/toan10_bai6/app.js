/* ================================================================
   BÀI 6: HỆ THỨC LƯỢNG TRONG TAM GIÁC - TOÁN 10
   Bộ sách: Kết Nối Tri Thức Với Cuộc Sống (Trang 38 - 43)
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
const STORAGE_KEY = "toan10_bai6_state";

const defaultState = {
  avatar: "👑",
  userName: "Chiến Binh Logic",
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: {
    cosine: false,
    sine: false,
    survey: false,
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
  let title = "Tập Sự Hình Học";
  if (appState.xp >= 200) {
    stars = "⭐⭐⭐⭐⭐";
    title = "Đại Kiện Tướng Hình Học Tam Giác";
  } else if (appState.xp >= 150) {
    stars = "⭐⭐⭐⭐☆";
    title = "Cao Thủ Hệ Thức Lượng K10";
  } else if (appState.xp >= 100) {
    stars = "⭐⭐⭐☆☆";
    title = "Chuyên Viên Trắc Địa Heron";
  } else if (appState.xp >= 50) {
    stars = "⭐⭐☆☆☆";
    title = "Chiến Binh Tam Giác Năng Động";
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
    cosine: "badge-cosine",
    sine: "badge-sine",
    survey: "badge-survey",
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

  if (appState.badges.cosine && appState.badges.sine && appState.badges.survey && appState.badges.arena) {
    if (!appState.badges.master) {
      checkUnlockBadge("master");
    }
  }
}

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG SGK (10 CÂU BÀI 3.5 - 3.11 TRANG 42 - 43) ---
const quizData = [
  {
    id: 1,
    title: "Bài 3.5a (SGK Trang 42) - Tính Cosin Góc A Khi Biết 3 Cạnh",
    pts: 20,
    question: "Cho tam giác $ABC$ có các cạnh $a = 6, b = 5, c = 8$. Giá trị của $\\cos A$ bằng bao nhiêu?",
    options: [
      { text: "$\\cos A = \\frac{53}{80}$", correct: true },
      { text: "$\\cos A = \\frac{53}{40}$", correct: false },
      { text: "$\\cos A = \\frac{7}{80}$", correct: false },
      { text: "$\\cos A = \\frac{3}{5}$", correct: false }
    ],
    explanation: "Áp dụng hệ quả của định lí côsin cho góc $A$:<br>$$\\cos A = \\frac{b^2 + c^2 - a^2}{2bc} = \\frac{5^2 + 8^2 - 6^2}{2 \\cdot 5 \\cdot 8} = \\frac{25 + 64 - 36}{80} = \\frac{53}{80}$$"
  },
  {
    id: 2,
    title: "Bài 3.5b (SGK Trang 42) - Tính Diện Tích & Bán Kính Nội Tiếp r",
    pts: 20,
    question: "Với tam giác $ABC$ có $a = 6, b = 5, c = 8$, diện tích $S$ và bán kính đường tròn nội tiếp $r$ lần lượt xấp xỉ bằng:",
    options: [
      { text: "$S \\approx 14,98$ và $r \\approx 1,58$", correct: true },
      { text: "$S \\approx 29,96$ và $r \\approx 3,15$", correct: false },
      { text: "$S \\approx 12,50$ và $r \\approx 2,10$", correct: false },
      { text: "$S \\approx 20,00$ và $r \\approx 1,05$", correct: false }
    ],
    explanation: "Nửa chu vi tam giác: $p = \\frac{6 + 5 + 8}{2} = 9,5$.<br>Áp dụng công thức Heron:<br>$$S = \\sqrt{p(p-a)(p-b)(p-c)} = \\sqrt{9,5 \\cdot 3,5 \\cdot 4,5 \\cdot 1,5} = \\sqrt{224,4375} \\approx 14,98$$<br>Bán kính đường tròn nội tiếp:<br>$$r = \\frac{S}{p} = \\frac{14,98}{9,5} \\approx 1,58$$"
  },
  {
    id: 3,
    title: "Bài 3.6a (SGK Trang 42) - Bán Kính Ngoại Tiếp R Qua Định Lí Sin",
    pts: 20,
    question: "Cho tam giác $ABC$ có $a = 10, \\widehat{A} = 45^\\circ, \\widehat{B} = 70^\\circ$. Bán kính đường tròn ngoại tiếp $R$ bằng:",
    options: [
      { text: "$R = 5\\sqrt{2} \\approx 7,07$", correct: true },
      { text: "$R = 10\\sqrt{2} \\approx 14,14$", correct: false },
      { text: "$R = 5$", correct: false },
      { text: "$R = 10$", correct: false }
    ],
    explanation: "Áp dụng định lí sin:<br>$$\\frac{a}{\\sin A} = 2R \\implies 2R = \\frac{10}{\\sin 45^\\circ} = \\frac{10}{\\frac{\\sqrt{2}}{2}} = 10\\sqrt{2} \\implies R = 5\\sqrt{2} \\approx 7,07$$"
  },
  {
    id: 4,
    title: "Bài 3.6b (SGK Trang 42) - Tính Độ Dài Các Cạnh Còn Lại",
    pts: 20,
    question: "Tiếp tục với tam giác $ABC$ ($a = 10, \\widehat{A} = 45^\\circ, \\widehat{B} = 70^\\circ$), độ dài cạnh $b$ và cạnh $c$ xấp xỉ bằng:",
    options: [
      { text: "$b \\approx 13,29$ và $c \\approx 12,82$", correct: true },
      { text: "$b \\approx 15,20$ và $c \\approx 11,40$", correct: false },
      { text: "$b \\approx 9,50$ và $c \\approx 8,70$", correct: false },
      { text: "$b \\approx 14,14$ và $c \\approx 10,00$", correct: false }
    ],
    explanation: "Ta có: $\\widehat{C} = 180^\\circ - (45^\\circ + 70^\\circ) = 65^\\circ$.<br>Theo định lí sin:<br>• $b = 2R \\sin B = 10\\sqrt{2} \\sin 70^\\circ \\approx 14,142 \\times 0,9397 \\approx 13,29$<br>• $c = 2R \\sin C = 10\\sqrt{2} \\sin 65^\\circ \\approx 14,142 \\times 0,9063 \\approx 12,82$"
  },
  {
    id: 5,
    title: "Bài 3.7 (SGK Trang 42) - Giải Tam Giác & Tính Diện Tích",
    pts: 20,
    question: "Cho tam giác $ABC$ có $\\widehat{A} = 15^\\circ, \\widehat{B} = 130^\\circ$ và $c = 6$. Diện tích $S$ của tam giác xấp xỉ bằng:",
    options: [
      { text: "$S \\approx 6,23$", correct: true },
      { text: "$S \\approx 12,46$", correct: false },
      { text: "$S \\approx 8,50$", correct: false },
      { text: "$S \\approx 4,15$", correct: false }
    ],
    explanation: "Ta có góc $\\widehat{C} = 180^\\circ - (15^\\circ + 130^\\circ) = 35^\\circ$.<br>Áp dụng công thức diện tích tam giác theo 1 cạnh và 3 góc:<br>$$S = \\frac{c^2 \\sin A \\sin B}{2\\sin C} = \\frac{6^2 \\cdot \\sin 15^\\circ \\cdot \\sin 130^\\circ}{2 \\cdot \\sin 35^\\circ} = \\frac{36 \\cdot 0,2588 \\cdot 0,7660}{2 \\cdot 0,5736} \\approx 6,23$$"
  },
  {
    id: 6,
    title: "Bài 3.8 (SGK Trang 42) - Hải Trình Tàu Đánh Cá & Định Lí Côsin",
    pts: 20,
    question: "Một tàu cá từ cảng $A$ đi hướng $\\text{S}70^\\circ\\text{E}$ vận tốc $70$ km/h trong $90$ phút ($AB = 105$ km). Máy hỏng, tàu trôi về hướng nam với vận tốc $8$ km/h trong $2$ giờ ($BC = 16$ km). Khoảng cách từ cảng $A$ đến đảo nơi tàu neo đậu ($AC$) xấp xỉ bằng:",
    options: [
      { text: "$AC \\approx 111,49$ km", correct: true },
      { text: "$AC \\approx 121,00$ km", correct: false },
      { text: "$AC \\approx 95,80$ km", correct: false },
      { text: "$AC \\approx 106,25$ km", correct: false }
    ],
    explanation: "Đoạn 1: $AB = 70 \\times 1,5 = 105$ km.<br>Đoạn 2: $BC = 8 \\times 2 = 16$ km.<br>Góc giữa hướng đi $\\text{S}70^\\circ\\text{E}$ và hướng nam là $70^\\circ$. Vì tàu tiếp tục trôi xuôi về nam nên góc trong $\\widehat{ABC} = 180^\\circ - 70^\\circ = 110^\\circ$.<br>Áp dụng định lí côsin trong $\\triangle ABC$:<br>$$AC^2 = AB^2 + BC^2 - 2AB \\cdot BC \\cos 110^\\circ = 105^2 + 16^2 - 2(105)(16)\\cos 110^\\circ$$<br>$$AC^2 = 11025 + 256 - 3360(-0,34202) = 11281 + 1149,19 = 12430,19 \\implies AC \\approx 111,49 \\text{ km}$$"
  },
  {
    id: 7,
    title: "Bài 3.9 (SGK Trang 43) - Chiều Cao Tòa Nhà Đặt Cột Ăng-ten",
    pts: 20,
    question: "Cột ăng-ten $BC = 5$ m đặt trên nóc tòa nhà. Từ điểm ngắm $A$ cao $7$ m so với mặt đất, nhìn đỉnh $B$ góc $50^\\circ$, nhìn chân $C$ góc $40^\\circ$ so với phương ngang. Chiều cao của tòa nhà xấp xỉ bằng:",
    options: [
      { text: "$18,9$ m", correct: true },
      { text: "$23,9$ m", correct: false },
      { text: "$15,5$ m", correct: false },
      { text: "$11,9$ m", correct: false }
    ],
    explanation: "Gọi $d$ là khoảng cách nằm ngang từ $A$ đến tòa nhà.<br>Chiều cao đỉnh $B$ so với mức $A$ là $d \\tan 50^\\circ$; chân $C$ là $d \\tan 40^\\circ$.<br>Chiều dài cột ăng-ten: $BC = d(\\tan 50^\\circ - \\tan 40^\\circ) = 5$ m.<br>Suy ra: $d = \\frac{5}{\\tan 50^\\circ - \\tan 40^\\circ} = \\frac{5}{1,1918 - 0,8391} \\approx 14,18$ m.<br>Khoảng cách từ nóc nhà đến mức ngang của $A$: $h_1 = d \\tan 40^\\circ \\approx 14,18 \\times 0,8391 \\approx 11,9$ m.<br>Chiều cao cả tòa nhà so với mặt đất: $H = h_1 + 7 = 11,9 + 7 = 18,9$ m."
  },
  {
    id: 8,
    title: "Bài 3.11 (SGK Trang 43) - Thiết Kế Hầm Đường Bộ Xuyên Núi",
    pts: 20,
    question: "Đường vòng tránh núi gồm các đoạn $AB = 8$ km, $BC = 6$ km, $CD = 12$ km với $\\widehat{B} = 105^\\circ, \\widehat{C} = 135^\\circ$ (tổng đường cũ $26$ km). Dự án mở đường hầm thẳng $AD$. Chiều dài đường hầm $AD$ xấp xỉ bằng:",
    options: [
      { text: "$AD \\approx 16,57$ km (giảm khoảng $9,43$ km)", correct: true },
      { text: "$AD \\approx 20,15$ km (giảm khoảng $5,85$ km)", correct: false },
      { text: "$AD \\approx 14,00$ km (giảm khoảng $12,00$ km)", correct: false },
      { text: "$AD \\approx 18,50$ km (giảm khoảng $7,50$ km)", correct: false }
    ],
    explanation: "Trong $\\triangle ABC$: $AC = \\sqrt{8^2 + 6^2 - 2(8)(6)\\cos 105^\\circ} = \\sqrt{100 + 24,85} \\approx 11,17$ km.<br>Theo định lí sin: $\\sin \\widehat{ACB} = \\frac{8 \\sin 105^\\circ}{11,17} \\approx 0,6918 \\implies \\widehat{ACB} \\approx 43,78^\\circ$.<br>Góc $\\widehat{ACD} = 135^\\circ - 43,78^\\circ = 91,22^\\circ$.<br>Trong $\\triangle ACD$ áp dụng định lí côsin:<br>$$AD = \\sqrt{AC^2 + CD^2 - 2 AC \\cdot CD \\cos 91,22^\\circ} = \\sqrt{124,85 + 144 - 2(11,17)(12)(-0,0213)} \\approx 16,57 \\text{ km}$$<br>Quãng đường giảm được: $26 - 16,57 = 9,43$ km."
  },
  {
    id: 9,
    title: "Nhận Biết Công Thức Diện Tích Tam Giác - Mệnh Đề Nào SAI?",
    pts: 20,
    question: "Cho tam giác $ABC$ có nửa chu vi $p$, bán kính ngoại tiếp $R$, bán kính nội tiếp $r$. Đẳng thức nào sau đây là SAI?",
    options: [
      { text: "$S = \\frac{abc}{4r}$", correct: true },
      { text: "$S = \\frac{1}{2}bc \\sin A$", correct: false },
      { text: "$S = \\frac{abc}{4R}$", correct: false },
      { text: "$S = pr$", correct: false }
    ],
    explanation: "Đẳng thức SAI là $S = \\frac{abc}{4r}$. Công thức đúng phải là $S = \\frac{abc}{4R}$ (với $R$ là bán kính đường tròn ngoại tiếp), còn với $r$ là $S = pr$."
  },
  {
    id: 10,
    title: "Ứng Dụng Công Thức Heron Tính Diện Tích Tam Giác Số Nguyên",
    pts: 20,
    question: "Cho tam giác $ABC$ có $a = 7, b = 8, c = 9$. Diện tích $S$ của tam giác bằng:",
    options: [
      { text: "$S = 12\\sqrt{5}$", correct: true },
      { text: "$S = 24\\sqrt{5}$", correct: false },
      { text: "$S = 18\\sqrt{3}$", correct: false },
      { text: "$S = 36$", correct: false }
    ],
    explanation: "Nửa chu vi tam giác: $p = \\frac{7 + 8 + 9}{2} = 12$.<br>Áp dụng công thức Heron:<br>$$S = \\sqrt{p(p-a)(p-b)(p-c)} = \\sqrt{12 \\cdot (12-7) \\cdot (12-8) \\cdot (12-9)} = \\sqrt{12 \\cdot 5 \\cdot 4 \\cdot 3} = \\sqrt{720} = 12\\sqrt{5}$$"
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

// --- 5. PHÒNG THÍ NGHIỆM 1: GIẢI TAM GIÁC ĐỘNG & ĐƯỜNG TRÒN R, r ---
const triCanvas = document.getElementById("triangleCanvas");
const triCtx = triCanvas ? triCanvas.getContext("2d") : null;

const sliderA = document.getElementById("sideA");
const sliderB = document.getElementById("sideB");
const sliderC = document.getElementById("sideC");
const chkCircum = document.getElementById("chkCircum");
const chkIncircle = document.getElementById("chkIncircle");

let side_a = 7;
let side_b = 8;
let side_c = 9;

function drawDynamicTriangle() {
  if (!triCtx) return;
  const w = triCanvas.width;
  const h = triCanvas.height;
  triCtx.clearRect(0, 0, w, h);

  // Kiểm tra bất đẳng thức tam giác
  if (side_a + side_b <= side_c || side_a + side_c <= side_b || side_b + side_c <= side_a) {
    triCtx.fillStyle = "#f43f5e";
    triCtx.font = "bold 14px 'Inter', sans-serif";
    triCtx.textAlign = "center";
    triCtx.fillText("⚠️ 3 cạnh không thỏa mãn bất đẳng thức tam giác!", w / 2, h / 2);
    triCtx.textAlign = "left";
    return;
  }

  // Tính các góc theo định lí côsin
  const cosA = (side_b * side_b + side_c * side_c - side_a * side_a) / (2 * side_b * side_c);
  const cosB = (side_c * side_c + side_a * side_a - side_b * side_b) / (2 * side_c * side_a);
  const cosC = (side_a * side_a + side_b * side_b - side_c * side_c) / (2 * side_a * side_b);

  const angleA_deg = (Math.acos(cosA) * 180) / Math.PI;
  const angleB_deg = (Math.acos(cosB) * 180) / Math.PI;
  const angleC_deg = 180 - angleA_deg - angleB_deg;

  // Diện tích và bán kính
  const p = (side_a + side_b + side_c) / 2;
  const area = Math.sqrt(Math.max(0, p * (p - side_a) * (p - side_b) * (p - side_c)));
  const R = (side_a * side_b * side_c) / (4 * area);
  const r = area / p;
  const h_a = (2 * area) / side_a;

  // Cập nhật text readout
  document.getElementById("angleA").textContent = `${angleA_deg.toFixed(1)}°`;
  document.getElementById("angleB").textContent = `${angleB_deg.toFixed(1)}°`;
  document.getElementById("angleC").textContent = `${angleC_deg.toFixed(1)}°`;
  document.getElementById("semiP").textContent = p.toFixed(1);
  document.getElementById("areaS").textContent = area.toFixed(2);
  document.getElementById("radiusR").textContent = R.toFixed(2);
  document.getElementById("radiusr").textContent = r.toFixed(2);
  document.getElementById("heightHa").textContent = h_a.toFixed(2);

  // Tọa độ vẽ tam giác: đặt cạnh AB nằm ngang
  // B ở gốc (0,0), A ở (c, 0). Đỉnh C ở (b * cosA_from_A, ...)
  // Chọn A(xA, yA), B(xB, yB), C(xC, yC)
  const marginX = 80;
  const baseY = h - 60;
  const scale = 22; // px per unit

  // Đặt B ở trái, C ở phải: BC = a
  const B = { x: marginX + 30, y: baseY };
  const C_pt = { x: B.x + side_a * scale, y: baseY };

  // Đỉnh A: khoảng cách BA = c, khoảng cách CA = b
  // cosB = (a^2 + c^2 - b^2)/(2ac)
  const Ax = B.x + side_c * Math.cos((angleB_deg * Math.PI) / 180) * scale;
  const Ay = B.y - side_c * Math.sin((angleB_deg * Math.PI) / 180) * scale;
  const A = { x: Ax, y: Ay };

  // Dịch tâm để vẽ cân đối giữa canvas
  const minX = Math.min(A.x, B.x, C_pt.x);
  const maxX = Math.max(A.x, B.x, C_pt.x);
  const offsetX = (w - (maxX - minX)) / 2 - minX;
  A.x += offsetX;
  B.x += offsetX;
  C_pt.x += offsetX;

  // 1. Vẽ đường tròn ngoại tiếp (nếu chọn)
  if (chkCircum && chkCircum.checked) {
    // Tọa độ tâm O ngoại tiếp
    // Dùng công thức trọng số sin2A, sin2B, sin2C
    const sin2A = Math.sin((2 * angleA_deg * Math.PI) / 180);
    const sin2B = Math.sin((2 * angleB_deg * Math.PI) / 180);
    const sin2C = Math.sin((2 * angleC_deg * Math.PI) / 180);
    const sumSin2 = sin2A + sin2B + sin2C;
    if (Math.abs(sumSin2) > 0.001) {
      const Ox = (A.x * sin2A + B.x * sin2B + C_pt.x * sin2C) / sumSin2;
      const Oy = (A.y * sin2A + B.y * sin2B + C_pt.y * sin2C) / sumSin2;

      triCtx.beginPath();
      triCtx.arc(Ox, Oy, R * scale, 0, 2 * Math.PI);
      triCtx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      triCtx.lineWidth = 1.5;
      triCtx.stroke();

      // Tâm O
      triCtx.beginPath();
      triCtx.arc(Ox, Oy, 3.5, 0, 2 * Math.PI);
      triCtx.fillStyle = "#38bdf8";
      triCtx.fill();
      triCtx.font = "11px 'Inter', sans-serif";
      triCtx.fillText("O", Ox + 6, Oy - 4);
    }
  }

  // 2. Vẽ đường tròn nội tiếp (nếu chọn)
  if (chkIncircle && chkIncircle.checked) {
    // Tâm I nội tiếp: (a*A + b*B + c*C)/(a+b+c)
    const Ix = (side_a * A.x + side_b * B.x + side_c * C_pt.x) / (2 * p);
    const Iy = (side_a * A.y + side_b * B.y + side_c * C_pt.y) / (2 * p);

    triCtx.beginPath();
    triCtx.arc(Ix, Iy, r * scale, 0, 2 * Math.PI);
    triCtx.strokeStyle = "rgba(16, 185, 129, 0.5)";
    triCtx.lineWidth = 1.5;
    triCtx.stroke();

    // Tâm I
    triCtx.beginPath();
    triCtx.arc(Ix, Iy, 3.5, 0, 2 * Math.PI);
    triCtx.fillStyle = "#10b981";
    triCtx.fill();
    triCtx.font = "11px 'Inter', sans-serif";
    triCtx.fillText("I", Ix + 6, Iy - 4);
  }

  // 3. Tô màu miền trong tam giác
  triCtx.beginPath();
  triCtx.moveTo(A.x, A.y);
  triCtx.lineTo(B.x, B.y);
  triCtx.lineTo(C_pt.x, C_pt.y);
  triCtx.closePath();
  triCtx.fillStyle = "rgba(99, 102, 241, 0.15)";
  triCtx.fill();

  // 4. Các cạnh tam giác
  triCtx.strokeStyle = "rgba(99, 102, 241, 0.9)";
  triCtx.lineWidth = 2.5;
  triCtx.stroke();

  // 5. Đỉnh và nhãn đỉnh
  const vertices = [
    { pt: A, label: "A", color: "#38bdf8", offX: -6, offY: -12 },
    { pt: B, label: "B", color: "#818cf8", offX: -18, offY: 16 },
    { pt: C_pt, label: "C", color: "#f59e0b", offX: 10, offY: 16 }
  ];

  vertices.forEach(v => {
    triCtx.beginPath();
    triCtx.arc(v.pt.x, v.pt.y, 5, 0, 2 * Math.PI);
    triCtx.fillStyle = v.color;
    triCtx.fill();
    triCtx.strokeStyle = "#fff";
    triCtx.lineWidth = 1.5;
    triCtx.stroke();

    triCtx.font = "bold 14px 'Inter', sans-serif";
    triCtx.fillStyle = "#fff";
    triCtx.fillText(v.label, v.pt.x + v.offX, v.pt.y + v.offY);
  });

  // Nhãn độ dài cạnh
  triCtx.font = "11px 'Inter', sans-serif";
  triCtx.fillStyle = "#94a3b8";
  triCtx.fillText(`a = ${side_a}`, (B.x + C_pt.x) / 2 - 15, B.y + 20);
  triCtx.fillText(`b = ${side_b}`, (A.x + C_pt.x) / 2 + 10, (A.y + C_pt.y) / 2);
  triCtx.fillText(`c = ${side_c}`, (A.x + B.x) / 2 - 35, (A.y + B.y) / 2);

  checkUnlockBadge("cosine");
  if (chkCircum && chkCircum.checked) {
    checkUnlockBadge("sine");
  }
}

if (sliderA) {
  sliderA.addEventListener("input", (e) => {
    side_a = parseFloat(e.target.value);
    document.getElementById("sideAVal").textContent = side_a;
    drawDynamicTriangle();
  });
}
if (sliderB) {
  sliderB.addEventListener("input", (e) => {
    side_b = parseFloat(e.target.value);
    document.getElementById("sideBVal").textContent = side_b;
    drawDynamicTriangle();
  });
}
if (sliderC) {
  sliderC.addEventListener("input", (e) => {
    side_c = parseFloat(e.target.value);
    document.getElementById("sideCVal").textContent = side_c;
    drawDynamicTriangle();
  });
}
if (chkCircum) chkCircum.addEventListener("change", drawDynamicTriangle);
if (chkIncircle) chkIncircle.addEventListener("change", drawDynamicTriangle);

// --- 6. PHÒNG THÍ NGHIỆM 2: TRẮC ĐỊA THÁP RÙA (VÍ DỤ 4 SGK TRANG 40) ---
const surveyCanvas = document.getElementById("surveyCanvas");
const surveyCtx = surveyCanvas ? surveyCanvas.getContext("2d") : null;

const sliderBase = document.getElementById("baseDist");
const sliderSightA = document.getElementById("sightAngleA");
const sliderSightB = document.getElementById("sightAngleB");

let baseAB = 40; // mét
let angleSightA = 65; // độ
let angleSightB = 55; // độ

function drawSurveyLab() {
  if (!surveyCtx) return;
  const w = surveyCanvas.width;
  const h = surveyCanvas.height;
  surveyCtx.clearRect(0, 0, w, h);

  // Nước hồ Hoàn Kiếm
  surveyCtx.fillStyle = "rgba(14, 116, 144, 0.25)";
  surveyCtx.fillRect(10, 20, w - 20, h - 85);

  // Bờ hồ (đường nằm ngang đáy)
  const bankY = h - 65;
  surveyCtx.strokeStyle = "#475569";
  surveyCtx.lineWidth = 3;
  surveyCtx.beginPath();
  surveyCtx.moveTo(10, bankY);
  surveyCtx.lineTo(w - 10, bankY);
  surveyCtx.stroke();

  surveyCtx.fillStyle = "#64748b";
  surveyCtx.font = "11px 'Inter', sans-serif";
  surveyCtx.fillText("Bờ hồ Hoàn Kiếm", 20, bankY + 22);

  // Góc C và các cạnh theo định lí sin
  const angleC_deg = 180 - angleSightA - angleSightB;
  const radA = (angleSightA * Math.PI) / 180;
  const radB = (angleSightB * Math.PI) / 180;
  const radC = (angleC_deg * Math.PI) / 180;

  let dist_AC = 0;
  let dist_BC = 0;
  let dist_Perp = 0;

  if (angleC_deg > 0) {
    dist_AC = (baseAB * Math.sin(radB)) / Math.sin(radC);
    dist_BC = (baseAB * Math.sin(radA)) / Math.sin(radC);
    dist_Perp = dist_AC * Math.sin(radA);
  }

  // Tọa độ trên canvas
  const Ax = 80;
  const Ay = bankY;
  const scale = 2.8;
  const Bx = Ax + baseAB * scale;
  const By = bankY;

  // Tháp C: tọa độ
  const Cx = Ax + dist_AC * Math.cos(radA) * scale;
  const Cy = Ay - dist_AC * Math.sin(radA) * scale;

  // Tia ngắm AC và BC
  surveyCtx.strokeStyle = "rgba(245, 158, 11, 0.8)";
  surveyCtx.lineWidth = 2;
  surveyCtx.beginPath();
  surveyCtx.moveTo(Ax, Ay);
  surveyCtx.lineTo(Cx, Cy);
  surveyCtx.stroke();

  surveyCtx.strokeStyle = "rgba(244, 63, 94, 0.8)";
  surveyCtx.beginPath();
  surveyCtx.moveTo(Bx, By);
  surveyCtx.lineTo(Cx, Cy);
  surveyCtx.stroke();

  // Đoạn bờ AB
  surveyCtx.strokeStyle = "rgba(56, 189, 248, 0.9)";
  surveyCtx.lineWidth = 3.5;
  surveyCtx.beginPath();
  surveyCtx.moveTo(Ax, Ay);
  surveyCtx.lineTo(Bx, By);
  surveyCtx.stroke();

  // Cọc tiêu A
  surveyCtx.beginPath();
  surveyCtx.arc(Ax, Ay, 6, 0, 2 * Math.PI);
  surveyCtx.fillStyle = "#38bdf8";
  surveyCtx.fill();
  surveyCtx.strokeStyle = "#fff";
  surveyCtx.stroke();
  surveyCtx.font = "bold 13px 'Inter', sans-serif";
  surveyCtx.fillStyle = "#fff";
  surveyCtx.fillText("A (Cọc tiêu A)", Ax - 25, Ay + 20);

  // Cọc tiêu B
  surveyCtx.beginPath();
  surveyCtx.arc(Bx, By, 6, 0, 2 * Math.PI);
  surveyCtx.fillStyle = "#38bdf8";
  surveyCtx.fill();
  surveyCtx.strokeStyle = "#fff";
  surveyCtx.stroke();
  surveyCtx.fillText("B (Cọc tiêu B)", Bx - 20, By + 20);

  // Biểu tượng Tháp Rùa C (Gò đất nhỏ & tháp)
  surveyCtx.beginPath();
  surveyCtx.ellipse(Cx, Cy + 8, 28, 12, 0, 0, 2 * Math.PI);
  surveyCtx.fillStyle = "#15803d";
  surveyCtx.fill();

  surveyCtx.fillStyle = "#fef08a";
  surveyCtx.fillRect(Cx - 10, Cy - 16, 20, 20);
  surveyCtx.fillStyle = "#dc2626";
  surveyCtx.beginPath();
  surveyCtx.moveTo(Cx - 14, Cy - 16);
  surveyCtx.lineTo(Cx, Cy - 26);
  surveyCtx.lineTo(Cx + 14, Cy - 16);
  surveyCtx.fill();

  surveyCtx.font = "bold 13px 'Inter', sans-serif";
  surveyCtx.fillStyle = "#fef08a";
  surveyCtx.fillText("C (Tháp Rùa)", Cx - 35, Cy - 32);

  // Nhãn thông số
  document.getElementById("angleC_survey").textContent = `${angleC_deg.toFixed(1)}°`;
  document.getElementById("distAC").textContent = `${dist_AC.toFixed(1)} m`;
  document.getElementById("distBC").textContent = `${dist_BC.toFixed(1)} m`;
  document.getElementById("distPerp").textContent = `${dist_Perp.toFixed(1)} m`;

  checkUnlockBadge("survey");
}

if (sliderBase) {
  sliderBase.addEventListener("input", (e) => {
    baseAB = parseFloat(e.target.value);
    document.getElementById("baseDistVal").textContent = `${baseAB} m`;
    drawSurveyLab();
  });
}
if (sliderSightA) {
  sliderSightA.addEventListener("input", (e) => {
    angleSightA = parseFloat(e.target.value);
    document.getElementById("sightAngleAVal").textContent = `${angleSightA}°`;
    drawSurveyLab();
  });
}
if (sliderSightB) {
  sliderSightB.addEventListener("input", (e) => {
    angleSightB = parseFloat(e.target.value);
    document.getElementById("sightAngleBVal").textContent = `${angleSightB}°`;
    drawSurveyLab();
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
          drawDynamicTriangle();
          drawSurveyLab();
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
  if (confirm("Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình học tập của Bài 6?")) {
    sound.playClick();
    localStorage.removeItem(STORAGE_KEY);
    appState = { ...defaultState };
    saveState();
    updateHUD();
    renderQuiz();
    drawDynamicTriangle();
    drawSurveyLab();
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
  drawDynamicTriangle();
  drawSurveyLab();

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
