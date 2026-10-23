// ================================================================
// Bài 22: Bảng Tần Số Và Biểu Đồ Tần Số - TOÁN 9 KNTT
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
  ["\\cap", "<mo>&#8745;</mo>"],
  ["\\frown", "<mo>&#8978;</mo>"],
  ["\\smile", "<mo>&#8979;</mo>"]
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
  s = s.replace(/\\(overparen|wideparen|overgroup|overarc|arc)\{([^{}]+)\}/g, (m, cmd, c) => savePlaceholder('<mover accent="true"><mrow>' + convertLatexToMathMLBody(c, placeholders) + '</mrow><mo>&#9180;</mo></mover>'));
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
    try {
      renderMathInElement(root, {
        delimiters: [
          { left: '$$', right: '$$', display: true },
          { left: '$', right: '$', display: false }
        ],
        macros: {
          '\\overparen': '\\overgroup{#1}',
          '\\wideparen': '\\overgroup{#1}',
          '\\overarc': '\\overgroup{#1}',
          '\\arc': '\\overgroup{#1}'
        },
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {
      console.warn('KaTeX render error, falling back to MathML:', e);
    }
  }

  // MathML Fallback
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.includes('$')) {
      textNodes.push(node);
    }
  }

  textNodes.forEach(tn => {
    const parent = tn.parentNode;
    if (!parent) return;
    const tag = parent.nodeName.toLowerCase();
    if (tag === 'script' || tag === 'style' || tag === 'textarea' || tag === 'code') return;
    const span = document.createElement('span');
    span.innerHTML = formatMathText(tn.nodeValue);
    parent.replaceChild(span, tn);
  });
}

// --- 1. WEB AUDIO API SOUND SYSTEM ---
class SoundController {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  initCtx() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, duration, type = 'sine', gainVal = 0.1) {
    if (!this.enabled) return;
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
      gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio tone error:', e);
    }
  }

  playClick() {
    this.playTone(800, 0.05, 'triangle', 0.08);
  }

  playCorrect() {
    if (!this.enabled) return;
    this.playTone(523.25, 0.1, 'sine', 0.12);
    setTimeout(() => this.playTone(659.25, 0.15, 'sine', 0.12), 100);
    setTimeout(() => this.playTone(783.99, 0.25, 'triangle', 0.15), 220);
  }

  playWrong() {
    if (!this.enabled) return;
    this.playTone(320, 0.15, 'sawtooth', 0.1);
    setTimeout(() => this.playTone(240, 0.25, 'sawtooth', 0.1), 120);
  }

  playLevelUp() {
    if (!this.enabled) return;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.18, 'sine', 0.15), i * 120);
    });
  }

  playFanfare() {
    if (!this.enabled) return;
    const melody = [523, 659, 783, 1046, 783, 1046];
    melody.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 0.22, 'triangle', 0.18), i * 140);
    });
  }
}

const sound = new SoundController();

// --- 2. GAMIFICATION STATE & LOCALSTORAGE ---
const STORAGE_KEY = 'toan9_toan9_bai22_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Nhà Thống Kê Dữ Liệu 9',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      appState = Object.assign(appState, parsed);
    }
  } catch (e) {
    console.warn('Could not load state:', e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn('Could not save state:', e);
  }
}

function updateHUD() {
  const avBtn = document.getElementById('avatarBtn');
  const nameEl = document.getElementById('userNameDisplay');
  const titleEl = document.getElementById('userTitle');
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const soundBtn = document.getElementById('soundToggle');

  if (avBtn) avBtn.textContent = appState.avatar;
  if (nameEl) nameEl.textContent = `${appState.userName} 🌟`;
  if (titleEl) titleEl.textContent = appState.userTitle;
  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (soundBtn) soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';

  // Stars (1-5 dựa trên XP)
  let s = 1;
  if (appState.xp >= 160) s = 5;
  else if (appState.xp >= 120) s = 4;
  else if (appState.xp >= 80) s = 3;
  else if (appState.xp >= 40) s = 2;
  appState.stars = s;
  if (starEl) starEl.textContent = '⭐'.repeat(s) + '☆'.repeat(5 - s);

  // Update Badges UI
  appState.badges.forEach((unlocked, idx) => {
    const el = document.getElementById(`badge-${idx + 1}`);
    if (el) {
      if (unlocked) el.classList.remove('locked');
      else el.classList.add('locked');
    }
  });

  // Update Certificate info
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
    "title": "Câu 1: Định nghĩa tần số",
    "pts": 20,
    "question": "Trong thống kê, tần số của một giá trị là:",
    "options": [
      {
        "text": "Số lần xuất hiện của giá trị đó trong mẫu dữ liệu",
        "correct": true
      },
      {
        "text": "Giá trị lớn nhất trong dãy số liệu",
        "correct": false
      },
      {
        "text": "Tỉ số giữa giá trị đó và kích thước mẫu",
        "correct": false
      },
      {
        "text": "Số các giá trị khác nhau trong mẫu",
        "correct": false
      }
    ],
    "explanation": "Định nghĩa chuẩn SGK: Tần số của một giá trị là số lần xuất hiện của giá trị đó trong mẫu số liệu."
  },
  {
    "id": 2,
    "title": "Câu 2: Đọc bảng tần số",
    "pts": 20,
    "question": "Cho bảng tần số số con trong mỗi gia đình của một thôn như sau:<div class=\"quiz-table-wrap\"><table class=\"quiz-table\"><thead><tr><th>Số con</th><th>1</th><th>2</th><th>3</th><th>4</th></tr></thead><tbody><tr><td>Tần số</td><td>15</td><td>35</td><td>8</td><td>2</td></tr></tbody></table></div>Tổng số gia đình được điều tra là:",
    "options": [
      {
        "text": "60 gia đình",
        "correct": true
      },
      {
        "text": "50 gia đình",
        "correct": false
      },
      {
        "text": "4 gia đình",
        "correct": false
      },
      {
        "text": "35 gia đình",
        "correct": false
      }
    ],
    "explanation": "Tổng kích thước mẫu $N = 15 + 35 + 8 + 2 = 60$ gia đình."
  },
  {
    "id": 3,
    "title": "Câu 3: Giá trị có tần số lớn nhất",
    "pts": 20,
    "question": "Trong bảng tần số ở Câu 2, giá trị có tần số lớn nhất là:",
    "options": [
      {
        "text": "2 con (tần số 35)",
        "correct": true
      },
      {
        "text": "1 con (tần số 15)",
        "correct": false
      },
      {
        "text": "3 con (tần số 8)",
        "correct": false
      },
      {
        "text": "35 con",
        "correct": false
      }
    ],
    "explanation": "Tần số lớn nhất trong bảng là 35, tương ứng với giá trị là 2 con."
  },
  {
    "id": 4,
    "title": "Câu 4: Lập bảng tần số từ dãy dữ liệu",
    "pts": 20,
    "question": "Cho dãy điểm kiểm tra Toán của 10 học sinh: $7;\\ 8;\\ 9;\\ 8;\\ 7;\\ 10;\\ 8;\\ 9;\\ 8;\\ 7$. Tần số của điểm 8 là:",
    "options": [
      {
        "text": "4",
        "correct": true
      },
      {
        "text": "3",
        "correct": false
      },
      {
        "text": "2",
        "correct": false
      },
      {
        "text": "8",
        "correct": false
      }
    ],
    "explanation": "Đếm số lần xuất hiện của số 8 trong dãy: có 4 lần xuất hiện (vị trí 2, 4, 7, 9)."
  },
  {
    "id": 5,
    "title": "Câu 5: Đặc điểm biểu đồ cột tần số",
    "pts": 20,
    "question": "Trên biểu đồ cột tần số, đại lượng được biểu diễn trên trục thẳng đứng là:",
    "options": [
      {
        "text": "Tần số ($m$)",
        "correct": true
      },
      {
        "text": "Giá trị ($x$)",
        "correct": false
      },
      {
        "text": "Tên đối tượng",
        "correct": false
      },
      {
        "text": "Thời gian",
        "correct": false
      }
    ],
    "explanation": "Theo quy ước vẽ biểu đồ cột tần số, trục hoành ghi các giá trị $x$, trục tung thẳng đứng ghi tần số $m$ tương ứng."
  },
  {
    "id": 6,
    "title": "Câu 6: Tìm tần số còn thiếu",
    "pts": 20,
    "question": "Một lớp có 40 học sinh. Thống kê cỡ áo của học sinh trong lớp cho bảng sau:<div class=\"quiz-table-wrap\"><table class=\"quiz-table\"><thead><tr><th>Cỡ áo</th><th>S</th><th>M</th><th>L</th><th>XL</th></tr></thead><tbody><tr><td>Tần số</td><td>8</td><td>18</td><td>$x$</td><td>4</td></tr></tbody></table></div>Giá trị của $x$ là:",
    "options": [
      {
        "text": "10",
        "correct": true
      },
      {
        "text": "12",
        "correct": false
      },
      {
        "text": "8",
        "correct": false
      },
      {
        "text": "14",
        "correct": false
      }
    ],
    "explanation": "Tổng tần số bằng sĩ số lớp: $8 + 18 + x + 4 = 40 \\iff 30 + x = 40 \\iff x = 10$."
  },
  {
    "id": 7,
    "title": "Câu 7: Tỉ lệ phần trăm so với cả lớp",
    "pts": 20,
    "question": "Ở Câu 6, số học sinh mặc áo cỡ M chiếm bao nhiêu phần trăm số học sinh cả lớp?",
    "options": [
      {
        "text": "45%",
        "correct": true
      },
      {
        "text": "40%",
        "correct": false
      },
      {
        "text": "50%",
        "correct": false
      },
      {
        "text": "18%",
        "correct": false
      }
    ],
    "explanation": "Tỉ lệ phần trăm $= \\frac{18}{40} \\cdot 100\\% = 45\\%$."
  },
  {
    "id": 8,
    "title": "Câu 8: Biểu đồ đoạn thẳng",
    "pts": 20,
    "question": "Khi biểu diễn bảng tần số bằng biểu đồ đoạn thẳng, tọa độ của các điểm được đánh dấu trên mặt phẳng là:",
    "options": [
      {
        "text": "$(\\text{Giá trị}; \\text{Tần số})$",
        "correct": true
      },
      {
        "text": "$(\\text{Tần số}; \\text{Giá trị})$",
        "correct": false
      },
      {
        "text": "$(\\text{Tần số}; \\text{Kích thước mẫu})$",
        "correct": false
      },
      {
        "text": "$(0; \\text{Tần số})$",
        "correct": false
      }
    ],
    "explanation": "Hoành độ là giá trị $x_i$, tung độ là tần số $m_i$ tương ứng: điểm $(x_i; m_i)$."
  },
  {
    "id": 9,
    "title": "Câu 9: Ý nghĩa biểu đồ tần số",
    "pts": 20,
    "question": "Ưu điểm nổi bật của việc biểu diễn dữ liệu bằng biểu đồ so với bảng số liệu thô là:",
    "options": [
      {
        "text": "Trực quan, dễ so sánh và nắm bắt quy luật phân bố",
        "correct": true
      },
      {
        "text": "Chứa được nhiều chữ hơn",
        "correct": false
      },
      {
        "text": "Không cần tính toán số liệu",
        "correct": false
      },
      {
        "text": "Luôn có dạng hình tròn",
        "correct": false
      }
    ],
    "explanation": "Biểu đồ giúp người quan sát có cái nhìn trực quan, nhanh chóng so sánh tương quan giữa các mức độ mà không cần đọc từng con số chi tiết."
  },
  {
    "id": 10,
    "title": "Câu 10: Tần số của giá trị không xuất hiện",
    "pts": 20,
    "question": "Nếu một giá trị $x_0$ không xuất hiện lần nào trong mẫu dữ liệu thì tần số của nó bằng:",
    "options": [
      {
        "text": "0",
        "correct": true
      },
      {
        "text": "1",
        "correct": false
      },
      {
        "text": "Không xác định",
        "correct": false
      },
      {
        "text": "Vô cùng",
        "correct": false
      }
    ],
    "explanation": "Số lần xuất hiện bằng 0 nên tần số bằng 0 (thông thường các giá trị có tần số bằng 0 không cần ghi vào bảng)."
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

      if (target === 'theory') unlockBadge(0);
      if (target === 'labs') {
        unlockBadge(1);
        initLabs();
      }
    });
  });
}

function initAvatarModal() {
  const btn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const closeBtn = document.getElementById('btnCloseModal');
  const choices = document.querySelectorAll('.avatar-choice');

  if (btn && modal) {
    btn.addEventListener('click', () => {
      sound.playClick();
      modal.style.display = 'flex';
    });
  }

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
    
                const c1 = document.getElementById('labCanvas1');
                const ctx = c1.getContext('2d');
                const f7 = document.getElementById('freq7');
                const f8 = document.getElementById('freq8');
                const f9 = document.getElementById('freq9');
                const f10 = document.getElementById('freq10');
                const out1 = document.getElementById('lab1Output');

                function drawBarChart() {
                    const m7 = Math.max(0, parseInt(f7.value) || 0);
                    const m8 = Math.max(0, parseInt(f8.value) || 0);
                    const m9 = Math.max(0, parseInt(f9.value) || 0);
                    const m10 = Math.max(0, parseInt(f10.value) || 0);

                    const data = [
                        { label: 'Điểm 7', val: m7, color: '#38bdf8' },
                        { label: 'Điểm 8', val: m8, color: '#34d399' },
                        { label: 'Điểm 9', val: m9, color: '#fbbf24' },
                        { label: 'Điểm 10', val: m10, color: '#f43f5e' }
                    ];

                    const N = m7 + m8 + m9 + m10;
                    const maxVal = Math.max(10, m7, m8, m9, m10) + 4;

                    const cw = c1.width;
                    const ch = c1.height;
                    const padLeft = 60;
                    const padBottom = 50;
                    const padTop = 30;
                    const chartH = ch - padBottom - padTop;
                    const chartW = cw - padLeft - 40;

                    ctx.clearRect(0, 0, cw, ch);

                    // Axes
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(padLeft, padTop);
                    ctx.lineTo(padLeft, ch - padBottom);
                    ctx.lineTo(cw - 30, ch - padBottom);
                    ctx.stroke();

                    // Grid lines Y
                    ctx.strokeStyle = '#1e293b';
                    ctx.lineWidth = 1;
                    const stepY = 5;
                    for (let yVal = 0; yVal <= maxVal; yVal += stepY) {
                        const py = (ch - padBottom) - (yVal / maxVal) * chartH;
                        ctx.beginPath(); ctx.moveTo(padLeft, py); ctx.lineTo(cw - 30, py); ctx.stroke();
                        ctx.fillStyle = '#94a3b8';
                        ctx.font = '11px sans-serif';
                        ctx.fillText(yVal, padLeft - 26, py + 4);
                    }

                    // Bars
                    const colW = 55;
                    const gap = (chartW - data.length * colW) / (data.length + 1);

                    data.forEach((d, i) => {
                        const px = padLeft + gap + i * (colW + gap);
                        const barH = (d.val / maxVal) * chartH;
                        const py = (ch - padBottom) - barH;

                        ctx.fillStyle = d.color;
                        ctx.beginPath();
                        ctx.roundRect(px, py, colW, barH, [6, 6, 0, 0]);
                        ctx.fill();

                        // Bar value text
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 13px sans-serif';
                        ctx.fillText(d.val, px + colW / 2 - 8, py - 6);

                        // Label X
                        ctx.fillStyle = '#cbd5e1';
                        ctx.font = '12px sans-serif';
                        ctx.fillText(d.label, px + 4, ch - padBottom + 20);
                    });

                    // Title
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '12px sans-serif';
                    ctx.fillText('Tần số (m)', padLeft - 10, padTop - 12);
                    ctx.fillText('Giá trị (Điểm)', cw - 80, ch - padBottom + 38);

                    out1.innerHTML = `<strong>Tổng kích thước mẫu:</strong> $N = ${m7} + ${m8} + ${m9} + ${m10} = ${N}$ học sinh. Giá trị có tần số cao nhất là <strong>${data.reduce((a, b) => a.val > b.val ? a : b).label}</strong>.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                [f7, f8, f9, f10].forEach(el => el.addEventListener('input', drawBarChart));
                drawBarChart();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const r6 = document.getElementById('mRain6');
                const r7 = document.getElementById('mRain7');
                const r8 = document.getElementById('mRain8');
                const r9 = document.getElementById('mRain9');
                const r10 = document.getElementById('mRain10');
                const out2 = document.getElementById('lab2Output');

                function drawLineChart() {
                    const vals = [
                        { label: 'T6', v: parseInt(r6.value) || 0 },
                        { label: 'T7', v: parseInt(r7.value) || 0 },
                        { label: 'T8', v: parseInt(r8.value) || 0 },
                        { label: 'T9', v: parseInt(r9.value) || 0 },
                        { label: 'T10', v: parseInt(r10.value) || 0 }
                    ];

                    const cw = c2.width;
                    const ch = c2.height;
                    const padLeft = 60;
                    const padBottom = 50;
                    const padTop = 30;
                    const chartH = ch - padBottom - padTop;
                    const chartW = cw - padLeft - 40;
                    const maxV = 25;

                    ctx2.clearRect(0, 0, cw, ch);

                    // Axes
                    ctx2.strokeStyle = '#64748b';
                    ctx2.lineWidth = 2;
                    ctx2.beginPath();
                    ctx2.moveTo(padLeft, padTop);
                    ctx2.lineTo(padLeft, ch - padBottom);
                    ctx2.lineTo(cw - 30, ch - padBottom);
                    ctx2.stroke();

                    // Grid
                    ctx2.strokeStyle = '#1e293b';
                    for (let v = 0; v <= maxV; v += 5) {
                        const py = (ch - padBottom) - (v / maxV) * chartH;
                        ctx2.beginPath(); ctx2.moveTo(padLeft, py); ctx2.lineTo(cw - 30, py); ctx2.stroke();
                        ctx2.fillStyle = '#94a3b8';
                        ctx2.font = '11px sans-serif';
                        ctx2.fillText(v, padLeft - 24, py + 4);
                    }

                    // Line segments
                    const stepX = chartW / (vals.length + 1);
                    const points = [];

                    vals.forEach((item, i) => {
                        const px = padLeft + (i + 1) * stepX;
                        const py = (ch - padBottom) - (item.v / maxV) * chartH;
                        points.push({ x: px, y: py, val: item.v, label: item.label });

                        ctx2.fillStyle = '#cbd5e1';
                        ctx2.font = '12px sans-serif';
                        ctx2.fillText(item.label, px - 8, ch - padBottom + 20);
                    });

                    // Draw connecting line
                    ctx2.strokeStyle = '#06b6d4';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath();
                    points.forEach((p, i) => {
                        if (i === 0) ctx2.moveTo(p.x, p.y);
                        else ctx2.lineTo(p.x, p.y);
                    });
                    ctx2.stroke();

                    // Draw dots and value labels
                    points.forEach(p => {
                        ctx2.fillStyle = '#f59e0b';
                        ctx2.beginPath(); ctx2.arc(p.x, p.y, 6, 0, Math.PI * 2); ctx2.fill();
                        ctx2.strokeStyle = '#ffffff';
                        ctx2.lineWidth = 2; ctx2.stroke();

                        ctx2.fillStyle = '#ffffff';
                        ctx2.font = 'bold 12px sans-serif';
                        ctx2.fillText(p.val, p.x - 6, p.y - 10);
                    });

                    const totalRain = vals.reduce((sum, item) => sum + item.v, 0);
                    out2.innerHTML = `<strong>Tổng số ngày mưa:</strong> $N = ${totalRain}$ ngày. Biểu đồ đoạn thẳng phản ánh rõ xu hướng tăng giảm lượng mưa qua các tháng 6, 7, 8, 9, 10.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                [r6, r7, r8, r9, r10].forEach(el => el.addEventListener('input', drawLineChart));
                drawLineChart();
            
    if (typeof initLab2 === 'function') initLab2();
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
