// ========================================================
// TOÁN 10 - BÀI 26: BIẾN CỐ & ĐỊNH NGHĨA CỔ ĐIỂN CỦA XÁC SUẤT
// Pure Vanilla Web Stack • Web Audio API • KaTeX / MathML Core
// ========================================================

// --- APP STATE ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Xác Suất Cổ Điển',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false],
  diceCounts: [0, 0, 0, 0, 0, 0],
  totalRolls: 0
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

// --- QUIZ DATA: BÀI 26 (SGK 9.1 - 9.5 TRANG 82) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1 (SGK Ví dụ 1 & HĐ1 - Tr.78)',
    pts: 20,
    question: 'Một tổ trong lớp 10A có 3 học sinh nữ và 4 học sinh nam. Giáo viên chọn ngẫu nhiên một học sinh trong tổ để kiểm tra vở bài tập. Số phần tử của không gian mẫu $n(\\Omega)$ là:',
    options: [
      { text: '$3$', correct: false },
      { text: '$4$', correct: false },
      { text: '$7$', correct: true },
      { text: '$12$', correct: false }
    ],
    explanation: 'Không gian mẫu $\\Omega$ là tập hợp tất cả các học sinh trong tổ gồm 3 nữ và 4 nam. Do đó số phần tử của không gian mẫu là $n(\\Omega) = 3 + 4 = 7$.'
  },
  {
    id: 2,
    title: 'Câu 2 (SGK Nhận xét - Tr.79)',
    pts: 20,
    question: 'Cho phép thử có không gian mẫu $\\Omega$ và biến cố $E \\subset \\Omega$. Khẳng định nào sau đây là **sai**?',
    options: [
      { text: 'Biến cố chắc chắn là tập $\\Omega$', correct: false },
      { text: 'Biến cố không thể là tập rỗng $\\varnothing$', correct: false },
      { text: 'Biến cố đối của $E$ là $\\overline{E} = \\Omega \\setminus E$', correct: false },
      { text: '$n(E) + n(\\overline{E}) = 2n(\\Omega)$', correct: true }
    ],
    explanation: 'Khẳng định D sai vì theo định nghĩa tập hợp, $E \\cup \\overline{E} = \\Omega$ và $E \\cap \\overline{E} = \\varnothing$, do đó $n(E) + n(\\overline{E}) = n(\\Omega)$, không phải $2n(\\Omega)$.'
  },
  {
    id: 3,
    title: 'Câu 3 (SGK Ví dụ 3 - Tr.79)',
    pts: 20,
    question: 'Gieo một con xúc xắc 6 mặt cân đối và đồng chất. Gọi $M$ là biến cố: "Số chấm xuất hiện trên con xúc xắc là một số chẵn". Biến cố đối $\\overline{M}$ của $M$ là biến cố:',
    options: [
      { text: '"Số chấm xuất hiện trên con xúc xắc là một số lẻ"', correct: true },
      { text: '"Số chấm xuất hiện trên con xúc xắc là một số chia hết cho 3"', correct: false },
      { text: '"Số chấm xuất hiện trên con xúc xắc lớn hơn 2"', correct: false },
      { text: '"Số chấm xuất hiện trên con xúc xắc bằng 6"', correct: false }
    ],
    explanation: 'Biến cố đối của "số chấm là số chẵn" (tập $\\{2; 4; 6\\}$) chính là "số chấm không là số chẵn", tức là "số chấm xuất hiện trên con xúc xắc là một số lẻ" (tập $\\{1; 3; 5\\}$).'
  },
  {
    id: 4,
    title: 'Câu 4 (SGK Luyện tập 2 - Tr.79)',
    pts: 20,
    question: 'Gieo một con xúc xắc cân đối. Gọi $K$ là biến cố: "Số chấm xuất hiện trên con xúc xắc là một số nguyên tố". Tập con mô tả biến cố đối $\\overline{K}$ là:',
    options: [
      { text: '$\\overline{K} = \\{1; 4; 6\\}$', correct: true },
      { text: '$\\overline{K} = \\{4; 6\\}$', correct: false },
      { text: '$\\overline{K} = \\{1; 3; 5\\}$', correct: false },
      { text: '$\\overline{K} = \\{2; 3; 5\\}$', correct: false }
    ],
    explanation: 'Không gian mẫu $\\Omega = \\{1; 2; 3; 4; 5; 6\\}$. Các số nguyên tố là $\\{2; 3; 5\\}$, nên $K = \\{2; 3; 5\\}$. Biến cố đối là phần bù trong $\\Omega$: $\\overline{K} = \\Omega \\setminus K = \\{1; 4; 6\\}$. Lưu ý số 1 không phải là số nguyên tố.'
  },
  {
    id: 5,
    title: 'Câu 5 (SGK HĐ3 - Tr.80)',
    pts: 20,
    question: 'Một hộp chứa 12 tấm thẻ được đánh số từ 1 đến 12. Rút ngẫu nhiên một tấm thẻ từ hộp đó. Xác suất để rút được tấm thẻ ghi số nguyên tố là:',
    options: [
      { text: '$\\frac{1}{3}$', correct: false },
      { text: '$\\frac{5}{12}$', correct: true },
      { text: '$\\frac{1}{2}$', correct: false },
      { text: '$\\frac{7}{12}$', correct: false }
    ],
    explanation: 'Không gian mẫu có $n(\\Omega) = 12$. Các số nguyên tố từ 1 đến 12 gồm các số: $\\{2; 3; 5; 7; 11\\}$, có 5 kết quả thuận lợi ($n(E) = 5$). Do đó xác suất là $P(E) = \\frac{5}{12}$.'
  },
  {
    id: 6,
    title: 'Câu 6 (SGK Ví dụ 4 - Tr.80)',
    pts: 20,
    question: 'Gieo một đồng xu cân đối liên tiếp ba lần. Xác suất để có đúng hai lần xuất hiện mặt sấp và một lần xuất hiện mặt ngửa là:',
    options: [
      { text: '$\\frac{1}{4}$', correct: false },
      { text: '$\\frac{3}{8}$', correct: true },
      { text: '$\\frac{1}{2}$', correct: false },
      { text: '$\\frac{5}{8}$', correct: false }
    ],
    explanation: 'Không gian mẫu $\\Omega$ gồm $2^3 = 8$ phần tử. Biến cố có 2 sấp 1 ngửa là $E = \\{SSN; SNS; NSS\\}$ gồm $n(E) = 3$ phần tử. Do đó xác suất $P(E) = \\frac{3}{8}$.'
  },
  {
    id: 7,
    title: 'Câu 7 (SGK 9.1 - Tr.82)',
    pts: 20,
    question: 'Chọn ngẫu nhiên một số nguyên dương không lớn hơn 30. Xác suất để số được chọn là số nguyên tố là:',
    options: [
      { text: '$\\frac{1}{3}$', correct: true },
      { text: '$\\frac{3}{10}$', correct: false },
      { text: '$\\frac{11}{30}$', correct: false },
      { text: '$\\frac{2}{5}$', correct: false }
    ],
    explanation: 'Không gian mẫu $\\Omega = \\{1; 2; \\dots; 30\\}$ có $n(\\Omega) = 30$. Các số nguyên tố không vượt quá 30 gồm 10 số: $\\{2; 3; 5; 7; 11; 13; 17; 19; 23; 29\\}$, nên $n(A) = 10$. Xác suất $P(A) = \\frac{10}{30} = \\frac{1}{3}$.'
  },
  {
    id: 8,
    title: 'Câu 8 (SGK 9.2 - Tr.82)',
    pts: 20,
    question: 'Chọn ngẫu nhiên một số nguyên dương không lớn hơn 22. Xác suất để số được chọn chia hết cho 3 là:',
    options: [
      { text: '$\\frac{3}{11}$', correct: false },
      { text: '$\\frac{7}{22}$', correct: true },
      { text: '$\\frac{4}{11}$', correct: false },
      { text: '$\\frac{9}{22}$', correct: false }
    ],
    explanation: 'Không gian mẫu có $n(\\Omega) = 22$. Các số chia hết cho 3 trong khoảng $[1; 22]$ là: $\\{3; 6; 9; 12; 15; 18; 21\\}$, gồm 7 số thuận lợi. Xác suất cần tìm là $P(B) = \\frac{7}{22}$.'
  },
  {
    id: 9,
    title: 'Câu 9 (SGK Luyện tập 3 - Tr.81)',
    pts: 20,
    question: 'Gieo đồng thời hai con xúc xắc cân đối. Xác suất để tổng số chấm xuất hiện trên hai con xúc xắc bằng 4 hoặc bằng 6 là:',
    options: [
      { text: '$\\frac{1}{6}$', correct: false },
      { text: '$\\frac{2}{9}$', correct: true },
      { text: '$\\frac{5}{36}$', correct: false },
      { text: '$\\frac{7}{36}$', correct: false }
    ],
    explanation: 'Không gian mẫu $n(\\Omega) = 6 \\times 6 = 36$. Tổng bằng 4 gồm 3 cặp: $\\{(1,3); (2,2); (3,1)\\}$. Tổng bằng 6 gồm 5 cặp: $\\{(1,5); (2,4); (3,3); (4,2); (5,1)\\}$. Tổng số kết quả thuận lợi là $3 + 5 = 8$. Xác suất là $P = \\frac{8}{36} = \\frac{2}{9}$.'
  },
  {
    id: 10,
    title: 'Câu 10 (SGK 9.5c - Tr.82)',
    pts: 20,
    question: 'Hai bạn An và Bình mỗi người gieo một con xúc xắc cân đối. Xác suất để tích hai số chấm xuất hiện trên hai con xúc xắc bé hơn 6 là:',
    options: [
      { text: '$\\frac{5}{18}$', correct: true },
      { text: '$\\frac{7}{36}$', correct: false },
      { text: '$\\frac{1}{3}$', correct: false },
      { text: '$\\frac{11}{36}$', correct: false }
    ],
    explanation: 'Không gian mẫu $n(\\Omega) = 36$. Các cặp $(a, b)$ có tích $a \\cdot b < 6$ gồm: khi $a=1: b \\in \\{1; 2; 3; 4; 5\\}$ (5 kết quả); khi $a=2: b \\in \\{1; 2\\}$ (2 kết quả); khi $a=3: b=1$ (1 kết quả); khi $a=4: b=1$ (1 kết quả); khi $a=5: b=1$ (1 kết quả). Tổng số kết quả thuận lợi là $5 + 2 + 1 + 1 + 1 = 10$. Xác suất là $P = \\frac{10}{36} = \\frac{5}{18}$.'
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
  const answeredCount = Object.keys(appState.answered).length;
  const correctCount = Object.values(appState.answered).filter(a => a.correct).length;

  // Badge 1: Read theory
  if (!appState.badges[0]) {
    appState.badges[0] = true;
    unlockBadge(1);
  }

  // Badge 2: Played lab
  if (!appState.badges[1] && appState.totalRolls >= 10) {
    appState.badges[1] = true;
    unlockBadge(2);
  }

  // Badge 3: Answered >= 5 questions
  if (!appState.badges[2] && correctCount >= 5) {
    appState.badges[2] = true;
    unlockBadge(3);
  }

  // Badge 4: >= 160 XP
  if (!appState.badges[3] && appState.xp >= 160) {
    appState.badges[3] = true;
    unlockBadge(4);
  }

  // Badge 5: 10/10 correct
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

  quizData.forEach((q, qIdx) => {
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
  if (appState.answered[q.id]) return; // locked

  const opt = q.options[optIdx];
  const allBtns = optsGrid.querySelectorAll('.quiz-opt-btn');

  // Disable all buttons in this question
  allBtns.forEach(b => b.disabled = true);

  if (opt.correct) {
    selectedBtn.classList.add('correct');
    appState.xp += q.pts;
    appState.streak += 1;
    appState.answered[q.id] = { correct: true, optIdx };
    playSound('correct');
  } else {
    selectedBtn.classList.add('wrong');
    // highlight correct button
    q.options.forEach((o, i) => {
      if (o.correct) allBtns[i].classList.add('correct');
    });
    appState.streak = 0;
    appState.answered[q.id] = { correct: false, optIdx };
    playSound('wrong');
  }

  // Show explanation
  const explBox = card.querySelector('.explanation-box');
  if (explBox) {
    explBox.classList.add('show');
    renderMathInTree(explBox);
  }

  // Update stars based on XP
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

// --- LAB 1: MÔ PHỎNG GIEO XÚC XẮC 6 MẶT ---
const diceSymbols = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];

function rollDiceOnce() {
  const face = Math.floor(Math.random() * 6) + 1;
  appState.diceCounts[face - 1]++;
  appState.totalRolls++;
  return face;
}

function rollDiceMultiple(n) {
  let last = 1;
  for (let i = 0; i < n; i++) {
    last = rollDiceOnce();
  }
  const faceDisplay = document.getElementById('diceFaceDisplay');
  if (faceDisplay) faceDisplay.textContent = diceSymbols[last - 1];

  const lastFace = document.getElementById('lastFace');
  if (lastFace) lastFace.textContent = `Mặt ${last} chấm`;

  const totalEl = document.getElementById('totalRolls');
  if (totalEl) totalEl.textContent = appState.totalRolls;

  drawDiceChart();
  updateDiceFeedback(last);
  updateBadges();
  playSound('click');
}

function resetDiceLab() {
  appState.diceCounts = [0, 0, 0, 0, 0, 0];
  appState.totalRolls = 0;
  const faceDisplay = document.getElementById('diceFaceDisplay');
  if (faceDisplay) faceDisplay.textContent = '⚄';
  const lastFace = document.getElementById('lastFace');
  if (lastFace) lastFace.textContent = '-';
  const totalEl = document.getElementById('totalRolls');
  if (totalEl) totalEl.textContent = '0';
  drawDiceChart();
  const feedback = document.getElementById('diceFeedback');
  if (feedback) feedback.textContent = 'Đã đặt lại dữ liệu thí nghiệm!';
  playSound('click');
}

function drawDiceChart() {
  const canvas = document.getElementById('diceCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const paddingBottom = 40;
  const paddingTop = 30;
  const paddingLeft = 50;
  const paddingRight = 20;
  const chartW = w - paddingLeft - paddingRight;
  const chartH = h - paddingTop - paddingBottom;

  // Max value for scale
  let maxCount = Math.max(...appState.diceCounts, 1);
  if (appState.totalRolls > 0) {
    // scale by frequency percentage
    maxCount = Math.max(...appState.diceCounts.map(c => c / appState.totalRolls), 0.25);
  }

  // Draw theoretical line at 1/6 (~0.1667)
  const theoreticalY = paddingTop + chartH * (1 - (1 / 6) / maxCount);
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
  ctx.setLineDash([6, 4]);
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(paddingLeft, theoreticalY);
  ctx.lineTo(w - paddingRight, theoreticalY);
  ctx.stroke();
  ctx.setLineDash([]);

  // Label theoretical line
  ctx.fillStyle = '#f59e0b';
  ctx.font = '11px sans-serif';
  ctx.fillText('Lý thuyết P = 1/6 (16.7%)', paddingLeft + 10, theoreticalY - 6);

  const barWidth = chartW / 6 - 15;
  appState.diceCounts.forEach((cnt, idx) => {
    const freq = appState.totalRolls > 0 ? cnt / appState.totalRolls : 0;
    const barH = (freq / maxCount) * chartH;
    const x = paddingLeft + idx * (chartW / 6) + 7;
    const y = paddingTop + chartH - barH;

    // Gradient bar
    const grad = ctx.createLinearGradient(x, y, x, paddingTop + chartH);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(1, '#06b6d4');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(x, y, barWidth, barH, [4, 4, 0, 0]) : ctx.rect(x, y, barWidth, barH);
    ctx.fill();

    // X-axis label (dice symbol & number)
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(diceSymbols[idx], x + barWidth / 2, h - 20);
    ctx.font = '11px sans-serif';
    ctx.fillText(`${idx + 1}`, x + barWidth / 2, h - 6);

    // Value on top of bar
    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px sans-serif';
    const pct = (freq * 100).toFixed(1) + '%';
    ctx.fillText(appState.totalRolls > 0 ? `${cnt} (${pct})` : '0', x + barWidth / 2, y - 6);
  });
}

function updateDiceFeedback(last) {
  const feedback = document.getElementById('diceFeedback');
  if (!feedback) return;
  if (appState.totalRolls < 10) {
    feedback.innerHTML = `Vừa gieo ra <strong>Mặt ${last}</strong>. Hãy thử gieo 100 hoặc 1000 lần để quan sát tần suất tiệm cận đường lý thuyết màu vàng!`;
  } else {
    const freqs = appState.diceCounts.map(c => ((c / appState.totalRolls) * 100).toFixed(1) + '%');
    feedback.innerHTML = `Tổng ${appState.totalRolls} lần gieo. Tần suất các mặt: [1: ${freqs[0]}, 2: ${freqs[1]}, 3: ${freqs[2]}, 4: ${freqs[3]}, 5: ${freqs[4]}, 6: ${freqs[5]}]. Xác suất lý thuyết $P = \\frac{1}{6} \\approx 16{,}7\\%$.`;
    renderMathInTree(feedback);
  }
}

// --- LAB 2: MA TRẬN KHÔNG GIAN MẪU HAI XÚC XẮC ---
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function checkMatrixCondition(i, j, filter) {
  const sum = i + j;
  const prod = i * j;
  if (filter === 'sum_7') return sum === 7;
  if (filter === 'sum_4_6') return sum === 4 || sum === 6;
  if (filter === 'prod_lt_6') return prod < 6;
  if (filter === 'sum_prime') return isPrime(sum);
  if (filter === 'both_same') return i === j;
  if (filter === 'first_ge_5') return i >= 5;
  return false;
}

function renderDiceMatrix() {
  const table = document.getElementById('diceMatrixTable');
  const filter = document.getElementById('eventFilter') ? document.getElementById('eventFilter').value : 'sum_7';
  if (!table) return;

  let favorableCount = 0;
  let favorableList = [];

  let html = '<thead><tr><th style="padding: 6px; background: rgba(99,102,241,0.2); color: #a5b4fc;">X1 \\ X2</th>';
  for (let j = 1; j <= 6; j++) {
    html += `<th style="padding: 6px; background: rgba(99,102,241,0.2); color: #a5b4fc;">Mặt ${j}</th>`;
  }
  html += '</tr></thead><tbody>';

  for (let i = 1; i <= 6; i++) {
    html += `<tr><td style="padding: 6px; font-weight: bold; background: rgba(99,102,241,0.15); color: #a5b4fc;">Mặt ${i}</td>`;
    for (let j = 1; j <= 6; j++) {
      const match = checkMatrixCondition(i, j, filter);
      if (match) {
        favorableCount++;
        favorableList.push(`(${i},${j})`);
      }
      const bg = match ? 'background: rgba(16, 185, 129, 0.4); border: 1px solid #10b981; color: #fff; font-weight: bold;' : 'background: rgba(15, 23, 42, 0.5); border: 1px solid rgba(255,255,255,0.08); color: #94a3b8;';
      html += `<td style="padding: 8px 4px; ${bg}">(${i}, ${j})</td>`;
    }
    html += '</tr>';
  }
  html += '</tbody>';
  table.innerHTML = html;

  const output = document.getElementById('matrixOutput');
  if (output) {
    const prob = (favorableCount / 36);
    const probFrac = reduceFraction(favorableCount, 36);
    output.innerHTML = `
      <strong>Kết Quả Khảo Sát:</strong> Số phần tử không gian mẫu $n(\\Omega) = 36$.<br>
      • Số kết quả thuận lợi: $n(E) = ${favorableCount}$ kết quả.<br>
      • Tập hợp kết quả thuận lợi: $\\{${favorableList.join('; ')}\\}$.<br>
      • Xác suất cổ điển: $P(E) = \\frac{n(E)}{n(\\Omega)} = \\frac{${favorableCount}}{36} = ${probFrac} \\approx ${(prob * 100).toFixed(1)}\\%$.
    `;
    renderMathInTree(output);
  }
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
  const btn1 = document.getElementById('btnRoll1');
  const btn10 = document.getElementById('btnRoll10');
  const btn100 = document.getElementById('btnRoll100');
  const btn1000 = document.getElementById('btnRoll1000');
  const btnReset = document.getElementById('btnResetDice');

  if (btn1) btn1.addEventListener('click', () => rollDiceMultiple(1));
  if (btn10) btn10.addEventListener('click', () => rollDiceMultiple(10));
  if (btn100) btn100.addEventListener('click', () => rollDiceMultiple(100));
  if (btn1000) btn1000.addEventListener('click', () => rollDiceMultiple(1000));
  if (btnReset) btnReset.addEventListener('click', resetDiceLab);

  // Lab 2 controls
  const filterSelect = document.getElementById('eventFilter');
  if (filterSelect) {
    filterSelect.addEventListener('change', () => {
      renderDiceMatrix();
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
  drawDiceChart();
  renderDiceMatrix();

  renderMathInTree(document.body);
});
