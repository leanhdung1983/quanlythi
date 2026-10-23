// ================================================================
// Bài 18: Hàm Số $y = ax^2\ (a \ne 0)$ - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai18_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Hiệp Sĩ Parabol 9',
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
    "title": "Câu 1: Nhận diện hàm số bậc hai",
    "pts": 20,
    "question": "Trong các hàm số sau, hàm số nào có dạng $y = ax^2\\ (a \\ne 0)$?",
    "options": [
      {
        "text": "$y = 2x - 3$",
        "correct": false
      },
      {
        "text": "$y = -\\frac{1}{2}x^2$",
        "correct": true
      },
      {
        "text": "$y = \\frac{2}{x^2}$",
        "correct": false
      },
      {
        "text": "$y = 3x^3$",
        "correct": false
      }
    ],
    "explanation": "Hàm số $y = -\\frac{1}{2}x^2$ có đúng dạng $y = ax^2$ với hệ số $a = -\\frac{1}{2} \\ne 0$."
  },
  {
    "id": 2,
    "title": "Câu 2: Điểm thuộc đồ thị",
    "pts": 20,
    "question": "Điểm nào sau đây thuộc đồ thị hàm số $y = 3x^2$?",
    "options": [
      {
        "text": "$M(1; 3)$",
        "correct": true
      },
      {
        "text": "$N(-1; -3)$",
        "correct": false
      },
      {
        "text": "$P(2; 6)$",
        "correct": false
      },
      {
        "text": "$Q(3; 9)$",
        "correct": false
      }
    ],
    "explanation": "Thay $x = 1$ vào hàm số: $y = 3 \\cdot 1^2 = 3$, trùng với tung độ điểm $M(1; 3)$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tính đối xứng của Parabol",
    "pts": 20,
    "question": "Trục đối xứng của đồ thị parabol $y = -2x^2$ là đường thẳng nào?",
    "options": [
      {
        "text": "Trục hoành $Ox$ (đường thẳng $y = 0$)",
        "correct": false
      },
      {
        "text": "Trục tung $Oy$ (đường thẳng $x = 0$)",
        "correct": true
      },
      {
        "text": "Đường thẳng $y = x$",
        "correct": false
      },
      {
        "text": "Đường thẳng $y = -2$",
        "correct": false
      }
    ],
    "explanation": "Đồ thị của mọi hàm số $y = ax^2\\ (a \\ne 0)$ đều nhận trục tung $Oy$ (phương trình $x = 0$) làm trục đối xứng."
  },
  {
    "id": 4,
    "title": "Câu 4: Hướng bề lõm Parabol",
    "pts": 20,
    "question": "Đồ thị hàm số $y = (\\sqrt{3} - 2)x^2$ có đặc điểm nào sau đây?",
    "options": [
      {
        "text": "Bề lõm quay lên trên, $O(0;0)$ là điểm thấp nhất",
        "correct": false
      },
      {
        "text": "Bề lõm quay xuống dưới, $O(0;0)$ là điểm cao nhất",
        "correct": true
      },
      {
        "text": "Đi qua điểm $A(1; 1)$",
        "correct": false
      },
      {
        "text": "Nằm hoàn toàn ở nửa mặt phẳng phía trên trục hoành",
        "correct": false
      }
    ],
    "explanation": "Vì $\\sqrt{3} \\approx 1.732 < 2$ nên hệ số $a = \\sqrt{3} - 2 < 0$. Do đó parabol có bề lõm quay xuống dưới, gốc $O(0;0)$ là điểm cao nhất của đồ thị."
  },
  {
    "id": 5,
    "title": "Câu 5: Tìm hệ số a",
    "pts": 20,
    "question": "Biết đồ thị hàm số $y = ax^2$ đi qua điểm $A(-2; 8)$. Hệ số $a$ bằng bao nhiêu?",
    "options": [
      {
        "text": "$a = 2$",
        "correct": true
      },
      {
        "text": "$a = -2$",
        "correct": false
      },
      {
        "text": "$a = 4$",
        "correct": false
      },
      {
        "text": "$a = -4$",
        "correct": false
      }
    ],
    "explanation": "Thay $x = -2$ và $y = 8$ vào hàm số: $8 = a \\cdot (-2)^2 \\iff 8 = 4a \\iff a = 2$."
  },
  {
    "id": 6,
    "title": "Câu 6: Điểm đối xứng qua trục tung",
    "pts": 20,
    "question": "Nếu điểm $A(3; 18)$ thuộc parabol $y = 2x^2$ thì điểm nào sau đây cũng thuộc parabol này?",
    "options": [
      {
        "text": "$B(-3; -18)$",
        "correct": false
      },
      {
        "text": "$C(-3; 18)$",
        "correct": true
      },
      {
        "text": "$D(18; 3)$",
        "correct": false
      },
      {
        "text": "$E(3; -18)$",
        "correct": false
      }
    ],
    "explanation": "Do tính chất đối xứng qua trục tung $Oy$, nếu $(x_0; y_0) \\in (P)$ thì $(-x_0; y_0) \\in (P)$. Vì vậy $C(-3; 18)$ thuộc parabol."
  },
  {
    "id": 7,
    "title": "Câu 7: So sánh giá trị hàm số",
    "pts": 20,
    "question": "Cho hàm số $y = -3x^2$. Khẳng định nào sau đây là ĐÚNG?",
    "options": [
      {
        "text": "$f(-2) > f(-1)$",
        "correct": false
      },
      {
        "text": "$f(-2) < f(-1)$",
        "correct": true
      },
      {
        "text": "$f(1) < f(2)$",
        "correct": false
      },
      {
        "text": "$f(0) = -3$",
        "correct": false
      }
    ],
    "explanation": "Ta có $f(-2) = -3(-2)^2 = -12$ và $f(-1) = -3(-1)^2 = -3$. Vì $-12 < -3$ nên $f(-2) < f(-1)$ (phù hợp tính đồng biến khi $x < 0$ của hàm số $y = ax^2$ với $a < 0$)."
  },
  {
    "id": 8,
    "title": "Câu 8: Tương giao với đường thẳng nằm ngang",
    "pts": 20,
    "question": "Số giao điểm của parabol $y = \\frac{1}{2}x^2$ và đường thẳng $y = 8$ là:",
    "options": [
      {
        "text": "0 giao điểm",
        "correct": false
      },
      {
        "text": "1 giao điểm",
        "correct": false
      },
      {
        "text": "2 giao điểm",
        "correct": true
      },
      {
        "text": "Vô số giao điểm",
        "correct": false
      }
    ],
    "explanation": "Phương trình hoành độ giao điểm: $\\frac{1}{2}x^2 = 8 \\iff x^2 = 16 \\iff x = \\pm 4$. Vậy có 2 giao điểm phân biệt là $(4; 8)$ và $(-4; 8)$."
  },
  {
    "id": 9,
    "title": "Câu 9: Ứng dụng bài toán rơi tự do",
    "pts": 20,
    "question": "Quãng đường rơi tự do của một vật được tính theo công thức $s = 5t^2$ ($s$ tính bằng mét, $t$ tính bằng giây). Sau 3 giây, vật rơi được quãng đường là bao nhiêu?",
    "options": [
      {
        "text": "15 m",
        "correct": false
      },
      {
        "text": "30 m",
        "correct": false
      },
      {
        "text": "45 m",
        "correct": true
      },
      {
        "text": "90 m",
        "correct": false
      }
    ],
    "explanation": "Thay $t = 3$ vào công thức: $s = 5 \\cdot 3^2 = 5 \\cdot 9 = 45\\text{ m}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tọa độ đỉnh Parabol",
    "pts": 20,
    "question": "Đỉnh của parabol $y = -5x^2$ có tọa độ là:",
    "options": [
      {
        "text": "$O(0; 0)$",
        "correct": true
      },
      {
        "text": "$I(0; -5)$",
        "correct": false
      },
      {
        "text": "$J(-5; 0)$",
        "correct": false
      },
      {
        "text": "$K(1; -5)$",
        "correct": false
      }
    ],
    "explanation": "Mọi parabol dạng $y = ax^2\\ (a \\ne 0)$ đều có đỉnh tại gốc tọa độ $O(0; 0)$."
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
    
                const canvas = document.getElementById('labCanvas1');
                const ctx = canvas.getContext('2d');
                const sA = document.getElementById('sliderA1');
                const vA = document.getElementById('valA1');
                const out = document.getElementById('lab1Output');
                const btnPoints = document.getElementById('btnTogglePoints1');
                let showPoints = true;

                btnPoints.addEventListener('click', () => {
                    showPoints = !showPoints;
                    draw();
                });

                function draw() {
                    let a = parseFloat(sA.value);
                    if (Math.abs(a) < 0.1) a = a < 0 ? -0.2 : 0.2;
                    vA.textContent = 'a = ' + a.toFixed(2);

                    const w = canvas.width;
                    const h = canvas.height;
                    const ox = w / 2;
                    const oy = a > 0 ? h - 50 : 50;
                    const scaleX = 40;
                    const scaleY = 25;

                    ctx.clearRect(0, 0, w, h);

                    // Grid
                    ctx.strokeStyle = '#1e293b';
                    ctx.lineWidth = 1;
                    for (let x = ox % scaleX; x < w; x += scaleX) {
                        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
                    }
                    for (let y = oy % scaleY; y < h; y += scaleY) {
                        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
                    }

                    // Axes
                    ctx.strokeStyle = '#64748b';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(0, oy); ctx.lineTo(w, oy); ctx.stroke();
                    ctx.beginPath(); ctx.moveTo(ox, 0); ctx.lineTo(ox, h); ctx.stroke();

                    // Labels
                    ctx.fillStyle = '#94a3b8';
                    ctx.font = '12px sans-serif';
                    ctx.fillText('x', w - 16, oy - 8);
                    ctx.fillText('y', ox + 8, 16);
                    ctx.fillText('O', ox - 14, oy + 16);

                    // Parabol
                    ctx.strokeStyle = a > 0 ? '#06b6d4' : '#f43f5e';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    let started = false;
                    for (let px = 0; px <= w; px += 2) {
                        const xMath = (px - ox) / scaleX;
                        const yMath = a * xMath * xMath;
                        const py = oy - yMath * scaleY;
                        if (py >= -20 && py <= h + 20) {
                            if (!started) { ctx.moveTo(px, py); started = true; }
                            else ctx.lineTo(px, py);
                        }
                    }
                    ctx.stroke();

                    // Key 5 points
                    if (showPoints) {
                        const xs = [-2, -1, 0, 1, 2];
                        xs.forEach(xm => {
                            const ym = a * xm * xm;
                            const px = ox + xm * scaleX;
                            const py = oy - ym * scaleY;
                            if (py >= 0 && py <= h) {
                                ctx.fillStyle = '#f59e0b';
                                ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();
                                ctx.fillStyle = '#e2e8f0';
                                ctx.font = '11px sans-serif';
                                ctx.fillText(`(${xm}; ${ym.toFixed(1)})`, px + 6, py - 6);
                            }
                        });
                    }

                    const dirText = a > 0 ? 'Bề lõm quay LÊN TRÊN, giá trị nhỏ nhất y = 0 tại x = 0' : 'Bề lõm quay XUỐNG DƯỚI, giá trị lớn nhất y = 0 tại x = 0';
                    out.innerHTML = `<strong>Phương trình:</strong> $y = ${a.toFixed(2)}x^2$ | <strong>Đặc điểm:</strong> ${dirText}`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                sA.addEventListener('input', draw);
                draw();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const inH = document.getElementById('gateH');
                const inW = document.getElementById('gateW');
                const inTW = document.getElementById('truckW');
                const inTH = document.getElementById('truckH');
                const out2 = document.getElementById('lab2Output');

                function updateLab2() {
                    const H = parseFloat(inH.value);
                    const W = parseFloat(inW.value);
                    const tW = parseFloat(inTW.value);
                    const tH = parseFloat(inTH.value);

                    document.getElementById('valH').textContent = H + ' m';
                    document.getElementById('valW').textContent = W + ' m';
                    document.getElementById('valTW').textContent = tW + ' m';
                    document.getElementById('valTH').textContent = tH + ' m';

                    const a = -H / ((W / 2) * (W / 2));
                    const truckClearance = H + a * (tW / 2) * (tW / 2);
                    const canPass = truckClearance >= tH;

                    const cw = c2.width;
                    const ch = c2.height;
                    const ox = cw / 2;
                    const groundY = ch - 40;
                    const scale = 36;

                    ctx2.clearRect(0, 0, cw, ch);

                    // Ground
                    ctx2.fillStyle = '#334155';
                    ctx2.fillRect(0, groundY, cw, ch - groundY);
                    ctx2.strokeStyle = '#475569';
                    ctx2.lineWidth = 2;
                    ctx2.beginPath(); ctx2.moveTo(0, groundY); ctx2.lineTo(cw, groundY); ctx2.stroke();

                    // Arch
                    ctx2.strokeStyle = '#38bdf8';
                    ctx2.lineWidth = 4;
                    ctx2.beginPath();
                    for (let xM = -W / 2; xM <= W / 2; xM += 0.05) {
                        const yM = H + a * xM * xM;
                        const px = ox + xM * scale;
                        const py = groundY - yM * scale;
                        if (xM === -W / 2) ctx2.moveTo(px, py);
                        else ctx2.lineTo(px, py);
                    }
                    ctx2.stroke();

                    // Arch fill translucent
                    ctx2.lineTo(ox + (W / 2) * scale, groundY);
                    ctx2.lineTo(ox - (W / 2) * scale, groundY);
                    ctx2.closePath();
                    ctx2.fillStyle = 'rgba(56, 189, 248, 0.12)';
                    ctx2.fill();

                    // Truck Box
                    const truckPxW = tW * scale;
                    const truckPxH = tH * scale;
                    const truckX = ox - truckPxW / 2;
                    const truckY = groundY - truckPxH;

                    ctx2.fillStyle = canPass ? 'rgba(34, 197, 94, 0.65)' : 'rgba(239, 68, 68, 0.7)';
                    ctx2.fillRect(truckX, truckY, truckPxW, truckPxH);
                    ctx2.strokeStyle = canPass ? '#22c55e' : '#ef4444';
                    ctx2.lineWidth = 2;
                    ctx2.strokeRect(truckX, truckY, truckPxW, truckPxH);

                    // Wheels
                    ctx2.fillStyle = '#0f172a';
                    ctx2.beginPath(); ctx2.arc(truckX + 12, groundY - 4, 8, 0, Math.PI * 2); ctx2.fill();
                    ctx2.beginPath(); ctx2.arc(truckX + truckPxW - 12, groundY - 4, 8, 0, Math.PI * 2); ctx2.fill();

                    // Clearance marker
                    const archYAtEdge = groundY - truckClearance * scale;
                    ctx2.strokeStyle = '#f59e0b';
                    ctx2.setLineDash([4, 4]);
                    ctx2.beginPath();
                    ctx2.moveTo(ox - truckPxW / 2, archYAtEdge);
                    ctx2.lineTo(ox + truckPxW / 2, archYAtEdge);
                    ctx2.stroke();
                    ctx2.setLineDash([]);

                    ctx2.fillStyle = '#f8fafc';
                    ctx2.font = '12px sans-serif';
                    ctx2.fillText(`Chiều cao vòm tại mép xe: ${truckClearance.toFixed(2)} m`, ox - 110, archYAtEdge - 8);

                    const status = canPass
                        ? `<span style="color: #4ade80; font-weight: bold;">✅ XE LỌT AN TOÀN!</span> (Độ hở mép nóc xe: +${(truckClearance - tH).toFixed(2)} m)`
                        : `<span style="color: #f87171; font-weight: bold;">⛔ XE KHÔNG QUA ĐƯỢC!</span> (Va chạm: thiếu ${(tH - truckClearance).toFixed(2)} m)`;

                    out2.innerHTML = `<strong>Phương trình vòm:</strong> $y = ${H} - ${Math.abs(a).toFixed(3)}x^2$ | ${status}`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                [inH, inW, inTW, inTH].forEach(el => el.addEventListener('input', updateLab2));
                updateLab2();
            
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
