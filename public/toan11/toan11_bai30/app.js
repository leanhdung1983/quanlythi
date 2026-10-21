// ==========================================================================
// BÀI 30: CÔNG THỨC NHÂN XÁC SUẤT CHO HAI BIẾN CỐ ĐỘC LẬP - TOÁN 11 KNTT
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
  userTitle: 'Bậc Thầy Quy Tắc Nhân 11',
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
  clean = clean.replace(/\\cup/g, '<mo>&#8746;</mo>');
  clean = clean.replace(/\\cap/g, '<mo>&#8745;</mo>');
  clean = clean.replace(/\\neq/g, '<mo>&#8800;</mo>');
  clean = clean.replace(/\\approx/g, '<mo>&#8776;</mo>');
  clean = clean.replace(/\\cdot/g, '<mo>&#183;</mo>');
  clean = clean.replace(/\\ge/g, '<mo>&#8805;</mo>');
  clean = clean.replace(/\\le/g, '<mo>&#8804;</mo>');
  clean = clean.replace(/\\overline\{([^}]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#175;</mo></mover>');
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

// 4. DỮ LIỆU ĐẤU TRƯỜNG 10 CÂU TRẮC NGHIỆM BÀI 30
const quizData = [
  {
    id: 1,
    title: "Câu 1: Công thức nhân xác suất hai biến cố độc lập",
    pts: 20,
    question: "Nếu hai biến cố $A$ và $B$ độc lập với nhau thì công thức nào sau đây là đúng?",
    options: [
      { text: "$P(AB) = P(A) \\cdot P(B)$", correct: true },
      { text: "$P(AB) = P(A) + P(B)$", correct: false },
      { text: "$P(AB) = P(A) + P(B) - 1$", correct: false },
      { text: "$P(AB) = 1 - P(A)P(B)$", correct: false }
    ],
    explanation: "Theo định lý SGK Toán 11 KNTT trang 76: Nếu hai biến cố $A$ và $B$ độc lập với nhau thì $P(AB) = P(A) \\cdot P(B)$."
  },
  {
    id: 2,
    title: "Câu 2: Tính xác suất giao của 2 biến cố độc lập",
    pts: 20,
    question: "Cho hai biến cố độc lập $A$ và $B$ với $P(A) = 0,6$ và $P(B) = 0,5$. Xác suất của biến cố giao $AB$ bằng:",
    options: [
      { text: "0,30", correct: true },
      { text: "1,10", correct: false },
      { text: "0,10", correct: false },
      { text: "0,80", correct: false }
    ],
    explanation: "Vì $A$ và $B$ độc lập nên $P(AB) = P(A) \\cdot P(B) = 0,6 \\cdot 0,5 = 0,30$."
  },
  {
    id: 3,
    title: "Câu 3: Xác suất để biến cố này xảy ra nhưng biến cố kia không",
    pts: 20,
    question: "Cho $A$ và $B$ là hai biến cố độc lập. Xác suất để $A$ xảy ra nhưng $B$ không xảy ra là:",
    options: [
      { text: "$P(A)(1 - P(B))$", correct: true },
      { text: "$P(A) - P(B)$", correct: false },
      { text: "$1 - P(A)P(B)$", correct: false },
      { text: "$(1 - P(A))P(B)$", correct: false }
    ],
    explanation: "Biến cố \"$A$ xảy ra và $B$ không xảy ra\" là $A\\overline{B}$. Vì $A$ và $B$ độc lập nên $A$ và $\\overline{B}$ cũng độc lập: $P(A\\overline{B}) = P(A) \\cdot P(\\overline{B}) = P(A)(1 - P(B))$."
  },
  {
    id: 4,
    title: "Câu 4: Xác suất có ít nhất một biến cố xảy ra",
    pts: 20,
    question: "Cho hai biến cố độc lập $A$ và $B$. Công thức tính xác suất để có ít nhất một trong hai biến cố xảy ra là:",
    options: [
      { text: "$1 - P(\\overline{A})P(\\overline{B})$", correct: true },
      { text: "$P(A) + P(B)$", correct: false },
      { text: "$1 - P(A)P(B)$", correct: false },
      { text: "$P(\\overline{A}) \\cdot P(\\overline{B})$", correct: false }
    ],
    explanation: "Biến cố đối của \"có ít nhất một biến cố xảy ra\" là \"cả hai biến cố đều không xảy ra\", tức $\\overline{A}\\,\\overline{B}$. Do đó $P(A \\cup B) = 1 - P(\\overline{A}\\,\\overline{B}) = 1 - P(\\overline{A})P(\\overline{B})$."
  },
  {
    id: 5,
    title: "Câu 5: (SGK tr. 76) Bài toán An và Bình thi đấu thể thao",
    pts: 20,
    question: "An thi bắn súng (xác suất đoạt huy chương là 0,8), Bình thi bơi lội (xác suất đoạt huy chương là 0,9). Biết hai môn thi diễn ra độc lập. Xác suất để cả hai bạn cùng đoạt huy chương là:",
    options: [
      { text: "0,72", correct: true },
      { text: "0,85", correct: false },
      { text: "0,98", correct: false },
      { text: "0,17", correct: false }
    ],
    explanation: "Vì hai biến cố độc lập nên xác suất cả hai cùng đoạt huy chương là $P(AB) = 0,8 \\cdot 0,9 = 0,72$."
  },
  {
    id: 6,
    title: "Câu 6: (SGK tr. 76) Xác suất có đúng một bạn đoạt giải",
    pts: 20,
    question: "Cũng với An và Bình ở câu 5 ($P(A) = 0,8; P(B) = 0,9$). Xác suất để có đúng một bạn đoạt huy chương là:",
    options: [
      { text: "0,26", correct: true },
      { text: "0,18", correct: false },
      { text: "0,08", correct: false },
      { text: "0,34", correct: false }
    ],
    explanation: "Biến cố đúng 1 bạn đoạt giải gồm 2 trường hợp xung khắc: An đoạt giải và Bình không đoạt giải ($0,8 \\cdot (1 - 0,9) = 0,08$), hoặc Bình đoạt giải và An không ($0,9 \\cdot (1 - 0,8) = 0,18$). Tổng xác suất: $0,08 + 0,18 = 0,26$."
  },
  {
    id: 7,
    title: "Câu 7: (SGK 8.11) Gieo đồng xu và xúc xắc",
    pts: 20,
    question: "Gieo đồng thời một đồng xu cân đối và một con xúc xắc cân đối. Gọi $E$: \"Đồng xu xuất hiện mặt sấp\", $F$: \"Xúc xắc xuất hiện mặt 6 chấm\". Xác suất để cả hai biến cố cùng xảy ra là:",
    options: [
      { text: "$\\frac{1}{12}$", correct: true },
      { text: "$\\frac{1}{8}$", correct: false },
      { text: "$\\frac{7}{12}$", correct: false },
      { text: "$\\frac{1}{6}$", correct: false }
    ],
    explanation: "Đồng xu và xúc xắc hoàn toàn độc lập. $P(E) = \\frac{1}{2}$, $P(F) = \\frac{1}{6}$. Xác suất đồng thời là $P(EF) = \\frac{1}{2} \\cdot \\frac{1}{6} = \\frac{1}{12}$."
  },
  {
    id: 8,
    title: "Câu 8: (SGK 8.12) Hai xạ thủ bắn bia độc lập",
    pts: 20,
    question: "Hai xạ thủ cùng bắn một phát đạn vào tấm bia một cách độc lập. Xác suất bắn trúng bia của xạ thủ 1 và 2 lần lượt là 0,7 và 0,8. Xác suất để có ít nhất một xạ thủ bắn trúng bia là:",
    options: [
      { text: "0,94", correct: true },
      { text: "0,56", correct: false },
      { text: "0,86", correct: false },
      { text: "0,06", correct: false }
    ],
    explanation: "Biến cố đối là \"cả hai xạ thủ đều bắn trượt\": $P(\\overline{A}\\,\\overline{B}) = (1 - 0,7) \\cdot (1 - 0,8) = 0,3 \\cdot 0,2 = 0,06$. Vậy xác suất có ít nhất 1 người trúng là $1 - 0,06 = 0,94$."
  },
  {
    id: 9,
    title: "Câu 9: (SGK 8.13) Ba học sinh cùng giải bài toán khó",
    pts: 20,
    question: "Ba bạn học sinh làm bài độc lập. Xác suất giải được bài toán khó của ba bạn lần lượt là 0,6; 0,7 và 0,8. Xác suất để bài toán khó đó được giải quyết (ít nhất một bạn giải được) bằng:",
    options: [
      { text: "0,976", correct: true },
      { text: "0,336", correct: false },
      { text: "0,024", correct: false },
      { text: "0,940", correct: false }
    ],
    explanation: "Xác suất cả 3 bạn đều không giải được bài toán là $P = (1 - 0,6)(1 - 0,7)(1 - 0,8) = 0,4 \\cdot 0,3 \\cdot 0,2 = 0,024$. Do đó xác suất có ít nhất 1 bạn giải được là $1 - 0,024 = 0,976$."
  },
  {
    id: 10,
    title: "Câu 10: Kiểm tra tính độc lập từ số liệu",
    pts: 20,
    question: "Cho hai biến cố $A$ và $B$ có $P(A) = 0,4$; $P(B) = 0,5$ và $P(AB) = 0,25$. Khẳng định nào sau đây là đúng?",
    options: [
      { text: "$A$ và $B$ không độc lập vì $P(AB) \\neq P(A) \\cdot P(B)$", correct: true },
      { text: "$A$ và $B$ là hai biến cố độc lập", correct: false },
      { text: "$A$ và $B$ là hai biến cố xung khắc", correct: false },
      { text: "$P(A \\cup B) = 0,90$", correct: false }
    ],
    explanation: "Ta có $P(A) \\cdot P(B) = 0,4 \\cdot 0,5 = 0,20$. Trong khi đó đề cho $P(AB) = 0,25 \\neq 0,20$. Do $P(AB) \\neq P(A) \\cdot P(B)$ nên hai biến cố $A$ và $B$ không độc lập."
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

// 7. LAB 1: TRỰC QUAN HÓA SƠ ĐỒ HÌNH CÂY
function initLab1() {
  const sPA = document.getElementById('sliderPA');
  const sPB = document.getElementById('sliderPB');
  const valPA = document.getElementById('valPA');
  const valPB = document.getElementById('valPB');
  const outLab1 = document.getElementById('outLab1');
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const pA = parseFloat(sPA.value);
    const pB = parseFloat(sPB.value);
    const notA = 1 - pA;
    const notB = 1 - pB;

    valPA.textContent = pA.toFixed(2);
    valPB.textContent = pB.toFixed(2);

    const pAB = pA * pB;
    const pANotB = pA * notB;
    const pNotAB = notA * pB;
    const pNotANotB = notA * notB;
    const pUnion = 1 - pNotANotB;

    outLab1.innerHTML = `Cả 2 cùng thắng: $P(AB) = ${pAB.toFixed(3)}$ | Đúng 1 người thắng: $P = ${(pANotB + pNotAB).toFixed(3)}$ | Ít nhất 1 người thắng: $P(A \\cup B) = ${pUnion.toFixed(3)}$`;
    renderMathInTree(outLab1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ Sơ Đồ Cây 2 tầng
    const rootX = 60;
    const rootY = 170;

    const n1X = 220;
    const n1AY = 90;
    const n1NotAY = 250;

    const n2X = 390;
    const yAB = 50;
    const yANotB = 130;
    const yNotAB = 210;
    const yNotANotB = 290;

    ctx.lineWidth = 2;
    ctx.font = '13px sans-serif';

    // Nhánh tầng 1
    ctx.strokeStyle = '#818cf8';
    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.lineTo(n1X, n1AY);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(rootX, rootY);
    ctx.lineTo(n1X, n1NotAY);
    ctx.stroke();

    // Chữ tầng 1
    ctx.fillStyle = '#c7d2fe';
    ctx.fillText(`An thắng (${pA.toFixed(2)})`, 90, 115);
    ctx.fillText(`An thua (${notA.toFixed(2)})`, 90, 235);

    // Nhánh tầng 2 từ An thắng
    ctx.strokeStyle = '#f472b6';
    ctx.beginPath();
    ctx.moveTo(n1X, n1AY);
    ctx.lineTo(n2X, yAB);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(n1X, n1AY);
    ctx.lineTo(n2X, yANotB);
    ctx.stroke();

    // Nhánh tầng 2 từ An thua
    ctx.beginPath();
    ctx.moveTo(n1X, n1NotAY);
    ctx.lineTo(n2X, yNotAB);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(n1X, n1NotAY);
    ctx.lineTo(n2X, yNotANotB);
    ctx.stroke();

    // Chữ tầng 2
    ctx.fillStyle = '#fbcfe8';
    ctx.fillText(`Bình thắng (${pB.toFixed(2)})`, 245, 60);
    ctx.fillText(`Bình thua (${notB.toFixed(2)})`, 245, 120);
    ctx.fillText(`Bình thắng (${pB.toFixed(2)})`, 245, 220);
    ctx.fillText(`Bình thua (${notB.toFixed(2)})`, 245, 280);

    // Kết quả cuối nhánh
    ctx.textAlign = 'left';
    ctx.font = 'bold 13px sans-serif';

    ctx.fillStyle = '#10b981';
    ctx.fillText(`AB: ${pAB.toFixed(3)} (Cả 2 thắng)`, n2X + 10, yAB + 4);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`A B̅: ${pANotB.toFixed(3)} (Chỉ An thắng)`, n2X + 10, yANotB + 4);

    ctx.fillStyle = '#ec4899';
    ctx.fillText(`A̅B: ${pNotAB.toFixed(3)} (Chỉ Bình thắng)`, n2X + 10, yNotAB + 4);

    ctx.fillStyle = '#ef4444';
    ctx.fillText(`A̅ B̅: ${pNotANotB.toFixed(3)} (Cả 2 thua)`, n2X + 10, yNotANotB + 4);
  }

  sPA.addEventListener('input', draw);
  sPB.addEventListener('input', draw);
  draw();
}

// 8. LAB 2: MÔ PHỎNG ĐẤU TRƯỜNG BẮN SÚNG ĐỘC LẬP
function initLab2() {
  const sShots = document.getElementById('sliderShots');
  const valShots = document.getElementById('valShots');
  const btn = document.getElementById('btnShoot');
  const outLab2 = document.getElementById('outLab2');
  const canvas = document.getElementById('canvasLab2');
  if (!canvas || !btn) return;
  const ctx = canvas.getContext('2d');

  sShots.addEventListener('input', () => {
    valShots.textContent = sShots.value;
  });

  function shoot() {
    sound.playClick();
    const total = parseInt(sShots.value);
    const p1 = 0.8;
    const p2 = 0.9;

    let hitBoth = 0;
    let hitOnly1 = 0;
    let hitOnly2 = 0;
    let hitNone = 0;

    for (let i = 0; i < total; i++) {
      const s1 = Math.random() < p1;
      const s2 = Math.random() < p2;
      if (s1 && s2) hitBoth++;
      else if (s1 && !s2) hitOnly1++;
      else if (!s1 && s2) hitOnly2++;
      else hitNone++;
    }

    const hitAtLeastOne = hitBoth + hitOnly1 + hitOnly2;
    const rBoth = (hitBoth / total) * 100;
    const rOne = ((hitOnly1 + hitOnly2) / total) * 100;
    const rAtLeastOne = (hitAtLeastOne / total) * 100;

    outLab2.innerHTML = `Thực nghiệm ${total} lượt: Cả 2 cùng trúng: $${hitBoth}$ lượt (${rBoth.toFixed(1)}\\%) | Đúng 1 người trúng: $${hitOnly1 + hitOnly2}$ lượt (${rOne.toFixed(1)}\\%) | Ít nhất 1 người trúng: $${hitAtLeastOne}$ lượt (${rAtLeastOne.toFixed(1)}\\%)<br><span style="color: #10b981;">✓ Lý thuyết: $P(AB) = 0,8 \\cdot 0,9 = 72,0\\%$ | $P(\\text{ít nhất 1}) = 1 - 0,2 \\cdot 0,1 = 98,0\\%$</span>`;
    renderMathInTree(outLab2);

    // Vẽ bia bắn súng mô phỏng
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = 150;
    const cy = 170;
    const rings = [110, 85, 60, 35, 15];
    const ringColors = ['#1e293b', '#334155', '#475569', '#ef4444', '#fbbf24'];

    for (let i = 0; i < rings.length; i++) {
      ctx.fillStyle = ringColors[i];
      ctx.beginPath();
      ctx.arc(cx, cy, rings[i], 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#94a3b8';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Hiển thị kết quả cột bên phải
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText('KẾT QUẢ ĐẤU TRƯỜNG BẮN BIA', 290, 60);

    const stats = [
      { label: 'Cả 2 cùng trúng (72%)', count: hitBoth, pct: rBoth, color: '#10b981' },
      { label: 'Chỉ xạ thủ 1 trúng (8%)', count: hitOnly1, pct: (hitOnly1 / total) * 100, color: '#f59e0b' },
      { label: 'Chỉ xạ thủ 2 trúng (18%)', count: hitOnly2, pct: (hitOnly2 / total) * 100, color: '#6366f1' },
      { label: 'Cả hai cùng trượt (2%)', count: hitNone, pct: (hitNone / total) * 100, color: '#ef4444' }
    ];

    let rowY = 100;
    stats.forEach(st => {
      ctx.fillStyle = st.color;
      ctx.fillRect(290, rowY, 14, 14);
      ctx.fillStyle = '#f8fafc';
      ctx.font = '13px sans-serif';
      ctx.fillText(`${st.label}: ${st.count} (${st.pct.toFixed(1)}%)`, 315, rowY + 12);
      rowY += 40;
    });
  }

  btn.addEventListener('click', shoot);
  shoot();
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
