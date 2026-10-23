// ================================================================
// BÀI 10: TIÊN ĐỀ EUCLID. TÍNH CHẤT CỦA HAI ĐƯỜNG THẲNG SONG SONG - TOÁN 7 KNTT
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
  s = s.replace(/\\overrightarrow\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#8594;</mo></mover>'));
  s = s.replace(/\\overline\{([^{}]+)\}/g, (m, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#175;</mo></mover>'));
  s = s.replace(/\\sqrt\{([^{}]+)\}/g, (m, c) => savePlaceholder('<msqrt><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow></msqrt>'));

  let prevFrac;
  do {
    prevFrac = s;
    s = s.replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, (m, n, d) => savePlaceholder('<mfrac><mrow>' + convertLatexToMathMLBody(n, placeholders) + '</mrow><mrow>' + convertLatexToMathMLBody(d, placeholders) + '</mrow></mfrac>'));
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
  if (window.renderMathInElement) {
    renderMathInElement(root, {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "$", right: "$", display: false }
      ],
      throwOnError: false,
      strict: false
    });
  } else {
    function walk(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.nodeValue;
        if (text && (text.includes('$') || text.includes('$$'))) {
          const span = document.createElement('span');
          span.innerHTML = formatMathText(text);
          node.parentNode.replaceChild(span, node);
        }
      } else if (node.nodeType === Node.ELEMENT_NODE && node.nodeName !== 'SCRIPT' && node.nodeName !== 'STYLE') {
        Array.from(node.childNodes).forEach(walk);
      }
    }
    walk(root);
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
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }
  playTone(freq, type = 'sine', duration = 0.15, vol = 0.1) {
    if (!this.enabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {}
  }
  playClick() { this.playTone(600, 'sine', 0.08, 0.06); }
  playCorrect() {
    this.playTone(523.25, 'triangle', 0.12, 0.12);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.12), 80);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.22, 0.15), 160);
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
  userTitle: 'Nhà Hình Học Euclid 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai10_state';

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
    "title": "Câu 1: Nội dung tiên đề Euclid",
    "pts": 20,
    "question": "Tiên đề Euclid khẳng định: Qua một điểm ở ngoài một đường thẳng:",
    "options": [
      {
        "text": "Chỉ có một đường thẳng song song với đường thẳng đó",
        "correct": true
      },
      {
        "text": "Có ít nhất hai đường thẳng song song với đường thẳng đó",
        "correct": false
      },
      {
        "text": "Có vô số đường thẳng song song với đường thẳng đó",
        "correct": false
      },
      {
        "text": "Không có đường thẳng nào song song với đường thẳng đó",
        "correct": false
      }
    ],
    "explanation": "Theo tiên đề Euclid, qua một điểm ở ngoài một đường thẳng chỉ vẽ được duy nhất một đường thẳng song song với đường thẳng đã cho."
  },
  {
    "id": 2,
    "title": "Câu 2: Hai đường thẳng cùng vuông góc đường thứ ba",
    "pts": 20,
    "question": "Nếu hai đường thẳng phân biệt $a$ và $b$ cùng vuông góc với đường thẳng $c$ thì:",
    "options": [
      {
        "text": "$a \\parallel b$",
        "correct": true
      },
      {
        "text": "$a \\perp b$",
        "correct": false
      },
      {
        "text": "$a$ cắt $b$",
        "correct": false
      },
      {
        "text": "$a$ trùng với $b$",
        "correct": false
      }
    ],
    "explanation": "Định lí: Hai đường thẳng phân biệt cùng vuông góc với một đường thẳng thứ ba thì chúng song song với nhau."
  },
  {
    "id": 3,
    "title": "Câu 3: Một đường vuông góc với một trong hai đường song song",
    "pts": 20,
    "question": "Cho $a \\parallel b$. Nếu đường thẳng $c$ vuông góc với $a$ thì:",
    "options": [
      {
        "text": "$c$ cũng vuông góc với $b$",
        "correct": true
      },
      {
        "text": "$c$ song song với $b$",
        "correct": false
      },
      {
        "text": "$c$ không cắt $b$",
        "correct": false
      },
      {
        "text": "$c$ trùng với $b$",
        "correct": false
      }
    ],
    "explanation": "Định lí: Một đường thẳng vuông góc với một trong hai đường thẳng song song thì nó cũng vuông góc với đường thẳng kia."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính chất bắc cầu của quan hệ song song",
    "pts": 20,
    "question": "Cho ba đường thẳng phân biệt $a, b, c$. Nếu $a \\parallel b$ và $b \\parallel c$ thì:",
    "options": [
      {
        "text": "$a \\parallel c$",
        "correct": true
      },
      {
        "text": "$a \\perp c$",
        "correct": false
      },
      {
        "text": "$a$ cắt $c$",
        "correct": false
      },
      {
        "text": "$a$ trùng với $c$",
        "correct": false
      }
    ],
    "explanation": "Tính chất bắc cầu: Hai đường thẳng phân biệt cùng song song với một đường thẳng thứ ba thì chúng song song với nhau ($a \\parallel c$)."
  },
  {
    "id": 5,
    "title": "Câu 5: Tính góc trong cùng phía khi song song",
    "pts": 20,
    "question": "Cho $a \\parallel b$. Đường thẳng $c$ cắt $a$ và $b$ lần lượt tại $A$ và $B$. Biết góc $\\widehat{A_1} = 65^\\circ$. Góc trong cùng phía với $\\widehat{A_1}$ có số đo là:",
    "options": [
      {
        "text": "$115^\\circ$",
        "correct": true
      },
      {
        "text": "$65^\\circ$",
        "correct": false
      },
      {
        "text": "$25^\\circ$",
        "correct": false
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Hai góc trong cùng phía bù nhau nên góc cần tìm có số đo là $180^\\circ - 65^\\circ = 115^\\circ$."
  },
  {
    "id": 6,
    "title": "Câu 6: Hệ quả của tiên đề Euclid",
    "pts": 20,
    "question": "Cho điểm $A$ nằm ngoài đường thẳng $d$. Nếu qua $A$ có hai đường thẳng $m$ và $n$ cùng song song với $d$ thì:",
    "options": [
      {
        "text": "Đường thẳng $m$ trùng với đường thẳng $n$",
        "correct": true
      },
      {
        "text": "Đường thẳng $m$ vuông góc với đường thẳng $n$",
        "correct": false
      },
      {
        "text": "Đường thẳng $m$ cắt đường thẳng $n$",
        "correct": false
      },
      {
        "text": "Không thể xảy ra",
        "correct": false
      }
    ],
    "explanation": "Vì qua điểm $A$ chỉ có duy nhất một đường thẳng song song với $d$ (theo tiên đề Euclid), nên hai đường thẳng $m$ và $n$ phải trùng nhau."
  },
  {
    "id": 7,
    "title": "Câu 7: Tính góc từ hai đường thẳng song song",
    "pts": 20,
    "question": "Cho hình chữ $Z$ có hai đáy $AB \\parallel CD$. Nếu góc $\\widehat{ABC} = 48^\\circ$ thì góc $\\widehat{BCD}$ bằng:",
    "options": [
      {
        "text": "$48^\\circ$",
        "correct": true
      },
      {
        "text": "$132^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      },
      {
        "text": "$42^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Vì $AB \\parallel CD$ nên hai góc so le trong $\\widehat{ABC}$ và $\\widehat{BCD}$ bằng nhau: $\\widehat{BCD} = \\widehat{ABC} = 48^\\circ$."
  },
  {
    "id": 8,
    "title": "Câu 8: Cùng song song với đường thẳng nằm ngang",
    "pts": 20,
    "question": "Trong mặt phẳng, cho đường thẳng $d$ nằm ngang. Đường thẳng $a$ song song với $d$, đường thẳng $b$ song song với $d$. Vị trí tương đối của $a$ và $b$ (biết $a \\neq b$) là:",
    "options": [
      {
        "text": "$a \\parallel b$",
        "correct": true
      },
      {
        "text": "$a \\perp b$",
        "correct": false
      },
      {
        "text": "$a$ cắt $b$",
        "correct": false
      },
      {
        "text": "$a$ và $b$ chéo nhau",
        "correct": false
      }
    ],
    "explanation": "Hai đường thẳng phân biệt cùng song song với đường thẳng thứ ba thì song song với nhau: $a \\parallel b$."
  },
  {
    "id": 9,
    "title": "Câu 9: Tính góc nhọn trong hình chữ U",
    "pts": 20,
    "question": "Cho hai tia $Ax \\parallel By$. Biết góc $\\widehat{xAB} = 70^\\circ$ và tia $By$ nằm cùng phía với tia $Ax$ đối với đường thẳng $AB$. Số đo của góc $\\widehat{ABy}$ là:",
    "options": [
      {
        "text": "$110^\\circ$",
        "correct": true
      },
      {
        "text": "$70^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      },
      {
        "text": "$120^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Đây là hình chữ U với hai góc trong cùng phía bù nhau: $\\widehat{xAB} + \\widehat{ABy} = 180^\\circ \\implies \\widehat{ABy} = 180^\\circ - 70^\\circ = 110^\\circ$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng tiên đề Euclid trong kiến trúc",
    "pts": 20,
    "question": "Khi xây các bậc cầu thang song song nhau, người thợ xây dùng thước nivo để đảm bảo mỗi bậc đều nằm ngang. Nguyên tắc toán học áp dụng ở đây là:",
    "options": [
      {
        "text": "Các đường thẳng cùng song song với phương nằm ngang thì song song với nhau",
        "correct": true
      },
      {
        "text": "Các đường thẳng cắt nhau thì vuông góc",
        "correct": false
      },
      {
        "text": "Hai góc đối đỉnh thì bằng nhau",
        "correct": false
      },
      {
        "text": "Hai góc kề bù có tổng bằng $180^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Mỗi bậc cầu thang được cân chỉnh song song với phương ngang chuẩn. Vì vậy, các bậc cầu thang đôi một song song với nhau theo tính chất bắc cầu."
  }
];

function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;
  container.innerHTML = '';

  let answeredCount = 0;
  let correctCount = 0;

  quizData.forEach((q, qIndex) => {
    const isAnswered = appState.answered[q.id] !== undefined;
    const userAnswer = appState.answered[q.id];
    if (isAnswered) {
      answeredCount++;
      if (q.options[userAnswer] && q.options[userAnswer].correct) correctCount++;
    }

    const card = document.createElement('div');
    card.className = 'quiz-card';
    if (q.question && (q.question.includes('<table') || q.question.includes('quiz-table') || q.question.length > 250)) {
      card.classList.add('full-width');
    }

    // Header câu hỏi
    const qHeader = document.createElement('div');
    qHeader.className = 'quiz-card-header';
    qHeader.innerHTML = `<span><strong>${q.title || ('Câu ' + (qIndex + 1))}</strong></span><span class="quiz-badge">+${q.pts || 20} XP</span>`;
    card.appendChild(qHeader);

    // Nội dung câu hỏi
    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    // Danh sách đáp án nút
    const optList = document.createElement('div');
    optList.className = 'quiz-options';
    const labels = ['A', 'B', 'C', 'D'];

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;

      if (isAnswered) {
        btn.disabled = true;
        if (opt.correct) btn.classList.add('correct');
        if (userAnswer === optIndex && !opt.correct) btn.classList.add('wrong');
      } else {
        btn.onclick = () => selectAnswer(q.id, optIndex, opt.correct, q.pts || 20);
      }
      optList.appendChild(btn);
    });
    card.appendChild(optList);

    // Giải thích chi tiết
    if (isAnswered) {
      const explanation = document.createElement('div');
      explanation.className = 'explanation-box show';
      explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;
      card.appendChild(explanation);
    }

    container.appendChild(card);
  });

  // Cập nhật tiến độ Arena
  const progEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (progEl) progEl.textContent = `${answeredCount}/${quizData.length}`;
  if (scoreEl) scoreEl.textContent = `${appState.xp} XP`;

  // Mở khóa Huy hiệu 4 & 5
  if (appState.xp >= 160) unlockBadge(3);
  if (correctCount === quizData.length && quizData.length > 0) {
    unlockBadge(4);
    if (!appState.badges[4]) sound.playFanfare();
  }

  // Quét KaTeX
  renderMathInTree(container);
}

function selectAnswer(qid, optIndex, isCorrect, pts) {
  if (appState.answered[qid] !== undefined) return;
  sound.init();

  appState.answered[qid] = optIndex;
  if (isCorrect) {
    appState.xp += pts;
    appState.streak += 1;
    sound.playCorrect();
    if (appState.streak >= 5) unlockBadge(2);
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

      if (target === 'theory') unlockBadge(0);
      if (target === 'labs') unlockBadge(1);

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
  try {
    
                const canvas = document.getElementById('labCanvas1');
                const ctx = canvas.getContext('2d');
                let eAng = 12;

                function drawEuclid() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const yA = 140;
                    const mx = w / 2;
                    const my = 60;

                    // Duong thang a
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(30, yA);
                    ctx.lineTo(w - 30, yA);
                    ctx.stroke();

                    // Diem M
                    ctx.fillStyle = '#f43f5e';
                    ctx.beginPath();
                    ctx.arc(mx, my, 6, 0, Math.PI * 2);
                    ctx.fill();

                    // Duong thang b qua M voi goc eAng
                    const rad = eAng * Math.PI / 180;
                    const len = w * 0.45;
                    const isParallel = (eAng === 0);

                    ctx.strokeStyle = isParallel ? '#10b981' : '#cbd5e1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(mx - len * Math.cos(rad), my - len * Math.sin(rad));
                    ctx.lineTo(mx + len * Math.cos(rad), my + len * Math.sin(rad));
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText('a', w - 25, yA + 5);
                    ctx.fillText('M', mx, my - 12);
                    ctx.fillText('b', mx + len * Math.cos(rad) + 5, my + len * Math.sin(rad));

                    const out = document.getElementById('lab1EuclidOut');
                    if (isParallel) {
                        out.innerHTML = '<span style="color:#10b981;">✅ DUY NHẤT MỘT ĐƯỜNG THẲNG ($eAng = 0°$) đi qua M và song song với a (Đúng tiên đề Euclid)!</span>';
                    } else {
                        out.innerHTML = `<span style="color:#94a3b8;">Đang lệch ${eAng}° $\\to$ Đường thẳng b sẽ cắt đường thẳng a ở xa. Hãy kéo về đúng 0°!</span>`;
                    }
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 200 * window.devicePixelRatio || 200;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawEuclid();
                }

                document.getElementById('sliderEuclidAng').addEventListener('input', e => {
                    eAng = parseInt(e.target.value);
                    document.getElementById('valEuclidAng').textContent = `${eAng}°`;
                    drawEuclid();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let showPerp = true;

                function drawPerp() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const cx = w / 2;
                    // Duong thang dung c
                    ctx2.strokeStyle = '#f59e0b';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath();
                    ctx2.moveTo(cx, 25);
                    ctx2.lineTo(cx, h - 25);
                    ctx2.stroke();

                    // Duong ngang a
                    ctx2.strokeStyle = '#6366f1';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath();
                    ctx2.moveTo(40, 60);
                    ctx2.lineTo(w - 40, 60);
                    ctx2.stroke();

                    // Duong ngang b
                    ctx2.strokeStyle = '#10b981';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath();
                    ctx2.moveTo(40, 140);
                    ctx2.lineTo(w - 40, 140);
                    ctx2.stroke();

                    if (showPerp) {
                        // Ki hieu goc vuong tai a
                        ctx2.strokeStyle = '#ffffff';
                        ctx2.lineWidth = 1.5;
                        ctx2.strokeRect(cx, 60, 12, 12);
                        // Ki hieu goc vuong tai b
                        ctx2.strokeRect(cx, 140, 12, 12);
                    }

                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 12px Segoe UI';
                    ctx2.fillText('c', cx + 10, 35);
                    ctx2.fillText('a', w - 30, 65);
                    ctx2.fillText('b', w - 30, 145);

                    const out = document.getElementById('lab2PerpOut');
                    out.innerHTML = `Định lí: $\\begin{cases} a \\perp c \\ b \\perp c \\end{cases} \\implies a \\parallel b$. Vì cả hai đường cùng tạo với $c$ góc $90^\\circ$ ở vị trí đồng vị nên $a \\parallel b$.`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 200 * window.devicePixelRatio || 200;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawPerp();
                }

                document.getElementById('btnTogglePerp').addEventListener('click', () => {
                    showPerp = !showPerp;
                    drawPerp();
                });

                window.addEventListener('resize', resizeCanvas2);
                setTimeout(resizeCanvas2, 100);
            
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
