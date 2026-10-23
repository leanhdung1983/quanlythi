// ================================================================
// BÀI 18: THU THẬP VÀ PHÂN LOẠI DỮ LIỆU - TOÁN 8 KNTT
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
  userTitle: 'Nhà Phân Tích Dữ Liệu 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai18_state';

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
    "title": "Thử Thách 1: Nhận Diện Dữ Liệu Định Tính",
    "pts": 20,
    "question": "Dữ liệu nào sau đây là dữ liệu định tính?",
    "options": [
      {
        "text": "Màu sắc yêu thích của các bạn trong lớp",
        "correct": true
      },
      {
        "text": "Số điểm 10 môn Toán của học sinh",
        "correct": false
      },
      {
        "text": "Chiều cao trung bình của học sinh",
        "correct": false
      },
      {
        "text": "Cân nặng của các bạn trong tổ",
        "correct": false
      }
    ],
    "explanation": "Dữ liệu định tính là dữ liệu dưới dạng chữ hoặc danh mục, không biểu thị số lượng đo lường. Màu sắc là dữ liệu định tính."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Dữ Liệu Định Tính Sắp Thứ Tự Được",
    "pts": 20,
    "question": "Dữ liệu định tính nào sau đây CÓ THỂ sắp thứ tự được?",
    "options": [
      {
        "text": "Mức độ hài lòng: Rất hài lòng, Hài lòng, Bình thường, Không hài lòng",
        "correct": true
      },
      {
        "text": "Nơi sinh: Hà Nội, Đà Nẵng, TP. Hồ Chí Minh",
        "correct": false
      },
      {
        "text": "Môn thể thao: Bóng đá, Cầu lông, Bơi lội",
        "correct": false
      },
      {
        "text": "Món ăn yêu thích: Phở, Bún chả, Bánh mì",
        "correct": false
      }
    ],
    "explanation": "Mức độ hài lòng có sự phân cấp từ cao xuống thấp nên là dữ liệu định tính có thể sắp thứ tự."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Dữ Liệu Định Lượng Rời Rạc",
    "pts": 20,
    "question": "Dữ liệu nào sau đây là số liệu rời rạc?",
    "options": [
      {
        "text": "Số lượng thành viên trong mỗi gia đình",
        "correct": true
      },
      {
        "text": "Nhiệt độ ngoài trời lúc 12 giờ trưa",
        "correct": false
      },
      {
        "text": "Thời gian chạy 100m của học sinh",
        "correct": false
      },
      {
        "text": "Cân nặng của các quả bưởi thu hoạch",
        "correct": false
      }
    ],
    "explanation": "Số lượng thành viên là số đếm nguyên dương nên là số liệu rời rạc. Nhiệt độ, thời gian, cân nặng là các đại lượng đo lường liên tục."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Dữ Liệu Định Lượng Liên Tục",
    "pts": 20,
    "question": "Dữ liệu nào sau đây là số liệu liên tục?",
    "options": [
      {
        "text": "Chiều dài quãng đường đi bộ của học sinh",
        "correct": true
      },
      {
        "text": "Số bàn thắng trong một trận đấu",
        "correct": false
      },
      {
        "text": "Số học sinh vắng mặt trong tuần",
        "correct": false
      },
      {
        "text": "Số quyển sách trong thư viện",
        "correct": false
      }
    ],
    "explanation": "Chiều dài quãng đường là đại lượng đo lường có thể nhận giá trị thập phân bất kì nên là số liệu liên tục."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Phương Pháp Thu Thập Trực Tiếp",
    "pts": 20,
    "question": "Phương pháp nào sau đây là phương pháp thu thập dữ liệu trực tiếp?",
    "options": [
      {
        "text": "Phát phiếu hỏi và phỏng vấn học sinh trong trường",
        "correct": true
      },
      {
        "text": "Tra cứu số liệu dân số trên website Tổng cục Thống kê",
        "correct": false
      },
      {
        "text": "Đọc số liệu lượng mưa trong sách địa lí",
        "correct": false
      },
      {
        "text": "Tìm kiếm thông tin trên công cụ Google",
        "correct": false
      }
    ],
    "explanation": "Phát phiếu hỏi và phỏng vấn là người nghiên cứu tự mình tiến hành đo đạc/ghi nhận trực tiếp từ đối tượng."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Phát Hiện Dữ Liệu Không Hợp Lí",
    "pts": 20,
    "question": "Điều tra về số con của 5 hộ gia đình, thu được dãy số liệu: $2;\\, 1;\\, -1;\\, 3;\\, 2$. Giá trị không hợp lí là:",
    "options": [
      {
        "text": "$-1$",
        "correct": true
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      }
    ],
    "explanation": "Số con của một hộ gia đình phải là số tự nhiên không âm ($0, 1, 2, ...$), không thể là số âm $-1$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Phát Hiện Dữ Liệu Vô Lí Trong Đánh Giá Điểm",
    "pts": 20,
    "question": "Điểm kiểm tra môn Toán của 5 bạn học sinh ghi lại là: $8;\\, 9;\\, 10;\\, 12;\\, 7$. Điểm số không hợp lí là:",
    "options": [
      {
        "text": "$12$",
        "correct": true
      },
      {
        "text": "$10$",
        "correct": false
      },
      {
        "text": "$8$",
        "correct": false
      },
      {
        "text": "$7$",
        "correct": false
      }
    ],
    "explanation": "Thang điểm kiểm tra chuẩn bậc phổ thông tại Việt Nam tối đa là 10 điểm, điểm số 12 là không hợp lí."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Tính Đại Diện Của Mẫu Khảo Sát",
    "pts": 20,
    "question": "Để khảo sát món ăn sáng yêu thích của toàn bộ học sinh trường THCS, bạn An chỉ khảo sát 20 bạn học sinh nam lớp 8A. Mẫu khảo sát của An có tính đại diện không?",
    "options": [
      {
        "text": "Không có tính đại diện, vì chỉ khảo sát học sinh nam trong một lớp, thiếu tính đa dạng toàn trường",
        "correct": true
      },
      {
        "text": "Có tính đại diện vì 20 bạn là đủ lớn",
        "correct": false
      },
      {
        "text": "Có tính đại diện vì lớp 8A học giỏi",
        "correct": false
      },
      {
        "text": "Có tính đại diện vì học sinh nam ăn nhiều",
        "correct": false
      }
    ],
    "explanation": "Mẫu khảo sát muốn đại diện cho toàn trường cần chọn ngẫu nhiên cả nam và nữ ở tất cả các khối lớp (6, 7, 8, 9)."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Phân Loại Dữ Liệu Bằng Bảng",
    "pts": 20,
    "question": "Cho bảng số liệu ghi nhận kích cỡ áo thun của một nhóm học sinh: S, M, L, XL, M, L, S. Đây là loại dữ liệu gì?",
    "options": [
      {
        "text": "Dữ liệu định tính có thể sắp thứ tự",
        "correct": true
      },
      {
        "text": "Dữ liệu định tính không thể sắp thứ tự",
        "correct": false
      },
      {
        "text": "Dữ liệu định lượng rời rạc",
        "correct": false
      },
      {
        "text": "Dữ liệu định lượng liên tục",
        "correct": false
      }
    ],
    "explanation": "Cỡ áo là chữ nhưng có thứ tự kích thước: $S < M < L < XL$ nên là dữ liệu định tính có thể sắp thứ tự."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Rà Soát Tỉ Lệ Phần Trăm",
    "pts": 20,
    "question": "Báo cáo tỉ lệ phần trăm phương tiện đến trường của học sinh gồm: Xe đạp $50\\%$, Xe buýt $30\\%$, Đi bộ $25\\%$, Xe máy bố mẹ chở $15\\%$. Báo cáo này có hợp lí không?",
    "options": [
      {
        "text": "Không hợp lí, vì tổng các tỉ lệ bằng $120\\% > 100\\%$",
        "correct": true
      },
      {
        "text": "Hợp lí vì tỉ lệ đi xe đạp cao nhất",
        "correct": false
      },
      {
        "text": "Hợp lí vì các số liệu đều dương",
        "correct": false
      },
      {
        "text": "Hợp lí vì đã tính hết các phương tiện",
        "correct": false
      }
    ],
    "explanation": "Tổng tỉ lệ phần trăm của các thành phần trong toàn thể không thể vượt quá $100\\%$. Ở đây tổng là $50 + 30 + 25 + 15 = 120\\% > 100\\%$ nên số liệu không hợp lí."
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

                const dataTypes = [
                    { name: 'MÀU SẮC YÊU THÍCH', cat: 'Dữ liệu Định Tính (Không thể sắp thứ tự)', val: 'Đỏ, Xanh, Vàng...', col: '#6366f1' },
                    { name: 'CHIỀU CAO HỌC SINH (cm)', cat: 'Dữ liệu Định Lượng (Số liên tục - đo đạc)', val: '155.5 cm, 162.3 cm...', col: '#06b6d4' },
                    { name: 'XẾP LOẠI HỌC LỰC', cat: 'Dữ liệu Định Tính (Có thể sắp thứ tự)', val: 'Xuất sắc > Giỏi > Khá > Đạt', col: '#f59e0b' },
                    { name: 'SỐ CON TRONG GIA ĐÌNH', cat: 'Dữ liệu Định Lượng (Số rời rạc - đếm được)', val: '1 con, 2 con, 3 con...', col: '#ec4899' }
                ];

                function showCat(i) {
                    const item = dataTypes[i];
                    outEl.innerHTML = `<strong>Dữ liệu:</strong> <span style="color:${item.col}; font-weight:700;">${item.name}</span><br><strong>Phân loại chuẩn:</strong> ${item.cat}<br><strong>Ví dụ:</strong> ${item.val}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = item.col;
                    ctx.fillRect(40, 50, w - 80, 80);

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 16px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(item.name, w / 2, 75);
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText(item.cat, w / 2, 105);
                    ctx.textAlign = 'left';
                }

                document.getElementById('btnDl1').addEventListener('click', () => showCat(0));
                document.getElementById('btnDl2').addEventListener('click', () => showCat(1));
                document.getElementById('btnDl3').addEventListener('click', () => showCat(2));
                document.getElementById('btnDl4').addEventListener('click', () => showCat(3));
                showCat(1);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const btn = document.getElementById('btnCheckValid');
                const outEl = document.getElementById('lab2Output');

                function render() {
                    outEl.innerHTML = `
                        <strong>Dãy số liệu:</strong> $1{,}52;\\, 1{,}60;\\, \\mathbf{2{,}85};\\, 1{,}58;\\, \\mathbf{-1{,}2}$<br>
                        <strong>Kết quả rà soát:</strong> Có 2 dữ liệu KHÔNG HỢP LÍ:<br>
                        - Giá trị $\\mathbf{2{,}85}$ m: Quá cao đối với học sinh lớp 8 (vượt ngưỡng thực tế).<br>
                        - Giá trị $\\mathbf{-1{,}2}$ m: Chiều cao không thể mang số âm.
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const vals = [
                        { v: '1.52 m', ok: true },
                        { v: '1.60 m', ok: true },
                        { v: '2.85 m', ok: false },
                        { v: '1.58 m', ok: true },
                        { v: '-1.2 m', ok: false }
                    ];

                    vals.forEach((item, idx) => {
                        const x = 40 + idx * 105;
                        ctx.fillStyle = item.ok ? '#10b981' : '#f43f5e';
                        ctx.fillRect(x, 70, 95, 60);

                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 14px Segoe UI';
                        ctx.textAlign = 'center';
                        ctx.fillText(item.v, x + 47, 98);
                        ctx.font = '12px Segoe UI';
                        ctx.fillText(item.ok ? '✔ Hợp lí' : '✘ Vô lí', x + 47, 118);
                    });
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
