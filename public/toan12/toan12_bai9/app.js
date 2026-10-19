// ==========================================
// TOÁN 12 - BÀI 9: KHOẢNG BIẾN THIÊN VÀ KHOẢNG TỨ PHÂN VỊ
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
  s = s.replace(/\\Delta_Q/g, '<mi>&Delta;</mi><msub><mi>Q</mi></msub>');
  s = s.replace(/\\Delta/g, '<mi>&Delta;</mi>');
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  s = s.replace(/\\cdot/g, '<mo>&sdot;</mo>');
  s = s.replace(/\\times/g, '<mo>&times;</mo>');
  s = s.replace(/\\approx/g, '<mo>&asymp;</mo>');
  s = s.replace(/\\le/g, '<mo>&le;</mo>');
  s = s.replace(/\\ge/g, '<mo>&ge;</mo>');
  s = s.replace(/\\sum\\limits_\{([^}]+)\}\^\{([^}]+)\}/g, '<munderover><mo>&sum;</mo><mrow>$1</mrow><mrow>$2</mrow></munderover>');
  s = s.replace(/([A-Za-z0-9]+)\_\{([^}]+)\}/g, '<msub><mi>$1</mi><mrow>$2</mrow></msub>');
  s = s.replace(/([A-Za-z0-9]+)\_([0-9a-zA-Z])/g, '<msub><mi>$1</mi><mi>$2</mi></msub>');
  return `<math ${isBlock ? 'display="block"' : ''}>${s}</math>`;
}

// App State Management
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Thống Kê',
  userTitle: 'Chuyên Gia Phân Tích Dữ Liệu 12',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// 10 SGK Arena Questions for Bài 9
const quizData = [
  {
    id: 1,
    title: "Câu 1 (Định nghĩa khoảng biến thiên mẫu ghép nhóm)",
    pts: 20,
    question: "Cho mẫu số liệu ghép nhóm gồm $k$ nhóm liên tiếp $[a_1; a_2), [a_2; a_3), \\dots, [a_k; a_{k+1})$. Khoảng biến thiên $R$ của mẫu số liệu ghép nhóm được tính bởi công thức nào?",
    options: [
      { text: "A. $R = a_{k+1} - a_1$", correct: true },
      { text: "B. $R = a_k - a_1$", correct: false },
      { text: "C. $R = a_{k+1} - a_2$", correct: false },
      { text: "D. $R = \\frac{a_{k+1} - a_1}{2}$", correct: false }
    ],
    explanation: "Theo định nghĩa SGK, khoảng biến thiên $R$ của mẫu số liệu ghép nhóm là hiệu số giữa đầu mút phải của nhóm cuối cùng ($a_{k+1}$) và đầu mút trái của nhóm đầu tiên ($a_1$), tức $R = a_{k+1} - a_1$."
  },
  {
    id: 2,
    title: "Câu 2 (Luyện tập 1 SGK - Khoảng biến thiên thời gian làm bài)",
    pts: 20,
    question: "Thời gian hoàn thành bài kiểm tra môn Toán của các bạn học sinh lớp 12C được chia thành các nhóm: $[25; 30)$, $[30; 35)$, $[35; 40)$, $[40; 45)$ (đơn vị: phút). Khoảng biến thiên $R$ của mẫu số liệu ghép nhóm này bằng:",
    options: [
      { text: "A. $20\\text{ phút}$", correct: true },
      { text: "B. $15\\text{ phút}$", correct: false },
      { text: "C. $25\\text{ phút}$", correct: false },
      { text: "D. $10\\text{ phút}$", correct: false }
    ],
    explanation: "Nhóm đầu tiên là $[25; 30)$ có đầu mút trái $a_1 = 25$. Nhóm cuối cùng là $[40; 45)$ có đầu mút phải $a_5 = 45$. Do đó khoảng biến thiên $R = 45 - 25 = 20\\text{ (phút)}$."
  },
  {
    id: 3,
    title: "Câu 3 (Định nghĩa khoảng tứ phân vị của mẫu ghép nhóm)",
    pts: 20,
    question: "Khoảng tứ phân vị của mẫu số liệu ghép nhóm, ký hiệu là $\\Delta_Q$, được xác định bởi công thức:",
    options: [
      { text: "A. $\\Delta_Q = Q_3 - Q_1$", correct: true },
      { text: "B. $\\Delta_Q = Q_3 + Q_1$", correct: false },
      { text: "C. $\\Delta_Q = Q_2 - Q_1$", correct: false },
      { text: "D. $\\Delta_Q = \\frac{Q_3 - Q_1}{2}$", correct: false }
    ],
    explanation: "Khoảng tứ phân vị của mẫu số liệu ghép nhóm là hiệu giữa tứ phân vị thứ ba $Q_3$ và tứ phân vị thứ nhất $Q_1$, tức $\\Delta_Q = Q_3 - Q_1$."
  },
  {
    id: 4,
    title: "Câu 4 (Quy tắc tìm nhóm chứa tứ phân vị thứ nhất)",
    pts: 20,
    question: "Một mẫu số liệu ghép nhóm có tổng kích thước mẫu là $n = 40$. Nhóm chứa tứ phân vị thứ nhất $Q_1$ là nhóm đầu tiên có tần số tích luỹ $cf$ thoả mãn điều kiện nào sau đây?",
    options: [
      { text: "A. $cf \\ge 10$", correct: true },
      { text: "B. $cf \\ge 20$", correct: false },
      { text: "C. $cf \\ge 30$", correct: false },
      { text: "D. $cf \\ge 5$", correct: false }
    ],
    explanation: "Vị trí của tứ phân vị thứ nhất là $\\frac{n}{4} = \\frac{40}{4} = 10$. Nhóm chứa $Q_1$ chính là nhóm đầu tiên có tần số tích luỹ $cf \\ge 10$."
  },
  {
    id: 5,
    title: "Câu 5 (Ví dụ 2 SGK - Xác định nhóm chứa tứ phân vị Q1)",
    pts: 20,
    question: "Thời gian chờ khám bệnh (phút) của $38$ bệnh nhân được cho trong bảng: $[0; 5)$ có $3$; $[5; 10)$ có $12$; $[10; 15)$ có $15$; $[15; 20)$ có $8$. Nhóm chứa tứ phân vị thứ nhất $Q_1$ là nhóm:",
    options: [
      { text: "A. $[5; 10)$", correct: true },
      { text: "B. $[0; 5)$", correct: false },
      { text: "C. $[10; 15)$", correct: false },
      { text: "D. $[15; 20)$", correct: false }
    ],
    explanation: "Kích thước mẫu $n = 38 \\Rightarrow \\frac{n}{4} = 9{,}5$. Bảng tần số tích luỹ: nhóm 1 có $cf_1 = 3 < 9{,}5$; nhóm 2 có $cf_2 = 3 + 12 = 15 \\ge 9{,}5$. Vậy nhóm chứa $Q_1$ là nhóm $[5; 10)$."
  },
  {
    id: 6,
    title: "Câu 6 (Ví dụ 2 SGK - Tính giá trị tứ phân vị thứ nhất Q1)",
    pts: 20,
    question: "Với mẫu số liệu ở Câu 5 ($n=38$, nhóm chứa $Q_1$ là $[5; 10)$ có tần số $m_2 = 12$, nhóm trước có $m_1 = 3$), giá trị của $Q_1$ xấp xỉ bằng:",
    options: [
      { text: "A. $7{,}71\\text{ phút}$", correct: true },
      { text: "B. $6{,}50\\text{ phút}$", correct: false },
      { text: "C. $8{,}25\\text{ phút}$", correct: false },
      { text: "D. $9{,}15\\text{ phút}$", correct: false }
    ],
    explanation: "Áp dụng công thức nội suy tứ phân vị: $Q_1 = 5 + \\frac{9{,}5 - 3}{12} \\cdot (10 - 5) = 5 + \\frac{6{,}5}{12} \\cdot 5 \\approx 7{,}71\\text{ (phút)}$."
  },
  {
    id: 7,
    title: "Câu 7 (Ví dụ 2 SGK - Tính giá trị tứ phân vị thứ ba Q3)",
    pts: 20,
    question: "Với mẫu số liệu ở Câu 5 ($n = 38$), giá trị của tứ phân vị thứ ba $Q_3$ bằng:",
    options: [
      { text: "A. $14{,}5\\text{ phút}$", correct: true },
      { text: "B. $12{,}5\\text{ phút}$", correct: false },
      { text: "C. $13{,}2\\text{ phút}$", correct: false },
      { text: "D. $15{,}0\\text{ phút}$", correct: false }
    ],
    explanation: "Ta có $\\frac{3n}{4} = \\frac{3 \\cdot 38}{4} = 28{,}5$. Tần số tích luỹ các nhóm: nhóm 1 là $3$, nhóm 2 là $15$, nhóm 3 ($[10; 15)$) là $30 \\ge 28{,}5$. Do đó $Q_3$ thuộc nhóm $[10; 15)$ với $m_3 = 15$, tổng tần số trước là $15$. Áp dụng công thức: $Q_3 = 10 + \\frac{28{,}5 - 15}{15} \\cdot (15 - 10) = 10 + \\frac{13{,}5}{15} \\cdot 5 = 10 + 4{,}5 = 14{,}5\\text{ (phút)}$."
  },
  {
    id: 8,
    title: "Câu 8 (Ví dụ 2 SGK - Tính khoảng tứ phân vị delta_Q)",
    pts: 20,
    question: "Với $Q_1 \\approx 7{,}71$ và $Q_3 = 14{,}5$, khoảng tứ phân vị $\\Delta_Q$ của mẫu thời gian chờ khám bệnh phòng khám X bằng:",
    options: [
      { text: "A. $6{,}79\\text{ phút}$", correct: true },
      { text: "B. $22{,}21\\text{ phút}$", correct: false },
      { text: "C. $7{,}29\\text{ phút}$", correct: false },
      { text: "D. $5{,}80\\text{ phút}$", correct: false }
    ],
    explanation: "Khoảng tứ phân vị: $\\Delta_Q = Q_3 - Q_1 = 14{,}5 - 7{,}71 = 6{,}79\\text{ (phút)}$."
  },
  {
    id: 9,
    title: "Câu 9 (So sánh mức độ phân tán giữa hai phòng khám)",
    pts: 20,
    question: "Biết phòng khám X có khoảng tứ phân vị $\\Delta_{Q_X} = 6{,}79\\text{ phút}$ và phòng khám Y có $\\Delta_{Q_Y} = 9{,}23\\text{ phút}$. Kết luận nào sau đây là **đúng**?",
    options: [
      { text: "A. Thời gian chờ khám bệnh tại phòng khám Y có độ phân tán lớn hơn (biến động nhiều hơn) so với phòng khám X.", correct: true },
      { text: "B. Thời gian chờ khám bệnh tại phòng khám X có độ phân tán lớn hơn phòng khám Y.", correct: false },
      { text: "C. Thời gian chờ khám tại hai phòng khám có độ phân tán như nhau.", correct: false },
      { text: "D. Số lượng bệnh nhân tại phòng khám Y chắc chắn đông hơn phòng khám X.", correct: false }
    ],
    explanation: "Khoảng tứ phân vị đo mức độ phân tán của $50\\%$ số liệu chính giữa. Do $\\Delta_{Q_Y} = 9{,}23 > \\Delta_{Q_X} = 6{,}79$ nên thời gian chờ tại phòng khám Y có độ phân tán lớn hơn (mức độ chênh lệch thời gian chờ cao hơn, kém ổn định hơn phòng khám X)."
  },
  {
    id: 10,
    title: "Câu 10 (Ưu điểm của khoảng tứ phân vị so với khoảng biến thiên)",
    pts: 20,
    question: "Tại sao trong thực tế, khoảng tứ phân vị $\\Delta_Q$ thường được ưu tiên sử dụng để đo độ phân tán hơn khoảng biến thiên $R$?",
    options: [
      { text: "A. Vì khoảng tứ phân vị không bị ảnh hưởng bởi các giá trị bất thường (ngoại lai quá lớn hoặc quá bé).", correct: true },
      { text: "B. Vì khoảng tứ phân vị luôn luôn có giá trị lớn hơn khoảng biến thiên.", correct: false },
      { text: "C. Vì khoảng tứ phân vị sử dụng toàn bộ $100\\%$ các số liệu ở hai đầu mút.", correct: false },
      { text: "D. Vì công thức tính khoảng tứ phân vị đơn giản hơn khoảng biến thiên.", correct: false }
    ],
    explanation: "Khoảng biến thiên $R$ chỉ phụ thuộc vào giá trị mút đầu và mút cuối nên rất dễ bị sai lệch khi xuất hiện các giá trị ngoại lai cực đoan (outliers). Trong khi đó, khoảng tứ phân vị $\\Delta_Q = Q_3 - Q_1$ chỉ xét $50\\%$ số liệu chính giữa nên hoàn toàn miễn nhiễm với các giá trị bất thường."
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
    if (confirm('Làm mới lại tiến trình học tập bài 9?')) {
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
// LAB 1: BIỂU ĐỒ CỘT TẦN SỐ & KHOẢNG BIẾN THIÊN R
// ==========================================
function initLab1() {
  const canvas = document.getElementById('histCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const s1 = document.getElementById('freqGroup1');
  const s2 = document.getElementById('freqGroup2');
  const s3 = document.getElementById('freqGroup3');
  const s4 = document.getElementById('freqGroup4');

  const v1 = document.getElementById('valF1');
  const v2 = document.getElementById('valF2');
  const v3 = document.getElementById('valF3');
  const v4 = document.getElementById('valF4');
  const outHist = document.getElementById('histOutput');

  function drawHist() {
    const f1 = parseInt(s1.value);
    const f2 = parseInt(s2.value);
    const f3 = parseInt(s3.value);
    const f4 = parseInt(s4.value);

    v1.textContent = f1;
    v2.textContent = f2;
    v3.textContent = f3;
    v4.textContent = f4;

    const freqs = [f1, f2, f3, f4];
    const groups = ['[20; 25)', '[25; 30)', '[30; 35)', '[35; 40)'];
    const totalN = f1 + f2 + f3 + f4;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const padLeft = 70;
    const padBottom = 50;
    const chartW = canvas.width - padLeft - 40;
    const chartH = canvas.height - padBottom - 40;
    const maxFreq = Math.max(20, Math.max(...freqs) + 4);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let f = 0; f <= maxFreq; f += 5) {
      const y = canvas.height - padBottom - (f / maxFreq) * chartH;
      ctx.beginPath();
      ctx.moveTo(padLeft, y);
      ctx.lineTo(canvas.width - 40, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(f, padLeft - 25, y + 4);
    }

    // Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padLeft, 20);
    ctx.lineTo(padLeft, canvas.height - padBottom);
    ctx.lineTo(canvas.width - 30, canvas.height - padBottom);
    ctx.stroke();

    // Bars
    const barW = chartW / 4;
    const colors = ['#06b6d4', '#3b82f6', '#6366f1', '#10b981'];

    freqs.forEach((freq, idx) => {
      const x = padLeft + idx * barW + 15;
      const barHeight = (freq / maxFreq) * chartH;
      const y = canvas.height - padBottom - barHeight;

      // Fill bar gradient
      const grad = ctx.createLinearGradient(x, y, x, canvas.height - padBottom);
      grad.addColorStop(0, colors[idx]);
      grad.addColorStop(1, 'rgba(30, 27, 75, 0.6)');
      ctx.fillStyle = grad;
      ctx.fillRect(x, y, barW - 30, barHeight);

      // Bar border
      ctx.strokeStyle = colors[idx];
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x, y, barW - 30, barHeight);

      // Value label on top
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(freq, x + (barW - 30) / 2 - 6, y - 8);

      // Group label below
      ctx.fillStyle = '#cbd5e1';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(groups[idx], x + 5, canvas.height - padBottom + 20);
    });

    // Range calculation
    const rVal = 40 - 20;
    outHist.innerHTML = `
      <strong>📊 Phân tích thống kê & Khoảng biến thiên $R$:</strong><br>
      • Tổng số học sinh: $n = ${f1} + ${f2} + ${f3} + ${f4} = \\mathbf{${totalN}}$ học sinh.<br>
      • Đầu mút trái nhóm đầu tiên: $a_1 = 20$; Đầu mút phải nhóm cuối cùng: $a_5 = 40$.<br>
      • Khoảng biến thiên của mẫu ghép nhóm: $R = a_5 - a_1 = 40 - 20 = \\mathbf{${rVal}}$ điểm.<br>
      • Nhận xét: Dữ liệu phân tán trải rộng trong khoảng $20$ đơn vị điểm từ $20$ đến $40$.
    `;
    renderMathInTree(outHist);

    if (!appState.badges[1]) unlockBadge(1);
  }

  [s1, s2, s3, s4].forEach(s => s.addEventListener('input', drawHist));
  drawHist();
}

// ==========================================
// LAB 2: MÁY TÍNH TỨ PHÂN VỊ & BIỂU ĐỒ HỘP (BOX PLOT)
// ==========================================
function initLab2() {
  const canvas = document.getElementById('boxPlotCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const presetSelect = document.getElementById('samplePreset');
  const outBoxPlot = document.getElementById('boxPlotOutput');

  const presets = {
    sgk1: {
      name: "Thời gian chờ khám bệnh (Phòng X)",
      groups: [[0, 5], [5, 10], [10, 15], [15, 20]],
      freqs: [3, 12, 15, 8],
      unit: "phút"
    },
    sgk2: {
      name: "Thời gian làm bài kiểm tra Toán 12C",
      groups: [[25, 30], [30, 35], [35, 40], [40, 45]],
      freqs: [8, 16, 4, 2],
      unit: "phút"
    },
    sgk3: {
      name: "Nhiệt độ cao nhất trong ngày tháng 6/2022",
      groups: [[28, 30], [30, 32], [32, 34], [34, 36], [36, 38], [38, 40]],
      freqs: [2, 3, 4, 11, 8, 2],
      unit: "°C"
    }
  };

  function updateBoxPlot() {
    const data = presets[presetSelect.value] || presets.sgk1;
    const n = data.freqs.reduce((a, b) => a + b, 0);

    // Compute cumulative frequencies
    const cf = [];
    let cum = 0;
    data.freqs.forEach(f => {
      cum += f;
      cf.push(cum);
    });

    // Compute Q1
    const targetQ1 = n / 4;
    let idxQ1 = cf.findIndex(val => val >= targetQ1);
    const prevCfQ1 = idxQ1 === 0 ? 0 : cf[idxQ1 - 1];
    const gQ1 = data.groups[idxQ1];
    const q1Val = gQ1[0] + ((targetQ1 - prevCfQ1) / data.freqs[idxQ1]) * (gQ1[1] - gQ1[0]);

    // Compute Q2 (Median)
    const targetQ2 = n / 2;
    let idxQ2 = cf.findIndex(val => val >= targetQ2);
    const prevCfQ2 = idxQ2 === 0 ? 0 : cf[idxQ2 - 1];
    const gQ2 = data.groups[idxQ2];
    const q2Val = gQ2[0] + ((targetQ2 - prevCfQ2) / data.freqs[idxQ2]) * (gQ2[1] - gQ2[0]);

    // Compute Q3
    const targetQ3 = (3 * n) / 4;
    let idxQ3 = cf.findIndex(val => val >= targetQ3);
    const prevCfQ3 = idxQ3 === 0 ? 0 : cf[idxQ3 - 1];
    const gQ3 = data.groups[idxQ3];
    const q3Val = gQ3[0] + ((targetQ3 - prevCfQ3) / data.freqs[idxQ3]) * (gQ3[1] - gQ3[0]);

    const deltaQ = q3Val - q1Val;
    const minVal = data.groups[0][0];
    const maxVal = data.groups[data.groups.length - 1][1];

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Box Plot
    const ox = 70;
    const chartW = canvas.width - 140;
    const chartMidY = canvas.height / 2 - 20;

    function scaleX(val) {
      return ox + ((val - minVal) / (maxVal - minVal)) * chartW;
    }

    // Number line axis
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(ox, chartMidY + 70);
    ctx.lineTo(ox + chartW, chartMidY + 70);
    ctx.stroke();

    // Scale ticks
    data.groups.forEach(g => {
      const px = scaleX(g[0]);
      ctx.beginPath();
      ctx.moveTo(px, chartMidY + 65);
      ctx.lineTo(px, chartMidY + 75);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.font = '11px Inter, sans-serif';
      ctx.fillText(g[0], px - 8, chartMidY + 92);
    });
    // Last tick
    const pLast = scaleX(maxVal);
    ctx.beginPath();
    ctx.moveTo(pLast, chartMidY + 65);
    ctx.lineTo(pLast, chartMidY + 75);
    ctx.stroke();
    ctx.fillText(maxVal, pLast - 8, chartMidY + 92);

    // Whiskers (from min to Q1, and Q3 to max)
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 3]);

    const pMin = scaleX(minVal);
    const pQ1 = scaleX(q1Val);
    const pQ2 = scaleX(q2Val);
    const pQ3 = scaleX(q3Val);
    const pMax = scaleX(maxVal);

    // Left whisker
    ctx.beginPath();
    ctx.moveTo(pMin, chartMidY);
    ctx.lineTo(pQ1, chartMidY);
    ctx.stroke();

    // Right whisker
    ctx.beginPath();
    ctx.moveTo(pQ3, chartMidY);
    ctx.lineTo(pMax, chartMidY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Whisker caps
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pMin, chartMidY - 15);
    ctx.lineTo(pMin, chartMidY + 15);
    ctx.moveTo(pMax, chartMidY - 15);
    ctx.lineTo(pMax, chartMidY + 15);
    ctx.stroke();

    // Central Box (from Q1 to Q3)
    const boxH = 60;
    const boxY = chartMidY - boxH / 2;
    const boxW = pQ3 - pQ1;

    const boxGrad = ctx.createLinearGradient(pQ1, boxY, pQ3, boxY + boxH);
    boxGrad.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    boxGrad.addColorStop(1, 'rgba(6, 182, 212, 0.4)');
    ctx.fillStyle = boxGrad;
    ctx.fillRect(pQ1, boxY, boxW, boxH);

    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    ctx.strokeRect(pQ1, boxY, boxW, boxH);

    // Median Q2 line inside box (Gold glowing)
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(pQ2, boxY);
    ctx.lineTo(pQ2, boxY + boxH);
    ctx.stroke();

    // Labels for Q1, Q2, Q3
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`Q1 = ${q1Val.toFixed(2)}`, pQ1 - 25, boxY - 14);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`Q2(Med) = ${q2Val.toFixed(2)}`, pQ2 - 35, boxY + boxH + 24);

    ctx.fillStyle = '#10b981';
    ctx.fillText(`Q3 = ${q3Val.toFixed(2)}`, pQ3 - 20, boxY - 14);

    // Delta_Q curly bracket or span bar
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pQ1, boxY - 26);
    ctx.lineTo(pQ3, boxY - 26);
    ctx.stroke();
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`ΔQ = ${deltaQ.toFixed(2)} ${data.unit}`, (pQ1 + pQ3) / 2 - 40, boxY - 32);

    outBoxPlot.innerHTML = `
      <strong>📦 Kết quả phân tích Tứ phân vị & Độ phân tán:</strong><br>
      • Cỡ mẫu: $n = ${n}$ (${data.name})<br>
      • Vị trí $Q_1$: $\\frac{n}{4} = ${targetQ1} \\Rightarrow Q_1 \\approx \\mathbf{${q1Val.toFixed(2)}}$ ${data.unit}<br>
      • Trung vị $Q_2$: $\\frac{n}{2} = ${targetQ2} \\Rightarrow Q_2 \\approx \\mathbf{${q2Val.toFixed(2)}}$ ${data.unit}<br>
      • Vị trí $Q_3$: $\\frac{3n}{4} = ${targetQ3} \\Rightarrow Q_3 \\approx \\mathbf{${q3Val.toFixed(2)}}$ ${data.unit}<br>
      • Khoảng tứ phân vị: $\\Delta_Q = Q_3 - Q_1 = ${q3Val.toFixed(2)} - ${q1Val.toFixed(2)} = \\mathbf{${deltaQ.toFixed(2)}}$ ${data.unit}<br>
      • Vùng giá trị bình thường: $[Q_1 - 1{,}5\\Delta_Q; Q_3 + 1{,}5\\Delta_Q] = [${(q1Val - 1.5*deltaQ).toFixed(2)}; ${(q3Val + 1.5*deltaQ).toFixed(2)}]$.
    `;
    renderMathInTree(outBoxPlot);

    if (!appState.badges[2]) unlockBadge(2);
  }

  presetSelect.addEventListener('change', updateBoxPlot);
  updateBoxPlot();
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
