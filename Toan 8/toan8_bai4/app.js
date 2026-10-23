// ================================================================
// BÀI 4: PHÉP NHÂN ĐA THỨC - TOÁN 8 KNTT
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
  userTitle: 'Bậc Thầy Nhân Đa Thức 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai4_state';

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
    "title": "Thử Thách 1: Nhân Đơn Thức Với Đa Thức",
    "pts": 20,
    "question": "Thực hiện phép tính $2x(x^2 - 3y)$ ta được kết quả là:",
    "options": [
      {
        "text": "$2x^3 - 6xy$",
        "correct": true
      },
      {
        "text": "$2x^3 - 3y$",
        "correct": false
      },
      {
        "text": "$2x^3 - 6x$",
        "correct": false
      },
      {
        "text": "$2x^2 - 6xy$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng quy tắc phân phối: $2x \\cdot x^2 - 2x \\cdot 3y = 2x^3 - 6xy$."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Quy Tắc Dấu Khi Nhân Đơn Thức",
    "pts": 20,
    "question": "Tích $(-3x^2y) \\cdot (2x - y + 1)$ bằng:",
    "options": [
      {
        "text": "$-6x^3y + 3x^2y^2 - 3x^2y$",
        "correct": true
      },
      {
        "text": "$-6x^3y - 3x^2y^2 - 3x^2y$",
        "correct": false
      },
      {
        "text": "$-6x^3y + 3x^2y^2 + 3x^2y$",
        "correct": false
      },
      {
        "text": "$6x^3y - 3x^2y^2 + 3x^2y$",
        "correct": false
      }
    ],
    "explanation": "Nhân với từng hạng tử: $(-3x^2y)(2x) + (-3x^2y)(-y) + (-3x^2y)(1) = -6x^3y + 3x^2y^2 - 3x^2y$."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Nhân Hai Đa Thức Đơn Giản",
    "pts": 20,
    "question": "Khai triển và thu gọn tích $(x + 2)(x + 3)$ ta được:",
    "options": [
      {
        "text": "$x^2 + 5x + 6$",
        "correct": true
      },
      {
        "text": "$x^2 + 6x + 5$",
        "correct": false
      },
      {
        "text": "$x^2 + 5x + 5$",
        "correct": false
      },
      {
        "text": "$x^2 + 6$",
        "correct": false
      }
    ],
    "explanation": "$(x + 2)(x + 3) = x^2 + 3x + 2x + 6 = x^2 + 5x + 6$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Nhân Hai Đa Thức Có Dấu Trừ",
    "pts": 20,
    "question": "Tích $(2x - 1)(x - 2)$ bằng:",
    "options": [
      {
        "text": "$2x^2 - 5x + 2$",
        "correct": true
      },
      {
        "text": "$2x^2 - 3x + 2$",
        "correct": false
      },
      {
        "text": "$2x^2 - 5x - 2$",
        "correct": false
      },
      {
        "text": "$2x^2 + 5x + 2$",
        "correct": false
      }
    ],
    "explanation": "$(2x - 1)(x - 2) = 2x^2 - 4x - x + 2 = 2x^2 - 5x + 2$."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Nhân Đa Thức Hai Biến",
    "pts": 20,
    "question": "Khai triển tích $(x - y)(x + 2y)$ ta được:",
    "options": [
      {
        "text": "$x^2 + xy - 2y^2$",
        "correct": true
      },
      {
        "text": "$x^2 - xy - 2y^2$",
        "correct": false
      },
      {
        "text": "$x^2 + 2xy - 2y^2$",
        "correct": false
      },
      {
        "text": "$x^2 - 2y^2$",
        "correct": false
      }
    ],
    "explanation": "$(x - y)(x + 2y) = x^2 + 2xy - xy - 2y^2 = x^2 + xy - 2y^2$."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Rút Gọn Biểu Thức Chứa Phép Nhân",
    "pts": 20,
    "question": "Rút gọn biểu thức $P = x(x - y) + y(x + y)$ ta được:",
    "options": [
      {
        "text": "$x^2 + y^2$",
        "correct": true
      },
      {
        "text": "$x^2 - y^2$",
        "correct": false
      },
      {
        "text": "$x^2 + 2xy + y^2$",
        "correct": false
      },
      {
        "text": "$2xy$",
        "correct": false
      }
    ],
    "explanation": "Khai triển từng tích: $P = x^2 - xy + yx + y^2 = x^2 + y^2$ (do $-xy + xy = 0$)."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Bậc Của Đa Thức Tích",
    "pts": 20,
    "question": "Cho đa thức $A$ có bậc $3$ và đa thức $B$ có bậc $2$ (với các hệ số cao nhất khác 0). Bậc của đa thức tích $A \\cdot B$ là:",
    "options": [
      {
        "text": "$5$",
        "correct": true
      },
      {
        "text": "$6$",
        "correct": false
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      }
    ],
    "explanation": "Khi nhân hai đa thức một biến (hoặc đa thức khác không), bậc của đa thức tích bằng tổng bậc của hai đa thức: $3 + 2 = 5$."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Tìm Hệ Số Của Hạng Tử",
    "pts": 20,
    "question": "Trong kết quả khai triển của $(3x^2 - 2)(2x + 1)$, hệ số của $x^2$ là:",
    "options": [
      {
        "text": "$3$",
        "correct": true
      },
      {
        "text": "$6$",
        "correct": false
      },
      {
        "text": "$-4$",
        "correct": false
      },
      {
        "text": "$-2$",
        "correct": false
      }
    ],
    "explanation": "Khai triển: $3x^2(2x + 1) - 2(2x + 1) = 6x^3 + 3x^2 - 4x - 2$. Hệ số của $x^2$ là $3$."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Tính Nhanh Bằng Khai Triển",
    "pts": 20,
    "question": "Giá trị của biểu thức $(x - 1)(x + 1)$ tại $x = 101$ là:",
    "options": [
      {
        "text": "$10200$",
        "correct": true
      },
      {
        "text": "$10201$",
        "correct": false
      },
      {
        "text": "$10000$",
        "correct": false
      },
      {
        "text": "$10100$",
        "correct": false
      }
    ],
    "explanation": "$(x - 1)(x + 1) = x^2 - 1$. Với $x = 101$, ta có $101^2 - 1 = (101 - 1)(101 + 1) = 100 \\cdot 102 = 10200$."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Ứng Dụng Hình Học Diện Tích",
    "pts": 20,
    "question": "Một hình chữ nhật có kích thước hai cạnh là $2x + 3$ và $x - 1$. Đa thức biểu thị diện tích hình chữ nhật là:",
    "options": [
      {
        "text": "$2x^2 + x - 3$",
        "correct": true
      },
      {
        "text": "$2x^2 - x - 3$",
        "correct": false
      },
      {
        "text": "$2x^2 + 5x - 3$",
        "correct": false
      },
      {
        "text": "$2x^2 - 3$",
        "correct": false
      }
    ],
    "explanation": "Diện tích là $S = (2x + 3)(x - 1) = 2x^2 - 2x + 3x - 3 = 2x^2 + x - 3$."
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
                const sideA = document.getElementById('sideA');
                const sideB = document.getElementById('sideB');
                const sideC = document.getElementById('sideC');
                const sideD = document.getElementById('sideD');
                const outEl = document.getElementById('lab1Output');

                function draw() {
                    const a = parseInt(sideA.value);
                    const b = parseInt(sideB.value);
                    const c = parseInt(sideC.value);
                    const d = parseInt(sideD.value);

                    const s1 = a * c;
                    const s2 = a * d;
                    const s3 = b * c;
                    const s4 = b * d;
                    const total = (a + b) * (c + d);

                    outEl.innerHTML = `<strong>Tích:</strong> $(${a} + ${b})(${c} + ${d}) = ${a}\\cdot${c} + ${a}\\cdot${d} + ${b}\\cdot${c} + ${b}\\cdot${d} = ${s1} + ${s2} + ${s3} + ${s4} = \\mathbf{${total}}$`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const scale = 20;
                    const ox = 60, oy = 30;
                    const wA = a * scale, wB = b * scale;
                    const hC = c * scale, hD = d * scale;

                    // Hinh ac
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(ox, oy, wA, hC);
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 12px Segoe UI';
                    ctx.fillText(`ac = ${s1}`, ox + wA/2 - 20, oy + hC/2);

                    // Hinh ad
                    ctx.fillStyle = '#6366f1';
                    ctx.fillRect(ox, oy + hC, wA, hD);
                    ctx.fillStyle = '#fff';
                    ctx.fillText(`ad = ${s2}`, ox + wA/2 - 20, oy + hC + hD/2);

                    // Hinh bc
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(ox + wA, oy, wB, hC);
                    ctx.fillStyle = '#fff';
                    ctx.fillText(`bc = ${s3}`, ox + wA + wB/2 - 20, oy + hC/2);

                    // Hinh bd
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(ox + wA, oy + hC, wB, hD);
                    ctx.fillStyle = '#fff';
                    ctx.fillText(`bd = ${s4}`, ox + wA + wB/2 - 20, oy + hC + hD/2);

                    // Khung tong the
                    ctx.strokeStyle = '#f8fafc';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(ox, oy, wA + wB, hC + hD);

                    // Nhan thong so
                    ctx.fillStyle = '#cbd5e1';
                    ctx.font = '14px Segoe UI';
                    ctx.fillText(`Chiều rộng = a + b = ${a + b}`, ox + wA + wB + 30, oy + (hC + hD)/2 - 10);
                    ctx.fillText(`Chiều dài = c + d = ${c + d}`, ox + wA + wB + 30, oy + (hC + hD)/2 + 15);
                    ctx.fillText(`TỔNG DIỆN TÍCH = ${total}`, ox + wA + wB + 30, oy + (hC + hD)/2 + 40);
                }

                [sideA, sideB, sideC, sideD].forEach(el => el.addEventListener('input', draw));
                draw();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const paramK = document.getElementById('paramK');
                const dispK = document.getElementById('dispK');
                const outEl = document.getElementById('lab2Output');

                function update() {
                    const k = parseInt(paramK.value);
                    dispK.textContent = k;

                    // (2x + k)(x - 3) = 2x^2 - 6x + kx - 3k = 2x^2 + (k - 6)x - 3k
                    const mid = k - 6;
                    const cst = -3 * k;

                    outEl.innerHTML = `
                        <strong>Tích:</strong> $(2x ${k >= 0 ? '+ ' + k : '- ' + Math.abs(k)})(x - 3)$<br>
                        <strong>Khai triển:</strong> $= 2x^2 - 6x ${k >= 0 ? '+ ' + k + 'x' : '- ' + Math.abs(k) + 'x'} ${cst >= 0 ? '+ ' + cst : '- ' + Math.abs(cst)}$<br>
                        <strong>Thu gọn:</strong> $= \\mathbf{2x^2 ${mid >= 0 ? '+ ' + mid : '- ' + Math.abs(mid)}x ${cst >= 0 ? '+ ' + cst : '- ' + Math.abs(cst)}}$
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
                    ctx.fillText('HỆ SỐ CỦA ĐA THỨC BẬC HAI KẾT QUẢ', 30, 40);

                    const items = [
                        { name: 'Hệ số x²: 2', val: 2, c: '#06b6d4' },
                        { name: `Hệ số x: (${k} - 6) = ${mid}`, val: mid, c: mid >= 0 ? '#10b981' : '#f43f5e' },
                        { name: `Hệ số tự do: -3k = ${cst}`, val: cst, c: '#f59e0b' }
                    ];

                    items.forEach((it, i) => {
                        const y = 80 + i * 40;
                        ctx.fillStyle = it.c;
                        ctx.fillRect(40, y, Math.max(30, Math.abs(it.val) * 15), 26);
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 14px Segoe UI';
                        ctx.fillText(it.name, 50 + Math.max(30, Math.abs(it.val) * 15), y + 18);
                    });
                }

                paramK.addEventListener('input', update);
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
