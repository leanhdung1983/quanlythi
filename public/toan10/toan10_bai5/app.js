/* ================================================================
   BÀI 5: GIÁ TRỊ LƯỢNG GIÁC CỦA MỘT GÓC TỪ 0° ĐẾN 180° - TOÁN 10
   Bộ sách: Kết Nối Tri Thức Với Cuộc Sống (Trang 33 - 37)
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
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
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
const STORAGE_KEY = "toan10_bai5_state";

const defaultState = {
  avatar: "👑",
  userName: "Chiến Binh Logic",
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: {
    circle: false,
    symmetry: false,
    ferris: false,
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
  let title = "Tập Sự Lượng Giác";
  if (appState.xp >= 200) {
    stars = "⭐⭐⭐⭐⭐";
    title = "Đại Kiện Tướng Lượng Giác Toàn Năng";
  } else if (appState.xp >= 150) {
    stars = "⭐⭐⭐⭐☆";
    title = "Cao Thủ Lượng Giác K10";
  } else if (appState.xp >= 100) {
    stars = "⭐⭐⭐☆☆";
    title = "Chuyên Viên Nửa Đường Tròn Đơn Vị";
  } else if (appState.xp >= 50) {
    stars = "⭐⭐☆☆☆";
    title = "Chiến Binh Lượng Giác Năng Động";
  }
  document.getElementById("starRating").textContent = stars;
  document.getElementById("userTitle").textContent = title;
  document.getElementById("certHonorsTitle").textContent = `${title.toUpperCase()} 🏅`;

  // Badges update
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
    circle: "badge-circle",
    symmetry: "badge-symmetry",
    ferris: "badge-ferris",
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

  // Check master
  if (appState.badges.circle && appState.badges.symmetry && appState.badges.ferris && appState.badges.arena) {
    if (!appState.badges.master) {
      checkUnlockBadge("master");
    }
  }
}

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG SGK (10 CÂU BÀI 3.1 - 3.4 & ĐU QUAY) ---
const quizData = [
  {
    id: 1,
    title: "Bài 3.1a (SGK Trang 37) - Tính Giá Trị Biểu Thức Tích",
    pts: 20,
    question: "Không dùng máy tính cầm tay, tính giá trị biểu thức: $A = (2\\sin 30^\\circ + \\cos 135^\\circ - 3\\tan 150^\\circ) \\cdot (\\cos 180^\\circ - \\cot 60^\\circ)$.",
    options: [
      { text: "$A = \\left(1 - \\frac{\\sqrt{2}}{2} + \\sqrt{3}\\right) \\left(-1 - \\frac{\\sqrt{3}}{3}\\right)$", correct: true },
      { text: "$A = \\left(1 + \\frac{\\sqrt{2}}{2} - \\sqrt{3}\\right) \\left(1 - \\frac{\\sqrt{3}}{3}\\right)$", correct: false },
      { text: "$A = \\left(\\frac{1}{2} - \\frac{\\sqrt{2}}{2} + 3\\sqrt{3}\\right) (-1 - \\sqrt{3})$", correct: false },
      { text: "$A = 0$", correct: false }
    ],
    explanation: "Áp dụng bảng giá trị lượng giác các góc đặc biệt:<br>• $2\\sin 30^\\circ = 2 \\cdot \\frac{1}{2} = 1$<br>• $\\cos 135^\\circ = -\\cos 45^\\circ = -\\frac{\\sqrt{2}}{2}$<br>• $-3\\tan 150^\\circ = -3 \\cdot \\left(-\\frac{\\sqrt{3}}{3}\\right) = \\sqrt{3}$<br>Do đó ngoặc thứ nhất bằng $1 - \\frac{\\sqrt{2}}{2} + \\sqrt{3}$.<br>Ngoặc thứ hai: $\\cos 180^\\circ - \\cot 60^\\circ = -1 - \\frac{\\sqrt{3}}{3}$. Tích hai ngoặc cho kết quả chính xác."
  },
  {
    id: 2,
    title: "Bài 3.1b (SGK Trang 37) - Tính Biểu Thức Lũy Thừa Bậc Hai",
    pts: 20,
    question: "Tính giá trị biểu thức: $B = \\sin^2 90^\\circ + \\cos^2 120^\\circ + \\cos^2 0^\\circ - \\tan^2 60^\\circ + \\cot^2 135^\\circ$.",
    options: [
      { text: "$B = \\frac{1}{4}$", correct: true },
      { text: "$B = \\frac{5}{4}$", correct: false },
      { text: "$B = -\\frac{3}{4}$", correct: false },
      { text: "$B = 1$", correct: false }
    ],
    explanation: "Ta có từng thành phần:<br>• $\\sin^2 90^\\circ = 1^2 = 1$<br>• $\\cos^2 120^\\circ = (-\\cos 60^\\circ)^2 = \\left(-\\frac{1}{2}\\right)^2 = \\frac{1}{4}$<br>• $\\cos^2 0^\\circ = 1^2 = 1$<br>• $\\tan^2 60^\\circ = (\\sqrt{3})^2 = 3$<br>• $\\cot^2 135^\\circ = (-\\cot 45^\\circ)^2 = (-1)^2 = 1$<br>Suy ra: $B = 1 + \\frac{1}{4} + 1 - 3 + 1 = \\frac{1}{4}$."
  },
  {
    id: 3,
    title: "Bài 3.1c (SGK Trang 37) - Tính Giá Trị Biểu Thức",
    pts: 20,
    question: "Tính giá trị của biểu thức: $C = \\cos 60^\\circ \\cdot \\sin 30^\\circ + \\cos^2 30^\\circ$.",
    options: [
      { text: "$C = 1$", correct: true },
      { text: "$C = \\frac{1}{2}$", correct: false },
      { text: "$C = \\frac{3}{4}$", correct: false },
      { text: "$C = \\frac{\\sqrt{3}}{2}$", correct: false }
    ],
    explanation: "Cách 1 (Bảng giá trị): $C = \\frac{1}{2} \\cdot \\frac{1}{2} + \\left(\\frac{\\sqrt{3}}{2}\\right)^2 = \\frac{1}{4} + \\frac{3}{4} = 1$.<br>Cách 2 (Góc phụ nhau): Vì $60^\\circ$ và $30^\\circ$ phụ nhau nên $\\cos 60^\\circ = \\sin 30^\\circ$. Do đó $C = \\sin^2 30^\\circ + \\cos^2 30^\\circ = 1$ theo hệ thức lượng giác cơ bản!"
  },
  {
    id: 4,
    title: "Bài 3.2a (SGK Trang 37) - Đơn Giản Biểu Thức Lượng Giác",
    pts: 20,
    question: "Đơn giản biểu thức sau: $M = \\sin 100^\\circ + \\sin 80^\\circ + \\cos 16^\\circ + \\cos 164^\\circ$.",
    options: [
      { text: "$M = 2\\sin 80^\\circ$", correct: true },
      { text: "$M = 0$", correct: false },
      { text: "$M = 2\\cos 16^\\circ$", correct: false },
      { text: "$M = 2\\sin 100^\\circ + 2\\cos 16^\\circ$", correct: false }
    ],
    explanation: "Sử dụng tính chất hai góc bù nhau ($180^\\circ - \\alpha$):<br>• $\\sin 100^\\circ = \\sin(180^\\circ - 80^\\circ) = \\sin 80^\\circ$<br>• $\\cos 164^\\circ = \\cos(180^\\circ - 16^\\circ) = -\\cos 16^\\circ$<br>Thay vào: $M = \\sin 80^\\circ + \\sin 80^\\circ + \\cos 16^\\circ + (-\\cos 16^\\circ) = 2\\sin 80^\\circ$."
  },
  {
    id: 5,
    title: "Bài 3.2b (SGK Trang 37) - Rút Gọn Góc Bù",
    pts: 20,
    question: "Đơn giản biểu thức: $N = 2\\sin(180^\\circ - \\alpha) \\cot \\alpha - \\cos(180^\\circ - \\alpha) \\tan \\alpha \\cot(180^\\circ - \\alpha)$ với $0^\\circ < \\alpha < 90^\\circ$.",
    options: [
      { text: "$N = \\cos \\alpha$", correct: true },
      { text: "$N = 3\\cos \\alpha$", correct: false },
      { text: "$N = -\\cos \\alpha$", correct: false },
      { text: "$N = \\sin \\alpha$", correct: false }
    ],
    explanation: "Áp dụng công thức góc bù:<br>• $\\sin(180^\\circ - \\alpha) = \\sin \\alpha$<br>• $\\cos(180^\\circ - \\alpha) = -\\cos \\alpha$<br>• $\\cot(180^\\circ - \\alpha) = -\\cot \\alpha$<br>Khi đó:<br>$N = 2\\sin \\alpha \\cdot \\frac{\\cos \\alpha}{\\sin \\alpha} - (-\\cos \\alpha) \\cdot \\tan \\alpha \\cdot (-\\cot \\alpha)$<br>$N = 2\\cos \\alpha - \\cos \\alpha \\cdot (\\tan \\alpha \\cot \\alpha) = 2\\cos \\alpha - \\cos \\alpha \\cdot 1 = \\cos \\alpha$."
  },
  {
    id: 6,
    title: "Bài 3.4 (SGK Trang 37) - Tính Biểu Thức Thuần Nhất Khi Biết Tang",
    pts: 20,
    question: "Cho góc $\\alpha$ ($0^\\circ < \\alpha < 180^\\circ$) thoả mãn $\\tan \\alpha = 3$. Tính giá trị của biểu thức: $P = \\frac{2\\sin \\alpha - 3\\cos \\alpha}{3\\sin \\alpha + 2\\cos \\alpha}$.",
    options: [
      { text: "$P = \\frac{3}{11}$", correct: true },
      { text: "$P = \\frac{9}{11}$", correct: false },
      { text: "$P = \\frac{1}{3}$", correct: false },
      { text: "$P = -\\frac{3}{11}$", correct: false }
    ],
    explanation: "Vì $\\tan \\alpha = 3$ xác định nên $\\cos \\alpha \\ne 0$. Chia cả tử và mẫu của $P$ cho $\\cos \\alpha$:<br>$$P = \\frac{2\\frac{\\sin \\alpha}{\\cos \\alpha} - 3}{3\\frac{\\sin \\alpha}{\\cos \\alpha} + 2} = \\frac{2\\tan \\alpha - 3}{3\\tan \\alpha + 2} = \\frac{2(3) - 3}{3(3) + 2} = \\frac{6 - 3}{9 + 2} = \\frac{3}{11}$$"
  },
  {
    id: 7,
    title: "Bài 3.3 (SGK Trang 37) - Tìm Cosin Khi Biết Sin Góc Tù",
    pts: 20,
    question: "Cho góc tù $\\alpha$ ($90^\\circ < \\alpha < 180^\\circ$) thoả mãn $\\sin \\alpha = \\frac{3}{5}$. Giá trị của $\\cos \\alpha$ bằng bao nhiêu?",
    options: [
      { text: "$\\cos \\alpha = -\\frac{4}{5}$", correct: true },
      { text: "$\\cos \\alpha = \\frac{4}{5}$", correct: false },
      { text: "$\\cos \\alpha = -\\frac{16}{25}$", correct: false },
      { text: "$\\cos \\alpha = -\\frac{2}{5}$", correct: false }
    ],
    explanation: "Từ hệ thức $\\sin^2 \\alpha + \\cos^2 \\alpha = 1$, ta có $\\cos^2 \\alpha = 1 - \\sin^2 \\alpha = 1 - \\left(\\frac{3}{5}\\right)^2 = \\frac{16}{25}$.<br>Vì $\\alpha$ là góc tù ($90^\\circ < \\alpha < 180^\\circ$) nên điểm $M$ có hoành độ âm, do đó $\\cos \\alpha < 0$.<br>Vậy $\\cos \\alpha = -\\sqrt{\\frac{16}{25}} = -\\frac{4}{5}$."
  },
  {
    id: 8,
    title: "Vận Dụng (SGK Trang 37) - Chiếc Đu Quay Bán Kính 75m",
    pts: 20,
    question: "Một chiếc đu quay có bán kính $75$ m, tâm vòng quay ở độ cao $90$ m, thời gian quay 1 vòng là $30$ phút. Người vào cabin ở vị trí thấp nhất. Sau $20$ phút quay, người đó ở độ cao bao nhiêu mét?",
    options: [
      { text: "$127,5$ m", correct: true },
      { text: "$90$ m", correct: false },
      { text: "$165$ m", correct: false },
      { text: "$105$ m", correct: false }
    ],
    explanation: "Tốc độ góc của đu quay: $\\omega = \\frac{360^\\circ}{30} = 12^\\circ$/phút.<br>Sau $20$ phút, góc quét là $\\theta = 20 \\times 12^\\circ = 240^\\circ$.<br>Độ cao của cabin so với mặt đất được mô tả bởi:<br>$h(t) = 90 - 75 \\cdot \\cos(\\theta) = 90 - 75 \\cdot \\cos 240^\\circ$.<br>Vì $\\cos 240^\\circ = -\\cos 60^\\circ = -0,5$, nên:<br>$h = 90 - 75 \\times (-0,5) = 90 + 37,5 = 127,5$ mét."
  },
  {
    id: 9,
    title: "Mối Liên Hệ Góc Bù - Khẳng Định Nào Sau Đây SAI?",
    pts: 20,
    question: "Với mọi góc $\\alpha$ thoả mãn $0^\\circ < \\alpha < 90^\\circ$, khẳng định nào sau đây là SAI?",
    options: [
      { text: "$\\cos(180^\\circ - \\alpha) = \\cos \\alpha$", correct: true },
      { text: "$\\sin(180^\\circ - \\alpha) = \\sin \\alpha$", correct: false },
      { text: "$\\tan(180^\\circ - \\alpha) = -\\tan \\alpha$", correct: false },
      { text: "$\\cot(180^\\circ - \\alpha) = -\\cot \\alpha$", correct: false }
    ],
    explanation: "Khẳng định SAI là: $\\cos(180^\\circ - \\alpha) = \\cos \\alpha$.<br>Đúng phải là $\\cos(180^\\circ - \\alpha) = -\\cos \\alpha$ vì hoành độ của hai điểm đối xứng qua trục $Oy$ là hai số đối nhau!"
  },
  {
    id: 10,
    title: "Rút Gọn Biểu Thức Lượng Giác Bậc Hai",
    pts: 20,
    question: "Rút gọn biểu thức $E = (1 - \\cos \\alpha)(1 + \\cos \\alpha) \\cdot (1 + \\cot^2 \\alpha)$ với $0^\\circ < \\alpha < 180^\\circ, \\alpha \\ne 90^\\circ$.",
    options: [
      { text: "$E = 1$", correct: true },
      { text: "$E = \\sin^2 \\alpha$", correct: false },
      { text: "$E = \\cos^2 \\alpha$", correct: false },
      { text: "$E = 1 + \\tan^2 \\alpha$", correct: false }
    ],
    explanation: "Ta có: $(1 - \\cos \\alpha)(1 + \\cos \\alpha) = 1 - \\cos^2 \\alpha = \\sin^2 \\alpha$.<br>Lại có hệ thức cơ bản: $1 + \\cot^2 \\alpha = \\frac{1}{\\sin^2 \\alpha}$.<br>Suy ra: $E = \\sin^2 \\alpha \\cdot \\frac{1}{\\sin^2 \\alpha} = 1$."
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

  // Gắn sự kiện click
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

  // Check arena badge (160+ XP)
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

// --- 5. PHÒNG THÍ NGHIỆM 1: NỬA ĐƯỜNG TRÒN ĐƠN VỊ TƯƠNG TÁC ---
const circleCanvas = document.getElementById("semicircleCanvas");
const circleCtx = circleCanvas ? circleCanvas.getContext("2d") : null;
const angleSlider = document.getElementById("angleSlider");
const angleVal = document.getElementById("angleVal");
const chkSupplementary = document.getElementById("chkShowSupplementary");

let currentAngle = 60;

function drawUnitSemicircle() {
  if (!circleCtx) return;
  const w = circleCanvas.width;
  const h = circleCanvas.height;
  circleCtx.clearRect(0, 0, w, h);

  const ox = w / 2;
  const oy = h - 45;
  const radius = 170;

  // Trục tọa độ Oxy
  circleCtx.strokeStyle = "rgba(255, 255, 255, 0.25)";
  circleCtx.lineWidth = 1.5;

  // Trục Ox
  circleCtx.beginPath();
  circleCtx.moveTo(25, oy);
  circleCtx.lineTo(w - 25, oy);
  circleCtx.stroke();

  // Mũi tên Ox
  circleCtx.fillStyle = "rgba(255, 255, 255, 0.4)";
  circleCtx.beginPath();
  circleCtx.moveTo(w - 25, oy - 4);
  circleCtx.lineTo(w - 17, oy);
  circleCtx.lineTo(w - 25, oy + 4);
  circleCtx.fill();

  // Trục Oy
  circleCtx.beginPath();
  circleCtx.moveTo(ox, oy + 20);
  circleCtx.lineTo(ox, 25);
  circleCtx.stroke();

  // Mũi tên Oy
  circleCtx.beginPath();
  circleCtx.moveTo(ox - 4, 25);
  circleCtx.lineTo(ox, 17);
  circleCtx.lineTo(ox + 4, 25);
  circleCtx.fill();

  // Nhãn trục & gốc tọa độ
  circleCtx.font = "12px 'Inter', sans-serif";
  circleCtx.fillStyle = "#94a3b8";
  circleCtx.fillText("O", ox - 14, oy + 16);
  circleCtx.fillText("x", w - 20, oy - 8);
  circleCtx.fillText("y", ox + 8, 24);

  // Mốc -1, 1 trên Ox và 1 trên Oy
  circleCtx.fillText("-1", ox - radius - 14, oy + 16);
  circleCtx.fillText("1", ox + radius + 4, oy + 16);
  circleCtx.fillText("1", ox + 8, oy - radius - 4);

  // Vẽ nửa đường tròn đơn vị (y >= 0)
  circleCtx.beginPath();
  circleCtx.arc(ox, oy, radius, Math.PI, 0, false);
  circleCtx.strokeStyle = "rgba(99, 102, 241, 0.8)";
  circleCtx.lineWidth = 2.5;
  circleCtx.stroke();

  // Tính tọa độ điểm M(x0, y0)
  const rad = (currentAngle * Math.PI) / 180;
  const cosVal = Math.cos(rad);
  const sinVal = Math.sin(rad);

  const mx = ox + cosVal * radius;
  const my = oy - sinVal * radius;

  // Điểm đối xứng góc bù M'
  const showSupp = chkSupplementary && chkSupplementary.checked;
  const suppRad = ((180 - currentAngle) * Math.PI) / 180;
  const suppCos = Math.cos(suppRad);
  const suppSin = Math.sin(suppRad);
  const mpx = ox + suppCos * radius;
  const mpy = oy - suppSin * radius;

  // Cung góc alpha
  circleCtx.beginPath();
  circleCtx.arc(ox, oy, 35, 0, -rad, true);
  circleCtx.strokeStyle = "rgba(56, 189, 248, 0.8)";
  circleCtx.lineWidth = 2;
  circleCtx.stroke();

  // Bán kính OM
  circleCtx.beginPath();
  circleCtx.moveTo(ox, oy);
  circleCtx.lineTo(mx, my);
  circleCtx.strokeStyle = "rgba(56, 189, 248, 0.9)";
  circleCtx.lineWidth = 2.5;
  circleCtx.stroke();

  // Hình chiếu hạ xuống Ox và Oy
  circleCtx.setLineDash([4, 4]);
  circleCtx.strokeStyle = "rgba(255, 255, 255, 0.4)";
  circleCtx.lineWidth = 1;

  // Chiếu xuống Ox
  circleCtx.beginPath();
  circleCtx.moveTo(mx, my);
  circleCtx.lineTo(mx, oy);
  circleCtx.stroke();

  // Chiếu sang Oy
  circleCtx.beginPath();
  circleCtx.moveTo(mx, my);
  circleCtx.lineTo(ox, my);
  circleCtx.stroke();
  circleCtx.setLineDash([]);

  // Đoạn hoành độ cos (màu lam)
  circleCtx.beginPath();
  circleCtx.moveTo(ox, oy);
  circleCtx.lineTo(mx, oy);
  circleCtx.strokeStyle = "rgba(56, 189, 248, 0.9)";
  circleCtx.lineWidth = 4;
  circleCtx.stroke();

  // Đoạn tung độ sin (màu lục)
  circleCtx.beginPath();
  circleCtx.moveTo(ox, oy);
  circleCtx.lineTo(ox, my);
  circleCtx.strokeStyle = "rgba(16, 185, 129, 0.9)";
  circleCtx.lineWidth = 4;
  circleCtx.stroke();

  // Điểm M
  circleCtx.beginPath();
  circleCtx.arc(mx, my, 6, 0, 2 * Math.PI);
  circleCtx.fillStyle = "#38bdf8";
  circleCtx.fill();
  circleCtx.strokeStyle = "#fff";
  circleCtx.lineWidth = 2;
  circleCtx.stroke();

  circleCtx.font = "bold 13px 'Inter', sans-serif";
  circleCtx.fillStyle = "#38bdf8";
  circleCtx.fillText(`M (${cosVal.toFixed(2)}; ${sinVal.toFixed(2)})`, mx + (cosVal >= 0 ? 8 : -110), my - 10);

  // Nếu hiển thị góc bù M'
  if (showSupp && currentAngle !== 90) {
    // Bán kính OM'
    circleCtx.beginPath();
    circleCtx.moveTo(ox, oy);
    circleCtx.lineTo(mpx, mpy);
    circleCtx.strokeStyle = "rgba(245, 158, 11, 0.7)";
    circleCtx.lineWidth = 2;
    circleCtx.stroke();

    // Chiếu M' xuống Ox & Oy
    circleCtx.setLineDash([4, 4]);
    circleCtx.strokeStyle = "rgba(245, 158, 11, 0.4)";
    circleCtx.beginPath();
    circleCtx.moveTo(mpx, mpy);
    circleCtx.lineTo(mpx, oy);
    circleCtx.moveTo(mpx, mpy);
    circleCtx.lineTo(ox, mpy);
    circleCtx.stroke();
    circleCtx.setLineDash([]);

    // Điểm M'
    circleCtx.beginPath();
    circleCtx.arc(mpx, mpy, 5, 0, 2 * Math.PI);
    circleCtx.fillStyle = "#f59e0b";
    circleCtx.fill();
    circleCtx.stroke();

    circleCtx.fillStyle = "#f59e0b";
    circleCtx.fillText(`M' (${suppCos.toFixed(2)}; ${suppSin.toFixed(2)})`, mpx + (suppCos >= 0 ? 8 : -110), mpy - 10);
  }

  // Cập nhật giá trị hiển thị bên ngoài
  updateReadoutValues(cosVal, sinVal);
}

function updateReadoutValues(cosVal, sinVal) {
  document.getElementById("mCoord").textContent = `(${cosVal.toFixed(2)}; ${sinVal.toFixed(2)})`;
  document.getElementById("mSin").textContent = sinVal.toFixed(4);
  document.getElementById("mCos").textContent = cosVal.toFixed(4);

  let tanStr = "|| (Không XĐ)";
  let cotStr = "|| (Không XĐ)";

  if (Math.abs(cosVal) > 0.0001) {
    tanStr = (sinVal / cosVal).toFixed(4);
  }
  if (Math.abs(sinVal) > 0.0001) {
    cotStr = (cosVal / sinVal).toFixed(4);
  }

  document.getElementById("mTan").textContent = tanStr;
  document.getElementById("mCot").textContent = cotStr;
  document.getElementById("mPythagoras").textContent = (cosVal * cosVal + sinVal * sinVal).toFixed(4);
}

if (angleSlider) {
  angleSlider.addEventListener("input", (e) => {
    currentAngle = parseInt(e.target.value);
    angleVal.textContent = `${currentAngle}°`;
    drawUnitSemicircle();
    checkUnlockBadge("circle");
    if (chkSupplementary && chkSupplementary.checked) {
      checkUnlockBadge("symmetry");
    }
  });
}

if (chkSupplementary) {
  chkSupplementary.addEventListener("change", () => {
    drawUnitSemicircle();
    if (chkSupplementary.checked) {
      checkUnlockBadge("symmetry");
    }
  });
}

document.querySelectorAll(".chip-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".chip-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const angle = parseInt(btn.dataset.angle);
    currentAngle = angle;
    if (angleSlider) angleSlider.value = angle;
    if (angleVal) angleVal.textContent = `${angle}°`;
    drawUnitSemicircle();
    sound.playClick();
    checkUnlockBadge("circle");
  });
});

// --- 6. PHÒNG THÍ NGHIỆM 2: MÔ PHỎNG VÒNG QUAY ĐU QUAY (SGK TRANG 37) ---
const ferrisCanvas = document.getElementById("ferrisCanvas");
const ferrisCtx = ferrisCanvas ? ferrisCanvas.getContext("2d") : null;
const timeSlider = document.getElementById("timeSlider");
const timeVal = document.getElementById("timeVal");

let currentTime = 20; // phút

function drawFerrisWheel() {
  if (!ferrisCtx) return;
  const w = ferrisCanvas.width;
  const h = ferrisCanvas.height;
  ferrisCtx.clearRect(0, 0, w, h);

  const groundY = h - 25;
  const ox = w / 2 - 40;
  const scale = 1.05; // 1 mét = 1.05 pixel
  const R_px = 75 * scale; // 78.75px
  const centerH_px = 90 * scale; // 94.5px
  const oy = groundY - centerH_px; // Tâm vòng quay

  // 1. Vẽ mặt đất
  ferrisCtx.strokeStyle = "#475569";
  ferrisCtx.lineWidth = 2;
  ferrisCtx.beginPath();
  ferrisCtx.moveTo(20, groundY);
  ferrisCtx.lineTo(w - 20, groundY);
  ferrisCtx.stroke();

  ferrisCtx.fillStyle = "#64748b";
  ferrisCtx.font = "11px 'Inter', sans-serif";
  ferrisCtx.fillText("Mặt đất (0 m)", 25, groundY + 16);

  // 2. Chân tháp đỡ vòng quay
  ferrisCtx.strokeStyle = "rgba(148, 163, 184, 0.6)";
  ferrisCtx.lineWidth = 3;
  ferrisCtx.beginPath();
  ferrisCtx.moveTo(ox, oy);
  ferrisCtx.lineTo(ox - 35, groundY);
  ferrisCtx.moveTo(ox, oy);
  ferrisCtx.lineTo(ox + 35, groundY);
  ferrisCtx.stroke();

  // 3. Vòng tròn đu quay
  ferrisCtx.beginPath();
  ferrisCtx.arc(ox, oy, R_px, 0, 2 * Math.PI);
  ferrisCtx.strokeStyle = "rgba(99, 102, 241, 0.4)";
  ferrisCtx.lineWidth = 2;
  ferrisCtx.stroke();

  // 12 nan hoa (spokes)
  for (let i = 0; i < 12; i++) {
    const spRad = (i * 30 * Math.PI) / 180;
    ferrisCtx.beginPath();
    ferrisCtx.moveTo(ox, oy);
    ferrisCtx.lineTo(ox + Math.cos(spRad) * R_px, oy + Math.sin(spRad) * R_px);
    ferrisCtx.strokeStyle = "rgba(255, 255, 255, 0.1)";
    ferrisCtx.lineWidth = 1;
    ferrisCtx.stroke();
  }

  // Tâm đu quay
  ferrisCtx.beginPath();
  ferrisCtx.arc(ox, oy, 5, 0, 2 * Math.PI);
  ferrisCtx.fillStyle = "#818cf8";
  ferrisCtx.fill();

  // 4. Vị trí cabin người quan sát sau thời gian t
  // Cabin xuất phát ở vị trí thấp nhất: góc ban đầu là 270° (-90°) hoặc quay theo chiều ngược kim đồng hồ.
  // Góc quay: theta = t * 12°
  // Toạ độ theo góc toán học: điểm đáy là góc -90° (hoặc 270°). Khi quay theo chiều ngược kim đồng hồ: góc = -90° + theta.
  // Hoặc tính theo độ cao: h(t) = 90 - 75*cos(12° * t)
  const thetaDeg = currentTime * 12;
  const thetaRad = (thetaDeg * Math.PI) / 180;
  const cosVal = Math.cos(thetaRad);
  const realHeight = 90 - 75 * cosVal;

  // Cabin vị trí trên canvas:
  // Tại t=0: góc = -90° (đáy, x = ox, y = oy + R_px)
  // Khi quay góc theta: x = ox + R_px * sin(theta), y = oy + R_px * cos(theta) (vì y hướng xuống)
  // Check: t=0 -> x = ox, y = oy + R_px (đúng đáy)
  // t=7.5 -> theta = 90° -> x = ox + R_px, y = oy (ngang tâm)
  // t=15 -> theta = 180° -> x = ox, y = oy - R_px (đỉnh)
  const cabinX = ox + R_px * Math.sin(thetaRad);
  const cabinY = oy + R_px * Math.cos(thetaRad);

  // Vẽ thanh từ tâm tới cabin
  ferrisCtx.beginPath();
  ferrisCtx.moveTo(ox, oy);
  ferrisCtx.lineTo(cabinX, cabinY);
  ferrisCtx.strokeStyle = "rgba(245, 158, 11, 0.9)";
  ferrisCtx.lineWidth = 2.5;
  ferrisCtx.stroke();

  // Cabin
  ferrisCtx.beginPath();
  ferrisCtx.arc(cabinX, cabinY, 9, 0, 2 * Math.PI);
  ferrisCtx.fillStyle = "#f59e0b";
  ferrisCtx.fill();
  ferrisCtx.strokeStyle = "#fff";
  ferrisCtx.lineWidth = 2;
  ferrisCtx.stroke();

  // Vẽ chỉ báo độ cao sang bên phải
  const markerX = w - 65;
  ferrisCtx.setLineDash([4, 4]);
  ferrisCtx.strokeStyle = "rgba(16, 185, 129, 0.7)";
  ferrisCtx.beginPath();
  ferrisCtx.moveTo(cabinX, cabinY);
  ferrisCtx.lineTo(markerX, cabinY);
  ferrisCtx.stroke();
  ferrisCtx.setLineDash([]);

  // Thước đo độ cao thẳng đứng
  ferrisCtx.strokeStyle = "#10b981";
  ferrisCtx.lineWidth = 2;
  ferrisCtx.beginPath();
  ferrisCtx.moveTo(markerX, groundY);
  ferrisCtx.lineTo(markerX, cabinY);
  ferrisCtx.stroke();

  // Nhãn độ cao
  ferrisCtx.fillStyle = "#10b981";
  ferrisCtx.font = "bold 12px 'Inter', sans-serif";
  ferrisCtx.fillText(`h = ${realHeight.toFixed(1)} m`, markerX - 35, cabinY - 8);

  // Mốc tâm 90m
  ferrisCtx.fillStyle = "#94a3b8";
  ferrisCtx.font = "11px 'Inter', sans-serif";
  ferrisCtx.fillText("Tâm 90 m", ox + 10, oy - 6);

  // Cập nhật text readout
  document.getElementById("ferrisAngle").textContent = `${thetaDeg}°`;
  document.getElementById("ferrisCos").textContent = cosVal.toFixed(3);
  document.getElementById("ferrisHeight").textContent = `h = 90 - 75×(${cosVal.toFixed(2)}) = ${realHeight.toFixed(1)} m`;

  if (currentTime === 20) {
    checkUnlockBadge("ferris");
  }
}

if (timeSlider) {
  timeSlider.addEventListener("input", (e) => {
    currentTime = parseFloat(e.target.value);
    timeVal.textContent = `${currentTime} phút`;
    drawFerrisWheel();
  });
}

document.querySelectorAll(".chip-btn-ferris").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".chip-btn-ferris").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");
    const t = parseFloat(btn.dataset.time);
    currentTime = t;
    if (timeSlider) timeSlider.value = t;
    if (timeVal) timeVal.textContent = `${t} phút`;
    drawFerrisWheel();
    sound.playClick();
  });
});

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
          drawUnitSemicircle();
          drawFerrisWheel();
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
  if (confirm("Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình học tập của Bài 5?")) {
    sound.playClick();
    localStorage.removeItem(STORAGE_KEY);
    appState = { ...defaultState };
    saveState();
    updateHUD();
    renderQuiz();
    drawUnitSemicircle();
    drawFerrisWheel();
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
  drawUnitSemicircle();
  drawFerrisWheel();

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
