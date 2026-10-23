// ================================================================
// BÀI 39: HÌNH CHÓP TỨ GIÁC ĐỀU - TOÁN 8 KNTT
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
  userTitle: 'Kiến Trúc Sư Kim Tự Tháp 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai39_state';

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
    "title": "Câu 1: Mặt đáy của hình chóp tứ giác đều",
    "pts": 20,
    "question": "Mặt đáy của hình chóp tứ giác đều là hình gì?",
    "options": [
      {
        "text": "Hình vuông",
        "correct": true
      },
      {
        "text": "Hình chữ nhật",
        "correct": false
      },
      {
        "text": "Hình thoi",
        "correct": false
      },
      {
        "text": "Hình bình hành",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa SGK, hình chóp tứ giác đều có mặt đáy là hình vuông và các mặt bên là các tam giác cân bằng nhau."
  },
  {
    "id": 2,
    "title": "Câu 2: Số mặt và số cạnh của hình chóp tứ giác đều",
    "pts": 20,
    "question": "Hình chóp tứ giác đều có tất cả bao nhiêu mặt và bao nhiêu cạnh?",
    "options": [
      {
        "text": "$5\\text{ mặt và } 8\\text{ cạnh}$",
        "correct": true
      },
      {
        "text": "$5\\text{ mặt và } 6\\text{ cạnh}$",
        "correct": false
      },
      {
        "text": "$6\\text{ mặt và } 8\\text{ cạnh}$",
        "correct": false
      },
      {
        "text": "$4\\text{ mặt và } 8\\text{ cạnh}$",
        "correct": false
      }
    ],
    "explanation": "Có 1 mặt đáy + 4 mặt bên = 5 mặt; có 4 cạnh đáy + 4 cạnh bên = 8 cạnh; có 5 đỉnh."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính diện tích xung quanh hình chóp tứ giác đều",
    "pts": 20,
    "question": "Một hình chóp tứ giác đều có cạnh đáy bằng $6\\text{ cm}$ và trung đoạn bằng $5\\text{ cm}$. Diện tích xung quanh của hình chóp đó là:",
    "options": [
      {
        "text": "$60\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$120\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$30\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$96\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Chu vi đáy là $4 \\times 6 = 24\\text{ cm} \\implies p = 12\\text{ cm}$. Diện tích xung quanh: $S_{xq} = p \\cdot d = 12 \\times 5 = 60\\text{ cm}^2$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính thể tích hình chóp tứ giác đều",
    "pts": 20,
    "question": "Một hình chóp tứ giác đều có cạnh đáy bằng $10\\text{ cm}$ và chiều cao bằng $9\\text{ cm}$. Thể tích của hình chóp đó bằng:",
    "options": [
      {
        "text": "$300\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$900\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$100\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$150\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "Diện tích đáy $S = 10^2 = 100\\text{ cm}^2$. Thể tích $V = \\frac{1}{3} S \\cdot h = \\frac{1}{3} \\times 100 \\times 9 = 300\\text{ cm}^3$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tính diện tích toàn phần",
    "pts": 20,
    "question": "Hình chóp tứ giác đều có diện tích xung quanh $80\\text{ cm}^2$, cạnh đáy $6\\text{ cm}$. Diện tích toàn phần của hình chóp là:",
    "options": [
      {
        "text": "$116\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$144\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$104\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$86\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Diện tích đáy là $S_{đáy} = 6^2 = 36\\text{ cm}^2$. Diện tích toàn phần $S_{tp} = S_{xq} + S_{đáy} = 80 + 36 = 116\\text{ cm}^2$."
  },
  {
    "id": 6,
    "title": "Câu 6: Vị trí chân đường cao",
    "pts": 20,
    "question": "Chân đường cao của hình chóp tứ giác đều trùng với điểm nào của mặt đáy?",
    "options": [
      {
        "text": "Giao điểm của hai đường chéo hình vuông đáy",
        "correct": true
      },
      {
        "text": "Một đỉnh của đáy",
        "correct": false
      },
      {
        "text": "Trung điểm một cạnh đáy",
        "correct": false
      },
      {
        "text": "Điểm bất kì trong đáy",
        "correct": false
      }
    ],
    "explanation": "Đoạn thẳng nối đỉnh $S$ với tâm $O$ của đáy hình vuông (giao điểm của hai đường chéo) là đường cao của hình chóp tứ giác đều."
  },
  {
    "id": 7,
    "title": "Câu 7: Tìm trung đoạn khi biết chiều cao và cạnh đáy",
    "pts": 20,
    "question": "Một hình chóp tứ giác đều có cạnh đáy $a = 6\\text{ cm}$, chiều cao $h = 4\\text{ cm}$. Độ dài trung đoạn $d$ của hình chóp bằng:",
    "options": [
      {
        "text": "$5\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$7\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$\\sqrt{52}\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$4{,}5\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Khoảng cách từ tâm đáy đến cạnh đáy là $\\frac{a}{2} = \\frac{6}{2} = 3\\text{ cm}$. Trung đoạn $d = \\sqrt{h^2 + (a/2)^2} = \\sqrt{4^2 + 3^2} = \\sqrt{25} = 5\\text{ cm}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Thể tích kim tự tháp Kê-ốp",
    "pts": 20,
    "question": "Kim tự tháp Kê-ốp (Ai Cập) có đáy là hình vuông cạnh khoảng $230\\text{ m}$, chiều cao khoảng $147\\text{ m}$. Thể tích của kim tự tháp xấp xỉ:",
    "options": [
      {
        "text": "$2\\,592\\,100\\text{ m}^3$",
        "correct": true
      },
      {
        "text": "$7\\,776\\,300\\text{ m}^3$",
        "correct": false
      },
      {
        "text": "$1\\,296\\,050\\text{ m}^3$",
        "correct": false
      },
      {
        "text": "$33\\,810\\text{ m}^3$",
        "correct": false
      }
    ],
    "explanation": "$V = \\frac{1}{3} a^2 h = \\frac{1}{3} \\times 230^2 \\times 147 = \\frac{1}{3} \\times 52900 \\times 147 = 52900 \\times 49 = 2\\,592\\,100\\text{ m}^3$."
  },
  {
    "id": 9,
    "title": "Câu 9: Thay đổi cạnh đáy đến thể tích",
    "pts": 20,
    "question": "Nếu tăng độ dài cạnh đáy của hình chóp tứ giác đều lên $2\\text{ lần}$ và giữ nguyên chiều cao thì thể tích của nó sẽ:",
    "options": [
      {
        "text": "Tăng lên $4\\text{ lần}$",
        "correct": true
      },
      {
        "text": "Tăng lên $2\\text{ lần}$",
        "correct": false
      },
      {
        "text": "Tăng lên $8\\text{ lần}$",
        "correct": false
      },
      {
        "text": "Không thay đổi",
        "correct": false
      }
    ],
    "explanation": "Vì thể tích $V = \\frac{1}{3} a^2 h$ tỉ lệ với bình phương cạnh đáy $a^2$, nên khi $a$ tăng 2 lần thì $V$ tăng $2^2 = 4$ lần."
  },
  {
    "id": 10,
    "title": "Câu 10: Diện tích vải bạt lều tứ giác",
    "pts": 20,
    "question": "Một chiếc lều hình chóp tứ giác đều có cạnh đáy $3\\text{ m}$, trung đoạn $2\\text{ m}$. Diện tích vải bạt cần làm 4 mặt bên của chiếc lều là:",
    "options": [
      {
        "text": "$12\\text{ m}^2$",
        "correct": true
      },
      {
        "text": "$24\\text{ m}^2$",
        "correct": false
      },
      {
        "text": "$6\\text{ m}^2$",
        "correct": false
      },
      {
        "text": "$18\\text{ m}^2$",
        "correct": false
      }
    ],
    "explanation": "Nửa chu vi đáy $p = \\frac{4 \\times 3}{2} = 6\\text{ m}$. Diện tích xung quanh: $S_{xq} = p \\cdot d = 6 \\times 2 = 12\\text{ m}^2$."
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
                const ctx = canvas.getContext('2d');
                const sA = document.getElementById('sliderA39');
                const sH = document.getElementById('sliderH39');
                const valA = document.getElementById('valA39');
                const valH = document.getElementById('valH39');
                const outEl = document.getElementById('lab1Output39');

                function update() {
                    const a = parseInt(sA.value);
                    const hVal = parseInt(sH.value);
                    valA.textContent = a;
                    valH.textContent = hVal;

                    const Sday = a * a;
                    const V = (1 / 3 * Sday * hVal).toFixed(1);
                    // Trung đoạn d = sqrt(h^2 + (a/2)^2)
                    const d = Math.sqrt(hVal * hVal + (a / 2) * (a / 2)).toFixed(2);
                    const Sxq = (2 * a * d).toFixed(1);

                    outEl.innerHTML = `<strong>Đáy hình vuông:</strong> $a = ${a}\\text{ m} \\implies S_{đáy} = ${Sday}\\text{ m}^2$ &nbsp;|&nbsp; <strong>Chiều cao:</strong> $h = ${hVal}\\text{ m}$ <br><strong>Trung đoạn:</strong> $d = \\sqrt{h^2 + (a/2)^2} = ${d}\\text{ m}$ &nbsp;|&nbsp; <strong>Diện tích xung quanh:</strong> $S_{xq} = 2ad \\approx ${Sxq}\\text{ m}^2$ <br><strong>Thể tích kim tự tháp:</strong> <strong style="color:#34d399; font-size:1.15rem;">$V = \\frac{1}{3} a^2 h = ${V}\\text{ m}^3$</strong>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const cx = w / 2;
                    const sx = cx, sy = 40;
                    const baseW = a * 12;
                    const baseD = 40;

                    // 4 đỉnh đáy
                    const ax = cx - baseW / 2, ay = h - 60;
                    const bx = cx + baseW / 2, by = h - 60;
                    const cx_pt = cx + baseW / 2 + 25, cy_pt = h - 60 - baseD;
                    const dx_pt = cx - baseW / 2 + 25, dy_pt = h - 60 - baseD;

                    // Nét khuất
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(dx_pt, dy_pt); ctx.lineTo(cx_pt, cy_pt);
                    ctx.moveTo(sx, sy); ctx.lineTo(dx_pt, dy_pt);
                    // Đường cao SO
                    const ox = (ax + cx_pt) / 2, oy = (ay + dy_pt) / 2;
                    ctx.moveTo(sx, sy); ctx.lineTo(ox, oy);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Nét liền
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx_pt, cy_pt);
                    ctx.moveTo(sx, sy); ctx.lineTo(ax, ay);
                    ctx.moveTo(sx, sy); ctx.lineTo(bx, by);
                    ctx.moveTo(sx, sy); ctx.lineTo(cx_pt, cy_pt);
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText('S', sx - 5, sy - 8);
                    ctx.fillText('A', ax - 15, ay + 15);
                    ctx.fillText('B', bx + 5, by + 15);
                    ctx.fillText(`a = ${a}m`, cx - 20, ay + 18);
                    ctx.fillStyle = '#34d399';
                    ctx.fillText(`h = ${hVal}m`, sx + 8, (sy + oy) / 2);
                }

                [sA, sH].forEach(el => el.addEventListener('input', update));
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const inA = document.getElementById('inTentA');
                const inH = document.getElementById('inTentH');
                const outEl = document.getElementById('lab2Output39');

                function calc() {
                    const a = parseFloat(inA.value) || 2;
                    const h = parseFloat(inH.value) || 1.5;

                    const d = Math.sqrt(h * h + (a / 2) * (a / 2));
                    const Sxq = 2 * a * d;
                    const pricePerM2 = 80000; // 80.000 đ/m2 vải bạt
                    const totalCost = Math.round(Sxq * pricePerM2);

                    outEl.innerHTML = `<strong>Trung đoạn lều:</strong> $d = \\sqrt{${h}^2 + (${a / 2})^2} = ${d.toFixed(2)}\\text{ m}$ <br><strong>Diện tích vải bạt xung quanh:</strong> $S_{xq} = 2 \\cdot ${a} \\cdot ${d.toFixed(2)} = <strong style="color:#34d399;">${Sxq.toFixed(2)}\\text{ m}^2</strong>$ <br><strong>Ước tính chi phí vải bạt (80.000đ/m²):</strong> <strong style="color:#f59e0b;">${totalCost.toLocaleString('vi-VN')} VNĐ</strong>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const hCanvas = canvas.height;
                    ctx.clearRect(0, 0, w, hCanvas);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, hCanvas);

                    ctx.fillStyle = '#38bdf8';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('MÔ PHỎNG LỀU TRẠI DÃ NGOẠI HÌNH CHÓP TỨ GIÁC ĐỀU:', 40, 40);

                    // Vẽ lều trại
                    const cx = w / 2, cy = 60;
                    ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.lineTo(cx - 90, hCanvas - 40);
                    ctx.lineTo(cx + 90, hCanvas - 40);
                    ctx.closePath();
                    ctx.fill(); ctx.stroke();

                    // Cửa lều
                    ctx.fillStyle = '#0f172a';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy + 40);
                    ctx.lineTo(cx - 30, hCanvas - 40);
                    ctx.lineTo(cx + 30, hCanvas - 40);
                    ctx.closePath();
                    ctx.fill(); ctx.stroke();
                }

                [inA, inH].forEach(el => el.addEventListener('input', calc));
                calc();
            
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
