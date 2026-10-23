// ================================================================
// DÂN SỐ VÀ CƠ CẤU DÂN SỐ VIỆT NAM - TOÁN 7 KNTT
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
  userTitle: 'Nhà Nhân Khẩu Học Trẻ 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_thuchanh2_state';

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
    "title": "Câu 1: Dân số Việt Nam năm 1979",
    "pts": 20,
    "question": "Theo cuộc Tổng điều tra dân số năm 1979, dân số Việt Nam là bao nhiêu triệu người?",
    "options": [
      {
        "text": "$52.7$ triệu người",
        "correct": true
      },
      {
        "text": "$64.4$ triệu người",
        "correct": false
      },
      {
        "text": "$76.3$ triệu người",
        "correct": false
      },
      {
        "text": "$96.2$ triệu người",
        "correct": false
      }
    ],
    "explanation": "Số liệu chính thức Tổng điều tra dân số năm 1979: Dân số nước ta là $52.7$ triệu người."
  },
  {
    "id": 2,
    "title": "Câu 2: Dân số Việt Nam năm 2019",
    "pts": 20,
    "question": "Theo Tổng điều tra dân số năm 2019, dân số Việt Nam đã đạt mốc nào?",
    "options": [
      {
        "text": "$96.2$ triệu người",
        "correct": true
      },
      {
        "text": "$85.8$ triệu người",
        "correct": false
      },
      {
        "text": "$105.0$ triệu người",
        "correct": false
      },
      {
        "text": "$79.5$ triệu người",
        "correct": false
      }
    ],
    "explanation": "Năm 2019, dân số nước ta đạt $96.2$ triệu người, tăng $43.5$ triệu người so với năm 1979."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính mức tăng dân số sau 40 năm",
    "pts": 20,
    "question": "Từ năm 1979 ($52.7$ triệu người) đến năm 2019 ($96.2$ triệu người), dân số Việt Nam đã tăng thêm bao nhiêu triệu người?",
    "options": [
      {
        "text": "$43.5$ triệu người",
        "correct": true
      },
      {
        "text": "$40.0$ triệu người",
        "correct": false
      },
      {
        "text": "$45.2$ triệu người",
        "correct": false
      },
      {
        "text": "$38.5$ triệu người",
        "correct": false
      }
    ],
    "explanation": "Mức tăng là: $96.2 - 52.7 = 43.5$ triệu người."
  },
  {
    "id": 4,
    "title": "Câu 4: Thời kì dân số vàng",
    "pts": 20,
    "question": "Một quốc gia được xem là bước vào thời kì 'Dân số vàng' khi tỉ lệ người trong độ tuổi lao động (15 - 64 tuổi) đạt:",
    "options": [
      {
        "text": "Từ $66\\%$ trở lên (cứ 2 người đi làm nuôi tối đa 1 người phụ thuộc)",
        "correct": true
      },
      {
        "text": "Dưới $50\\%$",
        "correct": false
      },
      {
        "text": "Chỉ có trẻ em dưới 15 tuổi",
        "correct": false
      },
      {
        "text": "Chỉ có người trên 65 tuổi",
        "correct": false
      }
    ],
    "explanation": "Dân số vàng là khi tỉ lệ dân số trong độ tuổi lao động chiếm từ $66\\%$ (khoảng $2/3$) trở lên tổng dân số."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhóm tuổi lao động Việt Nam",
    "pts": 20,
    "question": "Năm 2019, nhóm tuổi lao động (15 - 64 tuổi) ở Việt Nam chiếm tỉ lệ khoảng bao nhiêu phần trăm?",
    "options": [
      {
        "text": "$68.0\\%$",
        "correct": true
      },
      {
        "text": "$24.3\\%$",
        "correct": false
      },
      {
        "text": "$7.7\\%$",
        "correct": false
      },
      {
        "text": "$50.0\\%$",
        "correct": false
      }
    ],
    "explanation": "Nhóm tuổi từ 15 đến 64 tuổi chiếm $68.0\\%$, chứng tỏ Việt Nam đang sở hữu cơ cấu dân số vàng lí tưởng."
  },
  {
    "id": 6,
    "title": "Câu 6: Lựa chọn biểu đồ cho quy mô dân số qua 4 thập kỉ",
    "pts": 20,
    "question": "Để biểu diễn quy mô dân số Việt Nam qua các mốc năm 1979, 1989, 1999, 2009, 2019, loại biểu đồ nào là tối ưu nhất?",
    "options": [
      {
        "text": "Biểu đồ đoạn thẳng",
        "correct": true
      },
      {
        "text": "Biểu đồ hình quạt tròn",
        "correct": false
      },
      {
        "text": "Biểu đồ tranh",
        "correct": false
      },
      {
        "text": "Sơ đồ cây",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ đoạn thẳng thể hiện xuất sắc tiến trình tăng trưởng liên tục qua các mốc thời gian thập kỉ."
  },
  {
    "id": 7,
    "title": "Câu 7: Lựa chọn biểu đồ cho cơ cấu tuổi",
    "pts": 20,
    "question": "Để biểu diễn tỉ lệ phần trăm của 3 nhóm tuổi (dưới lao động, trong lao động, hết lao động) trong năm 2019, loại biểu đồ nào là thích hợp nhất?",
    "options": [
      {
        "text": "Biểu đồ hình quạt tròn",
        "correct": true
      },
      {
        "text": "Biểu đồ đoạn thẳng",
        "correct": false
      },
      {
        "text": "Biểu đồ đường gấp khúc",
        "correct": false
      },
      {
        "text": "Biểu đồ phân tán",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ quạt tròn trực quan hóa hoàn hảo tỉ lệ phần trăm cơ cấu các thành phần hợp thành $100\\%$."
  },
  {
    "id": 8,
    "title": "Câu 8: Thách thức của già hóa dân số",
    "pts": 20,
    "question": "Tỉ lệ người cao tuổi (từ 65 tuổi trở lên) tăng dần đặt ra thách thức kinh tế - xã hội nào lớn nhất?",
    "options": [
      {
        "text": "Cần mở rộng quỹ bảo hiểm y tế, hệ thống chăm sóc sức khỏe và viện dưỡng lão",
        "correct": true
      },
      {
        "text": "Thiếu trường học mầm non",
        "correct": false
      },
      {
        "text": "Thừa việc làm cho thanh niên",
        "correct": false
      },
      {
        "text": "Không gây ra bất kì thách thức nào",
        "correct": false
      }
    ],
    "explanation": "Già hóa dân số đòi hỏi hệ thống an sinh xã hội, bảo hiểm y tế và dịch vụ chăm sóc người cao tuổi phải được nâng cấp toàn diện."
  },
  {
    "id": 9,
    "title": "Câu 9: Tính trung bình tăng mỗi năm",
    "pts": 20,
    "question": "Trong giai đoạn 2009 - 2019 (10 năm), dân số nước ta tăng từ $85.8$ triệu lên $96.2$ triệu người. Trung bình mỗi năm dân số tăng khoảng bao nhiêu?",
    "options": [
      {
        "text": "Khoảng $1.04$ triệu người/năm",
        "correct": true
      },
      {
        "text": "Khoảng $2.5$ triệu người/năm",
        "correct": false
      },
      {
        "text": "Khoảng $0.5$ triệu người/năm",
        "correct": false
      },
      {
        "text": "Khoảng $10.4$ triệu người/năm",
        "correct": false
      }
    ],
    "explanation": "Tổng tăng trong 10 năm là $96.2 - 85.8 = 10.4$ triệu người. Trung bình mỗi năm tăng: $\\\\frac{10.4}{10} = 1.04$ triệu người."
  },
  {
    "id": 10,
    "title": "Câu 10: Vai trò của toán học trong đời sống",
    "pts": 20,
    "question": "Qua hoạt động thực hành này, ta thấy việc thu thập và biểu diễn số liệu thống kê giúp ích gì trong quản lí xã hội?",
    "options": [
      {
        "text": "Giúp Nhà nước nắm chắc thực trạng, dự báo xu thế và hoạch định chính sách phát triển đất nước",
        "correct": true
      },
      {
        "text": "Chỉ dùng để làm bài tập thi học kì",
        "correct": false
      },
      {
        "text": "Không có ứng dụng nào ngoài sách vở",
        "correct": false
      },
      {
        "text": "Làm cho số liệu thêm phức tạp hơn",
        "correct": false
      }
    ],
    "explanation": "Thống kê dân số là nền tảng chiến lược giúp quốc gia quy hoạch giáo dục, y tế, lao động và an sinh xã hội bền vững."
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
                let selIdx = 4;
                const popData = [
                    { year: '1979', val: 52.7 },
                    { year: '1989', val: 64.4 },
                    { year: '1999', val: 76.3 },
                    { year: '2009', val: 85.8 },
                    { year: '2019', val: 96.2 }
                ];

                function drawVNChart() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const padL = 60, padR = 40, padT = 30, padB = 40;
                    const plotW = w - padL - padR;
                    const plotH = h - padT - padB;

                    // Truc toa do
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB);
                    ctx.stroke();

                    // Thang do (40 to 110 trieu nguoi)
                    ctx.font = '11px Segoe UI'; ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    for (let v = 40; v <= 110; v += 20) {
                        const y = padT + plotH * (1 - (v - 40) / 70);
                        ctx.fillText(`${v} tr`, padL - 40, y + 4);
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
                    }

                    const pts = [];
                    for (let i = 0; i < popData.length; i++) {
                        const x = padL + (i / (popData.length - 1)) * plotW;
                        const y = padT + plotH * (1 - (popData[i].val - 40) / 70);
                        pts.push({x, y});

                        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'center';
                        ctx.fillText(popData[i].year, x, h - padB + 20);
                    }

                    // Duong noi
                    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
                    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                    ctx.stroke();

                    // Cham diem
                    for (let i = 0; i < pts.length; i++) {
                        const isSel = (i === selIdx);
                        ctx.fillStyle = isSel ? '#f59e0b' : '#06b6d4';
                        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, isSel ? 7 : 4, 0, Math.PI * 2); ctx.fill();

                        ctx.fillStyle = isSel ? '#f59e0b' : '#ffffff';
                        ctx.font = isSel ? 'bold 13px Segoe UI' : '11px Segoe UI';
                        ctx.fillText(`${popData[i].val} tr`, pts[i].x, pts[i].y - 10);
                    }

                    const item = popData[selIdx];
                    const out = document.getElementById('lab1VNPopOut');
                    let diffText = '';
                    if (selIdx > 0) {
                        const diff = (item.val - popData[selIdx - 1].val).toFixed(1);
                        diffText = `(Tăng +${diff} triệu người sau 10 năm so với năm ${popData[selIdx - 1].year})`;
                    }
                    out.innerHTML = `Năm <strong>${item.year}</strong>: Dân số Việt Nam đạt <strong>${item.val} triệu người</strong>. ${diffText}`;
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 200 * window.devicePixelRatio || 200;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawVNChart();
                }

                document.getElementById('btnVN1979').addEventListener('click', () => { selIdx = 0; drawVNChart(); });
                document.getElementById('btnVN1989').addEventListener('click', () => { selIdx = 1; drawVNChart(); });
                document.getElementById('btnVN1999').addEventListener('click', () => { selIdx = 2; drawVNChart(); });
                document.getElementById('btnVN2009').addEventListener('click', () => { selIdx = 3; drawVNChart(); });
                document.getElementById('btnVN2019').addEventListener('click', () => { selIdx = 4; drawVNChart(); });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');

                function drawAgePie() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const cx = w * 0.38;
                    const cy = h * 0.5;
                    const r = Math.min(w, h) * 0.38;

                    // 0-14 tuoi: 24.3%, 15-64 tuoi: 68%, 65+: 7.7%
                    const slices = [
                        { p: 24.3, col: '#06b6d4', label: '0 - 14 tuổi: 24.3%' },
                        { p: 68.0, col: '#10b981', label: '15 - 64 tuổi (lao động): 68.0%' },
                        { p: 7.7, col: '#f59e0b', label: 'Từ 65 tuổi trở lên: 7.7%' }
                    ];

                    let cur = -Math.PI / 2;
                    for (let s of slices) {
                        const ang = s.p * 3.6 * Math.PI / 180;
                        ctx2.fillStyle = s.col;
                        ctx2.beginPath(); ctx2.moveTo(cx, cy); ctx2.arc(cx, cy, r, cur, cur + ang); ctx2.closePath(); ctx2.fill();
                        cur += ang;
                    }

                    // Chu giai
                    const lx = w * 0.65;
                    let ly = 40;
                    ctx2.font = '12px Segoe UI';
                    for (let s of slices) {
                        ctx2.fillStyle = s.col; ctx2.fillRect(lx, ly, 14, 14);
                        ctx2.fillStyle = '#ffffff'; ctx2.fillText(s.label, lx + 20, ly + 12);
                        ly += 35;
                    }

                    const out = document.getElementById('lab2VNAgeOut');
                    out.innerHTML = `Nhóm tuổi lao động chiếm $68.0\%$ (hơn $2/3$ dân số) khẳng định nước ta đang trong thời kì <strong>'Dân số vàng'</strong> - nguồn lực lao động khổng lồ để phát triển đất nước!`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 190 * window.devicePixelRatio || 190;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawAgePie();
                }

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
