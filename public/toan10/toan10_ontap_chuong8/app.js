// ========================================================
// TOÁN 10 - CHƯƠNG VIII: ÔN TẬP ĐẠI SỐ TỔ HỢP
// Pure Vanilla Web Stack • Web Audio API • KaTeX / MathML Core
// ========================================================

// --- APP STATE ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Đại Số Tổ Hợp',
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
  s = s.replace(/\\le/g, '<mo>&#8804;</mo>');
  s = s.replace(/\\ge/g, '<mo>&#8805;</mo>');
  s = s.replace(/\\ne/g, '<mo>&#8800;</mo>');
  s = s.replace(/\\in/g, '<mo>&#8712;</mo>');
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

// --- QUIZ DATA: ÔN TẬP CHƯƠNG VIII (SGK 8.17 - 8.26 TRANG 76) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1 (SGK 8.17 - Tr.76)',
    pts: 20,
    question: 'Số cách cắm $4$ bông hoa khác nhau vào $4$ bình hoa khác nhau (mỗi bông hoa cắm vào một bình) là:',
    options: [
      { text: '$16$', correct: false },
      { text: '$24$', correct: true },
      { text: '$8$', correct: false },
      { text: '$4$', correct: false }
    ],
    explanation: 'Mỗi cách cắm $4$ bông hoa khác nhau vào $4$ bình khác nhau là một hoán vị của $4$ phần tử. Số cách cắm là: $P_4 = 4! = 4 \\times 3 \\times 2 \\times 1 = 24$ cách.'
  },
  {
    id: 2,
    title: 'Câu 2 (SGK 8.18 - Tr.76)',
    pts: 20,
    question: 'Số các số có ba chữ số khác nhau, trong đó các chữ số đều lớn hơn $0$ và nhỏ hơn hoặc bằng $5$ là:',
    options: [
      { text: '$120$', correct: false },
      { text: '$60$', correct: true },
      { text: '$720$', correct: false },
      { text: '$2$', correct: false }
    ],
    explanation: 'Tập các chữ số thoả mãn là $\\{1; 2; 3; 4; 5\\}$ gồm $5$ chữ số. Việc lập một số có $3$ chữ số khác nhau từ tập này là chọn $3$ số và xếp thứ tự, tức là một chỉnh hợp chập $3$ của $5$: $A_5^3 = 5 \\times 4 \\times 3 = 60$ số.'
  },
  {
    id: 3,
    title: 'Câu 3 (SGK 8.19 - Tr.76)',
    pts: 20,
    question: 'Số cách chọn $3$ bạn học sinh đi học bơi từ một nhóm $10$ bạn học sinh là:',
    options: [
      { text: '$3\\,628\\,800$', correct: false },
      { text: '$604\\,800$', correct: false },
      { text: '$120$', correct: true },
      { text: '$720$', correct: false }
    ],
    explanation: 'Chọn $3$ bạn học sinh từ nhóm $10$ bạn mà không phân biệt thứ tự là một tổ hợp chập $3$ của $10$: $C_{10}^3 = \\frac{10 \\times 9 \\times 8}{3 \\times 2 \\times 1} = 120$ cách.'
  },
  {
    id: 4,
    title: 'Câu 4 (SGK 8.20 - Tr.76)',
    pts: 20,
    question: 'Bạn An gieo một con xúc xắc hai lần liên tiếp. Số các trường hợp để tổng số chấm xuất hiện trên con xúc xắc bằng $8$ qua hai lần gieo là:',
    options: [
      { text: '$36$', correct: false },
      { text: '$6$', correct: false },
      { text: '$5$', correct: true },
      { text: '$4$', correct: false }
    ],
    explanation: 'Gọi kết quả sau hai lần gieo là $(x; y)$ với $x, y \\in \\{1; 2; 3; 4; 5; 6\\}$. Để $x + y = 8$, các cặp khả dĩ là: $(2; 6), (3; 5), (4; 4), (5; 3), (6; 2)$. Vậy có đúng $5$ trường hợp.'
  },
  {
    id: 5,
    title: 'Câu 5 (SGK 8.21 - Tr.76)',
    pts: 20,
    question: 'Hệ số của $x^4$ trong khai triển nhị thức $(3x - 4)^5$ là:',
    options: [
      { text: '$1620$', correct: false },
      { text: '$60$', correct: false },
      { text: '$-60$', correct: false },
      { text: '$-1620$', correct: true }
    ],
    explanation: 'Số hạng chứa $x^4$ trong khai triển $(3x - 4)^5$ ứng với $k = 1$: $C_5^1 (3x)^4 (-4)^1 = 5 \\cdot (81x^4) \\cdot (-4) = -1620 x^4$. Do đó hệ số là $-1620$.'
  },
  {
    id: 6,
    title: 'Câu 6 (SGK 8.22 - Tr.76)',
    pts: 20,
    question: 'Có bao nhiêu cách viết một dãy gồm $5$ chữ cái in hoa khác nhau đôi một từ bảng chữ cái tiếng Anh gồm $26$ chữ cái?',
    options: [
      { text: '$7\\,893\\,600$ cách', correct: true },
      { text: '$11\\,881\\,376$ cách', correct: false },
      { text: '$65\\,780$ cách', correct: false },
      { text: '$130$ cách', correct: false }
    ],
    explanation: 'Việc viết dãy $5$ chữ cái in hoa khác nhau đôi một là chọn $5$ chữ cái từ $26$ chữ cái và sắp xếp theo thứ tự, tức là một chỉnh hợp chập $5$ của $26$: $A_{26}^5 = 26 \\times 25 \\times 24 \\times 23 \\times 22 = 7\\,893\\,600$ cách.'
  },
  {
    id: 7,
    title: 'Câu 7 (SGK 8.23 - Tr.76)',
    pts: 20,
    question: 'Từ các chữ số $\\{1; 2; 3; 4; 5; 6\\}$, có thể lập được bao nhiêu số tự nhiên có ba chữ số khác nhau và chia hết cho $3$?',
    options: [
      { text: '$48$ số', correct: true },
      { text: '$120$ số', correct: false },
      { text: '$40$ số', correct: false },
      { text: '$36$ số', correct: false }
    ],
    explanation: 'Một số chia hết cho $3$ khi và chỉ khi tổng các chữ số của nó chia hết cho $3$. Phân loại các chữ số theo số dư khi chia cho $3$: nhóm dư $0$ là $\\{3; 6\\}$, dư $1$ là $\\{1; 4\\}$, dư $2$ là $\\{2; 5\\}$. Để tổng $3$ chữ số chia hết cho $3$, ta phải chọn $1$ số từ mỗi nhóm (có $2 \\times 2 \\times 2 = 8$ bộ $3$ số). Mỗi bộ gồm $3$ chữ số khác nhau tạo ra $3! = 6$ số. Tổng số các số lập được là: $8 \\times 6 = 48$ số.'
  },
  {
    id: 8,
    title: 'Câu 8 (SGK 8.24 - Tr.76)',
    pts: 20,
    question: 'Tế bào $A$ có $2n = 8$ NST, nguyên phân $5$ lần liên tiếp. Tế bào $B$ có $2n = 14$ NST, nguyên phân $4$ lần liên tiếp. Khẳng định nào sau đây là đúng?',
    options: [
      { text: 'Tổng số NST trong các tế bào tạo ra từ A nhiều hơn từ B ($256 > 224$)', correct: true },
      { text: 'Tổng số NST trong các tế bào tạo ra từ B nhiều hơn từ A ($256 < 224$)', correct: false },
      { text: 'Tổng số NST tạo ra ở hai tế bào là bằng nhau', correct: false },
      { text: 'Tế bào A tạo ra ít tế bào con hơn tế bào B', correct: false }
    ],
    explanation: 'Sau $5$ lần nguyên phân, tế bào A tạo ra $2^5 = 32$ tế bào con; mỗi tế bào chứa $8$ NST $\\Rightarrow$ tổng số NST là $32 \\times 8 = 256$ NST. Tế bào B sau $4$ lần nguyên phân tạo ra $2^4 = 16$ tế bào con; mỗi tế bào chứa $14$ NST $\\Rightarrow$ tổng số NST là $16 \\times 14 = 224$ NST. Vì $256 > 224$ nên tế bào A tạo ra nhiều NST hơn.'
  },
  {
    id: 9,
    title: 'Câu 9 (SGK 8.25c - Tr.76)',
    pts: 20,
    question: 'Lớp 10B có $40$ học sinh gồm $25$ nam và $15$ nữ. Hỏi có bao nhiêu cách chọn $3$ bạn tham gia đội thiện nguyện sao cho có ít nhất một bạn nam?',
    options: [
      { text: '$9425$ cách', correct: true },
      { text: '$9880$ cách', correct: false },
      { text: '$455$ cách', correct: false },
      { text: '$7255$ cách', correct: false }
    ],
    explanation: 'Dùng phương pháp phần bù: Số cách chọn $3$ học sinh bất kì từ $40$ học sinh là $C_{40}^3 = 9880$ cách. Số cách chọn $3$ học sinh mà không có bạn nam nào (tức là cả $3$ bạn đều là nữ) là $C_{15}^3 = 455$ cách. Vậy số cách chọn có ít nhất một bạn nam là: $9880 - 455 = 9425$ cách.'
  },
  {
    id: 10,
    title: 'Câu 10 (SGK 8.26 - Tr.76)',
    pts: 20,
    question: 'Trong khai triển nhị thức Newton của $(2x + 3)^5$, hệ số của $x^4$ hay hệ số của $x^3$ lớn hơn?',
    options: [
      { text: 'Hệ số của $x^3$ lớn hơn hệ số của $x^4$ ($720 > 240$)', correct: true },
      { text: 'Hệ số của $x^4$ lớn hơn hệ số của $x^3$ ($240 > 720$)', correct: false },
      { text: 'Hai hệ số bằng nhau ($720 = 720$)', correct: false },
      { text: 'Hệ số của $x^4$ bằng $480$, hệ số của $x^3$ bằng $360$', correct: false }
    ],
    explanation: 'Số hạng chứa $x^4$ ứng với $k = 1$: $C_5^1 (2x)^4 (3)^1 = 5 \\cdot 16 \\cdot 3 x^4 = 240 x^4 \\Rightarrow$ Hệ số là $240$. Số hạng chứa $x^3$ ứng với $k = 2$: $C_5^2 (2x)^3 (3)^2 = 10 \\cdot 8 \\cdot 9 x^3 = 720 x^3 \\Rightarrow$ Hệ số là $720$. Rõ ràng $720 > 240$, nên hệ số của $x^3$ lớn hơn hệ số của $x^4$.'
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

// --- LAB 1: SOLVER ĐA NĂNG ---
function initSolverLab() {
  const slN = document.getElementById('slN');
  const slK = document.getElementById('slK');
  const disp = document.getElementById('solverDisplay');
  const outEl = document.getElementById('solverOutput');

  function update() {
    const n = parseInt(slN.value, 10);
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

    disp.innerHTML = `
      <div style="background: rgba(99, 102, 241, 0.15); border: 1px solid #818cf8; border-radius: 10px; padding: 15px; text-align: center; flex: 1; min-width: 160px;">
        <div style="color: #a5b4fc; font-weight: bold;">Hoán Vị $P_{${n}}$</div>
        <div style="color: #ffffff; font-size: 1.5rem; font-weight: bold; margin: 6px 0;">${pVal.toLocaleString()}</div>
        <div style="color: #94a3b8; font-size: 0.85rem;">Xếp thứ tự $${n}$ phần tử</div>
      </div>
      <div style="background: rgba(6, 182, 212, 0.15); border: 1px solid #06b6d4; border-radius: 10px; padding: 15px; text-align: center; flex: 1; min-width: 160px;">
        <div style="color: #67e8f9; font-weight: bold;">Chỉnh Hợp $A_{${n}}^{${k}}$</div>
        <div style="color: #ffffff; font-size: 1.5rem; font-weight: bold; margin: 6px 0;">${aVal.toLocaleString()}</div>
        <div style="color: #94a3b8; font-size: 0.85rem;">Chọn $${k}$ có thứ tự</div>
      </div>
      <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; border-radius: 10px; padding: 15px; text-align: center; flex: 1; min-width: 160px;">
        <div style="color: #fde68a; font-weight: bold;">Tổ Hợp $C_{${n}}^{${k}}$</div>
        <div style="color: #ffffff; font-size: 1.5rem; font-weight: bold; margin: 6px 0;">${cVal.toLocaleString()}</div>
        <div style="color: #94a3b8; font-size: 0.85rem;">Chọn $${k}$ không thứ tự</div>
      </div>
    `;
    renderMathInTree(disp);

    if (outEl) {
      outEl.innerHTML = formatMathText(
        `📌 **Phân tích so sánh mô hình đếm ($n = ${n}, k = ${k}$):**<br>` +
        `• $A_{${n}}^{${k}} = k! \\cdot C_{${n}}^{${k}} = ${factorial(k)} \\times ${cVal.toLocaleString()} = ${aVal.toLocaleString()}$.<br>` +
        `• Nhận xét: Số cách chọn có thứ tự gấp đúng $k! = ${factorial(k)}$ lần số cách chọn không có thứ tự.<br>` +
        `• Tính chất bù đối xứng: $C_{${n}}^{${n - k}} = C_{${n}}^{${k}} = ${cVal.toLocaleString()}$.`
      );
      renderMathInTree(outEl);
    }
  }

  slN.addEventListener('input', () => { update(); unlockBadge(1); });
  slK.addEventListener('input', () => { update(); unlockBadge(1); });

  update();
}

// --- LAB 2: MÔ PHỎNG NHỊ THỨC NEWTON & BIỂU ĐỒ HỆ SỐ ---
function initNewtonLab() {
  const canvas = document.getElementById('newtonCanvas');
  const slExp = document.getElementById('slExp');
  const slA = document.getElementById('slConstA');
  const outEl = document.getElementById('newtonOutput');

  function update() {
    const n = parseInt(slExp.value, 10);
    const a = parseInt(slA.value, 10);

    document.getElementById('valExp').textContent = n;
    document.getElementById('valConstA').textContent = a;

    // Expand (x + a)^n
    // Term k: C_n^k * x^(n-k) * a^k
    const coeffs = [];
    for (let k = 0; k <= n; k++) {
      const c = combination(n, k);
      const coeff = c * Math.pow(a, k);
      coeffs.push(coeff);
    }

    // Draw Bar Chart
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const maxAbs = Math.max(...coeffs.map(v => Math.abs(v)), 1);
    const barW = 46;
    const gap = (w - (n + 1) * barW) / (n + 2);
    const baseY = h / 2;

    ctx.strokeStyle = 'rgba(165, 180, 252, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, baseY);
    ctx.lineTo(w - 20, baseY);
    ctx.stroke();

    coeffs.forEach((cVal, idx) => {
      const xPos = gap + idx * (barW + gap);
      const barH = (cVal / maxAbs) * (h / 2.6);

      ctx.fillStyle = cVal >= 0 ? '#38bdf8' : '#ec4899';
      ctx.fillRect(xPos, baseY, barW, -barH);

      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cVal, xPos + barW / 2, baseY - barH + (cVal >= 0 ? -6 : 14));

      const pX = n - idx;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(pX > 0 ? `x^${pX}` : 'h.số', xPos + barW / 2, baseY + (cVal >= 0 ? 16 : -8));
    });
    ctx.textAlign = 'left';

    const aSign = a >= 0 ? `+ ${a}` : `- ${Math.abs(a)}`;
    const sumCoeff = Math.pow(1 + a, n);

    if (outEl) {
      outEl.innerHTML = formatMathText(
        `🌟 **Khai triển nhị thức $(x ${aSign})^{${n}}$:**<br>` +
        `• Khai triển có đúng $${n + 1}$ số hạng.<br>` +
        `• Tổng các hệ số của khai triển (khi $x = 1$): $(1 + (${a}))^{${n}} = ${sumCoeff}$.<br>` +
        `• Khi $a = 1$: Ta có đẳng thức tam giác Pascal $\\sum_{k=0}^{${n}} C_{${n}}^k = 2^{${n}} = ${Math.pow(2, n)}$.`
      );
      renderMathInTree(outEl);
    }
  }

  slExp.addEventListener('input', () => { update(); unlockBadge(1); });
  slA.addEventListener('input', () => { update(); unlockBadge(1); });

  update();
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
  initSolverLab();
  initNewtonLab();

  renderMathInTree(document.body);
});
