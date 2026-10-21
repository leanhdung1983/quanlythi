// ================================================================
// ÔN TẬP TOÀN DIỆN CHƯƠNG III - TOÁN 11 KNTT
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
    const notes = [523.25, 659.25, 783.99, 1046.5];
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
  userTitle: 'Đại Sư Thống Kê Dữ Liệu Lớn',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false],
  currentTab: 'theory',
  skewFactor: 0,
  hasOutlier: false,
  realDatasetKey: 'pop2020'
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
  if (appState.currentTab === 'theory' && !appState.badges[0]) {
    unlockBadge(0);
  }
  if (appState.currentTab === 'labs' && !appState.badges[1]) {
    unlockBadge(1);
  }
  if (appState.xp >= 100 && !appState.badges[2]) {
    unlockBadge(2);
  }
  if (appState.xp >= 160 && !appState.badges[3]) {
    unlockBadge(3);
  }
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

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG TRẮC NGHIỆM (10 CÂU TỔNG HỢP CUỐI CHƯƠNG III) ---
const quizData = [
  {
    id: 1,
    title: "Câu 1: Giá trị đại diện của nhóm (SGK 3.8)",
    pts: 20,
    question: "Cho bảng phân bố thời gian tập thể dục có nhóm $[20; 40)$. Giá trị đại diện của nhóm này là:",
    options: [
      { text: "$10$", correct: false },
      { text: "$20$", correct: false },
      { text: "$30$", correct: true },
      { text: "$40$", correct: false }
    ],
    explanation: "Giá trị đại diện của nhóm $[a; b)$ là $c = \\frac{a + b}{2} = \\frac{20 + 40}{2} = 30$."
  },
  {
    id: 2,
    title: "Câu 2: Số mốt của mẫu ghép nhóm (SGK 3.9)",
    pts: 20,
    question: "Mẫu số liệu ghép nhóm có các tần số lần lượt là $5, 9, 12, 10, 6$. Mẫu số liệu này có bao nhiêu mốt?",
    options: [
      { text: "$0$", correct: false },
      { text: "$1$", correct: true },
      { text: "$2$", correct: false },
      { text: "$3$", correct: false }
    ],
    explanation: "Chỉ có duy nhất một nhóm có tần số lớn nhất là $12$ và các nhóm xung quanh có tần số thấp hơn, do đó mẫu số liệu có đúng $1$ mốt."
  },
  {
    id: 3,
    title: "Câu 3: Nhóm chứa mốt (SGK 3.10)",
    pts: 20,
    question: `Cho bảng số liệu ghép nhóm sau:
<div class="quiz-table-wrap">
  <table class="quiz-table">
    <thead>
      <tr>
        <th>Nhóm</th>
        <th>$[0; 20)$</th>
        <th>$[20; 40)$</th>
        <th>$[40; 60)$</th>
        <th>$[60; 80)$</th>
        <th>$[80; 100)$</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Tần số ($m_i$)</td>
        <td>$5$</td>
        <td>$9$</td>
        <td>$12$</td>
        <td>$10$</td>
        <td>$6$</td>
      </tr>
    </tbody>
  </table>
</div>
Nhóm chứa mốt của mẫu số liệu trên là:`,
    options: [
      { text: "$[20; 40)$", correct: false },
      { text: "$[40; 60)$", correct: true },
      { text: "$[60; 80)$", correct: false },
      { text: "$[80; 100)$", correct: false }
    ],
    explanation: "Tần số lớn nhất trong bảng là $12$, ứng với nhóm $[40; 60)$."
  },
  {
    id: 4,
    title: "Câu 4: Nhóm chứa tứ phân vị thứ nhất (SGK 3.11)",
    pts: 20,
    question: "Với cỡ mẫu $n = 42$ ở Câu 3, nhóm chứa tứ phân vị thứ nhất $Q_1$ là:",
    options: [
      { text: "$[0; 20)$", correct: false },
      { text: "$[20; 40)$", correct: true },
      { text: "$[40; 60)$", correct: false },
      { text: "$[60; 80)$", correct: false }
    ],
    explanation: "Ta có $\\frac{n}{4} = 10.5$. Tích luỹ nhóm 1 là $5$, nhóm 2 là $5 + 9 = 14 \\ge 10.5$. Vậy nhóm chứa $Q_1$ là $[20; 40)$."
  },
  {
    id: 5,
    title: "Câu 5: Nhóm chứa trung vị (SGK 3.12)",
    pts: 20,
    question: "Với cỡ mẫu $n = 42$ ở Câu 3, nhóm chứa trung vị $M_e$ là:",
    options: [
      { text: "$[0; 20)$", correct: false },
      { text: "$[20; 40)$", correct: false },
      { text: "$[40; 60)$", correct: true },
      { text: "$[60; 80)$", correct: false }
    ],
    explanation: "Ta có $\\frac{n}{2} = 21$. Tích luỹ nhóm 1 là $5$, nhóm 2 là $14$, nhóm 3 là $14 + 12 = 26 \\ge 21$. Vậy nhóm chứa trung vị là $[40; 60)$."
  },
  {
    id: 6,
    title: "Câu 6: Tính mốt tuổi thọ của ong (SGK 3.14)",
    pts: 20,
    question: `Khảo sát tuổi thọ của một số con ong (ngày) cho kết quả như sau:
<div class="quiz-table-wrap">
  <table class="quiz-table">
    <thead>
      <tr>
        <th>Tuổi thọ (ngày)</th>
        <th>$[0; 20)$</th>
        <th>$[20; 40)$</th>
        <th>$[40; 60)$</th>
        <th>$[60; 80)$</th>
        <th>$[80; 100)$</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Số con ong ($m_i$)</td>
        <td>$5$</td>
        <td>$12$</td>
        <td>$23$</td>
        <td>$31$</td>
        <td>$29$</td>
      </tr>
    </tbody>
  </table>
</div>
Mốt $M_o$ của mẫu số liệu này là:`,
    options: [
      { text: "$M_o = 72$ ngày", correct: false },
      { text: "$M_o = 76$ ngày", correct: true },
      { text: "$M_o = 70$ ngày", correct: false },
      { text: "$M_o = 78$ ngày", correct: false }
    ],
    explanation: "Nhóm có tần số lớn nhất là $[60; 80)$ với $m_j = 31$, $m_{j-1} = 23$, $m_{j+1} = 29$, $h = 20$. Ta có: $M_o = 60 + \\frac{31 - 23}{(31 - 23) + (31 - 29)} \\cdot 20 = 60 + \\frac{8}{8 + 2} \\cdot 20 = 60 + 16 = 76$ ngày."
  },
  {
    id: 7,
    title: "Câu 7: Điểm ngưỡng Top 25% đại học tốt nhất (SGK 3.15)",
    pts: 20,
    question: "Để chọn ra danh sách $25\\%$ trường đại học có chỉ số nghiên cứu tốt nhất Việt Nam, ta cần tính giá trị của số đặc trưng nào?",
    options: [
      { text: "Số trung bình $\\bar{x}$", correct: false },
      { text: "Trung vị $M_e$", correct: false },
      { text: "Tứ phân vị thứ nhất $Q_1$", correct: false },
      { text: "Tứ phân vị thứ ba $Q_3$", correct: true }
    ],
    explanation: "Tứ phân vị thứ ba $Q_3$ chia mẫu thành $75\\%$ số quan sát nhỏ hơn và $25\\%$ số quan sát lớn hơn. Do đó, điểm ngưỡng để lọt vào Top $25\\%$ trường đại học có chỉ số nghiên cứu cao nhất chính là $Q_3$."
  },
  {
    id: 8,
    title: "Câu 8: Quy luật độ lệch Skewness",
    pts: 20,
    question: "Trong một phân bố lệch phải (Right-Skewed, đuôi đồ thị kéo dài sang phía các giá trị lớn), mối quan hệ thứ tự giữa 3 số đặc trưng là:",
    options: [
      { text: "$\\bar{x} > M_e > M_o$", correct: true },
      { text: "$\\bar{x} < M_e < M_o$", correct: false },
      { text: "$\\bar{x} \\approx M_e \\approx M_o$", correct: false },
      { text: "$M_e > \\bar{x} > M_o$", correct: false }
    ],
    explanation: "Trong phân bố lệch phải, các giá trị ngoại lai ở đuôi phải kéo mạnh số trung bình lên cao, trong khi mốt ở vị trí đỉnh cao nhất bên trái. Thứ tự chuẩn mực là: $\\bar{x} > M_e > M_o$."
  },
  {
    id: 9,
    title: "Câu 9: Hiệu chỉnh khoảng điểm thi",
    pts: 20,
    question: "Khi ghép nhóm điểm thi rời rạc các nhóm $40 - 49$, $50 - 59$, nhóm $50 - 59$ được hiệu chỉnh thành nửa khoảng liên tục nào?",
    options: [
      { text: "$[50; 60)$", correct: false },
      { text: "$[49.5; 59.5)$", correct: true },
      { text: "$[50.5; 59.5)$", correct: false },
      { text: "$[49.5; 60.5)$", correct: false }
    ],
    explanation: "Quy tắc hiệu chỉnh khoảng số nguyên rời rạc $k_1 - k_2$ là mở rộng hai đầu mút $0.5$ đơn vị: $[k_1 - 0.5; k_2 + 0.5)$. Do đó $50 - 59$ trở thành $[49.5; 59.5)$."
  },
  {
    id: 10,
    title: "Câu 10: Ý nghĩa của khoảng tứ phân vị",
    pts: 20,
    question: "Khẳng định nào sau đây là ĐÚNG về khoảng tứ phân vị $\\Delta_Q = Q_3 - Q_1$?",
    options: [
      { text: "$\\Delta_Q$ đo độ phân tán của $50\\%$ số liệu ở trung tâm và không bị ảnh hưởng bởi giá trị ngoại lai", correct: true },
      { text: "$\\Delta_Q$ luôn bằng khoảng biến thiên $R$", correct: false },
      { text: "$\\Delta_Q$ rất nhạy cảm với các giá trị đột biến cực lớn", correct: false },
      { text: "$\\Delta_Q$ đo giá trị trung bình cộng của toàn bộ mẫu", correct: false }
    ],
    explanation: "Khoảng tứ phân vị $\\Delta_Q = Q_3 - Q_1$ đo chiều dài phạm vi của $50\\%$ các quan sát ở vùng trung tâm dữ liệu. Vì đã loại bỏ $25\\%$ phần đuôi dưới và $25\\%$ phần đuôi trên nên $\\Delta_Q$ hoàn toàn miễn nhiễm với các giá trị ngoại lai dị biệt."
  }
];

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

  question.options.forEach((_, idx) => {
    const btn = document.getElementById(`optBtn-${question.id}-${idx}`);
    if (btn) btn.disabled = true;
  });

  const expBox = document.getElementById(`explanation-${question.id}`);
  if (expBox) {
    expBox.style.display = 'block';
    expBox.classList.add('show');
    renderMathInTree(expBox);
  }

  updateHUD();
}

// --- 4. PHÒNG THÍ NGHIỆM LAB 1: SKEWNESS SIMULATOR ---
function getSkewData(skew, hasOutlier) {
  // 7 nhóm từ [10; 20) đến [70; 80)
  let freqs = [];
  if (skew === -2) freqs = [2, 4, 7, 12, 18, 26, 15]; // Lệch trái mạnh
  else if (skew === -1) freqs = [3, 6, 10, 15, 22, 18, 10]; // Lệch trái nhẹ
  else if (skew === 0) freqs = [4, 10, 20, 30, 20, 10, 4]; // Chuẩn đối xứng
  else if (skew === 1) freqs = [10, 18, 22, 15, 10, 6, 3]; // Lệch phải nhẹ
  else if (skew === 2) freqs = [15, 26, 18, 12, 7, 4, 2]; // Lệch phải mạnh

  const groups = [
    { a: 10, b: 20, m: freqs[0] },
    { a: 20, b: 30, m: freqs[1] },
    { a: 30, b: 40, m: freqs[2] },
    { a: 40, b: 50, m: freqs[3] },
    { a: 50, b: 60, m: freqs[4] },
    { a: 60, b: 70, m: freqs[5] },
    { a: 70, b: 80, m: freqs[6] }
  ];

  if (hasOutlier) {
    groups.push({ a: 120, b: 140, m: 3 }); // Ngoại lai siêu lớn
  }

  let n = 0;
  let sumProd = 0;
  let cum = 0;

  const table = groups.map((g, idx) => {
    const c = (g.a + g.b) / 2;
    n += g.m;
    sumProd += g.m * c;
    cum += g.m;
    return { ...g, c, cum, idx };
  });

  const mean = sumProd / n;

  // Trung vị
  const halfN = n / 2;
  const medGroup = table.find(g => g.cum >= halfN);
  const medPrev = medGroup.idx > 0 ? table[medGroup.idx - 1].cum : 0;
  const median = medGroup.a + ((halfN - medPrev) / medGroup.m) * (medGroup.b - medGroup.a);

  // Mốt
  let maxM = -1;
  let modeGroup = null;
  table.forEach(g => {
    if (g.m > maxM) {
      maxM = g.m;
      modeGroup = g;
    }
  });

  const j = modeGroup.idx;
  const mPrev = j > 0 ? table[j - 1].m : 0;
  const mNext = j < table.length - 1 ? table[j + 1].m : 0;
  const d1 = modeGroup.m - mPrev;
  const d2 = modeGroup.m - mNext;
  let mode = modeGroup.a;
  if (d1 + d2 > 0) {
    mode = modeGroup.a + (d1 / (d1 + d2)) * (modeGroup.b - modeGroup.a);
  }

  return { n, table, mean, median, mode };
}

function renderLab1() {
  const skew = appState.skewFactor;
  const hasOutlier = appState.hasOutlier;
  const res = getSkewData(skew, hasOutlier);

  const meanEl = document.getElementById('skewMeanDisplay');
  if (meanEl) meanEl.textContent = res.mean.toFixed(2);

  const medEl = document.getElementById('skewMedDisplay');
  if (medEl) medEl.textContent = res.median.toFixed(2);

  const modeEl = document.getElementById('skewModeDisplay');
  if (modeEl) modeEl.textContent = res.mode.toFixed(2);

  const shapeLabel = document.getElementById('distShapeLabel');
  if (shapeLabel) {
    if (skew < 0) shapeLabel.textContent = `Lệch Trái (Đuôi trái dài, âm)`;
    else if (skew === 0) shapeLabel.textContent = `Đối Xứng (Chuẩn)`;
    else shapeLabel.textContent = `Lệch Phải (Đuôi phải dài, dương)`;
    if (hasOutlier) shapeLabel.textContent += ' + Có Ngoại Lai';
  }

  const explBox = document.getElementById('skewExplBox');
  if (explBox) {
    let text = '';
    if (hasOutlier) {
      text = `<strong>⚠️ Hiện tượng ngoại lai (Outliers):</strong> Khi có thêm các giá trị siêu lớn ở xa (120 - 140), <strong>Số trung bình $\\bar{x}$ bị kéo vọt lên ${res.mean.toFixed(2)}</strong>. Trong khi đó, <strong>Trung vị $M_e = ${res.median.toFixed(2)}$ vẫn đứng vững</strong> phản ánh chuẩn xác khuynh hướng của đa số mẫu. Đây chính là lý do vì sao trong thống kê tiền lương và thu nhập, Trung vị là thước đo công bằng và đáng tin cậy hơn Số trung bình!`;
    } else if (skew === 0) {
      text = `<strong>✨ Phân bố đối xứng (Chuẩn):</strong> Ta có $\\bar{x} \\approx M_e \\approx M_o \\approx ${res.mean.toFixed(2)}$. Cả ba đại lượng đều hội tụ tại đỉnh trung tâm của đồ thị. Lúc này sử dụng số trung bình $\\bar{x}$ là tối ưu nhất.`;
    } else if (skew > 0) {
      text = `<strong>➡️ Phân bố lệch phải (Dương):</strong> Đuôi đồ thị kéo dài sang phải. Ta thấy quy luật: $\\bar{x} (${res.mean.toFixed(2)}) > M_e (${res.median.toFixed(2)}) > M_o (${res.mode.toFixed(2)})$.`;
    } else {
      text = `<strong>⬅️ Phân bố lệch trái (Âm):</strong> Đuôi đồ thị kéo dài sang trái. Ta thấy quy luật: $\\bar{x} (${res.mean.toFixed(2)}) < M_e (${res.median.toFixed(2)}) < M_o (${res.mode.toFixed(2)})$.`;
    }
    explBox.innerHTML = text;
    renderMathInTree(explBox);
  }

  drawSkewCanvas(res);
}

function drawSkewCanvas(res) {
  const canvas = document.getElementById('skewCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const padLeft = 60;
  const padRight = 40;
  const padTop = 30;
  const padBottom = 50;

  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  const minX = 0;
  const maxX = appState.hasOutlier ? 150 : 90;
  const maxM = Math.max(...res.table.map(g => g.m), 30);

  const toX = x => padLeft + ((x - minX) / (maxX - minX)) * plotW;
  const toY = m => padTop + plotH - (m / maxM) * plotH;

  // Lưới toạ độ
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Inter, sans-serif';
  ctx.textAlign = 'right';

  for (let m = 0; m <= maxM; m += 10) {
    const y = toY(m);
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);
    ctx.stroke();
    ctx.fillText(m, padLeft - 8, y + 4);
  }

  // Vẽ các cột
  res.table.forEach(g => {
    const x1 = toX(g.a);
    const x2 = toX(g.b);
    const colW = x2 - x1;
    const barH = (g.m / maxM) * plotH;
    const y = padTop + plotH - barH;

    const grad = ctx.createLinearGradient(x1, y, x1, padTop + plotH);
    if (g.a >= 100) {
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(1, 'rgba(244, 63, 94, 0.2)');
    } else {
      grad.addColorStop(0, '#6366f1');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0.15)');
    }

    ctx.fillStyle = grad;
    ctx.fillRect(x1 + 1, y, colW - 2, barH);
    ctx.strokeStyle = g.a >= 100 ? '#f43f5e' : 'rgba(129, 140, 248, 0.5)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x1 + 1, y, colW - 2, barH);

    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.a, x1, padTop + plotH + 18);
  });

  // Vẽ đường cong phân bố mượt mà
  ctx.beginPath();
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 3;
  res.table.forEach((g, i) => {
    const px = toX(g.c);
    const py = toY(g.m);
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  });
  ctx.stroke();

  // Vẽ 3 đường dóng đứng: x̄, Me, Mo
  const indicators = [
    { val: res.mean, name: 'x̄', color: '#38bdf8', yOff: 14 },
    { val: res.median, name: 'Me', color: '#4ade80', yOff: 30 },
    { val: res.mode, name: 'Mo', color: '#fb7185', yOff: 46 }
  ];

  indicators.forEach(ind => {
    const ix = toX(ind.val);
    ctx.strokeStyle = ind.color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(ix, padTop);
    ctx.lineTo(ix, padTop + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = ind.color;
    ctx.beginPath();
    ctx.arc(ix, padTop + ind.yOff, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = ind.color;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${ind.name}=${ind.val.toFixed(1)}`, ix, padTop + ind.yOff - 5);
  });

  // Trục chính
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop);
  ctx.lineTo(padLeft, padTop + plotH);
  ctx.lineTo(w - padRight, padTop + plotH);
  ctx.stroke();
}

// --- 5. PHÒNG THÍ NGHIỆM LAB 2: DỮ LIỆU THỰC TẾ VIỆT NAM ---
const realDatasets = {
  pop2020: {
    title: "Cơ cấu dân số Việt Nam năm 2020 (SGK Bài 3.13 trang 69)",
    desc: "Tổng dân số: 97.33 triệu người",
    groups: [
      { label: "Dưới 5 tuổi", a: 0, b: 5, c: 2.5, count: 7.89, color: "#38bdf8" },
      { label: "5 - 14 tuổi", a: 5, b: 15, c: 9.5, count: 14.68, color: "#4ade80" },
      { label: "15 - 24 tuổi", a: 15, b: 25, c: 19.5, count: 13.32, color: "#facc15" },
      { label: "25 - 64 tuổi", a: 25, b: 65, c: 44.5, count: 53.78, color: "#fb923c" },
      { label: "Trên 65 tuổi", a: 65, b: 95, c: 80.0, count: 7.66, color: "#f43f5e" }
    ],
    calcMean: () => {
      const groups = [
        { c: 2.5, m: 7.89 },
        { c: 9.5, m: 14.68 },
        { c: 19.5, m: 13.32 },
        { c: 44.5, m: 53.78 },
        { c: 80.0, m: 7.66 }
      ];
      const n = groups.reduce((acc, g) => acc + g.m, 0);
      const sum = groups.reduce((acc, g) => acc + g.c * g.m, 0);
      return { n, mean: sum / n };
    }
  },
  uni: {
    title: "Chỉ số nghiên cứu 35 trường Đại học Việt Nam (SGK Bài 3.15 trang 70)",
    desc: "Phân loại chuẩn hoá điểm số nghiên cứu khoa học",
    groups: [
      { label: "Dưới 20 điểm", a: 0, b: 20, c: 10, count: 4, color: "#94a3b8" },
      { label: "20 - 30 điểm", a: 20, b: 30, c: 25, count: 19, color: "#38bdf8" },
      { label: "30 - 40 điểm", a: 30, b: 40, c: 35, count: 6, color: "#4ade80" },
      { label: "40 - 60 điểm", a: 40, b: 60, c: 50, count: 2, color: "#facc15" },
      { label: "60 - 80 điểm", a: 60, b: 80, c: 70, count: 3, color: "#fb923c" },
      { label: "80 - 100 điểm", a: 80, b: 100, c: 90, count: 1, color: "#f43f5e" }
    ],
    calcQ3: () => {
      // n = 35, 3n/4 = 26.25. Tích luỹ: 4, 23, 29 >= 26.25 => nhóm [30; 40)
      const q3 = 30 + ((26.25 - 23) / 6) * 10;
      return { n: 35, q3 };
    }
  }
};

function renderLab2() {
  const key = appState.realDatasetKey;
  const ds = realDatasets[key];

  const summary = document.getElementById('realDataSummary');
  if (summary) {
    if (key === 'pop2020') {
      const calc = ds.calcMean();
      summary.innerHTML = `
        <strong>💡 Kết quả phân tích nhân khẩu học năm 2020 (SGK 3.13):</strong><br>
        • Tổng dân số mẫu: $n = ${calc.n.toFixed(2)}$ triệu người.<br>
        • <strong>Tuổi trung bình của người dân Việt Nam năm 2020 là: $\\bar{x} \\approx ${calc.mean.toFixed(1)}$ tuổi</strong>.<br>
        • Nhóm tuổi lao động vàng ($25 - 64$ tuổi) chiếm đa số với $53.78$ triệu người (${((53.78 / calc.n) * 100).toFixed(1)}%), khẳng định thời kỳ cơ cấu dân số vàng của đất nước!
      `;
    } else {
      const calc = ds.calcQ3();
      summary.innerHTML = `
        <strong>💡 Kết quả phân tích chất lượng Đại học (SGK 3.15):</strong><br>
        • Tổng số cơ sở khảo sát: $n = ${calc.n}$ trường Đại học.<br>
        • Vị trí $25\\%$ dẫn đầu tương ứng với tứ phân vị thứ ba $Q_3$ (mốc $\\frac{3n}{4} = 26.25$).<br>
        • Nhóm chứa $Q_3$ là $[30; 40)$ với tần số $m_3 = 6$ và tần số tích luỹ nhóm trước $C_2 = 23$.<br>
        • <strong>Điểm chuẩn ngưỡng để lọt vào Top 25% trường đại học có chỉ số nghiên cứu tốt nhất là: $Q_3 = 30 + \\frac{26.25 - 23}{6} \\times 10 \\approx ${calc.q3.toFixed(2)}$ điểm</strong>.
      `;
    }
    renderMathInTree(summary);
  }

  drawRealDataCanvas(ds);
}

function drawRealDataCanvas(ds) {
  const canvas = document.getElementById('realDataCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const padLeft = 140;
  const padRight = 40;
  const padTop = 30;
  const padBottom = 40;

  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  const maxVal = Math.max(...ds.groups.map(g => g.count));
  const barGap = 12;
  const barH = (plotH - (ds.groups.length - 1) * barGap) / ds.groups.length;

  ds.groups.forEach((g, i) => {
    const y = padTop + i * (barH + barGap);
    const barW = (g.count / maxVal) * plotW;

    // Tên nhóm bên trái
    ctx.fillStyle = '#cbd5e1';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(g.label, padLeft - 14, y + barH / 2 + 4);

    // Thanh ngang
    const grad = ctx.createLinearGradient(padLeft, y, padLeft + barW, y);
    grad.addColorStop(0, g.color);
    grad.addColorStop(1, 'rgba(255, 255, 255, 0.2)');
    ctx.fillStyle = grad;
    ctx.fillRect(padLeft, y, barW, barH);

    ctx.strokeStyle = g.color;
    ctx.lineWidth = 1.5;
    ctx.strokeRect(padLeft, y, barW, barH);

    // Số liệu trên thanh
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`${g.count} (${((g.count / ds.groups.reduce((a, b) => a + b.count, 0)) * 100).toFixed(1)}%)`, padLeft + barW + 10, y + barH / 2 + 4);
  });

  // Trục dọc
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop - 10);
  ctx.lineTo(padLeft, padTop + plotH);
  ctx.stroke();
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
      if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập của Ôn tập Chương III?')) {
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
  const sliderSkew = document.getElementById('sliderSkew');
  if (sliderSkew) {
    sliderSkew.addEventListener('input', (e) => {
      appState.skewFactor = parseInt(e.target.value, 10);
      renderLab1();
    });
  }

  const btnToggleOutlier = document.getElementById('btnToggleOutlier');
  if (btnToggleOutlier) {
    btnToggleOutlier.addEventListener('click', () => {
      sounds.playClick();
      appState.hasOutlier = !appState.hasOutlier;
      btnToggleOutlier.textContent = appState.hasOutlier ? 'TẮT Ngoại Lai' : 'BẬT Ngoại Lai';
      btnToggleOutlier.style.background = appState.hasOutlier ? '#f43f5e' : '#6366f1';
      renderLab1();
    });
  }

  // Lab 2 Controls
  const selectRealDataset = document.getElementById('selectRealDataset');
  if (selectRealDataset) {
    selectRealDataset.addEventListener('change', (e) => {
      sounds.playClick();
      appState.realDatasetKey = e.target.value;
      renderLab2();
    });
  }

  // Khởi chạy hệ thống
  renderQuiz();
  renderLab1();
  renderLab2();
  updateHUD();
});
