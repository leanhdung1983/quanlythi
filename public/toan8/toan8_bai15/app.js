// ================================================================
// BÀI 15: ĐỊNH LÍ THALÈS TRONG TAM GIÁC - TOÁN 8 KNTT
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
  userTitle: 'Nhà Đo Đạc Thalès 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai15_state';

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
    "title": "Thử Thách 1: Tỉ Số Đoạn Thẳng",
    "pts": 20,
    "question": "Cho $AB = 4$ cm, $CD = 6$ cm. Tỉ số của hai đoạn thẳng $AB$ và $CD$ bằng:",
    "options": [
      {
        "text": "$\\frac{2}{3}$",
        "correct": true
      },
      {
        "text": "$\\frac{3}{2}$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$\\frac{4}{6}$ cm",
        "correct": false
      }
    ],
    "explanation": "Tỉ số $\\frac{AB}{CD} = \\frac{4}{6} = \\frac{2}{3}$ (tỉ số là số thuần túy, không có đơn vị đo kèm theo)."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Áp Dụng Định Lí Thalès Thuận",
    "pts": 20,
    "question": "Cho tam giác $ABC$ có $MN \\parallel BC$ ($M \\in AB, N \\in AC$). Biết $AM = 3$ cm, $MB = 2$ cm, $AN = 4{,}5$ cm. Độ dài đoạn $NC$ là:",
    "options": [
      {
        "text": "$3$ cm",
        "correct": true
      },
      {
        "text": "$2$ cm",
        "correct": false
      },
      {
        "text": "$6$ cm",
        "correct": false
      },
      {
        "text": "$4$ cm",
        "correct": false
      }
    ],
    "explanation": "Theo định lí Thalès: $\\frac{AM}{MB} = \\frac{AN}{NC} \\implies \\frac{3}{2} = \\frac{4{,}5}{NC} \\implies NC = \\frac{2 \\cdot 4{,}5}{3} = 3$ cm."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Áp Dụng Hệ Quả Thalès",
    "pts": 20,
    "question": "Cho tam giác $ABC$ có $MN \\parallel BC$ ($M \\in AB, N \\in AC$). Biết $AM = 2$ cm, $AB = 5$ cm, $MN = 3$ cm. Độ dài cạnh $BC$ là:",
    "options": [
      {
        "text": "$7{,}5$ cm",
        "correct": true
      },
      {
        "text": "$6$ cm",
        "correct": false
      },
      {
        "text": "$15$ cm",
        "correct": false
      },
      {
        "text": "$5$ cm",
        "correct": false
      }
    ],
    "explanation": "Theo hệ quả Thalès: $\\frac{AM}{AB} = \\frac{MN}{BC} \\implies \\frac{2}{5} = \\frac{3}{BC} \\implies BC = \\frac{5 \\cdot 3}{2} = 7{,}5$ cm."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Định Lí Thalès Đảo",
    "pts": 20,
    "question": "Cho $\\Delta ABC$. Trên $AB$ lấy điểm $M$, trên $AC$ lấy điểm $N$. Điều kiện nào sau đây chứng tỏ $MN \\parallel BC$?",
    "options": [
      {
        "text": "$\\frac{AM}{MB} = \\frac{AN}{NC}$",
        "correct": true
      },
      {
        "text": "$\\frac{AM}{AB} = \\frac{NC}{AN}$",
        "correct": false
      },
      {
        "text": "$AM = AN$",
        "correct": false
      },
      {
        "text": "$MN = \\frac{1}{2}BC$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí Thalès đảo: Nếu $\\frac{AM}{MB} = \\frac{AN}{NC}$ thì $MN \\parallel BC$."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Cắt Phần Kéo Dài Của Hai Cạnh",
    "pts": 20,
    "question": "Cho hai đường thẳng $AB$ và $CD$ song song với nhau. Đoạn thẳng $AC$ cắt $BD$ tại $O$. Tỉ lệ thức nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$\\frac{OA}{OC} = \\frac{OB}{OD} = \\frac{AB}{CD}$",
        "correct": true
      },
      {
        "text": "$\\frac{OA}{OD} = \\frac{OB}{OC}$",
        "correct": false
      },
      {
        "text": "$\\frac{OA}{OC} = \\frac{OD}{OB}$",
        "correct": false
      },
      {
        "text": "$\\frac{AB}{CD} = \\frac{OA}{OB}$",
        "correct": false
      }
    ],
    "explanation": "Vì $AB \\parallel CD$, theo hệ quả định lí Thalès (hình đồng hồ cát): $\\frac{OA}{OC} = \\frac{OB}{OD} = \\frac{AB}{CD}$."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Đổi Đơn Vị Đo",
    "pts": 20,
    "question": "Cho đoạn thẳng $AB = 2$ m và đoạn thẳng $CD = 50$ cm. Tỉ số $\\frac{AB}{CD}$ bằng:",
    "options": [
      {
        "text": "$4$",
        "correct": true
      },
      {
        "text": "$\\frac{2}{50} = \\frac{1}{25}$",
        "correct": false
      },
      {
        "text": "$0{,}4$",
        "correct": false
      },
      {
        "text": "$4$ m",
        "correct": false
      }
    ],
    "explanation": "Đổi $2$ m = $200$ cm. Tỉ số $\\frac{AB}{CD} = \\frac{200}{50} = 4$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Tìm Đoạn Thẳng Thứ Tư Tỉ Lệ",
    "pts": 20,
    "question": "Tìm độ dài đoạn thẳng $x$ biết các đoạn thẳng $2$ cm, $3$ cm, $6$ cm và $x$ cm lập thành một tỉ lệ thức theo thứ tự đó:",
    "options": [
      {
        "text": "$9$ cm",
        "correct": true
      },
      {
        "text": "$4$ cm",
        "correct": false
      },
      {
        "text": "$1$ cm",
        "correct": false
      },
      {
        "text": "$12$ cm",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{2}{3} = \\frac{6}{x} \\implies x = \\frac{3 \\cdot 6}{2} = 9$ cm."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Nhận Dạng Khẳng Định SAI",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có $MN \\parallel BC$ ($M \\in AB, N \\in AC$). Khẳng định nào sau đây là SAI?",
    "options": [
      {
        "text": "$\\frac{AM}{MB} = \\frac{MN}{BC}$",
        "correct": true
      },
      {
        "text": "$\\frac{AM}{AB} = \\frac{AN}{AC}$",
        "correct": false
      },
      {
        "text": "$\\frac{AM}{AB} = \\frac{MN}{BC}$",
        "correct": false
      },
      {
        "text": "$\\frac{MB}{AB} = \\frac{NC}{AC}$",
        "correct": false
      }
    ],
    "explanation": "Khẳng định $\\frac{AM}{MB} = \\frac{MN}{BC}$ là SAI. Phải là $\\frac{AM}{AB} = \\frac{MN}{BC}$ (hệ quả Thalès)."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Bài Toán Đo Chiều Rộng Khúc Sông",
    "pts": 20,
    "question": "Để đo khoảng cách giữa hai điểm $A$ và $B$ ở hai bên bờ sông, người ta chọn điểm $C$ cùng phía với $A$ và kẻ đoạn thẳng $MN \\parallel AB$ sao cho $C, M, A$ thẳng hàng và $C, N, B$ thẳng hàng. Biết $CM = 15$ m, $MA = 30$ m, $MN = 20$ m. Khoảng cách $AB$ là:",
    "options": [
      {
        "text": "$60$ m",
        "correct": true
      },
      {
        "text": "$40$ m",
        "correct": false
      },
      {
        "text": "$50$ m",
        "correct": false
      },
      {
        "text": "$45$ m",
        "correct": false
      }
    ],
    "explanation": "$CA = CM + MA = 15 + 30 = 45$ m. Do $MN \\parallel AB \\implies \\frac{MN}{AB} = \\frac{CM}{CA} \\implies \\frac{20}{AB} = \\frac{15}{45} = \\frac{1}{3} \\implies AB = 60$ m."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Tỉ Lệ Trong Hình Thang",
    "pts": 20,
    "question": "Cho hình thang $ABCD$ ($AB \\parallel CD$). Đường thẳng song song với hai đáy cắt hai cạnh bên $AD$ và $BC$ lần lượt tại $E$ và $F$. Khẳng định nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$\\frac{AE}{ED} = \\frac{BF}{FC}$",
        "correct": true
      },
      {
        "text": "$\\frac{AE}{AD} = \\frac{CF}{BC}$",
        "correct": false
      },
      {
        "text": "$\\frac{ED}{AD} = \\frac{BF}{BC}$",
        "correct": false
      },
      {
        "text": "$EF = \\frac{AB + CD}{2}$ trong mọi trường hợp",
        "correct": false
      }
    ],
    "explanation": "Theo định lí Thalès mở rộng cho hình thang có $EF \\parallel AB \\parallel CD$: $\\frac{AE}{ED} = \\frac{BF}{FC}$."
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
                const ratioM = document.getElementById('ratioM');
                const dispRatio = document.getElementById('dispRatio');
                const outEl = document.getElementById('lab1Output');

                function draw() {
                    const k = parseInt(ratioM.value) / 100;
                    dispRatio.textContent = k.toFixed(2);

                    outEl.innerHTML = `
                        <strong>Tỉ số Thalès:</strong> $\\frac{AM}{AB} = \\frac{AN}{AC} = \\frac{MN}{BC} = \\mathbf{${k.toFixed(2)}}$<br>
                        <strong>Kết luận:</strong> Đoạn thẳng $MN$ luôn song song với $BC$ và định ra các đoạn tỉ lệ hoàn hảo.
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const ax = w / 2, ay = 35;
                    const bx = 100, by = 190;
                    const cx = w - 100, cy = 190;

                    // Tam giac ABC
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
                    ctx.fill();
                    ctx.stroke();

                    // Diem M va N
                    const mx = ax + (bx - ax) * k;
                    const my = ay + (by - ay) * k;
                    const nx = ax + (cx - ax) * k;
                    const ny = ay + (cy - ay) * k;

                    // Doan song song MN
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(mx, my); ctx.lineTo(nx, ny);
                    ctx.stroke();

                    // To mau tam giac con AMN
                    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(mx, my); ctx.lineTo(nx, ny);
                    ctx.closePath();
                    ctx.fill();

                    // Diem
                    [
                        { x: ax, y: ay, n: 'A', c: '#fff' },
                        { x: bx, y: by, n: 'B', c: '#6366f1' },
                        { x: cx, y: cy, n: 'C', c: '#6366f1' },
                        { x: mx, y: my, n: `M (${k.toFixed(2)})`, c: '#10b981' },
                        { x: nx, y: ny, n: 'N', c: '#10b981' }
                    ].forEach(p => {
                        ctx.fillStyle = p.c;
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
                        ctx.fill();
                        ctx.fillText(p.n, p.x - 10, p.y - 8);
                    });
                }

                ratioM.addEventListener('input', draw);
                draw();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const poleH = document.getElementById('poleH');
                const shadow1 = document.getElementById('shadow1');
                const shadow2 = document.getElementById('shadow2');
                const outEl = document.getElementById('lab2Output');

                function update() {
                    const h1 = parseFloat(poleH.value);
                    const s1 = parseFloat(shadow1.value);
                    const s2 = parseFloat(shadow2.value);

                    // H / s2 = h1 / s1 => H = h1 * s2 / s1
                    const treeH = (h1 * s2 / s1).toFixed(1);

                    outEl.innerHTML = `
                        <strong>Hệ quả Thalès:</strong> $\\frac{H_{\\text{cây}}}{h_{\\text{cọc}}} = \\frac{d_{\\text{bóng cây}}}{d_{\\text{bóng cọc}}} \\implies H_{\\text{cây}} = \\frac{${h1} \\cdot ${s2}}{${s1}} = \\mathbf{${treeH}}$ mét
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Mat dat
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(30, 180); ctx.lineTo(w - 30, 180);
                    ctx.stroke();

                    // Tia sang mat troi (song song)
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(150, 40); ctx.lineTo(250, 180); // Coc
                    ctx.moveTo(350, 40); ctx.lineTo(470, 180); // Cay
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Cay
                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(340, 180 - Math.min(140, treeH * 10), 16, Math.min(140, treeH * 10));
                    ctx.fillText(`Cây cao: ${treeH} m`, 320, 180 - Math.min(140, treeH * 10) - 10);

                    // Coc
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(145, 180 - h1 * 20, 8, h1 * 20);
                    ctx.fillText(`Cọc: ${h1} m`, 135, 180 - h1 * 20 - 8);
                }

                [poleH, shadow1, shadow2].forEach(el => el.addEventListener('input', update));
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
