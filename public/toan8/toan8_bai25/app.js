// ================================================================
// BÀI 25: PHƯƠNG TRÌNH BẬC NHẤT MỘT ẨN - TOÁN 8 KNTT
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
  userTitle: 'Bậc Thầy Giải Phương Trình 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai25_state';

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
    "title": "Câu 1: Nhận biết phương trình bậc nhất một ẩn",
    "pts": 20,
    "question": "Phương trình nào sau đây là phương trình bậc nhất một ẩn?",
    "options": [
      {
        "text": "$2x - 5 = 0$",
        "correct": true
      },
      {
        "text": "$x^2 - 4 = 0$",
        "correct": false
      },
      {
        "text": "$0x + 3 = 0$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{x} + 2 = 0$",
        "correct": false
      }
    ],
    "explanation": "Phương trình bậc nhất một ẩn có dạng $ax + b = 0$ với $a \\neq 0$. $2x - 5 = 0$ có $a = 2 \\neq 0, b = -5$."
  },
  {
    "id": 2,
    "title": "Câu 2: Nghiệm của phương trình cơ bản",
    "pts": 20,
    "question": "Nghiệm của phương trình $3x - 12 = 0$ là:",
    "options": [
      {
        "text": "$x = 4$",
        "correct": true
      },
      {
        "text": "$x = -4$",
        "correct": false
      },
      {
        "text": "$x = 9$",
        "correct": false
      },
      {
        "text": "$x = 36$",
        "correct": false
      }
    ],
    "explanation": "Chuyển vế: $3x = 12 \\iff x = 12 : 3 = 4$."
  },
  {
    "id": 3,
    "title": "Câu 3: Quy tắc chuyển vế đổi dấu",
    "pts": 20,
    "question": "Khi chuyển số hạng $+5$ từ vế trái sang vế phải của phương trình $2x + 5 = 11$, ta thu được:",
    "options": [
      {
        "text": "$2x = 11 - 5$",
        "correct": true
      },
      {
        "text": "$2x = 11 + 5$",
        "correct": false
      },
      {
        "text": "$2x = -11 - 5$",
        "correct": false
      },
      {
        "text": "$2x = 5 - 11$",
        "correct": false
      }
    ],
    "explanation": "Theo quy tắc chuyển vế, khi chuyển $+5$ sang vế phải ta phải đổi dấu thành $-5$, tức là $2x = 11 - 5$."
  },
  {
    "id": 4,
    "title": "Câu 4: Giải phương trình có hệ số âm",
    "pts": 20,
    "question": "Nghiệm của phương trình $-4x + 8 = 0$ là:",
    "options": [
      {
        "text": "$x = 2$",
        "correct": true
      },
      {
        "text": "$x = -2$",
        "correct": false
      },
      {
        "text": "$x = 4$",
        "correct": false
      },
      {
        "text": "$x = -4$",
        "correct": false
      }
    ],
    "explanation": "$-4x = -8 \\iff x = \\frac{-8}{-4} = 2$."
  },
  {
    "id": 5,
    "title": "Câu 5: Giải phương trình có dấu ngoặc",
    "pts": 20,
    "question": "Giải phương trình $2(x - 3) = 4$:",
    "options": [
      {
        "text": "$x = 5$",
        "correct": true
      },
      {
        "text": "$x = 1$",
        "correct": false
      },
      {
        "text": "$x = 7$",
        "correct": false
      },
      {
        "text": "$x = -1$",
        "correct": false
      }
    ],
    "explanation": "Cách 1: $x - 3 = 4 : 2 = 2 \\iff x = 5$. Cách 2: $2x - 6 = 4 \\iff 2x = 10 \\iff x = 5$."
  },
  {
    "id": 6,
    "title": "Câu 6: Phương trình chứa ẩn ở cả hai vế",
    "pts": 20,
    "question": "Nghiệm của phương trình $5x - 7 = 2x + 8$ là:",
    "options": [
      {
        "text": "$x = 5$",
        "correct": true
      },
      {
        "text": "$x = 3$",
        "correct": false
      },
      {
        "text": "$x = 1$",
        "correct": false
      },
      {
        "text": "$x = -5$",
        "correct": false
      }
    ],
    "explanation": "Chuyển vế: $5x - 2x = 8 + 7 \\iff 3x = 15 \\iff x = 5$."
  },
  {
    "id": 7,
    "title": "Câu 7: Khử mẫu số trong phương trình",
    "pts": 20,
    "question": "Giải phương trình $\\frac{x - 1}{2} = \\frac{x + 1}{3}$:",
    "options": [
      {
        "text": "$x = 5$",
        "correct": true
      },
      {
        "text": "$x = -5$",
        "correct": false
      },
      {
        "text": "$x = 1$",
        "correct": false
      },
      {
        "text": "$x = 3$",
        "correct": false
      }
    ],
    "explanation": "Nhân chéo (hoặc quy đồng mẫu 6): $3(x - 1) = 2(x + 1) \\iff 3x - 3 = 2x + 2 \\iff 3x - 2x = 2 + 3 \\iff x = 5$."
  },
  {
    "id": 8,
    "title": "Câu 8: Nhận diện phương trình vô nghiệm",
    "pts": 20,
    "question": "Phương trình nào sau đây là phương trình <strong>vô nghiệm</strong>?",
    "options": [
      {
        "text": "$2(x + 1) = 2x + 5$",
        "correct": true
      },
      {
        "text": "$2(x + 1) = 2x + 2$",
        "correct": false
      },
      {
        "text": "$2x = 0$",
        "correct": false
      },
      {
        "text": "$3x - 1 = 2$",
        "correct": false
      }
    ],
    "explanation": "Khai triển $2x + 2 = 2x + 5 \\iff 2x - 2x = 5 - 2 \\iff 0x = 3$. Không có giá trị nào của $x$ thỏa mãn đẳng thức $0 = 3$, nên phương trình vô nghiệm."
  },
  {
    "id": 9,
    "title": "Câu 9: Tìm m để phương trình nhận x = 2 làm nghiệm",
    "pts": 20,
    "question": "Tìm giá trị của tham số $m$ để phương trình $3x - m = 4$ có nghiệm $x = 2$:",
    "options": [
      {
        "text": "$m = 2$",
        "correct": true
      },
      {
        "text": "$m = -2$",
        "correct": false
      },
      {
        "text": "$m = 6$",
        "correct": false
      },
      {
        "text": "$m = 10$",
        "correct": false
      }
    ],
    "explanation": "Thay $x = 2$ vào phương trình: $3(2) - m = 4 \\iff 6 - m = 4 \\iff m = 6 - 4 = 2$."
  },
  {
    "id": 10,
    "title": "Câu 10: Hai phương trình tương đương",
    "pts": 20,
    "question": "Hai phương trình được gọi là <strong>tương đương</strong> khi nào?",
    "options": [
      {
        "text": "Khi chúng có cùng tập nghiệm",
        "correct": true
      },
      {
        "text": "Khi chúng có cùng bậc",
        "correct": false
      },
      {
        "text": "Khi chúng có cùng hệ số $a$",
        "correct": false
      },
      {
        "text": "Khi chúng có cùng số nghiệm",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa SGK, hai phương trình được gọi là tương đương nếu chúng có cùng tập nghiệm (kí hiệu là $\\iff$)."
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
                const inA = document.getElementById('sliderA25');
                const inB = document.getElementById('sliderB25');
                const valA = document.getElementById('valA25');
                const valB = document.getElementById('valB25');
                const outEl = document.getElementById('lab1Output25');

                function update() {
                    const a = parseInt(inA.value);
                    const b = parseInt(inB.value);
                    valA.textContent = a;
                    valB.textContent = b;

                    let solText = '';
                    if (a === 0) {
                        if (b === 0) solText = '<span style="color:#f59e0b; font-weight:bold;">Phương trình 0x + 0 = 0 có VÔ SỐ NGHIỆM!</span>';
                        else solText = '<span style="color:#ef4444; font-weight:bold;">Phương trình 0x = ' + (-b) + ' VÔ NGHIỆM!</span>';
                    } else {
                        const root = -b / a;
                        const rootDisplay = Number.isInteger(root) ? root : root.toFixed(2);
                        solText = `Chuyển vế: $${a}x = ${-b}$ &nbsp;$\\implies$ Nghiệm duy nhất: <strong style="color:#34d399; font-size:1.15rem;">$x = ${rootDisplay}$</strong>`;
                    }

                    outEl.innerHTML = `<strong>Phương trình:</strong> $${a}x + (${b}) = 0$ &nbsp;|&nbsp; ${solText}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Trụ cân
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 5;
                    ctx.beginPath();
                    ctx.moveTo(w / 2, h - 30);
                    ctx.lineTo(w / 2, 70);
                    ctx.stroke();

                    // Đòn cân luôn thăng bằng vì là phương trình đẳng thức
                    ctx.strokeStyle = '#10b981';
                    ctx.lineWidth = 6;
                    ctx.beginPath();
                    ctx.moveTo(w / 2 - 160, 70);
                    ctx.lineTo(w / 2 + 160, 70);
                    ctx.stroke();

                    // Đĩa trái: ax + b
                    ctx.fillStyle = '#1e293b';
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(w / 2 - 210, 95, 100, 50);
                    ctx.fillRect(w / 2 - 210, 95, 100, 50);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(`${a}x + (${b})`, w / 2 - 160, 126);

                    // Đĩa phải: 0
                    ctx.strokeStyle = '#f59e0b';
                    ctx.strokeRect(w / 2 + 110, 95, 100, 50);
                    ctx.fillRect(w / 2 + 110, 95, 100, 50);
                    ctx.fillStyle = '#f59e0b';
                    ctx.font = 'bold 22px Segoe UI';
                    ctx.fillText('0', w / 2 + 160, 128);

                    // Nghiệm x trực quan
                    if (a !== 0) {
                        const root = -b / a;
                        ctx.fillStyle = '#34d399';
                        ctx.font = 'bold 16px Segoe UI';
                        ctx.fillText(`Giá trị cân bằng: x = ${Number.isInteger(root) ? root : root.toFixed(2)}`, w / 2, 185);
                    }
                }

                [inA, inB].forEach(el => el.addEventListener('input', update));
                update();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const inK = document.getElementById('inK25');
                const inM = document.getElementById('inM25');
                const outEl = document.getElementById('lab2Output25');

                function draw() {
                    const k = parseInt(inK.value) || 0;
                    const m = parseInt(inM.value) || 0;

                    // k(x - 1) + m = 2x + 4
                    // kx - k + m = 2x + 4
                    // (k - 2)x = 4 + k - m
                    const coeffX = k - 2;
                    const constRight = 4 + k - m;

                    let step3 = '';
                    if (coeffX === 0) {
                        if (constRight === 0) step3 = 'Phương trình vô số nghiệm.';
                        else step3 = 'Phương trình vô nghiệm.';
                    } else {
                        const sol = (constRight / coeffX).toFixed(2);
                        step3 = `Nghiệm duy nhất: $x = \\frac{${constRight}}{${coeffX}} \\approx ${sol}$`;
                    }

                    outEl.innerHTML = `<strong>Bước 1:</strong> Phá ngoặc: $${k}x - ${k} + ${m} = 2x + 4$ <br><strong>Bước 2:</strong> Chuyển vế: $(${k} - 2)x = 4 + ${k} - ${m} \\iff ${coeffX}x = ${constRight}$ <br><strong>Bước 3:</strong> ${step3}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#38bdf8';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('3 BƯỚC GIẢI PHƯƠNG TRÌNH CHUẨN MỰC:', 40, 40);

                    const steps = [
                        { b: '1. Phá ngoặc', d: `${k}x + (${m - k}) = 2x + 4` },
                        { b: '2. Chuyển vế', d: `${coeffX}x = ${constRight}` },
                        { b: '3. Nghiệm x', d: coeffX !== 0 ? `x = ${(constRight / coeffX).toFixed(2)}` : 'Đặc biệt' }
                    ];

                    steps.forEach((s, idx) => {
                        const boxX = 40 + idx * 180;
                        ctx.fillStyle = '#1e293b';
                        ctx.strokeStyle = '#6366f1';
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.roundRect(boxX, 70, 160, 80, 8);
                        ctx.fill();
                        ctx.stroke();

                        ctx.fillStyle = '#f59e0b';
                        ctx.font = 'bold 13px Segoe UI';
                        ctx.textAlign = 'center';
                        ctx.fillText(s.b, boxX + 80, 95);

                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 14px Segoe UI';
                        ctx.fillText(s.d, boxX + 80, 125);
                    });
                }

                [inK, inM].forEach(el => el.addEventListener('input', draw));
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
