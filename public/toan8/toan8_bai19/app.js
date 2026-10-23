// ================================================================
// BÀI 19: BIỂU DIỄN DỮ LIỆU BẰNG BẢNG, BIỂU ĐỒ - TOÁN 8 KNTT
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
  userTitle: 'Kiến Trúc Sư Biểu Đồ 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai19_state';

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
    "title": "Thử Thách 1: Lựa Chọn Biểu Đồ Thể Hiện Cơ Cấu",
    "pts": 20,
    "question": "Để biểu diễn tỉ lệ phần trăm các loại cây ăn quả trồng trong một trang trại (tổng bằng $100\\%$), loại biểu đồ nào sau đây là thích hợp nhất?",
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
        "text": "Biểu đồ cột kép",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ hình quạt tròn là lựa chọn tối ưu nhất để thể hiện cơ cấu tỉ lệ phần trăm của các phần trong tổng thể ($100\\%$)."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Lựa Chọn Biểu Đồ Thể Hiện Xu Hướng",
    "pts": 20,
    "question": "Để biểu diễn sự thay đổi nhiệt độ của một bệnh nhân trong vòng 24 giờ, loại biểu đồ nào thích hợp nhất?",
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
        "text": "Bảng kiểm đếm",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ đoạn thẳng chuyên dùng để theo dõi sự biến đổi và xu hướng của một đại lượng liên tục theo thời gian."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Lựa Chọn Biểu Đồ So Sánh Hai Đối Tượng",
    "pts": 20,
    "question": "Để so sánh số lượng huy chương vàng của hai đoàn thể thao Việt Nam và Thái Lan qua các kì SEA Games, ta nên dùng:",
    "options": [
      {
        "text": "Biểu đồ cột kép",
        "correct": true
      },
      {
        "text": "Biểu đồ hình quạt tròn",
        "correct": false
      },
      {
        "text": "Biểu đồ cột đơn",
        "correct": false
      },
      {
        "text": "Bảng tần số rời rạc",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ cột kép là công cụ tối ưu để so sánh trực quan từng cặp số liệu của hai đối tượng tại các mốc khác nhau."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Đọc Bảng Số Liệu Ngang",
    "pts": 20,
    "question": "Cho bảng thống kê số học sinh yêu thích các môn thể thao của lớp 8B:<div class=\"quiz-table-wrap\"><table class=\"quiz-table\"><thead><tr><th>Môn</th><th>Bóng đá</th><th>Cầu lông</th><th>Bóng rổ</th><th>Bơi lội</th></tr></thead><tbody><tr><td>Số HS</td><td>16</td><td>10</td><td>8</td><td>6</td></tr></tbody></table></div>Môn thể thao nào được học sinh yêu thích nhiều nhất?",
    "options": [
      {
        "text": "Bóng đá",
        "correct": true
      },
      {
        "text": "Cầu lông",
        "correct": false
      },
      {
        "text": "Bóng rổ",
        "correct": false
      },
      {
        "text": "Bơi lội",
        "correct": false
      }
    ],
    "explanation": "Bóng đá có tần số cao nhất là 16 học sinh."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Tính Tỉ Lệ Phần Trăm",
    "pts": 20,
    "question": "Từ bảng số liệu câu 4 ở trên, tổng số học sinh lớp 8B là $40$ em. Tỉ lệ phần trăm học sinh yêu thích môn Bóng đá là:",
    "options": [
      {
        "text": "$40\\%$",
        "correct": true
      },
      {
        "text": "$16\\%$",
        "correct": false
      },
      {
        "text": "$25\\%$",
        "correct": false
      },
      {
        "text": "$50\\%$",
        "correct": false
      }
    ],
    "explanation": "Tỉ lệ phần trăm: $\\frac{16}{40} \\times 100\\% = 40\\%$."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Tính Góc Ở Tâm Biểu Đồ Tròn",
    "pts": 20,
    "question": "Một nhóm học sinh có tỉ lệ yêu thích môn Bơi lội chiếm $15\\%$. Khi biểu diễn trên biểu đồ hình quạt tròn, góc ở tâm tương ứng là:",
    "options": [
      {
        "text": "$54^{\\circ}$",
        "correct": true
      },
      {
        "text": "$15^{\\circ}$",
        "correct": false
      },
      {
        "text": "$36^{\\circ}$",
        "correct": false
      },
      {
        "text": "$72^{\\circ}$",
        "correct": false
      }
    ],
    "explanation": "Góc ở tâm bằng: $360^{\\circ} \\times \\frac{15}{100} = 54^{\\circ}$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Phát Hiện Lỗi Trong Biểu Đồ Tròn",
    "pts": 20,
    "question": "Một biểu đồ hình quạt tròn biểu diễn 4 thành phần có các tỉ lệ phần trăm ghi trên biểu đồ là: $35\\%, 25\\%, 20\\%, 10\\%$. Biểu đồ này có lỗi gì?",
    "options": [
      {
        "text": "Tổng các tỉ lệ chỉ bằng $90\\%$, chưa đủ $100\\%$",
        "correct": true
      },
      {
        "text": "Có quá nhiều thành phần",
        "correct": false
      },
      {
        "text": "Tỉ lệ phần trăm không được là số tròn chục",
        "correct": false
      },
      {
        "text": "Không thể dùng biểu đồ quạt tròn cho 4 thành phần",
        "correct": false
      }
    ],
    "explanation": "Tổng các tỉ lệ phần trăm trong biểu đồ tròn bắt buộc phải đúng bằng $100\\%$. Ở đây tổng là $35 + 25 + 20 + 10 = 90\\%$, thiếu $10\\%$."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Đọc Biểu Đồ Đoạn Thẳng",
    "pts": 20,
    "question": "Trong biểu đồ đoạn thẳng biểu diễn điểm kiểm tra 5 bài của Lan: Bài 1 (6), Bài 2 (7), Bài 3 (8), Bài 4 (8), Bài 5 (9). Nhận xét nào sau đây ĐÚNG về xu hướng học tập của Lan?",
    "options": [
      {
        "text": "Điểm số có xu hướng tăng dần theo thời gian",
        "correct": true
      },
      {
        "text": "Điểm số giảm liên tục",
        "correct": false
      },
      {
        "text": "Điểm số không thay đổi",
        "correct": false
      },
      {
        "text": "Điểm số biến động thất thường",
        "correct": false
      }
    ],
    "explanation": "Dãy điểm $6 \\to 7 \\to 8 \\to 8 \\to 9$ cho thấy phong độ học tập tiến bộ và tăng dần qua các bài kiểm tra."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Tính Tổng Số Liệu Từ Biểu Đồ Cột",
    "pts": 20,
    "question": "Biểu đồ cột biểu diễn số cuốn sách đọc được của 4 tổ: Tổ 1 (12), Tổ 2 (15), Tổ 3 (10), Tổ 4 (13). Tổng số cuốn sách cả 4 tổ đọc được là:",
    "options": [
      {
        "text": "$50$ cuốn",
        "correct": true
      },
      {
        "text": "$45$ cuốn",
        "correct": false
      },
      {
        "text": "$48$ cuốn",
        "correct": false
      },
      {
        "text": "$52$ cuốn",
        "correct": false
      }
    ],
    "explanation": "Tổng số sách: $12 + 15 + 10 + 13 = 50$ cuốn."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Chuyển Đổi Góc Ra Phần Trăm",
    "pts": 20,
    "question": "Trên một biểu đồ quạt tròn, một hình quạt có góc ở tâm bằng $90^{\\circ}$. Tỉ lệ phần trăm tương ứng của hình quạt đó là:",
    "options": [
      {
        "text": "$25\\%$",
        "correct": true
      },
      {
        "text": "$50\\%$",
        "correct": false
      },
      {
        "text": "$20\\%$",
        "correct": false
      },
      {
        "text": "$30\\%$",
        "correct": false
      }
    ],
    "explanation": "Tỉ lệ phần trăm: $\\frac{90^{\\circ}}{360^{\\circ}} \\times 100\\% = \\frac{1}{4} \\times 100\\% = 25\\%$."
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
                const btnBar = document.getElementById('btnShowBar');
                const btnPie = document.getElementById('btnShowPie');
                const outEl = document.getElementById('lab1Output');
                let mode = 'bar';

                const data = [
                    { name: 'Ngủ', val: 8, pct: 33.3, col: '#6366f1' },
                    { name: 'Học', val: 6, pct: 25.0, col: '#06b6d4' },
                    { name: 'Giải trí', val: 4, pct: 16.7, col: '#f59e0b' },
                    { name: 'Sinh hoạt khác', val: 6, pct: 25.0, col: '#10b981' }
                ];

                function render() {
                    outEl.innerHTML = `<strong>Dữ liệu thời gian biểu (Tổng 24h):</strong> Ngủ: 8h (33.3%), Học: 6h (25%), Giải trí: 4h (16.7%), Khác: 6h (25%).`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    if (mode === 'bar') {
                        ctx.fillStyle = '#818cf8';
                        ctx.font = 'bold 15px Segoe UI';
                        ctx.fillText('BIỂU ĐỒ CỘT: SO SÁNH SỐ GIỜ CÁC HOẠT ĐỘNG', 30, 30);

                        data.forEach((d, i) => {
                            const x = 60 + i * 120;
                            const barH = d.val * 12;
                            ctx.fillStyle = d.col;
                            ctx.fillRect(x, 170 - barH, 70, barH);

                            ctx.fillStyle = '#fff';
                            ctx.font = 'bold 13px Segoe UI';
                            ctx.fillText(`${d.val}h`, x + 25, 160 - barH);
                            ctx.fillText(d.name, x + 15, 190);
                        });
                    } else {
                        ctx.fillStyle = '#06b6d4';
                        ctx.font = 'bold 15px Segoe UI';
                        ctx.fillText('BIỂU ĐỒ HÌNH QUẠT TRÒN: CƠ CẤU THỜI GIAN TRONG NGÀY (100%)', 30, 30);

                        const cx = w / 2 - 80;
                        const cy = 115;
                        const R = 75;
                        let startAng = -Math.PI / 2;

                        data.forEach(d => {
                            const sliceAng = (d.pct / 100) * Math.PI * 2;
                            ctx.fillStyle = d.col;
                            ctx.beginPath();
                            ctx.moveTo(cx, cy);
                            ctx.arc(cx, cy, R, startAng, startAng + sliceAng);
                            ctx.closePath();
                            ctx.fill();
                            startAng += sliceAng;
                        });

                        // Chu giai
                        data.forEach((d, i) => {
                            const y = 60 + i * 28;
                            ctx.fillStyle = d.col;
                            ctx.fillRect(w - 200, y, 16, 16);
                            ctx.fillStyle = '#cbd5e1';
                            ctx.font = '13px Segoe UI';
                            ctx.fillText(`${d.name}: ${d.pct}%`, w - 175, y + 13);
                        });
                    }
                }

                btnBar.addEventListener('click', () => { mode = 'bar'; render(); });
                btnPie.addEventListener('click', () => { mode = 'pie'; render(); });
                render();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const btn = document.getElementById('btnGenTemp');
                const outEl = document.getElementById('lab2Output');

                let temps = [24, 26, 29, 27, 31];
                const days = ['Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6'];

                function render() {
                    outEl.innerHTML = `<strong>Nhiệt độ các ngày:</strong> ${days.map((d, i) => `${d}: ${temps[i]}°C`).join(', ')}`;

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#f59e0b';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('BIỂU ĐỒ ĐOẠN THẲNG: XU HƯỚNG NHIỆT ĐỘ TRONG TUẦN', 30, 30);

                    // Truc toa do
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(60, 45); ctx.lineTo(60, 170); ctx.lineTo(w - 40, 170);
                    ctx.stroke();

                    // Cac diem va duong noi
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 3;
                    ctx.beginPath();

                    const pts = temps.map((t, i) => {
                        const px = 100 + i * 95;
                        const py = 170 - (t - 20) * 10;
                        return { x: px, y: py, t: t, day: days[i] };
                    });

                    ctx.moveTo(pts[0].x, pts[0].y);
                    for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
                    ctx.stroke();

                    pts.forEach(p => {
                        ctx.fillStyle = '#06b6d4';
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                        ctx.fill();

                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 13px Segoe UI';
                        ctx.fillText(`${p.t}°C`, p.x - 12, p.y - 10);
                        ctx.fillText(p.day, p.x - 15, 190);
                    });
                }

                btn.addEventListener('click', () => {
                    temps = temps.map(() => Math.floor(Math.random() * 12) + 22);
                    render();
                });
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
