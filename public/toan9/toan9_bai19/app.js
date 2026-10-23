// ================================================================
// Bài 19: Phương Trình Bậc Hai Một Ẩn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai19_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Biệt Thức Delta 9',
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
    "title": "Câu 1: Nhận diện hệ số phương trình",
    "pts": 20,
    "question": "Phương trình $2x^2 - 5x + 3 = 0$ có các hệ số $a, b, c$ lần lượt là:",
    "options": [
      {
        "text": "$a = 2,\\ b = 5,\\ c = 3$",
        "correct": false
      },
      {
        "text": "$a = 2,\\ b = -5,\\ c = 3$",
        "correct": true
      },
      {
        "text": "$a = 2,\\ b = -5,\\ c = -3$",
        "correct": false
      },
      {
        "text": "$a = -5,\\ b = 2,\\ c = 3$",
        "correct": false
      }
    ],
    "explanation": "Phương trình dạng $ax^2 + bx + c = 0$, so sánh ta có $a = 2$, $b = -5$, $c = 3$."
  },
  {
    "id": 2,
    "title": "Câu 2: Biệt thức Delta",
    "pts": 20,
    "question": "Biệt thức $\\Delta$ của phương trình $x^2 - 4x + 4 = 0$ là:",
    "options": [
      {
        "text": "$\\Delta = 0$",
        "correct": true
      },
      {
        "text": "$\\Delta = 16$",
        "correct": false
      },
      {
        "text": "$\\Delta = -16$",
        "correct": false
      },
      {
        "text": "$\\Delta = 32$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\Delta = b^2 - 4ac = (-4)^2 - 4 \\cdot 1 \\cdot 4 = 16 - 16 = 0$."
  },
  {
    "id": 3,
    "title": "Câu 3: Số nghiệm của phương trình",
    "pts": 20,
    "question": "Phương trình $3x^2 + 2x + 1 = 0$ có bao nhiêu nghiệm?",
    "options": [
      {
        "text": "2 nghiệm phân biệt",
        "correct": false
      },
      {
        "text": "1 nghiệm kép",
        "correct": false
      },
      {
        "text": "Vô nghiệm",
        "correct": true
      },
      {
        "text": "Vô số nghiệm",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\Delta = 2^2 - 4 \\cdot 3 \\cdot 1 = 4 - 12 = -8 < 0$. Do $\\Delta < 0$ nên phương trình vô nghiệm trên $\\mathbb{R}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Nghiệm của phương trình khuyết",
    "pts": 20,
    "question": "Nghiệm của phương trình $2x^2 - 8 = 0$ là:",
    "options": [
      {
        "text": "$x = 2$",
        "correct": false
      },
      {
        "text": "$x = \\pm 2$",
        "correct": true
      },
      {
        "text": "$x = 4$",
        "correct": false
      },
      {
        "text": "$x = \\pm 4$",
        "correct": false
      }
    ],
    "explanation": "$2x^2 - 8 = 0 \\iff 2x^2 = 8 \\iff x^2 = 4 \\iff x = \\pm 2$."
  },
  {
    "id": 5,
    "title": "Câu 5: Công thức nghiệm thu gọn",
    "pts": 20,
    "question": "Cho phương trình $x^2 - 6x + 5 = 0$. Biệt thức thu gọn $\\Delta'$ bằng bao nhiêu?",
    "options": [
      {
        "text": "$\\Delta' = 4$",
        "correct": true
      },
      {
        "text": "$\\Delta' = 16$",
        "correct": false
      },
      {
        "text": "$\\Delta' = 9$",
        "correct": false
      },
      {
        "text": "$\\Delta' = -4$",
        "correct": false
      }
    ],
    "explanation": "Với $b = -6$, ta có $b' = \\frac{-6}{2} = -3$. $\\Delta' = b'^2 - ac = (-3)^2 - 1 \\cdot 5 = 9 - 5 = 4$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tìm nghiệm của phương trình bậc hai",
    "pts": 20,
    "question": "Tập nghiệm của phương trình $x^2 - 5x + 6 = 0$ là:",
    "options": [
      {
        "text": "$S = \\{-2; -3\\}$",
        "correct": false
      },
      {
        "text": "$S = \\{2; 3\\}$",
        "correct": true
      },
      {
        "text": "$S = \\{1; 6\\}$",
        "correct": false
      },
      {
        "text": "$S = \\{-1; -6\\}$",
        "correct": false
      }
    ],
    "explanation": "$\\Delta = (-5)^2 - 4 \\cdot 1 \\cdot 6 = 25 - 24 = 1 > 0$. $x_1 = \\frac{5 + 1}{2} = 3$, $x_2 = \\frac{5 - 1}{2} = 2$."
  },
  {
    "id": 7,
    "title": "Câu 7: Tìm m để phương trình có nghiệm kép",
    "pts": 20,
    "question": "Phương trình $x^2 - 2mx + 9 = 0$ có nghiệm kép khi và chỉ khi:",
    "options": [
      {
        "text": "$m = 3$",
        "correct": false
      },
      {
        "text": "$m = -3$",
        "correct": false
      },
      {
        "text": "$m = \\pm 3$",
        "correct": true
      },
      {
        "text": "$m = 9$",
        "correct": false
      }
    ],
    "explanation": "Ta có $b' = -m$. Để phương trình có nghiệm kép thì $\\Delta' = 0 \\iff (-m)^2 - 1 \\cdot 9 = 0 \\iff m^2 = 9 \\iff m = \\pm 3$."
  },
  {
    "id": 8,
    "title": "Câu 8: Giải phương trình khuyết tự do",
    "pts": 20,
    "question": "Tập nghiệm của phương trình $3x^2 - 6x = 0$ là:",
    "options": [
      {
        "text": "$S = \\{0; 2\\}$",
        "correct": true
      },
      {
        "text": "$S = \\{2\\}$",
        "correct": false
      },
      {
        "text": "$S = \\{0; -2\\}$",
        "correct": false
      },
      {
        "text": "$S = \\{0\\}$",
        "correct": false
      }
    ],
    "explanation": "$3x^2 - 6x = 0 \\iff 3x(x - 2) = 0 \\iff x = 0$ hoặc $x = 2$."
  },
  {
    "id": 9,
    "title": "Câu 9: Dấu hiệu nhận biết 2 nghiệm trái dấu",
    "pts": 20,
    "question": "Nếu phương trình $ax^2 + bx + c = 0\\ (a \\ne 0)$ có tích $ac < 0$ thì phương trình:",
    "options": [
      {
        "text": "Luôn có hai nghiệm phân biệt trái dấu",
        "correct": true
      },
      {
        "text": "Luôn có nghiệm kép",
        "correct": false
      },
      {
        "text": "Luôn vô nghiệm",
        "correct": false
      },
      {
        "text": "Có thể có 1 nghiệm hoặc vô nghiệm",
        "correct": false
      }
    ],
    "explanation": "Vì $ac < 0$ nên $-4ac > 0$, do đó $\\Delta = b^2 - 4ac > 0$ với mọi $b$. Hơn nữa hai nghiệm trái dấu vì $x_1 x_2 = \\frac{c}{a} < 0$."
  },
  {
    "id": 10,
    "title": "Câu 10: Nghiệm kép",
    "pts": 20,
    "question": "Nghiệm kép của phương trình $4x^2 - 12x + 9 = 0$ là:",
    "options": [
      {
        "text": "$x = \\frac{3}{2}$",
        "correct": true
      },
      {
        "text": "$x = -\\frac{3}{2}$",
        "correct": false
      },
      {
        "text": "$x = 3$",
        "correct": false
      },
      {
        "text": "$x = \\frac{9}{4}$",
        "correct": false
      }
    ],
    "explanation": "Phương trình tương đương $(2x - 3)^2 = 0 \\iff 2x - 3 = 0 \\iff x = \\frac{3}{2}$."
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
                const inA = document.getElementById('inpA');
                const inB = document.getElementById('inpB');
                const inC = document.getElementById('inpC');
                const btn = document.getElementById('btnSolve');
                const out = document.getElementById('lab1Output');

                function solveAndDraw() {
                    let a = parseFloat(inA.value);
                    const b = parseFloat(inB.value);
                    const c = parseFloat(inC.value);

                    if (isNaN(a) || a === 0) {
                        out.innerHTML = '<span style="color:#ef4444;">Hệ số a phải khác 0!</span>';
                        return;
                    }

                    const delta = b * b - 4 * a * c;
                    const w = canvas.width;
                    const h = canvas.height;
                    const ox = w / 2;
                    const oy = h / 2;
                    const scale = 25;

                    ctx.clearRect(0, 0, w, h);

                    // Grid
                    ctx.strokeStyle = '#1e293b';
                    ctx.lineWidth = 1;
                    for (let x = ox % scale; x < w; x += scale) {
                        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
                    }
                    for (let y = oy % scale; y < h; y += scale) {
                        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                    }

                    // Axes
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

                    // Curve y = ax^2 + bx + c
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    let started = false;
                    for (let px = 0; px <= w; px += 2) {
                        const xm = (px - ox) / scale;
                        const ym = a * xm * xm + b * xm + c;
                        const py = oy - ym * scale;
                        if (py >= -50 && py <= h + 50) {
                            if (!started) { ctx.moveTo(px, py); started = true; }
                            else ctx.lineTo(px, py);
                        }
                    }
                    ctx.stroke();

                    let rootsText = '';
                    if (delta > 0) {
                        const x1 = (-b + Math.sqrt(delta)) / (2 * a);
                        const x2 = (-b - Math.sqrt(delta)) / (2 * a);
                        [x1, x2].forEach(rx => {
                            const px = ox + rx * scale;
                            ctx.fillStyle = '#22c55e';
                            ctx.beginPath(); ctx.arc(px, oy, 6, 0, Math.PI * 2); ctx.fill();
                            ctx.fillStyle = '#f8fafc';
                            ctx.font = '12px sans-serif';
                            ctx.fillText(`x = ${rx.toFixed(2)}`, px - 15, oy + 20);
                        });
                        rootsText = `$\\Delta = ${delta.toFixed(2)} > 0$ &rarr; 2 nghiệm phân biệt: $x_1 = ${x1.toFixed(3)},\ x_2 = ${x2.toFixed(3)}$`;
                    } else if (Math.abs(delta) < 1e-6) {
                        const x0 = -b / (2 * a);
                        const px = ox + x0 * scale;
                        ctx.fillStyle = '#f59e0b';
                        ctx.beginPath(); ctx.arc(px, oy, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#f8fafc';
                        ctx.font = '12px sans-serif';
                        ctx.fillText(`x1=x2 = ${x0.toFixed(2)}`, px - 25, oy + 20);
                        rootsText = `$\\Delta = 0$ &rarr; Nghiệm kép: $x_1 = x_2 = ${x0.toFixed(3)}$`;
                    } else {
                        rootsText = `$\\Delta = ${delta.toFixed(2)} < 0$ &rarr; Phương trình VÔ NGHIỆM trên $\\mathbb{R}$ (Parabol không cắt trục hoành).`;
                    }

                    out.innerHTML = `<strong>Kết quả:</strong> ${rootsText}`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                btn.addEventListener('click', solveAndDraw);
                [inA, inB, inC].forEach(el => el.addEventListener('change', solveAndDraw));
                solveAndDraw();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const sK = document.getElementById('sliderK');
                const sX = document.getElementById('sliderX');
                const out2 = document.getElementById('lab2Output');

                function drawGeometry() {
                    const k = parseFloat(sK.value);
                    const x = parseFloat(sX.value);
                    document.getElementById('valK').textContent = 'k = ' + k;
                    document.getElementById('valX').textContent = 'x = ' + x;

                    const cw = c2.width;
                    const ch = c2.height;
                    ctx2.clearRect(0, 0, cw, ch);

                    const scale = 22;
                    const ox = 100;
                    const oy = 60;

                    const pxX = x * scale;
                    const pxK = k * scale;

                    // Main square x * x
                    ctx2.fillStyle = '#3b82f6';
                    ctx2.fillRect(ox, oy, pxX, pxX);
                    ctx2.strokeStyle = '#60a5fa';
                    ctx2.lineWidth = 2;
                    ctx2.strokeRect(ox, oy, pxX, pxX);

                    // Right rectangle x * k
                    ctx2.fillStyle = '#10b981';
                    ctx2.fillRect(ox + pxX, oy, pxK, pxX);
                    ctx2.strokeStyle = '#34d399';
                    ctx2.strokeRect(ox + pxX, oy, pxK, pxX);

                    // Bottom rectangle k * x
                    ctx2.fillStyle = '#10b981';
                    ctx2.fillRect(ox, oy + pxX, pxX, pxK);
                    ctx2.strokeStyle = '#34d399';
                    ctx2.strokeRect(ox, oy + pxX, pxX, pxK);

                    // Corner square k * k
                    ctx2.fillStyle = '#f59e0b';
                    ctx2.fillRect(ox + pxX, oy + pxX, pxK, pxK);
                    ctx2.strokeStyle = '#fbbf24';
                    ctx2.strokeRect(ox + pxX, oy + pxX, pxK, pxK);

                    // Text labels
                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = '14px sans-serif';
                    ctx2.fillText(`x² (${(x*x).toFixed(1)})`, ox + pxX/2 - 20, oy + pxX/2);
                    ctx2.fillText(`kx (${(k*x).toFixed(1)})`, ox + pxX + 8, oy + pxX/2);
                    ctx2.fillText(`kx (${(k*x).toFixed(1)})`, ox + pxX/2 - 20, oy + pxX + pxK/2 + 5);
                    ctx2.fillText(`k² (${(k*k).toFixed(1)})`, ox + pxX + 8, oy + pxX + pxK/2 + 5);

                    // Dimension lines
                    ctx2.fillStyle = '#94a3b8';
                    ctx2.font = '12px sans-serif';
                    ctx2.fillText(`x = ${x}`, ox + pxX/2 - 10, oy - 10);
                    ctx2.fillText(`k = ${k}`, ox + pxX + pxK/2 - 10, oy - 10);

                    out2.innerHTML = `<strong>Công thức ghép hình:</strong> $x^2 + 2kx + k^2 = (x + k)^2$ &hArr; Diện tích toàn phần $= (${x} + ${k})^2 = ${(x+k)*(x+k)}$. Góc màu vàng chính là lượng cần bù thêm $k^2 = ${k*k}$.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                sK.addEventListener('input', drawGeometry);
                sX.addEventListener('input', drawGeometry);
                drawGeometry();
            
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
