// ================================================================
// BÀI 14: TRƯỜNG HỢP BẰNG NHAU THỨ HAI VÀ THỨ BA CỦA TAM GIÁC - TOÁN 7 KNTT
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
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));

  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
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
  if (window.renderMathInElement) {
    renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      strict: false
    });
  } else {
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        if (text && (text.includes('$') || text.includes('$$'))) {
          const span = document.createElement('span');
          span.innerHTML = formatMathText(text);
          node.parentNode.replaceChild(span, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
        Array.from(node.childNodes).forEach(walk);
      }
    }
    walk(root);
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
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type = 'sine', duration = 0.15, vol = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
  playClick() { this.playTone(600, 'sine', 0.08, 0.06); }
  playCorrect() {
    this.playTone(523.25, 'triangle', 0.12, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.12), 80);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.22, 0.15), 160);
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
  userTitle: 'Bậc Thầy Chứng Minh Tam Giác',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai14_state';

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
    "title": "Câu 1: Góc xen giữa hai cạnh",
    "pts": 20,
    "question": "Trong tam giác $ABC$, góc xen giữa hai cạnh $AB$ và $BC$ là góc nào?",
    "options": [
      {
        "text": "$\\\\widehat{B}$",
        "correct": true
      },
      {
        "text": "$\\\\widehat{A}$",
        "correct": false
      },
      {
        "text": "$\\\\widehat{C}$",
        "correct": false
      },
      {
        "text": "$\\\\widehat{BAC}$",
        "correct": false
      }
    ],
    "explanation": "Góc tạo bởi hai tia chung gốc $BA$ và $BC$ chính là góc $\\\\widehat{B}$, gọi là góc xen giữa hai cạnh $AB$ và $BC$."
  },
  {
    "id": 2,
    "title": "Câu 2: Điều kiện bằng nhau (c-g-c)",
    "pts": 20,
    "question": "Cho $\\\\triangle ABC$ và $\\\\triangle DEF$ có $AB = DE$ và $AC = DF$. Để hai tam giác này bằng nhau theo trường hợp (c-g-c), cần thêm điều kiện gì?",
    "options": [
      {
        "text": "$\\\\widehat{A} = \\\\widehat{D}$",
        "correct": true
      },
      {
        "text": "$\\\\widehat{B} = \\\\widehat{E}$",
        "correct": false
      },
      {
        "text": "$\\\\widehat{C} = \\\\widehat{F}$",
        "correct": false
      },
      {
        "text": "$BC = EF$",
        "correct": false
      }
    ],
    "explanation": "Góc xen giữa $AB, AC$ là $\\\\widehat{A}$; góc xen giữa $DE, DF$ là $\\\\widehat{D}$. Do đó điều kiện cần là $\\\\widehat{A} = \\\\widehat{D}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Cạnh kề hai góc",
    "pts": 20,
    "question": "Trong tam giác $MNP$, cạnh kề (cạnh xen giữa) hai góc $\\\\widehat{M}$ và $\\\\widehat{P}$ là cạnh nào?",
    "options": [
      {
        "text": "$MP$",
        "correct": true
      },
      {
        "text": "$MN$",
        "correct": false
      },
      {
        "text": "$NP$",
        "correct": false
      },
      {
        "text": "Không có cạnh nào",
        "correct": false
      }
    ],
    "explanation": "Cạnh nối hai đỉnh $M$ và $P$ là cạnh $MP$, kề với cả hai góc $\\\\widehat{M}$ và $\\\\widehat{P}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Điều kiện bằng nhau (g-c-g)",
    "pts": 20,
    "question": "Cho $\\\\triangle ABC$ và $\\\\triangle MNP$ có $\\\\widehat{B} = \\\\widehat{N}$ và $\\\\widehat{C} = \\\\widehat{P}$. Để hai tam giác bằng nhau theo trường hợp (g-c-g), cần thêm điều kiện gì?",
    "options": [
      {
        "text": "$BC = NP$",
        "correct": true
      },
      {
        "text": "$AB = MN$",
        "correct": false
      },
      {
        "text": "$AC = MP$",
        "correct": false
      },
      {
        "text": "$\\\\widehat{A} = \\\\widehat{M}$",
        "correct": false
      }
    ],
    "explanation": "Hai góc đã cho là $\\\\widehat{B}$ và $\\\\widehat{C}$, cạnh xen giữa hai góc này là $BC$. Do đó cần $BC = NP$."
  },
  {
    "id": 5,
    "title": "Câu 5: Trường hợp góc - góc - góc",
    "pts": 20,
    "question": "Nếu hai tam giác có ba góc tương ứng bằng nhau thì:",
    "options": [
      {
        "text": "Chưa chắc bằng nhau (chỉ đồng dạng)",
        "correct": true
      },
      {
        "text": "Chắc chắn bằng nhau theo trường hợp (g-g-g)",
        "correct": false
      },
      {
        "text": "Có diện tích bằng nhau",
        "correct": false
      },
      {
        "text": "Có chu vi bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Hai tam giác có ba góc bằng nhau có thể có kích thước to nhỏ khác nhau (ví dụ một tam giác đều cạnh 1 cm và một tam giác đều cạnh 10 cm), nên không có trường hợp bằng nhau (g-g-g)."
  },
  {
    "id": 6,
    "title": "Câu 6: Tia phân giác và tam giác bằng nhau",
    "pts": 20,
    "question": "Cho góc $\\\\widehat{xOy}$ có tia phân giác $Ot$. Lấy $A$ trên $Ox$, $B$ trên $Oy$ sao cho $OA = OB$. Lấy $M$ bất kì trên tia $Ot$. Hai tam giác $\\\\triangle OAM$ và $\\\\triangle OBM$ bằng nhau theo trường hợp nào?",
    "options": [
      {
        "text": "c-g-c",
        "correct": true
      },
      {
        "text": "c-c-c",
        "correct": false
      },
      {
        "text": "g-c-g",
        "correct": false
      },
      {
        "text": "Không bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Có $OA = OB$, cạnh $OM$ chung và góc xen giữa $\\\\widehat{AOM} = \\\\widehat{BOM}$ (do $Ot$ là phân giác), nên $\\\\triangle OAM = \\\\triangle OBM$ (c-g-c)."
  },
  {
    "id": 7,
    "title": "Câu 7: Đoán nhận tam giác bằng nhau",
    "pts": 20,
    "question": "Cho hình bình hành $ABCD$. Đường chéo $AC$ chia hình bình hành thành hai tam giác $\\\\triangle ABC$ và $\\\\triangle CDA$. Chúng bằng nhau theo trường hợp nào?",
    "options": [
      {
        "text": "Cả c-c-c, c-g-c và g-c-g đều có thể áp dụng",
        "correct": true
      },
      {
        "text": "Chỉ có thể áp dụng c-c-c",
        "correct": false
      },
      {
        "text": "Chỉ có thể áp dụng g-c-g",
        "correct": false
      },
      {
        "text": "Không thể chứng minh bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Vì các cạnh đối bằng nhau ($AB=CD, BC=DA, AC$ chung) $\\\\implies$ c-c-c; các góc so le trong bằng nhau $\\\\implies$ g-c-g; 2 cạnh và góc xen giữa bằng nhau $\\\\implies$ c-g-c."
  },
  {
    "id": 8,
    "title": "Câu 8: Khẳng định sai về góc không xen giữa",
    "pts": 20,
    "question": "Nếu hai tam giác có hai cạnh và một góc bằng nhau nhưng góc đó không xen giữa hai cạnh, thì hai tam giác đó:",
    "options": [
      {
        "text": "Chưa chắc bằng nhau",
        "correct": true
      },
      {
        "text": "Luôn luôn bằng nhau",
        "correct": false
      },
      {
        "text": "Không bao giờ bằng nhau",
        "correct": false
      },
      {
        "text": "Bằng nhau theo trường hợp (c-g-c)",
        "correct": false
      }
    ],
    "explanation": "Góc phải là góc xen giữa hai cạnh đã cho thì mới đảm bảo tam giác xác định duy nhất. Nếu góc không xen giữa thì có thể dựng được hai tam giác khác nhau."
  },
  {
    "id": 9,
    "title": "Câu 9: Ứng dụng đo khoảng cách bờ sông",
    "pts": 20,
    "question": "Để đo khoảng cách giữa hai điểm $A$ (bên kia sông) và $B$ (bên này sông), người ta dựng đoạn thẳng $BC$, rồi dựng góc $\\\\widehat{BCD} = \\\\widehat{ABC}$ và $\\\\widehat{CBD} = \\\\widehat{ACB}$ sao cho $D$ ở trên bờ. Khoảng cách $AB$ bằng đoạn thẳng nào?",
    "options": [
      {
        "text": "$CD$",
        "correct": true
      },
      {
        "text": "$BD$",
        "correct": false
      },
      {
        "text": "$BC$",
        "correct": false
      },
      {
        "text": "$\\\\frac{1}{2}CD$",
        "correct": false
      }
    ],
    "explanation": "Theo cách dựng, $\\\\triangle ABC = \\\\triangle DCB$ (g-c-g) $\\\\implies AB = CD$ (hai cạnh tương ứng)."
  },
  {
    "id": 10,
    "title": "Câu 10: Tính cạnh từ tam giác bằng nhau",
    "pts": 20,
    "question": "Cho $\\\\triangle ABC = \\\\triangle DEF$ (g-c-g). Biết $AB = 6\\\\text{ cm}$, $\\\\widehat{A} = 60^\\\\circ$, $\\\\widehat{B} = 50^\\\\circ$. Độ dài cạnh $DE$ là:",
    "options": [
      {
        "text": "$6\\\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$5\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$7\\\\text{ cm}$",
        "correct": false
      },
      {
        "text": "Chưa thể kết luận",
        "correct": false
      }
    ],
    "explanation": "Vì $\\\\triangle ABC = \\\\triangle DEF$ nên cạnh tương ứng $DE = AB = 6\\\\text{ cm}$."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let answeredCount = 0;
  let correctCount = 0;

  quizData.forEach((q, qIndex) => {
    const isAnswered = appState.answered[q.id] !== undefined;
    const userAnswer = appState.answered[q.id];
    if (isAnswered) {
      answeredCount++;
      if (q.options[userAnswer] && q.options[userAnswer].correct) correctCount++;
    }

    const card = document.createElement('div');
    card.className = 'quiz-card';
    if (q.question && (q.question.includes('<table') || q.question.includes('quiz-table') || q.question.length > 250)) {
      card.classList.add('full-width');
    }

    // Header câu hỏi
    const qHeader = document.createElement('div');
    qHeader.className = 'quiz-card-header';
    qHeader.innerHTML = `<span><strong>${q.title || ('Câu ' + (qIndex + 1))}</strong></span><span class="quiz-badge">+${q.pts || 20} XP</span>`;
    card.appendChild(qHeader);

    // Nội dung câu hỏi
    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    // Danh sách đáp án nút
    const optList = document.createElement('div');
    optList.className = 'quiz-options';
    const labels = ['A', 'B', 'C', 'D'];

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;

      if (isAnswered) {
        btn.disabled = true;
        if (opt.correct) btn.classList.add('correct');
        if (userAnswer === optIndex && !opt.correct) btn.classList.add('wrong');
      } else {
        btn.onclick = () => selectAnswer(q.id, optIndex, opt.correct, q.pts || 20);
      }
      optList.appendChild(btn);
    });
    card.appendChild(optList);

    // Giải thích chi tiết
    if (isAnswered) {
      const explanation = document.createElement('div');
      explanation.className = 'explanation-box show';
      explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;
      card.appendChild(explanation);
    }

    container.appendChild(card);
  });

  // Cập nhật tiến độ Arena
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progEl) progEl.textContent = `${answeredCount}/${quizData.length}`;
  if (scoreEl) scoreEl.textContent = `${appState.xp} XP`;

  // Mở khóa Huy hiệu 4 & 5
  if (appState.xp >= 160) unlockBadge(3);
  if (correctCount === quizData.length && quizData.length > 0) {
    unlockBadge(4);
    if (!appState.badges[4]) sound.playFanfare();
  }

  // Quét KaTeX
  renderMathInTree(container);
}

function selectAnswer(qid, optIndex, isCorrect, pts) {
  if (appState.answered[qid] !== undefined) return;
  sound.init();

  appState.answered[qid] = optIndex;
  if (isCorrect) {
    appState.xp += pts;
    appState.streak += 1;
    sound.playCorrect();
    if (appState.streak >= 5) unlockBadge(2);
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
      if (target === 'labs') unlockBadge(1);

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
  try {
    
                const canvas = document.getElementById('labCanvas1');
                const ctx = canvas.getContext('2d');
                let angA = 60;
                const cAB = 120;
                const cAC = 150;

                function drawCGC() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const ax = 80;
                    const ay = h * 0.75;
                    const cx = ax + cAC;
                    const cy = ay;

                    const rad = angA * Math.PI / 180;
                    const bx = ax + cAB * Math.cos(rad);
                    const by = ay - cAB * Math.sin(rad);

                    // Tam giac ABC
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.closePath();
                    ctx.fill();

                    // Hai canh da biet
                    ctx.strokeStyle = '#6366f1'; ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
                    ctx.strokeStyle = '#06b6d4';
                    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(cx, cy); ctx.stroke();

                    // Canh thu ba BC (khong doi khi goc va 2 canh co dinh)
                    ctx.strokeStyle = '#f43f5e'; ctx.lineWidth = 3; ctx.setLineDash([5, 3]);
                    ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(cx, cy); ctx.stroke();
                    ctx.setLineDash([]);

                    // Cung goc xen giua A
                    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(ax, ay, 35, -rad, 0); ctx.stroke();

                    // Dinh
                    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText(`A (${angA}°)`, ax - 25, ay + 15);
                    ctx.fillText(`B`, bx - 10, by - 10);
                    ctx.fillText(`C`, cx + 8, cy + 15);

                    const bcLen = Math.round(Math.sqrt(cAB*cAB + cAC*cAC - 2*cAB*cAC*Math.cos(rad)));
                    const out = document.getElementById('lab1CGCOut');
                    out.innerHTML = `Hai cạnh $AB = ${cAB}$, $AC = ${cAC}$ và góc xen giữa $\\widehat{A} = ${angA}^\\circ$ $\\implies$ Cạnh thứ ba $BC \\approx ${bcLen}$ xác định duy nhất! Tam giác hoàn toàn xác định theo (c-g-c).`;
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 240 * window.devicePixelRatio || 240;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawCGC();
                }

                document.getElementById('sliderCGC_A').addEventListener('input', e => {
                    angA = parseInt(e.target.value);
                    document.getElementById('valCGC_A').textContent = `${angA}°`;
                    drawCGC();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let gB = 50, gC = 65;
                const bc = 220;

                function drawGCG() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const bx = (w - bc) / 2;
                    const by = h * 0.8;
                    const cx = bx + bc;
                    const cy = by;

                    const radB = gB * Math.PI / 180;
                    const radC = gC * Math.PI / 180;
                    const angA = 180 - (gB + gC);
                    const radA = angA * Math.PI / 180;

                    const sideC = bc * Math.sin(radC) / Math.sin(radA);
                    const ax = bx + sideC * Math.cos(radB);
                    const ay = by - sideC * Math.sin(radB);

                    // Tam giac ABC
                    ctx2.fillStyle = 'rgba(16, 185, 129, 0.2)';
                    ctx2.beginPath(); ctx2.moveTo(ax, ay); ctx2.lineTo(bx, by); ctx2.lineTo(cx, cy); ctx2.closePath(); ctx2.fill();

                    // Cạnh đáy BC
                    ctx2.strokeStyle = '#f59e0b'; ctx2.lineWidth = 4;
                    ctx2.beginPath(); ctx2.moveTo(bx, by); ctx2.lineTo(cx, cy); ctx2.stroke();

                    // Hai tia giao nhau tai A
                    ctx2.strokeStyle = '#06b6d4'; ctx2.lineWidth = 3;
                    ctx2.beginPath(); ctx2.moveTo(bx, by); ctx2.lineTo(ax, ay); ctx2.stroke();
                    ctx2.strokeStyle = '#10b981';
                    ctx2.beginPath(); ctx2.moveTo(cx, cy); ctx2.lineTo(ax, ay); ctx2.stroke();

                    // Dinh
                    ctx2.fillStyle = '#ef4444';
                    ctx2.beginPath(); ctx2.arc(ax, ay, 5, 0, Math.PI * 2); ctx2.fill();
                    ctx2.fillStyle = '#ffffff'; ctx2.font = 'bold 13px Segoe UI';
                    ctx2.fillText(`A (${angA}°)`, ax - 15, ay - 10);
                    ctx2.fillText(`B (${gB}°)`, bx - 25, by + 18);
                    ctx2.fillText(`C (${gC}°)`, cx + 8, cy + 18);

                    const out = document.getElementById('lab2GCGOut');
                    out.innerHTML = `Cạnh $BC = ${bc}$, hai góc kề $\\widehat{B} = ${gB}^\\circ$, $\\widehat{C} = ${gC}^\\circ$. Hai tia cắt nhau tại đúng một điểm $A$ $\\implies \\triangle ABC$ xác định duy nhất theo (g-c-g).`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 240 * window.devicePixelRatio || 240;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawGCG();
                }

                document.getElementById('sliderGCG_B').addEventListener('input', e => {
                    gB = parseInt(e.target.value);
                    document.getElementById('valGCG_B').textContent = `${gB}°`;
                    drawGCG();
                });
                document.getElementById('sliderGCG_C').addEventListener('input', e => {
                    gC = parseInt(e.target.value);
                    document.getElementById('valGCG_C').textContent = `${gC}°`;
                    drawGCG();
                });

                window.addEventListener('resize', resizeCanvas2);
                setTimeout(resizeCanvas2, 100);
            
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
