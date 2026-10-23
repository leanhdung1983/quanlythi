// ================================================================
// BÀI 32: XÁC SUẤT THỰC NGHIỆM VÀ ỨNG DỤNG - TOÁN 8 KNTT
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
  userTitle: 'Nhà Khoa Học Dữ Liệu & Thực Nghiệm 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai32_state';

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
    "title": "Câu 1: Khái niệm xác suất thực nghiệm",
    "pts": 20,
    "question": "Gieo một con xúc xắc $50\\text{ lần}$ thấy mặt 6 chấm xuất hiện $8\\text{ lần}$. Xác suất thực nghiệm của biến cố xuất hiện mặt 6 chấm là:",
    "options": [
      {
        "text": "$\\frac{8}{50} = 0{,}16$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{6}$",
        "correct": false
      },
      {
        "text": "$\\frac{8}{6} = 1{,}33$",
        "correct": false
      },
      {
        "text": "$\\frac{50}{8} = 6{,}25$",
        "correct": false
      }
    ],
    "explanation": "Xác suất thực nghiệm bằng số lần xuất hiện biến cố ($m = 8$) chia cho tổng số lần thử nghiệm ($N = 50$): $\\frac{8}{50} = 0{,}16$."
  },
  {
    "id": 2,
    "title": "Câu 2: Quy luật số lớn",
    "pts": 20,
    "question": "Khi số lần thực nghiệm ngày càng lớn, xác suất thực nghiệm của biến cố sẽ:",
    "options": [
      {
        "text": "Ngày càng tiến gần đến xác suất lý thuyết",
        "correct": true
      },
      {
        "text": "Luôn luôn bằng chính xác xác suất lý thuyết",
        "correct": false
      },
      {
        "text": "Tiến dần về số 0",
        "correct": false
      },
      {
        "text": "Dao động hỗn loạn không có quy luật",
        "correct": false
      }
    ],
    "explanation": "Theo định luật số lớn trong lý thuyết xác suất, khi số phép thử đủ lớn, xác suất thực nghiệm sẽ dao động quanh và tiến dần về xác suất lý thuyết."
  },
  {
    "id": 3,
    "title": "Câu 3: Ước lượng số sản phẩm lỗi",
    "pts": 20,
    "question": "Kiểm tra ngẫu nhiên $500\\text{ sản phẩm}$ của một nhà máy thấy có $15\\text{ sản phẩm}$ bị lỗi. Nếu nhà máy sản xuất $10\\,000\\text{ sản phẩm}$, ước lượng số sản phẩm lỗi là khoảng bao nhiêu?",
    "options": [
      {
        "text": "$300\\text{ sản phẩm}$",
        "correct": true
      },
      {
        "text": "$150\\text{ sản phẩm}$",
        "correct": false
      },
      {
        "text": "$200\\text{ sản phẩm}$",
        "correct": false
      },
      {
        "text": "$450\\text{ sản phẩm}$",
        "correct": false
      }
    ],
    "explanation": "Xác suất thực nghiệm lỗi là $\\frac{15}{500} = 0{,}03 = 3\\%$. Với 10.000 sản phẩm, số lỗi ước lượng là $10\\,000 \\times 0{,}03 = 300\\text{ sản phẩm}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Ước lượng cá thể bằng phương pháp đánh dấu",
    "pts": 20,
    "question": "Một kiểm lâm bắt $40\\text{ con hươu}$ trong rừng, đeo thẻ đánh dấu rồi thả lại. Sau một tháng, kiểm lâm bắt ngẫu nhiên $50\\text{ con hươu}$ thì thấy có $8\\text{ con}$ có thẻ. Số lượng hươu trong khu rừng ước lượng khoảng:",
    "options": [
      {
        "text": "$250\\text{ con}$",
        "correct": true
      },
      {
        "text": "$200\\text{ con}$",
        "correct": false
      },
      {
        "text": "$300\\text{ con}$",
        "correct": false
      },
      {
        "text": "$160\\text{ con}$",
        "correct": false
      }
    ],
    "explanation": "Áp dụng công thức Mark-Recapture: $N \\approx \\frac{M \\cdot n}{m} = \\frac{40 \\times 50}{8} = \\frac{2000}{8} = 250\\text{ con}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tỉ lệ nảy mầm của hạt giống",
    "pts": 20,
    "question": "Gieo $200\\text{ hạt giống}$ ngô thấy có $184\\text{ hạt}$ nảy mầm. Xác suất thực nghiệm hạt ngô nảy mầm là:",
    "options": [
      {
        "text": "$92\\%$",
        "correct": true
      },
      {
        "text": "$84\\%$",
        "correct": false
      },
      {
        "text": "$90\\%$",
        "correct": false
      },
      {
        "text": "$95\\%$",
        "correct": false
      }
    ],
    "explanation": "Xác suất thực nghiệm là $\\frac{184}{200} = \\frac{92}{100} = 92\\%$."
  },
  {
    "id": 6,
    "title": "Câu 6: So sánh thực nghiệm của hai xạ thủ",
    "pts": 20,
    "question": "Xạ thủ A bắn $40\\text{ viên}$ trúng $32\\text{ viên}$. Xạ thủ B bắn $50\\text{ viên}$ trúng $38\\text{ viên}$. Ai có xác suất thực nghiệm bắn trúng cao hơn?",
    "options": [
      {
        "text": "Xạ thủ A ($0{,}80 > 0{,}76$)",
        "correct": true
      },
      {
        "text": "Xạ thủ B ($0{,}76 > 0{,}80$)",
        "correct": false
      },
      {
        "text": "Cả hai bằng nhau",
        "correct": false
      },
      {
        "text": "Không thể so sánh được",
        "correct": false
      }
    ],
    "explanation": "Xác suất thực nghiệm A: $\\frac{32}{40} = 0{,}80 = 80\\%$. B: $\\frac{38}{50} = 0{,}76 = 76\\%$. Vậy xạ thủ A cao hơn."
  },
  {
    "id": 7,
    "title": "Câu 7: Xác suất thực nghiệm và kết quả đối lập",
    "pts": 20,
    "question": "Nếu xác suất thực nghiệm sản phẩm đạt tiêu chuẩn là $0{,}96$, thì xác suất thực nghiệm sản phẩm không đạt tiêu chuẩn là:",
    "options": [
      {
        "text": "$0{,}04$",
        "correct": true
      },
      {
        "text": "$0{,}96$",
        "correct": false
      },
      {
        "text": "$0{,}40$",
        "correct": false
      },
      {
        "text": "$0{,}06$",
        "correct": false
      }
    ],
    "explanation": "Tổng tần số tương đối bằng 1: $1 - 0{,}96 = 0{,}04$."
  },
  {
    "id": 8,
    "title": "Câu 8: Thí nghiệm Buffon và Pearson",
    "pts": 20,
    "question": "Nhà toán học Pearson tung đồng xu $24\\,000\\text{ lần}$ được $12\\,012\\text{ lần}$ mặt ngửa. Kết quả này chứng minh điều gì?",
    "options": [
      {
        "text": "Xác suất thực nghiệm hội tụ về xác suất lý thuyết $0{,}5$",
        "correct": true
      },
      {
        "text": "Đồng xu bị lệch",
        "correct": false
      },
      {
        "text": "Xác suất mặt ngửa luôn lớn hơn mặt sấp",
        "correct": false
      },
      {
        "text": "Không có ý nghĩa thống kê",
        "correct": false
      }
    ],
    "explanation": "Tỉ số $\\frac{12012}{24000} = 0{,}5005$ rất sát với xác suất lý thuyết $0{,}5$, minh họa trực quan quy luật số lớn."
  },
  {
    "id": 9,
    "title": "Câu 9: Ước lượng số dân trong thành phố",
    "pts": 20,
    "question": "Khảo sát ngẫu nhiên $1\\,000\\text{ người}$ ở một thành phố thấy có $180\\text{ người}$ đi làm bằng xe bus. Nếu thành phố có $500\\,000\\text{ người}$, ước lượng số người đi làm bằng xe bus là:",
    "options": [
      {
        "text": "$90\\,000\\text{ người}$",
        "correct": true
      },
      {
        "text": "$80\\,000\\text{ người}$",
        "correct": false
      },
      {
        "text": "$100\\,000\\text{ người}$",
        "correct": false
      },
      {
        "text": "$18\\,000\\text{ người}$",
        "correct": false
      }
    ],
    "explanation": "Tỉ lệ là $\\frac{180}{1000} = 18\\%$. Ước lượng: $500\\,000 \\times 18\\% = 90\\,000\\text{ người}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Điều kiện để xác suất thực nghiệm đáng tin cậy",
    "pts": 20,
    "question": "Để xác suất thực nghiệm phản ánh chính xác nhất xác suất lý thuyết của một biến cố, ta cần:",
    "options": [
      {
        "text": "Tăng số lần thực hiện phép thử $N$ lên thật lớn và mẫu phải ngẫu nhiên",
        "correct": true
      },
      {
        "text": "Chỉ thử nghiệm đúng 1 lần duy nhất",
        "correct": false
      },
      {
        "text": "Chọn lọc những kết quả có lợi cho người làm thử nghiệm",
        "correct": false
      },
      {
        "text": "Thử nghiệm trong các điều kiện môi trường thay đổi liên tục",
        "correct": false
      }
    ],
    "explanation": "Để xác suất thực nghiệm đáng tin cậy, số lần thực nghiệm phải đủ lớn, các phép thử phải tiến hành trong cùng điều kiện và mẫu điều tra phải đảm bảo tính ngẫu nhiên, không thiên vị."
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
                const btnRun = document.getElementById('btnRunSim');
                const btnReset = document.getElementById('btnResetSim');
                const outEl = document.getElementById('lab1Output32');

                let totalTosses = 0;
                let headsCount = 0;
                let history = [];

                function update() {
                    const ratio = totalTosses > 0 ? (headsCount / totalTosses).toFixed(4) : 0;
                    outEl.innerHTML = `<strong>Tổng số lần tung:</strong> $N = ${totalTosses}$ &nbsp;|&nbsp; <strong>Số lần mặt ngửa:</strong> $m = ${headsCount}$ <br><strong>Xác suất thực nghiệm:</strong> <span style="color:#34d399; font-weight:bold; font-size:1.15rem;">$\\frac{m}{N} = ${ratio}$</span> &nbsp;$\\approx$ Lý thuyết: $0{,}5000$ (Sai số: ${(Math.abs(ratio - 0.5)).toFixed(4)})`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Đường lý thuyết 0.5
                    const y05 = h / 2;
                    ctx.strokeStyle = '#ef4444';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath(); ctx.moveTo(40, y05); ctx.lineTo(w - 20, y05); ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#ef4444';
                    ctx.font = 'bold 12px Segoe UI';
                    ctx.fillText('Lý thuyết P = 0.5', 45, y05 - 6);

                    // Vẽ đường thực nghiệm
                    if (history.length > 1) {
                        ctx.strokeStyle = '#38bdf8';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        history.forEach((val, idx) => {
                            const px = 40 + (idx / history.length) * (w - 70);
                            const py = h - val * (h - 40) - 20;
                            if (idx === 0) ctx.moveTo(px, py);
                            else ctx.lineTo(px, py);
                        });
                        ctx.stroke();
                    }
                }

                btnRun.addEventListener('click', () => {
                    for (let i = 0; i < 500; i++) {
                        totalTosses++;
                        if (Math.random() < 0.5) headsCount++;
                        if (totalTosses % 5 === 0) {
                            history.push(headsCount / totalTosses);
                        }
                    }
                    update();
                });

                btnReset.addEventListener('click', () => {
                    totalTosses = 0; headsCount = 0; history = [];
                    update();
                });
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const slider = document.getElementById('sliderM32');
                const valM = document.getElementById('valM32');
                const outEl = document.getElementById('lab2Output32');

                function draw() {
                    const m = parseInt(slider.value);
                    valM.textContent = m;

                    const M = 50;
                    const n = 60;
                    const estimatedN = Math.round((M * n) / m);

                    outEl.innerHTML = `<strong>Công thức ước lượng:</strong> $N \\approx \\frac{M \\cdot n}{m} = \\frac{50 \\cdot 60}{${m}} = <span style="color:#34d399; font-weight:bold; font-size:1.15rem;">${estimatedN}</span>\\text{ con cá}$ <br>Tỉ lệ cá có dấu trong mẫu: $\\frac{${m}}{60} \\approx ${(m / 60 * 100).toFixed(1)}\\%$`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#06b6d4';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText(`MÔ HÌNH HỒ CÁ ƯỚC TÍNH: ~${estimatedN} CON`, 40, 40);

                    // Vẽ hồ nước
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.roundRect(40, 60, w - 80, 110, 15);
                    ctx.fill();
                    ctx.stroke();

                    // Vẽ ngẫu nhiên một số con cá biểu trưng
                    for (let i = 0; i < 30; i++) {
                        const px = 60 + (i % 10) * 45;
                        const py = 85 + Math.floor(i / 10) * 28;
                        const isMarked = (i < m);

                        ctx.fillStyle = isMarked ? '#f59e0b' : '#38bdf8';
                        ctx.beginPath();
                        ctx.ellipse(px, py, 10, 5, 0, 0, Math.PI * 2);
                        ctx.fill();
                    }
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
