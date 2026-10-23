// ================================================================
// THỰC HÀNH 4: VÒNG QUAY MAY MẮN - TOÁN 7 KNTT
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
  userTitle: 'Nhà Thiết Kế Trò Chơi Xác Suất 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_thuchanh4_state';

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
    "title": "Câu 1: Góc hình quạt trên vòng quay",
    "pts": 20,
    "question": "Một vòng quay may mắn hình tròn được chia thành 8 hình quạt bằng nhau. Số đo góc ở tâm của mỗi hình quạt là:",
    "options": [
      {
        "text": "$45^\\circ$",
        "correct": true
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$30^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Toàn bộ hình tròn có góc $360^\\circ$. Chia 8 phần bằng nhau: $360^\\circ : 8 = 45^\\circ$."
  },
  {
    "id": 2,
    "title": "Câu 2: Xác suất lí thuyết ô màu",
    "pts": 20,
    "question": "Vòng quay có 8 ô bằng nhau gồm: 4 ô đỏ, 2 ô xanh, 2 ô vàng. Xác suất mũi tên dừng ở ô màu đỏ là:",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{8}$",
        "correct": false
      },
      {
        "text": "$\\frac{3}{8}$",
        "correct": false
      }
    ],
    "explanation": "Có 4 ô đỏ trong tổng số 8 ô: $P = \\frac{4}{8} = \\frac{1}{2} = 50\\%$."
  },
  {
    "id": 3,
    "title": "Câu 3: Xác suất ô màu xanh",
    "pts": 20,
    "question": "Ở vòng quay trên (4 đỏ, 2 xanh, 2 vàng), xác suất dừng ở ô màu xanh là:",
    "options": [
      {
        "text": "$\\frac{1}{4}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{8}$",
        "correct": false
      },
      {
        "text": "$25\\%$",
        "correct": false
      }
    ],
    "explanation": "$P = \\frac{2}{8} = \\frac{1}{4} = 25\\%$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tần số thực nghiệm",
    "pts": 20,
    "question": "Quay vòng quay 100 lần, mũi tên dừng lại ở ô phần thưởng 23 lần. Tần số tương đối thực nghiệm trúng thưởng là:",
    "options": [
      {
        "text": "$0,23$",
        "correct": true
      },
      {
        "text": "$23$",
        "correct": false
      },
      {
        "text": "$0,77$",
        "correct": false
      },
      {
        "text": "$2,3$",
        "correct": false
      }
    ],
    "explanation": "Tần số tương đối bằng số lần thuận lợi chia cho tổng số lần thử: $f = \\frac{23}{100} = 0,23 = 23\\%$."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhận định về xác suất thực nghiệm",
    "pts": 20,
    "question": "Khi số lần quay vòng quay càng nhiều thì xác suất thực nghiệm sẽ:",
    "options": [
      {
        "text": "Càng tiến gần đến xác suất lí thuyết",
        "correct": true
      },
      {
        "text": "Luôn luôn bằng chính xác xác suất lí thuyết",
        "correct": false
      },
      {
        "text": "Càng xa rời xác suất lí thuyết",
        "correct": false
      },
      {
        "text": "Bằng 1",
        "correct": false
      }
    ],
    "explanation": "Theo quy luật số lớn, khi số lần thử đủ lớn, tần số thực nghiệm sẽ tiệm cận và dao động quanh xác suất lí thuyết."
  },
  {
    "id": 6,
    "title": "Câu 6: Vòng quay công bằng",
    "pts": 20,
    "question": "Hai bạn chơi trò chơi với vòng quay 6 ô bằng nhau. Bạn A thắng nếu vào ô chẵn (2, 4, 6), bạn B thắng nếu vào ô lẻ (1, 3, 5). Trò chơi này:",
    "options": [
      {
        "text": "Công bằng vì xác suất thắng của mỗi bạn đều là $\\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "Không công bằng vì số chẵn lớn hơn",
        "correct": false
      },
      {
        "text": "Ưu thế nghiêng về bạn A",
        "correct": false
      },
      {
        "text": "Ưu thế nghiêng về bạn B",
        "correct": false
      }
    ],
    "explanation": "Số ô chẵn và số ô lẻ đều là 3 ô trên tổng số 6 ô nên $P(A) = P(B) = \\frac{3}{6} = \\frac{1}{2}$. Trò chơi hoàn toàn công bằng."
  },
  {
    "id": 7,
    "title": "Câu 7: Xác suất không trúng thưởng",
    "pts": 20,
    "question": "Vòng quay có 10 ô bằng nhau, trong đó chỉ có 1 ô là ô \"Chúc may mắn lần sau\" (không có thưởng). Xác suất nhận được phần thưởng khi quay là:",
    "options": [
      {
        "text": "$\\frac{9}{10} = 90\\%$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{10} = 10\\%$",
        "correct": false
      },
      {
        "text": "$100\\%$",
        "correct": false
      },
      {
        "text": "$50\\%$",
        "correct": false
      }
    ],
    "explanation": "Có 9 ô có thưởng trong tổng số 10 ô: $P = \\frac{9}{10} = 0,9 = 90\\%$."
  },
  {
    "id": 8,
    "title": "Câu 8: Dự đoán số lần xuất hiện",
    "pts": 20,
    "question": "Biết xác suất quay vào ô màu vàng là $0,2$. Dự đoán nếu quay 200 lần thì số lần mũi tên dừng ở ô màu vàng khoảng bao nhiêu lần?",
    "options": [
      {
        "text": "Khoảng $40$ lần",
        "correct": true
      },
      {
        "text": "Khoảng $20$ lần",
        "correct": false
      },
      {
        "text": "Khoảng $50$ lần",
        "correct": false
      },
      {
        "text": "Khoảng $100$ lần",
        "correct": false
      }
    ],
    "explanation": "Số lần dự đoán: $200 \\cdot 0,2 = 40$ lần."
  },
  {
    "id": 9,
    "title": "Câu 9: Góc ở tâm cho xác suất 25%",
    "pts": 20,
    "question": "Muốn ô may mắn có xác suất trúng là $25\\%$ thì góc ở tâm của hình quạt đó phải bằng:",
    "options": [
      {
        "text": "$90^\\circ$",
        "correct": true
      },
      {
        "text": "$45^\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$120^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Góc ở tâm: $360^\\circ \\cdot 25\\% = 360^\\circ \\cdot 0,25 = 90^\\circ$."
  },
  {
    "id": 10,
    "title": "Câu 10: Ý nghĩa thống kê",
    "pts": 20,
    "question": "Một người quay 5 lần liên tiếp đều không trúng thưởng. Ở lần quay thứ 6, xác suất trúng thưởng của người đó có thay đổi không?",
    "options": [
      {
        "text": "Không đổi vì mỗi lần quay là độc lập",
        "correct": true
      },
      {
        "text": "Tăng lên vì đã trượt nhiều lần",
        "correct": false
      },
      {
        "text": "Giảm đi vì đang xui xẻo",
        "correct": false
      },
      {
        "text": "Bằng 1",
        "correct": false
      }
    ],
    "explanation": "Mỗi lần quay vòng quay là một phép thử ngẫu nhiên độc lập, kết quả các lần trước không ảnh hưởng đến xác suất của lần quay tiếp theo."
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
  let counts = { 'Đỏ': 25, 'Xanh': 13, 'Vàng': 12 };

  function draw() {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('KẾT QUẢ THÍ NGHIỆM VÒNG QUAY MAY MẮN (50 LẦN)', canvas1.width / 2, 28);

    // Vẽ biểu đồ cột tần số
    const startX = 100, startY = 170;
    const barW = 70;

    const colors = { 'Đỏ': '#ef4444', 'Xanh': '#3b82f6', 'Vàng': '#f59e0b' };
    const keys = ['Đỏ', 'Xanh', 'Vàng'];

    keys.forEach((k, idx) => {
      const bx = startX + idx * 110;
      const h = counts[k] * 2.5;

      ctx.fillStyle = colors[k];
      ctx.fillRect(bx, startY - h, barW, h);

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 13px sans-serif';
      ctx.fillText(k, bx + barW / 2, startY + 20);
      ctx.fillText(`${counts[k]} lần`, bx + barW / 2, startY - h - 8);
      ctx.fillText(`${Math.round((counts[k]/50)*100)}%`, bx + barW / 2, startY - h / 2);
    });

    // Bảng đối chiếu
    ctx.textAlign = 'left';
    ctx.font = '14px sans-serif';
    const tx = 430;

    ctx.fillStyle = '#38bdf8';
    ctx.fillText('XÁC SUẤT LÍ THUYẾT (4 Đỏ, 2 Xanh, 2 Vàng):', tx, 75);
    ctx.fillStyle = '#ef4444';
    ctx.fillText('• Đỏ: 4/8 = 50%', tx, 105);
    ctx.fillStyle = '#3b82f6';
    ctx.fillText('• Xanh: 2/8 = 25%', tx, 135);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('• Vàng: 2/8 = 25%', tx, 165);

    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText('Tần số thực nghiệm tiệm cận lí thuyết! ✓', tx, 195);
  }

  const btn = document.getElementById('btnLab1Spin50');
  if (btn) {
    btn.onclick = () => {
      counts = { 'Đỏ': 0, 'Xanh': 0, 'Vàng': 0 };
      for (let i = 0; i < 50; i++) {
        const r = Math.random();
        if (r < 0.5) counts['Đỏ']++;
        else if (r < 0.75) counts['Xanh']++;
        else counts['Vàng']++;
      }
      draw();
    };
  }
  draw();
}

  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
const canvas2 = document.getElementById('labCanvas2');
if (canvas2) {
  const ctx2 = canvas2.getContext('2d');
  let currentN = 100;

  function runSim(N) {
    let redCount = 0;
    for (let i = 0; i < N; i++) {
      if (Math.random() < 0.5) redCount++;
    }
    const freq = redCount / N;

    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(`QUY LUẬT SỐ LỚN VỚI SỐ LẦN QUAY N = ${N}`, canvas2.width / 2, 28);

    ctx2.font = '16px serif';
    ctx2.textAlign = 'left';
    const x = 70;

    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText(`• Tổng số lần quay thực nghiệm: N = ${N} lần`, x, 75);

    ctx2.fillStyle = '#ef4444';
    ctx2.fillText(`• Số lần mũi tên dừng ở ô Đỏ: m = ${redCount} lần`, x, 110);

    ctx2.fillStyle = '#f59e0b';
    ctx2.fillText(`• Tần số thực nghiệm: f = ${redCount}/${N} = ${(freq * 100).toFixed(2)}%`, x, 145);

    ctx2.fillStyle = '#10b981';
    ctx2.fillText(`• Xác suất lí thuyết: P = 50.00%`, x, 180);

    const diff = Math.abs(freq - 0.5) * 100;
    ctx2.font = 'bold 15px sans-serif';
    ctx2.fillStyle = diff < 3 ? '#10b981' : '#fbbf24';
    ctx2.fillText(`=> Độ lệch: |f - P| = ${diff.toFixed(2)}% (Khi N càng lớn, độ lệch càng bé!) ✓`, x, 215);
  }

  const b1 = document.getElementById('btnLab2N10');
  const b2 = document.getElementById('btnLab2N100');
  const b3 = document.getElementById('btnLab2N500');
  if (b1) b1.onclick = () => runSim(10);
  if (b2) b2.onclick = () => runSim(100);
  if (b3) b3.onclick = () => runSim(500);
  runSim(100);
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
