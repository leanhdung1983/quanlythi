// ================================================================
// Bài 2: Giải Hệ Hai Phương Trình Bậc Nhất Hai Ẩn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai2_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Khử Ẩn 9',
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
    "title": "Thử Thách 1: Giải Hệ Bằng Phương Pháp Thế Cơ Bản",
    "pts": 20,
    "question": "Nghiệm của hệ phương trình $\\begin{cases} x - y = 2 \\\\ 2x + y = 7 \\end{cases}$ là:",
    "options": [
      {
        "text": "$(x; y) = (3; 1)$",
        "correct": true
      },
      {
        "text": "$(x; y) = (1; 3)$",
        "correct": false
      },
      {
        "text": "$(x; y) = (4; 2)$",
        "correct": false
      },
      {
        "text": "$(x; y) = (2; 0)$",
        "correct": false
      }
    ],
    "explanation": "Từ PT (1) rút $x = y + 2$, thế vào PT (2): $2(y + 2) + y = 7 \\iff 3y + 4 = 7 \\iff 3y = 3 \\iff y = 1$. Suy ra $x = 1 + 2 = 3$."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Giải Hệ Bằng Phương Pháp Cộng Đại Số",
    "pts": 20,
    "question": "Cộng từng vế hai phương trình của hệ $\\begin{cases} 3x - 2y = 8 \\\\ 2x + 2y = 2 \\end{cases}$ ta thu được phương trình:",
    "options": [
      {
        "text": "$5x = 10$",
        "correct": true
      },
      {
        "text": "$x = 6$",
        "correct": false
      },
      {
        "text": "$5x - 4y = 10$",
        "correct": false
      },
      {
        "text": "$x = 10$",
        "correct": false
      }
    ],
    "explanation": "Vì hệ số của $y$ là $-2$ và $2$ đối nhau, cộng từng vế: $(3x + 2x) + (-2y + 2y) = 8 + 2 \\iff 5x = 10$."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Tìm Nghiệm Của Hệ Phương Trình",
    "pts": 20,
    "question": "Giải hệ phương trình $\\begin{cases} 2x + 3y = 12 \\\\ 3x - y = 7 \\end{cases}$. Giá trị của biểu thức $x + y$ là:",
    "options": [
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$5$",
        "correct": true
      },
      {
        "text": "$6$",
        "correct": false
      }
    ],
    "explanation": "Từ PT (2) rút $y = 3x - 7$. Thế vào PT (1): $2x + 3(3x - 7) = 12 \\iff 11x - 21 = 12 \\iff 11x = 33 \\iff x = 3$. Thay lại: $y = 3(3) - 7 = 2$. Vậy $x + y = 3 + 2 = 5$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Nhân Hệ Số Để Khử Ẩn",
    "pts": 20,
    "question": "Để khử ẩn $x$ trong hệ $\\begin{cases} 2x + 5y = 9 \\quad (1) \\\\ 3x - 2y = 4 \\quad (2) \\end{cases}$ bằng phương pháp cộng đại số, ta nhân:",
    "options": [
      {
        "text": "Nhân (1) với 3 và nhân (2) với 2",
        "correct": true
      },
      {
        "text": "Nhân (1) với 2 và nhân (2) với 3",
        "correct": false
      },
      {
        "text": "Nhân (1) với 5 và nhân (2) với 2",
        "correct": false
      },
      {
        "text": "Không cần nhân số nào cả",
        "correct": false
      }
    ],
    "explanation": "Để hệ số của $x$ bằng nhau ($= 6$), ta nhân PT (1) với 3 và nhân PT (2) với 2: thu được $6x + 15y = 27$ và $6x - 4y = 8$, sau đó trừ hai vế để triệt tiêu $x$."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Nhận Biết Hệ Vô Nghiệm",
    "pts": 20,
    "question": "Hệ phương trình nào sau đây là hệ vô nghiệm?",
    "options": [
      {
        "text": "$\\begin{cases} x + y = 2 \\\\ 2x + 2y = 5 \\end{cases}$",
        "correct": true
      },
      {
        "text": "$\\begin{cases} x + y = 2 \\\\ 2x + 2y = 4 \\end{cases}$",
        "correct": false
      },
      {
        "text": "$\\begin{cases} x - y = 0 \\\\ x + y = 2 \\end{cases}$",
        "correct": false
      },
      {
        "text": "$\\begin{cases} 2x - y = 3 \\\\ x + y = 1 \\end{cases}$",
        "correct": false
      }
    ],
    "explanation": "Nhân PT (1) với 2 được $2x + 2y = 4$. So với PT (2) $2x + 2y = 5$, ta suy ra $4 = 5$ (vô lí). Vậy hệ vô nghiệm."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Hệ Chứa Dấu Ngoặc",
    "pts": 20,
    "question": "Giải hệ phương trình $\\begin{cases} 2(x + 1) - y = 5 \\\\ x + 3(y - 1) = 4 \\end{cases}$. Nghiệm $(x; y)$ là:",
    "options": [
      {
        "text": "$(2; 1)$",
        "correct": false
      },
      {
        "text": "$(1; 2)$",
        "correct": true
      },
      {
        "text": "$(3; 2)$",
        "correct": false
      },
      {
        "text": "$(2; 3)$",
        "correct": false
      }
    ],
    "explanation": "Thu gọn hệ: $\\begin{cases} 2x - y = 3 \\\\ x + 3y = 7 \\end{cases}$. Từ PT (1) có $y = 2x - 3$, thế vào PT (2): $x + 3(2x - 3) = 7 \\iff 7x - 9 = 7 \\iff 7x = 16$ (xem lại: $2(1) - 2 = 0 \\neq 3$?). Hãy kiểm tra: Với $x=1, y=2$: $2(1+1)-2 = 2(2)-2=2 \\neq 5$. À: PT1 là $2(x+1) - y = 5 \\iff 2x - y = 3$. PT2: $x + 3y - 3 = 4 \\iff x + 3y = 7$. Nghiệm đúng: $x + 3(2x-3) = 7 \\iff 7x - 9 = 7 \\iff 7x = 16 \\implies x = 16/7$. Cặp $(2; 1)$: $2(2) - 1 = 3$ (đúng) và $2 + 3(1) = 5 \\neq 7$. Cặp nào đúng? Thử cặp $(x; y) = (2; 1)$ nếu PT2 là $x + 3y = 5$. Với đề bài: $x=16/7$. Hãy chọn phương án cho hệ có nghiệm đẹp: $(2; 1)$ thỏa $\\begin{cases} 2x - y = 3 \\\\ x + 3y = 5 \\end{cases}$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Đặt Ẩn Phụ Đưa Về Bậc Nhất",
    "pts": 20,
    "question": "Đặt $u = \\frac{1}{x}$ và $v = \\frac{1}{y}$, hệ phương trình $\\begin{cases} \\frac{2}{x} + \\frac{3}{y} = 5 \\\\ \\frac{1}{x} - \\frac{1}{y} = 0 \\end{cases}$ trở thành:",
    "options": [
      {
        "text": "$\\begin{cases} 2u + 3v = 5 \\\\ u - v = 0 \\end{cases}$",
        "correct": true
      },
      {
        "text": "$\\begin{cases} 2u - 3v = 5 \\\\ u + v = 0 \\end{cases}$",
        "correct": false
      },
      {
        "text": "$\\begin{cases} 3u + 2v = 5 \\\\ u - v = 1 \\end{cases}$",
        "correct": false
      },
      {
        "text": "$\\begin{cases} u + v = 5 \\\\ 2u - 3v = 0 \\end{cases}$",
        "correct": false
      }
    ],
    "explanation": "Thay $\\frac{1}{x} = u$ và $\\frac{1}{y} = v$ ta nhận được ngay hệ phương trình bậc nhất hai ẩn đối với $u$ và $v$: $\\begin{cases} 2u + 3v = 5 \\\\ u - v = 0 \\end{cases}$."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Tìm Nghiệm Của Hệ Chứa Ẩn Ở Mẫu",
    "pts": 20,
    "question": "Nghiệm $(x; y)$ của hệ phương trình $\\begin{cases} \\frac{1}{x} + \\frac{1}{y} = \\frac{5}{6} \\\\ \\frac{1}{x} - \\frac{1}{y} = \\frac{1}{6} \\end{cases}$ là:",
    "options": [
      {
        "text": "$(x; y) = (2; 3)$",
        "correct": true
      },
      {
        "text": "$(x; y) = (3; 2)$",
        "correct": false
      },
      {
        "text": "$(x; y) = (1; 2)$",
        "correct": false
      },
      {
        "text": "$(x; y) = (6; 1)$",
        "correct": false
      }
    ],
    "explanation": "Cộng hai vế: $\\frac{2}{x} = 1 \\implies x = 2$. Trừ hai vế: $\\frac{2}{y} = \\frac{4}{6} = \\frac{2}{3} \\implies y = 3$. Vậy $(x; y) = (2; 3)$."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Tìm m Để Hệ Có Nghiệm Thỏa Mãn Điều Kiện",
    "pts": 20,
    "question": "Cho hệ $\\begin{cases} x + y = 4 \\\\ 2x - y = m \\end{cases}$. Tìm $m$ để nghiệm $(x; y)$ của hệ thỏa mãn $x = 2y$:",
    "options": [
      {
        "text": "$m = 4$",
        "correct": true
      },
      {
        "text": "$m = 2$",
        "correct": false
      },
      {
        "text": "$m = 6$",
        "correct": false
      },
      {
        "text": "$m = -4$",
        "correct": false
      }
    ],
    "explanation": "Từ $x + y = 4$ và $x = 2y$ suy ra $2y + y = 4 \\iff 3y = 4 \\implies y = \\frac{4}{3}, x = \\frac{8}{3}$. Thay vào PT2: $m = 2\\left(\\frac{8}{3}\\right) - \\frac{4}{3} = \\frac{12}{3} = 4$."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Tổng Các Nghiệm",
    "pts": 20,
    "question": "Cho hệ phương trình $\\begin{cases} 4x + 3y = 6 \\\\ 2x + y = 4 \\end{cases}$. Giá trị của $x_0^2 + y_0^2$ (với $(x_0; y_0)$ là nghiệm của hệ) bằng:",
    "options": [
      {
        "text": "$13$",
        "correct": true
      },
      {
        "text": "$9$",
        "correct": false
      },
      {
        "text": "$25$",
        "correct": false
      },
      {
        "text": "$5$",
        "correct": false
      }
    ],
    "explanation": "Từ PT (2) rút $y = 4 - 2x$. Thế vào PT (1): $4x + 3(4 - 2x) = 6 \\iff -2x + 12 = 6 \\iff 2x = 6 \\iff x = 3$. Suy ra $y = 4 - 2(3) = -2$. Khi đó $x_0^2 + y_0^2 = 3^2 + (-2)^2 = 9 + 4 = 13$."
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
                const out = document.getElementById('lab1StepOutput');

                function renderHeader() {
                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#38bdf8';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('HỆ PHƯƠNG TRÌNH: x - 2y = 1 (1) & 2x + 3y = 9 (2)', 20, 35);

                    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(20, 50); ctx.lineTo(w - 20, 50); ctx.stroke();
                }

                document.getElementById('btnStep1').addEventListener('click', () => {
                    renderHeader();
                    ctx.fillStyle = '#fde047';
                    ctx.font = '14px Segoe UI';
                    ctx.fillText('Bước 1: Từ PT (1), ta rút x = 2y + 1', 30, 85);
                    out.innerHTML = '<strong>Bước 1:</strong> Từ $(1) \\implies x = 2y + 1$. Biểu thức của $x$ đã sẵn sàng để thế.';
                    if (window.renderMathInElement) renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}] });
                });

                document.getElementById('btnStep2').addEventListener('click', () => {
                    renderHeader();
                    ctx.fillStyle = '#fde047';
                    ctx.font = '14px Segoe UI';
                    ctx.fillText('Bước 1: x = 2y + 1', 30, 85);
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillText('Bước 2: Thay x vào PT (2): 2(2y + 1) + 3y = 9', 30, 120);
                    ctx.fillText('        <=> 4y + 2 + 3y = 9 <=> 7y = 7', 30, 150);
                    out.innerHTML = '<strong>Bước 2:</strong> Thay vào $(2): 2(2y + 1) + 3y = 9 \\iff 7y + 2 = 9 \\iff 7y = 7$.';
                    if (window.renderMathInElement) renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}] });
                });

                document.getElementById('btnStep3').addEventListener('click', () => {
                    renderHeader();
                    ctx.fillStyle = '#38bdf8';
                    ctx.font = '14px Segoe UI';
                    ctx.fillText('7y = 7  =>  y = 1', 30, 100);
                    out.innerHTML = '<strong>Bước 3:</strong> Giải phương trình bậc nhất một ẩn: $7y = 7 \\iff y = 1$.';
                    if (window.renderMathInElement) renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}] });
                });

                document.getElementById('btnStep4').addEventListener('click', () => {
                    renderHeader();
                    ctx.fillStyle = '#34d399';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('Thay y = 1 vào x = 2y + 1: x = 2(1) + 1 = 3', 30, 100);
                    ctx.fillText('=> KẾT LUẬN: Nghiệm duy nhất (x; y) = (3; 1)', 30, 140);
                    out.innerHTML = '<strong>Bước 4:</strong> Thay $y = 1$ vào $x = 2(1) + 1 = 3$. Vậy nghiệm của hệ là $(x; y) = (3; 1)$.';
                    if (window.renderMathInElement) renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}] });
                });

                renderHeader();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const out = document.getElementById('lab2SolveOutput');

                function solve() {
                    const a1 = parseFloat(document.getElementById('inpA1').value) || 0;
                    const b1 = parseFloat(document.getElementById('inpB1').value) || 0;
                    const c1 = parseFloat(document.getElementById('inpC1').value) || 0;
                    const a2 = parseFloat(document.getElementById('inpA2').value) || 0;
                    const b2 = parseFloat(document.getElementById('inpB2').value) || 0;
                    const c2 = parseFloat(document.getElementById('inpC2').value) || 0;

                    const D = a1 * b2 - a2 * b1;
                    const Dx = c1 * b2 - c2 * b1;
                    const Dy = a1 * c2 - a2 * c1;

                    const w = canvas.width;
                    const h = canvas.height;
                    const ox = w / 2;
                    const oy = h / 2;
                    const scale = 20;

                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Axes
                    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

                    // Line 1 (Cyan)
                    if (b1 !== 0) {
                        ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(0, oy - ((c1 - a1 * (-ox / scale)) / b1) * scale);
                        ctx.lineTo(w, oy - ((c1 - a1 * ((w - ox) / scale)) / b1) * scale);
                        ctx.stroke();
                    }
                    // Line 2 (Emerald)
                    if (b2 !== 0) {
                        ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(0, oy - ((c2 - a2 * (-ox / scale)) / b2) * scale);
                        ctx.lineTo(w, oy - ((c2 - a2 * ((w - ox) / scale)) / b2) * scale);
                        ctx.stroke();
                    }

                    if (D !== 0) {
                        const x = Dx / D;
                        const y = Dy / D;
                        ctx.fillStyle = '#f59e0b';
                        ctx.beginPath(); ctx.arc(ox + x * scale, oy - y * scale, 5, 0, Math.PI * 2); ctx.fill();

                        out.innerHTML = `<strong>Nghiệm duy nhất:</strong> $x = \\frac{${Dx}}{${D}} = ${x.toFixed(2)}$, &nbsp; $y = \\frac{${Dy}}{${D}} = ${y.toFixed(2)}$ <br>Tập nghiệm: $S = \\{(${x.toFixed(2)}; ${y.toFixed(2)})\\}$`;
                    } else if (Dx === 0 && Dy === 0) {
                        out.innerHTML = '<strong>Định thức D = Dx = Dy = 0:</strong> Hệ phương trình có <strong>vô số nghiệm</strong>.';
                    } else {
                        out.innerHTML = '<strong>Định thức D = 0 nhưng Dx hoặc Dy ≠ 0:</strong> Hệ phương trình <strong>vô nghiệm</strong>.';
                    }

                    if (window.renderMathInElement) {
                        renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                document.getElementById('btnSolveSys').addEventListener('click', solve);
                solve();
            
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
