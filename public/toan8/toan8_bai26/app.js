// ================================================================
// BÀI 26: GIẢI BÀI TOÁN BẰNG CÁCH LẬP PHƯƠNG TRÌNH - TOÁN 8 KNTT
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
  userTitle: 'Nhà Mô Hình Hóa Toán Học 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai26_state';

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
    "title": "Câu 1: Bài toán vừa gà vừa chó",
    "pts": 20,
    "question": "Gọi $x$ là số con gà ($x \\in \\mathbb{N}^*, x < 36$). Biết tổng số gà và chó là $36$ con, tổng số chân là $100$ chân. Phương trình nào biểu thị bài toán?",
    "options": [
      {
        "text": "$2x + 4(36 - x) = 100$",
        "correct": true
      },
      {
        "text": "$4x + 2(36 - x) = 100$",
        "correct": false
      },
      {
        "text": "$2x + 4x = 100$",
        "correct": false
      },
      {
        "text": "$x + (36 - x) = 100$",
        "correct": false
      }
    ],
    "explanation": "Mỗi con gà có 2 chân, mỗi con chó có 4 chân. Số chó là $36 - x$. Tổng số chân là $2x + 4(36 - x) = 100$."
  },
  {
    "id": 2,
    "title": "Câu 2: Bài toán chuyển động ngược chiều",
    "pts": 20,
    "question": "Hai người đi xe máy khởi hành cùng lúc từ hai địa điểm A và B cách nhau $90\\text{ km}$, đi ngược chiều và gặp nhau sau $1{,}5\\text{ giờ}$. Biết vận tốc xe đi từ A lớn hơn vận tốc xe đi từ B là $10\\text{ km/h}$. Vận tốc xe đi từ A là:",
    "options": [
      {
        "text": "$35\\text{ km/h}$",
        "correct": true
      },
      {
        "text": "$25\\text{ km/h}$",
        "correct": false
      },
      {
        "text": "$40\\text{ km/h}$",
        "correct": false
      },
      {
        "text": "$30\\text{ km/h}$",
        "correct": false
      }
    ],
    "explanation": "Gọi vận tốc xe A là $v$ thì xe B là $v - 10$. Ta có phương trình: $1{,}5 v + 1{,}5(v - 10) = 90 \\iff 3v - 15 = 90 \\iff 3v = 105 \\iff v = 35\\text{ km/h}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Bài toán tìm hai số tự nhiên",
    "pts": 20,
    "question": "Tổng của hai số là $65$. Số lớn gấp đôi số bé cộng thêm $5$. Số lớn là:",
    "options": [
      {
        "text": "$45$",
        "correct": true
      },
      {
        "text": "$20$",
        "correct": false
      },
      {
        "text": "$40$",
        "correct": false
      },
      {
        "text": "$50$",
        "correct": false
      }
    ],
    "explanation": "Gọi số bé là $x$ thì số lớn là $65 - x$. Phương trình: $65 - x = 2x + 5 \\iff 3x = 60 \\iff x = 20$. Vậy số lớn là $65 - 20 = 45$."
  },
  {
    "id": 4,
    "title": "Câu 4: Bài toán hình chữ nhật",
    "pts": 20,
    "question": "Một khu vườn hình chữ nhật có chu vi là $56\\text{ m}$. Chiều dài hơn chiều rộng $4\\text{ m}$. Diện tích khu vườn là:",
    "options": [
      {
        "text": "$192\\text{ m}^2$",
        "correct": true
      },
      {
        "text": "$160\\text{ m}^2$",
        "correct": false
      },
      {
        "text": "$200\\text{ m}^2$",
        "correct": false
      },
      {
        "text": "$180\\text{ m}^2$",
        "correct": false
      }
    ],
    "explanation": "Nửa chu vi là $56 : 2 = 28\\text{ m}$. Chiều rộng $x$, chiều dài $x + 4$. Phương trình: $x + (x + 4) = 28 \\iff 2x = 24 \\iff x = 12\\text{ m}$. Chiều dài là $16\\text{ m}$. Diện tích $S = 12 \\times 16 = 192\\text{ m}^2$."
  },
  {
    "id": 5,
    "title": "Câu 5: Bài toán năng suất làm đường",
    "pts": 20,
    "question": "Một đội công nhân dự định trải nhựa một đoạn đường trong $20\\text{ ngày}$. Nhờ tăng năng suất thêm $5\\text{ m/ngày}$, đội đã hoàn thành sau $16\\text{ ngày}$. Chiều dài đoạn đường là:",
    "options": [
      {
        "text": "$400\\text{ m}$",
        "correct": true
      },
      {
        "text": "$360\\text{ m}$",
        "correct": false
      },
      {
        "text": "$500\\text{ m}$",
        "correct": false
      },
      {
        "text": "$320\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Gọi năng suất dự định là $x\\text{ (m/ngày)}$. Chiều dài đoạn đường là $20x = 16(x + 5) \\iff 20x = 16x + 80 \\iff 4x = 80 \\iff x = 20\\text{ m/ngày}$. Chiều dài là $20 \\times 20 = 400\\text{ m}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Bài toán tuổi tác",
    "pts": 20,
    "question": "Năm nay tuổi của bố gấp $3$ lần tuổi của con. Sau $12\\text{ năm}$ nữa, tuổi của bố chỉ còn gấp $2$ lần tuổi của con. Tuổi của con hiện nay là:",
    "options": [
      {
        "text": "$12\\text{ tuổi}$",
        "correct": true
      },
      {
        "text": "$10\\text{ tuổi}$",
        "correct": false
      },
      {
        "text": "$14\\text{ tuổi}$",
        "correct": false
      },
      {
        "text": "$15\\text{ tuổi}$",
        "correct": false
      }
    ],
    "explanation": "Gọi tuổi con hiện nay là $x$. Tuổi bố hiện nay là $3x$. Sau 12 năm: tuổi con là $x + 12$, tuổi bố là $3x + 12$. Phương trình: $3x + 12 = 2(x + 12) \\iff 3x + 12 = 2x + 24 \\iff x = 12$."
  },
  {
    "id": 7,
    "title": "Câu 7: Bài toán ca nô xuôi và ngược dòng",
    "pts": 20,
    "question": "Một ca nô xuôi dòng từ A đến B hết $3\\text{ giờ}$ và ngược dòng từ B về A hết $4\\text{ giờ}$. Biết vận tốc dòng nước là $2\\text{ km/h}$. Quãng đường AB dài:",
    "options": [
      {
        "text": "$48\\text{ km}$",
        "correct": true
      },
      {
        "text": "$42\\text{ km}$",
        "correct": false
      },
      {
        "text": "$36\\text{ km}$",
        "correct": false
      },
      {
        "text": "$54\\text{ km}$",
        "correct": false
      }
    ],
    "explanation": "Gọi vận tốc riêng của ca nô là $v\\text{ (km/h)}$. Quãng đường $AB = 3(v + 2) = 4(v - 2) \\iff 3v + 6 = 4v - 8 \\iff v = 14\\text{ km/h}$. Vậy $AB = 3(14 + 2) = 48\\text{ km}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Chọn ẩn và điều kiện đúng",
    "pts": 20,
    "question": "Khi giải bài toán: 'Tìm số học sinh của một lớp biết nếu chia thành các nhóm 4 người thì thừa 2 người...', điều kiện nào cho ẩn số học sinh $x$ là hợp lý nhất?",
    "options": [
      {
        "text": "$x \\in \\mathbb{N}^*, x > 2$",
        "correct": true
      },
      {
        "text": "$x \\in \\mathbb{R}$",
        "correct": false
      },
      {
        "text": "$x > 0$",
        "correct": false
      },
      {
        "text": "$x \\le 0$",
        "correct": false
      }
    ],
    "explanation": "Số học sinh phải là số nguyên dương ($x \\in \\mathbb{N}^*$) và vì chia nhóm 4 người thừa 2 người nên số học sinh phải lớn hơn 2."
  },
  {
    "id": 9,
    "title": "Câu 9: Bài toán tỉ lệ phần trăm giá bán",
    "pts": 20,
    "question": "Một chiếc áo được giảm giá $20\\%$ so với giá niêm yết, người mua phải trả $240\\,000\\text{ đồng}$. Giá niêm yết ban đầu của chiếc áo là:",
    "options": [
      {
        "text": "$300\\,000\\text{ đồng}$",
        "correct": true
      },
      {
        "text": "$288\\,000\\text{ đồng}$",
        "correct": false
      },
      {
        "text": "$320\\,000\\text{ đồng}$",
        "correct": false
      },
      {
        "text": "$260\\,000\\text{ đồng}$",
        "correct": false
      }
    ],
    "explanation": "Gọi giá niêm yết là $x\\text{ (đồng)}$. Sau khi giảm $20\\%$, giá bán bằng $80\\% x = 0{,}8 x$. Ta có $0{,}8 x = 240\\,000 \\iff x = 240\\,000 : 0{,}8 = 300\\,000\\text{ đồng}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Bài toán dung dịch nồng độ",
    "pts": 20,
    "question": "Cần thêm bao nhiêu gam nước cất vào $200\\text{ g}$ dung dịch muối nồng độ $10\\%$ để thu được dung dịch mới có nồng độ $4\\%$?",
    "options": [
      {
        "text": "$300\\text{ g}$",
        "correct": true
      },
      {
        "text": "$250\\text{ g}$",
        "correct": false
      },
      {
        "text": "$200\\text{ g}$",
        "correct": false
      },
      {
        "text": "$150\\text{ g}$",
        "correct": false
      }
    ],
    "explanation": "Lượng muối nguyên chất ban đầu là $200 \\times 10\\% = 20\\text{ g}$. Gọi lượng nước thêm vào là $x\\text{ (g)}$. Dung dịch mới có khối lượng $200 + x$. Phương trình: $\\frac{20}{200 + x} = 4\\% = 0{,}04 \\iff 200 + x = 500 \\iff x = 300\\text{ g}$."
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
                const sV1 = document.getElementById('sliderV1');
                const sV2 = document.getElementById('sliderV2');
                const valV1 = document.getElementById('valV1');
                const valV2 = document.getElementById('valV2');
                const outEl = document.getElementById('lab1Output26');

                function update() {
                    const v1 = parseInt(sV1.value);
                    const v2 = parseInt(sV2.value);
                    valV1.textContent = v1;
                    valV2.textContent = v2;

                    const totalV = v1 + v2;
                    const time = 120 / totalV;
                    const s1 = (v1 * time).toFixed(1);
                    const s2 = (v2 * time).toFixed(1);
                    const timeH = time.toFixed(2);

                    outEl.innerHTML = `<strong>Phương trình quãng đường:</strong> $${v1}t + ${v2}t = 120 \\iff ${totalV}t = 120$ <br><strong>Thời gian gặp nhau:</strong> $t = ${timeH}\\text{ giờ}$ &nbsp;|&nbsp; <strong>Vị trí gặp cách A:</strong> $S_1 = ${s1}\\text{ km}$ &nbsp;|&nbsp; <strong>Cách B:</strong> $S_2 = ${s2}\\text{ km}$`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Đường nối A - B
                    const yRoad = 110;
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(60, yRoad); ctx.lineTo(w - 60, yRoad);
                    ctx.stroke();

                    // Điểm A và B
                    ctx.fillStyle = '#38bdf8';
                    ctx.beginPath(); ctx.arc(60, yRoad, 8, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#f59e0b';
                    ctx.beginPath(); ctx.arc(w - 60, yRoad, 8, 0, Math.PI * 2); ctx.fill();

                    ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText('A (0 km)', 60, yRoad + 28);
                    ctx.fillText('B (120 km)', w - 60, yRoad + 28);

                    // Điểm gặp nhau
                    const meetRatio = parseFloat(s1) / 120;
                    const meetX = 60 + meetRatio * (w - 120);

                    ctx.fillStyle = '#10b981';
                    ctx.beginPath(); ctx.arc(meetX, yRoad, 10, 0, Math.PI * 2); ctx.fill();
                    ctx.fillText(`Điểm gặp (${s1} km)`, meetX, yRoad - 20);

                    // Mũi tên xe A
                    ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(60, yRoad - 10); ctx.lineTo(meetX - 5, yRoad - 10); ctx.stroke();

                    // Mũi tên xe B
                    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(w - 60, yRoad - 10); ctx.lineTo(meetX + 5, yRoad - 10); ctx.stroke();
                }

                [sV1, sV2].forEach(el => el.addEventListener('input', update));
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const slider = document.getElementById('sliderGa');
                const valGa = document.getElementById('valGa');
                const outEl = document.getElementById('lab2Output26');

                function draw() {
                    const ga = parseInt(slider.value);
                    valGa.textContent = ga;
                    const cho = 36 - ga;
                    const chan = 2 * ga + 4 * cho;
                    const isCorrect = (chan === 100);

                    outEl.innerHTML = `<strong>Số gà:</strong> $${ga}$ con &nbsp;|&nbsp; <strong>Số chó:</strong> $36 - ${ga} = ${cho}$ con <br><strong>Tổng số chân:</strong> $2(${ga}) + 4(${cho}) = ${chan}$ chân &nbsp;${isCorrect ? '🎉 <strong style="color:#34d399;">CHÍNH XÁC (100 chân chẵn)! Nghiệm x = 22 gà, 14 chó</strong>' : '⚠️ <span style="color:#f87171;">Chưa bằng 100 chân</span>'}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Vẽ cột số lượng gà và chó
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(80, h - 30 - ga * 3, 80, ga * 3);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(`Gà: ${ga}`, 120, h - 40 - ga * 3);

                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(220, h - 30 - cho * 3, 80, cho * 3);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(`Chó: ${cho}`, 260, h - 40 - cho * 3);

                    // Cột tổng số chân so với mục tiêu 100
                    ctx.fillStyle = isCorrect ? '#10b981' : '#6366f1';
                    ctx.fillRect(380, h - 30 - (chan / 100) * 120, 80, (chan / 100) * 120);
                    ctx.fillStyle = isCorrect ? '#34d399' : '#ffffff';
                    ctx.fillText(`${chan} chân`, 420, h - 40 - (chan / 100) * 120);

                    // Đường mục tiêu 100 chân
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(350, h - 150); ctx.lineTo(490, h - 150);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#ef4444';
                    ctx.font = '12px Segoe UI';
                    ctx.fillText('Mục tiêu: 100 chân', 420, h - 155);
                }

                slider.addEventListener('input', draw);
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
