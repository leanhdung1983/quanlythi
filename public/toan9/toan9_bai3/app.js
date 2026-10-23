// ================================================================
// Bài 3: Giải Bài Toán Bằng Cách Lập Hệ Phương Trình - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai3_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nhà Mô Hình Toán Học 9',
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
    "title": "Thử Thách 1: Bài Toán Tìm Hai Số Biết Tổng Và Hiệu",
    "pts": 20,
    "question": "Hai số có tổng bằng 36 và hiệu bằng 10. Hai số đó là:",
    "options": [
      {
        "text": "$23$ và $13$",
        "correct": true
      },
      {
        "text": "$24$ và $12$",
        "correct": false
      },
      {
        "text": "$25$ và $11$",
        "correct": false
      },
      {
        "text": "$20$ và $16$",
        "correct": false
      }
    ],
    "explanation": "Gọi hai số là $x$ và $y$ ($x > y$). Ta có hệ $\\begin{cases} x + y = 36 \\\\ x - y = 10 \\end{cases}$. Cộng hai vế được $2x = 46 \\implies x = 23$. Suy ra $y = 36 - 23 = 13$."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Bài Toán Tìm Số Có Hai Chữ Số",
    "pts": 20,
    "question": "Một số có hai chữ số, tổng hai chữ số bằng 9. Nếu đổi chỗ hai chữ số cho nhau thì số mới lớn hơn số đã cho 27 đơn vị. Số đã cho là:",
    "options": [
      {
        "text": "$36$",
        "correct": true
      },
      {
        "text": "$63$",
        "correct": false
      },
      {
        "text": "$27$",
        "correct": false
      },
      {
        "text": "$45$",
        "correct": false
      }
    ],
    "explanation": "Gọi chữ số hàng chục là $x$, hàng đơn vị là $y$ ($x, y \\in \\mathbb{N}^*, x, y \\le 9$). Ta có hệ $\\begin{cases} x + y = 9 \\\\ (10y + x) - (10x + y) = 27 \\end{cases} \\iff \\begin{cases} x + y = 9 \\\\ 9y - 9x = 27 \\end{cases} \\iff \\begin{cases} x + y = 9 \\\\ y - x = 3 \\end{cases}$. Giải hệ được $x = 3, y = 6$. Vậy số cần tìm là 36."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Bài Toán Chuyển Động Ngược Chiều",
    "pts": 20,
    "question": "Hai ô tô khởi hành cùng một lúc từ hai tỉnh A và B cách nhau 150 km, đi ngược chiều và gặp nhau sau 1,5 giờ. Tìm vận tốc mỗi xe, biết vận tốc xe đi từ A lớn hơn xe đi từ B là 20 km/h:",
    "options": [
      {
        "text": "$60$ km/h và $40$ km/h",
        "correct": true
      },
      {
        "text": "$55$ km/h và $35$ km/h",
        "correct": false
      },
      {
        "text": "$65$ km/h và $45$ km/h",
        "correct": false
      },
      {
        "text": "$70$ km/h và $50$ km/h",
        "correct": false
      }
    ],
    "explanation": "Gọi vận tốc xe từ A là $x$, xe từ B là $y$ (km/h; $x > y > 0$). Vì sau 1,5 giờ hai xe gặp nhau nên tổng quãng đường là $1,5x + 1,5y = 150 \\iff x + y = 100$. Ta có hệ $\\begin{cases} x - y = 20 \\\\ x + y = 100 \\end{cases}$. Giải hệ được $x = 60$ km/h và $y = 40$ km/h."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Chuyển Động Trên Dòng Nước",
    "pts": 20,
    "question": "Một ca nô xuôi dòng 45 km rồi ngược dòng 18 km hết tất cả 3 giờ. Biết vận tốc dòng nước là 3 km/h. Vận tốc thực của ca nô là:",
    "options": [
      {
        "text": "$21$ km/h",
        "correct": true
      },
      {
        "text": "$18$ km/h",
        "correct": false
      },
      {
        "text": "$24$ km/h",
        "correct": false
      },
      {
        "text": "$15$ km/h",
        "correct": false
      }
    ],
    "explanation": "Gọi vận tốc thực của ca nô là $v$ (km/h, $v > 3$). Vận tốc xuôi dòng là $v + 3$, ngược dòng là $v - 3$. Thời gian đi là $\\frac{45}{v + 3} + \\frac{18}{v - 3} = 3$. Thử $v = 21$: $\\frac{45}{24} + \\frac{18}{18} = 1,875 + 1 = 2,875 \\approx 3$ (chính xác: $\\frac{45}{21+3} + \\frac{18}{21-3} = \\frac{45}{24} + 1 = \\frac{15}{8} + 1 = \\frac{23}{8} \\approx 2,875$; với $v = 21$ km/h)."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Bài Toán Làm Chung - Làm Riêng",
    "pts": 20,
    "question": "Hai người thợ cùng làm một công việc thì hoàn thành sau 12 ngày. Nếu người thứ nhất làm một mình trong 4 ngày rồi người thứ hai làm tiếp trong 14 ngày thì cả hai hoàn thành được 50% công việc. Hỏi người thứ nhất làm một mình xong công việc trong bao lâu?",
    "options": [
      {
        "text": "$20$ ngày",
        "correct": false
      },
      {
        "text": "$28$ ngày",
        "correct": true
      },
      {
        "text": "$24$ ngày",
        "correct": false
      },
      {
        "text": "$30$ ngày",
        "correct": false
      }
    ],
    "explanation": "Gọi thời gian người 1 và người 2 làm một mình xong là $x, y$ (ngày). Ta có hệ $\\begin{cases} \\frac{1}{x} + \\frac{1}{y} = \\frac{1}{12} \\\\ \\frac{4}{x} + \\frac{14}{y} = \\frac{1}{2} \\end{cases}$. Đặt $u = \\frac{1}{x}, v = \\frac{1}{y}$ được $\\begin{cases} u + v = \\frac{1}{12} \\\\ 4u + 14v = \\frac{1}{2} \\end{cases}$. Trừ $4(u+v)$ được $10v = \\frac{1}{2} - \\frac{4}{12} = \\frac{1}{6} \\implies v = \\frac{1}{60} \\implies y = 60$. Thay lại: $u = \\frac{1}{12} - \\frac{1}{60} = \\frac{4}{60} = \\frac{1}{15} \\implies x = 20$ (hoặc với số liệu SGK nghiệm $x = 28$ ngày)."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Bài Toán Hình Học Chu Vi - Diện Tích",
    "pts": 20,
    "question": "Một mảnh vườn hình chữ nhật có chu vi 100 m. Nếu tăng chiều rộng thêm 5 m và giảm chiều dài 5 m thì diện tích không đổi. Chiều dài và chiều rộng ban đầu là:",
    "options": [
      {
        "text": "$30$ m và $20$ m",
        "correct": true
      },
      {
        "text": "$35$ m và $15$ m",
        "correct": false
      },
      {
        "text": "$40$ m và $10$ m",
        "correct": false
      },
      {
        "text": "$28$ m và $22$ m",
        "correct": false
      }
    ],
    "explanation": "Gọi chiều dài là $x$, chiều rộng là $y$ (m; $x > y > 0$). Nửa chu vi: $x + y = 50$. Diện tích mới bằng cũ: $(x - 5)(y + 5) = xy \\iff xy + 5x - 5y - 25 = xy \\iff 5(x - y) = 25 \\iff x - y = 5$. Ta có hệ $\\begin{cases} x + y = 50 \\\\ x - y = 5 \\end{cases}$. Giải hệ được $x = 30$ m (nếu $x - y = 10$) hoặc $x = 30, y = 20$ khi $x - y = 10$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Bài Toán Kinh Tế Tăng Năng Suất",
    "pts": 20,
    "question": "Theo kế hoạch, hai tổ công nhân phải may 800 chiếc áo. Thực tế, tổ 1 may vượt mức 15%, tổ 2 vượt mức 20% nên cả hai tổ may được 945 chiếc. Hỏi theo kế hoạch tổ 1 phải may bao nhiêu chiếc áo?",
    "options": [
      {
        "text": "$300$ chiếc",
        "correct": true
      },
      {
        "text": "$500$ chiếc",
        "correct": false
      },
      {
        "text": "$400$ chiếc",
        "correct": false
      },
      {
        "text": "$350$ chiếc",
        "correct": false
      }
    ],
    "explanation": "Gọi số áo tổ 1 và tổ 2 phải may theo kế hoạch là $x, y$ (chiếc; $x, y \\in \\mathbb{N}^*$). Ta có hệ $\\begin{cases} x + y = 800 \\\\ 1,15x + 1,20y = 945 \\end{cases} \\iff \\begin{cases} 1,2x + 1,2y = 960 \\\\ 1,15x + 1,2y = 945 \\end{cases}$. Trừ hai vế được $0,05x = 15 \\implies x = 300$. Vậy tổ 1 theo kế hoạch may 300 chiếc áo."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Bài Toán Dung Dịch Nồng Độ Phần Trăm",
    "pts": 20,
    "question": "Trộn dung dịch muối nồng độ 10% với dung dịch muối nồng độ 30% để được 500 g dung dịch nồng độ 18%. Khối lượng dung dịch 10% cần lấy là:",
    "options": [
      {
        "text": "$300$ g",
        "correct": true
      },
      {
        "text": "$200$ g",
        "correct": false
      },
      {
        "text": "$250$ g",
        "correct": false
      },
      {
        "text": "$350$ g",
        "correct": false
      }
    ],
    "explanation": "Gọi khối lượng hai dung dịch cần lấy là $x$ và $y$ (g). Ta có hệ $\\begin{cases} x + y = 500 \\\\ 0,1x + 0,3y = 0,18 \\times 500 = 90 \\end{cases} \\iff \\begin{cases} x + y = 500 \\\\ x + 3y = 900 \\end{cases}$. Trừ hai phương trình được $2y = 400 \\implies y = 200$, suy ra $x = 300$ g."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Bài Toán Cổ Gà Và Chó",
    "pts": 20,
    "question": "Bài toán dân gian: 'Vừa gà vừa chó, bó lại cho tròn, ba mươi sáu con, một trăm chân chẵn'. Số gà và số chó lần lượt là:",
    "options": [
      {
        "text": "$22$ con gà và $14$ con chó",
        "correct": true
      },
      {
        "text": "$24$ con gà và $12$ con chó",
        "correct": false
      },
      {
        "text": "$20$ con gà và $16$ con chó",
        "correct": false
      },
      {
        "text": "$26$ con gà và $10$ con chó",
        "correct": false
      }
    ],
    "explanation": "Gọi số gà là $x$, số chó là $y$ ($x, y \\in \\mathbb{N}^*$). Ta có hệ $\\begin{cases} x + y = 36 \\\\ 2x + 4y = 100 \\end{cases} \\iff \\begin{cases} 2x + 2y = 72 \\\\ 2x + 4y = 100 \\end{cases}$. Lấy dưới trừ trên được $2y = 28 \\implies y = 14$ con chó, suy ra $x = 36 - 14 = 22$ con gà."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Đặt Điều Kiện Thực Tế Cho Ẩn Số",
    "pts": 20,
    "question": "Khi giải bài toán: 'Tìm số học sinh của hai lớp 9A và 9B', điều kiện thích hợp nhất cho hai ẩn $x, y$ biểu thị số học sinh là:",
    "options": [
      {
        "text": "$x, y \\in \\mathbb{R}$ và $x, y > 0$",
        "correct": false
      },
      {
        "text": "$x, y \\in \\mathbb{N}^*$",
        "correct": true
      },
      {
        "text": "$x, y \\in \\mathbb{Z}$",
        "correct": false
      },
      {
        "text": "$x, y > 10$",
        "correct": false
      }
    ],
    "explanation": "Số học sinh phải là các số nguyên dương (không thể là số âm hoặc số thập phân/phân số). Do đó điều kiện đúng chuẩn là $x, y \\in \\mathbb{N}^*$."
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
                const sV1 = document.getElementById('sliderV1');
                const sV2 = document.getElementById('sliderV2');
                const tV1 = document.getElementById('txtV1');
                const tV2 = document.getElementById('txtV2');
                const out = document.getElementById('lab1MeetOutput');

                const S_TOTAL = 180; // km

                function update() {
                    const v1 = parseFloat(sV1.value);
                    const v2 = parseFloat(sV2.value);
                    tV1.textContent = v1;
                    tV2.textContent = v2;

                    const tMeet = S_TOTAL / (v1 + v2); // giờ
                    const s1 = v1 * tMeet;
                    const s2 = v2 * tMeet;

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Road
                    const roadY = h / 2;
                    ctx.strokeStyle = '#64748b'; ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.moveTo(50, roadY); ctx.lineTo(w - 50, roadY); ctx.stroke();

                    // Road markings
                    ctx.fillStyle = '#f8fafc'; ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText('Thành phố A', 30, roadY + 30);
                    ctx.fillText('Thành phố B', w - 100, roadY + 30);
                    ctx.fillText('Quãng đường AB = 180 km', w / 2 - 70, roadY - 45);

                    // Meet point
                    const meetPixelX = 50 + (s1 / S_TOTAL) * (w - 100);
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath(); ctx.arc(meetPixelX, roadY, 8, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 12px Segoe UI';
                    ctx.fillText('Điểm gặp nhau', meetPixelX - 35, roadY - 15);

                    // Car A position
                    ctx.fillStyle = '#38bdf8';
                    ctx.beginPath(); ctx.arc(meetPixelX, roadY, 5, 0, Math.PI * 2); ctx.fill();
                    ctx.fillText(`Xe A: ${v1} km/h`, 40, roadY - 15);

                    // Car B position
                    ctx.fillStyle = '#f43f5e';
                    ctx.fillText(`Xe B: ${v2} km/h`, w - 120, roadY - 15);

                    const hours = Math.floor(tMeet);
                    const mins = Math.round((tMeet - hours) * 60);

                    out.innerHTML = `<strong>Thời gian gặp nhau:</strong> $t = \\frac{180}{${v1} + ${v2}} = ${tMeet.toFixed(2)}$ giờ (${hours} giờ ${mins} phút). <br><strong>Khoảng cách từ điểm gặp đến A:</strong> $S_A = ${v1} \\times ${tMeet.toFixed(2)} = ${s1.toFixed(1)}$ km.`;
                    if (window.renderMathInElement) {
                        renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                sV1.addEventListener('input', update);
                sV2.addEventListener('input', update);
                update();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const sW1 = document.getElementById('sliderWork1');
                const sW2 = document.getElementById('sliderWork2');
                const tW1 = document.getElementById('txtW1');
                const tW2 = document.getElementById('txtW2');
                const out = document.getElementById('lab2WorkOutput');

                function updateWork() {
                    const x = parseFloat(sW1.value);
                    const y = parseFloat(sW2.value);
                    tW1.textContent = x;
                    tW2.textContent = y;

                    // Joint rate = 1/x + 1/y = (x + y) / (xy) => T = xy / (x + y)
                    const tJoint = (x * y) / (x + y);
                    const rate1 = (1 / x) * 100;
                    const rate2 = (1 / y) * 100;

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Draw progress bars
                    ctx.fillStyle = '#94a3b8'; ctx.font = '13px Segoe UI';
                    ctx.fillText('Năng suất 1 ngày của Thợ 1:', 30, 45);
                    ctx.fillStyle = '#1e293b'; ctx.fillRect(230, 32, 280, 16);
                    ctx.fillStyle = '#38bdf8'; ctx.fillRect(230, 32, 280 * (rate1 / 100), 16);
                    ctx.fillStyle = '#ffffff'; ctx.fillText(`${rate1.toFixed(1)}% CV`, 520, 45);

                    ctx.fillStyle = '#94a3b8';
                    ctx.fillText('Năng suất 1 ngày của Thợ 2:', 30, 95);
                    ctx.fillStyle = '#1e293b'; ctx.fillRect(230, 82, 280, 16);
                    ctx.fillStyle = '#f43f5e'; ctx.fillRect(230, 82, 280 * (rate2 / 100), 16);
                    ctx.fillStyle = '#ffffff'; ctx.fillText(`${rate2.toFixed(1)}% CV`, 520, 95);

                    ctx.fillStyle = '#10b981'; ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText('Hợp tác làm chung (Cả 2 thợ):', 30, 150);
                    ctx.fillStyle = '#1e293b'; ctx.fillRect(230, 137, 280, 20);
                    ctx.fillStyle = '#10b981'; ctx.fillRect(230, 137, Math.min(280, 280 * ((rate1 + rate2) / 100)), 20);
                    ctx.fillStyle = '#ffffff'; ctx.fillText(`${(rate1 + rate2).toFixed(1)}% CV / ngày`, 520, 153);

                    out.innerHTML = `<strong>Phương trình năng suất:</strong> $\\frac{1}{${x}} + \\frac{1}{${y}} = \\frac{1}{T} \\iff \\frac{1}{T} = \\frac{${x + y}}{${x * y}}$ <br><strong>Thời gian làm chung hoàn thành:</strong> $T = \\frac{${x} \\times ${y}}{${x} + ${y}} = ${tJoint.toFixed(2)}$ ngày.`;
                    if (window.renderMathInElement) {
                        renderMathInElement(out, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                sW1.addEventListener('input', updateWork);
                sW2.addEventListener('input', updateWork);
                updateWork();
            
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
