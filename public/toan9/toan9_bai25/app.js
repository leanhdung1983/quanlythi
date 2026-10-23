// ================================================================
// Bài 25: Phép Thử Ngẫu Nhiên & Không Gian Mẫu - TOÁN 9 KNTT
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
  ["\\cap", "<mo>&#8745;</mo>"],
  ["\\frown", "<mo>&#8978;</mo>"],
  ["\\smile", "<mo>&#8979;</mo>"]
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
  s = s.replace(/\\(overparen|wideparen|overgroup|overarc|arc)\{([^{}]+)\}/g, (m, cmd, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#9180;</mo></mover>'));
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
    try {
      renderMathInElement(root, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        macros: {
          '\\overparen': '\\overgroup{#1}',
          '\\wideparen': '\\overgroup{#1}',
          '\\overarc': '\\overgroup{#1}',
          '\\arc': '\\overgroup{#1}'
        },
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {
      console.warn('KaTeX render error, falling back to MathML:', e);
    }
  }

  // MathML Fallback
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.includes('$')) {
      textNodes.push(node);
    }
  }

  textNodes.forEach(tn => {
    const parent = tn.parentNode;
    if (!parent) return;
    const tag = parent.nodeName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'textarea' || tag === 'code') return;
    const span = document.createElement('span');
    span.innerHTML = formatMathText(tn.nodeValue);
    parent.replaceChild(span, tn);
  });
}

// --- 1. WEB AUDIO API SOUND SYSTEM ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration, type = 'sine', gainVal = 0.1) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  playClick() {
    this.playTone(800, 0.05, 'triangle', 0.08);
  }

  playCorrect() {
    if (!this.enabled) return;
    this.playTone(523.25, 0.1, 'sine', 0.12);
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.12), 100);
    setTimeout(() => this.playTone(783.99, 0.25, 'triangle', 0.15), 220);
  }

  playWrong() {
    if (!this.enabled) return;
    this.playTone(320, 0.15, 'sawtooth', 0.1);
    setTimeout(() => this.playTone(240, 0.25, 'sawtooth', 0.1), 120);
  }

  playLevelUp() {
    if (!this.enabled) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.18, 'sine', 0.15), i * 120);
    });
  }

  playFanfare() {
    if (!this.enabled) return;
    const melody = [523, 659, 783, 1046, 783, 1046];
    melody.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.22, 'triangle', 0.18), i * 140);
    });
  }
}

const sound = new SoundController();

// --- 2. GAMIFICATION STATE & LOCALSTORAGE ---
const STORAGE_KEY = 'toan9_toan9_bai25_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nhà Khám Phá Không Gian Mẫu 9',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      appState = Object.assign(appState, parsed);
    }
  } catch (e) {
    console.warn('Could not load state:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn('Could not save state:', e);
  }
}

function updateHUD() {
  const avBtn = document.getElementById('avatarBtn');
  const nameEl = document.getElementById('userNameDisplay');
  const titleEl = document.getElementById('userTitle');
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const soundBtn = document.getElementById('soundToggle');

  if (avBtn) avBtn.textContent = appState.avatar;
  if (nameEl) nameEl.textContent = `${appState.userName} 🌟`;
  if (titleEl) titleEl.textContent = appState.userTitle;
  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (soundBtn) soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';

  // Stars (1-5 dựa trên XP)
  let s = 1;
  if (appState.xp >= 160) s = 5;
  else if (appState.xp >= 120) s = 4;
  else if (appState.xp >= 80) s = 3;
  else if (appState.xp >= 40) s = 2;
  appState.stars = s;
  if (starEl) starEl.textContent = '⭐'.repeat(s) + '☆'.repeat(5 - s);

  // Update Badges UI
  appState.badges.forEach((unlocked, idx) => {
    const el = document.getElementById(`badge-${idx + 1}`);
    if (el) {
      if (unlocked) el.classList.remove('locked');
      else el.classList.add('locked');
    }
  });

  // Update Certificate info
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
    "title": "Câu 1: Không gian mẫu gieo xúc xắc",
    "pts": 20,
    "question": "Không gian mẫu $\\Omega$ của phép thử gieo một con xúc xắc 6 mặt cân đối là:",
    "options": [
      {
        "text": "$\\Omega = \\{1, 2, 3, 4, 5, 6\\}$",
        "correct": true
      },
      {
        "text": "$\\Omega = \\{1, 2, 3, 4, 5\\}$",
        "correct": false
      },
      {
        "text": "$\\Omega = \\{S, N\\}$",
        "correct": false
      },
      {
        "text": "$\\Omega = \\{0, 1, 2, 3, 4, 5, 6\\}$",
        "correct": false
      }
    ],
    "explanation": "Con xúc xắc tiêu chuẩn có 6 mặt đánh số từ 1 đến 6 chấm: $\\Omega = \\{1, 2, 3, 4, 5, 6\\}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Số phần tử của không gian mẫu",
    "pts": 20,
    "question": "Tung hai đồng xu phân biệt. Số phần tử của không gian mẫu $n(\\Omega)$ là:",
    "options": [
      {
        "text": "4",
        "correct": true
      },
      {
        "text": "2",
        "correct": false
      },
      {
        "text": "3",
        "correct": false
      },
      {
        "text": "8",
        "correct": false
      }
    ],
    "explanation": "$\\Omega = \\{SS, SN, NS, NN\\} \\implies n(\\Omega) = 4$."
  },
  {
    "id": 3,
    "title": "Câu 3: Kết quả thuận lợi cho biến cố",
    "pts": 20,
    "question": "Gieo một con xúc xắc. Biến cố $A$: \"Số chấm xuất hiện là số nguyên tố\". Tập hợp các kết quả thuận lợi cho $A$ là:",
    "options": [
      {
        "text": "$A = \\{2, 3, 5\\}$",
        "correct": true
      },
      {
        "text": "$A = \\{1, 2, 3, 5\\}$",
        "correct": false
      },
      {
        "text": "$A = \\{3, 5\\}$",
        "correct": false
      },
      {
        "text": "$A = \\{2, 4, 6\\}$",
        "correct": false
      }
    ],
    "explanation": "Trong các số $1, 2, 3, 4, 5, 6$, các số nguyên tố là 2, 3, 5 (số 1 không phải là số nguyên tố)."
  },
  {
    "id": 4,
    "title": "Câu 4: Biến cố chắc chắn",
    "pts": 20,
    "question": "Trong phép thử gieo một con xúc xắc, biến cố nào sau đây là biến cố chắc chắn?",
    "options": [
      {
        "text": "\"Số chấm xuất hiện nhỏ hơn 7\"",
        "correct": true
      },
      {
        "text": "\"Số chấm xuất hiện là số chẵn\"",
        "correct": false
      },
      {
        "text": "\"Số chấm xuất hiện bằng 6\"",
        "correct": false
      },
      {
        "text": "\"Số chấm xuất hiện lớn hơn 3\"",
        "correct": false
      }
    ],
    "explanation": "Mọi mặt xúc xắc đều có số chấm từ 1 đến 6, đều nhỏ hơn 7. Biến cố này luôn luôn xảy ra với mọi kết quả nên là biến cố chắc chắn."
  },
  {
    "id": 5,
    "title": "Câu 5: Biến cố không thể",
    "pts": 20,
    "question": "Gieo đồng thời hai con xúc xắc. Biến cố nào sau đây là biến cố không thể?",
    "options": [
      {
        "text": "\"Tổng số chấm xuất hiện bằng 13\"",
        "correct": true
      },
      {
        "text": "\"Tổng số chấm xuất hiện bằng 12\"",
        "correct": false
      },
      {
        "text": "\"Tổng số chấm xuất hiện bằng 2\"",
        "correct": false
      },
      {
        "text": "\"Tổng số chấm là số chẵn\"",
        "correct": false
      }
    ],
    "explanation": "Tổng số chấm lớn nhất khi gieo 2 con xúc xắc là $6 + 6 = 12$. Do đó tổng không bao giờ có thể bằng 13 (biến cố không thể)."
  },
  {
    "id": 6,
    "title": "Câu 6: Phép thử chọn thẻ từ hộp",
    "pts": 20,
    "question": "Một hộp chứa 5 tấm thẻ đánh số từ 1 đến 5. Rút ngẫu nhiên lần lượt 2 thẻ không hoàn lại. Số phần tử của không gian mẫu là:",
    "options": [
      {
        "text": "20",
        "correct": true
      },
      {
        "text": "25",
        "correct": false
      },
      {
        "text": "10",
        "correct": false
      },
      {
        "text": "15",
        "correct": false
      }
    ],
    "explanation": "Thẻ thứ nhất có 5 cách chọn, thẻ thứ hai có 4 cách chọn (không hoàn lại). Số phần tử $n(\\Omega) = 5 \\times 4 = 20$."
  },
  {
    "id": 7,
    "title": "Câu 7: Kết quả đồng khả năng",
    "pts": 20,
    "question": "Hai kết quả được gọi là đồng khả năng nếu:",
    "options": [
      {
        "text": "Khả năng xuất hiện của chúng là như nhau",
        "correct": true
      },
      {
        "text": "Chúng cùng có số chấm bằng nhau",
        "correct": false
      },
      {
        "text": "Chúng xảy ra đồng thời",
        "correct": false
      },
      {
        "text": "Chúng không bao giờ xảy ra",
        "correct": false
      }
    ],
    "explanation": "Khái niệm chuẩn: Các kết quả có khả năng xảy ra như nhau được gọi là các kết quả đồng khả năng."
  },
  {
    "id": 8,
    "title": "Câu 8: Biến cố hai đồng xu xuất hiện mặt giống nhau",
    "pts": 20,
    "question": "Tung hai đồng xu phân biệt. Biến cố $B$: \"Hai đồng xu xuất hiện cùng mặt\". Số kết quả thuận lợi cho $B$ là:",
    "options": [
      {
        "text": "2",
        "correct": true
      },
      {
        "text": "1",
        "correct": false
      },
      {
        "text": "3",
        "correct": false
      },
      {
        "text": "4",
        "correct": false
      }
    ],
    "explanation": "Các kết quả cùng mặt là: $\\{SS, NN\\} \\implies n(B) = 2$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bốc bóng trong túi",
    "pts": 20,
    "question": "Trong túi có 3 viên bi xanh, 2 viên bi đỏ (các viên bi có kích thước giống nhau). Lấy ngẫu nhiên 1 viên bi. Số phần tử của không gian mẫu là:",
    "options": [
      {
        "text": "5",
        "correct": true
      },
      {
        "text": "2",
        "correct": false
      },
      {
        "text": "6",
        "correct": false
      },
      {
        "text": "3",
        "correct": false
      }
    ],
    "explanation": "Mỗi viên bi là một kết quả có thể xảy ra, tổng cộng có $3 + 2 = 5$ viên bi nên $n(\\Omega) = 5$."
  },
  {
    "id": 10,
    "title": "Câu 10: Biến cố đối",
    "pts": 20,
    "question": "Cho biến cố $A$: \"Gieo được mặt có số chấm lớn hơn 4\". Biến cố đối $\\overline{A}$ là:",
    "options": [
      {
        "text": "\"Số chấm xuất hiện nhỏ hơn hoặc bằng 4\"",
        "correct": true
      },
      {
        "text": "\"Số chấm xuất hiện nhỏ hơn 4\"",
        "correct": false
      },
      {
        "text": "\"Số chấm xuất hiện bằng 5\"",
        "correct": false
      },
      {
        "text": "\"Số chấm xuất hiện là số lẻ\"",
        "correct": false
      }
    ],
    "explanation": "Phủ định của \"lớn hơn 4\" là \"nhỏ hơn hoặc bằng 4\" (tức các mặt 1, 2, 3, 4)."
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

      if (target === 'theory') unlockBadge(0);
      if (target === 'labs') {
        unlockBadge(1);
        initLabs();
      }
    });
  });
}

function initAvatarModal() {
  const btn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const closeBtn = document.getElementById('btnCloseModal');
  const choices = document.querySelectorAll('.avatar-choice');

  if (btn && modal) {
    btn.addEventListener('click', () => {
      sound.playClick();
      modal.style.display = 'flex';
    });
  }

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
    
                const c1 = document.getElementById('labCanvas1');
                const ctx = c1.getContext('2d');
                const btnRoll = document.getElementById('btnRollDice1');
                const btnRoll10 = document.getElementById('btnRoll10');
                const btnReset = document.getElementById('btnResetDice');
                const out1 = document.getElementById('lab1Output');

                let counts = [0, 0, 0, 0, 0, 0]; // 1 to 6
                let totalRolls = 0;
                let lastResult = 1;

                function drawDiceFace(face, x, y, size) {
                    ctx.fillStyle = '#ffffff';
                    ctx.beginPath();
                    ctx.roundRect(x, y, size, size, 14);
                    ctx.fill();
                    ctx.strokeStyle = '#cbd5e1';
                    ctx.lineWidth = 3; ctx.stroke();

                    ctx.fillStyle = '#0f172a';
                    const r = 5;
                    const cx = x + size / 2;
                    const cy = y + size / 2;
                    const d = size / 4;

                    const dots = {
                        1: [[0, 0]],
                        2: [[-d, -d], [d, d]],
                        3: [[-d, -d], [0, 0], [d, d]],
                        4: [[-d, -d], [d, -d], [-d, d], [d, d]],
                        5: [[-d, -d], [d, -d], [0, 0], [-d, d], [d, d]],
                        6: [[-d, -d], [d, -d], [-d, 0], [d, 0], [-d, d], [d, d]]
                    };

                    dots[face].forEach(([dx, dy]) => {
                        ctx.beginPath();
                        ctx.arc(cx + dx, cy + dy, r, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }

                function renderDiceLab() {
                    const cw = c1.width;
                    const ch = c1.height;
                    ctx.clearRect(0, 0, cw, ch);

                    // Draw Current Dice
                    drawDiceFace(lastResult, 60, 90, 110);

                    ctx.fillStyle = '#f8fafc';
                    ctx.font = 'bold 15px sans-serif';
                    ctx.fillText(`Kết quả vừa gieo: ${lastResult} chấm`, 45, 235);
                    ctx.font = '12px sans-serif';
                    ctx.fillStyle = '#94a3b8';
                    ctx.fillText(`Tổng số lần gieo: ${totalRolls}`, 65, 260);

                    // Draw Frequency Bar Chart on right
                    const chartX = 240;
                    const chartW = 320;
                    const maxCount = Math.max(5, ...counts) + 2;

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px sans-serif';
                    ctx.fillText('Thống kê kết quả không gian mẫu Ω = {1, 2, 3, 4, 5, 6}:', chartX, 45);

                    for (let f = 1; f <= 6; f++) {
                        const by = 60 + (f - 1) * 38;
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '12px sans-serif';
                        ctx.fillText(`Mặt ${f}:`, chartX, by + 18);

                        const cnt = counts[f - 1];
                        const barW = (cnt / maxCount) * 200;

                        ctx.fillStyle = f % 2 === 0 ? '#38bdf8' : '#34d399';
                        ctx.beginPath();
                        ctx.roundRect(chartX + 60, by + 4, barW, 20, 4);
                        ctx.fill();

                        ctx.fillStyle = '#ffffff';
                        ctx.fillText(`${cnt} lần`, chartX + 70 + barW, by + 18);
                    }

                    const isEven = lastResult % 2 === 0;
                    out1.innerHTML = `<strong>Không gian mẫu:</strong> $\Omega = \\{1, 2, 3, 4, 5, 6\\}$ ($n(\Omega) = 6$). Kết quả <strong>${lastResult}</strong> là một phần tử của $\Omega$ (${isEven ? 'thuộc biến cố "Mặt chẵn"' : 'thuộc biến cố "Mặt lẻ"'}).`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                function rollOnce() {
                    lastResult = Math.floor(Math.random() * 6) + 1;
                    counts[lastResult - 1]++;
                    totalRolls++;
                    renderDiceLab();
                }

                btnRoll.addEventListener('click', rollOnce);
                btnRoll10.addEventListener('click', () => {
                    for (let i = 0; i < 10; i++) rollOnce();
                });
                btnReset.addEventListener('click', () => {
                    counts = [0, 0, 0, 0, 0, 0];
                    totalRolls = 0;
                    lastResult = 1;
                    renderDiceLab();
                });

                renderDiceLab();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const btnFlip = document.getElementById('btnFlipCoins');
                const btnFlip50 = document.getElementById('btnFlip50');
                const out2 = document.getElementById('lab2Output');

                let coin1 = 'S';
                let coin2 = 'N';
                let stats = { SS: 0, SN: 0, NS: 0, NN: 0 };
                let totalFlips = 0;

                function renderCoinsLab() {
                    const cw = c2.width;
                    const ch = c2.height;
                    ctx2.clearRect(0, 0, cw, ch);

                    // Draw 2 Coins
                    const cRadius = 40;
                    // Coin 1
                    ctx2.fillStyle = coin1 === 'S' ? '#f59e0b' : '#3b82f6';
                    ctx2.beginPath(); ctx2.arc(80, 100, cRadius, 0, Math.PI * 2); ctx2.fill();
                    ctx2.strokeStyle = '#ffffff'; ctx2.lineWidth = 3; ctx2.stroke();
                    ctx2.fillStyle = '#ffffff'; ctx2.font = 'bold 24px sans-serif';
                    ctx2.fillText(coin1, 72, 108);

                    ctx2.font = '12px sans-serif';
                    ctx2.fillText('Đồng xu 1', 55, 160);

                    // Coin 2
                    ctx2.fillStyle = coin2 === 'S' ? '#f59e0b' : '#3b82f6';
                    ctx2.beginPath(); ctx2.arc(180, 100, cRadius, 0, Math.PI * 2); ctx2.fill();
                    ctx2.strokeStyle = '#ffffff'; ctx2.lineWidth = 3; ctx2.stroke();
                    ctx2.fillStyle = '#ffffff'; ctx2.font = 'bold 24px sans-serif';
                    ctx2.fillText(coin2, 172, 108);

                    ctx2.font = '12px sans-serif';
                    ctx2.fillText('Đồng xu 2', 155, 160);

                    // Matrix 2x2 of Sample Space on the right
                    const mx = 310;
                    const my = 40;
                    const cellW = 120;
                    const cellH = 55;

                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 13px sans-serif';
                    ctx2.fillText('Bảng không gian mẫu Ω = {(S,S), (S,N), (N,S), (N,N)}:', mx, my - 12);

                    const cells = [
                        { key: 'SS', label: '(S; S)', r: 0, c: 0 },
                        { key: 'SN', label: '(S; N)', r: 0, c: 1 },
                        { key: 'NS', label: '(N; S)', r: 1, c: 0 },
                        { key: 'NN', label: '(N; N)', r: 1, c: 1 }
                    ];

                    const curKey = coin1 + coin2;

                    cells.forEach(cell => {
                        const px = mx + cell.c * cellW;
                        const py = my + cell.r * cellH;
                        const isCur = cell.key === curKey;

                        ctx2.fillStyle = isCur ? '#10b981' : '#1e293b';
                        ctx2.fillRect(px, py, cellW - 4, cellH - 4);
                        ctx2.strokeStyle = isCur ? '#34d399' : '#475569';
                        ctx2.lineWidth = isCur ? 3 : 1;
                        ctx2.strokeRect(px, py, cellW - 4, cellH - 4);

                        ctx2.fillStyle = isCur ? '#ffffff' : '#cbd5e1';
                        ctx2.font = isCur ? 'bold 15px sans-serif' : '13px sans-serif';
                        ctx2.fillText(cell.label, px + 15, py + 25);

                        ctx2.font = '11px sans-serif';
                        ctx2.fillStyle = isCur ? '#f8fafc' : '#94a3b8';
                        ctx2.fillText(`${stats[cell.key]} lần`, px + 15, py + 42);
                    });

                    out2.innerHTML = `<strong>Kết quả hiện tại:</strong> $(${coin1}; ${coin2})$ | <strong>Tổng số lần tung:</strong> $${totalFlips}$ lần. Không gian mẫu có đúng $n(\Omega) = 4$ kết quả đồng khả năng.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                function flip() {
                    coin1 = Math.random() < 0.5 ? 'S' : 'N';
                    coin2 = Math.random() < 0.5 ? 'S' : 'N';
                    stats[coin1 + coin2]++;
                    totalFlips++;
                    renderCoinsLab();
                }

                btnFlip.addEventListener('click', flip);
                btnFlip50.addEventListener('click', () => {
                    for (let i = 0; i < 50; i++) flip();
                });

                renderCoinsLab();
            
    if (typeof initLab2 === 'function') initLab2();
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
