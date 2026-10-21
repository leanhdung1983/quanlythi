// app.js - Bài 24: Phép chiếu vuông góc. Góc giữa đường thẳng và mặt phẳng (Toán 11 - Kết Nối Tri Thức)

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Không Gian',
  userTitle: 'Chuyên Gia Phép Chiếu 3D',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// Web Audio API
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.2) {
  if (!appState.sound) return;
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio error:', e);
  }
}

function playClick() { playTone(440, 'triangle', 0.08, 0.15); }
function playCorrect() {
  playTone(523.25, 'sine', 0.1, 0.2);
  setTimeout(() => playTone(659.25, 'sine', 0.15, 0.2), 100);
}
function playWrong() {
  playTone(220, 'sawtooth', 0.2, 0.25);
  setTimeout(() => playTone(180, 'sawtooth', 0.25, 0.25), 120);
}
function playFanfare() {
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    setTimeout(() => playTone(freq, 'triangle', 0.2, 0.25), idx * 140);
  });
}

// MathML Fallback & KaTeX Renderer
function latexToMathML(latex) {
  let clean = latex.trim();
  clean = clean.replace(/\\overrightarrow\{([A-Za-z0-9]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>→</mo></mover>');
  clean = clean.replace(/\\vec\{([A-Za-z0-9]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>→</mo></mover>');
  clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  clean = clean.replace(/\\sqrt\{([^}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  clean = clean.replace(/\\perp/g, '<mo>⊥</mo>');
  clean = clean.replace(/\\subset/g, '<mo>⊂</mo>');
  clean = clean.replace(/\\cap/g, '<mo>∩</mo>');
  clean = clean.replace(/\\ne/g, '<mo>≠</mo>');
  clean = clean.replace(/\\le/g, '<mo>≤</mo>');
  clean = clean.replace(/\\ge/g, '<mo>≥</mo>');
  clean = clean.replace(/\\approx/g, '<mo>≈</mo>');
  clean = clean.replace(/\\iff/g, '<mo>⇔</mo>');
  clean = clean.replace(/\\implies/g, '<mo>⇒</mo>');
  clean = clean.replace(/\\alpha/g, '<mi>α</mi>');
  clean = clean.replace(/\\varphi/g, '<mi>φ</mi>');
  clean = clean.replace(/\\circ/g, '<mo>°</mo>');
  return `<math xmlns="http://www.w3.org/1998/Math/MathML" display="inline">${clean}</math>`;
}

function formatMathText(str) {
  if (!str) return '';
  return str
    .replace(/\$\$([\s\S]*?)\$\$/g, (match, p1) => `<span class="math-block">${latexToMathML(p1)}</span>`)
    .replace(/\$([^\$]+?)\$/g, (match, p1) => `<span class="math-inline">${latexToMathML(p1)}</span>`);
}

function renderMathInTree(root) {
  if (!root) return;
  if (typeof renderMathInElement === 'function') {
    try {
      renderMathInElement(root, {
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

// 10 Câu Hỏi Đấu Trường Chuẩn SGK Kết Nối Tri Thức
const quizData = [
  {
    id: 1,
    title: "Khái niệm góc giữa đường thẳng và mặt phẳng",
    pts: 20,
    question: "Góc giữa đường thẳng $d$ và mặt phẳng $(P)$ có số đo $\\varphi$ luôn thoả mãn điều kiện nào sau đây?",
    options: [
      { text: "$0^\\circ \\le \\varphi \\le 180^\\circ$", correct: false },
      { text: "$0^\\circ \\le \\varphi \\le 90^\\circ$", correct: true },
      { text: "$0^\\circ < \\varphi < 90^\\circ$", correct: false },
      { text: "$\\varphi = 90^\\circ$", correct: false }
    ],
    explanation: "Quy ước SGK Toán 11: Số đo góc giữa đường thẳng và mặt phẳng luôn nằm trong đoạn $[0^\\circ; 90^\\circ]$."
  },
  {
    id: 2,
    title: "Trường hợp đường thẳng vuông góc mặt phẳng",
    pts: 20,
    question: "Nếu đường thẳng $d$ vuông góc với mặt phẳng $(P)$ thì góc giữa $d$ và $(P)$ bằng:",
    options: [
      { text: "$0^\\circ$", correct: false },
      { text: "$45^\\circ$", correct: false },
      { text: "$90^\\circ$", correct: true },
      { text: "$180^\\circ$", correct: false }
    ],
    explanation: "Định nghĩa SGK: Nếu $d \\perp (P)$ thì góc giữa đường thẳng $d$ và mặt phẳng $(P)$ bằng $90^\\circ$."
  },
  {
    id: 3,
    title: "Định lí ba đường vuông góc",
    pts: 20,
    question: "Cho đường thẳng $a$ có hình chiếu vuông góc $a'$ trên mặt phẳng $(P)$, và đường thẳng $b \\subset (P)$. Khẳng định nào sau đây là <strong>đúng</strong>?",
    options: [
      { text: "$a \\perp b \\iff a' // b$", correct: false },
      { text: "$a \\perp b \\iff a' \\perp b$", correct: true },
      { text: "$a // b \\iff a' \\perp b$", correct: false },
      { text: "$a \\perp a' \\iff a' \\perp b$", correct: false }
    ],
    explanation: "Định lí ba đường vuông góc: $a \\perp b \\iff a' \\perp b$ với $b \\subset (P)$ và $a'$ là hình chiếu vuông góc của $a$ trên $(P)$."
  },
  {
    id: 4,
    title: "Hình chiếu trong hình chóp $S.ABC$",
    pts: 20,
    question: "Cho hình chóp $S.ABC$ có $SA \\perp (ABC)$. Hình chiếu vuông góc của cạnh bên $SB$ trên mặt phẳng đáy $(ABC)$ là:",
    options: [
      { text: "Đoạn thẳng $SA$", correct: false },
      { text: "Đoạn thẳng $AB$", correct: true },
      { text: "Đoạn thẳng $BC$", correct: false },
      { text: "Đoạn thẳng $AC$", correct: false }
    ],
    explanation: "Vì $SA \\perp (ABC)$ nên hình chiếu của $S$ trên $(ABC)$ là điểm $A$. Điểm $B$ thuộc $(ABC)$ nên hình chiếu của $B$ chính là $B$. Do đó, hình chiếu của $SB$ trên $(ABC)$ là $AB$."
  },
  {
    id: 5,
    title: "Tính góc cạnh bên trong hình chóp $S.ABCD$ (Cơ bản)",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình vuông cạnh $a$, $SA \\perp (ABCD)$ và $SA = a$. Góc giữa đường thẳng $SB$ và mặt phẳng đáy $(ABCD)$ bằng bao nhiêu?",
    options: [
      { text: "$30^\\circ$", correct: false },
      { text: "$45^\\circ$", correct: true },
      { text: "$60^\\circ$", correct: false },
      { text: "$90^\\circ$", correct: false }
    ],
    explanation: "Hình chiếu của $SB$ trên $(ABCD)$ là $AB$. Do đó $(SB, (ABCD)) = (SB, AB) = \\widehat{SBA}$. Xét tam giác vuông $SAB$ vuông tại $A$ có $SA = AB = a \\implies \\Delta SAB$ vuông cân $\\implies \\widehat{SBA} = 45^\\circ$."
  },
  {
    id: 6,
    title: "Tính góc cạnh bên dài hơn (SGK 7.11)",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy là hình vuông cạnh $a$, $SA \\perp (ABCD)$ và $SA = a\\sqrt{2}$. Góc giữa đường thẳng $SC$ và mặt phẳng đáy $(ABCD)$ bằng bao nhiêu?",
    options: [
      { text: "$30^\\circ$", correct: false },
      { text: "$45^\\circ$", correct: true },
      { text: "$60^\\circ$", correct: false },
      { text: "$90^\\circ$", correct: false }
    ],
    explanation: "Hình chiếu của $SC$ trên đáy là $AC$. Tam giác đáy là hình vuông cạnh $a$ nên $AC = a\\sqrt{2}$. Xét tam giác vuông $SAC$ tại $A$: $SA = a\\sqrt{2} = AC \\implies \\Delta SAC$ vuông cân tại $A \\implies \\widehat{SCA} = 45^\\circ$."
  },
  {
    id: 7,
    title: "Hình lập phương và đường chéo",
    pts: 20,
    question: "Cho hình lập phương $ABCD.A'B'C'D'$ cạnh $a$. Gọi $\\varphi$ là góc giữa đường chéo $A'C$ và mặt phẳng đáy $(ABCD)$. Giá trị $\\tan\\varphi$ bằng:",
    options: [
      { text: "$\\tan\\varphi = 1$", correct: false },
      { text: "$\\tan\\varphi = \\sqrt{2}$", correct: false },
      { text: "$\\tan\\varphi = \\frac{\\sqrt{2}}{2}$", correct: true },
      { text: "$\\tan\\varphi = \\frac{\\sqrt{3}}{3}$", correct: false }
    ],
    explanation: "Hình chiếu của $A'C$ trên $(ABCD)$ là $AC$. Do đó góc là $\\widehat{A'CA}$. Xét $\\Delta A'AC$ vuông tại $A$: $\\tan\\varphi = \\frac{A'A}{AC} = \\frac{a}{a\\sqrt{2}} = \\frac{1}{\\sqrt{2}} = \\frac{\\sqrt{2}}{2}$."
  },
  {
    id: 8,
    title: "Góc giữa đường thẳng song song với mặt phẳng",
    pts: 20,
    question: "Nếu đường thẳng $d$ song song với mặt phẳng $(P)$ thì góc giữa $d$ và $(P)$ bằng bao nhiêu?",
    options: [
      { text: "$0^\\circ$", correct: true },
      { text: "$90^\\circ$", correct: false },
      { text: "$180^\\circ$", correct: false },
      { text: "Không xác định được", correct: false }
    ],
    explanation: "Theo quy ước SGK: Nếu $d // (P)$ hoặc $d \\subset (P)$ thì hình chiếu của $d$ song song hoặc trùng với $d$, do đó góc giữa chúng bằng $0^\\circ$."
  },
  {
    id: 9,
    title: "Tứ diện đều $ABCD$ cạnh $a$",
    pts: 20,
    question: "Cho tứ diện đều $ABCD$ có cạnh bằng $a$, gọi $H$ là trọng tâm tam giác $BCD$. Góc giữa cạnh bên $AB$ và mặt phẳng đáy $(BCD)$ là góc nào?",
    options: [
      { text: "$\\widehat{ABC}$", correct: false },
      { text: "$\\widehat{ABD}$", correct: false },
      { text: "$\\widehat{ABH}$", correct: true },
      { text: "$\\widehat{AHB}$", correct: false }
    ],
    explanation: "Vì tứ diện đều nên $AH \\perp (BCD)$, do đó hình chiếu của $AB$ trên $(BCD)$ là $BH$. Góc giữa $AB$ và $(BCD)$ chính là góc $\\widehat{ABH}$."
  },
  {
    id: 10,
    title: "Vận dụng thực tế cất cánh máy bay (HĐ3 SGK)",
    pts: 20,
    question: "Một máy bay sau khi cất cánh bay thẳng theo một góc nghiêng $\\alpha = 30^\\circ$ so với mặt đất nằm ngang với vận tốc không đổi $300\\text{ km/h}$. Sau đúng $1$ phút, độ cao của máy bay so với mặt đất là:",
    options: [
      { text: "$1{,}5\\text{ km}$", correct: false },
      { text: "$2{,}5\\text{ km}$", correct: true },
      { text: "$5\\text{ km}$", correct: false },
      { text: "$4{,}33\\text{ km}$", correct: false }
    ],
    explanation: "Quãng đường bay được sau $1$ phút ($=\\frac{1}{60}\\text{ h}$) là: $S = 300 \\times \\frac{1}{60} = 5\\text{ km}$. Độ cao đạt được là cạnh góc vuông đối diện góc $30^\\circ$: $h = S \\cdot \\sin 30^\\circ = 5 \\cdot 0{,}5 = 2{,}5\\text{ km}$."
  }
];

// Dựng Đấu Trường SGK
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  const labels = ['A', 'B', 'C', 'D'];

  quizData.forEach((q, qIndex) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quiz-card-${q.id}`;

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `<span><strong>Câu ${q.id}:</strong> ${q.title}</span><span class="quiz-badge">+${q.pts} XP</span>`;
    card.appendChild(header);

    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'quiz-options-grid';

    const explanation = document.createElement('div');
    explanation.className = 'explanation-box';
    explanation.id = `exp-${q.id}`;
    explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;
      btn.onclick = () => handleAnswer(q, opt, btn, optionsGrid, explanation);
      optionsGrid.appendChild(btn);
    });

    card.appendChild(optionsGrid);
    card.appendChild(explanation);
    container.appendChild(card);
  });

  renderMathInTree(container);
  updateArenaStats();
}

function handleAnswer(question, selectedOpt, clickedBtn, grid, expBox) {
  if (appState.answered[question.id]) return;
  appState.answered[question.id] = true;

  const buttons = grid.querySelectorAll('.quiz-opt-btn');
  buttons.forEach(b => b.disabled = true);

  if (selectedOpt.correct) {
    clickedBtn.classList.add('correct');
    appState.xp += question.pts;
    appState.streak += 1;
    playCorrect();
  } else {
    clickedBtn.classList.add('wrong');
    appState.streak = 0;
    playWrong();
    question.options.forEach((opt, idx) => {
      if (opt.correct) {
        buttons[idx].classList.add('correct');
      }
    });
  }

  expBox.classList.add('show');
  renderMathInTree(expBox);
  updateHUD();
  updateArenaStats();
  checkBadges();
}

function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const certXPEl = document.getElementById('certXP');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (certXPEl) certXPEl.textContent = appState.xp;

  if (starEl) {
    if (appState.xp >= 200) appState.stars = 5;
    else if (appState.xp >= 150) appState.stars = 4;
    else if (appState.xp >= 100) appState.stars = 3;
    else if (appState.xp >= 50) appState.stars = 2;
    else appState.stars = 1;

    let starStr = '';
    for (let i = 1; i <= 5; i++) {
      starStr += i <= appState.stars ? '⭐' : '☆';
    }
    starEl.textContent = starStr;
  }
}

function updateArenaStats() {
  const count = Object.keys(appState.answered).length;
  const pEl = document.getElementById('arenaProgress');
  const sEl = document.getElementById('arenaScore');
  if (pEl) pEl.textContent = `Tiến Độ: ${count}/10`;
  if (sEl) sEl.textContent = `Điểm Arena: ${appState.xp} XP`;
}

function checkBadges() {
  if (!appState.badges[0]) unlockBadge(0);
  if (appState.xp >= 160 && !appState.badges[3]) unlockBadge(3);
  if (appState.xp >= 200 && !appState.badges[4]) {
    unlockBadge(4);
    playFanfare();
  }
}

function unlockBadge(index) {
  appState.badges[index] = true;
  const bEl = document.getElementById(`badge-${index + 1}`);
  if (bEl) {
    bEl.classList.remove('locked');
    bEl.classList.add('unlocked');
  }
}

// Lab 1: Thước Đo Góc Nghiêng & Bóng Đổ
let ahVal = 80;
let hbVal = 120;

function initLab1() {
  const canvas = document.getElementById('projCanvas');
  const ahSlider = document.getElementById('ahRange');
  const hbSlider = document.getElementById('hbRange');
  const ahDisplay = document.getElementById('ahVal');
  const hbDisplay = document.getElementById('hbVal');

  if (!canvas) return;

  if (ahSlider) {
    ahSlider.addEventListener('input', (e) => {
      ahVal = parseFloat(e.target.value);
      if (ahDisplay) ahDisplay.textContent = `${ahVal}m`;
      drawProj();
      unlockBadge(1);
    });
  }

  if (hbSlider) {
    hbSlider.addEventListener('input', (e) => {
      hbVal = parseFloat(e.target.value);
      if (hbDisplay) hbDisplay.textContent = `${hbVal}m`;
      drawProj();
      unlockBadge(1);
    });
  }

  const p30 = document.getElementById('btnPreset30');
  const p45 = document.getElementById('btnPreset45');
  const p60 = document.getElementById('btnPreset60');

  if (p30) {
    p30.addEventListener('click', () => {
      hbVal = 140;
      ahVal = Math.round(140 * Math.tan(30 * Math.PI / 180));
      updateSliders();
    });
  }
  if (p45) {
    p45.addEventListener('click', () => {
      ahVal = 110;
      hbVal = 110;
      updateSliders();
    });
  }
  if (p60) {
    p60.addEventListener('click', () => {
      hbVal = 80;
      ahVal = Math.round(80 * Math.tan(60 * Math.PI / 180));
      updateSliders();
    });
  }

  function updateSliders() {
    if (ahSlider) ahSlider.value = ahVal;
    if (hbSlider) hbSlider.value = hbVal;
    if (ahDisplay) ahDisplay.textContent = `${ahVal}m`;
    if (hbDisplay) hbDisplay.textContent = `${hbVal}m`;
    playClick();
    drawProj();
    unlockBadge(1);
  }

  drawProj();
}

function drawProj() {
  const canvas = document.getElementById('projCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 + 70;

  // Điểm B (gốc cọc trên sàn)
  const B = { x: cx - 140, y: cy + 20 };
  // Điểm H (chân đường vuông góc hạ từ A)
  const H = { x: B.x + hbVal * 1.8, y: B.y - 15 };
  // Điểm A (đỉnh cọc trong không gian)
  const A = { x: H.x, y: H.y - ahVal * 1.5 };

  // Vẽ mặt sàn phối cảnh (P)
  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(B.x - 60, B.y + 40);
  ctx.lineTo(H.x + 120, H.y + 25);
  ctx.lineTo(H.x + 70, H.y - 60);
  ctx.lineTo(B.x - 110, B.y - 45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Nhãn mặt sàn (P)
  ctx.font = 'italic bold 16px sans-serif';
  ctx.fillStyle = '#818cf8';
  ctx.fillText('(P)', B.x - 90, B.y - 20);

  // Vẽ bóng đổ HB trên mặt sàn
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(B.x, B.y);
  ctx.lineTo(H.x, H.y);
  ctx.stroke();

  // Vẽ đường chiếu vuông góc AH (nét đứt)
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.lineTo(H.x, H.y);
  ctx.stroke();
  ctx.restore();

  // Kí hiệu góc vuông tại H
  ctx.strokeStyle = '#fb7185';
  ctx.lineWidth = 2;
  ctx.strokeRect(H.x - 14, H.y - 14, 14, 14);

  // Vẽ cọc nghiêng AB
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.lineTo(B.x, B.y);
  ctx.stroke();

  // Cung góc nghiêng phi tại B
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const angleRad = Math.atan2(A.y - B.y, A.x - B.x);
  const baseRad = Math.atan2(H.y - B.y, H.x - B.x);
  ctx.arc(B.x, B.y, 40, angleRad, baseRad);
  ctx.stroke();

  // Nhãn các đỉnh
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('B (Giao điểm d ∩ (P))', B.x - 140, B.y + 25);
  ctx.fillText('A (Đỉnh cọc)', A.x - 15, A.y - 10);
  ctx.fillText('H (Hình chiếu của A)', H.x + 10, H.y + 5);

  // Tính góc
  const tanPhi = ahVal / hbVal;
  const phiRad = Math.atan(tanPhi);
  const phiDeg = (phiRad * 180) / Math.PI;
  const lenAB = Math.sqrt(ahVal * ahVal + hbVal * hbVal);

  ctx.font = 'bold 14px sans-serif';
  ctx.fillStyle = '#a855f7';
  ctx.fillText(`Góc φ ≈ ${phiDeg.toFixed(1)}°`, B.x + 50, B.y - 5);

  const noteEl = document.getElementById('lab1Note');
  if (noteEl) {
    noteEl.innerHTML = `
      • <strong>Đoạn hình chiếu:</strong> $HB$ là hình chiếu vuông góc của đường xiên $AB$ trên mặt sàn $(P)$.<br>
      • <strong>Độ dài cạnh xiên:</strong> $AB = \\sqrt{AH^2 + HB^2} = \\sqrt{${ahVal}^2 + ${hbVal}^2} \\approx ${lenAB.toFixed(1)}\\text{ m}$.<br>
      • <strong>Công thức tính góc:</strong> $\\tan\\varphi = \\frac{AH}{HB} = \\frac{${ahVal}}{${hbVal}} \\approx ${tanPhi.toFixed(3)} \\implies \\mathbf{\\varphi = (AB, (P)) \\approx ${phiDeg.toFixed(1)}^\\circ}$.
    `;
    renderMathInTree(noteEl);
  }
}

// Lab 2: Góc Các Cạnh Bên Hình Chóp S.ABCD
let activeEdge = 'sb';
let saHeight = 120;
let pyView = 35;

function initLab2() {
  const canvas = document.getElementById('pyAngleCanvas');
  const buttons = document.querySelectorAll('.py-angle-btn');
  const saSlider = document.getElementById('saRange');
  const viewSlider = document.getElementById('pyViewRange');
  const saDisplay = document.getElementById('saVal');

  if (!canvas) return;

  if (saSlider) {
    saSlider.addEventListener('input', (e) => {
      saHeight = parseFloat(e.target.value);
      if (saDisplay) saDisplay.textContent = saHeight;
      drawPyAngle();
      updateLab2Note();
      unlockBadge(2);
    });
  }

  if (viewSlider) {
    viewSlider.addEventListener('input', (e) => {
      pyView = parseFloat(e.target.value);
      drawPyAngle();
    });
  }

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeEdge = btn.dataset.edge;
      playClick();
      updateLab2Note();
      drawPyAngle();
      unlockBadge(2);
    });
  });

  drawPyAngle();
  updateLab2Note();
}

function updateLab2Note() {
  const el = document.getElementById('lab2Note');
  if (!el) return;

  const abLen = 140;
  const adLen = 90;
  const acLen = Math.sqrt(abLen * abLen + adLen * adLen);
  const aoLen = acLen / 2;

  let edgeName = '';
  let projName = '';
  let angleName = '';
  let baseLen = 0;

  if (activeEdge === 'sb') {
    edgeName = 'SB'; projName = 'AB'; angleName = '\\widehat{SBA}'; baseLen = abLen;
  } else if (activeEdge === 'sc') {
    edgeName = 'SC'; projName = 'AC'; angleName = '\\widehat{SCA}'; baseLen = acLen;
  } else if (activeEdge === 'sd') {
    edgeName = 'SD'; projName = 'AD'; angleName = '\\widehat{SDA}'; baseLen = adLen;
  } else if (activeEdge === 'so') {
    edgeName = 'SO'; projName = 'AO'; angleName = '\\widehat{SOA}'; baseLen = aoLen;
  }

  const tanVal = saHeight / baseLen;
  const deg = (Math.atan(tanVal) * 180) / Math.PI;

  el.innerHTML = `
    <strong>Góc giữa đường thẳng $${edgeName}$ và mặt đáy $(ABCD)$:</strong><br>
    • Hình chiếu của $S$ trên $(ABCD)$ là $A$, hình chiếu của $${edgeName[1]}$ là chính nó $\\implies$ Hình chiếu của $${edgeName}$ là đoạn $${projName}$.<br>
    • Góc cần tìm: $\\mathbf{(${edgeName}, (ABCD)) = (${edgeName}, ${projName}) = ${angleName}}$.<br>
    • Tính toán trong tam giác vuông: $\\tan${angleName} = \\frac{SA}{${projName}} = \\frac{${saHeight}}{${baseLen.toFixed(1)}} \\approx ${tanVal.toFixed(3)} \\implies \\mathbf{${angleName} \\approx ${deg.toFixed(1)}^\\circ}$.
  `;
  renderMathInTree(el);
}

function drawPyAngle() {
  const canvas = document.getElementById('pyAngleCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 + 60;

  // Đỉnh hình chóp S.ABCD
  const A = { x: cx - 120, y: cy + 20 };
  const B = { x: cx + 30, y: cy + 60 };
  const C = { x: cx + 180, y: cy + 5 };
  const D = { x: cx + 30, y: cy - 35 };
  const O = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };
  const S = { x: A.x, y: A.y - saHeight * 1.3 };

  // Khung nét đứt (khuất): AD, CD, SD, AC, BD, SO
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y); ctx.lineTo(D.x, D.y);
  ctx.moveTo(C.x, C.y); ctx.lineTo(D.x, D.y);
  ctx.moveTo(S.x, S.y); ctx.lineTo(D.x, D.y);
  ctx.moveTo(A.x, A.y); ctx.lineTo(C.x, C.y); // AC
  ctx.moveTo(B.x, B.y); ctx.lineTo(D.x, D.y); // BD
  ctx.moveTo(S.x, S.y); ctx.lineTo(O.x, O.y); // SO
  ctx.stroke();
  ctx.restore();

  // Khung thấy rõ: AB, BC, SA, SB, SC
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
  ctx.lineTo(C.x, C.y);
  ctx.moveTo(S.x, S.y); ctx.lineTo(B.x, B.y);
  ctx.moveTo(S.x, S.y); ctx.lineTo(C.x, C.y);
  ctx.stroke();

  // Cột SA vuông góc đáy
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(S.x, S.y); ctx.lineTo(A.x, A.y);
  ctx.stroke();

  // Kí hiệu góc vuông tại chân A
  ctx.strokeStyle = '#fb7185';
  ctx.lineWidth = 2;
  ctx.strokeRect(A.x, A.y - 12, 12, 12);

  // Làm nổi bật cạnh xiên và hình chiếu tương ứng
  let targetP = B;
  if (activeEdge === 'sb') targetP = B;
  else if (activeEdge === 'sc') targetP = C;
  else if (activeEdge === 'sd') targetP = D;
  else if (activeEdge === 'so') targetP = O;

  // Cạnh xiên
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(S.x, S.y); ctx.lineTo(targetP.x, targetP.y);
  ctx.stroke();

  // Đoạn hình chiếu dưới đáy
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y); ctx.lineTo(targetP.x, targetP.y);
  ctx.stroke();

  // Cung góc nghiêng tại targetP
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const radEdge = Math.atan2(S.y - targetP.y, S.x - targetP.x);
  const radProj = Math.atan2(A.y - targetP.y, A.x - targetP.x);
  ctx.arc(targetP.x, targetP.y, 25, radEdge, radProj);
  ctx.stroke();

  // Nhãn các đỉnh
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#06b6d4';
  ctx.fillText('S', S.x - 5, S.y - 8);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('A', A.x - 18, A.y + 5);
  ctx.fillText('B', B.x + 8, B.y + 16);
  ctx.fillText('C', C.x + 10, C.y + 5);
  ctx.fillText('D', D.x + 5, D.y - 8);
  ctx.fillText('O', O.x - 5, O.y - 8);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#10b981';
  ctx.fillText(`— Đường xiên được chọn: ${activeEdge.toUpperCase()}`, 20, 30);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`— Hình chiếu vuông góc dưới đáy: A${targetP === O ? 'O' : activeEdge.toUpperCase()[1]}`, 20, 52);
}

// Chuyển Tab
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      if (target) {
        target.classList.add('active');
        renderMathInTree(target);
      }
      playClick();
      if (tab.dataset.tab === 'labs') {
        drawProj();
        drawPyAngle();
      }
      checkBadges();
    });
  });
}

// Modal Avatar
function initAvatar() {
  const btn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const closeBtn = document.getElementById('closeAvatarModal');
  const opts = document.querySelectorAll('.avatar-opt');

  if (btn && modal) {
    btn.addEventListener('click', () => {
      modal.style.display = 'flex';
      playClick();
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      playClick();
    });
  }

  opts.forEach(opt => {
    opt.addEventListener('click', () => {
      appState.avatar = opt.dataset.avatar;
      appState.userName = opt.dataset.name;
      const avatarDisplay = document.getElementById('avatarBtn');
      const nameDisplay = document.getElementById('userNameDisplay');
      const certName = document.getElementById('certStudentName');

      if (avatarDisplay) avatarDisplay.textContent = appState.avatar;
      if (nameDisplay) nameDisplay.textContent = `${appState.userName} 🌟`;
      if (certName) certName.textContent = appState.userName;

      if (modal) modal.style.display = 'none';
      playClick();
    });
  });
}

// Tiện ích HUD
function initHUD() {
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔈 Âm thanh: TẮT';
      playClick();
    });
  }

  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập bài này?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        document.querySelectorAll('.badge-item').forEach(b => {
          b.classList.remove('unlocked');
          b.classList.add('locked');
        });
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

// Khởi chạy khi DOM sẵn sàng
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initAvatar();
  initHUD();
  initLab1();
  initLab2();
  renderQuiz();
  renderMathInTree(document.body);
  unlockBadge(0);
});
