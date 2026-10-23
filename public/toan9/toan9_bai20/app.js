// ================================================================
// Bài 20: Định Lí Viète Và Ứng Dụng - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai20_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Sư Viète 9',
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
    "title": "Câu 1: Nhẩm nghiệm khi a + b + c = 0",
    "pts": 20,
    "question": "Nghiệm của phương trình $2024x^2 - 2025x + 1 = 0$ là:",
    "options": [
      {
        "text": "$x_1 = 1;\\ x_2 = \\frac{1}{2024}$",
        "correct": true
      },
      {
        "text": "$x_1 = -1;\\ x_2 = -\\frac{1}{2024}$",
        "correct": false
      },
      {
        "text": "$x_1 = 1;\\ x_2 = 2024$",
        "correct": false
      },
      {
        "text": "$x_1 = -1;\\ x_2 = 2024$",
        "correct": false
      }
    ],
    "explanation": "Ta có $a + b + c = 2024 + (-2025) + 1 = 0$, do đó phương trình có 2 nghiệm: $x_1 = 1$ và $x_2 = \\frac{c}{a} = \\frac{1}{2024}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Nhẩm nghiệm khi a - b + c = 0",
    "pts": 20,
    "question": "Phương trình $3x^2 + 5x + 2 = 0$ có các hệ số thỏa mãn $a - b + c = 0$. Hai nghiệm của phương trình là:",
    "options": [
      {
        "text": "$x_1 = 1;\\ x_2 = \\frac{2}{3}$",
        "correct": false
      },
      {
        "text": "$x_1 = -1;\\ x_2 = -\\frac{2}{3}$",
        "correct": true
      },
      {
        "text": "$x_1 = -1;\\ x_2 = \\frac{2}{3}$",
        "correct": false
      },
      {
        "text": "$x_1 = 1;\\ x_2 = -\\frac{2}{3}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $a - b + c = 3 - 5 + 2 = 0$. Suy ra $x_1 = -1$ và $x_2 = -\\frac{c}{a} = -\\frac{2}{3}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tổng và tích nghiệm theo Viète",
    "pts": 20,
    "question": "Cho phương trình $2x^2 - 7x + 3 = 0$. Tổng $S = x_1 + x_2$ và tích $P = x_1 x_2$ lần lượt là:",
    "options": [
      {
        "text": "$S = \\frac{7}{2};\\ P = \\frac{3}{2}$",
        "correct": true
      },
      {
        "text": "$S = -\\frac{7}{2};\\ P = \\frac{3}{2}$",
        "correct": false
      },
      {
        "text": "$S = \\frac{7}{2};\\ P = -\\frac{3}{2}$",
        "correct": false
      },
      {
        "text": "$S = 7;\\ P = 3$",
        "correct": false
      }
    ],
    "explanation": "Theo hệ thức Viète: $S = -\\frac{b}{a} = -\\frac{-7}{2} = \\frac{7}{2}$ và $P = \\frac{c}{a} = \\frac{3}{2}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính giá trị biểu thức đối xứng",
    "pts": 20,
    "question": "Gọi $x_1, x_2$ là hai nghiệm của phương trình $x^2 - 4x + 1 = 0$. Giá trị biểu thức $A = x_1^2 + x_2^2$ là:",
    "options": [
      {
        "text": "14",
        "correct": true
      },
      {
        "text": "16",
        "correct": false
      },
      {
        "text": "18",
        "correct": false
      },
      {
        "text": "12",
        "correct": false
      }
    ],
    "explanation": "Theo Viète, $x_1 + x_2 = 4$ và $x_1 x_2 = 1$. Ta có $x_1^2 + x_2^2 = (x_1 + x_2)^2 - 2x_1 x_2 = 4^2 - 2 \\cdot 1 = 16 - 2 = 14$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tìm hai số biết tổng và tích",
    "pts": 20,
    "question": "Hai số $u$ và $v$ có tổng $u + v = 7$ và tích $uv = 12$ là hai nghiệm của phương trình nào?",
    "options": [
      {
        "text": "$x^2 - 7x + 12 = 0$",
        "correct": true
      },
      {
        "text": "$x^2 + 7x + 12 = 0$",
        "correct": false
      },
      {
        "text": "$x^2 - 12x + 7 = 0$",
        "correct": false
      },
      {
        "text": "$x^2 + 12x + 7 = 0$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí đảo Viète, hai số có tổng $S$ và tích $P$ là nghiệm của phương trình $x^2 - Sx + P = 0 \\implies x^2 - 7x + 12 = 0$ (cho ra 2 số là 3 và 4)."
  },
  {
    "id": 6,
    "title": "Câu 6: Biểu thức nghịch đảo nghiệm",
    "pts": 20,
    "question": "Cho phương trình $3x^2 - 5x - 2 = 0$ có 2 nghiệm $x_1, x_2$. Giá trị của $B = \\frac{1}{x_1} + \\frac{1}{x_2}$ là:",
    "options": [
      {
        "text": "$-\\frac{5}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{5}{2}$",
        "correct": false
      },
      {
        "text": "$-\\frac{2}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{5}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $B = \\frac{x_1 + x_2}{x_1 x_2} = \\frac{5/3}{-2/3} = -\\frac{5}{2}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Điều kiện để tồn tại 2 số",
    "pts": 20,
    "question": "Hai số có tổng $S = 6$ và tích $P = 10$ có tồn tại trong tập số thực $\\mathbb{R}$ không?",
    "options": [
      {
        "text": "Không tồn tại vì $S^2 - 4P < 0$",
        "correct": true
      },
      {
        "text": "Có tồn tại",
        "correct": false
      },
      {
        "text": "Chỉ tồn tại một số",
        "correct": false
      },
      {
        "text": "Tồn tại vô số cặp số",
        "correct": false
      }
    ],
    "explanation": "Xét $S^2 - 4P = 6^2 - 4 \\cdot 10 = 36 - 40 = -4 < 0$. Vì vậy phương trình $X^2 - 6X + 10 = 0$ vô nghiệm, tức không tồn tại hai số thực thỏa mãn."
  },
  {
    "id": 8,
    "title": "Câu 8: Giá trị biểu thức hiệu bình phương",
    "pts": 20,
    "question": "Cho phương trình $x^2 - 3x - 4 = 0$ có hai nghiệm $x_1 < x_2$. Hiệu $x_2 - x_1$ bằng:",
    "options": [
      {
        "text": "5",
        "correct": true
      },
      {
        "text": "3",
        "correct": false
      },
      {
        "text": "4",
        "correct": false
      },
      {
        "text": "7",
        "correct": false
      }
    ],
    "explanation": "Nhẩm nghiệm $a - b + c = 1 - (-3) + (-4) = 0 \\implies x_1 = -1,\\ x_2 = 4$. Do đó $x_2 - x_1 = 4 - (-1) = 5$."
  },
  {
    "id": 9,
    "title": "Câu 9: Tìm m để có 2 nghiệm trái dấu",
    "pts": 20,
    "question": "Phương trình $x^2 - 2x + m - 3 = 0$ có hai nghiệm trái dấu khi:",
    "options": [
      {
        "text": "$m < 3$",
        "correct": true
      },
      {
        "text": "$m > 3$",
        "correct": false
      },
      {
        "text": "$m \\le 3$",
        "correct": false
      },
      {
        "text": "$m = 3$",
        "correct": false
      }
    ],
    "explanation": "Phương trình có 2 nghiệm trái dấu khi $ac < 0 \\iff 1 \\cdot (m - 3) < 0 \\iff m < 3$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tìm m để 2 nghiệm cùng dấu dương",
    "pts": 20,
    "question": "Phương trình $x^2 - 6x + m = 0$ có hai nghiệm dương phân biệt khi:",
    "options": [
      {
        "text": "$0 < m < 9$",
        "correct": true
      },
      {
        "text": "$m < 9$",
        "correct": false
      },
      {
        "text": "$m > 0$",
        "correct": false
      },
      {
        "text": "$m \\ge 9$",
        "correct": false
      }
    ],
    "explanation": "Điều kiện để có 2 nghiệm dương phân biệt:\\n1) $\\Delta' = 9 - m > 0 \\iff m < 9$\\n2) $S = 6 > 0$ (luôn đúng)\\n3) $P = m > 0$.\\nKết hợp lại ta được $0 < m < 9$."
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
                const slX1 = document.getElementById('slX1');
                const slX2 = document.getElementById('slX2');
                const vX1 = document.getElementById('vX1');
                const vX2 = document.getElementById('vX2');
                const out1 = document.getElementById('lab1Output');

                function updateViete() {
                    const x1 = parseFloat(slX1.value);
                    const x2 = parseFloat(slX2.value);
                    vX1.textContent = 'x₁ = ' + x1.toFixed(1);
                    vX2.textContent = 'x₂ = ' + x2.toFixed(1);

                    const S = x1 + x2;
                    const P = x1 * x2;

                    const w = c1.width;
                    const h = c1.height;
                    const ox = w / 2;
                    const oy = h / 2 + 30;
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

                    // Parabol y = (x - x1)(x - x2) = x^2 - S x + P
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    for (let px = 0; px <= w; px += 2) {
                        const xm = (px - ox) / scale;
                        const ym = xm * xm - S * xm + P;
                        const py = oy - ym * scale;
                        if (px === 0) ctx.moveTo(px, py);
                        else ctx.lineTo(px, py);
                    }
                    ctx.stroke();

                    // Roots points
                    [x1, x2].forEach((rx, idx) => {
                        const px = ox + rx * scale;
                        ctx.fillStyle = idx === 0 ? '#10b981' : '#f59e0b';
                        ctx.beginPath(); ctx.arc(px, oy, 7, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#ffffff';
                        ctx.font = '12px sans-serif';
                        ctx.fillText(`x${idx+1} = ${rx.toFixed(1)}`, px - 15, oy - 14);
                    });

                    const sSign = S >= 0 ? `- ${S.toFixed(1)}x` : `+ ${Math.abs(S).toFixed(1)}x`;
                    const pSign = P >= 0 ? `+ ${P.toFixed(1)}` : `- ${Math.abs(P).toFixed(1)}`;

                    out1.innerHTML = `<strong>Phương trình bậc hai:</strong> $x^2 ${sSign} ${pSign} = 0$ | <strong>Tổng:</strong> $S = x_1 + x_2 = ${S.toFixed(2)}$ | <strong>Tích:</strong> $P = x_1 x_2 = ${P.toFixed(2)}$`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slX1.addEventListener('input', updateViete);
                slX2.addEventListener('input', updateViete);
                updateViete();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const slS = document.getElementById('slS');
                const slP = document.getElementById('slP');
                const vS = document.getElementById('vS');
                const vP = document.getElementById('vP');
                const out2 = document.getElementById('lab2Output');

                function updateRect() {
                    const S = parseFloat(slS.value);
                    const P = parseFloat(slP.value);
                    vS.textContent = 'S = ' + S + ' m';
                    vP.textContent = 'P = ' + P + ' m²';

                    const delta = S * S - 4 * P;
                    const cw = c2.width;
                    const ch = c2.height;
                    ctx2.clearRect(0, 0, cw, ch);

                    if (delta < 0) {
                        ctx2.fillStyle = '#ef4444';
                        ctx2.font = '16px sans-serif';
                        ctx2.fillText(`Không tồn tại hình chữ nhật vì S² = ${S*S} < 4P = ${4*P}`, 80, ch / 2);
                        out2.innerHTML = `<span style="color:#ef4444;">&Delta; = S² - 4P = ${delta} < 0 &rArr; Không có kích thước thực tế thỏa mãn!</span>`;
                        return;
                    }

                    const x1 = (S + Math.sqrt(delta)) / 2;
                    const x2 = (S - Math.sqrt(delta)) / 2;
                    const length = Math.max(x1, x2);
                    const width = Math.min(x1, x2);

                    const scale = 12;
                    const pxW = length * scale;
                    const pxH = width * scale;
                    const rx = (cw - pxW) / 2;
                    const ry = (ch - pxH) / 2;

                    ctx2.fillStyle = 'rgba(56, 189, 248, 0.25)';
                    ctx2.fillRect(rx, ry, pxW, pxH);
                    ctx2.strokeStyle = '#38bdf8';
                    ctx2.lineWidth = 3;
                    ctx2.strokeRect(rx, ry, pxW, pxH);

                    ctx2.fillStyle = '#f8fafc';
                    ctx2.font = '14px sans-serif';
                    ctx2.fillText(`Chiều dài: ${length.toFixed(2)} m`, rx + pxW / 2 - 50, ry - 12);
                    ctx2.fillText(`Chiều rộng: ${width.toFixed(2)} m`, rx + pxW + 10, ry + pxH / 2);
                    ctx2.fillText(`Diện tích P = ${P} m²`, rx + pxW / 2 - 50, ry + pxH / 2 + 5);

                    out2.innerHTML = `<strong>Phương trình tìm kích thước:</strong> $X^2 - ${S}X + ${P} = 0$ &rArr; Kích thước: <strong>Dài = ${length.toFixed(2)} m</strong>, <strong>Rộng = ${width.toFixed(2)} m</strong>.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slS.addEventListener('input', updateRect);
                slP.addEventListener('input', updateRect);
                updateRect();
            
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
