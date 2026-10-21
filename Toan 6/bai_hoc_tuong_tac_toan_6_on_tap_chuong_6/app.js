/* =========================================================
   ÔN TẬP CUỐI CHƯƠNG VI: PHÂN SỐ - APP.JS
   Gamification Engine, Sound Synthesizer & Milestone Labs
   ========================================================= */

// --- ÂM THANH WEB AUDIO SYNTHESIZER ---
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCorrect() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);       // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  playWrong() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.setValueAtTime(200, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playBadge() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const freqs = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.18, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  }

  playClick() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

const sound = new SoundSystem();

// --- STATE MANAGEMENT ---
const gameState = {
  studentName: 'Đại Kiện Tướng Phân Số Lớp 6',
  avatar: '👑',
  score: 0,
  stars: 0,
  streak: 0,
  answeredQuestions: new Set(),
  unlockedBadges: new Set()
};

// --- DANH SÁCH 10 CÂU HỎI ĐẤU TRƯỜNG SGK (BÀI 6.44 – 6.50) ---
const quizData = [
  {
    id: 1,
    title: 'Bài 6.44: Điền Số Thích Hợp Cho Chuỗi Phân Số Bằng Nhau',
    question: 'Tìm các số thích hợp lần lượt điền vào dấu ? trong chuỗi: -10/16 = ?/8 = -35/? = ?/32 = 50/?',
    options: [
      { text: '-5 ; 56 ; -20 ; -80', correct: true },
      { text: '5 ; 56 ; 20 ; 80', correct: false },
      { text: '-5 ; 48 ; -20 ; -70', correct: false },
      { text: '-10 ; 56 ; -20 ; -80', correct: false }
    ],
    hint: 'Rút gọn -10/16 = -5/8. Nhân với 7: -35/56; nhân với 4: -20/32; nhân với (-10): 50/(-80).',
    explanation: 'Ta có -10/16 = -5/8 = -35/56 = -20/32 = 50/(-80). Vậy các số cần điền là -5; 56; -20; -80.'
  },
  {
    id: 2,
    title: 'Bài 6.45a: Tính Hợp Lý Biểu Thức A',
    question: 'Tính giá trị: A = (-3/4) · 3/7 + (-3/4) · 4/7 + 1/2',
    options: [
      { text: '-1/4', correct: true },
      { text: '1/4', correct: false },
      { text: '-3/4', correct: false },
      { text: '0', correct: false }
    ],
    hint: 'Đặt (-3/4) làm nhân tử chung: (-3/4) · (3/7 + 4/7) + 1/2 = -3/4 + 2/4 = -1/4.',
    explanation: 'A = (-3/4) · (3/7 + 4/7) + 1/2 = (-3/4) · 1 + 1/2 = -3/4 + 2/4 = -1/4.'
  },
  {
    id: 3,
    title: 'Bài 6.45b: Tính Hợp Lý Biểu Thức B',
    question: 'Tính giá trị: B = (11/15) · 4/9 + (11/15) · 5/9 - 1/15',
    options: [
      { text: '2/3', correct: true },
      { text: '10/15 (chưa rút gọn)', correct: false },
      { text: '1/3', correct: false },
      { text: '11/15', correct: false }
    ],
    hint: '(11/15) · (4/9 + 5/9) - 1/15 = 11/15 · 1 - 1/15 = 10/15 = 2/3.',
    explanation: 'B = (11/15) · (4/9 + 5/9) - 1/15 = 11/15 - 1/15 = 10/15 = 2/3.'
  },
  {
    id: 4,
    title: 'Bài 6.46: Lượng Sữa Còn Lại Của Nam',
    question: 'Hộp sữa tươi dung tích 1 000 ml. Ngày thứ nhất Nam uống 1/5 hộp, ngày thứ hai uống tiếp 1/4 hộp. Sau 2 ngày trong hộp còn lại bao nhiêu ml sữa?',
    options: [
      { text: '550 ml', correct: true },
      { text: '450 ml', correct: false },
      { text: '600 ml', correct: false },
      { text: '500 ml', correct: false }
    ],
    hint: 'Tổng sữa đã uống: 1/5 + 1/4 = 9/20 hộp. Còn lại: 1 - 9/20 = 11/20 hộp = 1 000 · 11/20 = 550 ml.',
    explanation: 'Phần sữa đã uống: 1/5 + 1/4 = 9/20 hộp (tức 450 ml). Phần sữa còn lại là 1 000 - 450 = 550 ml.'
  },
  {
    id: 5,
    title: 'Bài 6.47: Khối Lượng Cà Chua Ban Đầu',
    question: 'Một người bán được 20 kg cà chua, chiếm 2/5 tổng số cà chua mang đi bán. Hỏi ban đầu người đó mang đi bán bao nhiêu kg cà chua?',
    options: [
      { text: '50 kg', correct: true },
      { text: '8 kg', correct: false },
      { text: '40 kg', correct: false },
      { text: '60 kg', correct: false }
    ],
    hint: 'Biết 2/5 là 20 kg => tổng số kg là: 20 : (2/5) = 20 · 5/2 = 50 kg.',
    explanation: 'Tổng số kg cà chua ban đầu là: 20 : (2/5) = 20 · (5/2) = 50 kg.'
  },
  {
    id: 6,
    title: 'Bài 6.48: Thời Gian Ngủ Trong Một Năm',
    question: 'Mỗi ngày người ta ngủ trung bình 8 giờ (chiếm 1/3 ngày). Trong một năm có 365 1/4 ngày, thời gian dành cho giấc ngủ là:',
    options: [
      { text: '121 3/4 ngày', correct: true },
      { text: '121 ngày', correct: false },
      { text: '122 ngày', correct: false },
      { text: '120 1/2 ngày', correct: false }
    ],
    hint: '365 1/4 = 1461/4. Nhân với 1/3: (1461/4) · (1/3) = 487/4 = 121 3/4 ngày.',
    explanation: 'Thời gian ngủ là: 365 1/4 · 1/3 = (1461/4) · (1/3) = 487/4 = 121 3/4 ngày (tức 121 ngày 18 giờ).'
  },
  {
    id: 7,
    title: 'Bài 6.49: Hai Phân Số Tiếp Theo Của Dãy',
    question: 'Cho dãy phân số: 1/8 ; 1/20 ; -1/40 ; -1/10 ; ... Hai phân số tiếp theo của dãy là:',
    options: [
      { text: '-7/40 và -1/4', correct: true },
      { text: '-7/40 và -9/40', correct: false },
      { text: '-5/40 và -6/40', correct: false },
      { text: '-7/40 và -1/5', correct: false }
    ],
    hint: 'Mẫu 40: 5/40 ; 2/40 ; -1/40 ; -4/40. Tử giảm 3 mỗi bước => -7/40 và -10/40 = -1/4.',
    explanation: 'Quy đồng mẫu 40: 5/40; 2/40; -1/40; -4/40. Tử số là 5, 2, -1, -4 (giảm 3). Hai tử số tiếp theo là -7 và -10. Ta được -7/40 và -10/40 = -1/4.'
  },
  {
    id: 8,
    title: 'Bài 6.50: Khối Lượng Viên Gạch Thăng Bằng',
    question: 'Một viên gạch đặt trên đĩa cân bên trái thăng bằng với 3/5 viên gạch cùng loại và quả cân 1 kg ở đĩa bên phải. Viên gạch nặng bao nhiêu kg?',
    options: [
      { text: '2.5 kg', correct: true },
      { text: '2 kg', correct: false },
      { text: '3 kg', correct: false },
      { text: '1.5 kg', correct: false }
    ],
    hint: '1 viên gạch = 3/5 viên gạch + 1 kg => (1 - 3/5) viên gạch = 2/5 viên gạch = 1 kg => 1 : (2/5) = 2.5 kg.',
    explanation: '1 viên gạch trừ đi 3/5 viên gạch còn 2/5 viên gạch. 2/5 viên gạch tương ứng với 1 kg. Do đó viên gạch nặng: 1 : (2/5) = 2.5 kg.'
  },
  {
    id: 9,
    title: 'So Sánh Phân Số Âm Khác Mẫu',
    question: 'So sánh hai phân số: (-13)/15 và (-17)/20',
    options: [
      { text: '(-13)/15 < (-17)/20', correct: true },
      { text: '(-13)/15 > (-17)/20', correct: false },
      { text: '(-13)/15 = (-17)/20', correct: false },
      { text: 'Không so sánh được', correct: false }
    ],
    hint: 'Mẫu chung là 60: (-13)/15 = -52/60; (-17)/20 = -51/60. Vì -52 < -51 nên (-13)/15 < (-17)/20.',
    explanation: 'Quy đồng mẫu 60: (-13)/15 = -52/60 và (-17)/20 = -51/60. Vì -52 < -51 nên (-13)/15 < (-17)/20.'
  },
  {
    id: 10,
    title: 'Số Đối Và Số Nghịch Đảo Của Phân Số',
    question: 'Số đối và số nghịch đảo của phân số -4/7 lần lượt là:',
    options: [
      { text: '4/7 và -7/4', correct: true },
      { text: '-4/7 và 7/4', correct: false },
      { text: '4/7 và 7/4', correct: false },
      { text: '-7/4 và 4/7', correct: false }
    ],
    hint: 'Số đối có tổng bằng 0 => 4/7; Số nghịch đảo có tích bằng 1 => -7/4.',
    explanation: 'Số đối của -4/7 là 4/7 (vì -4/7 + 4/7 = 0). Số nghịch đảo của -4/7 là -7/4 (vì (-4/7) · (-7/4) = 1).'
  }
];

// --- LAB 1: CÁN CÂN THĂNG BẰNG ---
function renderBalance(step = 'initial') {
  const output = document.getElementById('balance-lab-output');
  if (!output) return;

  sound.playClick();

  if (step === 'initial') {
    output.innerHTML = `
      <p><strong>Trạng thái cân thăng bằng:</strong></p>
      <p style="margin-left: 20px; color: #475569;">
        • Đĩa cân bên trái: <strong>1 Viên Gạch</strong> (khối lượng đặt là $x$ kg).
        <br>• Đĩa cân bên phải: <strong>3/5 Viên Gạch</strong> và thêm <strong>1 kg</strong>.
      </p>
      <p>Bấm nút <strong>"Giải Trình Cân Bằng"</strong> để xem phương pháp bớt ở cả 2 vế!</p>
    `;
  } else {
    output.innerHTML = `
      <h3 style="color: #7e22ce; margin-bottom: 6px;">✨ Phương Pháp Giải Chi Tiết Bài 6.50:</h3>
      <p><strong>Bước 1: Bớt đi 3/5 viên gạch ở cả hai đĩa cân:</strong></p>
      <p style="margin-left: 20px; color: #475569;">
        • Đĩa trái còn lại: $1 - \\frac{3}{5} = \\frac{2}{5}$ viên gạch.
        <br>• Đĩa phải còn lại: Quả cân $1\\text{ kg}$.
        <br>$\implies$ <strong>2/5 viên gạch nặng đúng bằng 1 kg!</strong>
      </p>
      <p><strong>Bước 2: Tìm khối lượng của một viên gạch (Bài toán 2 về phân số):</strong></p>
      <div style="background: #f0fdf4; padding: 12px 18px; border-radius: 8px; border-left: 4px solid #10b981; margin-top: 8px;">
        Khối lượng viên gạch là: $1 : \\frac{2}{5} = 1 \\cdot \\frac{5}{2} = \\frac{5}{2} =$ 
        <span style="font-size: 1.35rem; color: #15803d; font-weight: 800; margin-left: 10px;">
          2.5 kg
        </span>
      </div>
    `;
    unlockBadge('badge-1');
  }
}

// --- LAB 2: MÁY GIẢI MÃ QUY LUẬT DÃY SỐ ---
function renderSequenceLab(mode) {
  const output = document.getElementById('seq-lab-output');
  if (!output) return;

  sound.playClick();

  if (mode === 'original') {
    output.innerHTML = `
      <div style="font-size: 1.25rem; font-weight: 800; color: #7e22ce; margin-bottom: 12px;">
        1/8 &nbsp;&nbsp;; &nbsp;&nbsp; 1/20 &nbsp;&nbsp;; &nbsp;&nbsp; -1/40 &nbsp;&nbsp;; &nbsp;&nbsp; -1/10 &nbsp;&nbsp;; &nbsp;&nbsp; ? &nbsp;&nbsp;; &nbsp;&nbsp; ?
      </div>
      <p style="color: #64748b;">Nhận xét: Các phân số có mẫu số khác nhau: 8, 20, 40, 10. Hãy quy đồng về mẫu chung!</p>
    `;
  } else if (mode === 'common') {
    output.innerHTML = `
      <div style="font-size: 1.25rem; font-weight: 800; color: #0284c7; margin-bottom: 12px;">
        5/40 &nbsp;&nbsp;; &nbsp;&nbsp; 2/40 &nbsp;&nbsp;; &nbsp;&nbsp; -1/40 &nbsp;&nbsp;; &nbsp;&nbsp; -4/40 &nbsp;&nbsp;; &nbsp;&nbsp; ? &nbsp;&nbsp;; &nbsp;&nbsp; ?
      </div>
      <div style="text-align: left; background: #eff6ff; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #0284c7;">
        <strong>Phát hiện quy luật của tử số:</strong>
        <br>• $5 - 3 = 2$
        <br>• $2 - 3 = -1$
        <br>• $-1 - 3 = -4$
        <br>$\implies$ <strong>Quy luật: Mỗi phân số có mẫu 40, tử số giảm dần 3 đơn vị qua từng bước!</strong>
      </div>
    `;
    unlockBadge('badge-2');
  } else {
    output.innerHTML = `
      <div style="font-size: 1.25rem; font-weight: 800; color: #10b981; margin-bottom: 12px;">
        5/40 &nbsp;; &nbsp; 2/40 &nbsp;; &nbsp; -1/40 &nbsp;; &nbsp; -4/40 &nbsp;; &nbsp; <span style="color: #7e22ce; text-decoration: underline;">-7/40</span> &nbsp;; &nbsp; <span style="color: #7e22ce; text-decoration: underline;">-1/4</span>
      </div>
      <div style="text-align: left; background: #ecfdf5; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #10b981;">
        <strong>Tính toán 2 số tiếp theo:</strong>
        <br>• Số thứ 5 có tử: $-4 - 3 = -7 \implies$ Phân số là: <strong style="color: #047857;">-7/40</strong>
        <br>• Số thứ 6 có tử: $-7 - 3 = -10 \implies$ Phân số là: $-10/40 =$ <strong style="color: #047857;">-1/4</strong> (rút gọn chia cả tử và mẫu cho 10).
      </div>
    `;
    unlockBadge('badge-2');
  }
}

// --- KHỞI TẠO ĐẤU TRƯỜNG QUIZ ---
function renderQuiz() {
  const container = document.getElementById('quiz-list');
  if (!container) return;

  container.innerHTML = quizData.map((item, idx) => {
    return `
      <div class="quiz-card" id="quiz-card-${item.id}">
        <div class="quiz-num">CÂU HỎI ${idx + 1}/10 • ${item.title}</div>
        <div class="quiz-question">${item.question}</div>
        <div class="quiz-options">
          ${item.options.map((opt, oIdx) => `
            <button class="quiz-opt-btn" onclick="handleAnswer(${item.id}, ${oIdx})">
              ${opt.text}
            </button>
          `).join('')}
        </div>
        <div class="quiz-explanation" id="quiz-exp-${item.id}">
          💡 <strong>Giải thích chi tiết:</strong> ${item.explanation}
        </div>
      </div>
    `;
  }).join('');
}

// --- XỬ LÝ TRẢ LỜI CÂU HỎI ---
window.handleAnswer = function(questionId, optionIdx) {
  if (gameState.answeredQuestions.has(questionId)) return;

  const question = quizData.find(q => q.id === questionId);
  if (!question) return;

  const card = document.getElementById(`quiz-card-${questionId}`);
  const buttons = card.querySelectorAll('.quiz-opt-btn');
  const selectedOption = question.options[optionIdx];
  const explanationEl = document.getElementById(`quiz-exp-${questionId}`);

  gameState.answeredQuestions.add(questionId);

  buttons.forEach((btn, idx) => {
    btn.disabled = true;
    if (question.options[idx].correct) {
      btn.classList.add('correct');
    }
  });

  if (selectedOption.correct) {
    buttons[optionIdx].classList.add('correct');
    sound.playCorrect();
    gameState.score += 100;
    gameState.stars += 1;
    gameState.streak += 1;

    if (gameState.streak >= 3) {
      unlockBadge('badge-4');
    }
    if (questionId === 8) {
      unlockBadge('badge-1');
    }
    if (questionId === 7) {
      unlockBadge('badge-2');
    }
    if (questionId === 4) {
      unlockBadge('badge-3');
    }
  } else {
    buttons[optionIdx].classList.add('wrong');
    sound.playWrong();
    gameState.streak = 0;
  }

  if (explanationEl) {
    explanationEl.style.display = 'block';
  }

  if (gameState.stars >= 8) {
    unlockBadge('badge-5');
  }

  updateHUD();
};

// --- MỞ KHÓA HUY HIỆU ---
function unlockBadge(badgeId) {
  if (gameState.unlockedBadges.has(badgeId)) return;
  gameState.unlockedBadges.add(badgeId);

  const el = document.getElementById(badgeId);
  if (el) {
    el.classList.remove('locked');
    el.classList.add('unlocked');
    sound.playBadge();
  }
}

// --- CẬP NHẬT HUD & CERTIFICATE ---
function updateHUD() {
  document.getElementById('hud-score').textContent = gameState.score;
  document.getElementById('hud-stars').textContent = gameState.stars;
  document.getElementById('hud-streak').textContent = gameState.streak;

  let rank = 'Tập Sự Ôn Tập';
  if (gameState.score >= 300) rank = 'Học Sinh Xuất Sắc';
  if (gameState.score >= 600) rank = 'Kỳ Thủ Phân Số';
  if (gameState.score >= 900) rank = 'Đại Kiện Tướng Toàn Diện';

  document.getElementById('hud-rank-display').textContent = rank;

  // Cập nhật giấy chứng nhận
  document.getElementById('cert-name').textContent = gameState.studentName;
  document.getElementById('cert-score').textContent = gameState.score;
  document.getElementById('cert-stars').textContent = gameState.stars;
  document.getElementById('cert-rank').textContent = rank;
  const d = new Date();
  document.getElementById('cert-date').textContent = `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`;
}

// --- SỰ KIỆN KHỞI TẠO ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Modal bắt đầu
  const avatarBtns = document.querySelectorAll('.avatar-btn');
  avatarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playClick();
      avatarBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      gameState.avatar = btn.getAttribute('data-avatar');
    });
  });

  const btnEnter = document.getElementById('btn-enter-game');
  if (btnEnter) {
    btnEnter.addEventListener('click', () => {
      const nameInput = document.getElementById('student-name-input');
      if (nameInput && nameInput.value.trim() !== '') {
        gameState.studentName = nameInput.value.trim();
      }
      document.getElementById('hud-avatar-display').textContent = gameState.avatar;
      document.getElementById('hud-name-display').textContent = gameState.studentName;
      document.getElementById('start-modal').classList.add('hidden');
      sound.playBadge();
      updateHUD();
    });
  }

  // 2. Nút âm thanh & reset
  const soundBtn = document.getElementById('btn-toggle-sound');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      sound.muted = !sound.muted;
      soundBtn.textContent = sound.muted ? '🔇 Âm thanh: TẮT' : '🔊 Âm thanh: BẬT';
    });
  }

  const resetBtn = document.getElementById('btn-reset-game');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Em có chắc chắn muốn đặt lại điểm số và làm lại từ đầu không?')) {
        location.reload();
      }
    });
  }

  const replayBtn = document.getElementById('btn-replay-lesson');
  if (replayBtn) {
    replayBtn.addEventListener('click', () => location.reload());
  }

  // 3. Lab Balance
  const btnBalSgk = document.getElementById('btn-balance-sgk');
  const btnBalSolve = document.getElementById('btn-balance-solve');

  if (btnBalSgk) {
    btnBalSgk.addEventListener('click', () => {
      btnBalSgk.classList.add('active');
      if (btnBalSolve) btnBalSolve.classList.remove('active');
      renderBalance('initial');
    });
  }

  if (btnBalSolve) {
    btnBalSolve.addEventListener('click', () => {
      btnBalSolve.classList.add('active');
      if (btnBalSgk) btnBalSgk.classList.remove('active');
      renderBalance('solve');
    });
  }

  // 4. Lab Sequence
  const btnSeqOrig = document.getElementById('btn-seq-original');
  const btnSeqCommon = document.getElementById('btn-seq-common-den');
  const btnSeqNext = document.getElementById('btn-seq-next-two');

  if (btnSeqOrig) {
    btnSeqOrig.addEventListener('click', () => {
      [btnSeqOrig, btnSeqCommon, btnSeqNext].forEach(b => b.classList.remove('active'));
      btnSeqOrig.classList.add('active');
      renderSequenceLab('original');
    });
  }

  if (btnSeqCommon) {
    btnSeqCommon.addEventListener('click', () => {
      [btnSeqOrig, btnSeqCommon, btnSeqNext].forEach(b => b.classList.remove('active'));
      btnSeqCommon.classList.add('active');
      renderSequenceLab('common');
    });
  }

  if (btnSeqNext) {
    btnSeqNext.addEventListener('click', () => {
      [btnSeqOrig, btnSeqCommon, btnSeqNext].forEach(b => b.classList.remove('active'));
      btnSeqNext.classList.add('active');
      renderSequenceLab('next');
    });
  }

  // 5. Khởi tạo renders
  renderBalance('initial');
  renderSequenceLab('original');
  renderQuiz();
  updateHUD();
});
