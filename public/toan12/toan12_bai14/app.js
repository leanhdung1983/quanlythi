// ==========================================
// TOÁN 12 - BÀI 14: PHƯƠNG TRÌNH MẶT PHẲNG
// Hệ Thống Học Liệu Số Tương Tác Chuẩn SGK KNTT
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
      const notes = [523.25, 659.25, 783.99, 1046.50];
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
  s = s.replace(/\\left\|([^\\|]+)\\right\|/g, '<mrow><mo>|</mo><mrow>$1</mrow><mo>|</mo></mrow>');
  s = s.replace(/\|([^|]+)\|/g, '<mrow><mo>|</mo><mrow>$1</mrow><mo>|</mo></mrow>');
  s = s.replace(/\\perp/g, '<mo>&#8869;</mo>');
  s = s.replace(/\\parallel/g, '<mo>&#8741;</mo>');
  s = s.replace(/\\iff/g, '<mo>&#8660;</mo>');
  s = s.replace(/\\Rightarrow/g, '<mo>&#8658;</mo>');
  s = s.replace(/\\forall/g, '<mo>&#8704;</mo>');
  s = s.replace(/\\cdot/g, '<mo>&#8901;</mo>');
  s = s.replace(/\\times/g, '<mo>&#215;</mo>');
  s = s.replace(/\\approx/g, '<mo>&#8776;</mo>');
  s = s.replace(/\\le/g, '<mo>&#8804;</mo>');
  s = s.replace(/\\ge/g, '<mo>&#8805;</mo>');
  s = s.replace(/\\ne/g, '<mo>&#8800;</mo>');
  s = s.replace(/\\alpha/g, '<mi>&#945;</mi>');
  s = s.replace(/\\beta/g, '<mi>&#946;</mi>');
  s = s.replace(/\\pi/g, '<mi>&#960;</mi>');
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
const STORAGE_KEY = 'toan12_bai14_state';
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Sứ Toạ Độ Không Gian',
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

  // Star calculation
  if (appState.xp >= 200) appState.stars = 5;
  else if (appState.xp >= 150) appState.stars = 4;
  else if (appState.xp >= 100) appState.stars = 3;
  else if (appState.xp >= 40) appState.stars = 2;
  else appState.stars = 1;

  if (starRating) {
    let s = '';
    for (let i = 1; i <= 5; i++) s += i <= appState.stars ? '⭐' : '☆';
    starRating.textContent = s;
  }

  // Cert fields
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

  // Badge 1: Làm câu đầu tiên
  if (answeredCount >= 1 && !appState.badges[0]) {
    appState.badges[0] = true;
    sounds.playLevelUp();
  }
  // Badge 2: Streak >= 3
  if (appState.streak >= 3 && !appState.badges[1]) {
    appState.badges[1] = true;
    sounds.playLevelUp();
  }
  // Badge 3: Labs (handled in lab interaction)
  // Badge 4: Điểm arena >= 160 XP
  if (appState.xp >= 160 && !appState.badges[3]) {
    appState.badges[3] = true;
    sounds.playLevelUp();
  }
  // Badge 5: 10/10 câu đúng
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

// --- QUIZ DATA (10 CÂU BÁI 14 SGK KNTT TRANG 29–40) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1: Xác định Vectơ Pháp Tuyến của mặt phẳng',
    pts: 20,
    question: 'Trong không gian $Oxyz$, một vectơ pháp tuyến của mặt phẳng $(\\alpha): 2x - 3y + z - 5 = 0$ là:',
    options: [
      { text: '$\\overrightarrow{n} = (2; -3; 1)$', correct: true },
      { text: '$\\overrightarrow{n} = (2; 3; 1)$', correct: false },
      { text: '$\\overrightarrow{n} = (2; -3; -5)$', correct: false },
      { text: '$\\overrightarrow{n} = (-3; 1; -5)$', correct: false }
    ],
    explanation: 'Mặt phẳng có dạng $Ax + By + Cz + D = 0$ luôn nhận $\\overrightarrow{n} = (A; B; C) = (2; -3; 1)$ làm một vectơ pháp tuyến.'
  },
  {
    id: 2,
    title: 'Câu 2: Viết phương trình mặt phẳng qua 1 điểm và biết VTPT',
    pts: 20,
    question: 'Phương trình mặt phẳng đi qua điểm $M(1; 2; -1)$ và nhận $\\overrightarrow{n} = (3; 1; -2)$ làm VTPT là:',
    options: [
      { text: '$3x + y - 2z - 7 = 0$', correct: true },
      { text: '$3x + y - 2z + 7 = 0$', correct: false },
      { text: '$3x + y - 2z - 3 = 0$', correct: false },
      { text: '$x + 2y - z - 7 = 0$', correct: false }
    ],
    explanation: 'Phương trình mặt phẳng là: $3(x - 1) + 1(y - 2) - 2(z - (-1)) = 0 \\iff 3x - 3 + y - 2 - 2z - 2 = 0 \\iff 3x + y - 2z - 7 = 0$.'
  },
  {
    id: 3,
    title: 'Câu 3 (Bài 5.1 SGK trang 39): Mặt phẳng vuông góc trục toạ độ',
    pts: 20,
    question: 'Trong không gian $Oxyz$, phương trình mặt phẳng đi qua điểm $M(1; 2; -1)$ và vuông góc với trục $Ox$ là:',
    options: [
      { text: '$x - 1 = 0$', correct: true },
      { text: '$y - 2 = 0$', correct: false },
      { text: '$z + 1 = 0$', correct: false },
      { text: '$x + 2y - z = 0$', correct: false }
    ],
    explanation: 'Mặt phẳng vuông góc với trục $Ox$ nhận vectơ đơn vị $\\overrightarrow{i} = (1; 0; 0)$ làm VTPT. Do đi qua $M(1; 2; -1)$ nên phương trình là $1(x - 1) + 0(y - 2) + 0(z + 1) = 0 \\iff x - 1 = 0$.'
  },
  {
    id: 4,
    title: 'Câu 4: Tích có hướng của cặp VTCP',
    pts: 20,
    question: 'Cho cặp vectơ chỉ phương của mặt phẳng $(\\alpha)$ là $\\overrightarrow{a} = (1; 0; 2)$ và $\\overrightarrow{b} = (-1; 1; 1)$. Vectơ pháp tuyến $\\overrightarrow{n} = [\\overrightarrow{a}, \\overrightarrow{b}]$ là:',
    options: [
      { text: '$\\overrightarrow{n} = (-2; -3; 1)$', correct: true },
      { text: '$\\overrightarrow{n} = (2; 3; 1)$', correct: false },
      { text: '$\\overrightarrow{n} = (-2; 3; 1)$', correct: false },
      { text: '$\\overrightarrow{n} = (2; -3; -1)$', correct: false }
    ],
    explanation: 'Áp dụng công thức tích có hướng: $\\overrightarrow{n} = (0\\cdot 1 - 2\\cdot 1;\\; 2(-1) - 1\\cdot 1;\\; 1\\cdot 1 - 0(-1)) = (-2; -3; 1)$.'
  },
  {
    id: 5,
    title: 'Câu 5: Phương trình mặt phẳng theo đoạn chắn',
    pts: 20,
    question: 'Mặt phẳng đi qua ba điểm $A(2; 0; 0)$, $B(0; -3; 0)$, $C(0; 0; 1)$ có phương trình là:',
    options: [
      { text: '$3x - 2y + 6z - 6 = 0$', correct: true },
      { text: '$3x + 2y + 6z - 6 = 0$', correct: false },
      { text: '$3x - 2y + 6z + 6 = 0$', correct: false },
      { text: '$\\frac{x}{2} + \\frac{y}{3} + \\frac{z}{1} = 1$', correct: false }
    ],
    explanation: 'Áp dụng phương trình mặt phẳng theo đoạn chắn: $\\frac{x}{2} + \\frac{y}{-3} + \\frac{z}{1} = 1$. Quy đồng mẫu số chung là $6$: $3x - 2y + 6z = 6 \\iff 3x - 2y + 6z - 6 = 0$.'
  },
  {
    id: 6,
    title: 'Câu 6 (Bài 5.5 SGK trang 39): Khoảng cách từ gốc toạ độ đến mặt phẳng',
    pts: 20,
    question: 'Khoảng cách từ gốc toạ độ $O(0; 0; 0)$ đến mặt phẳng $(P): 2x + 2y - z + 1 = 0$ bằng:',
    options: [
      { text: '$\\frac{1}{3}$', correct: true },
      { text: '$1$', correct: false },
      { text: '$\\frac{1}{9}$', correct: false },
      { text: '$\\frac{2}{3}$', correct: false }
    ],
    explanation: 'Áp dụng công thức khoảng cách: $d(O, (P)) = \\frac{|2(0) + 2(0) - 1(0) + 1|}{\\sqrt{2^2 + 2^2 + (-1)^2}} = \\frac{|1|}{\\sqrt{4 + 4 + 1}} = \\frac{1}{\\sqrt{9}} = \\frac{1}{3}$.'
  },
  {
    id: 7,
    title: 'Câu 7 (Bài 5.6 SGK trang 39): Khoảng cách giữa hai mặt phẳng song song',
    pts: 20,
    question: 'Cho hai mặt phẳng song song $(P): x + y + z + 2 = 0$ và $(Q): x + y + z + 6 = 0$. Khoảng cách giữa $(P)$ và $(Q)$ là:',
    options: [
      { text: '$\\frac{4\\sqrt{3}}{3}$', correct: true },
      { text: '$4$', correct: false },
      { text: '$\\frac{8}{\\sqrt{3}}$', correct: false },
      { text: '$4\\sqrt{3}$', correct: false }
    ],
    explanation: 'Hai mặt phẳng có cùng vectơ pháp tuyến $\\overrightarrow{n} = (1; 1; 1)$. Khoảng cách giữa chúng là: $d((P), (Q)) = \\frac{|6 - 2|}{\\sqrt{1^2 + 1^2 + 1^2}} = \\frac{4}{\\sqrt{3}} = \\frac{4\\sqrt{3}}{3}$.'
  },
  {
    id: 8,
    title: 'Câu 8 (Bài 5.7 SGK trang 39): Vị trí tương đối vuông góc giữa 2 mặt phẳng',
    pts: 20,
    question: 'Cho hai mặt phẳng $(P): x + 3y - z = 0$ và $(Q): x - y - 2z + 1 = 0$. Khẳng định nào sau đây là đúng?',
    options: [
      { text: '$(P) \\perp (Q)$', correct: true },
      { text: '$(P) \\parallel (Q)$', correct: false },
      { text: '$(P) \\equiv (Q)$', correct: false },
      { text: '$(P)$ cắt $(Q)$ nhưng không vuông góc', correct: false }
    ],
    explanation: 'Ta có $\\overrightarrow{n}_P = (1; 3; -1)$ và $\\overrightarrow{n}_Q = (1; -1; -2)$. Xét tích vô hướng: $\\overrightarrow{n}_P \\cdot \\overrightarrow{n}_Q = 1(1) + 3(-1) + (-1)(-2) = 1 - 3 + 2 = 0$. Do đó $(P) \\perp (Q)$.'
  },
  {
    id: 9,
    title: 'Câu 9 (Bài 5.3 SGK trang 39): Mặt phẳng vuông góc với 2 mặt phẳng cho trước',
    pts: 20,
    question: 'Phương trình mặt phẳng $(P)$ đi qua $M(1; -1; 5)$ và cùng vuông góc với hai mặt phẳng $(Q): 3x + 2y - z = 0$ và $(R): x + y - z = 0$ là:',
    options: [
      { text: '$-x + 2y + z - 2 = 0$', correct: true },
      { text: '$x + 2y + z - 4 = 0$', correct: false },
      { text: '$-x + 2y + z + 2 = 0$', correct: false },
      { text: '$3x - y - 2z + 6 = 0$', correct: false }
    ],
    explanation: 'Do $(P) \\perp (Q)$ và $(P) \\perp (R)$ nên $\\overrightarrow{n}_P = [\\overrightarrow{n}_Q, \\overrightarrow{n}_R]$. Với $\\overrightarrow{n}_Q = (3; 2; -1)$ và $\\overrightarrow{n}_R = (1; 1; -1)$, ta có $\\overrightarrow{n}_P = (-1; 2; 1)$. Phương trình qua $M(1; -1; 5)$ là: $-1(x - 1) + 2(y + 1) + 1(z - 5) = 0 \\iff -x + 2y + z - 2 = 0$.'
  },
  {
    id: 10,
    title: 'Câu 10 (Vận dụng 5 SGK trang 39): Khoảng cách từ camera đến mặt phẳng sàn',
    pts: 20,
    question: 'Một camera an ninh đặt tại $C(1; 2; 4)$ chiếu vuông góc về phía mặt sàn $(P): x + 2y + 2z + 3 = 0$. Khoảng cách từ camera đến mặt sàn là:',
    options: [
      { text: '$\\frac{16}{3}\\text{ m} \\approx 5.33\\text{ m}$', correct: true },
      { text: '$5\\text{ m}$', correct: false },
      { text: '$\\frac{13}{3}\\text{ m} \\approx 4.33\\text{ m}$', correct: false },
      { text: '$6\\text{ m}$', correct: false }
    ],
    explanation: 'Khoảng cách từ $C(1; 2; 4)$ đến $(P)$ là: $d = \\frac{|1(1) + 2(2) + 2(4) + 3|}{\\sqrt{1^2 + 2^2 + 2^2}} = \\frac{|1 + 4 + 8 + 3|}{\\sqrt{9}} = \\frac{16}{3}\\text{ m} \\approx 5.33\\text{ m}$.'
  }
];

// --- RENDER QUIZ CONTAINER ---
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let answeredCount = 0;
  let arenaScoreTotal = 0;

  quizData.forEach((item) => {
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

// --- LAB 1: MÁY THÁM HIỂM KHÔNG GIAN MẶT PHẲNG 3D ---
let lab1Interacted = false;
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  const sA = document.getElementById('lab1SliderA');
  const sB = document.getElementById('lab1SliderB');
  const sC = document.getElementById('lab1SliderC');
  const sD = document.getElementById('lab1SliderD');
  const sRot = document.getElementById('lab1SliderRot');
  const vA = document.getElementById('lab1ValA');
  const vB = document.getElementById('lab1ValB');
  const vC = document.getElementById('lab1ValC');
  const vD = document.getElementById('lab1ValD');
  const rotVal = document.getElementById('lab1RotVal');
  const output = document.getElementById('lab1Output');

  if (!canvas || !sA || !sB || !sC || !sD) return;
  const ctx = canvas.getContext('2d');

  function project(x, y, z, rotRad) {
    // 3D Isometric / Orthographic rotation around Z and tilt
    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);
    const rx = x * cosR - y * sinR;
    const ry = x * sinR + y * cosR;

    const tilt = 0.55;
    const px = canvas.width / 2 + rx * 24;
    const py = canvas.height / 2 + (ry * 12 - z * 22) * tilt;
    return { x: px, y: py };
  }

  function draw() {
    let A = parseFloat(sA.value);
    let B = parseFloat(sB.value);
    let C = parseFloat(sC.value);
    let D = parseFloat(sD.value);
    let rotDeg = parseFloat(sRot.value);
    let rotRad = (rotDeg * Math.PI) / 180;

    vA.textContent = A;
    vB.textContent = B;
    vC.textContent = C;
    vD.textContent = D;
    rotVal.textContent = `${rotDeg}°`;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Draw 3D Axes: Ox, Oy, Oz
    const O = project(0, 0, 0, rotRad);
    const X = project(6, 0, 0, rotRad);
    const Y = project(0, 6, 0, rotRad);
    const Z = project(0, 0, 6, rotRad);

    // Negative axes dashed
    const negX = project(-4, 0, 0, rotRad);
    const negY = project(0, -4, 0, rotRad);
    const negZ = project(0, 0, -4, rotRad);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(negX.x, negX.y); ctx.lineTo(O.x, O.y);
    ctx.moveTo(negY.x, negY.y); ctx.lineTo(O.x, O.y);
    ctx.moveTo(negZ.x, negZ.y); ctx.lineTo(O.x, O.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Positive axes solid
    ctx.lineWidth = 1.8;
    // Ox red
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(X.x, X.y); ctx.stroke();
    // Oy green
    ctx.strokeStyle = '#10b981';
    ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(Y.x, Y.y); ctx.stroke();
    // Oz blue
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(Z.x, Z.y); ctx.stroke();

    // Labels
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#ef4444'; ctx.fillText('x', X.x + 5, X.y);
    ctx.fillStyle = '#10b981'; ctx.fillText('y', Y.x + 5, Y.y);
    ctx.fillStyle = '#38bdf8'; ctx.fillText('z', Z.x, Z.y - 6);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; ctx.fillText('O', O.x - 12, O.y + 12);

    // Calculate plane points or intercepts
    // Plane: A x + B y + C z + D = 0
    let intX = A !== 0 ? -D / A : null;
    let intY = B !== 0 ? -D / B : null;
    let intZ = C !== 0 ? -D / C : null;

    // Generate plane polygon inside a box [-5, 5]
    // Draw 4 corners on plane
    let pPts = [];
    if (C !== 0) {
      const corners = [
        [-4, -4], [4, -4], [4, 4], [-4, 4]
      ];
      corners.forEach(([cx, cy]) => {
        const cz = (-D - A * cx - B * cy) / C;
        pPts.push(project(cx, cy, cz, rotRad));
      });
    } else if (B !== 0) {
      const corners = [
        [-4, -4], [4, -4], [4, 4], [-4, 4]
      ];
      corners.forEach(([cx, cz]) => {
        const cy = (-D - A * cx - C * cz) / B;
        pPts.push(project(cx, cy, cz, rotRad));
      });
    } else if (A !== 0) {
      const corners = [
        [-4, -4], [4, -4], [4, 4], [-4, 4]
      ];
      corners.forEach(([cy, cz]) => {
        const cx = (-D - B * cy - C * cz) / A;
        pPts.push(project(cx, cy, cz, rotRad));
      });
    }

    if (pPts.length >= 3) {
      ctx.beginPath();
      ctx.moveTo(pPts[0].x, pPts[0].y);
      for (let i = 1; i < pPts.length; i++) ctx.lineTo(pPts[i].x, pPts[i].y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(99, 102, 241, 0.28)';
      ctx.fill();
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    // Normal vector arrow n = (A, B, C)
    const normLen = Math.sqrt(A * A + B * B + C * C);
    if (normLen > 0) {
      // Scale normal vector for visualization
      const scaleN = 2.5 / normLen;
      const nHead = project(A * scaleN, B * scaleN, C * scaleN, rotRad);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(O.x, O.y);
      ctx.lineTo(nHead.x, nHead.y);
      ctx.stroke();

      // Arrowhead
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(nHead.x, nHead.y, 4, 0, 2 * Math.PI);
      ctx.fill();
      ctx.fillText(`n = (${A}; ${B}; ${C})`, nHead.x + 8, nHead.y - 4);
    }

    // Intercept markers
    if (intX !== null && Math.abs(intX) <= 6) {
      const pX = project(intX, 0, 0, rotRad);
      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(pX.x, pX.y, 4, 0, 2 * Math.PI); ctx.fill();
      ctx.fillText(`(${intX.toFixed(1)};0;0)`, pX.x + 5, pX.y - 4);
    }
    if (intY !== null && Math.abs(intY) <= 6) {
      const pY = project(0, intY, 0, rotRad);
      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(pY.x, pY.y, 4, 0, 2 * Math.PI); ctx.fill();
      ctx.fillText(`(0;${intY.toFixed(1)};0)`, pY.x + 5, pY.y - 4);
    }
    if (intZ !== null && Math.abs(intZ) <= 6) {
      const pZ = project(0, 0, intZ, rotRad);
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(pZ.x, pZ.y, 4, 0, 2 * Math.PI); ctx.fill();
      ctx.fillText(`(0;0;${intZ.toFixed(1)})`, pZ.x + 5, pZ.y - 4);
    }

    // Equation string formatting
    let terms = [];
    if (A !== 0) terms.push(`${A === 1 ? '' : A === -1 ? '-' : A}x`);
    if (B !== 0) terms.push(`${B > 0 && terms.length > 0 ? '+ ' : ''}${B === 1 ? '' : B === -1 ? '-' : B}y`);
    if (C !== 0) terms.push(`${C > 0 && terms.length > 0 ? '+ ' : ''}${C === 1 ? '' : C === -1 ? '-' : C}z`);
    if (D !== 0) terms.push(`${D > 0 && terms.length > 0 ? '+ ' : ''}${D}`);
    let eqStr = terms.length > 0 ? terms.join(' ') + ' = 0' : '0 = 0';

    if (output) {
      output.innerHTML = `
        <div style="line-height: 1.6;">
          <div><strong>1. Phương trình tổng quát:</strong> $(${eqStr})$</div>
          <div><strong>2. Vectơ pháp tuyến:</strong> $\\overrightarrow{n} = (${A};\\; ${B};\\; ${C})$ với độ dài $|\\overrightarrow{n}| = \\sqrt{${A}^2 + ${B}^2 + ${C}^2} = <span style="color: #f59e0b; font-weight: bold;">${normLen.toFixed(2)}</span>$</div>
          <div><strong>3. Giao điểm với các trục toạ độ:</strong></div>
          <div style="margin-left: 15px; color: #94a3b8;">
            • Trục $Ox$: ${intX !== null ? `$(${intX.toFixed(2)};\\; 0;\\; 0)$` : 'Song song hoặc chứa $Ox$'} <br>
            • Trục $Oy$: ${intY !== null ? `$(0;\\; ${intY.toFixed(2)};\\; 0)$` : 'Song song hoặc chứa $Oy$'} <br>
            • Trục $Oz$: ${intZ !== null ? `$(0;\\; 0;\\; ${intZ.toFixed(2)})$` : 'Song song hoặc chứa $Oz$'}
          </div>
        </div>
      `;
      renderMathInTree(output);
    }

    lab1Interacted = true;
    checkLabBadge();
  }

  sA.oninput = () => { sounds.playClick(); draw(); };
  sB.oninput = () => { sounds.playClick(); draw(); };
  sC.oninput = () => { sounds.playClick(); draw(); };
  sD.oninput = () => { sounds.playClick(); draw(); };
  sRot.oninput = () => { draw(); };
  draw();
}

// --- LAB 2: MÁY ĐO KHOẢNG CÁCH & VÙNG PHỦ CAMERA AN NINH 3D ---
let lab2Interacted = false;
function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  const sZ = document.getElementById('lab2SliderZ');
  const sAngle = document.getElementById('lab2SliderAngle');
  const vZ = document.getElementById('lab2ValZ');
  const vAngle = document.getElementById('lab2ValAngle');
  const output = document.getElementById('lab2Output');

  if (!canvas || !sZ || !sAngle) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const zC = parseFloat(sZ.value);
    const alphaDeg = parseFloat(sAngle.value);
    vZ.textContent = zC.toFixed(1);
    vAngle.textContent = `${alphaDeg}°`;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Problem data from SGK Vận dụng 5 (trang 39):
    // Floor plane (P): x + 2y + 2z + 3 = 0
    // Camera C(1, 2, zC)
    const xC = 1, yC = 2;
    const A = 1, B = 2, C_coef = 2, D = 3;
    const norm = Math.sqrt(A * A + B * B + C_coef * C_coef); // sqrt(1+4+4) = 3

    // Distance CH
    const valNumer = Math.abs(A * xC + B * yC + C_coef * zC + D);
    const dist = valNumer / norm;

    // Radius of coverage circle on floor
    const halfAngleRad = ((alphaDeg / 2) * Math.PI) / 180;
    const radius = dist * Math.tan(halfAngleRad);
    const areaCoverage = Math.PI * radius * radius;

    // 2D/3D Graphic representation:
    // Side profile & 3D cone
    const camPx = W / 2;
    const camPy = 50;

    // Floor baseline
    const floorY = H - 65;
    const floorWidth = Math.min(W - 40, radius * 36 + 60);

    // Floor surface
    const gradFloor = ctx.createLinearGradient(camPx - floorWidth / 2, floorY, camPx + floorWidth / 2, floorY);
    gradFloor.addColorStop(0, 'rgba(15, 23, 42, 0.4)');
    gradFloor.addColorStop(0.5, 'rgba(30, 41, 59, 0.9)');
    gradFloor.addColorStop(1, 'rgba(15, 23, 42, 0.4)');
    ctx.fillStyle = gradFloor;
    ctx.fillRect(camPx - floorWidth / 2, floorY, floorWidth, 14);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(camPx - floorWidth / 2, floorY);
    ctx.lineTo(camPx + floorWidth / 2, floorY);
    ctx.stroke();

    // Projected coverage ellipse on floor
    const rPx = Math.min((W - 80) / 2, radius * 18);
    const ryPx = rPx * 0.28;

    // Shaded light cone from Camera to Floor
    const gradCone = ctx.createLinearGradient(camPx, camPy, camPx, floorY);
    gradCone.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
    gradCone.addColorStop(0.3, 'rgba(251, 191, 36, 0.35)');
    gradCone.addColorStop(1, 'rgba(245, 158, 11, 0.15)');

    ctx.beginPath();
    ctx.moveTo(camPx, camPy);
    ctx.lineTo(camPx - rPx, floorY);
    ctx.ellipse(camPx, floorY, rPx, ryPx, 0, Math.PI, 0, true);
    ctx.lineTo(camPx, camPy);
    ctx.fillStyle = gradCone;
    ctx.fill();

    // Coverage circle boundary
    ctx.beginPath();
    ctx.ellipse(camPx, floorY, rPx, ryPx, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.3)';
    ctx.fill();

    // Perpendicular height CH
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(camPx, camPy);
    ctx.lineTo(camPx, floorY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Right angle marker at H
    ctx.strokeRect(camPx - 8, floorY - 8, 8, 8);

    // Camera fixture icon
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(camPx, camPy, 9, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Text annotations on canvas
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`Camera C(1; 2; ${zC.toFixed(1)})`, camPx - 55, camPy - 14);

    ctx.fillStyle = '#ef4444';
    ctx.fillText(`d = ${dist.toFixed(2)} m`, camPx + 10, (camPy + floorY) / 2);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`Bán kính R = ${radius.toFixed(2)} m`, camPx - 55, floorY + 28);
    ctx.fillText(`Góc mở α = ${alphaDeg}°`, camPx - 35, camPy + 32);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`Mặt sàn (P): x + 2y + 2z + 3 = 0`, camPx - floorWidth / 2 + 10, floorY - 8);

    if (output) {
      output.innerHTML = `
        <div style="line-height: 1.6;">
          <div><strong>1. Toạ độ Camera:</strong> $C(1;\\; 2;\\; ${zC.toFixed(1)})$ m, Mặt phẳng sàn: $(P): x + 2y + 2z + 3 = 0$.</div>
          <div><strong>2. Khoảng cách vuông góc:</strong> $d = \\frac{|1(1) + 2(2) + 2(${zC.toFixed(1)}) + 3|}{\\sqrt{1^2 + 2^2 + 2^2}} = \\frac{${valNumer.toFixed(1)}}{3} = <span style="color: #ef4444; font-weight: bold;">${dist.toFixed(2)}</span>\\text{ m}$.</div>
          <div><strong>3. Góc mở nửa nón:</strong> $\\frac{\\alpha}{2} = ${(alphaDeg / 2).toFixed(1)}^\\circ$.</div>
          <div><strong>4. Bán kính vùng quan sát:</strong> $R = d \\cdot \\tan\\left(\\frac{\\alpha}{2}\\right) = ${dist.toFixed(2)} \\cdot \\tan(${ (alphaDeg / 2).toFixed(1) }^\\circ) = <span style="color: #f59e0b; font-weight: bold;">${radius.toFixed(2)}</span>\\text{ m}$.</div>
          <div><strong>5. Diện tích vùng phủ quan sát:</strong> $S_{phủ} = \\pi R^2 \\approx <span style="color: #10b981; font-weight: bold;">${areaCoverage.toFixed(2)}</span>\\text{ m}^2$.</div>
        </div>
      `;
      renderMathInTree(output);
    }

    lab2Interacted = true;
    checkLabBadge();
  }

  sZ.oninput = () => { sounds.playClick(); draw(); };
  sAngle.oninput = () => { sounds.playClick(); draw(); };
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
      if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập Bài 14 không?')) {
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
