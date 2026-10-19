// ==========================================
// TOÁN 12 - BÀI 17: PHƯƠNG TRÌNH MẶT CẦU
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
  s = s.replace(/\\approx/g, '<mo>&#8776;</mo>');
  s = s.replace(/\\cdot/g, '<mo>&#8901;</mo>');
  s = s.replace(/\\le/g, '<mo>&#8804;</mo>');
  s = s.replace(/\\ge/g, '<mo>&#8805;</mo>');
  s = s.replace(/\\ne/g, '<mo>&#8800;</mo>');
  s = s.replace(/\\iff/g, '<mo>&#8660;</mo>');
  s = s.replace(/\\in/g, '<mo>&#8712;</mo>');
  s = s.replace(/\\notin/g, '<mo>&#8713;</mo>');
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
const STORAGE_KEY = 'toan12_bai17_state';
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chỉ Huy Quỹ Đạo Vệ Tinh',
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

// --- QUIZ DATA (10 CÂU BÀI 17 SGK KNTT TRANG 54–60) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1: Xác định tâm và bán kính từ phương trình chính tắc',
    pts: 20,
    question: 'Trong không gian $Oxyz$, mặt cầu $(S): (x - 1)^2 + (y + 2)^2 + (z - 3)^2 = 16$ có toạ độ tâm $I$ và bán kính $R$ là:',
    options: [
      { text: '$I(1; -2; 3)$ và $R = 4$', correct: true },
      { text: '$I(-1; 2; -3)$ và $R = 4$', correct: false },
      { text: '$I(1; -2; 3)$ và $R = 16$', correct: false },
      { text: '$I(-1; 2; -3)$ và $R = 16$', correct: false }
    ],
    explanation: 'Phương trình $(x - a)^2 + (y - b)^2 + (z - c)^2 = R^2$ có tâm $I(a; b; c) = (1; -2; 3)$ và bán kính $R = \\sqrt{16} = 4$.'
  },
  {
    id: 2,
    title: 'Câu 2 (Bài 5.25 SGK trang 59): Mặt cầu có toạ độ phân số',
    pts: 20,
    question: 'Tâm $I$ và bán kính $R$ của mặt cầu $(S): \\left(x - \\frac{1}{2}\\right)^2 + (y + 1)^2 + z^2 = 9$ là:',
    options: [
      { text: '$I\\left(\\frac{1}{2}; -1; 0\\right)$ và $R = 3$', correct: true },
      { text: '$I\\left(-\\frac{1}{2}; 1; 0\\right)$ và $R = 3$', correct: false },
      { text: '$I\\left(\\frac{1}{2}; -1; 0\\right)$ và $R = 9$', correct: false },
      { text: '$I\\left(\\frac{1}{2}; 1; 0\\right)$ và $R = 3$', correct: false }
    ],
    explanation: 'Ta có $a = \\frac{1}{2}, b = -1, c = 0$ và $R^2 = 9 \\implies R = 3$. Tâm là $I\\left(\\frac{1}{2}; -1; 0\\right)$ và $R = 3$.'
  },
  {
    id: 3,
    title: 'Câu 3 (Bài 5.26 SGK trang 59): Viết phương trình mặt cầu biết tâm và bán kính',
    pts: 20,
    question: 'Phương trình mặt cầu $(S)$ có tâm $I(-2; 0; 5)$ và bán kính $R = 2$ là:',
    options: [
      { text: '$(x + 2)^2 + y^2 + (z - 5)^2 = 4$', correct: true },
      { text: '$(x - 2)^2 + y^2 + (z + 5)^2 = 4$', correct: false },
      { text: '$(x + 2)^2 + y^2 + (z - 5)^2 = 2$', correct: false },
      { text: '$(x - 2)^2 + y^2 + (z + 5)^2 = 2$', correct: false }
    ],
    explanation: 'Thay tâm $I(-2; 0; 5)$ và $R = 2$ vào phương trình chính tắc: $(x - (-2))^2 + (y - 0)^2 + (z - 5)^2 = 2^2 \\iff (x + 2)^2 + y^2 + (z - 5)^2 = 4$.'
  },
  {
    id: 4,
    title: 'Câu 4: Điều kiện để phương trình là phương trình mặt cầu',
    pts: 20,
    question: 'Phương trình $x^2 + y^2 + z^2 - 2ax - 2by - 2cz + d = 0$ là phương trình mặt cầu khi và chỉ khi:',
    options: [
      { text: '$a^2 + b^2 + c^2 - d > 0$', correct: true },
      { text: '$a^2 + b^2 + c^2 - d \\ge 0$', correct: false },
      { text: '$a^2 + b^2 + c^2 + d > 0$', correct: false },
      { text: '$a^2 + b^2 + c^2 - d < 0$', correct: false }
    ],
    explanation: 'Bán kính mặt cầu $R = \\sqrt{a^2 + b^2 + c^2 - d} > 0$ đòi hỏi điều kiện biểu thức dưới căn phải thực sự dương: $a^2 + b^2 + c^2 - d > 0$.'
  },
  {
    id: 5,
    title: 'Câu 5 (Bài 5.28 SGK trang 59): Tìm tâm và bán kính từ phương trình tổng quát',
    pts: 20,
    question: 'Mặt cầu $(S): x^2 + y^2 + z^2 + 2x - 2y + 8z - 18 = 0$ có tâm $I$ và bán kính $R$ là:',
    options: [
      { text: '$I(-1; 1; -4)$ và $R = 6$', correct: true },
      { text: '$I(1; -1; 4)$ và $R = 6$', correct: false },
      { text: '$I(-1; 1; -4)$ và $R = 36$', correct: false },
      { text: '$I(-1; 1; -4)$ và $R = \\sqrt{18}$', correct: false }
    ],
    explanation: 'Ta có $-2a = 2 \\implies a = -1$; $-2b = -2 \\implies b = 1$; $-2c = 8 \\implies c = -4$; $d = -18$. Tâm $I(-1; 1; -4)$, bán kính $R = \\sqrt{(-1)^2 + 1^2 + (-4)^2 - (-18)} = \\sqrt{1 + 1 + 16 + 18} = \\sqrt{36} = 6$.'
  },
  {
    id: 6,
    title: 'Câu 6 (Bài 5.29 SGK trang 59): Nhận diện phương trình mặt cầu',
    pts: 20,
    question: 'Phương trình nào sau đây là phương trình của một mặt cầu trong không gian $Oxyz$?',
    options: [
      { text: '$x^2 + y^2 + z^2 - 4x + 2y - 2z = 0$', correct: true },
      { text: '$x^2 + y^2 + z^2 - 2x - 5z + 30 = 0$', correct: false },
      { text: '$x^3 + y^3 + z^3 - 2x + 6y - 9z - 10 = 0$', correct: false },
      { text: '$x^2 + y^2 + z^2 + 5 = 0$', correct: false }
    ],
    explanation: 'Xét $x^2 + y^2 + z^2 - 4x + 2y - 2z = 0$: $a = 2, b = -1, c = 1, d = 0 \\implies a^2 + b^2 + c^2 - d = 4 + 1 + 1 - 0 = 6 > 0$. Đây là phương trình mặt cầu tâm $I(2; -1; 1), R = \\sqrt{6}$. Các phương trình khác đều không thoả mãn.'
  },
  {
    id: 7,
    title: 'Câu 7 (Bài 5.27 SGK trang 59): Mặt cầu tiếp xúc với mặt phẳng',
    pts: 20,
    question: 'Mặt cầu $(S)$ có tâm $I(0; 3; -1)$ và tiếp xúc với mặt phẳng $(P): 3x + 2y - z = 0$ có bán kính $R$ bằng:',
    options: [
      { text: '$R = \\frac{\\sqrt{14}}{2}$', correct: true },
      { text: '$R = \\sqrt{14}$', correct: false },
      { text: '$R = \\frac{7}{2}$', correct: false },
      { text: '$R = \\frac{7}{14}$', correct: false }
    ],
    explanation: 'Khi mặt cầu tiếp xúc mặt phẳng thì bán kính bằng khoảng cách từ tâm đến mặt phẳng: $R = d(I, (P)) = \\frac{|3(0) + 2(3) - (-1)|}{\\sqrt{3^2 + 2^2 + (-1)^2}} = \\frac{7}{\\sqrt{14}} = \\frac{7\\sqrt{14}}{14} = \\frac{\\sqrt{14}}{2}$.'
  },
  {
    id: 8,
    title: 'Câu 8 (Bài 5.30 SGK trang 59): Vùng phủ sóng của thiết bị phát',
    pts: 20,
    question: 'Một thiết bị phát sóng đặt tại $A(2; 0; 0)$ có vùng phủ sóng dạng khối cầu bán kính $R = 1$. Vị trí điểm $M(2; 1; 1)$ có nằm trong vùng phủ sóng không?',
    options: [
      { text: 'Không, vì khoảng cách $AM = \\sqrt{2} > 1$', correct: true },
      { text: 'Có, vì khoảng cách $AM = 1$', correct: false },
      { text: 'Có, vì khoảng cách $AM = 0.5 < 1$', correct: false },
      { text: 'Nằm ngay trên ranh giới vùng phủ sóng', correct: false }
    ],
    explanation: 'Khoảng cách từ $A$ đến $M$ là: $AM = \\sqrt{(2 - 2)^2 + (1 - 0)^2 + (1 - 0)^2} = \\sqrt{0 + 1 + 1} = \\sqrt{2} \\approx 1.414$. Vì $AM > R = 1$ nên điểm $M$ nằm ngoài vùng phủ sóng.'
  },
  {
    id: 9,
    title: 'Câu 9: Mặt cầu đường kính nối hai điểm',
    pts: 20,
    question: 'Phương trình mặt cầu có đường kính $AB$ với $A(1; 2; 0)$ và $B(-1; 0; 4)$ là:',
    options: [
      { text: '$x^2 + (y - 1)^2 + (z - 2)^2 = 6$', correct: true },
      { text: '$x^2 + (y - 1)^2 + (z - 2)^2 = 24$', correct: false },
      { text: '$(x - 1)^2 + (y - 2)^2 + z^2 = 6$', correct: false },
      { text: '$x^2 + (y + 1)^2 + (z + 2)^2 = 6$', correct: false }
    ],
    explanation: 'Tâm $I$ là trung điểm $AB$: $I\\left(\\frac{1-1}{2}; \\frac{2+0}{2}; \\frac{0+4}{2}\\right) = (0; 1; 2)$. Bán kính $R = \\frac{AB}{2} = \\frac{\\sqrt{(-2)^2 + (-2)^2 + 4^2}}{2} = \\frac{\\sqrt{24}}{2} = \\sqrt{6}$. Phương trình: $x^2 + (y - 1)^2 + (z - 2)^2 = 6$.'
  },
  {
    id: 10,
    title: 'Câu 10 (GPS SGK trang 60): Khoảng cách từ bề mặt Trái Đất đến tâm',
    pts: 20,
    question: 'Trong mô hình toạ độ GPS SGK trang 60, Trái Đất được chuẩn hoá là mặt cầu $x^2 + y^2 + z^2 = 1$. Điểm $P\\left(0; \\frac{3}{4}; \\frac{\\sqrt{7}}{4}\\right)$ có thuộc bề mặt Trái Đất không?',
    options: [
      { text: 'Có, vì $0^2 + \\left(\\frac{3}{4}\\right)^2 + \\left(\\frac{\\sqrt{7}}{4}\\right)^2 = 1$', correct: true },
      { text: 'Không, điểm $P$ nằm sâu bên trong lòng đất', correct: false },
      { text: 'Không, điểm $P$ nằm trên quỹ đạo vệ tinh', correct: false },
      { text: 'Không xác định được', correct: false }
    ],
    explanation: 'Thay toạ độ điểm $P$ vào vế trái: $0^2 + \\left(\\frac{3}{4}\\right)^2 + \\left(\\frac{\\sqrt{7}}{4}\\right)^2 = 0 + \\frac{9}{16} + \\frac{7}{16} = \\frac{16}{16} = 1$. Điểm $P$ thoả mãn phương trình nên hoàn toàn thuộc bề mặt Trái Đất.'
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

// --- LAB 1: MÁY KHẢO SÁT & DỰNG MẶT CẦU KHÔNG GIAN 3D ---
let lab1Interacted = false;
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  const sA = document.getElementById('lab1SliderA');
  const sB = document.getElementById('lab1SliderB');
  const sC = document.getElementById('lab1SliderC');
  const sR = document.getElementById('lab1SliderR');
  const sRot = document.getElementById('lab1SliderRot');

  const vA = document.getElementById('lab1ValA');
  const vB = document.getElementById('lab1ValB');
  const vC = document.getElementById('lab1ValC');
  const vR = document.getElementById('lab1ValR');
  const rotVal = document.getElementById('lab1RotVal');
  const output = document.getElementById('lab1Output');

  if (!canvas || !sA || !sB || !sR) return;
  const ctx = canvas.getContext('2d');

  function project(x, y, z, rotRad) {
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
    const a = parseFloat(sA.value);
    const b = parseFloat(sB.value);
    const c = parseFloat(sC.value);
    const R = parseFloat(sR.value);
    const rotDeg = parseFloat(sRot.value);
    const rotRad = (rotDeg * Math.PI) / 180;

    vA.textContent = a; vB.textContent = b; vC.textContent = c;
    vR.textContent = R.toFixed(1);
    rotVal.textContent = `${rotDeg}°`;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Axes
    const O = project(0, 0, 0, rotRad);
    const X = project(6, 0, 0, rotRad);
    const Y = project(0, 6, 0, rotRad);
    const Z = project(0, 0, 6, rotRad);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(O.x, O.y); ctx.lineTo(X.x, X.y);
    ctx.moveTo(O.x, O.y); ctx.lineTo(Y.x, Y.y);
    ctx.moveTo(O.x, O.y); ctx.lineTo(Z.x, Z.y);
    ctx.stroke();

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#ef4444'; ctx.fillText('x', X.x + 5, X.y);
    ctx.fillStyle = '#10b981'; ctx.fillText('y', Y.x + 5, Y.y);
    ctx.fillStyle = '#38bdf8'; ctx.fillText('z', Z.x, Z.y - 6);

    // Center point I(a, b, c)
    const pI = project(a, b, c, rotRad);
    const rPx = R * 24;
    const ryPx = rPx * 0.35;

    // Glowing sphere body fill
    const gradSphere = ctx.createRadialGradient(pI.x - rPx * 0.3, pI.y - rPx * 0.3, rPx * 0.1, pI.x, pI.y, rPx);
    gradSphere.addColorStop(0, 'rgba(129, 140, 248, 0.55)');
    gradSphere.addColorStop(0.6, 'rgba(79, 70, 229, 0.25)');
    gradSphere.addColorStop(1, 'rgba(30, 27, 75, 0.1)');

    ctx.beginPath();
    ctx.arc(pI.x, pI.y, rPx, 0, 2 * Math.PI);
    ctx.fillStyle = gradSphere;
    ctx.fill();

    // Equatorial and meridian wireframe circles
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
    ctx.lineWidth = 1.2;

    // Equator
    ctx.beginPath();
    ctx.ellipse(pI.x, pI.y, rPx, ryPx, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Meridians
    ctx.beginPath();
    ctx.ellipse(pI.x, pI.y, ryPx * 0.8, rPx, 0, 0, 2 * Math.PI);
    ctx.stroke();

    // Center I marker
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(pI.x, pI.y, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillText(`I(${a}; ${b}; ${c})`, pI.x + 8, pI.y - 4);

    // Radius line
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pI.x, pI.y);
    ctx.lineTo(pI.x + rPx, pI.y);
    ctx.stroke();
    ctx.fillText(`R = ${R.toFixed(1)}`, pI.x + rPx / 2 - 10, pI.y - 8);

    // Equations
    const dVal = a * a + b * b + c * c - R * R;
    let canonStr = `(x ${a >= 0 ? '- ' + a : '+ ' + Math.abs(a)})^2 + (y ${b >= 0 ? '- ' + b : '+ ' + Math.abs(b)})^2 + (z ${c >= 0 ? '- ' + c : '+ ' + Math.abs(c)})^2 = ${ (R * R).toFixed(1) }`;

    let genTerms = ['x^2 + y^2 + z^2'];
    if (a !== 0) genTerms.push(`${-2 * a >= 0 ? '+ ' : ''}${-2 * a}x`);
    if (b !== 0) genTerms.push(`${-2 * b >= 0 ? '+ ' : ''}${-2 * b}y`);
    if (c !== 0) genTerms.push(`${-2 * c >= 0 ? '+ ' : ''}${-2 * c}z`);
    if (dVal !== 0) genTerms.push(`${dVal >= 0 ? '+ ' : ''}${dVal.toFixed(1)}`);
    let genStr = genTerms.join(' ') + ' = 0';

    if (output) {
      output.innerHTML = `
        <div style="line-height: 1.6;">
          <div><strong>1. Phương trình chính tắc:</strong> $${canonStr}$</div>
          <div><strong>2. Phương trình tổng quát:</strong> $${genStr}$</div>
          <div><strong>3. Kiểm tra điều kiện bán kính:</strong> $a^2 + b^2 + c^2 - d = ${a * a} + ${b * b} + ${c * c} - (${dVal.toFixed(1)}) = <span style="color: #10b981; font-weight: bold;">${(R * R).toFixed(2)} > 0</span>$ (Chuẩn mặt cầu).</div>
          <div><strong>4. Diện tích mặt cầu & Thể tích khối cầu:</strong> $S = 4\\pi R^2 \\approx <span style="color: #f59e0b; font-weight: bold;">${(4 * Math.PI * R * R).toFixed(2)}</span>$, $V = \\frac{4}{3}\\pi R^3 \\approx <span style="color: #38bdf8; font-weight: bold;">${((4 / 3) * Math.PI * Math.pow(R, 3)).toFixed(2)}</span>$.</div>
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
  sR.oninput = () => { sounds.playClick(); draw(); };
  sRot.oninput = () => { draw(); };
  draw();
}

// --- LAB 2: TRẠM ĐỊNH VỊ VỆ TINH TOÀN CẦU GPS 3D ---
let lab2Interacted = false;
function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  const sRa = document.getElementById('lab2SliderRa');
  const sRb = document.getElementById('lab2SliderRb');
  const vRa = document.getElementById('lab2ValRa');
  const vRb = document.getElementById('lab2ValRb');
  const output = document.getElementById('lab2Output');

  if (!canvas || !sRa || !sRb) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const ra = parseFloat(sRa.value);
    const rb = parseFloat(sRb.value);
    vRa.textContent = ra.toFixed(2);
    vRb.textContent = rb.toFixed(2);

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 3D Isometric projection
    function proj(x, y, z) {
      const rot = Math.PI / 4;
      const rx = x * Math.cos(rot) - y * Math.sin(rot);
      const ry = x * Math.sin(rot) + y * Math.cos(rot);
      return {
        x: W / 2 + rx * 55,
        y: H / 2 + (ry * 28 - z * 48) * 0.55
      };
    }

    // Earth Sphere center O(0,0,0), R = 1
    const O = proj(0, 0, 0);
    const rEarthPx = 55;

    // Earth wireframe / glow
    const gradEarth = ctx.createRadialGradient(O.x - 15, O.y - 15, 10, O.x, O.y, rEarthPx);
    gradEarth.addColorStop(0, '#0284c7');
    gradEarth.addColorStop(0.7, '#0369a1');
    gradEarth.addColorStop(1, '#082f49');

    ctx.beginPath();
    ctx.arc(O.x, O.y, rEarthPx, 0, 2 * Math.PI);
    ctx.fillStyle = gradEarth;
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Equator on Earth
    ctx.beginPath();
    ctx.ellipse(O.x, O.y, rEarthPx, rEarthPx * 0.35, 0, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.stroke();

    // Satellites in SGK: A(2; 0; 0), B(0; 2; 0), C(0; 2.75; 0.66)
    const pA = proj(2, 0, 0);
    const pB = proj(0, 2, 0);
    const pC = proj(0, 2.75, 0.66);

    // Satellite signals (concentric waves)
    function drawSat(p, name, color) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(p.x, p.y, 6, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
      ctx.fillText(name, p.x + 8, p.y - 5);

      ctx.strokeStyle = color;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.arc(p.x, p.y, 25, 0, 2 * Math.PI);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    drawSat(pA, 'Vệ tinh A(2; 0; 0)', '#ef4444');
    drawSat(pB, 'Vệ tinh B(0; 2; 0)', '#10b981');
    drawSat(pC, 'Vệ tinh C(0; 2.75; 0.66)', '#f59e0b');

    // Calculated GPS Target Point P(0; 0.75; sqrt(7)/4 approx 0.66)
    const pP = proj(0, 0.75, 0.66);
    ctx.fillStyle = '#ec4899';
    ctx.beginPath(); ctx.arc(pP.x, pP.y, 7, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.font = 'bold 12px sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Điểm GPS P', pP.x + 10, pP.y + 4);

    // Beams from satellites to P
    ctx.strokeStyle = 'rgba(236, 72, 153, 0.5)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y); ctx.lineTo(pP.x, pP.y);
    ctx.moveTo(pB.x, pB.y); ctx.lineTo(pP.x, pP.y);
    ctx.moveTo(pC.x, pC.y); ctx.lineTo(pP.x, pP.y);
    ctx.stroke();

    if (output) {
      output.innerHTML = `
        <div style="line-height: 1.6;">
          <div><strong>1. Hệ phương trình giao thoa 3 mặt cầu GPS (SGK trang 60):</strong></div>
          <div style="margin-left: 15px; color: #94a3b8;">
            $(1) \\quad x^2 + y^2 + z^2 = 1$ (Bề mặt Trái Đất) <br>
            $(2) \\quad (x - 2)^2 + y^2 + z^2 = ${ (ra * ra).toFixed(2) }$ (Khoảng cách từ vệ tinh $A$) <br>
            $(3) \\quad x^2 + (y - 2)^2 + z^2 = ${ (rb * rb).toFixed(2) }$ (Khoảng cách từ vệ tinh $B$)
          </div>
          <div><strong>2. Toạ độ thiết bị định vị giải được:</strong> $P\\left(0;\\; \\frac{3}{4};\\; \\frac{\\sqrt{7}}{4}\\right) \\approx P(0;\\; 0.75;\\; 0.66)$</div>
          <div><strong>3. Vị trí địa lý toàn cầu:</strong> Vĩ độ $\\alpha \\approx <span style="color: #10b981; font-weight: bold;">41.4096^\\circ\\text{N}</span>$, Kinh độ $\\beta = <span style="color: #38bdf8; font-weight: bold;">90.0^\\circ\\text{E}</span>$.</div>
        </div>
      `;
      renderMathInTree(output);
    }

    lab2Interacted = true;
    checkLabBadge();
  }

  sRa.oninput = () => { sounds.playClick(); draw(); };
  sRb.oninput = () => { sounds.playClick(); draw(); };
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
      if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập Bài 17 không?')) {
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
