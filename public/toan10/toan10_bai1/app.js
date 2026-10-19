/* ================================================================
   BÀI 1: MỆNH ĐỀ - TOÁN 10 TẬP 1 (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
   Logic: Web Audio API, Bảng Chân Trị, Mạch Logic Canvas, Máy Phản Ví Dụ,
   Đấu Trường 10 Câu Hỏi SGK 1.1-1.7 & Giấy Chứng Nhận A4.
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

  playTone(freq = 440, type = 'sine', duration = 0.15, vol = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playCorrect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.12, 0.15), idx * 70);
    });
  }

  playWrong() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.playTone(260, 'sawtooth', 0.2, 0.2);
    setTimeout(() => this.playTone(195, 'sawtooth', 0.3, 0.2), 150);
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    [440, 554.37, 659.25, 880, 1108.7].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'square', 0.18, 0.15), i * 90);
    });
  }

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.22, 0.2), idx * 110);
    });
  }
}

const sound = new SoundController();

// --- 2. TRẠNG THÁI TOÀN CỤC (STATE) ---
const STATE_KEY = 'toan10_bai1_menh_de_state';

const appState = {
  xp: 0,
  streak: 0,
  maxStreak: 0,
  avatar: '👑',
  userTitle: 'Kiện Tướng Suy Luận Toán 10',
  userName: 'Chiến Binh Logic',
  badges: {
    truth: false,
    implies: false,
    quantifier: false,
    arena: false,
    master: false
  },
  soundEnabled: true
};

function loadState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      Object.assign(appState, JSON.parse(saved));
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
  updateHud();
}

function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

function addXP(amount) {
  appState.xp += amount;
  sound.playLevelUp();
  updateHud();
  checkMasterBadge();
  saveState();
}

function updateHud() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starRatingEl = document.getElementById('starRating');
  const avatarBtn = document.getElementById('avatarBtn');
  const userTitleEl = document.getElementById('userTitle');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const certStudentName = document.getElementById('certStudentName');
  const certHonorsTitle = document.getElementById('certHonorsTitle');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (avatarBtn) avatarBtn.textContent = appState.avatar;
  if (userTitleEl) userTitleEl.textContent = appState.userTitle;
  if (userNameDisplay) userNameDisplay.textContent = `${appState.userName} 🌟`;
  
  // Hiển thị tên học sinh trang trọng, chuẩn Unicode tiếng Việt, không dính emoji gây lệch chữ trên bản in
  const cleanStudentName = appState.userName.replace(/[^\p{L}\p{N}\s]/gu, '').trim() || appState.userName;
  if (certStudentName) certStudentName.textContent = cleanStudentName;
  if (certHonorsTitle) certHonorsTitle.textContent = `${appState.userTitle} 🏅`;

  // Star Rating
  let stars = '⭐☆☆☆☆';
  if (appState.xp >= 1000) stars = '⭐⭐⭐⭐⭐';
  else if (appState.xp >= 700) stars = '⭐⭐⭐⭐☆';
  else if (appState.xp >= 400) stars = '⭐⭐⭐☆☆';
  else if (appState.xp >= 150) stars = '⭐⭐☆☆☆';
  if (starRatingEl) starRatingEl.textContent = stars;

  // Badges UI
  for (const [key, unlocked] of Object.entries(appState.badges)) {
    const el = document.getElementById(`badge-${key}`);
    if (el) {
      if (unlocked) {
        el.classList.add('unlocked');
        el.classList.remove('locked');
      } else {
        el.classList.remove('unlocked');
        el.classList.add('locked');
      }
    }
  }
}

function unlockBadge(badgeKey) {
  if (!appState.badges[badgeKey]) {
    appState.badges[badgeKey] = true;
    addXP(100);
    sound.playFanfare();
    updateHud();
    saveState();
  }
}

function checkMasterBadge() {
  if (appState.badges.truth && appState.badges.implies && appState.badges.quantifier && appState.badges.arena) {
    if (!appState.badges.master) {
      appState.badges.master = true;
      appState.xp += 250;
      sound.playFanfare();
      updateHud();
      saveState();
    }
  }
}

// --- 3. ĐIỀU HƯỚNG TABS ---
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sound.playTone(520, 'sine', 0.08);
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `tab-${tab.dataset.tab}`;
      const target = document.getElementById(targetId);
      if (target) target.classList.add('active');

      if (tab.dataset.tab === 'labs') {
        drawCircuit();
      }
    });
  });
}

// --- 4. LAB 1: MÁY CHÂN TRỊ LOGIC & MẠCH ĐIỆN TƯƠNG TÁC ---
let stateP = true;
let stateQ = false;
let testedCombinations = new Set();

function initLogicLab() {
  const btnP = document.getElementById('btnToggleP');
  const btnQ = document.getElementById('btnToggleQ');

  if (btnP) {
    btnP.addEventListener('click', () => {
      stateP = !stateP;
      btnP.className = `toggle-switch-btn ${stateP ? 'true' : 'false'}`;
      btnP.textContent = `P: ${stateP ? 'ĐÚNG (T)' : 'SAI (F)'}`;
      sound.playTone(stateP ? 600 : 350, 'sine', 0.08);
      updateTruthOutputs();
    });
  }

  if (btnQ) {
    btnQ.addEventListener('click', () => {
      stateQ = !stateQ;
      btnQ.className = `toggle-switch-btn ${stateQ ? 'true' : 'false'}`;
      btnQ.textContent = `Q: ${stateQ ? 'ĐÚNG (T)' : 'SAI (F)'}`;
      sound.playTone(stateQ ? 600 : 350, 'sine', 0.08);
      updateTruthOutputs();
    });
  }

  renderTruthTableRows();
  updateTruthOutputs();
}

function updateTruthOutputs() {
  const notP = !stateP;
  const implies = (!stateP) || stateQ; // P => Q
  const converse = (!stateQ) || stateP; // Q => P
  const equiv = (stateP === stateQ); // P <=> Q

  const resNotP = document.getElementById('resNotP');
  const resImplies = document.getElementById('resImplies');
  const resConverse = document.getElementById('resConverse');
  const resEquiv = document.getElementById('resEquiv');
  const circuitExp = document.getElementById('circuitExplanation');

  if (resNotP) {
    resNotP.className = `truth-tag ${notP ? 'true' : 'false'}`;
    resNotP.textContent = notP ? 'ĐÚNG' : 'SAI';
  }

  if (resImplies) {
    resImplies.className = `truth-tag ${implies ? 'true' : 'false'}`;
    resImplies.textContent = implies ? 'ĐÚNG' : 'SAI';
  }

  if (resConverse) {
    resConverse.className = `truth-tag ${converse ? 'true' : 'false'}`;
    resConverse.textContent = converse ? 'ĐÚNG' : 'SAI';
  }

  if (resEquiv) {
    resEquiv.className = `truth-tag ${equiv ? 'true' : 'false'}`;
    resEquiv.textContent = equiv ? 'ĐÚNG' : 'SAI';
  }

  if (circuitExp) {
    if (stateP && !stateQ) {
      circuitExp.textContent = '❌ ĐÈN TẮT! Mệnh đề P ⇒ Q bị SAI duy nhất khi giả thiết P Đúng nhưng kết luận Q Sai!';
    } else if (!stateP) {
      circuitExp.textContent = '💡 ĐÈN SÁNG! Khi P Sai, mệnh đề kéo theo P ⇒ Q luôn ĐÚNG (mạch bypass tự động thông mạch)!';
    } else {
      circuitExp.textContent = '💡 ĐÈN SÁNG! Cả P và Q đều Đúng nên mệnh đề kéo theo P ⇒ Q hiển nhiên ĐÚNG!';
    }
  }

  // Record tested combo
  const comboKey = `${stateP}_${stateQ}`;
  testedCombinations.add(comboKey);
  if (testedCombinations.size >= 4) {
    unlockBadge('truth');
  }
  if (!implies) {
    unlockBadge('implies'); // Found the only false case of implies!
  }

  highlightActiveRow();
  drawCircuit();
}

function renderTruthTableRows() {
  const tbody = document.getElementById('truthTableBody');
  if (!tbody) return;

  const rows = [
    { p: true, q: true },
    { p: true, q: false },
    { p: false, q: true },
    { p: false, q: false }
  ];

  tbody.innerHTML = '';
  rows.forEach((r, idx) => {
    const notP = !r.p;
    const imp = (!r.p) || r.q;
    const conv = (!r.q) || r.p;
    const eq = (r.p === r.q);

    const tr = document.createElement('tr');
    tr.id = `row-${idx}`;
    tr.innerHTML = `
      <td><span class="truth-tag ${r.p ? 'true' : 'false'}">${r.p ? 'T' : 'F'}</span></td>
      <td><span class="truth-tag ${r.q ? 'true' : 'false'}">${r.q ? 'T' : 'F'}</span></td>
      <td><span class="truth-tag ${notP ? 'true' : 'false'}">${notP ? 'T' : 'F'}</span></td>
      <td><span class="truth-tag ${imp ? 'true' : 'false'}">${imp ? 'T' : 'F'}</span></td>
      <td><span class="truth-tag ${conv ? 'true' : 'false'}">${conv ? 'T' : 'F'}</span></td>
      <td><span class="truth-tag ${eq ? 'true' : 'false'}">${eq ? 'T' : 'F'}</span></td>
    `;
    tbody.appendChild(tr);
  });
}

function highlightActiveRow() {
  let targetIdx = 0;
  if (stateP && stateQ) targetIdx = 0;
  else if (stateP && !stateQ) targetIdx = 1;
  else if (!stateP && stateQ) targetIdx = 2;
  else targetIdx = 3;

  for (let i = 0; i < 4; i++) {
    const r = document.getElementById(`row-${i}`);
    if (r) {
      if (i === targetIdx) r.className = 'active-row';
      else r.className = '';
    }
  }
}

function drawCircuit() {
  const canvas = document.getElementById('circuitCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const implies = (!stateP) || stateQ;

  // Background
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, w, h);

  // Wires (Cyan/Indigo)
  ctx.strokeStyle = implies ? '#06b6d4' : '#475569';
  ctx.lineWidth = 4;
  ctx.shadowColor = implies ? '#06b6d4' : 'transparent';
  ctx.shadowBlur = implies ? 10 : 0;

  // Main Circuit Line
  ctx.beginPath();
  // Battery on left
  ctx.moveTo(30, 130);
  ctx.lineTo(80, 130);
  ctx.stroke();

  // Battery icon
  ctx.fillStyle = '#f59e0b';
  ctx.fillRect(20, 110, 10, 40);
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(12, 120, 4, 20);

  // Branch 1: Top (Bypass when P is False)
  ctx.beginPath();
  ctx.moveTo(80, 130);
  ctx.lineTo(80, 70);
  ctx.lineTo(130, 70);
  ctx.stroke();

  // Switch "Not P"
  ctx.beginPath();
  ctx.moveTo(130, 70);
  if (!stateP) {
    ctx.lineTo(190, 70); // Closed
  } else {
    ctx.lineTo(185, 45); // Open
  }
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(190, 70);
  ctx.lineTo(260, 70);
  ctx.lineTo(260, 130);
  ctx.stroke();

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '11px Segoe UI';
  ctx.fillText('Đường rẽ: P Sai (Bypass)', 105, 35);

  // Branch 2: Middle (P closed AND Q closed)
  ctx.beginPath();
  ctx.moveTo(80, 130);
  ctx.lineTo(110, 130);
  ctx.stroke();

  // Switch P
  ctx.beginPath();
  ctx.moveTo(110, 130);
  if (stateP) ctx.lineTo(160, 130);
  else ctx.lineTo(155, 105);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(160, 130);
  ctx.lineTo(180, 130);
  ctx.stroke();

  // Switch Q
  ctx.beginPath();
  ctx.moveTo(180, 130);
  if (stateQ) ctx.lineTo(230, 130);
  else ctx.lineTo(225, 105);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(230, 130);
  ctx.lineTo(260, 130);
  ctx.stroke();

  ctx.fillText('Công tắc P', 115, 155);
  ctx.fillText('Công tắc Q', 185, 155);

  // Wire to Bulb
  ctx.beginPath();
  ctx.moveTo(260, 130);
  ctx.lineTo(320, 130);
  ctx.stroke();

  // Light Bulb
  ctx.beginPath();
  ctx.arc(340, 130, 22, 0, Math.PI * 2);
  if (implies) {
    ctx.fillStyle = '#fef08a';
    ctx.shadowColor = '#facc15';
    ctx.shadowBlur = 25;
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#090d16';
    ctx.font = 'bold 12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('SÁNG', 340, 134);
  } else {
    ctx.fillStyle = '#1e293b';
    ctx.shadowBlur = 0;
    ctx.fill();
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 12px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText('TẮT', 340, 134);
  }
}

// --- 5. LAB 2: MÁY PHẢN VÍ DỤ QUANTIFIERS ---
function initQuantifierLab() {
  const sel = document.getElementById('statementSelect');
  const input = document.getElementById('inputTestVal');
  const btn = document.getElementById('btnTestValue');
  const resBox = document.getElementById('testResultBox');

  if (btn && sel && input && resBox) {
    btn.addEventListener('click', () => {
      const mode = parseInt(sel.value);
      const val = parseFloat(input.value);
      sound.playTone(550, 'triangle', 0.1);

      let isSuccess = false;
      let text = '';

      if (mode === 1) {
        // "∀x ∈ ℝ, x² - 4 = 0"
        const calc = val * val - 4;
        if (Math.abs(calc) > 1e-6) {
          text = `🎯 <strong>TÌM THẤY PHẢN VÍ DỤ!</strong><br>Với x = ${val}, ta có x² - 4 = ${calc} ≠ 0. Một phản ví dụ là đủ chứng minh mệnh đề "∀x ∈ ℝ, x² - 4 = 0" là <strong>HOÀN TOÀN SAI</strong>!`;
          isSuccess = true;
          sound.playCorrect();
          unlockBadge('quantifier');
        } else {
          text = `Giá trị x = ${val} thỏa mãn x² - 4 = 0, nhưng đây chỉ là ví dụ riêng lẻ. Hãy thử x khác (như x = 3) để tìm phản ví dụ!`;
        }
      } else if (mode === 2) {
        // "∀x ∈ ℝ, x² + 1 > 0"
        const calc = val * val + 1;
        text = `Với x = ${val}, ta có x² + 1 = ${calc} > 0 (Đúng). Vì x² ≥ 0 với mọi x nên x² + 1 ≥ 1 > 0 luôn đúng. Mệnh đề này là <strong>ĐÚNG TUYỆT ĐỐI</strong>, không thể tìm thấy phản ví dụ nào!`;
        sound.playCorrect();
      } else if (mode === 3) {
        // "∃n ∈ ℕ, n² = n"
        if (val === 0 || val === 1) {
          text = `🎉 <strong>CHỨNG MINH THÀNH CÔNG!</strong><br>Với n = ${val} ∈ ℕ, ta có ${val}² = ${val}. Vì là mệnh đề "TỒN TẠI (∃)", chỉ cần chỉ ra 1 minh chứng n = ${val} là đủ để kết luận mệnh đề là <strong>ĐÚNG</strong>!`;
          isSuccess = true;
          sound.playCorrect();
          unlockBadge('quantifier');
        } else {
          text = `Với n = ${val}, ${val}² = ${val * val} ≠ ${val}. Hãy thử với n = 0 hoặc n = 1 để tìm minh chứng!`;
        }
      } else if (mode === 4) {
        // "∀n ∈ ℕ, n chia hết cho 2"
        if (Math.abs(val % 2) === 1) {
          text = `🎯 <strong>TÌM THẤY PHẢN VÍ DỤ!</strong><br>Số tự nhiên n = ${val} là số lẻ, không chia hết cho 2! Vậy mệnh đề "Mọi số tự nhiên đều chia hết cho 2" là <strong>SAI</strong>!`;
          isSuccess = true;
          sound.playCorrect();
          unlockBadge('quantifier');
        } else {
          text = `Số n = ${val} chia hết cho 2, nhưng hãy thử với một số lẻ (như n = 1, 3, 5) để phản biện!`;
        }
      }

      resBox.innerHTML = formatMathText(text);
      resBox.style.borderLeft = isSuccess ? '4px solid var(--emerald-true)' : '4px solid var(--indigo-light)';
    });
  }
}

// --- 6. TAB 3: ĐẤU TRƯỜNG SGK (10 CÂU HỎI BÀI 1.1 - 1.7) ---
const arenaQuestions = [
  {
    q: "Câu 1 (SGK 1.1): Trong các câu sau, câu nào là một mệnh đề toán học?",
    options: [
      "A. Hôm nay trời đẹp quá!",
      "B. Bạn có thích học môn Toán không?",
      "C. Số 17 là một số nguyên tố.",
      "D. Hãy chú ý lắng nghe thầy cô giảng bài!"
    ],
    correct: 2,
    explanation: "Chính xác! Câu 'Số 17 là một số nguyên tố' là một câu khẳng định có tính đúng/sai xác định (và thực tế nó là mệnh đề đúng). Các câu còn lại là câu cảm thán, câu hỏi và câu mệnh lệnh."
  },
  {
    q: "Câu 2 (SGK 1.1): Xét tính đúng sai của mệnh đề: 'Phương trình $x^2 + 1 = 0$ vô nghiệm trên tập số thực $\\mathbb{R}$'.",
    options: [
      "A. Đây là mệnh đề ĐÚNG",
      "B. Đây là mệnh đề SAI",
      "C. Câu này không phải là mệnh đề",
      "D. Mệnh đề vừa đúng vừa sai"
    ],
    correct: 0,
    explanation: "Đúng! Với mọi $x \\in \\mathbb{R}$, $x^2 \\ge 0$ nên $x^2 + 1 \\ge 1 > 0$, phương trình không có nghiệm thực. Đây là một mệnh đề khẳng định đúng."
  },
  {
    q: "Câu 3 (SGK 1.2): Cho câu: $P(n)$: 'n chia hết cho 5'. Khẳng định nào sau đây là chuẩn xác nhất?",
    options: [
      "A. $P(n)$ là mệnh đề luôn đúng",
      "B. $P(n)$ là mệnh đề luôn sai",
      "C. $P(n)$ là một mệnh đề chứa biến; nó trở thành mệnh đề đúng khi $n = 10$",
      "D. $P(n)$ không liên quan gì đến toán học"
    ],
    correct: 2,
    explanation: "Chính xác! $P(n)$ chứa biến $n$ nên chưa xác định tính đúng sai. Khi gán $n = 10$, câu '10 chia hết cho 5' trở thành mệnh đề đúng."
  },
  {
    q: "Câu 4 (SGK 1.3): Mệnh đề phủ định của mệnh đề $P$: 'Số 2024 chia hết cho 5' là:",
    options: [
      "A. $\\overline{P}$: 'Số 2024 không chia hết cho 5'",
      "B. $\\overline{P}$: 'Số 2024 chia hết cho 10'",
      "C. $\\overline{P}$: 'Số 2024 là số lẻ'",
      "D. $\\overline{P}$: 'Số 2024 chia hết cho 2'"
    ],
    correct: 0,
    explanation: "Đúng! Phủ định của khẳng định $P$ là 'Không phải $P$', tức là 'Số 2024 không chia hết cho 5'."
  },
  {
    q: "Câu 5 (SGK 1.4): Mệnh đề kéo theo $P \\Rightarrow Q$ chỉ nhận giá trị SAI trong trường hợp nào duy nhất?",
    options: [
      "A. Khi $P$ sai và $Q$ sai",
      "B. Khi $P$ đúng và $Q$ sai",
      "C. Khi $P$ sai và $Q$ đúng",
      "D. Khi $P$ đúng và $Q$ đúng"
    ],
    correct: 1,
    explanation: "Chuẩn xác! Mệnh đề $P \\Rightarrow Q$ chỉ sai khi giả thiết $P$ đúng mà kết luận $Q$ sai. Nếu $P$ sai, mệnh đề $P \\Rightarrow Q$ luôn nhận giá trị đúng."
  },
  {
    q: "Câu 6 (SGK 1.4): Cho $P$: 'Tứ giác ABCD là hình vuông' và $Q$: 'Tứ giác ABCD là hình thoi'. Mệnh đề $P \\Rightarrow Q$ được phát biểu là:",
    options: [
      "A. Nếu tứ giác ABCD là hình thoi thì ABCD là hình vuông",
      "B. Tứ giác ABCD là hình vuông khi và chỉ khi ABCD là hình thoi",
      "C. Nếu tứ giác ABCD là hình vuông thì tứ giác ABCD là hình thoi",
      "D. Tứ giác ABCD không phải là hình vuông"
    ],
    correct: 2,
    explanation: "Chính xác! Mệnh đề kéo theo có dạng 'Nếu P thì Q'. Vì hình vuông có 4 cạnh bằng nhau nên hiển nhiên là hình thoi, đây là mệnh đề ĐÚNG."
  },
  {
    q: "Câu 7 (SGK 1.5): Mệnh đề đảo của mệnh đề: 'Nếu tam giác ABC đều thì tam giác ABC cân' là:",
    options: [
      "A. Nếu tam giác ABC cân thì tam giác ABC đều",
      "B. Nếu tam giác ABC không đều thì tam giác ABC không cân",
      "C. Tam giác ABC đều khi và chỉ khi tam giác ABC cân",
      "D. Tam giác ABC vuông cân"
    ],
    correct: 0,
    explanation: "Đúng! Mệnh đề đảo của $P \\Rightarrow Q$ là $Q \\Rightarrow P$, tức là 'Nếu tam giác ABC cân thì tam giác ABC đều' (chú ý: mệnh đề đảo này sai!)."
  },
  {
    q: "Câu 8 (SGK 1.5): Hai mệnh đề $P$ và $Q$ gọi là tương đương (kí hiệu $P \\Leftrightarrow Q$) khi nào?",
    options: [
      "A. Khi $P$ đúng và $Q$ sai",
      "B. Khi cả hai mệnh đề kéo theo $P \\Rightarrow Q$ và $Q \\Rightarrow P$ đều đúng ($P$ và $Q$ cùng đúng hoặc cùng sai)",
      "C. Khi $P$ sai và $Q$ đúng",
      "D. Khi $P$ và $Q$ là hai câu hỏi"
    ],
    correct: 1,
    explanation: "Chính xác! $P \\Leftrightarrow Q$ đúng khi $P$ và $Q$ cùng chân trị. Lúc này $P$ là điều kiện cần và đủ để có $Q$."
  },
  {
    q: "Câu 9 (SGK 1.6): Dùng kí hiệu $\\forall$ để viết lại mệnh đề: 'Bình phương của mọi số thực đều không âm'.",
    options: [
      "A. $\\exists x \\in \\mathbb{R}, x^2 \\ge 0$",
      "B. $\\forall x \\in \\mathbb{R}, x^2 > 0$",
      "C. $\\forall x \\in \\mathbb{R}, x^2 \\ge 0$",
      "D. $\\forall x \\in \\mathbb{N}, x^2 \\ge 0$"
    ],
    correct: 2,
    explanation: "Đúng! 'Mọi số thực' là $\\forall x \\in \\mathbb{R}$, 'không âm' là $\\ge 0$, do đó viết là: $\\forall x \\in \\mathbb{R}, x^2 \\ge 0$."
  },
  {
    q: "Câu 10 (SGK 1.7): Mệnh đề phủ định của mệnh đề: '$\\exists x \\in \\mathbb{R}, x^2 - x + 1 \\le 0$' là:",
    options: [
      "A. $\\forall x \\in \\mathbb{R}, x^2 - x + 1 > 0$",
      "B. $\\exists x \\in \\mathbb{R}, x^2 - x + 1 > 0$",
      "C. $\\forall x \\in \\mathbb{R}, x^2 - x + 1 \\le 0$",
      "D. $\\forall x \\in \\mathbb{R}, x^2 - x + 1 < 0$"
    ],
    correct: 0,
    explanation: "Tuyệt vời! Phủ định của $\\exists$ là $\\forall$, phủ định của $\\le 0$ là $> 0$. Vậy mệnh đề phủ định là: '$\\forall x \\in \\mathbb{R}, x^2 - x + 1 > 0$'."
  }
];

let arenaCurrentIdx = 0;
let arenaScore = 0;

function initArena() {
  arenaCurrentIdx = 0;
  arenaScore = 0;
  renderArenaQuestion();

  const btnNext = document.getElementById('btnNextQuestion');
  const btnRestart = document.getElementById('btnRestartArena');

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      sound.playTone(450, 'sine', 0.08);
      arenaCurrentIdx++;
      if (arenaCurrentIdx < arenaQuestions.length) {
        renderArenaQuestion();
      } else {
        finishArena();
      }
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      sound.playTone(520, 'sine', 0.1);
      arenaCurrentIdx = 0;
      arenaScore = 0;
      renderArenaQuestion();
    });
  }
}

function renderArenaQuestion() {
  const qObj = arenaQuestions[arenaCurrentIdx];
  const qEl = document.getElementById('arenaQuestion');
  const optsEl = document.getElementById('arenaOptions');
  const fbEl = document.getElementById('arenaFeedback');
  const progEl = document.getElementById('arenaProgressText');
  const scoreEl = document.getElementById('arenaScoreText');
  const btnNext = document.getElementById('btnNextQuestion');
  const btnRestart = document.getElementById('btnRestartArena');

  if (btnNext) btnNext.style.display = 'none';
  if (btnRestart) btnRestart.style.display = 'none';
  if (fbEl) fbEl.style.display = 'none';

  if (progEl) progEl.textContent = `Câu hỏi ${arenaCurrentIdx + 1} / ${arenaQuestions.length}`;
  if (scoreEl) scoreEl.textContent = `Điểm: ${arenaScore} XP`;
  if (qEl) qEl.innerHTML = formatMathText(qObj.q);

  if (optsEl) {
    optsEl.innerHTML = '';
    qObj.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'arena-opt-btn';
      btn.innerHTML = `<span>${formatMathText(optText)}</span>`;
      btn.addEventListener('click', () => handleArenaAnswer(idx));
      optsEl.appendChild(btn);
    });
  }
}

function handleArenaAnswer(chosenIdx) {
  const qObj = arenaQuestions[arenaCurrentIdx];
  const opts = document.querySelectorAll('.arena-opt-btn');
  const fbEl = document.getElementById('arenaFeedback');
  const btnNext = document.getElementById('btnNextQuestion');

  opts.forEach(b => (b.disabled = true));

  if (chosenIdx === qObj.correct) {
    opts[chosenIdx].classList.add('correct');
    sound.playCorrect();
    appState.streak++;
    const bonus = 20 + appState.streak * 5;
    arenaScore += bonus;
    addXP(bonus);
    if (fbEl) {
      fbEl.style.display = 'block';
      fbEl.style.borderLeftColor = 'var(--emerald-true)';
      fbEl.innerHTML = `<strong>🎉 CHÍNH XÁC (+${bonus} XP)!</strong><br>${formatMathText(qObj.explanation)}`;
    }
  } else {
    opts[chosenIdx].classList.add('wrong');
    opts[qObj.correct].classList.add('correct');
    sound.playWrong();
    appState.streak = 0;
    if (fbEl) {
      fbEl.style.display = 'block';
      fbEl.style.borderLeftColor = 'var(--rose-false)';
      fbEl.innerHTML = `<strong>Chưa chính xác!</strong><br>${formatMathText(qObj.explanation)}`;
    }
  }

  updateHud();
  if (btnNext) {
    btnNext.style.display = 'inline-block';
    if (arenaCurrentIdx === arenaQuestions.length - 1) {
      btnNext.textContent = 'Xem Kết Quả Đấu Trường 🏆';
    } else {
      btnNext.textContent = 'Câu Tiếp Theo ➡️';
    }
  }
}

function finishArena() {
  const qEl = document.getElementById('arenaQuestion');
  const optsEl = document.getElementById('arenaOptions');
  const fbEl = document.getElementById('arenaFeedback');
  const btnNext = document.getElementById('btnNextQuestion');
  const btnRestart = document.getElementById('btnRestartArena');

  if (btnNext) btnNext.style.display = 'none';
  if (optsEl) optsEl.innerHTML = '';

  sound.playFanfare();
  if (arenaScore >= 160) {
    unlockBadge('arena');
  }

  if (qEl) {
    qEl.innerHTML = `
      <div style="text-align: center; padding: 20px 0;">
        <div style="font-size: 3rem; margin-bottom: 10px;">🏆</div>
        <h2 style="color: var(--indigo-light); margin-bottom: 8px;">ĐẤU TRƯỜNG LOGIC HOÀN THÀNH XUẤT SẮC!</h2>
        <p style="color: var(--text-secondary); font-size: 1.05rem;">
          Bạn đã ghi được tổng cộng <strong>${arenaScore} XP</strong> trong Đấu Trường Mệnh Đề Toán 10!
        </p>
      </div>
    `;
  }

  if (fbEl) {
    fbEl.style.display = 'block';
    fbEl.style.borderLeftColor = 'var(--indigo-light)';
    fbEl.innerHTML = formatMathText(`
      <strong>🌟 Đánh giá từ Ban Chuyên Môn:</strong><br>
      Bạn đã làm chủ hoàn hảo các khái niệm nền tảng của logic học: Mệnh đề phủ định $\\overline{P}$, Mệnh đề kéo theo $P \\Rightarrow Q$, Mệnh đề tương đương $P \\Leftrightarrow Q$ và thuần thục lượng từ $\\forall, \\exists$. Hãy xem Tab <strong>Huy Hiệu & Giấy Chứng Nhận</strong> để in Bằng Danh Dự A4!
    `);
  }

  if (btnRestart) btnRestart.style.display = 'inline-block';
}

// --- 7. MODAL CHỌN AVATAR & TIỆN ÍCH ---
function initAvatarModal() {
  const btn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const btnClose = document.getElementById('btnCloseModal');
  const choices = document.querySelectorAll('.avatar-choice');

  if (btn && modal) {
    btn.addEventListener('click', () => {
      sound.playTone(450, 'sine', 0.08);
      modal.classList.add('active');
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      sound.playTone(520, 'sine', 0.08);
      modal.classList.remove('active');
      saveState();
    });
  }

  choices.forEach(choice => {
    choice.addEventListener('click', () => {
      sound.playTone(600, 'triangle', 0.1);
      choices.forEach(c => c.classList.remove('selected'));
      choice.classList.add('selected');
      appState.avatar = choice.dataset.avatar;
      appState.userTitle = choice.dataset.title;
      updateHud();
    });
  });
}

function initActions() {
  const soundBtn = document.getElementById('soundToggle');
  const resetBtn = document.getElementById('resetProgress');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      sound.enabled = !sound.enabled;
      appState.soundEnabled = sound.enabled;
      soundBtn.textContent = sound.enabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      sound.playTone(500, 'sine', 0.08);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình học tập của Bài 1: Mệnh Đề?')) {
        localStorage.removeItem(STATE_KEY);
        location.reload();
      }
    });
  }

  // Set date in certificate
  const certDate = document.getElementById('certDate');
  if (certDate) {
    const d = new Date();
    certDate.textContent = `Đà Nẵng, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  }
}

// --- 8. KHỞI CHẠY (INITIALIZATION) ---
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTabs();
  initLogicLab();
  initQuantifierLab();
  initArena();
  initAvatarModal();
  initActions();
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
