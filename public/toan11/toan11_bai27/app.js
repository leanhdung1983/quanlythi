// ==========================================================================
// BÀI 27: THỂ TÍCH - HÌNH HỌC KHÔNG GIAN 11
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
  userTitle: 'Kiến Trúc Sư Không Gian 11',
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

// 4. DỮ LIỆU ĐẤU TRƯỜNG 10 CÂU TRẮC NGHIỆM BÀI 27
const quizData = [
  {
    id: 1,
    title: "Câu 1: Công thức thể tích khối chóp",
    pts: 20,
    question: "Cho khối chóp có diện tích đáy bằng $S$ và chiều cao bằng $h$. Thể tích $V$ của khối chóp đó bằng:",
    options: [
      { text: "$V = S \\cdot h$", correct: false },
      { text: "$V = \\frac{1}{3} \\cdot S \\cdot h$", correct: true },
      { text: "$V = \\frac{1}{2} \\cdot S \\cdot h$", correct: false },
      { text: "$V = \\frac{1}{6} \\cdot S \\cdot h$", correct: false }
    ],
    explanation: "Theo định lý SGK Toán 11 KNTT trang 61: Thể tích của một khối chóp có diện tích đáy $S$ và chiều cao $h$ là $V = \\frac{1}{3} \\cdot S \\cdot h$."
  },
  {
    id: 2,
    title: "Câu 2: Công thức thể tích khối lăng trụ",
    pts: 20,
    question: "Thể tích $V$ của một khối lăng trụ có diện tích đáy $S$ và chiều cao $h$ được tính theo công thức nào?",
    options: [
      { text: "$V = S \\cdot h$", correct: true },
      { text: "$V = \\frac{1}{3} \\cdot S \\cdot h$", correct: false },
      { text: "$V = \\frac{2}{3} \\cdot S \\cdot h$", correct: false },
      { text: "$V = 3 \\cdot S \\cdot h$", correct: false }
    ],
    explanation: "Theo định lý SGK trang 61: Thể tích của khối lăng trụ có diện tích đáy $S$ và chiều cao $h$ là $V = S \\cdot h$."
  },
  {
    id: 3,
    title: "Câu 3: Công thức thể tích khối chóp cụt đều",
    pts: 20,
    question: "Cho khối chóp cụt đều có diện tích đáy lớn là $S$, diện tích đáy bé là $S'$ và chiều cao là $h$. Thể tích của khối chóp cụt đều đó bằng:",
    options: [
      { text: "$V = \\frac{1}{3}(S + S') \\cdot h$", correct: false },
      { text: "$V = \\frac{1}{3}(S + S' + \\sqrt{S \\cdot S'}) \\cdot h$", correct: true },
      { text: "$V = (S + S' + \\sqrt{S \\cdot S'}) \\cdot h$", correct: false },
      { text: "$V = \\frac{1}{2}(S + S') \\cdot h$", correct: false }
    ],
    explanation: "Theo SGK trang 61: Thể tích khối chóp cụt đều có diện tích hai đáy $S, S'$ và chiều cao $h$ là $V = \\frac{1}{3}(S + S' + \\sqrt{S \\cdot S'}) \\cdot h$."
  },
  {
    id: 4,
    title: "Câu 4: Tứ diện ba góc vuông ở đỉnh",
    pts: 20,
    question: "Cho tứ diện $OABC$ có các cạnh $OA, OB, OC$ đôi một vuông góc với nhau và $OA = a, OB = b, OC = c$. Thể tích của khối tứ diện $OABC$ bằng:",
    options: [
      { text: "$abc$", correct: false },
      { text: "$\\frac{1}{3}abc$", correct: false },
      { text: "$\\frac{1}{6}abc$", correct: true },
      { text: "$\\frac{1}{2}abc$", correct: false }
    ],
    explanation: "Tam giác vuông $OBC$ có diện tích $S = \\frac{1}{2}bc$. Chiều cao $OA = a \\perp (OBC)$. Do đó $V = \\frac{1}{3} \\cdot S \\cdot OA = \\frac{1}{3} \\cdot \\left(\\frac{1}{2}bc\\right) \\cdot a = \\frac{1}{6}abc$."
  },
  {
    id: 5,
    title: "Câu 5: (SGK 7.28) Thể tích tứ diện đều",
    pts: 20,
    question: "Cho tứ diện đều $ABCD$ có tất cả các cạnh đều bằng $a$. Thể tích của khối tứ diện đều đó bằng:",
    options: [
      { text: "$\\frac{a^3\\sqrt{2}}{12}$", correct: true },
      { text: "$\\frac{a^3\\sqrt{3}}{12}$", correct: false },
      { text: "$\\frac{a^3\\sqrt{2}}{4}$", correct: false },
      { text: "$\\frac{a^3\\sqrt{6}}{12}$", correct: false }
    ],
    explanation: "Đáy là tam giác đều cạnh $a$ có diện tích $S = \\frac{a^2\\sqrt{3}}{4}$. Chiều cao $h = \\frac{a\\sqrt{6}}{3}$. Thể tích là $V = \\frac{1}{3} \\cdot S \\cdot h = \\frac{1}{3} \\cdot \\frac{a^2\\sqrt{3}}{4} \\cdot \\frac{a\\sqrt{6}}{3} = \\frac{a^3\\sqrt{18}}{36} = \\frac{a^3\\sqrt{2}}{12}$."
  },
  {
    id: 6,
    title: "Câu 6: (SGK 7.29) Thể tích khối lăng trụ đứng",
    pts: 20,
    question: "Cho khối lăng trụ đứng $ABC.A'B'C'$ có cạnh bên $AA' = 5\\text{ cm}$, đáy là tam giác $ABC$ có $AB = 6\\text{ cm}$, $BC = 2\\text{ cm}$ và góc $\\widehat{ABC} = 150^\\circ$. Thể tích của khối lăng trụ bằng:",
    options: [
      { text: "$30\\text{ cm}^3$", correct: false },
      { text: "$15\\text{ cm}^3$", correct: true },
      { text: "$15\\sqrt{3}\\text{ cm}^3$", correct: false },
      { text: "$60\\text{ cm}^3$", correct: false }
    ],
    explanation: "Diện tích đáy $S = \\frac{1}{2} \\cdot AB \\cdot BC \\cdot \\sin 150^\\circ = \\frac{1}{2} \\cdot 6 \\cdot 2 \\cdot 0,5 = 3\\text{ cm}^2$. Thể tích khối lăng trụ đứng là $V = S \\cdot h = 3 \\cdot 5 = 15\\text{ cm}^3$."
  },
  {
    id: 7,
    title: "Câu 7: (SGK 7.30a) Khối chóp đều có góc cạnh bên",
    pts: 20,
    question: "Cho khối chóp đều $S.ABCD$ có đáy là hình vuông cạnh $6\\text{ cm}$. Biết cạnh bên của hình chóp tạo với mặt phẳng đáy một góc bằng $60^\\circ$. Thể tích của khối chóp $S.ABCD$ bằng:",
    options: [
      { text: "$36\\sqrt{6}\\text{ cm}^3$", correct: true },
      { text: "$72\\sqrt{3}\\text{ cm}^3$", correct: false },
      { text: "$108\\sqrt{2}\\text{ cm}^3$", correct: false },
      { text: "$36\\sqrt{3}\\text{ cm}^3$", correct: false }
    ],
    explanation: "Đáy hình vuông cạnh $6\\text{ cm}$ có $S = 36\\text{ cm}^2$, bán kính ngoại tiếp $OA = \\frac{6\\sqrt{2}}{2} = 3\\sqrt{2}\\text{ cm}$. Chiều cao $SO = OA \\cdot \\tan 60^\\circ = 3\\sqrt{2} \\cdot \\sqrt{3} = 3\\sqrt{6}\\text{ cm}$. Vậy $V = \\frac{1}{3} \\cdot S \\cdot SO = \\frac{1}{3} \\cdot 36 \\cdot 3\\sqrt{6} = 36\\sqrt{6}\\text{ cm}^3$."
  },
  {
    id: 8,
    title: "Câu 8: (SGK 7.30b) Khối chóp đều có góc mặt bên",
    pts: 20,
    question: "Cho khối chóp đều $S.ABCD$ có cạnh đáy bằng $6\\text{ cm}$. Biết mặt bên tạo với mặt phẳng đáy một góc bằng $45^\\circ$. Thể tích của khối chóp $S.ABCD$ bằng:",
    options: [
      { text: "$18\\text{ cm}^3$", correct: false },
      { text: "$36\\text{ cm}^3$", correct: true },
      { text: "$54\\text{ cm}^3$", correct: false },
      { text: "$72\\text{ cm}^3$", correct: false }
    ],
    explanation: "Gọi $I$ là trung điểm cạnh đáy, khoảng cách $OI = \\frac{6}{2} = 3\\text{ cm}$. Góc giữa mặt bên và đáy là $\\widehat{SIO} = 45^\\circ$. Chiều cao $SO = OI \\cdot \\tan 45^\\circ = 3 \\cdot 1 = 3\\text{ cm}$. Thể tích là $V = \\frac{1}{3} \\cdot S \\cdot SO = \\frac{1}{3} \\cdot 36 \\cdot 3 = 36\\text{ cm}^3$."
  },
  {
    id: 9,
    title: "Câu 9: (SGK 7.31) Lăng trụ có đỉnh cách đều ba đỉnh đáy",
    pts: 20,
    question: "Cho khối lăng trụ $ABC.A'B'C'$ có đáy là tam giác đều cạnh $a$. Đỉnh $A'$ cách đều ba đỉnh $A, B, C$ và $A'A = A'B = A'C = b$. Thể tích của khối lăng trụ bằng:",
    options: [
      { text: "$\\frac{a^2\\sqrt{3b^2 - a^2}}{4}$", correct: true },
      { text: "$\\frac{a^2\\sqrt{4b^2 - a^2}}{4}$", correct: false },
      { text: "$\\frac{a^2\\sqrt{3}}{12}b$", correct: false },
      { text: "$\\frac{a^2\\sqrt{b^2 - a^2}}{3}$", correct: false }
    ],
    explanation: "Hình chiếu của $A'$ trên đáy $(ABC)$ là trọng tâm $G$ của tam giác đều $ABC$. Bán kính $AG = \\frac{a\\sqrt{3}}{3}$. Chiều cao $h = A'G = \\sqrt{b^2 - AG^2} = \\sqrt{b^2 - \\frac{a^2}{3}} = \\frac{\\sqrt{3b^2 - a^2}}{\\sqrt{3}}$. Thể tích $V = S_{ABC} \\cdot h = \\frac{a^2\\sqrt{3}}{4} \\cdot \\frac{\\sqrt{3b^2 - a^2}}{\\sqrt{3}} = \\frac{a^2\\sqrt{3b^2 - a^2}}{4}$."
  },
  {
    id: 10,
    title: "Câu 10: (SGK Vận dụng tr. 63) Dung tích sọt tre hình chóp cụt đều",
    pts: 20,
    question: "Một chiếc sọt có dạng hình chóp cụt đều, hai đáy là hình vuông cạnh lần lượt là $60\\text{ cm}$ và $30\\text{ cm}$. Chiều cao của sọt đo được là $45\\text{ cm}$. Dung tích của sọt tre xấp xỉ bằng:",
    options: [
      { text: "$94,5\\text{ lít}$", correct: true },
      { text: "$81,0\\text{ lít}$", correct: false },
      { text: "$120,5\\text{ lít}$", correct: false },
      { text: "$63,0\\text{ lít}$", correct: false }
    ],
    explanation: "Diện tích đáy lớn $S = 60^2 = 3600\\text{ cm}^2$, diện tích đáy bé $S' = 30^2 = 900\\text{ cm}^2$, trung bình nhân $\\sqrt{SS'} = 1800\\text{ cm}^2$. Thể tích $V = \\frac{1}{3} \\cdot (3600 + 900 + 1800) \\cdot 45 = 15 \\cdot 6300 = 94500\\text{ cm}^3 = 94,5\\text{ dm}^3 = 94,5\\text{ lít}$."
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

// 7. PHÒNG THÍ NGHIỆM LAB 1: SO SÁNH THỂ TÍCH CHÓP VÀ LĂNG TRỤ
function initLab1() {
  const canvas = document.getElementById('canvasLab1');
  const sliderA = document.getElementById('sliderA');
  const sliderH = document.getElementById('sliderH');
  const valA = document.getElementById('valA');
  const valH = document.getElementById('valH');
  const outLab1 = document.getElementById('outLab1');

  if (!canvas || !sliderA || !sliderH) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const a = parseFloat(sliderA.value);
    const h = parseFloat(sliderH.value);
    valA.textContent = a;
    valH.textContent = h;

    const S = a * a;
    const vPrism = S * h;
    const vPyramid = vPrism / 3;

    if (outLab1) {
      outLab1.innerHTML = `Đáy $S = ${S}\\text{ m}^2$ | $V_{\\text{lăng trụ}} = ${vPrism}\\text{ m}^3$ | $V_{\\text{chóp}} = ${vPyramid.toFixed(1)}\\text{ m}^3 = \\frac{1}{3} V_{\\text{lăng trụ}}$`;
      renderMathInTree(outLab1);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ khối lăng trụ hộp đáy hình bình hành và khối chóp lồng bên trong
    const scale = 14;
    const boxW = a * scale;
    const boxD = a * scale * 0.5;
    const boxH = h * scale * 1.2;

    const originX = 170;
    const originY = 270;

    // Đáy dưới: A, B, C, D
    const A = { x: originX, y: originY };
    const B = { x: originX + boxW, y: originY };
    const C = { x: originX + boxW + boxD, y: originY - boxD * 0.5 };
    const D = { x: originX + boxD, y: originY - boxD * 0.5 };

    // Đáy trên: A', B', C', D'
    const A1 = { x: A.x, y: A.y - boxH };
    const B1 = { x: B.x, y: B.y - boxH };
    const C1 = { x: C.x, y: C.y - boxH };
    const D1 = { x: D.x, y: D.y - boxH };

    // Đỉnh S của khối chóp: tâm của đáy trên
    const S_pt = { x: (A1.x + C1.x) / 2, y: (A1.y + C1.y) / 2 };

    // Vẽ khung lăng trụ trong suốt (màu cyan neon)
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1.5;

    // Các cạnh bên lăng trụ
    [ [A, A1], [B, B1], [C, C1] ].forEach(([p1, p2]) => {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Cạnh khuất D-D1 nét đứt
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(D.x, D.y);
    ctx.lineTo(D1.x, D1.y);
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(D.x, D.y);
    ctx.lineTo(C.x, C.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Đáy dưới thấy: A-B-C
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.stroke();

    // Đáy trên thấy toàn bộ A1-B1-C1-D1-A1
    ctx.beginPath();
    ctx.moveTo(A1.x, A1.y);
    ctx.lineTo(B1.x, B1.y);
    ctx.lineTo(C1.x, C1.y);
    ctx.lineTo(D1.x, D1.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
    ctx.fill();
    ctx.stroke();

    // Vẽ khối chóp S.ABCD lồng bên trong (màu vàng hoàng kim rực rỡ)
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.beginPath();
    ctx.moveTo(S_pt.x, S_pt.y);
    ctx.lineTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.closePath();
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(S_pt.x, S_pt.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.fill();

    // Cạnh bên khối chóp
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.2;
    [ [S_pt, A], [S_pt, B], [S_pt, C] ].forEach(([p1, p2]) => {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Cạnh bên khuất S-D nét đứt
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(S_pt.x, S_pt.y);
    ctx.lineTo(D.x, D.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Đỉnh S
    ctx.beginPath();
    ctx.arc(S_pt.x, S_pt.y, 6, 0, 2 * Math.PI);
    ctx.fillStyle = '#f43f5e';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Nhãn
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillText('Đỉnh S', S_pt.x - 24, S_pt.y - 12);

    ctx.fillStyle = '#67e8f9';
    ctx.font = '13px Inter, sans-serif';
    ctx.fillText(`h = ${h} m`, A.x - 65, (A.y + A1.y) / 2);
    ctx.fillText(`Cạnh đáy = ${a} m`, (A.x + B.x) / 2 - 30, A.y + 20);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(`V(Chóp) = 1/3 V(Lăng trụ)`, S_pt.x + 25, S_pt.y + 30);
  }

  sliderA.addEventListener('input', draw);
  sliderH.addEventListener('input', draw);
  draw();
}

// 8. PHÒNG THÍ NGHIỆM LAB 2: MÔ PHỎNG KHỐI CHÓP CỤT ĐỀU & THÙNG CHỨA
function initLab2() {
  const canvas = document.getElementById('canvasLab2');
  const sliderBigA = document.getElementById('sliderBigA');
  const sliderSmallB = document.getElementById('sliderSmallB');
  const sliderHeight = document.getElementById('sliderHeight');
  const valBigA = document.getElementById('valBigA');
  const valSmallB = document.getElementById('valSmallB');
  const valHeight = document.getElementById('valHeight');
  const outLab2 = document.getElementById('outLab2');

  if (!canvas || !sliderBigA || !sliderSmallB || !sliderHeight) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const a = parseFloat(sliderBigA.value); // đáy lớn (cm)
    const b = parseFloat(sliderSmallB.value); // đáy bé (cm)
    const h = parseFloat(sliderHeight.value); // chiều cao (cm)

    valBigA.textContent = a;
    valSmallB.textContent = b;
    valHeight.textContent = h;

    const S = a * a;
    const S1 = b * b;
    const midTerm = Math.sqrt(S * S1);
    const volCm3 = (1 / 3) * (S + S1 + midTerm) * h;
    const volLiters = volCm3 / 1000;

    if (outLab2) {
      outLab2.innerHTML = `Thể tích: $V = \\frac{1}{3}(${S} + ${S1} + ${midTerm}) \\cdot ${h} = ${volCm3.toFixed(0)}\\text{ cm}^3$ (Tương đương $${volLiters.toFixed(1)}\\text{ lít}$ nước)`;
      renderMathInTree(outLab2);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ hình chóp cụt đều 3D
    const scale = 2.2;
    const w1 = a * scale;
    const d1 = a * scale * 0.45;
    const w2 = b * scale;
    const d2 = b * scale * 0.45;
    const H_px = h * scale * 1.3;

    const centerX = 270;
    const bottomY = 280;
    const topY = bottomY - H_px;

    // Đáy lớn phía dưới: A, B, C, D
    const A = { x: centerX - w1 / 2, y: bottomY };
    const B = { x: centerX + w1 / 2, y: bottomY };
    const C = { x: centerX + w1 / 2 + d1, y: bottomY - d1 * 0.6 };
    const D = { x: centerX - w1 / 2 + d1, y: bottomY - d1 * 0.6 };

    // Đáy bé phía trên: A', B', C', D'
    const A1 = { x: centerX - w2 / 2, y: topY };
    const B1 = { x: centerX + w2 / 2, y: topY };
    const C1 = { x: centerX + w2 / 2 + d2, y: topY - d2 * 0.6 };
    const D1 = { x: centerX - w2 / 2 + d2, y: topY - d2 * 0.6 };

    // Mặt bên và đáy màu kính mờ
    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';

    // Mặt trước: A-B-B1-A1
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(B1.x, B1.y);
    ctx.lineTo(A1.x, A1.y);
    ctx.closePath();
    ctx.fill();

    // Mặt phải: B-C-C1-B1
    ctx.beginPath();
    ctx.moveTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.lineTo(C1.x, C1.y);
    ctx.lineTo(B1.x, B1.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.fill();

    // Nét thấy cạnh ngoài
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;

    ctx.beginPath();
    // Đáy trên
    ctx.moveTo(A1.x, A1.y);
    ctx.lineTo(B1.x, B1.y);
    ctx.lineTo(C1.x, C1.y);
    ctx.lineTo(D1.x, D1.y);
    ctx.closePath();
    ctx.stroke();

    // Cạnh bên thấy
    [ [A, A1], [B, B1], [C, C1] ].forEach(([p1, p2]) => {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Đáy dưới thấy
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.stroke();

    // Cạnh khuất D-D1, A-D, C-D
    ctx.strokeStyle = 'rgba(165, 180, 252, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(D.x, D.y);
    ctx.lineTo(D1.x, D1.y);
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(D.x, D.y);
    ctx.lineTo(C.x, C.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Chiều cao HH' ở trục giữa
    const centerBottom = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };
    const centerTop = { x: (A1.x + C1.x) / 2, y: (A1.y + C1.y) / 2 };

    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerTop.x, centerTop.y);
    ctx.lineTo(centerBottom.x, centerBottom.y);
    ctx.stroke();

    // Điểm tâm H và H'
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(centerTop.x, centerTop.y, 4, 0, 2 * Math.PI);
    ctx.arc(centerBottom.x, centerBottom.y, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Chú thích
    ctx.fillStyle = '#fda4af';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(`h = ${h} cm`, centerTop.x + 8, (centerTop.y + centerBottom.y) / 2);

    ctx.fillStyle = '#a5b4fc';
    ctx.fillText(`Đáy trên b = ${b} cm`, A1.x, topY - 10);
    ctx.fillText(`Đáy dưới a = ${a} cm`, A.x, bottomY + 20);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(`Dung tích ≈ ${volLiters.toFixed(1)} Lít`, B.x + 10, bottomY - 30);
  }

  sliderBigA.addEventListener('input', draw);
  sliderSmallB.addEventListener('input', draw);
  sliderHeight.addEventListener('input', draw);
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
