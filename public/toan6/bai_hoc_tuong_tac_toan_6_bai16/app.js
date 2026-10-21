/* ==========================================================================
   BÀI 16: PHÉP NHÂN SỐ NGUYÊN - JAVASCRIPT & LOGIC MINIGAME
   Bộ sách Toán 6 Kết Nối Tri Thức Với Cuộc Sống
   ========================================================================== */

// 1. SOUND MANAGER
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
    this.playTone(660, 'sine', 0.08, 0.1);
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
  studentName: "Phi Hành Gia Lớp 6",
  avatar: "🚀",
  score: 0,
  stars: 0,
  streak: 0,
  currentQuestionIndex: 0,
  s1: "+",
  s2: "+",
  badges: {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false
  }
};

// 3. 10 CÂU HỎI SGK BÀI 16 (BT 3.24 ĐẾN 3.31 TRANG 72-73)
const quizQuestions = [
  {
    tag: "BÀI TẬP 3.24a SGK (TRANG 72)",
    title: "Không làm tính, hãy xác định dấu của tích: (-5) · (-64)",
    options: [
      { key: "A", text: "Dấu dương (+)", isCorrect: true },
      { key: "B", text: "Dấu âm (-)", isCorrect: false },
      { key: "C", text: "Bằng 0", isCorrect: false },
      { key: "D", text: "Không xác định được", isCorrect: false }
    ],
    explanation: "Tích của hai số nguyên cùng dấu âm luôn luôn là số DƯƠNG (+): (-) · (-) = (+)."
  },
  {
    tag: "BÀI TẬP 3.24b SGK (TRANG 72)",
    title: "Không làm tính, hãy xác định dấu của tích: (-10) · (+11)",
    options: [
      { key: "A", text: "Dấu âm (-)", isCorrect: true },
      { key: "B", text: "Dấu dương (+)", isCorrect: false },
      { key: "C", text: "Bằng 0", isCorrect: false },
      { key: "D", text: "Dấu tuỳ thuộc vào 11", isCorrect: false }
    ],
    explanation: "Tích của hai số nguyên khác dấu luôn luôn là số ÂM (-): (-) · (+) = (-)."
  },
  {
    tag: "BÀI TẬP 3.25a SGK (TRANG 72)",
    title: "Tính tích hai số nguyên khác dấu: (-12) · 15 =",
    options: [
      { key: "A", text: "-180", isCorrect: true },
      { key: "B", text: "180", isCorrect: false },
      { key: "C", text: "-150", isCorrect: false },
      { key: "D", text: "150", isCorrect: false }
    ],
    explanation: "Nhân hai số khác dấu: (-12) · 15 = -(12 · 15) = -180."
  },
  {
    tag: "BÀI TẬP 3.25c SGK (TRANG 72)",
    title: "Tính tích hai số nguyên cùng âm: (-3) · (-2) =",
    options: [
      { key: "A", text: "6", isCorrect: true },
      { key: "B", text: "-6", isCorrect: false },
      { key: "C", text: "-5", isCorrect: false },
      { key: "D", text: "5", isCorrect: false }
    ],
    explanation: "Nhân hai số cùng âm: (-3) · (-2) = 3 · 2 = 6."
  },
  {
    tag: "BÀI TẬP 3.26 SGK (TRANG 72)",
    title: "Cho biểu thức P = (-5) · x. Giá trị của biểu thức P khi x = -4 là:",
    options: [
      { key: "A", text: "20", isCorrect: true },
      { key: "B", text: "-20", isCorrect: false },
      { key: "C", text: "-9", isCorrect: false },
      { key: "D", text: "9", isCorrect: false }
    ],
    explanation: "Thay x = -4 vào P: P = (-5) · (-4) = 5 · 4 = 20."
  },
  {
    tag: "BÀI TẬP 3.27 SGK (TRANG 72)",
    title: "Biết 12 · (-3) = -36. Từ đó suy ra kết quả của (-12) · (-3) là:",
    options: [
      { key: "A", text: "36", isCorrect: true },
      { key: "B", text: "-36", isCorrect: false },
      { key: "C", text: "-15", isCorrect: false },
      { key: "D", text: "15", isCorrect: false }
    ],
    explanation: "Tích của hai số nguyên cùng âm luôn là số dương đối của tích hai số khác dấu: (-12) · (-3) = 36."
  },
  {
    tag: "BÀI TẬP 3.28b SGK (TRANG 73)",
    title: "So sánh hai tích sau: A = (-3) · 4 và B = (-4) · (-3)",
    options: [
      { key: "A", text: "A < B", isCorrect: true },
      { key: "B", text: "A > B", isCorrect: false },
      { key: "C", text: "A = B", isCorrect: false },
      { key: "D", text: "Không thể so sánh", isCorrect: false }
    ],
    explanation: "Ta có A = (-3) · 4 = -12; B = (-4) · (-3) = 12. Vì số âm luôn nhỏ hơn số dương (-12 < 12) nên A < B."
  },
  {
    tag: "BÀI TẬP 3.29a SGK (TRANG 73)",
    title: "Tính một cách hợp lý: 4 · 1930 · 25 =",
    options: [
      { key: "A", text: "193 000", isCorrect: true },
      { key: "B", text: "19 300", isCorrect: false },
      { key: "C", text: "772 000", isCorrect: false },
      { key: "D", text: "1 930 000", isCorrect: false }
    ],
    explanation: "Ghép cặp số vàng: (4 · 25) · 1930 = 100 · 1930 = 193 000."
  },
  {
    tag: "BÀI TẬP 3.30 SGK (TRANG 73)",
    title: "Tính nhanh giá trị biểu thức: T = (-4) · (+3) · (-125) · (+25) · (-8)",
    options: [
      { key: "A", text: "-300 000", isCorrect: true },
      { key: "B", text: "300 000", isCorrect: false },
      { key: "C", text: "-30 000", isCorrect: false },
      { key: "D", text: "30 000", isCorrect: false }
    ],
    explanation: "Tích có 3 thừa số âm (số lẻ) nên mang dấu âm (-). Ghép các cặp: - [ (4 · 25) · (8 · 125) · 3 ] = - [ 100 · 1000 · 3 ] = -300 000."
  },
  {
    tag: "BÀI TẬP 3.31 SGK (TRANG 73)",
    title: "Một hợp đồng may quy định: trễ 1 ngày bị phạt 2 triệu đồng (biểu diễn bằng -2 triệu đồng). Nếu xưởng may giao trễ 5 ngày thì số tiền phạt được biểu diễn là:",
    options: [
      { key: "A", text: "5 · (-2) = -10 triệu đồng", isCorrect: true },
      { key: "B", text: "5 + (-2) = 3 triệu đồng", isCorrect: false },
      { key: "C", text: "(-5) · (-2) = 10 triệu đồng", isCorrect: false },
      { key: "D", text: "5 - (-2) = 7 triệu đồng", isCorrect: false }
    ],
    explanation: "Số tiền phạt cho 5 ngày trễ là tích: 5 · (-2) = -10 triệu đồng (nghĩa là bị phạt 10 triệu đồng)."
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

  // Init Quiz
  renderCurrentQuestion();
  updateHUD();
  updateCertificate();
});

// 5. CÁC TÍNH NĂNG TƯƠNG TÁC BÀI 16
function solveStarterProduct() {
  sounds.badge();
  const box = document.getElementById("starter-answer-box");
  if (box) box.style.display = "block";
  unlockBadge(1);
}

function setSign(factor, sign) {
  sounds.click();
  if (factor === 1) {
    gameState.s1 = sign;
    document.getElementById("btn-s1-plus").classList.toggle("active", sign === "+");
    document.getElementById("btn-s1-minus").classList.toggle("active", sign === "-");
  } else {
    gameState.s2 = sign;
    document.getElementById("btn-s2-plus").classList.toggle("active", sign === "+");
    document.getElementById("btn-s2-minus").classList.toggle("active", sign === "-");
  }

  const formulaEl = document.getElementById("wheel-formula");
  const noteEl = document.getElementById("wheel-note");

  const s1 = gameState.s1;
  const s2 = gameState.s2;

  if (s1 === "+" && s2 === "+") {
    formulaEl.innerHTML = "(+) ✖️ (+) = <span style='color: #059669;'>(+)</span>";
    noteEl.textContent = "Hai số cùng dấu DƯƠNG: Tích luôn là số DƯƠNG (+)!";
  } else if (s1 === "-" && s2 === "-") {
    formulaEl.innerHTML = "(-) ✖️ (-) = <span style='color: #059669;'>(+)</span>";
    noteEl.textContent = "Hai số cùng dấu ÂM: Tích luôn là số DƯƠNG (+)! (Âm nhân âm hóa dương)";
  } else if (s1 === "+" && s2 === "-") {
    formulaEl.innerHTML = "(+) ✖️ (-) = <span style='color: #ef4444;'>(-)</span>";
    noteEl.textContent = "Hai số KHÁC DẤU: Tích luôn luôn là số ÂM (-)!";
  } else {
    formulaEl.innerHTML = "(-) ✖️ (+) = <span style='color: #ef4444;'>(-)</span>";
    noteEl.textContent = "Hai số KHÁC DẤU: Tích luôn luôn là số ÂM (-)!";
  }

  unlockBadge(2);
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
    feedbackBadge.innerHTML = "🎉 CHÍNH XÁC! TÍNH TOÁN TUYỆT VỜI!";
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
    feedbackBadge.innerHTML = "💡 CHƯA CHÍNH XÁC!";
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
        <h2 style="font-size: 2rem; color: #064e3b; font-weight: 900; margin-bottom: 10px;">XUẤT SẮC CHINH PHỤC 10 CÂU SGK!</h2>
        <p style="font-size: 1.15rem; color: #475569; max-width: 600px; margin: 0 auto 24px auto;">
          Chúc mừng em đã làm chủ trọn vẹn Phép Nhân Số Nguyên (Bài 16). Điểm số đạt được: <strong style="color: #059669;">${gameState.score} XP</strong> với <strong style="color: #f59e0b;">${gameState.stars} ⭐</strong>!
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
    rankEl.textContent = "Vua Phép Nhân Số Nguyên 👑";
  } else if (gameState.score >= 600) {
    rankEl.textContent = "Kỷ Lục Gia Tính Nhanh ⚡";
  } else if (gameState.score >= 300) {
    rankEl.textContent = "Chuyên Gia Bánh Xe Dấu 🌀";
  } else {
    rankEl.textContent = "Tập Sự Vũ Trụ 🚀";
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
    if (gameState.score >= 900) rankEl.textContent = "Đại Phi Hành Gia Xuất Chúng";
    else if (gameState.score >= 600) rankEl.textContent = "Nhà Du Hành Tài Ba";
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
