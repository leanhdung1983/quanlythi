// ================================================================
// BÀI 25: ĐA THỨC MỘT BIẾN - TOÁN 7 KNTT
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
  userTitle: 'Chuyên Viên Đa Thức 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai25_state';

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
    "title": "Câu 1: Nhận biết đa thức một biến",
    "pts": 20,
    "question": "Biểu thức nào sau đây là đa thức một biến $x$?",
    "options": [
      {
        "text": "$2x^3 - 5x + 1$",
        "correct": true
      },
      {
        "text": "$2x^2 - 3xy + 1$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{x} + 5x$",
        "correct": false
      },
      {
        "text": "$x^2 + y^2 - 4$",
        "correct": false
      }
    ],
    "explanation": "Đa thức một biến $x$ là tổng của các đơn thức chỉ chứa biến $x$ với số mũ nguyên không âm: $2x^3 - 5x + 1$."
  },
  {
    "id": 2,
    "title": "Câu 2: Xác định bậc của đa thức",
    "pts": 20,
    "question": "Bậc của đa thức $A(x) = 5x^4 - 2x^2 + x - 9$ là:",
    "options": [
      {
        "text": "$4$",
        "correct": true
      },
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$9$",
        "correct": false
      }
    ],
    "explanation": "Bậc của đa thức đã thu gọn là số mũ lớn nhất của biến: số mũ lớn nhất ở đây là $4$."
  },
  {
    "id": 3,
    "title": "Câu 3: Hệ số cao nhất",
    "pts": 20,
    "question": "Hệ số cao nhất của đa thức $P(x) = -3x^5 + 7x^3 - 2x + 4$ là:",
    "options": [
      {
        "text": "$-3$",
        "correct": true
      },
      {
        "text": "$7$",
        "correct": false
      },
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "$4$",
        "correct": false
      }
    ],
    "explanation": "Hạng tử bậc cao nhất là $-3x^5$, do đó hệ số cao nhất là $-3$."
  },
  {
    "id": 4,
    "title": "Câu 4: Hệ số tự do",
    "pts": 20,
    "question": "Hệ số tự do của đa thức $Q(x) = 4x^3 - x + 8$ là:",
    "options": [
      {
        "text": "$8$",
        "correct": true
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$-1$",
        "correct": false
      },
      {
        "text": "$3$",
        "correct": false
      }
    ],
    "explanation": "Hạng tử không chứa biến (hạng tử bậc 0) là $8$, nên hệ số tự do là $8$."
  },
  {
    "id": 5,
    "title": "Câu 5: Thu gọn đa thức",
    "pts": 20,
    "question": "Thu gọn đa thức $M(x) = 3x^2 - 5x + 2x^2 + 7x - 4$ ta được:",
    "options": [
      {
        "text": "$5x^2 + 2x - 4$",
        "correct": true
      },
      {
        "text": "$5x^2 - 2x - 4$",
        "correct": false
      },
      {
        "text": "$x^2 + 2x - 4$",
        "correct": false
      },
      {
        "text": "$5x^2 + 12x - 4$",
        "correct": false
      }
    ],
    "explanation": "Gộp các hạng tử đồng dạng: $(3x^2 + 2x^2) + (-5x + 7x) - 4 = 5x^2 + 2x - 4$."
  },
  {
    "id": 6,
    "title": "Câu 6: Kiểm tra nghiệm của đa thức",
    "pts": 20,
    "question": "Giá trị nào sau đây là nghiệm của đa thức $P(x) = 2x - 6$?",
    "options": [
      {
        "text": "$x = 3$",
        "correct": true
      },
      {
        "text": "$x = -3$",
        "correct": false
      },
      {
        "text": "$x = 2$",
        "correct": false
      },
      {
        "text": "$x = 0$",
        "correct": false
      }
    ],
    "explanation": "Thay $x = 3$ vào: $P(3) = 2 \\cdot 3 - 6 = 6 - 6 = 0$. Vậy $x = 3$ là nghiệm."
  },
  {
    "id": 7,
    "title": "Câu 7: Tìm nghiệm của đa thức bậc nhất",
    "pts": 20,
    "question": "Nghiệm của đa thức $A(x) = 3x + 9$ là:",
    "options": [
      {
        "text": "$x = -3$",
        "correct": true
      },
      {
        "text": "$x = 3$",
        "correct": false
      },
      {
        "text": "$x = -9$",
        "correct": false
      },
      {
        "text": "$x = 0$",
        "correct": false
      }
    ],
    "explanation": "Cho $A(x) = 0 \\iff 3x + 9 = 0 \\iff 3x = -9 \\iff x = -3$."
  },
  {
    "id": 8,
    "title": "Câu 8: Đa thức không có nghiệm thực",
    "pts": 20,
    "question": "Đa thức nào sau đây KHÔNG có nghiệm?",
    "options": [
      {
        "text": "$x^2 + 1$",
        "correct": true
      },
      {
        "text": "$x^2 - 1$",
        "correct": false
      },
      {
        "text": "$2x - 4$",
        "correct": false
      },
      {
        "text": "$x^3$",
        "correct": false
      }
    ],
    "explanation": "Vì $x^2 \\ge 0$ với mọi $x$, nên $x^2 + 1 \\ge 1 > 0$ với mọi $x$. Do đó $x^2 + 1 = 0$ vô nghiệm."
  },
  {
    "id": 9,
    "title": "Câu 9: Bậc của đa thức sau khi triệt tiêu",
    "pts": 20,
    "question": "Cho $P(x) = 2x^3 - 4x + 1$ và $Q(x) = -2x^3 + 5x^2 - 3$. Bậc của đa thức $P(x) + Q(x)$ là:",
    "options": [
      {
        "text": "$2$",
        "correct": true
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      }
    ],
    "explanation": "$P(x) + Q(x) = (2x^3 - 2x^3) + 5x^2 - 4x + (1 - 3) = 5x^2 - 4x - 2$. Bậc của đa thức này là $2$."
  },
  {
    "id": 10,
    "title": "Câu 10: Đa thức có 2 nghiệm",
    "pts": 20,
    "question": "Tập nghiệm của đa thức $B(x) = x^2 - 9$ là:",
    "options": [
      {
        "text": "$\\{3; -3\\}$",
        "correct": true
      },
      {
        "text": "$\\{3\\}$",
        "correct": false
      },
      {
        "text": "$\\{-3\\}$",
        "correct": false
      },
      {
        "text": "$\\{9; -9\\}$",
        "correct": false
      }
    ],
    "explanation": "$x^2 - 9 = 0 \\iff x^2 = 9 \\iff x = 3$ hoặc $x = -3$."
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
  let currentPoly = { name: 'P(x)', str: '4x³ - 2x + 7', deg: 3, lead: 4, free: 7 };

  function draw() {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('PHÂN TÍCH THU GỌN VÀ THUỘC TÍNH ĐA THỨC', canvas1.width / 2, 30);

    ctx.font = 'bold 22px serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${currentPoly.name} = ${currentPoly.str}`, canvas1.width / 2, 75);

    // Bảng thuộc tính
    const startY = 120;
    ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
    ctx.fillRect(80, startY - 20, canvas1.width - 160, 110);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 1;
    ctx.strokeRect(80, startY - 20, canvas1.width - 160, 110);

    ctx.font = '16px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`• Bậc của đa thức:`, 110, startY + 10);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${currentPoly.deg}`, 320, startY + 10);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`• Hệ số cao nhất:`, 110, startY + 45);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${currentPoly.lead}`, 320, startY + 45);

    ctx.font = '16px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`• Hệ số tự do:`, 110, startY + 80);
    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText(`${currentPoly.free}`, 320, startY + 80);
  }

  const b1 = document.getElementById('btnLab1P1');
  const b2 = document.getElementById('btnLab1P2');
  const b3 = document.getElementById('btnLab1P3');
  if (b1) b1.onclick = () => { currentPoly = { name: 'P(x)', str: '4x³ - 2x + 7', deg: 3, lead: 4, free: 7 }; draw(); };
  if (b2) b2.onclick = () => { currentPoly = { name: 'Q(x)', str: '-x⁴ + 3x² - 5', deg: 4, lead: -1, free: -5 }; draw(); };
  if (b3) b3.onclick = () => { currentPoly = { name: 'R(x)', str: '2x² - 8', deg: 2, lead: 2, free: -8 }; draw(); };

  draw();
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');
  const slider = document.getElementById('lab2SliderX');
  const lbl = document.getElementById('lab2ValX');

  function draw2(x) {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    const val = 2 * x - 4;
    const isRoot = (val === 0);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('DÒ TÌM NGHIỆM ĐA THỨC P(x) = 2x - 4', canvas2.width / 2, 28);

    // Vẽ trục số
    const yAxis = 110;
    ctx2.strokeStyle = '#64748b';
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.moveTo(60, yAxis);
    ctx2.lineTo(540, yAxis);
    ctx2.stroke();

    const originX = 140;
    const step = 50;

    for (let i = -1; i <= 7; i++) {
      const px = originX + i * step;
      ctx2.beginPath();
      ctx2.moveTo(px, yAxis - 6);
      ctx2.lineTo(px, yAxis + 6);
      ctx2.stroke();

      ctx2.fillStyle = '#94a3b8';
      ctx2.font = '12px sans-serif';
      ctx2.fillText(i, px, yAxis + 22);
    }

    // Đánh dấu điểm x
    const curX = originX + x * step;
    ctx2.fillStyle = isRoot ? '#10b981' : '#f43f5e';
    ctx2.beginPath();
    ctx2.arc(curX, yAxis, 8, 0, Math.PI * 2);
    ctx2.fill();

    // Kết luận
    ctx2.font = 'bold 16px serif';
    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText(`Tại x = ${x}: P(${x}) = 2 · (${x}) - 4 = ${val}`, canvas2.width / 2, 165);

    ctx2.font = 'bold 18px sans-serif';
    ctx2.fillStyle = isRoot ? '#10b981' : '#f59e0b';
    if (isRoot) {
      ctx2.fillText(`🎉 CHÍNH XÁC! P(${x}) = 0 => x = ${x} là NGHIỆM của đa thức P(x)!`, canvas2.width / 2, 205);
    } else {
      ctx2.fillText(`P(${x}) = ${val} ≠ 0 => x = ${x} KHÔNG phải là nghiệm. Hãy thử giá trị khác!`, canvas2.width / 2, 205);
    }
  }

  if (slider) {
    slider.addEventListener('input', (e) => {
      const x = parseInt(e.target.value);
      if (lbl) lbl.textContent = `x = ${x}`;
      draw2(x);
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
