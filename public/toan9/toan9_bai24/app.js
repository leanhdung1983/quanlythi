// ================================================================
// Bài 24: Bảng Tần Số, Tần Số Tương Đối Ghép Nhóm & Biểu Đồ - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai24_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Dữ Liệu Ghép Nhóm 9',
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
    "title": "Câu 1: Giá trị đại diện của nhóm",
    "pts": 20,
    "question": "Giá trị đại diện của nhóm số liệu $[20; 30)$ là:",
    "options": [
      {
        "text": "25",
        "correct": true
      },
      {
        "text": "20",
        "correct": false
      },
      {
        "text": "30",
        "correct": false
      },
      {
        "text": "10",
        "correct": false
      }
    ],
    "explanation": "Giá trị đại diện là trung điểm của hai đầu mút: $\\frac{20 + 30}{2} = 25$."
  },
  {
    "id": 2,
    "title": "Câu 2: Độ dài của nhóm",
    "pts": 20,
    "question": "Độ dài của nhóm $[40; 60)$ là:",
    "options": [
      {
        "text": "20",
        "correct": true
      },
      {
        "text": "50",
        "correct": false
      },
      {
        "text": "40",
        "correct": false
      },
      {
        "text": "60",
        "correct": false
      }
    ],
    "explanation": "Độ dài của nhóm bằng hiệu hai đầu mút: $60 - 40 = 20$."
  },
  {
    "id": 3,
    "title": "Câu 3: Quy tắc xếp giá trị vào nhóm",
    "pts": 20,
    "question": "Giá trị $x = 50$ thuộc vào nhóm nào trong các nhóm sau?",
    "options": [
      {
        "text": "$[50; 60)$",
        "correct": true
      },
      {
        "text": "$[40; 50)$",
        "correct": false
      },
      {
        "text": "$[30; 40)$",
        "correct": false
      },
      {
        "text": "$[60; 70)$",
        "correct": false
      }
    ],
    "explanation": "Nửa khoảng $[50; 60)$ lấy đầu mút trái 50 và không lấy đầu mút phải 60. Do đó $x = 50 \\in [50; 60)$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính tần số tương đối ghép nhóm",
    "pts": 20,
    "question": "Khảo sát thời gian sử dụng Internet trong ngày của 80 học sinh thu được bảng ghép nhóm sau:<div class=\"quiz-table-wrap\"><table class=\"quiz-table\"><thead><tr><th>Thời gian (phút)</th><th>$[0; 30)$</th><th>$[30; 60)$</th><th>$[60; 90)$</th><th>$[90; 120)$</th></tr></thead><tbody><tr><td>Tần số ($m_i$)</td><td>12</td><td>28</td><td>24</td><td>16</td></tr></tbody></table></div>Tần số tương đối của nhóm $[30; 60)$ là:",
    "options": [
      {
        "text": "35%",
        "correct": true
      },
      {
        "text": "28%",
        "correct": false
      },
      {
        "text": "30%",
        "correct": false
      },
      {
        "text": "40%",
        "correct": false
      }
    ],
    "explanation": "$f = \\frac{28}{80} \\times 100\\% = \\frac{7}{20} \\times 100\\% = 35\\%$."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhóm có tần số cao nhất",
    "pts": 20,
    "question": "Trong bảng số liệu ở Câu 4, nhóm có tần số cao nhất là:",
    "options": [
      {
        "text": "$[30; 60)$",
        "correct": true
      },
      {
        "text": "$[60; 90)$",
        "correct": false
      },
      {
        "text": "$[90; 120)$",
        "correct": false
      },
      {
        "text": "$[0; 30)$",
        "correct": false
      }
    ],
    "explanation": "Nhóm $[30; 60)$ có tần số lớn nhất là 28 học sinh."
  },
  {
    "id": 6,
    "title": "Câu 6: Tỉ lệ học sinh sử dụng Internet từ 60 phút trở lên",
    "pts": 20,
    "question": "Ở bảng số liệu Câu 4, số học sinh sử dụng Internet từ 60 phút trở lên chiếm bao nhiêu phần trăm?",
    "options": [
      {
        "text": "50%",
        "correct": true
      },
      {
        "text": "40%",
        "correct": false
      },
      {
        "text": "60%",
        "correct": false
      },
      {
        "text": "30%",
        "correct": false
      }
    ],
    "explanation": "Số học sinh dùng từ 60 phút trở lên gồm nhóm $[60; 90)$ và $[90; 120)$: $24 + 16 = 40$ bạn. Tỉ lệ: $\\frac{40}{80} \\times 100\\% = 50\\%$."
  },
  {
    "id": 7,
    "title": "Câu 7: Điểm đặc trưng của Histogram",
    "pts": 20,
    "question": "Điểm khác biệt trực quan cơ bản giữa biểu đồ cột ghép nhóm (Histogram) và biểu đồ cột thông thường là:",
    "options": [
      {
        "text": "Các cột ghép nhóm đứng sát liền nhau không có khoảng trống",
        "correct": true
      },
      {
        "text": "Các cột có màu đen trắng",
        "correct": false
      },
      {
        "text": "Chiều cao các cột luôn bằng nhau",
        "correct": false
      },
      {
        "text": "Không có trục tung",
        "correct": false
      }
    ],
    "explanation": "Vì các nhóm là các khoảng số liên tục nối tiếp nhau $[a_1; a_2), [a_2; a_3), \\dots$ nên các cột trong Histogram được vẽ đứng sát liền kề nhau."
  },
  {
    "id": 8,
    "title": "Câu 8: Tọa độ điểm vẽ biểu đồ đoạn thẳng ghép nhóm",
    "pts": 20,
    "question": "Để vẽ biểu đồ đoạn thẳng ghép nhóm cho nhóm $[10; 20)$ có tần số bằng 8, điểm được đánh dấu trên mặt phẳng tọa độ có tọa độ là:",
    "options": [
      {
        "text": "$(15; 8)$",
        "correct": true
      },
      {
        "text": "$(10; 8)$",
        "correct": false
      },
      {
        "text": "$(20; 8)$",
        "correct": false
      },
      {
        "text": "$(8; 15)$",
        "correct": false
      }
    ],
    "explanation": "Hoành độ là giá trị đại diện của nhóm: $\\frac{10 + 20}{2} = 15$, tung độ là tần số $8$. Điểm là $(15; 8)$."
  },
  {
    "id": 9,
    "title": "Câu 9: Ước lượng số trung bình từ bảng ghép nhóm",
    "pts": 20,
    "question": "Để ước lượng số trung bình $\\bar{x}$ của mẫu số liệu ghép nhóm, người ta dùng công thức nào?",
    "options": [
      {
        "text": "$\\bar{x} = \\frac{m_1 x_1 + m_2 x_2 + \\dots + m_k x_k}{N}$ (với $x_i$ là giá trị đại diện)",
        "correct": true
      },
      {
        "text": "$\\bar{x} = \\frac{x_1 + x_2 + \\dots + x_k}{k}$",
        "correct": false
      },
      {
        "text": "$\\bar{x} = \\frac{m_1 + m_2 + \\dots + m_k}{N}$",
        "correct": false
      },
      {
        "text": "$\\bar{x} = \\frac{N}{k}$",
        "correct": false
      }
    ],
    "explanation": "Công thức chuẩn ước lượng số trung bình mẫu ghép nhóm: nhân tần số mỗi nhóm với giá trị đại diện của nhóm đó, rồi chia cho tổng kích thước mẫu $N$."
  },
  {
    "id": 10,
    "title": "Câu 10: Chia nhóm dữ liệu hợp lý",
    "pts": 20,
    "question": "Khi ghép nhóm một mẫu dữ liệu có giá trị nhỏ nhất là 152 và lớn nhất là 188 (độ chênh lệch 36), nếu chia thành 4 nhóm có độ dài bằng nhau thì độ dài mỗi nhóm là:",
    "options": [
      {
        "text": "9 hoặc 10",
        "correct": true
      },
      {
        "text": "4",
        "correct": false
      },
      {
        "text": "36",
        "correct": false
      },
      {
        "text": "15",
        "correct": false
      }
    ],
    "explanation": "Độ dài mỗi nhóm thường chọn là $\\frac{188 - 152}{4} = \\frac{36}{4} = 9$ (hoặc làm tròn lên 10 để bao trùm thoải mái dữ liệu)."
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
                const g1 = document.getElementById('grp1');
                const g2 = document.getElementById('grp2');
                const g3 = document.getElementById('grp3');
                const g4 = document.getElementById('grp4');
                const out1 = document.getElementById('lab1Output');

                function drawHistogram() {
                    const m1 = Math.max(0, parseInt(g1.value) || 0);
                    const m2 = Math.max(0, parseInt(g2.value) || 0);
                    const m3 = Math.max(0, parseInt(g3.value) || 0);
                    const m4 = Math.max(0, parseInt(g4.value) || 0);

                    const data = [
                        { range: '[0; 30)', val: m1, color: '#38bdf8' },
                        { range: '[30; 60)', val: m2, color: '#34d399' },
                        { range: '[60; 90)', val: m3, color: '#fbbf24' },
                        { range: '[90; 120)', val: m4, color: '#f43f5e' }
                    ];

                    const N = m1 + m2 + m3 + m4;
                    const maxM = Math.max(10, m1, m2, m3, m4) + 4;

                    const cw = c1.width;
                    const ch = c1.height;
                    const padL = 60;
                    const padB = 50;
                    const chartH = ch - padB - 40;
                    const colW = 105; // Cột ghép nhóm đứng sát nhau
                    const startX = padL + 20;

                    ctx.clearRect(0, 0, cw, ch);

                    // Axes
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(padL, 30);
                    ctx.lineTo(padL, ch - padB);
                    ctx.lineTo(cw - 30, ch - padB);
                    ctx.stroke();

                    // Grid Y
                    ctx.strokeStyle = '#1e293b';
                    for (let y = 0; y <= maxM; y += 5) {
                        const py = (ch - padB) - (y / maxM) * chartH;
                        ctx.beginPath(); ctx.moveTo(padL, py); ctx.lineTo(cw - 30, py); ctx.stroke();
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '11px sans-serif';
                        ctx.fillText(y, padL - 24, py + 4);
                    }

                    // Adjacent Bars (Histogram)
                    data.forEach((d, i) => {
                        const px = startX + i * colW;
                        const barH = (d.val / maxM) * chartH;
                        const py = (ch - padB) - barH;

                        ctx.fillStyle = d.color;
                        ctx.fillRect(px, py, colW, barH);
                        ctx.strokeStyle = '#0f172a';
                        ctx.lineWidth = 1.5;
                        ctx.strokeRect(px, py, colW, barH);

                        // Value
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 13px sans-serif';
                        ctx.fillText(d.val, px + colW / 2 - 8, py - 6);

                        // Range label
                        ctx.fillStyle = '#cbd5e1';
                        ctx.font = '11px sans-serif';
                        ctx.fillText(d.range, px + 20, ch - padB + 20);
                    });

                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '12px sans-serif';
                    ctx.fillText('Tần số (m)', padL - 10, 20);
                    ctx.fillText('Khoảng thời gian (phút)', cw - 150, ch - padB + 40);

                    out1.innerHTML = `<strong>Tổng kích thước mẫu:</strong> $N = ${N}$ học sinh. Nhóm tập trung nhiều nhất là <strong>[60; 90)</strong> phút (${m3} bạn, chiếm ${N > 0 ? ((m3/N)*100).toFixed(1) : 0}%).`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                [g1, g2, g3, g4].forEach(el => el.addEventListener('input', drawHistogram));
                drawHistogram();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const out2 = document.getElementById('lab2Output');

                function drawGroupedLine() {
                    const data = [
                        { mid: 15, m: 5, range: '[0; 30)' },
                        { mid: 45, m: 15, range: '[30; 60)' },
                        { mid: 75, m: 18, range: '[60; 90)' },
                        { mid: 105, m: 12, range: '[90; 120)' }
                    ];

                    const cw = c2.width;
                    const ch = c2.height;
                    const padL = 60;
                    const padB = 50;
                    const chartH = ch - padB - 40;
                    const chartW = cw - padL - 40;
                    const maxM = 22;

                    ctx2.clearRect(0, 0, cw, ch);

                    // Axes
                    ctx2.strokeStyle = '#64748b';
                    ctx2.lineWidth = 2;
                    ctx2.beginPath();
                    ctx2.moveTo(padL, 30);
                    ctx2.lineTo(padL, ch - padB);
                    ctx2.lineTo(cw - 30, ch - padB);
                    ctx2.stroke();

                    // Grid
                    ctx2.strokeStyle = '#1e293b';
                    for (let y = 0; y <= maxM; y += 5) {
                        const py = (ch - padB) - (y / maxM) * chartH;
                        ctx2.beginPath(); ctx2.moveTo(padL, py); ctx2.lineTo(cw - 30, py); ctx2.stroke();
                        ctx2.fillStyle = '#94a3b8';
                        ctx2.font = '11px sans-serif';
                        ctx2.fillText(y, padL - 24, py + 4);
                    }

                    const points = [];
                    data.forEach((d, i) => {
                        const px = padL + 40 + i * 110;
                        const py = (ch - padB) - (d.m / maxM) * chartH;
                        points.push({ x: px, y: py, ...d });

                        ctx2.fillStyle = '#cbd5e1';
                        ctx2.font = '11px sans-serif';
                        ctx2.fillText(`x=${d.mid}`, px - 12, ch - padB + 20);
                        ctx2.fillStyle = '#94a3b8';
                        ctx2.fillText(d.range, px - 20, ch - padB + 36);
                    });

                    // Line
                    ctx2.strokeStyle = '#10b981';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath();
                    points.forEach((p, idx) => {
                        if (idx === 0) ctx2.moveTo(p.x, p.y);
                        else ctx2.lineTo(p.x, p.y);
                    });
                    ctx2.stroke();

                    // Dots
                    points.forEach(p => {
                        ctx2.fillStyle = '#f59e0b';
                        ctx2.beginPath(); ctx2.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx2.fill();
                        ctx2.strokeStyle = '#ffffff';
                        ctx2.lineWidth = 2; ctx2.stroke();

                        ctx2.fillStyle = '#ffffff';
                        ctx2.font = 'bold 12px sans-serif';
                        ctx2.fillText(p.m, p.x - 6, p.y - 10);
                    });

                    out2.innerHTML = `Biểu đồ đoạn thẳng ghép nhóm lấy <strong>giá trị đại diện</strong> $x_i$ của mỗi nhóm làm mốc hoành độ, cho thấy rõ xu hướng biến thiên của tần số.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                drawGroupedLine();
            
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
