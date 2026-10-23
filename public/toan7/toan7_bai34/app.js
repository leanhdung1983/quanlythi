// ================================================================
// BÀI 34: SỰ ĐỒNG QUY CỦA BA ĐƯỜNG TRUNG TUYẾN, BA ĐƯỜNG PHÂN GIÁC - TOÁN 7 KNTT
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
  userTitle: 'Bậc Thầy Điểm Đồng Quy 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai34_state';

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
    "title": "Câu 1: Số đường trung tuyến trong tam giác",
    "pts": 20,
    "question": "Mỗi tam giác có bao nhiêu đường trung tuyến?",
    "options": [
      {
        "text": "$3$ đường trung tuyến",
        "correct": true
      },
      {
        "text": "$1$ đường trung tuyến",
        "correct": false
      },
      {
        "text": "$2$ đường trung tuyến",
        "correct": false
      },
      {
        "text": "Vô số",
        "correct": false
      }
    ],
    "explanation": "Từ mỗi đỉnh kẻ được duy nhất một đường trung tuyến tới trung điểm cạnh đối diện, do đó tam giác có 3 đường trung tuyến."
  },
  {
    "id": 2,
    "title": "Câu 2: Tỉ lệ khoảng cách trọng tâm G",
    "pts": 20,
    "question": "Gọi $G$ là trọng tâm của $\\Delta ABC$ với trung tuyến $AM$. Khẳng định nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$AG = \\frac{2}{3}AM$",
        "correct": true
      },
      {
        "text": "$AG = \\frac{1}{2}AM$",
        "correct": false
      },
      {
        "text": "$AG = \\frac{1}{3}AM$",
        "correct": false
      },
      {
        "text": "$AG = AM$",
        "correct": false
      }
    ],
    "explanation": "Theo tính chất ba đường trung tuyến, trọng tâm cách đỉnh một khoảng bằng $\\frac{2}{3}$ độ dài đường trung tuyến."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính độ dài đoạn GM",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có trung tuyến $AM = 9\\text{ cm}$ và trọng tâm $G$. Độ dài đoạn thẳng $GM$ là:",
    "options": [
      {
        "text": "$3\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$6\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$4,5\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$2\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Đoạn $GM = \\frac{1}{3}AM = \\frac{1}{3} \\cdot 9 = 3\\text{ cm}$ (và $AG = 6\\text{ cm}$)."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính chất giao điểm ba đường phân giác",
    "pts": 20,
    "question": "Giao điểm của ba đường phân giác trong tam giác có tính chất đặc biệt nào?",
    "options": [
      {
        "text": "Cách đều ba cạnh của tam giác",
        "correct": true
      },
      {
        "text": "Cách đều ba đỉnh của tam giác",
        "correct": false
      },
      {
        "text": "Cách mỗi đỉnh một khoảng bằng $\\frac{2}{3}$ độ dài đường phân giác",
        "correct": false
      },
      {
        "text": "Luôn nằm ngoài tam giác",
        "correct": false
      }
    ],
    "explanation": "Giao điểm ba đường phân giác trong tam giác cách đều ba cạnh và là tâm đường tròn nội tiếp tam giác."
  },
  {
    "id": 5,
    "title": "Câu 5: Trung tuyến trong tam giác vuông",
    "pts": 20,
    "question": "Trong tam giác vuông, đường trung tuyến ứng với cạnh huyền có độ dài bằng:",
    "options": [
      {
        "text": "Nửa độ dài cạnh huyền",
        "correct": true
      },
      {
        "text": "Bằng cạnh huyền",
        "correct": false
      },
      {
        "text": "Gấp đôi cạnh huyền",
        "correct": false
      },
      {
        "text": "Bằng cạnh góc vuông",
        "correct": false
      }
    ],
    "explanation": "Định lí: Trong một tam giác vuông, đường trung tuyến ứng với cạnh huyền bằng nửa cạnh huyền: $AM = \\frac{1}{2}BC$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tam giác cân và đường đồng quy",
    "pts": 20,
    "question": "Trong tam giác $ABC$ cân tại $A$, đường trung tuyến $AM$ đồng thời là:",
    "options": [
      {
        "text": "Đường phân giác, đường trung trực và đường cao",
        "correct": true
      },
      {
        "text": "Chỉ là đường phân giác",
        "correct": false
      },
      {
        "text": "Chỉ là đường cao",
        "correct": false
      },
      {
        "text": "Không trùng với đường nào",
        "correct": false
      }
    ],
    "explanation": "Trong tam giác cân, đường trung tuyến xuất phát từ đỉnh đối diện với đáy đồng thời là đường phân giác, đường cao và đường trung trực của cạnh đáy."
  },
  {
    "id": 7,
    "title": "Câu 7: Trọng tâm tam giác đều",
    "pts": 20,
    "question": "Trong tam giác đều, trọng tâm $G$ trùng với:",
    "options": [
      {
        "text": "Giao điểm của 3 phân giác, 3 trung trực và 3 đường cao",
        "correct": true
      },
      {
        "text": "Chỉ trùng với tâm nội tiếp",
        "correct": false
      },
      {
        "text": "Chỉ trùng với trực tâm",
        "correct": false
      },
      {
        "text": "Một đỉnh của tam giác",
        "correct": false
      }
    ],
    "explanation": "Trong tam giác đều, 4 điểm đặc biệt (trọng tâm, trực tâm, tâm nội tiếp, tâm ngoại tiếp) trùng nhau tại một điểm."
  },
  {
    "id": 8,
    "title": "Câu 8: Tính AG biết GM",
    "pts": 20,
    "question": "Cho tam giác $ABC$ có trọng tâm $G$, trung tuyến $AM$. Biết $GM = 4\\text{ cm}$. Độ dài $AG$ là:",
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
        "text": "$12\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$6\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Vì $AG = 2 \\cdot GM$ nên $AG = 2 \\cdot 4 = 8\\text{ cm}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Điểm I nằm ở đâu trong tam giác?",
    "pts": 20,
    "question": "Giao điểm ba đường phân giác trong của một tam giác luôn nằm ở vị trí nào?",
    "options": [
      {
        "text": "Luôn nằm bên trong tam giác",
        "correct": true
      },
      {
        "text": "Có thể nằm bên ngoài tam giác",
        "correct": false
      },
      {
        "text": "Nằm trên cạnh của tam giác",
        "correct": false
      },
      {
        "text": "Trùng với một đỉnh của tam giác",
        "correct": false
      }
    ],
    "explanation": "Vì các tia phân giác trong luôn nằm bên trong các góc của tam giác nên giao điểm của chúng luôn nằm bên trong tam giác."
  },
  {
    "id": 10,
    "title": "Câu 10: Tỉ số diện tích 6 tam giác nhỏ tạo bởi trọng tâm",
    "pts": 20,
    "question": "Trọng tâm $G$ cùng với 3 đỉnh và 3 trung điểm chia tam giác ban đầu thành 6 tam giác nhỏ. Diện tích của 6 tam giác nhỏ này:",
    "options": [
      {
        "text": "Bằng nhau",
        "correct": true
      },
      {
        "text": "Tất cả khác nhau",
        "correct": false
      },
      {
        "text": "Từng cặp một bằng nhau",
        "correct": false
      },
      {
        "text": "Tỉ lệ với độ dài cạnh",
        "correct": false
      }
    ],
    "explanation": "Ba đường trung tuyến chia tam giác thành 6 tam giác nhỏ có diện tích bằng nhau, mỗi tam giác nhỏ có diện tích bằng $\\frac{1}{6}$ diện tích tam giác lớn."
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
    
const canvas1 = document.getElementById('labCanvas1');
if (canvas1) {
  const ctx = canvas1.getContext('2d');

  function draw() {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BA ĐƯỜNG TRUNG TUYẾN ĐỒNG QUY TẠI TRỌNG TÂM G', canvas1.width / 2, 28);

    const ax = 180, ay = 50;
    const bx = 80, by = 180;
    const cx = 340, cy = 180;

    // Trung điểm các cạnh
    const mx = (bx + cx) / 2, my = (by + cy) / 2; // M trên BC
    const nx = (ax + cx) / 2, ny = (ay + cy) / 2; // N trên AC
    const px = (ax + bx) / 2, py = (ay + by) / 2; // P trên AB

    // Trọng tâm G
    const gx = (ax + bx + cx) / 3, gy = (ay + by + cy) / 3;

    // Vẽ tam giác ABC
    ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy);
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Vẽ 3 đường trung tuyến
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(ax, ay); ctx.lineTo(mx, my);
    ctx.moveTo(bx, by); ctx.lineTo(nx, ny);
    ctx.moveTo(cx, cy); ctx.lineTo(px, py);
    ctx.stroke();

    // Điểm G
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(gx, gy, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('A', ax, ay - 8);
    ctx.fillText('B', bx - 12, by + 5);
    ctx.fillText('C', cx + 12, cy + 5);
    ctx.fillText('M', mx, my + 18);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('G (Trọng tâm)', gx + 45, gy + 5);

    // Bảng tỉ lệ
    ctx.textAlign = 'left';
    ctx.font = '15px sans-serif';
    const tx = 370;
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('TÍNH CHẤT TRỌNG TÂM G:', tx, 75);
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('• AG = 2/3 AM', tx, 105);
    ctx.fillText('• GM = 1/3 AM', tx, 135);
    ctx.fillText('• AG = 2 GM', tx, 165);
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('=> Tỉ lệ vàng 2 : 1! ✓', tx, 195);
  }

  const btn = document.getElementById('btnLab1Centroid');
  if (btn) btn.onclick = draw;
  draw();
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');

  function draw2() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('BA ĐƯỜNG PHÂN GIÁC ĐỒNG QUY TẠI TÂM NỘI TIẾP I', canvas2.width / 2, 28);

    const ax = 200, ay = 60;
    const bx = 80, by = 180;
    const cx = 340, cy = 180;

    // Tam giác
    ctx2.beginPath();
    ctx2.moveTo(ax, ay); ctx2.lineTo(bx, by); ctx2.lineTo(cx, cy);
    ctx2.closePath();
    ctx2.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx2.fill();
    ctx2.strokeStyle = '#10b981';
    ctx2.lineWidth = 2;
    ctx2.stroke();

    // Tâm nội tiếp I và bán kính r
    const cAB = Math.hypot(ax - bx, ay - by);
    const cBC = Math.hypot(cx - bx, cy - by);
    const cCA = Math.hypot(ax - cx, ay - cy);
    const p = (cAB + cBC + cCA) / 2;
    const area = 0.5 * Math.abs((bx - ax)*(cy - ay) - (cx - ax)*(by - ay));
    const r = area / p;
    const ix = (cBC * ax + cCA * bx + cAB * cx) / (2 * p);
    const iy = (cBC * ay + cCA * by + cAB * cy) / (2 * p);

    // Vẽ 3 đường phân giác
    ctx2.strokeStyle = '#38bdf8';
    ctx2.lineWidth = 1.5;
    ctx2.beginPath();
    ctx2.moveTo(ax, ay); ctx2.lineTo(ix, iy);
    ctx2.moveTo(bx, by); ctx2.lineTo(ix, iy);
    ctx2.moveTo(cx, cy); ctx2.lineTo(ix, iy);
    ctx2.stroke();

    // Vẽ đường tròn nội tiếp
    ctx2.strokeStyle = '#f59e0b';
    ctx2.lineWidth = 2;
    ctx2.beginPath();
    ctx2.arc(ix, iy, r, 0, Math.PI * 2);
    ctx2.stroke();

    // Điểm I
    ctx2.fillStyle = '#f59e0b';
    ctx2.beginPath();
    ctx2.arc(ix, iy, 5, 0, Math.PI * 2);
    ctx2.fill();

    ctx2.fillStyle = '#fff';
    ctx2.font = 'bold 14px sans-serif';
    ctx2.fillText('I', ix + 12, iy + 4);

    // Ghi chú
    ctx2.textAlign = 'left';
    ctx2.font = '15px sans-serif';
    const tx = 370;
    ctx2.fillStyle = '#f59e0b';
    ctx2.fillText('TÍNH CHẤT TÂM I:', tx, 80);
    ctx2.fillStyle = '#cbd5e1';
    ctx2.fillText('• I là giao 3 phân giác', tx, 110);
    ctx2.fillText('• Khoảng cách từ I', tx, 140);
    ctx2.fillText('  đến 3 cạnh = r', tx, 165);
    ctx2.fillStyle = '#10b981';
    ctx2.font = 'bold 14px sans-serif';
    ctx2.fillText('=> Tâm nội tiếp! ✓', tx, 195);
  }

  const btn = document.getElementById('btnLab2Incenter');
  if (btn) btn.onclick = draw2;
  draw2();
}

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
