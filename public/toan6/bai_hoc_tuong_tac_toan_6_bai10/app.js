/* ==========================================================================
   BÀI 10: SỐ NGUYÊN TỐ - TOÁN 6 KẾT NỐI TRI THỨC
   Hệ thống học tập tương tác & Gamification
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

  playTone(freq, type = 'sine', duration = 0.2, gainVal = 0.15) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  correct() {
    this.playTone(523.25, 'triangle', 0.15, 0.2); // C5
    setTimeout(() => this.playTone(659.25, 'triangle', 0.15, 0.2), 100); // E5
    setTimeout(() => this.playTone(783.99, 'triangle', 0.25, 0.25), 200); // G5
  }

  wrong() {
    this.playTone(260, 'sawtooth', 0.2, 0.2);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.3, 0.25), 150);
  }

  levelUp() {
    [400, 500, 600, 800, 1000].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.15, 0.2), i * 80);
    });
  }

  click() {
    this.playTone(600, 'sine', 0.05, 0.05);
  }
}

const sound = new SoundManager();

// 2. CONFETTI EFFECT
function launchConfetti() {
  const canvas = document.getElementById('confetti-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const particles = [];
  const colors = ['#6366f1', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#3b82f6'];

  for (let i = 0; i < 90; i++) {
    particles.push({
      x: canvas.width / 2,
      y: canvas.height / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.8) * 16,
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: Math.random() * 5 + 3,
      alpha: 1
    });
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;

    particles.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.35; // trọng lực
      p.alpha -= 0.015;

      if (p.alpha > 0) {
        active = true;
        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    if (active) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  draw();
}

// 3. GAME STATE
const state = {
  playerName: 'Hiệp Sĩ Toán Học',
  avatar: '🧙‍♂️',
  score: 0,
  stars: 0,
  streak: 0,
  currentQuizIndex: 0,
  badges: {
    b1: false, // Bó hoa 8/3
    b2: false, // Sàng Eratosthenes
    b3: false, // Bậc thầy sơ đồ cây
    b4: false, // Chuỗi 3 câu đúng
    b5: false  // Vua số nguyên tố (10/10 quiz)
  }
};

function addScore(points, stars = 1) {
  state.score += points;
  state.stars += stars;
  state.streak += 1;

  if (state.streak >= 3) {
    unlockBadge('badge-4');
    document.getElementById('hud-streak-badge').classList.add('combo-active');
  }

  updateHUD();
}

function resetStreak() {
  state.streak = 0;
  document.getElementById('hud-streak-badge').classList.remove('combo-active');
  updateHUD();
}

function unlockBadge(badgeId) {
  const el = document.getElementById(badgeId);
  if (el && el.classList.contains('locked')) {
    el.classList.remove('locked');
    el.classList.add('unlocked');
    sound.levelUp();
    launchConfetti();
  }
}

function updateHUD() {
  document.getElementById('hud-name').textContent = state.playerName;
  document.getElementById('hud-avatar').textContent = state.avatar;
  document.getElementById('hud-score').textContent = state.score;
  document.getElementById('hud-stars').textContent = state.stars;
  document.getElementById('hud-streak').textContent = state.streak;

  let rank = 'Tập Sự Số Học';
  if (state.score >= 180) rank = 'Đại Pháp Sư Số Nguyên Tố 💎';
  else if (state.score >= 120) rank = 'Dũng Sĩ Số Học ⚔️';
  else if (state.score >= 60) rank = 'Nhà Thông Thái Trẻ 📜';

  document.getElementById('hud-rank').textContent = rank;

  // Sync Certificate
  document.getElementById('cert-name').textContent = state.playerName;
  document.getElementById('cert-score').textContent = state.score;
  document.getElementById('cert-stars').textContent = state.stars;
  document.getElementById('cert-rank').textContent = rank;
}

// 4. INTERACTIVE ACTIVITIES
function checkKhoiDong(btn, isCorrect, explanation) {
  sound.click();
  const feedback = document.getElementById('khoi-dong-feedback');
  const parent = btn.parentElement;
  parent.querySelectorAll('.iq-btn').forEach(b => b.classList.remove('correct', 'wrong'));

  if (isCorrect) {
    btn.classList.add('correct');
    sound.correct();
    addScore(15, 1);
    unlockBadge('badge-1');
    feedback.className = 'iq-feedback show';
    feedback.style.background = '#dcfce7';
    feedback.style.color = '#15803d';
    feedback.style.border = '1px solid #86efac';
    feedback.innerHTML = `🎉 <strong>Chính xác!</strong> ${explanation}`;
  } else {
    btn.classList.add('wrong');
    sound.wrong();
    resetStreak();
    feedback.className = 'iq-feedback show';
    feedback.style.background = '#fee2e2';
    feedback.style.color = '#991b1b';
    feedback.style.border = '1px solid #fca5a5';
    feedback.innerHTML = `❌ <strong>Chưa đúng:</strong> ${explanation}`;
  }
}

function checkLT2(btn, isCorrect, explanation) {
  sound.click();
  const feedback = document.getElementById('lt2-feedback');
  const parent = btn.parentElement;
  parent.querySelectorAll('.iq-btn').forEach(b => b.classList.remove('correct', 'wrong'));

  if (isCorrect) {
    btn.classList.add('correct');
    sound.correct();
    addScore(15, 1);
    unlockBadge('badge-3');
    feedback.className = 'iq-feedback show';
    feedback.style.background = '#dcfce7';
    feedback.style.color = '#15803d';
    feedback.style.border = '1px solid #86efac';
    feedback.innerHTML = `🎉 <strong>Chính xác!</strong> ${explanation}`;
  } else {
    btn.classList.add('wrong');
    sound.wrong();
    resetStreak();
    feedback.className = 'iq-feedback show';
    feedback.style.background = '#fee2e2';
    feedback.style.color = '#991b1b';
    feedback.style.border = '1px solid #fca5a5';
    feedback.innerHTML = `❌ <strong>Thử lại nhé:</strong> ${explanation}`;
  }
}

function checkDebate(btn, isCorrect, explanation) {
  sound.click();
  const feedback = document.getElementById('debate-feedback');
  const parent = btn.parentElement;
  parent.querySelectorAll('.iq-btn').forEach(b => b.classList.remove('correct', 'wrong'));

  if (isCorrect) {
    btn.classList.add('correct');
    sound.correct();
    addScore(15, 1);
    feedback.className = 'iq-feedback show';
    feedback.style.background = '#dcfce7';
    feedback.style.color = '#15803d';
    feedback.style.border = '1px solid #86efac';
    feedback.innerHTML = `🌟 <strong>Chuẩn không cần chỉnh!</strong> ${explanation}`;
  } else {
    btn.classList.add('wrong');
    sound.wrong();
    resetStreak();
    feedback.className = 'iq-feedback show';
    feedback.style.background = '#fee2e2';
    feedback.style.color = '#991b1b';
    feedback.style.border = '1px solid #fca5a5';
    feedback.innerHTML = `❌ <strong>Chưa chính xác:</strong> ${explanation}`;
  }
}

// 5. SIEVE OF ERATOSTHENES ENGINE
const sieveEngine = {
  currentStep: 0,
  maxSteps: 6,
  primesUnder50: [2, 3, 5, 7, 11, 13, 17, 19, 23, 29, 31, 37, 41, 43, 47],
  timer: null,

  init() {
    const grid = document.getElementById('sieve-grid');
    if (!grid) return;
    grid.innerHTML = '';

    for (let i = 1; i <= 50; i++) {
      const cell = document.createElement('div');
      cell.className = 'sieve-cell';
      cell.id = `sieve-${i}`;
      cell.textContent = i;
      grid.appendChild(cell);
    }
    this.currentStep = 0;
    this.updateStatus('Nhấn "Bước tiếp theo" để bắt đầu quy trình lọc số nguyên tố!');
    document.getElementById('sieve-prime-count').textContent = '0';
  },

  updateStatus(text) {
    const el = document.getElementById('sieve-step-desc');
    if (el) el.textContent = text;
  },

  nextStep() {
    this.currentStep++;
    sound.click();

    if (this.currentStep === 1) {
      // Gạch bỏ số 1
      const c1 = document.getElementById('sieve-1');
      if (c1) c1.classList.add('eliminated');
      this.updateStatus('Bước 1: Loại bỏ số 1 (vì 1 không phải là số nguyên tố).');
    } else if (this.currentStep === 2) {
      // Giữ 2, gạch bỏ bội của 2
      const c2 = document.getElementById('sieve-2');
      if (c2) c2.classList.add('prime');
      for (let i = 4; i <= 50; i += 2) {
        const c = document.getElementById(`sieve-${i}`);
        if (c) c.classList.add('eliminated');
      }
      this.updateStatus('Bước 2: Giữ lại số 2 (SNT chẵn duy nhất), gạch bỏ tất cả các bội của 2 lớn hơn 2.');
    } else if (this.currentStep === 3) {
      // Giữ 3, gạch bỏ bội của 3
      const c3 = document.getElementById('sieve-3');
      if (c3) c3.classList.add('prime');
      for (let i = 6; i <= 50; i += 3) {
        const c = document.getElementById(`sieve-${i}`);
        if (c) c.classList.add('eliminated');
      }
      this.updateStatus('Bước 3: Giữ lại số 3, gạch bỏ tất cả các bội của 3 lớn hơn 3 (9, 15, 21, 27, 33, 39, 45).');
    } else if (this.currentStep === 4) {
      // Giữ 5, gạch bỏ bội của 5
      const c5 = document.getElementById('sieve-5');
      if (c5) c5.classList.add('prime');
      for (let i = 10; i <= 50; i += 5) {
        const c = document.getElementById(`sieve-${i}`);
        if (c) c.classList.add('eliminated');
      }
      this.updateStatus('Bước 4: Giữ lại số 5, gạch bỏ các bội của 5 lớn hơn 5 (25, 35).');
    } else if (this.currentStep === 5) {
      // Giữ 7, gạch bỏ bội của 7
      const c7 = document.getElementById('sieve-7');
      if (c7) c7.classList.add('prime');
      for (let i = 14; i <= 50; i += 7) {
        const c = document.getElementById(`sieve-${i}`);
        if (c) c.classList.add('eliminated');
      }
      this.updateStatus('Bước 5: Giữ lại số 7, gạch bỏ các bội của 7 lớn hơn 7 (49).');
    } else if (this.currentStep >= 6) {
      // Hoàn tất: Mọi số chưa bị gạch đều là SNT!
      this.primesUnder50.forEach(p => {
        const cp = document.getElementById(`sieve-${p}`);
        if (cp) {
          cp.classList.remove('eliminated');
          cp.classList.add('prime');
        }
      });
      document.getElementById('sieve-prime-count').textContent = '15';
      this.updateStatus('🎉 Hoàn thành xuất sắc! Toàn bộ 15 số nguyên tố nhỏ hơn 50 đã sáng lấp lánh!');
      sound.levelUp();
      launchConfetti();
      addScore(25, 2);
      unlockBadge('badge-2');
      this.currentStep = 6;
      if (this.timer) clearInterval(this.timer);
    }

    // Đếm số lượng prime hiện tại
    const count = document.querySelectorAll('.sieve-cell.prime').length;
    document.getElementById('sieve-prime-count').textContent = count;
  },

  autoRun() {
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      if (this.currentStep < 6) {
        this.nextStep();
      } else {
        clearInterval(this.timer);
      }
    }, 800);
  },

  reset() {
    if (this.timer) clearInterval(this.timer);
    this.init();
  }
};

// 6. QUIZ ARENA (10 CÂU BÁM SÁT BÀI TẬP 2.17 – 2.24 SGK)
const quizQuestions = [
  {
    category: "Bài tập 2.17a SGK (tr. 43)",
    question: "Phân tích số 70 ra thừa số nguyên tố theo cách viết đúng chuẩn:",
    answers: [
      { text: "70 = 7 × 10", correct: false },
      { text: "70 = 2 × 5 × 7", correct: true },
      { text: "70 = 2 × 35", correct: false },
      { text: "70 = 1 × 70", correct: false }
    ],
    explanation: "70 chia hết cho 2 được 35; 35 chia hết cho 5 được 7; 7 chia hết cho 7 được 1. Vì 2, 5, 7 đều là các số nguyên tố nên 70 = 2 × 5 × 7."
  },
  {
    category: "Bài tập 2.17b SGK (tr. 43)",
    question: "Phân tích số 115 ra thừa số nguyên tố:",
    answers: [
      { text: "115 = 5 × 23", correct: true },
      { text: "115 = 3 × 5 × 7", correct: false },
      { text: "115 = 5 × 21", correct: false },
      { text: "115 là số nguyên tố", correct: false }
    ],
    explanation: "Số 115 tận cùng là 5 nên chia hết cho 5: 115 : 5 = 23. Số 23 là số nguyên tố nên 23 : 23 = 1. Do đó: 115 = 5 × 23."
  },
  {
    category: "Bài tập 2.18 SGK (tr. 43)",
    question: "Bạn Nam phân tích: 84 = 2 × 3 × 14. Kết quả của Nam đúng hay sai?",
    answers: [
      { text: "Đúng, vì 2 × 3 × 14 = 84", correct: false },
      { text: "Sai, vì 14 không phải là số nguyên tố (14 = 2 × 7)", correct: true },
      { text: "Sai, vì 3 không phải số nguyên tố", correct: false },
      { text: "Sai, vì thiếu số 1", correct: false }
    ],
    explanation: "Nam chưa phân tích triệt để ra thừa số nguyên tố vì 14 là hợp số (14 = 2 × 7). Kết quả đúng phải là 84 = 2² × 3 × 7."
  },
  {
    category: "Bài tập 2.19 SGK (tr. 43)",
    question: "Khẳng định nào sau đây là ĐÚNG?",
    answers: [
      { text: "Mọi số nguyên tố đều là số lẻ", correct: false },
      { text: "Số nguyên tố chỉ có thể là số chẵn", correct: false },
      { text: "Có số nguyên tố là số chẵn (đó là số 2)", correct: true },
      { text: "Số 0 là số nguyên tố nhỏ nhất", correct: false }
    ],
    explanation: "Số 2 là số chẵn và là số nguyên tố chẵn duy nhất! (Số 0 không phải là số nguyên tố, và các số nguyên tố khác 2 đều là số lẻ)."
  },
  {
    category: "Bài tập 2.20a SGK (tr. 43)",
    question: "Trong các số: 89; 97; 125, số nào là hợp số?",
    answers: [
      { text: "89", correct: false },
      { text: "97", correct: false },
      { text: "125", correct: true },
      { text: "Cả 3 số đều là hợp số", correct: false }
    ],
    explanation: "89 và 97 là các số nguyên tố (có trong bảng số nguyên tố nhỏ hơn 100). Số 125 tận cùng là 5 nên ngoài 1 và 125, nó còn chia hết cho 5, vậy 125 là hợp số."
  },
  {
    category: "Bài tập 2.20b SGK (tr. 43)",
    question: "Hai số 2013 và 2018 là số nguyên tố hay hợp số?",
    answers: [
      { text: "Cả hai đều là số nguyên tố", correct: false },
      { text: "2013 là SNT, 2018 là hợp số", correct: false },
      { text: "Cả hai đều là hợp số", correct: true },
      { text: "2013 là hợp số, 2018 là SNT", correct: false }
    ],
    explanation: "2013 có tổng các chữ số là 2+0+1+3 = 6 ⋮ 3 nên 2013 chia hết cho 3 (là hợp số). Số 2018 có chữ số tận cùng là 8 nên chia hết cho 2 (là hợp số)."
  },
  {
    category: "Bài tập 2.21 SGK (tr. 43)",
    question: "Biểu thức A = 4⁴ × 9⁵ được phân tích ra thừa số nguyên tố là:",
    answers: [
      { text: "A = 4⁴ × 9⁵", correct: false },
      { text: "A = 2⁸ × 3¹⁰", correct: true },
      { text: "A = 2⁴ × 3⁵", correct: false },
      { text: "A = 36⁹", correct: false }
    ],
    explanation: "Ta biến đổi: 4 = 2² ⇒ 4⁴ = (2²)⁴ = 2⁸. Tương tự 9 = 3² ⇒ 9⁵ = (3²)⁵ = 3¹⁰. Vậy A = 2⁸ × 3¹⁰."
  },
  {
    category: "Bài tập 2.22 SGK (tr. 43)",
    question: "Tìm số tự nhiên x để tích 3 × x là một số nguyên tố:",
    answers: [
      { text: "x = 0", correct: false },
      { text: "x = 1", correct: true },
      { text: "x = 2", correct: false },
      { text: "x = 3", correct: false }
    ],
    explanation: "Nếu x = 0 thì 3 × 0 = 0 (không là SNT). Nếu x = 1 thì 3 × 1 = 3 (là SNT). Nếu x > 1 thì tích 3x có ít nhất 3 ước là 1, 3 và 3x, nên là hợp số. Do đó x = 1 duy nhất."
  },
  {
    category: "Bài tập 2.23 SGK (tr. 43)",
    question: "Lớp 6A có 30 học sinh. Muốn chia đều thành các nhóm (> 1 người và < 30 người). Có bao nhiêu cách chia?",
    answers: [
      { text: "4 cách", correct: false },
      { text: "6 cách chia", correct: true },
      { text: "8 cách", correct: false },
      { text: "5 cách", correct: false }
    ],
    explanation: "Số nhóm hoặc số người mỗi nhóm phải là ước của 30 (khác 1 và 30). Tập ước của 30 là {1; 2; 3; 5; 6; 10; 15; 30}. Bỏ 1 và 30 còn lại 6 số: 2, 3, 5, 6, 10, 15. Vậy có đúng 6 cách chia."
  },
  {
    category: "Bài tập 2.24 SGK (tr. 43)",
    question: "Đại đội bộ binh gồm 33 chiến sĩ. Có thể xếp thành các hàng có số người bằng nhau (> 1 người và < 33 người) không?",
    answers: [
      { text: "Không thể, vì 33 là số lẻ", correct: false },
      { text: "Có thể (xếp 3 hàng mỗi hàng 11 người, hoặc 11 hàng mỗi hàng 3 người)", correct: true },
      { text: "Chỉ có thể xếp được 1 hàng duy nhất", correct: false },
      { text: "Có thể xếp thành 5 hàng bằng nhau", correct: false }
    ],
    explanation: "Vì 33 là hợp số, 33 = 3 × 11 nên có thể xếp thành 3 hàng (mỗi hàng 11 chiến sĩ) hoặc 11 hàng (mỗi hàng 3 chiến sĩ)."
  }
];

function renderQuizQuestion() {
  const q = quizQuestions[state.currentQuizIndex];
  if (!q) return;

  document.getElementById('quiz-question-number').textContent = `Câu hỏi ${state.currentQuizIndex + 1} / ${quizQuestions.length}`;
  document.getElementById('quiz-category').textContent = q.category;
  document.getElementById('quiz-question-text').textContent = q.question;

  const progressPercent = ((state.currentQuizIndex + 1) / quizQuestions.length) * 100;
  document.getElementById('quiz-progress').style.width = `${progressPercent}%`;

  const grid = document.getElementById('quiz-answers-grid');
  grid.innerHTML = '';

  const expBox = document.getElementById('quiz-explanation');
  expBox.className = 'quiz-explanation-box';

  q.answers.forEach((ans, idx) => {
    const btn = document.createElement('button');
    btn.className = 'quiz-answer-btn';
    btn.innerHTML = `<span style="color:#6366f1; font-weight:800;">${String.fromCharCode(65 + idx)}.</span> <span>${ans.text}</span>`;
    btn.onclick = () => selectQuizAnswer(btn, ans.correct, q.explanation);
    grid.appendChild(btn);
  });
}

function selectQuizAnswer(btn, isCorrect, explanation) {
  sound.click();
  const allBtns = document.querySelectorAll('.quiz-answer-btn');
  allBtns.forEach(b => b.disabled = true);

  const expBox = document.getElementById('quiz-explanation');
  const expText = document.getElementById('quiz-explanation-text');

  if (isCorrect) {
    btn.classList.add('selected-correct');
    sound.correct();
    addScore(10, 1);
  } else {
    btn.classList.add('selected-wrong');
    sound.wrong();
    resetStreak();
    // highlight correct one
    const q = quizQuestions[state.currentQuizIndex];
    allBtns.forEach((b, idx) => {
      if (q.answers[idx].correct) b.classList.add('selected-correct');
    });
  }

  expText.textContent = explanation;
  expBox.classList.add('show');
}

function nextQuizQuestion() {
  sound.click();
  if (state.currentQuizIndex < quizQuestions.length - 1) {
    state.currentQuizIndex++;
    renderQuizQuestion();
  } else {
    // Hoàn thành quiz
    sound.levelUp();
    launchConfetti();
    unlockBadge('badge-5');
    alert(`🎉 Chúc mừng bạn đã hoàn thành Đấu trường 10 câu SGK! Điểm tổng kết: ${state.score} XP! Hãy kiểm tra Giấy chứng nhận bên dưới.`);
    document.getElementById('chung-nhan-vinh-danh').scrollIntoView({ behavior: 'smooth' });
  }
}

// 7. INITIALIZATION
document.addEventListener('DOMContentLoaded', () => {
  // Start Modal
  const modal = document.getElementById('start-modal');
  const btnStart = document.getElementById('btn-start');
  const nameInput = document.getElementById('student-name-input');
  const avatarOptions = document.querySelectorAll('.avatar-option');

  avatarOptions.forEach(opt => {
    opt.addEventListener('click', () => {
      avatarOptions.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      state.avatar = opt.dataset.avatar;
      sound.click();
    });
  });

  btnStart.addEventListener('click', () => {
    sound.init();
    sound.click();
    const val = nameInput.value.trim();
    if (val) state.playerName = val;

    modal.classList.add('hidden');
    updateHUD();
    sound.levelUp();
  });

  // Sound toggle
  const btnSound = document.getElementById('btn-sound');
  btnSound.addEventListener('click', () => {
    sound.enabled = !sound.enabled;
    btnSound.textContent = sound.enabled ? '🔊' : '🔇';
    sound.click();
  });

  // Reset
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Bạn có muốn làm mới lại tiến trình bài học không?')) {
      window.location.reload();
    }
  });

  document.getElementById('btn-replay-lesson').addEventListener('click', () => {
    window.location.reload();
  });

  // Sieve controls
  document.getElementById('btn-sieve-step').addEventListener('click', () => sieveEngine.nextStep());
  document.getElementById('btn-sieve-auto').addEventListener('click', () => sieveEngine.autoRun());
  document.getElementById('btn-sieve-reset').addEventListener('click', () => sieveEngine.reset());

  // Quiz next
  document.getElementById('btn-next-question').addEventListener('click', nextQuizQuestion);

  // Set date for Certificate
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  document.getElementById('cert-date').textContent = dateStr;

  // Init Sieve & Quiz
  sieveEngine.init();
  renderQuizQuestion();
  updateHUD();
});
