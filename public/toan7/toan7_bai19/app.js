// ================================================================
// BÀI 19: BIỂU ĐỒ ĐOẠN THẲNG - TOÁN 7 KNTT
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
  userTitle: 'Chuyên Gia Biểu Đồ Thời Gian',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai19_state';

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
    "title": "Câu 1: Trục ngang biểu diễn gì?",
    "pts": 20,
    "question": "Trong biểu đồ đoạn thẳng, trục nằm ngang thường dùng để biểu diễn:",
    "options": [
      {
        "text": "Các mốc thời gian (ngày, tháng, năm...)",
        "correct": true
      },
      {
        "text": "Số lượng sản phẩm",
        "correct": false
      },
      {
        "text": "Nhiệt độ",
        "correct": false
      },
      {
        "text": "Tỉ lệ phần trăm",
        "correct": false
      }
    ],
    "explanation": "Quy ước chuẩn: Trục nằm ngang biểu diễn thời gian, trục thẳng đứng biểu diễn đại lượng số liệu."
  },
  {
    "id": 2,
    "title": "Câu 2: Đoạn thẳng dốc lên",
    "pts": 20,
    "question": "Trên biểu đồ đoạn thẳng, nếu đoạn thẳng đi lên từ trái sang phải thì số liệu biểu diễn:",
    "options": [
      {
        "text": "Có xu hướng tăng",
        "correct": true
      },
      {
        "text": "Có xu hướng giảm",
        "correct": false
      },
      {
        "text": "Không thay đổi",
        "correct": false
      },
      {
        "text": "Bằng 0",
        "correct": false
      }
    ],
    "explanation": "Đoạn thẳng đi lên thể hiện giá trị tại mốc thời gian sau lớn hơn mốc thời gian trước, tức là có xu hướng tăng."
  },
  {
    "id": 3,
    "title": "Câu 3: Đoạn thẳng nằm ngang",
    "pts": 20,
    "question": "Nếu đoạn thẳng nối hai điểm trên biểu đồ nằm ngang thì giá trị của đại lượng:",
    "options": [
      {
        "text": "Không thay đổi trong khoảng thời gian đó",
        "correct": true
      },
      {
        "text": "Tăng gấp đôi",
        "correct": false
      },
      {
        "text": "Giảm xuống 0",
        "correct": false
      },
      {
        "text": "Đạt giá trị âm",
        "correct": false
      }
    ],
    "explanation": "Đoạn thẳng nằm ngang thể hiện hai thời điểm có giá trị bằng nhau, nghĩa là số liệu không đổi."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính mức tăng trưởng",
    "pts": 20,
    "question": "Biểu đồ ghi nhận sản lượng xuất khẩu gạo năm 2020 là $6.1$ triệu tấn, năm 2021 là $6.5$ triệu tấn. Sản lượng năm 2021 tăng bao nhiêu so với năm 2020?",
    "options": [
      {
        "text": "$0.4$ triệu tấn",
        "correct": true
      },
      {
        "text": "$0.5$ triệu tấn",
        "correct": false
      },
      {
        "text": "$1.4$ triệu tấn",
        "correct": false
      },
      {
        "text": "$0.6$ triệu tấn",
        "correct": false
      }
    ],
    "explanation": "Mức tăng là: $6.5 - 6.1 = 0.4$ triệu tấn."
  },
  {
    "id": 5,
    "title": "Câu 5: Phát hiện mốc cao nhất",
    "pts": 20,
    "question": "Giá trị lớn nhất của đại lượng trên biểu đồ đoạn thẳng được biểu thị bởi:",
    "options": [
      {
        "text": "Điểm nằm ở vị trí cao nhất trên biểu đồ",
        "correct": true
      },
      {
        "text": "Điểm đầu tiên bên trái",
        "correct": false
      },
      {
        "text": "Điểm cuối cùng bên phải",
        "correct": false
      },
      {
        "text": "Điểm nằm ở chính giữa",
        "correct": false
      }
    ],
    "explanation": "Trục tung đo giá trị từ thấp lên cao, vì vậy điểm nằm ở vị trí cao nhất chính là điểm có giá trị lớn nhất."
  },
  {
    "id": 6,
    "title": "Câu 6: Ưu điểm của biểu đồ đoạn thẳng",
    "pts": 20,
    "question": "Ưu điểm vượt trội của biểu đồ đoạn thẳng so với biểu đồ hình quạt tròn là:",
    "options": [
      {
        "text": "Nhận biết trực quan chiều hướng và tốc độ thay đổi theo thời gian",
        "correct": true
      },
      {
        "text": "Dễ dàng tính tỉ lệ phần trăm trên tổng thể",
        "correct": false
      },
      {
        "text": "Chỉ dùng cho các đại lượng phi số",
        "correct": false
      },
      {
        "text": "Không cần chia vạch thang đo",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ đoạn thẳng là công cụ tối ưu để quan sát xu hướng biến thiên (tăng, giảm, biến động mạnh hay nhẹ) qua thời gian."
  },
  {
    "id": 7,
    "title": "Câu 7: Tốc độ tăng trưởng",
    "pts": 20,
    "question": "Giữa hai giai đoạn tăng trưởng: giai đoạn 1 đoạn thẳng dốc $60^\\\\circ$, giai đoạn 2 đoạn thẳng dốc $25^\\\\circ$. Giai đoạn nào tăng trưởng nhanh hơn?",
    "options": [
      {
        "text": "Giai đoạn 1",
        "correct": true
      },
      {
        "text": "Giai đoạn 2",
        "correct": false
      },
      {
        "text": "Hai giai đoạn tăng bằng nhau",
        "correct": false
      },
      {
        "text": "Không thể kết luận",
        "correct": false
      }
    ],
    "explanation": "Độ dốc càng lớn (càng dốc đứng) thể hiện đại lượng biến đổi càng nhiều trong một đơn vị thời gian, tức là tăng trưởng nhanh hơn."
  },
  {
    "id": 8,
    "title": "Câu 8: Cắt ngắn trục tung",
    "pts": 20,
    "question": "Đường dích dắc (gợn sóng) ở phần dưới của trục tung trong biểu đồ đoạn thẳng mang ý nghĩa gì?",
    "options": [
      {
        "text": "Biểu thị việc cắt bớt đoạn từ 0 đến giá trị đầu tiên để biểu đồ rõ nét hơn",
        "correct": true
      },
      {
        "text": "Báo hiệu số liệu bị lỗi",
        "correct": false
      },
      {
        "text": "Biểu thị dữ liệu sóng biển",
        "correct": false
      },
      {
        "text": "Đánh dấu gốc tọa độ âm",
        "correct": false
      }
    ],
    "explanation": "Khi các số liệu đều lớn (ví dụ từ 80 đến 100), vẽ từ 0 sẽ làm biểu đồ bị nén dẹt. Dấu dích dắc giúp cắt bớt khoảng trống từ 0 đến 80."
  },
  {
    "id": 9,
    "title": "Câu 9: Bảng số liệu ngang sang biểu đồ",
    "pts": 20,
    "question": "Cho bảng số liệu nhiệt độ (°C) lúc 8h, 10h, 12h, 14h lần lượt là: $22, 26, 30, 28$. Điểm nào là đỉnh cao nhất của biểu đồ?",
    "options": [
      {
        "text": "Mốc 12h với $30^\\\\circ\\\\text{C}$",
        "correct": true
      },
      {
        "text": "Mốc 14h với $28^\\\\circ\\\\text{C}$",
        "correct": false
      },
      {
        "text": "Mốc 10h với $26^\\\\circ\\\\text{C}$",
        "correct": false
      },
      {
        "text": "Mốc 8h với $22^\\\\circ\\\\text{C}$",
        "correct": false
      }
    ],
    "explanation": "Nhiệt độ $30^\\\\circ\\\\text{C}$ lúc 12h là giá trị lớn nhất trong dãy số liệu."
  },
  {
    "id": 10,
    "title": "Câu 10: Dự báo xu thế",
    "pts": 20,
    "question": "Một công ty ghi nhận doanh thu 5 tháng liên tiếp đều tăng đều đặn. Xu hướng khả dĩ nhất cho tháng tiếp theo là:",
    "options": [
      {
        "text": "Tiếp tục có xu hướng tăng hoặc duy trì ổn định",
        "correct": true
      },
      {
        "text": "Chắc chắn giảm về 0 ngay lập tức",
        "correct": false
      },
      {
        "text": "Không thể dự đoán bất cứ điều gì",
        "correct": false
      },
      {
        "text": "Doanh thu sẽ bị âm",
        "correct": false
      }
    ],
    "explanation": "Dựa trên quán tính xu hướng của biểu đồ đoạn thẳng, dữ liệu thường tiếp tục đà tăng trưởng trong điều kiện bình thường."
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
                let t1 = 20, t2 = 32, t3 = 26, t4 = 22;

                function drawLineChart() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const padL = 50, padR = 40, padT = 30, padB = 40;
                    const plotW = w - padL - padR;
                    const plotH = h - padT - padB;

                    // Truc toa do
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(padL, padT); ctx.lineTo(padL, h - padB); ctx.lineTo(w - padR, h - padB);
                    ctx.stroke();

                    // Luoi ngang (15 to 35)
                    ctx.font = '11px Segoe UI'; ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                    for (let temp = 15; temp <= 35; temp += 5) {
                        const y = padT + plotH * (1 - (temp - 15) / 20);
                        ctx.fillText(`${temp}°`, padL - 30, y + 4);
                        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)'; ctx.lineWidth = 1;
                        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(w - padR, y); ctx.stroke();
                    }

                    // Toa do 4 diem
                    const temps = [t1, t2, t3, t4];
                    const labels = ['6h', '12h', '18h', '24h'];
                    const pts = [];

                    for (let i = 0; i < 4; i++) {
                        const x = padL + (i / 3) * plotW;
                        const y = padT + plotH * (1 - (temps[i] - 15) / 20);
                        pts.push({x, y});

                        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'center';
                        ctx.fillText(labels[i], x, h - padB + 20);
                    }

                    // Noi duong doan thang
                    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(pts[0].x, pts[0].y);
                    for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x, pts[i].y);
                    ctx.stroke();

                    // Cham diem & gia tri
                    for (let i = 0; i < 4; i++) {
                        ctx.fillStyle = '#f59e0b';
                        ctx.beginPath(); ctx.arc(pts[i].x, pts[i].y, 5, 0, Math.PI * 2); ctx.fill();

                        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px Segoe UI';
                        ctx.fillText(`${temps[i]}°C`, pts[i].x, pts[i].y - 10);
                    }

                    const out = document.getElementById('lab1LineOut');
                    out.innerHTML = `Nhiệt độ các mốc: 6h (${t1}°C) $\\to$ 12h (${t2}°C: tăng ${t2 - t1}°C) $\\to$ 18h (${t3}°C: giảm ${t2 - t3}°C) $\\to$ 24h (${t4}°C: giảm ${t3 - t4}°C). Đỉnh nhiệt độ đạt lúc 12h trưa.`;
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 210 * window.devicePixelRatio || 210;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawLineChart();
                }

                document.getElementById('sliderT1').addEventListener('input', e => {
                    t1 = parseInt(e.target.value);
                    document.getElementById('valT1').textContent = `${t1}°C`;
                    drawLineChart();
                });
                document.getElementById('sliderT3').addEventListener('input', e => {
                    t3 = parseInt(e.target.value);
                    document.getElementById('valT3').textContent = `${t3}°C`;
                    drawLineChart();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let y2 = 160;
                const y1 = 100;

                function drawSlope() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const padL = 70, padR = 50, padT = 30, padB = 40;
                    const p1 = { x: padL + 60, y: padT + (h - padT - padB) * (1 - y1 / 250) };
                    const p2 = { x: w - padR - 60, y: padT + (h - padT - padB) * (1 - y2 / 250) };

                    // Truc toa do
                    ctx2.strokeStyle = 'rgba(255, 255, 255, 0.4)'; ctx2.lineWidth = 2;
                    ctx2.beginPath();
                    ctx2.moveTo(padL, padT); ctx2.lineTo(padL, h - padB); ctx2.lineTo(w - padR, h - padB);
                    ctx2.stroke();

                    // Doan noi
                    let col = '#10b981';
                    let trendText = 'TĂNG TRƯỞNG';
                    if (y2 < y1) { col = '#ef4444'; trendText = 'SUY GIẢM'; }
                    else if (y2 === y1) { col = '#f59e0b'; trendText = 'KHÔNG ĐỔI'; }

                    ctx2.strokeStyle = col; ctx2.lineWidth = 4;
                    ctx2.beginPath(); ctx2.moveTo(p1.x, p1.y); ctx2.lineTo(p2.x, p2.y); ctx2.stroke();

                    // Cham diem
                    ctx2.fillStyle = '#ffffff';
                    ctx2.beginPath(); ctx2.arc(p1.x, p1.y, 6, 0, Math.PI * 2); ctx2.fill();
                    ctx2.beginPath(); ctx2.arc(p2.x, p2.y, 6, 0, Math.PI * 2); ctx2.fill();

                    // Nhan
                    ctx2.font = 'bold 13px Segoe UI'; ctx2.textAlign = 'center';
                    ctx2.fillText(`Năm 1: ${y1} tỉ`, p1.x, p1.y - 12);
                    ctx2.fillStyle = col;
                    ctx2.fillText(`Năm 2: ${y2} tỉ`, p2.x, p2.y - 12);

                    const diff = y2 - y1;
                    const pct = ((diff / y1) * 100).toFixed(1);

                    const out = document.getElementById('lab2SlopeOut');
                    out.innerHTML = `Chênh lệch: $\\Delta = ${y2} - ${y1} = ${diff}$ tỉ VNĐ (${pct}%). Xu hướng: <strong><span style="color:${col};">${trendText}</span></strong>. Đoạn thẳng dốc càng lớn phản ánh tốc độ biến động càng mạnh!`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 190 * window.devicePixelRatio || 190;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawSlope();
                }

                document.getElementById('sliderYear2').addEventListener('input', e => {
                    y2 = parseInt(e.target.value);
                    document.getElementById('valYear2').textContent = `${y2} tỉ`;
                    drawSlope();
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
