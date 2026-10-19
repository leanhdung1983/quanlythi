/* ================================================================
   BÀI 3: BẤT PHƯƠNG TRÌNH BẬC NHẤT HAI ẨN - TOÁN 10 TẬP 1
   Bộ sách: Kết Nối Tri Thức Với Cuộc Sống (Trang 22 - 25)
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

// --- 2. QUẢN LÝ TIẾN TRÌNH & DỮ LIỆU BÀI 3 ---
const STATE_KEY = 'toan10_bai3_bpt_state';

const defaultState = {
  xp: 0,
  streak: 0,
  maxStreak: 0,
  stars: 2,
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Kiện Tướng Tọa Độ & Miền Nghiệm',
  soundEnabled: true,
  currentTab: 'theory',
  answeredQuestions: {},
  currentQuestionIndex: 0,
  badges: {
    def: false,
    plane: false,
    cinema: false,
    arena: false,
    master: false
  },
  planeTested: false,
  cinemaTested: false
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

    const { def, plane, cinema, arena } = appState.badges;
    if (def && plane && cinema && arena && !appState.badges.master) {
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
      certTitleEl.textContent = 'ĐẠI KIỆN TƯỚNG BẤT PHƯƠNG TRÌNH XUẤT SẮC 🏅';
    } else if (appState.xp >= 160) {
      certTitleEl.textContent = 'CHIẾN THẦN MIỀN NGHIỆM OXY 🌟';
    } else {
      certTitleEl.textContent = 'KIỆN TƯỚNG TỌA ĐỘ VÀ MIỀN NGHIỆM 🎯';
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
        unlockBadge('def');
      } else if (tabTarget === 'labs') {
        renderPlaneCanvas();
        renderCinemaCanvas();
      }
    });
  });
}

// --- 4. LAB 1: MÁY VẼ MIỀN NGHIỆM OXY TƯƠNG TÁC ---
function initPlaneLab() {
  const btn = document.getElementById('btnUpdatePlane');
  if (btn) {
    btn.addEventListener('click', () => {
      sound.click();
      appState.planeTested = true;
      unlockBadge('plane');
      renderPlaneCanvas();
    });
  }

  const inputs = ['coeffA', 'coeffB', 'selectIneq', 'coeffC', 'testPointX', 'testPointY'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        renderPlaneCanvas();
      });
      el.addEventListener('change', () => {
        appState.planeTested = true;
        unlockBadge('plane');
        renderPlaneCanvas();
      });
    }
  });

  renderPlaneCanvas();
}

function renderPlaneCanvas() {
  const canvas = document.getElementById('planeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const a = parseFloat(document.getElementById('coeffA').value) || 1;
  const b = parseFloat(document.getElementById('coeffB').value) || 2;
  const ineq = document.getElementById('selectIneq').value;
  const c = parseFloat(document.getElementById('coeffC').value) || 4;

  const testX = parseFloat(document.getElementById('testPointX').value) || 0;
  const testY = parseFloat(document.getElementById('testPointY').value) || 0;

  // Viewport mapping: -8 to 8 on X and Y
  const minCoord = -8;
  const maxCoord = 8;
  const cx = w / 2;
  const cy = h / 2;
  const scale = w / (maxCoord - minCoord);

  function toPx(x, y) {
    return {
      x: cx + x * scale,
      y: cy - y * scale
    };
  }

  function fromPx(pxX, pxY) {
    return {
      x: (pxX - cx) / scale,
      y: (cy - pxY) / scale
    };
  }

  // 1. Draw Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let i = minCoord; i <= maxCoord; i++) {
    const p1 = toPx(i, minCoord);
    const p2 = toPx(i, maxCoord);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();

    const p3 = toPx(minCoord, i);
    const p4 = toPx(maxCoord, i);
    ctx.beginPath();
    ctx.moveTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.stroke();
  }

  // 2. Draw Axes Ox, Oy
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 2;
  // Ox
  ctx.beginPath();
  ctx.moveTo(10, cy);
  ctx.lineTo(w - 10, cy);
  ctx.stroke();
  // Oy
  ctx.beginPath();
  ctx.moveTo(cx, h - 10);
  ctx.lineTo(cx, 10);
  ctx.stroke();

  // Axis Labels
  ctx.font = 'bold 13px "Inter", sans-serif';
  ctx.fillStyle = '#cbd5e1';
  ctx.fillText('x', w - 16, cy + 16);
  ctx.fillText('y', cx + 10, 18);
  ctx.fillText('O', cx - 14, cy + 16);

  // 3. Shading Half-Planes
  // Test if a point satisfies the inequality
  function satisfies(x, y) {
    const val = a * x + b * y;
    if (ineq === '<=') return val <= c;
    if (ineq === '<') return val < c;
    if (ineq === '>=') return val >= c;
    if (ineq === '>') return val > c;
    return false;
  }

  // Render shaded regions using sampling grid for visual perfection
  ctx.save();
  const step = 8;
  for (let px = 0; px < w; px += step) {
    for (let py = 0; py < h; py += step) {
      const coord = fromPx(px + step / 2, py + step / 2);
      if (satisfies(coord.x, coord.y)) {
        ctx.fillStyle = 'rgba(16, 185, 129, 0.22)'; // Green Solution Glow
        ctx.fillRect(px, py, step, step);
      } else {
        // Red slanted hatch
        ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(px, py + step);
        ctx.lineTo(px + step, py);
        ctx.stroke();
      }
    }
  }
  ctx.restore();

  // 4. Draw Line d: ax + by = c
  ctx.save();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2.5;
  if (ineq === '<' || ineq === '>') {
    ctx.setLineDash([6, 6]); // Dashed if strict
  } else {
    ctx.setLineDash([]);
  }

  let lineP1, lineP2;
  if (Math.abs(b) > 0.0001) {
    const yAtMinX = (c - a * minCoord) / b;
    const yAtMaxX = (c - a * maxCoord) / b;
    lineP1 = toPx(minCoord, yAtMinX);
    lineP2 = toPx(maxCoord, yAtMaxX);
  } else if (Math.abs(a) > 0.0001) {
    const xVal = c / a;
    lineP1 = toPx(xVal, minCoord);
    lineP2 = toPx(xVal, maxCoord);
  }

  if (lineP1 && lineP2) {
    ctx.beginPath();
    ctx.moveTo(lineP1.x, lineP1.y);
    ctx.lineTo(lineP2.x, lineP2.y);
    ctx.stroke();
  }
  ctx.restore();

  // 5. Draw Test Point M(testX, testY)
  const pM = toPx(testX, testY);
  ctx.beginPath();
  ctx.arc(pM.x, pM.y, 6, 0, Math.PI * 2);
  const isMSolution = satisfies(testX, testY);
  ctx.fillStyle = isMSolution ? '#10b981' : '#f43f5e';
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.font = 'bold 12px "Inter", sans-serif';
  ctx.fillText(`M(${testX}; ${testY})`, pM.x + 10, pM.y - 6);

  // 6. Update Result text
  const resText = document.getElementById('planeResultText');
  if (resText) {
    const valM = a * testX + b * testY;
    const signStr = ineq === '<=' ? '\\le' : ineq === '<' ? '<' : ineq === '>=' ? '\\ge' : '>';
    const isStrict = ineq === '<' || ineq === '>';
    const borderType = isStrict ? 'nét đứt (không kể bờ $d$)' : 'nét liền (kể cả bờ $d$)';
    
    let info = `
      • Đường thẳng bờ: $d: ${a}x + ${b}y = ${c}$ vẽ bằng <strong>${borderType}</strong>.<br>
      • Điểm thử: $M(${testX}; ${testY})$ có $${a} \\cdot (${testX}) + ${b} \\cdot (${testY}) = ${valM}$.<br>
      • So sánh: $${valM} ${signStr} ${c}$ là mệnh đề <strong>${isMSolution ? 'ĐÚNG' : 'SAI'}</strong>.<br>
      • Kết luận: Điểm $M$ <strong>${isMSolution ? 'THUỘC' : 'KHÔNG THUỘC'}</strong> miền nghiệm của bất phương trình.
    `;
    resText.innerHTML = formatMathText(info);
  }
}

// --- 5. LAB 2: MÁY MÔ PHỎNG RẠP CHIẾU PHIM ---
function initCinemaLab() {
  const slX = document.getElementById('sliderTicketX');
  const slY = document.getElementById('sliderTicketY');

  function update() {
    const x = parseInt(slX.value) || 0;
    const y = parseInt(slY.value) || 0;
    document.getElementById('lblTicketX').textContent = `${x} vé (Loại 1)`;
    document.getElementById('lblTicketY').textContent = `${y} vé (Loại 2)`;
    appState.cinemaTested = true;
    unlockBadge('cinema');
    renderCinemaCanvas();
  }

  if (slX && slY) {
    slX.addEventListener('input', update);
    slY.addEventListener('input', update);
  }

  renderCinemaCanvas();
}

function renderCinemaCanvas() {
  const canvas = document.getElementById('cinemaCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const x = parseInt(document.getElementById('sliderTicketX').value) || 150;
  const y = parseInt(document.getElementById('sliderTicketY').value) || 150;

  // Revenue: 50x + 100y (thousand VND). Breakeven line: x + 2y = 400
  const rev = 50 * x + 100 * y;
  const target = 20000; // 20 million
  const sumEq = x + 2 * y;

  const originX = 60;
  const originY = h - 50;
  const maxX = 450;
  const maxY = 250;
  const scaleX = (w - 100) / maxX;
  const scaleY = (h - 90) / maxY;

  function toPxC(vx, vy) {
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
  ctx.fillText('x (Vé Loại 1)', w - 80, originY + 28);
  ctx.fillText('y (Vé Loại 2)', originX - 45, 25);
  ctx.fillText('O', originX - 15, originY + 16);

  // Line: x + 2y = 400
  // Intercepts: A(0, 200), B(400, 0)
  const pA = toPxC(0, 200);
  const pB = toPxC(400, 0);

  // Shaded Loss Triangle OAB (x + 2y < 400)
  ctx.fillStyle = 'rgba(244, 63, 94, 0.25)'; // Red Loss Region
  ctx.beginPath();
  ctx.moveTo(originX, originY);
  ctx.lineTo(pA.x, pA.y);
  ctx.lineTo(pB.x, pB.y);
  ctx.closePath();
  ctx.fill();

  // Breakeven Boundary AB
  ctx.strokeStyle = '#fbbf24'; // Gold Line
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(pA.x, pA.y);
  ctx.lineTo(pB.x, pB.y);
  ctx.stroke();

  // Mark A & B
  ctx.fillStyle = '#fbbf24';
  ctx.fillText('A(0; 200)', pA.x + 8, pA.y);
  ctx.fillText('B(400; 0)', pB.x - 30, pB.y - 10);

  // Current Ticket Point (x, y)
  const pCur = toPxC(x, y);
  ctx.beginPath();
  ctx.arc(pCur.x, pCur.y, 7, 0, Math.PI * 2);

  let statusColor = '#10b981';
  let statusTitle = 'Tình Trạng: CÓ LÃI 🎉';
  let statusMsg = `Doanh thu đạt ${(rev / 1000).toFixed(1)} triệu đồng, vượt mức tối thiểu 20 triệu. Rạp chiếu phim sinh lời!`;

  if (sumEq < 400) {
    statusColor = '#f43f5e';
    statusTitle = 'Tình Trạng: PHẢI BÙ LỖ ⚠️';
    statusMsg = `Doanh thu chỉ đạt ${(rev / 1000).toFixed(1)} triệu đồng (dưới 20 triệu). Điểm (${x}; ${y}) nằm trong miền tam giác OAB.`;
  } else if (sumEq === 400) {
    statusColor = '#fbbf24';
    statusTitle = 'Tình Trạng: HÒA VỐN ⚖️';
    statusMsg = `Doanh thu đạt đúng 20 triệu đồng. Điểm (${x}; ${y}) nằm ngay trên đoạn thẳng hòa vốn AB!`;
  }

  ctx.fillStyle = statusColor;
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  ctx.fillStyle = '#fff';
  ctx.fillText(`M(${x}; ${y})`, pCur.x + 10, pCur.y - 6);

  // Update Status Box
  const titleEl = document.getElementById('cinemaStatusTitle');
  const descEl = document.getElementById('cinemaStatusDesc');
  const boxEl = document.getElementById('cinemaStatusBox');
  if (titleEl && descEl && boxEl) {
    titleEl.textContent = statusTitle;
    titleEl.style.color = statusColor;
    boxEl.style.borderLeftColor = statusColor;
    descEl.innerHTML = formatMathText(`
      • Tổng doanh thu: $50x + 100y = 50 \\times ${x} + 100 \\times ${y} = ${rev.toLocaleString()} \\text{ nghìn đồng}$.<br>
      • Giá trị biểu thức: $x + 2y = ${sumEq}$ (so với mốc chuẩn $400$).<br>
      • <em>Đánh giá:</em> ${statusMsg}
    `);
  }
}

// --- 6. TAB 3: ĐẤU TRƯỜNG SGK (10 CÂU BÀI 2.1 - 2.3 TRANG 25) ---
const arenaQuestions = [
  {
    id: 1,
    sgkRef: 'SGK Bài 2.1a',
    text: 'Bất phương trình nào sau đây là **bất phương trình bậc nhất hai ẩn**?',
    options: [
      { text: 'A. $2x + 3y > 6$', correct: true },
      { text: 'B. $2^2x + y \\le 0$ nhưng ẩn có dạng mũ', correct: false },
      { text: 'C. $2x^2 - y \\ge 1$', correct: false },
      { text: 'D. $x + y + z < 0$', correct: false }
    ],
    explanation: 'Bất phương trình $2x + 3y > 6$ có đúng hai ẩn $x, y$ đều ở bậc nhất, các hệ số $a = 2, b = 3$ thỏa mãn $a^2 + b^2 = 13 \\ne 0$, do đó đây là bất phương trình bậc nhất hai ẩn chuẩn mực.'
  },
  {
    id: 2,
    sgkRef: 'SGK Bài 2.1c',
    text: 'Bất phương trình $2x^2 - y \\ge 1$ **không phải** là bất phương trình bậc nhất hai ẩn vì lí do nào?',
    options: [
      { text: 'A. Ẩn $x$ có bậc 2 ($x^2$).', correct: true },
      { text: 'B. Ẩn $y$ có bậc 2.', correct: false },
      { text: 'C. Có chứa số âm.', correct: false },
      { text: 'D. Có chứa dấu $\\ge$.', correct: false }
    ],
    explanation: 'Theo định nghĩa, trong bất phương trình bậc nhất hai ẩn, mỗi ẩn số $x$ và $y$ chỉ được xuất hiện ở bậc nhất (bậc 1). Do chứa hạng tử $x^2$ nên đây là bất phương trình bậc hai, không phải bậc nhất.'
  },
  {
    id: 3,
    sgkRef: 'SGK Bài 2.1',
    text: 'Cặp số nào sau đây là một **nghiệm** của bất phương trình $2x + 3y > 6$?',
    options: [
      { text: 'A. $(2; 1)$', correct: true },
      { text: 'B. $(0; 0)$', correct: false },
      { text: 'C. $(1; 1)$', correct: false },
      { text: 'D. $(3; 0)$', correct: false }
    ],
    explanation: 'Thay $(x; y) = (2; 1)$ vào bất phương trình: $2 \\cdot 2 + 3 \\cdot 1 = 4 + 3 = 7 > 6$ (bất đẳng thức đúng). Vậy $(2; 1)$ là một nghiệm. Với $(0; 0)$ ta có $0 > 6$ (sai); với $(1; 1)$ ta có $5 > 6$ (sai); với $(3; 0)$ ta có $6 > 6$ (sai).'
  },
  {
    id: 4,
    sgkRef: 'SGK Trang 23',
    text: 'Số lượng nghiệm của một bất phương trình bậc nhất hai ẩn bất kì là:',
    options: [
      { text: 'A. Vô số nghiệm.', correct: true },
      { text: 'B. Duy nhất 1 nghiệm.', correct: false },
      { text: 'C. Đúng 2 nghiệm.', correct: false },
      { text: 'D. Luôn vô nghiệm.', correct: false }
    ],
    explanation: 'Bất phương trình bậc nhất hai ẩn luôn có tập nghiệm là một nửa mặt phẳng trên mặt phẳng tọa độ $Oxy$, do đó nó luôn có vô số nghiệm (mỗi điểm thuộc nửa mặt phẳng nghiệm là một nghiệm).'
  },
  {
    id: 5,
    sgkRef: 'SGK Trang 24',
    text: 'Khi biểu diễn miền nghiệm của bất phương trình $ax + by < c$ (dấu $<$ ngặt), đường thẳng bờ $d: ax + by = c$ được vẽ bằng:',
    options: [
      { text: 'A. Nét đứt (không kể bờ $d$).', correct: true },
      { text: 'B. Nét liền (kể cả bờ $d$).', correct: false },
      { text: 'C. Hai đường thẳng song song.', correct: false },
      { text: 'D. Nét gạch chấm chéo.', correct: false }
    ],
    explanation: 'Quy tắc chuẩn SGK: Khi bất phương trình chứa dấu ngặt ($<$ hoặc $>$), các điểm nằm trên đường thẳng bờ $d$ không thỏa mãn bất phương trình, do đó ta quy ước vẽ đường thẳng bờ $d$ bằng nét đứt.'
  },
  {
    id: 6,
    sgkRef: 'SGK Bài 2.2a',
    text: 'Khi xác định miền nghiệm của $3x + 2y \\ge 300$, ta lấy gốc tọa độ $O(0;0)$ làm điểm thử. Kết luận nào sau đây là **đúng**?',
    options: [
      { text: 'A. Miền nghiệm là nửa mặt phẳng bờ $3x + 2y = 300$ không chứa gốc $O(0;0)$.', correct: true },
      { text: 'B. Miền nghiệm là nửa mặt phẳng chứa gốc $O(0;0)$.', correct: false },
      { text: 'C. Gốc tọa độ $O(0;0)$ là một nghiệm của bất phương trình.', correct: false },
      { text: 'D. Đường thẳng bờ vẽ bằng nét đứt.', correct: false }
    ],
    explanation: 'Thay $(0; 0)$ vào vế trái: $3 \\cdot 0 + 2 \\cdot 0 = 0$. Vì $0 \\ge 300$ là sai nên gốc tọa độ $O(0;0)$ không thuộc miền nghiệm. Vậy miền nghiệm là nửa mặt phẳng bờ $3x + 2y = 300$ không chứa gốc $O$ (kể cả bờ).'
  },
  {
    id: 7,
    sgkRef: 'SGK Bài 2.2b',
    text: 'Cho bất phương trình $7x + 20y < 0$. Vì đường thẳng bờ $7x + 20y = 0$ đi qua gốc tọa độ $O(0;0)$, ta nên chọn điểm thử nào sau đây?',
    options: [
      { text: 'A. Điểm $M(0; 1)$ hoặc $N(1; 0)$.', correct: true },
      { text: 'B. Điểm gốc tọa độ $O(0; 0)$.', correct: false },
      { text: 'C. Không thể tìm được điểm thử.', correct: false },
      { text: 'D. Điểm có tọa độ vô cùng.', correct: false }
    ],
    explanation: 'Khi đường thẳng đi qua gốc tọa độ, ta không thể dùng điểm $O(0;0)$ làm điểm thử vì $O$ nằm ngay trên bờ. Do đó ta chọn một điểm thuận tiện nằm ngoài bờ như $M(0; 1)$ (thay vào ta được $20 < 0$ sai) để xác định nửa mặt phẳng nghiệm.'
  },
  {
    id: 8,
    sgkRef: 'SGK Vận dụng trang 25',
    text: 'Một công ty viễn thông tính cước 1 nghìn đồng/phút nội mạng ($x$ phút) và 2 nghìn đồng/phút ngoại mạng ($y$ phút). Bất phương trình thể hiện số tiền phải trả ít hơn 200 nghìn đồng là:',
    options: [
      { text: 'A. $x + 2y < 200$', correct: true },
      { text: 'B. $x + 2y \\le 200$', correct: false },
      { text: 'C. $2x + y < 200$', correct: false },
      { text: 'D. $x + 2y > 200$', correct: false }
    ],
    explanation: 'Số tiền gọi nội mạng là $1 \\cdot x = x$ (nghìn đồng), số tiền ngoại mạng là $2 \\cdot y = 2y$ (nghìn đồng). Tổng tiền cước là $x + 2y$. Yêu cầu "ít hơn 200 nghìn đồng" tương ứng với dấu nhỏ hơn ngặt: $x + 2y < 200$.'
  },
  {
    id: 9,
    sgkRef: 'SGK Bài 2.3',
    text: 'Ông An thuê ô tô trong 1 tuần (5 ngày trong tuần giá cố định 900 nghìn/ngày và 8 nghìn/km; 2 ngày cuối tuần giá cố định 1 500 nghìn/ngày và 10 nghìn/km). Gọi $x, y$ là số km đi trong tuần và cuối tuần. Để tổng chi phí không quá 14 triệu đồng thì $x, y$ thỏa mãn:',
    options: [
      { text: 'A. $4x + 5y \\le 3250$', correct: true },
      { text: 'B. $8x + 10y \\le 14000$', correct: false },
      { text: 'C. $4x + 5y \\ge 3250$', correct: false },
      { text: 'D. $5x + 4y \\le 3250$', correct: false }
    ],
    explanation: 'Phí cố định: $5 \\times 900 + 2 \\times 1500 = 4500 + 3000 = 7500$ (nghìn đồng).<br>Phí theo quãng đường: $8x + 10y$ (nghìn đồng).<br>Tổng chi phí không quá 14 triệu: $7500 + 8x + 10y \\le 14000 \\Leftrightarrow 8x + 10y \\le 6500 \\Leftrightarrow 4x + 5y \\le 3250$.'
  },
  {
    id: 10,
    sgkRef: 'SGK Ví dụ 5 trang 25',
    text: 'Trong bài toán bán vé rạp chiếu phim $x + 2y < 400$ (bù lỗ), các điểm $(x; y)$ nằm **trên đoạn thẳng $AB: x + 2y = 400$** có ý nghĩa kinh tế là gì?',
    options: [
      { text: 'A. Rạp chiếu phim hòa vốn (không lãi, không lỗ).', correct: true },
      { text: 'B. Rạp chiếu phim có lãi tối đa.', correct: false },
      { text: 'C. Rạp chiếu phim bị phá sản.', correct: false },
      { text: 'D. Rạp chiếu phim phải đóng cửa.', correct: false }
    ],
    explanation: 'Đoạn thẳng $AB$ là đường ranh giới nơi doanh thu đúng bằng chi phí tối thiểu 20 triệu đồng ($x + 2y = 400$). Do đó mọi cặp số $(x; y)$ nằm trên đoạn thẳng $AB$ biểu thị trường hợp rạp chiếu phim hòa vốn.'
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
      <div style="font-size: 0.9rem;">Gợi ý: Kiểm tra lại các điều kiện và phép tính số học của bất phương trình.</div>
    `;
  }
}

function showArenaSummary() {
  const qEl = document.getElementById('arenaQuestion');
  qEl.innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <h2 style="color: #10b981; margin-bottom: 12px;">🎉 CHÚC MỪNG BẠN ĐÃ VƯỢT QUA ĐẤU TRƯỜNG!</h2>
      <p style="font-size: 1.05rem; color: var(--text-secondary); margin-bottom: 16px;">
        Bạn đã hoàn thành toàn bộ 10 câu hỏi bao phủ 100% bài tập SGK Bài 3 (Trang 25).
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
      if (confirm('Bạn có chắc muốn đặt lại toàn bộ tiến trình học tập của Bài 3 không?')) {
        sound.click();
        localStorage.removeItem(STATE_KEY);
        appState = { ...defaultState };
        saveState();
        updateHUD();
        initArena();
        renderPlaneCanvas();
        renderCinemaCanvas();
      }
    });
  }
}

// --- 8. KHỞI CHẠY KHI TẢI TRANG ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateHUD();
  initTabs();
  initPlaneLab();
  initCinemaLab();
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
