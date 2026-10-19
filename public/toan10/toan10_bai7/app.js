/* ================================================================
   BÀI 7: CÁC KHÁI NIỆM MỞ ĐẦU VỀ VECTƠ - TOÁN 10
   Bộ sách: Kết Nối Tri Thức Với Cuộc Sống (Trang 46 - 50)
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
  userTitle: 'Đại Kiện Tướng Vectơ Khởi Nguyên',
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

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG SGK (10 CÂU BÀI 4.1 - 4.5 TRANG 46 - 50) ---
const quizData = [
  {
    id: 1,
    title: "Định Nghĩa Vectơ & Độ Dài (SGK Trang 47)",
    pts: 20,
    question: "Khái niệm nào sau đây về vectơ là **đúng nhất** theo chuẩn SGK Toán 10?",
    options: [
      { text: "Vectơ là một đường thẳng có hướng xác định độ dốc trong không gian.", correct: false },
      { text: "Vectơ là một đoạn thẳng có hướng, tức là đã chỉ rõ điểm đầu và điểm cuối.", correct: true },
      { text: "Vectơ là một đoạn thẳng có độ dài lớn hơn 0 và song song với trục tung.", correct: false },
      { text: "Vectơ là tập hợp các điểm thẳng hàng cách đều gốc toạ độ.", correct: false }
    ],
    explanation: "Định nghĩa SGK: Đoạn thẳng nối hai điểm mà ta chỉ rõ điểm đầu (gốc) và điểm cuối (ngọn) được gọi là vectơ. Độ dài vectơ là khoảng cách giữa hai đầu mút."
  },
  {
    id: 2,
    title: "Giá Của Vectơ (SGK Trang 48)",
    pts: 20,
    question: "Giá của vectơ $\\overrightarrow{AB}$ (với $A \\neq B$) là gì?",
    options: [
      { text: "Đoạn thẳng nối từ điểm đầu $A$ tới điểm cuối $B$.", correct: false },
      { text: "Độ dài $|\\overrightarrow{AB}|$ tính theo đơn vị đo kilômét hoặc mét.", correct: false },
      { text: "Đường thẳng đi qua điểm đầu $A$ và điểm cuối $B$.", correct: true },
      { text: "Đường thẳng vuông góc với đoạn thẳng $AB$ tại trung điểm.", correct: false }
    ],
    explanation: "Giá của vectơ là đường thẳng đi qua điểm đầu và điểm cuối của vectơ đó. Hai vectơ cùng phương khi và chỉ khi giá của chúng song song hoặc trùng nhau."
  },
  {
    id: 3,
    title: "Vectơ-không và Quy Ước Hướng (SGK Trang 48)",
    pts: 20,
    question: "Quy ước đặc biệt nào sau đây về **vectơ-không** ($\\vec{0}$) là đúng?",
    options: [
      { text: "Vectơ-không có độ dài bằng $1$ và vuông góc với mọi vectơ.", correct: false },
      { text: "Vectơ-không không có giá và không cùng phương với bất kì vectơ nào.", correct: false },
      { text: "Vectơ-không có độ dài bằng $0$, cùng phương và cùng hướng với mọi vectơ.", correct: true },
      { text: "Điểm đầu và điểm cuối của vectơ-không luôn phải cách nhau một khoảng $\\epsilon > 0$.", correct: false }
    ],
    explanation: "Vectơ có điểm đầu và điểm cuối trùng nhau ($\\overrightarrow{AA}, \\overrightarrow{BB}$) gọi là vectơ-không, kí hiệu là $\\vec{0}$. Quy ước: $\\vec{0}$ có độ dài bằng 0, cùng phương và cùng hướng với mọi vectơ."
  },
  {
    id: 4,
    title: "Bài 4.1 SGK Trang 50 - Quan Hệ Cùng Phương",
    pts: 20,
    question: "Cho ba vectơ $\\vec{a}, \\vec{b}, \\vec{c}$ đều khác $\\vec{0}$. Khẳng định nào sau đây là **đúng**?",
    options: [
      { text: "Nếu $\\vec{b}$ không cùng hướng với $\\vec{a}$ thì $\\vec{b}$ ngược hướng với $\\vec{a}$.", correct: false },
      { text: "Nếu $\\vec{a}$ và $\\vec{b}$ đều cùng phương với $\\vec{c}$ thì $\\vec{a}$ và $\\vec{b}$ cùng phương.", correct: true },
      { text: "$\\vec{a}, \\vec{b}, \\vec{c}$ đều cùng hướng với vectơ $\\vec{0}$.", correct: false },
      { text: "Nếu $\\vec{a}$ và $\\vec{b}$ đều cùng hướng với $\\vec{c}$ thì $\\vec{a}$ và $\\vec{b}$ ngược hướng.", correct: false }
    ],
    explanation: "Vì $\\vec{a}$ và $\\vec{b}$ đều cùng phương với $\\vec{c} \\neq \\vec{0}$, nên giá của $\\vec{a}$ và $\\vec{b}$ đều song song hoặc trùng với giá của $\\vec{c}$. Do đó giá của $\\vec{a}$ và $\\vec{b}$ song song hoặc trùng nhau, suy ra $\\vec{a}$ và $\\vec{b}$ cùng phương."
  },
  {
    id: 5,
    title: "Bài 4.2 SGK Trang 50 - Hai Vectơ Bằng Nhau",
    pts: 20,
    question: "Hai vectơ $\\vec{a}$ và $\\vec{b}$ được gọi là **bằng nhau** (kí hiệu $\\vec{a} = \\vec{b}$) khi và chỉ khi:",
    options: [
      { text: "Chúng có cùng độ dài và giá song song với nhau.", correct: false },
      { text: "Chúng có cùng độ dài và ngược hướng với nhau.", correct: false },
      { text: "Chúng có cùng độ dài và cùng hướng.", correct: true },
      { text: "Chúng có cùng điểm gốc xuất phát từ một vị trí ban đầu.", correct: false }
    ],
    explanation: "SGK định nghĩa: Hai vectơ $\\vec{a}, \\vec{b}$ được gọi là bằng nhau nếu chúng có cùng độ dài ($|\\vec{a}| = |\\vec{b}|$) và cùng hướng."
  },
  {
    id: 6,
    title: "Bài 4.3 SGK Trang 50 - Điều Kiện Hình Bình Hành",
    pts: 20,
    question: "Cho tứ giác $ABCD$. Khẳng định nào sau đây là điều kiện cần và đủ để tứ giác $ABCD$ là một hình bình hành?",
    options: [
      { text: "$\\overrightarrow{AB} = \\overrightarrow{CD}$", correct: false },
      { text: "$\\overrightarrow{BC} = \\overrightarrow{AD}$", correct: true },
      { text: "$\\overrightarrow{AC} = \\overrightarrow{BD}$", correct: false },
      { text: "$|\\overrightarrow{AB}| = |\\overrightarrow{CD}|$ và $|\\overrightarrow{BC}| = |\\overrightarrow{AD}|$", correct: false }
    ],
    explanation: "Tứ giác $ABCD$ là hình bình hành $\\iff \\overrightarrow{BC} = \\overrightarrow{AD}$ (hoặc $\\overrightarrow{AB} = \\overrightarrow{DC}$). Chú ý $\\overrightarrow{AB} = \\overrightarrow{CD}$ là sai vì hai vectơ này ngược hướng nhau."
  },
  {
    id: 7,
    title: "Bài 4.4 SGK Trang 50 - Vectơ Bằng Nhau Trong Hình Vuông",
    pts: 20,
    question: "Cho hình vuông $ABCD$ tâm $O$. Số lượng các vectơ khác $\\vec{0}$ có điểm đầu và điểm cuối thuộc $\\{A, B, C, D, O\\}$ và bằng với vectơ $\\overrightarrow{AB}$ là:",
    options: [
      { text: "1 vectơ (chính là $\\overrightarrow{DC}$)", correct: true },
      { text: "2 vectơ", correct: false },
      { text: "3 vectơ", correct: false },
      { text: "0 vectơ", correct: false }
    ],
    explanation: "Trong hình vuông $ABCD$, chỉ có cạnh $DC$ song song, bằng độ dài và cùng hướng với $\\overrightarrow{AB}$. Do đó vectơ duy nhất bằng $\\overrightarrow{AB}$ trong tập hợp các đỉnh đã cho là $\\overrightarrow{DC}$."
  },
  {
    id: 8,
    title: "Bài 4.5 SGK Trang 50 - Chuyển Động Vectơ Toạ Độ",
    pts: 20,
    question: "Trên mặt phẳng toạ độ $Oxy$, cho $A(1; 2), M(-3; 5), N(1; 13)$. Một vật khởi hành từ $M$ chuyển động thẳng đều với vận tốc $\\vec{v} = \\overrightarrow{OA} = (1; 2)$. Hỏi sau bao lâu vật tới điểm $N$?",
    options: [
      { text: "2 giờ", correct: false },
      { text: "3 giờ", correct: false },
      { text: "4 giờ", correct: true },
      { text: "5 giờ", correct: false }
    ],
    explanation: "Ta có $\\overrightarrow{MN} = (1 - (-3); 13 - 5) = (4; 8) = 4(1; 2) = 4\\vec{v}$. Vì vận tốc theo giờ là $\\vec{v}$ nên thời gian để vật đi từ $M$ tới $N$ là $t = 4$ giờ."
  },
  {
    id: 9,
    title: "Ba Điểm Thẳng Hàng (SGK Ví dụ 3 Trang 49)",
    pts: 20,
    question: "Cho ba điểm phân biệt $A, B, C$. Mệnh đề nào sau đây biểu diễn chính xác điều kiện để $A, B, C$ thẳng hàng?",
    options: [
      { text: "Hai vectơ $\\overrightarrow{AB}$ và $\\overrightarrow{AC}$ cùng phương.", correct: true },
      { text: "$|\\overrightarrow{AB}| + |\\overrightarrow{BC}| = |\\overrightarrow{AC}|$.", correct: false },
      { text: "$\\overrightarrow{AB} = \\overrightarrow{AC}$.", correct: false },
      { text: "Hai vectơ $\\overrightarrow{AB}$ và $\\overrightarrow{AC}$ ngược hướng.", correct: false }
    ],
    explanation: "Giá của $\\overrightarrow{AB}$ là đường thẳng $AB$, giá của $\\overrightarrow{AC}$ là đường thẳng $AC$. Hai vectơ cùng phương thì hai giá song song hoặc trùng nhau. Do cùng qua $A$ nên hai giá trùng nhau, nghĩa là $A, B, C$ cùng thuộc một đường thẳng."
  },
  {
    id: 10,
    title: "Vận Dụng SGK Trang 51 - Vận Tốc Ca Nô Xuôi & Ngược Dòng",
    pts: 20,
    question: "Ca nô $A$ chạy xuôi dòng với vận tốc riêng $15\\text{ km/h}$, ca nô $B$ chạy ngược dòng với vận tốc riêng $15\\text{ km/h}$. Vận tốc dòng nước là $3\\text{ km/h}$. Tỉ số giữa vận tốc thực tế của ca nô $A$ và ca nô $B$ là:",
    options: [
      { text: "$1,25$", correct: false },
      { text: "$1,50$", correct: true },
      { text: "$1,75$", correct: false },
      { text: "$2,00$", correct: false }
    ],
    explanation: "Vận tốc thực tế của ca nô A (xuôi dòng) là $v_A = 15 + 3 = 18\\text{ km/h}$. Vận tốc thực tế của ca nô B (ngược dòng) là $v_B = 15 - 3 = 12\\text{ km/h}$. Tỉ số $v_A / v_B = 18 / 12 = 1,50$."
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
      unlockBadge(4, "Đại Kiện Tướng Khởi Nguyên");
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

// --- 4. LAB 1: VECTOR COMPASS & COORDINATE EXPLORER (CANVAS 2D) ---
class VectorCanvasLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;
    this.originX = this.width / 2;
    this.originY = this.height / 2;
    this.scale = 26; // pixels per unit

    // Vector AB points (in math coordinates)
    this.ptA = { x: -4, y: -2 };
    this.ptB = { x: 3, y: 3 };

    // Reference vector CD (for relation check)
    this.ptC = { x: -5, y: -4 };
    this.ptD = { x: 2, y: 1 };
    this.showRef = false;
    this.refLabel = '';

    this.draggingPoint = null;
    this.initEvents();
    this.draw();
  }

  toScreen(pt) {
    return {
      x: this.originX + pt.x * this.scale,
      y: this.originY - pt.y * this.scale
    };
  }

  toMath(screenX, screenY) {
    return {
      x: Math.round((screenX - this.originX) / this.scale),
      y: Math.round((this.originY - screenY) / this.scale)
    };
  }

  initEvents() {
    const getPos = (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
      };
    };

    this.canvas.addEventListener('mousedown', (e) => {
      const pos = getPos(e);
      const scrA = this.toScreen(this.ptA);
      const scrB = this.toScreen(this.ptB);
      if (Math.hypot(pos.x - scrA.x, pos.y - scrA.y) < 18) {
        this.draggingPoint = 'A';
        sounds.playClick();
      } else if (Math.hypot(pos.x - scrB.x, pos.y - scrB.y) < 18) {
        this.draggingPoint = 'B';
        sounds.playClick();
      }
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.draggingPoint) return;
      const pos = getPos(e);
      const m = this.toMath(pos.x, pos.y);
      m.x = Math.max(-10, Math.min(10, m.x));
      m.y = Math.max(-6, Math.min(6, m.y));

      if (this.draggingPoint === 'A') {
        this.ptA = m;
      } else if (this.draggingPoint === 'B') {
        this.ptB = m;
      }
      this.draw();
      this.updateStats();
    });

    window.addEventListener('mouseup', () => {
      if (this.draggingPoint) {
        this.draggingPoint = null;
        unlockBadge(1, 'La Bàn Tinh Tường');
      }
    });
  }

  drawArrow(from, to, color, width = 3, label = '') {
    const ctx = this.ctx;
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const angle = Math.atan2(dy, dx);
    const headLen = 14;

    ctx.save();
    ctx.strokeStyle = color;
    ctx.fillStyle = color;
    ctx.lineWidth = width;

    // Line
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();

    // Arrow Head
    ctx.beginPath();
    ctx.moveTo(to.x, to.y);
    ctx.lineTo(to.x - headLen * Math.cos(angle - Math.PI / 6), to.y - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(to.x - headLen * Math.cos(angle + Math.PI / 6), to.y - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    // Label
    if (label) {
      ctx.font = 'bold 14px Segoe UI, sans-serif';
      ctx.fillText(label, (from.x + to.x) / 2 + 8, (from.y + to.y) / 2 - 8);
    }
    ctx.restore();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    // Grid
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = this.originX % this.scale; x < this.width; x += this.scale) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, this.height); ctx.stroke();
    }
    for (let y = this.originY % this.scale; y < this.height; y += this.scale) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(this.width, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, this.originY); ctx.lineTo(this.width, this.originY);
    ctx.moveTo(this.originX, 0); ctx.lineTo(this.originX, this.height);
    ctx.stroke();
    ctx.restore();

    // Reference vector CD if enabled
    if (this.showRef) {
      const scrC = this.toScreen(this.ptC);
      const scrD = this.toScreen(this.ptD);
      this.drawArrow(scrC, scrD, '#f59e0b', 3, 'v');
      // Point C and D
      this.drawPoint(scrC, 'C', '#f59e0b');
      this.drawPoint(scrD, 'D', '#f59e0b');
    }

    // Main Vector AB
    const scrA = this.toScreen(this.ptA);
    const scrB = this.toScreen(this.ptB);
    this.drawArrow(scrA, scrB, '#38bdf8', 4, 'u = AB');

    // Draw handles A and B
    this.drawPoint(scrA, `A(${this.ptA.x}, ${this.ptA.y})`, '#6366f1');
    this.drawPoint(scrB, `B(${this.ptB.x}, ${this.ptB.y})`, '#10b981');
  }

  drawPoint(scr, label, color) {
    const ctx = this.ctx;
    ctx.save();
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(scr.x, scr.y, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(label, scr.x + 9, scr.y - 7);
    ctx.restore();
  }

  updateStats() {
    const dx = this.ptB.x - this.ptA.x;
    const dy = this.ptB.y - this.ptA.y;
    const len = Math.hypot(dx, dy);
    let deg = (Math.atan2(dy, dx) * 180 / Math.PI);
    if (deg < 0) deg += 360;

    document.getElementById('ptALabel').innerText = `(${this.ptA.x}, ${this.ptA.y})`;
    document.getElementById('ptBLabel').innerText = `(${this.ptB.x}, ${this.ptB.y})`;
    document.getElementById('vecCoord').innerText = `(${dx}, ${dy})`;
    document.getElementById('vecModulus').innerText = len.toFixed(2);
    document.getElementById('vecAngle').innerText = `${deg.toFixed(1)}°`;
  }

  setRefRelation(type) {
    this.showRef = true;
    const dx = this.ptB.x - this.ptA.x;
    const dy = this.ptB.y - this.ptA.y;

    if (type === 'parallel') {
      // k = 1.5 same direction or 2
      this.ptC = { x: -6, y: -4 };
      this.ptD = { x: this.ptC.x + dx, y: this.ptC.y + dy };
      document.getElementById('vecRelation').innerText = 'Hai vectơ CÙNG PHƯƠNG (giá song song)';
    } else if (type === 'opposite') {
      // opposite
      this.ptC = { x: 4, y: -2 };
      this.ptD = { x: this.ptC.x - dx, y: this.ptC.y - dy };
      document.getElementById('vecRelation').innerText = 'Hai vectơ NGƯỢC HƯỚNG (cùng phương, ngược chiều)';
    } else if (type === 'equal') {
      // equal
      this.ptC = { x: -5, y: -3 };
      this.ptD = { x: this.ptC.x + dx, y: this.ptC.y + dy };
      document.getElementById('vecRelation').innerText = 'Hai vectơ BẰNG NHAU (cùng hướng & cùng độ dài)';
    }
    this.draw();
    sounds.playCorrect();
    unlockBadge(1, 'La Bàn Tinh Tường');
  }

  reset() {
    this.ptA = { x: -4, y: -2 };
    this.ptB = { x: 3, y: 3 };
    this.showRef = false;
    document.getElementById('vecRelation').innerText = 'Đang khảo sát vectơ tự do';
    this.draw();
    this.updateStats();
  }
}

// --- 5. LAB 2: RIVER CROSSING BOAT & ARCHIMEDES FLOTATION (CANVAS 2D) ---
class BoatCanvasLab {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.width = this.canvas.width;
    this.height = this.canvas.height;

    this.vBoat = 15;
    this.vRiver = 3;
    this.mode = 'downstream'; // 'downstream', 'upstream', 'archimedes'

    this.boatX = 60;
    this.animId = null;
    this.initEvents();
    this.updateSimulation();
  }

  initEvents() {
    const vBoatSlider = document.getElementById('vBoatSlider');
    const vRiverSlider = document.getElementById('vRiverSlider');
    const btnDown = document.getElementById('btnDownstream');
    const btnUp = document.getElementById('btnUpstream');
    const btnArch = document.getElementById('btnArchimedes');

    vBoatSlider.addEventListener('input', (e) => {
      this.vBoat = parseFloat(e.target.value);
      document.getElementById('vBoatVal').innerText = this.vBoat;
      this.updateSimulation();
    });

    vRiverSlider.addEventListener('input', (e) => {
      this.vRiver = parseFloat(e.target.value);
      document.getElementById('vRiverVal').innerText = this.vRiver;
      this.updateSimulation();
    });

    btnDown.addEventListener('click', () => {
      sounds.playClick();
      this.mode = 'downstream';
      [btnDown, btnUp, btnArch].forEach(b => b.classList.remove('active'));
      btnDown.classList.add('active');
      this.updateSimulation();
      unlockBadge(2, 'Thuyền Trưởng Sông Nước');
    });

    btnUp.addEventListener('click', () => {
      sounds.playClick();
      this.mode = 'upstream';
      [btnDown, btnUp, btnArch].forEach(b => b.classList.remove('active'));
      btnUp.classList.add('active');
      this.updateSimulation();
      unlockBadge(2, 'Thuyền Trưởng Sông Nước');
    });

    btnArch.addEventListener('click', () => {
      sounds.playClick();
      this.mode = 'archimedes';
      [btnDown, btnUp, btnArch].forEach(b => b.classList.remove('active'));
      btnArch.classList.add('active');
      this.updateSimulation();
      unlockBadge(2, 'Thuyền Trưởng Sông Nước');
    });
  }

  updateSimulation() {
    if (this.mode === 'downstream') {
      const vTotal = this.vBoat + this.vRiver;
      document.getElementById('vResult').innerText = `${vTotal} km/h`;
      document.getElementById('vecBoatRelation').innerHTML = formatMathText('$\\vec{v} = \\vec{v}_{\\text{riêng}} + \\vec{v}_{\\text{nước}}$ (Cùng hướng)');
      document.getElementById('boatEvaluation').innerText = 'Hai vectơ vận tốc cùng phương, cùng hướng làm ca nô A tăng tốc!';
    } else if (this.mode === 'upstream') {
      const vTotal = Math.max(0, this.vBoat - this.vRiver);
      document.getElementById('vResult').innerText = `${vTotal} km/h`;
      document.getElementById('vecBoatRelation').innerHTML = formatMathText('$\\vec{v} = \\vec{v}_{\\text{riêng}} - \\vec{v}_{\\text{nước}}$ (Ngược hướng)');
      document.getElementById('boatEvaluation').innerText = 'Hai vectơ vận tốc cùng phương, ngược hướng làm ca nô B bị cản trở!';
    } else if (this.mode === 'archimedes') {
      document.getElementById('vResult').innerText = 'Cân bằng đáy: |P| = 3|FA|';
      document.getElementById('vecBoatRelation').innerHTML = formatMathText('$\\vec{P} \\rightleftarrows \\vec{F}_A$ (Trọng lực và Lực đẩy)');
      document.getElementById('boatEvaluation').innerText = 'SGK H.4.11: Khối chìm sâu dưới đáy nghĩa là Trọng lượng riêng của vật gấp 3 lần chất lỏng!';
    }
    this.draw();
  }

  draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    if (this.mode === 'archimedes') {
      this.drawArchimedesScene();
      return;
    }

    // River background
    ctx.fillStyle = '#0369a1';
    ctx.fillRect(0, 40, this.width, this.height - 80);

    // River banks
    ctx.fillStyle = '#15803d';
    ctx.fillRect(0, 0, this.width, 40);
    ctx.fillRect(0, this.height - 40, this.width, 40);

    // Water flow lines
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 2;
    for (let y = 65; y < this.height - 40; y += 45) {
      ctx.beginPath();
      ctx.moveTo(30, y); ctx.lineTo(this.width - 30, y);
      ctx.stroke();
      // Arrow
      ctx.beginPath();
      ctx.moveTo(this.width - 35, y - 5);
      ctx.lineTo(this.width - 20, y);
      ctx.lineTo(this.width - 35, y + 5);
      ctx.stroke();
    }
    ctx.restore();

    // River flow vector indicator
    ctx.fillStyle = '#bae6fd';
    ctx.font = '13px Segoe UI, sans-serif';
    ctx.fillText(`Dòng nước chảy sang phải: v_nước = ${this.vRiver} km/h`, 40, 60);

    // Draw boat
    const boatY = this.height / 2;
    const isDown = this.mode === 'downstream';
    const bColor = isDown ? '#f59e0b' : '#ec4899';
    const boatLen = 70;
    const boatHeight = 28;

    ctx.save();
    ctx.fillStyle = bColor;
    ctx.beginPath();
    if (isDown) {
      ctx.moveTo(250, boatY - boatHeight / 2);
      ctx.lineTo(250 + boatLen, boatY - boatHeight / 2);
      ctx.lineTo(250 + boatLen + 18, boatY);
      ctx.lineTo(250 + boatLen, boatY + boatHeight / 2);
      ctx.lineTo(250, boatY + boatHeight / 2);
    } else {
      ctx.moveTo(350, boatY - boatHeight / 2);
      ctx.lineTo(350 - boatLen, boatY - boatHeight / 2);
      ctx.lineTo(350 - boatLen - 18, boatY);
      ctx.lineTo(350 - boatLen, boatY + boatHeight / 2);
      ctx.lineTo(350, boatY + boatHeight / 2);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Boat label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Segoe UI';
    ctx.fillText(isDown ? 'Ca nô A (Xuôi)' : 'Ca nô B (Ngược)', isDown ? 260 : 275, boatY + 5);

    // Vectors representation
    const vScale = 6;
    if (isDown) {
      // vBoat right
      this.drawVectorArrow(250 + boatLen / 2, boatY - 25, (250 + boatLen / 2) + this.vBoat * vScale, boatY - 25, '#38bdf8', `v_riêng = ${this.vBoat}`);
      // vRiver right
      this.drawVectorArrow(250 + boatLen / 2, boatY - 45, (250 + boatLen / 2) + this.vRiver * vScale, boatY - 45, '#10b981', `v_nước = ${this.vRiver}`);
      // vTotal
      this.drawVectorArrow(250 + boatLen / 2, boatY + 35, (250 + boatLen / 2) + (this.vBoat + this.vRiver) * vScale, boatY + 35, '#f59e0b', `v_thực = ${this.vBoat + this.vRiver}`);
    } else {
      // vBoat left
      this.drawVectorArrow(310, boatY - 25, 310 - this.vBoat * vScale, boatY - 25, '#38bdf8', `v_riêng = ${this.vBoat}`);
      // vRiver right
      this.drawVectorArrow(310, boatY - 45, 310 + this.vRiver * vScale, boatY - 45, '#10b981', `v_nước = ${this.vRiver}`);
      // vTotal left
      const vTot = Math.max(0, this.vBoat - this.vRiver);
      this.drawVectorArrow(310, boatY + 35, 310 - vTot * vScale, boatY + 35, '#ec4899', `v_thực = ${vTot}`);
    }
    ctx.restore();
  }

  drawArchimedesScene() {
    const ctx = this.ctx;
    // Beaker (Cốc thuỷ tinh)
    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.fillRect(0, 0, this.width, this.height);

    const bx = 220, by = 40, bw = 160, bh = 220;
    // Liquid
    ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
    ctx.fillRect(bx, by + 40, bw, bh - 40);

    // Beaker outline
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 4;
    ctx.strokeRect(bx, by, bw, bh);

    // Submerged Object A at the bottom
    const objW = 60, objH = 40;
    const ox = bx + (bw - objW) / 2;
    const oy = by + bh - objH - 5;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(ox, oy, objW, objH);
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy, objW, objH);

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px Segoe UI';
    ctx.fillText('Vật A', ox + 14, oy + 25);

    // Vectors P and FA
    const cx = ox + objW / 2;
    const cy = oy + objH / 2;

    // Gravity vector P (downwards length 90px)
    this.drawVectorArrow(cx, cy, cx, cy + 90, '#f43f5e', 'Trọng lực P (Độ lớn 3 đơn vị)');

    // Archimedes buoyant vector FA (upwards length 30px)
    this.drawVectorArrow(cx, cy, cx, cy - 40, '#10b981', 'Lực đẩy FA (1 đơn vị)');

    // Text description
    ctx.fillStyle = '#f8fafc';
    ctx.font = '14px Segoe UI';
    ctx.fillText('Mô hình Archimedes SGK Trang 49 (H.4.11b):', 30, 70);
    ctx.fillStyle = '#94a3b8';
    ctx.fillText('• Hai vectơ P và FA cùng phương, ngược hướng', 30, 100);
    ctx.fillText('• Do vật chìm xuống đáy cốc, nên |P| > |FA|', 30, 130);
    ctx.fillText('• Tỉ lệ: |P| = 3|FA| suy ra d_vật = 3 d_lỏng', 30, 160);
    ctx.restore();
  }

  drawVectorArrow(x1, y1, x2, y2, color, label) {
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
    ctx.fillText(label, (x1 + x2) / 2 - 15, Math.min(y1, y2) - 8);
    ctx.restore();
  }
}

// --- 6. INITIALIZATION & DOM EVENTS ---
document.addEventListener('DOMContentLoaded', () => {
  // Render MathML in static HTML
  renderMathInTree(document.getElementById('tab-theory'));

  // Tab switching
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
      state.currentTab = tabTarget;

      if (tabTarget === 'theory') {
        unlockBadge(0, 'Tập Sự Vectơ');
      } else if (tabTarget === 'labs') {
        if (window.lab1) window.lab1.draw();
        if (window.lab2) window.lab2.draw();
      }
    });
  });

  // Sound Toggle
  const soundBtn = document.getElementById('soundToggle');
  soundBtn.addEventListener('click', () => {
    sounds.enabled = !sounds.enabled;
    soundBtn.innerText = sounds.enabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
    sounds.playClick();
  });

  // Reset progress
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

  // Avatar Modal
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
  window.lab1 = new VectorCanvasLab('vectorCanvas');
  window.lab2 = new BoatCanvasLab('boatCanvas');

  // Lab 1 button controls
  document.getElementById('btnGenParallel').addEventListener('click', () => window.lab1.setRefRelation('parallel'));
  document.getElementById('btnGenOpposite').addEventListener('click', () => window.lab1.setRefRelation('opposite'));
  document.getElementById('btnGenEqual').addEventListener('click', () => window.lab1.setRefRelation('equal'));
  document.getElementById('btnResetVec').addEventListener('click', () => window.lab1.reset());

  // Init Quiz
  renderQuiz();

  // Print Certificate
  document.getElementById('btnPrintCert').addEventListener('click', () => {
    sounds.playFanfare();
    window.print();
  });

  // Initial HUD and Theory Badge
  updateHUD();
  unlockBadge(0, 'Tập Sự Vectơ');
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
