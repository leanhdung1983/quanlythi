// ================================================================
// HĐTN 5: HÀM SỐ BẬC NHẤT TRONG TÀI CHÍNH - TOÁN 8 KNTT
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
    if (/[\+\-\*/<>()\[\]\{},;:\!\?\|']/.test(ch)) {
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
  s = s.replace(/\\mathbf\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="bold">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\mathrm\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="normal">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\mathit\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mstyle mathvariant="italic">' + convertLatexToMathMLBody(c, placeholders) + '</mstyle>'));
  s = s.replace(/\\widehat\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>^</mo></mover>'));
  s = s.replace(/\\circ/g, savePlaceholder('<mo>&#176;</mo>'));
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\vec\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));

  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\d?frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
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
  if (!root) return;
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      strict: false
    });
  } else {
    // Fallback MathML
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.nodeValue && (n.nodeValue.includes('$') || n.nodeValue.includes('$$'))) {
        nodes.push(n);
      }
    }
    nodes.forEach(node => {
      const span = document.createElement('span');
      span.innerHTML = formatMathText(node.nodeValue);
      if (node.parentNode) node.parentNode.replaceChild(span, node);
    });
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
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) this.ctx = new AudioContextClass();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type = 'sine', duration = 0.15, vol = 0.1) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start();
    osc.stop(this.ctx.currentTime + duration);
  }
  playClick() { this.playTone(600, 'sine', 0.05, 0.08); }
  playCorrect() {
    this.playTone(523.25, 'triangle', 0.1, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.18, 0.12), 80);
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
  userTitle: 'Chuyên Gia Tài Chính Tuyến Tính 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_thuchanh5_state';

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {}
}

function loadState() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
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

// --- 3. ĐẤU TRƯỜNG SGK QUIZ DATA ---
const quizData = [
  {
    "id": 1,
    "title": "Câu 1: Phân biệt chi phí cố định và chi phí biến đổi",
    "pts": 20,
    "question": "Trong hàm chi phí $C(x) = 50\\,000 x + 10\\,000\\,000$, số $10\\,000\\,000$ thể hiện đại lượng nào?",
    "options": [
      {
        "text": "Chi phí cố định (định phí)",
        "correct": true
      },
      {
        "text": "Chi phí biến đổi trên 1 sản phẩm",
        "correct": false
      },
      {
        "text": "Tổng doanh thu",
        "correct": false
      },
      {
        "text": "Lợi nhuận ròng",
        "correct": false
      }
    ],
    "explanation": "Hằng số tự do trong hàm chi phí là chi phí cố định, phát sinh ngay cả khi số lượng sản phẩm bằng 0 ($x = 0$)."
  },
  {
    "id": 2,
    "title": "Câu 2: Công thức tính điểm hòa vốn",
    "pts": 20,
    "question": "Để tìm sản lượng hòa vốn, ta giải phương trình nào?",
    "options": [
      {
        "text": "Doanh thu = Chi phí ($R(x) = C(x)$)",
        "correct": true
      },
      {
        "text": "Doanh thu = 0",
        "correct": false
      },
      {
        "text": "Chi phí = 0",
        "correct": false
      },
      {
        "text": "Lợi nhuận = Chi phí",
        "correct": false
      }
    ],
    "explanation": "Hòa vốn là trạng thái không lãi cũng không lỗ, tức là Doanh thu vừa đủ bù đắp Tổng chi phí ($R(x) = C(x)$ hay $P(x) = 0$)."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính sản lượng hòa vốn cụ thể",
    "pts": 20,
    "question": "Một xưởng may áo có chi phí cố định là $12\\text{ triệu đồng/tháng}$. Chi phí vải may 1 chiếc áo là $60\\,000\\text{ đồng}$, giá bán mỗi chiếc áo là $100\\,000\\text{ đồng}$. Xưởng cần bán bao nhiêu chiếc áo để hòa vốn?",
    "options": [
      {
        "text": "$300\\text{ chiếc}$",
        "correct": true
      },
      {
        "text": "$200\\text{ chiếc}$",
        "correct": false
      },
      {
        "text": "$120\\text{ chiếc}$",
        "correct": false
      },
      {
        "text": "$400\\text{ chiếc}$",
        "correct": false
      }
    ],
    "explanation": "Lãi gộp trên 1 áo là $100\\,000 - 60\\,000 = 40\\,000\\text{ đ}$. Sản lượng hòa vốn: $x = \\frac{12\\,000\\,000}{40\\,000} = 300\\text{ chiếc áo}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Hàm cước viễn thông",
    "pts": 20,
    "question": "Một gói cước di động có phí thuê bao cố định $50\\,000\\text{ đồng/tháng}$ và $1\\,000\\text{ đồng}$ cho mỗi phút gọi. Hàm số biểu thị số tiền $y\\text{ (đồng)}$ phải trả khi gọi $x\\text{ phút}$ là:",
    "options": [
      {
        "text": "$y = 1\\,000x + 50\\,000$",
        "correct": true
      },
      {
        "text": "$y = 50\\,000x + 1\\,000$",
        "correct": false
      },
      {
        "text": "$y = 1\\,000x$",
        "correct": false
      },
      {
        "text": "$y = 51\\,000x$",
        "correct": false
      }
    ],
    "explanation": "Hàm cước gồm phí cố định $50\\,000$ cộng cước theo phút $1\\,000x$: $y = 1\\,000x + 50\\,000$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tính tiền cước taxi",
    "pts": 20,
    "question": "Một hãng taxi tính giá $14\\,000\\text{ đ}$ cho km đầu tiên và $11\\,000\\text{ đ}$ cho mỗi km tiếp theo. Khách hàng đi quãng đường $15\\text{ km}$ phải trả bao nhiêu tiền?",
    "options": [
      {
        "text": "$168\\,000\\text{ đồng}$",
        "correct": true
      },
      {
        "text": "$165\\,000\\text{ đồng}$",
        "correct": false
      },
      {
        "text": "$179\\,000\\text{ đồng}$",
        "correct": false
      },
      {
        "text": "$154\\,000\\text{ đồng}$",
        "correct": false
      }
    ],
    "explanation": "1 km đầu giá $14\\,000\\text{ đ}$. 14 km tiếp theo giá $14 \\times 11\\,000 = 154\\,000\\text{ đ}$. Tổng tiền: $14\\,000 + 154\\,000 = 168\\,000\\text{ đồng}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Doanh nghiệp đạt lợi nhuận mục tiêu",
    "pts": 20,
    "question": "Hàm lợi nhuận của một cơ sở là $P(x) = 50x - 200\\text{ (triệu đồng)}$. Để đạt lợi nhuận $100\\text{ triệu đồng}$, cơ sở cần bán bao nhiêu sản phẩm $x$?",
    "options": [
      {
        "text": "$6\\text{ sản phẩm}$",
        "correct": true
      },
      {
        "text": "$4\\text{ sản phẩm}$",
        "correct": false
      },
      {
        "text": "$2\\text{ sản phẩm}$",
        "correct": false
      },
      {
        "text": "$8\\text{ sản phẩm}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $50x - 200 = 100 \\iff 50x = 300 \\iff x = 6$."
  },
  {
    "id": 7,
    "title": "Câu 7: Ý nghĩa độ dốc của hàm doanh thu",
    "pts": 20,
    "question": "Hệ số góc của đường thẳng doanh thu $R(x) = p \\cdot x$ chính là:",
    "options": [
      {
        "text": "Đơn giá bán của một sản phẩm",
        "correct": true
      },
      {
        "text": "Chi phí cố định",
        "correct": false
      },
      {
        "text": "Lợi nhuận ròng",
        "correct": false
      },
      {
        "text": "Sản lượng hòa vốn",
        "correct": false
      }
    ],
    "explanation": "Hệ số gắn với biến số $x$ trong hàm doanh thu là đơn giá bán $p$ của một sản phẩm."
  },
  {
    "id": 8,
    "title": "Câu 8: So sánh hai phương án cước",
    "pts": 20,
    "question": "Gói A: Không phí cố định, $2\\,000\\text{ đ/phút}$. Gói B: Phí $40\\,000\\text{ đ/tháng}$ và $1\\,000\\text{ đ/phút}$. Với số phút gọi nào thì hai gói cước bằng tiền nhau?",
    "options": [
      {
        "text": "$40\\text{ phút}$",
        "correct": true
      },
      {
        "text": "$20\\text{ phút}$",
        "correct": false
      },
      {
        "text": "$30\\text{ phút}$",
        "correct": false
      },
      {
        "text": "$50\\text{ phút}$",
        "correct": false
      }
    ],
    "explanation": "Phương trình: $2\\,000x = 1\\,000x + 40\\,000 \\iff 1\\,000x = 40\\,000 \\iff x = 40\\text{ phút}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bán dưới điểm hòa vốn",
    "pts": 20,
    "question": "Nếu một doanh nghiệp sản xuất và bán ra số lượng sản phẩm $x$ nhỏ hơn sản lượng hòa vốn $x_0$, điều gì sẽ xảy ra?",
    "options": [
      {
        "text": "Doanh nghiệp bị lỗ ($P(x) < 0$)",
        "correct": true
      },
      {
        "text": "Doanh nghiệp có lãi ($P(x) > 0$)",
        "correct": false
      },
      {
        "text": "Doanh nghiệp đạt hòa vốn",
        "correct": false
      },
      {
        "text": "Doanh nghiệp phá sản ngay lập tức",
        "correct": false
      }
    ],
    "explanation": "Khi $x < x_0$, Doanh thu nhỏ hơn Chi phí nên lợi nhuận âm (bị lỗ)."
  },
  {
    "id": 10,
    "title": "Câu 10: Tối ưu giá bán",
    "pts": 20,
    "question": "Nếu chi phí sản xuất 1 sản phẩm là $40\\,000\\text{ đ}$, chi phí cố định là $10\\text{ triệu đ}$. Nếu muốn sản lượng hòa vốn giảm đi, doanh nghiệp nên làm gì?",
    "options": [
      {
        "text": "Tăng giá bán sản phẩm hoặc giảm chi phí cố định",
        "correct": true
      },
      {
        "text": "Giảm giá bán sản phẩm",
        "correct": false
      },
      {
        "text": "Tăng chi phí sản xuất mỗi sản phẩm",
        "correct": false
      },
      {
        "text": "Tăng chi phí cố định",
        "correct": false
      }
    ],
    "explanation": "Vì $x_0 = \\frac{b}{p - a}$, để giảm $x_0$ ta có thể giảm $b$ (cắt giảm chi phí cố định) hoặc tăng $p - a$ (tăng giá bán $p$ hoặc giảm biến phí $a$)."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let answeredCount = 0;

  quizData.forEach((q, qidx) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    if (q.question && (q.question.includes('<table') || q.question.includes('quiz-table') || q.question.length > 250)) {
      card.classList.add('full-width');
    }
    card.id = `qcard-${q.id}`;

    const isAnswered = appState.answered[String(q.id)] !== undefined;
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
        else if (appState.answered[String(q.id)] === oidx) optClass += ' wrong';
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
      const isCorrect = q.options[appState.answered[String(q.id)]].correct;
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
      const qid = this.getAttribute('data-qid');
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
    const q = quizData.find(item => String(item.id) === String(k));
    if (q && q.options[appState.answered[k]].correct) correctCount++;
  });

  if (progEl) progEl.textContent = `${answeredKeys.length}/10`;
  if (scoreEl) scoreEl.textContent = `${correctCount * 20} XP`;

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
  if (appState.answered[String(qid)] !== undefined) return;
  const q = quizData.find(item => String(item.id) === String(qid));
  if (!q) return;

  appState.answered[String(qid)] = oidx;
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

// --- 4. TABS & MODAL CONTROLLER ---
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const panes = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sound.playClick();
      const target = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      panes.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const pane = document.getElementById(`tab-${target}`);
      if (pane) pane.classList.add('active');

      // Tự động mở khóa Huy hiệu 1 & 2 khi chuyển tab
      if (target === 'theory') unlockBadge(0);
      if (target === 'labs') unlockBadge(1);

      // Kích hoạt render KaTeX nếu chuyển sang tab ẩn
      if (pane) renderMathInTree(pane);
    });
  });
}

function initAvatarModal() {
  const modal = document.getElementById('avatarModal');
  const avatarBtn = document.getElementById('avatarBtn');
  const closeBtn = document.getElementById('btnCloseModal');
  const choices = document.querySelectorAll('.avatar-choice');

  if (!modal || !avatarBtn) return;

  avatarBtn.addEventListener('click', () => {
    sound.playClick();
    modal.style.display = 'flex';
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      sound.playClick();
      modal.style.display = 'none';
    });
  }

  modal.addEventListener('click', e => {
    if (e.target === modal) modal.style.display = 'none';
  });

  choices.forEach(choice => {
    choice.addEventListener('click', () => {
      sound.playClick();
      const av = choice.getAttribute('data-avatar');
      const ti = choice.getAttribute('data-title');
      appState.avatar = av;
      appState.userTitle = ti;
      saveState();
      updateHUD();
      modal.style.display = 'none';
    });
  });
}

// --- 5. TIỆN ÍCH HEADER ---
function initHeaderActions() {
  const soundBtn = document.getElementById('soundToggle');
  const resetBtn = document.getElementById('resetProgress');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      sound.enabled = appState.sound;
      sound.playClick();
      saveState();
      updateHUD();
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc muốn đặt lại toàn bộ điểm và huy hiệu của bài này?')) {
        localStorage.removeItem(STORAGE_KEY);
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        saveState();
        updateHUD();
        renderQuiz();
      }
    });
  }
}

// --- 6. PHÒNG THÍ NGHIỆM TƯƠNG TÁC (LAB 1 & LAB 2) ---
function initLabs() {
  // Khởi tạo Lab 1
  try {
    
                const canvas = document.getElementById('labCanvas1');
                const ctx = canvas.getContext('2d');
                const slider = document.getElementById('sliderKm');
                const valKm = document.getElementById('valKm');
                const outEl = document.getElementById('lab1OutputTH5');

                function update() {
                    const x = parseInt(slider.value);
                    valKm.textContent = x;

                    const total = 15000 + (x - 1) * 12000;
                    outEl.innerHTML = `<strong>Công thức cước:</strong> $y = 15\\,000 + 12\\,000(x - 1) = 12\\,000x + 3\\,000\\text{ (đồng)}$ <br>Đi $x = ${x}\\text{ km} \\implies$ <strong>Tiền cước phải trả:</strong> <strong style="color:#34d399; font-size:1.15rem;">${total.toLocaleString('vi-VN')} VNĐ</strong>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const ox = 60, oy = h - 40;
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(w - 20, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, 20); ctx.stroke();

                    // Đồ thị y = 12000x + 3000
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ox, oy - 15);
                    ctx.lineTo(w - 40, 30);
                    ctx.stroke();

                    // Điểm hiện tại
                    const curX = ox + (x / 30) * (w - 100);
                    const curY = oy - 15 - (x / 30) * (oy - 45);
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath(); ctx.arc(curX, curY, 6, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Segoe UI';
                    ctx.fillText(`${x} km`, curX - 10, oy + 20);
                }

                slider.addEventListener('input', update);
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const inB = document.getElementById('inFixedB');
                const inP = document.getElementById('inPriceP');
                const outEl = document.getElementById('lab2OutputTH5');

                function calc() {
                    const b = (parseFloat(inB.value) || 20) * 1000000;
                    const p = (parseFloat(inP.value) || 100) * 1000;
                    const a = 60000; // 60.000 đ/sp

                    const profitPerUnit = p - a;
                    let bep = 0;
                    if (profitPerUnit > 0) {
                        bep = Math.ceil(b / profitPerUnit);
                    }

                    outEl.innerHTML = `<strong>Lãi gộp trên 1 sản phẩm:</strong> $p - a = ${profitPerUnit.toLocaleString('vi-VN')}\\text{ đ/sp}$ <br><strong>Sản lượng hòa vốn:</strong> <strong style="color:#34d399; font-size:1.2rem;">$x_0 = \\frac{b}{p - a} = ${bep.toLocaleString('vi-VN')}\\text{ sản phẩm}$</strong> (Bán trên mức này sẽ bắt đầu có lãi!)`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const ox = 50, oy = h - 35;
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(w - 20, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, 20); ctx.stroke();

                    // Đường Chi phí (đỏ)
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath(); ctx.moveTo(ox, oy - 40); ctx.lineTo(w - 30, 45); ctx.stroke();

                    // Đường Doanh thu (xanh)
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(w - 30, 20); ctx.stroke();

                    // Điểm cắt hòa vốn
                    const interX = ox + 180, interY = oy - 80;
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath(); ctx.arc(interX, interY, 7, 0, Math.PI * 2); ctx.fill();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Segoe UI';
                    ctx.fillText(`Điểm hòa vốn: ${bep} sp`, interX + 10, interY - 5);
                }

                [inB, inP].forEach(el => el.addEventListener('input', calc));
                calc();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 2:', e); }
}

// --- 7. KHỞI CHẠY DOMCONTENTLOADED ---
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  sound.enabled = appState.sound;
  updateHUD();
  initTabs();
  initAvatarModal();
  initHeaderActions();
  renderQuiz();
  initLabs();
});
