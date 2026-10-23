// ================================================================
// BÀI 10: TỨ GIÁC - TOÁN 8 KNTT
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
  s = s.replace(/\\mathbf\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="bold">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\mathrm\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="normal">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\mathit\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="italic">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\widehat\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>^</mo></mover>'));
  s = s.replace(/\\circ/g, savePlaceholder('<mo>&#176;</mo>'));
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\vec\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
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
    renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      strict: false
    });
  } else {
    // Fallback MathML
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && (n.nodeValue.includes('$') || n.nodeValue.includes('$$'))) {
        nodes.push(n);
      }
    }
    nodes.forEach(node => {
      const span = document.createElement('span');
      span.innerHTML = formatMathText(node.nodeValue);
      if (node.parentNode) node.parentNode.replaceChild(span, node);
    });
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
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.ctx = new AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type = 'sine', duration = 0.15, vol = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
  playClick() { this.playTone(600, 'sine', 0.05, 0.08); }
  playCorrect() {
    this.playTone(523.25, 'triangle', 0.1, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.18, 0.12), 80);
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
  userTitle: 'Nhà Thám Hiểm Tứ Giác 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai10_state';

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
    "title": "Thử Thách 1: Định Lí Tổng 4 Góc Tứ Giác",
    "pts": 20,
    "question": "Tổng bốn góc trong một tứ giác bất kì luôn bằng:",
    "options": [
      {
        "text": "$360^{\\circ}$",
        "correct": true
      },
      {
        "text": "$180^{\\circ}$",
        "correct": false
      },
      {
        "text": "$270^{\\circ}$",
        "correct": false
      },
      {
        "text": "$720^{\\circ}$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí cơ bản của hình học tứ giác, tổng số đo bốn góc của một tứ giác luôn bằng $360^{\\circ}$."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Tính Góc Thứ Tư",
    "pts": 20,
    "question": "Cho tứ giác $ABCD$ có $\\widehat{A} = 70^{\\circ}, \\widehat{B} = 80^{\\circ}, \\widehat{C} = 100^{\\circ}$. Số đo của góc $\\widehat{D}$ là:",
    "options": [
      {
        "text": "$110^{\\circ}$",
        "correct": true
      },
      {
        "text": "$100^{\\circ}$",
        "correct": false
      },
      {
        "text": "$90^{\\circ}$",
        "correct": false
      },
      {
        "text": "$120^{\\circ}$",
        "correct": false
      }
    ],
    "explanation": "$\\widehat{D} = 360^{\\circ} - (70^{\\circ} + 80^{\\circ} + 100^{\\circ}) = 360^{\\circ} - 250^{\\circ} = 110^{\\circ}$."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Nhận Dạng Tứ Giác Lồi",
    "pts": 20,
    "question": "Tứ giác lồi là tứ giác thỏa mãn điều kiện nào sau đây?",
    "options": [
      {
        "text": "Luôn nằm trong một nửa mặt phẳng có bờ là đường thẳng chứa bất kì cạnh nào",
        "correct": true
      },
      {
        "text": "Có 4 góc bằng nhau",
        "correct": false
      },
      {
        "text": "Có 4 cạnh bằng nhau",
        "correct": false
      },
      {
        "text": "Có 2 đường chéo vuông góc",
        "correct": false
      }
    ],
    "explanation": "Đó chính là định nghĩa chuẩn của tứ giác lồi theo SGK."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Số Góc Tù Tối Đa",
    "pts": 20,
    "question": "Một tứ giác có thể có nhiều nhất bao nhiêu góc tù?",
    "options": [
      {
        "text": "$3$ góc tù",
        "correct": true
      },
      {
        "text": "$4$ góc tù",
        "correct": false
      },
      {
        "text": "$2$ góc tù",
        "correct": false
      },
      {
        "text": "$1$ góc tù",
        "correct": false
      }
    ],
    "explanation": "Nếu có 4 góc tù thì mỗi góc $> 90^{\\circ} \\implies$ tổng 4 góc $> 360^{\\circ}$ (vô lí). Do đó chỉ có thể có nhiều nhất 3 góc tù."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Số Góc Nhọn Tối Đa",
    "pts": 20,
    "question": "Một tứ giác có thể có nhiều nhất bao nhiêu góc nhọn?",
    "options": [
      {
        "text": "$3$ góc nhọn",
        "correct": true
      },
      {
        "text": "$4$ góc nhọn",
        "correct": false
      },
      {
        "text": "$2$ góc nhọn",
        "correct": false
      },
      {
        "text": "$1$ góc nhọn",
        "correct": false
      }
    ],
    "explanation": "Nếu cả 4 góc đều nhọn thì tổng 4 góc $< 360^{\\circ}$ (vô lí). Vậy tứ giác có nhiều nhất 3 góc nhọn."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Tỉ Lệ Các Góc",
    "pts": 20,
    "question": "Tứ giác $ABCD$ có các góc $\\widehat{A}, \\widehat{B}, \\widehat{C}, \\widehat{D}$ tỉ lệ với $1 : 2 : 3 : 4$. Số đo của góc lớn nhất là:",
    "options": [
      {
        "text": "$144^{\\circ}$",
        "correct": true
      },
      {
        "text": "$120^{\\circ}$",
        "correct": false
      },
      {
        "text": "$108^{\\circ}$",
        "correct": false
      },
      {
        "text": "$160^{\\circ}$",
        "correct": false
      }
    ],
    "explanation": "Tổng số phần: $1 + 2 + 3 + 4 = 10$. Mỗi phần là $360^{\\circ} : 10 = 36^{\\circ}$. Góc lớn nhất ứng với 4 phần: $36^{\\circ} \\cdot 4 = 144^{\\circ}$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Góc Ngoài Của Tứ Giác",
    "pts": 20,
    "question": "Góc kề bù với một góc trong của tứ giác được gọi là:",
    "options": [
      {
        "text": "Góc ngoài của tứ giác",
        "correct": true
      },
      {
        "text": "Góc đối đỉnh",
        "correct": false
      },
      {
        "text": "Góc so le trong",
        "correct": false
      },
      {
        "text": "Góc đồng vị",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa: Góc ngoài của tứ giác là góc kề bù với một góc trong của tứ giác đó."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Tổng Các Góc Ngoài",
    "pts": 20,
    "question": "Tổng bốn góc ngoài (mỗi đỉnh lấy một góc ngoài) của một tứ giác lồi bằng:",
    "options": [
      {
        "text": "$360^{\\circ}$",
        "correct": true
      },
      {
        "text": "$180^{\\circ}$",
        "correct": false
      },
      {
        "text": "$720^{\\circ}$",
        "correct": false
      },
      {
        "text": "$540^{\\circ}$",
        "correct": false
      }
    ],
    "explanation": "Tổng 4 cặp góc kề bù là $4 \\cdot 180^{\\circ} = 720^{\\circ}$. Trừ đi tổng 4 góc trong ($360^{\\circ}$), tổng 4 góc ngoài là $720^{\\circ} - 360^{\\circ} = 360^{\\circ}$."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Tính Góc Khi Biết Mối Quan Hệ",
    "pts": 20,
    "question": "Tứ giác $ABCD$ có $\\widehat{A} = 65^{\\circ}, \\widehat{B} = 115^{\\circ}, \\widehat{C} = 2\\widehat{D}$. Số đo góc $\\widehat{D}$ là:",
    "options": [
      {
        "text": "$60^{\\circ}$",
        "correct": true
      },
      {
        "text": "$120^{\\circ}$",
        "correct": false
      },
      {
        "text": "$80^{\\circ}$",
        "correct": false
      },
      {
        "text": "$90^{\\circ}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\widehat{C} + \\widehat{D} = 360^{\\circ} - (65^{\\circ} + 115^{\\circ}) = 180^{\\circ}$. Vì $\\widehat{C} = 2\\widehat{D} \\implies 3\\widehat{D} = 180^{\\circ} \\implies \\widehat{D} = 60^{\\circ}$."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Tứ Giác Có 4 Góc Bằng Nhau",
    "pts": 20,
    "question": "Nếu một tứ giác có bốn góc bằng nhau thì mỗi góc có số đo là:",
    "options": [
      {
        "text": "$90^{\\circ}$",
        "correct": true
      },
      {
        "text": "$60^{\\circ}$",
        "correct": false
      },
      {
        "text": "$120^{\\circ}$",
        "correct": false
      },
      {
        "text": "$45^{\\circ}$",
        "correct": false
      }
    ],
    "explanation": "Mỗi góc bằng $360^{\\circ} : 4 = 90^{\\circ}$ (tức tứ giác là hình chữ nhật)."
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

      // Tự động mở khóa Huy hiệu 1 & 2 khi chuyển tab
      if (target === 'theory') unlockBadge(0);
      if (target === 'labs') unlockBadge(1);

      // Kích hoạt render KaTeX nếu chuyển sang tab ẩn
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
  // Khởi tạo Lab 1
  try {
    
                const canvas = document.getElementById('labCanvas1');
                const ctx = canvas.getContext('2d');
                const outEl = document.getElementById('lab1Output');
                const btnReset = document.getElementById('btnResetQuad');

                let pts = [
                    { x: 100, y: 50, name: 'A', col: '#06b6d4' },
                    { x: 380, y: 60, name: 'B', col: '#10b981' },
                    { x: 480, y: 200, name: 'C', col: '#f59e0b' },
                    { x: 140, y: 210, name: 'D', col: '#ec4899' }
                ];
                let draggingIdx = -1;

                function calcAngles() {
                    const n = 4;
                    const angles = [];
                    for (let i = 0; i < n; i++) {
                        const pPrev = pts[(i - 1 + n) % n];
                        const pCur = pts[i];
                        const pNext = pts[(i + 1) % n];

                        const v1 = { x: pPrev.x - pCur.x, y: pPrev.y - pCur.y };
                        const v2 = { x: pNext.x - pCur.x, y: pNext.y - pCur.y };

                        const dot = v1.x * v2.x + v1.y * v2.y;
                        const m1 = Math.hypot(v1.x, v1.y);
                        const m2 = Math.hypot(v2.x, v2.y);
                        let rad = Math.acos(Math.max(-1, Math.min(1, dot / (m1 * m2))));
                        let deg = Math.round(rad * 180 / Math.PI);
                        angles.push(deg);
                    }
                    return angles;
                }

                function draw() {
                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Ve noi 4 canh
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(pts[0].x, pts[0].y);
                    for (let i = 1; i < 4; i++) ctx.lineTo(pts[i].x, pts[i].y);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
                    ctx.fill();
                    ctx.stroke();

                    // Ve 2 duong cheo
                    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[2].x, pts[2].y);
                    ctx.moveTo(pts[1].x, pts[1].y); ctx.lineTo(pts[3].x, pts[3].y);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Ve 4 dinh
                    const angs = calcAngles();
                    pts.forEach((p, i) => {
                        ctx.fillStyle = p.col;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 8, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 14px Segoe UI';
                        ctx.fillText(`${p.name} (${angs[i]}°)`, p.x - 15, p.y - 12);
                    });

                    const sum = angs[0] + angs[1] + angs[2] + angs[3];
                    outEl.innerHTML = `
                        <strong>Số đo các góc:</strong> $\\widehat{A} = ${angs[0]}^{\\circ};\\, \\widehat{B} = ${angs[1]}^{\\circ};\\, \\widehat{C} = ${angs[2]}^{\\circ};\\, \\widehat{D} = ${angs[3]}^{\\circ}$<br>
                        <strong>Tổng 4 góc:</strong> $${angs[0]}^{\\circ} + ${angs[1]}^{\\circ} + ${angs[2]}^{\\circ} + ${angs[3]}^{\\circ} = \\mathbf{360^{\\circ}}$
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }
                }

                canvas.addEventListener('mousedown', (e) => {
                    const rect = canvas.getBoundingClientRect();
                    const mx = e.clientX - rect.left;
                    const my = e.clientY - rect.top;
                    pts.forEach((p, i) => {
                        if (Math.hypot(p.x - mx, p.y - my) < 15) draggingIdx = i;
                    });
                });
                window.addEventListener('mousemove', (e) => {
                    if (draggingIdx >= 0) {
                        const rect = canvas.getBoundingClientRect();
                        pts[draggingIdx].x = Math.max(30, Math.min(canvas.width - 30, e.clientX - rect.left));
                        pts[draggingIdx].y = Math.max(30, Math.min(canvas.height - 30, e.clientY - rect.top));
                        draw();
                    }
                });
                window.addEventListener('mouseup', () => { draggingIdx = -1; });

                btnReset.addEventListener('click', () => {
                    pts = [
                        { x: 100, y: 50, name: 'A', col: '#06b6d4' },
                        { x: 380, y: 60, name: 'B', col: '#10b981' },
                        { x: 480, y: 200, name: 'C', col: '#f59e0b' },
                        { x: 140, y: 210, name: 'D', col: '#ec4899' }
                    ];
                    draw();
                });
                draw();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const angA = document.getElementById('angA');
                const angB = document.getElementById('angB');
                const angC = document.getElementById('angC');
                const vA = document.getElementById('vA');
                const vB = document.getElementById('vB');
                const vC = document.getElementById('vC');
                const outEl = document.getElementById('lab2Output');

                function update() {
                    const a = parseInt(angA.value);
                    const b = parseInt(angB.value);
                    const c = parseInt(angC.value);
                    vA.textContent = a + '°';
                    vB.textContent = b + '°';
                    vC.textContent = c + '°';

                    const d = 360 - (a + b + c);
                    const valid = d > 0 && d < 180;

                    outEl.innerHTML = `
                        <strong>Công thức:</strong> $\\widehat{D} = 360^{\\circ} - (${a}^{\\circ} + ${b}^{\\circ} + ${c}^{\\circ}) = \\mathbf{${d}^{\\circ}}$<br>
                        ${valid ? '<span style="color:#10b981; font-weight:700;">✔ Góc hợp lệ trong tứ giác lồi</span>' : '<span style="color:#f43f5e; font-weight:700;">✘ Số đo góc không tạo thành tứ giác lồi</span>'}
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#818cf8';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('BIỂU THỊ 4 GÓC TRÊN THANH TIẾN TRÌNH 360 ĐỘ', 30, 40);

                    // Thanh tien trinh 360 do
                    const bx = 40, by = 80, bw = w - 80, bh = 35;
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(bx, by, bw, bh);

                    const pA = (a / 360) * bw;
                    const pB = (b / 360) * bw;
                    const pC = (c / 360) * bw;
                    const pD = Math.max(0, (d / 360) * bw);

                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(bx, by, pA, bh);
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(bx + pA, by, pB, bh);
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(bx + pA + pB, by, pC, bh);
                    ctx.fillStyle = '#ec4899';
                    ctx.fillRect(bx + pA + pB + pC, by, pD, bh);

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText(`A: ${a}°`, bx + 10, by + 23);
                    ctx.fillText(`B: ${b}°`, bx + pA + 10, by + 23);
                    ctx.fillText(`C: ${c}°`, bx + pA + pB + 10, by + 23);
                    ctx.fillText(`D: ${d}°`, bx + pA + pB + pC + 10, by + 23);
                }

                [angA, angB, angC].forEach(el => el.addEventListener('input', update));
                update();
            
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
