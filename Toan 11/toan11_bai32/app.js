// App Logic for Bài 32: Các quy tắc tính đạo hàm - Toán 11 KNTT

// --- State Management ---
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Quy Tắc Đạo Hàm',
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

// --- Quiz Data (10 Questions bám sát SGK 9.6 - 9.12) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1: Đạo hàm hàm đa thức & căn thức (Bài 9.6a SGK)',
    pts: 20,
    question: 'Tính đạo hàm của hàm số $y = x^5 - 3x^2 + 2\\sqrt{x}$ với $x > 0$:',
    options: [
      { text: '$y\' = 5x^4 - 6x + \\dfrac{1}{\\sqrt{x}}$', correct: true },
      { text: '$y\' = 5x^4 - 6x + \\dfrac{2}{\\sqrt{x}}$', correct: false },
      { text: '$y\' = 5x^4 - 3x + \\dfrac{1}{2\\sqrt{x}}$', correct: false },
      { text: '$y\' = x^4 - 6x + \\dfrac{1}{\\sqrt{x}}$', correct: false }
    ],
    explanation: 'Áp dụng quy tắc đạo hàm của tổng và hiệu: $(x^5)\' = 5x^4$, $(-3x^2)\' = -6x$, $(2\\sqrt{x})\' = 2 \\cdot \\dfrac{1}{2\\sqrt{x}} = \\dfrac{1}{\\sqrt{x}}$. Vậy $y\' = 5x^4 - 6x + \\dfrac{1}{\\sqrt{x}}$.'
  },
  {
    id: 2,
    title: 'Câu 2: Đạo hàm hàm phân thức hữu tỉ bậc nhất (Bài 9.6b SGK)',
    pts: 20,
    question: 'Đạo hàm của hàm số $y = \\dfrac{2x - 1}{x + 1}$ ($x \\ne -1$) là:',
    options: [
      { text: '$y\' = \\dfrac{3}{(x + 1)^2}$', correct: true },
      { text: '$y\' = \\dfrac{1}{(x + 1)^2}$', correct: false },
      { text: '$y\' = \\dfrac{-3}{(x + 1)^2}$', correct: false },
      { text: '$y\' = \\dfrac{2x + 1}{(x + 1)^2}$', correct: false }
    ],
    explanation: 'Áp dụng công thức tính nhanh $\\left(\\dfrac{ax + b}{cx + d}\\right)\' = \\dfrac{ad - bc}{(cx + d)^2}$: Ở đây $a=2, b=-1, c=1, d=1 \\implies ad - bc = 2(1) - (-1)(1) = 3$. Vậy $y\' = \\dfrac{3}{(x + 1)^2}$.'
  },
  {
    id: 3,
    title: 'Câu 3: Đạo hàm của tích hai hàm số (Bài 9.6c SGK)',
    pts: 20,
    question: 'Đạo hàm của hàm số $y = (x^2 + 1)\\cos x$ là:',
    options: [
      { text: '$y\' = 2x \\cos x - (x^2 + 1)\\sin x$', correct: true },
      { text: '$y\' = 2x \\cos x + (x^2 + 1)\\sin x$', correct: false },
      { text: '$y\' = 2x \\cos x - (x^2 + 1)\\cos x$', correct: false },
      { text: '$y\' = -2x \\sin x$', correct: false }
    ],
    explanation: 'Áp dụng quy tắc nhân $(u \\cdot v)\' = u\'v + uv\'$: Với $u = x^2 + 1 \\implies u\' = 2x$ và $v = \\cos x \\implies v\' = -\\sin x$. Do đó $y\' = 2x \\cos x + (x^2 + 1)(-\\sin x) = 2x \\cos x - (x^2 + 1)\\sin x$.'
  },
  {
    id: 4,
    title: 'Câu 4: Đạo hàm của thương chứa lượng giác (Bài 9.6d SGK)',
    pts: 20,
    question: 'Tính đạo hàm của hàm số $y = \\dfrac{\\sin x}{x}$ với $x \\ne 0$:',
    options: [
      { text: '$y\' = \\dfrac{x \\cos x - \\sin x}{x^2}$', correct: true },
      { text: '$y\' = \\dfrac{\\cos x - \\sin x}{x^2}$', correct: false },
      { text: '$y\' = \\dfrac{x \\cos x + \\sin x}{x^2}$', correct: false },
      { text: '$y\' = \\dfrac{\\cos x}{x^2}$', correct: false }
    ],
    explanation: 'Áp dụng quy tắc chia $\\left(\\dfrac{u}{v}\\right)\' = \\dfrac{u\'v - uv\'}{v^2}$: Với $u = \\sin x \\implies u\' = \\cos x$, $v = x \\implies v\' = 1$. Suy ra $y\' = \\dfrac{(\\cos x) \\cdot x - (\\sin x) \\cdot 1}{x^2} = \\dfrac{x \\cos x - \\sin x}{x^2}$.'
  },
  {
    id: 5,
    title: 'Câu 5: Đạo hàm hàm hợp lượng giác (Bài 9.7a SGK)',
    pts: 20,
    question: 'Đạo hàm của hàm số $y = \\sin(2x + 1)$ là:',
    options: [
      { text: '$y\' = 2\\cos(2x + 1)$', correct: true },
      { text: '$y\' = \\cos(2x + 1)$', correct: false },
      { text: '$y\' = -2\\cos(2x + 1)$', correct: false },
      { text: '$y\' = 2\\sin(2x + 1)$', correct: false }
    ],
    explanation: 'Đặt $u = 2x + 1 \\implies u\' = 2$. Áp dụng công thức đạo hàm hàm hợp $(\\sin u)\' = u\' \\cdot \\cos u$, ta có $y\' = 2\\cos(2x + 1)$.'
  },
  {
    id: 6,
    title: 'Câu 6: Đạo hàm hàm căn hợp (Bài 9.7c SGK)',
    pts: 20,
    question: 'Đạo hàm của hàm số $y = \\sqrt{x^2 + 2x + 3}$ là:',
    options: [
      { text: '$y\' = \\dfrac{x + 1}{\\sqrt{x^2 + 2x + 3}}$', correct: true },
      { text: '$y\' = \\dfrac{2x + 2}{\\sqrt{x^2 + 2x + 3}}$', correct: false },
      { text: '$y\' = \\dfrac{1}{2\\sqrt{x^2 + 2x + 3}}$', correct: false },
      { text: '$y\' = \\dfrac{x + 1}{2\\sqrt{x^2 + 2x + 3}}$', correct: false }
    ],
    explanation: 'Áp dụng công thức $(\\sqrt{u})\' = \\dfrac{u\'}{2\\sqrt{u}}$ với $u = x^2 + 2x + 3 > 0$ với mọi $x$: $u\' = 2x + 2$. Khi đó $y\' = \\dfrac{2x + 2}{2\\sqrt{x^2 + 2x + 3}} = \\dfrac{x + 1}{\\sqrt{x^2 + 2x + 3}}$.'
  },
  {
    id: 7,
    title: 'Câu 7: Đạo hàm hàm số mũ & logarit (Bài 9.8a SGK)',
    pts: 20,
    question: 'Đạo hàm của hàm số $y = 3^x \\cdot \\ln x$ ($x > 0$) là:',
    options: [
      { text: '$y\' = 3^x \\left(\\ln 3 \\cdot \\ln x + \\dfrac{1}{x}\\right)$', correct: true },
      { text: '$y\' = 3^x \\left(\\ln x + \\dfrac{1}{x}\\right)$', correct: false },
      { text: '$y\' = x \\cdot 3^{x-1} \\ln x + \\dfrac{3^x}{x}$', correct: false },
      { text: '$y\' = 3^x \\cdot \\dfrac{\\ln 3}{x}$', correct: false }
    ],
    explanation: 'Áp dụng quy tắc nhân $(u \\cdot v)\' = u\'v + uv\'$: Với $u = 3^x \\implies u\' = 3^x \\ln 3$, và $v = \\ln x \\implies v\' = \\dfrac{1}{x}$. Do đó $y\' = 3^x \\ln 3 \\cdot \\ln x + 3^x \\cdot \\dfrac{1}{x} = 3^x \\left(\\ln 3 \\cdot \\ln x + \\dfrac{1}{x}\\right)$.'
  },
  {
    id: 8,
    title: 'Câu 8: Đạo hàm hàm hợp logarit (Bài 9.8c SGK)',
    pts: 20,
    question: 'Đạo hàm của hàm số $y = \\log_2(x^2 + 1)$ là:',
    options: [
      { text: '$y\' = \\dfrac{2x}{(x^2 + 1)\\ln 2}$', correct: true },
      { text: '$y\' = \\dfrac{2x}{x^2 + 1}$', correct: false },
      { text: '$y\' = \\dfrac{1}{(x^2 + 1)\\ln 2}$', correct: false },
      { text: '$y\' = \\dfrac{2x \\ln 2}{x^2 + 1}$', correct: false }
    ],
    explanation: 'Áp dụng công thức đạo hàm hàm hợp $(\\log_a u)\' = \\dfrac{u\'}{u \\ln a}$: Với $u = x^2 + 1 \\implies u\' = 2x$. Vậy $y\' = \\dfrac{2x}{(x^2 + 1)\\ln 2}$.'
  },
  {
    id: 9,
    title: 'Câu 9: Ứng dụng vận tốc tức thời (Bài 9.9 SGK)',
    pts: 20,
    question: 'Một vật chuyển động thẳng có phương trình $s(t) = 3t^3 - t^2 + 2t + 1$ ($t$ tính bằng giây, $s$ tính bằng mét). Vận tốc tức thời của vật tại thời điểm $t = 2$ giây là:',
    options: [
      { text: '$v(2) = 34\\text{ m/s}$', correct: true },
      { text: '$v(2) = 38\\text{ m/s}$', correct: false },
      { text: '$v(2) = 25\\text{ m/s}$', correct: false },
      { text: '$v(2) = 42\\text{ m/s}$', correct: false }
    ],
    explanation: 'Vận tốc tức thời là đạo hàm của quãng đường: $v(t) = s\'(t) = (3t^3 - t^2 + 2t + 1)\' = 9t^2 - 2t + 2$. Tại thời điểm $t = 2$: $v(2) = 9(2^2) - 2(2) + 2 = 36 - 4 + 2 = 34\\text{ m/s}$.'
  },
  {
    id: 10,
    title: 'Câu 10: Hệ số góc của tiếp tuyến (Bài 9.10 SGK)',
    pts: 20,
    question: 'Hệ số góc của tiếp tuyến của đồ thị hàm số $y = \\dfrac{x + 2}{x - 1}$ tại điểm có hoành độ $x_0 = 2$ là:',
    options: [
      { text: '$k = -3$', correct: true },
      { text: '$k = 3$', correct: false },
      { text: '$k = -1$', correct: false },
      { text: '$k = 1$', correct: false }
    ],
    explanation: 'Ta có $y\' = \\dfrac{1(-1) - 2(1)}{(x - 1)^2} = \\dfrac{-3}{(x - 1)^2}$. Hệ số góc của tiếp tuyến tại $x_0 = 2$ là $k = y\'(2) = \\dfrac{-3}{(2 - 1)^2} = -3$.'
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

  // Update Badges
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

  quizData.forEach((q, idx) => {
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

// --- Lab 1: Interactive Tangent & Derivatives ---
function initLab1() {
  const canvas = document.getElementById('labCanvas1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const funcSelect = document.getElementById('funcSelect');
  const slider = document.getElementById('x0Slider');
  const x0Val = document.getElementById('x0Val');
  const fExpr = document.getElementById('fExpr');
  const fPrimeExpr = document.getElementById('fPrimeExpr');
  const lab1Output = document.getElementById('lab1Output');

  function getFunc(type, x) {
    switch (type) {
      case 'cubic':
        return (x * x * x) / 3 - x;
      case 'sin':
        return Math.sin(2 * x);
      case 'exp':
        return Math.exp(0.5 * x);
      case 'rational':
        return (2 * x - 1) / (x + 2);
      default:
        return x * x;
    }
  }

  function getDeriv(type, x) {
    switch (type) {
      case 'cubic':
        return x * x - 1;
      case 'sin':
        return 2 * Math.cos(2 * x);
      case 'exp':
        return 0.5 * Math.exp(0.5 * x);
      case 'rational':
        return 5 / Math.pow(x + 2, 2);
      default:
        return 2 * x;
    }
  }

  function draw() {
    const type = funcSelect.value;
    const x0 = parseFloat(slider.value);
    x0Val.textContent = x0.toFixed(1);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Coordinate system: center (w/2, h/2), scale 45 px per unit
    const ox = w / 2;
    const oy = h / 2;
    const scale = 45;

    // Grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = -6; x <= 6; x++) {
      ctx.beginPath();
      ctx.moveTo(ox + x * scale, 0);
      ctx.lineTo(ox + x * scale, h);
      ctx.stroke();
    }
    for (let y = -4; y <= 4; y++) {
      ctx.beginPath();
      ctx.moveTo(0, oy - y * scale);
      ctx.lineTo(w, oy - y * scale);
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

    // Plot Function f(x)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let started = false;
    for (let px = 0; px < w; px++) {
      const rx = (px - ox) / scale;
      if (type === 'rational' && Math.abs(rx + 2) < 0.1) {
        started = false;
        continue;
      }
      const ry = getFunc(type, rx);
      const py = oy - ry * scale;
      if (!isFinite(py) || py < -100 || py > h + 100) {
        started = false;
        continue;
      }
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Tangent Line at x0
    const y0 = getFunc(type, x0);
    const k = getDeriv(type, x0);

    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    const tSpan = 4;
    const px1 = ox + (x0 - tSpan) * scale;
    const py1 = oy - (y0 - k * tSpan) * scale;
    const px2 = ox + (x0 + tSpan) * scale;
    const py2 = oy - (y0 + k * tSpan) * scale;
    ctx.moveTo(px1, py1);
    ctx.lineTo(px2, py2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Point M0(x0, y0)
    const pmx = ox + x0 * scale;
    const pmy = oy - y0 * scale;
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(pmx, pmy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Update Text Output
    let fText = '', fPText = '';
    if (type === 'cubic') {
      fText = '$f(x) = \\dfrac{1}{3}x^3 - x$';
      fPText = '$f\'(x) = x^2 - 1$';
    } else if (type === 'sin') {
      fText = '$f(x) = \\sin(2x)$';
      fPText = '$f\'(x) = 2\\cos(2x)$';
    } else if (type === 'exp') {
      fText = '$f(x) = e^{0.5x}$';
      fPText = '$f\'(x) = 0.5e^{0.5x}$';
    } else if (type === 'rational') {
      fText = '$f(x) = \\dfrac{2x - 1}{x + 2}$';
      fPText = '$f\'(x) = \\dfrac{5}{(x + 2)^2}$';
    }
    fExpr.innerHTML = fText;
    fPrimeExpr.innerHTML = fPText;

    const slopeDesc = Math.abs(k) < 0.05 ? '(tiếp tuyến nằm ngang)' : (k > 0 ? '(hàm đồng biến tại x₀)' : '(hàm nghịch biến tại x₀)');
    lab1Output.querySelector('p:nth-child(3)').innerHTML = `Tại $x_0 = ${x0.toFixed(1)}$: $f(${x0.toFixed(1)}) = ${y0.toFixed(2)}$, hệ số góc tiếp tuyến $k = f'(${x0.toFixed(1)}) = ${k.toFixed(2)}$ ${slopeDesc}`;
    renderMathInTree(lab1Output);
  }

  funcSelect.addEventListener('change', draw);
  slider.addEventListener('input', draw);
  draw();
}

// --- Lab 2: Free Fall & Derivative Velocity Simulation ---
function initLab2() {
  const canvas = document.getElementById('labCanvas2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const btnPlay = document.getElementById('btnPlayMotion');
  const btnReset = document.getElementById('btnResetMotion');
  const slider = document.getElementById('tSlider');
  const tVal = document.getElementById('tVal');
  const hOutput = document.getElementById('hOutput');
  const vOutput = document.getElementById('vOutput');
  const motionStatus = document.getElementById('motionStatus');

  let animId = null;
  let isPlaying = false;
  let simTime = 0;

  function getH(t) {
    return Math.max(0, -5 * t * t + 20 * t);
  }
  function getV(t) {
    return -10 * t + 20;
  }

  function drawLab2(t) {
    const h = getH(t);
    const v = getV(t);

    tVal.textContent = `${t.toFixed(2)} s`;
    slider.value = t;

    hOutput.innerHTML = `$h(${t.toFixed(2)}) = ${h.toFixed(1)}\\text{ m}$`;
    vOutput.innerHTML = `$v(${t.toFixed(2)}) = h'(${t.toFixed(2)}) = ${v.toFixed(1)}\\text{ m/s}$`;
    renderMathInTree(document.getElementById('lab2Output'));

    if (t <= 0.01) {
      motionStatus.textContent = 'Bắt đầu phóng lên';
      motionStatus.style.color = '#38bdf8';
    } else if (v > 0.5) {
      motionStatus.textContent = 'Đang bay lên (v > 0)';
      motionStatus.style.color = '#34d399';
    } else if (Math.abs(v) <= 0.5) {
      motionStatus.textContent = 'Đạt đỉnh cao nhất (v = 0, h_max = 20m)';
      motionStatus.style.color = '#f59e0b';
    } else if (t < 4.0) {
      motionStatus.textContent = 'Đang rơi xuống (v < 0)';
      motionStatus.style.color = '#fb7185';
    } else {
      motionStatus.textContent = 'Chạm đất (h = 0m)';
      motionStatus.style.color = '#a855f7';
    }

    const w = canvas.width;
    const ch = canvas.height;
    ctx.clearRect(0, 0, w, ch);

    // Split Canvas: Left is Real Motion (x = 100), Right is Graph (x = 220 to 500)
    // Ground line
    const groundY = ch - 50;
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(30, groundY);
    ctx.lineTo(180, groundY);
    ctx.stroke();

    // Height Scale: 20m corresponds to 220px
    const scaleH = 220 / 20;
    const ballY = groundY - h * scaleH;

    // Rocket / Ball
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(105, ballY, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Velocity Vector Arrow on Ball
    ctx.strokeStyle = v >= 0 ? '#34d399' : '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(105, ballY);
    const arrowLen = -v * 2.5; // v > 0 points UP
    ctx.lineTo(105, ballY + arrowLen);
    ctx.stroke();

    // Arrowhead
    if (Math.abs(v) > 1) {
      const headDir = v > 0 ? -1 : 1;
      ctx.beginPath();
      ctx.moveTo(105, ballY + arrowLen);
      ctx.lineTo(99, ballY + arrowLen - headDir * 8);
      ctx.lineTo(111, ballY + arrowLen - headDir * 8);
      ctx.closePath();
      ctx.fillStyle = ctx.strokeStyle;
      ctx.fill();
    }

    ctx.fillStyle = '#fff';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(`h = ${h.toFixed(1)}m`, 130, ballY + 4);
    ctx.fillText(`v = ${v.toFixed(1)}m/s`, 130, ballY + 20);

    // Right Side: Parabola Graph h(t) vs t
    const gx = 220;
    const gy = groundY;
    const gw = 280;
    const gh = 240;

    // Graph Axis
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx + gw, gy); // t axis
    ctx.moveTo(gx, gy);
    ctx.lineTo(gx, gy - gh); // h axis
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('t (s)', gx + gw - 25, gy + 20);
    ctx.fillText('h (m)', gx - 35, gy - gh + 15);
    ctx.fillText('0', gx - 10, gy + 15);
    ctx.fillText('2s', gx + (gw * 2) / 4 - 8, gy + 18);
    ctx.fillText('4s', gx + gw - 15, gy + 18);
    ctx.fillText('20m', gx - 32, gy - 200 + 4);

    // Plot Parabola
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let px = 0; px <= gw; px++) {
      const pt = (px / gw) * 4;
      const ph = getH(pt);
      const py = gy - ph * scaleH;
      if (px === 0) ctx.moveTo(gx + px, py);
      else ctx.lineTo(gx + px, py);
    }
    ctx.stroke();

    // Tangent Line on Graph at t
    const curPx = gx + (t / 4) * gw;
    const curPy = gy - h * scaleH;

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(curPx, curPy, 5, 0, Math.PI * 2);
    ctx.fill();

    // Slope line on graph
    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    const dSpan = 40;
    // Slope dt/dh mapping
    const slopeScale = (v * scaleH) / (gw / 4);
    ctx.moveTo(curPx - dSpan, curPy + dSpan * slopeScale);
    ctx.lineTo(curPx + dSpan, curPy - dSpan * slopeScale);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  function loop() {
    if (!isPlaying) return;
    simTime += 0.03;
    if (simTime >= 4) {
      simTime = 4;
      isPlaying = false;
      btnPlay.textContent = '▶️ Chạy mô phỏng';
    }
    drawLab2(simTime);
    if (isPlaying) {
      animId = requestAnimationFrame(loop);
    }
  }

  btnPlay.addEventListener('click', () => {
    audio.playClick();
    if (isPlaying) {
      isPlaying = false;
      btnPlay.textContent = '▶️ Chạy mô phỏng';
      if (animId) cancelAnimationFrame(animId);
    } else {
      if (simTime >= 4) simTime = 0;
      isPlaying = true;
      btnPlay.textContent = '⏸️ Tạm dừng';
      loop();
    }
  });

  btnReset.addEventListener('click', () => {
    audio.playClick();
    isPlaying = false;
    if (animId) cancelAnimationFrame(animId);
    simTime = 0;
    btnPlay.textContent = '▶️ Chạy mô phỏng';
    drawLab2(0);
  });

  slider.addEventListener('input', e => {
    isPlaying = false;
    if (animId) cancelAnimationFrame(animId);
    btnPlay.textContent = '▶️ Chạy mô phỏng';
    simTime = parseFloat(e.target.value);
    drawLab2(simTime);
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
