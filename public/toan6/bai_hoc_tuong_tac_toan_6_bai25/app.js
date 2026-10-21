/* =========================================================
   BÀI 25: PHÉP CỘNG VÀ PHÉP TRỪ PHÂN SỐ - APP.JS
   Gamification Engine, Sound Synthesizer & Interactive Labs
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
  studentName: 'Nhà Toán Học Nhí Lớp 6',
  avatar: '🧙‍♂️',
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

function lcm(a, b) {
  return Math.abs(a * b) / gcd(a, b);
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

// --- DANH SÁCH 10 CÂU HỎI ĐẤU TRƯỜNG SGK (BÀI 6.21 – 6.26) ---
const quizData = [
  {
    id: 1,
    title: 'Bài 6.21a: Cộng Hai Phân Số Cùng Mẫu',
    question: 'Tính giá trị của tổng: (-1/13) + 9/13',
    options: [
      { text: '8/13', correct: true },
      { text: '10/13', correct: false },
      { text: '-8/13', correct: false },
      { text: '8/26', correct: false }
    ],
    hint: 'Cùng mẫu 13, ta lấy tử số cộng tử số: (-1) + 9 = 8.',
    explanation: 'Ta có: (-1/13) + 9/13 = [(-1) + 9] / 13 = 8/13.'
  },
  {
    id: 2,
    title: 'Bài 6.21b: Cộng Hai Phân Số Khác Mẫu',
    question: 'Tính giá trị của tổng: (-3/8) + 5/12',
    options: [
      { text: '1/24', correct: true },
      { text: '2/20', correct: false },
      { text: '-1/24', correct: false },
      { text: '7/24', correct: false }
    ],
    hint: 'BCNN(8, 12) = 24. Quy đồng: -3/8 = -9/24; 5/12 = 10/24.',
    explanation: 'BCNN(8, 12) = 24. Ta có: (-3/8) + 5/12 = (-9/24) + 10/24 = (-9 + 10) / 24 = 1/24.'
  },
  {
    id: 3,
    title: 'Bài 6.22: Nhận Diện Số Đối Của Phân Số',
    question: 'Cặp số đối của các phân số -3/7; 6/13; 4/(-3) lần lượt là:',
    options: [
      { text: '3/7 ; -6/13 ; 4/3', correct: true },
      { text: '-3/7 ; 6/13 ; -4/3', correct: false },
      { text: '7/3 ; -13/6 ; 3/4', correct: false },
      { text: '3/7 ; 6/13 ; -4/3', correct: false }
    ],
    hint: 'Số đối của a/b là -a/b sao cho tổng bằng 0. Chú ý 4/(-3) = -4/3 nên số đối là 4/3.',
    explanation: 'Số đối của -3/7 là 3/7. Số đối của 6/13 là -6/13. Số đối của 4/(-3) = -4/3 là 4/3.'
  },
  {
    id: 4,
    title: 'Bài 6.23a: Trừ Hai Phân Số Cùng Mẫu',
    question: 'Thực hiện phép trừ: (-5/3) - (-7/3)',
    options: [
      { text: '2/3', correct: true },
      { text: '-12/3 = -4', correct: false },
      { text: '-2/3', correct: false },
      { text: '4/3', correct: false }
    ],
    hint: 'Trừ cho số âm là cộng với số đối: (-5/3) + 7/3 = 2/3.',
    explanation: '(-5/3) - (-7/3) = (-5/3) + 7/3 = [(-5) + 7] / 3 = 2/3.'
  },
  {
    id: 5,
    title: 'Bài 6.23b: Trừ Hai Phân Số Khác Mẫu',
    question: 'Tính hiệu: 5/6 - 8/9',
    options: [
      { text: '-1/18', correct: true },
      { text: '1/18', correct: false },
      { text: '-3/3', correct: false },
      { text: '-1/3', correct: false }
    ],
    hint: 'BCNN(6, 9) = 18. Quy đồng: 15/18 - 16/18 = -1/18.',
    explanation: 'BCNN(6, 9) = 18. Ta có: 5/6 - 8/9 = 15/18 - 16/18 = (15 - 16) / 18 = -1/18.'
  },
  {
    id: 6,
    title: 'Bài 6.23c: Trừ Phân Số Cho Số Nguyên',
    question: 'Tính giá trị của biểu thức: 4/11 - (-3)',
    options: [
      { text: '37/11', correct: true },
      { text: '-29/11', correct: false },
      { text: '7/11', correct: false },
      { text: '1/11', correct: false }
    ],
    hint: '4/11 - (-3) = 4/11 + 3 = 4/11 + 33/11 = 37/11.',
    explanation: '4/11 - (-3) = 4/11 + 3 = 4/11 + 33/11 = (4 + 33) / 11 = 37/11.'
  },
  {
    id: 7,
    title: 'Bài 6.24: Tính Một Cách Hợp Lý Biểu Thức A',
    question: 'Tính giá trị: A = (-3/11) + 11/8 - 3/8 + (-8/11)',
    options: [
      { text: '0', correct: true },
      { text: '1', correct: false },
      { text: '-1', correct: false },
      { text: '2', correct: false }
    ],
    hint: 'Nhóm các phân số cùng mẫu: [(-3/11) + (-8/11)] + [11/8 - 3/8] = -1 + 1 = 0.',
    explanation: 'A = [(-3/11) + (-8/11)] + (11/8 - 3/8) = [(-11)/11] + 8/8 = -1 + 1 = 0.'
  },
  {
    id: 8,
    title: 'Bài 6.25: Quản Lý Thu Nhập Của Chị Chi',
    question: 'Chị Chi tiêu dùng hết 2/5 tiền lương, dành 1/4 tiền lương biếu mẹ. Phần tiền lương còn lại của chị Chi chiếm tỉ lệ bao nhiêu?',
    options: [
      { text: '7/20 tiền lương', correct: true },
      { text: '13/20 tiền lương', correct: false },
      { text: '3/20 tiền lương', correct: false },
      { text: '1/3 tiền lương', correct: false }
    ],
    hint: 'Tổng số phần chi tiêu: 2/5 + 1/4 = 13/20. Số phần còn lại là 1 - 13/20.',
    explanation: 'Chị Chi đã dùng: 2/5 + 1/4 = 8/20 + 5/20 = 13/20 tiền lương. Số tiền lương còn lại là: 1 - 13/20 = 7/20 số tiền lương.'
  },
  {
    id: 9,
    title: 'Bài 6.26a: Thời Gian Học Ở Trường & Ngoại Khóa Của Mai',
    question: 'Mai dành 1/3 ngày học ở trường, 1/24 ngày tham gia hoạt động ngoại khóa. Tổng thời gian cho hai hoạt động trên chiếm mấy phần của ngày?',
    options: [
      { text: '3/8 ngày', correct: true },
      { text: '2/27 ngày', correct: false },
      { text: '9/24 ngày (chưa rút gọn)', correct: false },
      { text: '5/12 ngày', correct: false }
    ],
    hint: '1/3 + 1/24 = 8/24 + 1/24 = 9/24 = 3/8.',
    explanation: 'Thời gian học ở trường và ngoại khóa: 1/3 + 1/24 = 8/24 + 1/24 = 9/24 = 3/8 ngày.'
  },
  {
    id: 10,
    title: 'Bài 6.26b: Thời Gian Cho Các Hoạt Động Cá Nhân Khác Của Mai',
    question: 'Biết Mai dành 7/16 ngày cho ăn ngủ. Thời gian còn lại trong ngày dành cho các hoạt động cá nhân khác là bao nhiêu?',
    options: [
      { text: '3/16 ngày', correct: true },
      { text: '5/16 ngày', correct: false },
      { text: '1/8 ngày', correct: false },
      { text: '1/4 ngày', correct: false }
    ],
    hint: '1 ngày trừ đi (3/8 ngày + 7/16 ngày) = 1 - (6/16 + 7/16) = 1 - 13/16 = 3/16.',
    explanation: 'Tổng thời gian học trường, ngoại khóa và ăn ngủ: 3/8 + 7/16 = 6/16 + 7/16 = 13/16 ngày. Thời gian cho hoạt động cá nhân khác: 1 - 13/16 = 3/16 ngày.'
  }
];

// --- LAB 1: THÁP PHÂN SỐ TAM GIÁC ---
let pyramidBase = [
  { num: 1, den: 2 },
  { num: 1, den: 3 },
  { num: 1, den: 4 }
];

function renderPyramid() {
  const container = document.getElementById('pyramid-lab-output');
  if (!container) return;

  // Tính hàng 2: tổng của cặp (0,1) và cặp (1,2)
  const row2_0 = simplifyFrac(pyramidBase[0].num * pyramidBase[1].den + pyramidBase[1].num * pyramidBase[0].den, pyramidBase[0].den * pyramidBase[1].den);
  const row2_1 = simplifyFrac(pyramidBase[1].num * pyramidBase[2].den + pyramidBase[2].num * pyramidBase[1].den, pyramidBase[1].den * pyramidBase[2].den);

  // Tính đỉnh: tổng row2_0 và row2_1
  const top = simplifyFrac(row2_0.num * row2_1.den + row2_1.num * row2_0.den, row2_0.den * row2_1.den);

  container.innerHTML = `
    <div class="pyramid-wrapper">
      <div class="pyramid-row">
        <div class="pyramid-node highlight" title="Đỉnh tháp">${formatFrac(top.num, top.den)}</div>
      </div>
      <div class="pyramid-row">
        <div class="pyramid-node" title="Tầng 2 trái">${formatFrac(row2_0.num, row2_0.den)}</div>
        <div class="pyramid-node" title="Tầng 2 phải">${formatFrac(row2_1.num, row2_1.den)}</div>
      </div>
      <div class="pyramid-row">
        <div class="pyramid-node" title="Đáy 1">${formatFrac(pyramidBase[0].num, pyramidBase[0].den)}</div>
        <div class="pyramid-node" title="Đáy 2">${formatFrac(pyramidBase[1].num, pyramidBase[1].den)}</div>
        <div class="pyramid-node" title="Đáy 3">${formatFrac(pyramidBase[2].num, pyramidBase[2].den)}</div>
      </div>
    </div>
    <div style="margin-top: 16px; font-size: 0.95rem; color: #475569; text-align: left; background: #faf5ff; padding: 12px 16px; border-radius: 8px;">
      <strong>🔍 Chi tiết phép tính các tầng tháp:</strong>
      <br>• Tầng 2 (trái) = ${formatFrac(pyramidBase[0].num, pyramidBase[0].den)} + ${formatFrac(pyramidBase[1].num, pyramidBase[1].den)} = <strong>${formatFrac(row2_0.num, row2_0.den)}</strong>
      <br>• Tầng 2 (phải) = ${formatFrac(pyramidBase[1].num, pyramidBase[1].den)} + ${formatFrac(pyramidBase[2].num, pyramidBase[2].den)} = <strong>${formatFrac(row2_1.num, row2_1.den)}</strong>
      <br>• Đỉnh tháp = ${formatFrac(row2_0.num, row2_0.den)} + ${formatFrac(row2_1.num, row2_1.den)} = <strong style="color: #7c3aed; font-size: 1.1rem;">${formatFrac(top.num, top.den)}</strong>
    </div>
  `;
}

// --- LAB 2: MÁY TÍNH CỘNG TRỪ TỪNG BƯỚC ---
function calculateStepByStep() {
  const a1 = parseInt(document.getElementById('calc-a1').value) || 0;
  const b1 = parseInt(document.getElementById('calc-b1').value) || 1;
  const op = document.getElementById('calc-op').value;
  const a2 = parseInt(document.getElementById('calc-a2').value) || 0;
  const b2 = parseInt(document.getElementById('calc-b2').value) || 1;

  if (b1 === 0 || b2 === 0) {
    alert('Mẫu số phải khác 0!');
    return;
  }

  const output = document.getElementById('calc-lab-output');
  if (!output) return;

  const msc = lcm(Math.abs(b1), Math.abs(b2));
  const ts1 = msc / Math.abs(b1);
  const ts2 = msc / Math.abs(b2);

  // Đưa dấu về tử
  const num1 = b1 < 0 ? -a1 : a1;
  const num2 = b2 < 0 ? -a2 : a2;

  const qd1 = num1 * ts1;
  const qd2 = num2 * ts2;

  let resNum = op === '+' ? qd1 + qd2 : qd1 - qd2;
  const finalFrac = simplifyFrac(resNum, msc);

  sound.playClick();

  output.innerHTML = `
    <div style="text-align: left; line-height: 1.8;">
      <h3 style="color: #7c3aed; font-size: 1.1rem; margin-bottom: 8px;">
        📌 Thực Hiện Phép Tính: (${formatFrac(num1, Math.abs(b1))}) ${op} (${formatFrac(num2, Math.abs(b2))})
      </h3>
      <p><strong>Bước 1: Tìm Mẫu Số Chung Nhỏ Nhất (MSCNN):</strong></p>
      <p style="margin-left: 20px; color: #475569;">BCNN(${Math.abs(b1)}, ${Math.abs(b2)}) = <span style="color: #7c3aed; font-weight: 800;">${msc}</span>. Thừa số phụ: ${msc} : ${Math.abs(b1)} = ${ts1}; ${msc} : ${Math.abs(b2)} = ${ts2}.</p>
      
      <p><strong>Bước 2: Quy đồng mẫu các phân số:</strong></p>
      <p style="margin-left: 20px; color: #475569;">
        • ${formatFrac(num1, Math.abs(b1))} = (${num1} · ${ts1}) / ${msc} = ${qd1}/${msc}
        <br>• ${formatFrac(num2, Math.abs(b2))} = (${num2} · ${ts2}) / ${msc} = ${qd2}/${msc}
      </p>

      <p><strong>Bước 3: Thực hiện phép ${op === '+' ? 'cộng' : 'trừ'}:</strong></p>
      <p style="margin-left: 20px; color: #475569;">
        = (${qd1} ${op} ${qd2}) / ${msc} = ${resNum}/${msc}
      </p>

      <p><strong>Bước 4: Rút gọn về phân số tối giản:</strong></p>
      <div style="background: #ede9fe; padding: 12px 18px; border-radius: 8px; border-left: 4px solid #7c3aed; margin-top: 8px;">
        <strong>Kết quả cuối cùng:</strong> 
        <span style="font-size: 1.3rem; color: #6d28d9; font-weight: 800; margin-left: 10px;">
          ${formatFrac(finalFrac.num, finalFrac.den)}
        </span>
      </div>
    </div>
  `;
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

    // Huy hiệu streak
    if (gameState.streak >= 3) {
      unlockBadge('badge-4');
    }
    // Huy hiệu câu 3: Bậc thầy số đối
    if (questionId === 3) {
      unlockBadge('badge-2');
    }
    // Huy hiệu câu 9, 10: Nhà quản lý thời gian
    if (questionId === 9 || questionId === 10) {
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

  // Nếu hoàn thành toàn bộ
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

  let rank = 'Tập Sự Cộng Trừ';
  if (gameState.score >= 300) rank = 'Học Sinh Chăm Chỉ';
  if (gameState.score >= 600) rank = 'Chiến Binh Số Học';
  if (gameState.score >= 900) rank = 'Đại Kiện Tướng Phân Số';

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

  // 3. Lab Pyramid controls
  const btnPyrSgk = document.getElementById('btn-pyramid-sgk');
  const btnPyrCustom = document.getElementById('btn-pyramid-custom');
  const btnPyrSolve = document.getElementById('btn-pyramid-solve');

  if (btnPyrSgk) {
    btnPyrSgk.addEventListener('click', () => {
      sound.playClick();
      pyramidBase = [{ num: 1, den: 2 }, { num: 1, den: 3 }, { num: 1, den: 4 }];
      renderPyramid();
      unlockBadge('badge-1');
    });
  }

  if (btnPyrCustom) {
    btnPyrCustom.addEventListener('click', () => {
      sound.playClick();
      const r1 = Math.floor(Math.random() * 5) + 1;
      const r2 = Math.floor(Math.random() * 5) + 1;
      const r3 = Math.floor(Math.random() * 5) + 1;
      pyramidBase = [{ num: 1, den: r1 + 1 }, { num: 1, den: r2 + 2 }, { num: 1, den: r3 + 1 }];
      renderPyramid();
      unlockBadge('badge-1');
    });
  }

  if (btnPyrSolve) {
    btnPyrSolve.addEventListener('click', () => {
      sound.playBadge();
      unlockBadge('badge-1');
      renderPyramid();
    });
  }

  // 4. Lab Calc Step
  const btnCalc = document.getElementById('btn-calc-step');
  if (btnCalc) {
    btnCalc.addEventListener('click', calculateStepByStep);
  }

  // 5. Khởi tạo renders
  renderPyramid();
  calculateStepByStep();
  renderQuiz();
  updateHUD();
});
