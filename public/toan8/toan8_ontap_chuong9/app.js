// ================================================================
// ÔN TẬP CHƯƠNG IX: TAM GIÁC ĐỒNG DẠNG - TOÁN 8 KNTT
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
  userTitle: 'Đại Kiện Tướng Hình Học 8',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan8_ontap_chuong9_state';

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
    "title": "Câu 1: Điều kiện đồng dạng của hai tam giác",
    "pts": 20,
    "question": "Cho $\\triangle ABC$ và $\\triangle A'B'C'$. Khẳng định nào sau đây là <strong>sai</strong>?",
    "options": [
      {
        "text": "Nếu $\\frac{AB}{A'B'} = \\frac{AC}{A'C'}$ và $\\widehat{B} = \\widehat{B'}$ thì $\\triangle ABC \\backsim \\triangle A'B'C'$",
        "correct": true
      },
      {
        "text": "Nếu $\\widehat{A} = \\widehat{A'}$ và $\\widehat{B} = \\widehat{B'}$ thì $\\triangle ABC \\backsim \\triangle A'B'C'$",
        "correct": false
      },
      {
        "text": "Nếu $\\frac{AB}{A'B'} = \\frac{BC}{B'C'} = \\frac{CA}{C'A'}$ thì $\\triangle ABC \\backsim \\triangle A'B'C'$",
        "correct": false
      },
      {
        "text": "Nếu $\\frac{AB}{A'B'} = \\frac{AC}{A'C'}$ và $\\widehat{A} = \\widehat{A'}$ thì $\\triangle ABC \\backsim \\triangle A'B'C'$",
        "correct": false
      }
    ],
    "explanation": "Trong trường hợp c-g-c, góc bằng nhau bắt buộc phải là góc xen giữa hai cạnh tỉ lệ (tức là góc $\\widehat{A} = \\widehat{A'}$). Nếu góc $\\widehat{B} = \\widehat{B'}$ không xen giữa thì chưa đủ để kết luận đồng dạng."
  },
  {
    "id": 2,
    "title": "Câu 2: Định lí Pythagore tính cạnh huyền",
    "pts": 20,
    "question": "Một tam giác vuông có độ dài hai cạnh góc vuông là $7\\text{ cm}$ và $24\\text{ cm}$. Độ dài cạnh huyền là:",
    "options": [
      {
        "text": "$25\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$31\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$26\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$23\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Theo định lí Pythagore: $c = \\sqrt{7^2 + 24^2} = \\sqrt{49 + 576} = \\sqrt{625} = 25\\text{ cm}$."
  },
  {
    "id": 3,
    "title": "Câu 3: Tỉ số diện tích hai tam giác đồng dạng",
    "pts": 20,
    "question": "Cho $\\triangle ABC \\backsim \\triangle DEF$ theo tỉ số $k = \\frac{2}{5}$. Tỉ số diện tích $\\frac{S_{ABC}}{S_{DEF}}$ bằng:",
    "options": [
      {
        "text": "$\\frac{4}{25}$",
        "correct": true
      },
      {
        "text": "$\\frac{2}{5}$",
        "correct": false
      },
      {
        "text": "$\\frac{8}{125}$",
        "correct": false
      },
      {
        "text": "$\\frac{5}{2}$",
        "correct": false
      }
    ],
    "explanation": "Tỉ số diện tích của hai tam giác đồng dạng bằng bình phương tỉ số đồng dạng: $k^2 = (\\frac{2}{5})^2 = \\frac{4}{25}$."
  },
  {
    "id": 4,
    "title": "Câu 4: Đồng dạng trong hình thang",
    "pts": 20,
    "question": "Cho hình thang $ABCD$ ($AB \\parallel CD$) có $AB = 4\\text{ cm}, CD = 8\\text{ cm}$. Hai đường chéo cắt nhau tại $O$. Tỉ số $\\frac{OA}{OC}$ bằng:",
    "options": [
      {
        "text": "$\\frac{1}{2}$",
        "correct": true
      },
      {
        "text": "$2$",
        "correct": false
      },
      {
        "text": "$\\frac{1}{4}$",
        "correct": false
      },
      {
        "text": "$1$",
        "correct": false
      }
    ],
    "explanation": "Vì $\\triangle OAB \\backsim \\triangle OCD$ nên $\\frac{OA}{OC} = \\frac{AB}{CD} = \\frac{4}{8} = \\frac{1}{2}$."
  },
  {
    "id": 5,
    "title": "Câu 5: Nhận diện tam giác vuông bằng định lí đảo",
    "pts": 20,
    "question": "Tam giác nào sau đây là tam giác vuông?",
    "options": [
      {
        "text": "Tam giác có ba cạnh $9\\text{ cm};\\, 12\\text{ cm};\\, 15\\text{ cm}$",
        "correct": true
      },
      {
        "text": "Tam giác có ba cạnh $5\\text{ cm};\\, 7\\text{ cm};\\, 9\\text{ cm}$",
        "correct": false
      },
      {
        "text": "Tam giác có ba cạnh $4\\text{ cm};\\, 6\\text{ cm};\\, 8\\text{ cm}$",
        "correct": false
      },
      {
        "text": "Tam giác có ba cạnh $6\\text{ cm};\\, 8\\text{ cm};\\, 11\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Ta có $9^2 + 12^2 = 81 + 144 = 225 = 15^2$. Theo định lí Pythagore đảo, đây là tam giác vuông."
  },
  {
    "id": 6,
    "title": "Câu 6: Đường cao ứng với cạnh huyền",
    "pts": 20,
    "question": "Cho tam giác vuông $ABC$ vuông tại $A$, đường cao $AH$. Biết $AB = 6\\text{ cm}, AC = 8\\text{ cm}$. Chiều cao $AH$ bằng:",
    "options": [
      {
        "text": "$4{,}8\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$5\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$10\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$7\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Cạnh huyền $BC = \\sqrt{6^2 + 8^2} = 10\\text{ cm}$. Ta có $AH = \\frac{AB \\cdot AC}{BC} = \\frac{6 \\times 8}{10} = 4{,}8\\text{ cm}$."
  },
  {
    "id": 7,
    "title": "Câu 7: Hình đồng dạng phối cảnh",
    "pts": 20,
    "question": "Hình đồng dạng phối cảnh tâm $O$ tỉ số $k = 2$ biến đoạn thẳng $AB = 5\\text{ cm}$ thành đoạn thẳng $A'B'$ có độ dài bằng:",
    "options": [
      {
        "text": "$10\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$2{,}5\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$25\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$5\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Độ dài đoạn thẳng qua phép đồng dạng phối cảnh tỉ số $k$ được nhân lên $k$ lần: $A'B' = k \\cdot AB = 2 \\times 5 = 10\\text{ cm}$."
  },
  {
    "id": 8,
    "title": "Câu 8: Tỉ số chu vi của hai tam giác đồng dạng",
    "pts": 20,
    "question": "Cho $\\triangle ABC \\backsim \\triangle MNP$ có chu vi lần lượt là $20\\text{ cm}$ và $30\\text{ cm}$. Nếu cạnh $AB = 6\\text{ cm}$ thì cạnh tương ứng $MN$ bằng:",
    "options": [
      {
        "text": "$9\\text{ cm}$",
        "correct": true
      },
      {
        "text": "$4\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$12\\text{ cm}$",
        "correct": false
      },
      {
        "text": "$15\\text{ cm}$",
        "correct": false
      }
    ],
    "explanation": "Tỉ số đồng dạng bằng tỉ số chu vi: $\\frac{AB}{MN} = \\frac{20}{30} = \\frac{2}{3} \\implies MN = \\frac{6 \\times 3}{2} = 9\\text{ cm}$."
  },
  {
    "id": 9,
    "title": "Câu 9: Bài toán bóng nắng kim tự tháp của Thalès",
    "pts": 20,
    "question": "Nhà toán học Thalès đo chiều cao kim tự tháp bằng cách cắm một cây gậy thẳng đứng. Biết gậy cao $1\\text{ m}$ có bóng dài $1{,}6\\text{ m}$, bóng kim tự tháp cùng lúc dài $235\\text{ m}$. Chiều cao của kim tự tháp ước tính khoảng:",
    "options": [
      {
        "text": "$146{,}9\\text{ m}$",
        "correct": true
      },
      {
        "text": "$376\\text{ m}$",
        "correct": false
      },
      {
        "text": "$235\\text{ m}$",
        "correct": false
      },
      {
        "text": "$150\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Tỉ số đồng dạng: $\\frac{H}{1} = \\frac{235}{1{,}6} \\implies H = \\frac{235}{1{,}6} \\approx 146{,}9\\text{ m}$."
  },
  {
    "id": 10,
    "title": "Câu 10: Hai hình chữ nhật đồng dạng",
    "pts": 20,
    "question": "Một hình chữ nhật có chiều dài $12\\text{ m}$ và chiều rộng $8\\text{ m}$. Hình chữ nhật nào sau đây <strong>đồng dạng</strong> với nó?",
    "options": [
      {
        "text": "Hình chữ nhật có kích thước $6\\text{ m} \\times 4\\text{ m}$",
        "correct": true
      },
      {
        "text": "Hình chữ nhật có kích thước $10\\text{ m} \\times 6\\text{ m}$",
        "correct": false
      },
      {
        "text": "Hình chữ nhật có kích thước $12\\text{ m} \\times 6\\text{ m}$",
        "correct": false
      },
      {
        "text": "Hình chữ nhật có kích thước $14\\text{ m} \\times 10\\text{ m}$",
        "correct": false
      }
    ],
    "explanation": "Tỉ số dài chia rộng của hình ban đầu là $\\frac{12}{8} = 1{,}5$. Hình chữ nhật $6\\text{ m} \\times 4\\text{ m}$ có tỉ số $\\frac{6}{4} = 1{,}5$. Tỉ số cạnh tương ứng bằng nhau nên chúng đồng dạng."
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
                const outEl = document.getElementById('lab1OutputC9');

                const c9Topics = {
                    1: { title: "Định nghĩa tam giác đồng dạng", formula: "$\triangle A'B'C' \backsim \triangle ABC (k)$", desc: "Các góc tương ứng bằng nhau, các cạnh tương ứng tỉ lệ bằng k." },
                    2: { title: "Ba trường hợp đồng dạng", formula: "$c-c-c \mid c-g-c \mid g-g$", desc: "c-c-c (3 cạnh tỉ lệ), c-g-c (2 cạnh tỉ lệ, góc xen giữa bằng), g-g (2 góc bằng)." },
                    3: { title: "Định lí Pythagore", formula: "$a^2 = b^2 + c^2$", desc: "Thuận: tính cạnh huyền / góc vuông. Đảo: chứng minh tam giác vuông." },
                    4: { title: "Đồng dạng tam giác vuông", formula: "$S'/S = k^2;\\, h^2 = b'c'$", desc: "1 góc nhọn bằng hoặc tỉ lệ cạnh huyền - cạnh góc vuông. Tỉ số diện tích k²." },
                    5: { title: "Hình đồng dạng", formula: "$OM' = k \\cdot OM$", desc: "Hình đồng dạng phối cảnh tâm O. Hình tròn, hình vuông luôn đồng dạng." }
                };

                function showC9(id) {
                    const t = c9Topics[id];
                    outEl.innerHTML = `<strong>Chuyên đề: ${t.title}</strong> &nbsp;|&nbsp; <strong>Công thức:</strong> ${t.formula} <br>${t.desc}`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    ctx.fillStyle = '#06b6d4';
                    ctx.beginPath(); ctx.arc(w / 2, h / 2, 45, 0, Math.PI * 2); ctx.fill();
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 12px Segoe UI';
                    ctx.textAlign = 'center';
                    ctx.fillText('TAM GIÁC', w / 2, h / 2 - 5);
                    ctx.fillText('ĐỒNG DẠNG', w / 2, h / 2 + 13);
                }

                document.getElementById('btnC9T1').addEventListener('click', () => showC9(1));
                document.getElementById('btnC9T2').addEventListener('click', () => showC9(2));
                document.getElementById('btnC9T3').addEventListener('click', () => showC9(3));
                document.getElementById('btnC9T4').addEventListener('click', () => showC9(4));
                document.getElementById('btnC9T5').addEventListener('click', () => showC9(5));
                showC9(1);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  // Khởi tạo Lab 2
  try {
    
                const canvas = document.getElementById('labCanvas2');
                const ctx = canvas.getContext('2d');
                const inShad = document.getElementById('inShad');
                const outEl = document.getElementById('lab2OutputC9');

                function calc() {
                    const L = parseFloat(inShad.value) || 18;
                    const hCoc = 2; // Cọc cao 2m
                    const lCoc = 1.5; // Bóng cọc 1.5m
                    const H = (hCoc * L / lCoc).toFixed(1);

                    outEl.innerHTML = `<strong>Dữ liệu:</strong> Cọc tiêu cao $2\\text{ m}$, bóng cọc dài $1{,}5\\text{ m}$; Bóng tháp dài $${L}\\text{ m}$ <br><strong>Tỉ số đồng dạng:</strong> $\\frac{H}{2} = \\frac{${L}}{1{,}5} \\implies$ <strong>Chiều cao tháp:</strong> <strong style="color:#34d399; font-size:1.15rem;">$H = \\frac{2 \\cdot ${L}}{1{,}5} = ${H}\\text{ m}$</strong>`;
                    if (window.renderMathInElement) {
                        renderMathInElement(outEl, { delimiters: [{left: "$", right: "$", display: false}], throwOnError: false });
                    }

                    const w = canvas.width;
                    const h = canvas.height;
                    ctx.clearRect(0, 0, w, h);
                    ctx.fillStyle = '#0f172a';
                    ctx.fillRect(0, 0, w, h);

                    // Mặt đất
                    ctx.strokeStyle = '#475569';
                    ctx.lineWidth = 2;
                    ctx.beginPath(); ctx.moveTo(20, h - 30); ctx.lineTo(w - 20, h - 30); ctx.stroke();

                    // Tháp
                    ctx.fillStyle = '#6366f1';
                    ctx.fillRect(60, h - 30 - 130, 30, 130);
                    ctx.fillStyle = '#ffffff';
                    ctx.font = 'bold 13px Segoe UI';
                    ctx.fillText(`Tháp: ${H}m`, 50, h - 170);

                    // Bóng tháp
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 4;
                    ctx.beginPath(); ctx.moveTo(90, h - 28); ctx.lineTo(240, h - 28); ctx.stroke();
                    ctx.fillStyle = '#f59e0b';
                    ctx.fillText(`Bóng: ${L}m`, 140, h - 12);

                    // Cọc tiêu
                    ctx.fillStyle = '#06b6d4';
                    ctx.fillRect(340, h - 30 - 35, 8, 35);
                    ctx.fillText('Cọc 2m', 325, h - 72);

                    // Bóng cọc
                    ctx.strokeStyle = '#f59e0b';
                    ctx.lineWidth = 3;
                    ctx.beginPath(); ctx.moveTo(348, h - 28); ctx.lineTo(380, h - 28); ctx.stroke();
                }

                inShad.addEventListener('input', calc);
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
