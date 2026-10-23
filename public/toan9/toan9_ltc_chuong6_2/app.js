// ================================================================
// Luyện Tập Chung: Định Lí Viète & Bài Toán Thực Tế - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ltc_chuong6_2_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chiến Binh Ứng Dụng Đại Số 9',
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
    "title": "Câu 1: Điều kiện 2 nghiệm trái dấu",
    "pts": 20,
    "question": "Phương trình $x^2 - (m + 1)x + 2m - 4 = 0$ có hai nghiệm trái dấu khi:",
    "options": [
      {
        "text": "$m < 2$",
        "correct": true
      },
      {
        "text": "$m > 2$",
        "correct": false
      },
      {
        "text": "$m < -1$",
        "correct": false
      },
      {
        "text": "$m > -1$",
        "correct": false
      }
    ],
    "explanation": "Phương trình có 2 nghiệm trái dấu khi $ac < 0 \\iff 1 \\cdot (2m - 4) < 0 \\iff 2m < 4 \\iff m < 2$."
  },
  {
    "id": 2,
    "title": "Câu 2: Điều kiện 2 nghiệm dương phân biệt",
    "pts": 20,
    "question": "Phương trình $x^2 - 4x + m = 0$ có hai nghiệm dương phân biệt khi:",
    "options": [
      {
        "text": "$0 < m < 4$",
        "correct": true
      },
      {
        "text": "$m < 4$",
        "correct": false
      },
      {
        "text": "$m > 0$",
        "correct": false
      },
      {
        "text": "$0 \\le m \\le 4$",
        "correct": false
      }
    ],
    "explanation": "1) $\\Delta' = 4 - m > 0 \\iff m < 4$.\\n2) $S = 4 > 0$ (luôn đúng).\\n3) $P = m > 0$.\\nKết hợp được $0 < m < 4$."
  },
  {
    "id": 3,
    "title": "Câu 3: Đẳng thức hệ thức Viète",
    "pts": 20,
    "question": "Cho phương trình $x^2 - 2(m - 1)x + m^2 - 3 = 0$. Biểu thức $x_1^2 + x_2^2$ theo $m$ là:",
    "options": [
      {
        "text": "$2m^2 - 8m + 10$",
        "correct": true
      },
      {
        "text": "$4m^2 - 8m + 4$",
        "correct": false
      },
      {
        "text": "$2m^2 - 4m + 7$",
        "correct": false
      },
      {
        "text": "$m^2 - 8m + 10$",
        "correct": false
      }
    ],
    "explanation": "Ta có $S = 2(m - 1)$ và $P = m^2 - 3$. Khi đó $x_1^2 + x_2^2 = S^2 - 2P = 4(m - 1)^2 - 2(m^2 - 3) = 4(m^2 - 2m + 1) - 2m^2 + 6 = 2m^2 - 8m + 10$."
  },
  {
    "id": 4,
    "title": "Câu 4: Giá trị nhỏ nhất của biểu thức",
    "pts": 20,
    "question": "Giá trị nhỏ nhất của biểu thức $A = 2m^2 - 8m + 10$ là:",
    "options": [
      {
        "text": "2 tại $m = 2$",
        "correct": true
      },
      {
        "text": "10 tại $m = 0$",
        "correct": false
      },
      {
        "text": "0 tại $m = 2$",
        "correct": false
      },
      {
        "text": "4 tại $m = 1$",
        "correct": false
      }
    ],
    "explanation": "$A = 2(m^2 - 4m + 4) + 2 = 2(m - 2)^2 + 2 \\ge 2$. Dấu '=' xảy ra khi $m = 2$."
  },
  {
    "id": 5,
    "title": "Câu 5: Bài toán rào đất cực đại",
    "pts": 20,
    "question": "Một người có 60 m rào để quây một mảnh vườn hình chữ nhật có diện tích lớn nhất. Diện tích lớn nhất đó bằng bao nhiêu?",
    "options": [
      {
        "text": "225 m²",
        "correct": true
      },
      {
        "text": "200 m²",
        "correct": false
      },
      {
        "text": "250 m²",
        "correct": false
      },
      {
        "text": "900 m²",
        "correct": false
      }
    ],
    "explanation": "Nửa chu vi là $60 : 2 = 30\\text{ m}$. Diện tích $S = x(30 - x) = -x^2 + 30x = -(x - 15)^2 + 225 \\le 225\\text{ m²}$. Đạt được khi hình vuông cạnh 15 m."
  },
  {
    "id": 6,
    "title": "Câu 6: Hai nghiệm cùng dấu âm",
    "pts": 20,
    "question": "Phương trình $x^2 + 6x + 2m - 1 = 0$ có hai nghiệm cùng âm khi:",
    "options": [
      {
        "text": "$\\frac{1}{2} < m \\le 5$",
        "correct": true
      },
      {
        "text": "$m > \\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$m \\le 5$",
        "correct": false
      },
      {
        "text": "$m < 5$",
        "correct": false
      }
    ],
    "explanation": "1) $\\Delta' = 9 - (2m - 1) = 10 - 2m \\ge 0 \\iff m \\le 5$.\\n2) $S = -6 < 0$ (luôn đúng).\\n3) $P = 2m - 1 > 0 \\iff m > \\frac{1}{2}$.\\nVậy $\\frac{1}{2} < m \\le 5$."
  },
  {
    "id": 7,
    "title": "Câu 7: Hai nghiệm là nghịch đảo của nhau",
    "pts": 20,
    "question": "Phương trình $ax^2 + bx + c = 0$ có hai nghiệm phân biệt là nghịch đảo của nhau khi và chỉ khi:",
    "options": [
      {
        "text": "$a = c$ và $\\Delta > 0$",
        "correct": true
      },
      {
        "text": "$a = -c$",
        "correct": false
      },
      {
        "text": "$b = 0$",
        "correct": false
      },
      {
        "text": "$a + b + c = 0$",
        "correct": false
      }
    ],
    "explanation": "Hai nghiệm là nghịch đảo của nhau nghĩa là $x_1 \\cdot x_2 = 1 \\iff \\frac{c}{a} = 1 \\iff a = c$ (kèm điều kiện $\\Delta > 0$ để có 2 nghiệm phân biệt)."
  },
  {
    "id": 8,
    "title": "Câu 8: Bài toán kinh tế doanh thu",
    "pts": 20,
    "question": "Một rạp chiếu phim bán vé giá 80 nghìn đồng thì có 300 khán giả. Cứ mỗi lần giảm giá vé 5 nghìn đồng thì lượng khán giả tăng thêm 50 người. Giá vé để doanh thu đạt tối đa là:",
    "options": [
      {
        "text": "55 nghìn đồng",
        "correct": true
      },
      {
        "text": "60 nghìn đồng",
        "correct": false
      },
      {
        "text": "50 nghìn đồng",
        "correct": false
      },
      {
        "text": "65 nghìn đồng",
        "correct": false
      }
    ],
    "explanation": "Gọi $x$ là số lần giảm giá vé 5 nghìn đồng ($x > 0$). Giá vé mới là $80 - 5x$, số khán giả là $300 + 50x$. Doanh thu $R(x) = (80 - 5x)(300 + 50x) = -250x^2 + 2500x + 24000$. Đỉnh tại $x = -\\frac{2500}{2(-250)} = 5$. Giá vé tối ưu là $80 - 5(5) = 55$ nghìn đồng."
  },
  {
    "id": 9,
    "title": "Câu 9: Nghiệm này gấp 3 lần nghiệm kia",
    "pts": 20,
    "question": "Cho phương trình $x^2 - 8x + m = 0$. Giá trị của $m$ để phương trình có một nghiệm gấp 3 lần nghiệm kia là:",
    "options": [
      {
        "text": "$m = 12$",
        "correct": true
      },
      {
        "text": "$m = 16$",
        "correct": false
      },
      {
        "text": "$m = 8$",
        "correct": false
      },
      {
        "text": "$m = 24$",
        "correct": false
      }
    ],
    "explanation": "Theo Viète $x_1 + x_2 = 8$. Giả sử $x_2 = 3x_1 \\implies 4x_1 = 8 \\implies x_1 = 2,\\ x_2 = 6$. Khi đó $m = x_1 x_2 = 2 \\cdot 6 = 12$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tồn tại nghiệm thỏa mãn điều kiện",
    "pts": 20,
    "question": "Để phương trình $x^2 - 2x + m = 0$ có 2 nghiệm $x_1, x_2$ thỏa mãn $x_1^2 + x_2^2 = 10$, giá trị của $m$ là:",
    "options": [
      {
        "text": "$m = -3$",
        "correct": true
      },
      {
        "text": "$m = 3$",
        "correct": false
      },
      {
        "text": "$m = -5$",
        "correct": false
      },
      {
        "text": "$m = 5$",
        "correct": false
      }
    ],
    "explanation": "Ta có $x_1^2 + x_2^2 = S^2 - 2P = 4 - 2m = 10 \\iff 2m = -6 \\iff m = -3$. Thử lại $\\Delta' = 1 - (-3) = 4 > 0$ (thỏa mãn)."
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
                const slM = document.getElementById('slMParam');
                const vM = document.getElementById('vMParam');
                const out1 = document.getElementById('lab1Output');

                function updateMParam() {
                    const m = parseFloat(slM.value);
                    vM.textContent = 'm = ' + m.toFixed(1);

                    // PT: x^2 - 4x + (m - 1) = 0
                    // a = 1, b = -4, c = m - 1
                    // delta' = 4 - (m - 1) = 5 - m
                    const deltaPrime = 5 - m;
                    const S = 4;
                    const P = m - 1;

                    const cw = c1.width;
                    const ch = c1.height;
                    const ox = cw / 2;
                    const oy = ch / 2 + 30;
                    const scale = 25;

                    ctx.clearRect(0, 0, cw, ch);

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
                    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(cw, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, ch); ctx.stroke();

                    // Curve y = x^2 - 4x + (m - 1)
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    for (let px = 0; px <= cw; px += 2) {
                        const xm = (px - ox) / scale;
                        const ym = xm * xm - 4 * xm + (m - 1);
                        const py = oy - ym * scale;
                        if (px === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.stroke();

                    let stateText = '';
                    if (deltaPrime > 0) {
                        const x1 = 2 - Math.sqrt(deltaPrime);
                        const x2 = 2 + Math.sqrt(deltaPrime);
                        [x1, x2].forEach(rx => {
                            const px = ox + rx * scale;
                            ctx.fillStyle = rx > 0 ? '#22c55e' : (rx < 0 ? '#ef4444' : '#eab308');
                            ctx.beginPath(); ctx.arc(px, oy, 6, 0, Math.PI * 2); ctx.fill();
                        });

                        if (P < 0) stateText = `<span style="color:#f59e0b;">2 nghiệm TRÁI DẤU</span> ($x_1 = ${x1.toFixed(2)} < 0 < x_2 = ${x2.toFixed(2)}$)`;
                        else if (P > 0) stateText = `<span style="color:#22c55e;">2 nghiệm CÙNG DƯƠNG</span> ($0 < x_1 = ${x1.toFixed(2)} < x_2 = ${x2.toFixed(2)}$)`;
                        else stateText = `<span style="color:#38bdf8;">1 nghiệm bằng 0, 1 nghiệm dương ($x = 4$)</span>`;
                    } else if (Math.abs(deltaPrime) < 1e-4) {
                        const px = ox + 2 * scale;
                        ctx.fillStyle = '#22c55e';
                        ctx.beginPath(); ctx.arc(px, oy, 6, 0, Math.PI * 2); ctx.fill();
                        stateText = `<span style="color:#a855f7;">Nghiệm kép dương x₁ = x₂ = 2</span>`;
                    } else {
                        stateText = `<span style="color:#ef4444;">VÔ NGHIỆM</span> (vì $\\Delta' = ${deltaPrime.toFixed(1)} < 0$)`;
                    }

                    out1.innerHTML = `<strong>Phương trình:</strong> $x^2 - 4x + (${(m - 1).toFixed(1)}) = 0$ | $\\Delta' = ${deltaPrime.toFixed(1)}$ | <strong>Trạng thái:</strong> ${stateText}`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slM.addEventListener('input', updateMParam);
                updateMParam();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const slXF = document.getElementById('slXFence');
                const vXF = document.getElementById('vXFence');
                const out2 = document.getElementById('lab2Output');

                const totalFence = 40; // 2x + y = 40 => y = 40 - 2x

                function drawFence() {
                    const x = parseFloat(slXF.value);
                    const y = totalFence - 2 * x;
                    const S = x * y;
                    vXF.textContent = 'x = ' + x + ' m';

                    const cw = c2.width;
                    const ch = c2.height;
                    ctx2.clearRect(0, 0, cw, ch);

                    // Wall top
                    ctx2.fillStyle = '#475569';
                    ctx2.fillRect(60, 40, cw - 120, 20);
                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 12px sans-serif';
                    ctx2.fillText('BỜ TƯỜNG CỐ ĐỊNH CÓ SẴN (Không cần rào)', cw / 2 - 130, 55);

                    // Garden
                    const scale = 8;
                    const pxW = y * scale;
                    const pxH = x * scale;
                    const ox = (cw - pxW) / 2;
                    const oy = 60;

                    ctx2.fillStyle = 'rgba(34, 197, 94, 0.25)';
                    ctx2.fillRect(ox, oy, pxW, pxH);

                    // Fence lines (left, right, bottom)
                    ctx2.strokeStyle = '#f59e0b';
                    ctx2.lineWidth = 4;
                    ctx2.beginPath();
                    ctx2.moveTo(ox, oy);
                    ctx2.lineTo(ox, oy + pxH);
                    ctx2.lineTo(ox + pxW, oy + pxH);
                    ctx2.lineTo(ox + pxW, oy);
                    ctx2.stroke();

                    // Dimensions
                    ctx2.fillStyle = '#f8fafc';
                    ctx2.font = '13px sans-serif';
                    ctx2.fillText(`Rộng x = ${x} m`, ox - 90, oy + pxH / 2);
                    ctx2.fillText(`Rộng x = ${x} m`, ox + pxW + 10, oy + pxH / 2);
                    ctx2.fillText(`Dài y = 40 - 2x = ${y} m`, ox + pxW / 2 - 60, oy + pxH + 20);
                    ctx2.fillText(`Diện tích S = ${S} m²`, ox + pxW / 2 - 50, oy + pxH / 2);

                    const isOpt = x === 10;
                    const optText = isOpt ? '<span style="color:#22c55e; font-weight:bold;">🌟 ĐẠT DIỆN TÍCH CỰC ĐẠI!</span>' : '';

                    out2.innerHTML = `<strong>Hàm diện tích:</strong> $S(x) = x(40 - 2x) = -2x^2 + 40x$. Đạt cực đại tại đỉnh $x = -\\frac{40}{2(-2)} = 10\\text{ m}$ &rArr; $S_{\max} = 200\\text{ m²}$. ${optText}`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slXF.addEventListener('input', drawFence);
                drawFence();
            
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
