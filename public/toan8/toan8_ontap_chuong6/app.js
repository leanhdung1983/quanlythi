// ================================================================
// ÔN TẬP CHƯƠNG VI: PHÂN THỨC ĐẠI SỐ - TOÁN 8 KNTT
// Pure Vanilla JS - Web Audio API - Canvas 2D - KaTeX / MathML Fallback
// ================================================================

// --- 0. BỘ PARSER CÔNG THỨC TOÁN LATEX SANG NATIVE MATHML (OFFLINE FALLBACK) ---
const mathSymbols = [
  ["\\mathbb{R}", "<mi class=\"m-bb\">&#8477;</mi>"],
  ["\\mathbb{N}", "<mi class=\"m-bb\">&#8469;</mi>"],
  ["\\mathbb{Z}", "<mi class=\"m-bb\">&#8484;</mi>"],
  ["\\mathbb{Q}", "<mi class=\"m-bb\">&#8474;</mi>"],
  ["\\Leftrightarrow", "<mo>&#8660;</mo>"],
  ["\\Rightarrow", "<mo>&#8658;</mo>"],
  ["\\Leftarrow", "<mo>&#8656;</mo>"],
  ["\\approx", "<mo>&#8776;</mo>"],
  ["\\forall", "<mo>&#8704;</mo>"],
  ["\\exists", "<mo>&#8707;</mo>"],
  ["\\infty", "<mo>&#8734;</mo>"],
  ["\\pm", "<mo>&#177;</mo>"],
  ["\\mp", "<mo>&#8723;</mo>"],
  ["\\ge", "<mo>&#8805;</mo>"],
  ["\\le", "<mo>&#8804;</mo>"],
  ["\\geq", "<mo>&#8805;</mo>"],
  ["\\leq", "<mo>&#8804;</mo>"],
  ["\\ne", "<mo>&#8800;</mo>"],
  ["\\neq", "<mo>&#8800;</mo>"],
  ["\\to", "<mo>&#8594;</mo>"],
  ["\\in", "<mo>&#8712;</mo>"],
  ["\\notin", "<mo>&#8713;</mo>"],
  ["\\Delta", "<mi>&#916;</mi>"],
  ["\\delta", "<mi>&#948;</mi>"],
  ["\\alpha", "<mi>&#945;</mi>"],
  ["\\beta", "<mi>&#946;</mi>"],
  ["\\gamma", "<mi>&#947;</mi>"],
  ["\\theta", "<mi>&#952;</mi>"],
  ["\\pi", "<mi>&#960;</mi>"],
  ["\\times", "<mo>&#215;</mo>"],
  ["\\cdot", "<mo>&#8901;</mo>"],
  ["\\setminus", "<mo>&#8726;</mo>"],
  ["\\cup", "<mo>&#8746;</mo>"],
  ["\\cap", "<mo>&#8745;</mo>"]
];

function tokenizePlainMath(raw) {
  if (!raw) return '';
  let out = '';
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < raw.length && /[0-9\.]/.test(raw[i])) { num += raw[i]; i++; }
      out += '<mn>' + num + '</mn>';
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      out += '<mi>' + ch + '</mi>';
      i++;
      continue;
    }
    if (/[\+\-\*/<>()\[\]\{},;:\!\?\|']/.test(ch)) {
      let op = ch;
      if (op === '<') op = '&lt;';
      else if (op === '>') op = '&gt;';
      out += '<mo>' + op + '</mo>';
      i++;
      continue;
    }
    if (/\s/.test(ch)) { out += ' '; i++; continue; }
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

  s = s.replace(/\\text\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mtext>' + c + '</mtext>'));
  s = s.replace(/\\mathbf\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="bold">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\mathrm\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="normal">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\mathit\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="italic">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\widehat\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>^</mo></mover>'));
  s = s.replace(/\\circ/g, savePlaceholder('<mo>&#176;</mo>'));
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\vec\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));

  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
  } while (s !== prevFrac);

  s = s.replace(/\\left\[/g, '[');
  s = s.replace(/\\right\./g, '');
  s = s.replace(/\\left\(/g, '(');
  s = s.replace(/\\right\)/g, ')');
  s = s.replace(/\\left\\\{/g, '{');
  s = s.replace(/\\right\\\}/g, '}');
  s = s.replace(/\\limits/g, '');
  s = s.replace(/\\,/g, ' ');
  s = s.replace(/\\quad/g, '   ');

  for (const [k, v] of mathSymbols) {
    const rx = new RegExp(k.replace(/\\/g, '\\\\') + '(?![a-zA-Z])', 'g');
    if (rx.test(s)) s = s.replace(rx, savePlaceholder(v));
  }

  s = s.replace(/_\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msub><mrow></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msub>'));
  s = s.replace(/\^\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msup><mrow></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msup>'));
  s = s.replace(/_([a-zA-Z0-9])/g, (m, c) => savePlaceholder('<msub><mrow></mrow><mrow>' + tokenizePlainMath(c) + '</mrow></msub>'));
  s = s.replace(/\^([a-zA-Z0-9])/g, (m, c) => savePlaceholder('<msup><mrow></mrow><mrow>' + tokenizePlainMath(c) + '</mrow></msup>'));

  const parts = s.split(/(\uE000\d+\uE001)/g);
  let res = '';
  for (const part of parts) {
    if (part.startsWith('\uE000') && part.endsWith('\uE001')) res += part;
    else res += tokenizePlainMath(part);
  }

  for (let i = placeholders.length - 1; i >= 0; i--) {
    res = res.split('\uE000' + i + '\uE001').join(placeholders[i]);
  }
  return res;
}

function latexToMathML(latex, display = false) {
  const inner = convertLatexToMathMLBody(latex);
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${display ? ' display="block"' : ''} class="${display ? 'math-block' : 'math-inline'}">${inner}</math>`;
}

function formatMathText(str) {
  if (!str) return '';
  str = str.replace(/\$\$([\s\S]*?)\$\$/g, (m, c) => latexToMathML(c, true));
  str = str.replace(/\$([^\$\n]+?)\$/g, (m, c) => latexToMathML(c, false));
  return str;
}

function renderMathInTree(root) {
  if (!root) return;
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      strict: false
    });
  } else {
    // Fallback MathML
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && (n.nodeValue.includes('$') || n.nodeValue.includes('$$'))) {
        nodes.push(n);
      }
    }
    nodes.forEach(node => {
      const span = document.createElement('span');
      span.innerHTML = formatMathText(node.nodeValue);
      if (node.parentNode) node.parentNode.replaceChild(span, node);
    });
  }
}

// --- 1. WEB AUDIO API SYNTHESIZER ---
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.ctx = new AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type = 'sine', duration = 0.15, vol = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
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
  }
  playClick() { this.playTone(600, 'sine', 0.05, 0.08); }
  playCorrect() {
    this.playTone(523.25, 'triangle', 0.1, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.18, 0.12), 80);
  }
  playWrong() {
    this.playTone(280, 'sawtooth', 0.18, 0.1);
    setTimeout(() => this.playTone(220, 'sawtooth', 0.24, 0.1), 120);
  }
  playLevelUp() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'sine', 0.15, 0.12), idx * 90);
    });
  }
  playFanfare() {
    [523, 659, 783, 1046, 783, 1046].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.22, 0.15), idx * 130);
    });
  }
}
const sound = new SoundManager();

// --- 2. GAME STATE & GAMIFICATION ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Phân Thức 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_ontap_chuong6_state';

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {}
}

function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const p = JSON.parse(s);
      Object.assign(appState, p);
    }
  } catch (e) {}
}

function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const userEl = document.getElementById('userNameDisplay');
  const titleEl = document.getElementById('userTitle');
  const avatarEl = document.getElementById('avatarBtn');
  const soundEl = document.getElementById('soundToggle');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (userEl) userEl.textContent = `${appState.userName} 🌟`;
  if (titleEl) titleEl.textContent = appState.userTitle;
  if (avatarEl) avatarEl.textContent = appState.avatar;
  if (soundEl) soundEl.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';

  // Cấp độ sao
  let starStr = '⭐☆☆☆☆';
  if (appState.xp >= 200) starStr = '⭐⭐⭐⭐⭐';
  else if (appState.xp >= 160) starStr = '⭐⭐⭐⭐☆';
  else if (appState.xp >= 100) starStr = '⭐⭐⭐☆☆';
  else if (appState.xp >= 40) starStr = '⭐⭐☆☆☆';
  if (starEl) starEl.textContent = starStr;

  // Cập nhật huy hiệu
  for (let i = 1; i <= 5; i++) {
    const b = document.getElementById(`badge-${i}`);
    if (b) {
      if (appState.badges[i - 1]) b.classList.remove('locked');
      else b.classList.add('locked');
    }
  }

  // Tên trên chứng nhận
  const certName = document.getElementById('certStudentName');
  if (certName) certName.textContent = appState.userName;
}

function unlockBadge(idx) {
  if (!appState.badges[idx]) {
    appState.badges[idx] = true;
    sound.playLevelUp();
    saveState();
    updateHUD();
  }
}

// --- 3. ĐẤU TRƯỜNG SGK QUIZ DATA ---
const quizData = [
  {
    "id": 1,
    "title": "Câu 1: Điều kiện xác định tổng hợp",
    "pts": 20,
    "question": "Điều kiện xác định của biểu thức $A = \\frac{1}{x - 1} + \\frac{2}{x + 1}$ là:",
    "options": [
      {
        "text": "$x \\neq 1$ và $x \\neq -1$",
        "correct": true
      },
      {
        "text": "$x \\neq 1$",
        "correct": false
      },
      {
        "text": "$x \\neq -1$",
        "correct": false
      },
      {
        "text": "$x \\neq 0$",
        "correct": false
      }
    ],
    "explanation": "Cả hai mẫu thức đều phải khác $0$: $x - 1 \\neq 0 \\iff x \\neq 1$ và $x + 1 \\neq 0 \\iff x \\neq -1$."
  },
  {
    "id": 2,
    "title": "Câu 2: Rút gọn biểu thức tổng hợp",
    "pts": 20,
    "question": "Rút gọn biểu thức $P = \\left(\\frac{1}{x - 2} - \\frac{1}{x + 2}\\right) \\cdot \\frac{x^2 - 4}{4}$ (với $x \\neq \\pm 2$):",
    "options": [
      {
        "text": "$1$",
        "correct": true
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{x^2 - 4}$",
        "correct": false
      },
      {
        "text": "$x$",
        "correct": false
      }
    ],
    "explanation": "Trong ngoặc: $\\frac{(x + 2) - (x - 2)}{x^2 - 4} = \\frac{4}{x^2 - 4}$. Nhân tiếp: $\\frac{4}{x^2 - 4} \\cdot \\frac{x^2 - 4}{4} = 1$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính giá trị biểu thức rút gọn",
    "pts": 20,
    "question": "Cho $Q = \\frac{x^2 + 2x + 1}{x^2 - 1}$. Giá trị của $Q$ tại $x = 3$ là:",
    "options": [
      {
        "text": "$2$",
        "correct": true
      },
      {
        "text": "$\\frac{3}{2}$",
        "correct": false
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$\\frac{16}{8}$",
        "correct": false
      }
    ],
    "explanation": "ĐKXĐ: $x \\neq \\pm 1$. Rút gọn $Q = \\frac{(x + 1)^2}{(x - 1)(x + 1)} = \\frac{x + 1}{x - 1}$. Tại $x = 3$: $Q = \\frac{3 + 1}{3 - 1} = \\frac{4}{2} = 2$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tìm x để phân thức nhận giá trị nguyên",
    "pts": 20,
    "question": "Có bao nhiêu giá trị nguyên của $x$ để phân thức $M = \\frac{3}{x - 1}$ nhận giá trị nguyên?",
    "options": [
      {
        "text": "$4$",
        "correct": true
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$6$",
        "correct": false
      }
    ],
    "explanation": "Để $M \\in \\mathbb{Z}$ thì $x - 1$ phải là ước của $3$: $x - 1 \\in \\{\\pm 1, \\pm 3\\} \\implies x \\in \\{2, 0, 4, -2\\}$. Có đúng 4 giá trị nguyên."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhận diện phân thức bằng 1",
    "pts": 20,
    "question": "Biểu thức $\\frac{x^2 - y^2}{(x - y)(x + y)}$ bằng $1$ với điều kiện nào?",
    "options": [
      {
        "text": "$x \\neq y$ và $x \\neq -y$",
        "correct": true
      },
      {
        "text": "Với mọi số thực $x, y$",
        "correct": false
      },
      {
        "text": "$x > y$",
        "correct": false
      },
      {
        "text": "$x \\neq 0$ và $y \\neq 0$",
        "correct": false
      }
    ],
    "explanation": "Vì $x^2 - y^2 = (x - y)(x + y)$, phân thức luôn rút gọn bằng $1$ tại mọi điểm thỏa mãn mẫu khác $0$, tức là $x \\neq y$ và $x \\neq -y$."
  },
  {
    "id": 6,
    "title": "Câu 6: Phân thức nghịch đảo của tổng",
    "pts": 20,
    "question": "Phân thức nghịch đảo của biểu thức $\\frac{1}{x} + \\frac{1}{y}$ (với $x, y, x + y \\neq 0$) là:",
    "options": [
      {
        "text": "$\\frac{xy}{x + y}$",
        "correct": true
      },
      {
        "text": "$x + y$",
        "correct": false
      },
      {
        "text": "$\\frac{x + y}{xy}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{x + y}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{1}{x} + \\frac{1}{y} = \\frac{x + y}{xy}$. Phân thức nghịch đảo của nó là $\\frac{xy}{x + y}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Tìm giá trị biến để phân thức bằng một số",
    "pts": 20,
    "question": "Giá trị của $x$ để phân thức $\\frac{2x - 1}{x + 3} = 1$ là:",
    "options": [
      {
        "text": "$x = 4$",
        "correct": true
      },
      {
        "text": "$x = 2$",
        "correct": false
      },
      {
        "text": "$x = -4$",
        "correct": false
      },
      {
        "text": "$x = 3$",
        "correct": false
      }
    ],
    "explanation": "ĐKXĐ: $x \\neq -3$. Ta có $2x - 1 = x + 3 \\iff 2x - x = 3 + 1 \\iff x = 4$ (thỏa mãn ĐKXĐ)."
  },
  {
    "id": 8,
    "title": "Câu 8: Rút gọn biểu thức lồng nhau",
    "pts": 20,
    "question": "Rút gọn biểu thức $T = \\frac{1}{1 + \\frac{1}{x}}$ (với $x \\neq 0, x \\neq -1$):",
    "options": [
      {
        "text": "$\\frac{x}{x + 1}$",
        "correct": true
      },
      {
        "text": "$\\frac{x + 1}{x}$",
        "correct": false
      },
      {
        "text": "$x$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{x + 1}$",
        "correct": false
      }
    ],
    "explanation": "Mẫu số là $1 + \\frac{1}{x} = \\frac{x + 1}{x}$. Do đó $T = 1 : \\frac{x + 1}{x} = \\frac{x}{x + 1}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bất đẳng thức với phân thức",
    "pts": 20,
    "question": "Với mọi số thực $x > 0$, giá trị của phân thức $P = x + \\frac{1}{x}$ luôn thỏa mãn điều kiện nào?",
    "options": [
      {
        "text": "$P \\ge 2$",
        "correct": true
      },
      {
        "text": "$P \\le 2$",
        "correct": false
      },
      {
        "text": "$P > 1$",
        "correct": false
      },
      {
        "text": "$P < 2$",
        "correct": false
      }
    ],
    "explanation": "Theo bất đẳng thức Cauchy (hoặc xét $(\\sqrt{x} - \\frac{1}{\\sqrt{x}})^2 \\ge 0 \\implies x - 2 + \\frac{1}{x} \\ge 0 \\implies x + \\frac{1}{x} \\ge 2$). Dấu bằng xảy ra khi $x = 1$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng vận tốc trung bình xuôi ngược dòng",
    "pts": 20,
    "question": "Một ca nô đi xuôi dòng quãng đường $S$ với vận tốc $v + u$ và đi ngược dòng trở về với vận tốc $v - u$ ($v > u > 0$). Biểu thức thời gian cả đi lẫn về của ca nô là:",
    "options": [
      {
        "text": "$\\frac{2v \\cdot S}{v^2 - u^2}$",
        "correct": true
      },
      {
        "text": "$\\frac{2S}{v}$",
        "correct": false
      },
      {
        "text": "$\\frac{2u \\cdot S}{v^2 - u^2}$",
        "correct": false
      },
      {
        "text": "$\\frac{S}{v^2 - u^2}$",
        "correct": false
      }
    ],
    "explanation": "Thời gian tổng cộng $t = \\frac{S}{v + u} + \\frac{S}{v - u} = \\frac{S(v - u) + S(v + u)}{(v + u)(v - u)} = \\frac{S(v - u + v + u)}{v^2 - u^2} = \\frac{2v \\cdot S}{v^2 - u^2}$."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let answeredCount = 0;

  quizData.forEach((q, qidx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    if (q.question && (q.question.includes('<table') || q.question.includes('quiz-table') || q.question.length > 250)) {
      card.classList.add('full-width');
    }
    card.id = `qcard-${q.id}`;

    const isAnswered = appState.answered[String(q.id)] !== undefined;
    if (isAnswered) answeredCount++;

    let headerHtml = `
      <div class="quiz-card-header">
        <span class="quiz-badge">${q.title}</span>
        <span class="quiz-points">+${q.pts} XP</span>
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options quiz-options-grid">
    `;

    q.options.forEach((opt, oidx) => {
      let optClass = 'quiz-opt-btn';
      let disabled = isAnswered ? 'disabled' : '';
      if (isAnswered) {
        if (opt.correct) optClass += ' correct';
        else if (appState.answered[String(q.id)] === oidx) optClass += ' wrong';
      }

      headerHtml += `
        <button class="${optClass}" data-qid="${q.id}" data-oidx="${oidx}" ${disabled}>
          <span class="opt-label">${String.fromCharCode(65 + oidx)}.</span>
          <span class="opt-text">${opt.text}</span>
        </button>
      `;
    });

    headerHtml += `</div>`;

    const showExp = isAnswered ? 'show' : '';
    let expStatusHtml = '';
    if (isAnswered) {
      const isCorrect = q.options[appState.answered[String(q.id)]].correct;
      expStatusHtml = `<div class="exp-status" style="margin-bottom: 8px; font-weight: 700; color: ${isCorrect ? '#34d399' : '#f87171'};">${isCorrect ? '✅ CHÍNH XÁC! +20 XP' : '❌ CHƯA ĐÚNG'}</div>`;
    }

    headerHtml += `
      <div class="explanation-box ${showExp}" id="exp-${q.id}">
        ${expStatusHtml}
        <strong>💡 Lời giải chi tiết:</strong> ${q.explanation}
      </div>
    `;

    card.innerHTML = headerHtml;
    container.appendChild(card);
  });

  // Gắn sự kiện click
  container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const qid = this.getAttribute('data-qid');
      const oidx = parseInt(this.getAttribute('data-oidx'));
      handleAnswer(qid, oidx);
    });
  });

  // Cập nhật header arena
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  const answeredKeys = Object.keys(appState.answered);
  let correctCount = 0;
  answeredKeys.forEach(k => {
    const q = quizData.find(item => String(item.id) === String(k));
    if (q && q.options[appState.answered[k]].correct) correctCount++;
  });

  if (progEl) progEl.textContent = `${answeredKeys.length}/10`;
  if (scoreEl) scoreEl.textContent = `${correctCount * 20} XP`;

  // Mở khóa huy hiệu 3, 4, 5
  if (appState.streak >= 5) unlockBadge(2);
  if (correctCount >= 8) unlockBadge(3);
  if (correctCount === 10) {
    unlockBadge(4);
    sound.playFanfare();
  }

  renderMathInTree(container);
}

function handleAnswer(qid, oidx) {
  if (appState.answered[String(qid)] !== undefined) return;
  const q = quizData.find(item => String(item.id) === String(qid));
  if (!q) return;

  appState.answered[String(qid)] = oidx;
  const isCorrect = q.options[oidx].correct;

  if (isCorrect) {
    appState.xp += q.pts;
    appState.streak += 1;
    sound.playCorrect();
  } else {
    appState.streak = 0;
    sound.playWrong();
  }

  saveState();
  updateHUD();
  renderQuiz();
}

// --- 4. TABS & MODAL CONTROLLER ---
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const panes = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sound.playClick();
      const target = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const pane = document.getElementById(`tab-${target}`);
      if (pane) pane.classList.add('active');

      // Tự động mở khóa Huy hiệu 1 & 2 khi chuyển tab
      if (target === 'theory') unlockBadge(0);
      if (target === 'labs') unlockBadge(1);

      // Kích hoạt render KaTeX nếu chuyển sang tab ẩn
      if (pane) renderMathInTree(pane);
    });
  });
}

function initAvatarModal() {
  const modal = document.getElementById('avatarModal');
  const avatarBtn = document.getElementById('avatarBtn');
  const closeBtn = document.getElementById('btnCloseModal');
  const choices = document.querySelectorAll('.avatar-choice');

  if (!modal || !avatarBtn) return;

  avatarBtn.addEventListener('click', () => {
    sound.playClick();
    modal.style.display = 'flex';
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      sound.playClick();
      modal.style.display = 'none';
    });
  }

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  choices.forEach(choice => {
    choice.addEventListener('click', () => {
      sound.playClick();
      const av = choice.getAttribute('data-avatar');
      const ti = choice.getAttribute('data-title');
      appState.avatar = av;
      appState.userTitle = ti;
      saveState();
      updateHUD();
      modal.style.display = 'none';
    });
  });
}

// --- 5. TIỆN ÍCH HEADER ---
function initHeaderActions() {
  const soundBtn = document.getElementById('soundToggle');
  const resetBtn = document.getElementById('resetProgress');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      sound.enabled = appState.sound;
      sound.playClick();
      saveState();
      updateHUD();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn đặt lại toàn bộ điểm và huy hiệu của bài này?')) {
        localStorage.removeItem(STORAGE_KEY);
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        saveState();
        updateHUD();
        renderQuiz();
      }
    });
  }
}

// --- 6. PHÒNG THÍ NGHIỆM TƯƠNG TÁC (LAB 1 & LAB 2) ---
function initLabs() {
  // Khởi tạo Lab 1
  try {
    
                const canvas = document.getElementById('labCanvas1');
                const ctx = canvas.getContext('2d');
                const outEl = document.getElementById('lab1Output6');

                const topics = {
                    1: { title: "Định nghĩa & ĐKXĐ", formula: "A/B (B ≠ 0)", desc: "Phân thức đại số có mẫu khác 0. ĐKXĐ là B(x) ≠ 0. Hai phân thức bằng nhau khi A·D = B·C." },
                    2: { title: "Rút gọn & Quy đồng", formula: "A/B = (A:N)/(B:N)", desc: "Rút gọn bằng cách chia cả tử và mẫu cho nhân tử chung. Quy đồng qua BCNN hệ số và lũy thừa biến cao nhất." },
                    3: { title: "Cộng & Trừ phân thức", formula: "A/M ± B/M = (A±B)/M", desc: "Cùng mẫu: cộng trừ tử, giữ nguyên mẫu. Khác mẫu: quy đồng về MTC rồi cộng trừ tử." },
                    4: { title: "Nhân & Chia phân thức", formula: "(A/B) : (C/D) = (A/B) · (D/C)", desc: "Nhân tử với tử, mẫu với mẫu. Chia bằng cách nhân với phân thức nghịch đảo D/C." }
                };

                function showTopic(id) {
                    const t = topics[id];
                    outEl.innerHTML = `<strong>Chuyên đề: ${t.title}</strong> &nbsp;|&nbsp; <strong>Công thức lõi:</strong> $${t.formula}$ <br>${t.desc}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Vẽ tâm sơ đồ
                    ctx.fillStyle = '#6366f1';
                    ctx.beginPath();
                    ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText('PHÂN THỨC', w / 2, h / 2 - 4);
                    ctx.fillText('ĐẠI SỐ', w / 2, h / 2 + 14);

                    // Vẽ 4 nhánh
                    const branches = [
                        { id: 1, x: 100, y: 60, name: "1. ĐKXĐ" },
                        { id: 2, x: w - 100, y: 60, name: "2. Quy đồng" },
                        { id: 3, x: 100, y: h - 50, name: "3. Cộng Trừ" },
                        { id: 4, x: w - 100, y: h - 50, name: "4. Nhân Chia" }
                    ];

                    branches.forEach(b => {
                        const isActive = (b.id === id);
                        ctx.strokeStyle = isActive ? '#38bdf8' : '#334155';
                        ctx.lineWidth = isActive ? 3 : 1.5;
                        ctx.beginPath();
                        ctx.moveTo(w / 2, h / 2);
                        ctx.lineTo(b.x, b.y);
                        ctx.stroke();

                        ctx.fillStyle = isActive ? '#0284c7' : '#1e293b';
                        ctx.strokeStyle = isActive ? '#38bdf8' : '#475569';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.roundRect(b.x - 55, b.y - 20, 110, 40, 8);
                        ctx.fill();
                        ctx.stroke();

                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 12px Segoe UI';
                        ctx.fillText(b.name, b.x, b.y + 5);
                    });
                }

                document.getElementById('btnTopic1').addEventListener('click', () => showTopic(1));
                document.getElementById('btnTopic2').addEventListener('click', () => showTopic(2));
                document.getElementById('btnTopic3').addEventListener('click', () => showTopic(3));
                document.getElementById('btnTopic4').addEventListener('click', () => showTopic(4));
                showTopic(1);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const slider = document.getElementById('sliderX6');
                const valX = document.getElementById('valX6');
                const outEl = document.getElementById('lab2Output6');

                function draw() {
                    const x = parseInt(slider.value);
                    valX.textContent = x;

                    const denom = x + 1;
                    if (denom === 0) {
                        outEl.innerHTML = `<strong>Tại $x = ${x}$:</strong> Mẫu thức $x + 1 = 0 \\implies$ <span style="color:#f87171; font-weight:bold;">KHÔNG XÁC ĐỊNH</span>.`;
                    } else {
                        const num = 2 * x + 5;
                        const isInteger = (3 % denom === 0);
                        const val = (num / denom).toFixed(2);
                        const intVal = num / denom;

                        if (isInteger) {
                            outEl.innerHTML = `<strong>Tại $x = ${x}$:</strong> $P = 2 + \\frac{3}{${x} + 1} = 2 + \\frac{3}{${denom}} = <span style="color:#34d399; font-weight:bold; font-size:1.15rem;">${intVal}</span>$ &nbsp;✅ <span style="color:#34d399; font-weight:bold;">NHẬN GIÁ TRỊ NGUYÊN!</span>`;
                        } else {
                            outEl.innerHTML = `<strong>Tại $x = ${x}$:</strong> $P = \\frac{${num}}{${denom}} \\approx ${val}$ &nbsp;⚠️ (Không phải số nguyên vì $x + 1 = ${denom}$ không chia hết cho 3).`;
                        }
                    }

                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '14px Segoe UI';
                    ctx.fillText('CÁC ĐIỂM NGUYÊN CỦA P(x): Ước của 3 là {±1, ±3} ➔ x ∈ {-4, -2, 0, 2}', 40, 40);

                    // Trục số
                    const midY = 120;
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(40, midY); ctx.lineTo(w - 40, midY);
                    ctx.stroke();

                    const validRoots = [-4, -2, 0, 2];
                    for (let i = -6; i <= 6; i++) {
                        const posX = 40 + (i + 6) * ((w - 80) / 12);
                        const isSol = validRoots.includes(i);
                        const isForbidden = (i === -1);

                        ctx.fillStyle = isForbidden ? '#ef4444' : (isSol ? '#10b981' : '#64748b');
                        ctx.beginPath();
                        ctx.arc(posX, midY, isSol ? 7 : 4, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.font = '12px Segoe UI';
                        ctx.textAlign = 'center';
                        ctx.fillText(i, posX, midY + 22);

                        if (isSol) {
                            ctx.fillStyle = '#10b981';
                            ctx.fillText('P∈ℤ', posX, midY - 14);
                        }
                    }

                    // Điểm chọn hiện tại
                    const curXPos = 40 + (x + 6) * ((w - 80) / 12);
                    ctx.fillStyle = validRoots.includes(x) ? '#34d399' : '#06b6d4';
                    ctx.beginPath();
                    ctx.arc(curXPos, midY, 11, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText('x=' + x, curXPos, midY - 30);
                }

                slider.addEventListener('input', draw);
                draw();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 2:', e); }
}

// --- 7. KHỞI CHẠY DOMCONTENTLOADED ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  sound.enabled = appState.sound;
  updateHUD();
  initTabs();
  initAvatarModal();
  initHeaderActions();
  renderQuiz();
  initLabs();
});
