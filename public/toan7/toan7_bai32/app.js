// ================================================================
// BÀI 32: QUAN HỆ GIỮA ĐƯỜNG VUÔNG GÓC VÀ ĐƯỜNG XIÊN - TOÁN 7 KNTT
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
  userTitle: 'Nhà Đo Đạc Không Gian 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai32_state';

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
    "title": "Câu 1: Đoạn thẳng ngắn nhất",
    "pts": 20,
    "question": "Từ một điểm $A$ nằm ngoài đường thẳng $d$, kẻ đoạn vuông góc $AH$ và các đoạn xiên $AB, AC$ đến $d$. Khẳng định nào sau đây luôn ĐÚNG?",
    "options": [
      {
        "text": "$AH < AB$ và $AH < AC$",
        "correct": true
      },
      {
        "text": "$AH > AB$",
        "correct": false
      },
      {
        "text": "$AB = AC$",
        "correct": false
      },
      {
        "text": "$AH = AB$",
        "correct": false
      }
    ],
    "explanation": "Định lí: Đoạn vuông góc luôn ngắn hơn mọi đoạn xiên kẻ từ cùng một điểm đến đường thẳng đó."
  },
  {
    "id": 2,
    "title": "Câu 2: Khoảng cách từ điểm đến đường thẳng",
    "pts": 20,
    "question": "Khoảng cách từ điểm $A$ đến đường thẳng $d$ là độ dài của:",
    "options": [
      {
        "text": "Đoạn thẳng vuông góc kẻ từ $A$ đến $d$",
        "correct": true
      },
      {
        "text": "Đoạn xiên bất kì kẻ từ $A$ đến $d$",
        "correct": false
      },
      {
        "text": "Đoạn thẳng nối $A$ với một điểm bất kì trên $d$",
        "correct": false
      },
      {
        "text": "Nửa đoạn thẳng vuông góc",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa, khoảng cách từ một điểm đến một đường thẳng là độ dài đoạn vuông góc kẻ từ điểm đó đến đường thẳng."
  },
  {
    "id": 3,
    "title": "Câu 3: So sánh hai đoạn xiên có hình chiếu bằng nhau",
    "pts": 20,
    "question": "Cho $AH \\perp d$ tại $H$. Lấy hai điểm $B, C$ trên $d$ sao cho $HB = HC$. Khi đó:",
    "options": [
      {
        "text": "$AB = AC$",
        "correct": true
      },
      {
        "text": "$AB > AC$",
        "correct": false
      },
      {
        "text": "$AB < AC$",
        "correct": false
      },
      {
        "text": "$AB + AC = AH$",
        "correct": false
      }
    ],
    "explanation": "Hai đoạn xiên có hình chiếu bằng nhau ($HB = HC$) thì bằng nhau ($AB = AC$ vì $\\Delta AHB = \\Delta AHC$ theo trường hợp c-g-c)."
  },
  {
    "id": 4,
    "title": "Câu 4: So sánh hai đoạn xiên có hình chiếu khác nhau",
    "pts": 20,
    "question": "Cho $AH \\perp d$ tại $H$. Lấy hai điểm $B, C$ trên $d$ sao cho $HB > HC$. Khi đó:",
    "options": [
      {
        "text": "$AB > AC$",
        "correct": true
      },
      {
        "text": "$AB < AC$",
        "correct": false
      },
      {
        "text": "$AB = AC$",
        "correct": false
      },
      {
        "text": "$AB = 2AC$",
        "correct": false
      }
    ],
    "explanation": "Đoạn xiên nào có hình chiếu lớn hơn thì lớn hơn: $HB > HC \\implies AB > AC$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tam giác vuông cân và đoạn vuông góc",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ vuông tại $A$. Khoảng cách từ điểm $B$ đến đường thẳng $AC$ là độ dài của đoạn thẳng nào?",
    "options": [
      {
        "text": "Đoạn $BA$",
        "correct": true
      },
      {
        "text": "Đoạn $BC$",
        "correct": false
      },
      {
        "text": "Đoạn $AC$",
        "correct": false
      },
      {
        "text": "Đường cao hạ từ $A$",
        "correct": false
      }
    ],
    "explanation": "Vì $\\Delta ABC$ vuông tại $A$ nên $BA \\perp AC$ tại $A$. Do đó khoảng cách từ $B$ đến $AC$ chính là độ dài đoạn $BA$."
  },
  {
    "id": 6,
    "title": "Câu 6: Vị trí của điểm H",
    "pts": 20,
    "question": "Cho điểm $A$ nằm ngoài đường thẳng $d$ và $H$ là hình chiếu của $A$ trên $d$. Nếu $M$ là một điểm di động trên $d$ thì $AM$ đạt giá trị nhỏ nhất khi nào?",
    "options": [
      {
        "text": "$M$ trùng với $H$",
        "correct": true
      },
      {
        "text": "$M$ ở vô cùng",
        "correct": false
      },
      {
        "text": "$HM = AH$",
        "correct": false
      },
      {
        "text": "$M$ cách $H$ một khoảng $1\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Vì $AM \\ge AH$ với mọi $M \\in d$, dấu bằng xảy ra khi và chỉ khi $M$ trùng với chân đường vuông góc $H$."
  },
  {
    "id": 7,
    "title": "Câu 7: So sánh góc và đoạn xiên",
    "pts": 20,
    "question": "Cho $AH \\perp d$ tại $H$, $B$ và $C$ thuộc $d$ sao cho $B$ nằm giữa $H$ và $C$. Khẳng định nào sau đây ĐÚNG?",
    "options": [
      {
        "text": "$AH < AB < AC$",
        "correct": true
      },
      {
        "text": "$AC < AB < AH$",
        "correct": false
      },
      {
        "text": "$AB < AH < AC$",
        "correct": false
      },
      {
        "text": "$AH < AC < AB$",
        "correct": false
      }
    ],
    "explanation": "Vì $B$ nằm giữa $H$ và $C$ nên $HB < HC$, do đó hình chiếu nhỏ hơn thì đoạn xiên nhỏ hơn: $AB < AC$. Kết hợp với $AH < AB$ ta có $AH < AB < AC$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tam giác tù và đường cao",
    "pts": 20,
    "question": "Cho $\\Delta ABC$ có góc $B$ tù. Chân đường cao kẻ từ $A$ xuống đường thẳng $BC$ nằm ở vị trí nào?",
    "options": [
      {
        "text": "Nằm ngoài đoạn thẳng $BC$ (về phía $B$)",
        "correct": true
      },
      {
        "text": "Nằm giữa $B$ và $C$",
        "correct": false
      },
      {
        "text": "Trùng với điểm $B$",
        "correct": false
      },
      {
        "text": "Nằm ngoài đoạn thẳng $BC$ (về phía $C$)",
        "correct": false
      }
    ],
    "explanation": "Vì góc $B$ tù nên chân đường vuông góc $H$ kẻ từ $A$ xuống $BC$ phải nằm trên tia đối của tia $BC$, tức là nằm ngoài đoạn $BC$ về phía điểm $B$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bất đẳng thức đoạn vuông góc",
    "pts": 20,
    "question": "Trong tam giác $ABC$, đường cao $AH$ thỏa mãn:",
    "options": [
      {
        "text": "$AH \\le AB$ và $AH \\le AC$",
        "correct": true
      },
      {
        "text": "$AH > AB$",
        "correct": false
      },
      {
        "text": "$AH > AC$",
        "correct": false
      },
      {
        "text": "$AH = AB + AC$",
        "correct": false
      }
    ],
    "explanation": "Đoạn vuông góc luôn nhỏ hơn hoặc bằng đoạn xiên (bằng khi góc $B$ hoặc $C$ vuông)."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng thực tiễn cột điện",
    "pts": 20,
    "question": "Một cột điện vuông góc với mặt đất có chiều cao $h$. Một dây cáp kéo từ đỉnh cột điện xuống một cọc neo trên mặt đất cách chân cột một đoạn $d$. Chiều dài dây cáp $L$ luôn thỏa mãn:",
    "options": [
      {
        "text": "$L > h$ và $L > d$",
        "correct": true
      },
      {
        "text": "$L < h$",
        "correct": false
      },
      {
        "text": "$L = h + d$",
        "correct": false
      },
      {
        "text": "$L < d$",
        "correct": false
      }
    ],
    "explanation": "Dây cáp là cạnh huyền của tam giác vuông tạo bởi cột điện và mặt đất, nên chiều dài của nó luôn lớn hơn chiều cao cột điện $h$ và khoảng cách neo $d$."
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
    
const canvas1 = document.getElementById('labCanvas1');
if (canvas1) {
  const ctx = canvas1.getContext('2d');
  const slider = document.getElementById('lab1B');
  const lbl = document.getElementById('lab1ValB');

  function draw(bx) {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('SO SÁNH ĐỘ DÀI: ĐOẠN VUÔNG GÓC AH VÀ ĐOẠN XIÊN AB', canvas1.width / 2, 28);

    const ax = 160, ay = 60;
    const hx = 160, hy = 180;
    const lineY = 180;

    // Đường thẳng d
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(40, lineY);
    ctx.lineTo(canvas1.width - 40, lineY);
    ctx.stroke();
    ctx.fillStyle = '#94a3b8';
    ctx.font = 'italic 15px serif';
    ctx.fillText('d', canvas1.width - 25, lineY - 8);

    // Đoạn vuông góc AH
    ctx.strokeStyle = '#10b981';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(hx, hy);
    ctx.stroke();

    // Kí hiệu vuông góc
    ctx.strokeRect(hx, hy - 14, 14, 14);

    // Đoạn xiên AB
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, lineY);
    ctx.stroke();

    // Các điểm
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('A', ax, ay - 10);
    ctx.fillText('H', hx, hy + 22);
    ctx.fillText('B', bx, lineY + 22);

    const lenAH = hy - ay;
    const lenAB = Math.hypot(bx - ax, lineY - ay);

    ctx.textAlign = 'left';
    ctx.font = '15px sans-serif';
    ctx.fillStyle = '#10b981';
    ctx.fillText(`• Đoạn vuông góc AH = ${Math.round(lenAH)} px (Cố định)`, 340, 75);

    ctx.fillStyle = '#f59e0b';
    ctx.fillText(`• Đoạn xiên AB = ${Math.round(lenAB)} px`, 340, 110);

    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = lenAB > lenAH ? '#38bdf8' : '#10b981';
    ctx.fillText(lenAB > lenAH ? `=> AB > AH (${Math.round(lenAB)} > ${Math.round(lenAH)}) ✓` : `=> B trùng H: AH ngắn nhất! ✓`, 340, 150);
  }

  if (slider) {
    slider.addEventListener('input', (e) => {
      const v = parseInt(e.target.value);
      if (lbl) lbl.textContent = `B = ${v}`;
      draw(v);
    });
    draw(parseInt(slider.value));
  }
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');

  function draw2() {
    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText('BÀI TOÁN THỰC TIỄN: QUÃNG ĐƯỜNG QUA SÔNG NGẮN NHẤT', canvas2.width / 2, 28);

    // Vẽ dòng sông
    ctx2.fillStyle = 'rgba(56, 189, 248, 0.15)';
    ctx2.fillRect(40, 60, canvas2.width - 80, 110);
    ctx2.strokeStyle = '#38bdf8';
    ctx2.lineWidth = 2;
    ctx2.strokeRect(40, 60, canvas2.width - 80, 110);

    ctx2.fillStyle = '#38bdf8';
    ctx2.font = 'italic 13px sans-serif';
    ctx2.fillText('Bờ sông 1', 90, 52);
    ctx2.fillText('Bờ sông 2', 90, 188);

    // Điểm A và các hướng bơi
    const ax = 140, ay = 60;
    const hx = 140, hy = 170;
    const b1x = 260, b1y = 170;
    const b2x = 360, b2y = 170;

    // Đường bơi vuông góc
    ctx2.strokeStyle = '#10b981';
    ctx2.lineWidth = 3;
    ctx2.beginPath();
    ctx2.moveTo(ax, ay);
    ctx2.lineTo(hx, hy);
    ctx2.stroke();

    // Các đường xiên
    ctx2.strokeStyle = '#f43f5e';
    ctx2.lineWidth = 2;
    ctx2.setLineDash([5, 5]);
    ctx2.beginPath();
    ctx2.moveTo(ax, ay); ctx2.lineTo(b1x, b1y);
    ctx2.moveTo(ax, ay); ctx2.lineTo(b2x, b2y);
    ctx2.stroke();
    ctx2.setLineDash([]);

    ctx2.fillStyle = '#fff';
    ctx2.font = 'bold 14px sans-serif';
    ctx2.fillText('A (Xuất phát)', ax, ay - 12);
    ctx2.fillStyle = '#10b981';
    ctx2.fillText('H (Vuông góc: 50m)', hx, hy + 20);
    ctx2.fillStyle = '#f43f5e';
    ctx2.fillText('B1 (Xiên: 70m)', b1x, hy + 20);
    ctx2.fillText('B2 (Xiên: 110m)', b2x, hy + 20);

    ctx2.font = 'bold 15px sans-serif';
    ctx2.fillStyle = '#fbbf24';
    ctx2.fillText('Kết luận: Bơi theo đường vuông góc AH tốn ít sức nhất vì AH ngắn nhất!', canvas2.width / 2, 222);
  }

  const btn = document.getElementById('btnLab2River');
  if (btn) btn.onclick = draw2;
  draw2();
}

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
