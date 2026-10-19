// ========================================================
// TOÁN 10 - BÀI 23: QUY TẮC ĐẾM
// Pure Vanilla Web Stack • Web Audio API • KaTeX / MathML Core
// ========================================================

// --- APP STATE ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Quy Tắc Đếm',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false],
  passMode: '3digits' // '3digits', 'char2digits', 'diff3digits'
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

// --- QUIZ DATA: BÀI 23 (SGK 8.1 - 8.5 TRANG 65) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1 (SGK 8.1 - Tr.65)',
    pts: 20,
    question: 'Trên giá sách có $8$ cuốn truyện ngắn, $7$ cuốn tiểu thuyết và $5$ tập thơ (tất cả đều khác nhau). Bạn Phong có bao nhiêu cách chọn một cuốn để đọc vào ngày cuối tuần?',
    options: [
      { text: '$20$ cách', correct: true },
      { text: '$280$ cách', correct: false },
      { text: '$40$ cách', correct: false },
      { text: '$15$ cách', correct: false }
    ],
    explanation: 'Việc chọn một cuốn sách để đọc có 3 phương án độc lập: chọn 1 truyện ngắn ($8$ cách), hoặc 1 tiểu thuyết ($7$ cách), hoặc 1 tập thơ ($5$ cách). Áp dụng quy tắc cộng, tổng số cách chọn là: $8 + 7 + 5 = 20$ cách.'
  },
  {
    id: 2,
    title: 'Câu 2 (SGK 8.2 - Tr.65)',
    pts: 20,
    question: 'Một người gieo đồng xu hai mặt (sấp hoặc ngửa) $3$ lần liên tiếp. Sau mỗi lần gieo ghi lại kết quả. Hỏi có tất cả bao nhiêu khả năng có thể xảy ra?',
    options: [
      { text: '$6$ khả năng', correct: false },
      { text: '$8$ khả năng', correct: true },
      { text: '$9$ khả năng', correct: false },
      { text: '$16$ khả năng', correct: false }
    ],
    explanation: 'Quá trình gieo gồm $3$ công đoạn liên tiếp. Mỗi lần gieo đồng xu đều có $2$ khả năng (Sấp hoặc Ngửa). Áp dụng quy tắc nhân, số khả năng có thể xảy ra sau $3$ lần gieo là: $2 \\times 2 \\times 2 = 8$ khả năng.'
  },
  {
    id: 3,
    title: 'Câu 3 (SGK 8.3a - Tr.65)',
    pts: 20,
    question: 'Ở một loài thực vật, $A$ là gene trội quy định hoa kép, $a$ là gene lặn quy định hoa đơn. Sự tổ hợp giữa hai gene trên tạo ra bao nhiêu kiểu gene?',
    options: [
      { text: '$2$ kiểu gene', correct: false },
      { text: '$3$ kiểu gene', correct: true },
      { text: '$4$ kiểu gene', correct: false },
      { text: '$1$ kiểu gene', correct: false }
    ],
    explanation: 'Một cơ thể lưỡng bội nhận một alen từ bố và một alen từ mẹ. Các tổ hợp kiểu gene có thể có là: $AA$ (đồng hợp trội), $Aa$ (dị hợp) và $aa$ (đồng hợp lặn). Do đó có đúng $3$ kiểu gene.'
  },
  {
    id: 4,
    title: 'Câu 4 (SGK 8.3b - Tr.65)',
    pts: 20,
    question: 'Khi giao phối ngẫu nhiên giữa hai cá thể, trong đó mỗi cá thể có thể mang một trong $3$ kiểu gene ($AA, Aa, aa$), có bao nhiêu kiểu giao phối khác nhau?',
    options: [
      { text: '$6$ kiểu', correct: false },
      { text: '$9$ kiểu', correct: true },
      { text: '$12$ kiểu', correct: false },
      { text: '$27$ kiểu', correct: false }
    ],
    explanation: 'Việc xác định một kiểu giao phối gồm hai công đoạn: chọn kiểu gene của cá thể thứ nhất ($3$ cách) và chọn kiểu gene của cá thể thứ hai ($3$ cách). Theo quy tắc nhân, có $3 \\times 3 = 9$ kiểu giao phối.'
  },
  {
    id: 5,
    title: 'Câu 5 (SGK 8.4a - Tr.65)',
    pts: 20,
    question: 'Có bao nhiêu số tự nhiên gồm $3$ chữ số đôi một khác nhau được lập từ tập các chữ số $\\{0; 1; 2; \\dots; 9\\}$?',
    options: [
      { text: '$648$ số', correct: true },
      { text: '$720$ số', correct: false },
      { text: '$504$ số', correct: false },
      { text: '$900$ số', correct: false }
    ],
    explanation: 'Gọi số cần tìm là $\\overline{abc}$. Chữ số hàng trăm $a \\in \\{1; 2; \\dots; 9\\}$ có $9$ cách chọn ($a \\ne 0$). Chữ số hàng chục $b \\in \\{0; 1; \\dots; 9\\} \\setminus \\{a\\}$ có $9$ cách chọn. Chữ số hàng đơn vị $c \\in \\{0; 1; \\dots; 9\\} \\setminus \\{a; b\\}$ có $8$ cách chọn. Áp dụng quy tắc nhân: $9 \\times 9 \\times 8 = 648$ số.'
  },
  {
    id: 6,
    title: 'Câu 6 (SGK 8.4b - Tr.65)',
    pts: 20,
    question: 'Có bao nhiêu số tự nhiên lẻ gồm $3$ chữ số đôi một khác nhau?',
    options: [
      { text: '$320$ số', correct: true },
      { text: '$360$ số', correct: false },
      { text: '$450$ số', correct: false },
      { text: '$288$ số', correct: false }
    ],
    explanation: 'Gọi số lẻ là $\\overline{abc}$. Bước 1: Chọn chữ số tận cùng $c \\in \\{1; 3; 5; 7; 9\\}$ có $5$ cách chọn. Bước 2: Chọn $a \\ne 0$ và $a \\ne c$, nên $a$ có $9 - 1 = 8$ cách chọn. Bước 3: Chọn $b \\ne a$ và $b \\ne c$, nên $b$ có $10 - 2 = 8$ cách chọn. Theo quy tắc nhân: $5 \\times 8 \\times 8 = 320$ số.'
  },
  {
    id: 7,
    title: 'Câu 7 (SGK 8.4c - Tr.65)',
    pts: 20,
    question: 'Có bao nhiêu số tự nhiên có $3$ chữ số và chia hết cho $5$ (các chữ số không nhất thiết khác nhau)?',
    options: [
      { text: '$180$ số', correct: true },
      { text: '$200$ số', correct: false },
      { text: '$136$ số', correct: false },
      { text: '$90$ số', correct: false }
    ],
    explanation: 'Gọi số đó là $\\overline{abc}$. Chữ số $a \\in \\{1; 2; \\dots; 9\\}$ có $9$ cách. Chữ số $b \\in \\{0; 1; \\dots; 9\\}$ có $10$ cách. Để chia hết cho $5$, chữ số tận cùng $c \\in \\{0; 5\\}$ có $2$ cách. Số các số thoả mãn là: $9 \\times 10 \\times 2 = 180$ số.'
  },
  {
    id: 8,
    title: 'Câu 8 (SGK 8.4d - Tr.65)',
    pts: 20,
    question: 'Có bao nhiêu số tự nhiên gồm $3$ chữ số đôi một khác nhau và chia hết cho $5$?',
    options: [
      { text: '$136$ số', correct: true },
      { text: '$144$ số', correct: false },
      { text: '$180$ số', correct: false },
      { text: '$128$ số', correct: false }
    ],
    explanation: 'Chia làm 2 trường hợp rời nhau: TH1: Tận cùng $c = 0$ ($1$ cách): chọn $a \\ne 0$ có $9$ cách, chọn $b$ có $8$ cách $\\Rightarrow 9 \\times 8 = 72$ số. TH2: Tận cùng $c = 5$ ($1$ cách): chọn $a \\ne 0, a \\ne 5$ có $8$ cách, chọn $b \\ne a, b \\ne 5$ có $8$ cách $\\Rightarrow 8 \\times 8 = 64$ số. Theo quy tắc cộng: $72 + 64 = 136$ số.'
  },
  {
    id: 9,
    title: 'Câu 9 (SGK 8.5a - Tr.65)',
    pts: 20,
    question: 'Mật khẩu của một chương trình máy tính gồm $3$ kí tự, mỗi kí tự là một chữ số từ $0$ đến $9$. Hỏi có thể tạo được bao nhiêu mật khẩu khác nhau?',
    options: [
      { text: '$1000$ mật khẩu', correct: true },
      { text: '$720$ mật khẩu', correct: false },
      { text: '$900$ mật khẩu', correct: false },
      { text: '$504$ mật khẩu', correct: false }
    ],
    explanation: 'Mỗi kí tự trong mật khẩu đều có $10$ lựa chọn (từ $0$ đến $9$, kí tự đầu được phép là $0$). Áp dụng quy tắc nhân cho $3$ vị trí liên tiếp: $10 \\times 10 \\times 10 = 1000$ mật khẩu.'
  },
  {
    id: 10,
    title: 'Câu 10 (SGK 8.5b - Tr.65)',
    pts: 20,
    question: 'Nếu quy định mới yêu cầu mật khẩu gồm $3$ kí tự: kí tự đầu tiên là chữ cái in hoa tiếng Anh ($26$ chữ từ $A$ đến $Z$) và $2$ kí tự sau là chữ số (từ $0$ đến $9$). Hỏi quy định mới tạo được nhiều hơn quy định cũ bao nhiêu mật khẩu?',
    options: [
      { text: '$1600$ mật khẩu', correct: true },
      { text: '$2600$ mật khẩu', correct: false },
      { text: '$1800$ mật khẩu', correct: false },
      { text: '$1200$ mật khẩu', correct: false }
    ],
    explanation: 'Theo quy định mới, số mật khẩu tạo được là: $26 \\times 10 \\times 10 = 2600$ mật khẩu. Theo quy định cũ ở Câu 9, có $1000$ mật khẩu. Vậy số mật khẩu tạo được nhiều hơn là: $2600 - 1000 = 1600$ mật khẩu.'
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

// --- LAB 1: TREE DIAGRAM (PHỐI ĐỒ ĐA TẦNG) ---
function initTreeLab() {
  const canvas = document.getElementById('treeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const slAo = document.getElementById('slAo');
  const slQuan = document.getElementById('slQuan');
  const slMu = document.getElementById('slMu');
  const outEl = document.getElementById('treeOutput');

  function draw() {
    const nAo = parseInt(slAo.value, 10);
    const nQuan = parseInt(slQuan.value, 10);
    const nMu = parseInt(slMu.value, 10);

    document.getElementById('valAo').textContent = nAo;
    document.getElementById('valQuan').textContent = nQuan;
    document.getElementById('valMu').textContent = nMu;

    const total = nAo * nQuan * nMu;
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Columns x positions
    const xRoot = 40;
    const xAo = 180;
    const xQuan = 360;
    const xMu = 540;

    // Draw Root
    const yRoot = h / 2;
    ctx.beginPath();
    ctx.arc(xRoot, yRoot, 10, 0, Math.PI * 2);
    ctx.fillStyle = '#ec4899';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('Bắt Đầu', xRoot - 20, yRoot - 16);

    const aoColors = ['#f59e0b', '#3b82f6', '#10b981', '#a855f7'];

    for (let a = 0; a < nAo; a++) {
      const yAo = (h / (nAo + 1)) * (a + 1);

      // Line Root -> Ao
      ctx.beginPath();
      ctx.strokeStyle = aoColors[a % aoColors.length];
      ctx.lineWidth = 2;
      ctx.moveTo(xRoot, yRoot);
      ctx.lineTo(xAo, yAo);
      ctx.stroke();

      // Node Ao
      ctx.beginPath();
      ctx.arc(xAo, yAo, 7, 0, Math.PI * 2);
      ctx.fillStyle = aoColors[a % aoColors.length];
      ctx.fill();
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`Áo ${a + 1}`, xAo + 12, yAo + 4);

      // For each Quan
      for (let q = 0; q < nQuan; q++) {
        // Vertical spread inside this Ao group
        const groupHeight = h / (nAo + 0.5);
        const yQuan = (yAo - groupHeight / 2.5) + (groupHeight / (nQuan + 1)) * (q + 1);

        // Line Ao -> Quan
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
        ctx.lineWidth = 1.2;
        ctx.moveTo(xAo, yAo);
        ctx.lineTo(xQuan, yQuan);
        ctx.stroke();

        // Node Quan
        ctx.beginPath();
        ctx.arc(xQuan, yQuan, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#06b6d4';
        ctx.fill();

        // For each Mu
        for (let m = 0; m < nMu; m++) {
          const subHeight = groupHeight / (nQuan + 0.5);
          const yMu = (yQuan - subHeight / 3) + (subHeight / (nMu + 1)) * (m + 1);

          // Line Quan -> Mu
          ctx.beginPath();
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
          ctx.lineWidth = 1;
          ctx.moveTo(xQuan, yQuan);
          ctx.lineTo(xMu, yMu);
          ctx.stroke();

          // Leaf node Mu
          ctx.beginPath();
          ctx.arc(xMu, yMu, 3.5, 0, Math.PI * 2);
          ctx.fillStyle = '#f43f5e';
          ctx.fill();
        }
      }
    }

    if (outEl) {
      outEl.innerHTML = formatMathText(
        `🌳 **Phân tích sơ đồ cây phối trang phục:**<br>` +
        `• Công đoạn 1 (Chọn Áo): có $${nAo}$ cách.<br>` +
        `• Công đoạn 2 (Chọn Quần): có $${nQuan}$ cách.<br>` +
        `• Công đoạn 3 (Chọn Mũ): có $${nMu}$ cách.<br>` +
        `• Áp dụng Quy Tắc Nhân: Số bộ trang phục hoàn chỉnh là $${nAo} \\times ${nQuan} \\times ${nMu} = ${total}$ cách phối đồ.`
      );
      renderMathInTree(outEl);
    }
  }

  [slAo, slQuan, slMu].forEach(sl => {
    sl.addEventListener('input', () => {
      draw();
      unlockBadge(1);
    });
  });

  draw();
}

// --- LAB 2: MÁY TẠO MẬT KHẨU TỔ HỢP ---
function initCodeLab() {
  const btn1 = document.getElementById('btnModePass1');
  const btn2 = document.getElementById('btnModePass2');
  const btn3 = document.getElementById('btnModePass3');
  const btnGen = document.getElementById('btnGenSample');
  const display = document.getElementById('sampleDisplay');
  const outEl = document.getElementById('codeOutput');

  function updateModeUI() {
    [btn1, btn2, btn3].forEach(b => b.classList.remove('active'));
    if (appState.passMode === '3digits') btn1.classList.add('active');
    else if (appState.passMode === 'char2digits') btn2.classList.add('active');
    else btn3.classList.add('active');

    generateSamples();
  }

  function generateSamples() {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const samples = [];

    if (appState.passMode === '3digits') {
      for (let i = 0; i < 5; i++) {
        const d1 = Math.floor(Math.random() * 10);
        const d2 = Math.floor(Math.random() * 10);
        const d3 = Math.floor(Math.random() * 10);
        samples.push(`[ ${d1}${d2}${d3} ]`);
      }
      display.innerHTML = `Mẫu mật khẩu ngẫu nhiên:<br><span style="color:#f59e0b; font-size:1.5rem; letter-spacing:4px;">${samples.join(' &nbsp; ')}</span>`;
      if (outEl) {
        outEl.innerHTML = formatMathText(
          `🔐 **Chế độ 1: Mật khẩu gồm 3 chữ số bất kì (0 đến 9)**<br>` +
          `• Vị trí 1 có $10$ cách | Vị trí 2 có $10$ cách | Vị trí 3 có $10$ cách.<br>` +
          `• Theo Quy Tắc Nhân: Tổng số mật khẩu có thể tạo là $10 \\times 10 \\times 10 = 1000$ mật khẩu.`
        );
        renderMathInTree(outEl);
      }
    } else if (appState.passMode === 'char2digits') {
      for (let i = 0; i < 5; i++) {
        const c1 = letters[Math.floor(Math.random() * letters.length)];
        const d2 = Math.floor(Math.random() * 10);
        const d3 = Math.floor(Math.random() * 10);
        samples.push(`[ ${c1}${d2}${d3} ]`);
      }
      display.innerHTML = `Mẫu mật khẩu ngẫu nhiên:<br><span style="color:#38bdf8; font-size:1.5rem; letter-spacing:4px;">${samples.join(' &nbsp; ')}</span>`;
      if (outEl) {
        outEl.innerHTML = formatMathText(
          `🔤 **Chế độ 2: Kí tự đầu in hoa (A-Z) và 2 chữ số (0-9)**<br>` +
          `• Vị trí 1 có $26$ cách | Vị trí 2 có $10$ cách | Vị trí 3 có $10$ cách.<br>` +
          `• Theo Quy Tắc Nhân: $26 \\times 10 \\times 10 = 2600$ mật khẩu (nhiều hơn chế độ 1 là $1600$ mật khẩu).`
        );
        renderMathInTree(outEl);
      }
    } else {
      for (let i = 0; i < 5; i++) {
        const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        // a in 1..9
        const firstArr = [1, 2, 3, 4, 5, 6, 7, 8, 9];
        const a = firstArr[Math.floor(Math.random() * firstArr.length)];
        const remain1 = digits.filter(d => d !== a);
        const b = remain1[Math.floor(Math.random() * remain1.length)];
        const remain2 = remain1.filter(d => d !== b);
        const c = remain2[Math.floor(Math.random() * remain2.length)];
        samples.push(`[ ${a}${b}${c} ]`);
      }
      display.innerHTML = `Mẫu số tự nhiên 3 chữ số khác nhau:<br><span style="color:#10b981; font-size:1.5rem; letter-spacing:4px;">${samples.join(' &nbsp; ')}</span>`;
      if (outEl) {
        outEl.innerHTML = formatMathText(
          `🔢 **Chế độ 3: Số tự nhiên có 3 chữ số đôi một khác nhau (a ≠ 0)**<br>` +
          `• Chữ số hàng trăm $a \\ne 0$: có $9$ cách chọn ($1$ đến $9$).<br>` +
          `• Chữ số hàng chục $b \\ne a$: có $9$ cách chọn ($0$ đến $9$ trừ $a$).<br>` +
          `• Chữ số hàng đơn vị $c \\ne a, c \\ne b$: có $8$ cách chọn.<br>` +
          `• Theo Quy Tắc Nhân: $9 \\times 9 \\times 8 = 648$ số thoả mãn.`
        );
        renderMathInTree(outEl);
      }
    }
  }

  btn1.addEventListener('click', () => { appState.passMode = '3digits'; updateModeUI(); playSound('click'); unlockBadge(1); });
  btn2.addEventListener('click', () => { appState.passMode = 'char2digits'; updateModeUI(); playSound('click'); unlockBadge(1); });
  btn3.addEventListener('click', () => { appState.passMode = 'diff3digits'; updateModeUI(); playSound('click'); unlockBadge(1); });
  btnGen.addEventListener('click', () => { generateSamples(); playSound('click'); unlockBadge(1); });

  updateModeUI();
}

// --- INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
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

  // Sound Toggle
  const sndBtn = document.getElementById('soundToggle');
  if (sndBtn) {
    sndBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      sndBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      playSound('click');
    });
  }

  // Reset Progress
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

  // Avatar Modal (Hidden initially, opens only on avatarBtn click)
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
  initTreeLab();
  initCodeLab();

  renderMathInTree(document.body);
});
