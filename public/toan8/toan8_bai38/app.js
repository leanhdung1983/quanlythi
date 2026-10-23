// ================================================================
// BÀI 38: HÌNH CHÓP TAM GIÁC ĐỀU - TOÁN 8 KNTT
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
  userTitle: 'Kiến Trúc Sư Chóp Tam Giác 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai38_state';

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
    "title": "Câu 1: Nhận diện mặt bên hình chóp tam giác đều",
    "pts": 20,
    "question": "Các mặt bên của hình chóp tam giác đều là những hình gì?",
    "options": [
      {
        "text": "Các tam giác cân bằng nhau",
        "correct": true
      },
      {
        "text": "Các tam giác đều",
        "correct": false
      },
      {
        "text": "Các tam giác vuông",
        "correct": false
      },
      {
        "text": "Các hình chữ nhật",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa SGK, hình chóp tam giác đều có mặt đáy là tam giác đều và các mặt bên là các tam giác cân bằng nhau có chung đỉnh."
  },
  {
    "id": 2,
    "title": "Câu 2: Công thức tính diện tích xung quanh",
    "pts": 20,
    "question": "Công thức tính diện tích xung quanh $S_{xq}$ của hình chóp tam giác đều là:",
    "options": [
      {
        "text": "$S_{xq} = p \\cdot d$",
        "correct": true
      },
      {
        "text": "$S_{xq} = 2p \\cdot d$",
        "correct": false
      },
      {
        "text": "$S_{xq} = \\frac{1}{3} p \\cdot d$",
        "correct": false
      },
      {
        "text": "$S_{xq} = p \\cdot h$",
        "correct": false
      }
    ],
    "explanation": "Diện tích xung quanh của hình chóp tam giác đều bằng tích của nửa chu vi đáy ($p$) với trung đoạn ($d$): $S_{xq} = p \\cdot d$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính diện tích xung quanh hình chóp tam giác đều",
    "pts": 20,
    "question": "Một hình chóp tam giác đều có cạnh đáy bằng $8\\text{ cm}$, trung đoạn bằng $10\\text{ cm}$. Diện tích xung quanh của hình chóp đó là:",
    "options": [
      {
        "text": "$120\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$240\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$80\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$40\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Chu vi đáy là $3 \\times 8 = 24\\text{ cm} \\implies p = 12\\text{ cm}$. Diện tích xung quanh: $S_{xq} = p \\cdot d = 12 \\times 10 = 120\\text{ cm}^2$."
  },
  {
    "id": 4,
    "title": "Câu 4: Công thức tính thể tích hình chóp tam giác đều",
    "pts": 20,
    "question": "Thể tích của hình chóp tam giác đều có diện tích đáy $S$ và chiều cao $h$ là:",
    "options": [
      {
        "text": "$V = \\frac{1}{3} S \\cdot h$",
        "correct": true
      },
      {
        "text": "$V = S \\cdot h$",
        "correct": false
      },
      {
        "text": "$V = \\frac{1}{2} S \\cdot h$",
        "correct": false
      },
      {
        "text": "$V = 3 S \\cdot h$",
        "correct": false
      }
    ],
    "explanation": "Thể tích hình chóp bằng một phần ba tích diện tích đáy với chiều cao: $V = \\frac{1}{3} S \\cdot h$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tính thể tích hình chóp",
    "pts": 20,
    "question": "Một hình chóp tam giác đều có diện tích đáy bằng $30\\text{ cm}^2$ và chiều cao bằng $12\\text{ cm}$. Thể tích của hình chóp đó là:",
    "options": [
      {
        "text": "$120\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$360\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$180\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$60\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng công thức: $V = \\frac{1}{3} S \\cdot h = \\frac{1}{3} \\times 30 \\times 12 = 120\\text{ cm}^3$."
  },
  {
    "id": 6,
    "title": "Câu 6: Phân biệt chiều cao h và trung đoạn d",
    "pts": 20,
    "question": "Khẳng định nào sau đây là <strong>đúng</strong> về chiều cao $h$ và trung đoạn $d$ của hình chóp đều?",
    "options": [
      {
        "text": "Trung đoạn $d$ luôn lớn hơn chiều cao $h$ ($d > h$)",
        "correct": true
      },
      {
        "text": "Trung đoạn $d$ luôn bằng chiều cao $h$ ($d = h$)",
        "correct": false
      },
      {
        "text": "Trung đoạn $d$ luôn nhỏ hơn chiều cao $h$ ($d < h$)",
        "correct": false
      },
      {
        "text": "Không thể so sánh được",
        "correct": false
      }
    ],
    "explanation": "Xét tam giác vuông $SOI$ vuông tại $O$, ta có trung đoạn $SI = d$ là cạnh huyền, chiều cao $SO = h$ là cạnh góc vuông. Cạnh huyền luôn lớn hơn cạnh góc vuông nên $d > h$."
  },
  {
    "id": 7,
    "title": "Câu 7: Số đỉnh, cạnh, mặt của hình chóp tam giác đều",
    "pts": 20,
    "question": "Hình chóp tam giác đều có bao nhiêu mặt và bao nhiêu cạnh?",
    "options": [
      {
        "text": "$4\\text{ mặt và } 6\\text{ cạnh}$",
        "correct": true
      },
      {
        "text": "$4\\text{ mặt và } 4\\text{ cạnh}$",
        "correct": false
      },
      {
        "text": "$5\\text{ mặt và } 8\\text{ cạnh}$",
        "correct": false
      },
      {
        "text": "$3\\text{ mặt và } 6\\text{ cạnh}$",
        "correct": false
      }
    ],
    "explanation": "Hình chóp tam giác đều có 1 mặt đáy + 3 mặt bên = 4 mặt; có 3 cạnh đáy + 3 cạnh bên = 6 cạnh; có 4 đỉnh."
  },
  {
    "id": 8,
    "title": "Câu 8: Tính diện tích toàn phần",
    "pts": 20,
    "question": "Một hình chóp tam giác đều có diện tích xung quanh là $60\\text{ cm}^2$ và diện tích đáy là $15\\text{ cm}^2$. Diện tích toàn phần của hình chóp là:",
    "options": [
      {
        "text": "$75\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$45\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$90\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$120\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Diện tích toàn phần $S_{tp} = S_{xq} + S_{đáy} = 60 + 15 = 75\\text{ cm}^2$."
  },
  {
    "id": 9,
    "title": "Câu 9: Ứng dụng thực tế hộp quà hình chóp tam giác đều",
    "pts": 20,
    "question": "Người ta làm một hộp quà hình chóp tam giác đều bằng bìa cứng (không kể nắp đáy). Biết cạnh đáy bằng $10\\text{ cm}$, trung đoạn bằng $12\\text{ cm}$. Diện tích bìa cần dùng để làm các mặt bên là:",
    "options": [
      {
        "text": "$180\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$360\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$120\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$60\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Nửa chu vi đáy $p = \\frac{3 \\times 10}{2} = 15\\text{ cm}$. Diện tích bìa các mặt bên là diện tích xung quanh: $S_{xq} = 15 \\times 12 = 180\\text{ cm}^2$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tỉ số thể tích khi chiều cao tăng gấp đôi",
    "pts": 20,
    "question": "Nếu giữ nguyên diện tích đáy và tăng chiều cao của hình chóp tam giác đều lên gấp đôi thì thể tích của hình chóp sẽ:",
    "options": [
      {
        "text": "Tăng lên gấp đôi",
        "correct": true
      },
      {
        "text": "Tăng lên 4 lần",
        "correct": false
      },
      {
        "text": "Tăng lên 8 lần",
        "correct": false
      },
      {
        "text": "Không thay đổi",
        "correct": false
      }
    ],
    "explanation": "Vì thể tích $V = \\frac{1}{3} S \\cdot h$ tỉ lệ thuận bậc nhất với chiều cao $h$, nên khi $h$ tăng gấp 2 lần thì $V$ cũng tăng gấp 2 lần."
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
                const sA = document.getElementById('sliderA38');
                const sD = document.getElementById('sliderD38');
                const valA = document.getElementById('valA38');
                const valD = document.getElementById('valD38');
                const outEl = document.getElementById('lab1Output38');

                function update() {
                    const a = parseInt(sA.value);
                    const d = parseInt(sD.value);
                    valA.textContent = a;
                    valD.textContent = d;

                    const p = (3 * a) / 2;
                    const Sxq = p * d;
                    const Sday = (a * a * Math.sqrt(3) / 4).toFixed(1);

                    outEl.innerHTML = `<strong>Nửa chu vi đáy:</strong> $p = \\frac{3 \\cdot ${a}}{2} = ${p}\\text{ cm}$ &nbsp;|&nbsp; <strong>Trung đoạn:</strong> $d = ${d}\\text{ cm}$ <br><strong>Diện tích xung quanh:</strong> <strong style="color:#34d399; font-size:1.15rem;">$S_{xq} = p \\cdot d = ${p} \\cdot ${d} = ${Sxq}\\text{ cm}^2$</strong> &nbsp;|&nbsp; <strong>Diện tích đáy:</strong> $\\approx ${Sday}\\text{ cm}^2$`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const cx = w / 2;
                    const sx = cx, sy = 40;
                    const ax = cx - a * 12, ay = h - 60;
                    const bx = cx + a * 12, by = h - 60;
                    const c_back_x = cx + 20, c_back_y = h - 110;

                    // Các cạnh nét đứt đáy và sau
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 1.5;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(c_back_x, c_back_y);
                    ctx.lineTo(bx, by);
                    ctx.moveTo(sx, sy); ctx.lineTo(c_back_x, c_back_y);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Các cạnh liền trước
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(bx, by);
                    ctx.lineTo(sx, sy); ctx.closePath();
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.moveTo(sx, sy); ctx.lineTo(ax, ay);
                    ctx.stroke();

                    // Trung đoạn SI
                    const mx = (ax + bx) / 2, my = ay;
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(mx, my); ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText('S (Đỉnh)', sx - 20, sy - 5);
                    ctx.fillText('A', ax - 15, ay + 15);
                    ctx.fillText('B', bx + 5, by + 15);
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillText(`d = ${d}`, mx + 8, (sy + my) / 2);
                }

                [sA, sD].forEach(el => el.addEventListener('input', update));
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const btn = document.getElementById('btnToggleNet');
                const outEl = document.getElementById('lab2Output38');

                let isOpen = true;

                function draw() {
                    outEl.innerHTML = isOpen ?
                        `<strong>Lưới trải phẳng (Net):</strong> Gồm 1 đáy tam giác đều ở giữa và 3 mặt bên tam giác cân gắn vào 3 cạnh đáy. Diện tích toàn phần bằng tổng diện tích 4 hình này.` :
                        `<strong>Khối chóp 3D:</strong> Khi gập 3 mặt bên lên sao cho 3 đỉnh chập vào nhau tại $S$, ta thu được hình chóp tam giác đều.`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const cx = w / 2, cy = h / 2;
                    const r = 50;

                    if (isOpen) {
                        // Đáy trung tâm
                        ctx.fillStyle = 'rgba(6, 182, 212, 0.3)';
                        ctx.strokeStyle = '#06b6d4';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(cx, cy - r);
                        ctx.lineTo(cx + r * Math.sqrt(3) / 2, cy + r / 2);
                        ctx.lineTo(cx - r * Math.sqrt(3) / 2, cy + r / 2);
                        ctx.closePath();
                        ctx.fill();
                        ctx.stroke();

                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 12px Segoe UI';
                        ctx.textAlign = 'center';
                        ctx.fillText('ĐÁY', cx, cy + 5);

                        // 3 mặt bên mở bung
                        ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
                        ctx.strokeStyle = '#f59e0b';
                        // Cánh dưới
                        ctx.beginPath();
                        ctx.moveTo(cx - r * Math.sqrt(3) / 2, cy + r / 2);
                        ctx.lineTo(cx + r * Math.sqrt(3) / 2, cy + r / 2);
                        ctx.lineTo(cx, cy + r / 2 + 65);
                        ctx.closePath();
                        ctx.fill(); ctx.stroke();

                        // Cánh trái
                        ctx.beginPath();
                        ctx.moveTo(cx, cy - r);
                        ctx.lineTo(cx - r * Math.sqrt(3) / 2, cy + r / 2);
                        ctx.lineTo(cx - 75, cy - 35);
                        ctx.closePath();
                        ctx.fill(); ctx.stroke();

                        // Cánh phải
                        ctx.beginPath();
                        ctx.moveTo(cx, cy - r);
                        ctx.lineTo(cx + r * Math.sqrt(3) / 2, cy + r / 2);
                        ctx.lineTo(cx + 75, cy - 35);
                        ctx.closePath();
                        ctx.fill(); ctx.stroke();
                    } else {
                        // Vẽ khối 3D gập
                        ctx.strokeStyle = '#38bdf8';
                        ctx.lineWidth = 2.5;
                        ctx.beginPath();
                        ctx.moveTo(cx - 70, cy + 40);
                        ctx.lineTo(cx + 70, cy + 40);
                        ctx.lineTo(cx, cy - 70);
                        ctx.closePath();
                        ctx.stroke();

                        ctx.beginPath(); ctx.moveTo(cx, cy - 70); ctx.lineTo(cx + 10, cy + 10); ctx.stroke();
                    }
                }

                btn.addEventListener('click', () => {
                    isOpen = !isOpen;
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
