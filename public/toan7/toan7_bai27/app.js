// ================================================================
// BÀI 27: PHÉP NHÂN ĐA THỨC MỘT BIẾN - TOÁN 7 KNTT
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
  userTitle: 'Chuyên Gia Phân Phối Đại Số 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai27_state';

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
    "title": "Câu 1: Nhân hai đơn thức",
    "pts": 20,
    "question": "Tích của hai đơn thức $3x^2$ và $4x^3$ là:",
    "options": [
      {
        "text": "$12x^5$",
        "correct": true
      },
      {
        "text": "$12x^6$",
        "correct": false
      },
      {
        "text": "$7x^5$",
        "correct": false
      },
      {
        "text": "$7x^6$",
        "correct": false
      }
    ],
    "explanation": "Nhân hệ số với hệ số, cộng số mũ lũy thừa: $(3 \\cdot 4) x^{2+3} = 12x^5$."
  },
  {
    "id": 2,
    "title": "Câu 2: Nhân đơn thức với đơn thức âm",
    "pts": 20,
    "question": "Tích của $-2x$ và $5x^4$ là:",
    "options": [
      {
        "text": "$-10x^5$",
        "correct": true
      },
      {
        "text": "$10x^5$",
        "correct": false
      },
      {
        "text": "$-10x^4$",
        "correct": false
      },
      {
        "text": "$-7x^5$",
        "correct": false
      }
    ],
    "explanation": "$-2 \\cdot 5 = -10$, biến $x^1 \\cdot x^4 = x^5$, kết quả $-10x^5$."
  },
  {
    "id": 3,
    "title": "Câu 3: Nhân đơn thức với đa thức",
    "pts": 20,
    "question": "Thực hiện phép nhân $2x(3x - 4)$ ta được:",
    "options": [
      {
        "text": "$6x^2 - 8x$",
        "correct": true
      },
      {
        "text": "$6x^2 - 4$",
        "correct": false
      },
      {
        "text": "$6x - 8$",
        "correct": false
      },
      {
        "text": "$5x^2 - 8x$",
        "correct": false
      }
    ],
    "explanation": "$2x \\cdot 3x - 2x \\cdot 4 = 6x^2 - 8x$."
  },
  {
    "id": 4,
    "title": "Câu 4: Nhân hai nhị thức",
    "pts": 20,
    "question": "Khai triển và thu gọn $(x + 3)(x + 2)$ ta được:",
    "options": [
      {
        "text": "$x^2 + 5x + 6$",
        "correct": true
      },
      {
        "text": "$x^2 + 6x + 5$",
        "correct": false
      },
      {
        "text": "$x^2 + 5x + 5$",
        "correct": false
      },
      {
        "text": "$x^2 + 6$",
        "correct": false
      }
    ],
    "explanation": "$(x + 3)(x + 2) = x^2 + 2x + 3x + 6 = x^2 + 5x + 6$."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhị thức có dấu trừ",
    "pts": 20,
    "question": "Khai triển $(x - 4)(x + 4)$ ta được:",
    "options": [
      {
        "text": "$x^2 - 16$",
        "correct": true
      },
      {
        "text": "$x^2 + 16$",
        "correct": false
      },
      {
        "text": "$x^2 - 8x - 16$",
        "correct": false
      },
      {
        "text": "$x^2 - 8$",
        "correct": false
      }
    ],
    "explanation": "$(x - 4)(x + 4) = x^2 + 4x - 4x - 16 = x^2 - 16$."
  },
  {
    "id": 6,
    "title": "Câu 6: Bậc của đa thức tích",
    "pts": 20,
    "question": "Cho đa thức $P(x)$ có bậc 3 và $Q(x)$ có bậc 2. Bậc của đa thức tích $P(x) \\cdot Q(x)$ là:",
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
    "id": 7,
    "title": "Câu 7: Hệ số cao nhất của tích",
    "pts": 20,
    "question": "Hệ số cao nhất của tích $(2x^2 - 1)(3x^2 + x)$ là:",
    "options": [
      {
        "text": "$6$",
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
        "text": "$3$",
        "correct": false
      }
    ],
    "explanation": "Hạng tử bậc cao nhất của tích là $2x^2 \\cdot 3x^2 = 6x^4$, hệ số cao nhất là $6$."
  },
  {
    "id": 8,
    "title": "Câu 8: Hệ số tự do của tích",
    "pts": 20,
    "question": "Hệ số tự do của tích $(x^2 - 2x + 3)(2x - 5)$ là:",
    "options": [
      {
        "text": "$-15$",
        "correct": true
      },
      {
        "text": "$15$",
        "correct": false
      },
      {
        "text": "$-5$",
        "correct": false
      },
      {
        "text": "$3$",
        "correct": false
      }
    ],
    "explanation": "Hệ số tự do của tích bằng tích của hai hệ số tự do: $3 \\cdot (-5) = -15$."
  },
  {
    "id": 9,
    "title": "Câu 9: Nhân đa thức với bình phương",
    "pts": 20,
    "question": "Khai triển $(x - 1)^2 = (x - 1)(x - 1)$ ta được:",
    "options": [
      {
        "text": "$x^2 - 2x + 1$",
        "correct": true
      },
      {
        "text": "$x^2 - 1$",
        "correct": false
      },
      {
        "text": "$x^2 + 1$",
        "correct": false
      },
      {
        "text": "$x^2 + 2x + 1$",
        "correct": false
      }
    ],
    "explanation": "$(x - 1)(x - 1) = x^2 - x - x + 1 = x^2 - 2x + 1$."
  },
  {
    "id": 10,
    "title": "Câu 10: Rút gọn biểu thức chứa phép nhân",
    "pts": 20,
    "question": "Rút gọn biểu thức $A = x(x - 2) - x^2 + 5$:",
    "options": [
      {
        "text": "$-2x + 5$",
        "correct": true
      },
      {
        "text": "$2x + 5$",
        "correct": false
      },
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "$-2x - 5$",
        "correct": false
      }
    ],
    "explanation": "$A = x^2 - 2x - x^2 + 5 = -2x + 5$."
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
  const inA = document.getElementById('lab1A');
  const inB = document.getElementById('lab1B');

  function draw() {
    const a = parseInt(inA ? inA.value : 2);
    const b = parseInt(inB ? inB.value : 3);
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('DIỆN TÍCH HÌNH CHỮ NHẬT: (x + a)(x + b)', canvas1.width / 2, 28);

    const xSize = 70;
    const aSize = a * 20;
    const bSize = b * 20;
    const startX = 80;
    const startY = 70;

    // Vùng 1: x²
    ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.fillRect(startX, startY, xSize, xSize);
    ctx.strokeStyle = '#818cf8';
    ctx.strokeRect(startX, startY, xSize, xSize);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px serif';
    ctx.fillText('x²', startX + xSize / 2, startY + xSize / 2 + 5);

    // Vùng 2: ax
    ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.fillRect(startX + xSize, startY, aSize, xSize);
    ctx.strokeStyle = '#f59e0b';
    ctx.strokeRect(startX + xSize, startY, aSize, xSize);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${a}x`, startX + xSize + aSize / 2, startY + xSize / 2 + 5);

    // Vùng 3: bx
    ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.fillRect(startX, startY + xSize, xSize, bSize);
    ctx.strokeStyle = '#10b981';
    ctx.strokeRect(startX, startY + xSize, xSize, bSize);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${b}x`, startX + xSize / 2, startY + xSize + bSize / 2 + 5);

    // Vùng 4: ab
    ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
    ctx.fillRect(startX + xSize, startY + xSize, aSize, bSize);
    ctx.strokeStyle = '#ec4899';
    ctx.strokeRect(startX + xSize, startY + xSize, aSize, bSize);
    ctx.fillStyle = '#fff';
    ctx.fillText(`${a * b}`, startX + xSize + aSize / 2, startY + xSize + bSize / 2 + 5);

    // Công thức bên phải
    ctx.textAlign = 'left';
    ctx.font = 'bold 16px serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`(x + ${a})(x + ${b})`, 330, 95);

    ctx.font = '15px serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`= x² + ${a}x + ${b}x + ${a * b}`, 330, 130);

    ctx.font = 'bold 18px serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`= x² + ${a + b}x + ${a * b}`, 330, 170);
  }

  if (inA) inA.addEventListener('input', draw);
  if (inB) inB.addEventListener('input', draw);
  draw();
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');
  let step = 0;

  function draw2() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('CÁC BƯỚC NHÂN PHÂN PHỐI: (2x - 3)(x + 4)', canvas2.width / 2, 28);

    ctx2.font = 'bold 18px serif';
    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText('Đề bài: A = (2x - 3)(x + 4)', canvas2.width / 2, 65);

    if (step >= 1) {
      ctx2.font = '16px serif';
      ctx2.fillStyle = '#f59e0b';
      ctx2.fillText('Bước 1: Tách hạng tử đa thức thứ nhất:', canvas2.width / 2, 100);
      ctx2.fillText('= 2x · (x + 4) - 3 · (x + 4)', canvas2.width / 2, 125);
    }
    if (step >= 2) {
      ctx2.fillStyle = '#ec4899';
      ctx2.fillText('Bước 2: Nhân đơn thức với đa thức:', canvas2.width / 2, 155);
      ctx2.fillText('= (2x · x + 2x · 4) - (3 · x + 3 · 4) = 2x² + 8x - 3x - 12', canvas2.width / 2, 180);
    }
    if (step >= 3) {
      ctx2.font = 'bold 20px serif';
      ctx2.fillStyle = '#10b981';
      ctx2.fillText('Bước 3: Thu gọn đồng dạng => A = 2x² + 5x - 12', canvas2.width / 2, 215);
    }
  }

  const btn = document.getElementById('btnLab2Step');
  if (btn) {
    btn.onclick = () => {
      step = (step + 1) % 4;
      if (step === 0) step = 1;
      draw2();
    };
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
