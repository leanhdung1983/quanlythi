/**
 * TOÁN 11 KẾT NỐI TRI THỨC - BÀI 17: HÀM SỐ LIÊN TỤC
 * Pure Vanilla Web Stack (HTML5, CSS3, JavaScript ES6+, Web Audio API, Canvas 2D)
 * 100% Offline-capable, KaTeX & MathML fallback, Cyber Logic Aesthetics
 */

// --- 1. STATE MANAGEMENT ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Hàm Số Liền Nét',
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
      console.warn("KaTeX render error:", e);
    }
  }
}

// --- 4. DATA CHO ĐẤU TRƯỜNG SGK (10 CÂU BÀI 17) ---
const quizData = [
  {
    id: 1,
    title: "Phép Toán Hàm Số Liên Tục (SGK 5.14)",
    pts: 20,
    question: "Cho $f(x)$ và $g(x)$ là hai hàm số liên tục tại điểm $x = 1$. Biết $f(1) = 2$ và $\\lim\\limits_{x \\to 1} [2f(x) - g(x)] = 3$. Giá trị của $g(1)$ bằng:",
    options: [
      { text: "$1$", correct: true },
      { text: "$-1$", correct: false },
      { text: "$7$", correct: false },
      { text: "$4$", correct: false }
    ],
    explanation: "Vì hai hàm số liên tục tại $x = 1$ nên $\\lim\\limits_{x \\to 1} f(x) = f(1) = 2$ và $\\lim\\limits_{x \\to 1} g(x) = g(1)$. Theo quy tắc giới hạn: $\\lim\\limits_{x \\to 1} [2f(x) - g(x)] = 2f(1) - g(1) = 3 \\iff 2(2) - g(1) = 3 \\implies g(1) = 4 - 3 = 1$."
  },
  {
    id: 2,
    title: "Khoảng Liên Tục Của Hàm Phân Thức (SGK 5.15a)",
    pts: 20,
    question: "Xét hàm số $f(x) = \\frac{x}{x^2 + 5x + 6}$. Hàm số này liên tục trên các khoảng nào sau đây?",
    options: [
      { text: "$(-\\infty; -3)$, $(-3; -2)$ và $(-2; +\\infty)$", correct: true },
      { text: "$(-\\infty; 2)$ và $(3; +\\infty)$", correct: false },
      { text: "Liên tục trên toàn bộ $\\mathbb{R}$", correct: false },
      { text: "$(-3; -2)$", correct: false }
    ],
    explanation: "Mẫu thức $x^2 + 5x + 6 = 0 \\iff (x + 2)(x + 3) = 0 \\iff x = -2$ hoặc $x = -3$. Hàm phân thức hữu tỉ liên tục trên từng khoảng xác định của nó, tức là trên 3 khoảng: $(-\\infty; -3)$, $(-3; -2)$ và $(-2; +\\infty)$."
  },
  {
    id: 3,
    title: "Xét Điểm Gián Đoạn Hàm Phân Nhánh (SGK 5.15b)",
    pts: 20,
    question: "Cho hàm số $f(x) = \\begin{cases} 1 + x^2 & \\text{nếu } x < 1 \\\\ 4 - x & \\text{nếu } x \\ge 1 \\end{cases}$. Khẳng định nào sau đây là <strong>đúng</strong> về tính liên tục của hàm số tại $x = 1$?",
    options: [
      { text: "Hàm số bị gián đoạn tại $x = 1$ vì giới hạn trái khác giới hạn phải.", correct: true },
      { text: "Hàm số liên tục tại $x = 1$ vì $f(1) = 3$.", correct: false },
      { text: "Hàm số liên tục trên toàn bộ $\\mathbb{R}$.", correct: false },
      { text: "Hàm số không xác định tại $x = 1$.", correct: false }
    ],
    explanation: "Ta có $f(1) = 4 - 1 = 3$. Giới hạn phải: $\\lim\\limits_{x \\to 1^+} f(x) = \\lim\\limits_{x \\to 1^+} (4 - x) = 3$. Giới hạn trái: $\\lim\\limits_{x \\to 1^-} f(x) = \\lim\\limits_{x \\to 1^-} (1 + x^2) = 2$. Do $\\lim\\limits_{x \\to 1^-} f(x) \\ne \\lim\\limits_{x \\to 1^+} f(x)$ ($2 \\ne 3$), giới hạn hai phía không tồn tại, hàm số gián đoạn tại $x = 1$."
  },
  {
    id: 4,
    title: "Tìm Tham Số Để Hàm Số Liên Tục (SGK 5.16)",
    pts: 20,
    question: "Tìm giá trị của tham số $m$ để hàm số $f(x) = \\begin{cases} \\sin x & \\text{nếu } x \\ge 0 \\\\ -x + m & \\text{nếu } x < 0 \\end{cases}$ liên tục trên $\\mathbb{R}$.",
    options: [
      { text: "$m = 0$", correct: true },
      { text: "$m = 1$", correct: false },
      { text: "$m = -1$", correct: false },
      { text: "$m = \\pi$", correct: false }
    ],
    explanation: "Hàm số liên tục trên $(-\\infty; 0)$ và $(0; +\\infty)$. Để liên tục trên $\\mathbb{R}$, nó phải liên tục tại $x = 0$. Ta có $f(0) = \\sin 0 = 0$, $\\lim\\limits_{x \\to 0^+} f(x) = 0$, và $\\lim\\limits_{x \\to 0^-} f(x) = \\lim\\limits_{x \\to 0^-} (-x + m) = m$. Để liên tục tại $x = 0$ thì $m = 0$."
  },
  {
    id: 5,
    title: "Định Lí Bolzano Tìm Khoảng Chứa Nghiệm (SGK Ví dụ 6)",
    pts: 20,
    question: "Phương trình $x^5 + x^3 - 10 = 0$ có ít nhất một nghiệm thực trong khoảng nào sau đây?",
    options: [
      { text: "$(0; 2)$", correct: true },
      { text: "$(2; 4)$", correct: false },
      { text: "$(-2; 0)$", correct: false },
      { text: "$(3; 5)$", correct: false }
    ],
    explanation: "Xét $f(x) = x^5 + x^3 - 10$ liên tục trên $[0; 2]$. Ta có $f(0) = -10 < 0$ và $f(2) = 2^5 + 2^3 - 10 = 32 + 8 - 10 = 30 > 0$. Vì $f(0) \\cdot f(2) = -300 < 0$, theo định lý Bolzano tồn tại ít nhất một nghiệm $c \\in (0; 2)$ sao cho $f(c) = 0$."
  },
  {
    id: 6,
    title: "Hàn Gắn Lỗ Thủng Bằng Tham Số",
    pts: 20,
    question: "Cho hàm số $f(x) = \\begin{cases} \\frac{x^2 - 4}{x - 2} & \\text{khi } x \\ne 2 \\\\ a & \\text{khi } x = 2 \\end{cases}$. Hàm số liên tục tại điểm $x = 2$ khi và chỉ khi:",
    options: [
      { text: "$a = 4$", correct: true },
      { text: "$a = 2$", correct: false },
      { text: "$a = 0$", correct: false },
      { text: "$a = -4$", correct: false }
    ],
    explanation: "Ta có $\\lim\\limits_{x \\to 2} f(x) = \\lim\\limits_{x \\to 2} \\frac{(x - 2)(x + 2)}{x - 2} = \\lim\\limits_{x \\to 2} (x + 2) = 4$. Để hàm số liên tục tại $x = 2$, ta cần $f(2) = \\lim\\limits_{x \\to 2} f(x) \\iff a = 4$."
  },
  {
    id: 7,
    title: "Ứng Dụng Bolzano Cho Hàm Bậc Ba",
    pts: 20,
    question: "Cho phương trình $x^3 - 3x - 1 = 0$. Số nghiệm thực phân biệt của phương trình trong khoảng $(-2; 2)$ là:",
    options: [
      { text: "$3$", correct: true },
      { text: "$1$", correct: false },
      { text: "$2$", correct: false },
      { text: "$0$", correct: false }
    ],
    explanation: "Đặt $f(x) = x^3 - 3x - 1$ liên tục trên $\\mathbb{R}$. Tính giá trị: $f(-2) = -3 < 0$, $f(-1) = 1 > 0$, $f(0) = -1 < 0$, $f(2) = 1 > 0$. Áp dụng định lí giá trị trung gian: có ít nhất 1 nghiệm trong $(-2; -1)$, 1 nghiệm trong $(-1; 0)$, và 1 nghiệm trong $(0; 2)$. Vì phương trình bậc 3 có tối đa 3 nghiệm, nên phương trình có đúng 3 nghiệm thực trong khoảng $(-2; 2)$."
  },
  {
    id: 8,
    title: "Thương Của Hai Hàm Số Liên Tục",
    pts: 20,
    question: "Cho hai hàm số $f(x) = \\cos x$ và $g(x) = x^2 + 1$. Hàm số nào sau đây <strong>KHÔNG</strong> liên tục trên toàn bộ $\\mathbb{R}$?",
    options: [
      { text: "$y = \\frac{g(x)}{f(x)} = \\frac{x^2 + 1}{\\cos x}$", correct: true },
      { text: "$y = \\frac{f(x)}{g(x)} = \\frac{\\cos x}{x^2 + 1}$", correct: false },
      { text: "$y = f(x) + g(x) = \\cos x + x^2 + 1$", correct: false },
      { text: "$y = f(x) \\cdot g(x) = (x^2 + 1)\\cos x$", correct: false }
    ],
    explanation: "Hàm $g(x) = x^2 + 1 \\ge 1 > 0$ với mọi $x \\in \\mathbb{R}$ nên $\\frac{f(x)}{g(x)}$ xác định và liên tục trên $\\mathbb{R}$. Trong khi đó, mẫu thức $\\cos x = 0$ tại các điểm $x = \\frac{\\pi}{2} + k\\pi$ ($k \\in \\mathbb{Z}$), do đó hàm số $\\frac{x^2 + 1}{\\cos x}$ bị gián đoạn tại vô số điểm này."
  },
  {
    id: 9,
    title: "Ứng Dụng Thực Tiễn: Hàm Giá Cước Taxi (SGK 5.17)",
    pts: 20,
    question: "Bảng giá cước taxi: mở cửa 0,5 km đầu giá $10\\,000$ đ; từ trên 0,5 km đến 30 km giá $13\\,500$ đ/km; từ km 31 giá $11\\,000$ đ/km. Hàm số $T(x)$ biểu diễn tổng số tiền cước theo quãng đường $x$ (km) có tính chất gì?",
    options: [
      { text: "$T(x)$ liên tục trên nửa khoảng $[0; +\\infty)$ vì tiền cước tăng liền mạch không đứt gãy.", correct: true },
      { text: "$T(x)$ bị gián đoạn tại $x = 0{,}5$ và $x = 30$.", correct: false },
      { text: "$T(x)$ là một hàm hằng số trên toàn bộ quãng đường.", correct: false },
      { text: "$T(x)$ không xác định tại các điểm chuyển mức giá cước.", correct: false }
    ],
    explanation: "Số tiền cước taxi $T(x)$ tại các mốc nối $x = 0{,}5$ và $x = 30$ đều có giới hạn trái bằng giới hạn phải và bằng giá trị hàm số (tiền cước tính tịnh tiến liên tục cộng dồn, không bị nhảy bước vọt), do đó hàm cước $T(x)$ liên tục trên nửa khoảng $[0; +\\infty)$."
  },
  {
    id: 10,
    title: "Ý Nghĩa Vật Lí Định Lí Giá Trị Trung Gian",
    pts: 20,
    question: "Một xe ô tô di chuyển từ địa điểm A đến B cách nhau $180\\text{ km}$ trong đúng $3\\text{ giờ}$. Dựa vào định lí giá trị trung gian, kết luận nào sau đây chắc chắn đúng?",
    options: [
      { text: "Tồn tại ít nhất một thời điểm trên hành trình xe chạy với vận tốc đúng bằng $60\\text{ km/h}$.", correct: true },
      { text: "Xe luôn luôn chạy đều với vận tốc không đổi $60\\text{ km/h}$ trong suốt chuyến đi.", correct: false },
      { text: "Vận tốc cực đại của xe không thể vượt quá $60\\text{ km/h}$.", correct: false },
      { text: "Vận tốc xe bị gián đoạn liên tục khi tài xế nhấn ga hoặc đạp phanh.", correct: false }
    ],
    explanation: "Vận tốc trung bình của xe là $\\frac{180}{3} = 60\\text{ km/h}$. Vì vận tốc thực tế là một hàm liên tục theo thời gian, nên nếu có lúc xe chạy dưới $60\\text{ km/h}$ (ví dụ lúc khởi hành $0\\text{ km/h}$) và có lúc xe chạy trên $60\\text{ km/h}$ để bù thời gian, thì đồ thị vận tốc bắt buộc phải đi qua mức $60\\text{ km/h}$ ít nhất một lần!"
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

// --- 6. PHÒNG THÍ NGHIỆM 1: CÂY CẦU NỐI LIỀN NÉT ---
function initLab1() {
  const funcSelect = document.getElementById('bridgeFuncSelect');
  const mSlider = document.getElementById('mSlider');
  const mDisplay = document.getElementById('mValDisplay');
  const btnAuto = document.getElementById('btnAutoBridge');
  const btnReset = document.getElementById('btnResetLab1');

  function updateLab1() {
    const mode = funcSelect.value;
    const m = parseFloat(mSlider.value);
    mDisplay.textContent = m.toFixed(2);
    drawLab1Canvas(mode, m);
    renderLab1Output(mode, m);
  }

  if (funcSelect) funcSelect.addEventListener('change', () => {
    if (funcSelect.value === 'func1') {
      mSlider.min = -2; mSlider.max = 6; mSlider.value = 0.5;
    } else if (funcSelect.value === 'func2') {
      mSlider.min = -4; mSlider.max = 4; mSlider.value = 1.5;
    } else {
      mSlider.min = 0; mSlider.max = 8; mSlider.value = 2.0;
    }
    updateLab1();
  });

  if (mSlider) mSlider.addEventListener('input', updateLab1);

  if (btnAuto) btnAuto.addEventListener('click', () => {
    if (funcSelect.value === 'func1') mSlider.value = 2.0; // 1^2 = -1 + m => m = 2
    else if (funcSelect.value === 'func2') mSlider.value = 0.0; // sin(0) = -0 + m => m = 0
    else mSlider.value = 4.0; // lim (x^2-4)/(x-2) = 4
    updateLab1();
    playTone(600, 'sine', 0.15, 0.1);
  });

  if (btnReset) btnReset.addEventListener('click', () => {
    funcSelect.value = 'func1';
    mSlider.min = -2; mSlider.max = 6; mSlider.value = 0.5;
    updateLab1();
  });

  updateLab1();
}

function drawLab1Canvas(mode, m) {
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

  let minX = -3, maxX = 4, minY = -2, maxY = 6;
  if (mode === 'func2') {
    minX = -3; maxX = 3; minY = -3; maxY = 3;
  } else if (mode === 'func3') {
    minX = -1; maxX = 5; minY = -1; maxY = 7;
  }

  function toPxX(x) { return ((x - minX) / (maxX - minX)) * W; }
  function toPxY(y) { return H - ((y - minY) / (maxY - minY)) * H; }

  const originX = toPxX(0);
  const originY = toPxY(0);

  // Draw axes
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 1.5;
  if (originY >= 0 && originY <= H) {
    ctx.beginPath(); ctx.moveTo(0, originY); ctx.lineTo(W, originY); ctx.stroke();
  }
  if (originX >= 0 && originX <= W) {
    ctx.beginPath(); ctx.moveTo(originX, 0); ctx.lineTo(originX, H); ctx.stroke();
  }

  ctx.lineWidth = 3;

  if (mode === 'func1') {
    // Left branch: x < 1, y = x^2
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    for (let x = minX; x < 1; x += 0.05) {
      const px = toPxX(x), py = toPxY(x * x);
      if (x === minX) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Right branch: x >= 1, y = -x + m
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    for (let x = 1; x <= maxX; x += 0.05) {
      const px = toPxX(x), py = toPxY(-x + m);
      if (x === 1) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Connection points at x = 1
    const p1Y = 1; // 1^2
    const p2Y = -1 + m;
    const isBridgeJoined = Math.abs(p1Y - p2Y) < 0.08;

    if (isBridgeJoined) {
      // Glow circle
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(toPxX(1), toPxY(1), 8, 0, Math.PI * 2); ctx.fill();
    } else {
      // Hollow at left limit
      ctx.fillStyle = '#090d16'; ctx.strokeStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(toPxX(1), toPxY(p1Y), 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      // Solid at right limit
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(toPxX(1), toPxY(p2Y), 6, 0, Math.PI * 2); ctx.fill();
      // Gap indicator line
      ctx.strokeStyle = 'rgba(244, 63, 94, 0.7)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(toPxX(1), toPxY(p1Y)); ctx.lineTo(toPxX(1), toPxY(p2Y)); ctx.stroke();
      ctx.setLineDash([]);
    }
  } else if (mode === 'func2') {
    // Left: x < 0, y = -x + m
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath();
    for (let x = minX; x < 0; x += 0.05) {
      const px = toPxX(x), py = toPxY(-x + m);
      if (x === minX) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Right: x >= 0, y = sin(x)
    ctx.strokeStyle = '#10b981';
    ctx.beginPath();
    for (let x = 0; x <= maxX; x += 0.05) {
      const px = toPxX(x), py = toPxY(Math.sin(x));
      if (x === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    }
    ctx.stroke();

    const isBridgeJoined = Math.abs(m) < 0.08;
    if (isBridgeJoined) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(toPxX(0), toPxY(0), 8, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#090d16'; ctx.strokeStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(toPxX(0), toPxY(m), 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(toPxX(0), toPxY(0), 6, 0, Math.PI * 2); ctx.fill();
    }
  } else if (mode === 'func3') {
    // y = x + 2 (with hole at x=2, y=4), value at 2 is m
    ctx.strokeStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(toPxX(minX), toPxY(minX + 2));
    ctx.lineTo(toPxX(maxX), toPxY(maxX + 2));
    ctx.stroke();

    const isJoined = Math.abs(m - 4) < 0.08;
    if (isJoined) {
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath(); ctx.arc(toPxX(2), toPxY(4), 8, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.fillStyle = '#090d16'; ctx.strokeStyle = '#06b6d4';
      ctx.beginPath(); ctx.arc(toPxX(2), toPxY(4), 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(toPxX(2), toPxY(m), 6, 0, Math.PI * 2); ctx.fill();
    }
  }
}

function renderLab1Output(mode, m) {
  const out = document.getElementById('lab1Output');
  if (!out) return;

  if (mode === 'func1') {
    const leftLim = 1;
    const rightLim = -1 + m;
    const gap = Math.abs(leftLim - rightLim);
    const joined = gap < 0.08;

    out.innerHTML = `
      <strong>🌉 Phân tích tính liên tục tại $x = 1$:</strong><br>
      • Giới hạn trái: $\\lim\\limits_{x \\to 1^-} f(x) = 1^2 = 1$.<br>
      • Giới hạn phải &amp; giá trị: $\\lim\\limits_{x \\to 1^+} f(x) = f(1) = -1 + m = ${rightLim.toFixed(2)}$.<br>
      • Độ hở khe nứt: $\\Delta = |1 - (-1 + m)| = ${gap.toFixed(2)}$.<br>
      <strong>Trạng thái:</strong> ${joined ? '🎉 <span style="color:#10b981;font-weight:bold;">LIÊN TỤC HOÀN HẢO!</span> Cây cầu đã được hàn gắn liền nét tại $m = 2$.' : '⚠️ <span style="color:#f43f5e;font-weight:bold;">GIÁN ĐOẠN!</span> Cần điều chỉnh $m = 2$ để hàn gắn.'}
    `;
  } else if (mode === 'func2') {
    const joined = Math.abs(m) < 0.08;
    out.innerHTML = `
      <strong>🌉 Phân tích tính liên tục tại $x = 0$ (SGK 5.16):</strong><br>
      • Giới hạn phải: $\\lim\\limits_{x \\to 0^+} f(x) = f(0) = \\sin(0) = 0$.<br>
      • Giới hạn trái: $\\lim\\limits_{x \\to 0^-} f(x) = -0 + m = ${m.toFixed(2)}$.<br>
      <strong>Trạng thái:</strong> ${joined ? '🎉 <span style="color:#10b981;font-weight:bold;">LIÊN TỤC!</span> Hàm số liền nét trên $\\mathbb{R}$ khi $m = 0$.' : '⚠️ <span style="color:#f43f5e;font-weight:bold;">GIÁN ĐOẠN!</span> Đồ thị bị đứt quãng tại gốc tọa độ.'}
    `;
  } else {
    const joined = Math.abs(m - 4) < 0.08;
    out.innerHTML = `
      <strong>🌉 Khử lỗ thủng kì dị tại $x = 2$:</strong><br>
      • Giới hạn hai phía: $\\lim\\limits_{x \\to 2} \\frac{x^2 - 4}{x - 2} = 4$.<br>
      • Giá trị định nghĩa: $f(2) = m = ${m.toFixed(2)}$.<br>
      <strong>Trạng thái:</strong> ${joined ? '🎉 <span style="color:#10b981;font-weight:bold;">LỖ THỦNG ĐƯỢC LẤP ĐẦY!</span> $f(x)$ liên tục tại $x = 2$ khi $m = 4$.' : '⚠️ <span style="color:#f43f5e;font-weight:bold;">CÒN LỖ THỦNG!</span> Điểm $f(2)$ nằm rời rạc khỏi đường thẳng.'}
    `;
  }

  renderMathInTree(out);
}

// --- 7. PHÒNG THÍ NGHIỆM 2: MÁY QUÉT NGHIỆM BOLZANO ---
function initLab2() {
  const funcSelect = document.getElementById('bolzanoFuncSelect');
  const aSlider = document.getElementById('aSlider');
  const bSlider = document.getElementById('bSlider');
  const aDisplay = document.getElementById('aValDisplay');
  const bDisplay = document.getElementById('bValDisplay');

  function updateLab2() {
    const mode = funcSelect.value;
    let a = parseFloat(aSlider.value);
    let b = parseFloat(bSlider.value);
    if (a > b) { const tmp = a; a = b; b = tmp; }
    aDisplay.textContent = a.toFixed(1);
    bDisplay.textContent = b.toFixed(1);

    drawLab2Canvas(mode, a, b);
    renderLab2Output(mode, a, b);
  }

  if (funcSelect) funcSelect.addEventListener('change', () => {
    if (funcSelect.value === 'poly5') {
      aSlider.value = 0; bSlider.value = 2;
    } else if (funcSelect.value === 'cubic') {
      aSlider.value = -2; bSlider.value = -1;
    } else {
      aSlider.value = 0; bSlider.value = 1.5;
    }
    updateLab2();
  });

  if (aSlider) aSlider.addEventListener('input', updateLab2);
  if (bSlider) bSlider.addEventListener('input', updateLab2);

  updateLab2();
}

function evalBolzanoFunc(mode, x) {
  if (mode === 'poly5') return Math.pow(x, 5) + Math.pow(x, 3) - 10;
  if (mode === 'cubic') return Math.pow(x, 3) - 3 * x - 1;
  return Math.cos(x) - x;
}

function drawLab2Canvas(mode, a, b) {
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

  let minX = -3.5, maxX = 3.5, minY = -15, maxY = 35;
  if (mode === 'cubic') {
    minX = -3; maxX = 3; minY = -5; maxY = 5;
  } else if (mode === 'trig') {
    minX = -2; maxX = 3; minY = -3; maxY = 3;
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

  // Draw interval zone [a, b]
  const pxA = toPxX(a);
  const pxB = toPxX(b);
  ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
  ctx.fillRect(pxA, 0, pxB - pxA, H);

  // Draw function curve
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  let first = true;
  for (let px = 0; px <= W; px += 2) {
    const x = minX + (px / W) * (maxX - minX);
    const y = evalBolzanoFunc(mode, x);
    const py = toPxY(y);
    if (first) { ctx.moveTo(px, py); first = false; }
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Evaluate f(a) and f(b)
  const fa = evalBolzanoFunc(mode, a);
  const fb = evalBolzanoFunc(mode, b);

  // Mark points A and B
  ctx.fillStyle = fa < 0 ? '#f43f5e' : '#10b981';
  ctx.beginPath(); ctx.arc(toPxX(a), toPxY(fa), 6, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = fb < 0 ? '#f43f5e' : '#10b981';
  ctx.beginPath(); ctx.arc(toPxX(b), toPxY(fb), 6, 0, Math.PI * 2); ctx.fill();

  // Root highlight if product < 0
  if (fa * fb < 0) {
    // Find approximate root using bisection
    let lo = a, hi = b;
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (evalBolzanoFunc(mode, lo) * evalBolzanoFunc(mode, mid) <= 0) hi = mid;
      else lo = mid;
    }
    const rootX = (lo + hi) / 2;
    const pxRoot = toPxX(rootX);

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(pxRoot, originY, 7, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = '#f59e0b';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(`Nghiệm c ≈ ${rootX.toFixed(3)}`, pxRoot - 35, originY - 12);
  }
}

function renderLab2Output(mode, a, b) {
  const out = document.getElementById('lab2Output');
  if (!out) return;

  const fa = evalBolzanoFunc(mode, a);
  const fb = evalBolzanoFunc(mode, b);
  const prod = fa * fb;
  const hasRoot = prod < 0;

  out.innerHTML = `
    <strong>🔍 Kiểm tra điều kiện định lí Bolzano trên $[${a.toFixed(1)}; ${b.toFixed(1)}]$:</strong><br>
    • $f(a) = f(${a.toFixed(1)}) = ${fa.toFixed(3)}$<br>
    • $f(b) = f(${b.toFixed(1)}) = ${fb.toFixed(3)}$<br>
    • Tích giá trị hai đầu mút: $f(a) \\cdot f(b) = ${prod.toFixed(3)}$ ${hasRoot ? '< 0' : '≥ 0'}.<br>
    <strong>Kết luận:</strong> ${hasRoot ? '🎉 <span style="color:#10b981;font-weight:bold;">THỎA MÃN ĐỊNH LÍ!</span> Đồ thị hàm số liên tục bắt buộc phải cắt trục hoành tại ít nhất một nghiệm $c \\in (' + a.toFixed(1) + '; ' + b.toFixed(1) + ')$.' : '⚠️ Hai đầu mút cùng dấu ($f(a) \\cdot f(b) \\ge 0$). Hãy mở rộng hoặc điều chỉnh khoảng $[a; b]$ để bẫy nghiệm!'}
  `;

  if (!appState.badges[2]) {
    unlockBadge(3);
  }

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
