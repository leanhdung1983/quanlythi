// ================================================================
// HĐTN 7: TÍNH TOÁN & ĐỒ THỊ VỚI GEOGEBRA - TOÁN 8 KNTT
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
  userTitle: 'Chuyên Gia GeoGebra Số 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_thuchanh7_state';

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
    "title": "Câu 1: Lệnh phân tích nhân tử trong GeoGebra",
    "pts": 20,
    "question": "Để phân tích đa thức thành nhân tử trong cửa sổ CAS của GeoGebra, ta dùng lệnh nào?",
    "options": [
      {
        "text": "Factor",
        "correct": true
      },
      {
        "text": "Simplify",
        "correct": false
      },
      {
        "text": "Expand",
        "correct": false
      },
      {
        "text": "Solve",
        "correct": false
      }
    ],
    "explanation": "Lệnh `Factor[đa thức]` dùng để phân tích đa thức thành nhân tử trong GeoGebra."
  },
  {
    "id": 2,
    "title": "Câu 2: Lệnh rút gọn biểu thức",
    "pts": 20,
    "question": "Lệnh nào trong GeoGebra được dùng để rút gọn một phân thức đại số?",
    "options": [
      {
        "text": "Simplify",
        "correct": true
      },
      {
        "text": "Factor",
        "correct": false
      },
      {
        "text": "Root",
        "correct": false
      },
      {
        "text": "Intersect",
        "correct": false
      }
    ],
    "explanation": "Lệnh `Simplify[biểu thức]` thực hiện rút gọn biểu thức đại số về dạng tối giản."
  },
  {
    "id": 3,
    "title": "Câu 3: Công cụ tạo biến số trượt Slider",
    "pts": 20,
    "question": "Công cụ 'Thanh trượt' (Slider) trong GeoGebra có tác dụng gì?",
    "options": [
      {
        "text": "Thay đổi liên tục giá trị của một tham số để quan sát hình động",
        "correct": true
      },
      {
        "text": "Đổi màu nền của bản vẽ",
        "correct": false
      },
      {
        "text": "Chụp ảnh màn hình",
        "correct": false
      },
      {
        "text": "In tài liệu",
        "correct": false
      }
    ],
    "explanation": "Slider cho phép thay đổi giá trị của các hệ số như $a, b$ trong hàm $y = ax + b$ để quan sát chuyển động của đồ thị."
  },
  {
    "id": 4,
    "title": "Câu 4: Cú pháp nhập lũy thừa trong GeoGebra",
    "pts": 20,
    "question": "Để nhập biểu thức $x^3$ vào thanh dòng lệnh của GeoGebra, ta gõ:",
    "options": [
      {
        "text": "x^3",
        "correct": true
      },
      {
        "text": "x3",
        "correct": false
      },
      {
        "text": "x**3",
        "correct": false
      },
      {
        "text": "pow(x, 3)",
        "correct": false
      }
    ],
    "explanation": "Trong GeoGebra, dấu mũ `^` được dùng để biểu thị phép nâng lên lũy thừa (ví dụ `x^3`)."
  },
  {
    "id": 5,
    "title": "Câu 5: Tìm giao điểm của hai đồ thị",
    "pts": 20,
    "question": "Công cụ nào trong GeoGebra dùng để xác định tọa độ giao điểm của hai đường thẳng?",
    "options": [
      {
        "text": "Intersect (Giao điểm của hai đối tượng)",
        "correct": true
      },
      {
        "text": "Midpoint (Trung điểm)",
        "correct": false
      },
      {
        "text": "Point (Điểm mới)",
        "correct": false
      },
      {
        "text": "Parallel Line (Đường song song)",
        "correct": false
      }
    ],
    "explanation": "Công cụ `Intersect` tự động tìm tọa độ giao điểm của hai đối tượng hình học."
  },
  {
    "id": 6,
    "title": "Câu 6: Lệnh khai triển biểu thức",
    "pts": 20,
    "question": "Lệnh `Expand[(x + 1)^2]` trong GeoGebra cho kết quả là:",
    "options": [
      {
        "text": "x^2 + 2x + 1",
        "correct": true
      },
      {
        "text": "(x + 1)(x + 1)",
        "correct": false
      },
      {
        "text": "x^2 + 1",
        "correct": false
      },
      {
        "text": "x + 1",
        "correct": false
      }
    ],
    "explanation": "`Expand` thực hiện khai triển và nhân bung các dấu ngoặc."
  },
  {
    "id": 7,
    "title": "Câu 7: Dấu phân cách thập phân trong GeoGebra",
    "pts": 20,
    "question": "Trong GeoGebra, dấu nào được sử dụng làm dấu ngăn cách phần thập phân?",
    "options": [
      {
        "text": "Dấu chấm (.)",
        "correct": true
      },
      {
        "text": "Dấu phẩy (,)",
        "correct": false
      },
      {
        "text": "Dấu chấm phẩy (;)",
        "correct": false
      },
      {
        "text": "Dấu hai chấm (:)",
        "correct": false
      }
    ],
    "explanation": "GeoGebra tuân theo chuẩn quốc tế: Dấu chấm `.` dùng cho số thập phân (ví dụ `2.5`), dấu phẩy `,` dùng để phân cách tọa độ hoặc các đối số."
  },
  {
    "id": 8,
    "title": "Câu 8: Cửa sổ CAS viết tắt của từ gì",
    "pts": 20,
    "question": "Từ viết tắt 'CAS' trong phần mềm toán học có nghĩa là gì?",
    "options": [
      {
        "text": "Computer Algebra System (Hệ thống đại số máy tính)",
        "correct": true
      },
      {
        "text": "Calculator And Software",
        "correct": false
      },
      {
        "text": "Computer Arithmetic Standard",
        "correct": false
      },
      {
        "text": "Creative Art System",
        "correct": false
      }
    ],
    "explanation": "CAS là viết tắt của Computer Algebra System - hệ thống tính toán ký hiệu đại số trên máy tính."
  },
  {
    "id": 9,
    "title": "Câu 9: Lệnh giải phương trình Solve",
    "pts": 20,
    "question": "Lệnh `Solve[2x - 6 = 0]` trong GeoGebra trả về kết quả nào?",
    "options": [
      {
        "text": "{x = 3}",
        "correct": true
      },
      {
        "text": "{x = -3}",
        "correct": false
      },
      {
        "text": "6",
        "correct": false
      },
      {
        "text": "0",
        "correct": false
      }
    ],
    "explanation": "`Solve[phương trình]` tìm tập nghiệm của phương trình, trả về `{x = 3}`."
  },
  {
    "id": 10,
    "title": "Câu 10: Vẽ đường thẳng đi qua hai điểm",
    "pts": 20,
    "question": "Để vẽ một đường thẳng đi qua hai điểm A và B trong GeoGebra, ta chọn công cụ:",
    "options": [
      {
        "text": "Line (Đường thẳng)",
        "correct": true
      },
      {
        "text": "Segment (Đoạn thẳng)",
        "correct": false
      },
      {
        "text": "Ray (Tia)",
        "correct": false
      },
      {
        "text": "Vector (Vectơ)",
        "correct": false
      }
    ],
    "explanation": "Công cụ `Line` (Đường thẳng) cho phép chọn hai điểm để vẽ đường thẳng vô hạn đi qua hai điểm đó."
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
                const outEl = document.getElementById('lab1OutputTH7');

                const casData = {
                    1: { cmd: "Factor[x^2 - 4]", res: "(x - 2)(x + 2)", desc: "Phân tích đa thức thành nhân tử theo hằng đẳng thức số 3." },
                    2: { cmd: "Simplify[(x^2 - 1) / (x - 1)]", res: "x + 1", desc: "Rút gọn phân thức đại số về dạng tối giản bậc nhất." },
                    3: { cmd: "Expand[(x + 2)^3]", res: "x^3 + 6x^2 + 12x + 8", desc: "Khai triển lập phương một tổng thành đa thức thu gọn." }
                };

                function runCas(id) {
                    const c = casData[id];
                    outEl.innerHTML = `<strong>Dòng lệnh CAS:</strong> <code>${c.cmd}</code> <br><strong>Kết quả GeoGebra:</strong> <strong style="color:#34d399; font-size:1.15rem;">${c.res}</strong> <br><em>${c.desc}</em>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Khung giao diện CAS
                    ctx.fillStyle = '#1e293b';
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(40, 40, w - 80, 150);
                    ctx.fillRect(40, 40, w - 80, 150);

                    // Thanh tiêu đề
                    ctx.fillStyle = '#312e81';
                    ctx.fillRect(40, 40, w - 80, 30);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText('GeoGebra CAS - Cửa sổ tính toán đại số', 55, 60);

                    // Nội dung dòng lệnh
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '14px Courier New';
                    ctx.fillText(`1  Input:  ${c.cmd}`, 60, 105);
                    ctx.fillStyle = '#34d399';
                    ctx.fillText(`   Output: ${c.res}`, 60, 140);
                }

                document.getElementById('btnCas1').addEventListener('click', () => runCas(1));
                document.getElementById('btnCas2').addEventListener('click', () => runCas(2));
                document.getElementById('btnCas3').addEventListener('click', () => runCas(3));
                runCas(2);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const slider = document.getElementById('sliderGeoA');
                const valA = document.getElementById('valGeoA');
                const outEl = document.getElementById('lab2OutputTH7');

                function update() {
                    const a = parseFloat(slider.value);
                    valA.textContent = a;

                    outEl.innerHTML = `<strong>Hàm số trên GeoGebra:</strong> $y = ${a}x + 1$ &nbsp;|&nbsp; <strong>Giao điểm trục tung:</strong> $(0; 1)$ &nbsp;|&nbsp; <strong>Giao điểm trục hoành:</strong> $(${a !== 0 ? (-1/a).toFixed(2) : '\\text{không có}'}; 0)$`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const ox = w / 2, oy = h / 2;
                    const scale = 22;

                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(20, oy); ctx.lineTo(w - 20, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, h - 20); ctx.lineTo(ox, 20); ctx.stroke();

                    // Đường thẳng
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ox - 6 * scale, oy - (a * -6 + 1) * scale);
                    ctx.lineTo(ox + 6 * scale, oy - (a * 6 + 1) * scale);
                    ctx.stroke();

                    // Điểm cố định (0; 1)
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath(); ctx.arc(ox, oy - 1 * scale, 5, 0, Math.PI * 2); ctx.fill();
                }

                slider.addEventListener('input', update);
                update();
            
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
