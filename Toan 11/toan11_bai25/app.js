// app.js - Bài 25: Hai mặt phẳng vuông góc (Toán 11 - Kết Nối Tri Thức)

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Không Gian',
  userTitle: 'Bậc Thầy Góc Nhị Diện 3D',
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
    title: "Số đo góc giữa hai mặt phẳng",
    pts: 20,
    question: "Số đo góc $\\varphi$ giữa hai mặt phẳng $(P)$ và $(Q)$ luôn thoả mãn điều kiện nào sau đây?",
    options: [
      { text: "$0^\\circ \\le \\varphi \\le 180^\\circ$", correct: false },
      { text: "$0^\\circ \\le \\varphi \\le 90^\\circ$", correct: true },
      { text: "$0^\\circ < \\varphi < 90^\\circ$", correct: false },
      { text: "$0^\\circ < \\varphi \\le 180^\\circ$", correct: false }
    ],
    explanation: "Định nghĩa SGK: Góc giữa hai mặt phẳng luôn có số đo nằm trong đoạn $[0^\\circ; 90^\\circ]$."
  },
  {
    id: 2,
    title: "Số đo của góc nhị diện",
    pts: 20,
    question: "Số đo của một góc nhị diện $[P, a, Q]$ có giá trị nằm trong khoảng/đoạn nào sau đây?",
    options: [
      { text: "$[0^\\circ; 90^\\circ]$", correct: false },
      { text: "$[0^\\circ; 180^\\circ]$", correct: true },
      { text: "$(0^\\circ; 90^\\circ)$", correct: false },
      { text: "$[0^\\circ; 360^\\circ]$", correct: false }
    ],
    explanation: "Số đo của góc nhị diện là số đo của góc phẳng nhị diện tương ứng, có thể là góc nhọn, góc vuông hoặc góc tù, do đó nằm trong $[0^\\circ; 180^\\circ]$."
  },
  {
    id: 3,
    title: "Điều kiện để hai mặt phẳng vuông góc",
    pts: 20,
    question: "Điều kiện cần và đủ để hai mặt phẳng $(P)$ và $(Q)$ vuông góc với nhau là:",
    options: [
      { text: "Mặt phẳng $(P)$ chứa một đường thẳng vuông góc với mặt phẳng $(Q)$.", correct: true },
      { text: "Mọi đường thẳng trong $(P)$ đều vuông góc với $(Q)$.", correct: false },
      { text: "Mặt phẳng $(P)$ song song với một đường thẳng vuông góc với $(Q)$.", correct: false },
      { text: "Hai mặt phẳng $(P)$ và $(Q)$ cắt nhau.", correct: false }
    ],
    explanation: "Định lí SGK: Nếu một mặt phẳng chứa một đường thẳng vuông góc với mặt phẳng kia thì hai mặt phẳng đó vuông góc với nhau."
  },
  {
    id: 4,
    title: "Tính chất giao tuyến của hai mặt phẳng vuông góc",
    pts: 20,
    question: "Cho $(P) \\perp (Q)$ và $d = (P) \\cap (Q)$. Nếu đường thẳng $a \\subset (P)$ và $a \\perp d$ thì:",
    options: [
      { text: "$a // (Q)$", correct: false },
      { text: "$a \\subset (Q)$", correct: false },
      { text: "$a \\perp (Q)$", correct: true },
      { text: "$a$ tạo với $(Q)$ một góc $45^\\circ$", correct: false }
    ],
    explanation: "Tính chất SGK: Nếu hai mặt phẳng vuông góc với nhau thì bất cứ đường thẳng nào nằm trong mặt này và vuông góc với giao tuyến thì cũng vuông góc với mặt kia."
  },
  {
    id: 5,
    title: "Giao tuyến của hai mặt phẳng cùng vuông góc mặt thứ ba",
    pts: 20,
    question: "Cho hai mặt phẳng cắt nhau $(P)$ và $(Q)$ cùng vuông góc với mặt phẳng $(R)$. Giao tuyến $d = (P) \\cap (Q)$ sẽ:",
    options: [
      { text: "Song song với $(R)$", correct: false },
      { text: "Vuông góc với $(R)$", correct: true },
      { text: "Nằm trong $(R)$", correct: false },
      { text: "Tạo với $(R)$ góc $45^\\circ$", correct: false }
    ],
    explanation: "Định lí SGK: Nếu hai mặt phẳng cắt nhau và cùng vuông góc với một mặt phẳng thứ ba thì giao tuyến của chúng vuông góc với mặt phẳng thứ ba đó."
  },
  {
    id: 6,
    title: "Hình chóp $S.ABC$ có cạnh bên vuông góc đáy",
    pts: 20,
    question: "Cho hình chóp $S.ABC$ có $SA \\perp (ABC)$. Khẳng định nào sau đây là <strong>đúng</strong>?",
    options: [
      { text: "$(SAB) \\perp (SBC)$", correct: false },
      { text: "$(SAB) \\perp (ABC)$", correct: true },
      { text: "$(SBC) \\perp (ABC)$", correct: false },
      { text: "$(ABC) \\perp (SAC)$ và $(SAB) // (SAC)$", correct: false }
    ],
    explanation: "Vì $SA \\perp (ABC)$ và $SA \\subset (SAB)$ nên $(SAB) \\perp (ABC)$ (và tương tự $(SAC) \\perp (ABC)$)."
  },
  {
    id: 7,
    title: "Mặt phẳng vuông góc trong hình chóp chữ nhật (SGK 7.16)",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình chữ nhật, $SA \\perp (ABCD)$. Mặt phẳng nào sau đây vuông góc với mặt phẳng $(SAB)$?",
    options: [
      { text: "Mặt phẳng $(SCD)$", correct: false },
      { text: "Mặt phẳng $(SBC)$", correct: true },
      { text: "Mặt phẳng $(SBD)$", correct: false },
      { text: "Mặt phẳng $(SAC)$", correct: false }
    ],
    explanation: "Vì $BC \\perp AB$ và $BC \\perp SA \\implies BC \\perp (SAB)$. Do $BC \\subset (SBC)$ nên $(SBC) \\perp (SAB)$."
  },
  {
    id: 8,
    title: "Hai mặt chéo của hình lập phương (SGK 7.17)",
    pts: 20,
    question: "Cho hình lập phương $ABCD.A'B'C'D'$. Hai mặt phẳng chéo $(ACC'A')$ và $(BDD'B')$:",
    options: [
      { text: "Song song với nhau", correct: false },
      { text: "Cắt nhau và tạo với nhau góc $45^\\circ$", correct: false },
      { text: "Vuông góc với nhau", correct: true },
      { text: "Trùng nhau", correct: false }
    ],
    explanation: "Vì đáy $ABCD$ là hình vuông nên $BD \\perp AC$. Lại có $BD \\perp AA' \\implies BD \\perp (ACC'A')$. Vì $BD \\subset (BDD'B')$ nên $(BDD'B') \\perp (ACC'A')$."
  },
  {
    id: 9,
    title: "Đặc điểm của hình chóp đều",
    pts: 20,
    question: "Khẳng định nào sau đây là <strong>sai</strong> đối với một hình chóp đều?",
    options: [
      { text: "Đáy là đa giác đều.", correct: false },
      { text: "Các cạnh bên bằng nhau.", correct: false },
      { text: "Chân đường cao trùng với tâm đường tròn ngoại tiếp đáy.", correct: false },
      { text: "Tất cả các mặt bên là tam giác vuông.", correct: true }
    ],
    explanation: "Trong hình chóp đều, tất cả các mặt bên là các tam giác cân bằng nhau (chứ không nhất thiết phải là tam giác vuông)."
  },
  {
    id: 10,
    title: "Độ dốc mái nhà và góc nhị diện (SGK 7.21)",
    pts: 20,
    question: "Độ dốc của đường dốc dành cho người khuyết tật được quy định không quá $\\frac{1}{12}$. Góc nghiêng $\\alpha$ tối đa của mặt phẳng đường dốc so với mặt phẳng nằm ngang gần bằng giá trị nào?",
    options: [
      { text: "$2{,}50^\\circ$", correct: false },
      { text: "$4{,}76^\\circ$", correct: true },
      { text: "$7{,}20^\\circ$", correct: false },
      { text: "$8{,}33^\\circ$", correct: false }
    ],
    explanation: "Độ dốc là tang của góc nghiêng: $\\tan\\alpha \\le \\frac{1}{12} \\approx 0{,}0833 \\implies \\alpha \\le \\arctan(0{,}0833) \\approx 4{,}76^\\circ$."
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

// Lab 1: Mô Phỏng Góc Nhị Diện
let dihAngle = 90;

function initLab1() {
  const canvas = document.getElementById('dihCanvas');
  const slider = document.getElementById('dihRange');
  const display = document.getElementById('dihVal');

  if (!canvas) return;

  if (slider) {
    slider.addEventListener('input', (e) => {
      dihAngle = parseFloat(e.target.value);
      if (display) display.textContent = `${dihAngle}°`;
      drawDihedral();
      unlockBadge(1);
    });
  }

  const p90 = document.getElementById('btnPresetDih90');
  const p60 = document.getElementById('btnPresetDih60');
  const p120 = document.getElementById('btnPresetDih120');

  if (p90) p90.addEventListener('click', () => setDih(90));
  if (p60) p60.addEventListener('click', () => setDih(60));
  if (p120) p120.addEventListener('click', () => setDih(120));

  function setDih(val) {
    dihAngle = val;
    if (slider) slider.value = val;
    if (display) display.textContent = `${val}°`;
    playClick();
    drawDihedral();
    unlockBadge(1);
  }

  drawDihedral();
}

function drawDihedral() {
  const canvas = document.getElementById('dihCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 + 50;

  // Bờ giao tuyến a nằm theo phương trục Z phối cảnh
  const O = { x: cx - 40, y: cy + 10 };
  const a_start = { x: O.x - 120, y: O.y + 40 };
  const a_end = { x: O.x + 120, y: O.y - 40 };

  // Nửa mặt phẳng thứ nhất (P) cố định nằm ngang sang trái
  const P_corner1 = { x: a_start.x - 100, y: a_start.y - 15 };
  const P_corner2 = { x: a_end.x - 100, y: a_end.y - 15 };

  // Vẽ nửa mặt phẳng (P)
  ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(a_start.x, a_start.y);
  ctx.lineTo(a_end.x, a_end.y);
  ctx.lineTo(P_corner2.x, P_corner2.y);
  ctx.lineTo(P_corner1.x, P_corner1.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Nửa mặt phẳng thứ hai (Q) quay một góc dihAngle quanh bờ a
  const rad = (dihAngle * Math.PI) / 180;
  const armLen = 130;
  const Q_vx = armLen * Math.cos(rad);
  const Q_vy = -armLen * Math.sin(rad);

  const Q_corner1 = { x: a_start.x + Q_vx, y: a_start.y + Q_vy };
  const Q_corner2 = { x: a_end.x + Q_vx, y: a_end.y + Q_vy };

  // Vẽ nửa mặt phẳng (Q)
  ctx.fillStyle = dihAngle === 90 ? 'rgba(16, 185, 129, 0.35)' : 'rgba(245, 158, 11, 0.25)';
  ctx.strokeStyle = dihAngle === 90 ? '#10b981' : '#f59e0b';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(a_start.x, a_start.y);
  ctx.lineTo(a_end.x, a_end.y);
  ctx.lineTo(Q_corner2.x, Q_corner2.y);
  ctx.lineTo(Q_corner1.x, Q_corner1.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Bờ giao tuyến a
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.moveTo(a_start.x, a_start.y);
  ctx.lineTo(a_end.x, a_end.y);
  ctx.stroke();

  // Hai tia vuông góc Ox ⊥ a và Oy ⊥ a từ điểm O
  const Ox = { x: O.x - 90, y: O.y - 12 };
  const Oy = { x: O.x + Q_vx * 0.7, y: O.y + Q_vy * 0.7 };

  // Tia Ox
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(O.x, O.y);
  ctx.lineTo(Ox.x, Ox.y);
  ctx.stroke();

  // Tia Oy
  ctx.strokeStyle = dihAngle === 90 ? '#10b981' : '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(O.x, O.y);
  ctx.lineTo(Oy.x, Oy.y);
  ctx.stroke();

  // Cung đo góc phẳng nhị diện tại O
  ctx.strokeStyle = '#fb7185';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const radX = Math.atan2(Ox.y - O.y, Ox.x - O.x);
  const radY = Math.atan2(Oy.y - O.y, Oy.x - O.x);
  ctx.arc(O.x, O.y, 35, radX, radY);
  ctx.stroke();

  // Điểm O
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(O.x, O.y, 5, 0, Math.PI * 2);
  ctx.fill();

  // Nhãn các thành phần
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('O', O.x + 8, O.y + 16);
  ctx.fillText('Bờ giao tuyến a', a_end.x + 10, a_end.y);

  ctx.fillStyle = '#06b6d4';
  ctx.fillText('Tia Ox ⊥ a', Ox.x - 40, Ox.y - 8);
  ctx.fillStyle = dihAngle === 90 ? '#10b981' : '#f59e0b';
  ctx.fillText('Tia Oy ⊥ a', Oy.x + 10, Oy.y);

  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#fb7185';
  ctx.fillText(`Góc phẳng nhị diện xOy = ${dihAngle}°`, O.x - 40, O.y - 45);

  const noteEl = document.getElementById('lab1Note');
  if (noteEl) {
    if (dihAngle === 90) {
      noteEl.innerHTML = `✨ <strong>HAI MẶT PHẲNG VUÔNG GÓC VỚI NHAU:</strong> Góc phẳng nhị diện $\\widehat{xOy} = 90^\\circ \\implies (P) \\perp (Q)$.`;
    } else {
      noteEl.innerHTML = `Góc nhị diện $[P, a, Q]$ có góc phẳng tương ứng $\\widehat{xOy} = ${dihAngle}^\\circ$. Khi xoay đến đúng $90^\\circ$, hai mặt phẳng trở nên vuông góc hoàn toàn.`;
    }
    renderMathInTree(noteEl);
  }
}

// Lab 2: Góc Nhị Diện Trong Hình Lập Phương ABCD.A'B'C'D'
let cubeSize = 100;
let showPlane = true;

function initLab2() {
  const canvas = document.getElementById('cubeDihCanvas');
  const slider = document.getElementById('cubeSizeRange');
  const display = document.getElementById('cubeSizeVal');
  const toggleBtn = document.getElementById('btnToggleFace');

  if (!canvas) return;

  if (slider) {
    slider.addEventListener('input', (e) => {
      cubeSize = parseFloat(e.target.value);
      if (display) display.textContent = cubeSize;
      drawCubeDih();
      updateLab2Note();
      unlockBadge(2);
    });
  }

  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      showPlane = !showPlane;
      playClick();
      drawCubeDih();
      unlockBadge(2);
    });
  }

  drawCubeDih();
  updateLab2Note();
}

function updateLab2Note() {
  const el = document.getElementById('lab2Note');
  if (!el) return;

  const oc = (cubeSize * Math.SQRT2) / 2;
  const cc1 = cubeSize;
  const tanVal = cc1 / oc; // sqrt(2) ≈ 1.4142
  const deg = (Math.atan(tanVal) * 180) / Math.PI;

  el.innerHTML = `
    <strong>Góc phẳng nhị diện $[C, BD, C']$ trong hình lập phương:</strong><br>
    • Cạnh nhị diện là $BD$. Với $O$ là tâm hình vuông đáy $ABCD$, ta có $OC \\perp BD$ và $OC' \\perp BD$.<br>
    • Do đó góc phẳng nhị diện là $\\widehat{COC'}$.<br>
    • Xét tam giác vuông $\\Delta OCC'$ vuông tại $C$: $OC = \\frac{a\\sqrt{2}}{2}$, $CC' = a$.<br>
    • $\\tan\\widehat{COC'} = \\frac{CC'}{OC} = \\frac{a}{\\frac{a\\sqrt{2}}{2}} = \\sqrt{2} \\approx 1{,}4142 \\implies \\mathbf{\\widehat{COC'} \\approx ${deg.toFixed(1)}^\\circ}$.
  `;
  renderMathInTree(el);
}

function drawCubeDih() {
  const canvas = document.getElementById('cubeDihCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2 + 50;
  const s = cubeSize;

  // 8 đỉnh lập phương chiếu isometric
  const A = { x: cx - s * 1.2, y: cy + s * 0.1 };
  const B = { x: cx - s * 0.1, y: cy + s * 0.5 };
  const C = { x: cx + s * 1.2, y: cy + s * 0.1 };
  const D = { x: cx + s * 0.1, y: cy - s * 0.3 };

  const A1 = { x: A.x, y: A.y - s * 1.3 };
  const B1 = { x: B.x, y: B.y - s * 1.3 };
  const C1 = { x: C.x, y: C.y - s * 1.3 };
  const D1 = { x: D.x, y: D.y - s * 1.3 };

  const O = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };

  // Mặt phẳng (BDC') tô màu nếu bật
  if (showPlane) {
    ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.beginPath();
    ctx.moveTo(B.x, B.y);
    ctx.lineTo(D.x, D.y);
    ctx.lineTo(C1.x, C1.y);
    ctx.closePath();
    ctx.fill();
  }

  // Khung nét đứt (khuất): AD, CD, DD', BD, AC, OC'
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y); ctx.lineTo(D.x, D.y);
  ctx.moveTo(C.x, C.y); ctx.lineTo(D.x, D.y);
  ctx.moveTo(D.x, D.y); ctx.lineTo(D1.x, D1.y);
  ctx.moveTo(B.x, B.y); ctx.lineTo(D.x, D.y); // BD
  ctx.moveTo(A.x, A.y); ctx.lineTo(C.x, C.y); // AC
  ctx.moveTo(O.x, O.y); ctx.lineTo(C1.x, C1.y); // OC'
  ctx.stroke();
  ctx.restore();

  // Khung thấy rõ: AB, BC, A1B1, B1C1, C1D1, D1A1, AA', BB', CC'
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
  ctx.lineTo(C.x, C.y);
  ctx.moveTo(A1.x, A1.y); ctx.lineTo(B1.x, B1.y);
  ctx.lineTo(C1.x, C1.y); ctx.lineTo(D1.x, D1.y);
  ctx.lineTo(A1.x, A1.y);
  ctx.moveTo(A.x, A.y); ctx.lineTo(A1.x, A1.y);
  ctx.moveTo(B.x, B.y); ctx.lineTo(B1.x, B1.y);
  ctx.moveTo(C.x, C.y); ctx.lineTo(C1.x, C1.y);
  ctx.stroke();

  // Cạnh nhị diện BD (màu tím sáng)
  ctx.strokeStyle = '#a855f7';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(B.x, B.y); ctx.lineTo(D.x, D.y);
  ctx.stroke();

  // Đoạn OC ⊥ BD
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(O.x, O.y); ctx.lineTo(C.x, C.y);
  ctx.stroke();

  // Đoạn OC' ⊥ BD
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(O.x, O.y); ctx.lineTo(C1.x, C1.y);
  ctx.stroke();

  // CC' đường cao tam giác vuông OCC'
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(C.x, C.y); ctx.lineTo(C1.x, C1.y);
  ctx.stroke();

  // Cung góc nhị diện tại O
  ctx.strokeStyle = '#fb7185';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  const radOC = Math.atan2(C.y - O.y, C.x - O.x);
  const radOC1 = Math.atan2(C1.y - O.y, C1.x - O.x);
  ctx.arc(O.x, O.y, 25, radOC1, radOC);
  ctx.stroke();

  // Nhãn các đỉnh
  ctx.font = 'bold 15px sans-serif';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('A', A.x - 18, A.y + 5);
  ctx.fillText('B', B.x + 5, B.y + 16);
  ctx.fillText('C', C.x + 8, C.y + 5);
  ctx.fillText('D', D.x + 5, D.y - 8);
  ctx.fillText("C'", C1.x + 8, C1.y - 5);
  ctx.fillText('O', O.x - 8, O.y - 8);

  ctx.font = '14px sans-serif';
  ctx.fillStyle = '#a855f7';
  ctx.fillText('— Cạnh nhị diện: BD', 20, 30);
  ctx.fillStyle = '#06b6d4';
  ctx.fillText('— Đoạn vuông góc: OC ⊥ BD', 20, 52);
  ctx.fillStyle = '#f59e0b';
  ctx.fillText("— Đoạn vuông góc: OC' ⊥ BD", 20, 74);
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
        drawDihedral();
        drawCubeDih();
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
