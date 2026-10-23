// ================================================================
// BÀI 28: HÀM SỐ BẬC NHẤT VÀ ĐỒ THỊ - TOÁN 8 KNTT
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
  userTitle: 'Kỹ Sư Đồ Thị Đường Thẳng 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai28_state';

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
    "title": "Câu 1: Nhận diện hàm số bậc nhất",
    "pts": 20,
    "question": "Hàm số nào sau đây là hàm số bậc nhất?",
    "options": [
      {
        "text": "$y = 3 - 2x$",
        "correct": true
      },
      {
        "text": "$y = x^2 + 1$",
        "correct": false
      },
      {
        "text": "$y = \\frac{2}{x} + 5$",
        "correct": false
      },
      {
        "text": "$y = 0x + 7$",
        "correct": false
      }
    ],
    "explanation": "Hàm số bậc nhất có dạng $y = ax + b$ với $a \\neq 0$. Hàm $y = 3 - 2x = -2x + 3$ có $a = -2 \\neq 0, b = 3$."
  },
  {
    "id": 2,
    "title": "Câu 2: Xác định tính đồng biến",
    "pts": 20,
    "question": "Hàm số nào sau đây <strong>đồng biến</strong> trên $\\mathbb{R}$?",
    "options": [
      {
        "text": "$y = 4x - 1$",
        "correct": true
      },
      {
        "text": "$y = -2x + 5$",
        "correct": false
      },
      {
        "text": "$y = 3 - x$",
        "correct": false
      },
      {
        "text": "$y = -0{,}5x$",
        "correct": false
      }
    ],
    "explanation": "Hàm số $y = ax + b$ đồng biến khi và chỉ khi hệ số $a > 0$. Hàm $y = 4x - 1$ có $a = 4 > 0$ nên đồng biến."
  },
  {
    "id": 3,
    "title": "Câu 3: Xác định tính nghịch biến",
    "pts": 20,
    "question": "Hàm số nào sau đây <strong>nghịch biến</strong> trên $\\mathbb{R}$?",
    "options": [
      {
        "text": "$y = -3x + 2$",
        "correct": true
      },
      {
        "text": "$y = 5x - 3$",
        "correct": false
      },
      {
        "text": "$y = x + 7$",
        "correct": false
      },
      {
        "text": "$y = \\sqrt{2}x$",
        "correct": false
      }
    ],
    "explanation": "Hàm số $y = ax + b$ nghịch biến khi và chỉ khi $a < 0$. $y = -3x + 2$ có $a = -3 < 0$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tìm giao điểm với trục tung",
    "pts": 20,
    "question": "Đồ thị của hàm số $y = 2x - 6$ cắt trục tung tại điểm có tọa độ là:",
    "options": [
      {
        "text": "$(0; -6)$",
        "correct": true
      },
      {
        "text": "$(3; 0)$",
        "correct": false
      },
      {
        "text": "$(0; 6)$",
        "correct": false
      },
      {
        "text": "$(0; 3)$",
        "correct": false
      }
    ],
    "explanation": "Giao điểm với trục tung $Oy$ có hoành độ $x = 0$. Thay $x = 0$ ta được $y = 2(0) - 6 = -6$. Tọa độ là $(0; -6)$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tìm giao điểm với trục hoành",
    "pts": 20,
    "question": "Đồ thị của hàm số $y = -2x + 4$ cắt trục hoành tại điểm có tọa độ là:",
    "options": [
      {
        "text": "$(2; 0)$",
        "correct": true
      },
      {
        "text": "$(0; 4)$",
        "correct": false
      },
      {
        "text": "$(-2; 0)$",
        "correct": false
      },
      {
        "text": "$(4; 0)$",
        "correct": false
      }
    ],
    "explanation": "Giao điểm với trục hoành $Ox$ có tung độ $y = 0$. Thay $y = 0$: $0 = -2x + 4 \\iff 2x = 4 \\iff x = 2$. Tọa độ là $(2; 0)$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tìm tham số m để hàm số đồng biến",
    "pts": 20,
    "question": "Tìm tất cả các giá trị của $m$ để hàm số $y = (m - 2)x + 3$ đồng biến trên $\\mathbb{R}$:",
    "options": [
      {
        "text": "$m > 2$",
        "correct": true
      },
      {
        "text": "$m < 2$",
        "correct": false
      },
      {
        "text": "$m \\neq 2$",
        "correct": false
      },
      {
        "text": "$m \\ge 2$",
        "correct": false
      }
    ],
    "explanation": "Hàm số đồng biến khi hệ số $a > 0 \\iff m - 2 > 0 \\iff m > 2$."
  },
  {
    "id": 7,
    "title": "Câu 7: Đồ thị đi qua điểm cho trước",
    "pts": 20,
    "question": "Đồ thị hàm số $y = ax + 3$ đi qua điểm $A(1; 5)$. Hệ số $a$ bằng:",
    "options": [
      {
        "text": "$a = 2$",
        "correct": true
      },
      {
        "text": "$a = -2$",
        "correct": false
      },
      {
        "text": "$a = 8$",
        "correct": false
      },
      {
        "text": "$a = 1$",
        "correct": false
      }
    ],
    "explanation": "Thay tọa độ $A(1; 5)$ vào phương trình hàm số: $5 = a(1) + 3 \\iff a = 5 - 3 = 2$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tính diện tích tam giác tạo bởi hai trục tọa độ",
    "pts": 20,
    "question": "Đồ thị hàm số $y = -x + 4$ cắt $Ox$ tại $A$, cắt $Oy$ tại $B$. Diện tích tam giác $OAB$ là:",
    "options": [
      {
        "text": "$8$",
        "correct": true
      },
      {
        "text": "$16$",
        "correct": false
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$12$",
        "correct": false
      }
    ],
    "explanation": "Giao điểm: $A(4; 0) \\implies OA = 4$; $B(0; 4) \\implies OB = 4$. Tam giác $OAB$ vuông tại $O$, diện tích $S = \\frac{1}{2} OA \\cdot OB = \\frac{1}{2} \\times 4 \\times 4 = 8$."
  },
  {
    "id": 9,
    "title": "Câu 9: Đồ thị hàm số đi qua gốc tọa độ",
    "pts": 20,
    "question": "Đồ thị của hàm số nào sau đây đi qua gốc tọa độ $O(0; 0)$?",
    "options": [
      {
        "text": "$y = -3x$",
        "correct": true
      },
      {
        "text": "$y = 2x + 1$",
        "correct": false
      },
      {
        "text": "$y = x - 5$",
        "correct": false
      },
      {
        "text": "$y = 4$",
        "correct": false
      }
    ],
    "explanation": "Đồ thị hàm số $y = ax + b$ đi qua gốc tọa độ khi và chỉ khi $b = 0$, tức là có dạng $y = ax$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng thực tế định luật chuyển động đều",
    "pts": 20,
    "question": "Một người đi bộ với vận tốc đều $4\\text{ km/h}$ bắt đầu từ điểm cách mốc mốc tọa độ $2\\text{ km}$. Hàm số biểu thị quãng đường $y\\text{ (km)}$ theo thời gian $t\\text{ (giờ)}$ là:",
    "options": [
      {
        "text": "$y = 4t + 2$",
        "correct": true
      },
      {
        "text": "$y = 2t + 4$",
        "correct": false
      },
      {
        "text": "$y = 4t$",
        "correct": false
      },
      {
        "text": "$y = 6t$",
        "correct": false
      }
    ],
    "explanation": "Quãng đường ban đầu là $2\\text{ km}$, mỗi giờ đi được $4\\text{ km}$. Phương trình chuyển động thẳng đều là $y = 4t + 2$."
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
                const sA = document.getElementById('sliderA28');
                const sB = document.getElementById('sliderB28');
                const valA = document.getElementById('valA28');
                const valB = document.getElementById('valB28');
                const outEl = document.getElementById('lab1Output28');

                function update() {
                    const a = parseFloat(sA.value);
                    const b = parseFloat(sB.value);
                    valA.textContent = a;
                    valB.textContent = b;

                    let prop = '';
                    if (a > 0) prop = '<span style="color:#34d399; font-weight:bold;">Đồng biến (đi lên từ trái sang phải)</span>';
                    else if (a < 0) prop = '<span style="color:#f87171; font-weight:bold;">Nghịch biến (đi xuống từ trái sang phải)</span>';
                    else prop = '<span style="color:#f59e0b; font-weight:bold;">Hàm hằng (đường nằm ngang song song Ox)</span>';

                    const cutY = `B(0; ${b})`;
                    const cutX = (a !== 0) ? `A(${(-b/a).toFixed(2)}; 0)` : 'Không cắt Ox';

                    outEl.innerHTML = `<strong>Hàm số:</strong> $y = ${a}x + (${b})$ &nbsp;|&nbsp; <strong>Tính chất:</strong> ${prop} <br><strong>Giao điểm $Oy$:</strong> $${cutY}$ &nbsp;|&nbsp; <strong>Giao điểm $Ox$:</strong> $${cutX}$`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const ox = w / 2;
                    const oy = h / 2;
                    const scale = 24;

                    // Trục Ox, Oy
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(20, oy); ctx.lineTo(w - 20, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, h - 20); ctx.lineTo(ox, 20); ctx.stroke();

                    // Đường thẳng
                    ctx.strokeStyle = a > 0 ? '#10b981' : (a < 0 ? '#ef4444' : '#f59e0b');
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    const xL = -8, yL = a * xL + b;
                    const xR = 8, yR = a * xR + b;
                    ctx.moveTo(ox + xL * scale, oy - yL * scale);
                    ctx.lineTo(ox + xR * scale, oy - yR * scale);
                    ctx.stroke();

                    // Điểm B(0; b)
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath(); ctx.arc(ox, oy - b * scale, 5, 0, Math.PI * 2); ctx.fill();

                    // Điểm A(-b/a; 0)
                    if (a !== 0) {
                        ctx.fillStyle = '#06b6d4';
                        ctx.beginPath(); ctx.arc(ox + (-b / a) * scale, oy, 5, 0, Math.PI * 2); ctx.fill();
                    }
                }

                [sA, sB].forEach(el => el.addEventListener('input', update));
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const sB = document.getElementById('sliderShiftB');
                const valB = document.getElementById('valShiftB');
                const outEl = document.getElementById('lab2Output28');

                function draw() {
                    const b = parseInt(sB.value);
                    valB.textContent = b;

                    outEl.innerHTML = `<strong>Đường thẳng chuẩn:</strong> $y = 1{,}5x$ (màu xanh ngọc, qua gốc $O$) <br><strong>Đường thẳng tịnh tiến:</strong> $y = 1{,}5x + ${b}$ (màu vàng) &nbsp;$\\implies$ <strong style="color:#34d399;">Song song tuyệt đối vì cùng hệ số $a = 1{,}5$!</strong>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const ox = w / 2;
                    const oy = h / 2;
                    const scale = 24;

                    // Trục Ox, Oy
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(20, oy); ctx.lineTo(w - 20, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, h - 20); ctx.lineTo(ox, 20); ctx.stroke();

                    // y = 1.5x
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(ox - 6 * scale, oy - (-9) * scale);
                    ctx.lineTo(ox + 6 * scale, oy - (9) * scale);
                    ctx.stroke();

                    // y = 1.5x + b
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ox - 6 * scale, oy - (-9 + b) * scale);
                    ctx.lineTo(ox + 6 * scale, oy - (9 + b) * scale);
                    ctx.stroke();

                    // Mũi tên tịnh tiến dọc trục Oy
                    ctx.strokeStyle = '#ec4899';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - b * scale); ctx.stroke();
                }

                sB.addEventListener('input', draw);
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
