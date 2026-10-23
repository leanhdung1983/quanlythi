// ================================================================
// Bài 6: Bất Phương Trình Bậc Nhất Một Ẩn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai6_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Giải Bất Phương Trình 9',
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
    "title": "Thử Thách 1: Nhận Biết Bất Phương Trình Bậc Nhất Một Ẩn",
    "pts": 20,
    "question": "Bất phương trình nào sau đây là bất phương trình bậc nhất một ẩn?",
    "options": [
      {
        "text": "$3x - 5 > 0$",
        "correct": true
      },
      {
        "text": "$2x^2 + 1 \\le 0$",
        "correct": false
      },
      {
        "text": "$0x + 4 < 0$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{x} - 2 \\ge 0$",
        "correct": false
      }
    ],
    "explanation": "Bất phương trình bậc nhất một ẩn có dạng $ax + b < 0$ (hoặc $> 0, \\le 0, \\ge 0$) với $a \\neq 0$ và ẩn có bậc 1. Chỉ có $3x - 5 > 0$ thỏa mãn."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Kiểm Tra Nghiệm Của Bất Phương Trình",
    "pts": 20,
    "question": "Giá trị $x = 2$ là một nghiệm của bất phương trình nào sau đây?",
    "options": [
      {
        "text": "$3x - 1 > 4$",
        "correct": true
      },
      {
        "text": "$2x + 5 < 8$",
        "correct": false
      },
      {
        "text": "$-4x > -7$",
        "correct": false
      },
      {
        "text": "$x - 5 \\ge 0$",
        "correct": false
      }
    ],
    "explanation": "Thay $x = 2$ vào $3x - 1 > 4$: $3(2) - 1 = 5 > 4$ (đúng). Vậy $x = 2$ là nghiệm."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Giải BPT Với Hệ Số Âm",
    "pts": 20,
    "question": "Nghiệm của bất phương trình $-3x + 9 \\le 0$ là:",
    "options": [
      {
        "text": "$x \\ge 3$",
        "correct": true
      },
      {
        "text": "$x \\le 3$",
        "correct": false
      },
      {
        "text": "$x \\ge -3$",
        "correct": false
      },
      {
        "text": "$x < 3$",
        "correct": false
      }
    ],
    "explanation": "Chuyển vế: $-3x \\le -9$. Chia cả hai vế cho $-3 < 0$, phải đổi chiều dấu $\\le$ thành $\\ge$: $x \\ge \\frac{-9}{-3} = 3$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Giải BPT Chứa Dấu Ngoặc",
    "pts": 20,
    "question": "Giải bất phương trình $2(x - 3) > 5x + 3$. Tập nghiệm là:",
    "options": [
      {
        "text": "$x < -3$",
        "correct": true
      },
      {
        "text": "$x > -3$",
        "correct": false
      },
      {
        "text": "$x < 3$",
        "correct": false
      },
      {
        "text": "$x > 3$",
        "correct": false
      }
    ],
    "explanation": "Khai triển: $2x - 6 > 5x + 3 \\iff 2x - 5x > 3 + 6 \\iff -3x > 9 \\iff x < -3$ (chia cho $-3$ đổi chiều)."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: BPT Có Mẫu Số Dương",
    "pts": 20,
    "question": "Nghiệm của bất phương trình $\\frac{2x - 1}{3} \\le \\frac{x + 2}{2}$ là:",
    "options": [
      {
        "text": "$x \\le 8$",
        "correct": true
      },
      {
        "text": "$x \\ge 8$",
        "correct": false
      },
      {
        "text": "$x \\le -8$",
        "correct": false
      },
      {
        "text": "$x < 8$",
        "correct": false
      }
    ],
    "explanation": "Nhân hai vế với 6 (số dương): $2(2x - 1) \\le 3(x + 2) \\iff 4x - 2 \\le 3x + 6 \\iff 4x - 3x \\le 6 + 2 \\iff x \\le 8$."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Tìm Nghiệm Nguyên Dương",
    "pts": 20,
    "question": "Số nghiệm nguyên dương của bất phương trình $4x - 7 < 5$ là:",
    "options": [
      {
        "text": "$2$",
        "correct": true
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "Vô số",
        "correct": false
      }
    ],
    "explanation": "Giải BPT: $4x < 12 \\iff x < 3$. Các số nguyên dương thỏa mãn $x < 3$ là $x \\in \\{1; 2\\}$. Có đúng 2 nghiệm nguyên dương."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Số Nghiệm Nguyên Lớn Nhất",
    "pts": 20,
    "question": "Số nguyên lớn nhất thỏa mãn bất phương trình $5 - 2x > 0$ là:",
    "options": [
      {
        "text": "$2$",
        "correct": true
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      }
    ],
    "explanation": "Giải BPT: $-2x > -5 \\iff x < \\frac{5}{2} = 2,5$. Số nguyên lớn nhất nhỏ hơn 2,5 là 2."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Nhận Dạng Hình Vẽ Trục Số",
    "pts": 20,
    "question": "Hình vẽ trên trục số có dấu ngoặc vuông <code>[</code> tại điểm 2 và gạch bỏ phần bên trái biểu diễn tập nghiệm của bất phương trình nào?",
    "options": [
      {
        "text": "$x \\ge 2$",
        "correct": true
      },
      {
        "text": "$x > 2$",
        "correct": false
      },
      {
        "text": "$x \\le 2$",
        "correct": false
      },
      {
        "text": "$x < 2$",
        "correct": false
      }
    ],
    "explanation": "Dấu ngoặc vuông <code>[</code> hướng về phía bên phải và gạch bỏ bên trái biểu diễn tập hợp các số thực lớn hơn hoặc bằng 2, tức $x \\ge 2$."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Tìm m Để BPT Có Tập Nghiệm Xác Định",
    "pts": 20,
    "question": "Tìm $m$ để bất phương trình $(m - 2)x + 3 > 0$ là bất phương trình bậc nhất một ẩn:",
    "options": [
      {
        "text": "$m \\neq 2$",
        "correct": true
      },
      {
        "text": "$m = 2$",
        "correct": false
      },
      {
        "text": "$m > 2$",
        "correct": false
      },
      {
        "text": "$m < 2$",
        "correct": false
      }
    ],
    "explanation": "Để $(m - 2)x + 3 > 0$ là bất phương trình bậc nhất một ẩn thì hệ số của $x$ phải khác 0, tức $m - 2 \\neq 0 \\iff m \\neq 2$."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Tình Huống Chi Phí Mua Sắm",
    "pts": 20,
    "question": "Bạn An có 200 nghìn đồng. An mua một hộp bút giá 45 nghìn đồng và một số quyển vở giá 12 nghìn đồng/quyển. Số quyển vở tối đa mà An có thể mua được là:",
    "options": [
      {
        "text": "$12$ quyển",
        "correct": true
      },
      {
        "text": "$13$ quyển",
        "correct": false
      },
      {
        "text": "$11$ quyển",
        "correct": false
      },
      {
        "text": "$14$ quyển",
        "correct": false
      }
    ],
    "explanation": "Gọi số quyển vở là $x$ ($x \\in \\mathbb{N}^*$). Ta có bất phương trình $45 + 12x \\le 200 \\iff 12x \\le 155 \\iff x \\le \\frac{155}{12} \\approx 12,9$. Vì $x$ nguyên dương nên số quyển vở tối đa là 12 quyển."
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
                const sA = document.getElementById('sliderBPTA');
                const sB = document.getElementById('sliderBPTB');
                const tA = document.getElementById('txtBPTA');
                const tB = document.getElementById('txtBPTB');
                const out = document.getElementById('lab1BPTOutput');

                function solveBPT() {
                    const a = parseFloat(sA.value);
                    const b = parseFloat(sB.value);
                    tA.textContent = a; tB.textContent = b;

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    if (a === 0) {
                        out.innerHTML = '<strong>Hệ số a = 0:</strong> Không phải bất phương trình bậc nhất một ẩn.';
                        return;
                    }

                    const root = -b / a;
                    const bSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
                    const ineqSign = a > 0 ? '>' : '<';

                    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText(`BPT: ${a}x ${bSign} > 0`, 30, 35);

                    ctx.fillStyle = '#94a3b8'; ctx.font = '13px Segoe UI';
                    ctx.fillText(`Bước 1 (Chuyển vế): ${a}x > ${-b}`, 30, 65);

                    if (a < 0) {
                        ctx.fillStyle = '#f43f5e'; ctx.font = 'bold 13px Segoe UI';
                        ctx.fillText(`Bước 2 (Chia cho ${a} < 0 => ĐỔI CHIỀU): x < ${root.toFixed(2)}`, 30, 95);
                    } else {
                        ctx.fillStyle = '#34d399'; ctx.font = 'bold 13px Segoe UI';
                        ctx.fillText(`Bước 2 (Chia cho ${a} > 0 => Giữ chiều): x > ${root.toFixed(2)}`, 30, 95);
                    }

                    // Draw number line at bottom
                    const axisY = 145;
                    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(40, axisY); ctx.lineTo(w - 40, axisY); ctx.stroke();

                    const ox = w / 2;
                    const scale = 20;
                    const pRootX = Math.max(50, Math.min(w - 50, ox + root * scale));

                    // Bracket
                    ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 18px Segoe UI'; ctx.textAlign = 'center';
                    const bracket = a > 0 ? '(' : ')';
                    ctx.fillText(bracket, pRootX, axisY + 6);
                    ctx.font = '12px Segoe UI';
                    ctx.fillText(`${root.toFixed(1)}`, pRootX, axisY + 24);

                    // Hatching invalid side
                    ctx.strokeStyle = '#475569'; ctx.lineWidth = 1;
                    if (a > 0) {
                        // Keep right, hatch left
                        for (let x = 40; x < pRootX - 5; x += 6) {
                            ctx.beginPath(); ctx.moveTo(x, axisY - 8); ctx.lineTo(x + 5, axisY + 8); ctx.stroke();
                        }
                    } else {
                        // Keep left, hatch right
                        for (let x = pRootX + 5; x < w - 40; x += 6) {
                            ctx.beginPath(); ctx.moveTo(x, axisY - 8); ctx.lineTo(x + 5, axisY + 8); ctx.stroke();
                        }
                    }

                    out.innerHTML = `<strong>Nghiệm của BPT:</strong> $x ${ineqSign} ${root.toFixed(2)}$. <br>Tập nghiệm: $S = \\{x \\in \\mathbb{R} \mid x ${ineqSign} ${root.toFixed(2)}\\}$.`;
                    if (window.renderMathInElement) {
                        renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                sA.addEventListener('input', solveBPT);
                sB.addEventListener('input', solveBPT);
                solveBPT();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const out = document.getElementById('lab2AxisOutput');

                function renderAxis(type, val, bracketChar, keepRight) {
                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const oy = h / 2;
                    const ox = w / 2;
                    const scale = 28;

                    // Axis line
                    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2.5;
                    ctx.beginPath(); ctx.moveTo(30, oy); ctx.lineTo(w - 30, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(w - 30, oy); ctx.lineTo(w - 42, oy - 6); ctx.lineTo(w - 42, oy + 6); ctx.fill();

                    const posX = ox + val * scale;

                    // Origin
                    ctx.fillStyle = '#64748b'; ctx.font = '12px Segoe UI'; ctx.textAlign = 'center';
                    ctx.beginPath(); ctx.arc(ox, oy, 3, 0, Math.PI * 2); ctx.fill();
                    ctx.fillText('0', ox, oy + 20);

                    // Bracket at val
                    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 22px Segoe UI';
                    ctx.fillText(bracketChar, posX, oy + 7);
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText(`${val}`, posX, oy + 24);

                    // Hatching
                    ctx.strokeStyle = '#e2e8f0'; ctx.lineWidth = 1.2;
                    if (keepRight) {
                        for (let x = 30; x < posX - 4; x += 8) {
                            ctx.beginPath(); ctx.moveTo(x, oy - 12); ctx.lineTo(x + 7, oy + 12); ctx.stroke();
                        }
                    } else {
                        for (let x = posX + 6; x < w - 30; x += 8) {
                            ctx.beginPath(); ctx.moveTo(x, oy - 12); ctx.lineTo(x + 7, oy + 12); ctx.stroke();
                        }
                    }

                    out.innerHTML = `<strong>Tập nghiệm:</strong> $S = \\{x \mid ${type}\\}$. Kí hiệu mốc <strong>${bracketChar}</strong> tại điểm $x = ${val}$, gạch bỏ miền không thuộc nghiệm.`;
                    if (window.renderMathInElement) {
                        renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                document.getElementById('btnTypeGT').addEventListener('click', () => renderAxis('x > 3', 3, '(', true));
                document.getElementById('btnTypeLT').addEventListener('click', () => renderAxis('x < -1', -1, ')', false));
                document.getElementById('btnTypeGE').addEventListener('click', () => renderAxis('x \\ge 2', 2, '[', true));
                document.getElementById('btnTypeLE').addEventListener('click', () => renderAxis('x \\le 0', 0, ']', false));

                renderAxis('x > 3', 3, '(', true);
            
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
