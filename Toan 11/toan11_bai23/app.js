// app.js - Bài 23: Đường thẳng vuông góc với mặt phẳng (Toán 11 - Kết Nối Tri Thức)

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Không Gian',
  userTitle: 'Bậc Thầy Trực Giao Đa Chiều',
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
  clean = clean.replace(/\\forall/g, '<mo>∀</mo>');
  clean = clean.replace(/\\ne/g, '<mo>≠</mo>');
  clean = clean.replace(/\\le/g, '<mo>≤</mo>');
  clean = clean.replace(/\\ge/g, '<mo>≥</mo>');
  clean = clean.replace(/\\approx/g, '<mo>≈</mo>');
  clean = clean.replace(/\\iff/g, '<mo>⇔</mo>');
  clean = clean.replace(/\\implies/g, '<mo>⇒</mo>');
  clean = clean.replace(/\\alpha/g, '<mi>α</mi>');
  clean = clean.replace(/\\Delta/g, '<mi>Δ</mi>');
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
    title: "Định nghĩa đường thẳng vuông góc mặt phẳng",
    pts: 20,
    question: "Đường thẳng $d$ được gọi là vuông góc với mặt phẳng $(P)$ nếu:",
    options: [
      { text: "$d$ vuông góc với một đường thẳng nằm trong $(P)$.", correct: false },
      { text: "$d$ vuông góc với hai đường thẳng song song nằm trong $(P)$.", correct: false },
      { text: "$d$ vuông góc với mọi đường thẳng nằm trong $(P)$.", correct: true },
      { text: "$d$ cắt mặt phẳng $(P)$ tại một điểm bất kì.", correct: false }
    ],
    explanation: "Theo định nghĩa SGK Toán 11, đường thẳng $d$ vuông góc với mặt phẳng $(P)$ khi và chỉ khi nó vuông góc với mọi đường thẳng nằm trong $(P)$."
  },
  {
    id: 2,
    title: "Điều kiện cần và đủ để đường thẳng ⊥ mặt phẳng",
    pts: 20,
    question: "Để chứng minh đường thẳng $d$ vuông góc với mặt phẳng $(P)$, ta cần chứng minh $d$ vuông góc với:",
    options: [
      { text: "Hai đường thẳng bất kì nằm trong $(P)$.", correct: false },
      { text: "Hai đường thẳng cắt nhau cùng nằm trong $(P)$.", correct: true },
      { text: "Hai đường thẳng song song nằm trong $(P)$.", correct: false },
      { text: "Một đường thẳng duy nhất nằm trong $(P)$.", correct: false }
    ],
    explanation: "Định lí SGK: Nếu một đường thẳng vuông góc với hai đường thẳng cắt nhau cùng thuộc một mặt phẳng thì nó vuông góc với mặt phẳng đó."
  },
  {
    id: 3,
    title: "Tính chất cơ bản về tính duy nhất",
    pts: 20,
    question: "Khẳng định nào sau đây là <strong>sai</strong>?",
    options: [
      { text: "Có duy nhất một mặt phẳng đi qua một điểm cho trước và vuông góc với một đường thẳng cho trước.", correct: false },
      { text: "Có duy nhất một đường thẳng đi qua một điểm cho trước và vuông góc với một mặt phẳng cho trước.", correct: false },
      { text: "Có vô số đường thẳng đi qua một điểm cho trước và vuông góc với một mặt phẳng cho trước.", correct: true },
      { text: "Mọi đường thẳng nằm trong mặt phẳng $(P)$ đều vuông góc với đường thẳng $\\Delta \\perp (P)$.", correct: false }
    ],
    explanation: "Qua một điểm cho trước chỉ có DUY NHẤT một đường thẳng vuông góc với một mặt phẳng cho trước. Khẳng định 'có vô số' là sai."
  },
  {
    id: 4,
    title: "Mặt phẳng trung trực của đoạn thẳng",
    pts: 20,
    question: "Mặt phẳng trung trực của đoạn thẳng $AB$ là:",
    options: [
      { text: "Mặt phẳng đi qua $A$ và vuông góc với $AB$.", correct: false },
      { text: "Mặt phẳng đi qua trung điểm của $AB$ và vuông góc với $AB$.", correct: true },
      { text: "Mặt phẳng chứa đoạn thẳng $AB$.", correct: false },
      { text: "Mặt phẳng song song với đoạn thẳng $AB$.", correct: false }
    ],
    explanation: "Mặt phẳng đi qua trung điểm của đoạn thẳng $AB$ và vuông góc với đường thẳng $AB$ được gọi là mặt phẳng trung trực của đoạn thẳng $AB$. Nó là tập hợp các điểm cách đều $A$ và $B$."
  },
  {
    id: 5,
    title: "Mối liên hệ giữa quan hệ song song và vuông góc",
    pts: 20,
    question: "Cho hai đường thẳng phân biệt $a$ và $b$ cùng vuông góc với một mặt phẳng $(P)$. Vị trí tương đối của $a$ và $b$ là:",
    options: [
      { text: "$a$ cắt $b$.", correct: false },
      { text: "$a$ chéo $b$.", correct: false },
      { text: "$a // b$.", correct: true },
      { text: "$a \\perp b$.", correct: false }
    ],
    explanation: "Tính chất SGK: Hai đường thẳng phân biệt cùng vuông góc với một mặt phẳng thì song song với nhau."
  },
  {
    id: 6,
    title: "Hình chóp $S.ABC$ (Ví dụ 1 SGK)",
    pts: 20,
    question: "Cho hình chóp $S.ABC$ có đáy $ABC$ là tam giác vuông tại $B$ và $SA \\perp (ABC)$. Khẳng định nào sau đây là <strong>đúng</strong>?",
    options: [
      { text: "$BC \\perp (SAB)$.", correct: true },
      { text: "$AC \\perp (SAB)$.", correct: false },
      { text: "$AB \\perp (SBC)$.", correct: false },
      { text: "$SB \\perp (ABC)$.", correct: false }
    ],
    explanation: "Ta có $BC \\perp AB$ (do tam giác vuông tại $B$) và $BC \\perp SA$ (do $SA \\perp (ABC)$). Vì $AB$ và $SA$ cắt nhau tại $A$ trong $(SAB)$ nên $BC \\perp (SAB)$."
  },
  {
    id: 7,
    title: "Hình chóp $S.ABCD$ có đáy chữ nhật (SGK 7.6)",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình chữ nhật và $SA \\perp (ABCD)$. Số lượng mặt bên của hình chóp là tam giác vuông là:",
    options: [
      { text: "1 mặt", correct: false },
      { text: "2 mặt", correct: false },
      { text: "3 mặt", correct: false },
      { text: "4 mặt", correct: true }
    ],
    explanation: "Cả 4 mặt bên đều là tam giác vuông: $\\Delta SAB$ vuông tại $A$, $\\Delta SAD$ vuông tại $A$, $\\Delta SBC$ vuông tại $B$ (do $BC \\perp (SAB)$), và $\\Delta SCD$ vuông tại $D$ (do $CD \\perp (SAD)$)."
  },
  {
    id: 8,
    title: "Tứ diện có các cặp cạnh đối vuông góc",
    pts: 20,
    question: "Cho tứ diện $ABCD$ có $AB \\perp CD$ và $AC \\perp BD$. Gọi $H$ là trực tâm của tam giác $BCD$. Khẳng định nào sau đây là đúng?",
    options: [
      { text: "$AH \\perp (BCD)$.", correct: true },
      { text: "$AD \\perp (BCD)$.", correct: false },
      { text: "$CD \\perp (ABC)$.", correct: false },
      { text: "$BC \\perp (ABD)$.", correct: false }
    ],
    explanation: "Do $CD \\perp AB$ và $CD \\perp BH$ (vì $H$ là trực tâm $\\Delta BCD$) nên $CD \\perp (ABH) \\implies CD \\perp AH$. Tương tự $BD \\perp AH$. Vậy $AH \\perp (BCD)$."
  },
  {
    id: 9,
    title: "Ứng dụng quả dọi trong xây dựng (SGK 7.8)",
    pts: 20,
    question: "Khi thả quả dọi chìm vào thùng nước yên lặng, dây dọi căng thẳng. Vì sao đường thẳng chứa dây dọi vuông góc với mặt nước?",
    options: [
      { text: "Vì dây dọi có trọng lượng rất lớn kéo xuống.", correct: false },
      { text: "Vì mặt nước phẳng nằm ngang và phương trọng lực có phương thẳng đứng nên dây dọi vuông góc với mọi phương nằm ngang trên mặt nước.", correct: true },
      { text: "Vì thùng nước có dạng hình trụ đứng.", correct: false },
      { text: "Vì quả dọi chạm vào đáy thùng nước.", correct: false }
    ],
    explanation: "Dây dọi chỉ theo phương của trọng lực (phương thẳng đứng), trong khi mặt nước tĩnh tạo thành một mặt phẳng nằm ngang. Mọi đường thẳng nằm ngang đều vuông góc với phương thẳng đứng, do đó dây dọi vuông góc với mặt nước."
  },
  {
    id: 10,
    title: "Kiểm tra dựng cột bóng rổ (SGK 7.9)",
    pts: 20,
    question: "Bạn Hùng dựng cột bóng rổ trên sân phẳng. Đo từ chân cột $1\\text{ m}$ trên sân đến điểm cách chân cột $1\\text{ m}$ trên cột được khoảng cách $1{,}5\\text{ m}$. Hỏi cột có vuông góc với mặt sân không?",
    options: [
      { text: "Có vuông góc, vì $1 + 1 > 1{,}5$.", correct: false },
      { text: "Không vuông góc, vì theo định lí Pythagore: $1^2 + 1^2 = 2 \\ne 1{,}5^2 = 2{,}25$.", correct: true },
      { text: "Có vuông góc, vì $1{,}5\\text{ m}$ là độ dài chuẩn.", correct: false },
      { text: "Chưa đủ dữ kiện để kết luận.", correct: false }
    ],
    explanation: "Nếu cột vuông góc với sân thì tam giác tạo bởi chân cột và hai điểm đo phải là tam giác vuông cân cạnh góc vuông bằng $1\\text{ m}$. Cạnh huyền phải bằng $\\sqrt{1^2 + 1^2} = \\sqrt{2} \\approx 1{,}414\\text{ m} \\ne 1{,}5\\text{ m}$. Do đó cột không vuông góc với mặt sân."
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

// Lab 1: Mô Hình Gấp Bìa (HĐ2 SGK)
let foldAngle = 90;
let viewAngle = 45;

function initLab1() {
  const canvas = document.getElementById('foldCanvas');
  const slider = document.getElementById('foldAngleRange');
  const viewSlider = document.getElementById('viewAngleRange');
  const display = document.getElementById('foldAngleDisplay');
  const presetBtn = document.getElementById('btnPresetPerp');

  if (!canvas) return;

  if (slider) {
    slider.addEventListener('input', (e) => {
      foldAngle = parseFloat(e.target.value);
      if (display) display.textContent = `${foldAngle}°`;
      drawFold();
      unlockBadge(1);
    });
  }

  if (viewSlider) {
    viewSlider.addEventListener('input', (e) => {
      viewAngle = parseFloat(e.target.value);
      drawFold();
    });
  }

  if (presetBtn) {
    presetBtn.addEventListener('click', () => {
      foldAngle = 90;
      if (slider) slider.value = 90;
      if (display) display.textContent = '90°';
      playClick();
      drawFold();
      unlockBadge(1);
    });
  }

  drawFold();
}

function drawFold() {
  const canvas = document.getElementById('foldCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 + 60;
  const radView = (viewAngle * Math.PI) / 180;
  const radFold = (foldAngle * Math.PI) / 180;

  function project(x, y, z) {
    const rx = x * Math.cos(radView) - z * Math.sin(radView);
    const rz = x * Math.sin(radView) + z * Math.cos(radView);
    return {
      x: cx + rx * 1.2 - rz * 0.7,
      y: cy - y * 1.1 + rx * 0.35 + rz * 0.45
    };
  }

  // Mặt bàn (hình bình hành lớn)
  const table = [
    project(-180, 0, 120),
    project(180, 0, 120),
    project(180, 0, -120),
    project(-180, 0, -120)
  ];

  ctx.fillStyle = 'rgba(30, 41, 59, 0.7)';
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(table[0].x, table[0].y);
  for (let i = 1; i < 4; i++) ctx.lineTo(table[i].x, table[i].y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Nếp gấp AB: A nằm trên mặt bàn (0, 0, 0), B dựng đứng (0, 140, 0)
  const A = project(0, 0, 0);
  const B = project(0, 140, 0);

  // Cánh bìa 1 (nằm theo hướng trục X âm trên mặt phẳng z)
  const wWing = 120;
  const halfFold = radFold / 2;
  const wing1_x = -wWing * Math.cos(halfFold);
  const wing1_z = -wWing * Math.sin(halfFold);
  const P1_bot = project(wing1_x, 0, wing1_z);
  const P1_top = project(wing1_x, 140, wing1_z);

  // Cánh bìa 2
  const wing2_x = wWing * Math.cos(halfFold);
  const wing2_z = -wWing * Math.sin(halfFold);
  const P2_bot = project(wing2_x, 0, wing2_z);
  const P2_top = project(wing2_x, 140, wing2_z);

  // Vẽ cánh bìa 1
  ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.lineTo(P1_bot.x, P1_bot.y);
  ctx.lineTo(P1_top.x, P1_top.y);
  ctx.lineTo(B.x, B.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Vẽ cánh bìa 2
  ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
  ctx.strokeStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.lineTo(P2_bot.x, P2_bot.y);
  ctx.lineTo(P2_top.x, P2_top.y);
  ctx.lineTo(B.x, B.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Nếp gấp AB thẳng đứng nổi bật
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.lineTo(B.x, B.y);
  ctx.stroke();

  // Kí hiệu góc vuông tại chân cột A
  ctx.strokeStyle = '#fb7185';
  ctx.lineWidth = 2;
  // Góc giữa AB và mép P1
  ctx.beginPath();
  ctx.arc(A.x, A.y - 12, 10, 0, Math.PI / 2);
  ctx.stroke();

  // Nhãn các điểm
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('A (Chân nếp gấp)', A.x + 8, A.y + 16);
  ctx.fillText('B (Đỉnh nếp gấp)', B.x + 8, B.y - 8);

  ctx.fillStyle = '#06b6d4';
  ctx.fillText('Cánh bìa 1', P1_top.x - 40, P1_top.y - 8);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText('Cánh bìa 2', P2_top.x + 8, P2_top.y - 8);

  ctx.fillStyle = '#10b981';
  ctx.font = '14px sans-serif';
  ctx.fillText(`Nếp gấp AB: Trụ thẳng đứng ⊥ Mặt Bàn (Góc mở = ${foldAngle}°)`, 20, 30);
  ctx.fillStyle = '#94a3b8';
  ctx.fillText('Mép gấp AB vuông góc với hai đường mép đáy cắt nhau tại A $\\implies AB \\perp (Mặt\\ bàn)$', 20, 52);
}

// Lab 2: Hình Chóp S.ABCD
let activePyFace = 'all';

function initLab2() {
  const canvas = document.getElementById('pyramidCanvas');
  const buttons = document.querySelectorAll('.py-face-btn');

  if (!canvas) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activePyFace = btn.dataset.face;
      playClick();
      updateLab2Note();
      drawPyramid();
      unlockBadge(2);
    });
  });

  drawPyramid();
}

function updateLab2Note() {
  const el = document.getElementById('lab2Note');
  if (!el) return;
  if (activePyFace === 'all') {
    el.innerHTML = 'Đang hiển thị toàn cảnh hình chóp $S.ABCD$ có đáy là hình chữ nhật và $SA \\perp (ABCD)$.';
  } else if (activePyFace === 'sbc') {
    el.innerHTML = '<strong>Mặt bên $SBC$:</strong> Do $BC \\perp AB$ và $BC \\perp SA$ nên $BC \\perp (SAB) \\implies BC \\perp SB$. Vậy tam giác $SBC$ vuông tại $B$!';
  } else if (activePyFace === 'scd') {
    el.innerHTML = '<strong>Mặt bên $SCD$:</strong> Do $CD \\perp AD$ và $CD \\perp SA$ nên $CD \\perp (SAD) \\implies CD \\perp SD$. Vậy tam giác $SCD$ vuông tại $D$!';
  } else if (activePyFace === 'sab') {
    el.innerHTML = '<strong>Mặt bên $SAB$:</strong> Do $SA \\perp (ABCD) \\implies SA \\perp AB$. Vậy tam giác $SAB$ vuông tại $A$!';
  } else if (activePyFace === 'sad') {
    el.innerHTML = '<strong>Mặt bên $SAD$:</strong> Do $SA \\perp (ABCD) \\implies SA \\perp AD$. Vậy tam giác $SAD$ vuông tại $A$!';
  }
  renderMathInTree(el);
}

function drawPyramid() {
  const canvas = document.getElementById('pyramidCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 + 50;

  // Đỉnh hình chóp S.ABCD
  const A = { x: cx - 110, y: cy + 30 };
  const B = { x: cx + 40, y: cy + 70 };
  const C = { x: cx + 180, y: cy + 10 };
  const D = { x: cx + 30, y: cy - 30 };
  const S = { x: A.x, y: A.y - 200 }; // SA vuông góc đáy tại A

  // Tô màu mặt bên được chọn
  function fillTriangle(p1, p2, p3, fillStyle) {
    ctx.save();
    ctx.fillStyle = fillStyle;
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  if (activePyFace === 'sbc') {
    fillTriangle(S, B, C, 'rgba(16, 185, 129, 0.4)');
  } else if (activePyFace === 'scd') {
    fillTriangle(S, C, D, 'rgba(245, 158, 11, 0.4)');
  } else if (activePyFace === 'sab') {
    fillTriangle(S, A, B, 'rgba(6, 182, 212, 0.4)');
  } else if (activePyFace === 'sad') {
    fillTriangle(S, A, D, 'rgba(168, 85, 247, 0.4)');
  }

  // Vẽ các cạnh nét đứt (khuất): AD, CD, SD
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(A.x, A.y); ctx.lineTo(D.x, D.y); // AD
  ctx.moveTo(C.x, C.y); ctx.lineTo(D.x, D.y); // CD
  ctx.moveTo(S.x, S.y); ctx.lineTo(D.x, D.y); // SD
  ctx.stroke();
  ctx.restore();

  // Vẽ các cạnh thấy rõ
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); // AB
  ctx.lineTo(C.x, C.y);                        // BC
  ctx.stroke();

  // SA thẳng đứng vuông góc
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(S.x, S.y); ctx.lineTo(A.x, A.y);
  ctx.stroke();

  // SB, SC
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(S.x, S.y); ctx.lineTo(B.x, B.y);
  ctx.moveTo(S.x, S.y); ctx.lineTo(C.x, C.y);
  ctx.stroke();

  // Kí hiệu góc vuông tại chân cột A
  ctx.strokeStyle = '#fb7185';
  ctx.lineWidth = 2;
  // Vuông SA với AB
  ctx.strokeRect(A.x, A.y - 14, 14, 14);

  // Nếu chọn SBC thì vẽ ký hiệu vuông tại B
  if (activePyFace === 'sbc') {
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(B.x - 8, B.y - 14, 12, 12);
  }

  // Nhãn các đỉnh
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#06b6d4';
  ctx.fillText('S', S.x - 5, S.y - 10);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('A', A.x - 18, A.y + 5);
  ctx.fillText('B', B.x + 8, B.y + 16);
  ctx.fillText('C', C.x + 10, C.y + 5);
  ctx.fillText('D', D.x + 5, D.y - 8);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#06b6d4';
  ctx.fillText('Cạnh đường cao: SA ⊥ (ABCD)', 20, 30);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('Bấm các nút phía trên để kiểm tra từng tam giác vuông của hình chóp!', 20, 52);
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
        drawFold();
        drawPyramid();
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
