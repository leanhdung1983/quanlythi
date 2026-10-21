// ==========================================================================
// BÀI 26: KHOẢNG CÁCH - HÌNH HỌC KHÔNG GIAN 11
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
  userTitle: 'Nhà Thám Hiểm Không Gian 11',
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
  clean = clean.replace(/\\cdot/g, '<mo>&#183;</mo>');
  clean = clean.replace(/\\perp/g, '<mo>&#8869;</mo>');
  clean = clean.replace(/\\parallel/g, '<mo>&#8741;</mo>');
  clean = clean.replace(/\\ge/g, '<mo>&#8805;</mo>');
  clean = clean.replace(/\\le/g, '<mo>&#8804;</mo>');
  clean = clean.replace(/\\approx/g, '<mo>&#8776;</mo>');
  clean = clean.replace(/\\circ/g, '<mo>&#176;</mo>');
  clean = clean.replace(/\\Delta/g, '<mi>&#916;</mi>');
  clean = clean.replace(/\\alpha/g, '<mi>&#945;</mi>');
  clean = clean.replace(/\\quad/g, '<mspace width="1em"/>');
  clean = clean.replace(/\\text\{([^}]+)\}/g, '<mtext>$1</mtext>');
  clean = clean.replace(/([a-zA-Z])/g, '<mi>$1</mi>');
  clean = clean.replace(/([0-9]+)/g, '<mn>$1</mn>');
  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${clean}</math>`;
}

function formatMathText(str) {
  if (!str) return '';
  return str.replace(/\$\$([\s\S]*?)\$\$/g, (m, c) => `<div class="math-block">${latexToMathML(c)}</div>`)
            .replace(/\$([^\$]+?)\$/g, (m, c) => `<span class="math-inline">${latexToMathML(c)}</span>`);
}

function renderMathInTree(root) {
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
  // Fallback nếu KaTeX không tải được
  if (root.innerHTML.includes('$')) {
    root.innerHTML = formatMathText(root.innerHTML);
  }
}

// 4. DỮ LIỆU ĐẤU TRƯỜNG 10 CÂU TRẮC NGHIỆM BÀI 26
const quizData = [
  {
    id: 1,
    title: "Câu 1: Định nghĩa khoảng cách từ điểm đến mặt phẳng",
    pts: 20,
    question: "Cho điểm $M$ và mặt phẳng $(P)$. Gọi $H$ là hình chiếu vuông góc của $M$ trên $(P)$. Khẳng định nào sau đây là ĐÚNG?",
    options: [
      { text: "$d(M, (P)) = MK$ với mọi điểm $K \\in (P)$", correct: false },
      { text: "$d(M, (P)) = MH$ và với mọi điểm $K \\in (P)$ ta luôn có $MK \\ge MH$", correct: true },
      { text: "$d(M, (P)) = 0$ khi và chỉ khi $M \\notin (P)$", correct: false },
      { text: "$d(M, (P)) > MK$ với mọi điểm $K \\in (P), K \\ne H$", correct: false }
    ],
    explanation: "Theo định nghĩa SGK, khoảng cách từ điểm $M$ đến mặt phẳng $(P)$ là độ dài đoạn thẳng $MH$ (với $H$ là hình chiếu vuông góc của $M$ trên $(P)$). Vì tam giác $MHK$ vuông tại $H$ nên cạnh xiên $MK \\ge MH$ (dấu bằng xảy ra khi $K \\equiv H$)."
  },
  {
    id: 2,
    title: "Câu 2: Khoảng cách giữa đường thẳng và mặt phẳng song song",
    pts: 20,
    question: "Cho đường thẳng $a$ song song với mặt phẳng $(P)$. Khoảng cách giữa $a$ và $(P)$ được tính bằng:",
    options: [
      { text: "Khoảng cách từ một điểm bất kì thuộc mặt phẳng $(P)$ đến đường thẳng $a$", correct: false },
      { text: "Khoảng cách từ một điểm bất kì thuộc đường thẳng $a$ đến mặt phẳng $(P)$", correct: true },
      { text: "Bằng $0$ vì đường thẳng $a$ và mặt phẳng $(P)$ không cắt nhau", correct: false },
      { text: "Độ dài đoạn thẳng bất kì nối một điểm trên $a$ với một điểm trên $(P)$", correct: false }
    ],
    explanation: "Khi $a \\parallel (P)$, mọi điểm trên $a$ đều cách đều mặt phẳng $(P)$. Do đó $d(a, (P)) = d(M, (P))$ với $M \\in a$ bất kì."
  },
  {
    id: 3,
    title: "Câu 3: Chiều cao của hình lăng trụ",
    pts: 20,
    question: "Trong một hình lăng trụ, khoảng cách giữa hai mặt phẳng chứa hai đáy được gọi là:",
    options: [
      { text: "Đường chéo chính của hình lăng trụ", correct: false },
      { text: "Đoạn thẳng nối hai tâm đáy", correct: false },
      { text: "Chiều cao của hình lăng trụ", correct: true },
      { text: "Chu vi của mặt phẳng đáy", correct: false }
    ],
    explanation: "Theo Chú ý trong SGK Toán 11 KNTT trang 56: Khoảng cách giữa hai đáy của một hình lăng trụ được gọi là chiều cao của hình lăng trụ đó."
  },
  {
    id: 4,
    title: "Câu 4: Đường vuông góc chung của hai đường thẳng chéo nhau",
    pts: 20,
    question: "Đường thẳng $\\Delta$ cắt cả hai đường thẳng chéo nhau $a, b$ và vuông góc với cả hai đường thẳng đó được gọi là:",
    options: [
      { text: "Trục đối xứng của hai đường thẳng $a$ và $b$", correct: false },
      { text: "Đường vuông góc chung của $a$ và $b$", correct: true },
      { text: "Đường phân giác không gian của $a$ và $b$", correct: false },
      { text: "Giao tuyến vuông góc của hai mặt phẳng", correct: false }
    ],
    explanation: "Đường thẳng $\\Delta$ cắt cả hai đường thẳng chéo nhau $a, b$ và vuông góc với cả $a, b$ được gọi là đường vuông góc chung của $a$ và $b$. Độ dài đoạn thẳng $MN$ nối hai giao điểm gọi là khoảng cách giữa $a$ và $b$."
  },
  {
    id: 5,
    title: "Câu 5: (SGK 7.22a) Chiều cao của hình chóp",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy là hình vuông cạnh $a$, tam giác $SAD$ là tam giác đều và nằm trong mặt phẳng vuông góc với mặt phẳng đáy $(ABCD)$. Chiều cao của hình chóp $S.ABCD$ bằng:",
    options: [
      { text: "$\\frac{a}{2}$", correct: false },
      { text: "$a$", correct: false },
      { text: "$\\frac{a\\sqrt{3}}{2}$", correct: true },
      { text: "$\\frac{a\\sqrt{2}}{2}$", correct: false }
    ],
    explanation: "Mặt phẳng $(SAD) \\perp (ABCD)$ theo giao tuyến $AD$. Kẻ đường cao $SH \\perp AD$ ($H$ là trung điểm $AD$), suy ra $SH \\perp (ABCD)$. Chiều cao hình chóp chính là độ dài đường cao tam giác đều cạnh $a$: $h = SH = \\frac{a\\sqrt{3}}{2}$."
  },
  {
    id: 6,
    title: "Câu 6: (SGK 7.22b) Khoảng cách giữa đường thẳng và mặt phẳng",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ như câu 5 ($ABCD$ hình vuông cạnh $a$, $(SAD) \\perp (ABCD)$). Khoảng cách giữa đường thẳng $BC$ và mặt phẳng $(SAD)$ bằng:",
    options: [
      { text: "$\\frac{a}{2}$", correct: false },
      { text: "$a$", correct: true },
      { text: "$a\\sqrt{2}$", correct: false },
      { text: "$\\frac{a\\sqrt{3}}{2}$", correct: false }
    ],
    explanation: "Vì $ABCD$ là hình vuông nên $BC \\parallel AD \\subset (SAD) \\implies BC \\parallel (SAD)$. Khoảng cách $d(BC, (SAD)) = d(B, (SAD))$. Vì $BA \\perp AD$ và $BA \\perp SH$ nên $BA \\perp (SAD)$, do đó $d(B, (SAD)) = BA = a$."
  },
  {
    id: 7,
    title: "Câu 7: (SGK 7.23a) Khoảng cách trong hình hộp chữ nhật",
    pts: 20,
    question: "Cho hình hộp chữ nhật $ABCD.A'B'C'D'$ có $AA' = a$, $AB = b$, $BC = c$. Khoảng cách giữa đường thẳng $CC'$ và mặt phẳng $(BB'D'D)$ bằng:",
    options: [
      { text: "$\\frac{bc}{\\sqrt{b^2 + c^2}}$", correct: true },
      { text: "$\\frac{ab}{\\sqrt{a^2 + b^2}}$", correct: false },
      { text: "$\\sqrt{b^2 + c^2}$", correct: false },
      { text: "$\\frac{abc}{\\sqrt{a^2 + b^2 + c^2}}$", correct: false }
    ],
    explanation: "Đường thẳng $CC' \\parallel BB' \\subset (BB'D'D) \\implies d(CC', (BB'D'D)) = d(C, (BB'D'D))$. Vì $BB' \\perp (ABCD)$ nên $(BB'D'D) \\perp (ABCD)$ theo giao tuyến $BD$. Hạ $CH \\perp BD$ trong đáy $ABCD$, suy ra $CH \\perp (BB'D'D)$. Trong tam giác vuông $BCD$ vuông tại $C$ có $BC = c, CD = b$: $CH = \\frac{BC \\cdot CD}{\\sqrt{BC^2 + CD^2}} = \\frac{bc}{\\sqrt{b^2 + c^2}}$."
  },
  {
    id: 8,
    title: "Câu 8: (SGK 7.24a) Đoạn vuông góc chung trong tứ diện đều",
    pts: 20,
    question: "Cho tứ diện đều $ABCD$ có tất cả các cạnh bằng $a$. Gọi $M, N$ tương ứng là trung điểm của $AB$ và $CD$. Độ dài đoạn vuông góc chung $MN$ bằng:",
    options: [
      { text: "$\\frac{a\\sqrt{3}}{2}$", correct: false },
      { text: "$\\frac{a\\sqrt{2}}{2}$", correct: true },
      { text: "$\\frac{a}{2}$", correct: false },
      { text: "$\\frac{a\\sqrt{6}}{3}$", correct: false }
    ],
    explanation: "Hai tam giác $ACD$ và $BCD$ đều cạnh $a$ nên $AN = BN = \\frac{a\\sqrt{3}}{2}$. Tam giác $ABN$ cân tại $N$ có trung tuyến $MN \\perp AB$. Chứng minh tương tự $MN \\perp CD$. Vậy $MN$ là đoạn vuông góc chung của $AB$ và $CD$. Trong tam giác vuông $AMN$: $MN = \\sqrt{AN^2 - AM^2} = \\sqrt{\\frac{3a^2}{4} - \\frac{a^2}{4}} = \\sqrt{\\frac{2a^2}{4}} = \\frac{a\\sqrt{2}}{2}$."
  },
  {
    id: 9,
    title: "Câu 9: (SGK 7.25) Khoảng cách giữa hai mặt phẳng song song",
    pts: 20,
    question: "Cho hình lập phương $ABCD.A'B'C'D'$ có cạnh bằng $a$. Khoảng cách giữa hai mặt phẳng song song $(D'AC)$ và $(BC'A')$ bằng:",
    options: [
      { text: "$\\frac{a\\sqrt{3}}{3}$", correct: true },
      { text: "$\\frac{a\\sqrt{2}}{2}$", correct: false },
      { text: "$\\frac{a}{2}$", correct: false },
      { text: "$\\frac{a\\sqrt{3}}{2}$", correct: false }
    ],
    explanation: "Đường chéo $BD'$ của hình lập phương vuông góc với cả hai mặt phẳng $(D'AC)$ và $(BC'A')$, đồng thời hai mặt phẳng này chia đoạn $BD' = a\\sqrt{3}$ thành 3 phần bằng nhau. Do đó khoảng cách giữa hai mặt phẳng song song là $d = \\frac{BD'}{3} = \\frac{a\\sqrt{3}}{3}$."
  },
  {
    id: 10,
    title: "Câu 10: (SGK 7.26) Ứng dụng thực tế giá đỡ ba chân",
    pts: 20,
    question: "Một giá đỡ máy ảnh có ba chân dài $129\\text{ cm}$, các đầu chân chống trên mặt phẳng tạo thành tam giác đều cạnh $110\\text{ cm}$. Chiều cao của giá đỡ gần bằng giá trị nào nhất sau đây?",
    options: [
      { text: "$112,4\\text{ cm}$", correct: true },
      { text: "$120,5\\text{ cm}$", correct: false },
      { text: "$98,6\\text{ cm}$", correct: false },
      { text: "$105,2\\text{ cm}$", correct: false }
    ],
    explanation: "Tam giác đều cạnh $a = 110\\text{ cm}$ có bán kính đường tròn ngoại tiếp đáy $R = \\frac{a}{\\sqrt{3}} = \\frac{110}{\\sqrt{3}} \\approx 63,51\\text{ cm}$. Chiều cao giá đỡ là $h = \\sqrt{l^2 - R^2} = \\sqrt{129^2 - \\left(\\frac{110}{\\sqrt{3}}\\right)^2} = \\sqrt{16641 - \\frac{12100}{3}} \\approx \\sqrt{12607,67} \\approx 112,28\\text{ cm} \\approx 112,4\\text{ cm}$."
  }
];

// 5. KHỞI TẠO ĐẤU TRƯỜNG & TƯƠNG TÁC TỨC THÌ
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];

  quizData.forEach((q, index) => {
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
  const correctCount = appState.xp / 20;

  // Badge 1: Làm câu đầu tiên
  if (!appState.badges[0] && answeredCount >= 1 && appState.xp >= 20) {
    appState.badges[0] = true;
    unlockBadgeUI(1);
  }
  // Badge 2: Đạt 60 XP
  if (!appState.badges[1] && appState.xp >= 60) {
    appState.badges[1] = true;
    unlockBadgeUI(2);
  }
  // Badge 3: Streak 3
  if (!appState.badges[2] && appState.streak >= 3) {
    appState.badges[2] = true;
    unlockBadgeUI(3);
  }
  // Badge 4: Đạt 160 XP
  if (!appState.badges[3] && appState.xp >= 160) {
    appState.badges[3] = true;
    unlockBadgeUI(4);
  }
  // Badge 5: Hoàn thành 10/10 xuất sắc
  if (!appState.badges[4] && correctCount === 10) {
    appState.badges[4] = true;
    unlockBadgeUI(5);
    sound.playFanfare();
  }
}

function unlockBadgeUI(num) {
  const badgeEl = document.getElementById(`badge-${num}`);
  if (badgeEl) {
    badgeEl.style.opacity = '1';
    badgeEl.style.border = '2px solid #818cf8';
    badgeEl.style.boxShadow = '0 0 20px rgba(99, 102, 241, 0.4)';
    sound.playLevelUp();
  }
}

// 7. PHÒNG THÍ NGHIỆM LAB 1: THƯỚC ĐO KHOẢNG CÁCH d(M, (P)) & ĐIỂM K
function initLab1() {
  const canvas = document.getElementById('canvasLab1');
  const sliderH = document.getElementById('sliderH');
  const sliderR = document.getElementById('sliderR');
  const valH = document.getElementById('valH');
  const valR = document.getElementById('valR');
  const outLab1 = document.getElementById('outLab1');

  if (!canvas || !sliderH || !sliderR) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const h = parseFloat(sliderH.value);
    const r = parseFloat(sliderR.value);
    valH.textContent = h;
    valR.textContent = r;

    const mk = Math.sqrt(h * h + r * r);
    if (outLab1) {
      outLab1.innerHTML = `Khoảng cách cực tiểu: $d(M, (P)) = MH = ${h}$ px | Cạnh xiên $MK = ${mk.toFixed(1)}$ px $\\ge MH$`;
      renderMathInTree(outLab1);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ mặt phẳng (P) hình bình hành không gian
    const pA = { x: 60, y: 220 };
    const pB = { x: 380, y: 220 };
    const pC = { x: 480, y: 310 };
    const pD = { x: 160, y: 310 };

    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.lineTo(pD.x, pD.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.fill();
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Nhãn mặt phẳng (P)
    ctx.fillStyle = '#a5b4fc';
    ctx.font = 'bold 16px Inter, sans-serif';
    ctx.fillText('(P)', pD.x + 20, pD.y - 15);

    // Tọa độ hình chiếu H trên (P)
    const H = { x: 230, y: 260 };

    // Tọa độ điểm M ở trên cao theo phương thẳng đứng
    const M = { x: H.x, y: H.y - h };

    // Tọa độ điểm K trên (P) trượt theo hướng ngang lệch một góc
    const K = { x: H.x + r * 1.1, y: H.y + (r * 0.25) };

    // Vẽ đường tròn quét bán kính r trên (P) bằng elip
    ctx.beginPath();
    ctx.ellipse(H.x, H.y, r * 1.1, r * 0.28, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    // Đoạn MH (đường vuông góc)
    ctx.beginPath();
    ctx.moveTo(M.x, M.y);
    ctx.lineTo(H.x, H.y);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Ký hiệu góc vuông tại H
    const sqSize = 14;
    ctx.beginPath();
    ctx.moveTo(H.x, H.y - sqSize);
    ctx.lineTo(H.x + sqSize * 0.8, H.y - sqSize + sqSize * 0.2);
    ctx.lineTo(H.x + sqSize * 0.8, H.y + sqSize * 0.2);
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Đoạn HK trên mặt phẳng (P)
    ctx.beginPath();
    ctx.moveTo(H.x, H.y);
    ctx.lineTo(K.x, K.y);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Cạnh huyền MK (đường xiên)
    ctx.beginPath();
    ctx.moveTo(M.x, M.y);
    ctx.lineTo(K.x, K.y);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Vẽ các điểm
    function drawPoint(pt, color, label, offX, offY) {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 6, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText(label, pt.x + offX, pt.y + offY);
    }

    drawPoint(M, '#f43f5e', 'M', -22, -6);
    drawPoint(H, '#06b6d4', 'H', -18, 18);
    drawPoint(K, '#f59e0b', 'K', 12, 6);

    // Chú thích các độ dài
    ctx.fillStyle = '#fda4af';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText(`MH = ${h} px`, M.x - 75, (M.y + H.y) / 2);

    ctx.fillStyle = '#67e8f9';
    ctx.fillText(`HK = ${r} px`, (H.x + K.x) / 2 - 20, H.y + 24);

    ctx.fillStyle = '#fde68a';
    ctx.fillText(`MK = ${mk.toFixed(1)} px`, (M.x + K.x) / 2 + 10, (M.y + K.y) / 2 - 10);
  }

  sliderH.addEventListener('input', draw);
  sliderR.addEventListener('input', draw);
  draw();
}

// 8. PHÒNG THÍ NGHIỆM LAB 2: ĐOẠN VUÔNG GÓC CHUNG TRONG KHÔNG GIAN
function initLab2() {
  const canvas = document.getElementById('canvasLab2');
  const sliderAngle = document.getElementById('sliderAngle');
  const valAngle = document.getElementById('valAngle');
  const btnModeSABC = document.getElementById('btnModeSABC');
  const btnModePlanes = document.getElementById('btnModePlanes');
  const outLab2 = document.getElementById('outLab2');

  if (!canvas || !sliderAngle) return;
  const ctx = canvas.getContext('2d');
  let currentMode = 'SABC';

  if (btnModeSABC && btnModePlanes) {
    btnModeSABC.addEventListener('click', () => {
      currentMode = 'SABC';
      btnModeSABC.style.background = 'rgba(99, 102, 241, 0.4)';
      btnModeSABC.style.border = '1px solid #818cf8';
      btnModePlanes.style.background = 'rgba(6, 182, 212, 0.2)';
      btnModePlanes.style.border = '1px solid #06b6d4';
      if (outLab2) {
        outLab2.innerHTML = 'Đoạn vuông góc chung: $AH \\perp SA$ và $AH \\perp BC \\implies d(SA, BC) = AH$';
        renderMathInTree(outLab2);
      }
      draw();
    });
    btnModePlanes.addEventListener('click', () => {
      currentMode = 'Planes';
      btnModePlanes.style.background = 'rgba(99, 102, 241, 0.4)';
      btnModePlanes.style.border = '1px solid #818cf8';
      btnModeSABC.style.background = 'rgba(6, 182, 212, 0.2)';
      btnModeSABC.style.border = '1px solid #06b6d4';
      if (outLab2) {
        outLab2.innerHTML = 'Khoảng cách giữa hai mặt phẳng song song: $d(a, b) = d((P), (Q)) = MN$';
        renderMathInTree(outLab2);
      }
      draw();
    });
  }

  function draw() {
    const angleDeg = parseFloat(sliderAngle.value);
    valAngle.textContent = angleDeg;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rad = (angleDeg * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    if (currentMode === 'SABC') {
      // Chiếu 3D hình chóp S.ABC với SA vuông góc (ABC)
      const originX = 260;
      const originY = 220;

      // Đỉnh A ở gốc
      const A = { x: originX, y: originY };
      // SA thẳng đứng hướng lên
      const S = { x: A.x, y: A.y - 140 };
      // B xoay trong mặt phẳng đáy (ABC)
      const B = { x: A.x - 130 * cosA - 30 * sinA, y: A.y + 40 + 20 * sinA };
      // C xoay trong mặt phẳng đáy
      const C = { x: A.x + 130 * cosA - 20 * sinA, y: A.y + 70 - 15 * sinA };

      // Chân đường cao H từ A vuông góc BC trong tam giác ABC
      const t = 0.45;
      const H = { x: B.x + t * (C.x - B.x), y: B.y + t * (C.y - B.y) };

      // Vẽ đáy ABC
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(B.x, B.y);
      ctx.lineTo(C.x, C.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.fill();

      // Nét đứt AB và AC nếu nhìn từ sau, ở đây vẽ nét liền sáng
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Cạnh SA (đường cao chóp)
      ctx.beginPath();
      ctx.moveTo(S.x, S.y);
      ctx.lineTo(A.x, A.y);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Các cạnh bên SB, SC
      ctx.beginPath();
      ctx.moveTo(S.x, S.y);
      ctx.lineTo(B.x, B.y);
      ctx.moveTo(S.x, S.y);
      ctx.lineTo(C.x, C.y);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Đoạn vuông góc chung AH (nổi bật màu vàng hoàng kim)
      ctx.beginPath();
      ctx.moveTo(A.x, A.y);
      ctx.lineTo(H.x, H.y);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Góc vuông tại A giữa AH và SA
      ctx.beginPath();
      ctx.moveTo(A.x, A.y - 14);
      ctx.lineTo(A.x + 10, A.y - 12);
      ctx.lineTo(A.x + 10, A.y + 2);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Góc vuông tại H giữa AH và BC
      ctx.beginPath();
      ctx.arc(H.x, H.y, 4, 0, 2 * Math.PI);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();

      // Vẽ các điểm
      function drawPt(pt, label, color, offX, offY) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 5, 0, 2 * Math.PI);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.2;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 15px Inter, sans-serif';
        ctx.fillText(label, pt.x + offX, pt.y + offY);
      }

      drawPt(S, 'S', '#f43f5e', -8, -12);
      drawPt(A, 'A', '#06b6d4', -20, 4);
      drawPt(B, 'B', '#a5b4fc', -20, 16);
      drawPt(C, 'C', '#a5b4fc', 12, 10);
      drawPt(H, 'H (Đoạn vuông góc chung)', '#f59e0b', -10, 22);

      ctx.fillStyle = '#fde68a';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText('d(SA, BC) = AH', A.x + 20, A.y - 40);
    } else {
      // Chế độ 2 mặt phẳng song song (P) và (Q)
      const pY1 = 80;
      const pY2 = 220;
      const shiftX = 50 * cosA;

      // Mặt phẳng (P) phía trên
      ctx.beginPath();
      ctx.moveTo(80 + shiftX, pY1);
      ctx.lineTo(380 + shiftX, pY1);
      ctx.lineTo(460 + shiftX, pY1 + 60);
      ctx.lineTo(160 + shiftX, pY1 + 60);
      ctx.closePath();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
      ctx.fill();
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Đường thẳng a trên (P)
      ctx.beginPath();
      ctx.moveTo(120 + shiftX, pY1 + 25);
      ctx.lineTo(420 + shiftX, pY1 + 35);
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Mặt phẳng (Q) phía dưới
      ctx.beginPath();
      ctx.moveTo(80, pY2);
      ctx.lineTo(380, pY2);
      ctx.lineTo(460, pY2 + 60);
      ctx.lineTo(160, pY2 + 60);
      ctx.closePath();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.8;
      ctx.stroke();

      // Đường thẳng b trên (Q)
      ctx.beginPath();
      ctx.moveTo(180, pY2 + 50);
      ctx.lineTo(360, pY2 + 10);
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Đoạn vuông góc chung MN nối 2 mặt phẳng
      const M = { x: 270, y: pY1 + 30 };
      const N = { x: 270, y: pY2 + 30 };

      ctx.beginPath();
      ctx.moveTo(M.x, M.y);
      ctx.lineTo(N.x, N.y);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Các điểm M và N
      ctx.beginPath();
      ctx.arc(M.x, M.y, 5, 0, 2 * Math.PI);
      ctx.arc(N.x, N.y, 5, 0, 2 * Math.PI);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 15px Inter, sans-serif';
      ctx.fillText('a', 430 + shiftX, pY1 + 35);
      ctx.fillText('b', 370, pY2 + 15);
      ctx.fillText('(P)', 100 + shiftX, pY1 + 25);
      ctx.fillText('(Q)', 100, pY2 + 25);
      ctx.fillText('M', M.x + 8, M.y - 6);
      ctx.fillText('N', N.x + 8, N.y + 16);

      ctx.fillStyle = '#fde68a';
      ctx.fillText('d(a, b) = d((P), (Q)) = MN', M.x + 15, (M.y + N.y) / 2);
    }
  }

  sliderAngle.addEventListener('input', draw);
  draw();
}

// 9. QUẢN LÝ TAB & KHỞI ĐỘNG HỆ THỐNG
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sound.playClick();
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `tab-${tab.getAttribute('data-tab')}`;
      const targetContent = document.getElementById(targetId);
      if (targetContent) {
        targetContent.classList.add('active');
        renderMathInTree(targetContent);
      }
    });
  });
}

function initAvatarModal() {
  const avatarBtn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const btnClose = document.getElementById('btnCloseModal');
  const opts = document.querySelectorAll('.avatar-opt');
  const userTitleEl = document.getElementById('userTitle');
  const userNameEl = document.getElementById('userNameDisplay');
  const certStudentName = document.getElementById('certStudentName');

  if (avatarBtn && modal) {
    avatarBtn.addEventListener('click', () => {
      sound.playClick();
      modal.style.display = 'flex';
      modal.classList.add('active');
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      sound.playClick();
      modal.style.display = 'none';
      modal.classList.remove('active');
    });
  }

  opts.forEach(btn => {
    btn.addEventListener('click', () => {
      const av = btn.getAttribute('data-avatar');
      const name = btn.getAttribute('data-name');
      appState.avatar = av;
      appState.userName = name;

      if (avatarBtn) avatarBtn.textContent = av;
      if (userNameEl) userNameEl.textContent = `${name} 🌟`;
      if (certStudentName) certStudentName.textContent = name;

      sound.playCorrect();
      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
      }
    });
  });
}

function initAudioToggles() {
  const soundBtn = document.getElementById('soundToggle');
  const resetBtn = document.getElementById('resetProgress');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      sound.enabled = !sound.enabled;
      soundBtn.textContent = sound.enabled ? '🔊 Âm thanh: BẬT' : '🔈 Âm thanh: TẮT';
      sound.playClick();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới tiến trình học tập không?')) {
        sound.playClick();
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        updateHUD();
        renderQuiz();
        for (let i = 1; i <= 5; i++) {
          const b = document.getElementById(`badge-${i}`);
          if (b) {
            b.style.opacity = '0.4';
            b.style.border = 'none';
            b.style.boxShadow = 'none';
          }
        }
      }
    });
  }

  const printCertBtn = document.getElementById('btnPrintCert');
  if (printCertBtn) {
    printCertBtn.addEventListener('click', () => {
      sound.playClick();
      window.print();
    });
  }
}

// 10. ENTRY POINT KHI TẢI TRANG
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initAvatarModal();
  initAudioToggles();
  renderQuiz();
  initLab1();
  initLab2();
  updateHUD();

  // KaTeX auto render trên toàn trang
  renderMathInTree(document.body);
});
