/* ================================================================
   BÀI 9: TÍCH CỦA MỘT VECTƠ VỚI MỘT SỐ - TOÁN 10
   Bộ sách: Kết Nối Tri Thức Với Cuộc Sống (Trang 55 - 60)
   Pure Vanilla JS • Web Audio API • 2D Canvas • MathML Offline
   Trường THPT Lương Thế Vinh - Đà Nẵng
   ================================================================ */

// --- 0. BỘ PARSER CÔNG THỨC TOÁN LATEX SANG NATIVE MATHML (100% OFFLINE) ---
const mathSymbols = [
  ["\\mathbb{N}^*", "<msub><mi class=\"m-bb\">&#8469;</mi><mo>*</mo></msub>"],
  ["\\mathbb{R}", "<mi class=\"m-bb\">&#8477;</mi>"],
  ["\\mathbb{N}", "<mi class=\"m-bb\">&#8469;</mi>"],
  ["\\mathbb{Z}", "<mi class=\"m-bb\">&#8484;</mi>"],
  ["\\mathbb{Q}", "<mi class=\"m-bb\">&#8474;</mi>"],
  ["\\Leftrightarrow", "<mo>&#8660;</mo>"],
  ["\\Rightarrow", "<mo>&#8658;</mo>"],
  ["\\Leftarrow", "<mo>&#8656;</mo>"],
  ["\\iff", "<mo>&#8660;</mo>"],
  ["\\implies", "<mo>&#8658;</mo>"],
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
  ["\\rightrightarrows", "<mo>&#8649;</mo>"],
  ["\\rightleftarrows", "<mo>&#8644;</mo>"],
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
    if (/[\+\-\*\=\/\<\>\(\)\[\]\{\}\,\;\:\!\?\|\']/.test(ch)) {
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

  // 3. Vector notations: \vec{...}, \overrightarrow{...}
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\vec\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));

  // 4. Overline & accents
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\widehat\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>^</mo></mover>'));

  // 5. Roots: \sqrt[n]{x}, \sqrt{x}
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, (m, n, x) => savePlaceholder('<mroot><mrow>' + convertLatexToMathMLBody(x, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow></mroot>'));
  let prevSqrt;
  do {
    prevSqrt = s;
    s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));
  } while (s !== prevSqrt);

  // 6. Fractions: \frac{a}{b}
  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
  } while (s !== prevFrac);

  // 7. Degree notations
  s = s.replace(/\^\{\\circ\}/g, savePlaceholder('<mo>&#176;</mo>'));
  s = s.replace(/\^\\circ/g, savePlaceholder('<mo>&#176;</mo>'));

  // 8. Handle symbol replacements
  for (const [k, v] of mathSymbols) {
    if (s.includes(k)) {
      s = s.split(k).join(savePlaceholder(v));
    }
  }

  // 9. Superscripts & subscripts
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

  // 10. Tokenize the remaining plain segments outside placeholders
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

function renderMathInTree(root) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const nodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.includes('$')) {
      nodes.push(node);
    }
  }
  for (const n of nodes) {
    const parent = n.parentNode;
    if (!parent) continue;
    const tag = parent.nodeName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'textarea' || tag === 'math' || parent.closest('math')) continue;
    const span = document.createElement('span');
    span.innerHTML = formatMathText(n.nodeValue);
    parent.replaceChild(span, n);
  }
}

// --- 1. WEB AUDIO API SOUND SYNTHESIS ---
class SoundController {
  constructor() {
    this.enabled = true;
    this.ctx = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, vol = 0.12) {
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
    } catch (e) {}
  }

  playClick() { this.playTone(600, 'sine', 0.08, 0.08); }
  playBeep() { this.playTone(450, 'triangle', 0.1, 0.1); }
  playCorrect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + i * 0.07);
        gain.gain.setValueAtTime(0.12, now + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.07 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.07);
        osc.stop(now + i * 0.07 + 0.2);
      });
    } catch (e) {}
  }

  playWrong() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [280, 240, 200].forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + i * 0.09);
        gain.gain.setValueAtTime(0.14, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.09 + 0.18);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.18);
      });
    } catch (e) {}
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [440, 554.37, 659.25, 880];
      const now = this.ctx.currentTime;
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.15, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.25);
      });
    } catch (e) {}
  }

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
      const durations = [0.12, 0.12, 0.12, 0.3, 0.12, 0.4];
      const now = this.ctx.currentTime;
      let t = now;
      notes.forEach((freq, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + durations[i]);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + durations[i]);
        t += durations[i] * 0.85;
      });
    } catch (e) {}
  }
}

const sounds = new SoundController();

// --- 2. GAME STATE & HUD MANAGER ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Tích Vectơ & Khối Tâm',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

function updateHUD() {
  document.getElementById('xpDisplay').innerText = appState.xp;
  document.getElementById('streakDisplay').innerText = '🔥 ' + appState.streak;
  document.getElementById('avatarBtn').innerText = appState.avatar;
  document.getElementById('userNameDisplay').innerText = appState.userName + ' 🌟';
  document.getElementById('userTitle').innerText = appState.userTitle;

  // Star Rating
  if (appState.xp >= 300) appState.stars = 5;
  else if (appState.xp >= 200) appState.stars = 4;
  else if (appState.xp >= 100) appState.stars = 3;

  let starStr = '';
  for (let i = 1; i <= 5; i++) {
    starStr += i <= appState.stars ? '⭐' : '☆';
  }
  document.getElementById('starRating').innerText = starStr;

  // Sync to Certificate
  const nameEl = document.getElementById('certStudentName');
  if (nameEl) nameEl.innerText = appState.userName;
}

function unlockBadge(idx, name) {
  if (appState.badges[idx]) return;
  appState.badges[idx] = true;
  const el = document.getElementById('badge-' + (idx + 1));
  if (el) {
    el.classList.remove('locked');
    el.classList.add('unlocked');
  }
  appState.xp += 30;
  sounds.playLevelUp();
  updateHUD();
}

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG SGK (10 CÂU BÀI 4.11 - 4.15 TRANG 55 - 60) ---
const quizData = [
  {
    id: 1,
    title: "Định Nghĩa Tích Vectơ Với Số Thực Âm (SGK Trang 56)",
    pts: 20,
    question: "Cho vectơ $\\vec{a} \\neq \\vec{0}$ và số thực $k < 0$. Khẳng định nào sau đây là **đúng** về vectơ $k\\vec{a}$?",
    options: [
      { text: "Vectơ $k\\vec{a}$ cùng hướng với vectơ $\\vec{a}$ và có độ dài bằng $k|\\vec{a}|$.", correct: false },
      { text: "Vectơ $k\\vec{a}$ ngược hướng với vectơ $\\vec{a}$ và có độ dài bằng $-k|\\vec{a}|$.", correct: true },
      { text: "Vectơ $k\\vec{a}$ vuông góc với vectơ $\\vec{a}$.", correct: false },
      { text: "Vectơ $k\\vec{a}$ là vectơ-không.", correct: false }
    ],
    explanation: "Theo định nghĩa tích vectơ với một số: Với $k < 0$, vectơ $k\\vec{a}$ ngược hướng với $\\vec{a}$ và có độ dài bằng $|k||\\vec{a}| = -k|\\vec{a}|$ (vì $|k| = -k > 0$)."
  },
  {
    id: 2,
    title: "Bài 4.11 SGK Trang 58 - Biểu Thị Vectơ Trung Điểm Cạnh",
    pts: 20,
    question: "Cho hình bình hành $ABCD$. Gọi $M$ là trung điểm của cạnh $BC$. Hãy biểu thị vectơ $\\overrightarrow{AM}$ theo hai vectơ $\\overrightarrow{AB}$ và $\\overrightarrow{AD}$.",
    options: [
      { text: "$\\overrightarrow{AM} = \\overrightarrow{AB} + \\frac{1}{2}\\overrightarrow{AD}$", correct: true },
      { text: "$\\overrightarrow{AM} = \\frac{1}{2}\\overrightarrow{AB} + \\overrightarrow{AD}$", correct: false },
      { text: "$\\overrightarrow{AM} = \\overrightarrow{AB} + 2\\overrightarrow{AD}$", correct: false },
      { text: "$\\overrightarrow{AM} = \\frac{1}{2}\\overrightarrow{AB} + \\frac{1}{2}\\overrightarrow{AD}$", correct: false }
    ],
    explanation: "Ta có: $\\overrightarrow{AM} = \\overrightarrow{AB} + \\overrightarrow{BM}$. Vì $M$ là trung điểm $BC$ nên $\\overrightarrow{BM} = \\frac{1}{2}\\overrightarrow{BC}$. Trong hình bình hành $ABCD$, $\\overrightarrow{BC} = \\overrightarrow{AD}$. Do đó $\\overrightarrow{AM} = \\overrightarrow{AB} + \\frac{1}{2}\\overrightarrow{AD}$."
  },
  {
    id: 3,
    title: "Bài 4.12 SGK Trang 58 - Tính Chất Đoạn Nối Trung Điểm Tứ Giác",
    pts: 20,
    question: "Cho tứ giác $ABCD$. Gọi $M, N$ tương ứng là trung điểm của các cạnh $AB, CD$. Đẳng thức nào sau đây luôn **đúng**?",
    options: [
      { text: "$\\overrightarrow{BC} + \\overrightarrow{AD} = \\overrightarrow{MN}$", correct: false },
      { text: "$\\overrightarrow{BC} + \\overrightarrow{AD} = 2\\overrightarrow{MN}$", correct: true },
      { text: "$\\overrightarrow{BC} + \\overrightarrow{AD} = 3\\overrightarrow{MN}$", correct: false },
      { text: "$\\overrightarrow{BC} - \\overrightarrow{AD} = 2\\overrightarrow{MN}$", correct: false }
    ],
    explanation: "Ta có: $\\overrightarrow{BC} = \\overrightarrow{BM} + \\overrightarrow{MN} + \\overrightarrow{NC}$ và $\\overrightarrow{AD} = \\overrightarrow{AM} + \\overrightarrow{MN} + \\overrightarrow{ND}$. Cộng từng vế: $\\overrightarrow{BC} + \\overrightarrow{AD} = 2\\overrightarrow{MN} + (\\overrightarrow{BM} + \\overrightarrow{AM}) + (\\overrightarrow{NC} + \\overrightarrow{ND})$. Vì $M, N$ là trung điểm $AB, CD$ nên $\\overrightarrow{BM} + \\overrightarrow{AM} = \\vec{0}$ và $\\overrightarrow{NC} + \\overrightarrow{ND} = \\vec{0}$. Do đó $\\overrightarrow{BC} + \\overrightarrow{AD} = 2\\overrightarrow{MN}$."
  },
  {
    id: 4,
    title: "Bài 4.13a SGK Trang 58 - Vị Trí Điểm Chia Đoạn Thẳng",
    pts: 20,
    question: "Cho hai điểm phân biệt $A, B$. Điểm $K$ thoả mãn $\\overrightarrow{KA} + 2\\overrightarrow{KB} = \\vec{0}$. Khẳng định nào sau đây về vị trí điểm $K$ là **đúng**?",
    options: [
      { text: "$K$ là trung điểm của đoạn thẳng $AB$.", correct: false },
      { text: "$K$ nằm ngoài đoạn thẳng $AB$ và $KA = 2KB$.", correct: false },
      { text: "$K$ nằm giữa hai điểm $A, B$ sao cho $KA = 2KB$ (tức $AK = \\frac{2}{3}AB$).", correct: true },
      { text: "$K$ nằm giữa hai điểm $A, B$ sao cho $KB = 2KA$.", correct: false }
    ],
    explanation: "Từ $\\overrightarrow{KA} + 2\\overrightarrow{KB} = \\vec{0} \\implies \\overrightarrow{KA} = -2\\overrightarrow{KB}$. Vì hệ số $-2 < 0$, hai vectơ $\\overrightarrow{KA}$ và $\\overrightarrow{KB}$ ngược hướng, suy ra $K$ nằm giữa $A$ và $B$. Về độ dài: $KA = 2KB$, tức đoạn $AB$ chia làm 3 phần thì $AK$ chiếm 2 phần ($AK = \\frac{2}{3}AB$)."
  },
  {
    id: 5,
    title: "Bài 4.13b SGK Trang 58 - Biểu Diễn Điểm Chia Qua Gốc O Bất Kì",
    pts: 20,
    question: "Cho hai điểm phân biệt $A, B$ và điểm $K$ thoả mãn $\\overrightarrow{KA} + 2\\overrightarrow{KB} = \\vec{0}$. Với mọi điểm $O$ bất kì, ta luôn có:",
    options: [
      { text: "$\\overrightarrow{OK} = \\frac{2}{3}\\overrightarrow{OA} + \\frac{1}{3}\\overrightarrow{OB}$", correct: false },
      { text: "$\\overrightarrow{OK} = \\frac{1}{3}\\overrightarrow{OA} + \\frac{2}{3}\\overrightarrow{OB}$", correct: true },
      { text: "$\\overrightarrow{OK} = \\frac{1}{2}\\overrightarrow{OA} + \\overrightarrow{OB}$", correct: false },
      { text: "$\\overrightarrow{OK} = \\overrightarrow{OA} + 2\\overrightarrow{OB}$", correct: false }
    ],
    explanation: "Theo quy tắc hiệu: $\\overrightarrow{KA} = \\overrightarrow{OA} - \\overrightarrow{OK}$ và $\\overrightarrow{KB} = \\overrightarrow{OB} - \\overrightarrow{OK}$. Thay vào đẳng thức: $(\\overrightarrow{OA} - \\overrightarrow{OK}) + 2(\\overrightarrow{OB} - \\overrightarrow{OK}) = \\vec{0} \\iff \\overrightarrow{OA} + 2\\overrightarrow{OB} - 3\\overrightarrow{OK} = \\vec{0} \\iff \\overrightarrow{OK} = \\frac{1}{3}\\overrightarrow{OA} + \\frac{2}{3}\\overrightarrow{OB}$."
  },
  {
    id: 6,
    title: "Bài 4.14a SGK Trang 58 - Xác Định Điểm Khối Tâm Tam Giác",
    pts: 20,
    question: "Cho tam giác $ABC$. Gọi $I$ là trung điểm của $AB$. Điểm $M$ thoả mãn $\\overrightarrow{MA} + \\overrightarrow{MB} + 2\\overrightarrow{MC} = \\vec{0}$. Vị trí của điểm $M$ là:",
    options: [
      { text: "$M$ là trọng tâm của tam giác $ABC$.", correct: false },
      { text: "$M$ là trung điểm của đoạn thẳng $IC$.", correct: true },
      { text: "$M$ trùng với điểm $C$.", correct: false },
      { text: "$M$ là trung điểm của cạnh $BC$.", correct: false }
    ],
    explanation: "Vì $I$ là trung điểm của $AB$ nên với mọi điểm $M$ ta có $\\overrightarrow{MA} + \\overrightarrow{MB} = 2\\overrightarrow{MI}$. Đẳng thức đã cho trở thành: $2\\overrightarrow{MI} + 2\\overrightarrow{MC} = \\vec{0} \\iff 2(\\overrightarrow{MI} + \\overrightarrow{MC}) = \\vec{0} \\iff \\overrightarrow{MI} + \\overrightarrow{MC} = \\vec{0}$. Điều này chứng tỏ $M$ là trung điểm của đoạn thẳng $IC$."
  },
  {
    id: 7,
    title: "Bài 4.14b SGK Trang 58 - Hệ Thức Khối Tâm Qua Gốc O",
    pts: 20,
    question: "Với điểm $M$ thoả mãn $\\overrightarrow{MA} + \\overrightarrow{MB} + 2\\overrightarrow{MC} = \\vec{0}$, với mọi điểm $O$ bất kì, đẳng thức nào sau đây là **đúng**?",
    options: [
      { text: "$\\overrightarrow{OA} + \\overrightarrow{OB} + 2\\overrightarrow{OC} = 3\\overrightarrow{OM}$", correct: false },
      { text: "$\\overrightarrow{OA} + \\overrightarrow{OB} + 2\\overrightarrow{OC} = 4\\overrightarrow{OM}$", correct: true },
      { text: "$\\overrightarrow{OA} + \\overrightarrow{OB} + \\overrightarrow{OC} = 4\\overrightarrow{OM}$", correct: false },
      { text: "$\\overrightarrow{OA} + \\overrightarrow{OB} + 2\\overrightarrow{OC} = \\vec{0}$", correct: false }
    ],
    explanation: "Ta có: $\\overrightarrow{OA} + \\overrightarrow{OB} + 2\\overrightarrow{OC} = (\\overrightarrow{OM} + \\overrightarrow{MA}) + (\\overrightarrow{OM} + \\overrightarrow{MB}) + 2(\\overrightarrow{OM} + \\overrightarrow{MC}) = 4\\overrightarrow{OM} + (\\overrightarrow{MA} + \\overrightarrow{MB} + 2\\overrightarrow{MC})$. Vì $\\overrightarrow{MA} + \\overrightarrow{MB} + 2\\overrightarrow{MC} = \\vec{0}$ nên $\\overrightarrow{OA} + \\overrightarrow{OB} + 2\\overrightarrow{OC} = 4\\overrightarrow{OM}$."
  },
  {
    id: 8,
    title: "Định Lí Phân Tích Vectơ Cơ Sở (SGK Trang 57)",
    pts: 20,
    question: "Cho hai vectơ không cùng phương $\\vec{a}$ và $\\vec{b}$. Khẳng định nào sau đây là **chính xác nhất**?",
    options: [
      { text: "Mọi vectơ $\\vec{u}$ đều có thể biểu diễn được nhưng có vô số cặp số $(x; y)$ thoả mãn $\\vec{u} = x\\vec{a} + y\\vec{b}$.", correct: false },
      { text: "Chỉ những vectơ cùng phương với $\\vec{a}$ hoặc $\\vec{b}$ mới biểu diễn được.", correct: false },
      { text: "Mọi vectơ $\\vec{u}$ đều biểu diễn được một cách duy nhất dưới dạng $\\vec{u} = x\\vec{a} + y\\vec{b}$.", correct: true },
      { text: "Cặp số $(x; y)$ luôn luôn bằng nhau $x = y$.", correct: false }
    ],
    explanation: "Định lí SGK trang 57 khẳng định: Cho hai vectơ không cùng phương $\\vec{a}, \\vec{b}$. Khi đó mọi vectơ $\\vec{u}$ đều biểu thị (phân tích) được một cách duy nhất theo hai vectơ $\\vec{a}, \\vec{b}$, nghĩa là có duy nhất cặp số thực $(x; y)$ sao cho $\\vec{u} = x\\vec{a} + y\\vec{b}$."
  },
  {
    id: 9,
    title: "Bài 4.15 SGK Trang 59 - Ba Lực Cân Bằng Nhau Đôi Một Góc 120°",
    pts: 20,
    question: "Chất điểm $A$ chịu tác dụng của ba lực $\\vec{F}_1, \\vec{F}_2, \\vec{F}_3$ ở trạng thái cân bằng (tức $\\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 = \\vec{0}$). Các lực từng đôi một tạo với nhau một góc $120^\\circ$. Biết độ lớn $|\\vec{F}_1| = 20\\text{ N}$. Độ lớn của các lực $\\vec{F}_2, \\vec{F}_3$ là:",
    options: [
      { text: "$|\\vec{F}_2| = 10\\text{ N}, |\\vec{F}_3| = 10\\sqrt{3}\\text{ N}$", correct: false },
      { text: "$|\\vec{F}_2| = |\\vec{F}_3| = 20\\text{ N}$", correct: true },
      { text: "$|\\vec{F}_2| = |\\vec{F}_3| = 20\\sqrt{3}\\text{ N}$", correct: false },
      { text: "$|\\vec{F}_2| = 15\\text{ N}, |\\vec{F}_3| = 25\\text{ N}$", correct: false }
    ],
    explanation: "Vì $\\vec{F}_1 + \\vec{F}_2 + \\vec{F}_3 = \\vec{0} \\implies \\vec{F}_2 + \\vec{F}_3 = -\\vec{F}_1 \\implies |\\vec{F}_2 + \\vec{F}_3| = |\\vec{F}_1| = 20\\text{ N}$. Do ba lực có vai trò đối xứng từng đôi một tạo góc $120^\\circ$, tứ giác tạo bởi $\\vec{F}_2$ và $\\vec{F}_3$ là hình thoi có góc nhọn $60^\\circ$ và góc tù $120^\\circ$, độ dài đường chéo bằng độ dài cạnh. Do đó $|\\vec{F}_2| = |\\vec{F}_3| = 20\\text{ N}$."
  },
  {
    id: 10,
    title: "Em Có Biết SGK Trang 59 - 60 - Thuyền Buồm Chạy Ngược Gió",
    pts: 20,
    question: "Nhờ nguyên lý toán học và vật lý nào mà một chiếc thuyền buồm có thể di chuyển tới một vị trí **ngược hướng gió** so với vị trí xuất phát?",
    options: [
      { text: "Thuyền dùng động cơ điện phụ trợ để thắng lực gió.", correct: false },
      { text: "Lực gió tác dụng lên cánh buồm được phân tích thành lực vuông góc với cánh buồm, lực này lại phân tích thành lực đẩy dọc theo sống thuyền và lực cản ngang bị nước triệt tiêu; thuyền chạy theo đường dích dắc.", correct: true },
      { text: "Thuyền buồm bay lướt trên mặt nước nên không chịu lực cản.", correct: false },
      { text: "Gió tự động đổi chiều khi thuyền quay đầu.", correct: false }
    ],
    explanation: "Toán học phân tích vectơ: Lực gió $\\vec{F}$ phân tích thành lực trượt $\\vec{p}$ và lực vuông góc $\\vec{q}$ với cánh buồm. Lực $\\vec{q}$ lại phân tích thành lực $\\vec{a}$ cùng phương với sống thuyền và lực $\\vec{b}$ vuông góc sống thuyền. Sống thuyền sâu dưới nước tạo lực cản lớn triệt tiêu lực $\\vec{b}$, còn lực $\\vec{a}$ đẩy thuyền tiến lên. Bằng cách chạy theo đường dích dắc (tacking), thuyền có thể đến đích ngược hướng gió!"
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
    sounds.playCorrect();
  } else {
    appState.streak = 0;
    sounds.playWrong();
  }

  if (appState.xp >= 160) {
    unlockBadge(3, "Chiến Thần Đấu Trường");
  }

  const answeredCount = Object.keys(appState.answered).length;
  if (answeredCount === 10) {
    const allCorrect = quizData.every(item => item.options[appState.answered[item.id]]?.correct);
    if (allCorrect) {
      unlockBadge(4, "Đại Kiện Tướng Khối Tâm");
      sounds.playFanfare();
    }
  }

  updateHUD();
  renderQuiz();
}

function updateArenaStats() {
  const answeredCount = Object.keys(appState.answered).length;
  const progEl = document.getElementById("arenaProgress");
  const scoreEl = document.getElementById("arenaScore");
  if (progEl) progEl.textContent = `${answeredCount}/10`;
  if (scoreEl) scoreEl.textContent = `${appState.xp} XP`;
}

// --- 4. LAB 1: VECTOR DECOMPOSITION LAB (CANVAS 2D) ---
class VectorDecompositionLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.originX = 180;
    this.originY = 240;
    this.scale = 28; // px per unit

    // Basis vectors a and b
    this.vecA = { x: 2, y: 0.5 };
    this.vecB = { x: 0.8, y: 1.8 };

    this.xCoef = 2.0;
    this.yCoef = 1.5;

    this.initEvents();
    this.update();
  }

  initEvents() {
    const xSlider = document.getElementById('xCoefSlider');
    const ySlider = document.getElementById('yCoefSlider');

    xSlider.addEventListener('input', (e) => {
      this.xCoef = parseFloat(e.target.value);
      document.getElementById('xCoefVal').innerText = this.xCoef.toFixed(1);
      this.update();
      unlockBadge(1, 'Bậc Thầy Phân Tích Cơ Sở');
    });

    ySlider.addEventListener('input', (e) => {
      this.yCoef = parseFloat(e.target.value);
      document.getElementById('yCoefVal').innerText = this.yCoef.toFixed(1);
      this.update();
      unlockBadge(1, 'Bậc Thầy Phân Tích Cơ Sở');
    });

    document.getElementById('btnPreset1').addEventListener('click', () => {
      sounds.playClick();
      this.setCoefficients(2, 1);
    });
    document.getElementById('btnPreset2').addEventListener('click', () => {
      sounds.playClick();
      this.setCoefficients(-1, 2);
    });
    document.getElementById('btnPreset3').addEventListener('click', () => {
      sounds.playClick();
      this.setCoefficients(1.5, -1.5);
    });
    document.getElementById('btnResetDecomp').addEventListener('click', () => {
      sounds.playClick();
      this.setCoefficients(2.0, 1.5);
    });
  }

  setCoefficients(x, y) {
    this.xCoef = x;
    this.yCoef = y;
    document.getElementById('xCoefSlider').value = x;
    document.getElementById('yCoefSlider').value = y;
    document.getElementById('xCoefVal').innerText = x.toFixed(1);
    document.getElementById('yCoefVal').innerText = y.toFixed(1);
    this.update();
  }

  update() {
    const uX = this.xCoef * this.vecA.x + this.yCoef * this.vecB.x;
    const uY = this.xCoef * this.vecA.y + this.yCoef * this.vecB.y;
    const modU = Math.hypot(uX, uY);

    const xSign = this.xCoef >= 0 ? `${this.xCoef.toFixed(1)}` : `(${this.xCoef.toFixed(1)})`;
    const ySign = this.yCoef >= 0 ? `+ ${this.yCoef.toFixed(1)}` : `- ${Math.abs(this.yCoef).toFixed(1)}`;
    document.getElementById('decompFormula').innerHTML = formatMathText(`$\\vec{u} = ${xSign}\\vec{a} ${ySign}\\vec{b}$`);
    document.getElementById('decompModulus').innerText = modU.toFixed(2);

    this.draw(uX, uY);
  }

  draw(uX, uY) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Grid
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let x = 0; x < this.width; x += 25) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
    }
    for (let y = 0; y < this.height; y += 25) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
    }
    ctx.restore();

    const O = { x: this.originX, y: this.originY };

    // Scaled component vectors: P = x*a, Q = y*b
    const P = {
      x: O.x + (this.xCoef * this.vecA.x) * this.scale,
      y: O.y - (this.xCoef * this.vecA.y) * this.scale
    };
    const Q = {
      x: O.x + (this.yCoef * this.vecB.x) * this.scale,
      y: O.y - (this.yCoef * this.vecB.y) * this.scale
    };
    // Resultant U = P + Q
    const U = {
      x: O.x + uX * this.scale,
      y: O.y - uY * this.scale
    };

    // Parallelogram dashed lines
    ctx.save();
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(P.x, P.y); ctx.lineTo(U.x, U.y);
    ctx.moveTo(Q.x, Q.y); ctx.lineTo(U.x, U.y);
    ctx.stroke();
    ctx.restore();

    // Basis vector a (1 unit)
    const baseA = { x: O.x + this.vecA.x * this.scale, y: O.y - this.vecA.y * this.scale };
    this.drawArrow(O, baseA, '#38bdf8', 2.5, 'a (cơ sở)');

    // Basis vector b (1 unit)
    const baseB = { x: O.x + this.vecB.x * this.scale, y: O.y - this.vecB.y * this.scale };
    this.drawArrow(O, baseB, '#10b981', 2.5, 'b (cơ sở)');

    // Component x*a
    if (Math.abs(this.xCoef) > 0.05) {
      this.drawArrow(O, P, '#818cf8', 3, `x*a = ${this.xCoef.toFixed(1)}a`);
    }

    // Component y*b
    if (Math.abs(this.yCoef) > 0.05) {
      this.drawArrow(O, Q, '#34d399', 3, `y*b = ${this.yCoef.toFixed(1)}b`);
    }

    // Resultant u
    this.drawArrow(O, U, '#f59e0b', 4, 'u = xa + yb');

    // Points
    this.drawPoint(O, 'O', '#ffffff');
    this.drawPoint(U, 'U', '#f59e0b');
  }

  drawArrow(from, to, color, width = 3, label = '') {
    const ctx = this.ctx;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    const headLen = 11;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.font = 'bold 12px Segoe UI, sans-serif';
      ctx.fillText(label, (from.x + to.x) / 2 + 8, (from.y + to.y) / 2 - 8);
    }
    ctx.restore();
  }

  drawPoint(pt, label, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 12px Segoe UI';
    ctx.fillText(label, pt.x + 8, pt.y - 8);
    ctx.restore();
  }
}

// --- 5. LAB 2: SAILBOAT PHYSICS SIMULATION (CANVAS 2D) ---
class SailboatSimulationLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.sailAngleDeg = 45;
    this.windForce = 500; // Newton

    this.initEvents();
    this.update();
  }

  initEvents() {
    const angleSlider = document.getElementById('sailAngleSlider');
    const forceSlider = document.getElementById('windForceSlider');

    angleSlider.addEventListener('input', (e) => {
      this.sailAngleDeg = parseFloat(e.target.value);
      document.getElementById('sailAngleVal').innerText = `${this.sailAngleDeg}°`;
      this.update();
      unlockBadge(2, 'Kỹ Sư Cánh Buồm Zigzag');
    });

    forceSlider.addEventListener('input', (e) => {
      this.windForce = parseFloat(e.target.value);
      document.getElementById('windForceVal').innerText = `${this.windForce} N`;
      this.update();
    });
  }

  update() {
    const thetaRad = this.sailAngleDeg * Math.PI / 180;
    // F_wind is incoming from top-right.
    // Component perpendicular to sail q = F * sin(theta)
    const qForce = this.windForce * Math.sin(thetaRad);
    const pForce = this.windForce * Math.cos(thetaRad); // sliding force

    // qForce is resolved into thrust along boat keel 'a' and sideways 'b'
    const aThrust = qForce * Math.cos(thetaRad); // along keel
    const bKeel = qForce * Math.sin(thetaRad);   // sideways cancelled by keel

    document.getElementById('fThrustVal').innerText = `${Math.round(aThrust)} N (Đẩy tới)`;
    document.getElementById('fSlideVal').innerText = `${Math.round(pForce)} N (Trượt buồm)`;
    document.getElementById('fKeelVal').innerText = `${Math.round(bKeel)} N (Bị nước cản)`;

    this.draw(thetaRad, qForce, pForce, aThrust, bKeel);
  }

  draw(thetaRad, qForce, pForce, aThrust, bKeel) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Ocean surface background
    ctx.fillStyle = '#0c4a6e';
    ctx.fillRect(0, 0, this.width, this.height);

    // Wind flow indicators from top-right down-left
    ctx.save();
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
    ctx.lineWidth = 1.5;
    for (let x = 60; x < this.width; x += 120) {
      ctx.beginPath();
      ctx.moveTo(x + 50, 20); ctx.lineTo(x, 70);
      ctx.stroke();
    }
    ctx.fillStyle = '#bae6fd';
    ctx.font = '12px Segoe UI';
    ctx.fillText(`Hướng gió thổi F_gió = ${this.windForce} N`, 30, 35);
    ctx.restore();

    // Boat Keel Center
    const bx = 300;
    const by = 180;

    ctx.save();
    // Draw Boat Hull (oriented along 45 degree heading)
    const boatHeading = -Math.PI / 4; // Heading up-left
    ctx.translate(bx, by);
    ctx.rotate(boatHeading);

    // Hull (Thân thuyền)
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.moveTo(0, -90); // bow (mũi)
    ctx.lineTo(26, -30);
    ctx.lineTo(22, 60);
    ctx.lineTo(-22, 60);
    ctx.lineTo(-26, -30);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#fef08a';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Sail (Cánh buồm) rotated by sail angle
    ctx.rotate(thetaRad - Math.PI / 4);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, -60);
    ctx.lineTo(0, 50);
    ctx.stroke();

    // Sail label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Segoe UI';
    ctx.fillText('Cánh Buồm', 8, 0);

    ctx.restore();

    // Vector Breakdown drawn at center
    const vScale = 0.16;
    ctx.save();
    ctx.translate(bx, by);

    // Thrust vector a (along boat keel, up-left)
    const tDx = -aThrust * vScale * Math.cos(Math.PI / 4);
    const tDy = -aThrust * vScale * Math.sin(Math.PI / 4);
    this.drawVec(0, 0, tDx, tDy, '#10b981', `a (Đẩy tới = ${Math.round(aThrust)} N)`);

    // Sideways vector b (perpendicular to keel)
    const bDx = bKeel * vScale * Math.cos(Math.PI / 4);
    const bDy = -bKeel * vScale * Math.sin(Math.PI / 4);
    this.drawVec(0, 0, bDx, bDy, '#f43f5e', `b (Cản = ${Math.round(bKeel)} N)`);

    ctx.restore();

    // Description text box
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(20, this.height - 90, 340, 75);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.strokeRect(20, this.height - 90, 340, 75);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px Segoe UI';
    ctx.fillText('NGUYÊN LÝ ZIC-ZẮC NGƯỢC GIÓ (SGK Trang 60):', 30, this.height - 70);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '12px Segoe UI';
    ctx.fillText('• Lực gió q phân tích thành hai vectơ: q = a + b', 30, this.height - 50);
    ctx.fillStyle = '#10b981';
    ctx.fillText('• Thành phần vectơ a dọc sống thuyền đẩy thuyền tiến lên!', 30, this.height - 30);
    ctx.restore();
  }

  drawVec(x1, y1, x2, y2, color, label) {
    const ctx = this.ctx;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const angle = Math.atan2(dy, dx);
    const headLen = 10;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = 3.5;

    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x2, y2);
    ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    ctx.font = 'bold 12px Segoe UI';
    ctx.fillText(label, (x1 + x2) / 2 + 10, (y1 + y2) / 2);
    ctx.restore();
  }
}

// --- 6. INITIALIZATION & DOM EVENTS ---
document.addEventListener('DOMContentLoaded', () => {
  renderMathInTree(document.getElementById('tab-theory'));

  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sounds.playClick();
      const tabTarget = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const contentEl = document.getElementById('tab-' + tabTarget);
      if (contentEl) contentEl.classList.add('active');

      if (tabTarget === 'theory') {
        unlockBadge(0, 'Thợ Kéo Vectơ');
      } else if (tabTarget === 'labs') {
        if (window.lab1) window.lab1.update();
        if (window.lab2) window.lab2.update();
      }
    });
  });

  const soundBtn = document.getElementById('soundToggle');
  soundBtn.addEventListener('click', () => {
    sounds.enabled = !sounds.enabled;
    soundBtn.innerText = sounds.enabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
    sounds.playClick();
  });

  document.getElementById('resetProgress').addEventListener('click', () => {
    sounds.playClick();
    if (confirm('Bạn có muốn đặt lại toàn bộ điểm kinh nghiệm và bài làm không?')) {
      appState.xp = 0;
      appState.streak = 0;
      appState.stars = 2;
      appState.answered = {};
      appState.badges = [false, false, false, false, false];
      document.querySelectorAll('.badge-item').forEach(b => {
        b.classList.remove('unlocked');
        b.classList.add('locked');
      });
      updateHUD();
      renderQuiz();
    }
  });

  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const closeAvatarModal = document.getElementById('closeAvatarModal');
  avatarBtn.addEventListener('click', () => {
    sounds.playClick();
    avatarModal.style.display = 'flex';
  });
  closeAvatarModal.addEventListener('click', () => {
    avatarModal.style.display = 'none';
  });
  document.querySelectorAll('.avatar-choice').forEach(choice => {
    choice.addEventListener('click', () => {
      sounds.playClick();
      appState.avatar = choice.dataset.avatar;
      avatarModal.style.display = 'none';
      updateHUD();
    });
  });

  // Init Labs
  window.lab1 = new VectorDecompositionLab('decompCanvas');
  window.lab2 = new SailboatSimulationLab('sailCanvas');

  // Init Quiz
  renderQuiz();

  // Print Certificate
  document.getElementById('btnPrintCert').addEventListener('click', () => {
    sounds.playFanfare();
    window.print();
  });

  // Initial HUD
  updateHUD();
  unlockBadge(0, 'Thợ Kéo Vectơ');
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
