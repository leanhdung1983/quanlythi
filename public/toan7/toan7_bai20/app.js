// ================================================================
// BÀI 20: TỈ LỆ THỨC - TOÁN 7 KNTT
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
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));

  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
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
  if (window.renderMathInElement) {
    renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      strict: false
    });
  } else {
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        if (text && (text.includes('$') || text.includes('$$'))) {
          const span = document.createElement('span');
          span.innerHTML = formatMathText(text);
          node.parentNode.replaceChild(span, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
        Array.from(node.childNodes).forEach(walk);
      }
    }
    walk(root);
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
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type = 'sine', duration = 0.15, vol = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
  playClick() { this.playTone(600, 'sine', 0.08, 0.06); }
  playCorrect() {
    this.playTone(523.25, 'triangle', 0.12, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.12), 80);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.22, 0.15), 160);
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
  userTitle: 'Nhà Thám Hiểm Tỉ Lệ Thức 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai20_state';

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
    "title": "Câu 1: Định nghĩa tỉ lệ thức",
    "pts": 20,
    "question": "Tỉ lệ thức là đẳng thức của:",
    "options": [
      {
        "text": "Hai tỉ số",
        "correct": true
      },
      {
        "text": "Hai tổng số",
        "correct": false
      },
      {
        "text": "Hai hiệu số",
        "correct": false
      },
      {
        "text": "Hai tích số",
        "correct": false
      }
    ],
    "explanation": "Theo SGK Toán 7, tỉ lệ thức là đẳng thức của hai tỉ số $\\frac{a}{b} = \\frac{c}{d}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Nhận biết tỉ lệ thức",
    "pts": 20,
    "question": "Cặp tỉ số nào sau đây lập thành một tỉ lệ thức?",
    "options": [
      {
        "text": "$\\frac{2}{3}$ và $\\frac{6}{9}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{2}$ và $\\frac{2}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{5}$ và $\\frac{5}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{4}{7}$ và $\\frac{7}{4}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $2 \\cdot 9 = 18$ và $3 \\cdot 6 = 18$. Vì $2 \\cdot 9 = 3 \\cdot 6 = 18$ nên $\\frac{2}{3} = \\frac{6}{9}$ lập thành tỉ lệ thức."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính chất tích chéo",
    "pts": 20,
    "question": "Nếu $\\frac{a}{b} = \\frac{c}{d}$ thì khẳng định nào sau đây là ĐÚNG?",
    "options": [
      {
        "text": "$a \\cdot d = b \\cdot c$",
        "correct": true
      },
      {
        "text": "$a \\cdot b = c \\cdot d$",
        "correct": false
      },
      {
        "text": "$a \\cdot c = b \\cdot d$",
        "correct": false
      },
      {
        "text": "$a + d = b + c$",
        "correct": false
      }
    ],
    "explanation": "Tính chất cơ bản của tỉ lệ thức: Nếu $\\frac{a}{b} = \\frac{c}{d}$ thì tích ngoại tỉ bằng tích trung tỉ: $a \\cdot d = b \\cdot c$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tìm x trong tỉ lệ thức",
    "pts": 20,
    "question": "Tìm $x$ biết $\\frac{x}{6} = \\frac{5}{3}$:",
    "options": [
      {
        "text": "$x = 10$",
        "correct": true
      },
      {
        "text": "$x = 15$",
        "correct": false
      },
      {
        "text": "$x = 8$",
        "correct": false
      },
      {
        "text": "$x = 12$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng tính chất tỉ lệ thức: $x \\cdot 3 = 6 \\cdot 5 = 30 \\implies x = 30 : 3 = 10$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tìm x với số âm",
    "pts": 20,
    "question": "Tìm $x$ biết $\\frac{-4}{x} = \\frac{2}{7}$:",
    "options": [
      {
        "text": "$x = -14$",
        "correct": true
      },
      {
        "text": "$x = 14$",
        "correct": false
      },
      {
        "text": "$x = -8$",
        "correct": false
      },
      {
        "text": "$x = -28$",
        "correct": false
      }
    ],
    "explanation": "Ta có $2 \\cdot x = (-4) \\cdot 7 = -28 \\implies x = -28 : 2 = -14$."
  },
  {
    "id": 6,
    "title": "Câu 6: Lập tỉ lệ thức từ đẳng thức",
    "pts": 20,
    "question": "Từ đẳng thức $3 \\cdot 8 = 4 \\cdot 6$, tỉ lệ thức nào sau đây SAI?",
    "options": [
      {
        "text": "$\\frac{3}{6} = \\frac{8}{4}$",
        "correct": true
      },
      {
        "text": "$\\frac{3}{4} = \\frac{6}{8}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{6} = \\frac{4}{8}$",
        "correct": false
      },
      {
        "text": "$\\frac{8}{4} = \\frac{6}{3}$",
        "correct": false
      }
    ],
    "explanation": "Từ $3 \\cdot 8 = 4 \\cdot 6$, nếu viết $\\frac{3}{6} = \\frac{8}{4}$ thì tích chéo là $3 \\cdot 4 = 12$ và $6 \\cdot 8 = 48$ (không bằng nhau, sai!)."
  },
  {
    "id": 7,
    "title": "Câu 7: Tìm x có biểu thức ở tử",
    "pts": 20,
    "question": "Tìm $x$ thỏa mãn $\\frac{x - 1}{4} = \\frac{3}{2}$:",
    "options": [
      {
        "text": "$x = 7$",
        "correct": true
      },
      {
        "text": "$x = 6$",
        "correct": false
      },
      {
        "text": "$x = 5$",
        "correct": false
      },
      {
        "text": "$x = 8$",
        "correct": false
      }
    ],
    "explanation": "Ta có $2 \\cdot (x - 1) = 4 \\cdot 3 = 12 \\implies x - 1 = 6 \\implies x = 7$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tỉ số giữa hai đại lượng",
    "pts": 20,
    "question": "Một lớp học có $18$ bạn nam và $24$ bạn nữ. Tỉ số giữa số bạn nam và số bạn nữ rút gọn là:",
    "options": [
      {
        "text": "$\\frac{3}{4}$",
        "correct": true
      },
      {
        "text": "$\\frac{4}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": false
      }
    ],
    "explanation": "Tỉ số giữa nam và nữ là $\\frac{18}{24} = \\frac{18 : 6}{24 : 6} = \\frac{3}{4}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Ngoại tỉ và trung tỉ",
    "pts": 20,
    "question": "Trong tỉ lệ thức $\\frac{a}{b} = \\frac{c}{d}$, hai số nào gọi là ngoại tỉ?",
    "options": [
      {
        "text": "$a$ và $d$",
        "correct": true
      },
      {
        "text": "$b$ và $c$",
        "correct": false
      },
      {
        "text": "$a$ và $b$",
        "correct": false
      },
      {
        "text": "$c$ và $d$",
        "correct": false
      }
    ],
    "explanation": "Trong $\\frac{a}{b} = \\frac{c}{d}$, hai số $a, d$ nằm ở vị trí bên ngoài nên gọi là ngoại tỉ."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng bản đồ",
    "pts": 20,
    "question": "Trên bản đồ tỉ lệ $1 : 1\\,000\\,000$, khoảng cách giữa hai thành phố đo được $4\\text{ cm}$. Khoảng cách thực tế là:",
    "options": [
      {
        "text": "$40\\text{ km}$",
        "correct": true
      },
      {
        "text": "$4\\text{ km}$",
        "correct": false
      },
      {
        "text": "$400\\text{ km}$",
        "correct": false
      },
      {
        "text": "$25\\text{ km}$",
        "correct": false
      }
    ],
    "explanation": "Khoảng cách thực tế là $4 \\times 1\\,000\\,000 = 4\\,000\\,000\\text{ cm} = 40\\,000\\text{ m} = 40\\text{ km}$."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let answeredCount = 0;
  let correctCount = 0;

  quizData.forEach((q, qIndex) => {
    const isAnswered = appState.answered[q.id] !== undefined;
    const userAnswer = appState.answered[q.id];
    if (isAnswered) {
      answeredCount++;
      if (q.options[userAnswer] && q.options[userAnswer].correct) correctCount++;
    }

    const card = document.createElement('div');
    card.className = 'quiz-card';
    if (q.question && (q.question.includes('<table') || q.question.includes('quiz-table') || q.question.length > 250)) {
      card.classList.add('full-width');
    }

    // Header câu hỏi
    const qHeader = document.createElement('div');
    qHeader.className = 'quiz-card-header';
    qHeader.innerHTML = `<span><strong>${q.title || ('Câu ' + (qIndex + 1))}</strong></span><span class="quiz-badge">+${q.pts || 20} XP</span>`;
    card.appendChild(qHeader);

    // Nội dung câu hỏi
    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    // Danh sách đáp án nút
    const optList = document.createElement('div');
    optList.className = 'quiz-options';
    const labels = ['A', 'B', 'C', 'D'];

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;

      if (isAnswered) {
        btn.disabled = true;
        if (opt.correct) btn.classList.add('correct');
        if (userAnswer === optIndex && !opt.correct) btn.classList.add('wrong');
      } else {
        btn.onclick = () => selectAnswer(q.id, optIndex, opt.correct, q.pts || 20);
      }
      optList.appendChild(btn);
    });
    card.appendChild(optList);

    // Giải thích chi tiết
    if (isAnswered) {
      const explanation = document.createElement('div');
      explanation.className = 'explanation-box show';
      explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;
      card.appendChild(explanation);
    }

    container.appendChild(card);
  });

  // Cập nhật tiến độ Arena
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progEl) progEl.textContent = `${answeredCount}/${quizData.length}`;
  if (scoreEl) scoreEl.textContent = `${appState.xp} XP`;

  // Mở khóa Huy hiệu 4 & 5
  if (appState.xp >= 160) unlockBadge(3);
  if (correctCount === quizData.length && quizData.length > 0) {
    unlockBadge(4);
    if (!appState.badges[4]) sound.playFanfare();
  }

  // Quét KaTeX
  renderMathInTree(container);
}

function selectAnswer(qid, optIndex, isCorrect, pts) {
  if (appState.answered[qid] !== undefined) return;
  sound.init();

  appState.answered[qid] = optIndex;
  if (isCorrect) {
    appState.xp += pts;
    appState.streak += 1;
    sound.playCorrect();
    if (appState.streak >= 5) unlockBadge(2);
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

      if (target === 'theory') unlockBadge(0);
      if (target === 'labs') unlockBadge(1);

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
  try {
    
const canvas = document.getElementById('labCanvas1');
if (canvas) {
  const ctx = canvas.getContext('2d');
  let a = 6, b = 9, c = 8, d = 12;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const prod1 = a * d;
    const prod2 = b * c;
    const isEqual = prod1 === prod2;

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MÔ PHỎNG TÍNH CHẤT TÍCH CHÉO TỈ LỆ THỨC', canvas.width / 2, 30);

    // Vẽ hai phân số
    ctx.font = 'bold 22px serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${a}`, canvas.width / 2 - 80, 85);
    ctx.fillRect(canvas.width / 2 - 105, 95, 50, 3);
    ctx.fillText(`${b}`, canvas.width / 2 - 80, 125);

    ctx.fillStyle = '#ffffff';
    ctx.fillText('=', canvas.width / 2 - 30, 105);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`${c}`, canvas.width / 2 + 20, 85);
    ctx.fillRect(canvas.width / 2 - 5, 95, 50, 3);
    ctx.fillText(`${d}`, canvas.width / 2 + 20, 125);

    // Vẽ tích chéo
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#a5b4fc';
    ctx.fillText(`Tích ngoại tỉ a · d = ${a} · ${d} = ${prod1}`, canvas.width / 2, 180);
    ctx.fillText(`Tích trung tỉ b · c = ${b} · ${c} = ${prod2}`, canvas.width / 2, 210);

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = isEqual ? '#10b981' : '#f43f5e';
    ctx.fillText(isEqual ? `✓ Tích chéo bằng nhau (${prod1} = ${prod2}) -> Đẳng thức là một Tỉ Lệ Thức!` : `✗ Tích chéo không bằng nhau (${prod1} ≠ ${prod2})`, canvas.width / 2, 250);
  }
  draw();

  const btnChange = document.getElementById('btnLab1Change');
  if (btnChange) {
    btnChange.onclick = () => {
      const k = Math.floor(Math.random() * 4) + 2;
      a = Math.floor(Math.random() * 5) + 2;
      b = Math.floor(Math.random() * 5) + 3;
      c = a * k;
      d = b * k;
      draw();
    };
  }
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');
  let b = 15, c = 4, d = 5;

  function draw2() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    const x = (b * c) / d;

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('MÁY TÌM SỐ HẠNG CHƯA BIẾT (x/b = c/d)', canvas2.width / 2, 30);

    ctx2.font = 'bold 24px serif';
    ctx2.fillStyle = '#ec4899';
    ctx2.fillText('x', canvas2.width / 2 - 80, 85);
    ctx2.fillRect(canvas2.width / 2 - 105, 95, 50, 3);
    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText(`${b}`, canvas2.width / 2 - 80, 125);

    ctx2.fillStyle = '#ffffff';
    ctx2.fillText('=', canvas2.width / 2 - 30, 105);

    ctx2.fillStyle = '#f59e0b';
    ctx2.fillText(`${c}`, canvas2.width / 2 + 20, 85);
    ctx2.fillRect(canvas2.width / 2 - 5, 95, 50, 3);
    ctx2.fillText(`${d}`, canvas2.width / 2 + 20, 125);

    // Tính toán
    ctx2.font = '15px sans-serif';
    ctx2.fillStyle = '#cbd5e1';
    ctx2.fillText(`Áp dụng tính chất tích chéo: x · ${d} = ${b} · ${c} = ${b * c}`, canvas2.width / 2, 180);

    ctx2.font = 'bold 18px sans-serif';
    ctx2.fillStyle = '#10b981';
    ctx2.fillText(`=> x = (${b} · ${c}) / ${d} = ${x}`, canvas2.width / 2, 225);
  }
  draw2();

  const sliderB = document.getElementById('sliderLab2B');
  if (sliderB) {
    sliderB.oninput = (e) => {
      b = parseInt(e.target.value);
      draw2();
    };
  }
}

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
