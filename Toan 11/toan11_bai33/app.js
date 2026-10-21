// App Logic for Bài 33: Đạo hàm cấp hai - Toán 11 KNTT

// --- State Management ---
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Đạo Hàm Cấp Hai & Gia Tốc',
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

// --- Math Rendering Helper ---
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

// --- Quiz Data (10 Questions bám sát 9.13 - 9.17 SGK) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1: Đạo hàm cấp hai đa thức (Bài 9.13 SGK)',
    pts: 20,
    question: 'Cho hàm số $f(x) = 2x^4 - 3x^2 + 5x - 1$. Đạo hàm cấp hai $f\'\'(x)$ là:',
    options: [
      { text: '$f\'\'(x) = 24x^2 - 6$', correct: true },
      { text: '$f\'\'(x) = 8x^3 - 6x + 5$', correct: false },
      { text: '$f\'\'(x) = 24x^2 - 6x$', correct: false },
      { text: '$f\'\'(x) = 12x^2 - 6$', correct: false }
    ],
    explanation: 'Ta có $f\'(x) = 8x^3 - 6x + 5$. Lấy đạo hàm tiếp một lần nữa: $f\'\'(x) = (8x^3 - 6x + 5)\' = 24x^2 - 6$.'
  },
  {
    id: 2,
    title: 'Câu 2: Đạo hàm cấp hai hàm phân thức (Bài 9.14a SGK)',
    pts: 20,
    question: 'Đạo hàm cấp hai của hàm số $y = \\dfrac{1}{x}$ ($x \\ne 0$) là:',
    options: [
      { text: '$y\'\' = \\dfrac{2}{x^3}$', correct: true },
      { text: '$y\'\' = -\\dfrac{2}{x^3}$', correct: false },
      { text: '$y\'\' = \\dfrac{1}{x^3}$', correct: false },
      { text: '$y\'\' = -\\dfrac{1}{x^2}$', correct: false }
    ],
    explanation: 'Ta có $y\' = -\\dfrac{1}{x^2} = -x^{-2}$. Đạo hàm cấp hai: $y\'\' = (-x^{-2})\' = -(-2)x^{-3} = \\dfrac{2}{x^3}$.'
  },
  {
    id: 3,
    title: 'Câu 3: Đạo hàm cấp hai hàm lượng giác $\\sin(ax)$ (Bài 9.14b SGK)',
    pts: 20,
    question: 'Tính đạo hàm cấp hai của hàm số $y = \\sin(3x)$:',
    options: [
      { text: '$y\'\' = -9\\sin(3x)$', correct: true },
      { text: '$y\'\' = 9\\sin(3x)$', correct: false },
      { text: '$y\'\' = -3\\sin(3x)$', correct: false },
      { text: '$y\'\' = -9\\cos(3x)$', correct: false }
    ],
    explanation: 'Đạo hàm cấp một: $y\' = 3\\cos(3x)$. Đạo hàm cấp hai: $y\'\' = (3\\cos(3x))\' = 3 \\cdot (-3\\sin(3x)) = -9\\sin(3x)$.'
  },
  {
    id: 4,
    title: 'Câu 4: Đạo hàm cấp hai của hàm $\\cos^2 x$ (Bài 9.14c SGK)',
    pts: 20,
    question: 'Đạo hàm cấp hai của hàm số $y = \\cos^2 x$ là:',
    options: [
      { text: '$y\'\' = -2\\cos(2x)$', correct: true },
      { text: '$y\'\' = 2\\cos(2x)$', correct: false },
      { text: '$y\'\' = -2\\sin(2x)$', correct: false },
      { text: '$y\'\' = 2\\sin^2 x - 2\\cos^2 x$', correct: false }
    ],
    explanation: 'Ta có $y = \\dfrac{1 + \\cos(2x)}{2} = \\dfrac{1}{2} + \\dfrac{1}{2}\\cos(2x)$. Do đó $y\' = -\\sin(2x)$, suy ra $y\'\' = -2\\cos(2x)$.'
  },
  {
    id: 5,
    title: 'Câu 5: Đạo hàm cấp hai hàm số mũ (Bài 9.14d SGK)',
    pts: 20,
    question: 'Đạo hàm cấp hai của hàm số $y = e^{2x}$ là:',
    options: [
      { text: '$y\'\' = 4e^{2x}$', correct: true },
      { text: '$y\'\' = 2e^{2x}$', correct: false },
      { text: '$y\'\' = e^{2x}$', correct: false },
      { text: '$y\'\' = 4x e^{2x}$', correct: false }
    ],
    explanation: 'Ta có $y\' = 2e^{2x}$. Lấy đạo hàm tiếp: $y\'\' = (2e^{2x})\' = 2 \\cdot 2e^{2x} = 4e^{2x}$.'
  },
  {
    id: 6,
    title: 'Câu 6: Đẳng thức đạo hàm cấp hai (Bài 9.15 SGK)',
    pts: 20,
    question: 'Cho hàm số $y = e^x \\sin x$. Giá trị của biểu thức $A = y\'\' - 2y\' + 2y$ bằng:',
    options: [
      { text: '$A = 0$', correct: true },
      { text: '$A = 2e^x \\cos x$', correct: false },
      { text: '$A = e^x \\sin x$', correct: false },
      { text: '$A = 2$', correct: false }
    ],
    explanation: 'Ta có $y\' = e^x(\\sin x + \\cos x)$. Khi đó $y\'\' = e^x(\\sin x + \\cos x) + e^x(\\cos x - \\sin x) = 2e^x \\cos x$. Thay vào biểu thức: $A = 2e^x \\cos x - 2e^x(\\sin x + \\cos x) + 2e^x \\sin x = 0$.'
  },
  {
    id: 7,
    title: 'Câu 7: Gia tốc tức thời của chuyển động (Bài 9.16 SGK)',
    pts: 20,
    question: 'Một vật chuyển động thẳng có phương trình $s(t) = t^3 - 3t^2 + 4t + 1$ ($t$ tính bằng giây, $s$ tính bằng mét). Gia tốc của vật tại thời điểm $t = 2$ giây là:',
    options: [
      { text: '$a(2) = 6\\text{ m/s}^2$', correct: true },
      { text: '$a(2) = 4\\text{ m/s}^2$', correct: false },
      { text: '$a(2) = 12\\text{ m/s}^2$', correct: false },
      { text: '$a(2) = 0\\text{ m/s}^2$', correct: false }
    ],
    explanation: 'Vận tốc $v(t) = s\'(t) = 3t^2 - 6t + 4$. Gia tốc là đạo hàm cấp hai của quãng đường: $a(t) = s\'\'(t) = 6t - 6$. Tại thời điểm $t = 2$: $a(2) = 6(2) - 6 = 6\\text{ m/s}^2$.'
  },
  {
    id: 8,
    title: 'Câu 8: Thời điểm gia tốc triệt tiêu',
    pts: 20,
    question: 'Một chất điểm chuyển động theo phương trình $s(t) = 2t^3 - 9t^2 + 12t$. Thời điểm mà gia tốc tức thời $a(t) = 0$ là:',
    options: [
      { text: '$t = 1.5\\text{ s}$', correct: true },
      { text: '$t = 1\\text{ s}$', correct: false },
      { text: '$t = 2\\text{ s}$', correct: false },
      { text: '$t = 3\\text{ s}$', correct: false }
    ],
    explanation: 'Ta có $v(t) = s\'(t) = 6t^2 - 18t + 12$, suy ra gia tốc $a(t) = s\'\'(t) = 12t - 18$. Cho $a(t) = 0 \\iff 12t - 18 = 0 \\iff t = 1.5\\text{ s}$.'
  },
  {
    id: 9,
    title: 'Câu 9: Gia tốc của con lắc lò xo (Bài 9.17 SGK)',
    pts: 20,
    question: 'Một con lắc lò xo dao động điều hòa theo phương trình $x(t) = 5\\cos(2\\pi t)$ (cm). Gia tốc tức thời của con lắc tại thời điểm $t = 0.5$ giây là:',
    options: [
      { text: '$a(0.5) = 20\\pi^2\\text{ cm/s}^2$', correct: true },
      { text: '$a(0.5) = -20\\pi^2\\text{ cm/s}^2$', correct: false },
      { text: '$a(0.5) = 0\\text{ cm/s}^2$', correct: false },
      { text: '$a(0.5) = 10\\pi\\text{ cm/s}^2$', correct: false }
    ],
    explanation: 'Gia tốc $a(t) = x\'\'(t) = -(2\\pi)^2 \\cdot 5\\cos(2\\pi t) = -20\\pi^2 \\cos(2\\pi t)$. Tại $t = 0.5\\text{ s}$, ta có $\\cos(2\\pi \\cdot 0.5) = \\cos(\\pi) = -1$. Do đó $a(0.5) = -20\\pi^2(-1) = 20\\pi^2\\text{ cm/s}^2$.'
  },
  {
    id: 10,
    title: 'Câu 10: Đạo hàm cấp 3 của hàm phân thức',
    pts: 20,
    question: 'Cho hàm số $y = \\dfrac{1}{x + 1}$ ($x \\ne -1$). Đạo hàm cấp ba $y\'\'\'$ của hàm số là:',
    options: [
      { text: '$y\'\'\' = -\\dfrac{6}{(x + 1)^4}$', correct: true },
      { text: '$y\'\'\' = \\dfrac{6}{(x + 1)^4}$', correct: false },
      { text: '$y\'\'\' = -\\dfrac{2}{(x + 1)^3}$', correct: false },
      { text: '$y\'\'\' = \\dfrac{24}{(x + 1)^4}$', correct: false }
    ],
    explanation: 'Ta có $y = (x+1)^{-1}$. $y\' = -(x+1)^{-2}$, $y\'\' = 2(x+1)^{-3}$, $y\'\'\' = -6(x+1)^{-4} = -\\dfrac{6}{(x + 1)^4}$.'
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

// --- Lab 1: Interactive f(x), f'(x) and f''(x) Curves ---
function initLab1() {
  const canvas = document.getElementById('labCanvas1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const slider = document.getElementById('x0Slider');
  const x0Val = document.getElementById('x0Val');
  const fValOut = document.getElementById('fValOut');
  const fPValOut = document.getElementById('fPValOut');
  const fPPValOut = document.getElementById('fPPValOut');
  const lab1Output = document.getElementById('lab1Output');

  function f(x) {
    return x * x * x - 3 * x;
  }
  function fP(x) {
    return 3 * x * x - 3;
  }
  function fPP(x) {
    return 6 * x;
  }

  function draw() {
    const x0 = parseFloat(slider.value);
    x0Val.textContent = x0.toFixed(1);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const ox = w / 2;
    const oy = h / 2;
    const scaleX = 70;
    const scaleY = 22;

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = -4; x <= 4; x++) {
      ctx.beginPath();
      ctx.moveTo(ox + x * scaleX, 0);
      ctx.lineTo(ox + x * scaleX, h);
      ctx.stroke();
    }
    for (let y = -7; y <= 7; y++) {
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

    // Plot Curves
    // 1. f(x) (Cyan)
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

    // 2. f'(x) (Yellow dashed)
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

    // 3. f''(x) (Purple dotted)
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = 0; px < w; px++) {
      const rx = (px - ox) / scaleX;
      const ry = fPP(rx);
      const py = oy - ry * scaleY;
      if (px === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Point on f(x)
    const y0 = f(x0);
    const p0 = fP(x0);
    const pp0 = fPP(x0);

    const pmx = ox + x0 * scaleX;
    const pmy = oy - y0 * scaleY;

    // Marker
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pmx, pmy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Legend
    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('— f(x) = x³ - 3x', 15, 25);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('--- f\'(x) = 3x² - 3', 15, 45);
    ctx.fillStyle = '#c084fc';
    ctx.fillText('— f\'\'(x) = 6x', 15, 65);

    // Update Text Output
    fValOut.innerHTML = `$f(${x0.toFixed(1)}) = ${y0.toFixed(2)}$`;
    fPValOut.innerHTML = `$f'(${x0.toFixed(1)}) = ${p0.toFixed(2)}$`;
    let concavity = '';
    if (Math.abs(pp0) < 0.1) concavity = '(Điểm uốn: f\'\'(x)=0)';
    else if (pp0 > 0) concavity = '(Bề lõm quay lên trên: f\'\'(x) > 0)';
    else concavity = '(Bề lõm quay xuống dưới: f\'\'(x) < 0)';
    fPPValOut.innerHTML = `$f''(${x0.toFixed(1)}) = ${pp0.toFixed(2)}$ ${concavity}`;
    renderMathInTree(lab1Output);
  }

  slider.addEventListener('input', draw);
  draw();
}

// --- Lab 2: Harmonic Oscillator Simulation ---
function initLab2() {
  const canvas = document.getElementById('labCanvas2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const btnPlay = document.getElementById('btnPlayOsc');
  const btnReset = document.getElementById('btnResetOsc');
  const tVal = document.getElementById('tVal');
  const xOscOut = document.getElementById('xOscOut');
  const vOscOut = document.getElementById('vOscOut');
  const aOscOut = document.getElementById('aOscOut');

  let animId = null;
  let isPlaying = false;
  let t = 0;
  const A = 4; // cm
  const omega = Math.PI; // rad/s

  function drawLab2(curT) {
    tVal.textContent = `${curT.toFixed(2)} s`;
    const x = A * Math.cos(omega * curT);
    const v = -omega * A * Math.sin(omega * curT);
    const a = -omega * omega * x;

    xOscOut.innerHTML = `$x(${curT.toFixed(2)}) = ${x.toFixed(2)}\\text{ cm}$`;
    vOscOut.innerHTML = `$v(${curT.toFixed(2)}) = x'(${curT.toFixed(2)}) = ${v.toFixed(2)}\\text{ cm/s}$`;
    aOscOut.innerHTML = `$a(${curT.toFixed(2)}) = x''(${curT.toFixed(2)}) = ${a.toFixed(2)}\\text{ cm/s}^2$`;
    renderMathInTree(document.getElementById('lab2Output'));

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Physical Oscillator Display (Top half, h=130)
    const wallX = 50;
    const restX = 220;
    const pxPerCm = 25;
    const bobX = restX + x * pxPerCm;
    const bobY = 65;

    // Wall
    ctx.fillStyle = '#64748b';
    ctx.fillRect(wallX - 10, bobY - 40, 10, 80);

    // Spring coils
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(wallX, bobY);
    const coils = 14;
    const springLen = bobX - wallX - 20;
    for (let i = 0; i <= coils; i++) {
      const sx = wallX + (springLen / coils) * i;
      const sy = i === 0 || i === coils ? bobY : bobY + (i % 2 === 0 ? 15 : -15);
      ctx.lineTo(sx, sy);
    }
    ctx.lineTo(bobX - 20, bobY);
    ctx.stroke();

    // Mass Bob
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(bobX, bobY, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Center equilibrium line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(restX, bobY - 45);
    ctx.lineTo(restX, bobY + 45);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('VTCB (x = 0)', restX - 30, bobY + 58);

    // Velocity Vector (Green arrow)
    ctx.strokeStyle = '#34d399';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bobX, bobY - 26);
    const vArrow = v * 5;
    ctx.lineTo(bobX + vArrow, bobY - 26);
    ctx.stroke();
    ctx.fillStyle = '#34d399';
    ctx.fillText(`v = ${v.toFixed(1)} cm/s`, bobX - 20, bobY - 32);

    // Acceleration Vector (Purple arrow)
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(bobX, bobY + 26);
    const aArrow = a * 1.5;
    ctx.lineTo(bobX + aArrow, bobY + 26);
    ctx.stroke();
    ctx.fillStyle = '#c084fc';
    ctx.fillText(`a = ${a.toFixed(1)} cm/s²`, bobX - 20, bobY + 38);

    // Graph Area in bottom half (y: 170 to 320)
    const gy = 250;
    const gw = 440;
    const gx = 50;

    // Axis
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + gw, gy);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('t (s)', gx + gw - 25, gy + 15);

    // Draw real-time oscillating trail
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let px = 0; px <= gw; px++) {
      const pt = curT - (gw - px) * 0.008;
      const pxVal = A * Math.cos(omega * pt);
      const py = gy - pxVal * 12;
      if (px === 0) ctx.moveTo(gx + px, py);
      else ctx.lineTo(gx + px, py);
    }
    ctx.stroke();

    // Marker at current point on graph
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(gx + gw, gy - x * 12, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  function loop() {
    if (!isPlaying) return;
    t += 0.02;
    drawLab2(t);
    animId = requestAnimationFrame(loop);
  }

  btnPlay.addEventListener('click', () => {
    audio.playClick();
    if (isPlaying) {
      isPlaying = false;
      btnPlay.textContent = '▶️ Bắt đầu dao động';
      if (animId) cancelAnimationFrame(animId);
    } else {
      isPlaying = true;
      btnPlay.textContent = '⏸️ Tạm dừng';
      loop();
    }
  });

  btnReset.addEventListener('click', () => {
    audio.playClick();
    isPlaying = false;
    if (animId) cancelAnimationFrame(animId);
    t = 0;
    btnPlay.textContent = '▶️ Bắt đầu dao động';
    drawLab2(0);
  });

  drawLab2(0);
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
