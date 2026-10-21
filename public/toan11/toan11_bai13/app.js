// ================================================================
// BÀI 13: HAI MẶT PHẲNG SONG SONG - TOÁN 11 KNTT
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
  userTitle: 'Đại Sư Mặt Phẳng & Hình Hộp Không Gian',
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

  let s = 1;
  if (appState.xp >= 180) s = 5;
  else if (appState.xp >= 140) s = 4;
  else if (appState.xp >= 90) s = 3;
  else if (appState.xp >= 40) s = 2;
  appState.stars = s;
  if (starEl) {
    starEl.textContent = '⭐'.repeat(s) + '☆'.repeat(5 - s);
  }

  const certXP = document.getElementById('certTotalXP');
  const certRank = document.getElementById('certRank');
  const certName = document.getElementById('certStudentName');
  if (certXP) certXP.textContent = appState.xp;
  if (certName) certName.textContent = appState.userName;
  if (certRank) {
    if (appState.xp >= 180) certRank.textContent = 'Xuất Sắc (Đại Sư Lăng Trụ)';
    else if (appState.xp >= 120) certRank.textContent = 'Giỏi (Chiến Binh Cấp Cao)';
    else if (appState.xp >= 60) certRank.textContent = 'Khá (Thám Hiểm Gia)';
    else certRank.textContent = 'Tập Sự';
  }

  checkBadges();
}

function checkBadges() {
  // Huy hiệu 1: Xem lý thuyết
  if (!appState.badges[0]) {
    unlockBadge(0);
  }

  // Huy hiệu 2: Tương tác cả 2 Labs
  if (!appState.badges[1] && appState.labInteractions.lab1 && appState.labInteractions.lab2) {
    unlockBadge(1);
  }

  // Huy hiệu 3: Streak >= 3
  if (!appState.badges[2] && appState.streak >= 3) {
    unlockBadge(2);
  }

  // Huy hiệu 4: XP >= 160
  if (!appState.badges[3] && appState.xp >= 160) {
    unlockBadge(3);
  }

  // Huy hiệu 5: 10/10 câu đúng
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
    title: "Câu 1: Định nghĩa hai mặt phẳng song song trong không gian",
    pts: 20,
    question: "Hai mặt phẳng $(\\alpha)$ và $(\\beta)$ được gọi là **song song với nhau** khi và chỉ khi:",
    options: [
      { text: "Chúng cùng vuông góc với một đường thẳng bất kì.", correct: false },
      { text: "Chúng không có bất kì điểm chung nào ($(\\alpha) \\cap (\\beta) = \\emptyset$).", correct: true },
      { text: "Chúng có đúng một giao tuyến chung.", correct: false },
      { text: "Khoảng cách giữa hai mặt phẳng bằng 0.", correct: false }
    ],
    explanation: "Theo định nghĩa SGK Bài 13: Hai mặt phẳng $(\\alpha)$ và $(\\beta)$ được gọi là song song với nhau nếu chúng không có điểm chung, kí hiệu $(\\alpha) \\parallel (\\beta)$ hay $(\\beta) \\parallel (\\alpha)$."
  },
  {
    id: 2,
    title: "Câu 2: Điều kiện để hai mặt phẳng song song (Định lí trang 89 SGK)",
    pts: 20,
    question: "Để chứng minh mặt phẳng $(\\alpha)$ song song với mặt phẳng $(\\beta)$, ta cần chứng minh $(\\alpha)$ chứa hai đường thẳng $a$ và $b$ thỏa mãn:",
    options: [
      { text: "$a \\parallel b$ và cùng song song với $(\\beta)$.", correct: false },
      { text: "$a$ cắt $b$ và cả hai đường thẳng $a, b$ cùng song song với $(\\beta)$.", correct: true },
      { text: "$a$ và $b$ cùng nằm trong $(\\beta)$.", correct: false },
      { text: "$a$ vuông góc với $b$ và $a$ cắt $(\\beta)$.", correct: false }
    ],
    explanation: "Định lí: Nếu mặt phẳng $(\\alpha)$ chứa hai đường thẳng cắt nhau và hai đường thẳng này cùng song song với mặt phẳng $(\\beta)$ thì $(\\alpha)$ song song với $(\\beta)$."
  },
  {
    id: 3,
    title: "Câu 3: Bẫy điều kiện hai đường thẳng song song (Bài 4.21b SGK)",
    pts: 20,
    question: "Nếu mặt phẳng $(P)$ chứa hai đường thẳng phân biệt $a$ và $b$ cùng song song với mặt phẳng $(Q)$ thì khẳng định nào sau đây là **chính xác nhất**?",
    options: [
      { text: "Mặt phẳng $(P)$ chắc chắn song song với $(Q)$.", correct: false },
      { text: "Mặt phẳng $(P)$ chắc chắn cắt $(Q)$.", correct: false },
      { text: "Nếu $a$ cắt $b$ thì $(P) \\parallel (Q)$; còn nếu $a \\parallel b$ thì $(P)$ có thể cắt $(Q)$.", correct: true },
      { text: "Mặt phẳng $(P)$ và $(Q)$ trùng nhau.", correct: false }
    ],
    explanation: "Nếu $a \\parallel b$, mặt phẳng $(P)$ có thể cắt $(Q)$ theo một giao tuyến $c$ song song với cả $a$ và $b$. Do đó phải có điều kiện $a$ cắt $b$ thì mới kết luận được $(P) \\parallel (Q)$."
  },
  {
    id: 4,
    title: "Câu 4: Tính chất bắc cầu giữa các mặt phẳng song song (Bài 4.21c SGK)",
    pts: 20,
    question: "Trong không gian, cho ba mặt phẳng phân biệt $(P), (Q), (R)$. Biết $(P) \\parallel (R)$ và $(Q) \\parallel (R)$. Khi đó:",
    options: [
      { text: "$(P)$ cắt $(Q)$.", correct: false },
      { text: "$(P) \\parallel (Q)$.", correct: true },
      { text: "$(P)$ trùng với $(Q)$.", correct: false },
      { text: "$(P)$ vuông góc với $(Q)$.", correct: false }
    ],
    explanation: "Theo tính chất cơ bản SGK Bài 13: Hai mặt phẳng phân biệt cùng song song với một mặt phẳng thứ ba thì song song với nhau."
  },
  {
    id: 5,
    title: "Câu 5: Giao tuyến của mặt phẳng thứ ba với hai mặt phẳng song song",
    pts: 20,
    question: "Cho hai mặt phẳng song song $(P)$ và $(Q)$. Nếu mặt phẳng $(R)$ cắt $(P)$ theo giao tuyến $a$ và cắt $(Q)$ theo giao tuyến $b$ thì:",
    options: [
      { text: "$a \\parallel b$.", correct: true },
      { text: "$a$ cắt $b$.", correct: false },
      { text: "$a$ chéo nhau với $b$.", correct: false },
      { text: "$a \\equiv b$.", correct: false }
    ],
    explanation: "Tính chất 3: Cho hai mặt phẳng song song. Nếu một mặt phẳng cắt mặt phẳng này thì cũng cắt mặt phẳng kia và hai giao tuyến song song với nhau."
  },
  {
    id: 6,
    title: "Câu 6: Vận dụng Định lí Thalès trong không gian (Luyện tập 4 SGK)",
    pts: 20,
    question: "Ba mặt phẳng song song chắn trên cát tuyến thứ nhất hai đoạn $AB = 2\\text{ cm}$ và $BC = 4\\text{ cm}$. Trên cát tuyến thứ hai, đoạn tương ứng $A'B' = 3\\text{ cm}$. Độ dài đoạn $B'C'$ là:",
    options: [
      { text: "$B'C' = 5\\text{ cm}$.", correct: false },
      { text: "$B'C' = 6\\text{ cm}$.", correct: true },
      { text: "$B'C' = 4.5\\text{ cm}$.", correct: false },
      { text: "$B'C' = 8\\text{ cm}$.", correct: false }
    ],
    explanation: "Theo định lí Thalès trong không gian: $\\frac{AB}{BC} = \\frac{A'B'}{B'C'} \\implies \\frac{2}{4} = \\frac{3}{B'C'} \\implies B'C' = \\frac{4 \\times 3}{2} = 6\\text{ cm}$."
  },
  {
    id: 7,
    title: "Câu 7: Tính chất các cạnh bên của hình lăng trụ",
    pts: 20,
    question: "Trong một hình lăng trụ bất kì, các cạnh bên luôn luôn có tính chất:",
    options: [
      { text: "Đôi một cắt nhau tại một đỉnh chung.", correct: false },
      { text: "Đôi một chéo nhau và không bằng nhau.", correct: false },
      { text: "Song song và có độ dài bằng nhau.", correct: true },
      { text: "Cùng vuông góc với nhau từng đôi một.", correct: false }
    ],
    explanation: "Theo định nghĩa và tính chất hình lăng trụ (SGK Bài 13): Các cạnh bên của hình lăng trụ luôn song song và bằng nhau."
  },
  {
    id: 8,
    title: "Câu 8: Hình dạng các mặt bên của hình lăng trụ",
    pts: 20,
    question: "Các mặt bên của một hình lăng trụ luôn là hình gì?",
    options: [
      { text: "Hình chữ nhật.", correct: false },
      { text: "Hình bình hành.", correct: true },
      { text: "Hình thang cân.", correct: false },
      { text: "Hình tam giác.", correct: false }
    ],
    explanation: "Vì các cạnh bên đôi một song song và các cạnh đáy tương ứng song song, bằng nhau nên các mặt bên của hình lăng trụ luôn luôn là các hình bình hành."
  },
  {
    id: 9,
    title: "Câu 9: Tính chất 4 đường chéo của hình hộp (Ví dụ 6 SGK)",
    pts: 20,
    question: "Cho khối hình hộp $ABCD.A'B'C'D'$. Bốn đường chéo $AC', BD', CA', DB'$ có tính chất nào sau đây?",
    options: [
      { text: "Cùng đi qua trung điểm của mỗi đường.", correct: true },
      { text: "Đôi một vuông góc với nhau.", correct: false },
      { text: "Đôi một chéo nhau không cắt nhau.", correct: false },
      { text: "Có độ dài hoàn toàn khác nhau và không cắt nhau.", correct: false }
    ],
    explanation: "Bốn đường chéo của hình hộp cùng đi qua trung điểm của mỗi đường. Điểm chung này chính là tâm đối xứng của hình hộp."
  },
  {
    id: 10,
    title: "Câu 10: Ứng dụng thực tiễn đo mực nước bể hình hộp (Vận dụng 2 SGK)",
    pts: 20,
    question: "Để đo mực nước trong bể hình hộp, người ta cắm một thanh gỗ nghiêng từ mép nắp bể chạm đáy bể. Tỉ lệ độ dài phần thanh gỗ ngập trong nước trên cả thanh gỗ bằng tỉ lệ nào?",
    options: [
      { text: "Bằng tỉ lệ giữa chu vi đáy và chiều cao bể.", correct: false },
      { text: "Bằng tỉ lệ giữa chiều cao mực nước và chiều cao toàn phần của bể.", correct: true },
      { text: "Bằng căn bậc hai của thể tích nước.", correct: false },
      { text: "Bằng tỉ lệ diện tích mặt nước và đáy bể.", correct: false }
    ],
    explanation: "Mặt nắp bể, mặt nước và đáy bể là ba mặt phẳng đôi một song song. Theo Định lí Thalès trong không gian, chúng chắn trên phương thẳng đứng và trên thanh gỗ các đoạn thẳng tương ứng tỉ lệ. Do đó tỉ lệ phần ngập bằng tỉ lệ giữa mực nước và chiều cao bể."
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

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `
      <span>${q.title}</span>
      <span class="quiz-badge">+${q.pts} XP</span>
    `;
    card.appendChild(header);

    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

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

    const explanation = document.createElement('div');
    explanation.className = 'explanation-box';
    explanation.id = `exp-${q.id}`;
    explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;
    card.appendChild(explanation);

    container.appendChild(card);
  });

  renderMathInTree(container);
}

function handleQuizAnswer(qId, selectedIndex, btn, card) {
  if (appState.answered[qId]) return;

  const q = quizData.find(item => item.id === qId);
  if (!q) return;

  const isCorrect = q.options[selectedIndex].correct;
  const buttons = card.querySelectorAll('.quiz-opt-btn');

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

    q.options.forEach((opt, idx) => {
      if (opt.correct) {
        buttons[idx].classList.add('correct');
      }
    });
  }

  const expBox = document.getElementById(`exp-${qId}`);
  if (expBox) {
    expBox.classList.add('show');
    renderMathInTree(expBox);
  }

  const answeredCount = Object.keys(appState.answered).length;
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progEl) progEl.textContent = `${answeredCount}/10`;
  if (scoreEl) scoreEl.textContent = `${appState.xp} XP`;

  updateHUD();
}

// --- 4. PHÒNG THÍ NGHIỆM 1: ĐỊNH LÍ THALÈS 3D ---
let lab1State = {
  qPercent: 0.40, // Vị trí mặt (Q) giữa (P) và (R)
  rotX: 20 * Math.PI / 180,
  rotY: -35 * Math.PI / 180,
  zoom: 1.0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  autoRotate: false
};

function initLab1() {
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;

  const sliderQ = document.getElementById('sliderQPos');
  const valQ = document.getElementById('valQPos');
  const btnReset = document.getElementById('btnResetRot1');
  const chkAuto = document.getElementById('chkAutoRot1');

  if (sliderQ) {
    sliderQ.addEventListener('input', (e) => {
      lab1State.qPercent = parseFloat(e.target.value) / 100;
      if (valQ) valQ.textContent = `${Math.round(lab1State.qPercent * 100)}%`;
      appState.labInteractions.lab1 = true;
      checkBadges();
      drawLab1();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      lab1State.rotX = 20 * Math.PI / 180;
      lab1State.rotY = -35 * Math.PI / 180;
      lab1State.zoom = 1.0;
      drawLab1();
    });
  }

  if (chkAuto) {
    chkAuto.addEventListener('change', (e) => {
      lab1State.autoRotate = e.target.checked;
    });
  }

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
  const cosY = Math.cos(rotY);
  const sinY = Math.sin(rotY);
  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;

  const cosX = Math.cos(rotX);
  const sinX = Math.sin(rotX);
  const y2 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

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

  const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 350);
  bgGrad.addColorStop(0, '#111827');
  bgGrad.addColorStop(1, '#030712');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const { rotX, rotY, zoom, qPercent } = lab1State;

  // 3 Mặt phẳng song song: P (trên, y = 100), R (dưới, y = -100), Q (ở giữa theo qPercent)
  const yP = 100;
  const yR = -100;
  const yQ = yP - (yP - yR) * qPercent; // từ 100 xuống -100

  function drawPlane(yLevel, color, label) {
    const P1 = project3D(-130, yLevel, -80, rotX, rotY, zoom, cx, cy);
    const P2 = project3D(130, yLevel, -80, rotX, rotY, zoom, cx, cy);
    const P3 = project3D(150, yLevel, 80, rotX, rotY, zoom, cx, cy);
    const P4 = project3D(-110, yLevel, 80, rotX, rotY, zoom, cx, cy);

    ctx.fillStyle = color;
    ctx.strokeStyle = color.replace('0.15', '0.5');
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(P1.px, P1.py);
    ctx.lineTo(P2.px, P2.py);
    ctx.lineTo(P3.px, P3.py);
    ctx.lineTo(P4.px, P4.py);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(label, P4.px + 10, P4.py - 6);
  }

  // Vẽ 3 mặt phẳng (P), (Q), (R)
  drawPlane(yP, 'rgba(99, 102, 241, 0.15)', 'Mặt phẳng (P)');
  drawPlane(yQ, 'rgba(245, 158, 11, 0.18)', 'Mặt phẳng (Q)');
  drawPlane(yR, 'rgba(6, 182, 212, 0.15)', 'Mặt phẳng (R)');

  // Cát tuyến d (nghiêng từ P qua Q xuống R)
  // Giao điểm A (trên P), B (trên Q), C (trên R)
  const A_3d = { x: -60, y: yP, z: -30 };
  const C_3d = { x: -30, y: yR, z: 40 };
  const B_3d = {
    x: A_3d.x + (C_3d.x - A_3d.x) * qPercent,
    y: yQ,
    z: A_3d.z + (C_3d.z - A_3d.z) * qPercent
  };

  // Cát tuyến d' (nghiêng theo phương khác)
  // Giao điểm A' (trên P), B' (trên Q), C' (trên R)
  const A1_3d = { x: 30, y: yP, z: 30 };
  const C1_3d = { x: 70, y: yR, z: -50 };
  const B1_3d = {
    x: A1_3d.x + (C1_3d.x - A1_3d.x) * qPercent,
    y: yQ,
    z: A1_3d.z + (C1_3d.z - A1_3d.z) * qPercent
  };

  const pA = project3D(A_3d.x, A_3d.y, A_3d.z, rotX, rotY, zoom, cx, cy);
  const pB = project3D(B_3d.x, B_3d.y, B_3d.z, rotX, rotY, zoom, cx, cy);
  const pC = project3D(C_3d.x, C_3d.y, C_3d.z, rotX, rotY, zoom, cx, cy);

  const pA1 = project3D(A1_3d.x, A1_3d.y, A1_3d.z, rotX, rotY, zoom, cx, cy);
  const pB1 = project3D(B1_3d.x, B1_3d.y, B1_3d.z, rotX, rotY, zoom, cx, cy);
  const pC1 = project3D(C1_3d.x, C1_3d.y, C1_3d.z, rotX, rotY, zoom, cx, cy);

  // Kéo dài cát tuyến d
  const d_top = project3D(A_3d.x - 10, yP + 25, A_3d.z - 10, rotX, rotY, zoom, cx, cy);
  const d_bot = project3D(C_3d.x + 10, yR - 25, C_3d.z + 10, rotX, rotY, zoom, cx, cy);

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#10b981';
  ctx.beginPath();
  ctx.moveTo(d_top.px, d_top.py);
  ctx.lineTo(d_bot.px, d_bot.py);
  ctx.stroke();

  // Kéo dài cát tuyến d'
  const d1_top = project3D(A1_3d.x - 10, yP + 25, A1_3d.z + 10, rotX, rotY, zoom, cx, cy);
  const d1_bot = project3D(C1_3d.x + 10, yR - 25, C1_3d.z - 10, rotX, rotY, zoom, cx, cy);

  ctx.strokeStyle = '#ec4899';
  ctx.beginPath();
  ctx.moveTo(d1_top.px, d1_top.py);
  ctx.lineTo(d1_bot.px, d1_bot.py);
  ctx.stroke();

  // Vẽ các điểm A, B, C và nhãn
  [
    { p: pA, lbl: 'A', col: '#10b981' },
    { p: pB, lbl: 'B', col: '#f59e0b' },
    { p: pC, lbl: 'C', col: '#10b981' },
    { p: pA1, lbl: "A'", col: '#ec4899' },
    { p: pB1, lbl: "B'", col: '#f59e0b' },
    { p: pC1, lbl: "C'", col: '#ec4899' }
  ].forEach(pt => {
    ctx.fillStyle = pt.col;
    ctx.shadowColor = pt.col;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(pt.p.px, pt.p.py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(pt.lbl, pt.p.px + 7, pt.p.py - 5);
  });

  // Tính khoảng cách không gian 3D
  function dist3D(p1, p2) {
    return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2);
  }

  const lenAB = dist3D(A_3d, B_3d);
  const lenBC = dist3D(B_3d, C_3d);
  const lenA1B1 = dist3D(A1_3d, B1_3d);
  const lenB1C1 = dist3D(B1_3d, C1_3d);

  const ratio1 = lenAB / lenBC;
  const ratio2 = lenA1B1 / lenB1C1;

  // Cập nhật giao diện thống kê Thalès
  const txtAB = document.getElementById('txtAB');
  const txtBC = document.getElementById('txtBC');
  const txtA1B1 = document.getElementById('txtA1B1');
  const txtB1C1 = document.getElementById('txtB1C1');
  const txtRatio1 = document.getElementById('txtRatio1');
  const txtRatio2 = document.getElementById('txtRatio2');

  if (txtAB) txtAB.textContent = lenAB.toFixed(1);
  if (txtBC) txtBC.textContent = lenBC.toFixed(1);
  if (txtA1B1) txtA1B1.textContent = lenA1B1.toFixed(1);
  if (txtB1C1) txtB1C1.textContent = lenB1C1.toFixed(1);
  if (txtRatio1) txtRatio1.textContent = ratio1.toFixed(3);
  if (txtRatio2) txtRatio2.textContent = ratio2.toFixed(3);
}

// --- 5. PHÒNG THÍ NGHIỆM 2: MÔ PHỎNG HÌNH HỘP & 4 ĐƯỜNG CHÉO 3D ---
let lab2State = {
  boxType: 'normal', // 'normal' | 'skew'
  rotX: 22 * Math.PI / 180,
  rotY: -40 * Math.PI / 180,
  zoom: 1.0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  showDiagonals: true,
  showCenter: true,
  showFaces: true
};

function initLab2() {
  const canvas = document.getElementById('canvasLab2');
  if (!canvas) return;

  const btnNormal = document.getElementById('btnBoxNormal');
  const btnSkew = document.getElementById('btnBoxSkew');
  const btnReset = document.getElementById('btnResetRot2');
  const chkDiag = document.getElementById('chkShowDiagonals');
  const chkCenter = document.getElementById('chkShowCenter');
  const chkFaces = document.getElementById('chkShowFaces');

  if (btnNormal) {
    btnNormal.addEventListener('click', () => {
      lab2State.boxType = 'normal';
      btnNormal.classList.add('active');
      btnSkew.classList.remove('active');
      appState.labInteractions.lab2 = true;
      checkBadges();
      drawLab2();
    });
  }

  if (btnSkew) {
    btnSkew.addEventListener('click', () => {
      lab2State.boxType = 'skew';
      btnSkew.classList.add('active');
      btnNormal.classList.remove('active');
      appState.labInteractions.lab2 = true;
      checkBadges();
      drawLab2();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      lab2State.rotX = 22 * Math.PI / 180;
      lab2State.rotY = -40 * Math.PI / 180;
      lab2State.zoom = 1.0;
      drawLab2();
    });
  }

  if (chkDiag) chkDiag.addEventListener('change', (e) => { lab2State.showDiagonals = e.target.checked; drawLab2(); });
  if (chkCenter) chkCenter.addEventListener('change', (e) => { lab2State.showCenter = e.target.checked; drawLab2(); });
  if (chkFaces) chkFaces.addEventListener('change', (e) => { lab2State.showFaces = e.target.checked; drawLab2(); });

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

  const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 350);
  bgGrad.addColorStop(0, '#111827');
  bgGrad.addColorStop(1, '#030712');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const { rotX, rotY, zoom, boxType, showDiagonals, showCenter, showFaces } = lab2State;

  // Khối hình hộp ABCD.A'B'C'D'
  const skewX = boxType === 'skew' ? 40 : 0;
  const skewZ = boxType === 'skew' ? 25 : 0;

  const yTop = 70;
  const yBot = -70;

  // Đáy trên: A, B, C, D
  const A = { x: -70 + skewX, y: yTop, z: -50 + skewZ, label: 'A' };
  const B = { x: 70 + skewX,  y: yTop, z: -50 + skewZ, label: 'B' };
  const C = { x: 90 + skewX,  y: yTop, z: 50 + skewZ,  label: 'C' };
  const D = { x: -50 + skewX, y: yTop, z: 50 + skewZ,  label: 'D' };

  // Đáy dưới: A', B', C', D'
  const A1 = { x: -70, y: yBot, z: -50, label: "A'" };
  const B1 = { x: 70,  y: yBot, z: -50, label: "B'" };
  const C1 = { x: 90,  y: yBot, z: 50,  label: "C'" };
  const D1 = { x: -50, y: yBot, z: 50,  label: "D'" };

  // Tâm O
  const O = {
    x: (A.x + C1.x) / 2,
    y: (A.y + C1.y) / 2,
    z: (A.z + C1.z) / 2,
    label: 'O (Tâm)'
  };

  const pts = [A, B, C, D, A1, B1, C1, D1, O];
  const proj = {};
  pts.forEach(p => {
    proj[p.label] = project3D(p.x, p.y, p.z, rotX, rotY, zoom, cx, cy);
  });

  if (showFaces) {
    // Đáy trên (ABCD)
    ctx.fillStyle = 'rgba(99, 102, 241, 0.18)';
    ctx.beginPath();
    ctx.moveTo(proj['A'].px, proj['A'].py);
    ctx.lineTo(proj['B'].px, proj['B'].py);
    ctx.lineTo(proj['C'].px, proj['C'].py);
    ctx.lineTo(proj['D'].px, proj['D'].py);
    ctx.closePath();
    ctx.fill();

    // Đáy dưới (A'B'C'D')
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.beginPath();
    ctx.moveTo(proj["A'"].px, proj["A'"].py);
    ctx.lineTo(proj["B'"].px, proj["B'"].py);
    ctx.lineTo(proj["C'"].px, proj["C'"].py);
    ctx.lineTo(proj["D'"].px, proj["D'"].py);
    ctx.closePath();
    ctx.fill();
  }

  // Khung các cạnh
  const edges = [
    ['A', 'B', false], ['B', 'C', false], ['C', 'D', false], ['D', 'A', false],
    ['A', "A'", true], ['B', "B'", false], ['C', "C'", false], ['D', "D'", false],
    ["A'", "B'", true], ["B'", "C'", false], ["C'", "D'", false], ["D'", "A'", true]
  ];

  edges.forEach(([u, v, dash]) => {
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = '#818cf8';
    if (dash) ctx.setLineDash([4, 4]);
    else ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(proj[u].px, proj[u].py);
    ctx.lineTo(proj[v].px, proj[v].py);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // Bốn đường chéo AC', BD', CA', DB'
  if (showDiagonals) {
    const diagList = [
      { u: 'A', v: "C'", col: '#f59e0b' },
      { u: 'B', v: "D'", col: '#10b981' },
      { u: 'C', v: "A'", col: '#ec4899' },
      { u: 'D', v: "B'", col: '#06b6d4' }
    ];

    diagList.forEach(d => {
      ctx.lineWidth = 2;
      ctx.strokeStyle = d.col;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(proj[d.u].px, proj[d.u].py);
      ctx.lineTo(proj[d.v].px, proj[d.v].py);
      ctx.stroke();
      ctx.setLineDash([]);
    });
  }

  // Điểm tâm đối xứng O
  if (showCenter) {
    const prO = proj['O (Tâm)'];
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(prO.px, prO.py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Tâm O', prO.px + 8, prO.py - 5);
  }

  // Các đỉnh
  ['A', 'B', 'C', 'D', "A'", "B'", "C'", "D'"].forEach(lbl => {
    const pr = proj[lbl];
    ctx.fillStyle = '#c7d2fe';
    ctx.beginPath();
    ctx.arc(pr.px, pr.py, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(lbl, pr.px + 6, pr.py - 6);
  });
}

// --- 6. KHỞI TẠO TỔNG THỂ KHI TẢI TRANG (DOM READY) ---
document.addEventListener('DOMContentLoaded', () => {
  renderMathInTree(document.body);

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

      if (target === 'labs') {
        drawLab1();
        drawLab2();
      }
    });
  });

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
      if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập của Bài 13?')) {
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

  const btnPrint = document.getElementById('btnPrintCert');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  initLab1();
  initLab2();
  renderQuiz();
  updateHUD();
});
