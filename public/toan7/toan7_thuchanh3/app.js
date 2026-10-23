// ================================================================
// THỰC HÀNH 3: ĐẠI LƯỢNG TỈ LỆ TRONG ĐỜI SỐNG - TOÁN 7 KNTT
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
  userTitle: 'Nhà Thực Nghiệm Tỉ Lệ 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_thuchanh3_state';

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
    "title": "Câu 1: Tỉ lệ bản đồ",
    "pts": 20,
    "question": "Trên bản đồ có tỉ lệ $1 : 1\\,000\\,000$, khoảng cách giữa hai điểm là $3\\text{ cm}$. Khoảng cách thực tế giữa hai điểm đó là:",
    "options": [
      {
        "text": "$30\\text{ km}$",
        "correct": true
      },
      {
        "text": "$3\\text{ km}$",
        "correct": false
      },
      {
        "text": "$300\\text{ km}$",
        "correct": false
      },
      {
        "text": "$3000\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "$D = 3 \\cdot 1\\,000\\,000 = 3\\,000\\,000\\text{ cm} = 30\\,000\\text{ m} = 30\\text{ km}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Chia phần thưởng theo tỉ lệ",
    "pts": 20,
    "question": "Hai bạn An và Bình cùng làm dự án và được thưởng $1\\,200\\,000$ đồng. Số tiền thưởng chia theo tỉ lệ $2 : 3$. Số tiền bạn An nhận được là:",
    "options": [
      {
        "text": "$480\\,000$ đồng",
        "correct": true
      },
      {
        "text": "$720\\,000$ đồng",
        "correct": false
      },
      {
        "text": "$600\\,000$ đồng",
        "correct": false
      },
      {
        "text": "$400\\,000$ đồng",
        "correct": false
      }
    ],
    "explanation": "Tổng số phần bằng nhau: $2 + 3 = 5$ phần. Số tiền của An là $\\frac{1\\,200\\,000}{5} \\cdot 2 = 480\\,000$ đồng."
  },
  {
    "id": 3,
    "title": "Câu 3: Nấu cơm theo tỉ lệ",
    "pts": 20,
    "question": "Mẹ hướng dẫn An nấu cơm với tỉ lệ 1 bát gạo cần $1,5$ bát nước. Nếu An nấu 4 bát gạo thì cần bao nhiêu bát nước?",
    "options": [
      {
        "text": "$6$ bát nước",
        "correct": true
      },
      {
        "text": "$5$ bát nước",
        "correct": false
      },
      {
        "text": "$4,5$ bát nước",
        "correct": false
      },
      {
        "text": "$7$ bát nước",
        "correct": false
      }
    ],
    "explanation": "Lượng nước tỉ lệ thuận với lượng gạo: $4 \\cdot 1,5 = 6$ bát nước."
  },
  {
    "id": 4,
    "title": "Câu 4: Năng suất và thời gian (tỉ lệ nghịch)",
    "pts": 20,
    "question": "Có 6 công nhân hoàn thành một công việc trong 8 ngày. Muốn hoàn thành công việc đó trong 4 ngày thì cần bao nhiêu công nhân (năng suất như nhau)?",
    "options": [
      {
        "text": "$12$ công nhân",
        "correct": true
      },
      {
        "text": "$10$ công nhân",
        "correct": false
      },
      {
        "text": "$8$ công nhân",
        "correct": false
      },
      {
        "text": "$16$ công nhân",
        "correct": false
      }
    ],
    "explanation": "Số công nhân và số ngày là hai đại lượng tỉ lệ nghịch: $x \\cdot 4 = 6 \\cdot 8 = 48 \\implies x = 12$ công nhân."
  },
  {
    "id": 5,
    "title": "Câu 5: Pha nước muối sinh lý 0,9%",
    "pts": 20,
    "question": "Nước muối sinh lí có nồng độ $0,9\\%$ muối. Để có $1000\\text{ g}$ nước muối sinh lí cần bao nhiêu gam muối tinh khiết?",
    "options": [
      {
        "text": "$9\\text{ g}$",
        "correct": true
      },
      {
        "text": "$90\\text{ g}$",
        "correct": false
      },
      {
        "text": "$0,9\\text{ g}$",
        "correct": false
      },
      {
        "text": "$18\\text{ g}$",
        "correct": false
      }
    ],
    "explanation": "Lượng muối tinh khiết cần dùng là: $1000 \\cdot 0,9\\% = 1000 \\cdot 0,009 = 9\\text{ g}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Vận tốc và thời gian",
    "pts": 20,
    "question": "Một ô tô đi hết quãng đường từ A đến B với vận tốc $60\\text{ km/h}$ trong 3 giờ. Nếu ô tô đi với vận tốc $90\\text{ km/h}$ thì mất bao nhiêu thời gian?",
    "options": [
      {
        "text": "$2$ giờ",
        "correct": true
      },
      {
        "text": "$2,5$ giờ",
        "correct": false
      },
      {
        "text": "$1,5$ giờ",
        "correct": false
      },
      {
        "text": "$4,5$ giờ",
        "correct": false
      }
    ],
    "explanation": "Quãng đường $S = 60 \\cdot 3 = 180\\text{ km}$. Thời gian đi với vận tốc $90\\text{ km/h}$ là $t = 180 : 90 = 2$ giờ."
  },
  {
    "id": 7,
    "title": "Câu 7: Tỉ lệ bánh mì và bột mì",
    "pts": 20,
    "question": "Cứ $2\\text{ kg}$ bột mì làm được 15 chiếc bánh mì. Hỏi để làm 60 chiếc bánh mì như vậy cần bao nhiêu kilôgam bột mì?",
    "options": [
      {
        "text": "$8\\text{ kg}$",
        "correct": true
      },
      {
        "text": "$6\\text{ kg}$",
        "correct": false
      },
      {
        "text": "$10\\text{ kg}$",
        "correct": false
      },
      {
        "text": "$12\\text{ kg}$",
        "correct": false
      }
    ],
    "explanation": "Số bánh gấp lên $60 : 15 = 4$ lần, nên lượng bột mì cần dùng là $2 \\cdot 4 = 8\\text{ kg}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tiền công tỉ lệ thuận",
    "pts": 20,
    "question": "Một người làm việc trong 5 ngày được trả tiền công $1\\,500\\,000$ đồng. Với mức công đó, nếu người đó làm trong 8 ngày thì nhận được bao nhiêu tiền?",
    "options": [
      {
        "text": "$2\\,400\\,000$ đồng",
        "correct": true
      },
      {
        "text": "$2\\,100\\,000$ đồng",
        "correct": false
      },
      {
        "text": "$2\\,800\\,000$ đồng",
        "correct": false
      },
      {
        "text": "$3\\,000\\,000$ đồng",
        "correct": false
      }
    ],
    "explanation": "Tiền công mỗi ngày là $1\\,500\\,000 : 5 = 300\\,000$ đồng. Trong 8 ngày nhận được: $300\\,000 \\cdot 8 = 2\\,400\\,000$ đồng."
  },
  {
    "id": 9,
    "title": "Câu 9: Bơm nước vào bể",
    "pts": 20,
    "question": "Dùng 2 máy bơm cùng loại thì mất 6 giờ để bơm đầy một bể nước. Nếu dùng 3 máy bơm cùng loại đó thì mất bao nhiêu giờ?",
    "options": [
      {
        "text": "$4$ giờ",
        "correct": true
      },
      {
        "text": "$9$ giờ",
        "correct": false
      },
      {
        "text": "$3$ giờ",
        "correct": false
      },
      {
        "text": "$5$ giờ",
        "correct": false
      }
    ],
    "explanation": "Số máy bơm và thời gian tỉ lệ nghịch: $2 \\cdot 6 = 3 \\cdot t \\implies 12 = 3t \\implies t = 4$ giờ."
  },
  {
    "id": 10,
    "title": "Câu 10: Chia số học sinh nam nữ",
    "pts": 20,
    "question": "Một lớp học có 45 học sinh, số học sinh nam và nữ tỉ lệ với $4 : 5$. Số học sinh nam của lớp là:",
    "options": [
      {
        "text": "$20$ học sinh",
        "correct": true
      },
      {
        "text": "$25$ học sinh",
        "correct": false
      },
      {
        "text": "$18$ học sinh",
        "correct": false
      },
      {
        "text": "$22$ học sinh",
        "correct": false
      }
    ],
    "explanation": "Số phần bằng nhau: $4 + 5 = 9$. Số học sinh nam là $\\frac{45}{9} \\cdot 4 = 20$ học sinh."
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
    
const canvas1 = document.getElementById('labCanvas1');
if (canvas1) {
  const ctx = canvas1.getContext('2d');
  const slider = document.getElementById('lab1Vol');
  const lbl = document.getElementById('lab1ValV');

  function draw(vol) {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`MÁY TÍNH PHA CHẾ NƯỚC SÁT KHUẨN 70° (TỔNG = ${vol} ml)`, canvas1.width / 2, 28);

    // Công thức: 7 phần cồn 90°, 2 phần nước cất
    const con = Math.round((vol * 7) / 9);
    const nuoc = vol - con;

    // Bình chứa
    const bx = 110, by = 60, bw = 90, bh = 130;
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.strokeRect(bx, by, bw, bh);

    // Mức nước cất
    const hNuoc = (nuoc / vol) * bh;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.4)';
    ctx.fillRect(bx, by + bh - hNuoc, bw, hNuoc);

    // Mức cồn
    const hCon = (con / vol) * bh;
    ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.fillRect(bx, by + bh - hNuoc - hCon, bw, hCon);

    ctx.fillStyle = '#fff';
    ctx.font = '12px sans-serif';
    ctx.fillText(`Cồn: ${con} ml`, bx + bw/2, by + bh - hNuoc - hCon/2 + 4);
    ctx.fillText(`Nước: ${nuoc} ml`, bx + bw/2, by + bh - hNuoc/2 + 4);

    // Số liệu chi tiết
    ctx.textAlign = 'left';
    ctx.font = '15px sans-serif';
    const tx = 250;

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('QUY TẮC PHA CHẾ TỈ LỆ 7 : 2:', tx, 75);

    ctx.fillStyle = '#10b981';
    ctx.fillText(`• Lượng cồn 90°: (7/9) · ${vol} ≈ ${con} ml`, tx, 105);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`• Lượng nước cất: (2/9) · ${vol} ≈ ${nuoc} ml`, tx, 135);

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`=> Tỉ số kiểm tra: ${con} : ${nuoc} ≈ 7 : 2 ✓`, tx, 175);
  }

  if (slider) {
    slider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      if (lbl) lbl.textContent = `${v} ml`;
      draw(v);
    });
    draw(parseInt(slider.value));
  }
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');
  const slider = document.getElementById('lab2D');
  const lbl = document.getElementById('lab2ValD');

  function draw2(d) {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(`QUY ĐỔI TỈ LỆ BẢN ĐỒ 1 : 2.000.000 (d = ${d} cm)`, canvas2.width / 2, 28);

    // Tính km thực tế: 1 cm trên bản đồ = 2.000.000 cm = 20 km thực tế
    const realKm = d * 20;

    // Vẽ mô phỏng thước đo trên bản đồ
    const startX = 80, startY = 110;
    const pxLen = d * 18;

    ctx2.strokeStyle = '#64748b';
    ctx2.lineWidth = 2;
    ctx2.strokeRect(startX - 20, startY - 40, 240, 80);
    ctx2.fillStyle = 'rgba(30, 41, 59, 0.4)';
    ctx2.fillRect(startX - 20, startY - 40, 240, 80);

    // Đoạn thẳng d
    ctx2.strokeStyle = '#ef4444';
    ctx2.lineWidth = 3;
    ctx2.beginPath();
    ctx2.moveTo(startX, startY);
    ctx2.lineTo(startX + pxLen, startY);
    ctx2.stroke();

    ctx2.fillStyle = '#38bdf8';
    ctx2.beginPath(); ctx2.arc(startX, startY, 5, 0, Math.PI*2); ctx2.fill();
    ctx2.beginPath(); ctx2.arc(startX + pxLen, startY, 5, 0, Math.PI*2); ctx2.fill();

    ctx2.fillStyle = '#fff';
    ctx2.font = 'bold 13px sans-serif';
    ctx2.fillText('TP. A', startX, startY - 12);
    ctx2.fillText('TP. B', startX + pxLen, startY - 12);
    ctx2.fillText(`d = ${d} cm`, startX + pxLen / 2, startY + 20);

    // Kết quả
    ctx2.textAlign = 'left';
    ctx2.font = '15px sans-serif';
    const tx = 340;

    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText('CÔNG THỨC QUY ĐỔI:', tx, 75);

    ctx2.fillStyle = '#cbd5e1';
    ctx2.fillText(`• Tỉ lệ 1 : 2.000.000`, tx, 105);
    ctx2.fillText(`  => 1 cm = 20 km thực tế`, tx, 130);

    ctx2.font = 'bold 16px sans-serif';
    ctx2.fillStyle = '#10b981';
    ctx2.fillText(`• Khoảng cách thực địa:`, tx, 165);
    ctx2.fillText(`  D = ${d} · 20 = ${realKm} km ✓`, tx, 195);
  }

  if (slider) {
    slider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      if (lbl) lbl.textContent = `d = ${v} cm`;
      draw2(v);
    });
    draw2(parseInt(slider.value));
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
