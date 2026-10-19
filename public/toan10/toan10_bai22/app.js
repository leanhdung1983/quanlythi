/* ================================================================
   BÀI 22: BA ĐƯỜNG CONIC - TOÁN 10 TẬP 2 (KNTT)
   Logic: Web Audio API, Canvas Conic Curves & Optics, Đấu Trường SGK 10 Câu.
   ================================================================ */

// === 0. OFFLINE MATHML PARSER & KATEX FALLBACK ===
const mathSymbols = [
  ["\\mathbb{R}", "<mi class=\"m-bb\">&#8477;</mi>"],
  ["\\mathbb{N}", "<mi class=\"m-bb\">&#8469;</mi>"],
  ["\\mathbb{Z}", "<mi class=\"m-bb\">&#8484;</mi>"],
  ["\\mathbb{Q}", "<mi class=\"m-bb\">&#8474;</mi>"],
  ["\\Leftrightarrow", "<mo>&#8660;</mo>"],
  ["\\Rightarrow", "<mo>&#8658;</mo>"],
  ["\\iff", "<mo>&#8660;</mo>"],
  ["\\implies", "<mo>&#8658;</mo>"],
  ["\\approx", "<mo>&#8776;</mo>"],
  ["\\equiv", "<mo>&#8801;</mo>"],
  ["\\forall", "<mo>&#8704;</mo>"],
  ["\\exists", "<mo>&#8707;</mo>"],
  ["\\times", "<mo>&#215;</mo>"],
  ["\\cdot", "<mo>&#8901;</mo>"],
  ["\\perp", "<mo>&#8869;</mo>"],
  ["\\parallel", "<mo>&#8741;</mo>"],
  ["\\alpha", "<mi>&#945;</mi>"],
  ["\\beta", "<mi>&#946;</mi>"],
  ["\\Delta", "<mi>&#916;</mi>"],
  ["\\delta", "<mi>&#948;</mi>"],
  ["\\varphi", "<mi>&#966;</mi>"],
  ["\\pi", "<mi>&#960;</mi>"],
  ["\\geq", "<mo>&#8805;</mo>"],
  ["\\leq", "<mo>&#8804;</mo>"],
  ["\\ge", "<mo>&#8805;</mo>"],
  ["\\le", "<mo>&#8804;</mo>"],
  ["\\neq", "<mo>&#8800;</mo>"],
  ["\\ne", "<mo>&#8800;</mo>"],
  ["\\pm", "<mo>&#177;</mo>"],
  ["\\in", "<mo>&#8712;</mo>"],
  ["\\notin", "<mo>&#8713;</mo>"],
  ["\\circ", "<mo>&#176;</mo>"],
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

  s = s.replace(/\\overrightarrow\{([^}]+)\}/g, (match, inner) => {
    return savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(inner, placeholders) + '</mrow><mo>&#8594;</mo></mover>');
  });

  s = s.replace(/\\vec\{([^}]+)\}/g, (match, inner) => {
    return savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(inner, placeholders) + '</mrow><mo>&#8594;</mo></mover>');
  });

  s = s.replace(/\\(?:dfrac|frac)\{([^{}]+)\}\{([^{}]+)\}/g, (match, num, den) => {
    return savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(num, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(den, placeholders) + '</mrow></mfrac>');
  });

  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^{}]+)\}/g, (match, root, rad) => {
    return savePlaceholder('<mroot><mrow>' + convertLatexToMathMLBody(rad, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(root, placeholders) + '</mrow></mroot>');
  });
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (match, rad) => {
    return savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(rad, placeholders) + '</mrow></msqrt>');
  });

  s = s.replace(/\\text\{([^}]+)\}/g, (match, txt) => {
    return savePlaceholder('<mtext>' + txt + '</mtext>');
  });

  for (const [cmd, sym] of mathSymbols) {
    if (s.includes(cmd)) {
      s = s.split(cmd).join(savePlaceholder(sym));
    }
  }

  s = s.replace(/[^\uE000-\uE001]+/g, (chunk) => tokenizePlainMath(chunk));
  s = s.replace(/\uE000(\d+)\uE001/g, (match, idx) => placeholders[parseInt(idx, 10)]);
  return s;
}

function latexToMathML(latex, display = false) {
  const inner = convertLatexToMathMLBody(latex);
  const dispAttr = display ? ' display="block"' : '';
  const cls = display ? ' class="math-block"' : ' class="math-inline"';
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${dispAttr}${cls}>${inner}</math>`;
}

function formatMathText(str) {
  if (!str) return '';
  let out = str.replace(/\$\$([^\$]+?)\$\$/g, (m, f) => latexToMathML(f, true));
  out = out.replace(/\$([^\$\n]+?)\$/g, (m, f) => latexToMathML(f, false));
  return out;
}

function renderMathInTree(root) {
  if (!root) return;
  if (typeof renderMathInElement === 'function') {
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
      console.warn("KaTeX render error, falling back to MathML:", e);
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
      return node.nodeValue && node.nodeValue.includes('$') ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
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

// === 1. WEB AUDIO API SOUND CONTROLLER ===
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

const sfx = new SoundController();

// === 2. APP STATE ===
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Ba Đường Conic',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false],
  conicMode: 'ellipse', // 'ellipse', 'hyperbola', 'parabola'
  opticMode: 'ellipse'  // 'ellipse', 'parabola'
};

// === 3. SGK ARENA QUIZ DATA (10 QUESTIONS) ===
const quizData = [
  {
    id: 1,
    title: "Bài tập 7.19 (SGK tr.57) - Tiêu điểm và tiêu cự của Elip",
    pts: 20,
    question: "Tiêu cự của elip có phương trình $\\dfrac{x^2}{36} + \\dfrac{y^2}{9} = 1$ bằng:",
    options: [
      { text: "$2c = 6\\sqrt{3}$", correct: true },
      { text: "$2c = 3\\sqrt{3}$", correct: false },
      { text: "$2c = 12$", correct: false },
      { text: "$2c = 6$", correct: false }
    ],
    explanation: "Phương trình elip có dạng $\\dfrac{x^2}{a^2} + \\dfrac{y^2}{b^2} = 1$.\nTa có: $a^2 = 36 \\implies a = 6$ và $b^2 = 9 \\implies b = 3$.\nÁp dụng hệ thức liên hệ $b^2 = a^2 - c^2$:\n$$c^2 = a^2 - b^2 = 36 - 9 = 27 \\implies c = \\sqrt{27} = 3\\sqrt{3}$$\nTiêu cự của elip là $2c = 2 \\times 3\\sqrt{3} = 6\\sqrt{3}$. Hai tiêu điểm là $F_1(-3\\sqrt{3}; 0)$ và $F_2(3\\sqrt{3}; 0)$."
  },
  {
    id: 2,
    title: "Bài tập 7.20 (SGK tr.57) - Tiêu điểm và tiêu cự của Hypebol",
    pts: 20,
    question: "Tiêu điểm và tiêu cự của hypebol $\\dfrac{x^2}{7} - \\dfrac{y^2}{9} = 1$ là:",
    options: [
      { text: "$F_1(-4; 0), F_2(4; 0)$ và tiêu cự $2c = 8$", correct: true },
      { text: "$F_1(-\\sqrt{2}; 0), F_2(\\sqrt{2}; 0)$ và tiêu cự $2c = 2\\sqrt{2}$", correct: false },
      { text: "$F_1(-4; 0), F_2(4; 0)$ và tiêu cự $2c = 4$", correct: false },
      { text: "$F_1(-16; 0), F_2(16; 0)$ và tiêu cự $2c = 32$", correct: false }
    ],
    explanation: "Phương trình hypebol có $a^2 = 7$ và $b^2 = 9$.\nVới hypebol, hệ thức liên hệ là $b^2 = c^2 - a^2$:\n$$c^2 = a^2 + b^2 = 7 + 9 = 16 \\implies c = 4$$\nDo đó tiêu điểm là $F_1(-4; 0), F_2(4; 0)$ và tiêu cự là $2c = 8$."
  },
  {
    id: 3,
    title: "Bài tập 7.21 (SGK tr.57) - Tiêu điểm và đường chuẩn của Parabol",
    pts: 20,
    question: "Tiêu điểm $F$ và đường chuẩn $\\Delta$ của parabol $y^2 = 8x$ là:",
    options: [
      { text: "$F(2; 0)$ và $\\Delta: x = -2$", correct: true },
      { text: "$F(4; 0)$ và $\\Delta: x = -4$", correct: false },
      { text: "$F(2; 0)$ và $\\Delta: y = -2$", correct: false },
      { text: "$F(0; 2)$ và $\\Delta: x = -2$", correct: false }
    ],
    explanation: "Phương trình chính tắc của parabol là $y^2 = 2px$.\nSo sánh với $y^2 = 8x \\implies 2p = 8 \\implies p = 4$.\nTiêu điểm: $F\\left(\\dfrac{p}{2}; 0\\right) = F(2; 0)$.\nĐường chuẩn: $\\Delta: x = -\\dfrac{p}{2} \\iff x = -2$."
  },
  {
    id: 4,
    title: "Bài tập 7.22 (SGK tr.57) - Lập PTCT của Elip",
    pts: 20,
    question: "Phương trình chính tắc của elip đi qua điểm $A(5; 0)$ và có một tiêu điểm $F_2(3; 0)$ là:",
    options: [
      { text: "$\\dfrac{x^2}{25} + \\dfrac{y^2}{16} = 1$", correct: true },
      { text: "$\\dfrac{x^2}{25} + \\dfrac{y^2}{9} = 1$", correct: false },
      { text: "$\\dfrac{x^2}{16} + \\dfrac{y^2}{25} = 1$", correct: false },
      { text: "$\\dfrac{x^2}{25} - \\dfrac{y^2}{16} = 1$", correct: false }
    ],
    explanation: "Điểm $A(5; 0)$ nằm trên trục hoành thuộc elip nên đỉnh $a = 5$.\nTiêu điểm $F_2(3; 0) \\implies c = 3$.\nÁp dụng hệ thức: $b^2 = a^2 - c^2 = 5^2 - 3^2 = 25 - 9 = 16$.\nVậy phương trình chính tắc của elip là $\\dfrac{x^2}{25} + \\dfrac{y^2}{16} = 1$."
  },
  {
    id: 5,
    title: "Bài tập 7.23 (SGK tr.57) - Lập PTCT của Parabol",
    pts: 20,
    question: "Phương trình chính tắc của parabol đi qua điểm $M(2; 4)$ là:",
    options: [
      { text: "$y^2 = 8x$", correct: true },
      { text: "$y^2 = 4x$", correct: false },
      { text: "$y^2 = 16x$", correct: false },
      { text: "$x^2 = 8y$", correct: false }
    ],
    explanation: "Phương trình chính tắc của parabol có dạng $y^2 = 2px$ ($p > 0$).\nVì parabol đi qua điểm $M(2; 4)$ nên thay toạ độ vào phương trình:\n$$4^2 = 2p \\cdot 2 \\iff 16 = 4p \\implies p = 4$$\nVậy phương trình chính tắc là $y^2 = 2(4)x \\iff y^2 = 8x$."
  },
  {
    id: 6,
    title: "Vận dụng 3 (SGK tr.57) - Máy tán sỏi thận gương elip",
    pts: 20,
    question: "Gương elip trong máy tán sỏi thận có phương trình chính tắc $\\dfrac{x^2}{400} + \\dfrac{y^2}{76} = 1$ (đơn vị cm). Khoảng cách từ vị trí đầu phát sóng đến sỏi thận cần tán bằng:",
    options: [
      { text: "$36$ cm", correct: true },
      { text: "$18$ cm", correct: false },
      { text: "$20$ cm", correct: false },
      { text: "$40$ cm", correct: false }
    ],
    explanation: "Đầu phát sóng đặt tại một tiêu điểm $F_1$ và sỏi thận đặt tại tiêu điểm $F_2$.\nKhoảng cách giữa chúng chính là tiêu cự $2c$ của elip.\nTa có: $a^2 = 400, b^2 = 76 \\implies c^2 = a^2 - b^2 = 400 - 76 = 324 \\implies c = 18$ cm.\nVậy khoảng cách là $2c = 2 \\times 18 = 36$ cm."
  },
  {
    id: 7,
    title: "Tính chất tâm sai của ba đường Conic",
    pts: 20,
    question: "Tâm sai $e = \\dfrac{c}{a}$ của ba đường conic Elip, Parabol, Hypebol có đặc điểm tương ứng là:",
    options: [
      { text: "Elip: $0 < e < 1$; Parabol: $e = 1$; Hypebol: $e > 1$", correct: true },
      { text: "Elip: $e > 1$; Parabol: $e = 1$; Hypebol: $0 < e < 1$", correct: false },
      { text: "Elip: $e = 1$; Parabol: $0 < e < 1$; Hypebol: $e > 1$", correct: false },
      { text: "Cả ba đường conic đều có tâm sai $e = 1$", correct: false }
    ],
    explanation: "Định nghĩa tâm sai $e = \\dfrac{c}{a}$:\n- Đường Elip do $c < a$ nên $0 < e < 1$.\n- Đường Parabol có $e = 1$ (khoảng cách tới tiêu điểm bằng khoảng cách tới đường chuẩn).\n- Đường Hypebol do $c > a$ nên $e > 1$."
  },
  {
    id: 8,
    title: "Bài tập 7.24 (SGK tr.57) - Định vị sóng LORAN bằng Hypebol",
    pts: 20,
    question: "Hai trạm phát tín hiệu $A, B$ cách nhau $300$ km. Hiệu thời gian nhận tín hiệu là $0,0005$ s ($v = 292\\,000$ km/s). Phương trình chính tắc của hypebol (đơn vị km) là:",
    options: [
      { text: "$\\dfrac{x^2}{5329} - \\dfrac{y^2}{17171} = 1$", correct: true },
      { text: "$\\dfrac{x^2}{146} - \\dfrac{y^2}{300} = 1$", correct: false },
      { text: "$\\dfrac{x^2}{5329} + \\dfrac{y^2}{17171} = 1$", correct: false },
      { text: "$\\dfrac{x^2}{21316} - \\dfrac{y^2}{68684} = 1$", correct: false }
    ],
    explanation: "Khoảng cách hai trạm $2c = 300 \\implies c = 150$.\nHiệu quãng đường: $2a = v \\cdot \\Delta t = 292\\,000 \\times 0,0005 = 146 \\implies a = 73$.\nTính $b^2 = c^2 - a^2 = 150^2 - 73^2 = 22\\,500 - 5\\,329 = 17\\,171$.\nVà $a^2 = 73^2 = 5\\,329$. Do đó PTCT là $\\dfrac{x^2}{5329} - \\dfrac{y^2}{17171} = 1$."
  },
  {
    id: 9,
    title: "Đặc điểm hình học của Parabol",
    pts: 20,
    question: "Khoảng cách từ đỉnh $O$ đến tiêu điểm $F$ của parabol $y^2 = 12x$ bằng:",
    options: [
      { text: "$3$", correct: true },
      { text: "$6$", correct: false },
      { text: "$12$", correct: false },
      { text: "$1,5$", correct: false }
    ],
    explanation: "Phương trình chính tắc parabol $y^2 = 2px \\implies 2p = 12 \\implies p = 6$.\nTiêu điểm $F$ có toạ độ $\\left(\\dfrac{p}{2}; 0\\right) = (3; 0)$.\nKhoảng cách từ đỉnh $O(0; 0)$ đến tiêu điểm $F(3; 0)$ là $OF = \\dfrac{p}{2} = 3$."
  },
  {
    id: 10,
    title: "Bài tập 7.25 (SGK tr.57) - Khúc cua đường parabol",
    pts: 20,
    question: "Khúc cua parabol có $AB = 400$ m, đỉnh parabol cách đường thẳng $AB$ là $20$ m. Phương trình chính tắc của parabol (với 1 đơn vị bằng 1 m) là:",
    options: [
      { text: "$y^2 = 2000x$", correct: true },
      { text: "$y^2 = 1000x$", correct: false },
      { text: "$y^2 = 400x$", correct: false },
      { text: "$y^2 = 8000x$", correct: false }
    ],
    explanation: "Chọn hệ trục toạ độ sao cho đỉnh parabol trùng gốc toạ độ $O(0; 0)$ và trục đối xứng là $Ox$.\nKhi đó điểm $B$ có toạ độ $x = 20$ và $y = \\dfrac{AB}{2} = 200$.\nThay vào phương trình $y^2 = 2px$:\n$$200^2 = 2p(20) \\iff 40\\,000 = 40p \\implies p = 1\\,000$$\nVậy phương trình chính tắc của parabol là $y^2 = 2px = 2000x$."
  }
];

// === 4. HUD & QUIZ RENDERING ===
function updateHUD() {
  document.getElementById('xpDisplay').textContent = appState.xp;
  document.getElementById('streakDisplay').textContent = `🔥 ${appState.streak}`;
  document.getElementById('userNameDisplay').textContent = `${appState.userName} 🌟`;
  document.getElementById('userTitle').textContent = appState.userTitle;
  document.getElementById('avatarBtn').textContent = appState.avatar;

  let starStr = '⭐⭐☆☆☆';
  if (appState.xp >= 200) starStr = '⭐⭐⭐⭐⭐';
  else if (appState.xp >= 160) starStr = '⭐⭐⭐⭐☆';
  else if (appState.xp >= 100) starStr = '⭐⭐⭐☆☆';
  document.getElementById('starRating').textContent = starStr;

  const answeredCount = Object.keys(appState.answered).length;
  document.getElementById('arenaProgress').textContent = `${answeredCount}/10`;
  document.getElementById('arenaScore').textContent = `${appState.xp} XP`;

  const certName = document.getElementById('certStudentName');
  if (certName) certName.textContent = appState.userName;
}

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';
  const letters = ['A', 'B', 'C', 'D'];

  quizData.forEach(q => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard_${q.id}`;

    let optsHtml = '';
    q.options.forEach((opt, idx) => {
      optsHtml += `
        <button class="quiz-opt-btn" data-qid="${q.id}" data-idx="${idx}">
          <span class="quiz-opt-letter">${letters[idx]}</span>
          <span class="quiz-opt-text">${opt.text}</span>
        </button>
      `;
    });

    card.innerHTML = `
      <div class="quiz-card-header">
        <span class="quiz-num">CÂU ${q.id}</span>
        <span class="quiz-title">${q.title}</span>
        <span class="quiz-pts">+${q.pts} XP</span>
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options-grid">${optsHtml}</div>
      <div class="explanation-box" id="expl_${q.id}">
        <strong>💡 Lời giải chi tiết:</strong><br>
        <div style="margin-top: 6px; line-height: 1.6;">${q.explanation}</div>
      </div>
    `;

    container.appendChild(card);
  });

  container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const qid = parseInt(this.dataset.qid, 10);
      const idx = parseInt(this.dataset.idx, 10);
      handleQuizAnswer(qid, idx, this);
    });
  });

  renderMathInTree(container);
}

function handleQuizAnswer(qid, chosenIdx, btnEl) {
  if (appState.answered[qid]) return;
  appState.answered[qid] = true;

  const q = quizData.find(item => item.id === qid);
  if (!q) return;

  const card = document.getElementById(`quizCard_${qid}`);
  const allBtns = card.querySelectorAll('.quiz-opt-btn');
  allBtns.forEach(b => b.classList.add('disabled'));

  const isCorrect = q.options[chosenIdx].correct;

  if (isCorrect) {
    btnEl.classList.add('correct');
    appState.xp += q.pts;
    appState.streak += 1;
    sfx.playCorrect();
  } else {
    btnEl.classList.add('wrong');
    appState.streak = 0;
    sfx.playWrong();
    q.options.forEach((opt, idx) => {
      if (opt.correct) allBtns[idx].classList.add('correct');
    });
  }

  const expl = document.getElementById(`expl_${qid}`);
  if (expl) {
    expl.classList.add('show');
    renderMathInTree(expl);
  }

  if (appState.xp >= 160) unlockBadge(4);

  const correctCount = quizData.filter(item => {
    const cardEl = document.getElementById(`quizCard_${item.id}`);
    const correctBtn = cardEl ? cardEl.querySelector('.quiz-opt-btn.correct') : null;
    return correctBtn && !correctBtn.classList.contains('wrong');
  }).length;

  if (correctCount === 10) {
    unlockBadge(5);
    sfx.playFanfare();
  }

  updateHUD();
}

function unlockBadge(badgeNum) {
  const badgeIdx = badgeNum - 1;
  if (appState.badges[badgeIdx]) return;
  appState.badges[badgeIdx] = true;

  const badgeEl = document.getElementById(`badge-${badgeNum}`);
  if (badgeEl) {
    badgeEl.classList.remove('locked');
    badgeEl.classList.add('unlocked');
  }
}

// === 5. INTERACTIVE LAB 1: CONIC CURVES VISUALIZER ===
function initLab1() {
  const canvas = document.getElementById('conicCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const btnE = document.getElementById('btnSelectEllipse');
  const btnH = document.getElementById('btnSelectHyperbola');
  const btnP = document.getElementById('btnSelectParabola');

  const gA = document.getElementById('groupParamA');
  const gB = document.getElementById('groupParamB');
  const gP = document.getElementById('groupParamP');

  const sA = document.getElementById('sliderA');
  const sB = document.getElementById('sliderB');
  const sP = document.getElementById('sliderP');

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 22;

    ctx.clearRect(0, 0, w, h);

    // Grid & Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = cx % scale; x < w; x += scale) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = cy % scale; y < h; y += scale) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(w, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, h); ctx.stroke();

    const a = parseFloat(sA.value);
    const b = parseFloat(sB.value);
    const p = parseFloat(sP.value);

    document.getElementById('valA').textContent = a;
    document.getElementById('valB').textContent = b;
    document.getElementById('valP').textContent = p;

    if (appState.conicMode === 'ellipse') {
      // a > b
      let effA = a;
      let effB = b;
      if (effB >= effA) effB = effA - 0.5;

      const c = Math.sqrt(effA * effA - effB * effB);
      const e = c / effA;

      // Draw Ellipse
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, effA * scale, effB * scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      // Foci F1, F2
      const f1x = cx - c * scale;
      const f2x = cx + c * scale;
      drawFocus(ctx, f1x, cy, 'F₁(-c; 0)');
      drawFocus(ctx, f2x, cy, 'F₂(c; 0)');

      // Readouts
      document.getElementById('readoutConicEq').textContent = `x²/${(effA * effA).toFixed(0)} + y²/${(effB * effB).toFixed(0)} = 1`;
      document.getElementById('readoutFoci').textContent = `F₁(-${c.toFixed(2)}; 0) và F₂(${c.toFixed(2)}; 0)`;
      document.getElementById('readoutFocalDist').textContent = `2c = ${(2 * c).toFixed(2)}`;
      document.getElementById('readoutEcc').textContent = `e = ${e.toFixed(2)} < 1 (Elip)`;
    } else if (appState.conicMode === 'hyperbola') {
      const c = Math.sqrt(a * a + b * b);
      const e = c / a;

      // Draw Hyperbola branches: x = a*cosh(t), y = b*sinh(t)
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;

      // Right branch
      ctx.beginPath();
      for (let t = -2.2; t <= 2.2; t += 0.05) {
        const hx = a * Math.cosh(t);
        const hy = b * Math.sinh(t);
        const px = cx + hx * scale;
        const py = cy - hy * scale;
        if (t === -2.2) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Left branch
      ctx.beginPath();
      for (let t = -2.2; t <= 2.2; t += 0.05) {
        const hx = -a * Math.cosh(t);
        const hy = b * Math.sinh(t);
        const px = cx + hx * scale;
        const py = cy - hy * scale;
        if (t === -2.2) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Asymptotes: y = +/- (b/a)*x
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(0, cy + (b / a) * cx);
      ctx.lineTo(w, cy - (b / a) * (w - cx));
      ctx.moveTo(0, cy - (b / a) * cx);
      ctx.lineTo(w, cy + (b / a) * (w - cx));
      ctx.stroke();
      ctx.setLineDash([]);

      // Foci
      drawFocus(ctx, cx - c * scale, cy, 'F₁(-c; 0)');
      drawFocus(ctx, cx + c * scale, cy, 'F₂(c; 0)');

      // Readouts
      document.getElementById('readoutConicEq').textContent = `x²/${(a * a).toFixed(0)} - y²/${(b * b).toFixed(0)} = 1`;
      document.getElementById('readoutFoci').textContent = `F₁(-${c.toFixed(2)}; 0) và F₂(${c.toFixed(2)}; 0)`;
      document.getElementById('readoutFocalDist').textContent = `2c = ${(2 * c).toFixed(2)}`;
      document.getElementById('readoutEcc').textContent = `e = ${e.toFixed(2)} > 1 (Hypebol)`;
    } else if (appState.conicMode === 'parabola') {
      // Parabola: y^2 = 2px => x = y^2 / (2p)
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let yVal = -7; yVal <= 7; yVal += 0.1) {
        const xVal = (yVal * yVal) / (2 * p);
        const px = cx + xVal * scale;
        const py = cy - yVal * scale;
        if (yVal === -7) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Focus F(p/2; 0)
      const fx = cx + (p / 2) * scale;
      drawFocus(ctx, fx, cy, `F(${p / 2}; 0)`);

      // Directrix Delta: x = -p/2
      const dx = cx - (p / 2) * scale;
      ctx.strokeStyle = '#fb7185';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(dx, 0);
      ctx.lineTo(dx, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#fb7185';
      ctx.fillText(`Δ: x = -${p / 2}`, dx + 6, 20);

      document.getElementById('readoutConicEq').textContent = `y² = ${(2 * p).toFixed(0)}x`;
      document.getElementById('readoutFoci').textContent = `F(${(p / 2).toFixed(1)}; 0), Đỉnh O(0; 0)`;
      document.getElementById('readoutFocalDist').textContent = `Tham số tiêu p = ${p.toFixed(1)}`;
      document.getElementById('readoutEcc').textContent = `e = 1 (Parabol)`;
    }

    unlockBadge(1);
    unlockBadge(2);
  }

  function drawFocus(context, x, y, label) {
    context.fillStyle = '#fb7185';
    context.beginPath();
    context.arc(x, y, 5, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#fff';
    context.font = 'bold 11px Segoe UI, sans-serif';
    context.fillText(label, x - 15, y - 8);
  }

  btnE.addEventListener('click', () => {
    appState.conicMode = 'ellipse';
    btnE.style.background = 'rgba(99, 102, 241, 0.3)'; btnE.style.borderColor = 'var(--indigo-light)';
    btnH.style.background = 'transparent'; btnH.style.borderColor = 'var(--border-color)';
    btnP.style.background = 'transparent'; btnP.style.borderColor = 'var(--border-color)';
    gA.style.display = 'flex'; gB.style.display = 'flex'; gP.style.display = 'none';
    draw();
  });

  btnH.addEventListener('click', () => {
    appState.conicMode = 'hyperbola';
    btnH.style.background = 'rgba(99, 102, 241, 0.3)'; btnH.style.borderColor = 'var(--indigo-light)';
    btnE.style.background = 'transparent'; btnE.style.borderColor = 'var(--border-color)';
    btnP.style.background = 'transparent'; btnP.style.borderColor = 'var(--border-color)';
    gA.style.display = 'flex'; gB.style.display = 'flex'; gP.style.display = 'none';
    draw();
  });

  btnP.addEventListener('click', () => {
    appState.conicMode = 'parabola';
    btnP.style.background = 'rgba(99, 102, 241, 0.3)'; btnP.style.borderColor = 'var(--indigo-light)';
    btnE.style.background = 'transparent'; btnE.style.borderColor = 'var(--border-color)';
    btnH.style.background = 'transparent'; btnH.style.borderColor = 'var(--border-color)';
    gA.style.display = 'none'; gB.style.display = 'none'; gP.style.display = 'flex';
    draw();
  });

  [sA, sB, sP].forEach(s => s.addEventListener('input', draw));
  draw();
}

// === 6. INTERACTIVE LAB 2: CONIC OPTICAL REFLECTION ===
function initLab2() {
  const canvas = document.getElementById('opticCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const btnOptE = document.getElementById('btnOpticEllipse');
  const btnOptP = document.getElementById('btnOpticParabola');
  const sAngle = document.getElementById('sliderRayAngle');

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 24;

    ctx.clearRect(0, 0, w, h);

    const deg = parseFloat(sAngle.value);
    document.getElementById('valRayAngle').textContent = `${deg}°`;
    const rad = (deg * Math.PI) / 180;

    if (appState.opticMode === 'ellipse') {
      const a = 5.5, b = 3.5;
      const c = Math.sqrt(a * a - b * b);

      // Draw Ellipse
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(cx, cy, a * scale, b * scale, 0, 0, Math.PI * 2);
      ctx.stroke();

      const f1x = cx - c * scale;
      const f2x = cx + c * scale;

      // Draw Foci
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(f1x, cy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('F₁ (Phát tia)', f1x - 20, cy + 18);

      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(f2x, cy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('F₂ (Sỏi thận)', f2x - 20, cy + 18);

      // Find intersection M(x, y) on upper ellipse from F1 with angle rad
      // Ray: x = -c + t*cos(rad), y = t*sin(rad)
      // ( (-c + t*cos)^2 / a^2 ) + ( t*sin )^2 / b^2 = 1
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);

      const A = (cosR * cosR) / (a * a) + (sinR * sinR) / (b * b);
      const B = (-2 * c * cosR) / (a * a);
      const C = (c * c) / (a * a) - 1;
      const delta = B * B - 4 * A * C;

      let tHit = 0;
      if (delta >= 0) {
        tHit = (-B + Math.sqrt(delta)) / (2 * A);
      }
      const mx = -c + tHit * cosR;
      const my = tHit * sinR;

      const canMx = cx + mx * scale;
      const canMy = cy - my * scale;

      // Incident ray: F1 -> M
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(f1x, cy);
      ctx.lineTo(canMx, canMy);
      ctx.stroke();

      // Reflected ray: M -> F2
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(canMx, canMy);
      ctx.lineTo(f2x, cy);
      ctx.stroke();

      // Hit point
      ctx.fillStyle = '#fb7185';
      ctx.beginPath(); ctx.arc(canMx, canMy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(`M(${mx.toFixed(1)}; ${my.toFixed(1)})`, canMx + 8, canMy - 8);

      document.getElementById('readoutRaySource').textContent = `Tiêu điểm F₁(-${c.toFixed(2)}; 0)`;
      document.getElementById('readoutReflectPoint').textContent = `M(${mx.toFixed(2)}; ${my.toFixed(2)})`;
      document.getElementById('readoutRayTarget').textContent = `Hội tụ chính xác tại F₂(${c.toFixed(2)}; 0)`;
    } else {
      // Parabola: y^2 = 2px, p = 3 => y^2 = 6x
      const p = 3;
      const fx = cx - 40; // vertex at cx - 40 - (p/2)*scale

      const vx = cx - 100;
      const vy = cy;

      // Draw Parabola: x - vx = y^2 / (2p)
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.6)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let yVal = -6; yVal <= 6; yVal += 0.1) {
        const xVal = (yVal * yVal) / (2 * p);
        const px = vx + xVal * scale;
        const py = vy - yVal * scale;
        if (yVal === -6) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      const canFx = vx + (p / 2) * scale;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(canFx, vy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText('F (Đèn pha)', canFx - 15, vy + 18);

      // Ray from F with angle rad: x = p/2 + t*cos, y = t*sin
      const cosR = Math.cos(rad);
      const sinR = Math.sin(rad);

      // y^2 = 2p*x => (t*sin)^2 = 2p*(p/2 + t*cos) = p^2 + 2p*t*cos
      // (sin^2)*t^2 - 2p*cos*t - p^2 = 0
      const A = sinR * sinR;
      const B = -2 * p * cosR;
      const C = -p * p;
      let tHit = 0;
      if (Math.abs(A) > 1e-4) {
        const delta = B * B - 4 * A * C;
        tHit = (-B + Math.sqrt(delta)) / (2 * A);
      } else {
        tHit = -C / B;
      }

      const mx = p / 2 + tHit * cosR;
      const my = tHit * sinR;

      const canMx = vx + mx * scale;
      const canMy = vy - my * scale;

      // Incident ray: F -> M
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(canFx, vy);
      ctx.lineTo(canMx, canMy);
      ctx.stroke();

      // Reflected ray: M -> parallel to axis Ox (going right)
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(canMx, canMy);
      ctx.lineTo(w - 20, canMy);
      ctx.stroke();

      ctx.fillStyle = '#fb7185';
      ctx.beginPath(); ctx.arc(canMx, canMy, 5, 0, Math.PI * 2); ctx.fill();

      document.getElementById('readoutRaySource').textContent = `Tiêu điểm đèn pha F(${p / 2}; 0)`;
      document.getElementById('readoutReflectPoint').textContent = `M(${mx.toFixed(2)}; ${my.toFixed(2)})`;
      document.getElementById('readoutRayTarget').textContent = `Tia phản xạ song song trục đối xứng Ox ➡️`;
    }

    unlockBadge(3);
  }

  btnOptE.addEventListener('click', () => {
    appState.opticMode = 'ellipse';
    btnOptE.style.background = 'rgba(99, 102, 241, 0.3)'; btnOptE.style.borderColor = 'var(--indigo-light)';
    btnOptP.style.background = 'transparent'; btnOptP.style.borderColor = 'var(--border-color)';
    draw();
  });

  btnOptP.addEventListener('click', () => {
    appState.opticMode = 'parabola';
    btnOptP.style.background = 'rgba(99, 102, 241, 0.3)'; btnOptP.style.borderColor = 'var(--indigo-light)';
    btnOptE.style.background = 'transparent'; btnOptE.style.borderColor = 'var(--border-color)';
    draw();
  });

  sAngle.addEventListener('input', draw);
  draw();
}

// === 7. INITIALIZATION & EVENTS ===
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `tab-${tab.dataset.tab}`;
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
        renderMathInTree(targetContent);
      }
      sfx.playTone(520, 'sine', 0.08, 0.05);
    });
  });

  const soundToggle = document.getElementById('soundToggle');
  soundToggle.addEventListener('click', () => {
    appState.sound = !appState.sound;
    sfx.enabled = appState.sound;
    soundToggle.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
  });

  const resetBtn = document.getElementById('resetProgress');
  resetBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ điểm và huy hiệu không?')) {
      appState.xp = 0;
      appState.streak = 0;
      appState.answered = {};
      appState.badges = [false, false, false, false, false];
      document.querySelectorAll('.badge-item').forEach(b => {
        b.classList.remove('unlocked');
        b.classList.add('locked');
      });
      renderQuiz();
      updateHUD();
    }
  });

  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const avatarChoices = document.querySelectorAll('.avatar-choice');

  avatarBtn.addEventListener('click', () => {
    avatarModal.style.display = 'flex';
    avatarModal.classList.add('active');
  });

  avatarChoices.forEach(choice => {
    choice.addEventListener('click', () => {
      avatarChoices.forEach(c => c.classList.remove('selected'));
      choice.classList.add('selected');
      appState.avatar = choice.dataset.avatar;
      appState.userTitle = choice.dataset.title;
      sfx.playTone(660, 'sine', 0.1, 0.1);
    });
  });

  btnCloseModal.addEventListener('click', () => {
    avatarModal.style.display = 'none';
    avatarModal.classList.remove('active');
    updateHUD();
  });

  const btnPrintCert = document.getElementById('btnPrintCert');
  if (btnPrintCert) {
    btnPrintCert.addEventListener('click', () => {
      window.print();
    });
  }

  renderQuiz();
  updateHUD();
  initLab1();
  initLab2();

  renderMathInTree(document.body);
});
