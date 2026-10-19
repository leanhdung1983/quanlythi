// ==========================================
// TOÁN 12 - BÀI 7: HỆ TOẠ ĐỘ TRONG KHÔNG GIAN
// KẾT NỐI TRI THỨC VỚI CUỘC SỐNG
// ==========================================

// Web Audio API Sound System
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type, duration, gainVal = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
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
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }
  playClick() {
    this.playTone(600, 'sine', 0.08, 0.05);
  }
  playCorrect() {
    this.playTone(523.25, 'sine', 0.12, 0.1);
    setTimeout(() => this.playTone(659.25, 'sine', 0.15, 0.1), 100);
    setTimeout(() => this.playTone(783.99, 'sine', 0.25, 0.12), 220);
  }
  playWrong() {
    this.playTone(330, 'sawtooth', 0.15, 0.08);
    setTimeout(() => this.playTone(220, 'sawtooth', 0.25, 0.08), 120);
  }
  playLevelUp() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.2, 0.1), idx * 100);
    });
  }
  playFanfare() {
    const notes = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5];
    const delays = [0, 120, 240, 360, 480, 650];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.35, 0.12), delays[idx]);
    });
  }
}

const sounds = new SoundSystem();

// KaTeX & MathML Fallback Parser
function renderMathInTree(root = document.body) {
  if (typeof renderMathInElement === 'function') {
    try {
      renderMathInElement(root, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {
      console.warn('KaTeX error:', e);
    }
  }
  fallbackRenderMathML(root);
}

function fallbackRenderMathML(root) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.parentElement && (node.parentElement.tagName === 'SCRIPT' || node.parentElement.tagName === 'STYLE' || node.parentElement.closest('math'))) {
      continue;
    }
    if (node.nodeValue.includes('$')) {
      textNodes.push(node);
    }
  }

  textNodes.forEach(tNode => {
    const parent = tNode.parentNode;
    if (!parent) return;
    const text = tNode.nodeValue;
    const parts = text.split(/(\$\$[\s\S]+?\$\$|\$[\s\S]+?\$)/g);
    if (parts.length <= 1) return;

    const frag = document.createDocumentFragment();
    parts.forEach(part => {
      if (part.startsWith('$$') && part.endsWith('$$')) {
        const mathCode = part.slice(2, -2).trim();
        const span = document.createElement('span');
        span.className = 'math-block';
        span.innerHTML = latexToMathML(mathCode, true);
        frag.appendChild(span);
      } else if (part.startsWith('$') && part.endsWith('$')) {
        const mathCode = part.slice(1, -1).trim();
        const span = document.createElement('span');
        span.className = 'math-inline';
        span.innerHTML = latexToMathML(mathCode, false);
        frag.appendChild(span);
      } else if (part.length > 0) {
        frag.appendChild(document.createTextNode(part));
      }
    });
    parent.replaceChild(frag, tNode);
  });
}

function latexToMathML(latex, isBlock = false) {
  let s = latex.trim();
  s = s.replace(/\\overrightarrow\{([^}]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#8594;</mo></mover>');
  s = s.replace(/\\vec\{([^}]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#8594;</mo></mover>');
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  s = s.replace(/\\cdot/g, '<mo>&sdot;</mo>');
  s = s.replace(/\\pm/g, '<mo>&plusmn;</mo>');
  s = s.replace(/\\iff/g, '<mo>&hArr;</mo>');
  s = s.replace(/\\le/g, '<mo>&le;</mo>');
  s = s.replace(/\\ge/g, '<mo>&ge;</mo>');
  s = s.replace(/\\ne/g, '<mo>&ne;</mo>');
  s = s.replace(/\\perp/g, '<mo>&perp;</mo>');
  s = s.replace(/([A-Za-z0-9]+)\^\{([^}]+)\}/g, '<msup><mi>$1</mi><mrow>$2</mrow></msup>');
  s = s.replace(/([A-Za-z0-9]+)\_\{([^}]+)\}/g, '<msub><mi>$1</mi><mrow>$2</mrow></msub>');
  return `<math ${isBlock ? 'display="block"' : ''}>${s}</math>`;
}

// App State Management
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Toạ Độ',
  userTitle: 'Chuyên Gia Không Gian Oxyz',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// 10 SGK Arena Questions for Bài 7
const quizData = [
  {
    id: 1,
    title: "Câu 1 (Hệ trục toạ độ Oxyz & Vectơ đơn vị)",
    pts: 20,
    question: "Trong không gian $Oxyz$ với các vectơ đơn vị $\\vec{i}, \\vec{j}, \\vec{k}$ lần lượt trên ba trục $Ox, Oy, Oz$. Khẳng định nào sau đây là **sai**?",
    options: [
      { text: "A. $|\\vec{i}| = |\\vec{j}| = |\\vec{k}| = 1$", correct: false },
      { text: "B. $\\vec{i} \\cdot \\vec{j} = \\vec{j} \\cdot \\vec{k} = \\vec{k} \\cdot \\vec{i} = 0$", correct: false },
      { text: "C. $\\vec{i}^2 = \\vec{j}^2 = \\vec{k}^2 = 1$", correct: false },
      { text: "D. $\\vec{i} + \\vec{j} + \\vec{k} = \\vec{0}$", correct: true }
    ],
    explanation: "Ba vectơ $\\vec{i}, \\vec{j}, \\vec{k}$ là ba vectơ đơn vị có phương vuông góc đôi một, do đó tổng $\\vec{i} + \\vec{j} + \\vec{k}$ là một vectơ có độ dài bằng $\\sqrt{1^2 + 1^2 + 1^2} = \\sqrt{3} \\ne 0$. Khẳng định D nói tổng bằng $\\vec{0}$ là sai."
  },
  {
    id: 2,
    title: "Câu 2 (Toạ độ của một điểm qua vectơ OM)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho điểm $M$ thoả mãn $\\overrightarrow{OM} = 2\\vec{i} - 3\\vec{j} + 5\\vec{k}$. Toạ độ của điểm $M$ là:",
    options: [
      { text: "A. $M(2; -3; 5)$", correct: true },
      { text: "B. $M(-2; 3; -5)$", correct: false },
      { text: "C. $M(2; 3; 5)$", correct: false },
      { text: "D. $M(5; -3; 2)$", correct: false }
    ],
    explanation: "Theo định nghĩa toạ độ điểm trong không gian: $M(x; y; z) \\iff \\overrightarrow{OM} = x\\vec{i} + y\\vec{j} + z\\vec{k}$. Với $\\overrightarrow{OM} = 2\\vec{i} - 3\\vec{j} + 5\\vec{k}$ thì hoành độ $x = 2$, tung độ $y = -3$, cao độ $z = 5$. Do đó $M(2; -3; 5)$."
  },
  {
    id: 3,
    title: "Câu 3 (Toạ độ vectơ khuyết thành phần)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho vectơ $\\vec{u} = -3\\vec{i} + 4\\vec{k}$. Toạ độ của vectơ $\\vec{u}$ là:",
    options: [
      { text: "A. $\\vec{u} = (-3; 4; 0)$", correct: false },
      { text: "B. $\\vec{u} = (-3; 0; 4)$", correct: true },
      { text: "C. $\\vec{u} = (0; -3; 4)$", correct: false },
      { text: "D. $\\vec{u} = (4; 0; -3)$", correct: false }
    ],
    explanation: "Ta có $\\vec{u} = -3\\vec{i} + 0\\vec{j} + 4\\vec{k}$. Do hệ số của vectơ đơn vị $\\vec{j}$ bằng $0$ nên tung độ $y = 0$. Vậy toạ độ của vectơ $\\vec{u} = (-3; 0; 4)$."
  },
  {
    id: 4,
    title: "Câu 4 (Hình chiếu vuông góc lên mặt phẳng toạ độ)",
    pts: 20,
    question: "Trong không gian $Oxyz$, hình chiếu vuông góc của điểm $M(2; -5; 3)$ lên mặt phẳng toạ độ $(Oxy)$ có toạ độ là:",
    options: [
      { text: "A. $(2; -5; 0)$", correct: true },
      { text: "B. $(0; 0; 3)$", correct: false },
      { text: "C. $(2; 0; 3)$", correct: false },
      { text: "D. $(0; -5; 3)$", correct: false }
    ],
    explanation: "Khi chiếu vuông góc một điểm lên mặt phẳng $(Oxy)$, hoành độ và tung độ được giữ nguyên, còn cao độ triệt tiêu bằng $0$. Do đó hình chiếu là điểm $M_1(2; -5; 0)$."
  },
  {
    id: 5,
    title: "Câu 5 (Hình chiếu vuông góc lên trục toạ độ)",
    pts: 20,
    question: "Trong không gian $Oxyz$, hình chiếu vuông góc của điểm $M(-3; 1; 4)$ lên trục cao $Oz$ có toạ độ là:",
    options: [
      { text: "A. $(-3; 1; 0)$", correct: false },
      { text: "B. $(0; 0; 4)$", correct: true },
      { text: "C. $(-3; 0; 0)$", correct: false },
      { text: "D. $(0; 1; 0)$", correct: false }
    ],
    explanation: "Mọi điểm nằm trên trục $Oz$ đều có hoành độ và tung độ bằng $0$. Do đó hình chiếu vuông góc của $M(-3; 1; 4)$ lên trục $Oz$ là điểm có toạ độ $(0; 0; 4)$."
  },
  {
    id: 6,
    title: "Câu 6 (Toạ độ điểm đối xứng qua mặt phẳng toạ độ)",
    pts: 20,
    question: "Trong không gian $Oxyz$, điểm đối xứng của điểm $M(1; -2; 3)$ qua mặt phẳng $(Oyz)$ có toạ độ là:",
    options: [
      { text: "A. $(-1; -2; 3)$", correct: true },
      { text: "B. $(1; 2; -3)$", correct: false },
      { text: "C. $(-1; 2; -3)$", correct: false },
      { text: "D. $(1; -2; -3)$", correct: false }
    ],
    explanation: "Quy tắc lấy đối xứng qua mặt phẳng toạ độ $(Oyz)$: giữ nguyên tung độ $y$ và cao độ $z$, đổi dấu hoành độ $x$. Điểm đối xứng với $M(1; -2; 3)$ qua $(Oyz)$ là $M'(-1; -2; 3)$."
  },
  {
    id: 7,
    title: "Câu 7 (Toạ độ trung điểm đoạn thẳng)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho hai điểm $A(1; 2; -3)$ và $B(3; -4; 1)$. Toạ độ trung điểm $I$ của đoạn thẳng $AB$ là:",
    options: [
      { text: "A. $I(2; -1; -1)$", correct: true },
      { text: "B. $I(4; -2; -2)$", correct: false },
      { text: "C. $I(2; -2; -1)$", correct: false },
      { text: "D. $I(1; -3; 2)$", correct: false }
    ],
    explanation: "Áp dụng công thức toạ độ trung điểm: $x_I = \\frac{1 + 3}{2} = 2$, $y_I = \\frac{2 + (-4)}{2} = -1$, $z_I = \\frac{-3 + 1}{2} = -1$. Vậy $I(2; -1; -1)$."
  },
  {
    id: 8,
    title: "Câu 8 (Toạ độ trọng tâm tam giác)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho tam giác $ABC$ có $A(1; 0; -2)$, $B(2; -3; 1)$ và $C(3; 3; 4)$. Toạ độ trọng tâm $G$ của tam giác $ABC$ là:",
    options: [
      { text: "A. $G(2; 0; 1)$", correct: true },
      { text: "B. $G(6; 0; 3)$", correct: false },
      { text: "C. $G(3; 0; 1)$", correct: false },
      { text: "D. $G(2; 1; 1)$", correct: false }
    ],
    explanation: "Áp dụng công thức toạ độ trọng tâm tam giác: $x_G = \\frac{1 + 2 + 3}{3} = 2$; $y_G = \\frac{0 + (-3) + 3}{3} = 0$; $z_G = \\frac{-2 + 1 + 4}{3} = 1$. Vậy $G(2; 0; 1)$."
  },
  {
    id: 9,
    title: "Câu 9 (Tìm đỉnh tam giác khi biết trọng tâm)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho tam giác $ABC$ có $A(-1; 2; 3)$, $B(1; 4; -1)$ và trọng tâm là $G(2; 1; 0)$. Toạ độ của đỉnh $C$ là:",
    options: [
      { text: "A. $C(6; -3; -2)$", correct: true },
      { text: "B. $C(2; 3; 2)$", correct: false },
      { text: "C. $C(4; -3; 2)$", correct: false },
      { text: "D. $C(6; 3; -2)$", correct: false }
    ],
    explanation: "Từ hệ thức trọng tâm tam giác $3G = A + B + C \\Rightarrow C = 3G - A - B$. Ta tính từng toạ độ: $x_C = 3(2) - (-1) - 1 = 6$; $y_C = 3(1) - 2 - 4 = -3$; $z_C = 3(0) - 3 - (-1) = -2$. Vậy toạ độ đỉnh $C(6; -3; -2)$."
  },
  {
    id: 10,
    title: "Câu 10 (Toạ độ trọng tâm tứ diện)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho tứ diện $ABCD$ có $A(1; 0; 0)$, $B(0; 2; 0)$, $C(0; 0; 3)$ và $D(3; 2; 1)$. Toạ độ trọng tâm $G$ của tứ diện $ABCD$ là:",
    options: [
      { text: "A. $G(1; 1; 1)$", correct: true },
      { text: "B. $G(4; 4; 4)$", correct: false },
      { text: "C. $G\\left(\\frac{4}{3}; \\frac{4}{3}; \\frac{4}{3}\\right)$", correct: false },
      { text: "D. $G(2; 2; 2)$", correct: false }
    ],
    explanation: "Áp dụng công thức toạ độ trọng tâm tứ diện 4 đỉnh: $x_G = \\frac{1 + 0 + 0 + 3}{4} = 1$; $y_G = \\frac{0 + 2 + 0 + 2}{4} = 1$; $z_G = \\frac{0 + 0 + 3 + 1}{4} = 1$. Vậy $G(1; 1; 1)$."
  }
];

// Initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  renderMathInTree(document.body);
  initHUD();
  initTabs();
  initLab1();
  initLab2();
  initArena();
  initCertAndModal();
});

function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const sections = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sounds.playClick();
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      tab.classList.add('active');
      const target = document.getElementById('tab-' + tab.dataset.tab);
      if (target) {
        target.classList.add('active');
        renderMathInTree(target);
      }

      if (tab.dataset.tab === 'theory' && !appState.badges[0]) {
        unlockBadge(0);
      }
    });
  });
}

function initHUD() {
  const soundToggle = document.getElementById('soundToggle');
  const resetBtn = document.getElementById('resetProgress');

  soundToggle.addEventListener('click', () => {
    appState.sound = !appState.sound;
    sounds.enabled = appState.sound;
    soundToggle.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
  });

  resetBtn.addEventListener('click', () => {
    if (confirm('Làm mới lại tiến trình học tập bài 7?')) {
      appState.xp = 0;
      appState.streak = 0;
      appState.stars = 2;
      appState.answered = {};
      appState.badges = [false, false, false, false, false];
      updateHUD();
      initArena();
      for (let i = 1; i <= 5; i++) {
        const b = document.getElementById('badge-' + i);
        if (b) b.classList.remove('unlocked');
      }
      sounds.playTone(300, 'sine', 0.2);
    }
  });

  updateHUD();
}

function updateHUD() {
  document.getElementById('xpDisplay').textContent = appState.xp;
  document.getElementById('streakDisplay').textContent = '🔥 ' + appState.streak;
  document.getElementById('arenaScore').textContent = appState.xp + ' XP';

  let starStr = '';
  for (let i = 1; i <= 5; i++) starStr += i <= appState.stars ? '⭐' : '☆';
  document.getElementById('starRating').textContent = starStr;

  const certXP = document.getElementById('certXP');
  if (certXP) certXP.textContent = appState.xp + ' XP';
  const certRank = document.getElementById('certRank');
  if (certRank) {
    if (appState.xp >= 180) certRank.textContent = 'Xuất Sắc 🏆';
    else if (appState.xp >= 140) certRank.textContent = 'Giỏi 🌟';
    else certRank.textContent = 'Đạt Yêu Cầu 👍';
  }
}

function addXP(amount) {
  appState.xp += amount;
  if (appState.xp >= 100 && appState.stars < 3) {
    appState.stars = 3;
    sounds.playLevelUp();
  }
  if (appState.xp >= 160 && appState.stars < 4) {
    appState.stars = 4;
    sounds.playLevelUp();
  }
  if (appState.xp >= 200 && appState.stars < 5) {
    appState.stars = 5;
    sounds.playFanfare();
  }
  updateHUD();
}

function unlockBadge(index) {
  if (appState.badges[index]) return;
  appState.badges[index] = true;
  const badgeCard = document.getElementById('badge-' + (index + 1));
  if (badgeCard) badgeCard.classList.add('unlocked');
  sounds.playLevelUp();
}

// ==========================================
// LAB 1: MÁY ĐỊNH VỊ TOẠ ĐỘ ĐIỂM 3D Oxyz
// ==========================================
function initLab1() {
  const canvas = document.getElementById('pointCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const xSlider = document.getElementById('coordX');
  const ySlider = document.getElementById('coordY');
  const zSlider = document.getElementById('coordZ');
  const rotSlider = document.getElementById('camRot');

  const valX = document.getElementById('valX');
  const valY = document.getElementById('valY');
  const valZ = document.getElementById('valZ');
  const valRot = document.getElementById('valRot');
  const outPoint = document.getElementById('pointOutput');

  function drawPoint3D() {
    const x = parseFloat(xSlider.value);
    const y = parseFloat(ySlider.value);
    const z = parseFloat(zSlider.value);
    const rot = (parseFloat(rotSlider.value) * Math.PI) / 180;

    valX.textContent = x;
    valY.textContent = y;
    valZ.textContent = z;
    valRot.textContent = rotSlider.value + '°';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ox = canvas.width / 2 - 20;
    const oy = canvas.height / 2 + 50;
    const scale = 28;

    // Coordinate Axes Projection
    // Ox: receding down-left
    const vx = { x: -Math.cos(rot + Math.PI / 6) * scale * 0.9, y: Math.sin(rot + Math.PI / 6) * scale * 0.5 };
    // Oy: going right-down
    const vy = { x: Math.cos(rot) * scale, y: Math.sin(rot) * 0.35 * scale };
    // Oz: vertical upwards
    const vz = { x: 0, y: -scale * 1.1 };

    function project(px, py, pz) {
      return {
        x: ox + px * vx.x + py * vy.x + pz * vz.x,
        y: oy + px * vx.y + py * vy.y + pz * vz.y
      };
    }

    // Draw coordinate axes
    const axisLen = 6;
    const O = { x: ox, y: oy };
    const endX = project(axisLen, 0, 0);
    const endY = project(0, axisLen, 0);
    const endZ = project(0, 0, axisLen);

    const negX = project(-axisLen * 0.7, 0, 0);
    const negY = project(0, -axisLen * 0.7, 0);
    const negZ = project(0, 0, -axisLen * 0.7);

    // Negative axes dashed
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.3)';
    ctx.lineWidth = 1;
    drawLine(O, negX);
    drawLine(O, negY);
    drawLine(O, negZ);
    ctx.setLineDash([]);

    // Positive axes solid
    drawAxis(O, endX, '#f43f5e', 'Ox (Hoành)');
    drawAxis(O, endY, '#10b981', 'Oy (Tung)');
    drawAxis(O, endZ, '#06b6d4', 'Oz (Cao)');

    // Unit vectors i, j, k
    const uI = project(1, 0, 0);
    const uJ = project(0, 1, 0);
    const uK = project(0, 0, 1);
    drawVector(O, uI, '#f43f5e', 'i', 3);
    drawVector(O, uJ, '#10b981', 'j', 3);
    drawVector(O, uK, '#06b6d4', 'k', 3);

    // Point M and projections
    const M = project(x, y, z);
    const M_xy = project(x, y, 0);
    const M_x = project(x, 0, 0);
    const M_y = project(0, y, 0);
    const M_z = project(0, 0, z);

    // Draw projection box dashed
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1.5;

    drawLine(M_x, M_xy);
    drawLine(M_y, M_xy);
    drawLine(M_xy, M);
    drawLine(M_z, project(0, y, z));
    drawLine(M, project(0, y, z));
    ctx.setLineDash([]);

    // Vector OM
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    drawVector(O, M, '#fbbf24', `M(${x}; ${y}; ${z})`, 3.5);
    ctx.shadowBlur = 0;

    // Projection points dots
    drawDot(M_xy, `M_xy(${x}; ${y}; 0)`, '#10b981');
    drawDot(M_z, `M_z(0; 0; ${z})`, '#06b6d4');
    drawDot(M, `M`, '#fbbf24', 6);
    drawDot(O, 'O(0;0;0)', '#ffffff', 4);

    function drawLine(p1, p2) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    function drawDot(p, label, col, r = 4) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(label, p.x + 8, p.y - 4);
    }

    function drawAxis(p1, p2, col, label) {
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      ctx.fillStyle = col;
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(label, p2.x + 8, p2.y);
    }

    function drawVector(p1, p2, col, label, width = 2) {
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const headLen = 10;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();
    }

    const distO = Math.sqrt(x * x + y * y + z * z);
    outPoint.innerHTML = `
      <strong>🌐 Toạ độ điểm và hình chiếu trong không gian:</strong><br>
      • Điểm: $M(${x}; ${y}; ${z}) \\iff \\overrightarrow{OM} = ${x}\\vec{i} + ${y}\\vec{j} + ${z}\\vec{k}$<br>
      • Khoảng cách từ gốc $O$ đến $M$: $OM = |\\overrightarrow{OM}| = \\sqrt{${x}^2 + ${y}^2 + ${z}^2} \\approx \\mathbf{${distO.toFixed(2)}}$<br>
      • Hình chiếu lên mặt phẳng $(Oxy)$: $M_1(${x}; ${y}; 0)$; Lên trục $Oz$: $M_3(0; 0; ${z})$<br>
      • Điểm đối xứng qua $(Oxy)$: $M'(${x}; ${y}; ${-z})$.
    `;
    renderMathInTree(outPoint);

    if (!appState.badges[1]) unlockBadge(1);
  }

  [xSlider, ySlider, zSlider, rotSlider].forEach(s => s.addEventListener('input', drawPoint3D));
  drawPoint3D();
}

// ==========================================
// LAB 2: MÔ PHỎNG TRỌNG TÂM TỨ DIỆN 3D
// ==========================================
function initLab2() {
  const canvas = document.getElementById('tetraCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const axSlider = document.getElementById('vertexAx');
  const aySlider = document.getElementById('vertexAy');
  const azSlider = document.getElementById('vertexAz');

  const valAx = document.getElementById('valAx');
  const valAy = document.getElementById('valAy');
  const valAz = document.getElementById('valAz');
  const outTetra = document.getElementById('tetraOutput');

  function drawTetra() {
    const ax = parseFloat(axSlider.value);
    const ay = parseFloat(aySlider.value);
    const az = parseFloat(azSlider.value);

    valAx.textContent = ax;
    valAy.textContent = ay;
    valAz.textContent = az;

    // Fixed base B, C, D
    const B = { x: -3, y: 0, z: 0 };
    const C = { x: 3, y: -2, z: 0 };
    const D = { x: 1, y: 4, z: 0 };
    const A = { x: ax, y: ay, z: az };

    // Centroid G of tetrahedron ABCD
    const G = {
      x: (A.x + B.x + C.x + D.x) / 4,
      y: (A.y + B.y + C.y + D.y) / 4,
      z: (A.z + B.z + C.z + D.z) / 4
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ox = canvas.width / 2;
    const oy = canvas.height / 2 + 50;
    const scale = 25;

    function project(p) {
      // Isometric view
      return {
        x: ox + (p.x * 0.9 - p.y * 0.8) * scale,
        y: oy + (p.x * 0.4 + p.y * 0.3 - p.z * 1.0) * scale
      };
    }

    const pA = project(A);
    const pB = project(B);
    const pC = project(C);
    const pD = project(D);
    const pG = project(G);

    // Draw base BCD
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pB.x, pB.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.lineTo(pD.x, pD.y);
    ctx.closePath();
    ctx.stroke();

    // Edges from A
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    [pB, pC, pD].forEach(p => {
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });

    // Draw lines connecting G to vertices (faint)
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    [pA, pB, pC, pD].forEach(p => {
      ctx.beginPath();
      ctx.moveTo(pG.x, pG.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Draw Dots
    drawNode(pA, `A(${ax}; ${ay}; ${az})`, '#06b6d4');
    drawNode(pB, `B(-3; 0; 0)`, '#10b981');
    drawNode(pC, `C(3; -2; 0)`, '#10b981');
    drawNode(pD, `D(1; 4; 0)`, '#10b981');

    // Glowing Centroid G
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    drawNode(pG, `G(${G.x.toFixed(2)}; ${G.y.toFixed(2)}; ${G.z.toFixed(2)})`, '#f59e0b', 7);
    ctx.shadowBlur = 0;

    function drawNode(p, label, col, r = 5) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(label, p.x + 8, p.y - 4);
    }

    outTetra.innerHTML = `
      <strong>⚖️ Kết quả toạ độ trọng tâm tứ diện $ABCD$:</strong><br>
      • Toạ độ 4 đỉnh: $A(${ax}; ${ay}; ${az})$, $B(-3; 0; 0)$, $C(3; -2; 0)$, $D(1; 4; 0)$<br>
      • Hoành độ: $x_G = \\frac{${ax} + (-3) + 3 + 1}{4} = \\mathbf{${G.x.toFixed(2)}}$<br>
      • Tung độ: $y_G = \\frac{${ay} + 0 + (-2) + 4}{4} = \\mathbf{${G.y.toFixed(2)}}$<br>
      • Cao độ: $z_G = \\frac{${az} + 0 + 0 + 0}{4} = \\mathbf{${G.z.toFixed(2)}}$<br>
      • Kết luận: $G\\left(${G.x.toFixed(2)}; ${G.y.toFixed(2)}; ${G.z.toFixed(2)}\\right)$ thoả mãn $\\overrightarrow{GA} + \\overrightarrow{GB} + \\overrightarrow{GC} + \\overrightarrow{GD} = \\vec{0}$.
    `;
    renderMathInTree(outTetra);

    if (!appState.badges[2]) unlockBadge(2);
  }

  [axSlider, aySlider, azSlider].forEach(s => s.addEventListener('input', drawTetra));
  drawTetra();
}

// ==========================================
// TAB 3: ĐẤU TRƯỜNG SGK
// ==========================================
function initArena() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  quizData.forEach((q) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard-${q.id}`;

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `<span>${q.title}</span><span class="quiz-pts">+${q.pts} XP</span>`;
    card.appendChild(header);

    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    const optGrid = document.createElement('div');
    optGrid.className = 'quiz-options-grid';

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = opt.text;
      btn.dataset.correct = opt.correct;
      btn.dataset.qid = q.id;
      btn.dataset.optIndex = optIndex;

      btn.addEventListener('click', () => handleOptionClick(btn, q, card));
      optGrid.appendChild(btn);
    });
    card.appendChild(optGrid);

    const expBox = document.createElement('div');
    expBox.className = 'explanation-box';
    expBox.id = `expBox-${q.id}`;
    expBox.innerHTML = `<strong>💡 Lời giải chi tiết:</strong><br>${q.explanation}`;
    card.appendChild(expBox);

    container.appendChild(card);
  });

  document.getElementById('arenaProgress').textContent = `0/${quizData.length}`;
  renderMathInTree(container);

  const retakeBtn = document.getElementById('btnRetake');
  if (retakeBtn) {
    retakeBtn.addEventListener('click', () => {
      appState.answered = {};
      initArena();
      document.getElementById('arenaSummary').style.display = 'none';
      sounds.playClick();
    });
  }
}

function handleOptionClick(btn, q, card) {
  if (appState.answered[q.id]) return;

  appState.answered[q.id] = true;
  const isCorrect = btn.dataset.correct === 'true';
  const optBtns = card.querySelectorAll('.quiz-opt-btn');

  optBtns.forEach(b => {
    b.disabled = true;
    if (b.dataset.correct === 'true') {
      b.classList.add('correct');
    }
  });

  if (isCorrect) {
    btn.classList.add('correct');
    sounds.playCorrect();
    appState.streak++;
    addXP(q.pts);
  } else {
    btn.classList.add('wrong');
    sounds.playWrong();
    appState.streak = 0;
  }

  const expBox = document.getElementById(`expBox-${q.id}`);
  if (expBox) {
    expBox.classList.add('show');
    renderMathInTree(expBox);
  }

  const answeredCount = Object.keys(appState.answered).length;
  document.getElementById('arenaProgress').textContent = `${answeredCount}/${quizData.length}`;

  if (appState.xp >= 160 && !appState.badges[3]) unlockBadge(3);

  if (answeredCount === quizData.length) {
    const summary = document.getElementById('arenaSummary');
    if (summary) {
      summary.style.display = 'block';
      document.getElementById('summaryText').textContent = `Bạn đã hoàn thành 10/10 câu hỏi với tổng điểm ${appState.xp} XP!`;
    }
    if (appState.xp >= 200 && !appState.badges[4]) {
      unlockBadge(4);
      sounds.playFanfare();
    }
  }
}

// Certificate and Modal
function initCertAndModal() {
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const closeBtn = document.getElementById('btnCloseAvatarModal');
  const avatarOpts = document.querySelectorAll('.avatar-opt');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      sounds.playClick();
      avatarModal.style.display = 'flex';
      avatarModal.classList.add('active');
    });
  }

  if (closeBtn && avatarModal) {
    closeBtn.addEventListener('click', () => {
      sounds.playClick();
      avatarModal.style.display = 'none';
      avatarModal.classList.remove('active');
    });
  }

  avatarOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      appState.avatar = opt.dataset.avatar;
      appState.userName = opt.dataset.name;
      document.getElementById('avatarBtn').textContent = appState.avatar;
      document.getElementById('userNameDisplay').textContent = `${appState.userName} 🌟`;
      document.getElementById('certStudentName').textContent = appState.userName;
      sounds.playClick();
      avatarModal.style.display = 'none';
      avatarModal.classList.remove('active');
    });
  });

  const btnPrint = document.getElementById('btnPrintCert');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      sounds.playClick();
      window.print();
    });
  }
}
