// ================================================================
// BÀI 17: TÍNH CHẤT ĐƯỜNG PHÂN GIÁC CỦA TAM GIÁC - TOÁN 8 KNTT
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
  userTitle: 'Xạ Thủ Phân Giác 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai17_state';

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
    "title": "Thử Thách 1: Tỉ Lệ Đường Phân Giác",
    "pts": 20,
    "question": "Trong tam giác $ABC$, tia phân giác của góc $A$ cắt cạnh $BC$ tại $D$. Tỉ lệ thức nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$\\frac{DB}{DC} = \\frac{AB}{AC}$",
        "correct": true
      },
      {
        "text": "$\\frac{DB}{DC} = \\frac{AC}{AB}$",
        "correct": false
      },
      {
        "text": "$\\frac{DB}{AB} = \\frac{AC}{DC}$",
        "correct": false
      },
      {
        "text": "$\\frac{DB}{BC} = \\frac{AB}{AC}$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí tính chất đường phân giác trong tam giác: $\\frac{DB}{DC} = \\frac{AB}{AC}$."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Tính Đoạn Thẳng Đơn Giản",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có phân giác $AD$. Biết $AB = 4$ cm, $AC = 6$ cm và $DB = 2$ cm. Độ dài đoạn thẳng $DC$ là:",
    "options": [
      {
        "text": "$3$ cm",
        "correct": true
      },
      {
        "text": "$4$ cm",
        "correct": false
      },
      {
        "text": "$2$ cm",
        "correct": false
      },
      {
        "text": "$5$ cm",
        "correct": false
      }
    ],
    "explanation": "$\\frac{DB}{DC} = \\frac{AB}{AC} \\implies \\frac{2}{DC} = \\frac{4}{6} \\implies DC = \\frac{2 \\cdot 6}{4} = 3$ cm."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Tính Cạnh Tam Giác",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có $AD$ là phân giác. Biết $AB = 5$ cm, $DB = 3$ cm, $DC = 6$ cm. Độ dài cạnh $AC$ là:",
    "options": [
      {
        "text": "$10$ cm",
        "correct": true
      },
      {
        "text": "$8$ cm",
        "correct": false
      },
      {
        "text": "$12$ cm",
        "correct": false
      },
      {
        "text": "$2{,}5$ cm",
        "correct": false
      }
    ],
    "explanation": "$\\frac{DB}{DC} = \\frac{AB}{AC} \\implies \\frac{3}{6} = \\frac{5}{AC} \\implies AC = \\frac{6 \\cdot 5}{3} = 10$ cm."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Tính Khi Biết Độ Dài Toàn Bộ Đáy",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có $AB = 6$ cm, $AC = 8$ cm, $BC = 7$ cm. Đường phân giác $AD$ chia cạnh $BC$ thành hai đoạn. Độ dài đoạn $DB$ là:",
    "options": [
      {
        "text": "$3$ cm",
        "correct": true
      },
      {
        "text": "$4$ cm",
        "correct": false
      },
      {
        "text": "$3{,}5$ cm",
        "correct": false
      },
      {
        "text": "$2$ cm",
        "correct": false
      }
    ],
    "explanation": "$\\frac{DB}{6} = \\frac{DC}{8} = \\frac{DB + DC}{6 + 8} = \\frac{7}{14} = 0{,}5 \\implies DB = 6 \\cdot 0{,}5 = 3$ cm."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Độ Dài Đoạn $DC$",
    "pts": 20,
    "question": "Cùng giả thiết câu trên ($AB = 6, AC = 8, BC = 7$), độ dài đoạn $DC$ là:",
    "options": [
      {
        "text": "$4$ cm",
        "correct": true
      },
      {
        "text": "$3$ cm",
        "correct": false
      },
      {
        "text": "$5$ cm",
        "correct": false
      },
      {
        "text": "$3{,}5$ cm",
        "correct": false
      }
    ],
    "explanation": "$DC = BC - DB = 7 - 3 = 4$ cm (hoặc $8 \\cdot 0{,}5 = 4$ cm)."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Tam Giác Cân Có Phân Giác",
    "pts": 20,
    "question": "Cho tam giác $ABC$ cân tại $A$. Đường phân giác $AD$ chia cạnh đáy $BC$ thành hai đoạn $DB$ và $DC$. Khẳng định nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$DB = DC$",
        "correct": true
      },
      {
        "text": "$DB = 2DC$",
        "correct": false
      },
      {
        "text": "$DB > DC$",
        "correct": false
      },
      {
        "text": "$DB < DC$",
        "correct": false
      }
    ],
    "explanation": "Vì $\\Delta ABC$ cân tại $A$ nên $AB = AC \\implies \\frac{DB}{DC} = \\frac{AB}{AC} = 1 \\implies DB = DC$ (khi đó $AD$ vừa là phân giác vừa là trung tuyến)."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Đường Phân Giác Ngoài",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có phân giác ngoài $AD'$ ($D' \\in BC$). Biết $AB = 3$ cm, $AC = 5$ cm. Tỉ số $\\frac{D'B}{D'C}$ bằng:",
    "options": [
      {
        "text": "$\\frac{3}{5}$",
        "correct": true
      },
      {
        "text": "$\\frac{5}{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{8}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Theo tính chất đường phân giác ngoài: $\\frac{D'B}{D'C} = \\frac{AB}{AC} = \\frac{3}{5}$."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Tỉ Số Diện Tích Hai Tam Giác",
    "pts": 20,
    "question": "Đường phân giác $AD$ của $\\Delta ABC$ chia tam giác thành hai tam giác $\\Delta ABD$ và $\\Delta ACD$. Tỉ số diện tích $\\frac{S_{\\Delta ABD}}{S_{\\Delta ACD}}$ bằng:",
    "options": [
      {
        "text": "$\\frac{AB}{AC}$",
        "correct": true
      },
      {
        "text": "$\\frac{AB^2}{AC^2}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$\\frac{BC}{AB}$",
        "correct": false
      }
    ],
    "explanation": "Hai tam giác $\\Delta ABD$ và $\\Delta ACD$ có chung đường cao hạ từ $A$ xuống $BC$, nên tỉ số diện tích bằng tỉ số hai đáy: $\\frac{S_{\\Delta ABD}}{S_{\\Delta ACD}} = \\frac{DB}{DC} = \\frac{AB}{AC}$."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Phân Giác Góc Vuông",
    "pts": 20,
    "question": "Cho tam giác $ABC$ vuông tại $A$ có $AB = 3$ cm, $AC = 4$ cm. Độ dài cạnh huyền $BC = 5$ cm. Đường phân giác $AD$ chia cạnh huyền thành đoạn $DB$ có độ dài là:",
    "options": [
      {
        "text": "$\\frac{15}{7}$ cm",
        "correct": true
      },
      {
        "text": "$\\frac{20}{7}$ cm",
        "correct": false
      },
      {
        "text": "$2$ cm",
        "correct": false
      },
      {
        "text": "$2{,}5$ cm",
        "correct": false
      }
    ],
    "explanation": "$\\frac{DB}{DC} = \\frac{AB}{AC} = \\frac{3}{4} \\implies \\frac{DB}{3} = \\frac{DC}{4} = \\frac{BC}{3+4} = \\frac{5}{7} \\implies DB = \\frac{3 \\cdot 5}{7} = \\frac{15}{7}$ cm."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Tổng Quát Phân Giác",
    "pts": 20,
    "question": "Nếu điểm $D$ nằm trên cạnh $BC$ của $\\Delta ABC$ thỏa mãn $\\frac{DB}{DC} = \\frac{AB}{AC}$ thì tia $AD$ là:",
    "options": [
      {
        "text": "Tia phân giác của góc $\\widehat{BAC}$",
        "correct": true
      },
      {
        "text": "Đường trung tuyến của $\\Delta ABC$",
        "correct": false
      },
      {
        "text": "Đường cao của $\\Delta ABC$",
        "correct": false
      },
      {
        "text": "Đường trung trực của $BC$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí đảo về tính chất đường phân giác, nếu điểm $D$ chia trong cạnh $BC$ theo tỉ số $\\frac{AB}{AC}$ thì $AD$ là tia phân giác của $\\widehat{BAC}$."
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
                const btnReset = document.getElementById('btnResetBisect');

                let pA = { x: 260, y: 50 };
                const pB = { x: 100, y: 190 };
                const pC = { x: 500, y: 190 };
                let isDragging = false;

                function draw() {
                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const c = Math.hypot(pA.x - pB.x, pA.y - pB.y); // AB
                    const b = Math.hypot(pA.x - pC.x, pA.y - pC.y); // AC
                    const a = Math.hypot(pC.x - pB.x, pC.y - pB.y); // BC

                    // Toa do chan duong phan giac D: D = (b*B + c*C) / (b + c)
                    const dx = (b * pB.x + c * pC.x) / (b + c);
                    const dy = (b * pB.y + c * pC.y) / (b + c);

                    const db = Math.hypot(dx - pB.x, dy - pB.y);
                    const dc = Math.hypot(pC.x - dx, pC.y - dy);

                    const r1 = (c / b).toFixed(2);
                    const r2 = (db / dc).toFixed(2);

                    outEl.innerHTML = `
                        <strong>Tỉ số hai cạnh kề:</strong> $\\frac{AB}{AC} = \\frac{${Math.round(c)}}{${Math.round(b)}} = \\mathbf{${r1}}$<br>
                        <strong>Tỉ số hai đoạn trên đáy:</strong> $\\frac{DB}{DC} = \\frac{${Math.round(db)}}{${Math.round(dc)}} = \\mathbf{${r2}}$ (Khớp hoàn hảo!)
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    // Tam giac ABC
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(pA.x, pA.y); ctx.lineTo(pB.x, pB.y); ctx.lineTo(pC.x, pC.y);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
                    ctx.fill();
                    ctx.stroke();

                    // Duong phan giac AD
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(pA.x, pA.y); ctx.lineTo(dx, dy);
                    ctx.stroke();

                    // Diem
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('A', pA.x - 5, pA.y - 10);
                    ctx.fillText('B', pB.x - 18, pB.y + 10);
                    ctx.fillText('C', pC.x + 10, pC.y + 10);
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillText('D', dx - 5, dy + 20);

                    // Ky hieu 2 goc bang nhau tai A
                    ctx.fillStyle = '#06b6d4';
                    ctx.beginPath();
                    ctx.arc(pA.x, pA.y, 6, 0, Math.PI * 2);
                    ctx.fill();
                }

                canvas.addEventListener('mousedown', (e) => {
                    const rect = canvas.getBoundingClientRect();
                    const mx = e.clientX - rect.left;
                    const my = e.clientY - rect.top;
                    if (Math.hypot(pA.x - mx, pA.y - my) < 20) isDragging = true;
                });
                window.addEventListener('mousemove', (e) => {
                    if (isDragging) {
                        const rect = canvas.getBoundingClientRect();
                        pA.x = Math.max(120, Math.min(canvas.width - 120, e.clientX - rect.left));
                        pA.y = Math.max(30, Math.min(130, e.clientY - rect.top));
                        draw();
                    }
                });
                window.addEventListener('mouseup', () => { isDragging = false; });

                btnReset.addEventListener('click', () => {
                    pA = { x: 260, y: 50 };
                    draw();
                });
                draw();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const sAB = document.getElementById('sideAB');
                const sAC = document.getElementById('sideAC');
                const vAB = document.getElementById('vAB');
                const vAC = document.getElementById('vAC');
                const outEl = document.getElementById('lab2Output');

                function update() {
                    const c = parseInt(sAB.value);
                    const b = parseInt(sAC.value);
                    vAB.textContent = c;
                    vAC.textContent = b;

                    const a = 10; // BC = 10
                    const db = (a * c / (c + b)).toFixed(2);
                    const dc = (a * b / (c + b)).toFixed(2);

                    outEl.innerHTML = `
                        <strong>Áp dụng:</strong> $\\frac{DB}{${c}} = \\frac{DC}{${b}} = \\frac{BC}{${c} + ${b}} = \\frac{10}{${c + b}}$<br>
                        <strong>Độ dài đoạn $DB$:</strong> $DB = \\frac{10 \\cdot ${c}}{${c + b}} = \\mathbf{${db}}$ &nbsp;|&nbsp; 
                        <strong>Độ dài đoạn $DC$:</strong> $DC = \\frac{10 \\cdot ${b}}{${c + b}} = \\mathbf{${dc}}$
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#818cf8';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('PHÂN CHIA CẠNH ĐÁY BC = 10 THEO TỈ LỆ HAI CẠNH KỀ', 30, 40);

                    // Thanh day BC
                    const bx = 60, by = 90, bw = w - 120, bh = 35;
                    ctx.fillStyle = 'rgba(255,255,255,0.1)';
                    ctx.fillRect(bx, by, bw, bh);

                    const wDB = (c / (c + b)) * bw;
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(bx, by, wDB, bh);

                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(bx + wDB, by, bw - wDB, bh);

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText(`DB = ${db}`, bx + wDB / 2 - 25, by + 23);
                    ctx.fillText(`DC = ${dc}`, bx + wDB + (bw - wDB) / 2 - 25, by + 23);
                }

                sAB.addEventListener('input', update);
                sAC.addEventListener('input', update);
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
