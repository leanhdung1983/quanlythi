/**
 * BÀI 14: PHÉP CHIẾU SONG SONG - TOÁN 11 KẾT NỐI TRI THỨC
 * Pure Vanilla JavaScript ES6+ - Offline Ready - KaTeX & Web Audio API
 */

// ==========================================
// 1. ÂM THANH TỰ TỔNG HỢP (WEB AUDIO API)
// ==========================================
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

function playTone(freq, type = 'sine', duration = 0.15, gainVal = 0.1) {
  if (!appState.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    gain.gain.setValueAtTime(gainVal, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    console.warn('Audio play error:', e);
  }
}

function playCorrect() {
  if (!appState.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'triangle';
    osc2.type = 'sine';

    osc1.frequency.setValueAtTime(523.25, now);       // C5
    osc1.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc2.frequency.setValueAtTime(783.99, now + 0.2); // G5
    osc2.frequency.setValueAtTime(1046.50, now + 0.3);// C6

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc1.stop(now + 0.2);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.45);
  } catch (e) {}
}

function playWrong() {
  if (!appState.sound) return;
  try {
    const ctx = getAudioContext();
    if (!ctx) return;
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(140, now + 0.25);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.25);
  } catch (e) {}
}

function playLevelUp() {
  if (!appState.sound) return;
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
  notes.forEach((freq, i) => {
    setTimeout(() => playTone(freq, 'triangle', 0.18, 0.15), i * 90);
  });
}

function playFanfare() {
  if (!appState.sound) return;
  const melody = [
    { f: 523.25, d: 0.15 },
    { f: 523.25, d: 0.15 },
    { f: 523.25, d: 0.15 },
    { f: 659.25, d: 0.4 },
    { f: 783.99, d: 0.25 },
    { f: 1046.50, d: 0.6 }
  ];
  let delay = 0;
  melody.forEach(note => {
    setTimeout(() => playTone(note.f, 'triangle', note.d, 0.18), delay);
    delay += note.d * 900;
  });
}

// ==========================================
// 2. STATE HỆ THỐNG & AVATAR
// ==========================================
const AVATARS = [
  { id: 'logic', icon: '👑', name: 'Chiến Binh Logic', title: 'Đại Hiệp Không Gian' },
  { id: 'sun', icon: '☀️', name: 'Thần Ánh Sáng', title: 'Bậc Thầy Chiếu Song Song' },
  { id: 'pharaoh', icon: '📐', name: 'Nhà Hình Học', title: 'Kiến Trúc Sư Cổ Đại' },
  { id: 'scout', icon: '🦅', name: 'Mắt Đại Bàng', title: 'Chiến Lược Gia Không Gian' },
  { id: 'cyber', icon: '⚡', name: 'Kỹ Sư Cyber', title: 'Chuyên Gia Goal-line 3D' },
  { id: 'alchemist', icon: '🧪', name: 'Thuật Sĩ Elip', title: 'Phù Thủy Hình Biểu Diễn' },
  { id: 'astro', icon: '🚀', name: 'Phi Hành Gia', title: 'Thám Hiểm Vũ Trụ 3D' },
  { id: 'owl', icon: '🦉', name: 'Cú Trí Tuệ', title: 'Hiền Triết Hình Không Gian' }
];

const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Bậc Thầy Chiếu Song Song',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// ==========================================
// 3. DỮ LIỆU ĐẤU TRƯỜNG SGK (10 CÂU TRẮC NGHIỆM)
// ==========================================
const quizData = [
  {
    id: 1,
    title: 'Câu 1: Khái niệm Phép Chiếu Song Song',
    pts: 20,
    question: 'Cho đường thẳng $\\Delta$ cắt mặt phẳng $(\\alpha)$. Với mỗi điểm $M$ trong không gian, đường thẳng qua $M$ song song với $\\Delta$ cắt $(\\alpha)$ tại $M\'$. Điểm $M\'$ được gọi là:',
    options: [
      { text: 'Hình chiếu vuông góc của điểm $M$ lên mặt phẳng $(\\alpha)$.', correct: false },
      { text: 'Hình chiếu song song của điểm $M$ lên $(\\alpha)$ theo phương $\\Delta$.', correct: true },
      { text: 'Trung điểm của đoạn thẳng nối $M$ và mặt phẳng $(\\alpha)$.', correct: false },
      { text: 'Giao điểm của đường thẳng $\\Delta$ và mặt phẳng $(\\alpha)$.', correct: false }
    ],
    explanation: 'Theo định nghĩa SGK Toán 11: Cho mặt phẳng $(\\alpha)$ và đường thẳng $\\Delta$ cắt $(\\alpha)$. Phép đặt tương ứng mỗi điểm $M$ với hình chiếu $M\'$ của nó lên $(\\alpha)$ theo phương $\\Delta$ gọi là phép chiếu song song lên $(\\alpha)$ theo phương $\\Delta$. Điểm $M\'$ gọi là hình chiếu song song của $M$.'
  },
  {
    id: 2,
    title: 'Câu 2: Tính chất bảo toàn thứ tự điểm',
    pts: 20,
    question: 'Phép chiếu song song biến ba điểm thẳng hàng thành:',
    options: [
      { text: 'Ba điểm tạo thành một tam giác cân trên mặt phẳng chiếu.', correct: false },
      { text: 'Ba điểm thẳng hàng và không làm thay đổi thứ tự giữa chúng.', correct: true },
      { text: 'Ba điểm thẳng hàng nhưng có thể làm đảo lộn thứ tự vị trí.', correct: false },
      { text: 'Ba đỉnh của một tam giác đều tùy theo góc chiếu $\\Delta$.', correct: false }
    ],
    explanation: 'Tính chất vàng của phép chiếu song song: Phép chiếu song song biến 3 điểm thẳng hàng thành 3 điểm thẳng hàng và KHÔNG làm thay đổi thứ tự giữa các điểm đó.'
  },
  {
    id: 3,
    title: 'Câu 3: Quan hệ giữa hai đường song song',
    pts: 20,
    question: 'Cho hai đường thẳng $a$ và $b$ song song trong không gian. Phép chiếu song song theo phương $\\Delta$ (không song song với $a$ và $b$) biến $a, b$ thành hai đường thẳng $a\', b\'$ có quan hệ:',
    options: [
      { text: '$a\'$ và $b\'$ luôn vuông góc với nhau trên mặt phẳng chiếu.', correct: false },
      { text: '$a\'$ và $b\'$ luôn là hai đường thẳng chéo nhau.', correct: false },
      { text: '$a\'$ và $b\'$ song song hoặc trùng nhau.', correct: true },
      { text: '$a\'$ và $b\'$ luôn cắt nhau tại một điểm duy nhất.', correct: false }
    ],
    explanation: 'Tính chất SGK: Phép chiếu song song biến hai đường thẳng song song thành hai đường thẳng song song hoặc trùng nhau (trường hợp trùng nhau xảy ra khi mặt phẳng chứa $a$ và $b$ song song với phương chiếu $\\Delta$).'
  },
  {
    id: 4,
    title: 'Câu 4: Hình biểu diễn của Hình Vuông (Bài 4.29d SGK)',
    pts: 20,
    question: 'Hình biểu diễn của một hình vuông trên mặt phẳng vẽ (với phương chiếu không song song với mặt phẳng chứa hình vuông) là:',
    options: [
      { text: 'Hình vuông hoàn hảo.', correct: false },
      { text: 'Hình chữ nhật.', correct: false },
      { text: 'Hình bình hành.', correct: true },
      { text: 'Hình thang vuông.', correct: false }
    ],
    explanation: 'Phép chiếu song song bảo toàn tính song song và tỉ số độ dài của các đoạn thẳng song song. Hai cặp cạnh đối của hình vuông song song và bằng nhau, do đó hình biểu diễn của chúng cũng song song và bằng nhau, tạo thành hình bình hành. Góc vuông nói chung không được bảo toàn.'
  },
  {
    id: 5,
    title: 'Câu 5: Hình biểu diễn của Đường Tròn',
    pts: 20,
    question: 'Hình biểu diễn trong không gian của một đường tròn (trên mặt phẳng không song song với phương chiếu) là:',
    options: [
      { text: 'Một đoạn thẳng hoặc một hình elip.', correct: true },
      { text: 'Một đường parabol cong.', correct: false },
      { text: 'Một hình thoi bốn cạnh bằng nhau.', correct: false },
      { text: 'Một đường tròn có bán kính gấp đôi.', correct: false }
    ],
    explanation: 'Hình biểu diễn của đường tròn thường là một hình elip (hoặc là một đoạn thẳng nếu mặt phẳng chứa đường tròn song song với phương chiếu $\\Delta$). Đây là lý do khi vẽ hình trụ, nón ta vẽ đáy tròn thành hình elip.'
  },
  {
    id: 6,
    title: 'Câu 6: Bảo toàn Trọng Tâm Tam Giác (Bài 4.31 SGK)',
    pts: 20,
    question: 'Cho $\\triangle ABC$ có trọng tâm $G$, trung điểm $M$ của $BC$. Gọi $A\', B\', C\', M\', G\'$ là hình chiếu song song lên $(\\alpha)$. Khẳng định nào sau đây SAI?',
    options: [
      { text: '$M\'$ là trung điểm của đoạn thẳng $B\'C\'$.', correct: false },
      { text: '$G\'$ là trọng tâm của tam giác $A\'B\'C\'$.', correct: false },
      { text: '$\\frac{A\'G\'}{A\'M\'} = \\frac{2}{3}$.', correct: false },
      { text: 'Diện tích tam giác $A\'B\'C\'$ luôn bằng diện tích tam giác $ABC$.', correct: true }
    ],
    explanation: 'Khẳng định SAI là: "Diện tích tam giác $A\'B\'C\'$ luôn bằng diện tích tam giác $ABC$". Phép chiếu song song bảo toàn tỉ số độ dài trên cùng đường thẳng (nên $M\'$ là trung điểm, $G\'$ là trọng tâm, tỉ số $\\frac{2}{3}$ giữ nguyên), nhưng diện tích thay đổi phụ thuộc vào góc nghiêng của phương chiếu.'
  },
  {
    id: 7,
    title: 'Câu 7: Quy tắc vẽ hình biểu diễn Tam Giác Đều',
    pts: 20,
    question: 'Khi vẽ hình biểu diễn của một tam giác đều trong không gian lên vở, quy tắc chuẩn của SGK là:',
    options: [
      { text: 'Bắt buộc phải vẽ đúng tam giác đều với 3 cạnh bằng nhau và góc $60^\\circ$.', correct: false },
      { text: 'Vẽ thành một tam giác bất kì (có thể là nhọn, vuông hoặc tù).', correct: true },
      { text: 'Bắt buộc phải vẽ thành một tam giác vuông cân.', correct: false },
      { text: 'Chỉ được phép vẽ thành một tam giác có một góc tù lớn hơn $120^\\circ$.', correct: false }
    ],
    explanation: 'Trong không gian, độ lớn của góc và độ dài các cạnh không được bảo toàn. Do đó hình biểu diễn của một tam giác (dù là đều, cân hay vuông) nói chung được vẽ bằng một tam giác bất kì.'
  },
  {
    id: 8,
    title: 'Câu 8: Hình biểu diễn Hình Thang Đáy Gấp 3 Lần (Bài 4.33 SGK)',
    pts: 20,
    question: 'Một hình thang $ABCD$ có hai đáy $AB \\parallel CD$ và $CD = 3 AB$. Gọi $A\'B\'C\'D\'$ là hình biểu diễn của nó qua phép chiếu song song. Tỉ số $\\frac{C\'D\'}{A\'B\'}$ bằng:',
    options: [
      { text: '$1$', correct: false },
      { text: '$2$', correct: false },
      { text: '$3$', correct: true },
      { text: 'Phụ thuộc vào góc nghiêng của phương chiếu $\\Delta$.', correct: false }
    ],
    explanation: 'Vì $AB \\parallel CD$ nên qua phép chiếu song song, $A\'B\' \\parallel C\'D\'$ và tỉ số giữa hai đoạn thẳng song song được bảo toàn: $\\frac{C\'D\'}{A\'B\'} = \\frac{CD}{AB} = 3$.'
  },
  {
    id: 9,
    title: 'Câu 9: Hiện tượng Bóng Đổ Bậc Thang (Bài 4.34 SGK)',
    pts: 20,
    question: 'Các mép bậc cầu thang song song trong nhà khi được chiếu bởi các tia nắng mặt trời song song thì bóng của các mép bậc trên sàn nhà có quan hệ vị trí như thế nào?',
    options: [
      { text: 'Chúng cắt nhau tại một điểm tụ tiêu cự.', correct: false },
      { text: 'Chúng song song với nhau.', correct: true },
      { text: 'Chúng vuông góc với nhau từng đôi một.', correct: false },
      { text: 'Chúng uốn lượn thành các đường parabol cong.', correct: false }
    ],
    explanation: 'Tia nắng mặt trời chiếu song song tạo nên phép chiếu song song. Các mép bậc thang song song trong không gian qua phép chiếu song song sẽ cho các bóng mép bậc thang song song với nhau trên mặt sàn.'
  },
  {
    id: 10,
    title: 'Câu 10: Ứng dụng Công Nghệ Goal-line Bóng Đá',
    pts: 20,
    question: 'Công nghệ Goal-line xác định bàn thắng bằng phép chiếu song song thẳng đứng của quả bóng xuống mặt sân. Trọng tài sẽ công nhận bàn thắng khi nào?',
    options: [
      { text: 'Khi tâm của quả bóng vượt qua vạch vôi.', correct: false },
      { text: 'Khi hơn $50\\%$ thể tích quả bóng vượt qua vạch vôi.', correct: false },
      { text: 'Khi toàn bộ hình chiếu của quả bóng đã vượt qua hoàn toàn mép sau vạch vôi.', correct: true },
      { text: 'Khi bóng chạm nhẹ vào mép ngoài của vạch vôi.', correct: false }
    ],
    explanation: 'Theo Luật Bóng Đá FIFA: Bàn thắng chỉ được công nhận khi toàn bộ quả bóng đã vượt qua hoàn toàn vạch vôi. Dưới góc nhìn phép chiếu thẳng đứng (chiếu song song vuông góc xuống mặt sân), toàn bộ hình chiếu của quả bóng phải nằm trọn vẹn phía sau mép sau của vạch vôi.'
  }
];

// ==========================================
// 4. PARSER TOÁN HỌC (KATEX & MATHML CORE DỰ PHÒNG)
// ==========================================
function renderMathInTree(root) {
  if (window.renderMathInElement) {
    try {
      window.renderMathInElement(root, {
        delimiters: [
          { left: "$$", right: "$$", display: true },
          { left: "$", right: "$", display: false }
        ],
        throwOnError: false,
        strict: false
      });
      return;
    } catch (e) {
      console.warn("KaTeX render error, using MathML fallback:", e);
    }
  }

  // MathML Tokenizer Fallback nếu không có KaTeX
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false);
  const textNodes = [];
  let node;
  while ((node = walker.nextNode())) {
    if (node.nodeValue && node.nodeValue.includes('$')) {
      textNodes.push(node);
    }
  }

  textNodes.forEach(tNode => {
    const parent = tNode.parentNode;
    if (!parent) return;
    const tag = parent.nodeName.toLowerCase();
    if (['script', 'style', 'textarea', 'math'].includes(tag)) return;

    const text = tNode.nodeValue;
    if (!text.includes('$')) return;

    const span = document.createElement('span');
    span.innerHTML = formatMathText(text);
    parent.replaceChild(span, tNode);
  });
}

function formatMathText(raw) {
  if (!raw) return '';
  return raw
    .replace(/\$\$([\s\S]+?)\$\$/g, (m, c) => `<div class="math-block">${latexToMathML(c, true)}</div>`)
    .replace(/\$([^\$\n]+?)\$/g, (m, c) => `<span class="math-inline">${latexToMathML(c, false)}</span>`);
}

function latexToMathML(latex, isBlock = false) {
  let s = latex.trim();
  s = s.replace(/\\overrightarrow\{([^}]+)\}/g, '<mover accent="true"><mrow>$1</mrow><mo>→</mo></mover>');
  s = s.replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '<mfrac><mrow>$1</mrow><mrow>$2</mrow></mfrac>');
  s = s.replace(/\\parallel/g, '<mo>∥</mo>');
  s = s.replace(/\\Delta/g, '<mi>Δ</mi>');
  s = s.replace(/\\alpha/g, '<mi>α</mi>');
  s = s.replace(/\\beta/g, '<mi>β</mi>');
  s = s.replace(/\\implies/g, '<mo>⟹</mo>');
  s = s.replace(/\\to/g, '<mo>→</mo>');
  s = s.replace(/\\circ/g, '<mo>°</mo>');
  s = s.replace(/([A-Za-z]+)'/g, '<msup><mi>$1</mi><mo>′</mo></msup>');
  s = s.replace(/([A-Z][A-Za-z0-9]*)/g, '<mi>$1</mi>');
  s = s.replace(/(\d+)/g, '<mn>$1</mn>');
  return `<math xmlns="http://www.w3.org/1998/Math/MathML" ${isBlock ? 'display="block"' : ''}>${s}</math>`;
}

// ==========================================
// 5. HUD, AVATAR & TIẾN TRÌNH
// ==========================================
function updateHUD() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starEl = document.getElementById('starRating');
  const userTitleEl = document.getElementById('userTitle');
  const userNameEl = document.getElementById('userNameDisplay');
  const avatarBtn = document.getElementById('avatarBtn');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (userTitleEl) userTitleEl.textContent = appState.userTitle;
  if (userNameEl) userNameEl.textContent = `${appState.userName} 🌟`;
  if (avatarBtn) avatarBtn.textContent = appState.avatar;

  if (starEl) {
    let starsStr = '';
    for (let i = 1; i <= 5; i++) {
      starsStr += i <= appState.stars ? '⭐' : '☆';
    }
    starEl.textContent = starsStr;
  }

  // Cập nhật huy hiệu
  for (let i = 1; i <= 5; i++) {
    const badgeEl = document.getElementById(`badge-${i}`);
    if (badgeEl) {
      if (appState.badges[i - 1]) {
        badgeEl.classList.add('unlocked');
      } else {
        badgeEl.classList.remove('unlocked');
      }
    }
  }

  // Cập nhật chứng nhận
  const certName = document.getElementById('certStudentName');
  const certDate = document.getElementById('certDate');
  if (certName) certName.textContent = appState.userName;
  if (certDate) {
    const now = new Date();
    certDate.textContent = `Đà Nẵng, ngày ${now.getDate()} tháng ${now.getMonth() + 1} năm ${now.getFullYear()}`;
  }
}

function initAvatarModal() {
  const avatarBtn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const closeModalBtn = document.getElementById('closeAvatarModal');
  const grid = document.getElementById('avatarGrid');

  if (!avatarBtn || !modal) return;

  // Render avatars
  if (grid) {
    grid.innerHTML = '';
    AVATARS.forEach(av => {
      const card = document.createElement('div');
      card.className = `avatar-card ${appState.avatar === av.icon ? 'active' : ''}`;
      card.innerHTML = `
        <div class="av-icon">${av.icon}</div>
        <div class="av-name">${av.name}</div>
        <div class="av-role">${av.title}</div>
      `;
      card.addEventListener('click', () => {
        appState.avatar = av.icon;
        appState.userName = av.name;
        appState.userTitle = av.title;
        playTone(600, 'sine', 0.1);
        modal.classList.remove('active');
        modal.style.display = 'none';
        updateHUD();
      });
      grid.appendChild(card);
    });
  }

  avatarBtn.addEventListener('click', () => {
    playTone(500, 'sine', 0.08);
    modal.style.display = 'flex';
    modal.classList.add('active');
  });

  if (closeModalBtn) {
    closeModalBtn.addEventListener('click', () => {
      modal.classList.remove('active');
      modal.style.display = 'none';
    });
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('active');
      modal.style.display = 'none';
    }
  });
}

function initHUDControls() {
  const soundBtn = document.getElementById('soundToggle');
  const resetBtn = document.getElementById('resetProgress');
  const printBtn = document.getElementById('btnPrintCert');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      appState.sound = !appState.sound;
      soundBtn.textContent = appState.sound ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      if (appState.sound) playTone(587.33, 'sine', 0.1);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình học tập?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.stars = 2;
        appState.answered = {};
        appState.badges = [true, false, false, false, false];
        updateHUD();
        renderQuiz();
        playTone(330, 'triangle', 0.2);
      }
    });
  }

  if (printBtn) {
    printBtn.addEventListener('click', () => {
      window.print();
    });
  }
}

// ==========================================
// 6. CHUYỂN TAB NAVIGATION
// ==========================================
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const targetId = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${targetId}`);
      if (targetContent) {
        targetContent.classList.add('active');
      }

      playTone(480, 'sine', 0.08);

      // Kích hoạt huy hiệu khám phá nếu vào Lab hoặc Arena
      if (targetId === 'labs') {
        appState.badges[1] = true; // Mở huy hiệu 2
        updateHUD();
      }
    });
  });
}

// ==========================================
// 7. RENDER QUIZ ĐẤU TRƯỜNG SGK
// ==========================================
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  const progressEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  if (!container) return;

  container.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];
  const total = quizData.length;
  let answeredCount = 0;
  let correctCount = 0;

  quizData.forEach((q, qIndex) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';

    const header = document.createElement('div');
    header.className = 'quiz-card-header';
    header.innerHTML = `
      <span>${q.title}</span>
      <span class="quiz-badge">+${q.pts} XP</span>
    `;
    card.appendChild(header);

    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question; // Chèn raw LaTeX
    card.appendChild(questionP);

    const optGrid = document.createElement('div');
    optGrid.className = 'quiz-options';

    const explanation = document.createElement('div');
    explanation.className = 'explanation-box';
    explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;

    const isAnswered = appState.answered[q.id] !== undefined;
    if (isAnswered) answeredCount++;

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;

      if (isAnswered) {
        btn.disabled = true;
        const chosen = appState.answered[q.id];
        if (opt.correct) {
          btn.classList.add('correct');
        } else if (chosen === optIndex) {
          btn.classList.add('wrong');
        }
      } else {
        btn.addEventListener('click', () => {
          if (appState.answered[q.id] !== undefined) return;
          appState.answered[q.id] = optIndex;

          const allBtns = optGrid.querySelectorAll('.quiz-opt-btn');
          allBtns.forEach(b => b.disabled = true);

          if (opt.correct) {
            btn.classList.add('correct');
            appState.xp += q.pts;
            appState.streak += 1;
            playCorrect();
          } else {
            btn.classList.add('wrong');
            appState.streak = 0;
            playWrong();
            // Đánh dấu đáp án đúng
            q.options.forEach((o, idx) => {
              if (o.correct) allBtns[idx].classList.add('correct');
            });
          }

          explanation.classList.add('show');
          renderMathInTree(explanation);

          // Cập nhật sao và huy hiệu
          checkProgressAndBadges();
          updateHUD();
          updateArenaStats();
        });
      }

      optGrid.appendChild(btn);
    });

    card.appendChild(optGrid);

    if (isAnswered) {
      explanation.classList.add('show');
    }
    card.appendChild(explanation);
    container.appendChild(card);
  });

  // Render KaTeX toàn bộ container
  renderMathInTree(container);

  updateArenaStats();
}

function updateArenaStats() {
  const progressEl = document.getElementById('arenaProgress');
  const scoreEl = document.getElementById('arenaScore');
  let answeredCount = 0;
  let correctCount = 0;

  quizData.forEach(q => {
    const ans = appState.answered[q.id];
    if (ans !== undefined) {
      answeredCount++;
      if (q.options[ans].correct) correctCount++;
    }
  });

  if (progressEl) progressEl.textContent = `${answeredCount}/${quizData.length}`;
  if (scoreEl) scoreEl.textContent = `${correctCount * 20} XP`;
}

function checkProgressAndBadges() {
  let correctCount = 0;
  let answeredCount = 0;

  quizData.forEach(q => {
    const ans = appState.answered[q.id];
    if (ans !== undefined) {
      answeredCount++;
      if (q.options[ans].correct) correctCount++;
    }
  });

  // Huy hiệu 3: Trả lời 5 câu bất kì
  if (answeredCount >= 5) {
    appState.badges[2] = true;
  }

  // Huy hiệu 4: Đạt 160 XP (>= 8 câu đúng)
  if (correctCount >= 8) {
    appState.badges[3] = true;
    appState.stars = 4;
  }

  // Huy hiệu 5: Hoàn thành 10/10 câu đúng
  if (correctCount === 10) {
    appState.badges[4] = true;
    appState.stars = 5;
    playFanfare();
  } else if (correctCount >= 5) {
    appState.stars = 3;
  }
}

// ==========================================
// 8. PHÒNG THÍ NGHIỆM 1: BÓNG ĐỔ PHÉP CHIẾU 3D
// ==========================================
let lab1State = {
  shape: 'circle', // 'circle' | 'square'
  sunAngle: 45,
  showRays: true,
  autoRotate: false,
  rotX: 25,
  rotY: -35,
  zoom: 1,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0
};

function initLab1() {
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const btnCircle = document.getElementById('btnShapeCircle');
  const btnSquare = document.getElementById('btnShapeSquare');
  const btnReset = document.getElementById('btnResetRot1');
  const sliderAngle = document.getElementById('sliderSunAngle');
  const valAngle = document.getElementById('valSunAngle');
  const chkRays = document.getElementById('chkShowRays');
  const chkAuto = document.getElementById('chkAutoRot1');
  const badgeStatus = document.getElementById('lab1StatusBadge');
  const descEl = document.getElementById('lab1Desc');

  if (btnCircle) {
    btnCircle.addEventListener('click', () => {
      lab1State.shape = 'circle';
      btnCircle.classList.add('active');
      btnSquare.classList.remove('active');
      if (badgeStatus) badgeStatus.textContent = 'Hình tròn ⟹ Hình elip bóng đổ';
      if (descEl) descEl.innerHTML = 'Tia nắng mặt trời chiếu qua khung tròn nghiêng trong không gian, tạo thành bóng đổ trên mặt sàn. Đường tròn tạo thành một <strong>hình elip</strong> sắc nét trên sàn!';
      playTone(520, 'sine', 0.08);
    });
  }

  if (btnSquare) {
    btnSquare.addEventListener('click', () => {
      lab1State.shape = 'square';
      btnSquare.classList.add('active');
      btnCircle.classList.remove('active');
      if (badgeStatus) badgeStatus.textContent = 'Hình vuông ⟹ Hình bình hành bóng đổ';
      if (descEl) descEl.innerHTML = 'Khung hình vuông có 2 cặp cạnh đối song song và bằng nhau. Dưới phép chiếu song song của tia nắng, bóng đổ trên mặt sàn là một <strong>hình bình hành</strong> hoàn hảo!';
      playTone(550, 'sine', 0.08);
    });
  }

  if (sliderAngle) {
    sliderAngle.addEventListener('input', (e) => {
      lab1State.sunAngle = parseInt(e.target.value);
      if (valAngle) valAngle.textContent = `${lab1State.sunAngle}°`;
    });
  }

  if (chkRays) {
    chkRays.addEventListener('change', (e) => {
      lab1State.showRays = e.target.checked;
    });
  }

  if (chkAuto) {
    chkAuto.addEventListener('change', (e) => {
      lab1State.autoRotate = e.target.checked;
    });
  }

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      lab1State.rotX = 25;
      lab1State.rotY = -35;
      lab1State.zoom = 1;
      playTone(400, 'sine', 0.08);
    });
  }

  // Tương tác chuột xoay 3D
  canvas.addEventListener('mousedown', (e) => {
    lab1State.isDragging = true;
    lab1State.lastMouseX = e.clientX;
    lab1State.lastMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => {
    lab1State.isDragging = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    if (!lab1State.isDragging) return;
    const dx = e.clientX - lab1State.lastMouseX;
    const dy = e.clientY - lab1State.lastMouseY;
    lab1State.rotY += dx * 0.5;
    lab1State.rotX += dy * 0.5;
    lab1State.rotX = Math.max(-70, Math.min(70, lab1State.rotX));
    lab1State.lastMouseX = e.clientX;
    lab1State.lastMouseY = e.clientY;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    lab1State.zoom -= e.deltaY * 0.001;
    lab1State.zoom = Math.max(0.6, Math.min(1.6, lab1State.zoom));
  });

  // Vòng lặp vẽ Lab 1
  function render() {
    if (lab1State.autoRotate) {
      lab1State.rotY += 0.4;
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 30;

    // Phép chiếu 3D sang 2D
    const radX = (lab1State.rotX * Math.PI) / 180;
    const radY = (lab1State.rotY * Math.PI) / 180;
    const cosX = Math.cos(radX), sinX = Math.sin(radX);
    const cosY = Math.cos(radY), sinY = Math.sin(radY);

    function project3D(x, y, z) {
      // Xoay quanh Y
      let x1 = x * cosY + z * sinY;
      let y1 = y;
      let z1 = -x * sinY + z * cosY;

      // Xoay quanh X
      let x2 = x1;
      let y2 = y1 * cosX - z1 * sinX;
      let z2 = y1 * sinX + z1 * cosX;

      const scale = lab1State.zoom;
      return {
        x: cx + x2 * scale,
        y: cy - y2 * scale,
        depth: z2
      };
    }

    // 1. Vẽ mặt sàn phẳng $(\alpha)$ (Mặt phẳng chiếu z = 0, y = 0)
    const floorSize = 220;
    const floorPts = [
      project3D(-floorSize, 0, -floorSize),
      project3D(floorSize, 0, -floorSize),
      project3D(floorSize, 0, floorSize),
      project3D(-floorSize, 0, floorSize)
    ];

    ctx.beginPath();
    ctx.moveTo(floorPts[0].x, floorPts[0].y);
    floorPts.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
    ctx.closePath();
    ctx.fillStyle = 'rgba(30, 41, 59, 0.45)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.5)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Lưới ô vuông sàn
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
    ctx.lineWidth = 1;
    for (let g = -floorSize; g <= floorSize; g += 55) {
      const p1 = project3D(g, 0, -floorSize);
      const p2 = project3D(g, 0, floorSize);
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();

      const p3 = project3D(-floorSize, 0, g);
      const p4 = project3D(floorSize, 0, g);
      ctx.beginPath();
      ctx.moveTo(p3.x, p3.y);
      ctx.lineTo(p4.x, p4.y);
      ctx.stroke();
    }

    // Tọa độ phương chiếu ánh nắng $\Delta$
    // Góc nghiêng nắng sliderAngle (25° -> 75° so với phương ngang)
    const sunRad = (lab1State.sunAngle * Math.PI) / 180;
    // Vectơ phương chiếu d = (dx, -dy, dz) với dy = 1, dx = cot(sunRad), dz = 0.3 * cot(sunRad)
    const cotSun = 1 / Math.tan(sunRad);
    const projVector = { x: cotSun * 1.2, y: -1, z: cotSun * 0.4 };

    // Độ cao của vật thể lơ lửng trong không gian: h = 120
    const h = 110;

    // 2. Định nghĩa hình trong không gian (nghiêng nhẹ để bóng chiếu sống động)
    let shape3DPts = [];
    let shadowPts = [];

    if (lab1State.shape === 'circle') {
      const radius = 60;
      const numSteps = 36;
      for (let i = 0; i < numSteps; i++) {
        const theta = (i / numSteps) * 2 * Math.PI;
        // Điểm trên đường tròn nghiêng
        const px = radius * Math.cos(theta);
        const pz = radius * Math.sin(theta);
        const py = h + pz * 0.35; // nghiêng góc trong không gian

        shape3DPts.push({ x: px, y: py, z: pz });

        // Hình chiếu xuống mặt sàn y = 0 theo phương chiếu d
        // Ray: P + t * projVector. Ta cần py + t * (-1) = 0 => t = py
        const t = py;
        const sx = px + t * projVector.x;
        const sz = pz + t * projVector.z;
        shadowPts.push({ x: sx, y: 0, z: sz });
      }
    } else {
      // Hình vuông cạnh 110 nghiêng trong không gian
      const s = 55;
      const rawCorners = [
        { x: -s, py: h - 15, z: -s },
        { x: s, py: h - 15, z: -s },
        { x: s, py: h + 20, z: s },
        { x: -s, py: h + 20, z: s }
      ];

      rawCorners.forEach(pt => {
        shape3DPts.push({ x: pt.x, y: pt.py, z: pt.z });
        const t = pt.py;
        shadowPts.push({ x: pt.x + t * projVector.x, y: 0, z: pt.z + t * projVector.z });
      });
    }

    // 3. Vẽ bóng đổ trên mặt sàn (Hình elip / Hình bình hành)
    const projShadow = shadowPts.map(pt => project3D(pt.x, pt.y, pt.z));
    ctx.beginPath();
    ctx.moveTo(projShadow[0].x, projShadow[0].y);
    projShadow.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
    ctx.closePath();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.28)';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // 4. Vẽ các tia chiếu song song (Tia nắng vàng đứt nét)
    if (lab1State.showRays) {
      ctx.strokeStyle = 'rgba(253, 224, 71, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      const step = lab1State.shape === 'circle' ? 3 : 1;
      for (let i = 0; i < shape3DPts.length; i += step) {
        const topP = project3D(shape3DPts[i].x, shape3DPts[i].y, shape3DPts[i].z);
        const botP = projShadow[i];
        ctx.beginPath();
        ctx.moveTo(topP.x, topP.y);
        ctx.lineTo(botP.x, botP.y);
        ctx.stroke();
      }
      ctx.setLineDash([]);
    }

    // 5. Vẽ vật thể trong không gian (Hình tròn cyan hoặc Hình vuông neon)
    const projShape = shape3DPts.map(pt => project3D(pt.x, pt.y, pt.z));
    ctx.beginPath();
    ctx.moveTo(projShape[0].x, projShape[0].y);
    projShape.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.35)';
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Nhãn trên Canvas
    ctx.font = 'bold 12px Inter, sans-serif';
    ctx.fillStyle = '#38bdf8';
    ctx.fillText('Vật thể trong không gian (Mặt phẳng β)', projShape[0].x - 60, projShape[0].y - 14);

    ctx.fillStyle = '#fbbf24';
    ctx.fillText(lab1State.shape === 'circle' ? "Hình elip bóng đổ (Mặt phẳng chiếu α)" : "Hình bình hành bóng đổ (Mặt phẳng chiếu α)", projShadow[0].x - 60, projShadow[0].y + 24);

    requestAnimationFrame(render);
  }

  requestAnimationFrame(render);
}

// ==========================================
// 9. PHÒNG THÍ NGHIỆM 2: BẢO TOÀN TỈ SỐ & TRỌNG TÂM TAM GIÁC
// ==========================================
let lab2State = {
  rotX: 20,
  rotY: -40,
  zoom: 1,
  showMedians: true,
  showProjectors: true,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0
};

function initLab2() {
  const canvas = document.getElementById('canvasLab2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const btnReset = document.getElementById('btnResetRot2');
  const chkMed = document.getElementById('chkShowMedians');
  const chkProj = document.getElementById('chkShowProjectors');
  const valAG = document.getElementById('valAG');
  const valAM = document.getElementById('valAM');
  const valA1G1 = document.getElementById('valA1G1');
  const valA1M1 = document.getElementById('valA1M1');

  if (chkMed) chkMed.addEventListener('change', (e) => lab2State.showMedians = e.target.checked);
  if (chkProj) chkProj.addEventListener('change', (e) => lab2State.showProjectors = e.target.checked);

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      lab2State.rotX = 20;
      lab2State.rotY = -40;
      lab2State.zoom = 1;
      playTone(400, 'sine', 0.08);
    });
  }

  canvas.addEventListener('mousedown', (e) => {
    lab2State.isDragging = true;
    lab2State.lastMouseX = e.clientX;
    lab2State.lastMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => lab2State.isDragging = false);

  canvas.addEventListener('mousemove', (e) => {
    if (!lab2State.isDragging) return;
    const dx = e.clientX - lab2State.lastMouseX;
    const dy = e.clientY - lab2State.lastMouseY;
    lab2State.rotY += dx * 0.5;
    lab2State.rotX += dy * 0.5;
    lab2State.rotX = Math.max(-70, Math.min(70, lab2State.rotX));
    lab2State.lastMouseX = e.clientX;
    lab2State.lastMouseY = e.clientY;
  });

  canvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    lab2State.zoom -= e.deltaY * 0.001;
    lab2State.zoom = Math.max(0.6, Math.min(1.6, lab2State.zoom));
  });

  function render2() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 35;

    const radX = (lab2State.rotX * Math.PI) / 180;
    const radY = (lab2State.rotY * Math.PI) / 180;
    const cosX = Math.cos(radX), sinX = Math.sin(radX);
    const cosY = Math.cos(radY), sinY = Math.sin(radY);

    function project3D(x, y, z) {
      let x1 = x * cosY + z * sinY;
      let y1 = y;
      let z1 = -x * sinY + z * cosY;

      let x2 = x1;
      let y2 = y1 * cosX - z1 * sinX;
      let z2 = y1 * sinX + z1 * cosX;

      const scale = lab2State.zoom;
      return { x: cx + x2 * scale, y: cy - y2 * scale };
    }

    // 1. Mặt phẳng chiếu sàn $(\alpha)$
    const floorSize = 210;
    const fPts = [
      project3D(-floorSize, 0, -floorSize),
      project3D(floorSize, 0, -floorSize),
      project3D(floorSize, 0, floorSize),
      project3D(-floorSize, 0, floorSize)
    ];

    ctx.beginPath();
    ctx.moveTo(fPts[0].x, fPts[0].y);
    fPts.forEach((p, i) => { if (i > 0) ctx.lineTo(p.x, p.y); });
    ctx.closePath();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.55)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.45)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // 2. Tam giác ABC trong không gian (nghiêng lơ lửng)
    const A = { x: 0, y: 140, z: -40 };
    const B = { x: -90, y: 80, z: 60 };
    const C = { x: 80, y: 100, z: 80 };

    // Trung điểm M của BC
    const M = {
      x: (B.x + C.x) / 2,
      y: (B.y + C.y) / 2,
      z: (B.z + C.z) / 2
    };

    // Trọng tâm G của tam giác ABC: G = A + 2/3 (M - A)
    const G = {
      x: (A.x + B.x + C.x) / 3,
      y: (A.y + B.y + C.y) / 3,
      z: (A.z + B.z + C.z) / 3
    };

    // Phương chiếu xiên: d = (cotSun, -1, 0.3*cotSun)
    const pVec = { x: 0.65, y: -1, z: 0.25 };

    function projectToFloor(P) {
      const t = P.y; // vì y sàn = 0
      return {
        x: P.x + t * pVec.x,
        y: 0,
        z: P.z + t * pVec.z
      };
    }

    const A1 = projectToFloor(A);
    const B1 = projectToFloor(B);
    const C1 = projectToFloor(C);
    const M1 = projectToFloor(M);
    const G1 = projectToFloor(G);

    // Tính toán độ dài Euclidean trong không gian & trên hình chiếu
    function dist3D(p1, p2) {
      return Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2 + (p1.z - p2.z)**2);
    }

    const lenAG = dist3D(A, G);
    const lenAM = dist3D(A, M);
    const lenA1G1 = dist3D(A1, G1);
    const lenA1M1 = dist3D(A1, M1);

    if (valAG) valAG.textContent = lenAG.toFixed(1);
    if (valAM) valAM.textContent = lenAM.toFixed(1);
    if (valA1G1) valA1G1.textContent = lenA1G1.toFixed(1);
    if (valA1M1) valA1M1.textContent = lenA1M1.toFixed(1);

    const pA = project3D(A.x, A.y, A.z);
    const pB = project3D(B.x, B.y, B.z);
    const pC = project3D(C.x, C.y, C.z);
    const pM = project3D(M.x, M.y, M.z);
    const pG = project3D(G.x, G.y, G.z);

    const pA1 = project3D(A1.x, A1.y, A1.z);
    const pB1 = project3D(B1.x, B1.y, B1.z);
    const pC1 = project3D(C1.x, C1.y, C1.z);
    const pM1 = project3D(M1.x, M1.y, M1.z);
    const pG1 = project3D(G1.x, G1.y, G1.z);

    // 3. Đường dóng chiếu song song (AA', BB', CC', MM', GG')
    if (lab2State.showProjectors) {
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.45)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);

      const pairs = [
        [pA, pA1], [pB, pB1], [pC, pC1], [pM, pM1], [pG, pG1]
      ];
      pairs.forEach(([topP, botP]) => {
        ctx.beginPath();
        ctx.moveTo(topP.x, topP.y);
        ctx.lineTo(botP.x, botP.y);
        ctx.stroke();
      });
      ctx.setLineDash([]);
    }

    // 4. Vẽ tam giác hình chiếu A'B'C' trên sàn
    ctx.beginPath();
    ctx.moveTo(pA1.x, pA1.y);
    ctx.lineTo(pB1.x, pB1.y);
    ctx.lineTo(pC1.x, pC1.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(245, 158, 11, 0.22)';
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Trung tuyến A'M' trên sàn
    if (lab2State.showMedians) {
      ctx.beginPath();
      ctx.moveTo(pA1.x, pA1.y);
      ctx.lineTo(pM1.x, pM1.y);
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    // 5. Vẽ tam giác ABC trong không gian
    ctx.beginPath();
    ctx.moveTo(pA.x, pA.y);
    ctx.lineTo(pB.x, pB.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.28)';
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Trung tuyến AM trong không gian
    if (lab2State.showMedians) {
      ctx.beginPath();
      ctx.moveTo(pA.x, pA.y);
      ctx.lineTo(pM.x, pM.y);
      ctx.strokeStyle = '#ec4899';
      ctx.lineWidth = 1.8;
      ctx.stroke();
    }

    // 6. Vẽ các điểm đỉnh & nhãn
    function drawPoint(p, label, color = '#38bdf8', isUp = false) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(label, p.x + 8, isUp ? p.y - 8 : p.y + 14);
    }

    drawPoint(pA, 'A', '#38bdf8', true);
    drawPoint(pB, 'B', '#38bdf8');
    drawPoint(pC, 'C', '#38bdf8');
    drawPoint(pM, 'M (Trung điểm)', '#a855f7');
    drawPoint(pG, 'G (Trọng tâm)', '#ef4444', true);

    drawPoint(pA1, "A'", '#fbbf24', true);
    drawPoint(pB1, "B'", '#fbbf24');
    drawPoint(pC1, "C'", '#fbbf24');
    drawPoint(pM1, "M'", '#a855f7');
    drawPoint(pG1, "G'", '#ef4444', true);

    requestAnimationFrame(render2);
  }

  requestAnimationFrame(render2);
}

// ==========================================
// 10. KHỞI TẠO ỨNG DỤNG KHI DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  // 1. Kích hoạt huy hiệu 1 ngay khi vào bài học
  appState.badges[0] = true;

  // 2. Cập nhật HUD & Avatar
  updateHUD();
  initAvatarModal();
  initHUDControls();
  initTabs();

  // 3. Render Quiz Đấu Trường
  renderQuiz();

  // 4. Khởi tạo 2 Labs 3D
  initLab1();
  initLab2();

  // 5. Quét KaTeX toàn bộ trang
  renderMathInTree(document.body);
});
