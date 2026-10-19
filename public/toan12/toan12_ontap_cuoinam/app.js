/**
 * TOÁN 12 - TỔNG HỢP TOÀN KHÓA • BÀI TẬP ÔN TẬP CUỐI NĂM
 * Chuẩn hóa 100% Offline KaTeX, Web Audio API, Canvas 2D & Instant Quiz Arena
 */

// ==========================================
// 1. STATE QUẢN LÝ TIẾN TRÌNH HỌC TẬP
// ==========================================
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Thủ Khoa Tốt Nghiệp Toán 12',
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
    const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playTone(freq, 'triangle', 0.35, 0.25), idx * 130);
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
  s = s.replace(/\\approx/g, '<mo>&#8776;</mo>');
  s = s.replace(/\\le/g, '<mo>&#8804;</mo>');
  s = s.replace(/\\ge/g, '<mo>&#8805;</mo>');
  s = s.replace(/\\ne/g, '<mo>&#8800;</mo>');
  s = s.replace(/\\pm/g, '<mo>&#177;</mo>');
  s = s.replace(/\\int/g, '<mo>&#8747;</mo>');
  s = s.replace(/\\lim/g, '<mo>lim</mo>');
  s = s.replace(/\\max/g, '<mo>max</mo>');
  s = s.replace(/\\min/g, '<mo>min</mo>');
  s = s.replace(/\\sin/g, '<mo>sin</mo>');
  s = s.replace(/\\cos/g, '<mo>cos</mo>');
  s = s.replace(/\\pi/g, '<mi>&#960;</mi>');
  s = s.replace(/\\infty/g, '<mo>&#8734;</mo>');
  s = s.replace(/\\implies/g, '<mo>&#8658;</mo>');
  s = s.replace(/\\iff/g, '<mo>&#8660;</mo>');
  s = s.replace(/\\in/g, '<mo>&#8712;</mo>');
  s = s.replace(/\\notin/g, '<mo>&#8713;</mo>');
  s = s.replace(/\\cup/g, '<mo>&#8746;</mo>');
  s = s.replace(/\\cap/g, '<mo>&#8745;</mo>');
  s = s.replace(/\\to/g, '<mo>&#8594;</mo>');
  s = s.replace(/\\mathbb\{R\}/g, '<mi>&#8477;</mi>');
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
// 4. DỮ LIỆU ĐẤU TRƯỜNG 10 CÂU TINH HOA SGK TRANG 90–91
// ==========================================
const quizData = [
  {
    id: 1,
    title: "Câu 1 SGK Trang 90 - Khoảng Nghịch Biến Của Hàm Bậc Ba",
    pts: 20,
    question: "Khoảng nghịch biến của hàm số $y = x^3 - 6x^2 + 9x + 1$ là:",
    options: [
      { text: "$(-\\infty; 1)$", correct: false },
      { text: "$(3; +\\infty)$", correct: false },
      { text: "$(1; 3)$", correct: true },
      { text: "$(-\\infty; +\\infty)$", correct: false }
    ],
    explanation: "Đạo hàm: $y' = 3x^2 - 12x + 9 = 3(x-1)(x-3)$.<br>Cho $y' < 0 \\iff 1 < x < 3$.<br>Vậy hàm số nghịch biến trên khoảng $(1; 3)$."
  },
  {
    id: 2,
    title: "Câu 2 SGK Trang 90 - Giá Trị Lớn Nhất Trên Đoạn",
    pts: 20,
    question: "Giá trị lớn nhất $M$ của hàm số $y = \\frac{x^2 + 3}{x - 1}$ trên đoạn $[2; 4]$ là:",
    options: [
      { text: "$M = 6$", correct: false },
      { text: "$M = 7$", correct: true },
      { text: "$M = \\frac{19}{3}$", correct: false },
      { text: "$M = \\frac{20}{3}$", correct: false }
    ],
    explanation: "Đạo hàm: $y' = \\frac{2x(x-1) - (x^2+3)}{(x-1)^2} = \\frac{x^2 - 2x - 3}{(x-1)^2} = \\frac{(x+1)(x-3)}{(x-1)^2}$.<br>Trên đoạn $[2; 4]$, $y' = 0 \\iff x = 3$.<br>Tính các giá trị: $y(2) = \\frac{7}{1} = 7$; $y(3) = \\frac{12}{2} = 6$; $y(4) = \\frac{19}{3} \\approx 6.33$.<br>Vậy $M = \\max\\limits_{[2; 4]} y = y(2) = 7$."
  },
  {
    id: 3,
    title: "Câu 3 SGK Trang 90 - Tổng Số Đường Tiệm Cận",
    pts: 20,
    question: "Tổng số các đường tiệm cận của đồ thị hàm số $y = \\frac{\\sqrt{x^2 - 1}}{x}$ là:",
    options: [
      { text: "$0$", correct: false },
      { text: "$1$", correct: false },
      { text: "$2$", correct: true },
      { text: "$3$", correct: false }
    ],
    explanation: "Tập xác định: $D = (-\\infty; -1] \\cup [1; +\\infty)$. Do $0 \\notin D$ nên đồ thị không có tiệm cận đứng.<br>Xét giới hạn tại vô cực:<br>$\\lim\\limits_{x \\to +\\infty} \\frac{\\sqrt{x^2 - 1}}{x} = 1 \\implies y = 1$ là tiệm cận ngang.<br>$\\lim\\limits_{x \\to -\\infty} \\frac{\\sqrt{x^2 - 1}}{x} = -1 \\implies y = -1$ là tiệm cận ngang.<br>Vậy đồ thị có đúng 2 đường tiệm cận ngang."
  },
  {
    id: 4,
    title: "Câu 4 SGK Trang 90 - Nhận Diện Đồ Thị Hàm Số",
    pts: 20,
    question: "Đường cong có hai điểm cực trị là $(0; 3)$ và $(2; -1)$ với nhánh bên phải đi lên ($+\\infty$) là đồ thị của hàm số nào sau đây?",
    options: [
      { text: "$y = -x^3 + 3x^2 + 1$", correct: false },
      { text: "$y = x^3 - 3x^2 + 3$", correct: true },
      { text: "$y = -x^2 + 2x + 1$", correct: false },
      { text: "$y = \\frac{x + 1}{x - 1}$", correct: false }
    ],
    explanation: "Xét $y = x^3 - 3x^2 + 3$: $y' = 3x^2 - 6x = 3x(x - 2) = 0 \\iff x = 0$ hoặc $x = 2$.<br>Tại $x = 0 \\implies y = 3$ (Điểm cực đại $(0; 3)$).<br>Tại $x = 2 \\implies y = 8 - 12 + 3 = -1$ (Điểm cực tiểu $(2; -1)$).<br>Hệ số $a = 1 > 0$ nên nhánh bên phải đi lên, hoàn toàn trùng khớp với đồ thị."
  },
  {
    id: 5,
    title: "Câu 5 SGK Trang 90 - Họ Nguyên Hàm Cơ Bản",
    pts: 20,
    question: "Cho hàm số $f(x) = x^2 + 3$. Họ tất cả các nguyên hàm của $f(x)$ là:",
    options: [
      { text: "$\\int f(x)dx = 2x + C$", correct: false },
      { text: "$\\int f(x)dx = x^2 + 3x + C$", correct: false },
      { text: "$\\int f(x)dx = x^3 + 3x + C$", correct: false },
      { text: "$\\int f(x)dx = \\frac{x^3}{3} + 3x + C$", correct: true }
    ],
    explanation: "Theo công thức nguyên hàm cơ bản: $\\int (x^2 + 3)dx = \\frac{x^3}{3} + 3x + C$."
  },
  {
    id: 6,
    title: "Câu 6 SGK Trang 90 - Tích Phân & Tìm Hàm Gốc",
    pts: 20,
    question: "Cho hàm số $f(x)$ thoả mãn $f(0) = 1$ và $f'(x) = 2\\sin x + 1$. Khi đó giá trị của $\\int_0^{\\pi/2} f(x)dx$ bằng:",
    options: [
      { text: "$\\frac{\\pi^2 + 12\\pi - 16}{8}$", correct: true },
      { text: "$\\frac{\\pi^2 - 4\\pi + 16}{8}$", correct: false },
      { text: "$\\frac{\\pi^2 + 6\\pi - 8}{4}$", correct: false },
      { text: "$\\frac{\\pi^2 - 2\\pi + 8}{4}$", correct: false }
    ],
    explanation: "Ta có $f(x) = \\int (2\\sin x + 1)dx = -2\\cos x + x + C$.<br>Vì $f(0) = 1 \\iff -2\\cos 0 + 0 + C = 1 \\iff -2 + C = 1 \\iff C = 3$.<br>Do đó $f(x) = -2\\cos x + x + 3$.<br>Tính tích phân:<br>$\\int_0^{\\pi/2} (-2\\cos x + x + 3)dx = \\left[ -2\\sin x + \\frac{x^2}{2} + 3x \\right]_0^{\\pi/2} = -2(1) + \\frac{\\pi^2}{8} + \\frac{3\\pi}{2} = \\frac{\\pi^2 + 12\\pi - 16}{8}$."
  },
  {
    id: 7,
    title: "Câu 8 SGK Trang 91 - Thể Tích Khối Tròn Xoay Quanh Ox",
    pts: 20,
    question: "Gọi $(H)$ là hình phẳng giới hạn bởi các đường $y = 2\\sqrt{x}$, $y = 0$, $x = 0$ và $x = 4$. Thể tích $V$ của khối tròn xoay sinh ra khi quay hình phẳng $(H)$ quanh trục $Ox$ là:",
    options: [
      { text: "$V = 32$", correct: false },
      { text: "$V = 32\\pi$", correct: true },
      { text: "$V = \\frac{32}{3}$", correct: false },
      { text: "$V = \\frac{32\\pi}{3}$", correct: false }
    ],
    explanation: "Áp dụng công thức thể tích khối tròn xoay quanh trục $Ox$:<br>$V = \\pi \\int_0^4 (2\\sqrt{x})^2 dx = \\pi \\int_0^4 4x dx = \\pi \\left[ 2x^2 \\right]_0^4 = \\pi (2 \\cdot 16 - 0) = 32\\pi$."
  },
  {
    id: 8,
    title: "Câu 9 SGK Trang 91 - Hệ Thức Vectơ Trong Tứ Diện",
    pts: 20,
    question: "Cho tứ diện $ABCD$, gọi $G$ là trọng tâm tam giác $BCD$ và $M$ là trung điểm của đoạn thẳng $AG$. Khi đó tổng vectơ $\\overrightarrow{MA} + \\overrightarrow{MB} + \\overrightarrow{MC} + \\overrightarrow{MD}$ bằng:",
    options: [
      { text: "$\\overrightarrow{MG}$", correct: false },
      { text: "$2\\overrightarrow{MG}$", correct: true },
      { text: "$3\\overrightarrow{MG}$", correct: false },
      { text: "$4\\overrightarrow{MG}$", correct: false }
    ],
    explanation: "Vì $G$ là trọng tâm $\\triangle BCD$ nên $\\overrightarrow{GB} + \\overrightarrow{GC} + \\overrightarrow{GD} = \\overrightarrow{0}$.<br>Do đó: $\\overrightarrow{MB} + \\overrightarrow{MC} + \\overrightarrow{MD} = 3\\overrightarrow{MG} + (\\overrightarrow{GB} + \\overrightarrow{GC} + \\overrightarrow{GD}) = 3\\overrightarrow{MG}$.<br>Vì $M$ là trung điểm $AG$ nên $\\overrightarrow{MA} + \\overrightarrow{MG} = \\overrightarrow{0} \\implies \\overrightarrow{MA} = -\\overrightarrow{MG}$.<br>Vậy: $\\overrightarrow{MA} + \\overrightarrow{MB} + \\overrightarrow{MC} + \\overrightarrow{MD} = -\\overrightarrow{MG} + 3\\overrightarrow{MG} = 2\\overrightarrow{MG}$."
  },
  {
    id: 9,
    title: "Câu 11 SGK Trang 91 - Côsin Của Góc Giữa Đường Thẳng Và Mặt Phẳng",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho $d: \\begin{cases} x = 2 - t \\\\ y = 3 \\\\ z = -1 + 2t \\end{cases}$ và $(P): 2x - y - 2z + 1 = 0$. Côsin của góc giữa đường thẳng $d$ và mặt phẳng $(P)$ là:",
    options: [
      { text: "$\\frac{2\\sqrt{5}}{5}$", correct: false },
      { text: "$\\frac{\\sqrt{5}}{5}$", correct: true },
      { text: "$\\frac{2\\sqrt{3}}{5}$", correct: false },
      { text: "$\\frac{\\sqrt{3}}{5}$", correct: false }
    ],
    explanation: "Vectơ chỉ phương của $d$ là $\\overrightarrow{u} = (-1; 0; 2)$. Vectơ pháp tuyến của $(P)$ là $\\overrightarrow{n} = (2; -1; -2)$.<br>Gọi $\\varphi$ là góc giữa đường thẳng $d$ và mặt phẳng $(P)$ ($0^\\circ \\le \\varphi \\le 90^\\circ$):<br>$\\sin\\varphi = \\frac{|\\overrightarrow{u} \\cdot \\overrightarrow{n}|}{|\\overrightarrow{u}| \\cdot |\\overrightarrow{n}|} = \\frac{|(-1)(2) + 0(-1) + 2(-2)|}{\\sqrt{(-1)^2 + 0^2 + 2^2} \\cdot \\sqrt{2^2 + (-1)^2 + (-2)^2}} = \\frac{|-6|}{\\sqrt{5} \\cdot 3} = \\frac{2}{\\sqrt{5}} = \\frac{2\\sqrt{5}}{5}$.<br>Do đó: $\\cos\\varphi = \\sqrt{1 - \\sin^2\\varphi} = \\sqrt{1 - \\frac{4}{5}} = \\frac{1}{\\sqrt{5}} = \\frac{\\sqrt{5}}{5}$."
  },
  {
    id: 10,
    title: "Câu 12 SGK Trang 91 - Phương Trình Mặt Phẳng Đoạn Chắn",
    pts: 20,
    question: "Trong không gian $Oxyz$, cho điểm $M(2; -1; 3)$. Gọi $A, B, C$ lần lượt là hình chiếu vuông góc của $M$ trên các trục $Ox, Oy, Oz$. Phương trình mặt phẳng $(ABC)$ là:",
    options: [
      { text: "$3x - 6y + 2z + 6 = 0$", correct: false },
      { text: "$3x - 6y + 2z - 6 = 0$", correct: true },
      { text: "$3x - 2y + 2z - 1 = 0$", correct: false },
      { text: "$3x - 6y + 2z - 1 = 0$", correct: false }
    ],
    explanation: "Tọa độ các hình chiếu của $M(2; -1; 3)$ trên các trục là $A(2; 0; 0), B(0; -1; 0), C(0; 0; 3)$.<br>Áp dụng phương trình mặt phẳng theo đoạn chắn:<br>$\\frac{x}{2} + \\frac{y}{-1} + \\frac{z}{3} = 1 \\iff 3x - 6y + 2z = 6 \\iff 3x - 6y + 2z - 6 = 0$."
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

// --- LAB 1: KÍNH VẠN HOA GIẢI TÍCH 12 ---
function initLab1() {
  const canvas = document.getElementById('calcCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const curveType = document.getElementById('curveType');
  const paramA = document.getElementById('paramA');
  const paramX = document.getElementById('paramX');
  const paramAVal = document.getElementById('paramAVal');
  const paramXVal = document.getElementById('paramXVal');
  const output = document.getElementById('calcOutput');

  function drawCalculus() {
    const type = curveType.value;
    const a = parseFloat(paramA.value);
    const x0 = parseFloat(paramX.value);

    paramAVal.textContent = a.toFixed(1);
    paramXVal.textContent = x0.toFixed(1);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const origin = { x: w / 2, y: h / 2 };
    const scaleX = 50;
    const scaleY = 30;

    // Vẽ lưới tọa độ
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let x = -8; x <= 8; x++) {
      const px = origin.x + x * scaleX;
      ctx.beginPath();
      ctx.moveTo(px, 0);
      ctx.lineTo(px, h);
      ctx.stroke();
    }
    for (let y = -6; y <= 6; y++) {
      const py = origin.y - y * scaleY;
      ctx.beginPath();
      ctx.moveTo(0, py);
      ctx.lineTo(w, py);
      ctx.stroke();
    }

    // Vẽ trục tọa độ
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    // Ox
    ctx.beginPath();
    ctx.moveTo(0, origin.y);
    ctx.lineTo(w, origin.y);
    ctx.stroke();
    // Oy
    ctx.beginPath();
    ctx.moveTo(origin.x, 0);
    ctx.lineTo(origin.x, h);
    ctx.stroke();

    // Hàm toán học và đạo hàm
    let f, fPrime, titleStr, formulaLatex;

    if (type === 'cubic') {
      // y = a*x^3 - 3*x^2 + 3
      f = x => a * Math.pow(x, 3) - 3 * Math.pow(x, 2) + 3;
      fPrime = x => 3 * a * Math.pow(x, 2) - 6 * x;
      formulaLatex = `$y = ${a !== 1 ? a : ''}x^3 - 3x^2 + 3$`;
      titleStr = 'Hàm Số Bậc Ba Khảo Sát Cực Trị';
    } else if (type === 'rational') {
      // y = (x^2 + 3) / (x - 1)
      f = x => Math.abs(x - 1) < 0.05 ? NaN : (Math.pow(x, 2) + 3) / (x - 1);
      fPrime = x => Math.abs(x - 1) < 0.05 ? NaN : (Math.pow(x, 2) - 2 * x - 3) / Math.pow(x - 1, 2);
      formulaLatex = `$y = \\frac{x^2 + 3}{x - 1}$`;
      titleStr = 'Hàm Phân Thức Tiệm Cận Đứng & Xiên';
    } else {
      // Integral function y = x^2 - 2x
      f = x => a * (Math.pow(x, 2) - 2 * x);
      fPrime = x => a * (2 * x - 2);
      formulaLatex = `$y = ${a !== 1 ? a : ''}(x^2 - 2x)$`;
      titleStr = 'Diện Tích Hình Phẳng Tích Phân Giới Hạn';
    }

    // Tô vùng tích phân nếu chọn loại Integral
    if (type === 'integral') {
      ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.beginPath();
      const xStart = 0;
      const xEnd = Math.max(0, Math.min(x0, 4));
      ctx.moveTo(origin.x + xStart * scaleX, origin.y);
      for (let x = xStart; x <= xEnd; x += 0.05) {
        const y = f(x);
        ctx.lineTo(origin.x + x * scaleX, origin.y - y * scaleY);
      }
      ctx.lineTo(origin.x + xEnd * scaleX, origin.y);
      ctx.closePath();
      ctx.fill();
    }

    // Vẽ đường cong đồ thị
    ctx.beginPath();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    let started = false;

    for (let px = 0; px < w; px += 2) {
      const x = (px - origin.x) / scaleX;
      const y = f(x);
      if (isNaN(y) || Math.abs(y) > 12) {
        started = false;
        continue;
      }
      const py = origin.y - y * scaleY;
      if (!started) {
        ctx.moveTo(px, py);
        started = true;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();

    // Vẽ tiếp tuyến tại x0
    const y0 = f(x0);
    const slope = fPrime(x0);
    if (!isNaN(y0) && !isNaN(slope)) {
      const px0 = origin.x + x0 * scaleX;
      const py0 = origin.y - y0 * scaleY;

      // Điểm tiếp xúc
      ctx.beginPath();
      ctx.arc(px0, py0, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#f59e0b';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Đường tiếp tuyến
      ctx.beginPath();
      ctx.strokeStyle = '#f43f5e';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      const dxLine = 2.5;
      const pt1 = { x: px0 - dxLine * scaleX, y: py0 + slope * dxLine * scaleY };
      const pt2 = { x: px0 + dxLine * scaleX, y: py0 - slope * dxLine * scaleY };
      ctx.moveTo(pt1.x, pt1.y);
      ctx.lineTo(pt2.x, pt2.y);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Cập nhật thông tin chi tiết
    output.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
        <div class="rule-box gold">
          <strong>1. Phân Tích Hàm Số Hiện Tại:</strong><br>
          Đang khảo sát ${formulaLatex} tại điểm $x_0 = ${x0.toFixed(1)}$:<br>
          Giá trị hàm: $y(x_0) = ${isNaN(y0) ? '\\text{Không xác định}' : y0.toFixed(2)}$<br>
          Hệ số góc tiếp tuyến: $f'(x_0) = ${isNaN(slope) ? '\\text{Không xác định}' : slope.toFixed(2)}$
        </div>
        <div class="rule-box">
          <strong>2. Ý Nghĩa Hình Học & Giải Tích:</strong><br>
          ${slope > 0.05 ? '📈 Hàm số đang <strong>đồng biến</strong> tại $x_0$ ($f\' > 0$). Tiếp tuyến hướng lên.' :
            slope < -0.05 ? '📉 Hàm số đang <strong>nghịch biến</strong> tại $x_0$ ($f\' < 0$). Tiếp tuyến hướng xuống.' :
            '⚖️ Điểm <strong>dừng/cực trị tiềm năng</strong> tại $x_0$ ($f\' \\approx 0$). Tiếp tuyến nằm ngang!'}
        </div>
      </div>
    `;
    renderMathInTree(output);
  }

  [curveType, paramA, paramX].forEach(el => {
    el.addEventListener('input', () => {
      drawCalculus();
      markLabInteracted(2);
    });
  });

  const btnCubic = document.getElementById('btnPresetCubic');
  if (btnCubic) {
    btnCubic.addEventListener('click', () => {
      audio.playClick();
      curveType.value = 'cubic';
      paramA.value = 1.0;
      paramX.value = 2.0;
      drawCalculus();
      markLabInteracted(2);
    });
  }

  const btnRational = document.getElementById('btnPresetRational');
  if (btnRational) {
    btnRational.addEventListener('click', () => {
      audio.playClick();
      curveType.value = 'rational';
      paramA.value = 1.0;
      paramX.value = 3.0;
      drawCalculus();
      markLabInteracted(2);
    });
  }

  const btnArea = document.getElementById('btnPresetArea');
  if (btnArea) {
    btnArea.addEventListener('click', () => {
      audio.playClick();
      curveType.value = 'integral';
      paramA.value = 1.0;
      paramX.value = 3.0;
      drawCalculus();
      markLabInteracted(2);
    });
  }

  drawCalculus();
}

// --- LAB 2: TRẠM KHÔNG GIAN OXYZ 3D ---
function initLab2() {
  const canvas = document.getElementById('spaceCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const coordX = document.getElementById('coordX');
  const coordY = document.getElementById('coordY');
  const coordZ = document.getElementById('coordZ');
  const rotAngle = document.getElementById('rotAngle');

  const coordXVal = document.getElementById('coordXVal');
  const coordYVal = document.getElementById('coordYVal');
  const coordZVal = document.getElementById('coordZVal');
  const rotAngleVal = document.getElementById('rotAngleVal');
  const output = document.getElementById('spaceOutput');

  function draw3D() {
    const x0 = parseFloat(coordX.value);
    const y0 = parseFloat(coordY.value);
    const z0 = parseFloat(coordZ.value);
    const angleDeg = parseFloat(rotAngle.value);
    const rad = (angleDeg * Math.PI) / 180;

    coordXVal.textContent = x0;
    coordYVal.textContent = y0;
    coordZVal.textContent = z0;
    rotAngleVal.textContent = `${angleDeg}°`;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 30;
    const scale = 28;

    // Chiếu Isometric xoay quanh trục thẳng đứng Z
    function project(x, y, z) {
      // Xoay theo góc rad
      const rx = x * Math.cos(rad) - y * Math.sin(rad);
      const ry = x * Math.sin(rad) + y * Math.cos(rad);
      // Chiếu lên 2D màn hình
      const screenX = cx + (rx - ry * 0.5) * scale;
      const screenY = cy - (z * scale - ry * 0.4 * scale);
      return { x: screenX, y: screenY };
    }

    // Vẽ 3 trục tọa độ Ox, Oy, Oz
    const o = project(0, 0, 0);
    const px = project(6, 0, 0);
    const py = project(0, 6, 0);
    const pz = project(0, 0, 6);

    // Trục Ox (Đỏ)
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(px.x, px.y);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#ef4444';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.fillText('x (Ox)', px.x + 8, px.y);

    // Trục Oy (Xanh lục)
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(py.x, py.y);
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#10b981';
    ctx.fillText('y (Oy)', py.x + 8, py.y);

    // Trục Oz (Xanh dương)
    ctx.beginPath();
    ctx.moveTo(o.x, o.y);
    ctx.lineTo(pz.x, pz.y);
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('z (Oz)', pz.x - 4, pz.y - 8);

    // Điểm M và các hình chiếu A, B, C
    const pM = project(x0, y0, z0);
    const pA = project(x0, 0, 0);
    const pB = project(0, y0, 0);
    const pC = project(0, 0, z0);
    const pM_xy = project(x0, y0, 0);

    // Vẽ hộp tọa độ đứt nét
    ctx.setLineDash([3, 3]);
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 1.5;

    // Nối đáy
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pM_xy.x, pM_xy.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.stroke();

    // Nối cột cao
    ctx.beginPath();
    ctx.moveTo(pM_xy.x, pM_xy.y);
    ctx.lineTo(pM.x, pM.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.stroke();
    ctx.setLineDash([]);

    // Vẽ mặt phẳng đoạn chắn (ABC)
    if (x0 !== 0 && y0 !== 0 && z0 !== 0) {
      ctx.fillStyle = 'rgba(99, 102, 241, 0.25)';
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pB.x, pB.y);
      ctx.lineTo(pC.x, pC.y);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Vẽ các điểm
    function drawPoint(pt, label, col = '#f59e0b') {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px Inter, sans-serif';
      ctx.fillText(label, pt.x + 8, pt.y - 4);
    }

    drawPoint(pA, `A(${x0};0;0)`, '#ef4444');
    drawPoint(pB, `B(0;${y0};0)`, '#10b981');
    drawPoint(pC, `C(0;0;${z0})`, '#3b82f6');
    drawPoint(pM, `M(${x0};${y0};${z0})`, '#f59e0b');

    // Cập nhật công thức đoạn chắn và phân tích
    const eqStr = (x0 !== 0 && y0 !== 0 && z0 !== 0)
      ? `$\\frac{x}{${x0}} + \\frac{y}{${y0}} + \\frac{z}{${z0}} = 1$`
      : 'Không tạo thành mặt phẳng đoạn chắn khi một tọa độ bằng 0';

    output.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px;">
        <div class="rule-box gold">
          <strong>1. Phương Trình Mặt Phẳng Đoạn Chắn $(ABC)$ (Câu 12 SGK):</strong><br>
          ${eqStr}<br>
          Quy đồng mẫu số: $(${y0 * z0})x + (${x0 * z0})y + (${x0 * y0})z - (${x0 * y0 * z0}) = 0$
        </div>
        <div class="rule-box">
          <strong>2. Khoảng Cách Từ Gốc Tọa Độ $O$ Đến Điểm $M$:</strong><br>
          $OM = \\sqrt{x_0^2 + y_0^2 + z_0^2} = \\sqrt{${x0}^2 + (${y0})^2 + ${z0}^2} = <strong>${Math.sqrt(x0*x0 + y0*y0 + z0*z0).toFixed(2)}</strong>$
        </div>
      </div>
    `;
    renderMathInTree(output);
  }

  [coordX, coordY, coordZ, rotAngle].forEach(el => {
    el.addEventListener('input', () => {
      draw3D();
      markLabInteracted(3);
    });
  });

  const btnSGK12 = document.getElementById('btnPresetSGK12');
  if (btnSGK12) {
    btnSGK12.addEventListener('click', () => {
      audio.playClick();
      coordX.value = 2;
      coordY.value = -1;
      coordZ.value = 3;
      rotAngle.value = 35;
      draw3D();
      markLabInteracted(3);
    });
  }

  const btnLinePlane = document.getElementById('btnPresetLinePlane');
  if (btnLinePlane) {
    btnLinePlane.addEventListener('click', () => {
      audio.playClick();
      coordX.value = 3;
      coordY.value = 3;
      coordZ.value = 4;
      rotAngle.value = 75;
      draw3D();
      markLabInteracted(3);
    });
  }

  const btnReset = document.getElementById('btnReset3D');
  if (btnReset) {
    btnReset.addEventListener('click', () => {
      audio.playClick();
      coordX.value = 2;
      coordY.value = 2;
      coordZ.value = 2;
      rotAngle.value = 45;
      draw3D();
      markLabInteracted(3);
    });
  }

  draw3D();
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
