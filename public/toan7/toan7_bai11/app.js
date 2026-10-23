// ================================================================
// BÀI 11: ĐỊNH LÍ VÀ CHỨNG MINH ĐỊNH LÍ - TOÁN 7 KNTT
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
  userTitle: 'Nhà Logic Học Hình Học 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai11_state';

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
    "title": "Câu 1: Cấu trúc của định lí",
    "pts": 20,
    "question": "Trong một định lí toán học, phần giả thiết (GT) là:",
    "options": [
      {
        "text": "Điều đã cho, được coi là đúng",
        "correct": true
      },
      {
        "text": "Điều cần suy ra hoặc chứng minh",
        "correct": false
      },
      {
        "text": "Hình vẽ minh hoạ định lí",
        "correct": false
      },
      {
        "text": "Các phép tính số học",
        "correct": false
      }
    ],
    "explanation": "Giả thiết (GT) là những điều kiện đã cho từ ban đầu; Kết luận (KL) là điều cần suy ra từ giả thiết."
  },
  {
    "id": 2,
    "title": "Câu 2: Xác định giả thiết trong câu văn",
    "pts": 20,
    "question": "Cho định lí: 'Nếu một đường thẳng cắt hai đường thẳng song song thì hai góc so le trong bằng nhau'. Giả thiết của định lí là:",
    "options": [
      {
        "text": "Một đường thẳng cắt hai đường thẳng song song",
        "correct": true
      },
      {
        "text": "Hai góc so le trong bằng nhau",
        "correct": false
      },
      {
        "text": "Hai đường thẳng song song",
        "correct": false
      },
      {
        "text": "Một đường thẳng cắt hai đường thẳng",
        "correct": false
      }
    ],
    "explanation": "Phần nằm sau từ 'Nếu' và trước từ 'thì' là giả thiết: 'Một đường thẳng cắt hai đường thẳng song song'."
  },
  {
    "id": 3,
    "title": "Câu 3: Xác định kết luận của định lí",
    "pts": 20,
    "question": "Cho định lí: 'Nếu hai đường thẳng phân biệt cùng song song với một đường thẳng thứ ba thì chúng song song với nhau'. Kết luận của định lí là:",
    "options": [
      {
        "text": "Chúng song song với nhau",
        "correct": true
      },
      {
        "text": "Hai đường thẳng phân biệt",
        "correct": false
      },
      {
        "text": "Cùng song song với một đường thẳng thứ ba",
        "correct": false
      },
      {
        "text": "Ba đường thẳng cắt nhau",
        "correct": false
      }
    ],
    "explanation": "Phần nằm sau từ 'thì' là kết luận: 'Chúng song song với nhau'."
  },
  {
    "id": 4,
    "title": "Câu 4: Thế nào là chứng minh định lí",
    "pts": 20,
    "question": "Chứng minh một định lí là:",
    "options": [
      {
        "text": "Dùng lập luận logic để từ giả thiết suy ra kết luận",
        "correct": true
      },
      {
        "text": "Dùng thước đo độ dài để kiểm tra",
        "correct": false
      },
      {
        "text": "Vẽ nhiều hình thật đẹp để quan sát",
        "correct": false
      },
      {
        "text": "Thừa nhận không cần giải thích",
        "correct": false
      }
    ],
    "explanation": "Chứng minh định lí là quá trình sử dụng các lập luận logic chặt chẽ dựa trên các khẳng định đúng đã biết để từ giả thiết dẫn tới kết luận."
  },
  {
    "id": 5,
    "title": "Câu 5: Phát biểu lại dưới dạng 'Nếu... thì...'",
    "pts": 20,
    "question": "Phát biểu nào sau đây diễn đạt lại định lí 'Hai góc đối đỉnh thì bằng nhau' dưới dạng chuẩn 'Nếu ... thì ...'?",
    "options": [
      {
        "text": "Nếu hai góc đối đỉnh thì hai góc đó bằng nhau.",
        "correct": true
      },
      {
        "text": "Nếu hai góc bằng nhau thì hai góc đó đối đỉnh.",
        "correct": false
      },
      {
        "text": "Nếu hai góc kề bù thì hai góc đó bằng nhau.",
        "correct": false
      },
      {
        "text": "Nếu hai góc có chung đỉnh thì chúng bằng nhau.",
        "correct": false
      }
    ],
    "explanation": "Giả thiết là 'hai góc đối đỉnh', kết luận là 'chúng bằng nhau', do đó viết chuẩn là: 'Nếu hai góc đối đỉnh thì hai góc đó bằng nhau'."
  },
  {
    "id": 6,
    "title": "Câu 6: Định lí hai góc cùng bù",
    "pts": 20,
    "question": "Biết $\\widehat{A} + \\widehat{C} = 180^\\circ$ và $\\widehat{B} + \\widehat{C} = 180^\\circ$. Kết luận nào sau đây là ĐÚNG?",
    "options": [
      {
        "text": "$\\widehat{A} = \\widehat{B}$",
        "correct": true
      },
      {
        "text": "$\\widehat{A} + \\widehat{B} = 180^\\circ$",
        "correct": false
      },
      {
        "text": "$\\widehat{A} > \\widehat{B}$",
        "correct": false
      },
      {
        "text": "$\\widehat{A} \\perp \\widehat{B}$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí: Hai góc cùng bù với một góc thứ ba thì bằng nhau, do đó $\\widehat{A} = 180^\\circ - \\widehat{C} = \\widehat{B}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Khẳng định nào sau đây là định lí",
    "pts": 20,
    "question": "Khẳng định nào sau đây là một ĐỊNH LÍ toán học?",
    "options": [
      {
        "text": "Tổng ba góc trong một tam giác bằng $180^\\circ$",
        "correct": true
      },
      {
        "text": "Hôm nay trời nắng to",
        "correct": false
      },
      {
        "text": "Tam giác vuông là tam giác có một góc vuông",
        "correct": false
      },
      {
        "text": "Qua một điểm ở ngoài đường thẳng có duy nhất một đường song song",
        "correct": false
      }
    ],
    "explanation": "'Tổng ba góc trong một tam giác bằng $180^\\circ$' là định lí được chứng minh. Phương án C là định nghĩa; phương án D là tiên đề Euclid."
  },
  {
    "id": 8,
    "title": "Câu 8: Căn cứ trong từng bước chứng minh",
    "pts": 20,
    "question": "Trong khi trình bày bài chứng minh hình học, căn cứ ở mỗi bước suy luận:",
    "options": [
      {
        "text": "Bắt buộc phải nêu rõ (dựa vào định nghĩa, tiên đề, định lí đã học)",
        "correct": true
      },
      {
        "text": "Không cần thiết phải ghi",
        "correct": false
      },
      {
        "text": "Chỉ cần ghi 'theo mắt nhìn'",
        "correct": false
      },
      {
        "text": "Chỉ cần đo bằng thước",
        "correct": false
      }
    ],
    "explanation": "Tính chính xác của chứng minh đòi hỏi mỗi bước suy luận phải có căn cứ xác thực được công nhận."
  },
  {
    "id": 9,
    "title": "Câu 9: Bác bỏ mệnh đề bằng phản ví dụ",
    "pts": 20,
    "question": "Để chứng minh khẳng định 'Hai góc bằng nhau thì đối đỉnh' là SAI, ta chỉ cần:",
    "options": [
      {
        "text": "Chỉ ra một trường hợp hai góc bằng nhau nhưng không đối đỉnh (phản ví dụ)",
        "correct": true
      },
      {
        "text": "Vẽ thật nhiều hình mà không thấy đối đỉnh",
        "correct": false
      },
      {
        "text": "Nói rằng không tin",
        "correct": false
      },
      {
        "text": "Không thể chứng minh là sai",
        "correct": false
      }
    ],
    "explanation": "Trong toán học, chỉ cần đưa ra MỘT phản ví dụ (chẳng hạn hai góc so le trong bằng nhau hoặc hai góc trong tam giác đều bằng $60^\\circ$ nhưng không chung đỉnh) là đủ bác bỏ một khẳng định sai."
  },
  {
    "id": 10,
    "title": "Câu 10: Ý nghĩa của việc chứng minh định lí",
    "pts": 20,
    "question": "Việc học cách chứng minh định lí rèn luyện cho học sinh năng lực gì quan trọng nhất?",
    "options": [
      {
        "text": "Tư duy logic, lập luận có căn cứ và suy luận khoa học chặt chẽ",
        "correct": true
      },
      {
        "text": "Khả năng vẽ hình nhanh bằng tay",
        "correct": false
      },
      {
        "text": "Ghi nhớ máy móc các con số",
        "correct": false
      },
      {
        "text": "Tính toán số học bằng máy tính",
        "correct": false
      }
    ],
    "explanation": "Chứng minh định lí là cái nôi rèn luyện tư duy logic phản biện, phương pháp suy luận diễn dịch khoa học và khả năng lập luận chặt chẽ."
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
    
                const thmData = {
                    '1': {
                        statement: 'Nếu hai góc đối đỉnh thì hai góc đó bằng nhau.',
                        gt: '$\widehat{O_1}$ và $\widehat{O_3}$ là hai góc đối đỉnh',
                        kl: '$\widehat{O_1} = \widehat{O_3}$',
                        reason: 'Cùng kề bù với góc thứ ba $\widehat{O_2}$'
                    },
                    '2': {
                        statement: 'Nếu hai đường thẳng phân biệt cùng vuông góc với một đường thẳng thứ ba thì chúng song song với nhau.',
                        gt: '$a \\perp c$ và $b \\perp c$ ($a, b$ phân biệt)',
                        kl: '$a \\parallel b$',
                        reason: 'Tạo ra cặp góc đồng vị bằng $90^\\circ$'
                    },
                    '3': {
                        statement: 'Nếu $Oz$ là tia phân giác của góc $\widehat{xOy}$ thì $\widehat{xOz} = \widehat{zOy} = \frac{\widehat{xOy}}{2}$.',
                        gt: '$Oz$ là tia phân giác của góc $\widehat{xOy}$',
                        kl: '$\widehat{xOz} = \widehat{zOy} = \\frac{\widehat{xOy}}{2}$',
                        reason: 'Theo định nghĩa tia phân giác'
                    }
                };

                function updateThm() {
                    const sel = document.getElementById('l1_thmSelect').value;
                    const d = thmData[sel];
                    const out = document.getElementById('lab1ThmOut');
                    out.innerHTML = `
                        <strong>Phát biểu dạng 'Nếu ... thì':</strong><br><em>${d.statement}</em><br><br>
                        <div style="display:flex; gap:16px; flex-wrap:wrap;">
                            <div style="flex:1; min-width:200px; background:rgba(99,102,241,0.2); padding:10px; border-radius:8px; border:1px solid #818cf8;">
                                <span style="color:#818cf8; font-weight:bold;">📋 GIẢ THIẾT (GT):</span><br>${d.gt}
                            </div>
                            <div style="flex:1; min-width:200px; background:rgba(16,185,129,0.2); padding:10px; border-radius:8px; border:1px solid #10b981;">
                                <span style="color:#10b981; font-weight:bold;">🎯 KẾT LUẬN (KL):</span><br>${d.kl}
                            </div>
                        </div>
                        <p style="margin-top:8px;"><strong>Căn cứ suy luận:</strong> ${d.reason}</p>
                    `;
                    renderMathInTree(out);
                }

                document.getElementById('l1_thmSelect').addEventListener('change', updateThm);
                setTimeout(updateThm, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                document.getElementById('btnShowProofChain').addEventListener('click', () => {
                    const out = document.getElementById('lab2ProofOut');
                    out.innerHTML = `
                        <strong>Chuỗi chứng minh logic 3 bước:</strong><br>
                        <em>Bước 1:</em> Vì $\\widehat{A}$ phụ với $\\widehat{C}$ nên $\\widehat{A} + \\widehat{C} = 90^\\circ \\implies \\widehat{A} = 90^\\circ - \\widehat{C}$ (1)<br>
                        <em>Bước 2:</em> Vì $\\widehat{B}$ phụ với $\\widehat{C}$ nên $\\widehat{B} + \\widehat{C} = 90^\\circ \\implies \\widehat{B} = 90^\\circ - \\widehat{C}$ (2)<br>
                        <em>Bước 3 (Bắc cầu):</em> Từ (1) và (2) suy ra $\\widehat{A} = \\widehat{B}$ (điều phải chứng minh).
                    `;
                    renderMathInTree(out);
                });
            
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
