/* =========================================================
   ÔN TẬP CUỐI CHƯƠNG V: TÍNH ĐỐI XỨNG CỦA HÌNH PHẲNG - APP.JS
   Gamification Engine, Sound Synthesizer & Symmetry Labs
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
  studentName: 'Nghệ Sĩ Đối Xứng Lớp 6',
  avatar: '🦋',
  score: 0,
  stars: 0,
  streak: 0,
  answeredQuestions: new Set(),
  unlockedBadges: new Set()
};

// --- DANH SÁCH 10 CÂU HỎI ĐẤU TRƯỜNG SGK & TỔNG KẾT TẬP 1 ---
const quizData = [
  {
    id: 1,
    title: 'Bài 5.17a: Trục Đối Xứng Của Mũi Tên',
    question: 'Một hình mũi tên nằm ngang chỉ hướng sang phải. Hình mũi tên này có bao nhiêu trục đối xứng?',
    options: [
      { text: '1 trục đối xứng (nằm ngang)', correct: true },
      { text: '1 trục đối xứng (thẳng đứng)', correct: false },
      { text: '2 trục đối xứng', correct: false },
      { text: 'Không có trục đối xứng', correct: false }
    ],
    hint: 'Gấp đôi hình mũi tên theo đường thẳng nào thì nửa trên trùng khít với nửa dưới?',
    explanation: 'Hình mũi tên chỉ sang phải có 1 trục đối xứng duy nhất là đường thẳng nằm ngang đi qua chính giữa mũi tên.'
  },
  {
    id: 2,
    title: 'Bài 5.17b: Trục Đối Xứng Của Ngôi Sao 8 Cánh',
    question: 'Một hình ngôi sao 8 cánh đều đặn được vẽ trên mặt phẳng. Hỏi hình này có tất cả bao nhiêu trục đối xứng?',
    options: [
      { text: '4 trục', correct: false },
      { text: '8 trục đối xứng', correct: true },
      { text: '16 trục', correct: false },
      { text: '2 trục', correct: false }
    ],
    hint: 'Gồm 4 trục đi qua 4 cặp đỉnh đối diện và 4 trục đi qua 4 cặp hõm lõm đối diện.',
    explanation: 'Ngôi sao 8 cánh đều có 4 trục nối các đỉnh đối diện và 4 trục nối các góc lõm đối diện. Tổng cộng có 4 + 4 = 8 trục đối xứng.'
  },
  {
    id: 3,
    title: 'Bài 5.18a: Tâm Đối Xứng Của Chong Chóng 3 Cánh',
    question: 'Một chiếc chong chóng có 3 cánh đều nhau quanh trục quay O. Hỏi chiếc chong chóng 3 cánh có tâm đối xứng không?',
    options: [
      { text: 'Không có tâm đối xứng', correct: true },
      { text: 'Có tâm đối xứng tại điểm O', correct: false },
      { text: 'Có 3 tâm đối xứng', correct: false },
      { text: 'Không xác định được', correct: false }
    ],
    hint: 'Khi quay 180° quanh điểm O, cánh ở vị trí 12h sẽ quay xuống vị trí 6h (nơi không có cánh nào).',
    explanation: 'Khi quay chong chóng 3 cánh 180° quanh tâm O, các cánh không trùng khít với vị trí ban đầu. Do đó, chong chóng 3 cánh KHÔNG có tâm đối xứng.'
  },
  {
    id: 4,
    title: 'Bài 5.18b: Tâm Đối Xứng Của Chong Chóng 4 Cánh',
    question: 'Một chiếc chong chóng có 4 cánh đều nhau quanh trục quay O. Hỏi chiếc chong chóng này có tâm đối xứng không?',
    options: [
      { text: 'Có tâm đối xứng tại trục quay O', correct: true },
      { text: 'Không có tâm đối xứng', correct: false },
      { text: 'Chỉ có trục đối xứng', correct: false },
      { text: 'Có 4 tâm đối xứng', correct: false }
    ],
    hint: 'Mỗi cặp cánh đối diện nhau qua O tạo thành đoạn thẳng có trung điểm là O.',
    explanation: 'Khi quay chong chóng 4 cánh nửa vòng (180°) quanh điểm O, hình chong chóng hoàn toàn trùng khít với chính nó. Do đó, điểm O là tâm đối xứng của chong chóng 4 cánh.'
  },
  {
    id: 5,
    title: 'Bài 5.18c: Tâm Đối Xứng Của Các Chữ Cái',
    question: 'Trong các chữ cái in hoa sau: H, N, M, S, chữ cái nào KHÔNG có tâm đối xứng?',
    options: [
      { text: 'Chữ M', correct: true },
      { text: 'Chữ H', correct: false },
      { text: 'Chữ N', correct: false },
      { text: 'Chữ S', correct: false }
    ],
    hint: 'Quay chữ M ngược 180° ta được chữ W (không trùng với chữ M). Còn H, N, S khi quay 180° vẫn giữ nguyên dạng.',
    explanation: 'Chữ M chỉ có trục đối xứng thẳng đứng, khi xoay 180° trở thành chữ W nên không có tâm đối xứng. Các chữ H, N, S đều có tâm đối xứng.'
  },
  {
    id: 6,
    title: 'Bài 5.19: Tính Chất Điểm Đối Xứng Trục',
    question: 'Cho điểm A nằm bên trái trục đối xứng d và cách d một khoảng 4 cm. Điểm A\' đối xứng với A qua d sẽ:',
    options: [
      { text: 'Nằm bên phải trục d, cách d đúng 4 cm và đoạn AA\' vuông góc với d', correct: true },
      { text: 'Nằm bên phải trục d, cách d 8 cm', correct: false },
      { text: 'Nằm cùng phía với A', correct: false },
      { text: 'Nằm trên đường thẳng d', correct: false }
    ],
    hint: 'Đường thẳng d là đường trung trực của đoạn thẳng nối hai điểm đối xứng AA\'.',
    explanation: 'Hai điểm đối xứng nhau qua trục d thì d là đường trung trực của đoạn thẳng nối hai điểm đó. Vậy A\' nằm bên phải trục d, cách d 4 cm và AA\' ⊥ d.'
  },
  {
    id: 7,
    title: 'Tổng Hợp: Hình Vừa Có Trục Vừa Có Tâm Đối Xứng',
    question: 'Trong các hình phẳng sau, hình nào VỪA CÓ trục đối xứng VỪA CÓ tâm đối xứng?',
    options: [
      { text: 'Hình vuông', correct: true },
      { text: 'Tam giác đều', correct: false },
      { text: 'Hình thang cân', correct: false },
      { text: 'Hình bình hành', correct: false }
    ],
    hint: 'Hình vuông có 4 trục đối xứng và tâm là giao điểm hai đường chéo.',
    explanation: 'Tam giác đều và hình thang cân có trục đối xứng nhưng không có tâm đối xứng. Hình bình hành có tâm đối xứng nhưng không có trục đối xứng. Chỉ có hình vuông vừa có 4 trục đối xứng vừa có 1 tâm đối xứng.'
  },
  {
    id: 8,
    title: 'Tổng Hợp: Đối Xứng Của Tam Giác Đều',
    question: 'Hình tam giác đều có bao nhiêu trục đối xứng và bao nhiêu tâm đối xứng?',
    options: [
      { text: '3 trục đối xứng, 0 tâm đối xứng', correct: true },
      { text: '3 trục đối xứng, 1 tâm đối xứng', correct: false },
      { text: '1 trục đối xứng, 1 tâm đối xứng', correct: false },
      { text: '0 trục đối xứng, 1 tâm đối xứng', correct: false }
    ],
    hint: 'Tam giác đều có 3 đường cao là 3 trục đối xứng; nhưng khi xoay 180° tam giác bị lộn ngược đỉnh.',
    explanation: 'Tam giác đều có 3 trục đối xứng là các đường trung trực của 3 cạnh. Tuy nhiên tam giác đều không có tâm đối xứng.'
  },
  {
    id: 9,
    title: 'Tổng Hợp: Đối Xứng Của Hình Bình Hành',
    question: 'Một hình bình hành thông thường (không phải hình chữ nhật, hình thoi) có tính chất đối xứng nào sau đây?',
    options: [
      { text: 'Có 1 tâm đối xứng, không có trục đối xứng', correct: true },
      { text: 'Có 2 trục đối xứng, 1 tâm đối xứng', correct: false },
      { text: 'Có 1 trục đối xứng, không có tâm đối xứng', correct: false },
      { text: 'Không có tâm và không có trục đối xứng', correct: false }
    ],
    hint: 'Giao điểm hai đường chéo là tâm đối xứng của hình bình hành.',
    explanation: 'Hình bình hành tổng quát có tâm đối xứng là giao điểm của hai đường chéo, nhưng không có trục đối xứng nào.'
  },
  {
    id: 10,
    title: 'Tổng Kết Tập 1: Hình Ảnh Đối Xứng Hoàn Mỹ Tự Nhiên',
    question: 'Hình ảnh nào trong tự nhiên và cuộc sống thể hiện tính đối xứng hoàn mỹ (vừa có nhiều trục đối xứng, vừa có tâm đối xứng)?',
    options: [
      { text: 'Bông hoa tuyết 6 cánh', correct: true },
      { text: 'Chiếc lá cây phong', correct: false },
      { text: 'Con cua biển', correct: false },
      { text: 'Quả tim tình yêu', correct: false }
    ],
    hint: 'Lá cây phong, con cua, hình quả tim chỉ có 1 trục đối xứng dọc, không có tâm đối xứng.',
    explanation: 'Bông hoa tuyết 6 cánh có cấu trúc lục giác đều, sở hữu tới 6 trục đối xứng và 1 tâm đối xứng hoàn hảo tại tâm bông tuyết.'
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

    // Mở khóa danh hiệu chuyên gia
    if (qId === 7 || qId === 8 || qId === 9) unlockBadge('badge-3');

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

  // Hoàn thành toàn khóa
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

  let rank = 'Tập Sự Đối Xứng';
  if (gameState.stars >= 4 && gameState.stars < 8) rank = 'Họa Sĩ Cân Xứng';
  else if (gameState.stars >= 8 && gameState.stars < 10) rank = 'Bậc Thầy Không Gian';
  else if (gameState.stars === 10) rank = 'Đại Kiện Tướng Toàn Khóa Toán 6 Tập 1';

  document.getElementById('hud-rank-display').textContent = rank;

  // Cập nhật giấy chứng nhận tốt nghiệp
  document.getElementById('cert-name').textContent = gameState.studentName;
  document.getElementById('cert-score').textContent = gameState.score;
  document.getElementById('cert-stars').textContent = gameState.stars;
  document.getElementById('cert-rank').textContent = rank;

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  document.getElementById('cert-date').textContent = dateStr;
}

// --- THÍ NGHIỆM 1: GƯƠNG ĐỐI XỨNG (BT 5.19 & 5.20) ---
let currentMirrorShape = 'smile';
let isMirrorActive = false;

function setMirrorShape(shape) {
  currentMirrorShape = shape;
  sound.playClick();
  unlockBadge('badge-1');

  document.querySelectorAll('#btn-mirror-smile, #btn-mirror-leaf, #btn-mirror-arrow')
    .forEach(btn => btn.classList.remove('active'));

  const activeMap = {
    'smile': 'btn-mirror-smile',
    'leaf': 'btn-mirror-leaf',
    'arrow': 'btn-mirror-arrow'
  };
  const activeBtn = document.getElementById(activeMap[shape]);
  if (activeBtn) activeBtn.classList.add('active');

  renderMirrorSVG();
}

function toggleMirror() {
  sound.playClick();
  unlockBadge('badge-1');
  isMirrorActive = !isMirrorActive;
  renderMirrorSVG();
}

function renderMirrorSVG() {
  const svg = document.getElementById('mirror-svg-canvas');
  const infoEl = document.getElementById('mirror-info');
  if (!svg || !infoEl) return;

  svg.setAttribute('viewBox', '0 0 400 240');

  if (currentMirrorShape === 'smile') {
    // Face radius 80 centered at (200, 120)
    // Left half: x <= 200.
    const mirrorContent = isMirrorActive ? `
      <!-- Right Half Mirrored -->
      <path d="M 200,40 A 80,80 0 0,1 200,200" fill="#fef08a" stroke="#ca8a04" stroke-width="3" />
      <circle cx="235" cy="100" r="8" fill="#854d0e" />
      <path d="M 200,150 Q 225,180 250,140" fill="none" stroke="#854d0e" stroke-width="4" stroke-linecap="round" />
    ` : '';

    svg.innerHTML = `
      <!-- Grid Background -->
      <defs>
        <pattern id="grid-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="1" />
        </pattern>
      </defs>
      <rect width="400" height="240" fill="url(#grid-pattern)" />

      <!-- Left Half Face -->
      <path d="M 200,40 A 80,80 0 0,0 200,200 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="3" />
      <circle cx="165" cy="100" r="8" fill="#854d0e" />
      <path d="M 200,150 Q 175,180 150,140" fill="none" stroke="#854d0e" stroke-width="4" stroke-linecap="round" />

      ${mirrorContent}

      <!-- Trục đối xứng d -->
      <line x1="200" y1="10" x2="200" y2="230" stroke="#8b5cf6" stroke-width="3" stroke-dasharray="6,4" />
      <text x="210" y="30" font-size="14" font-weight="bold" fill="#7c3aed">Trục d</text>
    `;

    infoEl.innerHTML = isMirrorActive
      ? `🙂 <strong>Mặt Cười Hoàn Hảo:</strong> Nửa mặt phải đã được phản chiếu hoàn toàn trùng khớp qua trục thẳng đứng d!`
      : `🙂 <strong>BT 5.19:</strong> Bấm nút tím phía trên để kích hoạt gương phản chiếu hoàn thiện nửa mặt cười!`;
  } else if (currentMirrorShape === 'leaf') {
    // Leaf along axis x = 200
    const mirrorContent = isMirrorActive ? `
      <!-- Right Half Leaf -->
      <path d="M 200,30 Q 300,90 280,170 Q 240,210 200,210 Z" fill="#86efac" stroke="#16a34a" stroke-width="3" />
      <line x1="200" y1="90" x2="250" y2="70" stroke="#16a34a" stroke-width="2" />
      <line x1="200" y1="130" x2="260" y2="120" stroke="#16a34a" stroke-width="2" />
      <line x1="200" y1="170" x2="240" y2="175" stroke="#16a34a" stroke-width="2" />
    ` : '';

    svg.innerHTML = `
      <defs>
        <pattern id="grid-pattern-leaf" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="1" />
        </pattern>
      </defs>
      <rect width="400" height="240" fill="url(#grid-pattern-leaf)" />

      <!-- Left Half Leaf -->
      <path d="M 200,30 Q 100,90 120,170 Q 160,210 200,210 Z" fill="#86efac" stroke="#16a34a" stroke-width="3" />
      <line x1="200" y1="90" x2="150" y2="70" stroke="#16a34a" stroke-width="2" />
      <line x1="200" y1="130" x2="140" y2="120" stroke="#16a34a" stroke-width="2" />
      <line x1="200" y1="170" x2="160" y2="175" stroke="#16a34a" stroke-width="2" />

      ${mirrorContent}

      <!-- Cuống lá -->
      <line x1="200" y1="210" x2="200" y2="235" stroke="#15803d" stroke-width="4" stroke-linecap="round" />

      <!-- Trục đối xứng d (Gân chính của lá) -->
      <line x1="200" y1="10" x2="200" y2="230" stroke="#8b5cf6" stroke-width="3" stroke-dasharray="6,4" />
      <text x="210" y="30" font-size="14" font-weight="bold" fill="#7c3aed">Trục d (gân chính)</text>
    `;

    infoEl.innerHTML = isMirrorActive
      ? `🍃 <strong>Chiếc Lá Hoàn Chỉnh:</strong> Gân chính của lá đóng vai trò là trục đối xứng d trong thế giới tự nhiên!`
      : `🍃 <strong>BT 5.20:</strong> Bấm nút tím để hoàn thiện nửa chiếc lá đối xứng qua gân chính!`;
  } else if (currentMirrorShape === 'arrow') {
    // Horizontal axis y = 120
    const mirrorContent = isMirrorActive ? `
      <!-- Bottom Half Arrow -->
      <polygon points="100,120 100,150 240,150 240,190 320,120" fill="#a7f3d0" stroke="#059669" stroke-width="3" />
    ` : '';

    svg.innerHTML = `
      <defs>
        <pattern id="grid-pattern-arrow" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#e2e8f0" stroke-width="1" />
        </pattern>
      </defs>
      <rect width="400" height="240" fill="url(#grid-pattern-arrow)" />

      <!-- Top Half Arrow -->
      <polygon points="100,120 100,90 240,90 240,50 320,120" fill="#a7f3d0" stroke="#059669" stroke-width="3" />

      ${mirrorContent}

      <!-- Trục đối xứng ngang d -->
      <line x1="20" y1="120" x2="380" y2="120" stroke="#8b5cf6" stroke-width="3" stroke-dasharray="6,4" />
      <text x="30" y="110" font-size="14" font-weight="bold" fill="#7c3aed">Trục đối xứng ngang d</text>
    `;

    infoEl.innerHTML = isMirrorActive
      ? `➡️ <strong>Mũi Tên Hoàn Chỉnh:</strong> Mũi tên chỉ ngang có 1 trục đối xứng nằm ngang đi qua đỉnh nhọn!`
      : `➡️ <strong>BT 5.17a:</strong> Bấm nút tím để phản chiếu nửa dưới mũi tên qua trục ngang d!`;
  }
}

// --- THÍ NGHIỆM 2: MÁY XOAY 180° (ROTATIONAL LAB - BT 5.18) ---
let currentRotateObject = 'pinwheel4';
let currentAngle = 0;

function setRotateObject(obj) {
  currentRotateObject = obj;
  currentAngle = 0;
  sound.playClick();
  unlockBadge('badge-2');

  document.querySelectorAll('#btn-pinwheel-4, #btn-pinwheel-3, #btn-letter-s, #btn-letter-m')
    .forEach(btn => btn.classList.remove('active'));

  const activeMap = {
    'pinwheel4': 'btn-pinwheel-4',
    'pinwheel3': 'btn-pinwheel-3',
    'letterS': 'btn-letter-s',
    'letterM': 'btn-letter-m'
  };
  const activeBtn = document.getElementById(activeMap[obj]);
  if (activeBtn) activeBtn.classList.add('active');

  renderRotateSVG();
}

function rotate180() {
  sound.playClick();
  unlockBadge('badge-2');
  currentAngle = (currentAngle === 0) ? 180 : 0;
  renderRotateSVG();
}

function renderRotateSVG() {
  const svg = document.getElementById('rotate-svg-canvas');
  const infoEl = document.getElementById('rotate-info');
  if (!svg || !infoEl) return;

  svg.setAttribute('viewBox', '0 0 400 240');

  let innerShape = '';
  let statusText = '';

  if (currentRotateObject === 'pinwheel4') {
    innerShape = `
      <!-- Chong chóng 4 cánh: 4 cánh lệch 90 độ -->
      <g transform="translate(200, 120) rotate(${currentAngle}) translate(-200, -120)" class="rotating-180">
        <!-- Cánh 1 (Lên) -->
        <path d="M 200,120 L 200,40 L 240,80 Z" fill="#ec4899" opacity="0.85" />
        <!-- Cánh 2 (Phải) -->
        <path d="M 200,120 L 280,120 L 240,160 Z" fill="#8b5cf6" opacity="0.85" />
        <!-- Cánh 3 (Xuống) -->
        <path d="M 200,120 L 200,200 L 160,160 Z" fill="#ec4899" opacity="0.85" />
        <!-- Cánh 4 (Trái) -->
        <path d="M 200,120 L 120,120 L 160,80 Z" fill="#8b5cf6" opacity="0.85" />
        <circle cx="200" cy="120" r="10" fill="#0f172a" />
        <circle cx="200" cy="120" r="4" fill="#ffffff" />
      </g>
    `;
    statusText = (currentAngle === 180)
      ? `🌀 <strong>CÓ TÂM ĐỐI XỨNG:</strong> Sau khi xoay 180°, chong chóng 4 cánh tự trùng khít hoàn toàn với hình ban đầu!`
      : `🌀 <strong>BT 5.18b:</strong> Nhấn "Xoay 180°" màu hồng để kiểm tra tính đối xứng tâm của chong chóng 4 cánh.`;
  } else if (currentRotateObject === 'pinwheel3') {
    innerShape = `
      <!-- Chong chóng 3 cánh: 3 cánh lệch 120 độ -->
      <g transform="translate(200, 120) rotate(${currentAngle}) translate(-200, -120)" class="rotating-180">
        <!-- Cánh 1 (0 độ: lên) -->
        <path d="M 200,120 L 200,40 L 235,75 Z" fill="#10b981" opacity="0.9" />
        <!-- Cánh 2 (120 độ: dưới phải) -->
        <g transform="translate(200, 120) rotate(120) translate(-200, -120)">
          <path d="M 200,120 L 200,40 L 235,75 Z" fill="#06b6d4" opacity="0.9" />
        </g>
        <!-- Cánh 3 (240 độ: dưới trái) -->
        <g transform="translate(200, 120) rotate(240) translate(-200, -120)">
          <path d="M 200,120 L 200,40 L 235,75 Z" fill="#3b82f6" opacity="0.9" />
        </g>
        <circle cx="200" cy="120" r="10" fill="#0f172a" />
        <circle cx="200" cy="120" r="4" fill="#ffffff" />
      </g>
      <!-- Bóng mờ ban đầu để so sánh khi xoay 180 độ -->
      ${currentAngle === 180 ? '<text x="200" y="230" text-anchor="middle" font-size="13" font-weight="bold" fill="#ef4444">⚠️ Cánh trên đã bị lộn ngược xuống dưới, không trùng khít!</text>' : ''}
    `;
    statusText = (currentAngle === 180)
      ? `☘️ <strong>KHÔNG CÓ TÂM ĐỐI XỨNG:</strong> Sau khi xoay 180°, cánh trên chúc xuống dưới, hình bị đảo ngược hoàn toàn!`
      : `☘️ <strong>BT 5.18a:</strong> Nhấn "Xoay 180°" để xem chong chóng 3 cánh có trùng với chính nó không.`;
  } else if (currentRotateObject === 'letterS') {
    innerShape = `
      <g transform="translate(200, 120) rotate(${currentAngle}) translate(-200, -120)" class="rotating-180">
        <text x="200" y="165" font-size="130" font-family="Arial, sans-serif" font-weight="900" fill="#8b5cf6" text-anchor="middle">S</text>
        <circle cx="200" cy="120" r="6" fill="#ec4899" />
      </g>
    `;
    statusText = (currentAngle === 180)
      ? `🔤 <strong>CHỮ S CÓ TÂM ĐỐI XỨNG:</strong> Quay 180° quanh điểm tâm màu hồng, chữ S vẫn giữ nguyên dạng chuẩn xác!`
      : `🔤 Nhấn "Xoay 180°" để kiểm tra tâm đối xứng của chữ cái S.`;
  } else if (currentRotateObject === 'letterM') {
    innerShape = `
      <g transform="translate(200, 120) rotate(${currentAngle}) translate(-200, -120)" class="rotating-180">
        <text x="200" y="165" font-size="130" font-family="Arial, sans-serif" font-weight="900" fill="#0284c7" text-anchor="middle">M</text>
        <circle cx="200" cy="120" r="6" fill="#ec4899" />
      </g>
      ${currentAngle === 180 ? '<text x="200" y="230" text-anchor="middle" font-size="14" font-weight="bold" fill="#ef4444">⚠️ Chữ M xoay 180° biến thành chữ W ⇒ Không có tâm đối xứng!</text>' : ''}
    `;
    statusText = (currentAngle === 180)
      ? `🔤 <strong>CHỮ M KHÔNG CÓ TÂM ĐỐI XỨNG:</strong> Chữ M xoay 180° biến thành chữ W!`
      : `🔤 Nhấn "Xoay 180°" để kiểm tra tâm đối xứng của chữ cái M.`;
  }

  svg.innerHTML = `
    <!-- Center Guides -->
    <line x1="200" y1="20" x2="200" y2="220" stroke="#f1f5f9" stroke-width="2" />
    <line x1="50" y1="120" x2="350" y2="120" stroke="#f1f5f9" stroke-width="2" />
    ${innerShape}
  `;

  infoEl.innerHTML = statusText;
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

  // Nút Lab 1 (Gương đối xứng)
  document.getElementById('btn-mirror-smile').onclick = () => setMirrorShape('smile');
  document.getElementById('btn-mirror-leaf').onclick = () => setMirrorShape('leaf');
  document.getElementById('btn-mirror-arrow').onclick = () => setMirrorShape('arrow');
  document.getElementById('btn-toggle-mirror').onclick = toggleMirror;

  // Nút Lab 2 (Xoay 180 độ)
  document.getElementById('btn-pinwheel-4').onclick = () => setRotateObject('pinwheel4');
  document.getElementById('btn-pinwheel-3').onclick = () => setRotateObject('pinwheel3');
  document.getElementById('btn-letter-s').onclick = () => setRotateObject('letterS');
  document.getElementById('btn-letter-m').onclick = () => setRotateObject('letterM');
  document.getElementById('btn-rotate-180').onclick = rotate180;
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
  renderMirrorSVG();
  renderRotateSVG();
});
