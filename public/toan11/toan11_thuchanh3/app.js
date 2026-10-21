// App Logic for Hoạt động thực hành trải nghiệm 3: Mô hình hàm số mũ & lôgarit - Toán 11 KNTT

// --- State Management ---
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nhà Mô Hình Hóa Dữ Liệu',
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

// --- Quiz Data (10 Bài toán ứng dụng mô hình mũ & logarit) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1: Dự báo dân số sau 10 năm',
    pts: 20,
    question: 'Dân số một quốc gia năm 2020 là $100$ triệu người, tốc độ tăng dân số là $r = 1.2\\%$/năm theo mô hình $N(t) = N_0 e^{rt}$. Dự báo dân số nước này vào năm 2030 (sau 10 năm) xấp xỉ là:',
    options: [
      { text: '$112.75\\text{ triệu người}$', correct: true },
      { text: '$110.50\\text{ triệu người}$', correct: false },
      { text: '$120.00\\text{ triệu người}$', correct: false },
      { text: '$115.30\\text{ triệu người}$', correct: false }
    ],
    explanation: 'Với $N_0 = 100$, $r = 0.012$, sau $t = 10$ năm: $N(10) = 100 \\cdot e^{0.012 \\times 10} = 100 \\cdot e^{0.12} \\approx 100 \\cdot 1.127497 = 112.75\\text{ triệu người}$.'
  },
  {
    id: 2,
    title: 'Câu 2: Thời gian nhân đôi dân số',
    pts: 20,
    question: 'Một thành phố có tỉ lệ tăng dân số là $r = 1.4\\%$/năm. Hỏi sau khoảng bao nhiêu năm thì dân số thành phố sẽ tăng gấp đôi?',
    options: [
      { text: '$49.5\\text{ năm}$', correct: true },
      { text: '$71.4\\text{ năm}$', correct: false },
      { text: '$35.2\\text{ năm}$', correct: false },
      { text: '$50.0\\text{ năm}$', correct: false }
    ],
    explanation: 'Công thức thời gian tăng gấp đôi: $T = \\dfrac{\\ln 2}{r} = \\dfrac{\\ln 2}{0.014} \\approx \\dfrac{0.69315}{0.014} \\approx 49.51\\text{ năm}$.'
  },
  {
    id: 3,
    title: 'Câu 3: Định tuổi mẫu gỗ có 50% Carbon-14',
    pts: 20,
    question: 'Một mẫu gỗ cổ được khai quật có hàm lượng đồng vị $^{14}\\text{C}$ bằng $50\\%$ lượng $^{14}\\text{C}$ ban đầu trong sinh vật sống. Biết chu kì bán rã của $^{14}\\text{C}$ là $5730$ năm, tuổi của mẫu gỗ là:',
    options: [
      { text: '$5730\\text{ năm}$', correct: true },
      { text: '$2865\\text{ năm}$', correct: false },
      { text: '$11460\\text{ năm}$', correct: false },
      { text: '$8267\\text{ năm}$', correct: false }
    ],
    explanation: 'Lượng chất còn lại $50\\% = \\dfrac{1}{2}$ chính là định nghĩa của một chu kì bán rã. Do đó tuổi của mẫu gỗ đúng bằng $5730$ năm.'
  },
  {
    id: 4,
    title: 'Câu 4: Hóa thạch còn 25% Carbon-14',
    pts: 20,
    question: 'Một mẫu xương động vật hóa thạch chỉ còn chứa $25\\%$ lượng $^{14}\\text{C}$ so với ban đầu. Tuổi của mẫu xương này khoảng:',
    options: [
      { text: '$11460\\text{ năm}$', correct: true },
      { text: '$5730\\text{ năm}$', correct: false },
      { text: '$22920\\text{ năm}$', correct: false },
      { text: '$17190\\text{ năm}$', correct: false }
    ],
    explanation: 'Ta có $25\\% = \\dfrac{1}{4} = \\left(\\dfrac{1}{2}\\right)^2$, nghĩa là đã trải qua đúng $2$ chu kì bán rã. Vậy tuổi của mẫu xương là $2 \\times 5730 = 11460\\text{ năm}$.'
  },
  {
    id: 5,
    title: 'Câu 5: Niên đại thuyền cổ còn 70% Carbon-14',
    pts: 20,
    question: 'Khảo sát một chiếc thuyền gỗ cổ phát hiện lượng $^{14}\\text{C}$ còn lại là $70\\%$. Cho biết $\\ln(0.7) \\approx -0.3567$, tuổi của chiếc thuyền gỗ xấp xỉ là:',
    options: [
      { text: '$2949\\text{ năm}$', correct: true },
      { text: '$4011\\text{ năm}$', correct: false },
      { text: '$1719\\text{ năm}$', correct: false },
      { text: '$5730\\text{ năm}$', correct: false }
    ],
    explanation: 'Áp dụng công thức: $t = -\\dfrac{5730}{\\ln 2} \\ln(0.7) \\approx -8267 \\times (-0.3567) \\approx 2948.8\\text{ năm} \\approx 2949\\text{ năm}$.'
  },
  {
    id: 6,
    title: 'Câu 6: So sánh biên độ động đất theo thang Richter',
    pts: 20,
    question: 'Một trận động đất ở Nhật Bản mạnh $7$ độ Richter ($M_1 = 7$) và một trận động đất ở Việt Nam mạnh $5$ độ Richter ($M_2 = 5$). Biên độ dao động của trận ở Nhật gấp trận ở Việt Nam bao nhiêu lần?',
    options: [
      { text: '$100\\text{ lần}$', correct: true },
      { text: '$2\\text{ lần}$', correct: false },
      { text: '$20\\text{ lần}$', correct: false },
      { text: '$1000\\text{ lần}$', correct: false }
    ],
    explanation: 'Theo định nghĩa độ Richter: $M = \\log\\left(\\dfrac{A}{A_0}\\right) \\implies \\dfrac{A_1}{A_2} = 10^{M_1 - M_2} = 10^{7 - 5} = 10^2 = 100\\text{ lần}$.'
  },
  {
    id: 7,
    title: 'Câu 7: Năng lượng giải phóng của động đất',
    pts: 20,
    question: 'Năng lượng giải phóng của trận động đất tỉ lệ với $10^{1.5M}$. Một trận động đất $8$ độ Richter giải phóng năng lượng gấp bao nhiêu lần trận động đất $6$ độ Richter?',
    options: [
      { text: '$1000\\text{ lần}$', correct: true },
      { text: '$100\\text{ lần}$', correct: false },
      { text: '$31.6\\text{ lần}$', correct: false },
      { text: '$10000\\text{ lần}$', correct: false }
    ],
    explanation: 'Tỉ số năng lượng: $\\dfrac{E_1}{E_2} = 10^{1.5(M_1 - M_2)} = 10^{1.5(8 - 6)} = 10^{1.5 \\times 2} = 10^3 = 1000\\text{ lần}$.'
  },
  {
    id: 8,
    title: 'Câu 8: Mức cường độ âm theo Decibel',
    pts: 20,
    question: 'Tiếng thì thầm trong phòng có cường độ âm $I = 10^{-10}\\text{ W/m}^2$. Biết ngưỡng nghe $I_0 = 10^{-12}\\text{ W/m}^2$, mức cường độ âm của tiếng thì thầm là:',
    options: [
      { text: '$20\\text{ dB}$', correct: true },
      { text: '$10\\text{ dB}$', correct: false },
      { text: '$40\\text{ dB}$', correct: false },
      { text: '$100\\text{ dB}$', correct: false }
    ],
    explanation: 'Áp dụng công thức mức cường độ âm: $L = 10 \\log\\left(\\dfrac{I}{I_0}\\right) = 10 \\log\\left(\\dfrac{10^{-10}}{10^{-12}}\\right) = 10 \\log(10^2) = 10 \\times 2 = 20\\text{ dB}$.'
  },
  {
    id: 9,
    title: 'Câu 9: Nồng độ ion hiđrô theo thang đo pH',
    pts: 20,
    question: 'Một loại nước giải khát có độ $\\text{pH} = 3.0$. Nồng độ ion hiđrô $[H^+]$ trong dung dịch này là:',
    options: [
      { text: '$10^{-3}\\text{ mol/L}$', correct: true },
      { text: '$10^3\\text{ mol/L}$', correct: false },
      { text: '$3.0\\text{ mol/L}$', correct: false },
      { text: '$10^{-11}\\text{ mol/L}$', correct: false }
    ],
    explanation: 'Từ định nghĩa $\\text{pH} = -\\log[H^+]$, ta suy ra $[H^+] = 10^{-\\text{pH}} = 10^{-3.0} = 10^{-3}\\text{ mol/L}$ (tức $0.001\\text{ mol/L}$).'
  },
  {
    id: 10,
    title: 'Câu 10: Tính lãi kép liên tục',
    pts: 20,
    question: 'Bác Nam gửi tiết kiệm $100$ triệu đồng vào ngân hàng với lãi suất $6\\%$/năm gộp lãi liên tục theo công thức $A = P e^{rt}$. Sau $5$ năm, số tiền cả gốc và lãi bác Nam nhận được khoảng:',
    options: [
      { text: '$135\\text{ triệu đồng}$', correct: true },
      { text: '$130\\text{ triệu đồng}$', correct: false },
      { text: '$145\\text{ triệu đồng}$', correct: false },
      { text: '$160\\text{ triệu đồng}$', correct: false }
    ],
    explanation: 'Với $P = 100$, $r = 0.06$, $t = 5$: $A = 100 \\cdot e^{0.06 \\times 5} = 100 \\cdot e^{0.30} \\approx 100 \\times 1.34986 = 134.99\\text{ triệu đồng} \\approx 135\\text{ triệu đồng}$.'
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

// --- Lab 1: Population Growth Simulator ---
function initLab1() {
  const canvas = document.getElementById('labCanvas1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const n0Slider = document.getElementById('n0Slider');
  const rSlider = document.getElementById('rSlider');
  const n0Val = document.getElementById('n0Val');
  const rVal = document.getElementById('rVal');
  const doublingTimeOut = document.getElementById('doublingTimeOut');
  const pop20Out = document.getElementById('pop20Out');
  const pop50Out = document.getElementById('pop50Out');
  const lab1Output = document.getElementById('lab1Output');

  function draw() {
    const n0 = parseFloat(n0Slider.value);
    const rPct = parseFloat(rSlider.value);
    const r = rPct / 100;

    n0Val.textContent = `${n0} tr`;
    rVal.textContent = `${rPct.toFixed(1)}%`;

    const dTime = Math.log(2) / r;
    const n20 = n0 * Math.exp(r * 20);
    const n50 = n0 * Math.exp(r * 50);

    doublingTimeOut.innerHTML = `$T = ${dTime.toFixed(1)}\\text{ năm}$`;
    pop20Out.innerHTML = `$N(20) = ${n20.toFixed(1)}\\text{ triệu người}$`;
    pop50Out.innerHTML = `$N(50) = ${n50.toFixed(1)}\\text{ triệu người}$`;
    renderMathInTree(lab1Output);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const ox = 60;
    const oy = h - 50;
    const maxT = 60; // 60 years
    const maxN = Math.max(400, n50 * 1.2);
    const scaleX = (w - ox - 40) / maxT;
    const scaleY = (oy - 40) / maxN;

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let t = 10; t <= maxT; t += 10) {
      const px = ox + t * scaleX;
      ctx.beginPath();
      ctx.moveTo(px, oy);
      ctx.lineTo(px, 30);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`${t}n`, px - 8, oy + 16);
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(w - 20, oy);
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, 25);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Năm t', w - 50, oy + 18);
    ctx.fillText('N (triệu)', ox - 50, 20);

    // Exponential Curve N(t)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let t = 0; t <= maxT; t += 0.5) {
      const curN = n0 * Math.exp(r * t);
      const px = ox + t * scaleX;
      const py = oy - curN * scaleY;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Doubling point marker
    if (dTime <= maxT) {
      const dPx = ox + dTime * scaleX;
      const dPy = oy - 2 * n0 * scaleY;

      ctx.strokeStyle = '#f59e0b';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(dPx, oy);
      ctx.lineTo(dPx, dPy);
      ctx.lineTo(ox, dPy);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(dPx, dPy, 6, 0, Math.PI * 2);
      ctx.fill();

      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`Gấp đôi (${(2 * n0).toFixed(0)}tr) tại T = ${dTime.toFixed(1)} năm`, dPx - 60, dPy - 12);
    }

    // Legend
    ctx.fillStyle = '#38bdf8';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(`— N(t) = ${n0} · e^{${r.toFixed(3)}t}`, ox + 20, 50);
  }

  n0Slider.addEventListener('input', draw);
  rSlider.addEventListener('input', draw);
  draw();
}

// --- Lab 2: Carbon-14 Dating Virtual Machine ---
function initLab2() {
  const canvas = document.getElementById('labCanvas2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const slider = document.getElementById('c14Slider');
  const c14PercentVal = document.getElementById('c14PercentVal');
  const c14AgeOut = document.getElementById('c14AgeOut');
  const c14EraOut = document.getElementById('c14EraOut');
  const lab2Output = document.getElementById('lab2Output');

  function draw() {
    const pct = parseFloat(slider.value);
    c14PercentVal.textContent = `${pct.toFixed(1)}%`;

    const frac = pct / 100;
    const age = -8267 * Math.log(frac);

    c14AgeOut.innerHTML = `$t \\approx ${Math.round(age)}\\text{ năm}$`;

    let era = '';
    if (age < 500) era = 'Thời cận - hiện đại (thế kỉ 16 - nay)';
    else if (age < 1500) era = 'Thời kì Trung đại / Phong kiến';
    else if (age < 3000) era = 'Thời kì Cổ đại / Văn minh đồ đồng';
    else if (age < 6000) era = 'Thời kì Đồ Đá Mới / Kim Tự Tháp Cổ Ai Cập';
    else if (age < 15000) era = 'Kỷ băng hà cuối cùng / Người Cromagnon';
    else era = 'Thời tiền sử xa xưa (> 15,000 năm trước)';

    c14EraOut.textContent = era;
    renderMathInTree(lab2Output);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    const ox = 60;
    const oy = h - 50;
    const maxT = 25000; // 25000 years
    const scaleX = (w - ox - 40) / maxT;
    const scaleY = (oy - 40) / 100; // 100%

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let t = 5000; t <= maxT; t += 5000) {
      const px = ox + t * scaleX;
      ctx.beginPath();
      ctx.moveTo(px, oy);
      ctx.lineTo(px, 30);
      ctx.stroke();
      ctx.fillStyle = '#94a3b8';
      ctx.font = '10px Inter, sans-serif';
      ctx.fillText(`${t / 1000}k năm`, px - 16, oy + 16);
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(w - 20, oy);
    ctx.moveTo(ox, oy);
    ctx.lineTo(ox, 25);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Tuổi (năm)', w - 65, oy + 18);
    ctx.fillText('% ¹⁴C còn lại', ox - 50, 20);

    // Decay Curve
    ctx.strokeStyle = '#4ade80';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let t = 0; t <= maxT; t += 200) {
      const p = 100 * Math.pow(0.5, t / 5730);
      const px = ox + t * scaleX;
      const py = oy - p * scaleY;
      if (t === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Current point marker
    const curPx = ox + Math.min(maxT, age) * scaleX;
    const curPy = oy - pct * scaleY;

    ctx.strokeStyle = '#f59e0b';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(curPx, oy);
    ctx.lineTo(curPx, curPy);
    ctx.lineTo(ox, curPy);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(curPx, curPy, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Marker Label
    ctx.fillStyle = '#fff';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`${pct}% ¹⁴C ➔ ${Math.round(age)} năm`, curPx + 10, curPy - 8);
  }

  slider.addEventListener('input', draw);
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
