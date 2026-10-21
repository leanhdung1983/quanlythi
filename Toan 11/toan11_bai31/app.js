// ==========================================================================
// BÀI 31: ĐỊNH NGHĨA VÀ Ý NGHĨA CỦA ĐẠO HÀM - TOÁN 11 KNTT
// KIẾN TRÚC JAVASCRIPT CHUẨN CYBER LOGIC & QUANTUM INDIGO
// ==========================================================================

// 1. ÂM THANH WEB AUDIO API (100% OFFLINE)
class SoundSynth {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type, duration, gainVal = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
  playClick() { this.playTone(600, 'sine', 0.08, 0.05); }
  playCorrect() {
    this.playTone(523.25, 'triangle', 0.12, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.12), 100);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.25, 0.15), 200);
  }
  playWrong() {
    this.playTone(220, 'sawtooth', 0.15, 0.1);
    setTimeout(() => this.playTone(180, 'sawtooth', 0.25, 0.12), 120);
  }
  playLevelUp() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.15, 0.12), i * 90);
    });
  }
  playFanfare() {
    const arpeggio = [523.25, 659.25, 783.99, 1046.5];
    arpeggio.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.2, 0.15), i * 120);
    });
  }
}
const sound = new SoundSynth();

// 2. STATE KHỞI TẠO CHUẨN CONTRACT
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nhà Tiên Tri Vi Phân 11',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// 3. BỘ PARSER MATHML FALLBACK & KATEX OFFLINE
function latexToMathML(latex) {
  let clean = latex.trim();
  clean = clean.replace(/\\overrightarrow\{([^}]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#8594;</mo></mover>');
  clean = clean.replace(/\\sqrt\{([^}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  clean = clean.replace(/\\lim\\limits_\{([^}]+)\}/g, '<munder><mo>lim</mo><mrow>$1</mrow></munder>');
  clean = clean.replace(/\\to/g, '<mo>&#8594;</mo>');
  clean = clean.replace(/\\Delta/g, '<mi>&#916;</mi>');
  clean = clean.replace(/\\approx/g, '<mo>&#8776;</mo>');
  clean = clean.replace(/\\cdot/g, '<mo>&#183;</mo>');
  clean = clean.replace(/\\ge/g, '<mo>&#8805;</mo>');
  clean = clean.replace(/\\le/g, '<mo>&#8804;</mo>');
  clean = clean.replace(/\\text\{([^}]+)\}/g, '<mtext>$1</mtext>');
  clean = clean.replace(/([a-zA-Z])/g, '<mi>$1</mi>');
  clean = clean.replace(/([0-9]+)/g, '<mn>$1</mn>');
  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${clean}</math>`;
}

function formatMathText(str) {
  if (!str) return '';
  return str.replace(/\$\$([\s\S]*?)\$\$/g, (m, c) => `<div class="math-block">${latexToMathML(c)}</div>`)
            .replace(/\$([^\$\n]+?)\$/g, (m, c) => `<span class="math-inline">${latexToMathML(c)}</span>`);
}

function renderMathInTree(root) {
  if (!root) return;
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {
      console.warn('KaTeX render error:', e);
    }
  }
  if (root.innerHTML && root.innerHTML.includes('$')) {
    root.innerHTML = formatMathText(root.innerHTML);
  }
}

// 4. DỮ LIỆU ĐẤU TRƯỜNG 10 CÂU TRẮC NGHIỆM BÀI 31
const quizData = [
  {
    id: 1,
    title: "Câu 1: Định nghĩa đạo hàm tại một điểm",
    pts: 20,
    question: "Cho hàm số $y = f(x)$ xác định trên khoảng $(a; b)$ và $x_0 \\in (a; b)$. Đạo hàm của hàm số tại $x_0$ (nếu tồn tại hữu hạn) được định nghĩa bởi:",
    options: [
      { text: "$f'(x_0) = \\lim\\limits_{x \\to x_0} \\frac{f(x) - f(x_0)}{x - x_0}$", correct: true },
      { text: "$f'(x_0) = \\lim\\limits_{x \\to x_0} \\frac{f(x) + f(x_0)}{x + x_0}$", correct: false },
      { text: "$f'(x_0) = \\frac{f(x_0)}{x_0}$", correct: false },
      { text: "$f'(x_0) = f(x_0)$", correct: false }
    ],
    explanation: "Theo định nghĩa SGK Toán 11 KNTT trang 82: Giới hạn hữu hạn $\\lim\\limits_{x \\to x_0} \\frac{f(x) - f(x_0)}{x - x_0}$ (nếu có) được gọi là đạo hàm của hàm số tại điểm $x_0$."
  },
  {
    id: 2,
    title: "Câu 2: Công thức đạo hàm theo số gia",
    pts: 20,
    question: "Nếu đặt $\\Delta x = x - x_0$ là số gia của đối số và $\\Delta y = f(x_0 + \\Delta x) - f(x_0)$ là số gia của hàm số thì $f'(x_0)$ bằng:",
    options: [
      { text: "$\\lim\\limits_{\\Delta x \\to 0} \\frac{\\Delta y}{\\Delta x}$", correct: true },
      { text: "$\\lim\\limits_{\\Delta x \\to 0} \\frac{\\Delta x}{\\Delta y}$", correct: false },
      { text: "$\\lim\\limits_{\\Delta x \\to \\infty} (\\Delta y \\cdot \\Delta x)$", correct: false },
      { text: "$\\Delta y - \\Delta x$", correct: false }
    ],
    explanation: "Theo SGK trang 83: Đạo hàm của hàm số tại $x_0$ còn được biểu diễn qua tỉ số của các số gia: $f'(x_0) = \\lim\\limits_{\\Delta x \\to 0} \\frac{\\Delta y}{\\Delta x}$."
  },
  {
    id: 3,
    title: "Câu 3: Ý nghĩa hình học của đạo hàm",
    pts: 20,
    question: "Ý nghĩa hình học của đạo hàm $f'(x_0)$ là:",
    options: [
      { text: "Hệ số góc của tiếp tuyến của đồ thị hàm số tại điểm $M_0(x_0; f(x_0))$", correct: true },
      { text: "Tọa độ giao điểm của đồ thị với trục hoành", correct: false },
      { text: "Khoảng cách từ gốc tọa độ đến tiếp điểm", correct: false },
      { text: "Góc tạo bởi tiếp tuyến và trục tung", correct: false }
    ],
    explanation: "Theo định lý SGK trang 84: Đạo hàm của hàm số $y = f(x)$ tại điểm $x_0$ là hệ số góc của tiếp tuyến của đồ thị hàm số đó tại điểm $M_0(x_0; f(x_0))$."
  },
  {
    id: 4,
    title: "Câu 4: Phương trình tiếp tuyến tại một điểm",
    pts: 20,
    question: "Phương trình tiếp tuyến của đồ thị hàm số $y = f(x)$ tại điểm $M_0(x_0; y_0)$ có dạng:",
    options: [
      { text: "$y - y_0 = f'(x_0)(x - x_0)$", correct: true },
      { text: "$y - y_0 = f'(x)(x_0 - x)$", correct: false },
      { text: "$y = f'(x_0)x$", correct: false },
      { text: "$y + y_0 = f'(x_0)(x + x_0)$", correct: false }
    ],
    explanation: "Tiếp tuyến có hệ số góc $k = f'(x_0)$ và đi qua $M_0(x_0; y_0)$, do đó phương trình là $y - y_0 = f'(x_0)(x - x_0)$ hay $y = f'(x_0)(x - x_0) + y_0$."
  },
  {
    id: 5,
    title: "Câu 5: (SGK Ví dụ) Tính đạo hàm hàm số $f(x) = x^2$",
    pts: 20,
    question: "Tính đạo hàm của hàm số $f(x) = x^2$ tại điểm $x_0 = 3$ bằng định nghĩa:",
    options: [
      { text: "6", correct: true },
      { text: "9", correct: false },
      { text: "3", correct: false },
      { text: "12", correct: false }
    ],
    explanation: "Áp dụng định nghĩa: $f'(3) = \\lim\\limits_{x \\to 3} \\frac{x^2 - 3^2}{x - 3} = \\lim\\limits_{x \\to 3} \\frac{(x - 3)(x + 3)}{x - 3} = \\lim\\limits_{x \\to 3} (x + 3) = 6$."
  },
  {
    id: 6,
    title: "Câu 6: Viết phương trình tiếp tuyến của parabol",
    pts: 20,
    question: "Phương trình tiếp tuyến của đồ thị hàm số $y = x^2$ tại điểm $M(1; 1)$ là:",
    options: [
      { text: "$y = 2x - 1$", correct: true },
      { text: "$y = 2x + 1$", correct: false },
      { text: "$y = x$", correct: false },
      { text: "$y = 2x$", correct: false }
    ],
    explanation: "Ta có $f'(1) = 2 \\cdot 1 = 2$. Tiếp tuyến đi qua $(1; 1)$ có phương trình: $y - 1 = 2(x - 1) \\iff y = 2x - 1$."
  },
  {
    id: 7,
    title: "Câu 7: (SGK 9.1) Đạo hàm của hàm bậc hai",
    pts: 20,
    question: "Cho hàm số $f(x) = 2x^2 + 1$. Đạo hàm của hàm số tại điểm $x_0 = 1$ bằng:",
    options: [
      { text: "4", correct: true },
      { text: "3", correct: false },
      { text: "5", correct: false },
      { text: "2", correct: false }
    ],
    explanation: "Ta có $f'(1) = \\lim\\limits_{x \\to 1} \\frac{(2x^2 + 1) - 3}{x - 1} = \\lim\\limits_{x \\to 1} \\frac{2(x^2 - 1)}{x - 1} = \\lim\\limits_{x \\to 1} 2(x + 1) = 4$."
  },
  {
    id: 8,
    title: "Câu 8: (SGK 9.2) Vận tốc tức thời của chuyển động",
    pts: 20,
    question: "Một vật chuyển động thẳng có phương trình $s(t) = 3t^2 + 2t$ ($t$ tính bằng giây, $s$ tính bằng mét). Vận tốc tức thời của vật tại thời điểm $t = 2\\text{ s}$ là:",
    options: [
      { text: "$14\\text{ m/s}$", correct: true },
      { text: "$16\\text{ m/s}$", correct: false },
      { text: "$12\\text{ m/s}$", correct: false },
      { text: "$8\\text{ m/s}$", correct: false }
    ],
    explanation: "Vận tốc tức thời là đạo hàm của quãng đường: $v(t) = s'(t) = 6t + 2$. Tại $t = 2\\text{ s}$, ta có $v(2) = 6 \\cdot 2 + 2 = 14\\text{ m/s}$."
  },
  {
    id: 9,
    title: "Câu 9: (SGK 9.4) Đạo hàm của hàm phân thức $y = \\frac{1}{x}$",
    pts: 20,
    question: "Cho hàm số $f(x) = \\frac{1}{x}$ với $x \\neq 0$. Đạo hàm của hàm số tại điểm $x_0 = 2$ bằng:",
    options: [
      { text: "$-\\frac{1}{4}$", correct: true },
      { text: "$\\frac{1}{4}$", correct: false },
      { text: "$-\\frac{1}{2}$", correct: false },
      { text: "$\\frac{1}{2}$", correct: false }
    ],
    explanation: "Ta có $f'(2) = \\lim\\limits_{x \\to 2} \\frac{\\frac{1}{x} - \\frac{1}{2}}{x - 2} = \\lim\\limits_{x \\to 2} \\frac{2 - x}{2x(x - 2)} = \\lim\\limits_{x \\to 2} \\frac{-1}{2x} = -\\frac{1}{4}$."
  },
  {
    id: 10,
    title: "Câu 10: Vị trí tiếp tuyến song song với trục hoành",
    pts: 20,
    question: "Tiếp tuyến của đồ thị hàm số $y = f(x)$ tại tiếp điểm $M_0(x_0; y_0)$ song song hoặc trùng với trục hoành $Ox$ khi và chỉ khi:",
    options: [
      { text: "$f'(x_0) = 0$", correct: true },
      { text: "$f'(x_0) = 1$", correct: false },
      { text: "$f(x_0) = 0$", correct: false },
      { text: "$f'(x_0)$ không xác định", correct: false }
    ],
    explanation: "Trục hoành $Ox$ có hệ số góc bằng 0. Để tiếp tuyến song song hoặc trùng với $Ox$, hệ số góc tiếp tuyến phải bằng 0, tức $f'(x_0) = 0$."
  }
];

// 5. KHỞI TẠO ĐẤU TRƯỜNG & TƯƠNG TÁC TỨC THÌ
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];

  quizData.forEach((q) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `qCard-${q.id}`;

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `<span><strong>${q.title}</strong></span><span class="quiz-badge">+${q.pts} XP</span>`;
    card.appendChild(header);

    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    const optsDiv = document.createElement('div');
    optsDiv.className = 'quiz-options';

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;
      btn.addEventListener('click', () => handleOptionClick(q, optIndex, btn, card));
      optsDiv.appendChild(btn);
    });
    card.appendChild(optsDiv);

    const explanation = document.createElement('div');
    explanation.className = 'explanation-box';
    explanation.id = `exp-${q.id}`;
    explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;
    card.appendChild(explanation);

    container.appendChild(card);
  });

  renderMathInTree(container);
}

function handleOptionClick(q, chosenIndex, chosenBtn, card) {
  if (appState.answered[q.id]) return;
  appState.answered[q.id] = true;

  const optButtons = card.querySelectorAll('.quiz-opt-btn');
  optButtons.forEach(b => b.disabled = true);

  const expBox = card.querySelector('.explanation-box');
  if (expBox) {
    expBox.classList.add('show');
    renderMathInTree(expBox);
  }

  const isCorrect = q.options[chosenIndex].correct;
  if (isCorrect) {
    chosenBtn.classList.add('correct');
    sound.playCorrect();
    appState.xp += q.pts;
    appState.streak += 1;
  } else {
    chosenBtn.classList.add('wrong');
    sound.playWrong();
    appState.streak = 0;
    q.options.forEach((opt, idx) => {
      if (opt.correct) {
        optButtons[idx].classList.add('correct');
      }
    });
  }

  updateHUD();
  checkBadges();
}

// 6. CẬP NHẬT HUD & HUY HIỆU
function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const progressEl = document.getElementById('arenaProgress');
  const arenaScoreEl = document.getElementById('arenaScore');
  const starRatingEl = document.getElementById('starRating');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;

  const answeredCount = Object.keys(appState.answered).length;
  if (progressEl) progressEl.textContent = `${answeredCount}/10`;
  if (arenaScoreEl) arenaScoreEl.textContent = `${appState.xp} XP`;

  let stars = 2;
  if (appState.xp >= 60) stars = 3;
  if (appState.xp >= 140) stars = 4;
  if (appState.xp >= 200) stars = 5;
  appState.stars = stars;
  if (starRatingEl) {
    starRatingEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
  }
}

function checkBadges() {
  const answeredCount = Object.keys(appState.answered).length;

  if (!appState.badges[0] && appState.xp >= 20) {
    unlockBadge(0, 'badge-1');
  }
  if (!appState.badges[1] && appState.xp >= 60) {
    unlockBadge(1, 'badge-2');
  }
  if (!appState.badges[2] && appState.streak >= 3) {
    unlockBadge(2, 'badge-3');
  }
  if (!appState.badges[3] && appState.xp >= 160) {
    unlockBadge(3, 'badge-4');
  }
  if (!appState.badges[4] && answeredCount === 10 && appState.xp === 200) {
    unlockBadge(4, 'badge-5');
    sound.playFanfare();
  }
}

function unlockBadge(index, elementId) {
  appState.badges[index] = true;
  const b = document.getElementById(elementId);
  if (b) {
    b.style.opacity = '1';
    b.style.transform = 'scale(1.05)';
    b.style.borderColor = '#10b981';
    b.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.4)';
    sound.playLevelUp();
  }
}

// 7. LAB 1: MÔ PHỎNG CÁT TUYẾN BIẾN THÀNH TIẾP TUYẾN
function initLab1() {
  const sX = document.getElementById('sliderX');
  const valX = document.getElementById('valX');
  const outLab1 = document.getElementById('outLab1');
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const x = parseFloat(sX.value);
    valX.textContent = x.toFixed(2);

    const x0 = 1.0;
    const y0 = 1.0;
    const y = x * x;
    const dx = x - x0;
    const dy = y - y0;
    const kSecant = dy / dx; // = x + 1

    outLab1.innerHTML = `Điểm $M(${x.toFixed(2)}; ${y.toFixed(2)})$ | $\\Delta x = ${dx.toFixed(2)}$ | Hệ số góc cát tuyến $k = \\frac{\\Delta y}{\\Delta x} = ${kSecant.toFixed(2)}$ | Khi $\\Delta x \\to 0$: $k \\to f'(1) = 2,00$`;
    renderMathInTree(outLab1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Hệ trục tọa độ
    const originX = 140;
    const originY = 270;
    const scale = 65; // pixels per unit

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    // Trục Ox
    ctx.beginPath();
    ctx.moveTo(30, originY);
    ctx.lineTo(500, originY);
    ctx.stroke();
    // Trục Oy
    ctx.beginPath();
    ctx.moveTo(originX, 30);
    ctx.lineTo(originX, 310);
    ctx.stroke();

    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('O', originX - 15, originY + 15);
    ctx.fillText('x', 490, originY - 8);
    ctx.fillText('y', originX + 8, 40);

    // Vẽ parabol y = x^2
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let px = -0.5; px <= 2.8; px += 0.05) {
      const py = px * px;
      const screenX = originX + px * scale;
      const screenY = originY - py * scale;
      if (px === -0.5) ctx.moveTo(screenX, screenY);
      else ctx.lineTo(screenX, screenY);
    }
    ctx.stroke();

    // Tiếp tuyến lý thuyết tại M0: y = 2x - 1
    ctx.strokeStyle = 'rgba(16, 185, 129, 0.4)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(originX + 0 * scale, originY - (-1) * scale);
    ctx.lineTo(originX + 2.6 * scale, originY - (2 * 2.6 - 1) * scale);
    ctx.stroke();
    ctx.setLineDash([]);

    // Cát tuyến M0-M
    const sm0X = originX + x0 * scale;
    const sm0Y = originY - y0 * scale;
    const smX = originX + x * scale;
    const smY = originY - y * scale;

    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    // Kéo dài đường cát tuyến 2 đầu
    const extT = 0.5;
    ctx.moveTo(sm0X - (smX - sm0X) * extT, sm0Y - (smY - sm0Y) * extT);
    ctx.lineTo(smX + (smX - sm0X) * extT, smY + (smY - sm0Y) * extT);
    ctx.stroke();

    // Điểm M0
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(sm0X, sm0Y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('M₀(1; 1)', sm0X - 50, sm0Y - 8);

    // Điểm M
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(smX, smY, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`M(${x.toFixed(2)}; ${y.toFixed(2)})`, smX + 10, smY);
  }

  sX.addEventListener('input', draw);
  draw();
}

// 8. LAB 2: MÔ PHỎNG QUẢ BÓNG RƠI LANDMARK 81
function initLab2() {
  const sT = document.getElementById('sliderT');
  const valT = document.getElementById('valT');
  const outLab2 = document.getElementById('outLab2');
  const canvas = document.getElementById('canvasLab2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const t = parseFloat(sT.value);
    valT.textContent = t.toFixed(1);

    const g = 9.8;
    const s = 0.5 * g * t * t; // mét
    const v = g * t; // m/s
    const vKmh = v * 3.6;

    outLab2.innerHTML = `Thời gian $t = ${t.toFixed(1)}\\text{ s}$ | Quãng đường rơi: $s(t) = ${s.toFixed(1)}\\text{ m}$ (trên tổng $461,3\\text{ m}$) | Vận tốc tức thời: $v(t) = s'(t) = gt = ${v.toFixed(1)}\\text{ m/s} = ${vKmh.toFixed(1)}\\text{ km/h}$`;
    renderMathInTree(outLab2);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ mô hình tòa tháp Landmark 81
    const towerX = 60;
    const towerW = 40;
    const groundY = 290;
    const towerTopY = 40;
    const towerH = groundY - towerTopY;

    // Mặt đất
    ctx.fillStyle = '#334155';
    ctx.fillRect(20, groundY, canvas.width - 40, 20);

    // Tòa tháp Landmark
    const towerGrad = ctx.createLinearGradient(towerX, towerTopY, towerX + towerW, towerTopY);
    towerGrad.addColorStop(0, '#1e293b');
    towerGrad.addColorStop(0.5, '#3b82f6');
    towerGrad.addColorStop(1, '#1e293b');
    ctx.fillStyle = towerGrad;
    ctx.fillRect(towerX, towerTopY, towerW, towerH);
    ctx.strokeStyle = '#60a5fa';
    ctx.strokeRect(towerX, towerTopY, towerW, towerH);

    // Chóp tháp
    ctx.beginPath();
    ctx.moveTo(towerX, towerTopY);
    ctx.lineTo(towerX + towerW / 2, towerTopY - 20);
    ctx.lineTo(towerX + towerW, towerTopY);
    ctx.closePath();
    ctx.fillStyle = '#93c5fd';
    ctx.fill();

    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('Landmark 81', towerX - 10, towerTopY - 25);
    ctx.fillText('461.3 m', towerX - 5, towerTopY + 20);

    // Quả bóng đang rơi
    const ballX = towerX + towerW + 40;
    const ratio = Math.min(1.0, s / 461.3);
    const ballY = towerTopY + ratio * towerH;

    // Quỹ đạo rơi nét đứt
    ctx.strokeStyle = '#475569';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(ballX, towerTopY);
    ctx.lineTo(ballX, groundY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Quả bóng
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(ballX, ballY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Vectơ vận tốc v(t) chỉ xuống
    const arrowLen = Math.min(60, v * 0.6);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ballX, ballY);
    ctx.lineTo(ballX, ballY + arrowLen);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`v = ${v.toFixed(1)} m/s`, ballX + 15, ballY + arrowLen / 2);

    // Đồ thị vận tốc v(t) = gt ở bên phải
    const graphX = 250;
    const graphY = 270;
    const gw = 240;
    const gh = 200;

    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.strokeRect(graphX, graphY - gh, gw, gh);

    ctx.fillStyle = '#94a3b8';
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('Đồ Thị Vận Tốc Tức Thời v(t) = 9.8t', graphX + 10, graphY - gh + 20);

    // Trục đồ thị
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(graphX, graphY);
    ctx.lineTo(graphX + gw, graphY - gh);
    ctx.stroke();

    // Điểm hiện tại trên đồ thị
    const curGX = graphX + (t / 9.7) * gw;
    const curGY = graphY - (v / (9.8 * 9.7)) * gh;

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(curGX, curGY, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  sT.addEventListener('input', draw);
  draw();
}

// 9. CÁC TIỆN ÍCH HỆ THỐNG & TABS
function initSystem() {
  const tabBtns = document.querySelectorAll('.nav-tab[data-tab]');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sound.playClick();
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = `tab-${btn.dataset.tab}`;
      const target = document.getElementById(targetId);
      if (target) {
        target.classList.add('active');
        renderMathInTree(target);
      }
    });
  });

  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      sound.enabled = appState.sound;
      soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      sound.playClick();
    });
  }

  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập không?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        for (let i = 1; i <= 5; i++) {
          const b = document.getElementById(`badge-${i}`);
          if (b) {
            b.style.opacity = '0.4';
            b.style.borderColor = '';
            b.style.boxShadow = '';
            b.style.transform = 'none';
          }
        }
        updateHUD();
        renderQuiz();
        sound.playClick();
      }
    });
  }

  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const certStudentName = document.getElementById('certStudentName');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      avatarModal.style.display = 'flex';
      sound.playClick();
    });
  }
  if (btnCloseModal && avatarModal) {
    btnCloseModal.addEventListener('click', () => {
      avatarModal.style.display = 'none';
      sound.playClick();
    });
  }

  const avatarOpts = document.querySelectorAll('.avatar-opt');
  avatarOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      const av = opt.dataset.avatar;
      const name = opt.dataset.name;
      appState.avatar = av;
      appState.userName = name;
      if (avatarBtn) avatarBtn.textContent = av;
      if (userNameDisplay) userNameDisplay.textContent = `${name} 🌟`;
      if (certStudentName) certStudentName.textContent = name;
      avatarModal.style.display = 'none';
      sound.playClick();
    });
  });

  const btnPrintCert = document.getElementById('btnPrintCert');
  if (btnPrintCert) {
    btnPrintCert.addEventListener('click', () => {
      window.print();
    });
  }
}

// 10. KHỞI CHẠY KHI TẢI TRANG
document.addEventListener('DOMContentLoaded', () => {
  renderQuiz();
  initLab1();
  initLab2();
  initSystem();
  updateHUD();
  renderMathInTree(document.body);
});
