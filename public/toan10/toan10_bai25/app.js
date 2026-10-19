// ========================================================
// TOÁN 10 - BÀI 25: NHỊ THỨC NEWTON
// Pure Vanilla Web Stack • Web Audio API • KaTeX / MathML Core
// ========================================================

// --- APP STATE ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Nhị Thức Newton',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false],
  polyDegree: 4,
  approxN: 5
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

// --- MATH COMBINATION ---
function combination(n, k) {
  if (k < 0 || k > n) return 0;
  let num = 1;
  for (let i = 0; i < k; i++) num *= (n - i);
  let den = 1;
  for (let i = 2; i <= k; i++) den *= i;
  return num / den;
}

// --- MATHML FALLBACK PARSER ---
function latexToMathML(latex, display = false) {
  let s = latex.trim();
  s = s.replace(/\\overrightarrow\{([A-Za-z0-9_]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#8594;</mo></mover>');
  s = s.replace(/\\vec\{([A-Za-z0-9_]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#8594;</mo></mover>');
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  s = s.replace(/\\approx/g, '<mo>&#8776;</mo>');
  s = s.replace(/\\cdot/g, '<mo>&#183;</mo>');
  s = s.replace(/\\times/g, '<mo>&#215;</mo>');
  s = s.replace(/\\le/g, '<mo>&#8804;</mo>');
  s = s.replace(/\\ge/g, '<mo>&#8805;</mo>');
  s = s.replace(/\\ne/g, '<mo>&#8800;</mo>');
  s = s.replace(/\\in/g, '<mo>&#8712;</mo>');
  s = s.replace(/\\mathbb\{Z\}/g, '<mi>&#8484;</mi>');
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

// --- QUIZ DATA: BÀI 25 (SGK 8.12 - 8.16 TRANG 74-75) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1 (SGK 8.12a - Tr.74)',
    pts: 20,
    question: 'Khai triển của đa thức $(x - 3)^4$ là:',
    options: [
      { text: '$x^4 - 12x^3 + 54x^2 - 108x + 81$', correct: true },
      { text: '$x^4 - 3x^3 + 9x^2 - 27x + 81$', correct: false },
      { text: '$x^4 - 12x^3 - 54x^2 - 108x + 81$', correct: false },
      { text: '$x^4 + 12x^3 + 54x^2 + 108x + 81$', correct: false }
    ],
    explanation: 'Áp dụng công thức nhị thức bậc $4$ với $a = x, b = -3$: $(x - 3)^4 = x^4 + 4x^3(-3) + 6x^2(-3)^2 + 4x(-3)^3 + (-3)^4 = x^4 - 12x^3 + 54x^2 - 108x + 81$.'
  },
  {
    id: 2,
    title: 'Câu 2 (SGK 8.12b - Tr.74)',
    pts: 20,
    question: 'Hệ số của số hạng chứa $x^2 y^2$ trong khai triển của nhị thức $(3x - 2y)^4$ là:',
    options: [
      { text: '$216$', correct: true },
      { text: '$-216$', correct: false },
      { text: '$54$', correct: false },
      { text: '$108$', correct: false }
    ],
    explanation: 'Số hạng chứa $x^2 y^2$ ứng với $k = 2$: $C_4^2 (3x)^2 (-2y)^2 = 6 \\cdot (9x^2) \\cdot (4y^2) = 216 x^2 y^2$. Do đó hệ số là $216$.'
  },
  {
    id: 3,
    title: 'Câu 3 (SGK 8.12c - Tr.74)',
    pts: 20,
    question: 'Rút gọn biểu thức $(x + 5)^4 + (x - 5)^4$ ta được:',
    options: [
      { text: '$2x^4 + 300x^2 + 1250$', correct: true },
      { text: '$2x^4 + 1250$', correct: false },
      { text: '$2x^4 + 150x^2 + 625$', correct: false },
      { text: '$40x^3 + 1000x$', correct: false }
    ],
    explanation: 'Khai triển $(x + 5)^4$ và $(x - 5)^4$, các số hạng chứa luỹ thừa lẻ của $5$ trái dấu nên triệt tiêu lẫn nhau: $(x + 5)^4 + (x - 5)^4 = 2[x^4 + 6x^2(5^2) + 5^4] = 2(x^4 + 150x^2 + 625) = 2x^4 + 300x^2 + 1250$.'
  },
  {
    id: 4,
    title: 'Câu 4 (SGK 8.12d - Tr.74)',
    pts: 20,
    question: 'Số hạng chứa $y^5$ trong khai triển nhị thức $(x - 2y)^5$ là:',
    options: [
      { text: '$-32y^5$', correct: true },
      { text: '$32y^5$', correct: false },
      { text: '$-10y^5$', correct: false },
      { text: '$-16y^5$', correct: false }
    ],
    explanation: 'Số hạng chứa $y^5$ ứng với số hạng cuối cùng $k = 5$: $C_5^5 x^0 (-2y)^5 = 1 \\cdot 1 \\cdot (-32y^5) = -32y^5$.'
  },
  {
    id: 5,
    title: 'Câu 5 (SGK 8.13 - Tr.74)',
    pts: 20,
    question: 'Tìm hệ số của $x^4$ trong khai triển nhị thức của $(3x - 1)^5$:',
    options: [
      { text: '$-405$', correct: true },
      { text: '$405$', correct: false },
      { text: '$-81$', correct: false },
      { text: '$-135$', correct: false }
    ],
    explanation: 'Số hạng chứa $x^4$ trong khai triển $(3x - 1)^5$ là số hạng thứ hai ($k = 1$): $C_5^1 (3x)^4 (-1)^1 = 5 \\cdot (81x^4) \\cdot (-1) = -405 x^4$. Vậy hệ số của $x^4$ là $-405$.'
  },
  {
    id: 6,
    title: 'Câu 6 (SGK 8.14 - Tr.74)',
    pts: 20,
    question: 'Biểu diễn $(3 + \\sqrt{2})^5 - (3 - \\sqrt{2})^5$ dưới dạng $a + b\\sqrt{2}$ với $a, b \\in \\mathbb{Z}$. Giá trị của $b$ là:',
    options: [
      { text: '$1178$', correct: true },
      { text: '$589$', correct: false },
      { text: '$2356$', correct: false },
      { text: '$708$', correct: false }
    ],
    explanation: 'Khi trừ hai khai triển, các số hạng hữu tỉ triệt tiêu, còn lại hai lần các số hạng chứa $(\\sqrt{2})^1, (\\sqrt{2})^3, (\\sqrt{2})^5$: $(3+\\sqrt{2})^5 - (3-\\sqrt{2})^5 = 2[C_5^1 \\cdot 3^4 \\cdot \\sqrt{2} + C_5^3 \\cdot 3^2 \\cdot (\\sqrt{2})^3 + C_5^5 \\cdot (\\sqrt{2})^5] = 2[5 \\cdot 81\\sqrt{2} + 10 \\cdot 9 \\cdot 2\\sqrt{2} + 4\\sqrt{2}] = 2(405 + 180 + 4)\\sqrt{2} = 2 \\cdot 589\\sqrt{2} = 1178\\sqrt{2}$. Vậy $a = 0, b = 1178$.'
  },
  {
    id: 7,
    title: 'Câu 7 (SGK 8.15a - Tr.75)',
    pts: 20,
    question: 'Dùng hai số hạng đầu tiên trong khai triển của $(1 + 0,02)^5$ để tính giá trị gần đúng của $1,02^5$, ta được kết quả là:',
    options: [
      { text: '$1,1$', correct: true },
      { text: '$1,02$', correct: false },
      { text: '$1,05$', correct: false },
      { text: '$1,12$', correct: false }
    ],
    explanation: 'Áp dụng công thức tính gần đúng $(1 + x)^5 \\approx 1 + 5x$ với $x = 0,02$: $1,02^5 = (1 + 0,02)^5 \\approx 1 + 5 \\cdot 0,02 = 1 + 0,1 = 1,1$.'
  },
  {
    id: 8,
    title: 'Câu 8 (SGK 8.15b - Tr.75)',
    pts: 20,
    question: 'Biết giá trị đúng của $1,02^5 \\approx 1,10408$. Sai số tuyệt đối của giá trị gần đúng $1,1$ ở Câu 7 thoả mãn:',
    options: [
      { text: '$\\Delta < 0,005$', correct: true },
      { text: '$\\Delta > 0,01$', correct: false },
      { text: '$\\Delta = 0,04$', correct: false },
      { text: '$\\Delta = 0$', correct: false }
    ],
    explanation: 'Sai số tuyệt đối là $|1,10408 - 1,1| = 0,00408$. Rõ ràng $0,00408 < 0,005$. Do đó hai số hạng đầu mang lại độ chính xác rất cao cho các giá trị $x$ bé.'
  },
  {
    id: 9,
    title: 'Câu 9 (SGK 8.16a - Tr.75)',
    pts: 20,
    question: 'Số dân của một tỉnh hiện tại là $800$ nghìn người với tỉ lệ tăng dân số hàng năm là $r\\%$. Công thức tính số dân $P$ của tỉnh đó sau $5$ năm nữa là:',
    options: [
      { text: '$P = 800\\left(1 + \\frac{r}{100}\\right)^5$', correct: true },
      { text: '$P = 800\\left(1 + \\frac{5r}{100}\\right)$', correct: false },
      { text: '$P = 800\\left(1 + r\\right)^5$', correct: false },
      { text: '$P = 800 \\cdot (1,05)^r$', correct: false }
    ],
    explanation: 'Sau $1$ năm, số dân là $800(1 + r/100)$. Sau $2$ năm là $800(1 + r/100)^2$. Tương tự sau $5$ năm số dân là $P = 800(1 + r/100)^5$ (nghìn người).'
  },
  {
    id: 10,
    title: 'Câu 10 (SGK 8.16b - Tr.75)',
    pts: 20,
    question: 'Với tỉ lệ tăng dân số $r = 1,5$, dùng hai số hạng đầu trong khai triển của $(1 + 0,015)^5$, ước tính số dân của tỉnh đó sau $5$ năm là:',
    options: [
      { text: '$860$ nghìn người', correct: true },
      { text: '$840$ nghìn người', correct: false },
      { text: '$880$ nghìn người', correct: false },
      { text: '$850$ nghìn người', correct: false }
    ],
    explanation: 'Ta có $(1 + 0,015)^5 \\approx 1 + 5 \\cdot 0,015 = 1 + 0,075 = 1,075$. Vậy số dân sau $5$ năm ước tính là: $P \\approx 800 \\times 1,075 = 860$ nghìn người.'
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

// --- LAB 1: MÁY KHAI TRIỂN ĐA THỨC (Ax + B)^n ---
function initPolyLab() {
  const canvas = document.getElementById('polyCanvas');
  const btn4 = document.getElementById('btnDeg4');
  const btn5 = document.getElementById('btnDeg5');
  const slA = document.getElementById('slA');
  const slB = document.getElementById('slB');
  const outEl = document.getElementById('polyOutput');

  function update() {
    [btn4, btn5].forEach(b => b.classList.remove('active'));
    if (appState.polyDegree === 4) btn4.classList.add('active');
    else btn5.classList.add('active');

    let a = parseInt(slA.value, 10);
    if (a === 0) { a = 1; slA.value = 1; }
    const b = parseInt(slB.value, 10);
    const n = appState.polyDegree;

    document.getElementById('valA').textContent = a;
    document.getElementById('valB').textContent = b;

    // Compute coefficients for k = 0 to n
    // Term k has x^(n-k): coeff = C_n^k * a^(n-k) * b^k
    const terms = [];
    const coeffs = [];
    for (let k = 0; k <= n; k++) {
      const c = combination(n, k);
      const powA = Math.pow(a, n - k);
      const powB = Math.pow(b, k);
      const coeff = c * powA * powB;
      coeffs.push(coeff);

      const pX = n - k;
      let termStr = '';
      if (coeff !== 0) {
        let sign = coeff > 0 ? (k === 0 ? '' : '+ ') : '- ';
        let absC = Math.abs(coeff);
        let coeffText = (absC === 1 && pX > 0) ? '' : absC.toString();
        let xText = pX > 1 ? `x^${pX}` : (pX === 1 ? 'x' : '');
        termStr = `${sign}${coeffText}${xText}`;
      }
      if (termStr) terms.push(termStr);
    }

    const polyExpanded = terms.join(' ');

    // Draw Bar Chart of Coefficients
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const maxAbs = Math.max(...coeffs.map(v => Math.abs(v)), 1);
    const barWidth = 45;
    const gap = (w - (n + 1) * barWidth) / (n + 2);
    const baseY = h / 2;

    // Draw Axis
    ctx.strokeStyle = 'rgba(165, 180, 252, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(20, baseY);
    ctx.lineTo(w - 20, baseY);
    ctx.stroke();

    coeffs.forEach((cVal, idx) => {
      const x = gap + idx * (barWidth + gap);
      const barH = (cVal / maxAbs) * (h / 2.5);

      ctx.fillStyle = cVal >= 0 ? '#06b6d4' : '#f43f5e';
      ctx.fillRect(x, baseY, barWidth, -barH);

      ctx.fillStyle = '#ffffff';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(cVal, x + barWidth / 2, baseY - barH + (cVal >= 0 ? -6 : 14));

      const pX = n - idx;
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(pX > 0 ? `x^${pX}` : 'h.số', x + barWidth / 2, baseY + (cVal >= 0 ? 16 : -8));
    });
    ctx.textAlign = 'left';

    const bSign = b >= 0 ? `+ ${b}` : `- ${Math.abs(b)}`;
    const aText = a === 1 ? 'x' : (a === -1 ? '-x' : `${a}x`);

    if (outEl) {
      outEl.innerHTML = formatMathText(
        `🔍 **Khai triển hoàn chỉnh:** $(${aText} ${bSign})^{${n}} = ${polyExpanded}$<br>` +
        `• Số các số hạng: $${n + 1}$ số hạng.<br>` +
        `• Bậc cao nhất: bậc $${n}$ | Hệ số tự do (không chứa $x$): $${coeffs[n]}$.<br>` +
        `• Tổng hệ số các số hạng (thay $x = 1$): $(${a} + (${b}))^{${n}} = ${Math.pow(a + b, n)}$.`
      );
      renderMathInTree(outEl);
    }
  }

  btn4.addEventListener('click', () => { appState.polyDegree = 4; update(); playSound('click'); unlockBadge(1); });
  btn5.addEventListener('click', () => { appState.polyDegree = 5; update(); playSound('click'); unlockBadge(1); });
  slA.addEventListener('input', () => { update(); unlockBadge(1); });
  slB.addEventListener('input', () => { update(); unlockBadge(1); });

  update();
}

// --- LAB 2: TÍNH GẦN ĐÚNG & SAI SỐ ---
function initApproxLab() {
  const slX = document.getElementById('slX');
  const btnN4 = document.getElementById('btnApproxN4');
  const btnN5 = document.getElementById('btnApproxN5');
  const display = document.getElementById('approxDisplay');
  const outEl = document.getElementById('approxOutput');

  function update() {
    [btnN4, btnN5].forEach(b => b.classList.remove('active'));
    if (appState.approxN === 4) btnN4.classList.add('active');
    else btnN5.classList.add('active');

    const x = parseFloat(slX.value);
    const n = appState.approxN;
    document.getElementById('valX').textContent = x.toFixed(3);

    const approxVal = 1 + n * x;
    const exactVal = Math.pow(1 + x, n);
    const error = Math.abs(exactVal - approxVal);

    display.innerHTML = `
      <div style="display: flex; gap: 20px; flex-wrap: wrap; justify-content: center; width: 100%;">
        <div style="background: rgba(6, 182, 212, 0.15); border: 1px solid #06b6d4; border-radius: 10px; padding: 12px 20px; text-align: center; flex: 1; min-width: 160px;">
          <div style="color: #67e8f9; font-weight: bold;">Giá trị gần đúng (2 số hạng đầu)</div>
          <div style="color: #ffffff; font-size: 1.4rem; font-weight: bold; margin-top: 4px;">${approxVal.toFixed(6)}</div>
          <div style="color: #94a3b8; font-size: 0.85rem;">$1 + ${n}(${x.toFixed(3)})$</div>
        </div>
        <div style="background: rgba(16, 185, 129, 0.15); border: 1px solid #10b981; border-radius: 10px; padding: 12px 20px; text-align: center; flex: 1; min-width: 160px;">
          <div style="color: #6ee7b7; font-weight: bold;">Giá trị chính xác máy tính</div>
          <div style="color: #ffffff; font-size: 1.4rem; font-weight: bold; margin-top: 4px;">${exactVal.toFixed(6)}</div>
          <div style="color: #94a3b8; font-size: 0.85rem;">$(1 + ${x.toFixed(3)})^{${n}}$</div>
        </div>
        <div style="background: rgba(245, 158, 11, 0.15); border: 1px solid #f59e0b; border-radius: 10px; padding: 12px 20px; text-align: center; flex: 1; min-width: 160px;">
          <div style="color: #fde68a; font-weight: bold;">Sai số tuyệt đối $\\Delta$</div>
          <div style="color: #f59e0b; font-size: 1.4rem; font-weight: bold; margin-top: 4px;">${error.toFixed(6)}</div>
          <div style="color: #94a3b8; font-size: 0.85rem;">$|A - V|$</div>
        </div>
      </div>
    `;
    renderMathInTree(display);

    if (outEl) {
      outEl.innerHTML = formatMathText(
        `📐 **Đánh giá thực nghiệm:**<br>` +
        `• Khai triển: $(1 + ${x.toFixed(3)})^{${n}} = 1 + ${n}(${x.toFixed(3)}) + C_{${n}}^2 (${x.toFixed(3)})^2 + \\dots$<br>` +
        `• Khi bỏ qua các số hạng bậc $\\ge 2$, sai số tuyệt đối là $\\Delta = ${error.toFixed(6)}$.<br>` +
        `• Nhận xét: Với $x = ${x.toFixed(3)}$ rất nhỏ, sai số chỉ chiếm khoảng ${(error / exactVal * 100).toFixed(4)}\\% giá trị thực tế.`
      );
      renderMathInTree(outEl);
    }
  }

  btnN4.addEventListener('click', () => { appState.approxN = 4; update(); playSound('click'); unlockBadge(1); });
  btnN5.addEventListener('click', () => { appState.approxN = 5; update(); playSound('click'); unlockBadge(1); });
  slX.addEventListener('input', () => { update(); unlockBadge(1); });

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
  initPolyLab();
  initApproxLab();

  renderMathInTree(document.body);
});
