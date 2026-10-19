// ==========================================
// TOÁN 12 - BÀI 16: CÔNG THỨC TÍNH GÓC TRONG KHÔNG GIAN
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
  s = s.replace(/\\cos/g, '<mo>cos</mo>');
  s = s.replace(/\\sin/g, '<mo>sin</mo>');
  s = s.replace(/\\varphi/g, '<mi>&#966;</mi>');
  s = s.replace(/\\alpha/g, '<mi>&#945;</mi>');
  s = s.replace(/\\beta/g, '<mi>&#946;</mi>');
  s = s.replace(/\\Delta/g, '<mi>&#916;</mi>');
  s = s.replace(/\\cdot/g, '<mo>&#8901;</mo>');
  s = s.replace(/\\approx/g, '<mo>&#8776;</mo>');
  s = s.replace(/\\le/g, '<mo>&#8804;</mo>');
  s = s.replace(/\\ge/g, '<mo>&#8805;</mo>');
  s = s.replace(/\\perp/g, '<mo>&#8869;</mo>');
  s = s.replace(/\\parallel/g, '<mo>&#8741;</mo>');
  s = s.replace(/\\iff/g, '<mo>&#8660;</mo>');
  s = s.replace(/\\implies/g, '<mo>&#8658;</mo>');
  s = s.replace(/\\text\{([^}]+)\}/g, '<mtext>$1</mtext>');
  s = s.replace(/([a-zA-Z])_\{([^}]+)\}/g, '<msub><mi>$1</mi><mrow>$2</mrow></msub>');
  s = s.replace(/([a-zA-Z])_([0-9a-zA-Z])/g, '<msub><mi>$1</mi><mn>$2</mn></msub>');
  s = s.replace(/([0-9]+)/g, '<mn>$1</mn>');
  s = s.replace(/([a-zA-Z])/g, '<mi>$1</mi>');
  s = s.replace(/([+\-=><()[\],;^])/g, '<mo>$1</mo>');
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
const STORAGE_KEY = 'toan12_bai16_state';
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Lượng Giác Không Gian',
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

// --- QUIZ DATA (10 CÂU BÀI 16 SGK KNTT TRANG 50–53) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1: Công thức tính góc giữa hai đường thẳng',
    pts: 20,
    question: 'Cho hai đường thẳng $\\Delta_1, \\Delta_2$ lần lượt có VTCP là $\\overrightarrow{u}_1$ và $\\overrightarrow{u}_2$. Công thức tính côsin góc giữa $\\Delta_1$ và $\\Delta_2$ là:',
    options: [
      { text: '$\\cos(\\Delta_1, \\Delta_2) = \\frac{|\\overrightarrow{u}_1 \\cdot \\overrightarrow{u}_2|}{|\\overrightarrow{u}_1| \\cdot |\\overrightarrow{u}_2|}$', correct: true },
      { text: '$\\cos(\\Delta_1, \\Delta_2) = \\frac{\\overrightarrow{u}_1 \\cdot \\overrightarrow{u}_2}{|\\overrightarrow{u}_1| \\cdot |\\overrightarrow{u}_2|}$', correct: false },
      { text: '$\\sin(\\Delta_1, \\Delta_2) = \\frac{|\\overrightarrow{u}_1 \\cdot \\overrightarrow{u}_2|}{|\\overrightarrow{u}_1| \\cdot |\\overrightarrow{u}_2|}$', correct: false },
      { text: '$\\cos(\\Delta_1, \\Delta_2) = \\frac{|\\overrightarrow{u}_1 \\times \\overrightarrow{u}_2|}{|\\overrightarrow{u}_1| \\cdot |\\overrightarrow{u}_2|}$', correct: false }
    ],
    explanation: 'Góc giữa hai đường thẳng luôn là góc nhọn hoặc góc vuông ($0^\\circ \\le \\varphi \\le 90^\\circ$), do đó $\\cos(\\Delta_1, \\Delta_2) = |\\cos(\\overrightarrow{u}_1, \\overrightarrow{u}_2)| = \\frac{|\\overrightarrow{u}_1 \\cdot \\overrightarrow{u}_2|}{|\\overrightarrow{u}_1| \\cdot |\\overrightarrow{u}_2|}$.'
  },
  {
    id: 2,
    title: 'Câu 2: Tính góc giữa hai đường thẳng cụ thể',
    pts: 20,
    question: 'Góc giữa hai đường thẳng $d_1$ có $\\overrightarrow{u}_1 = (1; 0; 1)$ và $d_2$ có $\\overrightarrow{u}_2 = (0; 1; 1)$ bằng:',
    options: [
      { text: '$60^\\circ$', correct: true },
      { text: '$30^\\circ$', correct: false },
      { text: '$45^\\circ$', correct: false },
      { text: '$90^\\circ$', correct: false }
    ],
    explanation: 'Ta có $\\cos\\varphi = \\frac{|1\\cdot 0 + 0\\cdot 1 + 1\\cdot 1|}{\\sqrt{1^2 + 0^2 + 1^2} \\cdot \\sqrt{0^2 + 1^2 + 1^2}} = \\frac{1}{\\sqrt{2} \\cdot \\sqrt{2}} = \\frac{1}{2}$. Do đó $\\varphi = 60^\\circ$.'
  },
  {
    id: 3,
    title: 'Câu 3: Công thức tính góc giữa đường thẳng và mặt phẳng',
    pts: 20,
    question: 'Cho đường thẳng $\\Delta$ có VTCP $\\overrightarrow{u}$ và mặt phẳng $(\\alpha)$ có VTPT $\\overrightarrow{n}$. Giá trị lượng giác của góc $\\varphi = (\\Delta, (\\alpha))$ được tính bởi:',
    options: [
      { text: '$\\sin \\varphi = \\frac{|\\overrightarrow{u} \\cdot \\overrightarrow{n}|}{|\\overrightarrow{u}| \\cdot |\\overrightarrow{n}|}$', correct: true },
      { text: '$\\cos \\varphi = \\frac{|\\overrightarrow{u} \\cdot \\overrightarrow{n}|}{|\\overrightarrow{u}| \\cdot |\\overrightarrow{n}|}$', correct: false },
      { text: '$\\tan \\varphi = \\frac{|\\overrightarrow{u} \\cdot \\overrightarrow{n}|}{|\\overrightarrow{u}| \\cdot |\\overrightarrow{n}|}$', correct: false },
      { text: '$\\sin \\varphi = \\frac{\\overrightarrow{u} \\cdot \\overrightarrow{n}}{|\\overrightarrow{u}| \\cdot |\\overrightarrow{n}|}$', correct: false }
    ],
    explanation: 'Do góc giữa đường thẳng và mặt phẳng phụ với góc giữa $\\overrightarrow{u}$ và $\\overrightarrow{n}$, ta có $\\sin(\\Delta, (\\alpha)) = |\\cos(\\overrightarrow{u}, \\overrightarrow{n})| = \\frac{|\\overrightarrow{u} \\cdot \\overrightarrow{n}|}{|\\overrightarrow{u}| \\cdot |\\overrightarrow{n}|}$.'
  },
  {
    id: 4,
    title: 'Câu 4 (Bài 5.21 SGK trang 53): Góc giữa trục toạ độ và mặt phẳng',
    pts: 20,
    question: 'Trong không gian $Oxyz$, góc giữa trục $Oz$ và mặt phẳng $(P): x + 2y - z - 1 = 0$ xấp xỉ bằng:',
    options: [
      { text: '$24.1^\\circ$', correct: true },
      { text: '$65.9^\\circ$', correct: false },
      { text: '$45^\\circ$', correct: false },
      { text: '$30^\\circ$', correct: false }
    ],
    explanation: 'Trục $Oz$ có VTCP $\\overrightarrow{k} = (0; 0; 1)$, mặt phẳng $(P)$ có VTPT $\\overrightarrow{n} = (1; 2; -1)$. Do đó $\\sin\\varphi = \\frac{|0\\cdot 1 + 0\\cdot 2 + 1(-1)|}{\\sqrt{1} \\cdot \\sqrt{1^2 + 2^2 + (-1)^2}} = \\frac{1}{\\sqrt{6}} \\approx 0.4082 \\implies \\varphi \\approx 24.1^\\circ$.'
  },
  {
    id: 5,
    title: 'Câu 5 (Bài 5.22 SGK trang 53): Tính góc giữa đường thẳng và mặt phẳng',
    pts: 20,
    question: 'Góc giữa đường thẳng $\\Delta: \\frac{x + 1}{-1} = \\frac{y - 3}{2} = \\frac{z + 2}{3}$ và mặt phẳng $(P): x + y + z + 3 = 0$ có giá trị $\\sin$ bằng:',
    options: [
      { text: '$\\sin \\varphi = \\frac{4}{\\sqrt{42}}$', correct: true },
      { text: '$\\sin \\varphi = \\frac{2}{\\sqrt{42}}$', correct: false },
      { text: '$\\cos \\varphi = \\frac{4}{\\sqrt{42}}$', correct: false },
      { text: '$\\sin \\varphi = \\frac{4}{14}$', correct: false }
    ],
    explanation: 'VTCP của $\\Delta$ là $\\overrightarrow{u} = (-1; 2; 3)$, VTPT của $(P)$ là $\\overrightarrow{n} = (1; 1; 1)$. Ta có: $\\sin\\varphi = \\frac{|-1(1) + 2(1) + 3(1)|}{\\sqrt{(-1)^2 + 2^2 + 3^2} \\cdot \\sqrt{1^2 + 1^2 + 1^2}} = \\frac{|4|}{\\sqrt{14}\\sqrt{3}} = \\frac{4}{\\sqrt{42}}$.'
  },
  {
    id: 6,
    title: 'Câu 6: Góc giữa hai mặt phẳng toạ độ nghiêng',
    pts: 20,
    question: 'Góc giữa hai mặt phẳng $(P): x - y = 0$ và $(Q): y - z = 0$ bằng:',
    options: [
      { text: '$60^\\circ$', correct: true },
      { text: '$45^\\circ$', correct: false },
      { text: '$90^\\circ$', correct: false },
      { text: '$30^\\circ$', correct: false }
    ],
    explanation: 'Ta có $\\overrightarrow{n}_P = (1; -1; 0)$ và $\\overrightarrow{n}_Q = (0; 1; -1)$. Khi đó $\\cos\\varphi = \\frac{|1(0) + (-1)(1) + 0(-1)|}{\\sqrt{1 + 1 + 0} \\cdot \\sqrt{0 + 1 + 1}} = \\frac{|-1|}{\\sqrt{2}\\sqrt{2}} = \\frac{1}{2} \\implies \\varphi = 60^\\circ$.'
  },
  {
    id: 7,
    title: 'Câu 7 (Bài 5.20 SGK trang 53): Góc giữa hai đường thẳng trong SGK',
    pts: 20,
    question: 'Góc giữa hai đường thẳng $\\Delta_1: \\begin{cases} x = 1 + 2t \\\\ y = 1 - t \\\\ z = 2 + 3t \\end{cases}$ và $\\Delta_2: \\frac{x - 2}{-1} = \\frac{x + 1}{1} = \\frac{z - 2}{2}$ có côsin bằng:',
    options: [
      { text: '$\\cos \\varphi = \\frac{3}{2\\sqrt{21}}$', correct: true },
      { text: '$\\cos \\varphi = \\frac{1}{2\\sqrt{21}}$', correct: false },
      { text: '$\\cos \\varphi = \\frac{5}{2\\sqrt{21}}$', correct: false },
      { text: '$\\sin \\varphi = \\frac{3}{2\\sqrt{21}}$', correct: false }
    ],
    explanation: 'Ta có $\\overrightarrow{u}_1 = (2; -1; 3)$ và $\\overrightarrow{u}_2 = (-1; 1; 2)$. $\\cos\\varphi = \\frac{|2(-1) + (-1)(1) + 3(2)|}{\\sqrt{4 + 1 + 9} \\cdot \\sqrt{1 + 1 + 4}} = \\frac{|-2 - 1 + 6|}{\\sqrt{14}\\sqrt{6}} = \\frac{3}{\\sqrt{84}} = \\frac{3}{2\\sqrt{21}} \\approx 0.327$.'
  },
  {
    id: 8,
    title: 'Câu 8: Điều kiện vuông góc của hai mặt phẳng theo góc',
    pts: 20,
    question: 'Hai mặt phẳng $(\\alpha)$ và $(\\beta)$ vuông góc với nhau khi và chỉ khi:',
    options: [
      { text: '$\\cos((\\alpha), (\\beta)) = 0$', correct: true },
      { text: '$\\cos((\\alpha), (\\beta)) = 1$', correct: false },
      { text: '$\\sin((\\alpha), (\\beta)) = 0$', correct: false },
      { text: '$\\cos((\\alpha), (\\beta)) = -1$', correct: false }
    ],
    explanation: 'Hai mặt phẳng vuông góc với nhau thì góc giữa chúng là $90^\\circ$, khi đó $\\cos 90^\\circ = 0$.'
  },
  {
    id: 9,
    title: 'Câu 9: Góc giữa đường thẳng song song mặt phẳng',
    pts: 20,
    question: 'Nếu đường thẳng $\\Delta$ song song hoặc nằm trong mặt phẳng $(\\alpha)$ thì góc giữa $\\Delta$ và $(\\alpha)$ bằng:',
    options: [
      { text: '$0^\\circ$', correct: true },
      { text: '$90^\\circ$', correct: false },
      { text: '$180^\\circ$', correct: false },
      { text: '$45^\\circ$', correct: false }
    ],
    explanation: 'Theo định nghĩa, nếu $\\Delta \\parallel (\\alpha)$ hoặc $\\Delta \\subset (\\alpha)$ thì góc giữa đường thẳng và mặt phẳng bằng $0^\\circ$.'
  },
  {
    id: 10,
    title: 'Câu 10: Tình huống mở đầu SGK trang 50',
    pts: 20,
    question: 'Mái nhà hình tròn đặt trên 3 cây cột vuông góc với sàn, có độ cao lần lượt là $7\\text{ m}, 6\\text{ m}, 5\\text{ m}$ tại 3 đỉnh tam giác đều cạnh $4\\text{ m}$ trên sàn. Góc nghiêng của mái nhà so với sàn nhà là góc giữa:',
    options: [
      { text: 'Mặt phẳng chứa mái nhà và mặt phẳng sàn nằm ngang', correct: true },
      { text: 'Cột cao nhất và cột thấp nhất', correct: false },
      { text: 'Đường kính mái nhà và mặt sàn', correct: false },
      { text: 'Tam giác chân cột và mặt đất', correct: false }
    ],
    explanation: 'Mái nhà nằm trên mặt phẳng đi qua 3 đỉnh đầu cột $A\', B\', C\'$. Do đó góc nghiêng của mái nhà so với mặt sàn chính là góc giữa mặt phẳng $(A\'B\'C\')$ và mặt phẳng sàn $(ABC)$.'
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

// --- LAB 1: THƯỚC ĐO GÓC KHÔNG GIAN ĐA NĂNG 3D ---
let lab1Interacted = false;
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  const modeSel = document.getElementById('lab1ModeSelect');
  const sV1x = document.getElementById('lab1SliderV1x');
  const sV1y = document.getElementById('lab1SliderV1y');
  const sV1z = document.getElementById('lab1SliderV1z');
  const sV2x = document.getElementById('lab1SliderV2x');
  const sV2y = document.getElementById('lab1SliderV2y');
  const sV2z = document.getElementById('lab1SliderV2z');

  const vV1x = document.getElementById('lab1ValV1x');
  const vV1y = document.getElementById('lab1ValV1y');
  const vV1z = document.getElementById('lab1ValV1z');
  const vV2x = document.getElementById('lab1ValV2x');
  const vV2y = document.getElementById('lab1ValV2y');
  const vV2z = document.getElementById('lab1ValV2z');
  const output = document.getElementById('lab1Output');

  if (!canvas || !modeSel || !sV1x) return;
  const ctx = canvas.getContext('2d');

  function project(x, y, z) {
    const rot = Math.PI / 4;
    const rx = x * Math.cos(rot) - y * Math.sin(rot);
    const ry = x * Math.sin(rot) + y * Math.cos(rot);
    return {
      x: canvas.width / 2 + rx * 28,
      y: canvas.height / 2 + (ry * 14 - z * 26) * 0.55
    };
  }

  function draw() {
    const mode = modeSel.value;
    const x1 = parseFloat(sV1x.value), y1 = parseFloat(sV1y.value), z1 = parseFloat(sV1z.value);
    const x2 = parseFloat(sV2x.value), y2 = parseFloat(sV2y.value), z2 = parseFloat(sV2z.value);

    vV1x.textContent = x1; vV1y.textContent = y1; vV1z.textContent = z1;
    vV2x.textContent = x2; vV2y.textContent = y2; vV2z.textContent = z2;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Axes
    const O = project(0, 0, 0);
    const X = project(5, 0, 0);
    const Y = project(0, 5, 0);
    const Z = project(0, 0, 5);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(O.x, O.y); ctx.lineTo(X.x, X.y);
    ctx.moveTo(O.x, O.y); ctx.lineTo(Y.x, Y.y);
    ctx.moveTo(O.x, O.y); ctx.lineTo(Z.x, Z.y);
    ctx.stroke();

    // Vector 1 (Blue)
    const len1 = Math.sqrt(x1 * x1 + y1 * y1 + z1 * z1) || 1;
    const pV1 = project(x1, y1, z1);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(pV1.x, pV1.y); ctx.stroke();
    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`v₁ = (${x1}; ${y1}; ${z1})`, pV1.x + 8, pV1.y);

    // Vector 2 (Orange)
    const len2 = Math.sqrt(x2 * x2 + y2 * y2 + z2 * z2) || 1;
    const pV2 = project(x2, y2, z2);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(pV2.x, pV2.y); ctx.stroke();
    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`v₂ = (${x2}; ${y2}; ${z2})`, pV2.x + 8, pV2.y);

    // Angle calculations
    const dot = Math.abs(x1 * x2 + y1 * y2 + z1 * z2);
    const cosVal = Math.min(1, dot / (len1 * len2));

    let angleDeg = 0;
    let trigFormula = '';
    let trigResult = '';

    if (mode === 'line_line') {
      angleDeg = (Math.acos(cosVal) * 180) / Math.PI;
      trigFormula = `\\cos(\\Delta_1, \\Delta_2) = \\frac{|\\overrightarrow{u}_1 \\cdot \\overrightarrow{u}_2|}{|\\overrightarrow{u}_1| \\cdot |\\overrightarrow{u}_2|} = \\frac{|${x1}(${x2}) + ${y1}(${y2}) + ${z1}(${z2})|}{\\sqrt{${x1 * x1 + y1 * y1 + z1 * z1}} \\cdot \\sqrt{${x2 * x2 + y2 * y2 + z2 * z2}}}`;
      trigResult = `\\cos\\varphi = ${cosVal.toFixed(4)} \\implies \\varphi = ${angleDeg.toFixed(1)}^\\circ`;
    } else if (mode === 'line_plane') {
      const sinVal = cosVal; // because sin(angle) = |cos(u, n)|
      angleDeg = (Math.asin(sinVal) * 180) / Math.PI;
      trigFormula = `\\sin(\\Delta, (P)) = \\frac{|\\overrightarrow{u} \\cdot \\overrightarrow{n}|}{|\\overrightarrow{u}| \\cdot |\\overrightarrow{n}|} = \\frac{|${x1}(${x2}) + ${y1}(${y2}) + ${z1}(${z2})|}{\\sqrt{${x1 * x1 + y1 * y1 + z1 * z1}} \\cdot \\sqrt{${x2 * x2 + y2 * y2 + z2 * z2}}}`;
      trigResult = `\\sin\\varphi = ${sinVal.toFixed(4)} \\implies \\varphi = ${angleDeg.toFixed(1)}^\\circ`;
    } else {
      angleDeg = (Math.acos(cosVal) * 180) / Math.PI;
      trigFormula = `\\cos((P), (Q)) = \\frac{|\\overrightarrow{n}_1 \\cdot \\overrightarrow{n}_2|}{|\\overrightarrow{n}_1| \\cdot |\\overrightarrow{n}_2|} = \\frac{|${x1}(${x2}) + ${y1}(${y2}) + ${z1}(${z2})|}{\\sqrt{${x1 * x1 + y1 * y1 + z1 * z1}} \\cdot \\sqrt{${x2 * x2 + y2 * y2 + z2 * z2}}}`;
      trigResult = `\\cos\\varphi = ${cosVal.toFixed(4)} \\implies \\varphi = ${angleDeg.toFixed(1)}^\\circ`;
    }

    // Draw glowing angle arc
    ctx.strokeStyle = '#ec4899';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    const midPx = (pV1.x + pV2.x) / 2;
    const midPy = (pV1.y + pV2.y) / 2;
    const arcX = O.x + (midPx - O.x) * 0.45;
    const arcY = O.y + (midPy - O.y) * 0.45;
    ctx.arc(O.x, O.y, 35, 0, Math.PI / 2);
    ctx.stroke();

    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`φ = ${angleDeg.toFixed(1)}°`, arcX, arcY);

    if (output) {
      output.innerHTML = `
        <div style="line-height: 1.6;">
          <div><strong>1. Công thức thiết lập:</strong> $${trigFormula}$</div>
          <div><strong>2. Kết quả tính toán:</strong> $<span style="color: #10b981; font-weight: bold;">${trigResult}</span>$</div>
          <div><strong>3. Nhận xét vị trí:</strong> ${angleDeg === 90 ? '<span style="color: #ef4444; font-weight: bold;">Hai đối tượng vuông góc nhau (90°)</span>' : angleDeg === 0 ? '<span style="color: #38bdf8; font-weight: bold;">Hai đối tượng song song hoặc trùng nhau (0°)</span>' : `Góc nhọn không gian $\\varphi = ${angleDeg.toFixed(2)}^\\circ$`}</div>
        </div>
      `;
      renderMathInTree(output);
    }

    lab1Interacted = true;
    checkLabBadge();
  }

  modeSel.onchange = () => { sounds.playClick(); draw(); };
  sV1x.oninput = () => { sounds.playClick(); draw(); };
  sV1y.oninput = () => { sounds.playClick(); draw(); };
  sV1z.oninput = () => { sounds.playClick(); draw(); };
  sV2x.oninput = () => { sounds.playClick(); draw(); };
  sV2y.oninput = () => { sounds.playClick(); draw(); };
  sV2z.oninput = () => { sounds.playClick(); draw(); };
  draw();
}

// --- LAB 2: MÔ PHỎNG KIẾN TRÚC MÁI NGHIÊNG & KHEOPS 3D ---
let lab2Interacted = false;
function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  const archSel = document.getElementById('lab2ArchSelect');
  const slidersRoof = document.getElementById('lab2SlidersRoof');
  const sHa = document.getElementById('lab2SliderHa');
  const sHb = document.getElementById('lab2SliderHb');
  const sHc = document.getElementById('lab2SliderHc');
  const vHa = document.getElementById('lab2ValHa');
  const vHb = document.getElementById('lab2ValHb');
  const vHc = document.getElementById('lab2ValHc');
  const output = document.getElementById('lab2Output');

  if (!canvas || !archSel) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const arch = archSel.value;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    function proj(x, y, z) {
      const rot = Math.PI / 4;
      const rx = x * Math.cos(rot) - y * Math.sin(rot);
      const ry = x * Math.sin(rot) + y * Math.cos(rot);
      return {
        x: W / 2 + rx * 22,
        y: H / 2 + 30 + (ry * 11 - z * 18) * 0.55
      };
    }

    if (arch === 'roof') {
      if (slidersRoof) slidersRoof.style.display = 'flex';
      const hA = parseFloat(sHa.value);
      const hB = parseFloat(sHb.value);
      const hC = parseFloat(sHc.value);
      vHa.textContent = hA; vHb.textContent = hB; vHc.textContent = hC;

      // Base: Equilateral triangle of side a = 4 on floor z = 0
      // Let A(0, 0, 0), B(4, 0, 0), C(2, 2*sqrt(3), 0)
      const A0 = proj(-2, -1.15, 0);
      const B0 = proj(2, -1.15, 0);
      const C0 = proj(0, 2.3, 0);

      // Pillars top
      const At = proj(-2, -1.15, hA);
      const Bt = proj(2, -1.15, hB);
      const Ct = proj(0, 2.3, hC);

      // Floor triangle
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(A0.x, A0.y); ctx.lineTo(B0.x, B0.y); ctx.lineTo(C0.x, C0.y); ctx.closePath();
      ctx.stroke();

      // Pillars vertical lines
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(A0.x, A0.y); ctx.lineTo(At.x, At.y); ctx.stroke();
      ctx.strokeStyle = '#10b981'; ctx.beginPath(); ctx.moveTo(B0.x, B0.y); ctx.lineTo(Bt.x, Bt.y); ctx.stroke();
      ctx.strokeStyle = '#38bdf8'; ctx.beginPath(); ctx.moveTo(C0.x, C0.y); ctx.lineTo(Ct.x, Ct.y); ctx.stroke();

      // Inclined Roof Ellipse / Surface
      ctx.beginPath();
      ctx.moveTo(At.x, At.y); ctx.lineTo(Bt.x, Bt.y); ctx.lineTo(Ct.x, Ct.y); ctx.closePath();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.4)';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Normal of floor: n_floor = (0, 0, 1)
      // Normal of roof plane passing A'(0,0,hA), B'(4,0,hB), C'(2, 2sqrt3, hC):
      // A'B' = (4, 0, hB - hA), A'C' = (2, 2sqrt3, hC - hA)
      // n_roof = [A'B', A'C'] = (-2sqrt3(hB-hA), 2(hB-hA) - 4(hC-hA), 8sqrt3)
      const dy1 = hB - hA;
      const dy2 = hC - hA;
      const nx = -2 * Math.sqrt(3) * dy1;
      const ny = 2 * dy1 - 4 * dy2;
      const nz = 8 * Math.sqrt(3);
      const lenRoofN = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const cosAngle = Math.abs(nz) / lenRoofN;
      const angleDeg = (Math.acos(cosAngle) * 180) / Math.PI;

      if (output) {
        output.innerHTML = `
          <div style="line-height: 1.6;">
            <div><strong>1. Mô hình cột trụ:</strong> Cột $A\' = ${hA}\\text{ m}$, Cột $B\' = ${hB}\\text{ m}$, Cột $C\' = ${hC}\\text{ m}$.</div>
            <div><strong>2. Vectơ pháp tuyến mái nhà:</strong> $\\overrightarrow{n}_{mái} \\approx (${nx.toFixed(2)};\\; ${ny.toFixed(2)};\\; ${nz.toFixed(2)})$</div>
            <div><strong>3. Góc nghiêng so với mặt sàn $(Oxy)$:</strong> $\\cos\\varphi = \\frac{|\\overrightarrow{n}_{mái} \\cdot \\overrightarrow{k}|}{|\\overrightarrow{n}_{mái}|} = <span style="color: #38bdf8; font-weight: bold;">${cosAngle.toFixed(4)}</span>$</div>
            <div><strong>4. Độ dốc mái nhà:</strong> $\\varphi \\approx <span style="color: #f59e0b; font-weight: bold;">${angleDeg.toFixed(1)}^\\circ</span>$ (thoát nước mưa tối ưu).</div>
          </div>
        `;
        renderMathInTree(output);
      }
    } else {
      if (slidersRoof) slidersRoof.style.display = 'none';

      // Kheops Pyramid Model
      // S.ABCD base 230m square, side edges 219m
      // Dihedral angle between (SAB) and (SBC)
      const baseHalf = 3.5;
      const heightPyramid = 4.2;

      const S = proj(0, 0, heightPyramid);
      const A = proj(-baseHalf, -baseHalf, 0);
      const B = proj(baseHalf, -baseHalf, 0);
      const C = proj(baseHalf, baseHalf, 0);
      const D = proj(-baseHalf, baseHalf, 0);

      // Base square
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.lineTo(D.x, D.y); ctx.closePath();
      ctx.stroke();

      // Face SAB
      ctx.beginPath();
      ctx.moveTo(S.x, S.y); ctx.lineTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.closePath();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Face SBC
      ctx.beginPath();
      ctx.moveTo(S.x, S.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y); ctx.closePath();
      ctx.fillStyle = 'rgba(56, 189, 248, 0.35)';
      ctx.fill();
      ctx.strokeStyle = '#38bdf8';
      ctx.stroke();

      // Other edges
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
      ctx.beginPath(); ctx.moveTo(S.x, S.y); ctx.lineTo(D.x, D.y); ctx.stroke();

      // Exact mathematical calculation for Kheops:
      // a = 230m, b = 219m
      // In tetrahedron S.ABC, normal of SAB and SBC gives angle approx 139.5 deg (or acute 40.5 deg)
      if (output) {
        output.innerHTML = `
          <div style="line-height: 1.6;">
            <div><strong>1. Kích thước kim tự tháp Kheops:</strong> Cạnh đáy $a = 230\\text{ m}$, Cạnh bên $l = 219\\text{ m}$.</div>
            <div><strong>2. Chiều cao kim tự tháp:</strong> $h = \\sqrt{l^2 - \\frac{a^2}{2}} = \\sqrt{219^2 - \\frac{230^2}{2}} \\approx 146.6\\text{ m}$.</div>
            <div><strong>3. Góc giữa hai mặt bên kề nhau $(SAB)$ và $(SBC)$:</strong> $\\cos\\varphi \\approx -0.76 \\implies \\varphi \\approx 139.5^\\circ$ (góc nhị diện) hoặc góc hình học nhọn là <span style="color: #10b981; font-weight: bold;">$40.5^\\circ$</span>.</div>
          </div>
        `;
        renderMathInTree(output);
      }
    }

    lab2Interacted = true;
    checkLabBadge();
  }

  archSel.onchange = () => { sounds.playClick(); draw(); };
  sHa.oninput = () => { sounds.playClick(); draw(); };
  sHb.oninput = () => { sounds.playClick(); draw(); };
  sHc.oninput = () => { sounds.playClick(); draw(); };
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
      if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập Bài 16 không?')) {
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
