// ================================================================
// BÀI 2: ĐA THỨC - TOÁN 8 KNTT
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
  userTitle: 'Nhà Thám Hiểm Đa Thức 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai2_state';

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
    "title": "Thử Thách 1: Nhận Biết Đa Thức",
    "pts": 20,
    "question": "Biểu thức nào sau đây KHÔNG PHẢI là một đa thức?",
    "options": [
      {
        "text": "$x^2 - 3xy + 1$",
        "correct": false
      },
      {
        "text": "$\\frac{x + 1}{y}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{2} x^2 y - 5$",
        "correct": false
      },
      {
        "text": "$-7 x^3 y^2$",
        "correct": false
      }
    ],
    "explanation": "Biểu thức $\\frac{x + 1}{y}$ có chứa biến $y$ ở mẫu nên không phải là đa thức (đa thức là tổng của những đơn thức, mà đơn thức không chứa biến ở mẫu)."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Các Hạng Tử Của Đa Thức",
    "pts": 20,
    "question": "Các hạng tử của đa thức $A = 3x^2y - 2xy + y^2 - 7$ là:",
    "options": [
      {
        "text": "$3x^2y;\\, -2xy;\\, y^2;\\, -7$",
        "correct": true
      },
      {
        "text": "$3x^2y;\\, 2xy;\\, y^2;\\, 7$",
        "correct": false
      },
      {
        "text": "$3x^2y;\\, 2xy;\\, y^2$",
        "correct": false
      },
      {
        "text": "$x^2y;\\, xy;\\, y^2;\\, 1$",
        "correct": false
      }
    ],
    "explanation": "Đa thức là tổng của các đơn thức: $A = (3x^2y) + (-2xy) + (y^2) + (-7)$. Do đó các hạng tử lần lượt là $3x^2y, -2xy, y^2, -7$."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Thu Gọn Đa Thức",
    "pts": 20,
    "question": "Thu gọn đa thức $M = 2x^2y + 3xy^2 - 5x^2y + xy^2$ ta được:",
    "options": [
      {
        "text": "$-3x^2y + 4xy^2$",
        "correct": true
      },
      {
        "text": "$3x^2y + 4xy^2$",
        "correct": false
      },
      {
        "text": "$-3x^2y + 3xy^2$",
        "correct": false
      },
      {
        "text": "$-7x^2y + 4xy^2$",
        "correct": false
      }
    ],
    "explanation": "Nhóm các hạng tử đồng dạng: $M = (2x^2y - 5x^2y) + (3xy^2 + xy^2) = -3x^2y + 4xy^2$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Xác Định Bậc Đa Thức",
    "pts": 20,
    "question": "Bậc của đa thức $P = x^5 - 2x^3y^3 + y^4 - 1$ là:",
    "options": [
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "$6$",
        "correct": true
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$12$",
        "correct": false
      }
    ],
    "explanation": "Xét bậc từng hạng tử trong đa thức đã thu gọn: $x^5$ bậc 5; $-2x^3y^3$ bậc $3 + 3 = 6$; $y^4$ bậc 4; $-1$ bậc 0. Hạng tử có bậc cao nhất là 6 nên bậc của đa thức là 6."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Bẫy Bậc Chưa Thu Gọn",
    "pts": 20,
    "question": "Bậc của đa thức $Q = x^4y - 3x^2 + 5 - x^4y + 2x^3$ là:",
    "options": [
      {
        "text": "$5$",
        "correct": false
      },
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
      }
    ],
    "explanation": "Cần thu gọn trước: $Q = (x^4y - x^4y) + 2x^3 - 3x^2 + 5 = 2x^3 - 3x^2 + 5$. Hạng tử bậc cao nhất là $2x^3$ có bậc 3. Do đó bậc của $Q$ là 3."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Tính Giá Trị Đa Thức",
    "pts": 20,
    "question": "Giá trị của đa thức $B = x^2 - 4xy + 4y^2$ tại $x = 3$ và $y = 1$ là:",
    "options": [
      {
        "text": "$1$",
        "correct": true
      },
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "$-1$",
        "correct": false
      },
      {
        "text": "$9$",
        "correct": false
      }
    ],
    "explanation": "Thay $x = 3, y = 1$ vào $B$: $B = 3^2 - 4(3)(1) + 4(1^2) = 9 - 12 + 4 = 1$ (hoặc nhận ra $B = (x - 2y)^2 = (3 - 2)^2 = 1$)."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Đa Thức Bậc Không",
    "pts": 20,
    "question": "Số thực nào sau đây được coi là đa thức có bậc bằng $0$?",
    "options": [
      {
        "text": "$0$",
        "correct": false
      },
      {
        "text": "$-2026$",
        "correct": true
      },
      {
        "text": "$x$",
        "correct": false
      },
      {
        "text": "$x^0y^0$",
        "correct": false
      }
    ],
    "explanation": "Mọi số thực khác $0$ đều là đơn thức (và đa thức) bậc 0. Riêng số $0$ được gọi là đa thức không và quy ước không có bậc."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Nhận Dạng Đa Thức Thu Gọn",
    "pts": 20,
    "question": "Đa thức nào sau đây ĐÃ LÀ một đa thức thu gọn?",
    "options": [
      {
        "text": "$x^2y + 3xy - 2x^2y$",
        "correct": false
      },
      {
        "text": "$x^3 + 2x^2 - x + 5$",
        "correct": true
      },
      {
        "text": "$xy + yz - xy$",
        "correct": false
      },
      {
        "text": "$2x + 3x - 1$",
        "correct": false
      }
    ],
    "explanation": "Đa thức $x^3 + 2x^2 - x + 5$ không còn hai hạng tử nào đồng dạng nên đã ở dạng thu gọn. Các đa thức khác đều còn hạng tử đồng dạng chưa gộp."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Bậc Của Đa Thức Hai Biến",
    "pts": 20,
    "question": "Cho đa thức $F = 5x^2y^3 - 3x^4y + x^3y^3 - 2$. Bậc của $F$ là:",
    "options": [
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "$6$",
        "correct": true
      },
      {
        "text": "$4$",
        "correct": false
      },
      {
        "text": "$7$",
        "correct": false
      }
    ],
    "explanation": "Bậc các hạng tử: $5x^2y^3$ (bậc 5), $-3x^4y$ (bậc 5), $x^3y^3$ (bậc $3+3=6$), $-2$ (bậc 0). Bậc cao nhất là 6."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Ứng Dụng Hình Học Của Đa Thức",
    "pts": 20,
    "question": "Một hình chữ nhật có chiều dài là $2x + y$ và chiều rộng là $x$. Biểu thức tính chu vi của hình chữ nhật đó là đa thức bậc mấy theo hai biến $x, y$?",
    "options": [
      {
        "text": "Bậc $1$",
        "correct": true
      },
      {
        "text": "Bậc $2$",
        "correct": false
      },
      {
        "text": "Bậc $3$",
        "correct": false
      },
      {
        "text": "Bậc $0$",
        "correct": false
      }
    ],
    "explanation": "Chu vi hình chữ nhật là $C = 2[(2x + y) + x] = 2(3x + y) = 6x + 2y$. Đây là đa thức bậc 1 đối với hai biến $x, y$."
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
                const outEl = document.getElementById('lab1Output');
                const btnGen = document.getElementById('btnGenPoly');
                const btnStep = document.getElementById('btnStepReduce');

                let curPoly = [
                    { c: 3, v: 'x^2y', d: 3 },
                    { c: -2, v: 'xy', d: 2 },
                    { c: -5, v: 'x^2y', d: 3 },
                    { c: 4, v: 'x^3', d: 3 },
                    { c: 7, v: 'xy', d: 2 },
                    { c: -1, v: '', d: 0 }
                ];

                function render() {
                    const origStr = curPoly.map((t, idx) => {
                        const sign = (t.c >= 0 && idx > 0) ? '+ ' : (t.c < 0 && idx > 0 ? '- ' : (t.c < 0 ? '-' : ''));
                        const absC = Math.abs(t.c);
                        const cStr = (absC === 1 && t.v) ? '' : absC;
                        return `${sign}${cStr}${t.v}`;
                    }).join(' ');

                    // Thu gon
                    const map = {};
                    curPoly.forEach(t => {
                        map[t.v] = (map[t.v] || 0) + t.c;
                    });
                    const reduced = [];
                    let maxDeg = 0;
                    for (const v in map) {
                        if (map[v] !== 0) {
                            const deg = v.includes('x^3') ? 3 : (v.includes('x^2y') ? 3 : (v.includes('xy') ? 2 : 0));
                            if (deg > maxDeg) maxDeg = deg;
                            reduced.push({ c: map[v], v: v, d: deg });
                        }
                    }

                    const redStr = reduced.map((t, idx) => {
                        const sign = (t.c >= 0 && idx > 0) ? '+ ' : (t.c < 0 && idx > 0 ? '- ' : (t.c < 0 ? '-' : ''));
                        const absC = Math.abs(t.c);
                        const cStr = (absC === 1 && t.v) ? '' : absC;
                        return `${sign}${cStr}${t.v}`;
                    }).join(' ') || '0';

                    outEl.innerHTML = `
                        <p><strong>Đa thức ban đầu:</strong> $P = ${origStr}$</p>
                        <p><strong>Dạng thu gọn:</strong> $P = ${redStr}$</p>
                        <p><strong>Bậc của đa thức:</strong> $${maxDeg}$</p>
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    // Ve bieu do so hang tu
                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#818cf8';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('SO SÁNH SỐ LƯỢNG HẠNG TỬ: TRƯỚC VÀ SAU THU GỌN', 30, 40);

                    ctx.fillStyle = '#f43f5e';
                    ctx.fillRect(50, 70, curPoly.length * 50, 35);
                    ctx.fillStyle = '#fff';
                    ctx.font = '14px Segoe UI';
                    ctx.fillText(`Trước thu gọn: ${curPoly.length} hạng tử`, 60, 93);

                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(50, 125, reduced.length * 50, 35);
                    ctx.fillStyle = '#fff';
                    ctx.fillText(`Sau thu gọn: ${reduced.length} hạng tử (Bậc ${maxDeg})`, 60, 148);
                }

                btnGen.addEventListener('click', () => {
                    curPoly = [
                        { c: Math.floor(Math.random() * 8) - 4 || 2, v: 'x^2y', d: 3 },
                        { c: Math.floor(Math.random() * 8) - 4 || -3, v: 'xy', d: 2 },
                        { c: Math.floor(Math.random() * 8) - 4 || 5, v: 'x^2y', d: 3 },
                        { c: Math.floor(Math.random() * 8) - 4 || -1, v: 'x^3', d: 3 },
                        { c: Math.floor(Math.random() * 8) - 4 || 2, v: 'xy', d: 2 },
                        { c: Math.floor(Math.random() * 6) - 3 || 1, v: '', d: 0 }
                    ];
                    render();
                });

                btnStep.addEventListener('click', render);
                render();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const valX = document.getElementById('valX');
                const valY = document.getElementById('valY');
                const dispX = document.getElementById('dispX');
                const dispY = document.getElementById('dispY');
                const outEl = document.getElementById('lab2Output');

                function update() {
                    const x = parseInt(valX.value);
                    const y = parseInt(valY.value);
                    dispX.textContent = x;
                    dispY.textContent = y;

                    const t1 = 2 * x * x;
                    const t2 = -3 * x * y;
                    const t3 = y * y;
                    const res = t1 + t2 + t3;

                    outEl.innerHTML = `
                        <strong>Thay số:</strong> $P(${x}, ${y}) = 2 \\cdot (${x})^2 - 3 \\cdot (${x}) \\cdot (${y}) + (${y})^2$<br>
                        <strong>Từng hạng tử:</strong> $= ${t1} ${t2 >= 0 ? '+ ' + t2 : '- ' + Math.abs(t2)} + ${t3} = \\mathbf{${res}}$
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Ve thanh bieu dien cac hang tu
                    ctx.fillStyle = '#818cf8';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('GIÁ TRỊ CÁC HẠNG TỬ VÀ KẾT QUẢ TỔNG THỂ', 30, 35);

                    const items = [
                        { name: `2x² = ${t1}`, val: t1, color: '#06b6d4' },
                        { name: `-3xy = ${t2}`, val: t2, color: '#f59e0b' },
                        { name: `y² = ${t3}`, val: t3, color: '#ec4899' },
                        { name: `TỔNG P = ${res}`, val: res, color: '#10b981' }
                    ];

                    items.forEach((it, i) => {
                        const yPos = 60 + i * 36;
                        ctx.fillStyle = it.color;
                        ctx.fillRect(40, yPos, Math.max(20, Math.abs(it.val) * 6), 24);
                        ctx.fillStyle = '#fff';
                        ctx.font = 'bold 13px Segoe UI';
                        ctx.fillText(it.name, 50 + Math.max(20, Math.abs(it.val) * 6), yPos + 17);
                    });
                }

                valX.addEventListener('input', update);
                valY.addEventListener('input', update);
                update();
            
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
