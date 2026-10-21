// App Logic for Hoạt động thực hành trải nghiệm 4: Hình học không gian & đo đạc thực tế - Toán 11 KNTT

// --- State Management ---
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Kiến Trúc Sư Không Gian 3D',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// --- Web Audio API Synthesizer ---
class SoundSynth {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playClick() {
    if (!appState.sound) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }
  playCorrect() {
    if (!appState.sound) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc1 = this.ctx.createOscillator();
    const osc2 = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc1.type = 'triangle';
    osc2.type = 'triangle';
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.setValueAtTime(659.25, now + 0.08);
    osc2.frequency.setValueAtTime(783.99, now + 0.16);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.35);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this.ctx.destination);
    osc1.start(now);
    osc2.start(now + 0.16);
    osc1.stop(now + 0.35);
    osc2.stop(now + 0.35);
  }
  playWrong() {
    if (!appState.sound) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(110, now + 0.25);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }
  playFanfare() {
    if (!appState.sound) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const st = this.ctx.currentTime + idx * 0.12;
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, st);
      gain.gain.setValueAtTime(0.2, st);
      gain.gain.linearRampToValueAtTime(0.01, st + 0.3);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(st);
      osc.stop(st + 0.3);
    });
  }
}
const audio = new SoundSynth();

// --- Math Rendering Engine ---
function renderMathInTree(root) {
  if (window.renderMathInElement) {
    window.renderMathInElement(root, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false,
      strict: false
    });
  }
}

// --- Quiz Data (10 Bài toán Hình học Không gian & Đo đạc Thực tế) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1: Diện tích toàn phần khối lập phương',
    pts: 20,
    question: 'Một hộp quà hình lập phương có cạnh $a = 15\\text{ cm}$. Diện tích giấy tối thiểu cần để bao bọc kín toàn bộ hộp quà (diện tích toàn phần) là:',
    options: [
      { text: '$S_{tp} = 1350\\text{ cm}^2$', correct: true },
      { text: '$S_{tp} = 900\\text{ cm}^2$', correct: false },
      { text: '$S_{tp} = 225\\text{ cm}^2$', correct: false },
      { text: '$S_{tp} = 3375\\text{ cm}^2$', correct: false }
    ],
    explanation: 'Hình lập phương có 6 mặt vuông bằng nhau, mỗi mặt có diện tích $a^2 = 15^2 = 225\\text{ cm}^2$. Diện tích toàn phần: $S_{tp} = 6a^2 = 6 \\times 225 = 1350\\text{ cm}^2$.'
  },
  {
    id: 2,
    title: 'Câu 2: Đo chiều cao cột cờ bằng giác kế',
    pts: 20,
    question: 'Một học sinh đứng cách chân cột cờ $d = 20\\text{ m}$, dùng giác kế có chiều cao $h_0 = 1.5\\text{ m}$ ngắm thấy đỉnh cột cờ dưới góc nâng $\\alpha = 30^\\circ$. Chiều cao cột cờ xấp xỉ là:',
    options: [
      { text: '$13.05\\text{ m}$', correct: true },
      { text: '$11.55\\text{ m}$', correct: false },
      { text: '$15.00\\text{ m}$', correct: false },
      { text: '$21.50\\text{ m}$', correct: false }
    ],
    explanation: 'Áp dụng công thức: $H = h_0 + d \\cdot \\tan\\alpha = 1.5 + 20 \\cdot \\tan(30^\\circ) = 1.5 + 20 \\cdot \\dfrac{\\sqrt{3}}{3} \\approx 1.5 + 11.55 = 13.05\\text{ m}$.'
  },
  {
    id: 3,
    title: 'Câu 3: Đo chiều cao tòa nhà qua bóng mặt trời',
    pts: 20,
    question: 'Tại cùng một thời điểm nắng, một cọc tiêu cao $1.2\\text{ m}$ cắm thẳng đứng có bóng dài $0.8\\text{ m}$. Một tòa nhà có bóng trên mặt đất dài $24\\text{ m}$. Chiều cao của tòa nhà là:',
    options: [
      { text: '$36\\text{ m}$', correct: true },
      { text: '$32\\text{ m}$', correct: false },
      { text: '$16\\text{ m}$', correct: false },
      { text: '$48\\text{ m}$', correct: false }
    ],
    explanation: 'Theo tính chất tam giác vuông đồng dạng tạo bởi tia nắng mặt trời: $\\dfrac{H}{24} = \\dfrac{1.2}{0.8} = 1.5 \\implies H = 24 \\times 1.5 = 36\\text{ m}$.'
  },
  {
    id: 4,
    title: 'Câu 4: Xác định góc dốc của mái nhà',
    pts: 20,
    question: 'Một ngôi nhà có mái cân, chiều rộng nhịp mái là $w = 8\\text{ m}$ và chiều cao đỉnh chóp mái là $h = 3\\text{ m}$. Góc dốc $\\alpha$ của mái nhà xấp xỉ bằng:',
    options: [
      { text: '$\\alpha \\approx 37^\\circ$', correct: true },
      { text: '$\\alpha \\approx 20^\\circ$', correct: false },
      { text: '$\\alpha \\approx 45^\\circ$', correct: false },
      { text: '$\\alpha \\approx 53^\\circ$', correct: false }
    ],
    explanation: 'Nửa nhịp mái có độ dài $\\dfrac{w}{2} = 4\\text{ m}$. Ta có $\\tan\\alpha = \\dfrac{h}{w/2} = \\dfrac{3}{4} = 0.75 \\implies \\alpha = \\arctan(0.75) \\approx 36.87^\\circ \\approx 37^\\circ$.'
  },
  {
    id: 5,
    title: 'Câu 5: Diện tích vải bạt lều chóp tứ giác đều',
    pts: 20,
    question: 'Một chiếc lều hình chóp tứ giác đều có cạnh đáy $a = 2\\text{ m}$ và chiều cao mặt bên (trung đoạn) $d = 2.5\\text{ m}$. Diện tích vải bạt làm 4 mặt bên của lều (diện tích xung quanh) là:',
    options: [
      { text: '$S_{xq} = 10\\text{ m}^2$', correct: true },
      { text: '$S_{xq} = 5\\text{ m}^2$', correct: false },
      { text: '$S_{xq} = 14\\text{ m}^2$', correct: false },
      { text: '$S_{xq} = 20\\text{ m}^2$', correct: false }
    ],
    explanation: 'Mỗi mặt bên là tam giác cân có diện tích $S_1 = \\dfrac{1}{2} \\cdot 2 \\cdot 2.5 = 2.5\\text{ m}^2$. Diện tích 4 mặt bên: $S_{xq} = 4 \\times 2.5 = 10\\text{ m}^2$.'
  },
  {
    id: 6,
    title: 'Câu 6: Thể tích khối kim tự tháp',
    pts: 20,
    question: 'Một mô hình kim tự tháp bằng pha lê có đáy là hình vuông cạnh $a = 6\\text{ cm}$, chiều cao $h = 10\\text{ cm}$. Thể tích của khối pha lê là:',
    options: [
      { text: '$V = 120\\text{ cm}^3$', correct: true },
      { text: '$V = 360\\text{ cm}^3$', correct: false },
      { text: '$V = 60\\text{ cm}^3$', correct: false },
      { text: '$V = 180\\text{ cm}^3$', correct: false }
    ],
    explanation: 'Diện tích đáy: $S = 6^2 = 36\\text{ cm}^2$. Thể tích khối chóp: $V = \\dfrac{1}{3} S \\cdot h = \\dfrac{1}{3} \\cdot 36 \\cdot 10 = 120\\text{ cm}^3$.'
  },
  {
    id: 7,
    title: 'Câu 7: Hệ thức Euler cho khối bát diện đều',
    pts: 20,
    question: 'Khối bát diện đều (8 mặt là các tam giác đều) có số đỉnh ($V$) và số cạnh ($E$) lần lượt là:',
    options: [
      { text: '$V = 6, E = 12$', correct: true },
      { text: '$V = 8, E = 12$', correct: false },
      { text: '$V = 12, E = 8$', correct: false },
      { text: '$V = 6, E = 8$', correct: false }
    ],
    explanation: 'Khối bát diện đều có $F = 8$ mặt, $V = 6$ đỉnh và $E = 12$ cạnh. Kiểm tra hệ thức Euler: $V - E + F = 6 - 12 + 8 = 2$ (luôn đúng cho mọi khối đa diện lồi).'
  },
  {
    id: 8,
    title: 'Câu 8: Đo khoảng cách qua sông bằng định lí Sin',
    pts: 20,
    question: 'Để đo khoảng cách $AC$ bên kia sông, trên bờ người ta đo đoạn $AB = 50\\text{ m}$, các góc $\\widehat{CAB} = 60^\\circ$ và $\\widehat{ABC} = 75^\\circ$. Khoảng cách $AC$ xấp xỉ là:',
    options: [
      { text: '$AC \\approx 68.3\\text{ m}$', correct: true },
      { text: '$AC \\approx 50.0\\text{ m}$', correct: false },
      { text: '$AC \\approx 75.2\\text{ m}$', correct: false },
      { text: '$AC \\approx 60.5\\text{ m}$', correct: false }
    ],
    explanation: 'Trong tam giác $ABC$: $\\widehat{ACB} = 180^\\circ - (60^\\circ + 75^\\circ) = 45^\\circ$. Theo định lí Sin: $\\dfrac{AC}{\\sin 75^\\circ} = \\dfrac{AB}{\\sin 45^\\circ} \\implies AC = 50 \\cdot \\dfrac{\\sin 75^\\circ}{\\sin 45^\\circ} \\approx 50 \\cdot \\dfrac{0.9659}{0.7071} \\approx 68.3\\text{ m}$.'
  },
  {
    id: 9,
    title: 'Câu 9: Số lượng hình trải phẳng khối lập phương',
    pts: 20,
    question: 'Trong toán học không gian, có tất cả bao nhiêu hình trải phẳng (net) khác nhau (không tính phép quay hoặc lật) có thể gấp thành một khối lập phương hoàn chỉnh?',
    options: [
      { text: '$11\\text{ hình}$', correct: true },
      { text: '$6\\text{ hình}$', correct: false },
      { text: '$8\\text{ hình}$', correct: false },
      { text: '$14\\text{ hình}$', correct: false }
    ],
    explanation: 'Đã được chứng minh bằng toán học tổ hợp và hình học không gian: có chính xác $11$ mẫu trải phẳng hình học phân biệt tạo thành khối lập phương.'
  },
  {
    id: 10,
    title: 'Câu 10: Thể tích chứa nước của bể bơi mini',
    pts: 20,
    question: 'Một bể bơi mini dạng hình hộp chữ nhật có kích thước đáy là $4\\text{ m} \\times 2.5\\text{ m}$ và chiều sâu $1.2\\text{ m}$. Dung tích nước tối đa của bể bơi là:',
    options: [
      { text: '$12\\text{ m}^3$ (tương đương $12\\,000$ lít)', correct: true },
      { text: '$10\\text{ m}^3$ (tương đương $10\\,000$ lít)', correct: false },
      { text: '$15\\text{ m}^3$ (tương đương $15\\,000$ lít)', correct: false },
      { text: '$8\\text{ m}^3$ (tương đương $8\\,000$ lít)', correct: false }
    ],
    explanation: 'Thể tích hình hộp chữ nhật: $V = a \\times b \\times c = 4 \\times 2.5 \\times 1.2 = 12\\text{ m}^3$. Vì $1\\text{ m}^3 = 1000\\text{ lít}$, bể chứa tối đa $12\\,000\\text{ lít}$ nước.'
  }
];

// --- HUD Updates ---
function updateHUD() {
  document.getElementById('xpDisplay').textContent = appState.xp;
  document.getElementById('streakDisplay').textContent = `🔥 ${appState.streak}`;
  document.getElementById('userNameDisplay').textContent = `${appState.userName} 🌟`;
  document.getElementById('avatarBtn').textContent = appState.avatar;
  document.getElementById('userTitle').textContent = appState.userTitle;

  const starCount = Math.min(5, Math.max(1, Math.floor(appState.xp / 40) + 1));
  appState.stars = starCount;
  document.getElementById('starRating').textContent = '⭐'.repeat(starCount) + '☆'.repeat(5 - starCount);

  if (appState.badges[0]) unlockBadgeUI(1);
  if (appState.badges[1]) unlockBadgeUI(2);
  if (appState.streak >= 3 && !appState.badges[2]) {
    appState.badges[2] = true;
    unlockBadgeUI(3);
  }
  if (appState.xp >= 160 && !appState.badges[3]) {
    appState.badges[3] = true;
    unlockBadgeUI(4);
  }
  const totalCorrect = Object.values(appState.answered).filter(a => a.correct).length;
  if (totalCorrect === 10 && !appState.badges[4]) {
    appState.badges[4] = true;
    unlockBadgeUI(5);
    audio.playFanfare();
  }
}

function unlockBadgeUI(index) {
  const el = document.getElementById(`badge-${index}`);
  if (el) {
    const status = el.querySelector('.badge-status');
    if (status) {
      status.textContent = 'Đã mở khóa';
      status.className = 'badge-status unlocked';
    }
  }
}

// --- Tab Switching ---
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      audio.playClick();
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      if (target) {
        target.classList.add('active');
        renderMathInTree(target);
      }
      if (tab.dataset.tab === 'theory' && !appState.badges[0]) {
        appState.badges[0] = true;
        unlockBadgeUI(1);
      }
      if (tab.dataset.tab === 'labs' && !appState.badges[1]) {
        appState.badges[1] = true;
        unlockBadgeUI(2);
      }
    });
  });
}

// --- Render Quiz ---
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];

  quizData.forEach(q => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard-${q.id}`;

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `<span>${q.title}</span><span class="quiz-badge">+${q.pts} XP</span>`;
    card.appendChild(header);

    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    const optGrid = document.createElement('div');
    optGrid.className = 'quiz-options-grid';

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;
      btn.addEventListener('click', () => handleAnswer(q.id, optIndex, btn, optGrid, card, q));
      optGrid.appendChild(btn);
    });
    card.appendChild(optGrid);

    const explanation = document.createElement('div');
    explanation.className = 'explanation-box';
    explanation.id = `exp-${q.id}`;
    explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;
    card.appendChild(explanation);

    container.appendChild(card);
  });

  renderMathInTree(container);
  updateArenaProgress();
}

function handleAnswer(qId, selectedIdx, btn, optGrid, card, questionData) {
  if (appState.answered[qId]) return;

  const isCorrect = questionData.options[selectedIdx].correct;
  appState.answered[qId] = { selected: selectedIdx, correct: isCorrect };

  const buttons = optGrid.querySelectorAll('.quiz-opt-btn');
  buttons.forEach(b => (b.disabled = true));

  if (isCorrect) {
    btn.classList.add('correct');
    appState.xp += questionData.pts;
    appState.streak += 1;
    audio.playCorrect();
  } else {
    btn.classList.add('wrong');
    appState.streak = 0;
    audio.playWrong();
    questionData.options.forEach((opt, i) => {
      if (opt.correct) buttons[i].classList.add('correct');
    });
  }

  const expBox = card.querySelector('.explanation-box');
  if (expBox) {
    expBox.classList.add('show');
    renderMathInTree(expBox);
  }

  updateHUD();
  updateArenaProgress();
}

function updateArenaProgress() {
  const answeredCount = Object.keys(appState.answered).length;
  const progressEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progressEl) progressEl.textContent = `${answeredCount}/10`;
  if (scoreEl) scoreEl.textContent = `${appState.xp} XP`;
}

// --- Lab 1: Interactive 3D Polyhedron Viewer ---
function initLab1() {
  const canvas = document.getElementById('labCanvas1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const polySelect = document.getElementById('polySelect');
  const yawSlider = document.getElementById('yawSlider');
  const pitchSlider = document.getElementById('pitchSlider');
  const yawVal = document.getElementById('yawVal');
  const pitchVal = document.getElementById('pitchVal');
  const polyName = document.getElementById('polyName');
  const lab1Output = document.getElementById('lab1Output');

  // 3D Models definition
  const models = {
    cube: {
      name: 'Khối Lập Phương',
      info: 'Số đỉnh: $V = 8$, Số cạnh: $E = 12$, Số mặt: $F = 6$',
      vertices: [
        [-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1],
        [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]
      ],
      edges: [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 5], [5, 6], [6, 7], [7, 4],
        [0, 4], [1, 5], [2, 6], [3, 7]
      ]
    },
    pyramid: {
      name: 'Hình Chóp Tứ Giác Đều',
      info: 'Số đỉnh: $V = 5$, Số cạnh: $E = 8$, Số mặt: $F = 5$',
      vertices: [
        [-1.1, -1.1, -0.8], [1.1, -1.1, -0.8], [1.1, 1.1, -0.8], [-1.1, 1.1, -0.8],
        [0, 0, 1.3]
      ],
      edges: [
        [0, 1], [1, 2], [2, 3], [3, 0],
        [4, 0], [4, 1], [4, 2], [4, 3]
      ]
    },
    tetra: {
      name: 'Khối Tứ Diện Đều',
      info: 'Số đỉnh: $V = 4$, Số cạnh: $E = 6$, Số mặt: $F = 4$',
      vertices: [
        [1, 1, 1], [-1, -1, 1], [-1, 1, -1], [1, -1, -1]
      ],
      edges: [
        [0, 1], [0, 2], [0, 3],
        [1, 2], [2, 3], [3, 1]
      ]
    }
  };

  function project(x, y, z, yawRad, pitchRad, w, h) {
    // Rotate Y (Yaw)
    const cosY = Math.cos(yawRad);
    const sinY = Math.sin(yawRad);
    const x1 = x * cosY - z * sinY;
    const z1 = x * sinY + z * cosY;

    // Rotate X (Pitch)
    const cosP = Math.cos(pitchRad);
    const sinP = Math.sin(pitchRad);
    const y2 = y * cosP - z1 * sinP;
    const z2 = y * sinP + z1 * cosP;

    // Perspective Projection
    const fov = 300;
    const dist = 3.5;
    const factor = fov / (dist + z2);

    return {
      px: w / 2 + x1 * factor * 0.9,
      py: h / 2 - y2 * factor * 0.9,
      z: z2
    };
  }

  function draw() {
    const key = polySelect.value;
    const model = models[key];
    const yawDeg = parseFloat(yawSlider.value);
    const pitchDeg = parseFloat(pitchSlider.value);
    yawVal.textContent = `${yawDeg}°`;
    pitchVal.textContent = `${pitchDeg}°`;

    polyName.textContent = model.name;
    lab1Output.querySelector('p:nth-child(2)').innerHTML = model.info;
    renderMathInTree(lab1Output);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const yawRad = (yawDeg * Math.PI) / 180;
    const pitchRad = (pitchDeg * Math.PI) / 180;

    // Project all vertices
    const projected = model.vertices.map(v => project(v[0], v[1], v[2], yawRad, pitchRad, w, h));

    // Draw Edges
    model.edges.forEach(edge => {
      const p1 = projected[edge[0]];
      const p2 = projected[edge[1]];

      // If average Z is far behind, draw dashed
      const avgZ = (p1.z + p2.z) / 2;
      const isHidden = avgZ > 0.4;

      ctx.beginPath();
      ctx.moveTo(p1.px, p1.py);
      ctx.lineTo(p2.px, p2.py);

      if (isHidden) {
        ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
      } else {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2.5;
        ctx.setLineDash([]);
      }
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Draw Vertices
    projected.forEach((p, idx) => {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(p.px, p.py, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(String.fromCharCode(65 + idx), p.px + 7, p.py - 5);
    });
  }

  polySelect.addEventListener('change', draw);
  yawSlider.addEventListener('input', draw);
  pitchSlider.addEventListener('input', draw);
  draw();
}

// --- Lab 2: Clinometer Height Measurement Simulator ---
function initLab2() {
  const canvas = document.getElementById('labCanvas2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dSlider = document.getElementById('dSlider');
  const alphaSlider = document.getElementById('alphaSlider');
  const dVal = document.getElementById('dVal');
  const alphaVal = document.getElementById('alphaVal');
  const hFlagOut = document.getElementById('hFlagOut');
  const lab2Output = document.getElementById('lab2Output');

  function draw() {
    const d = parseFloat(dSlider.value);
    const alphaDeg = parseFloat(alphaSlider.value);
    dVal.textContent = `${d.toFixed(1)} m`;
    alphaVal.textContent = `${alphaDeg}°`;

    const alphaRad = (alphaDeg * Math.PI) / 180;
    const h0 = 1.6; // meter
    const H = h0 + d * Math.tan(alphaRad);

    hFlagOut.innerHTML = `$H = ${H.toFixed(2)}\\text{ m}$`;
    lab2Output.querySelector('p:nth-child(2)').innerHTML = `Công thức tính: $H = ${h0} + ${d.toFixed(1)} \\cdot \\tan(${alphaDeg}^\\circ) = ${h0} + ${(d * Math.tan(alphaRad)).toFixed(2)} = ${H.toFixed(2)}\\text{ m}$`;
    renderMathInTree(lab2Output);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const groundY = h - 50;

    // Ground
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, groundY, w, 50);
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(w, groundY);
    ctx.stroke();

    // Flagpole at right side (x = 420)
    const poleX = 420;
    const scale = 11; // pixels per meter
    const poleTopY = groundY - H * scale;

    // Pole
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(poleX, groundY);
    ctx.lineTo(poleX, poleTopY);
    ctx.stroke();

    // Red Flag at Top
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(poleX, poleTopY);
    ctx.lineTo(poleX + 35, poleTopY + 12);
    ctx.lineTo(poleX, poleTopY + 24);
    ctx.closePath();
    ctx.fill();

    // Gold Star on flag
    ctx.fillStyle = '#fbbf24';
    ctx.beginPath();
    ctx.arc(poleX + 12, poleTopY + 12, 4, 0, Math.PI * 2);
    ctx.fill();

    // Student / Clinometer at Left
    const studentX = poleX - d * scale;
    const eyeY = groundY - h0 * scale;

    // Student Body
    ctx.fillStyle = '#60a5fa';
    ctx.fillRect(studentX - 6, eyeY + 5, 12, groundY - eyeY - 5);
    // Head
    ctx.fillStyle = '#fde047';
    ctx.beginPath();
    ctx.arc(studentX, eyeY - 6, 7, 0, Math.PI * 2);
    ctx.fill();

    // Sight line from eye to pole top
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(studentX, eyeY);
    ctx.lineTo(poleX, poleTopY);
    ctx.stroke();

    // Horizontal line from eye
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.moveTo(studentX, eyeY);
    ctx.lineTo(poleX, eyeY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Angle Arc
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(studentX, eyeY, 30, -alphaRad, 0);
    ctx.stroke();

    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`${alphaDeg}°`, studentX + 35, eyeY - 8);

    // Dimension Annotations
    // Distance d
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`d = ${d.toFixed(1)}m`, (studentX + poleX) / 2 - 20, groundY + 22);

    // Height H
    ctx.fillStyle = '#4ade80';
    ctx.fillText(`H = ${H.toFixed(2)}m`, poleX + 10, (groundY + poleTopY) / 2);
  }

  dSlider.addEventListener('input', draw);
  alphaSlider.addEventListener('input', draw);
  draw();
}

// --- Avatar Selection Modal ---
function initAvatarModal() {
  const avatarBtn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const closeBtn = document.getElementById('closeAvatarModal');
  const grid = document.getElementById('avatarGrid');

  if (!avatarBtn || !modal) return;

  avatarBtn.addEventListener('click', () => {
    audio.playClick();
    modal.style.display = 'flex';
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      audio.playClick();
      modal.style.display = 'none';
    });
  }

  if (grid) {
    grid.querySelectorAll('.avatar-opt').forEach(btn => {
      btn.addEventListener('click', () => {
        audio.playClick();
        appState.avatar = btn.dataset.avatar;
        updateHUD();
        modal.style.display = 'none';
      });
    });
  }
}

// --- Audio & Progress Controls ---
function initControls() {
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      appState.sound = !appState.sound;
      soundToggle.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      audio.playClick();
    });
  }

  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập?')) {
        audio.playClick();
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        document.querySelectorAll('.badge-status').forEach(st => {
          st.textContent = 'Chưa đạt';
          st.className = 'badge-status locked';
        });
        updateHUD();
        renderQuiz();
      }
    });
  }

  const printCertBtn = document.getElementById('btnPrintCert');
  if (printCertBtn) {
    printCertBtn.addEventListener('click', () => {
      audio.playClick();
      window.print();
    });
  }
}

// --- Initialization on DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initAvatarModal();
  initControls();
  renderQuiz();
  initLab1();
  initLab2();
  updateHUD();
  renderMathInTree(document.body);
});
