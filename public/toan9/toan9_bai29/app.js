// ================================================================
// Bài 29: Tứ Giác Nội Tiếp - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_bai29_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Tứ Giác Nội Tiếp 9',
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
    "title": "Câu 1: Tổng hai góc đối tứ giác nội tiếp",
    "pts": 20,
    "question": "Cho tứ giác $ABCD$ nội tiếp đường tròn. Khẳng định nào sau đây là ĐÚNG?",
    "options": [
      {
        "text": "$\\widehat{A} + \\widehat{C} = 180^\\circ$ và $\\widehat{B} + \\widehat{D} = 180^\\circ$",
        "correct": true
      },
      {
        "text": "$\\widehat{A} + \\widehat{B} = 180^\\circ$",
        "correct": false
      },
      {
        "text": "$\\widehat{A} = \\widehat{C}$",
        "correct": false
      },
      {
        "text": "$\\widehat{A} + \\widehat{B} + \\widehat{C} + \\widehat{D} = 180^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Định lí cơ bản: Trong một tứ giác nội tiếp, tổng hai góc đối diện luôn bằng 180°."
  },
  {
    "id": 2,
    "title": "Câu 2: Tính góc còn lại của tứ giác nội tiếp",
    "pts": 20,
    "question": "Cho tứ giác $ABCD$ nội tiếp đường tròn có $\\widehat{A} = 70^\\circ$. Số đo của góc $\\widehat{C}$ là:",
    "options": [
      {
        "text": "$110^\\circ$",
        "correct": true
      },
      {
        "text": "$70^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      },
      {
        "text": "$20^\\circ$",
        "correct": false
      }
    ],
    "explanation": "$\\widehat{C} = 180^\\circ - \\widehat{A} = 180^\\circ - 70^\\circ = 110^\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Hình nào luôn nội tiếp đường tròn",
    "pts": 20,
    "question": "Trong các hình sau, hình nào LUÔN LUÔN nội tiếp được đường tròn?",
    "options": [
      {
        "text": "Hình thang cân",
        "correct": true
      },
      {
        "text": "Hình bình hành",
        "correct": false
      },
      {
        "text": "Hình thoi",
        "correct": false
      },
      {
        "text": "Hình thang vuông",
        "correct": false
      }
    ],
    "explanation": "Hình thang cân có hai góc kề một đáy bằng nhau, do đó tổng hai góc đối luôn bằng 180° nên luôn nội tiếp được đường tròn."
  },
  {
    "id": 4,
    "title": "Câu 4: Dấu hiệu góc ngoài",
    "pts": 20,
    "question": "Tứ giác $ABCD$ có góc ngoài tại đỉnh $A$ bằng $85^\\circ$. Tứ giác $ABCD$ nội tiếp khi số đo góc $\\widehat{C}$ bằng:",
    "options": [
      {
        "text": "$85^\\circ$",
        "correct": true
      },
      {
        "text": "$95^\\circ$",
        "correct": false
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      },
      {
        "text": "$42,5^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Góc ngoài tại đỉnh $A$ kề bù với góc trong $\\widehat{A}$. Để $\\widehat{A} + \\widehat{C} = 180^\\circ$ thì góc ngoài tại $A$ phải bằng góc trong đối diện $\\widehat{C} = 85^\\circ$."
  },
  {
    "id": 5,
    "title": "Câu 5: Tứ giác có 2 góc đối vuông",
    "pts": 20,
    "question": "Tứ giác $ABCD$ có $\\widehat{B} = 90^\\circ$ và $\\widehat{D} = 90^\\circ$. Tâm đường tròn ngoại tiếp tứ giác $ABCD$ là:",
    "options": [
      {
        "text": "Trung điểm của đoạn thẳng $AC$",
        "correct": true
      },
      {
        "text": "Trung điểm của đoạn thẳng $BD$",
        "correct": false
      },
      {
        "text": "Giao điểm của $AC$ và $BD$",
        "correct": false
      },
      {
        "text": "Trọng tâm tam giác $ABC$",
        "correct": false
      }
    ],
    "explanation": "Cả hai đỉnh $B$ và $D$ đều nhìn đoạn thẳng $AC$ dưới một góc vuông, do đó 4 điểm cùng nằm trên đường tròn đường kính $AC$, tâm là trung điểm của $AC$."
  },
  {
    "id": 6,
    "title": "Câu 6: Dấu hiệu hai đỉnh cùng nhìn một cạnh",
    "pts": 20,
    "question": "Tứ giác $ABCD$ có hai đường chéo $AC$ và $BD$ cắt nhau. Điều kiện để tứ giác $ABCD$ nội tiếp là:",
    "options": [
      {
        "text": "$\\widehat{DAC} = \\widehat{DBC}$",
        "correct": true
      },
      {
        "text": "$\\widehat{DAC} + \\widehat{DBC} = 180^\\circ$",
        "correct": false
      },
      {
        "text": "$\\widehat{DAC} + \\widehat{DBC} = 90^\\circ$",
        "correct": false
      },
      {
        "text": "$AC \\perp BD$",
        "correct": false
      }
    ],
    "explanation": "Hai đỉnh kề nhau $A$ và $B$ cùng nhìn cạnh $CD$ dưới hai góc bằng nhau: $\\widehat{DAC} = \\widehat{DBC}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Hình bình hành nội tiếp",
    "pts": 20,
    "question": "Một hình bình hành nội tiếp được đường tròn thì nó bắt buộc phải là:",
    "options": [
      {
        "text": "Hình chữ nhật",
        "correct": true
      },
      {
        "text": "Hình thoi",
        "correct": false
      },
      {
        "text": "Hình thang cân",
        "correct": false
      },
      {
        "text": "Tam giác",
        "correct": false
      }
    ],
    "explanation": "Hình bình hành có hai góc đối bằng nhau: $\\widehat{A} = \\widehat{C}$. Để nội tiếp thì $\\widehat{A} + \\widehat{C} = 180^\\circ \\implies 2\\widehat{A} = 180^\\circ \\implies \\widehat{A} = 90^\\circ$. Hình bình hành có 1 góc vuông là hình chữ nhật."
  },
  {
    "id": 8,
    "title": "Câu 8: Hình thoi nội tiếp",
    "pts": 20,
    "question": "Một hình thoi nội tiếp được đường tròn thì nó bắt buộc phải là:",
    "options": [
      {
        "text": "Hình vuông",
        "correct": true
      },
      {
        "text": "Hình thang",
        "correct": false
      },
      {
        "text": "Hình chữ nhật có 2 cạnh không bằng nhau",
        "correct": false
      },
      {
        "text": "Mọi hình thoi",
        "correct": false
      }
    ],
    "explanation": "Hình thoi có góc vuông trở thành hình vuông (hình chữ nhật có 4 cạnh bằng nhau)."
  },
  {
    "id": 9,
    "title": "Câu 9: Tính các góc của tứ giác nội tiếp",
    "pts": 20,
    "question": "Cho tứ giác $ABCD$ nội tiếp có $\\widehat{A} : \\widehat{B} : \\widehat{C} = 2 : 3 : 4$. Số đo của góc $\\widehat{D}$ là:",
    "options": [
      {
        "text": "$90^\\circ$",
        "correct": true
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$120^\\circ$",
        "correct": false
      },
      {
        "text": "$45^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\widehat{A} + \\widehat{C} = 180^\\circ$. Đặt $\\widehat{A} = 2x, \\widehat{C} = 4x \\implies 6x = 180^\\circ \\implies x = 30^\\circ$. Khi đó $\\widehat{B} = 3x = 90^\\circ$. Suy ra $\\widehat{D} = 180^\\circ - \\widehat{B} = 180^\\circ - 90^\\circ = 90^\\circ$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tứ giác không thể nội tiếp",
    "pts": 20,
    "question": "Tứ giác có 4 góc thỏa mãn tỉ lệ nào sau đây KHÔNG THỂ nội tiếp đường tròn?",
    "options": [
      {
        "text": "$\\widehat{A} : \\widehat{B} : \\widehat{C} : \\widehat{D} = 1 : 2 : 4 : 5$",
        "correct": true
      },
      {
        "text": "$\\widehat{A} : \\widehat{B} : \\widehat{C} : \\widehat{D} = 1 : 2 : 3 : 2$",
        "correct": false
      },
      {
        "text": "$\\widehat{A} : \\widehat{B} : \\widehat{C} : \\widehat{D} = 1 : 1 : 1 : 1$",
        "correct": false
      },
      {
        "text": "$\\widehat{A} : \\widehat{B} : \\widehat{C} : \\widehat{D} = 2 : 3 : 4 : 3$",
        "correct": false
      }
    ],
    "explanation": "Để nội tiếp thì $\\widehat{A} + \\widehat{C} = \\widehat{B} + \\widehat{D}$. Với tỉ lệ $1 : 2 : 4 : 5$, ta có $1 + 4 = 5 \\ne 2 + 5 = 7$, do đó không thể nội tiếp."
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
                const slA = document.getElementById('slQuadA');
                const slC = document.getElementById('slQuadC');
                const vA = document.getElementById('vQuadA');
                const vC = document.getElementById('vQuadC');
                const out1 = document.getElementById('lab1Output');

                function renderQuad() {
                    const angA = parseFloat(slA.value);
                    const angC = parseFloat(slC.value);
                    vA.textContent = angA + '°';
                    vC.textContent = angC + '°';

                    const cw = c1.width;
                    const ch = c1.height;
                    const ox = cw / 2;
                    const oy = ch / 2;
                    const R = 110;

                    ctx.clearRect(0, 0, cw, ch);

                    // Circle (O)
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.arc(ox, oy, R, 0, Math.PI * 2); ctx.stroke();

                    // 4 vertices in order A, B, C, D
                    const radA = - (angA * Math.PI) / 180;
                    const radB = - (135 * Math.PI) / 180;
                    const radC = - (angC * Math.PI) / 180;
                    const radD = - (315 * Math.PI) / 180;

                    const A = { x: ox + R * Math.cos(radA), y: oy + R * Math.sin(radA) };
                    const B = { x: ox + R * Math.cos(radB), y: oy + R * Math.sin(radB) };
                    const C = { x: ox + R * Math.cos(radC), y: oy + R * Math.sin(radC) };
                    const D = { x: ox + R * Math.cos(radD), y: oy + R * Math.sin(radD) };

                    // Draw Quad ABCD
                    ctx.strokeStyle = '#38bdf8';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y);
                    ctx.lineTo(C.x, C.y); ctx.lineTo(D.x, D.y);
                    ctx.closePath(); ctx.stroke();

                    ctx.fillStyle = 'rgba(56, 189, 248, 0.1)';
                    ctx.fill();

                    // Calculate Angles at A and C using inscribed property
                    // sđ cung BCD
                    const normB = (135 + 360) % 360;
                    const normD = (315 + 360) % 360;
                    // Arc BAD vs Arc BCD
                    const arcBCD = (normB - normD + 360) % 360;
                    const angleA = arcBCD / 2;
                    const angleC = 180 - angleA;

                    // Vertices
                    const pts = [
                        { name: `A (${angleA.toFixed(0)}°)`, p: A, c: '#06b6d4' },
                        { name: 'B', p: B, c: '#f59e0b' },
                        { name: `C (${angleC.toFixed(0)}°)`, p: C, c: '#10b981' },
                        { name: 'D', p: D, c: '#f59e0b' }
                    ];

                    pts.forEach(item => {
                        ctx.fillStyle = item.c;
                        ctx.beginPath(); ctx.arc(item.p.x, item.p.y, 6, 0, Math.PI * 2); ctx.fill();
                        ctx.fillStyle = '#ffffff';
                        ctx.font = 'bold 13px sans-serif';
                        ctx.fillText(item.name, item.p.x - 12, item.p.y - 10);
                    });

                    out1.innerHTML = `<strong>Tứ giác nội tiếp:</strong> $\\widehat{A} = ${angleA.toFixed(1)}^\\circ$ và $\\widehat{C} = ${angleC.toFixed(1)}^\\circ$ &rArr; Tổng hai góc đối: $\\widehat{A} + \\widehat{C} = ${angleA.toFixed(1)}^\\circ + ${angleC.toFixed(1)}^\\circ = 180^\\circ$ (Bất biến).`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slA.addEventListener('input', renderQuad);
                slC.addEventListener('input', renderQuad);
                renderQuad();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const slAl = document.getElementById('slAlpha');
                const vAl = document.getElementById('vAlpha');
                const out2 = document.getElementById('lab2Output');

                function renderSign4() {
                    const alpha = parseFloat(slAl.value);
                    vAl.textContent = alpha + '°';

                    const cw = c2.width;
                    const ch = c2.height;
                    const ox = cw / 2;
                    const oy = ch / 2;
                    const R = 110;

                    ctx2.clearRect(0, 0, cw, ch);

                    // Circle
                    ctx2.strokeStyle = '#475569';
                    ctx2.lineWidth = 2;
                    ctx2.beginPath(); ctx2.arc(ox, oy, R, 0, Math.PI * 2); ctx2.stroke();

                    // Chord AD at bottom
                    const halfCentral = alpha * (Math.PI / 180);
                    const angA = Math.PI / 2 + halfCentral;
                    const angD = Math.PI / 2 - halfCentral;

                    const A = { x: ox + R * Math.cos(angA), y: oy + R * Math.sin(angA) };
                    const D = { x: ox + R * Math.cos(angD), y: oy + R * Math.sin(angD) };

                    // Two top vertices B and C
                    const B = { x: ox + R * Math.cos(-2.1), y: oy + R * Math.sin(-2.1) };
                    const C = { x: ox + R * Math.cos(-1.0), y: oy + R * Math.sin(-1.0) };

                    // Chord AD
                    ctx2.strokeStyle = '#f59e0b';
                    ctx2.lineWidth = 3;
                    ctx2.beginPath(); ctx2.moveTo(A.x, A.y); ctx2.lineTo(D.x, D.y); ctx2.stroke();

                    // Angle ABD
                    ctx2.strokeStyle = '#06b6d4';
                    ctx2.lineWidth = 2;
                    ctx2.beginPath(); ctx2.moveTo(A.x, A.y); ctx2.lineTo(B.x, B.y); ctx2.lineTo(D.x, D.y); ctx2.stroke();

                    // Angle ACD
                    ctx2.strokeStyle = '#ec4899';
                    ctx2.lineWidth = 2;
                    ctx2.beginPath(); ctx2.moveTo(A.x, A.y); ctx2.lineTo(C.x, C.y); ctx2.lineTo(D.x, D.y); ctx2.stroke();

                    // Points
                    const pts = [
                        { name: 'A', p: A, c: '#f59e0b' },
                        { name: `B (${alpha}°)`, p: B, c: '#06b6d4' },
                        { name: `C (${alpha}°)`, p: C, c: '#ec4899' },
                        { name: 'D', p: D, c: '#f59e0b' }
                    ];

                    pts.forEach(it => {
                        ctx2.fillStyle = it.c;
                        ctx2.beginPath(); ctx2.arc(it.p.x, it.p.y, 6, 0, Math.PI * 2); ctx2.fill();
                        ctx2.fillStyle = '#ffffff';
                        ctx2.font = 'bold 13px sans-serif';
                        ctx2.fillText(it.name, it.p.x - 10, it.p.y - 10);
                    });

                    out2.innerHTML = `<strong>Dấu hiệu 4:</strong> Hai đỉnh $B$ và $C$ cùng nhìn đoạn thẳng $AD$ dưới góc $\\widehat{ABD} = \\widehat{ACD} = ${alpha}^\\circ$ &rArr; Tứ giác $ABCD$ nội tiếp đường tròn.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                slAl.addEventListener('input', renderSign4);
                renderSign4();
            
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
