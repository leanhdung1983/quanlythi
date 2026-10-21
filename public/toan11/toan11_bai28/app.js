// ==========================================================================
// BÀI 28: BIẾN CỐ HỢP, BIẾN CỐ GIAO, BIẾN CỐ ĐỘC LẬP - TOÁN 11 KNTT
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
  userTitle: 'Chiến Binh Xác Suất 11',
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

// 4. DỮ LIỆU ĐẤU TRƯỜNG 10 CÂU TRẮC NGHIỆM BÀI 28
const quizData = [
  {
    id: 1,
    title: "Câu 1: Khái niệm biến cố hợp",
    pts: 20,
    question: "Cho hai biến cố $A$ và $B$. Biến cố \"$A$ hoặc $B$ xảy ra\" được gọi là:",
    options: [
      { text: "Biến cố hợp của $A$ và $B$, kí hiệu $A \\cup B$", correct: true },
      { text: "Biến cố giao của $A$ và $B$, kí hiệu $AB$", correct: false },
      { text: "Biến cố đối của $A$ và $B$", correct: false },
      { text: "Biến cố độc lập của $A$ và $B$", correct: false }
    ],
    explanation: "Theo định nghĩa SGK Toán 11 KNTT trang 67: Cho $A$ và $B$ là hai biến cố. Biến cố: \"$A$ hoặc $B$ xảy ra\" được gọi là biến cố hợp của $A$ và $B$, kí hiệu là $A \\cup B$."
  },
  {
    id: 2,
    title: "Câu 2: Khái niệm biến cố giao",
    pts: 20,
    question: "Cho hai biến cố $A$ và $B$. Biến cố \"Cả $A$ và $B$ cùng xảy ra\" được gọi là:",
    options: [
      { text: "Biến cố hợp của $A$ và $B$", correct: false },
      { text: "Biến cố giao của $A$ và $B$, kí hiệu $AB$ hoặc $A \\cap B$", correct: true },
      { text: "Biến cố xung khắc của $A$ và $B$", correct: false },
      { text: "Biến cố chắc chắn", correct: false }
    ],
    explanation: "Theo định nghĩa SGK trang 68: Biến cố: \"Cả $A$ và $B$ đều xảy ra\" được gọi là biến cố giao của $A$ và $B$, kí hiệu là $AB$ hay $A \\cap B$."
  },
  {
    id: 3,
    title: "Câu 3: Khái niệm hai biến cố xung khắc",
    pts: 20,
    question: "Hai biến cố $A$ và $B$ được gọi là xung khắc khi và chỉ khi:",
    options: [
      { text: "$A \\cap B = \\emptyset$ (chúng không thể cùng xảy ra)", correct: true },
      { text: "$A \\cup B = \\Omega$", correct: false },
      { text: "$P(AB) = P(A) \\cdot P(B)$", correct: false },
      { text: "$A = B$", correct: false }
    ],
    explanation: "Hai biến cố $A$ và $B$ được gọi là xung khắc nếu $A$ và $B$ không đồng thời xảy ra, tức là tập hợp kết quả thuận lợi cho cả hai là tập rỗng: $A \\cap B = \\emptyset$."
  },
  {
    id: 4,
    title: "Câu 4: Định nghĩa hai biến cố độc lập",
    pts: 20,
    question: "Cặp biến cố $A$ và $B$ được gọi là độc lập nếu:",
    options: [
      { text: "$A$ và $B$ không cùng xảy ra trong bất kì phép thử nào", correct: false },
      { text: "Việc xảy ra hay không xảy ra của biến cố này không ảnh hưởng tới xác suất xảy ra của biến cố kia", correct: true },
      { text: "Xác suất của $A$ luôn lớn hơn xác suất của $B$", correct: false },
      { text: "$A \\cup B = \\emptyset$", correct: false }
    ],
    explanation: "Theo định nghĩa SGK trang 69: Cặp biến cố $A$ và $B$ được gọi là độc lập nếu việc xảy ra hay không xảy ra của biến cố này không làm ảnh hưởng tới xác suất xảy ra của biến cố kia."
  },
  {
    id: 5,
    title: "Câu 5: (SGK 8.1) Hộp 15 thẻ rút ngẫu nhiên",
    pts: 20,
    question: "Một hộp đựng 15 tấm thẻ đánh số từ 1 đến 15. Rút ngẫu nhiên một tấm thẻ. Gọi $A$: \"Số ghi trên thẻ nhỏ hơn 7\", $B$: \"Số ghi trên thẻ là số nguyên tố\". Số phần tử của biến cố giao $AB$ là:",
    options: [
      { text: "3", correct: true },
      { text: "4", correct: false },
      { text: "6", correct: false },
      { text: "9", correct: false }
    ],
    explanation: "Ta có $A = \\{1, 2, 3, 4, 5, 6\\}$ và $B = \\{2, 3, 5, 7, 11, 13\\}$. Do đó biến cố giao $AB = A \\cap B = \\{2, 3, 5\\}$. Số phần tử của $AB$ là 3."
  },
  {
    id: 6,
    title: "Câu 6: (SGK 8.1) Số phần tử biến cố hợp",
    pts: 20,
    question: "Cũng với hộp 15 tấm thẻ ở câu 5 ($A$: thẻ $< 7$, $B$: thẻ là số nguyên tố). Số phần tử của biến cố hợp $A \\cup B$ là:",
    options: [
      { text: "9", correct: true },
      { text: "12", correct: false },
      { text: "15", correct: false },
      { text: "8", correct: false }
    ],
    explanation: "Ta có $A \\cup B = \\{1, 2, 3, 4, 5, 6, 7, 11, 13\\}$. Tập hợp này có đúng 9 phần tử. Ta cũng có thể dùng công thức $n(A \\cup B) = n(A) + n(B) - n(AB) = 6 + 6 - 3 = 9$."
  },
  {
    id: 7,
    title: "Câu 7: (SGK 8.2) Gieo hai con xúc xắc",
    pts: 20,
    question: "Gieo hai con xúc xắc cân đối. Gọi $E$: \"Số chấm trên cả hai con đều chẵn\", $F$: \"Số chấm trên hai con khác tính chẵn lẻ\", $K$: \"Tích số chấm là số chẵn\". Khẳng định nào sau đây là đúng?",
    options: [
      { text: "$K = E \\cup F$", correct: true },
      { text: "$K = E \\cap F$", correct: false },
      { text: "$E$ và $F$ là hai biến cố độc lập", correct: false },
      { text: "$K$ là biến cố đối của $E$", correct: false }
    ],
    explanation: "Tích hai số là chẵn khi và chỉ khi có ít nhất một số chẵn. Điều này xảy ra khi cả hai số đều chẵn ($E$) hoặc một chẵn một lẻ ($F$). Do đó $K = E \\cup F$."
  },
  {
    id: 8,
    title: "Câu 8: (SGK 8.3) Ý nghĩa biến cố đối tích",
    pts: 20,
    question: "Chọn ngẫu nhiên một học sinh. Xét $P$: \"Học sinh đó bị cận thị\", $Q$: \"Học sinh đó giỏi môn Toán\". Biến cố $\\overline{P}\\,\\overline{Q}$ phát biểu bằng lời là:",
    options: [
      { text: "\"Học sinh đó không bị cận thị và không giỏi môn Toán\"", correct: true },
      { text: "\"Học sinh đó không bị cận thị hoặc không giỏi môn Toán\"", correct: false },
      { text: "\"Học sinh đó bị cận thị nhưng không giỏi môn Toán\"", correct: false },
      { text: "\"Học sinh đó giỏi môn Toán và bị cận thị\"", correct: false }
    ],
    explanation: "$\\overline{P}$ là \"không bị cận thị\", $\\overline{Q}$ là \"không giỏi môn Toán\". Biến cố tích $\\overline{P}\\,\\overline{Q}$ có nghĩa là cả hai điều cùng đồng thời xảy ra: \"Học sinh đó không bị cận thị và không giỏi môn Toán\"."
  },
  {
    id: 9,
    title: "Câu 9: (SGK 8.4) Hai chuồng nuôi thỏ",
    pts: 20,
    question: "Chuồng I có 5 thỏ đen và 10 thỏ trắng. Chuồng II có 3 thỏ trắng và 7 thỏ đen. Từ mỗi chuồng bắt ngẫu nhiên một con thỏ. Gọi $A$: \"Bắt thỏ trắng từ chuồng I\", $B$: \"Bắt thỏ đen từ chuồng II\". Khẳng định nào sau đây là đúng?",
    options: [
      { text: "$A$ và $B$ là hai biến cố độc lập", correct: true },
      { text: "$A$ và $B$ là hai biến cố xung khắc", correct: false },
      { text: "$A \\cup B = \\emptyset$", correct: false },
      { text: "Xác suất của $A$ phụ thuộc vào kết quả của biến cố $B$", correct: false }
    ],
    explanation: "Vì việc bắt thỏ ở chuồng I và việc bắt thỏ ở chuồng II được tiến hành hoàn toàn độc lập, kết quả ở chuồng I không làm ảnh hưởng đến tỉ lệ hay kết quả ở chuồng II, nên $A$ và $B$ là hai biến cố độc lập."
  },
  {
    id: 10,
    title: "Câu 10: Tính chất hệ quả của biến cố độc lập",
    pts: 20,
    question: "Nếu cặp biến cố $A$ và $B$ độc lập thì cặp biến cố nào sau đây chắc chắn cũng độc lập với nhau?",
    options: [
      { text: "$\\overline{A}$ và $\\overline{B}$", correct: true },
      { text: "$A$ và $A \\cup B$", correct: false },
      { text: "$A$ và $AB$", correct: false },
      { text: "$B$ và $A \\cap B$", correct: false }
    ],
    explanation: "Theo tính chất SGK trang 69: Nếu cặp biến cố $A$ và $B$ độc lập thì các cặp biến cố: $A$ và $\\overline{B}$; $\\overline{A}$ và $B$; $\\overline{A}$ và $\\overline{B}$ cũng hoàn toàn độc lập."
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

  // Cập nhật sao
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
  let correctCount = 0;
  quizData.forEach(q => {
    if (appState.answered[q.id]) {
      const card = document.getElementById(`qCard-${q.id}`);
      if (card && card.querySelector('.quiz-opt-btn.correct:not([disabled="true"]):focus, .quiz-opt-btn.correct')) {
        // check if user picked correct
        const chosen = card.querySelector('.quiz-opt-btn.correct');
        if (chosen && !card.querySelector('.quiz-opt-btn.wrong')) {
          correctCount++;
        }
      }
    }
  });

  // Badge 1: Làm đúng câu đầu tiên
  if (!appState.badges[0] && appState.xp >= 20) {
    unlockBadge(0, 'badge-1');
  }
  // Badge 2: Đạt 60 XP
  if (!appState.badges[1] && appState.xp >= 60) {
    unlockBadge(1, 'badge-2');
  }
  // Badge 3: Chuỗi streak >= 3
  if (!appState.badges[2] && appState.streak >= 3) {
    unlockBadge(2, 'badge-3');
  }
  // Badge 4: Đạt >= 160 XP
  if (!appState.badges[3] && appState.xp >= 160) {
    unlockBadge(3, 'badge-4');
  }
  // Badge 5: Đúng 10/10 câu
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

// 7. LAB 1: BIỂU ĐỒ VENN TƯƠNG TÁC
function initLab1() {
  const sA = document.getElementById('sliderA');
  const sB = document.getElementById('sliderB');
  const sInter = document.getElementById('sliderInter');
  const valA = document.getElementById('valA');
  const valB = document.getElementById('valB');
  const valInter = document.getElementById('valInter');
  const outLab1 = document.getElementById('outLab1');
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    let a = parseInt(sA.value);
    let b = parseInt(sB.value);
    let inter = parseInt(sInter.value);

    // Không để phần giao lớn hơn tập A hoặc B
    if (inter > Math.min(a, b)) {
      inter = Math.min(a, b);
      sInter.value = inter;
    }
    sInter.max = Math.min(a, b);

    valA.textContent = a;
    valB.textContent = b;
    valInter.textContent = inter;

    const union = a + b - inter;
    outLab1.innerHTML = `Số phần tử hợp: $n(A \\cup B) = ${union}$ | Giao: $n(A \\cap B) = ${inter}$ | Chỉ thuộc $A$: $n(A \\setminus B) = ${a - inter}$ | Chỉ thuộc $B$: $n(B \\setminus A) = ${b - inter}$`;
    renderMathInTree(outLab1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Khung không gian mẫu Omega
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 2;
    ctx.strokeRect(20, 20, canvas.width - 40, canvas.height - 40);
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Không gian mẫu Ω', 35, 45);

    const cx1 = 200;
    const cy = 160;
    const r1 = 85;
    const cx2 = 340;
    const r2 = 85;

    // Vòng tròn A
    ctx.save();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.35)';
    ctx.beginPath();
    ctx.arc(cx1, cy, r1, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Vòng tròn B
    ctx.save();
    ctx.fillStyle = 'rgba(236, 72, 153, 0.35)';
    ctx.beginPath();
    ctx.arc(cx2, cy, r2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#f472b6';
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();

    // Nhãn tập hợp
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`A: ${a - inter}`, cx1 - 35, cy + 5);
    ctx.fillText(`B: ${b - inter}`, cx2 + 35, cy + 5);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`A ∩ B`, (cx1 + cx2) / 2, cy - 10);
    ctx.fillText(`${inter}`, (cx1 + cx2) / 2, cy + 15);

    ctx.fillStyle = '#c7d2fe';
    ctx.fillText('Tập A', cx1 - 40, cy - r1 + 10);
    ctx.fillStyle = '#fbcfe8';
    ctx.fillText('Tập B', cx2 + 40, cy - r2 + 10);
  }

  sA.addEventListener('input', draw);
  sB.addEventListener('input', draw);
  sInter.addEventListener('input', draw);
  draw();
}

// 8. LAB 2: MÁY MÔ PHỎNG GIEO XÚC XẮC ĐỘC LẬP
function initLab2() {
  const sTrials = document.getElementById('sliderTrials');
  const valTrials = document.getElementById('valTrials');
  const btn = document.getElementById('btnSimulate');
  const outLab2 = document.getElementById('outLab2');
  const canvas = document.getElementById('canvasLab2');
  if (!canvas || !btn) return;
  const ctx = canvas.getContext('2d');

  sTrials.addEventListener('input', () => {
    valTrials.textContent = sTrials.value;
  });

  function simulate() {
    sound.playClick();
    const n = parseInt(sTrials.value);
    let countA = 0; // Minh: chẵn (2, 4, 6)
    let countB = 0; // Sơn: chia hết cho 3 (3, 6)
    let countAB = 0; // Cả hai cùng xảy ra

    for (let i = 0; i < n; i++) {
      const dice1 = Math.floor(Math.random() * 6) + 1;
      const dice2 = Math.floor(Math.random() * 6) + 1;
      const isA = (dice1 % 2 === 0);
      const isB = (dice2 % 3 === 0);
      if (isA) countA++;
      if (isB) countB++;
      if (isA && isB) countAB++;
    }

    const pA = countA / n;
    const pB = countB / n;
    const pAB = countAB / n;
    const pProduct = pA * pB;

    outLab2.innerHTML = `Thực nghiệm ${n} lần: $P(A) \\approx ${pA.toFixed(3)}$ | $P(B) \\approx ${pB.toFixed(3)}$ | $P(AB) \\approx ${pAB.toFixed(3)}$ | Tích $P(A)P(B) \\approx ${pProduct.toFixed(3)}$<br><span style="color: #10b981;">✓ Độ sai lệch: $|P(AB) - P(A)P(B)| = ${Math.abs(pAB - pProduct).toFixed(4)} \\approx 0$ (Kiểm chứng tính Độc Lập)</span>`;
    renderMathInTree(outLab2);

    // Vẽ biểu đồ cột trực quan
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = '#94a3b8';
    ctx.font = '14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`Mô phỏng ${n} lần gieo xúc xắc ngẫu nhiên:`, 25, 30);

    const labels = ['P(A) Chẵn', 'P(B) Chia hết 3', 'P(AB) Thực nghiệm', 'P(A) · P(B) Lý thuyết'];
    const values = [pA, pB, pAB, pProduct];
    const colors = ['#6366f1', '#ec4899', '#10b981', '#f59e0b'];

    const barWidth = 85;
    const startX = 50;
    const maxBarHeight = 180;
    const baseY = 250;

    for (let i = 0; i < 4; i++) {
      const x = startX + i * 115;
      const h = values[i] * maxBarHeight * 1.8; // scale
      ctx.fillStyle = colors[i];
      ctx.fillRect(x, baseY - h, barWidth, h);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${(values[i] * 100).toFixed(1)}%`, x + barWidth / 2, baseY - h - 8);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px sans-serif';
      const words = labels[i].split(' ');
      ctx.fillText(words[0], x + barWidth / 2, baseY + 20);
      if (words[1]) ctx.fillText(words.slice(1).join(' '), x + barWidth / 2, baseY + 35);
    }
  }

  btn.addEventListener('click', simulate);
  simulate();
}

// 9. CÁC TIỆN ÍCH HỆ THỐNG & TABS
function initSystem() {
  // Tabs navigation
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

  // Sound toggle
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      sound.enabled = appState.sound;
      soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      sound.playClick();
    });
  }

  // Reset progress
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

  // Avatar Modal
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

  // In chứng nhận A4
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
