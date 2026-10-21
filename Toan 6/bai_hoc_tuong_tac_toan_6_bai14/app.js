/* ==========================================================================
   BÀI 14: PHÉP CỘNG VÀ PHÉP TRỪ SỐ NGUYÊN - JAVASCRIPT & LOGIC MINIGAME
   Bộ sách Toán 6 Kết Nối Tri Thức Với Cuộc Sống
   ========================================================================== */

// 1. SOUND MANAGER (Web Audio API Synthesizer)
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, vol = 0.15) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  click() {
    this.playTone(620, 'sine', 0.08, 0.1);
  }

  correct() {
    this.init();
    if (!this.enabled || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.18, 0.15), idx * 75);
    });
  }

  wrong() {
    this.init();
    if (!this.enabled || !this.ctx) return;
    this.playTone(220, 'sawtooth', 0.25, 0.2);
    setTimeout(() => this.playTone(185, 'sawtooth', 0.3, 0.2), 120);
  }

  badge() {
    this.init();
    if (!this.enabled || !this.ctx) return;
    const chords = [440, 554.37, 659.25, 880];
    chords.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.35, 0.18), idx * 90);
    });
  }
}

const sounds = new SoundManager();

// 2. GAME STATE
const gameState = {
  studentName: "Dũng Sĩ Số Học Lớp 6",
  avatar: "🤖",
  score: 0,
  stars: 0,
  streak: 0,
  currentQuestionIndex: 0,
  badges: {
    1: false, // Mẫu Sơn
    2: false, // Bậc thầy cộng
    3: false, // Phù thủy trừ
    4: false, // Chuỗi lửa
    5: false  // Vua phép tính
  }
};

// 3. 10 CÂU HỎI SGK BÀI 14 (BT 3.9 ĐẾN 3.18 TRANG 66)
const quizQuestions = [
  {
    tag: "BÀI TẬP 3.9 SGK (TRANG 66)",
    title: "Tính tổng hai số nguyên âm: (-11) + (-7) =",
    options: [
      { key: "A", text: "-18", isCorrect: true },
      { key: "B", text: "18", isCorrect: false },
      { key: "C", text: "-4", isCorrect: false },
      { key: "D", text: "4", isCorrect: false }
    ],
    explanation: "Quy tắc cộng hai số âm: (-11) + (-7) = -(11 + 7) = -18."
  },
  {
    tag: "BÀI TẬP 3.10a SGK (TRANG 66)",
    title: "Tính tổng hai số nguyên khác dấu: (-10) + 4 =",
    options: [
      { key: "A", text: "-6", isCorrect: true },
      { key: "B", text: "6", isCorrect: false },
      { key: "C", text: "-14", isCorrect: false },
      { key: "D", text: "14", isCorrect: false }
    ],
    explanation: "Vì 10 > 4 nên ta lấy phần tự nhiên lớn trừ phần nhỏ và đặt dấu âm (-): (-10) + 4 = -(10 - 4) = -6."
  },
  {
    tag: "BÀI TẬP 3.10b SGK (TRANG 66)",
    title: "Tính tổng hai số nguyên khác dấu: (-1) + 8 =",
    options: [
      { key: "A", text: "7", isCorrect: true },
      { key: "B", text: "-7", isCorrect: false },
      { key: "C", text: "9", isCorrect: false },
      { key: "D", text: "-9", isCorrect: false }
    ],
    explanation: "Vì 8 > 1 nên ta lấy 8 - 1 = 7, mang dấu dương (+): (-1) + 8 = 7."
  },
  {
    tag: "BÀI TẬP 3.11 SGK (TRANG 66)",
    title: "Bạn Nam nợ bạn Tuấn 20 nghìn đồng, sau đó Nam lại vay thêm Tuấn 30 nghìn đồng nữa. Tổng số tiền nợ của Nam được biểu diễn là:",
    options: [
      { key: "A", text: "(-20) + (-30) = -50 nghìn đồng", isCorrect: true },
      { key: "B", text: "20 + 30 = 50 nghìn đồng", isCorrect: false },
      { key: "C", text: "(-20) + 30 = 10 nghìn đồng", isCorrect: false },
      { key: "D", text: "(-20) - (-30) = 10 nghìn đồng", isCorrect: false }
    ],
    explanation: "Nợ là số âm: nợ 20 nghìn là -20, vay thêm nợ 30 nghìn là -30. Tổng số tiền nợ là: (-20) + (-30) = -50 nghìn đồng."
  },
  {
    tag: "BÀI TẬP 3.12a SGK (TRANG 66)",
    title: "Thực hiện phép trừ hai số nguyên: 9 - (-2) =",
    options: [
      { key: "A", text: "11", isCorrect: true },
      { key: "B", text: "7", isCorrect: false },
      { key: "C", text: "-7", isCorrect: false },
      { key: "D", text: "-11", isCorrect: false }
    ],
    explanation: "Muốn trừ cho số nguyên b, ta cộng với số đối của b: 9 - (-2) = 9 + 2 = 11."
  },
  {
    tag: "BÀI TẬP 3.12b SGK (TRANG 66)",
    title: "Thực hiện phép trừ hai số nguyên: (-7) - 4 =",
    options: [
      { key: "A", text: "-11", isCorrect: true },
      { key: "B", text: "-3", isCorrect: false },
      { key: "C", text: "3", isCorrect: false },
      { key: "D", text: "11", isCorrect: false }
    ],
    explanation: "Cộng với số đối của 4 là -4: (-7) - 4 = (-7) + (-4) = -(7 + 4) = -11."
  },
  {
    tag: "BÀI TẬP 3.12d SGK (TRANG 66)",
    title: "Thực hiện phép trừ hai số nguyên: (-63) - (-15) =",
    options: [
      { key: "A", text: "-48", isCorrect: true },
      { key: "B", text: "-78", isCorrect: false },
      { key: "C", text: "48", isCorrect: false },
      { key: "D", text: "78", isCorrect: false }
    ],
    explanation: "Biến trừ cho -15 thành cộng với số đối +15: (-63) - (-15) = (-63) + 15 = -(63 - 15) = -48."
  },
  {
    tag: "BÀI TẬP 3.13 SGK (TRANG 66)",
    title: "Một ca nô chạy xuôi dòng với vận tốc 10 km/h, vận tốc dòng nước ngược lại là -3 km/h. Vận tốc thực tế của ca nô khi ngược dòng là:",
    options: [
      { key: "A", text: "7 km/h", isCorrect: true },
      { key: "B", text: "13 km/h", isCorrect: false },
      { key: "C", text: "-7 km/h", isCorrect: false },
      { key: "D", text: "30 km/h", isCorrect: false }
    ],
    explanation: "Vận tốc thực tế là tổng: 10 + (-3) = 10 - 3 = 7 km/h."
  },
  {
    tag: "BÀI TẬP 3.16 SGK (TRANG 66)",
    title: "Tính hợp lý biểu thức: P = 152 + (-73) - (-18) - 127",
    options: [
      { key: "A", text: "-30", isCorrect: true },
      { key: "B", text: "30", isCorrect: false },
      { key: "C", text: "0", isCorrect: false },
      { key: "D", text: "-10", isCorrect: false }
    ],
    explanation: "P = 152 - 73 + 18 - 127 = (152 + 18) - (73 + 127) = 170 - 200 = -30."
  },
  {
    tag: "BÀI TẬP 3.18 SGK (TRANG 66)",
    title: "Tìm chữ số * thích hợp để phép tính sau đúng: (-6*) + (-34) = -100",
    options: [
      { key: "A", text: "* = 6", isCorrect: true },
      { key: "B", text: "* = 0", isCorrect: false },
      { key: "C", text: "* = 4", isCorrect: false },
      { key: "D", text: "* = 5", isCorrect: false }
    ],
    explanation: "Ta có (-6*) + (-34) = -(6* + 34) = -100 => 6* + 34 = 100 => 6* = 100 - 34 = 66 => * = 6."
  }
];

// 4. KHỞI TẠO DOM & EVENTS
document.addEventListener("DOMContentLoaded", () => {
  // Avatar selection
  const avatarBtns = document.querySelectorAll(".avatar-btn");
  avatarBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      sounds.click();
      avatarBtns.forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      gameState.avatar = btn.dataset.avatar;
    });
  });

  // Enter game button
  const btnEnter = document.getElementById("btn-enter-game");
  if (btnEnter) {
    btnEnter.addEventListener("click", () => {
      sounds.badge();
      const nameInput = document.getElementById("student-name-input");
      if (nameInput && nameInput.value.trim() !== "") {
        gameState.studentName = nameInput.value.trim();
      }
      document.getElementById("start-modal").classList.add("hidden");
      updateHUD();
      updateCertificate();
    });
  }

  // Toggle sound
  const btnSound = document.getElementById("btn-toggle-sound");
  if (btnSound) {
    btnSound.addEventListener("click", () => {
      sounds.enabled = !sounds.enabled;
      btnSound.textContent = sounds.enabled ? "🔊 Âm thanh: BẬT" : "🔇 Âm thanh: TẮT";
      if (sounds.enabled) sounds.click();
    });
  }

  // Reset Game
  const btnReset = document.getElementById("btn-reset-game");
  if (btnReset) {
    btnReset.addEventListener("click", () => {
      if (confirm("Em có muốn làm lại hành trình từ đầu không?")) {
        resetGame();
      }
    });
  }

  // Next Question
  const btnNext = document.getElementById("btn-next-question");
  if (btnNext) {
    btnNext.addEventListener("click", () => {
      sounds.click();
      nextQuestion();
    });
  }

  // Replay Lesson
  const btnReplay = document.getElementById("btn-replay-lesson");
  if (btnReplay) {
    btnReplay.addEventListener("click", () => {
      resetGame();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  // Build Walker track
  renderWalkerTicks();
  runWalkSimulation();

  // Init Quiz
  renderCurrentQuestion();
  updateHUD();
  updateCertificate();
});

// 5. CÁC TÍNH NĂNG TƯƠNG TÁC BÀI 14
function solveMauSon() {
  sounds.badge();
  const box = document.getElementById("mauson-answer");
  if (box) box.style.display = "block";
  unlockBadge(1);
}

function renderWalkerTicks() {
  const container = document.getElementById("walker-ticks");
  if (!container) return;
  container.innerHTML = "";

  const min = -8;
  const max = 8;
  const total = max - min;

  for (let i = min; i <= max; i++) {
    const percent = ((i - min) / total) * 90 + 5;
    const node = document.createElement("div");
    node.className = "walker-tick-node";
    node.style.left = `${percent}%`;

    const line = document.createElement("div");
    line.className = i === 0 ? "walker-tick-line origin" : "walker-tick-line";

    const label = document.createElement("div");
    label.className = i === 0 ? "walker-tick-label origin" : "walker-tick-label";
    label.textContent = i;

    node.appendChild(line);
    node.appendChild(label);
    container.appendChild(node);
  }
}

function runWalkSimulation() {
  sounds.click();
  const aInput = document.getElementById("walker-start");
  const bInput = document.getElementById("walker-step");
  const char = document.getElementById("walker-char");
  const expBox = document.getElementById("walker-exp-box");

  let a = parseInt(aInput.value) || 0;
  let b = parseInt(bInput.value) || 0;

  // Clamp values
  if (a < -6) a = -6; if (a > 6) a = 6;
  if (b < -6) b = -6; if (b > 6) b = 6;
  aInput.value = a;
  bInput.value = b;

  const result = a + b;

  // Calculate position percentage
  const min = -8;
  const max = 8;
  const total = max - min;

  // Clamp result visually to -8 and 8
  const visualResult = Math.max(-8, Math.min(8, result));
  const finalPercent = ((visualResult - min) / total) * 90 + 5;

  char.textContent = gameState.avatar;
  char.style.left = `${finalPercent}%`;

  const direction = b >= 0 ? `sang PHẢI ${b} bước` : `sang TRÁI ${Math.abs(b)} bước`;
  expBox.innerHTML = `
    Phép tính: <strong>(${a}) + (${b}) = ${result}</strong>.
    <br>Nhân vật xuất phát tại điểm <strong>${a}</strong>, đi <strong>${direction}</strong> theo hướng của số ${b} $\\implies$ dừng lại ở điểm <strong>${result}</strong>!
  `;

  unlockBadge(2);
}

function explainCalc(exp, res, note) {
  sounds.click();
  const formulaEl = document.getElementById("machine-formula");
  const explEl = document.getElementById("machine-explanation");
  if (formulaEl) formulaEl.textContent = `${exp} = ${res}`;
  if (explEl) explEl.textContent = note;
  unlockBadge(3);
}

// 6. QUIZ ARENA SYSTEM
function renderCurrentQuestion() {
  if (gameState.currentQuestionIndex >= quizQuestions.length) {
    finishQuiz();
    return;
  }

  const q = quizQuestions[gameState.currentQuestionIndex];
  document.getElementById("quiz-question-counter").textContent = `CÂU HỎI ${gameState.currentQuestionIndex + 1}/${quizQuestions.length}`;
  document.getElementById("quiz-question-tag").textContent = q.tag;
  document.getElementById("quiz-question-title").textContent = q.title;

  const bar = document.getElementById("quiz-progress-bar");
  if (bar) bar.style.width = `${((gameState.currentQuestionIndex + 1) / quizQuestions.length) * 100}%`;

  const optionsContainer = document.getElementById("quiz-options-container");
  optionsContainer.innerHTML = "";

  q.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.innerHTML = `<span class="option-key">${opt.key}</span> <span>${opt.text}</span>`;
    btn.addEventListener("click", () => handleAnswer(opt, btn));
    optionsContainer.appendChild(btn);
  });

  const feedbackBox = document.getElementById("quiz-feedback-box");
  feedbackBox.className = "quiz-feedback-box";
  feedbackBox.classList.remove("show");

  const btnNext = document.getElementById("btn-next-question");
  btnNext.classList.remove("show");
}

function handleAnswer(selectedOpt, btnEl) {
  const q = quizQuestions[gameState.currentQuestionIndex];
  const allBtns = document.querySelectorAll(".option-btn");
  allBtns.forEach(b => b.disabled = true);

  const feedbackBox = document.getElementById("quiz-feedback-box");
  const feedbackBadge = document.getElementById("feedback-badge");
  const feedbackExplanation = document.getElementById("feedback-explanation");
  const btnNext = document.getElementById("btn-next-question");

  if (selectedOpt.isCorrect) {
    sounds.correct();
    btnEl.classList.add("correct");
    gameState.score += 100;
    gameState.stars += 1;
    gameState.streak += 1;

    feedbackBox.className = "quiz-feedback-box show correct";
    feedbackBadge.innerHTML = "🎉 CHÍNH XÁC! XUẤT SẮC!";
    feedbackExplanation.textContent = q.explanation;

    if (gameState.streak >= 3) {
      unlockBadge(4);
    }
  } else {
    sounds.wrong();
    btnEl.classList.add("wrong");
    gameState.streak = 0;

    allBtns.forEach(b => {
      if (b.innerText.includes(q.options.find(o => o.isCorrect).text.substring(0, 15))) {
        b.classList.add("correct");
      }
    });

    feedbackBox.className = "quiz-feedback-box show wrong";
    feedbackBadge.innerHTML = "💡 CHƯA CHÍNH XÁC RỒI!";
    feedbackExplanation.textContent = q.explanation;
  }

  updateHUD();
  updateCertificate();
  btnNext.classList.add("show");
}

function nextQuestion() {
  gameState.currentQuestionIndex++;
  renderCurrentQuestion();
}

function finishQuiz() {
  sounds.badge();
  const box = document.getElementById("dau-truong-sgk");
  if (box) {
    box.innerHTML = `
      <div style="text-align: center; padding: 40px 20px;">
        <div style="font-size: 4.5rem; margin-bottom: 12px;">🏆</div>
        <h2 style="font-size: 2rem; color: #1e1b4b; font-weight: 900; margin-bottom: 10px;">XUẤT SẮC CHINH PHỤC 10 CÂU SGK!</h2>
        <p style="font-size: 1.15rem; color: #475569; max-width: 600px; margin: 0 auto 24px auto;">
          Chúc mừng em đã làm chủ trọn vẹn Phép Cộng và Phép Trừ Số Nguyên (Bài 14). Điểm số đạt được: <strong style="color: #e11d48;">${gameState.score} XP</strong> với <strong style="color: #f59e0b;">${gameState.stars} ⭐</strong>!
        </p>
        <a href="#vinh-danh" class="btn-cert btn-print" style="text-decoration: none;">XEM GIẤY CHỨNG NHẬN VINH DANH ➔</a>
      </div>
    `;
  }

  if (gameState.stars >= 8) {
    unlockBadge(5);
  }
  updateCertificate();
}

// 7. HUY HIỆU & VINH DANH
function unlockBadge(id) {
  if (gameState.badges[id]) return;
  gameState.badges[id] = true;
  sounds.badge();

  const card = document.getElementById(`badge-${id}`);
  if (card) {
    card.classList.remove("locked");
    card.classList.add("unlocked");
  }
}

function updateHUD() {
  document.getElementById("hud-avatar-display").textContent = gameState.avatar;
  document.getElementById("hud-name-display").textContent = gameState.studentName;
  document.getElementById("hud-score").textContent = gameState.score;
  document.getElementById("hud-stars").textContent = gameState.stars;
  document.getElementById("hud-streak").textContent = gameState.streak;

  const rankEl = document.getElementById("hud-rank-display");
  if (gameState.score >= 900) {
    rankEl.textContent = "Vua Phép Tính Số Nguyên 👑";
  } else if (gameState.score >= 600) {
    rankEl.textContent = "Chuyên Gia Trừ Số Đối 🔄";
  } else if (gameState.score >= 300) {
    rankEl.textContent = "Thợ Săn Phép Cộng ⚡";
  } else {
    rankEl.textContent = "Tập Sự Cộng Trừ 🤖";
  }
}

function updateCertificate() {
  const nameEl = document.getElementById("cert-name");
  if (nameEl) nameEl.textContent = gameState.studentName;

  const scoreEl = document.getElementById("cert-score");
  if (scoreEl) scoreEl.textContent = gameState.score;

  const starsEl = document.getElementById("cert-stars");
  if (starsEl) starsEl.textContent = gameState.stars;

  const rankEl = document.getElementById("cert-rank");
  if (rankEl) {
    if (gameState.score >= 900) rankEl.textContent = "Dũng Sĩ Xuất Chúng";
    else if (gameState.score >= 600) rankEl.textContent = "Chiến Binh Tài Ba";
    else rankEl.textContent = "Học Viên Chăm Chỉ";
  }

  const dateEl = document.getElementById("cert-date");
  if (dateEl) {
    const today = new Date();
    dateEl.textContent = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  }
}

function resetGame() {
  gameState.score = 0;
  gameState.stars = 0;
  gameState.streak = 0;
  gameState.currentQuestionIndex = 0;
  for (let k in gameState.badges) gameState.badges[k] = false;

  document.querySelectorAll(".badge-card").forEach(c => {
    c.classList.remove("unlocked");
    c.classList.add("locked");
  });

  updateHUD();
  updateCertificate();
  location.reload();
}
