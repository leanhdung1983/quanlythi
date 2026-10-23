// ================================================================
// BÀI 15: CÁC TRƯỜNG HỢP BẰNG NHAU CỦA TAM GIÁC VUÔNG - TOÁN 7 KNTT
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
  userTitle: 'Chuyên Gia Tam Giác Vuông',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai15_state';

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
    "title": "Câu 1: Số điều kiện của tam giác vuông",
    "pts": 20,
    "question": "Để chứng minh hai tam giác vuông bằng nhau, ta cần tối thiểu bao nhiêu yếu tố tương ứng bằng nhau (về cạnh hoặc góc nhọn)?",
    "options": [
      {
        "text": "2 yếu tố",
        "correct": true
      },
      {
        "text": "3 yếu tố",
        "correct": false
      },
      {
        "text": "1 yếu tố",
        "correct": false
      },
      {
        "text": "4 yếu tố",
        "correct": false
      }
    ],
    "explanation": "Vì hai tam giác vuông đã có sẵn một cặp góc tương ứng bằng nhau ($90^\\\\circ$), nên chỉ cần thêm 2 yếu tố tương ứng (về cạnh/góc nhọn) là đủ để kết luận chúng bằng nhau."
  },
  {
    "id": 2,
    "title": "Câu 2: Trường hợp hai cạnh góc vuông",
    "pts": 20,
    "question": "Trường hợp bằng nhau 'hai cạnh góc vuông' của tam giác vuông thực chất được suy ra từ trường hợp bằng nhau nào của tam giác thường?",
    "options": [
      {
        "text": "Cạnh - Góc - Cạnh (c-g-c)",
        "correct": true
      },
      {
        "text": "Cạnh - Cạnh - Cạnh (c-c-c)",
        "correct": false
      },
      {
        "text": "Góc - Cạnh - Góc (g-c-g)",
        "correct": false
      },
      {
        "text": "Góc - Góc - Góc",
        "correct": false
      }
    ],
    "explanation": "Hai cạnh góc vuông kẹp góc vuông $90^\\\\circ$ ở giữa, nên thực chất là trường hợp hai cạnh và góc xen giữa bằng nhau (c-g-c)."
  },
  {
    "id": 3,
    "title": "Câu 3: Trường hợp cạnh huyền - góc nhọn",
    "pts": 20,
    "question": "Cho $\\\\triangle ABC$ vuông tại $A$ và $\\\\triangle DEF$ vuông tại $D$ có $BC = EF$ và $\\\\widehat{B} = \\\\widehat{E}$. Hai tam giác vuông này bằng nhau theo trường hợp nào?",
    "options": [
      {
        "text": "Cạnh huyền - góc nhọn",
        "correct": true
      },
      {
        "text": "Hai cạnh góc vuông",
        "correct": false
      },
      {
        "text": "Cạnh huyền - cạnh góc vuông",
        "correct": false
      },
      {
        "text": "c-c-c",
        "correct": false
      }
    ],
    "explanation": "$BC$ và $EF$ là cạnh huyền, $\\\\widehat{B}$ và $\\\\widehat{E}$ là góc nhọn tương ứng, do đó bằng nhau theo trường hợp 'cạnh huyền - góc nhọn'."
  },
  {
    "id": 4,
    "title": "Câu 4: Cạnh huyền - cạnh góc vuông",
    "pts": 20,
    "question": "Cho $\\\\triangle MNP$ vuông tại $M$ và $\\\\triangle QRS$ vuông tại $Q$ có $NP = RS$ và $MN = QR$. Hai tam giác này bằng nhau theo trường hợp nào?",
    "options": [
      {
        "text": "Cạnh huyền - cạnh góc vuông",
        "correct": true
      },
      {
        "text": "Hai cạnh góc vuông",
        "correct": false
      },
      {
        "text": "Cạnh huyền - góc nhọn",
        "correct": false
      },
      {
        "text": "c-g-c",
        "correct": false
      }
    ],
    "explanation": "$NP$ và $RS$ là hai cạnh huyền, $MN$ và $QR$ là hai cạnh góc vuông, do đó bằng nhau theo trường hợp 'cạnh huyền - cạnh góc vuông'."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhận diện trường hợp suy ra từ g-c-g",
    "pts": 20,
    "question": "Trường hợp bằng nhau 'cạnh góc vuông và góc nhọn kề cạnh ấy' của tam giác vuông được suy ra trực tiếp từ:",
    "options": [
      {
        "text": "Góc - Cạnh - Góc (g-c-g)",
        "correct": true
      },
      {
        "text": "Cạnh - Cạnh - Cạnh (c-c-c)",
        "correct": false
      },
      {
        "text": "Cạnh - Góc - Cạnh (c-g-c)",
        "correct": false
      },
      {
        "text": "Định lí Thales",
        "correct": false
      }
    ],
    "explanation": "Cạnh góc vuông kề với góc vuông ($90^\\\\circ$) và góc nhọn đã cho, tức là một cạnh và hai góc kề bằng nhau, chính là trường hợp (g-c-g)."
  },
  {
    "id": 6,
    "title": "Câu 6: Khoảng cách từ điểm trên phân giác",
    "pts": 20,
    "question": "Điểm $M$ nằm trên tia phân giác của góc $\\\\widehat{xOy}$. Kẻ $MA \\\\perp Ox$ và $MB \\\\perp Oy$. Khẳng định nào sau đây là đúng?",
    "options": [
      {
        "text": "$MA = MB$ vì $\\\\triangle OAM = \\\\triangle OBM$ (cạnh huyền - góc nhọn)",
        "correct": true
      },
      {
        "text": "$MA > MB$",
        "correct": false
      },
      {
        "text": "$MA < MB$",
        "correct": false
      },
      {
        "text": "$MA + MB = OM$",
        "correct": false
      }
    ],
    "explanation": "Xét hai tam giác vuông $\\\\triangle OAM$ và $\\\\triangle OBM$ có cạnh huyền $OM$ chung và góc nhọn $\\\\widehat{AOM} = \\\\widehat{BOM}$, do đó chúng bằng nhau theo trường hợp cạnh huyền - góc nhọn $\\\\implies MA = MB$."
  },
  {
    "id": 7,
    "title": "Câu 7: Cạnh góc vuông và góc nhọn đối diện",
    "pts": 20,
    "question": "Nếu hai tam giác vuông có một cạnh góc vuông và góc nhọn **đối diện** cạnh ấy bằng nhau thì hai tam giác vuông đó:",
    "options": [
      {
        "text": "Vẫn bằng nhau (vì góc nhọn còn lại cũng sẽ bằng nhau)",
        "correct": true
      },
      {
        "text": "Không thể bằng nhau",
        "correct": false
      },
      {
        "text": "Chỉ đồng dạng chứ không bằng nhau",
        "correct": false
      },
      {
        "text": "Chưa đủ dữ kiện kết luận",
        "correct": false
      }
    ],
    "explanation": "Vì hai góc nhọn phụ nhau, góc nhọn đối diện bằng nhau suy ra góc nhọn kề cũng bằng nhau, đưa về trường hợp cạnh góc vuông - góc nhọn kề (g-c-g)."
  },
  {
    "id": 8,
    "title": "Câu 8: Cần thêm điều kiện gì?",
    "pts": 20,
    "question": "Cho hai tam giác vuông $\\\\triangle ABC$ (vuông tại $A$) và $\\\\triangle A'B'C'$ (vuông tại $A'$) có $BC = B'C'$. Cần thêm điều kiện nào để kết luận $\\\\triangle ABC = \\\\triangle A'B'C'$?",
    "options": [
      {
        "text": "$AB = A'B'$ hoặc $\\\\widehat{B} = \\\\widehat{B'}$",
        "correct": true
      },
      {
        "text": "$\\\\widehat{A} = \\\\widehat{A'}$",
        "correct": false
      },
      {
        "text": "$BC = A'C'$",
        "correct": false
      },
      {
        "text": "Không cần thêm điều kiện nào",
        "correct": false
      }
    ],
    "explanation": "Đã có cạnh huyền $BC = B'C'$, chỉ cần thêm một cạnh góc vuông ($AB = A'B'$) hoặc một góc nhọn ($\\\\widehat{B} = \\\\widehat{B'}$)."
  },
  {
    "id": 9,
    "title": "Câu 9: Tính chất đối xứng qua đường cao",
    "pts": 20,
    "question": "Cho tam giác $ABC$ cân tại $A$. Kẻ đường cao $AH$ ($H \\\\in BC$). Khẳng định nào sau đây là đúng?",
    "options": [
      {
        "text": "$\\\\triangle ABH = \\\\triangle ACH$ (cạnh huyền - cạnh góc vuông)",
        "correct": true
      },
      {
        "text": "$\\\\triangle ABH \\\\neq \\\\triangle ACH$",
        "correct": false
      },
      {
        "text": "$HB > HC$",
        "correct": false
      },
      {
        "text": "$\\\\widehat{BAH} > \\\\widehat{CAH}$",
        "correct": false
      }
    ],
    "explanation": "Hai tam giác vuông $\\\\triangle ABH$ và $\\\\triangle ACH$ có cạnh huyền $AB = AC$ (tam giác cân) và cạnh góc vuông $AH$ chung, do đó bằng nhau theo trường hợp cạnh huyền - cạnh góc vuông."
  },
  {
    "id": 10,
    "title": "Câu 10: Tính cạnh góc vuông từ hai tam giác vuông bằng nhau",
    "pts": 20,
    "question": "Cho $\\\\triangle ABC$ vuông tại $A$ và $\\\\triangle DEF$ vuông tại $D$ bằng nhau. Biết $BC = 10\\\\text{ cm}$ và $AC = 8\\\\text{ cm}$. Độ dài cạnh $DF$ tương ứng với $AC$ là:",
    "options": [
      {
        "text": "$8\\\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$6\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$10\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$4\\\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Vì $\\\\triangle ABC = \\\\triangle DEF$ nên các cạnh tương ứng bằng nhau: $DF = AC = 8\\\\text{ cm}$."
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
                let angB = 35;
                const bc = 200;

                function drawRt() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const bx = 60;
                    const by = h * 0.78;
                    const rad = angB * Math.PI / 180;

                    const cx = bx + bc * Math.cos(rad);
                    const cy = by - bc * Math.sin(rad);
                    const ax = cx;
                    const ay = by;

                    // Tam giac ABC vuong tai A
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
                    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ax, ay); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();

                    // Cac canh
                    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ax, ay); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(cx, cy); ctx.stroke();

                    // Canh huyen BC
                    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(cx, cy); ctx.stroke();

                    // Ky hieu goc vuong tai A
                    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2;
                    ctx.strokeRect(ax - 15, ay - 15, 15, 15);

                    // Cung goc B
                    ctx.strokeStyle = '#06b6d4';
                    ctx.beginPath(); ctx.arc(bx, by, 35, -rad, 0); ctx.stroke();

                    // Dinh
                    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText(`B (${angB}°)`, bx - 25, by + 18);
                    ctx.fillText(`A (90°)`, ax + 5, ay + 18);
                    ctx.fillText(`C (${90 - angB}°)`, cx + 8, cy - 8);

                    const out = document.getElementById('lab1RtOut');
                    out.innerHTML = `Cạnh huyền $BC = ${bc}$, góc nhọn $\\widehat{B} = ${angB}^\\circ \\implies \\widehat{C} = ${90 - angB}^\\circ$. Hai tam giác vuông có cùng cạnh huyền và góc nhọn thì trùng khít hoàn toàn!`;
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 240 * window.devicePixelRatio || 240;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawRt();
                }

                document.getElementById('sliderRt_B').addEventListener('input', e => {
                    angB = parseInt(e.target.value);
                    document.getElementById('valRt_B').textContent = `${angB}°`;
                    drawRt();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let ac = 120;
                const bc = 220;

                function drawHypLeg() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const ab = Math.round(Math.sqrt(bc * bc - ac * ac));

                    const ax = 80;
                    const ay = h * 0.8;
                    const bx = ax + ab;
                    const by = ay;
                    const cx = ax;
                    const cy = ay - ac;

                    // Tam giac ABC vuong tai A
                    ctx2.fillStyle = 'rgba(245, 158, 11, 0.2)';
                    ctx2.beginPath(); ctx2.moveTo(ax, ay); ctx2.lineTo(bx, by); ctx2.lineTo(cx, cy); ctx2.closePath(); ctx2.fill();

                    // Canh goc vuong AC & AB
                    ctx2.strokeStyle = '#f59e0b'; ctx2.lineWidth = 4;
                    ctx2.beginPath(); ctx2.moveTo(ax, ay); ctx2.lineTo(cx, cy); ctx2.stroke();
                    ctx2.strokeStyle = '#6366f1'; ctx2.lineWidth = 3;
                    ctx2.beginPath(); ctx2.moveTo(ax, ay); ctx2.lineTo(bx, by); ctx2.stroke();

                    // Canh huyen BC
                    ctx2.strokeStyle = '#10b981'; ctx2.lineWidth = 4;
                    ctx2.beginPath(); ctx2.moveTo(bx, by); ctx2.lineTo(cx, cy); ctx2.stroke();

                    // Goc vuong A
                    ctx2.strokeStyle = '#ffffff'; ctx2.lineWidth = 2;
                    ctx2.strokeRect(ax, ay - 15, 15, 15);

                    // Dinh
                    ctx2.fillStyle = '#ffffff'; ctx2.font = 'bold 13px Segoe UI';
                    ctx2.fillText(`A (90°)`, ax - 25, ay + 18);
                    ctx2.fillText(`B`, bx + 5, by + 18);
                    ctx2.fillText(`C`, cx - 25, cy - 5);
                    ctx2.fillStyle = '#10b981';
                    ctx2.fillText(`Huyền BC = ${bc}`, (bx + cx)/2 + 5, (by + cy)/2 - 10);

                    const out = document.getElementById('lab2LegOut');
                    out.innerHTML = `Cạnh huyền $BC = ${bc}$, cạnh góc vuông $AC = ${ac}$ $\\implies$ Cạnh góc vuông còn lại $AB = \\sqrt{${bc}^2 - ${ac}^2} = ${ab}$ xác định duy nhất! Tam giác vuông hoàn toàn bằng nhau theo trường hợp (cạnh huyền - cạnh góc vuông).`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 240 * window.devicePixelRatio || 240;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawHypLeg();
                }

                document.getElementById('sliderLegAC').addEventListener('input', e => {
                    ac = parseInt(e.target.value);
                    document.getElementById('valLegAC').textContent = ac;
                    drawHypLeg();
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
