// ==========================================
// TOÁN 12 - BÀI 8: BIỂU THỨC TOẠ ĐỘ CỦA CÁC PHÉP TOÁN VECTƠ
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
  userName: 'Chiến Binh Đại Số Không Gian',
  userTitle: 'Bậc Thầy Biểu Thức Toạ Độ',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// 10 SGK Arena Questions for Bài 8
const quizData = [
  {
    id: 1,
    title: "Câu 1 (Tổng hai vectơ trong không gian)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho hai vectơ $\\vec{a} = (1; 2; -1)$ và $\\vec{b} = (2; 0; 3)$. Toạ độ của vectơ $\\vec{a} + \\vec{b}$ là:",
    options: [
      { text: "A. $(3; 2; 2)$", correct: true },
      { text: "B. $(3; 2; -4)$", correct: false },
      { text: "C. $(1; -2; 4)$", correct: false },
      { text: "D. $(2; 0; -3)$", correct: false }
    ],
    explanation: "Áp dụng công thức cộng toạ độ hai vectơ: $\\vec{a} + \\vec{b} = (1 + 2; 2 + 0; -1 + 3) = (3; 2; 2)$."
  },
  {
    id: 2,
    title: "Câu 2 (Nhân vectơ với một số)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho vectơ $\\vec{a} = (-2; 3; 1)$. Toạ độ của vectơ $-3\\vec{a}$ là:",
    options: [
      { text: "A. $(6; -9; -3)$", correct: true },
      { text: "B. $(-6; 9; 3)$", correct: false },
      { text: "C. $(6; 9; 3)$", correct: false },
      { text: "D. $(5; -6; -4)$", correct: false }
    ],
    explanation: "Nhân từng toạ độ của $\\vec{a}$ với $-3$: $-3\\vec{a} = (-3 \\cdot (-2); -3 \\cdot 3; -3 \\cdot 1) = (6; -9; -3)$."
  },
  {
    id: 3,
    title: "Câu 3 (Tổ hợp tuyến tính hai vectơ)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho $\\vec{a} = (1; 2; 3)$ và $\\vec{b} = (2; -1; 1)$. Toạ độ của vectơ $\\vec{u} = 2\\vec{a} - 3\\vec{b}$ là:",
    options: [
      { text: "A. $(-4; 7; 3)$", correct: true },
      { text: "B. $(4; 1; 3)$", correct: false },
      { text: "C. $(-4; 1; 9)$", correct: false },
      { text: "D. $(8; 1; 9)$", correct: false }
    ],
    explanation: "Ta có $2\\vec{a} = (2; 4; 6)$ và $3\\vec{b} = (6; -3; 3)$. Do đó $\\vec{u} = 2\\vec{a} - 3\\vec{b} = (2 - 6; 4 - (-3); 6 - 3) = (-4; 7; 3)$."
  },
  {
    id: 4,
    title: "Câu 4 (Toạ độ vectơ nối hai điểm A và B)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho hai điểm $A(1; 3; -2)$ và $B(4; 1; 2)$. Toạ độ của vectơ $\\overrightarrow{AB}$ là:",
    options: [
      { text: "A. $(3; -2; 4)$", correct: true },
      { text: "B. $(-3; 2; -4)$", correct: false },
      { text: "C. $(5; 4; 0)$", correct: false },
      { text: "D. $(4; 3; -4)$", correct: false }
    ],
    explanation: "Áp dụng công thức toạ độ điểm ngọn trừ gốc: $\\overrightarrow{AB} = (x_B - x_A; y_B - y_A; z_B - z_A) = (4 - 1; 1 - 3; 2 - (-2)) = (3; -2; 4)$."
  },
  {
    id: 5,
    title: "Câu 5 (Độ dài của một vectơ)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho vectơ $\\vec{u} = (2; -1; 2)$. Độ dài $|\vec{u}|$ bằng:",
    options: [
      { text: "A. $3$", correct: true },
      { text: "B. $9$", correct: false },
      { text: "C. $\\sqrt{5}$", correct: false },
      { text: "D. $\\sqrt{3}$", correct: false }
    ],
    explanation: "Độ dài vectơ: $|\\vec{u}| = \\sqrt{x^2 + y^2 + z^2} = \\sqrt{2^2 + (-1)^2 + 2^2} = \\sqrt{4 + 1 + 4} = \\sqrt{9} = 3$."
  },
  {
    id: 6,
    title: "Câu 6 (Khoảng cách giữa hai điểm trong không gian)",
    pts: 20,
    question: "Trong không gian $Oxyz$, khoảng cách giữa hai điểm $A(1; 2; 3)$ và $B(2; 4; 5)$ bằng:",
    options: [
      { text: "A. $3$", correct: true },
      { text: "B. $9$", correct: false },
      { text: "C. $\\sqrt{5}$", correct: false },
      { text: "D. $\\sqrt{29}$", correct: false }
    ],
    explanation: "Khoảng cách giữa hai điểm: $AB = \\sqrt{(2 - 1)^2 + (4 - 2)^2 + (5 - 3)^2} = \\sqrt{1^2 + 2^2 + 2^2} = \\sqrt{1 + 4 + 4} = 3$."
  },
  {
    id: 7,
    title: "Câu 7 (Tích vô hướng của hai vectơ)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho $\\vec{a} = (1; -2; 3)$ và $\\vec{b} = (-2; 1; 1)$. Tích vô hướng $\\vec{a} \\cdot \\vec{b}$ bằng:",
    options: [
      { text: "A. $-1$", correct: true },
      { text: "B. $3$", correct: false },
      { text: "C. $-7$", correct: false },
      { text: "D. $1$", correct: false }
    ],
    explanation: "Công thức tích vô hướng: $\\vec{a} \\cdot \\vec{b} = x_1 x_2 + y_1 y_2 + z_1 z_2 = 1 \\cdot (-2) + (-2) \\cdot 1 + 3 \\cdot 1 = -2 - 2 + 3 = -1$."
  },
  {
    id: 8,
    title: "Câu 8 (Điều kiện hai vectơ vuông góc)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho hai vectơ $\\vec{a} = (1; m; 2)$ và $\\vec{b} = (2; -1; 3)$. Hai vectơ $\\vec{a}$ và $\\vec{b}$ vuông góc với nhau khi và chỉ khi $m$ bằng:",
    options: [
      { text: "A. $8$", correct: true },
      { text: "B. $-8$", correct: false },
      { text: "C. $4$", correct: false },
      { text: "D. $-4$", correct: false }
    ],
    explanation: "Hai vectơ vuông góc $\\iff \\vec{a} \\cdot \\vec{b} = 0 \\iff 1 \\cdot 2 + m \\cdot (-1) + 2 \\cdot 3 = 0 \\iff 8 - m = 0 \\iff m = 8$."
  },
  {
    id: 9,
    title: "Câu 9 (Góc giữa hai vectơ)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho hai vectơ $\\vec{a} = (1; 0; 1)$ và $\\vec{b} = (0; 1; 1)$. Góc giữa hai vectơ $\\vec{a}$ và $\\vec{b}$ bằng:",
    options: [
      { text: "A. $60^\\circ$", correct: true },
      { text: "B. $45^\\circ$", correct: false },
      { text: "C. $90^\\circ$", correct: false },
      { text: "D. $120^\\circ$", correct: false }
    ],
    explanation: "Ta có $\\vec{a} \\cdot \\vec{b} = 1 \\cdot 0 + 0 \\cdot 1 + 1 \\cdot 1 = 1$. Độ dài: $|\\vec{a}| = \\sqrt{1^2+0^2+1^2} = \\sqrt{2}$, $|\\vec{b}| = \\sqrt{0^2+1^2+1^2} = \\sqrt{2}$. Do đó $\\cos(\\vec{a}, \\vec{b}) = \\frac{1}{\\sqrt{2} \\cdot \\sqrt{2}} = \\frac{1}{2} \\Rightarrow (\\vec{a}, \\vec{b}) = 60^\\circ$."
  },
  {
    id: 10,
    title: "Câu 10 (Toạ độ đỉnh hình bình hành)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho ba đỉnh của hình bình hành $ABCD$ là $A(1; 1; 1)$, $B(2; 3; 4)$ và $C(6; 5; 2)$. Toạ độ đỉnh $D$ là:",
    options: [
      { text: "A. $D(5; 3; -1)$", correct: true },
      { text: "B. $D(7; 7; 5)$", correct: false },
      { text: "C. $D(-3; -1; 3)$", correct: false },
      { text: "D. $D(5; 3; 1)$", correct: false }
    ],
    explanation: "Vì tứ giác $ABCD$ là hình bình hành nên $\\overrightarrow{AD} = \\overrightarrow{BC}$. Ta có $\\overrightarrow{BC} = (6 - 2; 5 - 3; 2 - 4) = (4; 2; -2)$. Từ đó suy ra $D = A + \\overrightarrow{BC} = (1 + 4; 1 + 2; 1 + (-2)) = (5; 3; -1)$."
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
    if (confirm('Làm mới lại tiến trình học tập bài 8?')) {
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
// LAB 1: MÁY TÍNH TUYẾN TÍNH VECTƠ 3D
// ==========================================
function initLab1() {
  const canvas = document.getElementById('linearCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const kSlider = document.getElementById('coeffK');
  const mSlider = document.getElementById('coeffM');
  const uxSlider = document.getElementById('uxVal');
  const vySlider = document.getElementById('vyVal');

  const valK = document.getElementById('valK');
  const valM = document.getElementById('valM');
  const valUx = document.getElementById('valUx');
  const valVy = document.getElementById('valVy');
  const outLinear = document.getElementById('linearOutput');

  function drawLinear() {
    const k = parseFloat(kSlider.value);
    const m = parseFloat(mSlider.value);
    const ux = parseFloat(uxSlider.value);
    const vy = parseFloat(vySlider.value);

    valK.textContent = k.toFixed(1);
    valM.textContent = m.toFixed(1);
    valUx.textContent = ux;
    valVy.textContent = vy;

    // Vector u and v
    const u = { x: ux, y: 1, z: 2 };
    const v = { x: 1, y: vy, z: -1 };

    // Result vector w = k*u + m*v
    const w = {
      x: k * u.x + m * v.x,
      y: k * u.y + m * v.y,
      z: k * u.z + m * v.z
    };

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ox = canvas.width / 2 - 30;
    const oy = canvas.height / 2 + 40;
    const scale = 25;

    function project(vec) {
      // Isometric projection
      return {
        x: ox + (vec.x * 0.9 - vec.y * 0.7) * scale,
        y: oy + (vec.x * 0.35 + vec.y * 0.3 - vec.z * 1.0) * scale
      };
    }

    const O = { x: ox, y: oy };
    const pU = project({ x: k * u.x, y: k * u.y, z: k * u.z });
    const pV = project({ x: m * v.x, y: m * v.y, z: m * v.z });
    const pW = project(w);

    // Parallelogram dashed lines
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(pU.x, pU.y);
    ctx.lineTo(pW.x, pW.y);
    ctx.lineTo(pV.x, pV.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw vectors
    drawVector(O, pU, '#06b6d4', `k·u (${k}u)`, 3);
    drawVector(O, pV, '#10b981', `m·v (${m}v)`, 3);

    // Vector w (gold glowing)
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    drawVector(O, pW, '#f59e0b', `w = k·u + m·v`, 3.5);
    ctx.shadowBlur = 0;

    // Dot origin
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ox, oy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('O', ox - 15, oy + 15);

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

      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(label, p2.x + 8, p2.y - 4);
    }

    outLinear.innerHTML = `
      <strong>⚡ Kết quả tính biểu thức toạ độ tổ hợp tuyến tính:</strong><br>
      • Vectơ $\\vec{u} = (${u.x}; ${u.y}; ${u.z})$ $\\Rightarrow k\\vec{u} = (${(k*u.x).toFixed(1)}; ${(k*u.y).toFixed(1)}; ${(k*u.z).toFixed(1)})$<br>
      • Vectơ $\\vec{v} = (${v.x}; ${v.y}; ${v.z})$ $\\Rightarrow m\\vec{v} = (${(m*v.x).toFixed(1)}; ${(m*v.y).toFixed(1)}; ${(m*v.z).toFixed(1)})$<br>
      • Vectơ tổng $\\vec{w} = k\\vec{u} + m\\vec{v} = \\mathbf{(${w.x.toFixed(1)}; ${w.y.toFixed(1)}; ${w.z.toFixed(1)})}$.
    `;
    renderMathInTree(outLinear);

    if (!appState.badges[1]) unlockBadge(1);
  }

  [kSlider, mSlider, uxSlider, vySlider].forEach(s => s.addEventListener('input', drawLinear));
  drawLinear();
}

// ==========================================
// LAB 2: THƯỚC ĐO KHÔNG GIAN EUCLID
// ==========================================
function initLab2() {
  const canvas = document.getElementById('metricCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const bxSlider = document.getElementById('bxSlider');
  const bySlider = document.getElementById('bySlider');
  const bzSlider = document.getElementById('bzSlider');

  const valBx = document.getElementById('valBx');
  const valBy = document.getElementById('valBy');
  const valBz = document.getElementById('valBz');
  const outMetric = document.getElementById('metricOutput');

  function drawMetric() {
    const bx = parseFloat(bxSlider.value);
    const by = parseFloat(bySlider.value);
    const bz = parseFloat(bzSlider.value);

    valBx.textContent = bx;
    valBy.textContent = by;
    valBz.textContent = bz;

    // Fixed point A(0, 0, 0) for vector AB
    const A = { x: 0, y: 0, z: 0 };
    const B = { x: bx, y: by, z: bz };

    // Reference vector u_ref along Ox (4, 0, 0)
    const u_ref = { x: 4, y: 0, z: 0 };

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ox = canvas.width / 2 - 50;
    const oy = canvas.height / 2 + 50;
    const scale = 26;

    function project(p) {
      return {
        x: ox + (p.x * 0.9 - p.y * 0.7) * scale,
        y: oy + (p.x * 0.35 + p.y * 0.3 - p.z * 1.0) * scale
      };
    }

    const pA = project(A);
    const pB = project(B);
    const pRef = project(u_ref);

    // Reference vector (Cyan)
    drawVector(pA, pRef, '#06b6d4', 'Trục chuẩn Ox', 2);

    // Vector AB (Rose)
    ctx.shadowColor = '#f43f5e';
    ctx.shadowBlur = 10;
    drawVector(pA, pB, '#f43f5e', `AB (${bx}; ${by}; ${bz})`, 3.5);
    ctx.shadowBlur = 0;

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

      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(label, p2.x + 8, p2.y - 4);
    }

    // Distance and dot product calculations
    const distAB = Math.sqrt(bx * bx + by * by + bz * bz);
    const dotVal = bx * u_ref.x + by * u_ref.y + bz * u_ref.z;
    const lenRef = 4;
    let cosTheta = 0;
    let degTheta = 0;
    if (distAB > 0.001) {
      cosTheta = dotVal / (distAB * lenRef);
      // Clamp for numerical safety
      cosTheta = Math.max(-1, Math.min(1, cosTheta));
      degTheta = (Math.acos(cosTheta) * 180) / Math.PI;
    }

    let orthText = '';
    if (Math.abs(bx) < 0.001) {
      orthText = '<span style="color: #10b981; font-weight: bold;">VUÔNG GÓC với trục Ox ($\\overrightarrow{AB} \\perp Ox$).</span>';
    } else {
      orthText = `Góc giữa $\\overrightarrow{AB}$ và trục chuẩn $Ox$ là $\\alpha \\approx \\mathbf{${degTheta.toFixed(1)}^\\circ}$.`;
    }

    outMetric.innerHTML = `
      <strong>📏 Phân tích thước đo không gian Euclid:</strong><br>
      • Toạ độ vectơ: $\\overrightarrow{AB} = (${bx}; ${by}; ${bz})$<br>
      • Khoảng cách: $AB = |\\overrightarrow{AB}| = \\sqrt{(${bx})^2 + (${by})^2 + (${bz})^2} = \\mathbf{${distAB.toFixed(2)}}$<br>
      • Tích vô hướng với vectơ chuẩn: $\\overrightarrow{AB} \\cdot \\vec{u}_{ref} = ${bx} \\cdot 4 + ${by} \\cdot 0 + ${bz} \\cdot 0 = \\mathbf{${dotVal.toFixed(1)}}$<br>
      • Tương quan góc: ${orthText}
    `;
    renderMathInTree(outMetric);

    if (!appState.badges[2]) unlockBadge(2);
  }

  [bxSlider, bySlider, bzSlider].forEach(s => s.addEventListener('input', drawMetric));
  drawMetric();
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
