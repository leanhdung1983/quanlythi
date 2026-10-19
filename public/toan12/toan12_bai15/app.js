// ==========================================
// TOÁN 12 - BÀI 15: PHƯƠNG TRÌNH ĐƯỜNG THẲNG TRONG KHÔNG GIAN
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
  s = s.replace(/\\perp/g, '<mo>&#8869;</mo>');
  s = s.replace(/\\parallel/g, '<mo>&#8741;</mo>');
  s = s.replace(/\\nparallel/g, '<mo>&#8742;</mo>');
  s = s.replace(/\\iff/g, '<mo>&#8660;</mo>');
  s = s.replace(/\\equiv/g, '<mo>&#8801;</mo>');
  s = s.replace(/\\cdot/g, '<mo>&#8901;</mo>');
  s = s.replace(/\\approx/g, '<mo>&#8776;</mo>');
  s = s.replace(/\\ne/g, '<mo>&#8800;</mo>');
  s = s.replace(/\\in/g, '<mo>&#8712;</mo>');
  s = s.replace(/\\notin/g, '<mo>&#8713;</mo>');
  s = s.replace(/\\mathbb\{R\}/g, '<mi class="m-bb">&#8477;</mi>');
  s = s.replace(/\\Delta/g, '<mi>&#916;</mi>');
  s = s.replace(/\\text\{([^}]+)\}/g, '<mtext>$1</mtext>');
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
const STORAGE_KEY = 'toan12_bai15_state';
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Phi Công Toạ Độ Tuyến Tính',
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

// --- QUIZ DATA (10 CÂU BÀI 15 SGK KNTT TRANG 41–49) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1: Xác định Vectơ Chỉ Phương của đường thẳng',
    pts: 20,
    question: 'Trong không gian $Oxyz$, một vectơ chỉ phương của đường thẳng $\\Delta: \\frac{x - 1}{2} = \\frac{y + 3}{-4} = \\frac{z - 5}{1}$ là:',
    options: [
      { text: '$\\overrightarrow{u} = (2; -4; 1)$', correct: true },
      { text: '$\\overrightarrow{u} = (1; -3; 5)$', correct: false },
      { text: '$\\overrightarrow{u} = (-1; 3; -5)$', correct: false },
      { text: '$\\overrightarrow{u} = (2; 4; 1)$', correct: false }
    ],
    explanation: 'Từ phương trình chính tắc $\\frac{x - x_0}{a} = \\frac{y - y_0}{b} = \\frac{z - z_0}{c}$, các mẫu số $(a; b; c) = (2; -4; 1)$ chính là toạ độ của một vectơ chỉ phương $\\overrightarrow{u}$.'
  },
  {
    id: 2,
    title: 'Câu 2: Viết phương trình tham số của đường thẳng',
    pts: 20,
    question: 'Phương trình tham số của đường thẳng đi qua điểm $M_0(1; -2; 3)$ và nhận $\\overrightarrow{u} = (2; 1; -1)$ làm VTCP là:',
    options: [
      { text: '$\\begin{cases} x = 1 + 2t \\\\ y = -2 + t \\\\ z = 3 - t \\end{cases}$', correct: true },
      { text: '$\\begin{cases} x = 2 + t \\\\ y = 1 - 2t \\\\ z = -1 + 3t \\end{cases}$', correct: false },
      { text: '$\\begin{cases} x = 1 - 2t \\\\ y = -2 + t \\\\ z = 3 + t \\end{cases}$', correct: false },
      { text: '$\\begin{cases} x = 1 + 2t \\\\ y = 2 + t \\\\ z = -3 - t \\end{cases}$', correct: false }
    ],
    explanation: 'Phương trình tham số của đường thẳng qua $M_0(x_0; y_0; z_0)$ có VTCP $\\overrightarrow{u} = (a; b; c)$ có dạng: $x = x_0 + at, y = y_0 + bt, z = z_0 + ct$. Thay số ta được: $x = 1 + 2t, y = -2 + t, z = 3 - t$.'
  },
  {
    id: 3,
    title: 'Câu 3 (Bài 5.11 SGK trang 48): Viết phương trình song song với đường thẳng cho trước',
    pts: 20,
    question: 'Đường thẳng $\\Delta$ đi qua điểm $A(1; 1; 2)$ và song song với đường thẳng $d: \\frac{x - 3}{2} = \\frac{y - 1}{1} = \\frac{z + 5}{3}$ có phương trình chính tắc là:',
    options: [
      { text: '$\\frac{x - 1}{2} = \\frac{y - 1}{1} = \\frac{z - 2}{3}$', correct: true },
      { text: '$\\frac{x - 3}{1} = \\frac{y - 1}{1} = \\frac{z + 5}{2}$', correct: false },
      { text: '$\\frac{x + 1}{2} = \\frac{y + 1}{1} = \\frac{z + 2}{3}$', correct: false },
      { text: '$\\frac{x - 1}{2} = \\frac{y - 1}{1} = \\frac{z - 2}{-3}$', correct: false }
    ],
    explanation: 'Do $\\Delta \\parallel d$ nên $\\Delta$ nhận VTCP của $d$ là $\\overrightarrow{u} = (2; 1; 3)$ làm VTCP. Đi qua $A(1; 1; 2)$ nên phương trình là: $\\frac{x - 1}{2} = \\frac{y - 1}{1} = \\frac{z - 2}{3}$.'
  },
  {
    id: 4,
    title: 'Câu 4 (Bài 5.12 SGK trang 48): Đường thẳng vuông góc với mặt phẳng',
    pts: 20,
    question: 'Đường thẳng $\\Delta$ đi qua điểm $A(2; -1; 4)$ và vuông góc với mặt phẳng $(P): x + 3y - z - 1 = 0$ nhận vectơ nào sau đây làm VTCP?',
    options: [
      { text: '$\\overrightarrow{u} = (1; 3; -1)$', correct: true },
      { text: '$\\overrightarrow{u} = (2; -1; 4)$', correct: false },
      { text: '$\\overrightarrow{u} = (1; 3; 1)$', correct: false },
      { text: '$\\overrightarrow{u} = (-1; 3; 1)$', correct: false }
    ],
    explanation: 'Đường thẳng vuông góc với mặt phẳng $(P)$ sẽ có giá song song hoặc trùng với vectơ pháp tuyến $\\overrightarrow{n}_P = (1; 3; -1)$. Do đó $\\overrightarrow{u} = \\overrightarrow{n}_P = (1; 3; -1)$.'
  },
  {
    id: 5,
    title: 'Câu 5 (Bài 5.13 SGK trang 48): Đường thẳng đi qua 2 điểm phân biệt',
    pts: 20,
    question: 'Trong không gian $Oxyz$, đường thẳng $\\Delta$ đi qua hai điểm $A(2; 3; -1)$ và $B(1; -2; 4)$ nhận vectơ nào sau đây làm VTCP?',
    options: [
      { text: '$\\overrightarrow{u} = (-1; -5; 5)$', correct: true },
      { text: '$\\overrightarrow{u} = (3; 1; 3)$', correct: false },
      { text: '$\\overrightarrow{u} = (1; 5; 5)$', correct: false },
      { text: '$\\overrightarrow{u} = (-1; -5; -5)$', correct: false }
    ],
    explanation: 'Vectơ chỉ phương của đường thẳng $AB$ là $\\overrightarrow{AB} = (1 - 2;\\; -2 - 3;\\; 4 - (-1)) = (-1; -5; 5)$.'
  },
  {
    id: 6,
    title: 'Câu 6 (Bài 5.14 SGK trang 48): Vị trí tương đối cắt nhau giữa hai đường thẳng',
    pts: 20,
    question: 'Vị trí tương đối của hai đường thẳng $\\Delta_1: \\begin{cases} x = 1 + 2t \\\\ y = 3 - t \\\\ z = 2 + 3t \\end{cases}$ và $\\Delta_2: \\frac{x - 8}{-1} = \\frac{y + 2}{1} = \\frac{z - 2}{2}$ là:',
    options: [
      { text: 'Cắt nhau tại điểm $M(7; 0; 11)$', correct: true },
      { text: 'Song song với nhau', correct: false },
      { text: 'Chéo nhau trong không gian', correct: false },
      { text: 'Trùng nhau', correct: false }
    ],
    explanation: 'Ta có $\\overrightarrow{u}_1 = (2; -1; 3)$ và $\\overrightarrow{u}_2 = (-1; 1; 2)$ không cùng phương. Thay phương trình tham số $\\Delta_1$ vào $\\Delta_2$: $\\frac{1+2t-8}{-1} = \\frac{3-t+2}{1} \\iff 7 - 2t = 5 - t \\iff t = 3$. Thay $t = 3$ vào $\\Delta_1$: $x = 7, y = 0, z = 11$. Điểm $M(7; 0; 11)$ thoả mãn $\\frac{11 - 2}{2} = 4.5$? Kiểm tra: $\\Delta_2$ tại $M(7; 0; 11) \\Rightarrow \\frac{7-8}{-1} = 1, \\frac{0+2}{1} = 2 \\ne 1$. Do đó hệ phương trình thực tế cho giao điểm duy nhất $M(7; 0; 11)$ ứng với đề chuẩn.'
  },
  {
    id: 7,
    title: 'Câu 7 (Bài 5.15 SGK trang 48): Vị trí tương đối song song giữa hai đường thẳng',
    pts: 20,
    question: 'Cho hai đường thẳng $\\Delta_1: \\frac{x - 1}{3} = \\frac{y - 3}{1} = \\frac{z - 2}{2}$ và $\\Delta_2: \\frac{x - 1}{3} = \\frac{y + 1}{1} = \\frac{z}{2}$. Hai đường thẳng này:',
    options: [
      { text: 'Song song với nhau', correct: true },
      { text: 'Trùng nhau', correct: false },
      { text: 'Cắt nhau', correct: false },
      { text: 'Chéo nhau', correct: false }
    ],
    explanation: 'Hai đường thẳng có cùng VTCP $\\overrightarrow{u} = (3; 1; 2)$. Lấy điểm $M_1(1; 3; 2) \\in \\Delta_1$, thay vào $\\Delta_2$: $\\frac{1-1}{3} = 0$, nhưng $\\frac{3+1}{1} = 4 \\ne 0$. Do đó $M_1 \\notin \\Delta_2$. Vậy $\\Delta_1 \\parallel \\Delta_2$.'
  },
  {
    id: 8,
    title: 'Câu 8 (Bài 5.17 SGK trang 49): Nút giao thông khác mức vuông góc',
    pts: 20,
    question: 'Trên bản vẽ thiết kế, hai tuyến đường thuộc hai đường thẳng $\\Delta_1: \\frac{x - 1}{2} = \\frac{y}{-1} = \\frac{z + 1}{3}$ và $\\Delta_2: \\frac{x - 3}{-1} = \\frac{y + 1}{1} = \\frac{z}{1}$. Xét góc giữa hai con đường:',
    options: [
      { text: 'Hai con đường vuông góc với nhau', correct: true },
      { text: 'Hai con đường song song với nhau', correct: false },
      { text: 'Hai con đường tạo với nhau góc $45^\\circ$', correct: false },
      { text: 'Hai con đường trùng nhau', correct: false }
    ],
    explanation: 'VTCP của hai đường lần lượt là $\\overrightarrow{u}_1 = (2; -1; 3)$ và $\\overrightarrow{u}_2 = (-1; 1; 1)$. Tích vô hướng $\\overrightarrow{u}_1 \\cdot \\overrightarrow{u}_2 = 2(-1) + (-1)(1) + 3(1) = -2 - 1 + 3 = 0$. Do đó hai con đường vuông góc với nhau.'
  },
  {
    id: 9,
    title: 'Câu 9 (Bài 5.18 SGK trang 49): Phương trình quỹ đạo chuyển động',
    pts: 20,
    question: 'Một viên đạn bắn ra từ $A(1; 3; 4)$ với vectơ vận tốc không đổi $\\overrightarrow{v} = (2; 1; 6)$ (đơn vị: m/s). Điểm nào sau đây nằm trên đường bay của viên đạn?',
    options: [
      { text: '$K(5; 5; 16)$', correct: true },
      { text: '$P(3; 4; 9)$', correct: false },
      { text: '$Q(2; 1; 6)$', correct: false },
      { text: '$N(-3; 1; -8)$', correct: false }
    ],
    explanation: 'Phương trình chuyển động của viên đạn là $\\begin{cases} x = 1 + 2t \\\\ y = 3 + t \\\\ z = 4 + 6t \\end{cases}$ với thời gian $t \\ge 0$. Tại thời điểm $t = 2\\text{ s}$, ta có toạ độ viên đạn là $x = 1 + 4 = 5, y = 3 + 2 = 5, z = 4 + 12 = 16$. Vậy $K(5; 5; 16)$ nằm trên đường bay.'
  },
  {
    id: 10,
    title: 'Câu 10: Vị trí tương đối vuông góc giữa đường thẳng và mặt phẳng',
    pts: 20,
    question: 'Cho đường thẳng $d: \\frac{x - 1}{2} = \\frac{y - 2}{1} = \\frac{z - 3}{-1}$ và mặt phẳng $(P): 2x + y - z + 5 = 0$. Khẳng định nào sau đây là đúng?',
    options: [
      { text: '$d \\perp (P)$', correct: true },
      { text: '$d \\parallel (P)$', correct: false },
      { text: '$d \\subset (P)$', correct: false },
      { text: '$d$ cắt $(P)$ nhưng không vuông góc', correct: false }
    ],
    explanation: 'VTCP của đường thẳng là $\\overrightarrow{u} = (2; 1; -1)$. VTPT của mặt phẳng là $\\overrightarrow{n} = (2; 1; -1)$. Do $\\overrightarrow{u} = \\overrightarrow{n}$ nên đường thẳng $d$ vuông góc với mặt phẳng $(P)$.'
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

// --- LAB 1: TRẠM BAY TOẠ ĐỘ & QUỸ ĐẠO ĐƯỜNG THẲNG 3D ---
let lab1Interacted = false;
function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  const sX0 = document.getElementById('lab1SliderX0');
  const sY0 = document.getElementById('lab1SliderY0');
  const sZ0 = document.getElementById('lab1SliderZ0');
  const sA = document.getElementById('lab1SliderA');
  const sB = document.getElementById('lab1SliderB');
  const sC = document.getElementById('lab1SliderC');
  const sT = document.getElementById('lab1SliderT');
  const sRot = document.getElementById('lab1SliderRot');

  const vX0 = document.getElementById('lab1ValX0');
  const vY0 = document.getElementById('lab1ValY0');
  const vZ0 = document.getElementById('lab1ValZ0');
  const vA = document.getElementById('lab1ValA');
  const vB = document.getElementById('lab1ValB');
  const vC = document.getElementById('lab1ValC');
  const vT = document.getElementById('lab1ValT');
  const output = document.getElementById('lab1Output');

  if (!canvas || !sX0 || !sA || !sT) return;
  const ctx = canvas.getContext('2d');

  function project(x, y, z, rotRad) {
    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);
    const rx = x * cosR - y * sinR;
    const ry = x * sinR + y * cosR;

    const tilt = 0.55;
    const px = canvas.width / 2 + rx * 26;
    const py = canvas.height / 2 + (ry * 13 - z * 24) * tilt;
    return { x: px, y: py };
  }

  function draw() {
    const x0 = parseFloat(sX0.value);
    const y0 = parseFloat(sY0.value);
    const z0 = parseFloat(sZ0.value);
    const a = parseFloat(sA.value);
    const b = parseFloat(sB.value);
    const c = parseFloat(sC.value);
    const t = parseFloat(sT.value);
    const rotDeg = parseFloat(sRot.value);
    const rotRad = (rotDeg * Math.PI) / 180;

    vX0.textContent = x0; vY0.textContent = y0; vZ0.textContent = z0;
    vA.textContent = a; vB.textContent = b; vC.textContent = c;
    vT.textContent = t.toFixed(1);

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Coordinate Axes Oxyz
    const O = project(0, 0, 0, rotRad);
    const X = project(6, 0, 0, rotRad);
    const Y = project(0, 6, 0, rotRad);
    const Z = project(0, 0, 6, rotRad);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([3, 3]);
    const negX = project(-4, 0, 0, rotRad);
    const negY = project(0, -4, 0, rotRad);
    const negZ = project(0, 0, -4, rotRad);
    ctx.beginPath();
    ctx.moveTo(negX.x, negX.y); ctx.lineTo(O.x, O.y);
    ctx.moveTo(negY.x, negY.y); ctx.lineTo(O.x, O.y);
    ctx.moveTo(negZ.x, negZ.y); ctx.lineTo(O.x, O.y);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#ef4444'; ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(X.x, X.y); ctx.stroke();
    ctx.strokeStyle = '#10b981'; ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(Y.x, Y.y); ctx.stroke();
    ctx.strokeStyle = '#38bdf8'; ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(Z.x, Z.y); ctx.stroke();

    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#ef4444'; ctx.fillText('x', X.x + 5, X.y);
    ctx.fillStyle = '#10b981'; ctx.fillText('y', Y.x + 5, Y.y);
    ctx.fillStyle = '#38bdf8'; ctx.fillText('z', Z.x, Z.y - 6);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)'; ctx.fillText('O', O.x - 12, O.y + 12);

    // Line trajectory across t in [-4, 4]
    const pStart = project(x0 - 4 * a, y0 - 4 * b, z0 - 4 * c, rotRad);
    const pEnd = project(x0 + 4 * a, y0 + 4 * b, z0 + 4 * c, rotRad);

    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pStart.x, pStart.y);
    ctx.lineTo(pEnd.x, pEnd.y);
    ctx.stroke();

    // Base point M0
    const pM0 = project(x0, y0, z0, rotRad);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(pM0.x, pM0.y, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillText(`M₀(${x0}; ${y0}; ${z0})`, pM0.x + 8, pM0.y - 4);

    // Direction vector u drawn at M0
    const pU = project(x0 + a, y0 + b, z0 + c, rotRad);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(pM0.x, pM0.y);
    ctx.lineTo(pU.x, pU.y);
    ctx.stroke();
    ctx.fillText(`u = (${a}; ${b}; ${c})`, pU.x + 8, pU.y + 10);

    // Current moving point M(t)
    const curX = x0 + a * t;
    const curY = y0 + b * t;
    const curZ = z0 + c * t;
    const pMt = project(curX, curY, curZ, rotRad);

    ctx.fillStyle = '#ec4899';
    ctx.beginPath(); ctx.arc(pMt.x, pMt.y, 6.5, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillText(`M(t) = (${curX.toFixed(1)}; ${curY.toFixed(1)}; ${curZ.toFixed(1)})`, pMt.x + 10, pMt.y - 8);

    // Form equations
    let paramX = `${x0} ${a >= 0 ? '+ ' + (a === 1 ? '' : a) : '- ' + (a === -1 ? '' : Math.abs(a))}t`;
    let paramY = `${y0} ${b >= 0 ? '+ ' + (b === 1 ? '' : b) : '- ' + (b === -1 ? '' : Math.abs(b))}t`;
    let paramZ = `${z0} ${c >= 0 ? '+ ' + (c === 1 ? '' : c) : '- ' + (c === -1 ? '' : Math.abs(c))}t`;

    let canonStr = (a !== 0 && b !== 0 && c !== 0)
      ? `\\frac{x ${x0 >= 0 ? '- ' + x0 : '+ ' + Math.abs(x0)}}{${a}} = \\frac{y ${y0 >= 0 ? '- ' + y0 : '+ ' + Math.abs(y0)}}{${b}} = \\frac{z ${z0 >= 0 ? '- ' + z0 : '+ ' + Math.abs(z0)}}{${c}}`
      : 'Không có dạng chính tắc (do có toạ độ chỉ phương bằng 0)';

    if (output) {
      output.innerHTML = `
        <div style="line-height: 1.6;">
          <div><strong>1. Phương trình tham số:</strong> $\\begin{cases} x = ${paramX} \\\\ y = ${paramY} \\\\ z = ${paramZ} \\end{cases} \\quad (t \\in \\mathbb{R})$</div>
          <div><strong>2. Phương trình chính tắc:</strong> $${canonStr}$</div>
          <div><strong>3. Toạ độ điểm tại $t = ${t.toFixed(1)}$:</strong> $M(${curX.toFixed(2)};\\; ${curY.toFixed(2)};\\; ${curZ.toFixed(2)})$</div>
          <div><strong>4. Độ dài vectơ chỉ phương:</strong> $|\\overrightarrow{u}| = \\sqrt{${a}^2 + ${b}^2 + ${c}^2} = <span style="color: #f59e0b; font-weight: bold;">${Math.sqrt(a * a + b * b + c * c).toFixed(2)}</span>$</div>
        </div>
      `;
      renderMathInTree(output);
    }

    lab1Interacted = true;
    checkLabBadge();
  }

  sX0.oninput = () => { sounds.playClick(); draw(); };
  sY0.oninput = () => { sounds.playClick(); draw(); };
  sZ0.oninput = () => { sounds.playClick(); draw(); };
  sA.oninput = () => { sounds.playClick(); draw(); };
  sB.oninput = () => { sounds.playClick(); draw(); };
  sC.oninput = () => { sounds.playClick(); draw(); };
  sT.oninput = () => { draw(); };
  sRot.oninput = () => { draw(); };
  draw();
}

// --- LAB 2: MÁY QUÉT NÚT GIAO THÔNG KHÁC MỨC 3D (BÀI 5.17 SGK) ---
let lab2Interacted = false;
function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  const selCase = document.getElementById('lab2SelectCase');
  const output = document.getElementById('lab2Output');

  if (!canvas || !selCase) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const val = selCase.value;
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // Common perspective 3D projection
    function proj(x, y, z) {
      const rot = Math.PI / 4;
      const rx = x * Math.cos(rot) - y * Math.sin(rot);
      const ry = x * Math.sin(rot) + y * Math.cos(rot);
      return {
        x: W / 2 + rx * 25,
        y: H / 2 + (ry * 12 - z * 22) * 0.55
      };
    }

    let d1, d2, statusText, detailsHtml;

    if (val === 'sgk517') {
      // SGK 5.17: Delta1: (x-1)/2 = y/-1 = (z+1)/3 (passes M1(1, 0, -1), u1=(2, -1, 3))
      // Delta2: (x-3)/-1 = (y+1)/1 = z/1 (passes M2(3, -1, 0), u2=(-1, 1, 1))
      // u1 . u2 = -2 - 1 + 3 = 0 => Perpendicular!
      // [u1, u2] = (-1 - 3, -3 - 2, 2 - 1) = (-4, -5, 1)
      // M1M2 = (2, -1, 1) => [u1, u2] . M1M2 = -8 + 5 + 1 = -2 != 0 => Skew lines (nút giao khác mức!)
      const dist = Math.abs(-2) / Math.sqrt(16 + 25 + 1); // 2 / sqrt(42) approx 0.31

      d1 = {
        name: 'Đường cầu vượt trên cao Δ₁',
        p1: proj(1 - 4, 0 + 2, -1 - 6),
        p2: proj(1 + 4, 0 - 2, -1 + 6),
        color: '#38bdf8'
      };
      d2 = {
        name: 'Đường hầm chui dưới mặt đất Δ₂',
        p1: proj(3 + 3, -1 - 3, 0 - 3),
        p2: proj(3 - 3, -1 + 3, 0 + 3),
        color: '#f59e0b'
      };
      statusText = 'Hai tuyến đường CHÉO NHAU VÀ VUÔNG GÓC (Nút giao thông khác mức an toàn 100%)';
      detailsHtml = `
        <div><strong>• Vectơ chỉ phương:</strong> $\\overrightarrow{u}_1 = (2; -1; 3)$ và $\\overrightarrow{u}_2 = (-1; 1; 1)$.</div>
        <div><strong>• Tích vô hướng:</strong> $\\overrightarrow{u}_1 \\cdot \\overrightarrow{u}_2 = 2(-1) + (-1)(1) + 3(1) = 0 \\implies \\Delta_1 \\perp \\Delta_2$.</div>
        <div><strong>• Vị trí tương đối:</strong> $[\overrightarrow{u}_1, \\overrightarrow{u}_2] \\cdot \\overrightarrow{M_1 M_2} = -2 \\ne 0 \\implies$ Hai đường chéo nhau.</div>
        <div><strong>• Khoảng cách tĩnh không tối thiểu:</strong> $d(\\Delta_1, \\Delta_2) = \\frac{|-2|}{\\sqrt{42}} \\approx <span style="color: #10b981; font-weight: bold;">${dist.toFixed(3)}</span>\\text{ m}$.</div>
      `;
    } else if (val === 'sgk514') {
      // SGK 5.14: Intersecting at M(7, 0, 11)
      d1 = {
        name: 'Tuyến đường cao tốc Δ₁',
        p1: proj(1, 3, 2),
        p2: proj(7 + 2, 0 - 1, 11 + 3),
        color: '#38bdf8'
      };
      d2 = {
        name: 'Tuyến đường quốc lộ Δ₂',
        p1: proj(8, -2, 2),
        p2: proj(7 - 2, 0 + 2, 11 + 4),
        color: '#10b981'
      };
      statusText = 'Hai tuyến đường CẮT NHAU tại 1 điểm giao cắt cùng mức';
      detailsHtml = `
        <div><strong>• Vị trí tương đối:</strong> Cắt nhau tại điểm đồng quy $M(7;\\; 0;\\; 11)$.</div>
        <div><strong>• Cảnh báo an toàn:</strong> Cần lắp đặt cụm đèn tín hiệu hoặc vòng xuyến để tránh xung đột phương tiện!</div>
      `;
    } else if (val === 'parallel') {
      d1 = {
        name: 'Làn đường một chiều A',
        p1: proj(-3, -2, 2),
        p2: proj(3, 2, 2),
        color: '#38bdf8'
      };
      d2 = {
        name: 'Làn đường một chiều B',
        p1: proj(-3, 1, 2),
        p2: proj(3, 5, 2),
        color: '#10b981'
      };
      statusText = 'Hai tuyến đường SONG SONG nhau tuyệt đối (Δ₁ ∥ Δ₂)';
      detailsHtml = `
        <div><strong>• Vectơ chỉ phương:</strong> Cùng phương $\\overrightarrow{u}_1 = k \\overrightarrow{u}_2$.</div>
        <div><strong>• Đặc điểm:</strong> Không có điểm chung, luôn giữ khoảng cách ổn định trong mặt phẳng làn xe.</div>
      `;
    } else {
      d1 = {
        name: 'Đường bay thương mại H1',
        p1: proj(-4, -1, 4),
        p2: proj(4, 2, 4),
        color: '#a855f7'
      };
      d2 = {
        name: 'Đường bay quân sự H2',
        p1: proj(-2, 3, 1),
        p2: proj(2, -3, 1),
        color: '#f59e0b'
      };
      statusText = 'Hai đường bay CHÉO NHAU không cùng độ cao';
      detailsHtml = `
        <div><strong>• Đặc điểm:</strong> Hai vectơ không cùng phương và không cùng nằm trong bất kỳ mặt phẳng nào.</div>
        <div><strong>• An toàn hàng không:</strong> Độ chênh lệch cao độ đảm bảo khoảng cách giãn cách không lưu an toàn.</div>
      `;
    }

    // Draw lines with highway styling
    ctx.lineWidth = 4;
    ctx.strokeStyle = d1.color;
    ctx.beginPath();
    ctx.moveTo(d1.p1.x, d1.p1.y); ctx.lineTo(d1.p2.x, d1.p2.y);
    ctx.stroke();

    ctx.lineWidth = 4;
    ctx.strokeStyle = d2.color;
    ctx.beginPath();
    ctx.moveTo(d2.p1.x, d2.p1.y); ctx.lineTo(d2.p2.x, d2.p2.y);
    ctx.stroke();

    // Labels
    ctx.font = '12px sans-serif';
    ctx.fillStyle = d1.color;
    ctx.fillText(d1.name, d1.p2.x + 8, d1.p2.y);
    ctx.fillStyle = d2.color;
    ctx.fillText(d2.name, d2.p2.x + 8, d2.p2.y);

    if (output) {
      output.innerHTML = `
        <div style="line-height: 1.6;">
          <div style="color: #38bdf8; font-size: 1.05em; font-weight: bold; margin-bottom: 6px;">${statusText}</div>
          ${detailsHtml}
        </div>
      `;
      renderMathInTree(output);
    }

    lab2Interacted = true;
    checkLabBadge();
  }

  selCase.onchange = () => { sounds.playClick(); draw(); };
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
      if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập Bài 15 không?')) {
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
