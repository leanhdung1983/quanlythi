/**
 * BÀI 6: LUỸ THỪA VỚI SỐ MŨ TỰ NHIÊN - TOÁN 6 (KẾT NỐI TRI THỨC)
 * JavaScript logic: Web Audio API, Canvas Confetti, Tương tác Bàn cờ, Cỗ máy Luỹ thừa, Rút gọn siêu tốc, Đấu trường 10 câu SGK, Huy hiệu & Giấy khen.
 */

// ==========================================
// 1. ÂM THANH STANDALONE (WEB AUDIO API)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  play(type) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);

    switch (type) {
      case 'click':
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(440, t);
        osc.frequency.exponentialRampToValueAtTime(880, t + 0.08);
        gain.gain.setValueAtTime(0.2, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.08);
        osc.start(t);
        osc.stop(t + 0.08);
        break;

      case 'start':
        // Ascending cosmic chord
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, t + i * 0.08);
          g.gain.setValueAtTime(0.25, t + i * 0.08);
          g.gain.exponentialRampToValueAtTime(0.001, t + i * 0.08 + 0.35);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(t + i * 0.08);
          o.stop(t + i * 0.08 + 0.35);
        });
        break;

      case 'correct':
        // Cheerful major chord
        [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, t + idx * 0.06);
          g.gain.setValueAtTime(0.25, t + idx * 0.06);
          g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.28);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(t + idx * 0.06);
          o.stop(t + idx * 0.06 + 0.28);
        });
        break;

      case 'wrong':
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, t);
        osc.frequency.linearRampToValueAtTime(110, t + 0.25);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);
        osc.start(t);
        osc.stop(t + 0.25);
        break;

      case 'combo':
        // High energetic sweep
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, t);
        osc.frequency.exponentialRampToValueAtTime(1174.66, t + 0.2);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
        break;

      case 'unlock':
        // Trumpet fanfare
        [440, 554.37, 659.25, 880].forEach((freq, idx) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'triangle';
          o.frequency.setValueAtTime(freq, t + idx * 0.12);
          g.gain.setValueAtTime(0.3, t + idx * 0.12);
          g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.12 + 0.4);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(t + idx * 0.12);
          o.stop(t + idx * 0.12 + 0.4);
        });
        break;

      case 'finish':
        // Grand victory fanfare
        [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((freq, idx) => {
          const o = this.ctx.createOscillator();
          const g = this.ctx.createGain();
          o.type = 'sine';
          o.frequency.setValueAtTime(freq, t + idx * 0.1);
          g.gain.setValueAtTime(0.35, t + idx * 0.1);
          g.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.1 + 0.6);
          o.connect(g);
          g.connect(this.ctx.destination);
          o.start(t + idx * 0.1);
          o.stop(t + idx * 0.1 + 0.6);
        });
        break;
    }
  }
}

const sound = new SoundFX();

function toggleSound() {
  sound.enabled = !sound.enabled;
  const btn = document.getElementById('btn-sound-toggle');
  if (btn) {
    btn.textContent = sound.enabled ? '🔊' : '🔇';
    btn.title = sound.enabled ? 'Tắt âm thanh' : 'Bật âm thanh';
  }
}

// ==========================================
// 2. CANVAS CONFETTI (PHÁO HOA CHIẾN THẮNG)
// ==========================================
class ConfettiManager {
  constructor() {
    this.canvas = document.getElementById('confetti-canvas');
    this.ctx = this.canvas ? this.canvas.getContext('2d') : null;
    this.particles = [];
    this.animId = null;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  resize() {
    if (!this.canvas) return;
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  launch(count = 90) {
    if (!this.canvas || !this.ctx) return;
    this.resize();
    const colors = ['#6366f1', '#06b6d4', '#f59e0b', '#10b981', '#ec4899', '#8b5cf6'];
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height * 0.4,
        size: Math.random() * 8 + 4,
        color: colors[Math.floor(Math.random() * colors.length)],
        vx: (Math.random() - 0.5) * 6,
        vy: Math.random() * 4 + 3,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 10,
        alpha: 1
      });
    }

    if (!this.animId) {
      this.render();
    }
  }

  render() {
    if (!this.ctx) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationSpeed;
      p.alpha -= 0.008;

      if (p.alpha <= 0 || p.y > this.canvas.height) {
        this.particles.splice(i, 1);
        continue;
      }

      this.ctx.save();
      this.ctx.translate(p.x, p.y);
      this.ctx.rotate((p.rotation * Math.PI) / 180);
      this.ctx.globalAlpha = p.alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      this.ctx.restore();
    }

    if (this.particles.length > 0) {
      this.animId = requestAnimationFrame(() => this.render());
    } else {
      this.animId = null;
    }
  }
}

const confetti = new ConfettiManager();

// ==========================================
// 3. TRẠNG THÁI TRÒ CHƠI & DỮ LIỆU
// ==========================================
const gameState = {
  studentName: 'Nhà Thám Hiểm Toán Học',
  avatar: '👨‍🚀',
  score: 0,
  stars: 0,
  streak: 0,
  maxStreak: 0,
  badges: {
    badge1: false, // Bàn cờ vua
    badge2: false, // Chính phương
    badge3: false, // Rút gọn siêu tốc
    badge4: false, // Combo >= 3
    badge5: false  // Score >= 80
  },
  currentSpeedIndex: 0,
  currentQuizIndex: 0,
  quizAnswered: false
};

// ==========================================
// 4. KHỞI TẠO & MODAL BẮT ĐẦU
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setupAvatarPicker();
  initChessboard();
  updatePowerMachine();
  initSquaresBoard();
  loadSpeedMission(0);
  loadQuizQuestion(0);
  updateHUD();
});

function setupAvatarPicker() {
  const options = document.querySelectorAll('.avatar-option');
  options.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      gameState.avatar = opt.getAttribute('data-avatar');
      sound.play('click');
    });
  });
}

function startGame() {
  const nameInput = document.getElementById('student-name-input');
  if (nameInput && nameInput.value.trim()) {
    gameState.studentName = nameInput.value.trim();
  }

  const modal = document.getElementById('start-modal');
  if (modal) {
    modal.classList.add('hidden');
  }

  sound.play('start');
  confetti.launch(50);
  updateHUD();
}

function updateHUD() {
  const nameEl = document.getElementById('hud-name-display');
  const avatarEl = document.getElementById('hud-avatar-display');
  const scoreEl = document.getElementById('hud-score');
  const starsEl = document.getElementById('hud-stars');
  const streakEl = document.getElementById('hud-streak');
  const rankEl = document.getElementById('hud-rank-display');

  if (nameEl) nameEl.textContent = gameState.studentName;
  if (avatarEl) avatarEl.textContent = gameState.avatar;
  if (scoreEl) scoreEl.textContent = gameState.score;
  if (starsEl) starsEl.textContent = gameState.stars;
  if (streakEl) streakEl.textContent = gameState.streak;

  let rank = 'Tân Binh Vũ Trụ';
  if (gameState.score >= 80) rank = 'Đại Kiện Tướng Vũ Trụ 👑';
  else if (gameState.score >= 40) rank = 'Dũng Sĩ Luỹ Thừa ⚔️';
  else if (gameState.score >= 20) rank = 'Học Giả Số Mũ 🎓';

  if (rankEl) rankEl.textContent = rank;

  updateCertificate();
}

function addScore(pts = 10, stars = 1) {
  gameState.score += pts;
  gameState.stars += stars;
  gameState.streak++;
  if (gameState.streak > gameState.maxStreak) {
    gameState.maxStreak = gameState.streak;
  }

  // Bumping streak animation
  const streakBadge = document.getElementById('hud-streak-badge');
  if (streakBadge) {
    streakBadge.classList.add('bump');
    setTimeout(() => streakBadge.classList.remove('bump'), 400);
  }

  if (gameState.streak >= 3) {
    unlockBadge('badge4');
    sound.play('combo');
  } else {
    sound.play('correct');
  }

  if (gameState.score >= 80) {
    unlockBadge('badge5');
  }

  updateHUD();
}

function resetStreak() {
  gameState.streak = 0;
  updateHUD();
}

function unlockBadge(badgeId) {
  if (gameState.badges[badgeId]) return; // Already unlocked
  gameState.badges[badgeId] = true;

  const card = document.getElementById(badgeId);
  if (card) {
    card.classList.remove('locked');
    card.classList.add('unlocked');
  }

  sound.play('unlock');
  confetti.launch(40);
}

// ==========================================
// 5. BÀN CỜ VUA 64 Ô (SECTION 1)
// ==========================================
function initChessboard() {
  const container = document.getElementById('chessboard-grid');
  if (!container) return;
  container.innerHTML = '';

  for (let i = 1; i <= 64; i++) {
    const row = Math.floor((i - 1) / 8);
    const col = (i - 1) % 8;
    const isLight = (row + col) % 2 === 0;

    const sq = document.createElement('div');
    sq.className = `chess-square ${isLight ? 'light' : 'dark'}`;
    sq.id = `chess-sq-${i}`;

    let label = i;
    if (i <= 8) {
      label = `Ô ${i}<br><span class="rice-count-tag">2<sup>${i - 1}</sup></span>`;
    }

    sq.innerHTML = label;
    sq.addEventListener('click', () => selectChessSquare(i));
    container.appendChild(sq);
  }

  selectChessSquare(1, false);
}

function selectChessSquare(num, playAudio = true) {
  document.querySelectorAll('.chess-square').forEach(s => s.classList.remove('active'));
  const target = document.getElementById(`chess-sq-${num}`);
  if (target) target.classList.add('active');

  const formulaEl = document.getElementById('chess-formula-text');
  const descEl = document.getElementById('chess-desc-text');

  if (num <= 8) {
    const grains = Math.pow(2, num - 1);
    const exp = num - 1;
    formulaEl.innerHTML = `Ô thứ ${num}: 2<sup>${exp}</sup> = ${grains.toLocaleString('vi-VN')} hạt thóc`;
    if (exp === 0) {
      descEl.innerHTML = `Ô đầu tiên chỉ có đúng <strong>1 hạt thóc</strong> (2⁰ = 1). Rất giản dị!`;
    } else {
      descEl.innerHTML = `Được nhân đôi qua ${exp} lần: ` + Array(exp).fill(2).join(' • ') + ` = <strong>${grains} hạt thóc</strong>.`;
    }
  } else if (num === 64) {
    formulaEl.innerHTML = `Ô thứ 64: 2⁶³ ≈ 9 223 372 036 854 775 808 hạt thóc!`;
    descEl.innerHTML = `💥 Một con số không tưởng! Tổng cả 64 ô là <strong>2⁶⁴ - 1 ≈ 18 tỉ tỉ hạt thóc (369 tỉ tấn)</strong>! Cả Trái Đất gom lúa nhiều thế kỷ cũng không đủ!`;
  } else {
    formulaEl.innerHTML = `Ô thứ ${num}: 2<sup>${num - 1}</sup> hạt thóc`;
    descEl.innerHTML = `Số hạt thóc tiếp tục nhân đôi cực kỳ nhanh chóng theo cấp số luỹ thừa!`;
  }

  if (playAudio) sound.play('click');
}

function checkHD1(choice) {
  const fb = document.getElementById('hd1-feedback');
  if (choice === 7) {
    fb.innerHTML = '🎉 CHÍNH XÁC! Ô thứ 1 có 1 hạt, từ ô 2 đến ô 8 nhân đôi 7 lần, tức có <strong>7 thừa số 2</strong>: 2⁷ = 128 hạt thóc!';
    fb.style.color = '#15803d';
    addScore(10, 1);
    unlockBadge('badge1');
    confetti.launch(30);
  } else {
    fb.innerHTML = '❌ Chưa đúng rồi! Ô thứ nhất đã có 1 hạt. Đến ô thứ 8 ta cần nhân đôi 7 lần (tức là 7 thừa số 2: 2⁷ = 128). Hãy thử lại nhé!';
    fb.style.color = '#b91c1c';
    resetStreak();
    sound.play('wrong');
  }
}

// ==========================================
// 6. CỖ MÁY LUỸ THỪA & SỐ CHÍNH PHƯƠNG (SECTION 2)
// ==========================================
function updatePowerMachine() {
  const baseInput = document.getElementById('machine-base');
  const expInput = document.getElementById('machine-exponent');
  const expDisplay = document.getElementById('machine-expansion-display');
  const resDisplay = document.getElementById('machine-result-display');

  if (!baseInput || !expInput) return;

  let a = parseInt(baseInput.value) || 1;
  let n = parseInt(expInput.value);
  if (isNaN(n) || n < 0) n = 0;

  if (n === 0) {
    expDisplay.innerHTML = `${a}⁰ (Quy ước đặc biệt: mọi số a ≠ 0 có luỹ thừa 0 bằng 1)`;
    resDisplay.innerHTML = `= 1`;
    return;
  }

  if (n === 1) {
    expDisplay.innerHTML = `${a}¹ (Quy ước: a¹ = a)`;
    resDisplay.innerHTML = `= ${a}`;
    return;
  }

  // n >= 2
  const factors = [];
  const maxDisplay = Math.min(n, 10);
  for (let i = 0; i < maxDisplay; i++) {
    factors.push(a);
  }
  let factorStr = factors.join(' • ');
  if (n > 10) {
    factorStr += ` • ... • ${a} (${n} thừa số ${a})`;
  } else {
    factorStr += ` (${n} thừa số ${a})`;
  }

  expDisplay.innerHTML = `${a}<sup>${n}</sup> = ${factorStr}`;

  // BigInt for safe math calculation
  try {
    const val = BigInt(a) ** BigInt(n);
    if (val.toString().length > 18) {
      resDisplay.innerHTML = `≈ ${Number(val).toExponential(4)}`;
    } else {
      resDisplay.innerHTML = `= ${val.toLocaleString('vi-VN')}`;
    }
  } catch (e) {
    resDisplay.innerHTML = `= Rất lớn`;
  }
}

function setPowerPreset(a, n) {
  const baseInput = document.getElementById('machine-base');
  const expInput = document.getElementById('machine-exponent');
  if (baseInput && expInput) {
    baseInput.value = a;
    expInput.value = n;
    updatePowerMachine();
    sound.play('click');
  }
}

// SỐ CHÍNH PHƯƠNG
function initSquaresBoard() {
  const container = document.getElementById('squares-board-container');
  if (!container) return;
  container.innerHTML = '';

  for (let k = 1; k <= 10; k++) {
    const card = document.createElement('div');
    card.className = 'square-card';
    card.id = `square-card-${k}`;
    card.innerHTML = `
      <div style="font-size: 1.1rem; font-weight: 800; color: #4338ca;">${k}²</div>
      <div style="font-size: 1.35rem; font-weight: 900; color: #0f172a; margin: 4px 0;">${k * k}</div>
      <div style="font-size: 0.75rem; color: #64748b;">${k} • ${k}</div>
    `;
    card.addEventListener('click', () => showSquareDots(k));
    container.appendChild(card);
  }
}

let squaresClickedCount = 0;
const squaresClickedSet = new Set();

function showSquareDots(k) {
  document.querySelectorAll('.square-card').forEach(c => c.classList.remove('active'));
  const card = document.getElementById(`square-card-${k}`);
  if (card) card.classList.add('active');

  const titleEl = document.getElementById('square-detail-title');
  const visualEl = document.getElementById('square-dots-visual');

  titleEl.innerHTML = `Hình vuông chấm bi ${k} × ${k} = ${k * k} chấm (Số chính phương ${k}²)`;

  // Render dots grid
  let html = `<div class="square-dots-preview" style="grid-template-columns: repeat(${k}, 8px); gap: 3px;">`;
  for (let i = 0; i < k * k; i++) {
    html += `<div class="square-dot" style="width: 8px; height: 8px; background: #6366f1;"></div>`;
  }
  html += `</div>`;
  visualEl.innerHTML = html;

  sound.play('click');

  squaresClickedSet.add(k);
  if (squaresClickedSet.size >= 4) {
    unlockBadge('badge2');
  }
}

// ==========================================
// 7. RÚT GỌN CÙNG CƠ SỐ SIÊU TỐC (SECTION 3)
// ==========================================
const speedMissions = [
  {
    problem: '5³ • 5⁷ = ?',
    hint: 'Nhân hai luỹ thừa cùng cơ số: Giữ nguyên cơ số 5, CỘNG số mũ (3 + 7 = 10)',
    options: ['5¹⁰', '5²¹', '25¹⁰', '5⁴'],
    correct: 0,
    explain: 'Chính xác! 5³ • 5⁷ = 5³⁺⁷ = 5¹⁰.'
  },
  {
    problem: '2⁴ • 2⁵ • 2⁹ = ?',
    hint: 'Nhân 3 luỹ thừa cùng cơ số 2: Cộng các số mũ 4 + 5 + 9',
    options: ['2¹⁸', '2²⁰', '8¹⁸', '2⁹'],
    correct: 0,
    explain: 'Xuất sắc! 2⁴ • 2⁵ • 2⁹ = 2⁴⁺⁵⁺⁹ = 2¹⁸.'
  },
  {
    problem: '10² • 10⁴ • 10⁶ • 10⁸ = ?',
    hint: 'Cơ số 10: Cộng các số mũ 2 + 4 + 6 + 8',
    options: ['10²⁰', '10³⁸⁴', '10²⁴', '10¹⁶'],
    correct: 0,
    explain: 'Rất giỏi! 2 + 4 + 6 + 8 = 20 nên kết quả là 10²⁰.'
  },
  {
    problem: '7⁶ : 7⁴ = ?',
    hint: 'Chia cùng cơ số: Giữ nguyên cơ số 7, TRỪ số mũ (6 - 4 = 2)',
    options: ['7²', '7¹⁰', '7²⁴', '1'],
    correct: 0,
    explain: 'Tuyệt vời! 7⁶ : 7⁴ = 7⁶⁻⁴ = 7² = 49.'
  },
  {
    problem: '1 091¹⁰⁰ : 1 091¹⁰⁰ = ?',
    hint: 'Hai luỹ thừa giống nhau chia cho nhau, hoặc 100 - 100 = 0 (a⁰ = 1)',
    options: ['1', '1 091', '0', '1 091²⁰⁰'],
    correct: 0,
    explain: 'Đúng chuẩn! 1 091¹⁰⁰ : 1 091¹⁰⁰ = 1 091⁰ = 1 (mọi số khác 0 chia cho chính nó bằng 1).'
  },
  {
    problem: '5⁷ • 5³ = ? (Bài 1.42a)',
    hint: 'Cộng số mũ: 7 + 3',
    options: ['5¹⁰', '5⁴', '25¹⁰', '5²¹'],
    correct: 0,
    explain: 'Chính xác! 5⁷ • 5³ = 5⁷⁺³ = 5¹⁰.'
  },
  {
    problem: '5⁸ : 5⁴ = ? (Bài 1.42b)',
    hint: 'Trừ số mũ: 8 - 4',
    options: ['5⁴', '5²', '5¹²', '1'],
    correct: 0,
    explain: 'Hoàn hảo! 5⁸ : 5⁴ = 5⁸⁻⁴ = 5⁴ = 625.'
  }
];

function loadSpeedMission(idx) {
  if (idx >= speedMissions.length) {
    const box = document.getElementById('speed-problem-display');
    const container = document.getElementById('speed-options-container');
    const fb = document.getElementById('speed-feedback');
    if (box) box.innerHTML = '🎉 BẠN ĐÃ PHÁ ĐẢO THỬ THÁCH RÚT GỌN SIÊU TỐC!';
    if (container) container.innerHTML = '';
    if (fb) {
      fb.innerHTML = '🏆 Bạn đã làm chủ hoàn toàn quy tắc Nhân & Chia hai luỹ thừa cùng cơ số!';
      fb.style.color = '#15803d';
    }
    unlockBadge('badge3');
    confetti.launch(40);
    return;
  }

  gameState.currentSpeedIndex = idx;
  const mission = speedMissions[idx];

  const counterEl = document.getElementById('speed-counter');
  const problemEl = document.getElementById('speed-problem-display');
  const container = document.getElementById('speed-options-container');
  const fb = document.getElementById('speed-feedback');

  if (counterEl) counterEl.textContent = `Nhiệm vụ ${idx + 1} / ${speedMissions.length}`;
  if (problemEl) problemEl.textContent = mission.problem;
  if (fb) fb.textContent = '';

  if (container) {
    container.innerHTML = '';
    mission.options.forEach((opt, oIdx) => {
      const btn = document.createElement('button');
      btn.className = 'speed-opt-btn';
      btn.textContent = opt;
      btn.addEventListener('click', () => handleSpeedAnswer(oIdx, btn));
      container.appendChild(btn);
    });
  }
}

function handleSpeedAnswer(chosenIdx, btn) {
  const mission = speedMissions[gameState.currentSpeedIndex];
  const fb = document.getElementById('speed-feedback');

  if (chosenIdx === mission.correct) {
    btn.classList.add('correct');
    fb.innerHTML = `✅ ${mission.explain}`;
    fb.style.color = '#15803d';
    addScore(10, 1);
    setTimeout(() => {
      loadSpeedMission(gameState.currentSpeedIndex + 1);
    }, 1200);
  } else {
    btn.classList.add('wrong');
    fb.innerHTML = `❌ Chưa đúng! Gợi ý: ${mission.hint}`;
    fb.style.color = '#b91c1c';
    resetStreak();
    sound.play('wrong');
  }
}

// ==========================================
// 8. ĐẤU TRƯỜNG TRẮC NGHIỆM 10 CÂU (SECTION 5)
// ==========================================
const quizData = [
  {
    title: 'Câu 1 (Bài 1.36a SGK): Viết tích 9 • 9 • 9 • 9 • 9 dưới dạng một luỹ thừa:',
    options: ['9⁵', '5⁹', '45', '9⁴'],
    correct: 0,
    explain: 'Theo định nghĩa, tích của 5 thừa số 9 bằng nhau được viết gọn dưới dạng luỹ thừa là 9⁵.'
  },
  {
    title: 'Câu 2 (Bài 1.36c SGK): Viết tích 5 • 5 • 5 • 25 dưới dạng một luỹ thừa:',
    options: ['5⁵', '5⁴', '25³', '5⁶'],
    correct: 0,
    explain: 'Vì 25 = 5 • 5 nên biểu thức trở thành 5 • 5 • 5 • 5 • 5 = 5⁵ (gồm 5 thừa số 5).'
  },
  {
    title: 'Câu 3 (Bài 1.37 SGK): Tìm số mũ n thích hợp biết cơ số là 2 và giá trị của luỹ thừa bằng 128 (2ⁿ = 128):',
    options: ['n = 7', 'n = 6', 'n = 8', 'n = 5'],
    correct: 0,
    explain: 'Ta có 2⁷ = 2 • 2 • 2 • 2 • 2 • 2 • 2 = 128. Do đó số mũ n = 7.'
  },
  {
    title: 'Câu 4 (Bài 1.38d SGK): Giá trị của luỹ thừa 10⁹ là bao nhiêu?',
    options: ['1 000 000 000 (1 tỉ)', '90', '100 000 000', '9 000 000 000'],
    correct: 0,
    explain: '10ⁿ là số tự nhiên gồm chữ số 1 và n chữ số 0 theo sau. Do đó 10⁹ = 1 000 000 000 (1 tỉ).'
  },
  {
    title: 'Câu 5 (Bài 1.41 SGK): Biết 2¹⁰ = 1 024. Hãy tính giá trị của 2⁹ và 2¹¹:',
    options: ['2⁹ = 512 và 2¹¹ = 2 048', '2⁹ = 1 022 và 2¹¹ = 1 026', '2⁹ = 256 và 2¹¹ = 2 048', '2⁹ = 512 và 2¹¹ = 4 096'],
    correct: 0,
    explain: 'Ta có: 2⁹ = 2¹⁰ : 2 = 1 024 : 2 = 512, và 2¹¹ = 2¹⁰ • 2 = 1 024 • 2 = 2 048.'
  },
  {
    title: 'Câu 6 (Bài 1.42a SGK): Kết quả của phép tính 5⁷ • 5³ viết dưới dạng luỹ thừa là:',
    options: ['5¹⁰', '5²¹', '25¹⁰', '10¹⁰'],
    correct: 0,
    explain: 'Khi nhân hai luỹ thừa cùng cơ số, giữ nguyên cơ số 5 và cộng các số mũ: 7 + 3 = 10, ta được 5¹⁰.'
  },
  {
    title: 'Câu 7 (Bài 1.42b SGK): Giá trị của phép tính 5⁸ : 5⁴ bằng bao nhiêu?',
    options: ['5⁴ = 625', '5² = 25', '1', '5¹²'],
    correct: 0,
    explain: 'Khi chia hai luỹ thừa cùng cơ số, giữ nguyên cơ số 5 và trừ số mũ: 8 - 4 = 4. Do đó 5⁴ = 625.'
  },
  {
    title: 'Câu 8 (Bài 1.43 SGK): Viết tổng 1 + 3 + 5 + 7 + 9 dưới dạng bình phương của một số tự nhiên:',
    options: ['5²', '4²', '6²', '9²'],
    correct: 0,
    explain: 'Tổng 1 + 3 + 5 + 7 + 9 = 25 = 5². (Quy luật: Tổng của n số lẻ liên tiếp đầu tiên luôn bằng n²).'
  },
  {
    title: 'Câu 9 (Quy ước SGK): Giá trị của phép tính 2 026⁰ là bao nhiêu?',
    options: ['1', '0', '2 026', 'Không xác định'],
    correct: 0,
    explain: 'Theo quy ước của SGK trang 24, với mọi số tự nhiên a ≠ 0, ta luôn có a⁰ = 1. Do đó 2 026⁰ = 1.'
  },
  {
    title: 'Câu 10 (Bài 1.44 SGK): Mặt Trời cần bao nhiêu giây để tiêu thụ lượng khí bằng khối lượng Trái Đất (60 • 10²⁰ tấn : 6 • 10⁶ tấn/s)?',
    options: ['10¹⁵ giây', '10¹⁴ giây', '10²⁶ giây', '360 • 10²⁶ giây'],
    correct: 0,
    explain: '(60 • 10²⁰) : (6 • 10⁶) = (60 : 6) • (10²⁰ : 10⁶) = 10 • 10¹⁴ = 10¹⁵ giây (khoảng hơn 31 triệu năm!).'
  }
];

function loadQuizQuestion(idx) {
  if (idx >= quizData.length) {
    showQuizFinished();
    return;
  }

  gameState.currentQuizIndex = idx;
  gameState.quizAnswered = false;
  const q = quizData[idx];

  const qNumEl = document.getElementById('quiz-question-number');
  const qTitleEl = document.getElementById('quiz-question-title');
  const streakStatus = document.getElementById('quiz-streak-status');
  const progBar = document.getElementById('quiz-progress-bar');
  const container = document.getElementById('quiz-answers-container');
  const fb = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('btn-next-question');

  if (qNumEl) qNumEl.textContent = `Câu hỏi ${idx + 1} / ${quizData.length}`;
  if (qTitleEl) qTitleEl.textContent = q.title;
  if (streakStatus) streakStatus.textContent = `🔥 Combo: ${gameState.streak}`;
  if (progBar) progBar.style.width = `${((idx + 1) / quizData.length) * 100}%`;

  if (fb) {
    fb.className = 'quiz-feedback';
    fb.innerHTML = '';
  }

  if (nextBtn) {
    nextBtn.className = 'btn-next-question';
  }

  if (container) {
    container.innerHTML = '';
    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, oIdx) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-btn';
      btn.innerHTML = `<span class="opt-badge">${letters[oIdx]}</span> <span>${opt}</span>`;
      btn.addEventListener('click', () => handleQuizSelect(oIdx, btn));
      container.appendChild(btn);
    });
  }
}

function handleQuizSelect(chosenIdx, btn) {
  if (gameState.quizAnswered) return;
  gameState.quizAnswered = true;

  const q = quizData[gameState.currentQuizIndex];
  const buttons = document.querySelectorAll('.quiz-btn');
  const fb = document.getElementById('quiz-feedback');
  const nextBtn = document.getElementById('btn-next-question');

  buttons.forEach(b => b.disabled = true);

  if (chosenIdx === q.correct) {
    btn.classList.add('correct');
    fb.className = 'quiz-feedback success show';
    fb.innerHTML = `<strong>🎉 CHÍNH XÁC!</strong><br>${q.explain}`;
    addScore(10, 1);
  } else {
    btn.classList.add('wrong');
    if (buttons[q.correct]) {
      buttons[q.correct].classList.add('correct');
    }
    fb.className = 'quiz-feedback danger show';
    fb.innerHTML = `<strong>❌ CHƯA CHÍNH XÁC!</strong><br>${q.explain}`;
    resetStreak();
    sound.play('wrong');
  }

  if (nextBtn) {
    nextBtn.classList.add('show');
  }
}

function nextQuizQuestion() {
  sound.play('click');
  loadQuizQuestion(gameState.currentQuizIndex + 1);
}

function showQuizFinished() {
  const container = document.getElementById('dau-truong-quiz');
  if (!container) return;

  sound.play('finish');
  confetti.launch(80);

  container.innerHTML = `
    <div style="text-align: center; padding: 30px 20px;">
      <div style="font-size: 4rem; margin-bottom: 10px;">👑</div>
      <h2 style="font-size: 2rem; color: #4338ca; margin-bottom: 8px;">CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH ĐẤU TRƯỜNG!</h2>
      <p style="font-size: 1.15rem; color: #64748b; margin-bottom: 20px;">
        Toàn bộ 10 bài tập SGK về Luỹ thừa đã được bạn chinh phục ngoạn mục!
      </p>
      <div style="display: inline-flex; gap: 20px; background: #ede9fe; padding: 15px 30px; border-radius: 999px; margin-bottom: 25px;">
        <span style="font-weight: 800; font-size: 1.2rem; color: #4338ca;">🪙 Điểm: ${gameState.score}</span>
        <span style="font-weight: 800; font-size: 1.2rem; color: #0284c7;">⭐ Sao: ${gameState.stars}</span>
        <span style="font-weight: 800; font-size: 1.2rem; color: #b91c1c;">🔥 Chuỗi kỷ lục: ${gameState.maxStreak}</span>
      </div>
      <br>
      <button class="btn-cert btn-replay" onclick="scrollToCertificate()" style="font-size: 1.1rem; padding: 14px 28px;">
        📜 Xem & In Giấy Chứng Nhận Ngay
      </button>
    </div>
  `;

  if (gameState.score >= 80) {
    unlockBadge('badge5');
  }
  updateCertificate();
}

// ==========================================
// 9. GIẤY CHỨNG NHẬN & CÁC TÁC VỤ
// ==========================================
function updateCertificate() {
  const nameDisplay = document.getElementById('cert-student-name-display');
  const scoreDisplay = document.getElementById('cert-score-display');
  const starsDisplay = document.getElementById('cert-stars-display');
  const rankDisplay = document.getElementById('cert-rank-display');
  const dateDisplay = document.getElementById('cert-date-display');

  if (nameDisplay) nameDisplay.textContent = gameState.studentName;
  if (scoreDisplay) scoreDisplay.textContent = gameState.score;
  if (starsDisplay) starsDisplay.textContent = gameState.stars;

  let rank = 'Tân Binh Vũ Trụ';
  if (gameState.score >= 80) rank = 'Đại Kiện Tướng Vũ Trụ 👑';
  else if (gameState.score >= 40) rank = 'Dũng Sĩ Luỹ Thừa ⚔️';
  else if (gameState.score >= 20) rank = 'Học Giả Số Mũ 🎓';

  if (rankDisplay) rankDisplay.textContent = rank;

  if (dateDisplay) {
    const today = new Date();
    dateDisplay.textContent = today.toLocaleDateString('vi-VN');
  }
}

function scrollToCertificate() {
  sound.play('click');
  const target = document.getElementById('chung-nhan-vinh-danh');
  if (target) {
    target.scrollIntoView({ behavior: 'smooth' });
  }
}

function restartLesson() {
  sound.play('click');
  gameState.score = 0;
  gameState.stars = 0;
  gameState.streak = 0;
  gameState.maxStreak = 0;
  gameState.currentSpeedIndex = 0;
  gameState.currentQuizIndex = 0;
  gameState.quizAnswered = false;

  Object.keys(gameState.badges).forEach(b => {
    gameState.badges[b] = false;
    const card = document.getElementById(b);
    if (card) {
      card.classList.remove('unlocked');
      card.classList.add('locked');
    }
  });

  const modal = document.getElementById('start-modal');
  if (modal) {
    modal.classList.remove('hidden');
  }

  loadSpeedMission(0);
  loadQuizQuestion(0);
  updateHUD();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
