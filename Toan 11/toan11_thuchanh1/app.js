/**
 * TOÁN 11 KẾT NỐI TRI THỨC - THỰC HÀNH TRẢI NGHIỆM 1: TOÁN HỌC TRONG TÀI CHÍNH
 * Pure Vanilla Web Stack (HTML5, CSS3, JavaScript ES6+, Web Audio API, Canvas 2D)
 * 100% Offline-capable, KaTeX & MathML fallback, Cyber Logic Aesthetics
 */

// --- 1. STATE MANAGEMENT ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Tài Chính & Lãi Kép',
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
  clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  clean = clean.replace(/\\approx/g, '<mo>&asymp;</mo>');
  clean = clean.replace(/\\times/g, '<mo>&times;</mo>');
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

// --- 4. DATA CHO ĐẤU TRƯỜNG SGK (10 CÂU THỰC HÀNH TÀI CHÍNH) ---
const quizData = [
  {
    id: 1,
    title: "Khái Niệm Niên Kim Trong Tài Chính (SGK)",
    pts: 20,
    question: "Trong toán học tài chính, khái niệm <strong>Niên kim</strong> (Annuity) được định nghĩa là:",
    options: [
      { text: "Một khoản tiền được trả hoặc gửi bằng các khoản thanh toán đều đặn bằng nhau sau những khoảng thời gian bằng nhau.", correct: true },
      { text: "Khoản tiền lãi chỉ được trả duy nhất một lần vào cuối chu kì đầu tư.", correct: false },
      { text: "Toàn bộ số vốn ban đầu gửi vào ngân hàng với lãi đơn không đổi.", correct: false },
      { text: "Khoản nợ quá hạn không có khả năng thanh toán.", correct: false }
    ],
    explanation: "Theo định nghĩa SGK trang 126, niên kim là một khoản tiền được trả bằng các khoản thanh toán đều đặn bằng nhau $R$, có thể thực hiện theo năm, nửa năm, quý, hoặc tháng."
  },
  {
    id: 2,
    title: "Xác Định Số Kì Của Niên Kim (SGK HĐ1)",
    pts: 20,
    question: "Bác Lan gửi đều đặn $10\\text{ triệu đồng}$ vào đầu mỗi tháng trong vòng $5\\text{ năm}$ vào tài khoản tích lũy hưởng lãi suất $6\\%$/năm tính lãi kép hàng tháng. Tổng số kì thanh toán $n$ và lãi suất mỗi kì $i$ là:",
    options: [
      { text: "$n = 60\\text{ kì}$, $i = 0{,}5\\%/\\text{tháng}$", correct: true },
      { text: "$n = 5\\text{ kì}$, $i = 6\\%/\\text{năm}$", correct: false },
      { text: "$n = 20\\text{ kì}$, $i = 1{,}5\\%/\\text{quý}$", correct: false },
      { text: "$n = 120\\text{ kì}$, $i = 0{,}05\\%/\\text{tháng}$", correct: false }
    ],
    explanation: "Trong $5\\text{ năm}$ có $5 \\times 12 = 60\\text{ tháng}$ (tức $n = 60\\text{ kì}$). Lãi suất mỗi tháng là $i = \\frac{6\\%}{12} = 0{,}5\\%/\\text{tháng} = 0{,}005$."
  },
  {
    id: 3,
    title: "Công Thức Tích Lũy Tương Lai (SGK)",
    pts: 20,
    question: "Số tiền tích lũy $A_f$ của một niên kim gồm $n$ khoản thanh toán đều đặn bằng $R$ với lãi suất $i$ mỗi kì được tính theo công thức:",
    options: [
      { text: "$A_f = R \\cdot \\frac{(1 + i)^n - 1}{i}$", correct: true },
      { text: "$A_f = R \\cdot (1 + i)^n$", correct: false },
      { text: "$A_f = R \\cdot \\frac{1 - (1 + i)^{-n}}{i}$", correct: false },
      { text: "$A_f = n \\cdot R \\cdot (1 + i)$", correct: false }
    ],
    explanation: "SGK trang 126: Tổng số tiền sau $n$ kì là tổng của cấp số nhân $R + R(1+i) + \\dots + R(1+i)^{n-1} = R \\cdot \\frac{(1+i)^n - 1}{(1+i) - 1} = R \\cdot \\frac{(1+i)^n - 1}{i}$."
  },
  {
    id: 4,
    title: "Tính Khoản Đầu Tư Định Kì (SGK Vận dụng 1)",
    pts: 20,
    question: "Anh Bình cần đầu tư bao nhiêu tiền hàng tháng ($R$) với lãi suất $6\\%$/năm ($i = 0{,}5\\%/\\text{tháng}$), theo hình thức tính lãi kép hàng tháng, để có $200\\text{ triệu đồng}$ sau $2\\text{ năm}$ ($n = 24\\text{ tháng}$)?",
    options: [
      { text: "Khoảng $7{,}864\\text{ triệu đồng}$ ($7\\,864\\,000$ đ/tháng)", correct: true },
      { text: "Khoảng $8{,}333\\text{ triệu đồng}$", correct: false },
      { text: "Khoảng $6{,}542\\text{ triệu đồng}$", correct: false },
      { text: "Khoảng $9{,}125\\text{ triệu đồng}$", correct: false }
    ],
    explanation: "Từ $A_f = R \\cdot \\frac{(1+i)^n - 1}{i}$, ta suy ra: $R = A_f \\cdot \\frac{i}{(1+i)^n - 1} = 200 \\cdot \\frac{0{,}005}{(1{,}005)^{24} - 1} \\approx 7{,}864\\text{ triệu đồng}$ (xấp xỉ $7\\,864\\,000$ đ/tháng)."
  },
  {
    id: 5,
    title: "Giá Trị Hiện Tại Của Một Khoản Tiền (SGK HĐ2)",
    pts: 20,
    question: "Nếu sau $n$ kì trong tương lai bạn nhận được số tiền $A_f$, với lãi suất mỗi kì là $i$, thì giá trị hiện tại $A_p$ của số tiền đó là:",
    options: [
      { text: "$A_p = A_f \\cdot (1 + i)^{-n} = \\frac{A_f}{(1 + i)^n}$", correct: true },
      { text: "$A_p = A_f \\cdot (1 + i)^n$", correct: false },
      { text: "$A_p = A_f - n \\cdot i$", correct: false },
      { text: "$A_p = \\frac{A_f}{n \\cdot i}$", correct: false }
    ],
    explanation: "Số tiền $A_p$ đầu tư bây giờ sau $n$ kì sinh lời thành $A_p(1+i)^n = A_f$. Do đó giá trị hiện tại là $A_p = A_f(1+i)^{-n}$."
  },
  {
    id: 6,
    title: "Lãi Kép Theo Quý (SGK HĐ2b)",
    pts: 20,
    question: "Một người gửi tiết kiệm với lãi suất $6\\%$/năm theo hình thức tính lãi kép hàng quý. Sau $5\\text{ năm}$ người đó nhận được $100\\text{ triệu đồng}$. Giá trị hiện tại $A_p$ của số tiền này là:",
    options: [
      { text: "Khoảng $74{,}25\\text{ triệu đồng}$ ($100 \\cdot (1 + 0{,}015)^{-20}$)", correct: true },
      { text: "Khoảng $70{,}00\\text{ triệu đồng}$", correct: false },
      { text: "Khoảng $85{,}50\\text{ triệu đồng}$", correct: false },
      { text: "Khoảng $62{,}10\\text{ triệu đồng}$", correct: false }
    ],
    explanation: "Số kì là $n = 5 \\times 4 = 20\\text{ quý}$. Lãi suất mỗi quý là $i = \\frac{6\\%}{4} = 1{,}5\\% = 0{,}015$. Giá trị hiện tại: $A_p = 100 \\times (1 + 0{,}015)^{-20} \\approx 74{,}25\\text{ triệu đồng}$."
  },
  {
    id: 7,
    title: "Định Giá Hiện Tại Giải Thưởng Trúng Số (SGK Vận dụng 2)",
    pts: 20,
    question: "Một người trúng xổ số đặc biệt $5\\text{ tỉ đồng}$ và được trả dần hàng năm, mỗi năm $500\\text{ triệu đồng}$ trong vòng $10\\text{ năm}$. Với lãi suất $8\\%$/năm tính lãi kép, giá trị hiện tại của giải thưởng này là:",
    options: [
      { text: "Khoảng $3\\,355\\text{ triệu đồng}$ (khoảng $3{,}355\\text{ tỉ đồng}$)", correct: true },
      { text: "Đúng bằng $5{,}000\\text{ tỉ đồng}$", correct: false },
      { text: "Khoảng $4\\,120\\text{ triệu đồng}$", correct: false },
      { text: "Khoảng $2\\,850\\text{ triệu đồng}$", correct: false }
    ],
    explanation: "Áp dụng công thức giá trị hiện tại niên kim: $A_p = R \\cdot \\frac{1 - (1+i)^{-n}}{i} = 500 \\cdot \\frac{1 - (1 + 0{,}08)^{-10}}{0{,}08} \\approx 3\\,355\\text{ triệu đồng}$ ($3{,}355\\text{ tỉ đồng}$). Vì tiền trong tương lai bị chiết khấu theo thời gian!"
  },
  {
    id: 8,
    title: "Bản Chất Của Phương Thức Mua Trả Góp",
    pts: 20,
    question: "Trong giao dịch mua trả góp tài sản giá trị lớn (nhà ở, ô tô), phát biểu nào sau đây là <strong>đúng nhất</strong>?",
    options: [
      { text: "Khoản thanh toán đều đặn hàng kì $R$ thực chất là một niên kim mà giá trị hiện tại $A_p$ chính là số tiền vốn vay ban đầu.", correct: true },
      { text: "Người mua chỉ cần trả nợ gốc, không phải chịu bất kì chi phí lãi vay nào.", correct: false },
      { text: "Tiền lãi hàng tháng được tính trên tổng số tiền vay ban đầu không giảm trừ nợ gốc.", correct: false },
      { text: "Số tiền trả góp hàng tháng biến động ngẫu nhiên tùy thuộc vào ngân hàng.", correct: false }
    ],
    explanation: "Theo định nghĩa SGK trang 127: Trả góp là phương thức vay tiền mà các kì trả nợ gốc và lãi trùng nhau. Các khoản thanh toán hàng kì $R$ là một niên kim có giá trị hiện tại $A_p$ bằng số tiền vay."
  },
  {
    id: 9,
    title: "Tính Khoản Trả Góp Mua Nhà Hàng Tháng (SGK Vận dụng 3)",
    pts: 20,
    question: "Một cặp vợ chồng vay ngân hàng $1\\text{ tỉ đồng}$ mua nhà với lãi suất $9\\%$/năm ($0{,}75\\%/\\text{tháng}$), trả góp hàng tháng trong $10\\text{ năm}$ ($n = 120\\text{ tháng}$). Số tiền họ phải trả mỗi tháng ($R$) là:",
    options: [
      { text: "Khoảng $12\\,668\\,000\\text{ đồng/tháng}$", correct: true },
      { text: "Khoảng $8\\,333\\,000\\text{ đồng/tháng}$", correct: false },
      { text: "Khoảng $15\\,500\\,000\\text{ đồng/tháng}$", correct: false },
      { text: "Khoảng $10\\,250\\,000\\text{ đồng/tháng}$", correct: false }
    ],
    explanation: "Áp dụng công thức trả góp: $R = \\frac{i \\cdot A_p}{1 - (1+i)^{-n}} = \\frac{0{,}0075 \\times 1\\,000\\,000\\,000}{1 - (1 + 0{,}0075)^{-120}} \\approx 12\\,667\\,577\\text{ đồng}$ (khoảng $12{,}668\\text{ triệu đồng/tháng}$)."
  },
  {
    id: 10,
    title: "Cội Nguồn Toán Học Của Niên Kim",
    pts: 20,
    question: "Công thức tích lũy niên kim $A_f = R \\cdot \\frac{(1+i)^n - 1}{i}$ được chứng minh dựa trên nền tảng toán học nào?",
    options: [
      { text: "Công thức tính tổng $n$ số hạng đầu tiên của một cấp số nhân.", correct: true },
      { text: "Công thức tính tổng của một cấp số cộng.", correct: false },
      { text: "Định lí giá trị trung gian Bolzano.", correct: false },
      { text: "Quy tắc nhân xác suất độc lập.", correct: false }
    ],
    explanation: "Dãy các khoản tiền sau khi cộng dồn lãi kép tạo thành các số hạng $R, R(1+i), R(1+i)^2, \\dots, R(1+i)^{n-1}$. Đây chính là cấp số nhân có số hạng đầu $u_1 = R$ và công bội $q = 1 + i$."
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

// --- 6. PHÒNG THÍ NGHIỆM 1: MÁY TÍNH TIẾT KIỆM TÍCH LŨY (Af) ---
function initLab1() {
  const rSlider = document.getElementById('saveRSlider');
  const rateSlider = document.getElementById('saveRateSlider');
  const yearSlider = document.getElementById('saveYearSlider');

  const rVal = document.getElementById('saveRVal');
  const rateVal = document.getElementById('saveRateVal');
  const yearVal = document.getElementById('saveYearVal');

  function updateLab1() {
    const R = parseFloat(rSlider.value);
    const rateAnnual = parseFloat(rateSlider.value);
    const years = parseInt(yearSlider.value);

    rVal.textContent = `${R.toFixed(1)} triệu`;
    rateVal.textContent = `${rateAnnual.toFixed(1)} %/năm`;
    yearVal.textContent = `${years} năm`;

    drawLab1Canvas(R, rateAnnual, years);
    renderLab1Output(R, rateAnnual, years);
  }

  if (rSlider) rSlider.addEventListener('input', updateLab1);
  if (rateSlider) rateSlider.addEventListener('input', updateLab1);
  if (yearSlider) yearSlider.addEventListener('input', updateLab1);

  updateLab1();
}

function drawLab1Canvas(R, rateAnnual, years) {
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

  const iMonthly = rateAnnual / 100 / 12;
  const data = [];
  let maxAf = 0;

  for (let y = 1; y <= years; y++) {
    const n = y * 12;
    const totalPrincipal = R * n;
    const Af = R * ((Math.pow(1 + iMonthly, n) - 1) / iMonthly);
    data.push({ year: y, principal: totalPrincipal, total: Af });
    if (Af > maxAf) maxAf = Af;
  }

  // Draw Bars comparison
  const barGroupWidth = (W - 80) / years;
  const barW = Math.min(30, barGroupWidth / 2.5);

  data.forEach((d, idx) => {
    const groupX = 50 + idx * barGroupWidth;

    // Principal Bar (blue)
    const hPrinc = (d.principal / (maxAf * 1.15)) * (H - 80);
    const yPrinc = H - 40 - hPrinc;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(groupX, yPrinc, barW, hPrinc);

    // Total Bar with Compound Interest (gold)
    const hTotal = (d.total / (maxAf * 1.15)) * (H - 80);
    const yTotal = H - 40 - hTotal;
    ctx.fillStyle = '#f59e0b';
    ctx.fillRect(groupX + barW + 4, yTotal, barW, hTotal);

    // Label Year
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`Năm ${d.year}`, groupX, H - 20);
  });

  // Legend
  ctx.fillStyle = '#38bdf8'; ctx.fillRect(W - 220, 15, 12, 12);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '11px Inter, sans-serif';
  ctx.fillText('Tổng gốc đã gửi', W - 200, 25);

  ctx.fillStyle = '#f59e0b'; ctx.fillRect(W - 110, 15, 12, 12);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('Cả gốc lẫn lãi', W - 90, 25);
}

function renderLab1Output(R, rateAnnual, years) {
  const out = document.getElementById('lab1Output');
  if (!out) return;

  const n = years * 12;
  const iMonthly = rateAnnual / 100 / 12;
  const Af = R * ((Math.pow(1 + iMonthly, n) - 1) / iMonthly);
  const totalPrincipal = R * n;
  const totalInterest = Af - totalPrincipal;

  out.innerHTML = `
    <strong>💰 Kế hoạch tích lũy sau ${years} năm (${n} kì gửi):</strong><br>
    • Tổng tiền gốc nộp vào: $${totalPrincipal.toFixed(1)}\\text{ triệu đồng}$.<br>
    • Tổng tiền cả gốc và lãi nhận được ($A_f$): $${Af.toFixed(2)}\\text{ triệu đồng}$.<br>
    • Tiền lãi sinh ra từ lãi kép: $+${totalInterest.toFixed(2)}\\text{ triệu đồng}$ (chiếm ${(totalInterest / Af * 100).toFixed(1)}\\% giá trị tài khoản).<br>
    <strong>Công thức:</strong> $A_f = R \\cdot \\frac{(1 + i)^n - 1}{i}$ với $R = ${R.toFixed(1)}, i = ${(iMonthly * 100).toFixed(3)}\\%, n = ${n}$.
  `;

  renderMathInTree(out);
}

// --- 7. PHÒNG THÍ NGHIỆM 2: BẢNG TÍNH VAY TRẢ GÓP (Ap) ---
function initLab2() {
  const loanSlider = document.getElementById('loanSlider');
  const rateSlider = document.getElementById('loanRateSlider');
  const yearSlider = document.getElementById('loanYearSlider');

  const loanVal = document.getElementById('loanVal');
  const rateVal = document.getElementById('loanRateVal');
  const yearVal = document.getElementById('loanYearVal');

  function updateLab2() {
    const loan = parseFloat(loanSlider.value);
    const rateAnnual = parseFloat(rateSlider.value);
    const years = parseInt(yearSlider.value);

    loanVal.textContent = `${loan.toLocaleString()} triệu (${(loan / 1000).toFixed(2)} tỉ)`;
    rateVal.textContent = `${rateAnnual.toFixed(1)} %/năm`;
    yearVal.textContent = `${years} năm`;

    drawLab2Canvas(loan, rateAnnual, years);
    renderLab2Output(loan, rateAnnual, years);
  }

  if (loanSlider) loanSlider.addEventListener('input', updateLab2);
  if (rateSlider) rateSlider.addEventListener('input', updateLab2);
  if (yearSlider) yearSlider.addEventListener('input', updateLab2);

  updateLab2();
}

function drawLab2Canvas(loan, rateAnnual, years) {
  const canvas = document.getElementById('canvasLab2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const n = years * 12;
  const iMonthly = rateAnnual / 100 / 12;
  const R = (iMonthly * loan) / (1 - Math.pow(1 + iMonthly, -n));

  // Trace remaining debt month by month
  let remaining = loan;
  const points = [{ m: 0, debt: loan }];

  for (let m = 1; m <= n; m++) {
    const interest = remaining * iMonthly;
    const principalPaid = R - interest;
    remaining -= principalPaid;
    if (m % 6 === 0 || m === n) {
      points.push({ m, debt: Math.max(0, remaining) });
    }
  }

  function toPxX(m) { return 50 + (m / n) * (W - 80); }
  function toPxY(debt) { return H - 40 - (debt / (loan * 1.1)) * (H - 80); }

  // Draw Debt Curve
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 3;
  ctx.beginPath();
  points.forEach((p, idx) => {
    const px = toPxX(p.m);
    const py = toPxY(p.debt);
    if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.stroke();

  // Area under curve
  ctx.fillStyle = 'rgba(244, 63, 94, 0.15)';
  ctx.beginPath();
  points.forEach((p, idx) => {
    const px = toPxX(p.m);
    const py = toPxY(p.debt);
    if (idx === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  });
  ctx.lineTo(toPxX(n), H - 40);
  ctx.lineTo(toPxX(0), H - 40);
  ctx.closePath();
  ctx.fill();

  // Start & End points
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(toPxX(0), toPxY(loan), 6, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#10b981';
  ctx.beginPath(); ctx.arc(toPxX(n), toPxY(0), 6, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Inter, sans-serif';
  ctx.fillText('0 tháng', toPxX(0) - 15, H - 20);
  ctx.fillText(`${years} năm (${n} tháng)`, toPxX(n) - 50, H - 20);
}

function renderLab2Output(loan, rateAnnual, years) {
  const out = document.getElementById('lab2Output');
  if (!out) return;

  const n = years * 12;
  const iMonthly = rateAnnual / 100 / 12;
  const R = (iMonthly * loan) / (1 - Math.pow(1 + iMonthly, -n));
  const totalPaid = R * n;
  const totalInterest = totalPaid - loan;

  out.innerHTML = `
    <strong>🏠 Kế hoạch trả nợ vay mua nhà ($A_p = ${loan}\\text{ triệu}$):</strong><br>
    • Số tiền trả đều đặn mỗi tháng: $R = ${R.toFixed(3)}\\text{ triệu đồng}$ (khoảng ${(R * 1000000).toLocaleString('vi-VN', {maximumFractionDigits: 0})} đ).<br>
    • Tổng số tiền trả cả kì ($${n}\\text{ tháng}$): $${totalPaid.toFixed(2)}\\text{ triệu đồng}$.<br>
    • Tổng tiền lãi ngân hàng thu: $+${totalInterest.toFixed(2)}\\text{ triệu đồng}$.<br>
    <strong>Công thức niên kim trả góp:</strong> $R = \\frac{i \\cdot A_p}{1 - (1 + i)^{-n}}$ với $A_p = ${loan}, i = ${(iMonthly * 100).toFixed(3)}\\%, n = ${n}$.
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
