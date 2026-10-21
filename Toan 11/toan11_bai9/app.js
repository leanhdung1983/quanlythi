// ================================================================
// BÀI 9: CÁC SỐ ĐẶC TRƯNG ĐO XU THẾ TRUNG TÂM - TOÁN 11 KNTT
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
  userTitle: 'Chuyên Gia Phân Tích Thống Kê',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false],
  currentTab: 'theory',
  activeLab1Preset: 'tv',
  lab2Percentile: 50
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

// --- 3. DỮ LIỆU ĐẤU TRƯỜNG TRẮC NGHIỆM (10 CÂU CHUẨN SGK BÀI 9) ---
const quizData = [
  {
    id: 1,
    title: "Câu 1: Nhóm chứa trung vị (SGK 3.12)",
    pts: 20,
    question: `Khảo sát thời gian tập thể dục trong ngày của học sinh khối 11 thu được mẫu số liệu ghép nhóm sau:
<div class="quiz-table-wrap">
  <table class="quiz-table">
    <thead>
      <tr>
        <th>Thời gian (phút)</th>
        <th>$[0; 20)$</th>
        <th>$[20; 40)$</th>
        <th>$[40; 60)$</th>
        <th>$[60; 80)$</th>
        <th>$[80; 100)$</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Số học sinh ($m_i$)</td>
        <td>$5$</td>
        <td>$9$</td>
        <td>$12$</td>
        <td>$10$</td>
        <td>$6$</td>
      </tr>
    </tbody>
  </table>
</div>
Nhóm chứa trung vị của mẫu số liệu trên là:`,
    options: [
      { text: "$[0; 20)$", correct: false },
      { text: "$[20; 40)$", correct: false },
      { text: "$[40; 60)$", correct: true },
      { text: "$[60; 80)$", correct: false }
    ],
    explanation: "Cỡ mẫu $n = 5 + 9 + 12 + 10 + 6 = 42$. Ta có $\\frac{n}{2} = 21$. Tần số tích luỹ các nhóm lần lượt là: nhóm 1 có $5$; nhóm 2 có $5 + 9 = 14$; nhóm 3 có $14 + 12 = 26 \\ge 21$. Do đó nhóm chứa trung vị là nhóm thứ ba $[40; 60)$."
  },
  {
    id: 2,
    title: "Câu 2: Nhóm chứa tứ phân vị thứ nhất (SGK 3.11)",
    pts: 20,
    question: "Với mẫu số liệu ở Câu 1 ($n = 42$), nhóm chứa tứ phân vị thứ nhất $Q_1$ là:",
    options: [
      { text: "$[0; 20)$", correct: false },
      { text: "$[20; 40)$", correct: true },
      { text: "$[40; 60)$", correct: false },
      { text: "$[60; 80)$", correct: false }
    ],
    explanation: "Ta có $\\frac{n}{4} = \\frac{42}{4} = 10.5$. Tần số tích luỹ nhóm 1 là $5 < 10.5$; nhóm 2 có $5 + 9 = 14 \\ge 10.5$. Do đó nhóm chứa tứ phân vị thứ nhất $Q_1$ là nhóm thứ hai $[20; 40)$."
  },
  {
    id: 3,
    title: "Câu 3: Nhóm chứa mốt của mẫu ghép nhóm (SGK 3.10)",
    pts: 20,
    question: "Với mẫu số liệu ở Câu 1, nhóm chứa mốt của mẫu số liệu này là:",
    options: [
      { text: "$[20; 40)$", correct: false },
      { text: "$[40; 60)$", correct: true },
      { text: "$[60; 80)$", correct: false },
      { text: "$[80; 100)$", correct: false }
    ],
    explanation: "Nhóm chứa mốt là nhóm có tần số lớn nhất. So sánh các tần số $5, 9, 12, 10, 6$, tần số lớn nhất là $12$ thuộc nhóm $[40; 60)$. Vậy nhóm chứa mốt là $[40; 60)$."
  },
  {
    id: 4,
    title: "Câu 4: Giá trị đại diện của nhóm (SGK 3.8)",
    pts: 20,
    question: "Giá trị đại diện của nhóm $[20; 40)$ là:",
    options: [
      { text: "$10$", correct: false },
      { text: "$20$", correct: false },
      { text: "$30$", correct: true },
      { text: "$40$", correct: false }
    ],
    explanation: "Giá trị đại diện của nhóm $[a; b)$ là trung bình cộng hai đầu mút: $c = \\frac{a + b}{2} = \\frac{20 + 40}{2} = 30$."
  },
  {
    id: 5,
    title: "Câu 5: Số lượng mốt của mẫu ghép nhóm (SGK 3.9)",
    pts: 20,
    question: "Mẫu số liệu ở Câu 1 có bao nhiêu mốt?",
    options: [
      { text: "$0$", correct: false },
      { text: "$1$", correct: true },
      { text: "$2$", correct: false },
      { text: "$3$", correct: false }
    ],
    explanation: "Vì chỉ có duy nhất một nhóm $[40; 60)$ đạt tần số cực đại $m_3 = 12$ và các nhóm lân cận có tần số nhỏ hơn, nên mẫu số liệu này có đúng $1$ mốt duy nhất."
  },
  {
    id: 6,
    title: "Câu 6: Tính số trung bình",
    pts: 20,
    question: `Cho mẫu số liệu ghép nhóm sau:
<div class="quiz-table-wrap">
  <table class="quiz-table">
    <thead>
      <tr>
        <th>Nhóm giá trị</th>
        <th>$[0; 10)$</th>
        <th>$[10; 20)$</th>
        <th>$[20; 30)$</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Tần số ($m_i$)</td>
        <td>$4$</td>
        <td>$6$</td>
        <td>$10$</td>
      </tr>
    </tbody>
  </table>
</div>
Số trung bình $\\bar{x}$ của mẫu số liệu ghép nhóm này là:`,
    options: [
      { text: "$\\bar{x} = 15$", correct: false },
      { text: "$\\bar{x} = 18$", correct: true },
      { text: "$\\bar{x} = 20$", correct: false },
      { text: "$\\bar{x} = 22$", correct: false }
    ],
    explanation: "Giá trị đại diện các nhóm lần lượt là $c_1 = 5, c_2 = 15, c_3 = 25$. Cỡ mẫu $n = 4 + 6 + 10 = 20$. Ta có: $\\bar{x} = \\frac{4\\times 5 + 6\\times 15 + 10\\times 25}{20} = \\frac{20 + 90 + 250}{20} = \\frac{360}{20} = 18$."
  },
  {
    id: 7,
    title: "Câu 7: Tính trung vị theo công thức SGK",
    pts: 20,
    question: "Với nhóm chứa trung vị là $[40; 60)$, tần số $m_p = 12$, cỡ mẫu $n = 42$ và tổng tần số các nhóm đứng trước là $C_{p-1} = 14$. Giá trị trung vị $M_e$ tính được là:",
    options: [
      { text: "$M_e \\approx 51.67$", correct: true },
      { text: "$M_e = 50.00$", correct: false },
      { text: "$M_e \\approx 48.33$", correct: false },
      { text: "$M_e = 55.00$", correct: false }
    ],
    explanation: "Áp dụng công thức: $M_e = a_p + \\frac{\\frac{n}{2} - C_{p-1}}{m_p} \\cdot (a_{p+1} - a_p) = 40 + \\frac{21 - 14}{12} \\cdot 20 = 40 + \\frac{7}{12} \\cdot 20 = 40 + 11.67 \\approx 51.67$."
  },
  {
    id: 8,
    title: "Câu 8: Tính mốt theo công thức SGK",
    pts: 20,
    question: "Nhóm chứa mốt là $[40; 60)$ có tần số $m_j = 12$, nhóm đứng trước có $m_{j-1} = 9$, nhóm đứng sau có $m_{j+1} = 10$, độ dài nhóm $h = 20$. Mốt $M_o$ bằng:",
    options: [
      { text: "$M_o = 48$", correct: false },
      { text: "$M_o = 50$", correct: false },
      { text: "$M_o = 52$", correct: true },
      { text: "$M_o = 54$", correct: false }
    ],
    explanation: "Áp dụng công thức: $M_o = a_j + \\frac{m_j - m_{j-1}}{(m_j - m_{j-1}) + (m_j - m_{j+1})} \\cdot h = 40 + \\frac{12 - 9}{(12 - 9) + (12 - 10)} \\cdot 20 = 40 + \\frac{3}{3 + 2} \\cdot 20 = 40 + 12 = 52$."
  },
  {
    id: 9,
    title: "Câu 9: Ưu điểm của trung vị khi có giá trị ngoại lai",
    pts: 20,
    question: "Khi khảo sát thu nhập của người dân một khu vực có sự xuất hiện của một vài tỷ phú với khối tài sản khổng lồ (giá trị ngoại lai), số đặc trưng nào phản ánh trung thực nhất mức sống của đa số người dân?",
    options: [
      { text: "Số trung bình $\\bar{x}$", correct: false },
      { text: "Trung vị $M_e$", correct: true },
      { text: "Khoảng biến thiên $R$", correct: false },
      { text: "Giá trị lớn nhất $x_{\\max}$", correct: false }
    ],
    explanation: "Số trung bình $\\bar{x}$ rất nhạy cảm và bị kéo lệch nghiêm trọng bởi các giá trị ngoại lai cực lớn. Ngược lại, Trung vị $M_e$ chỉ phụ thuộc vào thứ tự vị trí giữa mẫu nên hoàn toàn không bị ảnh hưởng bởi các giá trị dị biệt, phản ánh trung thực mức thu nhập của đa số người dân."
  },
  {
    id: 10,
    title: "Câu 10: Ý nghĩa của tứ phân vị thứ ba Q3",
    pts: 20,
    question: "Điểm chuẩn xét tuyển học bổng của một trường đại học lấy mốc tứ phân vị thứ ba $Q_3 = 84.5$ điểm. Điều này có nghĩa là:",
    options: [
      { text: "Có khoảng $75\\%$ sinh viên đạt điểm thấp hơn $84.5$ và $25\\%$ sinh viên đạt từ $84.5$ điểm trở lên", correct: true },
      { text: "Có khoảng $25\\%$ sinh viên đạt điểm thấp hơn $84.5$", correct: false },
      { text: "Điểm số trung bình của toàn trường là $84.5$ điểm", correct: false },
      { text: "Có đúng $3$ sinh viên đạt trên $84.5$ điểm", correct: false }
    ],
    explanation: "Theo định nghĩa tứ phân vị, $Q_3$ là ngưỡng phân chia mẫu số liệu sao cho có $75\\%$ số quan sát nhỏ hơn $Q_3$ và $25\\%$ số quan sát lớn hơn $Q_3$. Vì vậy nhóm $25\\%$ sinh viên xuất sắc nhất có điểm số $\\ge 84.5$ sẽ được nhận học bổng."
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

// --- 4. PHÒNG THÍ NGHIỆM LAB 1: MÁY TÍNH 5 SỐ ĐẶC TRƯNG ---
const lab1Presets = {
  tv: {
    title: "Thời gian xem ti vi trong tuần (Bảng 3.1 SGK trang 62)",
    unit: "giờ",
    groups: [
      { a: 0, b: 5, m: 8 },
      { a: 5, b: 10, m: 16 },
      { a: 10, b: 15, m: 4 },
      { a: 15, b: 20, m: 2 },
      { a: 20, b: 25, m: 2 }
    ]
  },
  battery: {
    title: "Tuổi thọ bình ắc quy ô tô (Bài 3.5 SGK trang 67)",
    unit: "năm",
    groups: [
      { a: 2.0, b: 2.5, m: 4 },
      { a: 2.5, b: 3.0, m: 9 },
      { a: 3.0, b: 3.5, m: 14 },
      { a: 3.5, b: 4.0, m: 11 },
      { a: 4.0, b: 4.5, m: 7 },
      { a: 4.5, b: 5.0, m: 5 }
    ]
  },
  height: {
    title: "Chiều cao của 50 học sinh 11A (Ví dụ 4 SGK trang 66)",
    unit: "cm",
    groups: [
      { a: 145, b: 150, m: 7 },
      { a: 150, b: 155, m: 14 },
      { a: 155, b: 160, m: 10 },
      { a: 160, b: 165, m: 10 },
      { a: 165, b: 170, m: 9 }
    ]
  },
  exam: {
    title: "Thời gian hoàn thành câu hỏi thi (Luyện tập 4 SGK trang 66)",
    unit: "phút",
    groups: [
      { a: 0.5, b: 10.5, m: 2 },
      { a: 10.5, b: 20.5, m: 10 },
      { a: 20.5, b: 30.5, m: 6 },
      { a: 30.5, b: 40.5, m: 4 },
      { a: 40.5, b: 50.5, m: 3 }
    ]
  }
};

function calculate5Metrics(preset) {
  const groups = preset.groups;
  const n = groups.reduce((acc, g) => acc + g.m, 0);

  // 1. Tính số trung bình \bar{x}
  let sumProd = 0;
  let cum = 0;
  const table = groups.map((g, idx) => {
    const c = (g.a + g.b) / 2;
    sumProd += g.m * c;
    cum += g.m;
    return { ...g, c, cum, idx };
  });
  const mean = sumProd / n;

  // 2. Trung vị M_e (vị trí n/2)
  const halfN = n / 2;
  const medGroup = table.find(g => g.cum >= halfN);
  const medPrevCum = medGroup.idx > 0 ? table[medGroup.idx - 1].cum : 0;
  const medH = medGroup.b - medGroup.a;
  const median = medGroup.a + ((halfN - medPrevCum) / medGroup.m) * medH;

  // 3. Tứ phân vị Q1 (vị trí n/4) & Q3 (vị trí 3n/4)
  const q1Pos = n / 4;
  const q1Group = table.find(g => g.cum >= q1Pos);
  const q1PrevCum = q1Group.idx > 0 ? table[q1Group.idx - 1].cum : 0;
  const q1H = q1Group.b - q1Group.a;
  const q1 = q1Group.a + ((q1Pos - q1PrevCum) / q1Group.m) * q1H;

  const q3Pos = (3 * n) / 4;
  const q3Group = table.find(g => g.cum >= q3Pos);
  const q3PrevCum = q3Group.idx > 0 ? table[q3Group.idx - 1].cum : 0;
  const q3H = q3Group.b - q3Group.a;
  const q3 = q3Group.a + ((q3Pos - q3PrevCum) / q3Group.m) * q3H;

  // 4. Mốt M_o (nhóm tần số lớn nhất)
  let maxFreq = -1;
  let modeGroup = null;
  table.forEach(g => {
    if (g.m > maxFreq) {
      maxFreq = g.m;
      modeGroup = g;
    }
  });

  const j = modeGroup.idx;
  const mPrev = j > 0 ? table[j - 1].m : 0;
  const mNext = j < table.length - 1 ? table[j + 1].m : 0;
  const d1 = modeGroup.m - mPrev;
  const d2 = modeGroup.m - mNext;
  const modeH = modeGroup.b - modeGroup.a;
  let mode = modeGroup.a;
  if (d1 + d2 > 0) {
    mode = modeGroup.a + (d1 / (d1 + d2)) * modeH;
  }

  return { n, table, mean, median, q1, q3, mode, medGroup, q1Group, q3Group, modeGroup };
}

function renderLab1() {
  const key = appState.activeLab1Preset;
  const preset = lab1Presets[key];
  const res = calculate5Metrics(preset);

  const statMean = document.getElementById('statMean');
  if (statMean) statMean.textContent = `${res.mean.toFixed(2)} ${preset.unit}`;

  const statMedian = document.getElementById('statMedian');
  if (statMedian) statMedian.textContent = `${res.median.toFixed(2)} ${preset.unit}`;

  const statQuartiles = document.getElementById('statQuartiles');
  if (statQuartiles) statQuartiles.textContent = `Q₁=${res.q1.toFixed(2)} | Q₃=${res.q3.toFixed(2)}`;

  const statMode = document.getElementById('statMode');
  if (statMode) statMode.textContent = `${res.mode.toFixed(2)} ${preset.unit}`;

  // Chi tiết các bước tính
  const stepsBox = document.getElementById('stepsDetailBox');
  if (stepsBox) {
    stepsBox.innerHTML = `
      <h4 style="margin: 0 0 10px; color: #38bdf8;">📝 Các Bước Tính Toán Chi Tiết (${preset.title}):</h4>
      <ul style="margin: 0; padding-left: 20px;">
        <li><strong>Cỡ mẫu:</strong> $n = ${res.n}$</li>
        <li><strong>Số trung bình:</strong> $\\bar{x} = \\frac{\\sum m_i c_i}{n} = \\frac{${(res.mean * res.n).toFixed(1)}}{${res.n}} \\approx ${res.mean.toFixed(2)}$ ${preset.unit}</li>
        <li><strong>Trung vị:</strong> $\\frac{n}{2} = ${res.n / 2}$, nhóm chứa trung vị là $[${res.medGroup.a}; ${res.medGroup.b}) \\implies M_e = ${res.medGroup.a} + \\frac{${res.n / 2} - ${res.medGroup.idx > 0 ? res.table[res.medGroup.idx - 1].cum : 0}}{${res.medGroup.m}} \\cdot ${res.medGroup.b - res.medGroup.a} \\approx ${res.median.toFixed(2)}$ ${preset.unit}</li>
        <li><strong>Tứ phân vị:</strong> $Q_1 \\approx ${res.q1.toFixed(2)}$; $Q_3 \\approx ${res.q3.toFixed(2)}$ (Khoảng tứ phân vị $\\Delta_Q = Q_3 - Q_1 = ${(res.q3 - res.q1).toFixed(2)}$)</li>
        <li><strong>Mốt:</strong> Tần số lớn nhất $m_j = ${res.modeGroup.m}$ thuộc nhóm $[${res.modeGroup.a}; ${res.modeGroup.b}) \\implies M_o = ${res.modeGroup.a} + \\frac{${res.modeGroup.m} - ${res.modeGroup.idx > 0 ? res.table[res.modeGroup.idx - 1].m : 0}}{(${res.modeGroup.m} - ${res.modeGroup.idx > 0 ? res.table[res.modeGroup.idx - 1].m : 0}) + (${res.modeGroup.m} - ${res.modeGroup.idx < res.table.length - 1 ? res.table[res.modeGroup.idx + 1].m : 0})} \\cdot ${res.modeGroup.b - res.modeGroup.a} \\approx ${res.mode.toFixed(2)}$ ${preset.unit}</li>
      </ul>
    `;
    renderMathInTree(stepsBox);
  }

  // Vẽ Canvas đồ họa Histogram với các đường dóng thẳng đứng
  drawMultiStatCanvas(preset, res);
}

function drawMultiStatCanvas(preset, res) {
  const canvas = document.getElementById('multiStatCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 50;

  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  const minX = res.table[0].a;
  const maxX = res.table[res.table.length - 1].b;
  const maxM = Math.max(...res.table.map(g => g.m));

  // Trục toạ độ và lưới
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Inter, sans-serif';
  ctx.textAlign = 'right';

  for (let m = 0; m <= maxM; m += Math.max(1, Math.round(maxM / 4))) {
    const y = padTop + plotH - (m / maxM) * plotH;
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);
    ctx.stroke();
    ctx.fillText(m, padLeft - 8, y + 4);
  }

  // Vẽ các cột histogram
  const toX = val => padLeft + ((val - minX) / (maxX - minX)) * plotW;

  res.table.forEach(g => {
    const x1 = toX(g.a);
    const x2 = toX(g.b);
    const colW = x2 - x1;
    const barH = (g.m / maxM) * plotH;
    const y = padTop + plotH - barH;

    const grad = ctx.createLinearGradient(x1, y, x1, padTop + plotH);
    grad.addColorStop(0, 'rgba(99, 102, 241, 0.4)');
    grad.addColorStop(1, 'rgba(30, 27, 75, 0.2)');
    ctx.fillStyle = grad;
    ctx.fillRect(x1 + 1, y, colW - 2, barH);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x1 + 1, y, colW - 2, barH);

    // Mốc dưới
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(g.a, x1, padTop + plotH + 18);
  });
  // Mốc cuối cùng
  ctx.fillText(maxX, toX(maxX), padTop + plotH + 18);

  // Vẽ các đường dóng thẳng đứng của 5 đại lượng
  const statsToDraw = [
    { val: res.mean, name: 'x̄', color: '#38bdf8', yOffset: 12 },
    { val: res.median, name: 'Me', color: '#4ade80', yOffset: 26 },
    { val: res.q1, name: 'Q1', color: '#facc15', yOffset: 40 },
    { val: res.q3, name: 'Q3', color: '#facc15', yOffset: 40 },
    { val: res.mode, name: 'Mo', color: '#fb7185', yOffset: 54 }
  ];

  statsToDraw.forEach(s => {
    const x = toX(s.val);
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2.5;
    ctx.setLineDash([5, 4]);
    ctx.beginPath();
    ctx.moveTo(x, padTop);
    ctx.lineTo(x, padTop + plotH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Huy hiệu nhãn trên đầu đường dóng
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(x, padTop + s.yOffset, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = s.color;
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${s.name}=${s.val.toFixed(1)}`, x, padTop + s.yOffset - 6);
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

// --- 5. PHÒNG THÍ NGHIỆM LAB 2: MÔ PHỎNG GEOGEBRA ĐƯỜNG GẤP KHÚC OGIVE ---
const ogiveData = [
  { a: 9.5, cum: 0 },
  { a: 12.5, cum: 3 },
  { a: 15.5, cum: 15 },
  { a: 18.5, cum: 30 },
  { a: 21.5, cum: 54 },
  { a: 24.5, cum: 56 }
];

function renderLab2() {
  const p = appState.lab2Percentile;
  const n = 56;
  const targetCum = (p / 100) * n;

  const label = document.getElementById('percentileLabel');
  if (label) {
    let tag = `${p}%`;
    if (p === 25) tag += ' (Tứ phân vị thứ nhất Q₁)';
    else if (p === 50) tag += ' (Trung vị Me = Q₂)';
    else if (p === 75) tag += ' (Tứ phân vị thứ ba Q₃)';
    label.textContent = tag;
  }

  // Tìm đoạn chứa targetCum để nội suy tuyến tính hoành độ x
  let interpX = ogiveData[0].a;
  for (let i = 0; i < ogiveData.length - 1; i++) {
    const p1 = ogiveData[i];
    const p2 = ogiveData[i + 1];
    if (targetCum >= p1.cum && targetCum <= p2.cum) {
      const frac = (targetCum - p1.cum) / (p2.cum - p1.cum);
      interpX = p1.a + frac * (p2.a - p1.a);
      break;
    }
  }

  const detailText = document.getElementById('ogiveDetailText');
  if (detailText) {
    detailText.innerHTML = `
      <strong>💡 Kết quả hình học từ đồ thị Ogive (GeoGebra SGK trang 68):</strong><br>
      Với mức phân vị <strong>${p}%</strong> (tương ứng với tần số tích luỹ $y = \\frac{${p}}{100} \\cdot 56 = ${targetCum.toFixed(2)}$), đường nằm ngang cắt đường gấp khúc tần số tích luỹ tại điểm có hoành độ <strong>$x \\approx ${interpX.toFixed(2)}$</strong>.<br>
      • Tại $25\\%: Q_1 \\approx 15.25$<br>
      • Tại $50\\%: Q_2 = M_e \\approx 18.10$<br>
      • Tại $75\\%: Q_3 \\approx 20.00$<br>
      Toàn bộ các giá trị hình học nội suy này hoàn toàn trùng khớp 100% với công thức đại số trong SGK!
    `;
    renderMathInTree(detailText);
  }

  drawOgiveCanvas(targetCum, interpX);
}

function drawOgiveCanvas(targetCum, interpX) {
  const canvas = document.getElementById('ogiveCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  ctx.clearRect(0, 0, w, h);

  const padLeft = 60;
  const padRight = 30;
  const padTop = 30;
  const padBottom = 50;

  const plotW = w - padLeft - padRight;
  const plotH = h - padTop - padBottom;

  const minX = 9.5;
  const maxX = 24.5;
  const maxCum = 60;

  const toX = x => padLeft + ((x - minX) / (maxX - minX)) * plotW;
  const toY = y => padTop + plotH - (y / maxCum) * plotH;

  // Lưới toạ độ
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.fillStyle = '#94a3b8';
  ctx.font = '12px Inter, sans-serif';
  ctx.textAlign = 'right';

  for (let c = 0; c <= maxCum; c += 10) {
    const y = toY(c);
    ctx.beginPath();
    ctx.moveTo(padLeft, y);
    ctx.lineTo(w - padRight, y);
    ctx.stroke();
    ctx.fillText(c, padLeft - 8, y + 4);
  }

  // Mốc trục hoành
  ogiveData.forEach(pt => {
    const x = toX(pt.a);
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pt.a, x, padTop + plotH + 18);
  });

  // Vẽ vùng diện tích dưới đường gấp khúc
  ctx.beginPath();
  ctx.moveTo(toX(ogiveData[0].a), toY(ogiveData[0].cum));
  ogiveData.forEach(pt => ctx.lineTo(toX(pt.a), toY(pt.cum)));
  ctx.lineTo(toX(ogiveData[ogiveData.length - 1].a), toY(0));
  ctx.closePath();
  const areaGrad = ctx.createLinearGradient(0, padTop, 0, padTop + plotH);
  areaGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
  areaGrad.addColorStop(1, 'rgba(99, 102, 241, 0.02)');
  ctx.fillStyle = areaGrad;
  ctx.fill();

  // Vẽ đường gấp khúc Ogive
  ctx.strokeStyle = '#06b6d4';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(toX(ogiveData[0].a), toY(ogiveData[0].cum));
  ogiveData.forEach(pt => ctx.lineTo(toX(pt.a), toY(pt.cum)));
  ctx.stroke();

  // Vẽ các điểm nút M1, M2...
  ogiveData.forEach((pt, i) => {
    const px = toX(pt.a);
    const py = toY(pt.cum);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(px, py, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#a5b4fc';
    ctx.font = 'bold 11px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`M${i + 1}(${pt.a}; ${pt.cum})`, px, py - 10);
  });

  // Đường dóng ngang và dọc của phân vị đang quét
  const curX = toX(interpX);
  const curY = toY(targetCum);

  ctx.strokeStyle = '#4ade80';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);

  // Ngang từ trục tung đến điểm cắt
  ctx.beginPath();
  ctx.moveTo(padLeft, curY);
  ctx.lineTo(curX, curY);
  ctx.stroke();

  // Dọc từ điểm cắt xuống trục hoành
  ctx.beginPath();
  ctx.moveTo(curX, curY);
  ctx.lineTo(curX, padTop + plotH);
  ctx.stroke();
  ctx.setLineDash([]);

  // Điểm giao cắt B
  ctx.fillStyle = '#4ade80';
  ctx.beginPath();
  ctx.arc(curX, curY, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(`B(${interpX.toFixed(2)}; ${targetCum.toFixed(1)})`, curX + 10, curY - 6);

  // Điểm dóng trên trục hoành
  ctx.fillStyle = '#facc15';
  ctx.font = 'bold 12px Inter, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`x ≈ ${interpX.toFixed(2)}`, curX, padTop + plotH + 34);

  // Trục toạ độ chính
  ctx.strokeStyle = '#818cf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(padLeft, padTop);
  ctx.lineTo(padLeft, padTop + plotH);
  ctx.lineTo(w - padRight, padTop + plotH);
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
      if (confirm('Bạn có chắc muốn làm mới toàn bộ tiến trình học tập của Bài 9?')) {
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

  // Lab 1 Preset change
  const selectPreset = document.getElementById('selectLab1Preset');
  if (selectPreset) {
    selectPreset.addEventListener('change', (e) => {
      sounds.playClick();
      appState.activeLab1Preset = e.target.value;
      renderLab1();
    });
  }

  // Lab 2 Slider Percentile
  const sliderPercentile = document.getElementById('sliderPercentile');
  if (sliderPercentile) {
    sliderPercentile.addEventListener('input', (e) => {
      appState.lab2Percentile = parseInt(e.target.value, 10);
      renderLab2();
    });
  }

  // Khởi chạy hệ thống
  renderQuiz();
  renderLab1();
  renderLab2();
  updateHUD();
});
