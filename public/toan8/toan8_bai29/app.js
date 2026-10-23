// ================================================================
// BÀI 29: HỆ SỐ GÓC CỦA ĐƯỜNG THẲNG - TOÁN 8 KNTT
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
  userTitle: 'Chuyên Gia Hệ Số Góc 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai29_state';

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
    "title": "Câu 1: Xác định hệ số góc và tung độ gốc",
    "pts": 20,
    "question": "Hệ số góc của đường thẳng $y = -3x + 5$ là:",
    "options": [
      {
        "text": "$-3$",
        "correct": true
      },
      {
        "text": "$5$",
        "correct": false
      },
      {
        "text": "$3$",
        "correct": false
      },
      {
        "text": "$-3x$",
        "correct": false
      }
    ],
    "explanation": "Trong phương trình $y = ax + b$, hệ số $a$ là hệ số góc. Ở đây $a = -3$."
  },
  {
    "id": 2,
    "title": "Câu 2: Góc tạo bởi đường thẳng và Ox",
    "pts": 20,
    "question": "Đường thẳng nào sau đây tạo với trục $Ox$ một <strong>góc nhọn</strong>?",
    "options": [
      {
        "text": "$y = 2x - 1$",
        "correct": true
      },
      {
        "text": "$y = -x + 3$",
        "correct": false
      },
      {
        "text": "$y = -5x$",
        "correct": false
      },
      {
        "text": "$y = -2x - 4$",
        "correct": false
      }
    ],
    "explanation": "Đường thẳng tạo với $Ox$ góc nhọn khi hệ số góc $a > 0$. $y = 2x - 1$ có $a = 2 > 0$."
  },
  {
    "id": 3,
    "title": "Câu 3: Góc tạo bởi đường thẳng có a âm",
    "pts": 20,
    "question": "Đường thẳng $y = -\\sqrt{3}x + 2$ tạo với trục hoành $Ox$ một góc:",
    "options": [
      {
        "text": "Góc tù",
        "correct": true
      },
      {
        "text": "Góc nhọn",
        "correct": false
      },
      {
        "text": "Góc vuông",
        "correct": false
      },
      {
        "text": "Góc bẹt",
        "correct": false
      }
    ],
    "explanation": "Vì hệ số góc $a = -\\sqrt{3} < 0$ nên góc tạo với trục $Ox$ là góc tù ($90^\\circ < \\alpha < 180^\\circ$)."
  },
  {
    "id": 4,
    "title": "Câu 4: Điều kiện hai đường thẳng song song",
    "pts": 20,
    "question": "Đường thẳng $y = 2x + 1$ song song với đường thẳng nào sau đây?",
    "options": [
      {
        "text": "$y = 2x - 5$",
        "correct": true
      },
      {
        "text": "$y = -2x + 1$",
        "correct": false
      },
      {
        "text": "$y = 3x + 1$",
        "correct": false
      },
      {
        "text": "$y = 2x + 1$",
        "correct": false
      }
    ],
    "explanation": "Hai đường thẳng song song khi có cùng hệ số góc $a = a' = 2$ và khác tung độ gốc $b \\neq b'$ ($1 \\neq -5$). Đường $y = 2x + 1$ trùng nhau chứ không song song."
  },
  {
    "id": 5,
    "title": "Câu 5: Điều kiện hai đường thẳng cắt nhau",
    "pts": 20,
    "question": "Hai đường thẳng $y = mx + 2$ và $y = 3x - 1$ cắt nhau khi và chỉ khi:",
    "options": [
      {
        "text": "$m \\neq 3$",
        "correct": true
      },
      {
        "text": "$m = 3$",
        "correct": false
      },
      {
        "text": "$m \\neq 2$",
        "correct": false
      },
      {
        "text": "$m = -3$",
        "correct": false
      }
    ],
    "explanation": "Hai đường thẳng cắt nhau khi và chỉ khi hệ số góc của chúng khác nhau: $m \\neq 3$."
  },
  {
    "id": 6,
    "title": "Câu 6: Tìm tham số để hai đường thẳng song song",
    "pts": 20,
    "question": "Tìm giá trị của $m$ để hai đường thẳng $y = (m - 1)x + 2$ và $y = 3x + 5$ song song với nhau:",
    "options": [
      {
        "text": "$m = 4$",
        "correct": true
      },
      {
        "text": "$m = 3$",
        "correct": false
      },
      {
        "text": "$m = 2$",
        "correct": false
      },
      {
        "text": "$m = -4$",
        "correct": false
      }
    ],
    "explanation": "Để hai đường thẳng song song: $a = a' \\iff m - 1 = 3 \\iff m = 4$ (và tung độ gốc $2 \\neq 5$ đã thỏa mãn)."
  },
  {
    "id": 7,
    "title": "Câu 7: Tìm tọa độ giao điểm",
    "pts": 20,
    "question": "Tọa độ giao điểm của hai đường thẳng $y = x + 1$ và $y = 2x - 1$ là:",
    "options": [
      {
        "text": "$(2; 3)$",
        "correct": true
      },
      {
        "text": "$(1; 2)$",
        "correct": false
      },
      {
        "text": "$(3; 4)$",
        "correct": false
      },
      {
        "text": "$(0; 1)$",
        "correct": false
      }
    ],
    "explanation": "Phương trình hoành độ giao điểm: $x + 1 = 2x - 1 \\iff x = 2$. Thay vào tìm được $y = 2 + 1 = 3$. Tọa độ giao điểm là $(2; 3)$."
  },
  {
    "id": 8,
    "title": "Câu 8: Hai đường thẳng cắt nhau tại trục tung",
    "pts": 20,
    "question": "Hai đường thẳng $y = 2x + k$ và $y = -3x + 4$ cắt nhau tại một điểm trên trục tung khi:",
    "options": [
      {
        "text": "$k = 4$",
        "correct": true
      },
      {
        "text": "$k = 2$",
        "correct": false
      },
      {
        "text": "$k = -3$",
        "correct": false
      },
      {
        "text": "$k \\neq 4$",
        "correct": false
      }
    ],
    "explanation": "Giao điểm nằm trên trục tung khi chúng có cùng tung độ gốc: $b_1 = b_2 \\iff k = 4$ (và hệ số góc $2 \\neq -3$ đã đảm bảo cắt nhau)."
  },
  {
    "id": 9,
    "title": "Câu 9: Đường thẳng có góc 45 độ",
    "pts": 20,
    "question": "Đường thẳng tạo với chiều dương trục hoành $Ox$ một góc $45^\\circ$ có hệ số góc bằng bao nhiêu?",
    "options": [
      {
        "text": "$1$",
        "correct": true
      },
      {
        "text": "$\\sqrt{3}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$-1$",
        "correct": false
      }
    ],
    "explanation": "Hệ số góc $a = \\tan(45^\\circ) = 1$."
  },
  {
    "id": 10,
    "title": "Câu 10: Hai đường thẳng vuông góc",
    "pts": 20,
    "question": "Đường thẳng nào sau đây vuông góc với đường thẳng $y = 2x + 1$?",
    "options": [
      {
        "text": "$y = -\\frac{1}{2}x + 3$",
        "correct": true
      },
      {
        "text": "$y = -2x + 1$",
        "correct": false
      },
      {
        "text": "$y = \\frac{1}{2}x - 2$",
        "correct": false
      },
      {
        "text": "$y = 2x - 3$",
        "correct": false
      }
    ],
    "explanation": "Hai đường thẳng vuông góc khi tích hai hệ số góc bằng $-1$: $a \\cdot a' = -1 \\implies a' = -\\frac{1}{a} = -\\frac{1}{2}$."
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
                const sA = document.getElementById('sliderA29');
                const valA = document.getElementById('valA29');
                const outEl = document.getElementById('lab1Output29');

                function update() {
                    const a = parseFloat(sA.value);
                    valA.textContent = a;

                    let rad = Math.atan(a);
                    let deg = rad * (180 / Math.PI);
                    if (deg < 0) deg += 180;
                    const degDisplay = deg.toFixed(1);

                    const type = (deg < 90) ? 'Góc nhọn' : (deg > 90 ? 'Góc tù' : 'Góc vuông');

                    outEl.innerHTML = `<strong>Hệ số góc:</strong> $a = ${a}$ &nbsp;|&nbsp; <strong>Góc tạo với trục $Ox$:</strong> <strong style="color:#38bdf8;">$\\alpha \\approx ${degDisplay}^\\circ$ (${type})</strong>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const ox = w / 2;
                    const oy = h / 2 + 20;
                    const scale = 30;

                    // Trục Ox
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(40, oy); ctx.lineTo(w - 40, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, h - 20); ctx.lineTo(ox, 20); ctx.stroke();

                    // Đường thẳng y = ax qua gốc O
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ox - 6 * scale, oy - (-6 * a) * scale);
                    ctx.lineTo(ox + 6 * scale, oy - (6 * a) * scale);
                    ctx.stroke();

                    // Cung góc alpha
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.arc(ox, oy, 35, 0, -rad, a < 0);
                    ctx.stroke();

                    ctx.fillStyle = '#06b6d4';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText(`α = ${degDisplay}°`, ox + 45, oy - 10);
                }

                sA.addEventListener('input', update);
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const inA1 = document.getElementById('inA1');
                const inB1 = document.getElementById('inB1');
                const inA2 = document.getElementById('inA2');
                const inB2 = document.getElementById('inB2');
                const outEl = document.getElementById('lab2Output29');

                function draw() {
                    const a1 = parseFloat(inA1.value) || 0;
                    const b1 = parseFloat(inB1.value) || 0;
                    const a2 = parseFloat(inA2.value) || 0;
                    const b2 = parseFloat(inB2.value) || 0;

                    let rel = '';
                    if (a1 === a2) {
                        if (b1 === b2) rel = '<span style="color:#f59e0b; font-weight:bold;">TRÙNG NHAU (a₁ = a₂ và b₁ = b₂)</span>';
                        else rel = '<span style="color:#10b981; font-weight:bold;">SONG SONG NHAU (a₁ = a₂ và b₁ ≠ b₂)</span>';
                    } else {
                        const x0 = (b2 - b1) / (a1 - a2);
                        const y0 = a1 * x0 + b1;
                        rel = `<span style="color:#38bdf8; font-weight:bold;">CẮT NHAU tại M(${x0.toFixed(2)}; ${y0.toFixed(2)})</span> (do $a_1 \\neq a_2$)`;
                    }

                    outEl.innerHTML = `<strong>Đường 1:</strong> $y = ${a1}x + (${b1})$ &nbsp;|&nbsp; <strong>Đường 2:</strong> $y = ${a2}x + (${b2})$ <br><strong>Vị trí tương đối:</strong> ${rel}`;
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
                    const scale = 22;

                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 1.5;
                    ctx.beginPath(); ctx.moveTo(20, oy); ctx.lineTo(w - 20, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, h - 20); ctx.lineTo(ox, 20); ctx.stroke();

                    // Đường 1: cyan
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(ox - 6 * scale, oy - (a1 * -6 + b1) * scale);
                    ctx.lineTo(ox + 6 * scale, oy - (a1 * 6 + b1) * scale);
                    ctx.stroke();

                    // Đường 2: amber
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(ox - 6 * scale, oy - (a2 * -6 + b2) * scale);
                    ctx.lineTo(ox + 6 * scale, oy - (a2 * 6 + b2) * scale);
                    ctx.stroke();
                }

                [inA1, inB1, inA2, inB2].forEach(el => el.addEventListener('input', draw));
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
