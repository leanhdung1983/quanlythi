/* ==========================================================================
   BÀI 12: BỘI CHUNG. BỘI CHUNG NHỎ NHẤT - TOÁN 6 KẾT NỐI TRI THỨC
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
  const colors = ['#2563eb', '#7c3aed', '#3b82f6', '#f59e0b', '#10b981', '#ec4899'];

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
  playerName: 'Phi Hành Gia Toán Học',
  avatar: '🚀',
  score: 0,
  stars: 0,
  streak: 0,
  currentQuizIndex: 0,
  badges: {
    b1: false, // Nhà tổ chức tiệc tài ba
    b2: false, // Chuyên gia cỗ máy BCNN
    b3: false, // Bậc thầy quy đồng mẫu số
    b4: false, // Chuỗi 3 câu đúng
    b5: false  // Vua BCNN (10/10 quiz)
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

  let rank = 'Thám Hiểm Vũ Trụ Số';
  if (state.score >= 180) rank = 'Chúa Tể Bội Chung Vũ Trụ 🌌';
  else if (state.score >= 120) rank = 'Phi Hành Gia Kỳ Cựu 🛸';
  else if (state.score >= 60) rank = 'Nhà Du Hành Tập Sự 🚀';

  document.getElementById('hud-rank').textContent = rank;

  // Sync Certificate
  document.getElementById('cert-name').textContent = state.playerName;
  document.getElementById('cert-score').textContent = state.score;
  document.getElementById('cert-stars').textContent = state.stars;
  document.getElementById('cert-rank').textContent = rank;
}

// 4. KHỞI ĐỘNG TIỆC SINH NHẬT
function checkParty(btn, isCorrect, explanation) {
  sound.click();
  const feedback = document.getElementById('party-feedback');
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
    feedback.innerHTML = `❌ <strong>Chưa chính xác:</strong> ${explanation}`;
  }
}

// 5. CỖ MÁY TÍNH TOÁN BCNN & PHÂN SỐ
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
  const sortedKeys = Object.keys(factors).map(Number).sort((a, b) => a - b);
  for (const p of sortedKeys) {
    const exp = factors[p];
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

function getLCM(a, b) {
  return (a * b) / getGCD(a, b);
}

function runLCMMachine() {
  sound.click();
  const a = parseInt(document.getElementById('lcm-num1').value, 10);
  const b = parseInt(document.getElementById('lcm-num2').value, 10);
  const resultBox = document.getElementById('lcm-result-box');

  if (!a || !b || a < 1 || b < 1) {
    resultBox.innerHTML = '<span style="color:#f87171;">Vui lòng nhập 2 số tự nhiên lớn hơn 0!</span>';
    return;
  }

  const factA = factorize(a);
  const factB = factorize(b);

  const allPrimes = Array.from(new Set([...Object.keys(factA), ...Object.keys(factB)])).map(Number).sort((x, y) => x - y);
  const maxFactors = {};

  for (const p of allPrimes) {
    maxFactors[p] = Math.max(factA[p] || 0, factB[p] || 0);
  }

  const lcmVal = getLCM(a, b);
  const firstMultiples = [0, lcmVal, lcmVal * 2, lcmVal * 3, lcmVal * 4];

  let html = `<div><strong>📌 Bước 1: Phân tích mỗi số ra thừa số nguyên tố:</strong><br>`;
  html += `• ${a} = ${formatFactorization(factA)}<br>`;
  html += `• ${b} = ${formatFactorization(factB)}</div>`;

  html += `<div style="margin-top:10px;"><strong>📌 Bước 2: Chọn ra các thừa số nguyên tố CHUNG và RIÊNG:</strong><br>`;
  html += `Các thừa số chung và riêng là: <span style="color:#fde047; font-weight:800;">${allPrimes.join(', ')}</span></div>`;

  html += `<div style="margin-top:10px;"><strong>📌 Bước 3: Lập tích với SỐ MŨ LỚN NHẤT:</strong><br>`;
  html += `👉 <strong>BCNN(${a}, ${b}) = ${formatFactorization(maxFactors)} = <span style="font-size:1.3rem; color:#fde047;">${lcmVal}</span></strong></div>`;

  html += `<div style="margin-top:12px; padding:10px; background:#0f172a; border-radius:8px;">`;
  html += `🎯 <strong>Tập hợp các bội chung:</strong><br>`;
  html += `BC(${a}, ${b}) = B(${lcmVal}) = <strong>{ ${firstMultiples.join('; ')}; ... }</strong>`;
  html += `</div>`;

  resultBox.innerHTML = html;
  sound.correct();
  addScore(10, 1);
  unlockBadge('badge-2');
}

function runFractionOp() {
  sound.click();
  const n1 = parseInt(document.getElementById('frac1-num').value, 10);
  const d1 = parseInt(document.getElementById('frac1-den').value, 10);
  const n2 = parseInt(document.getElementById('frac2-num').value, 10);
  const d2 = parseInt(document.getElementById('frac2-den').value, 10);
  const op = document.getElementById('frac-op').value;
  const resBox = document.getElementById('frac-op-result');

  if (!n1 || !d1 || !n2 || !d2 || d1 < 1 || d2 < 1) {
    resBox.innerHTML = '<span style="color:#dc2626;">Mẫu số phải lớn hơn 0!</span>';
    return;
  }

  const commonDen = getLCM(d1, d2);
  const m1 = commonDen / d1;
  const m2 = commonDen / d2;

  const newN1 = n1 * m1;
  const newN2 = n2 * m2;

  let finalNum = op === '+' ? newN1 + newN2 : newN1 - newN2;

  let html = `<p><strong>1. Tìm mẫu chung nhỏ nhất:</strong> BCNN(${d1}, ${d2}) = <strong>${commonDen}</strong></p>`;
  html += `<p style="margin: 6px 0;"><strong>2. Thừa số phụ:</strong> ${commonDen} : ${d1} = <strong>${m1}</strong>; &nbsp; ${commonDen} : ${d2} = <strong>${m2}</strong></p>`;
  html += `<p style="margin: 6px 0;"><strong>3. Quy đồng mẫu số:</strong></p>`;
  html += `<p style="font-size:1.15rem; color:#2563eb; font-weight:700;">`;
  html += `(${n1}×${m1}) / ${commonDen} ${op} (${n2}×${m2}) / ${commonDen} = ${newN1}/${commonDen} ${op} ${newN2}/${commonDen}`;
  html += `</p>`;

  html += `<p style="margin-top:10px; font-size:1.35rem; font-weight:900; color:#1d4ed8;">`;
  html += `Kết quả: <span style="background:#fef3c7; padding:4px 14px; border-radius:8px; color:#b45309;">${finalNum} / ${commonDen}</span>`;

  // Rút gọn nếu cần
  if (finalNum !== 0) {
    const absNum = Math.abs(finalNum);
    const gcdVal = getGCD(absNum, commonDen);
    if (gcdVal > 1) {
      const redNum = finalNum / gcdVal;
      const redDen = commonDen / gcdVal;
      html += ` = <span style="background:#dcfce7; padding:4px 14px; border-radius:8px; color:#15803d;">${redNum} / ${redDen}</span> (rút gọn tối giản)`;
    }
  }
  html += `</p>`;

  resBox.innerHTML = html;
  sound.correct();
  addScore(10, 1);
  unlockBadge('badge-3');
}

// 6. QUIZ ARENA (10 CÂU BÁM SÁT BÀI TẬP 2.36 – 2.44 SGK)
const quizQuestions = [
  {
    category: "Bài tập 2.36 SGK (tr. 53)",
    question: "Tìm BCNN(30, 45):",
    answers: [
      { text: "BCNN(30, 45) = 90", correct: true },
      { text: "BCNN(30, 45) = 15", correct: false },
      { text: "BCNN(30, 45) = 135", correct: false },
      { text: "BCNN(30, 45) = 60", correct: false }
    ],
    explanation: "30 = 2 × 3 × 5 và 45 = 3² × 5. TSNT chung và riêng là 2, 3, 5 với số mũ lớn nhất lần lượt là 1, 2, 1. Do đó BCNN(30, 45) = 2 × 3² × 5 = 2 × 9 × 5 = 90."
  },
  {
    category: "Bài tập 2.37a SGK (tr. 53)",
    question: "Tìm BCNN(2, 3, 5):",
    answers: [
      { text: "15", correct: false },
      { text: "30", correct: true },
      { text: "60", correct: false },
      { text: "10", correct: false }
    ],
    explanation: "Vì 2, 3, 5 là các số nguyên tố cùng nhau từng đôi một, nên BCNN của chúng bằng tích của 3 số: 2 × 3 × 5 = 30."
  },
  {
    category: "Bài tập 2.37b SGK (tr. 53)",
    question: "Tìm BCNN(10, 1, 12):",
    answers: [
      { text: "120", correct: false },
      { text: "60", correct: true },
      { text: "30", correct: false },
      { text: "1", correct: false }
    ],
    explanation: "Theo chú ý SGK: BCNN(a, b, 1) = BCNN(a, b). Vì 10 = 2 × 5 và 12 = 2² × 3 nên BCNN(10, 12) = 2² × 3 × 5 = 60. Vậy BCNN(10, 1, 12) = 60."
  },
  {
    category: "Bài tập 2.38 SGK (tr. 53)",
    question: "Tìm tập hợp tất cả các bội chung BC(30, 45) nhỏ hơn 500:",
    answers: [
      { text: "{0; 90; 180; 270; 360; 450}", correct: true },
      { text: "{90; 180; 270; 360; 450; 540}", correct: false },
      { text: "{0; 45; 90; 135; 180; 225}", correct: false },
      { text: "{0; 90; 180; 270}", correct: false }
    ],
    explanation: "Vì BCNN(30, 45) = 90 nên BC(30, 45) là các bội của 90. Các bội của 90 nhỏ hơn 500 là: 0, 90, 180, 270, 360, 450."
  },
  {
    category: "Bài tập 2.39 SGK (tr. 53)",
    question: "Tìm số tự nhiên a nhỏ nhất khác 0 biết a ⋮ 28 và a ⋮ 32:",
    answers: [
      { text: "112", correct: false },
      { text: "224", correct: true },
      { text: "448", correct: false },
      { text: "896", correct: false }
    ],
    explanation: "Số a nhỏ nhất khác 0 chia hết cho cả 28 và 32 chính là BCNN(28, 32). Ta có 28 = 2² × 7 và 32 = 2⁵. Do đó BCNN(28, 32) = 2⁵ × 7 = 32 × 7 = 224."
  },
  {
    category: "Bài tập 2.40a SGK (tr. 53)",
    question: "Thực hiện phép tính cộng phân số: 5/12 + 3/16 =",
    answers: [
      { text: "8/28", correct: false },
      { text: "29/48", correct: true },
      { text: "15/48", correct: false },
      { text: "1/2", correct: false }
    ],
    explanation: "BCNN(12, 16) = 48. Thừa số phụ: 48:12 = 4; 48:16 = 3. Quy đồng: 5/12 = 20/48 và 3/16 = 9/48 ⇒ 20/48 + 9/48 = 29/48."
  },
  {
    category: "Bài tập 2.40b SGK (tr. 53)",
    question: "Thực hiện phép tính trừ phân số: 4/15 - 2/9 =",
    answers: [
      { text: "2/6", correct: false },
      { text: "2/45", correct: true },
      { text: "6/45", correct: false },
      { text: "1/45", correct: false }
    ],
    explanation: "BCNN(15, 9) = 45. Thừa số phụ: 45:15 = 3; 45:9 = 5. Quy đồng: 4/15 = 12/45 và 2/9 = 10/45 ⇒ 12/45 - 10/45 = 2/45."
  },
  {
    category: "Bài tập 2.42 SGK (tr. 54)",
    question: "Ba xe buýt xuất phát từ bến Mỹ Đình: tuyến 1 sau 15 phút, tuyến 2 sau 9 phút, tuyến 3 sau 10 phút. Sau ít nhất bao lâu ba xe lại cùng xuất phát một lần nữa?",
    answers: [
      { text: "60 phút", correct: false },
      { text: "90 phút (1 giờ 30 phút)", correct: true },
      { text: "120 phút", correct: false },
      { text: "150 phút", correct: false }
    ],
    explanation: "Thời gian ít nhất để 3 xe cùng xuất phát lại là BCNN(15, 9, 10). Ta có 15 = 3 × 5; 9 = 3²; 10 = 2 × 5 ⇒ BCNN(15, 9, 10) = 2 × 3² × 5 = 90 phút (tức 1 giờ 30 phút)."
  },
  {
    category: "Bài tập 2.43 SGK (tr. 54)",
    question: "Học sinh khối 6 khi xếp hàng 10, hàng 12, hàng 15 đều vừa đủ. Số học sinh trong khoảng 200 đến 250 em. Khối 6 có bao nhiêu học sinh?",
    answers: [
      { text: "210 học sinh", correct: false },
      { text: "240 học sinh", correct: true },
      { text: "220 học sinh", correct: false },
      { text: "250 học sinh", correct: false }
    ],
    explanation: "Số học sinh là bội chung của 10, 12, 15. BCNN(10, 12, 15) = 60. Tập hợp bội chung là {0; 60; 120; 180; 240; 300...}. Trong khoảng từ 200 đến 250 chỉ có duy nhất số 240. Vậy khối 6 có 240 học sinh."
  },
  {
    category: "Em có biết: Lịch Can Chi (tr. 54)",
    question: "Tại sao cứ sau đúng 60 năm, tên của một năm âm lịch (ví dụ năm Giáp Tý) lại lặp lại một lần?",
    answers: [
      { text: "Vì 60 là tích của 6 và 10", correct: false },
      { text: "Vì 60 là BCNN của 10 Can và 12 Chi", correct: true },
      { text: "Do người xưa quy ước ngẫu nhiên", correct: false },
      { text: "Vì một thế kỉ có 100 năm", correct: false }
    ],
    explanation: "Hệ thống lịch Can Chi kết hợp 10 Can và 12 Chi tuần hoàn đồng thời. Chu kỳ lặp lại đồng thời của cả hai chính là BCNN(10, 12) = 60 năm (gọi là một Lục thập hoa giáp)!"
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
    btn.innerHTML = `<span style="color:#2563eb; font-weight:800;">${String.fromCharCode(65 + idx)}.</span> <span>${ans.text}</span>`;
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
    alert(`🎉 Chúc mừng bạn đã hoàn thành Đấu trường 10 câu SGK! Điểm tổng kết: ${state.score} XP! Hãy chiêm ngưỡng Giấy chứng nhận bên dưới.`);
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

  // LCM Calculator & Fraction Op buttons
  document.getElementById('btn-calc-lcm').addEventListener('click', runLCMMachine);
  document.getElementById('btn-calc-fraction-op').addEventListener('click', runFractionOp);

  // Quiz next
  document.getElementById('btn-next-question').addEventListener('click', nextQuizQuestion);

  // Date on Certificate
  const today = new Date();
  const dateStr = `${today.getDate().toString().padStart(2, '0')}/${(today.getMonth() + 1).toString().padStart(2, '0')}/${today.getFullYear()}`;
  document.getElementById('cert-date').textContent = dateStr;

  // Run initial calculator demo
  runLCMMachine();
  renderQuizQuestion();
  updateHUD();
});
