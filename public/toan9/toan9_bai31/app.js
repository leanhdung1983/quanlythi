// ================================================================
// Bài 31: Hình Trụ và Hình Nón - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai31_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Kỹ Sư Hình Khối Không Gian 🏛️',
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
    "title": "Câu 1: Diện tích xung quanh hình trụ",
    "pts": 20,
    "question": "Một hình trụ có bán kính đáy $r = 5\\text{ cm}$ và chiều cao $h = 8\\text{ cm}$. Diện tích xung quanh của hình trụ là:",
    "options": [
      {
        "text": "$40\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$80\\pi\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$100\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$200\\pi\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Diện tích xung quanh của hình trụ: $S_{xq} = 2\\pi rh = 2\\pi \\cdot 5 \\cdot 8 = 80\\pi\\text{ cm}^2$."
  },
  {
    "id": 2,
    "title": "Câu 2: Thể tích hình trụ",
    "pts": 20,
    "question": "Tính thể tích của hình trụ có đường kính đáy $d = 6\\text{ cm}$ và chiều cao $h = 10\\text{ cm}$:",
    "options": [
      {
        "text": "$90\\pi\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$360\\pi\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$30\\pi\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$60\\pi\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "Bán kính đáy $r = \\frac{d}{2} = 3\\text{ cm}$. Thể tích $V = \\pi r^2 h = \\pi \\cdot 3^2 \\cdot 10 = 90\\pi\\text{ cm}^3$."
  },
  {
    "id": 3,
    "title": "Câu 3: Đường sinh hình nón",
    "pts": 20,
    "question": "Một hình nón có bán kính đáy $r = 6\\text{ cm}$ và chiều cao $h = 8\\text{ cm}$. Độ dài đường sinh $l$ của hình nón là:",
    "options": [
      {
        "text": "$14\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$10\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$2\\sqrt{7}\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$100\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng hệ thức liên hệ đường sinh: $l = \\sqrt{r^2 + h^2} = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = 10\\text{ cm}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Diện tích xung quanh hình nón",
    "pts": 20,
    "question": "Một hình nón có bán kính đáy $r = 3\\text{ cm}$ và đường sinh $l = 5\\text{ cm}$. Diện tích xung quanh của hình nón là:",
    "options": [
      {
        "text": "$15\\pi\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$30\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$12\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$24\\pi\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Diện tích xung quanh của hình nón: $S_{xq} = \\pi rl = \\pi \\cdot 3 \\cdot 5 = 15\\pi\\text{ cm}^2$."
  },
  {
    "id": 5,
    "title": "Câu 5: Thể tích hình nón",
    "pts": 20,
    "question": "Một hình nón có bán kính đáy $r = 6\\text{ cm}$ và chiều cao $h = 5\\text{ cm}$. Thể tích của hình nón bằng:",
    "options": [
      {
        "text": "$180\\pi\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$60\\pi\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$30\\pi\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$120\\pi\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "Thể tích hình nón: $V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi \\cdot 6^2 \\cdot 5 = \\frac{1}{3}\\pi \\cdot 36 \\cdot 5 = 60\\pi\\text{ cm}^3$."
  },
  {
    "id": 6,
    "title": "Câu 6: Diện tích toàn phần hình trụ",
    "pts": 20,
    "question": "Hình trụ có bán kính đáy $r = 2\\text{ cm}$ và chiều cao $h = 5\\text{ cm}$. Diện tích toàn phần $S_{tp}$ là:",
    "options": [
      {
        "text": "$20\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$24\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$28\\pi\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$14\\pi\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "$S_{tp} = 2\\pi rh + 2\\pi r^2 = 2\\pi \\cdot 2 \\cdot 5 + 2\\pi \\cdot 2^2 = 20\\pi + 8\\pi = 28\\pi\\text{ cm}^2$."
  },
  {
    "id": 7,
    "title": "Câu 7: Góc ở tâm của hình quạt trải mặt xung quanh nón",
    "pts": 20,
    "question": "Khi trải mặt xung quanh của hình nón có bán kính đáy $r = 2\\text{ cm}$ và đường sinh $l = 6\\text{ cm}$, ta được một hình quạt tròn có góc ở tâm $\\alpha$ bằng:",
    "options": [
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      },
      {
        "text": "$120^\\circ$",
        "correct": true
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Độ dài cung hình quạt tròn bằng chu vi đáy hình nón: $C = 2\\pi r = \\frac{\\pi l \\alpha}{180^\\circ} \\Rightarrow \\alpha = \\frac{r}{l} \\cdot 360^\\circ = \\frac{2}{6} \\cdot 360^\\circ = 120^\\circ$."
  },
  {
    "id": 8,
    "title": "Câu 8: Bài toán thực tế - Thùng phuy đựng dầu",
    "pts": 20,
    "question": "Một thùng phuy hình trụ có đường kính đáy $60\\text{ cm}$ và chiều cao $90\\text{ cm}$. Thể tích chứa của thùng phuy là (lấy $\\pi \\approx 3{,}14$):",
    "options": [
      {
        "text": "Khoảng $254{,}3\\text{ lít}$",
        "correct": true
      },
      {
        "text": "Khoảng $1017\\text{ lít}$",
        "correct": false
      },
      {
        "text": "Khoảng $81\\text{ lít}$",
        "correct": false
      },
      {
        "text": "Khoảng $25{,}4\\text{ lít}$",
        "correct": false
      }
    ],
    "explanation": "Bán kính $r = 30\\text{ cm} = 3\\text{ dm}$, chiều cao $h = 90\\text{ cm} = 9\\text{ dm}$. Thể tích $V = \\pi r^2 h = 3{,}14 \\cdot 3^2 \\cdot 9 = 254{,}34\\text{ dm}^3 \\approx 254{,}3\\text{ lít}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bài toán thực tế - Chiếc nón lá",
    "pts": 20,
    "question": "Một chiếc nón lá truyền thống có đường kính đáy $40\\text{ cm}$ và đường sinh dài $30\\text{ cm}$. Diện tích lá dùng để làm nón (diện tích xung quanh) là:",
    "options": [
      {
        "text": "$1200\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$600\\pi\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$300\\pi\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$400\\pi\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Bán kính đáy nón $r = \\frac{40}{2} = 20\\text{ cm}$. Diện tích lá: $S_{xq} = \\pi rl = \\pi \\cdot 20 \\cdot 30 = 600\\pi\\text{ cm}^2$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tỉ số thể tích khi tăng kích thước",
    "pts": 20,
    "question": "Nếu bán kính đáy của hình trụ tăng lên gấp $2$ lần và chiều cao giữ nguyên thì thể tích của hình trụ tăng lên gấp bao nhiêu lần?",
    "options": [
      {
        "text": "$2$ lần",
        "correct": false
      },
      {
        "text": "$4$ lần",
        "correct": true
      },
      {
        "text": "$8$ lần",
        "correct": false
      },
      {
        "text": "$16$ lần",
        "correct": false
      }
    ],
    "explanation": "Thể tích ban đầu $V_1 = \\pi r^2 h$. Khi $r' = 2r$, $V_2 = \\pi (2r)^2 h = 4\\pi r^2 h = 4V_1$. Vậy thể tích tăng lên gấp $4$ lần."
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
  const sliderR = document.getElementById('sliderCylR');
  const sliderH = document.getElementById('sliderCylH');
  const valR = document.getElementById('valCylR');
  const valH = document.getElementById('valCylH');
  const out = document.getElementById('outputCylinder');

  function draw() {
    const r = parseFloat(sliderR.value);
    const h = parseFloat(sliderH.value);
    valR.textContent = r;
    valH.textContent = h;

    const w = canvas.width;
    const hCanvas = canvas.height;
    ctx.clearRect(0, 0, w, hCanvas);

    const cx = w / 2;
    const scale = 14;
    const pxR = r * scale;
    const pxH = h * scale;
    const ry = pxR * 0.35;
    const topY = (hCanvas - pxH) / 2;
    const botY = topY + pxH;

    // Background glow
    const grad = ctx.createLinearGradient(cx - pxR, topY, cx + pxR, botY);
    grad.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    grad.addColorStop(0.5, 'rgba(6, 182, 212, 0.2)');
    grad.addColorStop(1, 'rgba(99, 102, 241, 0.4)');

    // Thân trụ
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx - pxR, topY);
    ctx.lineTo(cx + pxR, topY);
    ctx.lineTo(cx + pxR, botY);
    ctx.lineTo(cx - pxR, botY);
    ctx.closePath();
    ctx.fill();

    // Đáy dưới nửa sau (đứt nét)
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.ellipse(cx, botY, pxR, ry, 0, Math.PI, 0);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Đáy dưới nửa trước (liền nét)
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.ellipse(cx, botY, pxR, ry, 0, 0, Math.PI);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Đường sinh 2 bên
    ctx.beginPath();
    ctx.moveTo(cx - pxR, topY);
    ctx.lineTo(cx - pxR, botY);
    ctx.moveTo(cx + pxR, topY);
    ctx.lineTo(cx + pxR, botY);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Trục đối xứng
    ctx.beginPath();
    ctx.setLineDash([5, 5]);
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx, botY);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Bán kính đáy trên
    ctx.beginPath();
    ctx.moveTo(cx, topY);
    ctx.lineTo(cx + pxR, topY);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Đáy trên trọn vẹn
    ctx.beginPath();
    ctx.ellipse(cx, topY, pxR, ry, 0, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(56, 189, 248, 0.3)';
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Nhãn tâm và bán kính
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('O', cx - 12, topY - 4);
    ctx.fillText('O\'', cx - 12, botY + 14);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('r = ' + r + ' cm', cx + pxR / 2 - 10, topY - 6);
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('h = ' + h + ' cm', cx + pxR + 8, (topY + botY) / 2);

    // Tính toán
    const Sxq = 2 * Math.PI * r * h;
    const Sday = Math.PI * r * r;
    const Stp = Sxq + 2 * Sday;
    const V = Math.PI * r * r * h;

    out.innerHTML = `<strong>Kết quả tính toán:</strong><br>` +
      `• $S_{xq} = 2\\pi rh = 2\\pi \\cdot ${r} \\cdot ${h} = ${(2*r*h).toFixed(1)}\\pi \\approx ${Sxq.toFixed(2)}\\text{ cm}^2$<br>` +
      `• $S_{tp} = S_{xq} + 2S_{\\text{đáy}} = ${(2*r*h + 2*r*r).toFixed(1)}\\pi \\approx ${Stp.toFixed(2)}\\text{ cm}^2$<br>` +
      `• $V = \\pi r^2 h = \\pi \\cdot ${r}^2 \\cdot ${h} = ${(r*r*h).toFixed(1)}\\pi \\approx ${V.toFixed(2)}\\text{ cm}^3$`;
    if (window.renderMathInTree) window.renderMathInTree(out);
  }

  sliderR.addEventListener('input', draw);
  sliderH.addEventListener('input', draw);
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
  const sliderR = document.getElementById('sliderConeR');
  const sliderH = document.getElementById('sliderConeH');
  const valR = document.getElementById('valConeR');
  const valH = document.getElementById('valConeH');
  const out = document.getElementById('outputCone');

  function draw() {
    const r = parseFloat(sliderR.value);
    const h = parseFloat(sliderH.value);
    valR.textContent = r;
    valH.textContent = h;

    const l = Math.sqrt(r * r + h * h);
    const alpha = (r / l) * 360;

    const w = canvas.width;
    const hCanvas = canvas.height;
    ctx.clearRect(0, 0, w, hCanvas);

    // Left side: 3D Cone
    const cx = w * 0.3;
    const scale = 18;
    const pxR = r * scale;
    const pxH = h * scale;
    const ry = pxR * 0.35;
    const apexY = (hCanvas - pxH) / 2;
    const botY = apexY + pxH;

    // Body gradient
    const grad = ctx.createLinearGradient(cx - pxR, apexY, cx + pxR, botY);
    grad.addColorStop(0, 'rgba(168, 85, 247, 0.4)');
    grad.addColorStop(0.5, 'rgba(236, 72, 153, 0.2)');
    grad.addColorStop(1, 'rgba(168, 85, 247, 0.4)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(cx, apexY);
    ctx.lineTo(cx + pxR, botY);
    ctx.ellipse(cx, botY, pxR, ry, 0, 0, Math.PI);
    ctx.lineTo(cx, apexY);
    ctx.closePath();
    ctx.fill();

    // Đáy nửa sau đứt nét
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.ellipse(cx, botY, pxR, ry, 0, Math.PI, 0);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Đáy nửa trước liền nét
    ctx.beginPath();
    ctx.setLineDash([]);
    ctx.ellipse(cx, botY, pxR, ry, 0, 0, Math.PI);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Hai đường sinh
    ctx.beginPath();
    ctx.moveTo(cx, apexY);
    ctx.lineTo(cx - pxR, botY);
    ctx.moveTo(cx, apexY);
    ctx.lineTo(cx + pxR, botY);
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Chiều cao
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(cx, apexY);
    ctx.lineTo(cx, botY);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Bán kính đáy
    ctx.beginPath();
    ctx.moveTo(cx, botY);
    ctx.lineTo(cx + pxR, botY);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Labels
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('A (Đỉnh)', cx - 20, apexY - 6);
    ctx.fillText('O', cx - 14, botY + 14);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('r = ' + r, cx + pxR / 2 - 5, botY + 14);
    ctx.fillStyle = '#c084fc';
    ctx.fillText('l = ' + l.toFixed(1), cx + pxR / 2 + 10, (apexY + botY) / 2);

    // Right side: Khai triển quạt tròn
    const fanCx = w * 0.75;
    const fanCy = hCanvas * 0.55;
    const fanRadius = Math.min(100, l * 12);
    const radAlpha = (alpha * Math.PI) / 180;
    const startAngle = -Math.PI / 2 - radAlpha / 2;
    const endAngle = startAngle + radAlpha;

    ctx.beginPath();
    ctx.moveTo(fanCx, fanCy);
    ctx.arc(fanCx, fanCy, fanRadius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.fill();
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('Hình quạt trải mặt xung quanh', fanCx - 70, fanCy - fanRadius - 10);
    ctx.fillText('Bán kính quạt: l = ' + l.toFixed(1) + ' cm', fanCx - 55, fanCy + 25);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText('Góc quạt: \u03B1 \u2248 ' + alpha.toFixed(1) + '\u00B0', fanCx - 40, fanCy + 42);

    // Tính toán
    const Sxq = Math.PI * r * l;
    const Stp = Sxq + Math.PI * r * r;
    const V = (1 / 3) * Math.PI * r * r * h;

    out.innerHTML = `<strong>Kết quả tính toán:</strong><br>` +
      `• Đường sinh: $l = \\sqrt{h^2 + r^2} = \\sqrt{${h}^2 + ${r}^2} = ${l.toFixed(2)}\\text{ cm}$<br>` +
      `• Diện tích xung quanh: $S_{xq} = \\pi rl = \\pi \\cdot ${r} \\cdot ${l.toFixed(2)} \\approx ${Sxq.toFixed(2)}\\text{ cm}^2$<br>` +
      `• Diện tích toàn phần: $S_{tp} = S_{xq} + S_{\\text{đáy}} = ${Sxq.toFixed(2)} + ${(Math.PI*r*r).toFixed(2)} \\approx ${Stp.toFixed(2)}\\text{ cm}^2$<br>` +
      `• Thể tích: $V = \\frac{1}{3}\\pi r^2 h = \\frac{1}{3}\\pi \\cdot ${r}^2 \\cdot ${h} \\approx ${V.toFixed(2)}\\text{ cm}^3$<br>` +
      `• Góc quạt khai triển: $\\alpha = \\frac{r}{l} \\cdot 360^\\circ \\approx ${alpha.toFixed(1)}^\\circ$`;
    if (window.renderMathInTree) window.renderMathInTree(out);
  }

  sliderR.addEventListener('input', draw);
  sliderH.addEventListener('input', draw);
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
