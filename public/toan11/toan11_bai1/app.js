// ================================================================
// BÀI 1: GIÁ TRỊ LƯỢNG GIÁC CỦA GÓC LƯỢNG GIÁC - TOÁN 11 KNTT
// Pure Vanilla JS - Web Audio API - Canvas 2D - KaTeX / MathML Fallback
// ================================================================

// --- 0. BỘ PARSER CÔNG THỨC TOÁN LATEX SANG NATIVE MATHML (OFFLINE FALLBACK) ---
const mathSymbols = [
  ["\\mathbb{R}", "<mi class=\"m-bb\">&#8477;</mi>"],
  ["\\mathbb{N}", "<mi class=\"m-bb\">&#8469;</mi>"],
  ["\\mathbb{Z}", "<mi class=\"m-bb\">&#8484;</mi>"],
  ["\\mathbb{Q}", "<mi class=\"m-bb\">&#8474;</mi>"],
  ["\\Leftrightarrow", "<mo>&#8660;</mo>"],
  ["\\Rightarrow", "<mo>&#8658;</mo>"],
  ["\\Leftarrow", "<mo>&#8656;</mo>"],
  ["\\approx", "<mo>&#8776;</mo>"],
  ["\\forall", "<mo>&#8704;</mo>"],
  ["\\exists", "<mo>&#8707;</mo>"],
  ["\\infty", "<mo>&#8734;</mo>"],
  ["\\pm", "<mo>&#177;</mo>"],
  ["\\mp", "<mo>&#8723;</mo>"],
  ["\\ge", "<mo>&#8805;</mo>"],
  ["\\le", "<mo>&#8804;</mo>"],
  ["\\geq", "<mo>&#8805;</mo>"],
  ["\\leq", "<mo>&#8804;</mo>"],
  ["\\ne", "<mo>&#8800;</mo>"],
  ["\\neq", "<mo>&#8800;</mo>"],
  ["\\to", "<mo>&#8594;</mo>"],
  ["\\in", "<mo>&#8712;</mo>"],
  ["\\notin", "<mo>&#8713;</mo>"],
  ["\\Delta", "<mi>&#916;</mi>"],
  ["\\delta", "<mi>&#948;</mi>"],
  ["\\alpha", "<mi>&#945;</mi>"],
  ["\\beta", "<mi>&#946;</mi>"],
  ["\\gamma", "<mi>&#947;</mi>"],
  ["\\theta", "<mi>&#952;</mi>"],
  ["\\varphi", "<mi>&#966;</mi>"],
  ["\\pi", "<mi>&#960;</mi>"],
  ["\\times", "<mo>&#215;</mo>"],
  ["\\cdot", "<mo>&#8901;</mo>"],
  ["\\setminus", "<mo>&#8726;</mo>"],
  ["\\cup", "<mo>&#8746;</mo>"],
  ["\\cap", "<mo>&#8745;</mo>"]
];

function tokenizePlainMath(raw) {
  if (!raw) return '';
  let out = '';
  let i = 0;
  while (i < raw.length) {
    const ch = raw[i];
    if (/[0-9]/.test(ch)) {
      let num = '';
      while (i < raw.length && /[0-9\.]/.test(raw[i])) { num += raw[i]; i++; }
      out += '<mn>' + num + '</mn>';
      continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      out += '<mi>' + ch + '</mi>';
      i++;
      continue;
    }
    if (/[\+\-\*\=\/\<\>\(\)\[\]\{\}\,\;\:\!\?\|\']/.test(ch)) {
      let op = ch;
      if (op === '<') op = '&lt;';
      else if (op === '>') op = '&gt;';
      out += '<mo>' + op + '</mo>';
      i++;
      continue;
    }
    if (/\s/.test(ch)) { out += ' '; i++; continue; }
    out += ch;
    i++;
  }
  return out;
}

function convertLatexToMathMLBody(latex, placeholders = []) {
  let s = latex.trim();
  function savePlaceholder(html) {
    const idx = placeholders.length;
    placeholders.push(html);
    return '\uE000' + idx + '\uE001';
  }

  s = s.replace(/\\text\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mtext>' + c + '</mtext>'));
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));

  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
  } while (s !== prevFrac);

  s = s.replace(/\\left\[/g, '[');
  s = s.replace(/\\right\./g, '');
  s = s.replace(/\\left\(/g, '(');
  s = s.replace(/\\right\)/g, ')');
  s = s.replace(/\\left\\\{/g, '{');
  s = s.replace(/\\right\\\}/g, '}');
  s = s.replace(/\\limits/g, '');
  s = s.replace(/\\,/g, ' ');
  s = s.replace(/\\quad/g, '   ');

  for (const [k, v] of mathSymbols) {
    const rx = new RegExp(k.replace(/\\/g, '\\\\') + '(?![a-zA-Z])', 'g');
    if (rx.test(s)) s = s.replace(rx, savePlaceholder(v));
  }

  s = s.replace(/_\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msub><mrow></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msub>'));
  s = s.replace(/\^\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msup><mrow></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msup>'));
  s = s.replace(/_([a-zA-Z0-9])/g, (m, c) => savePlaceholder('<msub><mrow></mrow><mrow>' + tokenizePlainMath(c) + '</mrow></msub>'));
  s = s.replace(/\^([a-zA-Z0-9])/g, (m, c) => savePlaceholder('<msup><mrow></mrow><mrow>' + tokenizePlainMath(c) + '</mrow></msup>'));

  const parts = s.split(/(\uE000\d+\uE001)/g);
  let res = '';
  for (const part of parts) {
    if (part.startsWith('\uE000') && part.endsWith('\uE001')) res += part;
    else res += tokenizePlainMath(part);
  }

  for (let i = placeholders.length - 1; i >= 0; i--) {
    res = res.split('\uE000' + i + '\uE001').join(placeholders[i]);
  }
  return res;
}

function latexToMathML(latex, display = false) {
  const inner = convertLatexToMathMLBody(latex);
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${display ? ' display="block"' : ''} class="${display ? 'math-block' : 'math-inline'}">${inner}</math>`;
}

function formatMathText(str) {
  if (!str) return '';
  str = str.replace(/\$\$([\s\S]*?)\$\$/g, (m, c) => latexToMathML(c, true));
  str = str.replace(/\$([^\$\n]+?)\$/g, (m, c) => latexToMathML(c, false));
  return str;
}

function renderMathInTree(root) {
  if (window.renderMathInElement) {
    renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      strict: false
    });
  } else {
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        if (text && (text.includes('$') || text.includes('$$'))) {
          const span = document.createElement('span');
          span.innerHTML = formatMathText(text);
          node.parentNode.replaceChild(span, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE) {
        if (!['SCRIPT', 'STYLE', 'TEXTAREA'].includes(node.tagName)) {
          Array.from(node.childNodes).forEach(walk);
        }
      }
    }
    walk(root);
  }
}

// --- 1. WEB AUDIO API SYNTHESIZER ---
class SoundManager {
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
  playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
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
    } catch (e) {}
  }
  playClick() { this.playTone(600, 'sine', 0.08, 0.05); }
  playCorrect() {
    this.playTone(523.25, 'triangle', 0.12, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.12), 100);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.22, 0.14), 200);
  }
  playWrong() {
    this.playTone(280, 'sawtooth', 0.18, 0.1);
    setTimeout(() => this.playTone(220, 'sawtooth', 0.24, 0.1), 120);
  }
  playLevelUp() {
    [523.25, 659.25, 783.99, 1046.5].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'sine', 0.15, 0.12), idx * 90);
    });
  }
  playFanfare() {
    [523, 659, 783, 1046, 783, 1046].forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.22, 0.15), idx * 130);
    });
  }
}
const sound = new SoundManager();

// --- 2. GAME STATE & GAMIFICATION ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Thủ Khoa Lượng Giác 11',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

function saveState() {
  try {
    localStorage.setItem('toan11_bai1_state', JSON.stringify(appState));
  } catch (e) {}
}

function loadState() {
  try {
    const s = localStorage.getItem('toan11_bai1_state');
    if (s) {
      const p = JSON.parse(s);
      Object.assign(appState, p);
    }
  } catch (e) {}
}

function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const userEl = document.getElementById('userNameDisplay');
  const titleEl = document.getElementById('userTitle');
  const avatarEl = document.getElementById('avatarBtn');
  const soundEl = document.getElementById('soundToggle');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (userEl) userEl.textContent = `${appState.userName} 🌟`;
  if (titleEl) titleEl.textContent = appState.userTitle;
  if (avatarEl) avatarEl.textContent = appState.avatar;
  if (soundEl) soundEl.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';

  // Cấp độ sao
  let starStr = '⭐☆☆☆☆';
  if (appState.xp >= 200) starStr = '⭐⭐⭐⭐⭐';
  else if (appState.xp >= 160) starStr = '⭐⭐⭐⭐☆';
  else if (appState.xp >= 100) starStr = '⭐⭐⭐☆☆';
  else if (appState.xp >= 40) starStr = '⭐⭐☆☆☆';
  if (starEl) starEl.textContent = starStr;

  // Cập nhật huy hiệu
  for (let i = 1; i <= 5; i++) {
    const b = document.getElementById(`badge-${i}`);
    if (b) {
      if (appState.badges[i - 1]) b.classList.remove('locked');
      else b.classList.add('locked');
    }
  }

  // Tên trên chứng nhận
  const certName = document.getElementById('certStudentName');
  if (certName) certName.textContent = appState.userName;
}

function unlockBadge(idx) {
  if (!appState.badges[idx]) {
    appState.badges[idx] = true;
    sound.playLevelUp();
    saveState();
    updateHUD();
  }
}

// --- 3. ĐẤU TRƯỜNG SGK QUIZ DATA (10 CÂU CHUẨN SGK) ---
const quizData = [
  {
    id: 1,
    title: "Câu 1: Chuyển đổi đơn vị góc sang radian",
    pts: 20,
    question: "Góc có số đo $150^\\circ$ khi đổi sang đơn vị radian bằng bao nhiêu?",
    options: [
      { text: "$\\frac{3\\pi}{4}\\,\\text{rad}$", correct: false },
      { text: "$\\frac{5\\pi}{6}\\,\\text{rad}$", correct: true },
      { text: "$\\frac{2\\pi}{3}\\,\\text{rad}$", correct: false },
      { text: "$\\frac{5\\pi}{4}\\,\\text{rad}$", correct: false }
    ],
    explanation: "Áp dụng công thức đổi độ sang radian: $\\alpha = 150 \\cdot \\frac{\\pi}{180} = \\frac{5\\pi}{6}\\,\\text{rad}$."
  },
  {
    id: 2,
    title: "Câu 2: Độ dài cung tròn",
    pts: 20,
    question: "Một đường tròn có bán kính $R = 20\\,\\text{cm}$. Độ dài của cung tròn có số đo $\\alpha = \\frac{\\pi}{12}\\,\\text{rad}$ là:",
    options: [
      { text: "$\\frac{5\\pi}{3}\\,\\text{cm}$", correct: true },
      { text: "$\\frac{5\\pi}{2}\\,\\text{cm}$", correct: false },
      { text: "$\\frac{10\\pi}{3}\\,\\text{cm}$", correct: false },
      { text: "$5\\pi\\,\\text{cm}$", correct: false }
    ],
    explanation: "Độ dài cung tròn tính bởi công thức $l = R \\cdot \\alpha = 20 \\cdot \\frac{\\pi}{12} = \\frac{5\\pi}{3}\\,\\text{cm}$."
  },
  {
    id: 3,
    title: "Câu 3: Dấu của các giá trị lượng giác",
    pts: 20,
    question: "Cho góc lượng giác $\\alpha$ thoả mãn $\\frac{\\pi}{2} < \\alpha < \\pi$ (thuộc góc phần tư thứ II). Khẳng định nào sau đây là đúng?",
    options: [
      { text: "$\\sin \\alpha > 0$ và $\\cos \\alpha > 0$", correct: false },
      { text: "$\\sin \\alpha > 0$ và $\\cos \\alpha < 0$", correct: true },
      { text: "$\\sin \\alpha < 0$ và $\\cos \\alpha < 0$", correct: false },
      { text: "$\\sin \\alpha < 0$ và $\\cos \\alpha > 0$", correct: false }
    ],
    explanation: "Trong góc phần tư thứ II, điểm biểu diễn $M(x; y)$ có hoành độ $x < 0$ và tung độ $y > 0$, do đó $\\cos \\alpha < 0$ và $\\sin \\alpha > 0$."
  },
  {
    id: 4,
    title: "Câu 4: Điểm biểu diễn góc trên đường tròn lượng giác",
    pts: 20,
    question: "Góc lượng giác có số đo $-\\frac{11\\pi}{4}$ có cùng điểm biểu diễn trên đường tròn lượng giác với góc nào sau đây?",
    options: [
      { text: "$\\frac{5\\pi}{4}$", correct: true },
      { text: "$\\frac{3\\pi}{4}$", correct: false },
      { text: "$\\frac{\\pi}{4}$", correct: false },
      { text: "$-\\frac{\\pi}{4}$", correct: false }
    ],
    explanation: "Ta có $-\\frac{11\\pi}{4} = -3\\pi + \\frac{\\pi}{4} = \\frac{5\\pi}{4} - 2 \\cdot 2\\pi$. Vì sai khác bội của $2\\pi$ nên hai góc có cùng điểm biểu diễn."
  },
  {
    id: 5,
    title: "Câu 5: Tính giá trị lượng giác cơ bản",
    pts: 20,
    question: "Cho $\\sin \\alpha = \\frac{3}{5}$ với $90^\\circ < \\alpha < 180^\\circ$. Giá trị của $\\cos \\alpha$ bằng bao nhiêu?",
    options: [
      { text: "$\\frac{4}{5}$", correct: false },
      { text: "$-\\frac{4}{5}$", correct: true },
      { text: "$-\\frac{3}{4}$", correct: false },
      { text: "$\\pm \\frac{4}{5}$", correct: false }
    ],
    explanation: "Do $90^\\circ < \\alpha < 180^\\circ$ nên $\\cos \\alpha < 0$. Ta có $\\cos \\alpha = -\\sqrt{1 - \\sin^2 \\alpha} = -\\sqrt{1 - \\frac{9}{25}} = -\\frac{4}{5}$."
  },
  {
    id: 6,
    title: "Câu 6: Hệ thức lượng giác cơ bản",
    pts: 20,
    question: "Rút gọn biểu thức $P = \\sin^4 \\alpha - \\cos^4 \\alpha$, ta được kết quả là:",
    options: [
      { text: "$1 - 2\\cos^2 \\alpha$", correct: true },
      { text: "$2\\sin^2 \\alpha + 1$", correct: false },
      { text: "$1$", correct: false },
      { text: "$2\\cos^2 \\alpha - 1$", correct: false }
    ],
    explanation: "Ta có $P = (\\sin^2 \\alpha - \\cos^2 \\alpha)(\\sin^2 \\alpha + \\cos^2 \\alpha) = \\sin^2 \\alpha - \\cos^2 \\alpha = (1 - \\cos^2 \\alpha) - \\cos^2 \\alpha = 1 - 2\\cos^2 \\alpha$."
  },
  {
    id: 7,
    title: "Câu 7: Cung liên kết - Cos đối, Sin bù",
    pts: 20,
    question: "Giá trị của biểu thức $A = \\cos(-60^\\circ) + \\sin(150^\\circ)$ bằng bao nhiêu?",
    options: [
      { text: "$0$", correct: false },
      { text: "$\\frac{1}{2}$", correct: false },
      { text: "$1$", correct: true },
      { text: "$\\sqrt{3}$", correct: false }
    ],
    explanation: "Ta có $\\cos(-60^\\circ) = \\cos 60^\\circ = \\frac{1}{2}$ và $\\sin 150^\\circ = \\sin(180^\\circ - 30^\\circ) = \\sin 30^\\circ = \\frac{1}{2}$. Do đó $A = \\frac{1}{2} + \\frac{1}{2} = 1$."
  },
  {
    id: 8,
    title: "Câu 8: Hệ thức Chasles",
    pts: 20,
    question: "Cho góc lượng giác $(Ox, Ou)$ có số đo $240^\\circ$ và góc lượng giác $(Ox, Ov)$ có số đo $-270^\\circ$. Số đo của góc lượng giác $(Ou, Ov)$ có dạng:",
    options: [
      { text: "$-510^\\circ + k 360^\\circ = 210^\\circ + m 360^\\circ$", correct: true },
      { text: "$510^\\circ + k 360^\\circ$", correct: false },
      { text: "$-30^\\circ + k 360^\\circ$", correct: false },
      { text: "$30^\\circ + k 360^\\circ$", correct: false }
    ],
    explanation: "Theo hệ thức Chasles: $\\text{sđ}(Ou, Ov) = \\text{sđ}(Ox, Ov) - \\text{sđ}(Ox, Ou) + k 360^\\circ = -270^\\circ - 240^\\circ + k 360^\\circ = -510^\\circ + k 360^\\circ = 210^\\circ + (k - 2)360^\\circ$."
  },
  {
    id: 9,
    title: "Câu 9: Bánh xe lăn và quãng đường",
    pts: 20,
    question: "Một bánh xe đạp có đường kính $680\\,\\text{mm}$. Khi bánh xe quay được $10$ vòng thì người đi xe đạp đã đi được quãng đường xấp xỉ bao nhiêu mét (lấy $\\pi \\approx 3.1416$)?",
    options: [
      { text: "$21.36\\,\\text{m}$", correct: true },
      { text: "$42.73\\,\\text{m}$", correct: false },
      { text: "$10.68\\,\\text{m}$", correct: false },
      { text: "$68.00\\,\\text{m}$", correct: false }
    ],
    explanation: "Chu vi bánh xe $C = \\pi d = 3.1416 \\cdot 0.68 \\approx 2.1362\\,\\text{m}$. Đi $10$ vòng thì quãng đường $s = 10 \\cdot C \\approx 21.36\\,\\text{m}$."
  },
  {
    id: 10,
    title: "Câu 10: Rút gọn biểu thức lượng giác phụ nhau",
    pts: 20,
    question: "Đẳng thức nào sau đây là ĐÚNG với mọi góc $\\alpha$ làm cho biểu thức có nghĩa?",
    options: [
      { text: "$\\sin\\left(\\frac{\\pi}{2} - \\alpha\\right) = \\cos \\alpha$", correct: true },
      { text: "$\\cos\\left(\\frac{\\pi}{2} - \\alpha\\right) = -\\sin \\alpha$", correct: false },
      { text: "$\\tan\\left(\\frac{\\pi}{2} - \\alpha\\right) = -\\cot \\alpha$", correct: false },
      { text: "$\\sin(\\pi + \\alpha) = \\sin \\alpha$", correct: false }
    ],
    explanation: "Theo công thức hai góc phụ nhau, ta có quan hệ chéo: $\\sin(\\frac{\\pi}{2} - \\alpha) = \\cos \\alpha$, $\\cos(\\frac{\\pi}{2} - \\alpha) = \\sin \\alpha$, $\\tan(\\frac{\\pi}{2} - \\alpha) = \\cot \\alpha$."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let answeredCount = 0;
  let currentArenaXP = 0;

  quizData.forEach((q, qidx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `qcard-${q.id}`;

    const isAnswered = appState.answered[q.id] !== undefined;
    if (isAnswered) answeredCount++;

    let headerHtml = `
      <div class="quiz-card-header">
        <span class="quiz-badge">${q.title}</span>
        <span class="quiz-points">+${q.pts} XP</span>
      </div>
      <div class="quiz-question">${q.question}</div>
      <div class="quiz-options quiz-options-grid">
    `;

    q.options.forEach((opt, oidx) => {
      let optClass = 'quiz-opt-btn';
      let disabled = isAnswered ? 'disabled' : '';
      if (isAnswered) {
        if (opt.correct) optClass += ' correct';
        else if (appState.answered[q.id] === oidx) optClass += ' wrong';
      }

      headerHtml += `
        <button class="${optClass}" data-qid="${q.id}" data-oidx="${oidx}" ${disabled}>
          <span class="opt-label">${String.fromCharCode(65 + oidx)}.</span>
          <span class="opt-text">${opt.text}</span>
        </button>
      `;
    });

    headerHtml += `</div>`;

    const showExp = isAnswered ? 'show' : '';
    let expStatusHtml = '';
    if (isAnswered) {
      const isCorrect = q.options[appState.answered[q.id]].correct;
      expStatusHtml = `<div class="exp-status" style="margin-bottom: 8px; font-weight: 700; color: ${isCorrect ? '#34d399' : '#f87171'};">${isCorrect ? '✅ CHÍNH XÁC! +20 XP' : '❌ CHƯA ĐÚNG'}</div>`;
    }

    headerHtml += `
      <div class="explanation-box ${showExp}" id="exp-${q.id}">
        ${expStatusHtml}
        <strong>💡 Lời giải chi tiết:</strong> ${q.explanation}
      </div>
    `;

    card.innerHTML = headerHtml;
    container.appendChild(card);
  });

  // Gắn sự kiện click
  container.querySelectorAll('.quiz-opt-btn').forEach(btn => {
    btn.addEventListener('click', function() {
      const qid = parseInt(this.getAttribute('data-qid'));
      const oidx = parseInt(this.getAttribute('data-oidx'));
      handleAnswer(qid, oidx);
    });
  });

  // Cập nhật header arena
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  const answeredKeys = Object.keys(appState.answered);
  let correctCount = 0;
  answeredKeys.forEach(k => {
    const q = quizData.find(item => item.id === parseInt(k));
    if (q && q.options[appState.answered[k]].correct) correctCount++;
  });

  if (progEl) progEl.textContent = `${answeredKeys.length}/10`;
  if (scoreEl) scoreEl.textContent = `Điểm: ${correctCount * 20} XP`;

  // Mở khóa huy hiệu 3, 4, 5
  if (appState.streak >= 5) unlockBadge(2);
  if (correctCount >= 8) unlockBadge(3);
  if (correctCount === 10) {
    unlockBadge(4);
    sound.playFanfare();
  }

  renderMathInTree(container);
}

function handleAnswer(qid, oidx) {
  if (appState.answered[qid] !== undefined) return;
  const q = quizData.find(item => item.id === qid);
  if (!q) return;

  appState.answered[qid] = oidx;
  const isCorrect = q.options[oidx].correct;

  if (isCorrect) {
    appState.xp += q.pts;
    appState.streak += 1;
    sound.playCorrect();
  } else {
    appState.streak = 0;
    sound.playWrong();
  }

  saveState();
  updateHUD();
  renderQuiz();
}

// --- 4. INTERACTIVE LAB 1: ĐƯỜNG TRÒN LƯỢNG GIÁC ĐỘNG ---
let lab1Angle = 60; // degrees

function drawLab1() {
  const canvas = document.getElementById('lab1Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const R = 150; // Bán kính đường tròn trên Canvas

  ctx.clearRect(0, 0, w, h);

  // Lưới toạ độ mờ
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 30) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
  }
  for (let y = 0; y < h; y += 30) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  }

  // Trục Ox, Oy
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  // Ox
  ctx.beginPath(); ctx.moveTo(20, cy); ctx.lineTo(w - 20, cy); ctx.stroke();
  ctx.fillStyle = '#94a3b8'; ctx.font = '13px sans-serif'; ctx.fillText('x (cos)', w - 45, cy - 8);
  // Mũi tên Ox
  ctx.beginPath(); ctx.moveTo(w - 20, cy); ctx.lineTo(w - 28, cy - 5); ctx.lineTo(w - 28, cy + 5); ctx.fill();

  // Oy
  ctx.beginPath(); ctx.moveTo(cx, h - 20); ctx.lineTo(cx, 20); ctx.stroke();
  ctx.fillText('y (sin)', cx + 8, 28);
  // Mũi tên Oy
  ctx.beginPath(); ctx.moveTo(cx, 20); ctx.lineTo(cx - 5, 28); ctx.lineTo(cx + 5, 28); ctx.fill();

  // Đường tròn lượng giác R=1
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.8)';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, 2 * Math.PI);
  ctx.stroke();

  // Điểm gốc A(1; 0)
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(cx + R, cy, 4, 0, 2 * Math.PI); ctx.fill();
  ctx.fillText('A(1;0)', cx + R + 6, cy + 16);
  ctx.fillText('A\'(-1;0)', cx - R - 48, cy + 16);
  ctx.fillText('B(0;1)', cx + 6, cy - R - 6);
  ctx.fillText('B\'(0;-1)', cx + 6, cy + R + 16);
  ctx.fillText('O', cx - 14, cy + 14);

  // Tính toán góc và toạ độ M
  const rad = (lab1Angle * Math.PI) / 180;
  const cosVal = Math.cos(rad);
  const sinVal = Math.sin(rad);
  const mx = cx + R * cosVal;
  const my = cy - R * sinVal; // Trục y hướng xuống trong canvas

  // Cung quét góc alpha
  ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  if (lab1Angle >= 0) {
    ctx.arc(cx, cy, 34, 0, -rad, true);
  } else {
    ctx.arc(cx, cy, 34, 0, -rad, false);
  }
  ctx.stroke();

  // Tia OM
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx, my); ctx.stroke();

  // Đoạn chiếu cos trên Ox (xanh dương)
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(mx, cy); ctx.stroke();

  // Đoạn chiếu sin trên Oy (đỏ)
  ctx.strokeStyle = '#f43f5e';
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, my); ctx.stroke();

  // Đường dóng nét đứt
  ctx.setLineDash([4, 4]);
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(mx, cy); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(mx, my); ctx.lineTo(cx, my); ctx.stroke();
  ctx.setLineDash([]);

  // Điểm M
  ctx.fillStyle = '#f59e0b';
  ctx.beginPath(); ctx.arc(mx, my, 6, 0, 2 * Math.PI); ctx.fill();
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(`M(${cosVal.toFixed(2)}; ${sinVal.toFixed(2)})`, mx + 8, my - 8);

  // Cập nhật text hiển thị bên cạnh
  const degEl = document.getElementById('lab1DegVal');
  const radEl = document.getElementById('lab1RadVal');
  const cosEl = document.getElementById('lab1CosVal');
  const sinEl = document.getElementById('lab1SinVal');
  const tanEl = document.getElementById('lab1TanVal');
  const cotEl = document.getElementById('lab1CotVal');
  const quadEl = document.getElementById('lab1Quadrant');

  if (degEl) degEl.textContent = `${lab1Angle}°`;
  if (radEl) radEl.textContent = `${(rad / Math.PI).toFixed(2)}π (${rad.toFixed(4)})`;
  if (cosEl) cosEl.textContent = cosVal.toFixed(4);
  if (sinEl) sinEl.textContent = sinVal.toFixed(4);

  if (Math.abs(cosVal) < 1e-4) {
    if (tanEl) tanEl.textContent = 'Không xác định';
  } else {
    if (tanEl) tanEl.textContent = (sinVal / cosVal).toFixed(4);
  }

  if (Math.abs(sinVal) < 1e-4) {
    if (cotEl) cotEl.textContent = 'Không xác định';
  } else {
    if (cotEl) cotEl.textContent = (cosVal / sinVal).toFixed(4);
  }

  // Góc phần tư (chuẩn hoá về 0 đến 360)
  let normDeg = ((lab1Angle % 360) + 360) % 360;
  let qStr = 'Nằm trên trục toạ độ';
  if (normDeg > 0 && normDeg < 90) qStr = 'Phần tư I (+, +)';
  else if (normDeg > 90 && normDeg < 180) qStr = 'Phần tư II (-, +)';
  else if (normDeg > 180 && normDeg < 270) qStr = 'Phần tư III (-, -)';
  else if (normDeg > 270 && normDeg < 360) qStr = 'Phần tư IV (+, -)';
  if (quadEl) quadEl.textContent = qStr;

  unlockBadge(0); // Mở khóa huy hiệu 1 khi tương tác
}

function setLab1Angle(deg) {
  lab1Angle = deg;
  const slider = document.getElementById('lab1AngleSlider');
  if (slider) slider.value = deg;
  drawLab1();
  sound.playClick();
}

// --- 5. INTERACTIVE LAB 2: MÔ PHỎNG BÁNH XE LĂN & ĐỘ DÀI CUNG TRÒN ---
let lab2R = 50; // cm
let lab2Angle = 180; // degrees
let lab2AnimFrame = null;
let lab2AnimAngle = 0;
let isAnimatingLab2 = false;

function drawLab2() {
  const canvas = document.getElementById('lab2Canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const groundY = h - 50;
  // Mặt đất
  ctx.strokeStyle = '#475569';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(20, groundY); ctx.lineTo(w - 20, groundY); ctx.stroke();

  // Bán kính hiển thị trên canvas
  const canvasR = lab2R * 0.9;
  const startX = 80;
  const curAngle = isAnimatingLab2 ? lab2AnimAngle : lab2Angle;
  const curRad = (curAngle * Math.PI) / 180;

  // Quãng đường lăn thực tế trên canvas
  const rollDist = canvasR * curRad;
  const currentCenterX = startX + rollDist;

  // Quãng đường đã lăn trên mặt đất (xanh ngọc)
  ctx.strokeStyle = '#10b981';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(startX, groundY);
  ctx.lineTo(currentCenterX, groundY);
  ctx.stroke();

  // Bánh xe
  ctx.save();
  ctx.translate(currentCenterX, groundY - canvasR);
  ctx.rotate(curRad);

  // Vành bánh xe
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(0, 0, canvasR, 0, 2 * Math.PI); ctx.stroke();

  // Các nan hoa
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 8; i++) {
    const a = (i * Math.PI) / 4;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(canvasR * Math.cos(a), canvasR * Math.sin(a)); ctx.stroke();
  }

  // Điểm đánh dấu van xe / điểm chạm ban đầu (đỏ)
  ctx.fillStyle = '#ef4444';
  ctx.beginPath(); ctx.arc(0, canvasR, 6, 0, 2 * Math.PI); ctx.fill();

  ctx.restore();

  // Trục tâm bánh xe
  ctx.fillStyle = '#38bdf8';
  ctx.beginPath(); ctx.arc(currentCenterX, groundY - canvasR, 5, 0, 2 * Math.PI); ctx.fill();

  // Điểm xuất phát A trên mặt đất
  ctx.fillStyle = '#cbd5e1';
  ctx.font = '12px sans-serif';
  ctx.fillText('Điểm 0 (Xuất phát)', startX - 35, groundY + 20);
  ctx.fillText(`Quãng đường l = ${(lab2R * curRad).toFixed(1)} cm`, Math.max(startX + 20, currentCenterX - 80), groundY + 36);

  // Cập nhật text thông số
  const radText = document.getElementById('lab2RadText');
  const roundsText = document.getElementById('lab2RoundsText');
  const lenText = document.getElementById('lab2LengthText');

  if (radText) radText.textContent = `${(curRad / Math.PI).toFixed(2)}π rad (${curRad.toFixed(2)} rad)`;
  if (roundsText) roundsText.textContent = `${(curAngle / 360).toFixed(2)} vòng`;
  if (lenText) lenText.textContent = `${(lab2R * curRad).toFixed(2)} cm`;
}

function startLab2Animation() {
  if (isAnimatingLab2) return;
  isAnimatingLab2 = true;
  lab2AnimAngle = 0;
  unlockBadge(1); // Mở khóa huy hiệu 2 khi trải nghiệm tính cung tròn

  function step() {
    if (lab2AnimAngle < lab2Angle) {
      lab2AnimAngle += 4;
      if (lab2AnimAngle > lab2Angle) lab2AnimAngle = lab2Angle;
      drawLab2();
      lab2AnimFrame = requestAnimationFrame(step);
    } else {
      isAnimatingLab2 = false;
      drawLab2();
      sound.playLevelUp();
    }
  }
  step();
}

// --- 6. KHỞI TẠO HỆ THỐNG VÀ SỰ KIỆN ---
document.addEventListener('DOMContentLoaded', function() {
  loadState();
  updateHUD();

  // Quản lý Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  navTabs.forEach(tab => {
    tab.addEventListener('click', function() {
      const target = this.getAttribute('data-tab');
      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      this.classList.add('active');
      const targetContent = document.getElementById(`tab-${target}`);
      if (targetContent) targetContent.classList.add('active');

      sound.playClick();

      if (target === 'labs') {
        setTimeout(() => { drawLab1(); drawLab2(); }, 50);
      }
      if (target === 'arena') {
        renderQuiz();
      }
    });
  });

  // Sự kiện Lab 1
  const l1Slider = document.getElementById('lab1AngleSlider');
  if (l1Slider) {
    l1Slider.addEventListener('input', function() {
      lab1Angle = parseFloat(this.value);
      drawLab1();
    });
  }

  // Sự kiện Lab 2
  const l2RSlider = document.getElementById('lab2RadiusSlider');
  const l2ASlider = document.getElementById('lab2AngleSlider');
  const l2AnimBtn = document.getElementById('lab2AnimateBtn');
  const l2ResetBtn = document.getElementById('lab2ResetBtn');

  if (l2RSlider) {
    l2RSlider.addEventListener('input', function() {
      lab2R = parseFloat(this.value);
      const valDisp = document.getElementById('lab2RadiusVal');
      if (valDisp) valDisp.textContent = `${lab2R} cm`;
      drawLab2();
    });
  }

  if (l2ASlider) {
    l2ASlider.addEventListener('input', function() {
      lab2Angle = parseFloat(this.value);
      const valDisp = document.getElementById('lab2AngleVal');
      if (valDisp) valDisp.textContent = `${lab2Angle}°`;
      drawLab2();
    });
  }

  if (l2AnimBtn) {
    l2AnimBtn.addEventListener('click', function() {
      startLab2Animation();
    });
  }

  if (l2ResetBtn) {
    l2ResetBtn.addEventListener('click', function() {
      isAnimatingLab2 = false;
      if (lab2AnimFrame) cancelAnimationFrame(lab2AnimFrame);
      lab2AnimAngle = 0;
      drawLab2();
      sound.playClick();
    });
  }

  // Tiện ích HUD
  const soundBtn = document.getElementById('soundToggle');
  if (soundBtn) {
    soundBtn.addEventListener('click', function() {
      appState.sound = !appState.sound;
      sound.enabled = appState.sound;
      this.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      sound.playClick();
      saveState();
    });
  }

  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', function() {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình học Bài 1?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        saveState();
        updateHUD();
        renderQuiz();
        drawLab1();
        drawLab2();
        sound.playClick();
      }
    });
  }

  // Avatar Modal
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const closeModalBtn = document.getElementById('btnCloseModal');
  const avatarChoices = document.querySelectorAll('.avatar-choice');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', function() {
      avatarModal.style.display = 'flex';
      sound.playClick();
    });
  }

  if (closeModalBtn && avatarModal) {
    closeModalBtn.addEventListener('click', function() {
      avatarModal.style.display = 'none';
      sound.playClick();
    });
  }

  avatarChoices.forEach(choice => {
    choice.addEventListener('click', function() {
      const a = this.getAttribute('data-avatar');
      const t = this.getAttribute('data-title');
      appState.avatar = a;
      appState.userTitle = t;
      updateHUD();
      sound.playClick();
      saveState();
      if (avatarModal) avatarModal.style.display = 'none';
    });
  });

  // Vẽ lab ban đầu và render quiz
  drawLab1();
  drawLab2();
  renderQuiz();
});
