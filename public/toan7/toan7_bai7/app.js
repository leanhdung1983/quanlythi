// ================================================================
// BÀI 7: TẬP HỢP CÁC SỐ THỰC - TOÁN 7 KNTT
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
  userTitle: 'Đại Sứ Số Thực 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai7_state';

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
    "title": "Câu 1: Cấu trúc tập số thực",
    "pts": 20,
    "question": "Tập hợp các số thực $\\mathbb{R}$ gồm:",
    "options": [
      {
        "text": "Tất cả các số hữu tỉ và các số vô tỉ",
        "correct": true
      },
      {
        "text": "Chỉ các số nguyên và số tự nhiên",
        "correct": false
      },
      {
        "text": "Chỉ các số viết được dưới dạng phân số",
        "correct": false
      },
      {
        "text": "Chỉ các số dương và số 0",
        "correct": false
      }
    ],
    "explanation": "Tập hợp số thực $\\mathbb{R}$ là sự hợp nhất của tập hợp các số hữu tỉ $\\mathbb{Q}$ và tập hợp các số vô tỉ $\\mathbb{I}$: $\\mathbb{R} = \\mathbb{Q} \\cup \\mathbb{I}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Kí hiệu thuộc tập hợp",
    "pts": 20,
    "question": "Khẳng định nào sau đây là SAI?",
    "options": [
      {
        "text": "$\\sqrt{2} \\in \\mathbb{Q}$",
        "correct": true
      },
      {
        "text": "$\\sqrt{2} \\in \\mathbb{R}$",
        "correct": false
      },
      {
        "text": "$-5 \\in \\mathbb{R}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{4} \\in \\mathbb{R}$",
        "correct": false
      }
    ],
    "explanation": "Số $\\sqrt{2}$ là số vô tỉ nên $\\sqrt{2} \\notin \\mathbb{Q}$. Khẳng định $\\sqrt{2} \\in \\mathbb{Q}$ là sai."
  },
  {
    "id": 3,
    "title": "Câu 3: Giá trị tuyệt đối của số âm",
    "pts": 20,
    "question": "Giá trị của $|-3,14|$ là:",
    "options": [
      {
        "text": "$3,14$",
        "correct": true
      },
      {
        "text": "$-3,14$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$\\pm 3,14$",
        "correct": false
      }
    ],
    "explanation": "Giá trị tuyệt đối của một số âm là số đối của nó: $|-3,14| = -(-3,14) = 3,14$."
  },
  {
    "id": 4,
    "title": "Câu 4: Giá trị tuyệt đối của hiệu",
    "pts": 20,
    "question": "Tính giá trị của biểu thức $A = |1 - \\sqrt{2}|$:",
    "options": [
      {
        "text": "$\\sqrt{2} - 1$",
        "correct": true
      },
      {
        "text": "$1 - \\sqrt{2}$",
        "correct": false
      },
      {
        "text": "$1 + \\sqrt{2}$",
        "correct": false
      },
      {
        "text": "$-1 - \\sqrt{2}$",
        "correct": false
      }
    ],
    "explanation": "Vì $1 < \\sqrt{2}$ nên $1 - \\sqrt{2} < 0$. Do đó $|1 - \\sqrt{2}| = -(1 - \\sqrt{2}) = \\sqrt{2} - 1$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tìm x trong phương trình giá trị tuyệt đối",
    "pts": 20,
    "question": "Tìm số thực $x$ biết $|x| = 2,5$:",
    "options": [
      {
        "text": "$x = 2,5$ hoặc $x = -2,5$",
        "correct": true
      },
      {
        "text": "$x = 2,5$",
        "correct": false
      },
      {
        "text": "$x = -2,5$",
        "correct": false
      },
      {
        "text": "$x = 5$",
        "correct": false
      }
    ],
    "explanation": "Có hai điểm trên trục số cách gốc 0 một khoảng bằng $2,5$ là điểm $2,5$ và $-2,5$."
  },
  {
    "id": 6,
    "title": "Câu 6: Phương trình giá trị tuyệt đối vô nghiệm",
    "pts": 20,
    "question": "Phương trình $|x| = -4$ có bao nhiêu nghiệm?",
    "options": [
      {
        "text": "$0$ nghiệm (vô nghiệm)",
        "correct": true
      },
      {
        "text": "$1$ nghiệm",
        "correct": false
      },
      {
        "text": "$2$ nghiệm",
        "correct": false
      },
      {
        "text": "Vô số nghiệm",
        "correct": false
      }
    ],
    "explanation": "Vì giá trị tuyệt đối của mọi số thực luôn không âm ($|x| \\ge 0$) nên không thể bằng số âm $-4$. Phương trình vô nghiệm."
  },
  {
    "id": 7,
    "title": "Câu 7: So sánh hai số thực",
    "pts": 20,
    "question": "So sánh hai số thực $x = -1,414$ và $y = -\\sqrt{2}$ (biết $\\sqrt{2} \\approx 1,41421...$):",
    "options": [
      {
        "text": "$x > y$",
        "correct": true
      },
      {
        "text": "$x < y$",
        "correct": false
      },
      {
        "text": "$x = y$",
        "correct": false
      },
      {
        "text": "$x \\le y$",
        "correct": false
      }
    ],
    "explanation": "Ta có $|x| = 1,41400$ và $|y| = \\sqrt{2} \\approx 1,41421$. Vì $|x| < |y|$ nên đối với hai số âm, ta có $x > y$ (tức $-1,414 > -\\sqrt{2}$)."
  },
  {
    "id": 8,
    "title": "Câu 8: Tính chất trục số thực",
    "pts": 20,
    "question": "Khẳng định nào sau đây miêu tả chính xác nhất về trục số thực?",
    "options": [
      {
        "text": "Các điểm biểu diễn số thực lấp đầy toàn bộ trục số.",
        "correct": true
      },
      {
        "text": "Trên trục số chỉ có các điểm biểu diễn số nguyên.",
        "correct": false
      },
      {
        "text": "Có những điểm trên trục số không tương ứng với số thực nào.",
        "correct": false
      },
      {
        "text": "Các số vô tỉ không thể biểu diễn trên trục số.",
        "correct": false
      }
    ],
    "explanation": "Mỗi số thực được biểu diễn bởi một điểm trên trục số và ngược lại, mỗi điểm biểu diễn một số thực. Trục số thực là liên tục và lấp đầy."
  },
  {
    "id": 9,
    "title": "Câu 9: Bất đẳng thức giá trị tuyệt đối",
    "pts": 20,
    "question": "Với mọi số thực $a, b$, khẳng định nào sau đây luôn ĐÚNG?",
    "options": [
      {
        "text": "$|a + b| \\le |a| + |b|$",
        "correct": true
      },
      {
        "text": "$|a + b| = |a| + |b|$",
        "correct": false
      },
      {
        "text": "$|a + b| > |a| + |b|$",
        "correct": false
      },
      {
        "text": "$|a - b| = |a| - |b|$",
        "correct": false
      }
    ],
    "explanation": "Bất đẳng thức tam giác cho giá trị tuyệt đối: $|a + b| \\le |a| + |b|$ với mọi số thực $a, b$. Dấu bằng xảy ra khi $a$ và $b$ cùng dấu (tức $ab \\ge 0$)."
  },
  {
    "id": 10,
    "title": "Câu 10: Tìm x có biểu thức trong trị tuyệt đối",
    "pts": 20,
    "question": "Tìm $x$ biết: $|x - 1| = 3$:",
    "options": [
      {
        "text": "$x = 4$ hoặc $x = -2$",
        "correct": true
      },
      {
        "text": "$x = 4$",
        "correct": false
      },
      {
        "text": "$x = -2$",
        "correct": false
      },
      {
        "text": "$x = 2$ hoặc $x = -4$",
        "correct": false
      }
    ],
    "explanation": "Ta có 2 trường hợp: TH1: $x - 1 = 3 \\implies x = 4$; TH2: $x - 1 = -3 \\implies x = -2$."
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
    
                const info = {
                    'N': { title: 'Tập hợp số tự nhiên ℕ', set: '$\\mathbb{N} = \\{0, 1, 2, 3...\\}$', ex: '0, 1, 10, 2026' },
                    'Z': { title: 'Tập hợp số nguyên ℤ', set: '$\\mathbb{Z} = \\{... -2, -1, 0, 1, 2...\\}$', ex: '-5, -1, 0, 8' },
                    'Q': { title: 'Tập hợp số hữu tỉ ℚ', set: '$\\mathbb{Q} = \\{ \\frac{a}{b} \\mid a, b \\in \\mathbb{Z}, b \\neq 0 \\}$', ex: '$\\frac{1}{2}, -0,75, 2\\frac{1}{3}, 0,(3)$' },
                    'I': { title: 'Tập hợp số vô tỉ 𝕀', set: 'Các số thập phân vô hạn không tuần hoàn', ex: '$\\sqrt{2}, \\sqrt{3}, \\pi = 3,14159...$' },
                    'R': { title: 'Tập hợp số thực ℝ', set: '$\\mathbb{R} = \\mathbb{Q} \\cup \\mathbb{I}$ (Toàn bộ các số)', ex: 'Bao gồm tất cả các số trên trục số' }
                };

                function showVenn(key) {
                    const item = info[key];
                    const out = document.getElementById('lab1VennOut');
                    out.innerHTML = `<strong>${item.title}:</strong><br>Định nghĩa: ${item.set}<br>Các phần tử đại diện: ${item.ex}`;
                    renderMathInTree(out);
                }

                document.getElementById('btnVennN').addEventListener('click', () => showVenn('N'));
                document.getElementById('btnVennZ').addEventListener('click', () => showVenn('Z'));
                document.getElementById('btnVennQ').addEventListener('click', () => showVenn('Q'));
                document.getElementById('btnVennI').addEventListener('click', () => showVenn('I'));
                document.getElementById('btnVennR').addEventListener('click', () => showVenn('R'));

                setTimeout(() => showVenn('R'), 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let absX = -3.5;

                function drawAbs() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const cy = h / 2;
                    const originX = w / 2;
                    const unitPx = w / 14;

                    // Truc so
                    ctx2.strokeStyle = '#6366f1';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath();
                    ctx2.moveTo(20, cy);
                    ctx2.lineTo(w - 20, cy);
                    ctx2.stroke();

                    // Vach chia
                    ctx2.fillStyle = '#94a3b8';
                    ctx2.font = '12px Segoe UI';
                    ctx2.textAlign = 'center';
                    for (let n = -6; n <= 6; n += 2) {
                        const px = originX + n * unitPx;
                        ctx2.beginPath();
                        ctx2.moveTo(px, cy - 6);
                        ctx2.lineTo(px, cy + 6);
                        ctx2.stroke();
                        ctx2.fillText(n.toString(), px, cy + 22);
                    }

                    // Goc 0
                    ctx2.fillStyle = '#f43f5e';
                    ctx2.beginPath();
                    ctx2.arc(originX, cy, 6, 0, Math.PI * 2);
                    ctx2.fill();

                    // Diem x
                    const targetX = originX + absX * unitPx;
                    ctx2.fillStyle = '#06b6d4';
                    ctx2.beginPath();
                    ctx2.arc(targetX, cy, 8, 0, Math.PI * 2);
                    ctx2.fill();
                    ctx2.strokeStyle = '#ffffff';
                    ctx2.lineWidth = 2;
                    ctx2.stroke();

                    // Cung khoang cach
                    ctx2.strokeStyle = '#f59e0b';
                    ctx2.lineWidth = 3;
                    ctx2.setLineDash([4, 4]);
                    ctx2.beginPath();
                    ctx2.moveTo(originX, cy - 15);
                    ctx2.lineTo(targetX, cy - 15);
                    ctx2.stroke();
                    ctx2.setLineDash([]);

                    ctx2.fillStyle = '#f59e0b';
                    ctx2.font = 'bold 14px Segoe UI';
                    ctx2.fillText(`Khoảng cách |x| = ${Math.abs(absX)}`, (originX + targetX) / 2, cy - 25);

                    const out = document.getElementById('lab2AbsOut');
                    out.innerHTML = `Điểm $x = ${absX}$ cách gốc 0 một khoảng bằng $|${absX}| = ${Math.abs(absX)}$. (Tổng quát: $|x| \\ge 0$ với mọi $x \\in \\mathbb{R}$)`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 180 * window.devicePixelRatio || 180;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawAbs();
                }

                document.getElementById('sliderAbsX').addEventListener('input', e => {
                    absX = parseFloat(e.target.value);
                    document.getElementById('valAbsX').textContent = absX;
                    drawAbs();
                });

                window.addEventListener('resize', resizeCanvas2);
                setTimeout(resizeCanvas2, 100);
            
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
