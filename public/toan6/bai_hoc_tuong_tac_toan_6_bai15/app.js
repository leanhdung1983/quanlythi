/* ==========================================================================
   BÀI 15: QUY TẮC DẤU NGOẶC - JAVASCRIPT & MINIGAME LOGIC
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
    this.playTone(650, 'sine', 0.08, 0.1);
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
  studentName: "Phù Thủy Số Học Lớp 6",
  avatar: "🧙‍♂️",
  score: 0,
  stars: 0,
  streak: 0,
  currentQuestionIndex: 0,
  bracketMode: "minus", // "minus" or "plus"
  badges: {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false
  }
};

// 3. 10 CÂU HỎI SGK BÀI 15 (BT 3.19 ĐẾN 3.23 TRANG 69)
const quizQuestions = [
  {
    tag: "BÀI TẬP 3.19a SGK (TRANG 69)",
    title: "Bỏ dấu ngoặc rồi tính tổng: 214 - (-36) + (-305) =",
    options: [
      { key: "A", text: "-55", isCorrect: true },
      { key: "B", text: "55", isCorrect: false },
      { key: "C", text: "-127", isCorrect: false },
      { key: "D", text: "127", isCorrect: false }
    ],
    explanation: "Bỏ ngoặc: 214 + 36 - 305 = 250 - 305 = -55."
  },
  {
    tag: "BÀI TẬP 3.19b SGK (TRANG 69)",
    title: "Bỏ dấu ngoặc rồi tính tổng: -321 + (-29) - 142 - (-72) =",
    options: [
      { key: "A", text: "-420", isCorrect: true },
      { key: "B", text: "420", isCorrect: false },
      { key: "C", text: "-350", isCorrect: false },
      { key: "D", text: "-564", isCorrect: false }
    ],
    explanation: "= -321 - 29 - 142 + 72 = -350 - 70 = -420."
  },
  {
    tag: "BÀI TẬP 3.20a SGK (TRANG 69)",
    title: "Tính một cách hợp lý: 21 - 22 + 23 - 24 =",
    options: [
      { key: "A", text: "-2", isCorrect: true },
      { key: "B", text: "2", isCorrect: false },
      { key: "C", text: "0", isCorrect: false },
      { key: "D", text: "-4", isCorrect: false }
    ],
    explanation: "Nhóm cặp đôi: (21 - 22) + (23 - 24) = (-1) + (-1) = -2."
  },
  {
    tag: "BÀI TẬP 3.20b SGK (TRANG 69)",
    title: "Khi nhóm các số hạng trong biểu thức A = 125 - 679 - 379 + 145, cách nhóm nào dưới đây là hợp lý nhất?",
    options: [
      { key: "A", text: "(125 + 145) - (679 + 379)", isCorrect: true },
      { key: "B", text: "(125 - 679) - (379 - 145)", isCorrect: false },
      { key: "C", text: "125 - (679 - 379 + 145)", isCorrect: false },
      { key: "D", text: "(125 + 679) - (379 + 145)", isCorrect: false }
    ],
    explanation: "Nhóm số dương với nhau, số âm với nhau: (125 + 145) - (679 + 379) = 270 - 1058 = -788."
  },
  {
    tag: "BÀI TẬP 3.21a SGK (TRANG 69)",
    title: "Khi bỏ dấu ngoặc của biểu thức -(43 - 65), ta được kết quả là:",
    options: [
      { key: "A", text: "-43 + 65", isCorrect: true },
      { key: "B", text: "-43 - 65", isCorrect: false },
      { key: "C", text: "43 + 65", isCorrect: false },
      { key: "D", text: "43 - 65", isCorrect: false }
    ],
    explanation: "Đằng trước dấu ngoặc là dấu trừ (-), ta phải đổi dấu tất cả các số hạng: +43 đổi thành -43, -65 đổi thành +65 => -43 + 65."
  },
  {
    tag: "BÀI TẬP 3.21b SGK (TRANG 69)",
    title: "Tính giá trị của biểu thức: [ -(-23) + 13 ] - (45 - 17) =",
    options: [
      { key: "A", text: "8", isCorrect: true },
      { key: "B", text: "-8", isCorrect: false },
      { key: "C", text: "64", isCorrect: false },
      { key: "D", text: "-64", isCorrect: false }
    ],
    explanation: "Bỏ ngoặc: -(-23) = 23; (23 + 13) - 28 = 36 - 28 = 8."
  },
  {
    tag: "BÀI TẬP 3.22 SGK (TRANG 69)",
    title: "Tính nhanh biểu thức: M = 232 - (581 + 132 - 331) =",
    options: [
      { key: "A", text: "-150", isCorrect: true },
      { key: "B", text: "150", isCorrect: false },
      { key: "C", text: "-250", isCorrect: false },
      { key: "D", text: "250", isCorrect: false }
    ],
    explanation: "Phá ngoặc có dấu trừ: M = 232 - 581 - 132 + 331 = (232 - 132) - (581 - 331) = 100 - 250 = -150."
  },
  {
    tag: "BÀI TẬP 3.23a SGK (TRANG 69)",
    title: "Rút gọn biểu thức A = (x - 23) - (x - 47). Giá trị của biểu thức A tại x = 7 là:",
    options: [
      { key: "A", text: "24", isCorrect: true },
      { key: "B", text: "-24", isCorrect: false },
      { key: "C", text: "7", isCorrect: false },
      { key: "D", text: "-70", isCorrect: false }
    ],
    explanation: "Bỏ ngoặc: A = x - 23 - x + 47 = (x - x) + (47 - 23) = 24. Kết quả luôn bằng 24 với mọi giá trị của x!"
  },
  {
    tag: "BÀI TẬP 3.23b SGK (TRANG 69)",
    title: "Cho biểu thức B = (x + y - 15) - (x - y + 15). Giá trị của B tại x = 13, y = 11 là:",
    options: [
      { key: "A", text: "-8", isCorrect: true },
      { key: "B", text: "8", isCorrect: false },
      { key: "C", text: "-38", isCorrect: false },
      { key: "D", text: "0", isCorrect: false }
    ],
    explanation: "B = x + y - 15 - x + y - 15 = 2y - 30. Thay y = 11 ta được: 2(11) - 30 = 22 - 30 = -8."
  },
  {
    tag: "QUY TẮC TỔNG QUÁT",
    title: "Khi bỏ dấu ngoặc trong biểu thức -(a - b + c - d), ta thu được biểu thức nào?",
    options: [
      { key: "A", text: "-a + b - c + d", isCorrect: true },
      { key: "B", text: "-a - b + c - d", isCorrect: false },
      { key: "C", text: "a - b + c - d", isCorrect: false },
      { key: "D", text: "-a + b + c - d", isCorrect: false }
    ],
    explanation: "Trước ngoặc là dấu trừ: đổi dấu TẤT CẢ các số hạng: +a thành -a, -b thành +b, +c thành -c, -d thành +d => -a + b - c + d."
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

// 5. CÁC TÍNH NĂNG TƯƠNG TÁC BÀI 15
function revealRuleDiscovery() {
  sounds.badge();
  const box = document.getElementById("rule-discovery-box");
  if (box) box.style.display = "block";
  unlockBadge(1);
}

function setBracketMode(mode) {
  sounds.click();
  gameState.bracketMode = mode;
  document.getElementById("btn-mode-minus").classList.toggle("active", mode === "minus");
  document.getElementById("btn-mode-plus").classList.toggle("active", mode === "plus");

  const beforeEl = document.getElementById("exp-before");
  const afterEl = document.getElementById("exp-after");
  const expEl = document.getElementById("exp-explanation");

  afterEl.classList.remove("show");

  if (mode === "minus") {
    beforeEl.textContent = "a - (b - c)";
    expEl.textContent = "Trước ngoặc có dấu TRỪ: các số hạng bên trong sẽ ĐỔI DẤU!";
  } else {
    beforeEl.textContent = "a + (b - c)";
    expEl.textContent = "Trước ngoặc có dấu CỘNG: các số hạng bên trong sẽ GIỮ NGUYÊN DẤU!";
  }
}

function executeBreakBrackets() {
  sounds.badge();
  const afterEl = document.getElementById("exp-after");
  const expEl = document.getElementById("exp-explanation");

  if (gameState.bracketMode === "minus") {
    afterEl.textContent = "= a - b + c";
    afterEl.style.color = "#dc2626";
    expEl.innerHTML = "✨ <strong>Phép thuật đổi dấu!</strong> +b đổi thành <strong>-b</strong>, -c đổi thành <strong>+c</strong>!";
  } else {
    afterEl.textContent = "= a + b - c";
    afterEl.style.color = "#16a34a";
    expEl.innerHTML = "✨ <strong>Bình an vô sự!</strong> Trước ngoặc là dấu +, dấu của b và c được <strong>giữ nguyên 100%</strong>!";
  }

  afterEl.classList.add("show");
  unlockBadge(2);
}

function verifyMagicSquare() {
  sounds.badge();
  const fb = document.getElementById("magic-feedback");
  if (fb) fb.style.display = "block";
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
    feedbackBadge.innerHTML = "🎉 CHÍNH XÁC! PHÉP THUẬT HOÀN HẢO!";
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
    feedbackBadge.innerHTML = "💡 CHƯA ĐÚNG RỒI!";
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
          Chúc mừng em đã làm chủ trọn vẹn Quy Tắc Dấu Ngoặc (Bài 15). Điểm số đạt được: <strong style="color: #4f46e5;">${gameState.score} XP</strong> với <strong style="color: #f59e0b;">${gameState.stars} ⭐</strong>!
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
    rankEl.textContent = "Vua Dấu Ngoặc 👑";
  } else if (gameState.score >= 600) {
    rankEl.textContent = "Phù Thủy Đổi Dấu 🔮";
  } else if (gameState.score >= 300) {
    rankEl.textContent = "Thợ Săn Dấu Ngoặc ⚡";
  } else {
    rankEl.textContent = "Tập Sự Phép Thuật 🧙‍♂️";
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
    if (gameState.score >= 900) rankEl.textContent = "Đại Pháp Sư Xuất Sắc";
    else if (gameState.score >= 600) rankEl.textContent = "Pháp Sư Tài Ba";
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
