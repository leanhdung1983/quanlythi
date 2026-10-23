// ================================================================
// Bài 11: Tỉ số lượng giác của góc nhọn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai11_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Hiệp Sĩ Lượng Giác 9',
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
    "id": "q1",
    "title": "Câu 1: Nhận diện định nghĩa tỉ số lượng giác",
    "question": "Cho tam giác $ABC$ vuông tại $A$. Tỉ số lượng giác nào sau đây đúng?",
    "options": [
      {
        "text": "$\\sin B = \\frac{AB}{BC}$",
        "correct": false
      },
      {
        "text": "$\\sin B = \\frac{AC}{BC}$",
        "correct": true
      },
      {
        "text": "$\\cos B = \\frac{AC}{BC}$",
        "correct": false
      },
      {
        "text": "$\\tan B = \\frac{AB}{AC}$",
        "correct": false
      }
    ],
    "explanation": "Trong tam giác vuông $ABC$ tại $A$, cạnh đối của góc $B$ là $AC$, cạnh kề là $AB$, cạnh huyền là $BC$. Do đó $\\sin B = \\frac{\\text{đối}}{\\text{huyền}} = \\frac{AC}{BC}$.",
    "pts": 20
  },
  {
    "id": "q2",
    "title": "Câu 2: Tính tỉ số lượng giác của tam giác cụ thể",
    "question": "Cho tam giác $ABC$ vuông tại $A$ có $AB = 3$ cm, $AC = 4$ cm. Độ dài cạnh huyền $BC = 5$ cm. Giá trị $\\cos B$ bằng:",
    "options": [
      {
        "text": "$\\frac{4}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{5}$",
        "correct": true
      },
      {
        "text": "$\\frac{4}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{4}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\cos B = \\frac{AB}{BC} = \\frac{3}{5}$.",
    "pts": 20
  },
  {
    "id": "q3",
    "title": "Câu 3: Tỉ số lượng giác của hai góc phụ nhau",
    "question": "Nếu hai góc nhọn $\\alpha$ và $\\beta$ thỏa mãn $\\alpha + \\beta = 90^\\circ$ thì đẳng thức nào sau đây sai?",
    "options": [
      {
        "text": "$\\sin \\alpha = \\cos \\beta$",
        "correct": false
      },
      {
        "text": "$\\cos \\alpha = \\sin \\beta$",
        "correct": false
      },
      {
        "text": "$\\tan \\alpha = \\cot \\beta$",
        "correct": false
      },
      {
        "text": "$\\tan \\alpha = \\tan \\beta$",
        "correct": true
      }
    ],
    "explanation": "Hai góc phụ nhau có $\\tan \\alpha = \\cot \\beta$, chứ không phải $\\tan \\alpha = \\tan \\beta$ (trừ khi $\\alpha = \\beta = 45^\\circ$).",
    "pts": 20
  },
  {
    "id": "q4",
    "title": "Câu 4: Giá trị lượng giác góc đặc biệt 30 độ",
    "question": "Giá trị của $\\sin 30^\\circ$ và $\\cos 60^\\circ$ bằng bao nhiêu?",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{\\sqrt{3}}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{\\sqrt{2}}{2}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Theo bảng lượng giác các góc đặc biệt, $\\sin 30^\\circ = \\cos 60^\\circ = \\frac{1}{2}$.",
    "pts": 20
  },
  {
    "id": "q5",
    "title": "Câu 5: Tính giá trị biểu thức lượng giác",
    "question": "Tính giá trị của biểu thức $P = \\sin^2 35^\\circ + \\sin^2 55^\\circ$:",
    "options": [
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": true
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      }
    ],
    "explanation": "Vì $35^\\circ + 55^\\circ = 90^\\circ$ nên $\\sin 55^\\circ = \\cos 35^\\circ$. Do đó $P = \\sin^2 35^\\circ + \\cos^2 35^\\circ = 1$.",
    "pts": 20
  },
  {
    "id": "q6",
    "title": "Câu 6: Tích tan và cot của cùng một góc",
    "question": "Với góc nhọn $\\alpha$ bất kì, giá trị của tích $\\tan \\alpha \\cdot \\cot \\alpha$ là:",
    "options": [
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": true
      },
      {
        "text": "$-1$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa: $\\tan \\alpha = \\frac{\\text{đối}}{\\text{kề}}$, $\\cot \\alpha = \\frac{\\text{kề}}{\\text{đối}}$, nên $\\tan \\alpha \\cdot \\cot \\alpha = 1$.",
    "pts": 20
  },
  {
    "id": "q7",
    "title": "Câu 7: So sánh các tỉ số lượng giác",
    "question": "Cho hai góc nhọn $\\alpha$ và $\\beta$ sao cho $\\alpha < \\beta$. Khẳng định nào sau đây là đúng?",
    "options": [
      {
        "text": "$\\sin \\alpha > \\sin \\beta$",
        "correct": false
      },
      {
        "text": "$\\cos \\alpha < \\cos \\beta$",
        "correct": false
      },
      {
        "text": "$\\sin \\alpha < \\sin \\beta$",
        "correct": true
      },
      {
        "text": "$\\cot \\alpha < \\cot \\beta$",
        "correct": false
      }
    ],
    "explanation": "Khi góc nhọn tăng từ $0^\\circ$ đến $90^\\circ$, $\\sin$ và $\\tan$ tăng, còn $\\cos$ và $\\cot$ giảm. Do đó $\\alpha < \\beta \\implies \\sin \\alpha < \\sin \\beta$.",
    "pts": 20
  },
  {
    "id": "q8",
    "title": "Câu 8: Tìm góc nhọn khi biết tỉ số lượng giác",
    "question": "Biết $\\tan \\alpha = 1$, góc nhọn $\\alpha$ bằng:",
    "options": [
      {
        "text": "$30^\\circ$",
        "correct": false
      },
      {
        "text": "$45^\\circ$",
        "correct": true
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Tam giác vuông cân có hai góc nhọn bằng $45^\\circ$ và cạnh đối bằng cạnh kề nên $\\tan 45^\\circ = 1$.",
    "pts": 20
  },
  {
    "id": "q9",
    "title": "Câu 9: Tính cạnh của tam giác vuông qua sin",
    "question": "Tam giác $ABC$ vuông tại $A$ có $\\widehat{B} = 30^\\circ$ và cạnh huyền $BC = 12$ cm. Độ dài cạnh đối $AC$ là:",
    "options": [
      {
        "text": "$6$ cm",
        "correct": true
      },
      {
        "text": "$6\\sqrt{3}$ cm",
        "correct": false
      },
      {
        "text": "$4$ cm",
        "correct": false
      },
      {
        "text": "$8$ cm",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\sin B = \\frac{AC}{BC} \\implies AC = BC \\cdot \\sin B = 12 \\cdot \\sin 30^\\circ = 12 \\cdot \\frac{1}{2} = 6$ cm.",
    "pts": 20
  },
  {
    "id": "q10",
    "title": "Câu 10: Rút gọn biểu thức lượng giác",
    "question": "Rút gọn biểu thức $M = \\tan 20^\\circ \\cdot \\tan 70^\\circ - \\frac{\\cos 40^\\circ}{\\sin 50^\\circ}$:",
    "options": [
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": true
      },
      {
        "text": "$-1$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      }
    ],
    "explanation": "Vì $20^\\circ + 70^\\circ = 90^\\circ \\implies \\tan 70^\\circ = \\cot 20^\\circ \\implies \\tan 20^\\circ \\cdot \\cot 20^\\circ = 1$. Lại có $40^\\circ + 50^\\circ = 90^\\circ \\implies \\sin 50^\\circ = \\cos 40^\\circ \\implies \\frac{\\cos 40^\\circ}{\\sin 50^\\circ} = 1$. Vậy $M = 1 - 1 = 0$.",
    "pts": 20
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
    
                const canvas = document.getElementById('trigCanvas');
                const ctx = canvas.getContext('2d');
                const rngAngle = document.getElementById('rngAngle');
                const rngHyp = document.getElementById('rngHyp');

                function draw() {
                    const deg = parseFloat(rngAngle.value);
                    const hyp = parseFloat(rngHyp.value);
                    document.getElementById('lblAngle').innerText = deg;
                    document.getElementById('lblHyp').innerText = hyp;
                    document.getElementById('outAngle').innerText = deg;

                    const rad = deg * Math.PI / 180;
                    const sinVal = Math.sin(rad);
                    const cosVal = Math.cos(rad);
                    const tanVal = Math.tan(rad);
                    const cotVal = 1 / tanVal;

                    const opp = hyp * sinVal;
                    const adj = hyp * cosVal;

                    document.getElementById('outOpp').innerText = opp.toFixed(2);
                    document.getElementById('outAdj').innerText = adj.toFixed(2);
                    document.getElementById('outHyp').innerText = hyp.toFixed(2);

                    document.getElementById('valSin').innerText = sinVal.toFixed(4);
                    document.getElementById('valCos').innerText = cosVal.toFixed(4);
                    document.getElementById('valTan').innerText = tanVal.toFixed(4);
                    document.getElementById('valCot').innerText = cotVal.toFixed(4);

                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    const ox = 70;
                    const oy = canvas.height - 50;
                    const scale = 20;

                    const bx = ox;
                    const by = oy;
                    const ax = ox + adj * scale;
                    const ay = oy;
                    const cx = ax;
                    const cy = oy - opp * scale;

                    // Triangle path
                    ctx.beginPath();
                    ctx.moveTo(bx, by);
                    ctx.lineTo(ax, ay);
                    ctx.lineTo(cx, cy);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
                    ctx.fill();
                    ctx.strokeStyle = '#818cf8';
                    ctx.lineWidth = 3;
                    ctx.stroke();

                    // Right angle symbol at A
                    const rsize = 14;
                    ctx.beginPath();
                    ctx.moveTo(ax - rsize, ay);
                    ctx.lineTo(ax - rsize, ay - rsize);
                    ctx.lineTo(ax, ay - rsize);
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2;
                    ctx.stroke();

                    // Angle arc at B
                    ctx.beginPath();
                    ctx.arc(bx, by, 32, -rad, 0, false);
                    ctx.strokeStyle = '#ec4899';
                    ctx.lineWidth = 2;
                    ctx.stroke();
                    ctx.fillStyle = '#f43f5e';
                    ctx.font = 'bold 13px Inter, sans-serif';
                    ctx.fillText(deg + '°', bx + 38, by - 10);

                    // Points labels
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 15px Inter, sans-serif';
                    ctx.fillText('B', bx - 20, by + 5);
                    ctx.fillText('A (vuông)', ax - 10, ay + 24);
                    ctx.fillText('C', cx - 5, cy - 12);

                    // Side labels
                    ctx.fillStyle = '#a5b4fc';
                    ctx.fillText('kề: ' + adj.toFixed(1) + ' cm', (bx + ax) / 2 - 25, ay + 18);
                    ctx.fillStyle = '#34d399';
                    ctx.fillText('đối: ' + opp.toFixed(1) + ' cm', ax + 10, (ay + cy) / 2);
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillText('huyền: ' + hyp.toFixed(1) + ' cm', (bx + cx) / 2 - 40, (by + cy) / 2 - 10);
                }
                rngAngle.addEventListener('input', draw);
                rngHyp.addEventListener('input', draw);
                draw();
                
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const cCanvas = document.getElementById('compCanvas');
                const cctx = cCanvas.getContext('2d');

                window.setCompAngle = function(deg) {
                    const beta = 90 - deg;
                    document.getElementById('lblAlpha').innerText = deg;
                    document.getElementById('lblBeta').innerText = beta;

                    ['cA1','cA2','cA3','cA4'].forEach(id => document.getElementById(id).innerText = deg);
                    ['cB1','cB2','cB3','cB4'].forEach(id => document.getElementById(id).innerText = beta);

                    const radA = deg * Math.PI / 180;
                    const sA = Math.sin(radA);
                    const cA = Math.cos(radA);
                    const tA = Math.tan(radA);
                    const cotA = 1 / tA;

                    document.getElementById('vSinA').innerText = sA.toFixed(4);
                    document.getElementById('vCosA').innerText = cA.toFixed(4);
                    document.getElementById('vTanA').innerText = tA.toFixed(4);
                    document.getElementById('vCotA').innerText = cotA.toFixed(4);

                    cctx.clearRect(0, 0, cCanvas.width, cCanvas.height);
                    const cx = cCanvas.width / 2;
                    const cy = cCanvas.height / 2;
                    const r = 100;

                    cctx.beginPath();
                    cctx.arc(cx, cy, r, 0, Math.PI * 2);
                    cctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    cctx.lineWidth = 1;
                    cctx.stroke();

                    // Axes
                    cctx.beginPath();
                    cctx.moveTo(cx - r - 20, cy);
                    cctx.lineTo(cx + r + 20, cy);
                    cctx.moveTo(cx, cy - r - 20);
                    cctx.lineTo(cx, cy + r + 20);
                    cctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    cctx.stroke();

                    // Vector Alpha
                    const px = cx + r * Math.cos(-radA);
                    const py = cy + r * Math.sin(-radA);
                    cctx.beginPath();
                    cctx.moveTo(cx, cy);
                    cctx.lineTo(px, py);
                    cctx.strokeStyle = '#6366f1';
                    cctx.lineWidth = 3;
                    cctx.stroke();

                    cctx.fillStyle = '#818cf8';
                    cctx.fillText('α = ' + deg + '°', px + 10, py);
                    cctx.fillStyle = '#34d399';
                    cctx.fillText('β = 90° - α = ' + beta + '°', cx + 15, cy - r + 20);
                };
                window.setCompAngle(30);
                
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
