// ================================================================
// Bài 28: Đường Tròn Ngoại Tiếp & Nội Tiếp Tam Giác - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai28_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Hiệp Tâm Đường Tròn 9',
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
    "title": "Câu 1: Tâm đường tròn ngoại tiếp",
    "pts": 20,
    "question": "Tâm đường tròn ngoại tiếp của một tam giác là giao điểm của:",
    "options": [
      {
        "text": "Ba đường trung trực",
        "correct": true
      },
      {
        "text": "Ba đường phân giác trong",
        "correct": false
      },
      {
        "text": "Ba đường cao",
        "correct": false
      },
      {
        "text": "Ba đường trung tuyến",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa chuẩn: Tâm đường tròn ngoại tiếp tam giác là giao điểm của ba đường trung trực của tam giác đó."
  },
  {
    "id": 2,
    "title": "Câu 2: Tâm đường tròn nội tiếp",
    "pts": 20,
    "question": "Tâm đường tròn nội tiếp của một tam giác là giao điểm của:",
    "options": [
      {
        "text": "Ba đường phân giác trong",
        "correct": true
      },
      {
        "text": "Ba đường trung trực",
        "correct": false
      },
      {
        "text": "Ba đường cao",
        "correct": false
      },
      {
        "text": "Ba đường trung tuyến",
        "correct": false
      }
    ],
    "explanation": "Tâm đường tròn nội tiếp tam giác là giao điểm của ba đường phân giác trong (cách đều 3 cạnh)."
  },
  {
    "id": 3,
    "title": "Câu 3: Bán kính ngoại tiếp tam giác vuông",
    "pts": 20,
    "question": "Một tam giác vuông có hai cạnh góc vuông là 5 cm và 12 cm. Bán kính đường tròn ngoại tiếp tam giác đó bằng:",
    "options": [
      {
        "text": "6,5 cm",
        "correct": true
      },
      {
        "text": "13 cm",
        "correct": false
      },
      {
        "text": "6 cm",
        "correct": false
      },
      {
        "text": "2,5 cm",
        "correct": false
      }
    ],
    "explanation": "Cạnh huyền $c = \\sqrt{5^2 + 12^2} = 13$ cm. Bán kính đường tròn ngoại tiếp $R = \\frac{c}{2} = \\frac{13}{2} = 6,5$ cm."
  },
  {
    "id": 4,
    "title": "Câu 4: Bán kính nội tiếp tam giác vuông",
    "pts": 20,
    "question": "Ở tam giác vuông Câu 3 (hai cạnh góc vuông 5 cm, 12 cm và cạnh huyền 13 cm), bán kính đường tròn nội tiếp $r$ bằng:",
    "options": [
      {
        "text": "2 cm",
        "correct": true
      },
      {
        "text": "3 cm",
        "correct": false
      },
      {
        "text": "4 cm",
        "correct": false
      },
      {
        "text": "1 cm",
        "correct": false
      }
    ],
    "explanation": "Công thức tính nhanh cho tam giác vuông: $r = \\frac{a + b - c}{2} = \\frac{5 + 12 - 13}{2} = \\frac{4}{2} = 2$ cm."
  },
  {
    "id": 5,
    "title": "Câu 5: Bán kính ngoại tiếp tam giác đều",
    "pts": 20,
    "question": "Tam giác đều cạnh bằng 6 cm. Bán kính đường tròn ngoại tiếp $R$ là:",
    "options": [
      {
        "text": "$2\\sqrt{3}$ cm",
        "correct": true
      },
      {
        "text": "$\\sqrt{3}$ cm",
        "correct": false
      },
      {
        "text": "$3\\sqrt{3}$ cm",
        "correct": false
      },
      {
        "text": "3 cm",
        "correct": false
      }
    ],
    "explanation": "Công thức tam giác đều: $R = \\frac{a\\sqrt{3}}{3} = \\frac{6\\sqrt{3}}{3} = 2\\sqrt{3}$ cm."
  },
  {
    "id": 6,
    "title": "Câu 6: Bán kính nội tiếp tam giác đều",
    "pts": 20,
    "question": "Ở tam giác đều cạnh 6 cm (Câu 5), bán kính đường tròn nội tiếp $r$ bằng:",
    "options": [
      {
        "text": "$\\sqrt{3}$ cm",
        "correct": true
      },
      {
        "text": "$2\\sqrt{3}$ cm",
        "correct": false
      },
      {
        "text": "2 cm",
        "correct": false
      },
      {
        "text": "3 cm",
        "correct": false
      }
    ],
    "explanation": "$r = \\frac{R}{2} = \\frac{2\\sqrt{3}}{2} = \\sqrt{3}$ cm (hoặc $r = \\frac{a\\sqrt{3}}{6} = \\frac{6\\sqrt{3}}{6} = \\sqrt{3}$ cm)."
  },
  {
    "id": 7,
    "title": "Câu 7: Vị trí tâm ngoại tiếp tam giác tù",
    "pts": 20,
    "question": "Trong tam giác có một góc tù, tâm đường tròn ngoại tiếp nằm ở đâu?",
    "options": [
      {
        "text": "Nằm phía ngoài tam giác",
        "correct": true
      },
      {
        "text": "Nằm phía trong tam giác",
        "correct": false
      },
      {
        "text": "Nằm trên cạnh dài nhất",
        "correct": false
      },
      {
        "text": "Trùng với đỉnh góc tù",
        "correct": false
      }
    ],
    "explanation": "Đối với tam giác tù, góc nội tiếp tù chắn cung lớn nên tâm đường tròn ngoại tiếp luôn nằm ở phía ngoài miền trong của tam giác."
  },
  {
    "id": 8,
    "title": "Câu 8: Vị trí tâm nội tiếp tam giác",
    "pts": 20,
    "question": "Tâm đường tròn nội tiếp của một tam giác bất kì luôn:",
    "options": [
      {
        "text": "Nằm hoàn toàn bên trong tam giác",
        "correct": true
      },
      {
        "text": "Nằm bên ngoài tam giác",
        "correct": false
      },
      {
        "text": "Nằm trên một cạnh",
        "correct": false
      },
      {
        "text": "Có thể nằm trong hoặc ngoài tùy loại tam giác",
        "correct": false
      }
    ],
    "explanation": "Vì các tia phân giác trong luôn nằm trong miền góc của tam giác nên giao điểm của chúng (tâm đường tròn nội tiếp) luôn nằm bên trong tam giác."
  },
  {
    "id": 9,
    "title": "Câu 9: Công thức diện tích theo bán kính nội tiếp",
    "pts": 20,
    "question": "Tam giác có nửa chu vi $p = 15$ cm và diện tích $S = 30$ cm². Bán kính đường tròn nội tiếp của tam giác là:",
    "options": [
      {
        "text": "2 cm",
        "correct": true
      },
      {
        "text": "3 cm",
        "correct": false
      },
      {
        "text": "4 cm",
        "correct": false
      },
      {
        "text": "1,5 cm",
        "correct": false
      }
    ],
    "explanation": "Ta có $S = p \\cdot r \\iff r = \\frac{S}{p} = \\frac{30}{15} = 2$ cm."
  },
  {
    "id": 10,
    "title": "Câu 10: Tỉ số bán kính trong tam giác đều",
    "pts": 20,
    "question": "Tỉ số $\\frac{R}{r}$ giữa bán kính đường tròn ngoại tiếp và nội tiếp của một tam giác đều bằng:",
    "options": [
      {
        "text": "2",
        "correct": true
      },
      {
        "text": "$\\sqrt{3}$",
        "correct": false
      },
      {
        "text": "3",
        "correct": false
      },
      {
        "text": "1,5",
        "correct": false
      }
    ],
    "explanation": "Trong tam giác đều, trọng tâm chia đường cao thành tỉ lệ $2 : 1$, do đó $R = 2r \\implies \\frac{R}{r} = 2$."
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
                const slA = document.getElementById('slAx');
                const vA = document.getElementById('vAx');
                const btnEqui = document.getElementById('btnPresetEqui');
                const btnRight = document.getElementById('btnPresetRight');
                const out1 = document.getElementById('lab1Output');

                let ptA = { x: 300, y: 50 };
                let ptB = { x: 180, y: 250 };
                let ptC = { x: 420, y: 250 };

                function findCircumcenter(A, B, C) {
                    const d = 2 * (A.x * (B.y - C.y) + B.x * (C.y - A.y) + C.x * (A.y - B.y));
                    if (Math.abs(d) < 1e-4) return null;
                    const ux = ((A.x*A.x + A.y*A.y)*(B.y - C.y) + (B.x*B.x + B.y*B.y)*(C.y - A.y) + (C.x*C.x + C.y*C.y)*(A.y - B.y)) / d;
                    const uy = ((A.x*A.x + A.y*A.y)*(C.x - B.x) + (B.x*B.x + B.y*B.y)*(A.x - C.x) + (C.x*C.x + C.y*C.y)*(B.x - A.x)) / d;
                    const r = Math.hypot(A.x - ux, A.y - uy);
                    return { x: ux, y: uy, r };
                }

                function renderCircum() {
                    const cw = c1.width;
                    const ch = c1.height;
                    ctx.clearRect(0, 0, cw, ch);

                    // Draw Triangle
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ptA.x, ptA.y);
                    ctx.lineTo(ptB.x, ptB.y);
                    ctx.lineTo(ptC.x, ptC.y);
                    ctx.closePath();
                    ctx.stroke();

                    // Circumcircle
                    const cc = findCircumcenter(ptA, ptB, ptC);
                    if (cc) {
                        ctx.strokeStyle = '#10b981';
                        ctx.lineWidth = 2.5;
                        ctx.beginPath();
                        ctx.arc(cc.x, cc.y, cc.r, 0, Math.PI * 2);
                        ctx.stroke();

                        // Center O
                        ctx.fillStyle = '#f59e0b';
                        ctx.beginPath(); ctx.arc(cc.x, cc.y, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 13px sans-serif';
                        ctx.fillText('O (Tâm ngoại tiếp)', cc.x + 8, cc.y + 4);

                        // Radii to vertices dashed
                        ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
                        ctx.setLineDash([3, 3]);
                        [ptA, ptB, ptC].forEach(p => {
                            ctx.beginPath(); ctx.moveTo(cc.x, cc.y); ctx.lineTo(p.x, p.y); ctx.stroke();
                        });
                        ctx.setLineDash([]);
                    }

                    // Vertices
                    const pts = [
                        { name: 'A', pt: ptA, c: '#06b6d4' },
                        { name: 'B', pt: ptB, c: '#06b6d4' },
                        { name: 'C', pt: ptC, c: '#06b6d4' }
                    ];
                    pts.forEach(p => {
                        ctx.fillStyle = p.c;
                        ctx.beginPath(); ctx.arc(p.pt.x, p.pt.y, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 14px sans-serif';
                        ctx.fillText(p.name, p.pt.x - 8, p.pt.y - 10);
                    });

                    out1.innerHTML = `<strong>Đường tròn ngoại tiếp:</strong> Tâm $O$ là giao điểm của 3 đường trung trực, bán kính $R = OA = OB = OC = ${cc ? cc.r.toFixed(1) : 0}\\text{ px}$.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slA.addEventListener('input', () => {
                    ptA.x = parseFloat(slA.value);
                    vA.textContent = 'x = ' + ptA.x;
                    renderCircum();
                });

                btnEqui.addEventListener('click', () => {
                    ptA = { x: 300, y: 70 };
                    ptB = { x: 196, y: 250 };
                    ptC = { x: 404, y: 250 };
                    slA.value = 300; vA.textContent = 'x = 300';
                    renderCircum();
                });

                btnRight.addEventListener('click', () => {
                    ptA = { x: 180, y: 100 };
                    ptB = { x: 180, y: 250 };
                    ptC = { x: 420, y: 250 };
                    slA.value = 180; vA.textContent = 'x = 180';
                    renderCircum();
                });

                renderCircum();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const out2 = document.getElementById('lab2Output');

                const A = { x: 300, y: 60 };
                const B = { x: 160, y: 260 };
                const C = { x: 440, y: 260 };

                function renderIncircle() {
                    const cw = c2.width;
                    const ch = c2.height;
                    ctx2.clearRect(0, 0, cw, ch);

                    const a = Math.hypot(B.x - C.x, B.y - C.y);
                    const b = Math.hypot(A.x - C.x, A.y - C.y);
                    const c = Math.hypot(A.x - B.x, A.y - B.y);
                    const p = (a + b + c) / 2;

                    // Incenter coordinates
                    const ix = (a * A.x + b * B.x + c * C.x) / (a + b + c);
                    const iy = (a * A.y + b * B.y + c * C.y) / (a + b + c);
                    const Area = Math.sqrt(p * (p - a) * (p - b) * (p - c));
                    const r = Area / p;

                    // Draw Triangle
                    ctx2.strokeStyle = '#38bdf8';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath();
                    ctx2.moveTo(A.x, A.y); ctx2.lineTo(B.x, B.y); ctx2.lineTo(C.x, C.y);
                    ctx2.closePath(); ctx2.stroke();

                    // Bisectors dashed
                    ctx2.strokeStyle = 'rgba(236, 72, 153, 0.4)';
                    ctx2.setLineDash([4, 4]);
                    [A, B, C].forEach(pt => {
                        ctx2.beginPath(); ctx2.moveTo(pt.x, pt.y); ctx2.lineTo(ix, iy); ctx2.stroke();
                    });
                    ctx2.setLineDash([]);

                    // Incircle
                    ctx2.strokeStyle = '#ec4899';
                    ctx2.lineWidth = 2.5;
                    ctx2.beginPath(); ctx2.arc(ix, iy, r, 0, Math.PI * 2); ctx2.stroke();

                    ctx2.fillStyle = 'rgba(236, 72, 153, 0.15)';
                    ctx2.fill();

                    // Center I
                    ctx2.fillStyle = '#f59e0b';
                    ctx2.beginPath(); ctx2.arc(ix, iy, 6, 0, Math.PI * 2); ctx2.fill();
                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 13px sans-serif';
                    ctx2.fillText('I (Tâm nội tiếp)', ix + 8, iy - 6);

                    // Vertices
                    [A, B, C].forEach((pt, i) => {
                        const name = ['A', 'B', 'C'][i];
                        ctx2.fillStyle = '#06b6d4';
                        ctx2.beginPath(); ctx2.arc(pt.x, pt.y, 6, 0, Math.PI * 2); ctx2.fill();
                        ctx2.fillStyle = '#ffffff';
                        ctx2.font = 'bold 14px sans-serif';
                        ctx2.fillText(name, pt.x - 8, pt.y - 10);
                    });

                    out2.innerHTML = `<strong>Đường tròn nội tiếp:</strong> Tâm $I$ là giao điểm của 3 đường phân giác trong. Bán kính $r = \\frac{S}{p} = ${r.toFixed(1)}\\text{ px}$. Đường tròn $(I; r)$ tiếp xúc với cả 3 cạnh tam giác.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                renderIncircle();
            
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
