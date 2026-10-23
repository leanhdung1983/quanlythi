// ================================================================
// Ôn Tập Chương X: Một Số Hình Khối Trong Thực Tiễn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ontap_chuong10_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Không Gian 3D 🏆',
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
    "title": "Câu 1: Thể tích hình trụ khi biết đường kính",
    "pts": 20,
    "question": "Một hình trụ có đường kính đáy $10\\text{ cm}$ và chiều cao $12\\text{ cm}$. Thể tích của hình trụ là:",
    "options": [
      {
        "text": "$300\\pi\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$1200\\pi\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$600\\pi\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$150\\pi\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "Bán kính đáy $r = \\frac{10}{2} = 5\\text{ cm}$. Thể tích $V = \\pi r^2 h = \\pi \\cdot 5^2 \\cdot 12 = 300\\pi\\text{ cm}^3$."
  },
  {
    "id": 2,
    "title": "Câu 2: Diện tích toàn phần hình nón",
    "pts": 20,
    "question": "Một hình nón có bán kính đáy $r = 5\\text{ cm}$ và đường sinh $l = 13\\text{ cm}$. Diện tích toàn phần $S_{tp}$ của hình nón là:",
    "options": [
      {
        "text": "$65\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$90\\pi\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$120\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$150\\pi\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "$S_{tp} = \\pi rl + \\pi r^2 = \\pi \\cdot 5 \\cdot 13 + \\pi \\cdot 5^2 = 65\\pi + 25\\pi = 90\\pi\\text{ cm}^2$."
  },
  {
    "id": 3,
    "title": "Câu 3: Thể tích hình nón",
    "pts": 20,
    "question": "Hình nón ở Câu 2 có bán kính đáy $r = 5\\text{ cm}$ và đường sinh $l = 13\\text{ cm}$. Thể tích của hình nón là:",
    "options": [
      {
        "text": "$100\\pi\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$300\\pi\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$25\\pi\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$65\\pi\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "Chiều cao $h = \\sqrt{l^2 - r^2} = \\sqrt{13^2 - 5^2} = 12\\text{ cm}$. Thể tích $V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi \\cdot 5^2 \\cdot 12 = 100\\pi\\text{ cm}^3$."
  },
  {
    "id": 4,
    "title": "Câu 4: So sánh diện tích mặt cầu và hình trụ",
    "pts": 20,
    "question": "Cho một hình trụ có bán kính đáy $R$ và chiều cao $h = 2R$. Tỉ số diện tích xung quanh của hình trụ và diện tích mặt cầu bán kính $R$ là:",
    "options": [
      {
        "text": "$1$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": false
      }
    ],
    "explanation": "Diện tích xung quanh hình trụ: $S_{xq} = 2\\pi R h = 2\\pi R(2R) = 4\\pi R^2$. Diện tích mặt cầu: $S_{\\text{cầu}} = 4\\pi R^2$. Tỉ số bằng $1$ (hai diện tích này bằng nhau!)."
  },
  {
    "id": 5,
    "title": "Câu 5: Bài toán quả bóng bàn",
    "pts": 20,
    "question": "Một hộp hình trụ đựng vừa khít $3$ quả bóng bàn hình cầu có bán kính $R = 2\\text{ cm}$ (xếp chồng lên nhau). Chiều cao của hộp hình trụ là:",
    "options": [
      {
        "text": "$6\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$12\\text{ cm}$",
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
    "explanation": "Đường kính của mỗi quả bóng bàn là $d = 2R = 4\\text{ cm}$. Xếp $3$ quả bóng vừa khít thì chiều cao hộp là $h = 3 \\cdot 4 = 12\\text{ cm}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Khoảng không gian trống trong hộp bóng",
    "pts": 20,
    "question": "Với hộp bóng bàn ở Câu 5 ($r = 2\\text{ cm}, h = 12\\text{ cm}$, chứa $3$ quả bóng), thể tích phần không gian trống bên trong hộp là:",
    "options": [
      {
        "text": "$16\\pi\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$32\\pi\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$48\\pi\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$24\\pi\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "Thể tích hộp trụ: $V_{\\text{trụ}} = \\pi \\cdot 2^2 \\cdot 12 = 48\\pi\\text{ cm}^3$. Thể tích $3$ quả bóng: $V_{\\text{bóng}} = 3 \\cdot \\left(\\frac{4}{3}\\pi \\cdot 2^3\\right) = 32\\pi\\text{ cm}^3$. Thể tích trống: $V_{\\text{trống}} = 48\\pi - 32\\pi = 16\\pi\\text{ cm}^3$."
  },
  {
    "id": 7,
    "title": "Câu 7: Quả dưa hấu hình cầu",
    "pts": 20,
    "question": "Một quả dưa hấu có dạng hình cầu đường kính $20\\text{ cm}$. Người ta bổ đôi quả dưa thành hai nửa bằng nhau. Diện tích toàn bộ bề mặt của một nửa quả dưa (gồm mặt vỏ và mặt cắt) là:",
    "options": [
      {
        "text": "$200\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$300\\pi\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$400\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$100\\pi\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Bán kính $R = 10\\text{ cm}$. Bề mặt một nửa quả dưa gồm diện tích nửa mặt cầu ($S_1 = 2\\pi R^2$) và diện tích hình tròn mặt cắt ($S_2 = \\pi R^2$). Tổng diện tích: $S = 2\\pi R^2 + \\pi R^2 = 3\\pi R^2 = 3\\pi \\cdot 10^2 = 300\\pi\\text{ cm}^2$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tỉ số bán kính khi biết tỉ số thể tích",
    "pts": 20,
    "question": "Hai khối cầu có thể tích lần lượt là $V_1$ và $V_2$ thỏa mãn $\\frac{V_1}{V_2} = 8$. Tỉ số bán kính $\\frac{R_1}{R_2}$ bằng:",
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
        "text": "$8$",
        "correct": false
      },
      {
        "text": "$\\sqrt{8}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{V_1}{V_2} = \\left(\\frac{R_1}{R_2}\\right)^3 = 8 \\Rightarrow \\frac{R_1}{R_2} = \\sqrt[3]{8} = 2$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bồn nước hình trụ nằm ngang",
    "pts": 20,
    "question": "Một téc nước hình trụ bằng inox có đường kính đáy $1\\text{ m}$ và chiều dài $2\\text{ m}$. Thể tích chứa nước tối đa của téc là (lấy $\\pi \\approx 3{,}14$):",
    "options": [
      {
        "text": "$1570\\text{ lít}$",
        "correct": true
      },
      {
        "text": "$6280\\text{ lít}$",
        "correct": false
      },
      {
        "text": "$3140\\text{ lít}$",
        "correct": false
      },
      {
        "text": "$785\\text{ lít}$",
        "correct": false
      }
    ],
    "explanation": "Bán kính $r = 0{,}5\\text{ m} = 5\\text{ dm}$, chiều dài $h = 2\\text{ m} = 20\\text{ dm}$. Thể tích $V = \\pi r^2 h = 3{,}14 \\cdot 5^2 \\cdot 20 = 1570\\text{ dm}^3 = 1570\\text{ lít}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tỉ số Archimedes tổng kết",
    "pts": 20,
    "question": "Phát biểu nào sau đây về thể tích của hình nón, hình cầu và hình trụ có cùng bán kính đáy $R$ và cùng chiều cao $2R$ là ĐÚNG?",
    "options": [
      {
        "text": "$V_{\\text{nón}} < V_{\\text{cầu}} < V_{\\text{trụ}}$ với tỉ lệ $1 : 2 : 3$",
        "correct": true
      },
      {
        "text": "$V_{\\text{nón}} = V_{\\text{cầu}} = V_{\\text{trụ}}$",
        "correct": false
      },
      {
        "text": "$V_{\\text{cầu}} = \\frac{1}{2} V_{\\text{trụ}}$",
        "correct": false
      },
      {
        "text": "$V_{\\text{nón}} = \\frac{1}{2} V_{\\text{cầu}}$ và $V_{\\text{cầu}} = \\frac{1}{2} V_{\\text{trụ}}$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí Archimedes lừng danh: $V_{\\text{nón}} = \\frac{2}{3}\\pi R^3$, $V_{\\text{cầu}} = \\frac{4}{3}\\pi R^3$, $V_{\\text{trụ}} = 2\\pi R^3$. Tỉ lệ $V_{\\text{nón}} : V_{\\text{cầu}} : V_{\\text{trụ}} = 1 : 2 : 3$."
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
  const sliderR = document.getElementById('sliderArchTripleR');
  const valR = document.getElementById('valArchTripleR');
  const out = document.getElementById('outputArchTriple');

  function draw() {
    const R = parseFloat(sliderR.value);
    valR.textContent = R;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const scale = 14;
    const pxR = R * scale;
    const pxH = 2 * pxR;
    const ry = pxR * 0.3;

    const col1 = w * 0.2;
    const col2 = w * 0.5;
    const col3 = w * 0.8;
    const botY = h - 50;
    const topY = botY - pxH;
    const midY = (topY + botY) / 2;

    // 1. Nón (Col 1)
    ctx.beginPath();
    ctx.moveTo(col1, topY);
    ctx.lineTo(col1 - pxR, botY);
    ctx.ellipse(col1, botY, pxR, ry, 0, 0, Math.PI);
    ctx.lineTo(col1, topY);
    ctx.fillStyle = 'rgba(244, 63, 94, 0.4)';
    ctx.fill();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('1. Hình Nón', col1 - 32, topY - 14);
    ctx.fillText('V_1 = 1/3 \u03C0 R\u00B2(2R)', col1 - 45, botY + 25);

    // 2. Cầu (Col 2)
    const sphGrad = ctx.createRadialGradient(col2 - pxR * 0.3, midY - pxR * 0.3, pxR * 0.1, col2, midY, pxR);
    sphGrad.addColorStop(0, '#60a5fa');
    sphGrad.addColorStop(0.8, '#2563eb');
    sphGrad.addColorStop(1, '#1e3a8a');

    ctx.beginPath();
    ctx.arc(col2, midY, pxR, 0, 2 * Math.PI);
    ctx.fillStyle = sphGrad;
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.fillText('2. Hình Cầu', col2 - 32, topY - 14);
    ctx.fillText('V_2 = 4/3 \u03C0 R\u00B3', col2 - 38, botY + 25);

    // 3. Trụ (Col 3)
    ctx.beginPath();
    ctx.rect(col3 - pxR, topY, 2 * pxR, pxH);
    ctx.fillStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.fill();
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.beginPath();
    ctx.ellipse(col3, topY, pxR, ry, 0, 0, 2 * Math.PI);
    ctx.ellipse(col3, botY, pxR, ry, 0, 0, Math.PI);
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.fillText('3. Hình Trụ', col3 - 32, topY - 14);
    ctx.fillText('V_3 = 2 \u03C0 R\u00B3', col3 - 35, botY + 25);

    // Tính toán
    const V1 = (2 / 3) * Math.PI * Math.pow(R, 3);
    const V2 = (4 / 3) * Math.PI * Math.pow(R, 3);
    const V3 = 2 * Math.PI * Math.pow(R, 3);

    out.innerHTML = `<strong>Kiểm chứng định lí Archimedes ($R = ${R}\\text{ cm}, h = 2R = ${2*R}\\text{ cm}$):</strong><br>` +
      `• $V_{\\text{nón}} = \\frac{2}{3}\\pi R^3 \\approx ${V1.toFixed(2)}\\text{ cm}^3$<br>` +
      `• $V_{\\text{cầu}} = \\frac{4}{3}\\pi R^3 \\approx ${V2.toFixed(2)}\\text{ cm}^3 = 2 \\times V_{\\text{nón}}$<br>` +
      `• $V_{\\text{trụ}} = 2\\pi R^3 \\approx ${V3.toFixed(2)}\\text{ cm}^3 = 3 \\times V_{\\text{nón}}$<br>` +
      `$\Rightarrow$ <strong>Tỉ lệ thể tích chuẩn xác:</strong> $V_{\\text{nón}} : V_{\\text{cầu}} : V_{\\text{trụ}} = 1 : 2 : 3$`;
    if (window.renderMathInTree) window.renderMathInTree(out);
  }

  sliderR.addEventListener('input', draw);
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
  const selType = document.getElementById('selSolidType');
  const sliderP1 = document.getElementById('sliderSolidP1');
  const sliderP2 = document.getElementById('sliderSolidP2');
  const valP1 = document.getElementById('valSolidP1');
  const valP2 = document.getElementById('valSolidP2');
  const grpP2 = document.getElementById('grpSolidP2');
  const out = document.getElementById('outputMasterSolid');

  function draw() {
    const type = selType.value;
    const p1 = parseFloat(sliderP1.value);
    const p2 = parseFloat(sliderP2.value);
    valP1.textContent = p1;
    valP2.textContent = p2;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2;

    if (type === 'sphere') {
      grpP2.style.display = 'none';
      const scale = 18;
      const pxR = p1 * scale;

      const grad = ctx.createRadialGradient(cx - pxR * 0.3, cy - pxR * 0.3, pxR * 0.1, cx, cy, pxR);
      grad.addColorStop(0, '#f472b6');
      grad.addColorStop(0.8, '#be185d');
      grad.addColorStop(1, '#831843');

      ctx.beginPath();
      ctx.arc(cx, cy, pxR, 0, 2 * Math.PI);
      ctx.fillStyle = grad;
      ctx.fill();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const S = 4 * Math.PI * p1 * p1;
      const V = (4 / 3) * Math.PI * Math.pow(p1, 3);
      out.innerHTML = `<strong>Kết quả giải bài toán Hình Cầu ($R = ${p1}\\text{ cm}$):</strong><br>` +
        `• $S = 4\\pi R^2 = 4\\pi \\cdot ${p1}^2 = ${(4*p1*p1).toFixed(1)}\\pi \\approx ${S.toFixed(2)}\\text{ cm}^2$<br>` +
        `• $V = \\frac{4}{3}\\pi R^3 = \\frac{4}{3}\\pi \\cdot ${p1}^3 \\approx ${V.toFixed(2)}\\text{ cm}^3$`;
    } else if (type === 'cylinder') {
      grpP2.style.display = 'block';
      const scale = 14;
      const pxR = p1 * scale;
      const pxH = p2 * scale;
      const ry = pxR * 0.35;
      const topY = cy - pxH / 2;
      const botY = cy + pxH / 2;

      ctx.beginPath();
      ctx.rect(cx - pxR, topY, 2 * pxR, pxH);
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fill();
      ctx.strokeStyle = '#0284c7';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(cx, topY, pxR, ry, 0, 0, 2 * Math.PI);
      ctx.ellipse(cx, botY, pxR, ry, 0, 0, Math.PI);
      ctx.stroke();

      const Sxq = 2 * Math.PI * p1 * p2;
      const Stp = Sxq + 2 * Math.PI * p1 * p1;
      const V = Math.PI * p1 * p1 * p2;
      out.innerHTML = `<strong>Kết quả giải bài toán Hình Trụ ($r = ${p1}\\text{ cm}, h = ${p2}\\text{ cm}$):</strong><br>` +
        `• $S_{xq} = 2\\pi rh = 2\\pi \\cdot ${p1} \\cdot ${p2} \\approx ${Sxq.toFixed(2)}\\text{ cm}^2$<br>` +
        `• $S_{tp} = S_{xq} + 2S_{\\text{đáy}} = ${Sxq.toFixed(2)} + ${(2*Math.PI*p1*p1).toFixed(2)} \\approx ${Stp.toFixed(2)}\\text{ cm}^2$<br>` +
        `• $V = \\pi r^2 h = \\pi \\cdot ${p1}^2 \\cdot ${p2} \\approx ${V.toFixed(2)}\\text{ cm}^3$`;
    } else {
      grpP2.style.display = 'block';
      const scale = 14;
      const pxR = p1 * scale;
      const pxH = p2 * scale;
      const ry = pxR * 0.35;
      const botY = cy + pxH / 2;
      const apexY = cy - pxH / 2;

      ctx.beginPath();
      ctx.moveTo(cx, apexY);
      ctx.lineTo(cx - pxR, botY);
      ctx.ellipse(cx, botY, pxR, ry, 0, 0, Math.PI);
      ctx.lineTo(cx, apexY);
      ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.fill();
      ctx.strokeStyle = '#d97706';
      ctx.lineWidth = 2;
      ctx.stroke();

      const l = Math.sqrt(p1 * p1 + p2 * p2);
      const Sxq = Math.PI * p1 * l;
      const Stp = Sxq + Math.PI * p1 * p1;
      const V = (1 / 3) * Math.PI * p1 * p1 * p2;
      out.innerHTML = `<strong>Kết quả giải bài toán Hình Nón ($r = ${p1}\\text{ cm}, h = ${p2}\\text{ cm}$):</strong><br>` +
        `• Đường sinh: $l = \\sqrt{${p1}^2 + ${p2}^2} = ${l.toFixed(2)}\\text{ cm}$<br>` +
        `• $S_{xq} = \\pi rl = \\pi \\cdot ${p1} \\cdot ${l.toFixed(2)} \\approx ${Sxq.toFixed(2)}\\text{ cm}^2$<br>` +
        `• $S_{tp} = S_{xq} + S_{\\text{đáy}} \\approx ${Stp.toFixed(2)}\\text{ cm}^2$<br>` +
        `• $V = \\frac{1}{3}\\pi r^2 h \\approx ${V.toFixed(2)}\\text{ cm}^3$`;
    }

    if (window.renderMathInTree) window.renderMathInTree(out);
  }

  selType.addEventListener('change', draw);
  sliderP1.addEventListener('input', draw);
  sliderP2.addEventListener('input', draw);
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
