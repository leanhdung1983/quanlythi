/* =========================================================
   BÀI 26: PHÉP NHÂN VÀ PHÉP CHIA PHÂN SỐ - APP.JS
   Gamification Engine, Sound Synthesizer & Calculation Labs
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
  studentName: 'Kỹ Sư Số Học Lớp 6',
  avatar: '🚴',
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

// --- DANH SÁCH 10 CÂU HỎI ĐẤU TRƯỜNG SGK (BÀI 6.27 – 6.33) ---
const quizData = [
  {
    id: 1,
    title: 'Bài 6.27a: Nhân Hai Phân Số & Rút Gọn Chéo',
    question: 'Tính giá trị của tích: (-5/9) · 12/25',
    options: [
      { text: '-4/15', correct: true },
      { text: '-60/225 (chưa rút gọn)', correct: false },
      { text: '4/15', correct: false },
      { text: '-20/45', correct: false }
    ],
    hint: 'Nhân tử với tử, mẫu với mẫu, rút gọn 5 với 25 và 12 với 9.',
    explanation: '(-5/9) · 12/25 = (-5 · 12) / (9 · 25) = (-60) / 225 = -4/15 (chia cả tử và mẫu cho 15).'
  },
  {
    id: 2,
    title: 'Bài 6.27b: Chia Hai Phân Số Âm',
    question: 'Tính thương: (-5/8) : (-15/16)',
    options: [
      { text: '2/3', correct: true },
      { text: '-2/3', correct: false },
      { text: '3/2', correct: false },
      { text: '75/128', correct: false }
    ],
    hint: 'Chia là nhân với phân số nghịch đảo: (-5/8) · (-16/15) = 2/3.',
    explanation: '(-5/8) : (-15/16) = (-5/8) · (-16/15) = [(-5) · (-16)] / (8 · 15) = 80/120 = 2/3.'
  },
  {
    id: 3,
    title: 'Bài 6.27c: Nhân Số Nguyên Với Phân Số',
    question: 'Tính giá trị biểu thức: 7 · (-3/14)',
    options: [
      { text: '-3/2', correct: true },
      { text: '-21/14 (chưa rút gọn)', correct: false },
      { text: '3/2', correct: false },
      { text: '-21/98', correct: false }
    ],
    hint: 'Lấy số nguyên nhân với tử số, giữ nguyên mẫu rồi rút gọn cho 7.',
    explanation: '7 · (-3/14) = [7 · (-3)] / 14 = -21/14 = -3/2 (rút gọn chia cả tử và mẫu cho 7).'
  },
  {
    id: 4,
    title: 'Bài 6.28a: Biểu Thức Kết Hợp Cộng Và Nhân',
    question: 'Tính giá trị của biểu thức: (1/2 + 2/3) · 6/7',
    options: [
      { text: '1', correct: true },
      { text: '7/6', correct: false },
      { text: '6/7', correct: false },
      { text: '13/14', correct: false }
    ],
    hint: 'Tính trong ngoặc: 1/2 + 2/3 = 7/6. Sau đó: (7/6) · (6/7) = 1.',
    explanation: 'Trong ngoặc: 1/2 + 2/3 = 3/6 + 4/6 = 7/6. Tiếp tục nhân: (7/6) · (6/7) = 1 (hai số nghịch đảo nhân nhau bằng 1).'
  },
  {
    id: 5,
    title: 'Bài 6.28b: Biểu Thức Phép Chia Có Dấu Ngoặc',
    question: 'Tính giá trị của biểu thức: 5/9 : (2/3 - 1/2)',
    options: [
      { text: '10/3', correct: true },
      { text: '5/54', correct: false },
      { text: '3/10', correct: false },
      { text: '5/6', correct: false }
    ],
    hint: 'Tính trong ngoặc: 2/3 - 1/2 = 4/6 - 3/6 = 1/6. Sau đó: 5/9 : 1/6 = 5/9 · 6 = 10/3.',
    explanation: 'Trong ngoặc: 2/3 - 1/2 = 1/6. Thực hiện phép chia: 5/9 : 1/6 = 5/9 · 6 = 30/9 = 10/3.'
  },
  {
    id: 6,
    title: 'Bài 6.29a: Tính Hợp Lý Nhờ Tính Chất Phân Phối',
    question: 'Tính nhanh giá trị của: A = (3/4) · (1/13) - (3/4) · (14/13)',
    options: [
      { text: '-3/4', correct: true },
      { text: '3/4', correct: false },
      { text: '0', correct: false },
      { text: '-1', correct: false }
    ],
    hint: 'Đặt thừa số chung 3/4 ra ngoài: (3/4) · (1/13 - 14/13) = (3/4) · (-1) = -3/4.',
    explanation: 'A = (3/4) · (1/13 - 14/13) = (3/4) · (-13/13) = (3/4) · (-1) = -3/4.'
  },
  {
    id: 7,
    title: 'Bài 6.29b: Tính Hợp Lý Tích Ba Phân Số Nghịch Đảo',
    question: 'Tính hợp lý biểu thức: B = (5/13) · (-3/10) · (-13/5)',
    options: [
      { text: '3/10', correct: true },
      { text: '-3/10', correct: false },
      { text: '1', correct: false },
      { text: '-1', correct: false }
    ],
    hint: 'Nhóm (5/13) và (-13/5) lại với nhau: (5/13) · (-13/5) = -1. Sau đó nhân với -3/10.',
    explanation: 'B = [(5/13) · (-13/5)] · (-3/10) = -1 · (-3/10) = 3/10.'
  },
  {
    id: 8,
    title: 'Bài 6.30: Quãng Đường Nam Đi Xe Đạp',
    question: 'Mỗi giờ Nam đi xe đạp được 15 km. Hỏi trong 20 phút Nam đi được bao nhiêu ki-lô-mét?',
    options: [
      { text: '5 km', correct: true },
      { text: '7.5 km', correct: false },
      { text: '3 km', correct: false },
      { text: '10 km', correct: false }
    ],
    hint: 'Đổi 20 phút = 20/60 giờ = 1/3 giờ. Quãng đường s = v · t = 15 · 1/3 = 5 km.',
    explanation: 'Đổi 20 phút = 1/3 giờ. Trong 20 phút Nam đi được quãng đường là: 15 · (1/3) = 5 km.'
  },
  {
    id: 9,
    title: 'Bài 6.31: Chiều Rộng Của Hình Chữ Nhật',
    question: 'Một hình chữ nhật có diện tích 21/10 cm² và chiều dài là 7/2 cm. Chiều rộng của hình chữ nhật đó là:',
    options: [
      { text: '3/5 cm', correct: true },
      { text: '5/3 cm', correct: false },
      { text: '147/20 cm', correct: false },
      { text: '6/10 cm (chưa rút gọn)', correct: false }
    ],
    hint: 'Chiều rộng = Diện tích : Chiều dài = 21/10 : 7/2 = 21/10 · 2/7 = 3/5 cm.',
    explanation: 'Chiều rộng hình chữ nhật là: 21/10 : 7/2 = 21/10 · 2/7 = (21 · 2) / (10 · 7) = 42/70 = 3/5 cm.'
  },
  {
    id: 10,
    title: 'Bài 6.32a & Bài 6.33: Tìm x & Tỉ Lệ Sở Thích Môn Học',
    question: 'Tìm x biết x · 7/2 = 7/9. Giá trị của x là:',
    options: [
      { text: 'x = 2/9', correct: true },
      { text: 'x = 9/2', correct: false },
      { text: 'x = 49/18', correct: false },
      { text: 'x = 1/9', correct: false }
    ],
    hint: 'x = (7/9) : (7/2) = (7/9) · (2/7) = 2/9.',
    explanation: 'x = (7/9) : (7/2) = (7/9) · (2/7) = (7 · 2) / (9 · 7) = 2/9.'
  }
];

// --- LAB 1: MÁY TÍNH NHÂN CHIA & NGHỊCH ĐẢO ---
function calculateMultDiv() {
  const a1 = parseInt(document.getElementById('lab-a1').value) || 0;
  const b1 = parseInt(document.getElementById('lab-b1').value) || 1;
  const op = document.getElementById('lab-op').value;
  const a2 = parseInt(document.getElementById('lab-a2').value) || 0;
  const b2 = parseInt(document.getElementById('lab-b2').value) || 1;

  if (b1 === 0 || b2 === 0) {
    alert('Mẫu số phải khác 0!');
    return;
  }

  if (op === '/' && a2 === 0) {
    alert('Không thể chia cho số 0 (phân số chia có tử bằng 0)!');
    return;
  }

  const output = document.getElementById('mult-lab-output');
  if (!output) return;

  sound.playClick();

  if (op === '*') {
    // Phép nhân: (a1/b1) * (a2/b2)
    const rawNum = a1 * a2;
    const rawDen = b1 * b2;
    const res = simplifyFrac(rawNum, rawDen);

    output.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <h3 style="color: #d97706; font-size: 1.1rem; margin-bottom: 8px;">
          📌 Phép Nhân Phân Số: (${formatFrac(a1, b1)}) · (${formatFrac(a2, b2)})
        </h3>
        <p><strong>Bước 1: Nhân tử với tử và mẫu với mẫu:</strong></p>
        <p style="margin-left: 20px; color: #475569;">
          = [(${a1}) · (${a2})] / [(${b1}) · (${b2})] = ${rawNum}/${rawDen}
        </p>
        <p><strong>Bước 2: Rút gọn về phân số tối giản (ước chung lớn nhất = ${gcd(rawNum, rawDen)}):</strong></p>
        <div style="background: #fef3c7; padding: 12px 18px; border-radius: 8px; border-left: 4px solid #d97706; margin-top: 8px;">
          <strong>Kết quả tối giản:</strong> 
          <span style="font-size: 1.35rem; color: #b45309; font-weight: 800; margin-left: 10px;">
            ${formatFrac(res.num, res.den)}
          </span>
        </div>
      </div>
    `;
    unlockBadge('badge-1');
  } else {
    // Phép chia: (a1/b1) : (a2/b2) = (a1/b1) * (b2/a2)
    const invNum = b2;
    const invDen = a2;
    const rawNum = a1 * invNum;
    const rawDen = b1 * invDen;
    const res = simplifyFrac(rawNum, rawDen);

    output.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <h3 style="color: #2563eb; font-size: 1.1rem; margin-bottom: 8px;">
          📌 Phép Chia Phân Số: (${formatFrac(a1, b1)}) : (${formatFrac(a2, b2)})
        </h3>
        <p><strong>Bước 1: Tìm phân số nghịch đảo của số chia:</strong></p>
        <p style="margin-left: 20px; color: #475569;">
          Phân số nghịch đảo của ${formatFrac(a2, b2)} là <strong style="color: #2563eb;">${formatFrac(invNum, invDen)}</strong>.
        </p>
        <p><strong>Bước 2: Chuyển phép chia thành phép nhân với phân số nghịch đảo:</strong></p>
        <p style="margin-left: 20px; color: #475569;">
          = (${formatFrac(a1, b1)}) · (${formatFrac(invNum, invDen)}) = [(${a1}) · (${invNum})] / [(${b1}) · (${invDen})] = ${rawNum}/${rawDen}
        </p>
        <p><strong>Bước 3: Rút gọn về phân số tối giản:</strong></p>
        <div style="background: #dbeafe; padding: 12px 18px; border-radius: 8px; border-left: 4px solid #2563eb; margin-top: 8px;">
          <strong>Kết quả thương:</strong> 
          <span style="font-size: 1.35rem; color: #1d4ed8; font-weight: 800; margin-left: 10px;">
            ${formatFrac(res.num, res.den)}
          </span>
        </div>
      </div>
    `;
    unlockBadge('badge-2');
  }
}

// --- LAB 2: MÔ PHỎNG THỰC TẾ ---
function renderSimulation(type) {
  const container = document.getElementById('sim-lab-output');
  if (!container) return;

  sound.playClick();

  if (type === 'bike') {
    container.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <h3 style="color: #d97706; margin-bottom: 8px;">🚲 Bài 6.30: Quãng Đường Xe Đạp Của Nam</h3>
        <p>• <strong>Vận tốc của Nam:</strong> $v = 15\\text{ km/h}$</p>
        <p>• <strong>Thời gian di chuyển:</strong> $t = 20\\text{ phút} = \\frac{20}{60}\\text{ giờ} = \\frac{1}{3}\\text{ giờ}$</p>
        <p>• <strong>Công thức quãng đường:</strong> $s = v \\cdot t$</p>
        <div style="background: #fffbeb; padding: 14px 18px; border-radius: 8px; border-left: 4px solid #d97706; margin-top: 10px;">
          <strong>Phép tính:</strong> $s = 15 \\cdot \\frac{1}{3} = \\frac{15 \\cdot 1}{3} = \\frac{15}{3} =$ <span style="font-size: 1.3rem; color: #b45309; font-weight: 800;">5 km</span>.
        </div>
      </div>
    `;
    unlockBadge('badge-3');
  } else if (type === 'rect') {
    container.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <h3 style="color: #2563eb; margin-bottom: 8px;">📐 Bài 6.31: Chiều Rộng Hình Chữ Nhật</h3>
        <p>• <strong>Diện tích:</strong> $S = \\frac{21}{10}\\text{ cm}^2$</p>
        <p>• <strong>Chiều dài:</strong> $a = \\frac{7}{2}\\text{ cm}$</p>
        <p>• <strong>Chiều rộng:</strong> $b = S : a = \\frac{21}{10} : \\frac{7}{2}$</p>
        <div style="background: #eff6ff; padding: 14px 18px; border-radius: 8px; border-left: 4px solid #2563eb; margin-top: 10px;">
          <strong>Phép tính chia:</strong> $b = \\frac{21}{10} \\cdot \\frac{2}{7} = \\frac{21 \\cdot 2}{10 \\cdot 7} = \\frac{42}{70} =$ <span style="font-size: 1.3rem; color: #1d4ed8; font-weight: 800;">3/5 cm (0.6 cm)</span>.
        </div>
      </div>
    `;
  } else {
    container.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <h3 style="color: #10b981; margin-bottom: 8px;">👥 Bài 6.33: Khảo Sát Sở Thích Học Sinh Lớp 6A</h3>
        <p>• Số học sinh thích môn Toán chiếm: $\\frac{1}{3}$ số học sinh cả lớp.</p>
        <p>• Trong số thích Toán đó, có $\\frac{1}{2}$ số học sinh thích cả môn Ngữ văn.</p>
        <p>• <strong>Tỉ lệ số học sinh thích cả hai môn Toán và Ngữ văn:</strong></p>
        <div style="background: #ecfdf5; padding: 14px 18px; border-radius: 8px; border-left: 4px solid #10b981; margin-top: 10px;">
          <strong>Phép nhân:</strong> $\\frac{1}{3} \\cdot \\frac{1}{2} = \\frac{1 \\cdot 1}{3 \\cdot 2} =$ <span style="font-size: 1.3rem; color: #047857; font-weight: 800;">1/6 số học sinh cả lớp</span>.
        </div>
      </div>
    `;
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
    if (questionId === 1 || questionId === 3) {
      unlockBadge('badge-1');
    }
    if (questionId === 2) {
      unlockBadge('badge-2');
    }
    if (questionId === 8) {
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

  let rank = 'Tập Sự Nhân Chia';
  if (gameState.score >= 300) rank = 'Kỹ Sư Số Học';
  if (gameState.score >= 600) rank = 'Chiến Binh Tính Toán';
  if (gameState.score >= 900) rank = 'Đại Kiện Tướng Nhân Chia';

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

  // 3. Lab Mult & Div
  const btnCalcMultDiv = document.getElementById('btn-calc-mult-div');
  if (btnCalcMultDiv) {
    btnCalcMultDiv.addEventListener('click', calculateMultDiv);
  }

  // 4. Lab Simulation Controls
  const btnBike = document.getElementById('btn-lab-bike');
  const btnRect = document.getElementById('btn-lab-rect');
  const btnFracClass = document.getElementById('btn-lab-fraction-class');

  if (btnBike) {
    btnBike.addEventListener('click', () => {
      [btnBike, btnRect, btnFracClass].forEach(b => b.classList.remove('active'));
      btnBike.classList.add('active');
      renderSimulation('bike');
    });
  }

  if (btnRect) {
    btnRect.addEventListener('click', () => {
      [btnBike, btnRect, btnFracClass].forEach(b => b.classList.remove('active'));
      btnRect.classList.add('active');
      renderSimulation('rect');
    });
  }

  if (btnFracClass) {
    btnFracClass.addEventListener('click', () => {
      [btnBike, btnRect, btnFracClass].forEach(b => b.classList.remove('active'));
      btnFracClass.classList.add('active');
      renderSimulation('class');
    });
  }

  // 5. Khởi tạo renders
  calculateMultDiv();
  renderSimulation('bike');
  renderQuiz();
  updateHUD();
});
