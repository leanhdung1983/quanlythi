/**
 * BÀI 15: HÀM SỐ - TOÁN 10 KNTT
 * Pure Vanilla JavaScript ES6+ • Web Audio API • 2D Canvas • KaTeX Offline & MathML
 */

// === 1. AUDIO SYNTHESIZER (WEB AUDIO API) ===
class SoundEffects {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playTone(freq, type, duration, delay = 0, gainLevel = 0.15) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    setTimeout(() => {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainLevel, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        // audio handling
      }
    }, delay * 1000);
  }

  playCorrect() {
    this.playTone(523.25, 'sine', 0.15, 0, 0.2);
    this.playTone(659.25, 'sine', 0.15, 0.1, 0.2);
    this.playTone(783.99, 'sine', 0.25, 0.2, 0.25);
  }

  playWrong() {
    this.playTone(329.63, 'sawtooth', 0.2, 0, 0.2);
    this.playTone(261.63, 'sawtooth', 0.3, 0.15, 0.2);
  }

  playClick() {
    this.playTone(800, 'triangle', 0.04, 0, 0.08);
  }

  playLevelUp() {
    this.playTone(440, 'triangle', 0.12, 0, 0.2);
    this.playTone(554.37, 'triangle', 0.12, 0.1, 0.2);
    this.playTone(659.25, 'triangle', 0.2, 0.2, 0.25);
    this.playTone(880, 'triangle', 0.35, 0.32, 0.3);
  }

  playFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, i) => {
      this.playTone(freq, 'sine', 0.25, i * 0.12, 0.25);
    });
    setTimeout(() => {
      this.playTone(1046.5, 'triangle', 0.6, 0, 0.3);
    }, 550);
  }
}

const sfx = new SoundEffects();

// === 2. APP STATE ===
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Phân Tích Hàm Số',
  stars: 5,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [true, false, false, false, false]
};

// === 3. MATH RENDERING HELPER (KATEX OFFLINE & MATHML FALLBACK) ===
function renderMathInTree(root) {
  if (!root) return;
  if (typeof renderMathInElement === "function") {
    try {
      renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {
      console.warn("KaTeX render error, falling back:", e);
    }
  }
}

function formatMathText(str) {
  if (!str) return '';
  return str;
}

// === 4. QUIZ DATA (10 MCQS BÁM SÁT BÀI 15 SGK) ===
const quizData = [
  {
    id: 1,
    title: "Bài tập 6.1 (SGK tr.9) - Nhận diện hàm số",
    pts: 20,
    question: "Xét hai đại lượng $x, y$ phụ thuộc vào nhau theo các hệ thức sau:\n(I) $x + y = 1$\n(II) $y = x^2$\n(III) $y^2 = x$\n(IV) $x^2 - y^2 = 0$\nNhững trường hợp nào thì $y$ là hàm số của $x$?",
    options: [
      { text: "Chỉ (I) và (II)", correct: true },
      { text: "Chỉ (I) và (III)", correct: false },
      { text: "Cả 4 trường hợp", correct: false },
      { text: "Chỉ (II) và (IV)", correct: false }
    ],
    explanation: "Theo định nghĩa, $y$ là hàm số của $x$ nếu với mỗi giá trị của $x$ có **một và chỉ một** giá trị tương ứng của $y$.\n- (I): $y = 1 - x$ (với mỗi $x$ có duy nhất một $y$).\n- (II): $y = x^2$ (với mỗi $x$ có duy nhất một $y$).\n- (III): $y^2 = x \\implies y = \\pm\\sqrt{x}$, ví dụ $x = 4 \\implies y = 2$ hoặc $y = -2$ (có 2 giá trị $y$, không phải hàm số).\n- (IV): $y = \\pm x$, ví dụ $x = 1 \\implies y = 1$ hoặc $y = -1$ (không phải hàm số)."
  },
  {
    id: 2,
    title: "Bài tập 6.3a (SGK tr.9) - Tập xác định đa thức",
    pts: 20,
    question: "Tập xác định của hàm số $y = 2x^3 + 3x + 1$ là:",
    options: [
      { text: "$D = \\mathbb{R}$", correct: true },
      { text: "$D = (0; +\\infty)$", correct: false },
      { text: "$D = \\mathbb{R} \\setminus \\{0\\}$", correct: false },
      { text: "$D = [-1; 1]$", correct: false }
    ],
    explanation: "Biểu thức $2x^3 + 3x + 1$ là một đa thức bậc ba, luôn có nghĩa xác định với mọi số thực $x \\in \\mathbb{R}$. Do đó tập xác định của hàm số là $D = \\mathbb{R}$."
  },
  {
    id: 3,
    title: "Bài tập 6.3b (SGK tr.9) - Tập xác định phân thức",
    pts: 20,
    question: "Tập xác định của hàm số $y = \\dfrac{x - 1}{x^2 - 3x + 2}$ là:",
    options: [
      { text: "$D = \\mathbb{R} \\setminus \\{1; 2\\}$", correct: true },
      { text: "$D = \\mathbb{R} \\setminus \\{2\\}$", correct: false },
      { text: "$D = (1; 2)$", correct: false },
      { text: "$D = \\mathbb{R}$", correct: false }
    ],
    explanation: "Hàm số phân thức có nghĩa khi và chỉ khi mẫu thức khác 0:\n$$x^2 - 3x + 2 \\neq 0 \\iff (x - 1)(x - 2) \\neq 0 \\iff x \\neq 1 \\text{ và } x \\neq 2$$\nDo đó $D = \\mathbb{R} \\setminus \\{1; 2\\}$.\n*Lưu ý:* Mặc dù $\\dfrac{x-1}{x^2-3x+2} = \\dfrac{1}{x-2}$ khi $x \\neq 1$, điều kiện xác định ban đầu vẫn yêu cầu loại trừ cả $x = 1$."
  },
  {
    id: 4,
    title: "Bài tập 6.3c (SGK tr.9) - Tập xác định chứa căn",
    pts: 20,
    question: "Tập xác định của hàm số $y = \\sqrt{x + 1} + \\sqrt{1 - x}$ là:",
    options: [
      { text: "$D = [-1; 1]$", correct: true },
      { text: "$D = (-1; 1)$", correct: false },
      { text: "$D = (-\\infty; -1] \\cup [1; +\\infty)$", correct: false },
      { text: "$D = [0; 1]$", correct: false }
    ],
    explanation: "Biểu thức có nghĩa khi cả hai căn thức đồng thời không âm:\n$$\\begin{cases} x + 1 \\ge 0 \\\\ 1 - x \\ge 0 \\end{cases} \\iff \\begin{cases} x \\ge -1 \\\\ x \\le 1 \\end{cases} \\iff -1 \\le x \\le 1$$\nDo đó tập xác định là đoạn $D = [-1; 1]$."
  },
  {
    id: 5,
    title: "Bài tập 6.4a (SGK tr.9) - Tập giá trị hàm bậc nhất",
    pts: 20,
    question: "Cho hàm số $y = 2x + 3$. Khi $x$ thuộc đoạn $[-2; 3]$ thì tập giá trị tương ứng của hàm số là:",
    options: [
      { text: "$[-1; 9]$", correct: true },
      { text: "$[0; 9]$", correct: false },
      { text: "$[-1; 6]$", correct: false },
      { text: "$[-2; 3]$", correct: false }
    ],
    explanation: "Hàm số $y = 2x + 3$ có hệ số góc $a = 2 > 0$ nên luôn đồng biến trên $[-2; 3]$.\n- Tại $x = -2$: $y(-2) = 2(-2) + 3 = -1$.\n- Tại $x = 3$: $y(3) = 2(3) + 3 = 9$.\nVì hàm số liên tục và đồng biến nên tập giá trị tương ứng là đoạn $[-1; 9]$."
  },
  {
    id: 6,
    title: "Bài tập 6.4b (SGK tr.9) - Tập giá trị hàm bậc hai",
    pts: 20,
    question: "Tập giá trị của hàm số $y = 2x^2$ trên toàn bộ $\\mathbb{R}$ là:",
    options: [
      { text: "$T = [0; +\\infty)$", correct: true },
      { text: "$T = \\mathbb{R}$", correct: false },
      { text: "$T = (0; +\\infty)$", correct: false },
      { text: "$T = [2; +\\infty)$", correct: false }
    ],
    explanation: "Với mọi $x \\in \\mathbb{R}$, ta có $x^2 \\ge 0 \\implies y = 2x^2 \\ge 0$. Dấu bằng xảy ra khi $x = 0$. Khi $|x| \\to +\\infty$ thì $y \\to +\\infty$. Do đó tập giá trị của hàm số là nửa khoảng $T = [0; +\\infty)$."
  },
  {
    id: 7,
    title: "Bài tập 6.5a (SGK tr.9) - Tính đơn điệu hàm bậc nhất",
    pts: 20,
    question: "Khẳng định nào sau đây là đúng về tính đơn điệu của hàm số $y = -2x + 1$?",
    options: [
      { text: "Hàm số nghịch biến trên $\\mathbb{R}$", correct: true },
      { text: "Hàm số đồng biến trên $\\mathbb{R}$", correct: false },
      { text: "Hàm số nghịch biến trên $(-\\infty; 0)$ và đồng biến trên $(0; +\\infty)$", correct: false },
      { text: "Hàm số không đổi trên $\\mathbb{R}$", correct: false }
    ],
    explanation: "Với mọi $x_1, x_2 \\in \\mathbb{R}$ sao cho $x_1 < x_2$, ta có:\n$$-2x_1 > -2x_2 \\implies -2x_1 + 1 > -2x_2 + 1 \\implies f(x_1) > f(x_2)$$\nVậy hàm số nghịch biến trên toàn bộ $\\mathbb{R}$ (hệ số $a = -2 < 0$)."
  },
  {
    id: 8,
    title: "Bài tập 6.5b (SGK tr.9) - Tính đơn điệu hàm parabol",
    pts: 20,
    question: "Cho hàm số $y = -\\dfrac{1}{2}x^2$. Mệnh đề nào sau đây đúng?",
    options: [
      { text: "Đồng biến trên $(-\\infty; 0)$ và nghịch biến trên $(0; +\\infty)$", correct: true },
      { text: "Nghịch biến trên $(-\\infty; 0)$ và đồng biến trên $(0; +\\infty)$", correct: false },
      { text: "Đồng biến trên toàn bộ $\\mathbb{R}$", correct: false },
      { text: "Nghịch biến trên toàn bộ $\\mathbb{R}$", correct: false }
    ],
    explanation: "Đồ thị hàm số $y = -\\dfrac{1}{2}x^2$ là parabol có đỉnh $O(0; 0)$ và bề lõm quay xuống dưới:\n- Trên $(-\\infty; 0)$: khi $x$ tăng thì $y$ tăng dần từ $-\\infty$ lên $0$, nên hàm số **đồng biến**.\n- Trên $(0; +\\infty)$: khi $x$ tăng thì $y$ giảm dần từ $0$ xuống $-\\infty$, nên hàm số **nghịch biến**."
  },
  {
    id: 9,
    title: "Bài tập 6.6a (SGK tr.9) - Hàm số giá cước thuê xe",
    pts: 20,
    question: "Giá thuê xe ô tô tự lái là 1,2 triệu đồng/ngày cho hai ngày đầu tiên và 900 nghìn đồng (0,9 triệu) cho mỗi ngày tiếp theo. Với $x \\ge 3$ ($x$ là số ngày thuê), công thức hàm số tính tổng số tiền $T(x)$ (triệu đồng) là:",
    options: [
      { text: "$T(x) = 0,9x + 0,6$", correct: true },
      { text: "$T(x) = 1,2x + 0,9$", correct: false },
      { text: "$T(x) = 0,9x + 2,4$", correct: false },
      { text: "$T(x) = 2,1x - 0,9$", correct: false }
    ],
    explanation: "Tổng số tiền gồm:\n- Chi phí 2 ngày đầu: $2 \\times 1,2 = 2,4$ triệu đồng.\n- Chi phí các ngày tiếp theo: $(x - 2) \\times 0,9$ triệu đồng.\nTổng cộng: $T(x) = 2,4 + 0,9(x - 2) = 0,9x + 2,4 - 1,8 = 0,9x + 0,6$ (triệu đồng)."
  },
  {
    id: 10,
    title: "Bài tập 6.6b (SGK tr.9) - Tính giá trị hàm số thực tế",
    pts: 20,
    question: "Một đoàn khách thuê chiếc xe ô tô tự lái nói trên trong 5 ngày. Số tiền đoàn khách phải trả là:",
    options: [
      { text: "5,1 triệu đồng", correct: true },
      { text: "4,5 triệu đồng", correct: false },
      { text: "6,0 triệu đồng", correct: false },
      { text: "5,4 triệu đồng", correct: false }
    ],
    explanation: "Thay $x = 5$ vào công thức hàm số $T(x) = 0,9x + 0,6$:\n$$T(5) = 0,9 \\times 5 + 0,6 = 4,5 + 0,6 = 5,1 \\text{ (triệu đồng)}$$\nHoặc tính trực tiếp: 2 ngày đầu hết $2 \\times 1,2 = 2,4$ triệu, 3 ngày sau hết $3 \\times 0,9 = 2,7$ triệu; tổng là $2,4 + 2,7 = 5,1$ triệu đồng."
  }
];

// === 5. QUIZ RENDER & INTERACTION ===
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  quizData.forEach((q, qIndex) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard_${q.id}`;

    const letters = ['A', 'B', 'C', 'D'];
    let optsHtml = '';
    q.options.forEach((opt, oIndex) => {
      optsHtml += `
        <button class="quiz-opt-btn" data-qid="${q.id}" data-idx="${oIndex}">
          <span class="quiz-opt-letter">${letters[oIndex]}</span>
          <span class="quiz-opt-text">${opt.text}</span>
        </button>
      `;
    });

    card.innerHTML = `
      <div class="quiz-card-header">
        <span class="quiz-num">CÂU ${q.id}</span>
        <span class="quiz-title">${q.title}</span>
        <span class="quiz-pts">+${q.pts} XP</span>
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options-grid">${optsHtml}</div>
      <div class="explanation-box" id="expl_${q.id}">
        <strong>💡 Lời giải chi tiết:</strong><br>
        <div class="expl-content">${q.explanation}</div>
      </div>
    `;

    container.appendChild(card);
  });

  // Bind clicks
  container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const qId = parseInt(this.dataset.qid);
      const optIdx = parseInt(this.dataset.idx);
      handleQuizOption(qId, optIdx, this);
    });
  });

  renderMathInTree(container);
}

function handleQuizOption(qId, optIdx, btnEl) {
  if (appState.answered[qId]) return;
  appState.answered[qId] = true;

  const q = quizData.find(item => item.id === qId);
  if (!q) return;

  const card = document.getElementById(`quizCard_${qId}`);
  const buttons = card.querySelectorAll('.quiz-opt-btn');
  buttons.forEach(b => b.classList.add('disabled'));

  const chosenOpt = q.options[optIdx];
  const isCorrect = chosenOpt.correct;

  if (isCorrect) {
    btnEl.classList.add('correct');
    appState.xp += q.pts;
    appState.streak += 1;
    sfx.playCorrect();
  } else {
    btnEl.classList.add('wrong');
    appState.streak = 0;
    sfx.playWrong();
    // Highlight correct
    q.options.forEach((opt, idx) => {
      if (opt.correct) {
        buttons[idx].classList.add('correct');
      }
    });
  }

  const explBox = document.getElementById(`expl_${qId}`);
  if (explBox) {
    explBox.classList.add('show');
    renderMathInTree(explBox);
  }

  updateHUD();
  checkBadges();
}

// === 6. HUD & BADGES ===
function updateHUD() {
  const userXp = document.getElementById('xpDisplay') || document.getElementById('userXp');
  const userStreak = document.getElementById('streakDisplay') || document.getElementById('userStreak');
  const arenaProgress = document.getElementById('arenaProgress');
  const arenaScore = document.getElementById('arenaScore');
  const certStudentName = document.getElementById('certStudentName');
  const certXp = document.getElementById('certXp');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const userTitleDisplay = document.getElementById('userTitleDisplay');
  const avatarBtn = document.getElementById('avatarBtn');

  if (userXp) userXp.textContent = `${appState.xp} XP`;
  if (userStreak) userStreak.textContent = `${appState.streak}`;
  if (arenaScore) arenaScore.textContent = `Điểm Arena: ${appState.xp} XP`;

  const totalAnswered = Object.keys(appState.answered).length;
  if (arenaProgress) arenaProgress.textContent = `Tiến độ: ${totalAnswered}/${quizData.length}`;

  if (certStudentName) certStudentName.textContent = appState.userName;
  if (certXp) certXp.textContent = `${appState.xp} XP`;
  if (userNameDisplay) userNameDisplay.textContent = appState.userName;
  if (userTitleDisplay) userTitleDisplay.textContent = appState.userTitle;
  if (avatarBtn) avatarBtn.textContent = appState.avatar;
}

function unlockBadge(index, title) {
  if (appState.badges[index]) return;
  appState.badges[index] = true;
  const badgeEl = document.getElementById(`badge-${index}`);
  if (badgeEl) {
    badgeEl.classList.remove('locked');
    badgeEl.classList.add('unlocked');
    const status = badgeEl.querySelector('.badge-status');
    if (status) status.textContent = 'Đã mở';
  }
  sfx.playLevelUp();
}

function checkBadges() {
  unlockBadge(0, "Khởi Đầu Tinh Thông");

  if (appState.answered[3] || appState.answered[4]) {
    unlockBadge(1, "Thám Tử Miền Xác Định");
  }

  if (appState.xp >= 160) {
    unlockBadge(3, "Dũng Sĩ Đấu Trường");
  }

  const correctCount = Object.keys(appState.answered).filter(qId => {
    const q = quizData.find(item => item.id === parseInt(qId));
    const card = document.getElementById(`quizCard_${qId}`);
    return card && card.querySelector('.quiz-opt-btn.correct:not(.disabled)');
  }).length;

  if (appState.xp >= 200) {
    unlockBadge(4, "Đại Kiện Tướng Hàm Số");
    sfx.playFanfare();
  }
}

// === 7. LAB 1: MÁY KHẢO SÁT ĐỒ THỊ & TÍNH ĐƠN ĐIỆU ===
class FunctionExplorerLab {
  constructor() {
    this.canvas = document.getElementById('canvasLab1');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.selectFn = document.getElementById('selectFn');
    this.sliderX1 = document.getElementById('sliderX1');
    this.sliderX2 = document.getElementById('sliderX2');
    this.valX1 = document.getElementById('valX1');
    this.valX2 = document.getElementById('valX2');
    this.analysisBox = document.getElementById('lab1Analysis');

    this.bindEvents();
    this.draw();
  }

  bindEvents() {
    const onChange = () => {
      this.valX1.textContent = parseFloat(this.sliderX1.value).toFixed(1);
      this.valX2.textContent = parseFloat(this.sliderX2.value).toFixed(1);
      this.draw();
      unlockBadge(2, "Bậc Thầy Đơn Điệu");
    };

    this.selectFn.addEventListener('change', onChange);
    this.sliderX1.addEventListener('input', onChange);
    this.sliderX2.addEventListener('input', onChange);
  }

  getFn(x) {
    const type = this.selectFn.value;
    switch (type) {
      case 'linear_inc': return 2 * x - 1;
      case 'linear_dec': return -2 * x + 1;
      case 'quad_pos': return x * x - 2 * x;
      case 'quad_neg': return -0.5 * x * x;
      case 'hyperbola': return x !== 0 ? 2 / x : NaN;
      default: return x;
    }
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Coordinate system setup: domain [-5, 5], range [-5, 5]
    const xMin = -5, xMax = 5, yMin = -5, yMax = 5;
    const toCanvasX = x => ((x - xMin) / (xMax - xMin)) * w;
    const toCanvasY = y => h - ((y - yMin) / (yMax - yMin)) * h;

    // Grid lines
    ctx.strokeStyle = '#26334d';
    ctx.lineWidth = 1;
    for (let x = -4; x <= 4; x++) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x), 0);
      ctx.lineTo(toCanvasX(x), h);
      ctx.stroke();
    }
    for (let y = -4; y <= 4; y++) {
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(y));
      ctx.lineTo(w, toCanvasY(y));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    // Ox
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(w, toCanvasY(0));
    ctx.stroke();
    // Oy
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), h);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('O', toCanvasX(0) - 14, toCanvasY(0) + 16);
    ctx.fillText('x', w - 16, toCanvasY(0) - 8);
    ctx.fillText('y', toCanvasX(0) + 8, 16);

    // Plot Function curve
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= w; px += 2) {
      const x = xMin + (px / w) * (xMax - xMin);
      const y = this.getFn(x);
      if (isNaN(y) || y < yMin - 2 || y > yMax + 2) {
        started = false;
        continue;
      }
      const cy = toCanvasY(y);
      if (!started) {
        ctx.moveTo(px, cy);
        started = true;
      } else {
        ctx.lineTo(px, cy);
      }
    }
    ctx.stroke();

    // Two evaluation points x1, x2
    let x1 = parseFloat(this.sliderX1.value);
    let x2 = parseFloat(this.sliderX2.value);
    if (x1 > x2) {
      const temp = x1; x1 = x2; x2 = temp;
    }
    const y1 = this.getFn(x1);
    const y2 = this.getFn(x2);

    const drawPoint = (x, y, label, color) => {
      if (isNaN(y)) return;
      const cx = toCanvasX(x);
      const cy = toCanvasY(y);

      // Dash projections
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx, toCanvasY(0));
      ctx.lineTo(cx, cy);
      ctx.lineTo(toCanvasX(0), cy);
      ctx.stroke();
      ctx.setLineDash([]);

      // Point dot
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(cx, cy, 6, 0, Math.PI * 2);
      ctx.fill();

      // Label
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText(`${label}(${x.toFixed(1)}; ${y.toFixed(1)})`, cx + 8, cy - 8);
    };

    drawPoint(x1, y1, 'M₁', '#10b981');
    drawPoint(x2, y2, 'M₂', '#f59e0b');

    // Interval vector arrow on graph
    if (!isNaN(y1) && !isNaN(y2) && Math.abs(x2 - x1) > 0.05) {
      ctx.strokeStyle = y2 >= y1 ? '#10b981' : '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x1), toCanvasY(y1));
      ctx.lineTo(toCanvasX(x2), toCanvasY(y2));
      ctx.stroke();
    }

    // Dynamic analysis text
    const deltaX = x2 - x1;
    const deltaY = y2 - y1;
    let monotonicity = '';
    let badgeClass = '';

    if (Math.abs(deltaX) < 0.001) {
      monotonicity = 'Hai điểm trùng nhau ($x_1 = x_2$). Hãy tách $x_1, x_2$ để kiểm tra biến thiên!';
      badgeClass = 'info';
    } else if (deltaY > 0.001) {
      monotonicity = `Vì $x_1 < x_2$ ($\\Delta x = ${deltaX.toFixed(1)} > 0$) và $f(x_1) < f(x_2)$ ($\\Delta y = ${deltaY.toFixed(2)} > 0$) nên hàm số **ĐỒNG BIẾN (TĂNG)** trên khoảng này. Đồ thị đi lên ↗️.`;
      badgeClass = 'success';
    } else if (deltaY < -0.001) {
      monotonicity = `Vì $x_1 < x_2$ ($\\Delta x = ${deltaX.toFixed(1)} > 0$) và $f(x_1) > f(x_2)$ ($\\Delta y = ${deltaY.toFixed(2)} < 0$) nên hàm số **NGHỊCH BIẾN (GIẢM)** trên khoảng này. Đồ thị đi xuống ↘️.`;
      badgeClass = 'danger';
    } else {
      monotonicity = `Giá trị hàm số không đổi ($f(x_1) = f(x_2)$).`;
      badgeClass = 'warning';
    }

    this.analysisBox.innerHTML = `
      <div class="analysis-pill ${badgeClass}">
        <strong>Kết quả phân tích khoảng [$x_1 = ${x1.toFixed(1)}; x_2 = ${x2.toFixed(1)}$]:</strong><br>
        ${monotonicity}
      </div>
    `;
    renderMathInTree(this.analysisBox);
  }
}

// === 8. LAB 2: MÔ PHỎNG GIÁ CƯỚC TAXI (HÀM TỪNG PHẦN) ===
class TaxiFareLab {
  constructor() {
    this.canvas = document.getElementById('canvasLab2');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.sliderKm = document.getElementById('sliderKm');
    this.valKm = document.getElementById('valKm');
    this.receiptCard = document.getElementById('taxiReceipt');

    this.bindEvents();
    this.draw();
  }

  bindEvents() {
    this.sliderKm.addEventListener('input', () => {
      this.valKm.textContent = `${parseFloat(this.sliderKm.value).toFixed(1)} km`;
      this.draw();
    });
  }

  calcFare(x) {
    if (x <= 0) return 0;
    if (x <= 0.6) return 10000;
    if (x <= 25) {
      return 10000 + (x - 0.6) * 13000;
    }
    return 10000 + (25 - 0.6) * 13000 + (x - 25) * 11000;
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const xMax = 40;
    const yMax = 500000; // 500k VND
    const toCanvasX = x => 60 + (x / xMax) * (w - 90);
    const toCanvasY = y => (h - 40) - (y / yMax) * (h - 70);

    // Grid & Axes
    ctx.strokeStyle = '#26334d';
    ctx.lineWidth = 1;
    for (let km = 10; km <= 40; km += 10) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(km), 20);
      ctx.lineTo(toCanvasX(km), h - 40);
      ctx.stroke();
    }
    for (let price = 100000; price <= 500000; price += 100000) {
      ctx.beginPath();
      ctx.moveTo(60, toCanvasY(price));
      ctx.lineTo(w - 30, toCanvasY(price));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(60, h - 40);
    ctx.lineTo(w - 20, h - 40);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(60, h - 40);
    ctx.lineTo(60, 20);
    ctx.stroke();

    // Axis ticks and labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('0', 48, h - 35);
    for (let km = 10; km <= 40; km += 10) {
      ctx.fillText(`${km} km`, toCanvasX(km) - 15, h - 22);
    }
    ctx.fillText('100k', 25, toCanvasY(100000) + 4);
    ctx.fillText('200k', 25, toCanvasY(200000) + 4);
    ctx.fillText('300k', 25, toCanvasY(300000) + 4);
    ctx.fillText('400k', 25, toCanvasY(400000) + 4);

    // Segment 1: 0 to 0.6 km (10,000 đ)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), toCanvasY(10000));
    ctx.lineTo(toCanvasX(0.6), toCanvasY(10000));
    ctx.stroke();

    // Segment 2: 0.6 to 25 km (13,000 đ/km)
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0.6), toCanvasY(10000));
    const fare25 = this.calcFare(25);
    ctx.lineTo(toCanvasX(25), toCanvasY(fare25));
    ctx.stroke();

    // Segment 3: > 25 km (11,000 đ/km)
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(toCanvasX(25), toCanvasY(fare25));
    ctx.lineTo(toCanvasX(40), toCanvasY(this.calcFare(40)));
    ctx.stroke();

    // Draw boundary markers at 0.6 and 25
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(25), toCanvasY(0));
    ctx.lineTo(toCanvasX(25), toCanvasY(fare25));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('Mốc 25 km', toCanvasX(25) - 25, toCanvasY(fare25) - 15);

    // Current car position
    const curKm = parseFloat(this.sliderKm.value);
    const curFare = this.calcFare(curKm);
    const curX = toCanvasX(curKm);
    const curY = toCanvasY(curFare);

    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(curX, curY, 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`🚕 ${curFare.toLocaleString('vi-VN')} đ`, curX + 10, curY - 10);

    // Render receipt breakdown
    let formulaHtml = '';
    if (curKm <= 0.6) {
      formulaHtml = `<p>Giá mở cửa trọn gói: <strong>10.000 đ</strong> (cho 0,6 km đầu).</p>`;
    } else if (curKm <= 25) {
      const extraKm = (curKm - 0.6).toFixed(1);
      const extraCost = (curKm - 0.6) * 13000;
      formulaHtml = `
        <p>1. Giá mở cửa (0,6 km đầu): <strong>10.000 đ</strong></p>
        <p>2. Chặng tiếp theo (${extraKm} km × 13.000 đ/km): <strong>${Math.round(extraCost).toLocaleString('vi-VN')} đ</strong></p>
        <div class="receipt-total">Tổng cước: <strong>${Math.round(curFare).toLocaleString('vi-VN')} VNĐ</strong></div>
      `;
    } else {
      const stage2Km = (25 - 0.6).toFixed(1);
      const stage2Cost = (25 - 0.6) * 13000;
      const stage3Km = (curKm - 25).toFixed(1);
      const stage3Cost = (curKm - 25) * 11000;
      formulaHtml = `
        <p>1. Giá mở cửa (0,6 km đầu): <strong>10.000 đ</strong></p>
        <p>2. Chặng 0,6 đến 25 km (${stage2Km} km × 13.000 đ/km): <strong>${Math.round(stage2Cost).toLocaleString('vi-VN')} đ</strong></p>
        <p>3. Chặng trên 25 km (${stage3Km} km × 11.000 đ/km): <strong>${Math.round(stage3Cost).toLocaleString('vi-VN')} đ</strong></p>
        <div class="receipt-total">Tổng cước: <strong>${Math.round(curFare).toLocaleString('vi-VN')} VNĐ</strong></div>
      `;
    }

    this.receiptCard.innerHTML = `
      <h4>HÓA ĐƠN CƯỚC TAXI THEO HÀM TỪNG PHẦN</h4>
      <div class="receipt-details">${formulaHtml}</div>
    `;
    renderMathInTree(this.receiptCard);
  }
}

// === 9. INITIALIZATION ===
document.addEventListener('DOMContentLoaded', () => {
  // Tab Switching
  const tabButtons = document.querySelectorAll('.nav-tab');
  const tabPanes = document.querySelectorAll('.tab-content');

  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetId = 'tab-' + btn.dataset.tab;
      const target = document.getElementById(targetId) || document.getElementById(btn.dataset.tab);
      if (target) {
        target.classList.add('active');
        if (typeof renderMathInTree === 'function') renderMathInTree(target);
      }
      if (sfx) sfx.playClick();
    });
  });

  // Sound toggle
  const soundBtn = document.getElementById('soundToggle') || document.getElementById('soundToggleBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      sfx.enabled = !sfx.enabled;
      soundBtn.textContent = sfx.enabled ? '🔊' : '🔇';
      soundBtn.title = sfx.enabled ? 'Tắt âm thanh' : 'Bật âm thanh';
    });
  }

  // Reset progress
  const resetBtn = document.getElementById('resetProgress') || document.getElementById('resetProgressBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình học tập không?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [true, false, false, false, false];
        renderQuiz();
        updateHUD();
        document.querySelectorAll('.badge-item:not(#badge-0)').forEach(b => {
          b.classList.remove('unlocked');
          b.classList.add('locked');
          b.querySelector('.badge-status').textContent = 'Khóa';
        });
        sfx.playTone(300, 'sine', 0.2);
      }
    });
  }

  // Avatar Modal
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const closeAvatarBtn = document.getElementById('closeAvatarBtn');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      avatarModal.style.display = 'flex';
      sfx.playClick();
    });
  }

  if (closeAvatarBtn && avatarModal) {
    closeAvatarBtn.addEventListener('click', () => {
      avatarModal.style.display = 'none';
      sfx.playClick();
    });
  }

  document.querySelectorAll('.avatar-choice').forEach(choice => {
    choice.addEventListener('click', () => {
      appState.avatar = choice.dataset.avatar;
      const titleMap = {
        '👑': 'Đại Kiện Tướng Hàm Số',
        '🚀': 'Phi Hành Gia Vũ Trụ',
        '🧙‍♂️': 'Phù Thủy Logic',
        '🦁': 'Sư Tử Dũng Mãnh',
        '💎': 'Bậc Thầy Hàm Số',
        '🦉': 'Cú Thông Thái',
        '🎯': 'Xạ Thủ Tọa Độ',
        '🏅': 'Quán Quân Đơn Điệu'
      };
      appState.userTitle = titleMap[appState.avatar] || 'Chiến Binh Logic';
      updateHUD();
      if (avatarModal) avatarModal.style.display = 'none';
      sfx.playTone(600, 'triangle', 0.1);
    });
  });

  // Print Cert
  const btnPrintCert = document.getElementById('btnPrintCert');
  if (btnPrintCert) {
    btnPrintCert.addEventListener('click', () => {
      sfx.playClick();
      window.print();
    });
  }

  renderQuiz();
  new FunctionExplorerLab();
  new TaxiFareLab();
  updateHUD();

  unlockBadge(0, "Khởi Đầu Tinh Thông");
});

function triggerMathRender() {
  if (typeof renderMathInTree === "function") {
    renderMathInTree(document.body);
  }
}
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", triggerMathRender);
} else {
  triggerMathRender();
}
