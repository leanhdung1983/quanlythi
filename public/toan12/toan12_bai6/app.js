// ==========================================
// TOÁN 12 - BÀI 6: VECTƠ TRONG KHÔNG GIAN
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
      console.warn('KaTeX render error, falling back to MathML:', e);
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
  s = s.replace(/\\times/g, '<mo>&times;</mo>');
  s = s.replace(/\\pm/g, '<mo>&plusmn;</mo>');
  s = s.replace(/\\approx/g, '<mo>&asymp;</mo>');
  s = s.replace(/\\le/g, '<mo>&le;</mo>');
  s = s.replace(/\\ge/g, '<mo>&ge;</mo>');
  s = s.replace(/\\ne/g, '<mo>&ne;</mo>');
  s = s.replace(/\\perp/g, '<mo>&perp;</mo>');
  s = s.replace(/\\in/g, '<mo>&isin;</mo>');
  s = s.replace(/\\alpha/g, '<mi>&alpha;</mi>');
  s = s.replace(/\\cos/g, '<mi class="m-fn">cos</mi>');
  s = s.replace(/\\sin/g, '<mi class="m-fn">sin</mi>');
  s = s.replace(/\\mathbb\{R\}/g, '<mi class="m-bb">&#8477;</mi>');
  s = s.replace(/([A-Za-z0-9]+)\^\{([^}]+)\}/g, '<msup><mi>$1</mi><mrow>$2</mrow></msup>');
  s = s.replace(/([A-Za-z0-9]+)\_\{([^}]+)\}/g, '<msub><mi>$1</mi><mrow>$2</mrow></msub>');
  s = s.replace(/([A-Za-z0-9]+)\^([0-9a-zA-Z])/g, '<msup><mi>$1</mi><mi>$2</mi></msup>');
  s = s.replace(/([A-Za-z0-9]+)\_([0-9a-zA-Z])/g, '<msub><mi>$1</mi><mi>$2</mi></msub>');
  return `<math ${isBlock ? 'display="block"' : ''}>${s}</math>`;
}

// App State Management
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Không Gian',
  userTitle: 'Nhà Thám Hiểm Chiều Thứ 3',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// 10 SGK Arena Questions for Bài 6
const quizData = [
  {
    id: 1,
    title: "Câu 1 (H.2.1 SGK - Vectơ cùng hướng & ngược hướng)",
    pts: 20,
    question: "Trong không gian, cho ba vectơ $\\vec{a}$, $\\vec{b}$, $\\vec{c}$ phân biệt và đều khác $\\vec{0}$. Khẳng định nào sau đây là **sai**?",
    options: [
      { text: "A. Nếu $\\vec{a}$ và $\\vec{b}$ đều cùng hướng với $\\vec{c}$ thì $\\vec{a}$ và $\\vec{b}$ cùng hướng.", correct: false },
      { text: "B. Nếu $\\vec{a}$ và $\\vec{b}$ đều ngược hướng với $\\vec{c}$ thì $\\vec{a}$ và $\\vec{b}$ cùng hướng.", correct: false },
      { text: "C. Nếu $\\vec{a}$ và $\\vec{b}$ đều cùng hướng với $\\vec{c}$ thì $\\vec{a}$ và $\\vec{b}$ ngược hướng.", correct: true },
      { text: "D. Nếu $\\vec{a}$ cùng hướng với $\\vec{c}$ và $\\vec{b}$ ngược hướng với $\\vec{c}$ thì $\\vec{a}$ và $\\vec{b}$ ngược hướng.", correct: false }
    ],
    explanation: "Theo tính chất phương và hướng trong không gian, quan hệ cùng hướng giữa các vectơ khác $\\vec{0}$ có tính chất bắc cầu: nếu $\\vec{a}$ và $\\vec{b}$ đều cùng hướng với $\\vec{c}$ thì $\\vec{a}$ và $\\vec{b}$ chắc chắn **cùng hướng**. Do đó khẳng định C nói ngược hướng là sai."
  },
  {
    id: 2,
    title: "Câu 2 (Bài 2.2 SGK - Độ dài vectơ trong hình hộp chữ nhật)",
    pts: 20,
    question: "Cho hình hộp chữ nhật $ABCD.A'B'C'D'$ có $AB = 2$, $AD = 3$ và $AA' = 4$. Độ dài của vectơ $\\overrightarrow{BD'}$ bằng:",
    options: [
      { text: "A. $\\sqrt{29}$", correct: true },
      { text: "B. $9$", correct: false },
      { text: "C. $5$", correct: false },
      { text: "D. $\\sqrt{13}$", correct: false }
    ],
    explanation: "Độ dài vectơ $\\overrightarrow{BD'}$ chính là độ dài đường chéo của hình hộp chữ nhật $ABCD.A'B'C'D'$. Ta có công thức đường chéo: $|\\overrightarrow{BD'}| = BD' = \\sqrt{AB^2 + AD^2 + AA'^2} = \\sqrt{2^2 + 3^2 + 4^2} = \\sqrt{4 + 9 + 16} = \\sqrt{29}$."
  },
  {
    id: 3,
    title: "Câu 3 (Định lý SGK - Quy tắc hình hộp)",
    pts: 20,
    question: "Cho hình hộp $ABCD.A'B'C'D'$. Quy tắc hình hộp phát biểu rằng tổng $\\overrightarrow{AB} + \\overrightarrow{AD} + \\overrightarrow{AA'}$ bằng vectơ nào sau đây?",
    options: [
      { text: "A. $\\overrightarrow{AC}$", correct: false },
      { text: "B. $\\overrightarrow{AC'}$", correct: true },
      { text: "C. $\\overrightarrow{CA'}$", correct: false },
      { text: "D. $\\overrightarrow{BD'}$", correct: false }
    ],
    explanation: "Theo quy tắc hình bình hành ở đáy: $\\overrightarrow{AB} + \\overrightarrow{AD} = \\overrightarrow{AC}$. Xét tiếp hình bình hành $ACC'A'$: $\\overrightarrow{AC} + \\overrightarrow{AA'} = \\overrightarrow{AC'}$. Do đó $\\overrightarrow{AB} + \\overrightarrow{AD} + \\overrightarrow{AA'} = \\overrightarrow{AC'}$ (vectơ đường chéo xuất phát từ cùng đỉnh $A$)."
  },
  {
    id: 4,
    title: "Câu 4 (Bài 2.4 SGK - Biến đổi tổng vectơ trong hình hộp)",
    pts: 20,
    question: "Cho hình hộp $ABCD.A'B'C'D'$. Đẳng thức vectơ nào sau đây là **đúng**?",
    options: [
      { text: "A. $\\overrightarrow{AB} + \\overrightarrow{DD'} + \\overrightarrow{C'D'} = \\overrightarrow{CC'}$", correct: false },
      { text: "B. $\\overrightarrow{AB} + \\overrightarrow{CD'} - \\overrightarrow{CC'} = \\vec{0}$", correct: false },
      { text: "C. $\\overrightarrow{BC} - \\overrightarrow{CC'} + \\overrightarrow{DC} = \\overrightarrow{A'C}$", correct: false },
      { text: "D. $\\overrightarrow{AB} + \\overrightarrow{DD'} + \\overrightarrow{C'D'} = \\overrightarrow{AA'}$", correct: true }
    ],
    explanation: "Vì $ABCD.A'B'C'D'$ là hình hộp nên $\\overrightarrow{C'D'} = \\overrightarrow{BA} = -\\overrightarrow{AB}$ và $\\overrightarrow{DD'} = \\overrightarrow{AA'}$. Thay vào vế trái: $\\overrightarrow{AB} + \\overrightarrow{DD'} + \\overrightarrow{C'D'} = \\overrightarrow{AB} + \\overrightarrow{AA'} - \\overrightarrow{AB} = \\overrightarrow{AA'}$. Vậy đẳng thức D đúng."
  },
  {
    id: 5,
    title: "Câu 5 (Bài 2.5 SGK - Biểu diễn vectơ trong lăng trụ tam giác)",
    pts: 20,
    question: "Cho hình lăng trụ tam giác $ABC.A'B'C'$ có $\\overrightarrow{AA'} = \\vec{a}$, $\\overrightarrow{AB} = \\vec{b}$ và $\\overrightarrow{AC} = \\vec{c}$. Biểu diễn vectơ $\\overrightarrow{BC'}$ qua $\\vec{a}, \\vec{b}, \\vec{c}$ là:",
    options: [
      { text: "A. $\\overrightarrow{BC'} = \\vec{a} - \\vec{b} + \\vec{c}$", correct: true },
      { text: "B. $\\overrightarrow{BC'} = \\vec{a} + \\vec{b} + \\vec{c}$", correct: false },
      { text: "C. $\\overrightarrow{BC'} = -\\vec{a} + \\vec{b} - \\vec{c}$", correct: false },
      { text: "D. $\\overrightarrow{BC'} = \\vec{a} + \\vec{b} - \\vec{c}$", correct: false }
    ],
    explanation: "Ta có phân tích vectơ theo quy tắc ba điểm: $\\overrightarrow{BC'} = \\overrightarrow{BC} + \\overrightarrow{CC'}$. Trong tam giác đáy $ABC$: $\\overrightarrow{BC} = \\overrightarrow{AC} - \\overrightarrow{AB} = \\vec{c} - \\vec{b}$. Mặt khác cạnh bên $\\overrightarrow{CC'} = \\overrightarrow{AA'} = \\vec{a}$. Do đó $\\overrightarrow{BC'} = (\\vec{c} - \\vec{b}) + \\vec{a} = \\vec{a} - \\vec{b} + \\vec{c}$."
  },
  {
    id: 6,
    title: "Câu 6 (Bài 2.6 SGK - Điều kiện hình bình hành qua đỉnh S)",
    pts: 20,
    question: "Cho hình chóp tứ giác $S.ABCD$. Tứ giác $ABCD$ là hình bình hành khi và chỉ khi:",
    options: [
      { text: "A. $\\overrightarrow{SA} + \\overrightarrow{SB} = \\overrightarrow{SC} + \\overrightarrow{SD}$", correct: false },
      { text: "B. $\\overrightarrow{SA} + \\overrightarrow{SC} = \\overrightarrow{SB} + \\overrightarrow{SD}$", correct: true },
      { text: "C. $\\overrightarrow{SA} + \\overrightarrow{SD} = \\overrightarrow{SB} + \\overrightarrow{SC}$", correct: false },
      { text: "D. $\\overrightarrow{SA} - \\overrightarrow{SC} = \\overrightarrow{SB} - \\overrightarrow{SD}$", correct: false }
    ],
    explanation: "$ABCD$ là hình bình hành $\\Leftrightarrow$ hai đường chéo $AC$ và $BD$ có cùng trung điểm $O$. Theo hệ thức trung điểm với đỉnh $S$ bất kỳ: $\\overrightarrow{SA} + \\overrightarrow{SC} = 2\\overrightarrow{SO}$ và $\\overrightarrow{SB} + \\overrightarrow{SD} = 2\\overrightarrow{SO}$. Từ đó suy ra điều kiện cần và đủ là $\\overrightarrow{SA} + \\overrightarrow{SC} = \\overrightarrow{SB} + \\overrightarrow{SD}$."
  },
  {
    id: 7,
    title: "Câu 7 (Luyện tập 8 & Bài 2.8 SGK - Trọng tâm tứ diện)",
    pts: 20,
    question: "Gọi $G$ là trọng tâm của tứ diện $ABCD$ và $M$ là trọng tâm của tam giác $BCD$. Khẳng định nào sau đây là **đúng**?",
    options: [
      { text: "A. $\\overrightarrow{AG} = 3\\overrightarrow{GM}$", correct: true },
      { text: "B. $\\overrightarrow{AG} = 4\\overrightarrow{GM}$", correct: false },
      { text: "C. $\\overrightarrow{AG} = 2\\overrightarrow{GM}$", correct: false },
      { text: "D. $\\overrightarrow{GA} + \\overrightarrow{GB} + \\overrightarrow{GC} + \\overrightarrow{GD} = 4\\overrightarrow{GM}$", correct: false }
    ],
    explanation: "Vì $M$ là trọng tâm tam giác $BCD$ nên $\\overrightarrow{GB} + \\overrightarrow{GC} + \\overrightarrow{GD} = 3\\overrightarrow{GM}$. Do $G$ là trọng tâm tứ diện $ABCD$ nên $\\overrightarrow{GA} + \\overrightarrow{GB} + \\overrightarrow{GC} + \\overrightarrow{GD} = \\vec{0} \\Rightarrow \\overrightarrow{GA} + 3\\overrightarrow{GM} = \\vec{0} \\Rightarrow \\overrightarrow{AG} = 3\\overrightarrow{GM}$. Khoảng cách từ $G$ đến mặt phẳng $(BCD)$ bằng $\\frac{1}{4}$ chiều cao hạ từ $A$."
  },
  {
    id: 8,
    title: "Câu 8 (Ví dụ 9 SGK - Góc giữa hai vectơ trong lập phương)",
    pts: 20,
    question: "Cho hình lập phương $ABCD.A'B'C'D'$. Góc giữa hai vectơ $\\overrightarrow{AC}$ và $\\overrightarrow{A'D'}$ bằng:",
    options: [
      { text: "A. $90^\\circ$", correct: false },
      { text: "B. $60^\\circ$", correct: false },
      { text: "C. $45^\\circ$", correct: true },
      { text: "D. $30^\\circ$", correct: false }
    ],
    explanation: "Vì tứ giác $ADD'A'$ là hình vuông nên $\\overrightarrow{A'D'} = \\overrightarrow{AD}$. Do đó $(\\overrightarrow{AC}, \\overrightarrow{A'D'}) = (\\overrightarrow{AC}, \\overrightarrow{AD}) = \\widehat{CAD}$. Tam giác $ADC$ vuông cân tại $D$ nên góc $\\widehat{CAD} = 45^\\circ$. Vậy góc giữa hai vectơ bằng $45^\\circ$."
  },
  {
    id: 9,
    title: "Câu 9 (Ví dụ 10 SGK - Tích vô hướng trong chóp tứ giác đều)",
    pts: 20,
    question: "Cho hình chóp tứ giác đều $S.ABCD$ có độ dài tất cả các cạnh đều bằng $a$. Tích vô hướng $\\overrightarrow{AS} \\cdot \\overrightarrow{BC}$ bằng:",
    options: [
      { text: "A. $-\\frac{a^2}{2}$", correct: true },
      { text: "B. $\\frac{a^2}{2}$", correct: false },
      { text: "C. $\\frac{a^2\\sqrt{2}}{2}$", correct: false },
      { text: "D. $0$", correct: false }
    ],
    explanation: "Vì $ABCD$ là hình vuông nên $\\overrightarrow{BC} = \\overrightarrow{AD}$. Ta có $\\overrightarrow{AS} = -\\overrightarrow{SA}$, do đó: $\\overrightarrow{AS} \\cdot \\overrightarrow{BC} = (-\\overrightarrow{SA}) \\cdot \\overrightarrow{AD} = -|\\overrightarrow{SA}| \\cdot |\\overrightarrow{AD}| \\cdot \\cos(\\overrightarrow{SA}, \\overrightarrow{AD}) = -a \\cdot a \\cdot \\cos 60^\\circ = -\\frac{a^2}{2}$ (tam giác $SAD$ là tam giác đều cạnh $a$)."
  },
  {
    id: 10,
    title: "Câu 10 (Vận dụng 4 SGK - Công của lực kéo vật trong không gian)",
    pts: 20,
    question: "Một lực $\\vec{F}$ có độ lớn $100\\text{ N}$ tác dụng làm dịch chuyển một vật trên quãng đường $MN = 10\\text{ m}$. Biết hướng của lực $\\vec{F}$ hợp với hướng dịch chuyển $\\overrightarrow{MN}$ một góc $60^\\circ$. Công $A$ sinh ra bởi lực $\\vec{F}$ bằng:",
    options: [
      { text: "A. $1000\\text{ J}$", correct: false },
      { text: "B. $500\\text{ J}$", correct: true },
      { text: "C. $500\\sqrt{3}\\text{ J}$", correct: false },
      { text: "D. $250\\text{ J}$", correct: false }
    ],
    explanation: "Theo định nghĩa công cơ học trong không gian: $A = \\vec{F} \\cdot \\overrightarrow{MN} = |\\vec{F}| \\cdot |\\overrightarrow{MN}| \\cdot \\cos(\\vec{F}, \\overrightarrow{MN}) = 100 \\cdot 10 \\cdot \\cos 60^\\circ = 1000 \\cdot \\frac{1}{2} = 500\\text{ (Jun)}.$"
  }
];

// Initialize Everything on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  renderMathInTree(document.body);
  initHUD();
  initTabs();
  initLab1();
  initLab2();
  initArena();
  initCertAndModal();
});

// Tab Switcher
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

      // Check badge 1
      if (tab.dataset.tab === 'theory' && !appState.badges[0]) {
        unlockBadge(0);
      }
    });
  });
}

// HUD Header and Controls
function initHUD() {
  const soundToggle = document.getElementById('soundToggle');
  const resetBtn = document.getElementById('resetProgress');

  soundToggle.addEventListener('click', () => {
    appState.sound = !appState.sound;
    sounds.enabled = appState.sound;
    soundToggle.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
  });

  resetBtn.addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập?')) {
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

  // Stars calculation
  let starStr = '';
  for (let i = 1; i <= 5; i++) {
    starStr += i <= appState.stars ? '⭐' : '☆';
  }
  document.getElementById('starRating').textContent = starStr;

  // Sync Cert stats
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
  if (badgeCard) {
    badgeCard.classList.add('unlocked');
  }
  sounds.playLevelUp();
}

// ==========================================
// LAB 1: QUY TẮC HÌNH HỘP 3D ISOMETRIC CANVAS
// ==========================================
function initLab1() {
  const canvas = document.getElementById('boxCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const lenSlider = document.getElementById('boxLength');
  const widSlider = document.getElementById('boxWidth');
  const heiSlider = document.getElementById('boxHeight');
  const yawSlider = document.getElementById('yawAngle');

  const lenVal = document.getElementById('lenVal');
  const widVal = document.getElementById('widVal');
  const heiVal = document.getElementById('heiVal');
  const yawVal = document.getElementById('yawVal');
  const outBox = document.getElementById('boxOutput');

  function drawBox() {
    const a = parseFloat(lenSlider.value);
    const b = parseFloat(widSlider.value);
    const c = parseFloat(heiSlider.value);
    const yaw = (parseFloat(yawSlider.value) * Math.PI) / 180;

    lenVal.textContent = a.toFixed(1);
    widVal.textContent = b.toFixed(1);
    heiVal.textContent = c.toFixed(1);
    yawVal.textContent = yawSlider.value + '°';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Coordinate projection
    const scale = 36;
    const ox = canvas.width / 2 - 40;
    const oy = canvas.height / 2 + 70;

    // Projection vectors:
    // AB goes right and slightly down
    const vx = { x: Math.cos(yaw) * scale, y: Math.sin(yaw) * 0.4 * scale };
    // AD goes left-upward (receding depth)
    const vy = { x: -Math.cos(Math.PI / 4) * scale * 0.9, y: -Math.sin(Math.PI / 4) * scale * 0.6 };
    // AA' goes straight up
    const vz = { x: 0, y: -scale * 1.1 };

    function project(x, y, z) {
      return {
        x: ox + x * vx.x + y * vy.x + z * vz.x,
        y: oy + x * vx.y + y * vy.y + z * vz.y
      };
    }

    // 8 Vertices
    const A = project(0, 0, 0);
    const B = project(a, 0, 0);
    const D = project(0, b, 0);
    const C = project(a, b, 0);

    const Ap = project(0, 0, c);
    const Bp = project(a, 0, c);
    const Dp = project(0, b, c);
    const Cp = project(a, b, c);

    // Draw grid background subtle
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    for (let i = 0; i < canvas.width; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, canvas.height);
      ctx.stroke();
    }

    // Hidden lines (dashed)
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';

    // AD, CD, D-Dp
    drawLine(A, D);
    drawLine(C, D);
    drawLine(D, Dp);

    // Solid lines
    ctx.setLineDash([]);
    ctx.strokeStyle = '#94a3b8';
    drawLine(A, B);
    drawLine(B, C);
    drawLine(Ap, Bp);
    drawLine(Bp, Cp);
    drawLine(Cp, Dp);
    drawLine(Dp, Ap);
    drawLine(B, Bp);
    drawLine(C, Cp);

    // Base vectors (Highlight colored with arrows)
    drawVector(A, B, '#f43f5e', 'AB', 3);
    drawVector(A, D, '#10b981', 'AD', 3, true);
    drawVector(A, Ap, '#06b6d4', "AA'", 3);

    // Main Space Diagonal Vector AC' (Gold glowing)
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 12;
    drawVector(A, Cp, '#fbbf24', "AC' (Đường chéo chính)", 3.5);
    ctx.shadowBlur = 0;

    // Draw vertex dots and labels
    drawPoint(A, 'A', '#ffffff');
    drawPoint(B, 'B', '#f43f5e');
    drawPoint(C, 'C', '#94a3b8');
    drawPoint(D, 'D', '#10b981');
    drawPoint(Ap, "A'", '#06b6d4');
    drawPoint(Bp, "B'", '#94a3b8');
    drawPoint(Cp, "C'", '#fbbf24');
    drawPoint(Dp, "D'", '#94a3b8');

    function drawLine(p1, p2) {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    function drawPoint(p, text, col) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(text, p.x + 8, p.y - 6);
    }

    function drawVector(p1, p2, col, label, width = 2, isDashed = false) {
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = width;
      if (isDashed) ctx.setLineDash([4, 3]);
      else ctx.setLineDash([]);

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
      ctx.setLineDash([]);

      // Arrowhead
      const angle = Math.atan2(p2.y - p1.y, p2.x - p1.x);
      const headLen = 10;
      ctx.beginPath();
      ctx.moveTo(p2.x, p2.y);
      ctx.lineTo(p2.x - headLen * Math.cos(angle - Math.PI / 6), p2.y - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(p2.x - headLen * Math.cos(angle + Math.PI / 6), p2.y - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      // Label mid
      const mx = (p1.x + p2.x) / 2 + 10;
      const my = (p1.y + p2.y) / 2 - 5;
      ctx.font = 'bold 11px Inter, sans-serif';
      ctx.fillText(label, mx, my);
    }

    // Diagonal length calculation
    const diagLen = Math.sqrt(a * a + b * b + c * c);
    outBox.innerHTML = `
      <strong>📦 Kết quả phân tích hình học:</strong><br>
      • Kích thước: $AB = ${a}$, $AD = ${b}$, $AA' = ${c}$<br>
      • Độ dài đường chéo không gian: $|\\overrightarrow{AC'}| = \\sqrt{AB^2 + AD^2 + AA'^2} = \\sqrt{${a}^2 + ${b}^2 + ${c}^2} \\approx \\mathbf{${diagLen.toFixed(2)}}$<br>
      • Quy tắc hình hộp: $\\overrightarrow{AC'} = \\overrightarrow{AB} + \\overrightarrow{AD} + \\overrightarrow{AA'}$.
    `;
    renderMathInTree(outBox);

    // Unlock badge 2
    if (!appState.badges[1]) {
      unlockBadge(1);
    }
  }

  [lenSlider, widSlider, heiSlider, yawSlider].forEach(slider => {
    slider.addEventListener('input', drawBox);
  });

  drawBox();
}

// ==========================================
// LAB 2: MÁY TÍNH GÓC & TÍCH VÔ HƯỚNG
// ==========================================
function initLab2() {
  const canvas = document.getElementById('dotCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const aSlider = document.getElementById('vecALen');
  const bSlider = document.getElementById('vecBLen');
  const angSlider = document.getElementById('vecAngle');

  const aLenVal = document.getElementById('aLenVal');
  const bLenVal = document.getElementById('bLenVal');
  const angVal = document.getElementById('angleVal');
  const outDot = document.getElementById('dotOutput');

  function drawDotProduct() {
    const la = parseFloat(aSlider.value);
    const lb = parseFloat(bSlider.value);
    const deg = parseFloat(angSlider.value);
    const rad = (deg * Math.PI) / 180;

    aLenVal.textContent = la.toFixed(1);
    bLenVal.textContent = lb.toFixed(1);
    angVal.textContent = deg + '°';

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ox = canvas.width / 2 - 60;
    const oy = canvas.height / 2 + 50;
    const pxScale = 38;

    // Vector a along horizontal to the right
    const ax = ox + la * pxScale;
    const ay = oy;

    // Vector b rotated counter-clockwise by -rad (since canvas y is downward)
    const bx = ox + lb * pxScale * Math.cos(-rad);
    const by = oy + lb * pxScale * Math.sin(-rad);

    // Draw angle arc
    ctx.beginPath();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);
    const arcRadius = 45;
    ctx.arc(ox, oy, arcRadius, 0, -rad, true);
    ctx.stroke();
    ctx.setLineDash([]);

    // Arc text
    const midAngle = -rad / 2;
    const tx = ox + (arcRadius + 20) * Math.cos(midAngle);
    const ty = oy + (arcRadius + 20) * Math.sin(midAngle);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`${deg}°`, tx, ty);

    // Draw Vector a (Cyan)
    drawArrow(ox, oy, ax, ay, '#06b6d4', `a (|a|=${la})`);
    // Draw Vector b (Pink/Rose)
    drawArrow(ox, oy, bx, by, '#f43f5e', `b (|b|=${lb})`);

    // Origin point
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(ox, oy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText('O', ox - 18, oy + 16);

    function drawArrow(x1, y1, x2, y2, col, label) {
      ctx.strokeStyle = col;
      ctx.fillStyle = col;
      ctx.lineWidth = 3;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      const angle = Math.atan2(y2 - y1, x2 - x1);
      const headLen = 12;
      ctx.beginPath();
      ctx.moveTo(x2, y2);
      ctx.lineTo(x2 - headLen * Math.cos(angle - Math.PI / 6), y2 - headLen * Math.sin(angle - Math.PI / 6));
      ctx.lineTo(x2 - headLen * Math.cos(angle + Math.PI / 6), y2 - headLen * Math.sin(angle + Math.PI / 6));
      ctx.closePath();
      ctx.fill();

      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(label, x2 + 10, y2);
    }

    // Mathematical Dot Product
    const cosVal = Math.cos(rad);
    const dotProduct = la * lb * cosVal;

    let natureText = '';
    if (Math.abs(deg - 90) < 0.1) {
      natureText = '<span style="color: #10b981; font-weight: bold;">GÓC VUÔNG: Hai vectơ vuông góc với nhau ($\\vec{a} \\perp \\vec{b}$ $\\Leftrightarrow$ $\\vec{a} \\cdot \\vec{b} = 0$).</span>';
    } else if (deg < 90) {
      natureText = '<span style="color: #06b6d4; font-weight: bold;">GÓC NHỌN: Tích vô hướng dương ($\\vec{a} \\cdot \\vec{b} > 0$).</span>';
    } else {
      natureText = '<span style="color: #f43f5e; font-weight: bold;">GÓC TÙ: Tích vô hướng âm ($\\vec{a} \\cdot \\vec{b} < 0$).</span>';
    }

    outDot.innerHTML = `
      <strong>📐 Kết quả tính tích vô hướng:</strong><br>
      • Công thức: $\\vec{a} \\cdot \\vec{b} = |\\vec{a}| \\cdot |\\vec{b}| \\cdot \\cos\\alpha = ${la} \\cdot ${lb} \\cdot \\cos(${deg}^\\circ) = ${la} \\cdot ${lb} \\cdot (${cosVal.toFixed(3)})$<br>
      • Giá trị: $\\vec{a} \\cdot \\vec{b} = \\mathbf{${dotProduct.toFixed(2)}}$<br>
      • Nhận xét: ${natureText}
    `;
    renderMathInTree(outDot);

    // Unlock badge 3
    if (!appState.badges[2]) {
      unlockBadge(2);
    }
  }

  [aSlider, bSlider, angSlider].forEach(s => s.addEventListener('input', drawDotProduct));
  drawDotProduct();
}

// ==========================================
// TAB 3: ĐẤU TRƯỜNG SGK (10 CÂU TƯƠNG TÁC)
// ==========================================
function initArena() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  quizData.forEach((q, qIndex) => {
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

  // Retake button
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

  // Show explanation immediately
  const expBox = document.getElementById(`expBox-${q.id}`);
  if (expBox) {
    expBox.classList.add('show');
    renderMathInTree(expBox);
  }

  // Progress update
  const answeredCount = Object.keys(appState.answered).length;
  document.getElementById('arenaProgress').textContent = `${answeredCount}/${quizData.length}`;

  // Check badges 4 & 5
  if (appState.xp >= 160 && !appState.badges[3]) {
    unlockBadge(3);
  }

  if (answeredCount === quizData.length) {
    const summary = document.getElementById('arenaSummary');
    if (summary) {
      summary.style.display = 'block';
      const summaryText = document.getElementById('summaryText');
      summaryText.textContent = `Bạn đã hoàn thành 10/10 câu hỏi với tổng điểm ${appState.xp} XP!`;
    }
    // Check if 10/10 correct
    const correctCount = quizData.filter(item => {
      const userBtn = card.parentNode.querySelector(`#quizCard-${item.id} .quiz-opt-btn.correct:not([disabled])`);
      return userBtn;
    }).length;

    if (appState.xp >= 200 && !appState.badges[4]) {
      unlockBadge(4);
      sounds.playFanfare();
    }
  }
}

// Certificate and Avatar Modal
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
