// ================================================================
// HĐTN 6: ĐO CHIỀU CAO & KHOẢNG CÁCH THỰC TẾ - TOÁN 8 KNTT
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
  userTitle: 'Kỹ Sư Trắc Địa Hình Học 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_thuchanh6_state';

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
    "title": "Câu 1: Đo chiều cao bằng bóng nắng",
    "pts": 20,
    "question": "Một người cao $1{,}7\\text{ m}$ có bóng dài $0{,}85\\text{ m}$. Cùng thời điểm đó, bóng của một tòa nhà dài $20\\text{ m}$. Chiều cao tòa nhà là:",
    "options": [
      {
        "text": "$40\\text{ m}$",
        "correct": true
      },
      {
        "text": "$34\\text{ m}$",
        "correct": false
      },
      {
        "text": "$20\\text{ m}$",
        "correct": false
      },
      {
        "text": "$10\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Tỉ số: $\\frac{H}{1{,}7} = \\frac{20}{0{,}85} = 2 \\times 20 = 40\\text{ m}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Đo chiều cao bằng gương phẳng",
    "pts": 20,
    "question": "Đặt gương phẳng tại điểm $M$. Người đứng tại $B'$ cách gương $1{,}5\\text{ m}$, mắt cách mặt đất $1{,}6\\text{ m}$. Chân tháp cách gương $15\\text{ m}$. Chiều cao tháp là:",
    "options": [
      {
        "text": "$16\\text{ m}$",
        "correct": true
      },
      {
        "text": "$15\\text{ m}$",
        "correct": false
      },
      {
        "text": "$24\\text{ m}$",
        "correct": false
      },
      {
        "text": "$14\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Đồng dạng: $\\frac{H}{1{,}6} = \\frac{15}{1{,}5} = 10 \\implies H = 1{,}6 \\times 10 = 16\\text{ m}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Nguyên lý đo bằng gương phẳng",
    "pts": 20,
    "question": "Phương pháp đo chiều cao bằng gương phẳng dựa trên định luật vật lý nào?",
    "options": [
      {
        "text": "Định luật phản xạ ánh sáng (góc tới bằng góc phản xạ)",
        "correct": true
      },
      {
        "text": "Định luật khúc xạ ánh sáng",
        "correct": false
      },
      {
        "text": "Định luật truyền thẳng ánh sáng",
        "correct": false
      },
      {
        "text": "Định luật bảo toàn năng lượng",
        "correct": false
      }
    ],
    "explanation": "Định luật phản xạ ánh sáng đảm bảo góc tới bằng góc phản xạ, tạo nên hai góc bằng nhau của hai tam giác vuông."
  },
  {
    "id": 4,
    "title": "Câu 4: Bề rộng khúc sông",
    "pts": 20,
    "question": "Trong phương pháp đo khúc sông, người ta thiết lập $\\triangle ABE \\backsim \\triangle CDE$ với $E$ là trung điểm $AC$. Nếu đo được $CD = 38\\text{ m}$ thì bề rộng khúc sông $AB$ là:",
    "options": [
      {
        "text": "$38\\text{ m}$",
        "correct": true
      },
      {
        "text": "$19\\text{ m}$",
        "correct": false
      },
      {
        "text": "$76\\text{ m}$",
        "correct": false
      },
      {
        "text": "$57\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Vì $E$ là trung điểm nên $\\frac{AE}{CE} = 1 \\implies AB = CD = 38\\text{ m}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Đo khoảng cách giữa hai hòn đảo",
    "pts": 20,
    "question": "Để đo khoảng cách giữa hai điểm A và B ngoài biển, người ta dựng hai tam giác đồng dạng trên bờ với tỉ số $\\frac{1}{100}$. Nếu đo được đoạn tương ứng trên bờ là $15\\text{ m}$, khoảng cách AB ngoài biển là:",
    "options": [
      {
        "text": "$1\\,500\\text{ m}$",
        "correct": true
      },
      {
        "text": "$150\\text{ m}$",
        "correct": false
      },
      {
        "text": "$15\\text{ km}$",
        "correct": false
      },
      {
        "text": "$3\\,000\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "$AB = 15 \\times 100 = 1\\,500\\text{ m} = 1{,}5\\text{ km}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Giác kế là dụng cụ để làm gì",
    "pts": 20,
    "question": "Giác kế trong thực hành hình học là dụng cụ dùng để:",
    "options": [
      {
        "text": "Đo góc trên mặt đất",
        "correct": true
      },
      {
        "text": "Đo độ dài đoạn thẳng",
        "correct": false
      },
      {
        "text": "Đo diện tích",
        "correct": false
      },
      {
        "text": "Đo thể tích",
        "correct": false
      }
    ],
    "explanation": "Giác kế là dụng cụ quang học / cơ học chuyên dụng để ngắm và đo góc nằm ngang hoặc góc thẳng đứng trên mặt đất."
  },
  {
    "id": 7,
    "title": "Câu 7: Dây dọi trong xây dựng",
    "pts": 20,
    "question": "Dây dọi được thợ xây sử dụng dựa trên nguyên lý nào?",
    "options": [
      {
        "text": "Xác định phương thẳng đứng vuông góc với mặt đất nằm ngang",
        "correct": true
      },
      {
        "text": "Đo độ dài đoạn thẳng",
        "correct": false
      },
      {
        "text": "Xác định góc 45 độ",
        "correct": false
      },
      {
        "text": "Kiểm tra độ nhẵn của tường",
        "correct": false
      }
    ],
    "explanation": "Trọng lực kéo quả dọi theo phương thẳng đứng tuyệt đối, vuông góc với mặt nước phẳng lặng."
  },
  {
    "id": 8,
    "title": "Câu 8: Áp dụng Pythagore đo chiều dài cáp treo",
    "pts": 20,
    "question": "Ga cáp treo dưới chân núi cách chân núi $600\\text{ m}$, ga trên đỉnh núi cao $800\\text{ m}$ so với chân núi. Chiều dài tuyến cáp treo nối thẳng giữa hai ga là:",
    "options": [
      {
        "text": "$1\\,000\\text{ m}$",
        "correct": true
      },
      {
        "text": "$1\\,400\\text{ m}$",
        "correct": false
      },
      {
        "text": "$200\\text{ m}$",
        "correct": false
      },
      {
        "text": "$1\\,200\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Tuyến cáp là cạnh huyền của tam giác vuông: $L = \\sqrt{600^2 + 800^2} = \\sqrt{360000 + 640000} = 1000\\text{ m}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Ưu điểm của phép đo gián tiếp",
    "pts": 20,
    "question": "Ưu điểm lớn nhất của phép đo đạc gián tiếp bằng hình học là:",
    "options": [
      {
        "text": "Đo được các khoảng cách và chiều cao mà con người không thể tiếp cận trực tiếp",
        "correct": true
      },
      {
        "text": "Không cần sử dụng bất kỳ công thức toán học nào",
        "correct": false
      },
      {
        "text": "Đảm bảo độ chính xác tuyệt đối không có bất kì sai số nào",
        "correct": false
      },
      {
        "text": "Chỉ dùng cho các vật thể nhỏ",
        "correct": false
      }
    ],
    "explanation": "Đo gián tiếp cho phép tính toán khoảng cách qua sông sâu, vực thẳm hoặc độ cao đỉnh núi cao mà không cần trực tiếp trèo tới."
  },
  {
    "id": 10,
    "title": "Câu 10: Đo chiều cao bằng giác kế góc nâng",
    "pts": 20,
    "question": "Đặt giác kế cách chân tháp $30\\text{ m}$, chiều cao giác kế là $1{,}2\\text{ m}$. Góc ngắm lên đỉnh tháp là $45^\\circ$. Chiều cao tháp là:",
    "options": [
      {
        "text": "$31{,}2\\text{ m}$",
        "correct": true
      },
      {
        "text": "$30\\text{ m}$",
        "correct": false
      },
      {
        "text": "$45\\text{ m}$",
        "correct": false
      },
      {
        "text": "$28{,}8\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Tam giác vuông có góc $45^\\circ$ là tam giác vuông cân $\\implies$ đoạn thẳng từ tầm mắt đến đỉnh tháp bằng khoảng cách $30\\text{ m}$. Chiều cao tháp: $30 + 1{,}2 = 31{,}2\\text{ m}$."
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
                const slider = document.getElementById('sliderDistG');
                const valDist = document.getElementById('valDistG');
                const outEl = document.getElementById('lab1OutputTH6');

                function update() {
                    const x = parseInt(slider.value);
                    valDist.textContent = x;

                    const hPerson = 1.6;
                    const dPerson = 2.0;
                    const H = (hPerson * x / dPerson).toFixed(2);

                    outEl.innerHTML = `<strong>Tỉ số đồng dạng:</strong> $\\frac{H}{1{,}6} = \\frac{${x}}{2{,}0} \\implies$ <strong>Chiều cao của cây:</strong> <strong style="color:#34d399; font-size:1.15rem;">$H = 1{,}6 \\cdot \\frac{${x}}{2{,}0} = ${H}\\text{ m}$</strong>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const groundY = h - 35;
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(20, groundY); ctx.lineTo(w - 20, groundY); ctx.stroke();

                    // Vị trí gương
                    const mirrorX = 220;
                    ctx.fillStyle = '#38bdf8';
                    ctx.fillRect(mirrorX - 10, groundY - 3, 20, 6);
                    ctx.fillStyle = '#38bdf8';
                    ctx.font = 'bold 12px Segoe UI';
                    ctx.fillText('Gương', mirrorX - 18, groundY + 16);

                    // Người quan sát
                    const personX = mirrorX - 100;
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(personX, groundY); ctx.lineTo(personX, groundY - 60); ctx.stroke();
                    ctx.fillText('Mắt (1.6m)', personX - 30, groundY - 65);

                    // Cây
                    const treeX = mirrorX + x * 15;
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.moveTo(treeX, groundY); ctx.lineTo(treeX, groundY - parseFloat(H) * 12); ctx.stroke();
                    ctx.fillStyle = '#10b981';
                    ctx.fillText(`Cây (${H}m)`, treeX - 25, groundY - parseFloat(H) * 12 - 10);

                    // Tia sáng phản xạ
                    ctx.strokeStyle = '#f43f5e';
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.moveTo(treeX, groundY - parseFloat(H) * 12);
                    ctx.lineTo(mirrorX, groundY);
                    ctx.lineTo(personX, groundY - 60);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }

                slider.addEventListener('input', update);
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const inCD = document.getElementById('inCD');
                const outEl = document.getElementById('lab2OutputTH6');

                function draw() {
                    const cd = parseFloat(inCD.value) || 25;
                    outEl.innerHTML = `Vì $E$ là trung điểm $AC$ nên $\triangle ABE = \triangle CDE$ (g-c-g) $\\implies$ <strong>Bề rộng khúc sông:</strong> <strong style="color:#34d399; font-size:1.15rem;">$AB = CD = ${cd}\\text{ m}$</strong> (Đo trực tiếp trên đất liền!)`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Sông (màu lam)
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
                    ctx.fillRect(60, 20, 160, h - 40);
                    ctx.fillStyle = '#38bdf8';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText('DÒNG SÔNG', 95, h / 2);

                    // Điểm B bờ bên kia
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath(); ctx.arc(70, h / 2, 6, 0, Math.PI * 2); ctx.fill();
                    ctx.fillText('B (Cây bờ kia)', 40, h / 2 - 12);

                    // Điểm A bờ bên này
                    ctx.fillStyle = '#10b981';
                    ctx.beginPath(); ctx.arc(220, h / 2, 6, 0, Math.PI * 2); ctx.fill();
                    ctx.fillText('A', 225, h / 2 - 10);
                }

                inCD.addEventListener('input', draw);
                draw();
            
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
