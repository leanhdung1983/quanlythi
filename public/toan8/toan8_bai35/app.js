// ================================================================
// BÀI 35: ĐỊNH LÍ PYTHAGORE VÀ ỨNG DỤNG - TOÁN 8 KNTT
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
  userTitle: 'Hiệp Sĩ Pythagore 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai35_state';

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
    "title": "Câu 1: Tính cạnh huyền tam giác vuông 3, 4",
    "pts": 20,
    "question": "Cho tam giác $ABC$ vuông tại $A$ có $AB = 3\\text{ cm}, AC = 4\\text{ cm}$. Độ dài cạnh huyền $BC$ là:",
    "options": [
      {
        "text": "$5\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$7\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$\\sqrt{7}\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$6\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí Pythagore: $BC^2 = AB^2 + AC^2 = 3^2 + 4^2 = 9 + 16 = 25 \\implies BC = 5\\text{ cm}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Tính cạnh góc vuông",
    "pts": 20,
    "question": "Cho tam giác vuông có cạnh huyền bằng $10\\text{ cm}$ và một cạnh góc vuông bằng $6\\text{ cm}$. Cạnh góc vuông còn lại bằng:",
    "options": [
      {
        "text": "$8\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$4\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$64\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$\\sqrt{136}\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Cạnh góc vuông còn lại là $b = \\sqrt{10^2 - 6^2} = \\sqrt{100 - 36} = \\sqrt{64} = 8\\text{ cm}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Nhận biết tam giác vuông qua độ dài 3 cạnh",
    "pts": 20,
    "question": "Bộ ba số nào sau đây là độ dài ba cạnh của một <strong>tam giác vuông</strong>?",
    "options": [
      {
        "text": "$5\\text{ cm};\\, 12\\text{ cm};\\, 13\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$4\\text{ cm};\\, 5\\text{ cm};\\, 6\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$6\\text{ cm};\\, 7\\text{ cm};\\, 8\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$3\\text{ cm};\\, 4\\text{ cm};\\, 6\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $5^2 + 12^2 = 25 + 144 = 169 = 13^2$. Theo định lí Pythagore đảo, đây là tam giác vuông."
  },
  {
    "id": 4,
    "title": "Câu 4: Đường chéo hình vuông",
    "pts": 20,
    "question": "Một hình vuông có cạnh bằng $4\\text{ cm}$. Độ dài đường chéo của hình vuông đó là:",
    "options": [
      {
        "text": "$4\\sqrt{2}\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$8\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$32\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$4\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Đường chéo chia hình vuông thành tam giác vuông cân có hai cạnh góc vuông bằng 4: $d = \\sqrt{4^2 + 4^2} = \\sqrt{32} = 4\\sqrt{2}\\text{ cm}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Chiều cao của tam giác đều",
    "pts": 20,
    "question": "Chiều cao của tam giác đều có cạnh bằng $a$ là:",
    "options": [
      {
        "text": "$\\frac{a\\sqrt{3}}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{a\\sqrt{2}}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{a}{2}$",
        "correct": false
      },
      {
        "text": "$a\\sqrt{3}$",
        "correct": false
      }
    ],
    "explanation": "Đường cao chia tam giác đều thành tam giác vuông có cạnh huyền $a$, cạnh góc vuông đáy là $\\frac{a}{2}$. Chiều cao $h = \\sqrt{a^2 - (\\frac{a}{2})^2} = \\sqrt{\\frac{3a^2}{4}} = \\frac{a\\sqrt{3}}{2}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Đường chéo hình chữ nhật",
    "pts": 20,
    "question": "Một màn hình tivi hình chữ nhật có chiều rộng $30\\text{ inch}$ và chiều dài $40\\text{ inch}$. Kích thước đường chéo của tivi là:",
    "options": [
      {
        "text": "$50\\text{ inch}$",
        "correct": true
      },
      {
        "text": "$70\\text{ inch}$",
        "correct": false
      },
      {
        "text": "$55\\text{ inch}$",
        "correct": false
      },
      {
        "text": "$45\\text{ inch}$",
        "correct": false
      }
    ],
    "explanation": "Đường chéo $d = \\sqrt{30^2 + 40^2} = \\sqrt{900 + 1600} = \\sqrt{2500} = 50\\text{ inch}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Bài toán cái thang dựa tường",
    "pts": 20,
    "question": "Một cái thang dài $5\\text{ m}$ dựa vào tường thẳng đứng, chân thang cách chân tường $3\\text{ m}$. Đỉnh thang chạm tường ở độ cao:",
    "options": [
      {
        "text": "$4\\text{ m}$",
        "correct": true
      },
      {
        "text": "$2\\text{ m}$",
        "correct": false
      },
      {
        "text": "$\\sqrt{34}\\text{ m}$",
        "correct": false
      },
      {
        "text": "$3{,}5\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Thang tạo với tường và mặt đất một tam giác vuông. Độ cao đỉnh thang là $h = \\sqrt{5^2 - 3^2} = \\sqrt{25 - 9} = \\sqrt{16} = 4\\text{ m}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tam giác nhọn hay tù",
    "pts": 20,
    "question": "Một tam giác có ba cạnh $a = 6, b = 8, c = 11$. Vì $6^2 + 8^2 = 100 < 11^2 = 121$ nên tam giác đó là:",
    "options": [
      {
        "text": "Tam giác tù",
        "correct": true
      },
      {
        "text": "Tam giác vuông",
        "correct": false
      },
      {
        "text": "Tam giác nhọn",
        "correct": false
      },
      {
        "text": "Tam giác đều",
        "correct": false
      }
    ],
    "explanation": "Trong một tam giác, nếu bình phương cạnh lớn nhất lớn hơn tổng bình phương hai cạnh kia ($c^2 > a^2 + b^2$) thì góc đối diện cạnh lớn nhất là góc tù. Do đó tam giác này là tam giác tù."
  },
  {
    "id": 9,
    "title": "Câu 9: Tam giác vuông cân có cạnh huyền 6 cm",
    "pts": 20,
    "question": "Một tam giác vuông cân có cạnh huyền bằng $6\\text{ cm}$. Độ dài mỗi cạnh góc vuông là:",
    "options": [
      {
        "text": "$3\\sqrt{2}\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$3\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$\\sqrt{6}\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$18\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Gọi cạnh góc vuông là $x$. Ta có $x^2 + x^2 = 6^2 \\iff 2x^2 = 36 \\iff x^2 = 18 \\implies x = \\sqrt{18} = 3\\sqrt{2}\\text{ cm}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Khoảng cách giữa hai điểm trên mặt phẳng Oxy",
    "pts": 20,
    "question": "Khoảng cách giữa hai điểm $A(1; 2)$ và $B(4; 6)$ trên mặt phẳng tọa độ $Oxy$ là:",
    "options": [
      {
        "text": "$5$",
        "correct": true
      },
      {
        "text": "$7$",
        "correct": false
      },
      {
        "text": "$\\sqrt{7}$",
        "correct": false
      },
      {
        "text": "$25$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng định lí Pythagore: $AB = \\sqrt{(x_B - x_A)^2 + (y_B - y_A)^2} = \\sqrt{(4 - 1)^2 + (6 - 2)^2} = \\sqrt{3^2 + 4^2} = \\sqrt{25} = 5$."
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
                const sA = document.getElementById('sliderA35');
                const sB = document.getElementById('sliderB35');
                const valA = document.getElementById('valA35');
                const valB = document.getElementById('valB35');
                const outEl = document.getElementById('lab1Output35');

                function update() {
                    const a = parseInt(sA.value);
                    const b = parseInt(sB.value);
                    valA.textContent = a;
                    valB.textContent = b;

                    const a2 = a * a;
                    const b2 = b * b;
                    const c2 = a2 + b2;
                    const c = Math.sqrt(c2).toFixed(2);

                    outEl.innerHTML = `<strong>Cạnh góc vuông:</strong> $a = ${a},\\, b = ${b}$ <br><strong>Diện tích hai hình vuông nhỏ:</strong> $a^2 = ${a2},\\, b^2 = ${b2} \\implies a^2 + b^2 = <strong style="color:#34d399;">${c2}</strong>$ <br><strong>Cạnh huyền:</strong> $c = \\sqrt{${c2}} = <strong style="color:#34d399;">${c}</strong>$ &nbsp;|&nbsp; $c^2 = ${c2}$ ✅ Bằng nhau tuyệt đối!`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const ox = 180, oy = h - 60;
                    const sc = 18;

                    // Vẽ tam giác vuông ABC tại O
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ox, oy);
                    ctx.lineTo(ox + b * sc, oy);
                    ctx.lineTo(ox, oy - a * sc);
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Hình vuông trên cạnh a
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(ox - a * sc, oy - a * sc, a * sc, a * sc);
                    ctx.fillRect(ox - a * sc, oy - a * sc, a * sc, a * sc);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Segoe UI';
                    ctx.fillText(`a²=${a2}`, ox - a * sc / 2 - 15, oy - a * sc / 2);

                    // Hình vuông trên cạnh b
                    ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
                    ctx.strokeStyle = '#f59e0b';
                    ctx.strokeRect(ox, oy, b * sc, b * sc);
                    ctx.fillRect(ox, oy, b * sc, b * sc);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(`b²=${b2}`, ox + b * sc / 2 - 15, oy + b * sc / 2 + 5);

                    // Chú thích cạnh huyền
                    ctx.fillStyle = '#34d399';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText(`Huyền c² = ${c2}`, ox + (b * sc) / 2 + 10, oy - (a * sc) / 2);
                }

                [sA, sB].forEach(el => el.addEventListener('input', update));
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const in1 = document.getElementById('inSide1');
                const in2 = document.getElementById('inSide2');
                const in3 = document.getElementById('inSide3');
                const outEl = document.getElementById('lab2Output35');

                function check() {
                    const sides = [
                        parseFloat(in1.value) || 0,
                        parseFloat(in2.value) || 0,
                        parseFloat(in3.value) || 0
                    ].sort((x, y) => x - y);

                    const [a, b, c] = sides;
                    const sum2 = a * a + b * b;
                    const c2 = c * c;
                    const isRight = (Math.abs(sum2 - c2) < 1e-4 && a + b > c);

                    let res = '';
                    if (a + b <= c) {
                        res = '<span style="color:#f87171;">❌ Ba cạnh không tạo thành một tam giác (vi phạm bất đẳng thức tam giác)!</span>';
                    } else if (isRight) {
                        res = `<strong style="color:#34d399; font-size:1.15rem;">🎉 ĐÂY LÀ TAM GIÁC VUÔNG!</strong> ($${a}^2 + ${b}^2 = ${sum2} = ${c}^2$)`;
                    } else {
                        res = `<span style="color:#f59e0b;">⚠️ KHÔNG PHẢI tam giác vuông ($${a}^2 + ${b}^2 = ${sum2} \\neq ${c}^2 = ${c2}$)</span>`;
                    }

                    outEl.innerHTML = `<strong>Ba cạnh:</strong> $${a};\\, ${b};\\, ${c}$ (Cạnh lớn nhất $c = ${c}$) <br>${res}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = isRight ? '#10b981' : '#64748b';
                    ctx.font = 'bold 18px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(isRight ? 'TAM GIÁC VUÔNG CHUẨN PYTHAGORE' : 'TAM GIÁC THƯỜNG HOẶC KHÔNG TỒN TẠI', w / 2, 80);

                    // Trực quan thanh so sánh sum2 và c2
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(80, 110, Math.min(w - 160, sum2 * 1.5), 25);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Segoe UI';
                    ctx.fillText(`a² + b² = ${sum2}`, w / 2, 127);

                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(80, 145, Math.min(w - 160, c2 * 1.5), 25);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(`c² = ${c2}`, w / 2, 162);
                }

                [in1, in2, in3].forEach(el => el.addEventListener('input', check));
                check();
            
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
