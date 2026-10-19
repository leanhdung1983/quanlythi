/* ================================================================
   BÀI 4: HỆ BẤT PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN - TOÁN 10 TẬP 1
   Bộ sách: Kết Nối Tri Thức Với Cuộc Sống (Trang 26 - 30)
   Pure Vanilla JS • Web Audio API • 2D Canvas Polygon • MathML Offline
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

// --- 1. ÂM THANH WEB AUDIO API ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  }

  playTone(freq, type, duration, delay = 0, gainVal = 0.12) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    setTimeout(() => {
      try {
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
      } catch (e) {}
    }, delay);
  }

  click() {
    this.playTone(600, 'sine', 0.04, 0, 0.08);
  }

  correct() {
    this.playTone(523.25, 'triangle', 0.1, 0, 0.15);
    this.playTone(659.25, 'triangle', 0.1, 80, 0.15);
    this.playTone(783.99, 'triangle', 0.18, 160, 0.18);
  }

  wrong() {
    this.playTone(260, 'sawtooth', 0.12, 0, 0.12);
    this.playTone(200, 'sawtooth', 0.22, 100, 0.15);
  }

  levelup() {
    this.playTone(440, 'sine', 0.1, 0, 0.15);
    this.playTone(554.37, 'sine', 0.1, 80, 0.15);
    this.playTone(659.25, 'sine', 0.12, 160, 0.18);
    this.playTone(880, 'sine', 0.28, 240, 0.2);
  }

  fanfare() {
    const melody = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5];
    melody.forEach((f, i) => {
      this.playTone(f, 'triangle', 0.2, i * 110, 0.18);
    });
  }
}

const sound = new SoundController();

// --- 2. QUẢN LÝ TIẾN TRÌNH & DỮ LIỆU BÀI 4 ---
const STATE_KEY = 'toan10_bai4_he_bpt_state';

const defaultState = {
  xp: 0,
  streak: 0,
  maxStreak: 0,
  stars: 2,
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Kiện Tướng Đa Giác & Quy Hoạch Tuyến Tính',
  soundEnabled: true,
  currentTab: 'theory',
  answeredQuestions: {},
  currentQuestionIndex: 0,
  badges: {
    sysdef: false,
    poly: false,
    vertex: false,
    arena: false,
    master: false
  },
  polyTested: false,
  dietTested: false
};

let appState = { ...defaultState };

function loadState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      appState = { ...defaultState, ...parsed };
      appState.userName = 'Chiến Binh Logic';
    }
  } catch (e) {
    appState = { ...defaultState };
  }
  sound.enabled = appState.soundEnabled;
}

function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(appState));
  } catch (e) {}
}

function updateHUD() {
  document.getElementById('xpDisplay').textContent = appState.xp;
  document.getElementById('streakDisplay').textContent = `🔥 ${appState.streak}`;
  document.getElementById('avatarBtn').textContent = appState.avatar;
  
  document.getElementById('userNameDisplay').textContent = `${appState.userName} 🌟`;
  document.getElementById('userTitle').textContent = appState.userTitle;

  let starsCount = 2;
  if (appState.xp >= 60) starsCount = 3;
  if (appState.xp >= 120) starsCount = 4;
  if (appState.xp >= 180) starsCount = 5;
  appState.stars = starsCount;
  
  const starsStr = '⭐'.repeat(starsCount) + '☆'.repeat(5 - starsCount);
  document.getElementById('starRating').textContent = starsStr;

  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.textContent = sound.enabled ? '🔊 Âm thanh: BẬT' : '🔈 Âm thanh: TẮT';
  }

  updateBadgesUI();
  updateCertificateUI();
}

function addXP(amount) {
  appState.xp += amount;
  saveState();
  updateHUD();
}

function setStreak(isCorrect) {
  if (isCorrect) {
    appState.streak++;
    if (appState.streak > appState.maxStreak) {
      appState.maxStreak = appState.streak;
    }
  } else {
    appState.streak = 0;
  }
  saveState();
  updateHUD();
}

function unlockBadge(badgeId) {
  if (!appState.badges[badgeId]) {
    appState.badges[badgeId] = true;
    sound.levelup();
    saveState();
    updateHUD();

    const { sysdef, poly, vertex, arena } = appState.badges;
    if (sysdef && poly && vertex && arena && !appState.badges.master) {
      appState.badges.master = true;
      sound.fanfare();
      saveState();
      updateHUD();
    }
  }
}

function updateBadgesUI() {
  for (const [badgeId, isUnlocked] of Object.entries(appState.badges)) {
    const el = document.getElementById(`badge-${badgeId}`);
    if (el) {
      if (isUnlocked) {
        el.classList.remove('locked');
      } else {
        el.classList.add('locked');
      }
    }
  }
}

function updateCertificateUI() {
  const nameEl = document.getElementById('certStudentName');
  if (nameEl) {
    nameEl.textContent = 'Chiến Binh Logic';
  }
  
  const dateEl = document.getElementById('certDate');
  if (dateEl) {
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();
    dateEl.textContent = `Đà Nẵng, ngày ${day} tháng ${month} năm ${year}`;
  }

  const certTitleEl = document.getElementById('certHonorsTitle');
  if (certTitleEl) {
    if (appState.badges.master) {
      certTitleEl.textContent = 'ĐẠI KIỆN TƯỚNG HỆ BẤT PHƯƠNG TRÌNH XUẤT SẮC 🏅';
    } else if (appState.xp >= 160) {
      certTitleEl.textContent = 'CHIẾN THẦN QUY HOẠCH TUYẾN TÍNH 🌟';
    } else {
      certTitleEl.textContent = 'KIỆN TƯỚNG ĐA GIÁC VÀ MIỀN NGHIỆM 🎯';
    }
  }
}

// --- 3. ĐIỀU HƯỚNG TABS ---
function initTabs() {
  const tabButtons = document.querySelectorAll('.nav-tab');
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.click();
      const tabTarget = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });

      const targetEl = document.getElementById(`tab-${tabTarget}`);
      if (targetEl) targetEl.classList.add('active');
      appState.currentTab = tabTarget;
      saveState();

      if (tabTarget === 'theory') {
        unlockBadge('sysdef');
      } else if (tabTarget === 'labs') {
        renderPolyCanvas();
        renderDietCanvas();
      }
    });
  });
}

// --- 4. LAB 1: MÁY BIỂU DIỄN ĐA GIÁC MIỀN NGHIỆM OXY ---
let currentSystemKey = 'sys1';

const systemsData = {
  sys1: {
    name: 'Tứ giác OABC (Giao 4 BPT)',
    vertices: [
      { name: 'O', x: 0, y: 0 },
      { name: 'A', x: 3, y: 0 },
      { name: 'B', x: 2, y: 2 },
      { name: 'C', x: 0, y: 4 }
    ],
    lines: [
      { a: 1, b: 0, c: 0, label: 'x = 0' },
      { a: 0, b: 1, c: 0, label: 'y = 0' },
      { a: 1, b: 1, c: 4, label: 'x + y = 4' },
      { a: 2, b: 1, c: 6, label: '2x + y = 6' }
    ],
    desc: 'Tứ giác lồi OABC với các đỉnh $O(0; 0), A(3; 0), B(2; 2), C(0; 4)$.'
  },
  sys2: {
    name: 'Tam giác OAB (SGK 2.5b)',
    vertices: [
      { name: 'O', x: 0, y: 0 },
      { name: 'A', x: 2, y: 0 },
      { name: 'B', x: 0, y: 4 }
    ],
    lines: [
      { a: 1, b: 0, c: 0, label: 'x = 0' },
      { a: 0, b: 1, c: 0, label: 'y = 0' },
      { a: 2, b: 1, c: 4, label: '2x + y = 4' }
    ],
    desc: 'Miền tam giác vuông OAB tại gốc O với các đỉnh $O(0; 0), A(2; 0), B(0; 4)$.'
  },
  sys3: {
    name: 'Ngũ giác ABCDE (Đối xứng)',
    vertices: [
      { name: 'A', x: -1, y: 0 },
      { name: 'B', x: 3, y: 0 },
      { name: 'C', x: 3, y: 2 },
      { name: 'D', x: 1, y: 4 },
      { name: 'E', x: -1, y: 4 }
    ],
    lines: [
      { a: 1, b: 0, c: -1, label: 'x = -1' },
      { a: 1, b: 0, c: 3, label: 'x = 3' },
      { a: 0, b: 1, c: 0, label: 'y = 0' },
      { a: 0, b: 1, c: 4, label: 'y = 4' },
      { a: 1, b: 1, c: 5, label: 'x + y = 5' }
    ],
    desc: 'Miền ngũ giác lồi ABCDE với 5 đỉnh xác định giá trị tối ưu.'
  }
};

function initPolyLab() {
  const btns = document.querySelectorAll('.op-btn[data-sys]');
  btns.forEach(b => {
    b.addEventListener('click', () => {
      sound.click();
      btns.forEach(btn => btn.classList.remove('active'));
      b.classList.add('active');
      currentSystemKey = b.getAttribute('data-sys');
      appState.polyTested = true;
      unlockBadge('poly');
      unlockBadge('vertex');
      renderPolyCanvas();
    });
  });

  renderPolyCanvas();
}

function renderPolyCanvas() {
  const canvas = document.getElementById('polyCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const sys = systemsData[currentSystemKey];
  const originX = 80;
  const originY = h - 60;
  const scale = 50;

  function toPx(x, y) {
    return {
      x: originX + x * scale,
      y: originY - y * scale
    };
  }

  // 1. Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = -2; x <= 8; x++) {
    const p1 = toPx(x, -2);
    const p2 = toPx(x, 7);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }
  for (let y = -2; y <= 7; y++) {
    const p1 = toPx(-2, y);
    const p2 = toPx(8, y);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
  }

  // 2. Axes Ox, Oy
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(20, originY);
  ctx.lineTo(w - 20, originY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(originX, h - 20);
  ctx.lineTo(originX, 20);
  ctx.stroke();

  ctx.font = 'bold 12px "Inter", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('x', w - 16, originY + 16);
  ctx.fillText('y', originX + 10, 24);
  ctx.fillText('O', originX - 16, originY + 16);

  // 3. Draw Polygon Feasible Region
  const pts = sys.vertices.map(v => toPx(v.x, v.y));
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(16, 185, 129, 0.35)'; // Emerald Glow
  ctx.fill();

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();

  // 4. Draw Vertices and Coordinates
  sys.vertices.forEach((v, i) => {
    const p = pts[i];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#fbbf24'; // Gold Dot
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px "Inter", sans-serif';
    ctx.fillText(`${v.name}(${v.x}; ${v.y})`, p.x + 8, p.y - 8);
  });

  // 5. Update Vertices list in UI
  const listEl = document.getElementById('verticesList');
  if (listEl) {
    const linesStr = sys.vertices.map(v => `• Đỉnh $${v.name}(${v.x}; ${v.y})$`).join('<br>');
    listEl.innerHTML = formatMathText(`${sys.desc}<br>${linesStr}`);
  }
}

// --- 5. LAB 2: MÁY TỐI ƯU HÓA DINH DƯỠNG (SGK 2.6) ---
function initDietLab() {
  const slB = document.getElementById('sliderBeef');
  const slP = document.getElementById('sliderPork');

  function update() {
    const b = parseFloat(slB.value) || 0;
    const p = parseFloat(slP.value) || 0;
    document.getElementById('lblBeef').textContent = `${b.toFixed(2)} kg thịt bò`;
    document.getElementById('lblPork').textContent = `${p.toFixed(2)} kg thịt lợn`;
    appState.dietTested = true;
    unlockBadge('vertex');
    renderDietCanvas();
  }

  if (slB && slP) {
    slB.addEventListener('input', update);
    slP.addEventListener('input', update);
  }

  renderDietCanvas();
}

function renderDietCanvas() {
  const canvas = document.getElementById('dietCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const x = parseFloat(document.getElementById('sliderBeef').value) || 0.6;
  const y = parseFloat(document.getElementById('sliderPork').value) || 0.7;

  // Dinh dưỡng: Protein: 800x + 600y >= 900; Lipid: 200x + 400y >= 400
  // Chi phí: F = 250x + 160y (nghìn đồng)
  const protein = 800 * x + 600 * y;
  const lipid = 200 * x + 400 * y;
  const cost = 250 * x + 160 * y;

  const isProteinOk = protein >= 900;
  const isLipidOk = lipid >= 400;
  const isAllOk = isProteinOk && isLipidOk;

  // Coordinate mapping for [0; 1.8] x [0; 1.4]
  const originX = 60;
  const originY = h - 50;
  const scaleX = (w - 100) / 1.8;
  const scaleY = (h - 80) / 1.4;

  function toPxD(vx, vy) {
    return {
      x: originX + vx * scaleX,
      y: originY - vy * scaleY
    };
  }

  // Draw Axes
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(originX - 10, originY);
  ctx.lineTo(w - 20, originY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(originX, originY + 10);
  ctx.lineTo(originX, 20);
  ctx.stroke();

  ctx.font = 'bold 12px "Inter", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('x (Thịt bò - kg)', w - 90, originY + 28);
  ctx.fillText('y (Thịt lợn - kg)', originX - 45, 20);
  ctx.fillText('O', originX - 15, originY + 16);

  // Feasible Region polygon vertices:
  // Points: V1(0.3, 1.1), V2(1.6, 1.1), V3(1.6, 0.2), V4(0.6, 0.7)
  const v1 = toPxD(0.3, 1.1);
  const v2 = toPxD(1.6, 1.1);
  const v3 = toPxD(1.6, 0.2);
  const v4 = toPxD(0.6, 0.7);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(v1.x, v1.y);
  ctx.lineTo(v2.x, v2.y);
  ctx.lineTo(v3.x, v3.y);
  ctx.lineTo(v4.x, v4.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // Draw Optimal Vertex (0.3; 1.1) and (0.6; 0.7)
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 11px "Inter", sans-serif';
  ctx.fillText('V(0.6; 0.7)', v4.x + 8, v4.y - 6);
  ctx.fillText('Max 1.6kg', v2.x - 30, v2.y - 8);

  // Plot Current Choice Point (x; y)
  const pCur = toPxD(x, y);
  ctx.beginPath();
  ctx.arc(pCur.x, pCur.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = isAllOk ? '#10b981' : '#f43f5e';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.fillText(`M(${x.toFixed(2)}; ${y.toFixed(2)})`, pCur.x + 8, pCur.y - 8);

  // Update Status Text
  const titleEl = document.getElementById('dietStatusTitle');
  const descEl = document.getElementById('dietStatusDesc');
  const boxEl = document.getElementById('dietResultBox');

  if (titleEl && descEl && boxEl) {
    if (isAllOk) {
      titleEl.textContent = 'ĐẠT CHUẨN DINH DƯỠNG ✅';
      titleEl.style.color = '#10b981';
      boxEl.style.borderLeftColor = '#10b981';
    } else {
      titleEl.textContent = 'THIẾU CHẤT DINH DƯỠNG ⚠️';
      titleEl.style.color = '#f43f5e';
      boxEl.style.borderLeftColor = '#f43f5e';
    }

    descEl.innerHTML = formatMathText(`
      • Protein đạt: $${protein.toFixed(0)} / 900$ đơn vị (${isProteinOk ? 'Đạt' : 'Thiếu'}).<br>
      • Lipid đạt: $${lipid.toFixed(0)} / 400$ đơn vị (${isLipidOk ? 'Đạt' : 'Thiếu'}).<br>
      • Tổng chi phí thực phẩm: $F(x; y) = 250 \\times ${x.toFixed(2)} + 160 \\times ${y.toFixed(2)} = ${cost.toFixed(1)}$ nghìn đồng.<br>
      • <em>Định lý đỉnh:</em> Chi phí nhỏ nhất $251$ nghìn đồng khi mua $0.3$ kg bò & $1.1$ kg lợn (hoặc $262$ nghìn đồng khi mua $0.6$ kg bò & $0.7$ kg lợn).
    `);
  }
}

// --- 6. TAB 3: ĐẤU TRƯỜNG SGK (10 CÂU BÀI 2.4 - 2.6 TRANG 30) ---
const arenaQuestions = [
  {
    id: 1,
    sgkRef: 'SGK Bài 2.4a',
    text: 'Hệ bất phương trình nào sau đây là **hệ bất phương trình bậc nhất hai ẩn**?',
    options: [
      { text: 'A. $\\begin{cases} x < 0 \\\\ y \\ge 0 \\end{cases}$', correct: true },
      { text: 'B. $\\begin{cases} x + y^2 < 0 \\\\ y - x > 1 \\end{cases}$', correct: false },
      { text: 'C. $\\begin{cases} x + y + z < 0 \\\\ y < 0 \\end{cases}$', correct: false },
      { text: 'D. $\\begin{cases} -2x + y < 3^2 \\\\ 4^2x + 3y^2 < 1 \\end{cases}$', correct: false }
    ],
    explanation: 'Hệ $\\begin{cases} x < 0 \\\\ y \\ge 0 \\end{cases}$ gồm hai bất phương trình có đúng hai ẩn $x, y$ đều ở bậc nhất, các hệ số thỏa mãn điều kiện định nghĩa. Các hệ còn lại chứa ẩn bậc hai ($y^2$) hoặc chứa 3 ẩn ($x, y, z$).'
  },
  {
    id: 2,
    sgkRef: 'SGK Bài 2.4c',
    text: 'Hệ bất phương trình $\\begin{cases} x + y + z < 0 \\\\ y < 0 \\end{cases}$ **không phải** là hệ bất phương trình bậc nhất hai ẩn vì lí do gì?',
    options: [
      { text: 'A. Có chứa 3 ẩn số ($x, y, z$).', correct: true },
      { text: 'B. Có chứa ẩn số bậc hai.', correct: false },
      { text: 'C. Có chứa số âm.', correct: false },
      { text: 'D. Có chứa dấu nhỏ hơn ($<$).', correct: false }
    ],
    explanation: 'Hệ bất phương trình bậc nhất hai ẩn bắt buộc chỉ được chứa đúng 2 ẩn số. Bất phương trình đầu tiên chứa 3 ẩn số $x, y, z$, do đó đây là hệ bất phương trình ba ẩn.'
  },
  {
    id: 3,
    sgkRef: 'SGK Trang 26',
    text: 'Cặp số $(x; y) = (1; 1)$ là một nghiệm của hệ bất phương trình nào sau đây?',
    options: [
      { text: 'A. $\\begin{cases} x + y \\le 4 \\\\ 2x - y \\ge 0 \\end{cases}$', correct: true },
      { text: 'B. $\\begin{cases} x + y > 3 \\\\ x - y > 1 \\end{cases}$', correct: false },
      { text: 'C. $\\begin{cases} x < 0 \\\\ y > 0 \\end{cases}$', correct: false },
      { text: 'D. $\\begin{cases} 2x + y < 1 \\\\ y \\ge 2 \\end{cases}$', correct: false }
    ],
    explanation: 'Thay $(x; y) = (1; 1)$ vào hệ A:<br>• $1 + 1 = 2 \\le 4$ (Đúng).<br>• $2(1) - 1 = 1 \\ge 0$ (Đúng).<br>Vì cặp số $(1; 1)$ đồng thời thỏa mãn cả hai bất phương trình nên nó là nghiệm của hệ A.'
  },
  {
    id: 4,
    sgkRef: 'SGK Trang 27',
    text: 'Về mặt hình học trên mặt phẳng $Oxy$, miền nghiệm của một hệ bất phương trình bậc nhất hai ẩn là:',
    options: [
      { text: 'A. Phần giao của các miền nghiệm của từng bất phương trình trong hệ.', correct: true },
      { text: 'B. Phần hợp của các miền nghiệm của từng bất phương trình trong hệ.', correct: false },
      { text: 'C. Luôn luôn là một hình tròn.', correct: false },
      { text: 'D. Chỉ là một điểm duy nhất.', correct: false }
    ],
    explanation: 'Theo định nghĩa chuẩn SGK, miền nghiệm của hệ bất phương trình bậc nhất hai ẩn là giao của các miền nghiệm của các bất phương trình trong hệ đó.'
  },
  {
    id: 5,
    sgkRef: 'SGK Trang 28',
    text: 'Miền nghiệm của hệ bất phương trình bậc nhất hai ẩn thường có dạng hình học nào?',
    options: [
      { text: 'A. Một miền đa giác lồi (tam giác, tứ giác, ...) hoặc một miền không bị chặn.', correct: true },
      { text: 'B. Một đường cong parabol hoặc hyperbol.', correct: false },
      { text: 'C. Một hình elip khép kín.', correct: false },
      { text: 'D. Một khối tròn xoay.', correct: false }
    ],
    explanation: 'Vì các đường biên là các đường thẳng bậc nhất, nên giao của các nửa mặt phẳng luôn tạo ra một miền đa giác lồi (nếu bị chặn) hoặc một miền góc / dải mặt phẳng (nếu không bị chặn).'
  },
  {
    id: 6,
    sgkRef: 'SGK Bài 2.5b',
    text: 'Miền nghiệm của hệ bất phương trình $\\begin{cases} x \\ge 0 \\\\ y \\ge 0 \\\\ 2x + y \\le 4 \\end{cases}$ là một miền tam giác có 3 đỉnh là:',
    options: [
      { text: 'A. $O(0; 0), A(2; 0), B(0; 4)$', correct: true },
      { text: 'B. $O(0; 0), A(4; 0), B(0; 2)$', correct: false },
      { text: 'C. $O(0; 0), A(1; 2), B(2; 4)$', correct: false },
      { text: 'D. $A(2; 0), B(0; 4), C(2; 4)$', correct: false }
    ],
    explanation: 'Đường thẳng $2x + y = 4$ cắt trục hoành ($y = 0$) tại $A(2; 0)$, cắt trục tung ($x = 0$) tại $B(0; 4)$. Kết hợp với $x \\ge 0, y \\ge 0$ (góc phần tư thứ nhất) ta được miền tam giác vuông $OAB$ với 3 đỉnh $O(0; 0), A(2; 0), B(0; 4)$.'
  },
  {
    id: 7,
    sgkRef: 'SGK Bài 2.5a',
    text: 'Hệ bất phương trình $\\begin{cases} y - x < -1 \\\\ x > 0 \\\\ y < 0 \\end{cases}$ có miền nghiệm nằm hoàn toàn trong góc phần tư thứ mấy của mặt phẳng $Oxy$?',
    options: [
      { text: 'A. Góc phần tư thứ IV ($x > 0, y < 0$).', correct: true },
      { text: 'B. Góc phần tư thứ I ($x > 0, y > 0$).', correct: false },
      { text: 'C. Góc phần tư thứ II ($x < 0, y > 0$).', correct: false },
      { text: 'D. Góc phần tư thứ III ($x < 0, y < 0$).', correct: false }
    ],
    explanation: 'Điều kiện $x > 0$ và $y < 0$ xác định chính xác các điểm nằm trong góc phần tư thứ IV của mặt phẳng tọa độ $Oxy$.'
  },
  {
    id: 8,
    sgkRef: 'SGK Trang 29',
    text: 'Định lý về giá trị lớn nhất và nhỏ nhất của biểu thức mục tiêu $F(x; y) = ax + by$ trên miền đa giác khẳng định:',
    options: [
      { text: 'A. Biểu thức $F$ luôn đạt giá trị lớn nhất hoặc nhỏ nhất tại một trong các đỉnh của miền đa giác.', correct: true },
      { text: 'B. Biểu thức $F$ luôn đạt cực trị tại trọng tâm của đa giác.', correct: false },
      { text: 'C. Biểu thức $F$ luôn đạt cực trị tại gốc tọa độ $O(0; 0)$.', correct: false },
      { text: 'D. Không bao giờ tìm được giá trị lớn nhất.', correct: false }
    ],
    explanation: 'Đây là định lý nền tảng của quy hoạch tuyến tính được SGK nêu rõ: Biểu thức $F(x; y) = ax + by$ với $(x; y)$ thuộc miền đa giác luôn đạt giá trị lớn nhất và giá trị nhỏ nhất tại một trong các đỉnh của đa giác đó.'
  },
  {
    id: 9,
    sgkRef: 'SGK Bài 2.6a',
    text: 'Một gia đình cần ít nhất 900 đơn vị protein và 400 đơn vị lipid mỗi ngày. 1kg thịt bò chứa 800 protein, 200 lipid. 1kg thịt lợn chứa 600 protein, 400 lipid. Gọi $x, y$ là số kg thịt bò và thịt lợn mua (tối đa 1.6kg bò và 1.1kg lợn). Hệ bất phương trình mô tả là:',
    options: [
      { text: 'A. $\\begin{cases} 800x + 600y \\ge 900 \\\\ 200x + 400y \\ge 400 \\\\ 0 \\le x \\le 1.6 \\\\ 0 \\le y \\le 1.1 \\end{cases}$', correct: true },
      { text: 'B. $\\begin{cases} 800x + 600y \\le 900 \\\\ 200x + 400y \\le 400 \\end{cases}$', correct: false },
      { text: 'C. $\\begin{cases} 200x + 800y \\ge 900 \\\\ 400x + 600y \\ge 400 \\end{cases}$', correct: false },
      { text: 'D. $\\begin{cases} x + y \\ge 900 \\\\ x + y \\ge 400 \\end{cases}$', correct: false }
    ],
    explanation: '• Lượng protein: $800x + 600y \\ge 900$.<br>• Lượng lipid: $200x + 400y \\ge 400$.<br>• Ràng buộc thực tế khả năng mua tối đa: $0 \\le x \\le 1.6$ và $0 \\le y \\le 1.1$.'
  },
  {
    id: 10,
    sgkRef: 'SGK Bài 2.6c',
    text: 'Trong bài toán dinh dưỡng SGK 2.6, với giá 1kg thịt bò là 250 nghìn đồng và 1kg thịt lợn là 160 nghìn đồng, biểu thức tổng chi phí $F(x; y) = 250x + 160y$ đạt giá trị nhỏ nhất tại đỉnh nào?',
    options: [
      { text: 'A. Đỉnh $(0.3; 1.1)$ với chi phí $251$ nghìn đồng (hoặc đỉnh $(0.6; 0.7)$ với $262$ nghìn đồng).', correct: true },
      { text: 'B. Đỉnh $(1.6; 1.1)$ với chi phí $576$ nghìn đồng.', correct: false },
      { text: 'C. Đỉnh $(1.6; 0.2)$ với chi phí $432$ nghìn đồng.', correct: false },
      { text: 'D. Đỉnh $(0; 0)$ với chi phí 0 đồng.', correct: false }
    ],
    explanation: 'Tính giá trị $F(x; y) = 250x + 160y$ tại các đỉnh của miền đa giác nghiệm:<br>• Tại $(1.6; 1.1)$: $F = 576$ nghìn đồng.<br>• Tại $(1.6; 0.2)$: $F = 432$ nghìn đồng.<br>• Tại $(0.6; 0.7)$: $F = 262$ nghìn đồng.<br>• Tại $(0.3; 1.1)$: $F = 250(0.3) + 160(1.1) = 251$ nghìn đồng (chi phí nhỏ nhất).'
  }
];

let arenaCurrentIndex = 0;
let arenaAttempts = 0;

function initArena() {
  arenaCurrentIndex = appState.currentQuestionIndex || 0;
  renderCurrentQuestion();

  const btnNext = document.getElementById('btnNextQuestion');
  if (btnNext) {
    btnNext.addEventListener('click', () => {
      sound.click();
      if (arenaCurrentIndex < arenaQuestions.length - 1) {
        arenaCurrentIndex++;
        appState.currentQuestionIndex = arenaCurrentIndex;
        saveState();
        renderCurrentQuestion();
      } else {
        showArenaSummary();
      }
    });
  }

  const btnRestart = document.getElementById('btnRestartArena');
  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      sound.click();
      arenaCurrentIndex = 0;
      appState.currentQuestionIndex = 0;
      appState.answeredQuestions = {};
      saveState();
      renderCurrentQuestion();
    });
  }
}

function renderCurrentQuestion() {
  const q = arenaQuestions[arenaCurrentIndex];
  arenaAttempts = 0;

  document.getElementById('arenaProgressText').textContent = `Câu hỏi ${arenaCurrentIndex + 1} / ${arenaQuestions.length} (${q.sgkRef})`;
  document.getElementById('arenaScoreText').textContent = `Tổng XP: ${appState.xp}`;

  const qEl = document.getElementById('arenaQuestion');
  qEl.innerHTML = formatMathText(q.text);

  const optContainer = document.getElementById('arenaOptions');
  optContainer.innerHTML = '';

  const feedbackEl = document.getElementById('arenaFeedback');
  feedbackEl.style.display = 'none';
  feedbackEl.innerHTML = '';

  const btnNext = document.getElementById('btnNextQuestion');
  btnNext.style.display = 'none';
  const btnRestart = document.getElementById('btnRestartArena');
  btnRestart.style.display = 'none';

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'arena-opt-btn';
    btn.innerHTML = formatMathText(opt.text);
    btn.addEventListener('click', () => handleOptionClick(idx, btn));
    optContainer.appendChild(btn);
  });
}

function handleOptionClick(optIdx, btnEl) {
  const q = arenaQuestions[arenaCurrentIndex];
  const chosenOpt = q.options[optIdx];
  const optButtons = document.querySelectorAll('.arena-opt-btn');
  const feedbackEl = document.getElementById('arenaFeedback');
  const btnNext = document.getElementById('btnNextQuestion');

  arenaAttempts++;

  if (chosenOpt.correct) {
    sound.correct();
    btnEl.classList.add('correct');
    optButtons.forEach(b => b.disabled = true);

    const xpEarned = arenaAttempts === 1 ? 20 : 10;
    addXP(xpEarned);
    setStreak(true);

    appState.answeredQuestions[q.id] = { isCorrect: true, xpEarned };
    saveState();

    feedbackEl.className = 'arena-feedback show correct';
    feedbackEl.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 6px;">🎉 Chính xác! +${xpEarned} XP</div>
      <div>${formatMathText(q.explanation)}</div>
    `;

    if (appState.xp >= 160) {
      unlockBadge('arena');
    }

    btnNext.style.display = 'inline-block';
    if (arenaCurrentIndex === arenaQuestions.length - 1) {
      btnNext.textContent = 'Hoàn Thành Đấu Trường 🏆';
    } else {
      btnNext.textContent = 'Câu Tiếp Theo ➡️';
    }
  } else {
    sound.wrong();
    btnEl.classList.add('wrong');
    btnEl.disabled = true;
    setStreak(false);

    feedbackEl.className = 'arena-feedback show wrong';
    feedbackEl.innerHTML = `
      <div style="font-weight: 700; margin-bottom: 4px;">❌ Chưa chính xác, hãy thử lại!</div>
      <div style="font-size: 0.9rem;">Gợi ý: Đọc kỹ điều kiện hệ bất phương trình và cách xác định tọa độ đỉnh.</div>
    `;
  }
}

function showArenaSummary() {
  const qEl = document.getElementById('arenaQuestion');
  qEl.innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <h2 style="color: #10b981; margin-bottom: 12px;">🎉 CHÚC MỪNG BẠN ĐÃ VƯỢT QUA ĐẤU TRƯỜNG!</h2>
      <p style="font-size: 1.05rem; color: var(--text-secondary); margin-bottom: 16px;">
        Bạn đã hoàn thành toàn bộ 10 câu hỏi bao phủ 100% bài tập SGK Bài 4 (Trang 30).
      </p>
      <div style="font-size: 1.2rem; font-weight: 700; color: var(--gold); margin-bottom: 20px;">
        Tổng điểm tích lũy: ${appState.xp} XP • Chuỗi đúng cao nhất: 🔥 ${appState.maxStreak}
      </div>
    </div>
  `;

  document.getElementById('arenaOptions').innerHTML = '';
  const feedbackEl = document.getElementById('arenaFeedback');
  feedbackEl.style.display = 'none';

  document.getElementById('btnNextQuestion').style.display = 'none';
  const btnRestart = document.getElementById('btnRestartArena');
  btnRestart.style.display = 'inline-block';
  btnRestart.textContent = 'Làm Lại Đấu Trường 🔄';

  unlockBadge('arena');
  sound.fanfare();
}

// --- 7. MODAL CHỌN AVATAR & ĐẶT LẠI TIẾN TRÌNH ---
function initModals() {
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const btnCloseModal = document.getElementById('btnCloseAvatarModal');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      sound.click();
      avatarModal.style.display = 'flex';
    });
  }

  if (btnCloseModal && avatarModal) {
    btnCloseModal.addEventListener('click', () => {
      sound.click();
      avatarModal.style.display = 'none';
    });
  }

  const choices = document.querySelectorAll('.avatar-choice');
  choices.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.click();
      const av = btn.getAttribute('data-avatar');
      appState.avatar = av;
      saveState();
      updateHUD();
      if (avatarModal) avatarModal.style.display = 'none';
    });
  });

  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      const isEnabled = sound.toggle();
      appState.soundEnabled = isEnabled;
      saveState();
      updateHUD();
      if (isEnabled) sound.click();
    });
  }

  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn đặt lại toàn bộ tiến trình học tập của Bài 4 không?')) {
        sound.click();
        localStorage.removeItem(STATE_KEY);
        appState = { ...defaultState };
        saveState();
        updateHUD();
        initArena();
        renderPolyCanvas();
        renderDietCanvas();
      }
    });
  }
}

// --- 8. KHỞI CHẠY KHI TẢI TRANG ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateHUD();
  initTabs();
  initPolyLab();
  initDietLab();
  initArena();
  initModals();

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
