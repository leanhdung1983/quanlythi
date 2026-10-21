/* =========================================================
   ÔN TẬP CUỐI CHƯƠNG IV: HÌNH PHẲNG TRONG THỰC TIỄN - APP.JS
   Gamification Engine, Sound Synthesizer & Geometry Canvas Labs
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
  studentName: 'Kiến Trúc Sư Nhí Lớp 6',
  avatar: '📐',
  score: 0,
  stars: 0,
  streak: 0,
  answeredQuestions: new Set(),
  unlockedBadges: new Set()
};

// --- DANH SÁCH 10 CÂU HỎI ĐẤU TRƯỜNG SGK (BÀI 4.28 – 4.36) ---
const quizData = [
  {
    id: 1,
    title: 'Bài 4.28: Đếm Số Hình Vuông Lưới 2x2',
    question: 'Có bao nhiêu hình vuông trong hình gồm lưới 4 ô vuông nhỏ kích thước 1x1 ghép lại thành hình vuông lớn 2x2?',
    options: [
      { text: '4 hình vuông', correct: false },
      { text: '5 hình vuông', correct: true },
      { text: '6 hình vuông', correct: false },
      { text: '8 hình vuông', correct: false }
    ],
    hint: 'Nhớ tính cả 4 ô vuông nhỏ 1x1 và 1 ô vuông bao bên ngoài 2x2.',
    explanation: 'Có 4 hình vuông nhỏ cạnh 1 đơn vị và 1 hình vuông lớn bao quanh cạnh 2 đơn vị. Tổng cộng có 4 + 1 = 5 hình vuông.'
  },
  {
    id: 2,
    title: 'Bài 4.29a: Đếm Số Tam Giác Đều',
    question: 'Một hình tam giác đều lớn được chia thành 4 hình tam giác đều nhỏ bằng nhau. Trong hình có tất cả bao nhiêu hình tam giác đều?',
    options: [
      { text: '4 hình', correct: false },
      { text: '5 hình', correct: true },
      { text: '6 hình', correct: false },
      { text: '3 hình', correct: false }
    ],
    hint: 'Gồm 4 hình tam giác đều nhỏ và 1 hình tam giác đều lớn ban đầu.',
    explanation: 'Có 4 tam giác đều nhỏ bên trong và 1 tam giác đều lớn bao quanh. Tổng cộng là 4 + 1 = 5 tam giác đều.'
  },
  {
    id: 3,
    title: 'Bài 4.29b: Đếm Số Hình Thang Cân',
    question: 'Cũng trong tam giác đều lớn chia thành 4 tam giác đều nhỏ, có tất cả bao nhiêu hình thang cân?',
    options: [
      { text: '2 hình', correct: false },
      { text: '3 hình', correct: true },
      { text: '4 hình', correct: false },
      { text: '6 hình', correct: false }
    ],
    hint: 'Mỗi khi che đi 1 tam giác nhỏ ở một trong 3 góc đỉnh, phần còn lại là 1 hình thang cân.',
    explanation: 'Tam giác đều lớn có 3 đỉnh. Khi bỏ đi 1 tam giác nhỏ ở bất kỳ góc nào, 3 tam giác nhỏ còn lại ghép thành một hình thang cân. Vì có 3 đỉnh nên có tất cả 3 hình thang cân.'
  },
  {
    id: 4,
    title: 'Bài 4.29c: Đếm Số Hình Thoi',
    question: 'Cũng trong hình tam giác trên, có tất cả bao nhiêu hình thoi?',
    options: [
      { text: '2 hình', correct: false },
      { text: '3 hình', correct: true },
      { text: '4 hình', correct: false },
      { text: '5 hình', correct: false }
    ],
    hint: 'Hai tam giác đều nhỏ úp vào nhau chung 1 cạnh tạo thành 1 hình thoi.',
    explanation: 'Tam giác nhỏ ở chính giữa có 3 cạnh chung với 3 tam giác nhỏ ở 3 góc. Ghép tam giác giữa với mỗi tam giác góc ta được 1 hình thoi. Vậy có tất cả 3 hình thoi.'
  },
  {
    id: 5,
    title: 'Bài 4.32: Chu Vi & Diện Tích Hình Chữ Nhật',
    question: 'Một mảnh vườn hình chữ nhật có chiều dài 6 m và chiều rộng 5 m. Chu vi và diện tích của mảnh vườn lần lượt là:',
    options: [
      { text: 'C = 22 m ; S = 30 m²', correct: true },
      { text: 'C = 11 m ; S = 30 m²', correct: false },
      { text: 'C = 22 m ; S = 60 m²', correct: false },
      { text: 'C = 30 m ; S = 22 m²', correct: false }
    ],
    hint: 'Chu vi C = (dài + rộng) · 2; Diện tích S = dài · rộng.',
    explanation: 'Chu vi C = (6 + 5) · 2 = 22 m. Diện tích S = 6 · 5 = 30 m².'
  },
  {
    id: 6,
    title: 'Bài 4.33a: Diện Tích Hình Thoi Trong Lục Giác Đều',
    question: 'Cho hình lục giác đều ABCDEF tâm O. Biết OA = 6 cm và đường chéo BF = 10,4 cm. Diện tích của hình thoi ABOF là:',
    options: [
      { text: '31,2 cm²', correct: true },
      { text: '62,4 cm²', correct: false },
      { text: '15,6 cm²', correct: false },
      { text: '36 cm²', correct: false }
    ],
    hint: 'Hình thoi ABOF có hai đường chéo là OA và BF. Diện tích S = (1/2) · OA · BF.',
    explanation: 'Diện tích hình thoi ABOF bằng một nửa tích hai đường chéo: S = (1/2) · 6 · 10,4 = 31,2 cm².'
  },
  {
    id: 7,
    title: 'Bài 4.33b: Diện Tích Toàn Bộ Hình Lục Giác Đều',
    question: 'Từ kết quả của hình thoi ABOF ở câu trên, diện tích của cả hình lục giác đều ABCDEF là:',
    options: [
      { text: '93,6 cm²', correct: true },
      { text: '62,4 cm²', correct: false },
      { text: '187,2 cm²', correct: false },
      { text: '124,8 cm²', correct: false }
    ],
    hint: 'Hình lục giác đều ABCDEF được ghép bởi 3 hình thoi bằng nhau có chung đỉnh O.',
    explanation: 'Lục giác đều ABCDEF ghép bởi 3 hình thoi bằng ABOF: S = 3 · 31,2 = 93,6 cm².'
  },
  {
    id: 8,
    title: 'Bài 4.36a: Diện Tích Hiên Nhà Hình Thang Cân',
    question: 'Bác Hưng làm một cái hiên nhà hình thang cân có hai đáy lần lượt là 54 dm và 72 dm, chiều cao là 45 dm. Diện tích hiên nhà là:',
    options: [
      { text: '2835 dm²', correct: true },
      { text: '5670 dm²', correct: false },
      { text: '2835 m²', correct: false },
      { text: '1417,5 dm²', correct: false }
    ],
    hint: 'Diện tích hình thang S = [(đáy lớn + đáy bé) · chiều cao] / 2.',
    explanation: 'Diện tích hiên nhà là: S = [(54 + 72) · 45] / 2 = (126 · 45) / 2 = 63 · 45 = 2835 dm² (tương đương 28,35 m²).'
  },
  {
    id: 9,
    title: 'Bài 4.36b: Tính Số Gạch Lát Hiên Nhà',
    question: 'Bác Hưng lát toàn bộ diện tích hiên nhà 2835 dm² bằng loại gạch vuông có diện tích 9 dm²/viên. Bác cần mua bao nhiêu viên gạch?',
    options: [
      { text: '315 viên', correct: true },
      { text: '3150 viên', correct: false },
      { text: '270 viên', correct: false },
      { text: '630 viên', correct: false }
    ],
    hint: 'Số viên gạch = Tổng diện tích chia cho diện tích một viên gạch.',
    explanation: 'Số viên gạch bác Hưng cần mua là: 2835 : 9 = 315 viên gạch.'
  },
  {
    id: 10,
    title: 'Bài 4.35: Cắt Ghép Hình Chữ Nhật Thành Hình Vuông',
    question: 'Một tấm bìa hình chữ nhật có kích thước dài 8 cm, rộng 2 cm. Muốn cắt ghép thành một hình vuông có diện tích bằng diện tích tấm bìa thì hình vuông đó có cạnh là bao nhiêu?',
    options: [
      { text: '4 cm', correct: true },
      { text: '5 cm', correct: false },
      { text: '6 cm', correct: false },
      { text: '8 cm', correct: false }
    ],
    hint: 'Diện tích tấm bìa = 8 · 2 = 16 cm². Hình vuông có diện tích 16 cm² thì cạnh là số nào?',
    explanation: 'Diện tích hình chữ nhật là S = 8 · 2 = 16 cm². Do diện tích hình vuông bằng diện tích hình chữ nhật nên cạnh hình vuông a thỏa mãn a² = 16 ⇒ a = 4 cm.'
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

    // Khen thưởng chuyên gia hình lục giác & hiên nhà
    if (qId === 6 || qId === 7) unlockBadge('badge-3');
    if (qId === 8 || qId === 9) unlockBadge('badge-2');

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

  let rank = 'Tập Sự Hình Học';
  if (gameState.stars >= 4 && gameState.stars < 8) rank = 'Họa Viên Kiến Trúc';
  else if (gameState.stars >= 8 && gameState.stars < 10) rank = 'Kỹ Sư Hình Phẳng';
  else if (gameState.stars === 10) rank = 'Đại Kiện Tướng Hình Học Phẳng';

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

// --- THÍ NGHIỆM 1: MÁY THÁM TỬ ĐẾM HÌNH (SVG DYNAMIC) ---
let currentDetectMode = 'triangles';

function setDetectMode(mode) {
  currentDetectMode = mode;
  sound.playClick();
  unlockBadge('badge-1');

  document.querySelectorAll('#btn-show-triangles, #btn-show-trapezoids, #btn-show-rhombus, #btn-show-grid-squares')
    .forEach(btn => btn.classList.remove('active'));

  const activeBtnMap = {
    'triangles': 'btn-show-triangles',
    'trapezoids': 'btn-show-trapezoids',
    'rhombus': 'btn-show-rhombus',
    'grid': 'btn-show-grid-squares'
  };
  const activeBtn = document.getElementById(activeBtnMap[mode]);
  if (activeBtn) activeBtn.classList.add('active');

  renderDetectSVG();
}

function renderDetectSVG() {
  const svg = document.getElementById('lab-svg-canvas');
  const infoEl = document.getElementById('shape-detect-info');
  if (!svg || !infoEl) return;

  if (currentDetectMode === 'grid') {
    // Render 2x2 grid
    svg.setAttribute('viewBox', '0 0 400 240');
    svg.innerHTML = `
      <!-- Grid 2x2: Box from (120, 20) to (280, 180), size 160x160 -->
      <rect x="120" y="20" width="160" height="160" fill="#f0fdf4" stroke="#0284c7" stroke-width="4" rx="4" />
      <line x1="200" y1="20" x2="200" y2="180" stroke="#0284c7" stroke-width="3" stroke-dasharray="4,4" />
      <line x1="120" y1="100" x2="280" y2="100" stroke="#0284c7" stroke-width="3" stroke-dasharray="4,4" />
      
      <!-- Labels -->
      <text x="160" y="65" font-size="16" font-weight="bold" fill="#0369a1" text-anchor="middle">Ô 1</text>
      <text x="240" y="65" font-size="16" font-weight="bold" fill="#0369a1" text-anchor="middle">Ô 2</text>
      <text x="160" y="145" font-size="16" font-weight="bold" fill="#0369a1" text-anchor="middle">Ô 3</text>
      <text x="240" y="145" font-size="16" font-weight="bold" fill="#0369a1" text-anchor="middle">Ô 4</text>
      
      <!-- Highlight box for outer square -->
      <rect x="115" y="15" width="170" height="170" fill="none" stroke="#f59e0b" stroke-width="3" stroke-dasharray="6,4" rx="6" />
      <text x="200" y="215" font-size="15" font-weight="bold" fill="#d97706" text-anchor="middle">Ô vuông lớn bao quanh (2x2)</text>
    `;
    infoEl.innerHTML = `⏹️ Kết quả BT 4.28: Có <strong>4 hình vuông nhỏ (1x1)</strong> + <strong>1 hình vuông lớn (2x2)</strong> = <span style="color:#059669; font-size:1.2rem;">5 hình vuông</span>!`;
  } else {
    // Equilateral Triangle divided into 4
    // Vertices: Top (200, 25), Bottom-Left (90, 215), Bottom-Right (310, 215)
    // Midpoints: Left-Mid (145, 120), Right-Mid (255, 120), Bottom-Mid (200, 215)
    let fillT1 = '#e0f2fe', fillT2 = '#bae6fd', fillT3 = '#bae6fd', fillT4 = '#7dd3fc';
    let strokeOuter = '#0284c7';
    let extraHighlights = '';

    if (currentDetectMode === 'triangles') {
      infoEl.innerHTML = `🔺 Kết quả BT 4.29a: Có <strong>4 tam giác nhỏ</strong> (Đỉnh, Trái, Phải, Giữa) + <strong>1 tam giác lớn bao quanh</strong> = <span style="color:#059669; font-size:1.2rem;">5 tam giác đều</span>!`;
    } else if (currentDetectMode === 'trapezoids') {
      fillT1 = '#f1f5f9'; // remove top
      fillT2 = '#fef3c7'; fillT3 = '#fef3c7'; fillT4 = '#fde68a';
      extraHighlights = `
        <polygon points="145,120 255,120 310,215 90,215" fill="rgba(245, 158, 11, 0.4)" stroke="#d97706" stroke-width="3" />
      `;
      infoEl.innerHTML = `📐 Kết quả BT 4.29b: Mỗi khi bỏ 1 góc đỉnh, 3 tam giác còn lại tạo thành 1 hình thang cân. Vì có 3 góc đỉnh nên có <span style="color:#059669; font-size:1.2rem;">3 hình thang cân</span>!`;
    } else if (currentDetectMode === 'rhombus') {
      fillT1 = '#e0e7ff'; fillT4 = '#c7d2fe';
      extraHighlights = `
        <polygon points="200,25 255,120 200,215 145,120" fill="rgba(99, 102, 241, 0.35)" stroke="#4f46e5" stroke-width="3" />
      `;
      infoEl.innerHTML = `💎 Kết quả BT 4.29c: Tam giác tâm úp ngược ghép với mỗi tam giác góc có cạnh chung tạo thành 1 hình thoi ⇒ Có <span style="color:#059669; font-size:1.2rem;">3 hình thoi</span>!`;
    }

    svg.setAttribute('viewBox', '0 0 400 240');
    svg.innerHTML = `
      <!-- T1 (Top) -->
      <polygon points="200,25 145,120 255,120" fill="${fillT1}" stroke="#0284c7" stroke-width="2" />
      <!-- T2 (Bottom-Left) -->
      <polygon points="145,120 90,215 200,215" fill="${fillT2}" stroke="#0284c7" stroke-width="2" />
      <!-- T3 (Bottom-Right) -->
      <polygon points="255,120 200,215 310,215" fill="${fillT3}" stroke="#0284c7" stroke-width="2" />
      <!-- T4 (Center Inverted) -->
      <polygon points="145,120 255,120 200,215" fill="${fillT4}" stroke="#0284c7" stroke-width="2" />
      
      <!-- Outer Border -->
      <polygon points="200,25 90,215 310,215" fill="none" stroke="${strokeOuter}" stroke-width="3.5" />
      
      ${extraHighlights}
      
      <circle cx="200" cy="25" r="4" fill="#0f172a" />
      <circle cx="90" cy="215" r="4" fill="#0f172a" />
      <circle cx="310" cy="215" r="4" fill="#0f172a" />
    `;
  }
}

// --- THÍ NGHIỆM 2: MÁY TÍNH HIÊN NHÀ & GẠCH LÁT (BT 4.36) ---
function updatePorchLab() {
  const a = parseInt(document.getElementById('slider-base-a').value) || 54;
  const b = parseInt(document.getElementById('slider-base-b').value) || 72;
  const h = parseInt(document.getElementById('slider-height-h').value) || 45;

  document.getElementById('val-base-a').textContent = `${a} dm`;
  document.getElementById('val-base-b').textContent = `${b} dm`;
  document.getElementById('val-height-h').textContent = `${h} dm`;

  const area = ((a + b) * h) / 2;
  const areaM2 = (area / 100).toFixed(2);
  const tiles = Math.ceil(area / 9);

  const outEl = document.getElementById('porch-calc-output');
  if (outEl) {
    outEl.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <div style="font-size: 1.15rem; color: #0284c7; font-weight: 800; margin-bottom: 6px;">
          🏡 Kết Quả Tính Toán Thiết Kế Hiên Nhà:
        </div>
        <p>• <strong>Diện tích hiên nhà hình thang cân:</strong></p>
        <p style="padding: 6px 12px; background: #f8fafc; border-radius: 6px; font-family: monospace; font-size: 1.05rem; border: 1px solid #e2e8f0;">
          S = [(${a} + ${b}) · ${h}] / 2 = (${a + b} · ${h}) / 2 = <strong style="color: #0369a1; font-size: 1.25rem;">${area} dm²</strong> (= ${areaM2} m²)
        </p>
        <p style="margin-top: 8px;">• <strong>Số lượng gạch men vuông (loại 9 dm²/viên) cần lát:</strong></p>
        <p style="padding: 6px 12px; background: #ecfdf5; border-radius: 6px; font-family: monospace; font-size: 1.05rem; border: 1px solid #a7f3d0; color: #065f46;">
          Số gạch = ${area} : 9 = <strong style="color: #059669; font-size: 1.25rem;">${tiles} viên gạch</strong>
        </p>
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
  document.getElementById('btn-show-triangles').onclick = () => setDetectMode('triangles');
  document.getElementById('btn-show-trapezoids').onclick = () => setDetectMode('trapezoids');
  document.getElementById('btn-show-rhombus').onclick = () => setDetectMode('rhombus');
  document.getElementById('btn-show-grid-squares').onclick = () => setDetectMode('grid');

  // Sliders Lab 2
  ['slider-base-a', 'slider-base-b', 'slider-height-h'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.addEventListener('input', () => {
        sound.playClick();
        updatePorchLab();
      });
    }
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
  renderDetectSVG();
  updatePorchLab();
});
