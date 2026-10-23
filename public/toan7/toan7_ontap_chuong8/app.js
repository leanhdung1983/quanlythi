// ================================================================
// BÀI TẬP CUỐI CHƯƠNG VIII - TOÁN 7 KNTT
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
  userTitle: 'Đại Sứ Thống Kê Xác Suất 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_ontap_chuong8_state';

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
    "title": "Câu 1: Nhận diện biến cố ngẫu nhiên",
    "pts": 20,
    "question": "Trong các biến cố sau, biến cố nào là biến cố ngẫu nhiên?",
    "options": [
      {
        "text": "Ngày mai trời sẽ có nắng",
        "correct": true
      },
      {
        "text": "Nước sôi ở $100^\\circ\\text{C}$ ở áp suất tiêu chuẩn",
        "correct": false
      },
      {
        "text": "Một năm dương lịch có 15 tháng",
        "correct": false
      },
      {
        "text": "Số chấm xuất hiện khi gieo xúc xắc 6 mặt là số tự nhiên",
        "correct": false
      }
    ],
    "explanation": "Thời tiết ngày mai có thể có nắng hoặc không có nắng, là biến cố ngẫu nhiên."
  },
  {
    "id": 2,
    "title": "Câu 2: Xác suất đồng khả năng",
    "pts": 20,
    "question": "Một hộp có 5 viên bi đỏ, 3 viên bi xanh và 2 viên bi vàng. Lấy ngẫu nhiên 1 viên bi. Xác suất lấy được viên bi màu xanh là:",
    "options": [
      {
        "text": "$\\frac{3}{10}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{5}{10} = \\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{10} = \\frac{1}{5}$",
        "correct": false
      }
    ],
    "explanation": "Tổng số bi là $5 + 3 + 2 = 10$. Số bi xanh là $3$. Xác suất $P = \\frac{3}{10} = 0,3$."
  },
  {
    "id": 3,
    "title": "Câu 3: Xác suất không phải màu đỏ",
    "pts": 20,
    "question": "Trong hộp ở câu 2 (5 đỏ, 3 xanh, 2 vàng), xác suất lấy được viên bi KHÔNG phải màu đỏ là:",
    "options": [
      {
        "text": "$\\frac{5}{10} = \\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{3}{10}$",
        "correct": false
      },
      {
        "text": "$\\frac{7}{10}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{10}$",
        "correct": false
      }
    ],
    "explanation": "Bi không phải màu đỏ gồm xanh và vàng: $3 + 2 = 5$ viên. Xác suất $P = \\frac{5}{10} = \\frac{1}{2}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Xúc xắc số nguyên tố",
    "pts": 20,
    "question": "Gieo một con xúc xắc 6 mặt cân đối. Xác suất xuất hiện mặt có số chấm là số nguyên tố là:",
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
        "text": "$\\frac{2}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{6}$",
        "correct": false
      }
    ],
    "explanation": "Các số nguyên tố trên xúc xắc là 2, 3, 5 (3 mặt). Xác suất $P = \\frac{3}{6} = \\frac{1}{2}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Số lớn hơn 4 trên xúc xắc",
    "pts": 20,
    "question": "Gieo một con xúc xắc 6 mặt cân đối. Xác suất xuất hiện mặt có số chấm lớn hơn 4 là:",
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
        "text": "$\\frac{2}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{6}$",
        "correct": false
      }
    ],
    "explanation": "Các số lớn hơn 4 là 5 và 6 (2 mặt). Xác suất $P = \\frac{2}{6} = \\frac{1}{3}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tung 2 đồng xu",
    "pts": 20,
    "question": "Tung đồng thời hai đồng xu cân đối. Xác suất để cả hai đồng xu đều xuất hiện mặt ngửa (NN) là:",
    "options": [
      {
        "text": "$\\frac{1}{4}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{3}$",
        "correct": false
      }
    ],
    "explanation": "Có 4 kết quả đồng khả năng: (SS, SN, NS, NN). Chỉ có 1 kết quả NN nên $P = \\frac{1}{4}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Tung 2 đồng xu có ít nhất 1 mặt ngửa",
    "pts": 20,
    "question": "Tung đồng thời hai đồng xu. Xác suất xuất hiện ít nhất một mặt ngửa là:",
    "options": [
      {
        "text": "$\\frac{3}{4}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{4}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Các kết quả có ít nhất 1 mặt ngửa là SN, NS, NN (3 kết quả). Xác suất $P = \\frac{3}{4}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Bốc thẻ chia hết cho 5",
    "pts": 20,
    "question": "Một hộp có 20 thẻ được đánh số từ 1 đến 20. Rút ngẫu nhiên 1 thẻ. Xác suất rút được thẻ chia hết cho 5 là:",
    "options": [
      {
        "text": "$\\frac{1}{5}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{10}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{5}$",
        "correct": false
      }
    ],
    "explanation": "Các số chia hết cho 5 là 5, 10, 15, 20 (4 thẻ). Xác suất $P = \\frac{4}{20} = \\frac{1}{5}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Xác suất của biến cố đối",
    "pts": 20,
    "question": "Biết xác suất của biến cố $A$ là $P(A) = \\frac{3}{7}$. Xác suất của biến cố \"$A$ không xảy ra\" là:",
    "options": [
      {
        "text": "$\\frac{4}{7}$",
        "correct": true
      },
      {
        "text": "$\\frac{3}{7}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{7}$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      }
    ],
    "explanation": "Xác suất không xảy ra là $1 - \\frac{3}{7} = \\frac{4}{7}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tỉ số thực nghiệm và lý thuyết",
    "pts": 20,
    "question": "Khi số lần thực hiện một phép thử ngẫu nhiên càng lớn thì xác suất thực nghiệm của một biến cố sẽ:",
    "options": [
      {
        "text": "Càng gần với xác suất lí thuyết của biến cố đó",
        "correct": true
      },
      {
        "text": "Càng xa xác suất lí thuyết",
        "correct": false
      },
      {
        "text": "Luôn luôn bằng chính xác xác suất lí thuyết",
        "correct": false
      },
      {
        "text": "Bằng 0 hoặc bằng 1",
        "correct": false
      }
    ],
    "explanation": "Theo quy luật số lớn, khi số phép thử đủ lớn thì xác suất thực nghiệm sẽ tiệm cận và dao động quanh xác suất lí thuyết."
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
  const slider = document.getElementById('lab1P');
  const lbl = document.getElementById('lab1ValP');

  function draw(pVal) {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);
    const p = pVal / 100;

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('THANG ĐO MỨC ĐỘ KHẢ NĂNG CỦA BIẾN CỐ', canvas1.width / 2, 28);

    // Vẽ thanh thước
    const startX = 80;
    const barW = canvas1.width - 160;
    const barY = 90;

    const grad = ctx.createLinearGradient(startX, 0, startX + barW, 0);
    grad.addColorStop(0, '#ef4444');
    grad.addColorStop(0.5, '#fbbf24');
    grad.addColorStop(1, '#10b981');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(startX, barY, barW, 20, 10);
    ctx.fill();

    // Vạch 0, 0.5, 1
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('0 (Không thể)', startX, barY + 38);
    ctx.fillText('0.5 (Cân bằng 50-50)', startX + barW / 2, barY + 38);
    ctx.fillText('1 (Chắc chắn)', startX + barW, barY + 38);

    // Con trỏ P
    const curX = startX + p * barW;
    ctx.fillStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(curX, barY - 12);
    ctx.lineTo(curX - 8, barY - 2);
    ctx.lineTo(curX + 8, barY - 2);
    ctx.fill();

    // Nhận định
    let desc = '';
    let color = '#fbbf24';
    if (p === 0) { desc = 'BIẾN CỐ KHÔNG THỂ (Không bao giờ xảy ra)'; color = '#ef4444'; }
    else if (p < 0.4) { desc = 'BIẾN CỐ ÍT CÓ KHẢ NĂNG XẢY RA'; color = '#f97316'; }
    else if (p <= 0.6) { desc = 'CƠ HỘI XẢY RA VÀ KHÔNG XẢY RA NGANG NHAU (50-50)'; color = '#fbbf24'; }
    else if (p < 1) { desc = 'BIẾN CỐ RẤT CÓ KHẢ NĂNG XẢY RA'; color = '#38bdf8'; }
    else { desc = 'BIẾN CỐ CHẮC CHẮN (Luôn luôn xảy ra)'; color = '#10b981'; }

    ctx.font = 'bold 16px sans-serif';
    ctx.fillStyle = color;
    ctx.fillText(desc, canvas1.width / 2, 175);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Giá trị xác suất tương ứng: P = ${p.toFixed(2)} (${pVal}%)`, canvas1.width / 2, 205);
  }

  if (slider) {
    slider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      if (lbl) lbl.textContent = `P = ${(v / 100).toFixed(2)}`;
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
  let highlightSum = 7;

  function draw2() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('BẢNG 36 KẾT QUẢ ĐỒNG KHẢ NĂNG CỦA 2 XÚC XẮC', canvas2.width / 2, 26);

    const startX = 60;
    const startY = 45;
    const cell = 26;

    let favorableCount = 0;

    for (let r = 1; r <= 6; r++) {
      for (let c = 1; c <= 6; c++) {
        const sum = r + c;
        const isFav = (sum === highlightSum);
        if (isFav) favorableCount++;

        const px = startX + (c - 1) * cell;
        const py = startY + (r - 1) * cell;

        ctx2.fillStyle = isFav ? '#10b981' : 'rgba(51, 65, 85, 0.5)';
        ctx2.fillRect(px, py, cell - 2, cell - 2);
        ctx2.strokeStyle = isFav ? '#34d399' : '#475569';
        ctx2.strokeRect(px, py, cell - 2, cell - 2);

        ctx2.fillStyle = isFav ? '#fff' : '#94a3b8';
        ctx2.font = 'bold 10px sans-serif';
        ctx2.fillText(`${sum}`, px + cell / 2 - 1, py + cell / 2 + 3);
      }
    }

    // Kết luận bên phải
    ctx2.textAlign = 'left';
    ctx2.font = 'bold 15px sans-serif';
    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText(`Biến cố: "Tổng số chấm bằng ${highlightSum}"`, 245, 75);

    ctx2.font = '14px sans-serif';
    ctx2.fillStyle = '#cbd5e1';
    ctx2.fillText(`• Tổng số kết quả có thể: n = 6 · 6 = 36`, 245, 105);
    ctx2.fillText(`• Các cặp thuận lợi: (1,6), (2,5), (3,4), (4,3), (5,2), (6,1)`, 245, 135);
    ctx2.fillText(`• Số kết quả thuận lợi: k = ${favorableCount}`, 245, 165);

    ctx2.font = 'bold 16px sans-serif';
    ctx2.fillStyle = '#10b981';
    ctx2.fillText(`=> Xác suất P = 6/36 = 1/6 ≈ 16,67%`, 245, 195);
  }

  const btn = document.getElementById('btnLab2Count');
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
