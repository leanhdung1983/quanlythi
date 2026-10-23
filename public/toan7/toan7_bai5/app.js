// ================================================================
// BÀI 5: LÀM QUEN VỚI SỐ THẬP PHÂN VÔ HẠN TUẦN HOÀN - TOÁN 7 KNTT
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
  userTitle: 'Nhà Giải Mã Chu Kì 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai5_state';

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
    "title": "Câu 1: Nhận biết số thập phân hữu hạn",
    "pts": 20,
    "question": "Phân số nào sau đây viết được dưới dạng số thập phân hữu hạn?",
    "options": [
      {
        "text": "$\\frac{3}{25}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{6}$",
        "correct": false
      },
      {
        "text": "$\\frac{7}{15}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{9}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $25 = 5^2$ (chỉ có ước nguyên tố 5) nên $\\frac{3}{25} = 0,12$ là số thập phân hữu hạn. Các mẫu số 6, 15, 9 đều có ước nguyên tố 3 nên viết được dưới dạng số thập phân vô hạn tuần hoàn."
  },
  {
    "id": 2,
    "title": "Câu 2: Xác định chu kì của số thập phân",
    "pts": 20,
    "question": "Chu kì của số thập phân vô hạn tuần hoàn $-0,1252525...$ là:",
    "options": [
      {
        "text": "$25$",
        "correct": true
      },
      {
        "text": "$125$",
        "correct": false
      },
      {
        "text": "$52$",
        "correct": false
      },
      {
        "text": "$5$",
        "correct": false
      }
    ],
    "explanation": "Nhóm chữ số lặp lại tuần hoàn là 25, ta viết gọn là $-0,1(25)$. Do đó chu kì của số này là 25."
  },
  {
    "id": 3,
    "title": "Câu 3: Đổi phân số ra số thập phân tuần hoàn",
    "pts": 20,
    "question": "Số hữu tỉ $\\frac{7}{11}$ viết dưới dạng số thập phân là:",
    "options": [
      {
        "text": "$0,(63)$",
        "correct": true
      },
      {
        "text": "$0,63$",
        "correct": false
      },
      {
        "text": "$0,(6)$",
        "correct": false
      },
      {
        "text": "$0,6(3)$",
        "correct": false
      }
    ],
    "explanation": "Thực hiện phép chia $7 : 11 = 0,636363... = 0,(63)$."
  },
  {
    "id": 4,
    "title": "Câu 4: Làm tròn số đến hàng phần trăm",
    "pts": 20,
    "question": "Làm tròn số $4,586$ đến hàng phần trăm (chữ số thập phân thứ hai) ta được:",
    "options": [
      {
        "text": "$4,59$",
        "correct": true
      },
      {
        "text": "$4,58$",
        "correct": false
      },
      {
        "text": "$4,60$",
        "correct": false
      },
      {
        "text": "$4,6$",
        "correct": false
      }
    ],
    "explanation": "Chữ số hàng phần trăm là 8. Chữ số ngay sau nó là $6 \\ge 5$ nên ta cộng thêm 1 vào chữ số 8: $8 + 1 = 9$. Kết quả là $4,59$."
  },
  {
    "id": 5,
    "title": "Câu 5: Làm tròn theo độ chính xác d",
    "pts": 20,
    "question": "Làm tròn số $128,435$ với độ chính xác $d = 0,05$ ta được kết quả là:",
    "options": [
      {
        "text": "$128,4$",
        "correct": true
      },
      {
        "text": "$128,44$",
        "correct": false
      },
      {
        "text": "$128,5$",
        "correct": false
      },
      {
        "text": "$128$",
        "correct": false
      }
    ],
    "explanation": "Độ chính xác $d = 0,05$ nghĩa là làm tròn đến hàng phần mười. Chữ số ngay sau hàng phần mười (chữ số 4) là 3 ($3 < 5$) nên ta giữ nguyên. Kết quả là $128,4$."
  },
  {
    "id": 6,
    "title": "Câu 6: Phân số nào là thập phân vô hạn tuần hoàn",
    "pts": 20,
    "question": "Phân số nào sau đây viết được dưới dạng số thập phân vô hạn tuần hoàn?",
    "options": [
      {
        "text": "$\\frac{5}{12}$",
        "correct": true
      },
      {
        "text": "$\\frac{7}{8}$",
        "correct": false
      },
      {
        "text": "$\\frac{9}{40}$",
        "correct": false
      },
      {
        "text": "$\\frac{11}{20}$",
        "correct": false
      }
    ],
    "explanation": "Mẫu số $12 = 2^2 \\cdot 3$ có ước nguyên tố 3 khác 2 và 5 nên $\\frac{5}{12} = 0,41(6)$ là số thập phân vô hạn tuần hoàn. Các phân số còn lại đều có mẫu chỉ chứa ước 2 và 5 nên là số thập phân hữu hạn."
  },
  {
    "id": 7,
    "title": "Câu 7: Đổi số thập phân tuần hoàn đơn giản ra phân số",
    "pts": 20,
    "question": "Số thập phân vô hạn tuần hoàn $0,(7)$ biểu diễn phân số nào?",
    "options": [
      {
        "text": "$\\frac{7}{9}$",
        "correct": true
      },
      {
        "text": "$\\frac{7}{10}$",
        "correct": false
      },
      {
        "text": "$\\frac{7}{99}$",
        "correct": false
      },
      {
        "text": "$\\frac{7}{11}$",
        "correct": false
      }
    ],
    "explanation": "Theo công thức đổi số thập phân vô hạn tuần hoàn đơn ra phân số: $0,(a) = \\frac{a}{9}$. Do đó $0,(7) = \\frac{7}{9}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Ước lượng kết quả phép tính",
    "pts": 20,
    "question": "Ước lượng kết quả của phép tính $49,8 \\cdot 2,05$ bằng cách làm tròn các thừa số đến hàng đơn vị:",
    "options": [
      {
        "text": "$100$",
        "correct": true
      },
      {
        "text": "$98$",
        "correct": false
      },
      {
        "text": "$105$",
        "correct": false
      },
      {
        "text": "$90$",
        "correct": false
      }
    ],
    "explanation": "Làm tròn $49,8 \\approx 50$ và $2,05 \\approx 2$. Tích ước lượng là $50 \\cdot 2 = 100$."
  },
  {
    "id": 9,
    "title": "Câu 9: Làm tròn số lớn",
    "pts": 20,
    "question": "Dân số của một tỉnh là $1\\,284\\,560$ người. Làm tròn số dân này đến hàng nghìn ta được:",
    "options": [
      {
        "text": "$1\\,285\\,000$ người",
        "correct": true
      },
      {
        "text": "$1\\,284\\,000$ người",
        "correct": false
      },
      {
        "text": "$1\\,280\\,000$ người",
        "correct": false
      },
      {
        "text": "$1\\,290\\,000$ người",
        "correct": false
      }
    ],
    "explanation": "Chữ số hàng nghìn là 4, chữ số ngay sau nó là 5 ($5 \\ge 5$) nên ta cộng thêm 1 vào chữ số 4 thành 5, các chữ số sau thay bằng số 0: $1\\,285\\,000$ người."
  },
  {
    "id": 10,
    "title": "Câu 10: Quan hệ giữa số thập phân và tập Q",
    "pts": 20,
    "question": "Khẳng định nào sau đây là ĐÚNG?",
    "options": [
      {
        "text": "Mọi số thập phân vô hạn tuần hoàn đều là số hữu tỉ.",
        "correct": true
      },
      {
        "text": "Mọi số thập phân vô hạn đều là số vô tỉ.",
        "correct": false
      },
      {
        "text": "Số thập phân hữu hạn không phải là số hữu tỉ.",
        "correct": false
      },
      {
        "text": "Số $0,(3)$ không viết được dưới dạng phân số.",
        "correct": false
      }
    ],
    "explanation": "Mỗi số thập phân vô hạn tuần hoàn đều viết được dưới dạng phân số tối giản $\\frac{a}{b}$, do đó nó là số hữu tỉ."
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
    
                function analyzeFraction() {
                    const a = parseInt(document.getElementById('l1_decA').value) || 1;
                    const b = parseInt(document.getElementById('l1_decB').value) || 1;
                    const out = document.getElementById('lab1DecOut');

                    if (b === 0) {
                        out.innerHTML = '<span style="color:#f43f5e;">Lỗi: Mẫu số phải khác 0!</span>';
                        return;
                    }

                    let sign = (a * b < 0) ? '-' : '';
                    let num = Math.abs(a);
                    let den = Math.abs(b);

                    let intPart = Math.floor(num / den);
                    let rem = num % den;

                    let remMap = new Map();
                    let digits = [];
                    let cycleStart = -1;

                    while (rem !== 0) {
                        if (remMap.has(rem)) {
                            cycleStart = remMap.get(rem);
                            break;
                        }
                        remMap.set(rem, digits.length);
                        rem *= 10;
                        let d = Math.floor(rem / den);
                        digits.push(d);
                        rem = rem % den;
                    }

                    let resStr = '';
                    if (cycleStart === -1) {
                        // Thap phan huu han
                        let fracPart = digits.length ? digits.join('') : '0';
                        resStr = `${sign}${intPart},${fracPart}`;
                        out.innerHTML = `Phân số: $\\frac{${a}}{${b}} = ${resStr}$<br><strong>Phân loại:</strong> <span style="color:#10b981;">Số thập phân hữu hạn</span> (mẫu chỉ gồm ước của 2 và 5).`;
                    } else {
                        // Thap phan vo han tuan hoan
                        let nonCycle = digits.slice(0, cycleStart).join('');
                        let cycle = digits.slice(cycleStart).join('');
                        resStr = `${sign}${intPart},${nonCycle}(${cycle})`;
                        out.innerHTML = `Phân số: $\\frac{${a}}{${b}} = ${resStr}$<br><strong>Phân loại:</strong> <span style="color:#f59e0b;">Số thập phân vô hạn tuần hoàn</span><br><strong>Chu kì:</strong> <span style="color:#06b6d4;">(${cycle})</span> với độ dài ${cycle.length} chữ số.`;
                    }
                    renderMathInTree(out);
                }

                document.getElementById('btnAnalyzeDec').addEventListener('click', analyzeFraction);
                setTimeout(analyzeFraction, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                function executeRound() {
                    const val = parseFloat(document.getElementById('l2_roundVal').value) || 0;
                    const decimals = parseInt(document.getElementById('l2_roundTarget').value);
                    const out = document.getElementById('lab2RoundOut');

                    const rounded = val.toFixed(decimals);
                    const strVal = val.toString();
                    const dotIdx = strVal.indexOf('.');

                    let inspectDigit = '0';
                    if (dotIdx !== -1) {
                        const targetIdx = dotIdx + 1 + decimals;
                        if (targetIdx < strVal.length) inspectDigit = strVal[targetIdx];
                    }

                    const numInsp = parseInt(inspectDigit) || 0;
                    const ruleMsg = numInsp >= 5 ? `Chữ số sau hàng làm tròn là <strong>${numInsp} ≥ 5</strong> $\\to$ cộng 1 vào hàng làm tròn.` : `Chữ số sau hàng làm tròn là <strong>${numInsp} < 5</strong> $\\to$ giữ nguyên hàng làm tròn.`;

                    out.innerHTML = `
                        Số ban đầu: $x = ${val}$<br>
                        ${ruleMsg}<br>
                        <strong>Kết quả làm tròn:</strong> $x \\approx ${rounded}$ (Độ chính xác tương ứng: $d = ${(Math.pow(10, -decimals)/2)}$).
                    `;
                    renderMathInTree(out);
                }

                document.getElementById('btnRunRound').addEventListener('click', executeRound);
                setTimeout(executeRound, 100);
            
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
