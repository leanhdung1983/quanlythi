/* ================================================================
   BÀI TẬP CUỐI CHƯƠNG I: MỆNH ĐỀ & TẬP HỢP - TOÁN 10 TẬP 1
   Bộ sách: Kết Nối Tri Thức Với Cuộc Sống (Trang 20 - 21)
   Pure Vanilla JS • Web Audio API • Logic Engine • Ha Long Venn 2D
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

// --- 2. QUẢN LÝ TIẾN TRÌNH & DỮ LIỆU ÔN TẬP CHƯƠNG I ---
const STATE_KEY = 'toan10_ontap_chuong1_state';

const defaultState = {
  xp: 0,
  streak: 0,
  maxStreak: 0,
  stars: 2,
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Logic & Tập Hợp',
  soundEnabled: true,
  currentTab: 'theory',
  answeredQuestions: {},
  currentQuestionIndex: 0,
  badges: {
    logic: false,
    subset: false,
    venn: false,
    arena: false,
    master: false
  },
  logicTested: false,
  halongTested: false
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

    const { logic, subset, venn, arena } = appState.badges;
    if (logic && subset && venn && arena && !appState.badges.master) {
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
      certTitleEl.textContent = 'ĐẠI KIỆN TƯỚNG LOGIC & TẬP HỢP XUẤT SẮC 🏅';
    } else if (appState.xp >= 160) {
      certTitleEl.textContent = 'CHIẾN THẦN ÔN TẬP CHƯƠNG I 🌟';
    } else {
      certTitleEl.textContent = 'KIỆN TƯỚNG CHƯƠNG I 🎯';
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
        renderHalongVenn();
      }
    });
  });
}

// --- 4. LAB 1: MÁY THỬ NGHIỆM LOGIC & ĐIỀU KIỆN CẦN / ĐỦ ---
const logicDatabase = {
  'p1_q1': {
    forward: true,
    backward: false,
    textForward: 'Nếu tam giác ABC đều thì tam giác ABC cân (ĐÚNG).',
    textBackward: 'Nếu tam giác ABC cân thì tam giác ABC đều (SAI, vì có thể là tam giác cân không đều).',
    cond: 'P là ĐIỀU KIỆN ĐỦ để có Q. Q là ĐIỀU KIỆN CẦN để có P.'
  },
  'p2_q2': {
    forward: true,
    backward: true,
    textForward: 'Nếu tứ giác ABCD là hình thoi có 1 góc vuông thì ABCD là hình vuông (ĐÚNG).',
    textBackward: 'Nếu ABCD là hình vuông thì ABCD là hình thoi có 1 góc vuông (ĐÚNG).',
    cond: 'P là ĐIỀU KIỆN CẦN VÀ ĐỦ để có Q. Hai mệnh đề tương đương: P ⇔ Q.'
  },
  'p3_q3': {
    forward: true,
    backward: true,
    textForward: 'Số n chia hết cho 6 ⇒ n chia hết cho 2 và 3 (ĐÚNG).',
    textBackward: 'Số n chia hết cho 2 và 3 ⇒ n chia hết cho 6 (ĐÚNG, do ƯCLN(2,3) = 1).',
    cond: 'P là ĐIỀU KIỆN CẦN VÀ ĐỦ để có Q (Mệnh đề tương đương P ⇔ Q).'
  },
  'p4_q4': {
    forward: true,
    backward: false,
    textForward: 'Nếu x > 2 thì x² > 4 (ĐÚNG).',
    textBackward: 'Nếu x² > 4 thì x > 2 (SAI, vì nếu x = -3 thì x² = 9 > 4 nhưng -3 < 2).',
    cond: 'P là ĐIỀU KIỆN ĐỦ để có Q. Q là ĐIỀU KIỆN CẦN để có P.'
  },
  'p5_q5': {
    forward: true,
    backward: false,
    textForward: 'Nếu hai tam giác bằng nhau thì diện tích bằng nhau (ĐÚNG - SGK 1.18).',
    textBackward: 'Nếu hai tam giác có diện tích bằng nhau thì bằng nhau (SAI, có thể khác hình dạng).',
    cond: 'Hai tam giác bằng nhau là ĐIỀU KIỆN ĐỦ để diện tích của chúng bằng nhau.'
  }
};

function initLogicLab() {
  const btnAnalyze = document.getElementById('btnAnalyzeLogic');
  if (btnAnalyze) {
    btnAnalyze.addEventListener('click', () => {
      sound.click();
      const pVal = document.getElementById('selectPropP').value;
      const qVal = document.getElementById('selectPropQ').value;
      const key = `${pVal}_${qVal}`;

      const headerEl = document.getElementById('logicEvalHeader');
      const detailsEl = document.getElementById('logicEvalDetails');

      appState.logicTested = true;
      unlockBadge('logic');

      if (logicDatabase[key]) {
        const item = logicDatabase[key];
        headerEl.innerHTML = `<span style="color: #10b981;">⚡ Kết Quả Phân Tích Logic:</span> ${item.cond}`;
        detailsEl.innerHTML = `
          <p>• <strong>Chiều thuận ($P \\Rightarrow Q$):</strong> ${item.textForward}</p>
          <p>• <strong>Chiều đảo ($Q \\Rightarrow P$):</strong> ${item.textBackward}</p>
          <p style="margin-top: 8px; color: var(--gold);">
            ✦ <em>Kết luận:</em> ${item.cond}
          </p>
        `;
      } else {
        headerEl.innerHTML = `<span style="color: var(--cyan-neon);">🔍 Phân Tích Logic Tổng Quát:</span>`;
        detailsEl.innerHTML = `
          <p>Mệnh đề giả thiết $P$ và kết luận $Q$ đã chọn không tạo thành cặp định lý hình học/đại số trực tiếp.</p>
          <p>Quy tắc chung SGK: Trong mệnh đề $P \\Rightarrow Q$, nếu $P \\Rightarrow Q$ đúng thì $P$ là điều kiện đủ để có $Q$, còn $Q$ là điều kiện cần để có $P$.</p>
        `;
      }
      renderMathInTree(detailsEl);
    });
  }
}

// --- 5. LAB 2: MÁY GIẢI TOÁN DU LỊCH VỊNH HẠ LONG (SGK 1.27) ---
function initHalongLab() {
  const btn = document.getElementById('btnCalcHalong');
  if (btn) {
    btn.addEventListener('click', () => {
      sound.click();
      appState.halongTested = true;
      unlockBadge('venn');
      renderHalongVenn();
    });
  }

  const inputs = ['hlTotal', 'hlA', 'hlB'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        renderHalongVenn();
      });
    }
  });

  renderHalongVenn();
}

function renderHalongVenn() {
  const canvas = document.getElementById('halongCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const total = parseInt(document.getElementById('hlTotal').value) || 1410;
  const nA = parseInt(document.getElementById('hlA').value) || 789; // Động Thiên Cung
  const nB = parseInt(document.getElementById('hlB').value) || 690; // Đảo Titop

  // Intersection: n(A ∩ B) = n(A) + n(B) - n(A ∪ B)
  const both = Math.max(0, nA + nB - total);
  const onlyA = Math.max(0, nA - both);
  const onlyB = Math.max(0, nB - both);

  // Update labels
  document.getElementById('lblOnlyA').textContent = `${onlyA} khách`;
  document.getElementById('lblBoth').textContent = `${both} khách`;
  document.getElementById('lblOnlyB').textContent = `${onlyB} khách`;

  // Draw Venn Diagram Canvas
  const r = 90;
  const cxA = w / 2 - 60;
  const cxB = w / 2 + 60;
  const cy = h / 2 - 10;

  // Shading A
  ctx.save();
  ctx.beginPath();
  ctx.arc(cxA, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(56, 189, 248, 0.35)'; // Cyan
  ctx.fill();

  // Shading B
  ctx.beginPath();
  ctx.arc(cxB, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(244, 63, 94, 0.35)'; // Rose
  ctx.fill();
  ctx.restore();

  // Shading Intersection (Gold Glow)
  ctx.save();
  ctx.beginPath();
  ctx.arc(cxA, cy, r, 0, Math.PI * 2);
  ctx.clip();
  ctx.beginPath();
  ctx.arc(cxB, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(245, 158, 11, 0.55)'; // Gold
  ctx.fill();
  ctx.restore();

  // Outlines
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#38bdf8';
  ctx.beginPath();
  ctx.arc(cxA, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(cxB, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  // Titles
  ctx.font = 'bold 14px "Inter", sans-serif';
  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'center';
  ctx.fillText('Động Thiên Cung', cxA - 20, cy - r - 8);

  ctx.fillStyle = '#f43f5e';
  ctx.fillText('Đảo Titop', cxB + 20, cy - r - 8);

  // Numbers
  ctx.font = 'bold 16px "Inter", sans-serif';
  ctx.fillStyle = '#e0f2fe';
  ctx.fillText(onlyA.toString(), cxA - 35, cy + 5);

  ctx.fillStyle = '#fef08a';
  ctx.fillText(both.toString(), w / 2, cy + 5);

  ctx.fillStyle = '#ffe4e6';
  ctx.fillText(onlyB.toString(), cxB + 35, cy + 5);

  // Result box
  const resBox = document.getElementById('halongResultText');
  if (resBox) {
    const text = `
      Áp dụng công thức vàng bù trừ số phần tử:<br>
      $$n(A \\cap B) = n(A) + n(B) - n(A \\cup B) = ${nA} + ${nB} - ${total} = ${both}$$
      Vậy có chính xác <strong>${both} khách du lịch</strong> đã vừa đến thăm động Thiên Cung vừa đến thăm đảo Titop tại vịnh Hạ Long!
    `;
    resBox.innerHTML = formatMathText(text);
  }
}

// --- 6. TAB 3: ĐẤU TRƯỜNG SGK (10 CÂU 1.17 - 1.27 TRANG 20-21) ---
const arenaQuestions = [
  {
    id: 1,
    sgkRef: 'SGK Bài 1.17',
    text: 'Trong các câu sau đây, câu nào **không phải là mệnh đề**?',
    options: [
      { text: 'A. Bạn học giỏi quá!', correct: true },
      { text: 'B. Tam giác đều là tam giác có ba cạnh bằng nhau.', correct: false },
      { text: 'C. $3 < 1$.', correct: false },
      { text: 'D. $4 - 5 = 1$.', correct: false }
    ],
    explanation: '"Bạn học giỏi quá!" là một câu cảm thán dùng để bộc lộ cảm xúc khen ngợi, không thể khẳng định đúng hay sai một cách khách quan, do đó không phải là mệnh đề logic toán học. Các câu B, C, D đều là các khẳng định đúng hoặc sai rõ ràng.'
  },
  {
    id: 2,
    sgkRef: 'SGK Bài 1.18',
    text: 'Cho định lí toán học: "Nếu hai tam giác bằng nhau thì diện tích của chúng bằng nhau". Mệnh đề nào sau đây là **đúng**?',
    options: [
      { text: 'A. Hai tam giác bằng nhau là điều kiện đủ để diện tích của chúng bằng nhau.', correct: true },
      { text: 'B. Hai tam giác bằng nhau là điều kiện cần để diện tích của chúng bằng nhau.', correct: false },
      { text: 'C. Hai tam giác có diện tích bằng nhau là điều kiện đủ để chúng bằng nhau.', correct: false },
      { text: 'D. Hai tam giác bằng nhau là điều kiện cần và đủ để chúng có diện tích bằng nhau.', correct: false }
    ],
    explanation: 'Định lí có dạng $P \\Rightarrow Q$ với $P$: "Hai tam giác bằng nhau" và $Q$: "Diện tích của chúng bằng nhau". Theo quy tắc SGK, giả thiết $P$ là điều kiện đủ để có kết luận $Q$. Chiều ngược lại không đúng (hai tam giác có thể cùng diện tích nhưng khác hình dạng).'
  },
  {
    id: 3,
    sgkRef: 'SGK Bài 1.19',
    text: 'Mệnh đề nào sau đây là mệnh đề **đúng**?',
    options: [
      { text: 'A. $\\forall x \\in \\mathbb{R}, x > 1 \\Rightarrow x^2 > 1$.', correct: true },
      { text: 'B. $\\forall x \\in \\mathbb{R}, x^2 > 1 \\Rightarrow x > -1$.', correct: false },
      { text: 'C. $\\forall x \\in \\mathbb{R}, x^2 > 1 \\Rightarrow x > 1$.', correct: false },
      { text: 'D. $\\forall x \\in \\mathbb{R}, x > -1 \\Rightarrow x^2 > 1$.', correct: false }
    ],
    explanation: '• Với mọi $x > 1 > 0$, nhân hai vế với số dương $x$ ta được $x \\cdot x > 1 \\cdot x > 1 \\Rightarrow x^2 > 1$ (Đúng).<br>• Phương án B sai vì với $x = -2$ thì $(-2)^2 = 4 > 1$ nhưng $-2 < -1$.<br>• Phương án C sai với $x = -3$. Phương án D sai với $x = 0$.'
  },
  {
    id: 4,
    sgkRef: 'SGK Bài 1.20',
    text: 'Cho tập hợp $A = \\{a; b; c\\}$. Tập hợp $A$ có tất cả bao nhiêu tập hợp con?',
    options: [
      { text: 'A. 8 tập con.', correct: true },
      { text: 'B. 6 tập con.', correct: false },
      { text: 'C. 4 tập con.', correct: false },
      { text: 'D. 10 tập con.', correct: false }
    ],
    explanation: 'Định lí tổng quát: Một tập hợp gồm $n$ phần tử thì có đúng $2^n$ tập hợp con. Ở đây $n(A) = 3$, do đó số tập con của $A$ là $2^3 = 8$ tập con (gồm $\\emptyset$, 3 tập con 1 phần tử, 3 tập con 2 phần tử và chính tập $A$).'
  },
  {
    id: 5,
    sgkRef: 'SGK Bài 1.21',
    text: 'Cho hai tập hợp $A, B$ được minh họa bằng biểu đồ Ven. Phần thuộc hình tròn $A$ nhưng nằm ngoài hình tròn $B$ là biểu diễn của tập hợp nào sau đây?',
    options: [
      { text: 'A. $A \\setminus B$.', correct: true },
      { text: 'B. $A \\cap B$.', correct: false },
      { text: 'C. $A \\cup B$.', correct: false },
      { text: 'D. $B \\setminus A$.', correct: false }
    ],
    explanation: 'Hiệu của hai tập hợp $A \\setminus B$ là tập hợp gồm tất cả các phần tử thuộc $A$ nhưng không thuộc $B$. Trên biểu đồ Ven, vùng này là phần hình trăng lưỡi liềm thuộc hình tròn $A$ và nằm ngoài hình tròn $B$.'
  },
  {
    id: 6,
    sgkRef: 'SGK Bài 1.23',
    text: 'Phần không bị gạch trên trục số gồm các số thực nằm giữa $-2$ và $5$, có ngoặc tròn mở tại $-2$ và ngoặc vuông đóng tại $5$. Phần này biểu diễn tập hợp nào?',
    options: [
      { text: 'A. $(-2; 5]$.', correct: true },
      { text: 'B. $[-2; 5)$.', correct: false },
      { text: 'C. $(-2; 5)$.', correct: false },
      { text: 'D. $[-2; 5]$.', correct: false }
    ],
    explanation: 'Dấu ngoặc tròn quay sang phải tại $-2$ biểu diễn điều kiện $x > -2$ (không lấy $-2$). Dấu ngoặc vuông quay sang trái tại $5$ biểu diễn điều kiện $x \\le 5$ (lấy giá trị $5$). Kết hợp lại ta được nửa khoảng $(-2; 5]$.'
  },
  {
    id: 7,
    sgkRef: 'SGK Bài 1.24',
    text: 'Cho hai tập hợp $A = \\{x \\in \\mathbb{N} \\mid x < 7\\}$ và $B = \\{1; 2; 3; 6; 7; 8\\}$. Khi đó tập hợp giao $A \\cap B$ và hiệu $A \\setminus B$ lần lượt là:',
    options: [
      { text: 'A. $A \\cap B = \\{1; 2; 3; 6\\}$ và $A \\setminus B = \\{0; 4; 5\\}$.', correct: true },
      { text: 'B. $A \\cap B = \\{1; 2; 3; 6\\}$ và $A \\setminus B = \\{7; 8\\}$.', correct: false },
      { text: 'C. $A \\cap B = \\{0; 4; 5\\}$ và $A \\setminus B = \\{1; 2; 3; 6\\}$.', correct: false },
      { text: 'D. $A \\cap B = \\{1; 2; 3; 6; 7; 8\\}$ và $A \\setminus B = \\emptyset$.', correct: false }
    ],
    explanation: 'Liệt kê: $A = \\{0; 1; 2; 3; 4; 5; 6\\}$.<br>• Giao $A \\cap B$ gồm các phần tử vừa thuộc $A$ vừa thuộc $B$: $\\{1; 2; 3; 6\\}$.<br>• Hiệu $A \\setminus B$ gồm các phần tử thuộc $A$ nhưng không thuộc $B$: $\\{0; 4; 5\\}$.'
  },
  {
    id: 8,
    sgkRef: 'SGK Bài 1.25',
    text: 'Cho hai tập con của số thực $A = [-2; 3]$ và $B = (1; +\\infty)$. Kết quả của phép giao $A \\cap B$ và phần bù $C_{\\mathbb{R}} B$ lần lượt là:',
    options: [
      { text: 'A. $A \\cap B = (1; 3]$ và $C_{\\mathbb{R}} B = (-\\infty; 1]$.', correct: true },
      { text: 'B. $A \\cap B = [1; 3]$ và $C_{\\mathbb{R}} B = (-\\infty; 1)$.', correct: false },
      { text: 'C. $A \\cap B = (-2; 1)$ và $C_{\\mathbb{R}} B = (1; +\\infty)$.', correct: false },
      { text: 'D. $A \\cap B = [-2; +\\infty)$ và $C_{\\mathbb{R}} B = (-\\infty; 1]$.', correct: false }
    ],
    explanation: '• $x \\in A \\cap B \\Leftrightarrow -2 \\le x \\le 3$ và $x > 1 \\Leftrightarrow 1 < x \\le 3$, tức nửa khoảng $(1; 3]$.<br>• Phần bù của $B = (1; +\\infty)$ trong $\\mathbb{R}$ là tập các số thực không lớn hơn $1$: $C_{\\mathbb{R}} B = (-\\infty; 1]$.'
  },
  {
    id: 9,
    sgkRef: 'SGK Bài 1.26b',
    text: 'Cho hai khoảng, nửa khoảng $X = (4; 7]$ và $Y = (-1; 5)$. Kết quả của phép hợp $X \\cup Y$ là:',
    options: [
      { text: 'A. $(-1; 7]$.', correct: true },
      { text: 'B. $(4; 5)$.', correct: false },
      { text: 'C. $[-1; 7)$.', correct: false },
      { text: 'D. $(-1; 4) \\cup (5; 7]$.', correct: false }
    ],
    explanation: 'Khoảng $Y = (-1; 5)$ chứa các số thực từ $-1$ đến $5$. Nửa khoảng $X = (4; 7]$ chứa các số từ $4$ đến $7$. Do hai khoảng này đè lên nhau từ $4$ đến $5$, nên hợp của chúng kết nối liên tục từ $-1$ đến $7$, mút trái ngoặc tròn và mút phải ngoặc vuông: $(-1; 7]$.'
  },
  {
    id: 10,
    sgkRef: 'SGK Bài 1.27',
    text: 'Một cuộc khảo sát 1 410 khách du lịch thăm vịnh Hạ Long cho thấy có 789 khách đến thăm động Thiên Cung, 690 khách đến thăm đảo Titop. Toàn bộ 1 410 khách đều đến ít nhất một trong hai nơi. Hỏi có bao nhiêu khách **vừa đến thăm động Thiên Cung vừa đến thăm đảo Titop**?',
    options: [
      { text: 'A. 69 khách.', correct: true },
      { text: 'B. 99 khách.', correct: false },
      { text: 'C. 120 khách.', correct: false },
      { text: 'D. 150 khách.', correct: false }
    ],
    explanation: 'Gọi $A$ là tập khách thăm động Thiên Cung ($n(A) = 789$), $B$ là tập khách thăm đảo Titop ($n(B) = 690$).<br>Tổng số khách thăm ít nhất một nơi là $n(A \\cup B) = 1410$.<br>Số khách thăm cả hai nơi là:<br>$$n(A \\cap B) = n(A) + n(B) - n(A \\cup B) = 789 + 690 - 1410 = 69 \\text{ khách}.$$'
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
      <div style="font-size: 0.9rem;">Gợi ý: Rà soát lại định nghĩa và các điều kiện của bài toán để chọn phương án đúng.</div>
    `;
  }
}

function showArenaSummary() {
  const qEl = document.getElementById('arenaQuestion');
  qEl.innerHTML = `
    <div style="text-align: center; padding: 20px 0;">
      <h2 style="color: #10b981; margin-bottom: 12px;">🎉 CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH TỔNG ÔN CHƯƠNG I!</h2>
      <p style="font-size: 1.05rem; color: var(--text-secondary); margin-bottom: 16px;">
        Bạn đã giải quyết trọn vẹn 10 câu hỏi bao phủ 100% bài tập cuối Chương I (Trang 20-21).
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
      if (confirm('Bạn có chắc muốn đặt lại toàn bộ tiến trình học tập của Bài tập cuối Chương I không?')) {
        sound.click();
        localStorage.removeItem(STATE_KEY);
        appState = { ...defaultState };
        saveState();
        updateHUD();
        initArena();
        renderHalongVenn();
      }
    });
  }
}

// --- 8. KHỞI CHẠY KHI TẢI TRANG ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateHUD();
  initTabs();
  initLogicLab();
  initHalongLab();
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
