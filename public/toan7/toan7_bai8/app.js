// ================================================================
// BÀI 8: GÓC Ở VỊ TRÍ ĐẶC BIỆT. TIA PHÂN GIÁC CỦA MỘT GÓC - TOÁN 7 KNTT
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
  userTitle: 'Chuyên Gia Hình Học Góc 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai8_state';

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
    "title": "Câu 1: Hai góc đối đỉnh",
    "pts": 20,
    "question": "Cho hai đường thẳng $xx'$ và $yy'$ cắt nhau tại $O$. Nếu $\\widehat{xOy} = 60^\\circ$ thì số đo của góc đối đỉnh $\\widehat{x'Oy'}$ là:",
    "options": [
      {
        "text": "$60^\\circ$",
        "correct": true
      },
      {
        "text": "$120^\\circ$",
        "correct": false
      },
      {
        "text": "$30^\\circ$",
        "correct": false
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí, hai góc đối đỉnh thì bằng nhau nên $\\widehat{x'Oy'} = \\widehat{xOy} = 60^\\circ$."
  },
  {
    "id": 2,
    "title": "Câu 2: Hai góc kề bù",
    "pts": 20,
    "question": "Hai góc $\\widehat{A}$ và $\\widehat{B}$ là hai góc kề bù. Biết $\\widehat{A} = 75^\\circ$, số đo của góc $\\widehat{B}$ là:",
    "options": [
      {
        "text": "$105^\\circ$",
        "correct": true
      },
      {
        "text": "$15^\\circ$",
        "correct": false
      },
      {
        "text": "$75^\\circ$",
        "correct": false
      },
      {
        "text": "$115^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Hai góc kề bù có tổng số đo bằng $180^\\circ$, do đó $\\widehat{B} = 180^\\circ - 75^\\circ = 105^\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính chất tia phân giác",
    "pts": 20,
    "question": "Tia $Ot$ là tia phân giác của góc $\\widehat{xOy}$ có số đo $110^\\circ$. Số đo của góc $\\widehat{xOt}$ là:",
    "options": [
      {
        "text": "$55^\\circ$",
        "correct": true
      },
      {
        "text": "$70^\\circ$",
        "correct": false
      },
      {
        "text": "$110^\\circ$",
        "correct": false
      },
      {
        "text": "$220^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Tia phân giác chia đôi góc: $\\widehat{xOt} = \\frac{\\widehat{xOy}}{2} = \\frac{110^\\circ}{2} = 55^\\circ$."
  },
  {
    "id": 4,
    "title": "Câu 4: Hai tia phân giác của hai góc kề bù",
    "pts": 20,
    "question": "Hai tia phân giác của hai góc kề bù tạo với nhau một góc bằng bao nhiêu độ?",
    "options": [
      {
        "text": "$90^\\circ$",
        "correct": true
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      },
      {
        "text": "$45^\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Gọi hai góc kề bù là $\\widehat{AOB}$ và $\\widehat{BOC}$. Hai tia phân giác tạo thành góc $\\frac{\\widehat{AOB}}{2} + \\frac{\\widehat{BOC}}{2} = \\frac{\\widehat{AOB} + \\widehat{BOC}}{2} = \\frac{180^\\circ}{2} = 90^\\circ$."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhận diện hai góc đối đỉnh",
    "pts": 20,
    "question": "Khẳng định nào sau đây luôn ĐÚNG?",
    "options": [
      {
        "text": "Hai góc đối đỉnh thì bằng nhau.",
        "correct": true
      },
      {
        "text": "Hai góc bằng nhau thì đối đỉnh.",
        "correct": false
      },
      {
        "text": "Hai góc có chung đỉnh thì đối đỉnh.",
        "correct": false
      },
      {
        "text": "Hai góc kề nhau thì bù nhau.",
        "correct": false
      }
    ],
    "explanation": "Hai góc đối đỉnh luôn bằng nhau, nhưng chiều ngược lại 'hai góc bằng nhau thì đối đỉnh' chưa chắc đúng (chúng có thể không chung đỉnh hoặc cạnh không phải là tia đối)."
  },
  {
    "id": 6,
    "title": "Câu 6: Tính góc khi biết hiệu hai góc kề bù",
    "pts": 20,
    "question": "Cho hai góc kề bù $\\widehat{xOy}$ và $\\widehat{yOz}$ thoả mãn $\\widehat{xOy} - \\widehat{yOz} = 40^\\circ$. Số đo của $\\widehat{xOy}$ là:",
    "options": [
      {
        "text": "$110^\\circ$",
        "correct": true
      },
      {
        "text": "$70^\\circ$",
        "correct": false
      },
      {
        "text": "$140^\\circ$",
        "correct": false
      },
      {
        "text": "$80^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\widehat{xOy} + \\widehat{yOz} = 180^\\circ$ và $\\widehat{xOy} - \\widehat{yOz} = 40^\\circ$. Suy ra $\\widehat{xOy} = \\frac{180^\\circ + 40^\\circ}{2} = 110^\\circ$."
  },
  {
    "id": 7,
    "title": "Câu 7: Góc tạo bởi tia đối",
    "pts": 20,
    "question": "Cho góc $\\widehat{xOy} = 50^\\circ$. Vẽ tia $Oz$ là tia đối của tia $Ox$. Số đo của góc $\\widehat{yOz}$ là:",
    "options": [
      {
        "text": "$130^\\circ$",
        "correct": true
      },
      {
        "text": "$50^\\circ$",
        "correct": false
      },
      {
        "text": "$40^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Vì $Oz$ là tia đối của $Ox$ nên $\\widehat{xOy}$ và $\\widehat{yOz}$ là hai góc kề bù. Do đó $\\widehat{yOz} = 180^\\circ - 50^\\circ = 130^\\circ$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tia phân giác của góc bẹt",
    "pts": 20,
    "question": "Tia phân giác của một góc bẹt tạo với mỗi cạnh của góc bẹt đó một góc bằng:",
    "options": [
      {
        "text": "$90^\\circ$ (góc vuông)",
        "correct": true
      },
      {
        "text": "$45^\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Góc bẹt có số đo $180^\\circ$. Tia phân giác chia đôi góc bẹt thành hai góc vuông bằng $180^\\circ : 2 = 90^\\circ$."
  },
  {
    "id": 9,
    "title": "Câu 9: Điểm nằm trong góc",
    "pts": 20,
    "question": "Cho tia $Om$ nằm giữa hai tia $Ox$ và $Oy$. Điều kiện nào sau đây khẳng định $Om$ là tia phân giác của $\\widehat{xOy}$?",
    "options": [
      {
        "text": "$\\widehat{xOm} = \\widehat{mOy}$",
        "correct": true
      },
      {
        "text": "$\\widehat{xOm} + \\widehat{mOy} = 180^\\circ$",
        "correct": false
      },
      {
        "text": "$\\widehat{xOy} = 2\\widehat{xOm}$ nhưng không cần $Om$ nằm giữa",
        "correct": false
      },
      {
        "text": "$\\widehat{xOm} > \\widehat{mOy}$",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa, nếu tia $Om$ nằm giữa hai tia $Ox, Oy$ và $\\widehat{xOm} = \\widehat{mOy}$ thì $Om$ là tia phân giác của góc $\\widehat{xOy}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng thực tế tia phân giác",
    "pts": 20,
    "question": "Một người thợ muốn xẻ một thanh gỗ chữ V góc $60^\\circ$ thành hai nửa cân đối hoàn toàn. Người thợ cần vạch đường cưa theo tia nào?",
    "options": [
      {
        "text": "Tia phân giác của góc $60^\\circ$",
        "correct": true
      },
      {
        "text": "Tia vuông góc với một cạnh",
        "correct": false
      },
      {
        "text": "Tia đối của một cạnh",
        "correct": false
      },
      {
        "text": "Tia bất kì nằm trong góc",
        "correct": false
      }
    ],
    "explanation": "Tia phân giác chia góc $60^\\circ$ thành hai góc đều bằng $30^\\circ$, giúp tạo ra hai nửa đối xứng hoàn hảo."
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
                let angDeg = 50;

                function drawIntersect() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const cx = w / 2;
                    const cy = h / 2;
                    const r = Math.min(w, h) * 0.42;

                    const rad = angDeg * Math.PI / 180;

                    // Duong thang 1 (ngang)
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(cx - r, cy);
                    ctx.lineTo(cx + r, cy);
                    ctx.stroke();

                    // Duong thang 2 (cheo goc rad)
                    const dx = r * Math.cos(rad);
                    const dy = r * Math.sin(rad);
                    ctx.strokeStyle = '#f43f5e';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(cx - dx, cy + dy);
                    ctx.lineTo(cx + dx, cy - dy);
                    ctx.stroke();

                    // Goc 1 (phai tren)
                    ctx.fillStyle = '#06b6d4';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.arc(cx, cy, 32, -rad, 0);
                    ctx.closePath();
                    ctx.fill();

                    // Goc 3 (trai duoi - doi dinh goc 1)
                    ctx.beginPath();
                    ctx.moveTo(cx, cy);
                    ctx.arc(cx, cy, 32, Math.PI - rad, Math.PI);
                    ctx.closePath();
                    ctx.fill();

                    // Chu thich
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(`O1 = ${angDeg}°`, cx + 55, cy - 15);
                    ctx.fillText(`O3 = ${angDeg}°`, cx - 55, cy + 20);

                    const supp = 180 - angDeg;
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillText(`O2 = ${supp}°`, cx - 30, cy - 35);
                    ctx.fillText(`O4 = ${supp}°`, cx + 30, cy + 40);

                    const out = document.getElementById('lab1AngleOut');
                    out.innerHTML = `Hai góc đối đỉnh: $\\widehat{O_1} = \\widehat{O_3} = ${angDeg}^\\circ$; $\\widehat{O_2} = \\widehat{O_4} = ${supp}^\\circ$. Hai góc kề bù: $\\widehat{O_1} + \\widehat{O_2} = ${angDeg}^\\circ + ${supp}^\\circ = 180^\\circ$.`;
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 220 * window.devicePixelRatio || 220;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawIntersect();
                }

                document.getElementById('sliderAngleA').addEventListener('input', e => {
                    angDeg = parseInt(e.target.value);
                    document.getElementById('valAngleA').textContent = `${angDeg}°`;
                    drawIntersect();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let mainAng = 80;

                function drawBisect() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const ox = 70;
                    const oy = h - 40;
                    const len = Math.min(w * 0.6, h * 0.85);

                    const radMain = mainAng * Math.PI / 180;
                    const radHalf = radMain / 2;

                    // Tia Ox (nam ngang)
                    ctx2.strokeStyle = '#6366f1';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath();
                    ctx2.moveTo(ox, oy);
                    ctx2.lineTo(ox + len, oy);
                    ctx2.stroke();

                    // Tia Oy
                    ctx2.beginPath();
                    ctx2.moveTo(ox, oy);
                    ctx2.lineTo(ox + len * Math.cos(radMain), oy - len * Math.sin(radMain));
                    ctx2.stroke();

                    // Tia phan giac Oz
                    ctx2.strokeStyle = '#10b981';
                    ctx2.lineWidth = 3;
                    ctx2.setLineDash([5, 3]);
                    ctx2.beginPath();
                    ctx2.moveTo(ox, oy);
                    ctx2.lineTo(ox + len * Math.cos(radHalf), oy - len * Math.sin(radHalf));
                    ctx2.stroke();
                    ctx2.setLineDash([]);

                    // Cung goc xOz
                    ctx2.strokeStyle = '#06b6d4';
                    ctx2.lineWidth = 2;
                    ctx2.beginPath();
                    ctx2.arc(ox, oy, 40, -radHalf, 0);
                    ctx2.stroke();

                    // Cung goc zOy
                    ctx2.strokeStyle = '#f59e0b';
                    ctx2.beginPath();
                    ctx2.arc(ox, oy, 52, -radMain, -radHalf);
                    ctx2.stroke();

                    // Chu thich
                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 13px Segoe UI';
                    ctx2.fillText('O', ox - 20, oy + 5);
                    ctx2.fillText('x', ox + len + 10, oy + 5);
                    ctx2.fillText('y', ox + len * Math.cos(radMain) + 8, oy - len * Math.sin(radMain));
                    ctx2.fillStyle = '#10b981';
                    ctx2.fillText('z (phân giác)', ox + len * Math.cos(radHalf) + 10, oy - len * Math.sin(radHalf));

                    const halfAng = mainAng / 2;
                    const out = document.getElementById('lab2BisectOut');
                    out.innerHTML = `Góc ban đầu: $\\widehat{xOy} = ${mainAng}^\\circ$. Tia phân giác $Oz$ chia đôi: $\\widehat{xOz} = \\widehat{zOy} = \\frac{${mainAng}^\\circ}{2} = ${halfAng}^\\circ$.`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 200 * window.devicePixelRatio || 200;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawBisect();
                }

                document.getElementById('sliderAngleMain').addEventListener('input', e => {
                    mainAng = parseInt(e.target.value);
                    document.getElementById('valAngleMain').textContent = `${mainAng}°`;
                    drawBisect();
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
