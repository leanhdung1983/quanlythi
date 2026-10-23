// ================================================================
// BÀI 37: HÌNH LĂNG TRỤ ĐỨNG TAM GIÁC VÀ TỨ GIÁC - TOÁN 7 KNTT
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
  userTitle: 'Kỹ Sư Kết Cấu Không Gian 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai37_state';

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
    "title": "Câu 1: Mặt bên của hình lăng trụ đứng",
    "pts": 20,
    "question": "Các mặt bên của hình lăng trụ đứng luôn là hình gì?",
    "options": [
      {
        "text": "Hình chữ nhật",
        "correct": true
      },
      {
        "text": "Hình tam giác",
        "correct": false
      },
      {
        "text": "Hình thoi",
        "correct": false
      },
      {
        "text": "Hình thang vuông",
        "correct": false
      }
    ],
    "explanation": "Đặc điểm cơ bản: Các mặt bên của hình lăng trụ đứng luôn là các hình chữ nhật vuông góc với hai đáy."
  },
  {
    "id": 2,
    "title": "Câu 2: Hai đáy của hình lăng trụ đứng",
    "pts": 20,
    "question": "Hai mặt đáy của hình lăng trụ đứng có mối quan hệ gì?",
    "options": [
      {
        "text": "Song song và bằng nhau",
        "correct": true
      },
      {
        "text": "Vuông góc với nhau",
        "correct": false
      },
      {
        "text": "Cắt nhau theo một đường thẳng",
        "correct": false
      },
      {
        "text": "Song song nhưng không bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Hai mặt đáy của hình lăng trụ đứng là hai đa giác nằm trên hai mặt phẳng song song và bằng nhau."
  },
  {
    "id": 3,
    "title": "Câu 3: Công thức diện tích xung quanh",
    "pts": 20,
    "question": "Công thức tính diện tích xung quanh của hình lăng trụ đứng có chu vi đáy $C$ và chiều cao $h$ là:",
    "options": [
      {
        "text": "$S_{xq} = C \\cdot h$",
        "correct": true
      },
      {
        "text": "$S_{xq} = 2C \\cdot h$",
        "correct": false
      },
      {
        "text": "$S_{xq} = \\frac{1}{2} C \\cdot h$",
        "correct": false
      },
      {
        "text": "$S_{xq} = C + h$",
        "correct": false
      }
    ],
    "explanation": "Diện tích xung quanh của hình lăng trụ đứng bằng chu vi đáy nhân với chiều cao: $S_{xq} = C \\cdot h$."
  },
  {
    "id": 4,
    "title": "Câu 4: Công thức tính thể tích lăng trụ",
    "pts": 20,
    "question": "Công thức tính thể tích của hình lăng trụ đứng có diện tích đáy $S$ và chiều cao $h$ là:",
    "options": [
      {
        "text": "$V = S \\cdot h$",
        "correct": true
      },
      {
        "text": "$V = \\frac{1}{3} S \\cdot h$",
        "correct": false
      },
      {
        "text": "$V = 2S \\cdot h$",
        "correct": false
      },
      {
        "text": "$V = S + h$",
        "correct": false
      }
    ],
    "explanation": "Thể tích hình lăng trụ đứng bằng diện tích đáy nhân với chiều cao: $V = S \\cdot h$."
  },
  {
    "id": 5,
    "title": "Câu 5: Số mặt của lăng trụ đứng tam giác",
    "pts": 20,
    "question": "Một hình lăng trụ đứng tam giác có tất cả bao nhiêu mặt?",
    "options": [
      {
        "text": "$5$ mặt (2 mặt đáy và 3 mặt bên)",
        "correct": true
      },
      {
        "text": "$6$ mặt",
        "correct": false
      },
      {
        "text": "$4$ mặt",
        "correct": false
      },
      {
        "text": "$8$ mặt",
        "correct": false
      }
    ],
    "explanation": "Hình lăng trụ đứng tam giác có 2 mặt đáy hình tam giác và 3 mặt bên hình chữ nhật, tổng cộng là 5 mặt."
  },
  {
    "id": 6,
    "title": "Câu 6: Số cạnh của lăng trụ đứng tam giác",
    "pts": 20,
    "question": "Hình lăng trụ đứng tam giác có bao nhiêu cạnh và bao nhiêu đỉnh?",
    "options": [
      {
        "text": "$9$ cạnh và $6$ đỉnh",
        "correct": true
      },
      {
        "text": "$6$ cạnh và $9$ đỉnh",
        "correct": false
      },
      {
        "text": "$12$ cạnh và $8$ đỉnh",
        "correct": false
      },
      {
        "text": "$6$ cạnh và $6$ đỉnh",
        "correct": false
      }
    ],
    "explanation": "Có 3 cạnh đáy trên, 3 cạnh đáy dưới và 3 cạnh bên $\\implies 9$ cạnh; có 3 đỉnh trên và 3 đỉnh dưới $\\implies 6$ đỉnh."
  },
  {
    "id": 7,
    "title": "Câu 7: Tính thể tích lăng trụ đứng tam giác",
    "pts": 20,
    "question": "Một hình lăng trụ đứng tam giác có diện tích đáy là $15\\text{ cm}^2$ và chiều cao $8\\text{ cm}$. Thể tích của lăng trụ là:",
    "options": [
      {
        "text": "$120\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$40\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$60\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$240\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "$V = S_{\\text{đáy}} \\cdot h = 15 \\cdot 8 = 120\\text{ cm}^3$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tính diện tích xung quanh lăng trụ đứng tam giác",
    "pts": 20,
    "question": "Một lăng trụ đứng tam giác có đáy là tam giác vuông có 2 cạnh góc vuông là $3\\text{ cm}, 4\\text{ cm}$ (cạnh huyền $5\\text{ cm}$) và chiều cao $10\\text{ cm}$. Diện tích xung quanh là:",
    "options": [
      {
        "text": "$120\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$60\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$70\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$132\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Chu vi đáy: $C = 3 + 4 + 5 = 12\\text{ cm}$. $S_{xq} = C \\cdot h = 12 \\cdot 10 = 120\\text{ cm}^2$."
  },
  {
    "id": 9,
    "title": "Câu 9: Chiếc lều cắm trại hình lăng trụ tam giác",
    "pts": 20,
    "question": "Một chiếc lều hình lăng trụ đứng tam giác có hai đầu hồi là tam giác cân diện tích $1,2\\text{ m}^2$, chiều dài thân lều là $3\\text{ m}$. Thể tích không khí bên trong lều là:",
    "options": [
      {
        "text": "$3,6\\text{ m}^3$",
        "correct": true
      },
      {
        "text": "$1,8\\text{ m}^3$",
        "correct": false
      },
      {
        "text": "$7,2\\text{ m}^3$",
        "correct": false
      },
      {
        "text": "$4,2\\text{ m}^3$",
        "correct": false
      }
    ],
    "explanation": "Thể tích lăng trụ: $V = S_{\\text{đáy}} \\cdot h = 1,2 \\cdot 3 = 3,6\\text{ m}^3$."
  },
  {
    "id": 10,
    "title": "Câu 10: Nhận xét hình hộp chữ nhật",
    "pts": 20,
    "question": "Hình hộp chữ nhật có thể coi là hình lăng trụ đứng nào?",
    "options": [
      {
        "text": "Hình lăng trụ đứng tứ giác",
        "correct": true
      },
      {
        "text": "Hình lăng trụ đứng tam giác",
        "correct": false
      },
      {
        "text": "Hình chóp tứ giác",
        "correct": false
      },
      {
        "text": "Hình lăng trụ xiên",
        "correct": false
      }
    ],
    "explanation": "Hình hộp chữ nhật có hai đáy là hình chữ nhật (tứ giác) và các mặt bên là hình chữ nhật vuông góc với đáy nên là hình lăng trụ đứng tứ giác."
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
  const slider = document.getElementById('lab1H');
  const lbl = document.getElementById('lab1ValH');

  function draw(h) {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`MÔ HÌNH LĂNG TRỤ ĐỨNG TAM GIÁC (CHIỀU CAO h = ${h} cm)`, canvas1.width / 2, 28);

    const ox = 90;
    const oy = 175;
    const scale = 8;
    const len = h * scale;

    // Đáy trước (tam giác đều mẫu cạnh 8)
    const ax = ox + 40, ay = oy - 90;
    const bx = ox, by = oy;
    const cx = ox + 80, cy = oy;

    // Đáy sau
    const a2x = ax + len * 0.9, a2y = ay - len * 0.2;
    const b2x = bx + len * 0.9, b2y = by - len * 0.2;
    const c2x = cx + len * 0.9, c2y = cy - len * 0.2;

    // Mặt bên đáy (nét đứt)
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.lineTo(b2x, b2y);
    ctx.moveTo(b2x, b2y); ctx.lineTo(a2x, a2y);
    ctx.moveTo(b2x, b2y); ctx.lineTo(c2x, c2y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Đáy trước
    ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
    ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Các cạnh bên thấy được
    ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(a2x, a2y);
    ctx.moveTo(cx, cy); ctx.lineTo(c2x, c2y);
    ctx.lineTo(a2x, a2y);
    ctx.stroke();

    // Mặt bên trên phải
    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
    ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(cx, cy);
    ctx.lineTo(c2x, c2y); ctx.lineTo(a2x, a2y);
    ctx.closePath();
    ctx.fill();

    // Kết quả tính toán
    const aSide = 6;
    const cDay = 3 * aSide;
    const sDay = Math.round((Math.sqrt(3) / 4) * aSide * aSide);
    const Sxq = cDay * h;
    const V = sDay * h;

    ctx.textAlign = 'left';
    ctx.font = '15px sans-serif';
    const tx = 360;

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('CÔNG THỨC & SỐ LIỆU:', tx, 70);

    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`• Đáy tam giác đều cạnh 6 cm`, tx, 95);
    ctx.fillText(`  Chu vi đáy C = 18 cm`, tx, 120);

    ctx.fillStyle = '#10b981';
    ctx.fillText(`• Sxq = C · h = 18 · ${h} = ${Sxq} cm²`, tx, 150);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`• Thể tích: V = Sđáy · h`, tx, 180);
    ctx.fillText(`  V ≈ ${sDay} · ${h} = ${V} cm³`, tx, 205);
  }

  if (slider) {
    slider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      if (lbl) lbl.textContent = `h = ${v} cm`;
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

  function draw2() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('LĂNG TRỤ ĐỨNG TỨ GIÁC (ĐÁY HÌNH THANG)', canvas2.width / 2, 28);

    // Vẽ hình thang
    const ox = 90, oy = 160;
    ctx2.fillStyle = 'rgba(16, 185, 129, 0.25)';
    ctx2.strokeStyle = '#10b981';
    ctx2.lineWidth = 2;

    ctx2.beginPath();
    ctx2.moveTo(ox + 20, oy - 70);
    ctx2.lineTo(ox + 60, oy - 70);
    ctx2.lineTo(ox + 80, oy);
    ctx2.lineTo(ox, oy);
    ctx2.closePath();
    ctx2.fill(); ctx2.stroke();

    // Mặt bên kéo dài
    ctx2.beginPath();
    ctx2.moveTo(ox + 20, oy - 70); ctx2.lineTo(ox + 160, oy - 100);
    ctx2.lineTo(ox + 200, oy - 100); ctx2.lineTo(ox + 60, oy - 70);
    ctx2.moveTo(ox + 200, oy - 100); ctx2.lineTo(ox + 220, oy - 30);
    ctx2.lineTo(ox + 80, oy);
    ctx2.stroke();

    // Ghi chú
    ctx2.textAlign = 'left';
    ctx2.font = '15px sans-serif';
    const tx = 330;

    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText('TÍNH TOÁN LĂNG TRỤ ĐỨNG HÌNH THANG:', tx, 75);

    ctx2.fillStyle = '#cbd5e1';
    ctx2.fillText('• Đáy lớn a = 8 cm, Đáy nhỏ b = 4 cm', tx, 105);
    ctx2.fillText('• Chiều cao hình thang h_thang = 3 cm', tx, 130);
    ctx2.fillText('  => Sđáy = (8 + 4) · 3 / 2 = 18 cm²', tx, 155);

    ctx2.fillStyle = '#10b981';
    ctx2.fillText('• Chiều cao lăng trụ H = 10 cm', tx, 185);
    ctx2.font = 'bold 15px sans-serif';
    ctx2.fillText('=> Thể tích V = Sđáy · H = 18 · 10 = 180 cm³ ✓', tx, 210);
  }

  const btn = document.getElementById('btnLab2Trapezoid');
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
