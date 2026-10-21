// ==========================================================================
// BÀI 29: CÔNG THỨC CỘNG XÁC SUẤT - TOÁN 11 KNTT
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
  userTitle: 'Chuyên Gia Quy Tắc Cộng 11',
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
  clean = clean.replace(/\\emptyset/g, '<mo>&#8709;</mo>');
  clean = clean.replace(/\\approx/g, '<mo>&#8776;</mo>');
  clean = clean.replace(/\\cdot/g, '<mo>&#183;</mo>');
  clean = clean.replace(/\\ge/g, '<mo>&#8805;</mo>');
  clean = clean.replace(/\\le/g, '<mo>&#8804;</mo>');
  clean = clean.replace(/\\in/g, '<mo>&#8712;</mo>');
  clean = clean.replace(/\\notin/g, '<mo>&#8713;</mo>');
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

// 4. DỮ LIỆU ĐẤU TRƯỜNG 10 CÂU TRẮC NGHIỆM BÀI 29
const quizData = [
  {
    id: 1,
    title: "Câu 1: Công thức cộng cho hai biến cố xung khắc",
    pts: 20,
    question: "Nếu hai biến cố $A$ và $B$ xung khắc với nhau ($A \\cap B = \\emptyset$) thì khẳng định nào sau đây là đúng?",
    options: [
      { text: "$P(A \\cup B) = P(A) + P(B)$", correct: true },
      { text: "$P(A \\cup B) = P(A) \\cdot P(B)$", correct: false },
      { text: "$P(A \\cup B) = P(A) + P(B) - 1$", correct: false },
      { text: "$P(A \\cup B) = 1 - P(A)P(B)$", correct: false }
    ],
    explanation: "Theo định lý SGK Toán 11 KNTT trang 73: Nếu $A$ và $B$ là hai biến cố xung khắc thì $P(A \\cup B) = P(A) + P(B)$."
  },
  {
    id: 2,
    title: "Câu 2: Công thức xác suất của biến cố đối",
    pts: 20,
    question: "Cho biến cố $A$. Công thức tính xác suất của biến cố đối $\\overline{A}$ là:",
    options: [
      { text: "$P(\\overline{A}) = 1 - P(A)$", correct: true },
      { text: "$P(\\overline{A}) = P(A) - 1$", correct: false },
      { text: "$P(\\overline{A}) = \\frac{1}{P(A)}$", correct: false },
      { text: "$P(\\overline{A}) = 1 + P(A)$", correct: false }
    ],
    explanation: "Vì $A$ và $\\overline{A}$ là hai biến cố xung khắc và $A \\cup \\overline{A} = \\Omega$, ta có $P(A) + P(\\overline{A}) = 1 \\implies P(\\overline{A}) = 1 - P(A)$."
  },
  {
    id: 3,
    title: "Câu 3: Công thức cộng xác suất tổng quát",
    pts: 20,
    question: "Với hai biến cố bất kì $A$ và $B$, công thức nào sau đây luôn đúng?",
    options: [
      { text: "$P(A \\cup B) = P(A) + P(B) - P(AB)$", correct: true },
      { text: "$P(A \\cup B) = P(A) + P(B)$", correct: false },
      { text: "$P(A \\cup B) = P(A) \\cdot P(B)$", correct: false },
      { text: "$P(A \\cup B) = P(A) + P(B) + P(AB)$", correct: false }
    ],
    explanation: "Theo công thức cộng tổng quát (SGK trang 74): Với hai biến cố bất kì $A$ và $B$, ta luôn có $P(A \\cup B) = P(A) + P(B) - P(AB)$."
  },
  {
    id: 4,
    title: "Câu 4: Tính xác suất hợp từ số liệu cho trước",
    pts: 20,
    question: "Cho hai biến cố $A$ và $B$ có $P(A) = 0,4$; $P(B) = 0,5$ và $P(AB) = 0,2$. Xác suất của biến cố hợp $A \\cup B$ bằng:",
    options: [
      { text: "0,7", correct: true },
      { text: "0,9", correct: false },
      { text: "0,2", correct: false },
      { text: "0,8", correct: false }
    ],
    explanation: "Áp dụng công thức cộng tổng quát: $P(A \\cup B) = P(A) + P(B) - P(AB) = 0,4 + 0,5 - 0,2 = 0,7$."
  },
  {
    id: 5,
    title: "Câu 5: (SGK tr. 72) Khảo sát bệnh nhân tỉnh X",
    pts: 20,
    question: "Tại tỉnh X, người trên 50 tuổi có tỉ lệ mắc bệnh tim là $8,2\\%$, bệnh huyết áp là $12,5\\%$ và mắc cả hai bệnh là $5,7\\%$. Chọn ngẫu nhiên một người trên 50 tuổi, xác suất người đó mắc ít nhất một trong hai bệnh là:",
    options: [
      { text: "0,15 (hay 15%)", correct: true },
      { text: "0,207 (hay 20,7%)", correct: false },
      { text: "0,068 (hay 6,8%)", correct: false },
      { text: "0,264 (hay 26,4%)", correct: false }
    ],
    explanation: "Gọi $T$ là biến cố mắc bệnh tim, $H$ là biến cố mắc bệnh huyết áp. Biến cố mắc ít nhất một bệnh là $T \\cup H$. Ta có: $P(T \\cup H) = P(T) + P(H) - P(TH) = 0,082 + 0,125 - 0,057 = 0,15 = 15\\%$."
  },
  {
    id: 6,
    title: "Câu 6: (SGK tr. 72) Tỉ lệ người không mắc cả hai bệnh",
    pts: 20,
    question: "Tiếp tục bài toán tỉnh X ở câu 5, xác suất để chọn ngẫu nhiên một người trên 50 tuổi không mắc cả bệnh tim và bệnh huyết áp là:",
    options: [
      { text: "0,85 (hay 85%)", correct: true },
      { text: "0,793 (hay 79,3%)", correct: false },
      { text: "0,943 (hay 94,3%)", correct: false },
      { text: "0,736 (hay 73,6%)", correct: false }
    ],
    explanation: "Biến cố \"không mắc cả hai bệnh\" chính là biến cố đối của \"mắc ít nhất một bệnh\": $P = 1 - P(T \\cup H) = 1 - 0,15 = 0,85 = 85\\%$."
  },
  {
    id: 7,
    title: "Câu 7: (SGK 8.6) Gieo một con xúc xắc",
    pts: 20,
    question: "Gieo một con xúc xắc cân đối. Gọi $A$: \"Số chấm xuất hiện chia hết cho 3\", $B$: \"Số chấm xuất hiện là số chẵn\". Xác suất của biến cố hợp $A \\cup B$ bằng:",
    options: [
      { text: "$\\frac{2}{3}$", correct: true },
      { text: "$\\frac{5}{6}$", correct: false },
      { text: "$\\frac{1}{2}$", correct: false },
      { text: "$\\frac{1}{6}$", correct: false }
    ],
    explanation: "Ta có: $A = \\{3, 6\\} \\implies P(A) = \\frac{2}{6}$. $B = \\{2, 4, 6\\} \\implies P(B) = \\frac{3}{6}$. Biến cố giao $AB = \\{6\\} \\implies P(AB) = \\frac{1}{6}$. Do đó: $P(A \\cup B) = P(A) + P(B) - P(AB) = \\frac{2}{6} + \\frac{3}{6} - \\frac{1}{6} = \\frac{4}{6} = \\frac{2}{3}$."
  },
  {
    id: 8,
    title: "Câu 8: (SGK 8.7) Khảo sát thể thao lớp học",
    pts: 20,
    question: "Một lớp có 40 học sinh, trong đó có 25 bạn thích bóng đá, 15 bạn thích bóng rổ và 10 bạn thích cả hai môn. Chọn ngẫu nhiên một bạn, xác suất bạn đó thích ít nhất một môn thể thao là:",
    options: [
      { text: "$\\frac{3}{4}$", correct: true },
      { text: "$\\frac{1}{4}$", correct: false },
      { text: "$\\frac{5}{8}$", correct: false },
      { text: "1", correct: false }
    ],
    explanation: "Gọi $Đ$ là thích bóng đá, $R$ là thích bóng rổ. Ta có $P(Đ) = \\frac{25}{40}$, $P(R) = \\frac{15}{40}$, $P(ĐR) = \\frac{10}{40}$. Xác suất thích ít nhất một môn là $P(Đ \\cup R) = \\frac{25}{40} + \\frac{15}{40} - \\frac{10}{40} = \\frac{30}{40} = \\frac{3}{4}$."
  },
  {
    id: 9,
    title: "Câu 9: (SGK 8.8) Rút hai lá bài tú lơ khơ",
    pts: 20,
    question: "Rút ngẫu nhiên đồng thời hai lá bài từ cỗ bài 52 lá. Xác suất để rút được ít nhất một lá bài Át (Ace) bằng:",
    options: [
      { text: "$\\frac{33}{221}$", correct: true },
      { text: "$\\frac{188}{221}$", correct: false },
      { text: "$\\frac{1}{13}$", correct: false },
      { text: "$\\frac{2}{13}$", correct: false }
    ],
    explanation: "Tổng số cách chọn 2 lá bài là $C_{52}^2 = 1326$. Gọi $E$ là biến cố \"ít nhất 1 lá Át\". Biến cố đối $\\overline{E}$ là \"không có lá Át nào\", tức chọn 2 lá từ 48 lá không phải Át: $C_{48}^2 = 1128$. Suy ra $P(\\overline{E}) = \\frac{1128}{1326} = \\frac{188}{221}$. Vậy $P(E) = 1 - \\frac{188}{221} = \\frac{33}{221}$."
  },
  {
    id: 10,
    title: "Câu 10: Biến cố xung khắc và phần bù",
    pts: 20,
    question: "Cho hai biến cố xung khắc $A$ và $B$ với $P(A) = 0,35$ và $P(B) = 0,45$. Xác suất của biến cố $\\overline{A \\cup B}$ bằng:",
    options: [
      { text: "0,20", correct: true },
      { text: "0,80", correct: false },
      { text: "0,1575", correct: false },
      { text: "0,65", correct: false }
    ],
    explanation: "Vì $A$ và $B$ xung khắc nên $P(A \\cup B) = P(A) + P(B) = 0,35 + 0,45 = 0,80$. Do đó $P(\\overline{A \\cup B}) = 1 - P(A \\cup B) = 1 - 0,80 = 0,20$."
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

// 7. LAB 1: THƯỚC ĐO XÁC SUẤT CỘNG TRỰC QUAN
function initLab1() {
  const sPA = document.getElementById('sliderPA');
  const sPB = document.getElementById('sliderPB');
  const sPAB = document.getElementById('sliderPAB');
  const valPA = document.getElementById('valPA');
  const valPB = document.getElementById('valPB');
  const valPAB = document.getElementById('valPAB');
  const outLab1 = document.getElementById('outLab1');
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    let pA = parseFloat(sPA.value);
    let pB = parseFloat(sPB.value);
    let pAB = parseFloat(sPAB.value);

    // Điều kiện giới hạn giao
    const maxInter = Math.min(pA, pB);
    if (pAB > maxInter) {
      pAB = maxInter;
      sPAB.value = pAB;
    }
    sPAB.max = maxInter.toFixed(2);

    valPA.textContent = pA.toFixed(2);
    valPB.textContent = pB.toFixed(2);
    valPAB.textContent = pAB.toFixed(2);

    const union = pA + pB - pAB;
    outLab1.innerHTML = `$P(A \\cup B) = P(A) + P(B) - P(AB) = ${pA.toFixed(2)} + ${pB.toFixed(2)} - ${pAB.toFixed(2)} = ${union.toFixed(2)}$ | Biến cố đối: $P(\\overline{A \\cup B}) = ${(1 - union).toFixed(2)}$`;
    renderMathInTree(outLab1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ thanh đo toàn bộ không gian mẫu [0, 1]
    const barX = 40;
    const barY = 50;
    const barW = canvas.width - 80;
    const barH = 50;

    ctx.fillStyle = '#1e293b';
    ctx.fillRect(barX, barY, barW, barH);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(barX, barY, barW, barH);

    // Tô màu vùng A cup B
    const wUnion = Math.min(barW, union * barW);
    const grad = ctx.createLinearGradient(barX, barY, barX + wUnion, barY);
    grad.addColorStop(0, '#6366f1');
    grad.addColorStop(0.5, '#a855f7');
    grad.addColorStop(1, '#ec4899');
    ctx.fillStyle = grad;
    ctx.fillRect(barX, barY, wUnion, barH);

    // Vẽ nhãn trên thanh
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.textAlign = 'center';
    if (wUnion > 60) {
      ctx.fillText(`P(A ∪ B) = ${(union * 100).toFixed(0)}%`, barX + wUnion / 2, barY + 30);
    }
    if (barW - wUnion > 60) {
      ctx.fillStyle = '#94a3b8';
      ctx.fillText(`P(đối) = ${((1 - union) * 100).toFixed(0)}%`, barX + wUnion + (barW - wUnion) / 2, barY + 30);
    }

    // Biểu đồ Venn hình học minh họa phía dưới
    const cy = 200;
    const cx1 = 210;
    const cx2 = 330;
    const r1 = Math.max(35, pA * 110);
    const r2 = Math.max(35, pB * 110);

    ctx.save();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.beginPath();
    ctx.arc(cx1, cy, r1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.save();
    ctx.fillStyle = 'rgba(236, 72, 153, 0.4)';
    ctx.beginPath();
    ctx.arc(cx2, cy, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.restore();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`A: ${(pA * 100).toFixed(0)}%`, cx1 - 40, cy);
    ctx.fillText(`B: ${(pB * 100).toFixed(0)}%`, cx2 + 40, cy);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Giao: ${(pAB * 100).toFixed(0)}%`, (cx1 + cx2) / 2, cy);
  }

  sPA.addEventListener('input', draw);
  sPB.addEventListener('input', draw);
  sPAB.addEventListener('input', draw);
  draw();
}

// 8. LAB 2: MÔ PHỎNG DỊCH TỄ HỌC TỈNH X
function initLab2() {
  const sSample = document.getElementById('sliderSample');
  const valSample = document.getElementById('valSampleSize');
  const btn = document.getElementById('btnRunSurvey');
  const outLab2 = document.getElementById('outLab2');
  const canvas = document.getElementById('canvasLab2');
  if (!canvas || !btn) return;
  const ctx = canvas.getContext('2d');

  sSample.addEventListener('input', () => {
    valSample.textContent = sSample.value;
  });

  function runSurvey() {
    sound.playClick();
    const total = parseInt(sSample.value);
    // Tỉ lệ:
    // P(T) = 0.082, P(H) = 0.125, P(TH) = 0.057
    // P(chỉ T) = 0.082 - 0.057 = 0.025
    // P(chỉ H) = 0.125 - 0.057 = 0.068
    // P(cả hai) = 0.057
    // P(khỏe mạnh) = 1 - 0.15 = 0.85
    let countOnlyT = 0;
    let countOnlyH = 0;
    let countBoth = 0;
    let countHealthy = 0;

    for (let i = 0; i < total; i++) {
      const r = Math.random();
      if (r < 0.057) {
        countBoth++;
      } else if (r < 0.057 + 0.025) {
        countOnlyT++;
      } else if (r < 0.057 + 0.025 + 0.068) {
        countOnlyH++;
      } else {
        countHealthy++;
      }
    }

    const sickTotal = countBoth + countOnlyT + countOnlyH;
    const rateSick = (sickTotal / total) * 100;
    const rateHealthy = (countHealthy / total) * 100;

    outLab2.innerHTML = `Khảo sát ${total} người: Mắc ít nhất 1 bệnh: $${sickTotal}$ người (${rateSick.toFixed(1)}\\%) | Khỏe mạnh: $${countHealthy}$ người (${rateHealthy.toFixed(1)}\\%)<br><span style="color: #10b981;">✓ Công thức SGK: $P(T \\cup H) = 8,2\\% + 12,5\\% - 5,7\\% = 15,0\\%$ (Khớp hoàn hảo với thực nghiệm!)</span>`;
    renderMathInTree(outLab2);

    // Vẽ biểu đồ tròn phân phối
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = 170;
    const cy = 160;
    const radius = 105;

    const data = [
      { label: 'Cả hai bệnh (5.7%)', count: countBoth, color: '#ef4444' },
      { label: 'Chỉ bệnh tim (2.5%)', count: countOnlyT, color: '#f59e0b' },
      { label: 'Chỉ huyết áp (6.8%)', count: countOnlyH, color: '#ec4899' },
      { label: 'Không mắc bệnh (85.0%)', count: countHealthy, color: '#10b981' }
    ];

    let startAngle = -Math.PI / 2;
    data.forEach(item => {
      const sliceAngle = (item.count / total) * 2 * Math.PI;
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, radius, startAngle, startAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      startAngle += sliceAngle;
    });

    // Vẽ chú thích legend
    ctx.font = '13px sans-serif';
    ctx.textAlign = 'left';
    let legendY = 70;
    data.forEach(item => {
      ctx.fillStyle = item.color;
      ctx.fillRect(320, legendY, 18, 18);
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(`${item.label}: ${item.count} người`, 350, legendY + 14);
      legendY += 35;
    });
  }

  btn.addEventListener('click', runSurvey);
  runSurvey();
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
