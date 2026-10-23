// ================================================================
// BÀI TẬP CUỐI CHƯƠNG III: TỔNG ÔN GÓC VÀ ĐƯỜNG THẲNG SONG SONG - TOÁN 7 KNTT
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
  userTitle: 'Đại Kiện Tướng Hình Học 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_ontap_chuong3_state';

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
    "title": "Câu 1: Hai góc đối đỉnh",
    "pts": 20,
    "question": "Hai đường thẳng $AB$ và $CD$ cắt nhau tại $O$. Biết góc $\\widehat{AOC} = 40^\\circ$. Số đo của góc $\\widehat{BOD}$ là:",
    "options": [
      {
        "text": "$40^\\circ$",
        "correct": true
      },
      {
        "text": "$140^\\circ$",
        "correct": false
      },
      {
        "text": "$50^\\circ$",
        "correct": false
      },
      {
        "text": "$80^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Vì $\\widehat{AOC}$ và $\\widehat{BOD}$ là hai góc đối đỉnh nên $\\widehat{BOD} = \\widehat{AOC} = 40^\\circ$."
  },
  {
    "id": 2,
    "title": "Câu 2: Hai góc kề bù",
    "pts": 20,
    "question": "Trong câu hỏi trên, số đo của góc $\\widehat{AOD}$ bằng bao nhiêu?",
    "options": [
      {
        "text": "$140^\\circ$",
        "correct": true
      },
      {
        "text": "$40^\\circ$",
        "correct": false
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Vì $\\widehat{AOD}$ và $\\widehat{AOC}$ là hai góc kề bù nên $\\widehat{AOD} = 180^\\circ - 40^\\circ = 140^\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tia phân giác của góc",
    "pts": 20,
    "question": "Cho góc $\\widehat{xOy} = 70^\\circ$. Tia $Oz$ là tia phân giác của $\\widehat{xOy}$. Số đo góc $\\widehat{xOz}$ bằng:",
    "options": [
      {
        "text": "$35^\\circ$",
        "correct": true
      },
      {
        "text": "$70^\\circ$",
        "correct": false
      },
      {
        "text": "$140^\\circ$",
        "correct": false
      },
      {
        "text": "$55^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Tia phân giác chia đôi góc: $\\widehat{xOz} = \\frac{70^\\circ}{2} = 35^\\circ$."
  },
  {
    "id": 4,
    "title": "Câu 4: Dấu hiệu nhận biết song song",
    "pts": 20,
    "question": "Cho đường thẳng $c$ cắt hai đường thẳng $a, b$. Điều kiện nào sau đây KHÔNG khẳng định $a \\parallel b$?",
    "options": [
      {
        "text": "Hai góc trong cùng phía bằng nhau",
        "correct": true
      },
      {
        "text": "Hai góc so le trong bằng nhau",
        "correct": false
      },
      {
        "text": "Hai góc đồng vị bằng nhau",
        "correct": false
      },
      {
        "text": "Hai góc trong cùng phía có tổng bằng $180^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Hai góc trong cùng phía phải BÙ NHAU (tổng bằng $180^\\circ$) thì mới song song. Nếu chúng bằng nhau thì chỉ song song khi cả hai góc cùng bằng $90^\\circ$, không phải trong mọi trường hợp."
  },
  {
    "id": 5,
    "title": "Câu 5: Từ vuông góc đến song song",
    "pts": 20,
    "question": "Cho $a \\perp c$ và $b \\perp c$ ($a, b$ phân biệt). Khẳng định nào sau đây là ĐÚNG?",
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
    "id": 6,
    "title": "Câu 6: Tiên đề Euclid",
    "pts": 20,
    "question": "Qua một điểm $A$ nằm ngoài đường thẳng $d$, vẽ được bao nhiêu đường thẳng song song với $d$?",
    "options": [
      {
        "text": "Duy nhất $1$ đường thẳng",
        "correct": true
      },
      {
        "text": "Vô số đường thẳng",
        "correct": false
      },
      {
        "text": "$2$ đường thẳng",
        "correct": false
      },
      {
        "text": "Không vẽ được đường nào",
        "correct": false
      }
    ],
    "explanation": "Theo tiên đề Euclid, qua một điểm ở ngoài một đường thẳng chỉ có duy nhất một đường thẳng song song với đường thẳng đó."
  },
  {
    "id": 7,
    "title": "Câu 7: Tính chất hai đường thẳng song song",
    "pts": 20,
    "question": "Cho $a \\parallel b$. Nếu đường thẳng $c$ cắt $a$ thì đường thẳng $c$:",
    "options": [
      {
        "text": "Cũng cắt đường thẳng $b$",
        "correct": true
      },
      {
        "text": "Song song với đường thẳng $b$",
        "correct": false
      },
      {
        "text": "Không cắt đường thẳng $b$",
        "correct": false
      },
      {
        "text": "Trùng với đường thẳng $b$",
        "correct": false
      }
    ],
    "explanation": "Nếu một đường thẳng cắt một trong hai đường thẳng song song thì nó cũng cắt đường thẳng kia."
  },
  {
    "id": 8,
    "title": "Câu 8: Cấu trúc của định lí",
    "pts": 20,
    "question": "Trong định lí 'Hai góc đối đỉnh thì bằng nhau', phần 'hai góc đối đỉnh' đóng vai trò là:",
    "options": [
      {
        "text": "Giả thiết (GT)",
        "correct": true
      },
      {
        "text": "Kết luận (KL)",
        "correct": false
      },
      {
        "text": "Hình vẽ",
        "correct": false
      },
      {
        "text": "Chứng minh",
        "correct": false
      }
    ],
    "explanation": "Phần điều kiện ban đầu cho trước là Giả thiết (GT)."
  },
  {
    "id": 9,
    "title": "Câu 9: Tính góc nhọn từ hình học",
    "pts": 20,
    "question": "Cho hình vẽ có $Ax \\parallel By$. Biết góc $\\widehat{xAB} = 130^\\circ$. Góc $\\widehat{ABy}$ (trong cùng phía với $\\widehat{xAB}$) có số đo là:",
    "options": [
      {
        "text": "$50^\\circ$",
        "correct": true
      },
      {
        "text": "$130^\\circ$",
        "correct": false
      },
      {
        "text": "$65^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Vì hai góc trong cùng phía bù nhau nên $\\widehat{ABy} = 180^\\circ - 130^\\circ = 50^\\circ$."
  },
  {
    "id": 10,
    "title": "Câu 10: Phân giác của hai góc đối đỉnh",
    "pts": 20,
    "question": "Hai tia phân giác của hai góc đối đỉnh là:",
    "options": [
      {
        "text": "Hai tia đối nhau",
        "correct": true
      },
      {
        "text": "Hai tia trùng nhau",
        "correct": false
      },
      {
        "text": "Hai tia vuông góc",
        "correct": false
      },
      {
        "text": "Hai tia song song",
        "correct": false
      }
    ],
    "explanation": "Hai tia phân giác của hai góc đối đỉnh luôn là hai tia đối nhau, tạo thành một đường thẳng đi qua đỉnh chung."
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
                let mAng = 55;

                function drawMulti() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const y1 = 55, y2 = 145;
                    const rad = mAng * Math.PI / 180;
                    const supp = 180 - mAng;

                    // Duong a va b song song
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(30, y1);
                    ctx.lineTo(w - 30, y1);
                    ctx.moveTo(30, y2);
                    ctx.lineTo(w - 30, y2);
                    ctx.stroke();

                    // Cat tuyen c
                    const midX = w / 2;
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(midX - 70 * Math.cos(rad), y1 - 30);
                    ctx.lineTo(midX + 110 * Math.cos(rad), y2 + 40);
                    ctx.stroke();

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Segoe UI';
                    ctx.fillText('a // b', w - 50, y1 - 8);

                    // Cac goc tai A
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillText(`${mAng}°`, midX + 18, y1 + 18);
                    ctx.fillText(`${supp}°`, midX - 38, y1 + 18);

                    // Cac goc tai B
                    const bx = midX + (y2 - y1) / Math.tan(rad);
                    ctx.fillStyle = '#10b981';
                    ctx.fillText(`${mAng}°`, bx - 40, y2 - 8);
                    ctx.fillText(`${supp}°`, bx + 15, y2 - 8);

                    const out = document.getElementById('lab1MultiOut');
                    out.innerHTML = `Với $a \\parallel b$: Có 4 góc nhọn bằng nhau $= ${mAng}^\\circ$ và 4 góc tù bằng nhau $= ${supp}^\\circ$. Tổng một góc nhọn và một góc tù bất kì luôn bằng $180^\\circ$.`;
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 200 * window.devicePixelRatio || 200;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawMulti();
                }

                document.getElementById('sliderMultiAng').addEventListener('input', e => {
                    mAng = parseInt(e.target.value);
                    document.getElementById('valMultiAng').textContent = `${mAng}°`;
                    drawMulti();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                function calcShape() {
                    const a = parseFloat(document.getElementById('l2_inputAngA').value) || 60;
                    const shape = document.getElementById('l2_shapeSel').value;
                    const out = document.getElementById('lab2ShapeOut');

                    let b = 0, reason = '';
                    if (shape === 'Z') {
                        b = a;
                        reason = `Mẫu chữ Z đại diện cho cặp góc so le trong bằng nhau: $\\widehat{B} = \\widehat{A} = ${b}^\\circ$.`;
                    } else if (shape === 'U') {
                        b = 180 - a;
                        reason = `Mẫu chữ U đại diện cho cặp góc trong cùng phía bù nhau: $\\widehat{B} = 180^\\circ - \\widehat{A} = 180^\\circ - ${a}^\\circ = ${b}^\\circ$.`;
                    } else if (shape === 'F') {
                        b = a;
                        reason = `Mẫu chữ F đại diện cho cặp góc đồng vị bằng nhau: $\\widehat{B} = \\widehat{A} = ${b}^\\circ$.`;
                    }

                    out.innerHTML = `
                        <strong>Kết quả tính toán:</strong> $\\widehat{B} = ${b}^\\circ$<br>
                        <strong>Giải thích:</strong> ${reason}
                    `;
                    renderMathInTree(out);
                }

                document.getElementById('btnCalcShape').addEventListener('click', calcShape);
                setTimeout(calcShape, 100);
            
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
