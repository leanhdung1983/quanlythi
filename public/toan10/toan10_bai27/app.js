// ========================================================
// TOÁN 10 - BÀI 27: THỰC HÀNH TÍNH XÁC SUẤT THEO ĐỊNH NGHĨA CỔ ĐIỂN
// Pure Vanilla Web Stack • Web Audio API • KaTeX / MathML Core
// ========================================================

// --- APP STATE ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Tổ Hợp & Cây Xác Suất',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false],
  totalUrnDraws: 0,
  urnSuccesses: 0
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
        gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.08 + 0.2);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.2);
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
  s = s.replace(/\\Omega/g, '<mi>&#937;</mi>');
  s = s.replace(/\\overline\{([^{}]+)\}/g, '<mover><mrow><mi>$1</mi></mrow><mo>&macr;</mo></mover>');
  s = s.replace(/\\varnothing/g, '<mi>&#8709;</mi>');
  s = s.replace(/\\subset/g, '<mo>&#8834;</mo>');
  s = s.replace(/\\setminus/g, '<mo>&#8726;</mo>');
  s = s.replace(/\\cup/g, '<mo>&#8746;</mo>');
  s = s.replace(/\\cap/g, '<mo>&#8745;</mo>');
  s = s.replace(/\\dots/g, '<mo>&#8230;</mo>');
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

// --- QUIZ DATA: BÀI 27 (SGK 9.6 - 9.11 TRANG 86 - 87) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1 (SGK Ví dụ 1a - Tr.83)',
    pts: 20,
    question: 'Một tổ trong lớp 10A có 10 học sinh gồm 6 học sinh nam và 4 học sinh nữ. Giáo viên chọn ngẫu nhiên 6 học sinh trong tổ để tham gia đội tình nguyện. Xác suất để 6 học sinh được chọn đều là nam là:',
    options: [
      { text: '$\\frac{1}{210}$', correct: true },
      { text: '$\\frac{1}{105}$', correct: false },
      { text: '$\\frac{1}{84}$', correct: false },
      { text: '$\\frac{3}{70}$', correct: false }
    ],
    explanation: 'Không gian mẫu là số cách chọn 6 học sinh từ 10 học sinh: $n(\\Omega) = C_{10}^6 = 210$. Số cách chọn 6 học sinh đều là nam từ 6 nam là: $n(C) = C_6^6 = 1$. Do đó xác suất là $P(C) = \\frac{n(C)}{n(\\Omega)} = \\frac{1}{210}$.'
  },
  {
    id: 2,
    title: 'Câu 2 (SGK Ví dụ 1b - Tr.83)',
    pts: 20,
    question: 'Một tổ có 10 học sinh gồm 6 nam và 4 nữ. Giáo viên chọn ngẫu nhiên 6 học sinh. Xác suất để trong 6 học sinh được chọn có 4 nam và 2 nữ là:',
    options: [
      { text: '$\\frac{1}{7}$', correct: false },
      { text: '$\\frac{3}{7}$', correct: true },
      { text: '$\\frac{4}{7}$', correct: false },
      { text: '$\\frac{5}{14}$', correct: false }
    ],
    explanation: 'Không gian mẫu $n(\\Omega) = C_{10}^6 = 210$. Số cách chọn 4 nam từ 6 nam là $C_6^4 = 15$. Số cách chọn 2 nữ từ 4 nữ là $C_4^2 = 6$. Theo quy tắc nhân, số kết quả thuận lợi là $n(D) = 15 \\times 6 = 90$. Xác suất là $P(D) = \\frac{90}{210} = \\frac{3}{7}$.'
  },
  {
    id: 3,
    title: 'Câu 3 (SGK Luyện tập 1 - Tr.84)',
    pts: 20,
    question: 'Một tổ trong lớp 10B có 12 học sinh, trong đó có 7 học sinh nam và 5 học sinh nữ. Giáo viên chọn ngẫu nhiên 6 học sinh để kiểm tra vở bài tập Toán. Xác suất để số học sinh nữ bằng số học sinh nam được chọn là:',
    options: [
      { text: '$\\frac{25}{66}$', correct: true },
      { text: '$\\frac{35}{66}$', correct: false },
      { text: '$\\frac{5}{12}$', correct: false },
      { text: '$\\frac{7}{22}$', correct: false }
    ],
    explanation: 'Số học sinh nữ bằng số học sinh nam nghĩa là chọn được 3 nam và 3 nữ. Không gian mẫu $n(\\Omega) = C_{12}^6 = 924$. Số cách chọn 3 nam từ 7 nam là $C_7^3 = 35$, số cách chọn 3 nữ từ 5 nữ là $C_5^3 = 10$. Số kết quả thuận lợi là $35 \\times 10 = 350$. Xác suất là $P = \\frac{350}{924} = \\frac{25}{66}$.'
  },
  {
    id: 4,
    title: 'Câu 4 (SGK Luyện tập 3 - Tr.86)',
    pts: 20,
    question: 'Một gia đình có 3 người con. Giả thiết rằng khả năng sinh con trai và khả năng sinh con gái là như nhau. Xác suất để gia đình đó có đúng một con trai và hai con gái là:',
    options: [
      { text: '$\\frac{1}{8}$', correct: false },
      { text: '$\\frac{1}{4}$', correct: false },
      { text: '$\\frac{3}{8}$', correct: true },
      { text: '$\\frac{1}{2}$', correct: false }
    ],
    explanation: 'Không gian mẫu khi sinh 3 con có $n(\\Omega) = 2^3 = 8$ kết quả. Biến cố có đúng 1 con trai và 2 con gái gồm 3 kết quả thuận lợi: $\\{TGG; GTG; GGT\\}$. Do đó xác suất là $P = \\frac{3}{8}$.'
  },
  {
    id: 5,
    title: 'Câu 5 (SGK Ví dụ 3 - Tr.85)',
    pts: 20,
    question: 'Chọn ngẫu nhiên hai số từ tập $\\{1; 2; \\dots; 9\\}$. Xác suất để trong hai số được chọn có ít nhất một số chẵn là:',
    options: [
      { text: '$\\frac{5}{18}$', correct: false },
      { text: '$\\frac{13}{18}$', correct: true },
      { text: '$\\frac{7}{18}$', correct: false },
      { text: '$\\frac{11}{18}$', correct: false }
    ],
    explanation: 'Không gian mẫu $n(\\Omega) = C_9^2 = 36$. Xét biến cố đối $\\overline{H}$: "Cả hai số được chọn đều là số lẻ". Tập có 5 số lẻ $\\{1; 3; 5; 7; 9\\}$, nên số cách chọn 2 số lẻ là $n(\\overline{H}) = C_5^2 = 10$. Xác suất biến cố đối là $P(\\overline{H}) = \\frac{10}{36} = \\frac{5}{18}$. Vậy $P(H) = 1 - P(\\overline{H}) = 1 - \\frac{5}{18} = \\frac{13}{18}$.'
  },
  {
    id: 6,
    title: 'Câu 6 (SGK 9.6 - Tr.86)',
    pts: 20,
    question: 'Chọn ngẫu nhiên một gia đình có 3 con và quan sát giới tính của ba người con này. Xác suất của biến cố: "Có ít nhất một người con trai" là:',
    options: [
      { text: '$\\frac{3}{8}$', correct: false },
      { text: '$\\frac{5}{8}$', correct: false },
      { text: '$\\frac{7}{8}$', correct: true },
      { text: '$\\frac{1}{2}$', correct: false }
    ],
    explanation: 'Không gian mẫu $n(\\Omega) = 8$. Biến cố đối của "có ít nhất một con trai" là "cả ba con đều là con gái" (chỉ có 1 kết quả duy nhất là $GGG$). Xác suất cần tìm là $P = 1 - \\frac{1}{8} = \\frac{7}{8}$.'
  },
  {
    id: 7,
    title: 'Câu 7 (SGK 9.7a - Tr.86)',
    pts: 20,
    question: 'Một hộp đựng các tấm thẻ đánh số $10; 11; \\dots; 20$ (gồm 11 tấm thẻ). Rút ngẫu nhiên từ hộp hai tấm thẻ. Xác suất để cả hai thẻ rút được đều mang số lẻ là:',
    options: [
      { text: '$\\frac{1}{11}$', correct: false },
      { text: '$\\frac{2}{11}$', correct: true },
      { text: '$\\frac{3}{11}$', correct: false },
      { text: '$\\frac{4}{11}$', correct: false }
    ],
    explanation: 'Không gian mẫu là $n(\\Omega) = C_{11}^2 = 55$. Các thẻ mang số lẻ gồm $\\{11; 13; 15; 17; 19\\}$ (5 thẻ). Số cách chọn 2 thẻ lẻ là $n(C) = C_5^2 = 10$. Xác suất là $P(C) = \\frac{10}{55} = \\frac{2}{11}$.'
  },
  {
    id: 8,
    title: 'Câu 8 (SGK 9.7b - Tr.86)',
    pts: 20,
    question: 'Một hộp đựng các tấm thẻ đánh số từ 10 đến 20 (gồm 11 tấm thẻ). Rút ngẫu nhiên hai tấm thẻ. Xác suất để cả hai thẻ rút được đều mang số chẵn là:',
    options: [
      { text: '$\\frac{2}{11}$', correct: false },
      { text: '$\\frac{3}{11}$', correct: true },
      { text: '$\\frac{4}{11}$', correct: false },
      { text: '$\\frac{5}{11}$', correct: false }
    ],
    explanation: 'Các tấm thẻ mang số chẵn gồm $\\{10; 12; 14; 16; 18; 20\\}$ (6 thẻ). Số cách rút 2 thẻ chẵn là $n(D) = C_6^2 = 15$. Xác suất là $P(D) = \\frac{15}{55} = \\frac{3}{11}$.'
  },
  {
    id: 9,
    title: 'Câu 9 (SGK 9.8 - Tr.86)',
    pts: 20,
    question: 'Một chiếc hộp đựng 6 viên bi trắng, 4 viên bi đỏ và 2 viên bi đen. Chọn ngẫu nhiên ra 6 viên bi. Xác suất để trong 6 viên bi đó có 3 viên bi trắng, 2 viên bi đỏ và 1 viên bi đen là:',
    options: [
      { text: '$\\frac{10}{77}$', correct: false },
      { text: '$\\frac{15}{77}$', correct: false },
      { text: '$\\frac{20}{77}$', correct: true },
      { text: '$\\frac{25}{77}$', correct: false }
    ],
    explanation: 'Tổng số viên bi trong hộp là $6 + 4 + 2 = 12$ viên. Số cách chọn 6 viên bi là $n(\\Omega) = C_{12}^6 = 924$. Số cách chọn 3 bi trắng từ 6 bi trắng là $C_6^3 = 20$. Số cách chọn 2 bi đỏ từ 4 bi đỏ là $C_4^2 = 6$. Số cách chọn 1 bi đen từ 2 bi đen là $C_2^1 = 2$. Số kết quả thuận lợi là $20 \\times 6 \\times 2 = 240$. Do đó xác suất là $P = \\frac{240}{924} = \\frac{20}{77}$.'
  },
  {
    id: 10,
    title: 'Câu 10 (SGK 9.11 - Tr.87)',
    pts: 20,
    question: 'Gieo lần lượt hai con xúc xắc cân đối. Xác suất để ít nhất một con xúc xắc xuất hiện mặt 6 chấm là:',
    options: [
      { text: '$\\frac{1}{6}$', correct: false },
      { text: '$\\frac{11}{36}$', correct: true },
      { text: '$\\frac{13}{36}$', correct: false },
      { text: '$\\frac{1}{3}$', correct: false }
    ],
    explanation: 'Không gian mẫu có $n(\\Omega) = 6 \\times 6 = 36$ phần tử. Biến cố đối $\\overline{E}$: "Cả hai con xúc xắc đều không xuất hiện mặt 6 chấm". Mỗi con có 5 khả năng (từ 1 đến 5), do đó $n(\\overline{E}) = 5 \\times 5 = 25$. Suy ra $P(\\overline{E}) = \\frac{25}{36}$. Vậy xác suất để có ít nhất một mặt 6 chấm là $P(E) = 1 - P(\\overline{E}) = 1 - \\frac{25}{36} = \\frac{11}{36}$.'
  }
];

// --- HUD & PROGRESS UPDATER ---
function updateHUD() {
  const avatarBtn = document.getElementById('avatarBtn');
  if (avatarBtn) avatarBtn.textContent = appState.avatar;

  const userNameDisplay = document.getElementById('userNameDisplay');
  if (userNameDisplay) userNameDisplay.textContent = `${appState.userName} 🌟`;

  const userTitle = document.getElementById('userTitle');
  if (userTitle) userTitle.textContent = appState.userTitle;

  const xpDisplay = document.getElementById('xpDisplay');
  if (xpDisplay) xpDisplay.textContent = appState.xp;

  const streakDisplay = document.getElementById('streakDisplay');
  if (streakDisplay) streakDisplay.textContent = `🔥 ${appState.streak}`;

  const starRating = document.getElementById('starRating');
  if (starRating) {
    let starsStr = '';
    for (let i = 1; i <= 5; i++) {
      starsStr += i <= appState.stars ? '⭐' : '☆';
    }
    starRating.textContent = starsStr;
  }

  // Certificate fields
  const certXP = document.getElementById('certXP');
  if (certXP) certXP.textContent = appState.xp;

  const certStudentName = document.getElementById('certStudentName');
  if (certStudentName) certStudentName.textContent = appState.userName;

  const certRank = document.getElementById('certRank');
  if (certRank) {
    if (appState.xp >= 180) certRank.textContent = 'Xuất Sắc (Thủ Khoa)';
    else if (appState.xp >= 140) certRank.textContent = 'Giỏi (Chiến Tướng)';
    else if (appState.xp >= 100) certRank.textContent = 'Khá';
    else certRank.textContent = 'Đạt Yêu Cầu';
  }

  updateBadges();
}

function updateBadges() {
  const correctCount = Object.values(appState.answered).filter(a => a.correct).length;

  if (!appState.badges[0]) {
    appState.badges[0] = true;
    unlockBadge(1);
  }

  if (!appState.badges[1] && appState.totalUrnDraws >= 10) {
    appState.badges[1] = true;
    unlockBadge(2);
  }

  if (!appState.badges[2] && correctCount >= 5) {
    appState.badges[2] = true;
    unlockBadge(3);
  }

  if (!appState.badges[3] && appState.xp >= 160) {
    appState.badges[3] = true;
    unlockBadge(4);
  }

  if (!appState.badges[4] && correctCount === 10) {
    appState.badges[4] = true;
    unlockBadge(5);
    playSound('fanfare');
  }
}

function unlockBadge(idx) {
  const badgeEl = document.getElementById(`badge-${idx}`);
  if (badgeEl && badgeEl.classList.contains('locked')) {
    badgeEl.classList.remove('locked');
    badgeEl.classList.add('unlocked');
    playSound('levelup');
  }
}

// --- ARENA (QUIZ) RENDERING & INSTANT INTERACTION ---
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;

  container.innerHTML = '';

  quizData.forEach((q) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard-${q.id}`;

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `
      <span class="quiz-badge">${q.title}</span>
      <span class="quiz-pts">+${q.pts} XP</span>
    `;
    card.appendChild(header);

    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = formatMathText(q.question);
    card.appendChild(questionP);

    const optsGrid = document.createElement('div');
    optsGrid.className = 'quiz-options-grid';

    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, optIdx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<strong>${letters[optIdx]}.</strong> ${formatMathText(opt.text)}`;

      btn.addEventListener('click', () => {
        handleQuizAnswer(q, optIdx, btn, optsGrid, card);
      });

      optsGrid.appendChild(btn);
    });
    card.appendChild(optsGrid);

    const explBox = document.createElement('div');
    explBox.className = 'explanation-box';
    explBox.id = `explBox-${q.id}`;
    explBox.innerHTML = `
      <div class="expl-title">💡 Giải Thích Chi Tiết:</div>
      <div class="expl-content">${formatMathText(q.explanation)}</div>
    `;
    card.appendChild(explBox);

    container.appendChild(card);
  });

  renderMathInTree(container);
  updateArenaProgress();
}

function handleQuizAnswer(q, optIdx, selectedBtn, optsGrid, card) {
  if (appState.answered[q.id]) return;

  const opt = q.options[optIdx];
  const allBtns = optsGrid.querySelectorAll('.quiz-opt-btn');

  allBtns.forEach(b => b.disabled = true);

  if (opt.correct) {
    selectedBtn.classList.add('correct');
    appState.xp += q.pts;
    appState.streak += 1;
    appState.answered[q.id] = { correct: true, optIdx };
    playSound('correct');
  } else {
    selectedBtn.classList.add('wrong');
    q.options.forEach((o, i) => {
      if (o.correct) allBtns[i].classList.add('correct');
    });
    appState.streak = 0;
    appState.answered[q.id] = { correct: false, optIdx };
    playSound('wrong');
  }

  const explBox = card.querySelector('.explanation-box');
  if (explBox) {
    explBox.classList.add('show');
    renderMathInTree(explBox);
  }

  if (appState.xp >= 180) appState.stars = 5;
  else if (appState.xp >= 140) appState.stars = 4;
  else if (appState.xp >= 80) appState.stars = 3;
  else appState.stars = 2;

  updateHUD();
  updateArenaProgress();
}

function updateArenaProgress() {
  const answeredCount = Object.keys(appState.answered).length;
  const progressEl = document.getElementById('arenaProgress');
  if (progressEl) progressEl.textContent = `Tiến Độ: ${answeredCount}/${quizData.length}`;

  const scoreEl = document.getElementById('arenaScore');
  if (scoreEl) scoreEl.textContent = `Điểm Arena: ${appState.xp} XP`;
}

// --- LAB 1: MÔ PHỎNG HỘP BI & TỔ HỢP ---
function nCr(n, r) {
  if (r < 0 || r > n) return 0;
  if (r === 0 || r === n) return 1;
  let res = 1;
  for (let i = 1; i <= r; i++) {
    res = (res * (n - i + 1)) / i;
  }
  return Math.round(res);
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function reduceFraction(num, den) {
  if (num === 0) return '0';
  const g = gcd(num, den);
  const n = num / g;
  const d = den / g;
  return d === 1 ? `${n}` : `\\frac{${n}}{${d}}`;
}

let lastDrawn = [];

function drawUrnOnce(red, blue, k) {
  // Pool of balls: 1..red are red ('R'), red+1..red+blue are blue ('B')
  const pool = [];
  for (let i = 0; i < red; i++) pool.push('R');
  for (let i = 0; i < blue; i++) pool.push('B');

  // Random sample without replacement
  const drawn = [];
  for (let i = 0; i < k; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    drawn.push(pool.splice(idx, 1)[0]);
  }
  return drawn;
}

function simulateUrnDraws(times) {
  const red = parseInt(document.getElementById('rangeRed').value, 10);
  const blue = parseInt(document.getElementById('rangeBlue').value, 10);
  const k = parseInt(document.getElementById('rangeK').value, 10);

  if (k > red + blue) {
    alert('Số bi rút ra không được lớn hơn tổng số bi trong hộp!');
    return;
  }

  let successCount = 0;
  for (let t = 0; t < times; t++) {
    const drawn = drawUrnOnce(red, blue, k);
    lastDrawn = drawn;
    // Condition: có ít nhất 1 bi đỏ
    const redCount = drawn.filter(b => b === 'R').length;
    if (redCount >= 1) {
      successCount++;
    }
  }

  appState.totalUrnDraws += times;
  appState.urnSuccesses += successCount;

  drawUrnCanvas(red, blue, lastDrawn);
  updateUrnOutput(red, blue, k);
  updateBadges();
  playSound('click');
}

function resetUrnLab() {
  appState.totalUrnDraws = 0;
  appState.urnSuccesses = 0;
  lastDrawn = [];
  const red = parseInt(document.getElementById('rangeRed').value, 10);
  const blue = parseInt(document.getElementById('rangeBlue').value, 10);
  const k = parseInt(document.getElementById('rangeK').value, 10);
  drawUrnCanvas(red, blue, []);
  updateUrnOutput(red, blue, k);
  playSound('click');
}

function drawUrnCanvas(red, blue, drawn) {
  const canvas = document.getElementById('urnCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Draw Box
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 20, 240, 140);
  ctx.fillStyle = 'rgba(99, 102, 241, 0.1)';
  ctx.fillRect(30, 20, 240, 140);

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`Hộp: ${red} Đỏ, ${blue} Xanh (Tổng ${red + blue})`, 40, 40);

  // Draw balls in box
  let rCount = 0;
  let bCount = 0;
  const total = red + blue;
  for (let i = 0; i < total; i++) {
    const col = i % 8;
    const row = Math.floor(i / 8);
    const x = 50 + col * 26;
    const y = 65 + row * 26;

    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    if (rCount < red) {
      ctx.fillStyle = '#ef4444';
      rCount++;
    } else {
      ctx.fillStyle = '#06b6d4';
      bCount++;
    }
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Draw Drawn balls area
  ctx.fillStyle = '#f8fafc';
  ctx.font = '14px sans-serif';
  ctx.fillText('Kết Quả Lần Rút Gần Nhất:', 300, 45);

  if (drawn.length > 0) {
    drawn.forEach((ball, idx) => {
      const bx = 320 + idx * 36;
      const by = 85;
      ctx.beginPath();
      ctx.arc(bx, by, 14, 0, Math.PI * 2);
      ctx.fillStyle = ball === 'R' ? '#ef4444' : '#06b6d4';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ball === 'R' ? 'Đ' : 'X', bx, by + 4);
    });
  } else {
    ctx.fillStyle = '#64748b';
    ctx.font = 'italic 13px sans-serif';
    ctx.fillText('(Chưa có kết quả rút)', 320, 85);
  }
}

function updateUrnOutput(red, blue, k) {
  const output = document.getElementById('urnOutput');
  if (!output) return;

  const total = red + blue;
  const nOmega = nCr(total, k);
  // Biến cố: "Có ít nhất 1 bi đỏ"
  // Đối lập: "Không có bi đỏ nào" = chọn k viên từ blue
  const nNoRed = nCr(blue, k);
  const nAtLeast1Red = nOmega - nNoRed;
  const probTheo = nOmega > 0 ? nAtLeast1Red / nOmega : 0;
  const fracTheo = reduceFraction(nAtLeast1Red, nOmega);

  const expFreq = appState.totalUrnDraws > 0 ? (appState.urnSuccesses / appState.totalUrnDraws) : 0;

  output.innerHTML = `
    <strong>Khảo sát biến cố $E$: "Có ít nhất một viên bi đỏ khi rút ${k} viên":</strong><br>
    • Không gian mẫu: $n(\\Omega) = C_{${total}}^{${k}} = ${nOmega}$.<br>
    • Số kết quả đối lập (toàn bi xanh): $n(\\overline{E}) = C_{${blue}}^{${k}} = ${nNoRed}$.<br>
    • Số kết quả thuận lợi: $n(E) = n(\\Omega) - n(\\overline{E}) = ${nOmega} - ${nNoRed} = ${nAtLeast1Red}$.<br>
    • Xác suất lý thuyết: $P(E) = 1 - \\frac{${nNoRed}}{${nOmega}} = ${fracTheo} \\approx ${(probTheo * 100).toFixed(1)}\\%$.<br>
    • Thực nghiệm: Đã rút <strong>${appState.totalUrnDraws}</strong> lần, thỏa mãn <strong>${appState.urnSuccesses}</strong> lần. Tần suất thực tế: <strong>${(expFreq * 100).toFixed(1)}\\%</strong>.
  `;
  renderMathInTree(output);
}

// --- LAB 2: SƠ ĐỒ CÂY TƯƠNG TÁC ---
const treeOutcomes = [
  { code: 'TTT', b: 3, g: 0, first: 'T' },
  { code: 'TTG', b: 2, g: 1, first: 'T' },
  { code: 'TGT', b: 2, g: 1, first: 'T' },
  { code: 'TGG', b: 1, g: 2, first: 'T' },
  { code: 'GTT', b: 2, g: 1, first: 'G' },
  { code: 'GTG', b: 1, g: 2, first: 'G' },
  { code: 'GGT', b: 1, g: 2, first: 'G' },
  { code: 'GGG', b: 0, g: 3, first: 'G' }
];

function checkTreeOutcome(out, cond) {
  if (cond === 'at_least_1_boy') return out.b >= 1;
  if (cond === 'first_girl') return out.first === 'G';
  if (cond === 'exact_1_boy') return out.b === 1;
  if (cond === 'all_same') return out.b === 3 || out.g === 3;
  if (cond === 'no_boy') return out.b === 0;
  return false;
}

function drawTreeCanvas() {
  const canvas = document.getElementById('treeCanvas');
  const cond = document.getElementById('treeCondition') ? document.getElementById('treeCondition').value : 'at_least_1_boy';
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Root
  const rx = 40;
  const ry = h / 2;

  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.arc(rx, ry, 7, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#a5b4fc';
  ctx.font = '11px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Gốc', rx - 10, ry + 4);

  // Level 1: 2 nodes (Trai, Gái)
  const l1 = [
    { name: 'T1', y: h * 0.28, path: 'T' },
    { name: 'G1', y: h * 0.72, path: 'G' }
  ];
  const l1x = 150;

  // Level 2: 4 nodes
  const l2 = [
    { name: 'T2', y: h * 0.16, path: 'TT' },
    { name: 'G2', y: h * 0.40, path: 'TG' },
    { name: 'T2', y: h * 0.60, path: 'GT' },
    { name: 'G2', y: h * 0.84, path: 'GG' }
  ];
  const l2x = 280;

  // Level 3: 8 outcomes
  const l3x = 420;
  const stepY = h / 9;

  let favorableCount = 0;
  let favorableList = [];

  treeOutcomes.forEach((out, idx) => {
    const oy = stepY * (idx + 1);
    const match = checkTreeOutcome(out, cond);
    if (match) {
      favorableCount++;
      favorableList.push(out.code);
    }

    // Branch from Level 2 node to Level 3 node
    const parentIdx = Math.floor(idx / 2);
    const pNode = l2[parentIdx];

    ctx.strokeStyle = match ? '#10b981' : 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = match ? 2.5 : 1;
    ctx.beginPath();
    ctx.moveTo(l2x, pNode.y);
    ctx.lineTo(l3x, oy);
    ctx.stroke();

    // Node L3
    ctx.fillStyle = match ? '#10b981' : '#475569';
    ctx.beginPath();
    ctx.arc(l3x, oy, 6, 0, Math.PI * 2);
    ctx.fill();

    // Text outcome
    ctx.fillStyle = match ? '#34d399' : '#94a3b8';
    ctx.font = match ? 'bold 12px sans-serif' : '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(out.code + (match ? ' ✓' : ''), l3x + 12, oy + 4);
  });

  // Draw Level 1 to Level 2 lines
  l2.forEach((node, idx) => {
    const parentIdx = Math.floor(idx / 2);
    const pNode = l1[parentIdx];
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.25)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(l1x, pNode.y);
    ctx.lineTo(l2x, node.y);
    ctx.stroke();

    ctx.fillStyle = '#818cf8';
    ctx.beginPath();
    ctx.arc(l2x, node.y, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, l2x, node.y - 8);
  });

  // Draw Root to Level 1 lines
  l1.forEach((node) => {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(rx, ry);
    ctx.lineTo(l1x, node.y);
    ctx.stroke();

    ctx.fillStyle = '#a855f7';
    ctx.beginPath();
    ctx.arc(l1x, node.y, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(node.name, l1x, node.y - 10);
  });

  // Output explanation
  const treeOutput = document.getElementById('treeOutput');
  if (treeOutput) {
    const frac = reduceFraction(favorableCount, 8);
    const prob = (favorableCount / 8);
    treeOutput.innerHTML = `
      <strong>Kết Quả Khảo Sát Sơ Đồ Cây:</strong> Tổng số đường đi $n(\\Omega) = 2^3 = 8$.<br>
      • Số nhánh thuận lợi thỏa mãn: $n(E) = ${favorableCount}$ kết quả.<br>
      • Các kết quả thuận lợi: $\\{${favorableList.join('; ')}\\}$.<br>
      • Xác suất biến cố: $P(E) = \\frac{n(E)}{n(\\Omega)} = \\frac{${favorableCount}}{8} = ${frac} = ${(prob * 100).toFixed(1)}\\%$.
    `;
    renderMathInTree(treeOutput);
  }
}

// --- INIT ALL COMPONENTS ---
document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `tab-${tab.getAttribute('data-tab')}`;
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
        renderMathInTree(targetContent);
      }
      playSound('click');
    });
  });

  // Sound Toggle
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      playSound('click');
    });
  }

  // Reset Progress
  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học và điểm XP?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.stars = 2;
        appState.answered = {};
        appState.badges = [true, false, false, false, false];
        updateHUD();
        renderQuiz();
        playSound('click');
      }
    });
  }

  // Avatar Modal
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

  // Lab 1 sliders & buttons
  const rRed = document.getElementById('rangeRed');
  const rBlue = document.getElementById('rangeBlue');
  const rK = document.getElementById('rangeK');

  if (rRed) rRed.addEventListener('input', () => {
    document.getElementById('valRed').textContent = rRed.value;
    resetUrnLab();
  });
  if (rBlue) rBlue.addEventListener('input', () => {
    document.getElementById('valBlue').textContent = rBlue.value;
    resetUrnLab();
  });
  if (rK) rK.addEventListener('input', () => {
    document.getElementById('valK').textContent = rK.value;
    resetUrnLab();
  });

  const btnDraw1 = document.getElementById('btnDraw1');
  const btnDraw50 = document.getElementById('btnDraw50');
  const btnDraw500 = document.getElementById('btnDraw500');
  const btnResetBox = document.getElementById('btnResetBox');

  if (btnDraw1) btnDraw1.addEventListener('click', () => simulateUrnDraws(1));
  if (btnDraw50) btnDraw50.addEventListener('click', () => simulateUrnDraws(50));
  if (btnDraw500) btnDraw500.addEventListener('click', () => simulateUrnDraws(500));
  if (btnResetBox) btnResetBox.addEventListener('click', resetUrnLab);

  // Lab 2 controls
  const treeCondSelect = document.getElementById('treeCondition');
  if (treeCondSelect) {
    treeCondSelect.addEventListener('change', () => {
      drawTreeCanvas();
      playSound('click');
    });
  }

  // Print Certificate
  const printBtn = document.getElementById('btnPrintCert');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Init Components
  updateHUD();
  renderQuiz();
  resetUrnLab();
  drawTreeCanvas();

  renderMathInTree(document.body);
});
