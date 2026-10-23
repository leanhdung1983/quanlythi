// ================================================================
// Ôn Tập Chương II: Phương Trình Và Bất Phương Trình Bậc Nhất Một Ẩn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ontap_chuong2_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Chương II',
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
    "title": "Thử Thách 1: Giải Phương Trình Tích Bậc Hai",
    "pts": 20,
    "question": "Nghiệm của phương trình $x^2 - 4x + 3 = 0$ là:",
    "options": [
      {
        "text": "$x = 1$ và $x = 3$",
        "correct": true
      },
      {
        "text": "$x = -1$ và $x = -3$",
        "correct": false
      },
      {
        "text": "$x = 1$ và $x = -3$",
        "correct": false
      },
      {
        "text": "$x = 2$",
        "correct": false
      }
    ],
    "explanation": "Tách nhân tử: $x^2 - x - 3x + 3 = 0 \\iff x(x - 1) - 3(x - 1) = 0 \\iff (x - 1)(x - 3) = 0 \\iff x = 1$ hoặc $x = 3$."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Tìm Nghiệm Của Phương Trình Phân Thức",
    "pts": 20,
    "question": "Giải phương trình $\\frac{x^2 - 9}{x - 3} = 0$. Tập nghiệm của phương trình là:",
    "options": [
      {
        "text": "$S = \\{-3\\}$",
        "correct": true
      },
      {
        "text": "$S = \\{3; -3\\}$",
        "correct": false
      },
      {
        "text": "$S = \\{3\\}$",
        "correct": false
      },
      {
        "text": "$S = \\emptyset$",
        "correct": false
      }
    ],
    "explanation": "ĐKXĐ: $x - 3 \\neq 0 \\iff x \\neq 3$. Tử số bằng 0: $x^2 - 9 = 0 \\iff x = 3$ hoặc $x = -3$. Đối chiếu ĐKXĐ loại $x = 3$, nhận $x = -3$. Vậy $S = \\{-3\\}$."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Phép Biến Đổi Bất Đẳng Thức Đúng",
    "pts": 20,
    "question": "Cho $a > b$. Bất đẳng thức nào sau đây luôn đúng?",
    "options": [
      {
        "text": "$5 - 2a < 5 - 2b$",
        "correct": true
      },
      {
        "text": "$2a - 5 < 2b - 5$",
        "correct": false
      },
      {
        "text": "$-3a > -3b$",
        "correct": false
      },
      {
        "text": "$a^2 > b^2$",
        "correct": false
      }
    ],
    "explanation": "Từ $a > b$, nhân $-2$ đổi chiều: $-2a < -2b$. Cộng thêm 5 vào hai vế: $5 - 2a < 5 - 2b$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Giải Bất Phương Trình Bậc Nhất",
    "pts": 20,
    "question": "Tập nghiệm của bất phương trình $3 - 4x > 11$ là:",
    "options": [
      {
        "text": "$x < -2$",
        "correct": true
      },
      {
        "text": "$x > -2$",
        "correct": false
      },
      {
        "text": "$x < 2$",
        "correct": false
      },
      {
        "text": "$x > 2$",
        "correct": false
      }
    ],
    "explanation": "Chuyển vế: $-4x > 11 - 3 = 8$. Chia cho $-4 < 0$ đổi chiều: $x < \\frac{8}{-4} = -2$."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Biểu Diễn Trục Số",
    "pts": 20,
    "question": "Hình vẽ trục số gạch bỏ phần bên phải điểm $-1$ và có dấu ngoặc tròn <code>)</code> tại $-1$ biểu diễn tập nghiệm nào?",
    "options": [
      {
        "text": "$x < -1$",
        "correct": true
      },
      {
        "text": "$x \\le -1$",
        "correct": false
      },
      {
        "text": "$x > -1$",
        "correct": false
      },
      {
        "text": "$x \\ge -1$",
        "correct": false
      }
    ],
    "explanation": "Gạch bỏ bên phải nghĩa là lấy các giá trị bên trái (nhỏ hơn). Dấu ngoặc tròn <code>)</code> không lấy điểm mốc, nên biểu diễn $x < -1$."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Giải BPT Với Phân Số",
    "pts": 20,
    "question": "Nghiệm của bất phương trình $\\frac{x - 1}{2} - \\frac{x - 2}{3} \\ge 1$ là:",
    "options": [
      {
        "text": "$x \\ge 5$",
        "correct": true
      },
      {
        "text": "$x \\le 5$",
        "correct": false
      },
      {
        "text": "$x \\ge 7$",
        "correct": false
      },
      {
        "text": "$x \\le 7$",
        "correct": false
      }
    ],
    "explanation": "Nhân hai vế với 6: $3(x - 1) - 2(x - 2) \\ge 6 \\iff 3x - 3 - 2x + 4 \\ge 6 \\iff x + 1 \\ge 6 \\iff x \\ge 5$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Số Nghiệm Nguyên Thỏa Mãn Hệ Điều Kiện",
    "pts": 20,
    "question": "Số các số nguyên $x$ thỏa mãn đồng thời cả hai bất phương trình $2x - 1 > 3$ và $x + 4 \\le 9$ là:",
    "options": [
      {
        "text": "$3$",
        "correct": true
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$5$",
        "correct": false
      }
    ],
    "explanation": "Giải $2x - 1 > 3 \\iff 2x > 4 \\iff x > 2$. Giải $x + 4 \\le 9 \\iff x \\le 5$. Kết hợp lại được $2 < x \\le 5$. Các số nguyên thỏa mãn là $x \\in \\{3; 4; 5\\}$, có 3 số."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Giá Trị Nhỏ Nhất Của Biểu Thức",
    "pts": 20,
    "question": "Giá trị nhỏ nhất của biểu thức $A = x^2 - 6x + 14$ là:",
    "options": [
      {
        "text": "$5$",
        "correct": true
      },
      {
        "text": "$14$",
        "correct": false
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$9$",
        "correct": false
      }
    ],
    "explanation": "Biến đổi $A = (x^2 - 6x + 9) + 5 = (x - 3)^2 + 5$. Vì $(x - 3)^2 \\ge 0$ nên $A \\ge 5$. Dấu bằng xảy ra khi $x = 3$. Vậy GTNN là 5."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Bất Phương Trình Chứa Tham Số Vô Nghiệm",
    "pts": 20,
    "question": "Tìm $m$ để bất phương trình $(m^2 - 1)x + 2 < 0$ vô nghiệm với mọi $x$:",
    "options": [
      {
        "text": "$m = 1$ hoặc $m = -1$",
        "correct": true
      },
      {
        "text": "$m = 1$",
        "correct": false
      },
      {
        "text": "$m = 0$",
        "correct": false
      },
      {
        "text": "$m = 2$",
        "correct": false
      }
    ],
    "explanation": "Bất phương trình $(m^2 - 1)x < -2$. Để BPT này vô nghiệm thì hệ số của $x$ phải bằng 0: $m^2 - 1 = 0 \\iff m = \\pm 1$. Khi đó $0x < -2$ (vô lí vì $0 < -2$ sai). Vậy với $m = \\pm 1$ thì BPT vô nghiệm."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Bài Toán Điểm Trung Bình Môn Học",
    "pts": 20,
    "question": "Điểm kiểm tra thường xuyên của Nam gồm 3 bài hệ số 1: 7; 8; 9. Để điểm trung bình cả kỳ từ 8,0 trở lên, điểm bài thi học kỳ (hệ số 3) của Nam tối thiểu phải đạt là:",
    "options": [
      {
        "text": "$8,0$",
        "correct": true
      },
      {
        "text": "$7,5$",
        "correct": false
      },
      {
        "text": "$8,5$",
        "correct": false
      },
      {
        "text": "$7,0$",
        "correct": false
      }
    ],
    "explanation": "Gọi điểm thi học kỳ là $x$ ($0 \\le x \\le 10$). Tổng hệ số là $1 + 1 + 1 + 3 = 6$. Điểm trung bình là $\\frac{7 + 8 + 9 + 3x}{6} = \\frac{24 + 3x}{6} \\ge 8,0 \\iff 24 + 3x \\ge 48 \\iff 3x \\ge 24 \\iff x \\ge 8,0$."
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
                const outEl = document.getElementById('lab1OutputC2');

                const topicsC2 = {
                    1: { title: "Phương trình tích", formula: "$A(x) \\cdot B(x) = 0 \\iff A(x) = 0 \\text{ hoặc } B(x) = 0$", desc: "Phân tích vế trái thành nhân tử bằng đặt nhân tử chung hoặc dùng hằng đẳng thức." },
                    2: { title: "Phương trình chứa ẩn ở mẫu", formula: "$\\frac{A(x)}{B(x)} = 0 \\iff A(x) = 0 \\text{ và } B(x) \\neq 0$", desc: "Quy trình: Tìm ĐKXĐ -> Quy đồng khử mẫu -> Giải -> Loại nghiệm ngoại lai." },
                    3: { title: "Tính chất bất đẳng thức", formula: "$a < b, c < 0 \\implies ac > bc$", desc: "Cộng không đổi chiều; Nhân số dương giữ chiều; Nhân số âm đổi chiều." },
                    4: { title: "Bất phương trình bậc nhất", formula: "$ax + b < 0 \\quad (a \\neq 0)$", desc: "Chuyển vế đổi dấu; chia hệ số âm đổi chiều; biểu diễn ngoặc trên trục số." }
                };

                function showC2(id) {
                    const t = topicsC2[id];
                    outEl.innerHTML = `<strong>Chuyên đề: ${t.title}</strong> &nbsp;|&nbsp; <strong>Công thức:</strong> ${t.formula} <br>${t.desc}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#06b6d4';
                    ctx.beginPath(); ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText('CHƯƠNG II', w / 2, h / 2 - 4);
                    ctx.fillText('PT & BPT', w / 2, h / 2 + 14);
                }

                document.getElementById('btnC2T1').addEventListener('click', () => showC2(1));
                document.getElementById('btnC2T2').addEventListener('click', () => showC2(2));
                document.getElementById('btnC2T3').addEventListener('click', () => showC2(3));
                document.getElementById('btnC2T4').addEventListener('click', () => showC2(4));
                showC2(1);
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const outEl = document.getElementById('lab2OutputC2');

                function renderRule(name, orig, res, valid, note) {
                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText(`PHÉP TOÁN: ${name}`, 25, 35);

                    ctx.fillStyle = '#94a3b8'; ctx.font = '14px Segoe UI';
                    ctx.fillText(`Ban đầu: ${orig}`, 35, 75);
                    ctx.fillText(`Kết quả: ${res}`, 35, 110);

                    ctx.fillStyle = valid ? '#34d399' : '#f43f5e';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText(valid ? '✔ Phép biến đổi ĐÚNG ĐẮN' : '✘ Phép biến đổi SAI / CẦN ĐIỀU KIỆN', 35, 150);

                    outEl.innerHTML = `<strong>${name}:</strong> $${orig} \\implies ${res}$. <br><span style="color: ${valid ? '#34d399' : '#f43f5e'}; font-weight: bold;">${note}</span>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: '$', right: '$', display: false}], throwOnError: false });
                    }
                }

                document.getElementById('btnRuleAdd').addEventListener('click', () => {
                    renderRule('Cộng thêm 5', 'a < b', 'a + 5 < b + 5', true, 'Luôn đúng với mọi số a, b.');
                });
                document.getElementById('btnRuleMulPos').addEventListener('click', () => {
                    renderRule('Nhân với 3 > 0', 'a < b', '3a < 3b', true, 'Nhân số dương giữ nguyên chiều.');
                });
                document.getElementById('btnRuleMulNeg').addEventListener('click', () => {
                    renderRule('Nhân với -2 < 0', 'a < b', '-2a > -2b', true, 'Nhân số âm bắt buộc phải đổi chiều dấu!');
                });
                document.getElementById('btnRuleSquare').addEventListener('click', () => {
                    renderRule('Bình phương 2 vế', 'a < b', 'a^2 < b^2', false, 'CẢNH BÁO: Chỉ đúng khi a, b cùng dương (ví dụ: -3 < 1 nhưng (-3)^2 = 9 > 1).');
                });

                renderRule('Cộng thêm 5', 'a < b', 'a + 5 < b + 5', true, 'Luôn đúng với mọi số a, b.');
            
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
