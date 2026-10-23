// ================================================================
// BÀI 29: LÀM QUEN VỚI BIẾN CỐ - TOÁN 7 KNTT
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
  userTitle: 'Nhà Quan Sát Biến Cố 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai29_state';

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
    "title": "Câu 1: Nhận diện biến cố chắc chắn",
    "pts": 20,
    "question": "Trong phép thử gieo một con xúc xắc 6 mặt cân đối, biến cố nào sau đây là biến cố chắc chắn?",
    "options": [
      {
        "text": "Số chấm xuất hiện nhỏ hơn 7",
        "correct": true
      },
      {
        "text": "Số chấm xuất hiện là số lẻ",
        "correct": false
      },
      {
        "text": "Số chấm xuất hiện lớn hơn 3",
        "correct": false
      },
      {
        "text": "Số chấm xuất hiện bằng 6",
        "correct": false
      }
    ],
    "explanation": "Vì các mặt xúc xắc có số chấm từ 1 đến 6 nên số chấm luôn nhỏ hơn 7. Đây là biến cố chắc chắn."
  },
  {
    "id": 2,
    "title": "Câu 2: Nhận diện biến cố không thể",
    "pts": 20,
    "question": "Trong phép thử gieo một con xúc xắc 6 mặt, biến cố nào sau đây là biến cố không thể?",
    "options": [
      {
        "text": "Số chấm xuất hiện bằng 7",
        "correct": true
      },
      {
        "text": "Số chấm xuất hiện bằng 1",
        "correct": false
      },
      {
        "text": "Số chấm xuất hiện chia hết cho 2",
        "correct": false
      },
      {
        "text": "Số chấm xuất hiện lớn hơn 1",
        "correct": false
      }
    ],
    "explanation": "Xúc xắc 6 mặt chỉ có từ 1 đến 6 chấm, không thể xuất hiện mặt 7 chấm."
  },
  {
    "id": 3,
    "title": "Câu 3: Nhận diện biến cố ngẫu nhiên",
    "pts": 20,
    "question": "Biến cố nào sau đây là biến cố ngẫu nhiên khi tung một đồng xu?",
    "options": [
      {
        "text": "Đồng xu xuất hiện mặt sấp (S)",
        "correct": true
      },
      {
        "text": "Đồng xu xuất hiện mặt sấp hoặc mặt ngửa",
        "correct": false
      },
      {
        "text": "Đồng xu đứng thăng bằng trên cạnh",
        "correct": false
      },
      {
        "text": "Đồng xu biến mất",
        "correct": false
      }
    ],
    "explanation": "Đồng xu khi rơi xuống có thể xuất hiện mặt sấp hoặc mặt ngửa, nên biến cố \"xuất hiện mặt sấp\" là biến cố ngẫu nhiên."
  },
  {
    "id": 4,
    "title": "Câu 4: Hộp bút chì màu",
    "pts": 20,
    "question": "Trong hộp chỉ có 5 chiếc bút chì màu xanh. Rút ngẫu nhiên 1 chiếc bút. Biến cố \"Rút được bút màu xanh\" là biến cố gì?",
    "options": [
      {
        "text": "Biến cố chắc chắn",
        "correct": true
      },
      {
        "text": "Biến cố không thể",
        "correct": false
      },
      {
        "text": "Biến cố ngẫu nhiên",
        "correct": false
      },
      {
        "text": "Không xác định",
        "correct": false
      }
    ],
    "explanation": "Vì trong hộp toàn bút màu xanh nên chắc chắn rút được bút màu xanh."
  },
  {
    "id": 5,
    "title": "Câu 5: Hộp toàn bi trắng",
    "pts": 20,
    "question": "Một túi đựng 10 viên bi màu trắng. Rút ngẫu nhiên 1 viên bi. Biến cố \"Rút được viên bi màu đỏ\" là:",
    "options": [
      {
        "text": "Biến cố không thể",
        "correct": true
      },
      {
        "text": "Biến cố chắc chắn",
        "correct": false
      },
      {
        "text": "Biến cố ngẫu nhiên",
        "correct": false
      },
      {
        "text": "Biến cố đồng khả năng",
        "correct": false
      }
    ],
    "explanation": "Trong túi không có viên bi đỏ nào nên không bao giờ rút được bi đỏ."
  },
  {
    "id": 6,
    "title": "Câu 6: Thời tiết ngẫu nhiên",
    "pts": 20,
    "question": "Biến cố \"Ngày mai tại Đà Nẵng trời có mưa\" là loại biến cố nào?",
    "options": [
      {
        "text": "Biến cố ngẫu nhiên",
        "correct": true
      },
      {
        "text": "Biến cố chắc chắn",
        "correct": false
      },
      {
        "text": "Biến cố không thể",
        "correct": false
      },
      {
        "text": "Biến cố đối",
        "correct": false
      }
    ],
    "explanation": "Thời tiết ngày mai có thể mưa hoặc không mưa, ta không thể biết chắc chắn trước khi ngày mai diễn ra."
  },
  {
    "id": 7,
    "title": "Câu 7: Tổng số chấm hai xúc xắc",
    "pts": 20,
    "question": "Gieo đồng thời hai con xúc xắc 6 mặt. Biến cố \"Tổng số chấm xuất hiện bằng 1\" là:",
    "options": [
      {
        "text": "Biến cố không thể",
        "correct": true
      },
      {
        "text": "Biến cố chắc chắn",
        "correct": false
      },
      {
        "text": "Biến cố ngẫu nhiên",
        "correct": false
      },
      {
        "text": "Biến cố độc lập",
        "correct": false
      }
    ],
    "explanation": "Tổng số chấm nhỏ nhất của hai xúc xắc là $1 + 1 = 2$, do đó tổng không thể bằng 1."
  },
  {
    "id": 8,
    "title": "Câu 8: Tổng số chấm lớn nhất",
    "pts": 20,
    "question": "Gieo đồng thời hai con xúc xắc 6 mặt. Biến cố \"Tổng số chấm xuất hiện không vượt quá 12\" là:",
    "options": [
      {
        "text": "Biến cố chắc chắn",
        "correct": true
      },
      {
        "text": "Biến cố ngẫu nhiên",
        "correct": false
      },
      {
        "text": "Biến cố không thể",
        "correct": false
      },
      {
        "text": "Biến cố cân bằng",
        "correct": false
      }
    ],
    "explanation": "Mỗi xúc xắc có số chấm tối đa là 6, nên tổng số chấm tối đa là $6 + 6 = 12$. Do đó tổng luôn luôn $\\le 12$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bốc thăm số thứ tự",
    "pts": 20,
    "question": "Lớp có 40 học sinh đánh số từ 1 đến 40. Bốc thăm ngẫu nhiên 1 bạn. Biến cố \"Số được bốc là số nguyên dương nhỏ hơn 50\" là:",
    "options": [
      {
        "text": "Biến cố chắc chắn",
        "correct": true
      },
      {
        "text": "Biến cố ngẫu nhiên",
        "correct": false
      },
      {
        "text": "Biến cố không thể",
        "correct": false
      },
      {
        "text": "Biến cố rỗng",
        "correct": false
      }
    ],
    "explanation": "Tất cả các số từ 1 đến 40 đều là số nguyên dương nhỏ hơn 50."
  },
  {
    "id": 10,
    "title": "Câu 10: Nhận định đúng về biến cố",
    "pts": 20,
    "question": "Khẳng định nào sau đây là ĐÚNG?",
    "options": [
      {
        "text": "Biến cố chắc chắn là biến cố luôn luôn xảy ra",
        "correct": true
      },
      {
        "text": "Biến cố không thể là biến cố có thể xảy ra",
        "correct": false
      },
      {
        "text": "Biến cố ngẫu nhiên là biến cố không bao giờ xảy ra",
        "correct": false
      },
      {
        "text": "Mọi biến cố đều là biến cố chắc chắn",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa: Biến cố chắc chắn luôn xảy ra trong mọi lần thực hiện phép thử."
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
  let diceVal = 4;

  function draw() {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('MÔ PHỎNG PHÉP THỬ: GIEO XÚC XẮC 6 MẶT', canvas1.width / 2, 28);

    // Vẽ con xúc xắc
    const cx = 130;
    const cy = 115;
    const size = 90;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(cx - size/2, cy - size/2, size, size, 16);
    ctx.fill();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Vẽ chấm tròn xúc xắc
    ctx.fillStyle = '#1e1b4b';
    function dot(x, y) {
      ctx.beginPath();
      ctx.arc(cx + x, cy + y, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    if (diceVal % 2 === 1) dot(0, 0);
    if (diceVal > 1) { dot(-25, -25); dot(25, 25); }
    if (diceVal > 3) { dot(25, -25); dot(-25, 25); }
    if (diceVal === 6) { dot(-25, 0); dot(25, 0); }

    // Kiểm tra 3 biến cố
    ctx.textAlign = 'left';
    ctx.font = '15px sans-serif';
    const textX = 230;

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Kết quả gieo được: Mặt ${diceVal} chấm`, textX, 70);

    // Biến cố A: chắc chắn
    ctx.fillStyle = '#10b981';
    ctx.fillText(`• Biến cố A: "Số chấm ≤ 6" -> CHẮC CHẮN (Đang xảy ra ✓)`, textX, 105);

    // Biến cố B: không thể
    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`• Biến cố B: "Số chấm = 8" -> KHÔNG THỂ (Không xảy ra ✗)`, textX, 140);

    // Biến cố C: ngẫu nhiên
    const isEven = diceVal % 2 === 0;
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`• Biến cố C: "Số chấm là số chẵn" -> NGẪU NHIÊN`, textX, 175);
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`  => Hiện tại: ${diceVal} là số ${isEven ? 'CHẴN (XẢY RA ✓)' : 'LẺ (KHÔNG XẢY RA ✗)'}`, textX, 200);
  }

  const btn = document.getElementById('btnLab1Roll');
  if (btn) {
    btn.onclick = () => {
      diceVal = Math.floor(Math.random() * 6) + 1;
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
  let pickedColor = 'Đỏ';

  function draw2() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('PHÉP THỬ: BỐC 1 VIÊN BI TRONG HỘP (3 ĐỎ, 2 XANH)', canvas2.width / 2, 28);

    // Vẽ hộp bi
    ctx2.strokeStyle = '#94a3b8';
    ctx2.lineWidth = 3;
    ctx2.strokeRect(60, 60, 160, 120);
    ctx2.fillStyle = '#cbd5e1';
    ctx2.font = '13px sans-serif';
    ctx2.fillText('Hộp: 3 Đỏ, 2 Xanh', 140, 80);

    // 3 bi đỏ
    ctx2.fillStyle = '#ef4444';
    for (let i = 0; i < 3; i++) {
      ctx2.beginPath();
      ctx2.arc(95 + i * 35, 115, 14, 0, Math.PI * 2);
      ctx2.fill();
    }
    // 2 bi xanh
    ctx2.fillStyle = '#3b82f6';
    for (let i = 0; i < 2; i++) {
      ctx2.beginPath();
      ctx2.arc(110 + i * 40, 155, 14, 0, Math.PI * 2);
      ctx2.fill();
    }

    // Bi được bốc ra
    ctx2.textAlign = 'left';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.fillStyle = '#f8fafc';
    ctx2.fillText('Viên bi vừa bốc được:', 270, 75);

    ctx2.fillStyle = pickedColor === 'Đỏ' ? '#ef4444' : '#3b82f6';
    ctx2.beginPath();
    ctx2.arc(350, 125, 24, 0, Math.PI * 2);
    ctx2.fill();
    ctx2.strokeStyle = '#fff';
    ctx2.lineWidth = 2;
    ctx2.stroke();

    ctx2.fillStyle = '#fff';
    ctx2.font = 'bold 15px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(pickedColor, 350, 131);

    ctx2.textAlign = 'left';
    ctx2.font = '14px sans-serif';
    ctx2.fillStyle = '#cbd5e1';
    ctx2.fillText('• Biến cố "Bốc được bi màu vàng": KHÔNG THỂ', 260, 175);
    ctx2.fillText('• Biến cố "Bốc được bi đỏ hoặc xanh": CHẮC CHẮN', 260, 200);
  }

  const btn = document.getElementById('btnLab2Draw');
  if (btn) {
    btn.onclick = () => {
      // 3 đỏ, 2 xanh -> tỉ lệ 3/5 và 2/5
      pickedColor = Math.random() < 0.6 ? 'Đỏ' : 'Xanh';
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
