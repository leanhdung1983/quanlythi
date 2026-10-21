// App Logic for Bài tập cuối chương IX: Đạo hàm - Toán 11 KNTT

// --- State Management ---
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Giải Tích Đạo Hàm',
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

// --- Quiz Data (10 Questions Tổng Hợp SGK Chương IX 9.18 - 9.25) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1: Định nghĩa đạo hàm bằng giới hạn (Bài 9.18a SGK)',
    pts: 20,
    question: 'Cho hàm số $f(x) = x^2 - 3x$. Tính $f\'(2)$ theo định nghĩa bằng giới hạn:',
    options: [
      { text: '$f\'(2) = 1$', correct: true },
      { text: '$f\'(2) = -1$', correct: false },
      { text: '$f\'(2) = 4$', correct: false },
      { text: '$f\'(2) = 0$', correct: false }
    ],
    explanation: 'Theo định nghĩa: $f\'(2) = \\lim\\limits_{x \\to 2} \\dfrac{f(x) - f(2)}{x - 2} = \\lim\\limits_{x \\to 2} \\dfrac{x^2 - 3x - (-2)}{x - 2} = \\lim\\limits_{x \\to 2} \\dfrac{(x - 1)(x - 2)}{x - 2} = \\lim\\limits_{x \\to 2} (x - 1) = 1$.'
  },
  {
    id: 2,
    title: 'Câu 2: Đạo hàm hàm phân thức (Bài 9.18 SGK)',
    pts: 20,
    question: 'Đạo hàm của hàm số $y = \\dfrac{x^2 - 2x + 3}{x - 1}$ ($x \\ne 1$) là:',
    options: [
      { text: '$y\' = \\dfrac{x^2 - 2x - 1}{(x - 1)^2}$', correct: true },
      { text: '$y\' = \\dfrac{x^2 - 2x + 1}{(x - 1)^2}$', correct: false },
      { text: '$y\' = \\dfrac{2x - 2}{(x - 1)^2}$', correct: false },
      { text: '$y\' = \\dfrac{x^2 - 1}{(x - 1)^2}$', correct: false }
    ],
    explanation: 'Ta có $y\' = \\dfrac{(x^2 - 2x + 3)\'(x - 1) - (x^2 - 2x + 3)(x - 1)\'}{(x - 1)^2} = \\dfrac{(2x - 2)(x - 1) - (x^2 - 2x + 3)}{(x - 1)^2} = \\dfrac{2x^2 - 4x + 2 - x^2 + 2x - 3}{(x - 1)^2} = \\dfrac{x^2 - 2x - 1}{(x - 1)^2}$.'
  },
  {
    id: 3,
    title: 'Câu 3: Tiếp tuyến song song với đường thẳng (Bài 9.19 SGK)',
    pts: 20,
    question: 'Phương trình tiếp tuyến của đồ thị hàm số $y = x^3 - 3x^2 + 2$ song song với đường thẳng $d: y = 9x - 5$ là:',
    options: [
      { text: '$y = 9x - 25$ và $y = 9x + 7$', correct: true },
      { text: '$y = 9x - 5$ và $y = 9x + 25$', correct: false },
      { text: '$y = 9x + 2$ và $y = 9x - 8$', correct: false },
      { text: '$y = 9x - 27$', correct: false }
    ],
    explanation: 'Tiếp tuyến song song với $d \\implies k = y\'(x_0) = 3x_0^2 - 6x_0 = 9 \\iff x_0^2 - 2x_0 - 3 = 0 \\iff x_0 = -1$ hoặc $x_0 = 3$. Tại $x_0 = 3 \\implies y_0 = 2$, tiếp tuyến là $y = 9(x - 3) + 2 = 9x - 25$. Tại $x_0 = -1 \\implies y_0 = -2$, tiếp tuyến là $y = 9(x + 1) - 2 = 9x + 7$. (Cả 2 đều khác -5 nên thỏa mãn song song).'
  },
  {
    id: 4,
    title: 'Câu 4: Bất phương trình đạo hàm (Bài 9.20 SGK)',
    pts: 20,
    question: 'Cho hàm số $y = \\sqrt{4 - x^2}$. Tập nghiệm của bất phương trình $y\' \\le 0$ trên khoảng $(-2; 2)$ là:',
    options: [
      { text: '$[0; 2)$', correct: true },
      { text: '$(-2; 0]$', correct: false },
      { text: '$[-2; 2]$', correct: false },
      { text: '$(0; 2)$', correct: false }
    ],
    explanation: 'Ta có $y\' = \\dfrac{-2x}{2\\sqrt{4 - x^2}} = \\dfrac{-x}{\sqrt{4 - x^2}}$. Với $x \\in (-2; 2)$, mẫu số luôn dương, do đó $y\' \\le 0 \\iff -x \\le 0 \\iff x \\ge 0$. Kết hợp điều kiện ta được $x \\in [0; 2)$.'
  },
  {
    id: 5,
    title: 'Câu 5: Đạo hàm hàm hợp lượng giác (Bài 9.21 SGK)',
    pts: 20,
    question: 'Đạo hàm của hàm số $y = \\tan\\left(\\dfrac{x}{2}\\right)$ với $x \\ne \\pi + k2\\pi$ là:',
    options: [
      { text: '$y\' = \\dfrac{1}{2\\cos^2(x/2)}$', correct: true },
      { text: '$y\' = \\dfrac{1}{\\cos^2(x/2)}$', correct: false },
      { text: '$y\' = -\\dfrac{1}{2\\sin^2(x/2)}$', correct: false },
      { text: '$y\' = \\dfrac{1}{2}\\left(1 - \\tan^2(x/2)\\right)$', correct: false }
    ],
    explanation: 'Áp dụng công thức đạo hàm hàm hợp $(\\tan u)\' = \\dfrac{u\'}{\\cos^2 u}$ với $u = \\dfrac{x}{2} \\implies u\' = \\dfrac{1}{2}$. Vậy $y\' = \\dfrac{1}{2\\cos^2(x/2)}$.'
  },
  {
    id: 6,
    title: 'Câu 6: Đạo hàm tích kết hợp hàm mũ & logarit',
    pts: 20,
    question: 'Cho hàm số $f(x) = e^x \\cdot \\ln(x^2 + 1)$. Giá trị $f\'(0)$ bằng:',
    options: [
      { text: '$f\'(0) = 0$', correct: true },
      { text: '$f\'(0) = 1$', correct: false },
      { text: '$f\'(0) = e$', correct: false },
      { text: '$f\'(0) = 2$', correct: false }
    ],
    explanation: 'Ta có $f\'(x) = e^x \\ln(x^2 + 1) + e^x \\cdot \\dfrac{2x}{x^2 + 1}$. Thay $x = 0$: $f\'(0) = e^0 \\ln(1) + e^0 \\cdot \\dfrac{0}{1} = 1 \\cdot 0 + 1 \\cdot 0 = 0$.'
  },
  {
    id: 7,
    title: 'Câu 7: Tổng các nghiệm của phương trình đạo hàm',
    pts: 20,
    question: 'Cho hàm số $f(x) = \\dfrac{1}{3}x^3 - 2x^2 + 3x + 5$. Tổng các nghiệm của phương trình $f\'(x) = 0$ là:',
    options: [
      { text: '$4$', correct: true },
      { text: '$-4$', correct: false },
      { text: '$3$', correct: false },
      { text: '$2$', correct: false }
    ],
    explanation: 'Ta có $f\'(x) = x^2 - 4x + 3$. Phương trình $f\'(x) = 0 \\iff x^2 - 4x + 3 = 0 \\iff x_1 = 1, x_2 = 3$. Tổng hai nghiệm là $x_1 + x_2 = 4$ (hoặc dùng định lí Viète: $-\\dfrac{b}{a} = 4$).'
  },
  {
    id: 8,
    title: 'Câu 8: Gia tốc lớn nhất trong dao động (Bài 9.23 SGK)',
    pts: 20,
    question: 'Một chất điểm dao động theo phương trình $s(t) = 10\\sin(4t)$ (cm, $t$ tính bằng giây). Độ lớn gia tốc cực đại của chất điểm là:',
    options: [
      { text: '$a_{\\max} = 160\\text{ cm/s}^2$', correct: true },
      { text: '$a_{\\max} = 40\\text{ cm/s}^2$', correct: false },
      { text: '$a_{\\max} = 10\\text{ cm/s}^2$', correct: false },
      { text: '$a_{\\max} = 400\\text{ cm/s}^2$', correct: false }
    ],
    explanation: 'Vận tốc $v(t) = s\'(t) = 40\\cos(4t)$. Gia tốc $a(t) = v\'(t) = -160\\sin(4t)$. Vì $|\\sin(4t)| \\le 1$ nên độ lớn gia tốc lớn nhất là $|a|_{\\max} = 160\\text{ cm/s}^2$.'
  },
  {
    id: 9,
    title: 'Câu 9: Hệ số góc nhỏ nhất của tiếp tuyến',
    pts: 20,
    question: 'Tiếp tuyến của đồ thị hàm số $y = x^3 - 3x^2 + 5x - 2$ có hệ số góc nhỏ nhất bằng:',
    options: [
      { text: '$k_{\\min} = 2$', correct: true },
      { text: '$k_{\\min} = 5$', correct: false },
      { text: '$k_{\\min} = 0$', correct: false },
      { text: '$k_{\\min} = -2$', correct: false }
    ],
    explanation: 'Hệ số góc của tiếp tuyến tại $x$ là $k(x) = y\' = 3x^2 - 6x + 5 = 3(x^2 - 2x + 1) + 2 = 3(x - 1)^2 + 2 \\ge 2$ với mọi $x$. Dấu bằng xảy ra khi $x = 1$. Vậy $k_{\\min} = 2$.'
  },
  {
    id: 10,
    title: 'Câu 10: Chi phí cận biên trong kinh tế học (Bài 9.25 SGK)',
    pts: 20,
    question: 'Chi phí sản xuất $x$ sản phẩm là $C(x) = 0.001x^3 - 0.3x^2 + 40x + 1000$ (nghìn đồng). Chi phí cận biên tại mức sản xuất $x = 100$ sản phẩm là:',
    options: [
      { text: '$10\\text{ nghìn đồng/sản phẩm}$', correct: true },
      { text: '$40\\text{ nghìn đồng/sản phẩm}$', correct: false },
      { text: '$30\\text{ nghìn đồng/sản phẩm}$', correct: false },
      { text: '$70\\text{ nghìn đồng/sản phẩm}$', correct: false }
    ],
    explanation: 'Chi phí cận biên là đạo hàm của hàm tổng chi phí: $C\'(x) = 0.003x^2 - 0.6x + 40$. Tại $x = 100$: $C\'(100) = 0.003(10000) - 0.6(100) + 40 = 30 - 60 + 40 = 10\\text{ nghìn đồng/sản phẩm}$.'
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

// --- Lab 1: Comprehensive Tangent Explorer ---
function initLab1() {
  const canvas = document.getElementById('labCanvas1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const slider = document.getElementById('x0Slider');
  const x0Val = document.getElementById('x0Val');
  const m0Coord = document.getElementById('m0Coord');
  const kSlopeOut = document.getElementById('kSlopeOut');
  const tangentEqOut = document.getElementById('tangentEqOut');
  const lab1Output = document.getElementById('lab1Output');

  function f(x) {
    return (x * x * x) / 3 - x * x - x + 1;
  }
  function fP(x) {
    return x * x - 2 * x - 1;
  }

  function draw() {
    const x0 = parseFloat(slider.value);
    x0Val.textContent = x0.toFixed(1);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const ox = w / 2 - 20;
    const oy = h / 2 + 20;
    const scaleX = 65;
    const scaleY = 35;

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = -4; x <= 5; x++) {
      ctx.beginPath();
      ctx.moveTo(ox + x * scaleX, 0);
      ctx.lineTo(ox + x * scaleX, h);
      ctx.stroke();
    }
    for (let y = -5; y <= 5; y++) {
      ctx.beginPath();
      ctx.moveTo(0, oy - y * scaleY);
      ctx.lineTo(w, oy - y * scaleY);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(w, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, h);
    ctx.stroke();

    // Plot Curve f(x)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let px = 0; px < w; px++) {
      const rx = (px - ox) / scaleX;
      const ry = f(rx);
      const py = oy - ry * scaleY;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Tangent Line at x0
    const y0 = f(x0);
    const k = fP(x0);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    const span = 4;
    const px1 = ox + (x0 - span) * scaleX;
    const py1 = oy - (y0 - k * span) * scaleY;
    const px2 = ox + (x0 + span) * scaleX;
    const py2 = oy - (y0 + k * span) * scaleY;
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Point M0(x0, y0)
    const pmx = ox + x0 * scaleX;
    const pmy = oy - y0 * scaleY;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pmx, pmy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Update Output
    m0Coord.innerHTML = `$M_0(${x0.toFixed(1)}; ${y0.toFixed(2)})$`;
    let kNote = '';
    if (Math.abs(x0 - 1.0) < 0.05) kNote = '(Hệ số góc nhỏ nhất $k = -2.00$ tại $x_0 = 1$)';
    else if (Math.abs(k) < 0.1) kNote = '(Tiếp tuyến gần như nằm ngang $k \\approx 0$)';
    kSlopeOut.innerHTML = `$k = f'(${x0.toFixed(1)}) = ${k.toFixed(2)}$ ${kNote}`;

    const b = y0 - k * x0;
    const signB = b >= 0 ? `+ ${b.toFixed(2)}` : `- ${Math.abs(b).toFixed(2)}`;
    tangentEqOut.innerHTML = `$y = ${k.toFixed(2)}x ${signB}$`;
    renderMathInTree(lab1Output);
  }

  slider.addEventListener('input', draw);
  draw();
}

// --- Lab 2: Root Scanner f'(x) = 0 ---
function initLab2() {
  const canvas = document.getElementById('labCanvas2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const btnToggle = document.getElementById('btnToggleDeriv');
  let showDeriv = true;

  function f(x) {
    return x * x * x - 3 * x;
  }
  function fP(x) {
    return 3 * x * x - 3;
  }

  function draw() {
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const ox = w / 2;
    const oy = h / 2;
    const scaleX = 75;
    const scaleY = 35;

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = -4; x <= 4; x++) {
      ctx.beginPath();
      ctx.moveTo(ox + x * scaleX, 0);
      ctx.lineTo(ox + x * scaleX, h);
      ctx.stroke();
    }
    for (let y = -4; y <= 4; y++) {
      ctx.beginPath();
      ctx.moveTo(0, oy - y * scaleY);
      ctx.lineTo(w, oy - y * scaleY);
      ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, oy);
    ctx.lineTo(w, oy);
    ctx.moveTo(ox, 0);
    ctx.lineTo(ox, h);
    ctx.stroke();

    // Plot f(x)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let px = 0; px < w; px++) {
      const rx = (px - ox) / scaleX;
      const ry = f(rx);
      const py = oy - ry * scaleY;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Plot f'(x) if toggled
    if (showDeriv) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let px = 0; px < w; px++) {
        const rx = (px - ox) / scaleX;
        const ry = fP(rx);
        const py = oy - ry * scaleY;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Highlight horizontal tangent points (x = -1, x = 1)
    const pts = [
      { x: -1, y: f(-1), label: 'Cực đại (-1; 2), tiếp tuyến ngang' },
      { x: 1, y: f(1), label: 'Cực tiểu (1; -2), tiếp tuyến ngang' }
    ];

    pts.forEach(p => {
      const px = ox + p.x * scaleX;
      const py = oy - p.y * scaleY;

      // Draw horizontal tangent line segment
      ctx.strokeStyle = '#4ade80';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(px - 50, py);
      ctx.lineTo(px + 50, py);
      ctx.stroke();

      // Dot
      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(px, py, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(p.label, px - 60, p.y > 0 ? py - 12 : py + 22);

      // Point where f'(x) cuts Ox
      if (showDeriv) {
        ctx.fillStyle = '#f59e0b';
        ctx.beginPath();
        ctx.arc(px, oy, 5, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Legend
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('— f(x) = x³ - 3x', 15, 25);
    if (showDeriv) {
      ctx.fillStyle = '#f59e0b';
      ctx.fillText('--- f\'(x) = 3x² - 3 (cắt Ox tại x = ±1)', 15, 45);
    }
  }

  btnToggle.addEventListener('click', () => {
    audio.playClick();
    showDeriv = !showDeriv;
    draw();
  });

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
