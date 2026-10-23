// ================================================================
// BÀI TẬP CUỐI CHƯƠNG V: DỮ LIỆU VÀ BIỂU ĐỒ - TOÁN 8 KNTT
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
  userTitle: 'Đại Kiện Tướng Thống Kê 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_ontap_chuong5_state';

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
    "title": "Thử Thách 1: Phân Loại Dữ Liệu",
    "pts": 20,
    "question": "Dữ liệu nào sau đây là số liệu rời rạc?",
    "options": [
      {
        "text": "Số lượng xe máy bán được trong ngày",
        "correct": true
      },
      {
        "text": "Nhiệt độ sôi của chất lỏng",
        "correct": false
      },
      {
        "text": "Thời gian hoàn thành bài thi",
        "correct": false
      },
      {
        "text": "Khối lượng bao gạo",
        "correct": false
      }
    ],
    "explanation": "Số lượng xe máy là đại lượng đếm được nguyên dương nên là số liệu rời rạc."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Lựa Chọn Biểu Đồ Cơ Cấu",
    "pts": 20,
    "question": "Biểu đồ nào phù hợp nhất để biểu diễn tỉ lệ phần trăm các thành phần chi tiêu trong tháng của một hộ gia đình?",
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
        "text": "Biểu đồ cột",
        "correct": false
      },
      {
        "text": "Biểu đồ tranh",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ hình quạt tròn là lựa chọn tối ưu nhất để thể hiện cơ cấu phần trăm của toàn thể ($100\\%$)."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Lựa Chọn Biểu Đồ Xu Thế",
    "pts": 20,
    "question": "Để theo dõi sự biến đổi dân số Việt Nam qua các năm từ 2010 đến 2024, ta nên chọn loại biểu đồ nào?",
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
        "text": "Bảng kiểm đếm",
        "correct": false
      },
      {
        "text": "Biểu đồ cột chồng",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ đoạn thẳng chuyên biểu diễn xu hướng thay đổi của một chỉ số liên tục qua các mốc thời gian."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Đọc Bảng Số Liệu Ngang",
    "pts": 20,
    "question": "Cho bảng số liệu ngang ghi nhận số học sinh đạt giải quốc tế của các năm:<div class=\"quiz-table-wrap\"><table class=\"quiz-table\"><thead><tr><th>Năm</th><th>2021</th><th>2022</th><th>2023</th><th>2024</th></tr></thead><tbody><tr><td>Số giải</td><td>12</td><td>15</td><td>20</td><td>18</td></tr></tbody></table></div>Năm nào có số giải thưởng nhiều nhất?",
    "options": [
      {
        "text": "Năm 2023 ($20$ giải)",
        "correct": true
      },
      {
        "text": "Năm 2024 ($18$ giải)",
        "correct": false
      },
      {
        "text": "Năm 2022 ($15$ giải)",
        "correct": false
      },
      {
        "text": "Năm 2021 ($12$ giải)",
        "correct": false
      }
    ],
    "explanation": "Số giải cao nhất là 20 giải vào năm 2023."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Tính Tổng Số Giải Thưởng",
    "pts": 20,
    "question": "Ở bảng số liệu trên, tổng số giải thưởng đạt được trong cả 4 năm là:",
    "options": [
      {
        "text": "$65$ giải",
        "correct": true
      },
      {
        "text": "$60$ giải",
        "correct": false
      },
      {
        "text": "$70$ giải",
        "correct": false
      },
      {
        "text": "$55$ giải",
        "correct": false
      }
    ],
    "explanation": "Tổng số giải: $12 + 15 + 20 + 18 = 65$ giải."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Tính Tốc Độ Tăng Trưởng",
    "pts": 20,
    "question": "Từ năm 2021 (12 giải) đến năm 2023 (20 giải), số giải thưởng tăng thêm bao nhiêu phần trăm?",
    "options": [
      {
        "text": "$66{,}7\\%$",
        "correct": true
      },
      {
        "text": "$8\\%$",
        "correct": false
      },
      {
        "text": "$40\\%$",
        "correct": false
      },
      {
        "text": "$60\\%$",
        "correct": false
      }
    ],
    "explanation": "Tỉ lệ tăng: $\\frac{20 - 12}{12} \\times 100\\% = \\frac{8}{12} \\times 100\\% \\approx 66{,}7\\%$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Góc Ở Tâm Biểu Đồ Tròn",
    "pts": 20,
    "question": "Một thành phần chiếm $40\\%$ trong tổng thể. Khi vẽ biểu đồ hình quạt tròn, góc ở tâm của hình quạt đó là:",
    "options": [
      {
        "text": "$144^{\\circ}$",
        "correct": true
      },
      {
        "text": "$40^{\\circ}$",
        "correct": false
      },
      {
        "text": "$100^{\\circ}$",
        "correct": false
      },
      {
        "text": "$120^{\\circ}$",
        "correct": false
      }
    ],
    "explanation": "Góc ở tâm bằng $360^{\\circ} \\times 40\\% = 360^{\\circ} \\times 0{,}4 = 144^{\\circ}$."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Phát Hiện Dữ Liệu Bất Thường",
    "pts": 20,
    "question": "Bảng ghi số lượng bánh mì bán được trong 5 buổi sáng: $50, 48, 52, 2, 51$. Số liệu nào bất thường cần xác minh lại?",
    "options": [
      {
        "text": "$2$",
        "correct": true
      },
      {
        "text": "$50$",
        "correct": false
      },
      {
        "text": "$52$",
        "correct": false
      },
      {
        "text": "$48$",
        "correct": false
      }
    ],
    "explanation": "Số lượng 2 chiếc quá thấp đột ngột so với mặt bằng 50 chiếc mỗi sáng, là giá trị dị biệt cần kiểm tra nguyên nhân."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Tính Trung Bình Cộng",
    "pts": 20,
    "question": "Nhiệt độ đo được trong 3 ngày là $28^{\\circ}\\text{C}, 30^{\\circ}\\text{C}, 32^{\\circ}\\text{C}$. Nhiệt độ trung bình trong 3 ngày là:",
    "options": [
      {
        "text": "$30^{\\circ}\\text{C}$",
        "correct": true
      },
      {
        "text": "$29^{\\circ}\\text{C}$",
        "correct": false
      },
      {
        "text": "$31^{\\circ}\\text{C}$",
        "correct": false
      },
      {
        "text": "$28^{\\circ}\\text{C}$",
        "correct": false
      }
    ],
    "explanation": "Trung bình: $\\frac{28 + 30 + 32}{3} = \\frac{90}{3} = 30^{\\circ}\\text{C}$."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Rút Ra Nhận Xét Thống Kê Đúng Đắn",
    "pts": 20,
    "question": "Khẳng định nào sau đây là nguyên tắc quan trọng nhất khi phân tích số liệu thống kê?",
    "options": [
      {
        "text": "Rà soát tính hợp lí của số liệu, quan sát tổng thể và đưa ra kết luận dựa trên bằng chứng",
        "correct": true
      },
      {
        "text": "Chỉ quan sát hình ảnh cột cao mà không cần đọc số liệu",
        "correct": false
      },
      {
        "text": "Luôn bỏ qua các số liệu bất thường mà không cần tìm hiểu nguyên nhân",
        "correct": false
      },
      {
        "text": "Tự suy đoán số liệu theo ý kiến chủ quan",
        "correct": false
      }
    ],
    "explanation": "Khoa học thống kê yêu cầu dữ liệu phải khách quan, có kiểm chứng, phân tích đa chiều và đưa ra quyết định dựa trên bằng chứng xác thực."
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
                const outEl = document.getElementById('lab1Output');
                let view = 'table';

                const items = [
                    { name: 'Loại A (Xuất sắc)', val: 10, pct: 25, col: '#10b981' },
                    { name: 'Loại B (Giỏi)', val: 16, pct: 40, col: '#06b6d4' },
                    { name: 'Loại C (Khá)', val: 10, pct: 25, col: '#f59e0b' },
                    { name: 'Loại D (Đạt)', val: 4, pct: 10, col: '#ec4899' }
                ];

                function render() {
                    if (view === 'table') {
                        outEl.innerHTML = `
                            <div class="quiz-table-wrap">
                                <table class="quiz-table">
                                    <thead><tr><th>Học lực</th><th>Xuất sắc</th><th>Giỏi</th><th>Khá</th><th>Đạt</th></tr></thead>
                                    <tbody><tr><td>Số HS (Tổng 40)</td><td>10 (25%)</td><td>16 (40%)</td><td>10 (25%)</td><td>4 (10%)</td></tr></tbody>
                                </table>
                            </div>
                        `;
                    } else {
                        outEl.innerHTML = `<strong>Tổng số học sinh khảo sát:</strong> $40$ em. Tỉ lệ: Xuất sắc $25\\%$, Giỏi $40\\%$, Khá $25\\%$, Đạt $10\\%$.`;
                    }
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    if (view === 'bar') {
                        ctx.fillStyle = '#06b6d4';
                        ctx.font = 'bold 15px Segoe UI';
                        ctx.fillText('BIỂU ĐỒ CỘT: SỐ LƯỢNG HỌC SINH MỖI XẾP LOẠI', 30, 30);

                        items.forEach((it, i) => {
                            const x = 60 + i * 115;
                            const bh = it.val * 7;
                            ctx.fillStyle = it.col;
                            ctx.fillRect(x, 165 - bh, 65, bh);

                            ctx.fillStyle = '#fff';
                            ctx.font = 'bold 13px Segoe UI';
                            ctx.fillText(`${it.val} em`, x + 15, 155 - bh);
                            ctx.fillText(it.name.split(' ')[1], x + 12, 185);
                        });
                    } else if (view === 'pie') {
                        ctx.fillStyle = '#f59e0b';
                        ctx.font = 'bold 15px Segoe UI';
                        ctx.fillText('BIỂU ĐỒ TRÒN: CƠ CẤU XẾP LOẠI HỌC LỰC (100%)', 30, 30);

                        const cx = w / 2 - 80;
                        const cy = 115;
                        const R = 75;
                        let curAng = -Math.PI / 2;

                        items.forEach(it => {
                            const sa = (it.pct / 100) * Math.PI * 2;
                            ctx.fillStyle = it.col;
                            ctx.beginPath();
                            ctx.moveTo(cx, cy);
                            ctx.arc(cx, cy, R, curAng, curAng + sa);
                            ctx.closePath();
                            ctx.fill();
                            curAng += sa;
                        });

                        items.forEach((it, i) => {
                            const y = 60 + i * 26;
                            ctx.fillStyle = it.col;
                            ctx.fillRect(w - 210, y, 16, 16);
                            ctx.fillStyle = '#cbd5e1';
                            ctx.font = '13px Segoe UI';
                            ctx.fillText(`${it.name}: ${it.pct}%`, w - 185, y + 13);
                        });
                    } else {
                        ctx.fillStyle = '#10b981';
                        ctx.font = 'bold 15px Segoe UI';
                        ctx.fillText('BẢNG DỮ LIỆU ĐÃ ĐƯỢC CHUẨN HÓA TRỰC QUAN', 30, 50);
                    }
                }

                document.getElementById('btnDashTable').addEventListener('click', () => { view = 'table'; render(); });
                document.getElementById('btnDashBar').addEventListener('click', () => { view = 'bar'; render(); });
                document.getElementById('btnDashPie').addEventListener('click', () => { view = 'pie'; render(); });
                render();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const btn = document.getElementById('btnCalcQuick');
                const outEl = document.getElementById('lab2Output');

                function render() {
                    outEl.innerHTML = `
                        <strong>Bảng số liệu ngang chuẩn:</strong>
                        <div class="quiz-table-wrap">
                            <table class="quiz-table">
                                <thead><tr><th>Khối</th><th>Khối 6</th><th>Khối 7</th><th>Khối 8</th><th>Khối 9</th></tr></thead>
                                <tbody><tr><td>Số HS Giỏi</td><td>45</td><td>50</td><td>65</td><td>40</td></tr></tbody>
                            </table>
                        </div>
                        <strong>Tổng số HS Giỏi toàn trường:</strong> $45 + 50 + 65 + 40 = \\mathbf{200}$ em.<br>
                        <strong>Tỉ lệ khối 8 chiếm cao nhất:</strong> $\\frac{65}{200} \\times 100\\% = \\mathbf{32{,}5\\%}$.
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(60, 60, w - 120, 60);

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 20px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText('TỔNG SỐ HỌC SINH GIỎI: 200 EM (KHỐI 8 DẪN ĐẦU 32.5%)', w / 2, 98);
                    ctx.textAlign = 'left';
                }

                btn.addEventListener('click', render);
                render();
            
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
