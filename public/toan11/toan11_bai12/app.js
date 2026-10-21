// ================================================================
// BÀI 12: ĐƯỜNG THẲNG VÀ MẶT PHẲNG SONG SONG - TOÁN 11 KNTT
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
  userTitle: 'Chuyên Gia Thiết Diện & Quan Hệ Song Song',
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
    if (appState.xp >= 180) certRank.textContent = 'Xuất Sắc (Đại Sư Song Song)';
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

  // Huy hiệu 2: Tương tác Lab 2 (thiết diện)
  if (!appState.badges[1] && appState.labInteractions.lab2) {
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

  // Huy hiệu 5: Hoàn thành 10/10
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
    title: "Câu 1: Vị trí tương đối khi đường thẳng và mặt phẳng không có điểm chung",
    pts: 20,
    question: "Cho đường thẳng $d$ và mặt phẳng $(\\alpha)$. Nếu $d$ và $(\\alpha)$ không có điểm chung thì ta nói:",
    options: [
      { text: "$d$ cắt mặt phẳng $(\\alpha)$ tại vô cực.", correct: false },
      { text: "$d$ song song với mặt phẳng $(\\alpha)$, kí hiệu $d \\parallel (\\alpha)$.", correct: true },
      { text: "$d$ nằm trong mặt phẳng $(\\alpha)$, kí hiệu $d \\subset (\\alpha)$.", correct: false },
      { text: "$d$ chéo nhau với mặt phẳng $(\\alpha)$.", correct: false }
    ],
    explanation: "Theo định nghĩa SGK Bài 12: Nếu đường thẳng $d$ và mặt phẳng $(\\alpha)$ không có điểm chung thì ta nói $d$ song song với $(\\alpha)$ hay $(\\alpha)$ song song với $d$, kí hiệu $d \\parallel (\\alpha)$ hay $(\\alpha) \\parallel d$."
  },
  {
    id: 2,
    title: "Câu 2: Điều kiện để đường thẳng song song với mặt phẳng (Định lí 1 SGK)",
    pts: 20,
    question: "Để chứng minh đường thẳng $a$ song song với mặt phẳng $(P)$, ta cần chứng minh:",
    options: [
      { text: "$a$ song song với hai đường thẳng cắt nhau nằm trong $(P)$.", correct: false },
      { text: "$a$ không nằm trong $(P)$ và song song với một đường thẳng $b$ nằm trong $(P)$.", correct: true },
      { text: "$a$ cắt một đường thẳng $b$ nằm trong $(P)$.", correct: false },
      { text: "$a$ và $(P)$ cùng vuông góc với một đường thẳng thứ ba.", correct: false }
    ],
    explanation: "Theo Định lí 1 (SGK Bài 12): Nếu đường thẳng $a$ không nằm trong mặt phẳng $(P)$ và song song với một đường thẳng $b$ nằm trong $(P)$ thì $a$ song song với $(P)$."
  },
  {
    id: 3,
    title: "Câu 3: Mệnh đề đúng về mối liên hệ đường và mặt (Bài 4.16a SGK)",
    pts: 20,
    question: "Trong không gian, cho đường thẳng $a$ và mặt phẳng $(P)$. Mệnh đề nào sau đây là **đúng**?",
    options: [
      { text: "Nếu $a$ và $(P)$ có điểm chung thì $a$ không song song với $(P)$.", correct: true },
      { text: "Nếu $a$ và $(P)$ có điểm chung thì $a$ và $(P)$ bắt buộc phải cắt nhau.", correct: false },
      { text: "Nếu $a$ song song với $b$ và $b \\subset (P)$ thì chắc chắn $a \\parallel (P)$.", correct: false },
      { text: "Nếu $a \\parallel (P)$ và $b \\parallel (P)$ thì chắc chắn $a \\parallel b$.", correct: false }
    ],
    explanation: "Nếu $a$ và $(P)$ có điểm chung thì hoặc $a$ cắt $(P)$ (có 1 điểm chung), hoặc $a \\subset (P)$ (có vô số điểm chung). Cả hai trường hợp này đều không phải là $a \\parallel (P)$ (vốn đòi hỏi không có điểm chung nào)."
  },
  {
    id: 4,
    title: "Câu 4: Vị trí của hai đường thẳng cùng song song một mặt phẳng (Bài 4.16d SGK)",
    pts: 20,
    question: "Trong không gian, cho hai đường thẳng phân biệt $a$ và $b$ cùng song song với mặt phẳng $(P)$. Vị trí tương đối của $a$ và $b$ có thể là:",
    options: [
      { text: "Chắc chắn $a$ và $b$ phải song song với nhau.", correct: false },
      { text: "Chắc chắn $a$ và $b$ phải cắt nhau.", correct: false },
      { text: "$a$ và $b$ có thể song song, cắt nhau hoặc chéo nhau.", correct: true },
      { text: "Chắc chắn $a$ và $b$ phải chéo nhau.", correct: false }
    ],
    explanation: "Hai đường thẳng cùng song song với một mặt phẳng có thể song song với nhau, cắt nhau (tạo thành một mặt phẳng song song với $(P)$) hoặc chéo nhau (nằm ở các độ cao hoặc phương khác nhau)."
  },
  {
    id: 5,
    title: "Câu 5: Đường trung bình song song mặt phẳng (Bài 4.17b SGK)",
    pts: 20,
    question: "Cho hai tam giác $ABC$ và $ABD$ không cùng nằm trong một mặt phẳng. Gọi $M, N$ lần lượt là trung điểm của $AC$ và $AD$. Khẳng định nào sau đây là đúng?",
    options: [
      { text: "Đường thẳng $MN$ cắt mặt phẳng $(BCD)$.", correct: false },
      { text: "Đường thẳng $MN$ nằm trong mặt phẳng $(BCD)$.", correct: false },
      { text: "Đường thẳng $MN$ song song với mặt phẳng $(BCD)$.", correct: true },
      { text: "Đường thẳng $MN$ chéo nhau với mặt phẳng $(BCD)$.", correct: false }
    ],
    explanation: "Trong $\\triangle ACD$, $MN$ là đường trung bình nên $MN \\parallel CD$. Mà $CD \\subset (BCD)$ và $MN \\not\\subset (BCD)$. Theo Định lí 1, ta suy ra $MN \\parallel (BCD)$."
  },
  {
    id: 6,
    title: "Câu 6: Tính chất giao tuyến của mặt phẳng chứa đường song song (Định lí 2 SGK)",
    pts: 20,
    question: "Cho đường thẳng $a$ song song với mặt phẳng $(P)$. Nếu mặt phẳng $(Q)$ chứa $a$ và cắt $(P)$ theo giao tuyến $b$ thì:",
    options: [
      { text: "$b$ song song với $a$.", correct: true },
      { text: "$b$ cắt $a$.", correct: false },
      { text: "$b$ chéo nhau với $a$.", correct: false },
      { text: "$b$ vuông góc với $a$.", correct: false }
    ],
    explanation: "Theo Định lí 2 (SGK Bài 12): Cho đường thẳng $a$ song song với mặt phẳng $(P)$. Nếu mặt phẳng $(Q)$ chứa $a$ và cắt $(P)$ theo giao tuyến $b$ thì $b$ song song với $a$."
  },
  {
    id: 7,
    title: "Câu 7: Mặt phẳng chứa đường thẳng này và song song với đường thẳng kia",
    pts: 20,
    question: "Cho hai đường thẳng chéo nhau $a$ và $b$. Có bao nhiêu mặt phẳng chứa đường thẳng $a$ và song song với đường thẳng $b$?",
    options: [
      { text: "Không có mặt phẳng nào.", correct: false },
      { text: "Có đúng 1 mặt phẳng duy nhất.", correct: true },
      { text: "Có đúng 2 mặt phẳng phân biệt.", correct: false },
      { text: "Có vô số mặt phẳng.", correct: false }
    ],
    explanation: "Theo tính chất SGK Bài 12: Cho trước hai đường thẳng chéo nhau, có duy nhất một mặt phẳng chứa đường thẳng này và song song với đường thẳng kia."
  },
  {
    id: 8,
    title: "Câu 8: Thiết diện của tứ diện song song với hai cạnh đối (Ví dụ 4 SGK)",
    pts: 20,
    question: "Cho tứ diện $ABCD$. Điểm $E$ nằm trên cạnh $AC$. Mặt phẳng $(P)$ đi qua $E$ và song song với cả hai cạnh đối $AB$ và $CD$. Thiết diện của tứ diện $ABCD$ cắt bởi $(P)$ là hình gì?",
    options: [
      { text: "Tam giác đều.", correct: false },
      { text: "Hình bình hành.", correct: true },
      { text: "Hình thang không cân.", correct: false },
      { text: "Hình ngũ giác.", correct: false }
    ],
    explanation: "Mặt phẳng $(P)$ cắt $(ABC)$ và $(ABD)$ theo hai đoạn giao tuyến $EF \\parallel AB$ và $GH \\parallel AB$; cắt $(ACD)$ và $(BCD)$ theo hai đoạn $EH \\parallel CD$ và $FG \\parallel CD$. Tứ giác $EFGH$ có các cặp cạnh đối song song nên luôn là hình bình hành."
  },
  {
    id: 9,
    title: "Câu 9: Thiết diện song song trong hình chóp đáy hình thang (Bài 4.19 SGK)",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình thang ($AB \\parallel CD$). Gọi $E$ là một điểm nằm giữa $S$ và $A$. Mặt phẳng $(P)$ qua $E$ và song song với $AB$ và $AD$. Thiết diện tạo bởi $(P)$ và các mặt bên của hình chóp là hình gì?",
    options: [
      { text: "Hình bình hành.", correct: false },
      { text: "Hình thang.", correct: true },
      { text: "Tam giác.", correct: false },
      { text: "Hình chữ nhật.", correct: false }
    ],
    explanation: "Mặt phẳng $(P)$ cắt $(SAB)$ theo giao tuyến qua $E$ song song với $AB$; cắt $(SAD)$ theo giao tuyến qua $E$ song song với $AD$. Thiết diện tạo bởi $(P)$ và các mặt bên của hình chóp là một hình thang vì có hai cạnh đối song song với đáy hình thang $ABCD$."
  },
  {
    id: 10,
    title: "Câu 10: Ứng dụng thực tiễn của quan hệ song song (Bài 4.20 SGK)",
    pts: 20,
    question: "Bạn Nam quan sát thấy dù cánh cửa ra vào hình chữ nhật được mở ở bất kì vị trí nào, mép trên của cánh cửa luôn luôn:",
    options: [
      { text: "Song song với mặt phẳng sàn nhà cố định.", correct: true },
      { text: "Vuông góc với mặt phẳng sàn nhà cố định.", correct: false },
      { text: "Cắt mặt phẳng sàn nhà cố định.", correct: false },
      { text: "Chéo nhau với mặt phẳng sàn nhà cố định.", correct: false }
    ],
    explanation: "Mép trên cánh cửa song song với mép dưới cánh cửa (nằm trên sàn nhà). Theo Định lí 1, mép trên luôn song song với mặt phẳng sàn nhà cố định dù cửa được mở ở bất kì góc độ nào."
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

// --- 4. PHÒNG THÍ NGHIỆM 1: KHẢO SÁT VỊ TRÍ TƯƠNG ĐỐI ĐT VÀ MP 3D ---
let lab1State = {
  posMode: 'parallel', // 'parallel' | 'intersect' | 'inside'
  rotX: 25 * Math.PI / 180,
  rotY: -30 * Math.PI / 180,
  zoom: 1.0,
  h: 60,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  autoRotate: false
};

function initLab1() {
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;

  const btnPar = document.getElementById('btnPosParallel');
  const btnInt = document.getElementById('btnPosIntersect');
  const btnIns = document.getElementById('btnPosInside');
  const btnReset = document.getElementById('btnResetRot1');
  const sliderH = document.getElementById('sliderH1');
  const valH = document.getElementById('valH1');
  const chkAuto = document.getElementById('chkAutoRot1');
  const statusBadge = document.getElementById('lab1StatusBadge');
  const descEl = document.getElementById('lab1Description');

  function setMode(mode) {
    lab1State.posMode = mode;
    btnPar.classList.toggle('active', mode === 'parallel');
    btnInt.classList.toggle('active', mode === 'intersect');
    btnIns.classList.toggle('active', mode === 'inside');

    if (mode === 'parallel') {
      lab1State.h = 60;
      if (sliderH) sliderH.value = 60;
      if (valH) valH.textContent = '60 px';
      if (statusBadge) statusBadge.textContent = 'Đang chọn: a // (P)';
      if (descEl) {
        descEl.innerHTML = `Đường thẳng <strong>$a$</strong> (xanh neon) nằm ngoài $(P)$ và song song với đường thẳng <strong>$b$</strong> (vàng hổ phách) nằm trong $(P)$. Do đó $a \\parallel (P)$, không có điểm chung.`;
        renderMathInTree(descEl);
      }
    } else if (mode === 'intersect') {
      if (statusBadge) statusBadge.textContent = 'Đang chọn: a ∩ (P) = {M}';
      if (descEl) {
        descEl.innerHTML = `Đường thẳng <strong>$a$</strong> nghiêng và đâm xuyên qua mặt phẳng $(P)$ tại điểm chung duy nhất <strong>$M$</strong> (chấm đỏ). $a \\cap (P) = \\{M\\}$.`;
        renderMathInTree(descEl);
      }
    } else if (mode === 'inside') {
      lab1State.h = 0;
      if (sliderH) sliderH.value = 0;
      if (valH) valH.textContent = '0 px';
      if (statusBadge) statusBadge.textContent = 'Đang chọn: a ⊂ (P)';
      if (descEl) {
        descEl.innerHTML = `Độ cao $h = 0$, đường thẳng <strong>$a$</strong> nằm trọn vẹn bên trong mặt phẳng $(P)$: $a \\subset (P)$. Mọi điểm trên $a$ đều là điểm chung với $(P)$.`;
        renderMathInTree(descEl);
      }
    }
    appState.labInteractions.lab1 = true;
    checkBadges();
    drawLab1();
  }

  if (btnPar) btnPar.addEventListener('click', () => setMode('parallel'));
  if (btnInt) btnInt.addEventListener('click', () => setMode('intersect'));
  if (btnIns) btnIns.addEventListener('click', () => setMode('inside'));

  if (sliderH) {
    sliderH.addEventListener('input', (e) => {
      lab1State.h = parseFloat(e.target.value);
      if (valH) valH.textContent = `${lab1State.h} px`;
      if (lab1State.h === 0) {
        lab1State.posMode = 'inside';
        btnIns.classList.add('active');
        btnPar.classList.remove('active');
        btnInt.classList.remove('active');
      } else if (lab1State.posMode === 'inside') {
        lab1State.posMode = 'parallel';
        btnPar.classList.add('active');
        btnIns.classList.remove('active');
      }
      drawLab1();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      lab1State.rotX = 25 * Math.PI / 180;
      lab1State.rotY = -30 * Math.PI / 180;
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

  function anim() {
    if (lab1State.autoRotate) {
      lab1State.rotY += 0.008;
      drawLab1();
    }
    requestAnimationFrame(anim);
  }
  requestAnimationFrame(anim);

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
  const cy = h / 2 + 20;

  ctx.clearRect(0, 0, w, h);

  const bgGrad = ctx.createRadialGradient(cx, cy, 30, cx, cy, 350);
  bgGrad.addColorStop(0, '#111827');
  bgGrad.addColorStop(1, '#030712');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, w, h);

  const { rotX, rotY, zoom, posMode, h: hVal } = lab1State;

  // 1. Vẽ mặt phẳng (P) nằm ngang tại y = -30
  const yPlane = -30;
  const P_TL = project3D(-140, yPlane, -90, rotX, rotY, zoom, cx, cy);
  const P_TR = project3D(140, yPlane, -90, rotX, rotY, zoom, cx, cy);
  const P_BR = project3D(160, yPlane, 90, rotX, rotY, zoom, cx, cy);
  const P_BL = project3D(-120, yPlane, 90, rotX, rotY, zoom, cx, cy);

  ctx.fillStyle = 'rgba(99, 102, 241, 0.16)';
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(P_TL.px, P_TL.py);
  ctx.lineTo(P_TR.px, P_TR.py);
  ctx.lineTo(P_BR.px, P_BR.py);
  ctx.lineTo(P_BL.px, P_BL.py);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#a5b4fc';
  ctx.font = 'bold 15px sans-serif';
  ctx.fillText('Mặt phẳng (P)', P_BL.px + 10, P_BL.py - 10);

  // 2. Đường thẳng b nằm trong (P)
  const b_start = project3D(-110, yPlane, 20, rotX, rotY, zoom, cx, cy);
  const b_end   = project3D(120, yPlane, 20, rotX, rotY, zoom, cx, cy);

  ctx.lineWidth = 3;
  ctx.strokeStyle = '#f59e0b';
  ctx.shadowColor = '#f59e0b';
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.moveTo(b_start.px, b_start.py);
  ctx.lineTo(b_end.px, b_end.py);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = '#f59e0b';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('Đường thẳng b ⊂ (P)', b_end.px + 8, b_end.py + 4);

  // 3. Đường thẳng a
  if (posMode === 'parallel' || posMode === 'inside') {
    const yA = yPlane + hVal;
    const a_start = project3D(-110, yA, 20, rotX, rotY, zoom, cx, cy);
    const a_end   = project3D(120, yA, 20, rotX, rotY, zoom, cx, cy);

    // Đường dóng cao nếu h > 0
    if (hVal > 5) {
      ctx.setLineDash([4, 4]);
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.5)';
      ctx.lineWidth = 1;
      const d1_bot = project3D(-60, yPlane, 20, rotX, rotY, zoom, cx, cy);
      const d1_top = project3D(-60, yA, 20, rotX, rotY, zoom, cx, cy);
      ctx.beginPath();
      ctx.moveTo(d1_bot.px, d1_bot.py);
      ctx.lineTo(d1_top.px, d1_top.py);
      ctx.stroke();

      const d2_bot = project3D(60, yPlane, 20, rotX, rotY, zoom, cx, cy);
      const d2_top = project3D(60, yA, 20, rotX, rotY, zoom, cx, cy);
      ctx.beginPath();
      ctx.moveTo(d2_bot.px, d2_bot.py);
      ctx.lineTo(d2_top.px, d2_top.py);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#06b6d4';
      ctx.font = '12px sans-serif';
      ctx.fillText(`h = ${hVal}px`, d2_top.px + 8, (d2_top.py + d2_bot.py) / 2);
    }

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(a_start.px, a_start.py);
    ctx.lineTo(a_end.px, a_end.py);
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 14px sans-serif';
    if (hVal === 0) {
      ctx.fillText('Đường thẳng a ≡ b ⊂ (P)', a_start.px - 60, a_start.py - 10);
    } else {
      ctx.fillText('Đường thẳng a // b // (P)', a_end.px + 8, a_end.py + 4);
    }

  } else if (posMode === 'intersect') {
    // a cắt (P) tại điểm M
    const a_top = project3D(-80, yPlane + 70, -20, rotX, rotY, zoom, cx, cy);
    const M_pt  = project3D(10, yPlane, 10, rotX, rotY, zoom, cx, cy);
    const a_bot = project3D(100, yPlane - 70, 40, rotX, rotY, zoom, cx, cy);

    // Nửa trên a
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(a_top.px, a_top.py);
    ctx.lineTo(M_pt.px, M_pt.py);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Nửa dưới a (nét đứt vì bị mặt phẳng che khuất)
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
    ctx.beginPath();
    ctx.moveTo(M_pt.px, M_pt.py);
    ctx.lineTo(a_bot.px, a_bot.py);
    ctx.stroke();
    ctx.setLineDash([]);

    // Điểm giao M
    ctx.fillStyle = '#ef4444';
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(M_pt.px, M_pt.py, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Giao điểm M', M_pt.px + 10, M_pt.py - 6);
  }
}

// --- 5. PHÒNG THÍ NGHIỆM 2: DỰNG THIẾT DIỆN SONG SONG TRONG TỨ DIỆN 3D ---
let lab2State = {
  k: 0.45, // Tỉ số AE / AC
  rotX: 20 * Math.PI / 180,
  rotY: -35 * Math.PI / 180,
  zoom: 1.0,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0,
  showPlaneAlpha: true
};

function initLab2() {
  const canvas = document.getElementById('canvasLab2');
  if (!canvas) return;

  const sliderE = document.getElementById('sliderEPos');
  const valE = document.getElementById('valEPos');
  const chkAlpha = document.getElementById('chkShowPlaneAlpha');
  const btnReset = document.getElementById('btnResetRot2');

  if (sliderE) {
    sliderE.addEventListener('input', (e) => {
      lab2State.k = parseFloat(e.target.value) / 100;
      if (valE) valE.textContent = lab2State.k.toFixed(2);
      appState.labInteractions.lab2 = true;
      checkBadges();
      drawLab2();
    });
  }

  if (chkAlpha) {
    chkAlpha.addEventListener('change', (e) => {
      lab2State.showPlaneAlpha = e.target.checked;
      drawLab2();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      lab2State.rotX = 20 * Math.PI / 180;
      lab2State.rotY = -35 * Math.PI / 180;
      lab2State.zoom = 1.0;
      drawLab2();
    });
  }

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

function interp(P1, P2, t) {
  return {
    x: P1.x + (P2.x - P1.x) * t,
    y: P1.y + (P2.y - P1.y) * t,
    z: P1.z + (P2.z - P1.z) * t
  };
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

  const { rotX, rotY, zoom, k, showPlaneAlpha } = lab2State;

  // Tứ diện ABCD
  const A = { x: 0, y: 130, z: 0, label: 'A' };
  const B = { x: -110, y: -70, z: -50, label: 'B' };
  const C = { x: -20, y: -80, z: 90, label: 'C' };
  const D = { x: 120, y: -70, z: -40, label: 'D' };

  // E ∈ AC: AE / AC = k
  const E = interp(A, C, k);
  E.label = 'E';

  // F ∈ BC: EF // AB => CF / CB = CE / CA = (1 - k)
  const F = interp(C, B, 1 - k);
  F.label = 'F';

  // H ∈ AD: EH // CD => AH / AD = AE / AC = k
  const H = interp(A, D, k);
  H.label = 'H';

  // G ∈ BD: FG // CD và GH // AB => BG / BD = k
  const G = interp(B, D, k);
  G.label = 'G';

  const pts = [A, B, C, D, E, F, G, H];
  const proj = {};
  pts.forEach(p => {
    proj[p.label] = project3D(p.x, p.y, p.z, rotX, rotY, zoom, cx, cy);
  });

  // Vẽ các mặt bên tứ diện
  const faces = [
    ['A', 'B', 'C', 'rgba(99, 102, 241, 0.08)'],
    ['A', 'C', 'D', 'rgba(6, 182, 212, 0.08)'],
    ['B', 'C', 'D', 'rgba(245, 158, 11, 0.05)']
  ];
  faces.forEach(([p1, p2, p3, col]) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(proj[p1].px, proj[p1].py);
    ctx.lineTo(proj[p2].px, proj[p2].py);
    ctx.lineTo(proj[p3].px, proj[p3].py);
    ctx.closePath();
    ctx.fill();
  });

  // Cạnh tứ diện: BD ở phía sau vẽ nét đứt
  const edges = [
    ['A', 'B', false], ['A', 'C', false], ['A', 'D', false],
    ['B', 'C', false], ['C', 'D', false],
    ['B', 'D', true] // nét đứt
  ];

  edges.forEach(([u, v, dash]) => {
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    if (dash) ctx.setLineDash([4, 4]);
    else ctx.setLineDash([]);
    ctx.beginPath();
    ctx.moveTo(proj[u].px, proj[u].py);
    ctx.lineTo(proj[v].px, proj[v].py);
    ctx.stroke();
    ctx.setLineDash([]);
  });

  // 2 Cạnh định hướng: AB (xanh lục) và CD (vàng hổ phách)
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#10b981';
  ctx.beginPath();
  ctx.moveTo(proj['A'].px, proj['A'].py);
  ctx.lineTo(proj['B'].px, proj['B'].py);
  ctx.stroke();

  ctx.strokeStyle = '#f59e0b';
  ctx.beginPath();
  ctx.moveTo(proj['C'].px, proj['C'].py);
  ctx.lineTo(proj['D'].px, proj['D'].py);
  ctx.stroke();

  // Tô màu mặt phẳng thiết diện (P) nếu bật
  if (showPlaneAlpha) {
    ctx.fillStyle = 'rgba(236, 72, 153, 0.25)';
    ctx.beginPath();
    ctx.moveTo(proj['E'].px, proj['E'].py);
    ctx.lineTo(proj['F'].px, proj['F'].py);
    ctx.lineTo(proj['G'].px, proj['G'].py);
    ctx.lineTo(proj['H'].px, proj['H'].py);
    ctx.closePath();
    ctx.fill();
  }

  // Viền thiết diện EFGH (Hình bình hành neon hồng rực rỡ)
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ec4899';
  ctx.shadowColor = '#ec4899';
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(proj['E'].px, proj['E'].py);
  ctx.lineTo(proj['F'].px, proj['F'].py);
  ctx.lineTo(proj['G'].px, proj['G'].py);
  ctx.lineTo(proj['H'].px, proj['H'].py);
  ctx.closePath();
  ctx.stroke();
  ctx.shadowBlur = 0;

  // Các điểm đỉnh tứ diện
  ['A', 'B', 'C', 'D'].forEach(lbl => {
    const pr = proj[lbl];
    ctx.fillStyle = '#6366f1';
    ctx.beginPath();
    ctx.arc(pr.px, pr.py, 5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(lbl, pr.px + 7, pr.py - 6);
  });

  // Các điểm thiết diện E, F, G, H
  ['E', 'F', 'G', 'H'].forEach(lbl => {
    const pr = proj[lbl];
    ctx.fillStyle = '#ec4899';
    ctx.beginPath();
    ctx.arc(pr.px, pr.py, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fbcfe8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(lbl, pr.px + 8, pr.py - 5);
  });

  ctx.fillStyle = '#ec4899';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`Thiết diện EFGH (k = ${k.toFixed(2)})`, proj['H'].px + 10, proj['H'].py + 20);
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
      if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập của Bài 12?')) {
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
