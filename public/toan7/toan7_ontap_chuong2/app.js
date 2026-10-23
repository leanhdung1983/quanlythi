// ================================================================
// BÀI TẬP CUỐI CHƯƠNG II: TỔNG ÔN SỐ THỰC - TOÁN 7 KNTT
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
  userTitle: 'Đại Kiện Tướng Số Thực 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_ontap_chuong2_state';

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
    "title": "Câu 1: Nhận diện số hữu tỉ và vô tỉ",
    "pts": 20,
    "question": "Số nào sau đây là số vô tỉ?",
    "options": [
      {
        "text": "$\\sqrt{7}$",
        "correct": true
      },
      {
        "text": "$\\sqrt{9}$",
        "correct": false
      },
      {
        "text": "$3,(14)$",
        "correct": false
      },
      {
        "text": "$-2,5$",
        "correct": false
      }
    ],
    "explanation": "Vì 7 không phải số chính phương nên $\\sqrt{7}$ là số vô tỉ. Số $\\sqrt{9} = 3$, $3,(14)$ và $-2,5$ đều là số hữu tỉ."
  },
  {
    "id": 2,
    "title": "Câu 2: Căn bậc hai số học",
    "pts": 20,
    "question": "Tính giá trị của biểu thức $M = \\sqrt{64} - \\sqrt{25}$:",
    "options": [
      {
        "text": "$3$",
        "correct": true
      },
      {
        "text": "$\\sqrt{39}$",
        "correct": false
      },
      {
        "text": "$13$",
        "correct": false
      },
      {
        "text": "$-3$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\sqrt{64} = 8$ và $\\sqrt{25} = 5$. Do đó $M = 8 - 5 = 3$."
  },
  {
    "id": 3,
    "title": "Câu 3: Giá trị tuyệt đối của số thực",
    "pts": 20,
    "question": "Tính giá trị của biểu thức $N = |-\\sqrt{5}| + |\\sqrt{5}|$:",
    "options": [
      {
        "text": "$2\\sqrt{5}$",
        "correct": true
      },
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "$-2\\sqrt{5}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $|-\\sqrt{5}| = \\sqrt{5}$ và $|\\sqrt{5}| = \\sqrt{5}$. Tổng là $\\sqrt{5} + \\sqrt{5} = 2\\sqrt{5}$."
  },
  {
    "id": 4,
    "title": "Câu 4: So sánh số thực",
    "pts": 20,
    "question": "Khẳng định nào sau đây là ĐÚNG?",
    "options": [
      {
        "text": "$\\sqrt{10} > 3$",
        "correct": true
      },
      {
        "text": "$\\sqrt{10} < 3$",
        "correct": false
      },
      {
        "text": "$\\sqrt{10} = 3$",
        "correct": false
      },
      {
        "text": "$\\sqrt{10} < 2$",
        "correct": false
      }
    ],
    "explanation": "Ta có $3 = \\sqrt{9}$. Vì $10 > 9$ nên $\\sqrt{10} > \\sqrt{9} = 3$."
  },
  {
    "id": 5,
    "title": "Câu 5: Làm tròn số với độ chính xác",
    "pts": 20,
    "question": "Làm tròn số $x = 5,674$ với độ chính xác $d = 0,005$ ta được:",
    "options": [
      {
        "text": "$5,67$",
        "correct": true
      },
      {
        "text": "$5,68$",
        "correct": false
      },
      {
        "text": "$5,7$",
        "correct": false
      },
      {
        "text": "$5,674$",
        "correct": false
      }
    ],
    "explanation": "Độ chính xác $d = 0,005$ tương ứng với làm tròn đến hàng phần trăm. Chữ số hàng phần trăm là 7, chữ số ngay sau nó là 4 ($4 < 5$) nên giữ nguyên thành $5,67$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tìm x trong đẳng thức căn thức",
    "pts": 20,
    "question": "Tìm $x$ không âm thoả mãn $\\sqrt{x} - 2 = 3$:",
    "options": [
      {
        "text": "$x = 25$",
        "correct": true
      },
      {
        "text": "$x = 5$",
        "correct": false
      },
      {
        "text": "$x = 1$",
        "correct": false
      },
      {
        "text": "$x = \\sqrt{5}$",
        "correct": false
      }
    ],
    "explanation": "Chuyển vế: $\\sqrt{x} = 3 + 2 = 5$. Bình phương: $x = 5^2 = 25$."
  },
  {
    "id": 7,
    "title": "Câu 7: Tìm x trong giá trị tuyệt đối",
    "pts": 20,
    "question": "Tìm tất cả các giá trị của $x$ thoả mãn $|2x - 1| = 5$:",
    "options": [
      {
        "text": "$x = 3$ hoặc $x = -2$",
        "correct": true
      },
      {
        "text": "$x = 3$",
        "correct": false
      },
      {
        "text": "$x = -2$",
        "correct": false
      },
      {
        "text": "$x = 2$ hoặc $x = -3$",
        "correct": false
      }
    ],
    "explanation": "TH1: $2x - 1 = 5 \\implies 2x = 6 \\implies x = 3$. TH2: $2x - 1 = -5 \\implies 2x = -4 \\implies x = -2$."
  },
  {
    "id": 8,
    "title": "Câu 8: Cạnh hình vuông",
    "pts": 20,
    "question": "Một hình vuông có diện tích $S = 50\\,\\text{cm}^2$. Độ dài cạnh của hình vuông nằm trong khoảng nào sau đây?",
    "options": [
      {
        "text": "Từ $7\\,\\text{cm}$ đến $8\\,\\text{cm}$",
        "correct": true
      },
      {
        "text": "Từ $6\\,\\text{cm}$ đến $7\\,\\text{cm}$",
        "correct": false
      },
      {
        "text": "Từ $5\\,\\text{cm}$ đến $6\\,\\text{cm}$",
        "correct": false
      },
      {
        "text": "Từ $8\\,\\text{cm}$ đến $9\\,\\text{cm}$",
        "correct": false
      }
    ],
    "explanation": "Cạnh hình vuông là $a = \\sqrt{50}$. Vì $49 < 50 < 64$ nên $\\sqrt{49} < \\sqrt{50} < \\sqrt{64}$, tức $7 < \\sqrt{50} < 8$."
  },
  {
    "id": 9,
    "title": "Câu 9: Rút gọn căn của bình phương",
    "pts": 20,
    "question": "Giá trị của biểu thức $\\sqrt{(-5)^2}$ bằng:",
    "options": [
      {
        "text": "$5$",
        "correct": true
      },
      {
        "text": "$-5$",
        "correct": false
      },
      {
        "text": "$\\pm 5$",
        "correct": false
      },
      {
        "text": "$25$",
        "correct": false
      }
    ],
    "explanation": "Ta có $(-5)^2 = 25$. Căn bậc hai số học của 25 là số không âm $\\sqrt{25} = 5$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tổng hợp quan hệ tập hợp",
    "pts": 20,
    "question": "Khẳng định nào sau đây là ĐÚNG nhất về quan hệ giữa các tập hợp số?",
    "options": [
      {
        "text": "$\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q} \\subset \\mathbb{R}$",
        "correct": true
      },
      {
        "text": "$\\mathbb{N} \\subset \\mathbb{Q} \\subset \\mathbb{Z} \\subset \\mathbb{R}$",
        "correct": false
      },
      {
        "text": "$\\mathbb{I} \\subset \\mathbb{Q} \\subset \\mathbb{R}$",
        "correct": false
      },
      {
        "text": "$\\mathbb{R} \\subset \\mathbb{Q} \\subset \\mathbb{Z}$",
        "correct": false
      }
    ],
    "explanation": "Tập số tự nhiên $\\mathbb{N}$ là con của số nguyên $\\mathbb{Z}$, $\\mathbb{Z}$ là con của số hữu tỉ $\\mathbb{Q}$, và $\\mathbb{Q}$ là con của số thực $\\mathbb{R}$."
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
                const ctx = canvas.getContext('2d');
                let isZoomed = false;

                function drawRealLine() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const cy = h / 2;
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(30, cy);
                    ctx.lineTo(w - 30, cy);
                    ctx.stroke();

                    const points = isZoomed ? [
                        { name: '1', val: 1, c: '#cbd5e1' },
                        { name: '√2 ≈ 1.414', val: 1.414, c: '#f59e0b' },
                        { name: '1.5', val: 1.5, c: '#cbd5e1' },
                        { name: '√3 ≈ 1.732', val: 1.732, c: '#f59e0b' },
                        { name: '2', val: 2, c: '#cbd5e1' },
                        { name: '√5 ≈ 2.236', val: 2.236, c: '#f59e0b' },
                        { name: '3', val: 3, c: '#cbd5e1' }
                    ] : [
                        { name: '-π', val: -Math.PI, c: '#f59e0b' },
                        { name: '-√2', val: -Math.SQRT2, c: '#f59e0b' },
                        { name: '-1', val: -1, c: '#cbd5e1' },
                        { name: '0', val: 0, c: '#f43f5e' },
                        { name: '1', val: 1, c: '#cbd5e1' },
                        { name: '√2', val: Math.SQRT2, c: '#f59e0b' },
                        { name: 'π', val: Math.PI, c: '#f59e0b' }
                    ];

                    const minV = isZoomed ? 0.8 : -4;
                    const maxV = isZoomed ? 3.2 : 4;
                    const scaleX = (w - 100) / (maxV - minV);

                    points.forEach(pt => {
                        const px = 50 + (pt.val - minV) * scaleX;
                        ctx.fillStyle = pt.c;
                        ctx.beginPath();
                        ctx.arc(px, cy, 7, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.5;
                        ctx.stroke();

                        ctx.font = 'bold 12px Segoe UI';
                        ctx.textAlign = 'center';
                        ctx.fillText(pt.name, px, cy - 14);
                    });

                    const out = document.getElementById('lab1RealOut');
                    out.innerHTML = isZoomed ? 'Đang phóng to vùng $[1; 3]$: Thấy rõ các số vô tỉ $\\sqrt{2}, \\sqrt{3}, \\sqrt{5}$ đan xen liên tục giữa các số hữu tỉ.' : 'Trục số thực toàn cảnh: Biểu diễn đầy đủ số âm, số 0, số dương, hữu tỉ và vô tỉ.';
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 180 * window.devicePixelRatio || 180;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawRealLine();
                }

                document.getElementById('btnZoomReal').addEventListener('click', () => {
                    isZoomed = true;
                    drawRealLine();
                });
                document.getElementById('btnResetReal').addEventListener('click', () => {
                    isZoomed = false;
                    drawRealLine();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                function evalCh2() {
                    const sel = document.getElementById('l2_sampleCh2').value;
                    const out = document.getElementById('lab2Ch2Out');
                    let html = '';

                    if (sel === '1') {
                        html = `
                            <strong>Biểu thức:</strong> $A = \\sqrt{25} - |-7| + \\sqrt{16}$<br>
                            <em>Bước 1 (Tính căn bậc hai):</em> $\\sqrt{25} = 5$; $\\sqrt{16} = 4$<br>
                            <em>Bước 2 (Tính giá trị tuyệt đối):</em> $|-7| = 7$<br>
                            <em>Bước 3 (Thực hiện phép tính):</em> $A = 5 - 7 + 4 = 2$.
                        `;
                    } else if (sel === '2') {
                        html = `
                            <strong>Biểu thức:</strong> $B = |2 - \\sqrt{9}| + (\\sqrt{3})^2$<br>
                            <em>Bước 1 (Tính căn):</em> $\\sqrt{9} = 3$; $(\\sqrt{3})^2 = 3$<br>
                            <em>Bước 2 (Tính trong trị tuyệt đối):</em> $|2 - 3| = |-1| = 1$<br>
                            <em>Bước 3 (Cộng kết quả):</em> $B = 1 + 3 = 4$.
                        `;
                    } else if (sel === '3') {
                        html = `
                            <strong>Biểu thức:</strong> $C = 3 \\cdot \\sqrt{0,04} - |-0,6| + 1$<br>
                            <em>Bước 1:</em> $\\sqrt{0,04} = 0,2$ (vì $0,2^2 = 0,04$)<br>
                            <em>Bước 2:</em> $|-0,6| = 0,6$<br>
                            <em>Bước 3:</em> $C = 3 \\cdot 0,2 - 0,6 + 1 = 0,6 - 0,6 + 1 = 1$.
                        `;
                    }

                    out.innerHTML = html;
                    renderMathInTree(out);
                }

                document.getElementById('btnRunCh2').addEventListener('click', evalCh2);
                setTimeout(evalCh2, 100);
            
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
