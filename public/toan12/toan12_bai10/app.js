// ==========================================
// TOÁN 12 - BÀI 10: PHƯƠNG SAI VÀ ĐỘ LỆCH CHUẨN
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
  s = s.replace(/\\bar\{x\}/g, '<mover accent="true"><mi>x</mi><mo>&macr;</mo></mover>');
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  s = s.replace(/\\cdot/g, '<mo>&sdot;</mo>');
  s = s.replace(/\\times/g, '<mo>&times;</mo>');
  s = s.replace(/\\approx/g, '<mo>&asymp;</mo>');
  s = s.replace(/\\le/g, '<mo>&le;</mo>');
  s = s.replace(/\\ge/g, '<mo>&ge;</mo>');
  s = s.replace(/\\sum\\limits_\{([^}]+)\}\^\{([^}]+)\}/g, '<munderover><mo>&sum;</mo><mrow>$1</mrow><mrow>$2</mrow></munderover>');
  s = s.replace(/([A-Za-z0-9]+)\_\{([^}]+)\}/g, '<msub><mi>$1</mi><mrow>$2</mrow></msub>');
  s = s.replace(/([A-Za-z0-9]+)\^\{([^}]+)\}/g, '<msup><mi>$1</mi><mrow>$2</mrow></msup>');
  s = s.replace(/([A-Za-z0-9]+)\^([0-9a-zA-Z])/g, '<msup><mi>$1</mi><mi>$2</mi></msup>');
  s = s.replace(/([A-Za-z0-9]+)\_([0-9a-zA-Z])/g, '<msub><mi>$1</mi><mi>$2</mi></msub>');
  return `<math ${isBlock ? 'display="block"' : ''}>${s}</math>`;
}

// App State Management
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Phương Sai',
  userTitle: 'Chuyên Gia Quản Trị Rủi Ro 12',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// 10 SGK Arena Questions for Bài 10
const quizData = [
  {
    id: 1,
    title: "Câu 1 (Giá trị đại diện của nhóm số liệu)",
    pts: 20,
    question: "Trong mẫu số liệu ghép nhóm, giá trị đại diện của nhóm $[a; b)$ được tính theo công thức nào sau đây?",
    options: [
      { text: "A. $x = \\frac{a + b}{2}$", correct: true },
      { text: "B. $x = b - a$", correct: false },
      { text: "C. $x = \\sqrt{a \\cdot b}$", correct: false },
      { text: "D. $x = \\frac{b - a}{2}$", correct: false }
    ],
    explanation: "Giá trị đại diện của nhóm $[a; b)$ là trung điểm của nửa khoảng đó, tức là trung bình cộng hai đầu mút: $x = \\frac{a + b}{2}$."
  },
  {
    id: 2,
    title: "Câu 2 (Công thức số trung bình mẫu ghép nhóm)",
    pts: 20,
    question: "Cho mẫu số liệu ghép nhóm gồm $k$ nhóm có giá trị đại diện $x_1, \\dots, x_k$ và tần số tương ứng $m_1, \\dots, m_k$. Công thức tính số trung bình $\\bar{x}$ là:",
    options: [
      { text: "A. $\\bar{x} = \\frac{m_1 x_1 + m_2 x_2 + \\dots + m_k x_k}{n}$", correct: true },
      { text: "B. $\\bar{x} = \\frac{x_1 + x_2 + \\dots + x_k}{k}$", correct: false },
      { text: "C. $\\bar{x} = \\frac{m_1 + m_2 + \\dots + m_k}{n}$", correct: false },
      { text: "D. $\\bar{x} = \\sqrt{\\frac{m_1 x_1^2 + \\dots + m_k x_k^2}{n}}$", correct: false }
    ],
    explanation: "Số trung bình của mẫu số liệu ghép nhóm là trung bình cộng có trọng số của các giá trị đại diện: $\\bar{x} = \\frac{1}{n}\\sum\\limits_{i=1}^k m_i x_i = \\frac{m_1 x_1 + m_2 x_2 + \\dots + m_k x_k}{n}$."
  },
  {
    id: 3,
    title: "Câu 3 (Công thức rút gọn tính phương sai s^2)",
    pts: 20,
    question: "Công thức rút gọn tính nhanh phương sai $s^2$ của mẫu số liệu ghép nhóm là:",
    options: [
      { text: "A. $s^2 = \\frac{1}{n}\\left(\\sum\\limits_{i=1}^k m_i x_i^2\\right) - (\\bar{x})^2$", correct: true },
      { text: "B. $s^2 = \\frac{1}{n}\\left(\\sum\\limits_{i=1}^k m_i x_i\\right) - \\bar{x}$", correct: false },
      { text: "C. $s^2 = \\frac{1}{n}\\left(\\sum\\limits_{i=1}^k m_i x_i^2\\right) + (\\bar{x})^2$", correct: false },
      { text: "D. $s^2 = \\sqrt{\\frac{1}{n}\\sum\\limits_{i=1}^k m_i x_i^2} - \\bar{x}$", correct: false }
    ],
    explanation: "Theo biến đổi toán học: $s^2 = \\frac{1}{n}\\sum m_i(x_i - \\bar{x})^2 = \\frac{1}{n}\\left(\\sum m_i x_i^2\\right) - (\\bar{x})^2$."
  },
  {
    id: 4,
    title: "Câu 4 (Độ lệch chuẩn s và phương sai)",
    pts: 20,
    question: "Độ lệch chuẩn $s$ của mẫu số liệu ghép nhóm có mối liên hệ với phương sai $s^2$ theo công thức:",
    options: [
      { text: "A. $s = \\sqrt{s^2}$", correct: true },
      { text: "B. $s = (s^2)^2$", correct: false },
      { text: "C. $s = \\frac{s^2}{2}$", correct: false },
      { text: "D. $s = \\frac{s^2}{n}$", correct: false }
    ],
    explanation: "Độ lệch chuẩn là căn bậc hai số học của phương sai: $s = \\sqrt{s^2}$. Độ lệch chuẩn có cùng đơn vị đo với đại lượng đang xét."
  },
  {
    id: 5,
    title: "Câu 5 (Luyện tập SGK - Giá trị đại diện thời gian chạy)",
    pts: 20,
    question: "Một vận động viên luyện tập chạy cự li $100\\text{ m}$ có thành tích được thống kê vào nhóm $[10{,}4; 10{,}6)$ (giây). Giá trị đại diện của nhóm này là:",
    options: [
      { text: "A. $10{,}5\\text{ giây}$", correct: true },
      { text: "B. $10{,}4\\text{ giây}$", correct: false },
      { text: "C. $10{,}6\\text{ giây}$", correct: false },
      { text: "D. $0{,}2\\text{ giây}$", correct: false }
    ],
    explanation: "Giá trị đại diện của nhóm $[10{,}4; 10{,}6)$ là $x = \\frac{10{,}4 + 10{,}6}{2} = 10{,}5\\text{ (giây)}$."
  },
  {
    id: 6,
    title: "Câu 6 (Luyện tập SGK - Tính số trung bình thời gian chạy)",
    pts: 20,
    question: "Cho mẫu số liệu chạy $100\\text{ m}$ ($n=20$): $[10{,}2; 10{,}4)$ có $3$ lần; $[10{,}4; 10{,}6)$ có $7$ lần; $[10{,}6; 10{,}8)$ có $8$ lần; $[10{,}8; 11{,}0)$ có $2$ lần. Thời gian chạy trung bình $\\bar{x}$ bằng:",
    options: [
      { text: "A. $10{,}59\\text{ giây}$", correct: true },
      { text: "B. $10{,}65\\text{ giây}$", correct: false },
      { text: "C. $10{,}50\\text{ giây}$", correct: false },
      { text: "D. $10{,}72\\text{ giây}$", correct: false }
    ],
    explanation: "Giá trị đại diện các nhóm: $10{,}3; 10{,}5; 10{,}7; 10{,}9$. Tổng: $\\sum m_i x_i = 3(10{,}3) + 7(10{,}5) + 8(10{,}7) + 2(10{,}9) = 30{,}9 + 73{,}5 + 85{,}6 + 21{,}8 = 211{,}8$. Do đó: $\\bar{x} = \\frac{211{,}8}{20} = 10{,}59\\text{ (giây)}$."
  },
  {
    id: 7,
    title: "Câu 7 (Luyện tập SGK - Tính phương sai s^2)",
    pts: 20,
    question: "Với mẫu số liệu ở Câu 6 ($\\bar{x} = 10{,}59$), phương sai $s^2$ của mẫu số liệu ghép nhóm xấp xỉ bằng:",
    options: [
      { text: "A. $0{,}03\\text{ giây}^2$", correct: true },
      { text: "B. $0{,}17\\text{ giây}^2$", correct: false },
      { text: "C. $0{,}30\\text{ giây}^2$", correct: false },
      { text: "D. $1{,}12\\text{ giây}^2$", correct: false }
    ],
    explanation: "Ta có $\\sum m_i x_i^2 = 3(10{,}3^2) + 7(10{,}5^2) + 8(10{,}7^2) + 2(10{,}9^2) = 2243{,}56$. Áp dụng công thức: $s^2 = \\frac{2243{,}56}{20} - 10{,}59^2 = 112{,}178 - 112{,}1481 = 0{,}0299 \\approx 0{,}03$."
  },
  {
    id: 8,
    title: "Câu 8 (Luyện tập SGK - Tính độ lệch chuẩn s)",
    pts: 20,
    question: "Với phương sai $s^2 \\approx 0{,}0299$, độ lệch chuẩn $s$ của thời gian chạy $100\\text{ m}$ xấp xỉ bằng:",
    options: [
      { text: "A. $0{,}173\\text{ giây}$", correct: true },
      { text: "B. $0{,}030\\text{ giây}$", correct: false },
      { text: "C. $0{,}546\\text{ giây}$", correct: false },
      { text: "D. $0{,}250\\text{ giây}$", correct: false }
    ],
    explanation: "Độ lệch chuẩn: $s = \\sqrt{s^2} = \\sqrt{0{,}0299} \\approx 0{,}173\\text{ (giây)}$."
  },
  {
    id: 9,
    title: "Câu 9 (Ví dụ 2 SGK - So sánh mức độ rủi ro trong đầu tư)",
    pts: 20,
    question: "Hai lĩnh vực đầu tư A và B cùng có lợi nhuận trung bình hàng tháng là $\\bar{x} = 17{,}5\\text{ triệu đồng}$. Biết độ lệch chuẩn của lĩnh vực A là $s_A = 5\\text{ triệu đồng}$, của lĩnh vực B là $s_B \\approx 8{,}42\\text{ triệu đồng}$. Nhận định nào sau đây là **đúng**?",
    options: [
      { text: "A. Đầu tư vào lĩnh vực B rủi ro hơn lĩnh vực A vì có độ lệch chuẩn lớn hơn ($s_B > s_A$).", correct: true },
      { text: "B. Đầu tư vào lĩnh vực A rủi ro hơn lĩnh vực B.", correct: false },
      { text: "C. Hai lĩnh vực có mức độ rủi ro như nhau vì cùng có lợi nhuận trung bình $17{,}5\\text{ triệu}$.", correct: false },
      { text: "D. Đầu tư vào lĩnh vực B chắc chắn đem lại lợi nhuận cao hơn lĩnh vực A.", correct: false }
    ],
    explanation: "Trong tài chính, độ lệch chuẩn đo mức độ biến động của lợi nhuận quanh mức trung bình. Độ lệch chuẩn càng lớn thì biên độ dao động càng rộng, tức mức độ rủi ro càng cao. Do $s_B \\approx 8{,}42 > s_A = 5$ nên đầu tư vào lĩnh vực B rủi ro hơn."
  },
  {
    id: 10,
    title: "Câu 10 (Bài 3.17 SGK - So sánh độ ổn định của hai vôn kế)",
    pts: 20,
    question: "An và Bình dùng hai chiếc vôn kế khác nhau để đo hiệu điện thế của cùng một mạch điện 10 lần. Kết quả cho thấy độ lệch chuẩn số đo của An là $s_A = 0{,}03\\text{ V}$, của Bình là $s_B = 0{,}07\\text{ V}$. Kết luận nào sau đây là **đúng**?",
    options: [
      { text: "A. Vôn kế của An cho kết quả đo ổn định hơn vôn kế của Bình vì có độ lệch chuẩn nhỏ hơn.", correct: true },
      { text: "B. Vôn kế của Bình cho kết quả đo ổn định hơn vôn kế của An.", correct: false },
      { text: "C. Hai vôn kế cho kết quả đo ổn định như nhau.", correct: false },
      { text: "D. Vôn kế của Bình đo được hiệu điện thế lớn hơn vôn kế của An.", correct: false }
    ],
    explanation: "Độ lệch chuẩn đo mức độ phân tán quanh số trung bình. Độ lệch chuẩn càng nhỏ thì các lần đo càng tập trung sát giá trị trung bình, tức thiết bị đo có độ ổn định và độ tin cậy cao hơn. Vì $s_A = 0{,}03 < s_B = 0{,}07$ nên vôn kế của An cho kết quả đo ổn định hơn."
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
    if (confirm('Làm mới lại tiến trình học tập bài 10?')) {
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
// LAB 1: MÁY TÍNH BẢNG PHƯƠNG SAI TỰ ĐỘNG
// ==========================================
function initLab1() {
  const canvas = document.getElementById('varianceCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const s1 = document.getElementById('fRun1');
  const s2 = document.getElementById('fRun2');
  const s3 = document.getElementById('fRun3');
  const s4 = document.getElementById('fRun4');

  const v1 = document.getElementById('valRun1');
  const v2 = document.getElementById('valRun2');
  const v3 = document.getElementById('valRun3');
  const v4 = document.getElementById('valRun4');
  const outVar = document.getElementById('varianceOutput');

  function calculateVariance() {
    const m1 = parseInt(s1.value);
    const m2 = parseInt(s2.value);
    const m3 = parseInt(s3.value);
    const m4 = parseInt(s4.value);

    v1.textContent = m1;
    v2.textContent = m2;
    v3.textContent = m3;
    v4.textContent = m4;

    const groups = [
      { name: '[10.2; 10.4)', x: 10.3, m: m1 },
      { name: '[10.4; 10.6)', x: 10.5, m: m2 },
      { name: '[10.6; 10.8)', x: 10.7, m: m3 },
      { name: '[10.8; 11.0)', x: 10.9, m: m4 }
    ];

    const n = m1 + m2 + m3 + m4;
    let sumMx = 0;
    let sumMx2 = 0;

    groups.forEach(g => {
      sumMx += g.m * g.x;
      sumMx2 += g.m * g.x * g.x;
    });

    const xBar = sumMx / n;
    const variance = (sumMx2 / n) - (xBar * xBar);
    const stdDev = Math.sqrt(Math.max(0, variance));

    // Render Canvas Visualization: Bar chart comparing deviations
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padLeft = 60;
    const padBottom = 50;
    const chartW = canvas.width - padLeft - 40;
    const chartH = canvas.height - padBottom - 40;
    const maxM = Math.max(15, Math.max(m1, m2, m3, m4) + 3);

    // Draw Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(padLeft, 20);
    ctx.lineTo(padLeft, canvas.height - padBottom);
    ctx.lineTo(canvas.width - 30, canvas.height - padBottom);
    ctx.stroke();

    const barW = chartW / 4;
    const colors = ['#06b6d4', '#3b82f6', '#8b5cf6', '#ec4899'];

    groups.forEach((g, idx) => {
      const bx = padLeft + idx * barW + 15;
      const bH = (g.m / maxM) * chartH;
      const by = canvas.height - padBottom - bH;

      ctx.fillStyle = colors[idx];
      ctx.fillRect(bx, by, barW - 30, bH);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(`m=${g.m}`, bx + 12, by - 8);

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`x=${g.x}`, bx + 14, canvas.height - padBottom + 18);
      ctx.fillText(g.name, bx + 2, canvas.height - padBottom + 34);
    });

    // Draw mean vertical dotted line
    const meanNorm = (xBar - 10.2) / (11.0 - 10.2);
    const meanCanvasX = padLeft + meanNorm * chartW;
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(meanCanvasX, 20);
    ctx.lineTo(meanCanvasX, canvas.height - padBottom);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`x̄ = ${xBar.toFixed(2)}s`, meanCanvasX + 6, 35);

    outVar.innerHTML = `
      <strong>🧮 Bảng tính phương sai và độ lệch chuẩn mẫu ghép nhóm:</strong><br>
      • Tổng số lần chạy: $n = ${n}$ lần.<br>
      • Tổng $\\sum m_i x_i = ${sumMx.toFixed(2)}$ $\\Rightarrow$ Số trung bình: $\\bar{x} = \\frac{${sumMx.toFixed(2)}}{${n}} = \\mathbf{${xBar.toFixed(3)}\\text{ giây}}$.<br>
      • Tổng $\\sum m_i x_i^2 = ${sumMx2.toFixed(2)}$ $\\Rightarrow$ Phương sai: $s^2 = \\frac{${sumMx2.toFixed(2)}}{${n}} - (${xBar.toFixed(3)})^2 = \\mathbf{${variance.toFixed(4)}\\text{ giây}^2}$.<br>
      • Độ lệch chuẩn: $s = \\sqrt{s^2} = \\sqrt{${variance.toFixed(4)}} \\approx \\mathbf{${stdDev.toFixed(3)}\\text{ giây}}$.
    `;
    renderMathInTree(outVar);

    if (!appState.badges[1]) unlockBadge(1);
  }

  [s1, s2, s3, s4].forEach(s => s.addEventListener('input', calculateVariance));
  calculateVariance();
}

// ==========================================
// LAB 2: MÔ PHỎNG ĐƯỜNG CHUÔNG ĐO ĐỘ RỦI RO
// ==========================================
function initLab2() {
  const canvas = document.getElementById('riskCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const sA = document.getElementById('sliderRiskA');
  const sB = document.getElementById('sliderRiskB');
  const vA = document.getElementById('valRiskA');
  const vB = document.getElementById('valRiskB');
  const outRisk = document.getElementById('riskOutput');

  function drawRiskCurves() {
    const stdA = parseFloat(sA.value);
    const stdB = parseFloat(sB.value);

    vA.textContent = stdA.toFixed(1);
    vB.textContent = stdB.toFixed(1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const ox = canvas.width / 2;
    const oy = canvas.height - 60;
    const mean = 17.5;
    const scaleX = 14;
    const scaleY = 3200;

    // Normal probability density function
    function normalPDF(x, s) {
      return (1 / (s * Math.sqrt(2 * Math.PI))) * Math.exp(-0.5 * Math.pow((x - mean) / s, 2));
    }

    // Draw coordinate axis
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(40, oy);
    ctx.lineTo(canvas.width - 40, oy);
    ctx.stroke();

    // Ticks on axis
    for (let xVal = 0; xVal <= 35; xVal += 5) {
      const px = ox + (xVal - mean) * scaleX;
      ctx.beginPath();
      ctx.moveTo(px, oy);
      ctx.lineTo(px, oy + 6);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(`${xVal} tr`, px - 12, oy + 22);
    }

    // Draw Curve A (Cyan, sharper peak, lower risk)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let px = 40; px <= canvas.width - 40; px += 2) {
      const xVal = mean + (px - ox) / scaleX;
      const yVal = normalPDF(xVal, stdA);
      const py = oy - yVal * scaleY;
      if (px === 40) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Draw Curve B (Rose, flatter, wider spread, higher risk)
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let px = 40; px <= canvas.width - 40; px += 2) {
      const xVal = mean + (px - ox) / scaleX;
      const yVal = normalPDF(xVal, stdB);
      const py = oy - yVal * scaleY;
      if (px === 40) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();

    // Legends
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`Lĩnh vực A (s_A = ${stdA.toFixed(1)} tr): Ổn định cao, rủi ro thấp`, 50, 40);

    ctx.fillStyle = '#f43f5e';
    ctx.fillText(`Lĩnh vực B (s_B = ${stdB.toFixed(1)} tr): Biến động lớn, rủi ro cao`, 50, 65);

    let compText = '';
    if (stdA < stdB) {
      compText = '<span style="color: #06b6d4; font-weight: bold;">Lĩnh vực A an toàn và ít rủi ro hơn lĩnh vực B</span> vì lợi nhuận tập trung sát giá trị trung bình $17{,}5\\text{ triệu}$.';
    } else if (stdA > stdB) {
      compText = '<span style="color: #f43f5e; font-weight: bold;">Lĩnh vực B an toàn và ít rủi ro hơn lĩnh vực A</span>.';
    } else {
      compText = 'Hai lĩnh vực có mức độ rủi ro tương đương nhau.';
    }

    outRisk.innerHTML = `
      <strong>📉 Đánh giá phân tích định lượng độ rủi ro tài chính:</strong><br>
      • Lợi nhuận trung bình kỳ vọng: $\\bar{x}_A = \\bar{x}_B = 17{,}5\\text{ triệu đồng/tháng}$.<br>
      • Độ lệch chuẩn lĩnh vực A: $s_A = \\mathbf{${stdA.toFixed(1)}}$ triệu; Lĩnh vực B: $s_B = \\mathbf{${stdB.toFixed(1)}}$ triệu.<br>
      • Nhận xét quản trị danh mục: ${compText}
    `;
    renderMathInTree(outRisk);

    if (!appState.badges[2]) unlockBadge(2);
  }

  sA.addEventListener('input', drawRiskCurves);
  sB.addEventListener('input', drawRiskCurves);
  drawRiskCurves();
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
