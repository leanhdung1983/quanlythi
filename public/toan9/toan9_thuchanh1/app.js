// ================================================================
// Hoạt động 1: Pha chế dung dịch theo nồng độ yêu cầu - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_thuchanh1_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nhà Thực Nghiệm Toán 9',
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
    "id": "q1",
    "title": "Câu 1: Công thức tính nồng độ phần trăm",
    "question": "Công thức tính nồng độ phần trăm của dung dịch là:",
    "options": [
      {
        "text": "$C\\% = \\frac{m_{ct}}{m_{dd}} \\times 100\\%$",
        "correct": true
      },
      {
        "text": "$C\\% = \\frac{m_{dd}}{m_{ct}} \\times 100\\%$",
        "correct": false
      },
      {
        "text": "$C\\% = \\frac{m_{ct}}{m_{dm}} \\times 100\\%$",
        "correct": false
      },
      {
        "text": "$C\\% = \\frac{m_{dm}}{m_{dd}} \\times 100\\%$",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa, nồng độ phần trăm là tỉ số giữa khối lượng chất tan và khối lượng dung dịch nhân với 100%.",
    "pts": 20
  },
  {
    "id": "q2",
    "title": "Câu 2: Tính nồng độ phần trăm của dung dịch cụ thể",
    "question": "Hòa tan $20$ g đường vào $80$ g nước cất. Nồng độ phần trăm của dung dịch nước đường thu được là:",
    "options": [
      {
        "text": "$25\\%$",
        "correct": false
      },
      {
        "text": "$20\\%$",
        "correct": true
      },
      {
        "text": "$15\\%$",
        "correct": false
      },
      {
        "text": "$10\\%$",
        "correct": false
      }
    ],
    "explanation": "Khối lượng dung dịch là $m_{dd} = 20 + 80 = 100$ g. Do đó $C\\% = \\frac{20}{100} \\times 100\\% = 20\\%$.",
    "pts": 20
  },
  {
    "id": "q3",
    "title": "Câu 3: Khối lượng muối cần để pha nước muối sinh lý",
    "question": "Để pha chế $500$ g dung dịch nước muối sinh lý $0.9\\%$, cần dùng bao nhiêu gam muối NaCl tinh khiết?",
    "options": [
      {
        "text": "$4.5$ g",
        "correct": true
      },
      {
        "text": "$9.0$ g",
        "correct": false
      },
      {
        "text": "$0.45$ g",
        "correct": false
      },
      {
        "text": "$45$ g",
        "correct": false
      }
    ],
    "explanation": "$m_{ct} = \\frac{500 \\times 0.9}{100} = 4.5$ g.",
    "pts": 20
  },
  {
    "id": "q4",
    "title": "Câu 4: Pha loãng dung dịch bằng nước cất",
    "question": "Khi thêm nước cất vào một dung dịch có sẵn thì đại lượng nào sau đây không đổi?",
    "options": [
      {
        "text": "Nồng độ phần trăm",
        "correct": false
      },
      {
        "text": "Khối lượng dung dịch",
        "correct": false
      },
      {
        "text": "Khối lượng chất tan",
        "correct": true
      },
      {
        "text": "Thể tích dung dịch",
        "correct": false
      }
    ],
    "explanation": "Khi thêm nước cất vào dung dịch, chỉ có dung môi tăng lên làm nồng độ giảm, còn khối lượng chất tan hoàn toàn không thay đổi.",
    "pts": 20
  },
  {
    "id": "q5",
    "title": "Câu 5: Bài toán pha loãng",
    "question": "Cần thêm bao nhiêu gam nước cất vào $100$ g dung dịch muối $15\\%$ để được dung dịch muối $10\\%$?",
    "options": [
      {
        "text": "$50$ g",
        "correct": true
      },
      {
        "text": "$100$ g",
        "correct": false
      },
      {
        "text": "$150$ g",
        "correct": false
      },
      {
        "text": "$25$ g",
        "correct": false
      }
    ],
    "explanation": "Khối lượng muối trong dd ban đầu là $15$ g. Để nồng độ là $10\\%$, khối lượng dd mới cần là $\\frac{15}{0.10} = 150$ g. Lượng nước cần thêm là $150 - 100 = 50$ g.",
    "pts": 20
  },
  {
    "id": "q6",
    "title": "Câu 6: Trộn hai dung dịch",
    "question": "Trộn $100$ g dung dịch muối $10\\%$ với $300$ g dung dịch muối $20\\%$. Nồng độ phần trăm của dung dịch thu được là:",
    "options": [
      {
        "text": "$15\\%$",
        "correct": false
      },
      {
        "text": "$17.5\\%$",
        "correct": true
      },
      {
        "text": "$18\\%$",
        "correct": false
      },
      {
        "text": "$16.5\\%$",
        "correct": false
      }
    ],
    "explanation": "Tổng khối lượng muối: $100 \\times 0.10 + 300 \\times 0.20 = 10 + 60 = 70$ g. Tổng khối lượng dd: $100 + 300 = 400$ g. Nồng độ: $\\frac{70}{400} \\times 100\\% = 17.5\\%$.",
    "pts": 20
  },
  {
    "id": "q7",
    "title": "Câu 7: Thiết lập hệ phương trình pha trộn",
    "question": "Cần pha trộn $x$ gam dung dịch $5\\%$ và $y$ gam dung dịch $15\\%$ để được $200$ g dung dịch $8\\%$. Phương trình biểu thị khối lượng chất tan là:",
    "options": [
      {
        "text": "$0.05x + 0.15y = 16$",
        "correct": true
      },
      {
        "text": "$0.05x + 0.15y = 8$",
        "correct": false
      },
      {
        "text": "$5x + 15y = 200$",
        "correct": false
      },
      {
        "text": "$x + y = 16$",
        "correct": false
      }
    ],
    "explanation": "Khối lượng chất tan trong dd mới là $200 \\times 8\\% = 16$ g. Do đó $0.05x + 0.15y = 16$.",
    "pts": 20
  },
  {
    "id": "q8",
    "title": "Câu 8: Khối lượng hai dung dịch cần trộn",
    "question": "Giải hệ bài toán ở Câu 7: $\\begin{cases} x + y = 200 \\\\ 0.05x + 0.15y = 16 \\end{cases}$, ta được:",
    "options": [
      {
        "text": "$x = 140$, $y = 60$",
        "correct": true
      },
      {
        "text": "$x = 120$, $y = 80$",
        "correct": false
      },
      {
        "text": "$x = 150$, $y = 50$",
        "correct": false
      },
      {
        "text": "$x = 100$, $y = 100$",
        "correct": false
      }
    ],
    "explanation": "Nhân pt thứ hai với 20: $x + 3y = 320$. Lấy (x + 3y) - (x + y) = 320 - 200 $\\implies 2y = 120 \\implies y = 60$, suy ra $x = 140$.",
    "pts": 20
  },
  {
    "id": "q9",
    "title": "Câu 9: Cô cạn dung dịch",
    "question": "Khi làm bay hơi $50$ g nước từ $250$ g dung dịch muối $12\\%$ thì nồng độ phần trăm của dung dịch còn lại là:",
    "options": [
      {
        "text": "$15\\%$",
        "correct": true
      },
      {
        "text": "$14\\%$",
        "correct": false
      },
      {
        "text": "$16\\%$",
        "correct": false
      },
      {
        "text": "$18\\%$",
        "correct": false
      }
    ],
    "explanation": "Khối lượng muối: $250 \\times 0.12 = 30$ g. Khối lượng dd sau khi bay hơi nước: $250 - 50 = 200$ g. Nồng độ mới: $\\frac{30}{200} \\times 100\\% = 15\\%$.",
    "pts": 20
  },
  {
    "id": "q10",
    "title": "Câu 10: Dụng cụ cân đo trong phòng thí nghiệm",
    "question": "Dụng cụ dùng để đong thể tích chất lỏng (nước cất) trong phòng thí nghiệm với độ chính xác vừa phải là:",
    "options": [
      {
        "text": "Cân phân tích",
        "correct": false
      },
      {
        "text": "Ống đong chia độ",
        "correct": true
      },
      {
        "text": "Nhiệt kế",
        "correct": false
      },
      {
        "text": "Phễu chiết",
        "correct": false
      }
    ],
    "explanation": "Ống đong (hoặc cốc chia vạch) là dụng cụ chuyên dụng để đo và đong thể tích chất lỏng.",
    "pts": 20
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
    
                const salCanvas = document.getElementById('salineCanvas');
                const salCtx = salCanvas.getContext('2d');
                const rngS = document.getElementById('rngSalt');
                const rngW = document.getElementById('rngWater');

                function updateSaline() {
                    const salt = parseFloat(rngS.value);
                    const water = parseFloat(rngW.value);
                    document.getElementById('lblSalt').innerText = salt;
                    document.getElementById('lblWater').innerText = water;

                    const mdd = salt + water;
                    const cPerc = (salt / mdd) * 100;

                    document.getElementById('outMdd').innerText = mdd.toFixed(0);
                    document.getElementById('outConc').innerText = cPerc.toFixed(2);

                    salCtx.clearRect(0, 0, salCanvas.width, salCanvas.height);
                    const cx = salCanvas.width / 2;
                    const bWidth = 140;
                    const bHeight = 170;
                    const by = salCanvas.height - 30;

                    // Beaker body
                    salCtx.beginPath();
                    salCtx.moveTo(cx - bWidth/2, by - bHeight);
                    salCtx.lineTo(cx - bWidth/2, by);
                    salCtx.lineTo(cx + bWidth/2, by);
                    salCtx.lineTo(cx + bWidth/2, by - bHeight);
                    salCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                    salCtx.lineWidth = 3;
                    salCtx.stroke();

                    // Liquid level (proportional to total volume)
                    const fillH = Math.min(bHeight - 20, (mdd / 1600) * (bHeight - 30) + 30);
                    const alpha = Math.min(0.85, 0.2 + (cPerc / 25) * 0.6);
                    salCtx.fillStyle = 'rgba(6, 182, 212, ' + alpha + ')';
                    salCtx.fillRect(cx - bWidth/2 + 3, by - fillH, bWidth - 6, fillH - 2);

                    // Meniscus
                    salCtx.beginPath();
                    salCtx.ellipse(cx, by - fillH, bWidth/2 - 4, 6, 0, 0, Math.PI * 2);
                    salCtx.fillStyle = 'rgba(56, 189, 248, 0.6)';
                    salCtx.fill();

                    // Text labels
                    salCtx.fillStyle = '#ffffff';
                    salCtx.font = 'bold 13px Inter, sans-serif';
                    salCtx.fillText('C% = ' + cPerc.toFixed(2) + '%', cx - 35, by - fillH / 2);
                }
                rngS.addEventListener('input', updateSaline);
                rngW.addEventListener('input', updateSaline);
                updateSaline();
                
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const mCanvas = document.getElementById('mixCanvas');
                const mCtx = mCanvas.getContext('2d');
                const rngTC = document.getElementById('rngTargetC');

                function updateMix() {
                    const cTarget = parseFloat(rngTC.value);
                    document.getElementById('lblTargetC').innerText = cTarget;

                    const totalM = 200;
                    const c1 = 10, c2 = 30;
                    const m1 = 10 * (c2 - cTarget);
                    const m2 = totalM - m1;

                    document.getElementById('outM1').innerText = m1.toFixed(1);
                    document.getElementById('outM2').innerText = m2.toFixed(1);

                    mCtx.clearRect(0, 0, mCanvas.width, mCanvas.height);
                    // Draw 2 bar comparison
                    const startY = 60;
                    const maxW = 280;

                    // Bar 1
                    mCtx.fillStyle = '#818cf8';
                    const w1 = (m1 / totalM) * maxW;
                    mCtx.fillRect(60, startY, w1, 35);
                    mCtx.fillStyle = '#fff';
                    mCtx.font = 'bold 12px Inter, sans-serif';
                    mCtx.fillText('Dd 10%: ' + m1.toFixed(0) + 'g', 65, startY + 22);

                    // Bar 2
                    mCtx.fillStyle = '#34d399';
                    const w2 = (m2 / totalM) * maxW;
                    mCtx.fillRect(60 + w1, startY, w2, 35);
                    mCtx.fillStyle = '#0f172a';
                    mCtx.fillText('Dd 30%: ' + m2.toFixed(0) + 'g', 60 + w1 + 10, startY + 22);

                    mCtx.fillStyle = '#fbbf24';
                    mCtx.font = 'bold 14px Inter, sans-serif';
                    mCtx.fillText('Tổng khối lượng dd sau trộn: 200g (C% = ' + cTarget + '%)', 60, startY + 70);
                }
                rngTC.addEventListener('input', updateMix);
                updateMix();
                
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
