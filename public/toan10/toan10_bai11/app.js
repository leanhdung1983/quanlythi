/* ================================================================
   BÀI 11: TÍCH VÔ HƯỚNG CỦA HAI VECTƠ - TOÁN 10
   Bộ sách: Kết Nối Tri Thức Với Cuộc Sống (Trang 66 - 71)
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
      let ent = ch;
      if (ch === '<') ent = '&lt;';
      else if (ch === '>') ent = '&gt;';
      else if (ch === '&') ent = '&amp;';
      out += '<mo>' + ent + '</mo>';
      i++;
      continue;
    }
    if (/\s/.test(ch)) {
      out += '<mspace width="0.25em"/>';
      i++;
      continue;
    }
    out += '<mtext>' + ch + '</mtext>';
    i++;
  }
  return out;
}

function convertLatexToMathMLBody(latex, placeholders) {
  let s = latex.trim();
  const savePlaceholder = (content) => {
    const idx = placeholders.length;
    placeholders.push(content);
    return '\uE000' + idx + '\uE001';
  };

  s = s.replace(/\\vec\{([^{}]+)\}/g, (m, v) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(v, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\vec\s*([a-zA-Z])/g, (m, v) => savePlaceholder('<mover accent="true"><mrow><mi>' + v + '</mi></mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, v) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(v, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\widehat\{([^{}]+)\}/g, (m, v) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(v, placeholders) + '</mrow><mo>^</mo></mover>'));
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, v) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(v, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\text\{([^{}]+)\}/g, (m, t) => savePlaceholder('<mtext>' + t + '</mtext>'));
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
  s = s.replace(/\\sqrt\[([^{}\]]+)\]\{([^{}]+)\}/g, (m, r, c) => savePlaceholder('<mroot><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(r, placeholders) + '</mrow></mroot>'));
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));

  for (const [k, v] of mathSymbols) {
    if (s.includes(k)) s = s.split(k).join(savePlaceholder(v));
  }

  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)\^\{([^{}]+)\}/g, (m, b, exp) => savePlaceholder('<msup><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(exp, placeholders) + '</mrow></msup>'));
  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)\^([a-zA-Z0-9])/g, (m, b, exp) => savePlaceholder('<msup><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(exp, placeholders) + '</mrow></msup>'));
  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)_\{([^{}]+)\}/g, (m, b, sub) => savePlaceholder('<msub><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(sub, placeholders) + '</mrow></msub>'));
  s = s.replace(/([a-zA-Z0-9\)]|\uE000\d+\uE001)_([a-zA-Z0-9])/g, (m, b, sub) => savePlaceholder('<msub><mrow>' + convertLatexToMathMLBody(b, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(sub, placeholders) + '</mrow></msub>'));

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

// --- 1. SOUND CONTROLLER (WEB AUDIO API) ---
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

  playClick() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(480, this.ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(240, this.ctx.currentTime + 0.05);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  playCorrect() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      let t = this.ctx.currentTime;
      notes.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.14);
        t += 0.08;
      });
    } catch (e) {}
  }

  playWrong() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, this.ctx.currentTime);
      osc.frequency.linearRampToValueAtTime(130, this.ctx.currentTime + 0.28);
      gain.gain.setValueAtTime(0.18, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.28);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.28);
    } catch (e) {}
  }

  playLevelUp() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [440, 554.37, 659.25, 880];
      let t = this.ctx.currentTime;
      notes.forEach((freq) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t);
        osc.stop(t + 0.2);
        t += 0.12;
      });
    } catch (e) {}
  }

  playFanfare() {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const notes = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5];
      const durations = [0.12, 0.12, 0.12, 0.2, 0.2, 0.5];
      let t = this.ctx.currentTime;
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
  userTitle: 'Đại Kiện Tướng Trực Giao Vectơ',
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

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG SGK (10 CÂU BÀI 4.21 - 4.26 TRANG 66 - 71) ---
const quizData = [
  {
    id: 1,
    title: "Góc Giữa Hai Vectơ Trong Tam Giác Đều (SGK Trang 66)",
    pts: 20,
    question: "Cho tam giác đều $ABC$. Góc giữa hai vectơ $\\overrightarrow{AB}$ và $\\overrightarrow{BC}$ bằng bao nhiêu?",
    options: [
      { text: "$60^\\circ$", correct: false },
      { text: "$120^\\circ$", correct: true },
      { text: "$90^\\circ$", correct: false },
      { text: "$30^\\circ$", correct: false }
    ],
    explanation: "Vẽ vectơ $\\overrightarrow{BD} = \\overrightarrow{AB}$. Khi đó góc giữa $\\overrightarrow{AB}$ và $\\overrightarrow{BC}$ chính là góc giữa $\\overrightarrow{BD}$ và $\\overrightarrow{BC}$, tức góc $\\widehat{DBC}$. Vì $\\widehat{ABC} = 60^\\circ$, ta có $\\widehat{DBC} = 180^\\circ - 60^\\circ = 120^\\circ$."
  },
  {
    id: 2,
    title: "Bài 4.21a SGK Trang 70 - Tính Góc Giữa Hai Vectơ",
    pts: 20,
    question: "Trong mặt phẳng toạ độ $Oxy$, tính góc giữa hai vectơ $\\vec{a} = (-3; 1)$ và $\\vec{b} = (2; 6)$.",
    options: [
      { text: "$45^\\circ$", correct: false },
      { text: "$60^\\circ$", correct: false },
      { text: "$90^\\circ$", correct: true },
      { text: "$180^\\circ$", correct: false }
    ],
    explanation: "Ta tính tích vô hướng: $\\vec{a} \\cdot \\vec{b} = (-3) \\cdot 2 + 1 \\cdot 6 = -6 + 6 = 0$. Vì tích vô hướng bằng $0$ nên hai vectơ $\\vec{a}$ và $\\vec{b}$ vuông góc với nhau, tức góc giữa chúng bằng $90^\\circ$."
  },
  {
    id: 3,
    title: "Bài 4.21b SGK Trang 70 - Cosin Góc Giữa Hai Vectơ",
    pts: 20,
    question: "Cho hai vectơ $\\vec{a} = (3; 1)$ và $\\vec{b} = (2; 4)$. Cosin của góc giữa hai vectơ $\\vec{a}$ và $\\vec{b}$ bằng:",
    options: [
      { text: "$\\frac{1}{2}$", correct: false },
      { text: "$\\frac{\\sqrt{2}}{2}$", correct: true },
      { text: "$\\frac{\\sqrt{3}}{2}$", correct: false },
      { text: "$0$", correct: false }
    ],
    explanation: "Ta có: $\\vec{a} \\cdot \\vec{b} = 3 \\cdot 2 + 1 \\cdot 4 = 10$. Độ dài $|\vec{a}| = \\sqrt{3^2 + 1^2} = \\sqrt{10}$; $|\vec{b}| = \\sqrt{2^2 + 4^2} = \\sqrt{20} = 2\\sqrt{5}$. Do đó $\\cos(\\vec{a}, \\vec{b}) = \\frac{10}{\\sqrt{10} \\cdot 2\\sqrt{5}} = \\frac{10}{10\\sqrt{2}} = \\frac{1}{\\sqrt{2}} = \\frac{\\sqrt{2}}{2}$ (tương ứng góc $45^\\circ$)."
  },
  {
    id: 4,
    title: "Bài 4.22a SGK Trang 70 - Điều Kiện Tích Vô Hướng Cực Đại",
    pts: 20,
    question: "Cho hai vectơ $\\vec{u}, \\vec{v} \\neq \\vec{0}$. Điều kiện cần và đủ để tích vô hướng $\\vec{u} \\cdot \\vec{v} = |\\vec{u}| \\cdot |\\vec{v}|$ là:",
    options: [
      { text: "$\\vec{u}$ và $\\vec{v}$ cùng phương và ngược hướng.", correct: false },
      { text: "$\\vec{u}$ và $\\vec{v}$ cùng hướng.", correct: true },
      { text: "$\\vec{u}$ vuông góc với $\\vec{v}$.", correct: false },
      { text: "$\\vec{u} = \\vec{v}$", correct: false }
    ],
    explanation: "Theo định nghĩa: $\\vec{u} \\cdot \\vec{v} = |\\vec{u}||\\vec{v}|\\cos(\\vec{u}, \\vec{v})$. Do đó $\\vec{u} \\cdot \\vec{v} = |\\vec{u}||\\vec{v}| \\iff \\cos(\\vec{u}, \\vec{v}) = 1 \\iff (\\vec{u}, \\vec{v}) = 0^\\circ \\iff \\vec{u}$ và $\\vec{v}$ cùng hướng."
  },
  {
    id: 5,
    title: "Bài 4.22b SGK Trang 70 - Điều Kiện Tích Vô Hướng Cực Tiểu",
    pts: 20,
    question: "Cho hai vectơ $\\vec{u}, \\vec{v} \\neq \\vec{0}$. Điều kiện cần và đủ để tích vô hướng $\\vec{u} \\cdot \\vec{v} = -|\\vec{u}| \\cdot |\\vec{v}|$ là:",
    options: [
      { text: "$\\vec{u}$ và $\\vec{v}$ ngược hướng.", correct: true },
      { text: "$\\vec{u}$ và $\\vec{v}$ cùng hướng.", correct: false },
      { text: "$\\vec{u}$ và $\\vec{v}$ vuông góc với nhau.", correct: false },
      { text: "$|\\vec{u}| = |\\vec{v}| = 0$", correct: false }
    ],
    explanation: "Ta có: $\\vec{u} \\cdot \\vec{v} = -|\\vec{u}||\\vec{v}| \\iff \\cos(\\vec{u}, \\vec{v}) = -1 \\iff (\\vec{u}, \\vec{v}) = 180^\\circ \\iff \\vec{u}$ và $\\vec{v}$ ngược hướng."
  },
  {
    id: 6,
    title: "Bài 4.23a SGK Trang 70 - Tích Vô Hướng Điểm Trên Trục Hoành",
    pts: 20,
    question: "Trong mặt phẳng $Oxy$, cho $A(1; 2), B(-4; 3)$ và điểm $M(t; 0)$ thuộc trục hoành. Biểu thức tích vô hướng $\\overrightarrow{AM} \\cdot \\overrightarrow{BM}$ theo $t$ là:",
    options: [
      { text: "$t^2 - 3t + 2$", correct: false },
      { text: "$t^2 + 3t + 2$", correct: true },
      { text: "$t^2 + 3t - 2$", correct: false },
      { text: "$t^2 - 5t + 6$", correct: false }
    ],
    explanation: "Ta có: $\\overrightarrow{AM} = (t - 1; 0 - 2) = (t - 1; -2)$ và $\\overrightarrow{BM} = (t - (-4); 0 - 3) = (t + 4; -3)$. Tích vô hướng: $\\overrightarrow{AM} \\cdot \\overrightarrow{BM} = (t - 1)(t + 4) + (-2)(-3) = (t^2 + 3t - 4) + 6 = t^2 + 3t + 2$."
  },
  {
    id: 7,
    title: "Bài 4.23b SGK Trang 70 - Tìm Điểm M Nhìn Đoạn AB Góc Vuông",
    pts: 20,
    question: "Cho $A(1; 2), B(-4; 3)$ và $M(t; 0)$. Tìm các giá trị của $t$ để góc $\\widehat{AMB} = 90^\\circ$.",
    options: [
      { text: "$t = 1$ hoặc $t = 2$", correct: false },
      { text: "$t = -1$ hoặc $t = -2$", correct: true },
      { text: "$t = 0$ hoặc $t = -3$", correct: false },
      { text: "Không tồn tại $t$", correct: false }
    ],
    explanation: "Góc $\\widehat{AMB} = 90^\\circ \\iff \\overrightarrow{AM} \\perp \\overrightarrow{BM} \\iff \\overrightarrow{AM} \\cdot \\overrightarrow{BM} = 0$. Theo câu trước, ta có phương trình: $t^2 + 3t + 2 = 0 \\iff (t + 1)(t + 2) = 0 \\iff t = -1$ hoặc $t = -2$."
  },
  {
    id: 8,
    title: "Bài 4.24b SGK Trang 70 - Toạ Độ Trực Tâm Tam Giác",
    pts: 20,
    question: "Cho tam giác $ABC$ với $A(-4; 1), B(2; 4), C(2; -2)$. Tìm toạ độ trực tâm $H$ của tam giác $ABC$.",
    options: [
      { text: "$H(-0,5; 1)$", correct: true },
      { text: "$H(0; 1)$", correct: false },
      { text: "$H(-1; 2)$", correct: false },
      { text: "$H(1; -0,5)$", correct: false }
    ],
    explanation: "Gọi $H(x; y)$. $H$ là trực tâm $\\iff \\overrightarrow{AH} \\perp \\overrightarrow{BC}$ và $\\overrightarrow{BH} \\perp \\overrightarrow{AC}$. Ta có $\\overrightarrow{BC} = (0; -6) \\implies \\overrightarrow{AH} \\cdot \\overrightarrow{BC} = (x + 4) \\cdot 0 + (y - 1)(-6) = 0 \\implies -6(y - 1) = 0 \\implies y = 1$. Lại có $\\overrightarrow{AC} = (6; -3)$ và $\\overrightarrow{BH} = (x - 2; 1 - 4) = (x - 2; -3)$. Ta có: $\\overrightarrow{BH} \\cdot \\overrightarrow{AC} = 6(x - 2) + (-3)(-3) = 6x - 12 + 9 = 6x - 3 = 0 \\implies x = 0,5 = -(-0,5) \\implies H(-0,5; 1)$."
  },
  {
    id: 9,
    title: "Vận Dụng SGK Trang 70 - Công Cơ Học Của Lực Kéo",
    pts: 20,
    question: "Một lực $\\vec{F}$ có độ lớn $50\\text{ N}$ tác dụng làm vật dịch chuyển một đoạn thẳng $s = 10\\text{ m}$ theo phương tạo với hướng của lực một góc $60^\\circ$. Công sinh bởi lực $\\vec{F}$ là:",
    options: [
      { text: "$500\\text{ J}$", correct: false },
      { text: "$250\\sqrt{3}\\text{ J}$", correct: false },
      { text: "$250\\text{ J}$", correct: true },
      { text: "$125\\text{ J}$", correct: false }
    ],
    explanation: "Công sinh bởi lực không đổi $\\vec{F}$ là tích vô hướng: $A = \\vec{F} \\cdot \\vec{s} = |\\vec{F}| \\cdot |\\vec{s}| \\cdot \\cos 60^\\circ = 50 \\cdot 10 \\cdot 0,5 = 250\\text{ J}$."
  },
  {
    id: 10,
    title: "Bài 4.26 SGK Trang 70 - Hệ Thức Trọng Tâm Leibniz",
    pts: 20,
    question: "Cho tam giác $ABC$ có trọng tâm $G$. Với mọi điểm $M$ tuỳ ý trong mặt phẳng, hệ thức nào sau đây luôn luôn **đúng**?",
    options: [
      { text: "$MA^2 + MB^2 + MC^2 = MG^2 + GA^2 + GB^2 + GC^2$", correct: false },
      { text: "$MA^2 + MB^2 + MC^2 = 3MG^2 + GA^2 + GB^2 + GC^2$", correct: true },
      { text: "$MA^2 + MB^2 + MC^2 = 2MG^2 + 3(GA^2 + GB^2 + GC^2)$", correct: false },
      { text: "$MA^2 + MB^2 + MC^2 = 3MG^2$", correct: false }
    ],
    explanation: "Khai triển bình phương vô hướng: $MA^2 = (\\overrightarrow{MG} + \\overrightarrow{GA})^2 = MG^2 + 2\\overrightarrow{MG}\\cdot\\overrightarrow{GA} + GA^2$. Tương tự cho $MB^2, MC^2$. Cộng từng vế: $MA^2 + MB^2 + MC^2 = 3MG^2 + (GA^2 + GB^2 + GC^2) + 2\\overrightarrow{MG}\\cdot(\\overrightarrow{GA} + \\overrightarrow{GB} + \\overrightarrow{GC})$. Do $G$ là trọng tâm nên $\\overrightarrow{GA} + \\overrightarrow{GB} + \\overrightarrow{GC} = \\vec{0}$, do đó số hạng tích vô hướng triệt tiêu, ta được: $MA^2 + MB^2 + MC^2 = 3MG^2 + GA^2 + GB^2 + GC^2$."
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
    unlockBadge(3, "Chiến Thần Đấu Trường Vô Hướng");
  }

  const answeredCount = Object.keys(appState.answered).length;
  if (answeredCount === 10) {
    const allCorrect = quizData.every(item => item.options[appState.answered[item.id]]?.correct);
    if (allCorrect) {
      unlockBadge(4, "Đại Kiện Tướng Trực Giao Vectơ");
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

// --- 5. LAB 1: INTERACTIVE DOT PRODUCT VISUALIZER (CANVAS 2D) ---
class DotProductLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.originX = 180;
    this.originY = 240;
    this.scale = 28; // px per unit

    this.angleDeg = 60;
    this.uLen = 5.0;
    this.vLen = 4.0;

    this.initEvents();
    this.update();
  }

  initEvents() {
    const angleSlider = document.getElementById('angleSlider');
    const uSlider = document.getElementById('uLenSlider');
    const vSlider = document.getElementById('vLenSlider');

    if (angleSlider) angleSlider.addEventListener('input', (e) => {
      this.angleDeg = parseFloat(e.target.value);
      document.getElementById('angleVal').innerText = `${this.angleDeg}°`;
      this.update();
    });

    if (uSlider) uSlider.addEventListener('input', (e) => {
      this.uLen = parseFloat(e.target.value);
      document.getElementById('uLenVal').innerText = this.uLen.toFixed(1);
      this.update();
    });

    if (vSlider) vSlider.addEventListener('input', (e) => {
      this.vLen = parseFloat(e.target.value);
      document.getElementById('vLenVal').innerText = this.vLen.toFixed(1);
      this.update();
    });

    const b90 = document.getElementById('btnSnap90');
    if (b90) b90.addEventListener('click', () => {
      sounds.playClick();
      this.angleDeg = 90;
      angleSlider.value = 90;
      document.getElementById('angleVal').innerText = '90°';
      this.update();
      unlockBadge(1, "Bậc Thầy Tích Vô Hướng");
    });

    const b0 = document.getElementById('btnSnap0');
    if (b0) b0.addEventListener('click', () => {
      sounds.playClick();
      this.angleDeg = 0;
      angleSlider.value = 0;
      document.getElementById('angleVal').innerText = '0°';
      this.update();
    });

    const b180 = document.getElementById('btnSnap180');
    if (b180) b180.addEventListener('click', () => {
      sounds.playClick();
      this.angleDeg = 180;
      angleSlider.value = 180;
      document.getElementById('angleVal').innerText = '180°';
      this.update();
    });

    const b45 = document.getElementById('btnSnap45');
    if (b45) b45.addEventListener('click', () => {
      sounds.playClick();
      this.angleDeg = 45;
      angleSlider.value = 45;
      document.getElementById('angleVal').innerText = '45°';
      this.update();
    });
  }

  update() {
    const rad = (this.angleDeg * Math.PI) / 180;
    const cosVal = Math.cos(rad);
    const dotVal = this.uLen * this.vLen * cosVal;

    document.getElementById('outCosVal').innerText = cosVal.toFixed(3);
    const sign = dotVal > 0 ? '+' : '';
    document.getElementById('outDotVal').innerText = `${sign}${dotVal.toFixed(2)}`;

    const stEl = document.getElementById('outStatusVal');
    if (Math.abs(dotVal) < 0.05) {
      stEl.innerText = 'Trực Giao (Vuông Góc 90°) ⚡';
      stEl.className = 'badge-gold';
    } else if (dotVal > 0) {
      stEl.innerText = 'Tích Dương (Góc Nhọn < 90°)';
      stEl.className = 'badge-green';
    } else {
      stEl.innerText = 'Tích Âm (Góc Tù > 90°)';
      stEl.className = 'badge-red';
    }

    this.draw(rad, cosVal, dotVal);
  }

  draw(rad, cosVal, dotVal) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Background grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = this.originX % this.scale; x < this.width; x += this.scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.height);
      ctx.stroke();
    }
    for (let y = this.originY % this.scale; y < this.height; y += this.scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.width, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(30, this.originY);
    ctx.lineTo(this.width - 30, this.originY);
    ctx.moveTo(this.originX, 30);
    ctx.lineTo(this.originX, this.height - 30);
    ctx.stroke();

    // Vector u along horizontal axis
    const uPixel = this.uLen * this.scale;
    const ux = this.originX + uPixel;
    const uy = this.originY;

    // Vector v rotated by angle
    const vPixel = this.vLen * this.scale;
    const vx = this.originX + vPixel * Math.cos(rad);
    const vy = this.originY - vPixel * Math.sin(rad);

    // Projection of v on u
    const projPixel = vPixel * cosVal;
    const projX = this.originX + projPixel;
    const projY = this.originY;

    // Draw projection dashed line
    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(vx, vy);
    ctx.lineTo(projX, projY);
    ctx.stroke();
    ctx.restore();

    // Angle Arc
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.originX, this.originY, 36, 0, -rad, true);
    ctx.stroke();

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px Segoe UI';
    const midRad = -rad / 2;
    ctx.fillText(`${this.angleDeg}°`, this.originX + 46 * Math.cos(midRad), this.originY + 46 * Math.sin(midRad));
    ctx.restore();

    // Color theme based on dot product
    let vColor = '#38bdf8';
    if (Math.abs(dotVal) < 0.05) vColor = '#facc15';
    else if (dotVal < 0) vColor = '#f87171';

    // Draw Vector u
    this.drawArrow(this.originX, this.originY, ux, uy, '#10b981', `u (${this.uLen.toFixed(1)})`, 3);

    // Draw Vector v
    this.drawArrow(this.originX, this.originY, vx, vy, vColor, `v (${this.vLen.toFixed(1)})`, 3);

    // Origin O
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(this.originX, this.originY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('O', this.originX - 14, this.originY + 16);

    // Projection Point H
    ctx.fillStyle = '#facc15';
    ctx.beginPath();
    ctx.arc(projX, projY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('H', projX - 4, projY + 16);

    // Formula overlay on canvas
    ctx.fillStyle = 'rgba(15, 23, 42, 0.8)';
    ctx.fillRect(this.width - 240, 20, 220, 75);
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.strokeRect(this.width - 240, 20, 220, 75);

    ctx.fillStyle = '#e2e8f0';
    ctx.font = '12px Segoe UI';
    ctx.fillText('Công thức tích vô hướng:', this.width - 230, 40);
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px Segoe UI';
    ctx.fillText(`u · v = |u||v| cos(α)`, this.width - 230, 60);
    ctx.fillStyle = '#facc15';
    ctx.fillText(`= ${this.uLen} × ${this.vLen} × (${cosVal.toFixed(2)}) = ${dotVal.toFixed(2)}`, this.width - 230, 80);
  }

  drawArrow(x1, y1, x2, y2, color, label, width = 2) {
    const ctx = this.ctx;
    const headLen = 10;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

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
    ctx.fillText(label, (x1 + x2) / 2 + 8, (y1 + y2) / 2 - 8);
    ctx.restore();
  }
}

// --- 6. LAB 2: PHYSICS WORK SIMULATION LAB (CANVAS 2D) ---
class PhysicsWorkLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.angleDeg = 30;
    this.force = 50;
    this.dist = 10;

    this.initEvents();
    this.update();
  }

  initEvents() {
    const aSlider = document.getElementById('pullAngleSlider');
    const fSlider = document.getElementById('forceSlider');
    const dSlider = document.getElementById('distSlider');

    if (aSlider) aSlider.addEventListener('input', (e) => {
      this.angleDeg = parseFloat(e.target.value);
      document.getElementById('pullAngleVal').innerText = `${this.angleDeg}°`;
      this.update();
    });

    if (fSlider) fSlider.addEventListener('input', (e) => {
      this.force = parseFloat(e.target.value);
      document.getElementById('forceVal').innerText = `${this.force} N`;
      this.update();
    });

    if (dSlider) dSlider.addEventListener('input', (e) => {
      this.dist = parseFloat(e.target.value);
      document.getElementById('distVal').innerText = `${this.dist} m`;
      this.update();
    });
  }

  update() {
    const rad = (this.angleDeg * Math.PI) / 180;
    const cosVal = Math.cos(rad);
    const sinVal = Math.sin(rad);

    const work = this.force * this.dist * cosVal;
    const ft = this.force * cosVal;
    const fn = this.force * sinVal;

    document.getElementById('outWorkVal').innerText = `${work.toFixed(1)} J`;
    document.getElementById('outFtVal').innerText = `${ft.toFixed(1)} N (Sinh công)`;
    document.getElementById('outFnVal').innerText = `${fn.toFixed(1)} N (Không sinh công)`;

    this.draw(rad, ft, fn, work);
  }

  draw(rad, ft, fn, work) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.width, this.height);

    const floorY = 240;

    // Ground line
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, floorY);
    ctx.lineTo(this.width - 30, floorY);
    ctx.stroke();

    // Hatch pattern under ground
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    for (let x = 30; x < this.width - 30; x += 15) {
      ctx.beginPath();
      ctx.moveTo(x, floorY);
      ctx.lineTo(x - 10, floorY + 12);
      ctx.stroke();
    }

    // Block dimensions
    const boxW = 80;
    const boxH = 50;
    const boxX = 140;
    const boxY = floorY - boxH;

    // Draw Box
    ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.fillRect(boxX, boxY, boxW, boxH);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(boxX, boxY, boxW, boxH);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Segoe UI';
    ctx.fillText('VẬT THỂ', boxX + 16, boxY + 30);

    // Force vector application point (Center of right face)
    const fx1 = boxX + boxW;
    const fy1 = boxY + boxH / 2;

    const fScale = 1.3;
    const fPixel = this.force * fScale;
    const fx2 = fx1 + fPixel * Math.cos(rad);
    const fy2 = fy1 - fPixel * Math.sin(rad);

    // Tangential & Normal component points
    const ftX = fx1 + (this.force * Math.cos(rad)) * fScale;
    const ftY = fy1;
    const fnX = fx1;
    const fnY = fy1 - (this.force * Math.sin(rad)) * fScale;

    // Component dashed lines
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
    ctx.beginPath();
    ctx.moveTo(fx2, fy2);
    ctx.lineTo(ftX, ftY);
    ctx.moveTo(fx2, fy2);
    ctx.lineTo(fnX, fnY);
    ctx.stroke();
    ctx.restore();

    // Draw Tangential Component Ft (Horizontal)
    this.drawArrow(fx1, fy1, ftX, ftY, '#38bdf8', `Ft=${ft.toFixed(0)}N`, 2);

    // Draw Normal Component Fn (Vertical)
    this.drawArrow(fx1, fy1, fnX, fnY, '#a855f7', `Fn=${fn.toFixed(0)}N`, 2);

    // Draw Force Vector F
    this.drawArrow(fx1, fy1, fx2, fy2, '#f59e0b', `F = ${this.force}N`, 3.5);

    // Angle Arc
    ctx.save();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(fx1, fy1, 30, 0, -rad, true);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.font = '11px Segoe UI';
    ctx.fillText(`${this.angleDeg}°`, fx1 + 36, fy1 - 8);
    ctx.restore();

    // Displacement Vector s
    const sPixel = Math.min(this.dist * 12, 180);
    this.drawArrow(boxX, floorY + 20, boxX + sPixel, floorY + 20, '#10b981', `s = ${this.dist}m`, 2);

    // Work Result Display Card
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(this.width - 250, 20, 230, 95);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.strokeRect(this.width - 250, 20, 230, 95);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Segoe UI';
    ctx.fillText('Định luật công cơ học:', this.width - 240, 40);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 13px Segoe UI';
    ctx.fillText(`A = F · s = |F||s| cos(α)`, this.width - 240, 60);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`= ${this.force} × ${this.dist} × cos(${this.angleDeg}°)`, this.width - 240, 80);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`= ${work.toFixed(1)} Joule (J)`, this.width - 240, 100);
  }

  drawArrow(x1, y1, x2, y2, color, label, width = 2) {
    if (Math.abs(x1 - x2) < 2 && Math.abs(y1 - y2) < 2) return;
    const ctx = this.ctx;
    const headLen = 8;
    const angle = Math.atan2(y2 - y1, x2 - x1);

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

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

    ctx.font = 'bold 11px Segoe UI';
    ctx.fillText(label, (x1 + x2) / 2 + 5, (y1 + y2) / 2 - 5);
    ctx.restore();
  }
}

// --- 7. INITIALIZATION & DOM EVENTS ---
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
        unlockBadge(0, 'Thấu Thị Góc Vectơ');
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
  window.lab1 = new DotProductLab('dotCanvas');
  window.lab2 = new PhysicsWorkLab('workCanvas');

  // Init Quiz
  renderQuiz();

  // Print Certificate
  document.getElementById('btnPrintCert').addEventListener('click', () => {
    sounds.playFanfare();
    window.print();
  });

  // Initial HUD
  updateHUD();
  unlockBadge(0, 'Thấu Thị Góc Vectơ');
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
