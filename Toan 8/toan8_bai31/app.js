// ================================================================
// BÀI 31: CÁCH TÍNH XÁC SUẤT BẰNG TỈ SỐ - TOÁN 8 KNTT
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
  userTitle: 'Chuyên Gia Định Lượng Xác Suất 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai31_state';

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
    "title": "Câu 1: Xác suất gieo xúc xắc mặt chẵn",
    "pts": 20,
    "question": "Gieo một con xúc xắc 6 mặt đồng chất. Xác suất của biến cố: 'Số chấm xuất hiện là số chẵn' bằng:",
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
    "explanation": "Có $3$ kết quả thuận lợi là $\\{2; 4; 6\\}$ trên tổng số $6$ kết quả có thể. $P = \\frac{3}{6} = \\frac{1}{2}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Xác suất gieo xúc xắc mặt lớn hơn 4",
    "pts": 20,
    "question": "Gieo một con xúc xắc. Xác suất để số chấm xuất hiện lớn hơn $4$ là:",
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
    "explanation": "Mặt lớn hơn 4 gồm mặt 5 và mặt 6 ($k = 2$ kết quả thuận lợi). $P = \\frac{2}{6} = \\frac{1}{3}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Xác suất rút bóng màu đỏ",
    "pts": 20,
    "question": "Một hộp có 2 quả bóng đỏ, 3 quả bóng xanh và 5 quả bóng vàng có cùng kích thước. Lấy ngẫu nhiên một quả bóng. Xác suất lấy được quả bóng màu đỏ là:",
    "options": [
      {
        "text": "$\\frac{1}{5}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{10}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{8}$",
        "correct": false
      }
    ],
    "explanation": "Tổng số quả bóng là $n = 2 + 3 + 5 = 10$. Số quả bóng đỏ là $k = 2$. Xác suất $P = \\frac{2}{10} = \\frac{1}{5}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Xác suất biến cố không thể",
    "pts": 20,
    "question": "Gieo một con xúc xắc 6 mặt. Xác suất để xuất hiện mặt có số chấm bằng $8$ là:",
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
        "text": "$\\frac{1}{8}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{6}$",
        "correct": false
      }
    ],
    "explanation": "Đây là biến cố không thể xảy ra vì xúc xắc chỉ có từ 1 đến 6 chấm. Xác suất của biến cố không thể luôn bằng 0."
  },
  {
    "id": 5,
    "title": "Câu 5: Xác suất biến cố chắc chắn",
    "pts": 20,
    "question": "Gieo một con xúc xắc 6 mặt. Xác suất để số chấm xuất hiện nhỏ hơn $10$ là:",
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
        "text": "$\\frac{6}{10}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      }
    ],
    "explanation": "Tất cả 6 mặt đều có số chấm nhỏ hơn 10. Đây là biến cố chắc chắn, có xác suất bằng $\\frac{6}{6} = 1$."
  },
  {
    "id": 6,
    "title": "Câu 6: Rút thẻ chia hết cho 5",
    "pts": 20,
    "question": "Một hộp có 20 tấm thẻ đánh số từ $1$ đến $20$. Rút ngẫu nhiên một thẻ. Xác suất để số trên thẻ chia hết cho $5$ là:",
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
        "text": "$\\frac{3}{20}$",
        "correct": false
      }
    ],
    "explanation": "Các số từ 1 đến 20 chia hết cho 5 là $\\{5; 10; 15; 20\\}$ (có 4 số). Xác suất $P = \\frac{4}{20} = \\frac{1}{5}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Tung hai đồng xu cùng xuất hiện mặt ngửa",
    "pts": 20,
    "question": "Tung hai đồng xu cân đối đồng thời. Xác suất để cả hai đồng xu đều xuất hiện mặt ngửa là:",
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
    "explanation": "Có 4 kết quả có thể: $(S, S), (S, N), (N, S), (N, N)$. Chỉ có 1 kết quả thuận lợi là $(N, N)$. Xác suất $P = \\frac{1}{4}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Xác suất biến cố đối",
    "pts": 20,
    "question": "Nếu xác suất trời mưa vào ngày mai là $0{,}35$, thì xác suất để trời không mưa vào ngày mai là:",
    "options": [
      {
        "text": "$0{,}65$",
        "correct": true
      },
      {
        "text": "$0{,}35$",
        "correct": false
      },
      {
        "text": "$0{,}75$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Hai biến cố đối nhau có tổng xác suất bằng 1: $P(\\text{không mưa}) = 1 - P(\\text{mưa}) = 1 - 0{,}35 = 0{,}65$."
  },
  {
    "id": 9,
    "title": "Câu 9: Chọn ngẫu nhiên học sinh trong lớp",
    "pts": 20,
    "question": "Một lớp học có 24 học sinh nữ và 16 học sinh nam. Chọn ngẫu nhiên một học sinh làm lớp trưởng. Xác suất chọn được học sinh nữ là:",
    "options": [
      {
        "text": "$\\frac{3}{5}$",
        "correct": true
      },
      {
        "text": "$\\frac{2}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      }
    ],
    "explanation": "Tổng số học sinh là $24 + 16 = 40$. Xác suất chọn học sinh nữ là $P = \\frac{24}{40} = \\frac{3}{5} = 0{,}6$."
  },
  {
    "id": 10,
    "title": "Câu 10: Rút thẻ số chính phương",
    "pts": 20,
    "question": "Trong các số từ $1$ đến $30$, chọn ngẫu nhiên một số. Xác suất chọn được số chính phương là:",
    "options": [
      {
        "text": "$\\frac{1}{6}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{10}$",
        "correct": false
      },
      {
        "text": "$\\frac{5}{30}$",
        "correct": false
      }
    ],
    "explanation": "Các số chính phương từ 1 đến 30 là: $1^2=1, 2^2=4, 3^2=9, 4^2=16, 5^2=25$ (gồm 5 số). Xác suất $P = \\frac{5}{30} = \\frac{1}{6}$."
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
                const sN = document.getElementById('sliderN31');
                const valN = document.getElementById('valN31');
                const sel = document.getElementById('selEvent');
                const outEl = document.getElementById('lab1Output31');

                function isPrime(num) {
                    if (num <= 1) return false;
                    for (let i = 2; i * i <= num; i++) if (num % i === 0) return false;
                    return true;
                }

                function update() {
                    const n = parseInt(sN.value);
                    valN.textContent = n;
                    const mode = sel.value;

                    let k = 0;
                    const favorable = [];
                    for (let i = 1; i <= n; i++) {
                        let match = false;
                        if (mode === 'even' && i % 2 === 0) match = true;
                        else if (mode === 'odd' && i % 2 !== 0) match = true;
                        else if (mode === 'prime' && isPrime(i)) match = true;
                        else if (mode === 'gt5' && i > 5) match = true;

                        if (match) { k++; favorable.push(i); }
                    }

                    const prob = (k / n).toFixed(3);
                    const percent = (k / n * 100).toFixed(1);

                    outEl.innerHTML = `<strong>Tổng số kết quả:</strong> $n = ${n}$ &nbsp;|&nbsp; <strong>Số kết quả thuận lợi:</strong> $k = ${k}$ (gồm $\\{${favorable.join('; ')}\\}$) <br><strong>Xác suất lý thuyết:</strong> <span style="color:#34d399; font-weight:bold; font-size:1.15rem;">$P(E) = \\frac{${k}}{${n}} \\approx ${prob}$ (${percent}%)</span>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Vẽ các tấm thẻ
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText('CÁC TẤM THẺ ĐƯỢC CHỌN (Xanh: Thuận lợi, Xám: Không thuận lợi):', 40, 35);

                    const cardW = 28;
                    const cardH = 40;
                    for (let i = 1; i <= n; i++) {
                        const isFav = favorable.includes(i);
                        const posX = 40 + (i - 1) * 36;
                        const posY = 60;

                        ctx.fillStyle = isFav ? '#0284c7' : '#334155';
                        ctx.strokeStyle = isFav ? '#38bdf8' : '#475569';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.roundRect(posX, posY, cardW, cardH, 5);
                        ctx.fill();
                        ctx.stroke();

                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 14px Segoe UI';
                        ctx.textAlign = 'center';
                        ctx.fillText(i, posX + cardW / 2, posY + 25);
                    }

                    // Biểu đồ thanh tỉ lệ phần trăm xác suất
                    ctx.fillStyle = '#1e293b';
                    ctx.fillRect(40, 130, w - 80, 30);
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(40, 130, (k / n) * (w - 80), 30);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(`P = ${percent}%`, 40 + ((k / n) * (w - 80)) / 2, 150);
                    ctx.textAlign = 'left';
                }

                sN.addEventListener('input', update);
                sel.addEventListener('change', update);
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const inKa = document.getElementById('inKa');
                const inKb = document.getElementById('inKb');
                const outEl = document.getElementById('lab2Output31');

                function draw() {
                    const ka = parseInt(inKa.value) || 0;
                    const kb = parseInt(inKb.value) || 0;
                    const total = 10;
                    const pa = ka / total;
                    const pb = kb / total;

                    let comp = '';
                    if (pa > pb) comp = '<strong style="color:#06b6d4;">Biến cố A có cơ hội cao hơn B</strong>';
                    else if (pa < pb) comp = '<strong style="color:#f59e0b;">Biến cố B có cơ hội cao hơn A</strong>';
                    else comp = '<strong style="color:#34d399;">Hai biến cố có cơ hội ngang nhau (P(A) = P(B))</strong>';

                    outEl.innerHTML = `<strong>Xác suất P(A):</strong> $\\frac{${ka}}{10} = ${pa}$ &nbsp;|&nbsp; <strong>Xác suất P(B):</strong> $\\frac{${kb}}{10} = ${pb}$ <br>${comp}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const cx = w / 2;
                    const cy = 70;

                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 5;
                    ctx.beginPath(); ctx.moveTo(cx, h - 30); ctx.lineTo(cx, cy); ctx.stroke();

                    const angle = Math.max(-0.25, Math.min(0.25, (kb - ka) * 0.04));
                    ctx.save();
                    ctx.translate(cx, cy);
                    ctx.rotate(angle);

                    ctx.strokeStyle = '#818cf8';
                    ctx.lineWidth = 6;
                    ctx.beginPath(); ctx.moveTo(-160, 0); ctx.lineTo(160, 0); ctx.stroke();

                    // Đĩa A
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(-200, 20, 80, 45);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(`P(A)=${pa}`, -160, 48);

                    // Đĩa B
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(120, 20, 80, 45);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(`P(B)=${pb}`, 160, 48);

                    ctx.restore();
                }

                [inKa, inKb].forEach(el => el.addEventListener('input', draw));
                draw();
            
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
