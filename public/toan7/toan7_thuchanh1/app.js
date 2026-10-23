// ================================================================
// VẼ HÌNH ĐƠN GIẢN VỚI PHẦN MỀM GEOGEBRA - TOÁN 7 KNTT
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
  userTitle: 'Kỹ Sư Hình Học GeoGebra',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_thuchanh1_state';

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
    "title": "Câu 1: Bản chất của hình học động",
    "pts": 20,
    "question": "Tính năng nổi bật nhất của phần mềm hình học động GeoGebra so với vẽ hình trên giấy là:",
    "options": [
      {
        "text": "Khi kéo rê một điểm tự do, các quan hệ hình học phụ thuộc vẫn được bảo toàn nguyên vẹn",
        "correct": true
      },
      {
        "text": "Hình vẽ trên GeoGebra không thể xóa được",
        "correct": false
      },
      {
        "text": "Chỉ vẽ được các hình tròn",
        "correct": false
      },
      {
        "text": "Không cần sử dụng chuột hay bàn phím",
        "correct": false
      }
    ],
    "explanation": "Khái niệm 'hình học động': Điểm tự do có thể chuyển động, kéo theo toàn bộ hình vẽ biến dạng nhưng các quan hệ hình học (song song, vuông góc, trung điểm) vẫn được giữ vững."
  },
  {
    "id": 2,
    "title": "Câu 2: Công cụ vẽ đường song song",
    "pts": 20,
    "question": "Để dựng một đường thẳng đi qua điểm $A$ và song song với đường thẳng $d$ trong GeoGebra, ta cần thực hiện thao tác nào?",
    "options": [
      {
        "text": "Chọn công cụ 'Đường song song' (Parallel Line), nhấp vào điểm $A$ rồi nhấp vào đường thẳng $d$",
        "correct": true
      },
      {
        "text": "Dùng công cụ vẽ đoạn thẳng rồi ước lượng bằng mắt",
        "correct": false
      },
      {
        "text": "Chọn công cụ 'Đường tròn'",
        "correct": false
      },
      {
        "text": "Nhấp đúp chuột vào điểm $A$",
        "correct": false
      }
    ],
    "explanation": "Quy trình chuẩn: Chọn công cụ Parallel Line $\\\\to$ nhấp chọn điểm đi qua $\\\\to$ nhấp chọn đường thẳng song song."
  },
  {
    "id": 3,
    "title": "Câu 3: Dựng đường trung trực trong GeoGebra",
    "pts": 20,
    "question": "Công cụ 'Đường trung trực' (Perpendicular Bisector) trong GeoGebra yêu cầu người dùng nhấp chọn đối tượng nào?",
    "options": [
      {
        "text": "Hai điểm đầu mút của đoạn thẳng (hoặc chọn trực tiếp đoạn thẳng đó)",
        "correct": true
      },
      {
        "text": "Một góc và một đỉnh",
        "correct": false
      },
      {
        "text": "Ba điểm bất kì không thẳng hàng",
        "correct": false
      },
      {
        "text": "Một đường tròn và một điểm",
        "correct": false
      }
    ],
    "explanation": "Đường trung trực của đoạn thẳng được xác định bởi hai đầu mút của đoạn thẳng đó, nên ta chỉ cần nhấp chọn hai điểm $A, B$ (hoặc nhấp vào đoạn thẳng $AB$)."
  },
  {
    "id": 4,
    "title": "Câu 4: Công cụ đo góc",
    "pts": 20,
    "question": "Muốn đo số đo của góc $\\\\widehat{ABC}$ trong GeoGebra, ta dùng công cụ 'Góc' (Angle) và nhấp chuột theo thứ tự nào?",
    "options": [
      {
        "text": "Nhấp lần lượt theo thứ tự: Điểm $A$, đỉnh $B$, rồi điểm $C$",
        "correct": true
      },
      {
        "text": "Chỉ cần nhấp vào đỉnh $B$",
        "correct": false
      },
      {
        "text": "Nhấp điểm $B$ trước, rồi đến $A$ và $C$",
        "correct": false
      },
      {
        "text": "Nhấp vào bất kì điểm nào ngoài tam giác",
        "correct": false
      }
    ],
    "explanation": "Quy ước đo góc: Nhấp lần lượt 3 điểm theo chiều kim đồng hồ hoặc ngược chiều kim đồng hồ, trong đó đỉnh góc ($B$) bắt buộc phải nằm ở giữa."
  },
  {
    "id": 5,
    "title": "Câu 5: Dựng tam giác đều trong GeoGebra",
    "pts": 20,
    "question": "Để dựng một tam giác đều trong GeoGebra một cách nhanh nhất, ta dùng công cụ nào?",
    "options": [
      {
        "text": "Đa giác đều (Regular Polygon) với số đỉnh nhập là 3",
        "correct": true
      },
      {
        "text": "Đa giác tự do (Polygon)",
        "correct": false
      },
      {
        "text": "Đoạn thẳng có độ dài cố định",
        "correct": false
      },
      {
        "text": "Đường vuông góc",
        "correct": false
      }
    ],
    "explanation": "Công cụ Regular Polygon cho phép tạo đa giác đều với số đỉnh tùy ý. Nhập số đỉnh bằng 3 sẽ sinh ra một tam giác đều hoàn hảo."
  },
  {
    "id": 6,
    "title": "Câu 6: Kiểm chứng điểm trên trung trực",
    "pts": 20,
    "question": "Dựng đường trung trực $d$ của đoạn $AB$. Lấy điểm $M$ trên $d$. Dùng công cụ 'Khoảng cách' đo $MA$ và $MB$. Khi kéo rê điểm $M$ dọc theo $d$, kết quả đo đạc sẽ là:",
    "options": [
      {
        "text": "Khoảng cách $MA$ và $MB$ luôn luôn bằng nhau tại mọi vị trí",
        "correct": true
      },
      {
        "text": "$MA$ luôn lớn hơn $MB$",
        "correct": false
      },
      {
        "text": "$MA$ luôn nhỏ hơn $MB$",
        "correct": false
      },
      {
        "text": "Lúc bằng nhau, lúc không bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Thực nghiệm kiểm chứng tính chất đường trung trực: Mọi điểm thuộc đường trung trực luôn cách đều hai đầu mút đoạn thẳng."
  },
  {
    "id": 7,
    "title": "Câu 7: Giao điểm hai đối tượng",
    "pts": 20,
    "question": "Công cụ 'Giao điểm của hai đối tượng' (Intersect) có tác dụng gì?",
    "options": [
      {
        "text": "Tự động xác định chính xác tọa độ điểm cắt nhau của hai đường thẳng hoặc đường tròn",
        "correct": true
      },
      {
        "text": "Nối hai đường thẳng lại thành một",
        "correct": false
      },
      {
        "text": "Tô màu cho mặt phẳng",
        "correct": false
      },
      {
        "text": "Xóa hai đường thẳng",
        "correct": false
      }
    ],
    "explanation": "Công cụ Intersect dùng để bắt điểm giao nhau chính xác tuyệt đối mà không sợ bị lệch do mắt nhìn."
  },
  {
    "id": 8,
    "title": "Câu 8: Tia phân giác trong GeoGebra",
    "pts": 20,
    "question": "Công cụ 'Đường phân giác' (Angle Bisector) trong GeoGebra giúp dựng:",
    "options": [
      {
        "text": "Đường phân giác chia đôi một góc thành hai góc bằng nhau",
        "correct": true
      },
      {
        "text": "Đường thẳng vuông góc với một cạnh",
        "correct": false
      },
      {
        "text": "Đường tròn đi qua 3 điểm",
        "correct": false
      },
      {
        "text": "Đường trung tuyến của tam giác",
        "correct": false
      }
    ],
    "explanation": "Angle Bisector tự động sinh ra đường phân giác của góc được chỉ định."
  },
  {
    "id": 9,
    "title": "Câu 9: Xuất hình vẽ từ GeoGebra",
    "pts": 20,
    "question": "Sau khi dựng hình xong trong GeoGebra, học sinh có thể xuất hình ảnh ra định dạng nào để chèn vào bài thuyết trình Word/PowerPoint?",
    "options": [
      {
        "text": "PNG, PDF hoặc SVG",
        "correct": true
      },
      {
        "text": "Chỉ xem được, không thể xuất",
        "correct": false
      },
      {
        "text": "Chỉ xuất ra file MP3 âm thanh",
        "correct": false
      },
      {
        "text": "File video MP4",
        "correct": false
      }
    ],
    "explanation": "GeoGebra hỗ trợ xuất hình ảnh chất lượng cao dạng PNG, PDF hoặc vector SVG để in ấn và làm bài thuyết trình."
  },
  {
    "id": 10,
    "title": "Câu 10: Ý nghĩa giáo dục của GeoGebra",
    "pts": 20,
    "question": "Việc học hình học kết hợp với phần mềm GeoGebra mang lại lợi ích gì lớn nhất cho học sinh?",
    "options": [
      {
        "text": "Tự mình làm thí nghiệm toán học, khám phá và kiểm chứng định lí một cách trực quan, hứng thú",
        "correct": true
      },
      {
        "text": "Không cần phải học lí thuyết nữa",
        "correct": false
      },
      {
        "text": "Máy tính sẽ làm bài kiểm tra hộ",
        "correct": false
      },
      {
        "text": "Không cần dùng đến tư duy suy luận",
        "correct": false
      }
    ],
    "explanation": "GeoGebra biến người học thành nhà khám phá toán học: Trực quan hóa hình học, phát triển tư duy công nghệ và củng cố vững chắc suy luận logic."
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
                let ax = 180, ay = 50;
                const bx = 80, by = 180;
                const cx = 320, cy = 180;

                function drawGeo() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    // Luoi toa do nhe kieu GeoGebra
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; ctx.lineWidth = 1;
                    for (let x = 0; x < w; x += 30) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke(); }
                    for (let y = 0; y < h; y += 30) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke(); }

                    // Tam giac ABC
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
                    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();

                    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath(); ctx.stroke();

                    // Duong song song voi BC di qua A
                    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
                    ctx.beginPath(); ctx.moveTo(20, ay); ctx.lineTo(w - 20, ay); ctx.stroke();

                    // Duong cao AH vuong goc BC tai H
                    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(ax, by); ctx.stroke();
                    ctx.strokeRect(ax, by - 12, 12, 12);

                    // Duong trung truc d cua BC tai M
                    const mx = (bx + cx) / 2;
                    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2; ctx.setLineDash([4, 3]);
                    ctx.beginPath(); ctx.moveTo(mx, 20); ctx.lineTo(mx, h - 20); ctx.stroke();
                    ctx.setLineDash([]);

                    // Dinh
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath(); ctx.arc(ax, ay, 6, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(cx, cy, 5, 0, Math.PI * 2); ctx.fill();

                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText('A (đỉnh động)', ax - 35, ay - 10);
                    ctx.fillText('B (80, 180)', bx - 25, by + 18);
                    ctx.fillText('C (320, 180)', cx + 5, cy + 18);
                    ctx.fillStyle = '#06b6d4'; ctx.fillText('Đường d // BC', w - 120, ay - 6);
                    ctx.fillStyle = '#10b981'; ctx.fillText('Trung trực BC', mx + 6, 35);
                    ctx.fillStyle = '#f43f5e'; ctx.fillText('H', ax + 4, by + 16);

                    const out = document.getElementById('lab1GeoOut');
                    out.innerHTML = `Đỉnh $A(${ax}, ${ay})$ di động tự do. Đường thẳng song song qua $A$ luôn giữ phương nằm ngang song song $BC$; đường cao $AH \\perp BC$ và đường trung trực tại trung điểm $M(200, 180)$ tự động thích ứng!`;
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 220 * window.devicePixelRatio || 220;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawGeo();
                }

                document.getElementById('sliderGeoX').addEventListener('input', e => {
                    ax = parseInt(e.target.value);
                    document.getElementById('valGeoX').textContent = `${ax} px`;
                    drawGeo();
                });
                document.getElementById('sliderGeoY').addEventListener('input', e => {
                    ay = parseInt(e.target.value);
                    document.getElementById('valGeoY').textContent = `${ay} px`;
                    drawGeo();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let angB = 55;

                function drawMeasure() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const angC = 65;
                    const angA = 180 - (angB + angC);

                    const bx = 80, by = h * 0.78;
                    const base = Math.min(w * 0.6, 280);
                    const cx = bx + base, cy = by;

                    const radB = angB * Math.PI / 180;
                    const radC = angC * Math.PI / 180;
                    const radA = angA * Math.PI / 180;
                    const sideC = base * Math.sin(radC) / Math.sin(radA);
                    const ax = bx + sideC * Math.cos(radB);
                    const ay = by - sideC * Math.sin(radB);

                    // Tam giac ABC
                    ctx2.fillStyle = 'rgba(6, 182, 212, 0.15)';
                    ctx2.beginPath(); ctx2.moveTo(ax, ay); ctx2.lineTo(bx, by); ctx2.lineTo(cx, cy); ctx2.closePath(); ctx2.fill();
                    ctx2.strokeStyle = '#06b6d4'; ctx2.lineWidth = 3; ctx2.stroke();

                    // Cung 3 goc
                    ctx2.strokeStyle = '#f59e0b'; ctx2.lineWidth = 2;
                    ctx2.beginPath(); ctx2.arc(bx, by, 30, -radB, 0); ctx2.stroke();

                    ctx2.strokeStyle = '#10b981';
                    ctx2.beginPath(); ctx2.arc(cx, cy, 30, Math.PI, Math.PI + radC); ctx2.stroke();

                    // Nhan goc
                    ctx2.fillStyle = '#ffffff'; ctx2.font = 'bold 12px Segoe UI';
                    ctx2.fillText(`A = ${angA}°`, ax - 15, ay - 10);
                    ctx2.fillText(`B = ${angB}°`, bx - 25, by + 18);
                    ctx2.fillText(`C = ${angC}°`, cx + 8, cy + 18);

                    const out = document.getElementById('lab2GeoMeasureOut');
                    out.innerHTML = `Công cụ đo góc GeoGebra: $\\widehat{A} = ${angA}^\\circ$, $\\widehat{B} = ${angB}^\\circ$, $\\widehat{C} = ${angC}^\\circ$. Tổng đo đạc: $\\widehat{A} + \\widehat{B} + \\widehat{C} = ${angA + angB + angC}^\\circ$ (định lí bảo toàn 100%).`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 200 * window.devicePixelRatio || 200;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawMeasure();
                }

                document.getElementById('sliderGB').addEventListener('input', e => {
                    angB = parseInt(e.target.value);
                    document.getElementById('valGB').textContent = `${angB}°`;
                    drawMeasure();
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
