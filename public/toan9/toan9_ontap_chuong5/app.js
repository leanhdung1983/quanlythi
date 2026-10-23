// ================================================================
// Ôn tập Chương V: Đường tròn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ontap_chuong5_state';

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
    "title": "Câu 1: Số đường tròn qua 3 điểm phân biệt thẳng hàng",
    "question": "Số đường tròn đi qua 3 điểm phân biệt thẳng hàng là:",
    "options": [
      {
        "text": "$0$",
        "correct": true
      },
      {
        "text": "$1$",
        "correct": false
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
    "explanation": "Không có đường tròn nào đi qua ba điểm thẳng hàng.",
    "pts": 20
  },
  {
    "id": "q2",
    "title": "Câu 2: Dây đi qua tâm của đường tròn",
    "question": "Dây đi qua tâm của đường tròn gọi là:",
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
        "text": "Tiếp tuyến",
        "correct": false
      },
      {
        "text": "Cát tuyến",
        "correct": false
      }
    ],
    "explanation": "Dây đi qua tâm chính là đường kính của đường tròn.",
    "pts": 20
  },
  {
    "id": "q3",
    "title": "Câu 3: Tính khoảng cách từ tâm đến dây",
    "question": "Cho đường tròn $(O; 5\\text{ cm})$ và dây $AB = 8\\text{ cm}$. Khoảng cách từ tâm $O$ đến dây $AB$ bằng:",
    "options": [
      {
        "text": "$3$ cm",
        "correct": true
      },
      {
        "text": "$4$ cm",
        "correct": false
      },
      {
        "text": "$2$ cm",
        "correct": false
      },
      {
        "text": "$\\sqrt{41}$ cm",
        "correct": false
      }
    ],
    "explanation": "Gọi $H$ là trung điểm $AB \\implies AH = 4$ cm. Ta có $OH = \\sqrt{R^2 - AH^2} = \\sqrt{5^2 - 4^2} = 3$ cm.",
    "pts": 20
  },
  {
    "id": "q4",
    "title": "Câu 4: Diện tích hình tròn có chu vi 10pi",
    "question": "Một hình tròn có chu vi $C = 10\\pi$ cm thì diện tích của nó là:",
    "options": [
      {
        "text": "$10\\pi$ $\\text{cm}^2$",
        "correct": false
      },
      {
        "text": "$25\\pi$ $\\text{cm}^2$",
        "correct": true
      },
      {
        "text": "$50\\pi$ $\\text{cm}^2$",
        "correct": false
      },
      {
        "text": "$100\\pi$ $\\text{cm}^2$",
        "correct": false
      }
    ],
    "explanation": "$C = 2\\pi R = 10\\pi \\implies R = 5$ cm. Do đó $S = \\pi R^2 = 25\\pi$ $\\text{cm}^2$.",
    "pts": 20
  },
  {
    "id": "q5",
    "title": "Câu 5: Độ dài cung 120 độ",
    "question": "Độ dài cung $120^\\circ$ của đường tròn bán kính $R = 9$ cm là:",
    "options": [
      {
        "text": "$3\\pi$ cm",
        "correct": false
      },
      {
        "text": "$6\\pi$ cm",
        "correct": true
      },
      {
        "text": "$9\\pi$ cm",
        "correct": false
      },
      {
        "text": "$12\\pi$ cm",
        "correct": false
      }
    ],
    "explanation": "$l = \\frac{\\pi R n}{180} = \\frac{\\pi \\cdot 9 \\cdot 120}{180} = 6\\pi$ cm.",
    "pts": 20
  },
  {
    "id": "q6",
    "title": "Câu 6: Diện tích hình quạt 90 độ",
    "question": "Diện tích hình quạt tròn bán kính $R = 4$ cm, góc ở tâm $90^\\circ$ là:",
    "options": [
      {
        "text": "$4\\pi$ $\\text{cm}^2$",
        "correct": true
      },
      {
        "text": "$8\\pi$ $\\text{cm}^2$",
        "correct": false
      },
      {
        "text": "$16\\pi$ $\\text{cm}^2$",
        "correct": false
      },
      {
        "text": "$2\\pi$ $\\text{cm}^2$",
        "correct": false
      }
    ],
    "explanation": "$S_q = \\frac{\\pi R^2 n}{360} = \\frac{\\pi \\cdot 16 \\cdot 90}{360} = 4\\pi$ $\\text{cm}^2$.",
    "pts": 20
  },
  {
    "id": "q7",
    "title": "Câu 7: Vị trí tương đối khi d = R",
    "question": "Khi khoảng cách từ tâm của đường tròn đến đường thẳng bằng bán kính của đường tròn thì đường thẳng đó là:",
    "options": [
      {
        "text": "Cát tuyến",
        "correct": false
      },
      {
        "text": "Tiếp tuyến",
        "correct": true
      },
      {
        "text": "Đường kính",
        "correct": false
      },
      {
        "text": "Trục đối xứng",
        "correct": false
      }
    ],
    "explanation": "Khi $d = R$, đường thẳng tiếp xúc với đường tròn, nên nó là tiếp tuyến.",
    "pts": 20
  },
  {
    "id": "q8",
    "title": "Câu 8: Hai đường tròn tiếp xúc trong",
    "question": "Hai đường tròn $(O; 7\\text{ cm})$ và $(O'; 3\\text{ cm})$ tiếp xúc trong khi đoạn nối tâm $OO'$ bằng:",
    "options": [
      {
        "text": "$10$ cm",
        "correct": false
      },
      {
        "text": "$4$ cm",
        "correct": true
      },
      {
        "text": "$2$ cm",
        "correct": false
      },
      {
        "text": "$5$ cm",
        "correct": false
      }
    ],
    "explanation": "Tiếp xúc trong khi $d = R - r = 7 - 3 = 4$ cm.",
    "pts": 20
  },
  {
    "id": "q9",
    "title": "Câu 9: Diện tích hình vành khuyên",
    "question": "Cho hai đường tròn đồng tâm bán kính $10$ cm và $6$ cm. Diện tích hình vành khuyên giữa chúng là:",
    "options": [
      {
        "text": "$64\\pi$ $\\text{cm}^2$",
        "correct": true
      },
      {
        "text": "$16\\pi$ $\\text{cm}^2$",
        "correct": false
      },
      {
        "text": "$36\\pi$ $\\text{cm}^2$",
        "correct": false
      },
      {
        "text": "$100\\pi$ $\\text{cm}^2$",
        "correct": false
      }
    ],
    "explanation": "$S_{vk} = \\pi (10^2 - 6^2) = \\pi (100 - 36) = 64\\pi$ $\\text{cm}^2$.",
    "pts": 20
  },
  {
    "id": "q10",
    "title": "Câu 10: Hai tiếp tuyến cắt nhau vuông góc",
    "question": "Từ điểm $M$ kẻ hai tiếp tuyến $MA, MB$ đến đường tròn $(O; R)$. Biết $MA \\perp MB$. Khoảng cách $OM$ bằng:",
    "options": [
      {
        "text": "$R$",
        "correct": false
      },
      {
        "text": "$R\\sqrt{2}$",
        "correct": true
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
    "explanation": "Tứ giác $OAMB$ có 3 góc vuông và $OA = OB = R$ nên là hình vuông cạnh $R$. Do đó đường chéo $OM = R\\sqrt{2}$.",
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
    
                const sCircCanvas = document.getElementById('sumCircCanvas');
                const scCtx = sCircCanvas.getContext('2d');

                window.setLinePos = function(type) {
                    const R = 80;
                    let d = 80;
                    if (type === 'cut') {
                        d = 45;
                        document.getElementById('lblLinePos').innerText = 'Cắt nhau (d < R)';
                        document.getElementById('lblPtsCommon').innerText = '2 điểm chung (cát tuyến)';
                    } else if (type === 'tan') {
                        d = 80;
                        document.getElementById('lblLinePos').innerText = 'Tiếp xúc nhau (d = R)';
                        document.getElementById('lblPtsCommon').innerText = '1 điểm chung (tiếp tuyến vuông góc bán kính)';
                    } else {
                        d = 115;
                        document.getElementById('lblLinePos').innerText = 'Không giao nhau (d > R)';
                        document.getElementById('lblPtsCommon').innerText = '0 điểm chung';
                    }

                    scCtx.clearRect(0, 0, sCircCanvas.width, sCircCanvas.height);
                    const cx = sCircCanvas.width / 2;
                    const cy = sCircCanvas.height / 2 - 20;

                    // Circle
                    scCtx.beginPath();
                    scCtx.arc(cx, cy, R, 0, Math.PI * 2);
                    scCtx.fillStyle = 'rgba(99, 102, 241, 0.15)';
                    scCtx.fill();
                    scCtx.strokeStyle = '#818cf8';
                    scCtx.lineWidth = 2.5;
                    scCtx.stroke();

                    // Line
                    const lineY = cy + d;
                    scCtx.beginPath();
                    scCtx.moveTo(40, lineY);
                    scCtx.lineTo(sCircCanvas.width - 40, lineY);
                    scCtx.strokeStyle = (type === 'tan') ? '#f59e0b' : ((type === 'cut') ? '#34d399' : '#f43f5e');
                    scCtx.lineWidth = 3;
                    scCtx.stroke();

                    // Center
                    scCtx.beginPath();
                    scCtx.arc(cx, cy, 4, 0, Math.PI * 2);
                    scCtx.fillStyle = '#fff';
                    scCtx.fill();
                    scCtx.fillText('O', cx - 14, cy - 8);
                };
                window.setLinePos('tan');
                
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const sfCanvas = document.getElementById('sumFormCanvas');
                const sfCtx = sfCanvas.getContext('2d');
                const rngR = document.getElementById('rngSumR');
                const rngN = document.getElementById('rngSumN');

                function updateSumF() {
                    const r = parseFloat(rngR.value);
                    const n = parseFloat(rngN.value);
                    document.getElementById('lblSumR').innerText = r;
                    document.getElementById('lblSumN').innerText = n;

                    const c = 2 * Math.PI * r;
                    const l = (Math.PI * r * n) / 180;
                    const s = Math.PI * r * r;
                    const sq = (Math.PI * r * r * n) / 360;

                    document.getElementById('sC').innerText = c.toFixed(2);
                    document.getElementById('sL').innerText = l.toFixed(2);
                    document.getElementById('sS').innerText = s.toFixed(2);
                    document.getElementById('sSq').innerText = sq.toFixed(2);

                    sfCtx.clearRect(0, 0, sfCanvas.width, sfCanvas.height);
                    const cx = sfCanvas.width / 2;
                    const cy = sfCanvas.height / 2;
                    const scale = 11;
                    const radN = n * Math.PI / 180;

                    sfCtx.beginPath();
                    sfCtx.moveTo(cx, cy);
                    sfCtx.arc(cx, cy, r * scale, 0, radN);
                    sfCtx.closePath();
                    sfCtx.fillStyle = 'rgba(6, 182, 212, 0.25)';
                    sfCtx.fill();
                    sfCtx.strokeStyle = '#06b6d4';
                    sfCtx.lineWidth = 2.5;
                    sfCtx.stroke();
                }
                rngR.addEventListener('input', updateSumF);
                rngN.addEventListener('input', updateSumF);
                updateSumF();
                
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
