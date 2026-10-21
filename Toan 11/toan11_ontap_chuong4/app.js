/**
 * ÔN TẬP CHƯƠNG IV: QUAN HỆ SONG SONG TRONG KHÔNG GIAN - TOÁN 11 KẾT NỐI TRI THỨC
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
  { id: 'logic', icon: '👑', name: 'Chiến Binh Logic', title: 'Đại Sư Không Gian' },
  { id: 'master', icon: '💎', name: 'Đại Pháp Sư', title: 'Thống Lĩnh Chương IV' },
  { id: 'pharaoh', icon: '📐', name: 'Nhà Hình Học', title: 'Kiến Trúc Sư Cổ Đại' },
  { id: 'scout', icon: '🦅', name: 'Mắt Đại Bàng', title: 'Chiến Lược Gia Không Gian' },
  { id: 'cyber', icon: '⚡', name: 'Kỹ Sư Cyber', title: 'Chuyên Gia Thiết Diện 3D' },
  { id: 'alchemist', icon: '🧪', name: 'Thuật Sĩ Thalès', title: 'Bậc Thầy Tỉ Số Không Gian' },
  { id: 'astro', icon: '🚀', name: 'Phi Hành Gia', title: 'Thám Hiểm Vũ Trụ 3D' },
  { id: 'owl', icon: '🦉', name: 'Cú Trí Tuệ', title: 'Hiền Triết Hình Không Gian' }
];

const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Đại Sư Quan Hệ Song Song',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// ==========================================
// 3. DỮ LIỆU ĐẤU TRƯỜNG SGK (10 CÂU TRẮC NGHIỆM CHƯƠNG IV)
// ==========================================
const quizData = [
  {
    id: 1,
    title: 'Câu 1: Vị trí tương đối của hai giao tuyến (Bài 4.35 SGK)',
    pts: 20,
    question: 'Cho đường thẳng $a$ song song với mặt phẳng $(P)$. Mặt phẳng $(Q)$ chứa đường thẳng $a$ và cắt mặt phẳng $(P)$ theo giao tuyến là đường thẳng $b$. Vị trí tương đối của hai đường thẳng $a$ và $b$ là:',
    options: [
      { text: 'Chéo nhau.', correct: false },
      { text: 'Cắt nhau.', correct: false },
      { text: 'Song song.', correct: true },
      { text: 'Trùng nhau.', correct: false }
    ],
    explanation: 'Theo tính chất cơ bản của quan hệ song song (Định lí giao tuyến): Nếu đường thẳng $a$ song song với mặt phẳng $(P)$, thì mọi mặt phẳng $(Q)$ chứa $a$ mà cắt $(P)$ theo giao tuyến $b$ thì $a \\parallel b$.'
  },
  {
    id: 2,
    title: 'Câu 2: Nhận biết đường thẳng song song mặt phẳng (Bài 4.36 SGK)',
    pts: 20,
    question: 'Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành. Gọi $M$ là trung điểm của cạnh $SD$. Đường thẳng $SB$ song song với mặt phẳng nào sau đây?',
    options: [
      { text: 'Mặt phẳng $(CDM)$.', correct: false },
      { text: 'Mặt phẳng $(ACM)$.', correct: true },
      { text: 'Mặt phẳng $(ADM)$.', correct: false },
      { text: 'Mặt phẳng $(ACD)$.', correct: false }
    ],
    explanation: 'Gọi $O$ là tâm của hình bình hành $ABCD$. Trong tam giác $SBD$, $O$ là trung điểm $BD$, $M$ là trung điểm $SD$, do đó $OM$ là đường trung bình của tam giác $SBD \\implies SB \\parallel OM$. Vì $OM \\subset (ACM)$ và $SB \\not\\subset (ACM)$ nên $SB \\parallel (ACM)$.'
  },
  {
    id: 3,
    title: 'Câu 3: Hai mặt phẳng song song trong hình hộp (Bài 4.37 SGK)',
    pts: 20,
    question: 'Cho hình hộp $ABCD.A\'B\'C\'D\'$. Mặt phẳng $(AB\'D\')$ song song với mặt phẳng nào sau đây?',
    options: [
      { text: 'Mặt phẳng $(ABCD)$.', correct: false },
      { text: 'Mặt phẳng $(BCC\'B\')$.', correct: false },
      { text: 'Mặt phẳng $(BDA\')$.', correct: false },
      { text: 'Mặt phẳng $(BDC\')$.', correct: true }
    ],
    explanation: 'Trong hình hộp $ABCD.A\'B\'C\'D\'$, ta có $AB\' \\parallel DC\'$ (do $ADC\'B\'$ là hình bình hành) và $AD\' \\parallel BC\'$ (do $ABC\'D\'$ là hình bình hành). Mặt phẳng $(AB\'D\')$ chứa hai đường thẳng cắt nhau $AB\'$ và $AD\'$ lần lượt song song với hai đường thẳng cắt nhau $DC\'$ và $BC\'$ trong mặt phẳng $(BDC\')$, suy ra $(AB\'D\') \\parallel (BDC\').'
  },
  {
    id: 4,
    title: 'Câu 4: Định lí Thalès trong không gian (Bài 4.38 SGK)',
    pts: 20,
    question: 'Cho ba mặt phẳng $(P), (Q), (R)$ đôi một song song. Đường thẳng $a$ cắt $(P), (Q), (R)$ lần lượt tại $A, B, C$ sao cho $\\frac{AB}{BC} = \\frac{2}{3}$. Đường thẳng $b$ cắt $(P), (Q), (R)$ lần lượt tại $A\', B\', C\'$. Tỉ số $\\frac{A\'B\'}{B\'C\'}$ bằng:',
    options: [
      { text: '$\\frac{2}{3}$.', correct: true },
      { text: '$\\frac{1}{2}$.', correct: false },
      { text: '$\\frac{3}{2}$.', correct: false },
      { text: '$\\frac{2}{5}$.', correct: false }
    ],
    explanation: 'Theo Định lí Thalès trong không gian: Ba mặt phẳng đôi một song song chắn trên hai cát tuyến bất kì các đoạn thẳng tương ứng tỉ lệ. Do đó $\\frac{A\'B\'}{B\'C\'} = \\frac{AB}{BC} = \\frac{2}{3}$.'
  },
  {
    id: 5,
    title: 'Câu 5: Tỉ số giao điểm thiết diện (Bài 4.39 SGK)',
    pts: 20,
    question: 'Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành tâm $O$. Gọi $M, N$ lần lượt là trung điểm của $SB, SD$; $K$ là giao điểm của $(AMN)$ và đường thẳng $SC$. Tỉ số $\\frac{SK}{SC}$ bằng:',
    options: [
      { text: '$\\frac{1}{2}$.', correct: false },
      { text: '$\\frac{1}{3}$.', correct: true },
      { text: '$\\frac{1}{4}$.', correct: false },
      { text: '$\\frac{2}{3}$.', correct: false }
    ],
    explanation: 'Trong mặt phẳng $(SBD)$, $MN$ cắt $SO$ tại $I$. Vì $M, N$ là trung điểm $SB, SD$ nên $I$ là trung điểm $SO$, suy ra $SI = \\frac{1}{2} SO$. Trong tam giác $SAC$, đường thẳng qua $A$ và $I$ cắt $SC$ tại $K$. Áp dụng định lí Menelaus cho tam giác $SOC$ với ba điểm thẳng hàng $A, I, K$: $\\frac{SK}{KC} \\cdot \\frac{CA}{AO} \\cdot \\frac{OI}{IS} = 1 \\implies \\frac{SK}{KC} \\cdot 2 \\cdot 1 = 1 \\implies \\frac{SK}{KC} = \\frac{1}{2} \\implies \\frac{SK}{SC} = \\frac{1}{3}$.'
  },
  {
    id: 6,
    title: 'Câu 6: Phép chiếu song song trong hình hộp (Bài 4.40 SGK)',
    pts: 20,
    question: 'Cho hình hộp $ABCD.A\'B\'C\'D\'$. Gọi $M, M\'$ lần lượt là trung điểm các cạnh $BC, B\'C\'$. Hình chiếu của $\\triangle B\'DM$ qua phép chiếu song song lên $(A\'B\'C\'D\')$ theo phương chiếu $AA\'$ là:',
    options: [
      { text: 'Tam giác $B\'A\'M\'$.', correct: false },
      { text: 'Tam giác $C\'D\'M\'$.', correct: false },
      { text: 'Tam giác $DMM\'$.', correct: false },
      { text: 'Tam giác $B\'D\'M\'$.', correct: true }
    ],
    explanation: 'Phương chiếu là $AA\'$ (song song với các cạnh bên). Điểm $B\' \\in (A\'B\'C\'D\')$ có hình chiếu là chính nó $B\'$; điểm $D$ có hình chiếu là $D\'$ (vì $DD\' \\parallel AA\'$); điểm $M$ có hình chiếu là $M\'$ (vì $MM\' \\parallel BB\' \\parallel AA\'$). Vậy hình chiếu của $\\triangle B\'DM$ là $\\triangle B\'D\'M\'$.'
  },
  {
    id: 7,
    title: 'Câu 7: Giao tuyến chứa hai đường thẳng song song (Bài 4.41 SGK)',
    pts: 20,
    question: 'Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình thang ($AB \\parallel CD, AB < CD$). Giao tuyến của hai mặt phẳng $(SAB)$ và $(SCD)$ là:',
    options: [
      { text: 'Đường thẳng nối $S$ với giao điểm của $AD$ và $BC$.', correct: false },
      { text: 'Đường thẳng đi qua $S$ và song song với $AB$ và $CD$.', correct: true },
      { text: 'Đường thẳng nối $S$ với tâm hình thang $O$.', correct: false },
      { text: 'Đường thẳng đi qua $S$ và vuông góc với đáy $(ABCD)$.', correct: false }
    ],
    explanation: 'Hai mặt phẳng $(SAB)$ và $(SCD)$ có điểm chung $S$, lần lượt chứa hai đường thẳng song song là $AB$ và $CD$. Do đó giao tuyến của chúng là đường thẳng $d$ đi qua $S$ và song song với $AB$ và $CD$.'
  },
  {
    id: 8,
    title: 'Câu 8: Đường thẳng song song mặt phẳng đáy (Bài 4.44 SGK)',
    pts: 20,
    question: 'Cho hình chóp $S.ABCD$ có đáy $ABCD$ là hình bình hành. Gọi $G, K$ lần lượt là trọng tâm của các tam giác $SAD$ và $SCD$. Khẳng định nào sau đây là ĐÚNG?',
    options: [
      { text: 'Đường thẳng $GK$ cắt mặt phẳng $(ABCD)$ tại tâm $O$.', correct: false },
      { text: 'Đường thẳng $GK$ song song với mặt phẳng đáy $(ABCD)$.', correct: true },
      { text: 'Đường thẳng $GK$ chéo nhau với đường thẳng $AC$.', correct: false },
      { text: 'Đường thẳng $GK$ nằm trọn trong mặt phẳng $(SBD)$.', correct: false }
    ],
    explanation: 'Gọi $E, F$ lần lượt là trung điểm của $AD$ và $CD$. Khi đó $\\frac{SG}{SE} = \\frac{SK}{SF} = \\frac{2}{3} \\implies GK \\parallel EF$ (định lí Thalès đảo trong tam giác $SEF$). Vì $EF \\subset (ABCD)$ và $GK \\not\\subset (ABCD)$ nên $GK \\parallel (ABCD)$.'
  },
  {
    id: 9,
    title: 'Câu 9: Tính chất đường chéo hình hộp (Bài 4.45 SGK)',
    pts: 20,
    question: 'Cho hình hộp $ABCD.A\'B\'C\'D\'$. Đường chéo $AC\'$ đi qua trọng tâm $G$ của tam giác $A\'BD$. Tỉ số $\\frac{AG}{AC\'}$ bằng:',
    options: [
      { text: '$\\frac{1}{2}$.', correct: false },
      { text: '$\\frac{1}{3}$.', correct: true },
      { text: '$\\frac{2}{3}$.', correct: false },
      { text: '$\\frac{1}{4}$.', correct: false }
    ],
    explanation: 'Xét mặt phẳng chéo $(AA\'C\'C)$ chứa $AC\'$. Đường thẳng $A\'O$ (với $O$ là tâm đáy $ABCD$) là trung tuyến của $\\triangle A\'BD$. Giao điểm của $AC\'$ và $A\'O$ chính là trọng tâm $G$ của $\\triangle A\'BD$. Theo tính chất hình hộp, $AC\'$ bị hai mặt phẳng $(A\'BD)$ và $(B\'D\'C)$ chia thành 3 đoạn bằng nhau: $AG = G_1 G_2 = G_2 C\' = \\frac{1}{3} AC\'$.'
  },
  {
    id: 10,
    title: 'Câu 10: Thiết diện song song tứ diện (Bài 4.46 SGK)',
    pts: 20,
    question: 'Cho tứ diện $ABCD$. Trên cạnh $AB$ lấy điểm $M$ sao cho $BM = 3 AM$. Mặt phẳng $(P)$ qua $M$ song song với $AD$ và $BC$, cắt cạnh $CD$ tại điểm $K$. Tỉ số $\\frac{KC}{CD}$ bằng:',
    options: [
      { text: '$\\frac{1}{4}$.', correct: false },
      { text: '$\\frac{1}{3}$.', correct: false },
      { text: '$\\frac{3}{4}$.', correct: true },
      { text: '$\\frac{2}{3}$.', correct: false }
    ],
    explanation: 'Vì $(P) \\parallel AD$ nên giao tuyến với $(ABD)$ là $MN \\parallel AD$ ($N \\in BD$) $\\implies \\frac{BN}{BD} = \\frac{BM}{BA} = \\frac{3}{4}$. Vì $(P) \\parallel BC$ nên giao tuyến với $(BCD)$ là $NK \\parallel BC$ ($K \\in CD$) $\\implies \\frac{DK}{DC} = \\frac{DN}{DB} = 1 - \\frac{3}{4} = \\frac{1}{4} \\implies \\frac{KC}{CD} = 1 - \\frac{1}{4} = \\frac{3}{4}$.'
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
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình ôn tập?')) {
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

      if (targetId === 'labs') {
        appState.badges[1] = true;
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
  if (!container) return;

  container.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];

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
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    const optGrid = document.createElement('div');
    optGrid.className = 'quiz-options';

    const explanation = document.createElement('div');
    explanation.className = 'explanation-box';
    explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;

    const isAnswered = appState.answered[q.id] !== undefined;

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
            q.options.forEach((o, idx) => {
              if (o.correct) allBtns[idx].classList.add('correct');
            });
          }

          explanation.classList.add('show');
          renderMathInTree(explanation);

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

  if (answeredCount >= 5) {
    appState.badges[2] = true;
  }

  if (correctCount >= 8) {
    appState.badges[3] = true;
    appState.stars = 4;
  }

  if (correctCount === 10) {
    appState.badges[4] = true;
    appState.stars = 5;
    playFanfare();
  } else if (correctCount >= 5) {
    appState.stars = 3;
  }
}

// ==========================================
// 8. PHÒNG THÍ NGHIỆM 1: SA BÀN HÌNH HỘP 3D TOÀN CẢNH
// ==========================================
let lab1State = {
  mode: 'planes', // 'planes' | 'diagonal' | 'skew'
  rotX: 20,
  rotY: -35,
  zoom: 1,
  autoRotate: false,
  showLabels: true,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0
};

function initLab1() {
  const canvas = document.getElementById('canvasLab1');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const btnPlanes = document.getElementById('btnModePlanes');
  const btnDiag = document.getElementById('btnModeDiagonal');
  const btnSkew = document.getElementById('btnModeSkew');
  const btnReset = document.getElementById('btnResetRot1');
  const chkAuto = document.getElementById('chkAutoRot1');
  const chkLabels = document.getElementById('chkShowLabels');
  const statusBadge = document.getElementById('lab1StatusBadge');
  const descEl = document.getElementById('lab1Desc');

  function setMode(m) {
    lab1State.mode = m;
    [btnPlanes, btnDiag, btnSkew].forEach(b => { if (b) b.classList.remove('active'); });
    if (m === 'planes') {
      btnPlanes.classList.add('active');
      statusBadge.textContent = "Mặt phẳng (AB'D') // Mặt phẳng (BDC')";
      descEl.innerHTML = "Hai mặt phẳng $(AB\'D\')$ và $(BDC\')$ song song với nhau vì có $AB\' \\parallel DC\'$ và $AD\' \\parallel BC\'$ (Bài 4.37 SGK).";
    } else if (m === 'diagonal') {
      btnDiag.classList.add('active');
      statusBadge.textContent = "Đường chéo AC' đâm xuyên qua 2 trọng tâm";
      descEl.innerHTML = "Đường chéo $AC\'$ đâm xuyên qua trọng tâm $G_1$ của $\\triangle A\'BD$ và $G_2$ của $\\triangle B\'D\'C$, chia $AC\'$ thành ba phần bằng nhau: $AG_1 = G_1 G_2 = G_2 C\' = \\frac{1}{3} AC\'$ (Bài 4.45 SGK).";
    } else if (m === 'skew') {
      btnSkew.classList.add('active');
      statusBadge.textContent = "Hai đường thẳng chéo nhau A'B và CC'";
      descEl.innerHTML = "$A\'B$ và $CC\'$ không cùng nằm trên bất kì mặt phẳng nào. $CC\' \\parallel (ABB\'A\')$ chứa $A\'B$, kiểm chứng khoảng cách không giao nhau!";
    }
    playTone(520, 'sine', 0.08);
  }

  if (btnPlanes) btnPlanes.addEventListener('click', () => setMode('planes'));
  if (btnDiag) btnDiag.addEventListener('click', () => setMode('diagonal'));
  if (btnSkew) btnSkew.addEventListener('click', () => setMode('skew'));

  if (chkAuto) chkAuto.addEventListener('change', (e) => lab1State.autoRotate = e.target.checked);
  if (chkLabels) chkLabels.addEventListener('change', (e) => lab1State.showLabels = e.target.checked);

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      lab1State.rotX = 20;
      lab1State.rotY = -35;
      lab1State.zoom = 1;
      playTone(400, 'sine', 0.08);
    });
  }

  canvas.addEventListener('mousedown', (e) => {
    lab1State.isDragging = true;
    lab1State.lastMouseX = e.clientX;
    lab1State.lastMouseY = e.clientY;
  });

  window.addEventListener('mouseup', () => lab1State.isDragging = false);

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

  function render1() {
    if (lab1State.autoRotate) lab1State.rotY += 0.4;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const cx = canvas.width / 2;
    const cy = canvas.height / 2 + 10;

    const radX = (lab1State.rotX * Math.PI) / 180;
    const radY = (lab1State.rotY * Math.PI) / 180;
    const cosX = Math.cos(radX), sinX = Math.sin(radX);
    const cosY = Math.cos(radY), sinY = Math.sin(radY);

    function project3D(x, y, z) {
      let x1 = x * cosY + z * sinY;
      let y1 = y;
      let z1 = -x * sinY + z * cosY;

      let x2 = x1;
      let y2 = y1 * cosX - z1 * sinX;
      let z2 = y1 * sinX + z1 * cosX;

      const scale = lab1State.zoom;
      return { x: cx + x2 * scale, y: cy - y2 * scale, depth: z2 };
    }

    // Tọa độ 8 đỉnh hình hộp ABCD.A'B'C'D'
    // Đáy dưới ABCD tại y = -65, Đáy trên A'B'C'D' tại y = 65
    const w = 90, d = 75, h = 65;
    // Dạng hình hộp nghiêng nhẹ để góc nhìn không gian tự nhiên
    const A = { x: -w + 20, y: -h, z: -d };
    const B = { x: w - 20, y: -h, z: -d };
    const C = { x: w + 20, y: -h, z: d };
    const D = { x: -w - 20, y: -h, z: d };

    const A1 = { x: A.x + 20, y: h, z: A.z + 10 };
    const B1 = { x: B.x + 20, y: h, z: B.z + 10 };
    const C1 = { x: C.x + 20, y: h, z: C.z + 10 };
    const D1 = { x: D.x + 20, y: h, z: D.z + 10 };

    const pts = { A, B, C, D, A1, B1, C1, D1 };
    const proj = {};
    for (let k in pts) proj[k] = project3D(pts[k].x, pts[k].y, pts[k].z);

    // 1. Vẽ các cạnh của hình hộp
    const edges = [
      ['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A'],
      ['A1', 'B1'], ['B1', 'C1'], ['C1', 'D1'], ['D1', 'A1'],
      ['A', 'A1'], ['B', 'B1'], ['C', 'C1'], ['D', 'D1']
    ];

    ctx.strokeStyle = 'rgba(148, 163, 184, 0.35)';
    ctx.lineWidth = 1.8;
    edges.forEach(([u, v]) => {
      ctx.beginPath();
      ctx.moveTo(proj[u].x, proj[u].y);
      ctx.lineTo(proj[v].x, proj[v].y);
      ctx.stroke();
    });

    // 2. Chế độ hiển thị đặc biệt
    if (lab1State.mode === 'planes') {
      // Mặt phẳng (AB'D')
      ctx.beginPath();
      ctx.moveTo(proj.A.x, proj.A.y);
      ctx.lineTo(proj.B1.x, proj.B1.y);
      ctx.lineTo(proj.D1.x, proj.D1.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(6, 182, 212, 0.32)';
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Mặt phẳng (BDC')
      ctx.beginPath();
      ctx.moveTo(proj.B.x, proj.B.y);
      ctx.lineTo(proj.D.x, proj.D.y);
      ctx.lineTo(proj.C1.x, proj.C1.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.32)';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    } else if (lab1State.mode === 'diagonal') {
      // Đường chéo AC'
      ctx.beginPath();
      ctx.moveTo(proj.A.x, proj.A.y);
      ctx.lineTo(proj.C1.x, proj.C1.y);
      ctx.strokeStyle = '#ef4444';
      ctx.lineWidth = 3.2;
      ctx.stroke();

      // Trọng tâm G1 của A'BD
      const G1 = {
        x: (A1.x + B.x + D.x) / 3,
        y: (A1.y + B.y + D.y) / 3,
        z: (A1.z + B.z + D.z) / 3
      };
      // Trọng tâm G2 của B'D'C
      const G2 = {
        x: (B1.x + D1.x + C.x) / 3,
        y: (B1.y + D1.y + C.y) / 3,
        z: (B1.z + D1.z + C.z) / 3
      };
      const pG1 = project3D(G1.x, G1.y, G1.z);
      const pG2 = project3D(G2.x, G2.y, G2.z);

      // Tam giác A'BD
      ctx.beginPath();
      ctx.moveTo(proj.A1.x, proj.A1.y);
      ctx.lineTo(proj.B.x, proj.B.y);
      ctx.lineTo(proj.D.x, proj.D.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(168, 85, 247, 0.2)';
      ctx.fill();
      ctx.strokeStyle = '#a855f7';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Điểm G1 & G2
      [ [pG1, "G1 (1/3)"], [pG2, "G2 (2/3)"] ].forEach(([p, lbl]) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 5.5, 0, 2 * Math.PI);
        ctx.fillStyle = '#f59e0b';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = 'bold 12px Inter, sans-serif';
        ctx.fillStyle = '#fbbf24';
        ctx.fillText(lbl, p.x + 8, p.y - 4);
      });
    } else if (lab1State.mode === 'skew') {
      // Đường A'B (xanh cyan)
      ctx.beginPath();
      ctx.moveTo(proj.A1.x, proj.A1.y);
      ctx.lineTo(proj.B.x, proj.B.y);
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 3.5;
      ctx.stroke();

      // Đường CC' (vàng cam)
      ctx.beginPath();
      ctx.moveTo(proj.C.x, proj.C.y);
      ctx.lineTo(proj.C1.x, proj.C1.y);
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3.5;
      ctx.stroke();
    }

    // 3. Vẽ nhãn các đỉnh
    if (lab1State.showLabels) {
      const labels = [
        ['A', proj.A], ['B', proj.B], ['C', proj.C], ['D', proj.D],
        ["A'", proj.A1], ["B'", proj.B1], ["C'", proj.C1], ["D'", proj.D1]
      ];
      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillStyle = '#ffffff';
      labels.forEach(([lbl, p]) => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, 4, 0, 2 * Math.PI);
        ctx.fillStyle = '#6366f1';
        ctx.fill();
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#e2e8f0';
        ctx.fillText(lbl, p.x + 7, p.y - 6);
      });
    }

    requestAnimationFrame(render1);
  }

  requestAnimationFrame(render1);
}

// ==========================================
// 9. PHÒNG THÍ NGHIỆM 2: THIẾT DIỆN TỨ DIỆN SONG SONG & THALÈS 3D
// ==========================================
let lab2State = {
  posM: 0.5, // 0.1 -> 0.9 (AM/AB)
  rotX: 20,
  rotY: -45,
  zoom: 1,
  showPlanes: true,
  isDragging: false,
  lastMouseX: 0,
  lastMouseY: 0
};

function initLab2() {
  const canvas = document.getElementById('canvasLab2');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');

  const slider = document.getElementById('sliderPosM');
  const valSlider = document.getElementById('valPosM');
  const btnReset = document.getElementById('btnResetRot2');
  const chkPlanes = document.getElementById('chkShowPlanes');
  const valAM_MB = document.getElementById('valAM_MB');
  const valKC_CD = document.getElementById('valKC_CD');

  if (slider) {
    slider.addEventListener('input', (e) => {
      lab2State.posM = parseInt(e.target.value) / 100;
      if (valSlider) valSlider.textContent = lab2State.posM.toFixed(2);
      if (valAM_MB) valAM_MB.textContent = `AM/AB = ${lab2State.posM.toFixed(2)}`;
      if (valKC_CD) valKC_CD.textContent = (1 - lab2State.posM).toFixed(2);
    });
  }

  if (chkPlanes) chkPlanes.addEventListener('change', (e) => lab2State.showPlanes = e.target.checked);

  if (btnReset) {
    btnReset.addEventListener('click', () => {
      lab2State.rotX = 20;
      lab2State.rotY = -45;
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
    const cy = canvas.height / 2 + 15;

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

    // Tứ diện ABCD (Bài 4.46 SGK)
    const A = { x: 0, y: 130, z: -30 };
    const B = { x: -110, y: -70, z: -60 };
    const C = { x: 120, y: -70, z: -40 };
    const D = { x: 0, y: -50, z: 110 };

    // Điểm M trên AB: M = A + u * (B - A)
    const u = lab2State.posM; // AM/AB
    const M = {
      x: A.x + u * (B.x - A.x),
      y: A.y + u * (B.y - A.y),
      z: A.z + u * (B.z - A.z)
    };

    // Mặt phẳng (P) song song với AD và BC
    // 1. Giao tuyến với (ABD): MN // AD (N trên BD) => BN/BD = BM/BA = 1 - u
    const N = {
      x: B.x + (1 - u) * (D.x - B.x),
      y: B.y + (1 - u) * (D.y - B.y),
      z: B.z + (1 - u) * (D.z - B.z)
    };

    // 2. Giao tuyến với (BCD): NK // BC (K trên CD) => DK/DC = DN/DB = u => K = D + u * (C - D)
    const K = {
      x: D.x + u * (C.x - D.x),
      y: D.y + u * (C.y - D.y),
      z: D.z + u * (C.z - D.z)
    };

    // 3. Giao tuyến với (ABC): MQ // BC (Q trên AC) => AQ/AC = AM/AB = u => Q = A + u * (C - A)
    const Q = {
      x: A.x + u * (C.x - A.x),
      y: A.y + u * (C.y - A.y),
      z: A.z + u * (C.z - A.z)
    };

    const pA = project3D(A.x, A.y, A.z);
    const pB = project3D(B.x, B.y, B.z);
    const pC = project3D(C.x, C.y, C.z);
    const pD = project3D(D.x, D.y, D.z);

    const pM = project3D(M.x, M.y, M.z);
    const pN = project3D(N.x, N.y, N.z);
    const pK = project3D(K.x, K.y, K.z);
    const pQ = project3D(Q.x, Q.y, Q.z);

    // 1. Vẽ các cạnh của tứ diện ABCD
    const tetraEdges = [
      [pA, pB], [pA, pC], [pA, pD],
      [pB, pD], [pC, pD]
    ];
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.45)';
    ctx.lineWidth = 1.8;
    tetraEdges.forEach(([p1, p2]) => {
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    });

    // Cạnh đáy BC vẽ nét liền
    ctx.beginPath();
    ctx.moveTo(pB.x, pB.y);
    ctx.lineTo(pC.x, pC.y);
    ctx.stroke();

    // 2. Vẽ thiết diện M-N-K-Q (Hình bình hành)
    if (lab2State.showPlanes) {
      ctx.beginPath();
      ctx.moveTo(pM.x, pM.y);
      ctx.lineTo(pN.x, pN.y);
      ctx.lineTo(pK.x, pK.y);
      ctx.lineTo(pQ.x, pQ.y);
      ctx.closePath();
      ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
      ctx.fill();
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.8;
      ctx.stroke();
    }

    // 3. Vẽ các điểm đỉnh & nhãn
    function drawPoint(p, label, color = '#38bdf8') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 4.5, 0, 2 * Math.PI);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.font = 'bold 13px Inter, sans-serif';
      ctx.fillStyle = color;
      ctx.fillText(label, p.x + 8, p.y - 4);
    }

    drawPoint(pA, 'A', '#38bdf8');
    drawPoint(pB, 'B', '#38bdf8');
    drawPoint(pC, 'C', '#38bdf8');
    drawPoint(pD, 'D', '#38bdf8');

    drawPoint(pM, 'M', '#fbbf24');
    drawPoint(pN, 'N', '#fbbf24');
    drawPoint(pK, 'K', '#ec4899');
    drawPoint(pQ, 'Q', '#fbbf24');

    requestAnimationFrame(render2);
  }

  requestAnimationFrame(render2);
}

// ==========================================
// 10. KHỞI TẠO ỨNG DỤNG KHI DOM READY
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  appState.badges[0] = true;

  updateHUD();
  initAvatarModal();
  initHUDControls();
  initTabs();

  renderQuiz();

  initLab1();
  initLab2();

  renderMathInTree(document.body);
});
