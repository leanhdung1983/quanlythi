// ========================================================
// TOÁN 10 - BÀI 24: HOÁN VỊ, CHỈNH HỢP VÀ TỔ HỢP
// Pure Vanilla Web Stack • Web Audio API • KaTeX / MathML Core
// ========================================================

// --- APP STATE ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Hoán Vị & Tổ Hợp',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
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
      const notes = [523.25, 659.25, 783.99, 1046.50];
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

// --- MATH HELPERS ---
function factorial(n) {
  if (n <= 1) return 1;
  let res = 1;
  for (let i = 2; i <= n; i++) res *= i;
  return res;
}

function perm(n) {
  return factorial(n);
}

function arrangement(n, k) {
  if (k < 0 || k > n) return 0;
  let res = 1;
  for (let i = 0; i < k; i++) res *= (n - i);
  return res;
}

function combination(n, k) {
  if (k < 0 || k > n) return 0;
  return arrangement(n, k) / factorial(k);
}

// --- MATHML FALLBACK PARSER ---
function latexToMathML(latex, display = false) {
  let s = latex.trim();
  s = s.replace(/\\overrightarrow\{([A-Za-z0-9_]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#8594;</mo></mover>');
  s = s.replace(/\\vec\{([A-Za-z0-9_]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#8594;</mo></mover>');
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  s = s.replace(/\\times/g, '<mo>&#215;</mo>');
  s = s.replace(/\\cdot/g, '<mo>&#183;</mo>');
  s = s.replace(/\\approx/g, '<mo>&#8776;</mo>');
  s = s.replace(/\\le/g, '<mo>&#8804;</mo>');
  s = s.replace(/\\ge/g, '<mo>&#8805;</mo>');
  s = s.replace(/\\ne/g, '<mo>&#8800;</mo>');
  s = s.replace(/\\in/g, '<mo>&#8712;</mo>');
  s = s.replace(/\\setminus/g, '<mo>&#8726;</mo>');
  s = s.replace(/\\dots/g, '<mo>&#8230;</mo>');
  s = s.replace(/\\cdots/g, '<mo>&#8943;</mo>');
  s = s.replace(/([A-Za-z])_([0-9A-Za-z]+)\^([0-9A-Za-z]+)/g, '<msubsup><mi>$1</mi><mrow>$2</mrow><mrow>$3</mrow></msubsup>');
  s = s.replace(/([A-Za-z])_([0-9A-Za-z]+)/g, '<msub><mi>$1</mi><mrow>$2</mrow></msub>');
  s = s.replace(/\\text\{([^{}]+)\}/g, '<mtext>$1</mtext>');

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

// --- QUIZ DATA: BÀI 24 (SGK 8.6 - 8.11 TRANG 70-71 & VẬN DỤNG) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1 (SGK 8.6 - Tr.70)',
    pts: 20,
    question: 'Một hoạ sĩ cần trưng bày $10$ bức tranh nghệ thuật khác nhau thành một hàng ngang. Hỏi có bao nhiêu cách để hoạ sĩ sắp xếp các bức tranh?',
    options: [
      { text: '$3\\,628\\,800$ cách', correct: true },
      { text: '$100$ cách', correct: false },
      { text: '$362\\,880$ cách', correct: false },
      { text: '$720$ cách', correct: false }
    ],
    explanation: 'Mỗi cách sắp xếp thứ tự của $10$ bức tranh khác nhau thành một hàng ngang là một hoán vị của $10$ phần tử. Số cách sắp xếp là: $P_{10} = 10! = 10 \\times 9 \\times 8 \\times \\dots \\times 1 = 3\\,628\\,800$ cách.'
  },
  {
    id: 2,
    title: 'Câu 2 (SGK 8.7 - Tr.70)',
    pts: 20,
    question: 'Từ các chữ số $0, 1, 2, 3, 4$, có thể lập được bao nhiêu số tự nhiên gồm $3$ chữ số đôi một khác nhau?',
    options: [
      { text: '$48$ số', correct: true },
      { text: '$60$ số', correct: false },
      { text: '$64$ số', correct: false },
      { text: '$36$ số', correct: false }
    ],
    explanation: 'Gọi số cần tìm là $\\overline{abc}$. Chữ số hàng trăm $a \\ne 0$, nên $a \\in \\{1; 2; 3; 4\\}$ (có $4$ cách chọn). Sau khi chọn $a$, còn lại $4$ chữ số (bao gồm cả số $0$). Việc chọn và xếp $2$ chữ số khác nhau vào vị trí $b$ và $c$ là một chỉnh hợp chập $2$ của $4$ phần tử, có $A_4^2 = 4 \\times 3 = 12$ cách. Tổng số các số lập được là: $4 \\times 12 = 48$ số.'
  },
  {
    id: 3,
    title: 'Câu 3 (SGK 8.8a - Tr.70)',
    pts: 20,
    question: 'Có bao nhiêu cách chọn một tập hợp gồm hai số nguyên dương nhỏ hơn $100$?',
    options: [
      { text: '$4851$ cách', correct: true },
      { text: '$9702$ cách', correct: false },
      { text: '$4950$ cách', correct: false },
      { text: '$2425$ cách', correct: false }
    ],
    explanation: 'Tập các số nguyên dương nhỏ hơn $100$ là $\\{1; 2; \\dots; 99\\}$ gồm $99$ phần tử. Chọn một tập hợp gồm $2$ số tức là không phân biệt thứ tự, nên số cách chọn là một tổ hợp chập $2$ của $99$: $C_{99}^2 = \\frac{99 \\times 98}{2} = 4851$ cách.'
  },
  {
    id: 4,
    title: 'Câu 4 (SGK 8.8b - Tr.70)',
    pts: 20,
    question: 'Có bao nhiêu cách chọn một tập hợp gồm ba số nguyên dương nhỏ hơn $100$?',
    options: [
      { text: '$156\\,849$ cách', correct: true },
      { text: '$941\\,094$ cách', correct: false },
      { text: '$161\\,700$ cách', correct: false },
      { text: '$78\\,424$ cách', correct: false }
    ],
    explanation: 'Số cách chọn một tập hợp gồm $3$ số từ $99$ số nguyên dương nhỏ hơn $100$ là một tổ hợp chập $3$ của $99$: $C_{99}^3 = \\frac{99 \\times 98 \\times 97}{3 \\times 2 \\times 1} = 156\\,849$ cách.'
  },
  {
    id: 5,
    title: 'Câu 5 (SGK 8.9 - Tr.70)',
    pts: 20,
    question: 'Bạn Hà có $5$ viên bi xanh và $7$ viên bi đỏ (các viên bi đều khác nhau). Có bao nhiêu cách để Hà chọn ra đúng $2$ viên bi khác màu?',
    options: [
      { text: '$35$ cách', correct: true },
      { text: '$66$ cách', correct: false },
      { text: '$12$ cách', correct: false },
      { text: '$24$ cách', correct: false }
    ],
    explanation: 'Để chọn được $2$ viên bi khác màu thì phải chọn $1$ viên bi xanh và $1$ viên bi đỏ. Chọn $1$ bi xanh từ $5$ bi xanh có $C_5^1 = 5$ cách. Chọn $1$ bi đỏ từ $7$ bi đỏ có $C_7^1 = 7$ cách. Theo quy tắc nhân, có: $5 \\times 7 = 35$ cách.'
  },
  {
    id: 6,
    title: 'Câu 6 (SGK 8.10a - Tr.71)',
    pts: 20,
    question: 'Một câu lạc bộ cờ vua có $10$ bạn nam và $7$ bạn nữ. Huấn luyện viên muốn chọn $4$ bạn nam đi thi đấu. Có bao nhiêu cách chọn?',
    options: [
      { text: '$210$ cách', correct: true },
      { text: '$5040$ cách', correct: false },
      { text: '$120$ cách', correct: false },
      { text: '$840$ cách', correct: false }
    ],
    explanation: 'Chọn $4$ bạn nam từ $10$ bạn nam không phân biệt thứ tự là một tổ hợp chập $4$ của $10$: $C_{10}^4 = \\frac{10 \\times 9 \\times 8 \\times 7}{4 \\times 3 \\times 2 \\times 1} = 210$ cách.'
  },
  {
    id: 7,
    title: 'Câu 7 (SGK 8.10b - Tr.71)',
    pts: 20,
    question: 'Câu lạc bộ cờ vua có $10$ bạn nam và $7$ bạn nữ. Có bao nhiêu cách chọn $4$ bạn đi thi đấu mà không phân biệt nam hay nữ?',
    options: [
      { text: '$2380$ cách', correct: true },
      { text: '$57\\,120$ cách', correct: false },
      { text: '$1190$ cách', correct: false },
      { text: '$3060$ cách', correct: false }
    ],
    explanation: 'Tổng số thành viên trong CLB là $10 + 7 = 17$ bạn. Việc chọn ra $4$ bạn bất kì không phân biệt nam hay nữ là một tổ hợp chập $4$ của $17$: $C_{17}^4 = \\frac{17 \\times 16 \\times 15 \\times 14}{24} = 2380$ cách.'
  },
  {
    id: 8,
    title: 'Câu 8 (SGK 8.10c - Tr.71)',
    pts: 20,
    question: 'Có bao nhiêu cách chọn $4$ bạn đi thi đấu cờ vua, trong đó có đúng $2$ bạn nam và $2$ bạn nữ?',
    options: [
      { text: '$945$ cách', correct: true },
      { text: '$450$ cách', correct: false },
      { text: '$1890$ cách', correct: false },
      { text: '$315$ cách', correct: false }
    ],
    explanation: 'Chọn $2$ bạn nam từ $10$ bạn nam có $C_{10}^2 = 45$ cách. Chọn $2$ bạn nữ từ $7$ bạn nữ có $C_7^2 = 21$ cách. Áp dụng quy tắc nhân: $C_{10}^2 \\times C_7^2 = 45 \\times 21 = 945$ cách.'
  },
  {
    id: 9,
    title: 'Câu 9 (SGK 8.11 - Tr.71)',
    pts: 20,
    question: 'Có bao nhiêu số tự nhiên chia hết cho $5$ mà mỗi số có $4$ chữ số đôi một khác nhau (chọn từ các chữ số $\\{0; 1; \\dots; 9\\}$)?',
    options: [
      { text: '$952$ số', correct: true },
      { text: '$1008$ số', correct: false },
      { text: '$900$ số', correct: false },
      { text: '$896$ số', correct: false }
    ],
    explanation: 'Gọi số cần tìm là $\\overline{abcd}$. TH1: Tận cùng $d = 0$ ($1$ cách). Ba chữ số $a, b, c$ được chọn từ $9$ chữ số khác $0$ và xếp thứ tự: $A_9^3 = 504$ số. TH2: Tận cùng $d = 5$ ($1$ cách). Chọn $a \\ne 0, a \\ne 5$ có $8$ cách. Chọn và xếp $2$ chữ số $b, c$ từ $8$ chữ số còn lại có $A_8^2 = 56$ cách $\\Rightarrow 8 \\times 56 = 448$ số. Tổng cộng: $504 + 448 = 952$ số.'
  },
  {
    id: 10,
    title: 'Câu 10 (Vận Dụng - Tr.70)',
    pts: 20,
    question: 'Một câu lạc bộ có $20$ học sinh. Ban quản lí gồm $6$ thành viên, trong đó có $1$ Trưởng ban, $1$ Phó ban và $4$ thành viên khác. Hỏi có bao nhiêu cách chọn ra Ban quản lí?',
    options: [
      { text: '$1\\,162\\,800$ cách', correct: true },
      { text: '$38\\,760$ cách', correct: false },
      { text: '$775\\,200$ cách', correct: false },
      { text: '$2\\,325\\,600$ cách', correct: false }
    ],
    explanation: 'Công việc gồm $2$ công đoạn liên tiếp: Công đoạn 1: Chọn $1$ Trưởng ban và $1$ Phó ban từ $20$ bạn (có phân biệt chức danh): $A_{20}^2 = 20 \\times 19 = 380$ cách. Công đoạn 2: Chọn $4$ thành viên khác từ $18$ bạn còn lại (không phân biệt thứ tự): $C_{18}^4 = 3060$ cách. Theo quy tắc nhân, số cách chọn Ban quản lí là: $380 \\times 3060 = 1\\,162\\,800$ cách.'
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

  container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
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

  let stars = 2;
  if (appState.xp >= 60) stars = 3;
  if (appState.xp >= 120) stars = 4;
  if (appState.xp >= 180) stars = 5;
  appState.stars = stars;
  if (starEl) starEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);

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

// --- LAB 1: MÁY TÍNH TỔ HỢP ĐỘNG ---
function initCombinLab() {
  const slN = document.getElementById('slN');
  const slK = document.getElementById('slK');
  const visBox = document.getElementById('visBox');
  const outEl = document.getElementById('combinOutput');

  function update() {
    const n = parseInt(slN.value, 10);
    // Keep k <= n
    slK.max = n;
    let k = parseInt(slK.value, 10);
    if (k > n) {
      k = n;
      slK.value = n;
    }

    document.getElementById('valN').textContent = n;
    document.getElementById('valK').textContent = k;

    const pVal = perm(n);
    const aVal = arrangement(n, k);
    const cVal = combination(n, k);

    // Visual tags
    const items = ['🍎', '🍌', '🍇', '🍓', '🍊', '🥝', '🍒', '🥭', '🍉', '🍍'].slice(0, n);
    visBox.innerHTML = `
      <div style="text-align: center; color: #94a3b8; font-size: 0.95rem;">
        Tập hợp $S$ gồm $${n}$ phần tử:
        <div style="font-size: 1.8rem; margin: 8px 0;">${items.join(' ')}</div>
      </div>
      <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; width: 100%;">
        <div style="background: rgba(99, 102, 241, 0.15); border: 1px solid #818cf8; border-radius: 10px; padding: 12px 20px; text-align: center; flex: 1; min-width: 150px;">
          <div style="color: #a5b4fc; font-weight: bold;">Hoán vị $P_{${n}}$</div>
          <div style="color: #ffffff; font-size: 1.4rem; font-weight: bold; margin-top: 4px;">${pVal.toLocaleString()}</div>
        </div>
        <div style="background: rgba(6, 182, 212, 0.15); border: 1px solid #06b6d4; border-radius: 10px; padding: 12px 20px; text-align: center; flex: 1; min-width: 150px;">
          <div style="color: #67e8f9; font-weight: bold;">Chỉnh hợp $A_{${n}}^{${k}}$</div>
          <div style="color: #ffffff; font-size: 1.4rem; font-weight: bold; margin-top: 4px;">${aVal.toLocaleString()}</div>
        </div>
        <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; border-radius: 10px; padding: 12px 20px; text-align: center; flex: 1; min-width: 150px;">
          <div style="color: #fde68a; font-weight: bold;">Tổ hợp $C_{${n}}^{${k}}$</div>
          <div style="color: #ffffff; font-size: 1.4rem; font-weight: bold; margin-top: 4px;">${cVal.toLocaleString()}</div>
        </div>
      </div>
    `;
    renderMathInTree(visBox);

    if (outEl) {
      outEl.innerHTML = formatMathText(
        `📌 **Phân tích chi tiết công thức ($n = ${n}, k = ${k}$):**<br>` +
        `• $P_{${n}} = ${n}! = ${pVal.toLocaleString()}$ (sắp xếp toàn bộ $${n}$ phần tử).<br>` +
        `• $A_{${n}}^{${k}} = \\frac{${n}!}{( ${n} - ${k} )!} = ${aVal.toLocaleString()}$ (chọn $${k}$ phần tử VÀ xếp thứ tự).<br>` +
        `• $C_{${n}}^{${k}} = \\frac{A_{${n}}^{${k}}}{${k}!} = \\frac{${aVal.toLocaleString()}}{${factorial(k)}} = ${cVal.toLocaleString()}$ (chọn $${k}$ phần tử KHÔNG thứ tự).<br>` +
        `• Kiểm chứng tính chất đối xứng: $C_{${n}}^{${n - k}} = C_{${n}}^{${k}} = ${cVal.toLocaleString()}$.`
      );
      renderMathInTree(outEl);
    }
  }

  slN.addEventListener('input', () => { update(); unlockBadge(1); });
  slK.addEventListener('input', () => { update(); unlockBadge(1); });

  update();
}

// --- LAB 2: TAM GIÁC PASCAL ---
function initPascalLab() {
  const container = document.getElementById('pascalContainer');
  const outEl = document.getElementById('pascalOutput');
  if (!container) return;

  const rows = 7; // n = 0 to 6
  container.innerHTML = '';

  for (let n = 0; n < rows; n++) {
    const rowDiv = document.createElement('div');
    rowDiv.style.display = 'flex';
    rowDiv.style.gap = '8px';
    rowDiv.style.justifyContent = 'center';

    for (let k = 0; k <= n; k++) {
      const val = combination(n, k);
      const cell = document.createElement('button');
      cell.className = 'pascal-cell';
      cell.setAttribute('data-n', n);
      cell.setAttribute('data-k', k);
      cell.style.cssText = `
        background: rgba(30, 41, 59, 0.8);
        border: 1px solid rgba(129, 140, 248, 0.4);
        color: #e2e8f0;
        font-family: monospace;
        font-size: 1rem;
        font-weight: bold;
        width: 44px;
        height: 40px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s ease;
      `;
      cell.textContent = val;

      cell.addEventListener('mouseenter', () => highlightCell(n, k));
      cell.addEventListener('click', () => { highlightCell(n, k); playSound('click'); unlockBadge(1); });

      rowDiv.appendChild(cell);
    }
    container.appendChild(rowDiv);
  }

  function highlightCell(n, k) {
    document.querySelectorAll('.pascal-cell').forEach(c => {
      c.style.background = 'rgba(30, 41, 59, 0.8)';
      c.style.borderColor = 'rgba(129, 140, 248, 0.4)';
      c.style.transform = 'scale(1)';
    });

    const currentCell = container.querySelector(`[data-n="${n}"][data-k="${k}"]`);
    if (currentCell) {
      currentCell.style.background = 'rgba(236, 72, 153, 0.5)';
      currentCell.style.borderColor = '#ec4899';
      currentCell.style.transform = 'scale(1.15)';
    }

    if (n > 0 && k > 0) {
      const parent1 = container.querySelector(`[data-n="${n - 1}"][data-k="${k - 1}"]`);
      if (parent1) {
        parent1.style.background = 'rgba(6, 182, 212, 0.4)';
        parent1.style.borderColor = '#06b6d4';
        parent1.style.transform = 'scale(1.1)';
      }
    }
    if (n > 0 && k < n) {
      const parent2 = container.querySelector(`[data-n="${n - 1}"][data-k="${k}"]`);
      if (parent2) {
        parent2.style.background = 'rgba(245, 158, 11, 0.4)';
        parent2.style.borderColor = '#f59e0b';
        parent2.style.transform = 'scale(1.1)';
      }
    }

    // Symmetric cell
    const symK = n - k;
    const symCell = container.querySelector(`[data-n="${n}"][data-k="${symK}"]`);
    if (symCell && symCell !== currentCell) {
      symCell.style.borderColor = '#10b981';
      symCell.style.background = 'rgba(16, 185, 129, 0.3)';
    }

    const curVal = combination(n, k);
    let explText = `Ô đang chọn: $C_{${n}}^{${k}} = ${curVal}$.<br>`;
    if (n > 0 && k > 0 && k < n) {
      const v1 = combination(n - 1, k - 1);
      const v2 = combination(n - 1, k);
      explText += `• **Hệ thức Pascal:** $C_{${n - 1}}^{${k - 1}} + C_{${n - 1}}^{${k}} = ${v1} + ${v2} = ${curVal} = C_{${n}}^{${k}}$.<br>`;
    }
    explText += `• **Tính đối xứng:** $C_{${n}}^{${k}} = C_{${n}}^{${n - k}} = ${curVal}$.`;

    if (outEl) {
      outEl.innerHTML = formatMathText(explText);
      renderMathInTree(outEl);
    }
  }
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
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

  const sndBtn = document.getElementById('soundToggle');
  if (sndBtn) {
    sndBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      sndBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      playSound('click');
    });
  }

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

  const printBtn = document.getElementById('btnPrintCert');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  updateHUD();
  renderQuiz();
  initCombinLab();
  initPascalLab();

  renderMathInTree(document.body);
});
