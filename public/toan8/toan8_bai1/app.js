// ================================================================
// BÀI 1: ĐƠN THỨC - TOÁN 8 KNTT
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
  userTitle: 'Chiến Binh Đơn Thức 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai1_state';

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
    "title": "Thử Thách 1: Nhận Biết Đơn Thức",
    "pts": 20,
    "question": "Trong các biểu thức đại số sau, biểu thức nào là một đơn thức?",
    "options": [
      {
        "text": "$x + 2y$",
        "correct": false
      },
      {
        "text": "$-3 x^2 y z$",
        "correct": true
      },
      {
        "text": "$\\frac{2x}{y}$",
        "correct": false
      },
      {
        "text": "$x^2 - 1$",
        "correct": false
      }
    ],
    "explanation": "Đơn thức là biểu thức chỉ gồm một số, một biến hoặc một tích giữa các số và các biến. Biểu thức $-3x^2yz$ là tích của số $-3$ và các biến $x, y, z$ nên là đơn thức. Các biểu thức còn lại chứa phép cộng, trừ hoặc biến ở mẫu."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Thu Gọn Đơn Thức",
    "pts": 20,
    "question": "Thu gọn đơn thức $A = (-2 x^2 y) \\cdot (3 x y^3)$ ta được kết quả là:",
    "options": [
      {
        "text": "$-6 x^3 y^4$",
        "correct": true
      },
      {
        "text": "$6 x^3 y^4$",
        "correct": false
      },
      {
        "text": "$-6 x^2 y^3$",
        "correct": false
      },
      {
        "text": "$-5 x^3 y^4$",
        "correct": false
      }
    ],
    "explanation": "Ta nhân hệ số với hệ số và biến với biến: $A = [(-2) \\cdot 3] \\cdot (x^2 \\cdot x) \\cdot (y \\cdot y^3) = -6 x^3 y^4$."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Xác Định Bậc Đơn Thức",
    "pts": 20,
    "question": "Bậc của đơn thức $M = -5 x^3 y^4 z$ là bao nhiêu?",
    "options": [
      {
        "text": "$7$",
        "correct": false
      },
      {
        "text": "$8$",
        "correct": true
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$12$",
        "correct": false
      }
    ],
    "explanation": "Bậc của đơn thức là tổng số mũ của tất cả các biến: $3 + 4 + 1 = 8$ (chú ý biến $z$ có số mũ là 1)."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Hệ Số Và Phần Biến",
    "pts": 20,
    "question": "Hệ số và phần biến của đơn thức $-\\frac{3}{4} x^2 y^5$ lần lượt là:",
    "options": [
      {
        "text": "Hệ số là $-\\frac{3}{4}$, phần biến là $x^2 y^5$",
        "correct": true
      },
      {
        "text": "Hệ số là $\\frac{3}{4}$, phần biến là $x^2 y^5$",
        "correct": false
      },
      {
        "text": "Hệ số là $-3$, phần biến là $4 x^2 y^5$",
        "correct": false
      },
      {
        "text": "Hệ số là $-\\frac{3}{4}$, phần biến là $x y$",
        "correct": false
      }
    ],
    "explanation": "Đơn thức đã thu gọn có hệ số là số thực đứng trước: $-\\frac{3}{4}$, và phần biến là tích các lũy thừa biến: $x^2 y^5$."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Đơn Thức Đồng Dạng",
    "pts": 20,
    "question": "Cặp đơn thức nào sau đây là hai đơn thức đồng dạng?",
    "options": [
      {
        "text": "$2 x^2 y$ và $2 x y^2$",
        "correct": false
      },
      {
        "text": "$-3 x^2 y^3$ và $5 x^2 y^3$",
        "correct": true
      },
      {
        "text": "$4 x^3$ và $4 y^3$",
        "correct": false
      },
      {
        "text": "$x^2 y$ và $-x^2 y z$",
        "correct": false
      }
    ],
    "explanation": "Hai đơn thức đồng dạng phải có hệ số khác 0 và có cùng phần biến. Ở đây $-3x^2y^3$ và $5x^2y^3$ đều có chung phần biến là $x^2y^3$."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Cộng Đơn Thức Đồng Dạng",
    "pts": 20,
    "question": "Tổng của hai đơn thức $7 x^3 y^2$ và $-4 x^3 y^2$ bằng:",
    "options": [
      {
        "text": "$3 x^3 y^2$",
        "correct": true
      },
      {
        "text": "$11 x^3 y^2$",
        "correct": false
      },
      {
        "text": "$3 x^6 y^4$",
        "correct": false
      },
      {
        "text": "$-28 x^3 y^2$",
        "correct": false
      }
    ],
    "explanation": "Cộng hai đơn thức đồng dạng: $7 x^3 y^2 + (-4 x^3 y^2) = (7 - 4) x^3 y^2 = 3 x^3 y^2$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Trừ Đơn Thức Đồng Dạng",
    "pts": 20,
    "question": "Hiệu $-2 x y^2 - 5 x y^2$ có kết quả là:",
    "options": [
      {
        "text": "$3 x y^2$",
        "correct": false
      },
      {
        "text": "$-7 x y^2$",
        "correct": true
      },
      {
        "text": "$-7 x^2 y^4$",
        "correct": false
      },
      {
        "text": "$-3 x y^2$",
        "correct": false
      }
    ],
    "explanation": "Ta lấy hệ số trừ hệ số và giữ nguyên phần biến: $(-2 - 5) x y^2 = -7 x y^2$."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Tính Giá Trị Đơn Thức",
    "pts": 20,
    "question": "Giá trị của đơn thức $P = -2 x^2 y$ tại $x = -1$ và $y = 3$ là:",
    "options": [
      {
        "text": "$6$",
        "correct": false
      },
      {
        "text": "$-6$",
        "correct": true
      },
      {
        "text": "$12$",
        "correct": false
      },
      {
        "text": "$-12$",
        "correct": false
      }
    ],
    "explanation": "Thay $x = -1, y = 3$ vào đơn thức: $P = -2 \\cdot (-1)^2 \\cdot 3 = -2 \\cdot 1 \\cdot 3 = -6$."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Rút Gọn Biểu Thức Đơn Thức",
    "pts": 20,
    "question": "Rút gọn biểu thức $Q = 5 x^2 y - 3 x^2 y + 2 x^2 y$ được:",
    "options": [
      {
        "text": "$4 x^2 y$",
        "correct": true
      },
      {
        "text": "$4 x^6 y^3$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$10 x^2 y$",
        "correct": false
      }
    ],
    "explanation": "Cả ba đơn thức đều đồng dạng: $Q = (5 - 3 + 2) x^2 y = 4 x^2 y$."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Bậc Của Đơn Thức Tích",
    "pts": 20,
    "question": "Cho hai đơn thức $A = 2 x y^2$ và $B = -3 x^2 y z$. Bậc của đơn thức tích $M = A \\cdot B$ là:",
    "options": [
      {
        "text": "$6$",
        "correct": false
      },
      {
        "text": "$7$",
        "correct": true
      },
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "$8$",
        "correct": false
      }
    ],
    "explanation": "Bậc của $A$ là $1 + 2 = 3$. Bậc của $B$ là $2 + 1 + 1 = 4$. Do đó bậc của tích $M = A \\cdot B$ là $3 + 4 = 7$ (hoặc tính $M = -6 x^3 y^3 z \\implies 3 + 3 + 1 = 7$)."
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
                const coeffK = document.getElementById('coeffK');
                const expX = document.getElementById('expX');
                const expY = document.getElementById('expY');
                const expZ = document.getElementById('expZ');
                const outEl = document.getElementById('lab1Output');

                function update() {
                    const k = parseFloat(coeffK.value) || 0;
                    const x = parseInt(expX.value);
                    const y = parseInt(expY.value);
                    const z = parseInt(expZ.value);
                    const deg = (k === 0) ? 'Không có bậc' : (x + y + z);

                    let varStr = '';
                    if (x > 0) varStr += 'x' + (x > 1 ? '^' + x : '');
                    if (y > 0) varStr += 'y' + (y > 1 ? '^' + y : '');
                    if (z > 0) varStr += 'z' + (z > 1 ? '^' + z : '');
                    if (!varStr) varStr = (k === 0 ? '0' : '1');

                    const displayMono = (k === 0) ? '0' : (k === 1 && varStr !== '1' ? varStr : (k === -1 && varStr !== '1' ? '-' + varStr : k + (varStr !== '1' ? varStr : '')));

                    outEl.innerHTML = `<strong>Đơn thức thu gọn:</strong> $${displayMono}$ &nbsp;|&nbsp; <strong>Hệ số:</strong> $${k}$ &nbsp;|&nbsp; <strong>Phần biến:</strong> $${varStr === '1' ? '\\text{không có}' : varStr}$ &nbsp;|&nbsp; <strong>Bậc:</strong> $${deg}$`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    // Ve truc quan tren canvas
                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);

                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Ve thanh bieu dien bac
                    const maxB = 15;
                    const totalDeg = (k === 0) ? 0 : (x + y + z);
                    const barW = Math.min(w - 100, Math.max(20, (totalDeg / maxB) * (w - 140)));

                    ctx.fillStyle = '#6366f1';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('ĐỘ LỚN BẬC CỦA ĐƠN THỨC (Tổng số mũ): ' + totalDeg, 40, 45);

                    // Thanh tien trinh mau sac
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(40, 70, w - 80, 28);

                    const grad = ctx.createLinearGradient(40, 0, w - 40, 0);
                    grad.addColorStop(0, '#06b6d4');
                    grad.addColorStop(0.5, '#6366f1');
                    grad.addColorStop(1, '#f59e0b');
                    ctx.fillStyle = grad;
                    ctx.fillRect(40, 70, barW, 28);

                    // Hien thi tung thanh phan
                    ctx.fillStyle = '#cbd5e1';
                    ctx.font = '14px Segoe UI';
                    ctx.fillText(`Mũ x = ${x} (bậc x)`, 40, 140);
                    ctx.fillText(`Mũ y = ${y} (bậc y)`, 200, 140);
                    ctx.fillText(`Mũ z = ${z} (bậc z)`, 360, 140);
                    ctx.fillText(`Hệ số k = ${k}`, 480, 140);

                    // Mo hinh hop
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(40, 160, w - 80, 50);
                    ctx.fillStyle = '#f8fafc';
                    ctx.font = 'italic bold 20px Times New Roman';
                    ctx.textAlign = 'center';
                    ctx.fillText(displayMono, w / 2, 192);
                    ctx.textAlign = 'left';
                }

                [coeffK, expX, expY, expZ].forEach(el => el.addEventListener('input', update));
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const sA = document.getElementById('sliderA');
                const sB = document.getElementById('sliderB');
                const valA = document.getElementById('valA');
                const valB = document.getElementById('valB');
                const outEl = document.getElementById('lab2Output');

                function draw() {
                    const a = parseInt(sA.value);
                    const b = parseInt(sB.value);
                    valA.textContent = a;
                    valB.textContent = b;
                    const sum = a + b;

                    outEl.innerHTML = `<strong>Phép tính:</strong> $(${a})x^2y + (${b})x^2y = (${a} + ${b})x^2y = ${sum}x^2y$`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Tru cot can can
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.moveTo(w / 2, h - 30);
                    ctx.lineTo(w / 2, 80);
                    ctx.stroke();

                    // Gia do de
                    ctx.fillStyle = '#334155';
                    ctx.beginPath();
                    ctx.moveTo(w / 2 - 50, h - 20);
                    ctx.lineTo(w / 2 + 50, h - 20);
                    ctx.lineTo(w / 2, h - 40);
                    ctx.closePath();
                    ctx.fill();

                    // Do nghieng can can dua tren tong he so
                    const angle = Math.max(-0.25, Math.min(0.25, -sum * 0.02));
                    ctx.save();
                    ctx.translate(w / 2, 80);
                    ctx.rotate(angle);

                    // Thanh ngang
                    ctx.strokeStyle = '#818cf8';
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.moveTo(-180, 0);
                    ctx.lineTo(180, 0);
                    ctx.stroke();

                    // Dia can trai (A)
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(-220, 10, 80, 40);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(`A = ${a}`, -180, 35);

                    // Dia can phai (B)
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(140, 10, 80, 40);
                    ctx.fillStyle = '#fff';
                    ctx.fillText(`B = ${b}`, 180, 35);

                    ctx.restore();

                    // Ket qua o giua
                    ctx.fillStyle = '#10b981';
                    ctx.font = 'bold 18px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(`TỔNG HỆ SỐ = ${sum}`, w / 2, 40);
                }

                sA.addEventListener('input', draw);
                sB.addEventListener('input', draw);
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
