// ================================================================
// HOẠT ĐỘNG THỰC HÀNH TRẢI NGHIỆM 3: VẼ HÌNH ĐƠN GIẢN VỚI GEOGEBRA - TOÁN 8 KNTT
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
  userTitle: 'Kỹ Sư Hình Học Động GeoGebra 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_thuchanh3_state';

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
    "title": "Thử thách 1: Công cụ dựng đường song song",
    "pts": 20,
    "question": "Để dựng một đường thẳng đi qua một điểm $M$ và song song với đường thẳng $d$ có sẵn trong GeoGebra, ta dùng công cụ:",
    "options": [
      {
        "text": "Đường song song (Parallel Line)",
        "correct": true
      },
      {
        "text": "Đường vuông góc (Perpendicular Line)",
        "correct": false
      },
      {
        "text": "Đoạn thẳng (Segment)",
        "correct": false
      },
      {
        "text": "Đường phân giác (Angle Bisector)",
        "correct": false
      }
    ],
    "explanation": "Công cụ 'Đường song song' cho phép tạo đường thẳng song song với đối tượng cho trước."
  },
  {
    "id": "q2",
    "title": "Thử thách 2: Dựng hình bình hành",
    "pts": 20,
    "question": "Khi đã vẽ ba đỉnh $A, B, C$ của hình bình hành $ABCD$, đỉnh $D$ được xác định là giao điểm của:",
    "options": [
      {
        "text": "Đường thẳng qua $A$ song song với $BC$ và đường thẳng qua $C$ song song với $AB$",
        "correct": true
      },
      {
        "text": "Đường thẳng qua $A$ vuông góc với $BC$ và đường thẳng qua $C$ vuông góc với $AB$",
        "correct": false
      },
      {
        "text": "Đường trung trực của đoạn thẳng $AB$ và $BC$",
        "correct": false
      },
      {
        "text": "Hai đường tròn tâm $A$ và tâm $C$ có cùng bán kính $AB$",
        "correct": false
      }
    ],
    "explanation": "Hình bình hành có các cạnh đối song song nên $D$ là giao của đường qua $A$ song song $BC$ và đường qua $C$ song song $AB$."
  },
  {
    "id": "q3",
    "title": "Thử thách 3: Dựng hình vuông góc",
    "pts": 20,
    "question": "Để dựng hình chữ nhật $ABCD$ từ đoạn thẳng $AB$, sau khi chọn điểm $A$ ta dùng công cụ nào để tạo cạnh $AD$ vuông góc với $AB$?",
    "options": [
      {
        "text": "Đường vuông góc (Perpendicular Line)",
        "correct": true
      },
      {
        "text": "Đường song song (Parallel Line)",
        "correct": false
      },
      {
        "text": "Điểm trên đối tượng",
        "correct": false
      },
      {
        "text": "Phép đối xứng trục",
        "correct": false
      }
    ],
    "explanation": "Dùng công cụ 'Đường vuông góc' kẻ đường vuông góc với $AB$ tại điểm $A$ để xác định phương của cạnh $AD$."
  },
  {
    "id": "q4",
    "title": "Thử thách 4: Đo góc trong GeoGebra",
    "pts": 20,
    "question": "Để kiểm tra xem một tứ giác có phải là hình chữ nhật hay không, ta có thể dùng công cụ nào để đo các góc?",
    "options": [
      {
        "text": "Góc (Angle)",
        "correct": true
      },
      {
        "text": "Khoảng cách hoặc độ dài (Distance)",
        "correct": false
      },
      {
        "text": "Diện tích (Area)",
        "correct": false
      },
      {
        "text": "Độ dốc (Slope)",
        "correct": false
      }
    ],
    "explanation": "Công cụ 'Góc' (Angle) đo số đo góc để kiểm tra xem cả 4 góc có bằng $90^{\\circ}$ hay không."
  },
  {
    "id": "q5",
    "title": "Thử thách 5: Công cụ tìm trung điểm",
    "pts": 20,
    "question": "Trong GeoGebra, công cụ 'Trung điểm hoặc tâm' (Midpoint or Center) dùng để:",
    "options": [
      {
        "text": "Xác định trung điểm của một đoạn thẳng hoặc tâm của đường tròn",
        "correct": true
      },
      {
        "text": "Chia một góc thành 3 phần bằng nhau",
        "correct": false
      },
      {
        "text": "Kẻ đường vuông góc đi qua một điểm",
        "correct": false
      },
      {
        "text": "Đo chu vi của hình",
        "correct": false
      }
    ],
    "explanation": "Công cụ 'Trung điểm hoặc tâm' click vào đoạn thẳng hoặc 2 đầu mút sẽ sinh ngay trung điểm."
  },
  {
    "id": "q6",
    "title": "Thử thách 6: Dựng hình thoi bằng compa",
    "pts": 20,
    "question": "Để dựng 4 cạnh bằng nhau của hình thoi trong GeoGebra, công cụ nào sau đây thường được sử dụng hiệu quả nhất?",
    "options": [
      {
        "text": "Đường tròn khi biết tâm và bán kính (hoặc Compa)",
        "correct": true
      },
      {
        "text": "Đường tiếp tuyến",
        "correct": false
      },
      {
        "text": "Vectơ nối hai điểm",
        "correct": false
      },
      {
        "text": "Đường phân giác",
        "correct": false
      }
    ],
    "explanation": "Đường tròn (Compa) giữ khoảng cách bán kính không đổi, đảm bảo các cạnh luôn bằng nhau khi dựng hình thoi."
  },
  {
    "id": "q7",
    "title": "Thử thách 7: Kiểm tra tính chất hai đường chéo hình thoi",
    "pts": 20,
    "question": "Hai đường chéo của hình thoi luôn có tính chất đặc trưng nào sau đây?",
    "options": [
      {
        "text": "Vuông góc với nhau tại trung điểm của mỗi đường",
        "correct": true
      },
      {
        "text": "Bằng nhau và song song với nhau",
        "correct": false
      },
      {
        "text": "Cắt nhau tại 1 điểm bất kì",
        "correct": false
      },
      {
        "text": "Không bao giờ cắt nhau",
        "correct": false
      }
    ],
    "explanation": "Trong hình thoi, hai đường chéo vuông góc với nhau và cắt nhau tại trung điểm của mỗi đường."
  },
  {
    "id": "q8",
    "title": "Thử thách 8: Dựng hình thang cân",
    "pts": 20,
    "question": "Để dựng hình thang cân $ABCD$ với đáy $AB$ và $CD$, ta có thể dựng trục đối xứng là:",
    "options": [
      {
        "text": "Đường trung trực của đáy $AB$",
        "correct": true
      },
      {
        "text": "Đường phân giác của góc $A$",
        "correct": false
      },
      {
        "text": "Đường chéo $AC$",
        "correct": false
      },
      {
        "text": "Cạnh bên $BC$",
        "correct": false
      }
    ],
    "explanation": "Hình thang cân nhận đường trung trực của hai đáy làm trục đối xứng."
  },
  {
    "id": "q9",
    "title": "Thử thách 9: Kiểm tra tính chất hai đường chéo hình chữ nhật",
    "pts": 20,
    "question": "Khi đo đạc hai đường chéo của một hình chữ nhật bằng công cụ 'Khoảng cách', ta luôn nhận được kết quả:",
    "options": [
      {
        "text": "Độ dài hai đường chéo bằng nhau ($AC = BD$)",
        "correct": true
      },
      {
        "text": "Đường chéo này luôn dài gấp đôi đường chéo kia",
        "correct": false
      },
      {
        "text": "Hai đường chéo luôn vuông góc với nhau",
        "correct": false
      },
      {
        "text": "Tổng hai đường chéo luôn bằng $100$",
        "correct": false
      }
    ],
    "explanation": "Hình chữ nhật có hai đường chéo bằng nhau và cắt nhau tại trung điểm mỗi đường."
  },
  {
    "id": "q10",
    "title": "Thử thách 10: Tính năng 'Hình học động'",
    "pts": 20,
    "question": "Khái niệm 'Hình học động' (Dynamic Geometry) trong GeoGebra mang ý nghĩa:",
    "options": [
      {
        "text": "Người dùng có thể kéo rê các điểm tự do làm hình thay đổi kích thước mà các mối quan hệ hình học (song song, vuông góc...) vẫn được giữ nguyên",
        "correct": true
      },
      {
        "text": "Hình ảnh chỉ là một bức ảnh tĩnh chụp từ trên mạng",
        "correct": false
      },
      {
        "text": "Hình vẽ tự động chuyển động quay vòng tròn liên tục không ngừng",
        "correct": false
      },
      {
        "text": "Chỉ vẽ được các vật thể chuyển động có vận tốc và gia tốc",
        "correct": false
      }
    ],
    "explanation": "Hình học động cho phép tương tác trực tiếp, bảo toàn tính chất hình học khi thay đổi cấu trúc hình vẽ."
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
        const selQuad = document.getElementById('selQuadType');
        const sliderW = document.getElementById('sliderQuadW');
        const sliderH = document.getElementById('sliderQuadH');
        const valW = document.getElementById('valQuadW');
        const valH = document.getElementById('valQuadH');
        const outQuad = document.getElementById('labOutQuad');

        function drawDynamicQuad() {
          if (!ctx || !selQuad || !sliderW || !sliderH) return;
          const type = selQuad.value;
          const wVal = parseInt(sliderW.value);
          const hVal = parseInt(sliderH.value);

          if (valW) valW.textContent = wVal;
          if (valH) valH.textContent = hVal;

          const w = canvas.width;
          const h = canvas.height;
          ctx.clearRect(0, 0, w, h);

          const cx = w / 2;
          const cy = h / 2;

          let pts = [];
          let quadName = 'Hình Bình Hành';
          let props = '';

          if (type === 'parallelogram') {
            quadName = 'Hình Bình Hành ABCD';
            const skew = 40;
            pts = [
              { x: cx - wVal/2 + skew, y: cy - hVal/2, label: 'B' },
              { x: cx + wVal/2 + skew, y: cy - hVal/2, label: 'C' },
              { x: cx + wVal/2 - skew, y: cy + hVal/2, label: 'D' },
              { x: cx - wVal/2 - skew, y: cy + hVal/2, label: 'A' }
            ];
            props = 'AB = CD, AD = BC; AB // CD, AD // BC; Hai đường chéo cắt nhau tại trung điểm mỗi đường.';
          } else if (type === 'rectangle') {
            quadName = 'Hình Chữ Nhật ABCD';
            pts = [
              { x: cx - wVal/2, y: cy - hVal/2, label: 'B' },
              { x: cx + wVal/2, y: cy - hVal/2, label: 'C' },
              { x: cx + wVal/2, y: cy + hVal/2, label: 'D' },
              { x: cx - wVal/2, y: cy + hVal/2, label: 'A' }
            ];
            props = '4 góc vuông 90°; Hai đường chéo AC = BD bằng nhau và cắt nhau tại trung điểm mỗi đường.';
          } else if (type === 'rhombus') {
            quadName = 'Hình Thoi ABCD';
            const side = Math.min(wVal, hVal * 1.5) / 2;
            pts = [
              { x: cx, y: cy - hVal/2, label: 'B' },
              { x: cx + wVal/2, y: cy, label: 'C' },
              { x: cx, y: cy + hVal/2, label: 'D' },
              { x: cx - wVal/2, y: cy, label: 'A' }
            ];
            props = '4 cạnh bằng nhau AB = BC = CD = DA; Hai đường chéo AC ⊥ BD vuông góc tại trung điểm.';
          } else if (type === 'square') {
            quadName = 'Hình Vuông ABCD';
            const s = Math.min(wVal, hVal);
            pts = [
              { x: cx - s/2, y: cy - s/2, label: 'B' },
              { x: cx + s/2, y: cy - s/2, label: 'C' },
              { x: cx + s/2, y: cy + s/2, label: 'D' },
              { x: cx - s/2, y: cy + s/2, label: 'A' }
            ];
            props = 'Vừa là hình chữ nhật vừa là hình thoi: 4 góc vuông, 4 cạnh bằng nhau, 2 đường chéo vuông góc và bằng nhau.';
          } else if (type === 'trapezoid') {
            quadName = 'Hình Thang Cân ABCD';
            const topW = wVal * 0.6;
            pts = [
              { x: cx - topW/2, y: cy - hVal/2, label: 'B' },
              { x: cx + topW/2, y: cy - hVal/2, label: 'C' },
              { x: cx + wVal/2, y: cy + hVal/2, label: 'D' },
              { x: cx - wVal/2, y: cy + hVal/2, label: 'A' }
            ];
            props = 'Đáy BC // AD; Hai cạnh bên AB = CD; Hai đường chéo AC = BD; Hai góc kề đáy bằng nhau.';
          }

          if (outQuad) {
            outQuad.innerHTML = `
              🧭 <strong>${quadName}:</strong><br>
              • Thuộc tính: <em>${props}</em><br>
              ✨ <em>Kéo thanh trượt để kiểm chứng tính chất bảo toàn của hình học động.</em>
            `;
          }

          // Vẽ nền đa giác
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
          ctx.closePath();
          ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
          ctx.fill();
          ctx.strokeStyle = '#818cf8';
          ctx.lineWidth = 2.5;
          ctx.stroke();

          // Vẽ hai đường chéo nét đứt
          ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
          ctx.setLineDash([5, 4]);
          ctx.beginPath();
          ctx.moveTo(pts[3].x, pts[3].y); ctx.lineTo(pts[1].x, pts[1].y); // AC
          ctx.moveTo(pts[0].x, pts[0].y); ctx.lineTo(pts[2].x, pts[2].y); // BD
          ctx.stroke();
          ctx.setLineDash([]);

          // Vẽ các đỉnh và nhãn
          pts.forEach(p => {
            ctx.fillStyle = '#06b6d4';
            ctx.beginPath();
            ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
            ctx.fill();

            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 13px Inter, sans-serif';
            ctx.fillText(p.label, p.x + (p.x >= cx ? 10 : -18), p.y + (p.y >= cy ? 15 : -8));
          });
        }

        if (selQuad) selQuad.addEventListener('change', drawDynamicQuad);
        if (sliderW) sliderW.addEventListener('input', drawDynamicQuad);
        if (sliderH) sliderH.addEventListener('input', drawDynamicQuad);
        drawDynamicQuad();
      
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
        const canvas2 = document.getElementById('labCanvas2');
        const ctx2 = canvas2 ? canvas2.getContext('2d') : null;
        const selDiag = document.getElementById('selDiagQuad');
        const outDiag = document.getElementById('labOutDiag');

        function drawDiagonalsLab() {
          if (!ctx2 || !selDiag || !outDiag) return;
          const choice = selDiag.value;
          const w = canvas2.width;
          const h = canvas2.height;
          ctx2.clearRect(0, 0, w, h);

          const cx = w / 2;
          const cy = h / 2;

          let d1 = 200, d2 = 200, angle = 90;
          let note = '';

          if (choice === 'rect') {
            d1 = 220; d2 = 220; angle = 60;
            note = 'AC = BD = 22.0 cm (BẰNG NHAU). Góc giao nhau: 60° (không vuông góc). Cắt nhau tại trung điểm O.';
          } else if (choice === 'rhombus') {
            d1 = 260; d2 = 140; angle = 90;
            note = 'AC = 26.0 cm, BD = 14.0 cm (KHÔNG BẰNG NHAU). Góc giao nhau: 90° (VUÔNG GÓC). Cắt nhau tại trung điểm O.';
          } else if (choice === 'square') {
            d1 = 200; d2 = 200; angle = 90;
            note = 'AC = BD = 20.0 cm (BẰNG NHAU). Góc giao nhau: 90° (VUÔNG GÓC). Cắt nhau tại trung điểm O.';
          } else if (choice === 'para') {
            d1 = 250; d2 = 160; angle = 50;
            note = 'AC = 25.0 cm, BD = 16.0 cm (khác nhau). Góc giao nhau: 50° (không vuông góc). Cắt nhau tại trung điểm O.';
          }

          outDiag.innerHTML = `
            🔍 <strong>Kết Quả Đo Đạc Hình Học Bằng GeoGebra:</strong><br>
            • ${note}<br>
            ⭐ <em>Kết luận: Đường chéo là tiêu chuẩn vàng để nhận biết và phân biệt các tứ giác đặc biệt!</em>
          `;

          // Vẽ 2 đường chéo giao nhau tại O (cx, cy)
          const rad = (angle * Math.PI) / 180;
          const pA = { x: cx - (d1/2) * Math.cos(rad/2), y: cy + (d1/2) * Math.sin(rad/2) };
          const pC = { x: cx + (d1/2) * Math.cos(rad/2), y: cy - (d1/2) * Math.sin(rad/2) };
          const pB = { x: cx - (d2/2) * Math.cos(Math.PI/2 - rad/2), y: cy - (d2/2) * Math.sin(Math.PI/2 - rad/2) };
          const pD = { x: cx + (d2/2) * Math.cos(Math.PI/2 - rad/2), y: cy + (d2/2) * Math.sin(Math.PI/2 - rad/2) };

          // Nối tứ giác
          ctx2.beginPath();
          ctx2.moveTo(pA.x, pA.y);
          ctx2.lineTo(pB.x, pB.y);
          ctx2.lineTo(pC.x, pC.y);
          ctx2.lineTo(pD.x, pD.y);
          ctx2.closePath();
          ctx2.strokeStyle = 'rgba(255, 255, 255, 0.3)';
          ctx2.lineWidth = 1.5;
          ctx2.stroke();

          // Đường chéo AC (Cyan)
          ctx2.strokeStyle = '#06b6d4';
          ctx2.lineWidth = 3;
          ctx2.beginPath();
          ctx2.moveTo(pA.x, pA.y);
          ctx2.lineTo(pC.x, pC.y);
          ctx2.stroke();

          // Đường chéo BD (Gold)
          ctx2.strokeStyle = '#f59e0b';
          ctx2.lineWidth = 3;
          ctx2.beginPath();
          ctx2.moveTo(pB.x, pB.y);
          ctx2.lineTo(pD.x, pD.y);
          ctx2.stroke();

          // Giao điểm O
          ctx2.fillStyle = '#ef4444';
          ctx2.beginPath();
          ctx2.arc(cx, cy, 5, 0, Math.PI * 2);
          ctx2.fill();

          ctx2.fillStyle = '#ffffff';
          ctx2.font = 'bold 12px Inter, sans-serif';
          ctx2.fillText('O (Trung điểm)', cx + 8, cy - 8);

          // Nhãn đỉnh
          ctx2.fillText('A', pA.x - 14, pA.y + 14);
          ctx2.fillText('B', pB.x - 14, pB.y - 10);
          ctx2.fillText('C', pC.x + 10, pC.y - 10);
          ctx2.fillText('D', pD.x + 10, pD.y + 14);
        }

        if (selDiag) selDiag.addEventListener('change', drawDiagonalsLab);
        drawDiagonalsLab();
      
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
