/**
 * TOÁN 11 KẾT NỐI TRI THỨC - THỰC HÀNH TRẢI NGHIỆM 2: LỰC CĂNG MẶT NGOÀI CỦA NƯỚC
 * Pure Vanilla Web Stack (HTML5, CSS3, JavaScript ES6+, Web Audio API, Canvas 2D)
 * 100% Offline-capable, KaTeX & MathML fallback, Cyber Logic Aesthetics
 */

// --- 1. STATE MANAGEMENT ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nhà Thực Nghiệm Thống Kê & Vật Lí',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// --- 2. WEB AUDIO API SOUND SYSTEM ---
const AudioContextClass = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;

function initAudio() {
  if (!audioCtx && AudioContextClass) {
    audioCtx = new AudioContextClass();
  }
}

function playTone(freq, type, duration, gainVal = 0.1) {
  if (!appState.sound) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn("Audio error:", e);
  }
}

function playClick() {
  playTone(450, 'sine', 0.08, 0.05);
}

function playPop() {
  if (!appState.sound) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.08);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  } catch (e) {}
}

function playCorrect() {
  if (!appState.sound) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);
    osc.frequency.setValueAtTime(659.25, now + 0.1);
    osc.frequency.setValueAtTime(783.99, now + 0.2);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.4);
  } catch (e) {}
}

function playWrong() {
  if (!appState.sound) return;
  try {
    initAudio();
    if (!audioCtx) return;
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.setValueAtTime(180, now + 0.15);
    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  } catch (e) {}
}

function playFanfare() {
  if (!appState.sound) return;
  const notes = [523.25, 659.25, 783.99, 1046.50];
  notes.forEach((freq, idx) => {
    setTimeout(() => {
      playTone(freq, 'sine', 0.35, 0.15);
    }, idx * 120);
  });
}

function playBadge() {
  playTone(880, 'sine', 0.4, 0.15);
}

// --- 3. KATEX & MATHML FALLBACK ---
function latexToMathML(latex) {
  let clean = latex.trim();
  clean = clean.replace(/\\bar\{x\}/g, '<mover><mi>x</mi><mo>&macr;</mo></mover>');
  clean = clean.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  clean = clean.replace(/\\approx/g, '<mo>&asymp;</mo>');
  clean = clean.replace(/\\circ/g, '<mo>&deg;</mo>');
  return `<math xmlns="http://www.w3.org/1998/Math/MathML">${clean}</math>`;
}

function formatMathText(text) {
  if (!text) return '';
  return text.replace(/\$\$([\s\S]*?)\$\$/g, (m, c) => `<div class="math-block">${latexToMathML(c)}</div>`)
             .replace(/\$([^\$]+?)\$/g, (m, c) => `<span class="math-inline">${latexToMathML(c)}</span>`);
}

function renderMathInTree(root) {
  if (!root) return;
  if (typeof window.renderMathInElement === 'function') {
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
      console.warn("KaTeX render error:", e);
    }
  }
}

// --- 4. DATA CHO ĐẤU TRƯỜNG SGK (10 CÂU THỰC HÀNH LỰC CĂNG MẶT NGOÀI) ---
const quizData = [
  {
    id: 1,
    title: "Cơ Chế Lực Căng Bề Mặt (SGK)",
    pts: 20,
    question: "Tại sao nước nguyên chất rất khó thổi thành bong bóng lớn, nhưng khi hòa thêm xà phòng thì lại thổi được bong bóng to và bền hơn?",
    options: [
      { text: "Vì các phân tử xà phòng làm giảm sức căng bề mặt của nước, giúp màng chất lỏng dễ dãn nở.", correct: true },
      { text: "Vì xà phòng làm tăng khối lượng riêng của nước lên gấp nhiều lần.", correct: false },
      { text: "Vì xà phòng làm bay hơi nhanh toàn bộ các phân tử nước ở màng ngoài.", correct: false },
      { text: "Vì xà phòng làm nước sôi ở nhiệt độ phòng.", correct: false }
    ],
    explanation: "SGK trang 128: Nước nguyên chất có lực căng bề mặt rất lớn kéo các phân tử co cụm lại, khiến màng bong bóng bị co thắt và vỡ ngay. Xà phòng là chất hoạt động bề mặt làm giảm sức căng này, giúp bong bóng dãn nở to hơn."
  },
  {
    id: 2,
    title: "Phương Pháp Đo Đường Kính Thực Nghiệm (SGK HĐ1)",
    pts: 20,
    question: "Trong thí nghiệm SGK trang 128, người ta dùng cách nào để đo chính xác đường kính của bong bóng xà phòng?",
    options: [
      { text: "Đổ nước xà phòng lên tấm nhựa đặt trên giấy kẻ ô li centimet, dùng ống hút thổi bóng nở to đến khi vỡ và đo đường tròn vết nước để lại.", correct: true },
      { text: "Dùng thước kẹp kim loại đo trực tiếp quả bóng khi nó đang bay trong không trung.", correct: false },
      { text: "Thả bong bóng vào ống đong chứa đầy nước để đo thể tích dâng lên.", correct: false },
      { text: "Cân khối lượng quả bóng trên cân điện tử độ chính xác cao.", correct: false }
    ],
    explanation: "SGK trang 128: Bước 2-5: Đặt tờ giấy kẻ ô li dưới tấm nhựa, múc nước xà phòng lên tấm nhựa, dùng ống hút thổi bóng đến khi bóng vỡ và xác định đường kính dựa trên lưới ô li chia centimet."
  },
  {
    id: 3,
    title: "Xác Định Cỡ Mẫu Nhóm 1 - Nhiệt Độ Phòng (SGK HĐ4)",
    pts: 20,
    question: `Quan sát bảng số liệu thực nghiệm của Nhóm 1 (nhiệt độ phòng) từ SGK trang 129:
<div class="quiz-table-wrap">
  <table class="quiz-table">
    <thead>
      <tr>
        <th>Đường kính (cm)</th>
        <th>$[4; 6)$</th>
        <th>$[6; 8)$</th>
        <th>$[8; 10)$</th>
        <th>$[10; 12)$</th>
        <th>$[12; 14)$</th>
        <th>$[14; 16)$</th>
        <th>$[16; 18)$</th>
        <th>$[18; 20)$</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Tần số Nhóm 1</td>
        <td>$1$</td>
        <td>$1$</td>
        <td>$9$</td>
        <td>$9$</td>
        <td>$4$</td>
        <td>$4$</td>
        <td>$1$</td>
        <td>$0$</td>
      </tr>
    </tbody>
  </table>
</div>
Cỡ mẫu $n_1$ của Nhóm 1 là:`,
    options: [
      { text: "$n_1 = 29$", correct: true },
      { text: "$n_1 = 30$", correct: false },
      { text: "$n_1 = 28$", correct: false },
      { text: "$n_1 = 25$", correct: false }
    ],
    explanation: "Tổng tần số của Nhóm 1: $n_1 = 1 + 1 + 9 + 9 + 4 + 4 + 1 + 0 = 29$ lần thổi bong bóng."
  },
  {
    id: 4,
    title: "Xác Định Cỡ Mẫu Nhóm 2 - Nước Nóng (SGK HĐ4)",
    pts: 20,
    question: `Quan sát bảng số liệu thực nghiệm của Nhóm 2 (nước nóng $70^\\circ\\text{C} - 80^\\circ\\text{C}$) từ SGK trang 129:
<div class="quiz-table-wrap">
  <table class="quiz-table">
    <thead>
      <tr>
        <th>Đường kính (cm)</th>
        <th>$[4; 6)$</th>
        <th>$[6; 8)$</th>
        <th>$[8; 10)$</th>
        <th>$[10; 12)$</th>
        <th>$[12; 14)$</th>
        <th>$[14; 16)$</th>
        <th>$[16; 18)$</th>
        <th>$[18; 20)$</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Tần số Nhóm 2</td>
        <td>$0$</td>
        <td>$0$</td>
        <td>$1$</td>
        <td>$2$</td>
        <td>$1$</td>
        <td>$8$</td>
        <td>$8$</td>
        <td>$2$</td>
      </tr>
    </tbody>
  </table>
</div>
Cỡ mẫu $n_2$ của Nhóm 2 là:`,
    options: [
      { text: "$n_2 = 22$", correct: true },
      { text: "$n_2 = 20$", correct: false },
      { text: "$n_2 = 24$", correct: false },
      { text: "$n_2 = 29$", correct: false }
    ],
    explanation: "Tổng tần số của Nhóm 2: $n_2 = 0 + 0 + 1 + 2 + 1 + 8 + 8 + 2 = 22$ lần thổi bong bóng."
  },
  {
    id: 5,
    title: "Tính Số Trung Bình Nhóm 1 (SGK HĐ4a)",
    pts: 20,
    question: "Dựa vào bảng số liệu ghép nhóm của Nhóm 1 (nhiệt độ phòng), số trung bình $\\bar{x}_1$ về đường kính bong bóng xấp xỉ bằng:",
    options: [
      { text: "$\\bar{x}_1 \\approx 11{,}07\\text{ cm}$", correct: true },
      { text: "$\\bar{x}_1 \\approx 9{,}50\\text{ cm}$", correct: false },
      { text: "$\\bar{x}_1 \\approx 13{,}25\\text{ cm}$", correct: false },
      { text: "$\\bar{x}_1 \\approx 15{,}36\\text{ cm}$", correct: false }
    ],
    explanation: "Các giá trị đại diện: $5, 7, 9, 11, 13, 15, 17, 19$. Số trung bình $\\bar{x}_1 = \\frac{1(5) + 1(7) + 9(9) + 9(11) + 4(13) + 4(15) + 1(17) + 0(19)}{29} = \\frac{321}{29} \\approx 11{,}07\\text{ cm}$."
  },
  {
    id: 6,
    title: "Tính Số Trung Bình Nhóm 2 (SGK HĐ4a)",
    pts: 20,
    question: "Dựa vào bảng số liệu ghép nhóm của Nhóm 2 (nước nóng), số trung bình $\\bar{x}_2$ về đường kính bong bóng xấp xỉ bằng:",
    options: [
      { text: "$\\bar{x}_2 \\approx 15{,}36\\text{ cm}$", correct: true },
      { text: "$\\bar{x}_2 \\approx 11{,}07\\text{ cm}$", correct: false },
      { text: "$\\bar{x}_2 \\approx 17{,}50\\text{ cm}$", correct: false },
      { text: "$\\bar{x}_2 \\approx 13{,}80\\text{ cm}$", correct: false }
    ],
    explanation: "Các giá trị đại diện: $5, 7, 9, 11, 13, 15, 17, 19$. Số trung bình $\\bar{x}_2 = \\frac{0(5) + 0(7) + 1(9) + 2(11) + 1(13) + 8(15) + 8(17) + 2(19)}{22} = \\frac{338}{22} \\approx 15{,}36\\text{ cm}$."
  },
  {
    id: 7,
    title: "Nhóm Chứa Trung Vị Của Hai Mẫu Thực Nghiệm",
    pts: 20,
    question: "Nhóm chứa trung vị $M_e$ của mẫu số liệu Nhóm 1 và Nhóm 2 lần lượt là:",
    options: [
      { text: "$[10; 12)$ và $[14; 16)$", correct: true },
      { text: "$[8; 10)$ và $[16; 18)$", correct: false },
      { text: "$[10; 12)$ và $[16; 18)$", correct: false },
      { text: "$[12; 14)$ và $[14; 16)$", correct: false }
    ],
    explanation: "Nhóm 1 có $n_1 = 29 \\implies \\frac{n_1}{2} = 14{,}5$. Tần số tích lũy: $1, 2, 11, 20$, do đó trung vị thuộc nhóm $[10; 12)$. Nhóm 2 có $n_2 = 22 \\implies \\frac{n_2}{2} = 11$. Tần số tích lũy: $0, 0, 1, 3, 4, 12$, do đó trung vị thuộc nhóm $[14; 16)$."
  },
  {
    id: 8,
    title: "Kết Luận Vật Lí Về Lực Căng Mặt Ngoài (SGK HĐ4a)",
    pts: 20,
    question: "So sánh kết quả số trung bình $\\bar{x}_2 \\approx 15{,}36\\text{ cm} > \\bar{x}_1 \\approx 11{,}07\\text{ cm}$, ta rút ra kết luận khoa học nào?",
    options: [
      { text: "Nhiệt độ dung dịch tăng làm giảm sức căng mặt ngoài của nước, giúp bong bóng nở to hơn.", correct: true },
      { text: "Nhiệt độ dung dịch tăng làm tăng sức căng mặt ngoài của nước.", correct: false },
      { text: "Nhiệt độ không ảnh hưởng gì đến kích thước bong bóng xà phòng.", correct: false },
      { text: "Nước nóng làm bóng nặng hơn nên mau rơi xuống đất hơn.", correct: false }
    ],
    explanation: "Vì đường kính trung bình của bong bóng thổi từ nước nóng lớn hơn rõ rệt so với nước ở nhiệt độ phòng ($15{,}36\\text{ cm} > 11{,}07\\text{ cm}$), chứng tỏ lực căng mặt ngoài của nước xà phòng giảm đi khi nhiệt độ tăng."
  },
  {
    id: 9,
    title: "Giải Thích Hiện Tượng Đời Sống (SGK HĐ4b)",
    pts: 20,
    question: "Tại sao khi giặt quần áo bằng nước ấm ($40^\\circ\\text{C} - 50^\\circ\\text{C}$) lại giúp tẩy sạch vết bẩn nhanh chóng và hiệu quả hơn nước lạnh?",
    options: [
      { text: "Vì nước ấm làm giảm lực căng bề mặt của nước, giúp dung dịch xà phòng dễ dàng thấm sâu vào các sợi vải li ti để đánh bật vết bẩn.", correct: true },
      { text: "Vì nước ấm làm vải co lại cứng hơn.", correct: false },
      { text: "Vì nước ấm làm bay hơi toàn bộ xà phòng.", correct: false },
      { text: "Vì nước ấm làm tăng độ ma sát giữa các sợi chỉ.", correct: false }
    ],
    explanation: "Nhiệt độ cao làm giảm sức căng mặt ngoài của nước, cho phép nước xà phòng len lỏi và thấm ướt bề mặt các sợi vải sâu hơn, bọc lấy các hạt bụi bẩn và dầu mỡ để cuốn trôi dễ dàng."
  },
  {
    id: 10,
    title: "Vai Trò Của Mẫu Số Liệu Ghép Nhóm",
    pts: 20,
    question: "Trong nghiên cứu thực nghiệm khoa học, lợi ích lớn nhất của việc ghép nhóm các dữ liệu đo đạc liên tục (như kích thước, khối lượng, thời gian) là gì?",
    options: [
      { text: "Cô đọng lượng số liệu lớn, phản ánh bức tranh phân bố tổng thể và thuận lợi cho việc so sánh các mẫu thực nghiệm.", correct: true },
      { text: "Làm mất hoàn toàn các sai số ngẫu nhiên của thí nghiệm.", correct: false },
      { text: "Tăng số lượng quan sát ban đầu lên gấp đôi.", correct: false },
      { text: "Loại bỏ hoàn toàn sự cần thiết của các phép tính thống kê.", correct: false }
    ],
    explanation: "Mẫu số liệu ghép nhóm giúp biểu diễn gọn gàng các biến số liên tục thu được trong thực nghiệm, cho phép tính toán các số đặc trưng đại diện và so sánh trực quan hiệu quả giữa các điều kiện thí nghiệm."
  }
];

// --- 5. RENDER QUIZ & INTERACTION ---
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];

  quizData.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard-${q.id}`;

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `<span>Câu ${idx + 1}: ${q.title}</span><span class="quiz-badge">+${q.pts} XP</span>`;
    card.appendChild(header);

    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    const optsDiv = document.createElement('div');
    optsDiv.className = 'quiz-options';

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.id = `btn-${q.id}-${optIndex}`;
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;
      btn.addEventListener('click', () => handleOptionClick(q, optIndex));
      optsDiv.appendChild(btn);
    });
    card.appendChild(optsDiv);

    const expDiv = document.createElement('div');
    expDiv.className = 'explanation-box';
    expDiv.id = `exp-${q.id}`;
    expDiv.innerHTML = `<strong>💡 Phân tích giải thích chi tiết:</strong> ${q.explanation}`;
    card.appendChild(expDiv);

    container.appendChild(card);
  });

  renderMathInTree(container);
}

function handleOptionClick(q, chosenIndex) {
  if (appState.answered[q.id] !== undefined) return;
  appState.answered[q.id] = chosenIndex;

  const isCorrect = q.options[chosenIndex].correct;
  const chosenBtn = document.getElementById(`btn-${q.id}-${chosenIndex}`);
  const expBox = document.getElementById(`exp-${q.id}`);

  q.options.forEach((opt, idx) => {
    const btn = document.getElementById(`btn-${q.id}-${idx}`);
    btn.disabled = true;
    if (opt.correct) {
      btn.classList.add('correct');
    }
  });

  if (isCorrect) {
    chosenBtn.classList.add('correct');
    appState.xp += q.pts;
    appState.streak += 1;
    playCorrect();
    checkBadges();
  } else {
    chosenBtn.classList.add('wrong');
    appState.streak = 0;
    playWrong();
  }

  if (expBox) expBox.classList.add('show');
  updateHUD();
}

function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (progEl) {
    const answeredCount = Object.keys(appState.answered).length;
    progEl.textContent = `${answeredCount}/10`;
  }
  if (scoreEl) scoreEl.textContent = `${appState.xp} XP`;

  if (starEl) {
    let stars = 2;
    if (appState.xp >= 60) stars = 3;
    if (appState.xp >= 120) stars = 4;
    if (appState.xp >= 180) stars = 5;
    appState.stars = stars;
    let s = '';
    for (let i = 1; i <= 5; i++) {
      s += i <= stars ? '⭐' : '☆';
    }
    starEl.textContent = s;
  }
}

function checkBadges() {
  const answeredCount = Object.keys(appState.answered).length;
  if (answeredCount >= 1 && !appState.badges[0]) {
    unlockBadge(1);
  }
  if (appState.streak >= 3 && !appState.badges[1]) {
    unlockBadge(2);
  }
  if (appState.xp >= 160 && !appState.badges[3]) {
    unlockBadge(4);
  }
  let correctCount = 0;
  quizData.forEach(q => {
    const ans = appState.answered[q.id];
    if (ans !== undefined && q.options[ans].correct) {
      correctCount++;
    }
  });
  if (correctCount === 10 && !appState.badges[4]) {
    unlockBadge(5);
    playFanfare();
  }
}

function unlockBadge(badgeNum) {
  const idx = badgeNum - 1;
  appState.badges[idx] = true;
  const badgeCard = document.getElementById(`badge-${badgeNum}`);
  if (badgeCard) {
    badgeCard.classList.remove('locked');
    badgeCard.classList.add('unlocked');
  }
  playBadge();
}

// --- 6. PHÒNG THÍ NGHIỆM 1: THÍ NGHIỆM ẢO THỔI BONG BÓNG ---
let bubbleAnim = {
  active: false,
  r: 0,
  maxR: 0,
  popped: false,
  timer: null
};

function initLab1() {
  const tempSelect = document.getElementById('tempSelect');
  const btnBlow = document.getElementById('btnBlowBubble');
  const btnReset = document.getElementById('btnResetBubble');

  function resetLab1Canvas() {
    bubbleAnim.active = false;
    bubbleAnim.r = 0;
    bubbleAnim.popped = false;
    if (bubbleAnim.timer) cancelAnimationFrame(bubbleAnim.timer);
    drawLab1Canvas(0, false);
    const out = document.getElementById('lab1Output');
    if (out) out.innerHTML = "Nhấn <strong>Thổi bóng thực nghiệm</strong> để quan sát quá trình dãn nở và vỡ màng xà phòng.";
  }

  if (btnReset) btnReset.addEventListener('click', resetLab1Canvas);

  if (btnBlow) btnBlow.addEventListener('click', () => {
    if (bubbleAnim.active) return;
    const mode = tempSelect.value;
    // Set max diameter according to physics temperature
    let maxDiam = 0;
    if (mode === 'cold') maxDiam = 8 + Math.random() * 3; // 8 - 11 cm
    else if (mode === 'room') maxDiam = 9 + Math.random() * 5; // 9 - 14 cm (mean ~11)
    else maxDiam = 13 + Math.random() * 6; // 13 - 19 cm (mean ~15.5)

    bubbleAnim.active = true;
    bubbleAnim.popped = false;
    bubbleAnim.r = 2;
    bubbleAnim.maxR = (maxDiam / 2) * 14; // scale to px

    let soundTick = 0;

    function step() {
      bubbleAnim.r += 1.2;
      soundTick++;
      if (soundTick % 6 === 0) {
        playTone(300 + bubbleAnim.r * 3, 'sine', 0.05, 0.05);
      }

      if (bubbleAnim.r >= bubbleAnim.maxR) {
        bubbleAnim.popped = true;
        bubbleAnim.active = false;
        playPop();
        drawLab1Canvas(bubbleAnim.maxR, true);
        renderLab1Output(mode, maxDiam);
        if (!appState.badges[0]) unlockBadge(1);
        return;
      }

      drawLab1Canvas(bubbleAnim.r, false);
      bubbleAnim.timer = requestAnimationFrame(step);
    }

    bubbleAnim.timer = requestAnimationFrame(step);
  });

  resetLab1Canvas();
}

function drawLab1Canvas(radius, isPopped) {
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Draw Centimeter Grid Paper (Giấy kẻ ô li)
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.15)';
  ctx.lineWidth = 1;
  const cmStep = 14; // 14px = 1cm
  for (let x = 0; x < W; x += cmStep) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += cmStep) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Major 5cm Grid
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.35)';
  for (let x = 0; x < W; x += cmStep * 5) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += cmStep * 5) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  const cx = W / 2;
  const cy = H / 2;

  if (radius > 0) {
    if (!isPopped) {
      // Growing 3D Iridescent Bubble
      const grad = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
      grad.addColorStop(0, 'rgba(255, 255, 255, 0.7)');
      grad.addColorStop(0.4, 'rgba(56, 189, 248, 0.4)');
      grad.addColorStop(0.8, 'rgba(236, 72, 153, 0.35)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0.6)');

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Straw
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 6;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + 120, cy - 110);
      ctx.stroke();
    } else {
      // Popped water ring imprint on paper
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Diameter line & ruler measurement
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(cx - radius, cy);
      ctx.lineTo(cx + radius, cy);
      ctx.stroke();

      // End arrows
      ctx.fillStyle = '#f43f5e';
      ctx.beginPath(); ctx.arc(cx - radius, cy, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(cx + radius, cy, 4, 0, Math.PI * 2); ctx.fill();

      const diamCm = (radius * 2 / 14).toFixed(1);
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText(`Đường kính: d = ${diamCm} cm`, cx - 60, cy - 10);
    }
  }
}

function renderLab1Output(mode, diam) {
  const out = document.getElementById('lab1Output');
  if (!out) return;

  let tempStr = "25°C (Nhiệt độ phòng)";
  if (mode === 'hot') tempStr = "75°C (Nước nóng)";
  else if (mode === 'cold') tempStr = "10°C (Nước lạnh)";

  // Classify into group
  let group = "[10; 12)";
  const d = Math.floor(diam / 2) * 2;
  group = `[${d}; ${d + 2})`;

  out.innerHTML = `
    <strong>🫧 Kết quả đo lường:</strong><br>
    • Nhiệt độ dung dịch: <strong>${tempStr}</strong>.<br>
    • Đường kính vết nước khi vỡ: $d = ${diam.toFixed(1)}\\text{ cm}$.<br>
    • Thuộc nhóm dữ liệu: $${group}\\text{ cm}$.<br>
    <strong>Nhận định:</strong> ${mode === 'hot' ? '🎉 <span style="color:#10b981;font-weight:bold;">ĐƯỜNG KÍNH RẤT LỚN!</span> Sức căng bề mặt giảm mạnh giúp màng xà phòng dãn tối đa.' : '⚠️ Sức căng bề mặt còn lớn khiến bong bóng vỡ sớm khi kích thước chưa đạt mức tối đa.'}
  `;
  renderMathInTree(out);
}

// --- 7. PHÒNG THÍ NGHIỆM 2: ĐỐI CHIẾU THỐNG KÊ 2 MẪU ---
function initLab2() {
  const metricSelect = document.getElementById('statMetric');

  function updateLab2() {
    const metric = metricSelect.value;
    drawLab2Canvas(metric);
    renderLab2Output(metric);
  }

  if (metricSelect) metricSelect.addEventListener('change', updateLab2);

  updateLab2();
}

function drawLab2Canvas(metric) {
  const canvas = document.getElementById('canvasLab2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width;
  const H = canvas.height;

  ctx.clearRect(0, 0, W, H);

  // Background grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
  }
  for (let y = 0; y < H; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
  }

  // Groups and frequencies from SGK HĐ4
  const groups = ['[4;6)', '[6;8)', '[8;10)', '[10;12)', '[12;14)', '[14;16)', '[16;18)', '[18;20)'];
  const n1 = [1, 1, 9, 9, 4, 4, 1, 0]; // Room temp
  const n2 = [0, 0, 1, 2, 1, 8, 8, 2]; // Hot water

  const numGroups = groups.length;
  const groupWidth = (W - 80) / numGroups;
  const barW = groupWidth / 2.6;

  // Max frequency is 9
  const maxFreq = 10;

  groups.forEach((g, idx) => {
    const gx = 50 + idx * groupWidth;

    // Bar 1: Room temp (blue)
    const h1 = (n1[idx] / maxFreq) * (H - 80);
    const y1 = H - 40 - h1;
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(gx, y1, barW, h1);

    // Bar 2: Hot temp (pink/orange)
    const h2 = (n2[idx] / maxFreq) * (H - 80);
    const y2 = H - 40 - h2;
    ctx.fillStyle = '#f43f5e';
    ctx.fillRect(gx + barW + 3, y2, barW, h2);

    // Label Group
    ctx.fillStyle = '#94a3b8';
    ctx.font = '10px Inter, sans-serif';
    ctx.fillText(g, gx - 2, H - 20);
  });

  // Draw Mean Lines
  if (metric === 'mean') {
    // Mean 1 = 11.07 cm (belongs to [10; 12) group index 3)
    const mean1Px = 50 + (3.53) * groupWidth;
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(mean1Px, 20); ctx.lineTo(mean1Px, H - 40); ctx.stroke();

    // Mean 2 = 15.36 cm (belongs to [14; 16) group index 5)
    const mean2Px = 50 + (5.68) * groupWidth;
    ctx.strokeStyle = '#f43f5e';
    ctx.beginPath(); ctx.moveTo(mean2Px, 20); ctx.lineTo(mean2Px, H - 40); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('x̄₁=11.07', mean1Px - 25, 15);
    ctx.fillStyle = '#f43f5e';
    ctx.fillText('x̄₂=15.36', mean2Px - 25, 15);
  }

  // Legend
  ctx.fillStyle = '#38bdf8'; ctx.fillRect(W - 240, 15, 12, 12);
  ctx.fillStyle = '#e2e8f0'; ctx.font = '11px Inter, sans-serif';
  ctx.fillText('Nhóm 1 (Nhiệt độ phòng)', W - 220, 25);

  ctx.fillStyle = '#f43f5e'; ctx.fillRect(W - 100, 15, 12, 12);
  ctx.fillStyle = '#e2e8f0';
  ctx.fillText('Nhóm 2 (Nước nóng)', W - 80, 25);
}

function renderLab2Output(metric) {
  const out = document.getElementById('lab2Output');
  if (!out) return;

  out.innerHTML = `
    <strong>📊 Bảng So Sánh Các Số Đặc Trưng Ghép Nhóm (SGK HĐ4):</strong><br>
    • <strong>Số trung bình:</strong> $\\bar{x}_1 \\approx 11{,}07\\text{ cm}$ (Nhóm 1) vs $\\bar{x}_2 \\approx 15{,}36\\text{ cm}$ (Nhóm 2).<br>
    • <strong>Trung vị ($M_e$):</strong> Nhóm 1 thuộc khoảng $[10; 12)$ ($M_e \\approx 10{,}78\\text{ cm}$); Nhóm 2 thuộc khoảng $[14; 16)$ ($M_e \\approx 15{,}75\\text{ cm}$).<br>
    • <strong>Mốt ($M_o$):</strong> Đỉnh phân bố Nhóm 1 tập trung tại $[8; 12)$; Nhóm 2 dịch chuyển mạnh sang phải tại $[14; 18)$.<br>
    <strong>Kết luận khoa học:</strong> Toàn bộ phân bố kích thước bong bóng của Nhóm 2 bị đẩy sang phải, khẳng định <strong>nhiệt độ tăng làm suy giảm sức căng bề mặt của nước xà phòng</strong>!
  `;

  if (!appState.badges[2]) {
    unlockBadge(3);
  }

  renderMathInTree(out);
}

// --- 8. AVATAR MODAL & TABS ---
function initAvatarModal() {
  const avatarBtn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const closeBtn = document.getElementById('avatarModalClose');
  const options = document.querySelectorAll('.avatar-option');

  if (avatarBtn && modal) {
    avatarBtn.addEventListener('click', () => {
      modal.style.display = 'flex';
      modal.classList.add('active');
      playClick();
    });
  }

  if (closeBtn && modal) {
    closeBtn.addEventListener('click', () => {
      modal.style.display = 'none';
      modal.classList.remove('active');
      playClick();
    });
  }

  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
      }
    });
  }

  options.forEach(opt => {
    opt.addEventListener('click', () => {
      options.forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      appState.avatar = opt.dataset.avatar;
      appState.userName = opt.dataset.name;
      appState.userTitle = opt.dataset.title;

      if (avatarBtn) avatarBtn.textContent = appState.avatar;
      const nameEl = document.getElementById('userNameDisplay');
      const titleEl = document.getElementById('userTitle');
      const certNameEl = document.getElementById('certStudentName');

      if (nameEl) nameEl.textContent = `${appState.userName} 🌟`;
      if (titleEl) titleEl.textContent = appState.userTitle;
      if (certNameEl) certNameEl.textContent = appState.userName;

      if (modal) {
        modal.style.display = 'none';
        modal.classList.remove('active');
      }
      playClick();
    });
  });
}

function initNavigationTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const sections = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      tab.classList.add('active');
      const sec = document.getElementById(`tab-${target}`);
      if (sec) sec.classList.add('active');
      playClick();

      if (sec) renderMathInTree(sec);
    });
  });
}

function initSoundAndReset() {
  const soundBtn = document.getElementById('soundToggle');
  const resetBtn = document.getElementById('resetProgress');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      playClick();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học bài này?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.stars = 2;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        for (let i = 1; i <= 5; i++) {
          const b = document.getElementById(`badge-${i}`);
          if (b) {
            b.classList.add('locked');
            b.classList.remove('unlocked');
          }
        }
        updateHUD();
        renderQuiz();
        playClick();
      }
    });
  }

  const printBtn = document.getElementById('btnPrintCert');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

// --- 9. INITIALIZATION ---
document.addEventListener('DOMContentLoaded', () => {
  initAvatarModal();
  initNavigationTabs();
  initSoundAndReset();
  initLab1();
  initLab2();
  renderQuiz();
  updateHUD();

  setTimeout(() => {
    renderMathInTree(document.body);
  }, 100);
});
