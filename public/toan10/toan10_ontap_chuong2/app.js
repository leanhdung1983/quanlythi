/* ================================================================
   BÀI TẬP CUỐI CHƯƠNG II: BẤT PHƯƠNG TRÌNH & HỆ BPT - TOÁN 10
   Bộ sách: Kết Nối Tri Thức Với Cuộc Sống (Trang 31 - 32)
   Pure Vanilla JS • Web Audio API • 2D Canvas Oxy • MathML Offline
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

// --- 2. QUẢN LÝ TIẾN TRÌNH & DỮ LIỆU ÔN TẬP CHƯƠNG II ---
const STATE_KEY = 'toan10_ontap_chuong2_state';

const defaultState = {
  xp: 0,
  streak: 0,
  maxStreak: 0,
  stars: 2,
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Quy Hoạch Tuyến Tính',
  soundEnabled: true,
  currentTab: 'theory',
  answeredQuestions: {},
  currentQuestionIndex: 0,
  badges: {
    identify: false,
    graph: false,
    ad: false,
    arena: false,
    master: false
  },
  graphTested: false,
  adTested: false
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

    const { identify, graph, ad, arena } = appState.badges;
    if (identify && graph && ad && arena && !appState.badges.master) {
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
      certTitleEl.textContent = 'ĐẠI KIỆN TƯỚNG TOÀN NĂNG CHƯƠNG II 🏅';
    } else if (appState.xp >= 160) {
      certTitleEl.textContent = 'CHIẾN THẦN QUY HOẠCH TUYẾN TÍNH 🌟';
    } else {
      certTitleEl.textContent = 'KIỆN TƯỚNG TỔNG ÔN CHƯƠNG II 🎯';
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
        unlockBadge('identify');
      } else if (tabTarget === 'labs') {
        renderGraphCanvas();
        renderAdCanvas();
      }
    });
  });
}

// --- 4. LAB 1: MÁY NHẬN DẠNG ĐỒ THỊ & THỬ NGHIỆM ĐIỂM (SGK 2.9 & 2.11) ---
let currentSelectedPoint = { name: 'D', x: -3, y: 1 };

function initGraphLab() {
  const btns = document.querySelectorAll('.op-btn[data-point]');
  btns.forEach(b => {
    b.addEventListener('click', () => {
      sound.click();
      btns.forEach(btn => btn.classList.remove('active'));
      b.classList.add('active');

      const raw = b.getAttribute('data-point').split(',');
      const px = parseFloat(raw[0]);
      const py = parseFloat(raw[1]);
      let pName = 'D';
      if (px === 0 && py === 0) pName = 'A';
      else if (px === -2 && py === 1) pName = 'B';
      else if (px === 3 && py === -1) pName = 'C';

      currentSelectedPoint = { name: pName, x: px, y: py };
      appState.graphTested = true;
      unlockBadge('graph');
      renderGraphCanvas();
    });
  });

  renderGraphCanvas();
}

function renderGraphCanvas() {
  const canvas = document.getElementById('graphCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const scale = 40;

  function toPx(x, y) {
    return {
      x: cx + x * scale,
      y: cy - y * scale
    };
  }

  // 1. Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let i = -6; i <= 6; i++) {
    const p1 = toPx(i, -5);
    const p2 = toPx(i, 5);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    const p3 = toPx(-6, i);
    const p4 = toPx(6, i);
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.stroke();
  }

  // 2. Axes Ox, Oy
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(15, cy);
  ctx.lineTo(w - 15, cy);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(cx, h - 15);
  ctx.lineTo(cx, 15);
  ctx.stroke();

  ctx.font = 'bold 12px "Inter", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('x', w - 16, cy + 16);
  ctx.fillText('y', cx + 10, 20);
  ctx.fillText('O', cx - 14, cy + 16);

  // 3. Shading Half-Plane for x - y < 3 (Contains O(0;0))
  // Line: x - y = 3 => y = x - 3
  // Passes through (3; 0) and (0; -3)
  ctx.save();
  const step = 8;
  for (let px = 0; px < w; px += step) {
    for (let py = 0; py < h; py += step) {
      const vx = (px + step / 2 - cx) / scale;
      const vy = (cy - (py + step / 2)) / scale;
      if (vx - vy < 3) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.18)'; // Green Solution
        ctx.fillRect(px, py, step, step);
      } else {
        // Red slanted hatch
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.22)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py + step);
        ctx.lineTo(px + step, py);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // 4. Boundary Line x - y = 3 (Dashed)
  ctx.save();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  ctx.setLineDash([6, 6]); // Dashed because < is strict
  const lp1 = toPx(-6, -6 - 3);
  const lp2 = toPx(6, 6 - 3);
  ctx.beginPath();
  ctx.moveTo(lp1.x, lp1.y);
  ctx.lineTo(lp2.x, lp2.y);
  ctx.stroke();
  ctx.restore();

  // Mark Intercepts
  const pX3 = toPx(3, 0);
  const pYneg3 = toPx(0, -3);
  ctx.fillStyle = '#38bdf8';
  ctx.fillText('3', pX3.x - 4, pX3.y + 16);
  ctx.fillText('-3', pYneg3.x + 8, pYneg3.y + 4);

  // 5. Draw Selected Point
  const pt = currentSelectedPoint;
  const pCanvas = toPx(pt.x, pt.y);

  // System 2.11: { x - y < -3 ; 2y >= -4 }
  const cond1 = pt.x - pt.y < -3;
  const cond2 = 2 * pt.y >= -4;
  const isSysSolution = cond1 && cond2;

  ctx.beginPath();
  ctx.arc(pCanvas.x, pCanvas.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = isSysSolution ? '#10b981' : '#f43f5e';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px "Inter", sans-serif';
  ctx.fillText(`${pt.name}(${pt.x}; ${pt.y})`, pCanvas.x + 10, pCanvas.y - 6);

  // 6. Update Evaluation Text Box
  const titleEl = document.getElementById('evalTitle');
  const descEl = document.getElementById('evalDesc');
  const boxEl = document.getElementById('pointEvalBox');

  if (titleEl && descEl && boxEl) {
    if (isSysSolution) {
      titleEl.textContent = `KẾT QUẢ ĐIỂM ${pt.name}(${pt.x}; ${pt.y}): LÀ NGHIỆM CHUẨN ✅`;
      titleEl.style.color = '#10b981';
      boxEl.style.borderLeftColor = '#10b981';
    } else {
      titleEl.textContent = `KẾT QUẢ ĐIỂM ${pt.name}(${pt.x}; ${pt.y}): KHÔNG PHẢI NGHIỆM ❌`;
      titleEl.style.color = '#f43f5e';
      boxEl.style.borderLeftColor = '#f43f5e';
    }

    descEl.innerHTML = formatMathText(`
      • Kiểm tra BPT 1 ($x - y < -3$): $${pt.x} - (${pt.y}) = ${pt.x - pt.y}$ ${cond1 ? '< -3$ (ĐÚNG)' : '< -3$ (SAI)'}.<br>
      • Kiểm tra BPT 2 ($2y \\ge -4$): $2(${pt.y}) = ${2 * pt.y}$ ${cond2 ? '\\ge -4$ (ĐÚNG)' : '\\ge -4$ (SAI)'}.<br>
      • <em>Kết luận SGK 2.11:</em> Điểm $${pt.name}(${pt.x}; ${pt.y})$ <strong>${isSysSolution ? 'THUỘC' : 'KHÔNG THUỘC'}</strong> miền nghiệm của hệ bất phương trình.
    `);
  }
}

// --- 5. LAB 2: TỐI ƯU CHIẾN DỊCH QUẢNG CÁO 160 TRIỆU (SGK 2.16) ---
function initAdLab() {
  const slR = document.getElementById('sliderRadio');
  const slTV = document.getElementById('sliderTV');

  function update() {
    const r = parseInt(slR.value) || 0;
    const tv = parseInt(slTV.value) || 0;
    document.getElementById('lblRadio').textContent = `${r} giây (Phát thanh)`;
    document.getElementById('lblTV').textContent = `${tv} giây (Truyền hình)`;
    appState.adTested = true;
    unlockBadge('ad');
    renderAdCanvas();
  }

  if (slR && slTV) {
    slR.addEventListener('input', update);
    slTV.addEventListener('input', update);
  }

  renderAdCanvas();
}

function renderAdCanvas() {
  const canvas = document.getElementById('adCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const x = parseInt(document.getElementById('sliderRadio').value) || 200;
  const y = parseInt(document.getElementById('sliderTV').value) || 360;

  // Cost: 80x + 400y <= 160000 (thousand VND) <=> x + 5y <= 2000
  // Max x = 900, Max y = 360
  // Efficiency: F(x, y) = x + 8y
  const totalCost = 80 * x + 400 * y;
  const efficiency = x + 8 * y;
  const isBudgetOk = totalCost <= 160000;

  // Coordinate Mapping for [0; 1000] x [0; 420]
  const originX = 65;
  const originY = h - 50;
  const scaleX = (w - 110) / 1000;
  const scaleY = (h - 80) / 420;

  function toPxA(vx, vy) {
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
  ctx.fillText('x (Phát thanh - giây)', w - 120, originY + 28);
  ctx.fillText('y (Truyền hình - giây)', originX - 55, 20);
  ctx.fillText('O', originX - 15, originY + 16);

  // Feasible Region polygon OABCD
  // Vertices: O(0,0), A(900,0), B(900, 220), C(200, 360), D(0, 360)
  const vO = toPxA(0, 0);
  const vA = toPxA(900, 0);
  const vB = toPxA(900, 220);
  const vC = toPxA(200, 360);
  const vD = toPxA(0, 360);

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(vO.x, vO.y);
  ctx.lineTo(vA.x, vA.y);
  ctx.lineTo(vB.x, vB.y);
  ctx.lineTo(vC.x, vC.y);
  ctx.lineTo(vD.x, vD.y);
  ctx.closePath();
  ctx.fillStyle = 'rgba(16, 185, 129, 0.28)';
  ctx.fill();
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.restore();

  // Optimal Point C(200; 360) Highlight
  ctx.beginPath();
  ctx.arc(vC.x, vC.y, 6, 0, Math.PI * 2);
  ctx.fillStyle = '#fbbf24';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 11px "Inter", sans-serif';
  ctx.fillText('C(200; 360) ★ Max F = 3080', vC.x + 8, vC.y - 8);

  // Plot Current Choice Point (x; y)
  const pCur = toPxA(x, y);
  ctx.beginPath();
  ctx.arc(pCur.x, pCur.y, 7, 0, Math.PI * 2);
  ctx.fillStyle = isBudgetOk ? '#10b981' : '#f43f5e';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.fillText(`M(${x}; ${y})`, pCur.x + 10, pCur.y + 4);

  // Update Status Text
  const titleEl = document.getElementById('adStatusTitle');
  const descEl = document.getElementById('adStatusDesc');
  const boxEl = document.getElementById('adStatusBox');

  if (titleEl && descEl && boxEl) {
    const isOptimal = x === 200 && y === 360;
    if (isOptimal) {
      titleEl.textContent = 'HIỆU QUẢ TỐI ƯU CỰC ĐẠI 🌟';
      titleEl.style.color = '#fbbf24';
      boxEl.style.borderLeftColor = '#fbbf24';
    } else if (isBudgetOk) {
      titleEl.textContent = 'TRONG NGÂN SÁCH HỢP LỆ ✅';
      titleEl.style.color = '#10b981';
      boxEl.style.borderLeftColor = '#10b981';
    } else {
      titleEl.textContent = 'VƯỢT QUÁ NGÂN SÁCH 160 TRIỆU ⚠️';
      titleEl.style.color = '#f43f5e';
      boxEl.style.borderLeftColor = '#f43f5e';
    }

    descEl.innerHTML = formatMathText(`
      • Tổng chi phí quảng cáo: $80 \\times ${x} + 400 \\times ${y} = ${(totalCost / 1000).toFixed(1)}$ triệu đồng (Tối đa 160 triệu).<br>
      • Điểm hiệu quả truyền thông: $F(x; y) = x + 8y = ${x} + 8 \\times ${y} = ${efficiency}$ điểm.<br>
      • <em>Định lý đỉnh:</em> Giá trị lớn nhất đạt tại đỉnh $C(200; 360)$ với <strong>${3080} điểm hiệu quả</strong> và dùng hết chính xác 160 triệu đồng!
    `);
  }
}

// --- 6. TAB 3: ĐẤU TRƯỜNG SGK (10 CÂU BÀI 2.7 - 2.16 TRANG 31-32) ---
const arenaQuestions = [
  {
    id: 1,
    sgkRef: 'SGK Bài 2.7',
    text: 'Bất phương trình nào sau đây là **bất phương trình bậc nhất hai ẩn**?',
    options: [
      { text: 'A. $x + y > 3$', correct: true },
      { text: 'B. $x^2 + y^2 \\le 4$', correct: false },
      { text: 'C. $(x - y)(3x + y) \\ge 1$', correct: false },
      { text: 'D. $y^3 - 2 \\le 0$', correct: false }
    ],
    explanation: 'Bất phương trình $x + y > 3$ có đúng hai ẩn $x, y$ đều ở bậc nhất, hệ số $a = 1, b = 1$ thỏa mãn $a^2 + b^2 = 2 \\ne 0$. Các phương án B, C, D đều chứa ẩn bậc 2 hoặc bậc 3.'
  },
  {
    id: 2,
    sgkRef: 'SGK Bài 2.8',
    text: 'Cho bất phương trình bậc nhất hai ẩn $2x + y > 3$. Khẳng định nào sau đây là **đúng**?',
    options: [
      { text: 'A. Bất phương trình đã cho có vô số nghiệm.', correct: true },
      { text: 'B. Bất phương trình đã cho có nghiệm duy nhất.', correct: false },
      { text: 'C. Bất phương trình đã cho vô nghiệm.', correct: false },
      { text: 'D. Bất phương trình đã cho có tập nghiệm là $[3; +\\infty)$.', correct: false }
    ],
    explanation: 'Miền nghiệm của bất phương trình bậc nhất hai ẩn là một nửa mặt phẳng trên mặt phẳng tọa độ $Oxy$, do đó nó luôn luôn có vô số nghiệm.'
  },
  {
    id: 3,
    sgkRef: 'SGK Bài 2.9',
    text: 'Hình vẽ nào biểu diễn đúng miền nghiệm của bất phương trình $x - y < 3$?',
    options: [
      { text: 'A. Đường thẳng nét đứt đi qua $(3; 0)$ và $(0; -3)$, miền nghiệm là nửa mặt phẳng chứa gốc tọa độ $O(0; 0)$ (Hình D).', correct: true },
      { text: 'B. Đường thẳng nét liền đi qua $(3; 0)$ và $(0; 3)$ (Hình A).', correct: false },
      { text: 'C. Đường thẳng nét đứt nhưng miền nghiệm không chứa gốc tọa độ $O$ (Hình C).', correct: false },
      { text: 'D. Đường thẳng nét liền đi qua $(0; 3)$ (Hình B).', correct: false }
    ],
    explanation: '• Đường thẳng bờ $x - y = 3$ đi qua hai điểm $(3; 0)$ và $(0; -3)$.<br>• Vì là dấu nhỏ hơn ngặt ($<$) nên đường bờ vẽ nét đứt.<br>• Thay $O(0; 0)$ vào ta có $0 - 0 = 0 < 3$ (Đúng), nên miền nghiệm chứa gốc $O(0; 0)$. Đây chính là hình vẽ D trong SGK.'
  },
  {
    id: 4,
    sgkRef: 'SGK Bài 2.10',
    text: 'Hệ bất phương trình nào sau đây là **hệ bất phương trình bậc nhất hai ẩn**?',
    options: [
      { text: 'A. $\\begin{cases} x - y < 0 \\\\ 2y \\ge 0 \\end{cases}$', correct: true },
      { text: 'B. $\\begin{cases} 3x + y^3 < 0 \\\\ x + y > 3 \\end{cases}$', correct: false },
      { text: 'C. $\\begin{cases} x + 2y < 0 \\\\ y^2 + 3 < 0 \\end{cases}$', correct: false },
      { text: 'D. $\\begin{cases} -x^3 + y < 4 \\\\ x + 2y < 1 \\end{cases}$', correct: false }
    ],
    explanation: 'Hệ A gồm hai bất phương trình có đúng 2 ẩn $x, y$ đều ở bậc nhất. Các phương án B, C, D đều chứa ẩn ở bậc cao ($y^3, y^2, x^3$).'
  },
  {
    id: 5,
    sgkRef: 'SGK Bài 2.11',
    text: 'Cho hệ bất phương trình $\\begin{cases} x - y < -3 \\\\ 2y \\ge -4 \\end{cases}$. Điểm nào sau đây thuộc miền nghiệm của hệ?',
    options: [
      { text: 'A. $D(-3; 1)$', correct: true },
      { text: 'B. $A(0; 0)$', correct: false },
      { text: 'C. $B(-2; 1)$', correct: false },
      { text: 'D. $C(3; -1)$', correct: false }
    ],
    explanation: 'Thay tọa độ điểm $D(-3; 1)$ vào hệ:<br>• $-3 - 1 = -4 < -3$ (Đúng).<br>• $2(1) = 2 \\ge -4$ (Đúng).<br>Cả hai bất phương trình đều đúng nên điểm $D(-3; 1)$ thuộc miền nghiệm của hệ.'
  },
  {
    id: 6,
    sgkRef: 'SGK Bài 2.12',
    text: 'Biến đổi tương đương bất phương trình $\\frac{x + y}{2} \\ge \\frac{2x - y + 1}{3}$ về dạng chuẩn ta được:',
    options: [
      { text: 'A. $x - 5y \\le -2$', correct: true },
      { text: 'B. $x + 5y \\ge 2$', correct: false },
      { text: 'C. $7x - y \\ge 2$', correct: false },
      { text: 'D. $x - 5y \\ge 2$', correct: false }
    ],
    explanation: 'Quy đồng mẫu số chung là 6 (nhân hai vế với 6):<br>$3(x + y) \\ge 2(2x - y + 1) \\Leftrightarrow 3x + 3y \\ge 4x - 2y + 2 \\Leftrightarrow -x + 5y \\ge 2 \\Leftrightarrow x - 5y \\le -2$.'
  },
  {
    id: 7,
    sgkRef: 'SGK Bài 2.13',
    text: 'Miền nghiệm của hệ bất phương trình $\\begin{cases} x + y < 1 \\\\ 2x - y \\ge 3 \\end{cases}$ có đường thẳng bờ nào vẽ bằng **nét đứt**?',
    options: [
      { text: 'A. Đường thẳng $x + y = 1$', correct: true },
      { text: 'B. Đường thẳng $2x - y = 3$', correct: false },
      { text: 'C. Cả hai đường thẳng đều vẽ nét liền.', correct: false },
      { text: 'D. Cả hai đường thẳng đều vẽ nét đứt.', correct: false }
    ],
    explanation: 'Bất phương trình $x + y < 1$ có dấu nhỏ hơn ngặt ($<$) nên đường bờ $x + y = 1$ không thuộc miền nghiệm và phải vẽ bằng nét đứt. Còn đường bờ $2x - y = 3$ có dấu $\\ge$ nên vẽ bằng nét liền.'
  },
  {
    id: 8,
    sgkRef: 'SGK Bài 2.14',
    text: 'Cho hệ bất phương trình $\\begin{cases} y - 2x \\le 2 \\\\ y \\le 4 \\\\ x \\le 5 \\\\ x + y \\ge -1 \\end{cases}$ xác định một miền tứ giác có 4 đỉnh. Giá trị nhỏ nhất của biểu thức $F(x; y) = -x - y$ trên miền tứ giác này là:',
    options: [
      { text: 'A. $\\min F = -9$ tại đỉnh $(5; 4)$', correct: true },
      { text: 'B. $\\min F = 1$ tại đỉnh $(-1; 0)$', correct: false },
      { text: 'C. $\\min F = 0$ tại đỉnh $(0; 0)$', correct: false },
      { text: 'D. $\\min F = -5$ tại đỉnh $(5; 0)$', correct: false }
    ],
    explanation: 'Tính giá trị $F(x; y) = -x - y$ tại các đỉnh của tứ giác:<br>Đỉnh $(5; 4)$ cho $F = -5 - 4 = -9$. Do $x \\le 5$ và $y \\le 4$ nên $-x - y \\ge -5 - 4 = -9$. Vậy giá trị nhỏ nhất của $F$ là $-9$.'
  },
  {
    id: 9,
    sgkRef: 'SGK Bài 2.15',
    text: 'Bác An đầu tư 1,2 tỉ đồng vào ba loại trái phiếu: chính phủ (lãi 7%/năm), ngân hàng (lãi 8%/năm) và doanh nghiệp (lãi 12%/năm). Để giảm thuế và rủi ro, số tiền trái phiếu chính phủ phải gấp ít nhất 3 lần trái phiếu ngân hàng, và trái phiếu doanh nghiệp không quá 200 triệu. Để lợi nhuận lớn nhất, bác An nên đầu tư vào trái phiếu doanh nghiệp mức:',
    options: [
      { text: 'A. Đúng mức tối đa 200 triệu đồng.', correct: true },
      { text: 'B. 0 đồng vì rủi ro cao.', correct: false },
      { text: 'C. 100 triệu đồng.', correct: false },
      { text: 'D. 1,2 tỉ đồng.', correct: false }
    ],
    explanation: 'Vì trái phiếu doanh nghiệp có lãi suất cao nhất (12%), nên để tối đa hóa tổng lợi nhuận, nhà đầu tư phải đầu tư vào loại này số tiền kịch trần cho phép theo quy định là 200 triệu đồng.'
  },
  {
    id: 10,
    sgkRef: 'SGK Bài 2.16',
    text: 'Trong bài toán quảng cáo 160 triệu đồng (phát thanh 80k/s, truyền hình 400k/s hiệu quả gấp 8 lần), để hiệu quả $F(x; y) = x + 8y$ lớn nhất thì công ty nên đặt thời lượng quảng cáo là:',
    options: [
      { text: 'A. $200$ giây trên phát thanh và $360$ giây trên truyền hình.', correct: true },
      { text: 'B. $900$ giây trên phát thanh và $0$ giây trên truyền hình.', correct: false },
      { text: 'C. $0$ giây trên phát thanh và $360$ giây trên truyền hình.', correct: false },
      { text: 'D. $400$ giây trên phát thanh và $200$ giây trên truyền hình.', correct: false }
    ],
    explanation: 'Miền nghiệm có các đỉnh $O(0; 0), A(900; 0), B(900; 220), C(200; 360), D(0; 360)$.<br>Tính $F = x + 8y$ tại các đỉnh:<br>• $F(A) = 900$.<br>• $F(B) = 900 + 8(220) = 2660$.<br>• $F(C) = 200 + 8(360) = 3080$.<br>• $F(D) = 8(360) = 2880$.<br>Giá trị lớn nhất đạt tại đỉnh $C(200; 360)$ với 3080 điểm hiệu quả!'
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
      <div style="font-size: 0.9rem;">Gợi ý: Kiểm tra kỹ các phép tính tọa độ và định lý đỉnh của bài toán.</div>
    `;
  }
}

function showArenaSummary() {
  const qEl = document.getElementById('arenaQuestion');
  qEl.innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <h2 style="color: #10b981; margin-bottom: 12px;">🎉 CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH TỔNG ÔN CHƯƠNG II!</h2>
      <p style="font-size: 1.05rem; color: var(--text-secondary); margin-bottom: 16px;">
        Bạn đã hoàn thành toàn bộ 10 câu hỏi bao phủ 100% bài tập cuối Chương II (Trang 31-32).
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
      if (confirm('Bạn có chắc muốn đặt lại toàn bộ tiến trình học tập của Bài tập cuối Chương II không?')) {
        sound.click();
        localStorage.removeItem(STATE_KEY);
        appState = { ...defaultState };
        saveState();
        updateHUD();
        initArena();
        renderGraphCanvas();
        renderAdCanvas();
      }
    });
  }
}

// --- 8. KHỞI CHẠY KHI TẢI TRANG ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateHUD();
  initTabs();
  initGraphLab();
  initAdLab();
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
