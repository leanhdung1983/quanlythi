// ================================================================
// Bài 14: Cung và dây của một đường tròn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai14_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Hiệp Sĩ Đường Tròn 9',
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
    "title": "Câu 1: Dây lớn nhất của đường tròn",
    "question": "Trong các dây của một đường tròn bán kính $R$, dây lớn nhất là:",
    "options": [
      {
        "text": "Bán kính",
        "correct": false
      },
      {
        "text": "Đường kính",
        "correct": true
      },
      {
        "text": "Dây bất kì",
        "correct": false
      },
      {
        "text": "Cung tròn",
        "correct": false
      }
    ],
    "explanation": "Theo định lí SGK, trong các dây của một đường tròn, dây lớn nhất là đường kính (có độ dài $2R$).",
    "pts": 20
  },
  {
    "id": "q2",
    "title": "Câu 2: Quan hệ đường kính và dây vuông góc",
    "question": "Trong một đường tròn, đường kính vuông góc với một dây thì:",
    "options": [
      {
        "text": "Song song với dây ấy",
        "correct": false
      },
      {
        "text": "Đi qua trung điểm của dây ấy",
        "correct": true
      },
      {
        "text": "Bằng một nửa dây ấy",
        "correct": false
      },
      {
        "text": "Gấp đôi dây ấy",
        "correct": false
      }
    ],
    "explanation": "Đường kính vuông góc với một dây thì đi qua trung điểm của dây ấy.",
    "pts": 20
  },
  {
    "id": "q3",
    "title": "Câu 3: Tính khoảng cách từ tâm đến dây",
    "question": "Cho đường tròn $(O; 10\\text{ cm})$ và một dây $AB = 16\\text{ cm}$. Khoảng cách từ tâm $O$ đến dây $AB$ bằng:",
    "options": [
      {
        "text": "$6$ cm",
        "correct": true
      },
      {
        "text": "$8$ cm",
        "correct": false
      },
      {
        "text": "$5$ cm",
        "correct": false
      },
      {
        "text": "$4$ cm",
        "correct": false
      }
    ],
    "explanation": "Gọi $H$ là trung điểm của $AB$, ta có $AH = 8$ cm. Trong tam giác vuông $OHA$: $OH = \\sqrt{R^2 - AH^2} = \\sqrt{10^2 - 8^2} = \\sqrt{36} = 6$ cm.",
    "pts": 20
  },
  {
    "id": "q4",
    "title": "Câu 4: So sánh hai dây qua khoảng cách đến tâm",
    "question": "Cho đường tròn $(O)$ có hai dây $AB$ và $CD$. Biết khoảng cách từ $O$ đến $AB$ lớn hơn khoảng cách từ $O$ đến $CD$. Khẳng định nào đúng?",
    "options": [
      {
        "text": "$AB > CD$",
        "correct": false
      },
      {
        "text": "$AB < CD$",
        "correct": true
      },
      {
        "text": "$AB = CD$",
        "correct": false
      },
      {
        "text": "$AB + CD = 2R$",
        "correct": false
      }
    ],
    "explanation": "Dây nào gần tâm hơn thì dây đó lớn hơn. Do khoảng cách từ $O$ đến $CD$ nhỏ hơn nên $CD > AB$, tức là $AB < CD$.",
    "pts": 20
  },
  {
    "id": "q5",
    "title": "Câu 5: Tính độ dài dây khi biết bán kính và khoảng cách",
    "question": "Đường tròn $(O; 13\\text{ cm})$ có khoảng cách từ tâm $O$ đến dây $MN$ là $5$ cm. Độ dài dây $MN$ là:",
    "options": [
      {
        "text": "$12$ cm",
        "correct": false
      },
      {
        "text": "$24$ cm",
        "correct": true
      },
      {
        "text": "$18$ cm",
        "correct": false
      },
      {
        "text": "$20$ cm",
        "correct": false
      }
    ],
    "explanation": "Nửa dây là $\\sqrt{13^2 - 5^2} = \\sqrt{169 - 25} = 12$ cm. Do đó độ dài dây $MN = 2 \\times 12 = 24$ cm.",
    "pts": 20
  },
  {
    "id": "q6",
    "title": "Câu 6: Đường kính đi qua trung điểm dây",
    "question": "Đường kính đi qua trung điểm của một dây thì vuông góc với dây ấy khi nào?",
    "options": [
      {
        "text": "Với mọi dây bất kì",
        "correct": false
      },
      {
        "text": "Dây đó không đi qua tâm",
        "correct": true
      },
      {
        "text": "Dây đó là đường kính",
        "correct": false
      },
      {
        "text": "Dây đó lớn hơn bán kính",
        "correct": false
      }
    ],
    "explanation": "Định lí nêu rõ: Đường kính đi qua trung điểm của một dây *không đi qua tâm* thì vuông góc với dây ấy.",
    "pts": 20
  },
  {
    "id": "q7",
    "title": "Câu 7: Hai dây bằng nhau trong đường tròn",
    "question": "Trong một đường tròn, hai dây bằng nhau thì:",
    "options": [
      {
        "text": "Vuông góc với nhau",
        "correct": false
      },
      {
        "text": "Song song với nhau",
        "correct": false
      },
      {
        "text": "Cách đều tâm",
        "correct": true
      },
      {
        "text": "Cắt nhau tại tâm",
        "correct": false
      }
    ],
    "explanation": "Định lí: Trong một đường tròn, hai dây bằng nhau thì cách đều tâm.",
    "pts": 20
  },
  {
    "id": "q8",
    "title": "Câu 8: Cho dây bằng bán kính",
    "question": "Cho đường tròn $(O; R)$ có dây $AB = R$. Khoảng cách từ tâm $O$ đến dây $AB$ bằng:",
    "options": [
      {
        "text": "$\\frac{R}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{R\\sqrt{3}}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{R\\sqrt{2}}{2}$",
        "correct": false
      },
      {
        "text": "$R\\sqrt{3}$",
        "correct": false
      }
    ],
    "explanation": "Tam giác $OAB$ có $OA = OB = AB = R$ nên là tam giác đều. Khoảng cách từ $O$ đến $AB$ là chiều cao tam giác đều: $h = \\frac{R\\sqrt{3}}{2}$.",
    "pts": 20
  },
  {
    "id": "q9",
    "title": "Câu 9: Dây AB vuông góc đường kính tại trung điểm bán kính",
    "question": "Đường kính $CD$ vuông góc với dây $AB$ tại trung điểm $I$ của bán kính $OC$. Tam giác $ABC$ là tam giác gì?",
    "options": [
      {
        "text": "Tam giác vuông cân",
        "correct": false
      },
      {
        "text": "Tam giác đều",
        "correct": true
      },
      {
        "text": "Tam giác vuông",
        "correct": false
      },
      {
        "text": "Tam giác cân nhưng không đều",
        "correct": false
      }
    ],
    "explanation": "Vì $CI = IO$ và $CD \\perp AB$ tại $I$ nên $AB$ là đường trung trực của $OC \\implies AC = AO = R$. Tương tự $BC = BO = R$. Lại có $OA = OB = R \\implies AB = R\\sqrt{3}$. Do đó $CA = CB$ và $\\widehat{ACB} = 60^\\circ$, tam giác $ABC$ đều.",
    "pts": 20
  },
  {
    "id": "q10",
    "title": "Câu 10: Độ dài dây lớn nhất có thể vẽ",
    "question": "Trong đường tròn $(O; 6\\text{ cm})$, một dây $CD$ có thể đạt độ dài tối đa là:",
    "options": [
      {
        "text": "$6$ cm",
        "correct": false
      },
      {
        "text": "$12$ cm",
        "correct": true
      },
      {
        "text": "$18$ cm",
        "correct": false
      },
      {
        "text": "$36$ cm",
        "correct": false
      }
    ],
    "explanation": "Dây lớn nhất của đường tròn là đường kính: $2R = 2 \\times 6 = 12$ cm.",
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
    
                const chCanvas = document.getElementById('chordCanvas');
                const chCtx = chCanvas.getContext('2d');
                const rngD = document.getElementById('rngDistD');
                const rngRad = document.getElementById('rngRadius');

                function updateChord() {
                    const d = parseFloat(rngD.value);
                    const R = parseFloat(rngRad.value);
                    document.getElementById('lblDistD').innerText = d.toFixed(1);
                    document.getElementById('lblRadius').innerText = R.toFixed(1);

                    const ah = Math.sqrt(Math.max(0, R*R - d*d));
                    const ab = 2 * ah;

                    document.getElementById('outAH').innerText = ah.toFixed(2);
                    document.getElementById('outABChord').innerText = ab.toFixed(2);

                    chCtx.clearRect(0, 0, chCanvas.width, chCanvas.height);
                    const cx = chCanvas.width / 2;
                    const cy = chCanvas.height / 2;
                    const scale = 24;

                    // Circle
                    chCtx.beginPath();
                    chCtx.arc(cx, cy, R * scale, 0, Math.PI * 2);
                    chCtx.strokeStyle = '#818cf8';
                    chCtx.lineWidth = 2.5;
                    chCtx.stroke();

                    // Center O
                    chCtx.beginPath();
                    chCtx.arc(cx, cy, 4, 0, Math.PI * 2);
                    chCtx.fillStyle = '#ffffff';
                    chCtx.fill();
                    chCtx.fillText('O', cx - 14, cy - 8);

                    // Point H at (cx, cy + d*scale)
                    const hx = cx;
                    const hy = cy + d * scale;
                    const ax = cx - ah * scale;
                    const bx = cx + ah * scale;
                    const ay = hy;
                    const by = hy;

                    // Distance OH
                    chCtx.beginPath();
                    chCtx.moveTo(cx, cy);
                    chCtx.lineTo(hx, hy);
                    chCtx.strokeStyle = '#f59e0b';
                    chCtx.lineWidth = 2;
                    chCtx.stroke();

                    // Chord AB
                    chCtx.beginPath();
                    chCtx.moveTo(ax, ay);
                    chCtx.lineTo(bx, by);
                    chCtx.strokeStyle = '#34d399';
                    chCtx.lineWidth = 3;
                    chCtx.stroke();

                    // Radius OA
                    chCtx.beginPath();
                    chCtx.setLineDash([3, 3]);
                    chCtx.moveTo(cx, cy);
                    chCtx.lineTo(ax, ay);
                    chCtx.strokeStyle = '#ec4899';
                    chCtx.stroke();
                    chCtx.setLineDash([]);

                    // Labels
                    chCtx.fillStyle = '#ffffff';
                    chCtx.fillText('A', ax - 16, ay + 4);
                    chCtx.fillText('B', bx + 6, by + 4);
                    chCtx.fillText('H', hx + 5, hy + 16);
                }
                rngD.addEventListener('input', updateChord);
                rngRad.addEventListener('input', updateChord);
                updateChord();
                
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const pCanvas = document.getElementById('perpCanvas');
                const pCtx = pCanvas.getContext('2d');
                const rngRot = document.getElementById('rngRot');

                function drawPerp() {
                    const rot = parseFloat(rngRot.value);
                    document.getElementById('lblRot').innerText = rot;
                    const rad = rot * Math.PI / 180;

                    pCtx.clearRect(0, 0, pCanvas.width, pCanvas.height);
                    const cx = pCanvas.width / 2;
                    const cy = pCanvas.height / 2;
                    const R = 90;
                    const d = 45; // distance OH

                    // Circle
                    pCtx.beginPath();
                    pCtx.arc(cx, cy, R, 0, Math.PI * 2);
                    pCtx.strokeStyle = '#6366f1';
                    pCtx.lineWidth = 2;
                    pCtx.stroke();

                    // Center O
                    pCtx.beginPath();
                    pCtx.arc(cx, cy, 3, 0, Math.PI * 2);
                    pCtx.fillStyle = '#fff';
                    pCtx.fill();

                    // Diameter perpendicular to chord
                    const pRad = rad + Math.PI / 2;
                    pCtx.beginPath();
                    pCtx.moveTo(cx - R * Math.cos(pRad), cy - R * Math.sin(pRad));
                    pCtx.lineTo(cx + R * Math.cos(pRad), cy + R * Math.sin(pRad));
                    pCtx.strokeStyle = '#f59e0b';
                    pCtx.lineWidth = 2;
                    pCtx.stroke();

                    // Chord AB
                    const half = Math.sqrt(R*R - d*d);
                    const hx = cx + d * Math.cos(pRad);
                    const hy = cy + d * Math.sin(pRad);

                    const ax = hx - half * Math.cos(rad);
                    const ay = hy - half * Math.sin(rad);
                    const bx = hx + half * Math.cos(rad);
                    const by = hy + half * Math.sin(rad);

                    pCtx.beginPath();
                    pCtx.moveTo(ax, ay);
                    pCtx.lineTo(bx, by);
                    pCtx.strokeStyle = '#10b981';
                    pCtx.lineWidth = 3;
                    pCtx.stroke();

                    // Right angle mark at H
                    pCtx.fillStyle = '#ec4899';
                    pCtx.font = '12px Inter, sans-serif';
                    pCtx.fillText('A', ax - 10, ay);
                    pCtx.fillText('B', bx + 6, by);
                    pCtx.fillText('Đường kính CD', cx + R * Math.cos(pRad) - 30, cy + R * Math.sin(pRad) + 15);
                }
                rngRot.addEventListener('input', drawPerp);
                drawPerp();
                
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
