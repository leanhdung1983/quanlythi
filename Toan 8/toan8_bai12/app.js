// ================================================================
// BÀI 12: HÌNH BÌNH HÀNH - TOÁN 8 KNTT
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
  userTitle: 'Chiến Tướng Hình Bình Hành 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai12_state';

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
    "title": "Thử Thách 1: Định Nghĩa Hình Bình Hành",
    "pts": 20,
    "question": "Hình bình hành là tứ giác có:",
    "options": [
      {
        "text": "Các cạnh đối song song",
        "correct": true
      },
      {
        "text": "Các góc đối bằng nhau nhưng không song song",
        "correct": false
      },
      {
        "text": "Hai đường chéo vuông góc",
        "correct": false
      },
      {
        "text": "Bốn cạnh bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa SGK: Hình bình hành là tứ giác có các cạnh đối song song."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Tính Chất Về Góc",
    "pts": 20,
    "question": "Trong hình bình hành $ABCD$, nếu $\\widehat{A} = 110^{\\circ}$ thì số đo của góc $\\widehat{C}$ là:",
    "options": [
      {
        "text": "$110^{\\circ}$",
        "correct": true
      },
      {
        "text": "$70^{\\circ}$",
        "correct": false
      },
      {
        "text": "$90^{\\circ}$",
        "correct": false
      },
      {
        "text": "$80^{\\circ}$",
        "correct": false
      }
    ],
    "explanation": "Trong hình bình hành, hai góc đối diện luôn bằng nhau: $\\widehat{C} = \\widehat{A} = 110^{\\circ}$."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Tính Chất Hai Góc Kề",
    "pts": 20,
    "question": "Cho hình bình hành $ABCD$ có $\\widehat{A} = 120^{\\circ}$. Số đo của góc $\\widehat{B}$ là:",
    "options": [
      {
        "text": "$60^{\\circ}$",
        "correct": true
      },
      {
        "text": "$120^{\\circ}$",
        "correct": false
      },
      {
        "text": "$80^{\\circ}$",
        "correct": false
      },
      {
        "text": "$90^{\\circ}$",
        "correct": false
      }
    ],
    "explanation": "Vì $AD \\parallel BC$ nên hai góc kề một cạnh bù nhau: $\\widehat{B} = 180^{\\circ} - \\widehat{A} = 180^{\\circ} - 120^{\\circ} = 60^{\\circ}$."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Tính Chất Hai Đường Chéo",
    "pts": 20,
    "question": "Hai đường chéo của hình bình hành có tính chất nào sau đây?",
    "options": [
      {
        "text": "Cắt nhau tại trung điểm của mỗi đường",
        "correct": true
      },
      {
        "text": "Bằng nhau",
        "correct": false
      },
      {
        "text": "Vuông góc với nhau",
        "correct": false
      },
      {
        "text": "Là đường phân giác của các góc",
        "correct": false
      }
    ],
    "explanation": "Định lí: Trong hình bình hành, hai đường chéo cắt nhau tại trung điểm của mỗi đường."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Dấu Hiệu Nhận Biết Quan Trọng",
    "pts": 20,
    "question": "Tứ giác $ABCD$ có $AB \\parallel CD$ và $AB = CD$. Tứ giác $ABCD$ là:",
    "options": [
      {
        "text": "Hình bình hành",
        "correct": true
      },
      {
        "text": "Hình thang cân",
        "correct": false
      },
      {
        "text": "Hình chữ nhật",
        "correct": false
      },
      {
        "text": "Hình thoi",
        "correct": false
      }
    ],
    "explanation": "Dấu hiệu nhận biết 3: Tứ giác có hai cạnh đối song song và bằng nhau là hình bình hành."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Tìm Chu Vi Hình Bình Hành",
    "pts": 20,
    "question": "Hình bình hành có độ dài hai cạnh kề là $5$ cm và $8$ cm. Chu vi của hình bình hành đó là:",
    "options": [
      {
        "text": "$26$ cm",
        "correct": true
      },
      {
        "text": "$13$ cm",
        "correct": false
      },
      {
        "text": "$40$ cm",
        "correct": false
      },
      {
        "text": "$20$ cm",
        "correct": false
      }
    ],
    "explanation": "Chu vi bằng $2(5 + 8) = 2 \\cdot 13 = 26$ cm."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Cắt Nhau Tại Trung Điểm",
    "pts": 20,
    "question": "Cho tứ giác $ABCD$ có hai đường chéo $AC$ và $BD$ cắt nhau tại $O$. Điều kiện nào sau đây chứng tỏ $ABCD$ là hình bình hành?",
    "options": [
      {
        "text": "$OA = OC$ và $OB = OD$",
        "correct": true
      },
      {
        "text": "$AC = BD$",
        "correct": false
      },
      {
        "text": "$AC \\perp BD$",
        "correct": false
      },
      {
        "text": "$OA = OB$ và $OC = OD$",
        "correct": false
      }
    ],
    "explanation": "Dấu hiệu 5: Tứ giác có hai đường chéo cắt nhau tại trung điểm của mỗi đường là hình bình hành."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Tâm Đối Xứng Của Hình Bình Hành",
    "pts": 20,
    "question": "Hình bình hành có tâm đối xứng là:",
    "options": [
      {
        "text": "Giao điểm của hai đường chéo",
        "correct": true
      },
      {
        "text": "Trung điểm của cạnh đáy",
        "correct": false
      },
      {
        "text": "Trọng tâm tam giác",
        "correct": false
      },
      {
        "text": "Một đỉnh bất kì",
        "correct": false
      }
    ],
    "explanation": "Giao điểm hai đường chéo là tâm đối xứng của hình bình hành."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Nhận Biết Khẳng Định SAI",
    "pts": 20,
    "question": "Khẳng định nào sau đây là SAI đối với hình bình hành?",
    "options": [
      {
        "text": "Hai đường chéo luôn bằng nhau",
        "correct": true
      },
      {
        "text": "Các cạnh đối bằng nhau",
        "correct": false
      },
      {
        "text": "Các góc đối bằng nhau",
        "correct": false
      },
      {
        "text": "Hai đường chéo cắt nhau tại trung điểm mỗi đường",
        "correct": false
      }
    ],
    "explanation": "Hai đường chéo của hình bình hành nói chung không bằng nhau. Chỉ khi nó là hình chữ nhật thì hai đường chéo mới bằng nhau."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Ứng Dụng Hình Bình Hành",
    "pts": 20,
    "question": "Cho tam giác $ABC$. Gọi $M, N$ lần lượt là trung điểm của $AB, AC$. Lấy điểm $P$ sao cho $N$ là trung điểm của $MP$. Tứ giác $AMCP$ là:",
    "options": [
      {
        "text": "Hình bình hành",
        "correct": true
      },
      {
        "text": "Hình thang cân",
        "correct": false
      },
      {
        "text": "Hình thoi",
        "correct": false
      },
      {
        "text": "Hình vuông",
        "correct": false
      }
    ],
    "explanation": "Tứ giác $AMCP$ có hai đường chéo $AC$ và $MP$ cắt nhau tại trung điểm $N$ của mỗi đường nên là hình bình hành."
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
                const shearH = document.getElementById('shearH');
                const dispShear = document.getElementById('dispShear');
                const outEl = document.getElementById('lab1Output');

                function draw() {
                    const sh = parseInt(shearH.value);
                    dispShear.textContent = sh;

                    outEl.innerHTML = `<strong>Tâm đối xứng $O$:</strong> $OA = OC$ và $OB = OD$. Hai đường chéo luôn cắt nhau tại trung điểm của mỗi đường.`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const ox = w / 2;
                    const oy = h / 2;

                    const ax = 120 + sh, ay = 60;
                    const bx = 380 + sh, by = 60;
                    const cx = 380 - sh, cy = 180;
                    const dx = 120 - sh, dy = 180;

                    // Ve hinh binh hanh
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.lineTo(dx, dy);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
                    ctx.fill();
                    ctx.stroke();

                    // 2 duong cheo
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(cx, cy);
                    ctx.moveTo(bx, by); ctx.lineTo(dx, dy);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Tam O
                    const midX = (ax + cx) / 2;
                    const midY = (ay + cy) / 2;
                    ctx.fillStyle = '#10b981';
                    ctx.beginPath();
                    ctx.arc(midX, midY, 6, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText('O (Trung điểm)', midX - 45, midY - 10);

                    // Nhan dinh
                    ctx.fillText('A', ax - 15, ay - 5);
                    ctx.fillText('B', bx + 8, by - 5);
                    ctx.fillText('C', cx + 8, cy + 15);
                    ctx.fillText('D', dx - 15, dy + 15);
                }

                shearH.addEventListener('input', draw);
                draw();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const outEl = document.getElementById('lab2Output');

                const dhs = [
                    { name: 'Dấu hiệu 1', text: 'Tứ giác có các cạnh đối song song: AB // CD và AD // BC', col: '#6366f1' },
                    { name: 'Dấu hiệu 2', text: 'Tứ giác có các cạnh đối bằng nhau: AB = CD và AD = BC', col: '#06b6d4' },
                    { name: 'Dấu hiệu 3', text: 'Tứ giác có hai cạnh đối song song và bằng nhau: AB // CD và AB = CD', col: '#f59e0b' },
                    { name: 'Dấu hiệu 5', text: 'Tứ giác có 2 đường chéo cắt nhau tại trung điểm của mỗi đường: OA = OC và OB = OD', col: '#ec4899' }
                ];

                function showDH(i) {
                    const item = dhs[i];
                    outEl.innerHTML = `<strong>${item.name}:</strong> ${item.text}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = item.col;
                    ctx.fillRect(40, 50, w - 80, 75);

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(item.name.toUpperCase(), w / 2, 75);
                    ctx.font = 'bold 16px Segoe UI';
                    ctx.fillText(item.text, w / 2, 105);
                    ctx.textAlign = 'left';
                }

                document.getElementById('btnDh1').addEventListener('click', () => showDH(0));
                document.getElementById('btnDh2').addEventListener('click', () => showDH(1));
                document.getElementById('btnDh3').addEventListener('click', () => showDH(2));
                document.getElementById('btnDh5').addEventListener('click', () => showDH(3));
                showDH(2);
            
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
