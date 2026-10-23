// ================================================================
// Bài 32: Hình Cầu - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai32_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nhà Du Hành Không Gian 🌍',
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
    "title": "Câu 1: Diện tích mặt cầu",
    "pts": 20,
    "question": "Mặt cầu có bán kính $R = 3\\text{ cm}$. Diện tích của mặt cầu là:",
    "options": [
      {
        "text": "$12\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$36\\pi\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$18\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$9\\pi\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Diện tích mặt cầu: $S = 4\\pi R^2 = 4\\pi \\cdot 3^2 = 36\\pi\\text{ cm}^2$."
  },
  {
    "id": 2,
    "title": "Câu 2: Thể tích hình cầu",
    "pts": 20,
    "question": "Một khối cầu có bán kính $R = 3\\text{ cm}$. Thể tích của khối cầu đó là:",
    "options": [
      {
        "text": "$36\\pi\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$108\\pi\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$12\\pi\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$27\\pi\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "Thể tích hình cầu: $V = \\frac{4}{3}\\pi R^3 = \\frac{4}{3}\\pi \\cdot 3^3 = \\frac{4}{3}\\pi \\cdot 27 = 36\\pi\\text{ cm}^3$."
  },
  {
    "id": 3,
    "title": "Câu 3: Diện tích mặt cầu theo đường kính",
    "pts": 20,
    "question": "Một quả bóng đá có đường kính $d = 22\\text{ cm}$. Diện tích bề mặt của quả bóng xấp xỉ bằng (lấy $\\pi \\approx 3{,}14$):",
    "options": [
      {
        "text": "$1519{,}76\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$6079\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$379{,}94\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$759{,}88\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "$S = \\pi d^2 = 3{,}14 \\cdot 22^2 = 3{,}14 \\cdot 484 = 1519{,}76\\text{ cm}^2$."
  },
  {
    "id": 4,
    "title": "Câu 4: Bán kính đường tròn giao tuyến",
    "pts": 20,
    "question": "Mặt cầu tâm $O$ bán kính $R = 10\\text{ cm}$ bị cắt bởi mặt phẳng $(P)$ cách tâm $O$ một khoảng $d = 6\\text{ cm}$. Bán kính $r$ của đường tròn giao tuyến là:",
    "options": [
      {
        "text": "$4\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$8\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$16\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$2\\sqrt{34}\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng định lí Pythagore: $r = \\sqrt{R^2 - d^2} = \\sqrt{10^2 - 6^2} = \\sqrt{100 - 36} = 8\\text{ cm}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tỉ số diện tích khi tăng bán kính",
    "pts": 20,
    "question": "Nếu bán kính mặt cầu tăng lên gấp $3$ lần thì diện tích mặt cầu tăng lên gấp bao nhiêu lần?",
    "options": [
      {
        "text": "$3$ lần",
        "correct": false
      },
      {
        "text": "$6$ lần",
        "correct": false
      },
      {
        "text": "$9$ lần",
        "correct": true
      },
      {
        "text": "$27$ lần",
        "correct": false
      }
    ],
    "explanation": "Diện tích mặt cầu $S = 4\\pi R^2$. Khi $R' = 3R$, $S' = 4\\pi (3R)^2 = 9 \\cdot (4\\pi R^2) = 9S$. Vậy diện tích tăng gấp $9$ lần."
  },
  {
    "id": 6,
    "title": "Câu 6: Tỉ số thể tích khi tăng bán kính",
    "pts": 20,
    "question": "Nếu bán kính hình cầu tăng lên gấp $2$ lần thì thể tích hình cầu tăng lên gấp bao nhiêu lần?",
    "options": [
      {
        "text": "$2$ lần",
        "correct": false
      },
      {
        "text": "$4$ lần",
        "correct": false
      },
      {
        "text": "$8$ lần",
        "correct": true
      },
      {
        "text": "$16$ lần",
        "correct": false
      }
    ],
    "explanation": "Thể tích hình cầu $V = \\frac{4}{3}\\pi R^3$. Khi $R' = 2R$, $V' = \\frac{4}{3}\\pi (2R)^3 = 8 \\cdot \\left(\\frac{4}{3}\\pi R^3\\right) = 8V$. Vậy thể tích tăng gấp $8$ lần."
  },
  {
    "id": 7,
    "title": "Câu 7: Tìm bán kính từ diện tích",
    "pts": 20,
    "question": "Một mặt cầu có diện tích bằng $64\\pi\\text{ cm}^2$. Bán kính của mặt cầu đó là:",
    "options": [
      {
        "text": "$2\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$4\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$8\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$16\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "$S = 4\\pi R^2 = 64\\pi \\Rightarrow R^2 = 16 \\Rightarrow R = 4\\text{ cm}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Thể tích bồn chứa khí hóa lỏng dạng cầu",
    "pts": 20,
    "question": "Một bồn chứa khí đốt có dạng hình cầu với đường kính $d = 6\\text{ m}$. Thể tích chứa của bồn bằng:",
    "options": [
      {
        "text": "$36\\pi\\text{ m}^3$",
        "correct": true
      },
      {
        "text": "$288\\pi\\text{ m}^3$",
        "correct": false
      },
      {
        "text": "$18\\pi\\text{ m}^3$",
        "correct": false
      },
      {
        "text": "$72\\pi\\text{ m}^3$",
        "correct": false
      }
    ],
    "explanation": "Bán kính $R = \\frac{d}{2} = 3\\text{ m}$. Thể tích bồn: $V = \\frac{4}{3}\\pi R^3 = \\frac{4}{3}\\pi \\cdot 3^3 = 36\\pi\\text{ m}^3$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bán kính quả cầu từ thể tích",
    "pts": 20,
    "question": "Một khối cầu có thể tích $V = 288\\pi\\text{ cm}^3$. Bán kính của khối cầu là:",
    "options": [
      {
        "text": "$4\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$6\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$8\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$12\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "$V = \\frac{4}{3}\\pi R^3 = 288\\pi \\Rightarrow R^3 = \\frac{288 \\cdot 3}{4} = 216 \\Rightarrow R = \\sqrt[3]{216} = 6\\text{ cm}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tỉ số Archimedes",
    "pts": 20,
    "question": "Cho một hình trụ ngoại tiếp một hình cầu (chiều cao hình trụ bằng đường kính hình cầu $h = 2R$, bán kính đáy hình trụ bằng $R$). Tỉ số $\\frac{V_{\\text{cầu}}}{V_{\\text{trụ}}}$ bằng:",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": true
      },
      {
        "text": "$\\frac{3}{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{3}$",
        "correct": false
      }
    ],
    "explanation": "$V_{\\text{cầu}} = \\frac{4}{3}\\pi R^3$; $V_{\\text{trụ}} = \\pi R^2 h = \\pi R^2 (2R) = 2\\pi R^3$. Do đó $\\frac{V_{\\text{cầu}}}{V_{\\text{trụ}}} = \\frac{\\frac{4}{3}}{2} = \\frac{2}{3}$."
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
    function initLab1() {
  const canvas = document.getElementById('labCanvas1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sliderR = document.getElementById('sliderSphR');
  const sliderD = document.getElementById('sliderSphD');
  const valR = document.getElementById('valSphR');
  const valD = document.getElementById('valSphD');
  const out = document.getElementById('outputSphereCut');

  function draw() {
    const R = parseFloat(sliderR.value);
    const d = parseFloat(sliderD.value);
    valR.textContent = R;
    valD.textContent = d;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;
    const scale = 22;
    const pxR = R * scale;
    const pxD = d * scale;

    // Mặt cầu nền tròn
    const sphereGrad = ctx.createRadialGradient(cx - pxR * 0.3, cy - pxR * 0.3, pxR * 0.1, cx, cy, pxR);
    sphereGrad.addColorStop(0, '#60a5fa');
    sphereGrad.addColorStop(0.7, '#1e3a8a');
    sphereGrad.addColorStop(1, '#0f172a');

    ctx.beginPath();
    ctx.arc(cx, cy, pxR, 0, 2 * Math.PI);
    ctx.fillStyle = sphereGrad;
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Xích đạo (đường tròn lớn)
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.ellipse(cx, cy, pxR, pxR * 0.3, 0, Math.PI, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.4)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.ellipse(cx, cy, pxR, pxR * 0.3, 0, 0, Math.PI);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Tâm O
    ctx.beginPath();
    ctx.arc(cx, cy, 3.5, 0, 2 * Math.PI);
    ctx.fillStyle = '#f59e0b';
    ctx.fill();
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('O', cx - 14, cy - 6);

    let statusHtml = '';
    if (d < R) {
      const rCut = Math.sqrt(R * R - d * d);
      const pxRCut = rCut * scale;
      const cutY = cy - pxD;

      // Mặt phẳng cắt
      ctx.fillStyle = 'rgba(244, 63, 94, 0.25)';
      ctx.beginPath();
      ctx.moveTo(cx - pxR * 1.2, cutY - 15);
      ctx.lineTo(cx + pxR * 1.2, cutY - 15);
      ctx.lineTo(cx + pxR * 0.9, cutY + 25);
      ctx.lineTo(cx - pxR * 1.4, cutY + 25);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
      ctx.stroke();

      // Đường tròn giao tuyến
      ctx.beginPath();
      ctx.ellipse(cx, cutY, pxRCut, pxRCut * 0.3, 0, 0, 2 * Math.PI);
      ctx.fillStyle = 'rgba(251, 191, 36, 0.4)';
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Tâm H của đường tròn cắt
      ctx.beginPath();
      ctx.arc(cx, cutY, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ef4444';
      ctx.fill();
      ctx.fillText('H', cx - 14, cutY - 4);

      // Đoạn OH = d
      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx, cutY);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillText('d = ' + d, cx + 6, (cy + cutY) / 2);

      // Bán kính cắt r
      ctx.beginPath();
      ctx.moveTo(cx, cutY);
      ctx.lineTo(cx + pxRCut, cutY);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.fillText('r = ' + rCut.toFixed(2), cx + pxRCut / 2 - 10, cutY + 14);

      statusHtml = `• Vì $d = ${d} < R = ${R}$ nên mặt phẳng <strong>cắt mặt cầu</strong> theo đường tròn bán kính:<br>` +
        `$$r = \\sqrt{R^2 - d^2} = \\sqrt{${R}^2 - ${d}^2} = \\sqrt{${(R*R - d*d).toFixed(2)}} \\approx ${rCut.toFixed(2)}\\text{ cm}$$`;
    } else if (Math.abs(d - R) < 0.05) {
      statusHtml = `• Vì $d = R = ${R}$ nên mặt phẳng <strong>tiếp xúc</strong> với mặt cầu tại $1$ điểm duy nhất!`;
    } else {
      statusHtml = `• Vì $d = ${d} > R = ${R}$ nên mặt phẳng <strong>không cắt</strong> mặt cầu!`;
    }

    const S = 4 * Math.PI * R * R;
    const V = (4 / 3) * Math.PI * Math.pow(R, 3);

    out.innerHTML = `<strong>Số liệu mặt cầu & Mặt phẳng cắt:</strong><br>` +
      `• Diện tích mặt cầu: $S = 4\\pi R^2 = 4\\pi \\cdot ${R}^2 = ${(4*R*R).toFixed(1)}\\pi \\approx ${S.toFixed(2)}\\text{ cm}^2$<br>` +
      `• Thể tích khối cầu: $V = \\frac{4}{3}\\pi R^3 = \\frac{4}{3}\\pi \\cdot ${R}^3 = ${((4/3)*R*R*R).toFixed(1)}\\pi \\approx ${V.toFixed(2)}\\text{ cm}^3$<br>` +
      statusHtml;
    if (window.renderMathInTree) window.renderMathInTree(out);
  }

  sliderR.addEventListener('input', draw);
  sliderD.addEventListener('input', draw);
  draw();
}
initLab1();
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    function initLab2() {
  const canvas = document.getElementById('labCanvas2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const sliderR = document.getElementById('sliderArchR');
  const sliderCylR = document.getElementById('sliderCylArchR');
  const valR = document.getElementById('valArchR');
  const valCylR = document.getElementById('valCylArchR');
  const out = document.getElementById('outputArchimedes');

  function draw() {
    const R = parseFloat(sliderR.value);
    const Rb = parseFloat(sliderCylR.value);
    valR.textContent = R;
    valCylR.textContent = Rb;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const Vcau = (4 / 3) * Math.PI * Math.pow(R, 3);
    const SdayBinh = Math.PI * Rb * Rb;
    const deltaH = Vcau / SdayBinh;

    const cx = w / 2;
    const scale = 14;
    const pxRb = Rb * scale;
    const pxH = 140;
    const botY = h - 40;
    const topY = botY - pxH;
    const ry = pxRb * 0.25;

    // Bình trụ
    ctx.beginPath();
    ctx.ellipse(cx, botY, pxRb, ry, 0, 0, Math.PI);
    ctx.lineTo(cx - pxRb, topY);
    ctx.ellipse(cx, topY, pxRb, ry, 0, Math.PI, 0);
    ctx.lineTo(cx + pxRb, botY);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mực nước ban đầu (h0)
    const baseWaterH = 50;
    const waterY = botY - baseWaterH;
    const risenWaterY = waterY - deltaH * scale;

    // Nước đã dâng
    const waterGrad = ctx.createLinearGradient(cx, risenWaterY, cx, botY);
    waterGrad.addColorStop(0, 'rgba(56, 189, 248, 0.4)');
    waterGrad.addColorStop(1, 'rgba(14, 165, 233, 0.7)');

    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.ellipse(cx, botY, pxRb, ry, 0, 0, Math.PI);
    ctx.lineTo(cx - pxRb, risenWaterY);
    ctx.ellipse(cx, risenWaterY, pxRb, ry, 0, Math.PI, 0);
    ctx.lineTo(cx + pxRb, botY);
    ctx.fill();

    // Mặt thoáng nước
    ctx.beginPath();
    ctx.ellipse(cx, risenWaterY, pxRb, ry, 0, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.6)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.stroke();

    // Quả cầu chìm dưới đáy nước
    const pxR = R * scale;
    const sphereY = botY - pxR - 5;
    const sphGrad = ctx.createRadialGradient(cx - pxR * 0.3, sphereY - pxR * 0.3, pxR * 0.1, cx, sphereY, pxR);
    sphGrad.addColorStop(0, '#fde047');
    sphGrad.addColorStop(0.8, '#d97706');
    sphGrad.addColorStop(1, '#78350f');

    ctx.beginPath();
    ctx.arc(cx, sphereY, pxR, 0, 2 * Math.PI);
    ctx.fillStyle = sphGrad;
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vạch nước dâng Delta h
    ctx.beginPath();
    ctx.setLineDash([3, 3]);
    ctx.moveTo(cx - pxRb - 10, waterY);
    ctx.lineTo(cx + pxRb + 10, waterY);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Mũi tên delta h bên cạnh
    const arrowX = cx + pxRb + 20;
    ctx.beginPath();
    ctx.moveTo(arrowX, waterY);
    ctx.lineTo(arrowX, risenWaterY);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('\u0394h = ' + deltaH.toFixed(2) + ' cm', arrowX + 6, (waterY + risenWaterY) / 2 + 4);

    out.innerHTML = `<strong>Tính toán nguyên lý Archimedes:</strong><br>` +
      `• Thể tích quả cầu: $V_{\\text{cầu}} = \\frac{4}{3}\\pi R^3 = \\frac{4}{3}\\pi \\cdot ${R}^3 = ${((4/3)*R*R*R).toFixed(2)}\\pi \\approx ${Vcau.toFixed(2)}\\text{ cm}^3$<br>` +
      `• Diện tích đáy bình trụ: $S_{\\text{đáy bình}} = \\pi R_{\\text{bình}}^2 = \\pi \\cdot ${Rb}^2 = ${(Rb*Rb).toFixed(1)}\\pi \\approx ${SdayBinh.toFixed(2)}\\text{ cm}^2$<br>` +
      `• Chiều cao nước dâng lên: $\\Delta h = \\frac{V_{\\text{cầu}}}{S_{\\text{đáy bình}}} = \\frac{\\frac{4}{3}\\pi \\cdot ${R}^3}{\\pi \\cdot ${Rb}^2} = \\frac{4 \\cdot ${R}^3}{3 \\cdot ${Rb}^2} \\approx ${deltaH.toFixed(2)}\\text{ cm}$`;
    if (window.renderMathInTree) window.renderMathInTree(out);
  }

  sliderR.addEventListener('input', draw);
  sliderCylR.addEventListener('input', draw);
  draw();
}
initLab2();
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
