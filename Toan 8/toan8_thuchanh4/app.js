// ================================================================
// HOẠT ĐỘNG THỰC HÀNH TRẢI NGHIỆM 4: PHÂN TÍCH ĐẶC ĐIỂM KHÍ HẬU VIỆT NAM - TOÁN 8 KNTT
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
  userTitle: 'Chuyên Gia Khí Tượng & Phân Tích Dữ Liệu 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_thuchanh4_state';

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
    "id": "q1",
    "title": "Thử thách 1: Công thức biên độ nhiệt năm",
    "pts": 20,
    "question": "Biên độ nhiệt năm của một địa phương được tính bằng công thức:",
    "options": [
      {
        "text": "Nhiệt độ trung bình tháng cao nhất trừ đi nhiệt độ trung bình tháng thấp nhất",
        "correct": true
      },
      {
        "text": "Nhiệt độ trung bình tháng cao nhất cộng với nhiệt độ trung bình tháng thấp nhất",
        "correct": false
      },
      {
        "text": "Nhiệt độ trung bình của cả 12 tháng chia cho 12",
        "correct": false
      },
      {
        "text": "Hiệu giữa nhiệt độ ngày cao nhất và đêm thấp nhất",
        "correct": false
      }
    ],
    "explanation": "Biên độ nhiệt năm là khoảng chênh lệch giữa tháng có nhiệt độ trung bình cao nhất và tháng thấp nhất trong năm: $\\Delta T = T_{\\max} - T_{\\min}$."
  },
  {
    "id": "q2",
    "title": "Thử thách 2: Tính biên độ nhiệt của Hà Nội",
    "pts": 20,
    "question": "Số liệu tại trạm Hà Nội: nhiệt độ trung bình tháng cao nhất là $29{,}8^{\\circ}\\text{C}$ (tháng 7) và thấp nhất là $16{,}4^{\\circ}\\text{C}$ (tháng 1). Biên độ nhiệt năm của Hà Nội là:",
    "options": [
      {
        "text": "$13{,}4^{\\circ}\\text{C}$",
        "correct": true
      },
      {
        "text": "$12{,}4^{\\circ}\\text{C}$",
        "correct": false
      },
      {
        "text": "$14{,}2^{\\circ}\\text{C}$",
        "correct": false
      },
      {
        "text": "$46{,}2^{\\circ}\\text{C}$",
        "correct": false
      }
    ],
    "explanation": "Biên độ nhiệt của Hà Nội: $\\Delta T = 29{,}8 - 16{,}4 = 13{,}4^{\\circ}\\text{C}$."
  },
  {
    "id": "q3",
    "title": "Thử thách 3: Biểu đồ thích hợp cho nhiệt độ",
    "pts": 20,
    "question": "Để biểu diễn sự biến thiên nhiệt độ trung bình qua 12 tháng trong năm, loại biểu đồ nào sau đây trực quan và phù hợp nhất?",
    "options": [
      {
        "text": "Biểu đồ đoạn thẳng",
        "correct": true
      },
      {
        "text": "Biểu đồ hình quạt tròn",
        "correct": false
      },
      {
        "text": "Biểu đồ tranh",
        "correct": false
      },
      {
        "text": "Biểu đồ tần số tương đối dạng thanh ngang",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ đoạn thẳng thích hợp nhất để thể hiện xu hướng tăng/giảm của một đại lượng theo thời gian liên tục."
  },
  {
    "id": "q4",
    "title": "Thử thách 4: Biểu đồ thích hợp cho lượng mưa",
    "pts": 20,
    "question": "Để biểu diễn lượng mưa của từng tháng trong 12 tháng ở một trạm khí tượng, loại biểu đồ thông dụng nhất là:",
    "options": [
      {
        "text": "Biểu đồ cột",
        "correct": true
      },
      {
        "text": "Biểu đồ hình quạt tròn",
        "correct": false
      },
      {
        "text": "Biểu đồ tranh",
        "correct": false
      },
      {
        "text": "Sơ đồ cây",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ cột có độ cao các cột thể hiện trực quan lượng mưa tích lũy của từng tháng."
  },
  {
    "id": "q5",
    "title": "Thử thách 5: Đặc điểm nhiệt độ TP. Hồ Chí Minh",
    "pts": 20,
    "question": "Tại TP. Hồ Chí Minh, nhiệt độ tháng cao nhất là $28{,}9^{\\circ}\\text{C}$ (tháng 4) và tháng thấp nhất là $25{,}7^{\\circ}\\text{C}$ (tháng 12). Biên độ nhiệt năm là:",
    "options": [
      {
        "text": "$3{,}2^{\\circ}\\text{C}$",
        "correct": true
      },
      {
        "text": "$5{,}2^{\\circ}\\text{C}$",
        "correct": false
      },
      {
        "text": "$1{,}8^{\\circ}\\text{C}$",
        "correct": false
      },
      {
        "text": "$4{,}0^{\\circ}\\text{C}$",
        "correct": false
      }
    ],
    "explanation": "Biên độ nhiệt tại TP. Hồ Chí Minh: $28{,}9 - 25{,}7 = 3{,}2^{\\circ}\\text{C}$, nhỏ hơn rất nhiều so với Hà Nội."
  },
  {
    "id": "q6",
    "title": "Thử thách 6: So sánh biên độ nhiệt Bắc - Nam",
    "pts": 20,
    "question": "Từ số liệu thống kê khí hậu, nhận xét nào sau đây là chính xác về quy luật biên độ nhiệt độ ở Việt Nam?",
    "options": [
      {
        "text": "Biên độ nhiệt năm giảm dần từ Bắc vào Nam",
        "correct": true
      },
      {
        "text": "Biên độ nhiệt năm tăng dần từ Bắc vào Nam",
        "correct": false
      },
      {
        "text": "Biên độ nhiệt năm ở mọi nơi trên cả nước đều bằng nhau",
        "correct": false
      },
      {
        "text": "Miền Nam có mùa đông lạnh hơn miền Bắc",
        "correct": false
      }
    ],
    "explanation": "Miền Bắc chịu ảnh hưởng của gió mùa đông bắc nên biên độ nhiệt lớn ($> 12^{\\circ}\\text{C}$), càng vào Nam tính chất cận xích đạo càng rõ rệt nên biên độ nhiệt giảm dần."
  },
  {
    "id": "q7",
    "title": "Thử thách 7: Tính tổng lượng mưa cả năm",
    "pts": 20,
    "question": "Quan sát bảng số liệu lượng mưa 12 tháng tại một trạm: 6 tháng mùa mưa có tổng lượng mưa là $1450\\text{ mm}$, 6 tháng mùa khô có tổng lượng mưa là $250\\text{ mm}$. Tổng lượng mưa cả năm của trạm đó là:",
    "options": [
      {
        "text": "$1700\\text{ mm}$",
        "correct": true
      },
      {
        "text": "$1200\\text{ mm}$",
        "correct": false
      },
      {
        "text": "$1500\\text{ mm}$",
        "correct": false
      },
      {
        "text": "$850\\text{ mm}$",
        "correct": false
      }
    ],
    "explanation": "Tổng lượng mưa cả năm bằng tổng lượng mưa 12 tháng: $1450 + 250 = 1700\\text{ mm}$."
  },
  {
    "id": "q8",
    "title": "Thử thách 8: Tỉ lệ phần trăm lượng mưa mùa mưa",
    "pts": 20,
    "question": "Với tổng lượng mưa năm là $1700\\text{ mm}$ và mùa mưa chiếm $1450\\text{ mm}$, tỉ lệ phần trăm lượng mưa của mùa mưa so với cả năm xấp xỉ là:",
    "options": [
      {
        "text": "Khoảng $85{,}3\\%$",
        "correct": true
      },
      {
        "text": "Khoảng $70{,}5\\%$",
        "correct": false
      },
      {
        "text": "Khoảng $95{,}0\\%$",
        "correct": false
      },
      {
        "text": "Khoảng $60{,}2\\%$",
        "correct": false
      }
    ],
    "explanation": "Tỉ lệ phần trăm: $\\dfrac{1450}{1700} \\times 100\\% \\approx 85{,}29\\% \\approx 85{,}3\\%$."
  },
  {
    "id": "q9",
    "title": "Thử thách 9: Mùa mưa lệch ở Đà Nẵng",
    "pts": 20,
    "question": "Trạm Đà Nẵng có lượng mưa tập trung cao nhất vào các tháng 9, 10, 11 (có tháng lượng mưa vượt trên $600\\text{ mm}$). Hiện tượng này thể hiện:",
    "options": [
      {
        "text": "Đặc điểm mùa mưa lệch về các tháng thu đông của vùng Duyên hải Nam Trung Bộ",
        "correct": true
      },
      {
        "text": "Đà Nẵng không có mùa mưa",
        "correct": false
      },
      {
        "text": "Đà Nẵng có mưa nhiều nhất vào mùa xuân",
        "correct": false
      },
      {
        "text": "Số liệu bị sai lệch, không có giá trị thống kê",
        "correct": false
      }
    ],
    "explanation": "Vùng Duyên hải miền Trung đón gió mùa đông bắc qua biển và bão nên mùa mưa lệch hẳn về các tháng cuối năm (tháng 9-11)."
  },
  {
    "id": "q10",
    "title": "Thử thách 10: Ý nghĩa của phân tích dữ liệu thống kê",
    "pts": 20,
    "question": "Việc thu thập và vẽ biểu đồ phân tích dữ liệu khí hậu giúp ích gì trong đời sống?",
    "options": [
      {
        "text": "Dự báo thời tiết, lên kế hoạch mùa vụ nông nghiệp, phòng chống bão lũ và phát triển kinh tế xã hội",
        "correct": true
      },
      {
        "text": "Chỉ dùng để trang trí sách giáo khoa, không có ứng dụng thực tế",
        "correct": false
      },
      {
        "text": "Thay đổi được hướng đi của gió mùa tự nhiên",
        "correct": false
      },
      {
        "text": "Ngăn chặn được hoàn toàn hiện tượng hạn hán và lũ lụt",
        "correct": false
      }
    ],
    "explanation": "Phân tích dữ liệu khí tượng thủy văn giúp đưa ra các quyết định chiến lược về sản xuất nông nghiệp, quy hoạch thủy lợi, phòng chống thiên tai."
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
        const ctx = canvas ? canvas.getContext('2d') : null;
        const selStation = document.getElementById('selStation');
        const outClimate = document.getElementById('labOutClimate');

        const climateData = {
          hanoi: {
            name: 'Trạm Hà Nội (Miền Bắc)',
            temp: [16.4, 17.2, 20.0, 24.0, 27.5, 29.2, 29.8, 29.1, 27.8, 25.3, 21.8, 18.2],
            rain: [18, 26, 43, 90, 188, 240, 288, 318, 265, 142, 45, 22]
          },
          danang: {
            name: 'Trạm Đà Nẵng (Miền Trung)',
            temp: [21.7, 23.0, 25.1, 27.2, 29.2, 29.7, 29.4, 29.1, 27.5, 25.7, 24.1, 22.3],
            rain: [85, 30, 22, 27, 62, 88, 92, 115, 420, 610, 360, 210]
          },
          hcm: {
            name: 'Trạm TP. Hồ Chí Minh (Miền Nam)',
            temp: [26.0, 26.8, 28.0, 28.9, 28.4, 27.8, 27.5, 27.4, 27.2, 27.0, 26.7, 25.7],
            rain: [14, 4, 12, 50, 218, 310, 295, 270, 325, 268, 115, 48]
          }
        };

        function drawClimograph() {
          if (!ctx || !selStation || !outClimate) return;
          const key = selStation.value || 'hanoi';
          const d = climateData[key];

          const tMax = Math.max(...d.temp);
          const tMin = Math.min(...d.temp);
          const ampT = tMax - tMin;
          const totalRain = d.rain.reduce((a, b) => a + b, 0);

          outClimate.innerHTML = `
            🌡️ <strong>Đặc Điểm Khí Hậu: ${d.name}</strong><br>
            • Nhiệt độ cao nhất: <strong>${tMax}°C</strong> • Thấp nhất: <strong>${tMin}°C</strong><br>
            • Biên độ nhiệt năm: <strong style="color: #f59e0b;">${ampT.toFixed(1)}°C</strong><br>
            • Tổng lượng mưa cả năm: <strong style="color: #38bdf8;">${totalRain} mm</strong> (Mùa mưa chiếm đa số lượng nước)
          `;

          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          const padL = 50, padR = 50, padT = 30, padB = 40;
          const plotW = w - padL - padR;
          const plotH = h - padT - padB;
          const maxRain = 700;
          const maxTemp = 35;

          // Cột lượng mưa (Blue)
          const barW = plotW / 12 * 0.6;
          for (let m = 0; m < 12; m++) {
            const rVal = d.rain[m];
            const barH = (rVal / maxRain) * plotH;
            const x = padL + (m + 0.2) * (plotW / 12);
            const y = h - padB - barH;

            ctx.fillStyle = 'rgba(6, 182, 212, 0.6)';
            ctx.fillRect(x, y, barW, barH);
            ctx.strokeStyle = '#06b6d4';
            ctx.strokeRect(x, y, barW, barH);

            // Nhãn tháng
            ctx.fillStyle = '#94a3b8';
            ctx.font = '10px Inter, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('T' + (m + 1), x + barW / 2, h - padB + 16);
          }

          // Đường nhiệt độ (Đỏ Cam)
          ctx.beginPath();
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 3;
          for (let m = 0; m < 12; m++) {
            const tVal = d.temp[m];
            const x = padL + (m + 0.5) * (plotW / 12);
            const y = h - padB - (tVal / maxTemp) * plotH;
            if (m === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
          }
          ctx.stroke();

          // Các điểm chấm nhiệt độ
          for (let m = 0; m < 12; m++) {
            const tVal = d.temp[m];
            const x = padL + (m + 0.5) * (plotW / 12);
            const y = h - padB - (tVal / maxTemp) * plotH;

            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#ef4444';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          // Chú thích
          ctx.textAlign = 'left';
          ctx.fillStyle = '#06b6d4';
          ctx.font = 'bold 11px Inter, sans-serif';
          ctx.fillText('■ Cột: Lượng Mưa (mm)', padL, padT - 10);

          ctx.fillStyle = '#ef4444';
          ctx.fillText('● Đường: Nhiệt Độ (°C)', padL + 180, padT - 10);
        }

        if (selStation) selStation.addEventListener('change', drawClimograph);
        drawClimograph();
      
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
        const canvas2 = document.getElementById('labCanvas2');
        const ctx2 = canvas2 ? canvas2.getContext('2d') : null;
        const btnComp = document.getElementById('btnCompareAll');
        const outComp = document.getElementById('labOutCompare');

        function drawAllThree() {
          if (!ctx2 || !outComp) return;
          const w = canvas2.width;
          const h = canvas2.height;
          ctx2.clearRect(0, 0, w, h);

          outComp.innerHTML = `
            📊 <strong>Quy Luật Khí Hậu Việt Nam Rút Ra Từ Biểu Đồ:</strong><br>
            • <strong style="color: #38bdf8;">Hà Nội (Xanh dương):</strong> Đường nhiệt độ uốn lượn sâu, mùa đông xuống dưới 17°C, biên độ nhiệt lớn 13.4°C.<br>
            • <strong style="color: #f59e0b;">Đà Nẵng (Vàng cam):</strong> Nền nhiệt ấm áp hơn, mùa đông trên 21°C, biên độ nhiệt 8.0°C.<br>
            • <strong style="color: #ef4444;">TP. Hồ Chí Minh (Đỏ):</strong> Đường nhiệt độ gần như phẳng nằm ngang trên 25°C quanh năm, biên độ nhiệt chỉ 3.2°C.<br>
            🚀 <em>Quy luật: Càng đi vào Nam, nền nhiệt trung bình càng cao và biên độ nhiệt càng giảm!</em>
          `;

          const padL = 50, padR = 40, padT = 30, padB = 40;
          const plotW = w - padL - padR;
          const plotH = h - padT - padB;
          const maxTemp = 35;

          // Trục tọa độ
          ctx2.strokeStyle = 'rgba(255, 255, 255, 0.15)';
          ctx2.lineWidth = 1;
          for (let t = 15; t <= 35; t += 5) {
            const y = h - padB - (t / maxTemp) * plotH;
            ctx2.beginPath();
            ctx2.moveTo(padL, y);
            ctx2.lineTo(w - padR, y);
            ctx2.stroke();

            ctx2.fillStyle = '#94a3b8';
            ctx2.font = '10px Inter, sans-serif';
            ctx2.textAlign = 'right';
            ctx2.fillText(t + '°C', padL - 8, y + 3);
          }

          const hanoiT = [16.4, 17.2, 20.0, 24.0, 27.5, 29.2, 29.8, 29.1, 27.8, 25.3, 21.8, 18.2];
          const danangT = [21.7, 23.0, 25.1, 27.2, 29.2, 29.7, 29.4, 29.1, 27.5, 25.7, 24.1, 22.3];
          const hcmT = [26.0, 26.8, 28.0, 28.9, 28.4, 27.8, 27.5, 27.4, 27.2, 27.0, 26.7, 25.7];

          function plotLine(arr, color) {
            ctx2.beginPath();
            ctx2.strokeStyle = color;
            ctx2.lineWidth = 2.5;
            for (let m = 0; m < 12; m++) {
              const x = padL + (m + 0.5) * (plotW / 12);
              const y = h - padB - (arr[m] / maxTemp) * plotH;
              if (m === 0) ctx2.moveTo(x, y);
              else ctx2.lineTo(x, y);
            }
            ctx2.stroke();
          }

          plotLine(hanoiT, '#38bdf8');
          plotLine(danangT, '#f59e0b');
          plotLine(hcmT, '#ef4444');

          // Nhãn tháng
          for (let m = 0; m < 12; m++) {
            const x = padL + (m + 0.5) * (plotW / 12);
            ctx2.fillStyle = '#94a3b8';
            ctx2.font = '10px Inter, sans-serif';
            ctx2.textAlign = 'center';
            ctx2.fillText('T' + (m + 1), x, h - padB + 16);
          }

          // Chú thích
          ctx2.textAlign = 'left';
          ctx2.fillStyle = '#38bdf8'; ctx2.fillText('━ Hà Nội (Bắc)', padL, padT - 10);
          ctx2.fillStyle = '#f59e0b'; ctx2.fillText('━ Đà Nẵng (Trung)', padL + 120, padT - 10);
          ctx2.fillStyle = '#ef4444'; ctx2.fillText('━ TP.HCM (Nam)', padL + 250, padT - 10);
        }

        if (btnComp) btnComp.addEventListener('click', drawAllThree);
        drawAllThree();
      
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
