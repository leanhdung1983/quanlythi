// ================================================================
// ÔN TẬP CHƯƠNG VII: PHƯƠNG TRÌNH & HÀM SỐ - TOÁN 8 KNTT
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
  userTitle: 'Đại Kiện Tướng Đại Số Tuyến Tính 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_ontap_chuong7_state';

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
    "title": "Câu 1: Giải phương trình chứa phân số",
    "pts": 20,
    "question": "Nghiệm của phương trình $\\frac{x - 3}{5} = \\frac{x - 5}{3}$ là:",
    "options": [
      {
        "text": "$x = 8$",
        "correct": true
      },
      {
        "text": "$x = -8$",
        "correct": false
      },
      {
        "text": "$x = 2$",
        "correct": false
      },
      {
        "text": "$x = 15$",
        "correct": false
      }
    ],
    "explanation": "Quy đồng mẫu 15: $3(x - 3) = 5(x - 5) \\iff 3x - 9 = 5x - 25 \\iff 2x = 16 \\iff x = 8$."
  },
  {
    "id": 2,
    "title": "Câu 2: Bài toán chu vi hình chữ nhật",
    "pts": 20,
    "question": "Một thửa ruộng hình chữ nhật có chu vi $72\\text{ m}$. Chiều dài gấp đôi chiều rộng. Diện tích thửa ruộng là:",
    "options": [
      {
        "text": "$288\\text{ m}^2$",
        "correct": true
      },
      {
        "text": "$144\\text{ m}^2$",
        "correct": false
      },
      {
        "text": "$320\\text{ m}^2$",
        "correct": false
      },
      {
        "text": "$256\\text{ m}^2$",
        "correct": false
      }
    ],
    "explanation": "Nửa chu vi: $72 : 2 = 36\\text{ m}$. Chiều rộng $x$, chiều dài $2x$. Ta có $x + 2x = 36 \\iff 3x = 36 \\iff x = 12\\text{ m}$. Chiều dài $24\\text{ m}$. Diện tích $S = 12 \\times 24 = 288\\text{ m}^2$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính đồng biến nghịch biến của hàm bậc nhất",
    "pts": 20,
    "question": "Cho hàm số $y = (2 - \\sqrt{5})x + 1$. Hàm số này:",
    "options": [
      {
        "text": "Nghịch biến trên $\\mathbb{R}$",
        "correct": true
      },
      {
        "text": "Đồng biến trên $\\mathbb{R}$",
        "correct": false
      },
      {
        "text": "Vừa đồng biến vừa nghịch biến",
        "correct": false
      },
      {
        "text": "Là hàm hằng",
        "correct": false
      }
    ],
    "explanation": "Vì $2 = \\sqrt{4} < \\sqrt{5}$ nên $2 - \\sqrt{5} < 0$. Do hệ số $a < 0$ nên hàm số nghịch biến trên $\\mathbb{R}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tìm giao điểm của hai đường thẳng",
    "pts": 20,
    "question": "Giao điểm của hai đường thẳng $y = 3x - 2$ và $y = x + 4$ là:",
    "options": [
      {
        "text": "$(3; 7)$",
        "correct": true
      },
      {
        "text": "$(2; 6)$",
        "correct": false
      },
      {
        "text": "$(1; 5)$",
        "correct": false
      },
      {
        "text": "$(3; 5)$",
        "correct": false
      }
    ],
    "explanation": "Phương trình hoành độ giao điểm: $3x - 2 = x + 4 \\iff 2x = 6 \\iff x = 3$. Thay $x = 3$ vào $y = 3 + 4 = 7$. Tọa độ giao điểm là $(3; 7)$."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhận diện hai đường thẳng song song",
    "pts": 20,
    "question": "Cặp đường thẳng nào sau đây song song với nhau?",
    "options": [
      {
        "text": "$y = 4x + 1$ và $y = 4x - 3$",
        "correct": true
      },
      {
        "text": "$y = 2x + 1$ và $y = 3x + 1$",
        "correct": false
      },
      {
        "text": "$y = -x + 2$ và $y = x + 2$",
        "correct": false
      },
      {
        "text": "$y = 5x$ và $y = -5x$",
        "correct": false
      }
    ],
    "explanation": "Hai đường thẳng $y = 4x + 1$ và $y = 4x - 3$ có cùng hệ số góc $a = 4$ và tung độ gốc khác nhau ($1 \\neq -3$) nên chúng song song."
  },
  {
    "id": 6,
    "title": "Câu 6: Đường thẳng đi qua điểm và song song",
    "pts": 20,
    "question": "Đường thẳng $d$ song song với $y = 3x - 1$ và đi qua điểm $M(1; 5)$ có phương trình là:",
    "options": [
      {
        "text": "$y = 3x + 2$",
        "correct": true
      },
      {
        "text": "$y = 3x + 5$",
        "correct": false
      },
      {
        "text": "$y = -3x + 8$",
        "correct": false
      },
      {
        "text": "$y = 3x - 1$",
        "correct": false
      }
    ],
    "explanation": "Vì $d \\parallel y = 3x - 1$ nên $d: y = 3x + b$ ($b \\neq -1$). Đi qua $M(1; 5) \\implies 5 = 3(1) + b \\iff b = 2$. Vậy $y = 3x + 2$."
  },
  {
    "id": 7,
    "title": "Câu 7: Điểm cố định của họ đường thẳng",
    "pts": 20,
    "question": "Họ đường thẳng $y = mx + 3$ luôn đi qua điểm cố định nào với mọi giá trị của $m$?",
    "options": [
      {
        "text": "$(0; 3)$",
        "correct": true
      },
      {
        "text": "$(3; 0)$",
        "correct": false
      },
      {
        "text": "$(1; 3)$",
        "correct": false
      },
      {
        "text": "$(0; 0)$",
        "correct": false
      }
    ],
    "explanation": "Với $x = 0$, ta có $y = m(0) + 3 = 3$ với mọi $m$. Vậy họ đường thẳng luôn đi qua điểm cố định $(0; 3)$ trên trục tung."
  },
  {
    "id": 8,
    "title": "Câu 8: Bài toán năng suất làm chung vòi nước",
    "pts": 20,
    "question": "Hai vòi nước cùng chảy vào một bể không có nước thì sau $6\\text{ giờ}$ đầy bể. Nếu vòi 1 chảy một mình trong $10\\text{ giờ}$ mới đầy, thì vòi 2 chảy một mình đầy bể trong:",
    "options": [
      {
        "text": "$15\\text{ giờ}$",
        "correct": true
      },
      {
        "text": "$12\\text{ giờ}$",
        "correct": false
      },
      {
        "text": "$16\\text{ giờ}$",
        "correct": false
      },
      {
        "text": "$8\\text{ giờ}$",
        "correct": false
      }
    ],
    "explanation": "Trong 1 giờ cả hai vòi chảy được $\\frac{1}{6}$ bể, vòi 1 chảy được $\\frac{1}{10}$ bể. Vòi 2 chảy được $\\frac{1}{6} - \\frac{1}{10} = \\frac{5 - 3}{30} = \\frac{2}{30} = \\frac{1}{15}$ bể. Vậy vòi 2 chảy một mình hết 15 giờ."
  },
  {
    "id": 9,
    "title": "Câu 9: Hệ số góc của đường phân giác góc phần tư I",
    "pts": 20,
    "question": "Đường thẳng $y = x$ là đường phân giác của góc phần tư thứ nhất. Hệ số góc của nó bằng:",
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
        "text": "$45$",
        "correct": false
      }
    ],
    "explanation": "Đường thẳng $y = x = 1 \\cdot x$ có hệ số góc $a = 1$ (ứng với góc tạo bởi đường thẳng và trục $Ox$ là $45^\\circ$)."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng mô hình tài chính điểm hòa vốn",
    "pts": 20,
    "question": "Chi phí cố định sản xuất một lô hàng là $10\\text{ triệu đồng}$, chi phí biến đổi là $50\\,000\\text{ đồng/sản phẩm}$. Giá bán mỗi sản phẩm là $100\\,000\\text{ đồng}$. Để hòa vốn (Doanh thu = Chi phí), cơ sở cần bán bao nhiêu sản phẩm?",
    "options": [
      {
        "text": "$200\\text{ sản phẩm}$",
        "correct": true
      },
      {
        "text": "$100\\text{ sản phẩm}$",
        "correct": false
      },
      {
        "text": "$150\\text{ sản phẩm}$",
        "correct": false
      },
      {
        "text": "$250\\text{ sản phẩm}$",
        "correct": false
      }
    ],
    "explanation": "Gọi số sản phẩm là $x$. Chi phí $C(x) = 10\\,000\\,000 + 50\\,000 x$. Doanh thu $R(x) = 100\\,000 x$. Hòa vốn khi $R(x) = C(x) \\iff 100\\,000 x = 10\\,000\\,000 + 50\\,000 x \\iff 50\\,000 x = 10\\,000\\,000 \\iff x = 200$."
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
                const outEl = document.getElementById('lab1OutputC7');

                const c7Topics = {
                    1: { title: "Phương trình bậc nhất", formula: "$ax + b = 0 \\iff x = -b/a$", desc: "Hai quy tắc: chuyển vế đổi dấu, nhân chia cùng số khác 0." },
                    2: { title: "Giải bài toán lập phương trình", formula: "$S = v \\cdot t;\\, A = N \\cdot t$", desc: "3 bước: Chọn ẩn & ĐK -> Lập PT -> Giải và đối chiếu điều kiện." },
                    3: { title: "Khái niệm hàm số", formula: "$y = f(x);\\, M(x_0; y_0) \\in Oxy$", desc: "Mỗi x chỉ có đúng một y. Mặt phẳng tọa độ Oxy, 4 góc phần tư." },
                    4: { title: "Hàm số bậc nhất & Đồ thị", formula: "$y = ax + b (a \\neq 0)$", desc: "a > 0 đồng biến, a < 0 nghịch biến. Đồ thị là đường thẳng qua (-b/a; 0) và (0; b)." },
                    5: { title: "Vị trí tương đối đường thẳng", formula: "$d \\parallel d' \\iff a = a', b \\neq b'$", desc: "Cắt nhau khi a ≠ a'. Vuông góc khi a · a' = -1." }
                };

                function showC7Topic(id) {
                    const t = c7Topics[id];
                    outEl.innerHTML = `<strong>Chuyên đề: ${t.title}</strong> &nbsp;|&nbsp; <strong>Công thức:</strong> ${t.formula} <br>${t.desc}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#10b981';
                    ctx.beginPath(); ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText('CHƯƠNG VII', w / 2, h / 2 - 5);
                    ctx.fillText('PT & HÀM SỐ', w / 2, h / 2 + 13);
                }

                document.getElementById('btnC7Topic1').addEventListener('click', () => showC7Topic(1));
                document.getElementById('btnC7Topic2').addEventListener('click', () => showC7Topic(2));
                document.getElementById('btnC7Topic3').addEventListener('click', () => showC7Topic(3));
                document.getElementById('btnC7Topic4').addEventListener('click', () => showC7Topic(4));
                document.getElementById('btnC7Topic5').addEventListener('click', () => showC7Topic(5));
                showC7Topic(1);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const btn = document.getElementById('btnSolveInter');
                const outEl = document.getElementById('lab2OutputC7');

                function render() {
                    outEl.innerHTML = `<strong>Xét hệ phương trình:</strong> $\begin{cases} y = 2x - 3 \\ y = -x + 3 \end{cases}$ <br>Hoành độ: $2x - 3 = -x + 3 \\iff 3x = 6 \\iff x = 2$. Tung độ: $y = 2(2) - 3 = 1$. <br>$\\implies$ <strong>Giao điểm duy nhất:</strong> <span style="color:#34d399; font-weight:bold; font-size:1.15rem;">$M(2; 1)$</span>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const ox = w / 2;
                    const oy = h / 2;
                    const scale = 24;

                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(20, oy); ctx.lineTo(w - 20, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, h - 20); ctx.lineTo(ox, 20); ctx.stroke();

                    // y = 2x - 3
                    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2.5;
                    ctx.beginPath(); ctx.moveTo(ox - 4 * scale, oy - (-11) * scale); ctx.lineTo(ox + 4 * scale, oy - (5) * scale); ctx.stroke();

                    // y = -x + 3
                    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2.5;
                    ctx.beginPath(); ctx.moveTo(ox - 4 * scale, oy - (7) * scale); ctx.lineTo(ox + 4 * scale, oy - (-1) * scale); ctx.stroke();

                    // Giao điểm M(2; 1)
                    const mx = ox + 2 * scale;
                    const my = oy - 1 * scale;
                    ctx.fillStyle = '#10b981';
                    ctx.beginPath(); ctx.arc(mx, my, 7, 0, Math.PI * 2); ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText('M(2; 1)', mx + 10, my - 8);
                }

                btn.addEventListener('click', render);
                render();
            
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
