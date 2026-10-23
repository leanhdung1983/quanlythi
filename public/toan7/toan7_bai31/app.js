// ================================================================
// BÀI 31: QUAN HỆ GIỮA GÓC VÀ CẠNH ĐỐI DIỆN TRONG MỘT TAM GIÁC - TOÁN 7 KNTT
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
  ["\\cap", "<mo>&#8745;</mo>"]
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
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));

  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
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
  if (window.renderMathInElement) {
    renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      strict: false
    });
  } else {
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        if (text && (text.includes('$') || text.includes('$$'))) {
          const span = document.createElement('span');
          span.innerHTML = formatMathText(text);
          node.parentNode.replaceChild(span, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
        Array.from(node.childNodes).forEach(walk);
      }
    }
    walk(root);
  }
}

// --- 1. WEB AUDIO API SYNTHESIZER ---
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type = 'sine', duration = 0.15, vol = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
  playClick() { this.playTone(600, 'sine', 0.08, 0.06); }
  playCorrect() {
    this.playTone(523.25, 'triangle', 0.12, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.12), 80);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.22, 0.15), 160);
  }
  playWrong() {
    this.playTone(280, 'sawtooth', 0.18, 0.1);
    setTimeout(() => this.playTone(220, 'sawtooth', 0.24, 0.1), 120);
  }
  playLevelUp() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'sine', 0.15, 0.12), idx * 90);
    });
  }
  playFanfare() {
    [523, 659, 783, 1046, 783, 1046].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.22, 0.15), idx * 130);
    });
  }
}
const sound = new SoundManager();

// --- 2. GAME STATE & GAMIFICATION ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Hiệp Sĩ Hình Học 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai31_state';

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {}
}

function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    if (s) {
      const p = JSON.parse(s);
      Object.assign(appState, p);
    }
  } catch (e) {}
}

function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const userEl = document.getElementById('userNameDisplay');
  const titleEl = document.getElementById('userTitle');
  const avatarEl = document.getElementById('avatarBtn');
  const soundEl = document.getElementById('soundToggle');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (userEl) userEl.textContent = `${appState.userName} 🌟`;
  if (titleEl) titleEl.textContent = appState.userTitle;
  if (avatarEl) avatarEl.textContent = appState.avatar;
  if (soundEl) soundEl.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';

  // Cấp độ sao
  let starStr = '⭐☆☆☆☆';
  if (appState.xp >= 200) starStr = '⭐⭐⭐⭐⭐';
  else if (appState.xp >= 160) starStr = '⭐⭐⭐⭐☆';
  else if (appState.xp >= 100) starStr = '⭐⭐⭐☆☆';
  else if (appState.xp >= 40) starStr = '⭐⭐☆☆☆';
  if (starEl) starEl.textContent = starStr;

  // Cập nhật huy hiệu
  for (let i = 1; i <= 5; i++) {
    const b = document.getElementById(`badge-${i}`);
    if (b) {
      if (appState.badges[i - 1]) b.classList.remove('locked');
      else b.classList.add('locked');
    }
  }

  // Tên trên chứng nhận
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
    "title": "Câu 1: So sánh góc khi biết cạnh",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có $AB = 4\\text{ cm}, BC = 6\\text{ cm}, AC = 7\\text{ cm}$. Khẳng định nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$\\widehat{B} > \\widehat{A} > \\widehat{C}$",
        "correct": true
      },
      {
        "text": "$\\widehat{A} > \\widehat{B} > \\widehat{C}$",
        "correct": false
      },
      {
        "text": "$\\widehat{C} > \\widehat{B} > \\widehat{A}$",
        "correct": false
      },
      {
        "text": "$\\widehat{B} > \\widehat{C} > \\widehat{A}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $AC > BC > AB$ ($7 > 6 > 4$). Góc đối diện với $AC$ là $\\widehat{B}$, đối diện với $BC$ là $\\widehat{A}$, đối diện với $AB$ là $\\widehat{C}$. Do đó $\\widehat{B} > \\widehat{A} > \\widehat{C}$."
  },
  {
    "id": 2,
    "title": "Câu 2: So sánh cạnh khi biết góc",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có $\\widehat{A} = 70^\\circ, \\widehat{B} = 60^\\circ$. Cạnh lớn nhất của tam giác là:",
    "options": [
      {
        "text": "Cạnh $BC$",
        "correct": true
      },
      {
        "text": "Cạnh $AC$",
        "correct": false
      },
      {
        "text": "Cạnh $AB$",
        "correct": false
      },
      {
        "text": "Không xác định được",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\widehat{C} = 180^\\circ - 70^\\circ - 60^\\circ = 50^\\circ$. Vì $\\widehat{A} = 70^\\circ$ là góc lớn nhất nên cạnh đối diện với nó là $BC$ là cạnh lớn nhất."
  },
  {
    "id": 3,
    "title": "Câu 3: Cạnh lớn nhất trong tam giác vuông",
    "pts": 20,
    "question": "Trong một tam giác vuông, cạnh nào luôn là cạnh có độ dài lớn nhất?",
    "options": [
      {
        "text": "Cạnh huyền",
        "correct": true
      },
      {
        "text": "Cạnh góc vuông lớn hơn",
        "correct": false
      },
      {
        "text": "Cạnh góc vuông nhỏ hơn",
        "correct": false
      },
      {
        "text": "Cả ba cạnh bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Góc vuông ($90^\\circ$) là góc lớn nhất trong tam giác vuông, nên cạnh đối diện với nó (cạnh huyền) là cạnh lớn nhất."
  },
  {
    "id": 4,
    "title": "Câu 4: Cạnh lớn nhất trong tam giác tù",
    "pts": 20,
    "question": "Cho $\\Delta MNP$ có $\\widehat{M} = 110^\\circ$. Cạnh lớn nhất của tam giác là:",
    "options": [
      {
        "text": "Cạnh $NP$",
        "correct": true
      },
      {
        "text": "Cạnh $MN$",
        "correct": false
      },
      {
        "text": "Cạnh $MP$",
        "correct": false
      },
      {
        "text": "Cạnh $MN$ hoặc $MP$",
        "correct": false
      }
    ],
    "explanation": "Vì $\\widehat{M} = 110^\\circ$ là góc tù nên là góc lớn nhất trong tam giác. Cạnh đối diện là $NP$ lớn nhất."
  },
  {
    "id": 5,
    "title": "Câu 5: Tam giác có hai góc bằng nhau",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có $\\widehat{B} = \\widehat{C} = 50^\\circ$. Tam giác $ABC$ là tam giác gì?",
    "options": [
      {
        "text": "Tam giác cân tại $A$",
        "correct": true
      },
      {
        "text": "Tam giác đều",
        "correct": false
      },
      {
        "text": "Tam giác vuông tại $A$",
        "correct": false
      },
      {
        "text": "Tam giác vuông cân",
        "correct": false
      }
    ],
    "explanation": "Vì $\\widehat{B} = \\widehat{C}$ nên cạnh đối diện tương ứng $AC = AB$, do đó tam giác cân tại $A$."
  },
  {
    "id": 6,
    "title": "Câu 6: So sánh góc ở tam giác đều",
    "pts": 20,
    "question": "Cho tam giác đều $DEF$. Khẳng định nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$\\widehat{D} = \\widehat{E} = \\widehat{F} = 60^\\circ$",
        "correct": true
      },
      {
        "text": "$\\widehat{D} > \\widehat{E} > \\widehat{F}$",
        "correct": false
      },
      {
        "text": "$\\widehat{D} = 90^\\circ$",
        "correct": false
      },
      {
        "text": "$\\widehat{D} + \\widehat{E} = 150^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Tam giác đều có 3 cạnh bằng nhau nên 3 góc đối diện bằng nhau và mỗi góc bằng $180^\\circ : 3 = 60^\\circ$."
  },
  {
    "id": 7,
    "title": "Câu 7: So sánh cạnh tam giác tù",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có $\\widehat{A} = 100^\\circ, \\widehat{B} = 40^\\circ$. Khẳng định nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$BC > AC = AB$",
        "correct": true
      },
      {
        "text": "$BC > AB > AC$",
        "correct": false
      },
      {
        "text": "$AB > BC > AC$",
        "correct": false
      },
      {
        "text": "$AC > AB > BC$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\widehat{C} = 180^\\circ - 100^\\circ - 40^\\circ = 40^\\circ$. Vì $\\widehat{B} = \\widehat{C} = 40^\\circ < 100^\\circ$ nên $AC = AB$ và $BC$ lớn nhất. Vậy $BC > AC = AB$."
  },
  {
    "id": 8,
    "title": "Câu 8: Cạnh đối diện góc nhỏ nhất",
    "pts": 20,
    "question": "Trong $\\Delta ABC$, góc đối diện với cạnh nhỏ nhất là:",
    "options": [
      {
        "text": "Góc nhỏ nhất",
        "correct": true
      },
      {
        "text": "Góc lớn nhất",
        "correct": false
      },
      {
        "text": "Góc vuông",
        "correct": false
      },
      {
        "text": "Góc tù",
        "correct": false
      }
    ],
    "explanation": "Theo định lí góc đối diện với cạnh nhỏ hơn là góc nhỏ hơn."
  },
  {
    "id": 9,
    "title": "Câu 9: Bán kính và góc ở tâm",
    "pts": 20,
    "question": "Cho tam giác $ABC$ có $AB < AC$. Kẻ phân giác $AD$ ($D \\in BC$). Khi đó:",
    "options": [
      {
        "text": "$\\widehat{ADB} < \\widehat{ADC}$",
        "correct": true
      },
      {
        "text": "$\\widehat{ADB} > \\widehat{ADC}$",
        "correct": false
      },
      {
        "text": "$\\widehat{ADB} = \\widehat{ADC}$",
        "correct": false
      },
      {
        "text": "$\\widehat{ADB} = 90^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Vì $AB < AC$ nên $\\widehat{C} < \\widehat{B}$. Ta có $\\widehat{ADB} = \\widehat{C} + \\frac{\\widehat{A}}{2} < \\widehat{B} + \\frac{\\widehat{A}}{2} = \\widehat{ADC}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Nhận định tổng quát",
    "pts": 20,
    "question": "Trong một tam giác tù, khẳng định nào sau đây là SAI?",
    "options": [
      {
        "text": "Cạnh đối diện góc tù có thể ngắn hơn một cạnh góc vuông",
        "correct": true
      },
      {
        "text": "Góc tù luôn là góc lớn nhất",
        "correct": false
      },
      {
        "text": "Cạnh đối diện góc tù luôn dài nhất",
        "correct": false
      },
      {
        "text": "Hai góc còn lại luôn là góc nhọn",
        "correct": false
      }
    ],
    "explanation": "Trong tam giác tù, cạnh đối diện với góc tù luôn là cạnh dài nhất của tam giác đó."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let answeredCount = 0;
  let correctCount = 0;

  quizData.forEach((q, qIndex) => {
    const isAnswered = appState.answered[q.id] !== undefined;
    const userAnswer = appState.answered[q.id];
    if (isAnswered) {
      answeredCount++;
      if (q.options[userAnswer] && q.options[userAnswer].correct) correctCount++;
    }

    const card = document.createElement('div');
    card.className = 'quiz-card';
    if (q.question && (q.question.includes('<table') || q.question.includes('quiz-table') || q.question.length > 250)) {
      card.classList.add('full-width');
    }

    // Header câu hỏi
    const qHeader = document.createElement('div');
    qHeader.className = 'quiz-card-header';
    qHeader.innerHTML = `<span><strong>${q.title || ('Câu ' + (qIndex + 1))}</strong></span><span class="quiz-badge">+${q.pts || 20} XP</span>`;
    card.appendChild(qHeader);

    // Nội dung câu hỏi
    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    // Danh sách đáp án nút
    const optList = document.createElement('div');
    optList.className = 'quiz-options';
    const labels = ['A', 'B', 'C', 'D'];

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;

      if (isAnswered) {
        btn.disabled = true;
        if (opt.correct) btn.classList.add('correct');
        if (userAnswer === optIndex && !opt.correct) btn.classList.add('wrong');
      } else {
        btn.onclick = () => selectAnswer(q.id, optIndex, opt.correct, q.pts || 20);
      }
      optList.appendChild(btn);
    });
    card.appendChild(optList);

    // Giải thích chi tiết
    if (isAnswered) {
      const explanation = document.createElement('div');
      explanation.className = 'explanation-box show';
      explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;
      card.appendChild(explanation);
    }

    container.appendChild(card);
  });

  // Cập nhật tiến độ Arena
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progEl) progEl.textContent = `${answeredCount}/${quizData.length}`;
  if (scoreEl) scoreEl.textContent = `${appState.xp} XP`;

  // Mở khóa Huy hiệu 4 & 5
  if (appState.xp >= 160) unlockBadge(3);
  if (correctCount === quizData.length && quizData.length > 0) {
    unlockBadge(4);
    if (!appState.badges[4]) sound.playFanfare();
  }

  // Quét KaTeX
  renderMathInTree(container);
}

function selectAnswer(qid, optIndex, isCorrect, pts) {
  if (appState.answered[qid] !== undefined) return;
  sound.init();

  appState.answered[qid] = optIndex;
  if (isCorrect) {
    appState.xp += pts;
    appState.streak += 1;
    sound.playCorrect();
    if (appState.streak >= 5) unlockBadge(2);
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
      if (target === 'labs') unlockBadge(1);

      if (pane) renderMathInTree(pane);
    });
  });
}

function initAvatarModal() {
  const modal = document.getElementById('avatarModal');
  const avatarBtn = document.getElementById('avatarBtn');
  const closeBtn = document.getElementById('btnCloseModal');
  const choices = document.querySelectorAll('.avatar-choice');

  if (!modal || !avatarBtn) return;

  avatarBtn.addEventListener('click', () => {
    sound.playClick();
    modal.style.display = 'flex';
  });

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
    
const canvas1 = document.getElementById('labCanvas1');
if (canvas1) {
  const ctx = canvas1.getContext('2d');
  const slider = document.getElementById('lab1A');
  const lbl = document.getElementById('lab1ValA');

  function draw(ax) {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('QUAN HỆ GIỮA GÓC VÀ CẠNH ĐỐI DIỆN', canvas1.width / 2, 28);

    const bx = 80, by = 180;
    const cx = 360, cy = 180;
    const ay = 60;

    // Vẽ tam giác ABC
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
    ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.fill();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Điểm và nhãn
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('A', ax, ay - 10);
    ctx.fillText('B', bx - 15, by + 5);
    ctx.fillText('C', cx + 15, cy + 5);

    // Tính độ dài các cạnh
    const cAB = Math.hypot(ax - bx, ay - by);
    const cAC = Math.hypot(ax - cx, ay - cy);

    // Hiển thị số liệu
    ctx.textAlign = 'left';
    ctx.font = '15px sans-serif';
    const tx = 390;

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`• Cạnh AB = ${Math.round(cAB / 10)} cm`, tx, 80);
    ctx.fillStyle = '#10b981';
    ctx.fillText(`• Cạnh AC = ${Math.round(cAC / 10)} cm`, tx, 115);

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#38bdf8';
    if (cAC > cAB) {
      ctx.fillText(`Vì AC > AB`, tx, 155);
      ctx.fillStyle = '#10b981';
      ctx.fillText(`=> Góc B > Góc C (Định lí 1) ✓`, tx, 185);
    } else if (cAC < cAB) {
      ctx.fillText(`Vì AB > AC`, tx, 155);
      ctx.fillStyle = '#10b981';
      ctx.fillText(`=> Góc C > Góc B (Định lí 1) ✓`, tx, 185);
    } else {
      ctx.fillText(`Vì AB = AC => Tam giác cân`, tx, 155);
      ctx.fillText(`=> Góc B = Góc C`, tx, 185);
    }
  }

  if (slider) {
    slider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      if (lbl) lbl.textContent = `x = ${v}`;
      draw(v);
    });
    draw(parseInt(slider.value));
  }
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');

  function draw2() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('TAM GIÁC VUÔNG: CẠNH HUYỀN LÀ CẠNH LỚN NHẤT', canvas2.width / 2, 28);

    const ax = 120, ay = 180;
    const bx = 120, by = 60;
    const cx = 320, cy = 180;

    // Tam giác vuông tại A
    ctx2.beginPath();
    ctx2.moveTo(ax, ay);
    ctx2.lineTo(bx, by);
    ctx2.lineTo(cx, cy);
    ctx2.closePath();
    ctx2.fillStyle = 'rgba(16, 185, 129, 0.2)';
    ctx2.fill();
    ctx2.strokeStyle = '#10b981';
    ctx2.lineWidth = 3;
    ctx2.stroke();

    // Kí hiệu góc vuông tại A
    ctx2.strokeRect(ax, ay - 18, 18, 18);

    ctx2.fillStyle = '#fff';
    ctx2.font = 'bold 15px sans-serif';
    ctx2.fillText('A (90°)', ax - 30, ay + 15);
    ctx2.fillText('B', bx, by - 10);
    ctx2.fillText('C', cx + 15, cy + 5);

    // Kích thước mẫu: 3, 4, 5
    ctx2.fillStyle = '#cbd5e1';
    ctx2.font = '13px sans-serif';
    ctx2.fillText('AB = 3 cm', ax - 40, 125);
    ctx2.fillText('AC = 4 cm', 220, ay + 20);
    ctx2.fillStyle = '#f59e0b';
    ctx2.font = 'bold 14px sans-serif';
    ctx2.fillText('Huyền BC = 5 cm', 235, 110);

    // Giải thích
    ctx2.textAlign = 'left';
    ctx2.font = '15px sans-serif';
    const tx = 360;
    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText('LÝ LUẬN HÌNH HỌC:', tx, 80);
    ctx2.fillStyle = '#cbd5e1';
    ctx2.fillText('• Góc A = 90° (góc lớn nhất)', tx, 110);
    ctx2.fillText('• Góc B, C nhọn (< 90°)', tx, 140);
    ctx2.fillStyle = '#10b981';
    ctx2.font = 'bold 15px sans-serif';
    ctx2.fillText('=> Cạnh đối diện góc A là', tx, 175);
    ctx2.fillText('   huyền BC LỚN NHẤT! ✓', tx, 200);
  }

  const btn = document.getElementById('btnLab2Right');
  if (btn) btn.onclick = draw2;
  draw2();
}

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
