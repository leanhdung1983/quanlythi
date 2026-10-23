// ================================================================
// BÀI 23: ĐẠI LƯỢNG TỈ LỆ NGHỊCH - TOÁN 7 KNTT
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
  userTitle: 'Chuyên Gia Tỉ Lệ Nghịch 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai23_state';

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
    "title": "Câu 1: Định nghĩa tỉ lệ nghịch",
    "pts": 20,
    "question": "Nếu đại lượng $y$ liên hệ với $x$ theo công thức $y = \\frac{a}{x}$ ($a \\neq 0$) thì:",
    "options": [
      {
        "text": "$y$ tỉ lệ nghịch với $x$ theo hệ số $a$",
        "correct": true
      },
      {
        "text": "$y$ tỉ lệ thuận với $x$ theo hệ số $a$",
        "correct": false
      },
      {
        "text": "$x$ tỉ lệ thuận với $y$ theo hệ số $a$",
        "correct": false
      },
      {
        "text": "$y$ và $x$ là hai số đối nhau",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa SGK: $y = \\frac{a}{x}$ nghĩa là $y$ tỉ lệ nghịch với $x$ theo hệ số tỉ lệ $a$."
  },
  {
    "id": 2,
    "title": "Câu 2: Tìm hệ số tỉ lệ nghịch",
    "pts": 20,
    "question": "Cho $x$ và $y$ tỉ lệ nghịch với nhau. Khi $x = 4$ thì $y = 6$. Hệ số tỉ lệ $a$ bằng:",
    "options": [
      {
        "text": "$a = 24$",
        "correct": true
      },
      {
        "text": "$a = 10$",
        "correct": false
      },
      {
        "text": "$a = 1,5$",
        "correct": false
      },
      {
        "text": "$a = 2$",
        "correct": false
      }
    ],
    "explanation": "Hệ số tỉ lệ $a = x \\cdot y = 4 \\cdot 6 = 24$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính giá trị tương ứng",
    "pts": 20,
    "question": "Cho $x$ và $y$ tỉ lệ nghịch theo hệ số $a = 36$. Khi $x = -6$ thì $y$ bằng:",
    "options": [
      {
        "text": "$y = -6$",
        "correct": true
      },
      {
        "text": "$y = 6$",
        "correct": false
      },
      {
        "text": "$y = -30$",
        "correct": false
      },
      {
        "text": "$y = 42$",
        "correct": false
      }
    ],
    "explanation": "Ta có $y = \\frac{a}{x} = \\frac{36}{-6} = -6$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính chất tích không đổi",
    "pts": 20,
    "question": "Cho hai đại lượng $x$ và $y$ tỉ lệ nghịch. Hệ thức nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$x_1 \\cdot y_1 = x_2 \\cdot y_2$",
        "correct": true
      },
      {
        "text": "$\\frac{x_1}{y_1} = \\frac{x_2}{y_2}$",
        "correct": false
      },
      {
        "text": "$x_1 + y_1 = x_2 + y_2$",
        "correct": false
      },
      {
        "text": "$\\frac{x_1}{x_2} = \\frac{y_1}{y_2}$",
        "correct": false
      }
    ],
    "explanation": "Tính chất của hai đại lượng tỉ lệ nghịch là tích của hai giá trị tương ứng luôn không đổi: $x_1 y_1 = x_2 y_2 = a$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tỉ số nghịch đảo",
    "pts": 20,
    "question": "Nếu $x$ và $y$ tỉ lệ nghịch thì tỉ số $\\frac{x_1}{x_2}$ bằng:",
    "options": [
      {
        "text": "$\\frac{y_2}{y_1}$",
        "correct": true
      },
      {
        "text": "$\\frac{y_1}{y_2}$",
        "correct": false
      },
      {
        "text": "$\\frac{x_2}{y_2}$",
        "correct": false
      },
      {
        "text": "$-1$",
        "correct": false
      }
    ],
    "explanation": "Vì $x_1 y_1 = x_2 y_2$ nên suy ra $\\frac{x_1}{x_2} = \\frac{y_2}{y_1}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Bài toán công nhân xây dựng",
    "pts": 20,
    "question": "Có $12$ công nhân hoàn thành một công việc trong $8$ ngày. Muốn hoàn thành công việc đó trong $6$ ngày thì cần bao nhiêu công nhân (năng suất như nhau)?",
    "options": [
      {
        "text": "$16$ công nhân",
        "correct": true
      },
      {
        "text": "$14$ công nhân",
        "correct": false
      },
      {
        "text": "$18$ công nhân",
        "correct": false
      },
      {
        "text": "$20$ công nhân",
        "correct": false
      }
    ],
    "explanation": "Số công nhân và số ngày là hai đại lượng tỉ lệ nghịch: $x \\cdot 6 = 12 \\cdot 8 = 96 \\implies x = 96 : 6 = 16$ công nhân."
  },
  {
    "id": 7,
    "title": "Câu 7: Vận tốc và thời gian",
    "pts": 20,
    "question": "Một ô tô đi hết quãng đường với vận tốc $50\\text{ km/h}$ mất $3$ giờ. Nếu ô tô đi với vận tốc $60\\text{ km/h}$ thì mất bao lâu?",
    "options": [
      {
        "text": "$2,5$ giờ",
        "correct": true
      },
      {
        "text": "$2$ giờ",
        "correct": false
      },
      {
        "text": "$3,6$ giờ",
        "correct": false
      },
      {
        "text": "$2,8$ giờ",
        "correct": false
      }
    ],
    "explanation": "Quãng đường $S = 50 \\times 3 = 150\\text{ km}$. Thời gian đi với vận tốc $60\\text{ km/h}$ là $150 : 60 = 2,5$ giờ."
  },
  {
    "id": 8,
    "title": "Câu 8: Nhận dạng bảng số liệu",
    "pts": 20,
    "question": "Bảng số liệu nào sau đây thể hiện hai đại lượng $x$ và $y$ tỉ lệ nghịch?",
    "options": [
      {
        "text": "$x = 2, 3, 4$ ứng với $y = 12, 8, 6$",
        "correct": true
      },
      {
        "text": "$x = 2, 3, 4$ ứng với $y = 4, 6, 8$",
        "correct": false
      },
      {
        "text": "$x = 1, 2, 3$ ứng với $y = 3, 2, 1$",
        "correct": false
      },
      {
        "text": "$x = 2, 4, 6$ ứng với $y = 12, 6, 3$",
        "correct": false
      }
    ],
    "explanation": "Xét các tích: $2 \\cdot 12 = 24$, $3 \\cdot 8 = 24$, $4 \\cdot 6 = 24$. Các tích đều bằng $24$ nên $x$ và $y$ tỉ lệ nghịch."
  },
  {
    "id": 9,
    "title": "Câu 9: Bánh răng xe đạp",
    "pts": 20,
    "question": "Một cặp bánh răng ăn khớp với nhau. Bánh thứ nhất có $40$ răng quay $15$ vòng/phút. Bánh thứ hai có $20$ răng sẽ quay:",
    "options": [
      {
        "text": "$30$ vòng/phút",
        "correct": true
      },
      {
        "text": "$25$ vòng/phút",
        "correct": false
      },
      {
        "text": "$10$ vòng/phút",
        "correct": false
      },
      {
        "text": "$20$ vòng/phút",
        "correct": false
      }
    ],
    "explanation": "Số răng và số vòng quay là hai đại lượng tỉ lệ nghịch: $40 \\times 15 = 20 \\times y \\implies y = 600 : 20 = 30$ vòng/phút."
  },
  {
    "id": 10,
    "title": "Câu 10: Chia công việc theo năng suất",
    "pts": 20,
    "question": "Ba đội máy cày cày trên ba cánh đồng có cùng diện tích. Đội 1 cày xong trong $3$ ngày, đội 2 trong $4$ ngày, đội 3 trong $6$ ngày. Số máy của ba đội tỉ lệ nghịch với:",
    "options": [
      {
        "text": "$3; 4; 6$",
        "correct": true
      },
      {
        "text": "$6; 4; 3$",
        "correct": false
      },
      {
        "text": "$1; 2; 3$",
        "correct": false
      },
      {
        "text": "$4; 3; 2$",
        "correct": false
      }
    ],
    "explanation": "Số máy cày và số ngày hoàn thành công việc là hai đại lượng tỉ lệ nghịch, do đó số máy tỉ lệ nghịch với $3; 4; 6$."
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
  let a = 24;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ox = 50, oy = 230;

    // Trục toạ độ
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, 20);
    ctx.lineTo(ox, oy);
    ctx.lineTo(canvas.width - 20, oy);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('x (đầu vào)', canvas.width - 70, oy - 8);
    ctx.fillText('y (đầu ra)', ox + 10, 30);
    ctx.fillText('O', ox - 15, oy + 15);

    // Vẽ đường cong hyperbol nhánh dương y = a/x
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const scaleX = 35, scaleY = 7;
    let first = true;
    for (let x = 1; x <= 8; x += 0.2) {
      const y = a / x;
      const px = ox + x * scaleX;
      const py = oy - y * scaleY;
      if (first) { ctx.moveTo(px, py); first = false; }
      else { ctx.lineTo(px, py); }
    }
    ctx.stroke();

    // Điểm mẫu (4, a/4)
    const testX = 4;
    const testY = a / testX;
    const px = ox + testX * scaleX;
    const py = oy - testY * scaleY;

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`(${testX}; ${testY}) -> Tích = ${testX * testY}`, px + 10, py - 10);

    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Công thức: y = ${a}/x (Tích x · y = ${a})`, canvas.width - 30, 45);
  }
  draw();

  const sliderA = document.getElementById('sliderLab1A');
  if (sliderA) {
    sliderA.oninput = (e) => {
      a = parseInt(e.target.value);
      draw();
    };
  }
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');
  let v = 40; // Vận tốc km/h trên quãng đường 120 km

  function draw2() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    const S = 120;
    const t = S / v;

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(`BÀI TOÁN CHUYỂN ĐỘNG: QUÃNG ĐƯỜNG S = 120 km`, canvas2.width / 2, 30);

    // Vẽ xe chuyển động
    ctx2.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx2.fillRect(50, 70, canvas2.width - 100, 70);

    ctx2.font = 'bold 18px sans-serif';
    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText(`Vận tốc v = ${v} km/h`, canvas2.width / 2, 100);

    ctx2.font = 'bold 20px sans-serif';
    ctx2.fillStyle = '#10b981';
    ctx2.fillText(`Thời gian t = S / v = 120 / ${v} = ${t.toFixed(1)} giờ`, canvas2.width / 2, 130);

    ctx2.font = '14px sans-serif';
    ctx2.fillStyle = '#cbd5e1';
    ctx2.fillText('Nhận xét: Vận tốc càng tăng thì thời gian đi càng giảm!', canvas2.width / 2, 180);

    ctx2.fillStyle = '#f59e0b';
    ctx2.fillText(`Tích không đổi: v · t = ${v} · ${t.toFixed(1)} = 120`, canvas2.width / 2, 215);
  }
  draw2();

  const sliderV = document.getElementById('sliderLab2V');
  if (sliderV) {
    sliderV.oninput = (e) => {
      v = parseInt(e.target.value);
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
