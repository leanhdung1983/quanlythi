// ================================================================
// HĐTN 8: THÍ NGHIỆM NGẪU NHIÊN VỚI EXCEL - TOÁN 8 KNTT
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
  userTitle: 'Nhà Phân Tích Dữ Liệu Excel 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_thuchanh8_state';

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
    "title": "Câu 1: Hàm sinh số ngẫu nhiên trong Excel",
    "pts": 20,
    "question": "Để tạo một số nguyên ngẫu nhiên từ $1$ đến $6$ trong Excel, ta dùng công thức:",
    "options": [
      {
        "text": "=RANDBETWEEN(1, 6)",
        "correct": true
      },
      {
        "text": "=RAND(1, 6)",
        "correct": false
      },
      {
        "text": "=RANDOM(1, 6)",
        "correct": false
      },
      {
        "text": "=BETWEEN(1, 6)",
        "correct": false
      }
    ],
    "explanation": "Hàm `=RANDBETWEEN(bottom, top)` trả về một số nguyên ngẫu nhiên nằm giữa hai cận."
  },
  {
    "id": 2,
    "title": "Câu 2: Phím tắt tính toán lại bảng tính",
    "pts": 20,
    "question": "Trong Microsoft Excel, phím tắt nào được dùng để tính toán lại toàn bộ bảng tính và làm mới các số ngẫu nhiên?",
    "options": [
      {
        "text": "F9",
        "correct": true
      },
      {
        "text": "F5",
        "correct": false
      },
      {
        "text": "F2",
        "correct": false
      },
      {
        "text": "F12",
        "correct": false
      }
    ],
    "explanation": "Nhấn phím `F9` kích hoạt tính toán lại toàn bộ công thức trong bảng tính Excel."
  },
  {
    "id": 3,
    "title": "Câu 3: Đếm số lần xuất hiện với COUNTIF",
    "pts": 20,
    "question": "Công thức `=COUNTIF(B1:B50, 4)` trong Excel có ý nghĩa là:",
    "options": [
      {
        "text": "Đếm số ô có giá trị bằng 4 trong vùng B1:B50",
        "correct": true
      },
      {
        "text": "Tính tổng các ô có giá trị bằng 4",
        "correct": false
      },
      {
        "text": "Nhân giá trị ô B1:B50 với 4",
        "correct": false
      },
      {
        "text": "Tìm giá trị lớn nhất trong 4 ô",
        "correct": false
      }
    ],
    "explanation": "`COUNTIF` là hàm đếm có điều kiện: đếm xem có bao nhiêu ô trong vùng thỏa mãn điều kiện."
  },
  {
    "id": 4,
    "title": "Câu 4: Mô phỏng tung đồng xu",
    "pts": 20,
    "question": "Để mô phỏng ngẫu nhiên việc tung đồng xu (với 0 là Sấp, 1 là Ngửa), ta dùng công thức:",
    "options": [
      {
        "text": "=RANDBETWEEN(0, 1)",
        "correct": true
      },
      {
        "text": "=RAND(0, 1)",
        "correct": false
      },
      {
        "text": "=COIN(0, 1)",
        "correct": false
      },
      {
        "text": "=RANDBETWEEN(1, 2)",
        "correct": false
      }
    ],
    "explanation": "`=RANDBETWEEN(0, 1)` sinh ngẫu nhiên số 0 hoặc số 1 với xác suất 50% - 50%."
  },
  {
    "id": 5,
    "title": "Câu 5: Tính xác suất thực nghiệm trong Excel",
    "pts": 20,
    "question": "Nếu ô C1 chứa công thức `=COUNTIF(A1:A100, 6)`, để tính xác suất thực nghiệm xuất hiện mặt 6 chấm, tại ô C2 ta nhập công thức:",
    "options": [
      {
        "text": "=C1 / 100",
        "correct": true
      },
      {
        "text": "=C1 * 100",
        "correct": false
      },
      {
        "text": "=C1 / 6",
        "correct": false
      },
      {
        "text": "=100 / C1",
        "correct": false
      }
    ],
    "explanation": "Xác suất thực nghiệm bằng số lần xuất hiện (ô C1) chia cho tổng số phép thử (100 lần): `=C1 / 100`."
  },
  {
    "id": 6,
    "title": "Câu 6: Loại biểu đồ thích hợp để so sánh tần số",
    "pts": 20,
    "question": "Để trực quan hóa tần số xuất hiện của 6 mặt xúc xắc sau nhiều lần thử, loại biểu đồ nào trong Excel là phù hợp nhất?",
    "options": [
      {
        "text": "Biểu đồ cột (Column Chart)",
        "correct": true
      },
      {
        "text": "Biểu đồ đường (Line Chart)",
        "correct": false
      },
      {
        "text": "Biểu đồ tán xạ (Scatter Chart)",
        "correct": false
      },
      {
        "text": "Biểu đồ mạng nhện (Radar Chart)",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ cột (Column Chart) giúp so sánh trực quan độ cao tần số của từng mặt xúc xắc một cách rõ ràng nhất."
  },
  {
    "id": 7,
    "title": "Câu 7: Hàm =RAND() trong Excel",
    "pts": 20,
    "question": "Hàm `=RAND()` trong Excel trả về giá trị như thế nào?",
    "options": [
      {
        "text": "Một số thực ngẫu nhiên lớn hơn hoặc bằng 0 và nhỏ hơn 1",
        "correct": true
      },
      {
        "text": "Một số nguyên bất kì",
        "correct": false
      },
      {
        "text": "Số 0 hoặc số 1",
        "correct": false
      },
      {
        "text": "Một số âm",
        "correct": false
      }
    ],
    "explanation": "`=RAND()` trả về số thực phân phối đều trong khoảng $[0; 1)$."
  },
  {
    "id": 8,
    "title": "Câu 8: Cố định ô khi sao chép công thức",
    "pts": 20,
    "question": "Để cố định vùng dữ liệu `A1:A100` khi kéo sao chép công thức trong Excel, ta viết:",
    "options": [
      {
        "text": "$A$1:$A$100",
        "correct": true
      },
      {
        "text": "A1:A100",
        "correct": false
      },
      {
        "text": "#A#1:#A#100",
        "correct": false
      },
      {
        "text": "@A1:@A100",
        "correct": false
      }
    ],
    "explanation": "Dấu `$` dùng để tạo địa chỉ ô tuyệt đối cố định hàng và cột trong Excel."
  },
  {
    "id": 9,
    "title": "Câu 9: Ưu điểm của việc mô phỏng trên máy tính",
    "pts": 20,
    "question": "Tại sao người ta dùng máy tính để mô phỏng thí nghiệm ngẫu nhiên?",
    "options": [
      {
        "text": "Có thể thực hiện hàng nghìn, hàng triệu phép thử trong vài giây một cách tự động",
        "correct": true
      },
      {
        "text": "Để thay đổi xác suất lý thuyết",
        "correct": false
      },
      {
        "text": "Để kết quả luôn theo ý muốn của người làm",
        "correct": false
      },
      {
        "text": "Vì không thể mua được xúc xắc thật",
        "correct": false
      }
    ],
    "explanation": "Máy tính có tốc độ xử lý siêu nhanh, cho phép thực hiện hàng triệu phép thử Monte Carlo để khảo sát quy luật số lớn."
  },
  {
    "id": 10,
    "title": "Câu 10: Nhận biết dấu bằng trong công thức Excel",
    "pts": 20,
    "question": "Mọi công thức tính toán trong Excel bắt buộc phải bắt đầu bằng ký tự nào?",
    "options": [
      {
        "text": "Dấu bằng (=)",
        "correct": true
      },
      {
        "text": "Dấu cộng (+)",
        "correct": false
      },
      {
        "text": "Dấu cách (Space)",
        "correct": false
      },
      {
        "text": "Dấu hai chấm (:)",
        "correct": false
      }
    ],
    "explanation": "Quy tắc bắt buộc trong Excel: Mọi công thức đều phải bắt đầu bằng dấu bằng `=`."
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
                const btnF9 = document.getElementById('btnF9Excel');
                const outEl = document.getElementById('lab1OutputTH8');

                let cells = [3, 6, 2, 6, 1, 4, 6, 5, 2, 6];

                function render() {
                    const count6 = cells.filter(v => v === 6).length;
                    outEl.innerHTML = `<strong>Dãy 10 ô dữ liệu A1:A10:</strong> [${cells.join(', ')}] <br><strong>Công thức:</strong> <code>=COUNTIF(A1:A10, 6)</code> = <strong style="color:#34d399; font-size:1.15rem;">${count6}</strong> (Tần số mặt 6 chấm: ${(count6 / 10 * 100).toFixed(0)}%)`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Vẽ bảng tính Excel
                    ctx.fillStyle = '#107c41'; // Màu xanh đặc trưng của Excel
                    ctx.fillRect(40, 35, w - 80, 28);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText('Microsoft Excel - Bảng Thí Nghiệm Ngẫu Nhiên', 55, 54);

                    // Các ô tính
                    const cellW = (w - 120) / 10;
                    for (let i = 0; i < 10; i++) {
                        const px = 60 + i * cellW;
                        const py = 75;

                        ctx.fillStyle = '#1e293b';
                        ctx.strokeStyle = '#475569';
                        ctx.lineWidth = 1;
                        ctx.strokeRect(px, py, cellW, 35);
                        ctx.fillRect(px, py, cellW, 35);

                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '11px Segoe UI';
                        ctx.textAlign = 'center';
                        ctx.fillText(`A${i + 1}`, px + cellW / 2, py + 14);

                        ctx.fillStyle = cells[i] === 6 ? '#f59e0b' : '#ffffff';
                        ctx.font = 'bold 15px Segoe UI';
                        ctx.fillText(cells[i], px + cellW / 2, py + 30);
                    }
                    ctx.textAlign = 'left';
                }

                btnF9.addEventListener('click', () => {
                    cells = Array.from({ length: 10 }, () => Math.floor(Math.random() * 6) + 1);
                    render();
                });
                render();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const btn = document.getElementById('btnSim600');
                const outEl = document.getElementById('lab2OutputTH8');

                let counts = [100, 100, 100, 100, 100, 100];

                function draw() {
                    outEl.innerHTML = `<strong>Kết quả 6 mặt sau 600 lần gieo:</strong> <br>` +
                        counts.map((c, i) => `Mặt ${i + 1}: $${c}$ lần (${(c / 6).toFixed(1)}%)`).join(' &nbsp;|&nbsp; ') +
                        `<br><em>Lý thuyết mỗi mặt xuất hiện 100 lần (16.7%). Sự dao động nhỏ chứng minh quy luật số lớn!</em>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Đường mức 100 lý thuyết
                    const y100 = h - 35 - 100;
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath(); ctx.moveTo(40, y100); ctx.lineTo(w - 20, y100); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#ef4444';
                    ctx.font = '11px Segoe UI';
                    ctx.fillText('Mức lý thuyết 100', 45, y100 - 5);

                    // 6 cột
                    const colW = 45;
                    const gap = 35;
                    for (let i = 0; i < 6; i++) {
                        const px = 70 + i * (colW + gap);
                        const colH = counts[i];

                        ctx.fillStyle = '#0284c7';
                        ctx.strokeStyle = '#38bdf8';
                        ctx.lineWidth = 2;
                        ctx.fillRect(px, h - 35 - colH, colW, colH);
                        ctx.strokeRect(px, h - 35 - colH, colW, colH);

                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 12px Segoe UI';
                        ctx.textAlign = 'center';
                        ctx.fillText(`Mặt ${i + 1}`, px + colW / 2, h - 15);
                        ctx.fillText(counts[i], px + colW / 2, h - 40 - colH);
                    }
                    ctx.textAlign = 'left';
                }

                btn.addEventListener('click', () => {
                    counts = [0, 0, 0, 0, 0, 0];
                    for (let i = 0; i < 600; i++) {
                        const roll = Math.floor(Math.random() * 6);
                        counts[roll]++;
                    }
                    draw();
                });
                draw();
            
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
