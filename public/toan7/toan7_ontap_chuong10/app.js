// ================================================================
// BÀI TẬP CUỐI CHƯƠNG X - TOÁN 7 KNTT
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
  userTitle: 'Đại Kiện Tướng Hình Khối 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_ontap_chuong10_state';

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
    "title": "Câu 1: Thể tích hình hộp chữ nhật",
    "pts": 20,
    "question": "Hình hộp chữ nhật có ba kích thước lần lượt là $4\\text{ cm}, 6\\text{ cm}, 8\\text{ cm}$. Thể tích của nó là:",
    "options": [
      {
        "text": "$192\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$96\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$160\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$208\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "$V = a \\cdot b \\cdot h = 4 \\cdot 6 \\cdot 8 = 192\\text{ cm}^3$."
  },
  {
    "id": 2,
    "title": "Câu 2: Diện tích xung quanh hình lập phương",
    "pts": 20,
    "question": "Một hình lập phương có cạnh bằng $5\\text{ cm}$. Diện tích xung quanh của nó là:",
    "options": [
      {
        "text": "$100\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$150\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$125\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$25\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "$S_{xq} = 4a^2 = 4 \\cdot 5^2 = 4 \\cdot 25 = 100\\text{ cm}^2$."
  },
  {
    "id": 3,
    "title": "Câu 3: Thể tích lăng trụ đứng",
    "pts": 20,
    "question": "Hình lăng trụ đứng có diện tích đáy bằng $24\\text{ cm}^2$ và chiều cao $7\\text{ cm}$. Thể tích của nó là:",
    "options": [
      {
        "text": "$168\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$56\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$336\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$84\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "$V = S \\cdot h = 24 \\cdot 7 = 168\\text{ cm}^3$."
  },
  {
    "id": 4,
    "title": "Câu 4: Số đỉnh của lăng trụ tam giác",
    "pts": 20,
    "question": "Hình lăng trụ đứng tam giác có bao nhiêu đỉnh?",
    "options": [
      {
        "text": "$6$ đỉnh",
        "correct": true
      },
      {
        "text": "$8$ đỉnh",
        "correct": false
      },
      {
        "text": "$5$ đỉnh",
        "correct": false
      },
      {
        "text": "$9$ đỉnh",
        "correct": false
      }
    ],
    "explanation": "Có 3 đỉnh ở đáy trên và 3 đỉnh ở đáy dưới, tổng cộng là 6 đỉnh."
  },
  {
    "id": 5,
    "title": "Câu 5: Diện tích xung quanh lăng trụ đứng",
    "pts": 20,
    "question": "Lăng trụ đứng tam giác có đáy là tam giác đều cạnh $4\\text{ cm}$ và chiều cao lăng trụ là $10\\text{ cm}$. Diện tích xung quanh là:",
    "options": [
      {
        "text": "$120\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$40\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$60\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$160\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Chu vi đáy: $C = 4 \\cdot 3 = 12\\text{ cm}$. Diện tích xung quanh: $S_{xq} = C \\cdot h = 12 \\cdot 10 = 120\\text{ cm}^2$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tìm chiều cao hình hộp chữ nhật",
    "pts": 20,
    "question": "Một hình hộp chữ nhật có thể tích $180\\text{ cm}^3$, chiều dài $6\\text{ cm}$, chiều rộng $5\\text{ cm}$. Chiều cao của hình hộp là:",
    "options": [
      {
        "text": "$6\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$5\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$30\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$8\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "$h = \\frac{V}{a \\cdot b} = \\frac{180}{6 \\cdot 5} = \\frac{180}{30} = 6\\text{ cm}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Đổi đơn vị thể tích sang lít",
    "pts": 20,
    "question": "Một thùng chứa có thể tích $2,5\\text{ m}^3$. Thùng đó chứa được tối đa bao nhiêu lít nước?",
    "options": [
      {
        "text": "$2500$ lít",
        "correct": true
      },
      {
        "text": "$250$ lít",
        "correct": false
      },
      {
        "text": "$25000$ lít",
        "correct": false
      },
      {
        "text": "$25$ lít",
        "correct": false
      }
    ],
    "explanation": "$2,5\\text{ m}^3 = 2,5 \\cdot 1000 = 2500\\text{ lít}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Cạnh lập phương biết diện tích toàn phần",
    "pts": 20,
    "question": "Một hình lập phương có diện tích toàn phần là $96\\text{ cm}^2$. Cạnh của hình lập phương đó là:",
    "options": [
      {
        "text": "$4\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$6\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$16\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$8\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "$S_{tp} = 6a^2 = 96 \\implies a^2 = 16 \\implies a = 4\\text{ cm}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Sơn phòng học",
    "pts": 20,
    "question": "Một phòng học dài $8\\text{ m}$, rộng $6\\text{ m}$, cao $3,5\\text{ m}$. Diện tích cần quét sơn 4 bức tường phía trong phòng (không tính trần và chưa trừ cửa) là:",
    "options": [
      {
        "text": "$98\\text{ m}^2$",
        "correct": true
      },
      {
        "text": "$146\\text{ m}^2$",
        "correct": false
      },
      {
        "text": "$48\\text{ m}^2$",
        "correct": false
      },
      {
        "text": "$196\\text{ m}^2$",
        "correct": false
      }
    ],
    "explanation": "$S_{xq} = 2(a + b)h = 2(8 + 6) \\cdot 3,5 = 2 \\cdot 14 \\cdot 3,5 = 98\\text{ m}^2$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tỉ số diện tích toàn phần",
    "pts": 20,
    "question": "Nếu tăng cạnh của một hình lập phương lên gấp 3 lần thì diện tích toàn phần của nó tăng lên gấp:",
    "options": [
      {
        "text": "$9$ lần",
        "correct": true
      },
      {
        "text": "$3$ lần",
        "correct": false
      },
      {
        "text": "$6$ lần",
        "correct": false
      },
      {
        "text": "$27$ lần",
        "correct": false
      }
    ],
    "explanation": "$S_{tp} = 6a^2$. Khi $a$ tăng lên 3 lần thì $S_{tp}' = 6(3a)^2 = 9 \\cdot (6a^2) = 9S_{tp}$. Tăng lên 9 lần."
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
  let currentBlock = 1;

  function draw() {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BẢNG THÔNG SỐ ĐẶC TRƯNG HÌNH KHỐI THỰC TIỄN', canvas1.width / 2, 28);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(50, 50, canvas1.width - 100, 160);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.strokeRect(50, 50, canvas1.width - 100, 160);

    ctx.textAlign = 'left';
    ctx.font = 'bold 17px sans-serif';

    if (currentBlock === 1) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('1. HÌNH HỘP CHỮ NHẬT', 80, 85);
      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('• Đỉnh: 8 | Cạnh: 12 | Mặt: 6 (đều là hình chữ nhật)', 80, 120);
      ctx.fillText('• Sxq = 2(a + b) · h | Stp = Sxq + 2ab', 80, 150);
      ctx.fillText('• Thể tích: V = a · b · h', 80, 180);
    } else if (currentBlock === 2) {
      ctx.fillStyle = '#10b981';
      ctx.fillText('2. HÌNH LẬP PHƯƠNG', 80, 85);
      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('• Đỉnh: 8 | Cạnh: 12 (bằng nhau) | Mặt: 6 (hình vuông bằng nhau)', 80, 120);
      ctx.fillText('• Sxq = 4a² | Stp = 6a²', 80, 150);
      ctx.fillText('• Thể tích: V = a³', 80, 180);
    } else if (currentBlock === 3) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('3. HÌNH LĂNG TRỤ ĐỨNG TAM GIÁC', 80, 85);
      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('• Đỉnh: 6 | Cạnh: 9 | Mặt: 5 (2 đáy tam giác, 3 mặt bên chữ nhật)', 80, 120);
      ctx.fillText('• Sxq = (a + b + c) · h', 80, 150);
      ctx.fillText('• Thể tích: V = Sđáy · h', 80, 180);
    } else {
      ctx.fillStyle = '#ec4899';
      ctx.fillText('4. HÌNH LĂNG TRỤ ĐỨNG TỨ GIÁC', 80, 85);
      ctx.font = '15px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('• Đỉnh: 8 | Cạnh: 12 | Mặt: 6 (2 đáy tứ giác, 4 mặt bên chữ nhật)', 80, 120);
      ctx.fillText('• Sxq = Cđáy · h', 80, 150);
      ctx.fillText('• Thể tích: V = Sđáy · h', 80, 180);
    }
  }

  const b1 = document.getElementById('btnBlockBox');
  const b2 = document.getElementById('btnBlockCube');
  const b3 = document.getElementById('btnBlockTri');
  const b4 = document.getElementById('btnBlockQuad');
  if (b1) b1.onclick = () => { currentBlock = 1; draw(); };
  if (b2) b2.onclick = () => { currentBlock = 2; draw(); };
  if (b3) b3.onclick = () => { currentBlock = 3; draw(); };
  if (b4) b4.onclick = () => { currentBlock = 4; draw(); };

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
    ctx2.fillText('BÀI TOÁN BỂ NƯỚC THỰC TẾ: 10m × 5m × 2m', canvas2.width / 2, 28);

    ctx2.font = '15px sans-serif';
    ctx2.textAlign = 'left';
    const x = 70;

    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText('1. Diện tích cần lát gạch (4 thành bể + đáy bể, không có nắp):', x, 70);
    ctx2.fillStyle = '#cbd5e1';
    ctx2.fillText('   Slát = Sxq + Sđáy = 2(10 + 5) · 2 + (10 · 5) = 60 + 50 = 110 m²', x, 95);

    ctx2.fillStyle = '#10b981';
    ctx2.fillText('2. Thể tích tối đa của bể bơi:', x, 130);
    ctx2.fillStyle = '#cbd5e1';
    ctx2.fillText('   V = a · b · h = 10 · 5 · 2 = 100 m³ = 100.000 lít nước', x, 155);

    ctx2.font = 'bold 15px sans-serif';
    ctx2.fillStyle = '#fbbf24';
    ctx2.fillText('=> Chi phí lát gạch (giả sử 200.000 đ/m²): 110 · 200.000 = 22.000.000 đ ✓', x, 195);
  }

  const btn = document.getElementById('btnLab2Pool');
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
