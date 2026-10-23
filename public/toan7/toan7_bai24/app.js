// ================================================================
// BÀI 24: BIỂU THỨC ĐẠI SỐ - TOÁN 7 KNTT
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
  userTitle: 'Nhà Khởi Tạo Đại Số 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai24_state';

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
    "title": "Câu 1: Nhận diện biểu thức đại số",
    "pts": 20,
    "question": "Biểu thức nào sau đây là biểu thức đại số chứa biến $x$?",
    "options": [
      {
        "text": "$3x^2 - 5x + 7$",
        "correct": true
      },
      {
        "text": "$2 + 3 \\cdot 4 - 5$",
        "correct": false
      },
      {
        "text": "$15 : 3 + 2^3$",
        "correct": false
      },
      {
        "text": "$\\sqrt{16} + 25$",
        "correct": false
      }
    ],
    "explanation": "Biểu thức đại số là biểu thức chứa chữ đại diện cho số (ở đây là biến $x$). Các biểu thức còn lại là biểu thức số."
  },
  {
    "id": 2,
    "title": "Câu 2: Quy ước viết gọn biểu thức",
    "pts": 20,
    "question": "Biểu thức $4 \\cdot x \\cdot y$ được viết gọn là:",
    "options": [
      {
        "text": "$4xy$",
        "correct": true
      },
      {
        "text": "$4 + xy$",
        "correct": false
      },
      {
        "text": "$4(x + y)$",
        "correct": false
      },
      {
        "text": "$4x + y$",
        "correct": false
      }
    ],
    "explanation": "Theo quy ước viết gọn đại số, không cần viết dấu nhân giữa số và các chữ: $4 \\cdot x \\cdot y = 4xy$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính giá trị biểu thức bậc nhất",
    "pts": 20,
    "question": "Giá trị của biểu thức $A = 2x - 5$ tại $x = 4$ là:",
    "options": [
      {
        "text": "$3$",
        "correct": true
      },
      {
        "text": "$8$",
        "correct": false
      },
      {
        "text": "$-3$",
        "correct": false
      },
      {
        "text": "$13$",
        "correct": false
      }
    ],
    "explanation": "Thay $x = 4$ vào biểu thức: $A = 2 \\cdot 4 - 5 = 8 - 5 = 3$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính giá trị với số âm",
    "pts": 20,
    "question": "Giá trị của biểu thức $B = 3x^2 - 1$ tại $x = -2$ là:",
    "options": [
      {
        "text": "$11$",
        "correct": true
      },
      {
        "text": "$-13$",
        "correct": false
      },
      {
        "text": "$13$",
        "correct": false
      },
      {
        "text": "$-11$",
        "correct": false
      }
    ],
    "explanation": "Thay $x = -2$ vào: $B = 3(-2)^2 - 1 = 3 \\cdot 4 - 1 = 12 - 1 = 11$."
  },
  {
    "id": 5,
    "title": "Câu 5: Biểu thức hai biến",
    "pts": 20,
    "question": "Tính giá trị của biểu thức $C = 2x + 3y$ tại $x = 1, y = -1$:",
    "options": [
      {
        "text": "$-1$",
        "correct": true
      },
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$-5$",
        "correct": false
      }
    ],
    "explanation": "Thay $x = 1, y = -1$ vào: $C = 2(1) + 3(-1) = 2 - 3 = -1$."
  },
  {
    "id": 6,
    "title": "Câu 6: Viết biểu thức chu vi hình vuông",
    "pts": 20,
    "question": "Biểu thức đại số biểu thị chu vi của hình vuông có cạnh bằng $a$ là:",
    "options": [
      {
        "text": "$4a$",
        "correct": true
      },
      {
        "text": "$a^2$",
        "correct": false
      },
      {
        "text": "$2a$",
        "correct": false
      },
      {
        "text": "$a + 4$",
        "correct": false
      }
    ],
    "explanation": "Chu vi hình vuông bằng cạnh nhân 4, tức là $4 \\cdot a = 4a$."
  },
  {
    "id": 7,
    "title": "Câu 7: Viết biểu thức diện tích tam giác",
    "pts": 20,
    "question": "Biểu thức biểu thị diện tích tam giác có độ dài đáy là $a$ và chiều cao tương ứng là $h$ là:",
    "options": [
      {
        "text": "$\\frac{1}{2}ah$",
        "correct": true
      },
      {
        "text": "$ah$",
        "correct": false
      },
      {
        "text": "$2ah$",
        "correct": false
      },
      {
        "text": "$\\frac{a + h}{2}$",
        "correct": false
      }
    ],
    "explanation": "Diện tích tam giác bằng nửa tích của đáy và chiều cao: $S = \\frac{1}{2}ah$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tính giá trị biểu thức phân thức",
    "pts": 20,
    "question": "Giá trị của biểu thức $D = \\frac{x + 2}{x - 1}$ tại $x = 3$ là:",
    "options": [
      {
        "text": "$\\frac{5}{2}$",
        "correct": true
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$\\frac{5}{4}$",
        "correct": false
      },
      {
        "text": "$5$",
        "correct": false
      }
    ],
    "explanation": "Thay $x = 3$ vào biểu thức: $D = \\frac{3 + 2}{3 - 1} = \\frac{5}{2}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Biểu thức quãng đường chuyển động",
    "pts": 20,
    "question": "Một ô tô đi với vận tốc $v$ (km/h) trong thời gian $t$ (h). Biểu thức biểu thị quãng đường ô tô đi được là:",
    "options": [
      {
        "text": "$s = v \\cdot t$",
        "correct": true
      },
      {
        "text": "$s = \\frac{v}{t}$",
        "correct": false
      },
      {
        "text": "$s = \\frac{t}{v}$",
        "correct": false
      },
      {
        "text": "$s = v + t$",
        "correct": false
      }
    ],
    "explanation": "Quãng đường bằng vận tốc nhân thời gian: $s = vt$."
  },
  {
    "id": 10,
    "title": "Câu 10: Rút gọn trước khi tính giá trị",
    "pts": 20,
    "question": "Cho biểu thức $M = 3x + 5x - 2x$. Giá trị của $M$ tại $x = -3$ là:",
    "options": [
      {
        "text": "$-18$",
        "correct": true
      },
      {
        "text": "$18$",
        "correct": false
      },
      {
        "text": "$-12$",
        "correct": false
      },
      {
        "text": "$24$",
        "correct": false
      }
    ],
    "explanation": "Rút gọn trước: $M = (3 + 5 - 2)x = 6x$. Khi $x = -3$, giá trị là $6(-3) = -18$."
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
  const slider = document.getElementById('lab1SliderX');
  const label = document.getElementById('lab1ValX');

  function draw(x) {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);
    const term1 = 2 * x * x;
    const term2 = -3 * x;
    const term3 = 5;
    const total = term1 + term2 + term3;

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('TÍNH GIÁ TRỊ BIỂU THỨC: P(x) = 2x² - 3x + 5', canvas1.width / 2, 28);

    ctx.font = '16px serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Thay x = ${x} vào biểu thức:`, canvas1.width / 2, 65);

    ctx.font = 'bold 18px serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`P(${x}) = 2 · (${x})² - 3 · (${x}) + 5`, canvas1.width / 2, 105);

    ctx.font = '16px serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`= 2 · ${x * x} + (${term2}) + 5 = ${term1} ${term2 >= 0 ? '+ ' + term2 : '- ' + Math.abs(term2)} + 5`, canvas1.width / 2, 145);

    ctx.font = 'bold 22px sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`=> Giá trị P(${x}) = ${total}`, canvas1.width / 2, 195);
  }

  if (slider) {
    slider.addEventListener('input', (e) => {
      const x = parseInt(e.target.value);
      if (label) label.textContent = `x = ${x}`;
      draw(x);
    });
    draw(parseInt(slider.value));
  }
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');
  const inA = document.getElementById('lab2A');
  const inB = document.getElementById('lab2B');

  function draw2() {
    const a = parseInt(inA ? inA.value : 6);
    const b = parseInt(inB ? inB.value : 4);
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    const scale = 18;
    const w = a * scale;
    const h = b * scale;
    const startX = 80;
    const startY = 120 - h / 2;

    // Vẽ hình chữ nhật
    ctx2.fillStyle = 'rgba(99, 102, 241, 0.25)';
    ctx2.fillRect(startX, startY, w, h);
    ctx2.strokeStyle = '#818cf8';
    ctx2.lineWidth = 3;
    ctx2.strokeRect(startX, startY, w, h);

    // Ghi chú kích thước
    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 14px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(`Chiều dài a = ${a}`, startX + w / 2, startY - 10);
    ctx2.textAlign = 'right';
    ctx2.fillText(`b = ${b}`, startX - 10, startY + h / 2 + 5);

    // Hiển thị công thức
    ctx2.textAlign = 'left';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText('CÔNG THỨC ĐẠI SỐ HÌNH CHỮ NHẬT:', 320, 50);

    ctx2.font = '16px serif';
    ctx2.fillStyle = '#cbd5e1';
    ctx2.fillText(`• Chu vi: C = 2(a + b)`, 320, 85);
    ctx2.fillText(`  => C = 2(${a} + ${b}) = 2 · ${a + b} = ${2 * (a + b)}`, 320, 115);

    ctx2.fillStyle = '#f59e0b';
    ctx2.fillText(`• Diện tích: S = a · b`, 320, 150);
    ctx2.fillText(`  => S = ${a} · ${b} = ${a * b}`, 320, 180);
  }

  if (inA) inA.addEventListener('input', draw2);
  if (inB) inB.addEventListener('input', draw2);
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
