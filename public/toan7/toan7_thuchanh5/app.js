// ================================================================
// THỰC HÀNH 5: HỘP QUÀ VÀ CHÂN ĐẾ LỊCH ĐỂ BÀN CỦA EM - TOÁN 7 KNTT
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
  userTitle: 'Nghệ Nhân Thiết Kế Khối 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_thuchanh5_state';

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
    "title": "Câu 1: Diện tích bìa hộp quà lập phương",
    "pts": 20,
    "question": "Bạn Mai muốn làm một hộp quà hình lập phương cạnh $10\\text{ cm}$. Diện tích giấy bìa tối thiểu (chưa tính mép dán) cần dùng là:",
    "options": [
      {
        "text": "$600\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$400\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$1000\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$100\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Diện tích toàn phần hình lập phương: $S_{tp} = 6a^2 = 6 \\cdot 10^2 = 600\\text{ cm}^2$."
  },
  {
    "id": 2,
    "title": "Câu 2: Số mặt của hộp quà không nắp",
    "pts": 20,
    "question": "Một chiếc hộp quà hình chữ nhật không có nắp đậy gồm bao nhiêu mặt?",
    "options": [
      {
        "text": "$5$ mặt (1 đáy và 4 mặt bên)",
        "correct": true
      },
      {
        "text": "$6$ mặt",
        "correct": false
      },
      {
        "text": "$4$ mặt",
        "correct": false
      },
      {
        "text": "$7$ mặt",
        "correct": false
      }
    ],
    "explanation": "Chiếc hộp không nắp chỉ gồm 1 mặt đáy dưới và 4 mặt bên xung quanh, tổng cộng là 5 mặt."
  },
  {
    "id": 3,
    "title": "Câu 3: Diện tích giấy làm hộp không nắp",
    "pts": 20,
    "question": "Tính diện tích bìa để làm một chiếc hộp không nắp có đáy dài $8\\text{ cm}$, rộng $6\\text{ cm}$ và cao $5\\text{ cm}$:",
    "options": [
      {
        "text": "$188\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$236\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$140\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$240\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "$S = S_{xq} + S_{\\text{đáy}} = 2(8 + 6) \\cdot 5 + 8 \\cdot 6 = 140 + 48 = 188\\text{ cm}^2$."
  },
  {
    "id": 4,
    "title": "Câu 4: Chân đế lịch để bàn",
    "pts": 20,
    "question": "Chân đế lịch để bàn chữ A có dạng khối hình học nào?",
    "options": [
      {
        "text": "Hình lăng trụ đứng tam giác",
        "correct": true
      },
      {
        "text": "Hình lăng trụ đứng tứ giác",
        "correct": false
      },
      {
        "text": "Hình chóp tam giác",
        "correct": false
      },
      {
        "text": "Hình hộp chữ nhật",
        "correct": false
      }
    ],
    "explanation": "Chân đế lịch để bàn chữ A có hai đáy là hình tam giác và 3 mặt bên hình chữ nhật, chính là hình lăng trụ đứng tam giác."
  },
  {
    "id": 5,
    "title": "Câu 5: Tính diện tích mép dán 10%",
    "pts": 20,
    "question": "Một hộp quà có diện tích toàn phần là $500\\text{ cm}^2$. Người ta tính thêm $10\\%$ diện tích cho các mép dán. Tổng diện tích giấy bìa cần chuẩn bị là:",
    "options": [
      {
        "text": "$550\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$510\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$600\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$505\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Diện tích bìa cần chuẩn bị: $500 + 500 \\cdot 10\\% = 500 + 50 = 550\\text{ cm}^2$."
  },
  {
    "id": 6,
    "title": "Câu 6: Thể tích hộp quà đựng vừa quả bóng",
    "pts": 20,
    "question": "Một hộp quà hình lập phương cần đựng vừa một quả bóng tròn đường kính $8\\text{ cm}$. Cạnh của hộp quà tối thiểu phải bằng:",
    "options": [
      {
        "text": "$8\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$4\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$16\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$10\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Để quả bóng đường kính $8\\text{ cm}$ lọt vào bên trong hộp thì mỗi cạnh của hộp phải dài tối thiểu $8\\text{ cm}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Chiều dài dây ruy băng gói quà",
    "pts": 20,
    "question": "Một hộp quà hình lập phương cạnh $10\\text{ cm}$ được thắt nơ bằng dây ruy băng vòng qua 4 mặt bên và nơ thắt cần thêm $20\\text{ cm}$ dây. Tổng chiều dài dây ruy băng là:",
    "options": [
      {
        "text": "$60\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$40\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$80\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$100\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Vòng dây quanh 4 mặt của hình lập phương dài: $4 \\cdot 10 = 40\\text{ cm}$. Cộng thêm $20\\text{ cm}$ nơ là $40 + 20 = 60\\text{ cm}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Cắt hình khai triển đúng",
    "pts": 20,
    "question": "Hình khai triển của hình lập phương trên mặt phẳng gồm bao nhiêu hình vuông?",
    "options": [
      {
        "text": "$6$ hình vuông bằng nhau",
        "correct": true
      },
      {
        "text": "$4$ hình vuông",
        "correct": false
      },
      {
        "text": "$8$ hình vuông",
        "correct": false
      },
      {
        "text": "$5$ hình vuông",
        "correct": false
      }
    ],
    "explanation": "Hình lập phương có 6 mặt là 6 hình vuông bằng nhau nên hình khai triển gồm 6 hình vuông bằng nhau."
  },
  {
    "id": 9,
    "title": "Câu 9: Thể tích chân đế lịch",
    "pts": 20,
    "question": "Một chân đế lịch hình lăng trụ đứng tam giác có diện tích đáy tam giác là $20\\text{ cm}^2$ và chiều dài đế lịch là $15\\text{ cm}$. Thể tích của chân đế lịch là:",
    "options": [
      {
        "text": "$300\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$150\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$450\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$600\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "$V = S_{\\text{đáy}} \\cdot h = 20 \\cdot 15 = 300\\text{ cm}^3$."
  },
  {
    "id": 10,
    "title": "Câu 10: Lợi ích của việc làm hộp quà thủ công",
    "pts": 20,
    "question": "Việc tự thiết kế và làm hộp quà bằng bìa tái chế mang lại lợi ích gì?",
    "options": [
      {
        "text": "Bảo vệ môi trường, tiết kiệm chi phí và rèn luyện tư duy không gian",
        "correct": true
      },
      {
        "text": "Tốn nhiều thời gian vô ích",
        "correct": false
      },
      {
        "text": "Không thể chứa được đồ",
        "correct": false
      },
      {
        "text": "Chỉ dùng để trưng bày",
        "correct": false
      }
    ],
    "explanation": "Tự làm sản phẩm thủ công hình khối giúp học sinh rèn luyện tư duy hình học không gian, khả năng khéo léo, tiết kiệm chi phí và bảo vệ môi trường."
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
  let isFolded = false;

  function draw() {
    ctx.clearRect(0, 0, canvas1.width, canvas1.height);

    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 16px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(isFolded ? 'CHÂN ĐẾ LỊCH ĐÃ GẤP HOÀN THIỆN (LĂNG TRỤ TAM GIÁC)' : 'BẢN VẼ TRẢI PHẲNG CHÂN ĐẾ LỊCH TRÊN GIẤY BÌA', canvas1.width / 2, 28);

    if (!isFolded) {
      // Vẽ bản vẽ trải phẳng: 3 mặt chữ nhật liền nhau + 2 tam giác 2 bên
      const startX = 140, startY = 70;
      const w = 120, h1 = 35, h2 = 45, h3 = 45;

      ctx.fillStyle = 'rgba(245, 158, 11, 0.2)';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;

      // 3 mặt chữ nhật
      ctx.fillRect(startX, startY, w, h1); ctx.strokeRect(startX, startY, w, h1);
      ctx.fillRect(startX, startY + h1, w, h2); ctx.strokeRect(startX, startY + h1, w, h2);
      ctx.fillRect(startX, startY + h1 + h2, w, h3); ctx.strokeRect(startX, startY + h1 + h2, w, h3);

      ctx.fillStyle = '#fff';
      ctx.font = '12px sans-serif';
      ctx.fillText('Mặt đáy (bằng phẳng)', startX + w/2, startY + h1/2 + 4);
      ctx.fillText('Mặt trước (dán tờ lịch)', startX + w/2, startY + h1 + h2/2 + 4);
      ctx.fillText('Mặt sau (chống tựa)', startX + w/2, startY + h1 + h2 + h3/2 + 4);

      // 2 tam giác đầu hồi
      ctx.beginPath();
      ctx.moveTo(startX, startY); ctx.lineTo(startX - 35, startY + h1/2); ctx.lineTo(startX, startY + h1);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(startX + w, startY); ctx.lineTo(startX + w + 35, startY + h1/2); ctx.lineTo(startX + w, startY + h1);
      ctx.closePath(); ctx.fill(); ctx.stroke();
    } else {
      // Vẽ lăng trụ tam giác 3D
      const ox = 200, oy = 170;
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 2;

      // Đáy trước
      ctx.beginPath();
      ctx.moveTo(ox, oy); ctx.lineTo(ox + 50, oy - 80); ctx.lineTo(ox + 80, oy);
      ctx.closePath(); ctx.fill(); ctx.stroke();

      // Kéo dài ra sau
      ctx.beginPath();
      ctx.moveTo(ox + 50, oy - 80); ctx.lineTo(ox + 180, oy - 110);
      ctx.lineTo(ox + 210, oy - 30); ctx.lineTo(ox + 80, oy);
      ctx.stroke();

      ctx.fillStyle = '#fff';
      ctx.font = 'bold 14px sans-serif';
      ctx.fillText('LỊCH ĐỂ BÀN NĂM 2026', ox + 110, oy - 45);
    }

    ctx.font = '14px sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.fillText('Bấm nút để chuyển đổi giữa bản vẽ trải phẳng và khối mô hình 3D', canvas1.width / 2, 222);
  }

  const btn = document.getElementById('btnLab1Fold');
  if (btn) {
    btn.onclick = () => {
      isFolded = !isFolded;
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
  const inA = document.getElementById('lab2A');
  const inB = document.getElementById('lab2B');
  const inH = document.getElementById('lab2H');
  const btn = document.getElementById('btnLab2Calc');

  function calculate() {
    const a = parseFloat(inA ? inA.value : 10);
    const b = parseFloat(inB ? inB.value : 10);
    const h = parseFloat(inH ? inH.value : 12);

    ctx2.clearRect(0, 0, canvas2.width, canvas2.height);

    ctx2.fillStyle = '#f8fafc';
    ctx2.font = 'bold 16px sans-serif';
    ctx2.textAlign = 'center';
    ctx2.fillText(`BẢNG DỰ TOÁN NGUYÊN LIỆU HỘP QUÀ: ${a} × ${b} × ${h} (cm)`, canvas2.width / 2, 28);

    const Sxq = 2 * (a + b) * h;
    const Stp = Sxq + 2 * a * b;
    const Stotal = Math.round(Stp * 1.15); // Cộng 15% mép dán & hao hụt
    const V = a * b * h;

    ctx2.textAlign = 'left';
    ctx2.font = '15px sans-serif';
    const x = 70;

    ctx2.fillStyle = '#38bdf8';
    ctx2.fillText(`1. Diện tích bề mặt hộp: Stp = ${Stp} cm² (${(Stp / 10000).toFixed(4)} m²)`, x, 70);

    ctx2.fillStyle = '#f59e0b';
    ctx2.fillText(`2. Diện tích giấy bìa thực tế (cộng 15% mép dán): Sbìa ≈ ${Stotal} cm²`, x, 105);

    ctx2.fillStyle = '#10b981';
    ctx2.fillText(`3. Sức chứa thể tích quà tặng: V = a · b · h = ${V} cm³ (${(V / 1000).toFixed(2)} lít)`, x, 140);

    ctx2.font = 'bold 15px sans-serif';
    ctx2.fillStyle = '#ec4899';
    ctx2.fillText(`=> Cần 1 tờ bìa A3 (kích thước khoảng 30 × 42 cm = 1260 cm²) là đủ làm hộp! ✓`, x, 185);
  }

  if (btn) btn.onclick = calculate;
  calculate();
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
