// ================================================================
// BÀI 33: QUAN HỆ GIỮA BA CẠNH CỦA MỘT TAM GIÁC - TOÁN 7 KNTT
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
  userTitle: 'Kiến Trúc Sư Khung Tam Giác 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai33_state';

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
    "title": "Câu 1: Nhận diện bộ ba cạnh tam giác",
    "pts": 20,
    "question": "Bộ ba độ dài nào sau đây CÓ THỂ là độ dài ba cạnh của một tam giác?",
    "options": [
      {
        "text": "$3\\text{ cm}, 4\\text{ cm}, 5\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$2\\text{ cm}, 3\\text{ cm}, 6\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$1\\text{ cm}, 2\\text{ cm}, 3\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$4\\text{ cm}, 5\\text{ cm}, 10\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Ta kiểm tra: $3 + 4 = 7 > 5$ (thỏa mãn bất đẳng thức tam giác). Các bộ còn lại: $2 + 3 = 5 < 6$; $1 + 2 = 3$; $4 + 5 = 9 < 10$ đều không thỏa mãn."
  },
  {
    "id": 2,
    "title": "Câu 2: Bộ ba không tạo thành tam giác",
    "pts": 20,
    "question": "Bộ ba độ dài nào sau đây KHÔNG THỂ tạo thành một tam giác?",
    "options": [
      {
        "text": "$3\\text{ cm}, 5\\text{ cm}, 8\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$5\\text{ cm}, 6\\text{ cm}, 7\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$4\\text{ cm}, 4\\text{ cm}, 4\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$6\\text{ cm}, 8\\text{ cm}, 10\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Vì $3 + 5 = 8$, tổng hai cạnh bằng cạnh thứ ba nên ba điểm thẳng hàng, không thể tạo thành tam giác."
  },
  {
    "id": 3,
    "title": "Câu 3: Tìm khoảng giá trị cạnh thứ ba",
    "pts": 20,
    "question": "Cho tam giác có hai cạnh là $4\\text{ cm}$ và $7\\text{ cm}$. Độ dài cạnh thứ ba $x$ phải thỏa mãn điều kiện:",
    "options": [
      {
        "text": "$3 < x < 11$",
        "correct": true
      },
      {
        "text": "$4 < x < 7$",
        "correct": false
      },
      {
        "text": "$x > 11$",
        "correct": false
      },
      {
        "text": "$x < 3$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng hệ quả bất đẳng thức tam giác: $7 - 4 < x < 7 + 4 \\iff 3 < x < 11$."
  },
  {
    "id": 4,
    "title": "Câu 4: Cạnh thứ ba là số nguyên",
    "pts": 20,
    "question": "Tam giác cân có độ dài hai cạnh là $2\\text{ cm}$ và $5\\text{ cm}$. Chu vi của tam giác đó là:",
    "options": [
      {
        "text": "$12\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$9\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$14\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$10\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Nếu cạnh bên bằng 2 thì bộ ba cạnh là $(2, 2, 5)$ loại vì $2 + 2 = 4 < 5$. Do đó cạnh bên phải bằng 5. Bộ ba là $(5, 5, 2)$. Chu vi là $5 + 5 + 2 = 12\\text{ cm}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Bất đẳng thức với nửa chu vi",
    "pts": 20,
    "question": "Cho tam giác có chu vi $2p$ và ba cạnh $a, b, c$. Khẳng định nào sau đây luôn ĐÚNG?",
    "options": [
      {
        "text": "$a < p$",
        "correct": true
      },
      {
        "text": "$a > p$",
        "correct": false
      },
      {
        "text": "$a = p$",
        "correct": false
      },
      {
        "text": "$a + b < p$",
        "correct": false
      }
    ],
    "explanation": "Vì $b + c > a \\implies a + b + c > 2a \\implies 2p > 2a \\implies a < p$ (mỗi cạnh luôn nhỏ hơn nửa chu vi)."
  },
  {
    "id": 6,
    "title": "Câu 6: Kiểm tra nhanh điều kiện tam giác",
    "pts": 20,
    "question": "Để kiểm tra ba độ dài $a \\le b \\le c$ có tạo thành tam giác hay không, ta chỉ cần kiểm tra điều kiện:",
    "options": [
      {
        "text": "$a + b > c$",
        "correct": true
      },
      {
        "text": "$a + c > b$",
        "correct": false
      },
      {
        "text": "$b + c > a$",
        "correct": false
      },
      {
        "text": "$a \\cdot b > c$",
        "correct": false
      }
    ],
    "explanation": "Vì $c$ đã là số lớn nhất nên $a + c > b$ và $b + c > a$ luôn đúng. Ta chỉ cần kiểm tra xem tổng hai cạnh nhỏ $a + b$ có lớn hơn $c$ hay không."
  },
  {
    "id": 7,
    "title": "Câu 7: Tìm số nguyên dương x",
    "pts": 20,
    "question": "Cho tam giác có độ dài hai cạnh là $3\\text{ cm}$ và $8\\text{ cm}$. Có bao nhiêu giá trị nguyên của cạnh thứ ba $x$?",
    "options": [
      {
        "text": "$5$ giá trị",
        "correct": true
      },
      {
        "text": "$6$ giá trị",
        "correct": false
      },
      {
        "text": "$4$ giá trị",
        "correct": false
      },
      {
        "text": "$7$ giá trị",
        "correct": false
      }
    ],
    "explanation": "Ta có $8 - 3 < x < 8 + 3 \\iff 5 < x < 11$. Các số nguyên thỏa mãn là $x \\in \\{6, 7, 8, 9, 10\\}$ (gồm 5 giá trị)."
  },
  {
    "id": 8,
    "title": "Câu 8: Tam giác đều",
    "pts": 20,
    "question": "Ba cạnh của tam giác đều cạnh $a$ luôn thỏa mãn bất đẳng thức tam giác vì:",
    "options": [
      {
        "text": "$a + a = 2a > a$",
        "correct": true
      },
      {
        "text": "$a - a = 0 < a$",
        "correct": false
      },
      {
        "text": "$a \\cdot a > a$",
        "correct": false
      },
      {
        "text": "$a + a = a$",
        "correct": false
      }
    ],
    "explanation": "Tổng hai cạnh là $a + a = 2a > a$, luôn thỏa mãn với mọi $a > 0$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bất đẳng thức tam giác trong tứ giác",
    "pts": 20,
    "question": "Cho điểm $M$ nằm trong tam giác $ABC$. Khẳng định nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$MB + MC < AB + AC$",
        "correct": true
      },
      {
        "text": "$MB + MC > AB + AC$",
        "correct": false
      },
      {
        "text": "$MB + MC = AB + AC$",
        "correct": false
      },
      {
        "text": "$MB = MC$",
        "correct": false
      }
    ],
    "explanation": "Kéo dài $BM$ cắt $AC$ tại $D$. Ta có $MB + MC < MB + MD + DC = BD + DC < (AB + AD) + DC = AB + AC$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng dựng lều tam giác",
    "pts": 20,
    "question": "Để làm một khung lều chữ A hình tam giác cân có đáy dài $1,6\\text{ m}$, chiều dài mỗi thanh cọc bên phải thỏa mãn:",
    "options": [
      {
        "text": "Lớn hơn $0,8\\text{ m}$",
        "correct": true
      },
      {
        "text": "Lớn hơn $1,6\\text{ m}$",
        "correct": false
      },
      {
        "text": "Bằng đúng $0,8\\text{ m}$",
        "correct": false
      },
      {
        "text": "Nhỏ hơn $0,8\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Gọi chiều dài cọc bên là $x$. Theo bất đẳng thức tam giác: $x + x > 1,6 \\iff 2x > 1,6 \\iff x > 0,8\\text{ m}$."
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
  let a = 3, b = 4, c = 5;

  function draw() {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`KIỂM TRA BẤT ĐẲNG THỨC TAM GIÁC: BỘ BA (${a}, ${b}, ${c})`, canvas1.width / 2, 28);

    const isValid = (a + b > c) && (a + c > b) && (b + c > a);

    if (isValid) {
      // Vẽ tam giác hợp lệ
      const scale = 30;
      const bx = 160, by = 170;
      const cx = bx + c * scale, cy = by;
      // Tọa độ A theo công thức cosin
      const cosB = (c*c + a*a - b*b) / (2 * c * a);
      const sinB = Math.sqrt(Math.max(0, 1 - cosB * cosB));
      const ax = bx + a * scale * cosB;
      const ay = by - a * scale * sinB;

      ctx.beginPath();
      ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy);
      ctx.closePath();
      ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
      ctx.fill();
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#10b981';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`🎉 TẠO THÀNH TAM GIÁC! Vì tổng 2 cạnh nhỏ: ${a} + ${b} = ${a+b} > ${c}`, canvas1.width / 2, 215);
    } else {
      // Vẽ hai thanh gỗ không với tới nhau
      const scale = 30;
      const bx = 100, by = 150;
      const cx = bx + c * scale, cy = by;

      ctx.strokeStyle = '#64748b';
      ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(cx, cy); ctx.stroke();

      ctx.strokeStyle = '#ef4444';
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + a * scale, by - 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - b * scale, by - 20); ctx.stroke();

      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`❌ KHÔNG TẠO THÀNH TAM GIÁC! Vì ${a} + ${b} = ${a+b} ≤ ${c}`, canvas1.width / 2, 215);
    }
  }

  const b1 = document.getElementById('btnLab1Valid');
  const b2 = document.getElementById('btnLab1Invalid');
  if (b1) b1.onclick = () => { a = 3; b = 4; c = 5; draw(); };
  if (b2) b2.onclick = () => { a = 2; b = 3; c = 6; draw(); };
  draw();
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');
  const inA = document.getElementById('lab2A');
  const inB = document.getElementById('lab2B');
  const inC = document.getElementById('lab2C');
  const btn = document.getElementById('btnLab2Check');

  function check() {
    const a = parseFloat(inA ? inA.value : 6);
    const b = parseFloat(inB ? inB.value : 8);
    const c = parseFloat(inC ? inC.value : 10);

    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(`KẾT QUẢ PHÂN TÍCH BỘ BA (${a}, ${b}, ${c})`, canvas2.width / 2, 28);

    const c1 = a + b > c;
    const c2 = a + c > b;
    const c3 = b + c > a;
    const valid = c1 && c2 && c3;

    ctx2.textAlign = 'left';
    ctx2.font = '15px sans-serif';
    const tx = 110;

    ctx2.fillStyle = c1 ? '#10b981' : '#f43f5e';
    ctx2.fillText(`1. a + b > c <=> ${a} + ${b} = ${a+b} > ${c}: ${c1 ? 'ĐÚNG ✓' : 'SAI ✗'}`, tx, 75);

    ctx2.fillStyle = c2 ? '#10b981' : '#f43f5e';
    ctx2.fillText(`2. a + c > b <=> ${a} + ${c} = ${a+c} > ${b}: ${c2 ? 'ĐÚNG ✓' : 'SAI ✗'}`, tx, 110);

    ctx2.fillStyle = c3 ? '#10b981' : '#f43f5e';
    ctx2.fillText(`3. b + c > a <=> ${b} + ${c} = ${b+c} > ${a}: ${c3 ? 'ĐÚNG ✓' : 'SAI ✗'}`, tx, 145);

    ctx2.font = 'bold 18px sans-serif';
    ctx2.fillStyle = valid ? '#10b981' : '#f43f5e';
    ctx2.textAlign = 'center';
    ctx2.fillText(valid ? `=> BỘ BA (${a}, ${b}, ${c}) LẬP THÀNH MỘT TAM GIÁC!` : `=> BỘ BA (${a}, ${b}, ${c}) KHÔNG THỂ LẬP THÀNH TAM GIÁC!`, canvas2.width / 2, 195);
  }

  if (btn) btn.onclick = check;
  check();
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
