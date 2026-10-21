// ================================================================
// BÀI 8: MẪU SỐ LIỆU GHÉP NHÓM - TOÁN 11 KNTT
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
  ["\\omega", "<mi>&#969;</mi>"],
  ["\\pi", "<mi>&#960;</mi>"],
  ["\\times", "<mo>&#215;</mo>"],
  ["\\cdot", "<mo>&#8901;</mo>"],
  ["\\dots", "<mo>&#8230;</mo>"],
  ["\\cdots", "<mo>&#8943;</mo>"],
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
    const escapedK = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const rx = new RegExp(escapedK + '(?![a-zA-Z])', 'g');
    if (rx.test(s)) s = s.replace(rx, savePlaceholder(v));
  }

  s = s.replace(/([a-zA-Z0-9\)])_\{([^{}]+)\}/g, (m, b, c) => savePlaceholder('<msub><mrow><mi>' + b + '</mi></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msub>'));
  s = s.replace(/([a-zA-Z0-9\)])_([0-9a-zA-Z])/g, (m, b, c) => savePlaceholder('<msub><mrow><mi>' + b + '</mi></mrow><mrow>' + (isNaN(c) ? '<mi>' + c + '</mi>' : '<mn>' + c + '</mn>') + '</mrow></msub>'));
  s = s.replace(/([a-zA-Z0-9\)])\^\{([^{}]+)\}/g, (m, b, c) => savePlaceholder('<msup><mrow><mi>' + b + '</mi></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msup>'));
  s = s.replace(/([a-zA-Z0-9\)])\^([0-9a-zA-Z])/g, (m, b, c) => savePlaceholder('<msup><mrow><mi>' + b + '</mi></mrow><mrow>' + (isNaN(c) ? '<mi>' + c + '</mi>' : '<mn>' + c + '</mn>') + '</mrow></msup>'));
  s = s.replace(/_\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msub><mrow></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msub>'));
  s = s.replace(/\^\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msup><mrow></mrow><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msup>'));

  const parts = s.split(/(\uE000\d+\uE001)/g);
  let res = '';
  for (const p of parts) {
    if (p.startsWith('\uE000') && p.endsWith('\uE001')) {
      const idx = parseInt(p.slice(1, -1), 10);
      res += placeholders[idx];
    } else {
      res += tokenizePlainMath(p);
    }
  }
  return res;
}

function latexToMathML(latex, display = false) {
  const inner = convertLatexToMathMLBody(latex);
  const dispAttr = display ? ' display="block"' : '';
  const cls = display ? ' class="math-block"' : ' class="math-inline"';
  return `<math xmlns="http://www.w3.org/1998/Math/MathML"${dispAttr}${cls}>${inner}</math>`;
}

function formatMathText(str) {
  if (!str) return '';
  return str
    .replace(/\$\$([\s\S]+?)\$\$/g, (m, eq) => latexToMathML(eq, true))
    .replace(/\$([^\$\n]+?)\$/g, (m, eq) => latexToMathML(eq, false));
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
      console.warn('KaTeX render warning, using MathML fallback:', e);
    }
  }

  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const nodesToReplace = [];
  let n;
  while ((n = walker.nextNode())) {
    if (n.nodeValue && n.nodeValue.includes('$')) {
      if (n.parentElement && !['SCRIPT', 'STYLE', 'TEXTAREA'].includes(n.parentElement.tagName)) {
        nodesToReplace.push(n);
      }
    }
  }

  for (const node of nodesToReplace) {
    const span = document.createElement('span');
    span.innerHTML = formatMathText(node.nodeValue);
    node.parentNode.replaceChild(span, node);
  }
}

function renderMath(target, latex, isBlock = false) {
  if (!target) return;
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return;

  let s = (latex || '').trim();
  if (s.startsWith('$$') && s.endsWith('$$')) {
    s = s.slice(2, -2).trim();
    isBlock = true;
  } else if (s.startsWith('$') && s.endsWith('$')) {
    s = s.slice(1, -1).trim();
  }

  if (typeof katex !== 'undefined' && typeof katex.render === 'function') {
    try {
      katex.render(s, el, {
        displayMode: isBlock,
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {
      console.warn('KaTeX render error:', e);
    }
  }
  el.innerHTML = latexToMathML(s, isBlock);
}

function renderMixedText(target, textWithMath) {
  if (!target) return;
  const el = typeof target === 'string' ? document.getElementById(target) : target;
  if (!el) return;
  el.innerHTML = textWithMath;
  renderMathInTree(el);
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
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playClick() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, this.ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, this.ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + 0.05);
  }

  playCorrect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      gain.gain.setValueAtTime(0.15, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.08 + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.18);
    });
  }

  playWrong() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.25);
    gain.gain.setValueAtTime(0.18, now);
    gain.gain.linearRampToValueAtTime(0.01, now + 0.25);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.2, now + idx * 0.1);
      gain.gain.linearRampToValueAtTime(0.01, now + idx * 0.1 + 0.25);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.25);
    });
  }

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const chords = [
      [523.25, 659.25, 783.99],
      [587.33, 739.99, 880.00],
      [659.25, 830.61, 987.77],
      [1046.50, 1318.51, 1567.98]
    ];
    chords.forEach((chord, step) => {
      chord.forEach(freq => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + step * 0.22);
        gain.gain.setValueAtTime(0.15, now + step * 0.22);
        gain.gain.linearRampToValueAtTime(0.01, now + step * 0.22 + 0.35);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + step * 0.22);
        osc.stop(now + step * 0.22 + 0.35);
      });
    });
  }
}

const sounds = new SoundManager();

// --- 2. QUẢN LÝ TRẠNG THÁI (APP STATE) ---
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nhà Khảo Sát Thống Kê',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false],
  currentTab: 'theory',
  activeLab1Data: 'marathon',
  lab1K: 5
};

function updateHUD() {
  const avatarBtn = document.getElementById('avatarBtn');
  if (avatarBtn) avatarBtn.textContent = appState.avatar;

  const userNameDisplay = document.getElementById('userNameDisplay');
  if (userNameDisplay) userNameDisplay.textContent = appState.userName + ' 🌟';

  const userTitle = document.getElementById('userTitle');
  if (userTitle) userTitle.textContent = appState.userTitle;

  const xpDisplay = document.getElementById('xpDisplay');
  if (xpDisplay) xpDisplay.textContent = appState.xp;

  const streakDisplay = document.getElementById('streakDisplay');
  if (streakDisplay) streakDisplay.textContent = `🔥 ${appState.streak}`;

  const starRating = document.getElementById('starRating');
  if (starRating) {
    const s = Math.min(5, Math.max(1, appState.stars));
    starRating.textContent = '⭐'.repeat(s) + '☆'.repeat(5 - s);
  }

  const arenaProgress = document.getElementById('arenaProgress');
  if (arenaProgress) {
    const answeredCount = Object.keys(appState.answered).length;
    arenaProgress.textContent = `${answeredCount}/10`;
  }

  const arenaScore = document.getElementById('arenaScore');
  if (arenaScore) {
    arenaScore.textContent = `${appState.xp} XP`;
  }

  const certStudentName = document.getElementById('certStudentName');
  if (certStudentName) certStudentName.textContent = appState.userName;

  const certXpEarned = document.getElementById('certXpEarned');
  if (certXpEarned) certXpEarned.textContent = `Đạt ${appState.xp} XP`;

  checkBadges();
}

function checkBadges() {
  // Huy hiệu 1: Xem theory
  if (appState.currentTab === 'theory' && !appState.badges[0]) {
    unlockBadge(0);
  }

  // Huy hiệu 2: Vào labs
  if (appState.currentTab === 'labs' && !appState.badges[1]) {
    unlockBadge(1);
  }

  // Huy hiệu 3: Đạt >= 100 XP
  if (appState.xp >= 100 && !appState.badges[2]) {
    unlockBadge(2);
  }

  // Huy hiệu 4: Đạt >= 160 XP
  if (appState.xp >= 160 && !appState.badges[3]) {
    unlockBadge(3);
  }

  // Huy hiệu 5: Đạt 200 XP tuyệt đối (10/10)
  if (appState.xp >= 200 && !appState.badges[4]) {
    unlockBadge(4);
    sounds.playFanfare();
  }
}

function unlockBadge(idx) {
  appState.badges[idx] = true;
  const badgeEl = document.getElementById(`badge-${idx + 1}`);
  if (badgeEl) {
    badgeEl.style.opacity = '1';
    badgeEl.style.filter = 'none';
    badgeEl.style.borderColor = '#4ade80';
    badgeEl.style.boxShadow = '0 0 20px rgba(74, 222, 128, 0.4)';
  }
}

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG TRẮC NGHIỆM (10 CÂU CHUẨN SGK BÀI 8) ---
const quizData = [
  {
    id: 1,
    title: "Câu 1: Nhận diện cấu trúc nhóm số liệu",
    pts: 20,
    question: "Cho nhóm số liệu $[15; 25)$. Đầu mút trái, đầu mút phải và độ dài của nhóm này lần lượt là:",
    options: [
      { text: "$15$, $25$ và độ dài $h = 10$", correct: true },
      { text: "$15$, $25$ và độ dài $h = 40$", correct: false },
      { text: "$25$, $15$ và độ dài $h = 10$", correct: false },
      { text: "$15$, $25$ và độ dài $h = 20$", correct: false }
    ],
    explanation: "Nhóm $[a; b)$ có đầu mút trái là $a$, đầu mút phải là $b$ và độ dài nhóm là $h = b - a$. Với nhóm $[15; 25)$, ta có đầu mút trái $a = 15$, đầu mút phải $b = 25$ và độ dài nhóm $h = 25 - 15 = 10$."
  },
  {
    id: 2,
    title: "Câu 2: Giá trị đại diện của nhóm",
    pts: 20,
    question: "Giá trị đại diện của nhóm số liệu $[40; 60)$ là:",
    options: [
      { text: "$c = 20$", correct: false },
      { text: "$c = 40$", correct: false },
      { text: "$c = 50$", correct: true },
      { text: "$c = 60$", correct: false }
    ],
    explanation: "Giá trị đại diện của nhóm $[a_i; a_{i+1})$ là trung bình cộng của hai đầu mút: $c_i = \\frac{a_i + a_{i+1}}{2}$. Do đó với nhóm $[40; 60)$, giá trị đại diện là $c = \\frac{40 + 60}{2} = 50$."
  },
  {
    id: 3,
    title: "Câu 3: Khoảng biến thiên của mẫu số liệu",
    pts: 20,
    question: "Một mẫu số liệu có giá trị nhỏ nhất $x_{\\min} = 18$ và giá trị lớn nhất $x_{\\max} = 98$. Khoảng biến thiên $R$ của mẫu số liệu này là:",
    options: [
      { text: "$R = 116$", correct: false },
      { text: "$R = 80$", correct: true },
      { text: "$R = 40$", correct: false },
      { text: "$R = 58$", correct: false }
    ],
    explanation: "Khoảng biến thiên của mẫu số liệu được xác định bằng hiệu giữa giá trị lớn nhất và giá trị nhỏ nhất: $R = x_{\\max} - x_{\\min} = 98 - 18 = 80$."
  },
  {
    id: 4,
    title: "Câu 4: Xác định độ dài nhóm khi ghép nhóm",
    pts: 20,
    question: "Một mẫu số liệu có khoảng biến thiên $R = 48$. Nếu muốn chia mẫu số liệu này thành $k = 5$ nhóm có độ dài bằng nhau, độ dài $h$ mỗi nhóm cần thoả mãn điều kiện gì?",
    options: [
      { text: "$h \\ge 9.6$ (thường chọn $h = 10$)", correct: true },
      { text: "$h \\le 9.6$", correct: false },
      { text: "$h = 5$", correct: false },
      { text: "$h = 48$", correct: false }
    ],
    explanation: "Độ dài nhóm $h$ phải thoả mãn điều kiện $k \\cdot h > R$, hay $h \\ge \\frac{R}{k} = \\frac{48}{5} = 9.6$. Trong thực hành, ta thường làm tròn lên số nguyên thuận tiện như $h = 10$."
  },
  {
    id: 5,
    title: "Câu 5: Kỹ thuật hiệu chỉnh khoảng rời rạc",
    pts: 20,
    question: "Số liệu điểm thi được thống kê theo các khoảng nguyên rời rạc $10 - 19$, $20 - 29$, $30 - 39$. Khi hiệu chỉnh để đưa về dạng nửa khoảng liên tục $[a; b)$, khoảng $10 - 19$ được chuyển thành:",
    options: [
      { text: "$[10; 19)$", correct: false },
      { text: "$[10; 20)$", correct: false },
      { text: "$[9.5; 19.5)$", correct: true },
      { text: "$[9; 20)$", correct: false }
    ],
    explanation: "Theo quy tắc hiệu chỉnh số liệu rời rạc trong SGK: khoảng $k_1 - k_2$ được mở rộng hai phía thêm $0.5$ đơn vị để trở thành $[k_1 - 0.5; k_2 + 0.5)$. Do đó $10 - 19$ trở thành $[10 - 0.5; 19 + 0.5) = [9.5; 19.5)$."
  },
  {
    id: 6,
    title: "Câu 6: Điều kiện giá trị thuộc nửa khoảng",
    pts: 20,
    question: "Giá trị $x$ thuộc nhóm $[160; 167)$ khi và chỉ khi:",
    options: [
      { text: "$160 < x < 167$", correct: false },
      { text: "$160 \\le x < 167$", correct: true },
      { text: "$160 < x \\le 167$", correct: false },
      { text: "$160 \\le x \\le 167$", correct: false }
    ],
    explanation: "Ký hiệu nửa khoảng $[a; b)$ bao gồm tất cả các số thực $x$ thoả mãn $a \\le x < b$ (lấy đầu mút trái $a$ và không lấy đầu mút phải $b$)."
  },
  {
    id: 7,
    title: "Câu 7: Tính tần số tích luỹ",
    pts: 20,
    question: `Cho bảng ghép nhóm gồm $4$ nhóm với các tần số như sau:
<div class="quiz-table-wrap">
  <table class="quiz-table">
    <thead>
      <tr>
        <th>Nhóm</th>
        <th>Nhóm $1$</th>
        <th>Nhóm $2$</th>
        <th>Nhóm $3$</th>
        <th>Nhóm $4$</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Tần số ($m_i$)</td>
        <td>$5$</td>
        <td>$9$</td>
        <td>$12$</td>
        <td>$14$</td>
      </tr>
    </tbody>
  </table>
</div>
Tần số tích luỹ $C_3$ của nhóm thứ ba là:`,
    options: [
      { text: "$C_3 = 12$", correct: false },
      { text: "$C_3 = 14$", correct: false },
      { text: "$C_3 = 26$", correct: true },
      { text: "$C_3 = 40$", correct: false }
    ],
    explanation: "Tần số tích luỹ của nhóm thứ 3 là tổng tần số của nó và các nhóm đứng trước: $C_3 = m_1 + m_2 + m_3 = 5 + 9 + 12 = 26$."
  },
  {
    id: 8,
    title: "Câu 8: Cỡ mẫu của mẫu số liệu ghép nhóm",
    pts: 20,
    question: `Cho bảng tần số ghép nhóm sau:
<div class="quiz-table-wrap">
  <table class="quiz-table">
    <thead>
      <tr>
        <th>Nhóm</th>
        <th>Nhóm $1$</th>
        <th>Nhóm $2$</th>
        <th>Nhóm $3$</th>
        <th>Nhóm $4$</th>
        <th>Nhóm $5$</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Tần số ($m_i$)</td>
        <td>$4$</td>
        <td>$11$</td>
        <td>$18$</td>
        <td>$12$</td>
        <td>$5$</td>
      </tr>
    </tbody>
  </table>
</div>
Cỡ mẫu $n$ của cuộc điều tra này bằng:`,
    options: [
      { text: "$n = 45$", correct: false },
      { text: "$n = 50$", correct: true },
      { text: "$n = 40$", correct: false },
      { text: "$n = 55$", correct: false }
    ],
    explanation: "Cỡ mẫu $n$ chính là tổng tất cả các tần số: $n = \\sum_{i=1}^5 m_i = 4 + 11 + 18 + 12 + 5 = 50$."
  },
  {
    id: 9,
    title: "Câu 9: Ứng dụng phân nhóm may áo đồng phục",
    pts: 20,
    question: "Trong bài toán may đồng phục, nhóm cỡ áo L là $[167; 170)$ cm. Bạn Minh có chiều cao đúng $167.0$ cm và bạn Nam cao $170.0$ cm. Khẳng định nào sau đây là đúng?",
    options: [
      { text: "Cả hai bạn đều thuộc cỡ áo L", correct: false },
      { text: "Bạn Minh thuộc cỡ áo L, bạn Nam không thuộc cỡ áo L", correct: true },
      { text: "Bạn Nam thuộc cỡ áo L, bạn Minh không thuộc cỡ áo L", correct: false },
      { text: "Cả hai bạn đều không thuộc cỡ áo L", correct: false }
    ],
    explanation: "Vì nhóm cỡ L là nửa khoảng $[167; 170)$ nên lấy giá trị từ $167$ đến sát $170$ ($167 \\le x < 170$). Minh cao $167$ cm nên thuộc cỡ L; Nam cao $170$ cm sẽ chuyển sang nhóm tiếp theo $[170; 175)$ là cỡ XL."
  },
  {
    id: 10,
    title: "Câu 10: Ý nghĩa của mẫu số liệu ghép nhóm",
    pts: 20,
    question: "Ưu điểm lớn nhất của việc ghép nhóm số liệu khi nghiên cứu một tập dữ liệu rất lớn là gì?",
    options: [
      { text: "Giúp giữ lại chính xác 100% từng giá trị nguyên gốc ban đầu", correct: false },
      { text: "Tạo cái nhìn tổng quan, gọn gàng, trực quan hoá phân bố và dễ dàng tính toán các số đặc trưng", correct: true },
      { text: "Làm tăng số lượng dữ liệu ban đầu lên nhiều lần", correct: false },
      { text: "Triệt tiêu hoàn toàn mọi sai số thống kê", correct: false }
    ],
    explanation: "Khi cỡ mẫu rất lớn, việc liệt kê số liệu thô khiến bảng dữ liệu cồng kềnh, khó theo dõi. Ghép nhóm giúp cô đọng thông tin, làm nổi bật quy luật phân bố và hỗ trợ tính toán hiệu quả các đại lượng thống kê mô tả."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;

  container.innerHTML = '';
  quizData.forEach((q, qIndex) => {
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

      // Làm sáng đáp án đúng
      question.options.forEach((opt, idx) => {
        if (opt.correct) {
          const correctBtn = document.getElementById(`optBtn-${question.id}-${idx}`);
          if (correctBtn) correctBtn.classList.add('correct');
        }
      });
    }
  }

  // Khóa tất cả các nút của câu này
  question.options.forEach((_, idx) => {
    const btn = document.getElementById(`optBtn-${question.id}-${idx}`);
    if (btn) btn.disabled = true;
  });

  // Hiển thị giải thích
  const expBox = document.getElementById(`explanation-${question.id}`);
  if (expBox) {
    expBox.style.display = 'block';
    expBox.classList.add('show');
    renderMathInTree(expBox);
  }

  updateHUD();
}

// --- 4. PHÒNG THÍ NGHIỆM LAB 1: HISTOGRAM STUDIO ---
const rawDatasets = {
  marathon: [12.1, 12.5, 12.8, 13.0, 13.2, 13.5, 13.8, 14.0, 14.1, 14.2, 14.5, 14.6, 14.9, 15.0, 15.1, 15.3, 15.5, 15.7, 15.8, 16.0, 16.2, 16.4, 16.5, 16.8, 17.0, 17.1, 17.2, 17.5, 17.6, 17.8],
  score: [3.2, 3.8, 4.0, 4.5, 4.8, 5.0, 5.2, 5.5, 5.6, 5.8, 6.0, 6.2, 6.4, 6.5, 6.5, 6.8, 7.0, 7.0, 7.2, 7.2, 7.5, 7.5, 7.6, 7.8, 8.0, 8.0, 8.2, 8.4, 8.5, 8.6, 8.8, 9.0, 9.0, 9.2, 9.2, 9.4, 9.5, 9.6, 9.8, 9.8],
  weight: [52.0, 54.5, 55.0, 56.2, 58.0, 59.5, 60.0, 61.5, 62.0, 63.5, 64.0, 65.0, 66.5, 67.0, 68.5, 70.0, 71.2, 72.0, 73.5, 74.0, 75.5, 76.0, 77.5, 78.0, 79.2, 80.0, 81.5, 82.0, 83.5, 84.0, 85.0, 86.2, 87.0, 87.5, 88.0]
};

function computeGrouping(dataset, k) {
  const n = dataset.length;
  let min = Math.min(...dataset);
  let max = Math.max(...dataset);
  let R = max - min;

  // Tính h làm tròn đẹp
  let rawH = R / k;
  let h = Math.ceil(rawH * 10) / 10;
  if (h * k <= R) h = Math.ceil((rawH + 0.05) * 10) / 10;
  if (h === 0) h = 1;

  let start = Math.floor(min * 10) / 10;

  const groups = [];
  let cum = 0;
  for (let i = 0; i < k; i++) {
    const a = +(start + i * h).toFixed(2);
    const b = +(start + (i + 1) * h).toFixed(2);
    const c = +((a + b) / 2).toFixed(2);

    let count = 0;
    dataset.forEach(val => {
      if (i === k - 1) {
        if (val >= a && val <= b + 0.0001) count++;
      } else {
        if (val >= a && val < b) count++;
      }
    });

    cum += count;
    const pct = ((count / n) * 100).toFixed(1);
    groups.push({ i: i + 1, a, b, c, count, cum, pct });
  }

  return { n, min, max, R: +R.toFixed(2), h, groups };
}

let hoveredBarIndex = -1;

function renderLab1() {
  const data = rawDatasets[appState.activeLab1Data];
  const k = appState.lab1K;
  const res = computeGrouping(data, k);

  const statSampleSize = document.getElementById('statSampleSize');
  if (statSampleSize) statSampleSize.textContent = res.n;

  const statMinMax = document.getElementById('statMinMax');
  if (statMinMax) statMinMax.textContent = `${res.min} - ${res.max}`;

  const statRange = document.getElementById('statRange');
  if (statRange) statRange.textContent = res.R;

  const statStep = document.getElementById('statStep');
  if (statStep) statStep.textContent = res.h;

  // Bảng phân bố
  const tbody = document.getElementById('groupTableBody');
  if (tbody) {
    tbody.innerHTML = '';
    res.groups.forEach(g => {
      const tr = document.createElement('tr');
      tr.style.borderBottom = '1px solid rgba(255,255,255,0.06)';
      tr.innerHTML = `
        <td style="padding: 10px; font-weight: bold; color: #a5b4fc;">Nhóm ${g.i}</td>
        <td style="padding: 10px; color: #38bdf8;">[${g.a}; ${g.b})</td>
        <td style="padding: 10px; font-weight: bold; color: #facc15;">${g.c}</td>
        <td style="padding: 10px; font-weight: bold; color: #4ade80;">${g.count}</td>
        <td style="padding: 10px; color: #cbd5e1;">${g.cum}</td>
        <td style="padding: 10px; color: #fb7185;">${g.pct}%</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Vẽ Canvas Histogram
  drawHistogram(res);
}

function drawHistogram(res) {
  const canvas = document.getElementById('histogramCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const padLeft = 60;
  const padRight = 30;
  const padTop = 40;
  const padBottom = 50;

  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  const maxFreq = Math.max(...res.groups.map(g => g.count), 1);
  const yTicks = Math.max(5, maxFreq);

  // Vẽ lưới toạ độ ngang
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Inter, sans-serif';
  ctx.textAlign = 'right';

  for (let i = 0; i <= yTicks; i += Math.ceil(yTicks / 5)) {
    const y = padTop + plotH - (i / yTicks) * plotH;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);
    ctx.stroke();
    ctx.fillText(i, padLeft - 10, y + 4);
  }

  // Nhãn trục tung
  ctx.save();
  ctx.translate(18, padTop + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#818cf8';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.fillText('Tần số (mi)', 0, 0);
  ctx.restore();

  // Vẽ các cột Histogram
  const k = res.groups.length;
  const barW = plotW / k;

  res.groups.forEach((g, idx) => {
    const x = padLeft + idx * barW;
    const barH = (g.count / yTicks) * plotH;
    const y = padTop + plotH - barH;

    // Gradient màu cột
    const grad = ctx.createLinearGradient(x, y, x, padTop + plotH);
    if (idx === hoveredBarIndex) {
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(1, 'rgba(244, 63, 94, 0.25)');
    } else {
      grad.addColorStop(0, '#06b6d4');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0.25)');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(x + 2, y, barW - 4, barH);

    ctx.strokeStyle = (idx === hoveredBarIndex) ? '#f43f5e' : '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(x + 2, y, barW - 4, barH);

    // Ghi số tần số trên đỉnh cột
    if (g.count > 0) {
      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillText(g.count, x + barW / 2, y - 8);
    }

    // Nhãn đầu mút trục hoành
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`[${g.a}; ${g.b})`, x + barW / 2, padTop + plotH + 18);

    // Giá trị đại diện c_i
    ctx.fillStyle = '#facc15';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText(`c=${g.c}`, x + barW / 2, padTop + plotH + 34);
  });

  // Trục toạ độ chính
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop);
  ctx.lineTo(padLeft, padTop + plotH);
  ctx.lineTo(w - padRight, padTop + plotH);
  ctx.stroke();
}

// --- 5. PHÒNG THÍ NGHIỆM LAB 2: XƯỞNG MAY ĐỒNG PHỤC HỌC ĐƯỜNG ---
const surveySamples = {
  sgk: {
    name: 'Mẫu SGK Kết Nối Tri Thức (50 học sinh)',
    dist: [
      { size: 'S', range: '[150; 160)', count: 7, color: '#38bdf8' },
      { size: 'M', range: '[160; 167)', count: 14, color: '#4ade80' },
      { size: 'L', range: '[167; 170)', count: 10, color: '#facc15' },
      { size: 'XL', range: '[170; 175)', count: 10, color: '#fb923c' },
      { size: 'XXL', range: '[175; 180]', count: 9, color: '#f43f5e' }
    ]
  },
  male_heavy: {
    name: 'Mẫu tập trung Nam sinh',
    dist: [
      { size: 'S', range: '[150; 160)', count: 3, color: '#38bdf8' },
      { size: 'M', range: '[160; 167)', count: 9, color: '#4ade80' },
      { size: 'L', range: '[167; 170)', count: 15, color: '#facc15' },
      { size: 'XL', range: '[170; 175)', count: 14, color: '#fb923c' },
      { size: 'XXL', range: '[175; 180]', count: 9, color: '#f43f5e' }
    ]
  },
  female_heavy: {
    name: 'Mẫu tập trung Nữ sinh',
    dist: [
      { size: 'S', range: '[150; 160)', count: 16, color: '#38bdf8' },
      { size: 'M', range: '[160; 167)', count: 19, color: '#4ade80' },
      { size: 'L', range: '[167; 170)', count: 8, color: '#facc15' },
      { size: 'XL', range: '[170; 175)', count: 5, color: '#fb923c' },
      { size: 'XXL', range: '[175; 180]', count: 2, color: '#f43f5e' }
    ]
  }
};

function renderLab2() {
  const totalStudents = parseInt(document.getElementById('sliderTotalStudents').value, 10);
  const sampleKey = document.getElementById('selectSurveySample').value;
  const sample = surveySamples[sampleKey];

  const totalDisplay = document.getElementById('totalStudentsDisplay');
  if (totalDisplay) totalDisplay.textContent = totalStudents;

  const sampleTotal = sample.dist.reduce((acc, curr) => acc + curr.count, 0);

  const container = document.getElementById('sizeAllocationBars');
  if (!container) return;

  container.innerHTML = '';
  let highestSize = '';
  let highestQty = -1;

  sample.dist.forEach(item => {
    const ratio = item.count / sampleTotal;
    const qty = Math.round(ratio * totalStudents);
    const pct = (ratio * 100).toFixed(1);

    if (qty > highestQty) {
      highestQty = qty;
      highestSize = item.size;
    }

    const row = document.createElement('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '14px';

    row.innerHTML = `
      <div style="width: 140px; font-weight: bold; color: #fff; font-size: 0.95rem;">
        Size <span style="color: ${item.color}; font-size: 1.15rem;">${item.size}</span>
        <div style="font-size: 0.75rem; color: #94a3b8;">${item.range} cm</div>
      </div>
      <div style="flex: 1; background: rgba(255,255,255,0.08); border-radius: 999px; height: 24px; overflow: hidden; position: relative;">
        <div style="width: ${pct}%; background: ${item.color}; height: 100%; border-radius: 999px; transition: width 0.4s ease;"></div>
        <span style="position: absolute; right: 10px; top: 3px; font-size: 0.8rem; font-weight: bold; color: #fff; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${pct}%</span>
      </div>
      <div style="width: 110px; text-align: right; font-weight: 800; color: #4ade80; font-size: 1.05rem;">
        ${qty.toLocaleString('vi-VN')} áo
      </div>
    `;

    container.appendChild(row);
  });

  const summary = document.getElementById('clothingSummaryText');
  if (summary) {
    summary.innerHTML = `
      <strong>💡 Phân tích chiến lược cắt may:</strong> Cỡ áo phổ biến nhất là <strong>Size ${highestSize}</strong> với nhu cầu lên đến <strong>${highestQty.toLocaleString('vi-VN')} chiếc</strong> (${((highestQty / totalStudents) * 100).toFixed(1)}%). Dựa vào bảng phân bố tần số ghép nhóm này, xưởng may có thể chủ động đặt mua trước vải cuộn, tối ưu hoá sơ đồ cắt rập công nghiệp và tiết kiệm hơn 15% chi phí so với việc may đại trà không qua thống kê!
    `;
  }
}

// --- 6. KHỞI TẠO SỰ KIỆN VÀ GIAO DIỆN ---
document.addEventListener('DOMContentLoaded', () => {
  // Navigation Tabs
  const navTabs = document.querySelectorAll('.nav-tab');
  const tabContents = document.querySelectorAll('.tab-content');

  navTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sounds.playClick();
      const targetTab = tab.getAttribute('data-tab');
      appState.currentTab = targetTab;

      navTabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const contentEl = document.getElementById(`tab-${targetTab}`);
      if (contentEl) contentEl.classList.add('active');

      updateHUD();
      if (targetTab === 'labs') {
        renderLab1();
        renderLab2();
      }
    });
  });

  // Sound toggle
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      appState.sound = !appState.sound;
      sounds.enabled = appState.sound;
      soundToggle.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      sounds.playClick();
    });
  }

  // Reset Progress
  const resetProgress = document.getElementById('resetProgress');
  if (resetProgress) {
    resetProgress.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập của Bài 8?')) {
        sounds.playClick();
        appState.xp = 0;
        appState.streak = 0;
        appState.stars = 2;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        for (let i = 1; i <= 5; i++) {
          const b = document.getElementById(`badge-${i}`);
          if (b) {
            b.style.opacity = '0.45';
            b.style.filter = 'grayscale(80%)';
            b.style.borderColor = 'rgba(255,255,255,0.1)';
            b.style.boxShadow = 'none';
          }
        }
        renderQuiz();
        updateHUD();
      }
    });
  }

  // Avatar Modal Handlers
  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const btnCloseAvatarModal = document.getElementById('btnCloseAvatarModal');
  const btnSaveAvatar = document.getElementById('btnSaveAvatar');
  const inputStudentName = document.getElementById('inputStudentName');

  let selectedAvatarTemp = appState.avatar;

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      sounds.playClick();
      selectedAvatarTemp = appState.avatar;
      if (inputStudentName) inputStudentName.value = appState.userName;
      avatarModal.style.display = 'flex';
      avatarModal.classList.add('active');
    });
  }

  if (btnCloseAvatarModal && avatarModal) {
    btnCloseAvatarModal.addEventListener('click', () => {
      sounds.playClick();
      avatarModal.style.display = 'none';
      avatarModal.classList.remove('active');
    });
  }

  const avatarOpts = document.querySelectorAll('.avatar-opt');
  avatarOpts.forEach(btn => {
    btn.addEventListener('click', () => {
      sounds.playClick();
      avatarOpts.forEach(b => b.style.border = '1px solid #818cf8');
      btn.style.border = '2px solid #4ade80';
      selectedAvatarTemp = btn.getAttribute('data-avatar');
    });
  });

  if (btnSaveAvatar && avatarModal) {
    btnSaveAvatar.addEventListener('click', () => {
      sounds.playLevelUp();
      appState.avatar = selectedAvatarTemp;
      if (inputStudentName && inputStudentName.value.trim()) {
        appState.userName = inputStudentName.value.trim();
      }
      avatarModal.style.display = 'none';
      avatarModal.classList.remove('active');
      updateHUD();
    });
  }

  // In chứng nhận A4
  const btnPrintCert = document.getElementById('btnPrintCert');
  if (btnPrintCert) {
    btnPrintCert.addEventListener('click', () => {
      sounds.playFanfare();
      window.print();
    });
  }

  // Lab 1 Controls
  const selectDataset = document.getElementById('selectDataset');
  if (selectDataset) {
    selectDataset.addEventListener('change', (e) => {
      sounds.playClick();
      appState.activeLab1Data = e.target.value;
      renderLab1();
    });
  }

  const sliderGroups = document.getElementById('sliderGroups');
  const numGroupsVal = document.getElementById('numGroupsVal');
  if (sliderGroups) {
    sliderGroups.addEventListener('input', (e) => {
      const val = parseInt(e.target.value, 10);
      appState.lab1K = val;
      if (numGroupsVal) numGroupsVal.textContent = val;
      renderLab1();
    });
  }

  // Canvas Hover Tooltip Lab 1
  const canvas = document.getElementById('histogramCanvas');
  const tooltip = document.getElementById('canvasTooltip');
  if (canvas && tooltip) {
    canvas.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      const mouseX = (e.clientX - rect.left) * (canvas.width / rect.width);
      const mouseY = (e.clientY - rect.top) * (canvas.height / rect.height);

      const padLeft = 60;
      const padRight = 30;
      const plotW = canvas.width - padLeft - padRight;
      const data = rawDatasets[appState.activeLab1Data];
      const res = computeGrouping(data, appState.lab1K);
      const barW = plotW / res.groups.length;

      if (mouseX >= padLeft && mouseX <= canvas.width - padRight) {
        const idx = Math.floor((mouseX - padLeft) / barW);
        if (idx >= 0 && idx < res.groups.length) {
          hoveredBarIndex = idx;
          const g = res.groups[idx];
          tooltip.style.display = 'block';
          tooltip.style.left = `${e.clientX - rect.left + 14}px`;
          tooltip.style.top = `${e.clientY - rect.top - 38}px`;
          tooltip.innerHTML = `<strong>Nhóm ${g.i}: [${g.a}; ${g.b})</strong><br>Tần số: <b>${g.count}</b> (${g.pct}%)<br>Đại diện: c = ${g.c}`;
          drawHistogram(res);
          return;
        }
      }

      hoveredBarIndex = -1;
      tooltip.style.display = 'none';
      drawHistogram(res);
    });

    canvas.addEventListener('mouseleave', () => {
      hoveredBarIndex = -1;
      tooltip.style.display = 'none';
      const data = rawDatasets[appState.activeLab1Data];
      const res = computeGrouping(data, appState.lab1K);
      drawHistogram(res);
    });
  }

  // Lab 2 Controls
  const sliderTotal = document.getElementById('sliderTotalStudents');
  if (sliderTotal) {
    sliderTotal.addEventListener('input', () => {
      renderLab2();
    });
  }

  const selectSurvey = document.getElementById('selectSurveySample');
  if (selectSurvey) {
    selectSurvey.addEventListener('change', () => {
      sounds.playClick();
      renderLab2();
    });
  }

  // Khởi chạy hệ thống
  renderQuiz();
  renderLab1();
  renderLab2();
  updateHUD();
});
