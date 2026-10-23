// ================================================================
// Bài 1: Khái Niệm Phương Trình Và Hệ Hai Phương Trình Bậc Nhất Hai Ẩn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai1_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Hiệp Sĩ Phương Trình 9',
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
    "title": "Thử Thách 1: Nhận Biết Phương Trình Bậc Nhất 2 Ẩn",
    "pts": 20,
    "question": "Phương trình nào dưới đây là phương trình bậc nhất hai ẩn?",
    "options": [
      {
        "text": "$2x^2 + 3y = 5$",
        "correct": false
      },
      {
        "text": "$3x - 5y = 7$",
        "correct": true
      },
      {
        "text": "$\\frac{2}{x} + y = 1$",
        "correct": false
      },
      {
        "text": "$xy + x = 4$",
        "correct": false
      }
    ],
    "explanation": "Phương trình bậc nhất hai ẩn có dạng $ax + by = c$ với $a, b$ không đồng thời bằng 0 và bậc của mỗi ẩn đều là 1. Do đó $3x - 5y = 7$ là phương trình bậc nhất hai ẩn."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Kiểm Tra Nghiệm Của Phương Trình",
    "pts": 20,
    "question": "Cặp số nào sau đây là một nghiệm của phương trình $2x - 3y = 7$?",
    "options": [
      {
        "text": "$(2; -1)$",
        "correct": true
      },
      {
        "text": "$(1; -2)$",
        "correct": false
      },
      {
        "text": "$(5; 2)$",
        "correct": false
      },
      {
        "text": "(-1; 3)",
        "correct": false
      }
    ],
    "explanation": "Thay cặp $(x; y) = (2; -1)$ vào phương trình: $2(2) - 3(-1) = 4 + 3 = 7$. Đẳng thức đúng nên $(2; -1)$ là một nghiệm."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Tìm Tham Số Để Cặp Số Là Nghiệm",
    "pts": 20,
    "question": "Tìm giá trị của $m$ để cặp số $(x; y) = (1; 2)$ là nghiệm của phương trình $mx + 4y = 11$:",
    "options": [
      {
        "text": "$m = 2$",
        "correct": false
      },
      {
        "text": "$m = 3$",
        "correct": true
      },
      {
        "text": "$m = -3$",
        "correct": false
      },
      {
        "text": "$m = 1$",
        "correct": false
      }
    ],
    "explanation": "Thay $(x; y) = (1; 2)$ vào phương trình: $m(1) + 4(2) = 11 \\iff m + 8 = 11 \\iff m = 3$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Số Nghiệm Của Phương Trình Bậc Nhất 2 Ẩn",
    "pts": 20,
    "question": "Phương trình $5x + 0y = 10$ có bao nhiêu nghiệm?",
    "options": [
      {
        "text": "Có đúng 1 nghiệm duy nhất là $x = 2$",
        "correct": false
      },
      {
        "text": "Vô nghiệm",
        "correct": false
      },
      {
        "text": "Có vô số nghiệm dạng $(2; y)$ với mọi $y \\in \\mathbb{R}$",
        "correct": true
      },
      {
        "text": "Có đúng 2 nghiệm",
        "correct": false
      }
    ],
    "explanation": "Phương trình $5x + 0y = 10 \\iff x = 2$. Với mỗi giá trị bất kì của $y \\in \\mathbb{R}$, cặp $(2; y)$ đều thỏa mãn phương trình. Vậy phương trình có vô số nghiệm."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Nhận Biết Hệ Hai Phương Trình",
    "pts": 20,
    "question": "Hệ phương trình nào sau đây là hệ hai phương trình bậc nhất hai ẩn?",
    "options": [
      {
        "text": "$\\begin{cases} x - 2y = 3 \\\\ 3x + y = -1 \\end{cases}$",
        "correct": true
      },
      {
        "text": "$\\begin{cases} x^2 + y = 4 \\\\ x - y = 2 \\end{cases}$",
        "correct": false
      },
      {
        "text": "$\\begin{cases} \\frac{1}{x} + \\frac{1}{y} = 1 \\\\ x + y = 3 \\end{cases}$",
        "correct": false
      },
      {
        "text": "$\\begin{cases} xy = 6 \\\\ x + y = 5 \\end{cases}$",
        "correct": false
      }
    ],
    "explanation": "Hệ hai phương trình bậc nhất hai ẩn gồm hai phương trình đều có dạng bậc nhất $ax + by = c$ và $a'x + b'y = c'$. Chỉ có hệ $\\begin{cases} x - 2y = 3 \\\\ 3x + y = -1 \\end{cases}$ thỏa mãn."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Nghiệm Chung Của Hệ Phương Trình",
    "pts": 20,
    "question": "Cặp số $(x; y) = (1; 2)$ là nghiệm của hệ phương trình nào sau đây?",
    "options": [
      {
        "text": "$\\begin{cases} 2x + y = 4 \\\\ x - y = -1 \\end{cases}$",
        "correct": true
      },
      {
        "text": "$\\begin{cases} x + y = 4 \\\\ 2x - y = 1 \\end{cases}$",
        "correct": false
      },
      {
        "text": "$\\begin{cases} 3x - y = 2 \\\\ x + 2y = 4 \\end{cases}$",
        "correct": false
      },
      {
        "text": "$\\begin{cases} x - y = 1 \\\\ 2x + y = 5 \\end{cases}$",
        "correct": false
      }
    ],
    "explanation": "Thử $(1; 2)$ vào hệ $\\begin{cases} 2(1) + 2 = 4 \\\\ 1 - 2 = -1 \\end{cases}$: cả hai phương trình đều đúng. Do đó $(1; 2)$ là nghiệm của hệ."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Đường Thẳng Biểu Diễn Nghiệm Song Song Trục Hoành",
    "pts": 20,
    "question": "Đường thẳng biểu diễn tập nghiệm của phương trình $0x + 2y = 6$ có đặc điểm gì?",
    "options": [
      {
        "text": "Song song với trục tung $Oy$ và đi qua điểm $(3; 0)$",
        "correct": false
      },
      {
        "text": "Song song với trục hoành $Ox$ và cắt trục tung tại điểm $(0; 3)$",
        "correct": true
      },
      {
        "text": "Đi qua gốc tọa độ $O(0; 0)$",
        "correct": false
      },
      {
        "text": "Là đường phân giác của góc phần tư thứ nhất",
        "correct": false
      }
    ],
    "explanation": "Phương trình $0x + 2y = 6 \\iff y = 3$. Đây là đường thẳng song song với trục hoành $Ox$ và cắt trục tung $Oy$ tại điểm $(0; 3)$."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Ý Nghĩa Hình Học Của Hệ Vô Nghiệm",
    "pts": 20,
    "question": "Nếu hệ hai phương trình bậc nhất hai ẩn vô nghiệm thì trên mặt phẳng tọa độ hai đường thẳng tương ứng có vị trí như thế nào?",
    "options": [
      {
        "text": "Cắt nhau tại 1 điểm duy nhất",
        "correct": false
      },
      {
        "text": "Song song với nhau",
        "correct": true
      },
      {
        "text": "Trùng nhau",
        "correct": false
      },
      {
        "text": "Vuông góc với nhau",
        "correct": false
      }
    ],
    "explanation": "Hệ vô nghiệm nghĩa là không có điểm chung nào giữa hai đường biểu diễn, tức là hai đường thẳng đó song song với nhau."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Điều Kiện Để Hệ Có Vô Số Nghiệm",
    "pts": 20,
    "question": "Cho hệ phương trình $\\begin{cases} x + 2y = 3 \\\\ 2x + my = 6 \\end{cases}$. Giá trị của $m$ để hệ có vô số nghiệm là:",
    "options": [
      {
        "text": "$m = 2$",
        "correct": false
      },
      {
        "text": "$m = 4$",
        "correct": true
      },
      {
        "text": "$m = -4$",
        "correct": false
      },
      {
        "text": "$m = 6$",
        "correct": false
      }
    ],
    "explanation": "Để hệ có vô số nghiệm thì hai đường thẳng phải trùng nhau, tức tỉ lệ các hệ số bằng nhau: $\\frac{1}{2} = \\frac{2}{m} = \\frac{3}{6} \\implies m = 4$."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Thiết Lập Phương Trình Từ Tình Huống Thực Tế",
    "pts": 20,
    "question": "Một người mua $x$ chiếc bút bi giá 5 nghìn đồng/chiếc và $y$ quyển vở giá 12 nghìn đồng/quyển, tổng số tiền phải trả là 86 nghìn đồng. Phương trình biểu thị số tiền là:",
    "options": [
      {
        "text": "$12x + 5y = 86$",
        "correct": false
      },
      {
        "text": "$5x + 12y = 86$",
        "correct": true
      },
      {
        "text": "$5x - 12y = 86$",
        "correct": false
      },
      {
        "text": "$x + y = 86$",
        "correct": false
      }
    ],
    "explanation": "Số tiền mua bút là $5x$ (nghìn đồng), số tiền mua vở là $12y$ (nghìn đồng). Tổng số tiền là $5x + 12y = 86$ (nghìn đồng)."
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
                const sA = document.getElementById('sliderA1');
                const sB = document.getElementById('sliderB1');
                const sC = document.getElementById('sliderC1');
                const vA = document.getElementById('valA1');
                const vB = document.getElementById('valB1');
                const vC = document.getElementById('valC1');
                const out = document.getElementById('lab1Output');

                function draw() {
                    const a = parseFloat(sA.value);
                    const b = parseFloat(sB.value);
                    const c = parseFloat(sC.value);
                    vA.textContent = a; vB.textContent = b; vC.textContent = c;

                    const w = canvas.width;
                    const h = canvas.height;
                    const ox = w / 2;
                    const oy = h / 2;
                    const scale = 25;

                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

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
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

                    // Origin & Labels
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '12px Segoe UI';
                    ctx.fillText('O', ox - 14, oy + 14);
                    ctx.fillText('x', w - 15, oy - 8);
                    ctx.fillText('y', ox + 8, 15);

                    if (a === 0 && b === 0) {
                        out.innerHTML = '<strong>Trường hợp suy biến:</strong> $a = b = 0$, không phải phương trình bậc nhất hai ẩn.';
                        if (window.renderMathInElement) renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}] });
                        return;
                    }

                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();

                    if (b !== 0) {
                        const xMin = -ox / scale;
                        const xMax = (w - ox) / scale;
                        const y1 = (c - a * xMin) / b;
                        const y2 = (c - a * xMax) / b;
                        ctx.moveTo(0, oy - y1 * scale);
                        ctx.lineTo(w, oy - y2 * scale);
                    } else {
                        const lineX = c / a;
                        const px = ox + lineX * scale;
                        ctx.moveTo(px, 0);
                        ctx.lineTo(px, h);
                    }
                    ctx.stroke();

                    // Print equation and sample solution
                    let eqStr = '';
                    if (a !== 0) eqStr += (a === 1 ? 'x' : (a === -1 ? '-x' : `${a}x`));
                    if (b !== 0) {
                        const bSign = b > 0 ? (eqStr ? '+ ' : '') : '- ';
                        const absB = Math.abs(b);
                        eqStr += ` ${bSign}${absB === 1 ? 'y' : `${absB}y`}`;
                    }
                    eqStr += ` = ${c}`;

                    let sampleX = 1;
                    let sampleY = b !== 0 ? ((c - a * sampleX) / b).toFixed(1) : 0;
                    out.innerHTML = `<strong>Đường thẳng:</strong> $${eqStr}$ &nbsp;|&nbsp; <strong>Một nghiệm mẫu:</strong> $(x; y) = (1; ${sampleY})$`;
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
                const out = document.getElementById('lab2Output');

                let sys = { a1: 2, b1: 1, c1: 4, a2: 1, b2: -1, c2: 2 };

                function drawSys() {
                    const w = canvas.width;
                    const h = canvas.height;
                    const ox = w / 2;
                    const oy = h / 2;
                    const scale = 22;

                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Grid & Axes
                    ctx.strokeStyle = '#1e293b'; ctx.lineWidth = 1;
                    for (let x = ox % scale; x < w; x += scale) {
                        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
                    }
                    for (let y = oy % scale; y < h; y += scale) {
                        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                    }
                    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

                    // Line 1: Cyan
                    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    let y1A = (sys.c1 - sys.a1 * (-ox / scale)) / sys.b1;
                    let y1B = (sys.c1 - sys.a1 * ((w - ox) / scale)) / sys.b1;
                    ctx.moveTo(0, oy - y1A * scale);
                    ctx.lineTo(w, oy - y1B * scale);
                    ctx.stroke();

                    // Line 2: Rose
                    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    let y2A = (sys.c2 - sys.a2 * (-ox / scale)) / sys.b2;
                    let y2B = (sys.c2 - sys.a2 * ((w - ox) / scale)) / sys.b2;
                    ctx.moveTo(0, oy - y2A * scale);
                    ctx.lineTo(w, oy - y2B * scale);
                    ctx.stroke();

                    // Calculate determinant D
                    const D = sys.a1 * sys.b2 - sys.a2 * sys.b1;
                    const Dx = sys.c1 * sys.b2 - sys.c2 * sys.b1;
                    const Dy = sys.a1 * sys.c2 - sys.a2 * sys.c1;

                    if (D !== 0) {
                        const solX = Dx / D;
                        const solY = Dy / D;
                        // Draw intersection point
                        ctx.fillStyle = '#fbbf24';
                        ctx.beginPath();
                        ctx.arc(ox + solX * scale, oy - solY * scale, 6, 0, Math.PI * 2);
                        ctx.fill();

                        out.innerHTML = `<strong>Hai đường thẳng cắt nhau:</strong> Giao điểm $M(${solX.toFixed(1)}; ${solY.toFixed(1)})$. Hệ có <strong>1 nghiệm duy nhất</strong>: $(x; y) = (${solX.toFixed(1)}; ${solY.toFixed(1)})$.`;
                    } else if (Dx === 0 && Dy === 0) {
                        out.innerHTML = '<strong>Hai đường thẳng trùng nhau:</strong> Hệ có <strong>vô số nghiệm</strong> dạng tập hợp điểm trên đường thẳng.';
                    } else {
                        out.innerHTML = '<strong>Hai đường thẳng song song:</strong> Không có giao điểm nào. Hệ <strong>vô nghiệm</strong>.';
                    }

                    if (window.renderMathInElement) {
                        renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                document.getElementById('btnPresetIntersect').addEventListener('click', () => {
                    sys = { a1: 2, b1: 1, c1: 4, a2: 1, b2: -1, c2: 2 };
                    drawSys();
                });
                document.getElementById('btnPresetParallel').addEventListener('click', () => {
                    sys = { a1: 2, b1: 1, c1: 4, a2: 2, b2: 1, c2: -2 };
                    drawSys();
                });
                document.getElementById('btnPresetCoincide').addEventListener('click', () => {
                    sys = { a1: 2, b1: 1, c1: 4, a2: 4, b2: 2, c2: 8 };
                    drawSys();
                });

                drawSys();
            
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
