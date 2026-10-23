// ================================================================
// BÀI 9: HAI ĐƯỜNG THẲNG SONG SONG VÀ DẤU HIỆU NHẬN BIẾT - TOÁN 7 KNTT
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
  userTitle: 'Kỹ Sư Hình Học Song Song 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai9_state';

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
    "title": "Câu 1: Dấu hiệu nhận biết hai đường thẳng song song",
    "pts": 20,
    "question": "Đường thẳng $c$ cắt hai đường thẳng $a$ và $b$. Điều kiện nào sau đây KHẲNG ĐỊNH $a \\parallel b$?",
    "options": [
      {
        "text": "Một cặp góc so le trong bằng nhau",
        "correct": true
      },
      {
        "text": "Một cặp góc trong cùng phía bằng nhau",
        "correct": false
      },
      {
        "text": "Một cặp góc kề bù bằng nhau",
        "correct": false
      },
      {
        "text": "Hai góc đối đỉnh bằng nhau",
        "correct": false
      }
    ],
    "explanation": "Theo dấu hiệu nhận biết, nếu một đường thẳng cắt hai đường thẳng mà tạo ra một cặp góc so le trong bằng nhau (hoặc đồng vị bằng nhau) thì hai đường thẳng đó song song."
  },
  {
    "id": 2,
    "title": "Câu 2: Số đo góc đồng vị khi song song",
    "pts": 20,
    "question": "Cho $a \\parallel b$. Đường thẳng $c$ cắt $a$ tại $A$ và cắt $b$ tại $B$. Biết góc $\\widehat{A_1} = 50^\\circ$. Góc đồng vị $\\widehat{B_1}$ với góc $\\widehat{A_1}$ có số đo là:",
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
        "text": "$40^\\circ$",
        "correct": false
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Vì $a \\parallel b$ nên hai góc đồng vị bằng nhau: $\\widehat{B_1} = \\widehat{A_1} = 50^\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Góc trong cùng phía",
    "pts": 20,
    "question": "Cho $a \\parallel b$. Hai góc trong cùng phía $\\widehat{A_4}$ và $\\widehat{B_1}$ có mối quan hệ nào sau đây?",
    "options": [
      {
        "text": "$\\widehat{A_4} + \\widehat{B_1} = 180^\\circ$",
        "correct": true
      },
      {
        "text": "$\\widehat{A_4} = \\widehat{B_1}$",
        "correct": false
      },
      {
        "text": "$\\widehat{A_4} + \\widehat{B_1} = 90^\\circ$",
        "correct": false
      },
      {
        "text": "$\\widehat{A_4} - \\widehat{B_1} = 90^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Khi hai đường thẳng song song bị cắt bởi một cát tuyến, hai góc trong cùng phía luôn bù nhau, tức tổng số đo bằng $180^\\circ$."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính số đo góc từ hai đường thẳng song song",
    "pts": 20,
    "question": "Cho hình vẽ có $a \\parallel b$. Biết góc $\\widehat{A_2} = 120^\\circ$. Góc so le trong với góc $\\widehat{A_2}$ có số đo bằng:",
    "options": [
      {
        "text": "$120^\\circ$",
        "correct": true
      },
      {
        "text": "$60^\\circ$",
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
    "explanation": "Hai đường thẳng song song thì hai góc so le trong bằng nhau, do đó góc so le trong cũng có số đo bằng $120^\\circ$."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhận biết song song từ góc trong cùng phía",
    "pts": 20,
    "question": "Đường thẳng $c$ cắt hai đường thẳng $m$ và $n$. Hai góc trong cùng phía có số đo lần lượt là $75^\\circ$ và $105^\\circ$. Kết luận nào sau đây là ĐÚNG?",
    "options": [
      {
        "text": "$m \\parallel n$",
        "correct": true
      },
      {
        "text": "$m$ cắt $n$",
        "correct": false
      },
      {
        "text": "$m \\perp n$",
        "correct": false
      },
      {
        "text": "$m$ trùng với $n$",
        "correct": false
      }
    ],
    "explanation": "Tổng số đo hai góc trong cùng phía là $75^\\circ + 105^\\circ = 180^\\circ$ (bù nhau). Theo dấu hiệu nhận biết, hai đường thẳng $m$ và $n$ song song với nhau."
  },
  {
    "id": 6,
    "title": "Câu 6: Vị trí của hai đường thẳng",
    "pts": 20,
    "question": "Hai đường thẳng phân biệt cùng nằm trong một mặt phẳng và không có điểm chung nào thì hai đường thẳng đó:",
    "options": [
      {
        "text": "Song song với nhau",
        "correct": true
      },
      {
        "text": "Cắt nhau",
        "correct": false
      },
      {
        "text": "Trùng nhau",
        "correct": false
      },
      {
        "text": "Vuông góc với nhau",
        "correct": false
      }
    ],
    "explanation": "Theo định nghĩa, hai đường thẳng không có điểm chung trong cùng một mặt phẳng là hai đường thẳng song song."
  },
  {
    "id": 7,
    "title": "Câu 7: Cặp góc so le ngoài",
    "pts": 20,
    "question": "Cho $x \\parallel y$. Một cát tuyến cắt $x, y$ tạo thành một góc ngoài bằng $45^\\circ$. Góc so le ngoài với góc đó có số đo là:",
    "options": [
      {
        "text": "$45^\\circ$",
        "correct": true
      },
      {
        "text": "$135^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Khi hai đường thẳng song song, các cặp góc so le trong bằng nhau, từ đó suy ra các cặp góc so le ngoài cũng bằng nhau ($= 45^\\circ$)."
  },
  {
    "id": 8,
    "title": "Câu 8: Nhận diện góc so le trong từ hình vẽ",
    "pts": 20,
    "question": "Cho tam giác $ABC$. Qua $A$ kẻ đường thẳng $xy \\parallel BC$. Cặp góc nào sau đây là cặp góc so le trong?",
    "options": [
      {
        "text": "$\\widehat{xAB}$ và $\\widehat{ABC}$",
        "correct": true
      },
      {
        "text": "$\\widehat{xAB}$ và $\\widehat{ACB}$",
        "correct": false
      },
      {
        "text": "$\\widehat{BAC}$ và $\\widehat{ABC}$",
        "correct": false
      },
      {
        "text": "$\\widehat{yAC}$ và $\\widehat{ABC}$",
        "correct": false
      }
    ],
    "explanation": "Cát tuyến $AB$ cắt hai đường song song $xy$ và $BC$ tạo ra cặp góc so le trong là $\\widehat{xAB}$ và $\\widehat{ABC}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bác bỏ mệnh đề sai",
    "pts": 20,
    "question": "Đường thẳng $c$ cắt $a$ và $b$ tạo thành một cặp góc đồng vị có số đo lần lượt là $80^\\circ$ và $85^\\circ$. Khẳng định nào sau đây là ĐÚNG?",
    "options": [
      {
        "text": "Hai đường thẳng $a$ và $b$ cắt nhau",
        "correct": true
      },
      {
        "text": "$a \\parallel b$",
        "correct": false
      },
      {
        "text": "$a \\perp b$",
        "correct": false
      },
      {
        "text": "$a$ trùng với $b$",
        "correct": false
      }
    ],
    "explanation": "Vì hai góc đồng vị không bằng nhau ($80^\\circ \\neq 85^\\circ$) nên hai đường thẳng $a$ và $b$ không song song, tức là chúng cắt nhau."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng đường thẳng song song trong thực tế",
    "pts": 20,
    "question": "Hình ảnh nào sau đây trong đời sống thực tế minh hoạ rõ nét nhất cho hai đường thẳng song song?",
    "options": [
      {
        "text": "Hai thanh ray của một đoạn đường tàu hoả thẳng",
        "correct": true
      },
      {
        "text": "Hai cạnh liền kề của một quyển vở",
        "correct": false
      },
      {
        "text": "Hai chiếc kim đồng hồ lúc 3 giờ",
        "correct": false
      },
      {
        "text": "Cột cờ và mặt đất",
        "correct": false
      }
    ],
    "explanation": "Hai thanh ray đường tàu hoả trên đoạn đường thẳng luôn cách đều nhau và không bao giờ cắt nhau, là hình ảnh thực tế chuẩn mực của hai đường thẳng song song."
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
                let slopeB = 0, cutC = 60;

                function drawParallel() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const y1 = 60;
                    const y2 = 140;

                    const isParallel = (slopeB === 0);

                    // Duong thang a (nam ngang)
                    ctx.strokeStyle = '#6366f1';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(30, y1);
                    ctx.lineTo(w - 30, y1);
                    ctx.stroke();

                    // Duong thang b (nghieng slopeB do)
                    const radB = slopeB * Math.PI / 180;
                    ctx.strokeStyle = isParallel ? '#10b981' : '#f43f5e';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(30, y2 - (w/2 - 30) * Math.sin(radB));
                    ctx.lineTo(w - 30, y2 + (w/2 - 30) * Math.sin(radB));
                    ctx.stroke();

                    // Cat tuyen c (goc cutC do)
                    const radC = cutC * Math.PI / 180;
                    const midX = w / 2;
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 2.5;
                    ctx.beginPath();
                    ctx.moveTo(midX - 70 * Math.cos(radC), y1 - 35);
                    ctx.lineTo(midX + 110 * Math.cos(radC), y2 + 45);
                    ctx.stroke();

                    // Dinh A va B
                    const ax = midX;
                    const bx = midX + (y2 - y1) / Math.tan(radC);

                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Segoe UI';
                    ctx.fillText('a', w - 20, y1 + 5);
                    ctx.fillText('b', w - 20, y2 + 5);
                    ctx.fillText('c (cát tuyến)', midX - 35, y1 - 25);

                    ctx.fillStyle = '#f59e0b';
                    ctx.fillText(`A1 = ${cutC}°`, ax + 15, y1 + 18);
                    ctx.fillText(`B3 = ${cutC - slopeB}°`, bx - 45, y2 - 8);

                    const out = document.getElementById('lab1ParallelOut');
                    if (isParallel) {
                        out.innerHTML = `<span style="color:#10b981;">✅ HAI ĐƯỜNG THẲNG SONG SONG ($a \\parallel b$)!</span> Cặp góc so le trong bằng nhau: $\\widehat{A_1} = \\widehat{B_3} = ${cutC}^\\circ$.`;
                    } else {
                        out.innerHTML = `<span style="color:#f43f5e;">❌ CHƯA SONG SONG!</span> $\\widehat{A_1} = ${cutC}^\\circ \\neq \\widehat{B_3} = ${cutC - slopeB}^\\circ$ (lệch ${Math.abs(slopeB)}°).`;
                    }
                    renderMathInTree(out);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 200 * window.devicePixelRatio || 200;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawParallel();
                }

                document.getElementById('sliderSlopeB').addEventListener('input', e => {
                    slopeB = parseInt(e.target.value);
                    document.getElementById('valSlopeB').textContent = `${slopeB}°`;
                    drawParallel();
                });
                document.getElementById('sliderCutC').addEventListener('input', e => {
                    cutC = parseInt(e.target.value);
                    document.getElementById('valCutC').textContent = `${cutC}°`;
                    drawParallel();
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const details = {
                    'slt': '<strong>Cặp góc so le trong:</strong> Nằm khác phía đối với cát tuyến $c$ và nằm giữa hai đường thẳng $a, b$. Ví dụ: $(\\widehat{A_4}, \\widehat{B_2})$ và $(\\widehat{A_3}, \\widehat{B_1})$. Nếu $a \\parallel b$ thì các cặp góc này bằng nhau.',
                    'dv': '<strong>Cặp góc đồng vị:</strong> Nằm cùng phía đối với cát tuyến $c$ và cùng nằm phía trên (hoặc cùng phía dưới) so với hai đường thẳng $a, b$. Ví dụ: $(\\widehat{A_1}, \\widehat{B_1})$, $(\\widehat{A_2}, \\widehat{B_2})$. Nếu $a \\parallel b$ thì các cặp góc này bằng nhau.',
                    'tcp': '<strong>Cặp góc trong cùng phía:</strong> Nằm cùng phía đối với cát tuyến $c$ và nằm giữa hai đường thẳng $a, b$. Ví dụ: $(\\widehat{A_4}, \\widehat{B_1})$ và $(\\widehat{A_3}, \\widehat{B_2})$. Nếu $a \\parallel b$ thì tổng của chúng bằng $180^\\circ$ (bù nhau).'
                };

                function setPos(k) {
                    const out = document.getElementById('lab2AnglePosOut');
                    out.innerHTML = details[k];
                    renderMathInTree(out);
                }

                document.getElementById('btnSoleTrong').addEventListener('click', () => setPos('slt'));
                document.getElementById('btnDongVi').addEventListener('click', () => setPos('dv'));
                document.getElementById('btnTrongCungPhia').addEventListener('click', () => setPos('tcp'));

                setTimeout(() => setPos('slt'), 100);
            
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
