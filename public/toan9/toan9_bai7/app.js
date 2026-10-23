// ================================================================
// Bài 7: Căn Bậc Hai Và Căn Thức Bậc Hai - TOÁN 9 KNTT
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
  ["\\cap", "<mo>&#8745;</mo>"],
  ["\\frown", "<mo>&#8978;</mo>"],
  ["\\smile", "<mo>&#8979;</mo>"]
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
  s = s.replace(/\\(overparen|wideparen|overgroup|overarc|arc)\{([^{}]+)\}/g, (m, cmd, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#9180;</mo></mover>'));
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
    try {
      renderMathInElement(root, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        macros: {
          '\\overparen': '\\overgroup{#1}',
          '\\wideparen': '\\overgroup{#1}',
          '\\overarc': '\\overgroup{#1}',
          '\\arc': '\\overgroup{#1}'
        },
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {
      console.warn('KaTeX render error, falling back to MathML:', e);
    }
  }

  // MathML Fallback
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.includes('$')) {
      textNodes.push(node);
    }
  }

  textNodes.forEach(tn => {
    const parent = tn.parentNode;
    if (!parent) return;
    const tag = parent.nodeName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'textarea' || tag === 'code') return;
    const span = document.createElement('span');
    span.innerHTML = formatMathText(tn.nodeValue);
    parent.replaceChild(span, tn);
  });
}

// --- 1. WEB AUDIO API SOUND SYSTEM ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration, type = 'sine', gainVal = 0.1) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  playClick() {
    this.playTone(800, 0.05, 'triangle', 0.08);
  }

  playCorrect() {
    if (!this.enabled) return;
    this.playTone(523.25, 0.1, 'sine', 0.12);
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.12), 100);
    setTimeout(() => this.playTone(783.99, 0.25, 'triangle', 0.15), 220);
  }

  playWrong() {
    if (!this.enabled) return;
    this.playTone(320, 0.15, 'sawtooth', 0.1);
    setTimeout(() => this.playTone(240, 0.25, 'sawtooth', 0.1), 120);
  }

  playLevelUp() {
    if (!this.enabled) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.18, 'sine', 0.15), i * 120);
    });
  }

  playFanfare() {
    if (!this.enabled) return;
    const melody = [523, 659, 783, 1046, 783, 1046];
    melody.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.22, 'triangle', 0.18), i * 140);
    });
  }
}

const sound = new SoundController();

// --- 2. GAMIFICATION STATE & LOCALSTORAGE ---
const STORAGE_KEY = 'toan9_toan9_bai7_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Pháp Sư Căn Thức 9',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      appState = Object.assign(appState, parsed);
    }
  } catch (e) {
    console.warn('Could not load state:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn('Could not save state:', e);
  }
}

function updateHUD() {
  const avBtn = document.getElementById('avatarBtn');
  const nameEl = document.getElementById('userNameDisplay');
  const titleEl = document.getElementById('userTitle');
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const soundBtn = document.getElementById('soundToggle');

  if (avBtn) avBtn.textContent = appState.avatar;
  if (nameEl) nameEl.textContent = `${appState.userName} 🌟`;
  if (titleEl) titleEl.textContent = appState.userTitle;
  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (soundBtn) soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';

  // Stars (1-5 dựa trên XP)
  let s = 1;
  if (appState.xp >= 160) s = 5;
  else if (appState.xp >= 120) s = 4;
  else if (appState.xp >= 80) s = 3;
  else if (appState.xp >= 40) s = 2;
  appState.stars = s;
  if (starEl) starEl.textContent = '⭐'.repeat(s) + '☆'.repeat(5 - s);

  // Update Badges UI
  appState.badges.forEach((unlocked, idx) => {
    const el = document.getElementById(`badge-${idx + 1}`);
    if (el) {
      if (unlocked) el.classList.remove('locked');
      else el.classList.add('locked');
    }
  });

  // Update Certificate info
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
    "title": "Thử Thách 1: Căn Bậc Hai Số Học",
    "pts": 20,
    "question": "Căn bậc hai số học của 81 là:",
    "options": [
      {
        "text": "$9$",
        "correct": true
      },
      {
        "text": "$-9$",
        "correct": false
      },
      {
        "text": "$\\pm 9$",
        "correct": false
      },
      {
        "text": "$81$",
        "correct": false
      }
    ],
    "explanation": "Căn bậc hai số học của số dương $a$ là số dương duy nhất $\\sqrt{a}$. Với $a = 81$, căn bậc hai số học là $\\sqrt{81} = 9$."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Tìm Căn Bậc Hai Của Một Số",
    "pts": 20,
    "question": "Các căn bậc hai của số 25 là:",
    "options": [
      {
        "text": "$5$ và $-5$",
        "correct": true
      },
      {
        "text": "Chỉ có số $5$",
        "correct": false
      },
      {
        "text": "Chỉ có số $-5$",
        "correct": false
      },
      {
        "text": "$625$",
        "correct": false
      }
    ],
    "explanation": "Mỗi số thực dương $a$ luôn có đúng hai căn bậc hai đối nhau là $\\sqrt{a}$ và $-\\sqrt{a}$. Các căn bậc hai của 25 là $5$ và $-5$."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Điều Kiện Xác Định Căn Thức Bậc Nhất",
    "pts": 20,
    "question": "Căn thức bậc hai $\\sqrt{2x - 6}$ xác định khi và chỉ khi:",
    "options": [
      {
        "text": "$x \\ge 3$",
        "correct": true
      },
      {
        "text": "$x > 3$",
        "correct": false
      },
      {
        "text": "$x \\le 3$",
        "correct": false
      },
      {
        "text": "$x \\ge -3$",
        "correct": false
      }
    ],
    "explanation": "Biểu thức dưới dấu căn phải không âm: $2x - 6 \\ge 0 \\iff 2x \\ge 6 \\iff x \\ge 3$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Điều Kiện Với Hệ Số Âm",
    "pts": 20,
    "question": "Căn thức $\\sqrt{10 - 5x}$ có nghĩa khi:",
    "options": [
      {
        "text": "$x \\le 2$",
        "correct": true
      },
      {
        "text": "$x \\ge 2$",
        "correct": false
      },
      {
        "text": "$x < 2$",
        "correct": false
      },
      {
        "text": "$x \\le -2$",
        "correct": false
      }
    ],
    "explanation": "ĐKXĐ: $10 - 5x \\ge 0 \\iff -5x \\ge -10 \\iff x \\le \\frac{-10}{-5} = 2$ (chia cho số âm đổi chiều)."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Rút Gọn Căn Bậc Hai Của Bình Phương Số Âm",
    "pts": 20,
    "question": "Giá trị của biểu thức $\\sqrt{(-11)^2}$ bằng:",
    "options": [
      {
        "text": "$11$",
        "correct": true
      },
      {
        "text": "$-11$",
        "correct": false
      },
      {
        "text": "$\\pm 11$",
        "correct": false
      },
      {
        "text": "$121$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng hằng đẳng thức $\\sqrt{A^2} = |A|$: $\\sqrt{(-11)^2} = |-11| = 11$."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Rút Gọn Biểu Thức Hiệu Vô Tỉ",
    "pts": 20,
    "question": "Rút gọn biểu thức $M = \\sqrt{(\\sqrt{5} - 3)^2}$ ta được kết quả là:",
    "options": [
      {
        "text": "$3 - \\sqrt{5}$",
        "correct": true
      },
      {
        "text": "$\\sqrt{5} - 3$",
        "correct": false
      },
      {
        "text": "$\\sqrt{5} + 3$",
        "correct": false
      },
      {
        "text": "$-3 - \\sqrt{5}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\sqrt{(\\sqrt{5} - 3)^2} = |\\sqrt{5} - 3|$. Vì $5 < 9 \\implies \\sqrt{5} < 3 \\implies \\sqrt{5} - 3 < 0$. Do đó $|\\sqrt{5} - 3| = -(\\sqrt{5} - 3) = 3 - \\sqrt{5}$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Rút Gọn Chứa Biến Số Có Điều Kiện",
    "pts": 20,
    "question": "Với $x \\ge 2$, rút gọn biểu thức $P = \\sqrt{(x - 2)^2} + 5$ ta được:",
    "options": [
      {
        "text": "$x + 3$",
        "correct": true
      },
      {
        "text": "$x + 7$",
        "correct": false
      },
      {
        "text": "$7 - x$",
        "correct": false
      },
      {
        "text": "$3 - x$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\sqrt{(x - 2)^2} = |x - 2|$. Vì $x \\ge 2 \\implies x - 2 \\ge 0 \\implies |x - 2| = x - 2$. Do đó $P = x - 2 + 5 = x + 3$."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: So Sánh Hai Căn Bậc Hai",
    "pts": 20,
    "question": "So sánh hai số $3\\sqrt{2}$ và $\\sqrt{19}$:",
    "options": [
      {
        "text": "$3\\sqrt{2} < \\sqrt{19}$",
        "correct": true
      },
      {
        "text": "$3\\sqrt{2} > \\sqrt{19}$",
        "correct": false
      },
      {
        "text": "$3\\sqrt{2} = \\sqrt{19}$",
        "correct": false
      },
      {
        "text": "Không so sánh được",
        "correct": false
      }
    ],
    "explanation": "Ta có $3\\sqrt{2} = \\sqrt{3^2 \\times 2} = \\sqrt{9 \\times 2} = \\sqrt{18}$. Vì $18 < 19$ nên $\\sqrt{18} < \\sqrt{19}$, tức $3\\sqrt{2} < \\sqrt{19}$."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Điều Kiện Dưới Mẫu Chứa Căn",
    "pts": 20,
    "question": "Biểu thức $\\frac{1}{\\sqrt{x - 4}}$ có nghĩa khi:",
    "options": [
      {
        "text": "$x > 4$",
        "correct": true
      },
      {
        "text": "$x \\ge 4$",
        "correct": false
      },
      {
        "text": "$x < 4$",
        "correct": false
      },
      {
        "text": "$x \\neq 4$",
        "correct": false
      }
    ],
    "explanation": "Biểu thức dưới dấu căn vừa phải không âm ($x - 4 \\ge 0$), vừa phải khác 0 do nằm ở mẫu thức ($x - 4 \\neq 0$). Kết hợp lại ta được $x - 4 > 0 \\iff x > 4$."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Tìm x Trong Phương Trình Căn Thức",
    "pts": 20,
    "question": "Tìm $x$ biết $\\sqrt{x^2} = 7$:",
    "options": [
      {
        "text": "$x = 7$ hoặc $x = -7$",
        "correct": true
      },
      {
        "text": "Chỉ có $x = 7$",
        "correct": false
      },
      {
        "text": "Chỉ có $x = -7$",
        "correct": false
      },
      {
        "text": "$x = 49$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\sqrt{x^2} = |x|$. Phương trình $|x| = 7 \\iff x = 7$ hoặc $x = -7$."
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

      if (target === 'theory') unlockBadge(0);
      if (target === 'labs') {
        unlockBadge(1);
        initLabs();
      }
    });
  });
}

function initAvatarModal() {
  const btn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const closeBtn = document.getElementById('btnCloseModal');
  const choices = document.querySelectorAll('.avatar-choice');

  if (btn && modal) {
    btn.addEventListener('click', () => {
      sound.playClick();
      modal.style.display = 'flex';
    });
  }

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
                const sA = document.getElementById('sliderSqrtA');
                const tA = document.getElementById('txtSqrtA');
                const out = document.getElementById('lab1SqrtOutput');

                function updateSqrt() {
                    const a = parseFloat(sA.value);
                    tA.textContent = a;

                    const root = Math.sqrt(a);

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Draw square with area = a
                    const maxSidePx = 130;
                    const sidePx = Math.min(maxSidePx, root * 16);
                    const startX = 60;
                    const startY = h / 2 - sidePx / 2;

                    ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
                    ctx.fillRect(startX, startY, sidePx, sidePx);
                    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5;
                    ctx.strokeRect(startX, startY, sidePx, sidePx);

                    // Labels
                    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Segoe UI'; ctx.textAlign = 'center';
                    if (sidePx > 30) {
                        ctx.fillText(`Diện tích S = ${a}`, startX + sidePx / 2, startY + sidePx / 2 + 5);
                        ctx.fillText(`cạnh = ${root.toFixed(2)}`, startX + sidePx / 2, startY + sidePx + 20);
                    }

                    // Number comparison table on right
                    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 15px Segoe UI'; ctx.textAlign = 'left';
                    ctx.fillText('QUAN HỆ BÌNH PHƯƠNG & CĂN BẬC HAI', 250, 45);

                    ctx.fillStyle = '#94a3b8'; ctx.font = '13px Segoe UI';
                    ctx.fillText(`• Số không âm: a = ${a}`, 260, 80);
                    ctx.fillText(`• Căn bậc hai số học: √${a} = ${root.toFixed(3)}`, 260, 110);
                    ctx.fillText(`• Hai căn bậc hai của ${a}: +${root.toFixed(3)} và -${root.toFixed(3)}`, 260, 140);
                    ctx.fillText(`• Kiểm chứng: (${root.toFixed(3)})² = ${a}`, 260, 170);

                    out.innerHTML = `<strong>Số $a = ${a}$:</strong> Căn bậc hai số học là $\\sqrt{${a}} = ${root.toFixed(2)}$. <br>Mọi hình vuông có diện tích $S = ${a}$ thì độ dài cạnh chính là $\\sqrt{${a}} = ${root.toFixed(2)}$.`;
                    if (window.renderMathInElement) {
                        renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                sA.addEventListener('input', updateSqrt);
                updateSqrt();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const outEl = document.getElementById('lab2AbsOutput');

                function renderAbsCase(step1, step2, step3, ruleText) {
                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('QUY TRÌNH ÁP DỤNG HẰNG ĐẲNG THỨC: √(A²) = |A|', 25, 35);

                    ctx.fillStyle = '#fde047'; ctx.font = '14px Segoe UI';
                    ctx.fillText(`Bước 1 (Lấy giá trị tuyệt đối): ${step1}`, 35, 75);

                    ctx.fillStyle = '#94a3b8';
                    ctx.fillText(`Bước 2 (Xét dấu của biểu thức A): ${step2}`, 35, 110);

                    ctx.fillStyle = '#34d399'; ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText(`Bước 3 (Phá dấu trị tuyệt đối): ${step3}`, 35, 150);

                    outEl.innerHTML = `<strong>Khai triển:</strong> $${step1} = ${step3}$. <br><span style="color: #38bdf8; font-weight: bold;">Ghi nhớ:</span> ${ruleText}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                document.getElementById('btnCasePos').addEventListener('click', () => {
                    renderAbsCase('\\sqrt{5^2} = |5|', '5 > 0 nên giữ nguyên', '5', 'Vì A = 5 ≥ 0 nên |5| = 5.');
                });
                document.getElementById('btnCaseNeg').addEventListener('click', () => {
                    renderAbsCase('\\sqrt{(-7)^2} = |-7|', '-7 < 0 nên đổi dấu thành -(-7)', '7', 'Vì A = -7 < 0 nên |-7| = -(-7) = 7 (kết quả căn luôn dương!).');
                });
                document.getElementById('btnCaseDiff').addEventListener('click', () => {
                    renderAbsCase('\\sqrt{(\\sqrt{3} - 2)^2} = |\\sqrt{3} - 2|', 'Vì 3 < 4 => √3 < 2 => √3 - 2 < 0', '2 - \\sqrt{3}', 'Vì biểu thức trong căn âm nên phá trị tuyệt đối phải đổi dấu thành -(√3 - 2) = 2 - √3.');
                });
                document.getElementById('btnCaseVar').addEventListener('click', () => {
                    renderAbsCase('\\sqrt{(x - 3)^2} = |x - 3|', 'Tùy thuộc vào điều kiện của x', 'x - 3 \\text{ (nếu } x \\ge 3) \\text{ hoặc } 3 - x \\text{ (nếu } x < 3)', 'Với biến số, luôn chia hai trường hợp x ≥ 3 và x < 3.');
                });

                renderAbsCase('\\sqrt{5^2} = |5|', '5 > 0 nên giữ nguyên', '5', 'Vì A = 5 ≥ 0 nên |5| = 5.');
            
    if (typeof initLab2 === 'function') initLab2();
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
