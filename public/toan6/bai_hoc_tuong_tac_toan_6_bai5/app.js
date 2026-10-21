/**
 * ==============================================================================
 * TOÁN 6 - BÀI 5: PHÉP NHÂN VÀ PHÉP CHIA SỐ TỰ NHIÊN
 * KẾT NỐI TRI THỨC VỚI CUỘC SỐNG (TRANG 17 - 19)
 * MINI-GAME HỌC TẬP TƯƠNG TÁC, WEB AUDIO API & ĐẤU TRƯỜNG QUIZ
 * ==============================================================================
 */

// ==============================================================================
// 1. GAME STATE & AUDIO ENGINE
// ==============================================================================
const GameState = {
  playerName: "Bậc Thầy Tính Nhẩm",
  playerAvatar: "🧙",
  score: 0,
  stars: 0,
  streak: 0,
  soundEnabled: true,
  unlockedBadges: new Set()
};

// Web Audio API Synthesizer (100% offline, standalone)
class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, delay = 0) {
    if (!GameState.soundEnabled) return;
    try {
      this.init();
      setTimeout(() => {
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
      }, delay * 1000);
    } catch (e) {
      console.warn("Audio not supported or blocked", e);
    }
  }

  click() {
    this.playTone(700, 'sine', 0.08);
  }

  correct() {
    this.playTone(523.25, 'triangle', 0.15, 0);       // C5
    this.playTone(659.25, 'triangle', 0.15, 0.1);     // E5
    this.playTone(783.99, 'triangle', 0.25, 0.2);     // G5
    this.playTone(1046.50, 'triangle', 0.35, 0.3);    // C6
  }

  wrong() {
    this.playTone(280, 'sawtooth', 0.2, 0);
    this.playTone(200, 'sawtooth', 0.3, 0.15);
  }

  fanfare() {
    const notes = [440, 554, 659, 880, 1108];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.35, idx * 0.12);
    });
  }
}

const sounds = new SoundEngine();

// ==============================================================================
// 2. CONFETTI PARTICLES ENGINE
// ==============================================================================
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationId = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function launchConfetti(count = 70) {
  const colors = ['#8b5cf6', '#a78bfa', '#f59e0b', '#fde68a', '#10b981', '#ec4899', '#0284c7'];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }
  if (!animationId) {
    animateConfetti();
  }
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.4;
    p.rotation += p.vRot;
    p.opacity -= 0.012;

    if (p.opacity <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.opacity;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }

  if (particles.length > 0) {
    animationId = requestAnimationFrame(animateConfetti);
  } else {
    animationId = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

function showFloatingScore(text, x, y) {
  const el = document.createElement('div');
  el.className = 'floating-score';
  el.textContent = text;
  el.style.left = `${x || window.innerWidth / 2}px`;
  el.style.top = `${y || window.innerHeight / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

function addRewards(points, stars = 1, e = null) {
  GameState.score += points;
  GameState.stars += stars;
  GameState.streak += 1;

  document.getElementById('hud-score').textContent = GameState.score;
  document.getElementById('hud-stars').textContent = GameState.stars;

  const comboEl = document.getElementById('hud-combo');
  if (GameState.streak >= 2) {
    comboEl.classList.add('active');
    comboEl.textContent = `🔥 Combo x${GameState.streak}!`;
  } else {
    comboEl.classList.remove('active');
  }

  sounds.correct();
  const posX = e ? (e.clientX || e.pageX) : (window.innerWidth / 2);
  const posY = e ? (e.clientY || e.pageY) : (window.innerHeight / 2);
  showFloatingScore(`+${points} 🪙`, posX, posY);

  updateCertificate();
}

function resetStreak() {
  GameState.streak = 0;
  const comboEl = document.getElementById('hud-combo');
  comboEl.classList.remove('active');
}

function unlockBadge(id, title) {
  if (GameState.unlockedBadges.has(id)) return;
  GameState.unlockedBadges.add(id);
  const el = document.getElementById(`badge-${id}`);
  if (el) {
    el.classList.add('unlocked');
  }
  sounds.fanfare();
  launchConfetti(80);
}

// ==============================================================================
// 3. START SCREEN & INITIALIZATION
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Avatar selection
  document.querySelectorAll('.avatar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      GameState.playerAvatar = btn.getAttribute('data-avatar');
      sounds.click();
    });
  });

  // Sound toggle
  const soundBtn = document.getElementById('btn-sound-toggle');
  soundBtn.addEventListener('click', () => {
    GameState.soundEnabled = !GameState.soundEnabled;
    soundBtn.textContent = GameState.soundEnabled ? '🔊' : '🔇';
    sounds.click();
  });

  // Start adventure
  const startBtn = document.getElementById('btn-start-adventure');
  startBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('player-name-input').value.trim();
    if (nameInput) {
      GameState.playerName = nameInput;
    }
    document.getElementById('hud-name-display').textContent = GameState.playerName;
    document.getElementById('hud-avatar-display').textContent = GameState.playerAvatar;
    document.getElementById('cert-student-name-display').textContent = GameState.playerName;

    document.getElementById('start-screen').classList.add('hidden');
    sounds.fanfare();
    launchConfetti(50);
  });

  // Init Modules
  showMentalTrick(1);
  calculateDivision();
  initQuizArena();
  updateCertificate();
});

// ==============================================================================
// 4. SECTION 1: TÚI GẠO CỦA MẸ (KHỞI ĐỘNG TRANG 17 & VẬN DỤNG 3 TRANG 19)
// ==============================================================================
let bill50kCount = 0;

function addBill50k() {
  if (bill50kCount >= 6) return;
  bill50kCount++;
  sounds.click();

  const tray = document.getElementById('bills-tray');
  const bill = document.createElement('div');
  bill.className = 'bill-50k';
  bill.textContent = '💵 50 000 đ';
  tray.appendChild(bill);

  const fb = document.getElementById('rice-feedback');
  const totalPaid = bill50kCount * 50000;

  if (bill50kCount === 4) {
    fb.innerHTML =
      '🎉 <strong>HOÀN HẢO!</strong> 4 tờ 50 000 đ = <strong>200 000 đ</strong>, vừa đủ trả tiền cho 10 kg gạo! Phép tính: <strong>200 000 : 50 000 = 4 (tờ)</strong>!';
    fb.style.color = '#15803d';
    addRewards(20, 1);
    unlockBadge(1, "Thủ Lĩnh Túi Gạo");
  } else if (bill50kCount < 4) {
    fb.innerHTML =
      `Đã đưa ${bill50kCount} tờ = <strong>${totalPaid.toLocaleString('vi-VN')} đ</strong>. Chưa đủ 200 000 đ! Hãy bấm thêm tờ 50k nhé!`;
    fb.style.color = '#7c2d12';
  } else {
    fb.innerHTML =
      `⚠️ Đã đưa ${bill50kCount} tờ = <strong>${totalPaid.toLocaleString('vi-VN')} đ</strong> (thừa tiền rồi! Chỉ cần đúng 4 tờ thôi nhé). Bấm "Đếm lại" để thử lại!`;
    fb.style.color = '#dc2626';
    sounds.wrong();
    resetStreak();
  }
}

function resetBills() {
  bill50kCount = 0;
  document.getElementById('bills-tray').innerHTML = '';
  document.getElementById('rice-feedback').innerHTML = 'Bấm thêm các tờ 50k để trả đủ 200 000 đ tiền gạo nhé!';
  document.getElementById('rice-feedback').style.color = '';
  sounds.click();
}

// ==============================================================================
// 5. SECTION 2: TAM GIÁC VÀNG TÍNH NHẨM (2x5, 4x25, 8x125)
// ==============================================================================
const mentalTricksData = {
  1: {
    title: "Ví dụ 2: 24 × 25",
    content: `
      <div style="font-size: 1.6rem; font-weight: 900; color: #6d28d9; margin-bottom: 8px;">
        24 × 25 = (6 × 4) × 25
      </div>
      <div style="font-size: 1.3rem; font-weight: 800; color: #059669; margin-bottom: 8px;">
        = 6 × (4 × 25) = 6 × 100 = <strong>600</strong>
      </div>
      <p style="color: #475569; font-size: 0.95rem;">
        💡 <em>Bí kíp:</em> Nhìn thấy thừa số 25, lập tức phân tích 24 = 6 × 4 để ghép (4 × 25 = 100)!
      </p>
    `
  },
  2: {
    title: "Luyện tập 2: 125 × 8 001 × 8",
    content: `
      <div style="font-size: 1.6rem; font-weight: 900; color: #6d28d9; margin-bottom: 8px;">
        125 × 8 001 × 8 = (125 × 8) × 8 001
      </div>
      <div style="font-size: 1.3rem; font-weight: 800; color: #059669; margin-bottom: 8px;">
        = 1 000 × 8 001 = <strong>8 001 000</strong>
      </div>
      <p style="color: #475569; font-size: 0.95rem;">
        💡 <em>Bí kíp:</em> Dùng tính chất giao hoán và kết hợp để nhóm (125 × 8 = 1 000). Nhân với 1 000 chỉ cần thêm 3 chữ số 0!
      </p>
    `
  },
  3: {
    title: "Bài 1.25a: 125 × 101",
    content: `
      <div style="font-size: 1.6rem; font-weight: 900; color: #6d28d9; margin-bottom: 8px;">
        125 × 101 = 125 × (100 + 1)
      </div>
      <div style="font-size: 1.3rem; font-weight: 800; color: #059669; margin-bottom: 8px;">
        = 125 × 100 + 125 × 1 = 12 500 + 125 = <strong>12 625</strong>
      </div>
      <p style="color: #475569; font-size: 0.95rem;">
        💡 <em>Bí kíp:</em> Áp dụng tính chất phân phối a(b + c) = ab + ac với 101 = 100 + 1!
      </p>
    `
  },
  4: {
    title: "Bài 1.25b: 21 × 49",
    content: `
      <div style="font-size: 1.6rem; font-weight: 900; color: #6d28d9; margin-bottom: 8px;">
        21 × 49 = 21 × (50 - 1)
      </div>
      <div style="font-size: 1.3rem; font-weight: 800; color: #059669; margin-bottom: 8px;">
        = 21 × 50 - 21 × 1 = 1 050 - 21 = <strong>1 029</strong>
      </div>
      <p style="color: #475569; font-size: 0.95rem;">
        💡 <em>Bí kíp:</em> Viết 49 = 50 - 1. Nhân 21 × 50 = 1 050, rồi trừ đi 21 ta được ngay 1 029!
      </p>
    `
  }
};

function showMentalTrick(id) {
  const data = mentalTricksData[id];
  document.getElementById('mental-display-box').innerHTML = data.content;
  sounds.correct();
  addRewards(15, 1);
  unlockBadge(2, "Bậc Thầy Tính Nhẩm");
}

// ==============================================================================
// 6. SECTION 3: CỖ MÁY PHÉP CHIA & SỐ DƯ (a = bq + r)
// ==============================================================================
function setDivSample(a, b) {
  document.getElementById('div-input-a').value = a;
  document.getElementById('div-input-b').value = b;
  calculateDivision();
}

function calculateDivision() {
  const a = parseInt(document.getElementById('div-input-a').value, 10);
  const b = parseInt(document.getElementById('div-input-b').value, 10);

  if (isNaN(a) || isNaN(b) || b <= 0) {
    alert("Số chia b phải là số tự nhiên lớn hơn 0!");
    return;
  }

  const q = Math.floor(a / b);
  const r = a % b;

  document.getElementById('res-quotient').textContent = q.toLocaleString('vi-VN');
  document.getElementById('res-remainder').textContent = r.toLocaleString('vi-VN');

  const typeEl = document.getElementById('res-type');
  if (r === 0) {
    typeEl.textContent = 'Phép chia hết (r = 0)';
    typeEl.style.color = '#15803d';
  } else {
    typeEl.textContent = `Phép chia có dư (r = ${r} < ${b})`;
    typeEl.style.color = '#ea580c';
  }

  document.getElementById('res-formula').textContent =
    `${a.toLocaleString('vi-VN')} = ${b.toLocaleString('vi-VN')} × ${q.toLocaleString('vi-VN')} + ${r.toLocaleString('vi-VN')}`;

  sounds.click();
  addRewards(15, 1);
  unlockBadge(3, "Chiến Binh Phép Chia");
}

// ==============================================================================
// 7. SECTION 4: BÀI TOÁN XẾP XE & GHẾ BĂNG (CHIA CÓ DƯ LÀM TRÒN LÊN)
// ==============================================================================
function unlockTripBadge(type) {
  addRewards(20, 1);
  sounds.correct();
  unlockBadge(4, "Điều Phối Viên Tài Ba");
}

// ==============================================================================
// 8. SECTION 6: ĐẤU TRƯỜNG 8 CÂU HỎI TRỌNG TÂM (ARENA QUIZ)
// ==============================================================================
const quizBank = [
  {
    q: "Câu 1: Cho phép nhân a · b = c. Trong đó a và b được gọi là gì, c được gọi là gì?",
    options: [
      "a, b là số hạng; c là tổng",
      "a, b là thừa số; c là tích",
      "a, b là số chia; c là thương",
      "a, b là số bị trừ; c là hiệu"
    ],
    correct: 1,
    explain: "SGK tr.17: Trong phép nhân a · b = c, a và b được gọi là các thừa số, c được gọi là tích."
  },
  {
    q: "Câu 2: Tính chất phân phối của phép nhân đối với phép cộng được viết là:",
    options: [
      "a(b + c) = ab + ac",
      "a(bc) = (ab)c",
      "ab = ba",
      "a + (b · c) = (a + b) · c"
    ],
    correct: 0,
    explain: "SGK tr.18: Tính chất phân phối: a(b + c) = ab + ac."
  },
  {
    q: "Câu 3: Trong phép chia có dư a = b · q + r, điều kiện của số dư r là:",
    options: [
      "r > b",
      "0 ≤ r < b (số dư luôn nhỏ hơn số chia)",
      "r = b",
      "r tuỳ ý"
    ],
    correct: 1,
    explain: "SGK tr.18: Luôn tìm được đúng hai số tự nhiên q và r sao cho a = b · q + r với 0 ≤ r < b."
  },
  {
    q: "Câu 4: (Ví dụ 2 SGK) Để tính nhẩm nhanh 24 · 25, ta tách thừa số 24 thành:",
    options: [
      "20 + 4",
      "6 · 4 để ghép (4 · 25 = 100), được 6 · 100 = 600",
      "2 · 12",
      "3 · 8"
    ],
    correct: 1,
    explain: "SGK tr.18: Ta phân tích 24 = 6 · 4, rồi kết hợp (4 · 25) = 100, ta có 6 · 100 = 600."
  },
  {
    q: "Câu 5: (Luyện tập 2 SGK) Kết quả của phép tính nhẩm 125 · 8 001 · 8 là:",
    options: [
      "8 001 000",
      "800 100",
      "80 010 000",
      "1 000 800"
    ],
    correct: 0,
    explain: "Nhóm (125 · 8) · 8 001 = 1 000 · 8 001 = 8 001 000."
  },
  {
    q: "Câu 6: (Bài 1.29 SGK) Lễ tổng kết có 997 học sinh, ghế băng có 5 chỗ ngồi. Cần ít nhất bao nhiêu ghế băng?",
    options: [
      "199 ghế",
      "200 ghế",
      "201 ghế",
      "198 ghế"
    ],
    correct: 1,
    explain: "Ta có 997 : 5 = 199 (dư 2). Vì còn dư 2 bạn nên phải cần thêm 1 chiếc ghế nữa: 199 + 1 = 200 chiếc ghế băng."
  },
  {
    q: "Câu 7: (Bài 1.26 SGK) Trường có 50 phòng, mỗi phòng 11 bộ bàn ghế, mỗi bộ 4 học sinh. Trường nhận nhiều nhất bao nhiêu học sinh?",
    options: [
      "2 000 học sinh",
      "2 200 học sinh",
      "2 400 học sinh",
      "1 100 học sinh"
    ],
    correct: 1,
    explain: "Số học sinh = (50 · 4) · 11 = 200 · 11 = 2 200 học sinh."
  },
  {
    q: "Câu 8: (Bài 1.30 SGK) Có 1 290 kiện hàng, mỗi chuyến xe chở được 45 kiện. Cần ít nhất bao nhiêu chuyến xe?",
    options: [
      "28 chuyến",
      "29 chuyến",
      "30 chuyến",
      "27 chuyến"
    ],
    correct: 1,
    explain: "Ta có 1 290 : 45 = 28 (dư 30). Còn thừa 30 kiện hàng nên phải cần thêm 1 chuyến nữa: 28 + 1 = 29 chuyến xe."
  }
];

let currentQuizIdx = 0;
let answeredCurrentQuiz = false;

function initQuizArena() {
  currentQuizIdx = 0;
  loadQuizQuestion(currentQuizIdx);
}

function loadQuizQuestion(idx) {
  answeredCurrentQuiz = false;
  const qData = quizBank[idx];

  document.getElementById('quiz-question-number').textContent = `Câu hỏi ${idx + 1} / ${quizBank.length}`;
  document.getElementById('quiz-question-title').textContent = qData.q;

  const fbBox = document.getElementById('quiz-feedback-box');
  fbBox.className = 'quiz-feedback';
  fbBox.innerHTML = '';

  document.getElementById('btn-next-quiz').style.display = 'none';

  const optBox = document.getElementById('quiz-options-box');
  optBox.innerHTML = '';

  const keyLetters = ['A', 'B', 'C', 'D'];
  qData.options.forEach((optText, oIdx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `
      <span class="opt-key">${keyLetters[oIdx]}</span>
      <span>${optText}</span>
    `;
    btn.addEventListener('click', (e) => handleQuizOptionClick(oIdx, btn, e));
    optBox.appendChild(btn);
  });
}

function handleQuizOptionClick(chosenIdx, btn, e) {
  if (answeredCurrentQuiz) return;
  answeredCurrentQuiz = true;

  const qData = quizBank[currentQuizIdx];
  const allBtns = document.querySelectorAll('.option-btn');
  const fbBox = document.getElementById('quiz-feedback-box');

  if (chosenIdx === qData.correct) {
    btn.classList.add('correct');
    addRewards(30, 2, e);
    fbBox.className = 'quiz-feedback show';
    fbBox.innerHTML = `🎉 <strong>CHÍNH XÁC!</strong> ${qData.explain}`;
    launchConfetti(40);
  } else {
    btn.classList.add('wrong');
    allBtns[qData.correct].classList.add('correct');
    sounds.wrong();
    resetStreak();
    fbBox.className = 'quiz-feedback show error';
    fbBox.innerHTML = `⚠️ <strong>CHƯA ĐÚNG!</strong> Đáp án đúng là <strong>${['A', 'B', 'C', 'D'][qData.correct]}</strong>.<br>${qData.explain}`;
  }

  const nextBtn = document.getElementById('btn-next-quiz');
  if (currentQuizIdx < quizBank.length - 1) {
    nextBtn.textContent = 'Câu Tiếp Theo ➡️';
  } else {
    nextBtn.textContent = '🎓 Hoàn Thành & Nhận Chứng Nhận';
    unlockBadge(5, "Đại Kiện Tướng Nhân Chia");
  }
  nextBtn.style.display = 'inline-block';
}

function handleNextQuiz() {
  if (currentQuizIdx < quizBank.length - 1) {
    currentQuizIdx++;
    loadQuizQuestion(currentQuizIdx);
  } else {
    const certEl = document.getElementById('certificate-section');
    certEl.scrollIntoView({ behavior: 'smooth' });
    sounds.fanfare();
    launchConfetti(100);
  }
}

// ==============================================================================
// 9. CERTIFICATE UPDATES & RESTART
// ==============================================================================
function updateCertificate() {
  document.getElementById('cert-student-name-display').textContent = GameState.playerName;
  document.getElementById('cert-score-display').textContent = GameState.score;
  document.getElementById('cert-stars-display').textContent = GameState.stars;

  let rank = "Học Viên Tích Cực";
  if (GameState.score >= 260) rank = "Đại Kiện Tướng Nhân Chia 👑";
  else if (GameState.score >= 160) rank = "Bậc Thầy Tính Nhẩm ⚡";
  else if (GameState.score >= 80) rank = "Chiến Binh Số Học 🌟";

  document.getElementById('cert-rank-display').textContent = rank;

  const now = new Date();
  document.getElementById('cert-date-display').textContent =
    `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
}

function restartLesson() {
  GameState.score = 0;
  GameState.stars = 0;
  GameState.streak = 0;
  GameState.unlockedBadges.clear();

  document.getElementById('hud-score').textContent = '0';
  document.getElementById('hud-stars').textContent = '0';
  document.getElementById('hud-combo').classList.remove('active');

  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`badge-${i}`);
    if (el) el.classList.remove('unlocked');
  }

  resetBills();
  showMentalTrick(1);
  calculateDivision();
  initQuizArena();
  updateCertificate();

  window.scrollTo({ top: 0, behavior: 'smooth' });
  sounds.click();
}
