/* ================================================================
   BÀI 2: TẬP HỢP VÀ CÁC PHÉP TOÁN TRÊN TẬP HỢP - TOÁN 10 TẬP 1
   Bộ sách: Kết Nối Tri Thức Với Cuộc Sống (Trang 12 - 19)
   Pure Vanilla JS • Web Audio API • 2D Canvas Labs • Native MathML
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

// --- 1. ÂM THANH WEB AUDIO API (TỰ TỔNG HỢP, 100% OFFLINE) ---
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
    this.playTone(523.25, 'triangle', 0.1, 0, 0.15); // C5
    this.playTone(659.25, 'triangle', 0.1, 80, 0.15); // E5
    this.playTone(783.99, 'triangle', 0.18, 160, 0.18); // G5
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

// --- 2. QUẢN LÝ TIẾN TRÌNH & DỮ LIỆU BÀI 2 ---
const STATE_KEY = 'toan10_bai2_tap_hop_state';

const defaultState = {
  xp: 0,
  streak: 0,
  maxStreak: 0,
  stars: 2,
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Kiện Tướng Tập Hợp Toán 10',
  soundEnabled: true,
  currentTab: 'theory',
  answeredQuestions: {}, // questionIndex: { isCorrect, attempts, xpEarned }
  currentQuestionIndex: 0,
  badges: {
    subset: false,
    venn: false,
    interval: false,
    arena: false,
    master: false
  },
  vennOpsTested: {
    intersect: false,
    union: false,
    diffAB: false,
    diffBA: false
  },
  numberLineTested: false
};

let appState = { ...defaultState };

function loadState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      appState = { ...defaultState, ...parsed };
      // Đảm bảo tên học sinh luôn thuần túy font tiếng Việt serif, không kèm emoji
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
  // XP & Streak
  document.getElementById('xpDisplay').textContent = appState.xp;
  document.getElementById('streakDisplay').textContent = `🔥 ${appState.streak}`;
  document.getElementById('avatarBtn').textContent = appState.avatar;
  
  // Clean student name on UI
  document.getElementById('userNameDisplay').textContent = `${appState.userName} 🌟`;
  document.getElementById('userTitle').textContent = appState.userTitle;

  // Star Rating Calculation
  let starsCount = 2;
  if (appState.xp >= 60) starsCount = 3;
  if (appState.xp >= 120) starsCount = 4;
  if (appState.xp >= 180) starsCount = 5;
  appState.stars = starsCount;
  
  const starsStr = '⭐'.repeat(starsCount) + '☆'.repeat(5 - starsCount);
  document.getElementById('starRating').textContent = starsStr;

  // Sound Toggle Text
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.textContent = sound.enabled ? '🔊 Âm thanh: BẬT' : '🔈 Âm thanh: TẮT';
  }

  // Update Badges & Certificate
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

    // Check if master badge unlocked
    const { subset, venn, interval, arena } = appState.badges;
    if (subset && venn && interval && arena && !appState.badges.master) {
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
    // Pure Vietnamese serif name: 'Chiến Binh Logic'
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
      certTitleEl.textContent = 'ĐẠI KIỆN TƯỚNG TẬP HỢP TOÁN 10 XUẤT SẮC 🏅';
    } else if (appState.xp >= 160) {
      certTitleEl.textContent = 'CHIẾN THẦN TẬP HỢP TOÁN 10 🌟';
    } else {
      certTitleEl.textContent = 'KIỆN TƯỚNG TẬP HỢP TOÁN 10 🎯';
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
        unlockBadge('subset');
      } else if (tabTarget === 'labs') {
        renderVennDiagram();
        renderNumberLine();
      }
    });
  });
}

// --- 4. LAB 1: MÁY THỬ NGHIỆM BIỂU ĐỒ VEN ĐỘNG 2D ---
let currentVennOp = 'intersect';

function parseSetInput(str) {
  if (!str) return [];
  const parts = str.split(/[,;\s]+/).map(s => s.trim()).filter(s => s.length > 0);
  const unique = [];
  parts.forEach(p => {
    if (!unique.includes(p)) unique.push(p);
  });
  return unique;
}

function initVennLab() {
  const opButtons = document.querySelectorAll('.op-btn');
  opButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.click();
      opButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentVennOp = btn.getAttribute('data-op');
      
      // Track tested operations for badge
      appState.vennOpsTested[currentVennOp] = true;
      const allTested = Object.values(appState.vennOpsTested).every(Boolean);
      if (allTested) {
        unlockBadge('venn');
      }

      renderVennDiagram();
    });
  });

  const btnUpdate = document.getElementById('btnUpdateVenn');
  if (btnUpdate) {
    btnUpdate.addEventListener('click', () => {
      sound.click();
      renderVennDiagram();
    });
  }

  renderVennDiagram();
}

function renderVennDiagram() {
  const canvas = document.getElementById('vennCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Clear canvas
  ctx.clearRect(0, 0, w, h);

  // Parse elements
  const inputA = document.getElementById('inputA').value;
  const inputB = document.getElementById('inputB').value;
  const setA = parseSetInput(inputA);
  const setB = parseSetInput(inputB);

  // Compute intersections and differences
  const onlyA = setA.filter(x => !setB.includes(x));
  const onlyB = setB.filter(x => !setA.includes(x));
  const interAB = setA.filter(x => setB.includes(x));
  const unionAB = [...onlyA, ...interAB, ...onlyB];

  // Circle geometry
  const r = 95;
  const cxA = w / 2 - 62;
  const cxB = w / 2 + 62;
  const cy = h / 2 - 10;

  // 1. Shading depending on current operation
  // We draw with clipping paths to precisely highlight regions
  ctx.save();
  if (currentVennOp === 'intersect') {
    // Only intersection region
    ctx.save();
    ctx.beginPath();
    ctx.arc(cxA, cy, r, 0, Math.PI * 2);
    ctx.clip();
    ctx.beginPath();
    ctx.arc(cxB, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.45)'; // Emerald Glow
    ctx.fill();
    ctx.restore();
  } else if (currentVennOp === 'union') {
    // Both circles
    ctx.beginPath();
    ctx.arc(cxA, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)'; // Cyan
    ctx.fill();

    ctx.beginPath();
    ctx.arc(cxB, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.35)'; // Rose
    ctx.fill();
  } else if (currentVennOp === 'diffAB') {
    // Only A without B
    ctx.save();
    ctx.beginPath();
    ctx.arc(cxA, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.45)';
    ctx.fill();

    // Cut out B
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cxB, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else if (currentVennOp === 'diffBA') {
    // Only B without A
    ctx.save();
    ctx.beginPath();
    ctx.arc(cxB, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.45)';
    ctx.fill();

    // Cut out A
    ctx.globalCompositeOperation = 'destination-out';
    ctx.beginPath();
    ctx.arc(cxA, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();

  // 2. Draw circle boundaries
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#38bdf8'; // Border A
  ctx.beginPath();
  ctx.arc(cxA, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#f43f5e'; // Border B
  ctx.beginPath();
  ctx.arc(cxB, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // 3. Labels for sets
  ctx.font = 'bold 16px "Inter", sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('Tập A', cxA - 60, cy - r - 8);

  ctx.fillStyle = '#f43f5e';
  ctx.fillText('Tập B', cxB + 20, cy - r - 8);

  // 4. Draw elements inside regions
  ctx.font = '13px "Inter", sans-serif';
  ctx.textAlign = 'center';

  // Elements only in A
  ctx.fillStyle = '#bae6fd';
  const strOnlyA = onlyA.length > 0 ? onlyA.slice(0, 7).join(', ') : '∅';
  ctx.fillText(strOnlyA, cxA - 38, cy);

  // Elements in Intersection
  ctx.fillStyle = '#6ee7b7';
  const strInter = interAB.length > 0 ? interAB.slice(0, 5).join(', ') : '∅';
  ctx.fillText(strInter, w / 2, cy);

  // Elements only in B
  ctx.fillStyle = '#fecdd3';
  const strOnlyB = onlyB.length > 0 ? onlyB.slice(0, 7).join(', ') : '∅';
  ctx.fillText(strOnlyB, cxB + 38, cy);

  // 5. Update UI Labels & Math Result
  document.getElementById('lblCountA').textContent = setA.length;
  document.getElementById('lblCountInter').textContent = interAB.length;
  document.getElementById('lblCountB').textContent = setB.length;

  const resTitle = document.getElementById('vennOpTitle');
  const resSet = document.getElementById('vennResultSet');
  const resFormula = document.getElementById('vennFormulaText');

  let resultSetText = '';
  let formulaText = '';

  if (currentVennOp === 'intersect') {
    resTitle.textContent = 'Kết quả Giao: A ∩ B';
    resultSetText = interAB.length > 0 ? `$A \\cap B = \\{${interAB.join('; ')}\\}$` : `$A \\cap B = \\emptyset$`;
    formulaText = `Số phần tử: $n(A \\cap B) = ${interAB.length}$. Gồm các phần tử vừa thuộc A, vừa thuộc B.`;
  } else if (currentVennOp === 'union') {
    resTitle.textContent = 'Kết quả Hợp: A ∪ B';
    resultSetText = unionAB.length > 0 ? `$A \\cup B = \\{${unionAB.join('; ')}\\}$` : `$A \\cup B = \\emptyset$`;
    formulaText = `Công thức vàng: $n(A \\cup B) = n(A) + n(B) - n(A \\cap B) = ${setA.length} + ${setB.length} - ${interAB.length} = ${unionAB.length}$.`;
  } else if (currentVennOp === 'diffAB') {
    resTitle.textContent = 'Kết quả Hiệu: A \\ B';
    resultSetText = onlyA.length > 0 ? `$A \\setminus B = \\{${onlyA.join('; ')}\\}$` : `$A \\setminus B = \\emptyset$`;
    formulaText = `Số phần tử: $n(A \\setminus B) = ${onlyA.length}$. Gồm các phần tử thuộc A nhưng không thuộc B.`;
  } else if (currentVennOp === 'diffBA') {
    resTitle.textContent = 'Kết quả Hiệu: B \\ A';
    resultSetText = onlyB.length > 0 ? `$B \\setminus A = \\{${onlyB.join('; ')}\\}$` : `$B \\setminus A = \\emptyset$`;
    formulaText = `Số phần tử: $n(B \\setminus A) = ${onlyB.length}$. Gồm các phần tử thuộc B nhưng không thuộc A.`;
  }

  resSet.innerHTML = formatMathText(resultSetText);
  resFormula.innerHTML = formatMathText(formulaText);
}

// --- 5. LAB 2: MÁY BIỂU DIỄN TRỤC SỐ KHOẢNG & ĐOẠN TƯƠNG TÁC ---
let currentNumOp = 'intersect';

function initNumberLineLab() {
  const numOpButtons = document.querySelectorAll('.num-op-btn');
  numOpButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.click();
      numOpButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentNumOp = btn.getAttribute('data-numop');
      appState.numberLineTested = true;
      unlockBadge('interval');
      renderNumberLine();
    });
  });

  const controls = ['bracketA1', 'valA1', 'valA2', 'bracketA2', 'bracketB1', 'valB1', 'valB2', 'bracketB2'];
  controls.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('change', () => {
        sound.click();
        appState.numberLineTested = true;
        unlockBadge('interval');
        renderNumberLine();
      });
      el.addEventListener('input', () => {
        renderNumberLine();
      });
    }
  });

  renderNumberLine();
}

function renderNumberLine() {
  const canvas = document.getElementById('numLineCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Clear
  ctx.clearRect(0, 0, w, h);

  // Read inputs
  const brA1 = document.getElementById('bracketA1').value;
  const a1 = parseFloat(document.getElementById('valA1').value) || -2;
  const a2 = parseFloat(document.getElementById('valA2').value) || 3;
  const brA2 = document.getElementById('bracketA2').value;

  const brB1 = document.getElementById('bracketB1').value;
  const b1 = parseFloat(document.getElementById('valB1').value) || 0;
  const b2 = parseFloat(document.getElementById('valB2').value) || 5;
  const brB2 = document.getElementById('bracketB2').value;

  // Axis geometry
  const minVal = -6;
  const maxVal = 8;
  const leftX = 40;
  const rightX = w - 40;
  const axisY = h / 2;

  function toPx(val) {
    return leftX + ((val - minVal) / (maxVal - minVal)) * (rightX - leftX);
  }

  // 1. Draw Main Horizontal Real Axis (R)
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(leftX, axisY);
  ctx.lineTo(rightX, axisY);
  ctx.stroke();

  // Arrow Head
  ctx.fillStyle = '#94a3b8';
  ctx.beginPath();
  ctx.moveTo(rightX + 6, axisY);
  ctx.lineTo(rightX - 10, axisY - 6);
  ctx.lineTo(rightX - 10, axisY + 6);
  ctx.closePath();
  ctx.fill();

  // Label R
  ctx.font = 'bold 16px "Inter", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('ℝ', rightX + 16, axisY + 5);

  // 2. Draw Ticks from minVal to maxVal
  ctx.font = '12px "Inter", sans-serif';
  ctx.textAlign = 'center';
  for (let v = minVal; v <= maxVal; v += 2) {
    const x = toPx(v);
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, axisY - 5);
    ctx.lineTo(x, axisY + 5);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.fillText(v.toString(), x, axisY + 22);
  }

  // 3. Highlight and hatch based on current operation
  // Compute resulting set interval on R
  // Interval A: [a1, a2], Interval B: [b1, b2]
  const realA1 = Math.min(a1, a2);
  const realA2 = Math.max(a1, a2);
  const realB1 = Math.min(b1, b2);
  const realB2 = Math.max(b1, b2);

  let resStart, resEnd, resBr1, resBr2;
  let isEmpty = false;
  let opSymbol = '';

  if (currentNumOp === 'intersect') {
    opSymbol = '\\cap';
    resStart = Math.max(realA1, realB1);
    resEnd = Math.min(realA2, realB2);
    if (resStart > resEnd) {
      isEmpty = true;
    } else if (resStart === resEnd) {
      // Single point check
      const leftClosed = (resStart === realA1 ? brA1 === '[' : brB1 === '[') && (resStart === realB1 ? brB1 === '[' : brA1 === '[');
      const rightClosed = (resEnd === realA2 ? brA2 === ']' : brB2 === ']') && (resEnd === realB2 ? brB2 === ']' : brA2 === ']');
      if (!leftClosed || !rightClosed) isEmpty = true;
    }
    resBr1 = resStart === realA1 ? brA1 : brB1;
    resBr2 = resEnd === realA2 ? brA2 : brB2;
  } else if (currentNumOp === 'union') {
    opSymbol = '\\cup';
    resStart = Math.min(realA1, realB1);
    resEnd = Math.max(realA2, realB2);
    resBr1 = resStart === realA1 ? brA1 : brB1;
    resBr2 = resEnd === realA2 ? brA2 : brB2;
  } else if (currentNumOp === 'diffAB') {
    opSymbol = '\\setminus';
    // Simplified representation for visual highlighting
    resStart = realA1;
    resEnd = realA2;
    resBr1 = brA1;
    resBr2 = brA2;
  }

  // Hatching excluded areas
  function drawHatch(x1, x2) {
    if (x2 <= x1) return;
    ctx.save();
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.lineWidth = 1.2;
    for (let x = x1; x <= x2; x += 8) {
      ctx.beginPath();
      ctx.moveTo(x - 6, axisY - 14);
      ctx.lineTo(x + 6, axisY + 14);
      ctx.stroke();
    }
    ctx.restore();
  }

  // Function to draw standard bracket glyph
  function drawBracket(type, x, color) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (type === '[') {
      ctx.moveTo(x + 6, axisY - 18);
      ctx.lineTo(x, axisY - 18);
      ctx.lineTo(x, axisY + 18);
      ctx.lineTo(x + 6, axisY + 18);
    } else if (type === ']') {
      ctx.moveTo(x - 6, axisY - 18);
      ctx.lineTo(x, axisY - 18);
      ctx.lineTo(x, axisY + 18);
      ctx.lineTo(x - 6, axisY + 18);
    } else if (type === '(') {
      ctx.arc(x + 12, axisY, 18, Math.PI * 0.75, Math.PI * 1.25);
    } else if (type === ')') {
      ctx.arc(x - 12, axisY, 18, -Math.PI * 0.25, Math.PI * 0.25);
    }
    ctx.stroke();
    ctx.restore();
  }

  // Draw Intervals on axis
  if (!isEmpty) {
    const pxStart = toPx(resStart);
    const pxEnd = toPx(resEnd);

    // Hatch left excluded
    drawHatch(leftX, pxStart);
    // Hatch right excluded
    drawHatch(pxEnd, rightX);

    // Highlight valid segment
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#10b981'; // Emerald active
    ctx.beginPath();
    ctx.moveTo(pxStart, axisY);
    ctx.lineTo(pxEnd, axisY);
    ctx.stroke();

    // Draw Brackets
    drawBracket(resBr1, pxStart, '#38bdf8');
    drawBracket(resBr2, pxEnd, '#38bdf8');

    // Values below brackets
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px "Inter", sans-serif';
    ctx.fillText(resStart.toString(), pxStart, axisY - 26);
    ctx.fillText(resEnd.toString(), pxEnd, axisY - 26);
  } else {
    // Completely hatched if empty
    drawHatch(leftX, rightX);
  }

  // Update Result text
  const resBox = document.getElementById('numLineResultBox');
  if (resBox) {
    const strA = `${brA1}${realA1}; ${realA2}${brA2}`;
    const strB = `${brB1}${realB1}; ${realB2}${brB2}`;
    let resultMath = '';

    if (isEmpty) {
      resultMath = `Cho $A = ${strA}$ và $B = ${strB}$. Kết quả phép toán $A ${opSymbol} B = \\emptyset$ (Tập rỗng, hai tập hợp không có điểm chung).`;
    } else {
      const resStr = `${resBr1}${resStart}; ${resEnd}${resBr2}`;
      resultMath = `Cho $A = ${strA}$ và $B = ${strB}$. Kết quả phép toán $A ${opSymbol} B = ${resStr}$.`;
    }

    resBox.innerHTML = formatMathText(resultMath);
  }
}

// --- 6. TAB 3: ĐẤU TRƯỜNG SGK (10 CÂU HỎI TRANG 19) ---
const arenaQuestions = [
  {
    id: 1,
    sgkRef: 'SGK Bài 1.8 & 1.9',
    text: 'Kí hiệu $E$ là tập hợp các quốc gia tại khu vực Đông Nam Á. Trong các mệnh đề sau, mệnh đề nào là **đúng**?',
    options: [
      { text: 'A. $\\text{Việt Nam} \\in E$', correct: true },
      { text: 'B. $\\text{Mĩ} \\in E$', correct: false },
      { text: 'C. $\\text{Anh} \\in E$', correct: false },
      { text: 'D. $\\text{Nhật Bản} \\in E$', correct: false }
    ],
    explanation: 'Việt Nam là một quốc gia độc lập thuộc khu vực Đông Nam Á, do đó phần tử "Việt Nam" thuộc tập hợp $E$, viết là $\\text{Việt Nam} \\in E$. Mĩ, Anh và Nhật Bản không thuộc khu vực Đông Nam Á.'
  },
  {
    id: 2,
    sgkRef: 'SGK Bài 1.10a',
    text: 'Cho tập hợp $A = \\{x \\in \\mathbb{N} \\mid x \\text{ là ước chung của } 12 \\text{ và } 18\\}$. Dạng liệt kê các phần tử của tập hợp $A$ là:',
    options: [
      { text: 'A. $A = \\{1; 2; 3; 6\\}$', correct: true },
      { text: 'B. $A = \\{1; 2; 3; 4; 6\\}$', correct: false },
      { text: 'C. $A = \\{2; 3; 6\\}$', correct: false },
      { text: 'D. $A = \\{1; 2; 3; 6; 12; 18\\}$', correct: false }
    ],
    explanation: 'Các ước tự nhiên của $12$ là $\\{1; 2; 3; 4; 6; 12\\}$. Các ước tự nhiên của $18$ là $\\{1; 2; 3; 6; 9; 18\\}$. Do đó tập hợp các ước chung của $12$ và $18$ là $A = \\{1; 2; 3; 6\\}$.'
  },
  {
    id: 3,
    sgkRef: 'SGK Bài 1.10b',
    text: 'Cho tập hợp $B = \\{x \\in \\mathbb{R} \\mid 2x^2 - 5x + 2 = 0\\}$. Số phần tử của tập hợp $B$ là:',
    options: [
      { text: 'A. $n(B) = 2$ với $B = \\{\\frac{1}{2}; 2\\}$', correct: true },
      { text: 'B. $n(B) = 1$ với $B = \\{2\\}$', correct: false },
      { text: 'C. $n(B) = 0$ ($B = \\emptyset$)', correct: false },
      { text: 'D. $n(B) = 2$ với $B = \\{-2; -\\frac{1}{2}\\}$', correct: false }
    ],
    explanation: 'Giải phương trình bậc hai $2x^2 - 5x + 2 = 0$: Biệt thức $\\Delta = (-5)^2 - 4 \\cdot 2 \\cdot 2 = 25 - 16 = 9 > 0$. Phương trình có hai nghiệm thực phân biệt là $x_1 = 2$ và $x_2 = \\frac{1}{2}$. Vậy $B = \\{\\frac{1}{2}; 2\\}$ và $n(B) = 2$.'
  },
  {
    id: 4,
    sgkRef: 'SGK Bài 1.11b',
    text: 'Tập hợp tất cả các nghiệm thực của bất phương trình $2x + 1 > 0$ được biểu diễn dưới dạng khoảng là:',
    options: [
      { text: 'A. $(-\\frac{1}{2}; +\\infty)$', correct: true },
      { text: 'B. $[-\\frac{1}{2}; +\\infty)$', correct: false },
      { text: 'C. $(-\\infty; -\\frac{1}{2})$', correct: false },
      { text: 'D. $(\\frac{1}{2}; +\\infty)$', correct: false }
    ],
    explanation: 'Ta có $2x + 1 > 0 \\Leftrightarrow 2x > -1 \\Leftrightarrow x > -\\frac{1}{2}$. Vì là dấu lớn hơn ngặt ($>$) nên mút $-\\frac{1}{2}$ dùng ngoặc tròn $($ $)$. Tập nghiệm là khoảng $(-\\frac{1}{2}; +\\infty)$.'
  },
  {
    id: 5,
    sgkRef: 'SGK Bài 1.12',
    text: 'Trong các tập hợp sau, tập hợp nào là **tập hợp rỗng** (kí hiệu $\\emptyset$)?',
    options: [
      { text: 'A. $B = \\{x \\in \\mathbb{R} \\mid x^2 + 1 = 0\\}$', correct: true },
      { text: 'B. $A = \\{x \\in \\mathbb{R} \\mid x^2 - 1 = 0\\}$', correct: false },
      { text: 'C. $C = \\{x \\in \\mathbb{Z} \\mid x^2 - 4 = 0\\}$', correct: false },
      { text: 'D. $D = \\{x \\in \\mathbb{Q} \\mid 2x - 3 = 0\\}$', correct: false }
    ],
    explanation: 'Với mọi số thực $x \\in \\mathbb{R}$, ta luôn có $x^2 \\ge 0 \\Rightarrow x^2 + 1 \\ge 1 > 0$. Do đó phương trình $x^2 + 1 = 0$ vô nghiệm trên $\\mathbb{R}$, tức tập hợp $B$ không chứa phần tử nào ($B = \\emptyset$).'
  },
  {
    id: 6,
    sgkRef: 'SGK Bài 1.13',
    text: 'Cho $A = \\{2; 5\\}$, $B = \\{5; x\\}$, $C = \\{x; y; 5\\}$. Để $A = B = C$ thì các giá trị của $x$ và $y$ phải thỏa mãn:',
    options: [
      { text: 'A. $x = 2$ và $y \\in \\{2; 5\\}$', correct: true },
      { text: 'B. $x = 5$ và $y = 2$', correct: false },
      { text: 'C. $x = 2$ và $y = 0$', correct: false },
      { text: 'D. $x = 5$ và $y = 5$', correct: false }
    ],
    explanation: 'Để $A = B$ thì phần tử $x$ trong $B$ phải bằng $2$, khi đó $A = B = \\{2; 5\\}$. Để $C = \\{2; y; 5\\} = \\{2; 5\\}$ thì phần tử $y$ chỉ có thể nhận giá trị $2$ hoặc $5$ (do trong tập hợp, các phần tử trùng lặp chỉ tính là một).'
  },
  {
    id: 7,
    sgkRef: 'SGK Bài 1.14',
    text: 'Cho $A = \\{x \\in \\mathbb{Z} \\mid x^2 < 4\\}$ và $B = \\{x \\in \\mathbb{Z} \\mid (5x - 3x^2)(x^2 - 2x - 3) = 0\\}$. Khi đó tập giao $A \\cap B$ và tập hiệu $A \\setminus B$ lần lượt là:',
    options: [
      { text: 'A. $A \\cap B = \\{-1; 0\\}$ và $A \\setminus B = \\{1\\}$', correct: true },
      { text: 'B. $A \\cap B = \\{1\\}$ và $A \\setminus B = \\{-1; 0\\}$', correct: false },
      { text: 'C. $A \\cap B = \\{-1; 0; 1; 3\\}$ và $A \\setminus B = \\{3\\}$', correct: false },
      { text: 'D. $A \\cap B = \\emptyset$ và $A \\setminus B = \\{-1; 0; 1\\}$', correct: false }
    ],
    explanation: '• $x^2 < 4 \\Leftrightarrow -2 < x < 2$, vì $x \\in \\mathbb{Z}$ nên $A = \\{-1; 0; 1\\}$.<br>• $(5x - 3x^2)(x^2 - 2x - 3) = 0 \\Rightarrow x \\in \\{0; \\frac{5}{3}; -1; 3\\}$. Do $x \\in \\mathbb{Z}$ nên $B = \\{-1; 0; 3\\}$.<br>• Giao $A \\cap B$ gồm các phần tử chung: $\\{-1; 0\\}$.<br>• Hiệu $A \\setminus B$ gồm các phần tử thuộc $A$ nhưng không thuộc $B$: $\\{1\\}$.'
  },
  {
    id: 8,
    sgkRef: 'SGK Bài 1.15a',
    text: 'Cho hai tập con của số thực $\\mathbb{R}$ là $A = (-1; 3)$ và $B = [0; 5]$. Giao của hai tập hợp $A \\cap B$ là:',
    options: [
      { text: 'A. $[0; 3)$', correct: true },
      { text: 'B. $(-1; 5]$', correct: false },
      { text: 'C. $(0; 3)$', correct: false },
      { text: 'D. $[-1; 3]$', correct: false }
    ],
    explanation: 'Phần tử $x \\in A \\cap B$ khi và chỉ khi $-1 < x < 3$ và $0 \\le x \\le 5$. Kết hợp hai điều kiện ta được $0 \\le x < 3$. Do đó $A \\cap B = [0; 3)$ (nửa khoảng đóng tại 0 và mở tại 3).'
  },
  {
    id: 9,
    sgkRef: 'SGK Bài 1.15c,d',
    text: 'Cho hai tập hợp $A = (-\\infty; 2)$ và $B = [2; +\\infty)$. Kết quả của phép hợp $A \\cup B$ và phép giao $A \\cap B$ lần lượt là:',
    options: [
      { text: 'A. $A \\cup B = \\mathbb{R}$ và $A \\cap B = \\emptyset$', correct: true },
      { text: 'B. $A \\cup B = \\mathbb{R}$ và $A \\cap B = \\{2\\}$', correct: false },
      { text: 'C. $A \\cup B = (-\\infty; 2]$ và $A \\cap B = \\emptyset$', correct: false },
      { text: 'D. $A \\cup B = \\emptyset$ và $A \\cap B = \\mathbb{R}$', correct: false }
    ],
    explanation: '• Vì $(-\\infty; 2) \\cup [2; +\\infty)$ chứa tất cả các số thực nhỏ hơn 2 và từ 2 trở lên nên hợp lại phủ kín toàn bộ trục số thực: $A \\cup B = \\mathbb{R}$.<br>• Không có số thực nào vừa nhỏ hơn 2 vừa lớn hơn hoặc bằng 2, do đó giao là tập rỗng: $A \\cap B = \\emptyset$.'
  },
  {
    id: 10,
    sgkRef: 'SGK Bài 1.16',
    text: 'Một nhóm thợ gồm 15 công nhân, trong đó có 8 thợ xây, 7 thợ sơn và 3 thợ làm được cả hai việc xây và sơn. Hỏi có bao nhiêu công nhân **không làm cả hai việc** xây và sơn?',
    options: [
      { text: 'A. 3 công nhân', correct: true },
      { text: 'B. 0 công nhân', correct: false },
      { text: 'C. 5 công nhân', correct: false },
      { text: 'D. 2 công nhân', correct: false }
    ],
    explanation: 'Gọi $A$ là tập các thợ xây ($n(A) = 8$), $B$ là tập các thợ sơn ($n(B) = 7$).<br>Số thợ làm được cả hai việc là $n(A \\cap B) = 3$.<br>Số thợ làm được ít nhất một việc (xây hoặc sơn) là: $n(A \\cup B) = n(A) + n(B) - n(A \\cap B) = 8 + 7 - 3 = 12$ công nhân.<br>Số công nhân không làm cả hai việc là: $15 - 12 = 3$ công nhân.'
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
        // Complete Arena
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

  // Header progress
  document.getElementById('arenaProgressText').textContent = `Câu hỏi ${arenaCurrentIndex + 1} / ${arenaQuestions.length} (${q.sgkRef})`;
  document.getElementById('arenaScoreText').textContent = `Tổng XP: ${appState.xp}`;

  // Question body
  const qEl = document.getElementById('arenaQuestion');
  qEl.innerHTML = formatMathText(q.text);

  // Options
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

    // Check Arena Badge
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
      <div style="font-size: 0.9rem;">Gợi ý: Đọc kỹ điều kiện bài toán và định nghĩa tập hợp để chọn phương án đúng.</div>
    `;
  }
}

function showArenaSummary() {
  const qEl = document.getElementById('arenaQuestion');
  qEl.innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <h2 style="color: #10b981; margin-bottom: 12px;">🎉 CHÚC MỪNG BẠN ĐÃ VƯỢT QUA ĐẤU TRƯỜNG!</h2>
      <p style="font-size: 1.05rem; color: var(--text-secondary); margin-bottom: 16px;">
        Bạn đã hoàn thành toàn bộ 10 câu hỏi bao phủ 100% bài tập SGK Bài 2 (Trang 19).
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

  // Sound Toggle
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

  // Reset Progress
  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn đặt lại toàn bộ tiến trình học tập của Bài 2 không?')) {
        sound.click();
        localStorage.removeItem(STATE_KEY);
        appState = { ...defaultState };
        saveState();
        updateHUD();
        initArena();
        renderVennDiagram();
        renderNumberLine();
      }
    });
  }
}

// --- 8. KHỞI CHẠY KHI TẢI TRANG ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateHUD();
  initTabs();
  initVennLab();
  initNumberLineLab();
  initArena();
  initModals();

  // 100% MathML formulas rendered automatically
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
