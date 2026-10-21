/* =========================================================
   BÀI 27: HAI BÀI TOÁN VỀ PHÂN SỐ - APP.JS
   Gamification Engine, Sound Synthesizer & Submarine Simulator
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
  studentName: 'Thuyền Trưởng Số Học Lớp 6',
  avatar: '🚢',
  score: 0,
  stars: 0,
  streak: 0,
  answeredQuestions: new Set(),
  unlockedBadges: new Set()
};

// --- TOÁN HỌC TIỆN ÍCH ---
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a || 1;
}

function simplifyFrac(num, den) {
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(num, den);
  return { num: num / g, den: den / g };
}

function formatFrac(num, den) {
  const s = simplifyFrac(num, den);
  if (s.den === 1) return `${s.num}`;
  return `${s.num}/${s.den}`;
}

// --- DANH SÁCH 10 CÂU HỎI ĐẤU TRƯỜNG SGK (BÀI 6.34 – 6.37) ---
const quizData = [
  {
    id: 1,
    title: 'Bài 6.34a: Tìm Giá Trị Phân Số Của 100',
    question: 'Tính giá trị của 4/5 của 100:',
    options: [
      { text: '80', correct: true },
      { text: '125', correct: false },
      { text: '75', correct: false },
      { text: '20', correct: false }
    ],
    hint: 'Tìm m/n của a ta lấy a nhân với m/n: 100 · 4/5 = 80.',
    explanation: '4/5 của 100 là: 100 · 4/5 = (100 · 4) / 5 = 400 / 5 = 80.'
  },
  {
    id: 2,
    title: 'Bài 6.34b: Tìm Giá Trị Phân Số Của Số Âm',
    question: 'Tìm 1/4 của -8:',
    options: [
      { text: '-2', correct: true },
      { text: '2', correct: false },
      { text: '-32', correct: false },
      { text: '-1/2', correct: false }
    ],
    hint: '(-8) · 1/4 = -8/4 = -2.',
    explanation: '1/4 của -8 là: (-8) · (1/4) = -8/4 = -2.'
  },
  {
    id: 3,
    title: 'Bài 6.35a: Tìm Phân Số Của Đơn Vị Độ Dài',
    question: 'Tính 2/5 của 30 mét:',
    options: [
      { text: '12 m', correct: true },
      { text: '15 m', correct: false },
      { text: '75 m', correct: false },
      { text: '6 m', correct: false }
    ],
    hint: '30 · 2/5 = 60/5 = 12 m.',
    explanation: '2/5 của 30 m là: 30 · (2/5) = 60/5 = 12 m.'
  },
  {
    id: 4,
    title: 'Bài 6.35b: Chuyển Đổi Héc-ta Sang Mét Vuông',
    question: 'Biết 1 ha = 10 000 m². Tính diện tích của 3/4 ha:',
    options: [
      { text: '7 500 m²', correct: true },
      { text: '2 500 m²', correct: false },
      { text: '5 000 m²', correct: false },
      { text: '13 333 m²', correct: false }
    ],
    hint: '10 000 · 3/4 = 30 000 / 4 = 7 500 m².',
    explanation: '3/4 ha là: 10 000 · (3/4) = 7 500 m².'
  },
  {
    id: 5,
    title: 'Bài 6.36a: Tìm Một Số Biết 2/7 Của Nó Là 145',
    question: 'Tìm một số biết 2/7 của số đó bằng 145:',
    options: [
      { text: '507.5 (tức 1015/2)', correct: true },
      { text: '290/7', correct: false },
      { text: '41.4', correct: false },
      { text: '500', correct: false }
    ],
    hint: 'Tìm một số biết m/n của nó là b ta lấy b : (m/n) = 145 : (2/7) = 145 · 7/2 = 1015/2 = 507.5.',
    explanation: 'Số cần tìm là: 145 : (2/7) = 145 · (7/2) = 1015/2 = 507.5.'
  },
  {
    id: 6,
    title: 'Bài 6.36b: Tìm Một Số Biết 3/8 Của Nó Bằng -36',
    question: 'Tìm một số biết -36 là 3/8 của nó:',
    options: [
      { text: '-96', correct: true },
      { text: '96', correct: false },
      { text: '-13.5', correct: false },
      { text: '-27/2', correct: false }
    ],
    hint: '(-36) : (3/8) = (-36) · (8/3) = (-12) · 8 = -96.',
    explanation: 'Số cần tìm là: (-36) : (3/8) = (-36) · (8/3) = -288/3 = -96.'
  },
  {
    id: 7,
    title: 'Bài 6.37: Độ Sâu Tàu Ngầm Kilo 636',
    question: 'Tàu ngầm Kilo 636 lặn sâu tối đa 300 m. Nếu tàu đang lặn ở độ sâu bằng 2/5 độ sâu tối đa thì tàu đang ở độ sâu bao nhiêu?',
    options: [
      { text: '120 m', correct: true },
      { text: '150 m', correct: false },
      { text: '100 m', correct: false },
      { text: '750 m', correct: false }
    ],
    hint: '300 · 2/5 = 600/5 = 120 m.',
    explanation: 'Độ sâu tàu đang lặn là: 300 · (2/5) = 120 mét.'
  },
  {
    id: 8,
    title: 'Ứng Dụng Y Học: Lượng Nước Trong Cơ Thể Người',
    question: 'Lượng nước trong cơ thể người chiếm khoảng 7/10 khối lượng cơ thể. Một học sinh nặng 40 kg thì lượng nước trong cơ thể khoảng bao nhiêu kg?',
    options: [
      { text: '28 kg', correct: true },
      { text: '30 kg', correct: false },
      { text: '25 kg', correct: false },
      { text: '35 kg', correct: false }
    ],
    hint: '40 · 7/10 = 28 kg.',
    explanation: 'Lượng nước trong cơ thể bạn học sinh là: 40 · (7/10) = 280/10 = 28 kg.'
  },
  {
    id: 9,
    title: 'Ứng Dụng Thực Tiễn: Dung Tích Bể Bơi',
    question: 'Khi bơm 450 m³ nước vào bể thì lượng nước chiếm 3/4 dung tích bể bơi. Hỏi dung tích toàn phần của bể bơi là bao nhiêu m³?',
    options: [
      { text: '600 m³', correct: true },
      { text: '337.5 m³', correct: false },
      { text: '500 m³', correct: false },
      { text: '750 m³', correct: false }
    ],
    hint: 'Biết 3/4 dung tích là 450 m³ nên dung tích bể là: 450 : (3/4) = 450 · 4/3 = 600 m³.',
    explanation: 'Dung tích bể bơi là: 450 : (3/4) = 450 · (4/3) = 1800/3 = 600 m³.'
  },
  {
    id: 10,
    title: 'Tổng Kết: Phương Pháp Phân Biệt Hai Dạng Toán',
    question: 'Khẳng định nào sau đây là ĐÚNG khi phân biệt hai bài toán về phân số?',
    options: [
      { text: 'Tìm m/n của số a dùng PHÉP NHÂN (a · m/n); Tìm số khi biết m/n của nó là b dùng PHÉP CHIA (b : m/n)', correct: true },
      { text: 'Cả hai dạng đều luôn dùng phép nhân', correct: false },
      { text: 'Cả hai dạng đều luôn dùng phép chia', correct: false },
      { text: 'Tìm m/n của số a dùng phép chia', correct: false }
    ],
    hint: 'Dạng 1: a · (m/n); Dạng 2: b : (m/n).',
    explanation: 'Đúng như quy tắc chuẩn SGK: Để tìm giá trị phân số của một số cho trước ta nhân; để tìm một số biết giá trị phân số của nó ta chia.'
  }
];

// --- LAB 1: TÀU NGẦM KILO 636 ---
function updateSubmarine(ratioNumerator) {
  const sprite = document.getElementById('submarine-sprite');
  const info = document.getElementById('sub-info-output');
  const label = document.getElementById('sub-ratio-label');
  if (!sprite || !info) return;

  const fraction = ratioNumerator / 10;
  const currentDepth = Math.round(300 * fraction);
  
  // Tính vị trí top từ 15px (0m) đến 170px (300m)
  const topPos = 15 + Math.round((currentDepth / 300) * 155);
  sprite.style.top = `${topPos}px`;

  if (label) {
    const s = simplifyFrac(ratioNumerator, 10);
    label.textContent = `${ratioNumerator}/10 (${s.num}/${s.den})`;
  }

  info.innerHTML = `
    Độ sâu hiện tại của tàu: <span style="font-size: 1.25rem; color: #0284c7; font-weight: 800;">${currentDepth} mét</span> 
    (bằng ${ratioNumerator}/10 của độ sâu tối đa 300 m).
  `;

  if (ratioNumerator === 4) {
    unlockBadge('badge-1');
  }
}

// --- LAB 2: CỖ MÁY GIẢI HAI BÀI TOÁN PHÂN SỐ ---
function solveTwoProblems() {
  const probType = document.getElementById('prob-type-select').value;
  const val = parseFloat(document.getElementById('param-val').value) || 0;
  const m = parseInt(document.getElementById('param-m').value) || 1;
  const n = parseInt(document.getElementById('param-n').value) || 1;

  if (n === 0) {
    alert('Mẫu số phải khác 0!');
    return;
  }

  const output = document.getElementById('solver-lab-output');
  if (!output) return;

  sound.playClick();

  if (probType === '1') {
    // Dạng 1: Tìm m/n của val => val * (m/n)
    const result = (val * m) / n;
    output.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <h3 style="color: #0284c7; margin-bottom: 8px;">
          📌 Dạng 1: Tìm ${m}/${n} của số ${val} (Phép Nhân)
        </h3>
        <p><strong>Công thức áp dụng:</strong> $a \\cdot \\frac{m}{n}$</p>
        <p><strong>Các bước giải chi tiết:</strong></p>
        <p style="margin-left: 20px; color: #475569;">
          • Lấy số $a$ nhân với tử số $m$: ${val} · ${m} = ${val * m}
          <br>• Lấy kết quả chia cho mẫu số $n$: (${val * m}) / ${n} = <strong>${result}</strong>
        </p>
        <div style="background: #e0f2fe; padding: 12px 18px; border-radius: 8px; border-left: 4px solid #0284c7; margin-top: 8px;">
          <strong>Giá trị cần tìm:</strong> 
          <span style="font-size: 1.35rem; color: #0369a1; font-weight: 800; margin-left: 10px;">
            ${result}
          </span>
        </div>
      </div>
    `;
    unlockBadge('badge-2');
  } else {
    // Dạng 2: Tìm số biết m/n của nó là val => val : (m/n) = val * (n/m)
    if (m === 0) {
      alert('Tử số m phải khác 0 để có thể chia!');
      return;
    }
    const result = (val * n) / m;
    output.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <h3 style="color: #0369a1; margin-bottom: 8px;">
          📌 Dạng 2: Tìm một số biết ${m}/${n} của nó bằng ${val} (Phép Chia)
        </h3>
        <p><strong>Công thức áp dụng:</strong> $b : \\frac{m}{n} = b \\cdot \\frac{n}{m}$</p>
        <p><strong>Các bước giải chi tiết:</strong></p>
        <p style="margin-left: 20px; color: #475569;">
          • Lấy số $b$ nhân với nghịch đảo của phân số: ${val} · (${n}/${m})
          <br>• Tử số mới: ${val} · ${n} = ${val * n}
          <br>• Chia cho $m$: (${val * n}) / ${m} = <strong>${result}</strong>
        </p>
        <div style="background: #cffafe; padding: 12px 18px; border-radius: 8px; border-left: 4px solid #06b6d4; margin-top: 8px;">
          <strong>Số gốc ban đầu là:</strong> 
          <span style="font-size: 1.35rem; color: #0e7490; font-weight: 800; margin-left: 10px;">
            ${result}
          </span>
        </div>
      </div>
    `;
    unlockBadge('badge-3');
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
    if (questionId === 1 || questionId === 3 || questionId === 7) {
      unlockBadge('badge-2');
    }
    if (questionId === 5 || questionId === 6 || questionId === 9) {
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

  let rank = 'Tập Sự Hải Dương';
  if (gameState.score >= 300) rank = 'Hoa Tiêu Số Học';
  if (gameState.score >= 600) rank = 'Thuyền Phó Khám Phá';
  if (gameState.score >= 900) rank = 'Đại Kiện Tướng Hải Dương';

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

  // 3. Tàu ngầm Kilo 636
  const slider = document.getElementById('sub-slider');
  if (slider) {
    slider.addEventListener('input', (e) => {
      updateSubmarine(parseInt(e.target.value));
    });
  }

  const btnSubSgk = document.getElementById('btn-sub-sgk');
  if (btnSubSgk) {
    btnSubSgk.addEventListener('click', () => {
      if (slider) slider.value = 4;
      sound.playClick();
      updateSubmarine(4);
    });
  }

  // 4. Lab Solver
  const probSelect = document.getElementById('prob-type-select');
  if (probSelect) {
    probSelect.addEventListener('change', (e) => {
      const lbl = document.getElementById('input-param-label');
      if (lbl) {
        lbl.textContent = e.target.value === '1' ? 'Số a:' : 'Giá trị b:';
      }
    });
  }

  const btnSolve = document.getElementById('btn-solve-two-probs');
  if (btnSolve) {
    btnSolve.addEventListener('click', solveTwoProblems);
  }

  // 5. Khởi tạo renders
  updateSubmarine(4);
  solveTwoProblems();
  renderQuiz();
  updateHUD();
});
