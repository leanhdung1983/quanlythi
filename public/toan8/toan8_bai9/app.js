// ================================================================
// BÀI 9: PHÂN TÍCH ĐA THỨC THÀNH NHÂN TỬ - TOÁN 8 KNTT
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
  userTitle: 'Bậc Thầy Phân Tích Nhân Tử 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai9_state';

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
    "title": "Thử Thách 1: Đặt Nhân Tử Chung Cơ Bản",
    "pts": 20,
    "question": "Phân tích đa thức $3x^2 - 6x$ thành nhân tử được:",
    "options": [
      {
        "text": "$3x(x - 2)$",
        "correct": true
      },
      {
        "text": "$3(x^2 - 2)$",
        "correct": false
      },
      {
        "text": "$x(3x - 6)$",
        "correct": false
      },
      {
        "text": "$3x(x - 6)$",
        "correct": false
      }
    ],
    "explanation": "Nhân tử chung là $3x$: $3x^2 - 6x = 3x \\cdot x - 3x \\cdot 2 = 3x(x - 2)$."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Dùng Hằng Đẳng Thức Hiệu Hai Bình Phương",
    "pts": 20,
    "question": "Phân tích đa thức $4x^2 - 9$ thành nhân tử:",
    "options": [
      {
        "text": "$(2x - 3)(2x + 3)$",
        "correct": true
      },
      {
        "text": "$(4x - 9)(4x + 9)$",
        "correct": false
      },
      {
        "text": "$(2x - 3)^2$",
        "correct": false
      },
      {
        "text": "$(2x + 3)^2$",
        "correct": false
      }
    ],
    "explanation": "$4x^2 - 9 = (2x)^2 - 3^2 = (2x - 3)(2x + 3)$."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Dùng Hằng Đẳng Thức Bình Phương",
    "pts": 20,
    "question": "Phân tích đa thức $x^2 + 4xy + 4y^2$ thành nhân tử:",
    "options": [
      {
        "text": "$(x + 2y)^2$",
        "correct": true
      },
      {
        "text": "$(x - 2y)^2$",
        "correct": false
      },
      {
        "text": "$(x + 4y)^2$",
        "correct": false
      },
      {
        "text": "$(x + y)^2$",
        "correct": false
      }
    ],
    "explanation": "$x^2 + 2 \\cdot x \\cdot (2y) + (2y)^2 = (x + 2y)^2$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Phương Pháp Nhóm Hạng Tử",
    "pts": 20,
    "question": "Phân tích đa thức $xy + 2x + 3y + 6$ thành nhân tử:",
    "options": [
      {
        "text": "$(x + 3)(y + 2)$",
        "correct": true
      },
      {
        "text": "$(x + 2)(y + 3)$",
        "correct": false
      },
      {
        "text": "$(x + 6)(y + 1)$",
        "correct": false
      },
      {
        "text": "$(xy + 2)(y + 3)$",
        "correct": false
      }
    ],
    "explanation": "Nhóm: $(xy + 2x) + (3y + 6) = x(y + 2) + 3(y + 2) = (x + 3)(y + 2)$."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Nhóm Tạo Hằng Đẳng Thức",
    "pts": 20,
    "question": "Phân tích đa thức $x^2 - 2xy + y^2 - 1$ thành nhân tử được:",
    "options": [
      {
        "text": "$(x - y - 1)(x - y + 1)$",
        "correct": true
      },
      {
        "text": "$(x - y - 1)^2$",
        "correct": false
      },
      {
        "text": "$(x + y - 1)(x + y + 1)$",
        "correct": false
      },
      {
        "text": "$(x - y)^2 - 1$",
        "correct": false
      }
    ],
    "explanation": "Nhóm 3 hạng tử đầu: $(x^2 - 2xy + y^2) - 1 = (x - y)^2 - 1^2 = (x - y - 1)(x - y + 1)$."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Phối Hợp Đặt Nhân Tử Chung & Hằng Đẳng Thức",
    "pts": 20,
    "question": "Phân tích đa thức $2x^3 - 8x$ thành nhân tử hoàn toàn:",
    "options": [
      {
        "text": "$2x(x - 2)(x + 2)$",
        "correct": true
      },
      {
        "text": "$2x(x^2 - 4)$",
        "correct": false
      },
      {
        "text": "$2(x^3 - 4x)$",
        "correct": false
      },
      {
        "text": "$x(2x - 4)(2x + 4)$",
        "correct": false
      }
    ],
    "explanation": "Đặt nhân tử chung $2x$: $2x(x^2 - 4) = 2x(x - 2)(x + 2)$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Giải Phương Trình Tích",
    "pts": 20,
    "question": "Tập nghiệm của phương trình $x^2 - 3x = 0$ là:",
    "options": [
      {
        "text": "$\\{0; 3\\}$",
        "correct": true
      },
      {
        "text": "$\\{3\\}$",
        "correct": false
      },
      {
        "text": "$\\{0; -3\\}$",
        "correct": false
      },
      {
        "text": "$\\{0\\}$",
        "correct": false
      }
    ],
    "explanation": "$x(x - 3) = 0 \\iff x = 0$ hoặc $x - 3 = 0 \\iff x = 0$ hoặc $x = 3$."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Tính Nhanh Giá Trị Biểu Thức",
    "pts": 20,
    "question": "Tính nhanh giá trị của $x(x - 1) - y(1 - x)$ tại $x = 2025, y = -25$:",
    "options": [
      {
        "text": "$4\\,048\\,000$",
        "correct": true
      },
      {
        "text": "$4\\,000\\,000$",
        "correct": false
      },
      {
        "text": "$2\\,025\\,000$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      }
    ],
    "explanation": "Đổi dấu $1 - x = -(x - 1) \\implies x(x - 1) + y(x - 1) = (x - 1)(x + y)$. Thay số: $(2025 - 1)(2025 - 25) = 2024 \\cdot 2000 = 4\\,048\\,000$."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Phân Tích Bằng Cách Tách Hạng Tử",
    "pts": 20,
    "question": "Phân tích đa thức $x^2 + 5x + 6$ thành nhân tử:",
    "options": [
      {
        "text": "$(x + 2)(x + 3)$",
        "correct": true
      },
      {
        "text": "$(x + 1)(x + 6)$",
        "correct": false
      },
      {
        "text": "$(x - 2)(x - 3)$",
        "correct": false
      },
      {
        "text": "$(x + 5)(x + 1)$",
        "correct": false
      }
    ],
    "explanation": "Tách $5x = 2x + 3x \\implies x^2 + 2x + 3x + 6 = x(x + 2) + 3(x + 2) = (x + 2)(x + 3)$."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Chứng Minh Chia Hết",
    "pts": 20,
    "question": "Với mọi số nguyên $n$, biểu thức $n^3 - n$ luôn chia hết cho:",
    "options": [
      {
        "text": "$6$",
        "correct": true
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "$8$",
        "correct": false
      }
    ],
    "explanation": "$n^3 - n = n(n^2 - 1) = (n - 1)n(n + 1)$. Đây là tích của 3 số nguyên liên tiếp nên luôn chia hết cho cả 2 và 3, do đó luôn chia hết cho 6."
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

                const cases = [
                    { orig: '6x^2y - 9xy^2', step: 'Nhân tử chung là 3xy', res: '3xy(2x - 3y)', method: 'Đặt nhân tử chung', col: '#6366f1' },
                    { orig: 'x^2 - 10x + 25', step: 'Dạng A² - 2AB + B² với A = x, B = 5', res: '(x - 5)^2', method: 'Dùng Hằng Đẳng Thức 2', col: '#06b6d4' },
                    { orig: 'x^2 - xy + 3x - 3y', step: 'Nhóm: (x² - xy) + (3x - 3y) = x(x - y) + 3(x - y)', res: '(x - y)(x + 3)', method: 'Nhóm Hạng Tử', col: '#f59e0b' }
                ];

                function show(idx) {
                    const c = cases[idx];
                    outEl.innerHTML = `
                        <strong>Đa thức ban đầu:</strong> $P = ${c.orig}$<br>
                        <strong>Phương pháp:</strong> <span style="color:${c.col}; font-weight:700;">${c.method}</span><br>
                        <strong>Bước phân tích:</strong> ${c.step}<br>
                        <strong>Kết quả dạng tích:</strong> $P = \\mathbf{${c.res}}$
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = c.col;
                    ctx.fillRect(40, 50, w - 80, 75);

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(c.method.toUpperCase(), w / 2, 75);
                    ctx.font = 'bold 22px Times New Roman';
                    ctx.fillText(`${c.orig}  ➜  ${c.res}`, w / 2, 108);
                    ctx.textAlign = 'left';
                }

                document.getElementById('btnCase1').addEventListener('click', () => show(0));
                document.getElementById('btnCase2').addEventListener('click', () => show(1));
                document.getElementById('btnCase3').addEventListener('click', () => show(2));
                show(0);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const testX = document.getElementById('testValX');
                const dispX = document.getElementById('dispX');
                const outEl = document.getElementById('lab2Output');

                function update() {
                    const x = parseInt(testX.value);
                    dispX.textContent = x;

                    const val = x * (x - 4);
                    const isRoot = (val === 0);

                    outEl.innerHTML = `
                        <strong>Phương trình:</strong> $x(x - 4) = 0$<br>
                        <strong>Thử với $x = ${x}$:</strong> $${x} \\cdot (${x} - 4) = ${x} \\cdot (${x - 4}) = \\mathbf{${val}}$ &nbsp;
                        ${isRoot ? '<span style="color:#10b981; font-weight:700;">✔ LÀ NGHIỆM!</span>' : '<span style="color:#f43f5e; font-weight:700;">✘ Không phải nghiệm</span>'}
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Truc so
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(50, 100);
                    ctx.lineTo(w - 50, 100);
                    ctx.stroke();

                    // Diem nghiem 0 va 4
                    const ox = 50 + ((0 + 2) / 8) * (w - 100);
                    const x4 = 50 + ((4 + 2) / 8) * (w - 100);
                    const curX = 50 + ((x + 2) / 8) * (w - 100);

                    // Diem 0
                    ctx.fillStyle = '#10b981';
                    ctx.beginPath();
                    ctx.arc(ox, 100, 7, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillText('Nghiệm x = 0', ox - 35, 125);

                    // Diem 4
                    ctx.beginPath();
                    ctx.arc(x4, 100, 7, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillText('Nghiệm x = 4', x4 - 35, 125);

                    // Con tro hien tai
                    ctx.fillStyle = isRoot ? '#10b981' : '#f59e0b';
                    ctx.beginPath();
                    ctx.arc(curX, 80, 9, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillText(`x = ${x}`, curX - 15, 60);
                }

                testX.addEventListener('input', update);
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
