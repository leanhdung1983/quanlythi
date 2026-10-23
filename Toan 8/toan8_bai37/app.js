// ================================================================
// BÀI 37: HÌNH ĐỒNG DẠNG - TOÁN 8 KNTT
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
  userTitle: 'Nhà Thiết Kế Hình Đồng Dạng 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai37_state';

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
    "title": "Câu 1: Cặp hình luôn đồng dạng",
    "pts": 20,
    "question": "Cặp hình nào sau đây <strong>luôn luôn đồng dạng</strong> với nhau?",
    "options": [
      {
        "text": "Hai hình tròn bất kì",
        "correct": true
      },
      {
        "text": "Hai hình chữ nhật bất kì",
        "correct": false
      },
      {
        "text": "Hai hình thoi bất kì",
        "correct": false
      },
      {
        "text": "Hai hình tam giác cân bất kì",
        "correct": false
      }
    ],
    "explanation": "Hai hình tròn bất kì luôn có cùng hình dạng, tỉ số đồng dạng bằng tỉ số hai bán kính. Các hình chữ nhật hay hình thoi có thể có tỉ lệ cạnh hoặc góc khác nhau."
  },
  {
    "id": 2,
    "title": "Câu 2: Hai hình vuông luôn đồng dạng",
    "pts": 20,
    "question": "Hai hình vuông bất kì luôn đồng dạng với nhau vì:",
    "options": [
      {
        "text": "Các góc đều bằng $90^\\circ$ và các cạnh tương ứng luôn tỉ lệ",
        "correct": true
      },
      {
        "text": "Chúng có diện tích bằng nhau",
        "correct": false
      },
      {
        "text": "Chúng có chu vi bằng nhau",
        "correct": false
      },
      {
        "text": "Chúng có đường chéo bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Mọi hình vuông đều có 4 góc vuông bằng nhau và 4 cạnh bằng nhau, do đó tỉ số giữa các cạnh tương ứng luôn bằng hằng số $k = \\frac{a'}{a}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Khái niệm tâm phối cảnh",
    "pts": 20,
    "question": "Trong phép đồng dạng phối cảnh, các đường thẳng nối các cặp điểm tương ứng luôn:",
    "options": [
      {
        "text": "Cùng đi qua tâm phối cảnh $O$",
        "correct": true
      },
      {
        "text": "Song song với nhau",
        "correct": false
      },
      {
        "text": "Vuông góc với nhau",
        "correct": false
      },
      {
        "text": "Không cắt nhau",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa hình đồng dạng phối cảnh (vị tự), các đường thẳng nối mỗi điểm $M$ với điểm ảnh $M'$ của nó luôn đồng quy tại tâm phối cảnh $O$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tỉ số diện tích của hai hình đồng dạng",
    "pts": 20,
    "question": "Một bức ảnh hình chữ nhật có kích thước $6\\text{ cm} \\times 9\\text{ cm}$ được phóng to thành ảnh đồng dạng có chiều rộng $18\\text{ cm}$. Tỉ số diện tích của ảnh mới so với ảnh cũ là:",
    "options": [
      {
        "text": "$9$",
        "correct": true
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$6$",
        "correct": false
      },
      {
        "text": "$27$",
        "correct": false
      }
    ],
    "explanation": "Tỉ số phóng to cạnh là $k = \\frac{18}{6} = 3$. Tỉ số diện tích của hai hình đồng dạng bằng $k^2 = 3^2 = 9$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tỉ lệ bản đồ địa lí",
    "pts": 20,
    "question": "Trên một bản đồ có tỉ lệ $1 : 100\\,000$, khoảng cách giữa hai điểm A và B là $5\\text{ cm}$. Khoảng cách thực tế giữa hai địa điểm đó là:",
    "options": [
      {
        "text": "$5\\text{ km}$",
        "correct": true
      },
      {
        "text": "$50\\text{ km}$",
        "correct": false
      },
      {
        "text": "$500\\text{ m}$",
        "correct": false
      },
      {
        "text": "$500\\text{ km}$",
        "correct": false
      }
    ],
    "explanation": "Khoảng cách thực tế là $5\\text{ cm} \\times 100\\,000 = 500\\,000\\text{ cm} = 5\\,000\\text{ m} = 5\\text{ km}$."
  },
  {
    "id": 6,
    "title": "Câu 6: Đa giác đều cùng số cạnh",
    "pts": 20,
    "question": "Cặp đa giác nào sau đây luôn đồng dạng với nhau?",
    "options": [
      {
        "text": "Hai lục giác đều",
        "correct": true
      },
      {
        "text": "Hai lục giác bất kì",
        "correct": false
      },
      {
        "text": "Một hình vuông và một hình chữ nhật",
        "correct": false
      },
      {
        "text": "Hai hình bình hành",
        "correct": false
      }
    ],
    "explanation": "Hai đa giác đều có cùng số cạnh luôn đồng dạng với nhau (ví dụ hai tam giác đều, hai hình vuông, hai lục giác đều)."
  },
  {
    "id": 7,
    "title": "Câu 7: Tỉ số chu vi của hai đa giác đồng dạng",
    "pts": 20,
    "question": "Hai đa giác đồng dạng với nhau theo tỉ số $k = \\frac{3}{4}$. Tỉ số chu vi của đa giác thứ nhất so với đa giác thứ hai bằng:",
    "options": [
      {
        "text": "$\\frac{3}{4}$",
        "correct": true
      },
      {
        "text": "$\\frac{9}{16}$",
        "correct": false
      },
      {
        "text": "$\\frac{4}{3}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Tỉ số chu vi của hai đa giác đồng dạng bằng chính tỉ số đồng dạng $k = \\frac{3}{4}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Hình đồng dạng và phép co giãn",
    "pts": 20,
    "question": "Khi thu nhỏ một hình theo tỉ số $k = 0{,}5$, diện tích của hình đó giảm đi bao nhiêu lần?",
    "options": [
      {
        "text": "$4\\text{ lần}$",
        "correct": true
      },
      {
        "text": "$2\\text{ lần}$",
        "correct": false
      },
      {
        "text": "$0{,}5\\text{ lần}$",
        "correct": false
      },
      {
        "text": "$8\\text{ lần}$",
        "correct": false
      }
    ],
    "explanation": "Diện tích giảm đi $k^2 = (0{,}5)^2 = 0{,}25 = \\frac{1}{4}$, tức là giảm đi 4 lần."
  },
  {
    "id": 9,
    "title": "Câu 9: Điểm đối xứng và tâm phối cảnh",
    "pts": 20,
    "question": "Nếu hai hình đối xứng nhau qua một điểm $O$, thì chúng có phải là hai hình đồng dạng phối cảnh không?",
    "options": [
      {
        "text": "Có, là hình đồng dạng phối cảnh với tỉ số $k = 1$ qua tâm $O$",
        "correct": true
      },
      {
        "text": "Không phải",
        "correct": false
      },
      {
        "text": "Chỉ khi là hình tròn",
        "correct": false
      },
      {
        "text": "Chỉ khi là hình vuông",
        "correct": false
      }
    ],
    "explanation": "Phép đối xứng tâm $O$ là một trường hợp đặc biệt của phép đồng dạng phối cảnh với tỉ số $k = 1$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng vẽ kỹ thuật và in ấn",
    "pts": 20,
    "question": "Khổ giấy A3 có kích thước lớn gấp đôi khổ giấy A4 nhưng hai tờ giấy có cùng tỉ lệ giữa chiều dài và chiều rộng (tỉ lệ $1 : \\sqrt{2}$). Hai khổ giấy A3 và A4 là:",
    "options": [
      {
        "text": "Hai hình đồng dạng với nhau",
        "correct": true
      },
      {
        "text": "Hai hình bằng nhau",
        "correct": false
      },
      {
        "text": "Không đồng dạng vì kích thước khác nhau",
        "correct": false
      },
      {
        "text": "Chỉ đồng dạng về chiều dài",
        "correct": false
      }
    ],
    "explanation": "Tiêu chuẩn khổ giấy ISO (A0, A1, A2, A3, A4...) được thiết kế sao cho các hình chữ nhật luôn có cùng tỉ số $\\frac{\\text{dài}}{\\text{rộng}} = \\sqrt{2}$, do đó tất cả các khổ giấy này đều đồng dạng với nhau."
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
                const slider = document.getElementById('sliderK37');
                const valK = document.getElementById('valK37');
                const outEl = document.getElementById('lab1Output37');

                function update() {
                    const k = parseFloat(slider.value);
                    valK.textContent = k;

                    outEl.innerHTML = `<strong>Tâm phối cảnh:</strong> Gốc $O$ &nbsp;|&nbsp; <strong>Tỉ số phối cảnh:</strong> $k = <strong style="color:#34d399;">${k}</strong>$ <br>Mọi đoạn thẳng tương ứng: $A'B' = ${k} \\cdot AB$, $B'C' = ${k} \\cdot BC$. Các đường $AA', BB', CC', DD'$ đồng quy tại $O$.`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const ox = 50, oy = h / 2;

                    // Tâm O
                    ctx.fillStyle = '#ef4444';
                    ctx.beginPath(); ctx.arc(ox, oy, 5, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText('O', ox - 15, oy + 5);

                    // Tứ giác ban đầu H
                    const basePts = [
                        { x: 120, y: oy - 30 },
                        { x: 160, y: oy - 50 },
                        { x: 180, y: oy + 20 },
                        { x: 130, y: oy + 40 }
                    ];

                    ctx.strokeStyle = '#06b6d4';
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    basePts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Tứ giác phóng đại H'
                    const scaledPts = basePts.map(p => ({
                        x: ox + (p.x - ox) * k,
                        y: oy + (p.y - oy) * k
                    }));

                    ctx.strokeStyle = '#f59e0b';
                    ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    scaledPts.forEach((p, i) => { if (i === 0) ctx.moveTo(p.x, p.y); else ctx.lineTo(p.x, p.y); });
                    ctx.closePath();
                    ctx.fill();
                    ctx.stroke();

                    // Vẽ các tia phối cảnh từ O
                    ctx.strokeStyle = '#475569';
                    ctx.setLineDash([4, 4]);
                    scaledPts.forEach(p => {
                        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(p.x, p.y); ctx.stroke();
                    });
                    ctx.setLineDash([]);
                }

                slider.addEventListener('input', update);
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const outEl = document.getElementById('lab2Output37');

                const pairs = {
                    1: { name: "Hai Hình Tròn", result: "LUÔN LUÔN ĐỒNG DẠNG", desc: "Mọi hình tròn đều có hình dạng tuyệt đối giống nhau, tỉ số đồng dạng bằng tỉ số bán kính k = R'/R.", ok: true },
                    2: { name: "Hai Hình Vuông", result: "LUÔN LUÔN ĐỒNG DẠNG", desc: "Mọi hình vuông đều có 4 góc vuông và 4 cạnh bằng nhau, tỉ số cạnh bằng nhau k = a'/a.", ok: true },
                    3: { name: "Hai Hình Chữ Nhật", result: "CHƯA CHẮC ĐỒNG DẠNG", desc: "Chỉ đồng dạng khi tỉ số giữa chiều dài và chiều rộng của hai hình bằng nhau (ví dụ: 2x3 và 4x6).", ok: false }
                };

                function show(id) {
                    const p = pairs[id];
                    outEl.innerHTML = `<strong>Khảo sát: ${p.name}</strong> <br>Kết luận: <strong style="color:${p.ok ? '#34d399' : '#f59e0b'}; font-size:1.1rem;">${p.result}</strong> <br>${p.desc}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    if (id === 1) {
                        ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 3;
                        ctx.beginPath(); ctx.arc(140, h / 2, 40, 0, Math.PI * 2); ctx.stroke();
                        ctx.strokeStyle = '#f59e0b';
                        ctx.beginPath(); ctx.arc(360, h / 2, 70, 0, Math.PI * 2); ctx.stroke();
                    } else if (id === 2) {
                        ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 3;
                        ctx.strokeRect(100, h / 2 - 35, 70, 70);
                        ctx.strokeStyle = '#f59e0b';
                        ctx.strokeRect(300, h / 2 - 60, 120, 120);
                    } else {
                        ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 3;
                        ctx.strokeRect(100, h / 2 - 25, 100, 50);
                        ctx.strokeStyle = '#f59e0b';
                        ctx.strokeRect(300, h / 2 - 50, 80, 100);
                    }
                }

                document.getElementById('btnPair1').addEventListener('click', () => show(1));
                document.getElementById('btnPair2').addEventListener('click', () => show(2));
                document.getElementById('btnPair3').addEventListener('click', () => show(3));
                show(1);
            
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
