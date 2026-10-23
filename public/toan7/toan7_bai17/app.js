// ================================================================
// BÀI 17: THU THẬP VÀ PHÂN LOẠI DỮ LIỆU - TOÁN 7 KNTT
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
  userTitle: 'Nhà Phân Tích Dữ Liệu 7',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

const STORAGE_KEY = 'toan7_bai17_state';

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
    "title": "Câu 1: Nhận diện dữ liệu định tính",
    "pts": 20,
    "question": "Dữ liệu nào sau đây là **dữ liệu định tính**?",
    "options": [
      {
        "text": "Xếp loại học lực cuối kì của học sinh (Tốt, Khá, Đạt, Chưa đạt)",
        "correct": true
      },
      {
        "text": "Chiều cao của các vận động viên bóng rổ (cm)",
        "correct": false
      },
      {
        "text": "Số bàn thắng ghi được trong một mùa giải",
        "correct": false
      },
      {
        "text": "Cân nặng của các bạn trong tổ 1 (kg)",
        "correct": false
      }
    ],
    "explanation": "Xếp loại học lực là dữ liệu chữ, chỉ tính chất định tính, không phải là số đo tính toán được."
  },
  {
    "id": 2,
    "title": "Câu 2: Nhận diện dữ liệu định lượng",
    "pts": 20,
    "question": "Dữ liệu nào sau đây là **dữ liệu định lượng**?",
    "options": [
      {
        "text": "Nhiệt độ trung bình các ngày trong tuần (°C)",
        "correct": true
      },
      {
        "text": "Tên các thành phố trực thuộc Trung ương của Việt Nam",
        "correct": false
      },
      {
        "text": "Màu sắc của các xe máy trong bãi gửi xe",
        "correct": false
      },
      {
        "text": "Các nhóm máu của con người (A, B, AB, O)",
        "correct": false
      }
    ],
    "explanation": "Nhiệt độ là số liệu đo được bằng nhiệt kế (°C), có thể tính toán số trung bình nên là dữ liệu định lượng."
  },
  {
    "id": 3,
    "title": "Câu 3: Phương pháp thu thập trực tiếp",
    "pts": 20,
    "question": "Phương pháp nào sau đây là phương pháp thu thập dữ liệu **trực tiếp**?",
    "options": [
      {
        "text": "Phỏng vấn và phát phiếu khảo sát cho từng học sinh",
        "correct": true
      },
      {
        "text": "Tra cứu số liệu dân số trên website Tổng cục Thống kê",
        "correct": false
      },
      {
        "text": "Đọc số liệu về GDP các nước trong Niên giám thống kê",
        "correct": false
      },
      {
        "text": "Tìm kiếm bảng điểm chuẩn năm ngoái trên báo điện tử",
        "correct": false
      }
    ],
    "explanation": "Phỏng vấn và phát phiếu khảo sát trực tiếp là người điều tra tự mình thu thập dữ liệu thực tế tại chỗ."
  },
  {
    "id": 4,
    "title": "Câu 4: Tính đại diện của mẫu khảo sát",
    "pts": 20,
    "question": "Để khảo sát thời gian sử dụng internet trung bình mỗi ngày của học sinh khối 7, cách chọn mẫu nào sau đây có **tính đại diện cao nhất**?",
    "options": [
      {
        "text": "Chọn ngẫu nhiên 10 học sinh từ mỗi lớp của toàn khối 7",
        "correct": true
      },
      {
        "text": "Chỉ khảo sát các bạn học sinh trong câu lạc bộ Tin học",
        "correct": false
      },
      {
        "text": "Chỉ khảo sát các bạn học sinh ngồi ở bàn đầu mỗi lớp",
        "correct": false
      },
      {
        "text": "Chỉ hỏi 5 bạn thân nhất của bạn lớp trưởng",
        "correct": false
      }
    ],
    "explanation": "Chọn ngẫu nhiên từ mọi lớp trong khối đảm bảo tính khách quan và đại diện công bằng cho toàn thể học sinh khối 7."
  },
  {
    "id": 5,
    "title": "Câu 5: Phát hiện dữ liệu không hợp lí",
    "pts": 20,
    "question": "Trong danh sách số đo chiều cao (cm) của 5 học sinh lớp 7: $148, 152, 280, 150, 155$. Giá trị nào rõ ràng là **không hợp lí**?",
    "options": [
      {
        "text": "$280$",
        "correct": true
      },
      {
        "text": "$148$",
        "correct": false
      },
      {
        "text": "$152$",
        "correct": false
      },
      {
        "text": "$155$",
        "correct": false
      }
    ],
    "explanation": "Chiều cao $280\\\\text{ cm}$ ($2.8\\\\text{ m}$) là con số bất thường, không thể có đối với học sinh lớp 7 (kỉ lục thế giới người cao nhất cũng chỉ khoảng $2.51\\\\text{ m}$)."
  },
  {
    "id": 6,
    "title": "Câu 6: Kiểm tra tổng phần trăm",
    "pts": 20,
    "question": "Một bảng thống kê phương tiện đến trường của học sinh gồm: Đi bộ ($25\\%$), Xe đạp ($40\\%$), Xe buýt ($20\\%$), Xe máy phụ huynh chở ($25\\%$). Bảng dữ liệu này có hợp lí không?",
    "options": [
      {
        "text": "Không hợp lí vì tổng các tỉ lệ là $110\\% > 100\\%$",
        "correct": true
      },
      {
        "text": "Hợp lí vì các tỉ lệ đều là số dương",
        "correct": false
      },
      {
        "text": "Hợp lí vì đi xe đạp chiếm nhiều nhất",
        "correct": false
      },
      {
        "text": "Không hợp lí vì không có ai đi tàu hỏa",
        "correct": false
      }
    ],
    "explanation": "Tổng tỉ lệ phần trăm của các phương tiện phải đúng bằng $100\\%$. Ở đây: $25 + 40 + 20 + 25 = 110\\% \\\\neq 100\\%$, do đó dữ liệu không hợp lí."
  },
  {
    "id": 7,
    "title": "Câu 7: Dữ liệu số nhưng là định tính",
    "pts": 20,
    "question": "Trường hợp nào sau đây là dữ liệu biểu thị bằng số nhưng **không phải** là dữ liệu định lượng?",
    "options": [
      {
        "text": "Số áo thi đấu của các cầu thủ trên sân bóng",
        "correct": true
      },
      {
        "text": "Số bàn thắng cầu thủ ghi được",
        "correct": false
      },
      {
        "text": "Vận tốc chạy tối đa của cầu thủ (km/h)",
        "correct": false
      },
      {
        "text": "Thời gian thi đấu trên sân (phút)",
        "correct": false
      }
    ],
    "explanation": "Số áo thi đấu (ví dụ số 7, số 10) chỉ đóng vai trò nhãn nhận diện cầu thủ (dữ liệu định tính), không thể đem số áo cộng lại để lấy trung bình."
  },
  {
    "id": 8,
    "title": "Câu 8: Thu thập gián tiếp",
    "pts": 20,
    "question": "Thu thập dữ liệu gián tiếp có ưu điểm nổi bật nào so với thu thập trực tiếp?",
    "options": [
      {
        "text": "Tiết kiệm thời gian, chi phí khi cần số liệu quy mô lớn",
        "correct": true
      },
      {
        "text": "Luôn luôn chính xác $100\\%$ không cần kiểm chứng",
        "correct": false
      },
      {
        "text": "Không cần biết nguồn gốc dữ liệu từ đâu",
        "correct": false
      },
      {
        "text": "Có thể tự bịa số liệu theo ý muốn",
        "correct": false
      }
    ],
    "explanation": "Dữ liệu gián tiếp đã được các cơ quan chuyên môn điều tra trước đó, giúp tiết kiệm công sức khảo sát quy mô quốc gia/toàn cầu."
  },
  {
    "id": 9,
    "title": "Câu 9: Bảng dữ liệu theo nhóm",
    "pts": 20,
    "question": "Cho bảng số lượng cây trồng của 4 tổ học sinh: Tổ 1: 15 cây, Tổ 2: 18 cây, Tổ 3: 12 cây, Tổ 4: 15 cây. Số lượng cây trồng ở đây là:",
    "options": [
      {
        "text": "Dữ liệu định lượng (số đếm)",
        "correct": true
      },
      {
        "text": "Dữ liệu định tính",
        "correct": false
      },
      {
        "text": "Dữ liệu không đại diện",
        "correct": false
      },
      {
        "text": "Dữ liệu không hợp lí",
        "correct": false
      }
    ],
    "explanation": "Số cây trồng là số đếm cụ thể, có thể cộng tổng và tính số trung bình của mỗi tổ, do đó là dữ liệu định lượng."
  },
  {
    "id": 10,
    "title": "Câu 10: Xử lí dữ liệu sai sót",
    "pts": 20,
    "question": "Khi phát hiện một giá trị bị ghi nhầm trong bảng điều tra (ví dụ tuổi học sinh ghi là 130 tuổi), người thống kê nên làm gì?",
    "options": [
      {
        "text": "Kiểm tra lại phiếu gốc hoặc liên hệ phỏng vấn lại đối tượng để đính chính",
        "correct": true
      },
      {
        "text": "Cứ để nguyên như vậy để phân tích",
        "correct": false
      },
      {
        "text": "Tự ý xóa luôn toàn bộ cột dữ liệu đó",
        "correct": false
      },
      {
        "text": "Thay thế bằng số 0 ngay lập tức",
        "correct": false
      }
    ],
    "explanation": "Quy trình xử lí dữ liệu khoa học là phải kiểm tra lại nguồn gốc (phiếu khảo sát gốc) hoặc tái xác nhận để ghi nhận con số chính xác (ví dụ viết nhầm 13 thành 130)."
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
    
                const canvas = document.getElementById('labCanvas1');
                const ctx = canvas.getContext('2d');
                let selected = null;

                function drawClassifier() {
                    const w = canvas.width / window.devicePixelRatio;
                    const h = canvas.height / window.devicePixelRatio;
                    ctx.clearRect(0, 0, w, h);

                    const boxW = w * 0.42;
                    const boxH = h * 0.72;
                    const y = 30;

                    // Gio 1: Dinh tinh
                    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
                    ctx.fillRect(w * 0.05, y, boxW, boxH);
                    ctx.strokeStyle = '#06b6d4'; ctx.lineWidth = 2;
                    ctx.strokeRect(w * 0.05, y, boxW, boxH);
                    ctx.fillStyle = '#06b6d4'; ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('GIỎ: DỮ LIỆU ĐỊNH TÍNH', w * 0.08, y + 30);
                    ctx.fillStyle = '#ffffff'; ctx.font = '13px Segoe UI';
                    ctx.fillText('• Chữ, tên gọi, phẩm chất', w * 0.08, y + 60);
                    ctx.fillText('• Màu sắc, giới tính, sở thích', w * 0.08, y + 85);
                    ctx.fillText('• Không tính toán cộng trừ được', w * 0.08, y + 110);

                    // Gio 2: Dinh luong
                    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
                    ctx.fillRect(w * 0.53, y, boxW, boxH);
                    ctx.strokeStyle = '#10b981';
                    ctx.strokeRect(w * 0.53, y, boxW, boxH);
                    ctx.fillStyle = '#10b981'; ctx.font = 'bold 15px Segoe UI';
                    ctx.fillText('GIỎ: DỮ LIỆU ĐỊNH LƯỢNG', w * 0.56, y + 30);
                    ctx.fillStyle = '#ffffff'; ctx.font = '13px Segoe UI';
                    ctx.fillText('• Số liệu, số đo, số đếm', w * 0.56, y + 60);
                    ctx.fillText('• Cân nặng, nhiệt độ, điểm số', w * 0.56, y + 85);
                    ctx.fillText('• Tính được trung bình cộng', w * 0.56, y + 110);
                }

                function resizeCanvas() {
                    const rect = canvas.getBoundingClientRect();
                    canvas.width = rect.width * window.devicePixelRatio || 600;
                    canvas.height = 200 * window.devicePixelRatio || 200;
                    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawClassifier();
                }

                const out = document.getElementById('lab1ClassOut');
                document.getElementById('btnItem1').addEventListener('click', () => {
                    out.innerHTML = `<span style="color:#10b981;">✓ 'Chiều cao (cm)': <strong>Dữ liệu định lượng</strong> (số đo thực tế có đơn vị đo cm, tính được trung bình).</span>`;
                });
                document.getElementById('btnItem2').addEventListener('click', () => {
                    out.innerHTML = `<span style="color:#06b6d4;">✓ 'Màu mắt (đen/nâu)': <strong>Dữ liệu định tính</strong> (chữ mô tả đặc điểm, không phải số đo).</span>`;
                });
                document.getElementById('btnItem3').addEventListener('click', () => {
                    out.innerHTML = `<span style="color:#10b981;">✓ 'Điểm thi Toán (0-10)': <strong>Dữ liệu định lượng</strong> (số điểm dùng để tính toán xếp loại).</span>`;
                });
                document.getElementById('btnItem4').addEventListener('click', () => {
                    out.innerHTML = `<span style="color:#06b6d4;">✓ 'Môn thể thao mê thích': <strong>Dữ liệu định tính</strong> (tên môn thể thao bóng đá, cầu lông...).</span>`;
                });

                window.addEventListener('resize', resizeCanvas);
                setTimeout(resizeCanvas, 100);
            
  } catch(e) { console.error('Lỗi khởi tạo Lab 1:', e); }

  try {
    
                const canvas2 = document.getElementById('labCanvas2');
                const ctx2 = canvas2.getContext('2d');
                let sampleSize = 150;
                const totalPop = 1000;

                function drawSample() {
                    const w = canvas2.width / window.devicePixelRatio;
                    const h = canvas2.height / window.devicePixelRatio;
                    ctx2.clearRect(0, 0, w, h);

                    const ratio = sampleSize / totalPop;
                    const barW = w * 0.75;
                    const barX = (w - barW) / 2;
                    const barY = h * 0.45;

                    // Thanh toan the (1000 hs)
                    ctx2.fillStyle = 'rgba(255, 255, 255, 0.1)';
                    ctx2.fillRect(barX, barY, barW, 30);
                    ctx2.strokeStyle = '#ffffff'; ctx2.lineWidth = 1;
                    ctx2.strokeRect(barX, barY, barW, 30);

                    // Thanh mau khao sat
                    let col = '#ef4444';
                    let repText = 'Chưa đại diện (Mẫu quá nhỏ < 5%)';
                    if (ratio >= 0.1 && ratio < 0.25) { col = '#f59e0b'; repText = 'Độ tin cậy vừa phải (10% - 25%)'; }
                    else if (ratio >= 0.25) { col = '#10b981'; repText = 'Tính đại diện rất cao (≥ 25%)'; }

                    ctx2.fillStyle = col;
                    ctx2.fillRect(barX, barY, barW * ratio, 30);

                    ctx2.fillStyle = '#ffffff'; ctx2.font = 'bold 13px Segoe UI';
                    ctx2.fillText(`Toàn thể trường: ${totalPop} học sinh`, barX, barY - 12);
                    ctx2.fillText(`Mẫu: ${sampleSize} học sinh (${Math.round(ratio * 100)}%)`, barX + 10, barY + 20);

                    const out = document.getElementById('lab2SampOut');
                    out.innerHTML = `Mẫu khảo sát: $n = ${sampleSize}$ trên tổng số $N = ${totalPop}$ học sinh. Đạt tỉ lệ $\\frac{${sampleSize}}{1000} = ${(ratio * 100).toFixed(1)}\\%$. Đánh giá: <strong><span style="color:${col};">${repText}</span></strong>.`;
                    renderMathInTree(out);
                }

                function resizeCanvas2() {
                    const rect = canvas2.getBoundingClientRect();
                    canvas2.width = rect.width * window.devicePixelRatio || 600;
                    canvas2.height = 180 * window.devicePixelRatio || 180;
                    ctx2.scale(window.devicePixelRatio, window.devicePixelRatio);
                    drawSample();
                }

                document.getElementById('sliderSamp').addEventListener('input', e => {
                    sampleSize = parseInt(e.target.value);
                    document.getElementById('valSamp').textContent = `${sampleSize} học sinh`;
                    drawSample();
                });

                window.addEventListener('resize', resizeCanvas2);
                setTimeout(resizeCanvas2, 100);
            
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
