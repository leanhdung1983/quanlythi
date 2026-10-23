// ================================================================
// BÀI TẬP CUỐI CHƯƠNG VII - TOÁN 7 KNTT
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
  userTitle: 'Đại Kiện Tướng Đại Số 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_ontap_chuong7_state';

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
    "title": "Câu 1: Bậc của đa thức tổng hợp",
    "pts": 20,
    "question": "Thu gọn và tìm bậc của đa thức $P(x) = 3x^4 - 2x^2 + 5 - 3x^4 + x^3$:",
    "options": [
      {
        "text": "$3$",
        "correct": true
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      }
    ],
    "explanation": "$P(x) = (3x^4 - 3x^4) + x^3 - 2x^2 + 5 = x^3 - 2x^2 + 5$. Bậc là $3$."
  },
  {
    "id": 2,
    "title": "Câu 2: Nghiệm của đa thức bậc hai",
    "pts": 20,
    "question": "Nghiệm của đa thức $A(x) = 3x^2 - 12$ là:",
    "options": [
      {
        "text": "$x = 2$ và $x = -2$",
        "correct": true
      },
      {
        "text": "$x = 2$",
        "correct": false
      },
      {
        "text": "$x = 4$",
        "correct": false
      },
      {
        "text": "$x = 4$ và $x = -4$",
        "correct": false
      }
    ],
    "explanation": "$3x^2 - 12 = 0 \\iff 3x^2 = 12 \\iff x^2 = 4 \\iff x = \\pm 2$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính giá trị đa thức tổng",
    "pts": 20,
    "question": "Cho $P(x) = x^2 - 4x + 3$ và $Q(x) = 2x^2 + 4x - 1$. Giá trị của $P(x) + Q(x)$ tại $x = 1$ là:",
    "options": [
      {
        "text": "$5$",
        "correct": true
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$8$",
        "correct": false
      }
    ],
    "explanation": "$P(x) + Q(x) = 3x^2 + 2$. Tại $x = 1$, giá trị là $3(1)^2 + 2 = 5$."
  },
  {
    "id": 4,
    "title": "Câu 4: Hệ số cao nhất của thương",
    "pts": 20,
    "question": "Hệ số cao nhất của thương khi chia $(6x^3 - 4x^2 + 2x) : 2x$ là:",
    "options": [
      {
        "text": "$3$",
        "correct": true
      },
      {
        "text": "$6$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$-2$",
        "correct": false
      }
    ],
    "explanation": "Thương là $3x^2 - 2x + 1$, hệ số cao nhất là $3$."
  },
  {
    "id": 5,
    "title": "Câu 5: Khai triển nhị thức tích",
    "pts": 20,
    "question": "Khai triển và thu gọn $(2x - 1)(x + 3)$ ta được:",
    "options": [
      {
        "text": "$2x^2 + 5x - 3$",
        "correct": true
      },
      {
        "text": "$2x^2 + 6x - 3$",
        "correct": false
      },
      {
        "text": "$2x^2 - x - 3$",
        "correct": false
      },
      {
        "text": "$2x^2 + 5x + 3$",
        "correct": false
      }
    ],
    "explanation": "$(2x - 1)(x + 3) = 2x^2 + 6x - x - 3 = 2x^2 + 5x - 3$."
  },
  {
    "id": 6,
    "title": "Câu 6: Đa thức không có nghiệm",
    "pts": 20,
    "question": "Trong các đa thức sau, đa thức nào vô nghiệm trên tập số thực?",
    "options": [
      {
        "text": "$P(x) = x^2 + 4$",
        "correct": true
      },
      {
        "text": "$Q(x) = x^2 - 4$",
        "correct": false
      },
      {
        "text": "$R(x) = x^3 + 1$",
        "correct": false
      },
      {
        "text": "$S(x) = 2x - 10$",
        "correct": false
      }
    ],
    "explanation": "Vì $x^2 \\ge 0 \\implies x^2 + 4 \\ge 4 > 0$ với mọi $x$, nên $P(x) = 0$ vô nghiệm."
  },
  {
    "id": 7,
    "title": "Câu 7: Tìm thương và dư",
    "pts": 20,
    "question": "Chia $x^2 + 5x + 7$ cho $x + 2$ được thương và dư lần lượt là:",
    "options": [
      {
        "text": "Thương $x + 3$, dư $1$",
        "correct": true
      },
      {
        "text": "Thương $x + 3$, dư $0$",
        "correct": false
      },
      {
        "text": "Thương $x + 2$, dư $3$",
        "correct": false
      },
      {
        "text": "Thương $x + 1$, dư $5$",
        "correct": false
      }
    ],
    "explanation": "$x^2 + 5x + 7 = (x + 2)(x + 3) + 1$."
  },
  {
    "id": 8,
    "title": "Câu 8: Số nghiệm tối đa",
    "pts": 20,
    "question": "Một đa thức một biến có bậc 4 có thể có tối đa bao nhiêu nghiệm?",
    "options": [
      {
        "text": "$4$ nghiệm",
        "correct": true
      },
      {
        "text": "$3$ nghiệm",
        "correct": false
      },
      {
        "text": "$5$ nghiệm",
        "correct": false
      },
      {
        "text": "Vô số nghiệm",
        "correct": false
      }
    ],
    "explanation": "Một đa thức một biến khác đa thức không có bậc $n$ có không quá $n$ nghiệm."
  },
  {
    "id": 9,
    "title": "Câu 9: Bậc của tích hai đa thức",
    "pts": 20,
    "question": "Cho $A(x) = 2x^3 - 1$ và $B(x) = x^2 + 3x$. Bậc của đa thức $A(x) \\cdot B(x)$ là:",
    "options": [
      {
        "text": "$5$",
        "correct": true
      },
      {
        "text": "$6$",
        "correct": false
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      }
    ],
    "explanation": "Bậc của tích bằng tổng bậc của hai đa thức: $3 + 2 = 5$."
  },
  {
    "id": 10,
    "title": "Câu 10: Rút gọn biểu thức đại số phức hợp",
    "pts": 20,
    "question": "Rút gọn biểu thức $M = (x - 2)(x + 2) - (x^2 - 4x + 1)$ ta được:",
    "options": [
      {
        "text": "$4x - 5$",
        "correct": true
      },
      {
        "text": "$4x + 3$",
        "correct": false
      },
      {
        "text": "$-4x - 5$",
        "correct": false
      },
      {
        "text": "$4x - 3$",
        "correct": false
      }
    ],
    "explanation": "$M = (x^2 - 4) - x^2 + 4x - 1 = 4x - 5$."
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
  let tabIdx = 1;

  function draw() {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SƠ ĐỒ TỔNG KẾT TRI THỨC ĐA THỨC MỘT BIẾN', canvas1.width / 2, 28);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(50, 50, canvas1.width - 100, 160);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, canvas1.width - 100, 160);

    ctx.textAlign = 'left';
    ctx.font = 'bold 18px sans-serif';

    if (tabIdx === 1) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('1. BIỂU THỨC ĐẠI SỐ & ĐƠN THỨC MỘT BIẾN', 80, 85);
      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('• Biểu thức chứa chữ đại diện cho số gọi là biểu thức đại số.', 80, 120);
      ctx.fillText('• Muốn tính giá trị: thay số vào biến rồi thực hiện phép tính.', 80, 150);
      ctx.fillText('• Đơn thức một biến: tích của một số với lũy thừa của biến (axⁿ).', 80, 180);
    } else if (tabIdx === 2) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('2. BẬC, HỆ SỐ & NGHIỆM CỦA ĐA THỨC', 80, 85);
      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('• Bậc: Số mũ lớn nhất của biến trong đa thức đã thu gọn.', 80, 120);
      ctx.fillText('• Hệ số cao nhất: Hệ số của hạng tử có số mũ lớn nhất.', 80, 150);
      ctx.fillText('• Nghiệm: Giá trị a làm cho P(a) = 0.', 80, 180);
    } else if (tabIdx === 3) {
      ctx.fillStyle = '#10b981';
      ctx.fillText('3. PHÉP CỘNG VÀ TRỪ ĐA THỨC', 80, 85);
      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('• Đặt tính cột dọc: Sắp xếp giảm dần, đặt các bậc thẳng cột.', 80, 120);
      ctx.fillText('• Tính theo hàng ngang: Bỏ ngoặc, đổi dấu khi trừ, gom đồng dạng.', 80, 150);
      ctx.fillText('• Lưu ý: -(A - B) = -A + B.', 80, 180);
    } else {
      ctx.fillStyle = '#ec4899';
      ctx.fillText('4. PHÉP NHÂN VÀ PHÉP CHIA ĐA THỨC', 80, 85);
      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('• Nhân: axᵐ · bxⁿ = (ab)xᵐ⁺ⁿ; A(B+C) = AB + AC.', 80, 120);
      ctx.fillText('• Chia: axᵐ : bxⁿ = (a:b)xᵐ⁻ⁿ (m ≥ n).', 80, 150);
      ctx.fillText('• Chia có dư: A = B · Q + R với deg(R) < deg(B).', 80, 180);
    }
  }

  const b1 = document.getElementById('btnMind1');
  const b2 = document.getElementById('btnMind2');
  const b3 = document.getElementById('btnMind3');
  const b4 = document.getElementById('btnMind4');
  if (b1) b1.onclick = () => { tabIdx = 1; draw(); };
  if (b2) b2.onclick = () => { tabIdx = 2; draw(); };
  if (b3) b3.onclick = () => { tabIdx = 3; draw(); };
  if (b4) b4.onclick = () => { tabIdx = 4; draw(); };

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
    ctx2.fillText('HỒ SƠ TOÀN DIỆN ĐA THỨC: P(x) = 2x² - 8', canvas2.width / 2, 28);

    ctx2.font = '15px sans-serif';
    ctx2.textAlign = 'left';
    const x = 70;

    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText('1. Phân loại: Đa thức một biến bậc 2 (Tam thức bậc hai)', x, 65);

    ctx2.fillStyle = '#f59e0b';
    ctx2.fillText('2. Hệ số: Hệ số cao nhất = 2; Hệ số bậc một = 0; Hệ số tự do = -8', x, 95);

    ctx2.fillStyle = '#10b981';
    ctx2.fillText('3. Nghiệm: 2x² - 8 = 0 <=> x² = 4 <=> x = 2 hoặc x = -2 (Đa thức có 2 nghiệm)', x, 125);

    ctx2.fillStyle = '#ec4899';
    ctx2.fillText('4. Giá trị tại x = 3: P(3) = 2 · 3² - 8 = 2 · 9 - 8 = 10', x, 155);

    ctx2.fillStyle = '#a5b4fc';
    ctx2.fillText('5. Phân tích thành tích: P(x) = 2(x² - 4) = 2(x - 2)(x + 2)', x, 185);
  }

  const btn = document.getElementById('btnLab2CheckAll');
  if (btn) btn.onclick = draw2;
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
