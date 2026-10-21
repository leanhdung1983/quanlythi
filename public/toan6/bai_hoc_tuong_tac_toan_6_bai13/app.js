/* ==========================================================================
   BÀI 13: TẬP HỢP CÁC SỐ NGUYÊN - JAVASCRIPT ĐIỀU KHIỂN & MINIGAME
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
    this.playTone(600, 'sine', 0.08, 0.1);
  }

  correct() {
    this.init();
    if (!this.enabled || !this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
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
  studentName: "Nhà Thám Hiểm Lớp 6",
  avatar: "🐧",
  score: 0,
  stars: 0,
  streak: 0,
  currentQuestionIndex: 0,
  badges: {
    1: false, // Thám hiểm băng giá
    2: false, // Bậc thầy trục số
    3: false, // Cân bằng đối xứng
    4: false, // Chuỗi lửa
    5: false  // Vua số nguyên
  }
};

// 3. 10 CÂU HỎI SGK BÀI 13 (BT 3.1 ĐẾN 3.8)
const quizQuestions = [
  {
    tag: "BÀI TẬP 3.1 SGK (TRANG 61)",
    title: "Trên nhiệt kế đo nhiệt độ mùa đông ở Moscow, cột thủy ngân chỉ mức 7 vạch dưới mốc 0°C. Nhiệt độ này được viết và đọc là:",
    options: [
      { key: "A", text: "-7°C (Âm bảy độ C hoặc Trừ bảy độ C)", isCorrect: true },
      { key: "B", text: "+7°C (Dương bảy độ C)", isCorrect: false },
      { key: "C", text: "0°C (Không độ C)", isCorrect: false },
      { key: "D", text: "-70°C (Âm bảy mươi độ C)", isCorrect: false }
    ],
    explanation: "Dưới mốc 0°C được biểu diễn bằng số nguyên âm: dấu trừ (-) trước số 7 thành -7°C, đọc là 'âm bảy độ C' hoặc 'trừ bảy độ C'."
  },
  {
    tag: "BÀI TẬP 3.2a SGK (TRANG 61)",
    title: "Đáy của rãnh nứt Mariana ở Thái Bình Dương sâu 10 994 m dưới mực nước biển. Dùng số nguyên thích hợp để biểu diễn độ cao này là:",
    options: [
      { key: "A", text: "10 994 m", isCorrect: false },
      { key: "B", text: "-10 994 m", isCorrect: true },
      { key: "C", text: "-1094 m", isCorrect: false },
      { key: "D", text: "0 m", isCorrect: false }
    ],
    explanation: "Theo quy ước địa lý toán học, độ cao trên mực nước biển là số dương, còn độ cao dưới mực nước biển là số âm: -10 994 m."
  },
  {
    tag: "BÀI TẬP 3.2b SGK (TRANG 61)",
    title: "Trong tháng 8, một hợp tác xã nuôi tôm bị lỗ 25 triệu đồng. Số tiền lời/lỗ của hợp tác xã được ghi bằng số nguyên là:",
    options: [
      { key: "A", text: "+25 000 000 đồng", isCorrect: false },
      { key: "B", text: "-25 000 000 đồng", isCorrect: true },
      { key: "C", text: "-2 500 000 đồng", isCorrect: false },
      { key: "D", text: "0 đồng", isCorrect: false }
    ],
    explanation: "Tiền lời (lãi) ghi dấu dương (+), tiền lỗ ghi dấu âm (-). Do đó lỗ 25 triệu đồng ghi là: -25 000 000 đồng."
  },
  {
    tag: "BÀI TẬP 3.3 SGK (TRANG 61)",
    title: "Bác sĩ ghi kết quả đo mắt của bạn Lan: 'Mắt trái: -2,0 đi-ốp'. Phát biểu nào sau đây diễn đạt đúng tình trạng mắt của Lan mà không dùng dấu âm?",
    options: [
      { key: "A", text: "Lan bị viễn thị 2,0 đi-ốp", isCorrect: false },
      { key: "B", text: "Lan bị cận thị 2,0 đi-ốp", isCorrect: true },
      { key: "C", text: "Mắt Lan hoàn toàn bình thường 0 đi-ốp", isCorrect: false },
      { key: "D", text: "Lan bị loạn thị 2,0 đi-ốp", isCorrect: false }
    ],
    explanation: "Dấu âm (-) trong nhãn khoa quy ước tật cận thị, dấu dương (+) là viễn thị. Do đó Lan bị cận thị 2,0 đi-ốp."
  },
  {
    tag: "KHÁI NIỆM TẬP HỢP SỐ NGUYÊN Z",
    title: "Khẳng định nào sau đây là ĐÚNG NHẤT về số 0 trong tập hợp số nguyên Z?",
    options: [
      { key: "A", text: "Số 0 là số nguyên dương nhỏ nhất", isCorrect: false },
      { key: "B", text: "Số 0 là số nguyên âm lớn nhất", isCorrect: false },
      { key: "C", text: "Số 0 là số nguyên, không phải số nguyên âm cũng không phải số nguyên dương", isCorrect: true },
      { key: "D", text: "Số 0 không thuộc tập hợp số nguyên Z", isCorrect: false }
    ],
    explanation: "Số 0 là phần tử phân định đặc biệt của Z: nó không thuộc nhóm số nguyên âm, cũng không thuộc nhóm số nguyên dương!"
  },
  {
    tag: "BÀI TẬP 3.4 & 3.5 SGK (TRANG 61)",
    title: "Trên trục số nằm ngang gốc O, điểm B cách gốc O một khoảng 5 đơn vị về phía bên trái. Điểm B biểu diễn số nào và số đối của nó là số nào?",
    options: [
      { key: "A", text: "Điểm B biểu diễn số -5; số đối của -5 là 5", isCorrect: true },
      { key: "B", text: "Điểm B biểu diễn số 5; số đối của 5 là -5", isCorrect: false },
      { key: "C", text: "Điểm B biểu diễn số -5; số đối của -5 là -5", isCorrect: false },
      { key: "D", text: "Điểm B biểu diễn số 0; số đối của 0 là 5", isCorrect: false }
    ],
    explanation: "Về phía bên trái gốc O là chiều âm => Điểm B biểu diễn số -5. Hai số đối nhau cách đều gốc O và nằm hai phía => Số đối của -5 là 5."
  },
  {
    tag: "BÀI TẬP 3.6 SGK (TRANG 61)",
    title: "Sắp xếp dãy số nguyên sau theo thứ tự TĂNG DẦN: -8; 7; -3; 0; -1; 25; -7",
    options: [
      { key: "A", text: "-8; -7; -3; -1; 0; 7; 25", isCorrect: true },
      { key: "B", text: "25; 7; 0; -1; -3; -7; -8", isCorrect: false },
      { key: "C", text: "-1; -3; -7; -8; 0; 7; 25", isCorrect: false },
      { key: "D", text: "-8; -3; -7; -1; 0; 7; 25", isCorrect: false }
    ],
    explanation: "So sánh các số âm: -8 < -7 < -3 < -1. Kết hợp số 0 và số dương: -8 < -7 < -3 < -1 < 0 < 7 < 25."
  },
  {
    tag: "BÀI TẬP 3.7 SGK (TRANG 61)",
    title: "So sánh hai số nguyên âm: -39 và -54. Khẳng định nào sau đây là đúng?",
    options: [
      { key: "A", text: "-39 > -54", isCorrect: true },
      { key: "B", text: "-39 < -54", isCorrect: false },
      { key: "C", text: "-39 = -54", isCorrect: false },
      { key: "D", text: "Không thể so sánh hai số âm", isCorrect: false }
    ],
    explanation: "Vì 39 < 54 nên khi thêm dấu trừ ta đảo chiều: -39 > -54. Trên trục số nằm ngang, điểm -39 nằm bên phải điểm -54."
  },
  {
    tag: "BÀI TẬP 3.8 SGK (TRANG 61)",
    title: "Liệt kê các phần tử của tập hợp A = {x ∈ ℤ | -3 < x ≤ 3}:",
    options: [
      { key: "A", text: "A = {-2; -1; 0; 1; 2; 3}", isCorrect: true },
      { key: "B", text: "A = {-3; -2; -1; 0; 1; 2; 3}", isCorrect: false },
      { key: "C", text: "A = {-2; -1; 0; 1; 2}", isCorrect: false },
      { key: "D", text: "A = {-3; -2; -1; 0; 1; 2}", isCorrect: false }
    ],
    explanation: "Vì x > -3 (dấu > nghiêm ngặt) nên không lấy -3, số nguyên đầu tiên là -2. Vì x ≤ 3 nên lấy đến 3. Vậy A = {-2; -1; 0; 1; 2; 3}."
  },
  {
    tag: "VẬN DỤNG & TRANH LUẬN",
    title: "Nhiệt độ buổi sáng sớm tại Sa Pa là -2°C. Đến trưa, nhiệt độ tăng thêm 6°C. Nhiệt độ buổi trưa tại Sa Pa là bao nhiêu?",
    options: [
      { key: "A", text: "4°C", isCorrect: true },
      { key: "B", text: "-8°C", isCorrect: false },
      { key: "C", text: "8°C", isCorrect: false },
      { key: "D", text: "-4°C", isCorrect: false }
    ],
    explanation: "Từ điểm -2 trên trục số, tăng thêm 6 đơn vị (dịch chuyển sang phải 6 bước): (-2) + 6 = 4°C."
  }
];

// 4. KHỞI TẠO VÀ BẮT SỰ KIỆN GIAO DIỆN
document.addEventListener("DOMContentLoaded", () => {
  // Setup Avatar Picker
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
      gameState.soundEnabled = !sounds.enabled;
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

  // Slider altitude listener
  const slider = document.getElementById("altitude-slider");
  if (slider) {
    slider.addEventListener("input", (e) => {
      handleSliderChange(parseInt(e.target.value));
    });
  }

  // Build interactive number line
  renderNumberLine();

  // Next Question Button
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

  // Init Quiz Question 0
  renderCurrentQuestion();
  updateHUD();
  updateCertificate();
});

// 5. CÁC HÀM XỬ LÝ KHÁM PHÁ & THÍ NGHIỆM
function selectCity(name, temp, desc, el) {
  sounds.click();
  document.querySelectorAll(".city-weather-card").forEach(c => c.classList.remove("active"));
  el.classList.add("active");

  const panelText = document.getElementById("city-info-text");
  if (temp < 0) {
    panelText.innerHTML = `Tại <strong>${name}</strong>: Nhiệt độ là <strong>${temp}°C</strong>. Số nguyên âm <strong>${temp}</strong> đọc là: <em>"Âm ${Math.abs(temp)} độ C"</em> hoặc <em>"Trừ ${Math.abs(temp)} độ C"</em>. Mức nhiệt này lạnh dưới 0°C là ${Math.abs(temp)} độ!`;
  } else if (temp === 0) {
    panelText.innerHTML = `Tại <strong>${name}</strong>: Nhiệt độ là <strong>0°C</strong>. Điểm đóng băng của nước. Số 0 là mốc chuẩn chia đôi hai nửa thế giới âm và dương!`;
  } else {
    panelText.innerHTML = `Tại <strong>${name}</strong>: Nhiệt độ là <strong>+${temp}°C</strong>. Số nguyên dương <strong>${temp}</strong> đọc là: <em>"Dương ${temp} độ C"</em>. Mức nhiệt ấm hơn 0°C là ${temp} độ.`;
  }

  unlockBadge(1); // Mở khóa huy hiệu khám phá băng giá
}

function handleSliderChange(val) {
  const displayVal = document.getElementById("slider-display-val");
  const sceneIcon = document.getElementById("scene-icon");
  const sceneTitle = document.getElementById("scene-title");
  const sceneDesc = document.getElementById("scene-desc");

  if (val < 0) {
    displayVal.textContent = `${val} m (Dưới mực nước biển)`;
    displayVal.style.color = "#0284c7";
    if (val <= -35) {
      sceneIcon.textContent = "🐙";
      sceneTitle.textContent = `Tàu thám hiểm biển sâu (${val} m)`;
      sceneDesc.textContent = `Vùng tối tăm dưới lòng đại dương, áp suất cực lớn. Biểu diễn bằng số nguyên âm: ${val} m.`;
    } else {
      sceneIcon.textContent = "🤿";
      sceneTitle.textContent = `Thợ lặn đại dương (${val} m)`;
      sceneDesc.textContent = `Lặn sâu dưới làn nước trong xanh. Điểm sâu hơn mặt biển biểu diễn bằng dấu trừ: ${val} m.`;
    }
  } else if (val === 0) {
    displayVal.textContent = `0 m (Mực nước biển)`;
    displayVal.style.color = "#0c4a6e";
    sceneIcon.textContent = "⛵";
    sceneTitle.textContent = "Mực nước biển chuẩn (Độ cao 0 m)";
    sceneDesc.textContent = "Mặt nước phẳng lặng làm mốc phân cách số nguyên âm và số nguyên dương. Số 0 không âm cũng không dương.";
  } else {
    displayVal.textContent = `+${val} m (Trên mực nước biển)`;
    displayVal.style.color = "#ef4444";
    if (val >= 35) {
      sceneIcon.textContent = "✈️";
      sceneTitle.textContent = `Máy bay lướt trên bầu trời (+${val} m)`;
      sceneDesc.textContent = `Độ cao bay bổng giữa những tầng mây trắng. Biểu diễn bằng số nguyên dương: +${val} m.`;
    } else {
      sceneIcon.textContent = "⛰️";
      sceneTitle.textContent = `Ngọn núi cao (+${val} m)`;
      sceneDesc.textContent = `Độ cao vươn lên trên mặt biển, không khí trong lành ấm áp. Biểu diễn bằng số dương: +${val} m.`;
    }
  }
}

// 6. RENDER NUMBER LINE
function renderNumberLine() {
  const container = document.getElementById("points-container");
  if (!container) return;
  container.innerHTML = "";

  const min = -8;
  const max = 8;
  const total = max - min;

  for (let i = min; i <= max; i++) {
    const percent = ((i - min) / total) * 92 + 4; // 4% to 96%
    const point = document.createElement("div");
    point.className = "axis-point-wrapper";
    point.style.left = `${percent}%`;
    point.dataset.value = i;

    const tick = document.createElement("div");
    tick.className = i === 0 ? "axis-tick origin" : "axis-tick";

    const label = document.createElement("div");
    label.className = i === 0 ? "axis-label origin" : "axis-label";
    label.textContent = i;

    point.appendChild(tick);
    point.appendChild(label);

    point.addEventListener("click", () => {
      sounds.click();
      selectAxisPoint(i);
    });

    container.appendChild(point);
  }

  selectAxisPoint(3); // Mặc định chọn 3
}

function selectAxisPoint(val) {
  const allPoints = document.querySelectorAll(".axis-point-wrapper");
  allPoints.forEach(p => {
    p.classList.remove("selected");
    p.classList.remove("opposite");
  });

  const oppositeVal = -val;

  allPoints.forEach(p => {
    const pVal = parseInt(p.dataset.value);
    if (pVal === val) p.classList.add("selected");
    if (pVal === oppositeVal && val !== 0) p.classList.add("opposite");
  });

  const curDisplay = document.getElementById("current-point-val");
  const oppDisplay = document.getElementById("opposite-point-val");
  const explDisplay = document.getElementById("axis-point-explanation");

  if (curDisplay) curDisplay.textContent = val > 0 ? `+${val}` : `${val}`;
  if (oppDisplay) oppDisplay.textContent = oppositeVal > 0 ? `+${oppositeVal}` : `${oppositeVal}`;

  if (explDisplay) {
    if (val === 0) {
      explDisplay.innerHTML = "Số 0 là gốc toạ độ. <strong>Số đối của 0 chính là 0</strong>!";
    } else {
      explDisplay.innerHTML = `Điểm <strong>${val}</strong> và điểm <strong>${oppositeVal}</strong> nằm về hai phía của gốc 0 và cùng cách gốc 0 một khoảng cách bằng <strong>${Math.abs(val)} đơn vị</strong>!`;
    }
  }

  unlockBadge(2); // Mở khóa huy hiệu Bậc Thầy Trục Số
}

function revealDebateAnswer() {
  sounds.badge();
  const box = document.getElementById("debate-result-box");
  const btn = document.getElementById("btn-reveal-debate");
  if (box) box.style.display = "block";
  if (btn) btn.style.display = "none";
  unlockBadge(3); // Cân bằng đối xứng
}

// 7. QUIZ ARENA SYSTEM
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
    feedbackBadge.innerHTML = "🎉 CHÍNH XÁC! TUYỆT ĐỈNH!";
    feedbackExplanation.textContent = q.explanation;

    if (gameState.streak >= 3) {
      unlockBadge(4); // Chuỗi lửa bất bại
    }
  } else {
    sounds.wrong();
    btnEl.classList.add("wrong");
    gameState.streak = 0;

    // Highlight correct option
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
        <h2 style="font-size: 2rem; color: #0c4a6e; font-weight: 900; margin-bottom: 10px;">XUẤT SẮC HOÀN THÀNH 10 CÂU SGK!</h2>
        <p style="font-size: 1.15rem; color: #475569; max-width: 600px; margin: 0 auto 24px auto;">
          Chúc mừng em đã làm chủ trọn vẹn Tập Hợp Các Số Nguyên Z (Bài 13). Điểm số đạt được: <strong style="color: #0284c7;">${gameState.score} XP</strong> với <strong style="color: #f59e0b;">${gameState.stars} ⭐</strong>!
        </p>
        <a href="#vinh-danh" class="btn-cert btn-print" style="text-decoration: none;">XEM GIẤY CHỨNG NHẬN VINH DANH ➔</a>
      </div>
    `;
  }

  if (gameState.stars >= 8) {
    unlockBadge(5); // Vua số nguyên Z
  }
  updateCertificate();
}

// 8. HUY HIỆU & VINH DANH
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
    rankEl.textContent = "Vua Số Nguyên Z 👑";
  } else if (gameState.score >= 600) {
    rankEl.textContent = "Chuyên Gia Trục Số 🧭";
  } else if (gameState.score >= 300) {
    rankEl.textContent = "Thám Hiểm Biển Sâu 🤿";
  } else {
    rankEl.textContent = "Tập Sự Băng Tuyết ❄️";
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
    if (gameState.score >= 900) rankEl.textContent = "Bậc Thầy Xuất Sắc";
    else if (gameState.score >= 600) rankEl.textContent = "Chuyên Gia Tài Ba";
    else rankEl.textContent = "Nhà Thám Hiểm Chăm Chỉ";
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
