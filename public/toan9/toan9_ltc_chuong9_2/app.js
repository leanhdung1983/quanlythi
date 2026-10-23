// ================================================================
// Luyện Tập Chung: Tứ Giác Nội Tiếp & Đa Giác Đều - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ltc_chuong9_2_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chiến Binh Đa Giác Tròn 9',
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
    "title": "Câu 1: Chứng minh tứ giác nội tiếp đường cao",
    "pts": 20,
    "question": "Tam giác $ABC$ có hai đường cao $BD, CE$ cắt nhau tại $H$. Tứ giác $ADHE$ nội tiếp đường tròn đường kính nào?",
    "options": [
      {
        "text": "Đoạn thẳng $AH$",
        "correct": true
      },
      {
        "text": "Đoạn thẳng $BC$",
        "correct": false
      },
      {
        "text": "Đoạn thẳng $DE$",
        "correct": false
      },
      {
        "text": "Đoạn thẳng $AB$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\widehat{AEH} = 90^\\circ$ và $\\widehat{ADH} = 90^\\circ$. Tổng hai góc đối bằng $180^\\circ$ nên $ADHE$ nội tiếp đường tròn đường kính $AH$."
  },
  {
    "id": 2,
    "title": "Câu 2: Diện tích lục giác đều",
    "pts": 20,
    "question": "Diện tích của một lục giác đều cạnh $a$ được tính theo công thức nào?",
    "options": [
      {
        "text": "$S = \\frac{3\\sqrt{3}}{2}a^2$",
        "correct": true
      },
      {
        "text": "$S = 6a^2$",
        "correct": false
      },
      {
        "text": "$S = \\frac{3\\sqrt{3}}{4}a^2$",
        "correct": false
      },
      {
        "text": "$S = 3\\sqrt{3}a^2$",
        "correct": false
      }
    ],
    "explanation": "Lục giác đều gồm 6 tam giác đều cạnh $a$. Diện tích mỗi tam giác là $\\frac{a^2\\sqrt{3}}{4}$. Do đó $S = 6 \\times \\frac{a^2\\sqrt{3}}{4} = \\frac{3\\sqrt{3}}{2}a^2$."
  },
  {
    "id": 3,
    "title": "Câu 3: Đa giác đều lát sàn",
    "pts": 20,
    "question": "Vì sao ngũ giác đều (góc $108^\\circ$) KHÔNG THỂ lát kín khít mặt sàn phẳng?",
    "options": [
      {
        "text": "Vì $360^\\circ$ không chia hết cho $108^\\circ$",
        "correct": true
      },
      {
        "text": "Vì ngũ giác đều có 5 cạnh lẻ",
        "correct": false
      },
      {
        "text": "Vì ngũ giác đều không có đường tròn ngoại tiếp",
        "correct": false
      },
      {
        "text": "Vì ngũ giác đều có góc tù",
        "correct": false
      }
    ],
    "explanation": "Muốn lát khít mặt sàn thì tổng các góc tại đỉnh chung phải bằng $360^\\circ$. Nhưng $360^\\circ : 108^\\circ = 3,33$ (không chia hết) nên sẽ bị hở khe."
  },
  {
    "id": 4,
    "title": "Câu 4: Tứ giác có 4 đỉnh trên đường tròn",
    "pts": 20,
    "question": "Cho tứ giác $ABCD$ nội tiếp có $\\widehat{B} = 80^\\circ$. Số đo góc ngoài tại đỉnh $D$ bằng:",
    "options": [
      {
        "text": "$80^\\circ$",
        "correct": true
      },
      {
        "text": "$100^\\circ$",
        "correct": false
      },
      {
        "text": "$160^\\circ$",
        "correct": false
      },
      {
        "text": "$40^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Trong tứ giác nội tiếp, góc ngoài tại một đỉnh luôn bằng góc trong tại đỉnh đối diện: $\\widehat{D}_{\\text{ngoài}} = \\widehat{B} = 80^\\circ$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tính diện tích lục giác đều cạnh 4 cm",
    "pts": 20,
    "question": "Diện tích của một lục giác đều có cạnh bằng 4 cm là:",
    "options": [
      {
        "text": "$24\\sqrt{3}$ cm²",
        "correct": true
      },
      {
        "text": "$16\\sqrt{3}$ cm²",
        "correct": false
      },
      {
        "text": "$48$ cm²",
        "correct": false
      },
      {
        "text": "$12\\sqrt{3}$ cm²",
        "correct": false
      }
    ],
    "explanation": "$S = \\frac{3\\sqrt{3}}{2} \\times 4^2 = \\frac{3\\sqrt{3}}{2} \\times 16 = 24\\sqrt{3}$ cm²."
  },
  {
    "id": 6,
    "title": "Câu 6: Đường chéo tứ giác nội tiếp vuông góc",
    "pts": 20,
    "question": "Tứ giác $ABCD$ nội tiếp đường tròn $(O)$ có hai đường chéo vuông góc tại $I$. Khẳng định nào sau đây là ĐÚNG?",
    "options": [
      {
        "text": "$IA \\cdot IC = IB \\cdot ID$",
        "correct": true
      },
      {
        "text": "$IA + IC = IB + ID$",
        "correct": false
      },
      {
        "text": "$IA \\cdot IB = IC \\cdot ID$",
        "correct": false
      },
      {
        "text": "$AB = CD$",
        "correct": false
      }
    ],
    "explanation": "Do hai tam giác $\\Delta IAB \\sim \\Delta IDC$ (hai góc nội tiếp cùng chắn một cung) nên $\\frac{IA}{ID} = \\frac{IB}{IC} \\iff IA \\cdot IC = IB \\cdot ID$."
  },
  {
    "id": 7,
    "title": "Câu 7: Tỉ số giữa diện tích và chu vi đa giác đều",
    "pts": 20,
    "question": "Tỉ số $\\frac{S}{C}$ giữa diện tích $S$ và chu vi $C$ của một đa giác đều bằng:",
    "options": [
      {
        "text": "$\\frac{r}{2}$ (với $r$ là bán kính nội tiếp)",
        "correct": true
      },
      {
        "text": "$r$",
        "correct": false
      },
      {
        "text": "$\\frac{R}{2}$",
        "correct": false
      },
      {
        "text": "$2r$",
        "correct": false
      }
    ],
    "explanation": "Ta có $S = \\frac{1}{2} C \\cdot r \\implies \\frac{S}{C} = \\frac{r}{2}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Bát giác đều nội tiếp",
    "pts": 20,
    "question": "Số tam giác tạo thành từ tâm $O$ và các đỉnh của một bát giác đều ($n = 8$) là:",
    "options": [
      {
        "text": "8 tam giác cân bằng nhau",
        "correct": true
      },
      {
        "text": "6 tam giác",
        "correct": false
      },
      {
        "text": "4 tam giác",
        "correct": false
      },
      {
        "text": "16 tam giác",
        "correct": false
      }
    ],
    "explanation": "Nối tâm $O$ với 8 đỉnh ta được đúng 8 tam giác cân bằng nhau có góc ở đỉnh là $45^\\circ$."
  },
  {
    "id": 9,
    "title": "Câu 9: Góc tạo bởi hai đường chéo hình vuông",
    "pts": 20,
    "question": "Góc ở tâm của hình vuông nội tiếp đường tròn $(O)$ bằng:",
    "options": [
      {
        "text": "$90^\\circ$",
        "correct": true
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$45^\\circ$",
        "correct": false
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      }
    ],
    "explanation": "$\\beta = \\frac{360^\\circ}{4} = 90^\\circ$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tứ giác nội tiếp đường tròn đường kính",
    "pts": 20,
    "question": "Hình chữ nhật có độ dài 2 cạnh là 6 cm và 8 cm thì bán kính đường tròn ngoại tiếp của nó bằng:",
    "options": [
      {
        "text": "5 cm",
        "correct": true
      },
      {
        "text": "10 cm",
        "correct": false
      },
      {
        "text": "7 cm",
        "correct": false
      },
      {
        "text": "4 cm",
        "correct": false
      }
    ],
    "explanation": "Đường chéo hình chữ nhật là đường kính $d = \\sqrt{6^2 + 8^2} = 10$ cm $\\implies R = \\frac{10}{2} = 5$ cm."
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
                const out1 = document.getElementById('lab1Output');

                const A = { x: 300, y: 50 };
                const B = { x: 160, y: 260 };
                const C = { x: 440, y: 260 };

                function project(P, S, E) {
                    const dx = E.x - S.x;
                    const dy = E.y - S.y;
                    const t = ((P.x - S.x) * dx + (P.y - S.y) * dy) / (dx * dx + dy * dy);
                    return { x: S.x + t * dx, y: S.y + t * dy };
                }

                function drawAltitudes() {
                    const cw = c1.width;
                    const ch = c1.height;
                    ctx.clearRect(0, 0, cw, ch);

                    // Altitudes feet
                    const D = project(B, A, C); // BD perp AC
                    const E = project(C, A, B); // CE perp AB

                    // Triangle ABC
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y);
                    ctx.closePath(); ctx.stroke();

                    // Altitudes
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(B.x, B.y); ctx.lineTo(D.x, D.y); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(C.x, C.y); ctx.lineTo(E.x, E.y); ctx.stroke();

                    // Circle diameter BC
                    const midBC = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };
                    const rBC = Math.hypot(B.x - C.x, B.y - C.y) / 2;

                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(midBC.x, midBC.y, rBC, 0, Math.PI * 2); ctx.stroke();

                    // Points
                    const pts = [
                        { name: 'A', p: A, c: '#ffffff' },
                        { name: 'B', p: B, c: '#38bdf8' },
                        { name: 'C', p: C, c: '#38bdf8' },
                        { name: 'D (90°)', p: D, c: '#10b981' },
                        { name: 'E (90°)', p: E, c: '#10b981' }
                    ];

                    pts.forEach(it => {
                        ctx.fillStyle = it.c;
                        ctx.beginPath(); ctx.arc(it.p.x, it.p.y, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 13px sans-serif';
                        ctx.fillText(it.name, it.p.x - 10, it.p.y - 10);
                    });

                    out1.innerHTML = `Vì $\\widehat{BEC} = \\widehat{BDC} = 90^\\circ$ nên hai đỉnh $E$ và $D$ cùng nhìn đoạn $BC$ dưới góc $90^\\circ$ &rArr; Bốn điểm $B, C, D, E$ cùng thuộc đường tròn đường kính $BC$ (tâm là trung điểm $BC$).`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                drawAltitudes();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const inN = document.getElementById('inPolyN');
                const inR = document.getElementById('inPolyR');
                const btn = document.getElementById('btnCalcPoly');
                const out2 = document.getElementById('lab2Output');

                function calculateRegularPolygon() {
                    const n = Math.max(3, parseInt(inN.value) || 3);
                    const R = Math.max(1, parseFloat(inR.value) || 1);

                    const angleCenter = (2 * Math.PI) / n;
                    const a = 2 * R * Math.sin(Math.PI / n);
                    const r = R * Math.cos(Math.PI / n);
                    const perimeter = n * a;
                    const area = 0.5 * perimeter * r;

                    const cw = c2.width;
                    const ch = c2.height;
                    const ox = 160;
                    const oy = ch / 2;
                    const scaleR = 100;

                    ctx2.clearRect(0, 0, cw, ch);

                    // Draw Polygon
                    ctx2.strokeStyle = '#38bdf8';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath();
                    for (let i = 0; i < n; i++) {
                        const ang = -Math.PI / 2 + i * angleCenter;
                        const px = ox + scaleR * Math.cos(ang);
                        const py = oy + scaleR * Math.sin(ang);
                        if (i === 0) ctx2.moveTo(px, py);
                        else ctx2.lineTo(px, py);
                    }
                    ctx2.closePath();
                    ctx2.stroke();
                    ctx2.fillStyle = 'rgba(56, 189, 248, 0.15)';
                    ctx2.fill();

                    // Stats on right
                    const tx = 310;
                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 14px sans-serif';
                    ctx2.fillText(`KẾT QUẢ ĐA GIÁC ĐỀU ${n} CẠNH:`, tx, 50);

                    ctx2.font = '13px sans-serif';
                    ctx2.fillStyle = '#cbd5e1';
                    ctx2.fillText(`• Bán kính ngoại tiếp: R = ${R} cm`, tx, 85);
                    ctx2.fillStyle = '#38bdf8';
                    ctx2.fillText(`• Độ dài mỗi cạnh: a ≈ ${a.toFixed(2)} cm`, tx, 115);
                    ctx2.fillStyle = '#ec4899';
                    ctx2.fillText(`• Bán kính nội tiếp: r ≈ ${r.toFixed(2)} cm`, tx, 145);
                    ctx2.fillStyle = '#fbbf24';
                    ctx2.fillText(`• Chu vi: C = n·a ≈ ${perimeter.toFixed(2)} cm`, tx, 175);
                    ctx2.fillStyle = '#4ade80';
                    ctx2.fillText(`• Diện tích: S = p·r ≈ ${area.toFixed(2)} cm²`, tx, 205);

                    out2.innerHTML = `<strong>Đa giác đều $n = ${n}$:</strong> Cạnh $a = 2R\\sin\\frac{180^\\circ}{n} \\approx ${a.toFixed(2)}\\text{ cm}$ | <strong>Chu vi:</strong> $C \\approx ${perimeter.toFixed(2)}\\text{ cm}$ | <strong>Diện tích:</strong> $S \\approx ${area.toFixed(2)}\\text{ cm²}$.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                btn.addEventListener('click', calculateRegularPolygon);
                [inN, inR].forEach(el => el.addEventListener('input', calculateRegularPolygon));
                calculateRegularPolygon();
            
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
