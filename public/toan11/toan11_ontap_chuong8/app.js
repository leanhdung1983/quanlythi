// ==========================================================================
// BÀI TẬP CUỐI CHƯƠNG VIII: CÁC QUY TẮC TÍNH XÁC SUẤT - TOÁN 11 KNTT
// KIẾN TRÚC JAVASCRIPT CHUẨN CYBER LOGIC & QUANTUM INDIGO
// ==========================================================================

// 1. ÂM THANH WEB AUDIO API (100% OFFLINE)
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type, duration, gainVal = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
  playClick() { this.playTone(600, 'sine', 0.08, 0.05); }
  playCorrect() {
    this.playTone(523.25, 'triangle', 0.12, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.12), 100);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.25, 0.15), 200);
  }
  playWrong() {
    this.playTone(220, 'sawtooth', 0.15, 0.1);
    setTimeout(() => this.playTone(180, 'sawtooth', 0.25, 0.12), 120);
  }
  playLevelUp() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.15, 0.12), i * 90);
    });
  }
  playFanfare() {
    const arpeggio = [523.25, 659.25, 783.99, 1046.5];
    arpeggio.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.2, 0.15), i * 120);
    });
  }
}
const sound = new SoundSynth();

// 2. STATE KHỞI TẠO CHUẨN CONTRACT
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Xác Suất 11',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// 3. BỘ PARSER MATHML FALLBACK & KATEX OFFLINE
function latexToMathML(latex) {
  let clean = latex.trim();
  clean = clean.replace(/\\overrightarrow\{([^}]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#8594;</mo></mover>');
  clean = clean.replace(/\\sqrt\{([^}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  clean = clean.replace(/\\cup/g, '<mo>&#8746;</mo>');
  clean = clean.replace(/\\cap/g, '<mo>&#8745;</mo>');
  clean = clean.replace(/\\approx/g, '<mo>&#8776;</mo>');
  clean = clean.replace(/\\cdot/g, '<mo>&#183;</mo>');
  clean = clean.replace(/\\ge/g, '<mo>&#8805;</mo>');
  clean = clean.replace(/\\le/g, '<mo>&#8804;</mo>');
  clean = clean.replace(/\\overline\{([^}]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#175;</mo></mover>');
  clean = clean.replace(/\\text\{([^}]+)\}/g, '<mtext>$1</mtext>');
  clean = clean.replace(/([a-zA-Z])/g, '<mi>$1</mi>');
  clean = clean.replace(/([0-9]+)/g, '<mn>$1</mn>');
  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${clean}</math>`;
}

function formatMathText(str) {
  if (!str) return '';
  return str.replace(/\$\$([\s\S]*?)\$\$/g, (m, c) => `<div class="math-block">${latexToMathML(c)}</div>`)
            .replace(/\$([^\$\n]+?)\$/g, (m, c) => `<span class="math-inline">${latexToMathML(c)}</span>`);
}

function renderMathInTree(root) {
  if (!root) return;
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {
      console.warn('KaTeX render error:', e);
    }
  }
  if (root.innerHTML && root.innerHTML.includes('$')) {
    root.innerHTML = formatMathText(root.innerHTML);
  }
}

// 4. DỮ LIỆU ĐẤU TRƯỜNG 10 CÂU TRẮC NGHIỆM ÔN TẬP CHƯƠNG VIII
const quizData = [
  {
    id: 1,
    title: "Câu 1: (SGK 8.16) Số phần tử biến cố hợp hộp 20 thẻ",
    pts: 20,
    question: "Một hộp đựng 20 tấm thẻ đánh số từ 1 đến 20. Gọi $A$: \"Rút được thẻ ghi số chẵn lớn hơn 9\", $B$: \"Rút được thẻ ghi số không nhỏ hơn 8 và không lớn hơn 15\". Số phần tử của biến cố hợp $A \\cup B$ là:",
    options: [
      { text: "11", correct: true },
      { text: "10", correct: false },
      { text: "12", correct: false },
      { text: "13", correct: false }
    ],
    explanation: "Ta có $A = \\{10, 12, 14, 16, 18, 20\\}$ (6 phần tử) và $B = \\{8, 9, 10, 11, 12, 13, 14, 15\\}$ (8 phần tử). Phần giao $AB = \\{10, 12, 14\\}$ (3 phần tử). Số phần tử của $A \\cup B$ là $n(A \\cup B) = 6 + 8 - 3 = 11$."
  },
  {
    id: 2,
    title: "Câu 2: (SGK 8.17) Số phần tử biến cố giao",
    pts: 20,
    question: "Tiếp tục bài toán hộp 20 tấm thẻ ở câu 1, số phần tử của biến cố giao $AB$ là:",
    options: [
      { text: "3", correct: true },
      { text: "5", correct: false },
      { text: "6", correct: false },
      { text: "4", correct: false }
    ],
    explanation: "Biến cố giao $AB = A \\cap B = \\{10, 12, 14\\}$. Số phần tử của $AB$ là 3."
  },
  {
    id: 3,
    title: "Câu 3: (SGK 8.18) Hội thảo 50 nhà khoa học",
    pts: 20,
    question: "Tại hội thảo quốc tế có 50 nhà khoa học: 31 người thành thạo tiếng Anh, 21 người thành thạo tiếng Pháp và 5 người thành thạo cả hai thứ tiếng. Xác suất để chọn ngẫu nhiên một người thành thạo ít nhất một thứ tiếng là:",
    options: [
      { text: "$\\frac{47}{50}$", correct: true },
      { text: "$\\frac{37}{50}$", correct: false },
      { text: "$\\frac{39}{50}$", correct: false },
      { text: "$\\frac{41}{50}$", correct: false }
    ],
    explanation: "Gọi $A$ là thành thạo tiếng Anh, $F$ là thành thạo tiếng Pháp. Số người thành thạo ít nhất 1 thứ tiếng là $n(A \\cup F) = 31 + 21 - 5 = 47$. Xác suất là $\\frac{47}{50}$."
  },
  {
    id: 4,
    title: "Câu 4: (SGK 8.19) Xác suất không thành thạo cả hai thứ tiếng",
    pts: 20,
    question: "Cũng với hội thảo 50 nhà khoa học ở câu 3, xác suất để người được chọn không thành thạo cả hai thứ tiếng Anh và Pháp là:",
    options: [
      { text: "$\\frac{3}{50}$", correct: true },
      { text: "$\\frac{7}{50}$", correct: false },
      { text: "$\\frac{9}{50}$", correct: false },
      { text: "$\\frac{11}{50}$", correct: false }
    ],
    explanation: "Biến cố không thành thạo cả hai thứ tiếng là biến cố đối của thành thạo ít nhất một thứ tiếng: $P = 1 - \\frac{47}{50} = \\frac{3}{50}$."
  },
  {
    id: 5,
    title: "Câu 5: (SGK 8.20) Khảo sát sở thích thể thao lớp 40 học sinh",
    pts: 20,
    question: "Một lớp 40 học sinh có 23 bạn thích bóng chuyền, 18 bạn thích bóng rổ, 26 bạn thích bóng chuyền hoặc bóng rổ hoặc cả hai. Xác suất để chọn được học sinh không thích cả hai môn là:",
    options: [
      { text: "$\\frac{7}{20}$", correct: true },
      { text: "$\\frac{9}{20}$", correct: false },
      { text: "$\\frac{19}{40}$", correct: false },
      { text: "$\\frac{21}{40}$", correct: false }
    ],
    explanation: "Số bạn thích ít nhất 1 môn là 26. Do đó số bạn không thích môn nào là $40 - 26 = 14$. Xác suất là $\\frac{14}{40} = \\frac{7}{20}$."
  },
  {
    id: 6,
    title: "Câu 6: (SGK 8.21) Thích bóng chuyền nhưng không thích bóng rổ",
    pts: 20,
    question: "Tiếp tục bài toán lớp 40 học sinh ở câu 5, xác suất để chọn được học sinh thích bóng chuyền và không thích bóng rổ là:",
    options: [
      { text: "$\\frac{1}{5}$", correct: true },
      { text: "$\\frac{7}{40}$", correct: false },
      { text: "$\\frac{9}{40}$", correct: false },
      { text: "$\\frac{11}{40}$", correct: false }
    ],
    explanation: "Số học sinh thích cả hai môn là $n(C \\cap R) = 23 + 18 - 26 = 15$. Số học sinh thích bóng chuyền nhưng không thích bóng rổ là $23 - 15 = 8$. Xác suất là $\\frac{8}{40} = \\frac{1}{5}$."
  },
  {
    id: 7,
    title: "Câu 7: (SGK 8.23) Đoàn khách du lịch 31 người",
    pts: 20,
    question: "Đoàn khách du lịch gồm 31 người, trong đó có 7 người đến từ Hà Nội, 5 người đến từ Hải Phòng. Chọn ngẫu nhiên một người, xác suất để người đó đến từ Hà Nội hoặc đến từ Hải Phòng là:",
    options: [
      { text: "$\\frac{12}{31}$", correct: true },
      { text: "$\\frac{35}{31}$", correct: false },
      { text: "$\\frac{2}{31}$", correct: false },
      { text: "$\\frac{7}{31}$", correct: false }
    ],
    explanation: "Vì một người không thể đồng thời đến từ Hà Nội và Hải Phòng nên hai biến cố này xung khắc. Xác suất là $P = \\frac{7}{31} + \\frac{5}{31} = \\frac{12}{31}$."
  },
  {
    id: 8,
    title: "Câu 8: (SGK 8.24) Kiểm tra tính độc lập khi gieo xúc xắc 2 lần",
    pts: 20,
    question: "Gieo một con xúc xắc 2 lần liên tiếp. Xét $A$: \"Lần 1 xuất hiện 1 chấm\", $D$: \"Tổng số chấm ở hai lần gieo bằng 7\". Khẳng định nào sau đây là đúng?",
    options: [
      { text: "$A$ và $D$ là hai biến cố độc lập", correct: true },
      { text: "$A$ và $D$ là hai biến cố xung khắc", correct: false },
      { text: "$P(AD) = 0$", correct: false },
      { text: "$A$ và $D$ không độc lập vì tổng phụ thuộc vào lần 1", correct: false }
    ],
    explanation: "Ta có $P(A) = \\frac{1}{6}$. $D = \\{(1,6), (2,5), (3,4), (4,3), (5,2), (6,1)\\} \\implies P(D) = \\frac{6}{36} = \\frac{1}{6}$. Giao $AD = \\{(1, 6)\\} \\implies P(AD) = \\frac{1}{36}$. Vì $P(AD) = \\frac{1}{36} = P(A) \\cdot P(D)$ nên $A$ và $D$ là hai biến cố độc lập!"
  },
  {
    id: 9,
    title: "Câu 9: (SGK 8.25a) Hai chuyến bay khởi hành đúng giờ",
    pts: 20,
    question: "Hai hãng hàng không X và Y hoạt động độc lập. Xác suất chuyến bay của hãng X và Y đúng giờ lần lượt là 0,92 và 0,98. Xác suất để cả hai chuyến bay cùng cất cánh đúng giờ là:",
    options: [
      { text: "0,9016", correct: true },
      { text: "0,9400", correct: false },
      { text: "0,9984", correct: false },
      { text: "0,0968", correct: false }
    ],
    explanation: "Do hai chuyến bay hoạt động độc lập nên $P = 0,92 \\cdot 0,98 = 0,9016$."
  },
  {
    id: 10,
    title: "Câu 10: (SGK 8.25c) Có ít nhất một chuyến bay đúng giờ",
    pts: 20,
    question: "Cũng với hai chuyến bay ở câu 9 ($P(X) = 0,92; P(Y) = 0,98$), xác suất để có ít nhất một chuyến bay khởi hành đúng giờ bằng:",
    options: [
      { text: "0,9984", correct: true },
      { text: "0,0016", correct: false },
      { text: "0,9016", correct: false },
      { text: "0,9800", correct: false }
    ],
    explanation: "Biến cố đối là cả 2 chuyến đều bị trễ: $P = (1 - 0,92)(1 - 0,98) = 0,08 \\cdot 0,02 = 0,0016$. Vậy xác suất có ít nhất 1 chuyến đúng giờ là $1 - 0,0016 = 0,9984$."
  }
];

// 5. KHỞI TẠO ĐẤU TRƯỜNG & TƯƠNG TÁC TỨC THÌ
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];

  quizData.forEach((q) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `qCard-${q.id}`;

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `<span><strong>${q.title}</strong></span><span class="quiz-badge">+${q.pts} XP</span>`;
    card.appendChild(header);

    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    const optsDiv = document.createElement('div');
    optsDiv.className = 'quiz-options';

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;
      btn.addEventListener('click', () => handleOptionClick(q, optIndex, btn, card));
      optsDiv.appendChild(btn);
    });
    card.appendChild(optsDiv);

    const explanation = document.createElement('div');
    explanation.className = 'explanation-box';
    explanation.id = `exp-${q.id}`;
    explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;
    card.appendChild(explanation);

    container.appendChild(card);
  });

  renderMathInTree(container);
}

function handleOptionClick(q, chosenIndex, chosenBtn, card) {
  if (appState.answered[q.id]) return;
  appState.answered[q.id] = true;

  const optButtons = card.querySelectorAll('.quiz-opt-btn');
  optButtons.forEach(b => b.disabled = true);

  const expBox = card.querySelector('.explanation-box');
  if (expBox) {
    expBox.classList.add('show');
    renderMathInTree(expBox);
  }

  const isCorrect = q.options[chosenIndex].correct;
  if (isCorrect) {
    chosenBtn.classList.add('correct');
    sound.playCorrect();
    appState.xp += q.pts;
    appState.streak += 1;
  } else {
    chosenBtn.classList.add('wrong');
    sound.playWrong();
    appState.streak = 0;
    q.options.forEach((opt, idx) => {
      if (opt.correct) {
        optButtons[idx].classList.add('correct');
      }
    });
  }

  updateHUD();
  checkBadges();
}

// 6. CẬP NHẬT HUD & HUY HIỆU
function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const progressEl = document.getElementById('arenaProgress');
  const arenaScoreEl = document.getElementById('arenaScore');
  const starRatingEl = document.getElementById('starRating');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;

  const answeredCount = Object.keys(appState.answered).length;
  if (progressEl) progressEl.textContent = `${answeredCount}/10`;
  if (arenaScoreEl) arenaScoreEl.textContent = `${appState.xp} XP`;

  let stars = 2;
  if (appState.xp >= 60) stars = 3;
  if (appState.xp >= 140) stars = 4;
  if (appState.xp >= 200) stars = 5;
  appState.stars = stars;
  if (starRatingEl) {
    starRatingEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
  }
}

function checkBadges() {
  const answeredCount = Object.keys(appState.answered).length;

  if (!appState.badges[0] && appState.xp >= 20) {
    unlockBadge(0, 'badge-1');
  }
  if (!appState.badges[1] && appState.xp >= 60) {
    unlockBadge(1, 'badge-2');
  }
  if (!appState.badges[2] && appState.streak >= 3) {
    unlockBadge(2, 'badge-3');
  }
  if (!appState.badges[3] && appState.xp >= 160) {
    unlockBadge(3, 'badge-4');
  }
  if (!appState.badges[4] && answeredCount === 10 && appState.xp === 200) {
    unlockBadge(4, 'badge-5');
    sound.playFanfare();
  }
}

function unlockBadge(index, elementId) {
  appState.badges[index] = true;
  const b = document.getElementById(elementId);
  if (b) {
    b.style.opacity = '1';
    b.style.transform = 'scale(1.05)';
    b.style.borderColor = '#10b981';
    b.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
    sound.playLevelUp();
  }
}

// 7. LAB 1: MÁY TÍNH XÁC SUẤT VẠN NĂNG CHƯƠNG VIII
function initLab1() {
  const sPA = document.getElementById('sliderPA');
  const sPB = document.getElementById('sliderPB');
  const valPA = document.getElementById('valPA');
  const valPB = document.getElementById('valPB');
  const btnIndep = document.getElementById('btnModeIndep');
  const btnMutEx = document.getElementById('btnModeMutEx');
  const outLab1 = document.getElementById('outLab1');
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  let isIndepMode = true;

  btnIndep.addEventListener('click', () => {
    isIndepMode = true;
    btnIndep.style.borderColor = '#818cf8';
    btnMutEx.style.borderColor = '';
    sound.playClick();
    calc();
  });

  btnMutEx.addEventListener('click', () => {
    isIndepMode = false;
    btnMutEx.style.borderColor = '#818cf8';
    btnIndep.style.borderColor = '';
    sound.playClick();
    calc();
  });

  function calc() {
    const pA = parseFloat(sPA.value);
    const pB = parseFloat(sPB.value);
    valPA.textContent = pA.toFixed(2);
    valPB.textContent = pB.toFixed(2);

    let pAB, pUnion;
    if (isIndepMode) {
      pAB = pA * pB;
      pUnion = pA + pB - pAB;
    } else {
      pAB = 0;
      pUnion = Math.min(1.0, pA + pB);
    }
    const pNone = 1.0 - pUnion;

    outLab1.innerHTML = `Chế độ: <strong>${isIndepMode ? 'Độc Lập' : 'Xung Khắc'}</strong> | $P(AB) = ${pAB.toFixed(3)}$ | $P(A \\cup B) = ${pUnion.toFixed(3)}$ | Cả 2 cùng không xảy ra: $P(\\overline{A}\\,\\overline{B}) = ${pNone.toFixed(3)}$`;
    renderMathInTree(outLab1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ biểu đồ Venn động
    ctx.strokeStyle = '#475569';
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.fillText(`Không gian mẫu Ω (Chế độ: ${isIndepMode ? 'Độc lập' : 'Xung khắc'})`, 35, 45);

    const cy = 160;
    const r1 = 70;
    const r2 = 70;

    let cx1 = 210;
    let cx2 = isIndepMode ? 330 : 380; // tách rời nếu xung khắc

    // Vòng tròn A
    ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.beginPath();
    ctx.arc(cx1, cy, r1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Vòng tròn B
    ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
    ctx.beginPath();
    ctx.arc(cx2, cy, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`A: ${(pA * 100).toFixed(0)}%`, cx1 - 30, cy);
    ctx.fillText(`B: ${(pB * 100).toFixed(0)}%`, cx2 + 30, cy);

    if (isIndepMode) {
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(`AB: ${(pAB * 100).toFixed(1)}%`, (cx1 + cx2) / 2, cy);
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.fillText('Xung khắc (Giao = ∅)', (cx1 + cx2) / 2, cy);
    }
  }

  sPA.addEventListener('input', calc);
  sPB.addEventListener('input', calc);
  calc();
}

// 8. LAB 2: MÔ PHỎNG CHUYẾN BAY HÀNG KHÔNG SGK 8.25
function initLab2() {
  const sDays = document.getElementById('sliderFlightDays');
  const valDays = document.getElementById('valFlightDays');
  const btn = document.getElementById('btnRunFlights');
  const outLab2 = document.getElementById('outLab2');
  const canvas = document.getElementById('canvasLab2');
  if (!canvas || !btn) return;
  const ctx = canvas.getContext('2d');

  sDays.addEventListener('input', () => {
    valDays.textContent = sDays.value;
  });

  function runFlights() {
    sound.playClick();
    const total = parseInt(sDays.value);
    const pX = 0.92;
    const pY = 0.98;

    let bothOnTime = 0;
    let onlyX = 0;
    let onlyY = 0;
    let bothDelayed = 0;

    for (let i = 0; i < total; i++) {
      const okX = Math.random() < pX;
      const okY = Math.random() < pY;
      if (okX && okY) bothOnTime++;
      else if (okX && !okY) onlyX++;
      else if (!okX && okY) onlyY++;
      else bothDelayed++;
    }

    const atLeastOne = bothOnTime + onlyX + onlyY;
    const rBoth = (bothOnTime / total) * 100;
    const rAtLeastOne = (atLeastOne / total) * 100;
    const rOne = ((onlyX + onlyY) / total) * 100;

    outLab2.innerHTML = `Thực nghiệm ${total} ngày: Cả 2 cùng đúng giờ: $${bothOnTime}$ ngày (${rBoth.toFixed(2)}\\%) | Đúng 1 chuyến đúng giờ: $${onlyX + onlyY}$ ngày (${rOne.toFixed(2)}\\%) | Ít nhất 1 chuyến đúng giờ: $${atLeastOne}$ ngày (${rAtLeastOne.toFixed(2)}\\%)<br><span style="color: #10b981;">✓ Lý thuyết SGK: Cả 2 đúng giờ $= 90,16\\%$ | Đúng 1 chuyến $= 9,68\\%$ | Ít nhất 1 chuyến $= 99,84\\%$</span>`;
    renderMathInTree(outLab2);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(`BIỂU ĐỒ HOẠT ĐỘNG HÀNG KHÔNG (${total} NGÀY BAY)`, 30, 45);

    const data = [
      { label: 'Cả 2 cùng đúng giờ (90.16%)', count: bothOnTime, pct: rBoth, color: '#10b981' },
      { label: 'Chỉ hãng Y đúng giờ (7.84%)', count: onlyY, pct: (onlyY / total) * 100, color: '#38bdf8' },
      { label: 'Chỉ hãng X đúng giờ (1.84%)', count: onlyX, pct: (onlyX / total) * 100, color: '#f59e0b' },
      { label: 'Cả hai đều bị trễ (0.16%)', count: bothDelayed, pct: (bothDelayed / total) * 100, color: '#ef4444' }
    ];

    let startY = 80;
    const barMaxW = 300;

    data.forEach(item => {
      ctx.fillStyle = '#f8fafc';
      ctx.font = '13px sans-serif';
      ctx.fillText(item.label, 30, startY + 16);

      const w = Math.max(4, (item.count / total) * barMaxW);
      ctx.fillStyle = item.color;
      ctx.fillRect(230, startY, w, 22);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText(`${item.count} (${item.pct.toFixed(2)}%)`, 240 + w, startY + 16);

      startY += 50;
    });
  }

  btn.addEventListener('click', runFlights);
  runFlights();
}

// 9. CÁC TIỆN ÍCH HỆ THỐNG & TABS
function initSystem() {
  const tabBtns = document.querySelectorAll('.nav-tab[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playClick();
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = `tab-${btn.dataset.tab}`;
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.add('active');
        renderMathInTree(target);
      }
    });
  });

  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      sound.enabled = appState.sound;
      soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      sound.playClick();
    });
  }

  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập không?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        for (let i = 1; i <= 5; i++) {
          const b = document.getElementById(`badge-${i}`);
          if (b) {
            b.style.opacity = '0.4';
            b.style.borderColor = '';
            b.style.boxShadow = '';
            b.style.transform = 'none';
          }
        }
        updateHUD();
        renderQuiz();
        sound.playClick();
      }
    });
  }

  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const certStudentName = document.getElementById('certStudentName');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      avatarModal.style.display = 'flex';
      sound.playClick();
    });
  }
  if (btnCloseModal && avatarModal) {
    btnCloseModal.addEventListener('click', () => {
      avatarModal.style.display = 'none';
      sound.playClick();
    });
  }

  const avatarOpts = document.querySelectorAll('.avatar-opt');
  avatarOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      const av = opt.dataset.avatar;
      const name = opt.dataset.name;
      appState.avatar = av;
      appState.userName = name;
      if (avatarBtn) avatarBtn.textContent = av;
      if (userNameDisplay) userNameDisplay.textContent = `${name} 🌟`;
      if (certStudentName) certStudentName.textContent = name;
      avatarModal.style.display = 'none';
      sound.playClick();
    });
  });

  const btnPrintCert = document.getElementById('btnPrintCert');
  if (btnPrintCert) {
    btnPrintCert.addEventListener('click', () => {
      window.print();
    });
  }
}

// 10. KHỞI CHẠY KHI TẢI TRANG
document.addEventListener('DOMContentLoaded', () => {
  renderQuiz();
  initLab1();
  initLab2();
  initSystem();
  updateHUD();
  renderMathInTree(document.body);
});
