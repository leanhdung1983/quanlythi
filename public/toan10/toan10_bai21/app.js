/* ================================================================
   BÀI 21: ĐƯỜNG TRÒN TRONG MẶT PHẲNG TOẠ ĐỘ - TOÁN 10 TẬP 2 (KNTT)
   Logic: Web Audio API, Canvas Labs, Đấu Trường SGK 10 Câu Hỏi.
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
  ["\\cos", "<mi class=\"m-fn\">cos</mi>"],
  ["\\sin", "<mi class=\"m-fn\">sin</mi>"],
  ["\\tan", "<mi class=\"m-fn\">tan</mi>"],
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
  userTitle: 'Chuyên Gia Đường Tròn & Tiếp Tuyến',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// === 3. SGK ARENA QUIZ DATA (10 QUESTIONS) ===
const quizData = [
  {
    id: 1,
    title: "Bài tập 7.13 (SGK tr.46) - Tìm tâm và bán kính đường tròn",
    pts: 20,
    question: "Tâm $I$ và bán kính $R$ của đường tròn $(x + 3)^2 + (y - 3)^2 = 36$ là:",
    options: [
      { text: "$I(-3; 3)$ và $R = 6$", correct: true },
      { text: "$I(3; -3)$ và $R = 6$", correct: false },
      { text: "$I(-3; 3)$ và $R = 36$", correct: false },
      { text: "$I(3; 3)$ và $R = 6$", correct: false }
    ],
    explanation: "Phương trình chính tắc của đường tròn có dạng $(x - a)^2 + (y - b)^2 = R^2$.\nỞ đây $(x - (-3))^2 + (y - 3)^2 = 6^2$, suy ra tâm $I(a; b) = (-3; 3)$ và bán kính $R = \\sqrt{36} = 6$."
  },
  {
    id: 2,
    title: "Bài tập 7.14a (SGK tr.47) - Nhận dạng phương trình chứa tích xy",
    pts: 20,
    question: "Phương trình $x^2 + y^2 + xy + 4x - 2 = 0$ có phải là phương trình của một đường tròn không?",
    options: [
      { text: "Không phải, vì xuất hiện số hạng tích $xy$", correct: true },
      { text: "Có, với tâm $I(-2; 0)$", correct: false },
      { text: "Có, với bán kính $R = \\sqrt{6}$", correct: false },
      { text: "Không phải, vì $a^2 + b^2 - c < 0$", correct: false }
    ],
    explanation: "Trong mặt phẳng toạ độ $Oxy$, phương trình đường tròn có dạng $x^2 + y^2 - 2ax - 2by + c = 0$, trong đó hệ số của $x^2$ và $y^2$ bằng nhau và tuyệt đối không chứa số hạng tích $xy$. Do đó phương trình đã cho không phải là phương trình đường tròn."
  },
  {
    id: 3,
    title: "Bài tập 7.14b (SGK tr.47) - Kiểm tra điều kiện tồn tại a² + b² - c",
    pts: 20,
    question: "Xét phương trình $x^2 + y^2 - 2x - 4y + 5 = 0$. Kết luận nào sau đây đúng?",
    options: [
      { text: "Không phải đường tròn vì $a^2 + b^2 - c = 0$ (chỉ là điểm $I(1; 2)$)", correct: true },
      { text: "Là đường tròn tâm $I(1; 2)$ bán kính $R = 1$", correct: false },
      { text: "Là đường tròn tâm $I(-1; -2)$ bán kính $R = \\sqrt{5}$", correct: false },
      { text: "Là đường tròn tâm $I(1; 2)$ bán kính $R = 5$", correct: false }
    ],
    explanation: "Ta có: $-2a = -2 \\implies a = 1$; $-2b = -4 \\implies b = 2$; $c = 5$.\nXét biểu thức: $a^2 + b^2 - c = 1^2 + 2^2 - 5 = 1 + 4 - 5 = 0$.\nVì $a^2 + b^2 - c = 0 \\ngtr 0$ nên phương trình chỉ biểu diễn một điểm duy nhất $I(1; 2)$, không phải là phương trình đường tròn."
  },
  {
    id: 4,
    title: "Bài tập 7.14c (SGK tr.47) - Tính bán kính từ phương trình khai triển",
    pts: 20,
    question: "Bán kính của đường tròn $x^2 + y^2 + 6x - 8y + 1 = 0$ bằng:",
    options: [
      { text: "$2\\sqrt{6}$", correct: true },
      { text: "$24$", correct: false },
      { text: "$5$", correct: false },
      { text: "$\\sqrt{26}$", correct: false }
    ],
    explanation: "Ta có: $a = -3, b = 4, c = 1$.\nKiểm tra: $a^2 + b^2 - c = (-3)^2 + 4^2 - 1 = 9 + 16 - 1 = 24 > 0$.\nVậy phương trình biểu diễn đường tròn tâm $I(-3; 4)$ và bán kính $R = \\sqrt{24} = 2\\sqrt{6}$."
  },
  {
    id: 5,
    title: "Bài tập 7.15a (SGK tr.47) - Lập PT đường tròn biết tâm và bán kính",
    pts: 20,
    question: "Phương trình đường tròn có tâm $I(-2; 5)$ và bán kính $R = 7$ là:",
    options: [
      { text: "$(x + 2)^2 + (y - 5)^2 = 49$", correct: true },
      { text: "$(x - 2)^2 + (y + 5)^2 = 49$", correct: false },
      { text: "$(x + 2)^2 + (y - 5)^2 = 7$", correct: false },
      { text: "$(x - 2)^2 + (y + 5)^2 = 7$", correct: false }
    ],
    explanation: "Áp dụng công thức chính tắc với $a = -2, b = 5, R = 7$:\n$$(x - (-2))^2 + (y - 5)^2 = 7^2 \\iff (x + 2)^2 + (y - 5)^2 = 49$$"
  },
  {
    id: 6,
    title: "Bài tập 7.15b (SGK tr.47) - Đường tròn biết tâm và đi qua một điểm",
    pts: 20,
    question: "Phương trình đường tròn có tâm $I(1; -2)$ và đi qua điểm $A(-2; 2)$ là:",
    options: [
      { text: "$(x - 1)^2 + (y + 2)^2 = 25$", correct: true },
      { text: "$(x + 1)^2 + (y - 2)^2 = 25$", correct: false },
      { text: "$(x - 1)^2 + (y + 2)^2 = 5$", correct: false },
      { text: "$(x + 2)^2 + (y - 2)^2 = 25$", correct: false }
    ],
    explanation: "Bán kính $R = IA = \\sqrt{(-2 - 1)^2 + (2 - (-2))^2} = \\sqrt{(-3)^2 + 4^2} = \\sqrt{9 + 16} = 5$.\nPhương trình đường tròn: $(x - 1)^2 + (y + 2)^2 = 5^2 = 25$."
  },
  {
    id: 7,
    title: "Bài tập 7.15c (SGK tr.47) - Đường tròn có đường kính AB",
    pts: 20,
    question: "Phương trình đường tròn có đường kính $AB$ với $A(-1; -3)$ và $B(-3; 5)$ là:",
    options: [
      { text: "$(x + 2)^2 + (y - 1)^2 = 17$", correct: true },
      { text: "$(x - 2)^2 + (y + 1)^2 = 17$", correct: false },
      { text: "$(x + 2)^2 + (y - 1)^2 = 68$", correct: false },
      { text: "$(x + 1)^2 + (y + 3)^2 = 17$", correct: false }
    ],
    explanation: "Tâm $I$ là trung điểm của $AB$:\n$$I = \\left(\\dfrac{-1 - 3}{2}; \\dfrac{-3 + 5}{2}\\right) = (-2; 1)$$\nBán kính $R = \\dfrac{AB}{2} = \\dfrac{\\sqrt{(-3 - (-1))^2 + (5 - (-3))^2}}{2} = \\dfrac{\\sqrt{(-2)^2 + 8^2}}{2} = \\dfrac{\\sqrt{68}}{2} = \\sqrt{17}$.\nPhương trình đường tròn: $(x + 2)^2 + (y - 1)^2 = 17$."
  },
  {
    id: 8,
    title: "Bài tập 7.15d (SGK tr.47) - Đường tròn tiếp xúc với đường thẳng",
    pts: 20,
    question: "Phương trình đường tròn có tâm $I(1; 3)$ và tiếp xúc với đường thẳng $\\Delta: x + 2y + 3 = 0$ là:",
    options: [
      { text: "$(x - 1)^2 + (y - 3)^2 = 20$", correct: true },
      { text: "$(x - 1)^2 + (y - 3)^2 = 10$", correct: false },
      { text: "$(x + 1)^2 + (y + 3)^2 = 20$", correct: false },
      { text: "$(x - 1)^2 + (y - 3)^2 = 2\\sqrt{5}$", correct: false }
    ],
    explanation: "Đường tròn tiếp xúc với $\\Delta$ nên bán kính $R = d(I, \\Delta)$:\n$$R = \\dfrac{|1(1) + 2(3) + 3|}{\\sqrt{1^2 + 2^2}} = \\dfrac{|10|}{\\sqrt{5}} = 2\\sqrt{5} \\implies R^2 = 20$$\nPhương trình đường tròn: $(x - 1)^2 + (y - 3)^2 = 20$."
  },
  {
    id: 9,
    title: "Bài tập 7.17 (SGK tr.47) - Phương trình tiếp tuyến tại một điểm",
    pts: 20,
    question: "Phương trình tiếp tuyến của đường tròn $(C): x^2 + y^2 + 2x - 4y + 4 = 0$ tại điểm $M(0; 2)$ là:",
    options: [
      { text: "$x = 0$ (trục tung)", correct: true },
      { text: "$y = 2$", correct: false },
      { text: "$x + y - 2 = 0$", correct: false },
      { text: "$2x - y + 2 = 0$", correct: false }
    ],
    explanation: "Đường tròn $(C)$ có tâm $I(-1; 2)$.\nĐiểm $M(0; 2)$ thuộc $(C)$ vì $0^2 + 2^2 + 2(0) - 4(2) + 4 = 0$.\nTiếp tuyến tại $M$ nhận $\\overrightarrow{MI} = (-1 - 0; 2 - 2) = (-1; 0)$ làm VTPT.\nPhương trình tiếp tuyến qua $M(0; 2)$:\n$$-1(x - 0) + 0(y - 2) = 0 \\iff -x = 0 \\iff x = 0$$"
  },
  {
    id: 10,
    title: "Bài tập 7.18 (SGK tr.47) - Quỹ đạo chuyển động hình tròn",
    pts: 20,
    question: "Một vật thể chuyển động có toạ độ tại thời điểm $t$ là $(2 + \\sin t^\\circ; 4 + \\cos t^\\circ)$. Quỹ đạo chuyển động của vật là:",
    options: [
      { text: "Đường tròn tâm $I(2; 4)$, bán kính $R = 1$", correct: true },
      { text: "Đường elip có trục lớn bằng $4$", correct: false },
      { text: "Đoạn thẳng nối điểm $(2; 4)$ và $(3; 5)$", correct: false },
      { text: "Đường tròn tâm $I(-2; -4)$, bán kính $R = 1$", correct: false }
    ],
    explanation: "Ta có: $x = 2 + \\sin t^\\circ \\implies x - 2 = \\sin t^\\circ$ và $y = 4 + \\cos t^\\circ \\implies y - 4 = \\cos t^\\circ$.\nÁp dụng hệ thức lượng giác cơ bản $\\sin^2 t^\\circ + \\cos^2 t^\\circ = 1$:\n$$(x - 2)^2 + (y - 4)^2 = 1$$\nĐây là phương trình của đường tròn có tâm $I(2; 4)$ và bán kính $R = 1$."
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

// === 5. INTERACTIVE LAB 1: CIRCLE EXPLORER ===
function initLab1() {
  const canvas = document.getElementById('circleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sA = document.getElementById('sliderA');
  const sB = document.getElementById('sliderB');
  const sR = document.getElementById('sliderR');

  function draw() {
    const a = parseFloat(sA.value);
    const b = parseFloat(sB.value);
    const r = parseFloat(sR.value);

    document.getElementById('valA').textContent = a;
    document.getElementById('valB').textContent = b;
    document.getElementById('valR').textContent = r;

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 24;

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

    const canIx = cx + a * scale;
    const canIy = cy - b * scale;
    const canR = r * scale;

    // Draw Circle
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(canIx, canIy, canR, 0, Math.PI * 2);
    ctx.stroke();

    // Circle fill effect
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.fill();

    // Draw Center I
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(canIx, canIy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.fillText(`I(${a}; ${b})`, canIx + 8, canIy - 8);

    // Draw Radius Segment
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 2]);
    ctx.beginPath();
    ctx.moveTo(canIx, canIy);
    ctx.lineTo(canIx + canR, canIy);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#34d399';
    ctx.fillText(`R = ${r}`, canIx + canR / 2 - 10, canIy - 6);

    // Update Readouts
    const aStr = a >= 0 ? `(x - ${a})²` : `(x + ${Math.abs(a)})²`;
    const bStr = b >= 0 ? `(y - ${b})²` : `(y + ${Math.abs(b)})²`;
    const r2 = (r * r).toFixed(1).replace('.0', '');
    document.getElementById('readoutStdEq').textContent = `${aStr} + ${bStr} = ${r2}`;

    const coeffA = (-2 * a);
    const coeffB = (-2 * b);
    const valC = (a * a + b * b - r * r);

    let expStr = 'x² + y² ';
    if (coeffA > 0) expStr += `+ ${coeffA}x `;
    else if (coeffA < 0) expStr += `- ${Math.abs(coeffA)}x `;

    if (coeffB > 0) expStr += `+ ${coeffB}y `;
    else if (coeffB < 0) expStr += `- ${Math.abs(coeffB)}y `;

    if (valC > 0) expStr += `+ ${valC.toFixed(1).replace('.0', '')} = 0`;
    else if (valC < 0) expStr += `- ${Math.abs(valC).toFixed(1).replace('.0', '')} = 0`;
    else expStr += `= 0`;

    document.getElementById('readoutExpEq').textContent = expStr;
    document.getElementById('readoutValC').textContent = `c = ${valC.toFixed(1).replace('.0', '')} (a² + b² - R²)`;
    document.getElementById('readoutCheck').textContent = `${(a * a).toFixed(1)} + ${(b * b).toFixed(1)} - (${valC.toFixed(1)}) = ${r2} > 0 (Hợp lệ)`;

    unlockBadge(1);
    unlockBadge(2);
  }

  [sA, sB, sR].forEach(s => s.addEventListener('input', draw));
  draw();
}

// === 6. INTERACTIVE LAB 2: TANGENT SIMULATOR ===
function initLab2() {
  const canvas = document.getElementById('tangentCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sAlpha = document.getElementById('sliderAlpha');
  const btnAutoSpin = document.getElementById('btnAutoSpin');
  let isSpinning = false;
  let animId = null;

  // Fixed circle: Center I(0, 0), Radius R = 3
  const a = 0, b = 0, r = 3;

  function draw() {
    const alphaDeg = parseFloat(sAlpha.value);
    document.getElementById('valAlpha').textContent = `${alphaDeg}°`;

    const alphaRad = (alphaDeg * Math.PI) / 180;
    const mx = a + r * Math.cos(alphaRad);
    const my = b + r * Math.sin(alphaRad);

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2;
    const scale = 28;

    ctx.clearRect(0, 0, w, h);

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
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

    const canIx = cx + a * scale;
    const canIy = cy - b * scale;
    const canR = r * scale;

    // Circle
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(canIx, canIy, canR, 0, Math.PI * 2);
    ctx.stroke();

    // Center I
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(canIx, canIy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px Segoe UI, sans-serif';
    ctx.fillText('I(0; 0)', canIx - 20, canIy + 18);

    // Contact point M
    const canMx = cx + mx * scale;
    const canMy = cy - my * scale;

    // Radius segment IM
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canIx, canIy);
    ctx.lineTo(canMx, canMy);
    ctx.stroke();

    // Point M
    ctx.fillStyle = '#fb7185';
    ctx.beginPath();
    ctx.arc(canMx, canMy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('M', canMx + 8, canMy - 8);

    // Tangent line at M: equation (mx - a)(x - mx) + (my - b)(y - my) = 0
    // Direction perpendicular to IM: (-sin, cos)
    const tanLen = 160;
    const uX = -Math.sin(alphaRad);
    const uY = Math.cos(alphaRad);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(canMx - uX * tanLen, canMy + uY * tanLen);
    ctx.lineTo(canMx + uX * tanLen, canMy - uY * tanLen);
    ctx.stroke();

    // Right angle symbol
    const raSize = 10;
    const nX = Math.cos(alphaRad);
    const nY = -Math.sin(alphaRad);
    const p1X = canMx - nX * raSize;
    const p1Y = canMy - nY * raSize;
    const p2X = p1X + uX * raSize;
    const p2Y = p1Y - uY * raSize;
    const p3X = canMx + uX * raSize;
    const p3Y = canMy - uY * raSize;

    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p1X, p1Y);
    ctx.lineTo(p2X, p2Y);
    ctx.lineTo(p3X, p3Y);
    ctx.stroke();

    // Update Readouts
    document.getElementById('readoutPointM').textContent = `M(${mx.toFixed(2)}; ${my.toFixed(2)})`;
    document.getElementById('readoutMI').textContent = `MI = (${(a - mx).toFixed(2)}; ${(b - my).toFixed(2)})`;

    // Tangent Eq: mx * x + my * y - R^2 = 0
    document.getElementById('readoutTanEq').textContent = `${mx.toFixed(2)}x + ${my.toFixed(2)}y - 9 = 0`;

    unlockBadge(3);
  }

  sAlpha.addEventListener('input', () => {
    if (isSpinning) stopSpin();
    draw();
  });

  function stopSpin() {
    isSpinning = false;
    cancelAnimationFrame(animId);
    btnAutoSpin.textContent = '🔄 Tự Động Xoay';
  }

  btnAutoSpin.addEventListener('click', () => {
    if (isSpinning) {
      stopSpin();
    } else {
      isSpinning = true;
      btnAutoSpin.textContent = '⏸️ Tạm Dừng Xoay';
      function step() {
        let cur = (parseFloat(sAlpha.value) + 1) % 360;
        sAlpha.value = cur;
        draw();
        animId = requestAnimationFrame(step);
      }
      animId = requestAnimationFrame(step);
    }
  });

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
