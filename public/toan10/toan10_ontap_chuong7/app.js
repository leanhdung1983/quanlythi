// ========================================================
// TOÁN 10 - CHƯƠNG VII: ÔN TẬP PHƯƠNG PHÁP TOẠ ĐỘ TRONG MẶT PHẲNG
// Pure Vanilla Web Stack • Web Audio API • KaTeX / MathML Core
// ========================================================

// --- APP STATE ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Hình Học Giải Tích',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false],
  conicMode: 'elip' // elip, hypebol, parabol
};

// --- WEB AUDIO API SOUND SYNTHESIS ---
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playSound(type) {
  if (!appState.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;

    if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    } else if (type === 'correct') {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.2, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } else if (type === 'wrong') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(130, now + 0.25);
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'levelup') {
      const freqs = [392, 523.25, 659.25, 783.99, 1046.5];
      freqs.forEach((f, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.09);
        gain.gain.setValueAtTime(0.22, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.3);
      });
    } else if (type === 'fanfare') {
      const melody = [
        { f: 523.25, t: 0.0, d: 0.15 },
        { f: 659.25, t: 0.15, d: 0.15 },
        { f: 783.99, t: 0.3, d: 0.2 },
        { f: 1046.5, t: 0.5, d: 0.45 }
      ];
      melody.forEach(item => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(item.f, now + item.t);
        gain.gain.setValueAtTime(0.25, now + item.t);
        gain.gain.exponentialRampToValueAtTime(0.001, now + item.t + item.d);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + item.t);
        osc.stop(now + item.t + item.d);
      });
    }
  } catch (e) {
    console.warn('Web Audio error:', e);
  }
}

// --- MATHML FALLBACK PARSER ---
function latexToMathML(latex, display = false) {
  let s = latex.trim();
  // Vector notation \overrightarrow{AB}
  s = s.replace(/\\overrightarrow\{([A-Za-z0-9_]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#8594;</mo></mover>');
  s = s.replace(/\\vec\{([A-Za-z0-9_]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#8594;</mo></mover>');
  // Fractions \frac{a}{b}
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  // Square root \sqrt{a}
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  // Cases system
  s = s.replace(/\\begin\{cases\}([\s\S]*?)\\end\{cases\}/g, (m, content) => {
    const rows = content.trim().split('\\\\').map(r => `<mtr><mtd>${r.trim()}</mtd></mtr>`).join('');
    return `<mrow><mo>{</mo><mtable>${rows}</mtable></mrow>`;
  });
  // Symbols
  s = s.replace(/\\Delta/g, '<mo>&#916;</mo>');
  s = s.replace(/\\approx/g, '<mo>&#8776;</mo>');
  s = s.replace(/\\pm/g, '<mo>&#177;</mo>');
  s = s.replace(/\\cdot/g, '<mo>&#183;</mo>');
  s = s.replace(/\\times/g, '<mo>&#215;</mo>');
  s = s.replace(/\\le/g, '<mo>&#8804;</mo>');
  s = s.replace(/\\ge/g, '<mo>&#8805;</mo>');
  s = s.replace(/\\ne/g, '<mo>&#8800;</mo>');
  s = s.replace(/\\in/g, '<mo>&#8712;</mo>');
  s = s.replace(/\\mathbb\{R\}/g, '<mi>&#8477;</mi>');
  s = s.replace(/\\cos/g, '<mi class="m-fn">cos</mi>');
  s = s.replace(/\\sin/g, '<mi class="m-fn">sin</mi>');
  s = s.replace(/\\varphi/g, '<mi>&#966;</mi>');
  s = s.replace(/\\perp/g, '<mo>&#8869;</mo>');
  s = s.replace(/\\text\{([^{}]+)\}/g, '<mtext>$1</mtext>');
  s = s.replace(/([a-zA-Z])\^2/g, '<msup><mi>$1</mi><mn>2</mn></msup>');
  s = s.replace(/([a-zA-Z])_([0-9a-zA-Z])/g, '<msub><mi>$1</mi><mn>$2</mn></msub>');

  const tag = display ? 'math display="block"' : 'math';
  return `<${tag} xmlns="http://www.w3.org/1998/Math/MathML">${s}</math>`;
}

function formatMathText(str) {
  if (!str) return '';
  let res = str.replace(/\$\$([\s\S]*?)\$\$/g, (m, tex) => {
    return `<span class="math-block">${latexToMathML(tex, true)}</span>`;
  });
  res = res.replace(/\$([^$]+?)\$/g, (m, tex) => {
    return `<span class="math-inline">${latexToMathML(tex, false)}</span>`;
  });
  return res;
}

function renderMathInTree(root) {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(root, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false,
      strict: false
    });
  }
}

// --- SGK 10 REVIEW QUIZ DATA (CHƯƠNG VII: BÀI 7.26 - 7.37) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1 (SGK 7.26 - Tr.58)',
    pts: 20,
    question: 'Phương trình nào sau đây là phương trình tham số của đường thẳng?',
    options: [
      { text: '$2x - y + 1 = 0$', correct: false },
      { text: '$\\begin{cases} x = 2t \\\\ y = t \\end{cases}$', correct: true },
      { text: '$x^2 + y^2 = 1$', correct: false },
      { text: '$y = 2x + 3$', correct: false }
    ],
    explanation: 'Phương trình tham số của đường thẳng đi qua điểm $M_0(x_0; y_0)$ và có vectơ chỉ phương $\\vec{u} = (u_1; u_2)$ có dạng $\\begin{cases} x = x_0 + u_1 t \\\\ y = y_0 + u_2 t \\end{cases}$. Ở đây $\\begin{cases} x = 2t \\\\ y = t \\end{cases}$ đi qua gốc $O(0; 0)$ với $\\vec{u} = (2; 1)$.'
  },
  {
    id: 2,
    title: 'Câu 2 (SGK 7.27 - Tr.58)',
    pts: 20,
    question: 'Phương trình nào sau đây là phương trình tổng quát của đường thẳng?',
    options: [
      { text: '$-x - 2y + 3 = 0$', correct: true },
      { text: '$\\begin{cases} x = 2 + t \\\\ y = 3 - t \\end{cases}$', correct: false },
      { text: '$y^2 = 2x$', correct: false },
      { text: '$\\frac{x^2}{10} + \\frac{y^2}{6} = 1$', correct: false }
    ],
    explanation: 'Phương trình tổng quát của đường thẳng có dạng $ax + by + c = 0$ với $a^2 + b^2 > 0$. Vậy $-x - 2y + 3 = 0$ là phương trình tổng quát với vectơ pháp tuyến $\\vec{n} = (-1; -2)$.'
  },
  {
    id: 3,
    title: 'Câu 3 (SGK 7.28 - Tr.58)',
    pts: 20,
    question: 'Phương trình nào sau đây là phương trình của đường tròn?',
    options: [
      { text: '$x^2 - y^2 = 1$', correct: false },
      { text: '$(x - 1)^2 + (y - 2)^2 = -4$', correct: false },
      { text: '$x^2 + y^2 = 2$', correct: true },
      { text: '$y^2 = 8x$', correct: false }
    ],
    explanation: 'Phương trình chính tắc của đường tròn tâm $I(a; b)$ bán kính $R$ là $(x - a)^2 + (y - b)^2 = R^2$ với $R^2 > 0$. Phương trình $x^2 + y^2 = 2$ có tâm $O(0; 0)$ và bán kính $R = \\sqrt{2}$. $(x - 1)^2 + (y - 2)^2 = -4$ không thể là đường tròn vì vế phải âm.'
  },
  {
    id: 4,
    title: 'Câu 4 (SGK 7.29 - Tr.58)',
    pts: 20,
    question: 'Phương trình nào sau đây là phương trình chính tắc của đường elip?',
    options: [
      { text: '$\\frac{x^2}{9} + \\frac{y^2}{9} = 1$', correct: false },
      { text: '$\\frac{x^2}{1} + \\frac{y^2}{6} = 1$', correct: false },
      { text: '$\\frac{x^2}{4} + \\frac{y^2}{1} = 1$', correct: true },
      { text: '$\\frac{x^2}{2} + \\frac{y^2}{1} = -1$', correct: false }
    ],
    explanation: 'Phương trình chính tắc của elip có dạng $\\frac{x^2}{a^2} + \\frac{y^2}{b^2} = 1$ với $a > b > 0$. Phương trình $\\frac{x^2}{4} + \\frac{y^2}{1} = 1$ có $a^2 = 4, b^2 = 1 \\Rightarrow a = 2 > b = 1 > 0$ chuẩn chính tắc.'
  },
  {
    id: 5,
    title: 'Câu 5 (SGK 7.30 - Tr.58)',
    pts: 20,
    question: 'Phương trình nào sau đây là phương trình chính tắc của đường hypebol?',
    options: [
      { text: '$\\frac{x^2}{3} - \\frac{y^2}{2} = -1$', correct: false },
      { text: '$\\frac{x^2}{1} - \\frac{y^2}{6} = 1$', correct: true },
      { text: '$\\frac{x^2}{6} + \\frac{y^2}{1} = 1$', correct: false },
      { text: '$\\frac{x^2}{2} + \\frac{y^2}{1} = -1$', correct: false }
    ],
    explanation: 'Phương trình chính tắc của hypebol có dạng $\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1$ với $a > 0, b > 0$. Do đó $\\frac{x^2}{1} - \\frac{y^2}{6} = 1$ là phương trình chính tắc hypebol với $a = 1, b = \\sqrt{6}$.'
  },
  {
    id: 6,
    title: 'Câu 6 (SGK 7.31 - Tr.58)',
    pts: 20,
    question: 'Phương trình nào sau đây là phương trình chính tắc của đường parabol?',
    options: [
      { text: '$x^2 = 4y$', correct: false },
      { text: '$x^2 = -6y$', correct: false },
      { text: '$y^2 = 4x$', correct: true },
      { text: '$y^2 = -4x$', correct: false }
    ],
    explanation: 'Phương trình chính tắc của parabol có dạng $y^2 = 2px$ với tham số tiêu $p > 0$. Phương trình $y^2 = 4x$ có $2p = 4 \\Rightarrow p = 2 > 0$.'
  },
  {
    id: 7,
    title: 'Câu 7 (SGK 7.32 - Tr.58)',
    pts: 20,
    question: 'Trong mặt phẳng toạ độ, cho ba điểm $A(1; -1)$, $B(3; 5)$, $C(-2; 4)$. Diện tích tam giác $ABC$ bằng bao nhiêu?',
    options: [
      { text: '$13$', correct: false },
      { text: '$14$', correct: true },
      { text: '$28$', correct: false },
      { text: '$7$', correct: false }
    ],
    explanation: 'Ta có $\\overrightarrow{AB} = (2; 6)$ và $\\overrightarrow{AC} = (-3; 5)$. Đường thẳng $AB$ có vectơ chỉ phương $(1; 3) \\Rightarrow$ vectơ pháp tuyến $\\vec{n} = (3; -1)$. Phương trình $AB: 3(x - 1) - (y + 1) = 0 \\Leftrightarrow 3x - y - 4 = 0$. Độ dài $AB = \\sqrt{2^2 + 6^2} = 2\\sqrt{10}$. Khoảng cách $d(C, AB) = \\frac{|3(-2) - 4 - 4|}{\\sqrt{3^2 + (-1)^2}} = \\frac{14}{\\sqrt{10}}$. Diện tích $S_{\\Delta ABC} = \\frac{1}{2} \\cdot AB \\cdot d(C, AB) = \\frac{1}{2} \\cdot 2\\sqrt{10} \\cdot \\frac{14}{\\sqrt{10}} = 14$.'
  },
  {
    id: 8,
    title: 'Câu 8 (SGK 7.33 - Tr.58)',
    pts: 20,
    question: 'Trong mặt phẳng toạ độ $Oxy$, cho $A(-1; 0)$ và $B(3; 1)$. Phương trình đường tròn tâm $O(0; 0)$ tiếp xúc với đường thẳng $AB$ là:',
    options: [
      { text: '$x^2 + y^2 = \\frac{1}{17}$', correct: true },
      { text: '$x^2 + y^2 = 17$', correct: false },
      { text: '$x^2 + y^2 = \\frac{1}{\\sqrt{17}}$', correct: false },
      { text: '$x^2 + y^2 = 1$', correct: false }
    ],
    explanation: 'Vectơ $\\overrightarrow{AB} = (4; 1) \\Rightarrow$ vectơ pháp tuyến của $AB$ là $\\vec{n} = (1; -4)$. Phương trình đường thẳng $AB: 1(x + 1) - 4(y - 0) = 0 \\Leftrightarrow x - 4y + 1 = 0$. Bán kính đường tròn tâm $O$ tiếp xúc $AB$ là $R = d(O, AB) = \\frac{|0 - 0 + 1|}{\\sqrt{1^2 + (-4)^2}} = \\frac{1}{\\sqrt{17}}$. Phương trình đường tròn là $x^2 + y^2 = R^2 = \\frac{1}{17}$.'
  },
  {
    id: 9,
    title: 'Câu 9 (SGK 7.34 - Tr.58)',
    pts: 20,
    question: 'Cho đường tròn $(C): x^2 + y^2 - 4x + 6y - 12 = 0$. Phương trình tiếp tuyến của $(C)$ tại điểm $M(5; 1)$ là:',
    options: [
      { text: '$3x + 4y - 19 = 0$', correct: true },
      { text: '$4x - 3y - 17 = 0$', correct: false },
      { text: '$3x - 4y - 11 = 0$', correct: false },
      { text: '$3x + 4y + 19 = 0$', correct: false }
    ],
    explanation: 'Đường tròn $(C)$ có tâm $I(2; -3)$. Điểm $M(5; 1) \\in (C)$ vì $5^2 + 1^2 - 4(5) + 6(1) - 12 = 0$. Tiếp tuyến của $(C)$ tại $M$ nhận $\\overrightarrow{IM} = (5 - 2; 1 - (-3)) = (3; 4)$ làm vectơ pháp tuyến. Phương trình tiếp tuyến là $3(x - 5) + 4(y - 1) = 0 \\Leftrightarrow 3x + 4y - 19 = 0$.'
  },
  {
    id: 10,
    title: 'Câu 10 (SGK 7.37 - Tr.59)',
    pts: 20,
    question: 'Một cột trụ hình hypebol cao $6\\text{ m}$, chỗ thắt hẹp nhất ở chính giữa rộng $0,8\\text{ m}$, đỉnh và đáy đều rộng $1\\text{ m}$. Độ rộng của cột ở độ cao $5\\text{ m}$ (tính từ đáy cột lên, làm tròn hai chữ số thập phân) là:',
    options: [
      { text: '$0,89\\text{ m}$', correct: true },
      { text: '$0,92\\text{ m}$', correct: false },
      { text: '$0,85\\text{ m}$', correct: false },
      { text: '$0,96\\text{ m}$', correct: false }
    ],
    explanation: 'Chọn hệ toạ độ $Oxy$ với gốc $O$ tại tâm đối xứng ở chỗ thắt nhỏ nhất. Phương trình hypebol: $\\frac{x^2}{a^2} - \\frac{y^2}{b^2} = 1$. Tại chỗ thắt giữa ($y = 0$), bề rộng $2a = 0,8\\text{ m} \\Rightarrow a = 0,4\\text{ m} \\Rightarrow a^2 = 0,16$. Chiều cao $6\\text{ m}$ nên đỉnh ở $y = 3$, tại đó bề rộng $1\\text{ m} \\Rightarrow x = 0,5$. Thay toạ độ $(0,5; 3)$ vào phương trình: $\\frac{0,25}{0,16} - \\frac{9}{b^2} = 1 \\Rightarrow b^2 = 16$. Độ cao $5\\text{ m}$ từ chân cột ($y = -3$) ứng với tung độ $y = -3 + 5 = 2\\text{ m}$. Tại $y = 2$: $\\frac{x^2}{0,16} - \\frac{4}{16} = 1 \\Rightarrow x^2 = 0,16 \\times 1,25 = 0,2 \\Rightarrow x = \\sqrt{0,2} \\approx 0,4472\\text{ m}$. Độ rộng cột tại độ cao $5\\text{ m}$ là $2x \\approx 0,89\\text{ m}$.'
  }
];

// --- QUIZ RENDERING & INTERACTION ---
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  quizData.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'card quiz-card';
    card.id = `quizCard-${q.id}`;

    const letters = ['A', 'B', 'C', 'D'];
    const optHtml = q.options.map((opt, oIdx) => `
      <button class="quiz-opt-btn" data-qid="${q.id}" data-oidx="${oIdx}">
        <span class="opt-letter">${letters[oIdx]}</span>
        <span class="opt-text">${opt.text}</span>
      </button>
    `).join('');

    card.innerHTML = `
      <div class="quiz-card-header">
        <span class="quiz-q-num">${q.title}</span>
        <span class="quiz-pts">+${q.pts} XP</span>
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options">${optHtml}</div>
      <div class="explanation-box" id="expl-${q.id}">
        <strong>💡 Hướng Dẫn Giải Chi Tiết:</strong>
        <p>${q.explanation}</p>
      </div>
    `;
    container.appendChild(card);
  });

  // Attach button click events
  container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const qid = parseInt(btn.getAttribute('data-qid'), 10);
      const oidx = parseInt(btn.getAttribute('data-oidx'), 10);
      handleAnswer(qid, oidx);
    });
  });

  renderMathInTree(container);
  updateScoreBox();
}

function handleAnswer(qid, selectedIdx) {
  if (appState.answered[qid] !== undefined) return;
  const q = quizData.find(item => item.id === qid);
  if (!q) return;

  const card = document.getElementById(`quizCard-${qid}`);
  const buttons = card.querySelectorAll('.quiz-opt-btn');
  const explBox = document.getElementById(`expl-${qid}`);

  appState.answered[qid] = selectedIdx;
  const isCorrect = q.options[selectedIdx].correct;

  buttons.forEach((b, idx) => {
    b.disabled = true;
    if (q.options[idx].correct) {
      b.classList.add('correct');
    } else if (idx === selectedIdx) {
      b.classList.add('wrong');
    }
  });

  if (isCorrect) {
    appState.xp += q.pts;
    appState.streak += 1;
    playSound('correct');
  } else {
    appState.streak = 0;
    playSound('wrong');
  }

  if (explBox) {
    explBox.classList.add('show');
    renderMathInTree(explBox);
  }

  updateHUD();
  updateScoreBox();
  checkBadges();
}

function updateScoreBox() {
  const answeredCount = Object.keys(appState.answered).length;
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progEl) progEl.textContent = `${answeredCount}/${quizData.length}`;
  if (scoreEl) scoreEl.textContent = `${appState.xp} XP`;
}

// --- HUD & BADGE SYSTEM ---
function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const nameEl = document.getElementById('userNameDisplay');
  const titleEl = document.getElementById('userTitle');
  const avBtn = document.getElementById('avatarBtn');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (nameEl) nameEl.textContent = `${appState.userName} 🌟`;
  if (titleEl) titleEl.textContent = appState.userTitle;
  if (avBtn) avBtn.textContent = appState.avatar;

  // Star rating logic based on XP
  let stars = 2;
  if (appState.xp >= 60) stars = 3;
  if (appState.xp >= 120) stars = 4;
  if (appState.xp >= 180) stars = 5;
  appState.stars = stars;
  if (starEl) starEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);

  // Update certificate fields
  const certName = document.getElementById('certStudentName');
  const certScore = document.getElementById('certScore');
  const certRank = document.getElementById('certRank');
  const certStars = document.getElementById('certStars');
  if (certName) certName.textContent = appState.userName;
  if (certScore) certScore.textContent = appState.xp;
  if (certStars) certStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
  if (certRank) {
    if (appState.xp >= 180) certRank.textContent = 'Xuất Sắc';
    else if (appState.xp >= 120) certRank.textContent = 'Giỏi';
    else if (appState.xp >= 60) certRank.textContent = 'Khá';
    else certRank.textContent = 'Hoàn Thành';
  }
}

function unlockBadge(idx) {
  if (appState.badges[idx]) return;
  appState.badges[idx] = true;
  const bEl = document.getElementById(`badge-${idx + 1}`);
  if (bEl) {
    bEl.classList.remove('locked');
    bEl.classList.add('unlocked');
  }
  if (idx === 4) {
    playSound('fanfare');
  } else {
    playSound('levelup');
  }
}

function checkBadges() {
  // Badge 1: Read theory tab
  // Badge 2: Interacted with labs
  // Badge 3: Answered at least 5 correctly
  let correctCount = 0;
  Object.keys(appState.answered).forEach(qid => {
    const q = quizData.find(item => item.id === parseInt(qid, 10));
    if (q && q.options[appState.answered[qid]].correct) {
      correctCount++;
    }
  });

  if (correctCount >= 5) unlockBadge(2);
  if (appState.xp >= 160) unlockBadge(3);
  if (correctCount === 10) unlockBadge(4);
}

// --- LAB 1: RADAR TOẠ ĐỘ OXY ---
function initRadarLab() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const slMx = document.getElementById('slMx');
  const slMy = document.getElementById('slMy');
  const slA = document.getElementById('slA');
  const slB = document.getElementById('slB');
  const slC = document.getElementById('slC');
  const slR = document.getElementById('slR');

  function draw() {
    const mx = parseFloat(slMx.value);
    const my = parseFloat(slMy.value);
    let a = parseFloat(slA.value);
    let b = parseFloat(slB.value);
    const c = parseFloat(slC.value);
    const r = parseFloat(slR.value);

    // Prevent a=0 and b=0 simultaneously
    if (a === 0 && b === 0) {
      a = 1;
      slA.value = 1;
    }

    document.getElementById('mVal').textContent = `M(${mx.toFixed(1)}, ${my.toFixed(1)})`;
    document.getElementById('aVal').textContent = a;
    document.getElementById('bVal').textContent = b;
    document.getElementById('cVal').textContent = c;
    document.getElementById('rVal').textContent = r.toFixed(1);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const ox = w / 2;
    const oy = h / 2;
    const scale = 28; // pixels per unit

    // Coordinate grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = -8; x <= 8; x++) {
      ctx.beginPath();
      ctx.moveTo(ox + x * scale, 0);
      ctx.lineTo(ox + x * scale, h);
      ctx.stroke();
    }
    for (let y = -6; y <= 6; y++) {
      ctx.beginPath();
      ctx.moveTo(0, oy - y * scale);
      ctx.lineTo(w, oy - y * scale);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(165, 180, 252, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy); ctx.lineTo(w, oy);
    ctx.moveTo(ox, 0); ctx.lineTo(ox, h);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('x', w - 15, oy - 8);
    ctx.fillText('y', ox + 8, 15);
    ctx.fillText('O', ox - 14, oy + 14);

    // Draw Circle (C) tâm O bán kính R
    ctx.beginPath();
    ctx.arc(ox, oy, r * scale, 0, Math.PI * 2);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.fill();

    // Draw Line Delta: ax + by + c = 0
    // Points at x = -10 and x = 10
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;

    if (Math.abs(b) > 0.001) {
      const x1 = -10, y1 = (-a * x1 - c) / b;
      const x2 = 10, y2 = (-a * x2 - c) / b;
      ctx.moveTo(ox + x1 * scale, oy - y1 * scale);
      ctx.lineTo(ox + x2 * scale, oy - y2 * scale);
    } else {
      const x0 = -c / a;
      ctx.moveTo(ox + x0 * scale, 0);
      ctx.lineTo(ox + x0 * scale, h);
    }
    ctx.stroke();

    // Projected point H of M on Delta
    // H = M - ((ax_M + by_M + c)/(a^2 + b^2)) * (a, b)
    const factor = (a * mx + b * my + c) / (a * a + b * b);
    const hx = mx - factor * a;
    const hy = my - factor * b;

    // Draw dashed projection line MH
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.5;
    ctx.moveTo(ox + mx * scale, oy - my * scale);
    ctx.lineTo(ox + hx * scale, oy - hy * scale);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Point H
    ctx.beginPath();
    ctx.arc(ox + hx * scale, oy - hy * scale, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#a855f7';
    ctx.fill();

    // Draw Point M
    ctx.beginPath();
    ctx.arc(ox + mx * scale, oy - my * scale, 6, 0, Math.PI * 2);
    ctx.fillStyle = '#ec4899';
    ctx.shadowColor = '#ec4899';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`M(${mx.toFixed(1)}; ${my.toFixed(1)})`, ox + mx * scale + 8, oy - my * scale - 8);

    // Compute Math Metrics
    const distMDelta = Math.abs(a * mx + b * my + c) / Math.sqrt(a * a + b * b);
    const omDist = Math.sqrt(mx * mx + my * my);
    let circlePos = '';
    if (Math.abs(omDist - r) < 0.05) circlePos = 'nằm trên đường tròn $(C)$';
    else if (omDist < r) circlePos = 'nằm bên trong đường tròn $(C)$';
    else circlePos = 'nằm bên ngoài đường tròn $(C)$';

    const outEl = document.getElementById('radarOutput');
    if (outEl) {
      outEl.innerHTML = formatMathText(
        `📌 **Phân tích toạ độ tức thì:**<br>` +
        `• Khoảng cách từ $M$ đến $\\Delta$: $d(M, \\Delta) = \\frac{|${a}(${mx.toFixed(1)}) + ${b}(${my.toFixed(1)}) + (${c})|}{\\sqrt{${a}^2 + ${b}^2}} \\approx ${distMDelta.toFixed(2)}$<br>` +
        `• Khoảng cách từ gốc $O$ đến $M$: $OM = \\sqrt{(${mx.toFixed(1)})^2 + (${my.toFixed(1)})^2} \\approx ${omDist.toFixed(2)}$ ($R = ${r.toFixed(1)}$)<br>` +
        `• Vị trí tương đối: Điểm $M$ ${circlePos}.`
      );
      renderMathInTree(outEl);
    }
  }

  [slMx, slMy, slA, slB, slC, slR].forEach(sl => {
    sl.addEventListener('input', () => {
      draw();
      unlockBadge(1);
    });
  });

  draw();
}

// --- LAB 2: BỘ NHẬN DIỆN & PHÂN TÍCH BA ĐƯỜNG CONIC ---
function initConicLab() {
  const canvas = document.getElementById('conicCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const btnElip = document.getElementById('btnModeElip');
  const btnHyp = document.getElementById('btnModeHypebol');
  const btnPar = document.getElementById('btnModeParabol');
  const sl1 = document.getElementById('slParam1');
  const sl2 = document.getElementById('slParam2');
  const pLabel = document.getElementById('conicParamLabel');
  const outEl = document.getElementById('conicOutput');

  function updateModeUI() {
    [btnElip, btnHyp, btnPar].forEach(b => b.classList.remove('active'));
    if (appState.conicMode === 'elip') {
      btnElip.classList.add('active');
      pLabel.textContent = `Bán trục lớn a = ${parseFloat(sl1.value).toFixed(1)}, bán trục nhỏ b = ${parseFloat(sl2.value).toFixed(1)}`;
      sl2.style.display = 'inline-block';
      sl1.min = '2'; sl1.max = '6'; sl1.step = '0.5';
      sl2.min = '1'; sl2.max = '4.5'; sl2.step = '0.5';
    } else if (appState.conicMode === 'hypebol') {
      btnHyp.classList.add('active');
      pLabel.textContent = `Bán trục thực a = ${parseFloat(sl1.value).toFixed(1)}, bán trục ảo b = ${parseFloat(sl2.value).toFixed(1)}`;
      sl2.style.display = 'inline-block';
      sl1.min = '1.5'; sl1.max = '4'; sl1.step = '0.5';
      sl2.min = '1'; sl2.max = '4'; sl2.step = '0.5';
    } else {
      btnPar.classList.add('active');
      pLabel.textContent = `Tham số tiêu p = ${parseFloat(sl1.value).toFixed(1)}`;
      sl2.style.display = 'none';
      sl1.min = '0.5'; sl1.max = '4'; sl1.step = '0.5';
    }
  }

  function draw() {
    updateModeUI();
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const ox = w / 2;
    const oy = h / 2;
    const scale = 32;

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = -9; x <= 9; x++) {
      ctx.beginPath();
      ctx.moveTo(ox + x * scale, 0); ctx.lineTo(ox + x * scale, h); ctx.stroke();
    }
    for (let y = -6; y <= 6; y++) {
      ctx.beginPath();
      ctx.moveTo(0, oy - y * scale); ctx.lineTo(w, oy - y * scale); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(165, 180, 252, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, oy); ctx.lineTo(w, oy);
    ctx.moveTo(ox, 0); ctx.lineTo(ox, h);
    ctx.stroke();

    if (appState.conicMode === 'elip') {
      let a = parseFloat(sl1.value);
      let b = parseFloat(sl2.value);
      if (b >= a) b = a - 0.5; // ensure a > b > 0
      const c = Math.sqrt(a * a - b * b);

      // Draw Ellipse
      ctx.beginPath();
      ctx.ellipse(ox, oy, a * scale, b * scale, 0, 0, Math.PI * 2);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.fill();

      // Foci F1(-c, 0), F2(c, 0)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(ox - c * scale, oy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ox + c * scale, oy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(`F1(-${c.toFixed(1)}; 0)`, ox - c * scale - 25, oy + 16);
      ctx.fillText(`F2(${c.toFixed(1)}; 0)`, ox + c * scale - 5, oy + 16);

      // Moving point M
      const angle = 0.8;
      const mx = a * Math.cos(angle);
      const my = b * Math.sin(angle);
      const d1 = Math.sqrt((mx + c) * (mx + c) + my * my);
      const d2 = Math.sqrt((mx - c) * (mx - c) + my * my);

      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#ec4899';
      ctx.moveTo(ox - c * scale, oy); ctx.lineTo(ox + mx * scale, oy - my * scale);
      ctx.lineTo(ox + c * scale, oy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath(); ctx.arc(ox + mx * scale, oy - my * scale, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ec4899'; ctx.fill();
      ctx.fillText(`M(${mx.toFixed(1)}; ${my.toFixed(1)})`, ox + mx * scale + 8, oy - my * scale - 8);

      if (outEl) {
        outEl.innerHTML = formatMathText(
          `🪐 **Elip:** $\\frac{x^2}{${(a * a).toFixed(1)}} + \\frac{y^2}{${(b * b).toFixed(1)}} = 1$<br>` +
          `• Tiêu cự: $2c = 2\\sqrt{a^2 - b^2} \\approx ${(2 * c).toFixed(2)}$ | Trục lớn: $2a = ${(2 * a).toFixed(1)}$, trục nhỏ: $2b = ${(2 * b).toFixed(1)}$<br>` +
          `• Kiểm chứng bán kính qua tiêu: $MF_1 + MF_2 = ${d1.toFixed(2)} + ${d2.toFixed(2)} = ${(d1 + d2).toFixed(2)} \\approx 2a = ${(2 * a).toFixed(2)}$.`
        );
        renderMathInTree(outEl);
      }
    } else if (appState.conicMode === 'hypebol') {
      const a = parseFloat(sl1.value);
      const b = parseFloat(sl2.value);
      const c = Math.sqrt(a * a + b * b);

      // Asymptotes y = +- (b/a)x
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(ox - 8 * scale, oy - (-8 * (b / a)) * scale);
      ctx.lineTo(ox + 8 * scale, oy - (8 * (b / a)) * scale);
      ctx.moveTo(ox - 8 * scale, oy - (8 * (b / a)) * scale);
      ctx.lineTo(ox + 8 * scale, oy - (-8 * (b / a)) * scale);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw Hyperbola branches
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      // Right branch
      ctx.beginPath();
      for (let yVal = -5; yVal <= 5; yVal += 0.1) {
        const xVal = a * Math.sqrt(1 + (yVal * yVal) / (b * b));
        if (xVal <= 8) {
          if (yVal === -5) ctx.moveTo(ox + xVal * scale, oy - yVal * scale);
          else ctx.lineTo(ox + xVal * scale, oy - yVal * scale);
        }
      }
      ctx.stroke();
      // Left branch
      ctx.beginPath();
      for (let yVal = -5; yVal <= 5; yVal += 0.1) {
        const xVal = -a * Math.sqrt(1 + (yVal * yVal) / (b * b));
        if (xVal >= -8) {
          if (yVal === -5) ctx.moveTo(ox + xVal * scale, oy - yVal * scale);
          else ctx.lineTo(ox + xVal * scale, oy - yVal * scale);
        }
      }
      ctx.stroke();

      // Foci
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(ox - c * scale, oy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(ox + c * scale, oy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(`F1(-${c.toFixed(1)}; 0)`, ox - c * scale - 25, oy + 16);
      ctx.fillText(`F2(${c.toFixed(1)}; 0)`, ox + c * scale - 5, oy + 16);

      // Moving point M on right branch
      const my = 1.5;
      const mx = a * Math.sqrt(1 + (my * my) / (b * b));
      const d1 = Math.sqrt((mx + c) * (mx + c) + my * my);
      const d2 = Math.sqrt((mx - c) * (mx - c) + my * my);

      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#ec4899';
      ctx.moveTo(ox - c * scale, oy); ctx.lineTo(ox + mx * scale, oy - my * scale);
      ctx.lineTo(ox + c * scale, oy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath(); ctx.arc(ox + mx * scale, oy - my * scale, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ec4899'; ctx.fill();
      ctx.fillText(`M(${mx.toFixed(1)}; ${my.toFixed(1)})`, ox + mx * scale + 8, oy - my * scale - 8);

      if (outEl) {
        outEl.innerHTML = formatMathText(
          `⚡ **Hypebol:** $\\frac{x^2}{${(a * a).toFixed(1)}} - \\frac{y^2}{${(b * b).toFixed(1)}} = 1$<br>` +
          `• Tiêu cự: $2c = 2\\sqrt{a^2 + b^2} \\approx ${(2 * c).toFixed(2)}$ | Tiệm cận: $y = \\pm ${(b / a).toFixed(2)} x$<br>` +
          `• Hiệu bán kính qua tiêu: $|MF_1 - MF_2| = |${d1.toFixed(2)} - ${d2.toFixed(2)}| = ${(d1 - d2).toFixed(2)} \\approx 2a = ${(2 * a).toFixed(2)}$.`
        );
        renderMathInTree(outEl);
      }
    } else {
      // Parabol y^2 = 2px
      const p = parseFloat(sl1.value);
      const fX = p / 2;

      // Directrix Delta: x = -p/2
      ctx.strokeStyle = '#ef4444';
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(ox - fX * scale, 0); ctx.lineTo(ox - fX * scale, h);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = '#ef4444';
      ctx.fillText(`\\Delta: x = -${fX.toFixed(1)}`, ox - fX * scale - 60, 25);

      // Parabola curve
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.beginPath();
      for (let yVal = -5.5; yVal <= 5.5; yVal += 0.1) {
        const xVal = (yVal * yVal) / (2 * p);
        if (xVal <= 8) {
          if (yVal === -5.5) ctx.moveTo(ox + xVal * scale, oy - yVal * scale);
          else ctx.lineTo(ox + xVal * scale, oy - yVal * scale);
        }
      }
      ctx.stroke();

      // Focus F(p/2, 0)
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(ox + fX * scale, oy, 5, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(`F(${fX.toFixed(1)}; 0)`, ox + fX * scale + 8, oy + 16);

      // Moving Point M
      const my = 2.0;
      const mx = (my * my) / (2 * p);
      const mf = Math.sqrt((mx - fX) * (mx - fX) + my * my);
      const md = mx + fX; // distance to x = -p/2

      ctx.beginPath();
      ctx.setLineDash([3, 3]);
      ctx.strokeStyle = '#ec4899';
      ctx.moveTo(ox + fX * scale, oy); ctx.lineTo(ox + mx * scale, oy - my * scale);
      ctx.lineTo(ox - fX * scale, oy - my * scale);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.beginPath(); ctx.arc(ox + mx * scale, oy - my * scale, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#ec4899'; ctx.fill();
      ctx.fillText(`M(${mx.toFixed(1)}; ${my.toFixed(1)})`, ox + mx * scale + 8, oy - my * scale - 8);

      if (outEl) {
        outEl.innerHTML = formatMathText(
          `📡 **Parabol:** $y^2 = ${(2 * p).toFixed(1)}x$<br>` +
          `• Tham số tiêu $p = ${p.toFixed(1)}$ | Tiêu điểm $F(${fX.toFixed(2)}; 0)$ | Đường chuẩn $\\Delta: x = -${fX.toFixed(2)}$<br>` +
          `• Tính chất chuẩn: $MF = ${mf.toFixed(2)} = d(M, \\Delta) = ${md.toFixed(2)}$.`
        );
        renderMathInTree(outEl);
      }
    }
  }

  btnElip.addEventListener('click', () => { appState.conicMode = 'elip'; draw(); playSound('click'); unlockBadge(1); });
  btnHyp.addEventListener('click', () => { appState.conicMode = 'hypebol'; draw(); playSound('click'); unlockBadge(1); });
  btnPar.addEventListener('click', () => { appState.conicMode = 'parabol'; draw(); playSound('click'); unlockBadge(1); });

  sl1.addEventListener('input', draw);
  sl2.addEventListener('input', draw);

  draw();
}

// --- SETUP EVENT LISTENERS & INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = `tab-${tab.getAttribute('data-tab')}`;
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(targetId);
      if (targetContent) targetContent.classList.add('active');

      playSound('click');
      if (tab.getAttribute('data-tab') === 'theory') {
        unlockBadge(0);
      }
    });
  });

  // 2. Sound Toggle
  const sndBtn = document.getElementById('soundToggle');
  if (sndBtn) {
    sndBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      sndBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      playSound('click');
    });
  }

  // 3. Reset Progress
  const rstBtn = document.getElementById('resetProgress');
  if (rstBtn) {
    rstBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        document.querySelectorAll('.badge-item').forEach(b => {
          b.classList.remove('unlocked');
          b.classList.add('locked');
        });
        updateHUD();
        renderQuiz();
        playSound('click');
      }
    });
  }

  // 4. Avatar Picker Modal (Opens ONLY when avatarBtn is clicked)
  const avBtn = document.getElementById('avatarBtn');
  const avModal = document.getElementById('avatarModal');
  const closeAvModal = document.getElementById('btnCloseModal');

  if (avBtn && avModal) {
    avBtn.addEventListener('click', () => {
      avModal.style.display = 'flex';
      avModal.classList.add('active');
      playSound('click');
    });
  }

  if (closeAvModal && avModal) {
    closeAvModal.addEventListener('click', () => {
      avModal.style.display = 'none';
      avModal.classList.remove('active');
      playSound('click');
    });
  }

  document.querySelectorAll('.av-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      appState.avatar = opt.getAttribute('data-av');
      appState.userName = opt.getAttribute('data-name');
      updateHUD();
      if (avModal) {
        avModal.style.display = 'none';
        avModal.classList.remove('active');
      }
      playSound('click');
    });
  });

  // 5. Print Certificate
  const printBtn = document.getElementById('btnPrintCert');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // 6. Initialize Components
  updateHUD();
  renderQuiz();
  initRadarLab();
  initConicLab();

  // Render KaTeX across the document
  renderMathInTree(document.body);
});
