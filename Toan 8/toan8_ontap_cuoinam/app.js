// ================================================================
// BÀI TẬP ÔN TẬP CUỐI NĂM TOÁN 8 - TOÁN 8 KNTT
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
  userTitle: 'Đại Thủ Khoa Toán 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_ontap_cuoinam_state';

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
    "title": "Câu 1: Rút gọn phân thức đại số tổng hợp",
    "pts": 20,
    "question": "Rút gọn biểu thức $A = \\frac{x^2 - 4}{x^2 + 4x + 4}$ với $x \\neq -2$ ta được:",
    "options": [
      {
        "text": "$\\frac{x - 2}{x + 2}$",
        "correct": true
      },
      {
        "text": "$\\frac{x + 2}{x - 2}$",
        "correct": false
      },
      {
        "text": "$\\frac{x - 2}{(x + 2)^2}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{(x - 2)(x + 2)}{(x + 2)^2} = \\frac{x - 2}{x + 2}$."
  },
  {
    "id": 2,
    "title": "Câu 2: Nghiệm của phương trình bậc nhất",
    "pts": 20,
    "question": "Nghiệm của phương trình $5(x - 1) - 2x = 7$ là:",
    "options": [
      {
        "text": "$x = 4$",
        "correct": true
      },
      {
        "text": "$x = 2$",
        "correct": false
      },
      {
        "text": "$x = -4$",
        "correct": false
      },
      {
        "text": "$x = 3$",
        "correct": false
      }
    ],
    "explanation": "Phá ngoặc: $5x - 5 - 2x = 7 \\iff 3x = 12 \\iff x = 4$."
  },
  {
    "id": 3,
    "title": "Câu 3: Đồ thị hàm số bậc nhất cắt trục hoành",
    "pts": 20,
    "question": "Giao điểm của đồ thị hàm số $y = 3x - 9$ với trục hoành $Ox$ là:",
    "options": [
      {
        "text": "$(3; 0)$",
        "correct": true
      },
      {
        "text": "$(0; -9)$",
        "correct": false
      },
      {
        "text": "$(-3; 0)$",
        "correct": false
      },
      {
        "text": "$(0; 3)$",
        "correct": false
      }
    ],
    "explanation": "Cho $y = 0 \\iff 3x - 9 = 0 \\iff x = 3$. Tọa độ giao điểm là $(3; 0)$."
  },
  {
    "id": 4,
    "title": "Câu 4: Định lí Pythagore đảo",
    "pts": 20,
    "question": "Tam giác có độ dài ba cạnh nào sau đây là tam giác vuông?",
    "options": [
      {
        "text": "$8\\text{ cm};\\, 15\\text{ cm};\\, 17\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$5\\text{ cm};\\, 6\\text{ cm};\\, 7\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$7\\text{ cm};\\, 9\\text{ cm};\\, 12\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$10\\text{ cm};\\, 12\\text{ cm};\\, 15\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $8^2 + 15^2 = 64 + 225 = 289 = 17^2$. Do đó đây là tam giác vuông."
  },
  {
    "id": 5,
    "title": "Câu 5: Tỉ số diện tích hai tam giác đồng dạng",
    "pts": 20,
    "question": "Cho $\\triangle ABC \\backsim \\triangle MNP$ theo tỉ số $k = 4$. Biết diện tích $\\triangle MNP$ là $5\\text{ cm}^2$. Diện tích $\\triangle ABC$ là:",
    "options": [
      {
        "text": "$80\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$20\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$40\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$16\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Tỉ số diện tích bằng $k^2 = 4^2 = 16$. Diện tích $\\triangle ABC = 16 \\times 5 = 80\\text{ cm}^2$."
  },
  {
    "id": 6,
    "title": "Câu 6: Thể tích hình chóp tứ giác đều",
    "pts": 20,
    "question": "Một hình chóp tứ giác đều có cạnh đáy $6\\text{ cm}$, chiều cao $8\\text{ cm}$. Thể tích của hình chóp là:",
    "options": [
      {
        "text": "$96\\text{ cm}^3$",
        "correct": true
      },
      {
        "text": "$288\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$144\\text{ cm}^3$",
        "correct": false
      },
      {
        "text": "$48\\text{ cm}^3$",
        "correct": false
      }
    ],
    "explanation": "Diện tích đáy $S = 6^2 = 36\\text{ cm}^2$. Thể tích $V = \\frac{1}{3} \\times 36 \\times 8 = 96\\text{ cm}^3$."
  },
  {
    "id": 7,
    "title": "Câu 7: Xác suất cổ điển gieo xúc xắc",
    "pts": 20,
    "question": "Gieo một con xúc xắc 6 mặt đồng chất. Xác suất xuất hiện mặt có số chấm chia hết cho $3$ là:",
    "options": [
      {
        "text": "$\\frac{1}{3}$",
        "correct": true
      },
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{6}$",
        "correct": false
      },
      {
        "text": "$\\frac{2}{3}$",
        "correct": false
      }
    ],
    "explanation": "Các mặt chia hết cho 3 là $\\{3; 6\\}$ ($k = 2$). Xác suất $P = \\frac{2}{6} = \\frac{1}{3}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Giải bài toán bằng cách lập phương trình chuyển động",
    "pts": 20,
    "question": "Một xe máy đi từ A đến B với vận tốc $40\\text{ km/h}$ rồi quay về A với vận tốc $30\\text{ km/h}$. Tổng thời gian cả đi lẫn về là $3{,}5\\text{ giờ}$. Quãng đường AB dài:",
    "options": [
      {
        "text": "$60\\text{ km}$",
        "correct": true
      },
      {
        "text": "$70\\text{ km}$",
        "correct": false
      },
      {
        "text": "$80\\text{ km}$",
        "correct": false
      },
      {
        "text": "$50\\text{ km}$",
        "correct": false
      }
    ],
    "explanation": "Gọi quãng đường là $S$. Phương trình: $\\frac{S}{40} + \\frac{S}{30} = 3{,}5 \\iff \\frac{7S}{120} = 3{,}5 \\iff S = \\frac{3{,}5 \\times 120}{7} = 60\\text{ km}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Hai đường thẳng song song",
    "pts": 20,
    "question": "Hai đường thẳng $y = (2m - 1)x + 3$ và $y = 5x - 1$ song song với nhau khi:",
    "options": [
      {
        "text": "$m = 3$",
        "correct": true
      },
      {
        "text": "$m = 2$",
        "correct": false
      },
      {
        "text": "$m = 5$",
        "correct": false
      },
      {
        "text": "$m = -3$",
        "correct": false
      }
    ],
    "explanation": "Để hai đường thẳng song song: $2m - 1 = 5 \\iff 2m = 6 \\iff m = 3$ (và $3 \\neq -1$ đã thỏa mãn)."
  },
  {
    "id": 10,
    "title": "Câu 10: Diện tích xung quanh hình chóp tam giác đều",
    "pts": 20,
    "question": "Một hình chóp tam giác đều có cạnh đáy $10\\text{ cm}$, trung đoạn $12\\text{ cm}$. Diện tích xung quanh của hình chóp đó là:",
    "options": [
      {
        "text": "$180\\text{ cm}^2$",
        "correct": true
      },
      {
        "text": "$360\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$120\\text{ cm}^2$",
        "correct": false
      },
      {
        "text": "$90\\text{ cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Nửa chu vi đáy $p = \\frac{3 \\times 10}{2} = 15\\text{ cm}$. Diện tích xung quanh $S_{xq} = p \\cdot d = 15 \\times 12 = 180\\text{ cm}^2$."
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
                const outEl = document.getElementById('lab1OutputFinal');

                const treeData = {
                    1: { title: "Đại Số Lớp 8", formula: "$ax + b = 0 \mid y = ax + b \mid \\frac{A}{B}$", desc: "Đa thức, 7 hằng đẳng thức, phân thức đại số, giải phương trình và ứng dụng tài chính." },
                    2: { title: "Hình Học Lớp 8", formula: "$a^2 + b^2 = c^2 \mid \triangle \backsim \triangle' \mid S_{xq} = p \\cdot d$", desc: "Tứ giác, định lí Pythagore, 3 trường hợp đồng dạng, tam giác vuông và hình chóp đều." },
                    3: { title: "Thống Kê & Xác Suất", formula: "$P(E) = \\frac{k}{n} \mid \\frac{m}{N} \\approx P$", desc: "Thu thập phân loại dữ liệu, biểu đồ cột/quạt, biến cố ngẫu nhiên và mô phỏng thực nghiệm." }
                };

                function showTree(id) {
                    const t = treeData[id];
                    outEl.innerHTML = `<strong>${t.title}</strong> &nbsp;|&nbsp; <strong>Công thức lõi:</strong> ${t.formula} <br>${t.desc}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#ec4899';
                    ctx.beginPath(); ctx.arc(w / 2, h / 2, 50, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 14px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText('TOÁN 8', w / 2, h / 2 - 5);
                    ctx.fillText('KNTT', w / 2, h / 2 + 15);
                }

                document.getElementById('btnTree1').addEventListener('click', () => showTree(1));
                document.getElementById('btnTree2').addEventListener('click', () => showTree(2));
                document.getElementById('btnTree3').addEventListener('click', () => showTree(3));
                showTree(1);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const btn = document.getElementById('btnTestQuick');
                const outEl = document.getElementById('lab2OutputFinal');

                function test() {
                    outEl.innerHTML = `<strong>Bộ 3 công thức vàng đã sẵn sàng:</strong> <br>` +
                        `• Phương trình $3x - 15 = 0 \\implies x = 5$ <br>` +
                        `• Pythagore $6^2 + 8^2 = 10^2 \\implies c = 10$ <br>` +
                        `• Thể tích chóp $S = 30, h = 9 \\implies V = \\frac{1}{3} \\cdot 30 \\cdot 9 = 90$`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#10b981';
                    ctx.font = 'bold 18px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText('CHÚC MỪNG BẠN ĐÃ LÀM CHỦ TOÀN BỘ CHƯƠNG TRÌNH TOÁN 8!', w / 2, h / 2);
                }

                btn.addEventListener('click', test);
                test();
            
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
