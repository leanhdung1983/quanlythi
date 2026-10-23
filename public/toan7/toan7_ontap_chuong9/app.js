// ================================================================
// BÀI TẬP CUỐI CHƯƠNG IX - TOÁN 7 KNTT
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
  userTitle: 'Đại Kiện Tướng Hình Học 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_ontap_chuong9_state';

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
    "title": "Câu 1: So sánh cạnh và góc",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có $AB = 5\\text{ cm}, BC = 7\\text{ cm}, AC = 8\\text{ cm}$. Góc nhỏ nhất của tam giác là:",
    "options": [
      {
        "text": "Góc $C$",
        "correct": true
      },
      {
        "text": "Góc $A$",
        "correct": false
      },
      {
        "text": "Góc $B$",
        "correct": false
      },
      {
        "text": "Cả ba góc bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Cạnh ngắn nhất là $AB = 5\\text{ cm}$, nên góc đối diện với nó là góc $C$ là góc nhỏ nhất."
  },
  {
    "id": 2,
    "title": "Câu 2: Kiểm tra bất đẳng thức tam giác",
    "pts": 20,
    "question": "Bộ ba số nào sau đây KHÔNG THỂ là độ dài 3 cạnh của một tam giác?",
    "options": [
      {
        "text": "$2; 5; 7$",
        "correct": true
      },
      {
        "text": "$3; 4; 6$",
        "correct": false
      },
      {
        "text": "$5; 5; 8$",
        "correct": false
      },
      {
        "text": "$6; 8; 10$",
        "correct": false
      }
    ],
    "explanation": "Vì $2 + 5 = 7$, tổng hai cạnh bằng cạnh thứ ba nên không tạo thành tam giác."
  },
  {
    "id": 3,
    "title": "Câu 3: Đoạn vuông góc ngắn nhất",
    "pts": 20,
    "question": "Từ điểm $P$ ở ngoài đường thẳng $d$, kẻ đoạn vuông góc $PH$ và các đoạn xiên $PA, PB$. Điều nào sau đây luôn đúng?",
    "options": [
      {
        "text": "$PH < PA$",
        "correct": true
      },
      {
        "text": "$PA < PH$",
        "correct": false
      },
      {
        "text": "$PA = PB$",
        "correct": false
      },
      {
        "text": "$PH = PA$",
        "correct": false
      }
    ],
    "explanation": "Đoạn vuông góc $PH$ luôn là đoạn ngắn nhất từ điểm $P$ đến đường thẳng $d$."
  },
  {
    "id": 4,
    "title": "Câu 4: Trọng tâm cách đỉnh",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có trung tuyến $AD = 12\\text{ cm}$ và trọng tâm $G$. Độ dài đoạn thẳng $AG$ là:",
    "options": [
      {
        "text": "$8\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$4\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$6\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$9\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "$AG = \\frac{2}{3} AD = \\frac{2}{3} \\cdot 12 = 8\\text{ cm}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tâm đường tròn nội tiếp",
    "pts": 20,
    "question": "Tâm đường tròn nội tiếp tam giác là giao điểm của:",
    "options": [
      {
        "text": "Ba đường phân giác",
        "correct": true
      },
      {
        "text": "Ba đường trung tuyến",
        "correct": false
      },
      {
        "text": "Ba đường trung trực",
        "correct": false
      },
      {
        "text": "Ba đường cao",
        "correct": false
      }
    ],
    "explanation": "Tâm đường tròn nội tiếp tam giác là giao điểm của ba đường phân giác trong."
  },
  {
    "id": 6,
    "title": "Câu 6: Tâm đường tròn ngoại tiếp",
    "pts": 20,
    "question": "Tâm đường tròn ngoại tiếp tam giác là giao điểm của:",
    "options": [
      {
        "text": "Ba đường trung trực",
        "correct": true
      },
      {
        "text": "Ba đường cao",
        "correct": false
      },
      {
        "text": "Ba đường trung tuyến",
        "correct": false
      },
      {
        "text": "Ba đường phân giác",
        "correct": false
      }
    ],
    "explanation": "Tâm đường tròn ngoại tiếp tam giác là giao điểm của ba đường trung trực."
  },
  {
    "id": 7,
    "title": "Câu 7: Trực tâm tam giác vuông",
    "pts": 20,
    "question": "Trong $\\Delta ABC$ vuông tại $C$, trực tâm của tam giác là:",
    "options": [
      {
        "text": "Đỉnh $C$",
        "correct": true
      },
      {
        "text": "Đỉnh $A$",
        "correct": false
      },
      {
        "text": "Đỉnh $B$",
        "correct": false
      },
      {
        "text": "Trung điểm $AB$",
        "correct": false
      }
    ],
    "explanation": "Trong tam giác vuông, trực tâm trùng với đỉnh góc vuông (ở đây là đỉnh $C$)."
  },
  {
    "id": 8,
    "title": "Câu 8: Cạnh tam giác cân",
    "pts": 20,
    "question": "Một tam giác cân có độ dài hai cạnh là $3\\text{ cm}$ và $7\\text{ cm}$. Độ dài cạnh thứ ba là:",
    "options": [
      {
        "text": "$7\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$3\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$4\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$10\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Nếu cạnh thứ ba là 3 thì bộ ba $(3, 3, 7)$ loại vì $3 + 3 = 6 < 7$. Do đó cạnh thứ ba phải bằng $7\\text{ cm}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Vị trí tâm ngoại tiếp tam giác vuông",
    "pts": 20,
    "question": "Tâm đường tròn ngoại tiếp của một tam giác vuông nằm ở:",
    "options": [
      {
        "text": "Trung điểm của cạnh huyền",
        "correct": true
      },
      {
        "text": "Bên trong tam giác",
        "correct": false
      },
      {
        "text": "Bên ngoài tam giác",
        "correct": false
      },
      {
        "text": "Đỉnh góc vuông",
        "correct": false
      }
    ],
    "explanation": "Trung điểm cạnh huyền cách đều ba đỉnh của tam giác vuông, do đó là tâm ngoại tiếp."
  },
  {
    "id": 10,
    "title": "Câu 10: Tam giác đều có các đường đồng quy trùng nhau",
    "pts": 20,
    "question": "Tam giác nào sau đây có trọng tâm, trực tâm, tâm nội tiếp và tâm ngoại tiếp cùng trùng nhau tại một điểm?",
    "options": [
      {
        "text": "Tam giác đều",
        "correct": true
      },
      {
        "text": "Tam giác vuông cân",
        "correct": false
      },
      {
        "text": "Tam giác cân",
        "correct": false
      },
      {
        "text": "Tam giác tù",
        "correct": false
      }
    ],
    "explanation": "Tam giác đều có tính chất đặc biệt là cả 4 điểm đặc biệt (trọng tâm, trực tâm, tâm nội tiếp, tâm ngoại tiếp) trùng nhau."
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
  let currentPoint = 'G';

  function draw() {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BẢN ĐỒ 4 ĐIỂM ĐẶC BIỆT CỦA TAM GIÁC', canvas1.width / 2, 28);

    const ax = 190, ay = 50;
    const bx = 80, by = 180;
    const cx = 330, cy = 180;

    // Tam giác
    ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('A', ax, ay - 8);
    ctx.fillText('B', bx - 12, by + 5);
    ctx.fillText('C', cx + 12, cy + 5);

    // Điểm hiển thị
    let px = 0, py = 0, pName = '', pColor = '', pDesc = '';

    if (currentPoint === 'G') {
      px = (ax + bx + cx) / 3; py = (ay + by + cy) / 3;
      pName = 'G (Trọng tâm)'; pColor = '#f59e0b';
      pDesc = 'Giao điểm 3 trung tuyến - Tỉ lệ 2/3 - Tâm cân bằng trọng lực';
    } else if (currentPoint === 'I') {
      px = 195; py = 138;
      pName = 'I (Tâm nội tiếp)'; pColor = '#10b981';
      pDesc = 'Giao điểm 3 phân giác - Cách đều 3 cạnh - Tâm đường tròn nội tiếp';
    } else if (currentPoint === 'O') {
      px = 205; py = 125;
      pName = 'O (Tâm ngoại tiếp)'; pColor = '#38bdf8';
      pDesc = 'Giao điểm 3 trung trực - Cách đều 3 đỉnh - Tâm đường tròn ngoại tiếp';
    } else {
      px = 185; py = 150;
      pName = 'H (Trực tâm)'; pColor = '#ec4899';
      pDesc = 'Giao điểm 3 đường cao - Nằm trong tam giác nhọn';
    }

    ctx.fillStyle = pColor;
    ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.stroke();

    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(pName, px + 50, py + 5);

    ctx.fillStyle = pColor;
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(pDesc, canvas1.width / 2, 215);
  }

  const bG = document.getElementById('btnAllG');
  const bI = document.getElementById('btnAllI');
  const bO = document.getElementById('btnAllO');
  const bH = document.getElementById('btnAllH');
  if (bG) bG.onclick = () => { currentPoint = 'G'; draw(); };
  if (bI) bI.onclick = () => { currentPoint = 'I'; draw(); };
  if (bO) bO.onclick = () => { currentPoint = 'O'; draw(); };
  if (bH) bH.onclick = () => { currentPoint = 'H'; draw(); };

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
    ctx2.fillText('PHÂN TÍCH QUAN HỆ TAM GIÁC MẪU: a = 5, b = 7, c = 9', canvas2.width / 2, 28);

    ctx2.font = '15px sans-serif';
    ctx2.textAlign = 'left';
    const x = 70;

    ctx2.fillStyle = '#10b981';
    ctx2.fillText('1. Bất đẳng thức tam giác: 5 + 7 = 12 > 9 => TỒN TẠI TAM GIÁC ✓', x, 70);

    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText('2. So sánh cạnh: BC = a = 5 < AC = b = 7 < AB = c = 9', x, 105);

    ctx2.fillStyle = '#f59e0b';
    ctx2.fillText('3. Suy ra so sánh góc đối diện: Góc A < Góc B < Góc C (Định lí 1) ✓', x, 140);

    ctx2.fillStyle = '#ec4899';
    ctx2.fillText('4. Bán kính ngoại tiếp R và nội tiếp r luôn xác định duy nhất!', x, 175);
  }

  const btn = document.getElementById('btnLab2Sort');
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
