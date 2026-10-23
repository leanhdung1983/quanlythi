// ================================================================
// Bài 30: Đa Giác Đều - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai30_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Kiến Trúc Sư Đa Giác Đều 9',
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
    "title": "Câu 1: Góc của lục giác đều",
    "pts": 20,
    "question": "Số đo mỗi góc của một lục giác đều ($n = 6$) là:",
    "options": [
      {
        "text": "$120^\\circ$",
        "correct": true
      },
      {
        "text": "$108^\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$135^\\circ$",
        "correct": false
      }
    ],
    "explanation": "$\\alpha = \\frac{(6 - 2) \\cdot 180^\\circ}{6} = \\frac{4 \\cdot 180^\\circ}{6} = 120^\\circ$."
  },
  {
    "id": 2,
    "title": "Câu 2: Góc của ngũ giác đều",
    "pts": 20,
    "question": "Số đo mỗi góc của một ngũ giác đều ($n = 5$) là:",
    "options": [
      {
        "text": "$108^\\circ$",
        "correct": true
      },
      {
        "text": "$120^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      },
      {
        "text": "$72^\\circ$",
        "correct": false
      }
    ],
    "explanation": "$\\alpha = \\frac{(5 - 2) \\cdot 180^\\circ}{5} = \\frac{3 \\cdot 180^\\circ}{5} = 108^\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Góc ở tâm của bát giác đều",
    "pts": 20,
    "question": "Góc ở tâm của một bát giác đều ($n = 8$) có số đo bằng:",
    "options": [
      {
        "text": "$45^\\circ$",
        "correct": true
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$36^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Góc ở tâm $\\beta = \\frac{360^\\circ}{n} = \\frac{360^\\circ}{8} = 45^\\circ$."
  },
  {
    "id": 4,
    "title": "Câu 4: Cạnh của lục giác đều theo R",
    "pts": 20,
    "question": "Lục giác đều nội tiếp đường tròn bán kính $R = 5$ cm. Độ dài mỗi cạnh của lục giác đều đó là:",
    "options": [
      {
        "text": "5 cm",
        "correct": true
      },
      {
        "text": "$5\\sqrt{3}$ cm",
        "correct": false
      },
      {
        "text": "10 cm",
        "correct": false
      },
      {
        "text": "$2,5$ cm",
        "correct": false
      }
    ],
    "explanation": "Đặc điểm cơ bản của lục giác đều: độ dài cạnh $a$ luôn đúng bằng bán kính đường tròn ngoại tiếp $R = 5$ cm."
  },
  {
    "id": 5,
    "title": "Câu 5: Tâm của đa giác đều",
    "pts": 20,
    "question": "Tâm của đa giác đều là:",
    "options": [
      {
        "text": "Tâm chung của đường tròn ngoại tiếp và nội tiếp",
        "correct": true
      },
      {
        "text": "Chỉ là tâm đường tròn ngoại tiếp",
        "correct": false
      },
      {
        "text": "Một đỉnh bất kì",
        "correct": false
      },
      {
        "text": "Trung điểm một cạnh",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa: Tâm đường tròn ngoại tiếp và nội tiếp của một đa giác đều trùng nhau và được gọi là tâm của đa giác đều."
  },
  {
    "id": 6,
    "title": "Câu 6: Chu vi lục giác đều",
    "pts": 20,
    "question": "Một lục giác đều nội tiếp đường tròn $(O; 4\\text{ cm})$. Chu vi của lục giác đều đó là:",
    "options": [
      {
        "text": "24 cm",
        "correct": true
      },
      {
        "text": "16 cm",
        "correct": false
      },
      {
        "text": "20 cm",
        "correct": false
      },
      {
        "text": "12 cm",
        "correct": false
      }
    ],
    "explanation": "Cạnh $a = R = 4$ cm. Lục giác đều có 6 cạnh nên chu vi $C = 6 \\times 4 = 24$ cm."
  },
  {
    "id": 7,
    "title": "Câu 7: Đa giác đều có góc bằng 135 độ",
    "pts": 20,
    "question": "Đa giác đều có số đo mỗi góc bằng $135^\\circ$ là đa giác đều có bao nhiêu cạnh?",
    "options": [
      {
        "text": "8 cạnh (bát giác đều)",
        "correct": true
      },
      {
        "text": "10 cạnh",
        "correct": false
      },
      {
        "text": "6 cạnh",
        "correct": false
      },
      {
        "text": "12 cạnh",
        "correct": false
      }
    ],
    "explanation": "$\\frac{(n - 2) \\cdot 180^\\circ}{n} = 135^\\circ \\iff 180n - 360 = 135n \\iff 45n = 360 \\iff n = 8$."
  },
  {
    "id": 8,
    "title": "Câu 8: Cạnh hình vuông nội tiếp đường tròn",
    "pts": 20,
    "question": "Hình vuông nội tiếp đường tròn $(O; R)$ có độ dài cạnh $a$ bằng:",
    "options": [
      {
        "text": "$R\\sqrt{2}$",
        "correct": true
      },
      {
        "text": "$R$",
        "correct": false
      },
      {
        "text": "$2R$",
        "correct": false
      },
      {
        "text": "$R\\sqrt{3}$",
        "correct": false
      }
    ],
    "explanation": "Đường chéo hình vuông là đường kính $d = 2R$. Ta có $a\\sqrt{2} = 2R \\implies a = \\frac{2R}{\\sqrt{2}} = R\\sqrt{2}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bán kính nội tiếp hình vuông",
    "pts": 20,
    "question": "Hình vuông có cạnh bằng $a$. Bán kính đường tròn nội tiếp $r$ bằng:",
    "options": [
      {
        "text": "$\\frac{a}{2}$",
        "correct": true
      },
      {
        "text": "$a$",
        "correct": false
      },
      {
        "text": "$\\frac{a\\sqrt{2}}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{a}{4}$",
        "correct": false
      }
    ],
    "explanation": "Đường tròn nội tiếp hình vuông tiếp xúc với 4 cạnh, đường kính bằng độ dài cạnh: $2r = a \\implies r = \\frac{a}{2}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tổng số đo các góc của bát giác đều",
    "pts": 20,
    "question": "Tổng số đo các góc của một bát giác đều ($n = 8$) là:",
    "options": [
      {
        "text": "$1080^\\circ$",
        "correct": true
      },
      {
        "text": "$720^\\circ$",
        "correct": false
      },
      {
        "text": "$900^\\circ$",
        "correct": false
      },
      {
        "text": "$1440^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Tổng số đo các góc $= (n - 2) \\times 180^\\circ = (8 - 2) \\times 180^\\circ = 6 \\times 180^\\circ = 1080^\\circ$."
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
                const slN = document.getElementById('slPolyN');
                const vN = document.getElementById('vPolyN');
                const btnIn = document.getElementById('btnToggleIn');
                const out1 = document.getElementById('lab1Output');

                let showIncircle = true;
                const names = {
                    3: 'Tam giác đều', 4: 'Hình vuông', 5: 'Ngũ giác đều', 6: 'Lục giác đều',
                    7: 'Thất giác đều', 8: 'Bát giác đều', 9: 'Cửu giác đều', 10: 'Thập giác đều',
                    11: 'Thập nhất giác', 12: 'Thập nhị giác'
                };

                btnIn.addEventListener('click', () => {
                    showIncircle = !showIncircle;
                    drawPoly();
                });

                function drawPoly() {
                    const n = parseInt(slN.value);
                    vN.textContent = `n = ${n} (${names[n] || ''})`;

                    const cw = c1.width;
                    const ch = c1.height;
                    const ox = 180;
                    const oy = ch / 2;
                    const R = 110;
                    const r = R * Math.cos(Math.PI / n);
                    const angleStep = (Math.PI * 2) / n;

                    ctx.clearRect(0, 0, cw, ch);

                    // Circumcircle (O; R)
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.arc(ox, oy, R, 0, Math.PI * 2); ctx.stroke();

                    // Incircle (O; r)
                    if (showIncircle) {
                        ctx.strokeStyle = '#ec4899';
                        ctx.lineWidth = 1.5;
                        ctx.beginPath(); ctx.arc(ox, oy, r, 0, Math.PI * 2); ctx.stroke();
                    }

                    // Polygon vertices
                    const vertices = [];
                    for (let i = 0; i < n; i++) {
                        const ang = -Math.PI / 2 + i * angleStep;
                        vertices.push({ x: ox + R * Math.cos(ang), y: oy + R * Math.sin(ang) });
                    }

                    // Draw Polygon
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    vertices.forEach((pt, i) => {
                        if (i === 0) ctx.moveTo(pt.x, pt.y);
                        else ctx.lineTo(pt.x, pt.y);
                    });
                    ctx.closePath();
                    ctx.stroke();

                    ctx.fillStyle = 'rgba(56, 189, 248, 0.12)';
                    ctx.fill();

                    // Center O and lines to vertices
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI * 2); ctx.fill();

                    ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
                    ctx.setLineDash([3, 3]);
                    vertices.forEach(pt => {
                        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(pt.x, pt.y); ctx.stroke();
                    });
                    ctx.setLineDash([]);

                    // Vertices dots
                    vertices.forEach((pt, i) => {
                        ctx.fillStyle = '#38bdf8';
                        ctx.beginPath(); ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2); ctx.fill();
                    });

                    // Stats table on right
                    const tx = 330;
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px sans-serif';
                    ctx.fillText(`THÔNG SỐ ${names[n].toUpperCase()}:`, tx, 50);

                    const eachAngle = ((n - 2) * 180) / n;
                    const centerAngle = 360 / n;
                    const sideA = 2 * R * Math.sin(Math.PI / n);

                    ctx.font = '13px sans-serif';
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillText(`• Số cạnh: n = ${n}`, tx, 85);
                    ctx.fillStyle = '#34d399';
                    ctx.fillText(`• Số đo mỗi góc: α = ${eachAngle.toFixed(1)}°`, tx, 115);
                    ctx.fillStyle = '#fbbf24';
                    ctx.fillText(`• Góc ở tâm: β = ${centerAngle.toFixed(1)}°`, tx, 145);
                    ctx.fillStyle = '#f43f5e';
                    ctx.fillText(`• Bán kính ngoại tiếp R = 110 px`, tx, 175);
                    ctx.fillStyle = '#ec4899';
                    ctx.fillText(`• Bán kính nội tiếp r = ${r.toFixed(1)} px`, tx, 205);

                    out1.innerHTML = `<strong>Công thức:</strong> Mỗi góc $\\alpha = \\frac{(${n}-2) \\cdot 180^\\circ}{${n}} = ${eachAngle.toFixed(1)}^\\circ$ | <strong>Góc ở tâm:</strong> $\\beta = \\frac{360^\\circ}{${n}} = ${centerAngle.toFixed(1)}^\\circ$.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slN.addEventListener('input', drawPoly);
                drawPoly();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const btnAnim = document.getElementById('btnFlowerAnim');
                const out2 = document.getElementById('lab2Output');

                let rot = 0;
                let animating = false;

                function drawFlower() {
                    const cw = c2.width;
                    const ch = c2.height;
                    const ox = cw / 2;
                    const oy = ch / 2;
                    const R = 85;

                    ctx2.clearRect(0, 0, cw, ch);

                    // Central circle
                    ctx2.strokeStyle = '#38bdf8';
                    ctx2.lineWidth = 2;
                    ctx2.beginPath(); ctx2.arc(ox, oy, R, 0, Math.PI * 2); ctx2.stroke();

                    // 6 overlapping circles
                    for (let i = 0; i < 6; i++) {
                        const ang = rot + (i * Math.PI) / 3;
                        const vx = ox + R * Math.cos(ang);
                        const vy = oy + R * Math.sin(ang);

                        ctx2.strokeStyle = 'rgba(236, 72, 153, 0.6)';
                        ctx2.lineWidth = 1.5;
                        ctx2.beginPath();
                        ctx2.arc(vx, vy, R, 0, Math.PI * 2);
                        ctx2.stroke();

                        // Hexagon edge
                        const nextAng = rot + ((i + 1) * Math.PI) / 3;
                        const nvx = ox + R * Math.cos(nextAng);
                        const nvy = oy + R * Math.sin(nextAng);

                        ctx2.strokeStyle = '#f59e0b';
                        ctx2.lineWidth = 2.5;
                        ctx2.beginPath(); ctx2.moveTo(vx, vy); ctx2.lineTo(nvx, nvy); ctx2.stroke();

                        ctx2.fillStyle = '#38bdf8';
                        ctx2.beginPath(); ctx2.arc(vx, vy, 5, 0, Math.PI * 2); ctx2.fill();
                    }

                    out2.innerHTML = `Trong lục giác đều, cạnh $a = R$. Bằng cách giữ nguyên khẩu độ compa bằng $R$, 6 cung tròn giao nhau tạo thành hoa văn cánh hoa 6 cánh đối xứng tuyệt đối.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                function step() {
                    if (!animating) return;
                    rot += 0.01;
                    drawFlower();
                    requestAnimationFrame(step);
                }

                btnAnim.addEventListener('click', () => {
                    animating = !animating;
                    if (animating) step();
                });

                drawFlower();
            
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
