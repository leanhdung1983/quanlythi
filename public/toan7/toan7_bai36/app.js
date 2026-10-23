// ================================================================
// BÀI 36: HÌNH HỘP CHỮ NHẬT VÀ HÌNH LẬP PHƯƠNG - TOÁN 7 KNTT
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
  userTitle: 'Kiến Trúc Sư Không Gian 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai36_state';

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
    "title": "Câu 1: Số mặt của hình hộp chữ nhật",
    "pts": 20,
    "question": "Hình hộp chữ nhật có bao nhiêu mặt, bao nhiêu đỉnh và bao nhiêu cạnh?",
    "options": [
      {
        "text": "6 mặt, 8 đỉnh, 12 cạnh",
        "correct": true
      },
      {
        "text": "8 mặt, 6 đỉnh, 12 cạnh",
        "correct": false
      },
      {
        "text": "6 mặt, 12 đỉnh, 8 cạnh",
        "correct": false
      },
      {
        "text": "4 mặt, 4 đỉnh, 6 cạnh",
        "correct": false
      }
    ],
    "explanation": "Hình hộp chữ nhật có đúng 6 mặt (2 đáy và 4 mặt bên), 8 đỉnh và 12 cạnh."
  },
  {
    "id": 2,
    "title": "Câu 2: Thể tích hình hộp chữ nhật",
    "pts": 20,
    "question": "Một hình hộp chữ nhật có chiều dài $5\\text{ cm}$, chiều rộng $4\\text{ cm}$ và chiều cao $3\\text{ cm}$. Thể tích của hình hộp là:",
    "options": [
      {
        "text": "$60\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$54\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$47\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$120\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "$V = a \\cdot b \\cdot h = 5 \\cdot 4 \\cdot 3 = 60\\text{ cm}^3$."
  },
  {
    "id": 3,
    "title": "Câu 3: Diện tích xung quanh hình hộp",
    "pts": 20,
    "question": "Một hình hộp chữ nhật có đáy kích thước $6\\text{ m} \\times 4\\text{ m}$ và chiều cao $3\\text{ m}$. Diện tích xung quanh là:",
    "options": [
      {
        "text": "$60\\text{ m}^2$",
        "correct": true
      },
      {
        "text": "$72\\text{ m}^2$",
        "correct": false
      },
      {
        "text": "$48\\text{ m}^2$",
        "correct": false
      },
      {
        "text": "$108\\text{ m}^2$",
        "correct": false
      }
    ],
    "explanation": "$S_{xq} = 2(a + b)h = 2(6 + 4) \\cdot 3 = 2 \\cdot 10 \\cdot 3 = 60\\text{ m}^2$."
  },
  {
    "id": 4,
    "title": "Câu 4: Thể tích hình lập phương",
    "pts": 20,
    "question": "Một hình lập phương có cạnh bằng $4\\text{ cm}$. Thể tích của hình lập phương đó là:",
    "options": [
      {
        "text": "$64\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$16\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$96\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$48\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "$V = a^3 = 4^3 = 64\\text{ cm}^3$."
  },
  {
    "id": 5,
    "title": "Câu 5: Diện tích toàn phần hình lập phương",
    "pts": 20,
    "question": "Một hình lập phương có cạnh bằng $3\\text{ cm}$. Diện tích toàn phần của nó là:",
    "options": [
      {
        "text": "$54\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$36\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$27\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$18\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "$S_{tp} = 6a^2 = 6 \\cdot 3^2 = 6 \\cdot 9 = 54\\text{ cm}^2$."
  },
  {
    "id": 6,
    "title": "Câu 6: Đường chéo hình hộp chữ nhật",
    "pts": 20,
    "question": "Hình hộp chữ nhật có bao nhiêu đường chéo?",
    "options": [
      {
        "text": "$4$ đường chéo",
        "correct": true
      },
      {
        "text": "$6$ đường chéo",
        "correct": false
      },
      {
        "text": "$8$ đường chéo",
        "correct": false
      },
      {
        "text": "$12$ đường chéo",
        "correct": false
      }
    ],
    "explanation": "Hình hộp chữ nhật có đúng 4 đường chéo nối các cặp đỉnh đối diện và cắt nhau tại trung điểm của mỗi đường."
  },
  {
    "id": 7,
    "title": "Câu 7: Đổi đơn vị đo thể tích",
    "pts": 20,
    "question": "$1\\text{ m}^3$ bằng bao nhiêu lít nước ($1\\text{ lít} = 1\\text{ dm}^3$)?",
    "options": [
      {
        "text": "$1000$ lít",
        "correct": true
      },
      {
        "text": "$100$ lít",
        "correct": false
      },
      {
        "text": "$10$ lít",
        "correct": false
      },
      {
        "text": "$10000$ lít",
        "correct": false
      }
    ],
    "explanation": "$1\\text{ m}^3 = 1000\\text{ dm}^3 = 1000\\text{ lít}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Bể cá cảnh chứa nước",
    "pts": 20,
    "question": "Một bể cá hình hộp chữ nhật có kích thước lòng bể: dài $80\\text{ cm}$, rộng $50\\text{ cm}$, cao $45\\text{ cm}$. Người ta đổ nước vào bể cao $30\\text{ cm}$. Thể tích nước trong bể là:",
    "options": [
      {
        "text": "$120\\text{ lít}$",
        "correct": true
      },
      {
        "text": "$180\\text{ lít}$",
        "correct": false
      },
      {
        "text": "$120000\\text{ lít}$",
        "correct": false
      },
      {
        "text": "$60\\text{ lít}$",
        "correct": false
      }
    ],
    "explanation": "$V_{\\text{nước}} = 80 \\cdot 50 \\cdot 30 = 120000\\text{ cm}^3 = 120\\text{ dm}^3 = 120\\text{ lít}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Cạnh của hình lập phương biết thể tích",
    "pts": 20,
    "question": "Một khối rubik hình lập phương có thể tích bằng $125\\text{ cm}^3$. Độ dài cạnh của khối rubik là:",
    "options": [
      {
        "text": "$5\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$25\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$15\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$12,5\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Vì $V = a^3 = 125 = 5^3$ nên $a = 5\\text{ cm}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tỉ số thể tích khi gấp đôi cạnh",
    "pts": 20,
    "question": "Nếu tăng độ dài mỗi cạnh của hình lập phương lên gấp đôi thì thể tích của nó sẽ tăng lên gấp bao nhiêu lần?",
    "options": [
      {
        "text": "$8$ lần",
        "correct": true
      },
      {
        "text": "$4$ lần",
        "correct": false
      },
      {
        "text": "$2$ lần",
        "correct": false
      },
      {
        "text": "$6$ lần",
        "correct": false
      }
    ],
    "explanation": "$V_{\\text{mới}} = (2a)^3 = 8a^3 = 8V_{\\text{cũ}}$. Thể tích tăng lên 8 lần."
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
  const inH = document.getElementById('lab1H');

  function draw() {
    const a = parseInt(inA ? inA.value : 6);
    const b = parseInt(inB ? inB.value : 4);
    const h = parseInt(inH ? inH.value : 5);

    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`MÔ HÌNH HÌNH HỘP CHỮ NHẬT: ${a} × ${b} × ${h} (cm)`, canvas1.width / 2, 28);

    // Vẽ hình phối cảnh 3D
    const scale = 18;
    const w = a * scale;
    const dX = b * scale * 0.6;
    const dY = b * scale * 0.4;
    const hh = h * scale;

    const ox = 70;
    const oy = 180;

    // Mặt đáy dưới
    // Nét đứt mặt trong
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(ox, oy); ctx.lineTo(ox + dX, oy - dY);
    ctx.lineTo(ox + dX + w, oy - dY);
    ctx.moveTo(ox + dX, oy - dY); ctx.lineTo(ox + dX, oy - dY - hh);
    ctx.stroke();
    ctx.setLineDash([]);

    // Mặt trước
    ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.fillRect(ox, oy - hh, w, hh);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.strokeRect(ox, oy - hh, w, hh);

    // Mặt trên
    ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.beginPath();
    ctx.moveTo(ox, oy - hh); ctx.lineTo(ox + dX, oy - hh - dY);
    ctx.lineTo(ox + dX + w, oy - hh - dY); ctx.lineTo(ox + w, oy - hh);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Mặt bên phải
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.beginPath();
    ctx.moveTo(ox + w, oy); ctx.lineTo(ox + w + dX, oy - dY);
    ctx.lineTo(ox + w + dX, oy - dY - hh); ctx.lineTo(ox + w, oy - hh);
    ctx.closePath();
    ctx.fill(); ctx.stroke();

    // Tính toán số liệu
    const Sxq = 2 * (a + b) * h;
    const Stp = Sxq + 2 * a * b;
    const V = a * b * h;

    ctx.textAlign = 'left';
    ctx.font = '15px sans-serif';
    const tx = 360;

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('KÍCH THƯỚC & KẾT QUẢ:', tx, 70);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`• Dài a = ${a} cm, Rộng b = ${b} cm, Cao h = ${h} cm`, tx, 95);

    ctx.fillStyle = '#10b981';
    ctx.fillText(`• Diện tích xung quanh:`, tx, 125);
    ctx.fillText(`  Sxq = 2(${a} + ${b}) · ${h} = ${Sxq} cm²`, tx, 145);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`• Thể tích hình hộp:`, tx, 175);
    ctx.fillText(`  V = ${a} · ${b} · ${h} = ${V} cm³`, tx, 195);
  }

  if (inA) inA.addEventListener('input', draw);
  if (inB) inB.addEventListener('input', draw);
  if (inH) inH.addEventListener('input', draw);
  draw();
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');
  const slider = document.getElementById('lab2A');
  const lbl = document.getElementById('lab2ValA');

  function draw2(a) {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(`HÌNH KHAI TRIỂN PHẲNG CỦA HÌNH LẬP PHƯƠNG (CẠNH a = ${a} cm)`, canvas2.width / 2, 26);

    const s = 30;
    const startX = 140;
    const startY = 55;

    // Vẽ hình chữ thập trải phẳng 6 mặt
    ctx2.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx2.strokeStyle = '#f59e0b';
    ctx2.lineWidth = 2;

    function sq(gx, gy, text) {
      const px = startX + gx * s;
      const py = startY + gy * s;
      ctx2.fillRect(px, py, s, s);
      ctx2.strokeRect(px, py, s, s);
      ctx2.fillStyle = '#fff';
      ctx2.font = '11px sans-serif';
      ctx2.fillText(text, px + s/2, py + s/2 + 4);
      ctx2.fillStyle = 'rgba(245, 158, 11, 0.25)';
    }

    sq(1, 0, 'Đáy 1');
    sq(0, 1, 'Bên 1');
    sq(1, 1, 'Bên 2');
    sq(2, 1, 'Bên 3');
    sq(3, 1, 'Bên 4');
    sq(1, 2, 'Đáy 2');

    // Công thức bên phải
    ctx2.textAlign = 'left';
    ctx2.font = '15px sans-serif';
    const tx = 310;

    const S1 = a * a;
    const Sxq = 4 * S1;
    const Stp = 6 * S1;
    const V = a * a * a;

    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText('CÔNG THỨC HÌNH LẬP PHƯƠNG:', tx, 65);

    ctx2.fillStyle = '#cbd5e1';
    ctx2.fillText(`• Diện tích 1 mặt: S₁ = ${a}² = ${S1} cm²`, tx, 95);

    ctx2.fillStyle = '#10b981';
    ctx2.fillText(`• Diện tích xung quanh: Sxq = 4 · ${S1} = ${Sxq} cm²`, tx, 125);

    ctx2.fillStyle = '#f59e0b';
    ctx2.fillText(`• Diện tích toàn phần: Stp = 6 · ${S1} = ${Stp} cm²`, tx, 155);

    ctx2.fillStyle = '#ec4899';
    ctx2.fillText(`• Thể tích: V = a³ = ${a}³ = ${V} cm³`, tx, 185);
  }

  if (slider) {
    slider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      if (lbl) lbl.textContent = `a = ${v} cm`;
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
