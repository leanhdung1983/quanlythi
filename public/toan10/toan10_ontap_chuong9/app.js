// ========================================================
// TOÁN 10 - ÔN TẬP CUỐI CHƯƠNG IX: XÁC SUẤT CỔ ĐIỂN
// Pure Vanilla Web Stack • Web Audio API • KaTeX / MathML Core
// ========================================================

// --- APP STATE ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Chương IX',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false],
  totalSpins: 0,
  lastWheel1: '50cc',
  lastWheel2: 'Đen'
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

// --- QUIZ DATA: BÀI TẬP CUỐI CHƯƠNG IX (SGK 9.13 - 9.22 TRANG 88 - 89) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1 (SGK 9.13 - Tr.88)',
    pts: 20,
    question: 'Một hộp có bốn loại bi: bi xanh, bi đỏ, bi trắng và bi vàng. Lấy ngẫu nhiên ra một viên bi. Gọi $E$ là biến cố: "Lấy được viên bi đỏ". Biến cố đối của $E$ là biến cố:',
    options: [
      { text: 'Lấy được viên bi xanh.', correct: false },
      { text: 'Lấy được viên bi vàng hoặc bi trắng.', correct: false },
      { text: 'Lấy được viên bi trắng.', correct: false },
      { text: 'Lấy được viên bi vàng hoặc bi trắng hoặc bi xanh.', correct: true }
    ],
    explanation: 'Biến cố đối của $E$: "Lấy được viên bi đỏ" là biến cố "Không lấy được viên bi đỏ", tức là lấy được viên bi vàng hoặc bi trắng hoặc bi xanh.'
  },
  {
    id: 2,
    title: 'Câu 2 (SGK 9.14 - Tr.88)',
    pts: 20,
    question: 'Rút ngẫu nhiên ra một thẻ từ một hộp có 30 tấm thẻ được đánh số từ 1 đến 30. Xác suất để số trên tấm thẻ được rút ra chia hết cho 5 là:',
    options: [
      { text: '$\\frac{1}{30}$', correct: false },
      { text: '$\\frac{1}{5}$', correct: true },
      { text: '$\\frac{1}{3}$', correct: false },
      { text: '$\\frac{2}{5}$', correct: false }
    ],
    explanation: 'Không gian mẫu có $n(\\Omega) = 30$. Các số chia hết cho 5 trong đoạn $[1; 30]$ là: $\\{5; 10; 15; 20; 25; 30\\}$ (gồm 6 số). Xác suất là $P = \\frac{6}{30} = \\frac{1}{5}$.'
  },
  {
    id: 3,
    title: 'Câu 3 (SGK 9.15 - Tr.88)',
    pts: 20,
    question: 'Gieo hai con xúc xắc cân đối. Xác suất để tổng số chấm xuất hiện trên hai con xúc xắc không lớn hơn 4 là:',
    options: [
      { text: '$\\frac{1}{7}$', correct: false },
      { text: '$\\frac{1}{6}$', correct: true },
      { text: '$\\frac{1}{8}$', correct: false },
      { text: '$\\frac{2}{9}$', correct: false }
    ],
    explanation: 'Không gian mẫu $n(\\Omega) = 36$. Các kết quả có tổng số chấm không lớn hơn 4 gồm: tổng bằng 2: $\\{(1,1)\\}$ (1 cặp); tổng bằng 3: $\\{(1,2); (2,1)\\}$ (2 cặp); tổng bằng 4: $\\{(1,3); (2,2); (3,1)\\}$ (3 cặp). Tổng số kết quả thuận lợi là $1 + 2 + 3 = 6$. Xác suất là $P = \\frac{6}{36} = \\frac{1}{6}$.'
  },
  {
    id: 4,
    title: 'Câu 4 (SGK 9.16 - Tr.88)',
    pts: 20,
    question: 'Một tổ trong lớp 10T có 4 bạn nữ và 3 bạn nam. Giáo viên chọn ngẫu nhiên hai bạn trong tổ đó tham gia đội làm báo của lớp. Xác suất để hai bạn được chọn có một bạn nam và một bạn nữ là:',
    options: [
      { text: '$\\frac{4}{7}$', correct: true },
      { text: '$\\frac{2}{7}$', correct: false },
      { text: '$\\frac{1}{6}$', correct: false },
      { text: '$\\frac{2}{21}$', correct: false }
    ],
    explanation: 'Không gian mẫu có $n(\\Omega) = C_7^2 = 21$. Số cách chọn 1 bạn nam từ 3 bạn nam là $C_3^1 = 3$. Số cách chọn 1 bạn nữ từ 4 bạn nữ là $C_4^1 = 4$. Số kết quả thuận lợi là $3 \\times 4 = 12$. Xác suất là $P = \\frac{12}{21} = \\frac{4}{7}$.'
  },
  {
    id: 5,
    title: 'Câu 5 (SGK 9.17b - Tr.88)',
    pts: 20,
    question: 'Một hộp đựng 7 thẻ màu xanh (đánh số từ 1 đến 7), 5 thẻ màu đỏ (đánh số từ 1 đến 5) và 2 thẻ màu vàng (đánh số từ 1 đến 2). Rút ngẫu nhiên một tấm thẻ. Xác suất để rút được thẻ màu đỏ hoặc màu vàng là:',
    options: [
      { text: '$\\frac{1}{2}$', correct: true },
      { text: '$\\frac{5}{14}$', correct: false },
      { text: '$\\frac{1}{7}$', correct: false },
      { text: '$\\frac{9}{14}$', correct: false }
    ],
    explanation: 'Tổng số thẻ trong hộp là $7 + 5 + 2 = 14$ tấm thẻ. Số phần tử của không gian mẫu là $n(\\Omega) = 14$. Số thẻ màu đỏ hoặc màu vàng là $5 + 2 = 7$ thẻ. Do đó xác suất là $P = \\frac{7}{14} = \\frac{1}{2}$.'
  },
  {
    id: 6,
    title: 'Câu 6 (SGK 9.18 - Tr.88)',
    pts: 20,
    question: 'Có hộp I và hộp II, mỗi hộp chứa 5 tấm thẻ đánh số từ 1 đến 5. Từ mỗi hộp, rút ngẫu nhiên ra một tấm thẻ. Xác suất để thẻ rút ra từ hộp II mang số lớn hơn số trên thẻ rút ra từ hộp I là:',
    options: [
      { text: '$\\frac{1}{5}$', correct: false },
      { text: '$\\frac{2}{5}$', correct: true },
      { text: '$\\frac{1}{2}$', correct: false },
      { text: '$\\frac{3}{5}$', correct: false }
    ],
    explanation: 'Không gian mẫu có $n(\\Omega) = 5 \\times 5 = 25$ kết quả. Các kết quả thuận lợi $(i, j)$ với $j > i$: khi $i=1 \\implies j \\in \\{2;3;4;5\\}$ (4 cách); khi $i=2 \\implies j \\in \\{3;4;5\\}$ (3 cách); khi $i=3 \\implies j \\in \\{4;5\\}$ (2 cách); khi $i=4 \\implies j = 5$ (1 cách). Tổng số kết quả thuận lợi là $4 + 3 + 2 + 1 = 10$. Xác suất là $P = \\frac{10}{25} = \\frac{2}{5}$.'
  },
  {
    id: 7,
    title: 'Câu 7 (SGK 9.19b - Tr.88)',
    pts: 20,
    question: 'Gieo đồng thời hai con xúc xắc cân đối. Xác suất để tổng số chấm trên hai con xúc xắc nhỏ hơn 8 là:',
    options: [
      { text: '$\\frac{5}{12}$', correct: false },
      { text: '$\\frac{7}{12}$', correct: true },
      { text: '$\\frac{1}{2}$', correct: false },
      { text: '$\\frac{2}{3}$', correct: false }
    ],
    explanation: 'Không gian mẫu $n(\\Omega) = 36$. Tổng số chấm trên hai xúc xắc nhỏ hơn 8 là các tổng từ 2 đến 7. Số cặp tương ứng cho mỗi tổng: tổng 2 có 1; tổng 3 có 2; tổng 4 có 3; tổng 5 có 4; tổng 6 có 5; tổng 7 có 6 cặp. Tổng số kết quả thuận lợi là $1 + 2 + 3 + 4 + 5 + 6 = 21$. Xác suất là $P = \\frac{21}{36} = \\frac{7}{12}$.'
  },
  {
    id: 8,
    title: 'Câu 8 (SGK 9.20 - Tr.89)',
    pts: 20,
    question: 'Dự báo thời tiết ba ngày thứ Hai, thứ Ba, thứ Tư cho biết khả năng có mưa và không mưa mỗi ngày là như nhau. Xác suất để trong ba ngày đó có đúng một ngày có mưa là:',
    options: [
      { text: '$\\frac{1}{8}$', correct: false },
      { text: '$\\frac{1}{4}$', correct: false },
      { text: '$\\frac{3}{8}$', correct: true },
      { text: '$\\frac{1}{2}$', correct: false }
    ],
    explanation: 'Không gian mẫu gồm $2^3 = 8$ kết quả. Gọi $M$ là ngày mưa, $K$ là ngày không mưa. Biến cố có đúng một ngày có mưa gồm 3 kết quả: $\\{MKK; KMK; KKM\\}$. Do đó xác suất là $P = \\frac{3}{8}$.'
  },
  {
    id: 9,
    title: 'Câu 9 (SGK 9.21 - Tr.89)',
    pts: 20,
    question: 'Gieo một đồng xu cân đối liên tiếp bốn lần. Xác suất để trong bốn lần gieo đó có hai lần xuất hiện mặt sấp và hai lần xuất hiện mặt ngửa là:',
    options: [
      { text: '$\\frac{1}{4}$', correct: false },
      { text: '$\\frac{3}{8}$', correct: true },
      { text: '$\\frac{1}{2}$', correct: false },
      { text: '$\\frac{5}{16}$', correct: false }
    ],
    explanation: 'Không gian mẫu khi gieo đồng xu 4 lần là $n(\\Omega) = 2^4 = 16$. Số cách chọn vị trí của 2 lần xuất hiện mặt sấp trong 4 lần gieo là $C_4^2 = 6$. Do đó xác suất là $P = \\frac{6}{16} = \\frac{3}{8}$.'
  },
  {
    id: 10,
    title: 'Câu 10 (SGK 9.22 - Tr.89)',
    pts: 20,
    question: 'Chọn ngẫu nhiên 4 viên bi từ một túi đựng 4 viên bi đỏ và 6 viên bi xanh đôi một khác nhau. Xác suất của biến cố $A$: "Trong bốn viên bi đó có cả bi đỏ và cả bi xanh" là:',
    options: [
      { text: '$\\frac{97}{105}$', correct: true },
      { text: '$\\frac{8}{105}$', correct: false },
      { text: '$\\frac{89}{105}$', correct: false },
      { text: '$\\frac{91}{105}$', correct: false }
    ],
    explanation: 'Tổng số bi là $4 + 6 = 10$ viên. Số cách chọn 4 viên bi bất kì là $n(\\Omega) = C_{10}^4 = 210$. Xét biến cố đối $\\overline{A}$: "Bốn viên bi được chọn toàn màu đỏ hoặc toàn màu xanh". Số cách chọn 4 viên toàn đỏ là $C_4^4 = 1$. Số cách chọn 4 viên toàn xanh là $C_6^4 = 15$. Vậy $n(\\overline{A}) = 1 + 15 = 16$. Xác suất biến cố đối là $P(\\overline{A}) = \\frac{16}{210} = \\frac{8}{105}$. Do đó $P(A) = 1 - P(\\overline{A}) = 1 - \\frac{8}{105} = \\frac{97}{105}$.'
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

  if (!appState.badges[1] && appState.totalSpins >= 5) {
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

// --- LAB 1: VÒNG QUAY MAY MẮN ĐA TẦNG ---
const wheel1Sectors = ['50cc', '110cc'];
const wheel2Sectors = [
  { label: 'Đen', color: '#1e293b', textCol: '#ffffff' },
  { label: 'Trắng', color: '#f8fafc', textCol: '#0f172a' },
  { label: 'Đỏ', color: '#ef4444', textCol: '#ffffff' },
  { label: 'Xanh', color: '#06b6d4', textCol: '#ffffff' }
];

let angle1 = 0;
let angle2 = 0;
let isSpinning = false;

function drawWheel1() {
  const canvas = document.getElementById('wheel1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 80;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle1);

  // Sector 1: 50cc (Yellow-gold)
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, 0, Math.PI);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#1e1b4b';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Loại 50cc', 0, 45);

  // Sector 2: 110cc (Indigo)
  ctx.fillStyle = '#6366f1';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.arc(0, 0, r, Math.PI, Math.PI * 2);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('Loại 110cc', 0, -40);

  ctx.restore();

  // Pointer at top
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - r - 6);
  ctx.lineTo(cx + 8, cy - r - 6);
  ctx.lineTo(cx, cy - r + 10);
  ctx.closePath();
  ctx.fill();
}

function drawWheel2() {
  const canvas = document.getElementById('wheel2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r = 80;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle2);

  const arc = (Math.PI * 2) / 4;
  wheel2Sectors.forEach((sec, idx) => {
    ctx.fillStyle = sec.color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, idx * arc, (idx + 1) * arc);
    ctx.closePath();
    ctx.fill();

    // Text
    ctx.save();
    ctx.rotate((idx + 0.5) * arc);
    ctx.fillStyle = sec.textCol;
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(sec.label, r * 0.6, 4);
    ctx.restore();
  });

  ctx.restore();

  // Pointer at top
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.moveTo(cx - 8, cy - r - 6);
  ctx.lineTo(cx + 8, cy - r - 6);
  ctx.lineTo(cx, cy - r + 10);
  ctx.closePath();
  ctx.fill();
}

function spinWheels(times = 1) {
  if (isSpinning) return;

  if (times > 1) {
    // Fast batch simulation
    appState.totalSpins += times;
    const rnd1 = Math.random() < 0.5 ? '50cc' : '110cc';
    const rnd2 = wheel2Sectors[Math.floor(Math.random() * 4)].label;
    appState.lastWheel1 = rnd1;
    appState.lastWheel2 = rnd2;
    angle1 = Math.random() * Math.PI * 2;
    angle2 = Math.random() * Math.PI * 2;
    drawWheel1();
    drawWheel2();
    updateSpinOutput();
    updateBadges();
    playSound('click');
    return;
  }

  isSpinning = true;
  appState.totalSpins++;

  const start1 = angle1;
  const start2 = angle2;
  const target1 = angle1 + Math.PI * 4 + Math.random() * Math.PI * 4;
  const target2 = angle2 + Math.PI * 6 + Math.random() * Math.PI * 4;
  const duration = 1500;
  const startTime = performance.now();

  function animate(t) {
    const elapsed = t - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const easeOut = 1 - Math.pow(1 - progress, 3);

    angle1 = start1 + (target1 - start1) * easeOut;
    angle2 = start2 + (target2 - start2) * easeOut;

    drawWheel1();
    drawWheel2();

    if (progress < 1) {
      requestAnimationFrame(animate);
    } else {
      isSpinning = false;
      // Calculate sector under pointer (at top: angle = -PI/2)
      const norm1 = (angle1 % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      // Top corresponds to 3*PI/2 in standard angles
      const pointerAngle1 = (Math.PI * 1.5 - norm1 + Math.PI * 2) % (Math.PI * 2);
      appState.lastWheel1 = pointerAngle1 < Math.PI ? '50cc' : '110cc';

      const norm2 = (angle2 % (Math.PI * 2) + Math.PI * 2) % (Math.PI * 2);
      const pointerAngle2 = (Math.PI * 1.5 - norm2 + Math.PI * 2) % (Math.PI * 2);
      const secIdx2 = Math.floor((pointerAngle2 / (Math.PI * 2)) * 4) % 4;
      appState.lastWheel2 = wheel2Sectors[secIdx2].label;

      updateSpinOutput();
      updateBadges();
      playSound('correct');
    }
  }

  requestAnimationFrame(animate);
}

function updateSpinOutput() {
  const output = document.getElementById('spinOutput');
  if (!output) return;

  output.innerHTML = `
    <strong>Kết Quả Lần Quay:</strong> Xe <strong>${appState.lastWheel1}</strong>, Màu <strong>${appState.lastWheel2}</strong>.<br>
    • Không gian mẫu: $n(\\Omega) = 2 \\times 4 = 8$ kết quả.<br>
    • Xác suất nhận được xe 110cc màu trắng hoặc màu xanh: $P = \\frac{2}{8} = \\frac{1}{4} = 25\\%$.<br>
    • Tổng số lần đã quay thực nghiệm: <strong>${appState.totalSpins}</strong> lần.
  `;
  renderMathInTree(output);
}

function resetSpinLab() {
  appState.totalSpins = 0;
  angle1 = 0;
  angle2 = 0;
  drawWheel1();
  drawWheel2();
  const output = document.getElementById('spinOutput');
  if (output) output.textContent = 'Đã đặt lại dữ liệu vòng quay!';
  playSound('click');
}

// --- LAB 2: BIỂU ĐỒ VENN TƯƠNG TÁC ---
function drawVennDiagram() {
  const canvas = document.getElementById('vennCanvas');
  const rInput = document.getElementById('rangePE');
  const pVal = rInput ? parseFloat(rInput.value) : 0.4;
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Draw Omega box
  ctx.strokeStyle = '#6366f1';
  ctx.lineWidth = 3;
  ctx.strokeRect(30, 20, w - 60, h - 40);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
  ctx.fillRect(30, 20, w - 60, h - 40);

  // Label Omega
  ctx.fillStyle = '#a5b4fc';
  ctx.font = 'bold 16px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Không gian mẫu Ω (P = 1.0)', 45, 45);

  // Circle E
  // Radius scales with sqrt(pVal)
  const maxR = 65;
  const radius = maxR * Math.sqrt(pVal);
  const cx = w * 0.4;
  const cy = h / 2 + 5;

  if (pVal > 0) {
    ctx.fillStyle = 'rgba(6, 182, 212, 0.45)';
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Biến cố E', cx, cy - 4);
    ctx.font = '12px sans-serif';
    ctx.fillText(`P(E) = ${pVal.toFixed(2)}`, cx, cy + 14);
  }

  // Label Not E (Complement)
  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 14px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('Biến cố đối Ē', w * 0.65, h / 2);
  ctx.font = '12px sans-serif';
  ctx.fillText(`P(Ē) = ${(1 - pVal).toFixed(2)}`, w * 0.65, h / 2 + 18);

  const valPE = document.getElementById('valPE');
  if (valPE) valPE.textContent = pVal.toFixed(2);

  const vennOutput = document.getElementById('vennOutput');
  if (vennOutput) {
    vennOutput.innerHTML = `
      <strong>Mối Quan Hệ Cân Bằng Cốt Lõi:</strong><br>
      • Xác suất biến cố $E$: $P(E) = ${pVal.toFixed(2)}$.<br>
      • Xác suất biến cố đối $\\overline{E}$: $P(\\overline{E}) = 1 - P(E) = 1 - ${pVal.toFixed(2)} = ${(1 - pVal).toFixed(2)}$.<br>
      • Tổng luôn bảo toàn: $P(E) + P(\\overline{E}) = ${pVal.toFixed(2)} + ${(1 - pVal).toFixed(2)} = 1$.
    `;
    renderMathInTree(vennOutput);
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

  // Lab 1 controls
  const btnSpin1 = document.getElementById('btnSpin1');
  const btnSpin50 = document.getElementById('btnSpin50');
  const btnSpin500 = document.getElementById('btnSpin500');
  const btnResetSpin = document.getElementById('btnResetSpin');

  if (btnSpin1) btnSpin1.addEventListener('click', () => spinWheels(1));
  if (btnSpin50) btnSpin50.addEventListener('click', () => spinWheels(50));
  if (btnSpin500) btnSpin500.addEventListener('click', () => spinWheels(500));
  if (btnResetSpin) btnResetSpin.addEventListener('click', resetSpinLab);

  // Lab 2 controls
  const rangePE = document.getElementById('rangePE');
  if (rangePE) {
    rangePE.addEventListener('input', () => {
      drawVennDiagram();
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
  drawWheel1();
  drawWheel2();
  drawVennDiagram();

  renderMathInTree(document.body);
});
