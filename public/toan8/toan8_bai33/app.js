// ================================================================
// BÀI 33: HAI TAM GIÁC ĐỒNG DẠNG - TOÁN 8 KNTT
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
  userTitle: 'Nhà Hình Học Tỉ Lệ 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai33_state';

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
    "title": "Câu 1: Nhận diện định nghĩa tam giác đồng dạng",
    "pts": 20,
    "question": "Nếu $\\triangle A'B'C' \\backsim \\triangle ABC$ theo tỉ số $k = 2$, thì $\\frac{A'B'}{AB}$ bằng:",
    "options": [
      {
        "text": "$2$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa tỉ số đồng dạng, tỉ số giữa các cạnh tương ứng $\\frac{A'B'}{AB} = k = 2$."
  },
  {
    "id": 2,
    "title": "Câu 2: Tỉ số đồng dạng nghịch đảo",
    "pts": 20,
    "question": "Nếu $\\triangle ABC \\backsim \\triangle DEF$ theo tỉ số $k = \\frac{2}{3}$, thì $\\triangle DEF \\backsim \\triangle ABC$ theo tỉ số nào?",
    "options": [
      {
        "text": "$\\frac{3}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{4}{9}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Nếu tam giác thứ nhất đồng dạng với tam giác thứ hai theo tỉ số $k$ thì tam giác thứ hai đồng dạng với tam giác thứ nhất theo tỉ số $\\frac{1}{k} = \\frac{1}{2/3} = \\frac{3}{2}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Các góc tương ứng của hai tam giác đồng dạng",
    "pts": 20,
    "question": "Cho $\\triangle ABC \\backsim \\triangle MNP$, biết $\\widehat{A} = 60^\\circ, \\widehat{B} = 70^\\circ$. Số đo của góc $\\widehat{P}$ là:",
    "options": [
      {
        "text": "$50^\\circ$",
        "correct": true
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$70^\\circ$",
        "correct": false
      },
      {
        "text": "$80^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Trong $\\triangle ABC$, $\\widehat{C} = 180^\\circ - (60^\\circ + 70^\\circ) = 50^\\circ$. Vì $\\triangle ABC \\backsim \\triangle MNP$ nên các góc tương ứng bằng nhau: $\\widehat{P} = \\widehat{C} = 50^\\circ$."
  },
  {
    "id": 4,
    "title": "Câu 4: Áp dụng định lí đường thẳng song song",
    "pts": 20,
    "question": "Cho tam giác $ABC$, đường thẳng $d \\parallel BC$ cắt $AB, AC$ lần lượt tại $D, E$. Khẳng định nào sau đây <strong>đúng</strong>?",
    "options": [
      {
        "text": "$\\triangle ADE \\backsim \\triangle ABC$",
        "correct": true
      },
      {
        "text": "$\\triangle ADE = \\triangle ABC$",
        "correct": false
      },
      {
        "text": "$\\triangle ADE \\backsim \\triangle ACB$",
        "correct": false
      },
      {
        "text": "$\\triangle ABC \\backsim \\triangle AED$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí, nếu một đường thẳng cắt hai cạnh của tam giác và song song với cạnh thứ ba thì tạo thành tam giác mới đồng dạng với tam giác đã cho: $\\triangle ADE \\backsim \\triangle ABC$ (đỉnh $A$ chung, $D$ ứng với $B$, $E$ ứng với $C$)."
  },
  {
    "id": 5,
    "title": "Câu 5: Tính độ dài cạnh qua tỉ số đồng dạng",
    "pts": 20,
    "question": "Cho $\\triangle ABC \\backsim \\triangle A'B'C'$ theo tỉ số $k = 3$. Biết $BC = 12\\text{ cm}$. Độ dài cạnh $B'C'$ là:",
    "options": [
      {
        "text": "$4\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$36\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$9\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$15\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{BC}{B'C'} = k = 3 \\implies B'C' = \\frac{BC}{3} = \\frac{12}{3} = 4\\text{ cm}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Chu vi của hai tam giác đồng dạng",
    "pts": 20,
    "question": "Hai tam giác đồng dạng với nhau theo tỉ số $k = \\frac{1}{2}$. Tỉ số chu vi của hai tam giác đó bằng:",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{4}$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Tỉ số chu vi của hai tam giác đồng dạng bằng chính tỉ số đồng dạng $k = \\frac{1}{2}$ (vì $\\frac{a'+b'+c'}{a+b+c} = \\frac{ka+kb+kc}{a+b+c} = k$)."
  },
  {
    "id": 7,
    "title": "Câu 7: Tính chất bắc cầu",
    "pts": 20,
    "question": "Nếu $\\triangle A_1 B_1 C_1 \\backsim \\triangle A_2 B_2 C_2$ theo tỉ số $k_1 = 2$ và $\\triangle A_2 B_2 C_2 \\backsim \\triangle A_3 B_3 C_3$ theo tỉ số $k_2 = 3$, thì $\\triangle A_1 B_1 C_1 \\backsim \\triangle A_3 B_3 C_3$ theo tỉ số:",
    "options": [
      {
        "text": "$6$",
        "correct": true
      },
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Theo tính chất bắc cầu, tỉ số đồng dạng tổng hợp là tích hai tỉ số: $k = k_1 \\cdot k_2 = 2 \\times 3 = 6$."
  },
  {
    "id": 8,
    "title": "Câu 8: Nhận định đúng sai về tam giác bằng nhau",
    "pts": 20,
    "question": "Khẳng định nào sau đây là <strong>sai</strong>?",
    "options": [
      {
        "text": "Hai tam giác đồng dạng thì bằng nhau",
        "correct": true
      },
      {
        "text": "Hai tam giác bằng nhau thì đồng dạng",
        "correct": false
      },
      {
        "text": "Mỗi tam giác đồng dạng với chính nó",
        "correct": false
      },
      {
        "text": "Hai tam giác đều bất kì luôn đồng dạng với nhau",
        "correct": false
      }
    ],
    "explanation": "Hai tam giác đồng dạng chỉ có cùng hình dạng, kích thước có thể khác nhau ($k \\neq 1$) nên không thể kết luận chúng bằng nhau."
  },
  {
    "id": 9,
    "title": "Câu 9: Đồng dạng của hai tam giác đều",
    "pts": 20,
    "question": "Hai tam giác đều có cạnh lần lượt là $4\\text{ cm}$ và $6\\text{ cm}$. Tỉ số đồng dạng của tam giác nhỏ đối với tam giác lớn là:",
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
        "text": "$\\frac{4}{9}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Mọi tam giác đều đều có các góc bằng $60^\\circ$. Tỉ số đồng dạng giữa tam giác nhỏ và tam giác lớn là $k = \\frac{4}{6} = \\frac{2}{3}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng đo chiều cao bằng bóng nắng",
    "pts": 20,
    "question": "Một cột cờ cao $h$ đổ bóng trên mặt đất dài $6\\text{ m}$. Cùng thời điểm đó, một cọc tiêu cao $1{,}5\\text{ m}$ cắm vuông góc với mặt đất có bóng dài $1\\text{ m}$. Chiều cao $h$ của cột cờ là:",
    "options": [
      {
        "text": "$9\\text{ m}$",
        "correct": true
      },
      {
        "text": "$6\\text{ m}$",
        "correct": false
      },
      {
        "text": "$7{,}5\\text{ m}$",
        "correct": false
      },
      {
        "text": "$12\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Hai tam giác tạo bởi cột cờ và bóng nắng, cọc tiêu và bóng nắng đồng dạng với nhau: $\\frac{h}{1{,}5} = \\frac{6}{1} \\implies h = 1{,}5 \\times 6 = 9\\text{ m}$."
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
                const slider = document.getElementById('sliderK33');
                const valK = document.getElementById('valK33');
                const outEl = document.getElementById('lab1Output33');

                function update() {
                    const k = parseFloat(slider.value);
                    valK.textContent = k;

                    const a = 6, b = 8, c = 10; // Tam giác vuông 6, 8, 10
                    const ak = (a * k).toFixed(1);
                    const bk = (b * k).toFixed(1);
                    const ck = (c * k).toFixed(1);

                    outEl.innerHTML = `<strong>Tam giác gốc $\triangle ABC$:</strong> Cạnh $6, 8, 10$ &nbsp;|&nbsp; <strong>Tam giác $\triangle A'B'C'$:</strong> Cạnh $${ak}, ${bk}, ${ck}$ <br><strong>Tỉ số cạnh:</strong> $\\frac{A'B'}{AB} = \\frac{B'C'}{BC} = \\frac{C'A'}{CA} = <strong style="color:#34d399;">${k}</strong>$ &nbsp;|&nbsp; <strong>Góc:</strong> Giữ nguyên không đổi!`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Tam giác 1 (gốc)
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(60, h - 30);
                    ctx.lineTo(60 + 8 * 12, h - 30);
                    ctx.lineTo(60, h - 30 - 6 * 12);
                    ctx.closePath();
                    ctx.stroke();

                    ctx.fillStyle = '#06b6d4';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText('ΔABC (Gốc)', 80, h - 45);

                    // Tam giác 2 (đồng dạng)
                    const x2 = 240;
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(x2, h - 30);
                    ctx.lineTo(x2 + 8 * 12 * k, h - 30);
                    ctx.lineTo(x2, h - 30 - 6 * 12 * k);
                    ctx.closePath();
                    ctx.stroke();

                    ctx.fillStyle = '#f59e0b';
                    ctx.fillText(`ΔA'B'C' (k = ${k})`, x2 + 20, h - 45);
                }

                slider.addEventListener('input', update);
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const slider = document.getElementById('sliderAM');
                const valAM = document.getElementById('valAM');
                const outEl = document.getElementById('lab2Output33');

                function draw() {
                    const r = parseFloat(slider.value);
                    valAM.textContent = r;

                    outEl.innerHTML = `Vì $MN \\parallel BC$ nên $\triangle AMN \backsim \triangle ABC$ theo tỉ số $k = \\frac{AM}{AB} = \\frac{AN}{AC} = \\frac{MN}{BC} = <strong style="color:#34d399;">${r}</strong>$`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const ax = w / 2, ay = 35;
                    const bx = w / 2 - 140, by = h - 35;
                    const cx = w / 2 + 140, cy = h - 35;

                    // Vẽ ΔABC
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath();
                    ctx.stroke();

                    // Điểm M và N
                    const mx = ax + r * (bx - ax);
                    const my = ay + r * (by - ay);
                    const nx = ax + r * (cx - ax);
                    const ny = ay + r * (cy - ay);

                    // Vẽ đoạn MN
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 3.5;
                    ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(nx, ny); ctx.stroke();

                    // Tô màu ΔAMN
                    ctx.fillStyle = 'rgba(56, 189, 248, 0.2)';
                    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(mx, my); ctx.lineTo(nx, ny); ctx.closePath(); ctx.fill();

                    // Nhãn các đỉnh
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText('A', ax - 5, ay - 10);
                    ctx.fillText('B', bx - 15, by + 15);
                    ctx.fillText('C', cx + 5, cy + 15);
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillText('M', mx - 20, my);
                    ctx.fillText('N', nx + 8, ny);
                }

                slider.addEventListener('input', draw);
                draw();
            
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
