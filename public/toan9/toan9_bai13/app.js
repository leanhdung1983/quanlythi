// ================================================================
// Bài 13: Mở đầu về đường tròn - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai13_state';

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
    "title": "Câu 1: Nhận diện vị trí tương đối của điểm và đường tròn",
    "question": "Cho đường tròn $(O; 4\\text{ cm})$ và điểm $M$ sao cho $OM = 5\\text{ cm}$. Khẳng định nào sau đây đúng?",
    "options": [
      {
        "text": "Điểm $M$ nằm trong đường tròn",
        "correct": false
      },
      {
        "text": "Điểm $M$ nằm ngoài đường tròn",
        "correct": true
      },
      {
        "text": "Điểm $M$ nằm trên đường tròn",
        "correct": false
      },
      {
        "text": "Điểm $M$ trùng với tâm $O$",
        "correct": false
      }
    ],
    "explanation": "Vì $OM = 5\\text{ cm} > R = 4\\text{ cm}$ nên điểm $M$ nằm ngoài đường tròn $(O; 4\\text{ cm})$.",
    "pts": 20
  },
  {
    "id": "q2",
    "title": "Câu 2: Tâm đối xứng của đường tròn",
    "question": "Hình tròn có bao nhiêu tâm đối xứng?",
    "options": [
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
      },
      {
        "text": "Không có",
        "correct": false
      }
    ],
    "explanation": "Đường tròn chỉ có duy nhất một tâm đối xứng, chính là tâm $O$ của đường tròn.",
    "pts": 20
  },
  {
    "id": "q3",
    "title": "Câu 3: Trục đối xứng của đường tròn",
    "question": "Số trục đối xứng của một đường tròn là:",
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
        "text": "$4$",
        "correct": false
      },
      {
        "text": "Vô số",
        "correct": true
      }
    ],
    "explanation": "Mọi đường thẳng đi qua tâm của đường tròn đều là trục đối xứng, do đó đường tròn có vô số trục đối xứng.",
    "pts": 20
  },
  {
    "id": "q4",
    "title": "Câu 4: Xác định đường tròn qua 3 điểm",
    "question": "Qua bao nhiêu điểm không thẳng hàng ta vẽ được một và chỉ một đường tròn?",
    "options": [
      {
        "text": "1 điểm",
        "correct": false
      },
      {
        "text": "2 điểm",
        "correct": false
      },
      {
        "text": "3 điểm không thẳng hàng",
        "correct": true
      },
      {
        "text": "4 điểm bất kì",
        "correct": false
      }
    ],
    "explanation": "Theo định lí SGK, qua ba điểm không thẳng hàng, ta vẽ được một và chỉ một đường tròn.",
    "pts": 20
  },
  {
    "id": "q5",
    "title": "Câu 5: Tâm đường tròn ngoại tiếp tam giác",
    "question": "Tâm của đường tròn ngoại tiếp tam giác là giao điểm của ba đường nào?",
    "options": [
      {
        "text": "Ba đường cao",
        "correct": false
      },
      {
        "text": "Ba đường phân giác",
        "correct": false
      },
      {
        "text": "Ba đường trung trực",
        "correct": true
      },
      {
        "text": "Ba đường trung tuyến",
        "correct": false
      }
    ],
    "explanation": "Tâm đường tròn ngoại tiếp tam giác là giao điểm của ba đường trung trực của tam giác đó.",
    "pts": 20
  },
  {
    "id": "q6",
    "title": "Câu 6: Tâm đường tròn ngoại tiếp tam giác vuông",
    "question": "Tâm đường tròn ngoại tiếp một tam giác vuông nằm ở:",
    "options": [
      {
        "text": "Đỉnh góc vuông",
        "correct": false
      },
      {
        "text": "Trung điểm của cạnh huyền",
        "correct": true
      },
      {
        "text": "Trong tam giác",
        "correct": false
      },
      {
        "text": "Ngoài tam giác",
        "correct": false
      }
    ],
    "explanation": "Trong tam giác vuông, đường trung tuyến ứng với cạnh huyền bằng nửa cạnh huyền, do đó trung điểm cạnh huyền cách đều ba đỉnh và là tâm đường tròn ngoại tiếp.",
    "pts": 20
  },
  {
    "id": "q7",
    "title": "Câu 7: Bán kính đường tròn ngoại tiếp tam giác đều",
    "question": "Cho tam giác đều $ABC$ cạnh $a$. Bán kính $R$ của đường tròn ngoại tiếp tam giác $ABC$ là:",
    "options": [
      {
        "text": "$R = \\frac{a\\sqrt{3}}{2}$",
        "correct": false
      },
      {
        "text": "$R = \\frac{a\\sqrt{3}}{3}$",
        "correct": true
      },
      {
        "text": "$R = \\frac{a}{2}$",
        "correct": false
      },
      {
        "text": "$R = a\\sqrt{3}$",
        "correct": false
      }
    ],
    "explanation": "Đường cao tam giác đều là $h = \\frac{a\\sqrt{3}}{2}$. Bán kính ngoại tiếp là $R = \\frac{2}{3} h = \\frac{2}{3} \\cdot \\frac{a\\sqrt{3}}{2} = \\frac{a\\sqrt{3}}{3}$.",
    "pts": 20
  },
  {
    "id": "q8",
    "title": "Câu 8: Đi qua ba điểm thẳng hàng",
    "question": "Có thể vẽ được bao nhiêu đường tròn đi qua ba điểm thẳng hàng?",
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
    "explanation": "Không thể vẽ được đường tròn nào đi qua ba điểm thẳng hàng vì các đường trung trực song song với nhau, không có giao điểm.",
    "pts": 20
  },
  {
    "id": "q9",
    "title": "Câu 9: Bán kính đường tròn ngoại tiếp tam giác vuông cụ thể",
    "question": "Cho tam giác $ABC$ vuông tại $A$ có $AB = 6$ cm, $AC = 8$ cm. Bán kính đường tròn ngoại tiếp tam giác là:",
    "options": [
      {
        "text": "$10$ cm",
        "correct": false
      },
      {
        "text": "$5$ cm",
        "correct": true
      },
      {
        "text": "$4$ cm",
        "correct": false
      },
      {
        "text": "$7$ cm",
        "correct": false
      }
    ],
    "explanation": "Theo định lí Pythagore, cạnh huyền $BC = \\sqrt{6^2 + 8^2} = 10$ cm. Bán kính ngoại tiếp là $R = \\frac{BC}{2} = 5$ cm.",
    "pts": 20
  },
  {
    "id": "q10",
    "title": "Câu 10: Tứ giác nội tiếp nhận biết qua tâm",
    "question": "Cho hình chữ nhật $ABCD$ có giao điểm hai đường chéo là $O$. Khẳng định nào sau đây đúng?",
    "options": [
      {
        "text": "Bốn điểm $A, B, C, D$ cùng thuộc đường tròn tâm $O$",
        "correct": true
      },
      {
        "text": "Chỉ có ba điểm thuộc đường tròn tâm $O$",
        "correct": false
      },
      {
        "text": "Tâm đường tròn là đỉnh $A$",
        "correct": false
      },
      {
        "text": "Không có đường tròn nào đi qua cả 4 đỉnh",
        "correct": false
      }
    ],
    "explanation": "Trong hình chữ nhật $ABCD$, hai đường chéo bằng nhau và cắt nhau tại trung điểm $O$ của mỗi đường, nên $OA = OB = OC = OD$. Vậy bốn đỉnh cùng thuộc đường tròn $(O; OA)$.",
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
    
                const pcCanvas = document.getElementById('pointCircleCanvas');
                const pcCtx = pcCanvas.getContext('2d');
                const rngR = document.getElementById('rngR');
                const rngOM = document.getElementById('rngOM');

                function updatePC() {
                    const r = parseFloat(rngR.value);
                    const om = parseFloat(rngOM.value);
                    document.getElementById('lblR').innerText = r;
                    document.getElementById('lblOM').innerText = om;
                    document.getElementById('outR').innerText = r.toFixed(1);
                    document.getElementById('outOM').innerText = om.toFixed(1);

                    const outPos = document.getElementById('outPos');
                    if (Math.abs(om - r) < 0.05) {
                        outPos.innerText = 'Điểm M nằm TRÊN đường tròn (OM = R)';
                        outPos.style.background = '#f59e0b';
                    } else if (om < r) {
                        outPos.innerText = 'Điểm M nằm TRONG đường tròn (OM < R)';
                        outPos.style.background = '#10b981';
                    } else {
                        outPos.innerText = 'Điểm M nằm NGOÀI đường tròn (OM > R)';
                        outPos.style.background = '#ef4444';
                    }

                    pcCtx.clearRect(0, 0, pcCanvas.width, pcCanvas.height);
                    const cx = pcCanvas.width / 2;
                    const cy = pcCanvas.height / 2;
                    const scale = 22;

                    // Draw circle (O; R)
                    pcCtx.beginPath();
                    pcCtx.arc(cx, cy, r * scale, 0, Math.PI * 2);
                    pcCtx.fillStyle = 'rgba(99, 102, 241, 0.1)';
                    pcCtx.fill();
                    pcCtx.strokeStyle = '#818cf8';
                    pcCtx.lineWidth = 3;
                    pcCtx.stroke();

                    // Center O
                    pcCtx.beginPath();
                    pcCtx.arc(cx, cy, 4, 0, Math.PI * 2);
                    pcCtx.fillStyle = '#ffffff';
                    pcCtx.fill();
                    pcCtx.font = 'bold 13px Inter, sans-serif';
                    pcCtx.fillText('O', cx - 15, cy - 8);

                    // Point M on angle 30 deg
                    const ang = -0.5;
                    const mx = cx + om * scale * Math.cos(ang);
                    const my = cy + om * scale * Math.sin(ang);

                    // Line OM
                    pcCtx.beginPath();
                    pcCtx.setLineDash([4, 4]);
                    pcCtx.moveTo(cx, cy);
                    pcCtx.lineTo(mx, my);
                    pcCtx.strokeStyle = '#fbbf24';
                    pcCtx.stroke();
                    pcCtx.setLineDash([]);

                    // Draw M
                    pcCtx.beginPath();
                    pcCtx.arc(mx, my, 6, 0, Math.PI * 2);
                    pcCtx.fillStyle = (om === r) ? '#f59e0b' : (om < r ? '#34d399' : '#f43f5e');
                    pcCtx.fill();
                    pcCtx.fillText('M', mx + 10, my - 5);
                }
                rngR.addEventListener('input', updatePC);
                rngOM.addEventListener('input', updatePC);
                updatePC();
                
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const cCanvas = document.getElementById('circumCanvas');
                const cctx = cCanvas.getContext('2d');
                const rngAx = document.getElementById('rngAx');
                const rngAy = document.getElementById('rngAy');

                function updateCircum() {
                    const ax = parseFloat(rngAx.value);
                    const ay = parseFloat(rngAy.value);
                    document.getElementById('lblAx').innerText = ax;
                    document.getElementById('lblAy').innerText = ay;

                    const bx = 90, by = 210;
                    const cx = 310, cy = 210;

                    // Compute circumcenter
                    const d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by));
                    const ux = ((ax*ax + ay*ay)*(by - cy) + (bx*bx + by*by)*(cy - ay) + (cx*cx + cy*cy)*(ay - by)) / d;
                    const uy = ((ax*ax + ay*ay)*(cx - bx) + (bx*bx + by*by)*(ax - cx) + (cx*cx + cy*cy)*(bx - ax)) / d;
                    const r = Math.hypot(ax - ux, ay - uy);

                    cctx.clearRect(0, 0, cCanvas.width, cCanvas.height);

                    // Circumcircle
                    cctx.beginPath();
                    cctx.arc(ux, uy, r, 0, Math.PI * 2);
                    cctx.strokeStyle = '#06b6d4';
                    cctx.lineWidth = 2;
                    cctx.stroke();

                    // Triangle ABC
                    cctx.beginPath();
                    cctx.moveTo(ax, ay);
                    cctx.lineTo(bx, by);
                    cctx.lineTo(cx, cy);
                    cctx.closePath();
                    cctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
                    cctx.fill();
                    cctx.strokeStyle = '#ffffff';
                    cctx.lineWidth = 2;
                    cctx.stroke();

                    // Draw Center O
                    cctx.beginPath();
                    cctx.arc(ux, uy, 5, 0, Math.PI * 2);
                    cctx.fillStyle = '#f59e0b';
                    cctx.fill();
                    cctx.fillText('O', ux + 8, uy - 6);

                    // Labels
                    cctx.fillStyle = '#ffffff';
                    cctx.font = 'bold 13px Inter, sans-serif';
                    cctx.fillText('A', ax - 5, ay - 10);
                    cctx.fillText('B', bx - 18, by + 15);
                    cctx.fillText('C', cx + 8, by + 15);
                }
                rngAx.addEventListener('input', updateCircum);
                rngAy.addEventListener('input', updateCircum);
                updateCircum();
                
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
