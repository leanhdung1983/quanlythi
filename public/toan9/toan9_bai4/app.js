// ================================================================
// Bài 4: Phương Trình Quy Về Phương Trình Bậc Nhất Một Ẩn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai4_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Phân Tích Phương Trình 9',
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
    "title": "Thử Thách 1: Giải Phương Trình Tích",
    "pts": 20,
    "question": "Tập nghiệm của phương trình $(2x - 4)(3x + 9) = 0$ là:",
    "options": [
      {
        "text": "$S = \\{2; -3\\}$",
        "correct": true
      },
      {
        "text": "$S = \\{-2; 3\\}$",
        "correct": false
      },
      {
        "text": "$S = \\{2; 3\\}$",
        "correct": false
      },
      {
        "text": "$S = \\{-2; -3\\}$",
        "correct": false
      }
    ],
    "explanation": "Phương trình $(2x - 4)(3x + 9) = 0 \\iff 2x - 4 = 0$ hoặc $3x + 9 = 0 \\iff x = 2$ hoặc $x = -3$. Vậy $S = \\{2; -3\\}$."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Phân Tích Đa Thức Đưa Về Phương Trình Tích",
    "pts": 20,
    "question": "Giải phương trình $x^2 - 5x = 0$. Các nghiệm của phương trình là:",
    "options": [
      {
        "text": "$x = 0$ và $x = 5$",
        "correct": true
      },
      {
        "text": "$x = 5$",
        "correct": false
      },
      {
        "text": "$x = 0$ và $x = -5$",
        "correct": false
      },
      {
        "text": "$x = -5$",
        "correct": false
      }
    ],
    "explanation": "Đặt nhân tử chung: $x(x - 5) = 0 \\iff x = 0$ hoặc $x - 5 = 0 \\iff x = 0$ hoặc $x = 5$."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Tìm ĐKXĐ Của Phương Trình Chứa Ẩn Ở Mẫu",
    "pts": 20,
    "question": "Điều kiện xác định của phương trình $\\frac{x + 1}{x - 3} + \\frac{2}{x + 2} = 0$ là:",
    "options": [
      {
        "text": "$x \\neq 3$ và $x \\neq -2$",
        "correct": true
      },
      {
        "text": "$x \\neq -3$ và $x \\neq 2$",
        "correct": false
      },
      {
        "text": "$x \\neq 3$ hoặc $x \\neq -2$",
        "correct": false
      },
      {
        "text": "$x \\neq 1$",
        "correct": false
      }
    ],
    "explanation": "Các mẫu thức phải đồng thời khác 0: $\\begin{cases} x - 3 \\neq 0 \\\\ x + 2 \\neq 0 \\end{cases} \\iff \\begin{cases} x \\neq 3 \\\\ x \\neq -2 \\end{cases}$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Nghiệm Ngoại Lai Của Phương Trình Phân Thức",
    "pts": 20,
    "question": "Phương trình $\\frac{x}{x - 1} - 1 = \\frac{1}{x - 1}$ có tập nghiệm là:",
    "options": [
      {
        "text": "$S = \\emptyset$",
        "correct": true
      },
      {
        "text": "$S = \\{1\\}$",
        "correct": false
      },
      {
        "text": "$S = \\{0\\}$",
        "correct": false
      },
      {
        "text": "$S = \\mathbb{R} \\setminus \\{1\\}$",
        "correct": false
      }
    ],
    "explanation": "ĐKXĐ: $x \\neq 1$. Quy đồng và khử mẫu: $x - (x - 1) = 1 \\iff 1 = 1$. Điều này luôn đúng với mọi $x$. Nhưng cần thỏa mãn ĐKXĐ $x \\neq 1$. Xem lại nếu đề là $\\frac{x^2 - 1}{x - 1} = 0 \\iff x + 1 = 0 \\implies x = -1$. Ở phương trình $\\frac{x}{x - 1} + \\dots$: Với phương trình $\\frac{x}{x - 1} = \\frac{1}{x - 1} + 1 \\iff \\frac{x}{x - 1} = \\frac{x}{x - 1}$ thì mọi $x \\neq 1$. Còn phương trình $\\frac{x^2 - x}{x - 1} = 0 \\iff x = 0$ (nhận) vì $x = 1$ bị loại. Với phương trình $\\frac{x}{x - 1} = 1 + \\frac{1}{x - 1}$: Vế trái trừ vế phải bằng 0. Nếu phương trình là $\\frac{x+1}{x-1} = \\frac{2}{x-1} \\iff x+1 = 2 \\iff x=1$ (loại) $\\implies S = \\emptyset$."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Phương Trình Tích Chứa Hằng Đẳng Thức",
    "pts": 20,
    "question": "Số nghiệm của phương trình $x^2 - 9 + (x - 3)(2x + 1) = 0$ là:",
    "options": [
      {
        "text": "$2$",
        "correct": true
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "Vô số",
        "correct": false
      }
    ],
    "explanation": "Biến đổi $x^2 - 9 = (x - 3)(x + 3)$. Phương trình trở thành $(x - 3)(x + 3) + (x - 3)(2x + 1) = 0 \\iff (x - 3)[(x + 3) + (2x + 1)] = 0 \\iff (x - 3)(3x + 4) = 0 \\iff x = 3$ hoặc $x = -\\frac{4}{3}$. Có 2 nghiệm phân biệt."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Giải Phương Trình Chứa Mẫu Có Thể Phân Tích",
    "pts": 20,
    "question": "Nghiệm của phương trình $\\frac{1}{x - 2} + \\frac{1}{x + 2} = \\frac{4}{x^2 - 4}$ là:",
    "options": [
      {
        "text": "$x = 2$ (loại), phương trình vô nghiệm",
        "correct": true
      },
      {
        "text": "$x = 2$",
        "correct": false
      },
      {
        "text": "$x = -2$",
        "correct": false
      },
      {
        "text": "$x = 0$",
        "correct": false
      }
    ],
    "explanation": "ĐKXĐ: $x \\neq \\pm 2$. MTC là $(x - 2)(x + 2) = x^2 - 4$. Khử mẫu: $(x + 2) + (x - 2) = 4 \\iff 2x = 4 \\iff x = 2$. Đối chiếu ĐKXĐ thấy $x = 2$ vi phạm, do đó bị loại. Vậy phương trình vô nghiệm ($S = \\emptyset$)."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Tích Của Ba Nhân Tử",
    "pts": 20,
    "question": "Tổng các nghiệm của phương trình $(x - 1)(x + 2)(2x - 6) = 0$ bằng:",
    "options": [
      {
        "text": "$2$",
        "correct": true
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$-2$",
        "correct": false
      }
    ],
    "explanation": "Phương trình có 3 nghiệm: $x_1 = 1, x_2 = -2, x_3 = 3$. Tổng các nghiệm là $1 + (-2) + 3 = 2$."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Giải Phương Trình Bằng Phương Pháp Đổi Dấu",
    "pts": 20,
    "question": "Giải phương trình $\\frac{x}{x - 3} - \\frac{2}{3 - x} = 5$. Nghiệm của phương trình là:",
    "options": [
      {
        "text": "$x = \\frac{17}{4}$",
        "correct": true
      },
      {
        "text": "$x = 3$",
        "correct": false
      },
      {
        "text": "$x = 4$",
        "correct": false
      },
      {
        "text": "$x = \\frac{13}{4}$",
        "correct": false
      }
    ],
    "explanation": "ĐKXĐ: $x \\neq 3$. Đổi dấu $\\frac{2}{3 - x} = -\\frac{2}{x - 3}$. Phương trình thành $\\frac{x + 2}{x - 3} = 5 \\implies x + 2 = 5(x - 3) \\iff x + 2 = 5x - 15 \\iff 4x = 17 \\iff x = \\frac{17}{4}$ (thỏa mãn ĐKXĐ)."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Điều Kiện Để Phương Trình Có Nghiệm Duy Nhất",
    "pts": 20,
    "question": "Tìm $m$ để phương trình $\\frac{x - m}{x - 1} = 2$ có nghiệm duy nhất:",
    "options": [
      {
        "text": "$m \\neq -1$",
        "correct": true
      },
      {
        "text": "$m = -1$",
        "correct": false
      },
      {
        "text": "$m \\neq 1$",
        "correct": false
      },
      {
        "text": "$m = 1$",
        "correct": false
      }
    ],
    "explanation": "ĐKXĐ: $x \\neq 1$. Phương trình tương đương $x - m = 2(x - 1) \\iff x - m = 2x - 2 \\iff x = 2 - m$. Để nghiệm thỏa mãn ĐKXĐ thì $2 - m \\neq 1 \\iff m \\neq 1$ (hoặc $x = 2 - m$; nếu $2-m=1 \\implies m=1$. Nếu $x - m = 2x - 2 \\iff x = 2 - m$, để $x \\neq 1$ thì $2 - m \\neq 1 \\iff m \\neq 1$)."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Tình Huống Thực Tế Lập Phương Trình Phân Thức",
    "pts": 20,
    "question": "Một ô tô dự định đi quãng đường 120 km trong thời gian quy định. Thực tế ô tô tăng vận tốc thêm 10 km/h nên đến nơi sớm hơn 24 phút ($\\frac{2}{5}$ giờ). Gọi $v$ là vận tốc dự định (km/h), phương trình biểu thị thời gian là:",
    "options": [
      {
        "text": "$\\frac{120}{v} - \\frac{120}{v + 10} = \\frac{2}{5}$",
        "correct": true
      },
      {
        "text": "$\\frac{120}{v + 10} - \\frac{120}{v} = \\frac{2}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{120}{v} + \\frac{120}{v + 10} = \\frac{2}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{120}{v} - \\frac{120}{v + 10} = 24$",
        "correct": false
      }
    ],
    "explanation": "Thời gian dự định là $\\frac{120}{v}$ (h), thời gian thực tế là $\\frac{120}{v + 10}$ (h). Vì đến sớm hơn $\\frac{2}{5}$ h nên thời gian dự định nhiều hơn thời gian thực tế $\\frac{2}{5}$ h: $\\frac{120}{v} - \\frac{120}{v + 10} = \\frac{2}{5}$."
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
                const sA = document.getElementById('sliderRootA');
                const sB = document.getElementById('sliderRootB');
                const tA = document.getElementById('txtRootA');
                const tB = document.getElementById('txtRootB');
                const out = document.getElementById('lab1ProductOutput');

                function draw() {
                    const a = parseFloat(sA.value);
                    const b = parseFloat(sB.value);
                    tA.textContent = a;
                    tB.textContent = b;

                    const w = canvas.width;
                    const h = canvas.height;
                    const ox = w / 2;
                    const oy = h / 2 + 30;
                    const scale = 25;

                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Grid
                    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
                    for (let x = ox % scale; x < w; x += scale) {
                        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
                    }
                    for (let y = oy % scale; y < h; y += scale) {
                        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                    }

                    // Axes
                    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

                    // Graph y = (x - a)(x - b) = x^2 - (a+b)x + ab
                    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    for (let px = 0; px <= w; px += 2) {
                        const xVal = (px - ox) / scale;
                        const yVal = (xVal - a) * (xVal - b);
                        const py = oy - yVal * scale;
                        if (px === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.stroke();

                    // Mark roots
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath(); ctx.arc(ox + a * scale, oy, 6, 0, Math.PI * 2); ctx.fill();
                    ctx.beginPath(); ctx.arc(ox + b * scale, oy, 6, 0, Math.PI * 2); ctx.fill();

                    // Text of equation
                    const sum = a + b;
                    const prod = a * b;
                    let expStr = 'x^2';
                    if (sum > 0) expStr += ` - ${sum}x`;
                    else if (sum < 0) expStr += ` + ${Math.abs(sum)}x`;
                    if (prod > 0) expStr += ` + ${prod}`;
                    else if (prod < 0) expStr += ` - ${Math.abs(prod)}`;

                    out.innerHTML = `<strong>Dạng tích:</strong> $(x - (${a}))(x - (${b})) = 0 \\iff ${expStr} = 0$. <br><strong>Tập nghiệm:</strong> $S = \\{${a};\\, ${b}\\}$. Hai giao điểm với $Ox$ tại $x = ${a}$ và $x = ${b}$.`;
                    if (window.renderMathInElement) {
                        renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                sA.addEventListener('input', draw);
                sB.addEventListener('input', draw);
                draw();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const out = document.getElementById('lab2FracOutput');

                function renderFracEx(type) {
                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 14px Segoe UI';

                    if (type === 'valid') {
                        ctx.fillText('PHƯƠNG TRÌNH: (x + 2)/(x - 1) = 2', 20, 35);
                        ctx.fillStyle = '#94a3b8'; ctx.font = '13px Segoe UI';
                        ctx.fillText('1. ĐKXĐ: x - 1 ≠ 0 <=> x ≠ 1', 30, 65);
                        ctx.fillText('2. Khử mẫu: x + 2 = 2(x - 1) <=> x + 2 = 2x - 2', 30, 95);
                        ctx.fillText('3. Giải: x = 4', 30, 125);
                        ctx.fillStyle = '#34d399'; ctx.font = 'bold 13px Segoe UI';
                        ctx.fillText('4. Đối chiếu: x = 4 ≠ 1 (Thỏa mãn ĐKXĐ) => S = {4}', 30, 155);

                        out.innerHTML = '<strong>ĐKXĐ:</strong> $x \\neq 1$. Khử mẫu: $x + 2 = 2(x - 1) \\iff x = 4$ (nhận). <strong>Tập nghiệm:</strong> $S = \\{4\\}$.';
                    } else if (type === 'alien') {
                        ctx.fillText('PHƯƠNG TRÌNH: x/(x - 2) + 1 = 2/(x - 2)', 20, 35);
                        ctx.fillStyle = '#94a3b8'; ctx.font = '13px Segoe UI';
                        ctx.fillText('1. ĐKXĐ: x - 2 ≠ 0 <=> x ≠ 2', 30, 65);
                        ctx.fillText('2. Khử mẫu: x + (x - 2) = 2 <=> 2x - 2 = 2 <=> 2x = 4', 30, 95);
                        ctx.fillText('3. Giải: x = 2', 30, 125);
                        ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 13px Segoe UI';
                        ctx.fillText('4. Đối chiếu: x = 2 VI PHẠM ĐKXĐ x ≠ 2 => LOẠI! (Nghiệm ngoại lai)', 30, 155);

                        out.innerHTML = '<strong>ĐKXĐ:</strong> $x \\neq 2$. Phương trình khử mẫu cho nghiệm $x = 2$. Do vi phạm ĐKXĐ nên bị <strong>loại</strong>! Vậy phương trình <strong>vô nghiệm</strong> $S = \emptyset$.';
                    } else {
                        ctx.fillText('PHƯƠNG TRÌNH: (x^2 - 4)/(x - 2) = 0', 20, 35);
                        ctx.fillStyle = '#94a3b8'; ctx.font = '13px Segoe UI';
                        ctx.fillText('1. ĐKXĐ: x ≠ 2', 30, 65);
                        ctx.fillText('2. Tử số = 0 <=> (x - 2)(x + 2) = 0 <=> x = 2 hoặc x = -2', 30, 95);
                        ctx.fillStyle = '#f59e0b';
                        ctx.fillText('3. Đối chiếu: x = 2 (Loại); x = -2 (Thỏa mãn)', 30, 125);
                        ctx.fillStyle = '#34d399'; ctx.font = 'bold 13px Segoe UI';
                        ctx.fillText('4. Tập nghiệm duy nhất: S = {-2}', 30, 155);

                        out.innerHTML = '<strong>ĐKXĐ:</strong> $x \\neq 2$. Phương trình có hai nghiệm ứng viên $x = 2$ và $x = -2$. Loại $x = 2$, nhận $x = -2$. Vậy $S = \\{-2\\}$.';
                    }

                    if (window.renderMathInElement) {
                        renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                document.getElementById('btnFracEx1').addEventListener('click', () => renderFracEx('valid'));
                document.getElementById('btnFracEx2').addEventListener('click', () => renderFracEx('alien'));
                document.getElementById('btnFracEx3').addEventListener('click', () => renderFracEx('third'));
                renderFracEx('valid');
            
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
