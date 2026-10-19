/* ================================================================
   BÀI 10: VECTƠ TRONG MẶT PHẲNG TOẠ ĐỘ - TOÁN 10
   Bộ sách: Kết Nối Tri Thức Với Cuộc Sống (Trang 60 - 65)
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
      notes.forEach((freq, idx) => {
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
  userTitle: 'Đại Kiện Tướng Toạ Độ Phẳng',
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

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG SGK (10 CÂU BÀI 4.16 - 4.20 TRANG 60 - 65) ---
const quizData = [
  {
    id: 1,
    title: "Định Nghĩa Toạ Độ Vectơ (SGK Trang 61)",
    pts: 20,
    question: "Trong mặt phẳng toạ độ $Oxy$, cho vectơ $\\vec{u} = 2\\vec{i} - 3\\vec{j}$. Toạ độ của vectơ $\\vec{u}$ là:",
    options: [
      { text: "$(2; 3)$", correct: false },
      { text: "$(-3; 2)$", correct: false },
      { text: "$(2; -3)$", correct: true },
      { text: "$(-2; -3)$", correct: false }
    ],
    explanation: "Theo định nghĩa SGK trang 61: Vectơ $\\vec{u} = x\\vec{i} + y\\vec{j}$ có toạ độ là $(x; y)$. Ở đây $\\vec{u} = 2\\vec{i} - 3\\vec{j} = 2\\vec{i} + (-3)\\vec{j}$ nên toạ độ của $\\vec{u}$ là $(2; -3)$."
  },
  {
    id: 2,
    title: "Bài 4.16a SGK Trang 65 - Tính Độ Dài Các Đoạn Thẳng",
    pts: 20,
    question: "Trong mặt phẳng toạ độ $Oxy$, cho các điểm $M(1; 3)$ và $N(4; 2)$. Độ dài của ba đoạn thẳng $OM, ON, MN$ lần lượt là:",
    options: [
      { text: "$OM = \\sqrt{10},\\; ON = 2\\sqrt{5},\\; MN = \\sqrt{10}$", correct: true },
      { text: "$OM = 10,\\; ON = 20,\\; MN = 10$", correct: false },
      { text: "$OM = \\sqrt{10},\\; ON = 4,\\; MN = \\sqrt{10}$", correct: false },
      { text: "$OM = 4,\\; ON = 5,\\; MN = 3$", correct: false }
    ],
    explanation: "Áp dụng công thức khoảng cách: $OM = \\sqrt{1^2 + 3^2} = \\sqrt{10}$; $ON = \\sqrt{4^2 + 2^2} = \\sqrt{20} = 2\\sqrt{5}$; $\\overrightarrow{MN} = (4 - 1; 2 - 3) = (3; -1) \\implies MN = \\sqrt{3^2 + (-1)^2} = \\sqrt{10}$."
  },
  {
    id: 3,
    title: "Bài 4.16b SGK Trang 65 - Chứng Minh Tam Giác Vuông Cân",
    pts: 20,
    question: "Tam giác $OMN$ với $O(0; 0), M(1; 3), N(4; 2)$ có đặc điểm gì?",
    options: [
      { text: "Tam giác đều cạnh $\\sqrt{10}$", correct: false },
      { text: "Tam giác vuông cân tại $M$", correct: true },
      { text: "Tam giác vuông cân tại $O$", correct: false },
      { text: "Tam giác tù có góc $\\widehat{M} = 120^\\circ$", correct: false }
    ],
    explanation: "Từ câu trước: $OM = \\sqrt{10}$ và $MN = \\sqrt{10} \\implies OM = MN$. Mặt khác: $OM^2 + MN^2 = 10 + 10 = 20 = ON^2$. Theo định lí Pythagore đảo, tam giác $OMN$ vuông tại $M$. Do đó tam giác $OMN$ vuông cân tại đỉnh $M$."
  },
  {
    id: 4,
    title: "Bài 4.17a SGK Trang 65 - Mối Quan Hệ Giữa Hai Vectơ",
    pts: 20,
    question: "Cho $\\vec{a} = 3\\vec{i} - 2\\vec{j}$, $\\vec{b} = (4; -1)$ và hai điểm $M(-3; 6), N(3; -3)$. Tìm mối liên hệ giữa vectơ $\\overrightarrow{MN}$ và vectơ $2\\vec{a} - \\vec{b}$.",
    options: [
      { text: "$\\overrightarrow{MN} = 2\\vec{a} - \\vec{b}$", correct: false },
      { text: "$\\overrightarrow{MN} = 2(2\\vec{a} - \\vec{b})$", correct: false },
      { text: "$\\overrightarrow{MN} = 3(2\\vec{a} - \\vec{b})$", correct: true },
      { text: "$\\overrightarrow{MN} = -3(2\\vec{a} - \\vec{b})$", correct: false }
    ],
    explanation: "Ta có: $\\vec{a} = (3; -2) \\implies 2\\vec{a} = (6; -4)$. Vectơ $2\\vec{a} - \\vec{b} = (6 - 4; -4 - (-1)) = (2; -3)$. Mặt khác $\\overrightarrow{MN} = (3 - (-3); -3 - 6) = (6; -9)$. Nhận thấy $(6; -9) = 3(2; -3)$, vậy $\\overrightarrow{MN} = 3(2\\vec{a} - \\vec{b})$."
  },
  {
    id: 5,
    title: "Bài 4.17b SGK Trang 65 - Kiểm Tra Ba Điểm Thẳng Hàng",
    pts: 20,
    question: "Các điểm $O(0; 0), M(-3; 6), N(3; -3)$ có thẳng hàng hay không? Vì sao?",
    options: [
      { text: "Có thẳng hàng vì tổng hoành độ bằng $0$.", correct: false },
      { text: "Không thẳng hàng vì hai vectơ $\\overrightarrow{OM}$ và $\\overrightarrow{ON}$ không cùng phương.", correct: true },
      { text: "Có thẳng hàng vì hai vectơ $\\overrightarrow{OM}$ và $\\overrightarrow{ON}$ cùng phương.", correct: false },
      { text: "Không thẳng hàng vì tam giác $OMN$ đều.", correct: false }
    ],
    explanation: "Ta có: $\\overrightarrow{OM} = (-3; 6)$ và $\\overrightarrow{ON} = (3; -3)$. Tỉ số các toạ độ: $\\frac{-3}{3} = -1$ trong khi $\\frac{6}{-3} = -2 \\neq -1$. Do đó hai vectơ $\\overrightarrow{OM}$ và $\\overrightarrow{ON}$ không cùng phương, nghĩa là ba điểm $O, M, N$ không thẳng hàng."
  },
  {
    id: 6,
    title: "Bài 4.17c SGK Trang 65 - Tìm Điểm Để Tứ Giác Là Hình Bình Hành",
    pts: 20,
    question: "Tìm toạ độ điểm $P(x; y)$ để tứ giác $OMNP$ là một hình bình hành, với $O(0; 0), M(-3; 6), N(3; -3)$.",
    options: [
      { text: "$P(0; 3)$", correct: false },
      { text: "$P(-6; 9)$", correct: false },
      { text: "$P(6; -9)$", correct: true },
      { text: "$P(3; -6)$", correct: false }
    ],
    explanation: "Tứ giác $OMNP$ là hình bình hành khi và chỉ khi $\\overrightarrow{OP} = \\overrightarrow{MN}$. Ta có $\\overrightarrow{OP} = (x - 0; y - 0) = (x; y)$ và $\\overrightarrow{MN} = (6; -9)$. Do đó $x = 6$ và $y = -9$, tức điểm $P$ có toạ độ $(6; -9)$."
  },
  {
    id: 7,
    title: "Bài 4.18b,c SGK Trang 65 - Toạ Độ Trung Điểm & Trọng Tâm",
    pts: 20,
    question: "Cho tam giác $ABC$ có $A(1; 3), B(2; 4), C(-3; 2)$. Toạ độ trung điểm $M$ của cạnh $AB$ và toạ độ trọng tâm $G$ của tam giác $ABC$ lần lượt là:",
    options: [
      { text: "$M(1,5; 3,5)$ và $G(0; 3)$", correct: true },
      { text: "$M(3; 7)$ và $G(0; 9)$", correct: false },
      { text: "$M(1,5; 3,5)$ và $G(1; 2)$", correct: false },
      { text: "$M(0,5; 0,5)$ và $G(0; 3)$", correct: false }
    ],
    explanation: "Toạ độ trung điểm $M$ của $AB$: $x_M = \\frac{1 + 2}{2} = 1,5$; $y_M = \\frac{3 + 4}{2} = 3,5 \\implies M(1,5; 3,5)$. Toạ độ trọng tâm $G$: $x_G = \\frac{1 + 2 + (-3)}{3} = 0$; $y_G = \\frac{3 + 4 + 2}{3} = \\frac{9}{3} = 3 \\implies G(0; 3)$."
  },
  {
    id: 8,
    title: "Bài 4.18d SGK Trang 65 - Tìm Điểm Để Gốc Toạ Độ Là Trọng Tâm",
    pts: 20,
    question: "Cho hai điểm $A(1; 3)$ và $B(2; 4)$. Tìm toạ độ điểm $D(x; y)$ để điểm $O(0; 0)$ là trọng tâm của tam giác $ABD$.",
    options: [
      { text: "$D(3; 7)$", correct: false },
      { text: "$D(-3; -7)$", correct: true },
      { text: "$D(-1; -1)$", correct: false },
      { text: "$D(-1,5; -3,5)$", correct: false }
    ],
    explanation: "Để $O(0; 0)$ là trọng tâm của tam giác $ABD$, ta cần: $x_O = \\frac{x_A + x_B + x_D}{3} \\implies 0 = \\frac{1 + 2 + x_D}{3} \\implies x_D = -3$. Tương tự: $y_O = \\frac{y_A + y_B + y_D}{3} \\implies 0 = \\frac{3 + 4 + y_D}{3} \\implies y_D = -7$. Vậy toạ độ điểm $D$ là $(-3; -7)$."
  },
  {
    id: 9,
    title: "Bài 4.19 SGK Trang 65 - Chuyển Động Của Tàu Thuỷ",
    pts: 20,
    question: "Tàu thuỷ khởi hành từ vị trí $A(1; 2)$ chuyển động thẳng đều với vận tốc $\\vec{v} = (3; 4)$ (km/h). Xác định vị trí của tàu (trên mặt phẳng toạ độ) tại thời điểm sau khi khởi hành $1,5$ giờ.",
    options: [
      { text: "$(4,5; 6,0)$", correct: false },
      { text: "$(5,5; 8,0)$", correct: true },
      { text: "$(4,0; 6,0)$", correct: false },
      { text: "$(5,0; 7,5)$", correct: false }
    ],
    explanation: "Độ dịch chuyển sau $t = 1,5$ giờ là: $\\Delta\\vec{r} = t\\vec{v} = 1,5 \\cdot (3; 4) = (4,5; 6)$. Vị trí của tàu lúc đó là điểm $A'$ thoả mãn $\\overrightarrow{OA'} = \\overrightarrow{OA} + \\Delta\\vec{r} = (1 + 4,5; 2 + 6) = (5,5; 8)$. Vậy toạ độ của tàu là $(5,5; 8)$."
  },
  {
    id: 10,
    title: "Bài 4.20 SGK Trang 65 - Nước Đi Quân Mã Trên Bàn Cờ Vua",
    pts: 20,
    question: "Trong Hình 4.38 SGK, quân mã đang ở vị trí có toạ độ $(1; 2)$. Hỏi sau một nước đi hợp lệ, quân mã có thể đến vị trí nào trong các vị trí sau?",
    options: [
      { text: "$(2; 3)$", correct: false },
      { text: "$(2; 4)$", correct: true },
      { text: "$(1; 4)$", correct: false },
      { text: "$(3; 2)$", correct: false }
    ],
    explanation: "Quy tắc di chuyển quân mã: Vectơ bước nhảy $\\vec{s} = (\\Delta x; \\Delta y)$ thoả mãn $(|\\Delta x|; |\\Delta y|) \\in \\{(1; 2), (2; 1)\\}$. Từ vị trí ban đầu $(1; 2)$: Nếu $\\Delta x = 1, \\Delta y = 2$, vị trí mới là $(1 + 1; 2 + 2) = (2; 4)$! Các phương án $(2; 3)$, $(1; 4)$, $(3; 2)$ không thoả mãn bước nhảy hình chữ L của quân mã."
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
    unlockBadge(3, "Chiến Thần Đấu Trường Toạ Độ");
  }

  const answeredCount = Object.keys(appState.answered).length;
  if (answeredCount === 10) {
    const allCorrect = quizData.every(item => item.options[appState.answered[item.id]]?.correct);
    if (allCorrect) {
      unlockBadge(4, "Đại Kiện Tướng Toạ Độ Phẳng");
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

// --- 5. LAB 1: INTERACTIVE COORDINATE PLANE (CANVAS 2D) ---
class InteractiveCoordinateLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.originX = this.width / 2;
    this.originY = this.height / 2;
    this.scale = 26; // pixels per unit

    this.ptA = { x: -3, y: -2 };
    this.ptB = { x: 3, y: 2 };
    this.ptC = { x: 0, y: 3 };
    this.showPointC = false;

    this.initEvents();
    this.update();
  }

  toScreen(x, y) {
    return {
      sx: this.originX + x * this.scale,
      sy: this.originY - y * this.scale
    };
  }

  initEvents() {
    const xASlider = document.getElementById('xASlider');
    const yASlider = document.getElementById('yASlider');
    const xBSlider = document.getElementById('xBSlider');
    const yBSlider = document.getElementById('yBSlider');

    if (xASlider) xASlider.addEventListener('input', (e) => {
      this.ptA.x = parseFloat(e.target.value);
      document.getElementById('xAVal').innerText = this.ptA.x;
      this.update();
    });

    if (yASlider) yASlider.addEventListener('input', (e) => {
      this.ptA.y = parseFloat(e.target.value);
      document.getElementById('yAVal').innerText = this.ptA.y;
      this.update();
    });

    if (xBSlider) xBSlider.addEventListener('input', (e) => {
      this.ptB.x = parseFloat(e.target.value);
      document.getElementById('xBVal').innerText = this.ptB.x;
      this.update();
    });

    if (yBSlider) yBSlider.addEventListener('input', (e) => {
      this.ptB.y = parseFloat(e.target.value);
      document.getElementById('yBVal').innerText = this.ptB.y;
      this.update();
    });

    const toggleBtn = document.getElementById('btnTogglePointC');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', () => {
        sounds.playClick();
        this.showPointC = !this.showPointC;
        document.getElementById('boxTrigG').style.display = this.showPointC ? 'block' : 'none';
        toggleBtn.innerText = this.showPointC ? '❌ Tắt Điểm C' : '📐 Bật Điểm C (Tạo △ABC)';
        this.update();
      });
    }

    const p1 = document.getElementById('btnPresetCoord1');
    if (p1) p1.addEventListener('click', () => {
      sounds.playClick();
      this.ptA = { x: 1, y: 3 };
      this.ptB = { x: 4, y: 2 };
      this.syncSliders();
      this.update();
      unlockBadge(1, "Bậc Thầy Trục Oxy");
    });

    const p2 = document.getElementById('btnPresetCoord2');
    if (p2) p2.addEventListener('click', () => {
      sounds.playClick();
      this.ptA = { x: -3, y: 6 };
      this.ptB = { x: 3, y: -3 };
      this.syncSliders();
      this.update();
      unlockBadge(1, "Bậc Thầy Trục Oxy");
    });

    const rst = document.getElementById('btnResetCoord');
    if (rst) rst.addEventListener('click', () => {
      sounds.playClick();
      this.ptA = { x: -3, y: -2 };
      this.ptB = { x: 3, y: 2 };
      this.syncSliders();
      this.update();
    });
  }

  syncSliders() {
    document.getElementById('xASlider').value = this.ptA.x;
    document.getElementById('yASlider').value = this.ptA.y;
    document.getElementById('xBSlider').value = this.ptB.x;
    document.getElementById('yBSlider').value = this.ptB.y;
    document.getElementById('xAVal').innerText = this.ptA.x;
    document.getElementById('yAVal').innerText = this.ptA.y;
    document.getElementById('xBVal').innerText = this.ptB.x;
    document.getElementById('yBVal').innerText = this.ptB.y;
  }

  update() {
    this.draw();

    // Calculations
    const dx = this.ptB.x - this.ptA.x;
    const dy = this.ptB.y - this.ptA.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const mx = (this.ptA.x + this.ptB.x) / 2;
    const my = (this.ptA.y + this.ptB.y) / 2;

    document.getElementById('outVecAB').innerText = `(${dx}; ${dy})`;
    document.getElementById('outDistAB').innerText = dist.toFixed(2);
    document.getElementById('outMidM').innerText = `(${mx.toFixed(1)}; ${my.toFixed(1)})`;

    if (this.showPointC) {
      const gx = (this.ptA.x + this.ptB.x + this.ptC.x) / 3;
      const gy = (this.ptA.y + this.ptB.y + this.ptC.y) / 3;
      document.getElementById('outGravG').innerText = `(${gx.toFixed(2)}; ${gy.toFixed(2)})`;
    }
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Background Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
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
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, this.originY);
    ctx.lineTo(this.width, this.originY);
    ctx.moveTo(this.originX, 0);
    ctx.lineTo(this.originX, this.height);
    ctx.stroke();

    // Arrows
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(this.width - 10, this.originY - 5);
    ctx.lineTo(this.width, this.originY);
    ctx.lineTo(this.width - 10, this.originY + 5);
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(this.originX - 5, 10);
    ctx.lineTo(this.originX, 0);
    ctx.lineTo(this.originX + 5, 10);
    ctx.fill();

    // Axis Labels
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.fillText('x', this.width - 15, this.originY - 10);
    ctx.fillText('y', this.originX + 10, 15);
    ctx.fillText('O', this.originX - 14, this.originY + 16);

    // Unit Vectors i and j
    const ui = this.toScreen(1, 0);
    const uj = this.toScreen(0, 1);
    this.drawVector(this.originX, this.originY, ui.sx, ui.sy, '#f59e0b', 'i (1;0)', 2);
    this.drawVector(this.originX, this.originY, uj.sx, uj.sy, '#10b981', 'j (0;1)', 2);

    const scrA = this.toScreen(this.ptA.x, this.ptA.y);
    const scrB = this.toScreen(this.ptB.x, this.ptB.y);

    if (this.showPointC) {
      const scrC = this.toScreen(this.ptC.x, this.ptC.y);
      // Triangle ABC
      ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(scrA.sx, scrA.sy);
      ctx.lineTo(scrB.sx, scrB.sy);
      ctx.lineTo(scrC.sx, scrC.sy);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Point C
      this.drawPoint(scrC.sx, scrC.sy, '#ec4899', `C(${this.ptC.x};${this.ptC.y})`);

      // Centroid G
      const gx = (this.ptA.x + this.ptB.x + this.ptC.x) / 3;
      const gy = (this.ptA.y + this.ptB.y + this.ptC.y) / 3;
      const scrG = this.toScreen(gx, gy);
      this.drawPoint(scrG.sx, scrG.sy, '#10b981', `G(${gx.toFixed(1)};${gy.toFixed(1)})`, 7);
    }

    // Vector AB
    this.drawVector(scrA.sx, scrA.sy, scrB.sx, scrB.sy, '#38bdf8', 'AB', 3);

    // Midpoint M
    const mx = (this.ptA.x + this.ptB.x) / 2;
    const my = (this.ptA.y + this.ptB.y) / 2;
    const scrM = this.toScreen(mx, my);
    this.drawPoint(scrM.sx, scrM.sy, '#f59e0b', `M(${mx.toFixed(1)};${my.toFixed(1)})`, 5);

    // Points A and B
    this.drawPoint(scrA.sx, scrA.sy, '#ef4444', `A(${this.ptA.x};${this.ptA.y})`, 6);
    this.drawPoint(scrB.sx, scrB.sy, '#a855f7', `B(${this.ptB.x};${this.ptB.y})`, 6);
  }

  drawPoint(x, y, color, label, radius = 5) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(label, x + 8, y - 6);
    ctx.restore();
  }

  drawVector(x1, y1, x2, y2, color, label, width = 2) {
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

    if (label) {
      ctx.font = 'bold 12px Segoe UI, sans-serif';
      ctx.fillText(label, (x1 + x2) / 2 + 6, (y1 + y2) / 2 - 6);
    }
    ctx.restore();
  }
}

// --- 6. LAB 2: SHIP MOTION & CHESSBOARD SIMULATION LAB (CANVAS 2D) ---
class SimulationLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.mode = 'ship'; // 'ship' or 'knight'
    this.time = 1.5;
    this.vBase = 3;
    this.knightPos = { x: 1, y: 2 };

    this.initEvents();
    this.update();
  }

  initEvents() {
    const btnShip = document.getElementById('btnModeShip');
    const btnKnight = document.getElementById('btnModeKnight');
    const shipControls = document.getElementById('shipControls');
    const knightControls = document.getElementById('knightControls');
    const shipOut1 = document.getElementById('shipOutput1');
    const shipOut2 = document.getElementById('shipOutput2');
    const knightOut = document.getElementById('knightOutput');

    if (btnShip) btnShip.addEventListener('click', () => {
      sounds.playClick();
      this.mode = 'ship';
      btnShip.classList.add('active');
      btnKnight.classList.remove('active');
      shipControls.style.display = 'block';
      knightControls.style.display = 'none';
      shipOut1.style.display = 'block';
      shipOut2.style.display = 'block';
      knightOut.style.display = 'none';
      this.update();
    });

    if (btnKnight) btnKnight.addEventListener('click', () => {
      sounds.playClick();
      this.mode = 'knight';
      btnKnight.classList.add('active');
      btnShip.classList.remove('active');
      shipControls.style.display = 'none';
      knightControls.style.display = 'block';
      shipOut1.style.display = 'none';
      shipOut2.style.display = 'none';
      knightOut.style.display = 'block';
      this.update();
      unlockBadge(2, "Kiện Tướng Cờ Toạ Độ");
    });

    const timeSlider = document.getElementById('timeSlider');
    if (timeSlider) timeSlider.addEventListener('input', (e) => {
      this.time = parseFloat(e.target.value);
      document.getElementById('timeVal').innerText = `${this.time} giờ`;
      this.update();
    });

    const velSlider = document.getElementById('velSlider');
    if (velSlider) velSlider.addEventListener('input', (e) => {
      this.vBase = parseFloat(e.target.value);
      const vy = (this.vBase * 4 / 3).toFixed(1);
      document.getElementById('velVal').innerText = `(${this.vBase}; ${vy}) km/h`;
      this.update();
    });

    const kSlider = document.getElementById('knightXSlider');
    if (kSlider) kSlider.addEventListener('input', (e) => {
      this.knightPos.x = parseInt(e.target.value);
      document.getElementById('knightPosVal').innerText = `(${this.knightPos.x}; ${this.knightPos.y})`;
      this.update();
    });

    this.canvas.addEventListener('click', (e) => {
      if (this.mode !== 'knight') return;
      sounds.playClick();
      const rect = this.canvas.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      // Grid dimensions: 6 cols, 6 rows starting at (70, 40), cell size 45
      const startX = 70;
      const startY = 40;
      const cellSize = 42;
      const col = Math.floor((cx - startX) / cellSize) + 1;
      const row = 6 - Math.floor((cy - startY) / cellSize);

      if (col >= 1 && col <= 6 && row >= 1 && row <= 6) {
        this.knightPos = { x: col, y: row };
        document.getElementById('knightPosVal').innerText = `(${col}; ${row})`;
        if (kSlider) kSlider.value = col;
        this.update();
        unlockBadge(2, "Kiện Tướng Cờ Toạ Độ");
      }
    });
  }

  update() {
    if (this.mode === 'ship') {
      this.drawShip();
      const vx = this.vBase;
      const vy = this.vBase * 4 / 3;
      const currentX = 1 + vx * this.time;
      const currentY = 2 + vy * this.time;
      const speed = Math.sqrt(vx * vx + vy * vy);
      const dist = speed * this.time;

      document.getElementById('shipPosDisplay').innerText = `(${currentX.toFixed(1)}; ${currentY.toFixed(1)})`;
      document.getElementById('shipDistDisplay').innerText = `${dist.toFixed(1)} km`;
    } else {
      this.drawKnight();
    }
  }

  drawShip() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Ocean grid
    ctx.fillStyle = '#09152b';
    ctx.fillRect(0, 0, this.width, this.height);

    // Coordinates grid
    const originX = 60;
    const originY = this.height - 50;
    const scale = 28;

    ctx.strokeStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.lineWidth = 1;
    for (let x = originX; x < this.width; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, originY);
      ctx.stroke();
    }
    for (let y = originY; y >= 20; y -= scale) {
      ctx.beginPath();
      ctx.moveTo(originX, y);
      ctx.lineTo(this.width - 20, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(originX, 20);
    ctx.lineTo(originX, originY);
    ctx.lineTo(this.width - 20, originY);
    ctx.stroke();

    // Axis Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Segoe UI';
    ctx.fillText('x (Hải trình km)', this.width - 110, originY + 22);
    ctx.fillText('y (km)', originX - 40, 30);
    ctx.fillText('O(0;0)', originX - 25, originY + 18);

    // Start Position A(1; 2)
    const ax = originX + 1 * scale;
    const ay = originY - 2 * scale;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(ax, ay, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('Cảng A(1; 2)', ax + 8, ay - 6);

    // Current position
    const vx = this.vBase;
    const vy = this.vBase * 4 / 3;
    const cx = 1 + vx * this.time;
    const cy = 2 + vy * this.time;
    const curScreenX = originX + cx * scale;
    const curScreenY = originY - cy * scale;

    // Path Line
    ctx.strokeStyle = 'rgba(250, 204, 21, 0.7)';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(curScreenX, curScreenY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Ship Icon
    ctx.font = '24px Segoe UI';
    ctx.fillText('🚢', curScreenX - 12, curScreenY + 8);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px Segoe UI';
    ctx.fillText(`Tàu (${cx.toFixed(1)}; ${cy.toFixed(1)})`, curScreenX + 12, curScreenY - 8);
  }

  drawKnight() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.width, this.height);

    const startX = 70;
    const startY = 40;
    const cellSize = 42;
    const gridSize = 6;

    // Draw board
    for (let c = 1; c <= gridSize; c++) {
      for (let r = 1; r <= gridSize; r++) {
        const sx = startX + (c - 1) * cellSize;
        const sy = startY + (gridSize - r) * cellSize;
        const isDark = (c + r) % 2 === 0;

        ctx.fillStyle = isDark ? '#334155' : '#64748b';
        ctx.fillRect(sx, sy, cellSize, cellSize);
        ctx.strokeStyle = '#1e293b';
        ctx.strokeRect(sx, sy, cellSize, cellSize);

        // Coordinate labels
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.font = '9px Segoe UI';
        ctx.fillText(`${c},${r}`, sx + 3, sy + 12);
      }
    }

    // Knight position
    const kx = this.knightPos.x;
    const ky = this.knightPos.y;

    // Legal moves: (+/-1, +/-2) and (+/-2, +/-1)
    const offsets = [
      { dx: 1, dy: 2 }, { dx: 2, dy: 1 },
      { dx: -1, dy: 2 }, { dx: -2, dy: 1 },
      { dx: 1, dy: -2 }, { dx: 2, dy: -1 },
      { dx: -1, dy: -2 }, { dx: -2, dy: -1 }
    ];

    let validCount = 0;
    offsets.forEach(off => {
      const tx = kx + off.dx;
      const ty = ky + off.dy;
      if (tx >= 1 && tx <= gridSize && ty >= 1 && ty <= gridSize) {
        validCount++;
        const tsx = startX + (tx - 1) * cellSize;
        const tsy = startY + (gridSize - ty) * cellSize;

        // Highlight valid square
        ctx.fillStyle = 'rgba(16, 185, 129, 0.5)';
        ctx.fillRect(tsx, tsy, cellSize, cellSize);
        ctx.strokeStyle = '#34d399';
        ctx.lineWidth = 2;
        ctx.strokeRect(tsx, tsy, cellSize, cellSize);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px Segoe UI';
        ctx.fillText(`(${tx};${ty})`, tsx + 6, tsy + 26);
      }
    });

    document.getElementById('knightMovesDisplay').innerText = `${validCount} vị trí`;

    // Draw Knight at (kx, ky)
    const knScreenX = startX + (kx - 1) * cellSize;
    const knScreenY = startY + (gridSize - ky) * cellSize;

    ctx.fillStyle = 'rgba(239, 68, 68, 0.4)';
    ctx.fillRect(knScreenX, knScreenY, cellSize, cellSize);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.strokeRect(knScreenX, knScreenY, cellSize, cellSize);

    ctx.font = '28px Segoe UI';
    ctx.fillText('♞', knScreenX + 6, knScreenY + 32);

    // Legend
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '13px Segoe UI';
    ctx.fillText('🟢 Ô màu xanh: Nước đi hợp lệ của quân mã (Δx; Δy) ∈ {(±1; ±2), (±2; ±1)}', startX + 280, startY + 60);
    ctx.fillText('🔴 Ô màu đỏ: Vị trí hiện tại của quân mã', startX + 280, startY + 95);
    ctx.fillText('👉 Nhấp trực tiếp vào ô cờ để di chuyển quân mã!', startX + 280, startY + 130);
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
        unlockBadge(0, 'Người Khai Phá Toạ Độ');
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
  window.lab1 = new InteractiveCoordinateLab('coordCanvas');
  window.lab2 = new SimulationLab('simCanvas');

  // Init Quiz
  renderQuiz();

  // Print Certificate
  document.getElementById('btnPrintCert').addEventListener('click', () => {
    sounds.playFanfare();
    window.print();
  });

  // Initial HUD
  updateHUD();
  unlockBadge(0, 'Người Khai Phá Toạ Độ');
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
