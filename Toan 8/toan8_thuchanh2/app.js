// ================================================================
// HOẠT ĐỘNG THỰC HÀNH TRẢI NGHIỆM 2: TÍNH TOÁN ĐA THỨC VỚI GEOGEBRA - TOÁN 8 KNTT
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
  userTitle: 'Chuyên Gia Máy Tính Đại Số GeoGebra 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_thuchanh2_state';

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
    "id": "q1",
    "title": "Thử thách 1: Cửa sổ tính toán CAS",
    "pts": 20,
    "question": "Trong phần mềm GeoGebra, từ viết tắt CAS là viết tắt của cụm từ tiếng Anh nào?",
    "options": [
      {
        "text": "Computer Algebra System",
        "correct": true
      },
      {
        "text": "Calculator Advanced Software",
        "correct": false
      },
      {
        "text": "Computer Arithmetic Science",
        "correct": false
      },
      {
        "text": "Central Algebraic Solver",
        "correct": false
      }
    ],
    "explanation": "CAS là viết tắt của Computer Algebra System (Hệ thống đại số máy tính)."
  },
  {
    "id": "q2",
    "title": "Thử thách 2: Lệnh khai triển biểu thức",
    "pts": 20,
    "question": "Để khai triển biểu thức $(x + 2)^3$ trong cửa sổ CAS của GeoGebra, ta dùng lệnh:",
    "options": [
      {
        "text": "<code>Expand((x + 2)^3)</code> hoặc <code>KhaiTriển((x + 2)^3)</code>",
        "correct": true
      },
      {
        "text": "<code>Factor((x + 2)^3)</code>",
        "correct": false
      },
      {
        "text": "<code>Solve((x + 2)^3)</code>",
        "correct": false
      },
      {
        "text": "<code>Root((x + 2)^3)</code>",
        "correct": false
      }
    ],
    "explanation": "Lệnh <code>Expand</code> (KhaiTriển) dùng để thực hiện phép nhân và khai triển đa thức."
  },
  {
    "id": "q3",
    "title": "Thử thách 3: Lệnh phân tích đa thức thành nhân tử",
    "pts": 20,
    "question": "Kết quả trả về của lệnh <code>Factor(x^2 - 16)</code> trong GeoGebra CAS là:",
    "options": [
      {
        "text": "$(x - 4)(x + 4)$",
        "correct": true
      },
      {
        "text": "$(x - 4)^2$",
        "correct": false
      },
      {
        "text": "$(x + 4)^2$",
        "correct": false
      },
      {
        "text": "$x(x - 16)$",
        "correct": false
      }
    ],
    "explanation": "Lệnh <code>Factor</code> phân tích đa thức thành nhân tử: $x^2 - 16 = (x - 4)(x + 4)$."
  },
  {
    "id": "q4",
    "title": "Thử thách 4: Kết quả lệnh Expand",
    "pts": 20,
    "question": "Nhập vào CAS lệnh <code>Expand((2x - y)^2)</code>, kết quả nhận được là:",
    "options": [
      {
        "text": "$4x^2 - 4xy + y^2$",
        "correct": true
      },
      {
        "text": "$2x^2 - 2xy + y^2$",
        "correct": false
      },
      {
        "text": "$4x^2 - 2xy + y^2$",
        "correct": false
      },
      {
        "text": "$4x^2 - y^2$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng hằng đẳng thức: $(2x - y)^2 = (2x)^2 - 2(2x)y + y^2 = 4x^2 - 4xy + y^2$."
  },
  {
    "id": "q5",
    "title": "Thử thách 5: Lệnh rút gọn biểu thức",
    "pts": 20,
    "question": "Lệnh nào sau đây dùng để rút gọn và thu gọn các hạng tử đồng dạng của đa thức trong GeoGebra?",
    "options": [
      {
        "text": "<code>Simplify(...)</code> hoặc <code>RútGọn(...)</code>",
        "correct": true
      },
      {
        "text": "<code>Divide(...)</code>",
        "correct": false
      },
      {
        "text": "<code>Substitute(...)</code>",
        "correct": false
      },
      {
        "text": "<code>Derivative(...)</code>",
        "correct": false
      }
    ],
    "explanation": "Lệnh <code>Simplify</code> (RútGọn) thu gọn biểu thức và giản ước hạng tử đồng dạng."
  },
  {
    "id": "q6",
    "title": "Thử thách 6: Tính giá trị biểu thức",
    "pts": 20,
    "question": "Để tính giá trị của biểu thức $P = x^2 - 5x + 6$ tại $x = 3$ trong CAS, ta dùng lệnh:",
    "options": [
      {
        "text": "<code>Substitute(x^2 - 5x + 6, x, 3)</code>",
        "correct": true
      },
      {
        "text": "<code>Expand(x^2 - 5x + 6, 3)</code>",
        "correct": false
      },
      {
        "text": "<code>Factor(x^2 - 5x + 6, 3)</code>",
        "correct": false
      },
      {
        "text": "<code>Value(x^2 - 5x + 6, 3)</code>",
        "correct": false
      }
    ],
    "explanation": "Lệnh <code>Substitute(biểu_thức, biến, giá_trị)</code> dùng để thay giá trị số vào biến."
  },
  {
    "id": "q7",
    "title": "Thử thách 7: Phân tích tổng hai lập phương",
    "pts": 20,
    "question": "Kết quả của lệnh <code>Factor(x^3 + 8)</code> trong GeoGebra CAS là:",
    "options": [
      {
        "text": "$(x + 2)(x^2 - 2x + 4)$",
        "correct": true
      },
      {
        "text": "$(x + 2)^3$",
        "correct": false
      },
      {
        "text": "$(x + 2)(x^2 + 2x + 4)$",
        "correct": false
      },
      {
        "text": "$(x - 2)(x^2 + 2x + 4)$",
        "correct": false
      }
    ],
    "explanation": "Hằng đẳng thức tổng hai lập phương: $x^3 + 8 = x^3 + 2^3 = (x + 2)(x^2 - 2x + 4)$."
  },
  {
    "id": "q8",
    "title": "Thử thách 8: Kiểm tra hai biểu thức đồng nhất",
    "pts": 20,
    "question": "Trong GeoGebra CAS, để kiểm tra xem $(x + 1)(x - 1)$ có luôn bằng $x^2 - 1$ hay không, ta nhập cú pháp:",
    "options": [
      {
        "text": "<code>(x + 1)(x - 1) == x^2 - 1</code>",
        "correct": true
      },
      {
        "text": "<code>(x + 1)(x - 1) = x^2 - 1</code>",
        "correct": false
      },
      {
        "text": "<code>Check((x + 1)(x - 1), x^2 - 1)</code>",
        "correct": false
      },
      {
        "text": "<code>Compare((x + 1)(x - 1), x^2 - 1)</code>",
        "correct": false
      }
    ],
    "explanation": "Toán tử kiểm tra bằng trong CAS là <code>==</code>, kết quả trả về <code>true</code> nếu hai vế là đồng nhất thức."
  },
  {
    "id": "q9",
    "title": "Thử thách 9: Khai triển tích $(x - 1)(x^2 + x + 1)$",
    "pts": 20,
    "question": "Lệnh <code>Expand((x - 1)*(x^2 + x + 1))</code> cho kết quả là:",
    "options": [
      {
        "text": "$x^3 - 1$",
        "correct": true
      },
      {
        "text": "$x^3 + 1$",
        "correct": false
      },
      {
        "text": "$x^3 - 3x + 1$",
        "correct": false
      },
      {
        "text": "$x^2 - 1$",
        "correct": false
      }
    ],
    "explanation": "Đây là dạng khai triển của hiệu hai lập phương: $(x - 1)(x^2 + x + 1) = x^3 - 1$."
  },
  {
    "id": "q10",
    "title": "Thử thách 10: Ưu điểm của phần mềm GeoGebra",
    "pts": 20,
    "question": "Ưu điểm vượt trội của việc học toán với phần mềm GeoGebra là:",
    "options": [
      {
        "text": "Kết hợp trực quan giữa đại số và hình học, giúp kiểm tra kết quả và hiểu sâu bản chất kiến thức",
        "correct": true
      },
      {
        "text": "Làm thay hoàn toàn tư duy của học sinh, không cần học lý thuyết",
        "correct": false
      },
      {
        "text": "Chỉ dùng để vẽ các đường thẳng đơn giản, không tính toán được đại số",
        "correct": false
      },
      {
        "text": "Bắt buộc phải kết nối mạng internet liên tục mới dùng được",
        "correct": false
      }
    ],
    "explanation": "GeoGebra kết nối trực quan giữa hình học động và đại số máy tính, là công cụ hỗ trợ đắc lực nâng cao năng lực toán học."
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
        const ctx = canvas ? canvas.getContext('2d') : null;
        const selCmd = document.getElementById('selCasCmd');
        const selExpr = document.getElementById('selCasExpr');
        const btnRun = document.getElementById('btnRunCas');
        const outCas = document.getElementById('labOutCas');

        const casDatabase = [
          { expr: '(x + 2y)^2', expand: 'x^2 + 4xy + 4y^2', factor: '(x + 2y)^2', simplify: 'x^2 + 4xy + 4y^2', subst: 'Thay x=2, y=1: (2 + 2)^2 = 16' },
          { expr: '(2x - 3)^3', expand: '8x^3 - 36x^2 + 54x - 27', factor: '(2x - 3)^3', simplify: '8x^3 - 36x^2 + 54x - 27', subst: 'Thay x=2: (4 - 3)^3 = 1' },
          { expr: 'x^2 - 16y^2', expand: 'x^2 - 16y^2', factor: '(x - 4y)(x + 4y)', simplify: 'x^2 - 16y^2', subst: 'Thay x=5, y=1: 25 - 16 = 9' },
          { expr: 'x^3 + 27', expand: 'x^3 + 27', factor: '(x + 3)(x^2 - 3x + 9)', simplify: 'x^3 + 27', subst: 'Thay x=1: 1 + 27 = 28' },
          { expr: '(x + 1)(x - 1) - (x^2 - 4)', expand: '(x^2 - 1) - (x^2 - 4) = 3', factor: '3', simplify: '3', subst: 'Giá trị không đổi: 3 (với mọi x)' }
        ];

        function runCasSimulation() {
          if (!selCmd || !selExpr || !outCas) return;
          const cmd = selCmd.value;
          const idx = parseInt(selExpr.value) || 0;
          const item = casDatabase[idx];

          let cmdName = 'Expand';
          let resText = item.expand;
          if (cmd === 'factor') { cmdName = 'Factor'; resText = item.factor; }
          else if (cmd === 'simplify') { cmdName = 'Simplify'; resText = item.simplify; }
          else if (cmd === 'substitute') { cmdName = 'Substitute'; resText = item.subst; }

          outCas.innerHTML = `
            💻 <strong>Dòng lệnh GeoGebra CAS:</strong><br>
            • Cú pháp: <code>${cmdName}(${item.expr})</code><br>
            • Kết quả xử lý: <strong style="color: #38bdf8; font-size: 15px;">${resText}</strong><br>
            ✨ <em>Tính toán ký hiệu chính xác 100%, không làm tròn số thập phân.</em>
          `;

          if (!ctx) return;
          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          // Vẽ cửa sổ GeoGebra CAS ảo
          ctx.fillStyle = '#1e1b4b';
          ctx.fillRect(20, 20, w - 40, h - 40);
          ctx.strokeStyle = '#4338ca';
          ctx.lineWidth = 2;
          ctx.strokeRect(20, 20, w - 40, h - 40);

          // Thanh tiêu đề CAS
          ctx.fillStyle = '#312e81';
          ctx.fillRect(20, 20, w - 40, 32);
          ctx.fillStyle = '#e0e7ff';
          ctx.font = 'bold 12px Inter, sans-serif';
          ctx.textAlign = 'left';
          ctx.fillText('GeoGebra CAS - Cửa Sổ Đại Số Máy Tính', 35, 41);

          // Dòng 1: Input
          ctx.fillStyle = '#94a3b8';
          ctx.font = '12px "Courier New", monospace';
          ctx.fillText('1  Input:   ' + cmdName + '(' + item.expr + ')', 40, 85);

          // Dòng 1: Output
          ctx.fillStyle = '#34d399';
          ctx.font = 'bold 13px "Courier New", monospace';
          ctx.fillText('   Output:  ' + resText, 40, 125);

          // Trạng thái kiểm chứng
          ctx.fillStyle = '#f59e0b';
          ctx.font = 'italic 11px Inter, sans-serif';
          ctx.fillText('✓ Kết quả đồng nhất toán học đã kiểm chứng', 40, 165);
        }

        if (btnRun) btnRun.addEventListener('click', runCasSimulation);
        if (selCmd) selCmd.addEventListener('change', runCasSimulation);
        if (selExpr) selExpr.addEventListener('change', runCasSimulation);
        runCasSimulation();
      
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
        const canvas2 = document.getElementById('labCanvas2');
        const ctx2 = canvas2 ? canvas2.getContext('2d') : null;
        const sliderA2 = document.getElementById('sliderA2');
        const sliderB2 = document.getElementById('sliderB2');
        const valA2 = document.getElementById('valA2');
        const valB2 = document.getElementById('valB2');
        const outSquare = document.getElementById('labOutSquare');

        function drawSquareModel() {
          if (!ctx2 || !sliderA2 || !sliderB2) return;
          const a = parseInt(sliderA2.value);
          const b = parseInt(sliderB2.value);

          if (valA2) valA2.textContent = a;
          if (valB2) valB2.textContent = b;

          const totalSide = a + b;
          const areaTotal = totalSide * totalSide;
          const areaA2 = a * a;
          const areaB2 = b * b;
          const areaAB = a * b;

          if (outSquare) {
            outSquare.innerHTML = `
              📐 <strong>Phân Tích Diện Tích Hình Vuông Lớn Cạnh $(a + b)$:</strong><br>
              • Tổng diện tích: $(a + b)^2 = (${a} + ${b})^2 = ${totalSide}^2 = $ <strong>${areaTotal}</strong> px²<br>
              • Khối $a^2$ (Tím): <strong>${areaA2}</strong> px² • Khối $b^2$ (Vàng): <strong>${areaB2}</strong> px²<br>
              • 2 Khối $ab$ (Cyan): $2 \\times ${areaAB} = $ <strong>${2 * areaAB}</strong> px²<br>
              🚀 Kiểm chứng: $a^2 + 2ab + b^2 = ${areaA2} + ${2 * areaAB} + ${areaB2} = $ <strong style="color: #34d399;">${areaTotal} px²</strong> (Đúng tuyệt đối!)
            `;
          }

          const w = canvas2.width;
          const h = canvas2.height;
          ctx2.clearRect(0, 0, w, h);

          // Căn giữa hình vuông
          const startX = Math.round((w - totalSide) / 2);
          const startY = Math.round((h - totalSide) / 2);

          // 1. Khối a^2 (Tím)
          ctx2.fillStyle = '#6366f1';
          ctx2.fillRect(startX, startY, a, a);
          ctx2.strokeStyle = '#ffffff';
          ctx2.lineWidth = 1.5;
          ctx2.strokeRect(startX, startY, a, a);

          // 2. Khối ab góc trên phải (Cyan)
          ctx2.fillStyle = '#06b6d4';
          ctx2.fillRect(startX + a, startY, b, a);
          ctx2.strokeRect(startX + a, startY, b, a);

          // 3. Khối ab góc dưới trái (Cyan)
          ctx2.fillStyle = '#06b6d4';
          ctx2.fillRect(startX, startY + a, a, b);
          ctx2.strokeRect(startX, startY + a, a, b);

          // 4. Khối b^2 góc dưới phải (Amber)
          ctx2.fillStyle = '#f59e0b';
          ctx2.fillRect(startX + a, startY + a, b, b);
          ctx2.strokeRect(startX + a, startY + a, b, b);

          // Nhãn chữ
          ctx2.fillStyle = '#ffffff';
          ctx2.font = 'bold 13px Inter, sans-serif';
          ctx2.textAlign = 'center';
          ctx2.textBaseline = 'middle';
          ctx2.fillText('a²', startX + a / 2, startY + a / 2);
          ctx2.fillText('b²', startX + a + b / 2, startY + a + b / 2);
          ctx2.fillText('ab', startX + a + b / 2, startY + a / 2);
          ctx2.fillText('ab', startX + a / 2, startY + a + b / 2);
        }

        if (sliderA2) sliderA2.addEventListener('input', drawSquareModel);
        if (sliderB2) sliderB2.addEventListener('input', drawSquareModel);
        drawSquareModel();
      
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
