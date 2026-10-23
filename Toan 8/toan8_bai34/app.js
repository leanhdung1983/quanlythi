// ================================================================
// BÀI 34: BA TRƯỜNG HỢP ĐỒNG DẠNG CỦA TAM GIÁC - TOÁN 8 KNTT
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
  userTitle: 'Kiến Trúc Sư Tam Giác Đồng Dạng 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_bai34_state';

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
    "title": "Câu 1: Điều kiện đồng dạng cạnh - cạnh - cạnh",
    "pts": 20,
    "question": "Tam giác $ABC$ có độ dài các cạnh là $3, 4, 5$. Tam giác nào sau đây đồng dạng với $\\triangle ABC$?",
    "options": [
      {
        "text": "Tam giác có các cạnh $6, 8, 10$",
        "correct": true
      },
      {
        "text": "Tam giác có các cạnh $4, 5, 6$",
        "correct": false
      },
      {
        "text": "Tam giác có các cạnh $5, 6, 7$",
        "correct": false
      },
      {
        "text": "Tam giác có các cạnh $3, 6, 9$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{6}{3} = \\frac{8}{4} = \\frac{10}{5} = 2$. Ba cạnh tỉ lệ nên hai tam giác đồng dạng theo trường hợp c-c-c."
  },
  {
    "id": 2,
    "title": "Câu 2: Điều kiện đồng dạng cạnh - góc - cạnh",
    "pts": 20,
    "question": "Cho $\\triangle ABC$ và $\\triangle MNP$ có $\\frac{AB}{MN} = \\frac{AC}{MP}$. Để $\\triangle ABC \\backsim \\triangle MNP$ theo trường hợp c-g-c thì cần thêm điều kiện nào?",
    "options": [
      {
        "text": "$\\widehat{A} = \\widehat{M}$",
        "correct": true
      },
      {
        "text": "$\\widehat{B} = \\widehat{N}$",
        "correct": false
      },
      {
        "text": "$\\widehat{C} = \\widehat{P}$",
        "correct": false
      },
      {
        "text": "$\\widehat{B} = \\widehat{P}$",
        "correct": false
      }
    ],
    "explanation": "Góc bằng nhau phải là góc xen giữa hai cặp cạnh tương ứng tỉ lệ. Góc xen giữa $AB, AC$ là $\\widehat{A}$; góc xen giữa $MN, MP$ là $\\widehat{M}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Điều kiện đồng dạng góc - góc",
    "pts": 20,
    "question": "Cho hai tam giác $ABC$ và $DEF$ có $\\widehat{A} = \\widehat{D} = 50^\\circ$ và $\\widehat{B} = 70^\\circ$. Để $\\triangle ABC \\backsim \\triangle DEF$ thì góc $\\widehat{E}$ phải bằng:",
    "options": [
      {
        "text": "$70^\\circ$",
        "correct": true
      },
      {
        "text": "$60^\\circ$",
        "correct": false
      },
      {
        "text": "$50^\\circ$",
        "correct": false
      },
      {
        "text": "$80^\\circ$",
        "correct": false
      }
    ],
    "explanation": "Để hai tam giác đồng dạng theo trường hợp g-g với thứ tự đỉnh $A$ ứng với $D$, $B$ ứng với $E$ thì $\\widehat{E} = \\widehat{B} = 70^\\circ$."
  },
  {
    "id": 4,
    "title": "Câu 4: Đồng dạng qua góc đối đỉnh",
    "pts": 20,
    "question": "Cho hai đoạn thẳng $AB$ và $CD$ cắt nhau tại trung điểm $O$ của mỗi đoạn hoặc cắt nhau sao cho $OA \\cdot OB = OC \\cdot OD$. Nếu $\\triangle OAC \\backsim \\triangle ODB$ thì căn cứ theo trường hợp nào?",
    "options": [
      {
        "text": "c-g-c (vì $\\frac{OA}{OD} = \\frac{OC}{OB}$ và góc đối đỉnh tại $O$)",
        "correct": true
      },
      {
        "text": "c-c-c",
        "correct": false
      },
      {
        "text": "g-g",
        "correct": false
      },
      {
        "text": "Không đồng dạng",
        "correct": false
      }
    ],
    "explanation": "Có hai cặp cạnh tạo góc tỉ lệ và góc đối đỉnh $\\widehat{AOC} = \\widehat{DOB}$ xen giữa nên đồng dạng theo trường hợp c-g-c."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhận diện hai tam giác cân đồng dạng",
    "pts": 20,
    "question": "Hai tam giác cân đồng dạng với nhau khi nào?",
    "options": [
      {
        "text": "Khi chúng có góc ở đỉnh bằng nhau",
        "correct": true
      },
      {
        "text": "Khi chúng có một cạnh đáy bằng nhau",
        "correct": false
      },
      {
        "text": "Khi chúng có một cạnh bên bằng nhau",
        "correct": false
      },
      {
        "text": "Hai tam giác cân luôn luôn đồng dạng",
        "correct": false
      }
    ],
    "explanation": "Nếu hai tam giác cân có góc ở đỉnh bằng nhau thì các góc ở đáy của chúng cũng bằng nhau (vì góc đáy $= \\frac{180^\\circ - \\text{góc đỉnh}}{2}$). Khi đó hai tam giác đồng dạng theo trường hợp g-g."
  },
  {
    "id": 6,
    "title": "Câu 6: Tính cạnh chưa biết qua trường hợp g-g",
    "pts": 20,
    "question": "Cho $\\triangle ABC \\backsim \\triangle DEF$ (g-g). Biết $AB = 4, BC = 6, DE = 8$. Độ dài cạnh $EF$ là:",
    "options": [
      {
        "text": "$12$",
        "correct": true
      },
      {
        "text": "$10$",
        "correct": false
      },
      {
        "text": "$16$",
        "correct": false
      },
      {
        "text": "$8$",
        "correct": false
      }
    ],
    "explanation": "Tỉ số đồng dạng $k = \\frac{DE}{AB} = \\frac{8}{4} = 2$. Do đó $EF = k \\cdot BC = 2 \\times 6 = 12$."
  },
  {
    "id": 7,
    "title": "Câu 7: Phát hiện tam giác đồng dạng trong hình thang",
    "pts": 20,
    "question": "Cho hình thang $ABCD$ ($AB \\parallel CD$), hai đường chéo $AC$ và $BD$ cắt nhau tại $O$. Cặp tam giác nào sau đây đồng dạng?",
    "options": [
      {
        "text": "$\\triangle OAB \\backsim \\triangle OCD$",
        "correct": true
      },
      {
        "text": "$\\triangle OAD \\backsim \\triangle OBC$",
        "correct": false
      },
      {
        "text": "$\\triangle ABC \\backsim \\triangle ADC$",
        "correct": false
      },
      {
        "text": "$\\triangle ABD \\backsim \\triangle BCD$",
        "correct": false
      }
    ],
    "explanation": "Vì $AB \\parallel CD$, các góc so le trong bằng nhau: $\\widehat{OAB} = \\widehat{OCD}$ và $\\widehat{OBA} = \\widehat{ODC}$. Do đó $\\triangle OAB \\backsim \\triangle OCD$ (g-g)."
  },
  {
    "id": 8,
    "title": "Câu 8: Cẩn thận thứ tự đỉnh",
    "pts": 20,
    "question": "Cho $\\triangle ABC$ có $AB = 2, BC = 4, CA = 3$ và $\\triangle MNP$ có $MN = 6, NP = 9, PM = 12$. Kí hiệu đồng dạng nào sau đây viết đúng thứ tự đỉnh?",
    "options": [
      {
        "text": "$\\triangle ABC \\backsim \\triangle MNP$",
        "correct": false
      },
      {
        "text": "$\\triangle ABC \\backsim \\triangle NMP$",
        "correct": false
      },
      {
        "text": "$\\triangle ABC \\backsim \\triangle NPM$",
        "correct": false
      },
      {
        "text": "$\\triangle ABC \\backsim \\triangle N PM$ sai, kiểm tra: $AB/MN=2/6=1/3$, $CA/NP=3/9=1/3$, $BC/PM=4/12=1/3 \\implies \\triangle ABC \\backsim \\triangle MNP$ đúng",
        "correct": true
      }
    ],
    "explanation": "So sánh tỉ số: $\\frac{AB}{MN} = \\frac{2}{6} = \\frac{1}{3}$; $\\frac{AC}{NP} = \\frac{3}{9} = \\frac{1}{3}$; $\\frac{BC}{MP} = \\frac{4}{12} = \\frac{1}{3}$. Do đó $\\triangle ABC \\backsim \\triangle MNP$ (c-c-c)."
  },
  {
    "id": 9,
    "title": "Câu 9: Chứng minh tam giác đồng dạng qua góc chung",
    "pts": 20,
    "question": "Cho tam giác $ABC$, trên cạnh $AB, AC$ lấy $D, E$ sao cho $\\widehat{ADE} = \\widehat{C}$. Khi đó:",
    "options": [
      {
        "text": "$\\triangle ADE \\backsim \\triangle ACB$",
        "correct": true
      },
      {
        "text": "$\\triangle ADE \\backsim \\triangle ABC$",
        "correct": false
      },
      {
        "text": "$\\triangle ADE = \\triangle ACB$",
        "correct": false
      },
      {
        "text": "$\\triangle ADE \\backsim \\triangle BAC$",
        "correct": false
      }
    ],
    "explanation": "Xét $\\triangle ADE$ và $\\triangle ACB$ có góc $\\widehat{A}$ chung và $\\widehat{ADE} = \\widehat{C}$. Vậy $\\triangle ADE \\backsim \\triangle ACB$ (g-g)."
  },
  {
    "id": 10,
    "title": "Câu 10: Ứng dụng đo khoảng cách bờ sông không qua sông",
    "pts": 20,
    "question": "Để đo khoảng cách giữa hai điểm A và B ở hai bên bờ sông, người ta cắm các cọc tạo thành hai tam giác đồng dạng $\\triangle OAB \\backsim \\triangle OCD$ với tỉ số $\\frac{OA}{OC} = 4$. Biết $CD = 15\\text{ m}$. Khoảng cách $AB$ là:",
    "options": [
      {
        "text": "$60\\text{ m}$",
        "correct": true
      },
      {
        "text": "$45\\text{ m}$",
        "correct": false
      },
      {
        "text": "$30\\text{ m}$",
        "correct": false
      },
      {
        "text": "$75\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $\\frac{AB}{CD} = \\frac{OA}{OC} = 4 \\implies AB = 4 \\times CD = 4 \\times 15 = 60\\text{ m}$."
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
                const outEl = document.getElementById('lab1Output34');

                const caseData = {
                    1: { name: "Cạnh - Cạnh - Cạnh (c-c-c)", text: "3 cạnh tỉ lệ: 4/2 = 6/3 = 8/4 = 2. Hai tam giác đồng dạng!", note: "Không cần biết góc." },
                    2: { name: "Cạnh - Góc - Cạnh (c-g-c)", text: "2 cạnh tỉ lệ: 6/3 = 8/4 = 2 và góc xen giữa bằng 60°. Hai tam giác đồng dạng!", note: "Góc phải xen giữa." },
                    3: { name: "Góc - Góc (g-g)", text: "2 góc bằng nhau: Â = 50°, B̂ = 70°. Hai tam giác đồng dạng!", note: "Trường hợp nhanh nhất và phổ biến nhất." }
                };

                function showCase(c) {
                    const d = caseData[c];
                    outEl.innerHTML = `<strong>Trường hợp: ${d.name}</strong> <br>${d.text} &nbsp;|&nbsp; <em>${d.note}</em>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Tam giác 1
                    ctx.strokeStyle = '#06b6d4';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(80, h - 30); ctx.lineTo(180, h - 30); ctx.lineTo(130, h - 120); ctx.closePath();
                    ctx.stroke();
                    ctx.fillStyle = '#06b6d4';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText('ΔABC', 115, h - 15);

                    // Tam giác 2
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(300, h - 30); ctx.lineTo(460, h - 30); ctx.lineTo(380, h - 175); ctx.closePath();
                    ctx.stroke();
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillText("ΔA'B'C'", 370, h - 15);

                    ctx.fillStyle = '#34d399';
                    ctx.font = 'bold 24px Segoe UI';
                    ctx.fillText('∽', 235, h / 2);
                }

                document.getElementById('btnCase1').addEventListener('click', () => showCase(1));
                document.getElementById('btnCase2').addEventListener('click', () => showCase(2));
                document.getElementById('btnCase3').addEventListener('click', () => showCase(3));
                showCase(3);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const inAC = document.getElementById('inAC2');
                const outEl = document.getElementById('lab2Output34');

                function calc() {
                    const ac2 = parseFloat(inAC.value) || 15;
                    const ab1 = 6;
                    const ac1 = 9;
                    const x = (ab1 * ac2 / ac1).toFixed(2);

                    outEl.innerHTML = `<strong>Thiết lập tỉ số:</strong> $\\frac{A'B'}{AB} = \\frac{A'C'}{AC} \\iff \\frac{x}{6} = \\frac{${ac2}}{9}$ <br><strong>Suy ra độ dài cạnh:</strong> <strong style="color:#34d399; font-size:1.15rem;">$x = \\frac{6 \\cdot ${ac2}}{9} = ${x}$</strong>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#f8fafc';
                    ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText(`KẾT QUẢ TÍNH CẠNH TƯƠNG ỨNG: x = ${x}`, 40, 45);

                    // Trực quan thanh tỉ lệ
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(40, 80, 180, 30);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText('AB = 6', 90, 100);

                    ctx.fillStyle = '#f59e0b';
                    ctx.fillRect(40, 130, Math.min(w - 80, parseFloat(x) * 30), 30);
                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(`A'B' = ${x}`, 90, 150);
                }

                inAC.addEventListener('input', calc);
                calc();
            
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
