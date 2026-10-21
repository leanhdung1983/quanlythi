/**
 * Ôn tập cuối Chương IX: Dữ liệu và xác suất thực nghiệm
 * Gamified Interactive Application - Sách Toán 6 KNTT
 */

// ==================== 1. SOUND SYSTEM ====================
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, vol = 0.2) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
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
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playCorrect() {
    this.playTone(523.25, 'triangle', 0.1, 0.25);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.25), 100);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.2, 0.25), 220);
  }

  playWrong() {
    this.playTone(280, 'sawtooth', 0.15, 0.2);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.25, 0.25), 120);
  }

  playLevelUp() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.18, 0.3), i * 110);
    });
  }

  playBadge() {
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.2, 0.3), i * 130);
    });
  }

  playClick() {
    this.playTone(700, 'sine', 0.05, 0.1);
  }

  playRoll() {
    for (let i = 0; i < 5; i++) {
      setTimeout(() => this.playTone(350 + Math.random() * 250, 'sine', 0.04, 0.1), i * 60);
    }
  }
}

const sounds = new SoundManager();

// ==================== 2. STATE MANAGEMENT ====================
const STORAGE_KEY = 'toan6_ontap9_data';

const avatars = ['👑', '🎯', '🎲', '🦊', '🦁', '🐯', '🐼', '🦉', '🚀', '🤖'];

const defaultState = {
  avatarIndex: 0,
  xp: 0,
  streak: 0,
  stars: 1,
  badges: [false, false, false, false, false],
  arenaScore: 0,
  answeredQuestions: {},
  orientation: 'vertical' // 'vertical' or 'horizontal'
};

let state = { ...defaultState };

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = Object.assign({}, defaultState, JSON.parse(saved));
    }
  } catch (e) {
    console.warn("Storage load error:", e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Storage save error:", e);
  }
}

function updateHUD() {
  document.getElementById('avatarBtn').textContent = avatars[state.avatarIndex];
  document.getElementById('xpDisplay').textContent = state.xp;
  document.getElementById('streakDisplay').textContent = `🔥 ${state.streak}`;

  let starCount = 1;
  if (state.xp >= 100) starCount = 2;
  if (state.xp >= 250) starCount = 3;
  if (state.xp >= 450) starCount = 4;
  if (state.xp >= 700 && getCorrectArenaCount() >= 8) starCount = 5;
  state.stars = starCount;

  let starsStr = '';
  for (let i = 1; i <= 5; i++) {
    starsStr += i <= starCount ? '⭐' : '☆';
  }
  document.getElementById('starRating').textContent = starsStr;

  const titles = [
    'Tập Sự Thống Kê',
    'Thám Tử Dữ Liệu',
    'Chuyên Gia Biểu Đồ Kép',
    'Nhà Phán Quyết Xác Suất',
    'Đại Kiện Tướng Toàn Năng Chương IX'
  ];
  document.getElementById('userTitle').textContent = titles[Math.min(starCount - 1, 4)];

  for (let i = 0; i < 5; i++) {
    const badgeEl = document.getElementById(`badge-${i + 1}`);
    if (badgeEl) {
      if (state.badges[i]) {
        badgeEl.classList.add('unlocked');
      } else {
        badgeEl.classList.remove('unlocked');
      }
    }
  }

  const answeredCount = Object.keys(state.answeredQuestions).length;
  document.getElementById('arenaProgressText').textContent = `${answeredCount}/10`;
  document.getElementById('arenaProgressBar').style.width = `${(answeredCount / 10) * 100}%`;
  document.getElementById('arenaScore').textContent = state.arenaScore;

  saveState();
}

function awardXP(points) {
  state.xp += points;
  updateHUD();
}

function checkBadge(index) {
  if (!state.badges[index]) {
    state.badges[index] = true;
    sounds.playBadge();
    saveState();
    updateHUD();
  }
}

function getCorrectArenaCount() {
  let count = 0;
  for (let k in state.answeredQuestions) {
    if (state.answeredQuestions[k].correct) count++;
  }
  return count;
}

// ==================== 3. LAB 1: SPORTS DUAL BAR CHART (9.36) ====================
const sportsData = {
  title: 'Môn thể thao yêu thích của học sinh lớp 6 (Bảng 9.11)',
  categories: ['Bóng đá', 'Cầu lông', 'Bơi lội', 'Bóng rổ', 'Khác'],
  seriesFemale: [3, 5, 7, 1, 0],
  seriesMale: [6, 5, 2, 3, 2],
  colorFemale: '#ec4899',
  colorMale: '#06b6d4'
};

const canvas = document.getElementById('reviewChartCanvas');
const ctx = canvas.getContext('2d');

function drawReviewChart() {
  if (!canvas || !ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const isVertical = state.orientation === 'vertical';
  const cats = sportsData.categories;
  const fSeries = sportsData.seriesFemale;
  const mSeries = sportsData.seriesMale;
  const maxVal = 8; // Max in data is 7

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(sportsData.title, w / 2, 28);

  // Legend
  ctx.font = 'bold 13px "Segoe UI"';
  ctx.textAlign = 'left';
  // Female
  ctx.fillStyle = sportsData.colorFemale;
  ctx.fillRect(w - 180, 16, 14, 14);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Nữ', w - 160, 28);
  // Male
  ctx.fillStyle = sportsData.colorMale;
  ctx.fillRect(w - 110, 16, 14, 14);
  ctx.fillStyle = '#ffffff';
  ctx.fillText('Nam', w - 90, 28);

  if (isVertical) {
    const margin = { top: 60, right: 30, bottom: 60, left: 60 };
    const chartW = w - margin.left - margin.right;
    const chartH = h - margin.top - margin.bottom;

    // Y Axis Grid
    ctx.font = '12px "Segoe UI"';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let v = 0; v <= maxVal; v += 2) {
      const y = margin.top + chartH - (v / maxVal) * chartH;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartW, y);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(v, margin.left - 10, y);
    }

    // Y axis title
    ctx.save();
    ctx.translate(18, margin.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px "Segoe UI"';
    ctx.fillText('Số học sinh', 0, 0);
    ctx.restore();

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartH);
    ctx.lineTo(margin.left + chartW, margin.top + chartH);
    ctx.stroke();

    // Bars
    const groupW = chartW / cats.length;
    const barW = 28;

    cats.forEach((cat, idx) => {
      const groupCenter = margin.left + idx * groupW + groupW / 2;
      const xF = groupCenter - barW - 2;
      const xM = groupCenter + 2;

      const vf = fSeries[idx];
      const vm = mSeries[idx];

      const hF = (vf / maxVal) * chartH;
      const hM = (vm / maxVal) * chartH;

      const yF = margin.top + chartH - hF;
      const yM = margin.top + chartH - hM;

      // Female Bar
      ctx.fillStyle = sportsData.colorFemale;
      drawBar(ctx, xF, yF, barW, hF);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 11px "Segoe UI"';
      ctx.textAlign = 'center';
      if (vf > 0) ctx.fillText(vf, xF + barW / 2, yF - 6);

      // Male Bar
      ctx.fillStyle = sportsData.colorMale;
      drawBar(ctx, xM, yM, barW, hM);
      ctx.fillStyle = '#ffffff';
      if (vm > 0) ctx.fillText(vm, xM + barW / 2, yM - 6);

      // Label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px "Segoe UI"';
      ctx.textBaseline = 'top';
      ctx.fillText(cat, groupCenter, margin.top + chartH + 10);
    });

  } else {
    // Horizontal Bar Chart
    const margin = { top: 60, right: 40, bottom: 50, left: 100 };
    const chartW = w - margin.left - margin.right;
    const chartH = h - margin.top - margin.bottom;

    // X Axis Grid
    ctx.font = '12px "Segoe UI"';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let v = 0; v <= maxVal; v += 2) {
      const x = margin.left + (v / maxVal) * chartW;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartH);
      ctx.stroke();

      ctx.fillStyle = '#94a3b8';
      ctx.fillText(v, x, margin.top + chartH + 8);
    }

    // Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartH);
    ctx.lineTo(margin.left + chartW, margin.top + chartH);
    ctx.stroke();

    const groupH = chartH / cats.length;
    const barH = 18;

    cats.forEach((cat, idx) => {
      const groupCenter = margin.top + idx * groupH + groupH / 2;
      const yF = groupCenter - barH - 2;
      const yM = groupCenter + 2;

      const vf = fSeries[idx];
      const vm = mSeries[idx];

      const wF = (vf / maxVal) * chartW;
      const wM = (vm / maxVal) * chartH;

      ctx.fillStyle = sportsData.colorFemale;
      ctx.fillRect(margin.left, yF, wF, barH);
      if (vf > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Segoe UI"';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(vf, margin.left + wF + 6, yF + barH / 2);
      }

      ctx.fillStyle = sportsData.colorMale;
      ctx.fillRect(margin.left, yM, wM, barH);
      if (vm > 0) {
        ctx.fillStyle = '#ffffff';
        ctx.fillText(vm, margin.left + wM + 6, yM + barH / 2);
      }

      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px "Segoe UI"';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(cat, margin.left - 12, groupCenter);
    });
  }
}

function drawBar(ctx, x, y, w, h) {
  if (w <= 0 || h <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + 4);
  ctx.quadraticCurveTo(x, y, x + 4, y);
  ctx.lineTo(x + w - 4, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + 4);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

// ==================== 4. LAB 2: EXPERIMENTAL ENGINES (9.37 & 9.38) ====================
function run100Marbles() {
  sounds.playRoll();
  let blackCount = 0;
  // Bag: 7 black, 3 white (probability = 7/10 = 0.7)
  for (let i = 0; i < 100; i++) {
    if (Math.random() < 0.7) blackCount++;
  }

  const whiteCount = 100 - blackCount;
  const resultEl = document.getElementById('marble100Result');
  resultEl.innerHTML = `
    Đen: <span style="color:#38bdf8;">${blackCount} lần</span> (${blackCount}%) &nbsp;|&nbsp;
    Trắng: <span style="color:#cbd5e1;">${whiteCount} lần</span> (${whiteCount}%)
    <div style="font-size:0.9rem; font-weight:normal; color:#94a3b8; margin-top:4px;">
      (Minh trong SGK làm ra: 58 lần bi đen = 58%)
    </div>
  `;

  awardXP(20);
  checkBadge(2); // Badge 3: Bậc thầy bi đen bi trắng
}

function pick2Rewards() {
  sounds.playClick();
  // Items in box: 2 Pencils (C1, C2), 3 Pens (B1, B2, B3)
  const box = ['Chì', 'Chì', 'Bi', 'Bi', 'Bi'];
  // Shuffle and pick 2
  const shuffled = [...box].sort(() => Math.random() - 0.5);
  const item1 = shuffled[0];
  const item2 = shuffled[1];

  let outcomeName = '';
  if (item1 === 'Chì' && item2 === 'Chì') {
    outcomeName = '2 chiếc Bút Chì ✏️✏️';
  } else if (item1 === 'Bi' && item2 === 'Bi') {
    outcomeName = '2 chiếc Bút Bi 🖊️🖊️';
  } else {
    outcomeName = '1 Bút Chì & 1 Bút Bi ✏️🖊️';
  }

  const resultEl = document.getElementById('rewardResult');
  resultEl.innerHTML = `
    Bạn nhận được: <strong style="color:#fbbf24;">${outcomeName}</strong>
    <div style="font-size:0.85rem; font-weight:normal; color:#cbd5e1; margin-top:4px;">
      (Thỏa mãn 1 trong 3 kết quả có thể của Bài 9.38!)
    </div>
  `;

  awardXP(20);
  checkBadge(3); // Badge 4: Thợ mở quà
}

// ==================== 5. SGK ARENA (10 COMPREHENSIVE QUESTIONS 9.33 - 9.38) ====================
const quizQuestions = [
  {
    badge: 'Bài tập 9.33a (Trang 98)',
    text: 'Để tìm kiếm thông tin: "Năm quốc gia nào có diện tích lớn nhất?", Nam nên lựa chọn cách thu thập dữ liệu nào tối ưu nhất?',
    options: [
      'Lập phiếu hỏi các bạn trong trường học.',
      'Tìm kiếm, tra cứu trên Internet hoặc sách báo, niên giám địa lý thế giới.',
      'Đo đạc trực tiếp bằng thước dây.',
      'Tung đồng xu để dự đoán.'
    ],
    correct: 1,
    explanation: 'Dữ liệu về diện tích quốc gia là số liệu địa lý đã được các tổ chức thế giới thống kê chính thức. Cách thu thập tối ưu nhất là tìm kiếm trên Internet hoặc sách báo, niên giám uy tín.'
  },
  {
    badge: 'Bài tập 9.33b (Trang 98)',
    text: 'Để biết "Có bao nhiêu bạn trong lớp có đồng hồ đeo tay?", Nam nên lựa chọn cách thu thập dữ liệu nào?',
    options: [
      'Tìm kiếm trên Google.',
      'Quan sát trực tiếp các bạn trong lớp hoặc hỏi từng bạn trong lớp.',
      'Xem lại học bạ của lớp năm ngoái.',
      'Tra cứu niên giám thống kê quốc gia.'
    ],
    correct: 1,
    explanation: 'Đối tượng điều tra thuộc phạm vi nội bộ lớp học và có thể kiểm tra thực tế ngay lập tức, do đó phương pháp quan sát trực tiếp hoặc hỏi trực tiếp là phù hợp và chính xác nhất.'
  },
  {
    badge: 'Bài tập 9.33c (Trang 98)',
    text: 'Để biết "Trong tuần trước, tổ nào trong lớp có nhiều lượt đi học muộn nhất?", Nam nên thu thập dữ liệu từ nguồn nào?',
    options: [
      'Tra cứu sổ theo dõi của lớp trưởng, sổ cờ đỏ hoặc sổ chủ nhiệm.',
      'Tìm kiếm trên mạng xã hội.',
      'Tự ước lượng dựa vào cảm tính cá nhân.',
      'Hỏi các bác bảo vệ ở trường khác.'
    ],
    correct: 0,
    explanation: 'Lượt đi học muộn của tuần trước là sự việc trong quá khứ đã được ghi chép lại. Nguồn dữ liệu đáng tin cậy nhất là sổ theo dõi của lớp trưởng, sổ cờ đỏ hoặc giáo viên chủ nhiệm.'
  },
  {
    badge: 'Bài tập 9.35a (Trang 98)',
    text: 'Một túi đựng 2 quả bóng màu xanh, 4 quả bóng màu vàng và 1 quả bóng màu đỏ có cùng kích thước. Nam lấy ngẫu nhiên một quả bóng. Quả bóng Nam lấy ra có thể có những màu nào?',
    options: [
      'Chỉ có thể có màu vàng vì số bóng vàng nhiều nhất.',
      'Có thể có màu xanh, màu vàng hoặc màu đỏ.',
      'Chỉ có thể có màu xanh hoặc màu đỏ.',
      'Có thể có màu tím hoặc màu cam.'
    ],
    correct: 1,
    explanation: 'Trong túi có 3 loại màu bóng: xanh, vàng và đỏ. Do đó khi lấy ngẫu nhiên 1 quả bóng thì các kết quả có thể về màu sắc là: màu xanh, màu vàng hoặc màu đỏ.'
  },
  {
    badge: 'Bài tập 9.35d (Trang 98)',
    text: 'Nam thực hiện thí nghiệm lấy bóng 20 lần (mỗi lần lấy xong lại trả bóng vào túi). Biết trong 20 lần đó, có 10 lần Nam lấy được bóng màu vàng. Xác suất thực nghiệm của sự kiện "Quả bóng lấy ra có màu vàng" là:',
    options: [
      '10/20 = 50%',
      '4/7',
      '20/10 = 2',
      '10/100 = 10%'
    ],
    correct: 0,
    explanation: 'Số lần lấy bóng n = 20, số lần xuất hiện bóng màu vàng k = 10. Xác suất thực nghiệm = k / n = 10/20 = 1/2 = 50%.'
  },
  {
    badge: 'Bài tập 9.36b (Trang 98)',
    text: 'Dựa vào Bảng 9.11: Môn thể thao nào được các bạn NAM yêu thích nhất và môn nào được các bạn NỮ yêu thích nhất?',
    options: [
      'Nam: Bóng đá (6 bạn); Nữ: Bơi lội (7 bạn).',
      'Nam: Cầu lông (5 bạn); Nữ: Bóng đá (3 bạn).',
      'Nam: Bóng rổ (3 bạn); Nữ: Bơi lội (7 bạn).',
      'Cả nam và nữ đều thích bóng đá nhất.'
    ],
    correct: 0,
    explanation: 'Nhìn vào Bảng 9.11: Ở hàng Nam, số bạn thích Bóng đá cao nhất (6 bạn). Ở hàng Nữ, số bạn thích Bơi lội cao nhất (7 bạn).'
  },
  {
    badge: 'Bài tập 9.36 (Trang 98)',
    text: 'Quan sát Bảng 9.11: Môn thể thao nào có số bạn nam và số bạn nữ yêu thích BẰNG NHAU?',
    options: [
      'Bóng đá (Nữ: 3, Nam: 6)',
      'Cầu lông (Nữ: 5, Nam: 5)',
      'Bơi lội (Nữ: 7, Nam: 2)',
      'Bóng rổ (Nữ: 1, Nam: 3)'
    ],
    correct: 1,
    explanation: 'Môn Cầu lông có đúng 5 bạn nữ và 5 bạn nam yêu thích (5 = 5), hai cột trên biểu đồ cột kép có chiều cao bằng nhau.'
  },
  {
    badge: 'Bài tập 9.37 (Trang 98)',
    text: 'Minh bỏ 7 viên bi đen và 3 viên bi trắng vào túi. Lấy ra ngẫu nhiên 100 lần có hoàn lại, Minh thấy có 58 lần lấy được viên bi màu đen. Xác suất thực nghiệm của sự kiện "Minh lấy được viên bi màu đen" là:',
    options: [
      '58/100 = 58%',
      '7/10 = 70%',
      '42/100 = 42%',
      '58/70'
    ],
    correct: 0,
    explanation: 'Tổng số lần thực hiện thí nghiệm n = 100. Số lần lấy được viên bi đen k = 58. Xác suất thực nghiệm = k / n = 58/100 = 58%.'
  },
  {
    badge: 'Bài tập 9.38 (Trang 98)',
    text: 'Trong hộp có 5 phần thưởng: 2 bút chì giống nhau và 3 bút bi cùng loại. Quỳnh chọn ngẫu nhiên hai phần thưởng trong hộp. Hãy liệt kê các kết quả có thể xảy ra về loại bút:',
    options: [
      'Chỉ có 1 kết quả là 2 chiếc bút bi.',
      'Có 3 kết quả có thể: Cả 2 bút chì; Cả 2 bút bi; 1 bút chì và 1 bút bi.',
      'Có 5 kết quả có thể tương ứng 5 chiếc bút.',
      'Có 2 kết quả có thể: 2 bút chì hoặc 2 bút bi.'
    ],
    correct: 1,
    explanation: 'Khi chọn 2 cây bút từ hộp gồm bút chì và bút bi, ta có đúng 3 trường hợp về chủng loại: (1) Rút được 2 bút chì; (2) Rút được 2 bút bi; (3) Rút được 1 bút chì và 1 bút bi.'
  },
  {
    badge: 'Tổng hợp Toàn Chương IX',
    text: 'Ưu điểm nổi bật nhất của biểu đồ cột kép so với biểu đồ cột đơn khi trình bày dữ liệu là gì?',
    options: [
      'Có nhiều màu sắc sặc sỡ hơn.',
      'Cho phép so sánh trực tiếp, đối chiếu song song hai nhóm dữ liệu cùng loại trên từng đối tượng.',
      'Không cần phải chia tỉ lệ trên trục số lượng.',
      'Luôn có giá trị xác suất lớn hơn 1.'
    ],
    correct: 1,
    explanation: 'Biểu đồ cột kép đặt 2 cột của hai nhóm kề sát nhau tại mỗi đối tượng, giúp người đọc nhìn thấy ngay sự chênh lệch, ưu thế và xu hướng so sánh mà biểu đồ cột đơn không thể hiện trực tiếp được.'
  }
];

function buildQuizUI() {
  const container = document.getElementById('quizContainer');
  if (!container) return;

  container.innerHTML = '';

  quizQuestions.forEach((q, idx) => {
    const qBox = document.createElement('div');
    qBox.className = 'question-box';
    qBox.id = `qbox-${idx}`;

    const answered = state.answeredQuestions[idx];

    let optHtml = '';
    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, oIdx) => {
      let extraClass = '';
      if (answered) {
        if (oIdx === q.correct) extraClass = 'correct';
        else if (oIdx === answered.chosen && !answered.correct) extraClass = 'wrong';
      }

      optHtml += `
        <button class="opt-btn ${extraClass}" data-q="${idx}" data-opt="${oIdx}" ${answered ? 'disabled' : ''}>
          <span class="opt-letter">${letters[oIdx]}</span>
          <span>${opt}</span>
        </button>
      `;
    });

    const isExpShown = answered ? 'show' : '';

    qBox.innerHTML = `
      <span class="q-badge">${q.badge}</span>
      <div class="q-text"><strong>Câu ${idx + 1}:</strong> ${q.text}</div>
      <div class="q-options">${optHtml}</div>
      <div class="explanation-card ${isExpShown}" id="exp-${idx}">
        <div class="exp-title">💡 Lời Giải Chi Tiết SGK:</div>
        <div class="exp-desc">${q.explanation}</div>
      </div>
    `;

    container.appendChild(qBox);
  });

  container.querySelectorAll('.opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qIdx = parseInt(btn.dataset.q);
      const optIdx = parseInt(btn.dataset.opt);
      handleAnswer(qIdx, optIdx);
    });
  });
}

function handleAnswer(qIdx, optIdx) {
  if (state.answeredQuestions[qIdx]) return;

  sounds.init();
  const q = quizQuestions[qIdx];
  const isCorrect = (optIdx === q.correct);

  state.answeredQuestions[qIdx] = {
    chosen: optIdx,
    correct: isCorrect
  };

  if (isCorrect) {
    sounds.playCorrect();
    state.streak++;
    state.arenaScore += 10;
    awardXP(25 + state.streak * 5);
  } else {
    sounds.playWrong();
    state.streak = 0;
    awardXP(5);
  }

  // Badges
  if ((qIdx === 0 || qIdx === 1 || qIdx === 2) && isCorrect) checkBadge(0); // Badge 1: Điều tra dữ liệu
  if ((qIdx === 5 || qIdx === 6) && isCorrect) checkBadge(1); // Badge 2: Thống kê thể thao
  if (qIdx === 7 && isCorrect) checkBadge(2); // Badge 3: Bi đen bi trắng
  if (qIdx === 8 && isCorrect) checkBadge(3); // Badge 4: Mở quà

  if (getCorrectArenaCount() === 10) {
    checkBadge(4); // Badge 5: Đại kiện tướng Chương IX
    sounds.playLevelUp();
  }

  buildQuizUI();
  updateHUD();
}

// ==================== 6. EVENT LISTENERS ====================
function setupListeners() {
  // Tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      sounds.playClick();
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      if (target) target.classList.add('active');

      if (tab.dataset.tab === 'labs') {
        setTimeout(drawReviewChart, 50);
      }
    });
  });

  // Avatar button
  document.getElementById('avatarBtn').addEventListener('click', () => {
    sounds.playClick();
    state.avatarIndex = (state.avatarIndex + 1) % avatars.length;
    updateHUD();
  });

  // Sound toggle
  const soundBtn = document.getElementById('soundToggle');
  soundBtn.addEventListener('click', () => {
    sounds.enabled = !sounds.enabled;
    soundBtn.textContent = sounds.enabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
    if (sounds.enabled) sounds.playClick();
  });

  // Reset Progress
  document.getElementById('resetProgress').addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn đặt lại toàn bộ điểm và bài tập Đấu trường Ôn tập Chương IX không?')) {
      state = { ...defaultState };
      saveState();
      updateHUD();
      buildQuizUI();
      sounds.playClick();
    }
  });

  // Orientation toggle
  const orientBtn = document.getElementById('toggleLabOrientationBtn');
  orientBtn.addEventListener('click', () => {
    sounds.playClick();
    state.orientation = state.orientation === 'vertical' ? 'horizontal' : 'vertical';
    orientBtn.textContent = state.orientation === 'vertical' ? '🔄 Đổi dạng: Cột Đứng' : '🔄 Đổi dạng: Thanh Ngang';
    drawReviewChart();
  });

  // Find max sports button
  const findBtn = document.getElementById('findMaxSportBtn');
  const insightBox = document.getElementById('sportInsightBox');
  findBtn.addEventListener('click', () => {
    sounds.playClick();
    insightBox.style.display = 'block';
    insightBox.innerHTML = `
      <h4>🎯 Kết quả phân tích Bảng 9.11:</h4>
      <p>• <strong>Bạn Nam yêu thích nhất:</strong> Môn <strong style="color:#38bdf8;">Bóng đá</strong> (6 bạn chọn).<br>
         • <strong>Bạn Nữ yêu thích nhất:</strong> Môn <strong style="color:#ec4899;">Bơi lội</strong> (7 bạn chọn).<br>
         • <strong>Môn cả hai giới cân bằng:</strong> Môn <strong style="color:#fbbf24;">Cầu lông</strong> (đều có 5 bạn nam và 5 bạn nữ yêu thích)!</p>
    `;
    awardXP(15);
  });

  // Lab 2 Experiments
  document.getElementById('run100MarblesBtn').addEventListener('click', run100Marbles);
  document.getElementById('pick2RewardsBtn').addEventListener('click', pick2Rewards);

  // Certificate Unlock
  const certBtn = document.getElementById('unlockCertBtn');
  const certPaper = document.getElementById('certificatePaper');
  certBtn.addEventListener('click', () => {
    sounds.playClick();
    const correctCount = getCorrectArenaCount();
    if (correctCount < 7) {
      alert(`Bạn cần đạt ít nhất 7/10 câu hỏi Đấu trường SGK để mở khóa Giấy Chứng Nhận! (Hiện tại: ${correctCount}/10)`);
      return;
    }

    certPaper.classList.add('show');
    const today = new Date();
    document.getElementById('certDate').textContent = `Ngày cấp: ${today.toLocaleDateString('vi-VN')}`;
    sounds.playLevelUp();
    certPaper.scrollIntoView({ behavior: 'smooth' });
  });

  window.addEventListener('resize', () => {
    drawReviewChart();
  });
}

// ==================== 7. INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateHUD();
  buildQuizUI();
  setupListeners();

  setTimeout(() => {
    drawReviewChart();
  }, 100);
});
