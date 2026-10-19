/**
 * BÀI 17: DẤU CỦA TAM THỨC BẬC HAI - TOÁN 10 KNTT
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
  userTitle: 'Chuyên Gia Xét Dấu & Bất Phương Trình',
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

// === 4. QUIZ DATA (10 MCQS BÁM SÁT BÀI 17 SGK) ===
const quizData = [
  {
    id: 1,
    title: "Bài tập 6.15a (SGK tr.24) - Xét dấu tam thức có 2 nghiệm",
    pts: 20,
    question: "Tam thức bậc hai $f(x) = 3x^2 - 4x + 1$ mang dấu âm ($f(x) < 0$) trên khoảng nào sau đây?",
    options: [
      { text: "$\\left(\\dfrac{1}{3}; 1\\right)$", correct: true },
      { text: "$\\left(-\\infty; \\dfrac{1}{3}\\right)$", correct: false },
      { text: "$(1; +\\infty)$", correct: false },
      { text: "$\\left(-\\infty; \\dfrac{1}{3}\\right) \\cup (1; +\\infty)$", correct: false }
    ],
    explanation: "Tam thức có $a = 3 > 0$. Biệt thức $\\Delta' = (-2)^2 - 3(1) = 1 > 0$.\nHai nghiệm phân biệt là $x_1 = \\dfrac{1}{3}$ và $x_2 = 1$.\nTheo quy tắc *\"Trong trái, ngoài cùng\"*:\n- Trong khoảng $\\left(\\dfrac{1}{3}; 1\\right)$, $f(x)$ **trái dấu** với hệ số $a$ (tức $f(x) < 0$).\n- Ngoài khoảng trên, $f(x)$ cùng dấu với $a$ (tức $f(x) > 0$)."
  },
  {
    id: 2,
    title: "Bài tập 6.15b (SGK tr.24) - Tam thức có nghiệm kép (Delta = 0)",
    pts: 20,
    question: "Khẳng định nào sau đây là đúng về dấu của tam thức $f(x) = x^2 + 2x + 1$?",
    options: [
      { text: "$f(x) > 0, \\forall x \\neq -1$ và $f(-1) = 0$", correct: true },
      { text: "$f(x) > 0, \\forall x \\in \\mathbb{R}$", correct: false },
      { text: "$f(x) < 0, \\forall x < -1$", correct: false },
      { text: "$f(x) \\le 0, \\forall x \\in \\mathbb{R}$", correct: false }
    ],
    explanation: "Ta có $f(x) = (x + 1)^2$. Tam thức có hệ số $a = 1 > 0$ và $\\Delta = 2^2 - 4(1)(1) = 0$.\nNghiệm kép là $x = -1$. Vì vậy $f(x) > 0$ với mọi $x \\neq -1$, và $f(x) = 0$ khi $x = -1$."
  },
  {
    id: 3,
    title: "Bài tập 6.15c (SGK tr.24) - Tam thức có hệ số a âm",
    pts: 20,
    question: "Tam thức bậc hai $f(x) = -x^2 + 3x - 2$ nhận giá trị dương ($f(x) > 0$) khi và chỉ khi:",
    options: [
      { text: "$x \\in (1; 2)$", correct: true },
      { text: "$x \\in (-\\infty; 1) \\cup (2; +\\infty)$", correct: false },
      { text: "$x \\in [1; 2]$", correct: false },
      { text: "$x \\in \\mathbb{R}$", correct: false }
    ],
    explanation: "Tam thức có $a = -1 < 0$. Hai nghiệm của $-x^2 + 3x - 2 = 0$ là $x_1 = 1$ và $x_2 = 2$.\nTheo quy tắc *\"Trong trái, ngoài cùng\"*:\nTrong khoảng hai nghiệm $(1; 2)$, $f(x)$ trái dấu với $a = -1$, do đó $f(x) > 0$ khi $x \\in (1; 2)$."
  },
  {
    id: 4,
    title: "Bài tập 6.15d (SGK tr.24) - Tam thức vô nghiệm (Delta < 0)",
    pts: 20,
    question: "Dấu của tam thức $f(x) = -x^2 + x - 1$ trên tập số thực $\\mathbb{R}$ là:",
    options: [
      { text: "$f(x) < 0$ với mọi $x \\in \\mathbb{R}$", correct: true },
      { text: "$f(x) > 0$ với mọi $x \\in \\mathbb{R}$", correct: false },
      { text: "$f(x) > 0$ khi $x > 0$ và $f(x) < 0$ khi $x < 0$", correct: false },
      { text: "$f(x) \\ge 0$ với mọi $x \\in \\mathbb{R}$", correct: false }
    ],
    explanation: "Tam thức có $a = -1 < 0$ và $\\Delta = 1^2 - 4(-1)(-1) = 1 - 4 = -3 < 0$.\nTheo định lý về dấu của tam thức bậc hai, khi $\\Delta < 0$ thì $f(x)$ luôn cùng dấu với hệ số $a$ trên toàn bộ $\\mathbb{R}$. Do $a = -1 < 0$ nên $f(x) < 0, \\forall x \\in \\mathbb{R}$."
  },
  {
    id: 5,
    title: "Bài tập 6.16a (SGK tr.24) - Giải bất phương trình bậc hai cơ bản",
    pts: 20,
    question: "Tập nghiệm của bất phương trình $x^2 - 1 \\ge 0$ là:",
    options: [
      { text: "$S = (-\\infty; -1] \\cup [1; +\\infty)$", correct: true },
      { text: "$S = [-1; 1]$", correct: false },
      { text: "$S = (-1; 1)$", correct: false },
      { text: "$S = [1; +\\infty)$", correct: false }
    ],
    explanation: "Tam thức $x^2 - 1$ có $a = 1 > 0$ và hai nghiệm $x = \\pm 1$.\nBất phương trình lấy dấu $\\ge 0$ (cùng dấu với $a$), do đó theo quy tắc *\"ngoài cùng\"*, tập nghiệm lấy ngoài đoạn hai nghiệm:\n$$S = (-\\infty; -1] \\cup [1; +\\infty)$$"
  },
  {
    id: 6,
    title: "Bài tập 6.16b (SGK tr.24) - Bất phương trình nghiệm căn",
    pts: 20,
    question: "Tập nghiệm của bất phương trình $x^2 - 2x - 1 < 0$ là:",
    options: [
      { text: "$S = (1 - \\sqrt{2}; 1 + \\sqrt{2})$", correct: true },
      { text: "$S = [1 - \\sqrt{2}; 1 + \\sqrt{2}]$", correct: false },
      { text: "$S = (-\\infty; 1 - \\sqrt{2}) \\cup (1 + \\sqrt{2}; +\\infty)$", correct: false },
      { text: "$S = (-1; 3)$", correct: false }
    ],
    explanation: "Tam thức $f(x) = x^2 - 2x - 1$ có $a = 1 > 0$ và $\\Delta' = (-1)^2 - 1(-1) = 2 > 0$.\nHai nghiệm là $x_1 = 1 - \\sqrt{2}$ và $x_2 = 1 + \\sqrt{2}$.\nBất phương trình yêu cầu $f(x) < 0$ (trái dấu với $a$), nên tập nghiệm là khoảng ở giữa hai nghiệm:\n$$S = (1 - \\sqrt{2}; 1 + \\sqrt{2})$$"
  },
  {
    id: 7,
    title: "Bài tập 6.16c (SGK tr.24) - Bất phương trình hệ số âm",
    pts: 20,
    question: "Tập nghiệm của bất phương trình $-3x^2 + 12x + 1 \\le 0$ là:",
    options: [
      { text: "$S = \\left(-\\infty; \\dfrac{6 - \\sqrt{39}}{3}\\right] \\cup \\left[\\dfrac{6 + \\sqrt{39}}{3}; +\\infty\\right)$", correct: true },
      { text: "$S = \\left[\\dfrac{6 - \\sqrt{39}}{3}; \\dfrac{6 + \\sqrt{39}}{3}\\right]$", correct: false },
      { text: "$S = (-\\infty; 0] \\cup [4; +\\infty)$", correct: false },
      { text: "$S = \\mathbb{R}$", correct: false }
    ],
    explanation: "Tam thức $-3x^2 + 12x + 1$ có $a = -3 < 0$, $\\Delta' = 6^2 - (-3)(1) = 39 > 0$.\nHai nghiệm là $x = \\dfrac{-6 \\pm \\sqrt{39}}{-3} = \\dfrac{6 \\mp \\sqrt{39}}{3}$.\nBất phương trình lấy dấu $\\le 0$ (cùng dấu với $a = -3$), nên theo quy tắc *\"ngoài cùng\"* (bao gồm cả mút vì có dấu bằng):\n$$S = \\left(-\\infty; \\dfrac{6 - \\sqrt{39}}{3}\\right] \\cup \\left[\\dfrac{6 + \\sqrt{39}}{3}; +\\infty\\right)$$"
  },
  {
    id: 8,
    title: "Bài tập 6.16d (SGK tr.24) - Bất phương trình luôn đúng",
    pts: 20,
    question: "Tập nghiệm của bất phương trình $5x^2 + x + 1 \\ge 0$ là:",
    options: [
      { text: "$S = \\mathbb{R}$", correct: true },
      { text: "$S = \\varnothing$", correct: false },
      { text: "$S = [0; +\\infty)$", correct: false },
      { text: "$S = \\mathbb{R} \\setminus \\{0\\}$", correct: false }
    ],
    explanation: "Tam thức $5x^2 + x + 1$ có $a = 5 > 0$ và biệt thức $\\Delta = 1^2 - 4(5)(1) = -19 < 0$.\nVì $\\Delta < 0$ và $a > 0$ nên $5x^2 + x + 1 > 0$ với mọi $x \\in \\mathbb{R}$.\nDo đó bất phương trình nghiệm đúng với mọi $x \\in \\mathbb{R}$, tập nghiệm $S = \\mathbb{R}$."
  },
  {
    id: 9,
    title: "Bài tập 6.17 (SGK tr.24) - Tìm m để tam thức luôn dương",
    pts: 20,
    question: "Tìm các giá trị của tham số $m$ để tam thức $f(x) = x^2 + (m + 1)x + 2m + 3 > 0$ với mọi $x \\in \\mathbb{R}$:",
    options: [
      { text: "$3 - 2\\sqrt{5} < m < 3 + 2\\sqrt{5}$", correct: true },
      { text: "$m < 3 - 2\\sqrt{5}$ hoặc $m > 3 + 2\\sqrt{5}$", correct: false },
      { text: "$-1 < m < 5$", correct: false },
      { text: "$m > 0$", correct: false }
    ],
    explanation: "Để $f(x) > 0, \\forall x \\in \\mathbb{R}$, điều kiện cần và đủ là:\n$$\\begin{cases} a > 0 \\\\ \\Delta < 0 \\end{cases} \\iff \\begin{cases} 1 > 0 \\text{ (luôn đúng)} \\\\ (m + 1)^2 - 4(1)(2m + 3) < 0 \\end{cases}$$\nKhai triển:\n$$m^2 + 2m + 1 - 8m - 12 < 0 \\iff m^2 - 6m - 11 < 0$$\nTam thức theo biến $m$ có 2 nghiệm $m = 3 \\pm \\sqrt{9 - (-11)} = 3 \\pm \\sqrt{20} = 3 \\pm 2\\sqrt{5}$.\nVì lấy dấu $< 0$ nên nghiệm nằm trong khoảng:\n$$3 - 2\\sqrt{5} < m < 3 + 2\\sqrt{5}$$"
  },
  {
    id: 10,
    title: "Bài tập 6.18 (SGK tr.24) - Bài toán vật rơi cách mặt đất không quá 100m",
    pts: 20,
    question: "Một vật ném thẳng đứng xuống từ độ cao $320\\text{ m}$ với vận tốc ban đầu $v_0 = 20\\text{ m/s}$. Độ cao sau $t$ giây là $h(t) = 320 - (20t + 5t^2)$. Sau ít nhất bao nhiêu giây thì vật cách mặt đất không quá $100\\text{ m}$?",
    options: [
      { text: "Khoảng $4,93$ giây ($-2 + 4\\sqrt{3}$ s)", correct: true },
      { text: "$4,00$ giây", correct: false },
      { text: "$5,50$ giây", correct: false },
      { text: "$6,25$ giây", correct: false }
    ],
    explanation: "Độ cao cách mặt đất không quá $100\\text{ m}$ tương đương với:\n$$h(t) \\le 100 \\iff 320 - 20t - 5t^2 \\le 100 \\iff 5t^2 + 20t - 220 \\ge 0 \\iff t^2 + 4t - 44 \\ge 0$$\nPhương trình $t^2 + 4t - 44 = 0$ có nghiệm dương:\n$$t = \\dfrac{-4 + \\sqrt{16 - 4(-44)}}{2} = -2 + \\sqrt{48} = -2 + 4\\sqrt{3} \\approx 4,93\\text{ (giây)}$$\nVì thời gian $t \\ge 0$, tập nghiệm là $t \\ge -2 + 4\\sqrt{3} \\approx 4,93\\text{ s}$. Vậy sau ít nhất khoảng $4,93$ giây."
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
  unlockBadge(0, "Chuyên Gia Xét Dấu");

  if (appState.answered[1] || appState.answered[3]) {
    unlockBadge(1, "Bậc Thầy Trong Trái Ngoài Cùng");
  }

  if (appState.answered[5] || appState.answered[6]) {
    unlockBadge(2, "Hộ Vệ Miền Nghiệm");
  }

  if (appState.xp >= 160) {
    unlockBadge(3, "Chiến Binh Bất Đẳng Thức");
  }

  if (appState.xp >= 200) {
    unlockBadge(4, "Đại Kiện Tướng Tam Thức");
    sfx.playFanfare();
  }
}

// === 7. LAB 1: MÁY QUÉT DẤU TAM THỨC BẬC HAI ===
class SignLab {
  constructor() {
    this.canvas = document.getElementById('canvasSignLab');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.sliderA = document.getElementById('sliderSignA');
    this.sliderB = document.getElementById('sliderSignB');
    this.sliderC = document.getElementById('sliderSignC');
    this.valA = document.getElementById('valSignA');
    this.valB = document.getElementById('valSignB');
    this.valC = document.getElementById('valSignC');
    this.analysisBox = document.getElementById('signAnalysisBox');

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
      if (window.numberLineLab) window.numberLineLab.draw(a, parseFloat(this.sliderB.value), parseFloat(this.sliderC.value));
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

    // Delta & Roots
    const delta = b * b - 4 * a * c;

    // Colored sign fill under curve
    for (let px = 0; px < w; px += 3) {
      const x = xMin + (px / w) * (xMax - xMin);
      const y = a * x * x + b * x + c;
      const cy = toCanvasY(y);
      const c0 = toCanvasY(0);

      ctx.fillStyle = y >= 0 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)';
      ctx.fillRect(px, Math.min(cy, c0), 3, Math.abs(cy - c0));
    }

    // Parabola curve
    ctx.strokeStyle = '#38bdf8';
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

    // Mark roots on Ox
    let rootsAnalysis = '';
    if (delta > 0) {
      const r1 = (-b - Math.sqrt(delta)) / (2 * a);
      const r2 = (-b + Math.sqrt(delta)) / (2 * a);
      const leftR = Math.min(r1, r2);
      const rightR = Math.max(r1, r2);

      // Dots
      [leftR, rightR].forEach((rx, idx) => {
        ctx.fillStyle = '#fbbf24';
        ctx.beginPath();
        ctx.arc(toCanvasX(rx), toCanvasY(0), 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillText(`x_${idx+1} = ${rx.toFixed(2)}`, toCanvasX(rx) - 20, toCanvasY(0) + 20);
      });

      const insideSign = a > 0 ? "ÂM (-)" : "DƯƠNG (+)";
      const outsideSign = a > 0 ? "DƯƠNG (+)" : "ÂM (-)";

      rootsAnalysis = `
        <strong>$\\Delta = ${delta.toFixed(2)} > 0$</strong>: Tam thức có 2 nghiệm phân biệt $x_1 = ${leftR.toFixed(2)}$, $x_2 = ${rightR.toFixed(2)}$.<br>
        • Khoảng trong $(x_1; x_2)$: $f(x)$ <strong>trái dấu</strong> với $a$ $\\implies$ mang dấu <strong>${insideSign}</strong>.<br>
        • Khoảng ngoài $(-\\infty; x_1) \\cup (x_2; +\\infty)$: $f(x)$ <strong>cùng dấu</strong> với $a$ $\\implies$ mang dấu <strong>${outsideSign}</strong>.
      `;
    } else if (Math.abs(delta) < 0.001) {
      const r0 = -b / (2 * a);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(toCanvasX(r0), toCanvasY(0), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`x₀ = ${r0.toFixed(2)}`, toCanvasX(r0) - 20, toCanvasY(0) + 20);

      const signText = a > 0 ? "DƯƠNG (+)" : "ÂM (-)";
      rootsAnalysis = `
        <strong>$\\Delta = 0$</strong>: Tam thức có nghiệm kép $x_0 = ${r0.toFixed(2)}$.<br>
        $f(x)$ luôn cùng dấu với $a$ (mang dấu <strong>${signText}</strong>) với mọi $x \\neq ${r0.toFixed(2)}$; tại $x_0$ thì $f(x) = 0$.
      `;
    } else {
      const signText = a > 0 ? "DƯƠNG (+)" : "ÂM (-)";
      rootsAnalysis = `
        <strong>$\\Delta = ${delta.toFixed(2)} < 0$</strong>: Tam thức không có nghiệm thực.<br>
        $f(x)$ luôn <strong>cùng dấu với $a$ (mang dấu ${signText})</strong> với mọi $x \\in \\mathbb{R}$. Đồ thị nằm hoàn toàn về một phía so với trục hoành.
      `;
    }

    this.analysisBox.innerHTML = `
      <div class="analysis-pill info">
        <strong>Tam thức:</strong> $f(x) = ${a.toFixed(1)}x^2 + (${b.toFixed(1)})x + (${c.toFixed(1)})$ (Hệ số $a = ${a.toFixed(1)}$)<br>
        ${rootsAnalysis}
      </div>
    `;
    renderMathInTree(this.analysisBox);
  }
}

// === 8. LAB 2: MÁY GIẢI & BIỂU DIỄN TRỤC SỐ BẤT PHƯƠNG TRÌNH ===
class NumberLineLab {
  constructor() {
    this.canvas = document.getElementById('canvasNumberLine');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.selectInequality = document.getElementById('selectInequality');
    this.solutionDetails = document.getElementById('solutionDetails');

    this.bindEvents();
    this.draw();
  }

  bindEvents() {
    this.selectInequality.addEventListener('change', () => {
      const a = parseFloat(document.getElementById('sliderSignA').value);
      const b = parseFloat(document.getElementById('sliderSignB').value);
      const c = parseFloat(document.getElementById('sliderSignC').value);
      this.draw(a, b, c);
    });
  }

  draw(curA, curB, curC) {
    if (curA === undefined) {
      curA = parseFloat(document.getElementById('sliderSignA').value) || 1;
      curB = parseFloat(document.getElementById('sliderSignB').value) || -3;
      curC = parseFloat(document.getElementById('sliderSignC').value) || 2;
    }
    if (Math.abs(curA) < 0.1) curA = curA >= 0 ? 0.5 : -0.5;

    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const delta = curB * curB - 4 * curA * curC;
    const ineqType = this.selectInequality.value; // 'gt', 'ge', 'lt', 'le'

    // Number line coordinate
    const xMin = -6, xMax = 6;
    const toCanvasX = x => 60 + ((x - xMin) / (xMax - xMin)) * (w - 120);
    const lineY = h / 2;

    // Draw main axis
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(40, lineY);
    ctx.lineTo(w - 40, lineY);
    ctx.stroke();

    // Arrow on axis
    ctx.fillStyle = '#94a3b8';
    ctx.beginPath();
    ctx.moveTo(w - 35, lineY);
    ctx.lineTo(w - 48, lineY - 6);
    ctx.lineTo(w - 48, lineY + 6);
    ctx.fill();

    let solutionStr = '';
    let intervalType = '';

    if (delta > 0) {
      const r1 = (-curB - Math.sqrt(delta)) / (2 * curA);
      const r2 = (-curB + Math.sqrt(delta)) / (2 * curA);
      const x1 = Math.min(r1, r2);
      const x2 = Math.max(r1, r2);

      const cx1 = toCanvasX(x1);
      const cx2 = toCanvasX(x2);

      // Determine valid regions
      // Inside: (x1, x2) has sign opposite to a
      // Outside: (-inf, x1) and (x2, +inf) have same sign as a
      const wantPositive = (ineqType === 'gt' || ineqType === 'ge');
      const includeEqual = (ineqType === 'ge' || ineqType === 'le');
      const insideSatisfies = (wantPositive && curA < 0) || (!wantPositive && curA > 0);

      // Draw hatched discard lines
      const hatch = (fromX, toX) => {
        ctx.strokeStyle = '#ef4444';
        ctx.lineWidth = 1.5;
        for (let x = fromX; x <= toX; x += 10) {
          ctx.beginPath();
          ctx.moveTo(x - 5, lineY - 15);
          ctx.lineTo(x + 5, lineY + 15);
          ctx.stroke();
        }
      };

      if (insideSatisfies) {
        // Solution is inside [x1, x2]
        hatch(40, cx1);
        hatch(cx2, w - 40);

        // Highlight valid segment
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(cx1, lineY);
        ctx.lineTo(cx2, lineY);
        ctx.stroke();

        const b1 = includeEqual ? '[' : '(';
        const b2 = includeEqual ? ']' : ')';
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillText(b1, cx1 - 6, lineY + 7);
        ctx.fillText(b2, cx2 - 6, lineY + 7);

        solutionStr = includeEqual 
          ? `S = [${x1.toFixed(2)}; ${x2.toFixed(2)}]`
          : `S = (${x1.toFixed(2)}; ${x2.toFixed(2)})`;
      } else {
        // Solution is outside
        hatch(cx1, cx2);

        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(40, lineY);
        ctx.lineTo(cx1, lineY);
        ctx.moveTo(cx2, lineY);
        ctx.lineTo(w - 40, lineY);
        ctx.stroke();

        const b1 = includeEqual ? ']' : ')';
        const b2 = includeEqual ? '[' : '(';
        ctx.fillStyle = '#10b981';
        ctx.font = 'bold 22px Inter, sans-serif';
        ctx.fillText(b1, cx1 - 6, lineY + 7);
        ctx.fillText(b2, cx2 - 6, lineY + 7);

        solutionStr = includeEqual
          ? `S = (-\\infty; ${x1.toFixed(2)}] \\cup [${x2.toFixed(2)}; +\\infty)`
          : `S = (-\\infty; ${x1.toFixed(2)}) \\cup (${x2.toFixed(2)}; +\\infty)`;
      }

      ctx.fillStyle = '#ffffff';
      ctx.font = '12px Inter, sans-serif';
      ctx.fillText(`x₁ = ${x1.toFixed(2)}`, cx1 - 20, lineY + 32);
      ctx.fillText(`x₂ = ${x2.toFixed(2)}`, cx2 - 20, lineY + 32);
    } else {
      // Delta <= 0 cases
      const sameSign = (ineqType === 'gt' || ineqType === 'ge') ? curA > 0 : curA < 0;
      if (sameSign) {
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 6;
        ctx.beginPath();
        ctx.moveTo(40, lineY);
        ctx.lineTo(w - 40, lineY);
        ctx.stroke();
        solutionStr = `S = \\mathbb{R} \\text{ (Toàn bộ trục số)}`;
      } else {
        // Discard whole line
        for (let x = 40; x <= w - 40; x += 10) {
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.moveTo(x - 5, lineY - 15);
          ctx.lineTo(x + 5, lineY + 15);
          ctx.stroke();
        }
        solutionStr = `S = \\varnothing \\text{ (Vô nghiệm)}`;
      }
    }

    this.solutionDetails.innerHTML = `
      <h4>KẾT QUẢ GIẢI BẤT PHƯƠNG TRÌNH</h4>
      <div class="receipt-total">Tập nghiệm: <strong>$$${solutionStr}$$</strong></div>
    `;
    renderMathInTree(this.solutionDetails);
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
        '👑': 'Đại Kiện Tướng Tam Thức',
        '🚀': 'Phi Hành Gia Vũ Trụ',
        '🧙‍♂️': 'Phù Thủy Tam Thức',
        '🦁': 'Sư Tử Dũng Mãnh',
        '💎': 'Bậc Thầy Bất Đẳng Thức',
        '🦉': 'Cú Thông Thái',
        '🎯': 'Xạ Thủ Xét Dấu',
        '🏅': 'Quán Quân Miền Nghiệm'
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
  new SignLab();
  window.numberLineLab = new NumberLineLab();
  updateHUD();

  unlockBadge(0, "Chuyên Gia Xét Dấu");
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
