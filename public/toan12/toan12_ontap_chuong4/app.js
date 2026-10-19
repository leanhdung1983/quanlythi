// ==========================================
// TOÁN 12 - CHƯƠNG IV: ÔN TẬP BÀI TẬP CUỐI CHƯƠNG IV
// Ứng dụng Web Học Liệu Số Tương Tác Chuẩn SGK
// ==========================================

// --- WEB AUDIO API SOUND SYSTEM ---
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }
  playTone(freq, type, duration, gainVal = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
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
      console.warn('Audio tone error', e);
    }
  }
  playClick() { this.playTone(600, 'sine', 0.08, 0.06); }
  playBeep() { this.playTone(440, 'triangle', 0.12, 0.08); }
  playCorrect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + idx * 0.08);
        gain.gain.setValueAtTime(0.12, now + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.08);
        osc.stop(now + idx * 0.08 + 0.25);
      });
    } catch (e) {}
  }
  playWrong() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [220, 185].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, now + idx * 0.12);
        gain.gain.setValueAtTime(0.14, now + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.12 + 0.2);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + idx * 0.12);
        osc.stop(now + idx * 0.12 + 0.2);
      });
    } catch (e) {}
  }
  playLevelUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [440, 554.37, 659.25, 880, 1108.73].forEach((f, i) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + i * 0.09);
        gain.gain.setValueAtTime(0.12, now + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + i * 0.09 + 0.3);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + i * 0.09);
        osc.stop(now + i * 0.09 + 0.3);
      });
    } catch (e) {}
  }
  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const chords = [
        { f: 523.25, t: 0 }, { f: 659.25, t: 0.12 }, { f: 783.99, t: 0.24 },
        { f: 1046.5, t: 0.38 }, { f: 783.99, t: 0.52 }, { f: 1046.5, t: 0.68 }
      ];
      chords.forEach(n => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(n.f, now + n.t);
        gain.gain.setValueAtTime(0.15, now + n.t);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + n.t + 0.45);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + n.t);
        osc.stop(now + n.t + 0.45);
      });
    } catch (e) {}
  }
}
const sounds = new SoundSystem();

// --- MATHML & KATEX RENDERING FALLBACK ENGINE ---
function latexToMathML(latex) {
  let s = latex.trim();
  s = s.replace(/\\overrightarrow\{([^}]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#8594;</mo></mover>');
  s = s.replace(/\\vec\{([^}]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#8594;</mo></mover>');
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '<mroot><mrow>$2</mrow><mrow>$1</mrow></mroot>');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  s = s.replace(/\\int_\{([^}]+)\}\^\{([^}]+)\}/g, '<msubsup><mo>&#8747;</mo><mrow>$1</mrow><mrow>$2</mrow></msubsup>');
  s = s.replace(/\\int/g, '<mo>&#8747;</mo>');
  s = s.replace(/\\lim\\limits_\{([^}]+)\}/g, '<munder><mo>lim</mo><mrow>$1</mrow></munder>');
  s = s.replace(/\\max\\limits_\{([^}]+)\}/g, '<munder><mo>max</mo><mrow>$1</mrow></munder>');
  s = s.replace(/\\min\\limits_\{([^}]+)\}/g, '<munder><mo>min</mo><mrow>$1</mrow></munder>');
  s = s.replace(/\\left\|([^\\|]+)\\right\|/g, '<mrow><mo>|</mo><mrow>$1</mrow><mo>|</mo></mrow>');
  s = s.replace(/\|([^|]+)\|/g, '<mrow><mo>|</mo><mrow>$1</mrow><mo>|</mo></mrow>');
  s = s.replace(/\\le/g, '<mo>&#8804;</mo>');
  s = s.replace(/\\ge/g, '<mo>&#8805;</mo>');
  s = s.replace(/\\ne/g, '<mo>&#8800;</mo>');
  s = s.replace(/\\approx/g, '<mo>&#8776;</mo>');
  s = s.replace(/\\cdot/g, '<mo>&#8901;</mo>');
  s = s.replace(/\\times/g, '<mo>&#215;</mo>');
  s = s.replace(/\\pm/g, '<mo>&#177;</mo>');
  s = s.replace(/\\pi/g, '<mi>&#960;</mi>');
  s = s.replace(/\\alpha/g, '<mi>&#945;</mi>');
  s = s.replace(/\\beta/g, '<mi>&#946;</mi>');
  s = s.replace(/\\in/g, '<mo>&#8712;</mo>');
  s = s.replace(/\\notin/g, '<mo>&#8713;</mo>');
  s = s.replace(/\\subset/g, '<mo>&#8834;</mo>');
  s = s.replace(/\\cup/g, '<mo>&#8746;</mo>');
  s = s.replace(/\\cap/g, '<mo>&#8745;</mo>');
  s = s.replace(/\\mathbb\{R\}/g, '<mi class="m-bb">&#8477;</mi>');
  s = s.replace(/\\text\{([^}]+)\}/g, '<mtext>$1</mtext>');
  s = s.replace(/([a-zA-Z])\^\{([^}]+)\}/g, '<msup><mi>$1</mi><mrow>$2</mrow></msup>');
  s = s.replace(/([a-zA-Z])\^([0-9a-zA-Z])/g, '<msup><mi>$1</mi><mn>$2</mn></msup>');
  s = s.replace(/([a-zA-Z])_\{([^}]+)\}/g, '<msub><mi>$1</mi><mrow>$2</mrow></msub>');
  s = s.replace(/([a-zA-Z])_([0-9a-zA-Z])/g, '<msub><mi>$1</mi><mn>$2</mn></msub>');
  s = s.replace(/([0-9]+)/g, '<mn>$1</mn>');
  s = s.replace(/([a-zA-Z])/g, '<mi>$1</mi>');
  s = s.replace(/([+\-=><()[\],;])/g, '<mo>$1</mo>');
  return s;
}

function formatMathText(text) {
  if (!text) return '';
  text = text.replace(/\$\$([\s\S]+?)\$\$/g, (match, p1) => {
    return `<div class="math-block"><math display="block">${latexToMathML(p1)}</math></div>`;
  });
  text = text.replace(/\$([^$]+?)\$/g, (match, p1) => {
    return `<span class="math-inline"><math>${latexToMathML(p1)}</math></span>`;
  });
  return text;
}

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
      console.warn('KaTeX render warning:', e);
    }
  }
}

// --- STATE MANAGEMENT ---
const STORAGE_KEY = 'toan12_ontap4_state';
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Hiệp Giải Tích',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      appState = Object.assign(appState, parsed);
    }
  } catch (e) {}
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {}
}

// --- HUD DISPLAY UPDATE ---
function updateHUD() {
  const avatarBtn = document.getElementById('avatarBtn');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const userTitle = document.getElementById('userTitle');
  const starRating = document.getElementById('starRating');
  const xpDisplay = document.getElementById('xpDisplay');
  const streakDisplay = document.getElementById('streakDisplay');
  const soundToggle = document.getElementById('soundToggle');

  if (avatarBtn) avatarBtn.textContent = appState.avatar;
  if (userNameDisplay) userNameDisplay.textContent = appState.userName + ' 🌟';
  if (userTitle) userTitle.textContent = appState.userTitle;
  if (xpDisplay) xpDisplay.textContent = appState.xp;
  if (streakDisplay) streakDisplay.textContent = `🔥 ${appState.streak}`;
  if (soundToggle) {
    soundToggle.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
  }

  // Update stars based on XP
  if (appState.xp >= 200) appState.stars = 5;
  else if (appState.xp >= 150) appState.stars = 4;
  else if (appState.xp >= 100) appState.stars = 3;
  else if (appState.xp >= 40) appState.stars = 2;
  else appState.stars = 1;

  if (starRating) {
    let s = '';
    for (let i = 1; i <= 5; i++) {
      s += i <= appState.stars ? '⭐' : '☆';
    }
    starRating.textContent = s;
  }

  // Update cert fields
  const certStudentName = document.getElementById('certStudentName');
  const certXP = document.getElementById('certXP');
  const certRank = document.getElementById('certRank');
  if (certStudentName) certStudentName.textContent = appState.userName;
  if (certXP) certXP.textContent = `${appState.xp} XP`;
  if (certRank) {
    if (appState.xp >= 200) certRank.textContent = 'Xuất Sắc (Thủ Khoa)';
    else if (appState.xp >= 150) certRank.textContent = 'Giỏi (Bậc Thầy)';
    else if (appState.xp >= 100) certRank.textContent = 'Khá';
    else certRank.textContent = 'Đạt Chuẩn';
  }

  checkBadges();
}

function checkBadges() {
  const answeredCount = Object.keys(appState.answered).length;
  let correctCount = 0;
  for (let k in appState.answered) {
    if (appState.answered[k].correct) correctCount++;
  }

  // Badge 1: Khởi đầu ôn tập
  if (answeredCount >= 1 && !appState.badges[0]) {
    appState.badges[0] = true;
    sounds.playLevelUp();
  }
  // Badge 2: Combo streak >= 3
  if (appState.streak >= 3 && !appState.badges[1]) {
    appState.badges[1] = true;
    sounds.playLevelUp();
  }
  // Badge 3: Trải nghiệm Labs
  // (Được kích hoạt khi tương tác cả 2 lab)
  // Badge 4: Điểm arena >= 160 XP (>= 8 câu đúng)
  if (appState.xp >= 160 && !appState.badges[3]) {
    appState.badges[3] = true;
    sounds.playLevelUp();
  }
  // Badge 5: Quán quân 10/10
  if (correctCount >= 10 && !appState.badges[4]) {
    appState.badges[4] = true;
    sounds.playFanfare();
  }

  for (let i = 0; i < 5; i++) {
    const el = document.getElementById(`badge-${i + 1}`);
    if (el) {
      if (appState.badges[i]) {
        el.style.border = '1px solid #10b981';
        el.style.background = 'rgba(16, 185, 129, 0.15)';
      } else {
        el.style.border = '1px solid rgba(99, 102, 241, 0.2)';
        el.style.background = 'rgba(15, 23, 42, 0.6)';
      }
    }
  }
  saveState();
}

// --- QUIZ DATA (10 CÂU BÀI TẬP CUỐI CHƯƠNG IV SGK KNTT TR. 27-28) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 4.20 SGK trang 27: Nguyên hàm hàm lượng giác',
    pts: 20,
    question: 'Họ tất cả các nguyên hàm của hàm số $f(x) = \\sin 2x$ là:',
    options: [
      { text: '$-\\frac{1}{2}\\cos 2x + C$', correct: true },
      { text: '$\\frac{1}{2}\\cos 2x + C$', correct: false },
      { text: '$-2\\cos 2x + C$', correct: false },
      { text: '$2\\cos 2x + C$', correct: false }
    ],
    explanation: 'Sử dụng công thức mở rộng $\\int \\sin(ax + b)\\,dx = -\\frac{1}{a}\\cos(ax + b) + C$. Với $a = 2$, ta có ngay $\\int \\sin 2x\\,dx = -\\frac{1}{2}\\cos 2x + C$.'
  },
  {
    id: 2,
    title: 'Câu 4.21 SGK trang 27: Họ nguyên hàm hàm số mũ',
    pts: 20,
    question: 'Nguyên hàm của hàm số $f(x) = 2e^x$ là:',
    options: [
      { text: '$2e^x + C$', correct: true },
      { text: '$e^x + C$', correct: false },
      { text: '$\\frac{e^x}{2} + C$', correct: false },
      { text: '$2e^{2x} + C$', correct: false }
    ],
    explanation: 'Theo tính chất nguyên hàm của tích số với hằng số: $\\int 2e^x\\,dx = 2 \\int e^x\\,dx = 2e^x + C$.'
  },
  {
    id: 3,
    title: 'Câu 4.22 SGK trang 27: Tìm nguyên hàm thỏa mãn điều kiện đầu',
    pts: 20,
    question: 'Cho hàm số $F(x)$ thỏa mãn $F\'(x) = e^x - 3e^{-x}$ và $F(0) = 4$. Khi đó biểu thức của $F(x)$ là:',
    options: [
      { text: '$e^x + 3e^{-x}$', correct: true },
      { text: '$e^x - 3e^{-x} + 6$', correct: false },
      { text: '$e^x + 3e^{-x} + 4$', correct: false },
      { text: '$e^x - 3e^{-x}$', correct: false }
    ],
    explanation: 'Ta có $F(x) = \\int (e^x - 3e^{-x})\\,dx = e^x + 3e^{-x} + C$. Thay $x = 0$ ta được $F(0) = e^0 + 3e^0 + C = 1 + 3 + C = 4 \\Rightarrow C = 0$. Vậy $F(x) = e^x + 3e^{-x}$.'
  },
  {
    id: 4,
    title: 'Câu 4.23 SGK trang 27: Định lý cơ bản của Giải tích',
    pts: 20,
    question: 'Cho hàm số $f(x)$ có đạo hàm liên tục trên $\\mathbb{R}$ với $f(1) = 16$ và $\\int_1^3 f\'(x)\\,dx = 4$. Giá trị của $f(3)$ bằng:',
    options: [
      { text: '$20$', correct: true },
      { text: '$12$', correct: false },
      { text: '$-12$', correct: false },
      { text: '$64$', correct: false }
    ],
    explanation: 'Theo định lý cơ bản của Giải tích (công thức Newton–Leibniz): $\\int_1^3 f\'(x)\\,dx = f(3) - f(1) = 4$. Suy ra $f(3) = f(1) + 4 = 16 + 4 = 20$.'
  },
  {
    id: 5,
    title: 'Câu 4.24 SGK trang 27: Diện tích hình phẳng giữa hai parabol',
    pts: 20,
    question: 'Diện tích hình phẳng giới hạn bởi đồ thị hai hàm số $y = x^2 - 2x$, $y = -x^2 + 4x$ và hai đường thẳng $x = 0$, $x = 3$ bằng:',
    options: [
      { text: '$9$', correct: true },
      { text: '$\\frac{9}{2}$', correct: false },
      { text: '$18$', correct: false },
      { text: '$6$', correct: false }
    ],
    explanation: 'Xét hiệu hai hàm số: $(-x^2 + 4x) - (x^2 - 2x) = -2x^2 + 6x = 2x(3 - x)$. Trên đoạn $[0; 3]$, hiệu này luôn mang dấu dương (hoặc bằng $0$ tại hai đầu mút). Do đó diện tích là: $S = \\int_0^3 (-2x^2 + 6x)\\,dx = \\left[-\\frac{2}{3}x^3 + 3x^2\\right]_0^3 = -18 + 27 = 9$.'
  },
  {
    id: 6,
    title: 'Câu 4.25 SGK trang 27: Đọc đồ thị và diện tích hình phẳng',
    pts: 20,
    question: 'Cho đồ thị hàm số $y = f(x)$ như hình 4.32 SGK. Biết các diện tích thành phần giữa đồ thị và trục hoành trên $[-2; -1]$, $[-1; 1]$ và $[1; 2]$ có tích phân đại số lần lượt là $-\\frac{22}{15}$, $\\frac{76}{15}$ và $-\\frac{22}{15}$. Diện tích phần tô màu là:',
    options: [
      { text: '$8$', correct: true },
      { text: '$\\frac{32}{15}$', correct: false },
      { text: '$\\frac{76}{15}$', correct: false },
      { text: '$\\frac{120}{15}$', correct: false }
    ],
    explanation: 'Diện tích hình phẳng thực tế là tổng các diện tích hình học (luôn dương): $S = \\left|-\\frac{22}{15}\\right| + \\frac{76}{15} + \\left|-\\frac{22}{15}\\right| = \\frac{22}{15} + \\frac{76}{15} + \\frac{22}{15} = \\frac{120}{15} = 8$.'
  },
  {
    id: 7,
    title: 'Câu 4.26 SGK trang 27: Thể tích khối tròn xoay nửa đường tròn',
    pts: 20,
    question: 'Thể tích khối tròn xoay tạo thành khi quay quanh trục $Ox$ hình phẳng giới hạn bởi đường cong $y = \\sqrt{1 - x^2}$ và trục hoành là:',
    options: [
      { text: '$\\frac{4\\pi}{3}$', correct: true },
      { text: '$\\frac{2\\pi}{3}$', correct: false },
      { text: '$\\frac{4}{3}$', correct: false },
      { text: '$\\pi$', correct: false }
    ],
    explanation: 'Tập xác định và giao điểm trục hoành là $[-1; 1]$. Áp dụng công thức thể tích tròn xoay: $V = \\pi \\int_{-1}^1 (\\sqrt{1 - x^2})^2\\,dx = \\pi \\int_{-1}^1 (1 - x^2)\\,dx = \\pi \\left[x - \\frac{x^3}{3}\\right]_{-1}^1 = \\pi\\left(\\frac{2}{3} - \\left(-\\frac{2}{3}\\right)\\right) = \\frac{4\\pi}{3}$. (Khối tròn xoay này chính là khối cầu bán kính $R = 1$).'
  },
  {
    id: 8,
    title: 'Câu 4.27 SGK trang 28: Bài toán vật lý vận tốc - gia tốc',
    pts: 20,
    question: 'Một chất điểm chuyển động với gia tốc $a(t) = 3t^2 + t$ ($m/s^2$). Biết vận tốc ban đầu tại $t = 0$ là $v(0) = 2\\text{ m/s}$. Vận tốc của chất điểm tại thời điểm $t = 2$ giây là:',
    options: [
      { text: '$12\\text{ m/s}$', correct: true },
      { text: '$14\\text{ m/s}$', correct: false },
      { text: '$10\\text{ m/s}$', correct: false },
      { text: '$16\\text{ m/s}$', correct: false }
    ],
    explanation: 'Vận tốc là nguyên hàm của gia tốc: $v(t) = \\int a(t)\\,dt = \\int (3t^2 + t)\\,dt = t^3 + \\frac{1}{2}t^2 + C$. Vì $v(0) = 2 \\Rightarrow C = 2$. Do đó tại $t = 2\\text{ s}$: $v(2) = 2^3 + \\frac{1}{2}(2^2) + 2 = 8 + 2 + 2 = 12\\text{ m/s}$.'
  },
  {
    id: 9,
    title: 'Câu 4.29 SGK trang 28: Tìm nguyên hàm hàm lượng giác',
    pts: 20,
    question: 'Cho hàm số $f(x) = 2\\cos x + \\frac{1}{\\sin^2 x}$. Tìm nguyên hàm $F(x)$ của $f(x)$ trên $(0; \\pi)$ thỏa mãn $F\\left(\\frac{\\pi}{4}\\right) = -1$.',
    options: [
      { text: '$F(x) = 2\\sin x - \\cot x - \\sqrt{2}$', correct: true },
      { text: '$F(x) = 2\\sin x + \\cot x - \\sqrt{2}$', correct: false },
      { text: '$F(x) = -2\\sin x - \\cot x + \\sqrt{2}$', correct: false },
      { text: '$F(x) = 2\\sin x - \\cot x + 1$', correct: false }
    ],
    explanation: 'Ta có $F(x) = \\int \\left(2\\cos x + \\frac{1}{\\sin^2 x}\\right)\\,dx = 2\\sin x - \\cot x + C$. Với $x = \\frac{\\pi}{4}$: $F\\left(\\frac{\\pi}{4}\\right) = 2\\sin\\frac{\\pi}{4} - \\cot\\frac{\\pi}{4} + C = 2\\cdot\\frac{\\sqrt{2}}{2} - 1 + C = \\sqrt{2} - 1 + C = -1 \\Rightarrow C = -\\sqrt{2}$. Vậy $F(x) = 2\\sin x - \\cot x - \\sqrt{2}$.'
  },
  {
    id: 10,
    title: 'Câu 4.31 SGK trang 28: Bài toán bơi ngược dòng của cá hồi',
    pts: 20,
    question: 'Một con cá hồi bơi ngược dòng vượt thác với vận tốc mô hình hóa bởi $v(t) = -\\frac{2t}{5} + 4$ ($km/h$) ($0 \\le t \\le 10$). Quãng đường bơi tối đa của cá hồi trước khi dừng hẳn là:',
    options: [
      { text: '$20\\text{ km}$', correct: true },
      { text: '$40\\text{ km}$', correct: false },
      { text: '$15\\text{ km}$', correct: false },
      { text: '$25\\text{ km}$', correct: false }
    ],
    explanation: 'Cá hồi dừng hẳn khi vận tốc $v(t) = 0 \\Leftrightarrow -\\frac{2t}{5} + 4 = 0 \\Leftrightarrow t = 10\\text{ giờ}$. Quãng đường bơi được là tích phân: $s = \\int_0^{10} \\left(-\\frac{2t}{5} + 4\\right)\\,dt = \\left[-\\frac{t^2}{5} + 4t\\right]_0^{10} = -\\frac{100}{5} + 40 = -20 + 40 = 20\\text{ km}$.'
  }
];

// --- RENDER QUIZ CONTAINER ---
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let answeredCount = 0;
  let arenaScoreTotal = 0;

  quizData.forEach((item, index) => {
    const isAnswered = appState.answered[item.id] !== undefined;
    const userChoice = isAnswered ? appState.answered[item.id].choice : null;
    if (isAnswered) {
      answeredCount++;
      if (appState.answered[item.id].correct) arenaScoreTotal += item.pts;
    }

    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard-${item.id}`;

    const cardHeader = document.createElement('div');
    cardHeader.className = 'quiz-card-header';
    cardHeader.innerHTML = `<span><strong>${item.title}</strong></span><span style="color: #f59e0b; font-weight: bold;">+${item.pts} XP</span>`;

    const qText = document.createElement('p');
    qText.style.margin = '10px 0';
    qText.innerHTML = item.question;

    const optGrid = document.createElement('div');
    optGrid.style.display = 'grid';
    optGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(220px, 1fr))';
    optGrid.style.gap = '10px';
    optGrid.style.marginTop = '12px';

    item.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.id = `btn-q${item.id}-opt${optIndex}`;
      btn.innerHTML = `<strong>${String.fromCharCode(65 + optIndex)}.</strong> ${opt.text}`;

      if (isAnswered) {
        btn.disabled = true;
        if (opt.correct) {
          btn.classList.add('correct');
        } else if (userChoice === optIndex) {
          btn.classList.add('wrong');
        }
      } else {
        btn.onclick = () => handleAnswer(item.id, optIndex, opt.correct, item.pts);
      }
      optGrid.appendChild(btn);
    });

    const expBox = document.createElement('div');
    expBox.className = `explanation-box ${isAnswered ? 'show' : ''}`;
    expBox.id = `exp-q${item.id}`;
    expBox.innerHTML = `<strong>💡 Lời giải chi tiết:</strong> ${item.explanation}`;

    card.appendChild(cardHeader);
    card.appendChild(qText);
    card.appendChild(optGrid);
    card.appendChild(expBox);
    container.appendChild(card);
  });

  const arenaProgress = document.getElementById('arenaProgress');
  const arenaScore = document.getElementById('arenaScore');
  if (arenaProgress) arenaProgress.textContent = `${answeredCount}/${quizData.length}`;
  if (arenaScore) arenaScore.textContent = `${arenaScoreTotal} XP`;

  renderMathInTree(container);
}

function handleAnswer(questionId, choiceIndex, isCorrect, pts) {
  if (appState.answered[questionId] !== undefined) return;

  appState.answered[questionId] = { choice: choiceIndex, correct: isCorrect };

  if (isCorrect) {
    appState.xp += pts;
    appState.streak += 1;
    sounds.playCorrect();
  } else {
    appState.streak = 0;
    sounds.playWrong();
  }

  saveState();
  updateHUD();
  renderQuiz();
}

// --- LAB 1: TRẠM TÍCH PHÂN ĐA NĂNG (OMNI INTEGRAL SOLVER) ---
let lab1Interacted = false;
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  const funcSelect = document.getElementById('lab1FuncSelect');
  const sliderA = document.getElementById('lab1SliderA');
  const sliderB = document.getElementById('lab1SliderB');
  const valA = document.getElementById('lab1ValA');
  const valB = document.getElementById('lab1ValB');
  const output = document.getElementById('lab1Output');

  if (!canvas || !funcSelect || !sliderA || !sliderB) return;
  const ctx = canvas.getContext('2d');

  function getFunc(key) {
    switch (key) {
      case 'sin2x':
        return {
          f: (x) => Math.sin(2 * x),
          F: (x) => -0.5 * Math.cos(2 * x),
          latex: 'f(x) = \\sin 2x',
          F_latex: 'F(x) = -\\frac{1}{2}\\cos 2x',
          xMin: -2.5, xMax: 3.5, yMin: -1.5, yMax: 1.5
        };
      case 'exp_diff':
        return {
          f: (x) => Math.exp(x) - 3 * Math.exp(-x),
          F: (x) => Math.exp(x) + 3 * Math.exp(-x),
          latex: 'f(x) = e^x - 3e^{-x}',
          F_latex: 'F(x) = e^x + 3e^{-x}',
          xMin: -2, xMax: 2.5, yMin: -3.5, yMax: 6.5
        };
      case 'parab_diff':
        return {
          f: (x) => -2 * x * x + 6 * x,
          F: (x) => (-2 / 3) * Math.pow(x, 3) + 3 * x * x,
          latex: 'f(x) = -2x^2 + 6x',
          F_latex: 'F(x) = -\\frac{2}{3}x^3 + 3x^2',
          xMin: -1, xMax: 4, yMin: -3, yMax: 6
        };
      case 'circle':
        return {
          f: (x) => (Math.abs(x) <= 2 ? Math.sqrt(Math.max(0, 4 - x * x)) : 0),
          F: (x) => 0.5 * (x * Math.sqrt(Math.max(0, 4 - x * x)) + 4 * Math.asin(Math.max(-1, Math.min(1, x / 2)))),
          latex: 'f(x) = \\sqrt{4 - x^2}',
          F_latex: 'F(x) = \\frac{1}{2}\\left(x\\sqrt{4 - x^2} + 4\\arcsin\\frac{x}{2}\\right)',
          xMin: -2.5, xMax: 2.5, yMin: -0.5, yMax: 2.5
        };
      default:
        return {
          f: (x) => Math.sin(2 * x),
          F: (x) => -0.5 * Math.cos(2 * x),
          latex: 'f(x) = \\sin 2x',
          F_latex: 'F(x) = -\\frac{1}{2}\\cos 2x',
          xMin: -2.5, xMax: 3.5, yMin: -1.5, yMax: 1.5
        };
    }
  }

  function draw() {
    let a = parseFloat(sliderA.value);
    let b = parseFloat(sliderB.value);
    if (a > b) {
      let t = a; a = b; b = t;
    }
    valA.textContent = a.toFixed(1);
    valB.textContent = b.toFixed(1);

    const fObj = getFunc(funcSelect.value);
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Coord transform
    const xMin = fObj.xMin, xMax = fObj.xMax;
    const yMin = fObj.yMin, yMax = fObj.yMax;
    function toPx(x) { return ((x - xMin) / (xMax - xMin)) * (W - 80) + 40; }
    function toPy(y) { return H - 35 - ((y - yMin) / (yMax - yMin)) * (H - 60); }

    // Grid lines & Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = Math.ceil(xMin); x <= Math.floor(xMax); x++) {
      ctx.beginPath();
      ctx.moveTo(toPx(x), 20);
      ctx.lineTo(toPx(x), H - 20);
      ctx.stroke();
    }
    for (let y = Math.ceil(yMin); y <= Math.floor(yMax); y++) {
      ctx.beginPath();
      ctx.moveTo(30, toPy(y));
      ctx.lineTo(W - 30, toPy(y));
      ctx.stroke();
    }

    // Axes Ox, Oy
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.lineWidth = 1.5;
    const y0 = toPy(0);
    const x0 = toPx(0);
    ctx.beginPath();
    ctx.moveTo(25, y0); ctx.lineTo(W - 25, y0); // Ox
    ctx.moveTo(x0, 15); ctx.lineTo(x0, H - 15); // Oy
    ctx.stroke();

    // Axis labels
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.font = '12px sans-serif';
    ctx.fillText('x', W - 20, y0 - 8);
    ctx.fillText('y', x0 + 8, 25);
    ctx.fillText('O', x0 - 14, y0 + 14);

    // Shaded integral area
    ctx.save();
    const steps = 150;
    const dx = (b - a) / steps;
    for (let i = 0; i < steps; i++) {
      const curX = a + i * dx;
      const nextX = curX + dx;
      const midY = fObj.f((curX + nextX) / 2);
      ctx.fillStyle = midY >= 0 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(244, 63, 94, 0.35)';
      const px1 = toPx(curX);
      const px2 = toPx(nextX);
      const py = toPy(midY);
      ctx.beginPath();
      ctx.moveTo(px1, y0);
      ctx.lineTo(px1, py);
      ctx.lineTo(px2, py);
      ctx.lineTo(px2, y0);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Bound vertical markers
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath();
    ctx.moveTo(toPx(a), 20); ctx.lineTo(toPx(a), H - 25);
    ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`a=${a.toFixed(1)}`, toPx(a) - 15, H - 10);

    ctx.strokeStyle = '#06b6d4';
    ctx.beginPath();
    ctx.moveTo(toPx(b), 20); ctx.lineTo(toPx(b), H - 25);
    ctx.stroke();
    ctx.fillStyle = '#06b6d4';
    ctx.fillText(`b=${b.toFixed(1)}`, toPx(b) - 15, H - 10);
    ctx.setLineDash([]);

    // Curve f(x)
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    let started = false;
    for (let px = 30; px <= W - 30; px += 2) {
      const vx = xMin + ((px - 40) / (W - 80)) * (xMax - xMin);
      const vy = fObj.f(vx);
      if (!isNaN(vy) && isFinite(vy)) {
        const py = toPy(vy);
        if (!started) { ctx.moveTo(px, py); started = true; }
        else { ctx.lineTo(px, py); }
      }
    }
    ctx.stroke();

    // Calculate integral value
    const valIntegral = fObj.F(b) - fObj.F(a);

    // Calculate numerical area S = int |f|
    let areaTotal = 0;
    const nTrap = 200;
    const dtrap = (b - a) / nTrap;
    for (let k = 0; k < nTrap; k++) {
      const xm = a + (k + 0.5) * dtrap;
      areaTotal += Math.abs(fObj.f(xm)) * dtrap;
    }

    if (output) {
      output.innerHTML = `
        <div style="line-height: 1.6;">
          <div><strong>1. Hàm số đã chọn:</strong> $${fObj.latex}$</div>
          <div><strong>2. Cận tích phân:</strong> $[a; b] = [${a.toFixed(1)}; ${b.toFixed(1)}]$</div>
          <div><strong>3. Nguyên hàm tìm được:</strong> $${fObj.F_latex}$</div>
          <div><strong>4. Giá trị tích phân đại số:</strong> $I = \\int_{${a.toFixed(1)}}^{${b.toFixed(1)}} f(x)\\,dx = F(${b.toFixed(1)}) - F(${a.toFixed(1)}) \\approx <span style="color: #38bdf8; font-weight: bold;">${valIntegral.toFixed(4)}</span>$</div>
          <div><strong>5. Diện tích hình phẳng thực tế:</strong> $S = \\int_{${a.toFixed(1)}}^{${b.toFixed(1)}} |f(x)|\\,dx \\approx <span style="color: #10b981; font-weight: bold;">${areaTotal.toFixed(4)}</span>$</div>
        </div>
      `;
      renderMathInTree(output);
    }

    lab1Interacted = true;
    checkLabBadge();
  }

  funcSelect.onchange = () => { sounds.playClick(); draw(); };
  sliderA.oninput = () => { sounds.playClick(); draw(); };
  sliderB.oninput = () => { sounds.playClick(); draw(); };
  draw();
}

// --- LAB 2: XƯỞNG CHẾ TÁC BÌNH GỐM TRÒN XOAY (BÀI 4.35 SGK TR. 28) ---
let lab2Interacted = false;
function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  const sliderX = document.getElementById('lab2SliderX');
  const sliderD = document.getElementById('lab2SliderD');
  const valX = document.getElementById('lab2ValX');
  const valD = document.getElementById('lab2ValD');
  const output = document.getElementById('lab2Output');

  if (!canvas || !sliderX || !sliderD) return;
  const ctx = canvas.getContext('2d');

  function fVase(x) {
    return (1 / 175) * x * x + (3 / 35) * x + 5;
  }

  function draw() {
    const h = parseFloat(sliderX.value);
    const d = parseFloat(sliderD.value);
    valX.textContent = h.toFixed(0);
    valD.textContent = d.toFixed(1);

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Draw split view: Left side 2D Cross Section, Right side 3D Rotated Pottery
    const midX = W / 2;

    // Divider line
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.25)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(midX, 10); ctx.lineTo(midX, H - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // --- LEFT: 2D Longitudinal Cross-Section ---
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.font = '12px sans-serif';
    ctx.fillText('Mặt Cắt Dọc Trục (2D)', 20, 25);

    // Transform for 2D cross section
    // x runs from 0 to 30 (height), y runs from -15 to 15 (width)
    const baseY2D = H / 2;
    const startX2D = 40;
    const scaleX = (midX - 70) / 32;
    const scaleY = (H / 2 - 40) / 16;

    // Draw central axis
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startX2D - 10, baseY2D);
    ctx.lineTo(startX2D + 32 * scaleX, baseY2D);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillText('Trục Ox', startX2D + 30 * scaleX + 5, baseY2D + 4);

    // Shaded clay wall profile (top half)
    ctx.beginPath();
    // Inner curve from 0 to h
    for (let px = 0; px <= h; px += 0.5) {
      const yIn = fVase(px);
      const cx = startX2D + px * scaleX;
      const cy = baseY2D - yIn * scaleY;
      if (px === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    // Outer curve from h back to 0
    for (let px = h; px >= 0; px -= 0.5) {
      const yOut = fVase(px) + d;
      const cx = startX2D + px * scaleX;
      const cy = baseY2D - yOut * scaleY;
      ctx.lineTo(cx, cy);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Shaded clay wall profile (bottom symmetric half)
    ctx.beginPath();
    for (let px = 0; px <= h; px += 0.5) {
      const yIn = fVase(px);
      const cx = startX2D + px * scaleX;
      const cy = baseY2D + yIn * scaleY;
      if (px === 0) ctx.moveTo(cx, cy);
      else ctx.lineTo(cx, cy);
    }
    for (let px = h; px >= 0; px -= 0.5) {
      const yOut = fVase(px) + d;
      const cx = startX2D + px * scaleX;
      const cy = baseY2D + yOut * scaleY;
      ctx.lineTo(cx, cy);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.fill();
    ctx.stroke();

    // Dimension indicators
    ctx.fillStyle = '#38bdf8';
    ctx.font = '11px sans-serif';
    ctx.fillText(`h = ${h.toFixed(0)} cm`, startX2D + (h / 2) * scaleX - 20, H - 20);
    ctx.fillText(`d = ${d.toFixed(1)} cm`, startX2D + 5, baseY2D - (fVase(0) + d + 1) * scaleY);

    // --- RIGHT: 3D Rotated Pottery Simulation ---
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('Mô Phỏng Tròn Xoay 3D', midX + 25, 25);

    const center3DX = midX + (W - midX) / 2;
    const base3DY = H - 45;
    const scaleHeight = (H - 90) / 30;

    // Draw clay body layers with 3D gradient
    for (let px = 0; px <= h; px += 1.2) {
      const yOut = fVase(px) + d;
      const layerY = base3DY - px * scaleHeight;
      const rx = yOut * 3.8;
      const ry = rx * 0.28;

      ctx.beginPath();
      ctx.ellipse(center3DX, layerY, rx, ry, 0, 0, 2 * Math.PI);
      const grad = ctx.createLinearGradient(center3DX - rx, layerY, center3DX + rx, layerY);
      grad.addColorStop(0, 'rgba(180, 83, 9, 0.85)');
      grad.addColorStop(0.3, 'rgba(251, 191, 36, 0.95)');
      grad.addColorStop(0.7, 'rgba(217, 119, 6, 0.9)');
      grad.addColorStop(1, 'rgba(120, 53, 15, 0.85)');
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Top rim ellipse (outer and inner opening)
    const topY = base3DY - h * scaleHeight;
    const rTopOut = (fVase(h) + d) * 3.8;
    const rTopIn = fVase(h) * 3.8;
    const ryTopOut = rTopOut * 0.28;
    const ryTopIn = rTopIn * 0.28;

    // Inner vase cavity dark shading
    ctx.beginPath();
    ctx.ellipse(center3DX, topY, rTopIn, ryTopIn, 0, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(30, 27, 75, 0.9)';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Volume computation
    // V = pi * int_0^h [(y+d)^2 - y^2] dx = pi * int_0^h (2yd + d^2) dx
    // int y dx = (1/525) x^3 + (3/70) x^2 + 5x
    const intY = (Math.pow(h, 3) / 525) + (3 * Math.pow(h, 2) / 70) + 5 * h;
    const volClayCm3 = Math.PI * (2 * d * intY + d * d * h);
    const volLiters = volClayCm3 / 1000;

    // Capacity of the vase (inner volume): V_in = pi * int_0^h y^2 dx
    // Approximated by numerical Simpson
    let intY2 = 0;
    const nSteps = 100;
    const dstep = h / nSteps;
    for (let k = 0; k < nSteps; k++) {
      const xm = (k + 0.5) * dstep;
      const yVal = fVase(xm);
      intY2 += yVal * yVal * dstep;
    }
    const volInnerCm3 = Math.PI * intY2;
    const volInnerLiters = volInnerCm3 / 1000;

    if (output) {
      output.innerHTML = `
        <div style="line-height: 1.6;">
          <div><strong>1. Đường cong sinh mặt trong:</strong> $y = f(x) = \\frac{1}{175}x^2 + \\frac{3}{35}x + 5$ với $x \\in [0; ${h.toFixed(0)}]$ cm.</div>
          <div><strong>2. Đường cong sinh mặt ngoài:</strong> $y_{ngo\\grave{a}i} = f(x) + d = f(x) + ${d.toFixed(1)}$ cm.</div>
          <div><strong>3. Công thức thể tích đất sét:</strong> $V = \\pi \\int_0^{${h.toFixed(0)}} [(f(x)+d)^2 - (f(x))^2]\\,dx = \\pi \\int_0^{${h.toFixed(0)}} [2d\\cdot f(x) + d^2]\\,dx$</div>
          <div><strong>4. Thể tích đất sét cần dùng:</strong> $V_{clay} \\approx <span style="color: #f59e0b; font-weight: bold;">${volClayCm3.toFixed(1)}</span>\\text{ cm}^3$ ($<span style="color: #f59e0b; font-weight: bold;">${volLiters.toFixed(3)}</span>$ lít).</div>
          <div><strong>5. Dung tích chứa của lòng bình:</strong> $V_{trong} \\approx <span style="color: #38bdf8; font-weight: bold;">${volInnerCm3.toFixed(1)}</span>\\text{ cm}^3$ ($<span style="color: #38bdf8; font-weight: bold;">${volInnerLiters.toFixed(2)}</span>$ lít nước).</div>
        </div>
      `;
      renderMathInTree(output);
    }

    lab2Interacted = true;
    checkLabBadge();
  }

  sliderX.oninput = () => { sounds.playClick(); draw(); };
  sliderD.oninput = () => { sounds.playClick(); draw(); };
  draw();
}

function checkLabBadge() {
  if (lab1Interacted && lab2Interacted && !appState.badges[2]) {
    appState.badges[2] = true;
    sounds.playLevelUp();
    saveState();
    checkBadges();
  }
}

// --- EVENT LISTENERS & INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateHUD();

  // Tab Navigation
  const tabBtns = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      sounds.playClick();
      tabBtns.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const tabId = `tab-${btn.dataset.tab}`;
      const target = document.getElementById(tabId);
      if (target) {
        target.classList.add('active');
        renderMathInTree(target);
      }
    });
  });

  // Sound Toggle
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      appState.sound = !appState.sound;
      sounds.enabled = appState.sound;
      sounds.playClick();
      updateHUD();
      saveState();
    });
  }

  // Reset Progress
  const resetProgress = document.getElementById('resetProgress');
  if (resetProgress) {
    resetProgress.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập Ôn tập Chương IV không?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.stars = 2;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        sounds.playTone(300, 'sawtooth', 0.2);
        saveState();
        updateHUD();
        renderQuiz();
      }
    });
  }

  // Avatar Modal
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const btnCloseAvatarModal = document.getElementById('btnCloseAvatarModal');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      sounds.playClick();
      avatarModal.style.display = 'flex';
    });
  }
  if (btnCloseAvatarModal && avatarModal) {
    btnCloseAvatarModal.addEventListener('click', () => {
      sounds.playClick();
      avatarModal.style.display = 'none';
    });
  }

  const avatarOpts = document.querySelectorAll('.avatar-opt');
  avatarOpts.forEach(opt => {
    opt.addEventListener('click', () => {
      sounds.playClick();
      appState.avatar = opt.dataset.avatar;
      appState.userName = opt.dataset.name;
      if (avatarModal) avatarModal.style.display = 'none';
      saveState();
      updateHUD();
    });
  });

  // Print Certificate Button
  const btnPrintCert = document.getElementById('btnPrintCert');
  if (btnPrintCert) {
    btnPrintCert.addEventListener('click', () => {
      sounds.playClick();
      window.print();
    });
  }

  // Initialize Labs and Quiz
  initLab1();
  initLab2();
  renderQuiz();

  // Initial Math Rendering
  renderMathInTree(document.body);
});
