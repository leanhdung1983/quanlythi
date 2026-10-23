// ================================================================
// Bài 17: Vị trí tương đối của hai đường tròn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai17_state';

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
    "title": "Câu 1: Hai đường tròn cắt nhau",
    "question": "Cho hai đường tròn $(O; R)$ và $(O'; r)$ với $R > r$. Điều kiện để hai đường tròn cắt nhau là:",
    "options": [
      {
        "text": "$d > R + r$",
        "correct": false
      },
      {
        "text": "$R - r < d < R + r$",
        "correct": true
      },
      {
        "text": "$d = R + r$",
        "correct": false
      },
      {
        "text": "$d < R - r$",
        "correct": false
      }
    ],
    "explanation": "Hai đường tròn cắt nhau khi và chỉ khi khoảng cách giữa hai tâm thỏa mãn bất đẳng thức tam giác: $R - r < d < R + r$.",
    "pts": 20
  },
  {
    "id": "q2",
    "title": "Câu 2: Tiếp xúc ngoài giữa hai đường tròn",
    "question": "Cho hai đường tròn $(O; 4\\text{ cm})$ và $(O'; 3\\text{ cm})$ có khoảng cách giữa hai tâm $OO' = 7\\text{ cm}$. Hai đường tròn này có vị trí tương đối là:",
    "options": [
      {
        "text": "Cắt nhau",
        "correct": false
      },
      {
        "text": "Tiếp xúc ngoài",
        "correct": true
      },
      {
        "text": "Tiếp xúc trong",
        "correct": false
      },
      {
        "text": "Ở ngoài nhau",
        "correct": false
      }
    ],
    "explanation": "Ta có $d = 7\\text{ cm} = R + r = 4 + 3$, nên hai đường tròn tiếp xúc ngoài.",
    "pts": 20
  },
  {
    "id": "q3",
    "title": "Câu 3: Tiếp xúc trong giữa hai đường tròn",
    "question": "Cho hai đường tròn $(O; 8\\text{ cm})$ và $(O'; 3\\text{ cm})$. Chúng tiếp xúc trong khi khoảng cách $OO'$ bằng:",
    "options": [
      {
        "text": "$11$ cm",
        "correct": false
      },
      {
        "text": "$5$ cm",
        "correct": true
      },
      {
        "text": "$8$ cm",
        "correct": false
      },
      {
        "text": "$3$ cm",
        "correct": false
      }
    ],
    "explanation": "Tiếp xúc trong khi $d = R - r = 8 - 3 = 5$ cm.",
    "pts": 20
  },
  {
    "id": "q4",
    "title": "Câu 4: Số điểm chung của hai đường tròn tiếp xúc",
    "question": "Hai đường tròn tiếp xúc nhau có bao nhiêu điểm chung?",
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
        "text": "Vô số",
        "correct": false
      }
    ],
    "explanation": "Dù tiếp xúc trong hay tiếp xúc ngoài, hai đường tròn chỉ có đúng $1$ điểm chung duy nhất gọi là tiếp điểm.",
    "pts": 20
  },
  {
    "id": "q5",
    "title": "Câu 5: Số tiếp tuyến chung của hai đường tròn ở ngoài nhau",
    "question": "Hai đường tròn ở ngoài nhau có bao nhiêu tiếp tuyến chung?",
    "options": [
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$4$",
        "correct": true
      }
    ],
    "explanation": "Hai đường tròn ở ngoài nhau có 4 tiếp tuyến chung gồm 2 tiếp tuyến chung ngoài và 2 tiếp tuyến chung trong.",
    "pts": 20
  },
  {
    "id": "q6",
    "title": "Câu 6: Tính chất đoạn nối tâm khi hai đường tròn cắt nhau",
    "question": "Nếu hai đường tròn cắt nhau tại $A$ và $B$ thì đoạn nối tâm $OO'$ là:",
    "options": [
      {
        "text": "Đường song song với $AB$",
        "correct": false
      },
      {
        "text": "Đường trung trực của dây chung $AB$",
        "correct": true
      },
      {
        "text": "Đường phân giác góc $\\widehat{AOB}$",
        "correct": false
      },
      {
        "text": "Tiếp tuyến của cả hai đường tròn",
        "correct": false
      }
    ],
    "explanation": "Vì $OA = OB = R$ và $O'A = O'B = r$ nên $O$ và $O'$ đều nằm trên đường trung trực của đoạn $AB$. Vậy $OO'$ là đường trung trực của dây chung $AB$.",
    "pts": 20
  },
  {
    "id": "q7",
    "title": "Câu 7: Hai đường tròn đựng nhau",
    "question": "Cho hai đường tròn $(O; 6\\text{ cm})$ và $(O'; 2\\text{ cm})$ có $OO' = 3\\text{ cm}$. Khẳng định nào đúng?",
    "options": [
      {
        "text": "Hai đường tròn cắt nhau",
        "correct": false
      },
      {
        "text": "Đường tròn lớn đựng đường tròn nhỏ",
        "correct": true
      },
      {
        "text": "Hai đường tròn tiếp xúc trong",
        "correct": false
      },
      {
        "text": "Hai đường tròn ngoài nhau",
        "correct": false
      }
    ],
    "explanation": "Vì $d = 3 < R - r = 6 - 2 = 4$ nên đường tròn lớn đựng đường tròn nhỏ.",
    "pts": 20
  },
  {
    "id": "q8",
    "title": "Câu 8: Hai đường tròn đồng tâm",
    "question": "Hai đường tròn đồng tâm là hai đường tròn có:",
    "options": [
      {
        "text": "Bán kính bằng nhau",
        "correct": false
      },
      {
        "text": "Khoảng cách giữa hai tâm bằng 0",
        "correct": true
      },
      {
        "text": "Một điểm chung",
        "correct": false
      },
      {
        "text": "Hai điểm chung",
        "correct": false
      }
    ],
    "explanation": "Đồng tâm nghĩa là hai đường tròn có cùng một tâm ($O \\equiv O' \\implies d = 0$).",
    "pts": 20
  },
  {
    "id": "q9",
    "title": "Câu 9: Số tiếp tuyến chung khi tiếp xúc ngoài",
    "question": "Số tiếp tuyến chung của hai đường tròn tiếp xúc ngoài là:",
    "options": [
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$3$",
        "correct": true
      },
      {
        "text": "$4$",
        "correct": false
      }
    ],
    "explanation": "Khi tiếp xúc ngoài, có 2 tiếp tuyến chung ngoài và 1 tiếp tuyến chung trong đi qua tiếp điểm, tổng cộng là 3 tiếp tuyến chung.",
    "pts": 20
  },
  {
    "id": "q10",
    "title": "Câu 10: Tính độ dài dây chung của hai đường tròn bằng nhau",
    "question": "Hai đường tròn bằng nhau có bán kính $R = 5$ cm cắt nhau sao cho tâm của đường tròn này nằm trên đường tròn kia. Độ dài dây chung $AB$ là:",
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
        "text": "$10$ cm",
        "correct": false
      }
    ],
    "explanation": "Vì $O'$ thuộc $(O)$ nên $OO' = R = 5$ cm. Khoảng cách từ mỗi tâm đến dây chung là $\\frac{R}{2} = 2.5$ cm. Nửa dây chung là $\\sqrt{R^2 - (R/2)^2} = \\frac{R\\sqrt{3}}{2}$. Độ dài dây chung là $AB = R\\sqrt{3} = 5\\sqrt{3}$ cm.",
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
    
                const tcCanvas = document.getElementById('twoCircCanvas');
                const tcCtx = tcCanvas.getContext('2d');
                const rngD = document.getElementById('rngDistOO');

                function updateTwo() {
                    const d = parseFloat(rngD.value);
                    const R = 5;
                    const r = 3;
                    document.getElementById('lblDistOO').innerText = d.toFixed(1);
                    document.getElementById('outValD').innerText = d.toFixed(1);

                    const st = document.getElementById('outTwoStatus');
                    if (d === 0) {
                        st.innerText = 'Hai đường tròn đồng tâm (d = 0)';
                        st.style.background = '#8b5cf6';
                    } else if (d < R - r) {
                        st.innerText = 'Đường tròn lớn đựng đường tròn nhỏ (d < R - r)';
                        st.style.background = '#6366f1';
                    } else if (Math.abs(d - (R - r)) < 0.1) {
                        st.innerText = 'Tiếp xúc trong tại 1 điểm (d = R - r)';
                        st.style.background = '#f59e0b';
                    } else if (d > R - r && d < R + r) {
                        st.innerText = 'Hai đường tròn cắt nhau tại 2 điểm (R - r < d < R + r)';
                        st.style.background = '#10b981';
                    } else if (Math.abs(d - (R + r)) < 0.1) {
                        st.innerText = 'Tiếp xúc ngoài tại 1 điểm (d = R + r)';
                        st.style.background = '#f59e0b';
                    } else {
                        st.innerText = 'Hai đường tròn ở ngoài nhau (d > R + r)';
                        st.style.background = '#ef4444';
                    }

                    tcCtx.clearRect(0, 0, tcCanvas.width, tcCanvas.height);
                    const ox = 90;
                    const oy = tcCanvas.height / 2;
                    const scale = 18;

                    // Circle (O; R)
                    tcCtx.beginPath();
                    tcCtx.arc(ox, oy, R * scale, 0, Math.PI * 2);
                    tcCtx.strokeStyle = '#6366f1';
                    tcCtx.lineWidth = 2.5;
                    tcCtx.stroke();

                    // Circle (O'; r)
                    const o2x = ox + d * scale;
                    const o2y = oy;
                    tcCtx.beginPath();
                    tcCtx.arc(o2x, o2y, r * scale, 0, Math.PI * 2);
                    tcCtx.strokeStyle = '#06b6d4';
                    tcCtx.lineWidth = 2.5;
                    tcCtx.stroke();

                    // Line OO'
                    tcCtx.beginPath();
                    tcCtx.moveTo(ox, oy);
                    tcCtx.lineTo(o2x, o2y);
                    tcCtx.strokeStyle = '#f59e0b';
                    tcCtx.lineWidth = 2;
                    tcCtx.stroke();

                    // Points O and O'
                    tcCtx.fillStyle = '#fff';
                    tcCtx.beginPath();
                    tcCtx.arc(ox, oy, 4, 0, Math.PI * 2);
                    tcCtx.fill();
                    tcCtx.fillText('O', ox - 14, oy - 8);

                    tcCtx.beginPath();
                    tcCtx.arc(o2x, o2y, 4, 0, Math.PI * 2);
                    tcCtx.fill();
                    tcCtx.fillText("O'", o2x + 6, o2y - 8);
                }
                rngD.addEventListener('input', updateTwo);
                updateTwo();
                
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2Canvas = document.getElementById('chordTwoCanvas');
                const c2Ctx = c2Canvas.getContext('2d');
                const rngDC = document.getElementById('rngDChord');

                function updateChordTwo() {
                    const d = parseFloat(rngDC.value);
                    document.getElementById('lblDChord').innerText = d;
                    const R = 5, r = 4;

                    c2Ctx.clearRect(0, 0, c2Canvas.width, c2Canvas.height);
                    const ox = 110;
                    const oy = c2Canvas.height / 2;
                    const scale = 20;

                    const o2x = ox + d * scale;
                    const o2y = oy;

                    // Circles
                    c2Ctx.beginPath();
                    c2Ctx.arc(ox, oy, R * scale, 0, Math.PI * 2);
                    c2Ctx.strokeStyle = '#818cf8';
                    c2Ctx.lineWidth = 2;
                    c2Ctx.stroke();

                    c2Ctx.beginPath();
                    c2Ctx.arc(o2x, o2y, r * scale, 0, Math.PI * 2);
                    c2Ctx.strokeStyle = '#34d399';
                    c2Ctx.lineWidth = 2;
                    c2Ctx.stroke();

                    // Line OO'
                    c2Ctx.beginPath();
                    c2Ctx.moveTo(ox, oy);
                    c2Ctx.lineTo(o2x, o2y);
                    c2Ctx.strokeStyle = '#f59e0b';
                    c2Ctx.lineWidth = 2;
                    c2Ctx.stroke();

                    // Common chord AB
                    const d1 = (R*R - r*r + d*d) / (2 * d);
                    const h = Math.sqrt(Math.max(0, R*R - d1*d1));
                    const ix = ox + d1 * scale;
                    const iy = oy;

                    const ax = ix;
                    const ay = oy - h * scale;
                    const bx = ix;
                    const by = oy + h * scale;

                    c2Ctx.beginPath();
                    c2Ctx.moveTo(ax, ay);
                    c2Ctx.lineTo(bx, by);
                    c2Ctx.strokeStyle = '#f43f5e';
                    c2Ctx.lineWidth = 3;
                    c2Ctx.stroke();

                    // Labels
                    c2Ctx.fillStyle = '#fff';
                    c2Ctx.fillText('A', ax - 5, ay - 8);
                    c2Ctx.fillText('B', bx - 5, by + 18);
                    c2Ctx.fillText('I (vuông)', ix + 4, iy - 6);
                }
                rngDC.addEventListener('input', updateChordTwo);
                updateChordTwo();
                
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
