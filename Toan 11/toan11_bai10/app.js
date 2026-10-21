// ================================================================
// BÀI 10: ĐƯỜNG THẲNG VÀ MẶT PHẲNG TRONG KHÔNG GIAN - TOÁN 11 KNTT
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

function renderMathInTree(root = document.body) {
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
      console.warn("KaTeX render failed, using MathML fallback:", e);
    }
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parentTag = node.parentElement ? node.parentElement.tagName.toLowerCase() : '';
      if (parentTag === 'script' || parentTag === 'style' || parentTag === 'textarea') return NodeFilter.FILTER_REJECT;
      return (node.nodeValue && node.nodeValue.includes('$')) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
    }
  });

  const nodesToProcess = [];
  while (walker.nextNode()) nodesToProcess.push(walker.currentNode);
  nodesToProcess.forEach(node => {
    const text = node.nodeValue;
    if (!text || !text.includes('$')) return;
    const formatted = formatMathText(text);
    if (formatted !== text) {
      const temp = document.createElement('span');
      temp.innerHTML = formatted;
      node.replaceWith(...temp.childNodes);
    }
  });
}

// --- 1. HỆ THỐNG ÂM THANH NATIVE (WEB AUDIO API) ---
class SoundController {
  constructor() {
    this.ctx = null;
  }
  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
  }
  playClick() {
    if (!appState.sound) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.ctx.currentTime);
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.06);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.06);
  }
  playCorrect() {
    if (!appState.sound) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.08);
      gain.gain.setValueAtTime(0.12, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.15);
    });
  }
  playWrong() {
    if (!appState.sound) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [260, 220, 180].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.15, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.14);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.14);
    });
  }
  playLevelUp() {
    if (!appState.sound) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [440, 554.37, 659.25, 880].forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);
      gain.gain.setValueAtTime(0.15, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.25);
    });
  }
  playFanfare() {
    if (!appState.sound) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 523.25, 523.25, 659.25, 783.99, 1046.5];
    const times = [0, 0.15, 0.3, 0.45, 0.65, 0.9];
    notes.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + times[i]);
      gain.gain.setValueAtTime(0.2, now + times[i]);
      gain.gain.exponentialRampToValueAtTime(0.001, now + times[i] + 0.35);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + times[i]);
      osc.stop(now + times[i] + 0.35);
    });
  }
}
const sounds = new SoundController();

// --- 2. TRẠNG THÁI TOÀN CỤC CỦA BÀI HỌC ---
let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nhà Thám Hiểm Không Gian 3D',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const avatars = [
  { icon: '👑', name: 'Chiến Binh Logic', title: 'Nhà Thám Hiểm Không Gian 3D' },
  { icon: '🧙‍♂️', name: 'Phù Thủy Hình Học', title: 'Bậc Thầy Giao Tuyến Không Gian' },
  { icon: '📐', name: 'Kiến Trúc Sư 3D', title: 'Chuyên Gia Mô Hình Đa Diện' },
  { icon: '🚀', name: 'Phi Hành Gia', title: 'Nhà Du Hành Đa Chiều' },
  { icon: '🤖', name: 'Cyber Euler', title: 'Hệ Điều Hành Tư Duy Không Gian' },
  { icon: '⚡', name: 'Tia Chớp Vector', title: 'Chiến Tướng Không Gian Số' },
  { icon: '🐱', name: 'Mèo Không Gian', title: 'Thần Đồng Hình Học 11' },
  { icon: '🦊', name: 'Cáo Thông Thái', title: 'Nhà Lý Thuyết Không Gian' }
];

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG TRẮC NGHIỆM (10 CÂU CHUẨN SGK BÀI 10 KNTT) ---
const quizData = [
  {
    id: 1,
    title: "Câu 1: Số điểm chung của hai mặt phẳng phân biệt (SGK TC5)",
    pts: 20,
    question: "Nếu hai mặt phẳng phân biệt có một điểm chung thì chúng có bao nhiêu điểm chung?",
    options: [
      { text: "Chỉ có duy nhất $1$ điểm chung đó", correct: false },
      { text: "Có đúng $2$ điểm chung phân biệt", correct: false },
      { text: "Có vô số điểm chung cùng thuộc một đường thẳng duy nhất", correct: true },
      { text: "Không thể xác định được số điểm chung", correct: false }
    ],
    explanation: "Theo Tính chất thừa nhận 5: Nếu hai mặt phẳng phân biệt có một điểm chung thì chúng có một đường thẳng chung duy nhất đi qua điểm chung đó. Đường thẳng này chứa vô số điểm chung và được gọi là giao tuyến của hai mặt phẳng."
  },
  {
    id: 2,
    title: "Câu 2: Số mặt phẳng đi qua ba điểm không thẳng hàng (SGK TC2)",
    pts: 20,
    question: "Có bao nhiêu mặt phẳng đi qua ba điểm phân biệt không thẳng hàng $A, B, C$?",
    options: [
      { text: "Có đúng $1$ mặt phẳng duy nhất", correct: true },
      { text: "Có $2$ mặt phẳng", correct: false },
      { text: "Có $3$ mặt phẳng", correct: false },
      { text: "Có vô số mặt phẳng", correct: false }
    ],
    explanation: "Theo Tính chất thừa nhận 2: Có một và chỉ một mặt phẳng đi qua ba điểm không thẳng hàng, kí hiệu là mặt phẳng $(ABC)$ hoặc $\\text{mp}(ABC)$."
  },
  {
    id: 3,
    title: "Câu 3: Số mặt phẳng tạo bởi bốn điểm không đồng phẳng (SGK 4.5)",
    pts: 20,
    question: "Cho bốn điểm $A, B, C, D$ không đồng phẳng. Có bao nhiêu mặt phẳng đi qua ba trong số bốn điểm đã cho?",
    options: [
      { text: "$1$ mặt phẳng", correct: false },
      { text: "$3$ mặt phẳng", correct: false },
      { text: "$4$ mặt phẳng", correct: true },
      { text: "$6$ mặt phẳng", correct: false }
    ],
    explanation: "Cứ 3 điểm không thẳng hàng tạo thành 1 mặt phẳng duy nhất. Số mặt phẳng tạo bởi 3 trong 4 điểm không đồng phẳng là $C_4^3 = 4$ mặt phẳng: $(ABC), (ACD), (ABD), (BCD)$ (đây chính là 4 mặt của hình tứ diện $ABCD$)."
  },
  {
    id: 4,
    title: "Câu 4: Số cạnh của một hình chóp (SGK Mục 4)",
    pts: 20,
    question: "Một hình chóp có đáy là đa giác $n$ cạnh ($n \\ge 3$) thì có tất cả bao nhiêu cạnh?",
    options: [
      { text: "$n + 1$ cạnh", correct: false },
      { text: "$2n$ cạnh", correct: true },
      { text: "$2n + 1$ cạnh", correct: false },
      { text: "$3n$ cạnh", correct: false }
    ],
    explanation: "Hình chóp đáy $n$-giác có $n$ cạnh đáy và $n$ cạnh bên nối đỉnh chóp tới các đỉnh của đáy. Tổng số cạnh là $n + n = 2n$ cạnh."
  },
  {
    id: 5,
    title: "Câu 5: Nhận diện cặp cạnh đối diện của hình tứ diện (SGK Mục 4)",
    pts: 20,
    question: "Trong hình tứ diện $ABCD$, cặp cạnh nào sau đây là hai cạnh đối diện?",
    options: [
      { text: "$AB$ và $BC$", correct: false },
      { text: "$AB$ và $CD$", correct: true },
      { text: "$AC$ và $CD$", correct: false },
      { text: "$AD$ và $BD$", correct: false }
    ],
    explanation: "Trong hình tứ diện, hai cạnh không có đỉnh chung được gọi là hai cạnh đối diện. Các cặp cạnh đối diện của tứ diện $ABCD$ là: $(AB, CD)$, $(AC, BD)$, $(AD, BC)$."
  },
  {
    id: 6,
    title: "Câu 6: Điều kiện đường thẳng nằm trong mặt phẳng (SGK TC4)",
    pts: 20,
    question: "Khẳng định nào sau đây là ĐÚNG về điều kiện để đường thẳng $d$ nằm trong mặt phẳng $(P)$?",
    options: [
      { text: "Đường thẳng $d$ chỉ cần có $1$ điểm thuộc $(P)$", correct: false },
      { text: "Đường thẳng $d$ có $2$ điểm phân biệt cùng thuộc $(P)$", correct: true },
      { text: "Đường thẳng $d$ không cắt mặt phẳng $(P)$", correct: false },
      { text: "Đường thẳng $d$ vuông góc với một đường thẳng trong $(P)$", correct: false }
    ],
    explanation: "Theo Tính chất thừa nhận 4: Nếu một đường thẳng có hai điểm phân biệt thuộc một mặt phẳng thì tất cả các điểm của đường thẳng đều thuộc mặt phẳng đó ($d \\subset (P)$)."
  },
  {
    id: 7,
    title: "Câu 7: Điểm chung của hai mặt phẳng qua đỉnh chóp (SGK 4.4)",
    pts: 20,
    question: "Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành. Điểm nào sau đây chắc chắn là một điểm chung của hai mặt phẳng $(SAB)$ và $(SCD)$?",
    options: [
      { text: "Điểm $A$", correct: false },
      { text: "Điểm $B$", correct: false },
      { text: "Đỉnh $S$", correct: true },
      { text: "Tâm của hình bình hành $ABCD$", correct: false }
    ],
    explanation: "Cả hai mặt phẳng $(SAB)$ và $(SCD)$ đều chứa đỉnh $S$, do đó $S$ là điểm chung đầu tiên của hai mặt phẳng này."
  },
  {
    id: 8,
    title: "Câu 8: Ứng dụng thực tế của ba điểm không thẳng hàng (SGK Vận dụng 1)",
    pts: 20,
    question: "Tại sao chân đỡ máy ảnh, kiềng nấu bếp, giá vẽ tranh thường được thiết kế $3$ chân mà không phải $4$ chân?",
    options: [
      { text: "Vì $3$ chân tiết kiệm vật liệu hơn $4$ chân", correct: false },
      { text: "Vì qua $3$ điểm không thẳng hàng luôn xác định duy nhất một mặt phẳng, giúp kiềng luôn đứng vững không bị bập bênh", correct: true },
      { text: "Vì $3$ chân giúp vật thể có khối lượng nhẹ hơn", correct: false },
      { text: "Vì tam giác có diện tích nhỏ hơn tứ giác", correct: false }
    ],
    explanation: "Ba điểm phân biệt không thẳng hàng luôn luôn xác định duy nhất một mặt phẳng. Do đó ba đầu mút của chân đế luôn cùng nằm trên một mặt phẳng, giúp vật dụng tự động thích ứng vững vàng trên mọi mặt sàn gồ ghề mà không bị kênh hay bập bênh."
  },
  {
    id: 9,
    title: "Câu 9: Số mặt phẳng tạo bởi đỉnh chóp và hai đỉnh đáy (SGK Ví dụ 1)",
    pts: 20,
    question: "Cho hình chóp tứ giác $S.ABCD$ (không có ba đỉnh đáy nào thẳng hàng). Có bao nhiêu mặt phẳng tạo bởi đỉnh $S$ và hai đỉnh bất kì của đáy $ABCD$?",
    options: [
      { text: "$4$ mặt phẳng", correct: false },
      { text: "$5$ mặt phẳng", correct: false },
      { text: "$6$ mặt phẳng", correct: true },
      { text: "$8$ mặt phẳng", correct: false }
    ],
    explanation: "Số cách chọn $2$ đỉnh bất kì từ $4$ đỉnh đáy $\{A, B, C, D\}$ là $C_4^2 = \\frac{4 \\times 3}{2} = 6$. Mỗi cặp đỉnh đáy cùng với đỉnh $S$ xác định đúng $1$ mặt phẳng. Sáu mặt phẳng đó là: $(SAB), (SBC), (SCD), (SDA), (SAC), (SBD)$."
  },
  {
    id: 10,
    title: "Câu 10: Giao tuyến của hai mặt phẳng trong tứ diện (SGK 4.6)",
    pts: 20,
    question: "Cho hình tứ diện $ABCD$. Gọi $M$ là trung điểm của $AB$ và $N$ là trung điểm của $CD$. Giao tuyến của hai mặt phẳng $(ABN)$ và $(CDM)$ là:",
    options: [
      { text: "Đường thẳng $AC$", correct: false },
      { text: "Đường thẳng $BD$", correct: false },
      { text: "Đường thẳng $MN$", correct: true },
      { text: "Đường thẳng nối hai trung điểm của $AC$ và $BD$", correct: false }
    ],
    explanation: "Ta có: $M \\in AB \\implies M \\in (ABN)$, đồng thời $M \\in (CDM)$, do đó $M$ là điểm chung thứ nhất. Lại có $N \\in CD \\implies N \\in (CDM)$, đồng thời $N \\in (ABN)$, do đó $N$ là điểm chung thứ hai. Vậy giao tuyến của $(ABN)$ và $(CDM)$ chính là đường thẳng $MN$."
  }
];

// --- 4. RENDER VÀ ĐIỀU HÀNH QUIZ ---
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;

  container.innerHTML = '';
  quizData.forEach((q) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quizCard-${q.id}`;

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `
      <span class="quiz-badge">📌 ${q.title}</span>
      <span class="quiz-pts">+${q.pts} XP</span>
    `;
    card.appendChild(header);

    const questionP = document.createElement('div');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'quiz-options-grid';

    const labels = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.id = `optBtn-${q.id}-${optIndex}`;
      btn.innerHTML = `
        <span class="opt-label">${labels[optIndex]}.</span>
        <span class="opt-text">${opt.text}</span>
      `;

      btn.addEventListener('click', () => handleAnswer(q, optIndex));
      optionsGrid.appendChild(btn);
    });
    card.appendChild(optionsGrid);

    const explanation = document.createElement('div');
    explanation.className = 'explanation-box';
    explanation.id = `explanation-${q.id}`;
    explanation.style.display = 'none';
    explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;
    card.appendChild(explanation);

    container.appendChild(card);
  });

  renderMathInTree(container);
}

function handleAnswer(question, chosenIndex) {
  if (appState.answered[question.id] !== undefined) return;

  appState.answered[question.id] = chosenIndex;
  const isCorrect = question.options[chosenIndex].correct;

  const chosenBtn = document.getElementById(`optBtn-${question.id}-${chosenIndex}`);
  if (chosenBtn) {
    if (isCorrect) {
      chosenBtn.classList.add('correct');
      sounds.playCorrect();
      appState.xp += question.pts;
      appState.streak += 1;
      if (appState.streak >= 3) {
        appState.stars = Math.min(5, appState.stars + 1);
      }
    } else {
      chosenBtn.classList.add('wrong');
      sounds.playWrong();
      appState.streak = 0;

      question.options.forEach((opt, idx) => {
        if (opt.correct) {
          const correctBtn = document.getElementById(`optBtn-${question.id}-${idx}`);
          if (correctBtn) correctBtn.classList.add('correct');
        }
      });
    }
  }

  // Khóa tất cả các nút trong câu
  question.options.forEach((_, idx) => {
    const btn = document.getElementById(`optBtn-${question.id}-${idx}`);
    if (btn) btn.disabled = true;
  });

  // Hiển thị hộp giải thích chi tiết
  const expBox = document.getElementById(`explanation-${question.id}`);
  if (expBox) {
    expBox.style.display = 'block';
    renderMathInTree(expBox);
  }

  updateHUD();
  checkBadges();
}

function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starsEl = document.getElementById('starRating');
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (starsEl) starsEl.textContent = '⭐'.repeat(appState.stars) + '☆'.repeat(5 - appState.stars);

  const answeredCount = Object.keys(appState.answered).length;
  if (progEl) progEl.textContent = `Tiến độ: ${answeredCount}/10`;
  if (scoreEl) scoreEl.textContent = `Điểm Arena: ${appState.xp} XP`;
}

function checkBadges() {
  const answeredCount = Object.keys(appState.answered).length;
  let correctCount = 0;
  quizData.forEach(q => {
    if (appState.answered[q.id] !== undefined && q.options[appState.answered[q.id]].correct) {
      correctCount++;
    }
  });

  // Badge 1: Đạt 20 XP
  if (appState.xp >= 20 && !appState.badges[0]) unlockBadge(0);
  // Badge 3: Streak 3
  if (appState.streak >= 3 && !appState.badges[2]) unlockBadge(2);
  // Badge 4: Điểm >= 160 XP
  if (appState.xp >= 160 && !appState.badges[3]) unlockBadge(3);
  // Badge 5: Đúng 10/10
  if (correctCount === 10 && !appState.badges[4]) {
    unlockBadge(4);
    sounds.playFanfare();
  }
}

function unlockBadge(index) {
  appState.badges[index] = true;
  const badgeCard = document.getElementById(`badge-${index + 1}`);
  if (badgeCard) {
    badgeCard.classList.remove('locked');
    badgeCard.classList.add('unlocked');
  }
  sounds.playLevelUp();
}

// --- 5. PHÒNG THÍ NGHIỆM LAB 1: 3D WIREFRAME ROTATION VIEWER ---
let lab3DState = {
  model: 'tetra', // 'tetra' hoặc 'pyramid'
  rotX: 25 * Math.PI / 180,
  rotY: 35 * Math.PI / 180,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0
};

// Dữ liệu hình tứ diện ABCD
const tetraModel = {
  vertices: [
    { name: 'A', x: 0, y: 1.3, z: 0 },
    { name: 'B', x: -1.1, y: -0.6, z: 0.8 },
    { name: 'C', x: 1.1, y: -0.6, z: 0.8 },
    { name: 'D', x: 0, y: -0.6, z: -1.2 }
  ],
  edges: [
    [0, 1], [0, 2], [0, 3], // Cạnh bên SA, SB, SC
    [1, 2], [2, 3], [3, 1]  // Cạnh đáy BC, CD, DB
  ]
};

// Dữ liệu hình chóp tứ giác S.ABCD
const pyramidModel = {
  vertices: [
    { name: 'S', x: 0, y: 1.4, z: 0 },
    { name: 'A', x: -1.1, y: -0.6, z: -0.9 },
    { name: 'B', x: 1.1, y: -0.6, z: -0.9 },
    { name: 'C', x: 1.3, y: -0.6, z: 0.9 },
    { name: 'D', x: -0.9, y: -0.6, z: 0.9 }
  ],
  edges: [
    [0, 1], [0, 2], [0, 3], [0, 4], // Cạnh bên
    [1, 2], [2, 3], [3, 4], [4, 1]  // Cạnh đáy
  ]
};

function initLab1Canvas() {
  const canvas = document.getElementById('canvas3D');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  function project(p, cx, cy, scale) {
    // Xoay quanh trục Y
    let x1 = p.x * Math.cos(lab3DState.rotY) + p.z * Math.sin(lab3DState.rotY);
    let y1 = p.y;
    let z1 = -p.x * Math.sin(lab3DState.rotY) + p.z * Math.cos(lab3DState.rotY);

    // Xoay quanh trục X
    let x2 = x1;
    let y2 = y1 * Math.cos(lab3DState.rotX) - z1 * Math.sin(lab3DState.rotX);
    let z2 = y1 * Math.sin(lab3DState.rotX) + z1 * Math.cos(lab3DState.rotX);

    // Phép chiếu phối cảnh Perspective
    const fov = 3.5;
    const distance = 4.0;
    const factor = fov / (distance + z2);

    return {
      x: cx + x2 * scale * factor,
      y: cy - y2 * scale * factor,
      z: z2
    };
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 20;
    const scale = 110;

    const currentModel = lab3DState.model === 'tetra' ? tetraModel : pyramidModel;
    const projected = currentModel.vertices.map(v => ({
      ...project(v, cx, cy, scale),
      name: v.name
    }));

    // Vẽ mặt đáy mờ gradient
    ctx.beginPath();
    if (lab3DState.model === 'tetra') {
      ctx.moveTo(projected[1].x, projected[1].y);
      ctx.lineTo(projected[2].x, projected[2].y);
      ctx.lineTo(projected[3].x, projected[3].y);
    } else {
      ctx.moveTo(projected[1].x, projected[1].y);
      ctx.lineTo(projected[2].x, projected[2].y);
      ctx.lineTo(projected[3].x, projected[3].y);
      ctx.lineTo(projected[4].x, projected[4].y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.fill();

    // Vẽ các cạnh với nét liền và nét đứt thông minh dựa trên độ sâu z
    currentModel.edges.forEach(([i, j]) => {
      const p1 = projected[i];
      const p2 = projected[j];
      const midZ = (p1.z + p2.z) / 2;

      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);

      // Nếu cạnh ở phía sau sâu, vẽ nét đứt (đường bị khuất)
      if (midZ < -0.2 && lab3DState.model === 'pyramid' && (i === 1 || j === 1)) {
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(148, 163, 184, 0.6)';
        ctx.lineWidth = 1.5;
      } else {
        ctx.setLineDash([]);
        ctx.strokeStyle = '#818cf8';
        ctx.lineWidth = 2.2;
      }
      ctx.stroke();
      ctx.setLineDash([]);
    });

    // Vẽ các đỉnh và nhãn chữ hoa phát sáng
    projected.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#06b6d4';
      ctx.shadowColor = '#06b6d4';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = 'bold 15px "Segoe UI", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(p.name, p.x + 8, p.y - 8);
    });

    const rotDisplay = document.getElementById('rotAngleDisplay');
    if (rotDisplay) {
      const degX = Math.round(lab3DState.rotX * 180 / Math.PI);
      const degY = Math.round(lab3DState.rotY * 180 / Math.PI);
      rotDisplay.textContent = `X: ${degX}°, Y: ${degY}°`;
    }
  }

  // Tương tác kéo chuột
  canvas.addEventListener('mousedown', (e) => {
    lab3DState.isDragging = true;
    lab3DState.lastMouseX = e.clientX;
    lab3DState.lastMouseY = e.clientY;
    canvas.style.cursor = 'grabbing';
    sounds.playClick();
    if (!appState.badges[1]) unlockBadge(1);
  });

  window.addEventListener('mousemove', (e) => {
    if (!lab3DState.isDragging) return;
    const dx = e.clientX - lab3DState.lastMouseX;
    const dy = e.clientY - lab3DState.lastMouseY;
    lab3DState.rotY += dx * 0.01;
    lab3DState.rotX -= dy * 0.01;
    lab3DState.lastMouseX = e.clientX;
    lab3DState.lastMouseY = e.clientY;
    draw();
  });

  window.addEventListener('mouseup', () => {
    lab3DState.isDragging = false;
    canvas.style.cursor = 'grab';
  });

  // Hỗ trợ cảm ứng trên thiết bị di động
  canvas.addEventListener('touchstart', (e) => {
    if (e.touches.length === 1) {
      lab3DState.isDragging = true;
      lab3DState.lastMouseX = e.touches[0].clientX;
      lab3DState.lastMouseY = e.touches[0].clientY;
      if (!appState.badges[1]) unlockBadge(1);
    }
  });

  canvas.addEventListener('touchmove', (e) => {
    if (!lab3DState.isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - lab3DState.lastMouseX;
    const dy = e.touches[0].clientY - lab3DState.lastMouseY;
    lab3DState.rotY += dx * 0.01;
    lab3DState.rotX -= dy * 0.01;
    lab3DState.lastMouseX = e.touches[0].clientX;
    lab3DState.lastMouseY = e.touches[0].clientY;
    draw();
  });

  canvas.addEventListener('touchend', () => {
    lab3DState.isDragging = false;
  });

  // Nút chuyển đổi mô hình
  const btnTetra = document.getElementById('btnModelTetra');
  const btnPyramid = document.getElementById('btnModelPyramid');
  const btnReset = document.getElementById('btnResetView');

  if (btnTetra && btnPyramid) {
    btnTetra.addEventListener('click', () => {
      lab3DState.model = 'tetra';
      btnTetra.classList.add('active');
      btnPyramid.classList.remove('active');
      sounds.playClick();
      draw();
    });
    btnPyramid.addEventListener('click', () => {
      lab3DState.model = 'pyramid';
      btnPyramid.classList.add('active');
      btnTetra.classList.remove('active');
      sounds.playClick();
      draw();
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      lab3DState.rotX = 25 * Math.PI / 180;
      lab3DState.rotY = 35 * Math.PI / 180;
      sounds.playClick();
      draw();
    });
  }

  draw();
}

// --- 6. PHÒNG THÍ NGHIỆM LAB 2: INTERACTIVE INTERSECTION LAB ---
function initLab2Canvas() {
  const canvas = document.getElementById('canvasIntersection');
  const slider = document.getElementById('sliderPointM');
  const ratioDisplay = document.getElementById('ratioDisplay');
  if (!canvas || !slider) return;
  const ctx = canvas.getContext('2d');

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const ratio = parseFloat(slider.value);
    if (ratioDisplay) ratioDisplay.textContent = ratio.toFixed(2);

    // Tọa độ đỉnh hình chóp S.ABC trong không gian 2D chiếu
    const S = { x: 380, y: 50 };
    const A = { x: 230, y: 280 };
    const B = { x: 350, y: 310 };
    const C = { x: 530, y: 270 };

    // Điểm M di động trên cạnh SA
    const M = {
      x: S.x + (A.x - S.x) * ratio,
      y: S.y + (A.y - S.y) * ratio
    };

    // Vẽ tam giác đáy ABC
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.6)';
    ctx.fill();

    // Vẽ mặt phẳng cắt (MBC) màu cyan neon bán trong suốt
    ctx.beginPath();
    ctx.moveTo(M.x, M.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.25)';
    ctx.fill();

    // Cạnh đáy AC bị khuất (nét đứt)
    ctx.beginPath();
    ctx.setLineDash([6, 6]);
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(C.x, C.y);
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.setLineDash([]);

    // Các cạnh nhìn thấy của đáy
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.strokeStyle = '#818cf8';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Các cạnh bên SA, SB, SC
    [[S, A], [S, B], [S, C]].forEach(([p1, p2]) => {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Các đường giao tuyến của mặt phẳng cắt: MB và MC
    ctx.beginPath();
    ctx.moveTo(M.x, M.y);
    ctx.lineTo(B.x, B.y);
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(M.x, M.y);
    ctx.lineTo(C.x, C.y);
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Vẽ các đỉnh và nhãn
    const points = [
      { p: S, label: 'S (Đỉnh chóp)', color: '#ec4899' },
      { p: A, label: 'A', color: '#818cf8' },
      { p: B, label: 'B', color: '#818cf8' },
      { p: C, label: 'C', color: '#818cf8' },
      { p: M, label: `M (${(ratio * 100).toFixed(0)}% SA)`, color: '#f59e0b' }
    ];

    points.forEach(({ p, label, color }) => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p === M ? 7 : 5, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.font = 'bold 13px "Segoe UI", sans-serif';
      ctx.fillStyle = '#f8fafc';
      ctx.fillText(label, p.x + 8, p.y - 6);
    });

    // Ghi chú chú thích
    ctx.fillStyle = 'rgba(15, 23, 42, 0.85)';
    ctx.fillRect(20, 20, 290, 80);
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
    ctx.strokeRect(20, 20, 290, 80);

    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('• Giao tuyến (MBC) ∩ (SAB) = MB (vàng)', 30, 42);
    ctx.fillText('• Giao tuyến (MBC) ∩ (SAC) = MC (xanh)', 30, 62);
    ctx.fillText('• Giao tuyến (MBC) ∩ (ABC) = BC (đáy)', 30, 82);
  }

  slider.addEventListener('input', () => {
    draw();
    if (!appState.badges[1]) unlockBadge(1);
  });

  draw();
}

// --- 7. KHỞI TẠO TƯƠNG TÁC GIAO DIỆN & TABS ---
document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.getAttribute('data-tab');
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${target}`);
      if (targetContent) targetContent.classList.add('active');
      sounds.playClick();

      if (target === 'labs') {
        setTimeout(() => {
          initLab1Canvas();
          initLab2Canvas();
        }, 60);
      }
    });
  });

  // Sound Toggle
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      sounds.playClick();
    });
  }

  // Reset Progress
  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập không?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.stars = 2;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        document.querySelectorAll('.badge-card').forEach(b => {
          b.classList.remove('unlocked');
          b.classList.add('locked');
        });
        updateHUD();
        renderQuiz();
        sounds.playClick();
      }
    });
  }

  // Avatar Modal
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const closeBtn = document.getElementById('btnCloseModal');
  const avatarGrid = document.getElementById('avatarGrid');

  if (avatarGrid) {
    avatarGrid.innerHTML = '';
    avatars.forEach(av => {
      const item = document.createElement('div');
      item.className = 'avatar-item';
      item.innerHTML = `<span style="font-size: 2rem;">${av.icon}</span><p style="font-weight: 600; margin-top: 4px;">${av.name}</p>`;
      item.addEventListener('click', () => {
        appState.avatar = av.icon;
        appState.userName = av.name;
        appState.userTitle = av.title;
        if (avatarBtn) avatarBtn.textContent = av.icon;
        const nameDisp = document.getElementById('userNameDisplay');
        const titleDisp = document.getElementById('userTitle');
        const certName = document.getElementById('certStudentName');
        if (nameDisp) nameDisp.textContent = `${av.name} 🌟`;
        if (titleDisp) titleDisp.textContent = av.title;
        if (certName) certName.textContent = av.name;
        if (avatarModal) avatarModal.style.display = 'none';
        sounds.playClick();
      });
      avatarGrid.appendChild(item);
    });
  }

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      avatarModal.style.display = 'flex';
      sounds.playClick();
    });
  }

  if (closeBtn && avatarModal) {
    closeBtn.addEventListener('click', () => {
      avatarModal.style.display = 'none';
      sounds.playClick();
    });
  }

  // Nút In Chứng Nhận A4
  const printBtn = document.getElementById('btnPrintCert');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }

  // Dựng quiz và khởi động Canvas
  renderQuiz();
  updateHUD();
  initLab1Canvas();
  initLab2Canvas();

  // Kích hoạt render công thức trên toàn bộ trang
  renderMathInTree(document.body);
});
