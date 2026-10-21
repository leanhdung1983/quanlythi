/**
 * BÀI 15: GIỚI HẠN CỦA DÃY SỐ - TOÁN 11 KẾT NỐI TRI THỨC
 * Pure Vanilla JavaScript ES6+ - Offline Ready - KaTeX & Web Audio API
 */

// ==========================================
// 1. ÂM THANH TỰ TỔNG HỢP (WEB AUDIO API)
// ==========================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) audioCtx = new AudioContextClass();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
  if (!appState.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function playCorrect() {
  if (!appState.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'triangle';
    osc2.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now);
    osc1.frequency.setValueAtTime(659.25, now + 0.1);
    osc2.frequency.setValueAtTime(783.99, now + 0.2);
    osc2.frequency.setValueAtTime(1046.50, now + 0.3);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.45);
  } catch (e) {}
}

function playWrong() {
  if (!appState.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.25);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
}

function playLevelUp() {
  if (!appState.sound) return;
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 'triangle', 0.18, 0.15), i * 90);
  });
}

function playFanfare() {
  if (!appState.sound) return;
  const melody = [
    { f: 523.25, d: 0.15 }, { f: 523.25, d: 0.15 }, { f: 523.25, d: 0.15 },
    { f: 659.25, d: 0.4 }, { f: 783.99, d: 0.25 }, { f: 1046.50, d: 0.6 }
  ];
  let delay = 0;
  melody.forEach(note => {
    setTimeout(() => playTone(note.f, 'triangle', note.d, 0.18), delay);
    delay += note.d * 900;
  });
}

// ==========================================
// 2. STATE HỆ THỐNG & AVATAR
// ==========================================
const AVATARS = [
  { id: 'logic', icon: '👑', name: 'Chiến Binh Logic', title: 'Đại Hiệp Dãy Số' },
  { id: 'zeno', icon: '🐢', name: 'Hiền Triết Zeno', title: 'Bậc Thầy Nghịch Lí' },
  { id: 'achilles', icon: '🏃', name: 'Dũng Sĩ Achilles', title: 'Tốc Độ Tiệm Cận' },
  { id: 'euler', icon: '📐', name: 'Nhà Giải Tích', title: 'Đại Sư Chuỗi Vô Hạn' },
  { id: 'cyber', icon: '⚡', name: 'Kỹ Sư Cyber', title: 'Chuyên Gia Tỉ Lệ Vàng' },
  { id: 'pharma', icon: '💊', name: 'Dược Sĩ Toán Học', title: 'Mô Hình Hóa Y Dược' },
  { id: 'astro', icon: '🚀', name: 'Phi Hành Gia', title: 'Thám Hiểm Vô Cực' },
  { id: 'owl', icon: '🦉', name: 'Cú Trí Tuệ', title: 'Hiền Triết Giới Hạn' }
];

const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Dãy Số & Giới Hạn',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// ==========================================
// 3. DỮ LIỆU ĐẤU TRƯỜNG SGK (10 CÂU TRẮC NGHIỆM)
// ==========================================
const quizData = [
  {
    id: 1,
    title: 'Câu 1: Định nghĩa giới hạn 0 của dãy số',
    pts: 20,
    question: 'Dãy số $(u_n)$ có giới hạn là $0$ khi $n \\to +\\infty$ nếu:',
    options: [
      { text: '$|u_n|$ luôn bằng $0$ với mọi số tự nhiên $n \\ge 1$.', correct: false },
      { text: '$|u_n|$ có thể nhỏ hơn một số dương bé tùy ý, kể từ một số hạng nào đó trở đi.', correct: true },
      { text: '$u_n$ là một số âm giảm dần vô hạn.', correct: false },
      { text: '$u_n$ không đổi với mọi giá trị của $n$.', correct: false }
    ],
    explanation: 'Theo định nghĩa SGK Toán 11: Dãy số $(u_n)$ có giới hạn là $0$ khi $n \\to +\\infty$ nếu $|u_n|$ có thể nhỏ hơn một số dương bé tùy ý, kể từ một số hạng nào đó trở đi. Kí hiệu: $\\lim\\limits_{n \\to +\\infty} u_n = 0$.'
  },
  {
    id: 2,
    title: 'Câu 2: Các giới hạn cơ bản thường dùng',
    pts: 20,
    question: 'Trong các giới hạn sau đây, giới hạn nào có kết quả SAI?',
    options: [
      { text: '$\\lim\\limits_{n \\to +\\infty} \\frac{1}{n^2} = 0$.', correct: false },
      { text: '$\\lim\\limits_{n \\to +\\infty} \\left(-\\frac{1}{3}\\right)^n = 0$.', correct: false },
      { text: '$\\lim\\limits_{n \\to +\\infty} \\left(\\frac{4}{3}\\right)^n = 0$.', correct: true },
      { text: '$\\lim\\limits_{n \\to +\\infty} 5 = 5$.', correct: false }
    ],
    explanation: 'Vì $q = \\frac{4}{3} > 1$ nên $\\lim\\limits_{n \\to +\\infty} \\left(\\frac{4}{3}\\right)^n = +\\infty$. Định lí $\\lim q^n = 0$ chỉ áp dụng khi $|q| < 1$.'
  },
  {
    id: 3,
    title: 'Câu 3: Giới hạn phân thức bậc hai (Bài 5.1a SGK)',
    pts: 20,
    question: 'Tính giới hạn của dãy số $\\lim\\limits_{n \\to +\\infty} \\frac{n^2 + n + 1}{2n^2 + 1}$:',
    options: [
      { text: '$0$', correct: false },
      { text: '$\\frac{1}{2}$', correct: true },
      { text: '$1$', correct: false },
      { text: '$+\\infty$', correct: false }
    ],
    explanation: 'Chia cả tử và mẫu cho lũy thừa bậc cao nhất $n^2$: $\\lim\\limits_{n \\to +\\infty} \\frac{1 + \\frac{1}{n} + \\frac{1}{n^2}}{2 + \\frac{1}{n^2}} = \\frac{1 + 0 + 0}{2 + 0} = \\frac{1}{2}$.'
  },
  {
    id: 4,
    title: 'Câu 4: Giới hạn nhân liên hợp căn thức (Bài 5.1b SGK)',
    pts: 20,
    question: 'Tính giới hạn của dãy số $\\lim\\limits_{n \\to +\\infty} (\\sqrt{n^2 + 2n} - n)$:',
    options: [
      { text: '$0$', correct: false },
      { text: '$1$', correct: true },
      { text: '$2$', correct: false },
      { text: '$+\\infty$', correct: false }
    ],
    explanation: 'Nhân lượng liên hợp: $\\lim\\limits_{n \\to +\\infty} \\frac{(n^2 + 2n) - n^2}{\\sqrt{n^2 + 2n} + n} = \\lim\\limits_{n \\to +\\infty} \\frac{2n}{n\\sqrt{1 + \\frac{2}{n}} + n} = \\lim\\limits_{n \\to +\\infty} \\frac{2}{\\sqrt{1 + \\frac{2}{n}} + 1} = \\frac{2}{1 + 1} = 1$.'
  },
  {
    id: 5,
    title: 'Câu 5: Phép toán giới hạn thương (Bài 5.2a SGK)',
    pts: 20,
    question: 'Cho $\\lim\\limits_{n \\to +\\infty} u_n = 2$ và $\\lim\\limits_{n \\to +\\infty} v_n = 3$. Giá trị của $\\lim\\limits_{n \\to +\\infty} \\frac{u_n^2}{v_n - u_n}$ bằng:',
    options: [
      { text: '$4$', correct: true },
      { text: '$2$', correct: false },
      { text: '$\\frac{4}{5}$', correct: false },
      { text: '$6$', correct: false }
    ],
    explanation: 'Áp dụng định lí giới hạn thương: $\\lim\\limits_{n \\to +\\infty} \\frac{u_n^2}{v_n - u_n} = \\frac{(\\lim u_n)^2}{\\lim v_n - \\lim u_n} = \\frac{2^2}{3 - 2} = \\frac{4}{1} = 4$.'
  },
  {
    id: 6,
    title: 'Câu 6: Phép toán khai căn giới hạn (Bài 5.2b SGK)',
    pts: 20,
    question: 'Cho hai dãy số không âm $(u_n), (v_n)$ có $\\lim\\limits_{n \\to +\\infty} u_n = 2$ và $\\lim\\limits_{n \\to +\\infty} v_n = 3$. Giá trị của $\\lim\\limits_{n \\to +\\infty} \\sqrt{u_n + 2v_n}$ bằng:',
    options: [
      { text: '$8$', correct: false },
      { text: '$2\\sqrt{2}$', correct: true },
      { text: '$4$', correct: false },
      { text: '$2$', correct: false }
    ],
    explanation: 'Ta có $\\lim (u_n + 2v_n) = 2 + 2 \\cdot 3 = 8 > 0$. Áp dụng định lí khai căn giới hạn: $\\lim\\limits_{n \\to +\\infty} \\sqrt{u_n + 2v_n} = \\sqrt{8} = 2\\sqrt{2}$.'
  },
  {
    id: 7,
    title: 'Câu 7: Giới hạn vô cực của dãy phân thức (Bài 5.3a SGK)',
    pts: 20,
    question: 'Tìm giới hạn của dãy số $u_n = \\frac{n^2 + 1}{2n - 1}$ khi $n \\to +\\infty$:',
    options: [
      { text: '$\\frac{1}{2}$', correct: false },
      { text: '$0$', correct: false },
      { text: '$+\\infty$', correct: true },
      { text: '$-\\infty$', correct: false }
    ],
    explanation: 'Đặt $n$ ra ngoài: $u_n = n \\cdot \\frac{1 + \\frac{1}{n^2}}{2 - \\frac{1}{n}}$. Vì $\\lim n = +\\infty$ và $\\lim \\frac{1 + \\frac{1}{n^2}}{2 - \\frac{1}{n}} = \\frac{1}{2} > 0$ nên $\\lim u_n = +\\infty$.'
  },
  {
    id: 8,
    title: 'Câu 8: Số thập phân vô hạn tuần hoàn (Bài 5.4a SGK)',
    pts: 20,
    question: 'Số thập phân vô hạn tuần hoàn $1,(12) = 1,121212\\dots$ biểu diễn dưới dạng phân số tối giản là:',
    options: [
      { text: '$\\frac{112}{99}$', correct: false },
      { text: '$\\frac{37}{33}$', correct: true },
      { text: '$\\frac{111}{100}$', correct: false },
      { text: '$\\frac{28}{25}$', correct: false }
    ],
    explanation: '$1,(12) = 1 + \\frac{12}{100} + \\frac{12}{100^2} + \\dots = 1 + \\frac{\\frac{12}{100}}{1 - \\frac{1}{100}} = 1 + \\frac{12}{99} = 1 + \\frac{4}{33} = \\frac{37}{33}$.'
  },
  {
    id: 9,
    title: 'Câu 9: Mô hình nồng độ thuốc trong cơ thể (Bài 5.5 SGK)',
    pts: 20,
    question: 'Một bệnh nhân hằng ngày uống $150\\text{ mg}$ thuốc, sau mỗi ngày lượng thuốc cũ còn lại trong cơ thể là $5\\%$. Lượng thuốc tích lũy tối đa trong cơ thể sau thời gian dài là khoảng:',
    options: [
      { text: '$150\\text{ mg}$', correct: false },
      { text: '$157.89\\text{ mg}$', correct: true },
      { text: '$300\\text{ mg}$', correct: false },
      { text: '$200\\text{ mg}$', correct: false }
    ],
    explanation: 'Tổng lượng thuốc tích lũy là tổng cấp số nhân lùi vô hạn với liều ban đầu $u_1 = 150\\text{ mg}$ và công bội $q = 5\\% = 0.05$: $S = \\frac{u_1}{1 - q} = \\frac{150}{1 - 0.05} = \\frac{150}{0.95} \\approx 157.89\\text{ mg}$.'
  },
  {
    id: 10,
    title: 'Câu 10: Nghịch lí Zeno & Tổng chuỗi vô hạn',
    pts: 20,
    question: 'Achilles chạy vận tốc $10\\text{ m/s}$ đuổi theo rùa chạy $1\\text{ m/s}$ chấp trước $100\\text{ m}$. Bằng công cụ cấp số nhân lùi vô hạn, thời gian để Achilles bắt kịp rùa là:',
    options: [
      { text: 'Không bao giờ vì số bước chia nhỏ là vô hạn.', correct: false },
      { text: '$10\\text{ giây}$', correct: false },
      { text: '$\\frac{100}{9}\\text{ giây} \\approx 11.11\\text{ giây}$', correct: true },
      { text: '$100\\text{ giây}$', correct: false }
    ],
    explanation: 'Tổng thời gian các chặng Zeno là cấp số nhân lùi vô hạn: $T = 10 + 1 + 0.1 + 0.01 + \\dots = \\frac{10}{1 - 0.1} = \\frac{100}{9} \\approx 11.11\\text{ giây}$. Vô hạn bước diễn ra trong khoảng thời gian hữu hạn, sau đó Achilles vượt rùa!'
  }
];

// ==========================================
// 4. PARSER TOÁN HỌC (KATEX & MATHML CORE DỰ PHÒNG)
// ==========================================
function renderMathInTree(root) {
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(root, {
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

  // Fallback tokenizer
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.includes('$')) {
      textNodes.push(node);
    }
  }

  textNodes.forEach(tNode => {
    const parent = tNode.parentNode;
    if (!parent) return;
    const tag = parent.nodeName.toLowerCase();
    if (['script', 'style', 'textarea', 'math'].includes(tag)) return;
    const span = document.createElement('span');
    span.innerHTML = formatMathText(tNode.nodeValue);
    parent.replaceChild(span, tNode);
  });
}

function formatMathText(raw) {
  if (!raw) return '';
  return raw
    .replace(/\$\$([\s\S]+?)\$\$/g, (m, c) => `<div class="math-block">${latexToMathML(c, true)}</div>`)
    .replace(/\$([^\$\n]+?)\$/g, (m, c) => `<span class="math-inline">${latexToMathML(c, false)}</span>`);
}

function latexToMathML(latex, isBlock = false) {
  let s = latex.trim();
  s = s.replace(/\\lim\\limits_\{n \\to \+\\infty\}/g, '<mo>lim</mo><msub><mo></mo><mrow><mi>n</mi><mo>→</mo><mo>+</mo><mi>∞</mi></mrow></msub>');
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  s = s.replace(/\\to/g, '<mo>→</mo>');
  s = s.replace(/\\approx/g, '<mo>≈</mo>');
  s = s.replace(/\\infty/g, '<mi>∞</mi>');
  s = s.replace(/\\pm/g, '<mo>±</mo>');
  s = s.replace(/\\le/g, '<mo>≤</mo>');
  s = s.replace(/\\ge/g, '<mo>≥</mo>');
  s = s.replace(/\\ne/g, '<mo>≠</mo>');
  s = s.replace(/\\cdot/g, '<mo>·</mo>');
  s = s.replace(/\\left|\\right/g, '');
  return `<math xmlns="http://www.w3.org/1998/Math/MathML" ${isBlock ? 'display="block"' : ''}>${s}</math>`;
}

// ==========================================
// 5. HUD, AVATAR & TIẾN TRÌNH
// ==========================================
function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const userTitleEl = document.getElementById('userTitle');
  const userNameEl = document.getElementById('userNameDisplay');
  const avatarBtn = document.getElementById('avatarBtn');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (userTitleEl) userTitleEl.textContent = appState.userTitle;
  if (userNameEl) userNameEl.textContent = `${appState.userName} 🌟`;
  if (avatarBtn) avatarBtn.textContent = appState.avatar;

  if (starEl) {
    let starsStr = '';
    for (let i = 1; i <= 5; i++) starsStr += i <= appState.stars ? '⭐' : '☆';
    starEl.textContent = starsStr;
  }

  for (let i = 1; i <= 5; i++) {
    const badgeEl = document.getElementById(`badge-${i}`);
    if (badgeEl) {
      if (appState.badges[i - 1]) badgeEl.classList.add('unlocked');
      else badgeEl.classList.remove('unlocked');
    }
  }

  const certName = document.getElementById('certStudentName');
  const certDate = document.getElementById('certDate');
  if (certName) certName.textContent = appState.userName;
  if (certDate) {
    const now = new Date();
    certDate.textContent = `Đà Nẵng, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  }
}

function initAvatarModal() {
  const avatarBtn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const closeModalBtn = document.getElementById('closeAvatarModal');
  const grid = document.getElementById('avatarGrid');

  if (!avatarBtn || !modal) return;

  if (grid) {
    grid.innerHTML = '';
    AVATARS.forEach(av => {
      const card = document.createElement('div');
      card.className = `avatar-card ${appState.avatar === av.icon ? 'active' : ''}`;
      card.innerHTML = `
        <div class="av-icon">${av.icon}</div>
        <div class="av-name">${av.name}</div>
        <div class="av-role">${av.title}</div>
      `;
      card.addEventListener('click', () => {
        appState.avatar = av.icon;
        appState.userName = av.name;
        appState.userTitle = av.title;
        playTone(600, 'sine', 0.1);
        modal.classList.remove('active');
        modal.style.display = 'none';
        updateHUD();
      });
      grid.appendChild(card);
    });
  }

  avatarBtn.addEventListener('click', () => {
    playTone(500, 'sine', 0.08);
    modal.style.display = 'flex';
    modal.classList.add('active');
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      modal.style.display = 'none';
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  });
}

function initHUDControls() {
  const soundBtn = document.getElementById('soundToggle');
  const resetBtn = document.getElementById('resetProgress');
  const printBtn = document.getElementById('btnPrintCert');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      if (appState.sound) playTone(587.33, 'sine', 0.1);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Làm mới toàn bộ tiến trình học tập Bài 15?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.stars = 2;
        appState.answered = {};
        appState.badges = [true, false, false, false, false];
        updateHUD();
        renderQuiz();
        playTone(330, 'triangle', 0.2);
      }
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => window.print());
  }
}

function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${targetId}`);
      if (targetContent) targetContent.classList.add('active');

      playTone(480, 'sine', 0.08);
      if (targetId === 'labs') {
        appState.badges[1] = true;
        updateHUD();
      }
    });
  });
}

// ==========================================
// 6. RENDER QUIZ ĐẤU TRƯỜNG SGK
// ==========================================
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;

  container.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];

  quizData.forEach((q, qIndex) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `<span>${q.title}</span><span class="quiz-badge">+${q.pts} XP</span>`;
    card.appendChild(header);

    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    const optGrid = document.createElement('div');
    optGrid.className = 'quiz-options';

    const explanation = document.createElement('div');
    explanation.className = 'explanation-box';
    explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;

    const isAnswered = appState.answered[q.id] !== undefined;

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;

      if (isAnswered) {
        btn.disabled = true;
        const chosen = appState.answered[q.id];
        if (opt.correct) btn.classList.add('correct');
        else if (chosen === optIndex) btn.classList.add('wrong');
      } else {
        btn.addEventListener('click', () => {
          if (appState.answered[q.id] !== undefined) return;
          appState.answered[q.id] = optIndex;

          const allBtns = optGrid.querySelectorAll('.quiz-opt-btn');
          allBtns.forEach(b => b.disabled = true);

          if (opt.correct) {
            btn.classList.add('correct');
            appState.xp += q.pts;
            appState.streak += 1;
            playCorrect();
          } else {
            btn.classList.add('wrong');
            appState.streak = 0;
            playWrong();
            q.options.forEach((o, idx) => {
              if (o.correct) allBtns[idx].classList.add('correct');
            });
          }

          explanation.classList.add('show');
          renderMathInTree(explanation);

          checkProgressAndBadges();
          updateHUD();
          updateArenaStats();
        });
      }

      optGrid.appendChild(btn);
    });

    card.appendChild(optGrid);
    if (isAnswered) explanation.classList.add('show');
    card.appendChild(explanation);
    container.appendChild(card);
  });

  renderMathInTree(container);
  updateArenaStats();
}

function updateArenaStats() {
  const progressEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  let answeredCount = 0;
  let correctCount = 0;

  quizData.forEach(q => {
    const ans = appState.answered[q.id];
    if (ans !== undefined) {
      answeredCount++;
      if (q.options[ans].correct) correctCount++;
    }
  });

  if (progressEl) progressEl.textContent = `${answeredCount}/${quizData.length}`;
  if (scoreEl) scoreEl.textContent = `${correctCount * 20} XP`;
}

function checkProgressAndBadges() {
  let correctCount = 0;
  let answeredCount = 0;

  quizData.forEach(q => {
    const ans = appState.answered[q.id];
    if (ans !== undefined) {
      answeredCount++;
      if (q.options[ans].correct) correctCount++;
    }
  });

  if (answeredCount >= 5) appState.badges[2] = true;
  if (correctCount >= 8) {
    appState.badges[3] = true;
    appState.stars = 4;
  }
  if (correctCount === 10) {
    appState.badges[4] = true;
    appState.stars = 5;
    playFanfare();
  } else if (correctCount >= 5) {
    appState.stars = 3;
  }
}

// ==========================================
// 7. PHÒNG THÍ NGHIỆM 1: NGHỊCH LÍ ZENO (ACHILLES & CON RÙA)
// ==========================================
let zenoState = {
  running: false,
  time: 0,
  maxTime: 14,
  achillesV: 10,
  tortoiseV: 1,
  startGap: 100,
  stepIdx: 0,
  zenoSteps: [
    { t: 0, a: 0, r: 100 },
    { t: 10, a: 100, r: 110 },
    { t: 11, a: 110, r: 111 },
    { t: 11.1, a: 111, r: 111.1 },
    { t: 11.11, a: 111.1, r: 111.11 },
    { t: 11.111, a: 111.11, r: 111.111 }
  ]
};

function initLab1() {
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const btnPlay = document.getElementById('btnPlayZeno');
  const btnStep = document.getElementById('btnStepZeno');
  const btnReset = document.getElementById('btnResetZeno');
  const badge = document.getElementById('lab1StatusBadge');
  const dispT = document.getElementById('valZenoTime');
  const dispA = document.getElementById('valAchillesPos');
  const dispR = document.getElementById('valTortoisePos');
  const dispG = document.getElementById('valGap');

  if (btnPlay) {
    btnPlay.addEventListener('click', () => {
      zenoState.running = !zenoState.running;
      btnPlay.textContent = zenoState.running ? '⏸ Tạm Dừng' : '▶ Chạy Cuộc Đua';
      playTone(500, 'sine', 0.08);
    });
  }

  if (btnStep) {
    btnStep.addEventListener('click', () => {
      zenoState.running = false;
      if (btnPlay) btnPlay.textContent = '▶ Chạy Cuộc Đua';
      zenoState.stepIdx = (zenoState.stepIdx + 1) % zenoState.zenoSteps.length;
      zenoState.time = zenoState.zenoSteps[zenoState.stepIdx].t;
      playTone(600, 'triangle', 0.08);
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      zenoState.running = false;
      zenoState.time = 0;
      zenoState.stepIdx = 0;
      if (btnPlay) btnPlay.textContent = '▶ Chạy Cuộc Đua';
      playTone(400, 'sine', 0.08);
    });
  }

  let lastFrame = performance.now();

  function renderZeno(now) {
    const dt = (now - lastFrame) / 1000;
    lastFrame = now;

    if (zenoState.running) {
      zenoState.time += dt * 1.5;
      if (zenoState.time > zenoState.maxTime) zenoState.time = zenoState.maxTime;
    }

    const t = zenoState.time;
    const posA = zenoState.achillesV * t;
    const posR = zenoState.startGap + zenoState.tortoiseV * t;
    const gap = posR - posA;

    if (dispT) dispT.textContent = t.toFixed(2);
    if (dispA) dispA.textContent = posA.toFixed(1);
    if (dispR) dispR.textContent = posR.toFixed(1);
    if (dispG) dispG.textContent = gap > 0 ? gap.toFixed(1) : 'Đã vượt qua!';

    if (badge) {
      if (posA < posR - 0.5) badge.textContent = `Achilles đang đuổi theo (còn cách ${gap.toFixed(1)}m)`;
      else if (Math.abs(gap) <= 0.5) badge.textContent = `🎯 ĐIỂM HỘI TỤ ZENO: Bắt kịp tại 111.11m (t = 11.11s)!`;
      else badge.textContent = `🏆 Achilles đã vượt qua con rùa thành công!`;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Đường đua (Vạch chia mét từ 0 đến 140m)
    const startX = 60;
    const trackW = canvas.width - 120;
    const maxTrackDist = 140;

    function toScreenX(dist) {
      return startX + (dist / maxTrackDist) * trackW;
    }

    // Nền đường chạy
    const trackY1 = 120; // Achilles
    const trackY2 = 240; // Rùa

    // Vẽ 2 làn chạy
    [trackY1, trackY2].forEach((ty, idx) => {
      ctx.fillStyle = 'rgba(30, 41, 59, 0.4)';
      ctx.fillRect(startX - 20, ty - 30, trackW + 40, 60);
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.3)';
      ctx.strokeRect(startX - 20, ty - 30, trackW + 40, 60);

      // Vạch đích 111.11m
      const catchX = toScreenX(111.11);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(catchX, ty - 30);
      ctx.lineTo(catchX, ty + 30);
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Thước đo vạch khoảng cách
    ctx.font = '11px Inter, sans-serif';
    ctx.fillStyle = '#94a3b8';
    for (let m = 0; m <= maxTrackDist; m += 20) {
      const sx = toScreenX(m);
      ctx.beginPath();
      ctx.moveTo(sx, trackY2 + 30);
      ctx.lineTo(sx, trackY2 + 38);
      ctx.strokeStyle = '#64748b';
      ctx.stroke();
      ctx.fillText(`${m}m`, sx - 10, trackY2 + 52);
    }

    // Điểm hội tụ Zeno đánh dấu
    const catchScreenX = toScreenX(111.11);
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText('Vạch hội tụ: 111.11m', catchScreenX - 50, trackY1 - 40);

    // Vẽ Dũng sĩ Achilles
    const curAX = toScreenX(Math.min(posA, maxTrackDist));
    ctx.font = '32px sans-serif';
    ctx.fillText('🏃', curAX - 16, trackY1 + 10);
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Achilles (${posA.toFixed(1)}m)`, curAX - 35, trackY1 + 28);

    // Vẽ Con Rùa
    const curRX = toScreenX(Math.min(posR, maxTrackDist));
    ctx.font = '32px sans-serif';
    ctx.fillText('🐢', curRX - 16, trackY2 + 10);
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Rùa (${posR.toFixed(1)}m)`, curRX - 25, trackY2 + 28);

    // Dây nối liên kết Zeno
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(curAX, trackY1);
    ctx.lineTo(curRX, trackY2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dưới đáy: Các mốc Zeno A1, A2, A3
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Inter, sans-serif';
    ctx.fillText(`Chặng Zeno hiện tại: t = ${t.toFixed(2)}s | Achilles chạy: ${posA.toFixed(1)}m | Rùa bò: ${posR.toFixed(1)}m`, startX, 350);

    requestAnimationFrame(renderZeno);
  }

  requestAnimationFrame(renderZeno);
}

// ==========================================
// 8. PHÒNG THÍ NGHIỆM 2: KHẢO SÁT DÃY SỐ & DẢI EPSILON
// ==========================================
let lab2State = {
  seqType: 'frac', // 'frac' | 'alt' | 'geo' | 'quad'
  n: 25,
  eps: 0.20
};

function getSeqVal(type, n) {
  if (type === 'frac') return (2 * n + 1) / (n + 2); // lim = 2
  if (type === 'alt') return 1 + (Math.pow(-1, n) / n); // lim = 1
  if (type === 'geo') return 3 * Math.pow(0.8, n); // lim = 0
  if (type === 'quad') return (n * n + 1) / (2 * n * n + 1); // lim = 0.5
  return 0;
}

function getSeqLimit(type) {
  if (type === 'frac') return 2;
  if (type === 'alt') return 1;
  if (type === 'geo') return 0;
  if (type === 'quad') return 0.5;
  return 0;
}

function initLab2() {
  const canvas = document.getElementById('canvasLab2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const select = document.getElementById('selectSeq');
  const sliderN = document.getElementById('sliderN');
  const dispN = document.getElementById('dispN');
  const sliderEps = document.getElementById('sliderEps');
  const dispEps = document.getElementById('dispEps');
  const btnReset = document.getElementById('btnResetLab2');

  const valN = document.getElementById('valN');
  const valUn = document.getElementById('valUn');
  const valLim = document.getElementById('valLim');
  const valDiff = document.getElementById('valDiff');

  if (select) {
    select.addEventListener('change', (e) => {
      lab2State.seqType = e.target.value;
      playTone(550, 'sine', 0.08);
    });
  }

  if (sliderN) {
    sliderN.addEventListener('input', (e) => {
      lab2State.n = parseInt(e.target.value);
      if (dispN) dispN.textContent = lab2State.n;
    });
  }

  if (sliderEps) {
    sliderEps.addEventListener('input', (e) => {
      lab2State.eps = parseInt(e.target.value) / 100;
      if (dispEps) dispEps.textContent = lab2State.eps.toFixed(2);
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      lab2State.n = 25;
      lab2State.eps = 0.20;
      if (sliderN) sliderN.value = 25;
      if (sliderEps) sliderEps.value = 20;
      if (dispN) dispN.textContent = '25';
      if (dispEps) dispEps.textContent = '0.20';
      playTone(400, 'sine', 0.08);
    });
  }

  function render2() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const a = getSeqLimit(lab2State.seqType);
    const unVal = getSeqVal(lab2State.seqType, lab2State.n);
    const diff = Math.abs(unVal - a);

    if (valN) valN.textContent = lab2State.n;
    if (valUn) valUn.textContent = unVal.toFixed(4);
    if (valLim) valLim.textContent = a.toFixed(2);
    if (valDiff) valDiff.textContent = diff.toFixed(4);

    // Hệ trục toạ độ
    const marginL = 60, marginR = 40, marginT = 40, marginB = 50;
    const plotW = canvas.width - marginL - marginR;
    const plotH = canvas.height - marginT - marginB;

    // Khoảng giá trị y để vẽ
    let minY = -0.5, maxY = 3.2;
    if (lab2State.seqType === 'geo') { minY = -0.5; maxY = 3.5; }
    else if (lab2State.seqType === 'quad') { minY = -0.2; maxY = 1.2; }

    function toScreen(n, y) {
      const sx = marginL + (n / 60) * plotW;
      const sy = marginT + ((maxY - y) / (maxY - minY)) * plotH;
      return { x: sx, y: sy };
    }

    // 1. Dải sai số Epsilon bao quanh y = a: (a - eps, a + eps)
    const topEps = toScreen(0, a + lab2State.eps);
    const botEps = toScreen(0, a - lab2State.eps);
    ctx.fillStyle = 'rgba(245, 158, 11, 0.15)';
    ctx.fillRect(marginL, topEps.y, plotW, botEps.y - topEps.y);

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.5)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(marginL, topEps.y); ctx.lineTo(marginL + plotW, topEps.y);
    ctx.moveTo(marginL, botEps.y); ctx.lineTo(marginL + plotW, botEps.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // 2. Đường giới hạn y = a
    const lineA = toScreen(0, a);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(marginL, lineA.y);
    ctx.lineTo(marginL + plotW, lineA.y);
    ctx.stroke();

    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.fillStyle = '#fbbf24';
    ctx.fillText(`Giới hạn a = ${a}`, marginL + plotW - 100, lineA.y - 8);

    // 3. Trục toạ độ
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    // Trục hoành
    const axisY = toScreen(0, 0);
    ctx.moveTo(marginL, axisY.y); ctx.lineTo(marginL + plotW, axisY.y);
    // Trục tung
    ctx.moveTo(marginL, marginT); ctx.lineTo(marginL, marginT + plotH);
    ctx.stroke();

    // Vạch số trên trục n
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Inter, sans-serif';
    for (let i = 10; i <= 60; i += 10) {
      const p = toScreen(i, 0);
      ctx.fillText(i, p.x - 6, axisY.y + 18);
    }
    ctx.fillText('Chỉ số n ⟹ +∞', marginL + plotW - 60, axisY.y + 35);

    // 4. Vẽ các điểm (n, u_n)
    let inBandFrom = -1;
    for (let i = 1; i <= 60; i++) {
      const val = getSeqVal(lab2State.seqType, i);
      const pt = toScreen(i, val);
      const inBand = Math.abs(val - a) < lab2State.eps;

      if (inBand && inBandFrom === -1) inBandFrom = i;

      ctx.beginPath();
      ctx.arc(pt.x, pt.y, i === lab2State.n ? 6 : 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = i === lab2State.n ? '#ec4899' : (inBand ? '#38bdf8' : '#ef4444');
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = i === lab2State.n ? 2 : 1;
      ctx.stroke();

      // Nối đường đứt nét nhẹ
      if (i > 1) {
        const prevVal = getSeqVal(lab2State.seqType, i - 1);
        const prevPt = toScreen(i - 1, prevVal);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.25)';
        ctx.beginPath();
        ctx.moveTo(prevPt.x, prevPt.y);
        ctx.lineTo(pt.x, pt.y);
        ctx.stroke();
      }
    }

    // Điểm đang chọn n
    const curPt = toScreen(lab2State.n, unVal);
    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillText(`u_${lab2State.n} = ${unVal.toFixed(3)}`, curPt.x + 8, curPt.y - 8);

    requestAnimationFrame(render2);
  }

  requestAnimationFrame(render2);
}

// ==========================================
// 9. KHỞI TẠO TOÀN DIỆN
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  appState.badges[0] = true;

  updateHUD();
  initAvatarModal();
  initHUDControls();
  initTabs();

  renderQuiz();

  initLab1();
  initLab2();

  renderMathInTree(document.body);
});
