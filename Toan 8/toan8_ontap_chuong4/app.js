// ================================================================
// BÀI TẬP CUỐI CHƯƠNG IV: ĐỊNH LÍ THALÈS - TOÁN 8 KNTT
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
  userTitle: 'Đại Kiện Tướng Thalès 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_ontap_chuong4_state';

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
    "title": "Thử Thách 1: Tỉ Số Đoạn Thẳng",
    "pts": 20,
    "question": "Cho đoạn thẳng $AB = 60$ cm và $CD = 1{,}5$ m. Tỉ số $\\frac{AB}{CD}$ bằng:",
    "options": [
      {
        "text": "$\\frac{2}{5}$",
        "correct": true
      },
      {
        "text": "$\\frac{5}{2}$",
        "correct": false
      },
      {
        "text": "$40$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{25}$",
        "correct": false
      }
    ],
    "explanation": "Đổi $1{,}5$ m = $150$ cm. Tỉ số $\\frac{60}{150} = \\frac{2}{5}$."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Định Lí Thalès Thuận",
    "pts": 20,
    "question": "Cho tam giác $ABC$ có $MN \\parallel BC$ ($M \\in AB, N \\in AC$). Biết $AM = 4$ cm, $AB = 10$ cm, $AN = 6$ cm. Độ dài cạnh $AC$ là:",
    "options": [
      {
        "text": "$15$ cm",
        "correct": true
      },
      {
        "text": "$12$ cm",
        "correct": false
      },
      {
        "text": "$9$ cm",
        "correct": false
      },
      {
        "text": "$20$ cm",
        "correct": false
      }
    ],
    "explanation": "$\\frac{AM}{AB} = \\frac{AN}{AC} \\implies \\frac{4}{10} = \\frac{6}{AC} \\implies AC = \\frac{10 \\cdot 6}{4} = 15$ cm."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Hệ Quả Định Lí Thalès",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có $MN \\parallel BC$ ($M \\in AB, N \\in AC$). Biết $AM = 3$ cm, $MB = 2$ cm, $BC = 15$ cm. Độ dài đoạn $MN$ là:",
    "options": [
      {
        "text": "$9$ cm",
        "correct": true
      },
      {
        "text": "$10$ cm",
        "correct": false
      },
      {
        "text": "$6$ cm",
        "correct": false
      },
      {
        "text": "$7{,}5$ cm",
        "correct": false
      }
    ],
    "explanation": "$AB = AM + MB = 3 + 2 = 5$ cm. Theo hệ quả Thalès: $\\frac{MN}{BC} = \\frac{AM}{AB} \\implies \\frac{MN}{15} = \\frac{3}{5} \\implies MN = 9$ cm."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Đường Trung Bình Tam Giác",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có $BC = 18$ cm. Gọi $M, N$ lần lượt là trung điểm của $AB$ và $AC$. Độ dài đoạn thẳng $MN$ là:",
    "options": [
      {
        "text": "$9$ cm",
        "correct": true
      },
      {
        "text": "$18$ cm",
        "correct": false
      },
      {
        "text": "$6$ cm",
        "correct": false
      },
      {
        "text": "$36$ cm",
        "correct": false
      }
    ],
    "explanation": "$MN = \\frac{1}{2}BC = 18 : 2 = 9$ cm."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Tính Chất Đường Phân Giác",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có $AD$ là tia phân giác của góc $A$. Biết $AB = 8$ cm, $AC = 12$ cm, $BD = 4$ cm. Độ dài đoạn $DC$ là:",
    "options": [
      {
        "text": "$6$ cm",
        "correct": true
      },
      {
        "text": "$8$ cm",
        "correct": false
      },
      {
        "text": "$5$ cm",
        "correct": false
      },
      {
        "text": "$3$ cm",
        "correct": false
      }
    ],
    "explanation": "$\\frac{BD}{DC} = \\frac{AB}{AC} \\implies \\frac{4}{DC} = \\frac{8}{12} = \\frac{2}{3} \\implies DC = \\frac{4 \\cdot 3}{2} = 6$ cm."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Độ Dài Cạnh Đáy Tam Giác",
    "pts": 20,
    "question": "Ở câu 5 trên, độ dài cạnh $BC$ của tam giác là:",
    "options": [
      {
        "text": "$10$ cm",
        "correct": true
      },
      {
        "text": "$12$ cm",
        "correct": false
      },
      {
        "text": "$14$ cm",
        "correct": false
      },
      {
        "text": "$16$ cm",
        "correct": false
      }
    ],
    "explanation": "$BC = BD + DC = 4 + 6 = 10$ cm."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Định Lí Thalès Đảo",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có $AB = 6$ cm, $AC = 9$ cm. Điểm $M$ trên $AB$ có $AM = 2$ cm, điểm $N$ trên $AC$ có $AN = 3$ cm. Khẳng định nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$MN \\parallel BC$",
        "correct": true
      },
      {
        "text": "$MN \\perp BC$",
        "correct": false
      },
      {
        "text": "$MN = \\frac{1}{2}BC$",
        "correct": false
      },
      {
        "text": "$MN$ cắt $BC$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{AM}{AB} = \\frac{2}{6} = \\frac{1}{3}$ và $\\frac{AN}{AC} = \\frac{3}{9} = \\frac{1}{3}$. Vì $\\frac{AM}{AB} = \\frac{AN}{AC}$ nên theo định lí Thalès đảo $MN \\parallel BC$."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Chu Vi Tam Giác Con",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có chu vi $30$ cm. Gọi $M, N, P$ là trung điểm của 3 cạnh tam giác. Chu vi tam giác $MNP$ bằng:",
    "options": [
      {
        "text": "$15$ cm",
        "correct": true
      },
      {
        "text": "$10$ cm",
        "correct": false
      },
      {
        "text": "$7{,}5$ cm",
        "correct": false
      },
      {
        "text": "$60$ cm",
        "correct": false
      }
    ],
    "explanation": "Chu vi tam giác trung bình bằng nửa chu vi tam giác lớn: $30 : 2 = 15$ cm."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Phân Giác Trong Tam Giác Vuông",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ vuông tại $A$ có $AB = 6$ cm, $AC = 8$ cm. Kẻ phân giác $AD$. Tỉ số $\\frac{DB}{DC}$ bằng:",
    "options": [
      {
        "text": "$\\frac{3}{4}$",
        "correct": true
      },
      {
        "text": "$\\frac{4}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{4}{5}$",
        "correct": false
      }
    ],
    "explanation": "$\\frac{DB}{DC} = \\frac{AB}{AC} = \\frac{6}{8} = \\frac{3}{4}$."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Đo Chiều Cao Thực Tế",
    "pts": 20,
    "question": "Một người cắm một chiếc cọc cao $2$ m vuông góc với mặt đất, cọc có bóng dài $1{,}6$ m. Cùng thời điểm đó, bóng của cột cờ trên sân trường dài $12$ m. Chiều cao của cột cờ là:",
    "options": [
      {
        "text": "$15$ m",
        "correct": true
      },
      {
        "text": "$12$ m",
        "correct": false
      },
      {
        "text": "$18$ m",
        "correct": false
      },
      {
        "text": "$9{,}6$ m",
        "correct": false
      }
    ],
    "explanation": "Theo hệ quả Thalès: $\\frac{H}{2} = \\frac{12}{1{,}6} = 7{,}5 \\implies H = 2 \\cdot 7{,}5 = 15$ m."
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

                const data = [
                    { name: 'ĐỊNH LÍ THALÈS & HỆ QUẢ', form: 'AM/AB = AN/AC = MN/BC (khi MN // BC)', col: '#6366f1' },
                    { name: 'ĐƯỜNG TRUNG BÌNH', form: 'MN // BC  và  MN = 1/2 BC (M, N là trung điểm)', col: '#06b6d4' },
                    { name: 'TÍNH CHẤT ĐƯỜNG PHÂN GIÁC', form: 'DB/DC = AB/AC (AD là phân giác góc A)', col: '#f59e0b' }
                ];

                function show(i) {
                    const item = data[i];
                    outEl.innerHTML = `<strong>Chuyên đề:</strong> <span style="color:${item.col}; font-weight:700;">${item.name}</span><br><strong>Công thức vàng:</strong> $${item.form}$`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = item.col;
                    ctx.fillRect(40, 50, w - 80, 80);

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 16px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(item.name, w / 2, 80);
                    ctx.font = 'bold 18px Times New Roman';
                    ctx.fillText(item.form, w / 2, 110);
                    ctx.textAlign = 'left';
                }

                document.getElementById('btnTh1').addEventListener('click', () => show(0));
                document.getElementById('btnTh2').addEventListener('click', () => show(1));
                document.getElementById('btnTh3').addEventListener('click', () => show(2));
                show(0);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const btn = document.getElementById('btnSolveMeasure');
                const outEl = document.getElementById('lab2Output');

                function render() {
                    outEl.innerHTML = `
                        <strong>Bài toán:</strong> Một chiếc cọc cao $1{,}5$ m cắm vuông góc với mặt đất có bóng dài $2$ m. Cùng thời điểm đó, ngọn hải đăng có bóng trên mặt đất dài $40$ m.<br>
                        <strong>Lời giải:</strong> Theo hệ quả định lí Thalès: $\\frac{H}{1{,}5} = \\frac{40}{2} = 20 \\implies H = 1{,}5 \\cdot 20 = \\mathbf{30}$ mét.
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#10b981';
                    ctx.fillRect(60, 60, w - 120, 60);

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 20px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText('CHIỀU CAO NGỌN HẢI ĐĂNG = 30 MÉT', w / 2, 98);
                    ctx.textAlign = 'left';
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
