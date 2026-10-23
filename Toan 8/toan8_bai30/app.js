// ================================================================
// BÀI 30: KẾT QUẢ CÓ THỂ VÀ KẾT QUẢ THUẬN LỢI - TOÁN 8 KNTT
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
  userTitle: 'Nhà Thám Hiểm Ngẫu Nhiên 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai30_state';

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
    "title": "Câu 1: Nhận diện phép thử ngẫu nhiên",
    "pts": 20,
    "question": "Hành động nào sau đây là một phép thử ngẫu nhiên?",
    "options": [
      {
        "text": "Gieo một con xúc xắc và quan sát số chấm xuất hiện",
        "correct": true
      },
      {
        "text": "Đun nước nguyên chất ở áp suất 1 atm đến 100°C và quan sát nước sôi",
        "correct": false
      },
      {
        "text": "Thả một hòn đá rơi tự do từ trên cao xuống",
        "correct": false
      },
      {
        "text": "Tính tổng của 2 và 3",
        "correct": false
      }
    ],
    "explanation": "Phép thử ngẫu nhiên là hành động mà ta không thể biết trước kết quả nào sẽ xảy ra nhưng biết trước tập hợp tất cả các kết quả có thể. Việc gieo xúc xắc là ngẫu nhiên."
  },
  {
    "id": 2,
    "title": "Câu 2: Số kết quả có thể khi gieo xúc xắc",
    "pts": 20,
    "question": "Gieo một con xúc xắc 6 mặt đồng chất. Số kết quả có thể xảy ra của phép thử này là:",
    "options": [
      {
        "text": "$6$",
        "correct": true
      },
      {
        "text": "$12$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$36$",
        "correct": false
      }
    ],
    "explanation": "Có 6 kết quả có thể, tương ứng với số chấm xuất hiện là $1, 2, 3, 4, 5, 6$."
  },
  {
    "id": 3,
    "title": "Câu 3: Đếm kết quả thuận lợi cho mặt chẵn",
    "pts": 20,
    "question": "Gieo một con xúc xắc 6 mặt. Số kết quả thuận lợi cho biến cố: 'Số chấm xuất hiện là số chẵn' là:",
    "options": [
      {
        "text": "$3$",
        "correct": true
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$6$",
        "correct": false
      }
    ],
    "explanation": "Các kết quả thuận lợi là các mặt chấm chẵn: $\\{2; 4; 6\\}$. Có tất cả 3 kết quả thuận lợi."
  },
  {
    "id": 4,
    "title": "Câu 4: Đếm kết quả thuận lợi cho số nguyên tố",
    "pts": 20,
    "question": "Gieo một con xúc xắc. Các kết quả thuận lợi cho biến cố: 'Số chấm xuất hiện là số nguyên tố' là:",
    "options": [
      {
        "text": "Mặt $2, 3, 5$ chấm",
        "correct": true
      },
      {
        "text": "Mặt $1, 2, 3, 5$ chấm",
        "correct": false
      },
      {
        "text": "Mặt $2, 4, 6$ chấm",
        "correct": false
      },
      {
        "text": "Mặt $3, 5$ chấm",
        "correct": false
      }
    ],
    "explanation": "Trong các số từ $1$ đến $6$, các số nguyên tố là $2, 3, 5$ (số 1 không phải là số nguyên tố)."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhận diện biến cố không thể",
    "pts": 20,
    "question": "Trong phép thử gieo một con xúc xắc 6 mặt, biến cố nào sau đây là <strong>biến cố không thể</strong>?",
    "options": [
      {
        "text": "Số chấm xuất hiện bằng $7$",
        "correct": true
      },
      {
        "text": "Số chấm xuất hiện lớn hơn $5$",
        "correct": false
      },
      {
        "text": "Số chấm xuất hiện chia hết cho $3$",
        "correct": false
      },
      {
        "text": "Số chấm xuất hiện nhỏ hơn $7$",
        "correct": false
      }
    ],
    "explanation": "Xúc xắc 6 mặt chỉ có từ 1 đến 6 chấm, không thể xuất hiện mặt 7 chấm. Đây là biến cố không thể."
  },
  {
    "id": 6,
    "title": "Câu 6: Nhận diện biến cố chắc chắn",
    "pts": 20,
    "question": "Trong phép thử gieo một con xúc xắc 6 mặt, biến cố nào sau đây là <strong>biến cố chắc chắn</strong>?",
    "options": [
      {
        "text": "Số chấm xuất hiện nhỏ hơn $7$",
        "correct": true
      },
      {
        "text": "Số chấm xuất hiện là số chẵn",
        "correct": false
      },
      {
        "text": "Số chấm xuất hiện lớn hơn $3$",
        "correct": false
      },
      {
        "text": "Số chấm xuất hiện là số lẻ",
        "correct": false
      }
    ],
    "explanation": "Mọi mặt của xúc xắc đều có số chấm từ 1 đến 6, luôn luôn nhỏ hơn 7. Do đó biến cố này luôn luôn xảy ra (chắc chắn)."
  },
  {
    "id": 7,
    "title": "Câu 7: Rút thăm số có hai chữ số",
    "pts": 20,
    "question": "Trong một hộp có 10 tấm thẻ ghi các số từ $1$ đến $10$. Rút ngẫu nhiên một thẻ. Số kết quả thuận lợi cho biến cố: 'Số ghi trên thẻ là số chia hết cho 3' là:",
    "options": [
      {
        "text": "$3$",
        "correct": true
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$5$",
        "correct": false
      }
    ],
    "explanation": "Các số từ 1 đến 10 chia hết cho 3 là: $\\{3; 6; 9\\}$. Có đúng 3 kết quả thuận lợi."
  },
  {
    "id": 8,
    "title": "Câu 8: Rút quả cầu trong bình",
    "pts": 20,
    "question": "Một bình kín chứa 3 quả bóng xanh, 4 quả bóng đỏ và 5 quả bóng vàng có cùng kích thước. Lấy ngẫu nhiên 1 quả bóng. Có bao nhiêu kết quả có thể xảy ra của phép thử này?",
    "options": [
      {
        "text": "$12$",
        "correct": true
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$60$",
        "correct": false
      },
      {
        "text": "$4$",
        "correct": false
      }
    ],
    "explanation": "Tổng số quả bóng trong bình là $3 + 4 + 5 = 12$ quả bóng. Vì mỗi quả bóng là một kết quả có thể nên có tất cả 12 kết quả có thể xảy ra."
  },
  {
    "id": 9,
    "title": "Câu 9: Tung hai đồng xu đồng thời",
    "pts": 20,
    "question": "Tung đồng thời hai đồng xu cân đối. Tập hợp tất cả các kết quả có thể xảy ra là:",
    "options": [
      {
        "text": "$\\{(S, S); (S, N); (N, S); (N, N)\\}$",
        "correct": true
      },
      {
        "text": "$\\{(S, S); (N, N)\\}$",
        "correct": false
      },
      {
        "text": "$\\{S; N\\}$",
        "correct": false
      },
      {
        "text": "$\\{(S, S); (S, N); (N, N)\\}$",
        "correct": false
      }
    ],
    "explanation": "Mỗi đồng xu có 2 khả năng (S hoặc N). Tung hai đồng xu có $2 \\times 2 = 4$ kết quả có thể: $(S, S), (S, N), (N, S), (N, N)$."
  },
  {
    "id": 10,
    "title": "Câu 10: Hai mặt cùng sấp khi tung 2 đồng xu",
    "pts": 20,
    "question": "Khi tung đồng thời hai đồng xu cân đối, số kết quả thuận lợi cho biến cố: 'Có ít nhất một đồng xu xuất hiện mặt ngửa' là:",
    "options": [
      {
        "text": "$3$",
        "correct": true
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$4$",
        "correct": false
      }
    ],
    "explanation": "Trong 4 kết quả có thể, các kết quả có ít nhất một mặt ngửa là: $(S, N), (N, S), (N, N)$. Có tất cả 3 kết quả thuận lợi."
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
                const btnRoll = document.getElementById('btnRollDice');
                const outEl = document.getElementById('lab1Output30');

                let curVal = 4;

                function render() {
                    const isEven = (curVal % 2 === 0);
                    const isPrime = [2, 3, 5].includes(curVal);
                    const isGt3 = (curVal > 3);

                    outEl.innerHTML = `<strong>Kết quả xuất hiện: Mặt $${curVal}$ chấm</strong> <br>` +
                        `• Biến cố A (Chẵn {2,4,6}): ${isEven ? '<span style="color:#34d399; font-weight:bold;">✅ Thuận lợi!</span>' : '<span style="color:#f87171;">❌ Không thuận lợi</span>'} &nbsp;|&nbsp; ` +
                        `• Biến cố B (Nguyên tố {2,3,5}): ${isPrime ? '<span style="color:#34d399; font-weight:bold;">✅ Thuận lợi!</span>' : '<span style="color:#f87171;">❌ Không thuận lợi</span>'} &nbsp;|&nbsp; ` +
                        `• Biến cố C (Lớn hơn 3 {4,5,6}): ${isGt3 ? '<span style="color:#34d399; font-weight:bold;">✅ Thuận lợi!</span>' : '<span style="color:#f87171;">❌ Không thuận lợi</span>'}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Vẽ khối xúc xắc 3D
                    const cx = w / 2;
                    const cy = h / 2;
                    ctx.fillStyle = '#f8fafc';
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.roundRect(cx - 50, cy - 50, 100, 100, 14);
                    ctx.fill();
                    ctx.stroke();

                    // Vẽ chấm tròn trên mặt xúc xắc
                    ctx.fillStyle = curVal === 1 ? '#ef4444' : '#1e1b4b';
                    const dot = (x, y) => { ctx.beginPath(); ctx.arc(cx + x, cy + y, 7, 0, Math.PI * 2); ctx.fill(); };

                    if (curVal === 1) dot(0, 0);
                    else if (curVal === 2) { dot(-25, -25); dot(25, 25); }
                    else if (curVal === 3) { dot(-25, -25); dot(0, 0); dot(25, 25); }
                    else if (curVal === 4) { dot(-25, -25); dot(25, -25); dot(-25, 25); dot(25, 25); }
                    else if (curVal === 5) { dot(-25, -25); dot(25, -25); dot(0, 0); dot(-25, 25); dot(25, 25); }
                    else if (curVal === 6) { dot(-25, -25); dot(-25, 0); dot(-25, 25); dot(25, -25); dot(25, 0); dot(25, 25); }
                }

                btnRoll.addEventListener('click', () => {
                    curVal = Math.floor(Math.random() * 6) + 1;
                    render();
                });
                render();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const btnSpin = document.getElementById('btnSpinWheel');
                const outEl = document.getElementById('lab2Output30');

                let arrowVal = 3;

                function draw() {
                    const isDiv4 = (arrowVal % 4 === 0);
                    outEl.innerHTML = `<strong>Mũi tên chỉ vào ô số: ${arrowVal}</strong> &nbsp;|&nbsp; <strong>Không gian 8 kết quả:</strong> $\\{1; 2; 3; 4; 5; 6; 7; 8\\}$ <br>Biến cố 'Chia hết cho 4': Các kết quả thuận lợi là $\\{4; 8\\}$ ($k = 2$) $\\implies$ ${isDiv4 ? '<strong style="color:#34d399;">✅ THUẬN LỢI!</strong>' : '<span style="color:#94a3b8;">Không thuận lợi</span>'}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const cx = w / 2;
                    const cy = h / 2;
                    const r = 70;
                    const colors = ['#f43f5e', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#a855f7', '#ec4899', '#3b82f6'];

                    for (let i = 0; i < 8; i++) {
                        const startA = (i * Math.PI) / 4;
                        const endA = ((i + 1) * Math.PI) / 4;
                        ctx.fillStyle = colors[i];
                        ctx.beginPath();
                        ctx.moveTo(cx, cy);
                        ctx.arc(cx, cy, r, startA, endA);
                        ctx.closePath();
                        ctx.fill();

                        // Số trên quạt
                        const midA = (startA + endA) / 2;
                        const tx = cx + Math.cos(midA) * (r * 0.7);
                        const ty = cy + Math.sin(midA) * (r * 0.7);
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 14px Segoe UI';
                        ctx.textAlign = 'center';
                        ctx.fillText(i + 1, tx, ty + 5);
                    }

                    // Kim chỉ
                    ctx.fillStyle = '#f8fafc';
                    ctx.beginPath();
                    ctx.moveTo(cx, cy - r - 12);
                    ctx.lineTo(cx - 8, cy - r + 8);
                    ctx.lineTo(cx + 8, cy - r + 8);
                    ctx.closePath();
                    ctx.fill();
                }

                btnSpin.addEventListener('click', () => {
                    arrowVal = Math.floor(Math.random() * 8) + 1;
                    draw();
                });
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
