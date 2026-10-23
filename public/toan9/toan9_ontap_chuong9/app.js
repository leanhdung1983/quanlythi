// ================================================================
// Ôn Tập Chương IX: Đường Tròn Ngoại Tiếp & Nội Tiếp - TOÁN 9 KNTT
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
const STORAGE_KEY = 'toan9_toan9_ontap_chuong9_state';

let appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Tướng Quân Hình Học Tròn 9',
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
    "title": "Câu 1: Góc nội tiếp bằng nửa góc ở tâm",
    "pts": 20,
    "question": "Cho đường tròn $(O)$ có góc ở tâm $\\widehat{BOC} = 110^\\circ$. Góc nội tiếp $\\widehat{BAC}$ cùng chắn cung nhỏ $BC$ có số đo là:",
    "options": [
      {
        "text": "$55^\\circ$",
        "correct": true
      },
      {
        "text": "$110^\\circ$",
        "correct": false
      },
      {
        "text": "$70^\\circ$",
        "correct": false
      },
      {
        "text": "$220^\\circ$",
        "correct": false
      }
    ],
    "explanation": "$\\widehat{BAC} = \\frac{1}{2} \\cdot 110^\\circ = 55^\\circ$."
  },
  {
    "id": 2,
    "title": "Câu 2: Dấu hiệu tứ giác nội tiếp",
    "pts": 20,
    "question": "Tứ giác $ABCD$ có $\\widehat{A} = 105^\\circ$. Để tứ giác $ABCD$ nội tiếp thì góc $\\widehat{C}$ phải bằng:",
    "options": [
      {
        "text": "$75^\\circ$",
        "correct": true
      },
      {
        "text": "$105^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      },
      {
        "text": "$85^\\circ$",
        "correct": false
      }
    ],
    "explanation": "$\\widehat{C} = 180^\\circ - 105^\\circ = 75^\\circ$."
  },
  {
    "id": 3,
    "title": "Câu 3: Bán kính ngoại tiếp tam giác đều",
    "pts": 20,
    "question": "Tam giác đều cạnh bằng 9 cm có bán kính đường tròn ngoại tiếp bằng:",
    "options": [
      {
        "text": "$3\\sqrt{3}$ cm",
        "correct": true
      },
      {
        "text": "$4,5$ cm",
        "correct": false
      },
      {
        "text": "$6\\sqrt{3}$ cm",
        "correct": false
      },
      {
        "text": "3 cm",
        "correct": false
      }
    ],
    "explanation": "$R = \\frac{a\\sqrt{3}}{3} = \\frac{9\\sqrt{3}}{3} = 3\\sqrt{3}$ cm."
  },
  {
    "id": 4,
    "title": "Câu 4: Bán kính ngoại tiếp tam giác vuông",
    "pts": 20,
    "question": "Tam giác vuông có cạnh huyền bằng 16 cm. Bán kính đường tròn ngoại tiếp của nó là:",
    "options": [
      {
        "text": "8 cm",
        "correct": true
      },
      {
        "text": "16 cm",
        "correct": false
      },
      {
        "text": "4 cm",
        "correct": false
      },
      {
        "text": "$8\\sqrt{2}$ cm",
        "correct": false
      }
    ],
    "explanation": "Bán kính ngoại tiếp tam giác vuông bằng nửa cạnh huyền: $R = \\frac{16}{2} = 8$ cm."
  },
  {
    "id": 5,
    "title": "Câu 5: Số đo góc của ngũ giác đều",
    "pts": 20,
    "question": "Số đo mỗi góc của một ngũ giác đều bằng:",
    "options": [
      {
        "text": "$108^\\circ$",
        "correct": true
      },
      {
        "text": "$120^\\circ$",
        "correct": false
      },
      {
        "text": "$72^\\circ$",
        "correct": false
      },
      {
        "text": "$135^\\circ$",
        "correct": false
      }
    ],
    "explanation": "$\\alpha = \\frac{(5 - 2) \\cdot 180^\\circ}{5} = 108^\\circ$."
  },
  {
    "id": 6,
    "title": "Câu 6: Chu vi lục giác đều",
    "pts": 20,
    "question": "Lục giác đều nội tiếp đường tròn $(O; 6\\text{ cm})$. Chu vi của nó là:",
    "options": [
      {
        "text": "36 cm",
        "correct": true
      },
      {
        "text": "30 cm",
        "correct": false
      },
      {
        "text": "24 cm",
        "correct": false
      },
      {
        "text": "$18\\sqrt{3}$ cm",
        "correct": false
      }
    ],
    "explanation": "Cạnh lục giác đều $a = R = 6$ cm. Chu vi $C = 6 \\times 6 = 36$ cm."
  },
  {
    "id": 7,
    "title": "Câu 7: Góc nội tiếp chắn nửa đường tròn",
    "pts": 20,
    "question": "Góc nội tiếp chắn nửa đường tròn có số đo bằng:",
    "options": [
      {
        "text": "$90^\\circ$",
        "correct": true
      },
      {
        "text": "$180^\\circ$",
        "correct": false
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$45^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Định lí Thales: Góc nội tiếp chắn nửa đường tròn luôn luôn bằng $90^\\circ$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tứ giác không nội tiếp",
    "pts": 20,
    "question": "Hình nào sau đây KHÔNG THỂ nội tiếp đường tròn nếu các góc không vuông?",
    "options": [
      {
        "text": "Hình bình hành",
        "correct": true
      },
      {
        "text": "Hình vuông",
        "correct": false
      },
      {
        "text": "Hình chữ nhật",
        "correct": false
      },
      {
        "text": "Hình thang cân",
        "correct": false
      }
    ],
    "explanation": "Hình bình hành nếu không phải là hình chữ nhật thì hai góc đối bằng nhau nhưng không thể có tổng bằng 180°, nên không nội tiếp được."
  },
  {
    "id": 9,
    "title": "Câu 9: Góc ở tâm lục giác đều",
    "pts": 20,
    "question": "Góc ở tâm của lục giác đều có số đo bằng:",
    "options": [
      {
        "text": "$60^\\circ$",
        "correct": true
      },
      {
        "text": "$120^\\circ$",
        "correct": false
      },
      {
        "text": "$90^\\circ$",
        "correct": false
      },
      {
        "text": "$72^\\circ$",
        "correct": false
      }
    ],
    "explanation": "$\\beta = \\frac{360^\\circ}{6} = 60^\\circ$."
  },
  {
    "id": 10,
    "title": "Câu 10: Tỉ số bán kính trong tam giác đều",
    "pts": 20,
    "question": "Trong tam giác đều, khẳng định nào sau đây là ĐÚNG về bán kính ngoại tiếp $R$ và nội tiếp $r$?",
    "options": [
      {
        "text": "$R = 2r$",
        "correct": true
      },
      {
        "text": "$r = 2R$",
        "correct": false
      },
      {
        "text": "$R = r\\sqrt{3}$",
        "correct": false
      },
      {
        "text": "$R = 3r$",
        "correct": false
      }
    ],
    "explanation": "Trong tam giác đều, trọng tâm trùng tâm nội và ngoại tiếp, do đó $R = \\frac{2}{3}h$ và $r = \\frac{1}{3}h \\implies R = 2r$."
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
                const out1 = document.getElementById('lab1Output');
                let cur = 1;

                const nodes = [
                    { id: 1, title: 'Góc nội tiếp', desc: 'BAC = 1/2 BOC. Góc chắn nửa đường tròn = 90 độ. Góc cùng chắn 1 cung bằng nhau.', color: '#06b6d4' },
                    { id: 2, title: 'Đường tròn tam giác', desc: 'Ngoại tiếp: giao 3 trung trực. Nội tiếp: giao 3 phân giác, r = S/p. Tam giác đều: R = 2r.', color: '#3b82f6' },
                    { id: 3, title: 'Tứ giác nội tiếp', desc: 'A + C = 180 độ. Góc ngoài bằng góc đối trong. Hai đỉnh kề cùng nhìn 1 cạnh.', color: '#10b981' },
                    { id: 4, title: 'Đa giác đều', desc: 'alpha = (n-2)*180/n. Góc ở tâm 360/n. Lục giác đều a = R. Chỉ n=3, 4, 6 lát khít sàn.', color: '#f59e0b' }
                ];

                function drawMindmap() {
                    const cw = c1.width;
                    const ch = c1.height;
                    const ox = cw / 2;
                    const oy = ch / 2;
                    ctx.clearRect(0, 0, cw, ch);

                    // Center
                    ctx.fillStyle = '#6366f1';
                    ctx.beginPath(); ctx.arc(ox, oy, 42, 0, Math.PI * 2); ctx.fill();
                    ctx.strokeStyle = '#a5b4fc'; ctx.lineWidth = 3; ctx.stroke();
                    ctx.fillStyle = '#ffffff'; ctx.font = 'bold 12px sans-serif';
                    ctx.fillText('CHƯƠNG IX', ox - 36, oy - 6);
                    ctx.fillText('HÌNH HỌC 9', ox - 34, oy + 12);

                    const pos = [
                        { x: ox - 180, y: oy - 75 },
                        { x: ox + 180, y: oy - 75 },
                        { x: ox + 180, y: oy + 75 },
                        { x: ox - 180, y: oy + 75 }
                    ];

                    nodes.forEach((nd, i) => {
                        const p = pos[i];
                        const isA = nd.id === cur;

                        ctx.strokeStyle = isA ? nd.color : '#334155';
                        ctx.lineWidth = isA ? 3 : 1.5;
                        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(p.x, p.y); ctx.stroke();

                        ctx.fillStyle = isA ? nd.color : '#1e293b';
                        ctx.strokeStyle = nd.color;
                        ctx.lineWidth = isA ? 3 : 1;
                        ctx.beginPath();
                        ctx.roundRect(p.x - 70, p.y - 25, 140, 50, 10);
                        ctx.fill(); ctx.stroke();

                        ctx.fillStyle = '#ffffff';
                        ctx.font = isA ? 'bold 12px sans-serif' : '11px sans-serif';
                        ctx.fillText(nd.title, p.x - 55, p.y + 5);
                    });

                    const act = nodes.find(n => n.id === cur);
                    out1.innerHTML = `<strong>${act.title}:</strong> ${act.desc}`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out1, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                [1, 2, 3, 4].forEach(n => {
                    const el = document.getElementById('btnCh9_' + n);
                    if (el) el.addEventListener('click', () => { cur = n; drawMindmap(); });
                });

                drawMindmap();
            
    if (typeof initLab1 === 'function') initLab1();
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const c2 = document.getElementById('labCanvas2');
                const ctx2 = c2.getContext('2d');
                const out2 = document.getElementById('lab2Output');

                function renderTable() {
                    const cw = c2.width;
                    const ch = c2.height;
                    ctx2.clearRect(0, 0, cw, ch);

                    // Table
                    const tx = 40;
                    const ty = 30;
                    const tw = cw - 80;
                    const rowH = 45;

                    // Header
                    ctx2.fillStyle = '#334155';
                    ctx2.fillRect(tx, ty, tw, rowH);
                    ctx2.strokeStyle = '#64748b';
                    ctx2.strokeRect(tx, ty, tw, rowH);

                    ctx2.fillStyle = '#ffffff';
                    ctx2.font = 'bold 12px sans-serif';
                    ctx2.fillText('Đa giác đều', tx + 20, ty + 28);
                    ctx2.fillText('Góc α', tx + 140, ty + 28);
                    ctx2.fillText('Cạnh a theo R', tx + 240, ty + 28);
                    ctx2.fillText('Bán kính r theo R', tx + 370, ty + 28);

                    const rows = [
                        { name: 'Tam giác đều (n=3)', ang: '60°', a: 'R√3', r: 'R/2' },
                        { name: 'Hình vuông (n=4)', ang: '90°', a: 'R√2', r: 'R√2 / 2' },
                        { name: 'Lục giác đều (n=6)', ang: '120°', a: 'R', r: 'R√3 / 2' }
                    ];

                    rows.forEach((r, idx) => {
                        const ry = ty + (idx + 1) * rowH;
                        ctx2.fillStyle = idx % 2 === 0 ? '#1e293b' : '#0f172a';
                        ctx2.fillRect(tx, ry, tw, rowH);
                        ctx2.strokeRect(tx, ry, tw, rowH);

                        ctx2.fillStyle = '#38bdf8';
                        ctx2.font = '13px sans-serif';
                        ctx2.fillText(r.name, tx + 15, ry + 28);

                        ctx2.fillStyle = '#cbd5e1';
                        ctx2.fillText(r.ang, tx + 150, ry + 28);

                        ctx2.fillStyle = '#34d399';
                        ctx2.fillText(r.a, tx + 260, ry + 28);

                        ctx2.fillStyle = '#fbbf24';
                        ctx2.fillText(r.r, tx + 390, ry + 28);
                    });

                    out2.innerHTML = `Bảng tra cứu chuẩn xác mối liên hệ giữa cạnh $a$, bán kính nội tiếp $r$ theo bán kính ngoại tiếp $R$ cho 3 đa giác đều cơ bản của hình học lớp 9.`;
                    if (window.renderMathInElement) {
                        window.renderMathInElement(out2, { delimiters: [{ left: '$', right: '$', display: false }] });
                    }
                }

                renderTable();
            
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
