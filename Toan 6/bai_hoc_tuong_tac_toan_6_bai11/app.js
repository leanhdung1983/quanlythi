/* ==========================================================================
   BÀI 11: ƯỚC CHUNG. ƯỚC CHUNG LỚN NHẤT - TOÁN 6 KẾT NỐI TRI THỨC
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
  const colors = ['#0d9488', '#0891b2', '#14b8a6', '#f59e0b', '#10b981', '#3b82f6'];

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
      p.vy += 0.35;
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
  playerName: 'Kiến Trúc Sư Toán Học',
  avatar: '👷‍♂️',
  score: 0,
  stars: 0,
  streak: 0,
  currentQuizIndex: 0,
  badges: {
    b1: false, // Bác thợ mộc khéo tay
    b2: false, // Chuyên gia cỗ máy ƯCLN
    b3: false, // Bậc thầy phân số tối giản
    b4: false, // Chuỗi 3 câu đúng
    b5: false  // Đại sư phụ ƯCLN (10/10 quiz)
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

  let rank = 'Thợ Cắt Gỗ Tập Sự';
  if (state.score >= 180) rank = 'Đại Bậc Thầy Ước Chung 👑';
  else if (state.score >= 120) rank = 'Kỹ Sư Toán Học Ưu Tú 📐';
  else if (state.score >= 60) rank = 'Thợ Mộc Lành Nghề 🪵';

  document.getElementById('hud-rank').textContent = rank;

  // Sync Certificate
  document.getElementById('cert-name').textContent = state.playerName;
  document.getElementById('cert-score').textContent = state.score;
  document.getElementById('cert-stars').textContent = state.stars;
  document.getElementById('cert-rank').textContent = rank;
}

// 4. KHỞI ĐỘNG CẮT GỖ
function checkWoodCut(btn, isCorrect, explanation) {
  sound.click();
  const feedback = document.getElementById('wood-feedback');
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
    feedback.innerHTML = `❌ <strong>Chưa tối ưu:</strong> ${explanation}`;
  }
}

// 5. CỖ MÁY TÍNH TOÁN ƯCLN & PHÂN SỐ
function factorize(num) {
  const factors = {};
  let d = 2;
  let temp = num;
  while (temp >= 2) {
    if (temp % d === 0) {
      factors[d] = (factors[d] || 0) + 1;
      temp /= d;
    } else {
      d++;
      if (d * d > temp) {
        if (temp > 1) {
          factors[temp] = (factors[temp] || 0) + 1;
          break;
        }
      }
    }
  }
  return factors;
}

function formatFactorization(factors) {
  const parts = [];
  for (const [p, exp] of Object.entries(factors)) {
    if (exp === 1) parts.push(`${p}`);
    else parts.push(`${p}<sup>${exp}</sup>`);
  }
  return parts.join(' × ') || '1';
}

function getGCD(a, b) {
  while (b !== 0) {
    let r = a % b;
    a = b;
    b = r;
  }
  return a;
}

function getDivisors(num) {
  const divs = [];
  for (let i = 1; i <= Math.sqrt(num); i++) {
    if (num % i === 0) {
      divs.push(i);
      if (i * i !== num) divs.push(num / i);
    }
  }
  return divs.sort((x, y) => x - y);
}

function runGCDMachine() {
  sound.click();
  const a = parseInt(document.getElementById('gcd-num1').value, 10);
  const b = parseInt(document.getElementById('gcd-num2').value, 10);
  const resultBox = document.getElementById('gcd-result-box');

  if (!a || !b || a < 1 || b < 1) {
    resultBox.innerHTML = '<span style="color:#f87171;">Vui lòng nhập 2 số tự nhiên lớn hơn 0!</span>';
    return;
  }

  const factA = factorize(a);
  const factB = factorize(b);

  const commonFactors = {};
  for (const p in factA) {
    if (factB[p]) {
      commonFactors[p] = Math.min(factA[p], factB[p]);
    }
  }

  const gcdVal = getGCD(a, b);
  const commonDivisors = getDivisors(gcdVal);

  let html = `<div><strong>📌 Bước 1: Phân tích mỗi số ra thừa số nguyên tố:</strong><br>`;
  html += `• ${a} = ${formatFactorization(factA)}<br>`;
  html += `• ${b} = ${formatFactorization(factB)}</div>`;

  html += `<div style="margin-top:10px;"><strong>📌 Bước 2: Chọn ra các thừa số nguyên tố chung:</strong><br>`;
  const commonPrimes = Object.keys(commonFactors);
  if (commonPrimes.length > 0) {
    html += `Các thừa số nguyên tố chung là: <span style="color:#fde047; font-weight:800;">${commonPrimes.join(', ')}</span></div>`;
  } else {
    html += `<span style="color:#fde047; font-weight:800;">Không có thừa số nguyên tố chung!</span> (Hai số nguyên tố cùng nhau)</div>`;
  }

  html += `<div style="margin-top:10px;"><strong>📌 Bước 3: Lập tích với số mũ nhỏ nhất:</strong><br>`;
  html += `👉 <strong>ƯCLN(${a}, ${b}) = ${formatFactorization(commonFactors)} = <span style="font-size:1.3rem; color:#fde047;">${gcdVal}</span></strong></div>`;

  html += `<div style="margin-top:12px; padding:10px; background:#042f2e; border-radius:8px;">`;
  html += `🎯 <strong>Tập hợp các ước chung:</strong><br>`;
  html += `ƯC(${a}, ${b}) = Ư(${gcdVal}) = <strong>{ ${commonDivisors.join('; ')} }</strong>`;
  html += `</div>`;

  resultBox.innerHTML = html;
  sound.correct();
  addScore(10, 1);
  unlockBadge('badge-2');
}

function runFractionSimplifier() {
  sound.click();
  const num = parseInt(document.getElementById('frac-num').value, 10);
  const den = parseInt(document.getElementById('frac-den').value, 10);
  const resBox = document.getElementById('frac-result-box');

  if (!num || !den || num < 1 || den < 1) {
    resBox.innerHTML = '<span style="color:#dc2626;">Vui lòng nhập cả tử số và mẫu số lớn hơn 0!</span>';
    return;
  }

  const gcdVal = getGCD(num, den);
  const simpNum = num / gcdVal;
  const simpDen = den / gcdVal;

  let html = `<p>ƯCLN của tử số và mẫu số: <strong>ƯCLN(${num}, ${den}) = ${gcdVal}</strong></p>`;
  if (gcdVal === 1) {
    html += `<p style="margin-top:8px; font-weight:800; color:#15803d;">Phân số <span style="font-size:1.3rem;">${num}/${den}</span> đã là PHÂN SỐ TỐI GIẢN (vì ${num} và ${den} là hai số nguyên tố cùng nhau)!</p>`;
  } else {
    html += `<p style="margin-top:8px;">Chia cả tử và mẫu cho ${gcdVal}:</p>`;
    html += `<div style="font-size:1.4rem; font-weight:900; margin:10px 0; color:#0f766e;">`;
    html += `(${num} : ${gcdVal}) / (${den} : ${gcdVal}) = <span style="color:#d97706; background:#fef3c7; padding:4px 12px; border-radius:8px;">${simpNum} / ${simpDen}</span>`;
    html += `</div>`;
    html += `<p style="color:#0f766e; font-size:0.95rem;">Phân số tối giản thu được là <strong>${simpNum}/${simpDen}</strong>.</p>`;
  }

  resBox.innerHTML = html;
  sound.correct();
  addScore(10, 1);
  unlockBadge('badge-3');
}

// 6. QUIZ ARENA (10 CÂU BÁM SÁT BÀI TẬP 2.30 – 2.35 SGK)
const quizQuestions = [
  {
    category: "Bài tập 2.30a SGK (tr. 48)",
    question: "Tìm ƯCLN(30, 48):",
    answers: [
      { text: "ƯCLN(30, 48) = 6", correct: true },
      { text: "ƯCLN(30, 48) = 3", correct: false },
      { text: "ƯCLN(30, 48) = 15", correct: false },
      { text: "ƯCLN(30, 48) = 10", correct: false }
    ],
    explanation: "30 = 2 × 3 × 5 và 48 = 2⁴ × 3. Các TSNT chung là 2 và 3. Số mũ nhỏ nhất của 2 là 1, của 3 là 1. Vậy ƯCLN(30, 48) = 2 × 3 = 6."
  },
  {
    category: "Bài tập 2.30b SGK (tr. 48)",
    question: "Tìm ƯCLN(1, 104) và ƯCLN(128, 36, 1):",
    answers: [
      { text: "Đều bằng 1", correct: true },
      { text: "104 và 36", correct: false },
      { text: "1 và 4", correct: false },
      { text: "Không tồn tại ƯCLN", correct: false }
    ],
    explanation: "Theo chú ý SGK trang 45: Với mọi số tự nhiên a và b, ƯCLN(a, 1) = 1 và ƯCLN(a, b, 1) = 1. Vì vậy cả hai đều bằng 1."
  },
  {
    category: "Bài tập 2.31 SGK (tr. 48)",
    question: "Hai số 24 và 35 có phải là hai số nguyên tố cùng nhau không?",
    answers: [
      { text: "Không, vì cả hai đều là hợp số", correct: false },
      { text: "Có, vì ƯCLN(24, 35) = 1", correct: true },
      { text: "Không, vì 24 là số chẵn", correct: false },
      { text: "Chỉ khi chia cho 5 mới nguyên tố cùng nhau", correct: false }
    ],
    explanation: "24 = 2³ × 3 và 35 = 5 × 7. Hai số này không có thừa số nguyên tố chung nào, do đó ƯCLN(24, 35) = 1. Hai số có ƯCLN = 1 được gọi là hai số nguyên tố cùng nhau."
  },
  {
    category: "Bài tập 2.32a SGK (tr. 48)",
    question: "Rút gọn phân số 28/42 về phân số tối giản:",
    answers: [
      { text: "14/21", correct: false },
      { text: "2/3", correct: true },
      { text: "4/6", correct: false },
      { text: "7/10", correct: false }
    ],
    explanation: "ƯCLN(28, 42) = 14. Ta chia cả tử và mẫu cho 14: 28 : 14 = 2 và 42 : 14 = 3. Phân số tối giản là 2/3."
  },
  {
    category: "Bài tập 2.32b SGK (tr. 48)",
    question: "Rút gọn phân số 60/135 về phân số tối giản:",
    answers: [
      { text: "12/27", correct: false },
      { text: "4/9", correct: true },
      { text: "20/45", correct: false },
      { text: "2/5", correct: false }
    ],
    explanation: "60 = 2² × 3 × 5 và 135 = 3³ × 5 ⇒ ƯCLN(60, 135) = 3 × 5 = 15. Chia cả tử và mẫu cho 15: 60:15 = 4; 135:15 = 9 ⇒ Phân số tối giản là 4/9."
  },
  {
    category: "Bài tập 2.32c SGK (tr. 48)",
    question: "Rút gọn phân số 288/180 về phân số tối giản:",
    answers: [
      { text: "16/10", correct: false },
      { text: "8/5", correct: true },
      { text: "72/45", correct: false },
      { text: "12/7", correct: false }
    ],
    explanation: "288 = 2⁵ × 3² và 180 = 2² × 3² × 5 ⇒ ƯCLN(288, 180) = 2² × 3² = 36. Chia cả tử và mẫu cho 36: 288:36 = 8; 180:36 = 5 ⇒ Phân số tối giản là 8/5."
  },
  {
    category: "Bài tập 2.33 SGK (tr. 48)",
    question: "Cho a = 72, b = 96, c = 120. Tìm ƯCLN(a, b, c):",
    answers: [
      { text: "12", correct: false },
      { text: "24", correct: true },
      { text: "18", correct: false },
      { text: "36", correct: false }
    ],
    explanation: "72 = 2³ × 3²; 96 = 2⁵ × 3; 120 = 2³ × 3 × 5. Các TSNT chung là 2 và 3. Số mũ nhỏ nhất của 2 là 3, của 3 là 1 ⇒ ƯCLN(72, 96, 120) = 2³ × 3 = 24."
  },
  {
    category: "Bài tập 2.34 SGK (tr. 48)",
    question: "Đội văn nghệ có 24 bạn nam và 36 bạn nữ, chia đều vào các tổ. Hỏi có thể chia được nhiều nhất bao nhiêu tổ?",
    answers: [
      { text: "6 tổ", correct: false },
      { text: "12 tổ", correct: true },
      { text: "8 tổ", correct: false },
      { text: "4 tổ", correct: false }
    ],
    explanation: "Số tổ nhiều nhất chính là ƯCLN(24, 36). Vì 24 = 2³ × 3 và 36 = 2² × 3² nên ƯCLN(24, 36) = 2² × 3 = 12. Vậy có thể chia được nhiều nhất 12 tổ (mỗi tổ 2 nam, 3 nữ)."
  },
  {
    category: "Bài tập 2.35 SGK (tr. 48)",
    question: "Tấm gỗ hình chữ nhật 56 cm × 48 cm được cắt thành các hình vuông bằng nhau có cạnh lớn nhất. Cạnh hình vuông dài bao nhiêu cm?",
    answers: [
      { text: "4 cm", correct: false },
      { text: "6 cm", correct: false },
      { text: "8 cm", correct: true },
      { text: "12 cm", correct: false }
    ],
    explanation: "Độ dài cạnh hình vuông lớn nhất là ƯCLN(56, 48). 56 = 2³ × 7; 48 = 2⁴ × 3 ⇒ ƯCLN(56, 48) = 2³ = 8 cm."
  },
  {
    category: "Luyện tập 2 SGK (tr. 46)",
    question: "Biết ƯCLN(36, 84) = 12. Tập hợp tất cả các ước chung ƯC(36, 84) là:",
    answers: [
      { text: "{1; 2; 3; 4; 6; 12}", correct: true },
      { text: "{1; 2; 3; 6; 12}", correct: false },
      { text: "{2; 4; 6; 12}", correct: false },
      { text: "{1; 3; 4; 12}", correct: false }
    ],
    explanation: "Theo quy tắc SGK trang 46: ƯC(a, b) = Ư(ƯCLN(a, b)). Vì vậy ƯC(36, 84) = Ư(12) = {1; 2; 3; 4; 6; 12}."
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
    btn.innerHTML = `<span style="color:#0d9488; font-weight:800;">${String.fromCharCode(65 + idx)}.</span> <span>${ans.text}</span>`;
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
    // highlight correct
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
    alert(`🎉 Chúc mừng bạn đã hoàn thành Đấu trường 10 câu SGK! Điểm tổng kết: ${state.score} XP!`);
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

  // GCD Calculator & Simplifier buttons
  document.getElementById('btn-calc-gcd').addEventListener('click', runGCDMachine);
  document.getElementById('btn-simplify-frac').addEventListener('click', runFractionSimplifier);

  // Quiz next
  document.getElementById('btn-next-question').addEventListener('click', nextQuizQuestion);

  // Date on Certificate
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  document.getElementById('cert-date').textContent = dateStr;

  // Run initial calculator demo
  runGCDMachine();
  renderQuizQuestion();
  updateHUD();
});
