// ================================================================
// BÀI 6: SỐ VÔ TỈ. CĂN BẬC HAI SỐ HỌC - TOÁN 7 KNTT
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
  userTitle: 'Nhà Khai Phá Căn Thức 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai6_state';

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
    "title": "Câu 1: Định nghĩa số vô tỉ",
    "pts": 20,
    "question": "Số vô tỉ là số viết được dưới dạng nào sau đây?",
    "options": [
      {
        "text": "Số thập phân vô hạn không tuần hoàn",
        "correct": true
      },
      {
        "text": "Số thập phân vô hạn tuần hoàn",
        "correct": false
      },
      {
        "text": "Số thập phân hữu hạn",
        "correct": false
      },
      {
        "text": "Phân số $\\frac{a}{b}$ với $a, b \\in \\mathbb{Z}, b \\neq 0$",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa SGK Toán 7, số vô tỉ là số viết được dưới dạng số thập phân vô hạn không tuần hoàn."
  },
  {
    "id": 2,
    "title": "Câu 2: Nhận biết số vô tỉ quen thuộc",
    "pts": 20,
    "question": "Trong các số sau, số nào là số vô tỉ?",
    "options": [
      {
        "text": "$\\sqrt{5}$",
        "correct": true
      },
      {
        "text": "$\\sqrt{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": false
      },
      {
        "text": "$0,(12)$",
        "correct": false
      }
    ],
    "explanation": "Vì 5 không phải là số chính phương nên $\\sqrt{5} \\approx 2,23606...$ là số vô tỉ. Còn $\\sqrt{4} = 2$ là số hữu tỉ; $\\frac{2}{3}$ và $0,(12)$ là các số hữu tỉ."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính căn bậc hai số học chính phương",
    "pts": 20,
    "question": "Căn bậc hai số học của $49$ là:",
    "options": [
      {
        "text": "$7$",
        "correct": true
      },
      {
        "text": "$-7$",
        "correct": false
      },
      {
        "text": "$\\pm 7$",
        "correct": false
      },
      {
        "text": "$\\sqrt{7}$",
        "correct": false
      }
    ],
    "explanation": "Căn bậc hai số học của 49 là số không âm $x$ sao cho $x^2 = 49$, do đó $\\sqrt{49} = 7$ (chỉ lấy giá trị không âm)."
  },
  {
    "id": 4,
    "title": "Câu 4: Căn bậc hai của số 0",
    "pts": 20,
    "question": "Giá trị của $\\sqrt{0}$ bằng:",
    "options": [
      {
        "text": "$0$",
        "correct": true
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "Không xác định",
        "correct": false
      },
      {
        "text": "$\\pm 0$",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa, $\\sqrt{0} = 0$ vì $0 \\ge 0$ và $0^2 = 0$."
  },
  {
    "id": 5,
    "title": "Câu 5: Căn bậc hai của phân số",
    "pts": 20,
    "question": "Giá trị của $\\sqrt{\\frac{9}{16}}$ là:",
    "options": [
      {
        "text": "$\\frac{3}{4}$",
        "correct": true
      },
      {
        "text": "$-\\frac{3}{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{9}{16}$",
        "correct": false
      },
      {
        "text": "$\\frac{81}{256}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\sqrt{\\frac{9}{16}} = \\frac{\\sqrt{9}}{\\sqrt{16}} = \\frac{3}{4}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Căn bậc hai của số âm",
    "pts": 20,
    "question": "Số $\\sqrt{-9}$ có giá trị là:",
    "options": [
      {
        "text": "Không tồn tại trong tập số thực",
        "correct": true
      },
      {
        "text": "$-3$",
        "correct": false
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$\\pm 3$",
        "correct": false
      }
    ],
    "explanation": "Căn bậc hai số học chỉ xác định cho số không âm $a \\ge 0$. Số âm $-9 < 0$ không có căn bậc hai số học."
  },
  {
    "id": 7,
    "title": "Câu 7: So sánh hai căn bậc hai",
    "pts": 20,
    "question": "So sánh hai số $3$ và $\\sqrt{8}$, ta có:",
    "options": [
      {
        "text": "$3 > \\sqrt{8}$",
        "correct": true
      },
      {
        "text": "$3 < \\sqrt{8}$",
        "correct": false
      },
      {
        "text": "$3 = \\sqrt{8}$",
        "correct": false
      },
      {
        "text": "Không so sánh được",
        "correct": false
      }
    ],
    "explanation": "Ta có $3 = \\sqrt{9}$. Vì $9 > 8$ nên $\\sqrt{9} > \\sqrt{8}$, do đó $3 > \\sqrt{8}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Cạnh hình vuông từ diện tích",
    "pts": 20,
    "question": "Một mảnh vườn hình vuông có diện tích $81\\,\\text{m}^2$. Độ dài cạnh của mảnh vườn là:",
    "options": [
      {
        "text": "$9\\,\\text{m}$",
        "correct": true
      },
      {
        "text": "$18\\,\\text{m}$",
        "correct": false
      },
      {
        "text": "$20,25\\,\\text{m}$",
        "correct": false
      },
      {
        "text": "$8,1\\,\\text{m}$",
        "correct": false
      }
    ],
    "explanation": "Độ dài cạnh hình vuông bằng căn bậc hai số học của diện tích: $a = \\sqrt{S} = \\sqrt{81} = 9\\,\\text{m}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bình phương của căn bậc hai",
    "pts": 20,
    "question": "Giá trị của biểu thức $\\left(\\sqrt{13}\\right)^2$ bằng:",
    "options": [
      {
        "text": "$13$",
        "correct": true
      },
      {
        "text": "$\\sqrt{13}$",
        "correct": false
      },
      {
        "text": "$169$",
        "correct": false
      },
      {
        "text": "$26$",
        "correct": false
      }
    ],
    "explanation": "Theo tính chất căn bậc hai số học: $(\\sqrt{a})^2 = a$ với mọi $a \\ge 0$. Do đó $(\\sqrt{13})^2 = 13$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tìm x trong phương trình căn thức",
    "pts": 20,
    "question": "Tìm số không âm $x$ thoả mãn $\\sqrt{x} = 6$:",
    "options": [
      {
        "text": "$x = 36$",
        "correct": true
      },
      {
        "text": "$x = 12$",
        "correct": false
      },
      {
        "text": "$x = \\sqrt{6}$",
        "correct": false
      },
      {
        "text": "$x = 3$",
        "correct": false
      }
    ],
    "explanation": "Bình phương hai vế: $(\\sqrt{x})^2 = 6^2 \\implies x = 36$."
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
                let areaS = 16;

                function drawSquare() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const side = Math.sqrt(areaS);
                    const scale = 22;
                    const sidePx = side * scale;

                    const cx = w / 2;
                    const cy = h / 2;
                    const x = cx - sidePx / 2;
                    const y = cy - sidePx / 2;

                    // Ve hinh vuong
                    ctx.fillStyle = 'rgba(16, 185, 129, 0.35)';
                    ctx.fillRect(x, y, sidePx, sidePx);
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 3;
                    ctx.strokeRect(x, y, sidePx, sidePx);

                    // Chu thich dien tich
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(`S = ${areaS}`, cx, cy + 5);

                    // Chu thich canh
                    ctx.fillStyle = '#f59e0b';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText(`cạnh = √${areaS} ≈ ${side.toFixed(2)}`, cx, y - 10);

                    const out = document.getElementById('lab1SqrtOut');
                    out.innerHTML = `Hình vuông có diện tích $S = ${areaS}$ $\\implies$ Độ dài cạnh $a = \\sqrt{${areaS}} = ${side.toFixed(3)}$. (Tính chất: $(${side.toFixed(2)})^2 \\approx ${areaS}$)`;
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 200 * window.devicePixelRatio || 200;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawSquare();
                }

                document.getElementById('sliderAreaS').addEventListener('input', e => {
                    areaS = parseInt(e.target.value);
                    document.getElementById('valAreaS').textContent = areaS;
                    drawSquare();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                function runSqrt() {
                    const a = parseFloat(document.getElementById('l2_inputSqrt').value);
                    const out = document.getElementById('lab2SqrtOut');

                    if (isNaN(a) || a < 0) {
                        out.innerHTML = '<span style="color:#f43f5e;">Lỗi: Căn bậc hai số học chỉ xác định cho số không âm a ≥ 0!</span>';
                        return;
                    }

                    const val = Math.sqrt(a);
                    const isPerfSquare = Number.isInteger(val);

                    let typeHtml = '';
                    if (isPerfSquare) {
                        typeHtml = `<span style="color:#10b981;">Số chính phương $\\to$ $\\sqrt{${a}} = ${val}$ là <strong>số hữu tỉ</strong>.</span>`;
                    } else {
                        typeHtml = `<span style="color:#f59e0b;">Không phải số chính phương $\\to$ $\\sqrt{${a}} \\approx ${val.toFixed(6)}...$ là <strong>số vô tỉ</strong> (thập phân vô hạn không tuần hoàn).</span>`;
                    }

                    out.innerHTML = `
                        Căn bậc hai số học: $\\sqrt{${a}} = ${val.toFixed(5)}...$<br>
                        <strong>Phân loại:</strong> ${typeHtml}
                    `;
                    renderMathInTree(out);
                }

                document.getElementById('btnCalcSqrt').addEventListener('click', runSqrt);
                setTimeout(runSqrt, 100);
            
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
