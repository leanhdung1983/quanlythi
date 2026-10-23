// ================================================================
// BÀI 16: ĐƯỜNG TRUNG BÌNH CỦA TAM GIÁC - TOÁN 8 KNTT
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
  userTitle: 'Chiến Binh Đường Trung Bình 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai16_state';

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
    "title": "Thử Thách 1: Định Nghĩa Đường Trung Bình",
    "pts": 20,
    "question": "Đường trung bình của tam giác là đoạn thẳng nối:",
    "options": [
      {
        "text": "Trung điểm hai cạnh của tam giác",
        "correct": true
      },
      {
        "text": "Đỉnh với trung điểm cạnh đối diện",
        "correct": false
      },
      {
        "text": "Trọng tâm với trực tâm",
        "correct": false
      },
      {
        "text": "Hai điểm bất kì trên hai cạnh",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa SGK: Đường trung bình của tam giác là đoạn thẳng nối trung điểm hai cạnh của tam giác đó."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Tính Chất Độ Dài",
    "pts": 20,
    "question": "Cho tam giác $ABC$ có $BC = 14$ cm. Độ dài đường trung bình $MN$ song song với $BC$ là:",
    "options": [
      {
        "text": "$7$ cm",
        "correct": true
      },
      {
        "text": "$14$ cm",
        "correct": false
      },
      {
        "text": "$28$ cm",
        "correct": false
      },
      {
        "text": "$3{,}5$ cm",
        "correct": false
      }
    ],
    "explanation": "Đường trung bình bằng nửa cạnh đáy tương ứng: $MN = \\frac{1}{2}BC = \\frac{1}{2} \\cdot 14 = 7$ cm."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Tính Chất Vị Trí Song Song",
    "pts": 20,
    "question": "Đường trung bình của tam giác có tính chất hình học nào sau đây?",
    "options": [
      {
        "text": "Song song với cạnh thứ ba và bằng nửa cạnh ấy",
        "correct": true
      },
      {
        "text": "Vuông góc với cạnh thứ ba",
        "correct": false
      },
      {
        "text": "Bằng cạnh thứ ba",
        "correct": false
      },
      {
        "text": "Đi qua trực tâm tam giác",
        "correct": false
      }
    ],
    "explanation": "Định lí 2: Đường trung bình của tam giác song song với cạnh thứ ba và bằng nửa cạnh ấy."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Số Lượng Đường Trung Bình",
    "pts": 20,
    "question": "Trong một tam giác có bao nhiêu đường trung bình?",
    "options": [
      {
        "text": "$3$ đường trung bình",
        "correct": true
      },
      {
        "text": "$1$ đường trung bình",
        "correct": false
      },
      {
        "text": "$2$ đường trung bình",
        "correct": false
      },
      {
        "text": "$4$ đường trung bình",
        "correct": false
      }
    ],
    "explanation": "Vì tam giác có 3 cạnh nên có 3 cặp trung điểm, do đó có 3 đường trung bình."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Chu Vi Tam Giác Trung Bình",
    "pts": 20,
    "question": "Tam giác $ABC$ có chu vi bằng $24$ cm. Chu vi của tam giác tạo bởi ba đường trung bình của tam giác $ABC$ là:",
    "options": [
      {
        "text": "$12$ cm",
        "correct": true
      },
      {
        "text": "$6$ cm",
        "correct": false
      },
      {
        "text": "$48$ cm",
        "correct": false
      },
      {
        "text": "$18$ cm",
        "correct": false
      }
    ],
    "explanation": "Mỗi cạnh của tam giác trung bình bằng nửa cạnh tam giác lớn nên chu vi của nó bằng một nửa chu vi tam giác lớn: $24 : 2 = 12$ cm."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Định Lí 1 Về Trung Điểm",
    "pts": 20,
    "question": "Cho $\\Delta ABC$. Gọi $D$ là trung điểm $AB$. Qua $D$ kẻ đường thẳng song song với $BC$ cắt $AC$ tại $E$. Điểm $E$ là:",
    "options": [
      {
        "text": "Trung điểm của cạnh $AC$",
        "correct": true
      },
      {
        "text": "Điểm bất kì trên $AC$",
        "correct": false
      },
      {
        "text": "Trọng tâm tam giác",
        "correct": false
      },
      {
        "text": "Giao điểm của phân giác",
        "correct": false
      }
    ],
    "explanation": "Theo Định lí 1: Đường thẳng đi qua trung điểm một cạnh của tam giác và song song với cạnh thứ hai thì đi qua trung điểm cạnh thứ ba."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Tìm Độ Dài Cạnh Đáy",
    "pts": 20,
    "question": "Đoạn thẳng nối trung điểm hai cạnh $AB$ và $AC$ của tam giác $ABC$ dài $4{,}5$ cm. Độ dài cạnh $BC$ là:",
    "options": [
      {
        "text": "$9$ cm",
        "correct": true
      },
      {
        "text": "$4{,}5$ cm",
        "correct": false
      },
      {
        "text": "$2{,}25$ cm",
        "correct": false
      },
      {
        "text": "$13{,}5$ cm",
        "correct": false
      }
    ],
    "explanation": "Cạnh đáy bằng gấp đôi đường trung bình: $BC = 2 \\cdot 4{,}5 = 9$ cm."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Diện Tích Tam Giác Trung Bình",
    "pts": 20,
    "question": "Tam giác $ABC$ có diện tích bằng $40$ cm². Diện tích của tam giác tạo bởi ba đường trung bình là:",
    "options": [
      {
        "text": "$10$ cm²",
        "correct": true
      },
      {
        "text": "$20$ cm²",
        "correct": false
      },
      {
        "text": "$5$ cm²",
        "correct": false
      },
      {
        "text": "$8$ cm²",
        "correct": false
      }
    ],
    "explanation": "Diện tích tam giác tạo bởi ba đường trung bình bằng $\\frac{1}{4}$ diện tích tam giác ban đầu: $40 : 4 = 10$ cm²."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Nối Trung Điểm 4 Cạnh Tứ Giác Bất Kì",
    "pts": 20,
    "question": "Tứ giác có các đỉnh là trung điểm bốn cạnh của một tứ giác bất kì luôn là:",
    "options": [
      {
        "text": "Hình bình hành",
        "correct": true
      },
      {
        "text": "Hình chữ nhật",
        "correct": false
      },
      {
        "text": "Hình thoi",
        "correct": false
      },
      {
        "text": "Hình thang cân",
        "correct": false
      }
    ],
    "explanation": "Định lí Varignon: Các cạnh đối của tứ giác mới là các đường trung bình của hai tam giác tạo bởi đường chéo, nên chúng song song và bằng nửa đường chéo ấy $\\implies$ là hình bình hành."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Ứng Dụng Đo Khoảng Cách",
    "pts": 20,
    "question": "Để đo khoảng cách giữa hai cái cây $A$ và $B$ bị ngăn cách bởi một ao nước, bạn Nam chọn điểm $C$ trên bờ, lấy trung điểm $M$ của $CA$ và $N$ của $CB$. Bạn Nam đo được $MN = 18$ m. Khoảng cách giữa hai cây $AB$ là:",
    "options": [
      {
        "text": "$36$ m",
        "correct": true
      },
      {
        "text": "$18$ m",
        "correct": false
      },
      {
        "text": "$9$ m",
        "correct": false
      },
      {
        "text": "$27$ m",
        "correct": false
      }
    ],
    "explanation": "$MN$ là đường trung bình của $\\Delta CAB$ nên $AB = 2 \\cdot MN = 2 \\cdot 18 = 36$ m."
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
                const outEl = document.getElementById('lab1Output');
                const btnReset = document.getElementById('btnResetTri');

                let pts = [
                    { x: 300, y: 40, name: 'A' },
                    { x: 100, y: 190, name: 'B' },
                    { x: 500, y: 190, name: 'C' }
                ];
                let dragIdx = -1;

                function draw() {
                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const A = pts[0], B = pts[1], C = pts[2];

                    // Trung diem D (tren AB) va E (tren AC)
                    const D = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
                    const E = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };

                    const lenBC = Math.hypot(C.x - B.x, C.y - B.y);
                    const lenDE = Math.hypot(E.x - D.x, E.y - D.y);

                    outEl.innerHTML = `
                        <strong>Độ dài đáy $BC$:</strong> $${Math.round(lenBC)}$ px &nbsp;|&nbsp; 
                        <strong>Độ dài đường trung bình $DE$:</strong> $${Math.round(lenDE)}$ px &nbsp;|&nbsp; 
                        <strong>Tỉ số $DE / BC$:</strong> $\\mathbf{${(lenDE / lenBC).toFixed(2)}} = \\frac{1}{2}$
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    // Tam giac ABC
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
                    ctx.fill();
                    ctx.stroke();

                    // Duong trung binh DE
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(D.x, D.y); ctx.lineTo(E.x, E.y);
                    ctx.stroke();

                    // Nhan
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('A', A.x - 5, A.y - 10);
                    ctx.fillText('B', B.x - 18, B.y + 10);
                    ctx.fillText('C', C.x + 10, C.y + 10);
                    ctx.fillStyle = '#10b981';
                    ctx.fillText('D', D.x - 18, D.y);
                    ctx.fillText('E', E.x + 10, E.y);

                    // Diem
                    [A, B, C].forEach(p => {
                        ctx.fillStyle = '#6366f1';
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                        ctx.fill();
                    });
                    [D, E].forEach(p => {
                        ctx.fillStyle = '#10b981';
                        ctx.beginPath();
                        ctx.arc(p.x, p.y, 6, 0, Math.PI * 2);
                        ctx.fill();
                    });
                }

                canvas.addEventListener('mousedown', (e) => {
                    const rect = canvas.getBoundingClientRect();
                    const mx = e.clientX - rect.left;
                    const my = e.clientY - rect.top;
                    pts.forEach((p, i) => {
                        if (Math.hypot(p.x - mx, p.y - my) < 15) dragIdx = i;
                    });
                });
                window.addEventListener('mousemove', (e) => {
                    if (dragIdx >= 0) {
                        const rect = canvas.getBoundingClientRect();
                        pts[dragIdx].x = Math.max(30, Math.min(canvas.width - 30, e.clientX - rect.left));
                        pts[dragIdx].y = Math.max(30, Math.min(canvas.height - 30, e.clientY - rect.top));
                        draw();
                    }
                });
                window.addEventListener('mouseup', () => { dragIdx = -1; });

                btnReset.addEventListener('click', () => {
                    pts = [
                        { x: 300, y: 40, name: 'A' },
                        { x: 100, y: 190, name: 'B' },
                        { x: 500, y: 190, name: 'C' }
                    ];
                    draw();
                });
                draw();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const btn = document.getElementById('btnToggleShade');
                const outEl = document.getElementById('lab2Output');
                let shaded = true;

                function render() {
                    outEl.innerHTML = `<strong>Định lí diện tích:</strong> Diện tích mỗi tam giác con bằng $\\frac{1}{4}$ diện tích tam giác lớn: $S_1 = S_2 = S_3 = S_4 = \\frac{1}{4} S_{ABC}$.`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const A = { x: w / 2, y: 35 };
                    const B = { x: 120, y: 190 };
                    const C = { x: w - 120, y: 190 };

                    const D = { x: (A.x + B.x) / 2, y: (A.y + B.y) / 2 };
                    const E = { x: (A.x + C.x) / 2, y: (A.y + C.y) / 2 };
                    const F = { x: (B.x + C.x) / 2, y: (B.y + C.y) / 2 };

                    if (shaded) {
                        const tris = [
                            { pts: [A, D, E], col: 'rgba(6, 182, 212, 0.4)', n: 'S₁' },
                            { pts: [D, B, F], col: 'rgba(99, 102, 241, 0.4)', n: 'S₂' },
                            { pts: [E, F, C], col: 'rgba(245, 158, 11, 0.4)', n: 'S₃' },
                            { pts: [D, E, F], col: 'rgba(16, 185, 129, 0.4)', n: 'S₄' }
                        ];
                        tris.forEach(t => {
                            ctx.fillStyle = t.col;
                            ctx.beginPath();
                            ctx.moveTo(t.pts[0].x, t.pts[0].y);
                            ctx.lineTo(t.pts[1].x, t.pts[1].y);
                            ctx.lineTo(t.pts[2].x, t.pts[2].y);
                            ctx.closePath();
                            ctx.fill();

                            ctx.fillStyle = '#fff';
                            ctx.font = 'bold 16px Segoe UI';
                            const cx = (t.pts[0].x + t.pts[1].x + t.pts[2].x) / 3;
                            const cy = (t.pts[0].y + t.pts[1].y + t.pts[2].y) / 3;
                            ctx.fillText(t.n, cx - 10, cy + 5);
                        });
                    }

                    // Khung tam giac lon
                    ctx.strokeStyle = '#f8fafc';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.lineTo(C.x, C.y);
                    ctx.closePath();
                    ctx.stroke();

                    // 3 duong trung binh
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(D.x, D.y); ctx.lineTo(E.x, E.y); ctx.lineTo(F.x, F.y); ctx.lineTo(D.x, D.y);
                    ctx.stroke();
                }

                btn.addEventListener('click', () => {
                    shaded = !shaded;
                    render();
                });
                render();
            
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
