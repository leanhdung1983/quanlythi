// ================================================================
// Bài 12: Một số hệ thức giữa cạnh và góc trong tam giác vuông - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai12_state';

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
    "title": "Câu 1: Hệ thức giữa cạnh góc vuông và cạnh huyền qua sin",
    "question": "Cho tam giác $ABC$ vuông tại $A$, cạnh huyền $a$, các cạnh góc vuông $b, c$. Hệ thức nào sau đây đúng?",
    "options": [
      {
        "text": "$b = a \\cdot \\sin B$",
        "correct": true
      },
      {
        "text": "$b = a \\cdot \\cos B$",
        "correct": false
      },
      {
        "text": "$b = a \\cdot \\tan B$",
        "correct": false
      },
      {
        "text": "$b = a \\cdot \\cot B$",
        "correct": false
      }
    ],
    "explanation": "Trong tam giác vuông, mỗi cạnh góc vuông bằng cạnh huyền nhân với $\\sin$ góc đối: $b = a \\cdot \\sin B$.",
    "pts": 20
  },
  {
    "id": "q2",
    "title": "Câu 2: Hệ thức giữa cạnh góc vuông và cạnh huyền qua cos",
    "question": "Trong tam giác $ABC$ vuông tại $A$, cạnh góc vuông $c$ bằng:",
    "options": [
      {
        "text": "$a \\cdot \\sin B$",
        "correct": false
      },
      {
        "text": "$a \\cdot \\cos B$",
        "correct": true
      },
      {
        "text": "$a \\cdot \\tan C$",
        "correct": false
      },
      {
        "text": "$b \\cdot \\sin C$",
        "correct": false
      }
    ],
    "explanation": "Cạnh $c$ kề với góc $B$, do đó $c = a \\cdot \\cos B$ (cạnh huyền nhân với $\\cos$ góc kề).",
    "pts": 20
  },
  {
    "id": "q3",
    "title": "Câu 3: Hệ thức giữa hai cạnh góc vuông",
    "question": "Hệ thức nào sau đây biểu diễn mối liên hệ giữa hai cạnh góc vuông $b$ và $c$?",
    "options": [
      {
        "text": "$b = c \\cdot \\tan B$",
        "correct": true
      },
      {
        "text": "$b = c \\cdot \\cot B$",
        "correct": false
      },
      {
        "text": "$b = c \\cdot \\sin B$",
        "correct": false
      },
      {
        "text": "$b = c \\cdot \\cos B$",
        "correct": false
      }
    ],
    "explanation": "Mỗi cạnh góc vuông bằng cạnh góc vuông kia nhân với $\\tan$ góc đối: $b = c \\cdot \\tan B$.",
    "pts": 20
  },
  {
    "id": "q4",
    "title": "Câu 4: Tính cạnh góc vuông khi biết cạnh huyền và góc",
    "question": "Cho tam giác $ABC$ vuông tại $A$ có $BC = 10$ cm, $\\widehat{B} = 60^\\circ$. Độ dài cạnh $AC$ là:",
    "options": [
      {
        "text": "$5$ cm",
        "correct": false
      },
      {
        "text": "$5\\sqrt{3}$ cm",
        "correct": true
      },
      {
        "text": "$5\\sqrt{2}$ cm",
        "correct": false
      },
      {
        "text": "$10\\sqrt{3}$ cm",
        "correct": false
      }
    ],
    "explanation": "Ta có $AC = BC \\cdot \\sin B = 10 \\cdot \\sin 60^\\circ = 10 \\cdot \\frac{\\sqrt{3}}{2} = 5\\sqrt{3}$ cm.",
    "pts": 20
  },
  {
    "id": "q5",
    "title": "Câu 5: Tính cạnh kề khi biết cạnh đối và góc",
    "question": "Cho tam giác $ABC$ vuông tại $A$ có $AC = 6$ cm, $\\widehat{B} = 45^\\circ$. Độ dài cạnh $AB$ là:",
    "options": [
      {
        "text": "$6$ cm",
        "correct": true
      },
      {
        "text": "$6\\sqrt{2}$ cm",
        "correct": false
      },
      {
        "text": "$3$ cm",
        "correct": false
      },
      {
        "text": "$3\\sqrt{2}$ cm",
        "correct": false
      }
    ],
    "explanation": "Vì $\\widehat{B} = 45^\\circ$ nên tam giác $ABC$ vuông cân tại $A$, suy ra $AB = AC = 6$ cm (hoặc $AB = AC \\cdot \\cot 45^\\circ = 6 \\cdot 1 = 6$ cm).",
    "pts": 20
  },
  {
    "id": "q6",
    "title": "Câu 6: Tìm góc khi biết hai cạnh góc vuông",
    "question": "Tam giác $ABC$ vuông tại $A$ có $AB = 4$ cm, $AC = 4\\sqrt{3}$ cm. Số đo góc $\\widehat{B}$ là:",
    "options": [
      {
        "text": "$30^\\circ$",
        "correct": false
      },
      {
        "text": "$45^\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\circ$",
        "correct": true
      },
      {
        "text": "$75^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\tan B = \\frac{AC}{AB} = \\frac{4\\sqrt{3}}{4} = \\sqrt{3} \\implies \\widehat{B} = 60^\\circ$.",
    "pts": 20
  },
  {
    "id": "q7",
    "title": "Câu 7: Giải tam giác vuông khi biết cạnh huyền và một cạnh góc vuông",
    "question": "Tam giác $ABC$ vuông tại $A$ có $BC = 8$ cm, $AB = 4$ cm. Số đo góc $\\widehat{C}$ là:",
    "options": [
      {
        "text": "$30^\\circ$",
        "correct": true
      },
      {
        "text": "$45^\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$50^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\sin C = \\frac{AB}{BC} = \\frac{4}{8} = \\frac{1}{2} \\implies \\widehat{C} = 30^\\circ$.",
    "pts": 20
  },
  {
    "id": "q8",
    "title": "Câu 8: Ứng dụng đo chiều cao cây",
    "question": "Một người đứng cách gốc cây $20$ m nhìn thấy ngọn cây dưới một góc $30^\\circ$ so với phương nằm ngang. Biết khoảng cách từ mắt người đó đến mặt đất là $1.6$ m. Chiều cao của cây là (làm tròn đến hàng phần mười):",
    "options": [
      {
        "text": "$11.5$ m",
        "correct": false
      },
      {
        "text": "$13.1$ m",
        "correct": true
      },
      {
        "text": "$12.8$ m",
        "correct": false
      },
      {
        "text": "$15.0$ m",
        "correct": false
      }
    ],
    "explanation": "Phần chiều cao từ tầm mắt tới ngọn cây là $h = 20 \\cdot \\tan 30^\\circ = 20 \\cdot \\frac{\\sqrt{3}}{3} \\approx 11.55$ m. Chiều cao cây là $H = 11.55 + 1.6 = 13.15 \\approx 13.1$ m.",
    "pts": 20
  },
  {
    "id": "q9",
    "title": "Câu 9: Chiều dài bóng của cột cờ",
    "question": "Một cột cờ cao $7$ m có bóng trên mặt đất dài $4$ m. Góc mà tia sáng mặt trời tạo với mặt đất (làm tròn đến độ) là:",
    "options": [
      {
        "text": "$60^\\circ$",
        "correct": true
      },
      {
        "text": "$30^\\circ$",
        "correct": false
      },
      {
        "text": "$45^\\circ$",
        "correct": false
      },
      {
        "text": "$70^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Gọi $\\alpha$ là góc tia sáng với mặt đất. Ta có $\\tan \\alpha = \\frac{7}{4} = 1.75 \\implies \\alpha \\approx 60^\\circ 15' \\approx 60^\\circ$.",
    "pts": 20
  },
  {
    "id": "q10",
    "title": "Câu 10: Chiều dài thang trượt an toàn",
    "question": "Một chiếc thang dài $3$ m được kê nghiêng vào bức tường sao cho góc giữa thang và mặt đất là $65^\\circ$. Chiều cao mà đỉnh thang đạt được trên tường là (làm tròn đến hàng phần trăm):",
    "options": [
      {
        "text": "$2.72$ m",
        "correct": true
      },
      {
        "text": "$1.27$ m",
        "correct": false
      },
      {
        "text": "$2.50$ m",
        "correct": false
      },
      {
        "text": "$3.12$ m",
        "correct": false
      }
    ],
    "explanation": "Chiều cao đạt được là $h = 3 \\cdot \\sin 65^\\circ \\approx 3 \\cdot 0.9063 = 2.7189 \\approx 2.72$ m.",
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
    
                const sCanvas = document.getElementById('solveCanvas');
                const sctx = sCanvas.getContext('2d');
                const rngA = document.getElementById('rngSideA');
                const rngB = document.getElementById('rngAngB');

                function updateTri() {
                    const a = parseFloat(rngA.value);
                    const angB = parseFloat(rngB.value);
                    const angC = 90 - angB;

                    document.getElementById('lblSideA').innerText = a;
                    document.getElementById('lblAngB').innerText = angB;
                    document.getElementById('resAngC').innerText = angC;

                    const radB = angB * Math.PI / 180;
                    const b = a * Math.sin(radB);
                    const c = a * Math.cos(radB);
                    const area = 0.5 * b * c;

                    document.getElementById('resSideB').innerText = b.toFixed(2);
                    document.getElementById('resSideC').innerText = c.toFixed(2);
                    document.getElementById('resArea').innerText = area.toFixed(2);

                    sctx.clearRect(0, 0, sCanvas.width, sCanvas.height);
                    const ox = 80;
                    const oy = sCanvas.height - 45;
                    const scale = 14;

                    const bx = ox;
                    const by = oy;
                    const ax = ox + c * scale;
                    const ay = oy;
                    const cx = ax;
                    const cy = oy - b * scale;

                    sctx.beginPath();
                    sctx.moveTo(bx, by);
                    sctx.lineTo(ax, ay);
                    sctx.lineTo(cx, cy);
                    sctx.closePath();
                    sctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
                    sctx.fill();
                    sctx.strokeStyle = '#06b6d4';
                    sctx.lineWidth = 3;
                    sctx.stroke();

                    // Right angle symbol at A
                    sctx.beginPath();
                    sctx.moveTo(ax - 12, ay);
                    sctx.lineTo(ax - 12, ay - 12);
                    sctx.lineTo(ax, ay - 12);
                    sctx.strokeStyle = '#f59e0b';
                    sctx.stroke();

                    // Points labels
                    sctx.fillStyle = '#ffffff';
                    sctx.font = 'bold 14px Inter, sans-serif';
                    sctx.fillText('B (' + angB + '°)', bx - 20, by + 18);
                    sctx.fillText('A (90°)', ax - 10, ay + 20);
                    sctx.fillText('C (' + angC + '°)', cx - 10, cy - 10);

                    // Sides
                    sctx.fillStyle = '#fbbf24';
                    sctx.fillText('a = ' + a + ' cm', (bx + cx) / 2 - 40, (by + cy) / 2 - 10);
                    sctx.fillStyle = '#34d399';
                    sctx.fillText('b = ' + b.toFixed(1) + ' cm', ax + 8, (ay + cy) / 2);
                    sctx.fillStyle = '#a5b4fc';
                    sctx.fillText('c = ' + c.toFixed(1) + ' cm', (bx + ax) / 2 - 20, ay + 18);
                }
                rngA.addEventListener('input', updateTri);
                rngB.addEventListener('input', updateTri);
                updateTri();
                
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const surCanvas = document.getElementById('surveyCanvas');
                const surctx = surCanvas.getContext('2d');
                const rngD = document.getElementById('rngDist');
                const rngE = document.getElementById('rngElev');

                function updateSurvey() {
                    const d = parseFloat(rngD.value);
                    const elev = parseFloat(rngE.value);
                    const h0 = 1.5;

                    document.getElementById('lblDist').innerText = d;
                    document.getElementById('lblElev').innerText = elev;
                    document.getElementById('outElev').innerText = elev;

                    const rad = elev * Math.PI / 180;
                    const h = d * Math.tan(rad);
                    const totalH = h + h0;

                    document.getElementById('outPartH').innerText = h.toFixed(2);
                    document.getElementById('outTotalH').innerText = totalH.toFixed(2);

                    surctx.clearRect(0, 0, surCanvas.width, surCanvas.height);
                    const groundY = surCanvas.height - 40;
                    const towerX = surCanvas.width - 90;
                    const startX = 80;

                    // Ground line
                    surctx.beginPath();
                    surctx.moveTo(20, groundY);
                    surctx.lineTo(surCanvas.width - 20, groundY);
                    surctx.strokeStyle = '#64748b';
                    surctx.lineWidth = 2;
                    surctx.stroke();

                    // Tower
                    const tScale = 3.5;
                    const towerTopY = groundY - totalH * tScale;
                    surctx.fillStyle = '#f59e0b';
                    surctx.fillRect(towerX - 15, towerTopY, 30, totalH * tScale);

                    // Instrument (giac ke)
                    const instTopY = groundY - h0 * tScale;
                    surctx.fillStyle = '#06b6d4';
                    surctx.fillRect(startX - 4, instTopY, 8, h0 * tScale);

                    // Sight line (tính từ đỉnh giác kế đến đỉnh tháp)
                    surctx.beginPath();
                    surctx.setLineDash([4, 4]);
                    surctx.moveTo(startX, instTopY);
                    surctx.lineTo(towerX, instTopY);
                    surctx.lineTo(towerX, towerTopY);
                    surctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
                    surctx.stroke();

                    surctx.beginPath();
                    surctx.setLineDash([]);
                    surctx.moveTo(startX, instTopY);
                    surctx.lineTo(towerX, towerTopY);
                    surctx.strokeStyle = '#ec4899';
                    surctx.lineWidth = 2;
                    surctx.stroke();

                    // Labels
                    surctx.fillStyle = '#ffffff';
                    surctx.font = '12px Inter, sans-serif';
                    surctx.fillText('d = ' + d + ' m', (startX + towerX) / 2 - 20, groundY + 20);
                    surctx.fillText('α = ' + elev + '°', startX + 15, instTopY - 8);
                    surctx.fillStyle = '#fbbf24';
                    surctx.fillText('H = ' + totalH.toFixed(1) + ' m', towerX - 35, towerTopY - 10);
                }
                rngD.addEventListener('input', updateSurvey);
                rngE.addEventListener('input', updateSurvey);
                updateSurvey();
                
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
