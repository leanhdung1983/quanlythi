// ==========================================
// TOÁN 12 - CHƯƠNG V: ÔN TẬP BÀI TẬP CUỐI CHƯƠNG V
// PHƯƠNG PHÁP TOẠ ĐỘ TRONG KHÔNG GIAN
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
  s = s.replace(/\\lim\\limits_\{([^}]+)\}/g, '<munder><mo>lim</mo><mrow>$1</mrow></munder>');
  s = s.replace(/\\max\\limits_\{([^}]+)\}/g, '<munder><mo>max</mo><mrow>$1</mrow></munder>');
  s = s.replace(/\\min\\limits_\{([^}]+)\}/g, '<munder><mo>min</mo><mrow>$1</mrow></munder>');
  s = s.replace(/\\left\|([^\\|]+)\\right\|/g, '<mrow><mo>|</mo><mrow>$1</mrow><mo>|</mo></mrow>');
  s = s.replace(/\\left\\|([^\\|]+)\\right\\|/g, '<mrow><mo>&#8214;</mo><mrow>$1</mrow><mo>&#8214;</mo></mrow>');
  s = s.replace(/\\left\(|\\right\)/g, '');
  s = s.replace(/\\cdot/g, '<mo>&#8901;</mo>');
  s = s.replace(/\\times/g, '<mo>&#215;</mo>');
  s = s.replace(/\\approx/g, '<mo>&#8776;</mo>');
  s = s.replace(/\\le/g, '<mo>&#8804;</mo>');
  s = s.replace(/\\ge/g, '<mo>&#8805;</mo>');
  s = s.replace(/\\neq/g, '<mo>&#8800;</mo>');
  s = s.replace(/\\pm/g, '<mo>&#177;</mo>');
  s = s.replace(/\\in/g, '<mo>&#8712;</mo>');
  s = s.replace(/\\parallel/g, '<mo>&#8741;</mo>');
  s = s.replace(/\\perp/g, '<mo>&#8869;</mo>');
  s = s.replace(/\\mathbb\{R\}/g, '<mi class="m-bb">&#8477;</mi>');
  s = s.replace(/\\Delta/g, '<mi>&#916;</mi>');
  s = s.replace(/\\theta/g, '<mi>&#952;</mi>');
  s = s.replace(/\\alpha/g, '<mi>&#945;</mi>');
  s = s.replace(/\\beta/g, '<mi>&#946;</mi>');
  s = s.replace(/\\varphi/g, '<mi>&#966;</mi>');
  s = s.replace(/\\sin/g, '<mi class="m-fn">sin</mi>');
  s = s.replace(/\\cos/g, '<mi class="m-fn">cos</mi>');
  s = s.replace(/\\tan/g, '<mi class="m-fn">tan</mi>');
  s = s.replace(/\\widehat\{([^}]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>^</mo></mover>');
  s = s.replace(/\\text\{([^}]+)\}/g, '<mtext>$1</mtext>');

  // Handle simple tokens
  s = s.replace(/([a-zA-Z]+)/g, (match) => {
    if (['mi', 'mo', 'mrow', 'mfrac', 'msqrt', 'mroot', 'mover', 'munder', 'mtext', 'class', 'accent', 'true'].includes(match)) {
      return match;
    }
    return `<mi>${match}</mi>`;
  });
  s = s.replace(/(\d+(\.\d+)?)/g, '<mn>$1</mn>');
  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${s}</math>`;
}

function formatMathText(text) {
  if (!text) return '';
  text = text.replace(/\$\$([\s\S]*?)\$\$/g, (m, f) => {
    return `<div class="math-block">${latexToMathML(f)}</div>`;
  });
  text = text.replace(/\$([^\$]+?)\$/g, (m, f) => {
    return `<span class="math-inline">${latexToMathML(f)}</span>`;
  });
  return text;
}

function renderMathInTree(root) {
  if (!root) return;
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
      console.warn('KaTeX render error, falling back to MathML', e);
    }
  }

  // MathML fallback
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const nodesToReplace = [];
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeValue && n.nodeValue.includes('$')) {
      nodesToReplace.push(n);
    }
  }
  nodesToReplace.forEach(textNode => {
    const parent = textNode.parentNode;
    if (!parent) return;
    const tagName = parent.tagName ? parent.tagName.toLowerCase() : '';
    if (['script', 'style', 'textarea', 'code'].includes(tagName)) return;
    const span = document.createElement('span');
    span.innerHTML = formatMathText(textNode.nodeValue);
    parent.replaceChild(span, textNode);
  });
}

// --- STATE MANAGEMENT ---
const STORAGE_KEY = 'toan12_ontap5_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Sư Hình Học Không Gian Oxyz 12',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

function loadState() {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      appState = { ...appState, ...parsed };
      sounds.enabled = appState.sound;
    }
  } catch (e) {
    console.error('Error loading state', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.error('Error saving state', e);
  }
}

// --- HUD DISPLAY UPDATES ---
function updateHUD() {
  const avBtn = document.getElementById('avatarBtn');
  const uName = document.getElementById('userNameDisplay');
  const uTitle = document.getElementById('userTitle');
  const starRating = document.getElementById('starRating');
  const xpDisp = document.getElementById('xpDisplay');
  const streakDisp = document.getElementById('streakDisplay');
  const soundToggle = document.getElementById('soundToggle');

  if (avBtn) avBtn.textContent = appState.avatar;
  if (uName) uName.textContent = `${appState.userName} 🌟`;
  if (uTitle) uTitle.textContent = appState.userTitle;

  // Star Rating based on XP
  let starCount = 1;
  if (appState.xp >= 200) starCount = 5;
  else if (appState.xp >= 160) starCount = 4;
  else if (appState.xp >= 100) starCount = 3;
  else if (appState.xp >= 40) starCount = 2;
  appState.stars = starCount;

  if (starRating) {
    starRating.textContent = '⭐'.repeat(starCount) + '☆'.repeat(5 - starCount);
  }

  if (xpDisp) xpDisp.textContent = appState.xp;
  if (streakDisp) streakDisp.textContent = `🔥 ${appState.streak}`;

  if (soundToggle) {
    soundToggle.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
  }

  // Update arena summary
  const arenaProg = document.getElementById('arenaProgress');
  const arenaSc = document.getElementById('arenaScore');
  const totalAnswered = Object.keys(appState.answered).length;
  if (arenaProg) arenaProg.textContent = `${totalAnswered}/10`;
  if (arenaSc) arenaSc.textContent = `${appState.xp} XP`;

  // Certificate Sync
  const certName = document.getElementById('certStudentName');
  const certXP = document.getElementById('certXP');
  const certRank = document.getElementById('certRank');
  if (certName) certName.textContent = appState.userName;
  if (certXP) certXP.textContent = `${appState.xp} XP`;
  if (certRank) {
    if (appState.xp >= 180) certRank.textContent = 'Xuất Sắc (Thủ Khoa Oxyz)';
    else if (appState.xp >= 140) certRank.textContent = 'Giỏi (Đại Sư Không Gian)';
    else if (appState.xp >= 80) certRank.textContent = 'Khá';
    else certRank.textContent = 'Đạt Chuẩn';
  }

  checkBadges();
}

function checkBadges() {
  const b1 = document.getElementById('badge-1');
  const b2 = document.getElementById('badge-2');
  const b3 = document.getElementById('badge-3');
  const b4 = document.getElementById('badge-4');
  const b5 = document.getElementById('badge-5');

  const answeredCount = Object.keys(appState.answered).length;
  let correctCount = 0;
  for (let id in appState.answered) {
    if (appState.answered[id].correct) correctCount++;
  }

  // Badge 1: Completed first question
  if (answeredCount >= 1 && !appState.badges[0]) {
    appState.badges[0] = true;
    sounds.playLevelUp();
  }
  // Badge 2: Streak >= 3
  if (appState.streak >= 3 && !appState.badges[1]) {
    appState.badges[1] = true;
    sounds.playLevelUp();
  }
  // Badge 4: XP >= 160
  if (appState.xp >= 160 && !appState.badges[3]) {
    appState.badges[3] = true;
    sounds.playLevelUp();
  }
  // Badge 5: 10/10 correct
  if (correctCount >= 10 && !appState.badges[4]) {
    appState.badges[4] = true;
    sounds.playFanfare();
  }

  if (b1) b1.style.borderColor = appState.badges[0] ? '#10b981' : 'rgba(99, 102, 241, 0.2)';
  if (b2) b2.style.borderColor = appState.badges[1] ? '#f59e0b' : 'rgba(99, 102, 241, 0.2)';
  if (b3) b3.style.borderColor = appState.badges[2] ? '#06b6d4' : 'rgba(99, 102, 241, 0.2)';
  if (b4) b4.style.borderColor = appState.badges[3] ? '#8b5cf6' : 'rgba(99, 102, 241, 0.2)';
  if (b5) b5.style.borderColor = appState.badges[4] ? '#ec4899' : 'rgba(99, 102, 241, 0.2)';

  saveState();
}

// --- 10 ARENA QUIZ QUESTIONS (SGK PP. 61–63) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1 (Câu 5.31 SGK trang 61): VTPT của mặt phẳng',
    pts: 20,
    question: 'Trong không gian $Oxyz$, cho mặt phẳng $(P): x - 2y - 3z + 1 = 0$. Một vectơ pháp tuyến của mặt phẳng $(P)$ có toạ độ là:',
    options: [
      { text: '$(1; 2; 3)$', correct: false },
      { text: '$(1; -2; 3)$', correct: false },
      { text: '$(1; 2; -3)$', correct: false },
      { text: '$(1; -2; -3)$', correct: true }
    ],
    explanation: 'Phương trình tổng quát của mặt phẳng có dạng $Ax + By + Cz + D = 0$, có một vectơ pháp tuyến là $\\overrightarrow{n} = (A; B; C)$. Do đó, với mặt phẳng $(P): x - 2y - 3z + 1 = 0$, một VTPT là $\\overrightarrow{n} = (1; -2; -3)$.'
  },
  {
    id: 2,
    title: 'Câu 2 (Câu 5.32 SGK trang 61): Lập phương trình mặt phẳng',
    pts: 20,
    question: 'Trong không gian $Oxyz$, phương trình mặt phẳng $(P)$ đi qua điểm $I(1; -1; 2)$ và nhận vectơ $\\overrightarrow{n} = (2; 1; -1)$ làm một vectơ pháp tuyến là:',
    options: [
      { text: '$x - y + 2z + 1 = 0$', correct: false },
      { text: '$x - y + 2z - 6 = 0$', correct: false },
      { text: '$2x + y - z - 1 = 0$', correct: false },
      { text: '$2x + y - z + 1 = 0$', correct: true }
    ],
    explanation: 'Mặt phẳng đi qua $I(1; -1; 2)$ với VTPT $\\overrightarrow{n} = (2; 1; -1)$ có phương trình: $2(x - 1) + 1(y + 1) - 1(z - 2) = 0 \\iff 2x - 2 + y + 1 - z + 2 = 0 \\iff 2x + y - z + 1 = 0$.'
  },
  {
    id: 3,
    title: 'Câu 3 (Câu 5.33 SGK trang 61): VTCP của đường thẳng chính tắc',
    pts: 20,
    question: 'Trong không gian $Oxyz$, cho đường thẳng $d: \\frac{x-1}{2} = \\frac{y+2}{1} = \\frac{z-3}{-2}$. Một vectơ chỉ phương của đường thẳng $d$ có toạ độ là:',
    options: [
      { text: '$(1; -2; 3)$', correct: false },
      { text: '$(2; 1; -2)$', correct: true },
      { text: '$(2; 1; 2)$', correct: false },
      { text: '$(1; 2; 3)$', correct: false }
    ],
    explanation: 'Phương trình chính tắc $\\frac{x - x_0}{a} = \\frac{y - y_0}{b} = \\frac{z - z_0}{c}$ có vectơ chỉ phương $\\overrightarrow{u} = (a; b; c)$. Suy ra $\\overrightarrow{u} = (2; 1; -2)$.'
  },
  {
    id: 4,
    title: 'Câu 4 (Câu 5.34 SGK trang 61): VTCP của đường thẳng tham số',
    pts: 20,
    question: 'Trong không gian $Oxyz$, cho đường thẳng $d: \\begin{cases}x = 1 + 2t \\\\ y = -2 + t \\\\ z = 3 - t\\end{cases}$. Một vectơ chỉ phương của đường thẳng $d$ có toạ độ là:',
    options: [
      { text: '$(1; -2; 3)$', correct: false },
      { text: '$(2; 0; 0)$', correct: false },
      { text: '$(2; 1; -1)$', correct: true },
      { text: '$(2; 1; 1)$', correct: false }
    ],
    explanation: 'Hệ số của tham số $t$ trong phương trình tham số chính là toạ độ của vectơ chỉ phương: $\\overrightarrow{u} = (2; 1; -1)$.'
  },
  {
    id: 5,
    title: 'Câu 5 (Câu 5.35 SGK trang 61): Lập phương trình chính tắc đường thẳng',
    pts: 20,
    question: 'Trong không gian $Oxyz$, phương trình đường thẳng $d$ đi qua điểm $I(2; -1; 1)$ và nhận vectơ $\\overrightarrow{u} = (1; 2; -3)$ làm một vectơ chỉ phương là:',
    options: [
      { text: '$\\frac{x - 1}{2} = \\frac{y - 2}{-1} = \\frac{z + 3}{1}$', correct: false },
      { text: '$\\frac{x - 2}{1} = \\frac{y - 1}{2} = \\frac{z - 1}{-3}$', correct: false },
      { text: '$\\frac{x - 2}{1} = \\frac{y + 1}{2} = \\frac{z - 1}{-3}$', correct: true },
      { text: '$\\frac{x - 1}{2} = \\frac{y - 2}{1} = \\frac{z + 3}{1}$', correct: false }
    ],
    explanation: 'Đường thẳng qua $I(x_0; y_0; z_0) = (2; -1; 1)$ có VTCP $\\overrightarrow{u} = (1; 2; -3)$ có phương trình chính tắc: $\\frac{x - 2}{1} = \\frac{y - (-1)}{2} = \\frac{z - 1}{-3} \\iff \\frac{x - 2}{1} = \\frac{y + 1}{2} = \\frac{z - 1}{-3}$.'
  },
  {
    id: 6,
    title: 'Câu 6 (Câu 5.36 SGK trang 61): Phương trình đường thẳng đi qua hai điểm',
    pts: 20,
    question: 'Trong không gian $Oxyz$, cho hai điểm $A(-1; 0; -1)$ và $B(2; 1; 1)$. Phương trình đường thẳng $AB$ là:',
    options: [
      { text: '$\\begin{cases}x = 1 + 3t \\\\ y = t \\\\ z = 1 + 2t\\end{cases}$', correct: false },
      { text: '$\\begin{cases}x = -1 + t \\\\ y = t \\\\ z = -1 + 2t\\end{cases}$', correct: false },
      { text: '$\\begin{cases}x = 2 + t \\\\ y = 1 + t \\\\ z = 1 + 2t\\end{cases}$', correct: false },
      { text: '$\\begin{cases}x = -1 + 3t \\\\ y = t \\\\ z = -1 + 2t\\end{cases}$', correct: true }
    ],
    explanation: 'Vectơ chỉ phương của $AB$ là $\\overrightarrow{AB} = (2 - (-1); 1 - 0; 1 - (-1)) = (3; 1; 2)$. Đường thẳng $AB$ đi qua $A(-1; 0; -1)$ có phương trình tham số: $\\begin{cases}x = -1 + 3t \\\\ y = t \\\\ z = -1 + 2t\\end{cases}$.'
  },
  {
    id: 7,
    title: 'Câu 7 (Câu 5.37 SGK trang 61): Đường thẳng vuông góc với mặt phẳng',
    pts: 20,
    question: 'Trong không gian $Oxyz$, phương trình đường thẳng $d$ đi qua $I(2; 1; -3)$ và vuông góc với mặt phẳng $(P): x - 2y + z - 3 = 0$ là:',
    options: [
      { text: '$\\frac{x - 2}{1} = \\frac{y - 1}{-2} = \\frac{z + 3}{1}$', correct: true },
      { text: '$\\frac{x - 2}{1} = \\frac{y - 1}{2} = \\frac{z - 3}{1}$', correct: false },
      { text: '$\\frac{x - 2}{1} = \\frac{y - 1}{-2} = \\frac{z - 3}{1}$', correct: false },
      { text: '$\\frac{x - 2}{1} = \\frac{y - 1}{2} = \\frac{z + 3}{1}$', correct: false }
    ],
    explanation: 'Vì $d \\perp (P)$ nên VTCP của $d$ cùng phương với VTPT của $(P)$: $\\overrightarrow{u}_d = \\overrightarrow{n}_P = (1; -2; 1)$. Đường thẳng đi qua $I(2; 1; -3)$ có dạng: $\\frac{x - 2}{1} = \\frac{y - 1}{-2} = \\frac{z + 3}{1}$.'
  },
  {
    id: 8,
    title: 'Câu 8 (Câu 5.38 SGK trang 62): Tâm và bán kính mặt cầu chính tắc',
    pts: 20,
    question: 'Trong không gian $Oxyz$, cho mặt cầu $(S): (x+1)^2 + y^2 + (z-3)^2 = 4$. Toạ độ tâm $I$ và bán kính $R$ của $(S)$ lần lượt là:',
    options: [
      { text: '$I(1; 0; 3), R = 4$', correct: false },
      { text: '$I(1; 0; 3), R = 2$', correct: false },
      { text: '$I(-1; 0; 3), R = 2$', correct: true },
      { text: '$I(-1; 0; 3), R = 4$', correct: false }
    ],
    explanation: 'Phương trình $(x - a)^2 + (y - b)^2 + (z - c)^2 = R^2$ có tâm $I(a; b; c)$ và bán kính $R$. Ở đây $(x - (-1))^2 + (y - 0)^2 + (z - 3)^2 = 2^2 \\implies I(-1; 0; 3)$ và $R = 2$.'
  },
  {
    id: 9,
    title: 'Câu 9 (Câu 5.39 SGK trang 62): Tâm và bán kính mặt cầu khai triển',
    pts: 20,
    question: 'Trong không gian $Oxyz$, cho mặt cầu $(S): x^2 + y^2 + z^2 - 2x + 4y + 2z - 3 = 0$. Toạ độ tâm $I$ và bán kính $R$ của mặt cầu $(S)$ lần lượt là:',
    options: [
      { text: '$I(1; -2; -1), R = 3$', correct: true },
      { text: '$I(1; 2; 1), R = 9$', correct: false },
      { text: '$I(1; 2; 1), R = 3$', correct: false },
      { text: '$I(1; -2; -1), R = 9$', correct: false }
    ],
    explanation: 'Đưa về dạng chuẩn: $a = 1, b = -2, c = -1, d = -3$. Bán kính $R = \\sqrt{a^2 + b^2 + c^2 - d} = \\sqrt{1^2 + (-2)^2 + (-1)^2 - (-3)} = \\sqrt{1 + 4 + 1 + 3} = \\sqrt{9} = 3$. Tâm $I(1; -2; -1)$.'
  },
  {
    id: 10,
    title: 'Câu 10 (Bài 5.52 SGK trang 63): Mô hình đường chân trời Trái Đất',
    pts: 20,
    question: 'Trong không gian $Oxyz$, giả sử bề mặt Trái Đất $(S)$ có phương trình $x^2 + y^2 + z^2 = 1$ và người quan sát ở vị trí $B(1; 1; -1)$. Gọi $A$ là một vị trí bất kì trên đường chân trời đối với người quan sát tại $B$ (biết $\\widehat{BAO} = 90^\\circ$ với $O$ là tâm Trái Đất). Khoảng cách $AB$ bằng:',
    options: [
      { text: '$AB = 1$', correct: false },
      { text: '$AB = \\sqrt{2} \\approx 1.414$', correct: true },
      { text: '$AB = \\sqrt{3} \\approx 1.732$', correct: false },
      { text: '$AB = 2$', correct: false }
    ],
    explanation: 'Tâm Trái Đất là gốc toạ độ $O(0; 0; 0)$, bán kính $OA = R = 1$. Khoảng cách từ $O$ đến $B(1; 1; -1)$ là: $OB = \\sqrt{1^2 + 1^2 + (-1)^2} = \\sqrt{3}$. Tam giác $OAB$ vuông tại $A$ nên theo định lý Pythagore: $AB = \\sqrt{OB^2 - OA^2} = \\sqrt{(\\sqrt{3})^2 - 1^2} = \\sqrt{3 - 1} = \\sqrt{2} \\approx 1.414$.'
  }
];

// --- RENDER QUIZ CONTAINER ---
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let answeredCount = 0;
  quizData.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard_${q.id}`;

    const answered = appState.answered[q.id];
    if (answered) answeredCount++;

    let optsHtml = '';
    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, oIdx) => {
      let optClass = 'quiz-opt-btn';
      let disabled = '';
      if (answered) {
        disabled = 'disabled';
        if (opt.correct) {
          optClass += ' correct';
        } else if (answered.selectedIdx === oIdx) {
          optClass += ' wrong';
        }
      }
      optsHtml += `
        <button class="${optClass}" data-qid="${q.id}" data-oidx="${oIdx}" ${disabled}>
          <span class="opt-letter">${letters[oIdx]}</span>
          <span class="opt-text">${opt.text}</span>
        </button>
      `;
    });

    const expShow = answered ? 'show' : '';
    card.innerHTML = `
      <div class="quiz-card-header">
        <span class="quiz-badge">${q.title}</span>
        <span class="quiz-pts">+${q.pts} XP</span>
      </div>
      <p class="quiz-question">${q.question}</p>
      <div class="quiz-options">${optsHtml}</div>
      <div class="explanation-box ${expShow}" id="exp_${q.id}">
        <strong>💡 Lời giải chi tiết:</strong><br>
        ${q.explanation}
      </div>
    `;

    container.appendChild(card);
  });

  // Attach button click events
  const buttons = container.querySelectorAll('.quiz-opt-btn:not([disabled])');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      const qid = parseInt(btn.dataset.qid);
      const oidx = parseInt(btn.dataset.oidx);
      handleAnswer(qid, oidx);
    });
  });

  renderMathInTree(container);
}

function handleAnswer(qid, selectedIdx) {
  if (appState.answered[qid]) return;

  const q = quizData.find(item => item.id === qid);
  if (!q) return;

  const isCorrect = q.options[selectedIdx].correct;
  if (isCorrect) {
    sounds.playCorrect();
    appState.xp += q.pts;
    appState.streak += 1;
  } else {
    sounds.playWrong();
    appState.streak = 0;
  }

  appState.answered[qid] = {
    selectedIdx: selectedIdx,
    correct: isCorrect
  };

  saveState();
  updateHUD();
  renderQuiz();
}

// --- LAB 1: TRẠM KHẢO SÁT KHÔNG GIAN OXYZ ĐA NĂNG ---
let lab1Interacted = false;

function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  const selectMode = document.getElementById('lab1ModeSelect');
  const sliderK = document.getElementById('lab1SliderK');
  const sliderAngle = document.getElementById('lab1SliderAngle');
  const valK = document.getElementById('lab1ValK');
  const valAngle = document.getElementById('lab1ValAngle');
  const output = document.getElementById('lab1Output');

  if (!canvas || !selectMode || !sliderK || !sliderAngle) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const mode = selectMode.value;
    const k = parseFloat(sliderK.value);
    const angleDeg = parseFloat(sliderAngle.value);
    const angleRad = (angleDeg * Math.PI) / 180;

    if (valK) valK.textContent = k.toFixed(1);
    if (valAngle) valAngle.textContent = `${angleDeg}°`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2;
    const cy = h / 2 + 20;
    const scale = 36;

    // 3D Isometric projection
    function project(x, y, z) {
      const rx = x * Math.cos(angleRad) - y * Math.sin(angleRad);
      const ry = x * Math.sin(angleRad) + y * Math.cos(angleRad);
      const isoX = cx + (rx - ry * 0.5) * scale;
      const isoY = cy - (z * 0.9 - ry * 0.35) * scale;
      return { x: isoX, y: isoY };
    }

    // Draw 3D Axes
    const O = project(0, 0, 0);
    const X = project(4.5, 0, 0);
    const Y = project(0, 4.5, 0);
    const Z = project(0, 0, 4.5);

    ctx.lineWidth = 1.2;
    // Ox
    ctx.strokeStyle = '#ef4444';
    ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(X.x, X.y); ctx.stroke();
    // Oy
    ctx.strokeStyle = '#10b981';
    ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(Y.x, Y.y); ctx.stroke();
    // Oz
    ctx.strokeStyle = '#38bdf8';
    ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.lineTo(Z.x, Z.y); ctx.stroke();

    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#ef4444'; ctx.fillText('x', X.x + 5, X.y);
    ctx.fillStyle = '#10b981'; ctx.fillText('y', Y.x + 5, Y.y);
    ctx.fillStyle = '#38bdf8'; ctx.fillText('z', Z.x + 5, Z.y);

    if (mode === 'line_plane') {
      // Plane (P): z = 0 (Oxy) or plane z = 0.5y
      // Draw quad plane
      const p1 = project(-3, -3, 0);
      const p2 = project(3, -3, 0);
      const p3 = project(3, 3, 0);
      const p4 = project(-3, 3, 0);

      ctx.fillStyle = 'rgba(99, 102, 241, 0.22)';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#818cf8';
      ctx.stroke();

      // Line d: through (k; -3; k*0.6 - 1) to (k; 3; k*0.6 + 1)
      const lA = project(k, -3.5, -1.5);
      const lB = project(k, 3.5, 1.5);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(lA.x, lA.y); ctx.lineTo(lB.x, lB.y); ctx.stroke();

      // Intersection with Oxy: z = 0 => y = 0
      const M = project(k, 0, 0);
      ctx.fillStyle = '#ec4899';
      ctx.beginPath(); ctx.arc(M.x, M.y, 6, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.stroke();
      ctx.fillStyle = '#ffffff';
      ctx.fillText(`M(${k.toFixed(1)}; 0; 0)`, M.x + 8, M.y - 4);

      if (output) {
        output.innerHTML = `
          <div><strong>1. Đối tượng hình học:</strong> Mặt phẳng $(P): z = 0$ (mặt phẳng $Oxy$) và đường thẳng $d$.</div>
          <div><strong>2. Toạ độ giao điểm:</strong> $M(${k.toFixed(1)};\\; 0;\\; 0)$ tại mặt phẳng $(P)$.</div>
          <div><strong>3. Vị trí tương đối:</strong> Đường thẳng $d$ luôn <span style="color: #10b981; font-weight: bold;">Cắt</span> mặt phẳng $(P)$ tại duy nhất 1 điểm $M$.</div>
        `;
        renderMathInTree(output);
      }
    } else if (mode === 'plane_sphere') {
      // Sphere at O with R = 2
      const R = 2;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.arc(O.x, O.y, R * scale, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Plane (P): z = k
      const p1 = project(-2.8, -2.8, k);
      const p2 = project(2.8, -2.8, k);
      const p3 = project(2.8, 2.8, k);
      const p4 = project(-2.8, 2.8, k);

      ctx.fillStyle = 'rgba(245, 158, 11, 0.25)';
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y); ctx.lineTo(p3.x, p3.y); ctx.lineTo(p4.x, p4.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.stroke();

      const dist = Math.abs(k);
      let statusHtml = '';
      if (dist < R) {
        const rCircle = Math.sqrt(R * R - k * k);
        const cProj = project(0, 0, k);
        ctx.strokeStyle = '#ec4899';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(cProj.x, cProj.y, rCircle * scale, rCircle * scale * 0.35, 0, 0, 2 * Math.PI);
        ctx.stroke();
        statusHtml = `<span style="color: #10b981; font-weight: bold;">Cắt nhau</span> theo đường tròn thiết diện tâm $H(0; 0; ${k.toFixed(1)})$, bán kính $r = \\sqrt{R^2 - d^2} = \\sqrt{4 - ${k.toFixed(1)}^2} = ${rCircle.toFixed(2)}$.`;
      } else if (Math.abs(dist - R) < 0.05) {
        statusHtml = `<span style="color: #f59e0b; font-weight: bold;">Tiếp xúc</span> tại tiếp điểm $H(0; 0; ${k.toFixed(1)})$. Bán kính $r = 0$.`;
      } else {
        statusHtml = `<span style="color: #94a3b8; font-weight: bold;">Không giao nhau</span> vì khoảng cách $d(O, (P)) = ${dist.toFixed(2)} > R = 2$.`;
      }

      if (output) {
        output.innerHTML = `
          <div><strong>1. Đối tượng:</strong> Mặt cầu $(S): x^2 + y^2 + z^2 = 4$ ($R = 2$) và mặt phẳng $(P): z = ${k.toFixed(1)}$.</div>
          <div><strong>2. Khoảng cách:</strong> $d(O, (P)) = |${k.toFixed(1)}| = ${dist.toFixed(2)}$.</div>
          <div><strong>3. Vị trí tương đối:</strong> ${statusHtml}</div>
        `;
        renderMathInTree(output);
      }
    } else {
      // Line and Sphere
      const R = 2;
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.lineWidth = 1.5;
      ctx.fillStyle = 'rgba(56, 189, 248, 0.15)';
      ctx.beginPath();
      ctx.arc(O.x, O.y, R * scale, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();

      // Line d: x = k, y = t, z = 0
      const lA = project(k, -3.5, 0);
      const lB = project(k, 3.5, 0);

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(lA.x, lA.y); ctx.lineTo(lB.x, lB.y); ctx.stroke();

      const dist = Math.abs(k);
      let statusHtml = '';
      if (dist < R) {
        const yVal = Math.sqrt(R * R - k * k);
        const P1 = project(k, yVal, 0);
        const P2 = project(k, -yVal, 0);

        ctx.fillStyle = '#10b981';
        ctx.beginPath(); ctx.arc(P1.x, P1.y, 5, 0, 2 * Math.PI); ctx.fill();
        ctx.beginPath(); ctx.arc(P2.x, P2.y, 5, 0, 2 * Math.PI); ctx.fill();

        statusHtml = `<span style="color: #10b981; font-weight: bold;">Cắt nhau tại 2 điểm:</span> $M_1(${k.toFixed(1)};\\; ${yVal.toFixed(2)};\\; 0)$ và $M_2(${k.toFixed(1)};\\; -${yVal.toFixed(2)};\\; 0)$. Độ dài dây cung: $M_1M_2 = 2\\sqrt{R^2 - d^2} = ${(2 * yVal).toFixed(2)}$.`;
      } else if (Math.abs(dist - R) < 0.05) {
        statusHtml = `<span style="color: #f59e0b; font-weight: bold;">Tiếp xúc</span> tại duy nhất điểm $H(${k.toFixed(1)};\\; 0;\\; 0)$.`;
      } else {
        statusHtml = `<span style="color: #94a3b8; font-weight: bold;">Không cắt nhau</span> vì khoảng cách $d(O, d) = ${dist.toFixed(2)} > R = 2$.`;
      }

      if (output) {
        output.innerHTML = `
          <div><strong>1. Đối tượng:</strong> Mặt cầu $(S): x^2 + y^2 + z^2 = 4$ ($R = 2$) và đường thẳng $d: x = ${k.toFixed(1)}, z = 0$.</div>
          <div><strong>2. Khoảng cách:</strong> $d(O, d) = |${k.toFixed(1)}| = ${dist.toFixed(2)}$.</div>
          <div><strong>3. Vị trí tương đối:</strong> ${statusHtml}</div>
        `;
        renderMathInTree(output);
      }
    }

    lab1Interacted = true;
    checkLabBadge();
  }

  selectMode.onchange = () => { sounds.playClick(); draw(); };
  sliderK.oninput = () => { sounds.playClick(); draw(); };
  sliderAngle.oninput = () => { draw(); };
  draw();
}

// --- LAB 2: MÔ PHỎNG 3D ĐƯỜNG CHÂN TRỜI & TẦM NHÌN VŨ TRỤ (BÀI 5.52 SGK) ---
let lab2Interacted = false;

function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  const sliderOB = document.getElementById('lab2SliderOB');
  const sliderRot = document.getElementById('lab2SliderRot');
  const valOB = document.getElementById('lab2ValOB');
  const valRot = document.getElementById('lab2ValRot');
  const output = document.getElementById('lab2Output');

  if (!canvas || !sliderOB || !sliderRot) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const ob = parseFloat(sliderOB.value);
    const rotDeg = parseFloat(sliderRot.value);
    const rotRad = (rotDeg * Math.PI) / 180;

    if (valOB) valOB.textContent = ob.toFixed(2);
    if (valRot) valRot.textContent = `${rotDeg}°`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const cx = w / 2 - 40;
    const cy = h / 2;
    const R_px = 75; // Earth Radius on canvas
    const R_unit = 1.0;

    // Earth Center O
    const Ox = cx;
    const Oy = cy;

    // Observer position B along rotated direction
    const distPx = ob * R_px;
    const Bx = Ox + distPx * Math.cos(rotRad);
    const By = Oy - distPx * Math.sin(rotRad);

    // Earth Sphere Gradient
    const earthGrad = ctx.createRadialGradient(Ox - 20, Oy - 20, 15, Ox, Oy, R_px);
    earthGrad.addColorStop(0, '#38bdf8');
    earthGrad.addColorStop(0.6, '#1d4ed8');
    earthGrad.addColorStop(1, '#091e60');

    ctx.fillStyle = earthGrad;
    ctx.beginPath();
    ctx.arc(Ox, Oy, R_px, 0, 2 * Math.PI);
    ctx.fill();
    ctx.strokeStyle = '#60a5fa';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Equator / Latitude lines
    ctx.beginPath();
    ctx.ellipse(Ox, Oy, R_px, R_px * 0.35, rotRad, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Center point O
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(Ox, Oy, 3, 0, 2 * Math.PI); ctx.fill();
    ctx.font = 'bold 12px sans-serif';
    ctx.fillText('O (Tâm)', Ox - 25, Oy - 8);

    // Tangent distance AB = sqrt(OB^2 - R^2)
    const ab = Math.sqrt(ob * ob - R_unit * R_unit);
    // Angle between OB and OA: theta = arcsin(R / OB)
    const theta = Math.asin(R_unit / ob);
    // Distance from O to chord plane: dH = R * cos(theta) = R^2 / ob
    // Radius of horizon circle: rH = R * sin(theta) = R * ab / ob
    const rH_px = (R_unit * ab / ob) * R_px;
    const dH_px = (R_unit * R_unit / ob) * R_px;

    // Contact points A1, A2
    const dirX = Math.cos(rotRad);
    const dirY = -Math.sin(rotRad);
    const perpX = -Math.sin(rotRad);
    const perpY = -Math.cos(rotRad);

    const Hx = Ox + dH_px * dirX;
    const Hy = Oy + dH_px * dirY;

    const A1x = Hx + rH_px * perpX;
    const A1y = Hy + rH_px * perpY;

    const A2x = Hx - rH_px * perpX;
    const A2y = Hy - rH_px * perpY;

    // Tangent Cone lines BA1 and BA2
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(Bx, By); ctx.lineTo(A1x, A1y);
    ctx.moveTo(Bx, By); ctx.lineTo(A2x, A2y);
    ctx.stroke();

    // Line OB
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(Ox, Oy); ctx.lineTo(Bx, By); ctx.stroke();

    // Radius OA1, OA2 (show perpendicular)
    ctx.strokeStyle = '#ec4899';
    ctx.beginPath();
    ctx.moveTo(Ox, Oy); ctx.lineTo(A1x, A1y);
    ctx.moveTo(Ox, Oy); ctx.lineTo(A2x, A2y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Horizon circle (projected ellipse)
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(Hx, Hy, rH_px, rH_px * 0.4, rotRad + Math.PI / 2, 0, 2 * Math.PI);
    ctx.stroke();

    // Observer Point B
    ctx.fillStyle = '#ef4444';
    ctx.beginPath(); ctx.arc(Bx, By, 6, 0, 2 * Math.PI); ctx.fill();
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillText('B (Quan sát)', Bx + 8, By - 6);

    // Tangent point A1
    ctx.fillStyle = '#10b981';
    ctx.beginPath(); ctx.arc(A1x, A1y, 5, 0, 2 * Math.PI); ctx.fill();
    ctx.fillText('A (Chân trời)', A1x + 8, A1y);

    // Height above earth: h = OB - R
    const heightRatio = ob - 1;
    const kmHeight = (heightRatio * 6371).toFixed(0); // Earth radius ~ 6371km
    const kmHorizon = (ab * 6371).toFixed(0);

    if (output) {
      output.innerHTML = `
        <div style="line-height: 1.6;">
          <div><strong>1. Dữ liệu hình học bài toán:</strong> Bán kính Trái Đất $OA = R = 1$ đv; khoảng cách $OB = ${ob.toFixed(2)}$ đv.</div>
          <div><strong>2. Định lý Pythagore cho $\\triangle OAB$ vuông tại $A$ (Bài 5.52 SGK):</strong></div>
          <div style="margin-left: 15px; color: #38bdf8;">
            $$AB = \\sqrt{OB^2 - OA^2} = \\sqrt{${ob.toFixed(2)}^2 - 1^2} = \\sqrt{${(ob * ob - 1).toFixed(2)}} \\approx ${ab.toFixed(3)} \\text{ đv}$$
          </div>
          <div><strong>3. Quy đổi thực tế (Bán kính Trái Đất $\\approx 6371$ km):</strong></div>
          <div style="margin-left: 15px; color: #10b981;">
            • Độ cao người quan sát: $h \\approx ${kmHeight}$ km.<br>
            • Tầm nhìn đường chân trời: $AB \\approx <span style="font-weight: bold; color: #f59e0b;">${kmHorizon} km</span>.
          </div>
        </div>
      `;
      renderMathInTree(output);
    }

    lab2Interacted = true;
    checkLabBadge();
  }

  sliderOB.oninput = () => { sounds.playClick(); draw(); };
  sliderRot.oninput = () => { draw(); };
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

// --- INITIALIZATION & EVENT LISTENERS ---
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
  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình ôn tập Chương V không?')) {
        sounds.playClick();
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        saveState();
        updateHUD();
        renderQuiz();
      }
    });
  }

  // Print Certificate Button
  const btnPrintCert = document.getElementById('btnPrintCert');
  if (btnPrintCert) {
    btnPrintCert.addEventListener('click', () => {
      sounds.playClick();
      window.print();
    });
  }

  // Avatar Modal Handlers
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const closeAvatarModal = document.getElementById('closeAvatarModal');
  const btnConfirmAvatar = document.getElementById('btnConfirmAvatar');
  const avatarCards = document.querySelectorAll('.avatar-card');

  let selectedAvatar = appState.avatar;
  let selectedName = appState.userName;

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      sounds.playClick();
      avatarModal.style.display = 'flex';
      avatarModal.classList.add('active');
    });
  }

  if (closeAvatarModal && avatarModal) {
    closeAvatarModal.addEventListener('click', () => {
      sounds.playClick();
      avatarModal.style.display = 'none';
      avatarModal.classList.remove('active');
    });
  }

  avatarCards.forEach(card => {
    card.addEventListener('click', () => {
      sounds.playClick();
      avatarCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      selectedAvatar = card.dataset.avatar;
      selectedName = card.dataset.name;
    });
  });

  if (btnConfirmAvatar && avatarModal) {
    btnConfirmAvatar.addEventListener('click', () => {
      sounds.playClick();
      appState.avatar = selectedAvatar;
      appState.userName = selectedName;
      saveState();
      updateHUD();
      avatarModal.style.display = 'none';
      avatarModal.classList.remove('active');
    });
  }

  // Initialize Labs and Quiz
  initLab1();
  initLab2();
  renderQuiz();

  // Math rendering for initial active tab
  renderMathInTree(document.body);
});
