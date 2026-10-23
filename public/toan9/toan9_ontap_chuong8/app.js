// ================================================================
// Ôn Tập Chương VIII: Xác Suất Của Biến Cố - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ontap_chuong8_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Tướng Quân Xác Suất 9',
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
    "title": "Câu 1: Giá trị xác suất hợp lệ",
    "pts": 20,
    "question": "Trong các số sau, số nào CÓ THỂ là xác suất của một biến cố?",
    "options": [
      {
        "text": "0,45",
        "correct": true
      },
      {
        "text": "-0,2",
        "correct": false
      },
      {
        "text": "1,5",
        "correct": false
      },
      {
        "text": "$\\frac{4}{3}$",
        "correct": false
      }
    ],
    "explanation": "Xác suất của biến cố luôn thỏa mãn $0 \\le P(E) \\le 1$. Chỉ có 0,45 thỏa mãn."
  },
  {
    "id": 2,
    "title": "Câu 2: Xác suất biến cố đối",
    "pts": 20,
    "question": "Cho biết $P(A) = \\frac{3}{7}$. Xác suất của biến cố đối $\\overline{A}$ là:",
    "options": [
      {
        "text": "$\\frac{4}{7}$",
        "correct": true
      },
      {
        "text": "$\\frac{3}{7}$",
        "correct": false
      },
      {
        "text": "$\\frac{7}{3}$",
        "correct": false
      },
      {
        "text": "0",
        "correct": false
      }
    ],
    "explanation": "$P(\\overline{A}) = 1 - P(A) = 1 - \\frac{3}{7} = \\frac{4}{7}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Gieo 2 con xúc xắc tổng bằng 2",
    "pts": 20,
    "question": "Gieo đồng thời hai con xúc xắc cân đối. Xác suất để tổng số chấm xuất hiện bằng 2 là:",
    "options": [
      {
        "text": "$\\frac{1}{36}$",
        "correct": true
      },
      {
        "text": "$\\frac{2}{36}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{18}$",
        "correct": false
      },
      {
        "text": "0",
        "correct": false
      }
    ],
    "explanation": "Chỉ có duy nhất một kết quả thuận lợi là $(1; 1)$. Do đó $P = \\frac{1}{36}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Rút thẻ số lẻ",
    "pts": 20,
    "question": "Rút ngẫu nhiên một thẻ từ hộp gồm 30 thẻ đánh số từ 1 đến 30. Xác suất rút được thẻ ghi số lẻ là:",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{15}{31}$",
        "correct": false
      },
      {
        "text": "$\\frac{14}{30}$",
        "correct": false
      }
    ],
    "explanation": "Từ 1 đến 30 có đúng 15 số lẻ và 15 số chẵn. Xác suất $P = \\frac{15}{30} = \\frac{1}{2}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Số phần tử không gian mẫu tung 3 đồng xu",
    "pts": 20,
    "question": "Tung 3 đồng xu phân biệt. Số kết quả có thể xảy ra là:",
    "options": [
      {
        "text": "8",
        "correct": true
      },
      {
        "text": "6",
        "correct": false
      },
      {
        "text": "9",
        "correct": false
      },
      {
        "text": "12",
        "correct": false
      }
    ],
    "explanation": "$n(\\Omega) = 2^3 = 8$."
  },
  {
    "id": 6,
    "title": "Câu 6: Xác suất xuất hiện đúng 2 mặt ngửa",
    "pts": 20,
    "question": "Ở Câu 5, xác suất để có đúng 2 đồng xu xuất hiện mặt ngửa là:",
    "options": [
      {
        "text": "$\\frac{3}{8}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{8}$",
        "correct": false
      }
    ],
    "explanation": "Các kết quả thuận lợi có đúng 2 ngửa là: $NNS, NSN, SNN$ (có 3 kết quả). Xác suất $P = \\frac{3}{8}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Xác suất chắc chắn trong thực tế",
    "pts": 20,
    "question": "Trong hộp chỉ có toàn bi màu xanh. Rút ngẫu nhiên một viên bi, biến cố \"Rút được viên bi màu xanh\" là:",
    "options": [
      {
        "text": "Biến cố chắc chắn (xác suất bằng 1)",
        "correct": true
      },
      {
        "text": "Biến cố ngẫu nhiên",
        "correct": false
      },
      {
        "text": "Biến cố không thể",
        "correct": false
      },
      {
        "text": "Biến cố có xác suất 0,5",
        "correct": false
      }
    ],
    "explanation": "Vì mọi viên bi đều màu xanh nên 100% lần rút đều được bi xanh, đây là biến cố chắc chắn."
  },
  {
    "id": 8,
    "title": "Câu 8: Tổng số chấm là số chia hết cho 6",
    "pts": 20,
    "question": "Gieo đồng thời hai con xúc xắc. Xác suất để tổng số chấm chia hết cho 6 là:",
    "options": [
      {
        "text": "$\\frac{1}{6}$",
        "correct": true
      },
      {
        "text": "$\\frac{5}{36}$",
        "correct": false
      },
      {
        "text": "$\\frac{7}{36}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{12}$",
        "correct": false
      }
    ],
    "explanation": "Tổng chia hết cho 6 có thể bằng 6 hoặc 12. Tổng bằng 6 có 5 cặp: (1;5), (2;4), (3;3), (4;2), (5;1). Tổng bằng 12 có 1 cặp: (6;6). Tổng cộng có $5 + 1 = 6$ cặp. Xác suất $P = \\frac{6}{36} = \\frac{1}{6}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bốc thăm không gian mẫu",
    "pts": 20,
    "question": "Một tổ có 5 bạn nữ và 4 bạn nam. Chọn ngẫu nhiên 1 bạn làm tổ trưởng. Xác suất chọn được bạn nữ là:",
    "options": [
      {
        "text": "$\\frac{5}{9}$",
        "correct": true
      },
      {
        "text": "$\\frac{4}{9}$",
        "correct": false
      },
      {
        "text": "$\\frac{5}{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      }
    ],
    "explanation": "Tổng số bạn là $5 + 4 = 9$. Số bạn nữ là 5. Xác suất $P = \\frac{5}{9}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ý nghĩa của xác suất 0%",
    "pts": 20,
    "question": "Một biến cố có xác suất bằng $0$ biểu thị điều gì?",
    "options": [
      {
        "text": "Biến cố đó không bao giờ xảy ra trong phép thử",
        "correct": true
      },
      {
        "text": "Biến cố đó luôn luôn xảy ra",
        "correct": false
      },
      {
        "text": "Biến cố đó có 50% cơ hội xảy ra",
        "correct": false
      },
      {
        "text": "Phép thử chưa được thực hiện",
        "correct": false
      }
    ],
    "explanation": "Xác suất bằng 0 là đặc trưng của biến cố không thể, nghĩa là nó hoàn toàn không có khả năng xảy ra."
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
                let act = 1;

                const branches = [
                    { id: 1, title: 'Phép thử & Ω', desc: 'Không gian mẫu Omega chứa tất cả kết quả có thể có. Biến cố E là tập con của Omega.', color: '#38bdf8' },
                    { id: 2, title: 'P(E) = n(E)/n(Ω)', desc: 'Xác suất cổ điển trong mô hình đồng khả năng. 0 <= P(E) <= 1. Biến cố đối P(E ngang) = 1 - P(E).', color: '#10b981' },
                    { id: 3, title: 'Cây & Bảng 2 chiều', desc: 'Sơ đồ hình cây phân nhánh công đoạn. Bảng hai chiều m x n ô kết hợp không gian mẫu 2 biến.', color: '#f59e0b' }
                ];

                function drawMindmap() {
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
                    ctx.fillText('CHƯƠNG VIII', ox - 38, oy - 5);
                    ctx.fillText('XÁC SUẤT 9', ox - 32, oy + 12);

                    const pos = [
                        { x: ox - 180, y: oy - 60 },
                        { x: ox + 180, y: oy - 60 },
                        { x: ox, y: oy + 95 }
                    ];

                    branches.forEach((b, i) => {
                        const p = pos[i];
                        const isA = b.id === act;

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

                    const cur = branches.find(b => b.id === act);
                    out1.innerHTML = `<strong>${cur.title}:</strong> ${cur.desc}`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                [1, 2, 3].forEach(n => {
                    const btn = document.getElementById('btnProb' + n);
                    if (btn) btn.addEventListener('click', () => { act = n; drawMindmap(); });
                });

                drawMindmap();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const inR = document.getElementById('inR');
                const inB = document.getElementById('inB');
                const inY = document.getElementById('inY');
                const btn = document.getElementById('btnCalcProb');
                const out2 = document.getElementById('lab2Output');

                function updateMarbles() {
                    const r = Math.max(0, parseInt(inR.value) || 0);
                    const b = Math.max(0, parseInt(inB.value) || 0);
                    const y = Math.max(0, parseInt(inY.value) || 0);
                    const N = r + b + y;

                    const cw = c2.width;
                    const ch = c2.height;
                    ctx2.clearRect(0, 0, cw, ch);

                    if (N === 0) {
                        ctx2.fillStyle = '#ef4444'; ctx2.fillText('Vui lòng nhập ít nhất 1 viên bi!', 100, 100);
                        return;
                    }

                    // Draw Bag on Left
                    ctx2.fillStyle = 'rgba(255, 255, 255, 0.05)';
                    ctx2.beginPath();
                    ctx2.roundRect(40, 40, 220, 240, 16);
                    ctx2.fill();
                    ctx2.strokeStyle = '#475569'; ctx2.stroke();
                    ctx2.fillStyle = '#94a3b8';
                    ctx2.font = '12px sans-serif';
                    ctx2.fillText(`Hộp chứa tổng số: ${N} viên bi`, 60, 65);

                    // Draw marble dots inside bag
                    const colors = [];
                    for (let i = 0; i < r; i++) colors.push('#ef4444');
                    for (let i = 0; i < b; i++) colors.push('#3b82f6');
                    for (let i = 0; i < y; i++) colors.push('#f59e0b');

                    const startX = 65;
                    const startY = 90;
                    colors.slice(0, 40).forEach((c, i) => {
                        const col = i % 6;
                        const row = Math.floor(i / 6);
                        ctx2.fillStyle = c;
                        ctx2.beginPath();
                        ctx2.arc(startX + col * 30, startY + row * 30, 9, 0, Math.PI * 2);
                        ctx2.fill();
                        ctx2.strokeStyle = '#ffffff'; ctx2.lineWidth = 1; ctx2.stroke();
                    });

                    // Stats on right
                    const tx = 300;
                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 14px sans-serif';
                    ctx2.fillText('KẾT QUẢ XÁC SUẤT BỐC 1 VIÊN:', tx, 60);

                    const pr = r / N;
                    const pb = b / N;
                    const py = y / N;

                    ctx2.font = '13px sans-serif';
                    ctx2.fillStyle = '#f87171';
                    ctx2.fillText(`• Bi Đỏ: P(Đỏ) = ${r}/${N} = ${(pr * 100).toFixed(1)}%`, tx, 100);
                    ctx2.fillStyle = '#38bdf8';
                    ctx2.fillText(`• Bi Xanh: P(Xanh) = ${b}/${N} = ${(pb * 100).toFixed(1)}%`, tx, 135);
                    ctx2.fillStyle = '#fbbf24';
                    ctx2.fillText(`• Bi Vàng: P(Vàng) = ${y}/${N} = ${(py * 100).toFixed(1)}%`, tx, 170);

                    ctx2.fillStyle = '#a855f7';
                    const notRed = 1 - pr;
                    ctx2.fillText(`• Không phải Bi Đỏ: P = 1 - P(Đỏ) = ${(notRed * 100).toFixed(1)}%`, tx, 215);

                    out2.innerHTML = `<strong>Không gian mẫu:</strong> $n(\Omega) = ${N}$. Biến cố bốc được bi màu vàng có xác suất $P = \\frac{${y}}{${N}} = ${(py*100).toFixed(1)}\\%$.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                btn.addEventListener('click', updateMarbles);
                [inR, inB, inY].forEach(el => el.addEventListener('input', updateMarbles));
                updateMarbles();
            
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
