/**
 * DIGITAL TEXTBOOK INTERACTIVE APPLICATION
 * BÀI TẬP CUỐI CHƯƠNG IV: TỔNG HỢP TOÀN DIỆN VECTƠ - TOÁN 10 KẾT NỐI TRI THỨC
 * Standard Pure Vanilla Architecture, MathML Offline Parser, Web Audio API, Canvas 2D
 */

// ==========================================
// 1. MATHML OFFLINE PARSER & TOKENIZER
// ==========================================

function tokenizeLatex(latex) {
  let s = latex.trim();
  s = s.replace(/\\cdot/g, '·')
       .replace(/\\times/g, '×')
       .replace(/\\pm/g, '±')
       .replace(/\\leq/g, '≤')
       .replace(/\\geq/g, '≥')
       .replace(/\\neq/g, '≠')
       .replace(/\\approx/g, '≈')
       .replace(/\\perp/g, '⊥')
       .replace(/\\in/g, '∈')
       .replace(/\\mathbb\{R\}/g, 'ℝ')
       .replace(/\\iff/g, '⟺')
       .replace(/\\implies/g, '⟹')
       .replace(/\\rightarrow/g, '→')
       .replace(/\\deg/g, '°')
       .replace(/\\alpha/g, 'α')
       .replace(/\\beta/g, 'β')
       .replace(/\\gamma/g, 'γ')
       .replace(/\\theta/g, 'θ')
       .replace(/\\Delta/g, 'Δ');

  s = s.replace(/\\vec\{([A-Za-z0-9]+)\}/g, '$1\u20D7')
       .replace(/\\vec\s+([A-Za-z0-9])/g, '$1\u20D7');

  const tokens = [];
  let i = 0;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '\\') {
      const match = s.slice(i).match(/^\\[a-zA-Z]+/);
      if (match) {
        tokens.push({ type: 'macro', val: match[0] });
        i += match[0].length;
        continue;
      }
    }

    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < s.length && /[0-9.,]/.test(s[i])) {
        num += s[i];
        i++;
      }
      tokens.push({ type: 'mn', val: num });
      continue;
    }

    if (/[a-zA-Zα-ωΑ-Ω]/.test(ch)) {
      let varStr = ch;
      i++;
      while (i < s.length && s.charCodeAt(i) === 0x20D7) {
        varStr += s[i];
        i++;
      }
      tokens.push({ type: 'mi', val: varStr });
      continue;
    }

    if (/[+\-*=()\[\]{}|/.,:;<>!·×±≤≥≠≈⊥∈ℝ⟺⟹→°Δ]/.test(ch)) {
      tokens.push({ type: 'mo', val: ch });
      i++;
      continue;
    }

    tokens.push({ type: 'mtext', val: ch });
    i++;
  }
  return tokens;
}

function parseLatexTokens(tokens) {
  let xml = '';
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t.type === 'mi') {
      xml += `<mi>${t.val}</mi>`;
    } else if (t.type === 'mn') {
      xml += `<mn>${t.val}</mn>`;
    } else if (t.type === 'mo') {
      if (t.val === '<') xml += '<mo>&lt;</mo>';
      else if (t.val === '>') xml += '<mo>&gt;</mo>';
      else if (t.val === '&') xml += '<mo>&amp;</mo>';
      else xml += `<mo>${t.val}</mo>`;
    } else if (t.type === 'mtext') {
      xml += `<mtext>${t.val}</mtext>`;
    } else if (t.type === 'macro') {
      if (t.val === '\\cos') xml += '<mi class="m-fn">cos</mi>';
      else if (t.val === '\\sin') xml += '<mi class="m-fn">sin</mi>';
      else if (t.val === '\\tan') xml += '<mi class="m-fn">tan</mi>';
      else if (t.val === '\\sqrt') xml += '<mo>√</mo>';
      else xml += `<mtext>${t.val}</mtext>`;
    }
  }
  return xml;
}

function latexToMathML(latex, display = false) {
  let clean = latex.trim();
  const placeholders = [];
  function saveBlock(content) {
    const id = `\uE000${placeholders.length}\uE001`;
    placeholders.push(content);
    return id;
  }

  // Handle \frac{a}{b}
  clean = clean.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, num, den) => {
    const numXml = parseLatexTokens(tokenizeLatex(num));
    const denXml = parseLatexTokens(tokenizeLatex(den));
    return saveBlock(`<mfrac><mrow>${numXml}</mrow><mrow>${denXml}</mrow></mfrac>`);
  });

  // Handle \sqrt{a}
  clean = clean.replace(/\\sqrt\{([^{}]+)\}/g, (m, inner) => {
    const inXml = parseLatexTokens(tokenizeLatex(inner));
    return saveBlock(`<msqrt><mrow>${inXml}</mrow></msqrt>`);
  });

  // Handle superscripts x^{y} or x^y
  clean = clean.replace(/([A-Za-z0-9α-ω\u20D7]+|\})\^\{([^{}]+)\}/g, (m, b, exp) => {
    const baseXml = b.startsWith('}') ? '' : parseLatexTokens(tokenizeLatex(b));
    const expXml = parseLatexTokens(tokenizeLatex(exp));
    return saveBlock(`<msup><mrow>${baseXml}</mrow><mrow>${expXml}</mrow></msup>`);
  });
  clean = clean.replace(/([A-Za-z0-9α-ω\u20D7]+)\^([0-9a-zA-Z°]+)/g, (m, b, exp) => {
    const baseXml = parseLatexTokens(tokenizeLatex(b));
    const expXml = parseLatexTokens(tokenizeLatex(exp));
    return saveBlock(`<msup><mrow>${baseXml}</mrow><mrow>${expXml}</mrow></msup>`);
  });

  // Handle subscripts x_{y} or x_y
  clean = clean.replace(/([A-Za-z0-9α-ω\u20D7]+)_\{([^{}]+)\}/g, (m, b, sub) => {
    const baseXml = parseLatexTokens(tokenizeLatex(b));
    const subXml = parseLatexTokens(tokenizeLatex(sub));
    return saveBlock(`<msub><mrow>${baseXml}</mrow><mrow>${subXml}</mrow></msub>`);
  });
  clean = clean.replace(/([A-Za-z0-9α-ω\u20D7]+)_([0-9a-zA-Z]+)/g, (m, b, sub) => {
    const baseXml = parseLatexTokens(tokenizeLatex(b));
    const subXml = parseLatexTokens(tokenizeLatex(sub));
    return saveBlock(`<msub><mrow>${baseXml}</mrow><mrow>${subXml}</mrow></msub>`);
  });

  const tokens = tokenizeLatex(clean);
  let mathml = parseLatexTokens(tokens);

  for (let i = 0; i < placeholders.length; i++) {
    const ph = `\uE000${i}\uE001`;
    mathml = mathml.replace(ph, placeholders[i]);
    mathml = mathml.replace(`<mtext>${ph}</mtext>`, placeholders[i]);
    mathml = mathml.replace(`<mi>${ph}</mi>`, placeholders[i]);
    mathml = mathml.replace(`<mo>${ph}</mo>`, placeholders[i]);
  }

  const dispAttr = display ? ' display="block" class="math-block"' : ' class="math-inline"';
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${dispAttr}><mrow>${mathml}</mrow></math>`;
}

function formatMathText(text) {
  if (!text) return '';
  let res = text.replace(/\$\$([\s\S]+?)\$\$/g, (m, f) => latexToMathML(f, true));
  res = res.replace(/\$([^\$\n]+?)\$/g, (m, f) => latexToMathML(f, false));
  return res;
}

function renderMathInTree(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeValue && n.nodeValue.includes('$')) {
      textNodes.push(n);
    }
  }

  textNodes.forEach(node => {
    const parent = node.parentNode;
    if (!parent) return;
    const tag = parent.nodeName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'textarea' || tag === 'math') return;

    const span = document.createElement('span');
    span.innerHTML = formatMathText(node.nodeValue);
    parent.replaceChild(span, node);
  });
}

// ==========================================
// 2. WEB AUDIO API SOUND SYSTEM
// ==========================================

class AudioSynth {
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
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(800, this.ctx.currentTime + 0.05);
    g.gain.setValueAtTime(0.08, this.ctx.currentTime);
    g.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playCorrect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.07);
      g.gain.setValueAtTime(0.12, now + i * 0.07);
      g.gain.linearRampToValueAtTime(0.001, now + i * 0.07 + 0.18);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + i * 0.07);
      osc.stop(now + i * 0.07 + 0.2);
    });
  }

  playWrong() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.25);
    g.gain.setValueAtTime(0.12, now);
    g.gain.linearRampToValueAtTime(0.001, now + 0.25);
    osc.connect(g);
    g.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.26);
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880, 1108.73];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.09);
      g.gain.setValueAtTime(0.15, now + idx * 0.09);
      g.gain.linearRampToValueAtTime(0.001, now + idx * 0.09 + 0.25);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + idx * 0.09);
      osc.stop(now + idx * 0.09 + 0.26);
    });
  }

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chords = [
      { f: 523.25, t: 0, d: 0.15 },
      { f: 659.25, t: 0.15, d: 0.15 },
      { f: 783.99, t: 0.3, d: 0.2 },
      { f: 1046.5, t: 0.5, d: 0.5 }
    ];
    chords.forEach(c => {
      const osc = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(c.f, now + c.t);
      g.gain.setValueAtTime(0.18, now + c.t);
      g.gain.linearRampToValueAtTime(0.001, now + c.t + c.d);
      osc.connect(g);
      g.connect(this.ctx.destination);
      osc.start(now + c.t);
      osc.stop(now + c.t + c.d + 0.05);
    });
  }
}

const sound = new AudioSynth();

// ==========================================
// 3. APPLICATION STATE
// ==========================================

const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Toàn Năng Chương IV 🌟',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// ==========================================
// 4. ARENA QUIZ DATA (10 MCQs - SGK TRANG 71 - 72)
// ==========================================

const quizData = [
  {
    id: 1,
    title: 'Bài 4.27 SGK Trang 71: Cặp Vectơ Cùng Phương',
    pts: 20,
    question: 'Trong mặt phẳng toạ độ $Oxy$, cặp vectơ nào sau đây có cùng phương?',
    options: [
      { text: 'A. $\\vec{u} = (2; 3)$ và $\\vec{v} = (\\frac{1}{2}; 6)$', correct: false },
      { text: 'B. $\\vec{a} = (\\sqrt{2}; 6)$ và $\\vec{b} = (1; 3\\sqrt{2})$', correct: true },
      { text: 'C. $\\vec{i} = (0; 1)$ và $\\vec{j} = (1; 0)$', correct: false },
      { text: 'D. $\\vec{c} = (1; 3)$ và $\\vec{d} = (2; -6)$', correct: false }
    ],
    explanation: 'Ta có $\\vec{a} = (\\sqrt{2}; 6) = \\sqrt{2}(1; \\frac{6}{\\sqrt{2}}) = \\sqrt{2}(1; 3\\sqrt{2}) = \\sqrt{2}\\vec{b}$. Vì tồn tại số $k = \\sqrt{2}$ sao cho $\\vec{a} = k\\vec{b}$ nên hai vectơ $\\vec{a}$ và $\\vec{b}$ cùng phương (và cùng hướng).'
  },
  {
    id: 2,
    title: 'Bài 4.28 SGK Trang 71: Cặp Vectơ Vuông Góc',
    pts: 20,
    question: 'Trong mặt phẳng toạ độ $Oxy$, cặp vectơ nào sau đây luôn vuông góc với nhau?',
    options: [
      { text: 'A. $\\vec{u} = (2; 3)$ và $\\vec{v} = (4; 6)$', correct: false },
      { text: 'B. $\\vec{a} = (1; -1)$ và $\\vec{b} = (-1; 1)$', correct: false },
      { text: 'C. $\\vec{z} = (a; b)$ và $\\vec{t} = (-b; a)$', correct: true },
      { text: 'D. $\\vec{n} = (1; 1)$ và $\\vec{k} = (2; 0)$', correct: false }
    ],
    explanation: 'Hai vectơ vuông góc khi và chỉ khi tích vô hướng bằng $0$. Ta xét tích vô hướng: $\\vec{z} \\cdot \\vec{t} = a(-b) + b(a) = -ab + ab = 0$. Do đó $\\vec{z} \\perp \\vec{t}$ với mọi giá trị $a, b$.'
  },
  {
    id: 3,
    title: 'Bài 4.29 SGK Trang 71: Vectơ Có Độ Dài Bằng 1',
    pts: 20,
    question: 'Trong mặt phẳng toạ độ $Oxy$, vectơ nào sau đây có độ dài bằng $1$ (vectơ đơn vị)?',
    options: [
      { text: 'A. $\\vec{a} = (1; 1)$', correct: false },
      { text: 'B. $\\vec{b} = (1; -1)$', correct: false },
      { text: 'C. $\\vec{c} = (2; \\frac{1}{2})$', correct: false },
      { text: 'D. $\\vec{d} = (\\frac{1}{\\sqrt{2}}; -\\frac{1}{\\sqrt{2}})$', correct: true }
    ],
    explanation: 'Độ dài vectơ $\\vec{d} = (x; y)$ là $|\\vec{d}| = \\sqrt{x^2 + y^2}$. Ta có: $|\\vec{d}| = \\sqrt{(\\frac{1}{\\sqrt{2}})^2 + (-\\frac{1}{\\sqrt{2}})^2} = \\sqrt{\\frac{1}{2} + \\frac{1}{2}} = \\sqrt{1} = 1$.'
  },
  {
    id: 4,
    title: 'Bài 4.30 SGK Trang 71: Tính Số Đo Góc Giữa Hai Vectơ',
    pts: 20,
    question: 'Góc giữa vectơ $\\vec{a} = (1; -1)$ và vectơ $\\vec{b} = (-2; 0)$ có số đo bằng:',
    options: [
      { text: 'A. $90^\\circ$', correct: false },
      { text: 'B. $0^\\circ$', correct: false },
      { text: 'C. $135^\\circ$', correct: true },
      { text: 'D. $45^\\circ$', correct: false }
    ],
    explanation: 'Áp dụng công thức tính côsin góc: $\\cos(\\vec{a}, \\vec{b}) = \\frac{\\vec{a}\\cdot\\vec{b}}{|\\vec{a}|\\cdot|\\vec{b}|} = \\frac{1(-2) + (-1)(0)}{\\sqrt{1^2+(-1)^2}\\cdot\\sqrt{(-2)^2+0^2}} = \\frac{-2}{\\sqrt{2}\\cdot 2} = -\\frac{\\sqrt{2}}{2}$. Do đó số đo góc là $135^\\circ$.'
  },
  {
    id: 5,
    title: 'Bài 4.31 SGK Trang 71: Tính Chất Của Tích Vô Hướng',
    pts: 20,
    question: 'Khẳng định nào sau đây là khẳng định ĐÚNG đối với tích vô hướng của các vectơ?',
    options: [
      { text: 'A. $(\\vec{a} \\cdot \\vec{b})\\vec{c} = \\vec{a}(\\vec{b} \\cdot \\vec{c})$', correct: false },
      { text: 'B. $(\\vec{a} \\cdot \\vec{b})^2 = \\vec{a}^2 \\cdot \\vec{b}^2$', correct: false },
      { text: 'C. $\\vec{a} \\cdot \\vec{b} = |\\vec{a}| \\cdot |\\vec{b}| \\sin(\\vec{a}, \\vec{b})$', correct: false },
      { text: 'D. $\\vec{a} \\cdot (\\vec{b} - \\vec{c}) = \\vec{a} \\cdot \\vec{b} - \\vec{a} \\cdot \\vec{c}$', correct: true }
    ],
    explanation: 'Tích vô hướng có tính chất phân phối đối với phép trừ vectơ: $\\vec{a} \\cdot (\\vec{b} - \\vec{c}) = \\vec{a} \\cdot \\vec{b} - \\vec{a} \\cdot \\vec{c}$. Câu A sai vì hai vế là hai vectơ khác phương; câu B sai vì thiếu hệ số $\\cos^2\\alpha$; câu C sai vì định nghĩa dùng hàm $\\cos$, không phải $\\sin$.'
  },
  {
    id: 6,
    title: 'Bài 4.32 SGK Trang 71: Tích Vô Hướng Trong Hình Vuông',
    pts: 20,
    question: 'Cho hình vuông $ABCD$ có cạnh bằng $a$. Khẳng định nào sau đây là ĐÚNG?',
    options: [
      { text: 'A. $(\\overrightarrow{AB}, \\overrightarrow{BD}) = 45^\\circ$', correct: false },
      { text: 'B. $\\overrightarrow{AC} \\cdot \\overrightarrow{BC} = a^2$', correct: true },
      { text: 'C. $\\overrightarrow{AC} \\cdot \\overrightarrow{BD} = a^2\\sqrt{2}$', correct: false },
      { text: 'D. $\\overrightarrow{BA} \\cdot \\overrightarrow{BD} = -a^2$', correct: false }
    ],
    explanation: 'Ta có $\\overrightarrow{AC} \\cdot \\overrightarrow{BC} = (-\\overrightarrow{CA}) \\cdot (-\\overrightarrow{CB}) = \\overrightarrow{CA} \\cdot \\overrightarrow{CB} = CA \\cdot CB \\cdot \\cos(\\widehat{ACB}) = (a\\sqrt{2}) \\cdot a \\cdot \\cos 45^\\circ = a^2\\sqrt{2} \\cdot \\frac{\\sqrt{2}}{2} = a^2$.'
  },
  {
    id: 7,
    title: 'Bài 4.33 SGK Trang 71: Phân Tích Vectơ Điểm Chia Đoạn',
    pts: 20,
    question: 'Trên cạnh $BC$ của tam giác $ABC$ lấy điểm $M$ sao cho $MB = 3MC$. Biểu thị vectơ $\\overrightarrow{AM}$ theo hai vectơ $\\overrightarrow{AB}$ và $\\overrightarrow{AC}$ là:',
    options: [
      { text: 'A. $\\overrightarrow{AM} = \\frac{1}{4}\\overrightarrow{AB} + \\frac{3}{4}\\overrightarrow{AC}$', correct: true },
      { text: 'B. $\\overrightarrow{AM} = \\frac{3}{4}\\overrightarrow{AB} + \\frac{1}{4}\\overrightarrow{AC}$', correct: false },
      { text: 'C. $\\overrightarrow{AM} = 3\\overrightarrow{AB} - \\overrightarrow{AC}$', correct: false },
      { text: 'D. $\\overrightarrow{AM} = \\frac{1}{3}\\overrightarrow{AB} + \\frac{2}{3}\\overrightarrow{AC}$', correct: false }
    ],
    explanation: 'Vì điểm $M$ nằm giữa $B$ và $C$ và $MB = 3MC$ nên hai vectơ $\\overrightarrow{MB}$ và $\\overrightarrow{MC}$ ngược hướng, suy ra $\\overrightarrow{MB} = -3\\overrightarrow{MC}$. Chèn gốc $A$: $\\overrightarrow{AB} - \\overrightarrow{AM} = -3(\\overrightarrow{AC} - \\overrightarrow{AM}) \\iff \\overrightarrow{AB} - \\overrightarrow{AM} = -3\\overrightarrow{AC} + 3\\overrightarrow{AM} \\iff 4\\overrightarrow{AM} = \\overrightarrow{AB} + 3\\overrightarrow{AC} \\iff \\overrightarrow{AM} = \\frac{1}{4}\\overrightarrow{AB} + \\frac{3}{4}\\overrightarrow{AC}$.'
  },
  {
    id: 8,
    title: 'Bài 4.34 SGK Trang 72: Đẳng Thức Hình Bình Hành',
    pts: 20,
    question: 'Cho hình bình hành $ABCD$. Với mọi điểm $M$ tuỳ ý trong mặt phẳng, khẳng định nào sau đây luôn đúng?',
    options: [
      { text: 'A. $\\overrightarrow{MA} + \\overrightarrow{MB} = \\overrightarrow{MC} + \\overrightarrow{MD}$', correct: false },
      { text: 'B. $\\overrightarrow{MA} + \\overrightarrow{MC} = \\overrightarrow{MB} + \\overrightarrow{MD}$', correct: true },
      { text: 'C. $\\overrightarrow{MA} - \\overrightarrow{MC} = \\overrightarrow{MB} - \\overrightarrow{MD}$', correct: false },
      { text: 'D. $\\overrightarrow{MA} + \\overrightarrow{MD} = \\overrightarrow{MB} + \\overrightarrow{MC}$', correct: false }
    ],
    explanation: 'Gọi $O$ là giao điểm hai đường chéo $AC$ và $BD$, khi đó $O$ đồng thời là trung điểm của $AC$ và $BD$. Áp dụng tính chất trung điểm: $\\overrightarrow{MA} + \\overrightarrow{MC} = 2\\overrightarrow{MO}$ và $\\overrightarrow{MB} + \\overrightarrow{MD} = 2\\overrightarrow{MO}$. Từ đó suy ra $\\overrightarrow{MA} + \\overrightarrow{MC} = \\overrightarrow{MB} + \\overrightarrow{MD}$.'
  },
  {
    id: 9,
    title: 'Bài 4.35 SGK Trang 72: Giải Tích Tam Giác Vuông Oxy',
    pts: 20,
    question: 'Trong mặt phẳng toạ độ $Oxy$, cho ba điểm $A(2; 1), B(-2; 5)$ và $C(-5; 2)$. Diện tích tam giác $ABC$ bằng:',
    options: [
      { text: 'A. $12$', correct: true },
      { text: 'B. $24$', correct: false },
      { text: 'C. $6\\sqrt{2}$', correct: false },
      { text: 'D. $18$', correct: false }
    ],
    explanation: 'Ta có $\\overrightarrow{BA} = (4; -4)$ và $\\overrightarrow{BC} = (-3; -3)$. Xét tích vô hướng: $\\overrightarrow{BA} \\cdot \\overrightarrow{BC} = 4(-3) + (-4)(-3) = -12 + 12 = 0 \\implies BA \\perp BC$, tam giác $ABC$ vuông tại $B$. Độ dài hai cạnh góc vuông: $BA = \\sqrt{4^2 + (-4)^2} = 4\\sqrt{2}$, $BC = \\sqrt{(-3)^2 + (-3)^2} = 3\\sqrt{2}$. Do đó diện tích tam giác: $S_{ABC} = \\frac{1}{2}BA \\cdot BC = \\frac{1}{2} \\cdot 4\\sqrt{2} \\cdot 3\\sqrt{2} = 12$.'
  },
  {
    id: 10,
    title: 'Bài 4.39 SGK Trang 72: Vận Tốc Thực Tế Của Ca Nô Trên Sông',
    pts: 20,
    question: 'Trên sông, ca nô chuyển động thẳng đều theo hướng $S15^\\circ E$ với vận tốc thực $v = 20\\text{ km/h}$. Dòng nước chảy về hướng đông với vận tốc $v_n = 3\\text{ km/h}$. Độ lớn vận tốc riêng của ca nô xấp xỉ bằng:',
    options: [
      { text: 'A. $19,4\\text{ km/h}$', correct: true },
      { text: 'B. $23,0\\text{ km/h}$', correct: false },
      { text: 'C. $17,0\\text{ km/h}$', correct: false },
      { text: 'D. $20,2\\text{ km/h}$', correct: false }
    ],
    explanation: 'Theo quy tắc cộng vận tốc: $\\vec{v} = \\vec{v}_r + \\vec{v}_n \\implies \\vec{v}_r = \\vec{v} - \\vec{v}_n$. Hướng đông là góc $90^\\circ$ so với hướng bắc. Hướng $S15^\\circ E$ tạo với hướng đông một góc $\\theta = 90^\\circ - 15^\\circ = 75^\\circ$. Theo định lí côsin trong tam giác vectơ: $v_r^2 = v^2 + v_n^2 - 2 v v_n \\cos 75^\\circ = 20^2 + 3^2 - 2(20)(3)\\cos 75^\\circ \\approx 409 - 120 \\cdot 0,2588 \\approx 377,94 \\implies v_r \\approx 19,44\\text{ km/h} \\approx 19,4\\text{ km/h}$.'
  }
];

// ==========================================
// 5. INTERACTIVE LAB 1: MASTER VECTOR RADAR
// ==========================================

class MasterVectorRadar {
  constructor() {
    this.canvas = document.getElementById('radarCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    this.ux = 3.0;
    this.uy = 2.0;
    this.vx = 1.0;
    this.vy = 4.0;

    this.initControls();
    this.render();
  }

  initControls() {
    const uxS = document.getElementById('uxSlider');
    const uyS = document.getElementById('uySlider');
    const vxS = document.getElementById('vxSlider');
    const vyS = document.getElementById('vySlider');

    const updateFromSliders = () => {
      this.ux = parseFloat(uxS.value);
      this.uy = parseFloat(uyS.value);
      this.vx = parseFloat(vxS.value);
      this.vy = parseFloat(vyS.value);
      document.getElementById('uCoordVal').textContent = `(${this.ux.toFixed(1)}; ${this.uy.toFixed(1)})`;
      document.getElementById('vCoordVal').textContent = `(${this.vx.toFixed(1)}; ${this.vy.toFixed(1)})`;
      sound.playClick();
      this.render();
    };

    [uxS, uyS, vxS, vyS].forEach(s => s && s.addEventListener('input', updateFromSliders));

    document.getElementById('btnPresetPerp')?.addEventListener('click', () => {
      this.setCoords(2, 3, -3, 2);
      unlockBadge(1);
    });

    document.getElementById('btnPresetCollinear')?.addEventListener('click', () => {
      this.setCoords(2, 3, 4, 6);
      unlockBadge(1);
    });

    document.getElementById('btnPresetUnit')?.addEventListener('click', () => {
      this.setCoords(0.7, -0.7, 1, 0);
      unlockBadge(1);
    });

    document.getElementById('btnPresetAngle135')?.addEventListener('click', () => {
      this.setCoords(2, -2, -3, 0);
      unlockBadge(1);
    });
  }

  setCoords(ux, uy, vx, vy) {
    this.ux = ux;
    this.uy = uy;
    this.vx = vx;
    this.vy = vy;

    const uxS = document.getElementById('uxSlider');
    const uyS = document.getElementById('uySlider');
    const vxS = document.getElementById('vxSlider');
    const vyS = document.getElementById('vySlider');

    if (uxS) uxS.value = ux;
    if (uyS) uyS.value = uy;
    if (vxS) vxS.value = vx;
    if (vyS) vyS.value = vy;

    document.getElementById('uCoordVal').textContent = `(${ux.toFixed(1)}; ${uy.toFixed(1)})`;
    document.getElementById('vCoordVal').textContent = `(${vx.toFixed(1)}; ${vy.toFixed(1)})`;

    sound.playLevelUp();
    this.render();
  }

  toCanvas(x, y) {
    const originX = this.canvas.width / 2;
    const originY = this.canvas.height / 2;
    const scale = 26; // pixels per unit
    return {
      cx: originX + x * scale,
      cy: originY - y * scale
    };
  }

  render() {
    if (!this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    const origin = this.toCanvas(0, 0);

    // Draw coordinate grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const scale = 26;
    for (let x = origin.cx % scale; x < w; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = origin.cy % scale; y < h; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, origin.cy);
    ctx.lineTo(w, origin.cy);
    ctx.moveTo(origin.cx, 0);
    ctx.lineTo(origin.cx, h);
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('x', w - 16, origin.cy - 8);
    ctx.fillText('y', origin.cx + 8, 16);
    ctx.fillText('O', origin.cx - 14, origin.cy + 16);

    // Parallelogram completion for sum
    const sumX = this.ux + this.vx;
    const sumY = this.uy + this.vy;
    const pU = this.toCanvas(this.ux, this.uy);
    const pV = this.toCanvas(this.vx, this.vy);
    const pSum = this.toCanvas(sumX, sumY);

    ctx.save();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#10b98166';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pU.cx, pU.cy);
    ctx.lineTo(pSum.cx, pSum.cy);
    ctx.lineTo(pV.cx, pV.cy);
    ctx.stroke();
    ctx.restore();

    // Draw Vector Sum (u + v)
    this.drawArrow(origin.cx, origin.cy, pSum.cx, pSum.cy, '#10b981', 2, 'u + v');

    // Draw Vector u
    this.drawArrow(origin.cx, origin.cy, pU.cx, pU.cy, '#06b6d4', 3, 'u');

    // Draw Vector v
    this.drawArrow(origin.cx, origin.cy, pV.cx, pV.cy, '#f59e0b', 3, 'v');

    // Calculations
    const lenU = Math.sqrt(this.ux * this.ux + this.uy * this.uy);
    const lenV = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
    const dot = this.ux * this.vx + this.uy * this.vy;

    let angleDeg = 0;
    if (lenU > 0.001 && lenV > 0.001) {
      let cosVal = dot / (lenU * lenV);
      cosVal = Math.max(-1, Math.min(1, cosVal));
      angleDeg = (Math.acos(cosVal) * 180) / Math.PI;
    }

    // Draw angle arc
    if (lenU > 0.001 && lenV > 0.001) {
      const angU = Math.atan2(-this.uy, this.ux);
      const angV = Math.atan2(-this.vy, this.vx);
      ctx.beginPath();
      ctx.arc(origin.cx, origin.cy, 35, Math.min(angU, angV), Math.max(angU, angV));
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Update Output
    document.getElementById('outULen').textContent = lenU.toFixed(2);
    document.getElementById('outVLen').textContent = lenV.toFixed(2);
    document.getElementById('outSumVec').textContent = `(${sumX.toFixed(1)}; ${sumY.toFixed(1)})`;
    document.getElementById('outDiffVec').textContent = `(${(this.ux - this.vx).toFixed(1)}; ${(this.uy - this.vy).toFixed(1)})`;
    document.getElementById('outDotProduct').textContent = (dot >= 0 ? '+' : '') + dot.toFixed(2);
    document.getElementById('outAngle').textContent = angleDeg.toFixed(1) + '°';

    const relEl = document.getElementById('outRelation');
    const det = this.ux * this.vy - this.uy * this.vx;
    if (Math.abs(dot) < 0.05) {
      relEl.textContent = '📐 Hai vectơ vuông góc (u ⊥ v)! Tích vô hướng = 0.';
      relEl.style.color = '#10b981';
    } else if (Math.abs(det) < 0.05) {
      if (dot > 0) {
        relEl.textContent = '➡️ Hai vectơ cùng phương, cùng hướng (góc = 0°)!';
        relEl.style.color = '#38bdf8';
      } else {
        relEl.textContent = '⬅️ Hai vectơ cùng phương, ngược hướng (góc = 180°)!';
        relEl.style.color = '#f87171';
      }
    } else {
      relEl.textContent = '✨ Hai vectơ độc lập (không cùng phương, không vuông góc).';
      relEl.style.color = '#cbd5e1';
    }
  }

  drawArrow(fromX, fromY, toX, toY, color, width, label) {
    const ctx = this.ctx;
    const headLen = 10;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const angle = Math.atan2(dy, dx);

    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
    ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
    ctx.closePath();
    ctx.fill();

    if (label) {
      ctx.fillStyle = color;
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText(label, toX + 6, toY - 4);
    }
  }
}

// ==========================================
// 6. INTERACTIVE LAB 2: TRIANGLE ANALYTIC SOLVER
// ==========================================

class TriangleVectorAnalyticSolver {
  constructor() {
    this.canvas = document.getElementById('triangleCanvas');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');

    // SGK Exercise 4.35 Default: A(2; 1), B(-2; 5), C(-5; 2)
    this.A = { x: 2, y: 1 };
    this.B = { x: -2, y: 5 };
    this.C = { x: -5, y: 2 };
    this.showHBH = true;

    this.initControls();
    this.render();
  }

  initControls() {
    const ax = document.getElementById('axSlider');
    const ay = document.getElementById('aySlider');
    const bx = document.getElementById('bxSlider');
    const by = document.getElementById('bySlider');
    const cx = document.getElementById('cxSlider');
    const cy = document.getElementById('cySlider');

    const update = () => {
      this.A.x = parseInt(ax.value, 10);
      this.A.y = parseInt(ay.value, 10);
      this.B.x = parseInt(bx.value, 10);
      this.B.y = parseInt(by.value, 10);
      this.C.x = parseInt(cx.value, 10);
      this.C.y = parseInt(cy.value, 10);

      document.getElementById('labelA').textContent = `(${this.A.x}; ${this.A.y})`;
      document.getElementById('labelB').textContent = `(${this.B.x}; ${this.B.y})`;
      document.getElementById('labelC').textContent = `(${this.C.x}; ${this.C.y})`;

      sound.playClick();
      this.render();
    };

    [ax, ay, bx, by, cx, cy].forEach(s => s && s.addEventListener('input', update));

    document.getElementById('btnPreset435')?.addEventListener('click', () => {
      this.A = { x: 2, y: 1 };
      this.B = { x: -2, y: 5 };
      this.C = { x: -5, y: 2 };

      if (ax) ax.value = 2;
      if (ay) ay.value = 1;
      if (bx) bx.value = -2;
      if (by) by.value = 5;
      if (cx) cx.value = -5;
      if (cy) cy.value = 2;

      document.getElementById('labelA').textContent = '(2; 1)';
      document.getElementById('labelB').textContent = '(-2; 5)';
      document.getElementById('labelC').textContent = '(-5; 2)';

      sound.playFanfare();
      unlockBadge(2);
      this.render();
    });

    document.getElementById('btnToggleParallelogram')?.addEventListener('click', () => {
      this.showHBH = !this.showHBH;
      sound.playClick();
      this.render();
    });
  }

  toCanvas(x, y) {
    const originX = this.canvas.width / 2;
    const originY = this.canvas.height / 2;
    const scale = 24;
    return {
      cx: originX + x * scale,
      cy: originY - y * scale
    };
  }

  render() {
    if (!this.ctx) return;
    const w = this.canvas.width;
    const h = this.canvas.height;
    const ctx = this.ctx;
    ctx.clearRect(0, 0, w, h);

    const origin = this.toCanvas(0, 0);

    // Grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    const scale = 24;
    for (let x = origin.cx % scale; x < w; x += scale) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = origin.cy % scale; y < h; y += scale) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, origin.cy);
    ctx.lineTo(w, origin.cy);
    ctx.moveTo(origin.cx, 0);
    ctx.lineTo(origin.cx, h);
    ctx.stroke();

    const pA = this.toCanvas(this.A.x, this.A.y);
    const pB = this.toCanvas(this.B.x, this.B.y);
    const pC = this.toCanvas(this.C.x, this.C.y);

    // Vector calculations
    const vBA = { x: this.A.x - this.B.x, y: this.A.y - this.B.y };
    const vBC = { x: this.C.x - this.B.x, y: this.C.y - this.B.y };
    const dotBA_BC = vBA.x * vBC.x + vBA.y * vBC.y;

    const lenBA = Math.sqrt(vBA.x * vBA.x + vBA.y * vBA.y);
    const lenBC = Math.sqrt(vBC.x * vBC.x + vBC.y * vBC.y);
    const lenAC = Math.sqrt(Math.pow(this.C.x - this.A.x, 2) + Math.pow(this.C.y - this.A.y, 2));

    // Area calculation via cross-product / determinant
    const cross = Math.abs(vBA.x * vBC.y - vBA.y * vBC.x);
    const area = cross / 2;

    // Centroid G
    const G = {
      x: (this.A.x + this.B.x + this.C.x) / 3,
      y: (this.A.y + this.B.y + this.C.y) / 3
    };
    const pG = this.toCanvas(G.x, G.y);

    // Parallelogram D such that BCAD is parallelogram:
    // BCAD => BC = DA => C - B = A - D => D = A + B - C or BCAD: D = C + A - B
    // In SGK 4.35d: BCAD is parallelogram => vec(BC) = vec(DA) => (xC - xB; yC - yB) = (xA - xD; yA - yD)
    // => xD = xA - xC + xB; yD = yA - yC + yB
    const D = {
      x: this.A.x - this.C.x + this.B.x,
      y: this.A.y - this.C.y + this.B.y
    };
    const pD = this.toCanvas(D.x, D.y);

    // Draw Parallelogram if enabled
    if (this.showHBH) {
      ctx.save();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.08)';
      ctx.beginPath();
      ctx.moveTo(pB.cx, pB.cy);
      ctx.lineTo(pC.cx, pC.cy);
      ctx.lineTo(pA.cx, pA.cy);
      ctx.lineTo(pD.cx, pD.cy);
      ctx.closePath();
      ctx.fill();

      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = '#10b98188';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(pC.cx, pC.cy);
      ctx.lineTo(pD.cx, pD.cy);
      ctx.lineTo(pA.cx, pA.cy);
      ctx.stroke();
      ctx.restore();

      // Point D
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(pD.cx, pD.cy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`D(${D.x}; ${D.y})`, pD.cx + 8, pD.cy - 6);
    }

    // Draw Triangle ABC
    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
    ctx.beginPath();
    ctx.moveTo(pA.cx, pA.cy);
    ctx.lineTo(pB.cx, pB.cy);
    ctx.lineTo(pC.cx, pC.cy);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Centroid G and medians
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#a855f788';
    ctx.beginPath();
    ctx.moveTo(pA.cx, pA.cy);
    ctx.lineTo((pB.cx + pC.cx) / 2, (pB.cy + pC.cy) / 2);
    ctx.moveTo(pB.cx, pB.cy);
    ctx.lineTo((pA.cx + pC.cx) / 2, (pA.cy + pC.cy) / 2);
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#c084fc';
    ctx.beginPath();
    ctx.arc(pG.cx, pG.cy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`G(${G.x.toFixed(1)}; ${G.y.toFixed(1)})`, pG.cx + 8, pG.cy + 14);

    // Vertices A, B, C
    const pts = [
      { p: pA, name: `A(${this.A.x}; ${this.A.y})`, color: '#38bdf8' },
      { p: pB, name: `B(${this.B.x}; ${this.B.y})`, color: '#f59e0b' },
      { p: pC, name: `C(${this.C.x}; ${this.C.y})`, color: '#ec4899' }
    ];
    pts.forEach(pt => {
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.p.cx, pt.p.cy, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(pt.name, pt.p.cx + 8, pt.p.cy - 6);
    });

    // Right-angle symbol at B if dot is 0
    if (Math.abs(dotBA_BC) < 0.05) {
      ctx.save();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      const uBA = { x: vBA.x / lenBA, y: vBA.y / lenBA };
      const uBC = { x: vBC.x / lenBC, y: vBC.y / lenBC };
      const sz = 14;
      const corner1 = { cx: pB.cx + uBA.x * sz, cy: pB.cy - uBA.y * sz };
      const corner2 = { cx: corner1.cx + uBC.x * sz, cy: corner1.cy - uBC.y * sz };
      const corner3 = { cx: pB.cx + uBC.x * sz, cy: pB.cy - uBC.y * sz };
      ctx.beginPath();
      ctx.moveTo(corner1.cx, corner1.cy);
      ctx.lineTo(corner2.cx, corner2.cy);
      ctx.lineTo(corner3.cx, corner3.cy);
      ctx.stroke();
      ctx.restore();
    }

    // Update Output
    document.getElementById('outBA').textContent = `(${vBA.x}; ${vBA.y})`;
    document.getElementById('outBC').textContent = `(${vBC.x}; ${vBC.y})`;
    document.getElementById('outTriDot').textContent = dotBA_BC;

    const typeEl = document.getElementById('outTriType');
    if (Math.abs(dotBA_BC) < 0.05) {
      typeEl.textContent = '🎉 (Tam giác vuông tại B! BA ⊥ BC)';
      typeEl.style.color = '#10b981';
    } else {
      typeEl.textContent = '(Không vuông tại B)';
      typeEl.style.color = '#94a3b8';
    }

    document.getElementById('outBALen').textContent = lenBA.toFixed(2);
    document.getElementById('outBCLen').textContent = lenBC.toFixed(2);
    document.getElementById('outArea').textContent = area.toFixed(2);
    document.getElementById('outG').textContent = `(${G.x.toFixed(2)}; ${G.y.toFixed(2)})`;
    document.getElementById('outD').textContent = `(${D.x}; ${D.y})`;
  }
}

// ==========================================
// 7. ARENA SGK QUIZ CONTROLLER
// ==========================================

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  quizData.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quiz-card-${q.id}`;

    const answered = appState.answered[q.id];

    let optionsHtml = '';
    q.options.forEach((opt, optIdx) => {
      let optClass = 'quiz-opt-btn';
      let disabled = '';
      if (answered !== undefined) {
        disabled = 'disabled';
        if (opt.correct) optClass += ' correct';
        else if (answered === optIdx) optClass += ' wrong';
      }
      optionsHtml += `
        <button class="${optClass}" data-qid="${q.id}" data-oidx="${optIdx}" ${disabled}>
          ${formatMathText(opt.text)}
        </button>
      `;
    });

    const isShown = answered !== undefined ? 'show' : '';
    card.innerHTML = `
      <div class="quiz-card-header">
        <span class="quiz-badge">Câu ${idx + 1}/10</span>
        <h4 style="margin: 0; color: var(--text-primary); font-size: 1.05rem;">${q.title}</h4>
        <span class="badge-gold">+${q.pts} XP</span>
      </div>
      <div class="quiz-question" style="font-size: 1.05rem; margin-bottom: 14px;">
        ${formatMathText(q.question)}
      </div>
      <div class="quiz-options-list">
        ${optionsHtml}
      </div>
      <div class="explanation-box ${isShown}" id="exp-${q.id}">
        <strong>💡 Lời giải chi tiết:</strong>
        <p style="margin-top: 6px; line-height: 1.6;">${formatMathText(q.explanation)}</p>
      </div>
    `;

    container.appendChild(card);
  });

  // Attach button click events
  container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const qid = parseInt(btn.getAttribute('data-qid'), 10);
      const oidx = parseInt(btn.getAttribute('data-oidx'), 10);
      handleAnswer(qid, oidx);
    });
  });

  updateArenaStats();
}

function handleAnswer(qid, oidx) {
  if (appState.answered[qid] !== undefined) return;

  const q = quizData.find(item => item.id === qid);
  if (!q) return;

  appState.answered[qid] = oidx;
  const isCorrect = q.options[oidx].correct;

  if (isCorrect) {
    appState.xp += q.pts;
    appState.streak += 1;
    sound.playCorrect();
  } else {
    appState.streak = 0;
    sound.playWrong();
  }

  updateHUD();
  updateArenaStats();

  // Update question card buttons immediately
  const card = document.getElementById(`quiz-card-${qid}`);
  if (card) {
    const buttons = card.querySelectorAll('.quiz-opt-btn');
    buttons.forEach((btn, idx) => {
      btn.disabled = true;
      if (q.options[idx].correct) {
        btn.classList.add('correct');
      } else if (idx === oidx) {
        btn.classList.add('wrong');
      }
    });

    const exp = document.getElementById(`exp-${qid}`);
    if (exp) exp.classList.add('show');
  }

  // Check Badges
  const answeredCount = Object.keys(appState.answered).length;
  let correctCount = 0;
  quizData.forEach(item => {
    const ans = appState.answered[item.id];
    if (ans !== undefined && item.options[ans].correct) correctCount++;
  });

  if (appState.xp >= 160) {
    unlockBadge(3);
  }

  if (answeredCount === 10 && correctCount === 10) {
    unlockBadge(4);
    sound.playFanfare();
  }
}

function updateArenaStats() {
  const answeredCount = Object.keys(appState.answered).length;
  const progressEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progressEl) progressEl.textContent = `${answeredCount}/10`;
  if (scoreEl) scoreEl.textContent = `${appState.xp} XP`;
}

// ==========================================
// 8. HUD & GAMIFICATION SYSTEM
// ==========================================

function updateHUD() {
  const xpEl = document.getElementById('xpDisplay') || document.getElementById('xpCount');
  if (xpEl) xpEl.textContent = appState.xp;
  const streakEl = document.getElementById('streakDisplay') || document.getElementById('streakCount');
  if (streakEl) streakEl.textContent = appState.streak;
  const avEl = document.getElementById('avatarBtn') || document.getElementById('userAvatar');
  if (avEl) avEl.textContent = appState.avatar;
  const nameEl = document.getElementById('userNameDisplay') || document.getElementById('userName');
  if (nameEl) nameEl.textContent = appState.userName;
  const titleEl = document.getElementById('userTitle');
  if (titleEl) titleEl.textContent = appState.userTitle;

  // Star Rating
  let stars = '⭐⭐';
  if (appState.xp >= 180) stars = '⭐⭐⭐⭐⭐';
  else if (appState.xp >= 140) stars = '⭐⭐⭐⭐';
  else if (appState.xp >= 80) stars = '⭐⭐⭐';
  const starEl = document.getElementById('starRating') || document.getElementById('starsDisplay');
  if (starEl) starEl.textContent = stars;

  // Update Certificate Name
  const certName = document.getElementById('certStudentName');
  if (certName) {
    // Keep raw student name without emoji to prevent font issues
    certName.textContent = appState.userName;
  }
}

function unlockBadge(badgeIndex) {
  if (appState.badges[badgeIndex]) return;
  appState.badges[badgeIndex] = true;
  const badgeEl = document.getElementById(`badge-${badgeIndex + 1}`);
  if (badgeEl) {
    badgeEl.classList.remove('locked');
    badgeEl.classList.add('unlocked');
  }
  sound.playLevelUp();
}

// ==========================================
// 9. INITIALIZATION & EVENT LISTENERS
// ==========================================

document.addEventListener('DOMContentLoaded', () => {
  // Render MathML in static HTML
  renderMathInTree(document.body);

  // Tab switching
  const tabBtns = document.querySelectorAll('.nav-tab, .tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playClick();
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = btn.getAttribute('data-tab');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');

      if (targetId === 'tab-theory') unlockBadge(0);
    });
  });

  // Sound Toggle
  const soundBtn = document.getElementById('soundToggle');
  soundBtn?.addEventListener('click', () => {
    appState.sound = !appState.sound;
    sound.enabled = appState.sound;
    soundBtn.textContent = appState.sound ? '🔊' : '🔇';
    sound.playClick();
  });

  // Reset Progress
  const resetBtn = document.getElementById('resetProgress') || document.getElementById('btnReset');
  resetBtn?.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình ôn tập không?')) {
      appState.xp = 0;
      appState.streak = 0;
      appState.answered = {};
      appState.badges = [false, false, false, false, false];
      for (let i = 1; i <= 5; i++) {
        const b = document.getElementById(`badge-${i}`);
        if (b) {
          b.classList.remove('unlocked');
          b.classList.add('locked');
        }
      }
      updateHUD();
      renderQuiz();
      sound.playWrong();
    }
  });

  // Avatar Modal
  const avatarBox = document.getElementById('avatarBtn') || document.getElementById('userAvatar');
  const avatarModal = document.getElementById('avatarModal');
  const closeAvatarBtn = document.getElementById('closeAvatarModal');

  avatarBox?.addEventListener('click', () => {
    sound.playClick();
    if (avatarModal) avatarModal.style.display = 'flex';
  });

  closeAvatarBtn?.addEventListener('click', () => {
    sound.playClick();
    if (avatarModal) avatarModal.style.display = 'none';
  });

  document.querySelectorAll('.avatar-choice').forEach(btn => {
    btn.addEventListener('click', () => {
      const av = btn.getAttribute('data-avatar');
      appState.avatar = av;
      updateHUD();
      sound.playCorrect();
      if (avatarModal) avatarModal.style.display = 'none';
    });
  });

  // Print Certificate
  document.getElementById('btnPrintCert')?.addEventListener('click', () => {
    sound.playClick();
    window.print();
  });

  // Initialize Interactive Labs
  const radarLab = new MasterVectorRadar();
  const triLab = new TriangleVectorAnalyticSolver();

  // Initialize Quiz
  renderQuiz();
  updateHUD();
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
