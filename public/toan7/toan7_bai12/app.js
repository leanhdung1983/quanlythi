// ================================================================
// BÀI 12: TỔNG CÁC GÓC TRONG MỘT TAM GIÁC - TOÁN 7 KNTT
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
  userTitle: 'Chuyên Gia Tam Giác 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai12_state';

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
    "title": "Câu 1: Định lí tổng ba góc trong tam giác",
    "pts": 20,
    "question": "Tổng ba góc trong một tam giác bất kì luôn bằng bao nhiêu độ?",
    "options": [
      {
        "text": "$180^\\\\circ$",
        "correct": true
      },
      {
        "text": "$90^\\\\circ$",
        "correct": false
      },
      {
        "text": "$360^\\\\circ$",
        "correct": false
      },
      {
        "text": "$120^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí SGK, tổng ba góc trong một tam giác bất kì luôn luôn bằng $180^\\\\circ$."
  },
  {
    "id": 2,
    "title": "Câu 2: Tính góc thứ ba của tam giác",
    "pts": 20,
    "question": "Cho tam giác $ABC$ có $\\\\widehat{A} = 50^\\\\circ$ và $\\\\widehat{B} = 70^\\\\circ$. Số đo của góc $\\\\widehat{C}$ là:",
    "options": [
      {
        "text": "$60^\\\\circ$",
        "correct": true
      },
      {
        "text": "$50^\\\\circ$",
        "correct": false
      },
      {
        "text": "$70^\\\\circ$",
        "correct": false
      },
      {
        "text": "$80^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\\\widehat{C} = 180^\\\\circ - (\\\\widehat{A} + \\\\widehat{B}) = 180^\\\\circ - (50^\\\\circ + 70^\\\\circ) = 60^\\\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Hai góc nhọn của tam giác vuông",
    "pts": 20,
    "question": "Cho tam giác $MNP$ vuông tại $M$. Nếu $\\\\widehat{N} = 35^\\\\circ$ thì số đo của góc $\\\\widehat{P}$ là:",
    "options": [
      {
        "text": "$55^\\\\circ$",
        "correct": true
      },
      {
        "text": "$45^\\\\circ$",
        "correct": false
      },
      {
        "text": "$65^\\\\circ$",
        "correct": false
      },
      {
        "text": "$145^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Trong tam giác vuông, hai góc nhọn phụ nhau: $\\\\widehat{P} = 90^\\\\circ - \\\\widehat{N} = 90^\\\\circ - 35^\\\\circ = 55^\\\\circ$."
  },
  {
    "id": 4,
    "title": "Câu 4: Định lí góc ngoài của tam giác",
    "pts": 20,
    "question": "Cho tam giác $ABC$ có $\\\\widehat{A} = 40^\\\\circ$ và $\\\\widehat{B} = 80^\\\\circ$. Góc ngoài tại đỉnh $C$ có số đo là:",
    "options": [
      {
        "text": "$120^\\\\circ$",
        "correct": true
      },
      {
        "text": "$60^\\\\circ$",
        "correct": false
      },
      {
        "text": "$100^\\\\circ$",
        "correct": false
      },
      {
        "text": "$140^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Góc ngoài tại một đỉnh bằng tổng hai góc trong không kề: $\\\\widehat{C}_{\\\\text{ngoài}} = \\\\widehat{A} + \\\\widehat{B} = 40^\\\\circ + 80^\\\\circ = 120^\\\\circ$."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhận dạng loại tam giác",
    "pts": 20,
    "question": "Một tam giác có ba góc có số đo lần lượt là $45^\\\\circ$, $45^\\\\circ$ và $90^\\\\circ$. Tam giác đó là:",
    "options": [
      {
        "text": "Tam giác vuông (và cân)",
        "correct": true
      },
      {
        "text": "Tam giác nhọn",
        "correct": false
      },
      {
        "text": "Tam giác tù",
        "correct": false
      },
      {
        "text": "Tam giác đều",
        "correct": false
      }
    ],
    "explanation": "Vì có một góc bằng $90^\\\\circ$ nên đó là tam giác vuông. Hơn nữa hai góc nhọn bằng nhau ($45^\\\\circ$) nên nó là tam giác vuông cân."
  },
  {
    "id": 6,
    "title": "Câu 6: Tìm $x$ trong tam giác",
    "pts": 20,
    "question": "Tam giác $DEF$ có $\\\\widehat{D} = x$, $\\\\widehat{E} = 2x$ và $\\\\widehat{F} = 3x$. Giá trị của $x$ là:",
    "options": [
      {
        "text": "$30^\\\\circ$",
        "correct": true
      },
      {
        "text": "$20^\\\\circ$",
        "correct": false
      },
      {
        "text": "$25^\\\\circ$",
        "correct": false
      },
      {
        "text": "$40^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Tổng ba góc: $x + 2x + 3x = 180^\\\\circ \\\\iff 6x = 180^\\\\circ \\\\iff x = 30^\\\\circ$."
  },
  {
    "id": 7,
    "title": "Câu 7: So sánh góc ngoài với góc trong",
    "pts": 20,
    "question": "Khẳng định nào sau đây là **đúng** về góc ngoài của một tam giác?",
    "options": [
      {
        "text": "Góc ngoài luôn lớn hơn mỗi góc trong không kề với nó",
        "correct": true
      },
      {
        "text": "Góc ngoài luôn nhỏ hơn góc trong kề với nó",
        "correct": false
      },
      {
        "text": "Góc ngoài luôn bằng $180^\\\\circ$",
        "correct": false
      },
      {
        "text": "Góc ngoài luôn là một góc nhọn",
        "correct": false
      }
    ],
    "explanation": "Vì góc ngoài bằng tổng hai góc trong không kề (đều mang số đo dương) nên góc ngoài luôn lớn hơn mỗi góc trong không kề với nó."
  },
  {
    "id": 8,
    "title": "Câu 8: Tam giác đều",
    "pts": 20,
    "question": "Một tam giác đều có ba góc bằng nhau. Số đo của mỗi góc trong tam giác đều là:",
    "options": [
      {
        "text": "$60^\\\\circ$",
        "correct": true
      },
      {
        "text": "$45^\\\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\\\circ$",
        "correct": false
      },
      {
        "text": "$50^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Vì ba góc bằng nhau và tổng bằng $180^\\\\circ$ nên mỗi góc có số đo là $\\\\frac{180^\\\\circ}{3} = 60^\\\\circ$."
  },
  {
    "id": 9,
    "title": "Câu 9: Góc ngoài tại hai đỉnh",
    "pts": 20,
    "question": "Tam giác $ABC$ có góc ngoài tại đỉnh $A$ là $130^\\\\circ$ và $\\\\widehat{B} = 70^\\\\circ$. Số đo của góc $\\\\widehat{C}$ là:",
    "options": [
      {
        "text": "$60^\\\\circ$",
        "correct": true
      },
      {
        "text": "$50^\\\\circ$",
        "correct": false
      },
      {
        "text": "$70^\\\\circ$",
        "correct": false
      },
      {
        "text": "$110^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Góc ngoài tại đỉnh $A$ bằng $\\\\widehat{B} + \\\\widehat{C} = 130^\\\\circ \\\\implies \\\\widehat{C} = 130^\\\\circ - 70^\\\\circ = 60^\\\\circ$."
  },
  {
    "id": 10,
    "title": "Câu 10: Số lượng góc tù trong tam giác",
    "pts": 20,
    "question": "Một tam giác có thể có nhiều nhất bao nhiêu góc tù?",
    "options": [
      {
        "text": "1 góc tù",
        "correct": true
      },
      {
        "text": "2 góc tù",
        "correct": false
      },
      {
        "text": "3 góc tù",
        "correct": false
      },
      {
        "text": "0 góc tù",
        "correct": false
      }
    ],
    "explanation": "Nếu tam giác có từ 2 góc tù trở lên thì tổng 2 góc đó đã lớn hơn $90^\\\\circ + 90^\\\\circ = 180^\\\\circ$, mâu thuẫn với định lí tổng ba góc. Do đó tam giác chỉ có nhiều nhất 1 góc tù."
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
                let angA = 70;
                let angB = 60;

                function drawTri() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    let sum = angA + angB;
                    if (sum >= 170) {
                        angB = 170 - angA;
                        document.getElementById('sliderAngleB').value = angB;
                        document.getElementById('valAngleB').textContent = `${angB}°`;
                    }
                    const angC = 180 - (angA + angB);

                    // Ve tam giac ABC
                    const base = Math.min(w * 0.7, 340);
                    const bx = (w - base) / 2;
                    const by = h * 0.82;
                    const cx = bx + base;
                    const cy = by;

                    // Tinh toa do A tu goc B va C
                    const radB = angB * Math.PI / 180;
                    const radC = angC * Math.PI / 180;
                    const sideC = base * Math.sin(radC) / Math.sin((angA) * Math.PI / 180);
                    const ax = bx + sideC * Math.cos(radB);
                    const ay = by - sideC * Math.sin(radB);

                    // Fill tam giac
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
                    ctx.beginPath();
                    ctx.moveTo(ax, ay);
                    ctx.lineTo(bx, by);
                    ctx.lineTo(cx, cy);
                    ctx.closePath();
                    ctx.fill();

                    // Canh tam giac
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay);
                    ctx.lineTo(bx, by);
                    ctx.lineTo(cx, cy);
                    ctx.closePath();
                    ctx.stroke();

                    // Dinh va nhan
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText(`A (${angA}°)`, ax - 15, ay - 12);
                    ctx.fillText(`B (${angB}°)`, bx - 25, by + 18);
                    ctx.fillText(`C (${angC}°)`, cx + 8, cy + 18);

                    // Phan loai
                    let type = "Tam giác nhọn";
                    if (angA === 90 || angB === 90 || angC === 90) type = "Tam giác vuông";
                    else if (angA > 90 || angB > 90 || angC > 90) type = "Tam giác tù";

                    const out = document.getElementById('lab1TriOut');
                    out.innerHTML = `$\\widehat{A} = ${angA}^\\circ$, $\\widehat{B} = ${angB}^\\circ \\implies \\widehat{C} = 180^\\circ - (${angA}^\\circ + ${angB}^\\circ) = ${angC}^\\circ$. Tổng: $180^\\circ$. Phân loại: <strong>${type}</strong>.`;
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 240 * window.devicePixelRatio || 240;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawTri();
                }

                document.getElementById('sliderAngleA').addEventListener('input', e => {
                    angA = parseInt(e.target.value);
                    document.getElementById('valAngleA').textContent = `${angA}°`;
                    drawTri();
                });
                document.getElementById('sliderAngleB').addEventListener('input', e => {
                    angB = parseInt(e.target.value);
                    document.getElementById('valAngleB').textContent = `${angB}°`;
                    drawTri();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let aA = 55;
                let aB = 65;

                function drawExt() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const aC = 180 - (aA + aB);
                    const extC = aA + aB;

                    const bx = 60;
                    const by = h * 0.78;
                    const cx = w * 0.62;
                    const cy = by;
                    const dx = w * 0.92; // Diem x tren tia doi CB

                    const base = cx - bx;
                    const radB = aB * Math.PI / 180;
                    const radA = aA * Math.PI / 180;
                    const sideC = base * Math.sin(aC * Math.PI / 180) / Math.sin(radA);
                    const ax = bx + sideC * Math.cos(radB);
                    const ay = by - sideC * Math.sin(radB);

                    // Tam giac ABC
                    ctx2.fillStyle = 'rgba(6, 182, 212, 0.12)';
                    ctx2.beginPath();
                    ctx2.moveTo(ax, ay);
                    ctx2.lineTo(bx, by);
                    ctx2.lineTo(cx, cy);
                    ctx2.closePath();
                    ctx2.fill();

                    // Canh tam giac
                    ctx2.strokeStyle = '#06b6d4';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath();
                    ctx2.moveTo(ax, ay);
                    ctx2.lineTo(bx, by);
                    ctx2.lineTo(cx, cy);
                    ctx2.closePath();
                    ctx2.stroke();

                    // Tia Cx kéo dài
                    ctx2.strokeStyle = '#f43f5e';
                    ctx2.setLineDash([6, 4]);
                    ctx2.beginPath();
                    ctx2.moveTo(cx, cy);
                    ctx2.lineTo(dx, cy);
                    ctx2.stroke();
                    ctx2.setLineDash([]);

                    // Cung goc ngoai tai C
                    ctx2.strokeStyle = '#f43f5e';
                    ctx2.lineWidth = 3;
                    const slopeAC = Math.atan2(ay - cy, ax - cx);
                    ctx2.beginPath();
                    ctx2.arc(cx, cy, 38, slopeAC, 0);
                    ctx2.stroke();

                    // Nhan
                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 13px Segoe UI';
                    ctx2.fillText(`A (${aA}°)`, ax - 10, ay - 10);
                    ctx2.fillText(`B (${aB}°)`, bx - 20, by + 18);
                    ctx2.fillText(`C (${aC}°)`, cx - 15, cy + 20);
                    ctx2.fillStyle = '#f43f5e';
                    ctx2.fillText(`x`, dx + 8, cy + 5);
                    ctx2.fillText(`Góc ngoài ACx = ${extC}°`, cx + 35, cy - 20);

                    const out = document.getElementById('lab2ExtOut');
                    out.innerHTML = `Góc trong: $\\widehat{A} = ${aA}^\\circ$, $\\widehat{B} = ${aB}^\\circ$. Góc kề trong: $\\widehat{C} = ${aC}^\\circ$. Góc ngoài: $\\widehat{ACx} = 180^\\circ - ${aC}^\\circ = ${extC}^\\circ = \\widehat{A} + \\widehat{B}$.`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 240 * window.devicePixelRatio || 240;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawExt();
                }

                document.getElementById('sliderExtA').addEventListener('input', e => {
                    aA = parseInt(e.target.value);
                    document.getElementById('valExtA').textContent = `${aA}°`;
                    drawExt();
                });
                document.getElementById('sliderExtB').addEventListener('input', e => {
                    aB = parseInt(e.target.value);
                    document.getElementById('valExtB').textContent = `${aB}°`;
                    drawExt();
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
