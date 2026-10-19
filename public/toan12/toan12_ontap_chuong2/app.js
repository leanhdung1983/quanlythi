// ==========================================
// TOÁN 12 - ÔN TẬP CHƯƠNG II: VECTƠ VÀ HỆ TOẠ ĐỘ TRONG KHÔNG GIAN
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
  userName: 'Chiến Binh Chương II',
  userTitle: 'Đại Kiện Tướng Toạ Độ Oxyz',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// 10 SGK Original Multiple Choice Questions (2.25 -> 2.34 KNTT Toán 12 Tập 1)
const quizData = [
  {
    id: 1,
    title: "Câu 1 (Bài 2.25 SGK KNTT - Trọng tâm tam giác trong tứ diện)",
    pts: 20,
    question: "Cho tứ diện $ABCD$. Gọi $G$ là trọng tâm của tam giác $BCD$. Khẳng định nào sau đây là **sai**?",
    options: [
      { text: "A. $\\overrightarrow{BG} + \\overrightarrow{CG} + \\overrightarrow{DG} = \\vec{0}$", correct: false },
      { text: "B. $\\overrightarrow{AB} + \\overrightarrow{AC} + \\overrightarrow{AD} = 3\\overrightarrow{AG}$", correct: false },
      { text: "C. $\\overrightarrow{BC} + \\overrightarrow{BD} = 3\\overrightarrow{BG}$", correct: false },
      { text: "D. $\\overrightarrow{GA} + \\overrightarrow{GB} + \\overrightarrow{GC} + \\overrightarrow{GD} = \\vec{0}$", correct: true }
    ],
    explanation: "Vì $G$ là trọng tâm của tam giác $BCD$ nên $\\overrightarrow{GB} + \\overrightarrow{GC} + \\overrightarrow{GD} = \\vec{0}$. Do đó $\\overrightarrow{GA} + \\overrightarrow{GB} + \\overrightarrow{GC} + \\overrightarrow{GD} = \\overrightarrow{GA} + \\vec{0} = \\overrightarrow{GA} \\ne \\vec{0}$ (vì đỉnh $A$ không nằm trong mặt phẳng $(BCD)$ nên không thể trùng với $G$). Vậy khẳng định D là sai."
  },
  {
    id: 2,
    title: "Câu 2 (Bài 2.26 SGK KNTT - Phân tích vectơ trong hình hộp)",
    pts: 20,
    question: "Cho hình hộp $ABCD.A'B'C'D'$. Gọi $M$ là trung điểm của đoạn thẳng $CC'$. Vectơ $\\overrightarrow{AM}$ bằng:",
    options: [
      { text: "A. $\\overrightarrow{AB} + \\overrightarrow{AD} + \\overrightarrow{AA'}$", correct: false },
      { text: "B. $\\overrightarrow{AB} + \\overrightarrow{AD} + \\frac{1}{2}\\overrightarrow{AA'}$", correct: true },
      { text: "C. $\\overrightarrow{AB} + \\frac{1}{2}\\overrightarrow{AD} + \\frac{1}{2}\\overrightarrow{AA'}$", correct: false },
      { text: "D. $\\frac{1}{2}\\overrightarrow{AB} + \\overrightarrow{AD} + \\overrightarrow{AA'}$", correct: false }
    ],
    explanation: "Theo quy tắc ba điểm: $\\overrightarrow{AM} = \\overrightarrow{AC} + \\overrightarrow{CM}$. Đáy $ABCD$ là hình bình hành nên $\\overrightarrow{AC} = \\overrightarrow{AB} + \\overrightarrow{AD}$. Điểm $M$ là trung điểm cạnh bên $CC'$ nên $\\overrightarrow{CM} = \\frac{1}{2}\\overrightarrow{CC'} = \\frac{1}{2}\\overrightarrow{AA'}$. Thay vào ta được: $\\overrightarrow{AM} = \\overrightarrow{AB} + \\overrightarrow{AD} + \\frac{1}{2}\\overrightarrow{AA'}$."
  },
  {
    id: 3,
    title: "Câu 3 (Bài 2.27 SGK KNTT - Khẳng định sai trong hình hộp)",
    pts: 20,
    question: "Cho hình hộp $ABCD.A'B'C'D'$. Khẳng định nào dưới đây là **sai**?",
    options: [
      { text: "A. $\\overrightarrow{AB} + \\overrightarrow{CC'} = \\overrightarrow{AB'}$", correct: false },
      { text: "B. $\\overrightarrow{AB} + \\overrightarrow{AD} + \\overrightarrow{AA'} = \\overrightarrow{AC'}$", correct: false },
      { text: "C. $\\overrightarrow{AD} + \\overrightarrow{BB'} = \\overrightarrow{AD'}$", correct: false },
      { text: "D. $\\overrightarrow{AB} + \\overrightarrow{CC'} = \\overrightarrow{AC'}$", correct: true }
    ],
    explanation: "Vì $BCC'B'$ là hình bình hành nên $\\overrightarrow{CC'} = \\overrightarrow{BB'}$. Do đó $\\overrightarrow{AB} + \\overrightarrow{CC'} = \\overrightarrow{AB} + \\overrightarrow{BB'} = \\overrightarrow{AB'}$ (vectơ đường chéo mặt bên $ABB'A'$). Khẳng định D nói bằng $\\overrightarrow{AC'}$ là sai."
  },
  {
    id: 4,
    title: "Câu 4 (Bài 2.28 SGK KNTT - Tích vô hướng trong tứ diện đều)",
    pts: 20,
    question: "Cho tứ diện đều $ABCD$ có độ dài cạnh bằng $a$. Gọi $M$ là trung điểm của đoạn thẳng $CD$. Tích vô hướng $\\overrightarrow{AB} \\cdot \\overrightarrow{AM}$ bằng:",
    options: [
      { text: "A. $\\frac{a^2}{4}$", correct: false },
      { text: "B. $\\frac{a^2}{2}$", correct: true },
      { text: "C. $\\frac{a^2}{3}$", correct: false },
      { text: "D. $a^2$", correct: false }
    ],
    explanation: "Vì $M$ là trung điểm $CD$ nên $\\overrightarrow{AM} = \\frac{1}{2}(\\overrightarrow{AC} + \\overrightarrow{AD})$. Do đó: $\\overrightarrow{AB} \\cdot \\overrightarrow{AM} = \\frac{1}{2}\\overrightarrow{AB} \\cdot (\\overrightarrow{AC} + \\overrightarrow{AD}) = \\frac{1}{2}(\\overrightarrow{AB} \\cdot \\overrightarrow{AC} + \\overrightarrow{AB} \\cdot \\overrightarrow{AD}) = \\frac{1}{2}(a \\cdot a \\cdot \\cos 60^\\circ + a \\cdot a \\cdot \\cos 60^\\circ) = \\frac{1}{2}\\left(\\frac{a^2}{2} + \\frac{a^2}{2}\\right) = \\frac{a^2}{2}$."
  },
  {
    id: 5,
    title: "Câu 5 (Bài 2.29 SGK KNTT - Phép toán vectơ trong toạ độ)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho $\\vec{a} = (1; -2; 2)$, $\\vec{b} = (-2; 0; 3)$. Khẳng định nào dưới đây là **sai**?",
    options: [
      { text: "A. $\\vec{a} + \\vec{b} = (-1; -2; 5)$", correct: false },
      { text: "B. $\\vec{a} - \\vec{b} = (3; -2; -1)$", correct: false },
      { text: "C. $3\\vec{a} = (3; -2; 2)$", correct: true },
      { text: "D. $2\\vec{a} + \\vec{b} = (0; -4; 7)$", correct: false }
    ],
    explanation: "Nhân vectơ với một số: $3\\vec{a} = 3(1; -2; 2) = (3; -6; 6)$. Khẳng định C viết $3\\vec{a} = (3; -2; 2)$ là sai vì không nhân số $3$ cho tung độ và cao độ."
  },
  {
    id: 6,
    title: "Câu 6 (Bài 2.30 SGK KNTT - Toạ độ đỉnh thứ tư hình bình hành)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho hình bình hành $ABCD$ có $A(-1; 0; 3)$, $B(2; 1; -1)$ và $C(3; 2; 2)$. Toạ độ của điểm $D$ là:",
    options: [
      { text: "A. $(2; -1; 0)$", correct: false },
      { text: "B. $(0; -1; -6)$", correct: false },
      { text: "C. $(0; 1; 6)$", correct: true },
      { text: "D. $(-2; 1; 0)$", correct: false }
    ],
    explanation: "$ABCD$ là hình bình hành $\\iff \\overrightarrow{AD} = \\overrightarrow{BC}$. Ta có $\\overrightarrow{BC} = (3 - 2; 2 - 1; 2 - (-1)) = (1; 1; 3)$. Từ đó: $x_D = x_A + 1 = 0$, $y_D = y_A + 1 = 1$, $z_D = z_A + 3 = 6$. Vậy $D(0; 1; 6)$."
  },
  {
    id: 7,
    title: "Câu 7 (Bài 2.31 SGK KNTT - Tìm đỉnh tam giác qua trọng tâm)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho $A(1; 0; -1)$, $B(0; -1; 2)$ và $G(2; 1; 0)$. Biết tam giác $ABC$ có trọng tâm là điểm $G$. Toạ độ của điểm $C$ là:",
    options: [
      { text: "A. $(5; 4; -1)$", correct: true },
      { text: "B. $(-5; -4; 1)$", correct: false },
      { text: "C. $(1; 2; -1)$", correct: false },
      { text: "D. $(-1; -2; 1)$", correct: false }
    ],
    explanation: "Vì $G$ là trọng tâm tam giác $ABC$ nên $C = 3G - A - B$. Cụ thể: $x_C = 3 \\cdot 2 - 1 - 0 = 5$, $y_C = 3 \\cdot 1 - 0 - (-1) = 4$, $z_C = 3 \\cdot 0 - (-1) - 2 = -1$. Vậy $C(5; 4; -1)$."
  },
  {
    id: 8,
    title: "Câu 8 (Bài 2.32 SGK KNTT - Tích vô hướng của hai vectơ)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho $\\vec{a} = (2; 1; -3)$, $\\vec{b} = (-2; -1; 2)$. Tích vô hướng $\\vec{a} \\cdot \\vec{b}$ bằng:",
    options: [
      { text: "A. $-2$", correct: false },
      { text: "B. $-11$", correct: true },
      { text: "C. $11$", correct: false },
      { text: "D. $2$", correct: false }
    ],
    explanation: "Áp dụng biểu thức toạ độ tích vô hướng: $\\vec{a} \\cdot \\vec{b} = x_1 x_2 + y_1 y_2 + z_1 z_2 = 2(-2) + 1(-1) + (-3)(2) = -4 - 1 - 6 = -11$."
  },
  {
    id: 9,
    title: "Câu 9 (Bài 2.33 SGK KNTT - Góc giữa hai vectơ)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho $\\vec{a} = (2; 1; -2)$, $\\vec{b} = (0; -1; 1)$. Góc giữa hai vectơ $\\vec{a}$ và $\\vec{b}$ bằng:",
    options: [
      { text: "A. $60^\\circ$", correct: false },
      { text: "B. $135^\\circ$", correct: true },
      { text: "C. $120^\\circ$", correct: false },
      { text: "D. $45^\\circ$", correct: false }
    ],
    explanation: "Ta có tích vô hướng: $\\vec{a} \\cdot \\vec{b} = 2 \\cdot 0 + 1(-1) + (-2)1 = -3$. Độ dài: $|\\vec{a}| = \\sqrt{2^2 + 1^2 + (-2)^2} = \\sqrt{9} = 3$; $|\\vec{b}| = \\sqrt{0^2 + (-1)^2 + 1^2} = \\sqrt{2}$. Suy ra $\\cos(\\vec{a}, \\vec{b}) = \\frac{-3}{3\\sqrt{2}} = -\\frac{1}{\\sqrt{2}} \\Rightarrow (\\vec{a}, \\vec{b}) = 135^\\circ$."
  },
  {
    id: 10,
    title: "Câu 10 (Bài 2.34 SGK KNTT - Côsin của góc giữa hai vectơ)",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho $\\vec{a} = (-2; 2; 2)$, $\\vec{b} = (1; -1; -2)$. Côsin của góc giữa hai vectơ $\\vec{a}$ và $\\vec{b}$ bằng:",
    options: [
      { text: "A. $\\frac{-2\\sqrt{2}}{3}$", correct: true },
      { text: "B. $\\frac{2\\sqrt{2}}{3}$", correct: false },
      { text: "C. $\\frac{\\sqrt{2}}{3}$", correct: false },
      { text: "D. $\\frac{-\\sqrt{2}}{3}$", correct: false }
    ],
    explanation: "Tích vô hướng: $\\vec{a} \\cdot \\vec{b} = (-2) \\cdot 1 + 2(-1) + 2(-2) = -2 - 2 - 4 = -8$. Độ dài: $|\\vec{a}| = \\sqrt{(-2)^2 + 2^2 + 2^2} = \\sqrt{12} = 2\\sqrt{3}$; $|\\vec{b}| = \\sqrt{1^2 + (-1)^2 + (-2)^2} = \\sqrt{6}$. Do đó: $\\cos(\\vec{a}, \\vec{b}) = \\frac{-8}{2\\sqrt{3} \\cdot \\sqrt{6}} = \\frac{-8}{2 \\cdot 3\\sqrt{2}} = \\frac{-4}{3\\sqrt{2}} = \\frac{-2\\sqrt{2}}{3}$."
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
    if (confirm('Làm mới lại toàn bộ bài ôn tập Chương II?')) {
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
// LAB 1: RADAR GIÀN KHOAN KHÔNG GIAN 3D
// ==========================================
function initLab1() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sxSlider = document.getElementById('shipX');
  const sySlider = document.getElementById('shipY');
  const szSlider = document.getElementById('shipZ');

  const valShipX = document.getElementById('valShipX');
  const valShipY = document.getElementById('valShipY');
  const valShipZ = document.getElementById('valShipZ');
  const outRadar = document.getElementById('radarOutput');

  function drawRadar() {
    const sx = parseFloat(sxSlider.value);
    const sy = parseFloat(sySlider.value);
    const sz = parseFloat(szSlider.value);

    valShipX.textContent = sx;
    valShipY.textContent = sy;
    valShipZ.textContent = sz;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ox = canvas.width / 2;
    const oy = canvas.height / 2 + 30;
    const scale = 5.2;

    function project(x, y, z) {
      return {
        x: ox + (x * 0.9 - y * 0.7) * scale,
        y: oy + (x * 0.35 + y * 0.3 - z * 1.0) * scale
      };
    }

    const O = { x: ox, y: oy };
    const Ship = project(sx, sy, sz);

    // Radar scanning range 30 km circle on horizontal sea surface (z = 0)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);

    // Draw ellipse representing R=30 on sea plane
    const steps = 60;
    for (let i = 0; i <= steps; i++) {
      const theta = (i * 2 * Math.PI) / steps;
      const px = 30 * Math.cos(theta);
      const py = 30 * Math.sin(theta);
      const pt = project(px, py, 0);
      if (i === 0) ctx.moveTo(pt.x, pt.y);
      else ctx.lineTo(pt.x, pt.y);
    }
    ctx.stroke();
    ctx.setLineDash([]);

    // Sea plane grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    [-30, -15, 0, 15, 30].forEach(coord => {
      const p1 = project(coord, -30, 0);
      const p2 = project(coord, 30, 0);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const p3 = project(-30, coord, 0);
      const p4 = project(30, coord, 0);
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.stroke();
    });

    // Draw Radar Station O at (0, 0, 0)
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath();
    ctx.arc(ox, oy, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('Giàn khoan O(0; 0; 0)', ox + 12, oy - 6);

    // Distance OT
    const distOT = Math.sqrt(sx * sx + sy * sy + sz * sz);
    const inRange = distOT <= 30.001;

    // Line from O to Ship
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = inRange ? '#10b981' : '#f43f5e';
    ctx.beginPath();
    ctx.moveTo(ox, oy);
    ctx.lineTo(Ship.x, Ship.y);
    ctx.stroke();

    // Projection of Ship on sea surface (z = 0)
    const ShipSea = project(sx, sy, 0);
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.moveTo(Ship.x, Ship.y);
    ctx.lineTo(ShipSea.x, ShipSea.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw Ship Node
    ctx.fillStyle = inRange ? '#10b981' : '#f43f5e';
    ctx.shadowColor = inRange ? '#10b981' : '#f43f5e';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(Ship.x, Ship.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillText(`Tàu T(${sx}; ${sy}; ${sz})`, Ship.x + 10, Ship.y - 4);

    let statusText = '';
    if (inRange) {
      statusText = '<span style="color: #10b981; font-weight: bold;">TRONG TẦM QUÉT: Radar phát hiện được mục tiêu ($OT \\le 30\\text{ km}$).</span>';
    } else {
      statusText = '<span style="color: #f43f5e; font-weight: bold;">NGOÀI TẦM QUÉT: Radar không phát hiện được ($OT > 30\\text{ km}$).</span>';
    }

    outRadar.innerHTML = `
      <strong>📡 Báo cáo trạm Radar giàn khoan biển:</strong><br>
      • Toạ độ mục tiêu: $T(${sx}; ${sy}; ${sz})$ (đơn vị: km)<br>
      • Khoảng cách từ trạm radar $O(0;0;0)$ đến tàu: $OT = \\sqrt{${sx}^2 + ${sy}^2 + (${sz})^2} = \\mathbf{${distOT.toFixed(2)}\\text{ km}}$<br>
      • Bán kính theo dõi tối đa của radar: $R = 30\\text{ km}$<br>
      • Kết luận giám sát: ${statusText}
    `;
    renderMathInTree(outRadar);

    if (!appState.badges[1]) unlockBadge(1);
  }

  [sxSlider, sySlider, szSlider].forEach(s => s.addEventListener('input', drawRadar));
  drawRadar();
}

// ==========================================
// LAB 2: MÁY TÍNH PHÂN TÍCH VECTƠ KHÔNG GIAN
// ==========================================
function initLab2() {
  const canvas = document.getElementById('multiCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const a1Slider = document.getElementById('vecA1');
  const a2Slider = document.getElementById('vecA2');
  const a3Slider = document.getElementById('vecA3');
  const b2Slider = document.getElementById('vecB2');

  const valA1 = document.getElementById('valA1');
  const valA2 = document.getElementById('valA2');
  const valA3 = document.getElementById('valA3');
  const valB2 = document.getElementById('valB2');
  const outMulti = document.getElementById('multiOutput');

  function drawMulti() {
    const a1 = parseFloat(a1Slider.value);
    const a2 = parseFloat(a2Slider.value);
    const a3 = parseFloat(a3Slider.value);
    const b2 = parseFloat(b2Slider.value);

    valA1.textContent = a1;
    valA2.textContent = a2;
    valA3.textContent = a3;
    valB2.textContent = b2;

    const vecA = { x: a1, y: a2, z: a3 };
    const vecB = { x: 0, y: b2, z: 1 };

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ox = canvas.width / 2 - 40;
    const oy = canvas.height / 2 + 40;
    const scale = 30;

    function project(vec) {
      return {
        x: ox + (vec.x * 0.9 - vec.y * 0.7) * scale,
        y: oy + (vec.x * 0.35 + vec.y * 0.3 - vec.z * 1.0) * scale
      };
    }

    const O = { x: ox, y: oy };
    const pA = project(vecA);
    const pB = project(vecB);

    // Vector a
    drawArrow(O, pA, '#06b6d4', `a(${a1}; ${a2}; ${a3})`);
    // Vector b
    drawArrow(O, pB, '#f43f5e', `b(0; ${b2}; 1)`);

    // Origin
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ox, oy, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('O', ox - 15, oy + 15);

    function drawArrow(p1, p2, col, label) {
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 3;
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

    // Mathematical Dot Product & Angle
    const dotProduct = a1 * vecB.x + a2 * vecB.y + a3 * vecB.z;
    const lenA = Math.sqrt(a1 * a1 + a2 * a2 + a3 * a3);
    const lenB = Math.sqrt(vecB.x * vecB.x + vecB.y * vecB.y + vecB.z * vecB.z);

    let cosTheta = 0;
    let degTheta = 0;
    if (lenA > 0.001 && lenB > 0.001) {
      cosTheta = dotProduct / (lenA * lenB);
      cosTheta = Math.max(-1, Math.min(1, cosTheta));
      degTheta = (Math.acos(cosTheta) * 180) / Math.PI;
    }

    let relText = '';
    if (Math.abs(dotProduct) < 0.001) {
      relText = '<span style="color: #10b981; font-weight: bold;">HAI VECTƠ VUÔNG GÓC ($\\vec{a} \\perp \\vec{b}$).</span>';
    } else if (degTheta < 90) {
      relText = `<span style="color: #06b6d4; font-weight: bold;">Góc nhọn: $\\alpha \\approx ${degTheta.toFixed(1)}^\\circ$.</span>`;
    } else {
      relText = `<span style="color: #f43f5e; font-weight: bold;">Góc tù: $\\alpha \\approx ${degTheta.toFixed(1)}^\\circ$.</span>`;
    }

    outMulti.innerHTML = `
      <strong>🎛️ Phân tích tương quan đại số và góc:</strong><br>
      • Tích vô hướng: $\\vec{a} \\cdot \\vec{b} = ${a1} \\cdot 0 + ${a2} \\cdot (${b2}) + ${a3} \\cdot 1 = \\mathbf{${dotProduct.toFixed(2)}}$<br>
      • Độ dài: $|\\vec{a}| = \\mathbf{${lenA.toFixed(2)}}$; $|\\vec{b}| = \\mathbf{${lenB.toFixed(2)}}$<br>
      • Cosin góc: $\\cos(\\vec{a}, \\vec{b}) = \\frac{${dotProduct.toFixed(2)}}{${(lenA*lenB).toFixed(2)}} = \\mathbf{${cosTheta.toFixed(3)}}$<br>
      • Nhận xét hình học: ${relText}
    `;
    renderMathInTree(outMulti);

    if (!appState.badges[2]) unlockBadge(2);
  }

  [a1Slider, a2Slider, a3Slider, b2Slider].forEach(s => s.addEventListener('input', drawMulti));
  drawMulti();
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
      document.getElementById('summaryText').textContent = `Bạn đã hoàn thành toàn bộ 10 câu trắc nghiệm cuối chương II với tổng điểm ${appState.xp} XP!`;
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
