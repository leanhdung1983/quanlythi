/**
 * BÀI 18: PHƯƠNG TRÌNH QUY VỀ BẬC HAI - TOÁN 10 KNTT
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
  userTitle: 'Chuyên Gia Giải Phương Trình Căn Thức',
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

// === 4. QUIZ DATA (10 MCQS BÁM SÁT BÀI 18 SGK) ===
const quizData = [
  {
    id: 1,
    title: "Bài tập 6.20a (SGK tr.27) - Phương trình căn bằng căn",
    pts: 20,
    question: "Tập nghiệm của phương trình $\\sqrt{3x^2 - 4x - 1} = \\sqrt{2x^2 - 4x + 3}$ là:",
    options: [
      { text: "$S = \\{-2; 2\\}$", correct: true },
      { text: "$S = \\{2\\}$", correct: false },
      { text: "$S = \\{-2\\}$", correct: false },
      { text: "$S = \\varnothing$", correct: false }
    ],
    explanation: "Bình phương hai vế:\n$$3x^2 - 4x - 1 = 2x^2 - 4x + 3 \\iff x^2 = 4 \\iff x = \\pm 2$$\nThử lại vào phương trình ban đầu:\n- Với $x = 2$: $\\sqrt{3(4) - 8 - 1} = \\sqrt{3} = \\sqrt{2(4) - 8 + 3}$ (thỏa mãn).\n- Với $x = -2$: $\\sqrt{3(4) + 8 - 1} = \\sqrt{19} = \\sqrt{2(4) + 8 + 3}$ (thỏa mãn).\nVậy tập nghiệm là $S = \\{-2; 2\\}$."
  },
  {
    id: 2,
    title: "Bài tập 6.20b (SGK tr.27) - Phát hiện nghiệm ngoại lai",
    pts: 20,
    question: "Tập nghiệm của phương trình $\\sqrt{x^2 + 2x - 3} = \\sqrt{-2x^2 + 5}$ là:",
    options: [
      { text: "$S = \\left\\{\\dfrac{4}{3}\\right\\}$", correct: true },
      { text: "$S = \\left\\{-2; \\dfrac{4}{3}\\right\\}$", correct: false },
      { text: "$S = \\{-2\\}$", correct: false },
      { text: "$S = \\varnothing$", correct: false }
    ],
    explanation: "Bình phương hai vế:\n$$x^2 + 2x - 3 = -2x^2 + 5 \\iff 3x^2 + 2x - 8 = 0 \\iff (x + 2)(3x - 4) = 0$$\nTa tìm được $x = -2$ hoặc $x = \\dfrac{4}{3}$.\nThử lại:\n- Với $x = -2$: biểu thức dưới căn vế trái là $(-2)^2 + 2(-2) - 3 = -3 < 0$ (loại vì không xác định).\n- Với $x = \\dfrac{4}{3}$: cả hai vế bằng $\\sqrt{\\dfrac{13}{9}} = \\dfrac{\\sqrt{13}}{3}$ (thỏa mãn).\nVậy tập nghiệm $S = \\left\\{\\dfrac{4}{3}\\right\\}$."
  },
  {
    id: 3,
    title: "Bài tập 6.20c (SGK tr.27) - Phương trình vô nghiệm sau khi thử lại",
    pts: 20,
    question: "Số nghiệm của phương trình $\\sqrt{2x^2 + 3x - 3} = \\sqrt{-x^2 - x + 1}$ là:",
    options: [
      { text: "0 nghiệm (Phương trình vô nghiệm)", correct: true },
      { text: "1 nghiệm", correct: false },
      { text: "2 nghiệm", correct: false },
      { text: "Vô số nghiệm", correct: false }
    ],
    explanation: "Bình phương hai vế:\n$$2x^2 + 3x - 3 = -x^2 - x + 1 \\iff 3x^2 + 4x - 4 = 0 \\iff (x + 2)(3x - 2) = 0$$\nTa được $x = -2$ hoặc $x = \\dfrac{2}{3}$.\nThử lại:\n- Với $x = -2$: vế trái $\\sqrt{2(4) - 6 - 3} = \\sqrt{-1}$ (không xác định, loại).\n- Với $x = \\dfrac{2}{3}$: vế trái $\\sqrt{2\\left(\\dfrac{4}{9}\\right) + 2 - 3} = \\sqrt{-\\dfrac{1}{9}}$ (không xác định, loại).\nCả hai giá trị đều là nghiệm ngoại lai, do đó phương trình vô nghiệm (0 nghiệm)."
  },
  {
    id: 4,
    title: "Bài tập 6.20d (SGK tr.27) - Giải phương trình căn bằng căn",
    pts: 20,
    question: "Nghiệm của phương trình $\\sqrt{-x^2 + 5x - 4} = \\sqrt{-2x^2 + 4x + 2}$ là:",
    options: [
      { text: "$x = 2$", correct: true },
      { text: "$x = -3$", correct: false },
      { text: "$x = 2$ và $x = -3$", correct: false },
      { text: "Phương trình vô nghiệm", correct: false }
    ],
    explanation: "Bình phương hai vế:\n$$-x^2 + 5x - 4 = -2x^2 + 4x + 2 \\iff x^2 + x - 6 = 0 \\iff x = 2 \\text{ hoặc } x = -3$$\nThử lại:\n- Với $x = 2$: $\\sqrt{-4 + 10 - 4} = \\sqrt{2} = \\sqrt{-8 + 8 + 2}$ (thỏa mãn).\n- Với $x = -3$: $-(-3)^2 + 5(-3) - 4 = -9 - 15 - 4 = -28 < 0$ (loại).\nVậy nghiệm duy nhất là $x = 2$."
  },
  {
    id: 5,
    title: "Bài tập 6.21a (SGK tr.27) - Dạng căn bằng nhị thức",
    pts: 20,
    question: "Tập nghiệm của phương trình $\\sqrt{6x^2 + 13x + 13} = 2x + 4$ là:",
    options: [
      { text: "$S = \\left\\{\\dfrac{3 - \\sqrt{33}}{4}; \\dfrac{3 + \\sqrt{33}}{4}\\right\\}$", correct: true },
      { text: "$S = \\left\\{\\dfrac{3 + \\sqrt{33}}{4}\\right\\}$", correct: false },
      { text: "$S = \\left\\{\\dfrac{3 - \\sqrt{33}}{4}\\right\\}$", correct: false },
      { text: "$S = \\varnothing$", correct: false }
    ],
    explanation: "Điều kiện xác định vế phải: $2x + 4 \\ge 0 \\iff x \\ge -2$.\nBình phương hai vế:\n$$6x^2 + 13x + 13 = (2x + 4)^2 = 4x^2 + 16x + 16 \\iff 2x^2 - 3x - 3 = 0$$\nNghiệm: $x = \\dfrac{3 \\pm \\sqrt{33}}{4}$.\nVì $\\sqrt{33} \\approx 5,74$ nên:\n- $x_1 = \\dfrac{3 + 5,74}{4} \\approx 2,19 \\ge -2$ (thỏa mãn).\n- $x_2 = \\dfrac{3 - 5,74}{4} \\approx -0,69 \\ge -2$ (thỏa mãn).\nCả hai nghiệm đều thỏa mãn điều kiện $x \\ge -2$."
  },
  {
    id: 6,
    title: "Bài tập 6.21b (SGK tr.27) - Loại nghiệm qua điều kiện vế phải",
    pts: 20,
    question: "Tập nghiệm của phương trình $\\sqrt{2x^2 + 5x + 3} = -3 - x$ là:",
    options: [
      { text: "$S = \\varnothing$", correct: true },
      { text: "$S = \\{-2; 3\\}$", correct: false },
      { text: "$S = \\{-2\\}$", correct: false },
      { text: "$S = \\{3\\}$", correct: false }
    ],
    explanation: "Điều kiện vế phải không âm: $-3 - x \\ge 0 \\iff x \\le -3$.\nBình phương hai vế:\n$$2x^2 + 5x + 3 = (x + 3)^2 = x^2 + 6x + 9 \\iff x^2 - x - 6 = 0 \\iff x = 3 \\text{ hoặc } x = -2$$\nĐối chiếu điều kiện $x \\le -3$:\n- $x = 3 > -3$ (loại).\n- $x = -2 > -3$ (loại).\nVậy phương trình vô nghiệm, $S = \\varnothing$."
  },
  {
    id: 7,
    title: "Bài tập 6.21c (SGK tr.27) - Giải phương trình dạng căn bằng nhị thức",
    pts: 20,
    question: "Nghiệm của phương trình $\\sqrt{3x^2 - 17x + 23} = x - 3$ là:",
    options: [
      { text: "$x = 3,5$ (tức $x = \\dfrac{7}{2}$)", correct: true },
      { text: "$x = 2$", correct: false },
      { text: "$x = 2$ và $x = 3,5$", correct: false },
      { text: "Phương trình vô nghiệm", correct: false }
    ],
    explanation: "Điều kiện: $x - 3 \\ge 0 \\iff x \\ge 3$.\nBình phương hai vế:\n$$3x^2 - 17x + 23 = (x - 3)^2 = x^2 - 6x + 9 \\iff 2x^2 - 11x + 14 = 0$$\nPhân tích thành nhân tử: $(x - 2)(2x - 7) = 0 \\iff x = 2$ hoặc $x = 3,5$.\nĐối chiếu với điều kiện $x \\ge 3$, ta loại $x = 2$ và nhận $x = 3,5$."
  },
  {
    id: 8,
    title: "Bài tập 6.21d (SGK tr.27) - Loại nghiệm bằng 0",
    pts: 20,
    question: "Tập nghiệm của phương trình $\\sqrt{-x^2 + 2x + 4} = x - 2$ là:",
    options: [
      { text: "$S = \\{3\\}$", correct: true },
      { text: "$S = \\{0; 3\\}$", correct: false },
      { text: "$S = \\{0\\}$", correct: false },
      { text: "$S = \\varnothing$", correct: false }
    ],
    explanation: "Điều kiện: $x - 2 \\ge 0 \\iff x \\ge 2$.\nBình phương hai vế:\n$$-x^2 + 2x + 4 = x^2 - 4x + 4 \\iff 2x^2 - 6x = 0 \\iff 2x(x - 3) = 0 \\iff x = 0 \\text{ hoặc } x = 3$$\nVì điều kiện $x \\ge 2$, ta loại $x = 0$ (với $x = 0$ thì vế phải bằng $-2 < 0$) và nhận $x = 3$.\nVậy $S = \\{3\\}$."
  },
  {
    id: 9,
    title: "Bài tập 6.22 (SGK tr.27) - Thiết lập phương trình hình học",
    pts: 20,
    question: "Tứ giác $ABCD$ có $AB \\perp CD$, $AB = 2, BC = 13, CD = 8, DA = 5$. Gọi $H$ là giao điểm của $AB$ và $CD$, đặt $x = AH$. Độ dài $x = AH$ là:",
    options: [
      { text: "$x = 3$", correct: true },
      { text: "$x = 4$", correct: false },
      { text: "$x = 2,5$", correct: false },
      { text: "$x = 5$", correct: false }
    ],
    explanation: "Trong các tam giác vuông tại $H$:\n- $HD = \\sqrt{AD^2 - AH^2} = \\sqrt{25 - x^2}$.\n- $HB = HA + AB = x + 2$.\n- $HC = HD + CD = \\sqrt{25 - x^2} + 8$.\nÁp dụng định lý Pythagore cho $\\Delta HBC$ vuông tại $H$:\n$$HB^2 + HC^2 = BC^2 \\iff (x + 2)^2 + (\\sqrt{25 - x^2} + 8)^2 = 13^2 = 169$$\nKhai triển và rút gọn:\n$$16\\sqrt{25 - x^2} = 76 - 4x \\iff 4\\sqrt{25 - x^2} = 19 - x$$\nBình phương hai vế: $16(25 - x^2) = (19 - x)^2 \\iff 17x^2 - 38x - 39 = 0 \\iff (x - 3)(17x + 13) = 0$.\nVì độ dài đoạn thẳng $x > 0$ nên $x = 3$."
  },
  {
    id: 10,
    title: "Bài tập 6.22 tiếp (SGK tr.27) - Tính diện tích tứ giác",
    pts: 20,
    question: "Diện tích của tứ giác $ABCD$ trong bài toán hình học 6.22 ở trên bằng:",
    options: [
      { text: "$S = 24$", correct: true },
      { text: "$S = 30$", correct: false },
      { text: "$S = 18$", correct: false },
      { text: "$S = 36$", correct: false }
    ],
    explanation: "Với $x = AH = 3$, ta có:\n- $HB = 3 + 2 = 5$.\n- $HD = \\sqrt{25 - 9} = 4$.\n- $HC = 4 + 8 = 12$.\nDiện tích tứ giác $ABCD$ được tính bằng hiệu diện tích hai tam giác vuông:\n$$S_{ABCD} = S_{\\Delta HBC} - S_{\\Delta HAD} = \\dfrac{1}{2}HB \\times HC - \\dfrac{1}{2}HA \\times HD$$\n$$S_{ABCD} = \\dfrac{1}{2}(5 \\times 12) - \\dfrac{1}{2}(3 \\times 4) = 30 - 6 = 24$$"
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
  unlockBadge(0, "Thợ Săn Căn Thức");

  if (appState.answered[2] || appState.answered[7]) {
    unlockBadge(1, "Kính Chiếu Yêu Ngoại Lai");
  }

  if (appState.answered[9] || appState.answered[10]) {
    unlockBadge(2, "Kiến Trúc Sư Hình Học");
  }

  if (appState.xp >= 160) {
    unlockBadge(3, "Chiến Binh Căn Bậc Hai");
  }

  if (appState.xp >= 200) {
    unlockBadge(4, "Đại Kiện Tướng Vô Tỉ");
    sfx.playFanfare();
  }
}

// === 7. LAB 1: MÔ PHỎNG GIAO ĐIỂM ĐỒ THỊ CĂN THỨC ===
class RadicalLab {
  constructor() {
    this.canvas = document.getElementById('canvasRadicalLab');
    if (!this.canvas) return;
    this.ctx = this.canvas.getContext('2d');
    this.selectEq = document.getElementById('selectRadicalEq');
    this.analysisBox = document.getElementById('radicalAnalysisBox');

    this.bindEvents();
    this.draw();
  }

  bindEvents() {
    this.selectEq.addEventListener('change', () => {
      this.draw();
    });
  }

  draw() {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);

    const eqType = this.selectEq.value;

    // View boundaries per equation
    let xMin = -2, xMax = 8, yMin = -4, yMax = 8;
    if (eqType === 'eq3') {
      xMin = -6; xMax = 4; yMin = -6; yMax = 6;
    } else if (eqType === 'eq4') {
      xMin = 0; xMax = 6; yMin = 0; yMax = 22;
    }

    const toCanvasX = x => ((x - xMin) / (xMax - xMin)) * w;
    const toCanvasY = y => h - ((y - yMin) / (yMax - yMin)) * h;

    // Grid lines
    ctx.strokeStyle = '#26334d';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(x), 0);
      ctx.lineTo(toCanvasX(x), h);
      ctx.stroke();
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y += (yMax - yMin > 15 ? 4 : 2)) {
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(y));
      ctx.lineTo(w, toCanvasY(y));
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    // Ox
    if (yMin <= 0 && yMax >= 0) {
      ctx.beginPath();
      ctx.moveTo(0, toCanvasY(0));
      ctx.lineTo(w, toCanvasY(0));
      ctx.stroke();
    }
    // Oy
    if (xMin <= 0 && xMax >= 0) {
      ctx.beginPath();
      ctx.moveTo(toCanvasX(0), 0);
      ctx.lineTo(toCanvasX(0), h);
      ctx.stroke();
    }

    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('x', w - 16, toCanvasY(0) - 8);
    ctx.fillText('y', toCanvasX(0) + 8, 16);

    // Functions definitions
    let fnRadical = x => NaN;
    let fnLinear = x => NaN;
    let validRoots = [];
    let extraneousRoots = [];
    let desc = '';

    if (eqType === 'eq1') {
      // √(3x² - 17x + 23) = x - 3
      fnRadical = x => {
        const val = 3 * x * x - 17 * x + 23;
        return val >= 0 ? Math.sqrt(val) : NaN;
      };
      fnLinear = x => x - 3;
      validRoots = [{ x: 3.5, y: 0.5 }];
      extraneousRoots = [{ x: 2, y: -1, yRad: 1 }]; // at x=2, sqrt is 1, linear is -1!
      desc = 'Nghiệm thật $x = 3,5$ (cắt nhau tại $(3,5; 0,5)$). Nghiệm ngoại lai $x = 2$ sinh ra do đường thẳng $y = x - 3$ nhận giá trị âm ($-1$) trong khi căn thức luôn $\\ge 0$!';
    } else if (eqType === 'eq2') {
      // √(-x² + 2x + 4) = x - 2
      fnRadical = x => {
        const val = -x * x + 2 * x + 4;
        return val >= 0 ? Math.sqrt(val) : NaN;
      };
      fnLinear = x => x - 2;
      validRoots = [{ x: 3, y: 1 }];
      extraneousRoots = [{ x: 0, y: -2, yRad: 2 }];
      desc = 'Nghiệm thật $x = 3$ (giao điểm $(3; 1)$). Nghiệm ngoại lai $x = 0$ làm vế phải bằng $-2 < 0$, bị loại!';
    } else if (eqType === 'eq3') {
      // √(2x² + 5x + 3) = -3 - x
      fnRadical = x => {
        const val = 2 * x * x + 5 * x + 3;
        return val >= 0 ? Math.sqrt(val) : NaN;
      };
      fnLinear = x => -3 - x;
      validRoots = [];
      extraneousRoots = [{ x: -2, y: -1, yRad: 1 }, { x: 3, y: -6, yRad: 6 }];
      desc = 'Cả hai nghiệm $x = -2$ và $x = 3$ đều là **nghiệm ngoại lai**! Phương trình hoàn toàn **vô nghiệm**.';
    } else if (eqType === 'eq4') {
      // 4√(25 - x²) = 19 - x
      fnRadical = x => {
        const val = 25 - x * x;
        return val >= 0 ? 4 * Math.sqrt(val) : NaN;
      };
      fnLinear = x => 19 - x;
      validRoots = [{ x: 3, y: 16 }];
      extraneousRoots = [];
      desc = 'Bài toán hình học 6.22: Giao điểm duy nhất tại $x = 3$ với tung độ $y = 16$. Độ dài đoạn thẳng $AH = 3$.';
    }

    // Plot Radical Curve (Blue)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px <= w; px += 2) {
      const x = xMin + (px / w) * (xMax - xMin);
      const y = fnRadical(x);
      if (isNaN(y) || y < yMin - 5 || y > yMax + 5) {
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

    // Plot Linear Line (Green)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(toCanvasX(xMin), toCanvasY(fnLinear(xMin)));
    ctx.lineTo(toCanvasX(xMax), toCanvasY(fnLinear(xMax)));
    ctx.stroke();

    // Draw Valid Root Dots (Yellow)
    validRoots.forEach(pt => {
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(toCanvasX(pt.x), toCanvasY(pt.y), 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`Nghiệm thật x = ${pt.x} (y = ${pt.y})`, toCanvasX(pt.x) + 10, toCanvasY(pt.y) - 8);
    });

    // Draw Extraneous Root Dots (Red)
    extraneousRoots.forEach(pt => {
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(toCanvasX(pt.x), toCanvasY(pt.y), 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f87171';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`Nghiệm ngoại lai x = ${pt.x}`, toCanvasX(pt.x) + 10, toCanvasY(pt.y) + 14);
    });

    this.analysisBox.innerHTML = `
      <div class="analysis-pill info">
        <span style="color: #38bdf8;">■ Đường cong căn thức $y = \\sqrt{f(x)}$</span> • 
        <span style="color: #10b981;">■ Đường thẳng $y = ax + b$</span><br>
        <strong>Phân tích giao điểm:</strong> ${desc}
      </div>
    `;
    renderMathInTree(this.analysisBox);
  }
}

// === 8. LAB 2: MÁY KIỂM ĐỊNH TỪNG BƯỚC ===
class StepVerificationLab {
  constructor() {
    this.box = document.getElementById('stepByStepBox');
    this.btnSquare = document.getElementById('btnStepSquare');
    this.btnCheck = document.getElementById('btnStepCheck');
    this.step = 0;

    this.bindEvents();
    this.renderStep();
  }

  bindEvents() {
    this.btnSquare.addEventListener('click', () => {
      this.step = 1;
      this.renderStep();
      sfx.playClick();
      unlockBadge(1, "Kính Chiếu Yêu Ngoại Lai");
    });

    this.btnCheck.addEventListener('click', () => {
      this.step = 2;
      this.renderStep();
      sfx.playCorrect();
    });
  }

  renderStep() {
    if (this.step === 0) {
      this.box.innerHTML = `
        <h4>PHƯƠNG TRÌNH GỐC: $\\sqrt{3x^2 - 17x + 23} = x - 3$</h4>
        <p>Bấm nút <strong>\"Bình Phương 2 Vế\"</strong> để bắt đầu quá trình giải và quan sát sự xuất hiện của phương trình bậc hai hệ quả.</p>
      `;
    } else if (this.step === 1) {
      this.box.innerHTML = `
        <h4>BƯỚC 1: BÌNH PHƯƠNG HAI VẾ VÀ RÚT GỌN</h4>
        <p>$$3x^2 - 17x + 23 = (x - 3)^2 = x^2 - 6x + 9$$</p>
        <p>Chuyển vế đưa về phương trình bậc hai: $$2x^2 - 11x + 14 = 0$$</p>
        <p>Giải phương trình hệ quả nhận được 2 nghiệm: <strong>$x = 2$</strong> và <strong>$x = 3,5$</strong>.</p>
        <p style="color: #fbbf24;">⚡ Bây giờ, bấm nút <strong>\"Thử Lại Nghiệm\"</strong> để thẩm định tính đúng đắn!</p>
      `;
    } else if (this.step === 2) {
      this.box.innerHTML = `
        <h4>BƯỚC 2: THỬ LẠI & PHÁT HIỆN NGHIỆM NGOẠI LAI</h4>
        <ul>
          <li><strong>Thử $x = 2$:</strong><br>
            • Vế trái: $\\sqrt{3(2^2) - 17(2) + 23} = \\sqrt{12 - 34 + 23} = \\sqrt{1} = 1$.<br>
            • Vế phải: $2 - 3 = -1$.<br>
            Vì $1 \\neq -1$ nên $x = 2$ là <strong>NGHIỆM NGOẠI LAI (LOẠI)</strong> ❌.
          </li>
          <li style="margin-top: 8px;"><strong>Thử $x = 3,5$:</strong><br>
            • Vế trái: $\\sqrt{3(3,5^2) - 17(3,5) + 23} = \\sqrt{0,25} = 0,5$.<br>
            • Vế phải: $3,5 - 3 = 0,5$.<br>
            Hai vế bằng nhau $\\implies x = 3,5$ là <strong>NGHIỆM ĐÚNG (NHẬN)</strong> ✔️.
          </li>
        </ul>
        <div class="receipt-total">KẾT LUẬN: Tập nghiệm duy nhất là <strong>S = {3,5}</strong>.</div>
      `;
    }
    renderMathInTree(this.box);
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
        '👑': 'Đại Kiện Tướng Vô Tỉ',
        '🚀': 'Phi Hành Gia Vũ Trụ',
        '🧙‍♂️': 'Phù Thủy Căn Thức',
        '🦁': 'Sư Tử Dũng Mãnh',
        '💎': 'Bậc Thầy Khử Nghiệm',
        '🦉': 'Cú Thông Thái',
        '🎯': 'Xạ Thủ Vô Tỉ',
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
  new RadicalLab();
  new StepVerificationLab();
  updateHUD();

  unlockBadge(0, "Thợ Săn Căn Thức");
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
