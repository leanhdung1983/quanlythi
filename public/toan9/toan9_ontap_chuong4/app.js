// ================================================================
// Ôn tập Chương IV: Hệ thức lượng trong tam giác vuông - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ontap_chuong4_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Hiệp Sĩ Lượng Giác 9',
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
    "id": "q1",
    "title": "Câu 1: Giá trị của cos 45 độ",
    "question": "Giá trị của $\\cos 45^\\circ$ là:",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": false
      },
      {
        "text": "$\\frac{\\sqrt{2}}{2}$",
        "correct": true
      },
      {
        "text": "$\\frac{\\sqrt{3}}{2}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Trong tam giác vuông cân, $\\sin 45^\\circ = \\cos 45^\\circ = \\frac{\\sqrt{2}}{2}$.",
    "pts": 20
  },
  {
    "id": "q2",
    "title": "Câu 2: Đẳng thức lượng giác cơ bản",
    "question": "Với góc nhọn $\\alpha$ tùy ý, khẳng định nào sau đây là sai?",
    "options": [
      {
        "text": "$\\sin^2 \\alpha + \\cos^2 \\alpha = 1$",
        "correct": false
      },
      {
        "text": "$\\tan \\alpha = \\frac{\\sin \\alpha}{\\cos \\alpha}$",
        "correct": false
      },
      {
        "text": "$\\tan \\alpha \\cdot \\cot \\alpha = 1$",
        "correct": false
      },
      {
        "text": "$\\sin \\alpha + \\cos \\alpha = 1$",
        "correct": true
      }
    ],
    "explanation": "Đẳng thức đúng là $\\sin^2 \\alpha + \\cos^2 \\alpha = 1$. Tổng $\\sin \\alpha + \\cos \\alpha$ luôn lớn hơn $1$ đối với mọi góc nhọn $\\alpha$.",
    "pts": 20
  },
  {
    "id": "q3",
    "title": "Câu 3: Tính giá trị biểu thức lượng giác",
    "question": "Giá trị của biểu thức $A = 2 \\sin 30^\\circ - \\sqrt{3} \\tan 60^\\circ + 4 \\cos 60^\\circ$ là:",
    "options": [
      {
        "text": "$0$",
        "correct": true
      },
      {
        "text": "$1$",
        "correct": false
      },
      {
        "text": "$-1$",
        "correct": false
      },
      {
        "text": "$2$",
        "correct": false
      }
    ],
    "explanation": "$A = 2 \\cdot \\frac{1}{2} - \\sqrt{3} \\cdot \\sqrt{3} + 4 \\cdot \\frac{1}{2} = 1 - 3 + 2 = 0$.",
    "pts": 20
  },
  {
    "id": "q4",
    "title": "Câu 4: Tính cạnh huyền của tam giác vuông",
    "question": "Cho tam giác $ABC$ vuông tại $A$ có $AC = 6$ cm, $\\widehat{C} = 60^\\circ$. Cạnh huyền $BC$ bằng:",
    "options": [
      {
        "text": "$12$ cm",
        "correct": true
      },
      {
        "text": "$3$ cm",
        "correct": false
      },
      {
        "text": "$6\\sqrt{3}$ cm",
        "correct": false
      },
      {
        "text": "$4\\sqrt{3}$ cm",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\cos C = \\frac{AC}{BC} \\implies BC = \\frac{AC}{\\cos C} = \\frac{6}{\\cos 60^\\circ} = \\frac{6}{0.5} = 12$ cm.",
    "pts": 20
  },
  {
    "id": "q5",
    "title": "Câu 5: So sánh giá trị lượng giác",
    "question": "Sắp xếp nào sau đây đúng theo thứ tự tăng dần?",
    "options": [
      {
        "text": "$\\cos 20^\\circ < \\cos 40^\\circ < \\cos 70^\\circ$",
        "correct": false
      },
      {
        "text": "$\\cos 70^\\circ < \\cos 40^\\circ < \\cos 20^\\circ$",
        "correct": true
      },
      {
        "text": "$\\sin 70^\\circ < \\sin 40^\\circ < \\sin 20^\\circ$",
        "correct": false
      },
      {
        "text": "$\\tan 60^\\circ < \\tan 45^\\circ < \\tan 30^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Khi góc tăng từ $0^\\circ$ đến $90^\\circ$, giá trị cosin giảm dần. Do $20^\\circ < 40^\\circ < 70^\\circ$ nên $\\cos 70^\\circ < \\cos 40^\\circ < \\cos 20^\\circ$.",
    "pts": 20
  },
  {
    "id": "q6",
    "title": "Câu 6: Tính cot khi biết sin",
    "question": "Cho góc nhọn $\\alpha$ biết $\\sin \\alpha = \\frac{3}{5}$. Giá trị của $\\cot \\alpha$ là:",
    "options": [
      {
        "text": "$\\frac{4}{3}$",
        "correct": true
      },
      {
        "text": "$\\frac{3}{4}$",
        "correct": false
      },
      {
        "text": "$\\frac{4}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{5}{3}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\cos^2 \\alpha = 1 - \\sin^2 \\alpha = 1 - \\frac{9}{25} = \\frac{16}{25} \\implies \\cos \\alpha = \\frac{4}{5}$. Do đó $\\cot \\alpha = \\frac{\\cos \\alpha}{\\sin \\alpha} = \\frac{4/5}{3/5} = \\frac{4}{3}$.",
    "pts": 20
  },
  {
    "id": "q7",
    "title": "Câu 7: Chiều dài dây diều",
    "question": "Một sợi dây diều dài $100$ m căng thẳng tạo với mặt đất một góc $40^\\circ$. Chiều cao của con diều so với mặt đất (bỏ qua tay người cầm diều, làm tròn đến mét) là:",
    "options": [
      {
        "text": "$64$ m",
        "correct": true
      },
      {
        "text": "$77$ m",
        "correct": false
      },
      {
        "text": "$84$ m",
        "correct": false
      },
      {
        "text": "$50$ m",
        "correct": false
      }
    ],
    "explanation": "Chiều cao $h = 100 \\cdot \\sin 40^\\circ \\approx 100 \\cdot 0.6428 = 64.28 \\approx 64$ m.",
    "pts": 20
  },
  {
    "id": "q8",
    "title": "Câu 8: Tính diện tích tam giác qua hai cạnh và góc xen giữa",
    "question": "Tam giác $ABC$ có $AB = 6$ cm, $AC = 8$ cm, góc xen giữa $\\widehat{A} = 30^\\circ$. Diện tích tam giác $ABC$ là:",
    "options": [
      {
        "text": "$12$ $\\text{cm}^2$",
        "correct": true
      },
      {
        "text": "$24$ $\\text{cm}^2$",
        "correct": false
      },
      {
        "text": "$12\\sqrt{3}$ $\\text{cm}^2$",
        "correct": false
      },
      {
        "text": "$6$ $\\text{cm}^2$",
        "correct": false
      }
    ],
    "explanation": "Công thức diện tích: $S = \\frac{1}{2} AB \\cdot AC \\cdot \\sin A = \\frac{1}{2} \\cdot 6 \\cdot 8 \\cdot \\sin 30^\\circ = 24 \\cdot \\frac{1}{2} = 12$ $\\text{cm}^2$.",
    "pts": 20
  },
  {
    "id": "q9",
    "title": "Câu 9: Góc dốc của con đường",
    "question": "Một con dốc dài $400$ m đưa người đi từ chân dốc lên độ cao $32$ m. Góc dốc $\\alpha$ tạo với phương nằm ngang là (làm tròn đến độ):",
    "options": [
      {
        "text": "$5^\\circ$",
        "correct": true
      },
      {
        "text": "$8^\\circ$",
        "correct": false
      },
      {
        "text": "$10^\\circ$",
        "correct": false
      },
      {
        "text": "$12^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\sin \\alpha = \\frac{32}{400} = 0.08 \\implies \\alpha \\approx 4^\\circ 35' \\approx 5^\\circ$.",
    "pts": 20
  },
  {
    "id": "q10",
    "title": "Câu 10: Rút gọn biểu thức lượng giác nâng cao",
    "question": "Rút gọn biểu thức $K = \\frac{1}{1 + \\tan^2 \\alpha} + \\frac{1}{1 + \\cot^2 \\alpha}$ với góc nhọn $\\alpha$ tùy ý:",
    "options": [
      {
        "text": "$1$",
        "correct": true
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$\\tan \\alpha$",
        "correct": false
      },
      {
        "text": "$\\cot \\alpha$",
        "correct": false
      }
    ],
    "explanation": "Vì $1 + \\tan^2 \\alpha = \\frac{1}{\\cos^2 \\alpha}$ và $1 + \\cot^2 \\alpha = \\frac{1}{\\sin^2 \\alpha}$ nên $K = \\cos^2 \\alpha + \\sin^2 \\alpha = 1$.",
    "pts": 20
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
    
                const sumCanvas = document.getElementById('sumTrigCanvas');
                const sumCtx = sumCanvas.getContext('2d');

                window.inspectAngle = function(deg) {
                    document.getElementById('curAng').innerText = deg;
                    const rad = deg * Math.PI / 180;
                    const s = Math.sin(rad);
                    const c = Math.cos(rad);
                    const t = Math.tan(rad);
                    const cot = 1 / t;

                    document.getElementById('sSin').innerText = s.toFixed(4);
                    document.getElementById('sCos').innerText = c.toFixed(4);
                    document.getElementById('sTan').innerText = t.toFixed(4);
                    document.getElementById('sCot').innerText = cot.toFixed(4);
                    document.getElementById('sId').innerText = (s*s + c*c).toFixed(4);

                    sumCtx.clearRect(0, 0, sumCanvas.width, sumCanvas.height);
                    // Draw mini triangle
                    const ox = 100;
                    const oy = sumCanvas.height - 40;
                    const hyp = 160;
                    const ax = ox + hyp * c;
                    const ay = oy;
                    const cx = ax;
                    const cy = oy - hyp * s;

                    sumCtx.beginPath();
                    sumCtx.moveTo(ox, oy);
                    sumCtx.lineTo(ax, ay);
                    sumCtx.lineTo(cx, cy);
                    sumCtx.closePath();
                    sumCtx.fillStyle = 'rgba(129, 140, 248, 0.2)';
                    sumCtx.fill();
                    sumCtx.strokeStyle = '#818cf8';
                    sumCtx.lineWidth = 3;
                    sumCtx.stroke();

                    sumCtx.fillStyle = '#f59e0b';
                    sumCtx.font = 'bold 14px Inter, sans-serif';
                    sumCtx.fillText('α = ' + deg + '°', ox + 20, oy - 10);
                };
                window.inspectAngle(30);
                
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const rCanvas = document.getElementById('riverCanvas');
                const rctx = rCanvas.getContext('2d');
                const rngAC = document.getElementById('rngAC');
                const rngACB = document.getElementById('rngACB');

                function updateRiver() {
                    const ac = parseFloat(rngAC.value);
                    const angC = parseFloat(rngACB.value);

                    document.getElementById('lblAC').innerText = ac;
                    document.getElementById('lblACB').innerText = angC;
                    document.getElementById('outC').innerText = angC;

                    const radC = angC * Math.PI / 180;
                    const ab = ac * Math.tan(radC);

                    document.getElementById('outAB').innerText = ab.toFixed(2);

                    rctx.clearRect(0, 0, rCanvas.width, rCanvas.height);
                    // Draw river banks
                    rctx.fillStyle = 'rgba(6, 182, 212, 0.2)';
                    rctx.fillRect(50, 40, rCanvas.width - 100, rCanvas.height - 80);

                    // River lines
                    rctx.strokeStyle = '#06b6d4';
                    rctx.lineWidth = 2;
                    rctx.beginPath();
                    rctx.moveTo(50, 40);
                    rctx.lineTo(rCanvas.width - 50, 40);
                    rctx.moveTo(50, rCanvas.height - 40);
                    rctx.lineTo(rCanvas.width - 50, rCanvas.height - 40);
                    rctx.stroke();

                    // Points A, B, C
                    const cy = rCanvas.height - 40;
                    const ay = cy;
                    const by = 40;
                    const ax = 120;
                    const bx = 120;
                    const cx = ax + ac * 2.5;

                    // Triangle lines
                    rctx.beginPath();
                    rctx.moveTo(ax, ay);
                    rctx.lineTo(bx, by);
                    rctx.lineTo(cx, cy);
                    rctx.closePath();
                    rctx.strokeStyle = '#f43f5e';
                    rctx.lineWidth = 3;
                    rctx.stroke();

                    // Labels
                    rctx.fillStyle = '#ffffff';
                    rctx.font = 'bold 14px Inter, sans-serif';
                    rctx.fillText('B (bờ bên kia)', bx - 10, by - 10);
                    rctx.fillText('A', ax - 15, ay + 20);
                    rctx.fillText('C (' + angC + '°)', cx - 10, cy + 20);
                    rctx.fillStyle = '#f59e0b';
                    rctx.fillText('AB = ' + ab.toFixed(1) + ' m', ax + 10, (ay + by) / 2);
                    rctx.fillStyle = '#34d399';
                    rctx.fillText('AC = ' + ac + ' m', (ax + cx) / 2 - 20, cy + 20);
                }
                rngAC.addEventListener('input', updateRiver);
                rngACB.addEventListener('input', updateRiver);
                updateRiver();
                
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
