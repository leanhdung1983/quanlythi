// ==========================================================================
// BÀI TẬP CUỐI CHƯƠNG VII: QUAN HỆ VUÔNG GÓC TRONG KHÔNG GIAN
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
  userTitle: 'Đại Kiện Tướng Không Gian 11',
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
  clean = clean.replace(/\\varphi/g, '<mi>&#966;</mi>');
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

// 4. DỮ LIỆU ĐẤU TRƯỜNG 10 CÂU TRẮC NGHIỆM TỔNG HỢP CHƯƠNG VII
const quizData = [
  {
    id: 1,
    title: "Câu 1: (SGK 7.33) Các phát biểu về hai mặt phẳng vuông góc",
    pts: 20,
    question: "Cho các phát biểu sau:<br>(1) Hai mặt phẳng $(P)$ và $(Q)$ có giao tuyến là đường thẳng $a$ và cùng vuông góc với mặt phẳng $(R)$ thì $a \\perp (R)$.<br>(2) Hai mặt phẳng $(P)$ và $(Q)$ vuông góc với nhau và có giao tuyến là $a$, một đường thẳng $b \\subset (P)$ và $b \\perp a$ thì $b \\perp (Q)$.<br>(3) Mặt phẳng $(P)$ chứa đường thẳng $a$ và $a \\perp (Q)$ thì $(P) \\perp (Q)$.<br>(4) Đường thẳng $a$ nằm trong mặt phẳng $(P)$ và $(P) \\perp (Q)$ thì $a \\perp (Q)$.<br>Số phát biểu ĐÚNG trong các phát biểu trên là:",
    options: [
      { text: "1", correct: false },
      { text: "2", correct: false },
      { text: "3", correct: true },
      { text: "4", correct: false }
    ],
    explanation: "Các phát biểu (1), (2), (3) đều là các định lý chuẩn trong SGK. Phát biểu (4) sai vì đường thẳng $a \\subset (P)$ chỉ vuông góc với $(Q)$ khi nó vuông góc với giao tuyến của $(P)$ và $(Q)$. Do đó có đúng 3 phát biểu đúng."
  },
  {
    id: 2,
    title: "Câu 2: (SGK 7.34) Tính chất hai mặt phẳng vuông góc",
    pts: 20,
    question: "Cho mặt phẳng $(P)$ vuông góc với mặt phẳng $(Q)$ và $a$ là giao tuyến của $(P)$ và $(Q)$. Phát biểu nào sau đây là ĐÚNG?",
    options: [
      { text: "Đường thẳng $d$ nằm trên $(Q)$ thì $d$ vuông góc với $(P)$", correct: false },
      { text: "Đường thẳng $d$ nằm trên $(Q)$ và $d$ vuông góc với $a$ thì $d$ vuông góc với $(P)$", correct: true },
      { text: "Đường thẳng $d$ vuông góc với $a$ thì $d$ vuông góc với $(P)$", correct: false },
      { text: "Đường thẳng $d$ vuông góc với $(Q)$ thì $d$ vuông góc với $(P)$", correct: false }
    ],
    explanation: "Theo định lý SGK: Nếu hai mặt phẳng vuông góc với nhau thì bất kì đường thẳng nào nằm trong mặt phẳng này và vuông góc với giao tuyến thì vuông góc với mặt phẳng kia."
  },
  {
    id: 3,
    title: "Câu 3: (SGK 7.35) Góc nhị diện trong hình chóp tứ giác đều",
    pts: 20,
    question: "Cho hình chóp tứ giác đều $S.ABCD$. Khẳng định nào sau đây là ĐÚNG?",
    options: [
      { text: "Số đo của góc nhị diện $[S, AB, C]$ bằng $\\widehat{SBC}$", correct: false },
      { text: "Số đo của góc nhị diện $[D, SA, B]$ bằng $90^\\circ$", correct: false },
      { text: "Số đo của góc nhị diện $[S, AC, B]$ bằng $90^\\circ$", correct: true },
      { text: "Số đo của góc nhị diện $[D, SA, B]$ bằng $\\widehat{BSD}$", correct: false }
    ],
    explanation: "Gọi $O$ là tâm đáy hình vuông $ABCD$. Ta có $SO \\perp (ABCD) \\implies SO \\perp AC$. Lại có $BD \\perp AC$ tại $O$. Suy ra $AC \\perp (SBD)$, do đó mặt phẳng $(SAC) \\perp (SBD)$. Vì vậy góc nhị diện $[S, AC, B]$ có số đo bằng $\\widehat{SOB} = 90^\\circ$."
  },
  {
    id: 4,
    title: "Câu 4: (SGK 7.36) Quan hệ vuông góc trong hình chóp $SA \\perp đáy$",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông và $SA \\perp (ABCD)$. Phát biểu nào sau đây là SAI?",
    options: [
      { text: "Đường thẳng $BC$ vuông góc với mặt phẳng $(SAB)$", correct: false },
      { text: "Đường thẳng $BD$ vuông góc với mặt phẳng $(SAC)$", correct: false },
      { text: "Đường thẳng $AC$ vuông góc với mặt phẳng $(SBD)$", correct: true },
      { text: "Đường thẳng $AD$ vuông góc với mặt phẳng $(SAB)$", correct: false }
    ],
    explanation: "$AC$ vuông góc với $BD$, nhưng $AC$ không vuông góc với $SO$ hay $SA$. Do đó $AC$ không vuông góc với mặt phẳng $(SBD)$. Các khẳng định còn lại đều đúng."
  },
  {
    id: 5,
    title: "Câu 5: (SGK 7.37) Thể tích của khối chóp",
    pts: 20,
    question: "Thể tích của khối chóp có diện tích đáy bằng $S$, chiều cao bằng $h$ là:",
    options: [
      { text: "$V = S \\cdot h$", correct: false },
      { text: "$V = \\frac{1}{2} \\cdot S \\cdot h$", correct: false },
      { text: "$V = \\frac{1}{3} \\cdot S \\cdot h$", correct: true },
      { text: "$V = \\frac{2}{3} \\cdot S \\cdot h$", correct: false }
    ],
    explanation: "Theo định lý SGK, thể tích của một khối chóp có diện tích đáy $S$ và chiều cao $h$ là $V = \\frac{1}{3} \\cdot S \\cdot h$."
  },
  {
    id: 6,
    title: "Câu 6: (SGK 7.38) Khoảng cách trong tứ diện ba góc vuông",
    pts: 20,
    question: "Cho tứ diện $OABC$ có các cạnh $OA, OB, OC$ đôi một vuông góc với nhau và $OA = a, OB = a\\sqrt{2}, OC = 2a$. Khoảng cách từ điểm $O$ đến mặt phẳng $(ABC)$ bằng:",
    options: [
      { text: "$\\frac{2a\\sqrt{7}}{7}$", correct: true },
      { text: "$\\frac{a\\sqrt{7}}{7}$", correct: false },
      { text: "$\\frac{a\\sqrt{14}}{7}$", correct: false },
      { text: "$\\frac{2a}{3}$", correct: false }
    ],
    explanation: "Áp dụng hệ thức lượng cho tứ diện vuông tại $O$: $\\frac{1}{d^2} = \\frac{1}{OA^2} + \\frac{1}{OB^2} + \\frac{1}{OC^2} = \\frac{1}{a^2} + \\frac{1}{2a^2} + \\frac{1}{4a^2} = \\frac{7}{4a^2} \\implies d = \\frac{2a}{\\sqrt{7}} = \\frac{2a\\sqrt{7}}{7}$."
  },
  {
    id: 7,
    title: "Câu 7: (SGK 7.40) Khoảng cách từ điểm đến mặt phẳng",
    pts: 20,
    question: "Cho hình chóp $S.ABC$ có đáy $ABC$ vuông tại $B$, $BC = a, \\widehat{CAB} = 30^\\circ$. Biết $SA \\perp (ABC)$ và $SA = a\\sqrt{2}$. Khoảng cách từ điểm $A$ đến mặt phẳng $(SBC)$ bằng:",
    options: [
      { text: "$\\frac{a\\sqrt{30}}{5}$", correct: true },
      { text: "$\\frac{a\\sqrt{6}}{5}$", correct: false },
      { text: "$\\frac{a\\sqrt{15}}{5}$", correct: false },
      { text: "$a\\sqrt{2}$", correct: false }
    ],
    explanation: "Vì $BC \\perp AB$ và $BC \\perp SA \\implies BC \\perp (SAB) \\implies (SBC) \\perp (SAB)$ theo giao tuyến $SB$. Kẻ $AH \\perp SB \\implies AH \\perp (SBC) \\implies d(A, (SBC)) = AH$. Trong tam giác vuông $ABC$: $AB = \\frac{BC}{\\tan 30^\\circ} = a\\sqrt{3}$. Trong tam giác vuông $SAB$: $AH = \\frac{SA \\cdot AB}{\\sqrt{SA^2 + AB^2}} = \\frac{a\\sqrt{2} \\cdot a\\sqrt{3}}{\\sqrt{2a^2 + 3a^2}} = \\frac{a\\sqrt{6}}{\\sqrt{5}} = \\frac{a\\sqrt{30}}{5}$."
  },
  {
    id: 8,
    title: "Câu 8: (SGK 7.41) Thể tích hình chóp có mặt bên vuông góc đáy",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$. Biết tam giác $SAD$ vuông cân tại $S$ và $(SAD) \\perp (ABCD)$. Thể tích khối chóp $S.ABCD$ bằng:",
    options: [
      { text: "$\\frac{a^3}{6}$", correct: true },
      { text: "$\\frac{a^3}{3}$", correct: false },
      { text: "$\\frac{a^3\\sqrt{2}}{6}$", correct: false },
      { text: "$\\frac{a^3}{12}$", correct: false }
    ],
    explanation: "Tam giác $SAD$ vuông cân tại $S$ có cạnh huyền $AD = a$ nên đường cao $h = SH = \\frac{AD}{2} = \\frac{a}{2}$. Do $(SAD) \\perp (ABCD)$ theo giao tuyến $AD$ nên $SH \\perp (ABCD)$. Thể tích khối chóp là $V = \\frac{1}{3} \\cdot S_{ABCD} \\cdot h = \\frac{1}{3} \\cdot a^2 \\cdot \\frac{a}{2} = \\frac{a^3}{6}$."
  },
  {
    id: 9,
    title: "Câu 9: (SGK 7.42) Thể tích khối hộp xiên",
    pts: 20,
    question: "Cho hình hộp $ABCD.A'B'C'D'$ có độ dài tất cả các cạnh bằng $a$, $AA' \\perp (ABCD)$ và góc $\\widehat{BAD} = 60^\\circ$. Thể tích của khối hộp bằng:",
    options: [
      { text: "$\\frac{a^3\\sqrt{3}}{2}$", correct: true },
      { text: "$\\frac{a^3\\sqrt{3}}{6}$", correct: false },
      { text: "$a^3\\sqrt{3}$", correct: false },
      { text: "$\\frac{a^3}{2}$", correct: false }
    ],
    explanation: "Đáy $ABCD$ là hình thoi có cạnh $a$ và góc $\\widehat{BAD} = 60^\\circ \\implies S_{ABCD} = a^2 \\sin 60^\\circ = \\frac{a^2\\sqrt{3}}{2}$. Chiều cao $h = AA' = a$. Thể tích khối hộp là $V = S \\cdot h = \\frac{a^2\\sqrt{3}}{2} \\cdot a = \\frac{a^3\\sqrt{3}}{2}$."
  },
  {
    id: 10,
    title: "Câu 10: (SGK 7.43) Thể tích lăng trụ đáy hình vuông",
    pts: 20,
    question: "Cho hình lăng trụ $ABCD.A'B'C'D'$. Biết $A'.ABCD$ là hình chóp đều có tất cả các cạnh đều bằng $a$. Thể tích của khối lăng trụ $ABCD.A'B'C'D'$ bằng:",
    options: [
      { text: "$\\frac{a^3\\sqrt{2}}{2}$", correct: true },
      { text: "$\\frac{a^3\\sqrt{2}}{6}$", correct: false },
      { text: "$\\frac{a^3\\sqrt{3}}{3}$", correct: false },
      { text: "$a^3\\sqrt{2}$", correct: false }
    ],
    explanation: "Đáy $ABCD$ là hình vuông cạnh $a$ có diện tích $S = a^2$. Tâm đáy $O$ có $OA = \\frac{a\\sqrt{2}}{2}$. Vì $A'.ABCD$ là hình chóp đều nên chiều cao lăng trụ là $h = A'O = \\sqrt{A'A^2 - OA^2} = \\sqrt{a^2 - \\frac{a^2}{2}} = \\frac{a\\sqrt{2}}{2}$. Thể tích khối lăng trụ là $V = S \\cdot h = a^2 \\cdot \\frac{a\\sqrt{2}}{2} = \\frac{a^3\\sqrt{2}}{2}$."
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

// 7. PHÒNG THÍ NGHIỆM LAB 1: SA BÀN 3D QUAN HỆ VUÔNG GÓC
function initLab1() {
  const canvas = document.getElementById('canvasLab1');
  const sliderAngle = document.getElementById('sliderAngleLab1');
  const sliderHeight = document.getElementById('sliderHeightLab1');
  const valAngle = document.getElementById('valAngleLab1');
  const valHeight = document.getElementById('valHeightLab1');
  const outLab1 = document.getElementById('outLab1');

  if (!canvas || !sliderAngle || !sliderHeight) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const angle = parseFloat(sliderAngle.value);
    const h = parseFloat(sliderHeight.value);
    valAngle.textContent = angle;
    valHeight.textContent = h;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rad = (angle * Math.PI) / 180;
    const cosA = Math.cos(rad);
    const sinA = Math.sin(rad);

    // Hình chóp S.ABC với SA vuông góc (ABC) và đáy ABC vuông tại B
    const originX = 260;
    const originY = 240;

    const A = { x: originX, y: originY };
    const S = { x: A.x, y: A.y - h };

    // Điểm B và C xoay 3D
    const B = { x: A.x - 120 * cosA - 30 * sinA, y: A.y + 40 + 20 * sinA };
    const C = { x: B.x + 130 * cosA - 50 * sinA, y: B.y + 35 - 10 * sinA };

    // Mặt đáy ABC
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
    ctx.fill();

    // Cạnh đáy AB, BC, AC
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Mặt bên SAB
    ctx.beginPath();
    ctx.moveTo(S.x, S.y);
    ctx.lineTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
    ctx.fill();

    // Mặt bên SBC
    ctx.beginPath();
    ctx.moveTo(S.x, S.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.fill();

    // Cạnh SA (đường cao)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(S.x, S.y);
    ctx.lineTo(A.x, A.y);
    ctx.stroke();

    // Các cạnh bên SB, SC
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(S.x, S.y);
    ctx.lineTo(B.x, B.y);
    ctx.moveTo(S.x, S.y);
    ctx.lineTo(C.x, C.y);
    ctx.stroke();

    // Góc vuông tại A: SA vuông góc AB
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y - 12);
    ctx.lineTo(A.x - 10 * cosA, A.y - 12 + 4 * sinA);
    ctx.lineTo(A.x - 10 * cosA, A.y + 4 * sinA);
    ctx.stroke();

    // Góc vuông tại B trong tam giác ABC
    ctx.strokeStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(B.x, B.y, 4, 0, 2 * Math.PI);
    ctx.fillStyle = '#06b6d4';
    ctx.fill();

    // Vẽ các đỉnh
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
    drawPt(B, 'B', '#a5b4fc', -18, 16);
    drawPt(C, 'C', '#f59e0b', 12, 10);

    ctx.fillStyle = '#fde68a';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText('(SAB) ⊥ (SBC)', (S.x + B.x) / 2 - 40, (S.y + B.y) / 2);
  }

  sliderAngle.addEventListener('input', draw);
  sliderHeight.addEventListener('input', draw);
  draw();
}

// 8. PHÒNG THÍ NGHIỆM LAB 2: MÁY TRẮC ĐỊA & BIẾN THIÊN THỂ TÍCH
function initLab2() {
  const canvas = document.getElementById('canvasLab2');
  const sliderBase = document.getElementById('sliderBaseLab2');
  const sliderHeight = document.getElementById('sliderHeightLab2');
  const valBase = document.getElementById('valBaseLab2');
  const valHeight = document.getElementById('valHeightLab2');
  const outLab2 = document.getElementById('outLab2');

  if (!canvas || !sliderBase || !sliderHeight) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const a = parseFloat(sliderBase.value);
    const h = parseFloat(sliderHeight.value);
    valBase.textContent = a;
    valHeight.textContent = h;

    const S = a * a;
    const vol = (1 / 3) * S * h;

    if (outLab2) {
      outLab2.innerHTML = `Diện tích đáy: $S = ${S}\\text{ m}^2$ | Chiều cao: $h = ${h}\\text{ m}$ | Thể tích chóp: $V = ${vol.toFixed(1)}\\text{ m}^3$`;
      renderMathInTree(outLab2);
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Vẽ hình chóp tứ giác đều S.ABCD
    const scale = 14;
    const w = a * scale;
    const d = a * scale * 0.45;
    const H_px = h * scale * 1.1;

    const centerX = 270;
    const bottomY = 270;
    const S_top = { x: centerX, y: bottomY - H_px };

    // Đáy ABCD
    const A = { x: centerX - w / 2, y: bottomY };
    const B = { x: centerX + w / 2, y: bottomY };
    const C = { x: centerX + w / 2 + d, y: bottomY - d * 0.6 };
    const D = { x: centerX - w / 2 + d, y: bottomY - d * 0.6 };
    const O = { x: centerX + d / 2, y: bottomY - d * 0.3 };

    // Mặt bên SAB
    ctx.beginPath();
    ctx.moveTo(S_top.x, S_top.y);
    ctx.lineTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.2)';
    ctx.fill();

    // Mặt bên SBC
    ctx.beginPath();
    ctx.moveTo(S_top.x, S_top.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
    ctx.fill();

    // Các cạnh thấy
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.2;
    [ [S_top, A], [S_top, B], [S_top, C], [A, B], [B, C] ].forEach(([p1, p2]) => {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Các cạnh khuất nét đứt: S-D, A-D, C-D, A-C, B-D
    ctx.strokeStyle = 'rgba(165, 180, 252, 0.4)';
    ctx.setLineDash([4, 4]);
    [ [S_top, D], [A, D], [C, D], [A, C], [B, D] ].forEach(([p1, p2]) => {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Đường cao SO thẳng đứng nét đứt màu đỏ
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(S_top.x, S_top.y);
    ctx.lineTo(O.x, O.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Đỉnh S và tâm O
    ctx.fillStyle = '#f43f5e';
    ctx.beginPath();
    ctx.arc(S_top.x, S_top.y, 5, 0, 2 * Math.PI);
    ctx.arc(O.x, O.y, 4, 0, 2 * Math.PI);
    ctx.fill();

    // Chú thích
    ctx.fillStyle = '#fda4af';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillText(`h = SO = ${h} m`, S_top.x + 10, (S_top.y + O.y) / 2);

    ctx.fillStyle = '#a5b4fc';
    ctx.fillText(`Cạnh đáy a = ${a} m`, A.x, bottomY + 20);

    ctx.fillStyle = '#34d399';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(`V = ${vol.toFixed(1)} m³`, B.x + 15, bottomY - 30);
  }

  sliderBase.addEventListener('input', draw);
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
