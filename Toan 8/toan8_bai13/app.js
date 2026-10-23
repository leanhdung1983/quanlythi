// ================================================================
// BÀI 13: HÌNH CHỮ NHẬT - TOÁN 8 KNTT
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
  userTitle: 'Bậc Thầy Hình Chữ Nhật 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai13_state';

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
    "title": "Thử Thách 1: Định Nghĩa Hình Chữ Nhật",
    "pts": 20,
    "question": "Hình chữ nhật là tứ giác có:",
    "options": [
      {
        "text": "Bốn góc vuông",
        "correct": true
      },
      {
        "text": "Bốn cạnh bằng nhau",
        "correct": false
      },
      {
        "text": "Hai đường chéo vuông góc",
        "correct": false
      },
      {
        "text": "Hai cạnh kề bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa SGK: Hình chữ nhật là tứ giác có bốn góc vuông."
  },
  {
    "id": 2,
    "title": "Thử Thách 2: Tính Chất Hai Đường Chéo",
    "pts": 20,
    "question": "Trong hình chữ nhật, hai đường chéo có tính chất gì?",
    "options": [
      {
        "text": "Bằng nhau và cắt nhau tại trung điểm của mỗi đường",
        "correct": true
      },
      {
        "text": "Vuông góc với nhau",
        "correct": false
      },
      {
        "text": "Là đường phân giác của các góc",
        "correct": false
      },
      {
        "text": "Song song với nhau",
        "correct": false
      }
    ],
    "explanation": "Trong hình chữ nhật, hai đường chéo bằng nhau và cắt nhau tại trung điểm của mỗi đường."
  },
  {
    "id": 3,
    "title": "Thử Thách 3: Dấu Hiệu Từ Hình Bình Hành",
    "pts": 20,
    "question": "Hình bình hành trở thành hình chữ nhật khi có thêm điều kiện nào sau đây?",
    "options": [
      {
        "text": "Có một góc vuông hoặc hai đường chéo bằng nhau",
        "correct": true
      },
      {
        "text": "Có hai cạnh kề bằng nhau",
        "correct": false
      },
      {
        "text": "Có hai đường chéo vuông góc",
        "correct": false
      },
      {
        "text": "Có hai góc kề bù nhau",
        "correct": false
      }
    ],
    "explanation": "Hình bình hành có 1 góc vuông HOẶC có 2 đường chéo bằng nhau là hình chữ nhật."
  },
  {
    "id": 4,
    "title": "Thử Thách 4: Dấu Hiệu Từ Hình Thang Cân",
    "pts": 20,
    "question": "Hình thang cân trở thành hình chữ nhật khi có thêm:",
    "options": [
      {
        "text": "Một góc vuông",
        "correct": true
      },
      {
        "text": "Hai đường chéo bằng nhau",
        "correct": false
      },
      {
        "text": "Hai cạnh bên bằng nhau",
        "correct": false
      },
      {
        "text": "Hai đáy bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Hình thang cân có 1 góc vuông là hình chữ nhật."
  },
  {
    "id": 5,
    "title": "Thử Thách 5: Đường Trung Tuyến Tam Giác Vuông",
    "pts": 20,
    "question": "Cho tam giác $ABC$ vuông tại $A$ có cạnh huyền $BC = 10$ cm. Độ dài đường trung tuyến $AM$ ứng với cạnh huyền là:",
    "options": [
      {
        "text": "$5$ cm",
        "correct": true
      },
      {
        "text": "$10$ cm",
        "correct": false
      },
      {
        "text": "$20$ cm",
        "correct": false
      },
      {
        "text": "$2{,}5$ cm",
        "correct": false
      }
    ],
    "explanation": "Trong tam giác vuông, đường trung tuyến ứng với cạnh huyền bằng nửa cạnh huyền: $AM = \\frac{1}{2}BC = \\frac{1}{2} \\cdot 10 = 5$ cm."
  },
  {
    "id": 6,
    "title": "Thử Thách 6: Định Lí Đảo Tam Giác Vuông",
    "pts": 20,
    "question": "Tam giác $ABC$ có đường trung tuyến $AM = 6$ cm và cạnh $BC = 12$ cm. Tam giác $ABC$ là tam giác gì?",
    "options": [
      {
        "text": "Tam giác vuông tại $A$",
        "correct": true
      },
      {
        "text": "Tam giác cân tại $A$",
        "correct": false
      },
      {
        "text": "Tam giác đều",
        "correct": false
      },
      {
        "text": "Tam giác vuông cân tại $B$",
        "correct": false
      }
    ],
    "explanation": "Vì $AM = 6 = \\frac{12}{2} = \\frac{1}{2}BC$ nên theo định lí đảo, tam giác $ABC$ vuông tại $A$."
  },
  {
    "id": 7,
    "title": "Thử Thách 7: Giao Điểm Hai Đường Chéo",
    "pts": 20,
    "question": "Cho hình chữ nhật $ABCD$ có $AC$ cắt $BD$ tại $O$. Nếu $OA = 4$ cm thì độ dài đường chéo $BD$ bằng:",
    "options": [
      {
        "text": "$8$ cm",
        "correct": true
      },
      {
        "text": "$4$ cm",
        "correct": false
      },
      {
        "text": "$16$ cm",
        "correct": false
      },
      {
        "text": "$2$ cm",
        "correct": false
      }
    ],
    "explanation": "$AC = 2 \\cdot OA = 8$ cm. Vì trong hình chữ nhật hai đường chéo bằng nhau nên $BD = AC = 8$ cm."
  },
  {
    "id": 8,
    "title": "Thử Thách 8: Trục Đối Xứng Của Hình Chữ Nhật",
    "pts": 20,
    "question": "Hình chữ nhật có bao nhiêu trục đối xứng?",
    "options": [
      {
        "text": "$2$ trục đối xứng",
        "correct": true
      },
      {
        "text": "$1$ trục đối xứng",
        "correct": false
      },
      {
        "text": "$4$ trục đối xứng",
        "correct": false
      },
      {
        "text": "Không có trục đối xứng",
        "correct": false
      }
    ],
    "explanation": "Hình chữ nhật có 2 trục đối xứng là hai đường thẳng đi qua trung điểm của hai cặp cạnh đối diện."
  },
  {
    "id": 9,
    "title": "Thử Thách 9: Tính Độ Dài Đường Chéo Bằng Định Lí Pythagore",
    "pts": 20,
    "question": "Hình chữ nhật có các kích thước $6$ cm và $8$ cm. Độ dài đường chéo của hình chữ nhật là:",
    "options": [
      {
        "text": "$10$ cm",
        "correct": true
      },
      {
        "text": "$14$ cm",
        "correct": false
      },
      {
        "text": "$48$ cm",
        "correct": false
      },
      {
        "text": "$12$ cm",
        "correct": false
      }
    ],
    "explanation": "Theo định lí Pythagore trong tam giác vuông: $d = \\sqrt{6^2 + 8^2} = \\sqrt{36 + 64} = \\sqrt{100} = 10$ cm."
  },
  {
    "id": 10,
    "title": "Thử Thách 10: Tứ Giác Tạo Bởi Trung Điểm",
    "pts": 20,
    "question": "Nối lần lượt trung điểm bốn cạnh của một hình chữ nhật ta được một:",
    "options": [
      {
        "text": "Hình thoi",
        "correct": true
      },
      {
        "text": "Hình chữ nhật",
        "correct": false
      },
      {
        "text": "Hình vuông",
        "correct": false
      },
      {
        "text": "Hình thang cân",
        "correct": false
      }
    ],
    "explanation": "Tứ giác có 4 đỉnh là trung điểm 4 cạnh của hình chữ nhật có 4 cạnh bằng nhau (cùng bằng nửa độ dài hai đường chéo bằng nhau của hình chữ nhật) nên là một hình thoi."
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
                const paramAngle = document.getElementById('paramAngle');
                const dispAngA = document.getElementById('dispAngA');
                const outEl = document.getElementById('lab1Output');

                function draw() {
                    const deg = parseInt(paramAngle.value);
                    dispAngA.textContent = deg + '°';

                    outEl.innerHTML = `
                        <strong>Tam giác vuông:</strong> $\\Delta ABC$ vuông tại $A$ ($\\widehat{A} = 90^{\\circ}$).<br>
                        <strong>Trung tuyến $AM$:</strong> $AM = MB = MC = \\frac{1}{2}BC$ (Bán kính đường tròn ngoại tiếp).
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
                    const oy = 170;
                    const R = 150;

                    const bx = ox - R, by = oy;
                    const cx = ox + R, cy = oy;

                    const rad = deg * Math.PI / 180;
                    const ax = ox - R * Math.cos(rad);
                    const ay = oy - R * Math.sin(rad);

                    // Nua duong tron
                    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
                    ctx.lineWidth = 1;
                    ctx.setLineDash([4, 4]);
                    ctx.beginPath();
                    ctx.arc(ox, oy, R, Math.PI, 0, false);
                    ctx.stroke();
                    ctx.setLineDash([]);

                    // Tam giac ABC
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy);
                    ctx.closePath();
                    ctx.fillStyle = 'rgba(99, 102, 241, 0.15)';
                    ctx.fill();
                    ctx.stroke();

                    // Trung tuyen AM
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(ox, oy);
                    ctx.stroke();

                    // Ky hieu goc vuong tai A
                    ctx.fillStyle = '#10b981';
                    ctx.beginPath();
                    ctx.arc(ax, ay, 6, 0, Math.PI * 2);
                    ctx.fill();

                    // Nhan
                    ctx.fillStyle = '#fff';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('A (90°)', ax - 20, ay - 12);
                    ctx.fillText('B', bx - 20, by + 5);
                    ctx.fillText('C', cx + 10, cy + 5);
                    ctx.fillText('M (Trung điểm BC)', ox - 45, oy + 22);

                    ctx.fillStyle = '#f59e0b';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.fillText('AM = R', (ax + ox) / 2 + 10, (ay + oy) / 2);
                }

                paramAngle.addEventListener('input', draw);
                draw();
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const angleA = document.getElementById('angleA');
                const dispA = document.getElementById('dispA');
                const outEl = document.getElementById('lab2Output');

                function update() {
                    const ang = parseInt(angleA.value);
                    dispA.textContent = ang + '°';
                    const isRect = (ang === 90);

                    outEl.innerHTML = `
                        <strong>Trạng thái:</strong> ${isRect ? '<span style="color:#10b981; font-weight:700;">ĐÃ TRỞ THÀNH HÌNH CHỮ NHẬT (4 góc vuông, 2 đường chéo bằng nhau)</span>' : 'Hình bình hành góc nhọn (chưa phải hình chữ nhật)'}
                    `;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    const rad = ang * Math.PI / 180;
                    const H = 100;
                    const dx = H / Math.tan(rad);

                    const ax = 120 + dx, ay = 60;
                    const bx = 360 + dx, by = 60;
                    const cx = 360, cy = 160;
                    const dxP = 120, dy = 160;

                    ctx.strokeStyle = isRect ? '#10b981' : '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.lineTo(cx, cy); ctx.lineTo(dxP, dy);
                    ctx.closePath();
                    ctx.fillStyle = isRect ? 'rgba(16, 185, 129, 0.2)' : 'rgba(99, 102, 241, 0.15)';
                    ctx.fill();
                    ctx.stroke();

                    // Duong cheo
                    const d1 = Math.hypot(bx - dxP, by - dy);
                    const d2 = Math.hypot(cx - ax, cy - ay);

                    ctx.fillStyle = '#cbd5e1';
                    ctx.font = '14px Segoe UI';
                    ctx.fillText(`Độ dài AC = ${Math.round(d2)} px | Độ dài BD = ${Math.round(d1)} px`, 30, 35);
                }

                angleA.addEventListener('input', update);
                update();
            
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
