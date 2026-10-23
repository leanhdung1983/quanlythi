// ================================================================
// BÀI 30: LÀM QUEN VỚI XÁC SUẤT CỦA BIẾN CỐ - TOÁN 7 KNTT
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
  userTitle: 'Chuyên Gia Thống Kê Xác Suất 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai30_state';

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
    "title": "Câu 1: Xác suất biến cố chắc chắn",
    "pts": 20,
    "question": "Xác suất của một biến cố chắc chắn luôn bằng:",
    "options": [
      {
        "text": "$1$",
        "correct": true
      },
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$0,5$",
        "correct": false
      },
      {
        "text": "$100$",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa SGK, biến cố chắc chắn có xác suất bằng 1."
  },
  {
    "id": 2,
    "title": "Câu 2: Xác suất biến cố không thể",
    "pts": 20,
    "question": "Xác suất của biến cố không thể luôn bằng:",
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
        "text": "$-1$",
        "correct": false
      },
      {
        "text": "$0,5$",
        "correct": false
      }
    ],
    "explanation": "Biến cố không thể không bao giờ xảy ra nên xác suất bằng 0."
  },
  {
    "id": 3,
    "title": "Câu 3: Xác suất tung đồng xu",
    "pts": 20,
    "question": "Tung một đồng xu cân đối và đồng chất. Xác suất xuất hiện mặt sấp (S) là:",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{4}$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      }
    ],
    "explanation": "Đồng xu có 2 mặt đồng khả năng (S, N). Xác suất mặt sấp là $P = \\frac{1}{2}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Xác suất gieo xúc xắc mặt chẵn",
    "pts": 20,
    "question": "Gieo một con xúc xắc 6 mặt cân đối. Xác suất xuất hiện mặt có số chấm là số chẵn là:",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{6}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": false
      }
    ],
    "explanation": "Có 6 kết quả có thể. Các mặt chẵn là 2, 4, 6 ($k = 3$). Xác suất $P = \\frac{3}{6} = \\frac{1}{2}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Xác suất mặt 6 chấm",
    "pts": 20,
    "question": "Gieo một con xúc xắc 6 mặt cân đối. Xác suất xuất hiện mặt 6 chấm là:",
    "options": [
      {
        "text": "$\\frac{1}{6}$",
        "correct": true
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{5}{6}$",
        "correct": false
      }
    ],
    "explanation": "Chỉ có 1 mặt 6 chấm trong tổng số 6 mặt: $P = \\frac{1}{6}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Hộp bi màu",
    "pts": 20,
    "question": "Một hộp có 4 viên bi đỏ và 6 viên bi xanh cùng kích thước. Lấy ngẫu nhiên 1 viên bi. Xác suất lấy được viên bi màu đỏ là:",
    "options": [
      {
        "text": "$\\frac{4}{10} = \\frac{2}{5}$",
        "correct": true
      },
      {
        "text": "$\\frac{6}{10} = \\frac{3}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{4}{6} = \\frac{2}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{4}$",
        "correct": false
      }
    ],
    "explanation": "Tổng số bi là $4 + 6 = 10$. Số bi đỏ là $4$. Xác suất $P = \\frac{4}{10} = \\frac{2}{5} = 0,4$."
  },
  {
    "id": 7,
    "title": "Câu 7: Xác suất biến cố đối",
    "pts": 20,
    "question": "Nếu xác suất bắn trúng bia của một xạ thủ là $0,8$ thì xác suất xạ thủ bắn trượt là:",
    "options": [
      {
        "text": "$0,2$",
        "correct": true
      },
      {
        "text": "$0,8$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$0,5$",
        "correct": false
      }
    ],
    "explanation": "Xác suất không trúng bằng $1 - 0,8 = 0,2$."
  },
  {
    "id": 8,
    "title": "Câu 8: Rút thẻ số ngẫu nhiên",
    "pts": 20,
    "question": "Một hộp có 10 tấm thẻ được đánh số từ 1 đến 10. Rút ngẫu nhiên 1 thẻ. Xác suất rút được thẻ ghi số nguyên tố là:",
    "options": [
      {
        "text": "$\\frac{4}{10} = \\frac{2}{5}$",
        "correct": true
      },
      {
        "text": "$\\frac{5}{10} = \\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{10}$",
        "correct": false
      },
      {
        "text": "$\\frac{6}{10} = \\frac{3}{5}$",
        "correct": false
      }
    ],
    "explanation": "Các số nguyên tố từ 1 đến 10 là 2, 3, 5, 7 (gồm 4 số). Xác suất $P = \\frac{4}{10} = \\frac{2}{5}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Phạm vi giá trị của xác suất",
    "pts": 20,
    "question": "Với mọi biến cố $A$, khẳng định nào sau đây luôn ĐÚNG?",
    "options": [
      {
        "text": "$0 \\le P(A) \\le 1$",
        "correct": true
      },
      {
        "text": "$0 < P(A) < 1$",
        "correct": false
      },
      {
        "text": "$P(A) \\ge 1$",
        "correct": false
      },
      {
        "text": "$P(A) > 0$",
        "correct": false
      }
    ],
    "explanation": "Xác suất luôn nằm trong đoạn $[0; 1]$ (bằng 0 đối với biến cố không thể và bằng 1 đối với biến cố chắc chắn)."
  },
  {
    "id": 10,
    "title": "Câu 10: Xúc xắc số chấm chia hết cho 3",
    "pts": 20,
    "question": "Gieo một con xúc xắc 6 mặt cân đối. Xác suất xuất hiện mặt có số chấm chia hết cho 3 là:",
    "options": [
      {
        "text": "$\\frac{1}{3}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{6}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": false
      }
    ],
    "explanation": "Các mặt chia hết cho 3 là 3 và 6 ($k = 2$). Xác suất $P = \\frac{2}{6} = \\frac{1}{3}$."
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
  let angle = 0;
  const sectors = ['Đỏ', 'Xanh', 'Đỏ', 'Vàng', 'Đỏ', 'Xanh', 'Tím', 'Xanh'];
  const colors = ['#ef4444', '#3b82f6', '#ef4444', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6', '#3b82f6'];

  function draw() {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VÒNG QUAY 8 Ô ĐỒNG KHẢ NĂNG', canvas1.width / 2, 28);

    const cx = 130;
    const cy = 125;
    const r = 80;
    const arc = (Math.PI * 2) / 8;

    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.fillStyle = colors[i];
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, angle + i * arc, angle + (i + 1) * arc);
      ctx.fill();
      ctx.stroke();

      // Nhãn chữ
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(angle + i * arc + arc / 2);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(sectors[i], 50, 4);
      ctx.restore();
    }

    // Mũi tên chỉ vị trí
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.moveTo(cx + r + 15, cy);
    ctx.lineTo(cx + r + 30, cy - 10);
    ctx.lineTo(cx + r + 30, cy + 10);
    ctx.fill();

    // Bảng xác suất lý thuyết
    ctx.textAlign = 'left';
    ctx.font = '15px sans-serif';
    const tx = 250;

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('BẢNG XÁC SUẤT LÝ THUYẾT (Tổng n = 8 ô):', tx, 70);

    ctx.fillStyle = '#ef4444';
    ctx.fillText('• Biến cố vào ô ĐỎ (k = 3): P = 3/8 = 37,5%', tx, 105);

    ctx.fillStyle = '#3b82f6';
    ctx.fillText('• Biến cố vào ô XANH (k = 3): P = 3/8 = 37,5%', tx, 135);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText('• Biến cố vào ô VÀNG (k = 1): P = 1/8 = 12,5%', tx, 165);

    ctx.fillStyle = '#8b5cf6';
    ctx.fillText('• Biến cố vào ô TÍM (k = 1): P = 1/8 = 12,5%', tx, 195);
  }

  const btn = document.getElementById('btnLab1Spin');
  if (btn) {
    btn.onclick = () => {
      angle += Math.PI / 4 + Math.random() * Math.PI * 2;
      draw();
    };
  }
  draw();
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');
  let heads = 52;
  let tails = 48;

  function draw2() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('MÔ PHỎNG LUẬT SỐ LỚN: TUNG ĐỒNG XU 100 LẦN', canvas2.width / 2, 28);

    const barW = 120;
    const startY = 170;

    // Cột Mặt Ngửa
    const hHeads = heads * 1.2;
    ctx2.fillStyle = '#38bdf8';
    ctx2.fillRect(130, startY - hHeads, barW, hHeads);
    ctx2.fillStyle = '#fff';
    ctx2.font = 'bold 14px sans-serif';
    ctx2.fillText(`Mặt Ngửa (N)`, 130 + barW / 2, startY + 20);
    ctx2.fillText(`${heads} lần (${heads}%)`, 130 + barW / 2, startY - hHeads - 10);

    // Cột Mặt Sấp
    const hTails = tails * 1.2;
    ctx2.fillStyle = '#f59e0b';
    ctx2.fillRect(350, startY - hTails, barW, hTails);
    ctx2.fillStyle = '#fff';
    ctx2.fillText(`Mặt Sấp (S)`, 350 + barW / 2, startY + 20);
    ctx2.fillText(`${tails} lần (${tails}%)`, 350 + barW / 2, startY - hTails - 10);

    ctx2.font = 'bold 14px sans-serif';
    ctx2.fillStyle = '#10b981';
    ctx2.fillText(`Xác suất lý thuyết P = 1/2 = 50%. Tần số thực nghiệm dao động quanh 50%!`, canvas2.width / 2, 220);
  }

  const btn = document.getElementById('btnLab2Flip');
  if (btn) {
    btn.onclick = () => {
      heads = 0;
      for (let i = 0; i < 100; i++) {
        if (Math.random() < 0.5) heads++;
      }
      tails = 100 - heads;
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
