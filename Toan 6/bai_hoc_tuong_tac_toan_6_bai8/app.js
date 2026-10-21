/* ==========================================================================
   BÀI 8: QUAN HỆ CHIA HẾT VÀ TÍNH CHẤT - TOÁN 6 KẾT NỐI TRI THỨC
   Logic Tương Tác, Game Engine, Web Audio API, Đấu Trường Quiz & Vinh Danh
   ========================================================================== */

// --- 1. WEB AUDIO API SOUND SYNTHESIZER ---
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, delay = 0) {
    if (!this.enabled || !this.ctx) return;
    setTimeout(() => {
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn('Audio play error:', e);
      }
    }, delay);
  }

  playCorrect() {
    this.init();
    this.playTone(523.25, 'triangle', 0.15, 0);   // C5
    this.playTone(659.25, 'triangle', 0.15, 100); // E5
    this.playTone(783.99, 'triangle', 0.3, 200);  // G5
  }

  playWrong() {
    this.init();
    this.playTone(280, 'sawtooth', 0.2, 0);
    this.playTone(220, 'sawtooth', 0.35, 150);
  }

  playClick() {
    this.init();
    this.playTone(400, 'sine', 0.05, 0);
  }

  playBadge() {
    this.init();
    this.playTone(440, 'triangle', 0.15, 0);
    this.playTone(554.37, 'triangle', 0.15, 120);
    this.playTone(659.25, 'triangle', 0.2, 240);
    this.playTone(880, 'triangle', 0.45, 360);
  }

  playCombo() {
    this.init();
    this.playTone(587.33, 'sine', 0.1, 0);
    this.playTone(880, 'sine', 0.25, 80);
  }
}

const sounds = new SoundManager();

// --- 2. GAME STATE ---
const gameState = {
  studentName: "Dũng Sĩ Số Học",
  avatar: "👑",
  score: 0,
  stars: 0,
  streak: 0,
  soundOn: true,
  badges: {
    1: false, // Khởi động
    2: false, // Bậc thầy ước và bội
    3: false, // Chuyên gia cân bằng
    4: false, // Bất bại combo (3 streak)
    5: false  // Hiệp sĩ chia hết (score >= 80)
  },
  quizCurrentIndex: 0,
  quizAnswered: false,
  symbolValues: { 1: "?", 2: "?", 3: "?", 4: "?" }
};

// --- 3. ĐẤU TRƯỜNG QUIZ DATA (10 CÂU BÁM SÁT BÀI TẬP SGK TR. 33) ---
const quizData = [
  {
    type: "🏷️ Bài tập 2.1 SGK: Tập hợp ước",
    title: "Tập hợp tất cả các ước của số 30, kí hiệu là Ư(30), gồm những số nào?",
    options: [
      { text: "A. {1; 2; 3; 5; 6; 10; 15; 30}", correct: true },
      { text: "B. {2; 3; 5; 6; 10; 15}", correct: false },
      { text: "C. {0; 1; 2; 3; 5; 6; 10; 15; 30}", correct: false },
      { text: "D. {1; 3; 5; 10; 15; 30}", correct: false }
    ],
    explanation: "Đúng rồi! Ư(30) = {1; 2; 3; 5; 6; 10; 15; 30}. Lưu ý: Số 0 không bao giờ là ước của bất kỳ số nào."
  },
  {
    type: "🏷️ Bài tập 2.1 SGK: Tập hợp ước",
    title: "Tập hợp các ước của số 17 là:",
    options: [
      { text: "A. Ư(17) = {17}", correct: false },
      { text: "B. Ư(17) = {1; 17}", correct: true },
      { text: "C. Ư(17) = {0; 1; 17}", correct: false },
      { text: "D. Ư(17) = {1; 2; 17}", correct: false }
    ],
    explanation: "Chính xác! 17 là số chỉ chia hết cho 1 và chính nó, do đó Ư(17) = {1; 17}."
  },
  {
    type: "🏷️ Bài tập 2.2 SGK: Xác định bội",
    title: "Trong ba số 16; 24; 35, những số nào là BỘI của 4?",
    options: [
      { text: "A. Chỉ có số 16", correct: false },
      { text: "B. Cả ba số 16; 24; 35", correct: false },
      { text: "C. Số 16 và số 24", correct: true },
      { text: "D. Số 24 và số 35", correct: false }
    ],
    explanation: "Rất chuẩn! 16 = 4 · 4 nên 16 là bội của 4; 24 = 4 · 6 nên 24 là bội của 4; 35 chia 4 dư 3 nên không phải bội của 4."
  },
  {
    type: "🏷️ Bài tập 2.3a SGK: Tìm x theo bội",
    title: "Tìm các số tự nhiên x sao cho x ∈ B(7) và x < 70:",
    options: [
      { text: "A. {7; 14; 21; 28; 35; 42; 49; 56; 63}", correct: false },
      { text: "B. {0; 7; 14; 21; 28; 35; 42; 49; 56; 63}", correct: true },
      { text: "C. {0; 7; 14; 21; 28; 35; 42; 49; 56; 63; 70}", correct: false },
      { text: "D. {1; 7; 14; 21; 28; 35; 42; 49; 56; 63}", correct: false }
    ],
    explanation: "Tuyệt vời! Bội của 7 là kết quả nhân 7 với 0; 1; 2; 3; 4; 5; 6; 7; 8; 9. Đừng quên số 0 là bội của mọi số tự nhiên khác 0 và x < 70 nên không lấy 70!"
  },
  {
    type: "🏷️ Bài tập 2.3b SGK: Tìm y theo ước",
    title: "Tìm các số tự nhiên y sao cho y ∈ Ư(50) và y > 5:",
    options: [
      { text: "A. y ∈ {10; 25; 50}", correct: true },
      { text: "B. y ∈ {5; 10; 25; 50}", correct: false },
      { text: "C. y ∈ {10; 20; 50}", correct: false },
      { text: "D. y ∈ {15; 25; 50}", correct: false }
    ],
    explanation: "Chính xác! Ư(50) = {1; 2; 5; 10; 25; 50}. Điều kiện y > 5 nên ta chọn y ∈ {10; 25; 50}."
  },
  {
    type: "🏷️ Bài tập 2.4 SGK: Tính chất chia hết của tổng",
    title: "Không thực hiện phép tính, hãy cho biết tổng nào sau đây CHIA HẾT cho 5?",
    options: [
      { text: "A. 15 + 1 975 + 2 019", correct: false },
      { text: "B. 20 + 90 + 2 025 + 2 050", correct: true },
      { text: "C. 5 + 25 + 34", correct: false },
      { text: "D. Cả A và B đều chia hết cho 5", correct: false }
    ],
    explanation: "Đúng rồi! Vì 20, 90, 2 025, 2 050 đều có tận cùng là 0 hoặc 5 (chia hết cho 5) nên theo Tính chất 1, cả tổng chia hết cho 5."
  },
  {
    type: "🏷️ Bài tập 2.5 SGK: Tính chất chia hết của hiệu",
    title: "Không thực hiện phép tính, hiệu nào sau đây chia hết cho 8?",
    options: [
      { text: "A. 100 - 40", correct: false },
      { text: "B. 80 - 16", correct: true },
      { text: "C. 64 - 15", correct: false },
      { text: "D. 88 - 25", correct: false }
    ],
    explanation: "Chính xác! 80 ⋮ 8 và 16 ⋮ 8 nên (80 - 16) ⋮ 8. Ở câu A, 100 không chia hết cho 8 nên hiệu 100 - 40 không chia hết cho 8."
  },
  {
    type: "🏷️ Bài tập 2.6 SGK: Khẳng định đúng sai",
    title: "Khẳng định nào sau đây là khẳng định ĐÚNG?",
    options: [
      { text: "A. (219 · 7 + 8) chia hết cho 7", correct: false },
      { text: "B. (8 · 12 + 9) chia hết cho 3", correct: true },
      { text: "C. (15 · 4 + 7) chia hết cho 5", correct: false },
      { text: "D. (6 · 11 - 5) chia hết cho 6", correct: false }
    ],
    explanation: "Quá đỉnh! Vì 12 ⋮ 3 nên (8 · 12) ⋮ 3; lại có 9 ⋮ 3. Do đó (8 · 12 + 9) ⋮ 3 (Tính chất 1)."
  },
  {
    type: "🏷️ Bài tập 2.7 SGK: Chia nhóm học tập",
    title: "Cô giáo muốn chia đều 40 học sinh thành các nhóm dự án. Trường hợp nào sau đây KHÔNG THỂ chia đều được?",
    options: [
      { text: "A. Chia thành 4 nhóm (mỗi nhóm 10 bạn)", correct: false },
      { text: "B. Chia thành 8 nhóm (mỗi nhóm 5 bạn)", correct: false },
      { text: "C. Chia thành 6 nhóm", correct: true },
      { text: "D. Chia mỗi nhóm 4 bạn (được 10 nhóm)", correct: false }
    ],
    explanation: "Đúng! Vì 40 không chia hết cho 6 (40 : 6 = 6 dư 4) nên không thể chia đều 40 học sinh thành 6 nhóm."
  },
  {
    type: "🏷️ Bài tập 2.9a SGK: Tìm x để hiệu chia hết",
    title: "Tìm x thuộc tập {23; 24; 25; 26}, biết rằng (56 - x) chia hết cho 8?",
    options: [
      { text: "A. x = 23", correct: false },
      { text: "B. x = 24", correct: true },
      { text: "C. x = 25", correct: false },
      { text: "D. x = 26", correct: false }
    ],
    explanation: "Xuất sắc! Vì 56 ⋮ 8 nên để (56 - x) ⋮ 8 thì x cũng phải chia hết cho 8. Trong tập hợp đã cho, chỉ có số 24 chia hết cho 8 (24 = 8 · 3). Vậy x = 24."
  }
];

// --- 4. START SCREEN & INITIALIZATION ---
function initStartModal() {
  const avatarOptions = document.querySelectorAll('.avatar-option');
  avatarOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      avatarOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      gameState.avatar = opt.dataset.avatar;
      sounds.playClick();
    });
  });

  const today = new Date();
  const dateStr = `${today.getDate()} tháng ${today.getMonth() + 1}, ${today.getFullYear()}`;
  const certDateEl = document.getElementById('cert-date-display');
  if (certDateEl) certDateEl.innerText = dateStr;
}

function startGame() {
  const nameInput = document.getElementById('student-name-input');
  if (nameInput && nameInput.value.trim() !== '') {
    gameState.studentName = nameInput.value.trim();
  }
  document.getElementById('hud-avatar-display').innerText = gameState.avatar;
  document.getElementById('hud-name-display').innerText = gameState.studentName;
  document.getElementById('cert-student-name-display').innerText = gameState.studentName;

  document.getElementById('start-modal').classList.add('hidden');
  sounds.playBadge();
  triggerConfetti(30);
  renderQuizQuestion();
}

function updateHUD() {
  document.getElementById('hud-score').innerText = gameState.score;
  document.getElementById('hud-stars').innerText = gameState.stars;
  document.getElementById('hud-streak').innerText = gameState.streak;

  const streakBadge = document.getElementById('hud-streak-badge');
  if (gameState.streak >= 2) {
    streakBadge.classList.add('combo-active');
  } else {
    streakBadge.classList.remove('combo-active');
  }

  // Update Rank
  let rank = "Tập Sự Chia Hết";
  if (gameState.score >= 120) rank = "Đại Tướng Số Học";
  else if (gameState.score >= 80) rank = "Hiệp Sĩ Chia Hết";
  else if (gameState.score >= 40) rank = "Chiến Binh Ước Bội";

  document.getElementById('hud-rank-display').innerText = rank;
  document.getElementById('cert-score-display').innerText = gameState.score;
  document.getElementById('cert-stars-display').innerText = gameState.stars;
  document.getElementById('cert-rank-display').innerText = rank;
}

function toggleSound() {
  gameState.soundOn = !gameState.soundOn;
  sounds.enabled = gameState.soundOn;
  document.getElementById('btn-sound-toggle').innerText = gameState.soundOn ? "🔊" : "🔇";
}

function scrollToCertificate() {
  const el = document.getElementById('chung-nhan-vinh-danh');
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// --- 5. UNLOCK BADGES ---
function unlockBadge(id) {
  if (gameState.badges[id]) return;
  gameState.badges[id] = true;
  const badgeEl = document.getElementById(`badge-${id}`);
  if (badgeEl) {
    badgeEl.classList.remove('locked');
    badgeEl.classList.add('unlocked');
  }
  sounds.playBadge();
  triggerConfetti(40);
}

// --- 6. SECTION 1: KHỞI ĐỘNG (BÚT 6A) ---
function checkIntroAnswer(ans, btn) {
  const container = document.getElementById('intro-options');
  const buttons = container.querySelectorAll('.iq-btn');
  buttons.forEach(b => b.classList.remove('correct', 'wrong'));

  const fb = document.getElementById('intro-feedback');
  fb.classList.remove('show');

  if (ans === 'no') {
    btn.classList.add('correct');
    fb.style.background = "#dcfce7";
    fb.style.color = "#166534";
    fb.style.border = "1.5px solid #86efac";
    fb.innerHTML = "🎉 <strong>CHÍNH XÁC 100%!</strong> Vì 4 hộp bút chia đều cho 4 tổ thì mỗi tổ được đúng 1 hộp (dù mỗi hộp có bao nhiêu cái). Nhưng 50 chiếc bút rời thì không chia hết cho 4 (50 : 4 = 12 dư 2)! Vậy chắc chắn <strong>KHÔNG THỂ chia đều</strong> cho 4 tổ được!";
    fb.classList.add('show');
    gameState.score += 15;
    gameState.stars += 1;
    updateHUD();
    sounds.playCorrect();
    unlockBadge(1);
  } else {
    btn.classList.add('wrong');
    fb.style.background = "#fee2e2";
    fb.style.color = "#991b1b";
    fb.style.border = "1.5px solid #fca5a5";
    fb.innerHTML = "❌ <strong>Chưa đúng rồi!</strong> Chú ý rằng 50 chiếc bút lẻ không chia hết cho 4 (50 chia 4 dư 2), trong khi 4 hộp bút đã chia hết cho 4. Hãy thử chọn lại đáp án đúng nhé!";
    fb.classList.add('show');
    sounds.playWrong();
  }
}

// --- 7. SECTION 2: ĐIỀN KÍ HIỆU CHIA HẾT (⋮ hoặc ∤) ---
function cycleSymbol(idx) {
  sounds.playClick();
  const el = document.getElementById(`sym-${idx}`);
  const current = gameState.symbolValues[idx];
  let next = "⋮";
  if (current === "⋮") next = "∤";
  else if (current === "∤") next = "?";
  gameState.symbolValues[idx] = next;
  el.innerText = next;
  if (next !== "?") el.classList.add('filled');
  else el.classList.remove('filled');
}

function checkSymbolQuiz() {
  const s1 = gameState.symbolValues[1]; // 24 ? 6 -> ⋮
  const s2 = gameState.symbolValues[2]; // 45 ? 10 -> ∤
  const s3 = gameState.symbolValues[3]; // 35 ? 5 -> ⋮
  const s4 = gameState.symbolValues[4]; // 42 ? 4 -> ∤

  const fb = document.getElementById('symbol-feedback');
  fb.classList.remove('show');

  if (s1 === "⋮" && s2 === "∤" && s3 === "⋮" && s4 === "∤") {
    fb.style.background = "#dcfce7";
    fb.style.color = "#166534";
    fb.style.border = "1.5px solid #86efac";
    fb.innerHTML = "🎉 <strong>CHÍNH XÁC XUẤT SẮC!</strong><br>• 24 ⋮ 6 (vì 24 = 6 · 4)<br>• 45 ∤ 10 (vì 45 chia 10 dư 5)<br>• 35 ⋮ 5 (vì 35 = 5 · 7)<br>• 42 ∤ 4 (vì 42 chia 4 dư 2)";
    fb.classList.add('show');
    gameState.score += 20;
    gameState.stars += 1;
    updateHUD();
    sounds.playCorrect();
    triggerConfetti(25);
  } else {
    fb.style.background = "#fee2e2";
    fb.style.color = "#991b1b";
    fb.style.border = "1.5px solid #fca5a5";
    fb.innerHTML = "❌ <strong>Có ô chưa chính xác hoặc còn để dấu '?'</strong>. Bạn hãy bấm vào ô để đổi kí hiệu: 24 có chia hết cho 6 không? 45 có chia hết cho 10 không? Thử lại nhé!";
    fb.classList.add('show');
    sounds.playWrong();
  }
}

// --- 8. SECTION 3: CỖ MÁY ƯỚC & BỘI + THỬ THÁCH NHỎ ---
function runMachineFindFactors() {
  sounds.playClick();
  const input = document.getElementById('machine-num');
  const num = parseInt(input.value);
  if (isNaN(num) || num <= 0) return;

  const chipsContainer = document.getElementById('machine-chips');
  chipsContainer.innerHTML = '';
  document.getElementById('machine-result-title').innerText = `Tất cả các ước của ${num} (Tập hợp Ư(${num})):`;

  const factors = [];
  for (let i = 1; i <= num; i++) {
    if (num % i === 0) factors.push(i);
  }

  factors.forEach((f, idx) => {
    setTimeout(() => {
      const chip = document.createElement('span');
      chip.className = 'chip-number';
      chip.innerText = f;
      chipsContainer.appendChild(chip);
      sounds.playTone(400 + idx * 30, 'sine', 0.08);
    }, idx * 60);
  });
}

function runMachineFindMultiples() {
  sounds.playClick();
  const input = document.getElementById('machine-num');
  const num = parseInt(input.value);
  if (isNaN(num) || num <= 0) return;

  const chipsContainer = document.getElementById('machine-chips');
  chipsContainer.innerHTML = '';
  document.getElementById('machine-result-title').innerText = `10 bội đầu tiên của ${num} (Tập hợp B(${num})):`;

  for (let i = 0; i < 10; i++) {
    setTimeout(() => {
      const chip = document.createElement('span');
      chip.className = 'chip-number';
      chip.innerText = num * i;
      chipsContainer.appendChild(chip);
      sounds.playTone(350 + i * 40, 'triangle', 0.08);
    }, i * 60);
  }
}

function checkChallenge12() {
  const input = document.getElementById('challenge-input-12').value.trim();
  const fb = document.getElementById('challenge-12-feedback');
  fb.classList.remove('show');

  // Ước của 12 là 1, 2, 3, 4, 6, 12. Tổng 3 ước bằng 12: 2 + 4 + 6 = 12
  const nums = input.split(/[,;\s]+/).map(n => parseInt(n)).filter(n => !isNaN(n));
  nums.sort((a, b) => a - b);

  if (nums.length === 3 && nums[0] === 2 && nums[1] === 4 && nums[2] === 6) {
    fb.style.background = "#dcfce7";
    fb.style.color = "#166534";
    fb.style.border = "1.5px solid #86efac";
    fb.innerHTML = "🎉 <strong>XUẤT SẮC!</strong> Ba ước đó chính là: <strong>2, 4, 6</strong> (vì 2 + 4 + 6 = 12)! Bạn đã mở khóa Huy Hiệu Bậc Thầy Ước & Bội!";
    fb.classList.add('show');
    gameState.score += 20;
    gameState.stars += 1;
    updateHUD();
    sounds.playCorrect();
    unlockBadge(2);
  } else {
    fb.style.background = "#fee2e2";
    fb.style.color = "#991b1b";
    fb.style.border = "1.5px solid #fca5a5";
    fb.innerHTML = "💡 <strong>Gợi ý:</strong> Tập hợp Ư(12) = {1; 2; 3; 4; 6; 12}. Hãy thử cộng số 2, số 4 và số 6 xem sao nhé!";
    fb.classList.add('show');
    sounds.playWrong();
  }
}

function checkDebate1(ans, btn) {
  const buttons = btn.parentElement.querySelectorAll('.iq-btn');
  buttons.forEach(b => b.classList.remove('correct', 'wrong'));
  const fb = document.getElementById('debate1-feedback');
  fb.classList.remove('show');

  if (ans === 'vuong') {
    btn.classList.add('correct');
    fb.style.background = "#dcfce7";
    fb.style.color = "#166534";
    fb.style.border = "1.5px solid #86efac";
    fb.innerHTML = "🎉 <strong>CHÍNH XÁC!</strong> Bạn Vuông đúng vì 15 ⋮ 5 (15 = 5 · 3 nên 5 là ước của 15). Bạn Tròn sai vì 15 không chia hết cho 6 (15 chia 6 bằng 2 dư 3) nên 6 không phải là ước của 15!";
    fb.classList.add('show');
    gameState.score += 10;
    updateHUD();
    sounds.playCorrect();
  } else {
    btn.classList.add('wrong');
    fb.style.background = "#fee2e2";
    fb.style.color = "#991b1b";
    fb.style.border = "1.5px solid #fca5a5";
    fb.innerHTML = "❌ <strong>Chưa chính xác.</strong> 15 chia cho 6 có còn dư không nhỉ? (15 : 6 = 2 dư 3). Vậy 6 có phải là ước của 15 không?";
    fb.classList.add('show');
    sounds.playWrong();
  }
}

// --- 9. SECTION 4: TRANH LUẬN TÍNH CHẤT CHIA HẾT CỦA TỔNG ---
function checkDebate2(ans, btn) {
  const buttons = btn.parentElement.querySelectorAll('.iq-btn');
  buttons.forEach(b => b.classList.remove('correct', 'wrong'));
  const fb = document.getElementById('debate2-feedback');
  fb.classList.remove('show');

  if (ans === 'tron') {
    btn.classList.add('correct');
    fb.style.background = "#dcfce7";
    fb.style.color = "#166534";
    fb.style.border = "1.5px solid #86efac";
    fb.innerHTML = "🌟 <strong>SIÊU LOGIC! Bạn Tròn hoàn toàn đúng!</strong><br>Đây là cái bẫy kinh điển: Tính chất chia hết chỉ khẳng định: 'Nếu có MỘT số hạng không chia hết, các số hạng còn lại đều chia hết thì tổng mới không chia hết'.<br>Nếu CẢ HAI số cùng không chia hết thì tổng <strong>VẪN CÓ THỂ CHIA HẾT</strong>! Ví dụ: 2 ∤ 4 và 6 ∤ 4 nhưng 2 + 6 = 8 ⋮ 4; hoặc 1 + 3 = 4 ⋮ 4!";
    fb.classList.add('show');
    gameState.score += 20;
    gameState.stars += 1;
    updateHUD();
    sounds.playCorrect();
    unlockBadge(3);
  } else {
    btn.classList.add('wrong');
    fb.style.background = "#fee2e2";
    fb.style.color = "#991b1b";
    fb.style.border = "1.5px solid #fca5a5";
    fb.innerHTML = "❌ <strong>Mắc bẫy rồi!</strong> Thử lấy ví dụ số 2 và số 6: Cả hai đều không chia hết cho 4. Nhưng tổng 2 + 6 = 8 có chia hết cho 4 không? Có chứ! Vậy phát biểu của bạn Vuông là SAI!";
    fb.classList.add('show');
    sounds.playWrong();
  }
}

// --- 10. SECTION 5: ĐẤU TRƯỜNG QUIZ 10 CÂU ---
function renderQuizQuestion() {
  gameState.quizAnswered = false;
  const q = quizData[gameState.quizCurrentIndex];

  document.getElementById('quiz-badge-counter').innerText = `Câu ${gameState.quizCurrentIndex + 1} / ${quizData.length}`;
  document.getElementById('quiz-progress').style.width = `${((gameState.quizCurrentIndex + 1) / quizData.length) * 100}%`;
  document.getElementById('quiz-question-type').innerText = q.type;
  document.getElementById('quiz-question-title').innerText = q.title;

  const container = document.getElementById('quiz-answers-container');
  container.innerHTML = '';

  const expBox = document.getElementById('quiz-explanation');
  expBox.className = 'quiz-explanation-box';
  expBox.innerHTML = '';

  document.getElementById('btn-next-quiz').style.display = 'none';

  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-answer-btn';
    btn.innerText = opt.text;
    btn.onclick = () => selectQuizAnswer(idx, btn);
    container.appendChild(btn);
  });
}

function selectQuizAnswer(idx, selectedBtn) {
  if (gameState.quizAnswered) return;
  gameState.quizAnswered = true;

  const q = quizData[gameState.quizCurrentIndex];
  const buttons = document.querySelectorAll('.quiz-answer-btn');

  if (q.options[idx].correct) {
    selectedBtn.classList.add('selected-correct');
    gameState.score += 10;
    gameState.streak += 1;
    if (gameState.streak % 3 === 0) gameState.stars += 1;

    sounds.playCorrect();
    if (gameState.streak >= 3) {
      sounds.playCombo();
      unlockBadge(4); // Bất bại combo
    }
  } else {
    selectedBtn.classList.add('selected-wrong');
    gameState.streak = 0;
    sounds.playWrong();

    // Hiển thị đáp án đúng
    q.options.forEach((opt, i) => {
      if (opt.correct) {
        buttons[i].classList.add('selected-correct');
      }
    });
  }

  // Hiển thị lời giải thích
  const expBox = document.getElementById('quiz-explanation');
  expBox.innerHTML = `<strong>💡 Lời giải chi tiết:</strong> ${q.explanation}`;
  expBox.classList.add('show');

  updateHUD();

  // Kiểm tra badge 5
  if (gameState.score >= 80) {
    unlockBadge(5);
  }

  // Nút câu tiếp theo
  const nextBtn = document.getElementById('btn-next-quiz');
  if (gameState.quizCurrentIndex < quizData.length - 1) {
    nextBtn.innerText = "Câu Tiếp Theo ➡️";
  } else {
    nextBtn.innerText = "🎉 Hoàn Thành Đấu Trường!";
  }
  nextBtn.style.display = 'inline-block';
}

function nextQuestion() {
  sounds.playClick();
  if (gameState.quizCurrentIndex < quizData.length - 1) {
    gameState.quizCurrentIndex++;
    renderQuizQuestion();
  } else {
    // Hoàn thành quiz
    triggerConfetti(100);
    sounds.playBadge();
    scrollToCertificate();
  }
}

// --- 11. CONFETTI CELEBRATION ENGINE ---
function triggerConfetti(count = 50) {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#f59e0b', '#d97706', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6'];

  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.4,
      r: Math.random() * 6 + 4,
      d: Math.random() * count,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
      tiltAngle: 0
    });
  }

  let animationFrame;
  let ticks = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.tilt = Math.sin(p.tiltAngle - (i / 3)) * 15;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + (p.r / 2), p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + (p.r / 2));
      ctx.stroke();
    }

    ticks++;
    if (ticks < 120) {
      animationFrame = requestAnimationFrame(draw);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      cancelAnimationFrame(animationFrame);
    }
  }

  draw();
}

function restartLesson() {
  sounds.playClick();
  gameState.score = 0;
  gameState.stars = 0;
  gameState.streak = 0;
  gameState.quizCurrentIndex = 0;
  gameState.quizAnswered = false;
  gameState.symbolValues = { 1: "?", 2: "?", 3: "?", 4: "?" };

  for (let i = 1; i <= 4; i++) {
    const el = document.getElementById(`sym-${i}`);
    if (el) {
      el.innerText = "?";
      el.classList.remove('filled');
    }
  }

  for (let i = 1; i <= 5; i++) {
    gameState.badges[i] = false;
    const badgeEl = document.getElementById(`badge-${i}`);
    if (badgeEl) {
      badgeEl.classList.remove('unlocked');
      badgeEl.classList.add('locked');
    }
  }

  updateHUD();
  document.getElementById('start-modal').classList.remove('hidden');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  initStartModal();
  updateHUD();
});
