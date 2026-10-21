/* ==========================================================================
   BÀI 9: DẤU HIỆU CHIA HẾT - TOÁN 6 KẾT NỐI TRI THỨC
   Logic Tương Tác, Web Audio API, Cỗ Máy Quét, Mê Cung Số & Đấu Trường Quiz
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
      if (AudioCtx) this.ctx = new AudioCtx();
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
    this.playTone(450, 'sine', 0.05, 0);
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
  studentName: "Kỵ Sĩ Tính Nhẩm",
  avatar: "✨",
  score: 0,
  stars: 0,
  streak: 0,
  soundOn: true,
  badges: {
    1: false, // Khởi động
    2: false, // Bậc thầy chữ số cuối
    3: false, // Kỹ sư trồng dừa
    4: false, // Thám hiểm mê cung
    5: false  // Kỵ sĩ tính nhẩm (score >= 80)
  },
  quizCurrentIndex: 0,
  quizAnswered: false,
  mazeCurrentPos: { r: 1, c: 0 },
  mazeVisited: []
};

// --- 3. ĐẤU TRƯỜNG QUIZ DATA (10 CÂU BÁM SÁT SGK TRANG 37) ---
const quizData = [
  {
    type: "🏷️ Bài tập 2.10 SGK: Dấu hiệu chia hết cho 2",
    title: "Trong các số: 324; 248; 2 020; 2 025, những số nào chia hết cho 2?",
    options: [
      { text: "A. 324; 248 và 2 020", correct: true },
      { text: "B. Chỉ có số 2 020", correct: false },
      { text: "C. Cả 4 số", correct: false },
      { text: "D. 248 và 2 025", correct: false }
    ],
    explanation: "Chính xác! Các số 324 (tận cùng 4), 248 (tận cùng 8), 2 020 (tận cùng 0) đều có chữ số tận cùng là số chẵn nên chia hết cho 2. Số 2 025 có tận cùng là 5 lẻ nên không chia hết cho 2."
  },
  {
    type: "🏷️ Bài tập 2.10 SGK: Dấu hiệu chia hết cho 5",
    title: "Cũng trong 4 số trên: 324; 248; 2 020; 2 025, những số nào chia hết cho 5?",
    options: [
      { text: "A. Chỉ có số 2 025", correct: false },
      { text: "B. 2 020 và 2 025", correct: true },
      { text: "C. 324 và 2 020", correct: false },
      { text: "D. Cả 4 số", correct: false }
    ],
    explanation: "Rất chuẩn! Dấu hiệu chia hết cho 5 là chữ số tận cùng là 0 hoặc 5. Do đó 2 020 và 2 025 chia hết cho 5."
  },
  {
    type: "🏷️ Bài tập 2.11 SGK: Dấu hiệu chia hết cho 9",
    title: "Trong các số: 450; 123; 2 019; 2 025, những số nào chia hết cho 9?",
    options: [
      { text: "A. 450 và 2 025", correct: true },
      { text: "B. 123 và 2 019", correct: false },
      { text: "C. Chỉ có 450", correct: false },
      { text: "D. Cả 4 số", correct: false }
    ],
    explanation: "Đúng rồi! Tính tổng các chữ số:<br>• 450: 4 + 5 + 0 = 9 ⋮ 9 ⇒ 450 ⋮ 9.<br>• 123: 1 + 2 + 3 = 6 ∤ 9.<br>• 2 019: 2 + 0 + 1 + 9 = 12 ∤ 9.<br>• 2 025: 2 + 0 + 2 + 5 = 9 ⋮ 9 ⇒ 2 025 ⋮ 9."
  },
  {
    type: "🏷️ Bài tập 2.11 SGK: Dấu hiệu chia hết cho 3",
    title: "Trong 4 số: 450; 123; 2 019; 2 025, những số nào chia hết cho 3?",
    options: [
      { text: "A. Chỉ có 450 và 2 025", correct: false },
      { text: "B. Cả bốn số 450; 123; 2 019; 2 025", correct: true },
      { text: "C. 123 và 2 019", correct: false },
      { text: "D. Không có số nào", correct: false }
    ],
    explanation: "Tuyệt vời! Tổng các chữ số của 4 số lần lượt là: 9; 6; 12; 9. Cả 4 tổng này đều chia hết cho 3, nên TẤT CẢ 4 số đều chia hết cho 3!"
  },
  {
    type: "🏷️ Bài tập 2.12 SGK: Chia nhóm dã ngoại",
    title: "Khối 6 có 290 học sinh đi dã ngoại. Cô phụ trách muốn chia đều thành 9 nhóm. Hỏi cô có chia nhóm được như vậy không?",
    options: [
      { text: "A. Được, vì 290 chia hết cho 9", correct: false },
      { text: "B. KHÔNG ĐƯỢC, vì tổng các chữ số 2 + 9 + 0 = 11 không chia hết cho 9", correct: true },
      { text: "C. Được, mỗi nhóm 30 bạn", correct: false },
      { text: "D. Cần biết số học sinh nam và nữ mới trả lời được", correct: false }
    ],
    explanation: "Chính xác! Tổng các chữ số của 290 là 2 + 9 + 0 = 11, mà 11 không chia hết cho 9 nên 290 không chia hết cho 9. Do đó không thể chia đều thành 9 nhóm."
  },
  {
    type: "🏷️ Bài tập 2.13 SGK: Chia đội bóng đá",
    title: "Có 162 học sinh tham gia đào tạo bóng đá, chia thành các đội 9 học sinh. Hỏi có đội nào không đủ 9 học sinh hay không?",
    options: [
      { text: "A. Có 1 đội bị thiếu người", correct: false },
      { text: "B. KHÔNG có đội nào thiếu (chia vừa đủ 18 đội vì 162 ⋮ 9)", correct: true },
      { text: "C. Có 2 đội thiếu người", correct: false },
      { text: "D. Không thể tính được", correct: false }
    ],
    explanation: "Quá xuất sắc! Số 162 có 1 + 6 + 2 = 9 ⋮ 9 nên 162 chia hết cho 9 (162 : 9 = 18). Vậy chia vừa khít thành 18 đội, không đội nào thiếu người!"
  },
  {
    type: "🏷️ Bài tập 2.14d SGK: Thay dấu *",
    title: "Thay dấu * bởi một chữ số thích hợp để số 345* chia hết cho 9:",
    options: [
      { text: "A. * = 3", correct: false },
      { text: "B. * = 6", correct: true },
      { text: "C. * = 9", correct: false },
      { text: "D. * = 0", correct: false }
    ],
    explanation: "Đúng! Tổng các chữ số: 3 + 4 + 5 + * = 12 + *. Để 12 + * chia hết cho 9 thì * chỉ có thể bằng 6 (vì 12 + 6 = 18 ⋮ 9)."
  },
  {
    type: "🏷️ Bài tập 2.14b SGK: Thay dấu *",
    title: "Thay dấu * bởi một chữ số để số 345* chia hết cho 3:",
    options: [
      { text: "A. * ∈ {0; 3; 6; 9}", correct: true },
      { text: "B. Chỉ có * = 6", correct: false },
      { text: "C. * ∈ {1; 4; 7}", correct: false },
      { text: "D. * ∈ {2; 5; 8}", correct: false }
    ],
    explanation: "Rất chuẩn! Tổng các chữ số: 3 + 4 + 5 + * = 12 + *. Vì 12 đã chia hết cho 3 nên để (12 + *) ⋮ 3 thì * phải là chữ số chia hết cho 3, tức là * ∈ {0; 3; 6; 9}."
  },
  {
    type: "🏷️ Bài tập 2.15 SGK: Lập số chia hết cho 5",
    title: "Dùng ba chữ số 3; 0; 4, viết các số tự nhiên có ba chữ số khác nhau chia hết cho 5:",
    options: [
      { text: "A. {340; 430}", correct: true },
      { text: "B. {304; 403}", correct: false },
      { text: "C. {340; 430; 034; 043}", correct: false },
      { text: "D. {345; 435}", correct: false }
    ],
    explanation: "Chính xác! Để chia hết cho 5, chữ số tận cùng phải là 0 hoặc 5 (ở đây chỉ có số 0). Số có ba chữ số thì hàng trăm phải khác 0. Do đó chỉ lập được 2 số: 340 và 430."
  },
  {
    type: "🏷️ Em có biết (SGK tr. 37): Bản chất toán học",
    title: "Tại sao một số có tổng các chữ số chia hết cho 9 thì chia hết cho 9?",
    options: [
      { text: "A. Vì mọi số đều tách được thành (Tổng chữ số) + (Số chứa các bội 99, 9... luôn chia hết cho 9)", correct: true },
      { text: "B. Đó chỉ là điều ngẫu nhiên trong bảng cửu chương", correct: false },
      { text: "C. Vì 9 là số lẻ lớn nhất có một chữ số", correct: false },
      { text: "D. Do các nhà toán học Hy Lạp tự quy ước mà không cần chứng minh", correct: false }
    ],
    explanation: "Đỉnh cao tư duy! Ví dụ 234 = 2(99 + 1) + 3(9 + 1) + 4 = (2 + 3 + 4) + (2 · 99 + 3 · 9). Vì (2 · 99 + 3 · 9) luôn chia hết cho 9 nên cả số sẽ chia hết cho 9 khi và chỉ khi (2 + 3 + 4) chia hết cho 9!"
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
  runScanner();
  initMaze();
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

  let rank = "Tập Sự Dấu Hiệu";
  if (gameState.score >= 120) rank = "Đại Sư Tính Nhẩm";
  else if (gameState.score >= 80) rank = "Kỵ Sĩ Tính Nhẩm";
  else if (gameState.score >= 40) rank = "Chiến Binh Số Học";

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

// --- 5. SECTION 1: KHỞI ĐỘNG (71 001 : 9) ---
function checkIntroAnswer(ans, btn) {
  const buttons = btn.parentElement.querySelectorAll('.iq-btn');
  buttons.forEach(b => b.classList.remove('correct', 'wrong'));
  const fb = document.getElementById('intro-feedback');
  fb.classList.remove('show');

  if (ans === 'secret') {
    btn.classList.add('correct');
    fb.style.background = "#dcfce7";
    fb.style.color = "#166534";
    fb.style.border = "1.5px solid #86efac";
    fb.innerHTML = "🎉 <strong>CHÍNH XÁC TUYỆT ĐỐI!</strong> Bạn Tròn đã tính nhẩm tổng các chữ số: 7 + 1 + 0 + 0 + 1 = 9. Vì 9 chia hết cho 9 nên số 71 001 chia hết cho 9 mà không cần đặt phép tính chia!";
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
    fb.innerHTML = "❌ <strong>Không phải đâu!</strong> Bạn Tròn không dùng máy tính và cũng không đoán mò. Có một dấu hiệu toán học kỳ diệu về tổng các chữ số, hãy đọc tiếp bài học nhé!";
    fb.classList.add('show');
    sounds.playWrong();
  }
}

// --- 6. SECTION 2: LUYỆN TẬP 1 (2 020 - 938) ---
function checkLt1(ans, btn) {
  const buttons = btn.parentElement.querySelectorAll('.iq-btn');
  buttons.forEach(b => b.classList.remove('correct', 'wrong'));
  const fb = document.getElementById('lt1-feedback');
  fb.classList.remove('show');

  if (ans === 'b') {
    btn.classList.add('correct');
    fb.style.background = "#dcfce7";
    fb.style.color = "#166534";
    fb.style.border = "1.5px solid #86efac";
    fb.innerHTML = "🎉 <strong>ĐÚNG RỒI!</strong> 2 020 có tận cùng là 0 (chẵn ⇒ ⋮ 2) và 938 có tận cùng là 8 (chẵn ⇒ ⋮ 2). Cả hai số đều chia hết cho 2 nên hiệu (2 020 - 938) chia hết cho 2!";
    fb.classList.add('show');
    gameState.score += 15;
    updateHUD();
    sounds.playCorrect();
    unlockBadge(2);
  } else {
    btn.classList.add('wrong');
    fb.style.background = "#fee2e2";
    fb.style.color = "#991b1b";
    fb.style.border = "1.5px solid #fca5a5";
    fb.innerHTML = "❌ <strong>Chưa đúng!</strong> Ở câu A, 1 954 tận cùng 4 chẵn (⋮ 2) nhưng 1 975 tận cùng 5 lẻ (không chia hết cho 2). Chẵn + Lẻ = Lẻ nên tổng không chia hết cho 2!";
    fb.classList.add('show');
    sounds.playWrong();
  }
}

// --- 7. SECTION 3: VẬN DỤNG TRỒNG DỪA ---
function checkCoconutTree() {
  const input = document.getElementById('coconut-trees-input');
  const count = parseInt(input.value);
  const fb = document.getElementById('coconut-feedback');
  fb.classList.remove('show');

  if (count === 13) {
    fb.style.background = "#dcfce7";
    fb.style.color = "#166534";
    fb.style.border = "1.5px solid #86efac";
    fb.innerHTML = "🎉 <strong>CHÍNH XÁC XUẤT SẮC!</strong><br>• Vì 1 + 0 + 8 = 9 ⋮ 9 nên 108 m chia hết cho khoảng cách 9 m.<br>• Số khoảng cách: 108 : 9 = 12 khoảng.<br>• Vì có cây ở cả 2 đầu bờ nên số cây dừa là: 12 + 1 = <strong>13 cây dừa</strong>!";
    fb.classList.add('show');
    gameState.score += 20;
    gameState.stars += 1;
    updateHUD();
    sounds.playCorrect();
    unlockBadge(3);
  } else {
    fb.style.background = "#fee2e2";
    fb.style.color = "#991b1b";
    fb.style.border = "1.5px solid #fca5a5";
    fb.innerHTML = "💡 <strong>Gợi ý:</strong> 108 chia cho 9 bằng 12 khoảng. Nhưng nhớ rằng có cây ở CẢ ĐẦU VÀ CUỐI bờ đất, nên số cây = số khoảng + 1!";
    fb.classList.add('show');
    sounds.playWrong();
  }
}

// --- 8. SECTION 4: MÁY QUÉT DẤU HIỆU CHIA HẾT (MAGIC SCANNER) ---
function runScanner() {
  const input = document.getElementById('scanner-num');
  let num = parseInt(input.value);
  if (isNaN(num)) num = 0;

  const str = Math.abs(num).toString();
  let sum = 0;
  for (let ch of str) sum += parseInt(ch);

  document.getElementById('scanner-sum-display').innerText = `Tổng các chữ số: ${str.split('').join(' + ')} = ${sum}`;

  // Kiểm tra 2: chữ số tận cùng chẵn
  const lastDigit = parseInt(str[str.length - 1]);
  const div2 = [0, 2, 4, 6, 8].includes(lastDigit);
  updateIndicator(2, div2, `Tận cùng là ${lastDigit} (${div2 ? 'Chẵn' : 'Lẻ'})`);

  // Kiểm tra 5: chữ số tận cùng 0 hoặc 5
  const div5 = [0, 5].includes(lastDigit);
  updateIndicator(5, div5, `Tận cùng là ${lastDigit}`);

  // Kiểm tra 3: tổng chữ số chia hết cho 3
  const div3 = sum % 3 === 0;
  updateIndicator(3, div3, `Tổng ${sum} ${div3 ? '⋮ 3' : '∤ 3'}`);

  // Kiểm tra 9: tổng chữ số chia hết cho 9
  const div9 = sum % 9 === 0;
  updateIndicator(9, div9, `Tổng ${sum} ${div9 ? '⋮ 9' : '∤ 9'}`);
}

function updateIndicator(div, isDivisible, text) {
  const card = document.getElementById(`ind-${div}`);
  const status = document.getElementById(`status-${div}`);
  if (isDivisible) {
    card.classList.add('active');
    status.innerHTML = `✅ Chia hết!<br><small>${text}</small>`;
  } else {
    card.classList.remove('active');
    status.innerHTML = `❌ Không chia hết<br><small>${text}</small>`;
  }
}

// --- 9. MÊ CUNG ĐẾN SIÊU THỊ (SGK TRANG 36) ---
// Dữ liệu lưới: 3 hàng, 6 cột
const mazeData = [
  [5, 24, 17, 72, 123, 136],
  ["Hà 👧", 21, 15, 2020, 65, 1245],
  [12, 6, 19, 54, 77, "Siêu Thị 🏪"]
];

function isCellValid(val) {
  if (typeof val === 'string') return true;
  return (val % 2 === 0) || (val % 3 === 0);
}

function initMaze() {
  const gridEl = document.getElementById('maze-grid');
  gridEl.innerHTML = '';
  gameState.mazeVisited = [{ r: 1, c: 0 }];
  gameState.mazeCurrentPos = { r: 1, c: 0 };

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 6; c++) {
      const cell = document.createElement('div');
      cell.className = 'maze-cell';
      cell.dataset.r = r;
      cell.dataset.c = c;
      const val = mazeData[r][c];

      if (r === 1 && c === 0) {
        cell.classList.add('start', 'visited');
        cell.innerText = "Hà 👧";
      } else if (r === 2 && c === 5) {
        cell.classList.add('destination');
        cell.innerText = "🏪";
      } else {
        cell.innerText = val;
      }

      cell.onclick = () => clickMazeCell(r, c, cell);
      gridEl.appendChild(cell);
    }
  }
}

function clickMazeCell(r, c, cellEl) {
  sounds.playClick();
  const cur = gameState.mazeCurrentPos;
  const isAdjacent = (Math.abs(r - cur.r) + Math.abs(c - cur.c)) === 1;

  if (!isAdjacent) {
    showMazeFeedback("⚠️ Hãy đi vào ô liền kề (trên, dưới, trái, phải) với vị trí hiện tại của bạn!", "#fef3c7", "#92400e");
    return;
  }

  const val = mazeData[r][c];
  if (!isCellValid(val)) {
    cellEl.classList.add('invalid');
    sounds.playWrong();
    showMazeFeedback(`❌ Ô ${val} KHÔNG chia hết cho 2 và cũng KHÔNG chia hết cho 3! Không thể đi qua đây.`, "#fee2e2", "#991b1b");
    setTimeout(() => cellEl.classList.remove('invalid'), 800);
    return;
  }

  // Hợp lệ!
  cellEl.classList.add('visited');
  gameState.mazeCurrentPos = { r, c };
  gameState.mazeVisited.push({ r, c });
  sounds.playTone(350 + gameState.mazeVisited.length * 35, 'triangle', 0.1);

  if (r === 2 && c === 5) {
    // Đã tới đích Siêu Thị!
    showMazeFeedback("🎉 <strong>XUẤT SẮC! BẠN ĐÃ GIÚP BẠN HÀ TỚI SIÊU THỊ AN TOÀN!</strong> Tất cả các ô bạn đi qua đều chia hết cho 2 hoặc 3!", "#dcfce7", "#166534");
    sounds.playBadge();
    triggerConfetti(60);
    gameState.score += 25;
    gameState.stars += 1;
    updateHUD();
    unlockBadge(4);
  } else {
    showMazeFeedback(`✅ Bước đi tuyệt vời! Ô ${val} chia hết cho ${val % 2 === 0 ? '2' : ''}${val % 2 === 0 && val % 3 === 0 ? ' và ' : ''}${val % 3 === 0 ? '3' : ''}. Tiếp tục nào!`, "#f0fdf4", "#15803d");
  }
}

function showMazeFeedback(msg, bg, color) {
  const fb = document.getElementById('maze-feedback');
  fb.style.background = bg;
  fb.style.color = color;
  fb.style.border = `1.5px solid ${color}40`;
  fb.innerHTML = msg;
  fb.classList.add('show');
}

function resetMaze() {
  sounds.playClick();
  initMaze();
  const fb = document.getElementById('maze-feedback');
  fb.classList.remove('show');
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
    }
  } else {
    selectedBtn.classList.add('selected-wrong');
    gameState.streak = 0;
    sounds.playWrong();

    q.options.forEach((opt, i) => {
      if (opt.correct) buttons[i].classList.add('selected-correct');
    });
  }

  const expBox = document.getElementById('quiz-explanation');
  expBox.innerHTML = `<strong>💡 Lời giải chi tiết:</strong> ${q.explanation}`;
  expBox.classList.add('show');

  updateHUD();

  if (gameState.score >= 80) {
    unlockBadge(5);
  }

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
  const colors = ['#10b981', '#059669', '#0284c7', '#f59e0b', '#ec4899', '#8b5cf6'];

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

document.addEventListener('DOMContentLoaded', () => {
  initStartModal();
  updateHUD();
});
