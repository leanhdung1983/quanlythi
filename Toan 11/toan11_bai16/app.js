/**
 * TOÁN 11 KẾT NỐI TRI THỨC - BÀI 16: GIỚI HẠN CỦA HÀM SỐ
 * Pure Vanilla Web Stack (HTML5, CSS3, JavaScript ES6+, Web Audio API, Canvas 2D)
 * 100% Offline-capable, KaTeX & MathML fallback, Cyber Logic Aesthetics
 */

// --- 1. STATE MANAGEMENT ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Giới Hạn Giải Tích',
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
    osc.frequency.setValueAtTime(523.25, now); // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
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

// --- 3. KATEX & MATHML FALLBACK PARSER ---
function latexToMathML(latex) {
  let clean = latex.trim();
  // Basic symbols replacement
  clean = clean.replace(/\\lim\\limits_\{([^}]+)\}/g, '<munder><mo>lim</mo><mrow>$1</mrow></munder>');
  clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  clean = clean.replace(/\\sqrt\{([^}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  clean = clean.replace(/\\to/g, '<mo>&rarr;</mo>');
  clean = clean.replace(/\\infty/g, '<mi>&infin;</mi>');
  clean = clean.replace(/\\pm/g, '<mo>&plusmn;</mo>');
  clean = clean.replace(/\\ne/g, '<mo>&ne;</mo>');
  clean = clean.replace(/\\ge/g, '<mo>&ge;</mo>');
  clean = clean.replace(/\\le/g, '<mo>&le;</mo>');
  clean = clean.replace(/\\cdot/g, '<mo>&sdot;</mo>');
  clean = clean.replace(/\\mathbb\{R\}/g, '<mi>&#8477;</mi>');
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
      console.warn("KaTeX render error, falling back to MathML:", e);
    }
  }
}

// --- 4. DATA CHO ĐẤU TRƯỜNG SGK (10 CÂU BÀI 16) ---
const quizData = [
  {
    id: 1,
    title: "Khảo Sát Hai Hàm Số (SGK 5.7)",
    pts: 20,
    question: "Cho hai hàm số $f(x) = \\frac{x^2 - 1}{x - 1}$ và $g(x) = x + 1$. Khẳng định nào sau đây là <strong>đúng nhất</strong>?",
    options: [
      { text: "Hai hàm số giống hệt nhau: $f(x) = g(x)$ với mọi $x \\in \\mathbb{R}$.", correct: false },
      { text: "$f(x) \\ne g(x)$ vì khác tập xác định, nhưng $\\lim\\limits_{x \\to 1} f(x) = \\lim\\limits_{x \\to 1} g(x) = 2$.", correct: true },
      { text: "Cả hai giới hạn đều không tồn tại tại $x = 1$.", correct: false },
      { text: "$\\lim\\limits_{x \\to 1} f(x) = 0$ và $\\lim\\limits_{x \\to 1} g(x) = 2$.", correct: false }
    ],
    explanation: "Tập xác định của $f(x)$ là $\\mathbb{R} \\setminus \\{1\\}$, còn $g(x)$ là $\\mathbb{R}$, do đó $f(x) \\ne g(x)$. Tuy nhiên khi xét $x \\to 1$ ($x \\ne 1$), ta có $f(x) = \\frac{(x-1)(x+1)}{x-1} = x + 1$, nên $\\lim\\limits_{x \\to 1} f(x) = \\lim\\limits_{x \\to 1} (x + 1) = 2 = \\lim\\limits_{x \\to 1} g(x)$."
  },
  {
    id: 2,
    title: "Khử Dạng Vô Định Phân Thức (SGK 5.8a)",
    pts: 20,
    question: "Tính giới hạn sau: $\\lim\\limits_{x \\to 0} \\frac{(x + 2)^2 - 4}{x}$.",
    options: [
      { text: "$0$", correct: false },
      { text: "$2$", correct: false },
      { text: "$4$", correct: true },
      { text: "$+\\infty$", correct: false }
    ],
    explanation: "Khai triển tử số: $(x + 2)^2 - 4 = x^2 + 4x + 4 - 4 = x^2 + 4x = x(x + 4)$. Do đó $\\lim\\limits_{x \\to 0} \\frac{x(x + 4)}{x} = \\lim\\limits_{x \\to 0} (x + 4) = 0 + 4 = 4$."
  },
  {
    id: 3,
    title: "Khử Dạng Vô Định Bằng Liên Hợp (SGK 5.8b)",
    pts: 20,
    question: "Tính giới hạn: $\\lim\\limits_{x \\to 0} \\frac{\\sqrt{x^2 + 9} - 3}{x^2}$.",
    options: [
      { text: "$\\frac{1}{6}$", correct: true },
      { text: "$\\frac{1}{3}$", correct: false },
      { text: "$0$", correct: false },
      { text: "$\\frac{1}{9}$", correct: false }
    ],
    explanation: "Nhân lượng liên hợp: $\\frac{(\\sqrt{x^2+9}-3)(\\sqrt{x^2+9}+3)}{x^2(\\sqrt{x^2+9}+3)} = \\frac{(x^2+9)-9}{x^2(\\sqrt{x^2+9}+3)} = \\frac{x^2}{x^2(\\sqrt{x^2+9}+3)} = \\frac{1}{\\sqrt{x^2+9}+3}$. Khi $x \\to 0$, giá trị dần tới $\\frac{1}{\\sqrt{9}+3} = \\frac{1}{6}$."
  },
  {
    id: 4,
    title: "Hàm Bước Nhảy Heaviside (SGK 5.9)",
    pts: 20,
    question: "Cho hàm Heaviside $H(t) = \\begin{cases} 0 & \\text{nếu } t < 0 \\\\ 1 & \\text{nếu } t \\ge 0 \\end{cases}$. Giá trị của $\\lim\\limits_{t \\to 0^+} H(t)$ và $\\lim\\limits_{t \\to 0^-} H(t)$ lần lượt là:",
    options: [
      { text: "$1$ và $0$", correct: true },
      { text: "$0$ và $1$", correct: false },
      { text: "$1$ và $1$", correct: false },
      { text: "Không tồn tại cả hai giới hạn", correct: false }
    ],
    explanation: "Khi $t \\to 0^+$, tức $t > 0$, ta có $H(t) = 1$ nên giới hạn bằng $1$. Khi $t \\to 0^-$, tức $t < 0$, ta có $H(t) = 0$ nên giới hạn bằng $0$. Do hai giới hạn trái và phải khác nhau ($1 \\ne 0$) nên không tồn tại giới hạn hai phía $\\lim\\limits_{t \\to 0} H(t)$."
  },
  {
    id: 5,
    title: "Giới Hạn Một Bên Vô Cực (SGK 5.10a)",
    pts: 20,
    question: "Tính giới hạn một bên sau: $\\lim\\limits_{x \\to 1^+} \\frac{x - 2}{x - 1}$.",
    options: [
      { text: "$+\\infty$", correct: false },
      { text: "$-\\infty$", correct: true },
      { text: "$-1$", correct: false },
      { text: "$0$", correct: false }
    ],
    explanation: "Khi $x \\to 1^+$, tử số $x - 2 \\to -1 < 0$. Mẫu số $x - 1 \\to 0$ và luôn dương ($x - 1 > 0$ do $x > 1$). Áp dụng quy tắc dấu của thương: âm chia dương nhỏ dần về 0 sẽ tiến tới $-\\infty$."
  },
  {
    id: 6,
    title: "Giới Hạn Một Bên Mẫu Dần Về 0 (SGK 5.10b)",
    pts: 20,
    question: "Tính giới hạn một bên: $\\lim\\limits_{x \\to 4^-} \\frac{x^2 - x + 1}{4 - x}$.",
    options: [
      { text: "$+\\infty$", correct: true },
      { text: "$-\\infty$", correct: false },
      { text: "$13$", correct: false },
      { text: "$0$", correct: false }
    ],
    explanation: "Khi $x \\to 4^-$, tử số $x^2 - x + 1 \\to 4^2 - 4 + 1 = 13 > 0$. Mẫu số $4 - x \\to 0$ và mang dấu dương ($4 - x > 0$ do $x < 4$). Vậy $\\lim\\limits_{x \\to 4^-} \\frac{x^2 - x + 1}{4 - x} = +\\infty$."
  },
  {
    id: 7,
    title: "Hàm Chứa Dấu Giá Trị Tuyệt Đối (SGK 5.11)",
    pts: 20,
    question: "Cho hàm số $g(x) = \\frac{x^2 - 5x + 6}{|x - 2|}$. Tính $\\lim\\limits_{x \\to 2^+} g(x)$ và $\\lim\\limits_{x \\to 2^-} g(x)$.",
    options: [
      { text: "Giới hạn phải bằng $-1$, giới hạn trái bằng $1$.", correct: true },
      { text: "Giới hạn phải bằng $1$, giới hạn trái bằng $-1$.", correct: false },
      { text: "Cả hai giới hạn đều bằng $-1$.", correct: false },
      { text: "Cả hai giới hạn đều bằng $0$.", correct: false }
    ],
    explanation: "Phân tích tử số: $x^2 - 5x + 6 = (x - 2)(x - 3)$. Khi $x > 2$, $|x - 2| = x - 2 \\implies g(x) = x - 3 \\to 2 - 3 = -1$. Khi $x < 2$, $|x - 2| = -(x - 2) \\implies g(x) = -(x - 3) \\to -(2 - 3) = 1$."
  },
  {
    id: 8,
    title: "Giới Hạn Tại Vô Cực Chứa Căn (SGK 5.12a)",
    pts: 20,
    question: "Tính giới hạn: $\\lim\\limits_{x \\to +\\infty} \\frac{1 - 2x}{\\sqrt{x^2 + 1}}$.",
    options: [
      { text: "$-2$", correct: true },
      { text: "$2$", correct: false },
      { text: "$-1$", correct: false },
      { text: "$0$", correct: false }
    ],
    explanation: "Vì $x \\to +\\infty$, chia cả tử và mẫu cho $x > 0$: Tử có $\\frac{1}{x} - 2 \\to -2$. Mẫu có $\\frac{\\sqrt{x^2 + 1}}{x} = \\sqrt{1 + \\frac{1}{x^2}} \\to 1$. Vậy giới hạn là $\\frac{-2}{1} = -2$."
  },
  {
    id: 9,
    title: "Dạng Vô Định Vô Cực Trừ Vô Cực (SGK 5.12b)",
    pts: 20,
    question: "Tính giới hạn: $\\lim\\limits_{x \\to +\\infty} (\\sqrt{x^2 + x + 2} - x)$.",
    options: [
      { text: "$\\frac{1}{2}$", correct: true },
      { text: "$1$", correct: false },
      { text: "$0$", correct: false },
      { text: "$+\\infty$", correct: false }
    ],
    explanation: "Nhân lượng liên hợp: $\\frac{(x^2 + x + 2) - x^2}{\\sqrt{x^2 + x + 2} + x} = \\frac{x + 2}{\\sqrt{x^2 + x + 2} + x}$. Chia cả tử và mẫu cho $x$: tử dần tới $1$, mẫu dần tới $\\sqrt{1} + 1 = 2$. Do đó giới hạn bằng $\\frac{1}{2}$."
  },
  {
    id: 10,
    title: "Khảo Sát Tiệm Cận Hai Bên (SGK 5.13)",
    pts: 20,
    question: "Cho hàm số $f(x) = \\frac{2}{(x - 1)(x - 2)}$. Khẳng định nào sau đây là <strong>đúng</strong>?",
    options: [
      { text: "$\\lim\\limits_{x \\to 2^+} f(x) = +\\infty$ và $\\lim\\limits_{x \\to 2^-} f(x) = -\\infty$.", correct: true },
      { text: "$\\lim\\limits_{x \\to 2^+} f(x) = -\\infty$ và $\\lim\\limits_{x \\to 2^-} f(x) = +\\infty$.", correct: false },
      { text: "$\\lim\\limits_{x \\to 2} f(x) = 0$.", correct: false },
      { text: "$\\lim\\limits_{x \\to 2} f(x) = +\\infty$.", correct: false }
    ],
    explanation: "Khi $x \\to 2$, $(x - 1) \\to 1 > 0$, tử số $2 > 0$. Khi $x \\to 2^+$, $x - 2 > 0 \\implies f(x) \\to +\\infty$. Khi $x \\to 2^-$, $x - 2 < 0 \\implies f(x) \\to -\\infty$."
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

  // Disable all buttons in this question
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
  // Badge 1: Hoàn thành câu đầu tiên
  if (answeredCount >= 1 && !appState.badges[0]) {
    unlockBadge(1);
  }
  // Badge 2: Streak >= 3
  if (appState.streak >= 3 && !appState.badges[1]) {
    unlockBadge(2);
  }
  // Badge 4: XP >= 160
  if (appState.xp >= 160 && !appState.badges[3]) {
    unlockBadge(4);
  }
  // Badge 5: Đúng 10/10 câu
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

// --- 6. PHÒNG THÍ NGHIỆM 1: KHỬ DẠNG VÔ ĐỊNH ---
let lab1Zoom = 1;

function initLab1() {
  const funcSelect = document.getElementById('funcSelect');
  const xSlider = document.getElementById('xSlider');
  const xDisplay = document.getElementById('xValDisplay');
  const btnZoom = document.getElementById('btnZoomIn');
  const btnReset = document.getElementById('btnResetLab1');

  function updateLab1() {
    const mode = funcSelect.value;
    const xVal = parseFloat(xSlider.value);
    xDisplay.textContent = xVal.toFixed(2);
    drawLab1Canvas(mode, xVal);
    renderLab1Output(mode, xVal);
  }

  if (funcSelect) funcSelect.addEventListener('change', () => {
    if (funcSelect.value === 'frac') {
      xSlider.min = 0; xSlider.max = 2; xSlider.value = 1.4;
    } else if (funcSelect.value === 'root') {
      xSlider.min = -2; xSlider.max = 2; xSlider.value = 0.5;
    } else {
      xSlider.min = 0; xSlider.max = 4; xSlider.value = 2.5;
    }
    updateLab1();
  });

  if (xSlider) xSlider.addEventListener('input', updateLab1);

  if (btnZoom) btnZoom.addEventListener('click', () => {
    lab1Zoom = lab1Zoom === 1 ? 2.5 : 1;
    btnZoom.textContent = lab1Zoom > 1 ? "🔍 Góc nhìn chuẩn" : "🔍 Thu hẹp lân cận";
    updateLab1();
  });

  if (btnReset) btnReset.addEventListener('click', () => {
    lab1Zoom = 1;
    if (btnZoom) btnZoom.textContent = "🔍 Thu hẹp lân cận";
    funcSelect.value = 'frac';
    xSlider.min = 0; xSlider.max = 2; xSlider.value = 1.4;
    updateLab1();
  });

  updateLab1();
}

function drawLab1Canvas(mode, currentX) {
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Background grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  const step = 30;
  for (let x = 0; x < W; x += step) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += step) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Setup axes mapping
  let x0 = 1, L = 2;
  let minX = -0.5, maxX = 3.5, minY = -1, maxY = 4.5;
  if (mode === 'root') {
    x0 = 0; L = 1/6;
    minX = -3; maxX = 3; minY = -0.2; maxY = 0.5;
  } else if (mode === 'quad') {
    x0 = 2; L = -4;
    minX = -0.5; maxX = 4.5; minY = -6.5; maxY = 0.5;
  }

  if (lab1Zoom > 1) {
    const spanX = (maxX - minX) / lab1Zoom;
    const spanY = (maxY - minY) / lab1Zoom;
    minX = x0 - spanX / 2; maxX = x0 + spanX / 2;
    minY = L - spanY / 2; maxY = L + spanY / 2;
  }

  function toPxX(x) { return ((x - minX) / (maxX - minX)) * W; }
  function toPxY(y) { return H - ((y - minY) / (maxY - minY)) * H; }

  // Draw Axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  const originX = toPxX(0);
  const originY = toPxY(0);

  if (originY >= 0 && originY <= H) {
    ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(W, originY); ctx.stroke();
  }
  if (originX >= 0 && originX <= W) {
    ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, H); ctx.stroke();
  }

  // Draw function curve
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  let first = true;
  for (let px = 0; px < W; px += 2) {
    const x = minX + (px / W) * (maxX - minX);
    if (Math.abs(x - x0) < 0.001) continue;
    let y = 0;
    if (mode === 'frac') y = (x * x - 1) / (x - 1);
    else if (mode === 'root') y = (Math.sqrt(x * x + 9) - 3) / (x * x);
    else if (mode === 'quad') y = (4 - x * x) / (x - 2);

    const py = toPxY(y);
    if (first) { ctx.moveTo(px, py); first = false; }
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Draw Limit Point (Hole)
  const holeX = toPxX(x0);
  const holeY = toPxY(L);
  ctx.strokeStyle = '#f59e0b';
  ctx.fillStyle = '#090d16';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(holeX, holeY, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Draw Current Probe Point
  let curY = 0;
  if (Math.abs(currentX - x0) < 0.001) {
    curY = L;
  } else {
    if (mode === 'frac') curY = (currentX * currentX - 1) / (currentX - 1);
    else if (mode === 'root') curY = (Math.sqrt(currentX * currentX + 9) - 3) / (currentX * currentX);
    else if (mode === 'quad') curY = (4 - currentX * currentX) / (currentX - 2);
  }

  const curPx = toPxX(currentX);
  const curPy = toPxY(curY);

  // Dash lines to axes
  ctx.strokeStyle = 'rgba(244, 63, 94, 0.6)';
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(curPx, originY);
  ctx.lineTo(curPx, curPy);
  ctx.lineTo(originX, curPy);
  ctx.stroke();
  ctx.setLineDash([]);

  // Probe Point Circle
  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(curPx, curPy, 7, 0, Math.PI * 2);
  ctx.fill();

  // Label coordinates
  ctx.fillStyle = '#f1f5f9';
  ctx.font = '12px Inter, sans-serif';
  ctx.fillText(`P(${currentX.toFixed(2)}, ${curY.toFixed(3)})`, curPx + 10, curPy - 10);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`Lỗ thủng: (${x0}, ${L.toFixed(3)})`, holeX + 10, holeY + 15);
}

function renderLab1Output(mode, x) {
  const out = document.getElementById('lab1Output');
  if (!out) return;

  let x0 = 1, LStr = "2";
  let factorText = "";
  if (mode === 'frac') {
    x0 = 1; LStr = "2";
    factorText = `Khử nhân tử: $\\frac{x^2 - 1}{x - 1} = \\frac{(x - 1)(x + 1)}{x - 1} = x + 1$. Khi $x \\to 1 \\implies f(x) \\to 2$.`;
  } else if (mode === 'root') {
    x0 = 0; LStr = "\\frac{1}{6} \\approx 0.1667";
    factorText = `Nhân liên hợp: $\\frac{\\sqrt{x^2+9}-3}{x^2} = \\frac{1}{\\sqrt{x^2+9}+3}$. Khi $x \\to 0 \\implies f(x) \\to \\frac{1}{6}$.`;
  } else {
    x0 = 2; LStr = "-4";
    factorText = `Khử nhân tử: $\\frac{4 - x^2}{x - 2} = \\frac{-(x - 2)(x + 2)}{x - 2} = -(x + 2)$. Khi $x \\to 2 \\implies f(x) \\to -4$.`;
  }

  const delta = Math.abs(x - x0);
  out.innerHTML = `
    <strong>🔍 Trạng thái lân cận tại $x = ${x.toFixed(2)}$:</strong><br>
    Khoảng cách đến điểm kì dị: $\\Delta x = |x - x_0| = ${delta.toFixed(4)}$.<br>
    ${factorText}<br>
    <strong>Kết luận:</strong> Điểm $x = ${x0}$ là <em>lỗ thủng gián đoạn có thể khử</em>. Giới hạn tồn tại sắc nét $\\lim\\limits_{x \\to ${x0}} f(x) = ${LStr}$.
  `;
  renderMathInTree(out);
}

// --- 7. PHÒNG THÍ NGHIỆM 2: GIỚI HẠN MỘT BÊN & TIỆM CẬN ---
function initLab2() {
  const modeSelect = document.getElementById('lab2Mode');
  const slider = document.getElementById('lab2Slider');
  const valDisplay = document.getElementById('lab2ValDisplay');

  function updateLab2() {
    const mode = modeSelect.value;
    const xVal = parseFloat(slider.value);
    valDisplay.textContent = xVal.toFixed(2);
    drawLab2Canvas(mode, xVal);
    renderLab2Output(mode, xVal);
  }

  if (modeSelect) modeSelect.addEventListener('change', () => {
    if (modeSelect.value === 'step') {
      slider.min = -2; slider.max = 2; slider.step = 0.02; slider.value = 0.5;
    } else if (modeSelect.value === 'split') {
      slider.min = -1; slider.max = 3; slider.step = 0.02; slider.value = 1.2;
    } else if (modeSelect.value === 'asymptote') {
      slider.min = -1; slider.max = 3; slider.step = 0.02; slider.value = 1.5;
    } else if (modeSelect.value === 'einstein') {
      slider.min = 0; slider.max = 0.98; slider.step = 0.01; slider.value = 0.8;
    }
    updateLab2();
  });

  if (slider) slider.addEventListener('input', updateLab2);

  updateLab2();
}

function drawLab2Canvas(mode, currentX) {
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

  let minX = -2.5, maxX = 2.5, minY = -1, maxY = 3;
  if (mode === 'asymptote') {
    minX = -1; maxX = 3; minY = -6; maxY = 6;
  } else if (mode === 'einstein') {
    minX = -0.1; maxX = 1.1; minY = 0; maxY = 6;
  }

  function toPxX(x) { return ((x - minX) / (maxX - minX)) * W; }
  function toPxY(y) { return H - ((y - minY) / (maxY - minY)) * H; }

  const originX = toPxX(0);
  const originY = toPxY(0);

  // Axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  if (originY >= 0 && originY <= H) {
    ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(W, originY); ctx.stroke();
  }
  if (originX >= 0 && originX <= W) {
    ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, H); ctx.stroke();
  }

  ctx.lineWidth = 3;

  if (mode === 'step') {
    // Left branch: t < 0 => 0
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    ctx.moveTo(toPxX(minX), toPxY(0));
    ctx.lineTo(toPxX(0), toPxY(0));
    ctx.stroke();

    // Right branch: t >= 0 => 1
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    ctx.moveTo(toPxX(0), toPxY(1));
    ctx.lineTo(toPxX(maxX), toPxY(1));
    ctx.stroke();

    // End points
    ctx.fillStyle = '#090d16'; ctx.strokeStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(toPxX(0), toPxY(0), 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(toPxX(0), toPxY(1), 5, 0, Math.PI * 2); ctx.fill();
  } else if (mode === 'split') {
    // x < 1: y = x^2
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    for (let x = minX; x < 1; x += 0.05) {
      const px = toPxX(x), py = toPxY(x * x);
      if (x === minX) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // x >= 1: y = x + 1
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    for (let x = 1; x <= maxX; x += 0.05) {
      const px = toPxX(x), py = toPxY(x + 1);
      if (x === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Hole at (1, 1) and solid at (1, 2)
    ctx.fillStyle = '#090d16'; ctx.strokeStyle = '#38bdf8';
    ctx.beginPath(); ctx.arc(toPxX(1), toPxY(1), 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(toPxX(1), toPxY(2), 5, 0, Math.PI * 2); ctx.fill();
  } else if (mode === 'asymptote') {
    // Asymptote x = 1
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(toPxX(1), 0); ctx.lineTo(toPxX(1), H); ctx.stroke();
    ctx.setLineDash([]);

    // Curve
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    for (let x = minX; x <= 0.95; x += 0.02) {
      const y = 1 / (x - 1);
      const px = toPxX(x), py = toPxY(y);
      if (x === minX) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    for (let x = 1.05; x <= maxX; x += 0.02) {
      const y = 1 / (x - 1);
      const px = toPxX(x), py = toPxY(y);
      if (x === 1.05) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  } else if (mode === 'einstein') {
    // Asymptote v = 1
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.7)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath(); ctx.moveTo(toPxX(1), 0); ctx.lineTo(toPxX(1), H); ctx.stroke();
    ctx.setLineDash([]);

    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    for (let v = 0; v <= 0.985; v += 0.01) {
      const m = 1 / Math.sqrt(1 - v * v);
      const px = toPxX(v), py = toPxY(m);
      if (v === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }

  // Draw current probe point
  let yVal = 0;
  if (mode === 'step') yVal = currentX < 0 ? 0 : 1;
  else if (mode === 'split') yVal = currentX < 1 ? currentX * currentX : currentX + 1;
  else if (mode === 'asymptote') yVal = currentX !== 1 ? 1 / (currentX - 1) : 0;
  else if (mode === 'einstein') yVal = 1 / Math.sqrt(1 - currentX * currentX);

  const curPx = toPxX(currentX);
  const curPy = toPxY(yVal);

  ctx.fillStyle = '#f43f5e';
  ctx.beginPath();
  ctx.arc(curPx, Math.max(0, Math.min(H, curPy)), 7, 0, Math.PI * 2);
  ctx.fill();
}

function renderLab2Output(mode, x) {
  const out = document.getElementById('lab2Output');
  if (!out) return;

  if (mode === 'step') {
    out.innerHTML = `
      <strong>⚡ Phân tích Hàm Heaviside tại $t = 0$:</strong><br>
      • Giới hạn bên trái: $\\lim\\limits_{t \\to 0^-} H(t) = 0$.<br>
      • Giới hạn bên phải: $\\lim\\limits_{t \\to 0^+} H(t) = 1$.<br>
      <strong>Nhận định:</strong> Do $\\lim\\limits_{t \\to 0^-} \\ne \\lim\\limits_{t \\to 0^+}$ nên <strong>không tồn tại giới hạn 2 phía</strong> $\\lim\\limits_{t \\to 0} H(t)$!
    `;
  } else if (mode === 'split') {
    out.innerHTML = `
      <strong>🔀 Phân tích Hàm Phân Nhánh tại $x = 1$:</strong><br>
      • Giới hạn bên trái ($x < 1$): $\\lim\\limits_{x \\to 1^-} f(x) = \\lim\\limits_{x \\to 1^-} x^2 = 1$.<br>
      • Giới hạn bên phải ($x > 1$): $\\lim\\limits_{x \\to 1^+} f(x) = \\lim\\limits_{x \\to 1^+} (x + 1) = 2$.<br>
      <strong>Nhận định:</strong> Đồ thị bị đứt gãy với bước nhảy $\\Delta = 2 - 1 = 1$. Hàm số không có giới hạn tại $x = 1$.
    `;
  } else if (mode === 'asymptote') {
    out.innerHTML = `
      <strong>📈 Tiệm Cận Đứng Vô Cực $f(x) = \\frac{1}{x - 1}$:</strong><br>
      • Khi $x \\to 1^+$ ($x > 1$): mẫu $> 0 \\implies \\lim\\limits_{x \\to 1^+} f(x) = +\\infty$.<br>
      • Khi $x \\to 1^-$ ($x < 1$): mẫu $< 0 \\implies \\lim\\limits_{x \\to 1^-} f(x) = -\\infty$.<br>
      Đường thẳng $x = 1$ là tiệm cận đứng phân tách 2 nhánh đồ thị lao về hai cực đối lập!
    `;
  } else if (mode === 'einstein') {
    const m = 1 / Math.sqrt(1 - x * x);
    out.innerHTML = `
      <strong>🚀 Thuyết Tương Đối Einstein ($v/c = ${x.toFixed(2)}$):</strong><br>
      Hệ số tăng khối lượng: $m = \\frac{m_0}{\\sqrt{1 - (v/c)^2}} \\approx ${m.toFixed(2)} m_0$.<br>
      Khi $v \\to c^-$ ($v/c \\to 1^-$), ta có $\\lim\\limits_{v \\to c^-} m(v) = +\\infty$. Khối lượng phình to vô hạn, ngăn cản mọi vật thể đạt tới tốc độ ánh sáng!
    `;
  }

  // Trigger Badge 3
  if (!appState.badges[2]) {
    unlockBadge(3);
  }

  renderMathInTree(out);
}

// --- 8. AVATAR MODAL & NAVIGATION ---
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

      // Trigger Math render on switch
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

  // Initial Math rendering
  setTimeout(() => {
    renderMathInTree(document.body);
  }, 100);
});
