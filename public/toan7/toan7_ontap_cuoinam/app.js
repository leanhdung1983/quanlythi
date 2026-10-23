// ================================================================
// BÀI TẬP ÔN TẬP CUỐI NĂM - TOÁN 7 KNTT
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
  userTitle: 'Đại Thủ Khoa Toán 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_ontap_cuoinam_state';

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
    "title": "Câu 1: Số thực và căn bậc hai",
    "pts": 20,
    "question": "Căn bậc hai số học của $49$ là:",
    "options": [
      {
        "text": "$7$",
        "correct": true
      },
      {
        "text": "$-7$",
        "correct": false
      },
      {
        "text": "$\\pm 7$",
        "correct": false
      },
      {
        "text": "$2401$",
        "correct": false
      }
    ],
    "explanation": "Căn bậc hai số học của số không âm $a$ là số không âm $x$ sao cho $x^2 = a$. Vì $7 \\ge 0$ và $7^2 = 49$ nên $\\sqrt{49} = 7$."
  },
  {
    "id": 2,
    "title": "Câu 2: Tìm x trong tỉ lệ thức",
    "pts": 20,
    "question": "Tìm $x$ biết $\\frac{x}{12} = \\frac{-3}{4}$:",
    "options": [
      {
        "text": "$x = -9$",
        "correct": true
      },
      {
        "text": "$x = 9$",
        "correct": false
      },
      {
        "text": "$x = -16$",
        "correct": false
      },
      {
        "text": "$x = -1$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng tính chất tích chéo: $x \\cdot 4 = 12 \\cdot (-3) = -36 \\implies x = -36 : 4 = -9$."
  },
  {
    "id": 3,
    "title": "Câu 3: Bậc của đa thức một biến",
    "pts": 20,
    "question": "Bậc của đa thức $P(x) = 4x^5 - 2x^3 + 7x - 4x^5 + 3x^2 - 1$ là:",
    "options": [
      {
        "text": "$3$",
        "correct": true
      },
      {
        "text": "$5$",
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
    "explanation": "Thu gọn đa thức: $P(x) = (4x^5 - 4x^5) - 2x^3 + 3x^2 + 7x - 1 = -2x^3 + 3x^2 + 7x - 1$. Số mũ lớn nhất là 3, nên bậc là $3$."
  },
  {
    "id": 4,
    "title": "Câu 4: Nghiệm của đa thức",
    "pts": 20,
    "question": "Nghiệm của đa thức $A(x) = 2x - 8$ là:",
    "options": [
      {
        "text": "$x = 4$",
        "correct": true
      },
      {
        "text": "$x = -4$",
        "correct": false
      },
      {
        "text": "$x = 8$",
        "correct": false
      },
      {
        "text": "$x = 0$",
        "correct": false
      }
    ],
    "explanation": "$2x - 8 = 0 \\iff 2x = 8 \\iff x = 4$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tổng ba góc trong một tam giác",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có $\\widehat{A} = 55^\\circ, \\widehat{B} = 65^\\circ$. Số đo góc $C$ là:",
    "options": [
      {
        "text": "$60^\\circ$",
        "correct": true
      },
      {
        "text": "$50^\\circ$",
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
    "explanation": "Tổng 3 góc bằng $180^\\circ \\implies \\widehat{C} = 180^\\circ - 55^\\circ - 65^\\circ = 60^\\circ$."
  },
  {
    "id": 6,
    "title": "Câu 6: Bất đẳng thức tam giác",
    "pts": 20,
    "question": "Cho tam giác có hai cạnh là $5\\text{ cm}$ và $9\\text{ cm}$. Cạnh thứ ba có thể nhận giá trị nào sau đây?",
    "options": [
      {
        "text": "$7\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$4\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$14\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$3\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Điều kiện cạnh thứ ba $x$: $9 - 5 < x < 9 + 5 \\iff 4 < x < 14$. Trong các phương án, chỉ có $7\\text{ cm}$ thỏa mãn."
  },
  {
    "id": 7,
    "title": "Câu 7: Trọng tâm tam giác",
    "pts": 20,
    "question": "Gọi $G$ là trọng tâm tam giác $ABC$ với trung tuyến $AM$. Biết $AG = 6\\text{ cm}$. Độ dài đoạn thẳng $AM$ là:",
    "options": [
      {
        "text": "$9\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$8\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$12\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$4\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Vì $AG = \\frac{2}{3}AM \\implies AM = \\frac{3}{2}AG = \\frac{3}{2} \\cdot 6 = 9\\text{ cm}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Thể tích hình lập phương",
    "pts": 20,
    "question": "Hình lập phương có diện tích một mặt là $25\\text{ cm}^2$. Thể tích của nó là:",
    "options": [
      {
        "text": "$125\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$150\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$100\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$75\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "Diện tích một mặt $a^2 = 25 \\implies a = 5\\text{ cm}$. Thể tích $V = a^3 = 5^3 = 125\\text{ cm}^3$."
  },
  {
    "id": 9,
    "title": "Câu 9: Thể tích lăng trụ đứng",
    "pts": 20,
    "question": "Một hình lăng trụ đứng có diện tích đáy $18\\text{ cm}^2$ và chiều cao $5\\text{ cm}$. Thể tích của lăng trụ là:",
    "options": [
      {
        "text": "$90\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$45\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$180\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$30\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "$V = S \\cdot h = 18 \\cdot 5 = 90\\text{ cm}^3$."
  },
  {
    "id": 10,
    "title": "Câu 10: Xác suất biến cố ngẫu nhiên",
    "pts": 20,
    "question": "Một hộp có 12 quả bóng bàn đánh số từ 1 đến 12. Rút ngẫu nhiên 1 quả. Xác suất rút được quả bóng ghi số chia hết cho 4 là:",
    "options": [
      {
        "text": "$\\frac{1}{4}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{12}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      }
    ],
    "explanation": "Các số chia hết cho 4 từ 1 đến 12 là 4, 8, 12 ($k = 3$). Xác suất $P = \\frac{3}{12} = \\frac{1}{4}$."
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
  let pillar = 1;

  function draw() {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('BẢN ĐỒ TỔNG KẾT TRI THỨC TOÁN 7 KNTT', canvas1.width / 2, 28);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
    ctx.fillRect(40, 50, canvas1.width - 80, 160);
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.strokeRect(40, 50, canvas1.width - 80, 160);

    ctx.textAlign = 'left';
    ctx.font = 'bold 16px sans-serif';

    if (pillar === 1) {
      ctx.fillStyle = '#38bdf8';
      ctx.fillText('MẠCH 1: SỐ HỌC & ĐẠI SỐ (CHƯƠNG I, II, VI, VII)', 60, 80);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('• Số hữu tỉ Q & Số thực R: Tính toán thành thạo, căn bậc hai, giá trị tuyệt đối.', 60, 110);
      ctx.fillText('• Tỉ lệ thức & Đại lượng tỉ lệ: Tích chéo a·d = b·c, tỉ lệ thuận y = kx, tỉ lệ nghịch y = a/x.', 60, 140);
      ctx.fillText('• Biểu thức đại số & Đa thức một biến: Thu gọn, 4 phép tính, tìm nghiệm P(a) = 0.', 60, 170);
    } else if (pillar === 2) {
      ctx.fillStyle = '#10b981';
      ctx.fillText('MẠCH 2: HÌNH HỌC PHẲNG (CHƯƠNG III, IV, IX)', 60, 80);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('• Góc & Song song: Góc đối đỉnh, so le trong, đồng vị, định lí song song.', 60, 110);
      ctx.fillText('• Tam giác bằng nhau: 3 trường hợp bằng nhau, tam giác cân, tam giác đều.', 60, 140);
      ctx.fillText('• Quan hệ tam giác & 4 đường đồng quy: Trọng tâm G, Tâm nội tiếp I, Ngoại tiếp O, Trực tâm H.', 60, 170);
    } else if (pillar === 3) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('MẠCH 3: HÌNH HỌC TRỰC QUAN & HÌNH KHỐI (CHƯƠNG X)', 60, 80);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('• Hình hộp chữ nhật & Hình lập phương: 6 mặt, 8 đỉnh, 12 cạnh, V = a·b·h, V = a³.', 60, 110);
      ctx.fillText('• Hình lăng trụ đứng tam giác và tứ giác: Đáy song song, mặt bên chữ nhật.', 60, 140);
      ctx.fillText('• Công thức chung: Sxq = Cđáy · h; Thể tích V = Sđáy · h.', 60, 170);
    } else {
      ctx.fillStyle = '#ec4899';
      ctx.fillText('MẠCH 4: THỐNG KÊ & XÁC SUẤT (CHƯƠNG V, VIII)', 60, 80);
      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#cbd5e1';
      ctx.fillText('• Thu thập & Biểu diễn dữ liệu: Biểu đồ hình quạt tròn, biểu đồ đoạn thẳng.', 60, 110);
      ctx.fillText('• Biến cố: Biến cố chắc chắn (P=1), không thể (P=0), ngẫu nhiên (0 < P < 1).', 60, 140);
      ctx.fillText('• Xác suất đồng khả năng: P(A) = k / n.', 60, 170);
    }
  }

  const b1 = document.getElementById('btnPillar1');
  const b2 = document.getElementById('btnPillar2');
  const b3 = document.getElementById('btnPillar3');
  const b4 = document.getElementById('btnPillar4');
  if (b1) b1.onclick = () => { pillar = 1; draw(); };
  if (b2) b2.onclick = () => { pillar = 2; draw(); };
  if (b3) b3.onclick = () => { pillar = 3; draw(); };
  if (b4) b4.onclick = () => { pillar = 4; draw(); };

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
    ctx2.fillText('CHỨNG NHẬN NĂNG LỰC TOÁN 7 TOÀN DIỆN', canvas2.width / 2, 28);

    ctx2.font = '15px sans-serif';
    ctx2.textAlign = 'left';
    const x = 70;

    ctx2.fillStyle = '#10b981';
    ctx2.fillText('✓ Nắm vững 53 bài học lý thuyết & thực hành Toán 7 KNTT', x, 70);

    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText('✓ Làm chủ hơn 100 mô hình thí nghiệm tương tác Canvas 2D/3D', x, 105);

    ctx2.fillStyle = '#fbbf24';
    ctx2.fillText('✓ Chinh phục 530 thử thách trắc nghiệm chọn lọc chuẩn SGK', x, 140);

    ctx2.fillStyle = '#ec4899';
    ctx2.fillText('✓ Đạt trọn bộ 5 Huy hiệu danh dự & Sẵn sàng bứt phá môn Toán lớp 8!', x, 175);
  }

  const btn = document.getElementById('btnLab2Honor');
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
