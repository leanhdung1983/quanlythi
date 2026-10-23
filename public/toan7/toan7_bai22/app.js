// ================================================================
// BÀI 22: ĐẠI LƯỢNG TỈ LỆ THUẬN - TOÁN 7 KNTT
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
  userTitle: 'Chuyên Gia Tỉ Lệ Thuận 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai22_state';

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
    "title": "Câu 1: Định nghĩa tỉ lệ thuận",
    "pts": 20,
    "question": "Đại lượng $y$ tỉ lệ thuận với đại lượng $x$ theo hệ số tỉ lệ $k$ ($k \\neq 0$) theo công thức nào?",
    "options": [
      {
        "text": "$y = k \\cdot x$",
        "correct": true
      },
      {
        "text": "$y = \\frac{k}{x}$",
        "correct": false
      },
      {
        "text": "$y = k + x$",
        "correct": false
      },
      {
        "text": "$x \\cdot y = k$",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa SGK: $y$ tỉ lệ thuận với $x$ khi $y = kx$ ($k$ là hằng số khác 0)."
  },
  {
    "id": 2,
    "title": "Câu 2: Hệ số tỉ lệ nghịch đảo",
    "pts": 20,
    "question": "Nếu $y$ tỉ lệ thuận với $x$ theo hệ số tỉ lệ $k = 4$ thì $x$ tỉ lệ thuận với $y$ theo hệ số tỉ lệ:",
    "options": [
      {
        "text": "$\\frac{1}{4}$",
        "correct": true
      },
      {
        "text": "$-4$",
        "correct": false
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      }
    ],
    "explanation": "Nếu $y = kx$ ($k = 4$) thì $x = \\frac{1}{k} y = \\frac{1}{4} y$. Vậy hệ số là $\\frac{1}{4}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tìm hệ số tỉ lệ k",
    "pts": 20,
    "question": "Cho biết khi $x = 3$ thì $y = 15$. Hệ số tỉ lệ $k$ của $y$ đối với $x$ là:",
    "options": [
      {
        "text": "$k = 5$",
        "correct": true
      },
      {
        "text": "$k = \\frac{1}{5}$",
        "correct": false
      },
      {
        "text": "$k = 45$",
        "correct": false
      },
      {
        "text": "$k = 12$",
        "correct": false
      }
    ],
    "explanation": "Ta có $k = \\frac{y}{x} = \\frac{15}{3} = 5$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính giá trị tương ứng",
    "pts": 20,
    "question": "Cho $y$ tỉ lệ thuận với $x$ theo công thức $y = -3x$. Khi $x = -4$ thì giá trị của $y$ bằng:",
    "options": [
      {
        "text": "$12$",
        "correct": true
      },
      {
        "text": "$-12$",
        "correct": false
      },
      {
        "text": "$7$",
        "correct": false
      },
      {
        "text": "$-1$",
        "correct": false
      }
    ],
    "explanation": "Thay $x = -4$ vào công thức: $y = (-3) \\cdot (-4) = 12$."
  },
  {
    "id": 5,
    "title": "Câu 5: Bài toán chuyển động đều",
    "pts": 20,
    "question": "Một ô tô chạy đều với vận tốc $60\\text{ km/h}$. Quãng đường $s\\text{ (km)}$ và thời gian $t\\text{ (h)}$ là hai đại lượng tỉ lệ thuận theo công thức:",
    "options": [
      {
        "text": "$s = 60t$",
        "correct": true
      },
      {
        "text": "$s = \\frac{60}{t}$",
        "correct": false
      },
      {
        "text": "$t = 60s$",
        "correct": false
      },
      {
        "text": "$s = 60 + t$",
        "correct": false
      }
    ],
    "explanation": "Quãng đường bằng vận tốc nhân thời gian: $s = v \\cdot t = 60t$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tính chất tỉ số",
    "pts": 20,
    "question": "Biết $x$ và $y$ tỉ lệ thuận. Với hai giá trị $x_1, x_2$ ta có $y_1, y_2$. Hệ thức nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$\\frac{y_1}{x_1} = \\frac{y_2}{x_2}$",
        "correct": true
      },
      {
        "text": "$x_1 \\cdot y_1 = x_2 \\cdot y_2$",
        "correct": false
      },
      {
        "text": "$\\frac{y_1}{y_2} = \\frac{x_2}{x_1}$",
        "correct": false
      },
      {
        "text": "$x_1 + y_1 = x_2 + y_2$",
        "correct": false
      }
    ],
    "explanation": "Tính chất của hai đại lượng tỉ lệ thuận là tỉ số hai giá trị tương ứng luôn không đổi: $\\frac{y_1}{x_1} = \\frac{y_2}{x_2} = k$."
  },
  {
    "id": 7,
    "title": "Câu 7: Tìm giá trị chưa biết qua tỉ số",
    "pts": 20,
    "question": "Hai thanh kim loại cùng chất có thể tích $10\\text{ cm}^3$ và $15\\text{ cm}^3$. Biết thanh thứ nhất nặng $80\\text{ g}$, thanh thứ hai nặng:",
    "options": [
      {
        "text": "$120\\text{ g}$",
        "correct": true
      },
      {
        "text": "$100\\text{ g}$",
        "correct": false
      },
      {
        "text": "$150\\text{ g}$",
        "correct": false
      },
      {
        "text": "$110\\text{ g}$",
        "correct": false
      }
    ],
    "explanation": "Khối lượng tỉ lệ thuận với thể tích: $\\frac{m_2}{15} = \\frac{80}{10} = 8 \\implies m_2 = 15 \\times 8 = 120\\text{ g}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Đồ thị đại lượng tỉ lệ thuận",
    "pts": 20,
    "question": "Đồ thị của hàm số $y = kx$ ($k \\neq 0$) trên mặt phẳng toạ độ là một đường thẳng luôn đi qua:",
    "options": [
      {
        "text": "Gốc toạ độ $O(0; 0)$",
        "correct": true
      },
      {
        "text": "Điểm $(0; 1)$",
        "correct": false
      },
      {
        "text": "Điểm $(1; 0)$",
        "correct": false
      },
      {
        "text": "Điểm $(1; 1)$",
        "correct": false
      }
    ],
    "explanation": "Khi $x = 0$ thì $y = k \\cdot 0 = 0$, do đó đồ thị luôn đi qua gốc toạ độ $O(0; 0)$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bảng giá trị",
    "pts": 20,
    "question": "Bảng nào sau đây cho biết $y$ tỉ lệ thuận với $x$?",
    "options": [
      {
        "text": "$x = 1, 2, 3$ ứng với $y = 3, 6, 9$",
        "correct": true
      },
      {
        "text": "$x = 1, 2, 3$ ứng với $y = 2, 4, 8$",
        "correct": false
      },
      {
        "text": "$x = 1, 2, 3$ ứng với $y = 5, 6, 7$",
        "correct": false
      },
      {
        "text": "$x = 2, 4, 6$ ứng với $y = 6, 12, 16$",
        "correct": false
      }
    ],
    "explanation": "Xét các tỉ số: $\\frac{3}{1} = \\frac{6}{2} = \\frac{9}{3} = 3$ (bằng nhau không đổi), nên $y$ tỉ lệ thuận với $x$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tỉ lệ thuận trong may mặc",
    "pts": 20,
    "question": "Để may $5$ chiếc áo cần $6\\text{ m}$ vải. Để may $15$ chiếc áo cùng loại cần bao nhiêu mét vải?",
    "options": [
      {
        "text": "$18\\text{ m}$",
        "correct": true
      },
      {
        "text": "$15\\text{ m}$",
        "correct": false
      },
      {
        "text": "$20\\text{ m}$",
        "correct": false
      },
      {
        "text": "$24\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Số mét vải cần là: $(6 : 5) \\times 15 = 18\\text{ m}$."
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
  let k = 2;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ox = 60, oy = 240;

    // Trục toạ độ
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, 20);
    ctx.lineTo(ox, oy);
    ctx.lineTo(canvas.width - 30, oy);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px sans-serif';
    ctx.fillText('x (đầu vào)', canvas.width - 70, oy - 10);
    ctx.fillText('y (đầu ra)', ox + 10, 30);
    ctx.fillText('O', ox - 15, oy + 15);

    // Vẽ đường thẳng y = k*x
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    const scaleX = 40, scaleY = 15;
    for (let x = 0; x <= 6; x++) {
      const y = k * x;
      ctx.lineTo(ox + x * scaleX, oy - y * scaleY);
    }
    ctx.stroke();

    // Điểm mẫu (3, 3k)
    const testX = 3;
    const testY = k * testX;
    const px = ox + testX * scaleX;
    const py = oy - testY * scaleY;

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(px, py, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(`Điểm (${testX}; ${testY})`, px + 10, py - 10);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(`Công thức: y = ${k}x (Hệ số k = ${k})`, canvas.width - 40, 50);
  }
  draw();

  const sliderK = document.getElementById('sliderLab1K');
  if (sliderK) {
    sliderK.oninput = (e) => {
      k = parseFloat(e.target.value);
      draw();
    };
  }
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');
  let donGia = 15; // 15 nghìn đồng / 1 kg cam

  function draw2() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(`BẢNG TỈ LỆ THUẬN: TIỀN MUA CAM (Đơn giá = ${donGia}k/kg)`, canvas2.width / 2, 30);

    // Bảng số liệu
    const cols = [1, 2, 3, 4, 5];
    const tableX = 50;
    const cellW = 75;

    ctx2.font = 'bold 14px sans-serif';
    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText('Số kg (x)', tableX, 90);
    ctx2.fillText('Tiền (y) [k]', tableX, 140);

    cols.forEach((kg, idx) => {
      const cx = tableX + 80 + idx * cellW;
      ctx2.fillStyle = '#ffffff';
      ctx2.fillText(`${kg} kg`, cx, 90);

      const tien = kg * donGia;
      ctx2.fillStyle = '#f59e0b';
      ctx2.fillText(`${tien}k`, cx, 140);
    });

    // Đường kẻ bảng
    ctx2.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx2.strokeRect(tableX - 40, 60, canvas2.width - 80, 110);
    ctx2.beginPath();
    ctx2.moveTo(tableX - 40, 110);
    ctx2.lineTo(canvas2.width - 40, 110);
    ctx2.stroke();

    ctx2.font = '14px sans-serif';
    ctx2.fillStyle = '#10b981';
    ctx2.fillText(`Tính chất: y / x = ${donGia} (hằng số không đổi)`, canvas2.width / 2, 215);
  }
  draw2();

  const sliderGia = document.getElementById('sliderLab2Gia');
  if (sliderGia) {
    sliderGia.oninput = (e) => {
      donGia = parseInt(e.target.value);
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
