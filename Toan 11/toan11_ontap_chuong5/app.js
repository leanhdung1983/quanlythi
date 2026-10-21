/**
 * TOÁN 11 KẾT NỐI TRI THỨC - BÀI TẬP CUỐI CHƯƠNG V
 * Pure Vanilla Web Stack (HTML5, CSS3, JavaScript ES6+, Web Audio API, Canvas 2D)
 * 100% Offline-capable, KaTeX & MathML fallback, Cyber Logic Aesthetics
 */

// --- 1. STATE MANAGEMENT ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Kiện Tướng Giới Hạn & Liên Tục',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// --- 2. WEB AUDIO API SOUND SYSTEM ---
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx && AudioContextClass) {
    audioCtx = new AudioContextClass();
  }
}

function playTone(freq, type, duration, gainVal = 0.1) {
  if (!appState.sound) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

function playClick() {
  playTone(450, 'sine', 0.08, 0.05);
}

function playCorrect() {
  if (!appState.sound) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.1);
    osc.frequency.setValueAtTime(783.99, now + 0.2);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {}
}

function playWrong() {
  if (!appState.sound) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(180, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {}
}

function playFanfare() {
  if (!appState.sound) return;
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 'sine', 0.35, 0.15);
    }, idx * 120);
  });
}

function playBadge() {
  playTone(880, 'sine', 0.4, 0.15);
}

// --- 3. KATEX & MATHML FALLBACK ---
function latexToMathML(latex) {
  let clean = latex.trim();
  clean = clean.replace(/\\lim\\limits_\{([^}]+)\}/g, '<munder><mo>lim</mo><mrow>$1</mrow></munder>');
  clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  clean = clean.replace(/\\sqrt\{([^}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  clean = clean.replace(/\\to/g, '<mo>&rarr;</mo>');
  clean = clean.replace(/\\infty/g, '<mi>&infin;</mi>');
  clean = clean.replace(/\\ne/g, '<mo>&ne;</mo>');
  clean = clean.replace(/\\ge/g, '<mo>&ge;</mo>');
  clean = clean.replace(/\\le/g, '<mo>&le;</mo>');
  clean = clean.replace(/\\cup/g, '<mo>&cup;</mo>');
  clean = clean.replace(/\\cdot/g, '<mo>&sdot;</mo>');
  clean = clean.replace(/\\dots/g, '<mo>&hellip;</mo>');
  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${clean}</math>`;
}

function formatMathText(text) {
  if (!text) return '';
  return text.replace(/\$\$([\s\S]*?)\$\$/g, (m, c) => `<div class="math-block">${latexToMathML(c)}</div>`)
             .replace(/\$([^\$]+?)\$/g, (m, c) => `<span class="math-inline">${latexToMathML(c)}</span>`);
}

function renderMathInTree(root) {
  if (!root) return;
  if (typeof window.renderMathInElement === 'function') {
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
      console.warn("KaTeX render error:", e);
    }
  }
}

// --- 4. DATA CHO ĐẤU TRƯỜNG SGK (10 CÂU BÀI TẬP CUỐI CHƯƠNG V) ---
const quizData = [
  {
    id: 1,
    title: "Giới Hạn Dãy Chứa Căn (SGK 5.18)",
    pts: 20,
    question: "Cho dãy số $(u_n)$ với $u_n = \\sqrt{n^2 + 1} - \\sqrt{n}$. Mệnh đề nào sau đây là <strong>đúng</strong>?",
    options: [
      { text: "$\\lim\\limits_{n \\to +\\infty} u_n = +\\infty$", correct: true },
      { text: "$\\lim\\limits_{n \\to +\\infty} u_n = 1$", correct: false },
      { text: "$\\lim\\limits_{n \\to +\\infty} u_n = 0$", correct: false },
      { text: "$\\lim\\limits_{n \\to +\\infty} u_n = -\\infty$", correct: false }
    ],
    explanation: "Biến đổi $u_n = n\\sqrt{1 + \\frac{1}{n^2}} - \\sqrt{n} = n \\left(\\sqrt{1 + \\frac{1}{n^2}} - \\frac{1}{\\sqrt{n}}\\right)$. Khi $n \\to +\\infty$, cụm trong ngoặc dần tới $1 - 0 = 1 > 0$, do đó $\\lim\\limits_{n \\to +\\infty} u_n = +\\infty$."
  },
  {
    id: 2,
    title: "Tổng Cấp Số Nhân Hữu Hạn Trong Dãy (SGK 5.19)",
    pts: 20,
    question: "Cho $u_n = \\frac{2 + 2^2 + \\dots + 2^n}{2^n}$. Giới hạn của dãy số $(u_n)$ bằng:",
    options: [
      { text: "$2$", correct: true },
      { text: "$1$", correct: false },
      { text: "$-1$", correct: false },
      { text: "$0$", correct: false }
    ],
    explanation: "Tử số là tổng $n$ số hạng của cấp số nhân có $u_1 = 2, q = 2$: $S_n = 2 \\cdot \\frac{2^n - 1}{2 - 1} = 2^{n+1} - 2$. Do đó $u_n = \\frac{2^{n+1} - 2}{2^n} = 2 - \\frac{2}{2^n}$. Khi $n \\to +\\infty$, $\\frac{2}{2^n} \\to 0$, nên $\\lim\\limits_{n \\to +\\infty} u_n = 2$."
  },
  {
    id: 3,
    title: "Tổng Cấp Số Nhân Lùi Vô Hạn (SGK 5.20)",
    pts: 20,
    question: "Cho cấp số nhân lùi vô hạn $(u_n)$ với $u_n = \\frac{2}{3^n}$. Tổng của cấp số nhân này bằng:",
    options: [
      { text: "$1$", correct: true },
      { text: "$2$", correct: false },
      { text: "$3$", correct: false },
      { text: "$6$", correct: false }
    ],
    explanation: "Ta có $u_1 = \\frac{2}{3^1} = \\frac{2}{3}$. Công bội $q = \\frac{u_2}{u_1} = \\frac{2/9}{2/3} = \\frac{1}{3}$. Vì $|q| = \\frac{1}{3} < 1$, tổng cấp số nhân lùi vô hạn là $S = \\frac{u_1}{1 - q} = \\frac{2/3}{1 - 1/3} = \\frac{2/3}{2/3} = 1$."
  },
  {
    id: 4,
    title: "Giới Hạn Hàm Số Tại Dương Vô Cực (SGK 5.21)",
    pts: 20,
    question: "Cho hàm số $f(x) = \\sqrt{x + 1} - \\sqrt{x + 2}$. Mệnh đề nào sau đây là <strong>đúng</strong>?",
    options: [
      { text: "$\\lim\\limits_{x \\to +\\infty} f(x) = 0$", correct: true },
      { text: "$\\lim\\limits_{x \\to +\\infty} f(x) = -1$", correct: false },
      { text: "$\\lim\\limits_{x \\to +\\infty} f(x) = -\\infty$", correct: false },
      { text: "$\\lim\\limits_{x \\to +\\infty} f(x) = -\\frac{1}{2}$", correct: false }
    ],
    explanation: "Nhân lượng liên hợp: $\\sqrt{x + 1} - \\sqrt{x + 2} = \\frac{(x + 1) - (x + 2)}{\\sqrt{x + 1} + \\sqrt{x + 2}} = \\frac{-1}{\\sqrt{x + 1} + \\sqrt{x + 2}}$. Khi $x \\to +\\infty$, mẫu số tiến tới $+\\infty$ nên giới hạn bằng $0$."
  },
  {
    id: 5,
    title: "Giới Hạn Một Bên Chứa Giá Trị Tuyệt Đối (SGK 5.22)",
    pts: 20,
    question: "Cho hàm số $f(x) = \\frac{x - x^2}{|x|}$. Khi đó $\\lim\\limits_{x \\to 0^+} f(x)$ bằng:",
    options: [
      { text: "$1$", correct: true },
      { text: "$0$", correct: false },
      { text: "$-1$", correct: false },
      { text: "$+\\infty$", correct: false }
    ],
    explanation: "Khi $x \\to 0^+$, ta có $x > 0$ nên $|x| = x$. Khi đó hàm số trở thành: $f(x) = \\frac{x(1 - x)}{x} = 1 - x$. Vậy $\\lim\\limits_{x \\to 0^+} f(x) = \\lim\\limits_{x \\to 0^+} (1 - x) = 1$."
  },
  {
    id: 6,
    title: "Khoảng Liên Tục Của Hàm Giá Trị Tuyệt Đối (SGK 5.23)",
    pts: 20,
    question: "Cho hàm số $f(x) = \\frac{x + 1}{|x + 1|}$. Hàm số $f(x)$ liên tục trên tập hợp nào sau đây?",
    options: [
      { text: "$(-\\infty; -1) \\cup (-1; +\\infty)$", correct: true },
      { text: "$(-\\infty; +\\infty)$", correct: false },
      { text: "$(-\\infty; -1]$", correct: false },
      { text: "$[-1; +\\infty)$", correct: false }
    ],
    explanation: "Hàm số xác định khi và chỉ khi $|x + 1| \\ne 0 \\iff x \\ne -1$. Khi $x > -1$, $f(x) = 1$ (hàm hằng liên tục). Khi $x < -1$, $f(x) = -1$ (hàm hằng liên tục). Tại $x = -1$ hàm số không xác định nên liên tục trên $(-\\infty; -1) \\cup (-1; +\\infty)$."
  },
  {
    id: 7,
    title: "Tìm Tham Số Để Hàm Số Liên Tục (SGK 5.24)",
    pts: 20,
    question: "Cho hàm số $f(x) = \\begin{cases} \\frac{x^2 + x - 2}{x - 1} & \\text{nếu } x \\ne 1 \\\\ a & \\text{nếu } x = 1 \\end{cases}$. Hàm số $f(x)$ liên tục tại $x = 1$ khi:",
    options: [
      { text: "$a = 3$", correct: true },
      { text: "$a = 0$", correct: false },
      { text: "$a = -1$", correct: false },
      { text: "$a = 1$", correct: false }
    ],
    explanation: "Ta có tử số $x^2 + x - 2 = (x - 1)(x + 2)$. Khi $x \\ne 1$, $f(x) = x + 2$. Giới hạn $\\lim\\limits_{x \\to 1} f(x) = \\lim\\limits_{x \\to 1} (x + 2) = 3$. Để hàm số liên tục tại $x = 1$, ta cần $f(1) = \\lim\\limits_{x \\to 1} f(x) \\iff a = 3$."
  },
  {
    id: 8,
    title: "Giới Hạn Phân Thức Bậc Hai (SGK 5.26a)",
    pts: 20,
    question: "Tính giới hạn của dãy số: $\\lim\\limits_{n \\to +\\infty} \\frac{n^2}{3n^2 + 7n - 2}$.",
    options: [
      { text: "$\\frac{1}{3}$", correct: true },
      { text: "$0$", correct: false },
      { text: "$\\frac{1}{7}$", correct: false },
      { text: "$+\\infty$", correct: false }
    ],
    explanation: "Chia cả tử và mẫu cho $n^2$: $\\frac{1}{3 + \\frac{7}{n} - \\frac{2}{n^2}}$. Khi $n \\to +\\infty$, $\\frac{7}{n} \\to 0$ và $\\frac{2}{n^2} \\to 0$. Giới hạn bằng $\\frac{1}{3 + 0 - 0} = \\frac{1}{3}$."
  },
  {
    id: 9,
    title: "Số Thập Phân Vô Hạn Tuần Hoàn (SGK 5.27a)",
    pts: 20,
    question: "Viết số thập phân vô hạn tuần hoàn $1,(01)$ dưới dạng phân số tối giản:",
    options: [
      { text: "$\\frac{100}{99}$", correct: true },
      { text: "$\\frac{101}{99}$", correct: false },
      { text: "$\\frac{99}{100}$", correct: false },
      { text: "$\\frac{101}{100}$", correct: false }
    ],
    explanation: "Biểu diễn $1,(01) = 1 + \\frac{1}{100} + \\frac{1}{100^2} + \\dots$ Phần đuôi là tổng cấp số nhân lùi vô hạn với $u_1 = \\frac{1}{100}, q = \\frac{1}{100}$: $S = \\frac{1/100}{1 - 1/100} = \\frac{1}{99}$. Vậy số đó là $1 + \\frac{1}{99} = \\frac{100}{99}$."
  },
  {
    id: 10,
    title: "Khử Dạng 0/0 Bằng Căn Thức (SGK 5.28a)",
    pts: 20,
    question: "Tính giới hạn: $\\lim\\limits_{x \\to 7} \\frac{\\sqrt{x + 2} - 3}{x - 7}$.",
    options: [
      { text: "$\\frac{1}{6}$", correct: true },
      { text: "$\\frac{1}{3}$", correct: false },
      { text: "$0$", correct: false },
      { text: "$\\frac{1}{9}$", correct: false }
    ],
    explanation: "Nhân lượng liên hợp trên tử: $\\frac{(\\sqrt{x+2}-3)(\\sqrt{x+2}+3)}{(x-7)(\\sqrt{x+2}+3)} = \\frac{x+2-9}{(x-7)(\\sqrt{x+2}+3)} = \\frac{x-7}{(x-7)(\\sqrt{x+2}+3)} = \\frac{1}{\\sqrt{x+2}+3}$. Khi $x \\to 7$, giá trị dần tới $\\frac{1}{\\sqrt{9}+3} = \\frac{1}{6}$."
  }
];

// --- 5. RENDER QUIZ & INTERACTION ---
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
    header.innerHTML = `<span>Câu ${idx + 1}: ${q.title}</span><span class="quiz-badge">+${q.pts} XP</span>`;
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
      btn.id = `btn-${q.id}-${optIndex}`;
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;
      btn.addEventListener('click', () => handleOptionClick(q, optIndex));
      optsDiv.appendChild(btn);
    });
    card.appendChild(optsDiv);

    const expDiv = document.createElement('div');
    expDiv.className = 'explanation-box';
    expDiv.id = `exp-${q.id}`;
    expDiv.innerHTML = `<strong>💡 Phân tích giải thích chi tiết:</strong> ${q.explanation}`;
    card.appendChild(expDiv);

    container.appendChild(card);
  });

  renderMathInTree(container);
}

function handleOptionClick(q, chosenIndex) {
  if (appState.answered[q.id] !== undefined) return;
  appState.answered[q.id] = chosenIndex;

  const isCorrect = q.options[chosenIndex].correct;
  const chosenBtn = document.getElementById(`btn-${q.id}-${chosenIndex}`);
  const expBox = document.getElementById(`exp-${q.id}`);

  q.options.forEach((opt, idx) => {
    const btn = document.getElementById(`btn-${q.id}-${idx}`);
    btn.disabled = true;
    if (opt.correct) {
      btn.classList.add('correct');
    }
  });

  if (isCorrect) {
    chosenBtn.classList.add('correct');
    appState.xp += q.pts;
    appState.streak += 1;
    playCorrect();
    checkBadges();
  } else {
    chosenBtn.classList.add('wrong');
    appState.streak = 0;
    playWrong();
  }

  if (expBox) expBox.classList.add('show');
  updateHUD();
}

function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (progEl) {
    const answeredCount = Object.keys(appState.answered).length;
    progEl.textContent = `${answeredCount}/10`;
  }
  if (scoreEl) scoreEl.textContent = `${appState.xp} XP`;

  if (starEl) {
    let stars = 2;
    if (appState.xp >= 60) stars = 3;
    if (appState.xp >= 120) stars = 4;
    if (appState.xp >= 180) stars = 5;
    appState.stars = stars;
    let s = '';
    for (let i = 1; i <= 5; i++) {
      s += i <= stars ? '⭐' : '☆';
    }
    starEl.textContent = s;
  }
}

function checkBadges() {
  const answeredCount = Object.keys(appState.answered).length;
  if (answeredCount >= 1 && !appState.badges[0]) {
    unlockBadge(1);
  }
  if (appState.streak >= 3 && !appState.badges[1]) {
    unlockBadge(2);
  }
  if (appState.xp >= 160 && !appState.badges[3]) {
    unlockBadge(4);
  }
  let correctCount = 0;
  quizData.forEach(q => {
    const ans = appState.answered[q.id];
    if (ans !== undefined && q.options[ans].correct) {
      correctCount++;
    }
  });
  if (correctCount === 10 && !appState.badges[4]) {
    unlockBadge(5);
    playFanfare();
  }
}

function unlockBadge(badgeNum) {
  const idx = badgeNum - 1;
  appState.badges[idx] = true;
  const badgeCard = document.getElementById(`badge-${badgeNum}`);
  if (badgeCard) {
    badgeCard.classList.remove('locked');
    badgeCard.classList.add('unlocked');
  }
  playBadge();
}

// --- 6. PHÒNG THÍ NGHIỆM 1: KHẢO SÁT GIỚI HẠN TỔNG HỢP ---
function initLab1() {
  const select = document.getElementById('reviewFuncSelect');
  const slider = document.getElementById('reviewSlider');
  const valDisplay = document.getElementById('reviewValDisplay');

  function updateLab1() {
    const mode = select.value;
    const val = parseFloat(slider.value);
    valDisplay.textContent = val;
    drawLab1Canvas(mode, val);
    renderLab1Output(mode, val);
  }

  if (select) select.addEventListener('change', () => {
    if (select.value === 'csn') {
      slider.min = 1; slider.max = 12; slider.step = 1; slider.value = 5;
    } else if (select.value === 'abs') {
      slider.min = 0.05; slider.max = 2; slider.step = 0.05; slider.value = 0.5;
    } else {
      slider.min = 1; slider.max = 50; slider.step = 1; slider.value = 10;
    }
    updateLab1();
  });

  if (slider) slider.addEventListener('input', updateLab1);

  updateLab1();
}

function drawLab1Canvas(mode, param) {
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Background grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  if (mode === 'csn') {
    // Bar chart of partial sums Sn -> S = 1
    const n = Math.floor(param);
    const maxN = 12;
    const barWidth = (W - 80) / maxN;

    let partialSum = 0;
    for (let i = 1; i <= n; i++) {
      const term = 2 / Math.pow(3, i);
      partialSum += term;
      const x = 50 + (i - 1) * barWidth;
      const barH = (partialSum / 1.2) * (H - 80);
      const y = H - 40 - barH;

      ctx.fillStyle = i === n ? '#f59e0b' : '#38bdf8';
      ctx.fillRect(x + 5, y, barWidth - 10, barH);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`n=${i}`, x + 6, H - 20);
    }

    // Limit line S = 1
    const limitY = H - 40 - (1 / 1.2) * (H - 80);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.setLineDash([6, 6]);
    ctx.beginPath(); ctx.moveTo(40, limitY); ctx.lineTo(W - 20, limitY); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#10b981';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText('Giới hạn S = 1', W - 100, limitY - 8);

  } else if (mode === 'abs') {
    // Curve f(x) = (x - x^2)/|x|
    function toPxX(x) { return 60 + ((x + 2) / 4) * (W - 100); }
    function toPxY(y) { return H / 2 - y * 60; }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(20, H / 2); ctx.lineTo(W - 20, H / 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(toPxX(0), 20); ctx.lineTo(toPxX(0), H - 20); ctx.stroke();

    // Right branch: x > 0: y = 1 - x
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0.05; x <= 2; x += 0.05) {
      const px = toPxX(x), py = toPxY(1 - x);
      if (x === 0.05) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Left branch: x < 0: y = -1 + x
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    for (let x = -2; x <= -0.05; x += 0.05) {
      const px = toPxX(x), py = toPxY(-1 + x);
      if (x === -2) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Hollow holes at (0, 1) and (0, -1)
    ctx.fillStyle = '#090d16'; ctx.strokeStyle = '#10b981';
    ctx.beginPath(); ctx.arc(toPxX(0), toPxY(1), 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(toPxX(0), toPxY(-1), 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    // Probe point
    const curX = param;
    const curY = 1 - curX;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(toPxX(curX), toPxY(curY), 7, 0, Math.PI * 2); ctx.fill();

  } else {
    // Root curve: f(x) = sqrt(x+1) - sqrt(x+2) -> 0
    function toPxX(x) { return 60 + (x / 55) * (W - 100); }
    function toPxY(y) { return 60 - y * 350; } // y is negative, in [-0.5, 0]

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(40, 60); ctx.lineTo(W - 20, 60); ctx.stroke(); // y = 0 axis
    ctx.beginPath(); ctx.moveTo(60, 20); ctx.lineTo(60, H - 20); ctx.stroke();

    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let x = 0; x <= 50; x += 0.5) {
      const y = Math.sqrt(x + 1) - Math.sqrt(x + 2);
      const px = toPxX(x), py = toPxY(y);
      if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const curX = param;
    const curY = Math.sqrt(curX + 1) - Math.sqrt(curX + 2);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(toPxX(curX), toPxY(curY), 7, 0, Math.PI * 2); ctx.fill();
  }
}

function renderLab1Output(mode, param) {
  const out = document.getElementById('lab1Output');
  if (!out) return;

  if (mode === 'csn') {
    const n = Math.floor(param);
    let s = 0;
    for (let i = 1; i <= n; i++) s += 2 / Math.pow(3, i);
    out.innerHTML = `
      <strong>📊 Cấp Số Nhân Lùi Vô Hạn ($u_n = \\frac{2}{3^n}$):</strong><br>
      • Tổng $n = ${n}$ số hạng đầu tiên: $S_{${n}} = ${s.toFixed(6)}$.<br>
      • Chênh lệch với giới hạn $S = 1$: $|S - S_n| = ${(1 - s).toFixed(6)}$.<br>
      <strong>Định lí:</strong> Tổng toàn bộ vô hạn số hạng là $S = \\frac{u_1}{1 - q} = \\frac{2/3}{1 - 1/3} = 1$.
    `;
  } else if (mode === 'abs') {
    const y = 1 - param;
    out.innerHTML = `
      <strong>📈 Giới Hạn Một Bên $f(x) = \\frac{x - x^2}{|x|}$ tại $x = ${param.toFixed(2)}$:</strong><br>
      • Vì $x > 0$ nên $|x| = x \\implies f(x) = 1 - x = ${y.toFixed(3)}$.<br>
      • Khi $x \\to 0^+$, ta có $\\lim\\limits_{x \\to 0^+} f(x) = 1 - 0 = 1$.<br>
      <strong>Nhận xét:</strong> Nhánh bên trái ($x < 0$) có giới hạn bằng $-1$. Giới hạn hai phía không tồn tại!
    `;
  } else {
    const y = Math.sqrt(param + 1) - Math.sqrt(param + 2);
    out.innerHTML = `
      <strong>📉 Khử Vô Định Vô Cực Trừ Vô Cực tại $x = ${param}$:</strong><br>
      • Giá trị hàm số: $f(${param}) = \\sqrt{${param} + 1} - \\sqrt{${param} + 2} \\approx ${y.toFixed(6)}$.<br>
      • Liên hợp: $f(x) = \\frac{-1}{\\sqrt{x + 1} + \\sqrt{x + 2}}$.<br>
      <strong>Kết luận:</strong> Khi $x \\to +\\infty$, mẫu số tăng lên $+\\infty$, đồ thị bám sát tiệm cận ngang $y = 0$!
    `;
  }

  renderMathInTree(out);
}

// --- 7. PHÒNG THÍ NGHIỆM 2: MÁY BẪY NGHIỆM CHIA ĐÔI (BISECTION) ---
let bisectState = {
  a: 0.0,
  b: 2.0,
  step: 0
};

function fBisect(x) {
  return Math.pow(x, 5) + Math.pow(x, 3) - 10;
}

function initLab2() {
  const btnNext = document.getElementById('btnNextStep');
  const btnReset = document.getElementById('btnResetBisection');

  function updateLab2() {
    drawLab2Canvas();
    renderLab2Output();
  }

  if (btnNext) btnNext.addEventListener('click', () => {
    const mid = (bisectState.a + bisectState.b) / 2;
    const fa = fBisect(bisectState.a);
    const fmid = fBisect(mid);

    if (fa * fmid <= 0) {
      bisectState.b = mid;
    } else {
      bisectState.a = mid;
    }
    bisectState.step++;
    playTone(550 + bisectState.step * 40, 'sine', 0.12, 0.1);

    if (!appState.badges[2]) {
      unlockBadge(3);
    }
    updateLab2();
  });

  if (btnReset) btnReset.addEventListener('click', () => {
    bisectState.a = 0.0;
    bisectState.b = 2.0;
    bisectState.step = 0;
    updateLab2();
  });

  updateLab2();
}

function drawLab2Canvas() {
  const canvas = document.getElementById('canvasLab2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Background grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const minX = -0.5, maxX = 2.5, minY = -15, maxY = 35;
  function toPxX(x) { return ((x - minX) / (maxX - minX)) * W; }
  function toPxY(y) { return H - ((y - minY) / (maxY - minY)) * H; }

  const originX = toPxX(0);
  const originY = toPxY(0);

  // Axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(W, originY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, H); ctx.stroke();

  // Highlight interval [a, b]
  const pxA = toPxX(bisectState.a);
  const pxB = toPxX(bisectState.b);
  ctx.fillStyle = 'rgba(16, 185, 129, 0.2)';
  ctx.fillRect(pxA, 0, pxB - pxA, H);

  // Curve
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  let first = true;
  for (let px = 0; px <= W; px += 2) {
    const x = minX + (px / W) * (maxX - minX);
    const y = fBisect(x);
    const py = toPxY(y);
    if (first) { ctx.moveTo(px, py); first = false; }
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Mark points a and b
  const fa = fBisect(bisectState.a);
  const fb = fBisect(bisectState.b);

  ctx.fillStyle = '#f43f5e';
  ctx.beginPath(); ctx.arc(toPxX(bisectState.a), toPxY(fa), 6, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#10b981';
  ctx.beginPath(); ctx.arc(toPxX(bisectState.b), toPxY(fb), 6, 0, Math.PI * 2); ctx.fill();

  // Midpoint marker
  const mid = (bisectState.a + bisectState.b) / 2;
  const fmid = fBisect(mid);
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(toPxX(mid), toPxY(fmid), 7, 0, Math.PI * 2); ctx.fill();
}

function renderLab2Output() {
  const out = document.getElementById('lab2Output');
  if (!out) return;

  const a = bisectState.a;
  const b = bisectState.b;
  const mid = (a + b) / 2;
  const fa = fBisect(a);
  const fb = fBisect(b);
  const fmid = fBisect(mid);
  const span = b - a;

  out.innerHTML = `
    <strong>🔍 Trạng thái bẫy nghiệm tại Bước ${bisectState.step}:</strong><br>
    • Khoảng nghiệm hiện tại: $[${a.toFixed(5)}; ${b.toFixed(5)}]$ (Bán kính sai số: $\\Delta = ${span.toFixed(5)}$).<br>
    • Điểm giữa: $m = ${mid.toFixed(5)} \\implies f(m) = ${fmid.toFixed(5)}$.<br>
    • Giá trị hai đầu: $f(a) = ${fa.toFixed(2)}$; $f(b) = ${fb.toFixed(2)}$.<br>
    <strong>Định lí Bolzano:</strong> Vì $f(a) \\cdot f(b) < 0$, nghiệm thực của $x^5 + x^3 - 10 = 0$ được giam giữ chắc chắn trong khoảng này!
  `;
  renderMathInTree(out);
}

// --- 8. AVATAR MODAL & TABS ---
function initAvatarModal() {
  const avatarBtn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const closeBtn = document.getElementById('avatarModalClose');
  const options = document.querySelectorAll('.avatar-option');

  if (avatarBtn && modal) {
    avatarBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      modal.classList.add('active');
      playClick();
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      modal.classList.remove('active');
      playClick();
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
      }
    });
  }

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      appState.avatar = opt.dataset.avatar;
      appState.userName = opt.dataset.name;
      appState.userTitle = opt.dataset.title;

      if (avatarBtn) avatarBtn.textContent = appState.avatar;
      const nameEl = document.getElementById('userNameDisplay');
      const titleEl = document.getElementById('userTitle');
      const certNameEl = document.getElementById('certStudentName');

      if (nameEl) nameEl.textContent = `${appState.userName} 🌟`;
      if (titleEl) titleEl.textContent = appState.userTitle;
      if (certNameEl) certNameEl.textContent = appState.userName;

      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
      }
      playClick();
    });
  });
}

function initNavigationTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const sections = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      tab.classList.add('active');
      const sec = document.getElementById(`tab-${target}`);
      if (sec) sec.classList.add('active');
      playClick();

      if (sec) renderMathInTree(sec);
    });
  });
}

function initSoundAndReset() {
  const soundBtn = document.getElementById('soundToggle');
  const resetBtn = document.getElementById('resetProgress');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      playClick();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học bài này?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.stars = 2;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        for (let i = 1; i <= 5; i++) {
          const b = document.getElementById(`badge-${i}`);
          if (b) {
            b.classList.add('locked');
            b.classList.remove('unlocked');
          }
        }
        updateHUD();
        renderQuiz();
        playClick();
      }
    });
  }

  const printBtn = document.getElementById('btnPrintCert');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

// --- 9. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initAvatarModal();
  initNavigationTabs();
  initSoundAndReset();
  initLab1();
  initLab2();
  renderQuiz();
  updateHUD();

  setTimeout(() => {
    renderMathInTree(document.body);
  }, 100);
});
