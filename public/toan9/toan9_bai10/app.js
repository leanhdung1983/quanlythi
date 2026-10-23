// ================================================================
// Bài 10: Căn Bậc Ba Và Căn Thức Bậc Ba - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai10_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Khai Phương Bậc Ba 9',
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
    "title": "Thử Thách 1: Căn Bậc Ba Của Số Dương",
    "pts": 20,
    "question": "Căn bậc ba của 64 là:",
    "options": [
      {
        "text": "$4$",
        "correct": true
      },
      {
        "text": "$\\pm 4$",
        "correct": false
      },
      {
        "text": "$8$",
        "correct": false
      },
      {
        "text": "$16$",
        "correct": false
      }
    ],
    "explanation": "Vì $4^3 = 64$ nên $\\sqrt[3]{64} = 4$. Căn bậc ba của một số luôn là duy nhất."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Căn Bậc Ba Của Số Âm",
    "pts": 20,
    "question": "Giá trị của $\\sqrt[3]{-125}$ bằng:",
    "options": [
      {
        "text": "$-5$",
        "correct": true
      },
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "Không tồn tại",
        "correct": false
      },
      {
        "text": "$\\pm 5$",
        "correct": false
      }
    ],
    "explanation": "Vì $(-5)^3 = -125$ nên $\\sqrt[3]{-125} = -5$."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Điều Kiện Xác Định Của Căn Thức Bậc Ba",
    "pts": 20,
    "question": "Căn thức bậc ba $\\sqrt[3]{2x - 5}$ xác định với các giá trị của $x$ là:",
    "options": [
      {
        "text": "Mọi số thực $x \\in \\mathbb{R}$",
        "correct": true
      },
      {
        "text": "$x \\ge \\frac{5}{2}$",
        "correct": false
      },
      {
        "text": "$x > \\frac{5}{2}$",
        "correct": false
      },
      {
        "text": "$x \\neq \\frac{5}{2}$",
        "correct": false
      }
    ],
    "explanation": "Căn bậc ba xác định với mọi số thực, do đó $\\sqrt[3]{2x - 5}$ có nghĩa với mọi $x \\in \\mathbb{R}$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Nhân Hai Căn Bậc Ba",
    "pts": 20,
    "question": "Tính tích $\\sqrt[3]{2} \\cdot \\sqrt[3]{32}$:",
    "options": [
      {
        "text": "$4$",
        "correct": true
      },
      {
        "text": "$8$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$16$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\sqrt[3]{2} \\cdot \\sqrt[3]{32} = \\sqrt[3]{2 \\times 32} = \\sqrt[3]{64} = 4$."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Chia Hai Căn Bậc Ba",
    "pts": 20,
    "question": "Tính thương $\\frac{\\sqrt[3]{-54}}{\\sqrt[3]{2}}$:",
    "options": [
      {
        "text": "$-3$",
        "correct": true
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$-27$",
        "correct": false
      },
      {
        "text": "Không xác định",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{\\sqrt[3]{-54}}{\\sqrt[3]{2}} = \\sqrt[3]{\\frac{-54}{2}} = \\sqrt[3]{-27} = -3$."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Khai Căn Lập Phương",
    "pts": 20,
    "question": "Giá trị của biểu thức $\\sqrt[3]{(x - 2)^3}$ bằng:",
    "options": [
      {
        "text": "$x - 2$",
        "correct": true
      },
      {
        "text": "$|x - 2|$",
        "correct": false
      },
      {
        "text": "$2 - x$",
        "correct": false
      },
      {
        "text": "$(x - 2)^3$",
        "correct": false
      }
    ],
    "explanation": "Với mọi số thực $A$, ta luôn có $\\sqrt[3]{A^3} = A$ (không cần dấu giá trị tuyệt đối). Do đó $\\sqrt[3]{(x - 2)^3} = x - 2$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Giải Phương Trình Chứa Căn Bậc Ba",
    "pts": 20,
    "question": "Nghiệm của phương trình $\\sqrt[3]{x - 1} = 3$ là:",
    "options": [
      {
        "text": "$x = 28$",
        "correct": true
      },
      {
        "text": "$x = 10$",
        "correct": false
      },
      {
        "text": "$x = 26$",
        "correct": false
      },
      {
        "text": "$x = 8$",
        "correct": false
      }
    ],
    "explanation": "Lập phương hai vế: $(\\sqrt[3]{x - 1})^3 = 3^3 \\iff x - 1 = 27 \\iff x = 28$."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: So Sánh Hai Căn Bậc Ba",
    "pts": 20,
    "question": "So sánh hai số $2\\sqrt[3]{3}$ và $\\sqrt[3]{25}$:",
    "options": [
      {
        "text": "$2\\sqrt[3]{3} < \\sqrt[3]{25}$",
        "correct": true
      },
      {
        "text": "$2\\sqrt[3]{3} > \\sqrt[3]{25}$",
        "correct": false
      },
      {
        "text": "$2\\sqrt[3]{3} = \\sqrt[3]{25}$",
        "correct": false
      },
      {
        "text": "Không so sánh được",
        "correct": false
      }
    ],
    "explanation": "Đưa thừa số 2 vào trong căn bậc ba: $2\\sqrt[3]{3} = \\sqrt[3]{2^3 \\times 3} = \\sqrt[3]{8 \\times 3} = \\sqrt[3]{24}$. Vì $24 < 25$ nên $\\sqrt[3]{24} < \\sqrt[3]{25}$, tức $2\\sqrt[3]{3} < \\sqrt[3]{25}$."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Rút Gọn Biểu Thức Tổng Căn Bậc Ba",
    "pts": 20,
    "question": "Rút gọn biểu thức $T = \\sqrt[3]{8} + \\sqrt[3]{-27} - \\sqrt[3]{-1}$:",
    "options": [
      {
        "text": "$0$",
        "correct": true
      },
      {
        "text": "$-2$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$-4$",
        "correct": false
      }
    ],
    "explanation": "Tính từng căn bậc ba: $\\sqrt[3]{8} = 2$; $\\sqrt[3]{-27} = -3$; $\\sqrt[3]{-1} = -1$. Do đó $T = 2 + (-3) - (-1) = 2 - 3 + 1 = 0$."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Bài Toán Thể Tích Khối Kim Loại Lập Phương",
    "pts": 20,
    "question": "Một khối kim loại hình lập phương có thể tích bằng $0,216\\text{ m}^3$. Độ dài mỗi cạnh của khối kim loại là:",
    "options": [
      {
        "text": "$0,6\\text{ m}$",
        "correct": true
      },
      {
        "text": "$0,06\\text{ m}$",
        "correct": false
      },
      {
        "text": "$0,36\\text{ m}$",
        "correct": false
      },
      {
        "text": "$6\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Độ dài cạnh của hình lập phương là căn bậc ba của thể tích: $a = \\sqrt[3]{0,216} = \\sqrt[3]{\\frac{216}{1000}} = \\frac{6}{10} = 0,6\\text{ m}$."
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
                const sV = document.getElementById('sliderVol');
                const tV = document.getElementById('txtVol');
                const out = document.getElementById('lab1CubeOutput');

                function drawCube() {
                    const V = parseFloat(sV.value);
                    tV.textContent = V;

                    const root3 = Math.cbrt(V);

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Draw 3D isometric cube
                    const absRoot = Math.abs(root3);
                    const side = Math.min(80, Math.max(15, absRoot * 18));
                    const ox = 120;
                    const oy = h / 2 + 20;

                    // Isometric projection
                    const dx = side * 0.7;
                    const dy = side * 0.4;

                    const color = V >= 0 ? '#38bdf8' : '#f43f5e';

                    // Front face
                    ctx.fillStyle = color;
                    ctx.globalAlpha = 0.4;
                    ctx.fillRect(ox - side / 2, oy - side / 2, side, side);
                    ctx.globalAlpha = 1;
                    ctx.strokeStyle = color; ctx.lineWidth = 2;
                    ctx.strokeRect(ox - side / 2, oy - side / 2, side, side);

                    // Top face
                    ctx.beginPath();
                    ctx.moveTo(ox - side / 2, oy - side / 2);
                    ctx.lineTo(ox - side / 2 + dx, oy - side / 2 - dy);
                    ctx.lineTo(ox + side / 2 + dx, oy - side / 2 - dy);
                    ctx.lineTo(ox + side / 2, oy - side / 2);
                    ctx.closePath();
                    ctx.fillStyle = V >= 0 ? '#0284c7' : '#e11d48';
                    ctx.fill(); ctx.stroke();

                    // Right face
                    ctx.beginPath();
                    ctx.moveTo(ox + side / 2, oy - side / 2);
                    ctx.lineTo(ox + side / 2 + dx, oy - side / 2 - dy);
                    ctx.lineTo(ox + side / 2 + dx, oy + side / 2 - dy);
                    ctx.lineTo(ox + side / 2, oy + side / 2);
                    ctx.closePath();
                    ctx.fillStyle = V >= 0 ? '#0369a1' : '#be123c';
                    ctx.fill(); ctx.stroke();

                    // Info
                    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 15px Segoe UI'; ctx.textAlign = 'left';
                    ctx.fillText('CĂN BẬC BA CỦA SỐ THỰC', 260, 45);

                    ctx.fillStyle = '#94a3b8'; ctx.font = '13px Segoe UI';
                    ctx.fillText(`• Thể tích khối V = ${V}`, 270, 80);
                    ctx.fillText(`• Cạnh a = ³√${V} = ${root3.toFixed(3)}`, 270, 110);
                    ctx.fillText(`• Thử lại: (${root3.toFixed(3)})³ = ${V}`, 270, 140);

                    out.innerHTML = `<strong>Thể tích $V = ${V}$:</strong> Căn bậc ba là $\\sqrt[3]{${V}} = ${root3.toFixed(2)}$. Cạnh khối lập phương là $a = ${root3.toFixed(2)}$.`;
                    if (window.renderMathInElement) {
                        renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                sV.addEventListener('input', drawCube);
                drawCube();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const outEl = document.getElementById('lab2CompOutput');

                function compare(val) {
                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText(`SO SÁNH CĂN BẬC HAI VÀ CĂN BẬC BA CỦA SỐ: ${val}`, 25, 35);

                    ctx.fillStyle = '#fde047'; ctx.font = '14px Segoe UI';
                    let sqrtText = '';
                    if (val > 0) sqrtText = `√${val} = ${Math.sqrt(val)} (Có 2 căn bậc hai: ±${Math.sqrt(val)})`;
                    else if (val === 0) sqrtText = '√0 = 0 (Đúng 1 căn bậc hai)';
                    else sqrtText = `√(${val}) KHÔNG TỒN TẠI trong tập số thực R!`;

                    ctx.fillText(`1. Căn bậc hai (chỉ số chẵn 2): ${sqrtText}`, 35, 75);

                    ctx.fillStyle = '#34d399';
                    const cbrtVal = Math.cbrt(val);
                    ctx.fillText(`2. Căn bậc ba (chỉ số lẻ 3): ³√(${val}) = ${cbrtVal.toFixed(2)} (DUY NHẤT 1 GIÁ TRỊ)`, 35, 115);

                    outEl.innerHTML = `<strong>Với số $a = ${val}$:</strong> <br>• Căn bậc hai: <em>${val < 0 ? 'Không tồn tại vì số âm không có căn bậc hai' : `$\\sqrt{${val}} = ${Math.sqrt(val)}$`}</em>. <br>• Căn bậc ba: <em>Luôn tồn tại duy nhất $\\sqrt[3]{${val}} = ${cbrtVal.toFixed(2)}$</em>.`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                document.getElementById('btnCompPos').addEventListener('click', () => compare(64));
                document.getElementById('btnCompNeg').addEventListener('click', () => compare(-64));
                document.getElementById('btnCompZero').addEventListener('click', () => compare(0));

                compare(64);
            
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
