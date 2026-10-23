// ================================================================
// BÀI 16: TAM GIÁC CÂN. ĐƯỜNG TRUNG TRỰC CỦA ĐOẠN THẲNG - TOÁN 7 KNTT
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
  userTitle: 'Chiến Binh Đối Xứng & Trung Trực',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai16_state';

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
    "title": "Câu 1: Góc ở đáy tam giác cân",
    "pts": 20,
    "question": "Cho tam giác $ABC$ cân tại $A$ có góc ở đỉnh $\\\\widehat{A} = 50^\\\\circ$. Số đo của mỗi góc ở đáy là:",
    "options": [
      {
        "text": "$65^\\\\circ$",
        "correct": true
      },
      {
        "text": "$50^\\\\circ$",
        "correct": false
      },
      {
        "text": "$130^\\\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Trong tam giác cân, hai góc ở đáy bằng nhau: $\\\\widehat{B} = \\\\widehat{C} = \\\\frac{180^\\\\circ - 50^\\\\circ}{2} = 65^\\\\circ$."
  },
  {
    "id": 2,
    "title": "Câu 2: Góc ở đỉnh tam giác cân",
    "pts": 20,
    "question": "Cho tam giác $MNP$ cân tại $M$. Biết góc ở đáy $\\\\widehat{N} = 40^\\\\circ$. Số đo góc ở đỉnh $\\\\widehat{M}$ là:",
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
        "text": "$40^\\\\circ$",
        "correct": false
      },
      {
        "text": "$140^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Vì $\\\\widehat{P} = \\\\widehat{N} = 40^\\\\circ$ nên góc ở đỉnh là $\\\\widehat{M} = 180^\\\\circ - (40^\\\\circ + 40^\\\\circ) = 100^\\\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Góc trong tam giác đều",
    "pts": 20,
    "question": "Mỗi góc của một tam giác đều luôn có số đo bằng bao nhiêu độ?",
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
        "text": "$180^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Tam giác đều có 3 góc bằng nhau, do đó mỗi góc bằng $\\\\frac{180^\\\\circ}{3} = 60^\\\\circ$."
  },
  {
    "id": 4,
    "title": "Câu 4: Dấu hiệu nhận biết tam giác đều",
    "pts": 20,
    "question": "Tam giác cân có một góc bằng bao nhiêu độ thì trở thành tam giác đều?",
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
        "text": "$120^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí dấu hiệu nhận biết, một tam giác cân có một góc bằng $60^\\\\circ$ (dù là góc ở đỉnh hay góc ở đáy) luôn là một tam giác đều."
  },
  {
    "id": 5,
    "title": "Câu 5: Định nghĩa đường trung trực",
    "pts": 20,
    "question": "Đường trung trực của đoạn thẳng $AB$ là đường thẳng:",
    "options": [
      {
        "text": "Vuông góc với $AB$ tại trung điểm của $AB$",
        "correct": true
      },
      {
        "text": "Đi qua trung điểm của $AB$",
        "correct": false
      },
      {
        "text": "Vuông góc với $AB$",
        "correct": false
      },
      {
        "text": "Song song với $AB$",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa: Đường trung trực của một đoạn thẳng là đường thẳng vuông góc với đoạn thẳng đó tại chính trung điểm của nó."
  },
  {
    "id": 6,
    "title": "Câu 6: Tính chất cách đều của đường trung trực",
    "pts": 20,
    "question": "Cho đường thẳng $d$ là đường trung trực của đoạn thẳng $AB$. Nếu điểm $M$ nằm trên $d$ và $MA = 7\\\\text{ cm}$ thì độ dài đoạn thẳng $MB$ là:",
    "options": [
      {
        "text": "$7\\\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$3.5\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$14\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "Không xác định được",
        "correct": false
      }
    ],
    "explanation": "Điểm nằm trên đường trung trực thì cách đều hai đầu mút của đoạn thẳng, do đó $MB = MA = 7\\\\text{ cm}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Điểm cách đều hai đầu mút",
    "pts": 20,
    "question": "Nếu điểm $K$ thỏa mãn $KA = KB$ thì điểm $K$ nằm ở đâu?",
    "options": [
      {
        "text": "Nằm trên đường trung trực của đoạn thẳng $AB$",
        "correct": true
      },
      {
        "text": "Chắc chắn là trung điểm của $AB$",
        "correct": false
      },
      {
        "text": "Nằm ngoài mặt phẳng chứa $AB$",
        "correct": false
      },
      {
        "text": "Nằm trên đường tròn đường kính $AB$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí đảo về đường trung trực: Điểm cách đều hai mút của một đoạn thẳng thì luôn nằm trên đường trung trực của đoạn thẳng đó."
  },
  {
    "id": 8,
    "title": "Câu 8: Tam giác vuông cân",
    "pts": 20,
    "question": "Một tam giác vuông có hai cạnh góc vuông bằng nhau gọi là tam giác vuông cân. Mỗi góc nhọn của tam giác vuông cân bằng:",
    "options": [
      {
        "text": "$45^\\\\circ$",
        "correct": true
      },
      {
        "text": "$60^\\\\circ$",
        "correct": false
      },
      {
        "text": "$30^\\\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\\\circ$",
        "correct": false
      }
    ],
    "explanation": "Góc ở đỉnh bằng $90^\\\\circ$, hai góc ở đáy bằng nhau: $\\\\frac{180^\\\\circ - 90^\\\\circ}{2} = 45^\\\\circ$."
  },
  {
    "id": 9,
    "title": "Câu 9: Đường cao trong tam giác cân",
    "pts": 20,
    "question": "Trong tam giác cân $ABC$ ($AB = AC$), đường cao xuất phát từ đỉnh $A$ đồng thời là:",
    "options": [
      {
        "text": "Đường trung tuyến, đường phân giác và đường trung trực của cạnh đáy",
        "correct": true
      },
      {
        "text": "Chỉ là đường phân giác",
        "correct": false
      },
      {
        "text": "Chỉ là đường trung tuyến",
        "correct": false
      },
      {
        "text": "Không có tính chất gì đặc biệt",
        "correct": false
      }
    ],
    "explanation": "Do tính chất đối xứng, trong tam giác cân, đường cao kẻ từ đỉnh đồng thời là đường trung tuyến, đường phân giác và đường trung trực của cạnh đáy."
  },
  {
    "id": 10,
    "title": "Câu 10: Vị trí giao điểm hai đường trung trực",
    "pts": 20,
    "question": "Giao điểm $O$ của các đường trung trực trong một tam giác có tính chất gì?",
    "options": [
      {
        "text": "Cách đều ba đỉnh của tam giác ($OA = OB = OC$)",
        "correct": true
      },
      {
        "text": "Cách đều ba cạnh của tam giác",
        "correct": false
      },
      {
        "text": "Là trọng tâm tam giác",
        "correct": false
      },
      {
        "text": "Là trực tâm tam giác",
        "correct": false
      }
    ],
    "explanation": "Vì $O$ thuộc trung trực của $AB$ nên $OA = OB$; $O$ thuộc trung trực của $BC$ nên $OB = OC$. Vậy $OA = OB = OC$, điểm $O$ cách đều ba đỉnh."
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
                let hA = 130;
                const base = 200;

                function drawIso() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const bx = (w - base) / 2;
                    const by = h * 0.8;
                    const cx = bx + base;
                    const cy = by;
                    const mx = (bx + cx) / 2;
                    const ax = mx;
                    const ay = by - hA;

                    // Truc doi xung / duong cao
                    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
                    ctx.beginPath(); ctx.moveTo(mx, by + 20); ctx.lineTo(mx, ay - 20); ctx.stroke();
                    ctx.setLineDash([]);

                    // Tam giac ABC
                    ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
                    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath(); ctx.fill();

                    // Hai canh ben AB, AC
                    ctx.strokeStyle = '#10b981'; ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(ax, ay); ctx.lineTo(cx, cy); ctx.stroke();

                    // Canh day BC
                    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(cx, cy); ctx.stroke();

                    // Ky hieu bang nhau tren 2 canh ben
                    const midABx = (ax + bx) / 2, midABy = (ay + by) / 2;
                    const midACx = (ax + cx) / 2, midACy = (ay + cy) / 2;
                    ctx.strokeStyle = '#ef4444'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(midABx - 5, midABy - 5); ctx.lineTo(midABx + 5, midABy + 5); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(midACx - 5, midACy + 5); ctx.lineTo(midACx + 5, midACy - 5); ctx.stroke();

                    // Tinh goc
                    const halfBase = base / 2;
                    const side = Math.round(Math.sqrt(hA * hA + halfBase * halfBase));
                    const angB = Math.round(Math.atan2(hA, halfBase) * 180 / Math.PI);
                    const angTop = 180 - 2 * angB;

                    // Dinh
                    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText(`A (${angTop}°)`, ax - 20, ay - 10);
                    ctx.fillText(`B (${angB}°)`, bx - 25, by + 18);
                    ctx.fillText(`C (${angB}°)`, cx + 8, cy + 18);
                    ctx.fillText(`M (trung điểm)`, mx - 35, by + 18);

                    const out = document.getElementById('lab1IsoOut');
                    out.innerHTML = `Hai cạnh bên: $AB = AC = ${side}\\text{ px}$. Hai góc ở đáy: $\\widehat{B} = \\widehat{C} = ${angB}^\\circ$. Góc ở đỉnh: $\\widehat{A} = ${angTop}^\\circ$. $\\triangle ABC$ luôn cân tại $A$.`;
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 240 * window.devicePixelRatio || 240;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawIso();
                }

                document.getElementById('sliderH_A').addEventListener('input', e => {
                    hA = parseInt(e.target.value);
                    document.getElementById('valH_A').textContent = `${hA} px`;
                    drawIso();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let posMY = 60;
                const ab = 220;

                function drawMed() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const ax = (w - ab) / 2;
                    const ay = h * 0.78;
                    const bx = ax + ab;
                    const by = ay;
                    const ix = (ax + bx) / 2;
                    const iy = ay;

                    const mx = ix;
                    const my = posMY;

                    // Duong trung truc d
                    ctx2.strokeStyle = '#06b6d4'; ctx2.lineWidth = 3;
                    ctx2.beginPath(); ctx2.moveTo(ix, 15); ctx2.lineTo(ix, h - 15); ctx2.stroke();

                    // Doan thang AB
                    ctx2.strokeStyle = '#6366f1'; ctx2.lineWidth = 4;
                    ctx2.beginPath(); ctx2.moveTo(ax, ay); ctx2.lineTo(bx, by); ctx2.stroke();

                    // Ky hieu goc vuong tai I
                    ctx2.strokeStyle = '#ffffff'; ctx2.lineWidth = 2;
                    ctx2.strokeRect(ix, iy - 14, 14, 14);

                    // Cac doan MA va MB
                    ctx2.strokeStyle = '#f43f5e'; ctx2.lineWidth = 2; ctx2.setLineDash([5, 3]);
                    ctx2.beginPath(); ctx2.moveTo(mx, my); ctx2.lineTo(ax, ay); ctx2.stroke();
                    ctx2.beginPath(); ctx2.moveTo(mx, my); ctx2.lineTo(bx, by); ctx2.stroke();
                    ctx2.setLineDash([]);

                    // Diem M
                    ctx2.fillStyle = '#f59e0b';
                    ctx2.beginPath(); ctx2.arc(mx, my, 6, 0, Math.PI * 2); ctx2.fill();

                    // Dinh
                    ctx2.fillStyle = '#ffffff'; ctx2.font = 'bold 13px Segoe UI';
                    ctx2.fillText(`A`, ax - 18, ay + 18);
                    ctx2.fillText(`B`, bx + 6, by + 18);
                    ctx2.fillText(`I (trung điểm)`, ix + 8, iy + 18);
                    ctx2.fillStyle = '#f59e0b';
                    ctx2.fillText(`M`, mx + 10, my + 5);

                    const dist = Math.round(Math.sqrt((mx - ax)*(mx - ax) + (my - ay)*(my - ay)));
                    const out = document.getElementById('lab2MedOut');
                    out.innerHTML = `Điểm $M$ thuộc đường trung trực $d$: Khoảng cách $MA = ${dist}\\text{ px}$ và $MB = ${dist}\\text{ px}$. Luôn có $MA = MB$ với mọi vị trí của $M$!`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 240 * window.devicePixelRatio || 240;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawMed();
                }

                document.getElementById('sliderPosM').addEventListener('input', e => {
                    posMY = parseInt(e.target.value);
                    document.getElementById('valPosM').textContent = `Y = ${posMY} px`;
                    drawMed();
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
