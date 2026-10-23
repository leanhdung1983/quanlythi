// ================================================================
// Luyện Tập Chung: Hàm Số & Phương Trình Bậc Hai - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ltc_chuong6_1_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Dũng Sĩ Tương Giao 9',
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
    "title": "Câu 1: Số nghiệm phương trình trùng phương",
    "pts": 20,
    "question": "Phương trình $x^4 - 5x^2 + 4 = 0$ có tất cả bao nhiêu nghiệm thực?",
    "options": [
      {
        "text": "1 nghiệm",
        "correct": false
      },
      {
        "text": "2 nghiệm",
        "correct": false
      },
      {
        "text": "3 nghiệm",
        "correct": false
      },
      {
        "text": "4 nghiệm",
        "correct": true
      }
    ],
    "explanation": "Đặt $t = x^2\\ (t \\ge 0)$, ta có $t^2 - 5t + 4 = 0 \\iff t = 1$ hoặc $t = 4$. Cả hai đều thỏa mãn $t > 0$, cho ta 4 nghiệm là $x = \\pm 1,\\ x = \\pm 2$."
  },
  {
    "id": 2,
    "title": "Câu 2: Tọa độ giao điểm Parabol và đường thẳng",
    "pts": 20,
    "question": "Tọa độ giao điểm của parabol $(P): y = x^2$ và đường thẳng $(d): y = 2x$ là:",
    "options": [
      {
        "text": "$(0; 0)$ và $(2; 4)$",
        "correct": true
      },
      {
        "text": "$(0; 0)$ và $(1; 1)$",
        "correct": false
      },
      {
        "text": "$(2; 4)$ và $(-2; 4)$",
        "correct": false
      },
      {
        "text": "$(0; 2)$ và $(2; 0)$",
        "correct": false
      }
    ],
    "explanation": "Phương trình hoành độ giao điểm: $x^2 = 2x \\iff x(x - 2) = 0 \\iff x = 0$ (suy ra $y = 0$) hoặc $x = 2$ (suy ra $y = 4$)."
  },
  {
    "id": 3,
    "title": "Câu 3: Điều kiện tiếp xúc",
    "pts": 20,
    "question": "Đường thẳng $y = 2x + m$ tiếp xúc với parabol $y = x^2$ khi giá trị của $m$ bằng:",
    "options": [
      {
        "text": "$m = 1$",
        "correct": false
      },
      {
        "text": "$m = -1$",
        "correct": true
      },
      {
        "text": "$m = 2$",
        "correct": false
      },
      {
        "text": "$m = -2$",
        "correct": false
      }
    ],
    "explanation": "Phương trình hoành độ giao điểm: $x^2 - 2x - m = 0$. Tiếp xúc $\\iff \\Delta' = 0 \\iff (-1)^2 - 1(-m) = 0 \\iff 1 + m = 0 \\iff m = -1$."
  },
  {
    "id": 4,
    "title": "Câu 4: Phương trình vô nghiệm",
    "pts": 20,
    "question": "Phương trình trùng phương nào sau đây VÔ NGHIỆM trên $\\mathbb{R}$?",
    "options": [
      {
        "text": "$x^4 - 3x^2 + 2 = 0$",
        "correct": false
      },
      {
        "text": "$x^4 + 5x^2 + 4 = 0$",
        "correct": true
      },
      {
        "text": "$x^4 - x^2 - 2 = 0$",
        "correct": false
      },
      {
        "text": "$x^4 - 4 = 0$",
        "correct": false
      }
    ],
    "explanation": "Với $x^4 + 5x^2 + 4 = 0$, đặt $t = x^2 \\ge 0$ được $t^2 + 5t + 4 = 0 \\iff t = -1$ hoặc $t = -4$. Cả hai nghiệm đều âm nên phương trình vô nghiệm."
  },
  {
    "id": 5,
    "title": "Câu 5: Phương trình tích",
    "pts": 20,
    "question": "Tập nghiệm của phương trình $(x^2 - 4)(2x + 1) = 0$ là:",
    "options": [
      {
        "text": "$S = \\{2; -2; -\\frac{1}{2}\\}$",
        "correct": true
      },
      {
        "text": "$S = \\{2; -\\frac{1}{2}\\}$",
        "correct": false
      },
      {
        "text": "$S = \\{4; -\\frac{1}{2}\\}$",
        "correct": false
      },
      {
        "text": "$S = \\{-2; \\frac{1}{2}\\}$",
        "correct": false
      }
    ],
    "explanation": "$(x^2 - 4)(2x + 1) = 0 \\iff x^2 - 4 = 0$ hoặc $2x + 1 = 0 \\iff x = \\pm 2$ hoặc $x = -\\frac{1}{2}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Vị trí tương đối không giao nhau",
    "pts": 20,
    "question": "Cho parabol $(P): y = -x^2$ và đường thẳng $(d): y = 2$. Vị trí tương đối của $(P)$ và $(d)$ là:",
    "options": [
      {
        "text": "Cắt nhau tại 2 điểm",
        "correct": false
      },
      {
        "text": "Tiếp xúc nhau",
        "correct": false
      },
      {
        "text": "Không có điểm chung",
        "correct": true
      },
      {
        "text": "Trùng nhau",
        "correct": false
      }
    ],
    "explanation": "Ta có $-x^2 \\le 0$ với mọi $x$, trong khi đường thẳng $y = 2 > 0$ nằm hoàn toàn phía trên trục hoành. Do đó $(P)$ và $(d)$ không có điểm chung."
  },
  {
    "id": 7,
    "title": "Câu 7: Đổi biến giải phương trình",
    "pts": 20,
    "question": "Để giải phương trình $(x^2 + 2x)^2 - 2(x^2 + 2x) - 3 = 0$, ta nên đặt ẩn phụ là:",
    "options": [
      {
        "text": "$t = x^2$",
        "correct": false
      },
      {
        "text": "$t = x^2 + 2x$",
        "correct": true
      },
      {
        "text": "$t = 2x$",
        "correct": false
      },
      {
        "text": "$t = x + 2$",
        "correct": false
      }
    ],
    "explanation": "Đặt $t = x^2 + 2x$, phương trình trở thành bậc hai $t^2 - 2t - 3 = 0$ rất dễ giải."
  },
  {
    "id": 8,
    "title": "Câu 8: Phương trình chứa ẩn ở mẫu",
    "pts": 20,
    "question": "Nghiệm của phương trình $\\frac{x^2 - 1}{x - 1} = 3$ là:",
    "options": [
      {
        "text": "$x = 1$",
        "correct": false
      },
      {
        "text": "$x = 2$",
        "correct": true
      },
      {
        "text": "$x = 1$ hoặc $x = 2$",
        "correct": false
      },
      {
        "text": "Vô nghiệm",
        "correct": false
      }
    ],
    "explanation": "ĐKXĐ: $x \\ne 1$. Rút gọn: $\\frac{(x - 1)(x + 1)}{x - 1} = 3 \\iff x + 1 = 3 \\iff x = 2$ (thỏa mãn ĐKXĐ)."
  },
  {
    "id": 9,
    "title": "Câu 9: Tiếp điểm của Parabol",
    "pts": 20,
    "question": "Tọa độ tiếp điểm của đường thẳng $y = 4x - 4$ với parabol $y = x^2$ là:",
    "options": [
      {
        "text": "$(2; 4)$",
        "correct": true
      },
      {
        "text": "(-2; 4)",
        "correct": false
      },
      {
        "text": "(1; 1)",
        "correct": false
      },
      {
        "text": "(0; -4)",
        "correct": false
      }
    ],
    "explanation": "Phương trình hoành độ giao điểm: $x^2 - 4x + 4 = 0 \\iff (x - 2)^2 = 0 \\iff x = 2$. Suy ra $y = 2^2 = 4$. Tọa độ tiếp điểm là $(2; 4)$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tổng các nghiệm phương trình trùng phương",
    "pts": 20,
    "question": "Tổng các nghiệm của phương trình $x^4 - 10x^2 + 9 = 0$ bằng:",
    "options": [
      {
        "text": "0",
        "correct": true
      },
      {
        "text": "10",
        "correct": false
      },
      {
        "text": "9",
        "correct": false
      },
      {
        "text": "-10",
        "correct": false
      }
    ],
    "explanation": "Nghiệm của phương trình là $\\pm 1$ và $\\pm 3$. Tổng các nghiệm là $1 + (-1) + 3 + (-3) = 0$ (phương trình trùng phương có các cặp nghiệm đối xứng qua $0$)."
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
                const slM = document.getElementById('slM');
                const slN = document.getElementById('slN');
                const vM = document.getElementById('vM');
                const vN = document.getElementById('vN');
                const out1 = document.getElementById('lab1Output');

                function drawIntersection() {
                    const m = parseFloat(slM.value);
                    const n = parseFloat(slN.value);
                    vM.textContent = 'm = ' + m.toFixed(1);
                    vN.textContent = 'n = ' + n.toFixed(1);

                    const a = 0.5; // (P): y = 0.5 x^2
                    const w = c1.width;
                    const h = c1.height;
                    const ox = w / 2;
                    const oy = h / 2 + 60;
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

                    // Parabol y = 0.5 x^2
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    for (let px = 0; px <= w; px += 2) {
                        const xm = (px - ox) / scale;
                        const ym = a * xm * xm;
                        const py = oy - ym * scale;
                        if (px === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.stroke();

                    // Line y = mx + n
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    const xL = (0 - ox) / scale;
                    const yL = m * xL + n;
                    ctx.moveTo(0, oy - yL * scale);
                    const xR = (w - ox) / scale;
                    const yR = m * xR + n;
                    ctx.lineTo(w, oy - yR * scale);
                    ctx.stroke();

                    // Solve 0.5 x^2 - mx - n = 0
                    // a=0.5, b=-m, c=-n => delta = m^2 - 4(0.5)(-n) = m^2 + 2n
                    const delta = m * m + 2 * n;
                    let info = '';

                    if (delta > 1e-4) {
                        const x1 = (m + Math.sqrt(delta)) / 1;
                        const x2 = (m - Math.sqrt(delta)) / 1;
                        [x1, x2].forEach((rx, idx) => {
                            const ry = a * rx * rx;
                            const px = ox + rx * scale;
                            const py = oy - ry * scale;
                            ctx.fillStyle = '#ef4444';
                            ctx.beginPath(); ctx.arc(px, py, 6, 0, Math.PI * 2); ctx.fill();
                            ctx.fillStyle = '#f8fafc';
                            ctx.font = '12px sans-serif';
                            ctx.fillText(`M${idx+1}(${rx.toFixed(1)}; ${ry.toFixed(1)})`, px + 8, py - 6);
                        });
                        info = `<span style="color: #4ade80;">Cắt nhau tại 2 điểm</span> | $\\Delta = ${delta.toFixed(2)} > 0$`;
                    } else if (Math.abs(delta) <= 1e-4) {
                        const x0 = m;
                        const y0 = a * x0 * x0;
                        const px = ox + x0 * scale;
                        const py = oy - y0 * scale;
                        ctx.fillStyle = '#eab308';
                        ctx.beginPath(); ctx.arc(px, py, 7, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#f8fafc';
                        ctx.font = '12px sans-serif';
                        ctx.fillText(`Tiếp điểm (${x0.toFixed(1)}; ${y0.toFixed(1)})`, px + 8, py - 6);
                        info = `<span style="color: #facc15;">Tiếp xúc tại 1 điểm duy nhất</span> | $\\Delta = 0$`;
                    } else {
                        info = `<span style="color: #f87171;">Không giao nhau</span> | $\\Delta = ${delta.toFixed(2)} < 0$`;
                    }

                    out1.innerHTML = `<strong>(P):</strong> $y = 0.5x^2$ | <strong>(d):</strong> $y = ${m}x + ${n}$ | <strong>Trạng thái:</strong> ${info}`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slM.addEventListener('input', drawIntersection);
                slN.addEventListener('input', drawIntersection);
                drawIntersection();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const inA = document.getElementById('biA');
                const inB = document.getElementById('biB');
                const inC = document.getElementById('biC');
                const btn = document.getElementById('btnSolveBi');
                const out2 = document.getElementById('lab2Output');

                function solveBiquadratic() {
                    const a = parseFloat(inA.value);
                    const b = parseFloat(inB.value);
                    const c = parseFloat(inC.value);

                    if (isNaN(a) || a === 0) {
                        out2.innerHTML = '<span style="color:#ef4444;">Hệ số a phải khác 0!</span>';
                        return;
                    }

                    let html = `<p><strong>Phương trình:</strong> $${a}x^4 + (${b})x^2 + (${c}) = 0$ (1)</p>`;
                    html += `<p>Đặt $t = x^2$ ($t \\ge 0$). Phương trình (1) trở thành: $${a}t^2 + (${b})t + (${c}) = 0$ (2)</p>`;

                    const delta = b * b - 4 * a * c;
                    html += `<p>Xét $\\Delta = (${b})^2 - 4 \\cdot ${a} \\cdot (${c}) = ${delta}$</p>`;

                    if (delta < 0) {
                        html += `<p style="color:#ef4444;">&rArr; Phương trình (2) vô nghiệm &rArr; Phương trình (1) VÔ NGHIỆM.</p>`;
                    } else if (delta === 0) {
                        const t0 = -b / (2 * a);
                        html += `<p>Phương trình (2) có nghiệm kép: $t_1 = t_2 = ${t0.toFixed(2)}$</p>`;
                        if (t0 > 0) {
                            const x1 = Math.sqrt(t0);
                            html += `<p style="color:#22c55e;">&rArr; Thỏa mãn $t \\ge 0$: $x = \\pm \\sqrt{${t0.toFixed(2)}} \\approx \\pm ${x1.toFixed(3)}$ (Phương trình có 2 nghiệm).</p>`;
                        } else if (t0 === 0) {
                            html += `<p style="color:#22c55e;">&rArr; $x = 0$ (Phương trình có 1 nghiệm duy nhất).</p>`;
                        } else {
                            html += `<p style="color:#ef4444;">&rArr; $t < 0$ (loại) &rArr; Phương trình (1) vô nghiệm.</p>`;
                        }
                    } else {
                        const t1 = (-b + Math.sqrt(delta)) / (2 * a);
                        const t2 = (-b - Math.sqrt(delta)) / (2 * a);
                        html += `<p>Phương trình (2) có 2 nghiệm: $t_1 = ${t1.toFixed(2)},\ t_2 = ${t2.toFixed(2)}$</p>`;
                        const roots = [];
                        if (t1 > 0) roots.push(Math.sqrt(t1), -Math.sqrt(t1));
                        else if (t1 === 0) roots.push(0);

                        if (t2 > 0) roots.push(Math.sqrt(t2), -Math.sqrt(t2));
                        else if (t2 === 0 && !roots.includes(0)) roots.push(0);

                        if (roots.length > 0) {
                            roots.sort((u, v) => u - v);
                            const formatted = roots.map(r => r.toFixed(2)).join(';\ ');
                            html += `<p style="color:#22c55e;"><strong>Kết luận:</strong> Phương trình (1) có ${roots.length} nghiệm: $x \\in \\{${formatted}\\}$</p>`;
                        } else {
                            html += `<p style="color:#ef4444;">Cả 2 nghiệm $t$ đều âm &rArr; Phương trình (1) VÔ NGHIỆM.</p>`;
                        }
                    }

                    out2.innerHTML = html;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                btn.addEventListener('click', solveBiquadratic);
                solveBiquadratic();
            
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
