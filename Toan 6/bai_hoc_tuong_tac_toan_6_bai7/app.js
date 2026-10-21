/**
 * BÀI 7: THỨ TỰ THỰC HIỆN CÁC PHÉP TÍNH - TOÁN 6 (KẾT NỐI TRI THỨC)
 * JavaScript logic: Web Audio API, Canvas Confetti, Tranh luận 5+3x2, Cỗ máy giải từng bước, Đấu trường 10 câu SGK, Huy hiệu & Giấy khen.
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
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, t);
        osc.frequency.exponentialRampToValueAtTime(1174.66, t + 0.2);
        gain.gain.setValueAtTime(0.3, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.2);
        break;

      case 'unlock':
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
    const colors = ['#059669', '#10b981', '#0284c7', '#38bdf8', '#f59e0b', '#fbbf24'];
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
  studentName: 'Hiệp Sĩ Toán Học',
  avatar: '⚖️',
  score: 0,
  stars: 0,
  streak: 0,
  maxStreak: 0,
  badges: {
    badge1: false, // Tranh luận 5+3x2
    badge2: false, // Cỗ máy giải từng bước
    badge3: false, // Bẫy trái sang phải
    badge4: false, // Streak >= 3
    badge5: false  // Score >= 80
  },
  currentSampleIdx: 1,
  currentStepIdx: 0,
  viewedSamplesCount: 0,
  currentQuizIndex: 0,
  quizAnswered: false
};

// ==========================================
// 4. KHỞI TẠO & MODAL BẮT ĐẦU
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  setupAvatarPicker();
  loadSampleExpression(1);
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

  let rank = 'Tập Sự Trật Tự';
  if (gameState.score >= 80) rank = 'Đại Pháp Sư Biểu Thức 👑';
  else if (gameState.score >= 40) rank = 'Kiện Tướng Quy Tắc ⚔️';
  else if (gameState.score >= 20) rank = 'Hiệp Sĩ Dấu Ngoặc 🛡️';

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
  if (gameState.badges[badgeId]) return;
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
// 5. TRANH LUẬN THẾ KỶ 5 + 3 x 2 (SECTION 1)
// ==========================================
function selectDebate(choice) {
  const cardTron = document.getElementById('card-tron');
  const cardVuong = document.getElementById('card-vuong');
  const resultBox = document.getElementById('debate-result-box');

  if (!cardTron || !cardVuong || !resultBox) return;

  resultBox.style.display = 'block';

  if (choice === 'vuong') {
    cardVuong.className = 'debate-card selected-correct';
    cardTron.className = 'debate-card';

    resultBox.style.background = '#ecfdf5';
    resultBox.style.border = '2px solid #10b981';
    resultBox.style.color = '#065f46';
    resultBox.innerHTML = `
      🎉 <strong>CHÍNH XÁC HOÀN TOÀN! BẠN VUÔNG ĐÃ LÀM ĐÚNG!</strong><br>
      Theo quy ước quốc tế về thứ tự thực hiện phép tính: Ta phải <strong>NHÂN TRƯỚC, CỘNG SAU</strong>.<br>
      • Bước 1: <code>3 × 2 = 6</code><br>
      • Bước 2: <code>5 + 6 = 11</code>.<br>
      👉 Nếu ai cũng thích làm gì trước thì sẽ sinh ra hỗn loạn toán học, vì thế thế giới đã đặt ra quy tắc chuẩn mực này!
    `;

    addScore(10, 1);
    unlockBadge('badge1');
    confetti.launch(30);
  } else {
    cardTron.className = 'debate-card selected-wrong';
    cardVuong.className = 'debate-card';

    resultBox.style.background = '#fef2f2';
    resultBox.style.border = '2px solid #ef4444';
    resultBox.style.color = '#991b1b';
    resultBox.innerHTML = `
      ❌ <strong>BẠN TRÒN ĐÃ HIỂU NHẦM QUY TẮC RỒI!</strong><br>
      Bạn Tròn cộng trước (5 + 3 = 8 rồi 8 × 2 = 16) là sai! Trong biểu thức không có ngoặc gồm cả phép cộng và nhân, ta bắt buộc phải <strong>NHÂN CHIA TRƯỚC, CỘNG TRỪ SAU</strong>. Hãy nhấp lại vào Bạn Vuông để ghi điểm nhé!
    `;

    resetStreak();
    sound.play('wrong');
  }
}

// ==========================================
// 6. CỖ MÁY GIẢI TỪNG BƯỚC (SECTION 3)
// ==========================================
const sampleExpressions = {
  1: {
    title: 'Ví dụ a: 8 + 36 : 3 • 2',
    steps: [
      { text: '= 8 + 12 • 2', desc: 'Chia trước từ trái sang phải: 36 : 3 = 12' },
      { text: '= 8 + 24', desc: 'Thực hiện phép nhân: 12 • 2 = 24' },
      { text: '= 32', desc: 'Thực hiện phép cộng cuối cùng: 8 + 24 = 32' }
    ]
  },
  2: {
    title: 'Ví dụ b: [1 + 2 • (5 • 3 - 2³)] • 7',
    steps: [
      { text: '= [1 + 2 • (5 • 3 - 8)] • 7', desc: 'Trong ngoặc tròn ( ): Luỹ thừa 2³ = 8 trước' },
      { text: '= [1 + 2 • (15 - 8)] • 7', desc: 'Trong ngoặc tròn ( ): Phép nhân 5 • 3 = 15' },
      { text: '= [1 + 2 • 7] • 7', desc: 'Trong ngoặc tròn ( ): Phép trừ 15 - 8 = 7' },
      { text: '= [1 + 14] • 7', desc: 'Trong ngoặc vuông [ ]: Phép nhân 2 • 7 = 14' },
      { text: '= 15 • 7', desc: 'Trong ngoặc vuông [ ]: Phép cộng 1 + 14 = 15' },
      { text: '= 105', desc: 'Phép nhân ngoài cùng: 15 • 7 = 105' }
    ]
  },
  3: {
    title: 'Luyện tập 1a: 25 • 2³ - 3² + 125',
    steps: [
      { text: '= 25 • 8 - 9 + 125', desc: 'Tính các luỹ thừa trước: 2³ = 8 và 3² = 9' },
      { text: '= 200 - 9 + 125', desc: 'Thực hiện phép nhân: 25 • 8 = 200' },
      { text: '= 191 + 125', desc: 'Thực hiện phép trừ từ trái sang phải: 200 - 9 = 191' },
      { text: '= 316', desc: 'Thực hiện phép cộng cuối cùng: 191 + 125 = 316' }
    ]
  },
  4: {
    title: 'Luyện tập 1b: 2 • 3² + 5 • (2 + 3)',
    steps: [
      { text: '= 2 • 9 + 5 • 5', desc: 'Tính trong ngoặc (2 + 3 = 5) và luỹ thừa 3² = 9' },
      { text: '= 18 + 25', desc: 'Thực hiện các phép nhân: 2 • 9 = 18 và 5 • 5 = 25' },
      { text: '= 43', desc: 'Thực hiện phép cộng: 18 + 25 = 43' }
    ]
  },
  5: {
    title: 'Bài 1.46c: {2³ + [1 + (3 - 1)²]} : 13',
    steps: [
      { text: '= {2³ + [1 + 2²]} : 13', desc: 'Tính trong ngoặc tròn: (3 - 1) = 2' },
      { text: '= {8 + [1 + 4]} : 13', desc: 'Tính luỹ thừa: 2³ = 8 và 2² = 4' },
      { text: '= {8 + 5} : 13', desc: 'Tính trong ngoặc vuông: [1 + 4] = 5' },
      { text: '= 13 : 13', desc: 'Tính trong ngoặc nhọn: {8 + 5} = 13' },
      { text: '= 1', desc: 'Thực hiện phép chia cuối cùng: 13 : 13 = 1' }
    ]
  }
};

function loadSampleExpression(id) {
  gameState.currentSampleIdx = id;
  gameState.currentStepIdx = 0;

  const data = sampleExpressions[id];
  const titleEl = document.getElementById('step-formula-title');
  const container = document.getElementById('steps-render-container');
  const nextBtn = document.getElementById('btn-next-step');

  if (titleEl) titleEl.textContent = data.title;
  if (container) container.innerHTML = '';
  if (nextBtn) {
    nextBtn.disabled = false;
    nextBtn.innerHTML = '⏩ Xem Bước Tiếp Theo';
  }

  // Update active pill button
  document.querySelectorAll('#co-may-tung-buoc .nav-pill').forEach((p, idx) => {
    if (idx + 1 === id) p.classList.add('active');
    else p.classList.remove('active');
  });

  revealNextStep();
}

function revealNextStep() {
  const data = sampleExpressions[gameState.currentSampleIdx];
  const container = document.getElementById('steps-render-container');
  const nextBtn = document.getElementById('btn-next-step');

  if (!data || !container) return;

  if (gameState.currentStepIdx < data.steps.length) {
    const step = data.steps[gameState.currentStepIdx];
    const item = document.createElement('div');
    item.className = 'step-item active';
    item.innerHTML = `
      <span>${step.text}</span>
      <span class="step-action-desc">⬅️ ${step.desc}</span>
    `;
    container.appendChild(item);
    gameState.currentStepIdx++;
    sound.play('click');

    if (gameState.currentStepIdx >= data.steps.length) {
      if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.innerHTML = '✅ Đã hoàn thành toàn bộ các bước!';
      }
      gameState.viewedSamplesCount++;
      if (gameState.viewedSamplesCount >= 3) {
        unlockBadge('badge2');
      }
    }
  }
}

function resetCurrentExpression() {
  loadSampleExpression(gameState.currentSampleIdx);
}

// ==========================================
// 7. ĐẤU TRƯỜNG TRẮC NGHIỆM 10 CÂU (SECTION 5)
// ==========================================
const quizData = [
  {
    title: 'Câu 1 (Quy tắc SGK Trang 25): Thứ tự thực hiện các phép tính trong biểu thức KHÔNG có dấu ngoặc là:',
    options: [
      'Luỹ thừa ➔ Nhân và chia ➔ Cộng và trừ',
      'Cộng và trừ ➔ Nhân và chia ➔ Luỹ thừa',
      'Nhân và chia ➔ Luỹ thừa ➔ Cộng và trừ',
      'Từ trái sang phải bất kể phép tính gì'
    ],
    correct: 0,
    explain: 'Theo SGK: Nếu có các phép tính cộng, trừ, nhân, chia, luỹ thừa thì thực hiện: Luỹ thừa ➔ Nhân và chia ➔ Cộng và trừ.'
  },
  {
    title: 'Câu 2 (Quy tắc SGK Trang 25): Khi biểu thức có cả các dấu ngoặc tròn ( ), ngoặc vuông [ ], ngoặc nhọn { }, thứ tự thực hiện là:',
    options: [
      '( ) ➔ [ ] ➔ { }',
      '{ } ➔ [ ] ➔ ( )',
      '[ ] ➔ ( ) ➔ { }',
      'Thực hiện ngoặc nào trước cũng như nhau'
    ],
    correct: 0,
    explain: 'Quy tắc bóc từ trong ra ngoài: Thực hiện phép tính trong dấu ngoặc tròn ( ) trước, rồi đến ngoặc vuông [ ], cuối cùng đến ngoặc nhọn { }.'
  },
  {
    title: 'Câu 3 (Bẫy kinh điển SGK): Giá trị của biểu thức 100 : 5 • 2 bằng bao nhiêu?',
    options: ['40', '10', '20', '100'],
    correct: 0,
    explain: 'Nếu biểu thức chỉ có phép chia và nhân, ta thực hiện TỪ TRÁI SANG PHẢI: 100 : 5 = 20, rồi 20 • 2 = 40 (Không được làm 5 • 2 = 10 trước!).'
  },
  {
    title: 'Câu 4 (Bài 1.46a SGK): Giá trị của biểu thức 235 + 78 - 142 bằng:',
    options: ['171', '161', '181', '173'],
    correct: 0,
    explain: 'Chỉ có cộng và trừ, thực hiện từ trái sang phải: 235 + 78 = 313, rồi 313 - 142 = 171.'
  },
  {
    title: 'Câu 5 (Bài 1.46b SGK): Giá trị của biểu thức 14 + 2 • 8² bằng:',
    options: ['142', '1 024', '256', '136'],
    correct: 0,
    explain: 'Luỹ thừa trước: 8² = 64. Nhân tiếp theo: 2 • 64 = 128. Cộng cuối cùng: 14 + 128 = 142.'
  },
  {
    title: 'Câu 6 (Bài 1.46c SGK): Giá trị của biểu thức {2³ + [1 + (3 - 1)²]} : 13 bằng:',
    options: ['1', '2', '13', '0'],
    correct: 0,
    explain: 'Ngoặc tròn (3 - 1) = 2. Luỹ thừa 2² = 4. Ngoặc vuông [1 + 4] = 5. Luỹ thừa 2³ = 8. Ngoặc nhọn {8 + 5} = 13. Cuối cùng: 13 : 13 = 1.'
  },
  {
    title: 'Câu 7 (Bài 1.47 SGK): Giá trị của biểu thức 1 + 2(a + b) - 4³ khi a = 25; b = 9 là:',
    options: ['5', '15', '4', '69'],
    correct: 0,
    explain: 'Thay số: 1 + 2 • (25 + 9) - 64 = 1 + 2 • 34 - 64 = 1 + 68 - 64 = 69 - 64 = 5.'
  },
  {
    title: 'Câu 8 (Vận dụng SGK): Người đi xe đạp 3 giờ đầu đi 14 km/h, 2 giờ sau đi 9 km/h. Tổng quãng đường đi được trong 5 giờ là:',
    options: ['60 km', '115 km', '55 km', '46 km'],
    correct: 0,
    explain: 'Biểu thức tính quãng đường: 14 • 3 + 9 • 2 = 42 + 18 = 60 km.'
  },
  {
    title: 'Câu 9 (Bài 1.48 SGK): 8 tháng đầu bán 1 264 tivi, 4 tháng cuối bán 164 tivi/tháng. Biểu thức tính số tivi trung bình mỗi tháng trong năm là:',
    options: [
      '(1 264 + 164 • 4) : 12 = 160 chiếc',
      '(1 264 + 164) : 12 = 119 chiếc',
      '(1 264 + 164 • 4) : 2 = 960 chiếc',
      '(1 264 + 164) : 2 = 714 chiếc'
    ],
    correct: 0,
    explain: 'Tổng số tivi bán cả 12 tháng: 1 264 + 164 • 4 = 1 920 chiếc. Trung bình mỗi tháng: 1 920 : 12 = 160 chiếc.'
  },
  {
    title: 'Câu 10 (Bài 1.49 SGK): Căn hộ 105 m² trừ bếp & WC 30 m². Lát 18 m² gỗ loại 1 (350k), 57 m² gỗ loại 2 (170k), công lát 30k/m² cho 75 m². Tổng chi phí là:',
    options: [
      '18 240 000 đồng',
      '16 500 000 đồng',
      '19 800 000 đồng',
      '22 500 000 đồng'
    ],
    correct: 0,
    explain: 'Tổng chi phí: 18 • 350 + 57 • 170 + 75 • 30 = 6 300 + 9 690 + 2 250 = 18 240 nghìn đồng = 18 240 000 đồng.'
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

    if (gameState.currentQuizIndex === 2) {
      // Câu 3 là câu bẫy 100 : 5 • 2
      unlockBadge('badge3');
    }
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
      <h2 style="font-size: 2rem; color: #065f46; margin-bottom: 8px;">CHÚC MỪNG BẠN ĐÃ HOÀN THÀNH ĐẤU TRƯỜNG!</h2>
      <p style="font-size: 1.15rem; color: #64748b; margin-bottom: 20px;">
        Toàn bộ quy tắc về thứ tự thực hiện phép tính đã được bạn bẻ khóa chuẩn xác!
      </p>
      <div style="display: inline-flex; gap: 20px; background: #ecfdf5; padding: 15px 30px; border-radius: 999px; margin-bottom: 25px;">
        <span style="font-weight: 800; font-size: 1.2rem; color: #065f46;">🪙 Điểm: ${gameState.score}</span>
        <span style="font-weight: 800; font-size: 1.2rem; color: #0284c7;">⭐ Sao: ${gameState.stars}</span>
        <span style="font-weight: 800; font-size: 1.2rem; color: #b91c1c;">🔥 Chuỗi kỷ lục: ${gameState.maxStreak}</span>
      </div>
      <br>
      <button class="btn-cert btn-replay" onclick="scrollToCertificate()" style="font-size: 1.1rem; padding: 14px 28px; background: var(--primary);">
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
// 8. GIẤY CHỨNG NHẬN & CÁC TÁC VỤ
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

  let rank = 'Tập Sự Trật Tự';
  if (gameState.score >= 80) rank = 'Đại Pháp Sư Biểu Thức 👑';
  else if (gameState.score >= 40) rank = 'Kiện Tướng Quy Tắc ⚔️';
  else if (gameState.score >= 20) rank = 'Hiệp Sĩ Dấu Ngoặc 🛡️';

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
  gameState.currentSampleIdx = 1;
  gameState.currentStepIdx = 0;
  gameState.viewedSamplesCount = 0;
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

  loadSampleExpression(1);
  loadQuizQuestion(0);
  updateHUD();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
