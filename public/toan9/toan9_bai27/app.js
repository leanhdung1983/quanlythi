// ================================================================
// Bài 27: Góc Nội Tiếp - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai27_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Hiệp Sĩ Cung Tròn 9',
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
    "title": "Câu 1: Định nghĩa góc nội tiếp",
    "pts": 20,
    "question": "Góc nội tiếp là góc có đặc điểm nào sau đây?",
    "options": [
      {
        "text": "Đỉnh nằm trên đường tròn và hai cạnh chứa hai dây cung",
        "correct": true
      },
      {
        "text": "Đỉnh là tâm đường tròn",
        "correct": false
      },
      {
        "text": "Đỉnh nằm ngoài đường tròn",
        "correct": false
      },
      {
        "text": "Hai cạnh là hai tiếp tuyến của đường tròn",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa chuẩn: Góc nội tiếp là góc có đỉnh nằm trên đường tròn và hai cạnh chứa hai dây cung của đường tròn đó."
  },
  {
    "id": 2,
    "title": "Câu 2: Số đo góc nội tiếp theo góc ở tâm",
    "pts": 20,
    "question": "Cho góc ở tâm $\\widehat{BOC} = 80^\\circ$. Góc nội tiếp $\\widehat{BAC}$ cùng chắn cung nhỏ $BC$ có số đo là:",
    "options": [
      {
        "text": "$40^\\circ$",
        "correct": true
      },
      {
        "text": "$80^\\circ$",
        "correct": false
      },
      {
        "text": "$160^\\circ$",
        "correct": false
      },
      {
        "text": "$20^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Số đo góc nội tiếp bằng nửa góc ở tâm cùng chắn cung: $\\widehat{BAC} = \\frac{1}{2} \\cdot 80^\\circ = 40^\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Góc nội tiếp chắn nửa đường tròn",
    "pts": 20,
    "question": "Cho tam giác $ABC$ nội tiếp đường tròn $(O)$ có cạnh $BC$ là đường kính. Số đo của góc $\\widehat{BAC}$ là:",
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
    "explanation": "Góc nội tiếp chắn nửa đường tròn luôn là góc vuông ($90^\\circ$)."
  },
  {
    "id": 4,
    "title": "Câu 4: Các góc nội tiếp cùng chắn một cung",
    "pts": 20,
    "question": "Cho hai điểm $A, D$ cùng nằm trên đường tròn $(O)$ và cùng nhìn cung $BC$. Khẳng định nào sau đây là ĐÚNG?",
    "options": [
      {
        "text": "$\\widehat{BAC} = \\widehat{BDC}$",
        "correct": true
      },
      {
        "text": "$\\widehat{BAC} + \\widehat{BDC} = 180^\\circ$",
        "correct": false
      },
      {
        "text": "$\\widehat{BAC} = 2\\widehat{BDC}$",
        "correct": false
      },
      {
        "text": "$\\widehat{BAC} + \\widehat{BDC} = 90^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Trong một đường tròn, các góc nội tiếp cùng chắn một cung thì bằng nhau."
  },
  {
    "id": 5,
    "title": "Câu 5: Tính góc ở tâm từ góc nội tiếp",
    "pts": 20,
    "question": "Cho góc nội tiếp $\\widehat{MAN} = 55^\\circ$. Số đo của cung nhỏ $\\overparen{MN}$ bị chắn bằng:",
    "options": [
      {
        "text": "$110^\\circ$",
        "correct": true
      },
      {
        "text": "$55^\\circ$",
        "correct": false
      },
      {
        "text": "$27,5^\\circ$",
        "correct": false
      },
      {
        "text": "$125^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Số đo cung bị chắn gấp đôi số đo góc nội tiếp: $\\text{sđ}\\overparen{MN} = 2 \\times 55^\\circ = 110^\\circ$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tam giác vuông nội tiếp",
    "pts": 20,
    "question": "Tam giác $MNP$ vuông tại $M$ có $MN = 6$ cm, $MP = 8$ cm nội tiếp đường tròn $(O; R)$. Bán kính $R$ bằng:",
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
    "explanation": "Cạnh huyền $NP = \\sqrt{6^2 + 8^2} = 10$ cm. Vì tam giác vuông nên cạnh huyền chính là đường kính của đường tròn ngoại tiếp: $2R = 10 \\implies R = 5$ cm."
  },
  {
    "id": 7,
    "title": "Câu 7: Góc nội tiếp tù",
    "pts": 20,
    "question": "Góc nội tiếp chắn cung có số đo bằng $240^\\circ$ thì có số đo bằng:",
    "options": [
      {
        "text": "$120^\\circ$",
        "correct": true
      },
      {
        "text": "$240^\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$80^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Số đo góc nội tiếp $= \\frac{1}{2} \\times 240^\\circ = 120^\\circ$."
  },
  {
    "id": 8,
    "title": "Câu 8: Cung bị chắn bởi góc 60 độ",
    "pts": 20,
    "question": "Một tam giác đều $ABC$ nội tiếp đường tròn $(O)$. Số đo của mỗi cung nhỏ $AB, BC, CA$ là:",
    "options": [
      {
        "text": "$120^\\circ$",
        "correct": true
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Góc nội tiếp của tam giác đều bằng $60^\\circ$, do đó mỗi cung bị chắn có số đo bằng $2 \\times 60^\\circ = 120^\\circ$ (chia đường tròn thành 3 cung bằng nhau: $360^\\circ : 3 = 120^\\circ$)."
  },
  {
    "id": 9,
    "title": "Câu 9: Điểm đối diện trên đường kính",
    "pts": 20,
    "question": "Cho đoạn thẳng $AB$ là đường kính của $(O)$ và điểm $C$ thuộc $(O)$ ($C \\ne A, B$). Khi đó tam giác $ABC$ là:",
    "options": [
      {
        "text": "Tam giác vuông tại $C$",
        "correct": true
      },
      {
        "text": "Tam giác đều",
        "correct": false
      },
      {
        "text": "Tam giác cân tại $C$",
        "correct": false
      },
      {
        "text": "Tam giác vuông tại $A$",
        "correct": false
      }
    ],
    "explanation": "Góc $\\widehat{ACB}$ chắn nửa đường tròn đường kính $AB$ nên $\\widehat{ACB} = 90^\\circ$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tứ giác có 2 đỉnh cùng nhìn một cạnh",
    "pts": 20,
    "question": "Nếu hai điểm $P$ và $Q$ cùng nằm trên một nửa mặt phẳng bờ chứa đoạn thẳng $AB$ và $\\widehat{APB} = \\widehat{AQB} = 90^\\circ$ thì 4 điểm $A, B, P, Q$ cùng thuộc đường tròn đường kính:",
    "options": [
      {
        "text": "$AB$",
        "correct": true
      },
      {
        "text": "$PQ$",
        "correct": false
      },
      {
        "text": "$AP$",
        "correct": false
      },
      {
        "text": "$BQ$",
        "correct": false
      }
    ],
    "explanation": "Cả hai điểm $P, Q$ đều nhìn đoạn thẳng $AB$ dưới một góc vuông, do đó chúng cùng nằm trên đường tròn đường kính $AB$."
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
                const slA = document.getElementById('slAngA');
                const slBOC = document.getElementById('slAngBOC');
                const vA = document.getElementById('vAngA');
                const vBOC = document.getElementById('vAngBOC');
                const out1 = document.getElementById('lab1Output');

                function drawInscribed() {
                    const angADeg = parseFloat(slA.value);
                    const bocDeg = parseFloat(slBOC.value);
                    vA.textContent = angADeg + '°';
                    vBOC.textContent = bocDeg + '°';

                    const cw = c1.width;
                    const ch = c1.height;
                    const ox = cw / 2;
                    const oy = ch / 2 + 10;
                    const R = 110;

                    ctx.clearRect(0, 0, cw, ch);

                    // Circle (O; R)
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(ox, oy, R, 0, Math.PI * 2); ctx.stroke();

                    // Center O
                    ctx.fillStyle = '#f8fafc';
                    ctx.beginPath(); ctx.arc(ox, oy, 4, 0, Math.PI * 2); ctx.fill();
                    ctx.font = '12px sans-serif';
                    ctx.fillText('O', ox + 6, oy - 6);

                    // Chord BC symmetrically at bottom
                    const halfBOC = (bocDeg / 2) * (Math.PI / 180);
                    const angB = Math.PI / 2 + halfBOC;
                    const angC = Math.PI / 2 - halfBOC;

                    const bx = ox + R * Math.cos(angB);
                    const by = oy + R * Math.sin(angB);
                    const cx = ox + R * Math.cos(angC);
                    const cy = oy + R * Math.sin(angC);

                    // Vertex A on top arc
                    const angARad = - (angADeg * Math.PI) / 180;
                    const ax = ox + R * Math.cos(angARad);
                    const ay = oy + R * Math.sin(angARad);

                    // Central Angle BOC lines (dashed orange)
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.moveTo(ox, oy); ctx.lineTo(bx, by);
                    ctx.moveTo(ox, oy); ctx.lineTo(cx, cy);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Inscribed Angle BAC lines (cyan solid)
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
                    ctx.lineTo(cx, cy); ctx.closePath();
                    ctx.stroke();

                    // Chord BC (amber)
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(cx, cy); ctx.stroke();

                    // Draw Points
                    const pts = [
                        { name: `A (${(bocDeg/2).toFixed(1)}°)`, x: ax, y: ay, c: '#06b6d4' },
                        { name: 'B', x: bx, y: by, c: '#f59e0b' },
                        { name: 'C', x: cx, y: cy, c: '#f59e0b' }
                    ];

                    pts.forEach(p => {
                        ctx.fillStyle = p.c;
                        ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
                        ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px sans-serif';
                        ctx.fillText(p.name, p.x - 10, p.y - 10);
                    });

                    const inscribedVal = bocDeg / 2;
                    out1.innerHTML = `<strong>Góc ở tâm:</strong> $\\widehat{BOC} = ${bocDeg}^\\circ$ | <strong>Góc nội tiếp:</strong> $\\widehat{BAC} = \\frac{1}{2}\\widehat{BOC} = ${inscribedVal.toFixed(1)}^\\circ$. Kéo đỉnh A di chuyển trên cung lớn, góc $\\widehat{BAC}$ luôn giữ nguyên giá trị!`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slA.addEventListener('input', drawInscribed);
                slBOC.addEventListener('input', drawInscribed);
                drawInscribed();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const slT = document.getElementById('slThales');
                const vT = document.getElementById('vThales');
                const out2 = document.getElementById('lab2Output');

                function drawThales() {
                    const deg = parseFloat(slT.value);
                    vT.textContent = deg + '°';

                    const cw = c2.width;
                    const ch = c2.height;
                    const ox = cw / 2;
                    const oy = ch / 2 + 20;
                    const R = 110;

                    ctx2.clearRect(0, 0, cw, ch);

                    // Circle (O)
                    ctx2.strokeStyle = '#334155';
                    ctx2.lineWidth = 2;
                    ctx2.beginPath(); ctx2.arc(ox, oy, R, 0, Math.PI * 2); ctx2.stroke();

                    // Diameter BC horizontal
                    const bx = ox - R;
                    const by = oy;
                    const cx = ox + R;
                    const cy = oy;

                    ctx2.strokeStyle = '#f59e0b';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath(); ctx2.moveTo(bx, by); ctx2.lineTo(cx, cy); ctx2.stroke();

                    // Point A on top semicircle
                    const rad = (deg * Math.PI) / 180;
                    const ax = ox - R * Math.cos(rad);
                    const ay = oy - R * Math.sin(rad);

                    // Triangle ABC
                    ctx2.strokeStyle = '#38bdf8';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath();
                    ctx2.moveTo(bx, by);
                    ctx2.lineTo(ax, ay);
                    ctx2.lineTo(cx, cy);
                    ctx2.stroke();

                    // Fill triangle translucent
                    ctx2.fillStyle = 'rgba(56, 189, 248, 0.12)';
                    ctx2.beginPath();
                    ctx2.moveTo(bx, by); ctx2.lineTo(ax, ay); ctx2.lineTo(cx, cy); ctx2.closePath();
                    ctx2.fill();

                    // Right angle marker at A
                    const uAB = { x: (bx - ax), y: (by - ay) };
                    const lenAB = Math.hypot(uAB.x, uAB.y);
                    uAB.x /= lenAB; uAB.y /= lenAB;

                    const uAC = { x: (cx - ax), y: (cy - ay) };
                    const lenAC = Math.hypot(uAC.x, uAC.y);
                    uAC.x /= lenAC; uAC.y /= lenAC;

                    const mSize = 14;
                    const p1 = { x: ax + uAB.x * mSize, y: ay + uAB.y * mSize };
                    const p2 = { x: p1.x + uAC.x * mSize, y: p1.y + uAC.y * mSize };
                    const p3 = { x: ax + uAC.x * mSize, y: ay + uAC.y * mSize };

                    ctx2.strokeStyle = '#ef4444';
                    ctx2.lineWidth = 2;
                    ctx2.beginPath();
                    ctx2.moveTo(p1.x, p1.y); ctx2.lineTo(p2.x, p2.y); ctx2.lineTo(p3.x, p3.y);
                    ctx2.stroke();

                    // Labels
                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 14px sans-serif';
                    ctx2.fillText('B', bx - 18, by + 5);
                    ctx2.fillText('C', cx + 8, cy + 5);
                    ctx2.fillText('A (90°)', ax - 16, ay - 12);
                    ctx2.fillText('O', ox - 5, oy + 20);

                    out2.innerHTML = `<strong>Hệ quả Thales:</strong> Đoạn thẳng $BC$ là đường kính đường tròn $(O)$. Với mọi điểm $A \\ne B, C$ thuộc đường tròn, góc nội tiếp $\\widehat{BAC} = 90^\\circ$ (tam giác $ABC$ vuông tại $A$).`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slT.addEventListener('input', drawThales);
                drawThales();
            
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
