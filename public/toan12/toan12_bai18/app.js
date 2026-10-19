// ==========================================
// TOÁN 12 - CHƯƠNG VI: BÀI 18: XÁC SUẤT CÓ ĐIỀU KIỆN
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
  s = s.replace(/\\overline\{([^}]+)\}/g, '<mover accent="false"><mrow><mi>$1</mi></mrow><mo>&#175;</mo></mover>');
  s = s.replace(/\\bar\{([^}]+)\}/g, '<mover accent="false"><mrow><mi>$1</mi></mrow><mo>&#175;</mo></mover>');
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  s = s.replace(/\\sqrt\[([^\]]+)\]\{([^}]+)\}/g, '<mroot><mrow>$2</mrow><mrow>$1</mrow></mroot>');
  s = s.replace(/\\sqrt\{([^}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');
  s = s.replace(/\\cap/g, '<mo>&#8745;</mo>');
  s = s.replace(/\\cup/g, '<mo>&#8746;</mo>');
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
const STORAGE_KEY = 'toan12_bai18_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Xác Suất 12',
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
    if (appState.xp >= 180) certRank.textContent = 'Xuất Sắc (Thủ Khoa Xác Suất)';
    else if (appState.xp >= 140) certRank.textContent = 'Giỏi (Đại Sư Dữ Liệu)';
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

// --- 10 ARENA QUIZ QUESTIONS (SGK PP. 70–71) ---
const quizData = [
  {
    id: 1,
    title: 'Câu 1 (Định nghĩa SGK trang 65): Công thức xác suất có điều kiện',
    pts: 20,
    question: 'Cho hai biến cố $A$ và $B$ bất kì với $P(B) > 0$. Công thức tính xác suất của $A$ với điều kiện $B$ là:',
    options: [
      { text: '$P(A|B) = \\frac{P(AB)}{P(B)}$', correct: true },
      { text: '$P(A|B) = \\frac{P(AB)}{P(A)}$', correct: false },
      { text: '$P(A|B) = P(A) \\cdot P(B)$', correct: false },
      { text: '$P(A|B) = P(A) + P(B) - P(AB)$', correct: false }
    ],
    explanation: 'Theo định nghĩa SGK trang 65: Xác suất của biến cố $A$ với điều kiện $B$ ($P(B) > 0$) được xác định bởi công thức $P(A|B) = \\frac{P(AB)}{P(B)}$.'
  },
  {
    id: 2,
    title: 'Câu 2 (Bài 6.1 SGK trang 70): Rút thẻ số chẵn',
    pts: 20,
    question: 'Một hộp đựng 20 tấm thẻ đánh số từ 1 đến 20. Rút ngẫu nhiên một thẻ, biết rằng thẻ rút ra mang số chẵn. Xác suất để rút được tấm thẻ số 10 là:',
    options: [
      { text: '$\\frac{1}{20} = 0.05$', correct: false },
      { text: '$\\frac{1}{10} = 0.1$', correct: true },
      { text: '$\\frac{1}{2} = 0.5$', correct: false },
      { text: '$\\frac{10}{20} = 0.5$', correct: false }
    ],
    explanation: 'Gọi $B$ là biến cố "Rút được thẻ số chẵn". Tập các số chẵn là $\\{2, 4, 6, 8, 10, 12, 14, 16, 18, 20\\}$ gồm $n(B) = 10$ phần tử đồng khả năng. Biến cố $A$ là "Rút được thẻ số 10" thì $AB$ có duy nhất 1 kết quả. Vậy $P(A|B) = \\frac{n(AB)}{n(B)} = \\frac{1}{10} = 0.1$.'
  },
  {
    id: 3,
    title: 'Câu 3 (Bài 6.2 SGK trang 70): Tính xác suất đảo',
    pts: 20,
    question: 'Cho hai biến cố $A, B$ thoả mãn $P(A) = 0.2;\\; P(B) = 0.51;\\; P(B|A) = 0.8$. Giá trị của $P(A|B)$ bằng:',
    options: [
      { text: '$\\frac{8}{51}$', correct: false },
      { text: '$\\frac{2}{51}$', correct: false },
      { text: '$\\frac{16}{51}$', correct: true },
      { text: '$\\frac{4}{17}$', correct: false }
    ],
    explanation: 'Ta có $P(AB) = P(A) \\cdot P(B|A) = 0.2 \\times 0.8 = 0.16$. Do đó xác suất có điều kiện $P(A|B) = \\frac{P(AB)}{P(B)} = \\frac{0.16}{0.51} = \\frac{16}{51}$.'
  },
  {
    id: 4,
    title: 'Câu 4 (Bài 6.3a SGK trang 70): Gieo hai con xúc xắc - Tổng bằng 7',
    pts: 20,
    question: 'Gieo hai con xúc xắc cân đối, đồng chất. Tính xác suất để tổng số chấm xuất hiện bằng 7, nếu biết rằng có ít nhất một con xúc xắc xuất hiện mặt 5 chấm:',
    options: [
      { text: '$\\frac{2}{11}$', correct: true },
      { text: '$\\frac{1}{6}$', correct: false },
      { text: '$\\frac{2}{36}$', correct: false },
      { text: '$\\frac{1}{11}$', correct: false }
    ],
    explanation: 'Biến cố $B$ "Có ít nhất một con xuất hiện mặt 5 chấm" gồm 11 kết quả: $(5; 1), \\dots, (5; 6)$ và $(1; 5), \\dots, (6; 5)$ (trừ trùng $(5; 5)$). Biến cố $A$ "Tổng bằng 7" kết hợp với $B$ gồm 2 kết quả: $(5; 2)$ và $(2; 5)$. Vậy $P(A|B) = \\frac{2}{11}$.'
  },
  {
    id: 5,
    title: 'Câu 5 (Bài 6.3b SGK trang 70): Gieo hai con xúc xắc - Có mặt 5 chấm',
    pts: 20,
    question: 'Gieo hai con xúc xắc cân đối. Tính xác suất để có ít nhất một con xuất hiện mặt 5 chấm, nếu biết rằng tổng số chấm xuất hiện trên hai con bằng 7:',
    options: [
      { text: '$\\frac{1}{2}$', correct: false },
      { text: '$\\frac{1}{11}$', correct: false },
      { text: '$\\frac{1}{4}$', correct: false },
      { text: '$\\frac{1}{3}$', correct: true }
    ],
    explanation: 'Biến cố điều kiện $B$ "Tổng số chấm bằng 7" có 6 kết quả: $(1; 6), (2; 5), (3; 4), (4; 3), (5; 2), (6; 1)$. Trong đó có 2 kết quả chứa mặt 5 chấm là $(2; 5)$ và $(5; 2)$. Vậy $P(A|B) = \\frac{2}{6} = \\frac{1}{3}$.'
  },
  {
    id: 6,
    title: 'Câu 6 (Bài 6.4 SGK trang 70): Tổng số chấm không nhỏ hơn 10',
    pts: 20,
    question: 'Gieo hai con xúc xắc cân đối. Tính xác suất để tổng số chấm không nhỏ hơn 10 (tức $\\ge 10$), nếu biết rằng có ít nhất một con xúc xắc xuất hiện mặt 5 chấm:',
    options: [
      { text: '$\\frac{2}{11}$', correct: false },
      { text: '$\\frac{3}{11}$', correct: true },
      { text: '$\\frac{4}{11}$', correct: false },
      { text: '$\\frac{1}{6}$', correct: false }
    ],
    explanation: 'Có 11 kết quả có ít nhất một con 5 chấm. Trong đó các kết quả có tổng $\\ge 10$ là $(5; 5)$ (tổng 10), $(5; 6)$ (tổng 11), $(6; 5)$ (tổng 11). Có đúng 3 kết quả thoả mãn. Do đó $P = \\frac{3}{11}$.'
  },
  {
    id: 7,
    title: 'Câu 7 (Bài 6.5a SGK trang 70): Hai thí nghiệm liên tiếp cùng thành công',
    pts: 20,
    question: 'An thực hiện hai thí nghiệm liên tiếp. TN1 thành công với xác suất 0.7. Nếu TN1 thành công thì TN2 thành công với xác suất 0.9. Xác suất để cả hai thí nghiệm cùng thành công là:',
    options: [
      { text: '$0.63$', correct: true },
      { text: '$0.70$', correct: false },
      { text: '$0.90$', correct: false },
      { text: '$0.27$', correct: false }
    ],
    explanation: 'Theo công thức nhân xác suất: $P(A_1 A_2) = P(A_1) \\cdot P(A_2|A_1) = 0.7 \\times 0.9 = 0.63$.'
  },
  {
    id: 8,
    title: 'Câu 8 (Bài 6.5b SGK trang 70): Cả hai thí nghiệm đều không thành công',
    pts: 20,
    question: 'Tiếp tục bài toán trên: Biết rằng nếu TN1 không thành công thì TN2 thành công với xác suất 0.4. Xác suất để cả hai thí nghiệm đều không thành công là:',
    options: [
      { text: '$0.12$', correct: false },
      { text: '$0.30$', correct: false },
      { text: '$0.18$', correct: true },
      { text: '$0.07$', correct: false }
    ],
    explanation: 'TN1 không thành công: $P(\\overline{A_1}) = 1 - 0.7 = 0.3$. Khi đó xác suất TN2 không thành công là $P(\\overline{A_2}|\\overline{A_1}) = 1 - 0.4 = 0.6$. Suy ra $P(\\overline{A_1}\\overline{A_2}) = 0.3 \\times 0.6 = 0.18$.'
  },
  {
    id: 9,
    title: 'Câu 9 (Bài 6.6 SGK trang 70): Số kẹo trong túi bí mật',
    pts: 20,
    question: 'Trong túi có 6 chiếc kẹo màu cam và $n$ chiếc kẹo màu vàng. Lấy ngẫu nhiên lần lượt 2 kẹo không trả lại. Biết xác suất lấy được cả hai kẹo màu cam là $\\frac{1}{3}$. Hỏi ban đầu trong túi có bao nhiêu chiếc kẹo?',
    options: [
      { text: '$8$ chiếc', correct: false },
      { text: '$10$ chiếc', correct: true },
      { text: '$12$ chiếc', correct: false },
      { text: '$15$ chiếc', correct: false }
    ],
    explanation: 'Xác suất lấy 2 kẹo cam là: $\\frac{6}{6+n} \\times \\frac{5}{5+n} = \\frac{1}{3} \\iff (n+6)(n+5) = 90 \\iff n^2 + 11n - 60 = 0 \\iff n = 4$ (vì $n > 0$). Vậy tổng số kẹo ban đầu là $6 + 4 = 10$ chiếc.'
  },
  {
    id: 10,
    title: 'Câu 10 (SGK trang 64, 70): Nghịch lý Monty Hall và lời khuyên tối ưu',
    pts: 20,
    question: 'Trong trò chơi "Ô cửa bí mật", sau khi người chơi chọn 1 cửa và người dẫn chương trình mở 1 cửa có con lừa, người chơi nên làm gì để tối ưu khả năng trúng xe hơi?',
    options: [
      { text: 'Giữ nguyên cửa ban đầu, vì hai cửa còn lại xác suất là 50/50', correct: false },
      { text: 'Chọn ngẫu nhiên lại bằng cách tung đồng xu', correct: false },
      { text: 'Giữ nguyên cửa ban đầu vì xác suất trúng là $\\frac{2}{3}$', correct: false },
      { text: 'Nên đổi sang cửa còn lại, vì xác suất trúng xe khi đổi cửa là $\\frac{2}{3} \\approx 66.7\\%$', correct: true }
    ],
    explanation: 'Theo SGK trang 70: $P(E_1) = \\frac{1}{3}$ (xe ở cửa chọn ban đầu), $P(E_2) = \\frac{2}{3}$ (xe ở cửa chưa chọn). Khi người dẫn chương trình mở cửa có lừa, xác suất trúng xe nếu đổi cửa tăng lên $P(E_2|H) = \\frac{2}{3}$, gấp đôi so với giữ nguyên $P(E_1|H) = \\frac{1}{3}$. Lời khuyên tối ưu là luôn ĐỔI CỬA.'
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

// --- LAB 1: MÔ PHỎNG NGHỊCH LÝ MONTY HALL ---
let lab1Interacted = false;
let montyCarDoor = 1;
let montyChosenDoor = null;
let montyRevealedDoor = null;
let montyGameOver = false;

function initLab1() {
  const doors = [document.getElementById('door1'), document.getElementById('door2'), document.getElementById('door3')];
  const btnStay = document.getElementById('btnMontyStay');
  const btnSwitch = document.getElementById('btnMontySwitch');
  const btnReset = document.getElementById('btnMontyReset');
  const btnSim = document.getElementById('btnMontySim');
  const output = document.getElementById('lab1Output');

  function resetGame() {
    montyCarDoor = Math.floor(Math.random() * 3) + 1;
    montyChosenDoor = null;
    montyRevealedDoor = null;
    montyGameOver = false;

    doors.forEach((d, i) => {
      if (d) {
        d.innerHTML = `<span style="font-size: 2.2rem;">🚪</span><span style="font-size: 1rem; margin-top: 8px;">Cửa ${i + 1}</span>`;
        d.style.borderColor = '#6366f1';
        d.style.background = 'rgba(30, 41, 59, 0.9)';
      }
    });

    if (btnStay) btnStay.style.display = 'none';
    if (btnSwitch) btnSwitch.style.display = 'none';
    if (output) {
      output.innerHTML = `Hãy bấm chọn 1 trong 3 cánh cửa để bắt đầu vòng 1!`;
    }
  }

  doors.forEach(d => {
    if (!d) return;
    d.addEventListener('click', () => {
      if (montyChosenDoor !== null || montyGameOver) return;
      sounds.playClick();
      montyChosenDoor = parseInt(d.dataset.door);
      d.style.borderColor = '#f59e0b';
      d.style.background = 'rgba(245, 158, 11, 0.2)';

      // Host reveals goat behind one of the OTHER doors
      const availableToGoat = [1, 2, 3].filter(num => num !== montyChosenDoor && num !== montyCarDoor);
      montyRevealedDoor = availableToGoat[Math.floor(Math.random() * availableToGoat.length)];

      const revealedEl = document.getElementById(`door${montyRevealedDoor}`);
      if (revealedEl) {
        revealedEl.innerHTML = `<span style="font-size: 2.2rem;">🫏</span><span style="font-size: 0.9rem; margin-top: 8px; color: #ef4444;">Con Lừa!</span>`;
        revealedEl.style.borderColor = '#ef4444';
      }

      const otherDoor = [1, 2, 3].find(num => num !== montyChosenDoor && num !== montyRevealedDoor);

      if (btnStay) btnStay.style.display = 'inline-block';
      if (btnSwitch) {
        btnSwitch.style.display = 'inline-block';
        btnSwitch.textContent = `🔄 Đổi sang Cửa ${otherDoor}`;
      }

      if (output) {
        output.innerHTML = `
          <div>Bạn đã chọn <strong>Cửa ${montyChosenDoor}</strong>.</div>
          <div style="color: #ef4444;">Người quản trò vừa mở <strong>Cửa ${montyRevealedDoor}</strong> hé lộ 1 chú lừa!</div>
          <div style="color: #10b981; margin-top: 4px;"><strong>Quyết định của bạn:</strong> Giữ nguyên Cửa ${montyChosenDoor} hay Đổi sang Cửa ${otherDoor}?</div>
        `;
      }
    });
  });

  function finishGame(didSwitch) {
    if (montyGameOver) return;
    montyGameOver = true;
    const finalDoor = didSwitch ? [1, 2, 3].find(n => n !== montyChosenDoor && n !== montyRevealedDoor) : montyChosenDoor;
    const isWin = (finalDoor === montyCarDoor);

    if (isWin) {
      sounds.playCorrect();
    } else {
      sounds.playWrong();
    }

    // Reveal all doors
    doors.forEach((d, i) => {
      const doorNum = i + 1;
      if (doorNum === montyCarDoor) {
        d.innerHTML = `<span style="font-size: 2.2rem;">🚗</span><span style="font-size: 0.9rem; margin-top: 8px; color: #10b981; font-weight: bold;">Ô TÔ!</span>`;
        d.style.borderColor = '#10b981';
      } else {
        d.innerHTML = `<span style="font-size: 2.2rem;">🫏</span><span style="font-size: 0.9rem; margin-top: 8px; color: #ef4444;">Con Lừa</span>`;
      }
    });

    if (btnStay) btnStay.style.display = 'none';
    if (btnSwitch) btnSwitch.style.display = 'none';

    if (output) {
      output.innerHTML = `
        <div style="font-size: 1.05rem; font-weight: bold; color: ${isWin ? '#10b981' : '#ef4444'};">
          ${isWin ? '🎉 CHÚC MỪNG! BẠN ĐÃ TRÚNG Ô TÔ!' : '😢 RẤT TIẾC! BẠN ĐÃ CHỌN PHẢI CON LỪA!'}
        </div>
        <div style="margin-top: 6px;">
          Bạn đã quyết định: <strong>${didSwitch ? 'ĐỔI CỬA' : 'GIỮ NGUYÊN'}</strong>. Ô tô thực tế nằm ở Cửa ${montyCarDoor}.
        </div>
        <div style="color: #94a3b8; font-size: 0.9em; margin-top: 4px;">
          Lý thuyết xác suất: $P(\\text{Trúng khi Đổi}) = \\frac{2}{3} \\approx 66.7\\%$, $P(\\text{Trúng khi Giữ}) = \\frac{1}{3} \\approx 33.3\\%$.
        </div>
      `;
      renderMathInTree(output);
    }

    lab1Interacted = true;
    checkLabBadge();
  }

  if (btnStay) btnStay.onclick = () => finishGame(false);
  if (btnSwitch) btnSwitch.onclick = () => finishGame(true);
  if (btnReset) btnReset.onclick = () => { sounds.playClick(); resetGame(); };

  if (btnSim) {
    btnSim.onclick = () => {
      sounds.playTone(800, 'sine', 0.15);
      let switchWins = 0;
      let stayWins = 0;
      const N = 1000;
      for (let i = 0; i < N; i++) {
        const car = Math.floor(Math.random() * 3) + 1;
        const initial = Math.floor(Math.random() * 3) + 1;
        // If stay
        if (initial === car) stayWins++;
        // If switch: always wins when initial choice was wrong
        if (initial !== car) switchWins++;
      }
      if (output) {
        output.innerHTML = `
          <div><strong>⚡ Kết quả mô phỏng Monte Carlo 1,000 ván chơi liên tục:</strong></div>
          <div style="margin: 6px 0; color: #10b981;">
            • <strong>Chiến thuật ĐỔI CỬA:</strong> Thắng ${switchWins}/${N} ván (${(switchWins / 10).toFixed(1)}%) $\\approx \\frac{2}{3}$ (66.7%).
          </div>
          <div style="color: #38bdf8;">
            • <strong>Chiến thuật GIỮ NGUYÊN:</strong> Thắng ${stayWins}/${N} ván (${(stayWins / 10).toFixed(1)}%) $\\approx \\frac{1}{3}$ (33.3%).
          </div>
          <div style="margin-top: 6px; font-weight: bold; color: #f59e0b;">
            👉 Kết luận định lý Bayes: Người chơi ĐỔI CỬA có xác suất chiến thắng GẤP ĐÔI!
          </div>
        `;
        renderMathInTree(output);
      }
      lab1Interacted = true;
      checkLabBadge();
    };
  }

  resetGame();
}

// --- LAB 2: BẢNG DỮ LIỆU 2X2 & BIỂU ĐỒ MOSAIC ---
let lab2Interacted = false;

function initLab2() {
  const canvas = document.getElementById('lab2Canvas');
  const inKT = document.getElementById('cellKT');
  const inKS = document.getElementById('cellKS');
  const inCT = document.getElementById('cellCT');
  const inCS = document.getElementById('cellCS');
  const output = document.getElementById('lab2Output');

  if (!canvas || !inKT || !inKS || !inCT || !inCS) return;
  const ctx = canvas.getContext('2d');

  function calculateAndDraw() {
    const nKT = Math.max(0, parseFloat(inKT.value) || 0); // Không thắt, Tử vong
    const nKS = Math.max(0, parseFloat(inKS.value) || 0); // Không thắt, Sống sót
    const nCT = Math.max(0, parseFloat(inCT.value) || 0); // Có thắt, Tử vong
    const nCS = Math.max(0, parseFloat(inCS.value) || 0); // Có thắt, Sống sót

    const totalK = nKT + nKS; // Tổng không thắt
    const totalC = nCT + nCS; // Tổng có thắt
    const totalT = nKT + nCT; // Tổng tử vong
    const totalS = nKS + nCS; // Tổng sống sót
    const grandTotal = totalK + totalC;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (grandTotal === 0) return;

    // Draw Mosaic Plot
    const w = canvas.width - 60;
    const h = canvas.height - 40;
    const startX = 30;
    const startY = 15;

    const widthK = (totalK / grandTotal) * w;
    const widthC = (totalC / grandTotal) * w;

    // Block 1: Không thắt, Tử vong (Đỏ)
    const hKT = totalK > 0 ? (nKT / totalK) * h : 0;
    ctx.fillStyle = '#ef4444';
    ctx.fillRect(startX, startY + (h - hKT), widthK, hKT);
    ctx.strokeStyle = '#ffffff';
    ctx.strokeRect(startX, startY + (h - hKT), widthK, hKT);

    // Block 2: Không thắt, Sống sót (Xanh xám)
    const hKS = h - hKT;
    ctx.fillStyle = '#475569';
    ctx.fillRect(startX, startY, widthK, hKS);
    ctx.strokeRect(startX, startY, widthK, hKS);

    // Block 3: Có thắt, Tử vong (Hồng nhạt)
    const hCT = totalC > 0 ? (nCT / totalC) * h : 0;
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(startX + widthK, startY + (h - hCT), widthC, hCT);
    ctx.strokeRect(startX + widthK, startY + (h - hCT), widthC, hCT);

    // Block 4: Có thắt, Sống sót (Xanh ngọc an toàn)
    const hCS = h - hCT;
    ctx.fillStyle = '#10b981';
    ctx.fillRect(startX + widthK, startY, widthC, hCS);
    ctx.strokeRect(startX + widthK, startY, widthC, hCS);

    // Labels
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`Không thắt dây: ${((totalK / grandTotal) * 100).toFixed(1)}%`, startX + 5, startY + h + 15);
    ctx.fillText(`Có thắt dây an toàn: ${((totalC / grandTotal) * 100).toFixed(1)}%`, startX + widthK + 5, startY + h + 15);

    // Probability computations
    const pT_given_K = totalK > 0 ? (nKT / totalK) * 100 : 0;
    const pT_given_C = totalC > 0 ? (nCT / totalC) * 100 : 0;
    const pK_given_T = totalT > 0 ? (nKT / totalT) * 100 : 0;
    const riskReduction = pT_given_C > 0 ? (pT_given_K / pT_given_C).toFixed(1) : 'N/A';

    if (output) {
      output.innerHTML = `
        <div style="line-height: 1.6;">
          <div><strong>1. Xác suất tử vong có điều kiện:</strong></div>
          <div style="margin-left: 15px; color: #ef4444;">
            • Khi <strong>Không thắt dây an toàn</strong>: $P(T|K) = \\frac{${nKT}}{${totalK}} \\approx <span style="font-weight: bold;">${pT_given_K.toFixed(3)}\\%</span>$
          </div>
          <div style="margin-left: 15px; color: #10b981;">
            • Khi <strong>Có thắt dây an toàn</strong>: $P(T|C) = \\frac{${nCT}}{${totalC}} \\approx <span style="font-weight: bold;">${pT_given_C.toFixed(3)}\\%</span>$
          </div>
          <div style="margin-top: 4px;"><strong>2. Ý nghĩa phân tích an toàn:</strong> Không thắt dây làm tăng nguy cơ tử vong gấp <strong style="color: #f59e0b;">${riskReduction} lần</strong> khi gặp tai nạn giao thông!</div>
        </div>
      `;
      renderMathInTree(output);
    }

    lab2Interacted = true;
    checkLabBadge();
  }

  [inKT, inKS, inCT, inCS].forEach(input => {
    input.addEventListener('input', () => {
      calculateAndDraw();
    });
  });

  calculateAndDraw();
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
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình Bài 18 không?')) {
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
