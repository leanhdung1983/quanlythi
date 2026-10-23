// ================================================================
// ÔN TẬP CHƯƠNG IV: TAM GIÁC BẰNG NHAU - TOÁN 7 KNTT
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
  userTitle: 'Đại Tướng Quân Hình Học Tam Giác',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_ontap_chuong4_state';

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
    "title": "Câu 1: Góc thứ ba trong tam giác",
    "pts": 20,
    "question": "Cho $\\\\triangle ABC$ có $\\\\widehat{A} = 45^\\\\circ$ và $\\\\widehat{B} = 75^\\\\circ$. Số đo của góc $\\\\widehat{C}$ là:",
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
    "explanation": "$\\\\widehat{C} = 180^\\\\circ - (45^\\\\circ + 75^\\\\circ) = 60^\\\\circ$."
  },
  {
    "id": 2,
    "title": "Câu 2: Nhận diện trường hợp bằng nhau",
    "pts": 20,
    "question": "Cho hai tam giác $\\\\triangle ABC$ và $\\\\triangle MNP$ có $AB = MN$, $\\\\widehat{A} = \\\\widehat{M}$, $AC = MP$. Hai tam giác này bằng nhau theo trường hợp nào?",
    "options": [
      {
        "text": "c-g-c",
        "correct": true
      },
      {
        "text": "c-c-c",
        "correct": false
      },
      {
        "text": "g-c-g",
        "correct": false
      },
      {
        "text": "Cạnh huyền - cạnh góc vuông",
        "correct": false
      }
    ],
    "explanation": "Có hai cạnh và góc kẹp giữa tương ứng bằng nhau nên $\\\\triangle ABC = \\\\triangle MNP$ (c-g-c)."
  },
  {
    "id": 3,
    "title": "Câu 3: Tam giác cân có góc 60 độ",
    "pts": 20,
    "question": "Một tam giác cân có một góc bằng $60^\\\\circ$ là:",
    "options": [
      {
        "text": "Tam giác đều",
        "correct": true
      },
      {
        "text": "Tam giác vuông cân",
        "correct": false
      },
      {
        "text": "Tam giác tù",
        "correct": false
      },
      {
        "text": "Tam giác nhọn nhưng không đều",
        "correct": false
      }
    ],
    "explanation": "Tam giác cân có một góc bằng $60^\\\\circ$ thì cả ba góc đều bằng $60^\\\\circ$, do đó là tam giác đều."
  },
  {
    "id": 4,
    "title": "Câu 4: Đường trung trực của đoạn thẳng",
    "pts": 20,
    "question": "Cho đoạn thẳng $AB = 8\\\\text{ cm}$. Đường trung trực của $AB$ cắt $AB$ tại điểm $I$. Độ dài đoạn $IA$ là:",
    "options": [
      {
        "text": "$4\\\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$8\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$2\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$16\\\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Đường trung trực đi qua trung điểm của đoạn thẳng nên $IA = \\\\frac{AB}{2} = \\\\frac{8}{2} = 4\\\\text{ cm}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Trường hợp cạnh huyền - góc nhọn",
    "pts": 20,
    "question": "Hai tam giác vuông bằng nhau theo trường hợp 'cạnh huyền - góc nhọn' khi:",
    "options": [
      {
        "text": "Có cạnh huyền và một góc nhọn tương ứng bằng nhau",
        "correct": true
      },
      {
        "text": "Có hai cạnh góc vuông bằng nhau",
        "correct": false
      },
      {
        "text": "Có ba góc bằng nhau",
        "correct": false
      },
      {
        "text": "Có cạnh huyền và một cạnh góc vuông bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Định lí: Nếu cạnh huyền và một góc nhọn của tam giác vuông này bằng cạnh huyền và một góc nhọn của tam giác vuông kia thì hai tam giác vuông đó bằng nhau."
  },
  {
    "id": 6,
    "title": "Câu 6: Góc ngoài tam giác",
    "pts": 20,
    "question": "Một tam giác có hai góc trong lần lượt là $35^\\\\circ$ và $65^\\\\circ$. Góc ngoài không kề với hai góc này có số đo là:",
    "options": [
      {
        "text": "$100^\\\\circ$",
        "correct": true
      },
      {
        "text": "$80^\\\\circ$",
        "correct": false
      },
      {
        "text": "$70^\\\\circ$",
        "correct": false
      },
      {
        "text": "$145^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Góc ngoài bằng tổng hai góc trong không kề: $35^\\\\circ + 65^\\\\circ = 100^\\\\circ$."
  },
  {
    "id": 7,
    "title": "Câu 7: Tính cạnh tam giác đều",
    "pts": 20,
    "question": "Một tam giác đều có chu vi bằng $27\\\\text{ cm}$. Độ dài mỗi cạnh của tam giác đó là:",
    "options": [
      {
        "text": "$9\\\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$13.5\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$3\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$6\\\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Tam giác đều có ba cạnh bằng nhau nên độ dài mỗi cạnh là $27 : 3 = 9\\\\text{ cm}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Khẳng định sai về tam giác",
    "pts": 20,
    "question": "Khẳng định nào dưới đây là **sai**?",
    "options": [
      {
        "text": "Hai tam giác có ba góc bằng nhau thì bằng nhau",
        "correct": true
      },
      {
        "text": "Hai tam giác có ba cạnh bằng nhau thì bằng nhau",
        "correct": false
      },
      {
        "text": "Tam giác đều có ba góc bằng nhau và bằng $60^\\\\circ$",
        "correct": false
      },
      {
        "text": "Trong tam giác vuông, hai góc nhọn phụ nhau",
        "correct": false
      }
    ],
    "explanation": "Hai tam giác có ba góc bằng nhau chỉ đồng dạng chứ chưa chắc bằng nhau về kích thước."
  },
  {
    "id": 9,
    "title": "Câu 9: Điểm cách đều ba đỉnh tam giác",
    "pts": 20,
    "question": "Giao điểm của ba đường trung trực của tam giác là điểm:",
    "options": [
      {
        "text": "Cách đều ba đỉnh của tam giác",
        "correct": true
      },
      {
        "text": "Cách đều ba cạnh của tam giác",
        "correct": false
      },
      {
        "text": "Nằm trên cạnh đáy",
        "correct": false
      },
      {
        "text": "Trùng với trọng tâm tam giác",
        "correct": false
      }
    ],
    "explanation": "Giao điểm của ba đường trung trực là tâm đường tròn ngoại tiếp tam giác, cách đều ba đỉnh."
  },
  {
    "id": 10,
    "title": "Câu 10: Góc ở đáy tam giác vuông cân",
    "pts": 20,
    "question": "Cho tam giác $ABC$ vuông cân tại $A$. Số đo của góc $\\\\widehat{B}$ là:",
    "options": [
      {
        "text": "$45^\\\\circ$",
        "correct": true
      },
      {
        "text": "$90^\\\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\\\circ$",
        "correct": false
      },
      {
        "text": "$30^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Tam giác vuông cân tại $A$ có $\\\\widehat{B} = \\\\widehat{C} = \\\\frac{90^\\\\circ}{2} = 45^\\\\circ$."
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
                let mode = 'all';

                function drawTree() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const out = document.getElementById('lab1TreeOut');

                    if (mode === 'all') {
                        // Tam giac thuong
                        ctx.fillStyle = '#6366f1';
                        ctx.font = 'bold 15px Segoe UI';
                        ctx.fillText('TAM GIÁC THƯỜNG (Cần 3 yếu tố):', 30, 40);

                        ctx.fillStyle = '#ffffff';
                        ctx.font = '13px Segoe UI';
                        ctx.fillText('1. Cạnh - Cạnh - Cạnh (c-c-c): 3 cặp cạnh bằng nhau', 50, 75);
                        ctx.fillText('2. Cạnh - Góc - Cạnh (c-g-c): 2 cạnh và góc xen giữa bằng nhau', 50, 110);
                        ctx.fillText('3. Góc - Cạnh - Góc (g-c-g): 1 cạnh và 2 góc kề bằng nhau', 50, 145);

                        ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 2;
                        ctx.strokeRect(30, 55, w - 60, 110);
                        out.innerHTML = `Tam giác thường: Tuyệt đối không có trường hợp (g-g-g). Góc xen giữa trong (c-g-c) là bắt buộc.`;
                    } else if (mode === 'rt') {
                        // Tam giac vuong
                        ctx.fillStyle = '#06b6d4';
                        ctx.font = 'bold 15px Segoe UI';
                        ctx.fillText('TAM GIÁC VUÔNG (Cần 2 yếu tố):', 30, 40);

                        ctx.fillStyle = '#ffffff';
                        ctx.font = '13px Segoe UI';
                        ctx.fillText('1. Hai cạnh góc vuông (suy ra từ c-g-c)', 50, 70);
                        ctx.fillText('2. Cạnh góc vuông - góc nhọn kề (suy ra từ g-c-g)', 50, 100);
                        ctx.fillText('3. Cạnh huyền - góc nhọn', 50, 130);
                        ctx.fillText('4. Cạnh huyền - cạnh góc vuông', 50, 160);

                        ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2;
                        ctx.strokeRect(30, 50, w - 60, 130);
                        out.innerHTML = `Tam giác vuông: Có sẵn 1 góc 90° nên chỉ cần thêm 2 điều kiện là đủ kết luận bằng nhau.`;
                    } else {
                        // Tam giac can & deu
                        ctx.fillStyle = '#10b981';
                        ctx.font = 'bold 15px Segoe UI';
                        ctx.fillText('TAM GIÁC CÂN & ĐỀU & TRUNG TRỰC:', 30, 40);

                        ctx.fillStyle = '#ffffff';
                        ctx.font = '13px Segoe UI';
                        ctx.fillText('• Tam giác cân: 2 cạnh bên bằng nhau ⟺ 2 góc ở đáy bằng nhau', 50, 75);
                        ctx.fillText('• Tam giác đều: 3 cạnh bằng nhau ⟺ 3 góc bằng nhau = 60°', 50, 110);
                        ctx.fillText('• Đường trung trực: Vuông góc tại trung điểm ⟺ M cách đều 2 mút (MA = MB)', 50, 145);

                        ctx.strokeStyle = '#10b981'; ctx.lineWidth = 2;
                        ctx.strokeRect(30, 55, w - 60, 110);
                        out.innerHTML = `Tam giác cân và đường trung trực phản ánh tính chất đối xứng trục hoàn hảo trong hình học.`;
                    }
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 220 * window.devicePixelRatio || 220;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawTree();
                }

                document.getElementById('btnTreeAll').addEventListener('click', () => { mode = 'all'; drawTree(); });
                document.getElementById('btnTreeRt').addEventListener('click', () => { mode = 'rt'; drawTree(); });
                document.getElementById('btnTreeIso').addEventListener('click', () => { mode = 'iso'; drawTree(); });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let angA = 60;

                function drawRev() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const rem = 180 - angA;
                    const angB = Math.round(rem * 0.55);
                    const angC = rem - angB;

                    const bx = 60;
                    const by = h * 0.78;
                    const base = Math.min(w * 0.65, 300);
                    const cx = bx + base;
                    const cy = by;

                    const radB = angB * Math.PI / 180;
                    const radC = angC * Math.PI / 180;
                    const sideC = base * Math.sin(radC) / Math.sin(angA * Math.PI / 180);
                    const ax = bx + sideC * Math.cos(radB);
                    const ay = by - sideC * Math.sin(radB);

                    ctx2.fillStyle = 'rgba(99, 102, 241, 0.2)';
                    ctx2.beginPath(); ctx2.moveTo(ax, ay); ctx2.lineTo(bx, by); ctx2.lineTo(cx, cy); ctx2.closePath(); ctx2.fill();

                    ctx2.strokeStyle = '#6366f1'; ctx2.lineWidth = 3;
                    ctx2.beginPath(); ctx2.moveTo(ax, ay); ctx2.lineTo(bx, by); ctx2.lineTo(cx, cy); ctx2.closePath(); ctx2.stroke();

                    ctx2.fillStyle = '#ffffff'; ctx2.font = 'bold 13px Segoe UI';
                    ctx2.fillText(`A (${angA}°)`, ax - 15, ay - 10);
                    ctx2.fillText(`B (${angB}°)`, bx - 20, by + 18);
                    ctx2.fillText(`C (${angC}°)`, cx + 8, cy + 18);

                    const out = document.getElementById('lab2RevOut');
                    out.innerHTML = `Ba góc: $\\widehat{A} = ${angA}^\\circ$, $\\widehat{B} = ${angB}^\\circ$, $\\widehat{C} = ${angC}^\\circ$. Tổng: $180^\\circ$. Góc ngoài tại đỉnh $A$: $180^\\circ - ${angA}^\\circ = ${180 - angA}^\\circ = \\widehat{B} + \\widehat{C}$.`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 220 * window.devicePixelRatio || 220;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawRev();
                }

                document.getElementById('sliderRevA').addEventListener('input', e => {
                    angA = parseInt(e.target.value);
                    document.getElementById('valRevA').textContent = `${angA}°`;
                    drawRev();
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
