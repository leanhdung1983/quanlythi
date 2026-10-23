// ================================================================
// BÀI TẬP CUỐI CHƯƠNG I: TỔNG ÔN SỐ HỮU TỈ - TOÁN 7 KNTT
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
  userTitle: 'Đại Kiện Tướng Số Hữu Tỉ 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_ontap_chuong1_state';

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
    "title": "Câu 1: Tập hợp số hữu tỉ",
    "pts": 20,
    "question": "Trong các số sau, số nào KHÔNG phải là số hữu tỉ?",
    "options": [
      {
        "text": "$\\sqrt{3}$",
        "correct": true
      },
      {
        "text": "$-3,5$",
        "correct": false
      },
      {
        "text": "$2\\frac{1}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{0}{7}$",
        "correct": false
      }
    ],
    "explanation": "Số $\\sqrt{3} \\approx 1,73205...$ là số thập phân vô hạn không tuần hoàn (số vô tỉ), không thể viết dưới dạng phân số tối giản nên không thuộc $\\mathbb{Q}$."
  },
  {
    "id": 2,
    "title": "Câu 2: So sánh số hữu tỉ âm",
    "pts": 20,
    "question": "Sắp xếp các số hữu tỉ sau theo thứ tự tăng dần: $-\\frac{2}{3}, 0, -\\frac{3}{4}, \\frac{1}{2}$:",
    "options": [
      {
        "text": "$-\\frac{3}{4} < -\\frac{2}{3} < 0 < \\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$-\\frac{2}{3} < -\\frac{3}{4} < 0 < \\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$0 < -\\frac{2}{3} < -\\frac{3}{4} < \\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$-\\frac{3}{4} < -\\frac{2}{3} < \\frac{1}{2} < 0$",
        "correct": false
      }
    ],
    "explanation": "Quy đồng mẫu hai số âm: $-\\frac{3}{4} = -\\frac{9}{12}$ và $-\\frac{2}{3} = -\\frac{8}{12}$. Vì $-9 < -8$ nên $-\\frac{3}{4} < -\\frac{2}{3}$. Do đó thứ tự là $-\\frac{3}{4} < -\\frac{2}{3} < 0 < \\frac{1}{2}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính giá trị biểu thức phân số",
    "pts": 20,
    "question": "Giá trị của biểu thức $T = \\frac{2}{5} - \\left(-\\frac{1}{3}\\right) + \\frac{3}{5}$ bằng:",
    "options": [
      {
        "text": "$1\\frac{1}{3} = \\frac{4}{3}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": false
      },
      {
        "text": "$-\\frac{4}{3}$",
        "correct": false
      }
    ],
    "explanation": "Nhóm hợp lí: $\\left(\\frac{2}{5} + \\frac{3}{5}\\right) - \\left(-\\frac{1}{3}\\right) = 1 + \\frac{1}{3} = \\frac{4}{3}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Phép nhân phân phối",
    "pts": 20,
    "question": "Tính nhanh: $H = \\frac{5}{9} \\cdot \\frac{7}{13} + \\frac{5}{9} \\cdot \\frac{6}{13}$:",
    "options": [
      {
        "text": "$\\frac{5}{9}$",
        "correct": true
      },
      {
        "text": "$\\frac{13}{9}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$\\frac{35}{117}$",
        "correct": false
      }
    ],
    "explanation": "Đặt $\\frac{5}{9}$ làm thừa số chung: $H = \\frac{5}{9} \\left(\\frac{7}{13} + \\frac{6}{13}\\right) = \\frac{5}{9} \\cdot 1 = \\frac{5}{9}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Luỹ thừa cùng cơ số",
    "pts": 20,
    "question": "Tính giá trị của biểu thức $L = \\frac{2^7 \\cdot 2^3}{2^8}$:",
    "options": [
      {
        "text": "$4$",
        "correct": true
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$8$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Ta có $L = \\frac{2^{7+3}}{2^8} = \\frac{2^{10}}{2^8} = 2^{10-8} = 2^2 = 4$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tìm x trong phương trình chuyển vế",
    "pts": 20,
    "question": "Tìm số hữu tỉ $x$ biết: $\\frac{3}{4} - 2x = -\\frac{1}{4}$:",
    "options": [
      {
        "text": "$x = \\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$x = -\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$x = 1$",
        "correct": false
      },
      {
        "text": "$x = \\frac{1}{4}$",
        "correct": false
      }
    ],
    "explanation": "Chuyển vế: $2x = \\frac{3}{4} - \\left(-\\frac{1}{4}\\right) = \\frac{3}{4} + \\frac{1}{4} = 1$. Suy ra $x = 1 : 2 = \\frac{1}{2}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Luỹ thừa của một tích",
    "pts": 20,
    "question": "Giá trị của biểu thức $K = (0,125)^3 \\cdot 8^3$ bằng:",
    "options": [
      {
        "text": "$1$",
        "correct": true
      },
      {
        "text": "$8$",
        "correct": false
      },
      {
        "text": "$0,125$",
        "correct": false
      },
      {
        "text": "$64$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng công thức luỹ thừa của tích: $K = (0,125 \\cdot 8)^3 = 1^3 = 1$."
  },
  {
    "id": 8,
    "title": "Câu 8: Giá trị biểu thức nhiều tầng ngoặc",
    "pts": 20,
    "question": "Thực hiện phép tính $E = 1 - \\left[ \\frac{1}{2} - \\left(\\frac{3}{4} - 1\\right) \\right]$:",
    "options": [
      {
        "text": "$\\frac{1}{4}$",
        "correct": true
      },
      {
        "text": "$\\frac{3}{4}$",
        "correct": false
      },
      {
        "text": "$-\\frac{1}{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      }
    ],
    "explanation": "Tính trong ngoặc tròn trước: $\\frac{3}{4} - 1 = -\\frac{1}{4}$. Trong ngoặc vuông: $\\frac{1}{2} - \\left(-\\frac{1}{4}\\right) = \\frac{2}{4} + \\frac{1}{4} = \\frac{3}{4}$. Cuối cùng: $E = 1 - \\frac{3}{4} = \\frac{1}{4}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Điểm đối xứng trên trục số",
    "pts": 20,
    "question": "Cho điểm $A$ biểu diễn số $-\\frac{5}{2}$ và điểm $B$ biểu diễn số $\\frac{5}{2}$ trên trục số. Trung điểm của đoạn thẳng $AB$ biểu diễn số nào?",
    "options": [
      {
        "text": "$0$",
        "correct": true
      },
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "$\\frac{5}{2}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Vì $-\\frac{5}{2}$ và $\\frac{5}{2}$ là hai số đối nhau nên hai điểm $A$ và $B$ đối xứng nhau qua gốc 0. Do đó trung điểm của đoạn thẳng $AB$ chính là điểm gốc 0."
  },
  {
    "id": 10,
    "title": "Câu 10: Bài toán thực tế tổng hợp",
    "pts": 20,
    "question": "Một người thợ may dùng $3\\frac{1}{4}\\,\\text{m}$ vải để may áo và $2\\frac{1}{2}\\,\\text{m}$ vải để may quần. Người đó có một tấm vải dài $10\\,\\text{m}$. Số mét vải còn lại là:",
    "options": [
      {
        "text": "$4,25\\,\\text{m} = 4\\frac{1}{4}\\,\\text{m}$",
        "correct": true
      },
      {
        "text": "$4,5\\,\\text{m}$",
        "correct": false
      },
      {
        "text": "$5,25\\,\\text{m}$",
        "correct": false
      },
      {
        "text": "$3,75\\,\\text{m}$",
        "correct": false
      }
    ],
    "explanation": "Tổng số mét vải đã may là $3\\frac{1}{4} + 2\\frac{1}{2} = 3,25 + 2,5 = 5,75\\,\\text{m}$. Số mét vải còn lại là $10 - 5,75 = 4,25\\,\\text{m} = 4\\frac{1}{4}\\,\\text{m}$."
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
    
                const challenges = [
                    { q: "Tính: $\\left(-\\frac{2}{3}\\right)^2 + \\frac{5}{9} : \\frac{5}{3}$", a: "$$\\frac{4}{9} + \\frac{5}{9} \\cdot \\frac{3}{5} = \\frac{4}{9} + \\frac{1}{3} = \\frac{4}{9} + \\frac{3}{9} = \\frac{7}{9}$$" },
                    { q: "Tìm $x$ biết: $x - \\frac{1}{4} = -\\frac{2}{3} \\cdot \\frac{3}{8}$", a: "$$x - \\frac{1}{4} = -\\frac{1}{4} \\iff x = -\\frac{1}{4} + \\frac{1}{4} = 0$$" },
                    { q: "Tính nhanh: $\\frac{3}{7} \\cdot \\left(-\\frac{5}{8}\\right) + \\frac{3}{7} \\cdot \\left(-\\frac{3}{8}\\right)$", a: "$$\\frac{3}{7} \\left(-\\frac{5}{8} - \\frac{3}{8}\\right) = \\frac{3}{7} \\cdot (-1) = -\\frac{3}{7}$$" },
                    { q: "Rút gọn: $\\frac{2^5 \\cdot 9^3}{8 \\cdot 3^5}$", a: "$$\\frac{2^5 \\cdot (3^2)^3}{2^3 \\cdot 3^5} = \\frac{2^5 \\cdot 3^6}{2^3 \\cdot 3^5} = 2^2 \\cdot 3 = 4 \\cdot 3 = 12$$" }
                ];

                document.getElementById('btnSpinLab').addEventListener('click', () => {
                    const idx = Math.floor(Math.random() * challenges.length);
                    const ch = challenges[idx];
                    const out = document.getElementById('labSpinOut');
                    out.innerHTML = `<strong>Thử thách ngẫu nhiên:</strong><br>${ch.q}<br><br><strong>Đáp án & Lời giải:</strong><br>${ch.a}`;
                    renderMathInTree(out);
                });
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                function testBalance() {
                    const x = parseFloat(document.getElementById('l2_testVal').value) || 0;
                    const lhs = 2 * x + 0.5;
                    const rhs = 2.5;
                    const out = document.getElementById('lab2BalanceOut');

                    const isEq = Math.abs(lhs - rhs) < 0.0001;
                    out.innerHTML = `
                        Phương trình: $2x + \\frac{1}{2} = \\frac{5}{2}$ (tức $2x + 0,5 = 2,5$)<br>
                        Vế trái với $x = ${x}$: $2 \\cdot ${x} + 0,5 = ${lhs}$<br>
                        Vế phải: $2,5$<br>
                        <strong>Kết luận:</strong> ${isEq ? '<span style="color:#10b981;">✅ CHÍNH XÁC! Cán cân cân bằng, x = ' + x + ' là nghiệm đúng!</span>' : '<span style="color:#f43f5e;">❌ Vế trái (' + lhs + ') ≠ Vế phải (2.5). Cán cân lệch, cần tìm lại!</span>'}
                    `;
                    renderMathInTree(out);
                }

                document.getElementById('btnTestSol').addEventListener('click', testBalance);
                setTimeout(testBalance, 100);
            
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
