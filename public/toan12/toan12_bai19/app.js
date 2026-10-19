// ==========================================
// TOÁN 12 - CHƯƠNG VI: BÀI 19: CÔNG THỨC XÁC SUẤT TOÀN PHẦN VÀ CÔNG THỨC BAYES
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
  s = s.replace(/\\overline\{([^}]+)\}/g, '<mover accent="false"><mrow><mi>$1</mi></mrow><mo>&#175;</mo></mover>');
  s = s.replace(/\\bar\{([^}]+)\}/g, '<mover accent="false"><mrow><mi>$1</mi></mrow><mo>&#175;</mo></mover>');
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '<mroot><mrow>$2</mrow><mrow>$1</mrow></mroot>');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  s = s.replace(/\\sum_\{([^}]+)\}\^\{([^}]+)\}/g, '<msubsup><mo>&#8721;</mo><mrow>$1</mrow><mrow>$2</mrow></msubsup>');
  s = s.replace(/\\times/g, '<mo>&#215;</mo>');
  s = s.replace(/\\cdot/g, '<mo>&#8901;</mo>');
  s = s.replace(/\\approx/g, '<mo>&#8776;</mo>');
  s = s.replace(/\\le/g, '<mo>&#8804;</mo>');
  s = s.replace(/\\ge/g, '<mo>&#8805;</mo>');
  s = s.replace(/\\neq/g, '<mo>&#8800;</mo>');
  s = s.replace(/\\iff/g, '<mo>&#8660;</mo>');
  s = s.replace(/\\implies/g, '<mo>&#8658;</mo>');
  s = s.replace(/\\text\{([^}]+)\}/g, '<mtext>$1</mtext>');

  s = s.replace(/([a-zA-Z]+)/g, (match) => {
    if (['mi', 'mo', 'mrow', 'mfrac', 'msqrt', 'mroot', 'mover', 'munder', 'mtext', 'class', 'accent', 'true', 'false'].includes(match)) {
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
const STORAGE_KEY = 'toan12_bai19_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Định Lý Bayes 12',
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

  const arenaProg = document.getElementById('arenaProgress');
  const arenaSc = document.getElementById('arenaScore');
  const totalAnswered = Object.keys(appState.answered).length;
  if (arenaProg) arenaProg.textContent = `${totalAnswered}/10`;
  if (arenaSc) arenaSc.textContent = `${appState.xp} XP`;

  const certName = document.getElementById('certStudentName');
  const certXP = document.getElementById('certXP');
  const certRank = document.getElementById('certRank');
  if (certName) certName.textContent = appState.userName;
  if (certXP) certXP.textContent = `${appState.xp} XP`;
  if (certRank) {
    if (appState.xp >= 180) certRank.textContent = 'Xuất Sắc (Đại Sư Bayes)';
    else if (appState.xp >= 140) certRank.textContent = 'Giỏi (Chuyên Gia Toàn Phần)';
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

  if (answeredCount >= 1 && !appState.badges[0]) {
    appState.badges[0] = true;
    sounds.playLevelUp();
  }
  if (appState.streak >= 3 && !appState.badges[1]) {
    appState.badges[1] = true;
    sounds.playLevelUp();
  }
  if (appState.xp >= 160 && !appState.badges[3]) {
    appState.badges[3] = true;
    sounds.playLevelUp();
  }
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

// --- 10 ARENA QUIZ QUESTIONS (SGK PP. 77–78) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1 (Định lý SGK trang 72): Công thức xác suất toàn phần',
    pts: 20,
    question: 'Cho hai biến cố $A$ và $B$ thoả mãn $0 < P(A) < 1$. Công thức xác suất toàn phần của biến cố $B$ là:',
    options: [
      { text: '$P(B) = P(A) \\cdot P(B|A) + P(\\overline{A}) \\cdot P(B|\\overline{A})$', correct: true },
      { text: '$P(B) = P(A) \\cdot P(A|B) + P(\\overline{A}) \\cdot P(\\overline{A}|B)$', correct: false },
      { text: '$P(B) = P(A) + P(B|A) - P(AB)$', correct: false },
      { text: '$P(B) = P(A) \\cdot P(B)$', correct: false }
    ],
    explanation: 'Theo SGK trang 72: Biến cố $B$ được phân tách thành hai trường hợp xung khắc $B = AB \\cup \\overline{A}B$. Do đó $P(B) = P(AB) + P(\\overline{A}B) = P(A) \\cdot P(B|A) + P(\\overline{A}) \\cdot P(B|\\overline{A})$.'
  },
  {
    id: 2,
    title: 'Câu 2 (Định lý SGK trang 75): Công thức Bayes',
    pts: 20,
    question: 'Cho hai biến cố $A, B$ thoả mãn $0 < P(A) < 1$ và $P(B) > 0$. Công thức Bayes xác định xác suất hậu nghiệm $P(A|B)$ là:',
    options: [
      { text: '$P(A|B) = \\frac{P(B) \\cdot P(B|A)}{P(A)}$', correct: false },
      { text: '$P(A|B) = \\frac{P(A) \\cdot P(A|B)}{P(B)}$', correct: false },
      { text: '$P(A|B) = \\frac{P(A) \\cdot P(B|A)}{P(A) \\cdot P(B|A) + P(\\overline{A}) \\cdot P(B|\\overline{A})}$', correct: true },
      { text: '$P(A|B) = \\frac{P(A) + P(B|A)}{P(B)}$', correct: false }
    ],
    explanation: 'Theo công thức Bayes (SGK trang 75): $P(A|B) = \\frac{P(AB)}{P(B)} = \\frac{P(A) \\cdot P(B|A)}{P(A) \\cdot P(B|A) + P(\\overline{A}) \\cdot P(B|\\overline{A})}$.'
  },
  {
    id: 3,
    title: 'Câu 3 (Ví dụ 1 SGK trang 73): Đi làm bằng xe máy hoặc xe buýt',
    pts: 20,
    question: 'Ông An đi làm: xác suất đi xe máy Thứ Ba là $P(A) = 0.4$. Nếu Thứ Ba đi xe máy thì Thứ Tư đi xe máy là $P(B|A) = 0.3$. Nếu Thứ Ba đi xe buýt thì Thứ Tư đi xe máy là $P(B|\\overline{A}) = 0.4$. Xác suất Thứ Tư ông An đi làm bằng xe máy là:',
    options: [
      { text: '$0.30$', correct: false },
      { text: '$0.36$', correct: true },
      { text: '$0.40$', correct: false },
      { text: '$0.70$', correct: false }
    ],
    explanation: 'Áp dụng công thức xác suất toàn phần: $P(B) = P(A) \\cdot P(B|A) + P(\\overline{A}) \\cdot P(B|\\overline{A}) = 0.4 \\times 0.3 + (1 - 0.4) \\times 0.4 = 0.12 + 0.6 \\times 0.4 = 0.12 + 0.24 = 0.36$.'
  },
  {
    id: 4,
    title: 'Câu 4 (Bài 6.8 SGK trang 78): Chuyển thỏ giữa hai chuồng',
    pts: 20,
    question: 'Chuồng I có 5 thỏ đen, 10 thỏ trắng. Chuồng II có 7 thỏ đen, 3 thỏ trắng. Lấy ngẫu nhiên 1 thỏ từ chuồng II bỏ vào chuồng I, rồi lấy ngẫu nhiên 1 thỏ từ chuồng I. Xác suất lấy được thỏ trắng từ chuồng I là:',
    options: [
      { text: '$\\frac{103}{160} = 0.64375$', correct: true },
      { text: '$\\frac{10}{15} = \\frac{2}{3}$', correct: false },
      { text: '$\\frac{11}{16}$', correct: false },
      { text: '$\\frac{3}{10} = 0.3$', correct: false }
    ],
    explanation: 'Gọi $A$ là biến cố "Lấy được thỏ trắng từ chuồng II", $P(A) = \\frac{3}{10} = 0.3$. Khi đó chuồng I có 16 con (11 trắng, 5 đen) nên $P(B|A) = \\frac{11}{16}$. Nếu lấy thỏ đen từ II ($P(\\overline{A}) = 0.7$) thì chuồng I có 16 con (10 trắng, 6 đen) nên $P(B|\\overline{A}) = \\frac{10}{16}$. Xác suất toàn phần: $P(B) = 0.3 \\times \\frac{11}{16} + 0.7 \\times \\frac{10}{16} = \\frac{3.3 + 7}{16} = \\frac{10.3}{16} = \\frac{103}{160} = 0.64375$.'
  },
  {
    id: 5,
    title: 'Câu 5 (Bài 6.9a SGK trang 78): Tỉ lệ đóng dấu kiểm định OTK',
    pts: 20,
    question: 'Linh kiện đạt chuẩn 80%. Nếu đạt chuẩn thì có xác suất 0.99 được đóng dấu OTK. Nếu không đạt chuẩn thì có xác suất 0.95 không được đóng dấu OTK (tức 0.05 được đóng dấu). Xác suất để linh kiện được đóng dấu OTK là:',
    options: [
      { text: '$0.792$', correct: false },
      { text: '$0.800$', correct: false },
      { text: '$0.802$', correct: true },
      { text: '$0.950$', correct: false }
    ],
    explanation: 'Áp dụng công thức xác suất toàn phần: $P(OTK) = P(A) \\cdot P(OTK|A) + P(\\overline{A}) \\cdot P(OTK|\\overline{A}) = 0.8 \\times 0.99 + 0.2 \\times (1 - 0.95) = 0.792 + 0.2 \\times 0.05 = 0.792 + 0.010 = 0.802$.'
  },
  {
    id: 6,
    title: 'Câu 6 (Bài 6.9b SGK trang 78): Linh kiện không được đóng dấu OTK',
    pts: 20,
    question: 'Tiếp tục bài toán kiểm tra linh kiện trên: Xác suất để một linh kiện chọn ngẫu nhiên không được đóng dấu OTK là:',
    options: [
      { text: '$0.050$', correct: false },
      { text: '$0.198$', correct: true },
      { text: '$0.200$', correct: false },
      { text: '$0.010$', correct: false }
    ],
    explanation: 'Xác suất biến cố đối: $P(\\overline{OTK}) = 1 - P(OTK) = 1 - 0.802 = 0.198$. Hoặc tính qua cây xác suất: $0.8 \\times 0.01 + 0.2 \\times 0.95 = 0.008 + 0.190 = 0.198$.'
  },
  {
    id: 7,
    title: 'Câu 7 (Bài 6.10a SGK trang 78): Đội bắn súng giành Huy chương Vàng',
    pts: 20,
    question: 'Đội I có 5 VĐV (xác suất đạt HCV là 0.65). Đội II có 7 VĐV (xác suất đạt HCV là 0.55). Chọn ngẫu nhiên 1 VĐV trong 12 VĐV. Xác suất VĐV này đạt HCV là:',
    options: [
      { text: '$0.6000$', correct: false },
      { text: '$0.5500$', correct: false },
      { text: '$0.6500$', correct: false },
      { text: '$\\frac{7.1}{12} \\approx 0.5917$', correct: true }
    ],
    explanation: 'Xác suất chọn VĐV Đội I là $\\frac{5}{12}$, Đội II là $\\frac{7}{12}$. Theo công thức toàn phần: $P(H) = \\frac{5}{12} \\times 0.65 + \\frac{7}{12} \\times 0.55 = \\frac{3.25 + 3.85}{12} = \\frac{7.1}{12} \\approx 0.5917$.'
  },
  {
    id: 8,
    title: 'Câu 8 (Bài 6.10b SGK trang 78): Xác định thành viên Đội I qua công thức Bayes',
    pts: 20,
    question: 'Tiếp tục bài 6.10: Giả sử VĐV được chọn đạt Huy chương Vàng. Tính xác suất để VĐV này thuộc Đội I:',
    options: [
      { text: '$\\frac{65}{142} \\approx 0.4577$', correct: true },
      { text: '$\\frac{5}{12} \\approx 0.4167$', correct: false },
      { text: '$\\frac{77}{142} \\approx 0.5423$', correct: false },
      { text: '$0.6500$', correct: false }
    ],
    explanation: 'Theo công thức Bayes: $P(\\text{Đội I}|H) = \\frac{P(\\text{Đội I}) \\cdot P(H|\\text{Đội I})}{P(H)} = \\frac{\\frac{5}{12} \\times 0.65}{\\frac{7.1}{12}} = \\frac{3.25}{7.1} = \\frac{325}{710} = \\frac{65}{142} \\approx 0.4577$.'
  },
  {
    id: 9,
    title: 'Câu 9 (Bài 6.11a SGK trang 78): Bộ lọc thư rác (Spam Filter)',
    pts: 20,
    question: 'Tỉ lệ thư rác là 3% ($P(S) = 0.03$). Thư rác bị chặn với xác suất 0.95. Thư đúng (không rác) bị chặn với xác suất 0.01. Chọn 1 thư bị chặn, xác suất đó là thư rác bằng:',
    options: [
      { text: '$95.0\\%$', correct: false },
      { text: '$50.0\\%$', correct: false },
      { text: '$\\frac{285}{382} \\approx 74.61\\%$', correct: true },
      { text: '$28.5\\%$', correct: false }
    ],
    explanation: 'Xác suất thư bị chặn: $P(B) = 0.03 \\times 0.95 + 0.97 \\times 0.01 = 0.0285 + 0.0097 = 0.0382$. Theo công thức Bayes: $P(S|B) = \\frac{0.03 \\times 0.95}{0.0382} = \\frac{0.0285}{0.0382} = \\frac{285}{382} \\approx 74.61\\%$.'
  },
  {
    id: 10,
    title: 'Câu 10 (Chẩn đoán y khoa Bayes): Nghịch lý xét nghiệm bệnh hiếm',
    pts: 20,
    question: 'Một căn bệnh hiểm nghèo có tỉ lệ mắc trong cộng đồng là 1% ($P(B) = 0.01$). Xét nghiệm y khoa có độ nhạy 95% và tỉ lệ dương tính giả là 2%. Một người có kết quả xét nghiệm dương tính, xác suất người này thực sự mắc bệnh là:',
    options: [
      { text: '$95.0\\%$', correct: false },
      { text: '$\\frac{0.0095}{0.0293} \\approx 32.42\\%$', correct: true },
      { text: '$50.0\\%$', correct: false },
      { text: '$1.0\\%$', correct: false }
    ],
    explanation: 'Xác suất kết quả dương tính: $P(+) = 0.01 \\times 0.95 + 0.99 \\times 0.02 = 0.0095 + 0.0198 = 0.0293$. Theo định lý Bayes: $P(B|+) = \\frac{0.0095}{0.0293} \\approx 32.42\\%$. Mặc dù độ nhạy rất cao (95%), nhưng vì bệnh hiếm nên số ca dương tính giả trong nhóm 99% người khoẻ lấn át, khiến xác suất mắc bệnh thực tế chỉ khoảng 32.4%!'
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

// --- LAB 1: CÂY XÁC SUẤT ĐỘNG & XÁC SUẤT TOÀN PHẦN ---
let lab1Interacted = false;

function initLab1() {
  const canvas = document.getElementById('lab1Canvas');
  const sliderPA = document.getElementById('lab1SliderPA');
  const sliderPBA = document.getElementById('lab1SliderPBA');
  const sliderPBNotA = document.getElementById('lab1SliderPBNotA');
  const valPA = document.getElementById('lab1ValPA');
  const valPBA = document.getElementById('lab1ValPBA');
  const valPBNotA = document.getElementById('lab1ValPBNotA');
  const output = document.getElementById('lab1Output');

  if (!canvas || !sliderPA || !sliderPBA || !sliderPBNotA) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const pA = parseFloat(sliderPA.value);
    const pNotA = 1 - pA;
    const pBA = parseFloat(sliderPBA.value);
    const pNotBA = 1 - pBA;
    const pBNotA = parseFloat(sliderPBNotA.value);
    const pNotBNotA = 1 - pBNotA;

    if (valPA) valPA.textContent = pA.toFixed(2);
    if (valPBA) valPBA.textContent = pBA.toFixed(2);
    if (valPBNotA) valPBNotA.textContent = pBNotA.toFixed(2);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const rootX = 40;
    const rootY = canvas.height / 2;
    const midX = 220;
    const midY1 = 70;
    const midY2 = 210;
    const leafX = 420;

    // Branches level 1: Root -> A and Root -> Not A
    ctx.lineWidth = 2.5;

    // Root to A
    ctx.strokeStyle = '#f59e0b';
    ctx.beginPath(); ctx.moveTo(rootX, rootY); ctx.lineTo(midX, midY1); ctx.stroke();
    // Root to Not A
    ctx.strokeStyle = '#8b5cf6';
    ctx.beginPath(); ctx.moveTo(rootX, rootY); ctx.lineTo(midX, midY2); ctx.stroke();

    // Branches level 2: A -> B and A -> Not B
    ctx.strokeStyle = '#10b981';
    ctx.beginPath(); ctx.moveTo(midX, midY1); ctx.lineTo(leafX, 35); ctx.stroke();
    ctx.strokeStyle = '#475569';
    ctx.beginPath(); ctx.moveTo(midX, midY1); ctx.lineTo(leafX, 105); ctx.stroke();

    // Branches level 2: Not A -> B and Not A -> Not B
    ctx.strokeStyle = '#10b981';
    ctx.beginPath(); ctx.moveTo(midX, midY2); ctx.lineTo(leafX, 175); ctx.stroke();
    ctx.strokeStyle = '#475569';
    ctx.beginPath(); ctx.moveTo(midX, midY2); ctx.lineTo(leafX, 245); ctx.stroke();

    // Draw Nodes
    function drawNode(x, y, text, color) {
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.arc(x, y, 14, 0, 2 * Math.PI); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y);
    }

    drawNode(rootX, rootY, 'Ω', '#3b82f6');
    drawNode(midX, midY1, 'A', '#f59e0b');
    drawNode(midX, midY2, 'Ā', '#8b5cf6');

    drawNode(leafX, 35, 'B', '#10b981');
    drawNode(leafX, 105, 'B̄', '#64748b');
    drawNode(leafX, 175, 'B', '#10b981');
    drawNode(leafX, 245, 'B̄', '#64748b');

    // Label on branches
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#f59e0b'; ctx.fillText(`P(A) = ${pA.toFixed(2)}`, (rootX + midX) / 2 - 25, (rootY + midY1) / 2 - 8);
    ctx.fillStyle = '#c084fc'; ctx.fillText(`P(Ā) = ${pNotA.toFixed(2)}`, (rootX + midX) / 2 - 25, (rootY + midY2) / 2 + 15);

    ctx.fillStyle = '#10b981'; ctx.fillText(`P(B|A) = ${pBA.toFixed(2)}`, (midX + leafX) / 2 - 20, 50);
    ctx.fillStyle = '#94a3b8'; ctx.fillText(`P(B̄|A) = ${pNotBA.toFixed(2)}`, (midX + leafX) / 2 - 20, 92);
    ctx.fillStyle = '#10b981'; ctx.fillText(`P(B|Ā) = ${pBNotA.toFixed(2)}`, (midX + leafX) / 2 - 20, 190);
    ctx.fillStyle = '#94a3b8'; ctx.fillText(`P(B̄|Ā) = ${pNotBNotA.toFixed(2)}`, (midX + leafX) / 2 - 20, 232);

    // Leaf product probabilities
    const pAB = pA * pBA;
    const pANotB = pA * pNotBA;
    const pNotAB = pNotA * pBNotA;
    const pNotANotB = pNotA * pNotBNotA;
    const pTotalB = pAB + pNotAB;

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`P(AB) = ${pAB.toFixed(4)}`, leafX + 20, 35);
    ctx.fillText(`P(AB̄) = ${pANotB.toFixed(4)}`, leafX + 20, 105);
    ctx.fillText(`P(ĀB) = ${pNotAB.toFixed(4)}`, leafX + 20, 175);
    ctx.fillText(`P(ĀB̄) = ${pNotANotB.toFixed(4)}`, leafX + 20, 245);

    if (output) {
      output.innerHTML = `
        <div style="line-height: 1.6;">
          <div><strong>1. Công thức nhân xác suất từng nhánh cây:</strong></div>
          <div style="margin-left: 15px; color: #94a3b8;">
            • Nhánh $A \\to B$: $P(AB) = P(A) \\cdot P(B|A) = ${pA.toFixed(2)} \\times ${pBA.toFixed(2)} = ${pAB.toFixed(4)}$<br>
            • Nhánh $\\overline{A} \\to B$: $P(\\overline{A}B) = P(\\overline{A}) \\cdot P(B|\\overline{A}) = ${pNotA.toFixed(2)} \\times ${pBNotA.toFixed(2)} = ${pNotAB.toFixed(4)}$
          </div>
          <div><strong>2. Xác suất toàn phần của biến cố $B$:</strong></div>
          <div style="margin-left: 15px; font-weight: bold; color: #10b981;">
            $$P(B) = P(AB) + P(\\overline{A}B) = ${pAB.toFixed(4)} + ${pNotAB.toFixed(4)} = ${pTotalB.toFixed(4)} \\; (${(pTotalB * 100).toFixed(2)}\\%)$$
          </div>
        </div>
      `;
      renderMathInTree(output);
    }

    lab1Interacted = true;
    checkLabBadge();
  }

  sliderPA.oninput = () => { sounds.playClick(); draw(); };
  sliderPBA.oninput = () => { sounds.playClick(); draw(); };
  sliderPBNotA.oninput = () => { sounds.playClick(); draw(); };

  draw();
}

// --- LAB 2: TRẠM CHẨN ĐOÁN Y KHOA & LỌC SPAM BAYES ---
let lab2Interacted = false;

function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  const sliderPDis = document.getElementById('lab2SliderPDis');
  const sliderSens = document.getElementById('lab2SliderSens');
  const sliderFalsePos = document.getElementById('lab2SliderFalsePos');
  const valPDis = document.getElementById('lab2ValPDis');
  const valSens = document.getElementById('lab2ValSens');
  const valFalsePos = document.getElementById('lab2ValFalsePos');
  const output = document.getElementById('lab2Output');

  if (!canvas || !sliderPDis || !sliderSens || !sliderFalsePos) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    const pDisease = parseFloat(sliderPDis.value) / 100;
    const pSensitivity = parseFloat(sliderSens.value) / 100;
    const pFalsePos = parseFloat(sliderFalsePos.value) / 100;

    if (valPDis) valPDis.textContent = `${sliderPDis.value}%`;
    if (valSens) valSens.textContent = `${sliderSens.value}%`;
    if (valFalsePos) valFalsePos.textContent = `${sliderFalsePos.value}%`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Population 10,000 dots simulation (100 columns x 100 rows)
    const totalPop = 10000;
    const numSick = Math.round(totalPop * pDisease);
    const numHealthy = totalPop - numSick;

    const sickTruePos = Math.round(numSick * pSensitivity);
    const sickFalseNeg = numSick - sickTruePos;

    const healthyFalsePos = Math.round(numHealthy * pFalsePos);
    const healthyTrueNeg = numHealthy - healthyFalsePos;

    const totalPositives = sickTruePos + healthyFalsePos;
    const bayesProb = totalPositives > 0 ? (sickTruePos / totalPositives) : 0;

    // Visual Bar representations
    const barW = canvas.width - 60;
    const barH = 50;
    const startX = 30;

    // Bar 1: Entire population breakdown (Sick vs Healthy)
    ctx.font = '12px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('1. Phân bố 10,000 người trong cộng đồng:', startX, 25);

    const sickW = (numSick / totalPop) * barW;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(startX, 35, Math.max(3, sickW), barH);
    ctx.fillStyle = '#10b981';
    ctx.fillRect(startX + Math.max(3, sickW), 35, barW - Math.max(3, sickW), barH);

    ctx.fillStyle = '#f8fafc';
    ctx.fillText(`Mắc bệnh: ${numSick} (${(pDisease * 100).toFixed(1)}%)`, startX + 5, 65);
    ctx.fillText(`Khoẻ mạnh: ${numHealthy} (${((1 - pDisease) * 100).toFixed(1)}%)`, startX + Math.max(3, sickW) + 15, 65);

    // Bar 2: Group of people with Positive Result (+)
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('2. Nhóm người nhận kết quả DƯƠNG TÍNH (+):', startX, 120);

    const truePosW = totalPositives > 0 ? (sickTruePos / totalPositives) * barW : 0;
    const falsePosW = barW - truePosW;

    ctx.fillStyle = '#ef4444'; // Really sick
    ctx.fillRect(startX, 130, truePosW, barH);
    ctx.fillStyle = '#f59e0b'; // False positive (Healthy but positive)
    ctx.fillRect(startX + truePosW, 130, falsePosW, barH);

    ctx.fillStyle = '#ffffff';
    if (truePosW > 30) {
      ctx.fillText(`Thực sự Bệnh: ${sickTruePos}`, startX + 8, 160);
    }
    ctx.fillText(`Dương tính giả (Khoẻ): ${healthyFalsePos}`, startX + truePosW + 10, 160);

    // Legend
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px sans-serif';
    ctx.fillText('🔴 Người mắc bệnh thật', startX, 215);
    ctx.fillText('🟡 Người khoẻ bị dương tính giả', startX + 160, 215);
    ctx.fillText('🟢 Người khoẻ bình thường', startX + 340, 215);

    if (output) {
      output.innerHTML = `
        <div style="line-height: 1.6;">
          <div><strong>1. Thống kê số lượng trên 10,000 người:</strong></div>
          <div style="margin-left: 15px; color: #94a3b8;">
            • Thật sự mắc bệnh & Dương tính: <strong>${sickTruePos}</strong> người.<br>
            • Khoẻ mạnh nhưng nhận Dương tính giả: <strong>${healthyFalsePos}</strong> người.<br>
            • Tổng số người nhận kết quả Dương tính (+): <strong>${totalPositives}</strong> người.
          </div>
          <div><strong>2. Định lý Bayes: Xác suất thực sự mắc bệnh khi nhận kết quả (+):</strong></div>
          <div style="margin-left: 15px; font-size: 1.05rem; font-weight: bold; color: #f59e0b;">
            $$P(\\text{Bệnh}|+) = \\frac{P(\\text{Bệnh}) \\cdot P(+|\\text{Bệnh})}{P(+)} = \\frac{${sickTruePos}}{${totalPositives}} \\approx ${(bayesProb * 100).toFixed(2)}\\%$$
          </div>
          <div style="margin-top: 4px; color: #38bdf8;">
            💡 <strong>Nghịch lý nhận thức:</strong> Dù xét nghiệm có độ nhạy rất cao (${(pSensitivity * 100).toFixed(0)}%), khi bệnh hiếm thì xác suất thực sự mắc bệnh chỉ khoảng <span style="color: #f59e0b; font-weight: bold;">${(bayesProb * 100).toFixed(1)}%</span>! Đó là lý do bác sĩ luôn chỉ định xét nghiệm lần 2 để khẳng định.
          </div>
        </div>
      `;
      renderMathInTree(output);
    }

    lab2Interacted = true;
    checkLabBadge();
  }

  sliderPDis.oninput = () => { sounds.playClick(); draw(); };
  sliderSens.oninput = () => { sounds.playClick(); draw(); };
  sliderFalsePos.oninput = () => { sounds.playClick(); draw(); };

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
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình Bài 19 không?')) {
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

  renderMathInTree(document.body);
});
