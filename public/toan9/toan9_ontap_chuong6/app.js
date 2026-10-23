// ================================================================
// Ôn Tập Chương VI: Hàm Số $y = ax^2$ & Phương Trình Bậc Hai - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ontap_chuong6_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Tướng Quân Chương VI 9',
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
    "title": "Câu 1: Nhẩm nghiệm tổng hợp",
    "pts": 20,
    "question": "Nghiệm của phương trình $5x^2 - 7x + 2 = 0$ là:",
    "options": [
      {
        "text": "$x_1 = 1;\\ x_2 = \\frac{2}{5}$",
        "correct": true
      },
      {
        "text": "$x_1 = -1;\\ x_2 = -\\frac{2}{5}$",
        "correct": false
      },
      {
        "text": "$x_1 = 1;\\ x_2 = \\frac{5}{2}$",
        "correct": false
      },
      {
        "text": "$x_1 = 2;\\ x_2 = 5$",
        "correct": false
      }
    ],
    "explanation": "Ta có $a + b + c = 5 + (-7) + 2 = 0 \\implies x_1 = 1,\\ x_2 = \\frac{c}{a} = \\frac{2}{5}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Số giao điểm của Parabol và trục hoành",
    "pts": 20,
    "question": "Số giao điểm của đồ thị hàm số $y = -3x^2$ với trục hoành $Ox$ là:",
    "options": [
      {
        "text": "1 giao điểm duy nhất tại $O(0; 0)$",
        "correct": true
      },
      {
        "text": "2 giao điểm phân biệt",
        "correct": false
      },
      {
        "text": "0 giao điểm",
        "correct": false
      },
      {
        "text": "Vô số giao điểm",
        "correct": false
      }
    ],
    "explanation": "Giải $-3x^2 = 0 \\iff x = 0 \\implies y = 0$. Giao điểm duy nhất là gốc tọa độ $O(0; 0)$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính chất đồng biến, nghịch biến",
    "pts": 20,
    "question": "Hàm số $y = (2 - \\sqrt{5})x^2$ đồng biến trên khoảng nào?",
    "options": [
      {
        "text": "$(-\\infty; 0)$",
        "correct": true
      },
      {
        "text": "$(0; +\\infty)$",
        "correct": false
      },
      {
        "text": "$\\mathbb{R}$",
        "correct": false
      },
      {
        "text": "Không đồng biến trên khoảng nào",
        "correct": false
      }
    ],
    "explanation": "Vì $2 < \\sqrt{5}$ nên $a = 2 - \\sqrt{5} < 0$. Do đó hàm số đồng biến khi $x < 0$ (khoảng $(-\\infty; 0)$) và nghịch biến khi $x > 0$."
  },
  {
    "id": 4,
    "title": "Câu 4: Biệt thức Delta âm",
    "pts": 20,
    "question": "Phương trình $2x^2 - 3x + 5 = 0$ có biệt thức $\\Delta$ là:",
    "options": [
      {
        "text": "$\\Delta = -31 < 0$ (vô nghiệm)",
        "correct": true
      },
      {
        "text": "$\\Delta = 31 > 0$",
        "correct": false
      },
      {
        "text": "$\\Delta = -49 < 0$",
        "correct": false
      },
      {
        "text": "$\\Delta = 49 > 0$",
        "correct": false
      }
    ],
    "explanation": "$\\Delta = b^2 - 4ac = (-3)^2 - 4 \\cdot 2 \\cdot 5 = 9 - 40 = -31 < 0$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tổng bình phương nghiệm",
    "pts": 20,
    "question": "Gọi $x_1, x_2$ là hai nghiệm của phương trình $x^2 - 6x + 4 = 0$. Giá trị của $x_1^2 + x_2^2$ bằng:",
    "options": [
      {
        "text": "28",
        "correct": true
      },
      {
        "text": "36",
        "correct": false
      },
      {
        "text": "32",
        "correct": false
      },
      {
        "text": "44",
        "correct": false
      }
    ],
    "explanation": "$x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2 = 6^2 - 2 \\cdot 4 = 36 - 8 = 28$."
  },
  {
    "id": 6,
    "title": "Câu 6: Phương trình trùng phương",
    "pts": 20,
    "question": "Số nghiệm phân biệt của phương trình $x^4 - 13x^2 + 36 = 0$ là:",
    "options": [
      {
        "text": "4 nghiệm",
        "correct": true
      },
      {
        "text": "2 nghiệm",
        "correct": false
      },
      {
        "text": "0 nghiệm",
        "correct": false
      },
      {
        "text": "1 nghiệm",
        "correct": false
      }
    ],
    "explanation": "Đặt $t = x^2\\ (t \\ge 0) \\implies t^2 - 13t + 36 = 0 \\iff t = 4$ hoặc $t = 9$. Cho ra 4 nghiệm $x = \\pm 2,\\ x = \\pm 3$."
  },
  {
    "id": 7,
    "title": "Câu 7: Tương giao tiếp xúc",
    "pts": 20,
    "question": "Đường thẳng $y = mx - 1$ tiếp xúc với parabol $y = x^2$ khi giá trị của $m$ là:",
    "options": [
      {
        "text": "$m = \\pm 2$",
        "correct": true
      },
      {
        "text": "$m = 2$",
        "correct": false
      },
      {
        "text": "$m = -2$",
        "correct": false
      },
      {
        "text": "$m = \\pm 4$",
        "correct": false
      }
    ],
    "explanation": "Phương trình hoành độ: $x^2 - mx + 1 = 0$. Tiếp xúc $\\iff \\Delta = m^2 - 4 = 0 \\iff m = \\pm 2$."
  },
  {
    "id": 8,
    "title": "Câu 8: Bài toán thực tế tìm kích thước",
    "pts": 20,
    "question": "Một thửa ruộng hình chữ nhật có chu vi 100 m và diện tích 600 m². Chiều dài của thửa ruộng là:",
    "options": [
      {
        "text": "30 m",
        "correct": true
      },
      {
        "text": "20 m",
        "correct": false
      },
      {
        "text": "25 m",
        "correct": false
      },
      {
        "text": "35 m",
        "correct": false
      }
    ],
    "explanation": "Nửa chu vi $S = 50\\text{ m}$, diện tích $P = 600\\text{ m²}$. Hai kích thước là nghiệm $X^2 - 50X + 600 = 0 \\iff X = 30$ hoặc $X = 20$. Chiều dài là 30 m."
  },
  {
    "id": 9,
    "title": "Câu 9: Biểu thức tích nghiệm phân số",
    "pts": 20,
    "question": "Cho phương trình $2x^2 + 5x - 1 = 0$ có 2 nghiệm $x_1, x_2$. Giá trị biểu thức $C = (x_1 - 1)(x_2 - 1)$ là:",
    "options": [
      {
        "text": "3",
        "correct": true
      },
      {
        "text": "-3",
        "correct": false
      },
      {
        "text": "2",
        "correct": false
      },
      {
        "text": "-2",
        "correct": false
      }
    ],
    "explanation": "$C = x_1 x_2 - (x_1 + x_2) + 1 = -\\frac{1}{2} - \\left(-\\frac{5}{2}\\right) + 1 = -\\frac{1}{2} + \\frac{5}{2} + 1 = 2 + 1 = 3$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tọa độ giao điểm hai Parabol",
    "pts": 20,
    "question": "Số giao điểm của hai parabol $(P_1): y = x^2$ và $(P_2): y = -x^2 + 2$ là:",
    "options": [
      {
        "text": "2 giao điểm",
        "correct": true
      },
      {
        "text": "1 giao điểm",
        "correct": false
      },
      {
        "text": "0 giao điểm",
        "correct": false
      },
      {
        "text": "Vô số giao điểm",
        "correct": false
      }
    ],
    "explanation": "Phương trình hoành độ giao điểm: $x^2 = -x^2 + 2 \\iff 2x^2 = 2 \\iff x^2 = 1 \\iff x = \\pm 1$. Có 2 giao điểm phân biệt là $(1; 1)$ và $(-1; 1)$."
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
    
                const c1 = document.getElementById('labCanvas1');
                const ctx = c1.getContext('2d');
                const out1 = document.getElementById('lab1Output');
                let activeBranch = 1;

                const branches = [
                    { id: 1, title: 'Parabol y = ax²', desc: 'Đỉnh O(0; 0), trục đối xứng Oy. a > 0 lõm lên (min tại O); a < 0 lõm xuống (max tại O). 5 điểm đối xứng.', color: '#06b6d4' },
                    { id: 2, title: 'Delta & Nghiệm', desc: "Delta = b² - 4ac. Delta > 0: 2 nghiệm; Delta = 0: nghiệm kép; Delta < 0: vô nghiệm. Delta' = b'² - ac khi b chẵn.", color: '#3b82f6' },
                    { id: 3, title: 'Định lí Viète', desc: 'x1 + x2 = -b/a, x1.x2 = c/a. Nhẩm nghiệm a+b+c=0 và a-b+c=0. Hai số tổng S tích P là nghiệm X² - SX + P = 0.', color: '#10b981' },
                    { id: 4, title: 'Bài toán thực tế', desc: '3 bước: Chọn ẩn & ĐKXĐ -> Lập phương trình -> Giải & đối chiếu. Các dạng: ca-nô xuôi/ngược dòng, năng suất, diện tích.', color: '#f59e0b' }
                ];

                function drawMindmap() {
                    const cw = c1.width;
                    const ch = c1.height;
                    const ox = cw / 2;
                    const oy = ch / 2;
                    ctx.clearRect(0, 0, cw, ch);

                    // Center Node
                    ctx.fillStyle = '#6366f1';
                    ctx.beginPath(); ctx.arc(ox, oy, 42, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#a5b4fc';
                    ctx.lineWidth = 3; ctx.stroke();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px sans-serif';
                    ctx.fillText('CHƯƠNG VI', ox - 36, oy - 6);
                    ctx.fillText('ĐẠI SỐ 9', ox - 26, oy + 12);

                    // Branch positions
                    const pos = [
                        { x: ox - 180, y: oy - 80 },
                        { x: ox + 180, y: oy - 80 },
                        { x: ox + 180, y: oy + 80 },
                        { x: ox - 180, y: oy + 80 }
                    ];

                    branches.forEach((b, idx) => {
                        const p = pos[idx];
                        const isA = b.id === activeBranch;

                        // Connecting line
                        ctx.strokeStyle = isA ? b.color : '#334155';
                        ctx.lineWidth = isA ? 3 : 1.5;
                        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(p.x, p.y); ctx.stroke();

                        // Branch Box
                        ctx.fillStyle = isA ? b.color : '#1e293b';
                        ctx.strokeStyle = b.color;
                        ctx.lineWidth = isA ? 3 : 1;
                        ctx.beginPath();
                        ctx.roundRect(p.x - 70, p.y - 25, 140, 50, 10);
                        ctx.fill(); ctx.stroke();

                        ctx.fillStyle = '#ffffff';
                        ctx.font = isA ? 'bold 12px sans-serif' : '11px sans-serif';
                        ctx.fillText(b.title, p.x - 55, p.y + 5);
                    });

                    const curr = branches.find(b => b.id === activeBranch);
                    out1.innerHTML = `<strong>${curr.title}:</strong> ${curr.desc}`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                [1, 2, 3, 4].forEach(n => {
                    const el = document.getElementById('btnBranch' + n);
                    if (el) el.addEventListener('click', () => {
                        activeBranch = n;
                        drawMindmap();
                    });
                });

                drawMindmap();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const slA = document.getElementById('slRevA');
                const slM = document.getElementById('slRevM');
                const slN = document.getElementById('slRevN');
                const out2 = document.getElementById('lab2Output');

                function updateRev() {
                    let a = parseFloat(slA.value);
                    if (a === 0) a = 0.5;
                    const m = parseFloat(slM.value);
                    const n = parseFloat(slN.value);

                    document.getElementById('vRevA').textContent = 'a = ' + a.toFixed(1);
                    document.getElementById('vRevM').textContent = 'm = ' + m.toFixed(1);
                    document.getElementById('vRevN').textContent = 'n = ' + n.toFixed(1);

                    const cw = c2.width;
                    const ch = c2.height;
                    const ox = cw / 2;
                    const oy = ch / 2 + 30;
                    const scale = 25;

                    ctx2.clearRect(0, 0, cw, ch);

                    // Grid & axes
                    ctx2.strokeStyle = '#1e293b';
                    ctx2.lineWidth = 1;
                    for (let x = ox % scale; x < cw; x += scale) {
                        ctx2.beginPath(); ctx2.moveTo(x, 0); ctx2.lineTo(x, ch); ctx2.stroke();
                    }
                    for (let y = oy % scale; y < ch; y += scale) {
                        ctx2.beginPath(); ctx2.moveTo(0, y); ctx2.lineTo(cw, y); ctx2.stroke();
                    }
                    ctx2.strokeStyle = '#64748b';
                    ctx2.lineWidth = 2;
                    ctx2.beginPath(); ctx2.moveTo(0, oy); ctx2.lineTo(cw, oy); ctx2.stroke();
                    ctx2.beginPath(); ctx2.moveTo(ox, 0); ctx2.lineTo(ox, ch); ctx2.stroke();

                    // Parabol
                    ctx2.strokeStyle = a > 0 ? '#06b6d4' : '#f43f5e';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath();
                    for (let px = 0; px <= cw; px += 2) {
                        const xm = (px - ox) / scale;
                        const ym = a * xm * xm;
                        const py = oy - ym * scale;
                        if (px === 0) ctx2.moveTo(px, py);
                        else ctx2.lineTo(px, py);
                    }
                    ctx2.stroke();

                    // Line y = mx + n
                    ctx2.strokeStyle = '#f59e0b';
                    ctx2.lineWidth = 2.5;
                    ctx2.beginPath();
                    const xL = -ox / scale;
                    const yL = m * xL + n;
                    ctx2.moveTo(0, oy - yL * scale);
                    const xR = (cw - ox) / scale;
                    const yR = m * xR + n;
                    ctx2.lineTo(cw, oy - yR * scale);
                    ctx2.stroke();

                    // Solve ax^2 - mx - n = 0
                    const delta = m * m + 4 * a * n;
                    let txt = '';
                    if (delta > 1e-4) {
                        const x1 = (m + Math.sqrt(delta)) / (2 * a);
                        const x2 = (m - Math.sqrt(delta)) / (2 * a);
                        [x1, x2].forEach((rx, idx) => {
                            const ry = a * rx * rx;
                            const px = ox + rx * scale;
                            const py = oy - ry * scale;
                            ctx2.fillStyle = '#22c55e';
                            ctx2.beginPath(); ctx2.arc(px, py, 6, 0, Math.PI * 2); ctx2.fill();
                        });
                        txt = `Cắt nhau tại 2 điểm phân biệt: $x_1 = ${x1.toFixed(2)},\ x_2 = ${x2.toFixed(2)}$`;
                    } else if (Math.abs(delta) <= 1e-4) {
                        const x0 = m / (2 * a);
                        const y0 = a * x0 * x0;
                        const px = ox + x0 * scale;
                        const py = oy - y0 * scale;
                        ctx2.fillStyle = '#eab308';
                        ctx2.beginPath(); ctx2.arc(px, py, 6, 0, Math.PI * 2); ctx2.fill();
                        txt = `Tiếp xúc tại 1 điểm duy nhất: $(${x0.toFixed(2)}; ${y0.toFixed(2)})$`;
                    } else {
                        txt = `Không có điểm chung ($\\Delta = ${delta.toFixed(2)} < 0$)`;
                    }

                    out2.innerHTML = `<strong>Phương trình hoành độ:</strong> $${a}x^2 - ${m}x - (${n}) = 0$ | $\\Delta = ${delta.toFixed(2)}$ | ${txt}`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                [slA, slM, slN].forEach(el => el.addEventListener('input', updateRev));
                updateRev();
            
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
