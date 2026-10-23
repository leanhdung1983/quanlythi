// ================================================================
// BÀI 21: TÍNH CHẤT CỦA DÃY TỈ SỐ BẰNG NHAU - TOÁN 7 KNTT
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
  userTitle: 'Nhà Điều Phối Dãy Tỉ Số 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai21_state';

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
    "title": "Câu 1: Công thức dãy tỉ số bằng nhau",
    "pts": 20,
    "question": "Cho $\\frac{x}{3} = \\frac{y}{5}$, theo tính chất dãy tỉ số bằng nhau thì đẳng thức nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$\\frac{x}{3} = \\frac{y}{5} = \\frac{x + y}{8}$",
        "correct": true
      },
      {
        "text": "$\\frac{x}{3} = \\frac{y}{5} = \\frac{x + y}{15}$",
        "correct": false
      },
      {
        "text": "$\\frac{x}{3} = \\frac{y}{5} = \\frac{x - y}{8}$",
        "correct": false
      },
      {
        "text": "$\\frac{x}{3} = \\frac{y}{5} = \\frac{x \\cdot y}{15}$",
        "correct": false
      }
    ],
    "explanation": "Theo tính chất dãy tỉ số bằng nhau: $\\frac{x}{3} = \\frac{y}{5} = \\frac{x+y}{3+5} = \\frac{x+y}{8}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Tìm hai số biết tổng và tỉ số",
    "pts": 20,
    "question": "Tìm hai số $x$ và $y$ biết $\\frac{x}{2} = \\frac{y}{3}$ và $x + y = 20$:",
    "options": [
      {
        "text": "$x = 8,\\; y = 12$",
        "correct": true
      },
      {
        "text": "$x = 6,\\; y = 14$",
        "correct": false
      },
      {
        "text": "$x = 10,\\; y = 10$",
        "correct": false
      },
      {
        "text": "$x = 4,\\; y = 16$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{x}{2} = \\frac{y}{3} = \\frac{x+y}{2+3} = \\frac{20}{5} = 4$. Suy ra $x = 2 \\cdot 4 = 8$ và $y = 3 \\cdot 4 = 12$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tìm hai số biết hiệu",
    "pts": 20,
    "question": "Tìm hai số $a, b$ biết $\\frac{a}{7} = \\frac{b}{4}$ và $a - b = 12$:",
    "options": [
      {
        "text": "$a = 28,\\; b = 16$",
        "correct": true
      },
      {
        "text": "$a = 21,\\; b = 9$",
        "correct": false
      },
      {
        "text": "$a = 35,\\; b = 23$",
        "correct": false
      },
      {
        "text": "$a = 14,\\; b = 2$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{a}{7} = \\frac{b}{4} = \\frac{a-b}{7-4} = \\frac{12}{3} = 4$. Do đó $a = 7 \\cdot 4 = 28$ và $b = 4 \\cdot 4 = 16$."
  },
  {
    "id": 4,
    "title": "Câu 4: Ba số tỉ lệ",
    "pts": 20,
    "question": "Cách viết nào sau đây tương đương với $x : y : z = 3 : 5 : 7$?",
    "options": [
      {
        "text": "$\\frac{x}{3} = \\frac{y}{5} = \\frac{z}{7}$",
        "correct": true
      },
      {
        "text": "$\\frac{x}{7} = \\frac{y}{5} = \\frac{z}{3}$",
        "correct": false
      },
      {
        "text": "$3x = 5y = 7z$",
        "correct": false
      },
      {
        "text": "$x + 3 = y + 5 = z + 7$",
        "correct": false
      }
    ],
    "explanation": "Theo quy ước viết tỉ lệ ba số, $x : y : z = 3 : 5 : 7$ nghĩa là $\\frac{x}{3} = \\frac{y}{5} = \\frac{z}{7}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tìm ba số biết tổng",
    "pts": 20,
    "question": "Ba số $x, y, z$ tỉ lệ với $2; 3; 4$ và $x + y + z = 45$. Giá trị của $y$ là:",
    "options": [
      {
        "text": "$y = 15$",
        "correct": true
      },
      {
        "text": "$y = 10$",
        "correct": false
      },
      {
        "text": "$y = 20$",
        "correct": false
      },
      {
        "text": "$y = 12$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{x}{2} = \\frac{y}{3} = \\frac{z}{4} = \\frac{x+y+z}{2+3+4} = \\frac{45}{9} = 5$. Vậy $y = 3 \\cdot 5 = 15$."
  },
  {
    "id": 6,
    "title": "Câu 6: Chia chu vi tam giác",
    "pts": 20,
    "question": "Chu vi một tam giác bằng $36\\text{ cm}$ và ba cạnh tỉ lệ với $3; 4; 5$. Độ dài cạnh lớn nhất là:",
    "options": [
      {
        "text": "$15\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$12\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$9\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$18\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Gọi ba cạnh là $a, b, c$. $\\frac{a}{3} = \\frac{b}{4} = \\frac{c}{5} = \\frac{36}{3+4+5} = \\frac{36}{12} = 3$. Cạnh lớn nhất là $c = 5 \\cdot 3 = 15\\text{ cm}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Dấu phép tính tương ứng",
    "pts": 20,
    "question": "Từ $\\frac{a}{b} = \\frac{c}{d} = \\frac{e}{f}$, biểu thức nào sau đây KHÔNG bằng các tỉ số trên?",
    "options": [
      {
        "text": "$\\frac{a - c + e}{b + d - f}$",
        "correct": true
      },
      {
        "text": "$\\frac{a + c + e}{b + d + f}$",
        "correct": false
      },
      {
        "text": "$\\frac{a - c + e}{b - d + f}$",
        "correct": false
      },
      {
        "text": "$\\frac{c - a}{d - b}$",
        "correct": false
      }
    ],
    "explanation": "Ở mẫu số dấu phải tương ứng với tử số: tử là $a - c + e$ thì mẫu phải là $b - d + f$. Biểu thức có mẫu $b + d - f$ là sai."
  },
  {
    "id": 8,
    "title": "Câu 8: Chia tiền thưởng",
    "pts": 20,
    "question": "Hai lớp 7A và 7B quyên góp được tổng cộng $120$ quyển sách. Biết số sách quyên góp của 7A và 7B tỉ lệ với $5$ và $7$. Lớp 7B quyên góp được:",
    "options": [
      {
        "text": "$70$ quyển sách",
        "correct": true
      },
      {
        "text": "$50$ quyển sách",
        "correct": false
      },
      {
        "text": "$60$ quyển sách",
        "correct": false
      },
      {
        "text": "$80$ quyển sách",
        "correct": false
      }
    ],
    "explanation": "Gọi số sách 7A, 7B là $x, y$. $\\frac{x}{5} = \\frac{y}{7} = \\frac{120}{5+7} = 10$. Số sách lớp 7B là $y = 7 \\cdot 10 = 70$ quyển."
  },
  {
    "id": 9,
    "title": "Câu 9: Tính chất nhân hệ số",
    "pts": 20,
    "question": "Nếu $\\frac{x}{2} = \\frac{y}{3}$ thì $\\frac{2x + 3y}{2 \\cdot 2 + 3 \\cdot 3}$ bằng:",
    "options": [
      {
        "text": "$\\frac{x}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{2x}{3}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$\\frac{x+y}{5}$",
        "correct": false
      }
    ],
    "explanation": "Vì $\\frac{x}{2} = \\frac{y}{3} \\implies \\frac{2x}{4} = \\frac{3y}{9} = \\frac{2x+3y}{4+9} = \\frac{x}{2}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Chia ba góc trong tam giác",
    "pts": 20,
    "question": "Một tam giác có ba góc tỉ lệ với $1; 2; 3$. Số đo góc lớn nhất bằng:",
    "options": [
      {
        "text": "$90^\\circ$",
        "correct": true
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$100^\\circ$",
        "correct": false
      },
      {
        "text": "$120^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Tổng 3 góc bằng $180^\\circ$. $\\frac{A}{1} = \\frac{B}{2} = \\frac{C}{3} = \\frac{180^\\circ}{1+2+3} = 30^\\circ$. Góc lớn nhất là $C = 3 \\cdot 30^\\circ = 90^\\circ$."
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
if (canvas) {
  const ctx = canvas.getContext('2d');
  let a = 4, b = 6, c = 6, d = 9;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const sumTop = a + c;
    const sumBot = b + d;
    const val1 = (a / b).toFixed(2);
    const valSum = (sumTop / sumBot).toFixed(2);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KIỂM CHỨNG TÍNH CHẤT DÃY TỈ SỐ BẰNG NHAU', canvas.width / 2, 30);

    ctx.font = 'bold 20px serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`${a}/${b} = ${val1}`, canvas.width / 4, 90);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`${c}/${d} = ${(c/d).toFixed(2)}`, canvas.width / 2, 90);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`(a+c)/(b+d) = ${sumTop}/${sumBot} = ${valSum}`, (canvas.width * 3) / 4, 90);

    // Vẽ thanh đo trực quan
    const barW = 260;
    ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.fillRect(canvas.width / 2 - 130, 140, barW, 26);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(canvas.width / 2 - 130, 140, barW * (a / b), 26);

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Tỉ số luôn giữ nguyên không đổi: k = 2/3 ≈ 0.67`, canvas.width / 2, 205);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`✓ ${a}/${b} = ${c}/${d} = (${a}+${c})/(${b}+${d}) = ${sumTop}/${sumBot}`, canvas.width / 2, 245);
  }
  draw();

  const btnScale = document.getElementById('btnLab1Scale');
  if (btnScale) {
    btnScale.onclick = () => {
      const mul = Math.floor(Math.random() * 3) + 2;
      a = 2 * mul;
      b = 3 * mul;
      c = 2 * (mul + 1);
      d = 3 * (mul + 1);
      draw();
    };
  }
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');
  let S = 120; // Tổng số kẹo chia cho 3 bạn tỉ lệ 2 : 3 : 5

  function draw2() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);
    const k = S / (2 + 3 + 5);
    const x = 2 * k;
    const y = 3 * k;
    const z = 5 * k;

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(`BÀI TOÁN CHIA PHẦN THƯỞNG: TỔNG S = ${S}`, canvas2.width / 2, 30);
    ctx2.font = '14px sans-serif';
    ctx2.fillStyle = '#94a3b8';
    ctx2.fillText('Ba bạn A, B, C nhận phần thưởng theo tỉ lệ 2 : 3 : 5', canvas2.width / 2, 58);

    // Vẽ biểu đồ 3 cột
    const maxVal = 70;
    const startX = 120;
    const colW = 60;
    const gap = 60;

    // Cột A
    const hA = (x / maxVal) * 120;
    ctx2.fillStyle = '#38bdf8';
    ctx2.fillRect(startX, 210 - hA, colW, hA);
    ctx2.fillText(`A: ${x}`, startX + colW/2, 200 - hA);

    // Cột B
    const hB = (y / maxVal) * 120;
    ctx2.fillStyle = '#f59e0b';
    ctx2.fillRect(startX + colW + gap, 210 - hB, colW, hB);
    ctx2.fillText(`B: ${y}`, startX + colW + gap + colW/2, 200 - hB);

    // Cột C
    const hC = (z / maxVal) * 120;
    ctx2.fillStyle = '#10b981';
    ctx2.fillRect(startX + (colW + gap)*2, 210 - hC, colW, hC);
    ctx2.fillText(`C: ${z}`, startX + (colW + gap)*2 + colW/2, 200 - hC);

    ctx2.font = 'bold 14px sans-serif';
    ctx2.fillStyle = '#e2e8f0';
    ctx2.fillText(`Giá trị 1 phần: k = ${S} : (2 + 3 + 5) = ${k}`, canvas2.width / 2, 245);
  }
  draw2();

  const sliderS = document.getElementById('sliderLab2S');
  if (sliderS) {
    sliderS.oninput = (e) => {
      S = parseInt(e.target.value);
      draw2();
    };
  }
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
