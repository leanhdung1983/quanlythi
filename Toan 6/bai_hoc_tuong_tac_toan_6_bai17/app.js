/* ==========================================================================
   BÀI 17: PHÉP CHIA HẾT. ƯỚC VÀ BỘI CỦA MỘT SỐ NGUYÊN - JAVASCRIPT & MINIGAME
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
    this.playTone(670, 'sine', 0.08, 0.1);
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
  studentName: "Thám Hiểm Gia Lớp 6",
  avatar: "🤿",
  score: 0,
  stars: 0,
  streak: 0,
  currentQuestionIndex: 0,
  badges: {
    1: false,
    2: false,
    3: false,
    4: false,
    5: false
  }
};

// 3. 10 CÂU HỎI SGK BÀI 17 (BT 3.39 ĐẾN 3.44 TRANG 74 - 75)
const quizQuestions = [
  {
    tag: "BÀI TẬP 3.39a SGK (TRANG 74)",
    title: "Tính thương của phép chia hai số nguyên khác dấu: 297 : (-3) =",
    options: [
      { key: "A", text: "-99", isCorrect: true },
      { key: "B", text: "99", isCorrect: false },
      { key: "C", text: "-89", isCorrect: false },
      { key: "D", text: "89", isCorrect: false }
    ],
    explanation: "Chia hai số khác dấu thì thương luôn mang dấu âm (-): 297 : (-3) = -(297 : 3) = -99."
  },
  {
    tag: "BÀI TẬP 3.39b SGK (TRANG 74)",
    title: "Tính thương của phép chia hai số nguyên cùng âm: (-396) : (-12) =",
    options: [
      { key: "A", text: "33", isCorrect: true },
      { key: "B", text: "-33", isCorrect: false },
      { key: "C", text: "30", isCorrect: false },
      { key: "D", text: "-30", isCorrect: false }
    ],
    explanation: "Chia hai số cùng dấu âm thì thương luôn mang dấu dương (+): (-396) : (-12) = 396 : 12 = 33."
  },
  {
    tag: "BÀI TẬP 3.39c SGK (TRANG 74)",
    title: "Tính thương của phép chia: (-600) : 15 =",
    options: [
      { key: "A", text: "-40", isCorrect: true },
      { key: "B", text: "40", isCorrect: false },
      { key: "C", text: "-4", isCorrect: false },
      { key: "D", text: "4", isCorrect: false }
    ],
    explanation: "Khác dấu thì thương mang dấu âm (-): (-600) : 15 = -(600 : 15) = -40."
  },
  {
    tag: "BÀI TẬP 3.40a SGK (TRANG 74)",
    title: "Tập hợp tất cả các ước số nguyên của số 30 có bao nhiêu phần tử?",
    options: [
      { key: "A", text: "16 phần tử", isCorrect: true },
      { key: "B", text: "8 phần tử", isCorrect: false },
      { key: "C", text: "12 phần tử", isCorrect: false },
      { key: "D", text: "4 phần tử", isCorrect: false }
    ],
    explanation: "Ước dương của 30 là: {1; 2; 3; 5; 6; 10; 15; 30} (8 ước). Kèm 8 ước âm đối xứng {-1; -2; -3; -5; -6; -10; -15; -30} => tổng cộng có 16 ước."
  },
  {
    tag: "BÀI TẬP 3.40b SGK (TRANG 74)",
    title: "Các ước chung của hai số nguyên 30 và 42 là:",
    options: [
      { key: "A", text: "±1; ±2; ±3; ±6", isCorrect: true },
      { key: "B", text: "1; 2; 3; 6", isCorrect: false },
      { key: "C", text: "±1; ±5; ±6", isCorrect: false },
      { key: "D", text: "±1; ±2; ±3; ±5; ±6", isCorrect: false }
    ],
    explanation: "ƯCLN(30, 42) = 6. Các ước của 6 trong tập số nguyên Z là: {±1; ±2; ±3; ±6}."
  },
  {
    tag: "BÀI TẬP 3.41 SGK (TRANG 74)",
    title: "Số phần tử của tập hợp M = {x ∈ ℤ | x ⋮ 4 và -16 ≤ x < 20} là:",
    options: [
      { key: "A", text: "9 phần tử", isCorrect: true },
      { key: "B", text: "10 phần tử", isCorrect: false },
      { key: "C", text: "8 phần tử", isCorrect: false },
      { key: "D", text: "5 phần tử", isCorrect: false }
    ],
    explanation: "Các số chia hết cho 4 từ -16 đến dưới 20: M = {-16; -12; -8; -4; 0; 4; 8; 12; 16}. Có đúng 9 phần tử!"
  },
  {
    tag: "BÀI TẬP 3.42 SGK (TRANG 74)",
    title: "Tìm hai ước của số 15 sao cho tổng của chúng bằng -4:",
    options: [
      { key: "A", text: "1 và -5", isCorrect: true },
      { key: "B", text: "-1 và -3", isCorrect: false },
      { key: "C", text: "3 và -7", isCorrect: false },
      { key: "D", text: "-2 và -2", isCorrect: false }
    ],
    explanation: "Các ước của 15 là ±1, ±3, ±5, ±15. Ta thấy 1 và -5 đều là ước của 15 và 1 + (-5) = -4."
  },
  {
    tag: "BÀI TẬP 3.43 SGK (TRANG 74)",
    title: "Nếu hai số nguyên a và b cùng chia hết cho -3 thì:",
    options: [
      { key: "A", text: "Cả tổng (a + b) và hiệu (a - b) đều chia hết cho -3", isCorrect: true },
      { key: "B", text: "Chỉ có tổng (a + b) chia hết cho -3", isCorrect: false },
      { key: "C", text: "Chỉ có hiệu (a - b) chia hết cho -3", isCorrect: false },
      { key: "D", text: "Không xác định được tính chia hết", isCorrect: false }
    ],
    explanation: "Theo tính chất chia hết của một tổng/hiệu số nguyên, nếu các số hạng cùng chia hết cho một số thì tổng và hiệu cũng chia hết cho số đó."
  },
  {
    tag: "BÀI TẬP 3.44a SGK (TRANG 75)",
    title: "Tích P = (-1) · (-2) · (-3) · (-4) · (-5) mang dấu gì?",
    options: [
      { key: "A", text: "Dấu âm (-)", isCorrect: true },
      { key: "B", text: "Dấu dương (+)", isCorrect: false },
      { key: "C", text: "Bằng 0", isCorrect: false },
      { key: "D", text: "Không xác định", isCorrect: false }
    ],
    explanation: "Tích P có 5 thừa số âm (số lẻ) nên kết quả mang dấu âm (-): P = -120."
  },
  {
    tag: "TRANH LUẬN SGK (TRANG 74)",
    title: "Có hai số nguyên a, b khác nhau nào mà a ⋮ b và b ⋮ a không?",
    options: [
      { key: "A", text: "Có, đó là hai số đối nhau khác 0 (như 5 và -5)", isCorrect: true },
      { key: "B", text: "Không bao giờ có hai số nguyên khác nhau như vậy", isCorrect: false },
      { key: "C", text: "Chỉ có số 0 và số 1", isCorrect: false },
      { key: "D", text: "Chỉ có hai số nguyên tố", isCorrect: false }
    ],
    explanation: "Với hai số đối nhau a và -a (a ≠ 0), ta có a : (-a) = -1 và (-a) : a = -1, do đó cả hai số đều chia hết cho nhau!"
  }
];

// 4. DOM LOADED & EVENTS
document.addEventListener("DOMContentLoaded", () => {
  // Avatar
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

  // Default calculation
  calculateDivisors();

  // Init Quiz
  renderCurrentQuestion();
  updateHUD();
  updateCertificate();
});

// 5. CÁC TÍNH NĂNG TƯƠNG TÁC
function revealStarterDivisor() {
  sounds.badge();
  const box = document.getElementById("starter-answer-box");
  if (box) box.style.display = "block";
  unlockBadge(1);
}

function calculateDivisors() {
  sounds.click();
  const inputEl = document.getElementById("input-number");
  let val = parseInt(inputEl.value);
  if (isNaN(val) || val === 0) val = 12;
  inputEl.value = val;

  const absVal = Math.abs(val);
  const positiveDivisors = [];

  for (let i = 1; i <= absVal; i++) {
    if (absVal % i === 0) {
      positiveDivisors.push(i);
    }
  }

  const allDivisors = [];
  positiveDivisors.forEach(d => {
    allDivisors.push(d);
    allDivisors.push(-d);
  });
  allDivisors.sort((a, b) => a - b);

  // Render Divisors
  document.getElementById("div-title").textContent = `Tất cả các ước của ${val} (${allDivisors.length} ước):`;
  const divContainer = document.getElementById("div-tags-container");
  divContainer.innerHTML = "";

  allDivisors.forEach(d => {
    const span = document.createElement("span");
    span.className = d < 0 ? "div-tag negative" : "div-tag";
    span.textContent = d > 0 ? `+${d}` : `${d}`;
    divContainer.appendChild(span);
  });

  // Render Multiples
  document.getElementById("mult-title").textContent = `Các bội tiêu biểu của ${val}:`;
  const multContainer = document.getElementById("mult-tags-container");
  multContainer.innerHTML = "";

  const multiples = [0, val, -val, 2 * val, -2 * val, 3 * val, -3 * val];
  multiples.sort((a, b) => a - b);

  multiples.forEach(m => {
    const span = document.createElement("span");
    span.className = m < 0 ? "div-tag negative" : "div-tag";
    span.textContent = m > 0 ? `+${m}` : `${m}`;
    multContainer.appendChild(span);
  });

  unlockBadge(2);
}

function revealDebateAnswer() {
  sounds.badge();
  const box = document.getElementById("debate-answer-box");
  if (box) box.style.display = "block";
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
    feedbackBadge.innerHTML = "🎉 CHÍNH XÁC! TƯ DUY XUẤT SẮC!";
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
        <h2 style="font-size: 2rem; color: #134e4a; font-weight: 900; margin-bottom: 10px;">XUẤT SẮC CHINH PHỤC 10 CÂU SGK!</h2>
        <p style="font-size: 1.15rem; color: #475569; max-width: 600px; margin: 0 auto 24px auto;">
          Chúc mừng em đã làm chủ trọn vẹn Phép Chia Hết. Ước và Bội của Số Nguyên (Bài 17). Điểm số đạt được: <strong style="color: #0d9488;">${gameState.score} XP</strong> với <strong style="color: #f59e0b;">${gameState.stars} ⭐</strong>!
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
    rankEl.textContent = "Vua Bội Ước Số Nguyên 👑";
  } else if (gameState.score >= 600) {
    rankEl.textContent = "Bậc Thầy Ước Số Đối 🔍";
  } else if (gameState.score >= 300) {
    rankEl.textContent = "Thợ Săn Phép Chia ➗";
  } else {
    rankEl.textContent = "Tập Sự Bội Ước 🤿";
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
    if (gameState.score >= 900) rankEl.textContent = "Đại Thám Hiểm Gia Xuất Chúng";
    else if (gameState.score >= 600) rankEl.textContent = "Nhà Thám Hiểm Tài Ba";
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
