// ================================================================
// BÀI 1: TẬP HỢP CÁC SỐ HỮU TỈ - TOÁN 7 KNTT
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
  userTitle: 'Nhà Thám Hiểm Số Hữu Tỉ 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai1_state';

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
    "title": "Câu 1: Khái niệm số hữu tỉ",
    "pts": 20,
    "question": "Số nào sau đây là số hữu tỉ?",
    "options": [
      {
        "text": "$-0,75$",
        "correct": true
      },
      {
        "text": "$\\sqrt{2}$",
        "correct": false
      },
      {
        "text": "$\\pi$",
        "correct": false
      },
      {
        "text": "$1,010010001...$",
        "correct": false
      }
    ],
    "explanation": "Ta có $-0,75 = -\\frac{75}{100} = -\\frac{3}{4}$ với $-3, 4 \\in \\mathbb{Z}, 4 \\neq 0$ nên $-0,75$ là số hữu tỉ."
  },
  {
    "id": 2,
    "title": "Câu 2: Quan hệ giữa các tập hợp số",
    "pts": 20,
    "question": "Khẳng định nào sau đây là ĐÚNG về quan hệ bao hàm giữa các tập hợp số?",
    "options": [
      {
        "text": "$\\mathbb{N} \\subset \\mathbb{Z} \\subset \\mathbb{Q}$",
        "correct": true
      },
      {
        "text": "$\\mathbb{Q} \\subset \\mathbb{Z} \\subset \\mathbb{N}$",
        "correct": false
      },
      {
        "text": "$\\mathbb{Z} \\subset \\mathbb{N} \\subset \\mathbb{Q}$",
        "correct": false
      },
      {
        "text": "$\\mathbb{N} \\subset \\mathbb{Q} \\subset \\mathbb{Z}$",
        "correct": false
      }
    ],
    "explanation": "Tập hợp số tự nhiên $\\mathbb{N}$ là tập con của tập số nguyên $\\mathbb{Z}$, và $\\mathbb{Z}$ là tập con của tập số hữu tỉ $\\mathbb{Q}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Số đối của số hữu tỉ",
    "pts": 20,
    "question": "Số đối của số hữu tỉ $-\\frac{4}{7}$ là:",
    "options": [
      {
        "text": "$\\frac{4}{7}$",
        "correct": true
      },
      {
        "text": "$-\\frac{7}{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{7}{4}$",
        "correct": false
      },
      {
        "text": "$-\\frac{4}{7}$",
        "correct": false
      }
    ],
    "explanation": "Số đối của $-\\frac{4}{7}$ là $-\\left(-\\frac{4}{7}\\right) = \\frac{4}{7}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Điểm biểu diễn trên trục số",
    "pts": 20,
    "question": "Trên trục số nằm ngang, điểm biểu diễn số hữu tỉ nào sau đây nằm bên trái điểm gốc $0$?",
    "options": [
      {
        "text": "$-\\frac{2}{3}$",
        "correct": true
      },
      {
        "text": "$\\frac{5}{2}$",
        "correct": false
      },
      {
        "text": "$0,8$",
        "correct": false
      },
      {
        "text": "$1\\frac{1}{4}$",
        "correct": false
      }
    ],
    "explanation": "Số hữu tỉ âm luôn được biểu diễn bởi một điểm nằm bên trái gốc 0 trên trục số nằm ngang. Vì $-\\frac{2}{3} < 0$ nên nó nằm bên trái gốc 0."
  },
  {
    "id": 5,
    "title": "Câu 5: So sánh số hữu tỉ âm",
    "pts": 20,
    "question": "So sánh hai số hữu tỉ $x = -\\frac{3}{5}$ và $y = -\\frac{2}{5}$, ta có:",
    "options": [
      {
        "text": "$x < y$",
        "correct": true
      },
      {
        "text": "$x > y$",
        "correct": false
      },
      {
        "text": "$x = y$",
        "correct": false
      },
      {
        "text": "$x \\ge y$",
        "correct": false
      }
    ],
    "explanation": "Hai phân số cùng mẫu dương 5. Vì $-3 < -2$ nên $-\\frac{3}{5} < -\\frac{2}{5}$, tức là $x < y$."
  },
  {
    "id": 6,
    "title": "Câu 6: Phân số biểu diễn cùng một số hữu tỉ",
    "pts": 20,
    "question": "Phân số nào sau đây KHÔNG biểu diễn số hữu tỉ $\\frac{3}{4}$?",
    "options": [
      {
        "text": "$\\frac{6}{8}$",
        "correct": false
      },
      {
        "text": "$\\frac{-9}{-12}$",
        "correct": false
      },
      {
        "text": "$\\frac{15}{20}$",
        "correct": false
      },
      {
        "text": "$\\frac{9}{16}$",
        "correct": true
      }
    ],
    "explanation": "Ta có $\\frac{6}{8} = \\frac{-9}{-12} = \\frac{15}{20} = \\frac{3}{4}$. Riêng phân số $\\frac{9}{16} \\neq \\frac{3}{4}$ (vì $9 \\cdot 4 = 36 \\neq 16 \\cdot 3 = 48$)."
  },
  {
    "id": 7,
    "title": "Câu 7: So sánh số hữu tỉ khác mẫu",
    "pts": 20,
    "question": "Cho hai số hữu tỉ $a = -0,6$ và $b = -\\frac{1}{2}$. Khẳng định nào sau đây là ĐÚNG?",
    "options": [
      {
        "text": "$a < b$",
        "correct": true
      },
      {
        "text": "$a > b$",
        "correct": false
      },
      {
        "text": "$a = b$",
        "correct": false
      },
      {
        "text": "$a \\ge b$",
        "correct": false
      }
    ],
    "explanation": "Ta có $a = -0,6 = -\\frac{3}{5} = -\\frac{6}{10}$ và $b = -\\frac{1}{2} = -\\frac{5}{10}$. Do $-6 < -5$ nên $-\\frac{6}{10} < -\\frac{5}{10}$, suy ra $a < b$."
  },
  {
    "id": 8,
    "title": "Câu 8: Khoảng cách giữa hai điểm đối nhau",
    "pts": 20,
    "question": "Trên trục số, khoảng cách giữa điểm biểu diễn số hữu tỉ $\\frac{3}{2}$ và điểm biểu diễn số đối của nó là:",
    "options": [
      {
        "text": "$3$",
        "correct": true
      },
      {
        "text": "$\\frac{3}{2}$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$6$",
        "correct": false
      }
    ],
    "explanation": "Số đối của $\\frac{3}{2}$ là $-\\frac{3}{2}$. Khoảng cách giữa hai điểm này là $\\left|\\frac{3}{2} - \\left(-\\frac{3}{2}\\right)\\right| = \\frac{3}{2} + \\frac{3}{2} = 3$."
  },
  {
    "id": 9,
    "title": "Câu 9: Xác định số hữu tỉ giữa hai số",
    "pts": 20,
    "question": "Số hữu tỉ nào sau đây nằm giữa $-\\frac{1}{3}$ và $\\frac{1}{3}$ trên trục số?",
    "options": [
      {
        "text": "$0$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$-\\frac{2}{3}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Vì $-\\frac{1}{3} < 0 < \\frac{1}{3}$ nên số 0 nằm giữa $-\\frac{1}{3}$ và $\\frac{1}{3}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng thực tiễn của số hữu tỉ",
    "pts": 20,
    "question": "Nhiệt độ đo được tại đỉnh Fansipan vào ban đêm là $-2,5^\\circ\\text{C}$, vào buổi trưa là $4,2^\\circ\\text{C}$. Độ chênh lệch nhiệt độ giữa trưa và đêm là:",
    "options": [
      {
        "text": "$6,7^\\circ\\text{C}$",
        "correct": true
      },
      {
        "text": "$1,7^\\circ\\text{C}$",
        "correct": false
      },
      {
        "text": "$-6,7^\\circ\\text{C}$",
        "correct": false
      },
      {
        "text": "$2,5^\\circ\\text{C}$",
        "correct": false
      }
    ],
    "explanation": "Độ chênh lệch nhiệt độ là $4,2 - (-2,5) = 4,2 + 2,5 = 6,7^\\circ\\text{C}$."
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
                let a = 3, b = 4;
                let showOpp = true;

                const sliderA = document.getElementById('sliderA');
                const sliderB = document.getElementById('sliderB');
                const valA = document.getElementById('valA');
                const valB = document.getElementById('valB');
                const outEl = document.getElementById('lab1Output');
                const btnOpp = document.getElementById('btnToggleOpposite');

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 200 * window.devicePixelRatio || 200;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    draw();
                }

                function draw() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const centerY = h / 2;
                    const originX = w / 2;
                    const unitPx = w / 8; // 1 don vi = unitPx

                    // Truc so
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(30, centerY);
                    ctx.lineTo(w - 30, centerY);
                    ctx.stroke();

                    // Mui ten
                    ctx.fillStyle = '#6366f1';
                    ctx.beginPath();
                    ctx.moveTo(w - 20, centerY);
                    ctx.lineTo(w - 35, centerY - 6);
                    ctx.lineTo(w - 35, centerY + 6);
                    ctx.closePath();
                    ctx.fill();

                    // Vach chia nguyen
                    ctx.fillStyle = '#cbd5e1';
                    ctx.font = '13px Segoe UI';
                    ctx.textAlign = 'center';
                    for (let n = -3; n <= 3; n++) {
                        const x = originX + n * unitPx;
                        ctx.strokeStyle = (n === 0) ? '#f43f5e' : '#94a3b8';
                        ctx.lineWidth = (n === 0) ? 3 : 1.5;
                        ctx.beginPath();
                        ctx.moveTo(x, centerY - 10);
                        ctx.lineTo(x, centerY + 10);
                        ctx.stroke();
                        ctx.fillText(n.toString(), x, centerY + 26);
                    }

                    // Diem so huu ti a/b
                    const val = a / b;
                    const targetX = originX + val * unitPx;

                    // Ve diem a/b
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath();
                    ctx.arc(targetX, centerY, 8, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    ctx.fillStyle = '#f59e0b';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText(`${a}/${b}`, targetX, centerY - 20);

                    // Ve diem so doi -a/b
                    if (showOpp && a !== 0) {
                        const oppX = originX - val * unitPx;
                        ctx.fillStyle = '#06b6d4';
                        ctx.beginPath();
                        ctx.arc(oppX, centerY, 8, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 2;
                        ctx.stroke();

                        ctx.fillStyle = '#06b6d4';
                        ctx.font = 'bold 15px Segoe UI';
                        ctx.fillText(`-${a}/${b}`, oppX, centerY - 20);

                        // Duong noi doi xung
                        ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
                        ctx.setLineDash([4, 4]);
                        ctx.beginPath();
                        ctx.moveTo(oppX, centerY);
                        ctx.lineTo(targetX, centerY);
                        ctx.stroke();
                        ctx.setLineDash([]);
                    }

                    // Cap nhat text out
                    const dec = (a / b).toFixed(3);
                    outEl.innerHTML = `Số hữu tỉ: $x = \\frac{${a}}{${b}} = ${dec}$ | Số đối: $-x = ${-a}/${b} = ${(-dec)}$ | Thuộc tập $\\mathbb{Q}$`;
                    renderMathInTree(outEl);
                }

                sliderA.addEventListener('input', e => {
                    a = parseInt(e.target.value);
                    valA.textContent = a;
                    draw();
                });
                sliderB.addEventListener('input', e => {
                    b = parseInt(e.target.value);
                    valB.textContent = b;
                    draw();
                });
                btnOpp.addEventListener('click', () => {
                    showOpp = !showOpp;
                    btnOpp.textContent = showOpp ? 'Ẩn Số Đối' : 'Hiển Thị Số Đối';
                    draw();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let a1 = -2, b1 = 5, c1 = -1, d1 = 3;

                function drawBalance() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const v1 = a1 / b1;
                    const v2 = c1 / d1;

                    // Tru can
                    const cx = w / 2;
                    const cy = h * 0.75;
                    ctx2.fillStyle = '#64748b';
                    ctx2.beginPath();
                    ctx2.moveTo(cx, cy - 80);
                    ctx2.lineTo(cx - 30, cy);
                    ctx2.lineTo(cx + 30, cy);
                    ctx2.closePath();
                    ctx2.fill();

                    // Do nghieng
                    let angle = 0;
                    if (v1 > v2) angle = -0.15; // ben trai nang hon
                    else if (v1 < v2) angle = 0.15; // ben phai nang hon

                    const barLen = 220;
                    ctx2.save();
                    ctx2.translate(cx, cy - 80);
                    ctx2.rotate(angle);

                    // Thanh can
                    ctx2.strokeStyle = '#cbd5e1';
                    ctx2.lineWidth = 6;
                    ctx2.beginPath();
                    ctx2.moveTo(-barLen / 2, 0);
                    ctx2.lineTo(barLen / 2, 0);
                    ctx2.stroke();

                    // Dia can trai
                    ctx2.fillStyle = '#f59e0b';
                    ctx2.beginPath();
                    ctx2.arc(-barLen / 2, 35, 28, 0, Math.PI * 2);
                    ctx2.fill();
                    ctx2.strokeStyle = '#ffffff';
                    ctx2.lineWidth = 2;
                    ctx2.stroke();

                    ctx2.fillStyle = '#090d16';
                    ctx2.font = 'bold 13px Segoe UI';
                    ctx2.textAlign = 'center';
                    ctx2.fillText(`${a1}/${b1}`, -barLen / 2, 39);

                    // Dia can phai
                    ctx2.fillStyle = '#06b6d4';
                    ctx2.beginPath();
                    ctx2.arc(barLen / 2, 35, 28, 0, Math.PI * 2);
                    ctx2.fill();
                    ctx2.strokeStyle = '#ffffff';
                    ctx2.lineWidth = 2;
                    ctx2.stroke();

                    ctx2.fillStyle = '#090d16';
                    ctx2.fillText(`${c1}/${d1}`, barLen / 2, 39);

                    ctx2.restore();

                    // Giai thich quy dong
                    const commonDen = Math.abs(b1 * d1);
                    const num1 = a1 * (commonDen / b1);
                    const num2 = c1 * (commonDen / d1);
                    let cmpSign = '=';
                    if (num1 > num2) cmpSign = '>';
                    else if (num1 < num2) cmpSign = '<';

                    const outEl2 = document.getElementById('lab2Output');
                    outEl2.innerHTML = `Quy đồng mẫu số chung $${commonDen}$: $\\frac{${a1}}{${b1}} = \\frac{${num1}}{${commonDen}}$ và $\\frac{${c1}}{${d1}} = \\frac{${num2}}{${commonDen}}$. Vì $${num1} ${cmpSign} ${num2}$ nên $\\frac{${a1}}{${b1}} ${cmpSign} \\frac{${c1}}{${d1}}$.`;
                    renderMathInTree(outEl2);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 200 * window.devicePixelRatio || 200;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawBalance();
                }

                document.getElementById('btnCompare').addEventListener('click', () => {
                    a1 = parseInt(document.getElementById('inputA').value) || 0;
                    b1 = parseInt(document.getElementById('inputB').value) || 1;
                    c1 = parseInt(document.getElementById('inputC').value) || 0;
                    d1 = parseInt(document.getElementById('inputD').value) || 1;
                    if (b1 === 0) b1 = 1;
                    if (d1 === 0) d1 = 1;
                    drawBalance();
                });

                window.addEventListener('resize', resizeCanvas2);
                setTimeout(resizeCanvas2, 100);
            
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
