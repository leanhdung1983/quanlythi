// ================================================================
// BÀI 18: BIỂU ĐỒ HÌNH QUẠT TRÒN - TOÁN 7 KNTT
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
  userTitle: 'Chuyên Gia Biểu Đồ Quạt Tròn',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai18_state';

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
    "title": "Câu 1: Toàn bộ hình tròn",
    "pts": 20,
    "question": "Trong biểu đồ hình quạt tròn, toàn bộ hình tròn biểu diễn bao nhiêu phần trăm?",
    "options": [
      {
        "text": "$100\\%$",
        "correct": true
      },
      {
        "text": "$50\\%$",
        "correct": false
      },
      {
        "text": "$360\\%$",
        "correct": false
      },
      {
        "text": "$180\\%$",
        "correct": false
      }
    ],
    "explanation": "Toàn bộ hình tròn tượng trưng cho $100\\%$ tổng thể dữ liệu được khảo sát."
  },
  {
    "id": 2,
    "title": "Câu 2: Góc ở tâm của 25%",
    "pts": 20,
    "question": "Hình quạt tròn biểu diễn $25\\%$ dữ liệu sẽ có góc ở tâm tương ứng là:",
    "options": [
      {
        "text": "$90^\\\\circ$",
        "correct": true
      },
      {
        "text": "$45^\\\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\\\circ$",
        "correct": false
      },
      {
        "text": "$180^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng công thức: $\\\\alpha = 360^\\\\circ \\\\times \\\\frac{25}{100} = 90^\\\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Góc ở tâm của 50%",
    "pts": 20,
    "question": "Hình quạt tròn biểu diễn $50\\%$ tổng thể là một hình gì?",
    "options": [
      {
        "text": "Nửa hình tròn (góc bẹt $180^\\\\circ$)",
        "correct": true
      },
      {
        "text": "Một phần tư hình tròn (góc $90^\\\\circ$)",
        "correct": false
      },
      {
        "text": "Góc nhọn $45^\\\\circ$",
        "correct": false
      },
      {
        "text": "Góc tù $120^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "$50\\%$ tương ứng với $\\\\alpha = 360^\\\\circ \\\\times \\\\frac{50}{100} = 180^\\\\circ$, chính là một nửa hình tròn."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính số lượng thực tế từ phần trăm",
    "pts": 20,
    "question": "Lớp 7A có 40 học sinh. Biểu đồ quạt tròn cho biết có $30\\%$ học sinh thích môn Toán. Số học sinh thích môn Toán của lớp 7A là:",
    "options": [
      {
        "text": "12 học sinh",
        "correct": true
      },
      {
        "text": "15 học sinh",
        "correct": false
      },
      {
        "text": "10 học sinh",
        "correct": false
      },
      {
        "text": "8 học sinh",
        "correct": false
      }
    ],
    "explanation": "Số học sinh thích môn Toán là: $40 \\\\times \\\\frac{30}{100} = 12$ học sinh."
  },
  {
    "id": 5,
    "title": "Câu 5: Tìm phần trăm từ góc ở tâm",
    "pts": 20,
    "question": "Một hình quạt tròn có góc ở tâm bằng $72^\\\\circ$. Hình quạt này biểu diễn bao nhiêu phần trăm dữ liệu?",
    "options": [
      {
        "text": "$20\\%$",
        "correct": true
      },
      {
        "text": "$25\\%$",
        "correct": false
      },
      {
        "text": "$15\\%$",
        "correct": false
      },
      {
        "text": "$30\\%$",
        "correct": false
      }
    ],
    "explanation": "Tỉ lệ phần trăm là: $p = \\\\frac{72^\\\\circ}{360^\\\\circ} \\\\times 100\\% = 20\\%$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tìm thành phần còn lại",
    "pts": 20,
    "question": "Khảo sát sở thích thể thao của học sinh gồm 3 môn: Bóng đá chiếm $45\\%$, Cầu lông chiếm $35\\%$, còn lại là Bơi lội. Tỉ lệ học sinh thích Bơi lội là:",
    "options": [
      {
        "text": "$20\\%$",
        "correct": true
      },
      {
        "text": "$25\\%$",
        "correct": false
      },
      {
        "text": "$10\\%$",
        "correct": false
      },
      {
        "text": "$30\\%$",
        "correct": false
      }
    ],
    "explanation": "Tổng 3 môn là $100\\%$, do đó Bơi lội chiếm: $100\\% - (45\\% + 35\\%) = 20\\%$."
  },
  {
    "id": 7,
    "title": "Câu 7: So sánh hai thành phần",
    "pts": 20,
    "question": "Trong biểu đồ quạt tròn, thành phần $A$ chiếm góc ở tâm $120^\\\\circ$, thành phần $B$ chiếm góc ở tâm $60^\\\\circ$. Tỉ lệ của $A$ gấp mấy lần $B$?",
    "options": [
      {
        "text": "2 lần",
        "correct": true
      },
      {
        "text": "3 lần",
        "correct": false
      },
      {
        "text": "1.5 lần",
        "correct": false
      },
      {
        "text": "4 lần",
        "correct": false
      }
    ],
    "explanation": "Vì diện tích hình quạt tỉ lệ thuận với góc ở tâm nên tỉ số là: $\\\\frac{120^\\\\circ}{60^\\\\circ} = 2$ lần."
  },
  {
    "id": 8,
    "title": "Câu 8: Ưu điểm của biểu đồ quạt tròn",
    "pts": 20,
    "question": "Biểu đồ hình quạt tròn phát huy tác dụng tốt nhất khi nào?",
    "options": [
      {
        "text": "Khi muốn làm nổi bật tỉ lệ cơ cấu của các phần so với toàn thể",
        "correct": true
      },
      {
        "text": "Khi muốn quan sát sự thay đổi liên tục theo thời gian",
        "correct": false
      },
      {
        "text": "Khi có hàng trăm danh mục dữ liệu khác nhau",
        "correct": false
      },
      {
        "text": "Khi dữ liệu chỉ có số liệu âm",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ quạt tròn trực quan hóa xuất sắc tỉ lệ phần trăm các thành phần đóng góp vào tổng thể $100\\%$."
  },
  {
    "id": 9,
    "title": "Câu 9: Tính góc ở tâm cho 15%",
    "pts": 20,
    "question": "Để vẽ hình quạt biểu diễn tỉ lệ $15\\%$, ta cần đo một góc ở tâm có số đo bằng:",
    "options": [
      {
        "text": "$54^\\\\circ$",
        "correct": true
      },
      {
        "text": "$45^\\\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\\\circ$",
        "correct": false
      },
      {
        "text": "$36^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "$\\\\alpha = 360^\\\\circ \\\\times \\\\frac{15}{100} = 54^\\\\circ$."
  },
  {
    "id": 10,
    "title": "Câu 10: Nhận xét từ biểu đồ quạt",
    "pts": 20,
    "question": "Nếu một hình quạt tròn có góc ở tâm là một góc tù ($> 90^\\\\circ$) thì thành phần đó chiếm tỉ lệ:",
    "options": [
      {
        "text": "Lớn hơn $25\\%$",
        "correct": true
      },
      {
        "text": "Nhỏ hơn $25\\%$",
        "correct": false
      },
      {
        "text": "Đúng bằng $25\\%$",
        "correct": false
      },
      {
        "text": "Lớn hơn $50\\%$",
        "correct": false
      }
    ],
    "explanation": "Vì góc vuông $90^\\\\circ$ ứng với $25\\%$, nên góc tù ($> 90^\\\\circ$) sẽ tương ứng với tỉ lệ lớn hơn $25\\%$."
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
                let pA = 40, pB = 35;

                function drawPie() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    if (pA + pB >= 90) {
                        pB = 90 - pA;
                        document.getElementById('sliderPieB').value = pB;
                        document.getElementById('valPieB').textContent = `${pB}%`;
                    }
                    const pC = 100 - (pA + pB);

                    const cx = w * 0.4;
                    const cy = h * 0.5;
                    const r = Math.min(w, h) * 0.38;

                    const angA = pA * 3.6 * Math.PI / 180;
                    const angB = pB * 3.6 * Math.PI / 180;
                    const angC = pC * 3.6 * Math.PI / 180;

                    let curAng = -Math.PI / 2;

                    // Quat A
                    ctx.fillStyle = '#6366f1';
                    ctx.beginPath(); ctx.moveTo(cx, cy);
                    ctx.arc(cx, cy, r, curAng, curAng + angA);
                    ctx.closePath(); ctx.fill();
                    curAng += angA;

                    // Quat B
                    ctx.fillStyle = '#06b6d4';
                    ctx.beginPath(); ctx.moveTo(cx, cy);
                    ctx.arc(cx, cy, r, curAng, curAng + angB);
                    ctx.closePath(); ctx.fill();
                    curAng += angB;

                    // Quat C
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath(); ctx.moveTo(cx, cy);
                    ctx.arc(cx, cy, r, curAng, curAng + angC);
                    ctx.closePath(); ctx.fill();

                    // Chu giai ben phai
                    const lx = w * 0.72;
                    ctx.fillStyle = '#6366f1'; ctx.fillRect(lx, 40, 16, 16);
                    ctx.fillStyle = '#ffffff'; ctx.font = '13px Segoe UI'; ctx.fillText(`Mục A: ${pA}% (${(pA*3.6).toFixed(0)}°)`, lx + 24, 53);

                    ctx.fillStyle = '#06b6d4'; ctx.fillRect(lx, 75, 16, 16);
                    ctx.fillStyle = '#ffffff'; ctx.fillText(`Mục B: ${pB}% (${(pB*3.6).toFixed(0)}°)`, lx + 24, 88);

                    ctx.fillStyle = '#f59e0b'; ctx.fillRect(lx, 110, 16, 16);
                    ctx.fillStyle = '#ffffff'; ctx.fillText(`Mục C: ${pC}% (${(pC*3.6).toFixed(0)}°)`, lx + 24, 123);

                    const out = document.getElementById('lab1PieOut');
                    out.innerHTML = `Góc ở tâm tương ứng: $\\alpha_A = 360^\\circ \\times \\frac{${pA}}{100} = ${(pA*3.6).toFixed(0)}^\\circ$; $\\alpha_B = ${(pB*3.6).toFixed(0)}^\\circ$; $\\alpha_C = ${(pC*3.6).toFixed(0)}^\\circ$. Tổng: $100\% = 360^\\circ$.`;
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 210 * window.devicePixelRatio || 210;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawPie();
                }

                document.getElementById('sliderPieA').addEventListener('input', e => {
                    pA = parseInt(e.target.value);
                    document.getElementById('valPieA').textContent = `${pA}%`;
                    drawPie();
                });
                document.getElementById('sliderPieB').addEventListener('input', e => {
                    pB = parseInt(e.target.value);
                    document.getElementById('valPieB').textContent = `${pB}%`;
                    drawPie();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let perc = 25;

                function drawGauge() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const cx = w / 2;
                    const cy = h * 0.52;
                    const r = Math.min(w, h) * 0.38;

                    const deg = perc * 3.6;
                    const rad = deg * Math.PI / 180;

                    // Vanh thuoc do 360 do
                    ctx2.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx2.lineWidth = 14;
                    ctx2.beginPath(); ctx2.arc(cx, cy, r, 0, Math.PI * 2); ctx2.stroke();

                    // Cung ti le
                    ctx2.strokeStyle = '#10b981';
                    ctx2.lineWidth = 14;
                    ctx2.beginPath(); ctx2.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + rad); ctx2.stroke();

                    // Kim chi
                    ctx2.strokeStyle = '#ffffff'; ctx2.lineWidth = 3;
                    ctx2.beginPath(); ctx2.moveTo(cx, cy);
                    ctx2.lineTo(cx + r * Math.cos(-Math.PI / 2 + rad), cy + r * Math.sin(-Math.PI / 2 + rad));
                    ctx2.stroke();

                    // Tam O
                    ctx2.fillStyle = '#10b981';
                    ctx2.beginPath(); ctx2.arc(cx, cy, 6, 0, Math.PI * 2); ctx2.fill();

                    // Chu giua
                    ctx2.fillStyle = '#ffffff'; ctx2.font = 'bold 20px Segoe UI'; ctx2.textAlign = 'center';
                    ctx2.fillText(`${perc}%`, cx, cy - 8);
                    ctx2.font = '13px Segoe UI'; ctx2.fillStyle = '#10b981';
                    ctx2.fillText(`${deg.toFixed(1)}°`, cx, cy + 18);

                    const out = document.getElementById('lab2AngleDegOut');
                    out.innerHTML = `Tỉ lệ $p = ${perc}\\%$ $\\implies$ Góc ở tâm $\\alpha = 360^\\circ \\times \\frac{${perc}}{100} = ${deg.toFixed(1)}^\\circ$.`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 200 * window.devicePixelRatio || 200;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawGauge();
                }

                document.getElementById('sliderPerc').addEventListener('input', e => {
                    perc = parseInt(e.target.value);
                    document.getElementById('valPerc').textContent = `${perc}%`;
                    drawGauge();
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
