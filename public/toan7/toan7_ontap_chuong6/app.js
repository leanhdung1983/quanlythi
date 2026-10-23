// ================================================================
// BÀI TẬP CUỐI CHƯƠNG VI - TỔNG ÔN TỈ LỆ THỨC & ĐẠI LƯỢNG TỈ LỆ - TOÁN 7 KNTT
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
  userTitle: 'Bậc Thầy Tỉ Lệ Chương VI',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_ontap_chuong6_state';

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
    "title": "Câu 1: Nhận biết tỉ lệ thức",
    "pts": 20,
    "question": "Cho bốn số $2; 3; 8; 12$. Tỉ lệ thức nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$\\frac{2}{3} = \\frac{8}{12}$",
        "correct": true
      },
      {
        "text": "$\\frac{2}{8} = \\frac{12}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{2} = \\frac{8}{12}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{12} = \\frac{8}{3}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $2 \\cdot 12 = 3 \\cdot 8 = 24$. Do đó $\\frac{2}{3} = \\frac{8}{12}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Tìm x từ tỉ lệ thức",
    "pts": 20,
    "question": "Tìm $x$ biết $\\frac{x}{8} = \\frac{-3}{4}$:",
    "options": [
      {
        "text": "$x = -6$",
        "correct": true
      },
      {
        "text": "$x = 6$",
        "correct": false
      },
      {
        "text": "$x = -8$",
        "correct": false
      },
      {
        "text": "$x = -4$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng tích chéo: $x \\cdot 4 = 8 \\cdot (-3) = -24 \\implies x = -24 : 4 = -6$."
  },
  {
    "id": 3,
    "title": "Câu 3: Dãy tỉ số bằng nhau",
    "pts": 20,
    "question": "Tìm hai số $x, y$ biết $\\frac{x}{4} = \\frac{y}{7}$ và $x + y = 33$:",
    "options": [
      {
        "text": "$x = 12,\\; y = 21$",
        "correct": true
      },
      {
        "text": "$x = 10,\\; y = 23$",
        "correct": false
      },
      {
        "text": "$x = 14,\\; y = 19$",
        "correct": false
      },
      {
        "text": "$x = 8,\\; y = 25$",
        "correct": false
      }
    ],
    "explanation": "$\\frac{x}{4} = \\frac{y}{7} = \\frac{x+y}{4+7} = \\frac{33}{11} = 3$. Vậy $x = 4 \\cdot 3 = 12$ và $y = 7 \\cdot 3 = 21$."
  },
  {
    "id": 4,
    "title": "Câu 4: Đại lượng tỉ lệ thuận",
    "pts": 20,
    "question": "Cho $y$ tỉ lệ thuận với $x$. Khi $x = 5$ thì $y = -10$. Hệ số tỉ lệ của $y$ đối với $x$ là:",
    "options": [
      {
        "text": "$k = -2$",
        "correct": true
      },
      {
        "text": "$k = 2$",
        "correct": false
      },
      {
        "text": "$k = -\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$k = -50$",
        "correct": false
      }
    ],
    "explanation": "Hệ số tỉ lệ $k = \\frac{y}{x} = \\frac{-10}{5} = -2$."
  },
  {
    "id": 5,
    "title": "Câu 5: Đại lượng tỉ lệ nghịch",
    "pts": 20,
    "question": "Cho $y$ tỉ lệ nghịch với $x$. Khi $x = 3$ thì $y = 8$. Khi $x = 6$ thì $y$ bằng:",
    "options": [
      {
        "text": "$y = 4$",
        "correct": true
      },
      {
        "text": "$y = 16$",
        "correct": false
      },
      {
        "text": "$y = 2$",
        "correct": false
      },
      {
        "text": "$y = 12$",
        "correct": false
      }
    ],
    "explanation": "Hệ số tỉ lệ $a = 3 \\cdot 8 = 24$. Khi $x = 6$ thì $y = 24 : 6 = 4$."
  },
  {
    "id": 6,
    "title": "Câu 6: Chia số thành ba phần",
    "pts": 20,
    "question": "Chia số $60$ thành ba phần tỉ lệ với $2; 3; 5$. Số nhỏ nhất là:",
    "options": [
      {
        "text": "$12$",
        "correct": true
      },
      {
        "text": "$18$",
        "correct": false
      },
      {
        "text": "$30$",
        "correct": false
      },
      {
        "text": "$10$",
        "correct": false
      }
    ],
    "explanation": "Giá trị một phần là $60 : (2 + 3 + 5) = 6$. Phần nhỏ nhất là $2 \\cdot 6 = 12$."
  },
  {
    "id": 7,
    "title": "Câu 7: Vận tốc và thời gian",
    "pts": 20,
    "question": "Một người đi xe máy từ A đến B với vận tốc $40\\text{ km/h}$ hết $2$ giờ. Nếu đi với vận tốc $50\\text{ km/h}$ thì thời gian đi là:",
    "options": [
      {
        "text": "$1,6$ giờ",
        "correct": true
      },
      {
        "text": "$2,5$ giờ",
        "correct": false
      },
      {
        "text": "$1,8$ giờ",
        "correct": false
      },
      {
        "text": "$1,5$ giờ",
        "correct": false
      }
    ],
    "explanation": "Quãng đường $AB = 40 \\times 2 = 80\\text{ km}$. Thời gian đi là $80 : 50 = 1,6$ giờ."
  },
  {
    "id": 8,
    "title": "Câu 8: Khối lượng và giá tiền",
    "pts": 20,
    "question": "Mua $3\\text{ kg}$ gạo hết $45\\,000$ đồng. Mua $7\\text{ kg}$ gạo cùng loại hết số tiền là:",
    "options": [
      {
        "text": "$105\\,000$ đồng",
        "correct": true
      },
      {
        "text": "$95\\,000$ đồng",
        "correct": false
      },
      {
        "text": "$115\\,000$ đồng",
        "correct": false
      },
      {
        "text": "$100\\,000$ đồng",
        "correct": false
      }
    ],
    "explanation": "Số tiền tỉ lệ thuận với khối lượng: $(45\\,000 : 3) \\times 7 = 105\\,000$ đồng."
  },
  {
    "id": 9,
    "title": "Câu 9: Tính chất dãy tỉ số với phép trừ",
    "pts": 20,
    "question": "Cho $\\frac{x}{5} = \\frac{y}{2}$ và $x - y = 18$. Giá trị của $x$ là:",
    "options": [
      {
        "text": "$x = 30$",
        "correct": true
      },
      {
        "text": "$x = 12$",
        "correct": false
      },
      {
        "text": "$x = 24$",
        "correct": false
      },
      {
        "text": "$x = 36$",
        "correct": false
      }
    ],
    "explanation": "$\\frac{x}{5} = \\frac{y}{2} = \\frac{x-y}{5-2} = \\frac{18}{3} = 6$. Vậy $x = 5 \\cdot 6 = 30$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tỉ lệ nghịch số vòi nước",
    "pts": 20,
    "question": "Một bể nước có $3$ vòi nước cùng chảy thì đầy bể trong $4$ giờ. Nếu mở $6$ vòi như thế thì đầy bể trong:",
    "options": [
      {
        "text": "$2$ giờ",
        "correct": true
      },
      {
        "text": "$1$ giờ",
        "correct": false
      },
      {
        "text": "$3$ giờ",
        "correct": false
      },
      {
        "text": "$8$ giờ",
        "correct": false
      }
    ],
    "explanation": "Số vòi nước và thời gian chảy đầy bể là hai đại lượng tỉ lệ nghịch: $3 \\times 4 = 6 \\times t \\implies t = 12 : 6 = 2$ giờ."
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

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SO SÁNH BẢN CHẤT: TỈ LỆ THUẬN vs TỈ LỆ NGHỊCH', canvas.width / 2, 30);

    const mid = canvas.width / 2;

    // Cột Tỉ lệ thuận
    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
    ctx.fillRect(20, 50, mid - 30, 190);
    ctx.strokeStyle = '#38bdf8';
    ctx.strokeRect(20, 50, mid - 30, 190);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('TỈ LỆ THUẬN (y = kx)', (20 + mid - 10) / 2, 78);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('• Công thức: y = k · x', (20 + mid - 10) / 2, 110);
    ctx.fillText('• Tỉ số: y / x = k (không đổi)', (20 + mid - 10) / 2, 140);
    ctx.fillText('• x tăng -> y tăng theo', (20 + mid - 10) / 2, 170);
    ctx.fillText('• Ví dụ: Tiền mua hàng, Quãng đường', (20 + mid - 10) / 2, 200);

    // Cột Tỉ lệ nghịch
    ctx.fillStyle = 'rgba(244, 63, 94, 0.1)';
    ctx.fillRect(mid + 10, 50, mid - 30, 190);
    ctx.strokeStyle = '#f43f5e';
    ctx.strokeRect(mid + 10, 50, mid - 30, 190);

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('TỈ LỆ NGHỊCH (xy = a)', (mid + 10 + canvas.width - 20) / 2, 78);
    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('• Công thức: x · y = a', (mid + 10 + canvas.width - 20) / 2, 110);
    ctx.fillText('• Tích: x · y = a (không đổi)', (mid + 10 + canvas.width - 20) / 2, 140);
    ctx.fillText('• x tăng -> y giảm tương ứng', (mid + 10 + canvas.width - 20) / 2, 170);
    ctx.fillText('• Ví dụ: Vận tốc - Thời gian', (mid + 10 + canvas.width - 20) / 2, 200);
  }
  draw();
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');

  function draw2() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('SƠ ĐỒ TỔNG KẾT TOÀN DIỆN CHƯƠNG VI', canvas2.width / 2, 35);

    // Khung trung tâm
    ctx2.fillStyle = 'rgba(99, 102, 241, 0.3)';
    ctx2.strokeStyle = '#818cf8';
    ctx2.lineWidth = 2;
    ctx2.fillRect(canvas2.width/2 - 90, 60, 180, 45);
    ctx2.strokeRect(canvas2.width/2 - 90, 60, 180, 45);

    ctx2.fillStyle = '#ffffff';
    ctx2.font = 'bold 15px sans-serif';
    ctx2.fillText('CHƯƠNG VI: TỈ LỆ', canvas2.width/2, 88);

    // 3 nhánh
    const yB = 160;
    const items = [
      { t: '1. Tỉ lệ thức', sub: 'a·d = b·c', col: '#38bdf8', x: 100 },
      { t: '2. Dãy tỉ số', sub: '(a+c)/(b+d)', col: '#10b981', x: canvas2.width/2 },
      { t: '3. Hàm tỉ lệ', sub: 'Thuận & Nghịch', col: '#f59e0b', x: canvas2.width - 100 }
    ];

    items.forEach(it => {
      ctx2.strokeStyle = '#64748b';
      ctx2.beginPath();
      ctx2.moveTo(canvas2.width/2, 105);
      ctx2.lineTo(it.x, yB - 20);
      ctx2.stroke();

      ctx2.fillStyle = 'rgba(15, 23, 42, 0.8)';
      ctx2.strokeStyle = it.col;
      ctx2.fillRect(it.x - 70, yB - 20, 140, 55);
      ctx2.strokeRect(it.x - 70, yB - 20, 140, 55);

      ctx2.fillStyle = it.col;
      ctx2.font = 'bold 13px sans-serif';
      ctx2.fillText(it.t, it.x, yB + 3);
      ctx2.font = '12px sans-serif';
      ctx2.fillStyle = '#94a3b8';
      ctx2.fillText(it.sub, it.x, yB + 23);
    });
  }
  draw2();
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
