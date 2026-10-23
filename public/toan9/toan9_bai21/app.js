// ================================================================
// Bài 21: Giải Bài Toán Bằng Cách Lập Phương Trình - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai21_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chiến Lược Gia Mô Hình Hóa 9',
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
    "title": "Câu 1: Điều kiện của ẩn số độ dài",
    "pts": 20,
    "question": "Khi gọi $x$ là chiều rộng của hình chữ nhật có chu vi bằng 40 m, điều kiện thích hợp cho $x$ là:",
    "options": [
      {
        "text": "$x > 0$",
        "correct": false
      },
      {
        "text": "$0 < x < 10$",
        "correct": true
      },
      {
        "text": "$0 < x < 20$",
        "correct": false
      },
      {
        "text": "$x < 40$",
        "correct": false
      }
    ],
    "explanation": "Nửa chu vi là $40 : 2 = 20\\text{ m}$. Chiều dài là $20 - x$. Để $x$ là chiều rộng thì $0 < x < 20 - x \\iff 2x < 20 \\iff 0 < x < 10$."
  },
  {
    "id": 2,
    "title": "Câu 2: Bài toán hai số tự nhiên liên tiếp",
    "pts": 20,
    "question": "Tích của hai số tự nhiên liên tiếp lớn hơn tổng của chúng là 109. Hai số đó là:",
    "options": [
      {
        "text": "10 và 11",
        "correct": false
      },
      {
        "text": "11 và 12",
        "correct": true
      },
      {
        "text": "12 và 13",
        "correct": false
      },
      {
        "text": "9 và 10",
        "correct": false
      }
    ],
    "explanation": "Gọi 2 số là $x$ và $x + 1\\ (x \\in \\mathbb{N})$. Ta có $x(x + 1) - (x + x + 1) = 109 \\iff x^2 + x - 2x - 1 = 109 \\iff x^2 - x - 110 = 0 \\iff (x - 11)(x + 10) = 0$. Vì $x \\in \\mathbb{N}$ nên $x = 11$, số tiếp theo là 12."
  },
  {
    "id": 3,
    "title": "Câu 3: Bài toán ca-nô xuôi dòng",
    "pts": 20,
    "question": "Một ca-nô xuôi dòng 45 km rồi ngược dòng trở lại 18 km hết tất cả 3 giờ. Biết vận tốc dòng nước là 3 km/h. Gọi vận tốc riêng của ca-nô là $v$ (km/h), phương trình biểu thị thời gian đi là:",
    "options": [
      {
        "text": "$\\frac{45}{v + 3} + \\frac{18}{v - 3} = 3$",
        "correct": true
      },
      {
        "text": "$\\frac{45}{v - 3} + \\frac{18}{v + 3} = 3$",
        "correct": false
      },
      {
        "text": "$\\frac{45 + 18}{v} = 3$",
        "correct": false
      },
      {
        "text": "$\\frac{45}{v + 3} - \\frac{18}{v - 3} = 3$",
        "correct": false
      }
    ],
    "explanation": "Thời gian xuôi dòng là $\\frac{45}{v + 3}$, ngược dòng là $\\frac{18}{v - 3}$. Tổng thời gian là 3 giờ nên ta có phương trình $\\frac{45}{v + 3} + \\frac{18}{v - 3} = 3$."
  },
  {
    "id": 4,
    "title": "Câu 4: Bài toán diện tích tam giác vuông",
    "pts": 20,
    "question": "Một tam giác vuông có hai cạnh góc vuông hơn kém nhau 3 cm và diện tích bằng 20 cm². Độ dài cạnh huyền của tam giác vuông đó là:",
    "options": [
      {
        "text": "$\\sqrt{89}$ cm",
        "correct": true
      },
      {
        "text": "8 cm",
        "correct": false
      },
      {
        "text": "9 cm",
        "correct": false
      },
      {
        "text": "10 cm",
        "correct": false
      }
    ],
    "explanation": "Gọi 2 cạnh góc vuông là $x$ và $x + 3\\ (x > 0)$. Ta có $\\frac{1}{2}x(x + 3) = 20 \\iff x^2 + 3x - 40 = 0 \\iff (x - 5)(x + 8) = 0 \\implies x = 5$. Hai cạnh góc vuông là 5 cm và 8 cm. Cạnh huyền là $\\sqrt{5^2 + 8^2} = \\sqrt{25 + 64} = \\sqrt{89}$ cm."
  },
  {
    "id": 5,
    "title": "Câu 5: Bài toán năng suất làm đường",
    "pts": 20,
    "question": "Theo kế hoạch, một đội công nhân phải làm 120 m đường. Do cải tiến kỹ thuật, mỗi ngày đội làm thêm được 5 m nên đã hoàn thành sớm hơn 2 ngày so với kế hoạch. Gọi số mét đường làm mỗi ngày theo kế hoạch là $x$, phương trình lập được là:",
    "options": [
      {
        "text": "$\\frac{120}{x} - \\frac{120}{x + 5} = 2$",
        "correct": true
      },
      {
        "text": "$\\frac{120}{x + 5} - \\frac{120}{x} = 2$",
        "correct": false
      },
      {
        "text": "$\\frac{120}{x} + \\frac{120}{x + 5} = 2$",
        "correct": false
      },
      {
        "text": "$120x - 120(x + 5) = 2$",
        "correct": false
      }
    ],
    "explanation": "Thời gian dự kiến là $\\frac{120}{x}$ ngày, thời gian thực tế là $\\frac{120}{x + 5}$ ngày. Hoàn thành sớm 2 ngày nên thời gian dự kiến nhiều hơn thực tế 2 ngày: $\\frac{120}{x} - \\frac{120}{x + 5} = 2$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tìm số mét đường thực tế",
    "pts": 20,
    "question": "Giải phương trình $\\frac{120}{x} - \\frac{120}{x + 5} = 2$ (với $x > 0$), ta tìm được số mét đường làm mỗi ngày theo kế hoạch là:",
    "options": [
      {
        "text": "15 m/ngày",
        "correct": true
      },
      {
        "text": "20 m/ngày",
        "correct": false
      },
      {
        "text": "10 m/ngày",
        "correct": false
      },
      {
        "text": "25 m/ngày",
        "correct": false
      }
    ],
    "explanation": "Quy đồng khử mẫu: $120(x + 5) - 120x = 2x(x + 5) \\iff 600 = 2x^2 + 10x \\iff x^2 + 5x - 300 = 0 \\iff (x - 15)(x + 20) = 0$. Vì $x > 0$ nên $x = 15$."
  },
  {
    "id": 7,
    "title": "Câu 7: Bài toán xe tải chở hàng",
    "pts": 20,
    "question": "Một đội xe dự định chở 40 tấn hàng. Khi sắp khởi hành có 2 xe được điều đi làm việc khác, nên mỗi xe còn lại phải chở thêm 1 tấn hàng nữa mới hết. Số xe ban đầu của đội là:",
    "options": [
      {
        "text": "8 xe",
        "correct": false
      },
      {
        "text": "10 xe",
        "correct": true
      },
      {
        "text": "12 xe",
        "correct": false
      },
      {
        "text": "6 xe",
        "correct": false
      }
    ],
    "explanation": "Gọi số xe ban đầu là $x\\ (x > 2, x \\in \\mathbb{N})$. Ta có phương trình $\\frac{40}{x - 2} - \\frac{40}{x} = 1 \\iff 40x - 40(x - 2) = x(x - 2) \\iff x^2 - 2x - 80 = 0 \\iff (x - 10)(x + 8) = 0 \\implies x = 10$ xe."
  },
  {
    "id": 8,
    "title": "Câu 8: Bài toán kinh tế lãi suất kép",
    "pts": 20,
    "question": "Bác An gửi tiết kiệm 100 triệu đồng vào ngân hàng với kỳ hạn 1 năm. Sau hai năm, bác An nhận được cả gốc và lãi là 114,49 triệu đồng. Lãi suất mỗi năm của ngân hàng là bao nhiêu?",
    "options": [
      {
        "text": "6%/năm",
        "correct": false
      },
      {
        "text": "7%/năm",
        "correct": true
      },
      {
        "text": "8%/năm",
        "correct": false
      },
      {
        "text": "7,5%/năm",
        "correct": false
      }
    ],
    "explanation": "Gọi lãi suất là $r$. Số tiền sau 2 năm là $100(1 + r)^2 = 114,49 \\iff (1 + r)^2 = 1,1449 \\iff 1 + r = 1,07 \\iff r = 0,07 = 7\\%$."
  },
  {
    "id": 9,
    "title": "Câu 9: Loại nghiệm không thỏa mãn thực tế",
    "pts": 20,
    "question": "Khi giải phương trình tìm chiều rộng mảnh đất được hai nghiệm là $x_1 = 15$ và $x_2 = -8$, ta kết luận:",
    "options": [
      {
        "text": "Chiều rộng là 15 m (loại $x = -8$ vì độ dài phải dương)",
        "correct": true
      },
      {
        "text": "Chiều rộng có thể là 15 m hoặc -8 m",
        "correct": false
      },
      {
        "text": "Phương trình vô nghiệm",
        "correct": false
      },
      {
        "text": "Chiều rộng là -8 m",
        "correct": false
      }
    ],
    "explanation": "Độ dài đại lượng thực tế hình học bắt buộc phải là số dương ($x > 0$), do đó nghiệm âm $x_2 = -8$ bị loại."
  },
  {
    "id": 10,
    "title": "Câu 10: Bài toán bể bơi vòi nước chảy",
    "pts": 20,
    "question": "Hai vòi nước cùng chảy vào một bể cạn thì sau 4 giờ 48 phút (tức $\\frac{24}{5}$ giờ) bể đầy. Nếu chảy riêng, vòi 1 làm đầy bể nhanh hơn vòi 2 là 4 giờ. Thời gian để vòi 1 chảy một mình đầy bể là:",
    "options": [
      {
        "text": "8 giờ",
        "correct": true
      },
      {
        "text": "12 giờ",
        "correct": false
      },
      {
        "text": "10 giờ",
        "correct": false
      },
      {
        "text": "6 giờ",
        "correct": false
      }
    ],
    "explanation": "Gọi thời gian vòi 1 chảy riêng đầy bể là $x\\ (x > 0)$, vòi 2 là $x + 4$. Ta có phương trình $\\frac{1}{x} + \\frac{1}{x + 4} = \\frac{5}{24} \\iff \\frac{2x + 4}{x(x + 4)} = \\frac{5}{24} \\iff 5x^2 - 28x - 96 = 0 \\iff (x - 8)(5x + 12) = 0 \\implies x = 8$ giờ."
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
                const slV0 = document.getElementById('slV0');
                const slVn = document.getElementById('slVn');
                const vV0 = document.getElementById('vV0');
                const vVn = document.getElementById('vVn');
                const out1 = document.getElementById('lab1Output');

                let boatX = 60;
                let direction = 1; // 1 xuoi, -1 nguoc
                const S = 60; // km

                function renderCanoe() {
                    const v0 = parseFloat(slV0.value);
                    const vn = parseFloat(slVn.value);
                    vV0.textContent = 'v = ' + v0 + ' km/h';
                    vVn.textContent = 'v_nước = ' + vn + ' km/h';

                    const vXuoi = v0 + vn;
                    const vNguoc = v0 - vn;
                    const tXuoi = S / vXuoi;
                    const tNguoc = S / vNguoc;
                    const tTong = tXuoi + tNguoc;

                    const cw = c1.width;
                    const ch = c1.height;
                    ctx.clearRect(0, 0, cw, ch);

                    // River
                    ctx.fillStyle = '#0369a1';
                    ctx.fillRect(0, 100, cw, 140);

                    // River banks
                    ctx.fillStyle = '#15803d';
                    ctx.fillRect(0, 70, cw, 30);
                    ctx.fillRect(0, 240, cw, 40);

                    // Pier A and B
                    ctx.fillStyle = '#b45309';
                    ctx.fillRect(40, 90, 20, 60);
                    ctx.fillRect(cw - 60, 90, 20, 60);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px sans-serif';
                    ctx.fillText('Bến A', 30, 85);
                    ctx.fillText('Bến B', cw - 70, 85);

                    // Flow arrows
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    ctx.lineWidth = 2;
                    for (let x = 120; x < cw - 100; x += 90) {
                        ctx.beginPath();
                        ctx.moveTo(x, 170); ctx.lineTo(x + 30, 170);
                        ctx.lineTo(x + 22, 164); ctx.moveTo(x + 30, 170); ctx.lineTo(x + 22, 176);
                        ctx.stroke();
                    }
                    ctx.fillText(`Dòng chảy &rarr; ${vn} km/h`, cw / 2 - 60, 155);

                    // Canoe
                    boatX += direction * (direction === 1 ? vXuoi : vNguoc) * 0.08;
                    if (boatX > cw - 80) { boatX = cw - 80; direction = -1; }
                    if (boatX < 60) { boatX = 60; direction = 1; }

                    ctx.fillStyle = direction === 1 ? '#e11d48' : '#eab308';
                    ctx.beginPath();
                    ctx.moveTo(boatX, 195);
                    ctx.lineTo(boatX + 40 * direction, 195);
                    ctx.lineTo(boatX + 30 * direction, 210);
                    ctx.lineTo(boatX - 10 * direction, 210);
                    ctx.closePath();
                    ctx.fill();

                    out1.innerHTML = `<strong>Quãng đường:</strong> $S = ${S}\\text{ km}$ | <strong>Xuôi dòng:</strong> $v = ${vXuoi}\\text{ km/h} &rArr; t = ${tXuoi.toFixed(2)}\\text{ h}$ | <strong>Ngược dòng:</strong> $v = ${vNguoc}\\text{ km/h} &rArr; t = ${tNguoc.toFixed(2)}\\text{ h}$ | <strong>Tổng thời gian:</strong> $${tTong.toFixed(2)}\\text{ h}$.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slV0.addEventListener('input', renderCanoe);
                slVn.addEventListener('input', renderCanoe);
                setInterval(renderCanoe, 40);
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const slX = document.getElementById('slXWalk');
                const vX = document.getElementById('vXWalk');
                const out2 = document.getElementById('lab2Output');

                const L = 20; // m
                const W = 12; // m
                const S_total = L * W; // 240 m2

                function drawGarden() {
                    const x = parseFloat(slX.value);
                    vX.textContent = 'x = ' + x.toFixed(2) + ' m';

                    const inL = L - 2 * x;
                    const inW = W - 2 * x;
                    const inS = inL * inW;
                    const walkS = S_total - inS;

                    const cw = c2.width;
                    const ch = c2.height;
                    ctx2.clearRect(0, 0, cw, ch);

                    const scale = 16;
                    const pxL = L * scale;
                    const pxW = W * scale;
                    const ox = (cw - pxL) / 2;
                    const oy = (ch - pxW) / 2;

                    // Walkway outer
                    ctx2.fillStyle = '#64748b';
                    ctx2.fillRect(ox, oy, pxL, pxW);
                    ctx2.strokeStyle = '#94a3b8';
                    ctx2.lineWidth = 2;
                    ctx2.strokeRect(ox, oy, pxL, pxW);

                    // Inner flower bed
                    const pxInL = inL * scale;
                    const pxInW = inW * scale;
                    const inOx = ox + x * scale;
                    const inOy = oy + x * scale;

                    ctx2.fillStyle = '#16a34a';
                    ctx2.fillRect(inOx, inOy, pxInL, pxInW);
                    ctx2.strokeStyle = '#4ade80';
                    ctx2.lineWidth = 2;
                    ctx2.strokeRect(inOx, inOy, pxInL, pxInW);

                    // Dimension markers
                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = '13px sans-serif';
                    ctx2.fillText(`Vườn ngoài: ${L} m × ${W} m (${S_total} m²)`, ox + 10, oy - 10);
                    ctx2.fillText(`Trồng hoa: ${inL.toFixed(1)} m × ${inW.toFixed(1)} m = ${inS.toFixed(1)} m²`, inOx + 20, inOy + pxInW / 2);
                    ctx2.fillText(`Lối đi: ${walkS.toFixed(1)} m²`, ox + 8, oy + 22);

                    out2.innerHTML = `<strong>Phương trình diện tích trồng hoa:</strong> $(20 - 2x)(12 - 2x) = ${inS.toFixed(1)}$ &hArr; $4x^2 - 64x + (240 - ${inS.toFixed(1)}) = 0$. Bề rộng $x = ${x.toFixed(2)}\\text{ m}$.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slX.addEventListener('input', drawGarden);
                drawGarden();
            
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
