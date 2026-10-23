// ================================================================
// BÀI 20: PHÂN TÍCH SỐ LIỆU THỐNG KÊ DỰA VÀO BIỂU ĐỒ - TOÁN 8 KNTT
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
  userTitle: 'Chuyên Gia Phân Tích Thống Kê 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai20_state';

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
    "title": "Thử Thách 1: Đọc Số Liệu Cực Đại",
    "pts": 20,
    "question": "Cho bảng số liệu ngang ghi nhận doanh thu (triệu đồng) của một cửa hàng:<div class=\"quiz-table-wrap\"><table class=\"quiz-table\"><thead><tr><th>Tháng</th><th>Tháng 1</th><th>Tháng 2</th><th>Tháng 3</th><th>Tháng 4</th></tr></thead><tbody><tr><td>Doanh thu</td><td>85</td><td>120</td><td>95</td><td>110</td></tr></tbody></table></div>Tháng nào có doanh thu cao nhất?",
    "options": [
      {
        "text": "Tháng 2 ($120$ triệu)",
        "correct": true
      },
      {
        "text": "Tháng 4 ($110$ triệu)",
        "correct": false
      },
      {
        "text": "Tháng 3 ($95$ triệu)",
        "correct": false
      },
      {
        "text": "Tháng 1 ($85$ triệu)",
        "correct": false
      }
    ],
    "explanation": "Doanh thu cao nhất là Tháng 2 đạt 120 triệu đồng."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Tính Mức Độ Chênh Lệch",
    "pts": 20,
    "question": "Ở bảng số liệu trên, độ chênh lệch giữa tháng có doanh thu cao nhất và tháng có doanh thu thấp nhất là:",
    "options": [
      {
        "text": "$35$ triệu đồng",
        "correct": true
      },
      {
        "text": "$25$ triệu đồng",
        "correct": false
      },
      {
        "text": "$30$ triệu đồng",
        "correct": false
      },
      {
        "text": "$40$ triệu đồng",
        "correct": false
      }
    ],
    "explanation": "Chênh lệch: $120 - 85 = 35$ triệu đồng."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Tính Tốc Độ Tăng Trưởng",
    "pts": 20,
    "question": "Doanh thu tháng 1 là $80$ triệu đồng, doanh thu tháng 2 là $100$ triệu đồng. Tốc độ tăng trưởng doanh thu từ tháng 1 sang tháng 2 là:",
    "options": [
      {
        "text": "$25\\%$",
        "correct": true
      },
      {
        "text": "$20\\%$",
        "correct": false
      },
      {
        "text": "$125\\%$",
        "correct": false
      },
      {
        "text": "$15\\%$",
        "correct": false
      }
    ],
    "explanation": "Tốc độ tăng trưởng: $\\frac{100 - 80}{80} \\times 100\\% = \\frac{20}{80} \\times 100\\% = 25\\%$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Phát Hiện Nhận Xét SAI",
    "pts": 20,
    "question": "Một biểu đồ cột cho thấy doanh số điện thoại bán ra qua 3 quý là: Quý 1 (200 chiếc), Quý 2 (300 chiếc), Quý 3 (250 chiếc). Nhận xét nào sau đây là SAI?",
    "options": [
      {
        "text": "Doanh số điện thoại tăng liên tục qua cả 3 quý",
        "correct": true
      },
      {
        "text": "Quý 2 có doanh số cao nhất",
        "correct": false
      },
      {
        "text": "Từ Quý 2 sang Quý 3 doanh số giảm 50 chiếc",
        "correct": false
      },
      {
        "text": "Tổng số điện thoại bán được trong 3 quý là 750 chiếc",
        "correct": false
      }
    ],
    "explanation": "Nhận xét 'tăng liên tục qua 3 quý' là SAI vì từ Quý 2 sang Quý 3 doanh số đã giảm từ 300 xuống 250 chiếc."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Nhận Diện Hiện Tượng Đánh Lừa Thị Giác",
    "pts": 20,
    "question": "Khi đọc một biểu đồ cột so sánh hai sản phẩm A (98 sản phẩm) và B (100 sản phẩm), ta thấy cột B cao gấp đôi cột A. Nguyên nhân rất có thể là:",
    "options": [
      {
        "text": "Trục đứng không bắt đầu từ số 0 mà bị cắt xén bắt đầu từ số 96",
        "correct": true
      },
      {
        "text": "Sản phẩm B bán chạy gấp đôi sản phẩm A",
        "correct": false
      },
      {
        "text": "Vẽ sai tỉ lệ cột B",
        "correct": false
      },
      {
        "text": "Đơn vị đo của sản phẩm A khác sản phẩm B",
        "correct": false
      }
    ],
    "explanation": "Khi trục đứng không bắt đầu từ 0 (cắt xén gốc), khoảng cách nhỏ (98 và 100) có thể bị phóng đại tạo cảm giác cột B cao gấp đôi."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Đọc Tỉ Lệ Trong Biểu Đồ Quạt Tròn",
    "pts": 20,
    "question": "Biểu đồ quạt tròn ghi nhận thị phần của 3 hãng sữa: Hãng A ($50\\%$), Hãng B ($30\\%$), Hãng C ($20\\%$). Thị phần của Hãng A gấp mấy lần Hãng C?",
    "options": [
      {
        "text": "$2{,}5$ lần",
        "correct": true
      },
      {
        "text": "$2$ lần",
        "correct": false
      },
      {
        "text": "$3$ lần",
        "correct": false
      },
      {
        "text": "$1{,}5$ lần",
        "correct": false
      }
    ],
    "explanation": "Tỉ số: $\\frac{50\\%}{20\\%} = 2{,}5$ lần."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Tính Giá Trị Thực Từ Biểu Đồ Tròn",
    "pts": 20,
    "question": "Ở câu 6 trên, nếu tổng dung lượng thị trường là $200$ tỉ đồng thì doanh thu của Hãng B là:",
    "options": [
      {
        "text": "$60$ tỉ đồng",
        "correct": true
      },
      {
        "text": "$30$ tỉ đồng",
        "correct": false
      },
      {
        "text": "$100$ tỉ đồng",
        "correct": false
      },
      {
        "text": "$40$ tỉ đồng",
        "correct": false
      }
    ],
    "explanation": "Doanh thu Hãng B: $200 \\times 30\\% = 60$ tỉ đồng."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Nhận Diện Giá Trị Bất Thường",
    "pts": 20,
    "question": "Bảng ghi lại số lượng xe ô tô đi qua trạm thu phí vào 5 ngày trong tuần: Thứ Hai ($1200$), Thứ Ba ($1150$), Thứ Tư ($1180$), Thứ Năm ($3500$), Thứ Sáu ($1210$). Ngày nào có số liệu bất thường cần kiểm tra lại?",
    "options": [
      {
        "text": "Thứ Năm ($3500$ xe)",
        "correct": true
      },
      {
        "text": "Thứ Hai ($1200$ xe)",
        "correct": false
      },
      {
        "text": "Thứ Ba ($1150$ xe)",
        "correct": false
      },
      {
        "text": "Thứ Sáu ($1210$ xe)",
        "correct": false
      }
    ],
    "explanation": "Số lượng xe ngày Thứ Năm vọt lên 3500 xe (gấp 3 lần ngày thường) là giá trị dị biệt cần kiểm tra nguyên nhân."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Ra Quyết Định Kinh Doanh",
    "pts": 20,
    "question": "Một siêu thị theo dõi lượng bán quạt máy trong năm thấy Quý 2 bán được $800$ chiếc, Quý 3 bán được $750$ chiếc, Quý 4 bán được $50$ chiếc, Quý 1 bán được $100$ chiếc. Quản lí siêu thị nên ra quyết định nào?",
    "options": [
      {
        "text": "Tăng cường nhập quạt máy vào đầu Quý 2 và xả hàng tồn vào cuối Quý 3",
        "correct": true
      },
      {
        "text": "Nhập nhiều quạt máy vào Quý 4",
        "correct": false
      },
      {
        "text": "Nhập lượng hàng đều nhau cả 4 quý",
        "correct": false
      },
      {
        "text": "Ngừng bán quạt máy hoàn toàn",
        "correct": false
      }
    ],
    "explanation": "Nhu cầu quạt máy phụ thuộc chặt chẽ vào mùa hè (Quý 2 và Quý 3), do đó cần nhập hàng đầu Quý 2 và xả hàng cuối Quý 3."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Tính Số Trung Bình Cộng",
    "pts": 20,
    "question": "Số lượng bánh mì bán được trong 4 ngày là: $120, 150, 140, 190$. Số lượng bánh mì trung bình bán được mỗi ngày là:",
    "options": [
      {
        "text": "$150$ chiếc",
        "correct": true
      },
      {
        "text": "$140$ chiếc",
        "correct": false
      },
      {
        "text": "$160$ chiếc",
        "correct": false
      },
      {
        "text": "$145$ chiếc",
        "correct": false
      }
    ],
    "explanation": "Trung bình cộng: $\\frac{120 + 150 + 140 + 190}{4} = \\frac{600}{4} = 150$ chiếc."
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
                const r24 = document.getElementById('rev2024');
                const r25 = document.getElementById('rev2025');
                const outEl = document.getElementById('lab1Output');

                function update() {
                    const v24 = parseInt(r24.value);
                    const v25 = parseInt(r25.value);
                    const diff = v25 - v24;
                    const rate = ((diff / v24) * 100).toFixed(1);

                    outEl.innerHTML = `
                        <strong>Năm 2024:</strong> $${v24}$ triệu &nbsp;|&nbsp; <strong>Năm 2025:</strong> $${v25}$ triệu<br>
                        <strong>Chênh lệch tuyệt đối:</strong> $${diff >= 0 ? '+' : ''}${diff}$ triệu &nbsp;|&nbsp; 
                        <strong>Tốc độ tăng trưởng:</strong> $\\mathbf{${rate >= 0 ? '+' : ''}${rate}\\%}$
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#818cf8';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('SO SÁNH TĂNG TRƯỞNG DOANH THU HAI NĂM', 30, 30);

                    // Cot 2024
                    const h24 = (v24 / 200) * 120;
                    ctx.fillStyle = '#6366f1';
                    ctx.fillRect(120, 165 - h24, 70, h24);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText(`${v24} tr`, 135, 155 - h24);
                    ctx.fillText('2024', 135, 185);

                    // Cot 2025
                    const h25 = (v25 / 200) * 120;
                    ctx.fillStyle = diff >= 0 ? '#10b981' : '#f43f5e';
                    ctx.fillRect(230, 165 - h25, 70, h25);
                    ctx.fillStyle = '#fff';
                    ctx.fillText(`${v25} tr`, 245, 155 - h25);
                    ctx.fillText('2025', 245, 185);

                    // Mui ten tang truong
                    ctx.fillStyle = diff >= 0 ? '#10b981' : '#f43f5e';
                    ctx.font = 'bold 16px Segoe UI';
                    ctx.fillText(`Tăng trưởng: ${rate >= 0 ? '+' : ''}${rate}%`, 330, 100);
                }

                r24.addEventListener('input', update);
                r25.addEventListener('input', update);
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const btn = document.getElementById('btnDecision');
                const outEl = document.getElementById('lab2Output');

                const quarters = [
                    { q: 'Quý 1 (Xuân)', sales: 120, col: '#6366f1' },
                    { q: 'Quý 2 (Hạ)', sales: 450, col: '#06b6d4' },
                    { q: 'Quý 3 (Thu)', sales: 520, col: '#10b981' },
                    { q: 'Quý 4 (Đông)', sales: 90, col: '#f59e0b' }
                ];

                function render() {
                    outEl.innerHTML = `
                        <strong>Phân tích quy luật mùa vụ:</strong> Doanh số áo mưa tăng vọt vào Quý 2 và Quý 3 (mùa mưa, đạt đỉnh 520 chiếc).<br>
                        <strong>Quyết định quản trị:</strong> Cần tập trung nhập hàng và chuẩn bị kho bãi từ cuối Quý 1 để đón đầu nhu cầu Quý 2 và Quý 3. Giảm lượng tồn kho tối đa vào Quý 4.
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
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('BIỂU ĐỒ DOANH SỐ ÁO MƯA THEO 4 QUÝ TRONG NĂM', 30, 30);

                    quarters.forEach((item, i) => {
                        const x = 50 + i * 115;
                        const barH = (item.sales / 600) * 120;
                        ctx.fillStyle = item.col;
                        ctx.fillRect(x, 165 - barH, 65, barH);

                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 12px Segoe UI';
                        ctx.fillText(`${item.sales}c`, x + 20, 155 - barH);
                        ctx.fillText(`Quý ${i+1}`, x + 15, 185);
                    });
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
