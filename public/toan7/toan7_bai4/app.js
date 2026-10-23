// ================================================================
// BÀI 4: THỨ TỰ THỰC HIỆN CÁC PHÉP TÍNH. QUY TẮC CHUYỂN VẾ - TOÁN 7 KNTT
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
  userTitle: 'Chiến Binh Logic Phương Trình 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai4_state';

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
    "title": "Câu 1: Thứ tự ưu tiên phép toán",
    "pts": 20,
    "question": "Thứ tự thực hiện các phép tính trong biểu thức không có dấu ngoặc là:",
    "options": [
      {
        "text": "Luỹ thừa $\\to$ Nhân và chia $\\to$ Cộng và trừ",
        "correct": true
      },
      {
        "text": "Cộng và trừ $\\to$ Nhân và chia $\\to$ Luỹ thừa",
        "correct": false
      },
      {
        "text": "Nhân và chia $\\to$ Luỹ thừa $\\to$ Cộng và trừ",
        "correct": false
      },
      {
        "text": "Từ trái sang phải không phân biệt phép toán",
        "correct": false
      }
    ],
    "explanation": "Theo quy chuẩn toán học, trong biểu thức không có ngoặc: ưu tiên thực hiện luỹ thừa trước, rồi đến nhân và chia, cuối cùng là cộng và trừ."
  },
  {
    "id": 2,
    "title": "Câu 2: Quy tắc chuyển vế cơ bản",
    "pts": 20,
    "question": "Cho đẳng thức $x - \\frac{3}{5} = \\frac{1}{2}$. Biến đổi nào sau đây theo quy tắc chuyển vế là ĐÚNG?",
    "options": [
      {
        "text": "$x = \\frac{1}{2} + \\frac{3}{5}$",
        "correct": true
      },
      {
        "text": "$x = \\frac{1}{2} - \\frac{3}{5}$",
        "correct": false
      },
      {
        "text": "$x = -\\frac{1}{2} + \\frac{3}{5}$",
        "correct": false
      },
      {
        "text": "$x = -\\frac{1}{2} - \\frac{3}{5}$",
        "correct": false
      }
    ],
    "explanation": "Khi chuyển hạng tử $-\\frac{3}{5}$ từ vế trái sang vế phải, ta phải đổi dấu thành $+\\frac{3}{5}$, do đó $x = \\frac{1}{2} + \\frac{3}{5}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tìm x với quy tắc chuyển vế",
    "pts": 20,
    "question": "Tìm $x$ biết: $\\frac{2}{3} - x = \\frac{1}{4}$:",
    "options": [
      {
        "text": "$x = \\frac{5}{12}$",
        "correct": true
      },
      {
        "text": "$x = -\\frac{5}{12}$",
        "correct": false
      },
      {
        "text": "$x = \\frac{11}{12}$",
        "correct": false
      },
      {
        "text": "$x = -\\frac{11}{12}$",
        "correct": false
      }
    ],
    "explanation": "Chuyển $-x$ sang vế phải và $\\frac{1}{4}$ sang vế trái: $x = \\frac{2}{3} - \\frac{1}{4} = \\frac{8 - 3}{12} = \\frac{5}{12}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Thứ tự ưu tiên các dấu ngoặc",
    "pts": 20,
    "question": "Khi biểu thức có chứa các dấu ngoặc tròn $(\\ )$, ngoặc vuông $[\\ ]$, ngoặc nhọn $\\{\\ \\}$, thứ tự thực hiện đúng là:",
    "options": [
      {
        "text": "$(\\ ) \\to [\\ ] \\to \\{\\ \\}$",
        "correct": true
      },
      {
        "text": "$\\{\\ \\} \\to [\\ ] \\to (\\ )$",
        "correct": false
      },
      {
        "text": "$[\\ ] \\to (\\ ) \\to \\{\\ \\}$",
        "correct": false
      },
      {
        "text": "Tuỳ ý không theo thứ tự",
        "correct": false
      }
    ],
    "explanation": "Quy tắc ưu tiên ngoặc: thực hiện trong ngoặc tròn $(\\ )$ trước, tiếp theo đến ngoặc vuông $[\\ ]$, cuối cùng trong ngoặc nhọn $\\{\\ \\}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tính giá trị biểu thức kết hợp",
    "pts": 20,
    "question": "Giá trị của biểu thức $P = \\frac{3}{4} + \\frac{1}{4} \\cdot \\frac{2}{5}$ bằng:",
    "options": [
      {
        "text": "$\\frac{17}{20}$",
        "correct": true
      },
      {
        "text": "$\\frac{2}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{4}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      }
    ],
    "explanation": "Nhân trước: $\\frac{1}{4} \\cdot \\frac{2}{5} = \\frac{1}{10}$. Cộng sau: $\\frac{3}{4} + \\frac{1}{10} = \\frac{15}{20} + \\frac{2}{20} = \\frac{17}{20}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tìm x trong ngoặc",
    "pts": 20,
    "question": "Tìm số hữu tỉ $x$ thoả mãn: $2 \\cdot \\left(x - \\frac{1}{2}\\right) = \\frac{3}{4}$:",
    "options": [
      {
        "text": "$x = \\frac{7}{8}$",
        "correct": true
      },
      {
        "text": "$x = \\frac{5}{8}$",
        "correct": false
      },
      {
        "text": "$x = \\frac{1}{8}$",
        "correct": false
      },
      {
        "text": "$x = 1$",
        "correct": false
      }
    ],
    "explanation": "Chia cả hai vế cho 2: $x - \\frac{1}{2} = \\frac{3}{4} : 2 = \\frac{3}{8}$. Chuyển vế: $x = \\frac{3}{8} + \\frac{1}{2} = \\frac{3 + 4}{8} = \\frac{7}{8}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Đẳng thức có chứa luỹ thừa",
    "pts": 20,
    "question": "Tìm $x$ biết $\\left(x + \\frac{1}{3}\\right)^2 = \\frac{4}{9}$:",
    "options": [
      {
        "text": "$x = \\frac{1}{3}$ hoặc $x = -1$",
        "correct": true
      },
      {
        "text": "$x = \\frac{1}{3}$",
        "correct": false
      },
      {
        "text": "$x = -1$",
        "correct": false
      },
      {
        "text": "$x = \\frac{2}{3}$ hoặc $x = -\\frac{2}{3}$",
        "correct": false
      }
    ],
    "explanation": "Vì $\\left(\\pm \\frac{2}{3}\\right)^2 = \\frac{4}{9}$ nên xảy ra 2 trường hợp: TH1: $x + \\frac{1}{3} = \\frac{2}{3} \\implies x = \\frac{1}{3}$; TH2: $x + \\frac{1}{3} = -\\frac{2}{3} \\implies x = -1$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tính giá trị biểu thức có luỹ thừa",
    "pts": 20,
    "question": "Giá trị của biểu thức $Q = \\left(-\\frac{1}{2}\\right)^3 : \\frac{1}{4} + 1$ bằng:",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$-\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      }
    ],
    "explanation": "Luỹ thừa trước: $\\left(-\\frac{1}{2}\\right)^3 = -\\frac{1}{8}$. Phép chia: $-\\frac{1}{8} : \\frac{1}{4} = -\\frac{1}{8} \\cdot 4 = -\\frac{1}{2}$. Phép cộng: $-\\frac{1}{2} + 1 = \\frac{1}{2}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bỏ ngoặc đổi dấu phức tạp",
    "pts": 20,
    "question": "Rút gọn biểu thức $K = \\frac{3}{5} - \\left(\\frac{1}{2} - \\frac{2}{5}\\right)$ bằng cách bỏ dấu ngoặc:",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{3}{10}$",
        "correct": false
      },
      {
        "text": "$-\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Bỏ ngoặc có dấu trừ: $K = \\frac{3}{5} - \\frac{1}{2} + \\frac{2}{5} = \\left(\\frac{3}{5} + \\frac{2}{5}\\right) - \\frac{1}{2} = 1 - \\frac{1}{2} = \\frac{1}{2}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng quy tắc chuyển vế vào hình học",
    "pts": 20,
    "question": "Một hình chữ nhật có chu vi $P = 15\\,\\text{cm}$ và chiều rộng $b = 3\\frac{1}{4}\\,\\text{cm}$. Chiều dài $a$ của hình chữ nhật là:",
    "options": [
      {
        "text": "$4,25\\,\\text{cm} = 4\\frac{1}{4}\\,\\text{cm}$",
        "correct": true
      },
      {
        "text": "$4\\,\\text{cm}$",
        "correct": false
      },
      {
        "text": "$4,5\\,\\text{cm}$",
        "correct": false
      },
      {
        "text": "$5\\,\\text{cm}$",
        "correct": false
      }
    ],
    "explanation": "Nửa chu vi là $a + b = 15 : 2 = 7,5\\,\\text{cm}$. Đổi $b = 3,25\\,\\text{cm}$. Chuyển vế: $a = 7,5 - 3,25 = 4,25\\,\\text{cm} = 4\\frac{1}{4}\\,\\text{cm}$."
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
    
                let tb = 3, tc = 7;
                let isTransferred = false;

                function updateTransUI() {
                    const out = document.getElementById('lab1TransOut');
                    const bSign = tb >= 0 ? `+ ${tb}` : `- ${Math.abs(tb)}`;
                    if (!isTransferred) {
                        out.innerHTML = `Phương trình ban đầu: $x ${bSign} = ${tc}$<br>Nhấn <em>'Chuyển Vế b'</em> để đưa số hạng sang vế phải và quan sát quy tắc đổi dấu.`;
                    } else {
                        const oppB = -tb;
                        const oppSign = oppB >= 0 ? `+ ${oppB}` : `- ${Math.abs(oppB)}`;
                        const sol = tc - tb;
                        out.innerHTML = `Bước chuyển vế: $x = ${tc} - (${tb}) \\iff x = ${tc} ${oppSign}$<br><strong>Nghiệm:</strong> $x = ${sol}$. (Đã đổi dấu: $${tb}$ chuyển sang vế phải thành $${-tb}$)`;
                    }
                    renderMathInTree(out);
                }

                document.getElementById('btnTransfer').addEventListener('click', () => {
                    tb = parseInt(document.getElementById('l1_transB').value) || 0;
                    tc = parseInt(document.getElementById('l1_transC').value) || 0;
                    isTransferred = true;
                    updateTransUI();
                });
                document.getElementById('btnResetTrans').addEventListener('click', () => {
                    isTransferred = false;
                    updateTransUI();
                });

                setTimeout(updateTransUI, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                function showSteps() {
                    const sel = document.getElementById('l2_sampleExpr').value;
                    const out = document.getElementById('lab2StepOut');
                    let html = '';

                    if (sel === '1') {
                        html = `
                            <strong>Biểu thức:</strong> $A = \\frac{1}{2} + \\frac{3}{4} \\cdot \\left(2 - \\frac{1}{3}\\right)$<br>
                            <em>Bước 1 (Tính trong ngoặc):</em> $2 - \\frac{1}{3} = \\frac{6}{3} - \\frac{1}{3} = \\frac{5}{3}$<br>
                            <em>Bước 2 (Thực hiện phép nhân):</em> $\\frac{3}{4} \\cdot \\frac{5}{3} = \\frac{5}{4}$<br>
                            <em>Bước 3 (Thực hiện phép cộng):</em> $\\frac{1}{2} + \\frac{5}{4} = \\frac{2}{4} + \\frac{5}{4} = \\frac{7}{4}$.
                        `;
                    } else if (sel === '2') {
                        html = `
                            <strong>Biểu thức:</strong> $B = \\left[ \\left(\\frac{1}{2}\\right)^2 + \\frac{3}{4} \\right] : \\frac{2}{5}$<br>
                            <em>Bước 1 (Tính luỹ thừa):</em> $\\left(\\frac{1}{2}\\right)^2 = \\frac{1}{4}$<br>
                            <em>Bước 2 (Tính trong ngoặc vuông):</em> $\\frac{1}{4} + \\frac{3}{4} = \\frac{4}{4} = 1$<br>
                            <em>Bước 3 (Thực hiện phép chia):</em> $1 : \\frac{2}{5} = 1 \\cdot \\frac{5}{2} = \\frac{5}{2}$.
                        `;
                    } else if (sel === '3') {
                        html = `
                            <strong>Biểu thức:</strong> $C = \\frac{5}{6} - \\left[ \\frac{1}{3} + \\left(\\frac{1}{2}\\right)^3 \\cdot 4 \\right]$<br>
                            <em>Bước 1 (Tính luỹ thừa):</em> $\\left(\\frac{1}{2}\\right)^3 = \\frac{1}{8}$<br>
                            <em>Bước 2 (Nhân trong ngoặc vuông):</em> $\\frac{1}{8} \\cdot 4 = \\frac{1}{2}$<br>
                            <em>Bước 3 (Cộng trong ngoặc vuông):</em> $\\frac{1}{3} + \\frac{1}{2} = \\frac{2 + 3}{6} = \\frac{5}{6}$<br>
                            <em>Bước 4 (Trừ kết quả):</em> $\\frac{5}{6} - \\frac{5}{6} = 0$.
                        `;
                    }

                    out.innerHTML = html;
                    renderMathInTree(out);
                }

                document.getElementById('btnStepEval').addEventListener('click', showSteps);
                setTimeout(showSteps, 100);
            
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
