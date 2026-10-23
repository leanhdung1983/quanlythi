// ================================================================
// HOẠT ĐỘNG THỰC HÀNH TRẢI NGHIỆM 1: CÔNG THỨC LÃI KÉP - TOÁN 8 KNTT
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
  s = s.replace(/\\mathbf\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="bold">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\mathrm\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="normal">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\mathit\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="italic">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\widehat\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>^</mo></mover>'));
  s = s.replace(/\\circ/g, savePlaceholder('<mo>&#176;</mo>'));
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\vec\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));

  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
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
  if (!root) return;
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      strict: false
    });
  } else {
    // Fallback MathML
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && (n.nodeValue.includes('$') || n.nodeValue.includes('$$'))) {
        nodes.push(n);
      }
    }
    nodes.forEach(node => {
      const span = document.createElement('span');
      span.innerHTML = formatMathText(node.nodeValue);
      if (node.parentNode) node.parentNode.replaceChild(span, node);
    });
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
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.ctx = new AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type = 'sine', duration = 0.15, vol = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
  playClick() { this.playTone(600, 'sine', 0.05, 0.08); }
  playCorrect() {
    this.playTone(523.25, 'triangle', 0.1, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.18, 0.12), 80);
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
  userTitle: 'Chuyên Gia Tài Chính & Lãi Kép 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_thuchanh1_state';

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
    "id": "q1",
    "title": "Thử thách 1: Công thức lãi kép",
    "pts": 20,
    "question": "Công thức tính tổng số tiền cả gốc lẫn lãi $T$ thu được sau $n$ kỳ hạn theo thể thức lãi kép với số tiền gốc $A$ và lãi suất mỗi kỳ $r$ là:",
    "options": [
      {
        "text": "$T = A(1 + r)^n$",
        "correct": true
      },
      {
        "text": "$T = A(1 + n \\cdot r)$",
        "correct": false
      },
      {
        "text": "$T = A(1 + r^n)$",
        "correct": false
      },
      {
        "text": "$T = A \\cdot n(1 + r)$",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa lãi kép, sau $n$ kỳ hạn số tiền thu được là $T = A(1 + r)^n$."
  },
  {
    "id": "q2",
    "title": "Thử thách 2: Tính tiền sau 1 năm",
    "pts": 20,
    "question": "Bác An gửi tiết kiệm $100$ triệu đồng vào ngân hàng với lãi suất $6\\%/\\text{năm}$, kỳ hạn 1 năm. Sau 1 năm, tổng số tiền bác An nhận được là:",
    "options": [
      {
        "text": "$106$ triệu đồng",
        "correct": true
      },
      {
        "text": "$100{,}6$ triệu đồng",
        "correct": false
      },
      {
        "text": "$160$ triệu đồng",
        "correct": false
      },
      {
        "text": "$112$ triệu đồng",
        "correct": false
      }
    ],
    "explanation": "Tiền nhận được sau 1 năm: $T = 100(1 + 0{,}06)^1 = 100 \\times 1{,}06 = 106$ triệu đồng."
  },
  {
    "id": "q3",
    "title": "Thử thách 3: Tính lãi kép sau 2 năm",
    "pts": 20,
    "question": "Bạn Bình gửi $10$ triệu đồng với lãi suất kép $5\\%/\\text{năm}$. Sau 2 năm, số tiền cả gốc lẫn lãi bạn Bình nhận được là:",
    "options": [
      {
        "text": "$11{,}025$ triệu đồng",
        "correct": true
      },
      {
        "text": "$11$ triệu đồng",
        "correct": false
      },
      {
        "text": "$11{,}25$ triệu đồng",
        "correct": false
      },
      {
        "text": "$10{,}5$ triệu đồng",
        "correct": false
      }
    ],
    "explanation": "Áp dụng công thức: $T = 10(1 + 0{,}05)^2 = 10 \\times (1{,}05)^2 = 10 \\times 1{,}1025 = 11{,}025$ triệu đồng ($11\\,025\\,000$ đồng)."
  },
  {
    "id": "q4",
    "title": "Thử thách 4: So sánh lãi đơn và lãi kép sau 2 năm",
    "pts": 20,
    "question": "Gửi $20$ triệu đồng với lãi suất $10\\%/\\text{năm}$ trong 2 năm. Tiền lãi theo thể thức lãi kép nhiều hơn tiền lãi theo thể thức lãi đơn là:",
    "options": [
      {
        "text": "$0{,}2$ triệu đồng ($200\\,000$ đồng)",
        "correct": true
      },
      {
        "text": "$0{,}4$ triệu đồng",
        "correct": false
      },
      {
        "text": "$0{,}1$ triệu đồng",
        "correct": false
      },
      {
        "text": "$0$ đồng (bằng nhau)",
        "correct": false
      }
    ],
    "explanation": "Lãi đơn sau 2 năm: $20 \\times 10\\% \\times 2 = 4$ triệu. Lãi kép sau 2 năm: $20(1{,}1)^2 - 20 = 20 \\times 1{,}21 - 20 = 4{,}2$ triệu. Chênh lệch là $4{,}2 - 4 = 0{,}2$ triệu đồng."
  },
  {
    "id": "q5",
    "title": "Thử thách 5: Tiền lãi thu được",
    "pts": 20,
    "question": "Công thức tính riêng số tiền lãi $L$ thu được từ tiền gửi $A$ với lãi kép kỳ hạn $n$, lãi suất $r$ là:",
    "options": [
      {
        "text": "$L = A[(1 + r)^n - 1]$",
        "correct": true
      },
      {
        "text": "$L = A(1 + r)^n$",
        "correct": false
      },
      {
        "text": "$L = A \\cdot r^n$",
        "correct": false
      },
      {
        "text": "$L = A(1 + r^n - 1)$",
        "correct": false
      }
    ],
    "explanation": "Tiền lãi bằng tổng số tiền trừ tiền gốc: $L = T - A = A(1 + r)^n - A = A[(1 + r)^n - 1]$."
  },
  {
    "id": "q6",
    "title": "Thử thách 6: Quy tắc 72 ước tính nhân đôi",
    "pts": 20,
    "question": "Nếu lãi suất kép là $9\\%/\\text{năm}$, theo quy tắc 72, sau khoảng bao nhiêu năm thì số tiền tiết kiệm sẽ tăng gấp đôi?",
    "options": [
      {
        "text": "Khoảng $8$ năm",
        "correct": true
      },
      {
        "text": "Khoảng $6$ năm",
        "correct": false
      },
      {
        "text": "Khoảng $9$ năm",
        "correct": false
      },
      {
        "text": "Khoảng $11$ năm",
        "correct": false
      }
    ],
    "explanation": "Theo quy tắc 72: $n \\approx \\dfrac{72}{R} = \\dfrac{72}{9} = 8$ năm."
  },
  {
    "id": "q7",
    "title": "Thử thách 7: Tìm tiền gốc ban đầu",
    "pts": 20,
    "question": "Sau 2 năm gửi tiết kiệm với lãi kép $10\\%/\\text{năm}$, người gửi nhận được cả gốc và lãi là $121$ triệu đồng. Số tiền gốc ban đầu gửi là:",
    "options": [
      {
        "text": "$100$ triệu đồng",
        "correct": true
      },
      {
        "text": "$110$ triệu đồng",
        "correct": false
      },
      {
        "text": "$90$ triệu đồng",
        "correct": false
      },
      {
        "text": "$105$ triệu đồng",
        "correct": false
      }
    ],
    "explanation": "Ta có $A(1 + 0{,}1)^2 = 121 \\Leftrightarrow A \\times 1{,}21 = 121 \\Leftrightarrow A = 100$ triệu đồng."
  },
  {
    "id": "q8",
    "title": "Thử thách 8: Kỳ hạn gửi theo quý",
    "pts": 20,
    "question": "Một người gửi $50$ triệu đồng với lãi suất $6\\%/\\text{năm}$, kỳ hạn 3 tháng (1 quý). Sau 1 năm (tức 4 quý), số tiền nhận được là:",
    "options": [
      {
        "text": "$50(1 + 0{,}015)^4$ triệu đồng",
        "correct": true
      },
      {
        "text": "$50(1 + 0{,}06)^4$ triệu đồng",
        "correct": false
      },
      {
        "text": "$50(1 + 0{,}06)^1$ triệu đồng",
        "correct": false
      },
      {
        "text": "$50(1 + 0{,}02)^3$ triệu đồng",
        "correct": false
      }
    ],
    "explanation": "1 năm có 4 quý, lãi suất mỗi quý là $r = \\dfrac{6\\%}{4} = 1{,}5\\% = 0{,}015$. Sau 4 quý: $T = 50(1 + 0{,}015)^4$ triệu đồng."
  },
  {
    "id": "q9",
    "title": "Thử thách 9: Lãi kép sau 3 năm",
    "pts": 20,
    "question": "Tính giá trị của $T = 10(1 + 0{,}1)^3$ (triệu đồng):",
    "options": [
      {
        "text": "$13{,}31$ triệu đồng",
        "correct": true
      },
      {
        "text": "$13{,}00$ triệu đồng",
        "correct": false
      },
      {
        "text": "$13{,}13$ triệu đồng",
        "correct": false
      },
      {
        "text": "$12{,}10$ triệu đồng",
        "correct": false
      }
    ],
    "explanation": "Ta có $(1{,}1)^3 = 1{,}331$, nên $T = 10 \\times 1{,}331 = 13{,}31$ triệu đồng."
  },
  {
    "id": "q10",
    "title": "Thử thách 10: Ý nghĩa kinh tế của lãi kép",
    "pts": 20,
    "question": "Phát biểu nào sau đây đúng nhất khi nói về lãi kép?",
    "options": [
      {
        "text": "Thời gian gửi càng dài thì tiền lãi sinh ra trong mỗi kỳ hạn càng lớn",
        "correct": true
      },
      {
        "text": "Tiền lãi thu được ở mỗi kỳ hạn là hoàn toàn bằng nhau",
        "correct": false
      },
      {
        "text": "Lãi kép luôn cho số tiền ít hơn so với lãi đơn nếu cùng lãi suất",
        "correct": false
      },
      {
        "text": "Lãi kép chỉ áp dụng khi số tiền gửi ban đầu từ 1 tỷ đồng trở lên",
        "correct": false
      }
    ],
    "explanation": "Vì tiền gốc ở mỗi kỳ sau tăng lên (do cộng dồn lãi kỳ trước), nên tiền lãi sinh ra ở các kỳ sau ngày càng lớn hơn."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let answeredCount = 0;

  quizData.forEach((q, qidx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    if (q.question && (q.question.includes('<table') || q.question.includes('quiz-table') || q.question.length > 250)) {
      card.classList.add('full-width');
    }
    card.id = `qcard-${q.id}`;

    const isAnswered = appState.answered[String(q.id)] !== undefined;
    if (isAnswered) answeredCount++;

    let headerHtml = `
      <div class="quiz-card-header">
        <span class="quiz-badge">${q.title}</span>
        <span class="quiz-points">+${q.pts} XP</span>
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options quiz-options-grid">
    `;

    q.options.forEach((opt, oidx) => {
      let optClass = 'quiz-opt-btn';
      let disabled = isAnswered ? 'disabled' : '';
      if (isAnswered) {
        if (opt.correct) optClass += ' correct';
        else if (appState.answered[String(q.id)] === oidx) optClass += ' wrong';
      }

      headerHtml += `
        <button class="${optClass}" data-qid="${q.id}" data-oidx="${oidx}" ${disabled}>
          <span class="opt-label">${String.fromCharCode(65 + oidx)}.</span>
          <span class="opt-text">${opt.text}</span>
        </button>
      `;
    });

    headerHtml += `</div>`;

    const showExp = isAnswered ? 'show' : '';
    let expStatusHtml = '';
    if (isAnswered) {
      const isCorrect = q.options[appState.answered[String(q.id)]].correct;
      expStatusHtml = `<div class="exp-status" style="margin-bottom: 8px; font-weight: 700; color: ${isCorrect ? '#34d399' : '#f87171'};">${isCorrect ? '✅ CHÍNH XÁC! +20 XP' : '❌ CHƯA ĐÚNG'}</div>`;
    }

    headerHtml += `
      <div class="explanation-box ${showExp}" id="exp-${q.id}">
        ${expStatusHtml}
        <strong>💡 Lời giải chi tiết:</strong> ${q.explanation}
      </div>
    `;

    card.innerHTML = headerHtml;
    container.appendChild(card);
  });

  // Gắn sự kiện click
  container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const qid = this.getAttribute('data-qid');
      const oidx = parseInt(this.getAttribute('data-oidx'));
      handleAnswer(qid, oidx);
    });
  });

  // Cập nhật header arena
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  const answeredKeys = Object.keys(appState.answered);
  let correctCount = 0;
  answeredKeys.forEach(k => {
    const q = quizData.find(item => String(item.id) === String(k));
    if (q && q.options[appState.answered[k]].correct) correctCount++;
  });

  if (progEl) progEl.textContent = `${answeredKeys.length}/10`;
  if (scoreEl) scoreEl.textContent = `${correctCount * 20} XP`;

  // Mở khóa huy hiệu 3, 4, 5
  if (appState.streak >= 5) unlockBadge(2);
  if (correctCount >= 8) unlockBadge(3);
  if (correctCount === 10) {
    unlockBadge(4);
    sound.playFanfare();
  }

  renderMathInTree(container);
}

function handleAnswer(qid, oidx) {
  if (appState.answered[String(qid)] !== undefined) return;
  const q = quizData.find(item => String(item.id) === String(qid));
  if (!q) return;

  appState.answered[String(qid)] = oidx;
  const isCorrect = q.options[oidx].correct;

  if (isCorrect) {
    appState.xp += q.pts;
    appState.streak += 1;
    sound.playCorrect();
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

      // Tự động mở khóa Huy hiệu 1 & 2 khi chuyển tab
      if (target === 'theory') unlockBadge(0);
      if (target === 'labs') unlockBadge(1);

      // Kích hoạt render KaTeX nếu chuyển sang tab ẩn
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
  // Khởi tạo Lab 1
  try {
    
        const canvas = document.getElementById('labCanvas1');
        const ctx = canvas ? canvas.getContext('2d') : null;
        const sliderA = document.getElementById('sliderA');
        const sliderR = document.getElementById('sliderR');
        const sliderN = document.getElementById('sliderN');
        const valA = document.getElementById('valA');
        const valR = document.getElementById('valR');
        const valN = document.getElementById('valN');
        const out1 = document.getElementById('labOut1');

        function drawCompound() {
          if (!ctx || !sliderA || !sliderR || !sliderN) return;
          const A = parseFloat(sliderA.value);
          const r = parseFloat(sliderR.value) / 100;
          const n = parseInt(sliderN.value);

          if (valA) valA.textContent = A;
          if (valR) valR.textContent = (r * 100).toFixed(1);
          if (valN) valN.textContent = n;

          const totalSimple = A * (1 + n * r);
          const totalCompound = A * Math.pow(1 + r, n);
          const diff = totalCompound - totalSimple;

          if (out1) {
            out1.innerHTML = `
              <strong>📊 Sau ${n} năm gửi ${A} triệu (Lãi suất ${(r * 100).toFixed(1)}%/năm):</strong><br>
              • Tiền thu được theo Lãi đơn: <strong>${totalSimple.toFixed(2)} triệu</strong> (Lãi: ${(totalSimple - A).toFixed(2)} tr)<br>
              • Tiền thu được theo Lãi kép: <strong style="color: #f59e0b;">${totalCompound.toFixed(2)} triệu</strong> (Lãi: ${(totalCompound - A).toFixed(2)} tr)<br>
              🚀 Lãi kép vượt trội hơn lãi đơn: <strong style="color: #34d399;">+${diff.toFixed(2)} triệu đồng</strong> (+${((diff / totalSimple) * 100).toFixed(1)}%)!
            `;
          }

          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Trục tọa độ
          const padL = 60, padR = 30, padT = 30, padB = 40;
          const plotW = w - padL - padR;
          const plotH = h - padT - padB;

          // Max Y
          const maxVal = Math.max(totalCompound * 1.15, A * 2);

          // Grid
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
          ctx.lineWidth = 1;
          for (let i = 0; i <= 5; i++) {
            const y = padT + (plotH / 5) * i;
            ctx.beginPath();
            ctx.moveTo(padL, y);
            ctx.lineTo(w - padR, y);
            ctx.stroke();

            const val = maxVal - (maxVal / 5) * i;
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'right';
            ctx.fillText(val.toFixed(0) + ' tr', padL - 8, y + 3);
          }

          // Trục X
          ctx.strokeStyle = '#64748b';
          ctx.beginPath();
          ctx.moveTo(padL, h - padB);
          ctx.lineTo(w - padR, h - padB);
          ctx.stroke();

          // Đường Lãi Đơn (Cyan)
          ctx.beginPath();
          ctx.strokeStyle = '#06b6d4';
          ctx.lineWidth = 2.5;
          for (let yr = 0; yr <= n; yr++) {
            const x = padL + (yr / n) * plotW;
            const valYr = A * (1 + yr * r);
            const y = h - padB - (valYr / maxVal) * plotH;
            if (yr === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Đường Lãi Kép (Gold Neon)
          ctx.beginPath();
          ctx.strokeStyle = '#f59e0b';
          ctx.lineWidth = 3;
          for (let yr = 0; yr <= n; yr++) {
            const x = padL + (yr / n) * plotW;
            const valYr = A * Math.pow(1 + r, yr);
            const y = h - padB - (valYr / maxVal) * plotH;
            if (yr === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Vẽ điểm đầu & cuối
          const endX = padL + plotW;
          const endYSimple = h - padB - (totalSimple / maxVal) * plotH;
          const endYCompound = h - padB - (totalCompound / maxVal) * plotH;

          ctx.fillStyle = '#06b6d4';
          ctx.beginPath();
          ctx.arc(endX, endYSimple, 5, 0, Math.PI * 2);
          ctx.fill();

          ctx.fillStyle = '#f59e0b';
          ctx.beginPath();
          ctx.arc(endX, endYCompound, 6, 0, Math.PI * 2);
          ctx.fill();

          // Chú thích
          ctx.textAlign = 'left';
          ctx.fillStyle = '#06b6d4';
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.fillText(`Lãi Đơn: ${totalSimple.toFixed(1)} tr`, padL + 10, padT + 20);

          ctx.fillStyle = '#f59e0b';
          ctx.fillText(`Lãi Kép: ${totalCompound.toFixed(1)} tr`, padL + 10, padT + 40);
        }

        if (sliderA) sliderA.addEventListener('input', drawCompound);
        if (sliderR) sliderR.addEventListener('input', drawCompound);
        if (sliderN) sliderN.addEventListener('input', drawCompound);
        drawCompound();
      
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
        const canvas2 = document.getElementById('labCanvas2');
        const ctx2 = canvas2 ? canvas2.getContext('2d') : null;
        const sliderGoalA = document.getElementById('sliderGoalA');
        const sliderGoalR = document.getElementById('sliderGoalR');
        const valGoalA = document.getElementById('valGoalA');
        const valGoalR = document.getElementById('valGoalR');
        const out2 = document.getElementById('labOut2');

        function drawGoalCalculator() {
          if (!ctx2 || !sliderGoalA || !sliderGoalR) return;
          const A = parseFloat(sliderGoalA.value);
          const r = parseFloat(sliderGoalR.value) / 100;
          const target = 1000; // 1 tỷ = 1000 triệu

          if (valGoalA) valGoalA.textContent = A;
          if (valGoalR) valGoalR.textContent = (r * 100).toFixed(1);

          // Tính số năm cần thiết: A * (1+r)^n >= target => n = ln(target/A) / ln(1+r)
          let yearsNeeded = 0;
          if (A < target) {
            yearsNeeded = Math.log(target / A) / Math.log(1 + r);
          }

          if (out2) {
            out2.innerHTML = `
              🎯 <strong>Mục tiêu: Đạt 1.000.000.000 đ (1 Tỷ Đồng)</strong><br>
              • Vốn khởi điểm: <strong>${A} triệu</strong> (chiếm ${(A / 10).toFixed(1)}% mục tiêu)<br>
              • Lãi suất tích lũy: <strong>${(r * 100).toFixed(1)}%/năm</strong><br>
              ⏳ Thời gian chạm mốc 1 tỷ: <strong style="color: #38bdf8; font-size: 16px;">${yearsNeeded.toFixed(1)} năm</strong> (khoảng ${Math.ceil(yearsNeeded)} năm)
            `;
          }

          const w = canvas2.width;
          const h = canvas2.height;
          ctx2.clearRect(0, 0, w, h);

          // Vẽ biểu đồ cột tiến độ tích lũy 5 mốc năm
          const years = [0, Math.round(yearsNeeded * 0.25), Math.round(yearsNeeded * 0.5), Math.round(yearsNeeded * 0.75), Math.ceil(yearsNeeded)];
          const barW = 60;
          const padL = 70;
          const gap = (w - padL - 40 - barW * 5) / 4;

          years.forEach((yr, idx) => {
            const valYr = Math.min(target, A * Math.pow(1 + r, yr));
            const barH = (valYr / target) * (h - 70);
            const x = padL + idx * (barW + gap);
            const y = h - 35 - barH;

            // Cột vốn gốc
            const baseH = (A / target) * (h - 70);
            ctx2.fillStyle = '#6366f1';
            ctx2.fillRect(x, h - 35 - baseH, barW, baseH);

            // Cột tiền lãi sinh thêm
            if (barH > baseH) {
              ctx2.fillStyle = '#10b981';
              ctx2.fillRect(x, y, barW, barH - baseH);
            }

            // Nhãn số năm
            ctx2.fillStyle = '#94a3b8';
            ctx2.font = '11px Inter, sans-serif';
            ctx2.textAlign = 'center';
            ctx2.fillText(`Năm ${yr}`, x + barW / 2, h - 15);

            // Số tiền
            ctx2.fillStyle = '#ffffff';
            ctx2.font = 'bold 10px Inter, sans-serif';
            ctx2.fillText(`${valYr.toFixed(0)} tr`, x + barW / 2, y - 6);
          });

          // Đường mốc 1 Tỷ
          ctx2.strokeStyle = '#ef4444';
          ctx2.setLineDash([6, 4]);
          ctx2.beginPath();
          ctx2.moveTo(padL - 10, h - 35 - (h - 70));
          ctx2.lineTo(w - 20, h - 35 - (h - 70));
          ctx2.stroke();
          ctx2.setLineDash([]);

          ctx2.fillStyle = '#ef4444';
          ctx2.font = 'bold 11px Inter, sans-serif';
          ctx2.textAlign = 'left';
          ctx2.fillText('Mốc 1 Tỷ (1.000 tr)', padL, h - 35 - (h - 70) - 6);
        }

        if (sliderGoalA) sliderGoalA.addEventListener('input', drawGoalCalculator);
        if (sliderGoalR) sliderGoalR.addEventListener('input', drawGoalCalculator);
        drawGoalCalculator();
      
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
