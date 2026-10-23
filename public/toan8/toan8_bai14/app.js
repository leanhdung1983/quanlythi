// ================================================================
// BÀI 14: HÌNH THOI VÀ HÌNH VUÔNG - TOÁN 8 KNTT
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
  userTitle: 'Vương Giả Hình Vuông 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai14_state';

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
    "title": "Thử Thách 1: Định Nghĩa Hình Thoi",
    "pts": 20,
    "question": "Hình thoi là tứ giác có:",
    "options": [
      {
        "text": "Bốn cạnh bằng nhau",
        "correct": true
      },
      {
        "text": "Bốn góc bằng nhau",
        "correct": false
      },
      {
        "text": "Hai đường chéo bằng nhau",
        "correct": false
      },
      {
        "text": "Hai cạnh đối song song nhưng không bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa SGK: Hình thoi là tứ giác có bốn cạnh bằng nhau."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Tính Chất Đường Chéo Hình Thoi",
    "pts": 20,
    "question": "Hai đường chéo của hình thoi có tính chất đặc trưng nào?",
    "options": [
      {
        "text": "Vuông góc với nhau và là các đường phân giác của các góc",
        "correct": true
      },
      {
        "text": "Bằng nhau và vuông góc với nhau",
        "correct": false
      },
      {
        "text": "Song song với nhau",
        "correct": false
      },
      {
        "text": "Chỉ cắt nhau tại trung điểm nhưng không vuông góc",
        "correct": false
      }
    ],
    "explanation": "Trong hình thoi, hai đường chéo vuông góc với nhau và là đường phân giác các góc của hình thoi."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Định Nghĩa Hình Vuông",
    "pts": 20,
    "question": "Hình vuông là tứ giác có:",
    "options": [
      {
        "text": "Bốn góc vuông và bốn cạnh bằng nhau",
        "correct": true
      },
      {
        "text": "Bốn góc vuông",
        "correct": false
      },
      {
        "text": "Bốn cạnh bằng nhau",
        "correct": false
      },
      {
        "text": "Hai đường chéo vuông góc",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa: Hình vuông là tứ giác có bốn góc vuông và bốn cạnh bằng nhau."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Dấu Hiệu Từ Hình Chữ Nhật Sang Hình Vuông",
    "pts": 20,
    "question": "Hình chữ nhật trở thành hình vuông khi có thêm điều kiện nào sau đây?",
    "options": [
      {
        "text": "Hai đường chéo vuông góc với nhau",
        "correct": true
      },
      {
        "text": "Hai đường chéo bằng nhau",
        "correct": false
      },
      {
        "text": "Có bốn góc vuông",
        "correct": false
      },
      {
        "text": "Hai cạnh đối song song",
        "correct": false
      }
    ],
    "explanation": "Hình chữ nhật có 2 đường chéo vuông góc (hoặc có 2 cạnh kề bằng nhau) là hình vuông."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Dấu Hiệu Từ Hình Thoi Sang Hình Vuông",
    "pts": 20,
    "question": "Hình thoi trở thành hình vuông khi có thêm:",
    "options": [
      {
        "text": "Một góc vuông hoặc hai đường chéo bằng nhau",
        "correct": true
      },
      {
        "text": "Hai đường chéo vuông góc",
        "correct": false
      },
      {
        "text": "Bốn cạnh bằng nhau",
        "correct": false
      },
      {
        "text": "Một đường chéo là phân giác",
        "correct": false
      }
    ],
    "explanation": "Hình thoi có 1 góc vuông HOẶC có 2 đường chéo bằng nhau là hình vuông."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Diện Tích Hình Thoi",
    "pts": 20,
    "question": "Hình thoi có độ dài hai đường chéo là $8$ cm và $10$ cm. Diện tích của hình thoi đó là:",
    "options": [
      {
        "text": "$40$ cm²",
        "correct": true
      },
      {
        "text": "$80$ cm²",
        "correct": false
      },
      {
        "text": "$20$ cm²",
        "correct": false
      },
      {
        "text": "$36$ cm²",
        "correct": false
      }
    ],
    "explanation": "Diện tích hình thoi bằng nửa tích độ dài hai đường chéo: $S = \\frac{1}{2} \\cdot 8 \\cdot 10 = 40$ cm²."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Số Trục Đối Xứng Của Hình Vuông",
    "pts": 20,
    "question": "Hình vuông có bao nhiêu trục đối xứng?",
    "options": [
      {
        "text": "$4$ trục đối xứng",
        "correct": true
      },
      {
        "text": "$2$ trục đối xứng",
        "correct": false
      },
      {
        "text": "$1$ trục đối xứng",
        "correct": false
      },
      {
        "text": "Vô số trục đối xứng",
        "correct": false
      }
    ],
    "explanation": "Hình vuông có 4 trục đối xứng: 2 đường thẳng đi qua trung điểm các cặp cạnh đối và 2 đường thẳng chứa 2 đường chéo."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Tính Cạnh Hình Thoi Bằng Pythagore",
    "pts": 20,
    "question": "Hình thoi có hai đường chéo dài $6$ cm và $8$ cm. Độ dài cạnh của hình thoi là:",
    "options": [
      {
        "text": "$5$ cm",
        "correct": true
      },
      {
        "text": "$7$ cm",
        "correct": false
      },
      {
        "text": "$10$ cm",
        "correct": false
      },
      {
        "text": "$4$ cm",
        "correct": false
      }
    ],
    "explanation": "Hai đường chéo cắt nhau tại trung điểm và vuông góc. Nửa hai đường chéo là $3$ cm và $4$ cm. Cạnh hình thoi là cạnh huyền tam giác vuông: $a = \\sqrt{3^2 + 4^2} = 5$ cm."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Nối Trung Điểm 4 Cạnh Hình Thoi",
    "pts": 20,
    "question": "Nối lần lượt trung điểm bốn cạnh của một hình thoi ta được một:",
    "options": [
      {
        "text": "Hình chữ nhật",
        "correct": true
      },
      {
        "text": "Hình thoi",
        "correct": false
      },
      {
        "text": "Hình vuông",
        "correct": false
      },
      {
        "text": "Hình bình hành không vuông",
        "correct": false
      }
    ],
    "explanation": "Các cạnh của tứ giác mới song song với hai đường chéo vuông góc của hình thoi nên tứ giác đó có 4 góc vuông $\\implies$ là hình chữ nhật."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Tứ Giác Nối Trung Điểm Hình Vuông",
    "pts": 20,
    "question": "Nối lần lượt trung điểm bốn cạnh của một hình vuông ta được một:",
    "options": [
      {
        "text": "Hình vuông",
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
    "explanation": "Tứ giác mới vừa có 4 cạnh bằng nhau (tính chất hình thoi) vừa có 4 góc vuông (tính chất hình chữ nhật) nên là một hình vuông."
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
                const diag1 = document.getElementById('diag1');
                const diag2 = document.getElementById('diag2');
                const outEl = document.getElementById('lab1Output');

                function draw() {
                    const d1 = parseInt(diag1.value);
                    const d2 = parseInt(diag2.value);
                    const isSquare = (d1 === d2);

                    outEl.innerHTML = `
                        <strong>Trạng thái:</strong> ${isSquare ? '<span style="color:#10b981; font-weight:700;">HÌNH VUÔNG ($AC = BD$ và $AC \\perp BD$)</span>' : 'Hình thoi ($AC \\neq BD$ và $AC \\perp BD$)'}<br>
                        <strong>Diện tích:</strong> $S = \\frac{1}{2} d_1 d_2 = \\frac{1}{2} \\cdot ${d1} \\cdot ${d2} = \\mathbf{${d1 * d2 / 2}}$ px²
                    `;
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

                    const ax = ox - d1 / 2, ay = oy;
                    const cx = ox + d1 / 2, cy = oy;
                    const bx = ox, by = oy - d2 / 2;
                    const dx = ox, dy = oy + d2 / 2;

                    // Ve hinh thoi
                    ctx.strokeStyle = isSquare ? '#10b981' : '#f59e0b';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.lineTo(dx, dy);
                    ctx.closePath();
                    ctx.fillStyle = isSquare ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.15)';
                    ctx.fill();
                    ctx.stroke();

                    // 2 duong cheo
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(cx, cy);
                    ctx.moveTo(bx, by); ctx.lineTo(dx, dy);
                    ctx.stroke();

                    // Ky hieu vuong goc o giua
                    ctx.strokeStyle = '#fff';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(ox, oy - 12, 12, 12);

                    // Nhan
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText('A', ax - 18, ay + 5);
                    ctx.fillText('C', cx + 8, cy + 5);
                    ctx.fillText('B', bx - 5, by - 8);
                    ctx.fillText('D', dx - 5, dy + 18);
                }

                diag1.addEventListener('input', draw);
                diag2.addEventListener('input', draw);
                draw();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const outEl = document.getElementById('lab2Output');

                const steps = [
                    { title: 'HÌNH BÌNH HÀNH ➔ HÌNH CHỮ NHẬT', cond: 'Thêm: 1 góc vuông HOẶC 2 đường chéo bằng nhau.', col: '#6366f1' },
                    { title: 'HÌNH BÌNH HÀNH ➔ HÌNH THOI', cond: 'Thêm: 2 cạnh kề bằng nhau HOẶC 2 đường chéo vuông góc HOẶC 1 đường chéo là phân giác.', col: '#06b6d4' },
                    { title: 'HÌNH CHỮ NHẬT / HÌNH THOI ➔ HÌNH VUÔNG', cond: 'HCN có 2 cạnh kề bằng nhau (hoặc 2 đường chéo vuông góc) HOẶC Hình thoi có 1 góc vuông (hoặc 2 đường chéo bằng nhau).', col: '#f59e0b' }
                ];

                function showStep(idx) {
                    const st = steps[idx];
                    outEl.innerHTML = `<strong>Chuyển hóa:</strong> <span style="color:${st.col}; font-weight:700;">${st.title}</span><br><strong>Điều kiện cần bổ sung:</strong> ${st.cond}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = st.col;
                    ctx.fillRect(40, 50, w - 80, 75);

                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText(st.title, w / 2, 75);
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText(st.cond, w / 2, 105);
                    ctx.textAlign = 'left';
                }

                document.getElementById('btnTree1').addEventListener('click', () => showStep(0));
                document.getElementById('btnTree2').addEventListener('click', () => showStep(1));
                document.getElementById('btnTree3').addEventListener('click', () => showStep(2));
                showStep(2);
            
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
