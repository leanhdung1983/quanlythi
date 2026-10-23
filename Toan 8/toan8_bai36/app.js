// ================================================================
// BÀI 36: ĐỒNG DẠNG CỦA TAM GIÁC VUÔNG - TOÁN 8 KNTT
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
  userTitle: 'Bậc Thầy Tam Giác Vuông 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai36_state';

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
    "title": "Câu 1: Trường hợp đồng dạng góc nhọn của tam giác vuông",
    "pts": 20,
    "question": "Hai tam giác vuông đồng dạng với nhau khi:",
    "options": [
      {
        "text": "Có một góc nhọn bằng nhau",
        "correct": true
      },
      {
        "text": "Có một cạnh góc vuông bằng nhau",
        "correct": false
      },
      {
        "text": "Có cạnh huyền bằng nhau",
        "correct": false
      },
      {
        "text": "Có chu vi bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Vì hai tam giác đã có sẵn góc vuông $90^\\circ$, nếu có thêm một góc nhọn bằng nhau thì hai tam giác đồng dạng theo trường hợp góc - góc (g-g)."
  },
  {
    "id": 2,
    "title": "Câu 2: Tỉ số diện tích hai tam giác đồng dạng",
    "pts": 20,
    "question": "Cho $\\triangle ABC \\backsim \\triangle A'B'C'$ với tỉ số đồng dạng $k = 3$. Tỉ số diện tích $\\frac{S_{ABC}}{S_{A'B'C'}}$ bằng:",
    "options": [
      {
        "text": "$9$",
        "correct": true
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$6$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{9}$",
        "correct": false
      }
    ],
    "explanation": "Định lí: Tỉ số diện tích của hai tam giác đồng dạng bằng bình phương tỉ số đồng dạng: $\\frac{S}{S'} = k^2 = 3^2 = 9$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tỉ số đồng dạng khi biết tỉ số diện tích",
    "pts": 20,
    "question": "Nếu hai tam giác đồng dạng có tỉ số diện tích là $\\frac{4}{25}$, thì tỉ số đồng dạng của hai tam giác đó là:",
    "options": [
      {
        "text": "$\\frac{2}{5}$",
        "correct": true
      },
      {
        "text": "$\\frac{4}{25}$",
        "correct": false
      },
      {
        "text": "$\\frac{16}{625}$",
        "correct": false
      },
      {
        "text": "$\\frac{5}{2}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $k^2 = \\frac{4}{25} \\implies k = \\sqrt{\\frac{4}{25}} = \\frac{2}{5}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tỉ số hai đường cao tương ứng",
    "pts": 20,
    "question": "Cho $\\triangle ABC \\backsim \\triangle DEF$ theo tỉ số $k = \\frac{1}{2}$. Đường cao $AH = 6\\text{ cm}$. Đường cao tương ứng $DK$ của $\\triangle DEF$ bằng:",
    "options": [
      {
        "text": "$12\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$3\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$6\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$24\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Tỉ số đường cao bằng tỉ số đồng dạng: $\\frac{AH}{DK} = k = \\frac{1}{2} \\implies DK = 2 \\cdot AH = 2 \\times 6 = 12\\text{ cm}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Trường hợp đồng dạng cạnh huyền và cạnh góc vuông",
    "pts": 20,
    "question": "Tam giác vuông $ABC$ ($A = 90^\\circ$) và tam giác vuông $A'B'C'$ ($A' = 90^\\circ$) có $\\frac{BC}{B'C'} = \\frac{AB}{A'B'} = 2$. Kết luận nào sau đây đúng?",
    "options": [
      {
        "text": "$\\triangle ABC \\backsim \\triangle A'B'C'$",
        "correct": true
      },
      {
        "text": "$\\triangle ABC = \\triangle A'B'C'$",
        "correct": false
      },
      {
        "text": "Hai tam giác không đồng dạng",
        "correct": false
      },
      {
        "text": "$\\triangle ABC \\backsim \\triangle A'C'B'$",
        "correct": false
      }
    ],
    "explanation": "Đây là dấu hiệu đồng dạng đặc biệt của tam giác vuông: Cạnh huyền và một cạnh góc vuông tỉ lệ."
  },
  {
    "id": 6,
    "title": "Câu 6: Hệ thức lượng đường cao tam giác vuông",
    "pts": 20,
    "question": "Cho $\\triangle ABC$ vuông tại $A$, đường cao $AH$. Hệ thức nào sau đây là <strong>đúng</strong>?",
    "options": [
      {
        "text": "$AH^2 = BH \\cdot CH$",
        "correct": true
      },
      {
        "text": "$AH = BH \\cdot CH$",
        "correct": false
      },
      {
        "text": "$AH^2 = AB \\cdot AC$",
        "correct": false
      },
      {
        "text": "$AH^2 = BC^2$",
        "correct": false
      }
    ],
    "explanation": "Vì $\\triangle HBA \\backsim \\triangle HAC$ nên $\\frac{HA}{HC} = \\frac{HB}{HA} \\implies AH^2 = HB \\cdot HC$."
  },
  {
    "id": 7,
    "title": "Câu 7: Tính đường cao từ hai hình chiếu",
    "pts": 20,
    "question": "Cho $\\triangle ABC$ vuông tại $A$, đường cao $AH$. Biết $BH = 4\\text{ cm}, CH = 9\\text{ cm}$. Độ dài đường cao $AH$ là:",
    "options": [
      {
        "text": "$6\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$36\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$13\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$5\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $AH^2 = BH \\cdot CH = 4 \\times 9 = 36 \\implies AH = \\sqrt{36} = 6\\text{ cm}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tính diện tích tam giác đồng dạng",
    "pts": 20,
    "question": "Cho $\\triangle ABC \\backsim \\triangle DEF$ theo tỉ số $k = 2$. Biết diện tích $\\triangle ABC$ là $40\\text{ cm}^2$. Diện tích $\\triangle DEF$ là:",
    "options": [
      {
        "text": "$10\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$20\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$80\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$160\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{S_{ABC}}{S_{DEF}} = k^2 = 2^2 = 4 \\implies S_{DEF} = \\frac{S_{ABC}}{4} = \\frac{40}{4} = 10\\text{ cm}^2$."
  },
  {
    "id": 9,
    "title": "Câu 9: Hệ thức giữa cạnh góc vuông và cạnh huyền",
    "pts": 20,
    "question": "Cho $\\triangle ABC$ vuông tại $A$, đường cao $AH$. Biết $BC = 25\\text{ cm}, BH = 9\\text{ cm}$. Độ dài cạnh $AB$ bằng:",
    "options": [
      {
        "text": "$15\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$225\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$12\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$20\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Hệ thức lượng: $AB^2 = BH \\cdot BC = 9 \\times 25 = 225 \\implies AB = \\sqrt{225} = 15\\text{ cm}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tích hai cạnh góc vuông bằng tích cạnh huyền và đường cao",
    "pts": 20,
    "question": "Một tam giác vuông có hai cạnh góc vuông là $6\\text{ cm}$ và $8\\text{ cm}$. Chiều cao ứng với cạnh huyền của tam giác đó bằng:",
    "options": [
      {
        "text": "$4{,}8\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$5\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$10\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$2{,}4\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Cạnh huyền $a = \\sqrt{6^2 + 8^2} = 10\\text{ cm}$. Ta có $b \\cdot c = a \\cdot h \\implies h = \\frac{6 \\times 8}{10} = 4{,}8\\text{ cm}$."
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
                const slider = document.getElementById('sliderAngleB');
                const valB = document.getElementById('valAngleB');
                const outEl = document.getElementById('lab1Output36');

                function update() {
                    const deg = parseInt(slider.value);
                    valB.textContent = deg;
                    const otherDeg = 90 - deg;

                    outEl.innerHTML = `<strong>Tam giác 1:</strong> Góc vuông $90^\\circ,\\, \\widehat{B} = ${deg}^\\circ,\\, \\widehat{C} = ${otherDeg}^\\circ$ <br><strong>Tam giác 2:</strong> Góc vuông $90^\\circ,\\, \\widehat{B'} = ${deg}^\\circ,\\, \\widehat{C'} = ${otherDeg}^\\circ$ <br>$\\implies$ <strong style="color:#34d399;">$\triangle ABC \backsim \triangle A'B'C'$ (Trường hợp 1 góc nhọn bằng nhau)</strong>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const rad = deg * Math.PI / 180;

                    // Vẽ tam giác 1 nhỏ
                    const l1 = 100;
                    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(60, h - 30);
                    ctx.lineTo(60 + l1, h - 30);
                    ctx.lineTo(60, h - 30 - l1 * Math.tan(rad));
                    ctx.closePath();
                    ctx.stroke();

                    // Vẽ tam giác 2 lớn (tỉ số 1.6)
                    const l2 = 160;
                    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(240, h - 30);
                    ctx.lineTo(240 + l2, h - 30);
                    ctx.lineTo(240, h - 30 - l2 * Math.tan(rad));
                    ctx.closePath();
                    ctx.stroke();
                }

                slider.addEventListener('input', update);
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const slider = document.getElementById('sliderK36');
                const valK = document.getElementById('valK36');
                const outEl = document.getElementById('lab2Output36');

                function draw() {
                    const k = parseInt(slider.value);
                    valK.textContent = k;
                    const k2 = k * k;

                    outEl.innerHTML = `<strong>Tỉ số cạnh:</strong> $k = ${k}$ &nbsp;|&nbsp; <strong>Tỉ số diện tích:</strong> $\\frac{S'}{S} = k^2 = ${k}^2 = <strong style="color:#34d399; font-size:1.15rem;">${k2}</strong>$ lần!`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#f8fafc';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText(`MÔ HÌNH CHỨA ${k2} TAM GIÁC CON TRONG TAM GIÁC LỚN:`, 40, 40);

                    // Vẽ mạng lưới k² tam giác nhỏ
                    const ox = w / 2 - 100, oy = h - 30;
                    const b = 60, a = 40;

                    for (let row = 0; row < k; row++) {
                        for (let col = 0; col <= row; col++) {
                            const px = ox + col * b - (row * b) / 2;
                            const py = oy - (k - 1 - row) * a;

                            ctx.strokeStyle = '#38bdf8';
                            ctx.fillStyle = 'rgba(56, 189, 248, 0.25)';
                            ctx.lineWidth = 2;
                            ctx.beginPath();
                            ctx.moveTo(px, py);
                            ctx.lineTo(px + b, py);
                            ctx.lineTo(px + b / 2, py - a);
                            ctx.closePath();
                            ctx.fill();
                            ctx.stroke();
                        }
                    }
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
