// ================================================================
// BÀI 2: CỘNG, TRỪ, NHÂN, CHIA SỐ HỮU TỈ - TOÁN 7 KNTT
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
  userTitle: 'Chuyên Gia Tính Toán Hữu Tỉ 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai2_state';

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
    "title": "Câu 1: Phép cộng hai phân số cùng mẫu",
    "pts": 20,
    "question": "Kết quả của phép tính $\\frac{-5}{9} + \\frac{2}{9}$ là:",
    "options": [
      {
        "text": "$-\\frac{1}{3}$",
        "correct": true
      },
      {
        "text": "$-\\frac{7}{9}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{3}$",
        "correct": false
      },
      {
        "text": "$-\\frac{3}{18}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{-5}{9} + \\frac{2}{9} = \\frac{-5 + 2}{9} = \\frac{-3}{9} = -\\frac{1}{3}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Phép trừ số hữu tỉ khác mẫu",
    "pts": 20,
    "question": "Tính giá trị của biểu thức $A = \\frac{1}{2} - \\left(-\\frac{1}{3}\\right)$:",
    "options": [
      {
        "text": "$\\frac{5}{6}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{6}$",
        "correct": false
      },
      {
        "text": "$-\\frac{5}{6}$",
        "correct": false
      },
      {
        "text": "$-\\frac{1}{6}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $A = \\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Phép nhân số hữu tỉ",
    "pts": 20,
    "question": "Kết quả của phép tính $\\left(-\\frac{3}{8}\\right) \\cdot \\frac{4}{9}$ là:",
    "options": [
      {
        "text": "$-\\frac{1}{6}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{6}$",
        "correct": false
      },
      {
        "text": "$-\\frac{12}{72}$",
        "correct": false
      },
      {
        "text": "$-\\frac{7}{17}$",
        "correct": false
      }
    ],
    "explanation": "Rút gọn chéo trước khi nhân: $\\frac{-3}{8} \\cdot \\frac{4}{9} = \\frac{-1 \\cdot 1}{2 \\cdot 3} = -\\frac{1}{6}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Phép chia phân số",
    "pts": 20,
    "question": "Giá trị của biểu thức $\\frac{-5}{12} : \\frac{15}{4}$ bằng:",
    "options": [
      {
        "text": "$-\\frac{1}{9}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{9}$",
        "correct": false
      },
      {
        "text": "$-\\frac{25}{16}$",
        "correct": false
      },
      {
        "text": "$-\\frac{1}{3}$",
        "correct": false
      }
    ],
    "explanation": "Ta nhân với nghịch đảo: $\\frac{-5}{12} \\cdot \\frac{4}{15} = \\frac{-5 \\cdot 4}{12 \\cdot 15} = \\frac{-1 \\cdot 1}{3 \\cdot 3} = -\\frac{1}{9}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Số nghịch đảo của số hữu tỉ",
    "pts": 20,
    "question": "Số nghịch đảo của $-2\\frac{1}{3}$ là:",
    "options": [
      {
        "text": "$-\\frac{3}{7}$",
        "correct": true
      },
      {
        "text": "$\\frac{3}{7}$",
        "correct": false
      },
      {
        "text": "$-\\frac{7}{3}$",
        "correct": false
      },
      {
        "text": "$2\\frac{1}{3}$",
        "correct": false
      }
    ],
    "explanation": "Đổi hỗn số sang phân số: $-2\\frac{1}{3} = -\\frac{7}{3}$. Số nghịch đảo của $-\\frac{7}{3}$ là $-\\frac{3}{7}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tính nhanh bằng phân phối",
    "pts": 20,
    "question": "Tính hợp lí: $B = \\frac{7}{11} \\cdot \\frac{3}{4} + \\frac{7}{11} \\cdot \\frac{1}{4}$:",
    "options": [
      {
        "text": "$\\frac{7}{11}$",
        "correct": true
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$\\frac{28}{11}$",
        "correct": false
      },
      {
        "text": "$\\frac{7}{44}$",
        "correct": false
      }
    ],
    "explanation": "Đặt thừa số chung $\\frac{7}{11}$: $B = \\frac{7}{11} \\left(\\frac{3}{4} + \\frac{1}{4}\\right) = \\frac{7}{11} \\cdot 1 = \\frac{7}{11}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Quy tắc dấu ngoặc",
    "pts": 20,
    "question": "Bỏ dấu ngoặc trong biểu thức $-\\left(x - \\frac{2}{3} + y\\right)$, ta thu được kết quả là:",
    "options": [
      {
        "text": "$-x + \\frac{2}{3} - y$",
        "correct": true
      },
      {
        "text": "$-x - \\frac{2}{3} + y$",
        "correct": false
      },
      {
        "text": "$-x + \\frac{2}{3} + y$",
        "correct": false
      },
      {
        "text": "$x - \\frac{2}{3} + y$",
        "correct": false
      }
    ],
    "explanation": "Dấu trừ đứng trước ngoặc nên khi bỏ ngoặc ta đổi dấu tất cả các số hạng: $+x \\to -x$, $-\\frac{2}{3} \\to +\\frac{2}{3}$, $+y \\to -y$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tìm x từ phép toán cơ bản",
    "pts": 20,
    "question": "Tìm số hữu tỉ $x$ biết: $x + \\frac{1}{3} = -\\frac{5}{6}$:",
    "options": [
      {
        "text": "$x = -\\frac{7}{6}$",
        "correct": true
      },
      {
        "text": "$x = -\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$x = \\frac{7}{6}$",
        "correct": false
      },
      {
        "text": "$x = -\\frac{3}{6}$",
        "correct": false
      }
    ],
    "explanation": "Chuyển vế $\\frac{1}{3}$ sang vế phải: $x = -\\frac{5}{6} - \\frac{1}{3} = -\\frac{5}{6} - \\frac{2}{6} = -\\frac{7}{6}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Tính giá trị biểu thức phân số",
    "pts": 20,
    "question": "Giá trị của biểu thức $C = \\left(\\frac{2}{3} - \\frac{1}{2}\\right) : \\frac{5}{6}$ là:",
    "options": [
      {
        "text": "$\\frac{1}{5}$",
        "correct": true
      },
      {
        "text": "$\\frac{5}{36}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{6}$",
        "correct": false
      }
    ],
    "explanation": "Tính trong ngoặc trước: $\\frac{2}{3} - \\frac{1}{2} = \\frac{4 - 3}{6} = \\frac{1}{6}$. Sau đó chia: $\\frac{1}{6} : \\frac{5}{6} = \\frac{1}{6} \\cdot \\frac{6}{5} = \\frac{1}{5}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Bài toán thực tế về số hữu tỉ",
    "pts": 20,
    "question": "Một ô tô chạy quãng đường $120\\,\\text{km}$ hết $2\\frac{1}{2}\\,\\text{giờ}$. Vận tốc trung bình của ô tô là:",
    "options": [
      {
        "text": "$48\\,\\text{km/h}$",
        "correct": true
      },
      {
        "text": "$50\\,\\text{km/h}$",
        "correct": false
      },
      {
        "text": "$60\\,\\text{km/h}$",
        "correct": false
      },
      {
        "text": "$45\\,\\text{km/h}$",
        "correct": false
      }
    ],
    "explanation": "Đổi $2\\frac{1}{2}\\,\\text{giờ} = \\frac{5}{2}\\,\\text{giờ}$. Vận tốc $v = s : t = 120 : \\frac{5}{2} = 120 \\cdot \\frac{2}{5} = 48\\,\\text{km/h}$."
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
    
                function gcd(x, y) {
                    x = Math.abs(x); y = Math.abs(y);
                    while (y) { let t = y; y = x % y; x = t; }
                    return x;
                }

                function compute() {
                    const a = parseInt(document.getElementById('l1_a').value) || 0;
                    const b = parseInt(document.getElementById('l1_b').value) || 1;
                    const c = parseInt(document.getElementById('l1_c').value) || 0;
                    const d = parseInt(document.getElementById('l1_d').value) || 1;
                    const op = document.getElementById('l1_op').value;
                    const out = document.getElementById('lab1CalcOut');

                    if (b === 0 || d === 0) {
                        out.innerHTML = '<span style="color:#f43f5e;">Lỗi: Mẫu số phải khác 0!</span>';
                        return;
                    }
                    if (op === '/' && c === 0) {
                        out.innerHTML = '<span style="color:#f43f5e;">Lỗi: Không thể chia cho số 0!</span>';
                        return;
                    }

                    let resNum = 0, resDen = 1, stepHtml = '';

                    if (op === '+') {
                        resNum = a * d + b * c;
                        resDen = b * d;
                        stepHtml = `$$\\frac{${a}}{${b}} + \\frac{${c}}{${d}} = \\frac{${a} \\cdot ${d} + ${b} \\cdot ${c}}{${b} \\cdot ${d}} = \\frac{${resNum}}{${resDen}}$$`;
                    } else if (op === '-') {
                        resNum = a * d - b * c;
                        resDen = b * d;
                        stepHtml = `$$\\frac{${a}}{${b}} - \\frac{${c}}{${d}} = \\frac{${a} \\cdot ${d} - ${b} \\cdot ${c}}{${b} \\cdot ${d}} = \\frac{${resNum}}{${resDen}}$$`;
                    } else if (op === '*') {
                        resNum = a * c;
                        resDen = b * d;
                        stepHtml = `$$\\frac{${a}}{${b}} \\cdot \\frac{${c}}{${d}} = \\frac{${a} \\cdot ${c}}{${b} \\cdot ${d}} = \\frac{${resNum}}{${resDen}}$$`;
                    } else if (op === '/') {
                        resNum = a * d;
                        resDen = b * c;
                        stepHtml = `$$\\frac{${a}}{${b}} : \\frac{${c}}{${d}} = \\frac{${a}}{${b}} \\cdot \\frac{${d}}{${c}} = \\frac{${resNum}}{${resDen}}$$`;
                    }

                    // Rut gon
                    if (resDen < 0) { resNum = -resNum; resDen = -resDen; }
                    const g = gcd(resNum, resDen);
                    const simNum = resNum / g;
                    const simDen = resDen / g;

                    let finalStr = (simDen === 1) ? `$${simNum}$` : `$$\\frac{${simNum}}{${simDen}}$$`;
                    out.innerHTML = `<strong>Các bước thực hiện:</strong><br>${stepHtml}<br><strong>Kết quả tối giản:</strong> ${finalStr}`;
                    renderMathInTree(out);
                }

                document.getElementById('btnCalcLab1').addEventListener('click', compute);
                setTimeout(compute, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let da = 4, db = 3, dc = 5;

                function drawDist() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const scale = 22;
                    const startX = 50;
                    const startY = 40;
                    const hRect = da * scale;
                    const wB = db * scale;
                    const wC = dc * scale;

                    // Hinh chu nhat 1 (a x b)
                    ctx2.fillStyle = 'rgba(245, 158, 11, 0.45)';
                    ctx2.fillRect(startX, startY, wB, hRect);
                    ctx2.strokeStyle = '#f59e0b';
                    ctx2.lineWidth = 2;
                    ctx2.strokeRect(startX, startY, wB, hRect);

                    // Hinh chu nhat 2 (a x c)
                    ctx2.fillStyle = 'rgba(6, 182, 212, 0.45)';
                    ctx2.fillRect(startX + wB, startY, wC, hRect);
                    ctx2.strokeStyle = '#06b6d4';
                    ctx2.lineWidth = 2;
                    ctx2.strokeRect(startX + wB, startY, wC, hRect);

                    // Chu thich
                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 13px Segoe UI';
                    ctx2.textAlign = 'center';
                    ctx2.fillText(`S1 = ${da} × ${db} = ${da*db}`, startX + wB/2, startY + hRect/2);
                    ctx2.fillText(`S2 = ${da} × ${dc} = ${da*dc}`, startX + wB + wC/2, startY + hRect/2);

                    ctx2.fillStyle = '#818cf8';
                    ctx2.fillText(`Chiều cao a = ${da}`, startX - 25, startY + hRect/2);

                    const totalArea = da * (db + dc);
                    const outEl2 = document.getElementById('lab2DistOut');
                    outEl2.innerHTML = `Diện tích toàn phần: $S = a \\cdot (b + c) = ${da} \\cdot (${db} + ${dc}) = ${da} \\cdot ${db + dc} = ${totalArea}$<br>Tổng hai diện tích con: $S_1 + S_2 = (${da} \\cdot ${db}) + (${da} \\cdot ${dc}) = ${da*db} + ${da*dc} = ${totalArea}$.`;
                    renderMathInTree(outEl2);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 200 * window.devicePixelRatio || 200;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawDist();
                }

                document.getElementById('sliderDistA').addEventListener('input', e => {
                    da = parseInt(e.target.value);
                    document.getElementById('valDistA').textContent = da;
                    drawDist();
                });
                document.getElementById('sliderDistB').addEventListener('input', e => {
                    db = parseInt(e.target.value);
                    document.getElementById('valDistB').textContent = db;
                    drawDist();
                });
                document.getElementById('sliderDistC').addEventListener('input', e => {
                    dc = parseInt(e.target.value);
                    document.getElementById('valDistC').textContent = dc;
                    drawDist();
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
