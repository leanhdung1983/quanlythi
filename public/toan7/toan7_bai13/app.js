// ================================================================
// BÀI 13: HAI TAM GIÁC BẰNG NHAU. TRƯỜNG HỢP CẠNH - CẠNH - CẠNH - TOÁN 7 KNTT
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
  userTitle: 'Chiến Binh Tam Giác Bằng Nhau',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai13_state';

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
    "title": "Câu 1: Kí hiệu hai tam giác bằng nhau",
    "pts": 20,
    "question": "Cho $\\\\triangle ABC = \\\\triangle MNP$. Cạnh nào dưới đây bằng với cạnh $AC$?",
    "options": [
      {
        "text": "$MP$",
        "correct": true
      },
      {
        "text": "$MN$",
        "correct": false
      },
      {
        "text": "$NP$",
        "correct": false
      },
      {
        "text": "$BC$",
        "correct": false
      }
    ],
    "explanation": "Đỉnh thứ nhất $A$ ứng với $M$, đỉnh thứ ba $C$ ứng với $P$. Do đó cạnh tương ứng với $AC$ là $MP$."
  },
  {
    "id": 2,
    "title": "Câu 2: Góc tương ứng",
    "pts": 20,
    "question": "Cho $\\\\triangle DEF = \\\\triangle HIK$. Biết $\\\\widehat{D} = 75^\\\\circ$, số đo của góc nào dưới đây cũng bằng $75^\\\\circ$?",
    "options": [
      {
        "text": "$\\\\widehat{H}$",
        "correct": true
      },
      {
        "text": "$\\\\widehat{I}$",
        "correct": false
      },
      {
        "text": "$\\\\widehat{K}$",
        "correct": false
      },
      {
        "text": "$\\\\widehat{E}$",
        "correct": false
      }
    ],
    "explanation": "Đỉnh $D$ là đỉnh thứ nhất của tam giác đầu, tương ứng với đỉnh thứ nhất $H$ của tam giác sau. Do đó $\\\\widehat{H} = \\\\widehat{D} = 75^\\\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Điều kiện bằng nhau (c-c-c)",
    "pts": 20,
    "question": "Để chứng minh $\\\\triangle ABC = \\\\triangle DEF$ theo trường hợp cạnh - cạnh - cạnh (c-c-c), ta cần chỉ ra điều gì?",
    "options": [
      {
        "text": "$AB = DE,\\\\ BC = EF,\\\\ CA = FD$",
        "correct": true
      },
      {
        "text": "$AB = DE,\\\\ \\\\widehat{A} = \\\\widehat{D},\\\\ AC = DF$",
        "correct": false
      },
      {
        "text": "$\\\\widehat{A} = \\\\widehat{D},\\\\ \\\\widehat{B} = \\\\widehat{E},\\\\ \\\\widehat{C} = \\\\widehat{F}$",
        "correct": false
      },
      {
        "text": "$AB = EF,\\\\ BC = DE,\\\\ CA = FD$",
        "correct": false
      }
    ],
    "explanation": "Trường hợp (c-c-c) yêu cầu cả ba cặp cạnh tương ứng phải bằng nhau: $AB = DE$, $BC = EF$ và $CA = FD$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính chu vi tam giác bằng nhau",
    "pts": 20,
    "question": "Cho $\\\\triangle ABC = \\\\triangle DEF$. Biết chu vi của $\\\\triangle ABC$ là $24\\\\text{ cm}$. Chu vi của $\\\\triangle DEF$ là:",
    "options": [
      {
        "text": "$24\\\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$12\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$48\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "Chưa đủ dữ kiện để tính",
        "correct": false
      }
    ],
    "explanation": "Hai tam giác bằng nhau thì các cạnh tương ứng bằng nhau, do đó chu vi của chúng hoàn toàn bằng nhau: $P_{DEF} = P_{ABC} = 24\\\\text{ cm}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Thứ tự đỉnh tương ứng",
    "pts": 20,
    "question": "Cho tam giác $ABC$ và tam giác $MNP$ có $AB = NP$, $BC = PM$, $CA = MN$. Khẳng định nào sau đây là đúng?",
    "options": [
      {
        "text": "$\\\\triangle ABC = \\\\triangle NPM$",
        "correct": true
      },
      {
        "text": "$\\\\triangle ABC = \\\\triangle MNP$",
        "correct": false
      },
      {
        "text": "$\\\\triangle ABC = \\\\triangle PMN$",
        "correct": false
      },
      {
        "text": "$\\\\triangle ABC = \\\\triangle MPN$",
        "correct": false
      }
    ],
    "explanation": "$A$ nối $AB$ và $AC$, ứng với $N$ (nối $NP$ và $NM$). $B$ ứng với $P$, $C$ ứng với $M$. Do đó $\\\\triangle ABC = \\\\triangle NPM$."
  },
  {
    "id": 6,
    "title": "Câu 6: Cạnh chung trong tam giác",
    "pts": 20,
    "question": "Cho tứ giác $ABCD$ có $AB = CD$ và $AD = BC$. Để chứng minh $\\\\triangle ABD = \\\\triangle CDB$, ta sử dụng yếu tố nào làm điều kiện thứ ba?",
    "options": [
      {
        "text": "Cạnh $BD$ chung",
        "correct": true
      },
      {
        "text": "Cạnh $AC$ chung",
        "correct": false
      },
      {
        "text": "$\\\\widehat{A} = \\\\widehat{C}$",
        "correct": false
      },
      {
        "text": "$AB // CD$",
        "correct": false
      }
    ],
    "explanation": "Cả hai tam giác $\\\\triangle ABD$ và $\\\\triangle CDB$ đều có chung cạnh $BD$, kết hợp với giả thiết $AB = CD$ và $AD = BC$ suy ra hai tam giác bằng nhau theo trường hợp (c-c-c)."
  },
  {
    "id": 7,
    "title": "Câu 7: Tính số đo góc từ hai tam giác bằng nhau",
    "pts": 20,
    "question": "Cho $\\\\triangle ABC = \\\\triangle MNP$ có $\\\\widehat{A} = 65^\\\\circ$ và $\\\\widehat{B} = 45^\\\\circ$. Số đo của góc $\\\\widehat{P}$ là:",
    "options": [
      {
        "text": "$70^\\\\circ$",
        "correct": true
      },
      {
        "text": "$65^\\\\circ$",
        "correct": false
      },
      {
        "text": "$45^\\\\circ$",
        "correct": false
      },
      {
        "text": "$110^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Trong $\\\\triangle ABC$, ta có $\\\\widehat{C} = 180^\\\\circ - (65^\\\\circ + 45^\\\\circ) = 70^\\\\circ$. Vì $\\\\triangle ABC = \\\\triangle MNP$ nên $\\\\widehat{P} = \\\\widehat{C} = 70^\\\\circ$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tính bền vững của hình tam giác",
    "pts": 20,
    "question": "Trong kĩ thuật xây dựng (như giàn cẩu, khung cầu, mái nhà), người ta thường ghép các thanh dầm thành các hình tam giác vì:",
    "options": [
      {
        "text": "Hình tam giác có độ cứng vững cố định theo trường hợp (c-c-c)",
        "correct": true
      },
      {
        "text": "Hình tam giác dùng ít vật liệu nhất",
        "correct": false
      },
      {
        "text": "Hình tam giác dễ sơn màu hơn",
        "correct": false
      },
      {
        "text": "Hình tam giác nhẹ hơn các hình khác",
        "correct": false
      }
    ],
    "explanation": "Tính chất 'cứng' của tam giác: Khi độ dài ba cạnh đã cố định, hình dạng tam giác hoàn toàn không thể bị biến dạng mà không làm thay đổi độ dài các cạnh."
  },
  {
    "id": 9,
    "title": "Câu 9: Bán kính cung tròn compa",
    "pts": 20,
    "question": "Muốn dựng tam giác $MNP$ có $MN = 5\\\\text{ cm}$, $NP = 6\\\\text{ cm}$, $MP = 7\\\\text{ cm}$. Sau khi vẽ đoạn $MN = 5\\\\text{ cm}$, ta vẽ cung tròn tâm $M$ bán kính bằng bao nhiêu?",
    "options": [
      {
        "text": "$7\\\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$6\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$5\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$12\\\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Cung tròn tâm $M$ dùng để xác định khoảng cách $MP = 7\\\\text{ cm}$, do đó bán kính của nó phải bằng $7\\\\text{ cm}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Suy luận từ hai tam giác bằng nhau",
    "pts": 20,
    "question": "Cho $\\\\triangle ABC = \\\\triangle A'B'C'$. Khẳng định nào sau đây là **sai**?",
    "options": [
      {
        "text": "$\\\\widehat{A} = \\\\widehat{B'}$",
        "correct": true
      },
      {
        "text": "$AB = A'B'$",
        "correct": false
      },
      {
        "text": "$BC = B'C'$",
        "correct": false
      },
      {
        "text": "$\\\\widehat{C} = \\\\widehat{C'}$",
        "correct": false
      }
    ],
    "explanation": "Đỉnh $A$ tương ứng với $A'$, nên $\\\\widehat{A} = \\\\widehat{A'}$, khẳng định $\\\\widehat{A} = \\\\widehat{B'}$ là sai."
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
    
                const canvas = document.getElementById('labCanvas1');
                const ctx = canvas.getContext('2d');
                let shift = 120;

                function drawMatch() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    // Tam giac ABC goc
                    const ax = 120, ay = 50;
                    const bx = 60, by = 180;
                    const cx = 200, cy = 180;

                    // Tam giac A'B'C' di chuyen
                    const a2x = ax + shift, a2y = ay;
                    const b2x = bx + shift, b2y = by;
                    const c2x = cx + shift, c2y = cy;

                    // Ve tam giac 1 (xanh lam)
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 3; ctx.stroke();

                    // Ve tam giac 2 (xanh ngoc)
                    ctx.fillStyle = 'rgba(16, 185, 129, 0.25)';
                    ctx.beginPath();
                    ctx.moveTo(a2x, a2y); ctx.lineTo(b2x, b2y); ctx.lineTo(c2x, c2y); ctx.closePath();
                    ctx.fill();
                    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 3; ctx.stroke();

                    // Dinh
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText('A', ax - 5, ay - 10);
                    ctx.fillText('B', bx - 15, by + 18);
                    ctx.fillText('C', cx + 8, cy + 18);

                    if (shift > 20) {
                        ctx.fillStyle = '#10b981';
                        ctx.fillText("A'", a2x - 5, a2y - 10);
                        ctx.fillText("B'", b2x - 15, b2y + 18);
                        ctx.fillText("C'", c2x + 8, c2y + 18);
                    }

                    const out = document.getElementById('lab1MatchOut');
                    if (shift <= 5) {
                        out.innerHTML = `<span style="color:#10b981;">🎉 Trùng khít hoàn hảo! Hai tam giác $\\triangle ABC$ và $\\triangle A'B'C'$ hoàn toàn bằng nhau: $AB = A'B', BC = B'C', AC = A'C'$.</span>`;
                    } else {
                        out.innerHTML = `Khoảng cách giữa hai tam giác: $d = ${shift}\\text{ px}$. Hãy kéo về 0 px để ghép hai tam giác trùng khít lên nhau!`;
                    }
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 230 * window.devicePixelRatio || 230;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawMatch();
                }

                document.getElementById('sliderShift').addEventListener('input', e => {
                    shift = parseInt(e.target.value);
                    document.getElementById('valShift').textContent = `${shift} px`;
                    drawMatch();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let a = 160, c = 130, b = 140;

                function drawCompa() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const bx = (w - a) / 2;
                    const by = h * 0.78;
                    const cx = bx + a;
                    const cy = by;

                    // Kiem tra bat dang thuc tam giac
                    const valid = (a + b > c) && (a + c > b) && (b + c > a);
                    const out = document.getElementById('lab2CompaOut');

                    if (!valid) {
                        ctx2.fillStyle = '#f43f5e';
                        ctx2.font = 'bold 14px Segoe UI';
                        ctx2.textAlign = 'center';
                        ctx2.fillText('Hai cung tròn không cắt nhau! Không tồn tại tam giác.', w / 2, h / 2);
                        out.innerHTML = `<span style="color:#f43f5e;">Không dựng được tam giác vì không thỏa mãn bất đẳng thức tam giác: $a + b > c$.</span>`;
                        renderMathInTree(out);
                        return;
                    }

                    // Tinh toa do dinh A
                    const cosB = (a * a + c * c - b * b) / (2 * a * c);
                    const sinB = Math.sqrt(Math.max(0, 1 - cosB * cosB));
                    const ax = bx + c * cosB;
                    const ay = by - c * sinB;

                    // Cung tron tam B ban kinh c
                    ctx2.strokeStyle = 'rgba(6, 182, 212, 0.4)';
                    ctx2.lineWidth = 2;
                    ctx2.setLineDash([4, 4]);
                    ctx2.beginPath();
                    ctx2.arc(bx, by, c, -Math.PI * 0.7, 0);
                    ctx2.stroke();

                    // Cung tron tam C ban kinh b
                    ctx2.strokeStyle = 'rgba(245, 158, 11, 0.4)';
                    ctx2.beginPath();
                    ctx2.arc(cx, cy, b, -Math.PI, -Math.PI * 0.3);
                    ctx2.stroke();
                    ctx2.setLineDash([]);

                    // Tam giac ABC
                    ctx2.fillStyle = 'rgba(99, 102, 241, 0.2)';
                    ctx2.beginPath();
                    ctx2.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx2.closePath();
                    ctx2.fill();

                    ctx2.strokeStyle = '#6366f1';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath();
                    ctx2.moveTo(ax, ay); ctx2.lineTo(bx, by); ctx2.lineTo(cx, cy); ctx2.closePath();
                    ctx2.stroke();

                    // Dinh & Giao diem
                    ctx2.fillStyle = '#ef4444';
                    ctx2.beginPath(); ctx2.arc(ax, ay, 5, 0, Math.PI * 2); ctx2.fill();

                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 13px Segoe UI';
                    ctx2.textAlign = 'left';
                    ctx2.fillText(`A (giao điểm)`, ax - 10, ay - 12);
                    ctx2.fillText(`B`, bx - 20, by + 18);
                    ctx2.fillText(`C`, cx + 8, cy + 18);

                    out.innerHTML = `Ba cạnh: $a = ${a}$, $b = ${b}$, $c = ${c}$. Giao điểm của hai cung tròn xác định duy nhất đỉnh $A$ $\\implies \\triangle ABC$ hoàn toàn xác định theo trường hợp (c-c-c).`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 240 * window.devicePixelRatio || 240;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawCompa();
                }

                document.getElementById('sliderSideA').addEventListener('input', e => {
                    a = parseInt(e.target.value);
                    document.getElementById('valSideA').textContent = a;
                    drawCompa();
                });
                document.getElementById('sliderSideC').addEventListener('input', e => {
                    c = parseInt(e.target.value);
                    document.getElementById('valSideC').textContent = c;
                    drawCompa();
                });
                document.getElementById('sliderSideB').addEventListener('input', e => {
                    b = parseInt(e.target.value);
                    document.getElementById('valSideB').textContent = b;
                    drawCompa();
                });

                window.addEventListener('resize', resizeCanvas2);
                setTimeout(resizeCanvas2, 100);
            
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
