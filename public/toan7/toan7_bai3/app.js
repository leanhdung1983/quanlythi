// ================================================================
// BÀI 3: LUỸ THỪA VỚI SỐ MŨ TỰ NHIÊN CỦA MỘT SỐ HỮU TỈ - TOÁN 7 KNTT
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
  userTitle: 'Bậc Thầy Luỹ Thừa 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai3_state';

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
    "title": "Câu 1: Tính luỹ thừa của phân số",
    "pts": 20,
    "question": "Giá trị của biểu thức $\\left(-\\frac{2}{3}\\right)^3$ bằng:",
    "options": [
      {
        "text": "$-\\frac{8}{27}$",
        "correct": true
      },
      {
        "text": "$\\frac{8}{27}$",
        "correct": false
      },
      {
        "text": "$-\\frac{6}{9}$",
        "correct": false
      },
      {
        "text": "$-\\frac{8}{9}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\left(-\\frac{2}{3}\\right)^3 = \\frac{(-2)^3}{3^3} = \\frac{-8}{27} = -\\frac{8}{27}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Quy ước luỹ thừa bậc 0",
    "pts": 20,
    "question": "Giá trị của $\\left(-2026\\frac{5}{7}\\right)^0$ là:",
    "options": [
      {
        "text": "$1$",
        "correct": true
      },
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$-1$",
        "correct": false
      },
      {
        "text": "$-2026$",
        "correct": false
      }
    ],
    "explanation": "Mọi số hữu tỉ khác 0 khi nâng lên luỹ thừa bậc 0 đều có giá trị bằng 1: $x^0 = 1$ ($x \\neq 0$)."
  },
  {
    "id": 3,
    "title": "Câu 3: Nhân hai luỹ thừa cùng cơ số",
    "pts": 20,
    "question": "Thu gọn biểu thức $\\left(\\frac{1}{2}\\right)^3 \\cdot \\left(\\frac{1}{2}\\right)^4$ dưới dạng một luỹ thừa:",
    "options": [
      {
        "text": "$\\left(\\frac{1}{2}\\right)^7$",
        "correct": true
      },
      {
        "text": "$\\left(\\frac{1}{2}\\right)^{12}$",
        "correct": false
      },
      {
        "text": "$\\left(\\frac{1}{4}\\right)^7$",
        "correct": false
      },
      {
        "text": "$\\left(\\frac{1}{2}\\right)^1$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng công thức nhân hai luỹ thừa cùng cơ số: $x^m \\cdot x^n = x^{m+n}$, ta có $\\left(\\frac{1}{2}\\right)^{3+4} = \\left(\\frac{1}{2}\\right)^7$."
  },
  {
    "id": 4,
    "title": "Câu 4: Chia hai luỹ thừa cùng cơ số",
    "pts": 20,
    "question": "Kết quả của phép chia $(-0,5)^6 : (-0,5)^2$ là:",
    "options": [
      {
        "text": "$(-0,5)^4 = 0,0625$",
        "correct": true
      },
      {
        "text": "$(-0,5)^3$",
        "correct": false
      },
      {
        "text": "$(-0,5)^8$",
        "correct": false
      },
      {
        "text": "$-0,0625$",
        "correct": false
      }
    ],
    "explanation": "Ta có $(-0,5)^6 : (-0,5)^2 = (-0,5)^{6 - 2} = (-0,5)^4 = \\left(-\\frac{1}{2}\\right)^4 = \\frac{1}{16} = 0,0625$."
  },
  {
    "id": 5,
    "title": "Câu 5: Luỹ thừa của luỹ thừa",
    "pts": 20,
    "question": "Biểu thức $\\left[\\left(-\\frac{3}{4}\\right)^2\\right]^3$ bằng biểu thức nào sau đây?",
    "options": [
      {
        "text": "$\\left(-\\frac{3}{4}\\right)^6$",
        "correct": true
      },
      {
        "text": "$\\left(-\\frac{3}{4}\\right)^5$",
        "correct": false
      },
      {
        "text": "$\\left(-\\frac{3}{4}\\right)^8$",
        "correct": false
      },
      {
        "text": "$-\\left(\\frac{3}{4}\\right)^6$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng công thức luỹ thừa của luỹ thừa: $(x^m)^n = x^{m \\cdot n}$, ta có $(2 \\cdot 3 = 6)$ nên kết quả là $\\left(-\\frac{3}{4}\\right)^6$."
  },
  {
    "id": 6,
    "title": "Câu 6: Luỹ thừa của một tích",
    "pts": 20,
    "question": "Tính nhanh giá trị của biểu thức $D = (0,25)^4 \\cdot 4^4$:",
    "options": [
      {
        "text": "$1$",
        "correct": true
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$16$",
        "correct": false
      },
      {
        "text": "$0$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng công thức $x^n \\cdot y^n = (x \\cdot y)^n$, ta có: $D = (0,25 \\cdot 4)^4 = 1^4 = 1$."
  },
  {
    "id": 7,
    "title": "Câu 7: Tìm số tự nhiên n trong luỹ thừa",
    "pts": 20,
    "question": "Tìm số tự nhiên $n$ thoả mãn đẳng thức $2^n = 32$:",
    "options": [
      {
        "text": "$n = 5$",
        "correct": true
      },
      {
        "text": "$n = 4$",
        "correct": false
      },
      {
        "text": "$n = 6$",
        "correct": false
      },
      {
        "text": "$n = 16$",
        "correct": false
      }
    ],
    "explanation": "Ta có $32 = 2^5$. Do đó $2^n = 2^5 \\implies n = 5$."
  },
  {
    "id": 8,
    "title": "Câu 8: So sánh hai luỹ thừa",
    "pts": 20,
    "question": "So sánh $2^{30}$ và $3^{20}$, ta thấy:",
    "options": [
      {
        "text": "$2^{30} < 3^{20}$",
        "correct": true
      },
      {
        "text": "$2^{30} > 3^{20}$",
        "correct": false
      },
      {
        "text": "$2^{30} = 3^{20}$",
        "correct": false
      },
      {
        "text": "Không so sánh được",
        "correct": false
      }
    ],
    "explanation": "Đưa về cùng số mũ 10: $2^{30} = (2^3)^{10} = 8^{10}$; $3^{20} = (3^2)^{10} = 9^{10}$. Vì $8 < 9$ nên $8^{10} < 9^{10}$, suy ra $2^{30} < 3^{20}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Dấu của luỹ thừa",
    "pts": 20,
    "question": "Khẳng định nào sau đây là SAI?",
    "options": [
      {
        "text": "$(-2)^4 = -16$",
        "correct": true
      },
      {
        "text": "$(-2)^4 = 16$",
        "correct": false
      },
      {
        "text": "$(-2)^3 = -8$",
        "correct": false
      },
      {
        "text": "$-2^4 = -16$",
        "correct": false
      }
    ],
    "explanation": "Ta có $(-2)^4 = (-2) \\cdot (-2) \\cdot (-2) \\cdot (-2) = 16 > 0$ (luỹ thừa bậc chẵn của số âm luôn dương). Khẳng định $(-2)^4 = -16$ là sai."
  },
  {
    "id": 10,
    "title": "Câu 10: Rút gọn biểu thức luỹ thừa phân số",
    "pts": 20,
    "question": "Rút gọn biểu thức $M = \\frac{4^3 \\cdot 9^2}{6^4}$:",
    "options": [
      {
        "text": "$4$",
        "correct": true
      },
      {
        "text": "$6$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      }
    ],
    "explanation": "Phân tích các cơ số ra thừa số nguyên tố: $4 = 2^2, 9 = 3^2, 6 = 2 \\cdot 3$. Ta có $M = \\frac{(2^2)^3 \\cdot (3^2)^2}{(2 \\cdot 3)^4} = \\frac{2^6 \\cdot 3^4}{2^4 \\cdot 3^4} = 2^{6-4} = 2^2 = 4$."
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
                let bx = 2, en = 3;

                function drawExp() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    // Ve cot gia tri tu 0 den en
                    const maxSteps = 6;
                    const colW = (w - 100) / (maxSteps + 1);
                    const baseY = h - 40;

                    let values = [];
                    for (let i = 0; i <= en; i++) {
                        values.push(Math.pow(bx, i));
                    }
                    const maxVal = Math.max(...values.map(v => Math.abs(v)), 1);

                    for (let i = 0; i <= en; i++) {
                        const val = values[i];
                        const colH = Math.min((Math.abs(val) / maxVal) * (h - 90), h - 90);
                        const x = 50 + i * colW;
                        const y = (val >= 0) ? (baseY - colH) : baseY;

                        ctx.fillStyle = (val >= 0) ? 'rgba(99, 102, 241, 0.7)' : 'rgba(244, 63, 94, 0.7)';
                        ctx.fillRect(x, y, colW - 15, colH);
                        ctx.strokeStyle = '#ffffff';
                        ctx.lineWidth = 1.5;
                        ctx.strokeRect(x, y, colW - 15, colH);

                        ctx.fillStyle = '#cbd5e1';
                        ctx.font = '12px Segoe UI';
                        ctx.textAlign = 'center';
                        ctx.fillText(`${bx}^${i}`, x + (colW - 15)/2, baseY + 18);

                        ctx.fillStyle = '#f59e0b';
                        ctx.font = 'bold 12px Segoe UI';
                        const labelY = (val >= 0) ? y - 8 : y + colH + 16;
                        ctx.fillText(val.toString(), x + (colW - 15)/2, labelY);
                    }

                    // Duong truc nam ngang
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(30, baseY);
                    ctx.lineTo(w - 30, baseY);
                    ctx.stroke();

                    const resVal = Math.pow(bx, en);
                    let multStr = '';
                    if (en === 0) multStr = '1 (quy ước)';
                    else multStr = Array(en).fill(`(${bx})`).join(' \\cdot ');

                    const out = document.getElementById('lab1ExpOut');
                    out.innerHTML = `Giá trị: $(${bx})^{${en}} = ${multStr} = ${resVal}$. (Dấu kết quả: ${resVal >= 0 ? 'Dương' : 'Âm'})`;
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 200 * window.devicePixelRatio || 200;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawExp();
                }

                document.getElementById('sliderBaseX').addEventListener('input', e => {
                    bx = parseInt(e.target.value);
                    document.getElementById('valBaseX').textContent = bx;
                    drawExp();
                });
                document.getElementById('sliderExpN').addEventListener('input', e => {
                    en = parseInt(e.target.value);
                    document.getElementById('valExpN').textContent = en;
                    drawExp();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                function calcPow() {
                    const x = parseInt(document.getElementById('l2_base').value) || 2;
                    const m = parseInt(document.getElementById('l2_m').value) || 0;
                    const n = parseInt(document.getElementById('l2_n').value) || 0;
                    const op = document.getElementById('l2_op').value;
                    const out = document.getElementById('lab2PowOut');

                    let stepHtml = '';
                    if (op === '*') {
                        const sum = m + n;
                        stepHtml = `$$(${x})^{${m}} \\cdot (${x})^{${n}} = (${x})^{${m} + ${n}} = (${x})^{${sum}} = ${Math.pow(x, sum)}$$`;
                    } else if (op === '/') {
                        if (x === 0) {
                            out.innerHTML = '<span style="color:#f43f5e;">Lỗi: Cơ số phép chia phải khác 0!</span>';
                            return;
                        }
                        const diff = m - n;
                        stepHtml = `$$(${x})^{${m}} : (${x})^{${n}} = (${x})^{${m} - ${n}} = (${x})^{${diff}} = ${Math.pow(x, diff)}$$`;
                    } else if (op === 'pow') {
                        const prod = m * n;
                        stepHtml = `$$\\left((${x})^{${m}}\\right)^{${n}} = (${x})^{${m} \\cdot ${n}} = (${x})^{${prod}} = ${Math.pow(x, prod)}$$`;
                    }

                    out.innerHTML = `<strong>Công thức rút gọn:</strong><br>${stepHtml}`;
                    renderMathInTree(out);
                }

                document.getElementById('btnCalcPow2').addEventListener('click', calcPow);
                setTimeout(calcPow, 100);
            
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
