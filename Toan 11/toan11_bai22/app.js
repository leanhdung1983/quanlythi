// app.js - Bài 22: Hai đường thẳng vuông góc (Toán 11 - Kết Nối Tri Thức)

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Không Gian',
  userTitle: 'Kiến Trúc Sư Trực Giao 3D',
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
  clean = clean.replace(/\\cdot/g, '<mo>·</mo>');
  clean = clean.replace(/\\times/g, '<mo>×</mo>');
  clean = clean.replace(/\\perp/g, '<mo>⊥</mo>');
  clean = clean.replace(/\\le/g, '<mo>≤</mo>');
  clean = clean.replace(/\\ge/g, '<mo>≥</mo>');
  clean = clean.replace(/\\approx/g, '<mo>≈</mo>');
  clean = clean.replace(/\\ne/g, '<mo>≠</mo>');
  clean = clean.replace(/\\iff/g, '<mo>⇔</mo>');
  clean = clean.replace(/\\implies/g, '<mo>⇒</mo>');
  clean = clean.replace(/\\alpha/g, '<mi>α</mi>');
  clean = clean.replace(/\\beta/g, '<mi>β</mi>');
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
      console.warn("KaTeX render failed, using fallback:", e);
    }
  }
}

// 10 Câu Hỏi Trắc Nghiệm Chuẩn SGK Kết Nối Tri Thức
const quizData = [
  {
    id: 1,
    title: "Khái niệm góc giữa hai đường thẳng",
    pts: 20,
    question: "Góc giữa hai đường thẳng $a$ và $b$ trong không gian có số đo $\\alpha$ thuộc khoảng/đoạn nào sau đây?",
    options: [
      { text: "$0^\\circ \\le \\alpha \\le 180^\\circ$", correct: false },
      { text: "$0^\\circ \\le \\alpha \\le 90^\\circ$", correct: true },
      { text: "$0^\\circ < \\alpha < 90^\\circ$", correct: false },
      { text: "$0^\\circ < \\alpha \\le 180^\\circ$", correct: false }
    ],
    explanation: "Theo định nghĩa SGK Toán 11, góc giữa hai đường thẳng trong không gian luôn nằm trong đoạn $[0^\\circ; 90^\\circ]$."
  },
  {
    id: 2,
    title: "Quan hệ trực giao trong không gian",
    pts: 20,
    question: "Khẳng định nào sau đây là <strong>đúng</strong> về hai đường thẳng vuông góc trong không gian?",
    options: [
      { text: "Hai đường thẳng vuông góc thì bắt buộc phải cắt nhau.", correct: false },
      { text: "Hai đường thẳng cùng vuông góc với một đường thẳng thứ ba thì song song với nhau.", correct: false },
      { text: "Hai đường thẳng vuông góc với nhau có thể cắt nhau hoặc chéo nhau.", correct: true },
      { text: "Hai đường thẳng vuông góc thì luôn cùng thuộc một mặt phẳng.", correct: false }
    ],
    explanation: "Trong không gian, hai đường thẳng vuông góc với nhau nếu góc giữa chúng bằng $90^\\circ$. Chúng có thể cắt nhau hoặc chéo nhau (khác với hình học phẳng luôn cắt nhau)."
  },
  {
    id: 3,
    title: "Công thức góc theo vectơ chỉ phương",
    pts: 20,
    question: "Cho hai đường thẳng $a, b$ lần lượt có vectơ chỉ phương $\\overrightarrow{u}, \\overrightarrow{v}$. Góc $\\varphi = (a, b)$ được tính theo công thức nào?",
    options: [
      { text: "$\\cos\\varphi = \\frac{\\overrightarrow{u} \\cdot \\overrightarrow{v}}{|\\overrightarrow{u}| \\cdot |\\overrightarrow{v}|}$", correct: false },
      { text: "$\\cos\\varphi = \\frac{|\\overrightarrow{u} \\cdot \\overrightarrow{v}|}{|\\overrightarrow{u}| \\cdot |\\overrightarrow{v}|}$", correct: true },
      { text: "$\\sin\\varphi = \\frac{|\\overrightarrow{u} \\cdot \\overrightarrow{v}|}{|\\overrightarrow{u}| \\cdot |\\overrightarrow{v}|}$", correct: false },
      { text: "$\\cos\\varphi = |\\overrightarrow{u} \\cdot \\overrightarrow{v}|$", correct: false }
    ],
    explanation: "Vì số đo góc giữa hai đường thẳng nằm trong $[0^\\circ; 90^\\circ]$ nên $\\cos\\varphi \\ge 0$, do đó $\\cos\\varphi = |\\cos(\\overrightarrow{u}, \\overrightarrow{v})| = \\frac{|\\overrightarrow{u} \\cdot \\overrightarrow{v}|}{|\\overrightarrow{u}| \\cdot |\\overrightarrow{v}|}$."
  },
  {
    id: 4,
    title: "Góc trong hình lập phương (Cặp 1)",
    pts: 20,
    question: "Cho hình lập phương $ABCD.A'B'C'D'$. Góc giữa hai đường thẳng $AA'$ và $CD$ bằng bao nhiêu?",
    options: [
      { text: "$45^\\circ$", correct: false },
      { text: "$90^\\circ$", correct: true },
      { text: "$60^\\circ$", correct: false },
      { text: "$30^\\circ$", correct: false }
    ],
    explanation: "Ta có $AB // CD$ nên $(AA', CD) = (AA', AB) = 90^\\circ$ (vì $ABB'A'$ là hình vuông)."
  },
  {
    id: 5,
    title: "Góc trong hình lập phương (Cặp 2)",
    pts: 20,
    question: "Cho hình lập phương $ABCD.A'B'C'D'$. Góc giữa hai đường thẳng chéo nhau $A'C'$ và $BD$ bằng bao nhiêu?",
    options: [
      { text: "$45^\\circ$", correct: false },
      { text: "$60^\\circ$", correct: false },
      { text: "$90^\\circ$", correct: true },
      { text: "$30^\\circ$", correct: false }
    ],
    explanation: "Ta có $AC // A'C'$ nên $(A'C', BD) = (AC, BD)$. Vì $ABCD$ là hình vuông nên hai đường chéo $AC \\perp BD$, tức góc bằng $90^\\circ$."
  },
  {
    id: 6,
    title: "Góc trong hình lập phương (Cặp 3)",
    pts: 20,
    question: "Cho hình lập phương $ABCD.A'B'C'D'$. Góc giữa hai đường thẳng $AC$ và $DA'$ bằng bao nhiêu?",
    options: [
      { text: "$45^\\circ$", correct: false },
      { text: "$60^\\circ$", correct: true },
      { text: "$90^\\circ$", correct: false },
      { text: "$30^\\circ$", correct: false }
    ],
    explanation: "Do $DA' // CB'$ nên $(AC, DA') = (AC, CB')$. Xét tam giác $ACB'$, ba cạnh $AC, CB', B'A$ đều là đường chéo của các mặt hình vuông bằng nhau nên tam giác $ACB'$ đều $\\implies \\widehat{ACB'} = 60^\\circ$."
  },
  {
    id: 7,
    title: "Tứ diện đều (SGK 7.2)",
    pts: 20,
    question: "Cho tứ diện đều $ABCD$. Góc giữa hai cạnh đối diện $AB$ và $CD$ bằng bao nhiêu?",
    options: [
      { text: "$60^\\circ$", correct: false },
      { text: "$45^\\circ$", correct: false },
      { text: "$90^\\circ$", correct: true },
      { text: "$30^\\circ$", correct: false }
    ],
    explanation: "Gọi $M$ là trung điểm $CD$. Tam giác $ACD$ và $BCD$ đều nên $AM \\perp CD$ và $BM \\perp CD \\implies CD \\perp (ABM) \\implies CD \\perp AB$. Do đó góc bằng $90^\\circ$."
  },
  {
    id: 8,
    title: "Hình lăng trụ tam giác đều (SGK 7.1)",
    pts: 20,
    question: "Cho hình lăng trụ tam giác đều $ABC.A'B'C'$ có tất cả các cạnh bằng nhau. Góc giữa hai đường thẳng $AB$ và $B'C'$ bằng bao nhiêu?",
    options: [
      { text: "$30^\\circ$", correct: false },
      { text: "$60^\\circ$", correct: true },
      { text: "$90^\\circ$", correct: false },
      { text: "$45^\\circ$", correct: false }
    ],
    explanation: "Vì $BC // B'C'$ nên $(AB, B'C') = (AB, BC) = \\widehat{ABC} = 60^\\circ$ (do đáy $ABC$ là tam giác đều)."
  },
  {
    id: 9,
    title: "Toạ độ vectơ chỉ phương",
    pts: 20,
    question: "Hai đường thẳng $d_1, d_2$ có vectơ chỉ phương lần lượt là $\\overrightarrow{u} = (1; 0; 1)$ và $\\overrightarrow{v} = (-1; 2; 1)$. Góc giữa $d_1$ và $d_2$ bằng bao nhiêu?",
    options: [
      { text: "$0^\\circ$", correct: false },
      { text: "$45^\\circ$", correct: false },
      { text: "$60^\\circ$", correct: false },
      { text: "$90^\\circ$", correct: true }
    ],
    explanation: "Ta tính tích vô hướng: $\\overrightarrow{u} \\cdot \\overrightarrow{v} = 1 \\cdot (-1) + 0 \\cdot 2 + 1 \\cdot 1 = -1 + 0 + 1 = 0$. Tích vô hướng bằng 0 chứng tỏ hai đường thẳng vuông góc, góc bằng $90^\\circ$."
  },
  {
    id: 10,
    title: "Vận dụng thực tế khung nhà gỗ (SGK 7.4)",
    pts: 20,
    question: "Trong kết cấu nhà gỗ truyền thống, cột đứng (thẳng đứng) và quá giang (thanh xà ngang) tạo với nhau một góc bằng bao nhiêu?",
    options: [
      { text: "$45^\\circ$", correct: false },
      { text: "$60^\\circ$", correct: false },
      { text: "$90^\\circ$", correct: true },
      { text: "$120^\\circ$", correct: false }
    ],
    explanation: "Cột nhà có phương thẳng đứng còn quá giang nằm ngang, do đó hai cấu kiện này vuông góc với nhau ($90^\\circ$)."
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
  // Badge 1: Đọc lý thuyết (mặc định sau vài giây hoặc khi xem tab)
  if (!appState.badges[0]) unlockBadge(0);

  // Badge 4: Điểm >= 160
  if (appState.xp >= 160 && !appState.badges[3]) {
    unlockBadge(3);
  }

  // Badge 5: Đúng 10/10 câu (200 XP)
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

// Lab 1: Sa Bàn 3D Hình Lập Phương
let currentPair = 1;
let cubeAngle = 35;
let showParallel = true;

const pairInfo = {
  1: {
    line1: "AA'",
    line2: "CD",
    parallel: "DD' // AA' (hoặc AB // CD)",
    angle: "90°",
    note: "Do $CD // AB$ nên góc $(AA', CD) = (AA', AB) = 90^\\circ$. Hai đường thẳng này vuông góc với nhau!"
  },
  2: {
    line1: "A'C'",
    line2: "BD",
    parallel: "AC // A'C'",
    angle: "90°",
    note: "Do $AC // A'C'$ nên góc $(A'C', BD) = (AC, BD) = 90^\\circ$ (vì $ABCD$ là hình vuông, hai đường chéo vuông góc)."
  },
  3: {
    line1: "AC",
    line2: "DC'",
    parallel: "AB' // DC'",
    angle: "60°",
    note: "Do $AB' // DC'$ nên góc $(AC, DC') = (AC, AB') = 60^\\circ$ (tam giác $ACB'$ có 3 cạnh là 3 đường chéo bằng nhau, nên là tam giác đều)."
  },
  4: {
    line1: "A'B",
    line2: "B'C",
    parallel: "D'C // A'B",
    angle: "60°",
    note: "Do $D'C // A'B$ nên góc $(A'B, B'C) = (D'C, B'C) = 60^\\circ$ (tam giác $B'CD'$ là tam giác đều)."
  }
};

function initLab1() {
  const canvas = document.getElementById('cubeCanvas');
  const slider = document.getElementById('cubeAngleRange');
  const toggleBtn = document.getElementById('btnToggleParallel');
  const pairBtns = document.querySelectorAll('.lab-pair-btn');

  if (!canvas) return;

  if (slider) {
    slider.addEventListener('input', (e) => {
      cubeAngle = parseFloat(e.target.value);
      drawCube();
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      showParallel = !showParallel;
      playClick();
      drawCube();
    });
  }

  pairBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      pairBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentPair = parseInt(btn.dataset.pair, 10);
      playClick();
      updateLab1Note();
      drawCube();
      unlockBadge(1);
    });
  });

  drawCube();
  updateLab1Note();
}

function updateLab1Note() {
  const el = document.getElementById('lab1Explanation');
  if (el) {
    el.innerHTML = pairInfo[currentPair].note;
    renderMathInTree(el);
  }
}

function drawCube() {
  const canvas = document.getElementById('cubeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  // Gốc toạ độ tâm canvas
  const cx = w / 2;
  const cy = h / 2 + 20;
  const s = 110; // Cạnh lập phương
  const rad = (cubeAngle * Math.PI) / 180;

  // Chiếu 3D sang 2D isometric có thể xoay
  function project(x, y, z) {
    // Xoay quanh trục thẳng đứng Y
    const rx = x * Math.cos(rad) - z * Math.sin(rad);
    const rz = x * Math.sin(rad) + z * Math.cos(rad);
    // Phép chiếu phối cảnh nghiêng nhẹ
    const px = cx + rx * 1.3 - rz * 0.7;
    const py = cy - y * 1.2 + rx * 0.35 + rz * 0.45;
    return { x: px, y: py };
  }

  // 8 Đỉnh hình lập phương tâm O(0,0,0) cạnh 2
  const rawVertices = {
    A: [-1, -1, 1],
    B: [1, -1, 1],
    C: [1, -1, -1],
    D: [-1, -1, -1],
    A1: [-1, 1, 1],
    B1: [1, 1, 1],
    C1: [1, 1, -1],
    D1: [-1, 1, -1]
  };

  const V = {};
  for (const k in rawVertices) {
    const [x, y, z] = rawVertices[k];
    V[k] = project(x * s, y * s, z * s);
  }

  // Vẽ các cạnh khung nền mờ
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
  ctx.lineWidth = 1.5;

  const edges = [
    ['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'],
    ['A1', 'B1'], ['B1', 'C1'], ['C1', 'D1'], ['D1', 'A1'],
    ['A', 'A1'], ['B', 'B1'], ['C', 'C1'], ['D', 'D1']
  ];

  edges.forEach(([p1, p2]) => {
    ctx.beginPath();
    ctx.moveTo(V[p1].x, V[p1].y);
    ctx.lineTo(V[p2].x, V[p2].y);
    ctx.stroke();
  });

  // Vẽ đường cặp 1 và đường cặp 2
  function drawSegment(p1, p2, color, width, dash = []) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.setLineDash(dash);
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.stroke();
    ctx.restore();
  }

  // Tô đậm cặp đường được chọn
  if (currentPair === 1) {
    drawSegment(V.A, V.A1, '#06b6d4', 4); // AA'
    drawSegment(V.C, V.D, '#f59e0b', 4);  // CD
    if (showParallel) {
      drawSegment(V.A, V.B, '#10b981', 3, [6, 4]); // AB // CD
    }
  } else if (currentPair === 2) {
    drawSegment(V.A1, V.C1, '#06b6d4', 4); // A'C'
    drawSegment(V.B, V.D, '#f59e0b', 4);   // BD
    if (showParallel) {
      drawSegment(V.A, V.C, '#10b981', 3, [6, 4]); // AC // A'C'
    }
  } else if (currentPair === 3) {
    drawSegment(V.A, V.C, '#06b6d4', 4);   // AC
    drawSegment(V.D, V.C1, '#f59e0b', 4);  // DC'
    if (showParallel) {
      drawSegment(V.A, V.B1, '#10b981', 3, [6, 4]); // AB' // DC'
      drawSegment(V.C, V.B1, '#a855f7', 2, [4, 4]); // Cạnh thứ ba tam giác ACB'
    }
  } else if (currentPair === 4) {
    drawSegment(V.A1, V.B, '#06b6d4', 4);  // A'B
    drawSegment(V.B1, V.C, '#f59e0b', 4);  // B'C
    if (showParallel) {
      drawSegment(V.D1, V.C, '#10b981', 3, [6, 4]); // D'C // A'B
      drawSegment(V.B1, V.D1, '#a855f7', 2, [4, 4]); // B'D'
    }
  }

  // Vẽ các nhãn đỉnh
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#ffffff';
  const labelNames = {
    A: "A", B: "B", C: "C", D: "D",
    A1: "A'", B1: "B'", C1: "C'", D1: "D'"
  };

  for (const k in V) {
    ctx.beginPath();
    ctx.arc(V[k].x, V[k].y, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#818cf8';
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(labelNames[k], V[k].x + 7, V[k].y - 5);
  }

  // Chú thích màu góc
  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#06b6d4';
  ctx.fillText(`— Đường thẳng thứ nhất: ${pairInfo[currentPair].line1}`, 20, 30);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText(`— Đường thẳng thứ hai: ${pairInfo[currentPair].line2}`, 20, 52);
  if (showParallel) {
    ctx.fillStyle = '#10b981';
    ctx.fillText(`- - - Đường song song tịnh tiến: ${pairInfo[currentPair].parallel}`, 20, 74);
  }
}

// Lab 2: Máy Tính Tích Vô Hướng & Trực Giao Vectơ
function initLab2() {
  const inputs = ['u_x', 'u_y', 'u_z', 'v_x', 'v_y', 'v_z'];
  inputs.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', calculateVectors);
  });

  const presetBtns = document.querySelectorAll('.lab-preset-btn');
  presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      const p = btn.dataset.preset;
      applyPreset(p);
      playClick();
      unlockBadge(2);
    });
  });

  calculateVectors();
}

function applyPreset(preset) {
  if (preset === 'ortho') {
    setVectorValues(1, 2, 2, 2, -1, 0); // Dot = 2 - 2 + 0 = 0
  } else if (preset === '60deg') {
    setVectorValues(1, 1, 0, 1, 0, 0); // 45 deg or 60 deg
  } else if (preset === '45deg') {
    setVectorValues(1, 1, 0, 1, 0, 0);
  } else if (preset === 'parallel') {
    setVectorValues(2, 4, 6, 1, 2, 3); // Dot max
  }
  calculateVectors();
}

function setVectorValues(ux, uy, uz, vx, vy, vz) {
  document.getElementById('u_x').value = ux;
  document.getElementById('u_y').value = uy;
  document.getElementById('u_z').value = uz;
  document.getElementById('v_x').value = vx;
  document.getElementById('v_y').value = vy;
  document.getElementById('v_z').value = vz;
}

function calculateVectors() {
  const ux = parseFloat(document.getElementById('u_x').value) || 0;
  const uy = parseFloat(document.getElementById('u_y').value) || 0;
  const uz = parseFloat(document.getElementById('u_z').value) || 0;
  const vx = parseFloat(document.getElementById('v_x').value) || 0;
  const vy = parseFloat(document.getElementById('v_y').value) || 0;
  const vz = parseFloat(document.getElementById('v_z').value) || 0;

  const dot = ux * vx + uy * vy + uz * vz;
  const lenU = Math.sqrt(ux * ux + uy * uy + uz * uz);
  const lenV = Math.sqrt(vx * vx + vy * vy + vz * vz);

  const resEl = document.getElementById('lab2Result');
  if (!resEl) return;

  if (lenU === 0 || lenV === 0) {
    resEl.innerHTML = `<span style="color: var(--rose);">⚠️ Vectơ chỉ phương phải khác vectơ không! Vui lòng nhập ít nhất một toạ độ khác 0.</span>`;
    return;
  }

  const cosTheta = Math.abs(dot) / (lenU * lenV);
  const clampedCos = Math.min(1, Math.max(0, cosTheta));
  const angleRad = Math.acos(clampedCos);
  const angleDeg = (angleRad * 180) / Math.PI;

  const isOrtho = Math.abs(dot) < 1e-6;

  resEl.innerHTML = `
    <div style="font-size: 1.05rem; line-height: 1.6;">
      <p>• <strong>Tích vô hướng:</strong> $\\overrightarrow{u} \\cdot \\overrightarrow{v} = (${ux})(${vx}) + (${uy})(${vy}) + (${uz})(${vz}) = ${dot.toFixed(2)}$</p>
      <p>• <strong>Độ dài:</strong> $|\\overrightarrow{u}| \\approx ${lenU.toFixed(2)}$, $|\\overrightarrow{v}| \\approx ${lenV.toFixed(2)}$</p>
      <p>• <strong>Cosin góc giữa 2 đường thẳng:</strong> $\\cos(a, b) = \\frac{|\\overrightarrow{u} \\cdot \\overrightarrow{v}|}{|\\overrightarrow{u}| \\cdot |\\overrightarrow{v}|} \\approx ${cosTheta.toFixed(4)}$</p>
      <p style="font-size: 1.25rem; font-weight: bold; margin-top: 10px; color: ${isOrtho ? 'var(--emerald)' : 'var(--cyan)'};">
        ${isOrtho ? '✨ KẾT LUẬN: HAI ĐƯỜNG THẲNG VUÔNG GÓC VỚI NHAU ($a \\perp b$, góc $= 90^\\circ$)' : `Góc giữa hai đường thẳng: $(a, b) \\approx ${angleDeg.toFixed(1)}^\\circ$`}
      </p>
    </div>
  `;

  renderMathInTree(resEl);
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
        drawCube();
        calculateVectors();
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
