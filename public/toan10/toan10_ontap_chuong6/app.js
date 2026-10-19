/**
 * BÀI TẬP CUỐI CHƯƠNG VI - TOÁN 10 KNTT
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
  userTitle: 'Đại Kiện Tướng Chương VI',
  stars: 5,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [true, false, false, false, false]
};

// === 3. MATH RENDERING HELPER ===
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
      console.warn("KaTeX render error:", e);
    }
  }
}

// === 4. QUIZ DATA (10 MCQS BÁM SÁT BÀI TẬP CUỐI CHƯƠNG VI) ===
const quizData = [
  {
    id: 1,
    title: "Bài tập 6.24 (SGK tr.28) - Tập xác định hàm số",
    pts: 20,
    question: "Tập xác định của hàm số $y = \\dfrac{1}{\\sqrt{x - 2}}$ là:",
    options: [
      { text: "$D = (2; +\\infty)$", correct: true },
      { text: "$D = [2; +\\infty)$", correct: false },
      { text: "$D = \\mathbb{R} \\setminus \\{2\\}$", correct: false },
      { text: "$D = \\mathbb{R}$", correct: false }
    ],
    explanation: "Biểu thức có nghĩa khi và chỉ khi biểu thức trong căn dưới mẫu số dương nghiêm ngặt:\n$$x - 2 > 0 \\iff x > 2$$\nDo đó tập xác định của hàm số là khoảng $D = (2; +\\infty)$."
  },
  {
    id: 2,
    title: "Bài tập 6.25 (SGK tr.28) - Tọa độ đỉnh parabol",
    pts: 20,
    question: "Parabol $y = -x^2 + 2x + 3$ có toạ độ đỉnh là:",
    options: [
      { text: "$I(1; 4)$", correct: true },
      { text: "$I(-1; 0)$", correct: false },
      { text: "$I(3; 0)$", correct: false },
      { text: "$I(0; 3)$", correct: false }
    ],
    explanation: "Parabol có $a = -1, b = 2, c = 3$:\n- Hoành độ đỉnh: $x_I = -\\dfrac{b}{2a} = -\\dfrac{2}{2(-1)} = 1$.\n- Tung độ đỉnh: $y_I = -(1)^2 + 2(1) + 3 = 4$.\nVậy đỉnh của parabol là $I(1; 4)$."
  },
  {
    id: 3,
    title: "Bài tập 6.26 (SGK tr.28) - Khoảng biến thiên hàm bậc hai",
    pts: 20,
    question: "Hàm số bậc hai $y = x^2 - 5x + 4$ nghịch biến trên khoảng nào sau đây?",
    options: [
      { text: "Nghịch biến trên khoảng $(-\\infty; 1)$", correct: true },
      { text: "Đồng biến trên khoảng $(1; +\\infty)$", correct: false },
      { text: "Đồng biến trên khoảng $(-\\infty; 4)$", correct: false },
      { text: "Nghịch biến trên khoảng $(1; 4)$", correct: false }
    ],
    explanation: "Hàm số có $a = 1 > 0$, hoành độ đỉnh là $x_I = -\\dfrac{b}{2a} = \\dfrac{5}{2} = 2,5$.\nVì $a > 0$ nên hàm số nghịch biến trên khoảng $(-\\infty; 2,5)$ và đồng biến trên khoảng $(2,5; +\\infty)$.\nVì khoảng $(-\\infty; 1) \\subset (-\\infty; 2,5)$ nên hàm số nghịch biến trên khoảng $(-\\infty; 1)$."
  },
  {
    id: 4,
    title: "Bài tập 6.27 (SGK tr.28) - Điều kiện nghiệm đúng với mọi x",
    pts: 20,
    question: "Bất phương trình $x^2 - 2mx + 4 > 0$ nghiệm đúng với mọi $x \\in \\mathbb{R}$ khi và chỉ khi tham số $m$ nhận giá trị nào sau đây?",
    options: [
      { text: "$m = -1$", correct: true },
      { text: "$m = -2$", correct: false },
      { text: "$m = 2$", correct: false },
      { text: "$m > 2$", correct: false }
    ],
    explanation: "Bất phương trình $x^2 - 2mx + 4 > 0$ có $a = 1 > 0$. Để nghiệm đúng với mọi $x \\in \\mathbb{R}$, điều kiện cần và đủ là:\n$$\\Delta' = (-m)^2 - 1(4) < 0 \\iff m^2 - 4 < 0 \\iff -2 < m < 2$$\nTrong bốn phương án đưa ra, chỉ có giá trị $m = -1$ nằm trong khoảng $(-2; 2)$."
  },
  {
    id: 5,
    title: "Bài tập 6.28 (SGK tr.28) - Giải phương trình căn thức",
    pts: 20,
    question: "Tập nghiệm của phương trình $\\sqrt{2x^2 - 3} = x - 1$ là:",
    options: [
      { text: "$S = \\{-1 + \\sqrt{5}\\}$", correct: true },
      { text: "$S = \\{-1 - \\sqrt{5}; -1 + \\sqrt{5}\\}$", correct: false },
      { text: "$S = \\{-1 - \\sqrt{5}\\}$", correct: false },
      { text: "$S = \\varnothing$", correct: false }
    ],
    explanation: "Điều kiện xác định vế phải: $x - 1 \\ge 0 \\iff x \\ge 1$.\nBình phương hai vế:\n$$2x^2 - 3 = (x - 1)^2 = x^2 - 2x + 1 \\iff x^2 + 2x - 4 = 0$$\nNghiệm của phương trình bậc hai là $x = -1 \\pm \\sqrt{5}$.\nĐối chiếu điều kiện $x \\ge 1$:\n- $x_1 = -1 + \\sqrt{5} \\approx 1,236 \\ge 1$ (thỏa mãn).\n- $x_2 = -1 - \\sqrt{5} < 0 < 1$ (loại).\nVậy tập nghiệm $S = \\{-1 + \\sqrt{5}\\}$."
  },
  {
    id: 6,
    title: "Bài tập 6.29a (SGK tr.28) - Giao các điều kiện xác định",
    pts: 20,
    question: "Tập xác định của hàm số $y = \\sqrt{2x - 1} + \\sqrt{5 - x}$ là:",
    options: [
      { text: "$D = \\left[\\dfrac{1}{2}; 5\\right]$", correct: true },
      { text: "$D = \\left(\\dfrac{1}{2}; 5\\right)$", correct: false },
      { text: "$D = [1; 5]$", correct: false },
      { text: "$D = (-\\infty; 5]$", correct: false }
    ],
    explanation: "Điều kiện để hai căn thức đồng thời có nghĩa:\n$$\\begin{cases} 2x - 1 \\ge 0 \\\\ 5 - x \\ge 0 \\end{cases} \\iff \\begin{cases} x \\ge \\dfrac{1}{2} \\\\ x \\le 5 \\end{cases} \\iff \\dfrac{1}{2} \\le x \\le 5$$\nDo đó tập xác định là đoạn $D = \\left[\\dfrac{1}{2}; 5\\right]$."
  },
  {
    id: 7,
    title: "Bài tập 6.31c (SGK tr.28) - Xác định parabol từ đỉnh",
    pts: 20,
    question: "Xác định parabol $y = ax^2 + bx + 3$ biết parabol có đỉnh là điểm $I(1; 4)$:",
    options: [
      { text: "$y = -x^2 + 2x + 3$", correct: true },
      { text: "$y = x^2 - 2x + 3$", correct: false },
      { text: "$y = -2x^2 + 4x + 3$", correct: false },
      { text: "$y = -x^2 + x + 3$", correct: false }
    ],
    explanation: "Parabol có đỉnh $I(1; 4)$:\n- Hoành độ đỉnh: $x_I = -\\dfrac{b}{2a} = 1 \\implies b = -2a$.\n- Đỉnh $I(1; 4)$ thuộc parabol: $a(1)^2 + b(1) + 3 = 4 \\iff a + b = 1$.\nThay $b = -2a$ vào: $a - 2a = 1 \\iff -a = 1 \\implies a = -1 \\implies b = 2$.\nVậy parabol là $y = -x^2 + 2x + 3$."
  },
  {
    id: 8,
    title: "Bài tập 6.32c (SGK tr.28) - Bất phương trình nghiệm đơn điểm",
    pts: 20,
    question: "Tập nghiệm của bất phương trình $-3x^2 + 12x - 12 \\ge 0$ là:",
    options: [
      { text: "$S = \\{2\\}$", correct: true },
      { text: "$S = \\varnothing$", correct: false },
      { text: "$S = \\mathbb{R}$", correct: false },
      { text: "$S = (-\\infty; 2]$", correct: false }
    ],
    explanation: "Biến đổi vế trái:\n$$-3x^2 + 12x - 12 = -3(x^2 - 4x + 4) = -3(x - 2)^2$$\nBất phương trình trở thành:\n$$-3(x - 2)^2 \\ge 0 \\iff (x - 2)^2 \\le 0$$\nVì bình phương của mọi số thực luôn không âm ($(x - 2)^2 \\ge 0$), nên bất đẳng thức chỉ xảy ra khi $(x - 2)^2 = 0 \\iff x = 2$.\nVậy tập nghiệm chỉ gồm một phần tử duy nhất: $S = \\{2\\}$."
  },
  {
    id: 9,
    title: "Bài tập 6.33a (SGK tr.29) - Phương trình căn bậc hai",
    pts: 20,
    question: "Tập nghiệm của phương trình $\\sqrt{2x^2 - 14} = x - 1$ là:",
    options: [
      { text: "$S = \\{5\\}$", correct: true },
      { text: "$S = \\{-3; 5\\}$", correct: false },
      { text: "$S = \\{-3\\}$", correct: false },
      { text: "$S = \\varnothing$", correct: false }
    ],
    explanation: "Điều kiện xác định vế phải: $x - 1 \\ge 0 \\iff x \\ge 1$.\nBình phương hai vế:\n$$2x^2 - 14 = (x - 1)^2 = x^2 - 2x + 1 \\iff x^2 + 2x - 15 = 0$$\nPhân tích thành nhân tử: $(x - 3)(x + 5) = 0 \\implies x = 3$ hoặc $x = -5$...\nKhoan, hãy tính lại phương trình $\\sqrt{2x^2 - 14} = x - 1$:\n$2x^2 - 14 = x^2 - 2x + 1 \\iff x^2 + 2x - 15 = 0 \\iff (x - 3)(x + 5) = 0$.\nVới $x = 3$: vế trái $\\sqrt{2(9) - 14} = \\sqrt{4} = 2$, vế phải $3 - 1 = 2$ (thỏa mãn).\nVới $x = -5$: vế phải $-6 < 0$ (loại).\nVậy nghiệm duy nhất là $x = 3$ hoặc đề in $x = 5$ khi phương trình là $2x^2 - 14$?... Chú ý: Ở đây phương trình giải đúng cho $x = 3$ hoặc $x = 5$ tùy hệ số. Với $x^2 + 2x - 15 = 0$ thì nghiệm là $x = 3$!"
  },
  {
    id: 10,
    title: "Bài tập 6.34 (SGK tr.29) - Mô hình dự báo sản lượng laptop",
    pts: 20,
    question: "Doanh số bán máy tính xách tay qua các năm tính từ năm 2018 ($t = 0$) được mô hình hóa bởi $S(t) = 0,8t^2 + 3,2$ (nghìn chiếc). Đến năm bao nhiêu thì số lượng bán ra sẽ vượt mức 52 nghìn chiếc?",
    options: [
      { text: "Năm 2026 (tương ứng $t = 8$)", correct: true },
      { text: "Năm 2025 (tương ứng $t = 7$)", correct: false },
      { text: "Năm 2027 (tương ứng $t = 9$)", correct: false },
      { text: "Năm 2028 (tương ứng $t = 10$)", correct: false }
    ],
    explanation: "Để sản lượng bán ra vượt mức 52 nghìn chiếc, ta giải bất phương trình:\n$$0,8t^2 + 3,2 > 52 \\iff 0,8t^2 > 48,8 \\iff t^2 > \\dfrac{48,8}{0,8} = 61 \\iff t > \\sqrt{61} \\approx 7,81$$\nVì $t$ là số nguyên chỉ thời gian tính bằng năm, nên giá trị nhỏ nhất của $t$ thỏa mãn là $t = 8$.\nNăm tương ứng là: $2018 + 8 = 2026$."
  }
];

// Correct question 9 explanation and options if needed:
quizData[8].question = "Tập nghiệm của phương trình $\\sqrt{2x^2 - 14} = x - 1$ là:";
quizData[8].options = [
  { text: "$S = \\{3\\}$", correct: true },
  { text: "$S = \\{-5; 3\\}$", correct: false },
  { text: "$S = \\{-5\\}$", correct: false },
  { text: "$S = \\varnothing$", correct: false }
];
quizData[8].explanation = "Điều kiện xác định vế phải: $x - 1 \\ge 0 \\iff x \\ge 1$.\nBình phương hai vế:\n$$2x^2 - 14 = (x - 1)^2 = x^2 - 2x + 1 \\iff x^2 + 2x - 15 = 0$$\nGiải phương trình bậc hai: $(x - 3)(x + 5) = 0 \\iff x = 3$ hoặc $x = -5$.\nĐối chiếu với điều kiện $x \\ge 1$:\n- $x = 3 \\ge 1$ (thỏa mãn).\n- $x = -5 < 1$ (loại vì vế phải bằng $-6 < 0$).\nVậy tập nghiệm của phương trình là $S = \\{3\\}$.";

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
  unlockBadge(0, "Chiến Binh Chương VI");

  if (appState.answered[1] || appState.answered[2]) {
    unlockBadge(1, "Chuyên Gia Nhận Diện");
  }

  if (appState.answered[10]) {
    unlockBadge(2, "Nhà Dự Báo Kinh Tế");
  }

  if (appState.xp >= 160) {
    unlockBadge(3, "Dũng Sĩ Toàn Năng");
  }

  if (appState.xp >= 200) {
    unlockBadge(4, "Đại Kiện Tướng Chương VI");
    sfx.playFanfare();
  }
}

// === 7. LAB 1: SIÊU MÁY TÍNH KHẢO SÁT CHƯƠNG VI ===
class ReviewExplorerLab {
  constructor() {
    this.canvas = document.getElementById('canvasReview1');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.sliderA = document.getElementById('reviewA');
    this.sliderB = document.getElementById('reviewB');
    this.sliderC = document.getElementById('reviewC');
    this.valA = document.getElementById('valRevA');
    this.valB = document.getElementById('valRevB');
    this.valC = document.getElementById('valRevC');
    this.analysisBox = document.getElementById('reviewAnalysisBox');

    this.bindEvents();
    this.draw();
  }

  bindEvents() {
    const update = () => {
      let a = parseFloat(this.sliderA.value);
      if (Math.abs(a) < 0.1) a = a >= 0 ? 0.5 : -0.5;
      this.valA.textContent = a.toFixed(1);
      this.valB.textContent = parseFloat(this.sliderB.value).toFixed(1);
      this.valC.textContent = parseFloat(this.sliderC.value).toFixed(1);
      this.draw();
    };

    this.sliderA.addEventListener('input', update);
    this.sliderB.addEventListener('input', update);
    this.sliderC.addEventListener('input', update);
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    let a = parseFloat(this.sliderA.value);
    if (Math.abs(a) < 0.1) a = a >= 0 ? 0.5 : -0.5;
    const b = parseFloat(this.sliderB.value);
    const c = parseFloat(this.sliderC.value);

    // Coordinate system: x in [-6, 6], y in [-6, 6]
    const xMin = -6, xMax = 6, yMin = -6, yMax = 6;
    const toCanvasX = x => ((x - xMin) / (xMax - xMin)) * w;
    const toCanvasY = y => h - ((y - yMin) / (yMax - yMin)) * h;

    // Grid
    ctx.strokeStyle = '#26334d';
    ctx.lineWidth = 1;
    for (let x = -5; x <= 5; x++) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x), 0);
      ctx.lineTo(toCanvasX(x), h);
      ctx.stroke();
    }
    for (let y = -5; y <= 5; y++) {
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(y));
      ctx.lineTo(w, toCanvasY(y));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, toCanvasY(0));
    ctx.lineTo(w, toCanvasY(0));
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(toCanvasX(0), 0);
    ctx.lineTo(toCanvasX(0), h);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('O', toCanvasX(0) - 14, toCanvasY(0) + 16);
    ctx.fillText('x', w - 16, toCanvasY(0) - 8);
    ctx.fillText('y', toCanvasX(0) + 8, 16);

    // Parabola curve
    ctx.strokeStyle = a > 0 ? '#10b981' : '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= w; px += 2) {
      const x = xMin + (px / w) * (xMax - xMin);
      const y = a * x * x + b * x + c;
      if (y < yMin - 5 || y > yMax + 5) {
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

    // Vertex & Axis of symmetry
    const xI = -b / (2 * a);
    const delta = b * b - 4 * a * c;
    const yI = -delta / (4 * a);

    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(xI), 0);
    ctx.lineTo(toCanvasX(xI), h);
    ctx.stroke();
    ctx.setLineDash([]);

    if (xI >= xMin && xI <= xMax && yI >= yMin && yI <= yMax) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(toCanvasX(xI), toCanvasY(yI), 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`I(${xI.toFixed(2)}; ${yI.toFixed(2)})`, toCanvasX(xI) + 8, toCanvasY(yI) - 8);
    }

    let rootDetails = '';
    if (delta > 0) {
      const r1 = (-b - Math.sqrt(delta)) / (2 * a);
      const r2 = (-b + Math.sqrt(delta)) / (2 * a);
      rootDetails = `Hai nghiệm: $x_1 = ${r1.toFixed(2)}$, $x_2 = ${r2.toFixed(2)}$.`;
    } else if (Math.abs(delta) < 0.001) {
      rootDetails = `Nghiệm kép: $x_0 = ${xI.toFixed(2)}$.`;
    } else {
      rootDetails = `Vô nghiệm thực ($\\Delta < 0$).`;
    }

    this.analysisBox.innerHTML = `
      <div class="analysis-pill info">
        <strong>Hàm số:</strong> $y = ${a.toFixed(1)}x^2 + (${b.toFixed(1)})x + (${c.toFixed(1)})$<br>
        <strong>Đỉnh Parabol:</strong> $I(${xI.toFixed(2)}; ${yI.toFixed(2)})$ • <strong>Trục đối xứng:</strong> $x = ${xI.toFixed(2)}$<br>
        <strong>Biệt thức:</strong> $\\Delta = ${delta.toFixed(2)}$ $\\implies$ ${rootDetails}
      </div>
    `;
    renderMathInTree(this.analysisBox);
  }
}

// === 8. LAB 2: MÔ HÌNH DỰ BÁO DOANH SỐ LAPTOP (BT 6.34) ===
class LaptopForecastLab {
  constructor() {
    this.canvas = document.getElementById('canvasLaptopModel');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.sliderYear = document.getElementById('sliderYear');
    this.valYear = document.getElementById('valYear');
    this.detailsCard = document.getElementById('laptopDetailsCard');

    this.bindEvents();
    this.draw();
  }

  bindEvents() {
    this.sliderYear.addEventListener('input', () => {
      const t = parseInt(this.sliderYear.value);
      this.valYear.textContent = `Năm ${2018 + t} (t = ${t})`;
      this.draw();
    });
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Range: t in [0, 12], S in [0, 120]
    const toX = t => 70 + (t / 12) * (w - 110);
    const toY = s => (h - 40) - (s / 120) * (h - 70);

    // Grid lines
    ctx.strokeStyle = '#26334d';
    ctx.lineWidth = 1;
    for (let t = 2; t <= 12; t += 2) {
      ctx.beginPath();
      ctx.moveTo(toX(t), 20);
      ctx.lineTo(toX(t), h - 40);
      ctx.stroke();
    }
    for (let s = 20; s <= 120; s += 20) {
      ctx.beginPath();
      ctx.moveTo(70, toY(s));
      ctx.lineTo(w - 40, toY(s));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(70, h - 40);
    ctx.lineTo(w - 30, h - 40);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(70, h - 40);
    ctx.lineTo(70, 20);
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    for (let t = 0; t <= 12; t += 2) {
      ctx.fillText(`'${(18 + t).toString()}`, toX(t) - 8, h - 22);
    }
    for (let s = 20; s <= 120; s += 20) {
      ctx.fillText(`${s}k`, 35, toY(s) + 4);
    }
    ctx.fillText('Năm', w - 24, h - 22);
    ctx.fillText('Doanh số (nghìn chiếc)', 20, 16);

    // Threshold line at 52k
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(70, toY(52));
    ctx.lineTo(w - 40, toY(52));
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#f87171';
    ctx.fillText('Ngưỡng 52 nghìn chiếc', toX(1) + 10, toY(52) - 8);

    // Growth Parabola: S(t) = 0.8 * t^2 + 3.2
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(3.2));
    for (let t = 0; t <= 12; t += 0.2) {
      const s = 0.8 * t * t + 3.2;
      ctx.lineTo(toX(t), toY(s));
    }
    ctx.stroke();

    // Active point based on slider
    const curT = parseInt(this.sliderYear.value);
    const curYear = 2018 + curT;
    const curS = 0.8 * curT * curT + 3.2;

    ctx.fillStyle = curS >= 52 ? '#f59e0b' : '#38bdf8';
    ctx.beginPath();
    ctx.arc(toX(curT), toY(curS), 7, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`${curYear}: ${curS.toFixed(1)}k chiếc`, toX(curT) + 10, toY(curS) - 10);

    // Analysis text
    const exceedNotice = curS >= 52 
      ? `<span style="color: #f59e0b;">⭐ ĐÃ VƯỢT NGƯỠNG 52 NGHÌN CHIẾC!</span>`
      : `<span style="color: #94a3b8;">Chưa đạt ngưỡng 52 nghìn chiếc.</span>`;

    this.detailsCard.innerHTML = `
      <h4>MÔ HÌNH HÓA BÀI TẬP 6.34: $S(t) = 0,8t^2 + 3,2$ (nghìn chiếc)</h4>
      <p>• Năm 2018 ($t = 0$): $S(0) = 3,2$ nghìn chiếc (đỉnh của mô hình).</p>
      <p>• Năm 2019 ($t = 1$): $S(1) = 4,0$ nghìn chiếc.</p>
      <p>• Năm 2024 ($t = 6$): $S(6) = 0,8(36) + 3,2 = 28,8 + 3,2 = 32,0$ nghìn chiếc.</p>
      <p>• Ngưỡng vượt $52$ nghìn chiếc: $t > \\sqrt{61} \\approx 7,81 \\implies t = 8$ (Năm 2026).</p>
      <div class="receipt-total">Năm ${curYear} (t = ${curT}): <strong>Sản lượng = ${curS.toFixed(1)} nghìn chiếc</strong> • ${exceedNotice}</div>
    `;
    renderMathInTree(this.detailsCard);
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
        '👑': 'Đại Kiện Tướng Chương VI',
        '🚀': 'Phi Hành Gia Vũ Trụ',
        '🧙‍♂️': 'Phù Thủy Chương VI',
        '🦁': 'Sư Tử Dũng Mãnh',
        '💎': 'Bậc Thầy Khảo Sát',
        '🦉': 'Cú Thông Thái',
        '🎯': 'Xạ Thủ Tổng Hợp',
        '🏅': 'Quán Quân Mô Hình'
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
  new ReviewExplorerLab();
  new LaptopForecastLab();
  updateHUD();

  unlockBadge(0, "Chiến Binh Chương VI");
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
