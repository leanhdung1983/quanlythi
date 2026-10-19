/**
 * TOÁN 12 - TẬP HAI • BÀI TẬP CUỐI CHƯƠNG VI: XÁC SUẤT CÓ ĐIỀU KIỆN
 * Chuẩn hóa 100% Offline KaTeX, Web Audio API, Canvas 2D & Instant Quiz Arena
 */

// ==========================================
// 1. STATE QUẢN LÝ TIẾN TRÌNH HỌC TẬP
// ==========================================
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Phân Tích Bayes',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false],
  arenaScore: 0
};

// ==========================================
// 2. BỘ TỔNG HỢP ÂM THANH WEB AUDIO API (OFFLINE)
// ==========================================
class SoundSynthesizer {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.15) {
    if (!appState.sound) return;
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
      console.warn('Audio play error:', e);
    }
  }

  playClick() {
    this.playTone(600, 'triangle', 0.06, 0.08);
  }

  playCorrect() {
    if (!appState.sound) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.frequency.setValueAtTime(523.25, now); // C5
      osc2.frequency.setValueAtTime(659.25, now + 0.1); // E5

      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.15);
      osc2.start(now + 0.1);
      osc2.stop(now + 0.35);
    } catch (e) {}
  }

  playWrong() {
    if (!appState.sound) return;
    this.init();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(180, now);
      osc.frequency.linearRampToValueAtTime(110, now + 0.3);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch (e) {}
  }

  playLevelUp() {
    if (!appState.sound) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'sine', 0.18, 0.2), idx * 90);
    });
  }

  playFanfare() {
    if (!appState.sound) return;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.3, 0.25), idx * 120);
    });
  }
}
const audio = new SoundSynthesizer();

// ==========================================
// 3. MATHML CORE TOKENIZER & FALLBACK PARSER
// ==========================================
function latexToMathML(latex, display = false) {
  let s = latex.trim();
  s = s.replace(/\\limits/g, '');

  // Vector \overrightarrow{AB}
  s = s.replace(/\\overrightarrow\{([^}]+)\}/g, '<mover accent="true"><mrow><mi>$1</mi></mrow><mo>&#8594;</mo></mover>');

  // Fractions
  s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');

  // Overlines \overline{A}
  s = s.replace(/\\overline\{([^{}]+)\}/g, '<mover accent="true"><mrow>$1</mrow><mo stretchy="false">&#175;</mo></mover>');

  // Square roots
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, '<msqrt><mrow>$1</mrow></msqrt>');

  // Subscripts & Superscripts
  s = s.replace(/([A-Za-z0-9\)])_\{([^{}]+)\}/g, '<msub><mrow>$1</mrow><mrow>$2</mrow></msub>');
  s = s.replace(/([A-Za-z0-9\)])_([A-Za-z0-9])/g, '<msub><mrow>$1</mrow><mrow>$2</mrow></msub>');
  s = s.replace(/([A-Za-z0-9\)])\^\{([^{}]+)\}/g, '<msup><mrow>$1</mrow><mrow>$2</mrow></msup>');
  s = s.replace(/([A-Za-z0-9\)])\^([A-Za-z0-9])/g, '<msup><mrow>$1</mrow><mrow>$2</mrow></msup>');

  // Symbols
  s = s.replace(/\\cdot/g, '<mo>&#8901;</mo>');
  s = s.replace(/\\times/g, '<mo>&#215;</mo>');
  s = s.replace(/\\approx/g, '<mo>&#8776;</mo>');
  s = s.replace(/\\le/g, '<mo>&#8804;</mo>');
  s = s.replace(/\\ge/g, '<mo>&#8805;</mo>');
  s = s.replace(/\\ne/g, '<mo>&#8800;</mo>');
  s = s.replace(/\\cap/g, '<mo>&#8745;</mo>');
  s = s.replace(/\\cup/g, '<mo>&#8746;</mo>');
  s = s.replace(/\\varnothing/g, '<mo>&#8709;</mo>');
  s = s.replace(/\\sum/g, '<mo>&#8721;</mo>');
  s = s.replace(/\\Omega/g, '<mi>&#937;</mi>');
  s = s.replace(/\\Delta/g, '<mi>&#916;</mi>');
  s = s.replace(/\\text\{([^{}]+)\}/g, '<mtext>$1</mtext>');

  // Wrap variables and operators
  s = s.replace(/([A-Za-z])/g, '<mi>$1</mi>');
  s = s.replace(/([0-9]+(?:\.[0-9]+)?)/g, '<mn>$1</mn>');
  s = s.replace(/([=+\-*/%(),;])/g, '<mo>$1</mo>');

  const tag = display ? 'math display="block"' : 'math';
  return `<${tag} xmlns="http://www.w3.org/1998/Math/MathML">${s}</${tag.split(' ')[0]}>`;
}

function formatMathText(str) {
  if (!str) return '';
  // Block Math
  let res = str.replace(/\$\$([\s\S]*?)\$\$/g, (m, c) => {
    return `<div class="math-block">${latexToMathML(c, true)}</div>`;
  });
  // Inline Math
  res = res.replace(/\$([^\$\n]+?)\$/g, (m, c) => {
    return `<span class="math-inline">${latexToMathML(c, false)}</span>`;
  });
  return res;
}

function renderMathInTree(el) {
  if (!el) return;
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(el, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false,
      strict: false
    });
  } else {
    // MathML Fallback if KaTeX is not loaded
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(n => {
      if (/\$([^\$]+)\$/.test(n.nodeValue)) {
        const span = document.createElement('span');
        span.innerHTML = formatMathText(n.nodeValue);
        n.parentNode.replaceChild(span, n);
      }
    });
  }
}

// ==========================================
// 4. DỮ LIỆU ĐẤU TRƯỜNG 10 CÂU SGK TRANG 79–80
// ==========================================
const quizData = [
  {
    id: 1,
    title: "Câu 6.12 SGK Trang 79 - Quy Tắc Nhân Xác Suất",
    pts: 20,
    question: "Cho $P(A) = \\frac{2}{5}$, $P(B|A) = \\frac{1}{3}$, $P(B|\\overline{A}) = \\frac{1}{4}$. Giá trị của xác suất đồng thời $P(AB)$ là:",
    options: [
      { text: "$P(AB) = \\frac{2}{15}$", correct: true },
      { text: "$P(AB) = \\frac{3}{16}$", correct: false },
      { text: "$P(AB) = \\frac{1}{5}$", correct: false },
      { text: "$P(AB) = \\frac{4}{15}$", correct: false }
    ],
    explanation: "Theo quy tắc nhân xác suất: $P(AB) = P(A) \\cdot P(B|A) = \\frac{2}{5} \\cdot \\frac{1}{3} = \\frac{2}{15}$."
  },
  {
    id: 2,
    title: "Câu 6.13 SGK Trang 79 - Xác Suất Giao Với Biến Cố Đối",
    pts: 20,
    question: "Với cùng dữ kiện $P(A) = \\frac{2}{5}$, $P(B|A) = \\frac{1}{3}$, $P(B|\\overline{A}) = \\frac{1}{4}$. Giá trị của $P(B\\overline{A})$ là:",
    options: [
      { text: "$P(B\\overline{A}) = \\frac{1}{7}$", correct: false },
      { text: "$P(B\\overline{A}) = \\frac{4}{19}$", correct: false },
      { text: "$P(B\\overline{A}) = \\frac{4}{21}$", correct: false },
      { text: "$P(B\\overline{A}) = \\frac{3}{20}$", correct: true }
    ],
    explanation: "Ta có xác suất của biến cố đối: $P(\\overline{A}) = 1 - P(A) = 1 - \\frac{2}{5} = \\frac{3}{5}$.<br>Theo quy tắc nhân: $P(B\\overline{A}) = P(\\overline{A}) \\cdot P(B|\\overline{A}) = \\frac{3}{5} \\cdot \\frac{1}{4} = \\frac{3}{20}$."
  },
  {
    id: 3,
    title: "Câu 6.14 SGK Trang 79 - Công Thức Xác Suất Toàn Phần",
    pts: 20,
    question: "Cũng với các dữ kiện trên, giá trị của xác suất toàn phần $P(B)$ là:",
    options: [
      { text: "$P(B) = \\frac{19}{60}$", correct: false },
      { text: "$P(B) = \\frac{17}{60}$", correct: true },
      { text: "$P(B) = \\frac{9}{20}$", correct: false },
      { text: "$P(B) = \\frac{7}{30}$", correct: false }
    ],
    explanation: "Theo công thức xác suất toàn phần: $P(B) = P(AB) + P(B\\overline{A}) = \\frac{2}{15} + \\frac{3}{20} = \\frac{8}{60} + \\frac{9}{60} = \\frac{17}{60}$."
  },
  {
    id: 4,
    title: "Câu 6.15 SGK Trang 79 - Rút 2 Kẹo Đen Không Hoàn Lại",
    pts: 20,
    question: "Bạn An có một túi gồm 6 chiếc kẹo sô cô la đen và 4 chiếc kẹo sô cô la trắng. An lấy ngẫu nhiên 1 chiếc kẹo đưa cho Bình, rồi lại lấy tiếp 1 chiếc kẹo nữa đưa cho Bình. Xác suất để Bình nhận được 2 chiếc kẹo sô cô la đen là:",
    options: [
      { text: "$\\frac{1}{3}$", correct: true },
      { text: "$\\frac{1}{4}$", correct: false },
      { text: "$\\frac{2}{5}$", correct: false },
      { text: "$\\frac{3}{7}$", correct: false }
    ],
    explanation: "Tổng số kẹo ban đầu là $6 + 4 = 10$. Gọi $D_1$ là lần 1 lấy kẹo đen, $D_2$ là lần 2 lấy kẹo đen.<br>Ta có $P(D_1) = \\frac{6}{10} = \\frac{3}{5}$. Sau khi lấy 1 kẹo đen, trong túi còn 9 kẹo (5 đen, 4 trắng) nên $P(D_2|D_1) = \\frac{5}{9}$.<br>Vậy xác suất lấy được 2 kẹo đen là: $P(D_1 D_2) = \\frac{3}{5} \\cdot \\frac{5}{9} = \\frac{3}{9} = \\frac{1}{3}$."
  },
  {
    id: 5,
    title: "Câu 6.16 SGK Trang 79 - Rút 2 Kẹo Trắng Không Hoàn Lại",
    pts: 20,
    question: "Với túi kẹo gồm 6 kẹo đen và 4 kẹo trắng như trên, xác suất để Bình nhận được 2 chiếc kẹo sô cô la trắng là:",
    options: [
      { text: "$\\frac{1}{5}$", correct: false },
      { text: "$\\frac{2}{15}$", correct: true },
      { text: "$\\frac{3}{16}$", correct: false },
      { text: "$\\frac{4}{17}$", correct: false }
    ],
    explanation: "Gọi $T_1, T_2$ lần lượt là biến cố lấy được kẹo trắng ở lần 1 và lần 2.<br>Ta có $P(T_1) = \\frac{4}{10} = \\frac{2}{5}$. Khi đã lấy 1 kẹo trắng, túi còn 9 kẹo (3 trắng) nên $P(T_2|T_1) = \\frac{3}{9} = \\frac{1}{3}$.<br>Do đó: $P(T_1 T_2) = \\frac{2}{5} \\cdot \\frac{1}{3} = \\frac{2}{15}$."
  },
  {
    id: 6,
    title: "Câu 6.17 SGK Trang 79 - Lần 1 Kẹo Đen, Lần 2 Kẹo Trắng",
    pts: 20,
    question: "Xác suất để Bình nhận được chiếc kẹo sô cô la đen ở lần thứ nhất và kẹo sô cô la trắng ở lần thứ hai là:",
    options: [
      { text: "$\\frac{1}{5}$", correct: false },
      { text: "$\\frac{3}{16}$", correct: false },
      { text: "$\\frac{1}{4}$", correct: false },
      { text: "$\\frac{4}{15}$", correct: true }
    ],
    explanation: "Xác suất lấy kẹo đen lần 1 là $P(D_1) = \\frac{6}{10} = \\frac{3}{5}$.<br>Khi đã lấy 1 kẹo đen, trong túi còn 9 chiếc kẹo gồm 4 chiếc màu trắng, nên $P(T_2|D_1) = \\frac{4}{9}$.<br>Vậy xác suất cần tìm là: $P(D_1 T_2) = P(D_1) \\cdot P(T_2|D_1) = \\frac{3}{5} \\cdot \\frac{4}{9} = \\frac{4}{15}$."
  },
  {
    id: 7,
    title: "Câu 6.18a SGK Trang 80 - Thử Nghiệm Thuốc Lâm Sàng Bảng 2x2",
    pts: 20,
    question: "Thử nghiệm lâm sàng trên 4000 bệnh nhân: Nhóm uống thuốc X có 1600 người khỏi bệnh trên 2400 người tham gia; nhóm uống thuốc Y có 1200 người khỏi bệnh trên 1600 người tham gia. Xác suất người bệnh khỏi bệnh nếu biết người đó uống thuốc X là:",
    options: [
      { text: "$\\frac{1}{2}$", correct: false },
      { text: "$\\frac{3}{5}$", correct: false },
      { text: "$\\frac{2}{3}$", correct: true },
      { text: "$\\frac{3}{4}$", correct: false }
    ],
    explanation: "Theo bảng thống kê $2 \\times 2$, số người uống thuốc X là $1600 + 800 = 2400$. Trong đó có 1600 người khỏi bệnh.<br>Vậy xác suất có điều kiện là: $P(\\text{Khỏi}|X) = \\frac{1600}{2400} = \\frac{2}{3} \\approx 66.67\\%$."
  },
  {
    id: 8,
    title: "Câu 6.18b SGK Trang 80 - Suy Luận Ngược Bayes Về Nguồn Thuốc",
    pts: 20,
    question: "Cũng theo kết quả thử nghiệm trên, biết rằng một người bệnh được chọn ngẫu nhiên đã khỏi bệnh, xác suất người đó đã uống thuốc Y là:",
    options: [
      { text: "$\\frac{3}{7}$", correct: true },
      { text: "$\\frac{4}{7}$", correct: false },
      { text: "$\\frac{3}{10}$", correct: false },
      { text: "$\\frac{2}{5}$", correct: false }
    ],
    explanation: "Tổng số người khỏi bệnh trong cả hai nhóm là $1600 + 1200 = 2800$.<br>Trong số 2800 người khỏi bệnh này, có 1200 người uống thuốc Y.<br>Do đó xác suất hậu nghiệm là: $P(Y|\\text{Khỏi}) = \\frac{1200}{2800} = \\frac{3}{7} \\approx 42.86\\%$."
  },
  {
    id: 9,
    title: "Câu 6.20 SGK Trang 80 - Tung Xúc Xắc Chọn Chuồng Gà",
    pts: 20,
    question: "Chuồng I có 5 gà mái, 2 gà trống. Chuồng II có 3 gà mái, 5 gà trống. Người chơi tung con xúc xắc cân đối: nếu số chấm chia hết cho 3 thì chọn chuồng I, nếu không thì chọn chuồng II; rồi bắt ngẫu nhiên 1 con gà. Xác suất bắt được gà mái là:",
    options: [
      { text: "$\\frac{19}{42}$", correct: false },
      { text: "$\\frac{41}{84}$", correct: true },
      { text: "$\\frac{1}{2}$", correct: false },
      { text: "$\\frac{43}{84}$", correct: false }
    ],
    explanation: "Xúc xắc có các mặt $\\{1, 2, 3, 4, 5, 6\\}$. Mặt chia hết cho 3 là $\\{3, 6\\}$ nên $P(\\text{I}) = \\frac{2}{6} = \\frac{1}{3}$; suy ra $P(\\text{II}) = \\frac{4}{6} = \\frac{2}{3}$.<br>Xác suất bắt được gà mái ở chuồng I là $\\frac{5}{7}$, ở chuồng II là $\\frac{3}{8}$.<br>Theo công thức xác suất toàn phần: $P(M) = \\frac{1}{3} \\cdot \\frac{5}{7} + \\frac{2}{3} \\cdot \\frac{3}{8} = \\frac{5}{21} + \\frac{1}{4} = \\frac{41}{84} \\approx 0.4881$."
  },
  {
    id: 10,
    title: "Câu 6.21 SGK Trang 80 - Phản Ứng Phụ Vaccine & Bệnh Nền",
    pts: 20,
    question: "Một loại vaccine được tiêm tại địa phương X có $18\\%$ người có bệnh nền. Người có bệnh nền thì với xác suất $0.35$ có phản ứng phụ sau tiêm; người không bệnh nền thì phản ứng phụ với xác suất $0.16$. Chọn ngẫu nhiên 1 người đã tiêm và thấy có phản ứng phụ. Xác suất người này có bệnh nền là:",
    options: [
      { text: "$\\approx 24.15\\%$", correct: false },
      { text: "$\\approx 28.50\\%$", correct: false },
      { text: "$\\approx 30.12\\%$", correct: false },
      { text: "$\\approx 32.44\\%$", correct: true }
    ],
    explanation: "Gọi $B$ là biến cố có bệnh nền $\\Rightarrow P(B) = 0.18, P(\\overline{B}) = 0.82$.<br>Gọi $A$ là biến cố có phản ứng phụ $\\Rightarrow P(A|B) = 0.35, P(A|\\overline{B}) = 0.16$.<br>Xác suất toàn phần gặp phản ứng phụ: $P(A) = 0.18 \\cdot 0.35 + 0.82 \\cdot 0.16 = 0.063 + 0.1312 = 0.1942$.<br>Theo công thức Bayes: $P(B|A) = \\frac{P(B)P(A|B)}{P(A)} = \\frac{0.063}{0.1942} = \\frac{315}{971} \\approx 32.44\\%$."
  }
];

// ==========================================
// 5. RENDER ĐẤU TRƯỜNG & TƯƠNG TÁC TỨC THÌ
// ==========================================
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  quizData.forEach((q, idx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard-${q.id}`;

    const answeredState = appState.answered[q.id];

    card.innerHTML = `
      <div class="quiz-card-header">
        <span class="quiz-title">${q.title}</span>
        <span class="quiz-pts">+${q.pts} XP</span>
      </div>
      <div class="quiz-q">${q.question}</div>
      <div class="quiz-options">
        ${q.options.map((opt, optIdx) => `
          <button class="quiz-opt-btn ${answeredState ? (opt.correct ? 'correct' : (answeredState.chosen === optIdx ? 'wrong' : '')) : ''}"
                  data-qid="${q.id}"
                  data-opt="${optIdx}"
                  ${answeredState ? 'disabled' : ''}>
            ${String.fromCharCode(65 + optIdx)}. ${opt.text}
          </button>
        `).join('')}
      </div>
      <div class="explanation-box ${answeredState ? 'show' : ''}" id="expl-${q.id}">
        <strong>💡 Lời giải chi tiết:</strong><br>${q.explanation}
      </div>
    `;

    container.appendChild(card);
  });

  // Gắn sự kiện click tức thì cho các nút lựa chọn
  container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', handleQuizOptionClick);
  });

  // Render toán học sau khi gắn DOM
  renderMathInTree(container);
  updateArenaScoreDisplay();
}

function handleQuizOptionClick(e) {
  audio.playClick();
  const btn = e.currentTarget;
  const qid = parseInt(btn.getAttribute('data-qid'), 10);
  const optIdx = parseInt(btn.getAttribute('data-opt'), 10);

  if (appState.answered[qid]) return;

  const q = quizData.find(item => item.id === qid);
  if (!q) return;

  const isCorrect = q.options[optIdx].correct;
  appState.answered[qid] = { chosen: optIdx, correct: isCorrect };

  const card = document.getElementById(`quizCard-${qid}`);
  const buttons = card.querySelectorAll('.quiz-opt-btn');

  buttons.forEach((b, i) => {
    b.disabled = true;
    if (q.options[i].correct) {
      b.classList.add('correct');
    } else if (i === optIdx && !isCorrect) {
      b.classList.add('wrong');
    }
  });

  const explBox = document.getElementById(`expl-${qid}`);
  if (explBox) {
    explBox.classList.add('show');
    renderMathInTree(explBox);
  }

  if (isCorrect) {
    audio.playCorrect();
    appState.xp += q.pts;
    appState.streak += 1;
    appState.arenaScore += q.pts;
  } else {
    audio.playWrong();
    appState.streak = 0;
  }

  updateHUD();
  updateArenaScoreDisplay();
  checkBadges();
}

function updateArenaScoreDisplay() {
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  const answeredCount = Object.keys(appState.answered).length;
  if (progEl) progEl.textContent = `Tiến Độ: ${answeredCount}/10`;
  if (scoreEl) scoreEl.textContent = `Điểm Arena: ${appState.arenaScore} XP`;
}

// ==========================================
// 6. PHÒNG THÍ NGHIỆM TƯƠNG TÁC (LAB 1 & LAB 2)
// ==========================================

// --- LAB 1: MÁY TÍNH CÂY XÁC SUẤT TOÀN PHẦN & BAYES ---
function initLab1() {
  const canvas = document.getElementById('treeCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const pAInput = document.getElementById('pAInput');
  const pBAInput = document.getElementById('pBAInput');
  const pBNotAInput = document.getElementById('pBNotAInput');

  const pAVal = document.getElementById('pAVal');
  const pBAVal = document.getElementById('pBAVal');
  const pBNotAVal = document.getElementById('pBNotAVal');
  const output = document.getElementById('treeOutput');

  function drawTree() {
    const pA = parseFloat(pAInput.value);
    const pNotA = 1 - pA;
    const pBA = parseFloat(pBAInput.value);
    const pNotBA = 1 - pBA;
    const pBNotA = parseFloat(pBNotAInput.value);
    const pNotBNotA = 1 - pBNotA;

    pAVal.textContent = pA.toFixed(2);
    pBAVal.textContent = pBA.toFixed(2);
    pBNotAVal.textContent = pBNotA.toFixed(2);

    // Tính toán
    const pAB = pA * pBA;
    const pNotBA_joint = pA * pNotBA;
    const pBNotA_joint = pNotA * pBNotA;
    const pNotBNotA_joint = pNotA * pNotBNotA;
    const pB = pAB + pBNotA_joint;
    const pNotB = 1 - pB;
    const pABayes = pB > 0 ? (pAB / pB) : 0;

    // Xóa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Tọa độ các điểm nút
    const root = { x: 80, y: 170 };
    const nA = { x: 320, y: 85 };
    const nNotA = { x: 320, y: 255 };

    const nAB = { x: 620, y: 45 };
    const nANotB = { x: 620, y: 125 };
    const nNotAB = { x: 620, y: 215 };
    const nNotANotB = { x: 620, y: 295 };

    // Hàm vẽ nhánh có gradient phát sáng
    function drawBranch(from, to, probText, labelText, color = '#818cf8', thickness = 2) {
      ctx.beginPath();
      ctx.moveTo(from.x, from.y);
      ctx.lineTo(to.x, to.y);
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Nhãn xác suất trên nhánh
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2 - 8;
      ctx.fillStyle = '#f8fafc';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(probText, midX - 16, midY);
    }

    // Hàm vẽ nút tròn
    function drawNode(pt, label, sub, color = '#6366f1') {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 20, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();
      ctx.strokeStyle = color;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(label, pt.x, pt.y);

      if (sub) {
        ctx.fillStyle = color;
        ctx.font = '11px Inter, sans-serif';
        ctx.fillText(sub, pt.x, pt.y + 28);
      }
    }

    // Vẽ các nhánh tầng 1
    drawBranch(root, nA, `P(A)=${pA.toFixed(2)}`, '', '#6366f1', 3);
    drawBranch(root, nNotA, `P(Ā)=${pNotA.toFixed(2)}`, '', '#94a3b8', 3);

    // Vẽ các nhánh tầng 2
    drawBranch(nA, nAB, `P(B|A)=${pBA.toFixed(2)}`, '', '#06b6d4', 2.5);
    drawBranch(nA, nANotB, `P(B̄|A)=${pNotBA.toFixed(2)}`, '', '#64748b', 1.5);

    drawBranch(nNotA, nNotAB, `P(B|Ā)=${pBNotA.toFixed(2)}`, '', '#06b6d4', 2.5);
    drawBranch(nNotA, nNotANotB, `P(B̄|Ā)=${pNotBNotA.toFixed(2)}`, '', '#64748b', 1.5);

    // Vẽ các nút
    drawNode(root, 'Ω', 'Gốc');
    drawNode(nA, 'A', `${(pA * 100).toFixed(0)}%`, '#818cf8');
    drawNode(nNotA, 'Ā', `${(pNotA * 100).toFixed(0)}%`, '#94a3b8');

    drawNode(nAB, 'B', `P(AB)=${pAB.toFixed(4)}`, '#06b6d4');
    drawNode(nANotB, 'B̄', `P(A B̄)=${pNotBA_joint.toFixed(4)}`, '#64748b');
    drawNode(nNotAB, 'B', `P(Ā B)=${pBNotA_joint.toFixed(4)}`, '#06b6d4');
    drawNode(nNotANotB, 'B̄', `P(Ā B̄)=${pNotBNotA_joint.toFixed(4)}`, '#64748b');

    // Cột kết quả bên phải
    ctx.fillStyle = '#06b6d4';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`⟶ Nhánh B: P(AB) = ${pAB.toFixed(4)}`, 680, 48);
    ctx.fillText(`⟶ Nhánh B: P(ĀB) = ${pBNotA_joint.toFixed(4)}`, 680, 218);

    // Xuất công thức LaTeX vào output
    output.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px;">
        <div class="rule-box gold">
          <strong>1. Xác Suất Toàn Phần $P(B)$:</strong><br>
          $P(B) = P(AB) + P(\\overline{A}B) = ${pAB.toFixed(4)} + ${pBNotA_joint.toFixed(4)} = <strong>${pB.toFixed(4)}</strong>$ (${(pB * 100).toFixed(2)}%)
        </div>
        <div class="rule-box">
          <strong>2. Định Lý Suy Ngược Bayes $P(A|B)$:</strong><br>
          $P(A|B) = \\frac{P(AB)}{P(B)} = \\frac{${pAB.toFixed(4)}}{${pB.toFixed(4)}} = <strong>${pABayes.toFixed(4)}</strong>$ (${(pABayes * 100).toFixed(2)}%)
        </div>
      </div>
    `;
    renderMathInTree(output);
  }

  [pAInput, pBAInput, pBNotAInput].forEach(inp => {
    inp.addEventListener('input', () => {
      drawTree();
      markLabInteracted(2);
    });
  });

  // Presets
  const btnSGK = document.getElementById('btnPresetSGK612');
  if (btnSGK) {
    btnSGK.addEventListener('click', () => {
      audio.playClick();
      pAInput.value = 0.40; // 2/5
      pBAInput.value = 0.33; // 1/3
      pBNotAInput.value = 0.25; // 1/4
      drawTree();
      markLabInteracted(2);
    });
  }

  const btnVaccine = document.getElementById('btnPresetVaccine');
  if (btnVaccine) {
    btnVaccine.addEventListener('click', () => {
      audio.playClick();
      pAInput.value = 0.18; // 18% có bệnh nền
      pBAInput.value = 0.35; // phản ứng phụ có bệnh nền
      pBNotAInput.value = 0.16; // phản ứng phụ không bệnh nền
      drawTree();
      markLabInteracted(2);
    });
  }

  const btnChicken = document.getElementById('btnPresetChicken');
  if (btnChicken) {
    btnChicken.addEventListener('click', () => {
      audio.playClick();
      pAInput.value = 0.33; // Chuồng I: 1/3
      pBAInput.value = 0.71; // 5/7
      pBNotAInput.value = 0.375; // 3/8
      drawTree();
      markLabInteracted(2);
    });
  }

  drawTree();
}

// --- LAB 2: MA TRẬN 2X2 & THỬ NGHIỆM THUỐC SGK 6.18 ---
function initLab2() {
  const canvas = document.getElementById('matrixCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const xH = document.getElementById('xHealed');
  const xNH = document.getElementById('xNotHealed');
  const yH = document.getElementById('yHealed');
  const yNH = document.getElementById('yNotHealed');

  const xHVal = document.getElementById('xHealedVal');
  const xNHVal = document.getElementById('xNotHealedVal');
  const yHVal = document.getElementById('yHealedVal');
  const yNHVal = document.getElementById('yNotHealedVal');
  const output = document.getElementById('matrixOutput');

  function drawMatrix() {
    const a = parseInt(xH.value, 10);
    const b = parseInt(xNH.value, 10);
    const c = parseInt(yH.value, 10);
    const d = parseInt(yNH.value, 10);

    xHVal.textContent = a;
    xNHVal.textContent = b;
    yHVal.textContent = c;
    yNHVal.textContent = d;

    const totalX = a + b;
    const totalY = c + d;
    const totalHealed = a + c;
    const totalNotHealed = b + d;
    const grandTotal = totalX + totalY;

    // Các tỷ lệ
    const rateX = totalX > 0 ? (a / totalX) : 0;
    const rateY = totalY > 0 ? (c / totalY) : 0;
    const pYGivenHealed = totalHealed > 0 ? (c / totalHealed) : 0;
    const pXGivenHealed = totalHealed > 0 ? (a / totalHealed) : 0;
    const relativeRisk = rateY > 0 ? (rateX / rateY) : 1;

    // Vẽ Mosaic Chart diện tích
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const chartX = 100;
    const chartY = 40;
    const chartW = 460;
    const chartH = 220;

    const fracX = totalX / grandTotal;
    const widthX = chartW * fracX;
    const widthY = chartW - widthX;

    // Chiều cao cho Thuốc X
    const hXA = chartH * rateX;
    const hXB = chartH - hXA;

    // Chiều cao cho Thuốc Y
    const hYA = chartH * rateY;
    const hYB = chartH - hYA;

    // 1. Ô Thuốc X - Khỏi
    ctx.fillStyle = 'rgba(6, 182, 212, 0.75)';
    ctx.fillRect(chartX, chartY, widthX, hXA);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.strokeRect(chartX, chartY, widthX, hXA);

    // 2. Ô Thuốc X - Không Khỏi
    ctx.fillStyle = 'rgba(100, 116, 139, 0.45)';
    ctx.fillRect(chartX, chartY + hXA, widthX, hXB);
    ctx.strokeStyle = '#64748b';
    ctx.strokeRect(chartX, chartY + hXA, widthX, hXB);

    // 3. Ô Thuốc Y - Khỏi
    ctx.fillStyle = 'rgba(99, 102, 241, 0.75)';
    ctx.fillRect(chartX + widthX, chartY, widthY, hYA);
    ctx.strokeStyle = '#818cf8';
    ctx.strokeRect(chartX + widthX, chartY, widthY, hYA);

    // 4. Ô Thuốc Y - Không Khỏi
    ctx.fillStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.fillRect(chartX + widthX, chartY + hYA, widthY, hYB);
    ctx.strokeStyle = '#94a3b8';
    ctx.strokeRect(chartX + widthX, chartY + hYA, widthY, hYB);

    // Nhãn trong ô
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    if (widthX > 60 && hXA > 30) {
      ctx.fillText(`Khỏi: ${a}`, chartX + widthX / 2, chartY + hXA / 2);
    }
    if (widthX > 60 && hXB > 30) {
      ctx.fillText(`K.Khỏi: ${b}`, chartX + widthX / 2, chartY + hXA + hXB / 2);
    }
    if (widthY > 60 && hYA > 30) {
      ctx.fillText(`Khỏi: ${c}`, chartX + widthX + widthY / 2, chartY + hYA / 2);
    }
    if (widthY > 60 && hYB > 30) {
      ctx.fillText(`K.Khỏi: ${d}`, chartX + widthX + widthY / 2, chartY + hYA + hYB / 2);
    }

    // Tiêu đề trục
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText(`Thuốc X (${totalX} ng)`, chartX + widthX / 2, chartY - 14);
    ctx.fillText(`Thuốc Y (${totalY} ng)`, chartX + widthX + widthY / 2, chartY - 14);

    // Bảng thống kê bên phải Canvas
    const statX = 600;
    ctx.textAlign = 'left';
    ctx.font = 'bold 15px Inter, sans-serif';
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('📊 Chỉ Số Phân Tích Lâm Sàng:', statX, 60);

    ctx.font = '13px Inter, sans-serif';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(`• Hiệu quả Thuốc X: P(K|X) = ${(rateX * 100).toFixed(1)}%`, statX, 95);
    ctx.fillText(`• Hiệu quả Thuốc Y: P(K|Y) = ${(rateY * 100).toFixed(1)}%`, statX, 125);
    ctx.fillText(`• Tỷ số hiệu quả (RR): ${relativeRisk.toFixed(2)} lần`, statX, 155);

    ctx.fillStyle = '#38bdf8';
    ctx.fillText(`• Suy diễn Bayes P(Y|Khỏi): ${(pYGivenHealed * 100).toFixed(1)}%`, statX, 195);
    ctx.fillText(`• Suy diễn Bayes P(X|Khỏi): ${(pXGivenHealed * 100).toFixed(1)}%`, statX, 225);

    // Render LaTeX Output
    output.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
        <div class="rule-box gold">
          <strong>1. Xác Suất Khỏi Bệnh Khi Dùng Thuốc X (Bài 6.18a):</strong><br>
          $P(\\text{Khỏi}|X) = \\frac{n(X \\cap \\text{Khỏi})}{n(X)} = \\frac{${a}}{${totalX}} \\approx <strong>${(rateX * 100).toFixed(2)}\\%</strong>$
        </div>
        <div class="rule-box">
          <strong>2. Xác Suất Uống Thuốc Y Biết Đã Khỏi Bệnh (Bài 6.18b):</strong><br>
          $P(Y|\\text{Khỏi}) = \\frac{n(Y \\cap \\text{Khỏi})}{n(\\text{Khỏi})} = \\frac{${c}}{${totalHealed}} \\approx <strong>${(pYGivenHealed * 100).toFixed(2)}\\%</strong>$
        </div>
      </div>
    `;
    renderMathInTree(output);
  }

  [xH, xNH, yH, yNH].forEach(inp => {
    inp.addEventListener('input', () => {
      drawMatrix();
      markLabInteracted(3);
    });
  });

  const btnReset = document.getElementById('btnResetTable');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      audio.playClick();
      xH.value = 1600;
      xNH.value = 800;
      yH.value = 1200;
      yNH.value = 400;
      drawMatrix();
      markLabInteracted(3);
    });
  }

  const btnEqual = document.getElementById('btnEqualDrugs');
  if (btnEqual) {
    btnEqual.addEventListener('click', () => {
      audio.playClick();
      xH.value = 1800;
      xNH.value = 600; // 75%
      yH.value = 1500;
      yNH.value = 500; // 75%
      drawMatrix();
      markLabInteracted(3);
    });
  }

  const btnHighY = document.getElementById('btnHighY');
  if (btnHighY) {
    btnHighY.addEventListener('click', () => {
      audio.playClick();
      xH.value = 1200;
      xNH.value = 1200; // 50%
      yH.value = 1800;
      yNH.value = 200; // 90%
      drawMatrix();
      markLabInteracted(3);
    });
  }

  drawMatrix();
}

function markLabInteracted(badgeNum) {
  if (badgeNum === 2 && !appState.badges[1]) {
    unlockBadge(2);
  } else if (badgeNum === 3 && !appState.badges[2]) {
    unlockBadge(3);
  }
}

// ==========================================
// 7. HỆ THỐNG HUY HIỆU & GIẤY CHỨNG NHẬN A4
// ==========================================
function unlockBadge(num) {
  const idx = num - 1;
  if (appState.badges[idx]) return;

  appState.badges[idx] = true;
  const badgeCard = document.getElementById(`badge-${num}`);
  if (badgeCard) {
    badgeCard.classList.remove('locked');
    badgeCard.classList.add('unlocked');
    const status = badgeCard.querySelector('.badge-status');
    if (status) status.textContent = 'Đã Đạt ✦';
  }

  audio.playLevelUp();
  appState.xp += 50;
  updateHUD();
}

function checkBadges() {
  const answeredKeys = Object.keys(appState.answered);
  const correctCount = answeredKeys.filter(k => appState.answered[k].correct).length;

  // Badge 4: Điểm Arena >= 160 XP (Đúng từ 8 câu)
  if (appState.arenaScore >= 160 && !appState.badges[3]) {
    unlockBadge(4);
  }

  // Badge 5: Đúng 10/10 câu
  if (correctCount === 10 && !appState.badges[4]) {
    unlockBadge(5);
    audio.playFanfare();
  }

  // Cập nhật xếp loại trên chứng nhận
  const certGrade = document.getElementById('certGrade');
  if (certGrade) {
    if (correctCount === 10) {
      certGrade.textContent = `Xếp loại: Xuất Sắc Tuyệt Đối (10/10 Câu - ${appState.arenaScore} XP)`;
    } else if (correctCount >= 8) {
      certGrade.textContent = `Xếp loại: Giỏi (${correctCount}/10 Câu - ${appState.arenaScore} XP)`;
    } else {
      certGrade.textContent = `Xếp loại: Hoàn Thành (${correctCount}/10 Câu)`;
    }
  }
}

// ==========================================
// 8. ĐIỀU HƯỚNG TABS & HUD PROFILE
// ==========================================
function initNavigation() {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      audio.playClick();
      const target = tab.getAttribute('data-tab');

      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${target}`);
      if (targetContent) targetContent.classList.add('active');

      if (target === 'theory' && !appState.badges[0]) {
        unlockBadge(1);
      }
    });
  });

  // Sound Toggle
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      audio.playClick();
    });
  }

  // Reset Progress
  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập bài này không?')) {
        audio.playClick();
        appState.xp = 0;
        appState.streak = 0;
        appState.arenaScore = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        document.querySelectorAll('.badge-card').forEach(b => {
          b.classList.add('locked');
          b.classList.remove('unlocked');
          b.querySelector('.badge-status').textContent = 'Chưa đạt';
        });
        updateHUD();
        renderQuiz();
      }
    });
  }

  // Avatar Modal
  const avatarBtn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const modalClose = document.getElementById('modalCloseBtn');
  const saveProfileBtn = document.getElementById('saveProfileBtn');
  const nameInput = document.getElementById('nameInput');

  if (avatarBtn && modal) {
    avatarBtn.addEventListener('click', () => {
      audio.playClick();
      modal.style.display = 'flex';
      modal.classList.add('active');
      if (nameInput) nameInput.value = appState.userName;
    });
  }

  if (modalClose && modal) {
    modalClose.addEventListener('click', () => {
      audio.playClick();
      modal.style.display = 'none';
      modal.classList.remove('active');
    });
  }

  document.querySelectorAll('.avatar-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      audio.playClick();
      document.querySelectorAll('.avatar-opt').forEach(o => o.classList.remove('selected'));
      opt.classList.add('selected');
      appState.avatar = opt.getAttribute('data-avatar');
      appState.userTitle = opt.getAttribute('data-title');
    });
  });

  if (saveProfileBtn && modal) {
    saveProfileBtn.addEventListener('click', () => {
      audio.playClick();
      if (nameInput && nameInput.value.trim()) {
        appState.userName = nameInput.value.trim();
      }
      modal.style.display = 'none';
      modal.classList.remove('active');
      updateHUD();
    });
  }

  // Nút in chứng nhận A4
  const btnPrint = document.getElementById('btnPrintCert');
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      audio.playClick();
      window.print();
    });
  }
}

function updateHUD() {
  const avatarEl = document.getElementById('avatarBtn');
  const nameEl = document.getElementById('userNameDisplay');
  const titleEl = document.getElementById('userTitle');
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const certName = document.getElementById('certStudentName');

  if (avatarEl) avatarEl.textContent = appState.avatar;
  if (nameEl) nameEl.textContent = appState.userName;
  if (titleEl) titleEl.textContent = appState.userTitle;
  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (certName) certName.textContent = appState.userName;

  // Tính sao theo XP
  let stars = 2;
  if (appState.xp >= 300) stars = 5;
  else if (appState.xp >= 200) stars = 4;
  else if (appState.xp >= 100) stars = 3;
  appState.stars = stars;

  if (starEl) {
    starEl.textContent = '⭐'.repeat(stars) + '☆'.repeat(5 - stars);
  }
}

// ==========================================
// 9. KHỞI CHẠY ỨNG DỤNG SAU KHI TẢI TRANG
// ==========================================
window.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initLab1();
  initLab2();
  renderQuiz();
  updateHUD();

  // Tự động quét và render KaTeX toàn trang
  renderMathInTree(document.body);

  // Mở khóa Badge 1 sau 2 giây đọc bài
  setTimeout(() => {
    if (!appState.badges[0]) unlockBadge(1);
  }, 2000);
});
