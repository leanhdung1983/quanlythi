// ================================================================
// Ôn Tập Chương VII: Tần Số & Tần Số Tương Đối - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ontap_chuong7_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Tướng Quân Thống Kê 9',
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
    "title": "Câu 1: Quan hệ giữa tần số và tần số tương đối",
    "pts": 20,
    "question": "Nếu một giá trị trong mẫu có kích thước $N = 250$ xuất hiện 50 lần thì tần số tương đối của nó là:",
    "options": [
      {
        "text": "20%",
        "correct": true
      },
      {
        "text": "25%",
        "correct": false
      },
      {
        "text": "50%",
        "correct": false
      },
      {
        "text": "10%",
        "correct": false
      }
    ],
    "explanation": "$f = \\frac{50}{250} \\times 100\\% = 20\\%$."
  },
  {
    "id": 2,
    "title": "Câu 2: Số đo góc quạt tròn",
    "pts": 20,
    "question": "Hình quạt tròn biểu diễn một giá trị có tần số tương đối $30\\%$ sẽ có góc ở tâm bằng:",
    "options": [
      {
        "text": "$108^\\circ$",
        "correct": true
      },
      {
        "text": "$30^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      },
      {
        "text": "$120^\\circ$",
        "correct": false
      }
    ],
    "explanation": "$\\alpha = 30\\% \\times 360^\\circ = 0,3 \\times 360^\\circ = 108^\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Giá trị đại diện của nhóm",
    "pts": 20,
    "question": "Giá trị đại diện của nhóm $[150; 160)$ là:",
    "options": [
      {
        "text": "155",
        "correct": true
      },
      {
        "text": "150",
        "correct": false
      },
      {
        "text": "160",
        "correct": false
      },
      {
        "text": "10",
        "correct": false
      }
    ],
    "explanation": "Trung điểm hai đầu mút: $\\frac{150 + 160}{2} = 155$."
  },
  {
    "id": 4,
    "title": "Câu 4: Bảng tần số ghép nhóm ngang",
    "pts": 20,
    "question": "Cho bảng tần số ghép nhóm điểm thi học kì của 50 học sinh:<div class=\"quiz-table-wrap\"><table class=\"quiz-table\"><thead><tr><th>Điểm số</th><th>$[4; 6)$</th><th>$[6; 8)$</th><th>$[8; 10]$</th></tr></thead><tbody><tr><td>Tần số</td><td>10</td><td>25</td><td>15</td></tr></tbody></table></div>Tỉ lệ học sinh đạt điểm từ 8 trở lên là:",
    "options": [
      {
        "text": "30%",
        "correct": true
      },
      {
        "text": "50%",
        "correct": false
      },
      {
        "text": "15%",
        "correct": false
      },
      {
        "text": "20%",
        "correct": false
      }
    ],
    "explanation": "Tỉ lệ điểm từ 8 trở lên: $\\frac{15}{50} \\times 100\\% = 30\\%$."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhóm chiếm đa số",
    "pts": 20,
    "question": "Ở bảng số liệu Câu 4, nhóm điểm có số học sinh đông nhất là:",
    "options": [
      {
        "text": "$[6; 8)$ (chiếm 50%)",
        "correct": true
      },
      {
        "text": "$[8; 10]$ (chiếm 30%)",
        "correct": false
      },
      {
        "text": "$[4; 6)$ (chiếm 20%)",
        "correct": false
      },
      {
        "text": "Hai nhóm $[6; 8)$ và $[8; 10]$ bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Nhóm $[6; 8)$ có tần số 25 học sinh, chiếm $\\frac{25}{50} = 50\\%$."
  },
  {
    "id": 6,
    "title": "Câu 6: Ước lượng điểm trung bình",
    "pts": 20,
    "question": "Điểm trung bình ước lượng của 50 học sinh trong bảng Câu 4 là:",
    "options": [
      {
        "text": "7,2 điểm",
        "correct": true
      },
      {
        "text": "7,0 điểm",
        "correct": false
      },
      {
        "text": "7,5 điểm",
        "correct": false
      },
      {
        "text": "6,8 điểm",
        "correct": false
      }
    ],
    "explanation": "Giá trị đại diện các nhóm là: 5; 7; 9. Điểm trung bình $\\bar{x} = \\frac{10(5) + 25(7) + 15(9)}{50} = \\frac{50 + 175 + 135}{50} = \\frac{360}{50} = 7,2$ điểm."
  },
  {
    "id": 7,
    "title": "Câu 7: Tìm kích thước mẫu từ số liệu phần trăm",
    "pts": 20,
    "question": "Một khảo sát cho biết số người sử dụng xe buýt chiếm $16\\%$, tương ứng với 64 người. Tổng số người được khảo sát là:",
    "options": [
      {
        "text": "400 người",
        "correct": true
      },
      {
        "text": "350 người",
        "correct": false
      },
      {
        "text": "500 người",
        "correct": false
      },
      {
        "text": "300 người",
        "correct": false
      }
    ],
    "explanation": "$N = \\frac{64}{16\\%} = \\frac{64}{0,16} = 400$ người."
  },
  {
    "id": 8,
    "title": "Câu 8: Tổng các góc quạt tròn",
    "pts": 20,
    "question": "Một biểu đồ hình quạt tròn gồm 3 hình quạt. Nếu hai hình quạt có góc ở tâm lần lượt là $120^\\circ$ và $150^\\circ$ thì hình quạt thứ ba có góc ở tâm là:",
    "options": [
      {
        "text": "$90^\\circ$",
        "correct": true
      },
      {
        "text": "$100^\\circ$",
        "correct": false
      },
      {
        "text": "$80^\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Góc quạt thứ ba $= 360^\\circ - (120^\\circ + 150^\\circ) = 360^\\circ - 270^\\circ = 90^\\circ$."
  },
  {
    "id": 9,
    "title": "Câu 9: Tần số tương đối ứng với góc 90 độ",
    "pts": 20,
    "question": "Hình quạt có góc ở tâm $90^\\circ$ ở Câu 8 tương ứng với tần số tương đối là:",
    "options": [
      {
        "text": "25%",
        "correct": true
      },
      {
        "text": "30%",
        "correct": false
      },
      {
        "text": "20%",
        "correct": false
      },
      {
        "text": "15%",
        "correct": false
      }
    ],
    "explanation": "$\\frac{90^\\circ}{360^\\circ} \\times 100\\% = 25\\%$."
  },
  {
    "id": 10,
    "title": "Câu 10: Biểu đồ phù hợp dữ liệu liên tục",
    "pts": 20,
    "question": "Để mô tả phân bố chiều cao của các học sinh nam lớp 9 (dữ liệu biến thiên liên tục từ 150 cm đến 180 cm), biểu đồ nào là thích hợp nhất?",
    "options": [
      {
        "text": "Biểu đồ cột ghép nhóm (Histogram)",
        "correct": true
      },
      {
        "text": "Biểu đồ tranh",
        "correct": false
      },
      {
        "text": "Biểu đồ hình quạt tròn đơn lẻ",
        "correct": false
      },
      {
        "text": "Biểu đồ cột rời rạc thông thường",
        "correct": false
      }
    ],
    "explanation": "Dữ liệu liên tục được phân nhóm khoảng nên biểu đồ cột ghép nhóm (Histogram) là công cụ chuyên dụng và thích hợp nhất."
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
                const out1 = document.getElementById('lab1Output');
                let curBranch = 1;

                const dataB = [
                    { id: 1, title: 'Tần số m & Biểu đồ', desc: 'Số lần xuất hiện giá trị. Tổng m_i = N. Biểu đồ cột phân biệt, biểu đồ đoạn thẳng.', color: '#38bdf8' },
                    { id: 2, title: 'Tần số tương đối f%', desc: 'f_i = (m_i / N) * 100%. Tổng f_i = 100%. Biểu đồ quạt tròn: góc alpha = f_i * 360 độ.', color: '#ec4899' },
                    { id: 3, title: 'Dữ liệu ghép nhóm', desc: 'Nhóm [a; b), giá trị đại diện x_i = (a + b)/2. Histogram các cột sát nhau. Số trung bình ước lượng.', color: '#10b981' }
                ];

                function renderMindmap() {
                    const cw = c1.width;
                    const ch = c1.height;
                    const ox = cw / 2;
                    const oy = ch / 2;
                    ctx.clearRect(0, 0, cw, ch);

                    // Center
                    ctx.fillStyle = '#6366f1';
                    ctx.beginPath(); ctx.arc(ox, oy, 40, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#a5b4fc'; ctx.lineWidth = 3; ctx.stroke();
                    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px sans-serif';
                    ctx.fillText('CHƯƠNG VII', ox - 34, oy - 5);
                    ctx.fillText('THỐNG KÊ 9', ox - 32, oy + 12);

                    const pos = [
                        { x: ox - 180, y: oy - 60 },
                        { x: ox + 180, y: oy - 60 },
                        { x: ox, y: oy + 95 }
                    ];

                    dataB.forEach((b, i) => {
                        const p = pos[i];
                        const isA = b.id === curBranch;

                        ctx.strokeStyle = isA ? b.color : '#334155';
                        ctx.lineWidth = isA ? 3 : 1.5;
                        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(p.x, p.y); ctx.stroke();

                        ctx.fillStyle = isA ? b.color : '#1e293b';
                        ctx.strokeStyle = b.color;
                        ctx.lineWidth = isA ? 3 : 1;
                        ctx.beginPath();
                        ctx.roundRect(p.x - 75, p.y - 25, 150, 50, 10);
                        ctx.fill(); ctx.stroke();

                        ctx.fillStyle = '#ffffff';
                        ctx.font = isA ? 'bold 12px sans-serif' : '11px sans-serif';
                        ctx.fillText(b.title, p.x - 65, p.y + 5);
                    });

                    const act = dataB.find(b => b.id === curBranch);
                    out1.innerHTML = `<strong>${act.title}:</strong> ${act.desc}`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                [1, 2, 3].forEach(n => {
                    const btn = document.getElementById('btnTh7_' + n);
                    if (btn) btn.addEventListener('click', () => { curBranch = n; renderMindmap(); });
                });

                renderMindmap();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const out2 = document.getElementById('lab2Output');

                const sample = [
                    { range: '[0; 20)', m: 15, mid: 10 },
                    { range: '[20; 40)', m: 35, mid: 30 },
                    { range: '[40; 60)', m: 30, mid: 50 },
                    { range: '[60; 80)', m: 20, mid: 70 }
                ];

                function drawRevStats() {
                    const N = 100;
                    let sumX = 0;
                    sample.forEach(s => { sumX += s.m * s.mid; });
                    const mean = sumX / N;

                    const cw = c2.width;
                    const ch = c2.height;
                    ctx2.clearRect(0, 0, cw, ch);

                    // Table Header
                    ctx2.fillStyle = '#334155';
                    ctx2.fillRect(40, 30, cw - 80, 35);
                    ctx2.strokeStyle = '#64748b';
                    ctx2.strokeRect(40, 30, cw - 80, 35);

                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 12px sans-serif';
                    ctx2.fillText('Nhóm [a; b)', 60, 52);
                    ctx2.fillText('Giá trị đ/d (x)', 180, 52);
                    ctx2.fillText('Tần số (m)', 310, 52);
                    ctx2.fillText('Tần số tương đối (f%)', 430, 52);

                    sample.forEach((s, idx) => {
                        const ry = 65 + idx * 40;
                        ctx2.fillStyle = idx % 2 === 0 ? '#1e293b' : '#0f172a';
                        ctx2.fillRect(40, ry, cw - 80, 40);
                        ctx2.strokeRect(40, ry, cw - 80, 40);

                        ctx2.fillStyle = '#38bdf8';
                        ctx2.font = '13px sans-serif';
                        ctx2.fillText(s.range, 60, ry + 25);

                        ctx2.fillStyle = '#cbd5e1';
                        ctx2.fillText(s.mid, 200, ry + 25);

                        ctx2.fillStyle = '#34d399';
                        ctx2.fillText(s.m, 330, ry + 25);

                        ctx2.fillStyle = '#fbbf24';
                        ctx2.fillText(((s.m / N) * 100).toFixed(0) + '%', 470, ry + 25);
                    });

                    // Summary row
                    const totalY = 65 + sample.length * 40;
                    ctx2.fillStyle = '#312e81';
                    ctx2.fillRect(40, totalY, cw - 80, 40);
                    ctx2.strokeRect(40, totalY, cw - 80, 40);
                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 13px sans-serif';
                    ctx2.fillText('TỔNG CỘNG', 60, totalY + 25);
                    ctx2.fillText(`N = ${N}`, 320, totalY + 25);
                    ctx2.fillText('100%', 470, totalY + 25);

                    out2.innerHTML = `<strong>Số trung bình ước lượng:</strong> $\bar{x} = \\frac{15(10) + 35(30) + 30(50) + 20(70)}{100} = \\frac{150 + 1050 + 1500 + 1400}{100} = \\frac{4100}{100} = 41\\text{ phút/ngày}$. Nhóm phổ biến nhất là <strong>[20; 40)</strong> phút (${sample[1].m}%).`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                drawRevStats();
            
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
