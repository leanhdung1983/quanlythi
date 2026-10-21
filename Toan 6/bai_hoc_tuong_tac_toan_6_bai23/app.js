/* =========================================================
   BÀI 23: MỞ RỘNG KHÁI NIỆM PHÂN SỐ. PHÂN SỐ BẰNG NHAU - APP.JS
   Gamification Engine, Sound Synthesizer & Treasure Maze Lab
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
  studentName: 'Thợ Lặn Phân Số Lớp 6',
  avatar: '🌊',
  score: 0,
  stars: 0,
  streak: 0,
  answeredQuestions: new Set(),
  unlockedBadges: new Set()
};

// --- DANH SÁCH 10 CÂU HỎI ĐẤU TRƯỜNG SGK (BÀI 6.1 – 6.7) ---
const quizData = [
  {
    id: 1,
    title: 'Bài 6.1a: Nhận Biết Tử Số & Mẫu Số',
    question: 'Phân số -6/11 có tử số và mẫu số lần lượt là:',
    options: [
      { text: 'Tử số: -6 ; Mẫu số: 11', correct: true },
      { text: 'Tử số: 11 ; Mẫu số: -6', correct: false },
      { text: 'Tử số: 6 ; Mẫu số: 11', correct: false },
      { text: 'Tử số: -6 ; Mẫu số: -11', correct: false }
    ],
    hint: 'Số viết ở trên dấu gạch ngang là tử số, số viết ở dưới là mẫu số.',
    explanation: 'Phân số -6/11 có tử số là -6 và mẫu số là 11.'
  },
  {
    id: 2,
    title: 'Bài 6.1b: Viết Phân Số Từ Tử Và Mẫu',
    question: 'Phân số có tử số là 9 và mẫu số là -11 được viết là:',
    options: [
      { text: '9 / -11', correct: true },
      { text: '-11 / 9', correct: false },
      { text: '-9 / -11', correct: false },
      { text: '9 / 11', correct: false }
    ],
    hint: 'Tử số viết phía trên, mẫu số viết phía dưới dấu gạch ngang.',
    explanation: 'Phân số có tử số 9 và mẫu số -11 được viết là 9/(-11).'
  },
  {
    id: 3,
    title: 'Bài 6.2a: Tìm Số Còn Thiếu Bằng Quy Tắc Bằng Nhau',
    question: 'Thay dấu "?" bằng số thích hợp để được hai phân số bằng nhau: 1/2 = ?/8',
    options: [
      { text: '4', correct: true },
      { text: '2', correct: false },
      { text: '8', correct: false },
      { text: '16', correct: false }
    ],
    hint: 'Áp dụng tính chất nhân cả tử và mẫu với 4: (1 · 4) / (2 · 4) = 4/8, hoặc tích chéo: ? = (1 · 8) : 2.',
    explanation: 'Ta có 1 · 8 = 2 · ? ⇒ ? = 8 : 2 = 4. Vậy số cần điền là 4.'
  },
  {
    id: 4,
    title: 'Bài 6.2b: Tìm Mẫu Số Bằng Tích Chéo',
    question: 'Thay dấu "?" bằng số thích hợp: (-6)/9 = 18/?',
    options: [
      { text: '-27', correct: true },
      { text: '27', correct: false },
      { text: '-12', correct: false },
      { text: '-54', correct: false }
    ],
    hint: 'Tích chéo: (-6) · ? = 9 · 18 = 162 ⇒ ? = 162 : (-6).',
    explanation: 'Theo quy tắc bằng nhau: (-6) · ? = 9 · 18 = 162 ⇒ ? = 162 : (-6) = -27.'
  },
  {
    id: 5,
    title: 'Bài 6.3: Đổi Phân Số Sang Mẫu Dương',
    question: 'Viết phân số 8/(-11) thành phân số bằng nó và có mẫu dương:',
    options: [
      { text: '-8/11', correct: true },
      { text: '8/11', correct: false },
      { text: '-11/8', correct: false },
      { text: '-8/-11', correct: false }
    ],
    hint: 'Nhân cả tử và mẫu với -1: 8 · (-1) / [(-11) · (-1)].',
    explanation: 'Nhân cả tử và mẫu với -1 ta được: 8/(-11) = [8 · (-1)] / [(-11) · (-1)] = -8/11.'
  },
  {
    id: 6,
    title: 'Bài 6.4a: Rút Gọn Phân Số Mẫu Âm',
    question: 'Rút gọn phân số 7/(-35) về dạng phân số tối giản có mẫu dương:',
    options: [
      { text: '-1/5', correct: true },
      { text: '1/(-5)', correct: false },
      { text: '-7/35', correct: false },
      { text: '1/5', correct: false }
    ],
    hint: 'ƯCLN(7, 35) = 7. Chia cả tử và mẫu cho -7.',
    explanation: 'Chia cả tử và mẫu cho -7: 7 : (-7) = -1 và (-35) : (-7) = 5. Kết quả là -1/5.'
  },
  {
    id: 7,
    title: 'Bài 6.4b: Rút Gọn Cả Tử Và Mẫu Đều Âm',
    question: 'Rút gọn phân số (-12)/(-4) ta được kết quả là:',
    options: [
      { text: '3', correct: true },
      { text: '-3', correct: false },
      { text: '1/3', correct: false },
      { text: '-1/3', correct: false }
    ],
    hint: 'Chia cả tử và mẫu cho -4: (-12) : (-4) = 3.',
    explanation: '(-12)/(-4) = [(-12) : (-4)] / [(-4) : (-4)] = 3/1 = 3.'
  },
  {
    id: 8,
    title: 'Bài 6.5: Đổi Đơn Vị Phút Sang Giờ',
    question: 'Viết số đo thời gian 15 phút theo đơn vị giờ dưới dạng phân số tối giản:',
    options: [
      { text: '1/4 giờ', correct: true },
      { text: '15/60 giờ', correct: false },
      { text: '1/6 giờ', correct: false },
      { text: '3/4 giờ', correct: false }
    ],
    hint: '1 giờ có 60 phút. Lấy 15 chia cho 60 rồi rút gọn cho 15.',
    explanation: '15 phút = 15/60 giờ = (15:15) / (60:15) = 1/4 giờ.'
  },
  {
    id: 9,
    title: 'Bài 6.6: Bài Toán Vòi Nước Chảy Vào Bể',
    question: 'Một vòi nước chảy vào bể không có nước, sau 40 phút thì đầy bể. Hỏi sau 10 phút, lượng nước đã chảy chiếm bao nhiêu phần bể?',
    options: [
      { text: '1/4 bể', correct: true },
      { text: '1/40 bể', correct: false },
      { text: '10/40 bể (chưa tối giản)', correct: false },
      { text: '1/3 bể', correct: false }
    ],
    hint: 'Lấy 10 chia cho 40 rồi rút gọn phân số.',
    explanation: 'Sau 10 phút, lượng nước chảy được chiếm: 10/40 = 1/4 (bể).'
  },
  {
    id: 10,
    title: 'Bài 6.7: Bài Toán Tỉ Lệ Tiền Thưởng',
    question: 'Hà Linh nhận thưởng 200 000 đồng và mua quà tặng mẹ hết 80 000 đồng. Hỏi Hà Linh đã tiêu hết bao nhiêu phần số tiền thưởng?',
    options: [
      { text: '2/5', correct: true },
      { text: '4/5', correct: false },
      { text: '3/5', correct: false },
      { text: '1/2', correct: false }
    ],
    hint: 'Phân số biểu thị là 80 000 / 200 000. Rút gọn cho 40 000.',
    explanation: 'Phần tiền Hà Linh đã tiêu là: 80 000 / 200 000 = (80 000 : 40 000) / (200 000 : 40 000) = 2/5 (số tiền).'
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

    // Khen thưởng chuyên gia đổi đơn vị
    if (qId === 8 || qId === 9 || qId === 10) unlockBadge('badge-3');

    // Combo streak
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

  let rank = 'Tập Sự Phân Số';
  if (gameState.stars >= 4 && gameState.stars < 8) rank = 'Thợ Lặn Phân Số';
  else if (gameState.stars >= 8 && gameState.stars < 10) rank = 'Bậc Thầy Tối Giản';
  else if (gameState.stars === 10) rank = 'Đại Kiện Tướng Phân Số';

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

// --- THÍ NGHIỆM 1: MÁY RÚT GỌN PHÂN SỐ THÔNG MINH ---
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    let t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function runFractionLab() {
  sound.playClick();
  unlockBadge('badge-1');

  let a = parseInt(document.getElementById('input-num-a').value) || 0;
  let b = parseInt(document.getElementById('input-num-b').value) || 1;

  const outEl = document.getElementById('fraction-lab-output');
  if (!outEl) return;

  if (b === 0) {
    outEl.innerHTML = `<span style="color: #ef4444; font-weight: bold;">⚠️ Mẫu số b phải khác 0! Vui lòng nhập lại mẫu số.</span>`;
    return;
  }

  // Đổi sang mẫu dương nếu mẫu âm
  let posA = a, posB = b;
  let convertedSign = false;
  if (b < 0) {
    posA = -a;
    posB = -b;
    convertedSign = true;
  }

  const commonGcd = gcd(posA, posB);
  const simpA = posA / commonGcd;
  const simpB = posB / commonGcd;

  let isReduced = (commonGcd === 1 && !convertedSign);

  let html = `<div style="text-align: left; line-height: 1.8;">`;
  html += `<div style="font-size: 1.15rem; color: #0d9488; font-weight: 800; margin-bottom: 8px;">
    🌊 Phân Tích Phân Số: <span style="font-family: monospace; font-size: 1.3rem;">${a} / ${b}</span>
  </div>`;
  html += `<p>• <strong>Bản chất:</strong> Biểu thị thương của phép chia số nguyên: $(${a}) : (${b})$.</p>`;

  if (convertedSign) {
    html += `<p>• <strong>Quy tắc đổi mẫu dương:</strong> Nhân cả tử và mẫu với $-1$: 
      <span style="background: #f1f5f9; padding: 2px 8px; border-radius: 4px; font-weight: bold;">
        ${posA} / ${posB}
      </span>
    </p>`;
  }

  html += `<p>• <strong>Ước chung lớn nhất của tử và mẫu:</strong> ƯCLN(${Math.abs(posA)}, ${posB}) = <strong>${commonGcd}</strong>.</p>`;

  if (commonGcd > 1) {
    html += `<p>• <strong>Rút gọn về phân số tối giản:</strong> Chia cả tử và mẫu cho ${commonGcd}:</p>`;
  }

  html += `<div style="margin-top: 10px; padding: 12px; background: #f0fdfa; border: 2px solid #99f6e4; border-radius: 8px; color: #0f766e; font-size: 1.25rem; font-weight: bold;">
    ✨ Phân số tối giản có mẫu dương = ${simpB === 1 ? simpA : `${simpA} / ${simpB}`}
  </div>`;
  html += `</div>`;

  outEl.innerHTML = html;
}

// --- THÍ NGHIỆM 2: MÊ CUNG KHO BÁU (SGK TRANG 8 THỬ THÁCH NHỎ) ---
// Lưới 3x3:
// (-16/25) [r0, c0]     (-33/44) [r0, c1] (= -3/4)      [KHO BÁU: r0, c2]
// (-9/14)  [r1, c0]     (-15/20) [r1, c1] (= -3/4)      (6/13) [r1, c2]
// [BẮT ĐẦU: -9/12 = -3/4] (-27/36) [r2, c1] (= -3/4)    (-27/36) [r2, c2] (= -3/4)

const mazeData = [
  [
    { text: '-16 / 25', val: -16/25, isTarget: false, isChest: false },
    { text: '-33 / 44', val: -33/44, isTarget: true, isChest: false },
    { text: '👑 RƯƠNG KHO BÁU', val: 0, isTarget: false, isChest: true }
  ],
  [
    { text: '-9 / 14', val: -9/14, isTarget: false, isChest: false },
    { text: '-15 / 20', val: -15/20, isTarget: true, isChest: false },
    { text: '6 / 13', val: 6/13, isTarget: false, isChest: false }
  ],
  [
    { text: '🚩 BẮT ĐẦU\n-9 / 12', val: -9/12, isTarget: true, isStart: true, isChest: false },
    { text: '-27 / 36', val: -27/36, isTarget: true, isChest: false },
    { text: '-27 / 36', val: -27/36, isTarget: true, isChest: false }
  ]
];

const mazeVisited = new Set(['2,0']);

function renderMaze() {
  const container = document.getElementById('treasure-maze-grid');
  if (!container) return;
  container.innerHTML = '';

  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const cellData = mazeData[r][c];
      const cell = document.createElement('div');
      cell.className = 'maze-cell';
      cell.id = `maze-${r}-${c}`;

      if (cellData.isStart) cell.classList.add('start');
      if (cellData.isChest) cell.classList.add('chest');
      if (mazeVisited.has(`${r},${c}`)) cell.classList.add('visited');

      cell.innerText = cellData.text;
      cell.onclick = () => handleMazeClick(r, c, cellData, cell);

      container.appendChild(cell);
    }
  }
}

function handleMazeClick(r, c, cellData, cellEl) {
  if (cellData.isStart) return;

  const statusEl = document.getElementById('maze-status');

  // Kiểm tra có kề với ít nhất 1 ô đã đi qua không
  let isAdjacent = false;
  const deltas = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  for (let [dr, dc] of deltas) {
    if (mazeVisited.has(`${r + dr},${c + dc}`)) {
      isAdjacent = true;
      break;
    }
  }

  if (!isAdjacent) {
    sound.playWrong();
    if (statusEl) statusEl.innerHTML = `<span style="color: #ef4444;">⚠️ Bạn chỉ được di chuyển sang các ô liền kề theo đường kẻ!</span>`;
    return;
  }

  if (cellData.isChest) {
    // Đến rương kho báu! Kiểm tra xem đã đến từ ô kề (-33/44) [0, 1] chưa
    if (mazeVisited.has('0,1') || mazeVisited.has('1,2') || mazeVisited.has('2,2')) {
      sound.playBadge();
      unlockBadge('badge-2');
      cellEl.classList.add('visited');
      if (statusEl) statusEl.innerHTML = `<span style="color: #16a34a; font-size: 1.2rem;">🎉 CHÚC MỪNG! Bạn đã đưa Việt đến Rương Kho Báu bằng con đường phân số bằng -3/4! Mở khóa Huy Hiệu Khám Phá!</span>`;
    }
    return;
  }

  if (cellData.isTarget) {
    sound.playCorrect();
    mazeVisited.add(`${r},${c}`);
    cellEl.classList.add('visited');
    if (statusEl) statusEl.innerHTML = `✨ <strong>Chính xác!</strong> ${cellData.text} = -3/4 (vì rút gọn chia cả tử và mẫu cho ước chung). Hãy tiếp tục tiến bước!`;
  } else {
    sound.playWrong();
    cellEl.classList.add('wrong-step');
    setTimeout(() => cellEl.classList.remove('wrong-step'), 600);
    if (statusEl) statusEl.innerHTML = `<span style="color: #ef4444;">❌ Ô này không bằng -3/4! Hãy tìm ô khác liền kề có phân số bằng -3/4 nhé.</span>`;
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
  const btnCalcFrac = document.getElementById('btn-calc-fraction');
  if (btnCalcFrac) {
    btnCalcFrac.onclick = runFractionLab;
  }
}

function resetGame() {
  sound.playClick();
  gameState.score = 0;
  gameState.stars = 0;
  gameState.streak = 0;
  gameState.answeredQuestions.clear();
  gameState.unlockedBadges.clear();
  mazeVisited.clear();
  mazeVisited.add('2,0');

  document.querySelectorAll('.badge-card').forEach(b => {
    b.classList.remove('unlocked');
    b.classList.add('locked');
  });

  renderQuiz();
  renderMaze();
  updateHUD();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', () => {
  renderQuiz();
  initEvents();
  updateHUD();
  renderMaze();
  runFractionLab();
});
