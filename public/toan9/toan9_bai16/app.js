// ================================================================
// Bài 16: Vị trí tương đối của đường thẳng và đường tròn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai16_state';

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
    "title": "Câu 1: Điều kiện để đường thẳng tiếp xúc đường tròn",
    "question": "Đường thẳng $a$ tiếp xúc với đường tròn $(O; R)$ khi và chỉ khi:",
    "options": [
      {
        "text": "$d < R$",
        "correct": false
      },
      {
        "text": "$d = R$",
        "correct": true
      },
      {
        "text": "$d > R$",
        "correct": false
      },
      {
        "text": "$d = 0$",
        "correct": false
      }
    ],
    "explanation": "Khoảng cách $d$ từ tâm đến đường thẳng bằng bán kính $R$ ($d = R$) thì đường thẳng tiếp xúc với đường tròn.",
    "pts": 20
  },
  {
    "id": "q2",
    "title": "Câu 2: Số điểm chung của cát tuyến",
    "question": "Nếu đường thẳng cắt đường tròn thì số điểm chung giữa chúng là:",
    "options": [
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": true
      },
      {
        "text": "Vô số",
        "correct": false
      }
    ],
    "explanation": "Đường thẳng cắt đường tròn tại đúng 2 điểm chung phân biệt.",
    "pts": 20
  },
  {
    "id": "q3",
    "title": "Câu 3: Góc giữa tiếp tuyến và bán kính",
    "question": "Góc tạo bởi tiếp tuyến của đường tròn và bán kính đi qua tiếp điểm bằng:",
    "options": [
      {
        "text": "$45^\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": true
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Tiếp tuyến luôn vuông góc với bán kính đi qua tiếp điểm, do đó góc tạo thành bằng $90^\\circ$.",
    "pts": 20
  },
  {
    "id": "q4",
    "title": "Câu 4: Tính chất hai tiếp tuyến cắt nhau",
    "question": "Cho hai tiếp tuyến $MA$ và $MB$ của đường tròn $(O)$ (với $A, B$ là tiếp điểm). Khẳng định nào sau đây là sai?",
    "options": [
      {
        "text": "$MA = MB$",
        "correct": false
      },
      {
        "text": "$MO$ là tia phân giác góc $\\widehat{AMB}$",
        "correct": false
      },
      {
        "text": "$OM$ là tia phân giác góc $\\widehat{AOB}$",
        "correct": false
      },
      {
        "text": "$MA = MO$",
        "correct": true
      }
    ],
    "explanation": "Trong tam giác vuông $OAM$, cạnh huyền $OM > MA$, do đó $MA = MO$ là khẳng định sai.",
    "pts": 20
  },
  {
    "id": "q5",
    "title": "Câu 5: Tính độ dài tiếp tuyến",
    "question": "Từ điểm $M$ cách tâm $O$ của đường tròn $(O; 6\\text{ cm})$ một khoảng $10$ cm, kẻ tiếp tuyến $MA$. Độ dài đoạn tiếp tuyến $MA$ là:",
    "options": [
      {
        "text": "$8$ cm",
        "correct": true
      },
      {
        "text": "$4$ cm",
        "correct": false
      },
      {
        "text": "$16$ cm",
        "correct": false
      },
      {
        "text": "$\\sqrt{136}$ cm",
        "correct": false
      }
    ],
    "explanation": "Tam giác $OAM$ vuông tại $A$, ta có $MA = \\sqrt{OM^2 - OA^2} = \\sqrt{10^2 - 6^2} = 8$ cm.",
    "pts": 20
  },
  {
    "id": "q6",
    "title": "Câu 6: Tâm đường tròn nội tiếp tam giác",
    "question": "Tâm đường tròn nội tiếp một tam giác là giao điểm của:",
    "options": [
      {
        "text": "Ba đường cao",
        "correct": false
      },
      {
        "text": "Ba đường phân giác trong",
        "correct": true
      },
      {
        "text": "Ba đường trung trực",
        "correct": false
      },
      {
        "text": "Ba đường trung tuyến",
        "correct": false
      }
    ],
    "explanation": "Tâm đường tròn nội tiếp tam giác là giao điểm ba đường phân giác trong của tam giác (cách đều ba cạnh).",
    "pts": 20
  },
  {
    "id": "q7",
    "title": "Câu 7: Xác định vị trí khi biết d và R",
    "question": "Cho đường tròn $(O; 5\\text{ cm})$ và khoảng cách từ $O$ đến đường thẳng $d$ là $7$ cm. Vị trí tương đối của chúng là:",
    "options": [
      {
        "text": "Cắt nhau",
        "correct": false
      },
      {
        "text": "Tiếp xúc nhau",
        "correct": false
      },
      {
        "text": "Không giao nhau",
        "correct": true
      },
      {
        "text": "Trùng nhau",
        "correct": false
      }
    ],
    "explanation": "Vì $d = 7\\text{ cm} > R = 5\\text{ cm}$ nên đường thẳng và đường tròn không giao nhau.",
    "pts": 20
  },
  {
    "id": "q8",
    "title": "Câu 8: Tính góc ngoài giữa hai tiếp tuyến",
    "question": "Cho hai tiếp tuyến $MA, MB$ của đường tròn $(O)$ biết $\\widehat{AOB} = 110^\\circ$. Số đo góc $\\widehat{AMB}$ là:",
    "options": [
      {
        "text": "$70^\\circ$",
        "correct": true
      },
      {
        "text": "$80^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      },
      {
        "text": "$110^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Tứ giác $OAMB$ có hai góc vuông tại $A$ và $B$, tổng 4 góc là $360^\\circ$, nên $\\widehat{AMB} = 180^\\circ - 110^\\circ = 70^\\circ$.",
    "pts": 20
  },
  {
    "id": "q9",
    "title": "Câu 9: Bán kính đường tròn nội tiếp tam giác đều",
    "question": "Cho tam giác đều $ABC$ cạnh $a$. Bán kính $r$ của đường tròn nội tiếp tam giác $ABC$ là:",
    "options": [
      {
        "text": "$r = \\frac{a\\sqrt{3}}{6}$",
        "correct": true
      },
      {
        "text": "$r = \\frac{a\\sqrt{3}}{3}$",
        "correct": false
      },
      {
        "text": "$r = \\frac{a}{2}$",
        "correct": false
      },
      {
        "text": "$r = \\frac{a\\sqrt{3}}{2}$",
        "correct": false
      }
    ],
    "explanation": "Đường cao tam giác đều là $h = \\frac{a\\sqrt{3}}{2}$. Bán kính nội tiếp là $r = \\frac{1}{3} h = \\frac{1}{3} \\cdot \\frac{a\\sqrt{3}}{2} = \\frac{a\\sqrt{3}}{6}$.",
    "pts": 20
  },
  {
    "id": "q10",
    "title": "Câu 10: Tiếp tuyến chung của hai đường thẳng song song",
    "question": "Khoảng cách giữa hai tiếp tuyến song song của đường tròn $(O; R)$ bằng:",
    "options": [
      {
        "text": "$R$",
        "correct": false
      },
      {
        "text": "$2R$",
        "correct": true
      },
      {
        "text": "$\\pi R$",
        "correct": false
      },
      {
        "text": "$4R$",
        "correct": false
      }
    ],
    "explanation": "Hai tiếp tuyến song song tiếp xúc tại hai đầu của một đường kính, nên khoảng cách giữa chúng bằng độ dài đường kính là $2R$.",
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
    
                const lcCanvas = document.getElementById('lineCircleCanvas');
                const lcCtx = lcCanvas.getContext('2d');
                const rngR = document.getElementById('rngLCR');
                const rngD = document.getElementById('rngLCD');

                function updateLC() {
                    const R = parseFloat(rngR.value);
                    const d = parseFloat(rngD.value);
                    document.getElementById('lblLCR').innerText = R;
                    document.getElementById('lblLCD').innerText = d;
                    document.getElementById('outLCR').innerText = R.toFixed(1);
                    document.getElementById('outLCD').innerText = d.toFixed(1);

                    const st = document.getElementById('outLCStatus');
                    if (Math.abs(d - R) < 0.1) {
                        st.innerText = 'Tiếp xúc nhau tại 1 tiếp điểm (d = R - Đường thẳng là tiếp tuyến)';
                        st.style.background = '#f59e0b';
                    } else if (d < R) {
                        st.innerText = 'Cắt nhau tại 2 điểm phân biệt (d < R - Cát tuyến)';
                        st.style.background = '#10b981';
                    } else {
                        st.innerText = 'Không giao nhau, không có điểm chung (d > R)';
                        st.style.background = '#ef4444';
                    }

                    lcCtx.clearRect(0, 0, lcCanvas.width, lcCanvas.height);
                    const cx = lcCanvas.width / 2;
                    const cy = lcCanvas.height / 2 - 20;
                    const scale = 22;

                    // Draw Circle
                    lcCtx.beginPath();
                    lcCtx.arc(cx, cy, R * scale, 0, Math.PI * 2);
                    lcCtx.fillStyle = 'rgba(99, 102, 241, 0.1)';
                    lcCtx.fill();
                    lcCtx.strokeStyle = '#818cf8';
                    lcCtx.lineWidth = 2.5;
                    lcCtx.stroke();

                    // Center
                    lcCtx.beginPath();
                    lcCtx.arc(cx, cy, 4, 0, Math.PI * 2);
                    lcCtx.fillStyle = '#fff';
                    lcCtx.fill();
                    lcCtx.fillText('O', cx - 14, cy - 8);

                    // Line a at y = cy + d*scale
                    const lineY = cy + d * scale;
                    lcCtx.beginPath();
                    lcCtx.moveTo(30, lineY);
                    lcCtx.lineTo(lcCanvas.width - 30, lineY);
                    lcCtx.strokeStyle = (Math.abs(d - R) < 0.1) ? '#f59e0b' : '#34d399';
                    lcCtx.lineWidth = 3;
                    lcCtx.stroke();

                    // OH perpendicular
                    lcCtx.beginPath();
                    lcCtx.setLineDash([3, 3]);
                    lcCtx.moveTo(cx, cy);
                    lcCtx.lineTo(cx, lineY);
                    lcCtx.strokeStyle = '#f43f5e';
                    lcCtx.stroke();
                    lcCtx.setLineDash([]);

                    lcCtx.fillStyle = '#fbbf24';
                    lcCtx.fillText('d = ' + d.toFixed(1) + ' cm', cx + 6, cy + d*scale/2);
                    lcCtx.fillStyle = '#34d399';
                    lcCtx.fillText('Đường thẳng a', lcCanvas.width - 120, lineY - 8);
                }
                rngR.addEventListener('input', updateLC);
                rngD.addEventListener('input', updateLC);
                updateLC();
                
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const tCanvas = document.getElementById('tanCanvas');
                const tctx = tCanvas.getContext('2d');
                const rngOM = document.getElementById('rngOMTan');

                function updateTan() {
                    const om = parseFloat(rngOM.value);
                    const R = 5;
                    document.getElementById('lblOMTan').innerText = om.toFixed(1);
                    document.getElementById('outOMVal').innerText = om.toFixed(1);

                    const ma = Math.sqrt(om*om - R*R);
                    const halfAng = Math.asin(R / om);
                    const ambDeg = (2 * halfAng * 180 / Math.PI);
                    const aobDeg = 180 - ambDeg;

                    document.getElementById('outMATan').innerText = ma.toFixed(2);
                    document.getElementById('outAMB').innerText = ambDeg.toFixed(1);
                    document.getElementById('outAOB').innerText = aobDeg.toFixed(1);

                    tctx.clearRect(0, 0, tCanvas.width, tCanvas.height);
                    const ox = 110;
                    const oy = tCanvas.height / 2;
                    const scale = 17;

                    // Circle (O; R)
                    tctx.beginPath();
                    tctx.arc(ox, oy, R * scale, 0, Math.PI * 2);
                    tctx.strokeStyle = '#6366f1';
                    tctx.lineWidth = 2;
                    tctx.stroke();

                    // Point M
                    const mx = ox + om * scale;
                    const my = oy;

                    // Tangent contact points A and B
                    const angA = Math.acos(R / om);
                    const ax = ox + R * scale * Math.cos(angA);
                    const ay = oy - R * scale * Math.sin(angA);
                    const bx = ax;
                    const by = oy + R * scale * Math.sin(angA);

                    // Lines MA, MB
                    tctx.beginPath();
                    tctx.moveTo(mx, my);
                    tctx.lineTo(ax, ay);
                    tctx.lineTo(ox, oy);
                    tctx.lineTo(bx, by);
                    tctx.lineTo(mx, my);
                    tctx.strokeStyle = '#10b981';
                    tctx.lineWidth = 2.5;
                    tctx.stroke();

                    // Line OM
                    tctx.beginPath();
                    tctx.setLineDash([4, 4]);
                    tctx.moveTo(ox, oy);
                    tctx.lineTo(mx, my);
                    tctx.strokeStyle = '#f59e0b';
                    tctx.stroke();
                    tctx.setLineDash([]);

                    // Labels
                    tctx.fillStyle = '#ffffff';
                    tctx.font = 'bold 13px Inter, sans-serif';
                    tctx.fillText('O', ox - 15, oy + 5);
                    tctx.fillText('M', mx + 8, my + 5);
                    tctx.fillText('A', ax - 5, ay - 8);
                    tctx.fillText('B', bx - 5, by + 18);
                }
                rngOM.addEventListener('input', updateTan);
                updateTan();
                
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
