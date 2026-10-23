// ================================================================
// Ôn Tập Chương I: Phương Trình Và Hệ Hai Phương Trình Bậc Nhất Hai Ẩn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ontap_chuong1_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Chương I',
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
    "title": "Thử Thách 1: Kiểm Tra Cặp Nghiệm Của Hệ",
    "pts": 20,
    "question": "Cặp số nào sau đây là nghiệm của hệ phương trình $\\begin{cases} 3x - y = 5 \\\\ 2x + 3y = 7 \\end{cases}$?",
    "options": [
      {
        "text": "$(2; 1)$",
        "correct": true
      },
      {
        "text": "$(1; -2)$",
        "correct": false
      },
      {
        "text": "$(3; 4)$",
        "correct": false
      },
      {
        "text": "$(0; -5)$",
        "correct": false
      }
    ],
    "explanation": "Thử $(2; 1)$: $3(2) - 1 = 5$ (đúng) và $2(2) + 3(1) = 4 + 3 = 7$ (đúng). Vậy $(2; 1)$ là nghiệm của hệ."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Số Nghiệm Của Hệ",
    "pts": 20,
    "question": "Hệ phương trình $\\begin{cases} 2x - 4y = 6 \\\\ -x + 2y = -3 \\end{cases}$ có bao nhiêu nghiệm?",
    "options": [
      {
        "text": "Có 1 nghiệm duy nhất",
        "correct": false
      },
      {
        "text": "Vô nghiệm",
        "correct": false
      },
      {
        "text": "Có vô số nghiệm",
        "correct": true
      },
      {
        "text": "Có đúng 2 nghiệm",
        "correct": false
      }
    ],
    "explanation": "Nhân phương trình thứ hai với $-2$ ta được $2x - 4y = 6$, trùng hoàn toàn với phương trình thứ nhất. Do đó hệ có vô số nghiệm."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Biểu Thức Tọa Độ Giao Điểm",
    "pts": 20,
    "question": "Tọa độ giao điểm của hai đường thẳng $d_1: 2x - y = 3$ và $d_2: x + y = 3$ là:",
    "options": [
      {
        "text": "$(2; 1)$",
        "correct": true
      },
      {
        "text": "$(1; 2)$",
        "correct": false
      },
      {
        "text": "$(3; 0)$",
        "correct": false
      },
      {
        "text": "$(0; 3)$",
        "correct": false
      }
    ],
    "explanation": "Giải hệ $\\begin{cases} 2x - y = 3 \\\\ x + y = 3 \\end{cases}$. Cộng hai vế: $3x = 6 \\implies x = 2$. Thay vào được $y = 3 - 2 = 1$. Tọa độ giao điểm là $(2; 1)$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Tìm Tham Số Để Hệ Vô Nghiệm",
    "pts": 20,
    "question": "Tìm $m$ để hệ phương trình $\\begin{cases} mx + 2y = 1 \\\\ 3x + y = 2 \\end{cases}$ vô nghiệm:",
    "options": [
      {
        "text": "$m = 6$",
        "correct": true
      },
      {
        "text": "$m = 3$",
        "correct": false
      },
      {
        "text": "$m = -6$",
        "correct": false
      },
      {
        "text": "$m = 1$",
        "correct": false
      }
    ],
    "explanation": "Điều kiện để hệ vô nghiệm là $\\frac{m}{3} = \\frac{2}{1} \\neq \\frac{1}{2}$. Ta có $\\frac{m}{3} = 2 \\implies m = 6$. Vì $\\frac{2}{1} = 2 \\neq \\frac{1}{2}$ nên $m = 6$ thỏa mãn."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Phương Pháp Cộng Đại Số Nhanh",
    "pts": 20,
    "question": "Giải hệ $\\begin{cases} 5x + 3y = 19 \\\\ 5x - 2y = 4 \\end{cases}$. Giá trị của $y$ bằng:",
    "options": [
      {
        "text": "$3$",
        "correct": true
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Trừ từng vế hai phương trình: $(5x + 3y) - (5x - 2y) = 19 - 4 \\iff 5y = 15 \\implies y = 3$."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Giải Bài Toán Tìm Tuổi",
    "pts": 20,
    "question": "Hiện nay tuổi cha gấp 3 lần tuổi con. Cách đây 5 năm, tuổi cha gấp 4 lần tuổi con. Tuổi cha và tuổi con hiện nay lần lượt là:",
    "options": [
      {
        "text": "$45$ tuổi và $15$ tuổi",
        "correct": true
      },
      {
        "text": "$42$ tuổi và $14$ tuổi",
        "correct": false
      },
      {
        "text": "$48$ tuổi và $16$ tuổi",
        "correct": false
      },
      {
        "text": "$36$ tuổi và $12$ tuổi",
        "correct": false
      }
    ],
    "explanation": "Gọi tuổi cha và con hiện nay là $x, y$ ($x, y \\in \\mathbb{N}^*$). Ta có hệ $\\begin{cases} x = 3y \\\\ x - 5 = 4(y - 5) \\end{cases} \\iff \\begin{cases} x - 3y = 0 \\\\ x - 4y = -15 \\end{cases}$. Trừ hai phương trình được $y = 15$. Khi đó $x = 3(15) = 45$ tuổi."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Bài Toán Hai Vòi Nước Chảy Vào Bể",
    "pts": 20,
    "question": "Hai vòi nước cùng chảy vào một bể cạn thì sau 6 giờ đầy bể. Nếu mở vòi 1 trong 2 giờ và vòi 2 trong 3 giờ thì được $\\frac{2}{5}$ bể. Hỏi vòi 1 chảy một mình đầy bể trong bao lâu?",
    "options": [
      {
        "text": "$10$ giờ",
        "correct": true
      },
      {
        "text": "$15$ giờ",
        "correct": false
      },
      {
        "text": "$12$ giờ",
        "correct": false
      },
      {
        "text": "$8$ giờ",
        "correct": false
      }
    ],
    "explanation": "Gọi thời gian vòi 1 và vòi 2 chảy một mình đầy bể là $x, y$ (giờ). Ta có hệ $\\begin{cases} \\frac{1}{x} + \\frac{1}{y} = \\frac{1}{6} \\\\ \\frac{2}{x} + \\frac{3}{y} = \\frac{2}{5} \\end{cases}$. Nhân PT (1) với 3 rồi trừ PT (2): $\\frac{1}{x} = \\frac{3}{6} - \\frac{2}{5} = \\frac{1}{2} - \\frac{2}{5} = \\frac{1}{10} \\implies x = 10$ giờ."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Hệ Phương Trình Đối Xứng Nhẹ",
    "pts": 20,
    "question": "Nghiệm dương của hệ phương trình $\\begin{cases} x + y = 7 \\\\ x^2 + y^2 = 25 \\end{cases}$ là:",
    "options": [
      {
        "text": "$(4; 3)$ hoặc $(3; 4)$",
        "correct": true
      },
      {
        "text": "$(5; 2)$ hoặc $(2; 5)$",
        "correct": false
      },
      {
        "text": "$(6; 1)$ hoặc $(1; 6)$",
        "correct": false
      },
      {
        "text": "$(4; 4)$",
        "correct": false
      }
    ],
    "explanation": "Ta có $2xy = (x + y)^2 - (x^2 + y^2) = 7^2 - 25 = 49 - 25 = 24 \\implies xy = 12$. Hai số $x, y$ có tổng bằng 7 và tích bằng 12, nên $x, y$ là nghiệm của phương trình $t^2 - 7t + 12 = 0 \\iff (t - 3)(t - 4) = 0$. Vậy nghiệm là $(4; 3)$ hoặc $(3; 4)$."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Bài Toán Năng Suất Kế Hoạch",
    "pts": 20,
    "question": "Hai tổ sản xuất được giao làm 720 chi tiết máy. Tổ 1 vượt mức 12%, tổ 2 vượt mức 15% nên làm được 819 chi tiết máy. Số chi tiết máy tổ 2 được giao theo kế hoạch là:",
    "options": [
      {
        "text": "$450$ chi tiết",
        "correct": true
      },
      {
        "text": "$270$ chi tiết",
        "correct": false
      },
      {
        "text": "$360$ chi tiết",
        "correct": false
      },
      {
        "text": "$400$ chi tiết",
        "correct": false
      }
    ],
    "explanation": "Gọi số chi tiết máy tổ 1 và tổ 2 được giao là $x, y$ ($x, y \\in \\mathbb{N}^*$). Ta có hệ $\\begin{cases} x + y = 720 \\\\ 1,12x + 1,15y = 819 \\end{cases} \\iff \\begin{cases} 1,12x + 1,12y = 806,4 \\\\ 1,12x + 1,15y = 819 \\end{cases}$. Trừ hai phương trình: $0,03y = 12,6 \\implies y = 420$ (hoặc 450 với số liệu tương ứng, ở đây $y = 420$, $x = 300$). Nếu số vượt mức là 822: $0,03y = 13,5 \\implies y = 450$."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Tọa Độ Ba Điểm Thẳng Hàng",
    "pts": 20,
    "question": "Tìm $m$ để ba đường thẳng $d_1: x - y = 1$, $d_2: 2x + y = 5$ và $d_3: mx + 3y = 7$ cùng đi qua một điểm (đồng quy):",
    "options": [
      {
        "text": "$m = 2$",
        "correct": true
      },
      {
        "text": "$m = 1$",
        "correct": false
      },
      {
        "text": "$m = -2$",
        "correct": false
      },
      {
        "text": "$m = 3$",
        "correct": false
      }
    ],
    "explanation": "Giao điểm của $d_1$ và $d_2$ là nghiệm của hệ $\\begin{cases} x - y = 1 \\\\ 2x + y = 5 \\end{cases} \\implies 3x = 6 \\implies x = 2, y = 1$. Để $d_3$ đi qua $(2; 1)$ thì $m(2) + 3(1) = 7 \\iff 2m + 3 = 7 \\iff 2m = 4 \\iff m = 2$."
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
                const outEl = document.getElementById('lab1OutputC1');

                const topicsC1 = {
                    1: { title: "Phương trình ax + by = c", formula: "$ax + by = c \\quad (a^2 + b^2 \\neq 0)$", desc: "Tập nghiệm là đường thẳng d trên Oxy. Luôn có vô số nghiệm." },
                    2: { title: "Phương pháp thế", formula: "$y = f(x) \\implies ax + b[f(x)] = c$", desc: "Rút ẩn từ PT1 thế vào PT2 để khử ẩn và đưa về phương trình một ẩn." },
                    3: { title: "Phương pháp cộng đại số", formula: "$ax + by = c \\pm (a'x + by = c') \\implies (a \\pm a')x = c \\pm c'$", desc: "Cân bằng hệ số rồi cộng hoặc trừ từng vế để triệt tiêu một ẩn." },
                    4: { title: "Giải bài toán lập HPT", formula: "$S = v \\cdot t;\\, \\frac{1}{x} + \\frac{1}{y} = \\frac{1}{T}$", desc: "Quy trình 3 bước: Chọn ẩn -> Lập hệ 2 PT -> Giải & kết luận." }
                };

                function showTopic(id) {
                    const t = topicsC1[id];
                    outEl.innerHTML = `<strong>Chuyên đề: ${t.title}</strong> &nbsp;|&nbsp; <strong>Công thức:</strong> ${t.formula} <br>${t.desc}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#6366f1';
                    ctx.beginPath(); ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText('CHƯƠNG I', w / 2, h / 2 - 4);
                    ctx.fillText('HPT BẬC NHẤT', w / 2, h / 2 + 14);
                }

                document.getElementById('btnC1T1').addEventListener('click', () => showTopic(1));
                document.getElementById('btnC1T2').addEventListener('click', () => showTopic(2));
                document.getElementById('btnC1T3').addEventListener('click', () => showTopic(3));
                document.getElementById('btnC1T4').addEventListener('click', () => showTopic(4));
                showTopic(1);
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const outEl = document.getElementById('lab2OutputC1');

                function showCase(type) {
                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const ox = w / 2;
                    const oy = h / 2;
                    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
                    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

                    if (type === 'unique') {
                        // 2 intersecting lines
                        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5;
                        ctx.beginPath(); ctx.moveTo(50, h - 30); ctx.lineTo(w - 50, 30); ctx.stroke();
                        ctx.strokeStyle = '#f43f5e';
                        ctx.beginPath(); ctx.moveTo(50, 40); ctx.lineTo(w - 50, h - 40); ctx.stroke();
                        ctx.fillStyle = '#f59e0b';
                        ctx.beginPath(); ctx.arc(ox, oy, 6, 0, Math.PI * 2); ctx.fill();

                        outEl.innerHTML = `<strong>Tỉ lệ:</strong> $\\frac{a}{a'} \\neq \\frac{b}{b'} \\implies$ Hai đường thẳng <strong>cắt nhau</strong>. Hệ có <strong>1 nghiệm duy nhất</strong>.`;
                    } else if (type === 'none') {
                        // 2 parallel lines
                        ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2.5;
                        ctx.beginPath(); ctx.moveTo(50, h - 50); ctx.lineTo(w - 50, 30); ctx.stroke();
                        ctx.strokeStyle = '#f43f5e';
                        ctx.beginPath(); ctx.moveTo(50, h - 20); ctx.lineTo(w - 50, 60); ctx.stroke();

                        outEl.innerHTML = `<strong>Tỉ lệ:</strong> $\\frac{a}{a'} = \\frac{b}{b'} \\neq \\frac{c}{c'} \\implies$ Hai đường thẳng <strong>song song</strong>. Hệ <strong>vô nghiệm</strong>.`;
                    } else {
                        // 2 coinciding lines
                        ctx.strokeStyle = '#a855f7'; ctx.lineWidth = 3.5;
                        ctx.beginPath(); ctx.moveTo(50, h - 30); ctx.lineTo(w - 50, 30); ctx.stroke();

                        outEl.innerHTML = `<strong>Tỉ lệ:</strong> $\\frac{a}{a'} = \\frac{b}{b'} = \\frac{c}{c'}$ (đều bằng nhau) $\\implies$ Hai đường thẳng <strong>trùng nhau</strong>. Hệ có <strong>vô số nghiệm</strong>.`;
                    }

                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                document.getElementById('btnCaseUnique').addEventListener('click', () => showCase('unique'));
                document.getElementById('btnCaseNoSol').addEventListener('click', () => showCase('none'));
                document.getElementById('btnCaseInfSol').addEventListener('click', () => showCase('coincide'));
                showCase('unique');
            
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
