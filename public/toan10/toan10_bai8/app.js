/* ================================================================
   BÀI 8: TỔNG VÀ HIỆU CỦA HAI VECTƠ - TOÁN 10
   Bộ sách: Kết Nối Tri Thức Với Cuộc Sống (Trang 51 - 54)
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
  userTitle: 'Đại Kiện Tướng Tổng Hiệu Vectơ',
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

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG SGK (10 CÂU BÀI 4.6 - 4.10 TRANG 51 - 54) ---
const quizData = [
  {
    id: 1,
    title: "Bài 4.6a SGK Trang 54 - Quy Tắc Ba Điểm Nối Tiếp",
    pts: 20,
    question: "Cho bốn điểm bất kì $A, B, C, D$. Rút gọn biểu thức tổng nối tiếp $\\overrightarrow{AB} + \\overrightarrow{BC} + \\overrightarrow{CD} + \\overrightarrow{DA}$ ta được kết quả là:",
    options: [
      { text: "$2\\overrightarrow{AC}$", correct: false },
      { text: "$\\vec{0}$", correct: true },
      { text: "$\\overrightarrow{BD}$", correct: false },
      { text: "$2\\overrightarrow{BD}$", correct: false }
    ],
    explanation: "Theo quy tắc ba điểm: $\\overrightarrow{AB} + \\overrightarrow{BC} = \\overrightarrow{AC}$; $\\overrightarrow{AC} + \\overrightarrow{CD} = \\overrightarrow{AD}$; $\\overrightarrow{AD} + \\overrightarrow{DA} = \\overrightarrow{AA} = \\vec{0}$."
  },
  {
    id: 2,
    title: "Bài 4.6b SGK Trang 54 - Quy Tắc Hiệu Hai Vectơ",
    pts: 20,
    question: "Cho bốn điểm bất kì $A, B, C, D$. Rút gọn biểu thức $(\\overrightarrow{AC} - \\overrightarrow{AD}) - (\\overrightarrow{BC} - \\overrightarrow{BD})$ ta được:",
    options: [
      { text: "$\\overrightarrow{CD}$", correct: false },
      { text: "$\\overrightarrow{DC}$", correct: false },
      { text: "$\\vec{0}$", correct: true },
      { text: "$2\\overrightarrow{DC}$", correct: false }
    ],
    explanation: "Ta có: $\\overrightarrow{AC} - \\overrightarrow{AD} = \\overrightarrow{DC}$ và $\\overrightarrow{BC} - \\overrightarrow{BD} = \\overrightarrow{DC}$. Do đó: $(\\overrightarrow{AC} - \\overrightarrow{AD}) - (\\overrightarrow{BC} - \\overrightarrow{BD}) = \\overrightarrow{DC} - \\overrightarrow{DC} = \\vec{0}$."
  },
  {
    id: 3,
    title: "Bài 4.7 SGK Trang 54 - Quy Tắc Hình Bình Hành & Vectơ Đối",
    pts: 20,
    question: "Cho hình bình hành $ABCD$. Điểm $M$ thoả mãn $\\overrightarrow{BM} = \\overrightarrow{AB} + \\overrightarrow{AD}$. Khẳng định nào sau đây về mối quan hệ giữa hai vectơ $\\overrightarrow{CD}$ và $\\overrightarrow{CM}$ là **đúng**?",
    options: [
      { text: "$\\overrightarrow{CD} = \\overrightarrow{CM}$ (hai vectơ bằng nhau)", correct: false },
      { text: "$\\overrightarrow{CD}$ và $\\overrightarrow{CM}$ là hai vectơ đối nhau (tức $\\overrightarrow{CD} = -\\overrightarrow{CM}$)", correct: true },
      { text: "$\\overrightarrow{CD}$ vuông góc với $\\overrightarrow{CM}$", correct: false },
      { text: "$|\\overrightarrow{CD}| = 2|\\overrightarrow{CM}|$", correct: false }
    ],
    explanation: "Vì $ABCD$ là hình bình hành nên $\\overrightarrow{AB} + \\overrightarrow{AD} = \\overrightarrow{AC}$. Suy ra $\\overrightarrow{BM} = \\overrightarrow{AC}$, nghĩa là tứ giác $ABMC$ là hình bình hành. Khi đó $\\overrightarrow{CM} = \\overrightarrow{AB}$. Mặt khác trong hình bình hành $ABCD$, $\\overrightarrow{AB} = \\overrightarrow{DC} = -\\overrightarrow{CD}$. Vậy $\\overrightarrow{CM} = -\\overrightarrow{CD}$, tức $\\overrightarrow{CD}$ và $\\overrightarrow{CM}$ là hai vectơ đối nhau."
  },
  {
    id: 4,
    title: "Bài 4.8 SGK Trang 54 - Độ Dài Vectơ Tổng & Hiệu Tam Giác Đều",
    pts: 20,
    question: "Cho tam giác đều $ABC$ có cạnh bằng $a$. Độ dài của hai vectơ $\\overrightarrow{AB} - \\overrightarrow{AC}$ và $\\overrightarrow{AB} + \\overrightarrow{AC}$ lần lượt là:",
    options: [
      { text: "$a$ và $a\\sqrt{3}$", correct: true },
      { text: "$a\\sqrt{3}$ và $a$", correct: false },
      { text: "$2a$ và $a\\sqrt{3}$", correct: false },
      { text: "$a$ và $\\frac{a\\sqrt{3}}{2}$", correct: false }
    ],
    explanation: "Ta có: $\\overrightarrow{AB} - \\overrightarrow{AC} = \\overrightarrow{CB} \\implies |\\overrightarrow{AB} - \\overrightarrow{AC}| = CB = a$. Gọi $M$ là trung điểm $BC$, ta có $\\overrightarrow{AB} + \\overrightarrow{AC} = 2\\overrightarrow{AM} \\implies |\\overrightarrow{AB} + \\overrightarrow{AC}| = 2AM = 2 \\cdot \\frac{a\\sqrt{3}}{2} = a\\sqrt{3}$."
  },
  {
    id: 5,
    title: "Ví dụ 1 SGK Trang 52 - Tổng Vectơ Trong Hình Thoi",
    pts: 20,
    question: "Cho hình thoi $ABCD$ với cạnh có độ dài bằng $1$ và góc $\\widehat{BAD} = 120^\\circ$. Tính độ dài của vectơ $\\overrightarrow{CB} + \\overrightarrow{CD}$.",
    options: [
      { text: "$\\sqrt{3}$", correct: false },
      { text: "$1$", correct: true },
      { text: "$2$", correct: false },
      { text: "$\\frac{1}{2}$", correct: false }
    ],
    explanation: "Theo quy tắc hình bình hành, $\\overrightarrow{CB} + \\overrightarrow{CD} = \\overrightarrow{CA}$. Vì $ABCD$ là hình thoi có $\\widehat{BAD} = 120^\\circ$ nên $\\widehat{ABC} = 60^\\circ$, suy ra tam giác $ABC$ là tam giác đều cạnh $1$. Do đó đường chéo $AC = 1$. Vậy $|\\overrightarrow{CB} + \\overrightarrow{CD}| = |\\overrightarrow{CA}| = CA = 1$."
  },
  {
    id: 6,
    title: "Luyện Tập 2 SGK Trang 53 - Tính Chất Trung Điểm Tứ Giác",
    pts: 20,
    question: "Cho tứ giác $ABCD$. Gọi $M, N$ lần lượt là trung điểm của $AB, CD$ và $O$ là trung điểm của $MN$. Khi đó khẳng định nào sau đây là **đúng**?",
    options: [
      { text: "$\\overrightarrow{OA} + \\overrightarrow{OB} + \\overrightarrow{OC} + \\overrightarrow{OD} = \\overrightarrow{MN}$", correct: false },
      { text: "$\\overrightarrow{OA} + \\overrightarrow{OB} + \\overrightarrow{OC} + \\overrightarrow{OD} = \\vec{0}$", correct: true },
      { text: "$\\overrightarrow{OA} + \\overrightarrow{OB} = \\overrightarrow{OC} + \\overrightarrow{OD}$", correct: false },
      { text: "$\\overrightarrow{OA} + \\overrightarrow{OC} = \\overrightarrow{OB} + \\overrightarrow{OD}$", correct: false }
    ],
    explanation: "Vì $M$ là trung điểm $AB$ nên $\\overrightarrow{OA} + \\overrightarrow{OB} = 2\\overrightarrow{OM}$. Vì $N$ là trung điểm $CD$ nên $\\overrightarrow{OC} + \\overrightarrow{OD} = 2\\overrightarrow{ON}$. Cộng lại: $\\overrightarrow{OA} + \\overrightarrow{OB} + \\overrightarrow{OC} + \\overrightarrow{OD} = 2(\\overrightarrow{OM} + \\overrightarrow{ON})$. Do $O$ là trung điểm của $MN$ nên $\\overrightarrow{OM} + \\overrightarrow{ON} = \\vec{0}$. Vậy $\\overrightarrow{OA} + \\overrightarrow{OB} + \\overrightarrow{OC} + \\overrightarrow{OD} = \\vec{0}$."
  },
  {
    id: 7,
    title: "Hệ Thức Trọng Tâm Tam Giác (SGK Trang 53)",
    pts: 20,
    question: "Cho tam giác $ABC$ có trọng tâm $G$. Với điểm $M$ tuỳ ý trong mặt phẳng, hệ thức nào sau đây luôn đúng?",
    options: [
      { text: "$\\overrightarrow{MA} + \\overrightarrow{MB} + \\overrightarrow{MC} = \\overrightarrow{MG}$", correct: false },
      { text: "$\\overrightarrow{MA} + \\overrightarrow{MB} + \\overrightarrow{MC} = 2\\overrightarrow{MG}$", correct: false },
      { text: "$\\overrightarrow{MA} + \\overrightarrow{MB} + \\overrightarrow{MC} = 3\\overrightarrow{MG}$", correct: true },
      { text: "$\\overrightarrow{MA} + \\overrightarrow{MB} + \\overrightarrow{MC} = \\vec{0}$", correct: false }
    ],
    explanation: "Ta có: $\\overrightarrow{MA} + \\overrightarrow{MB} + \\overrightarrow{MC} = (\\overrightarrow{MG} + \\overrightarrow{GA}) + (\\overrightarrow{MG} + \\overrightarrow{GB}) + (\\overrightarrow{MG} + \\overrightarrow{GC}) = 3\\overrightarrow{MG} + (\\overrightarrow{GA} + \\overrightarrow{GB} + \\overrightarrow{GC})$. Vì $G$ là trọng tâm nên $\\overrightarrow{GA} + \\overrightarrow{GB} + \\overrightarrow{GC} = \\vec{0}$. Do đó $\\overrightarrow{MA} + \\overrightarrow{MB} + \\overrightarrow{MC} = 3\\overrightarrow{MG}$."
  },
  {
    id: 8,
    title: "Bài 4.9 SGK Trang 54 - Hợp Lực Của Hai Lực Cùng Tác Dụng",
    pts: 20,
    question: "Hình 4.19 SGK biểu diễn hai lực $\\vec{F}_1, \\vec{F}_2$ cùng tác dụng lên một vật, cho $|\\vec{F}_1| = 3\\text{ N}, |\\vec{F}_2| = 2\\text{ N}$ và góc giữa hai lực bằng $120^\\circ$. Độ lớn của hợp lực $\\vec{F} = \\vec{F}_1 + \\vec{F}_2$ là:",
    options: [
      { text: "$\\sqrt{19}\\text{ N}$", correct: false },
      { text: "$5\\text{ N}$", correct: false },
      { text: "$\\sqrt{7}\\text{ N}$", correct: true },
      { text: "$1\\text{ N}$", correct: false }
    ],
    explanation: "Áp dụng công thức hợp lực: $F = \\sqrt{F_1^2 + F_2^2 + 2F_1 F_2 \\cos 120^\\circ} = \\sqrt{3^2 + 2^2 + 2 \\cdot 3 \\cdot 2 \\cdot (-0,5)} = \\sqrt{9 + 4 - 6} = \\sqrt{7}\\text{ N}$."
  },
  {
    id: 9,
    title: "Vận Dụng SGK Trang 54 - Kéo Pháo Lên Dốc Nghiêng 30°",
    pts: 20,
    question: "Để kéo khẩu pháo nặng $22\\,148\\text{ N}$ lên một con dốc nghiêng $30^\\circ$ so với phương nằm ngang, nếu lực kéo của mỗi người bằng $100\\text{ N}$ thì cần **tối thiểu bao nhiêu người**?",
    options: [
      { text: "110 người", correct: false },
      { text: "111 người", correct: true },
      { text: "112 người", correct: false },
      { text: "222 người", correct: false }
    ],
    explanation: "Lực kéo tối thiểu cần thiết để giữ pháo không trượt xuống dốc là thành phần tiếp tuyến của trọng lực: $F_{\\text{kéo}} = P \\cdot \\sin 30^\\circ = 22\\,148 \\cdot 0,5 = 11\\,074\\text{ N}$. Vì mỗi chiến sĩ kéo được $100\\text{ N}$, số người tối thiểu cần có là: $n = \\lceil 11\\,074 / 100 \\rceil = \\lceil 110,74 \\rceil = 111$ người."
  },
  {
    id: 10,
    title: "Bài 4.10 SGK Trang 54 - Hai Tàu Băng Qua Sông",
    pts: 20,
    question: "Hai con tàu xuất phát cùng lúc từ bờ bên này để sang bờ bên kia của một dòng sông với vận tốc riêng không đổi và có độ lớn bằng nhau. Hai tàu luôn giữ lái để tạo với bờ cùng một góc nhọn, nhưng một tàu hướng xuống hạ lưu, một tàu hướng lên thượng lưu. Hỏi tàu nào sang bờ bên kia **trước**?",
    options: [
      { text: "Tàu hướng xuống hạ lưu vì được dòng nước đẩy thêm tốc độ.", correct: false },
      { text: "Tàu hướng lên thượng lưu vì hạn chế bị trôi dạt.", correct: false },
      { text: "Hai tàu sang bờ bên kia cùng một lúc.", correct: true },
      { text: "Tuỳ thuộc vào bề rộng của con sông.", correct: false }
    ],
    explanation: "Vận tốc dòng nước có phương song song với hai bờ sông nên không có thành phần theo phương vuông góc với bờ. Do hai tàu có cùng độ lớn vận tốc riêng $v_r$ và cùng tạo với bờ góc nhọn $\\alpha$, thành phần vận tốc vuông góc với bờ của cả hai tàu đều là $v_\\perp = v_r \\sin\\alpha$. Bề rộng sông như nhau nên thời gian sang bờ $t = d / v_\\perp$ của cả hai tàu là bằng nhau!"
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
      unlockBadge(4, "Đại Kiện Tướng Tổng Hiệu");
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

// --- 4. LAB 1: INTERACTIVE VECTOR ADDITION & PARALLELOGRAM LAB (CANVAS 2D) ---
class VectorAdditionLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.originX = 120;
    this.originY = 260;
    this.scale = 22; // px per unit

    this.uLen = 6;
    this.vLen = 5;
    this.angleDeg = 60;
    this.mode = 'parallelogram'; // 'parallelogram' or 'triangle'

    this.initEvents();
    this.update();
  }

  initEvents() {
    const uSlider = document.getElementById('uLenSlider');
    const vSlider = document.getElementById('vLenSlider');
    const angSlider = document.getElementById('angleSlider');
    const btnPara = document.getElementById('btnModeParallelogram');
    const btnTri = document.getElementById('btnModeTriangle');

    uSlider.addEventListener('input', (e) => {
      this.uLen = parseFloat(e.target.value);
      document.getElementById('uLenVal').innerText = this.uLen;
      this.update();
    });

    vSlider.addEventListener('input', (e) => {
      this.vLen = parseFloat(e.target.value);
      document.getElementById('vLenVal').innerText = this.vLen;
      this.update();
    });

    angSlider.addEventListener('input', (e) => {
      this.angleDeg = parseFloat(e.target.value);
      document.getElementById('angleVal').innerText = `${this.angleDeg}°`;
      this.update();
    });

    btnPara.addEventListener('click', () => {
      sounds.playClick();
      this.mode = 'parallelogram';
      btnPara.classList.add('active');
      btnTri.classList.remove('active');
      this.update();
      unlockBadge(1, 'Cao Thủ Bình Hành');
    });

    btnTri.addEventListener('click', () => {
      sounds.playClick();
      this.mode = 'triangle';
      btnTri.classList.add('active');
      btnPara.classList.remove('active');
      this.update();
      unlockBadge(1, 'Cao Thủ Bình Hành');
    });
  }

  update() {
    const rad = this.angleDeg * Math.PI / 180;
    const cosVal = Math.cos(rad);
    // |u + v| = sqrt(u^2 + v^2 + 2uv cos)
    const sumMod = Math.sqrt(this.uLen * this.uLen + this.vLen * this.vLen + 2 * this.uLen * this.vLen * cosVal);
    // |u - v| = sqrt(u^2 + v^2 - 2uv cos)
    const diffMod = Math.sqrt(this.uLen * this.uLen + this.vLen * this.vLen - 2 * this.uLen * this.vLen * cosVal);

    document.getElementById('sumModulus').innerText = sumMod.toFixed(2);
    document.getElementById('diffModulus').innerText = diffMod.toFixed(2);
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Subtle grid
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

    const rad = this.angleDeg * Math.PI / 180;
    const O = { x: this.originX, y: this.originY };
    // u along horizontal X axis
    const A = { x: O.x + this.uLen * this.scale, y: O.y };
    // v at angle alpha
    const B = { x: O.x + this.vLen * this.scale * Math.cos(rad), y: O.y - this.vLen * this.scale * Math.sin(rad) };
    // C is diagonal sum
    const C = { x: A.x + (B.x - O.x), y: A.y + (B.y - O.y) };

    if (this.mode === 'parallelogram') {
      // Dashed parallelogram lines
      ctx.save();
      ctx.setLineDash([5, 5]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y); ctx.lineTo(C.x, C.y);
      ctx.moveTo(B.x, B.y); ctx.lineTo(C.x, C.y);
      ctx.stroke();

      // Difference vector B -> A: u - v
      this.drawArrow(B, A, '#f43f5e', 2.5, 'u - v');
      ctx.restore();

      // Draw u and v
      this.drawArrow(O, A, '#38bdf8', 3.5, `u (len: ${this.uLen})`);
      this.drawArrow(O, B, '#10b981', 3.5, `v (len: ${this.vLen})`);

      // Sum diagonal u + v
      this.drawArrow(O, C, '#f59e0b', 4, `u + v`);

      // Arc for angle
      ctx.save();
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(O.x, O.y, 35, 0, -rad, true);
      ctx.stroke();
      ctx.font = '12px Segoe UI';
      ctx.fillStyle = '#e2e8f0';
      ctx.fillText(`${this.angleDeg}°`, O.x + 42, O.y - 12);
      ctx.restore();

      // Point labels
      this.drawCircle(O, 'O', '#6366f1');
      this.drawCircle(A, 'A', '#38bdf8');
      this.drawCircle(B, 'B', '#10b981');
      this.drawCircle(C, 'C', '#f59e0b');
    } else {
      // Triangle (Head-to-tail): O -> A (u), A -> C (v placed at tip of u)
      this.drawArrow(O, A, '#38bdf8', 3.5, `u = OA`);
      this.drawArrow(A, C, '#10b981', 3.5, `v = AC`);
      this.drawArrow(O, C, '#f59e0b', 4, `u + v = OC (Quy tắc 3 điểm)`);

      this.drawCircle(O, 'A', '#6366f1');
      this.drawCircle(A, 'B', '#38bdf8');
      this.drawCircle(C, 'C', '#f59e0b');
    }
  }

  drawArrow(from, to, color, width = 3, label = '') {
    const ctx = this.ctx;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    const headLen = 12;

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
      ctx.font = 'bold 13px Segoe UI, sans-serif';
      ctx.fillText(label, (from.x + to.x) / 2 + 8, (from.y + to.y) / 2 - 8);
    }
    ctx.restore();
  }

  drawCircle(pt, label, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 12px Segoe UI';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, pt.x - 5, pt.y - 10);
    ctx.restore();
  }
}

// --- 5. LAB 2: ARTILLERY SLOPE & THREE FORCES BALANCE LAB (CANVAS 2D) ---
class SlopeSimulationLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.P = 22148; // Newton
    this.slopeDeg = 30;

    this.initEvents();
    this.update();
  }

  initEvents() {
    const slider = document.getElementById('slopeAngleSlider');
    slider.addEventListener('input', (e) => {
      this.slopeDeg = parseFloat(e.target.value);
      document.getElementById('slopeAngleVal').innerText = `${this.slopeDeg}°`;
      this.update();
      unlockBadge(2, 'Kỹ Sư Cân Bằng Lực');
    });
  }

  update() {
    const rad = this.slopeDeg * Math.PI / 180;
    const fPull = this.P * Math.sin(rad);
    const fNormal = this.P * Math.cos(rad);
    const people = Math.ceil(fPull / 100);

    document.getElementById('fPullVal').innerText = `${Math.round(fPull).toLocaleString('vi-VN')} N`;
    document.getElementById('fNormalVal').innerText = `${Math.round(fNormal).toLocaleString('vi-VN')} N`;
    document.getElementById('peopleCountVal').innerText = `${people} người (tối thiểu)`;

    this.draw(rad, fPull, fNormal);
  }

  draw(rad, fPull, fNormal) {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Ground and slope
    const groundY = 280;
    const startX = 60;
    const slopeLen = 420;
    const endX = startX + slopeLen * Math.cos(rad);
    const endY = groundY - slopeLen * Math.sin(rad);

    ctx.save();
    // Fill mountain slope
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(startX, groundY);
    ctx.lineTo(endX, endY);
    ctx.lineTo(endX, groundY);
    ctx.closePath();
    ctx.fill();

    // Slope surface line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(startX, groundY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Ground line
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(30, groundY);
    ctx.lineTo(this.width - 30, groundY);
    ctx.stroke();

    // Slope angle arc
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(startX, groundY, 45, 0, -rad, true);
    ctx.stroke();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px Segoe UI';
    ctx.fillText(`${this.slopeDeg}°`, startX + 50, groundY - 10);

    // Cannon (Khẩu pháo) positioned halfway up slope
    const cannonT = 0.45;
    const cx = startX + slopeLen * cannonT * Math.cos(rad);
    const cy = groundY - slopeLen * cannonT * Math.sin(rad);

    // Draw cannon body rotated to slope
    ctx.translate(cx, cy);
    ctx.rotate(-rad);

    // Cannon wheels & barrel
    ctx.fillStyle = '#334155';
    ctx.fillRect(-20, -32, 40, 24);
    // Wheels
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(-10, -8, 12, 0, Math.PI * 2);
    ctx.arc(10, -8, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f8fafc';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Pull force vector F_kéo (along slope, pointing up-slope)
    const fScale = 0.007;
    this.drawVec(0, -18, fPull * fScale, -18, '#10b981', `F_kéo = ${Math.round(fPull)} N`);

    // Normal force vector N (perpendicular to slope, pointing upward)
    this.drawVec(0, -18, 0, -18 - fNormal * fScale, '#38bdf8', `N = ${Math.round(fNormal)} N`);

    ctx.rotate(rad); // unrotate to draw vertical Gravity P

    // Gravity vector P (straight downward)
    this.drawVec(0, -18, 0, -18 + this.P * fScale, '#f43f5e', `P = 22 148 N`);

    ctx.restore();

    // Formula summary card on canvas
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.fillRect(20, 20, 280, 85);
    ctx.strokeRect(20, 20, 280, 85);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 13px Segoe UI';
    ctx.fillText('ĐIỀU KIỆN CÂN BẰNG BA LỰC:', 30, 42);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '12px Segoe UI';
    ctx.fillText('P + N + F_kéo = 0', 30, 62);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`F_kéo = P * sin(${this.slopeDeg}°) = ${Math.round(fPull)} N`, 30, 84);
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
    ctx.lineWidth = 3;

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
        unlockBadge(0, 'Khởi Động Ba Điểm');
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
  window.lab1 = new VectorAdditionLab('addCanvas');
  window.lab2 = new SlopeSimulationLab('slopeCanvas');

  // Init Quiz
  renderQuiz();

  // Print Certificate
  document.getElementById('btnPrintCert').addEventListener('click', () => {
    sounds.playFanfare();
    window.print();
  });

  // Initial HUD
  updateHUD();
  unlockBadge(0, 'Khởi Động Ba Điểm');
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
