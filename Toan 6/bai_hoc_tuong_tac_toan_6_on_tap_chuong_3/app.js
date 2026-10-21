/* =========================================================
   ÔN TẬP CUỐI CHƯƠNG III: SỐ NGUYÊN (Z) - APP.JS
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
  studentName: 'Dũng Sĩ Băng Giá Lớp 6',
  avatar: '❄️',
  score: 0,
  stars: 0,
  streak: 0,
  answeredQuestions: new Set(),
  unlockedBadges: new Set()
};

// --- DANH SÁCH 10 CÂU HỎI ĐẤU TRƯỜNG SGK (BÀI 3.50 – 3.56) ---
const quizData = [
  {
    id: 1,
    title: 'Bài 3.50a: Nhiệt Độ Âm Thực Tế',
    question: 'Nhiệt độ đo được tại trạm nghiên cứu Vostok ở Nam Cực là 60°C dưới 0°C. Dùng số nguyên thích hợp để biểu thị nhiệt độ này:',
    options: [
      { text: '+60°C', correct: false },
      { text: '-60°C', correct: true },
      { text: '0°C', correct: false },
      { text: '-120°C', correct: false }
    ],
    hint: 'Dưới 0°C được quy ước biểu diễn bằng dấu âm (-).',
    explanation: 'Nhiệt độ 60°C dưới 0°C được biểu thị bằng số nguyên âm là -60°C.'
  },
  {
    id: 2,
    title: 'Bài 3.50b: Lợi Nhuận Kinh Doanh Âm',
    question: 'Trong quý III, công ty Hải Đăng làm ăn thua lỗ 2 triệu đồng. Dùng số nguyên thích hợp để diễn tả lợi nhuận của công ty trong quý này:',
    options: [
      { text: '2 triệu đồng', correct: false },
      { text: '-2 triệu đồng', correct: true },
      { text: '0 đồng', correct: false },
      { text: '-20 triệu đồng', correct: false }
    ],
    hint: 'Lãi mang giá trị dương, thua lỗ mang giá trị âm.',
    explanation: 'Thua lỗ 2 triệu đồng được biểu diễn là lợi nhuận -2 triệu đồng (hoặc -2 000 000 đồng).'
  },
  {
    id: 3,
    title: 'Bài 3.51: Xác Định Dấu Số Nguyên',
    question: 'Cho các số nguyên: a > 0, b < 0, c ≥ 1, d ≤ -2. Khẳng định nào sau đây là hoàn toàn ĐÚNG?',
    options: [
      { text: 'a, b là số nguyên âm; c, d là số nguyên dương', correct: false },
      { text: 'a, c là số nguyên dương; b, d là số nguyên âm', correct: true },
      { text: 'Cả 4 số đều là số nguyên dương', correct: false },
      { text: 'd là số nguyên dương vì |-2| = 2', correct: false }
    ],
    hint: 'Số lớn hơn 0 là số nguyên dương; số nhỏ hơn 0 là số nguyên âm.',
    explanation: 'Do a > 0 và c ≥ 1 nên a, c là số nguyên dương. Do b < 0 và d ≤ -2 nên b, d là số nguyên âm.'
  },
  {
    id: 4,
    title: 'Bài 3.52a: Tổng Dãy Số Nguyên Đối Nhau',
    question: 'Cho tập hợp S = {x ∈ ℤ | -5 < x ≤ 5}. Liệt kê các phần tử và tính tổng của tất cả các phần tử trong S:',
    options: [
      { text: 'S = {-5; -4; ...; 5}, Tổng = 0', correct: false },
      { text: 'S = {-4; -3; -2; -1; 0; 1; 2; 3; 4; 5}, Tổng = 5', correct: true },
      { text: 'S = {-4; -3; ...; 4}, Tổng = 0', correct: false },
      { text: 'S = {0; 1; 2; 3; 4; 5}, Tổng = 15', correct: false }
    ],
    hint: 'Vì -5 < x nên không lấy -5. Các cặp số đối từ -4 đến 4 cộng lại bằng 0.',
    explanation: 'S = {-4, -3, -2, -1, 0, 1, 2, 3, 4, 5}. Tổng = [(-4)+4] + [(-3)+3] + [(-2)+2] + [(-1)+1] + 0 + 5 = 0 + 5 = 5.'
  },
  {
    id: 5,
    title: 'Bài 3.52b: Tổng Các Số Nguyên Âm Dãy Liên Tiếp',
    question: 'Cho tập hợp T = {x ∈ ℤ | -7 ≤ x < 1}. Tính tổng tất cả các phần tử của tập hợp T:',
    options: [
      { text: '-28', correct: true },
      { text: '-21', correct: false },
      { text: '28', correct: false },
      { text: '-27', correct: false }
    ],
    hint: 'T gồm các số từ -7 đến 0 (không lấy 1). Cộng dồn các số âm này lại.',
    explanation: 'T = {-7, -6, -5, -4, -3, -2, -1, 0}. Tổng = - (7 + 6 + 5 + 4 + 3 + 2 + 1 + 0) = -28.'
  },
  {
    id: 6,
    title: 'Bài 3.53a: Tính Hợp Lý Với Thừa Số Chung',
    question: 'Tính một cách hợp lý giá trị của biểu thức: A = 15 · (-236) + 15 · 235',
    options: [
      { text: '-15', correct: true },
      { text: '15', correct: false },
      { text: '-30', correct: false },
      { text: '-3540', correct: false }
    ],
    hint: 'Đặt 15 làm thừa số chung: 15 · [(-236) + 235].',
    explanation: 'A = 15 · [(-236) + 235] = 15 · (-1) = -15.'
  },
  {
    id: 7,
    title: 'Bài 3.53b: Biến Đổi Dấu Đưa Về Thừa Số Chung',
    question: 'Tính một cách hợp lý giá trị biểu thức: B = 237 · (-28) + 28 · 137',
    options: [
      { text: '-2800', correct: true },
      { text: '2800', correct: false },
      { text: '-10472', correct: false },
      { text: '-280', correct: false }
    ],
    hint: 'Viết (-28) ra ngoài hoặc chuyển thành: 28 · [(-237) + 137].',
    explanation: 'B = 28 · [(-237) + 137] = 28 · (-100) = -2800.'
  },
  {
    id: 8,
    title: 'Bài 3.53c: Phá Ngoặc & Khử Cặp Đối Nhau',
    question: 'Tính giá trị hợp lý của biểu thức: C = 38 · (27 - 44) - 27 · (38 - 44)',
    options: [
      { text: '-484', correct: true },
      { text: '484', correct: false },
      { text: '0', correct: false },
      { text: '-1024', correct: false }
    ],
    hint: 'Khai triển: 38·27 - 38·44 - 27·38 + 27·44. Chú ý 38·27 - 27·38 = 0.',
    explanation: 'C = 38·27 - 38·44 - 27·38 + 27·44 = (38·27 - 27·38) - 44·(38 - 27) = 0 - 44 · 11 = -484.'
  },
  {
    id: 9,
    title: 'Bài 3.54: Thay Giá Trị Vào Biểu Thức Đại Số',
    question: 'Cho biểu thức P = (-35) · x - (-15) · 37. Giá trị của P khi x = -37 là:',
    options: [
      { text: '1850', correct: true },
      { text: '-1850', correct: false },
      { text: '740', correct: false },
      { text: '30', correct: false }
    ],
    hint: 'Thay x = -37: (-35)·(-37) = 35·37. Khi đó P = 35·37 + 15·37 = (35+15)·37.',
    explanation: 'P = (-35)·(-37) - (-15)·37 = 35·37 + 15·37 = (35 + 15)·37 = 50 · 37 = 1850.'
  },
  {
    id: 10,
    title: 'Bài 3.56: Suy Luận Dấu Của Tích 15 Số',
    question: 'Cho 15 số nguyên sao cho tích của 5 số bất kì trong chúng đều là một số âm. Hỏi tích của cả 15 số đó là số âm hay số dương?',
    options: [
      { text: 'Là số âm', correct: true },
      { text: 'Là số dương', correct: false },
      { text: 'Bằng 0', correct: false },
      { text: 'Không xác định được', correct: false }
    ],
    hint: 'Chia 15 số thành 3 nhóm, mỗi nhóm 5 số. Tích 5 số của mỗi nhóm đều mang dấu âm.',
    explanation: 'Ta chia 15 số đó thành 3 nhóm, mỗi nhóm gồm 5 số. Theo đề bài, tích của 5 số trong mỗi nhóm đều là số âm. Do đó, tích của cả 15 số là tích của 3 số âm: (-) · (-) · (-) = (-). Vậy tích của cả 15 số là số âm.'
  }
];

// --- RENDER GIAO DIỆN CÂU HỎI ĐẤU TRƯỜNG ---
function renderQuiz() {
  const quizList = document.getElementById('quiz-list');
  if (!quizList) return;
  quizList.innerHTML = '';

  quizData.forEach((q, index) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quiz-card-${q.id}`;

    const titleEl = document.createElement('div');
    titleEl.className = 'quiz-num';
    titleEl.innerHTML = `Câu ${index + 1}: ${q.title}`;

    const qText = document.createElement('div');
    qText.className = 'quiz-question';
    qText.innerHTML = q.question;

    const optGrid = document.createElement('div');
    optGrid.className = 'quiz-options';

    q.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = opt.text;
      btn.onclick = () => handleAnswer(q.id, opt, btn, card);
      optGrid.appendChild(btn);
    });

    const expBox = document.createElement('div');
    expBox.className = 'quiz-explanation';
    expBox.id = `exp-${q.id}`;
    expBox.innerHTML = `<strong>💡 Lời giải chi tiết:</strong> ${q.explanation}`;

    card.appendChild(titleEl);
    card.appendChild(qText);
    card.appendChild(optGrid);
    card.appendChild(expBox);

    quizList.appendChild(card);
  });
}

// --- XỬ LÝ TRẢ LỜI CÂU HỎI ---
function handleAnswer(qId, selectedOpt, btnEl, cardEl) {
  if (gameState.answeredQuestions.has(qId)) return;

  const optButtons = cardEl.querySelectorAll('.quiz-opt-btn');
  optButtons.forEach(b => b.disabled = true);

  if (selectedOpt.correct) {
    sound.playCorrect();
    btnEl.classList.add('correct');
    gameState.score += 100;
    gameState.stars += 1;
    gameState.streak += 1;
    gameState.answeredQuestions.add(qId);

    // Hiệu ứng thưởng combo streak
    if (gameState.streak >= 3) {
      unlockBadge('badge-4');
    }
  } else {
    sound.playWrong();
    btnEl.classList.add('wrong');
    gameState.streak = 0;
    optButtons.forEach(b => {
      const q = quizData.find(item => item.id === qId);
      const correctOpt = q.options.find(o => o.correct);
      if (b.innerHTML === correctOpt.text) {
        b.classList.add('correct');
      }
    });
  }

  // Hiển thị lời giải
  const expBox = document.getElementById(`exp-${qId}`);
  if (expBox) expBox.style.display = 'block';

  // Kiểm tra hoàn thành 10 câu
  if (gameState.stars === 10) {
    unlockBadge('badge-5');
  }

  updateHUD();
}

// --- MỞ KHÓA HUY HIỆU ---
function unlockBadge(badgeId) {
  if (gameState.unlockedBadges.has(badgeId)) return;
  gameState.unlockedBadges.add(badgeId);
  const badgeEl = document.getElementById(badgeId);
  if (badgeEl) {
    badgeEl.classList.remove('locked');
    badgeEl.classList.add('unlocked');
    sound.playBadge();
  }
}

// --- CẬP NHẬT HUD & CERTIFICATE ---
function updateHUD() {
  document.getElementById('hud-score').textContent = gameState.score;
  document.getElementById('hud-stars').textContent = gameState.stars;
  document.getElementById('hud-streak').textContent = gameState.streak;

  let rank = 'Tập Sự Số Nguyên';
  if (gameState.stars >= 4 && gameState.stars < 8) rank = 'Dũng Sĩ Trục Số';
  else if (gameState.stars >= 8 && gameState.stars < 10) rank = 'Bậc Thầy Biến Đổi ℤ';
  else if (gameState.stars === 10) rank = 'Đại Kiện Tướng Số Nguyên';

  document.getElementById('hud-rank-display').textContent = rank;

  // Cập nhật giấy chứng nhận
  document.getElementById('cert-name').textContent = gameState.studentName;
  document.getElementById('cert-score').textContent = gameState.score;
  document.getElementById('cert-stars').textContent = gameState.stars;
  document.getElementById('cert-rank').textContent = rank;

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  document.getElementById('cert-date').textContent = dateStr;
}

// --- THÍ NGHIỆM 1: MÁY TRIỆT TIÊU CẶP SỐ ĐỐI (BT 3.52) ---
function runZeroPairsLab() {
  sound.playClick();
  unlockBadge('badge-1');

  const aVal = parseInt(document.getElementById('input-range-a').value) || -5;
  const bVal = parseInt(document.getElementById('input-range-b').value) || 5;

  const outEl = document.getElementById('zero-pairs-output');
  if (!outEl) return;

  if (aVal >= bVal) {
    outEl.innerHTML = `<span style="color: #ef4444; font-weight: bold;">⚠️ Vui lòng nhập số cận dưới a nhỏ hơn cận trên b!</span>`;
    return;
  }

  // Liệt kê các phần tử trong (a, b]
  const elements = [];
  for (let x = aVal + 1; x <= bVal; x++) {
    elements.push(x);
  }

  if (elements.length === 0) {
    outEl.innerHTML = `Không có phần tử số nguyên nào trong khoảng (${aVal}; ${bVal}].`;
    return;
  }

  // Tìm các cặp đối nhau
  const used = new Set();
  const pairs = [];
  const unpaired = [];

  elements.forEach(val => {
    if (used.has(val)) return;
    const opp = -val;
    if (val !== 0 && elements.includes(opp) && !used.has(opp)) {
      pairs.push([Math.min(val, opp), Math.max(val, opp)]);
      used.add(val);
      used.add(opp);
    }
  });

  elements.forEach(val => {
    if (!used.has(val)) {
      unpaired.push(val);
    }
  });

  const totalSum = elements.reduce((acc, curr) => acc + curr, 0);

  let html = `<div style="text-align: left;">`;
  html += `<p><strong>Tập hợp:</strong> S = { ${elements.join(', ')} } (gồm <strong>${elements.length}</strong> số nguyên)</p>`;

  if (pairs.length > 0) {
    html += `<div style="margin-top: 10px;"><strong>⚡ Các cặp số đối triệt tiêu về 0:</strong><br>`;
    html += `<div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 6px;">`;
    pairs.forEach(p => {
      html += `<span style="background: #e0f2fe; color: #0284c7; padding: 4px 10px; border-radius: 6px; font-weight: bold; border: 1px solid #bae6fd;">(${p[0]} + ${p[1]} = 0)</span>`;
    });
    html += `</div></div>`;
  } else {
    html += `<p style="margin-top: 8px; color: #64748b;">(Không có cặp số đối xứng nào trong tập hợp này)</p>`;
  }

  html += `<div style="margin-top: 12px;"><strong>🎯 Các số dư lại không bị triệt tiêu:</strong> `;
  if (unpaired.length > 0) {
    html += `<span style="font-weight: bold; color: #0f172a;">${unpaired.join(', ')}</span>`;
  } else {
    html += `<span>Không còn số nào (tất cả đã triệt tiêu!)</span>`;
  }
  html += `</div>`;

  html += `<div style="margin-top: 14px; padding: 12px; background: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 8px; color: #065f46; font-size: 1.15rem; font-weight: bold;">
    ✨ Tổng tất cả các phần tử = ${totalSum}
  </div>`;
  html += `</div>`;

  outEl.innerHTML = html;
}

// --- THÍ NGHIỆM 2: MÁY PHÂN PHỐI THỪA SỐ CHUNG (BT 3.53) ---
function runDistributiveLab(exprId) {
  sound.playClick();
  unlockBadge('badge-2');

  const outEl = document.getElementById('distributive-output');
  if (!outEl) return;

  if (exprId === '1') {
    outEl.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <div style="font-size: 1.1rem; color: #0284c7; font-weight: bold;">Biểu thức: 15 · (-236) + 15 · 235</div>
        <p>• <strong>Bước 1:</strong> Phát hiện thừa số chung là <strong>15</strong>.</p>
        <p>• <strong>Bước 2:</strong> Áp dụng tính chất phân phối $a \\cdot b + a \\cdot c = a \\cdot (b + c)$:</p>
        <p style="padding: 6px 12px; background: #f1f5f9; border-radius: 6px; font-family: monospace; font-size: 1.1rem;">= 15 · [(-236) + 235]</p>
        <p>• <strong>Bước 3:</strong> Tính trong ngoặc vuông: $(-236) + 235 = -1$.</p>
        <p>• <strong>Bước 4:</strong> Kết quả: $15 · (-1) =$ <strong style="color: #0284c7; font-size: 1.25rem;">-15</strong>.</p>
      </div>
    `;
  } else if (exprId === '2') {
    outEl.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <div style="font-size: 1.1rem; color: #0284c7; font-weight: bold;">Biểu thức: 237 · (-28) + 28 · 137</div>
        <p>• <strong>Bước 1:</strong> Đưa dấu âm vào số đầu tiên: $237 · (-28) = (-237) · 28$.</p>
        <p>• <strong>Bước 2:</strong> Rút thừa số chung <strong>28</strong> ra ngoài:</p>
        <p style="padding: 6px 12px; background: #f1f5f9; border-radius: 6px; font-family: monospace; font-size: 1.1rem;">= 28 · [(-237) + 137]</p>
        <p>• <strong>Bước 3:</strong> Cộng trong ngoặc: $(-237) + 137 = -100$.</p>
        <p>• <strong>Bước 4:</strong> Kết quả: $28 · (-100) =$ <strong style="color: #0284c7; font-size: 1.25rem;">-2800</strong>.</p>
      </div>
    `;
  } else if (exprId === '3') {
    outEl.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <div style="font-size: 1.1rem; color: #0284c7; font-weight: bold;">Biểu thức: P = (-35)·(-37) - (-15)·37</div>
        <p>• <strong>Bước 1:</strong> Nhân hai số cùng dấu âm ra dương: $(-35) · (-37) = 35 · 37$.</p>
        <p>• <strong>Bước 2:</strong> Trừ đi một số âm là cộng với số dương: $- (-15) · 37 = + 15 · 37$.</p>
        <p>• <strong>Bước 3:</strong> Đặt thừa số chung <strong>37</strong> ra ngoài:</p>
        <p style="padding: 6px 12px; background: #f1f5f9; border-radius: 6px; font-family: monospace; font-size: 1.1rem;">= (35 + 15) · 37 = 50 · 37</p>
        <p>• <strong>Bước 4:</strong> Kết quả: $50 · 37 =$ <strong style="color: #0284c7; font-size: 1.25rem;">1850</strong>.</p>
      </div>
    `;
  }
}

// --- KHỞI TẠO SỰ KIỆN ---
function initEvents() {
  // Modal chọn avatar
  const avatarButtons = document.querySelectorAll('.avatar-btn');
  avatarButtons.forEach(btn => {
    btn.onclick = () => {
      sound.playClick();
      avatarButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      gameState.avatar = btn.getAttribute('data-avatar');
    };
  });

  // Nút Vào Học
  const btnEnter = document.getElementById('btn-enter-game');
  if (btnEnter) {
    btnEnter.onclick = () => {
      sound.playCorrect();
      const nameInput = document.getElementById('student-name-input');
      if (nameInput && nameInput.value.trim() !== '') {
        gameState.studentName = nameInput.value.trim();
      }
      document.getElementById('hud-avatar-display').textContent = gameState.avatar;
      document.getElementById('hud-name-display').textContent = gameState.studentName;
      document.getElementById('start-modal').classList.add('hidden');
      updateHUD();
    };
  }

  // Toggle Sound
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  if (btnToggleSound) {
    btnToggleSound.onclick = () => {
      sound.muted = !sound.muted;
      btnToggleSound.textContent = sound.muted ? '🔇 Âm thanh: TẮT' : '🔊 Âm thanh: BẬT';
    };
  }

  // Reset Game
  const btnReset = document.getElementById('btn-reset-game');
  if (btnReset) {
    btnReset.onclick = resetGame;
  }
  const btnReplay = document.getElementById('btn-replay-lesson');
  if (btnReplay) {
    btnReplay.onclick = resetGame;
  }

  // Nút Lab 1
  const btnRunPairs = document.getElementById('btn-run-zero-pairs');
  if (btnRunPairs) {
    btnRunPairs.onclick = runZeroPairsLab;
  }

  // Nút Lab 2
  const exprButtons = document.querySelectorAll('button[data-expr]');
  exprButtons.forEach(btn => {
    btn.onclick = () => runDistributiveLab(btn.getAttribute('data-expr'));
  });
}

function resetGame() {
  sound.playClick();
  gameState.score = 0;
  gameState.stars = 0;
  gameState.streak = 0;
  gameState.answeredQuestions.clear();
  gameState.unlockedBadges.clear();

  document.querySelectorAll('.badge-card').forEach(b => {
    b.classList.remove('unlocked');
    b.classList.add('locked');
  });

  renderQuiz();
  updateHUD();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', () => {
  renderQuiz();
  initEvents();
  updateHUD();
  runZeroPairsLab(); // Chạy demo lần đầu cho Lab 1
});
