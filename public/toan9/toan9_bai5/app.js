// ================================================================
// Bài 5: Bất Đẳng Thức Và Tính Chất - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai5_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Hiệp Sĩ Bất Đẳng Thức 9',
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
    "title": "Thử Thách 1: Nhận Biết Thứ Tự Khi Cộng Cùng Một Số",
    "pts": 20,
    "question": "Cho $a < b$. Khẳng định nào sau đây luôn đúng?",
    "options": [
      {
        "text": "$a + 5 < b + 5$",
        "correct": true
      },
      {
        "text": "$a + 5 > b + 5$",
        "correct": false
      },
      {
        "text": "$a - 3 > b - 3$",
        "correct": false
      },
      {
        "text": "$5 - a < 5 - b$",
        "correct": false
      }
    ],
    "explanation": "Theo tính chất liên hệ giữa thứ tự và phép cộng, khi cộng cùng một số (ở đây là 5) vào hai vế của bất đẳng thức $a < b$, ta được bất đẳng thức cùng chiều $a + 5 < b + 5$."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Nhân Với Số Âm Đổi Chiều",
    "pts": 20,
    "question": "Cho $x > y$. Khi nhân cả hai vế với $-3$ ta được bất đẳng thức nào?",
    "options": [
      {
        "text": "$-3x < -3y$",
        "correct": true
      },
      {
        "text": "$-3x > -3y$",
        "correct": false
      },
      {
        "text": "$-3x \\ge -3y$",
        "correct": false
      },
      {
        "text": "$3x < 3y$",
        "correct": false
      }
    ],
    "explanation": "Vì $-3 < 0$, khi nhân hai vế của bất đẳng thức $x > y$ với số âm $-3$, bất đẳng thức phải đổi chiều thành $-3x < -3y$."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: So Sánh Biểu Thức",
    "pts": 20,
    "question": "Cho $m < n$. So sánh hai biểu thức $2m - 1$ và $2n - 1$:",
    "options": [
      {
        "text": "$2m - 1 < 2n - 1$",
        "correct": true
      },
      {
        "text": "$2m - 1 > 2n - 1$",
        "correct": false
      },
      {
        "text": "$2m - 1 = 2n - 1$",
        "correct": false
      },
      {
        "text": "Không so sánh được",
        "correct": false
      }
    ],
    "explanation": "Từ $m < n$, nhân cả hai vế với $2 > 0$ được $2m < 2n$. Tiếp tục cộng $-1$ vào hai vế ta được $2m - 1 < 2n - 1$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Biến Đổi Về Dấu Của Biến Số",
    "pts": 20,
    "question": "Biết $-4a > -4b$. Khẳng định nào sau đây là đúng?",
    "options": [
      {
        "text": "$a < b$",
        "correct": true
      },
      {
        "text": "$a > b$",
        "correct": false
      },
      {
        "text": "$a = b$",
        "correct": false
      },
      {
        "text": "$a \\ge b$",
        "correct": false
      }
    ],
    "explanation": "Chia cả hai vế của bất đẳng thức $-4a > -4b$ cho số âm $-4$, ta phải đổi chiều dấu $>$ thành $<$, do đó $a < b$."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Bất Đẳng Thức Cô-si Cơ Bản",
    "pts": 20,
    "question": "Với hai số thực không âm $a, b \\ge 0$, bất đẳng thức nào sau đây luôn đúng?",
    "options": [
      {
        "text": "$\\frac{a + b}{2} \\ge \\sqrt{ab}$",
        "correct": true
      },
      {
        "text": "$\\frac{a + b}{2} \\le \\sqrt{ab}$",
        "correct": false
      },
      {
        "text": "$a + b < 2\\sqrt{ab}$",
        "correct": false
      },
      {
        "text": "$a^2 + b^2 < 2ab$",
        "correct": false
      }
    ],
    "explanation": "Đây là bất đẳng thức Cauchy (AM-GM) cho hai số không âm: $(\\sqrt{a} - \\sqrt{b})^2 \\ge 0 \\iff a - 2\\sqrt{ab} + b \\ge 0 \\iff \\frac{a + b}{2} \\ge \\sqrt{ab}$. Dấu '=' xảy ra khi $a = b$."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Tính Chất Bắc Cầu Của Bất Đẳng Thức",
    "pts": 20,
    "question": "Cho $a < b$ và $b < c + 1$. Nếu $c + 1 < d$ thì mối quan hệ giữa $a$ và $d$ là:",
    "options": [
      {
        "text": "$a < d$",
        "correct": true
      },
      {
        "text": "$a > d$",
        "correct": false
      },
      {
        "text": "$a = d$",
        "correct": false
      },
      {
        "text": "$a \\ge d$",
        "correct": false
      }
    ],
    "explanation": "Theo tính chất bắc cầu: $a < b < c + 1 < d \\implies a < d$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Bất Đẳng Thức Về Bình Phương",
    "pts": 20,
    "question": "Với mọi số thực $x$, khẳng định nào sau đây luôn đúng?",
    "options": [
      {
        "text": "$x^2 + 1 > 0$",
        "correct": true
      },
      {
        "text": "$x^2 - 1 > 0$",
        "correct": false
      },
      {
        "text": "$x^2 + 1 < 0$",
        "correct": false
      },
      {
        "text": "$x^2 \\ge 1$",
        "correct": false
      }
    ],
    "explanation": "Vì $x^2 \\ge 0$ với mọi $x \\in \\mathbb{R}$, nên $x^2 + 1 \\ge 0 + 1 = 1 > 0$ với mọi số thực $x$."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: So Sánh Với Số 0",
    "pts": 20,
    "question": "Cho biết $a > 0$ và $b < 0$. Tích $ab$ và thương $\\frac{a}{b}$ có đặc điểm gì?",
    "options": [
      {
        "text": "$ab < 0$ và $\\frac{a}{b} < 0$",
        "correct": true
      },
      {
        "text": "$ab > 0$ và $\\frac{a}{b} > 0$",
        "correct": false
      },
      {
        "text": "$ab < 0$ và $\\frac{a}{b} > 0$",
        "correct": false
      },
      {
        "text": "$ab > 0$ và $\\frac{a}{b} < 0$",
        "correct": false
      }
    ],
    "explanation": "Tích và thương của hai số trái dấu (một dương, một âm) luôn là một số âm (nhỏ hơn 0)."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Chứng Minh Bất Đẳng Thức Bằng Cách Xét Hiệu",
    "pts": 20,
    "question": "Để chứng minh $a^2 + b^2 \\ge 2ab$, ta xét hiệu $(a^2 + b^2) - 2ab$. Kết quả phân tích hiệu này là:",
    "options": [
      {
        "text": "$(a - b)^2 \\ge 0$",
        "correct": true
      },
      {
        "text": "$(a + b)^2 \\ge 0$",
        "correct": false
      },
      {
        "text": "$a^2 - b^2$",
        "correct": false
      },
      {
        "text": "$(a - 2b)^2$",
        "correct": false
      }
    ],
    "explanation": "Ta có $a^2 + b^2 - 2ab = (a - b)^2$. Vì bình phương của mọi số thực luôn không âm, nên $(a - b)^2 \\ge 0$, suy ra $a^2 + b^2 \\ge 2ab$."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Ứng Dụng Bất Đẳng Thức Trong Đời Sống",
    "pts": 20,
    "question": "Biển báo giao thông ghi tốc độ cho phép $v$ (km/h) là: $40 \\le v \\le 60$. Ý nghĩa của bất đẳng thức kép này là:",
    "options": [
      {
        "text": "Tốc độ tối thiểu là 40 km/h và tốc độ tối đa là 60 km/h",
        "correct": true
      },
      {
        "text": "Tốc độ phải lớn hơn 60 km/h",
        "correct": false
      },
      {
        "text": "Tốc độ phải nhỏ hơn 40 km/h",
        "correct": false
      },
      {
        "text": "Chỉ được chạy đúng 40 km/h hoặc 60 km/h",
        "correct": false
      }
    ],
    "explanation": "Bất đẳng thức kép $40 \\le v \\le 60$ biểu thị xe phải chạy với vận tốc không nhỏ hơn 40 km/h (tối thiểu 40) và không vượt quá 60 km/h (tối đa 60)."
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
                const sA = document.getElementById('sliderWeightA');
                const sB = document.getElementById('sliderWeightB');
                const sC = document.getElementById('sliderWeightC');
                const tA = document.getElementById('txtWA');
                const tB = document.getElementById('txtWB');
                const tC = document.getElementById('txtWC');
                const out = document.getElementById('lab1BalanceOutput');

                function draw() {
                    const a = parseFloat(sA.value);
                    const b = parseFloat(sB.value);
                    const c = parseFloat(sC.value);
                    tA.textContent = a; tB.textContent = b; tC.textContent = c;

                    const totalA = a + c;
                    const totalB = b + c;

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const pivotX = w / 2;
                    const pivotY = h / 2 + 20;

                    // Calculate tilt angle based on difference
                    const diff = totalB - totalA;
                    const maxAngle = Math.PI / 10;
                    const angle = Math.max(-maxAngle, Math.min(maxAngle, diff * 0.03));

                    // Base fulcrum
                    ctx.fillStyle = '#64748b';
                    ctx.beginPath();
                    ctx.moveTo(pivotX, pivotY);
                    ctx.lineTo(pivotX - 25, pivotY + 50);
                    ctx.lineTo(pivotX + 25, pivotY + 50);
                    ctx.closePath();
                    ctx.fill();

                    // Beam
                    const armLen = 160;
                    const xL = pivotX - armLen * Math.cos(angle);
                    const yL = pivotY - armLen * Math.sin(angle);
                    const xR = pivotX + armLen * Math.cos(angle);
                    const yR = pivotY + armLen * Math.sin(angle);

                    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 5;
                    ctx.beginPath(); ctx.moveTo(xL, yL); ctx.lineTo(xR, yR); ctx.stroke();

                    // Pans
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(xL - 35, yL, 70, 12);
                    ctx.fillStyle = '#f43f5e';
                    ctx.fillRect(xR - 35, yR, 70, 12);

                    // Text values on pans
                    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px Segoe UI'; ctx.textAlign = 'center';
                    ctx.fillText(`a+c = ${totalA}`, xL, yL - 8);
                    ctx.fillText(`b+c = ${totalB}`, xR, yR - 8);

                    let compSign = '=';
                    if (totalA < totalB) compSign = '<';
                    else if (totalA > totalB) compSign = '>';

                    out.innerHTML = `<strong>Ban đầu:</strong> $a = ${a} < b = ${b}$. <br><strong>Sau khi cộng $c = ${c}$:</strong> $${a} + (${c}) ${compSign} ${b} + (${c}) \\iff ${totalA} ${compSign} ${totalB}$. Chiều bất đẳng thức được <strong>giữ nguyên</strong>!`;
                    if (window.renderMathInElement) {
                        renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                sA.addEventListener('input', draw);
                sB.addEventListener('input', draw);
                sC.addEventListener('input', draw);
                draw();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const sC = document.getElementById('sliderMultC');
                const tC = document.getElementById('txtMultC');
                const out = document.getElementById('lab2MultOutput');

                const a = -2;
                const b = 3;

                function drawMult() {
                    const c = parseFloat(sC.value);
                    tC.textContent = c;

                    const ac = a * c;
                    const bc = b * c;

                    const w = canvas.width;
                    const h = canvas.height;
                    const ox = w / 2;
                    const oy = h / 2;
                    const scale = 25;

                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Number line
                    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(30, oy); ctx.lineTo(w - 30, oy); ctx.stroke();
                    // Arrow
                    ctx.beginPath(); ctx.moveTo(w - 30, oy); ctx.lineTo(w - 40, oy - 5); ctx.lineTo(w - 40, oy + 5); ctx.fill();

                    // Origin
                    ctx.fillStyle = '#94a3b8'; ctx.font = '12px Segoe UI'; ctx.textAlign = 'center';
                    ctx.fillText('0', ox, oy + 18);
                    ctx.beginPath(); ctx.arc(ox, oy, 3, 0, Math.PI * 2); ctx.fill();

                    // Point ac
                    const pAcX = ox + ac * scale;
                    ctx.fillStyle = '#38bdf8';
                    ctx.beginPath(); ctx.arc(pAcX, oy, 6, 0, Math.PI * 2); ctx.fill();
                    ctx.fillText(`ac = ${ac}`, pAcX, oy - 12);

                    // Point bc
                    const pBcX = ox + bc * scale;
                    ctx.fillStyle = '#f43f5e';
                    ctx.beginPath(); ctx.arc(pBcX, oy, 6, 0, Math.PI * 2); ctx.fill();
                    ctx.fillText(`bc = ${bc}`, pBcX, oy + 22);

                    let sign = '=';
                    let alertMsg = '';
                    if (c > 0) {
                        sign = '<';
                        alertMsg = 'c > 0 (Số dương): Chiều < GIỮ NGUYÊN.';
                    } else if (c < 0) {
                        sign = '>';
                        alertMsg = 'c < 0 (Số âm): Chiều BẮT BUỘC ĐỔI THÀNH > !';
                    } else {
                        sign = '=';
                        alertMsg = 'c = 0: Hai vế đều bằng 0.';
                    }

                    out.innerHTML = `<strong>Ban đầu:</strong> $-2 < 3$. &nbsp;|&nbsp; <strong>Nhân $c = ${c}$:</strong> $(-2) \\times (${c}) ${sign} 3 \\times (${c}) \\iff ${ac} ${sign} ${bc}$. <br><span style="color: ${c < 0 ? '#f43f5e' : '#34d399'}; font-weight: bold;">${alertMsg}</span>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                sC.addEventListener('input', drawMult);
                drawMult();
            
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
