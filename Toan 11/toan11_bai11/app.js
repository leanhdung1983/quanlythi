// ================================================================
// BÀI 11: HAI ĐƯỜNG THẲNG SONG SONG - TOÁN 11 KNTT
// Stack: Pure Vanilla JavaScript (ES6+), Web Audio API, KaTeX Offline
// ================================================================

// --- 0. BỘ PARSER CÔNG THỨC TOÁN LATEX SANG NATIVE MATHML (DỰ PHÒNG OFFLINE) ---
const mathSymbols = [
  ["\\mathbb{R}", "<mi class=\"m-bb\">&#8477;</mi>"],
  ["\\mathbb{N}", "<mi class=\"m-bb\">&#8469;</mi>"],
  ["\\mathbb{Z}", "<mi class=\"m-bb\">&#8484;</mi>"],
  ["\\subset", "<mo>&#8834;</mo>"],
  ["\\supset", "<mo>&#8835;</mo>"],
  ["\\subseteq", "<mo>&#8838;</mo>"],
  ["\\in", "<mo>&#8712;</mo>"],
  ["\\notin", "<mo>&#8713;</mo>"],
  ["\\cap", "<mo>&#8745;</mo>"],
  ["\\cup", "<mo>&#8746;</mo>"],
  ["\\emptyset", "<mo>&#8709;</mo>"],
  ["\\Rightarrow", "<mo>&#8658;</mo>"],
  ["\\Leftrightarrow", "<mo>&#8660;</mo>"],
  ["\\approx", "<mo>&#8776;</mo>"],
  ["\\neq", "<mo>&#8800;</mo>"],
  ["\\le", "<mo>&#8804;</mo>"],
  ["\\ge", "<mo>&#8805;</mo>"],
  ["\\alpha", "<mi>&#945;</mi>"],
  ["\\beta", "<mi>&#946;</mi>"],
  ["\\gamma", "<mi>&#947;</mi>"],
  ["\\Delta", "<mi>&#916;</mi>"],
  ["\\delta", "<mi>&#948;</mi>"],
  ["\\parallel", "<mo>&#8741;</mo>"],
  ["\\perp", "<mo>&#8869;</mo>"],
  ["\\ldots", "<mo>&#8230;</mo>"]
];

function tokenizePlainMath(str) {
  if (!str) return '';
  return str.replace(/([a-zA-Z]+|\d+|[^\s\w])/g, (m) => {
    if (/^\d+$/.test(m)) return `<mn>${m}</mn>`;
    if (/^[a-zA-Z]$/.test(m)) return `<mi>${m}</mi>`;
    if (/^[+\-*/=(),.]$/.test(m)) return `<mo>${m}</mo>`;
    return `<mo>${m}</mo>`;
  });
}

function convertLatexToMathMLBody(latex, placeholders = []) {
  if (!latex) return '';
  let s = latex.trim();
  s = s.replace(/\\text\{([^}]+)\}/g, (m, txt) => {
    placeholders.push(`<mtext>${txt}</mtext>`);
    return `\uE000${placeholders.length - 1}\uE001`;
  });
  s = s.replace(/\\overrightarrow\{([^}]+)\}/g, (m, inner) => {
    placeholders.push(`<mover accent="true"><mrow>${tokenizePlainMath(inner)}</mrow><mo>&#8594;</mo></mover>`);
    return `\uE000${placeholders.length - 1}\uE001`;
  });
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, num, den) => {
    placeholders.push(`<mfrac><mrow>${tokenizePlainMath(num)}</mrow><mrow>${tokenizePlainMath(den)}</mrow></mfrac>`);
    return `\uE000${placeholders.length - 1}\uE001`;
  });
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, inner) => {
    placeholders.push(`<msqrt><mrow>${tokenizePlainMath(inner)}</mrow></msqrt>`);
    return `\uE000${placeholders.length - 1}\uE001`;
  });

  for (const [cmd, mathml] of mathSymbols) {
    if (s.includes(cmd)) {
      const idx = placeholders.length;
      placeholders.push(mathml);
      s = s.split(cmd).join(`\uE000${idx}\uE001`);
    }
  }

  const parts = s.split(/(\uE000\d+\uE001)/g);
  let finalOut = '';
  for (const part of parts) {
    if (!part) continue;
    const phMatch = part.match(/^\uE000(\d+)\uE001$/);
    if (phMatch) {
      finalOut += placeholders[parseInt(phMatch[1])];
    } else {
      finalOut += tokenizePlainMath(part);
    }
  }
  return finalOut;
}

function latexToMathML(latex, isBlock = false) {
  if (typeof window !== "undefined" && window.katex && typeof window.katex.renderToString === "function") {
    try {
      return window.katex.renderToString(latex, { throwOnError: false, displayMode: isBlock });
    } catch (e) {}
  }
  const placeholders = [];
  const body = convertLatexToMathMLBody(latex, placeholders);
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${isBlock ? ' display="block"' : ''}><mrow>${body}</mrow></math>`;
}

function formatMathText(str) {
  if (typeof str !== 'string') return str;
  let res = str.replace(/\$\$([\s\S]+?)\$\$/g, (m, c) => `<div class="math-block">${latexToMathML(c, true)}</div>`);
  res = res.replace(/\$([^\$\n]+?)\$/g, (m, c) => `<span class="math-inline">${latexToMathML(c, false)}</span>`);
  return res;
}

function renderMathInTree(root) {
  if (!root) return;
  if (typeof window !== "undefined" && typeof window.renderMathInElement === "function") {
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
      console.warn("KaTeX render error, falling back to MathML:", e);
    }
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.includes('$')) {
      if (node.parentElement && !['SCRIPT', 'STYLE', 'TEXTAREA', 'CODE', 'PRE'].includes(node.parentElement.tagName)) {
        textNodes.push(node);
      }
    }
  }

  for (const tn of textNodes) {
    const parent = tn.parentNode;
    if (!parent) continue;
    const html = formatMathText(tn.nodeValue);
    if (html !== tn.nodeValue) {
      const span = document.createElement('span');
      span.innerHTML = html;
      parent.replaceChild(span, tn);
    }
  }
}

// --- 1. HỆ THỐNG ÂM THANH WEB AUDIO API (OFFLINE 100%) ---
let audioCtx = null;
function getAudioContext() {
  if (!audioCtx) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (AudioContext) {
      audioCtx = new AudioContext();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type, duration, gainVal = 0.1) {
  if (!appState.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {}
}

function playCorrect() {
  playTone(523.25, 'sine', 0.15, 0.15); // C5
  setTimeout(() => playTone(659.25, 'sine', 0.2, 0.15), 100); // E5
  setTimeout(() => playTone(783.99, 'sine', 0.25, 0.15), 200); // G5
}

function playWrong() {
  playTone(220, 'sawtooth', 0.25, 0.15);
  setTimeout(() => playTone(180, 'sawtooth', 0.35, 0.15), 120);
}

function playLevelUp() {
  const notes = [440, 554, 659, 880];
  notes.forEach((f, i) => {
    setTimeout(() => playTone(f, 'triangle', 0.25, 0.2), i * 90);
  });
}

function playFanfare() {
  const fanfare = [
    { f: 523, d: 0.15, t: 0 },
    { f: 659, d: 0.15, t: 150 },
    { f: 783, d: 0.2, t: 300 },
    { f: 1046, d: 0.45, t: 450 }
  ];
  fanfare.forEach(item => {
    setTimeout(() => playTone(item.f, 'triangle', item.d, 0.2), item.t);
  });
}

// --- 2. QUẢN LÝ TRẠNG THÁI (APP STATE) & GAMIFICATION ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Giao Tuyến & Đường Song Song',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false],
  labInteractions: { lab1: false, lab2: false }
};

const avatars = [
  { emoji: '👑', title: 'Chiến Binh Logic' },
  { emoji: '🚀', title: 'Nhà Du Hành Không Gian' },
  { emoji: '🔮', title: 'Phù Thủy Hình Học' },
  { emoji: '📐', title: 'Kiến Trúc Sư 3D' },
  { emoji: '⚡', title: 'Tia Chớp Không Gian' },
  { emoji: '🌟', title: 'Ngôi Sao Toán Học' },
  { emoji: '🧭', title: 'Nhà Thám Hiểm Chiều Sâu' },
  { emoji: '🛡️', title: 'Hiệp Sĩ Thiết Diện' }
];

function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const userTitleEl = document.getElementById('userTitle');
  const avatarEl = document.getElementById('avatarBtn');
  const nameEl = document.getElementById('userNameDisplay');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (userTitleEl) userTitleEl.textContent = appState.userTitle;
  if (avatarEl) avatarEl.textContent = appState.avatar;
  if (nameEl) nameEl.textContent = `${appState.userName} 🌟`;

  // Cập nhật sao (1 - 5 sao dựa trên XP)
  let s = 1;
  if (appState.xp >= 180) s = 5;
  else if (appState.xp >= 140) s = 4;
  else if (appState.xp >= 90) s = 3;
  else if (appState.xp >= 40) s = 2;
  appState.stars = s;
  if (starEl) {
    starEl.textContent = '⭐'.repeat(s) + '☆'.repeat(5 - s);
  }

  // Cập nhật chứng nhận A4
  const certXP = document.getElementById('certTotalXP');
  const certRank = document.getElementById('certRank');
  const certName = document.getElementById('certStudentName');
  if (certXP) certXP.textContent = appState.xp;
  if (certName) certName.textContent = appState.userName;
  if (certRank) {
    if (appState.xp >= 180) certRank.textContent = 'Xuất Sắc (Đại Sư)';
    else if (appState.xp >= 120) certRank.textContent = 'Giỏi (Chiến Binh Cấp Cao)';
    else if (appState.xp >= 60) certRank.textContent = 'Khá (Thám Hiểm Gia)';
    else certRank.textContent = 'Tập Sự';
  }

  // Kiểm tra mở khóa huy hiệu
  checkBadges();
}

function checkBadges() {
  // Huy hiệu 1: Xem bản đồ tri thức
  if (!appState.badges[0]) {
    unlockBadge(0);
  }

  // Huy hiệu 2: Tương tác 2 Labs
  if (!appState.badges[1] && appState.labInteractions.lab1 && appState.labInteractions.lab2) {
    unlockBadge(1);
  }

  // Huy hiệu 3: Chuỗi streak >= 3
  if (!appState.badges[2] && appState.streak >= 3) {
    unlockBadge(2);
  }

  // Huy hiệu 4: Đạt >= 160 XP (>= 8/10 câu đúng)
  if (!appState.badges[3] && appState.xp >= 160) {
    unlockBadge(3);
  }

  // Huy hiệu 5: Đúng trọn vẹn 10/10 câu
  const correctCount = Object.values(appState.answered).filter(a => a.correct).length;
  if (!appState.badges[4] && correctCount === 10) {
    unlockBadge(4);
    playFanfare();
  }
}

function unlockBadge(index) {
  appState.badges[index] = true;
  const bEl = document.getElementById(`badge-${index + 1}`);
  if (bEl) {
    bEl.classList.remove('locked');
    bEl.classList.add('unlocked');
    const st = bEl.querySelector('.badge-status');
    if (st) st.textContent = 'ĐÃ MỞ KHÓA! 🎉';
  }
}

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG SGK (QUIZ DATA) ---
const quizData = [
  {
    id: 1,
    title: "Câu 1: Vị trí tương đối của hai đường thẳng không có điểm chung",
    pts: 20,
    question: "Trong không gian, cho hai đường thẳng phân biệt $a$ và $b$ không có điểm chung. Mệnh đề nào sau đây là đúng nhất?",
    options: [
      { text: "$a$ và $b$ chắc chắn song song với nhau.", correct: false },
      { text: "$a$ và $b$ chắc chắn chéo nhau.", correct: false },
      { text: "$a$ và $b$ có thể song song hoặc chéo nhau.", correct: true },
      { text: "$a$ và $b$ cắt nhau tại vô cực.", correct: false }
    ],
    explanation: "Theo định nghĩa vị trí tương đối trong không gian (SGK Bài 11), hai đường thẳng không có điểm chung có thể cùng thuộc một mặt phẳng (khi đó chúng song song) hoặc không cùng thuộc bất kì mặt phẳng nào (khi đó chúng chéo nhau)."
  },
  {
    id: 2,
    title: "Câu 2: Định nghĩa hai đường thẳng chéo nhau (Bài 4.9b SGK)",
    pts: 20,
    question: "Trong không gian, hai đường thẳng $a$ và $b$ được gọi là **chéo nhau** khi và chỉ khi:",
    options: [
      { text: "Chúng không có điểm chung.", correct: false },
      { text: "Chúng không cùng thuộc bất kì một mặt phẳng nào.", correct: true },
      { text: "Chúng nằm trên hai mặt phẳng vuông góc với nhau.", correct: false },
      { text: "Chúng không cắt nhau và không vuông góc với nhau.", correct: false }
    ],
    explanation: "Hai đường thẳng chéo nhau là hai đường thẳng không cùng nằm trong bất kì mặt phẳng nào (không đồng phẳng). Khác với hai đường thẳng song song (phải cùng nằm trong một mặt phẳng)."
  },
  {
    id: 3,
    title: "Câu 3: Tiên đề song song trong không gian",
    pts: 20,
    question: "Cho đường thẳng $d$ và điểm $M \\notin d$. Trong không gian, có bao nhiêu đường thẳng đi qua $M$ và song song với $d$?",
    options: [
      { text: "Vô số đường thẳng.", correct: false },
      { text: "Đúng 1 đường thẳng duy nhất.", correct: true },
      { text: "Đúng 2 đường thẳng phân biệt.", correct: false },
      { text: "Không có đường thẳng nào.", correct: false }
    ],
    explanation: "Theo Tính chất 1 (SGK Bài 11): Trong không gian, qua một điểm không thuộc đường thẳng cho trước, có đúng một đường thẳng song song với đường thẳng đã cho."
  },
  {
    id: 4,
    title: "Câu 4: Tính chất bắc cầu của quan hệ song song",
    pts: 20,
    question: "Cho ba đường thẳng phân biệt $a, b, c$. Biết $a \\parallel c$ và $b \\parallel c$. Mệnh đề nào sau đây đúng?",
    options: [
      { text: "$a \\parallel b$.", correct: true },
      { text: "$a$ và $b$ chéo nhau.", correct: false },
      { text: "$a$ và $b$ cắt nhau.", correct: false },
      { text: "$a \\perp b$.", correct: false }
    ],
    explanation: "Theo Tính chất 2 (SGK Bài 11): Hai đường thẳng phân biệt cùng song song với một đường thẳng thứ ba thì song song với nhau ($a \\parallel c$ và $b \\parallel c \\implies a \\parallel b$)."
  },
  {
    id: 5,
    title: "Câu 5: Cặp đường thẳng chéo nhau trong hình chóp (Bài 4.10 SGK)",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành. Cặp đường thẳng nào sau đây là hai đường thẳng chéo nhau?",
    options: [
      { text: "$AB$ và $CD$.", correct: false },
      { text: "$AC$ và $BD$.", correct: false },
      { text: "$SB$ và $CD$.", correct: true },
      { text: "$SA$ và $SC$.", correct: false }
    ],
    explanation: "$AB \\parallel CD$ (song song trong mặt phẳng đáy); $AC$ cắt $BD$ tại tâm đáy; $SA$ và $SC$ cắt nhau tại đỉnh $S$. Chỉ có cặp $SB$ và $CD$ là không cùng thuộc một mặt phẳng nào, nên $SB$ và $CD$ chéo nhau."
  },
  {
    id: 6,
    title: "Câu 6: Giao tuyến của hai mặt phẳng (SAB) và (SCD) (Ví dụ 4 SGK)",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành. Giao tuyến của hai mặt phẳng $(SAB)$ và $(SCD)$ là:",
    options: [
      { text: "Đường thẳng $SO$ với $O$ là tâm của đáy $ABCD$.", correct: false },
      { text: "Đường thẳng $d$ đi qua đỉnh $S$ và song song với $AB, CD$.", correct: true },
      { text: "Đoạn thẳng nối trung điểm của $SA$ và $SD$.", correct: false },
      { text: "Đường thẳng đi qua đỉnh $S$ và song song với $AD, BC$.", correct: false }
    ],
    explanation: "Hai mặt phẳng $(SAB)$ và $(SCD)$ có điểm chung $S$, lần lượt chứa hai đường thẳng song song $AB \\parallel CD$. Theo hệ quả định lí ba đường giao tuyến, giao tuyến của chúng là đường thẳng $d$ đi qua $S$ và song song với $AB, CD$."
  },
  {
    id: 7,
    title: "Câu 7: Giao tuyến của hai mặt phẳng (SAD) và (SBC) (Luyện tập 4 SGK)",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành. Giao tuyến của hai mặt phẳng $(SAD)$ và $(SBC)$ là:",
    options: [
      { text: "Đường thẳng đi qua đỉnh $S$ và song song với $AD, BC$.", correct: true },
      { text: "Đường thẳng đi qua đỉnh $S$ và cắt đường chéo $AC$.", correct: false },
      { text: "Đường thẳng nối $S$ với giao điểm của $AB$ và $CD$.", correct: false },
      { text: "Đường thẳng đi qua đỉnh $S$ và vuông góc với đáy.", correct: false }
    ],
    explanation: "Hai mặt phẳng $(SAD)$ và $(SBC)$ có điểm chung $S$, lần lượt chứa hai đường thẳng song song $AD \\parallel BC$. Do đó giao tuyến của chúng là đường thẳng đi qua $S$ và song song với $AD, BC$."
  },
  {
    id: 8,
    title: "Câu 8: Tứ giác tạo bởi 4 trung điểm cạnh bên (Bài 4.11 SGK)",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành. Gọi $M, N, P, Q$ lần lượt là trung điểm của các cạnh bên $SA, SB, SC, SD$. Tứ giác $MNPQ$ là hình gì?",
    options: [
      { text: "Tứ giác có các cạnh đôi một chéo nhau.", correct: false },
      { text: "Hình bình hành.", correct: true },
      { text: "Hình chữ nhật.", correct: false },
      { text: "Hình thoi.", correct: false }
    ],
    explanation: "Trong $\\triangle SAB$, $MN$ là đường trung bình nên $MN \\parallel AB$ và $MN = \\frac{1}{2}AB$. Trong $\\triangle SCD$, $QP$ là đường trung bình nên $QP \\parallel CD$ và $QP = \\frac{1}{2}CD$. Vì $ABCD$ là hình bình hành nên $AB \\parallel CD$ và $AB = CD$. Do đó $MN \\parallel QP$ và $MN = QP$. Vậy tứ giác $MNPQ$ là hình bình hành."
  },
  {
    id: 9,
    title: "Câu 9: Giao tuyến song song trong hình chóp đáy hình thang (Bài 4.13 SGK)",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình thang ($AB \\parallel CD$). Gọi $M$ là trung điểm của cạnh $SD$. Giao tuyến của mặt phẳng $(MAB)$ và mặt phẳng $(SCD)$ là:",
    options: [
      { text: "Đường thẳng đi qua $M$ và song song với $AB, CD$.", correct: true },
      { text: "Đường thẳng nối $M$ và đỉnh $S$.", correct: false },
      { text: "Đường thẳng nối $M$ và điểm $C$.", correct: false },
      { text: "Đường thẳng đi qua $M$ và cắt $AB$.", correct: false }
    ],
    explanation: "Mặt phẳng $(MAB)$ và $(SCD)$ có điểm chung là $M$. Đồng thời $(MAB)$ chứa $AB$ và $(SCD)$ chứa $CD$ với $AB \\parallel CD$. Theo hệ quả, giao tuyến của $(MAB)$ và $(SCD)$ là đường thẳng đi qua $M$ và song song với $AB, CD$."
  },
  {
    id: 10,
    title: "Câu 10: Định lí ba đường giao tuyến kinh điển",
    pts: 20,
    question: "Cho ba mặt phẳng phân biệt $(P), (Q), (R)$ đôi một cắt nhau theo ba giao tuyến phân biệt $d_1 = (P) \\cap (Q)$, $d_2 = (Q) \\cap (R)$, $d_3 = (R) \\cap (P)$. Khẳng định nào sau đây là chính xác nhất?",
    options: [
      { text: "Ba giao tuyến $d_1, d_2, d_3$ luôn luôn đồng quy tại một điểm.", correct: false },
      { text: "Ba giao tuyến $d_1, d_2, d_3$ luôn luôn đôi một song song với nhau.", correct: false },
      { text: "Ba giao tuyến $d_1, d_2, d_3$ hoặc đồng quy tại một điểm, hoặc đôi một song song với nhau.", correct: true },
      { text: "Ba giao tuyến $d_1, d_2, d_3$ luôn luôn đôi một chéo nhau.", correct: false }
    ],
    explanation: "Theo Định lí về ba đường giao tuyến (SGK Bài 11): Nếu ba mặt phẳng phân biệt đôi một cắt nhau theo ba giao tuyến phân biệt thì ba giao tuyến đó hoặc đồng quy hoặc đôi một song song."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  const labels = ['A', 'B', 'C', 'D'];

  quizData.forEach((q, index) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `qCard-${q.id}`;

    // Header
    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `
      <span>${q.title}</span>
      <span class="quiz-badge">+${q.pts} XP</span>
    `;
    card.appendChild(header);

    // Câu hỏi
    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question; // Giữ nguyên $...$ cho KaTeX
    card.appendChild(questionP);

    // Vùng lựa chọn
    const optList = document.createElement('div');
    optList.className = 'quiz-options';

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.dataset.qid = q.id;
      btn.dataset.oid = optIndex;
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;

      btn.addEventListener('click', () => handleQuizAnswer(q.id, optIndex, btn, card));
      optList.appendChild(btn);
    });
    card.appendChild(optList);

    // Hộp giải thích (ẩn ban đầu)
    const explanation = document.createElement('div');
    explanation.className = 'explanation-box';
    explanation.id = `exp-${q.id}`;
    explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;
    card.appendChild(explanation);

    container.appendChild(card);
  });

  // Gọi renderMathInTree một lần duy nhất cho toàn bộ container
  renderMathInTree(container);
}

function handleQuizAnswer(qId, selectedIndex, btn, card) {
  if (appState.answered[qId]) return; // Đã trả lời, khóa câu hỏi

  const q = quizData.find(item => item.id === qId);
  if (!q) return;

  const isCorrect = q.options[selectedIndex].correct;
  const buttons = card.querySelectorAll('.quiz-opt-btn');

  // Khóa tất cả các nút
  buttons.forEach(b => (b.disabled = true));

  if (isCorrect) {
    btn.classList.add('correct');
    appState.xp += q.pts;
    appState.streak += 1;
    appState.answered[qId] = { correct: true };
    playCorrect();
  } else {
    btn.classList.add('wrong');
    appState.streak = 0;
    appState.answered[qId] = { correct: false };
    playWrong();

    // Làm sáng đáp án đúng
    q.options.forEach((opt, idx) => {
      if (opt.correct) {
        buttons[idx].classList.add('correct');
      }
    });
  }

  // Hiển thị hộp giải thích
  const expBox = document.getElementById(`exp-${qId}`);
  if (expBox) {
    expBox.classList.add('show');
    renderMathInTree(expBox);
  }

  // Cập nhật điểm và tiến độ Đấu trường
  const answeredCount = Object.keys(appState.answered).length;
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progEl) progEl.textContent = `${answeredCount}/10`;
  if (scoreEl) scoreEl.textContent = `${appState.xp} XP`;

  updateHUD();
}

// --- 4. PHÒNG THÍ NGHIỆM 1: CHÉO NHAU VS SONG SONG 3D ---
let lab1State = {
  mode: 'skew', // 'skew' | 'parallel'
  rotX: 25 * Math.PI / 180,
  rotY: -35 * Math.PI / 180,
  zoom: 1.0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  showPlanes: true,
  autoRotate: false
};

function initLab1() {
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const btnSkew = document.getElementById('btnModeSkew');
  const btnParallel = document.getElementById('btnModeParallel');
  const btnReset = document.getElementById('btnResetRot1');
  const chkPlanes = document.getElementById('chkShowPlanes1');
  const chkAuto = document.getElementById('chkAutoRotate1');
  const statusBadge = document.getElementById('lab1StatusBadge');
  const descEl = document.getElementById('lab1Description');

  if (btnSkew) {
    btnSkew.addEventListener('click', () => {
      lab1State.mode = 'skew';
      btnSkew.classList.add('active');
      btnParallel.classList.remove('active');
      if (statusBadge) statusBadge.textContent = 'Đang xem: Hai đường thẳng chéo nhau (Tứ diện ABCD)';
      if (descEl) {
        descEl.innerHTML = `Đoạn thẳng <strong>$AB$</strong> (xanh neon) và <strong>$CD$</strong> (vàng neon) là hai cạnh đối của tứ diện $ABCD$. Chúng không cùng thuộc bất kì mặt phẳng nào, khoảng cách không gian $d(AB, CD) > 0$.`;
        renderMathInTree(descEl);
      }
      appState.labInteractions.lab1 = true;
      checkBadges();
      drawLab1();
    });
  }

  if (btnParallel) {
    btnParallel.addEventListener('click', () => {
      lab1State.mode = 'parallel';
      btnParallel.classList.add('active');
      btnSkew.classList.remove('active');
      if (statusBadge) statusBadge.textContent = 'Đang xem: Hai đường thẳng song song (Hình chóp S.ABCD)';
      if (descEl) {
        descEl.innerHTML = `Đoạn thẳng <strong>$AB$</strong> và <strong>$CD$</strong> là hai cạnh đối của đáy hình bình hành $ABCD$. Chúng cùng nằm trong mặt phẳng $(ABCD)$ và không có điểm chung: $AB \\parallel CD$.`;
        renderMathInTree(descEl);
      }
      appState.labInteractions.lab1 = true;
      checkBadges();
      drawLab1();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      lab1State.rotX = 25 * Math.PI / 180;
      lab1State.rotY = -35 * Math.PI / 180;
      lab1State.zoom = 1.0;
      drawLab1();
    });
  }

  if (chkPlanes) {
    chkPlanes.addEventListener('change', (e) => {
      lab1State.showPlanes = e.target.checked;
      drawLab1();
    });
  }

  if (chkAuto) {
    chkAuto.addEventListener('change', (e) => {
      lab1State.autoRotate = e.target.checked;
    });
  }

  // Mouse interaction
  canvas.addEventListener('mousedown', (e) => {
    lab1State.isDragging = true;
    lab1State.lastMouseX = e.clientX;
    lab1State.lastMouseY = e.clientY;
    appState.labInteractions.lab1 = true;
    checkBadges();
  });

  window.addEventListener('mouseup', () => {
    lab1State.isDragging = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!lab1State.isDragging) return;
    const dx = e.clientX - lab1State.lastMouseX;
    const dy = e.clientY - lab1State.lastMouseY;
    lab1State.rotY += dx * 0.01;
    lab1State.rotX += dy * 0.01;
    lab1State.lastMouseX = e.clientX;
    lab1State.lastMouseY = e.clientY;
    drawLab1();
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    lab1State.zoom *= e.deltaY > 0 ? 0.95 : 1.05;
    lab1State.zoom = Math.max(0.6, Math.min(2.0, lab1State.zoom));
    drawLab1();
  });

  // Render loop
  function loop() {
    if (lab1State.autoRotate) {
      lab1State.rotY += 0.008;
      drawLab1();
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  drawLab1();
}

function project3D(x, y, z, rotX, rotY, zoom, cx, cy) {
  // Xoay quanh trục Y
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;

  // Xoay quanh trục X
  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  // Phối cảnh đơn giản (perspective)
  const fov = 450;
  const scale = (fov / (fov + z2)) * zoom;
  return {
    px: cx + x1 * scale,
    py: cy - y2 * scale,
    pz: z2
  };
}

function drawLab1() {
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2 + 10;

  ctx.clearRect(0, 0, w, h);

  // Nền không gian sâu
  const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 350);
  bgGrad.addColorStop(0, '#111827');
  bgGrad.addColorStop(1, '#030712');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const { rotX, rotY, zoom, mode, showPlanes } = lab1State;

  if (mode === 'skew') {
    // Tứ diện ABCD với AB (xanh neon) và CD (vàng neon) chéo nhau
    const A = { x: -70, y: 110, z: -40, label: 'A' };
    const B = { x: 80, y: 130, z: 50, label: 'B' };
    const C = { x: -110, y: -70, z: 80, label: 'C' };
    const D = { x: 100, y: -80, z: -90, label: 'D' };

    const pts = [A, B, C, D];
    const proj = {};
    pts.forEach(p => {
      proj[p.label] = project3D(p.x, p.y, p.z, rotX, rotY, zoom, cx, cy);
    });

    // Vẽ hai mặt phẳng song song chứa AB và CD nếu bật
    if (showPlanes) {
      // Mặt phẳng P chứa AB và d' // CD
      ctx.save();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.08)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      const P1 = project3D(-140, 110, -80, rotX, rotY, zoom, cx, cy);
      const P2 = project3D(140, 130, -20, rotX, rotY, zoom, cx, cy);
      const P3 = project3D(160, 130, 90, rotX, rotY, zoom, cx, cy);
      const P4 = project3D(-120, 110, 90, rotX, rotY, zoom, cx, cy);

      ctx.beginPath();
      ctx.moveTo(P1.px, P1.py);
      ctx.lineTo(P2.px, P2.py);
      ctx.lineTo(P3.px, P3.py);
      ctx.lineTo(P4.px, P4.py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Mặt phẳng Q chứa CD
      ctx.fillStyle = 'rgba(245, 158, 11, 0.08)';
      ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
      const Q1 = project3D(-150, -75, 120, rotX, rotY, zoom, cx, cy);
      const Q2 = project3D(130, -80, 120, rotX, rotY, zoom, cx, cy);
      const Q3 = project3D(130, -80, -120, rotX, rotY, zoom, cx, cy);
      const Q4 = project3D(-150, -75, -120, rotX, rotY, zoom, cx, cy);

      ctx.beginPath();
      ctx.moveTo(Q1.px, Q1.py);
      ctx.lineTo(Q2.px, Q2.py);
      ctx.lineTo(Q3.px, Q3.py);
      ctx.lineTo(Q4.px, Q4.py);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }

    // Các cạnh khác của tứ diện (màu mờ)
    const otherEdges = [
      ['A', 'C'], ['A', 'D'], ['B', 'C'], ['B', 'D']
    ];
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    otherEdges.forEach(([u, v]) => {
      ctx.beginPath();
      ctx.moveTo(proj[u].px, proj[u].py);
      ctx.lineTo(proj[v].px, proj[v].py);
      ctx.stroke();
    });

    // Cạnh AB (Xanh Cyan Neon)
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(proj['A'].px, proj['A'].py);
    ctx.lineTo(proj['B'].px, proj['B'].py);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Cạnh CD (Vàng Hổ Phách Neon)
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#f59e0b';
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(proj['C'].px, proj['C'].py);
    ctx.lineTo(proj['D'].px, proj['D'].py);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Điểm và nhãn
    pts.forEach(p => {
      const pr = proj[p.label];
      ctx.fillStyle = (p.label === 'A' || p.label === 'B') ? '#06b6d4' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(pr.px, pr.py, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(p.label, pr.px + 8, pr.py - 6);
    });

    // Nhãn 2 đường chéo nhau
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Đường thẳng AB', proj['A'].px - 50, proj['A'].py - 15);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('Đường thẳng CD (chéo nhau với AB)', proj['D'].px - 30, proj['D'].py + 25);

  } else {
    // Hình chóp S.ABCD đáy bình hành, AB // CD
    const S = { x: 0, y: 130, z: 0, label: 'S' };
    const A = { x: -90, y: -60, z: -60, label: 'A' };
    const B = { x: 40, y: -60, z: -60, label: 'B' };
    const C = { x: 90, y: -60, z: 60, label: 'C' };
    const D = { x: -40, y: -60, z: 60, label: 'D' };

    const pts = [S, A, B, C, D];
    const proj = {};
    pts.forEach(p => {
      proj[p.label] = project3D(p.x, p.y, p.z, rotX, rotY, zoom, cx, cy);
    });

    // Mặt đáy ABCD
    if (showPlanes) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
      ctx.beginPath();
      ctx.moveTo(proj['A'].px, proj['A'].py);
      ctx.lineTo(proj['B'].px, proj['B'].py);
      ctx.lineTo(proj['C'].px, proj['C'].py);
      ctx.lineTo(proj['D'].px, proj['D'].py);
      ctx.closePath();
      ctx.fill();
    }

    // Các cạnh bên
    const sideEdges = [
      ['S', 'A'], ['S', 'B'], ['S', 'C'], ['S', 'D'],
      ['A', 'D'], ['B', 'C']
    ];
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    sideEdges.forEach(([u, v]) => {
      ctx.beginPath();
      ctx.moveTo(proj[u].px, proj[u].py);
      ctx.lineTo(proj[v].px, proj[v].py);
      ctx.stroke();
    });

    // AB // CD nổi bật neon
    // Cạnh AB
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(proj['A'].px, proj['A'].py);
    ctx.lineTo(proj['B'].px, proj['B'].py);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Cạnh CD
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#10b981';
    ctx.shadowColor = '#10b981';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(proj['D'].px, proj['D'].py);
    ctx.lineTo(proj['C'].px, proj['C'].py);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Ký hiệu song song mũi tên trên AB và CD
    drawArrowOnSegment(ctx, proj['A'], proj['B'], '#10b981');
    drawArrowOnSegment(ctx, proj['D'], proj['C'], '#10b981');

    // Đường giao tuyến d qua S // AB // CD
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ec4899';
    ctx.setLineDash([5, 5]);
    const dLeft = project3D(-110, 130, 0, rotX, rotY, zoom, cx, cy);
    const dRight = project3D(110, 130, 0, rotX, rotY, zoom, cx, cy);
    ctx.beginPath();
    ctx.moveTo(dLeft.px, dLeft.py);
    ctx.lineTo(dRight.px, dRight.py);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ec4899';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Giao tuyến d qua S // AB // CD', dRight.px + 8, dRight.py + 4);

    // Điểm và nhãn
    pts.forEach(p => {
      const pr = proj[p.label];
      ctx.fillStyle = (p.label === 'A' || p.label === 'B' || p.label === 'C' || p.label === 'D') ? '#10b981' : '#f59e0b';
      ctx.beginPath();
      ctx.arc(pr.px, pr.py, 5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(p.label, pr.px + 8, pr.py - 6);
    });

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('AB // CD (cùng thuộc mp đáy)', proj['C'].px - 50, proj['C'].py + 25);
  }
}

function drawArrowOnSegment(ctx, p1, p2, color) {
  const mx = (p1.px + p2.px) / 2;
  const my = (p1.py + p2.py) / 2;
  const angle = Math.atan2(p2.py - p1.py, p2.px - p1.px);
  const size = 8;

  ctx.save();
  ctx.fillStyle = color;
  ctx.translate(mx, my);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(size, 0);
  ctx.lineTo(-size, -size / 1.5);
  ctx.lineTo(-size, size / 1.5);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// --- 5. PHÒNG THÍ NGHIỆM 2: ĐỊNH LÍ BA ĐƯỜNG GIAO TUYẾN 3D ---
let lab2State = {
  caseType: 'concurrent', // 'concurrent' | 'parallel'
  rotX: 20 * Math.PI / 180,
  rotY: -40 * Math.PI / 180,
  zoom: 1.0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  showFaces: true,
  highlightLines: true
};

function initLab2() {
  const canvas = document.getElementById('canvasLab2');
  if (!canvas) return;

  const btnConc = document.getElementById('btnCaseConcurrent');
  const btnPara = document.getElementById('btnCaseParallel');
  const btnReset = document.getElementById('btnResetRot2');
  const chkFaces = document.getElementById('chkShowFaces2');
  const chkHigh = document.getElementById('chkHighlightLines2');
  const statusBadge = document.getElementById('lab2StatusBadge');
  const formulaP = document.getElementById('lab2Formula');

  if (btnConc) {
    btnConc.addEventListener('click', () => {
      lab2State.caseType = 'concurrent';
      btnConc.classList.add('active');
      btnPara.classList.remove('active');
      if (statusBadge) {
        statusBadge.textContent = 'Mô hình: Ba giao tuyến đồng quy tại đỉnh S';
        statusBadge.className = 'status-indicator gold';
      }
      if (formulaP) {
        formulaP.innerHTML = `Ba mặt phẳng $(SAB), (SBC), (SCA)$ cắt nhau theo 3 giao tuyến phân biệt là $SA, SB, SC$. Cả ba đường giao tuyến này cùng đi qua một điểm chung duy nhất là đỉnh <strong>$S$</strong> (đồng quy).`;
        renderMathInTree(formulaP);
      }
      appState.labInteractions.lab2 = true;
      checkBadges();
      drawLab2();
    });
  }

  if (btnPara) {
    btnPara.addEventListener('click', () => {
      lab2State.caseType = 'parallel';
      btnPara.classList.add('active');
      btnConc.classList.remove('active');
      if (statusBadge) {
        statusBadge.textContent = 'Mô hình: Ba giao tuyến đôi một song song (Lăng trụ / Mái nhà)';
        statusBadge.className = 'status-indicator';
      }
      if (formulaP) {
        formulaP.innerHTML = `Ba mặt phẳng $(P), (Q), (R)$ cắt nhau theo 3 giao tuyến $d_1, d_2, d_3$. Vì $d_1 \\parallel d_2$, nên theo Định lí ba đường giao tuyến, giao tuyến thứ ba $d_3$ bắt buộc phải song song với cả hai: <strong>$d_1 \\parallel d_2 \\parallel d_3$</strong>.`;
        renderMathInTree(formulaP);
      }
      appState.labInteractions.lab2 = true;
      checkBadges();
      drawLab2();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      lab2State.rotX = 20 * Math.PI / 180;
      lab2State.rotY = -40 * Math.PI / 180;
      lab2State.zoom = 1.0;
      drawLab2();
    });
  }

  if (chkFaces) {
    chkFaces.addEventListener('change', (e) => {
      lab2State.showFaces = e.target.checked;
      drawLab2();
    });
  }

  if (chkHigh) {
    chkHigh.addEventListener('change', (e) => {
      lab2State.highlightLines = e.target.checked;
      drawLab2();
    });
  }

  // Mouse interaction
  canvas.addEventListener('mousedown', (e) => {
    lab2State.isDragging = true;
    lab2State.lastMouseX = e.clientX;
    lab2State.lastMouseY = e.clientY;
    appState.labInteractions.lab2 = true;
    checkBadges();
  });

  window.addEventListener('mouseup', () => {
    lab2State.isDragging = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!lab2State.isDragging) return;
    const dx = e.clientX - lab2State.lastMouseX;
    const dy = e.clientY - lab2State.lastMouseY;
    lab2State.rotY += dx * 0.01;
    lab2State.rotX += dy * 0.01;
    lab2State.lastMouseX = e.clientX;
    lab2State.lastMouseY = e.clientY;
    drawLab2();
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    lab2State.zoom *= e.deltaY > 0 ? 0.95 : 1.05;
    lab2State.zoom = Math.max(0.6, Math.min(2.0, lab2State.zoom));
    drawLab2();
  });

  drawLab2();
}

function drawLab2() {
  const canvas = document.getElementById('canvasLab2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2 + 10;

  ctx.clearRect(0, 0, w, h);

  // Nền gradient
  const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 350);
  bgGrad.addColorStop(0, '#111827');
  bgGrad.addColorStop(1, '#030712');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const { rotX, rotY, zoom, caseType, showFaces, highlightLines } = lab2State;

  if (caseType === 'concurrent') {
    // 3 giao tuyến SA, SB, SC đồng quy tại S (Hình chóp tam giác S.ABC)
    const S = { x: 0, y: 120, z: 0, label: 'S (Điểm đồng quy)' };
    const A = { x: -90, y: -70, z: -50, label: 'A' };
    const B = { x: 80, y: -70, z: -40, label: 'B' };
    const C = { x: 0, y: -70, z: 80, label: 'C' };

    const pts = [S, A, B, C];
    const proj = {};
    pts.forEach(p => {
      proj[p.label] = project3D(p.x, p.y, p.z, rotX, rotY, zoom, cx, cy);
    });

    if (showFaces) {
      // Mặt (SAB)
      ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.beginPath();
      ctx.moveTo(proj[S.label].px, proj[S.label].py);
      ctx.lineTo(proj[A.label].px, proj[A.label].py);
      ctx.lineTo(proj[B.label].px, proj[B.label].py);
      ctx.closePath();
      ctx.fill();

      // Mặt (SBC)
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.beginPath();
      ctx.moveTo(proj[S.label].px, proj[S.label].py);
      ctx.lineTo(proj[B.label].px, proj[B.label].py);
      ctx.lineTo(proj[C.label].px, proj[C.label].py);
      ctx.closePath();
      ctx.fill();

      // Mặt (SCA)
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.beginPath();
      ctx.moveTo(proj[S.label].px, proj[S.label].py);
      ctx.lineTo(proj[C.label].px, proj[C.label].py);
      ctx.lineTo(proj[A.label].px, proj[A.label].py);
      ctx.closePath();
      ctx.fill();
    }

    // Đáy ABC
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.beginPath();
    ctx.moveTo(proj[A.label].px, proj[A.label].py);
    ctx.lineTo(proj[B.label].px, proj[B.label].py);
    ctx.lineTo(proj[C.label].px, proj[C.label].py);
    ctx.closePath();
    ctx.stroke();

    // 3 Giao tuyến SA, SB, SC
    const lines = [
      { u: S.label, v: A.label, name: 'd1 = (SAB) ∩ (SCA)', color: '#6366f1' },
      { u: S.label, v: B.label, name: 'd2 = (SAB) ∩ (SBC)', color: '#06b6d4' },
      { u: S.label, v: C.label, name: 'd3 = (SBC) ∩ (SCA)', color: '#f59e0b' }
    ];

    lines.forEach(l => {
      ctx.lineWidth = highlightLines ? 3.5 : 2;
      ctx.strokeStyle = l.color;
      if (highlightLines) {
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.moveTo(proj[l.u].px, proj[l.u].py);
      ctx.lineTo(proj[l.v].px, proj[l.v].py);
      ctx.stroke();
      ctx.shadowBlur = 0;
    });

    // Điểm đồng quy S
    const prS = proj[S.label];
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(prS.px, prS.py, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('ĐIỂM ĐỒNG QUY S', prS.px - 60, prS.py - 15);

  } else {
    // 3 giao tuyến song song (Mô hình lăng trụ / Mái nhà)
    // Mặt P và Q giao tuyến d1
    // Mặt Q và R giao tuyến d2
    // Mặt R và P giao tuyến d3
    const len = 110;
    const yTop = 60;
    const yBot = -60;

    // 3 cặp điểm tạo thành 3 đường thẳng song song theo phương Z
    const L1_start = { x: 0, y: yTop, z: -len, label: 'd1' };
    const L1_end   = { x: 0, y: yTop, z: len,  label: 'd1_e' };

    const L2_start = { x: -90, y: yBot, z: -len, label: 'd2' };
    const L2_end   = { x: -90, y: yBot, z: len,  label: 'd2_e' };

    const L3_start = { x: 90, y: yBot, z: -len, label: 'd3' };
    const L3_end   = { x: 90, y: yBot, z: len,  label: 'd3_e' };

    const pts = [L1_start, L1_end, L2_start, L2_end, L3_start, L3_end];
    const proj = {};
    pts.forEach((p, i) => {
      proj[p.label] = project3D(p.x, p.y, p.z, rotX, rotY, zoom, cx, cy);
    });

    if (showFaces) {
      // Mặt mái trái (P) chứa d1 và d2
      ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
      ctx.beginPath();
      ctx.moveTo(proj['d1'].px, proj['d1'].py);
      ctx.lineTo(proj['d1_e'].px, proj['d1_e'].py);
      ctx.lineTo(proj['d2_e'].px, proj['d2_e'].py);
      ctx.lineTo(proj['d2'].px, proj['d2'].py);
      ctx.closePath();
      ctx.fill();

      // Mặt mái phải (Q) chứa d1 và d3
      ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
      ctx.beginPath();
      ctx.moveTo(proj['d1'].px, proj['d1'].py);
      ctx.lineTo(proj['d1_e'].px, proj['d1_e'].py);
      ctx.lineTo(proj['d3_e'].px, proj['d3_e'].py);
      ctx.lineTo(proj['d3'].px, proj['d3'].py);
      ctx.closePath();
      ctx.fill();

      // Mặt sàn (R) chứa d2 và d3
      ctx.fillStyle = 'rgba(245, 158, 11, 0.12)';
      ctx.beginPath();
      ctx.moveTo(proj['d2'].px, proj['d2'].py);
      ctx.lineTo(proj['d2_e'].px, proj['d2_e'].py);
      ctx.lineTo(proj['d3_e'].px, proj['d3_e'].py);
      ctx.lineTo(proj['d3'].px, proj['d3'].py);
      ctx.closePath();
      ctx.fill();
    }

    // 2 mặt đáy tam giác lăng trụ
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.4)';
    ctx.beginPath();
    ctx.moveTo(proj['d1'].px, proj['d1'].py);
    ctx.lineTo(proj['d2'].px, proj['d2'].py);
    ctx.lineTo(proj['d3'].px, proj['d3'].py);
    ctx.closePath();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(proj['d1_e'].px, proj['d1_e'].py);
    ctx.lineTo(proj['d2_e'].px, proj['d2_e'].py);
    ctx.lineTo(proj['d3_e'].px, proj['d3_e'].py);
    ctx.closePath();
    ctx.stroke();

    // 3 Giao tuyến d1, d2, d3 đôi một song song
    const parLines = [
      { u: 'd1', v: 'd1_e', color: '#10b981', name: 'Giao tuyến d1 (Nóc)' },
      { u: 'd2', v: 'd2_e', color: '#10b981', name: 'Giao tuyến d2 (Chân trái)' },
      { u: 'd3', v: 'd3_e', color: '#10b981', name: 'Giao tuyến d3 (Chân phải)' }
    ];

    parLines.forEach(l => {
      ctx.lineWidth = highlightLines ? 3.5 : 2;
      ctx.strokeStyle = l.color;
      if (highlightLines) {
        ctx.shadowColor = l.color;
        ctx.shadowBlur = 10;
      }
      ctx.beginPath();
      ctx.moveTo(proj[l.u].px, proj[l.u].py);
      ctx.lineTo(proj[l.v].px, proj[l.v].py);
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Mũi tên song song
      drawArrowOnSegment(ctx, proj[l.u], proj[l.v], '#10b981');
    });

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('d1 // d2 // d3 (Đôi một song song)', proj['d1_e'].px - 80, proj['d1_e'].py - 15);
  }
}

// --- 6. KHỞI TẠO TỔNG THỂ KHI TẢI TRANG (DOM READY) ---
document.addEventListener('DOMContentLoaded', () => {
  // 1. Render KaTeX cho toàn bộ cây DOM
  renderMathInTree(document.body);

  // 2. Navigation Tabs
  const tabs = document.querySelectorAll('.nav-tab');
  const panes = document.querySelectorAll('.tab-content');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetPane = document.getElementById(`tab-${target}`);
      if (targetPane) {
        targetPane.classList.add('active');
        renderMathInTree(targetPane);
      }
      playTone(400, 'sine', 0.05, 0.05);

      // Kích hoạt redraw khi chuyển qua Tab Labs
      if (target === 'labs') {
        drawLab1();
        drawLab2();
      }
    });
  });

  // 3. Khởi tạo Avatar Modal (chỉ bật khi người dùng bấm vào #avatarBtn)
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const avatarModalClose = document.getElementById('avatarModalClose');
  const avatarGrid = document.getElementById('avatarGrid');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      avatarModal.style.display = 'flex';
      avatarModal.classList.add('active');
    });
  }

  if (avatarModalClose && avatarModal) {
    avatarModalClose.addEventListener('click', () => {
      avatarModal.style.display = 'none';
      avatarModal.classList.remove('active');
    });
  }

  if (avatarGrid) {
    avatarGrid.innerHTML = '';
    avatars.forEach(av => {
      const item = document.createElement('div');
      item.className = 'avatar-choice-item';
      item.innerHTML = `<span class="av-emoji">${av.emoji}</span><span class="av-title">${av.title}</span>`;
      item.addEventListener('click', () => {
        appState.avatar = av.emoji;
        appState.userName = av.title;
        updateHUD();
        avatarModal.style.display = 'none';
        avatarModal.classList.remove('active');
        playTone(600, 'triangle', 0.1, 0.1);
      });
      avatarGrid.appendChild(item);
    });
  }

  // 4. Nút tiện ích HUD (Sound & Reset)
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      soundBtn.classList.toggle('muted', !appState.sound);
    });
  }

  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập của Bài 11?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        appState.labInteractions = { lab1: false, lab2: false };
        updateHUD();
        renderQuiz();
        document.querySelectorAll('.badge-card').forEach(b => {
          b.classList.remove('unlocked');
          b.classList.add('locked');
          const st = b.querySelector('.badge-status');
          if (st) st.textContent = 'Chưa đạt';
        });
        checkBadges();
      }
    });
  }

  // 5. In chứng nhận A4
  const btnPrint = document.getElementById('btnPrintCert');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // 6. Khởi tạo 2 Labs 3D
  initLab1();
  initLab2();

  // 7. Render Đấu trường SGK
  renderQuiz();

  // 8. Cập nhật HUD ban đầu
  updateHUD();
});
