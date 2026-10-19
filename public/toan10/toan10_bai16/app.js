/**
 * BÀI 16: HÀM SỐ BẬC HAI - TOÁN 10 KNTT
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
  userTitle: 'Chuyên Gia Khảo Sát Parabol',
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

// === 4. QUIZ DATA (10 MCQS BÁM SÁT BÀI 16 SGK) ===
const quizData = [
  {
    id: 1,
    title: "Bài tập 6.7a & 6.8 (SGK tr.17) - Tọa độ đỉnh parabol",
    pts: 20,
    question: "Tọa độ đỉnh $I$ và phương trình trục đối xứng của parabol $y = x^2 - 3x + 2$ là:",
    options: [
      { text: "$I(1,5; -0,25)$ và trục đối xứng $x = 1,5$", correct: true },
      { text: "$I(-1,5; 8,75)$ và trục đối xứng $x = -1,5$", correct: false },
      { text: "$I(3; 2)$ và trục đối xứng $x = 3$", correct: false },
      { text: "$I(1,5; 0,25)$ và trục đối xứng $y = 1,5$", correct: false }
    ],
    explanation: "Parabol $y = ax^2 + bx + c$ với $a = 1, b = -3, c = 2$:\n- Hoành độ đỉnh: $x_I = -\\dfrac{b}{2a} = -\\dfrac{-3}{2 \\times 1} = 1,5$.\n- Tung độ đỉnh: $y_I = (1,5)^2 - 3(1,5) + 2 = 2,25 - 4,5 + 2 = -0,25$.\n- Trục đối xứng là đường thẳng $x = -\\dfrac{b}{2a} = 1,5$."
  },
  {
    id: 2,
    title: "Bài tập 6.7b & 6.8 (SGK tr.17) - Khoảng đồng biến",
    pts: 20,
    question: "Khoảng đồng biến của hàm số bậc hai $y = -2x^2 + 2x + 3$ là:",
    options: [
      { text: "$(-\\infty; 0,5)$", correct: true },
      { text: "$(0,5; +\\infty)$", correct: false },
      { text: "$(-\\infty; -0,5)$", correct: false },
      { text: "$\\mathbb{R}$", correct: false }
    ],
    explanation: "Hàm số có $a = -2 < 0$, hoành độ đỉnh $x_I = -\\dfrac{b}{2a} = -\\dfrac{2}{2(-2)} = 0,5$.\nVì hệ số $a < 0$ nên bề lõm parabol quay xuống dưới, đỉnh $I$ là điểm cao nhất. Do đó hàm số **đồng biến** trên $(-\\infty; 0,5)$ và nghịch biến trên $(0,5; +\\infty)$."
  },
  {
    id: 3,
    title: "Bài tập 6.7c (SGK tr.17) - Giao điểm với trục hoành",
    pts: 20,
    question: "Số điểm chung của parabol $y = x^2 + 2x + 1$ với trục hoành $Ox$ là:",
    options: [
      { text: "1 điểm duy nhất (tiếp xúc)", correct: true },
      { text: "2 điểm phân biệt", correct: false },
      { text: "Không có điểm chung", correct: false },
      { text: "Vô số điểm", correct: false }
    ],
    explanation: "Phương trình hoành độ giao điểm với $Ox$:\n$$x^2 + 2x + 1 = 0 \\iff (x + 1)^2 = 0 \\iff x = -1$$\nBiệt thức $\\Delta = 2^2 - 4(1)(1) = 0$. Parabol tiếp xúc với trục hoành tại một điểm duy nhất là $(-1; 0)$."
  },
  {
    id: 4,
    title: "Bài tập 6.9a (SGK tr.17) - Xác định parabol qua 2 điểm",
    pts: 20,
    question: "Xác định parabol $y = ax^2 + bx + 1$ biết nó đi qua hai điểm $A(1; 0)$ và $B(2; 4)$:",
    options: [
      { text: "$y = 2,5x^2 - 3,5x + 1$", correct: true },
      { text: "$y = x^2 - 2x + 1$", correct: false },
      { text: "$y = 3x^2 - 4x + 1$", correct: false },
      { text: "$y = 2x^2 - 3x + 1$", correct: false }
    ],
    explanation: "Thay tọa độ 2 điểm vào phương trình $y = ax^2 + bx + 1$:\n- $A(1; 0) \\in (P) \\implies a(1)^2 + b(1) + 1 = 0 \\iff a + b = -1$.\n- $B(2; 4) \\in (P) \\implies a(2)^2 + b(2) + 1 = 4 \\iff 4a + 2b = 3$.\nGiải hệ phương trình:\n$$\\begin{cases} a + b = -1 \\\\ 4a + 2b = 3 \\end{cases} \\iff \\begin{cases} 2a + 2b = -2 \\\\ 4a + 2b = 3 \\end{cases} \\implies 2a = 5 \\implies a = 2,5 \\implies b = -3,5$$\nVậy phương trình parabol là $y = 2,5x^2 - 3,5x + 1$."
  },
  {
    id: 5,
    title: "Bài tập 6.9c (SGK tr.17) - Xác định parabol có đỉnh",
    pts: 20,
    question: "Xác định parabol $y = ax^2 + bx + 1$ biết nó có đỉnh là điểm $I(1; 2)$:",
    options: [
      { text: "$y = -x^2 + 2x + 1$", correct: true },
      { text: "$y = x^2 - 2x + 1$", correct: false },
      { text: "$y = -2x^2 + 4x + 1$", correct: false },
      { text: "$y = -x^2 + x + 1$", correct: false }
    ],
    explanation: "Parabol có đỉnh $I(1; 2)$:\n- Hoành độ đỉnh: $x_I = -\\dfrac{b}{2a} = 1 \\implies b = -2a$.\n- Đỉnh $I(1; 2)$ thuộc parabol: $a(1)^2 + b(1) + 1 = 2 \\iff a + b = 1$.\nThay $b = -2a$ vào: $a - 2a = 1 \\iff -a = 1 \\implies a = -1 \\implies b = 2$.\nVậy parabol là $y = -x^2 + 2x + 1$."
  },
  {
    id: 6,
    title: "Bài tập 6.10 (SGK tr.17) - Viết phương trình parabol từ đỉnh",
    pts: 20,
    question: "Xác định parabol $y = ax^2 + bx + c$, biết parabol đi qua điểm $A(8; 0)$ và có đỉnh $I(6; -12)$:",
    options: [
      { text: "$y = 3x^2 - 36x + 96$", correct: true },
      { text: "$y = 2x^2 - 24x + 64$", correct: false },
      { text: "$y = 3x^2 - 12x - 12$", correct: false },
      { text: "$y = x^2 - 12x + 32$", correct: false }
    ],
    explanation: "Dạng đỉnh của parabol có tọa độ đỉnh $I(h; k) = I(6; -12)$ là:\n$$y = a(x - 6)^2 - 12$$\nParabol đi qua $A(8; 0)$:\n$$0 = a(8 - 6)^2 - 12 \\iff 4a - 12 = 0 \\iff a = 3$$\nKhai triển:\n$$y = 3(x^2 - 12x + 36) - 12 = 3x^2 - 36x + 108 - 12 = 3x^2 - 36x + 96$$"
  },
  {
    id: 7,
    title: "Bài tập 6.11 (SGK tr.17) - Dấu của hệ số a và biệt thức Delta",
    pts: 20,
    question: "Gọi $(P)$ là đồ thị hàm số $y = ax^2 + bx + c$. Nếu $(P)$ nằm hoàn toàn phía trên trục hoành thì:",
    options: [
      { text: "$a > 0$ và $\\Delta < 0$", correct: true },
      { text: "$a > 0$ và $\\Delta > 0$", correct: false },
      { text: "$a < 0$ và $\\Delta < 0$", correct: false },
      { text: "$a > 0$ và $\\Delta = 0$", correct: false }
    ],
    explanation: "Đồ thị $(P)$ nằm hoàn toàn phía trên trục hoành nghĩa là $y = ax^2 + bx + c > 0$ với mọi $x \\in \\mathbb{R}$.\nĐiều này tương đương với:\n1. Bề lõm phải quay lên trên: $a > 0$.\n2. Parabol không cắt và không tiếp xúc với trục hoành (phương trình vô nghiệm): $\\Delta < 0$."
  },
  {
    id: 8,
    title: "Bài tập 6.13 (SGK tr.17) - Bài toán rào vườn diện tích cực đại",
    pts: 20,
    question: "Bác Hùng dùng $40\\text{ m}$ lưới thép gai rào một mảnh vườn hình chữ nhật để diện tích rào được lớn nhất. Kích thước (dài, rộng) và diện tích lớn nhất đó là:",
    options: [
      { text: "Hình vuông $10\\text{ m} \\times 10\\text{ m}$, diện tích cực đại $100\\text{ m}^2$", correct: true },
      { text: "$15\\text{ m} \\times 5\\text{ m}$, diện tích $75\\text{ m}^2$", correct: false },
      { text: "$12\\text{ m} \\times 8\\text{ m}$, diện tích $96\\text{ m}^2$", correct: false },
      { text: "$20\\text{ m} \\times 10\\text{ m}$, diện tích $200\\text{ m}^2$", correct: false }
    ],
    explanation: "Gọi chiều rộng mảnh vườn là $x$ ($0 < x < 20\\text{ m}$). Nửa chu vi là $20\\text{ m}$, chiều dài là $20 - x$.\nDiện tích mảnh vườn là hàm số bậc hai:\n$$S(x) = x(20 - x) = -x^2 + 20x$$\nHàm số có $a = -1 < 0$ nên đạt giá trị lớn nhất tại đỉnh:\n$$x = -\\dfrac{b}{2a} = -\\dfrac{20}{2(-1)} = 10\\text{ (m)}$$\nKhi đó chiều dài là $20 - 10 = 10\\text{ m}$. Diện tích lớn nhất là $S_{\\max} = 10 \\times 10 = 100\\text{ m}^2$."
  },
  {
    id: 9,
    title: "Bài tập 6.14a (SGK tr.17) - Độ cao cực đại của vật ném",
    pts: 20,
    question: "Quỹ đạo của một vật ném lên từ gốc $O$ là parabol $y = -\\dfrac{3}{1000}x^2 + x$ ($x, y$ tính bằng mét). Độ cao lớn nhất của vật trong quá trình bay là:",
    options: [
      { text: "$\\dfrac{250}{3}\\text{ m} \\approx 83,33\\text{ m}$", correct: true },
      { text: "$100\\text{ m}$", correct: false },
      { text: "$166,67\\text{ m}$", correct: false },
      { text: "$\\dfrac{500}{3}\\text{ m} \\approx 166,67\\text{ m}$", correct: false }
    ],
    explanation: "Hàm số quỹ đạo có $a = -0,003, b = 1, c = 0$.\nHoành độ đỉnh parabol:\n$$x_I = -\\dfrac{b}{2a} = -\\dfrac{1}{2 \\times (-0,003)} = \\dfrac{1000}{6} = \\dfrac{500}{3}\\text{ (m)}$$\nĐộ cao lớn nhất chính là tung độ đỉnh:\n$$y_{\\max} = -\\dfrac{3}{1000}\\left(\\dfrac{500}{3}\\right)^2 + \\dfrac{500}{3} = -\\dfrac{3}{1000} \\times \\dfrac{250000}{9} + \\dfrac{500}{3} = -\\dfrac{250}{3} + \\dfrac{500}{3} = \\dfrac{250}{3} \\approx 83,33\\text{ (m)}$$"
  },
  {
    id: 10,
    title: "Bài tập 6.14b (SGK tr.17) - Tầm xa của quỹ đạo vật ném",
    pts: 20,
    question: "Tầm xa của vật ném nói trên (khoảng cách từ gốc ném $O$ đến điểm chạm đất) là:",
    options: [
      { text: "$\\dfrac{1000}{3}\\text{ m} \\approx 333,33\\text{ m}$", correct: true },
      { text: "$500\\text{ m}$", correct: false },
      { text: "$250\\text{ m}$", correct: false },
      { text: "$166,67\\text{ m}$", correct: false }
    ],
    explanation: "Khi vật chạm đất thì độ cao $y = 0$:\n$$-\\dfrac{3}{1000}x^2 + x = 0 \\iff x\\left(-\\dfrac{3}{1000}x + 1\\right) = 0$$\nNghiệm $x = 0$ là vị trí ném ban đầu. Nghiệm chạm đất là:\n$$-\\dfrac{3}{1000}x + 1 = 0 \\iff x = \\dfrac{1000}{3} \\approx 333,33\\text{ (m)}$$\nVậy tầm xa của quỹ đạo là $\\dfrac{1000}{3}\\text{ m} \\approx 333,33\\text{ m}$."
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
  unlockBadge(0, "Kiến Trúc Sư Parabol");

  if (appState.answered[1] || appState.answered[5]) {
    unlockBadge(1, "Thợ Săn Tọa Độ Đỉnh");
  }

  if (appState.answered[9] || appState.answered[10]) {
    unlockBadge(2, "Xạ Thủ Quỹ Đạo");
  }

  if (appState.xp >= 160) {
    unlockBadge(3, "Chiến Binh Bậc Hai");
  }

  if (appState.xp >= 200) {
    unlockBadge(4, "Đại Kiện Tướng Parabol");
    sfx.playFanfare();
  }
}

// === 7. LAB 1: PHÒNG THÍ NGHIỆM PARABOL ĐỘNG ===
class ParabolaLab {
  constructor() {
    this.canvas = document.getElementById('canvasParabola');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.sliderA = document.getElementById('sliderA');
    this.sliderB = document.getElementById('sliderB');
    this.sliderC = document.getElementById('sliderC');
    this.valA = document.getElementById('valA');
    this.valB = document.getElementById('valB');
    this.valC = document.getElementById('valC');
    this.analysisBox = document.getElementById('parabolaAnalysis');

    this.bindEvents();
    this.draw();
  }

  bindEvents() {
    const update = () => {
      let a = parseFloat(this.sliderA.value);
      if (Math.abs(a) < 0.1) a = a >= 0 ? 0.2 : -0.2; // Keep a != 0
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
    if (Math.abs(a) < 0.1) a = a >= 0 ? 0.2 : -0.2;
    const b = parseFloat(this.sliderB.value);
    const c = parseFloat(this.sliderC.value);

    // Coordinate system: x in [-6, 6], y in [-6, 6]
    const xMin = -6, xMax = 6, yMin = -6, yMax = 6;
    const toCanvasX = x => ((x - xMin) / (xMax - xMin)) * w;
    const toCanvasY = y => h - ((y - yMin) / (yMax - yMin)) * h;

    // Grid lines
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

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('O', toCanvasX(0) - 14, toCanvasY(0) + 16);
    ctx.fillText('x', w - 16, toCanvasY(0) - 8);
    ctx.fillText('y', toCanvasX(0) + 8, 16);

    // Parabola curve
    ctx.strokeStyle = a > 0 ? '#10b981' : '#f59e0b';
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

    // Vertex I
    const xI = -b / (2 * a);
    const delta = b * b - 4 * a * c;
    const yI = -delta / (4 * a);

    // Axis of symmetry line
    ctx.setLineDash([5, 5]);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(xI), 0);
    ctx.lineTo(toCanvasX(xI), h);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vertex dot
    if (xI >= xMin && xI <= xMax && yI >= yMin && yI <= yMax) {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(toCanvasX(xI), toCanvasY(yI), 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`I(${xI.toFixed(2)}; ${yI.toFixed(2)})`, toCanvasX(xI) + 8, toCanvasY(yI) - 8);
    }

    // Y-intercept C(0; c)
    if (c >= yMin && c <= yMax) {
      ctx.fillStyle = '#a855f7';
      ctx.beginPath();
      ctx.arc(toCanvasX(0), toCanvasY(c), 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillText(`C(0; ${c.toFixed(1)})`, toCanvasX(0) + 8, toCanvasY(c) + 14);
    }

    // Update dynamic analysis box
    const shapeText = a > 0 ? "Bề lõm quay lên trên (a > 0) ↗️" : "Bề lõm quay xuống dưới (a < 0) ↘️";
    const extremumText = a > 0 
      ? `Giá trị nhỏ nhất $y_{\\min} = ${yI.toFixed(2)}$ tại $x = ${xI.toFixed(2)}$`
      : `Giá trị lớn nhất $y_{\\max} = ${yI.toFixed(2)}$ tại $x = ${xI.toFixed(2)}$`;

    let rootText = '';
    if (delta > 0) {
      const r1 = (-b - Math.sqrt(delta)) / (2 * a);
      const r2 = (-b + Math.sqrt(delta)) / (2 * a);
      rootText = `Cắt trục hoành tại 2 điểm: $x_1 = ${r1.toFixed(2)}$, $x_2 = ${r2.toFixed(2)}$`;
    } else if (Math.abs(delta) < 0.001) {
      rootText = `Tiếp xúc trục hoành tại 1 điểm: $x = ${xI.toFixed(2)}$`;
    } else {
      rootText = `Không cắt trục hoành ($\\Delta = ${delta.toFixed(2)} < 0$)`;
    }

    this.analysisBox.innerHTML = `
      <div class="analysis-pill info">
        <strong>Phương trình:</strong> $y = ${a.toFixed(1)}x^2 + (${b.toFixed(1)})x + (${c.toFixed(1)})$<br>
        <strong>Đỉnh Parabol:</strong> $I(${xI.toFixed(2)}; ${yI.toFixed(2)})$ • <strong>Trục đối xứng:</strong> $x = ${xI.toFixed(2)}$<br>
        <strong>Đặc tính:</strong> ${shapeText} • ${extremumText}<br>
        <strong>Giao điểm $Ox$:</strong> ${rootText}
      </div>
    `;
    renderMathInTree(this.analysisBox);
  }
}

// === 8. LAB 2: MÔ PHỎNG QUỸ ĐẠO NÉM VẬT & CỔNG PARABOL ===
class SimulationLab {
  constructor() {
    this.canvas = document.getElementById('canvasSim2');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.selectMode = document.getElementById('selectMode');
    this.sliderLaunch = document.getElementById('sliderLaunch');
    this.valLaunch = document.getElementById('valLaunch');
    this.detailsCard = document.getElementById('sim2Details');

    this.bindEvents();
    this.draw();
  }

  bindEvents() {
    this.selectMode.addEventListener('change', () => {
      this.draw();
    });

    this.sliderLaunch.addEventListener('input', () => {
      this.valLaunch.textContent = `${parseFloat(this.sliderLaunch.value).toFixed(1)} m`;
      this.draw();
    });
  }

  draw() {
    const mode = this.selectMode.value;
    if (mode === 'projectile') {
      this.drawProjectile();
    } else {
      this.drawGate();
    }
  }

  drawProjectile() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Range x in [0, 350], y in [0, 100]
    const toX = x => 60 + (x / 350) * (w - 90);
    const toY = y => (h - 40) - (y / 100) * (h - 70);

    // Ground line
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(50, h - 40);
    ctx.lineTo(w - 20, h - 40);
    ctx.stroke();

    // Axes
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('0 (Gốc O)', 40, h - 25);
    ctx.fillText('100m', toX(100) - 15, h - 25);
    ctx.fillText('200m', toX(200) - 15, h - 25);
    ctx.fillText('333.3m (Chạm đất)', toX(333.3) - 30, h - 25);
    ctx.fillText('Cao độ y (m)', 10, 25);

    // Flight Parabola: y = -0.003 x^2 + x
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(toX(0), toY(0));
    for (let x = 0; x <= 333.33; x += 3) {
      const y = -0.003 * x * x + x;
      ctx.lineTo(toX(x), toY(y));
    }
    ctx.stroke();

    // Apex (Peak) at x = 500/3 = 166.67, y = 83.33
    const apexX = 500 / 3;
    const apexY = 250 / 3;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(toX(apexX), toY(apexY), 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`Đỉnh H_max = 83.33m`, toX(apexX) - 50, toY(apexY) - 12);

    // Current projectile slider point
    const curX = parseFloat(this.sliderLaunch.value);
    const curY = Math.max(0, -0.003 * curX * curX + curX);

    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(toX(curX), toY(curY), 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`🚀 x = ${curX.toFixed(1)}m, y = ${curY.toFixed(1)}m`, toX(curX) + 10, toY(curY) - 10);

    this.detailsCard.innerHTML = `
      <h4>MÔ PHỎNG QUỸ ĐẠO BÀI TẬP 6.14: $y = -\\dfrac{3}{1000}x^2 + x$</h4>
      <p>1. <strong>Độ cao lớn nhất:</strong> Đỉnh tại hoành độ $x = \\dfrac{500}{3} \\approx 166,67\\text{ m}$, đạt đỉnh $H_{\\max} = \\dfrac{250}{3} \\approx 83,33\\text{ m}$.</p>
      <p>2. <strong>Tầm xa chạm đất:</strong> Tại $y = 0 \\implies L = \\dfrac{1000}{3} \\approx 333,33\\text{ m}$.</p>
      <div class="receipt-total">Tọa độ vật hiện tại: <strong>x = ${curX.toFixed(1)} m • y = ${curY.toFixed(1)} m</strong></div>
    `;
    renderMathInTree(this.detailsCard);
  }

  drawGate() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Gate Arch: width 8m (-4m to +4m), height 12m or measured
    // BT 6.12: cổng rộng 8m. Điểm cách chân cổng 0.5m cao 2.93m.
    // Đặt gốc O tại giữa 2 chân cổng: 2 chân tại x = -4 và x = 4.
    // Điểm cách chân cổng 0.5m có x = 4 - 0.5 = 3.5m, y = 2.93m.
    // Parabol đối xứng: y = -a x^2 + h_0. Chân cổng: y(4) = 0 => h_0 = 16a => y = a(16 - x^2).
    // Tại x = 3.5: y(3.5) = a(16 - 12.25) = 3.75a = 2.93 => a = 2.93 / 3.75 ≈ 0.7813.
    // Chiều cao đỉnh cổng: h_0 = 16a = 16 * 0.7813 ≈ 12.5 m (An nói 12m là gần đúng!).
    const a = 2.93 / 3.75;
    const h0 = 16 * a;

    const toX = x => w / 2 + (x / 6) * (w / 2 - 40);
    const toY = y => (h - 40) - (y / 15) * (h - 70);

    // Ground
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, h - 40);
    ctx.lineTo(w - 40, h - 40);
    ctx.stroke();

    // Arch Parabola
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(toX(-4), toY(0));
    for (let x = -4; x <= 4; x += 0.1) {
      const y = a * (16 - x * x);
      ctx.lineTo(toX(x), toY(y));
    }
    ctx.stroke();

    // Arch Peak
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(toX(0), toY(h0), 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`Đỉnh vòm cổng: h = ${h0.toFixed(2)} m`, toX(0) - 70, toY(h0) - 12);

    // 2 legs
    ctx.fillText('Chân A (-4m)', toX(-4) - 30, h - 22);
    ctx.fillText('Chân B (+4m)', toX(4) - 30, h - 22);

    // Measured point at 3.5m
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(toX(3.5), toY(2.93), 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`Điểm đo: x = 3.5m, y = 2.93m`, toX(3.5) - 100, toY(2.93) - 10);

    this.detailsCard.innerHTML = `
      <h4>MÔ PHỎNG CỔNG PARABOL ĐẠI HỌC BÁCH KHOA HÀ NỘI (BT 6.12)</h4>
      <p>1. Chọn hệ trục toạ độ với gốc $O$ là trung điểm 2 chân cổng: hai chân cổng tại $x = -4\\text{ m}$ và $x = 4\\text{ m}$.</p>
      <p>2. Phương trình parabol có dạng: $y = a(16 - x^2)$.</p>
      <p>3. Điểm cách chân cổng $0,5\\text{ m}$ có hoành độ $x = 3,5\\text{ m}$, tung độ $y = 2,93\\text{ m}$. Ta có: $a(16 - 3,5^2) = 2,93 \\implies a \\approx 0,7813$.</p>
      <div class="receipt-total">Chiều cao đỉnh cổng thực tế: <strong>h = 16a ≈ 12,50 mét</strong> (Bạn An tính 12m là ước lượng chưa hoàn toàn chính xác).</div>
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
        '👑': 'Đại Kiện Tướng Parabol',
        '🚀': 'Phi Hành Gia Vũ Trụ',
        '🧙‍♂️': 'Phù Thủy Parabol',
        '🦁': 'Sư Tử Dũng Mãnh',
        '💎': 'Bậc Thầy Cực Trị',
        '🦉': 'Cú Thông Thái',
        '🎯': 'Xạ Thủ Tọa Độ Đỉnh',
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
  new ParabolaLab();
  new SimulationLab();
  updateHUD();

  unlockBadge(0, "Kiến Trúc Sư Parabol");
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
