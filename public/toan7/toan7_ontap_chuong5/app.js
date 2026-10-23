// ================================================================
// ÔN TẬP CHƯƠNG V: THU THẬP VÀ BIỂU DIỄN DỮ LIỆU - TOÁN 7 KNTT
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
  userTitle: 'Đại Sứ Dữ Liệu & Thống Kê 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_ontap_chuong5_state';

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
    "title": "Câu 1: Phân loại dữ liệu",
    "pts": 20,
    "question": "Dãy dữ liệu nào sau đây là **dữ liệu định lượng**?",
    "options": [
      {
        "text": "Cân nặng (kg) của các học sinh trong một câu lạc bộ võ thuật",
        "correct": true
      },
      {
        "text": "Màu sắc áo đồng phục các lớp",
        "correct": false
      },
      {
        "text": "Nơi sinh của các bạn trong lớp",
        "correct": false
      },
      {
        "text": "Trình độ tiếng Anh (A1, A2, B1, B2)",
        "correct": false
      }
    ],
    "explanation": "Cân nặng là số đo có đơn vị kg, có thể thực hiện tính toán số trung bình nên là dữ liệu định lượng."
  },
  {
    "id": 2,
    "title": "Câu 2: Góc ở tâm của 10%",
    "pts": 20,
    "question": "Trong biểu đồ hình quạt tròn, góc ở tâm tương ứng với $10\\%$ là:",
    "options": [
      {
        "text": "$36^\\\\circ$",
        "correct": true
      },
      {
        "text": "$10^\\\\circ$",
        "correct": false
      },
      {
        "text": "$18^\\\\circ$",
        "correct": false
      },
      {
        "text": "$72^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "$\\\\alpha = 360^\\\\circ \\\\times \\\\frac{10}{100} = 36^\\\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Chọn biểu đồ phù hợp cho cơ cấu ngân sách",
    "pts": 20,
    "question": "Để biểu diễn tỉ lệ chi tiêu hàng tháng của một gia đình (tiền ăn $40\\%$, tiền học $25\\%$, tiền nhà $20\\%$, tiết kiệm $15\\%$), loại biểu đồ nào là thích hợp nhất?",
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
        "text": "Biểu đồ tranh",
        "correct": false
      },
      {
        "text": "Biểu đồ hình hộp",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ hình quạt tròn là phương tiện tối ưu để biểu diễn tỉ lệ phần trăm các thành phần đóng góp vào tổng thể $100\\%$."
  },
  {
    "id": 4,
    "title": "Câu 4: Chọn biểu đồ theo dõi giá vàng",
    "pts": 20,
    "question": "Để theo dõi biến động giá vàng hàng ngày trong một tháng, loại biểu đồ nào là thích hợp nhất?",
    "options": [
      {
        "text": "Biểu đồ đoạn thẳng",
        "correct": true
      },
      {
        "text": "Biểu đồ quạt tròn",
        "correct": false
      },
      {
        "text": "Biểu đồ tranh",
        "correct": false
      },
      {
        "text": "Bảng tần số ghép nhóm",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ đoạn thẳng giúp quan sát rõ nét xu thế lên xuống và tốc độ tăng giảm của giá vàng theo thời gian liên tục."
  },
  {
    "id": 5,
    "title": "Câu 5: Phát hiện dữ liệu không hợp lí",
    "pts": 20,
    "question": "Trong cuộc điều tra về số con trong mỗi gia đình ở một tổ dân phố: $1, 2, 2, 3, -1, 2$. Giá trị nào bất hợp lí?",
    "options": [
      {
        "text": "$-1$",
        "correct": true
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$3$",
        "correct": false
      }
    ],
    "explanation": "Số con trong một gia đình phải là số tự nhiên không âm ($0, 1, 2...$), không thể là số âm $-1$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tính số học sinh từ biểu đồ quạt",
    "pts": 20,
    "question": "Khảo sát 200 học sinh về phương tiện đến trường, hình quạt biểu diễn học sinh đi xe đạp có góc ở tâm là $108^\\\\circ$. Số học sinh đi xe đạp là:",
    "options": [
      {
        "text": "60 học sinh",
        "correct": true
      },
      {
        "text": "50 học sinh",
        "correct": false
      },
      {
        "text": "72 học sinh",
        "correct": false
      },
      {
        "text": "108 học sinh",
        "correct": false
      }
    ],
    "explanation": "Tỉ lệ phần trăm: $\\\\frac{108^\\\\circ}{360^\\\\circ} = 30\\%$. Số học sinh đi xe đạp là: $200 \\\\times 30\\% = 60$ học sinh."
  },
  {
    "id": 7,
    "title": "Câu 7: Đọc xu hướng đoạn thẳng",
    "pts": 20,
    "question": "Biểu đồ đoạn thẳng biểu diễn số ca khỏi bệnh qua 4 ngày liên tiếp: Ngày 1 (50 ca), Ngày 2 (80 ca), Ngày 3 (120 ca), Ngày 4 (150 ca). Nhận xét nào đúng?",
    "options": [
      {
        "text": "Số ca khỏi bệnh tăng liên tục qua các ngày",
        "correct": true
      },
      {
        "text": "Số ca khỏi bệnh giảm dần",
        "correct": false
      },
      {
        "text": "Số ca khỏi bệnh không thay đổi",
        "correct": false
      },
      {
        "text": "Ngày 4 có số ca khỏi bệnh thấp nhất",
        "correct": false
      }
    ],
    "explanation": "Dãy số liệu $50 < 80 < 120 < 150$ tăng dần, các đoạn thẳng đều dốc lên thể hiện số ca khỏi bệnh tăng liên tục."
  },
  {
    "id": 8,
    "title": "Câu 8: Tổng các góc ở tâm",
    "pts": 20,
    "question": "Biểu đồ quạt tròn gồm 4 hình quạt có 3 góc ở tâm đã biết là $90^\\\\circ$, $120^\\\\circ$ và $60^\\\\circ$. Số đo của góc ở tâm thứ tư là:",
    "options": [
      {
        "text": "$90^\\\\circ$",
        "correct": true
      },
      {
        "text": "$100^\\\\circ$",
        "correct": false
      },
      {
        "text": "$80^\\\\circ$",
        "correct": false
      },
      {
        "text": "$110^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Tổng 4 góc bằng $360^\\\\circ$, do đó góc thứ tư là: $360^\\\\circ - (90^\\\\circ + 120^\\\\circ + 60^\\\\circ) = 90^\\\\circ$."
  },
  {
    "id": 9,
    "title": "Câu 9: Tính đại diện của mẫu",
    "pts": 20,
    "question": "Để khảo sát mức độ hài lòng của cư dân trong một khu đô thị, phương pháp nào mang tính đại diện tốt nhất?",
    "options": [
      {
        "text": "Phát phiếu ngẫu nhiên cho $20\\%$ số hộ gia đình ở mỗi tòa nhà",
        "correct": true
      },
      {
        "text": "Chỉ hỏi các gia đình ở tầng 1",
        "correct": false
      },
      {
        "text": "Chỉ phỏng vấn những người quen của ban quản lí",
        "correct": false
      },
      {
        "text": "Chỉ lấy ý kiến của 2 gia đình",
        "correct": false
      }
    ],
    "explanation": "Chọn ngẫu nhiên $20\\%$ số hộ ở mọi tòa nhà đảm bảo tính khách quan và đại diện công bằng cho toàn thể cư dân."
  },
  {
    "id": 10,
    "title": "Câu 10: Tốc độ tăng trưởng lớn nhất",
    "pts": 20,
    "question": "Trên biểu đồ đoạn thẳng ghi nhận doanh số 3 quý: Q1 (100 tỉ), Q2 (120 tỉ), Q3 (180 tỉ). Giai đoạn nào có doanh số tăng nhiều hơn?",
    "options": [
      {
        "text": "Từ Quý 2 đến Quý 3 (tăng 60 tỉ)",
        "correct": true
      },
      {
        "text": "Từ Quý 1 đến Quý 2 (tăng 20 tỉ)",
        "correct": false
      },
      {
        "text": "Hai giai đoạn tăng bằng nhau",
        "correct": false
      },
      {
        "text": "Không có giai đoạn nào tăng",
        "correct": false
      }
    ],
    "explanation": "Giai đoạn Q1 $\\\\to$ Q2 tăng $120 - 100 = 20$ tỉ; giai đoạn Q2 $\\\\to$ Q3 tăng $180 - 120 = 60$ tỉ. Vậy Q2 $\\\\to$ Q3 tăng nhiều hơn rõ rệt."
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
                let chartType = 'pie';

                function drawRevChart() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const out = document.getElementById('lab1RevOut');

                    if (chartType === 'pie') {
                        // Ve bieu do quat
                        const cx = w * 0.4;
                        const cy = h * 0.5;
                        const r = Math.min(w, h) * 0.38;

                        const slices = [
                            { p: 40, col: '#6366f1', label: 'Tổ 1: 40%' },
                            { p: 35, col: '#06b6d4', label: 'Tổ 2: 35%' },
                            { p: 25, col: '#10b981', label: 'Tổ 3: 25%' }
                        ];

                        let start = -Math.PI / 2;
                        for (let s of slices) {
                            const ang = s.p * 3.6 * Math.PI / 180;
                            ctx.fillStyle = s.col;
                            ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, start + ang); ctx.closePath(); ctx.fill();
                            start += ang;
                        }

                        const lx = w * 0.72;
                        let ly = 40;
                        ctx.font = '13px Segoe UI';
                        for (let s of slices) {
                            ctx.fillStyle = s.col; ctx.fillRect(lx, ly, 16, 16);
                            ctx.fillStyle = '#ffffff'; ctx.fillText(s.label, lx + 24, ly + 13);
                            ly += 35;
                        }
                        out.innerHTML = `Biểu đồ quạt tròn: Nêu bật cơ cấu phần trăm $40\%, 35\%, 25\%$ so với toàn thể $100\%$.`;
                    } else {
                        // Ve bieu do doan thang
                        const padL = 60, padR = 40, padT = 30, padB = 40;
                        const plotW = w - padL - padR;
                        const plotH = h - padT - padB;

                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 2;
                        ctx.beginPath(); ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB); ctx.stroke();

                        const vals = [20, 35, 45, 60];
                        const years = ['2018', '2019', '2020', '2021'];
                        const pts = [];

                        for (let i = 0; i < 4; i++) {
                            const x = padL + (i / 3) * plotW;
                            const y = padT + plotH * (1 - vals[i] / 70);
                            pts.push({x, y});
                            ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'center';
                            ctx.fillText(years[i], x, h - padB + 20);
                        }

                        ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.moveTo(pts[0].x, pts[0].y);
                        for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x, pts[i].y);
                        ctx.stroke();

                        for (let i = 0; i < 4; i++) {
                            ctx.fillStyle = '#f59e0b';
                            ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 5, 0, Math.PI * 2); ctx.fill();
                            ctx.fillStyle = '#ffffff'; ctx.fillText(`${vals[i]}`, pts[i].x, pts[i].y - 10);
                        }
                        out.innerHTML = `Biểu đồ đoạn thẳng: Nêu bật xu hướng tăng liên tục qua 4 năm từ 20 đến 60 đơn vị.`;
                    }
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 200 * window.devicePixelRatio || 200;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawRevChart();
                }

                document.getElementById('btnShowPie').addEventListener('click', () => { chartType = 'pie'; drawRevChart(); });
                document.getElementById('btnShowLine').addEventListener('click', () => { chartType = 'line'; drawRevChart(); });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let chkP = 30;

                function drawCheck() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const cx = w / 2;
                    const cy = h * 0.52;
                    const r = Math.min(w, h) * 0.38;

                    const deg = chkP * 3.6;
                    const rad = deg * Math.PI / 180;

                    ctx2.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx2.beginPath(); ctx2.arc(cx, cy, r, 0, Math.PI * 2); ctx2.fill();

                    ctx2.fillStyle = '#f59e0b';
                    ctx2.beginPath(); ctx2.moveTo(cx, cy);
                    ctx2.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + rad);
                    ctx2.closePath(); ctx2.fill();

                    ctx2.fillStyle = '#ffffff'; ctx2.font = 'bold 15px Segoe UI'; ctx2.textAlign = 'center';
                    ctx2.fillText(`${chkP}% ⟺ ${deg.toFixed(1)}°`, cx, h - 10);

                    const out = document.getElementById('lab2CheckOut');
                    out.innerHTML = `Góc ở tâm: $\\alpha = 360^\\circ \\times \\frac{${chkP}}{100} = ${deg.toFixed(1)}^\\circ$. Phần còn lại: $100\% - ${chkP}\\% = ${100 - chkP}\\%$ tương ứng ${(360 - deg).toFixed(1)}^\\circ$.`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 190 * window.devicePixelRatio || 190;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawCheck();
                }

                document.getElementById('sliderCheckP').addEventListener('input', e => {
                    chkP = parseInt(e.target.value);
                    document.getElementById('valCheckP').textContent = `${chkP}%`;
                    drawCheck();
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
