/**
 * Bài 43: Xác suất thực nghiệm - Toán 6 Tập 2 Kết Nối Tri Thức
 * Gamified Interactive Web Application
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

  playSimTick() {
    this.playTone(400 + Math.random() * 200, 'sine', 0.03, 0.05);
  }
}

const sounds = new SoundManager();

// ==================== 2. STATE MANAGEMENT ====================
const STORAGE_KEY = 'toan6_bai43_data';

const avatars = ['🎯', '🎲', '🦊', '🦁', '🐯', '🐼', '🦉', '🚀', '🤖', '🦄'];

const defaultState = {
  avatarIndex: 0,
  xp: 0,
  streak: 0,
  stars: 1,
  badges: [false, false, false, false, false],
  arenaScore: 0,
  answeredQuestions: {}
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
    'Tập Sự Thực Nghiệm',
    'Thợ Đo Khả Năng',
    'Chuyên Gia Tỉ Số k/n',
    'Nhà Phân Tích Quy Luật Lớn',
    'Đại Sư Xác Suất Thực Nghiệm'
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

// ==================== 3. LAB 1: PROBABILITY SIMULATOR ====================
const scenarios = {
  xucXacChan: {
    name: 'Xúc xắc ra mặt chẵn (2, 4, 6)',
    theoryProb: 0.5,
    theoryStr: '50% (3/6)',
    runSingle: () => {
      const roll = Math.floor(Math.random() * 6) + 1;
      return roll % 2 === 0;
    }
  },
  tamBiaXanh: {
    name: 'Quay trúng ô màu Xanh (Hình 9.30)',
    theoryProb: 17 / 24, // 0.7083
    theoryStr: '70,8% (17/24)',
    runSingle: () => {
      // 17 parts green, 7 parts yellow
      return Math.random() < (17 / 24);
    }
  },
  rutBiDo: {
    name: 'Lấy viên bi màu đỏ (Bài 9.31)',
    theoryProb: 13 / 30, // 0.4333
    theoryStr: '43,3% (13/30)',
    runSingle: () => {
      return Math.random() < (13 / 30);
    }
  },
  haiXucXacHon6: {
    name: 'Tổng 2 xúc xắc lớn hơn 6 (Luyện tập trang 95)',
    theoryProb: 21 / 36, // 0.5833
    theoryStr: '58,3% (21/36)',
    runSingle: () => {
      const d1 = Math.floor(Math.random() * 6) + 1;
      const d2 = Math.floor(Math.random() * 6) + 1;
      return (d1 + d2) > 6;
    }
  }
};

let currentScenarioKey = 'xucXacChan';
let simN = 0;
let simK = 0;
let simHistory = []; // stores k/n ratios at intervals for the line chart

const canvas = document.getElementById('simCanvas');
const ctx = canvas.getContext('2d');

function runSimulation(addedCount) {
  sounds.playClick();
  const scen = scenarios[currentScenarioKey];

  for (let i = 0; i < addedCount; i++) {
    simN++;
    if (scen.runSingle()) {
      simK++;
    }
    if (simN % Math.max(1, Math.floor(addedCount / 50)) === 0 || i === addedCount - 1) {
      simHistory.push({ n: simN, ratio: simK / simN });
    }
  }

  if (simHistory.length > 100) {
    // Keep reasonable history size
    const step = Math.ceil(simHistory.length / 80);
    simHistory = simHistory.filter((_, idx) => idx % step === 0 || idx === simHistory.length - 1);
  }

  awardXP(Math.min(30, Math.round(addedCount / 10)));
  if (simN >= 100) checkBadge(1); // Badge 2: Nhà mô phỏng

  updateSimUI();
  drawSimCanvas();
}

function resetSim() {
  sounds.playClick();
  simN = 0;
  simK = 0;
  simHistory = [];
  updateSimUI();
  drawSimCanvas();
}

function updateSimUI() {
  const scen = scenarios[currentScenarioKey];
  document.getElementById('statN').textContent = simN;
  document.getElementById('statK').textContent = simK;

  const ratio = simN > 0 ? (simK / simN) : 0;
  document.getElementById('statRatio').textContent = simN > 0 ? `${(ratio * 100).toFixed(1)}% (${simK}/${simN})` : '0%';
  document.getElementById('statTheory').textContent = scen.theoryStr;
}

function drawSimCanvas() {
  if (!canvas || !ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const scen = scenarios[currentScenarioKey];

  // Title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`Mô Phỏng Thực Nghiệm: ${scen.name}`, w / 2, 26);

  // Divide canvas into 2 parts:
  // Left: Bar chart (Success vs Failure)
  // Right: Convergence Line Chart
  const leftW = w * 0.36;
  const rightW = w * 0.58;
  const marginY = 50;
  const chartH = h - marginY - 40;

  // --- Left: Bar Chart ---
  const failK = simN - simK;
  const maxBar = Math.max(simK, failK, 1);

  const barW = 55;
  const barY = marginY + chartH;

  const bar1H = (simK / maxBar) * (chartH - 40);
  const bar2H = (failK / maxBar) * (chartH - 40);

  // Bar 1: Success (k)
  const x1 = leftW * 0.3;
  ctx.fillStyle = '#10b981';
  drawSimpleRoundedRect(ctx, x1, barY - bar1H, barW, bar1H, 4);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 12px "Segoe UI"';
  ctx.textAlign = 'center';
  ctx.fillText(`${simK}`, x1 + barW / 2, barY - bar1H - 6);
  ctx.fillStyle = '#34d399';
  ctx.fillText('Xảy ra (k)', x1 + barW / 2, barY + 18);

  // Bar 2: Failure (n - k)
  const x2 = leftW * 0.7;
  ctx.fillStyle = '#ef4444';
  drawSimpleRoundedRect(ctx, x2, barY - bar2H, barW, bar2H, 4);
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`${failK}`, x2 + barW / 2, barY - bar2H - 6);
  ctx.fillStyle = '#f87171';
  ctx.fillText('Không (n-k)', x2 + barW / 2, barY + 18);

  // Separator line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(leftW + 15, marginY);
  ctx.lineTo(leftW + 15, barY + 20);
  ctx.stroke();

  // --- Right: Convergence Line Chart ---
  const lineStartX = leftW + 50;
  const lineChartW = w - lineStartX - 30;

  // Horizontal Gridlines for 0%, 25%, 50%, 75%, 100%
  const levels = [0, 0.25, 0.5, 0.75, 1.0];
  ctx.font = '11px "Segoe UI"';
  ctx.textAlign = 'right';

  levels.forEach(lv => {
    const y = marginY + chartH - lv * chartH;
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.beginPath();
    ctx.moveTo(lineStartX, y);
    ctx.lineTo(lineStartX + lineChartW, y);
    ctx.stroke();

    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`${Math.round(lv * 100)}%`, lineStartX - 8, y + 4);
  });

  // Theory Target Dashed Line
  const theoryY = marginY + chartH - scen.theoryProb * chartH;
  ctx.save();
  ctx.setLineDash([5, 5]);
  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lineStartX, theoryY);
  ctx.lineTo(lineStartX + lineChartW, theoryY);
  ctx.stroke();
  ctx.restore();

  ctx.fillStyle = '#38bdf8';
  ctx.textAlign = 'left';
  ctx.fillText(`Kỳ vọng lý thuyết: ${scen.theoryStr}`, lineStartX + 10, Math.max(marginY + 14, theoryY - 6));

  // Plot Experimental Ratio Curve
  if (simHistory.length > 1) {
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2.5;
    ctx.beginPath();

    simHistory.forEach((pt, idx) => {
      const px = lineStartX + (idx / (simHistory.length - 1)) * lineChartW;
      const py = marginY + chartH - pt.ratio * chartH;

      if (idx === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    });
    ctx.stroke();

    // Final point circle
    const last = simHistory[simHistory.length - 1];
    const lastX = lineStartX + lineChartW;
    const lastY = marginY + chartH - last.ratio * chartH;

    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, 2 * Math.PI);
    ctx.fillStyle = '#fbbf24';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (simN === 0) {
    ctx.fillStyle = '#64748b';
    ctx.textAlign = 'center';
    ctx.font = 'italic 13px "Segoe UI"';
    ctx.fillText('Bấm nút "+10 lần", "+50 lần"... để chạy mô phỏng đường cong hội tụ!', lineStartX + lineChartW / 2, marginY + chartH / 2);
  }
}

function drawSimpleRoundedRect(ctx, x, y, w, h, r) {
  if (w <= 0 || h <= 0) return;
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

// ==================== 4. LAB 2: EVEN VS ODD GAME (TRANG 97) ====================
let scoreE = 0;
let scoreO = 0;

function rollDicePair() {
  sounds.playClick();
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const prod = d1 * d2;
  const isEven = (prod % 2 === 0);

  if (isEven) {
    scoreE++;
  } else {
    scoreO++;
  }

  updatePairScores();

  if (scoreE >= 20 || scoreO >= 20) {
    const winner = scoreE >= 20 ? 'Người chơi E (Tích Chẵn)' : 'Người chơi O (Tích Lẻ)';
    alert(`🎉 Chúc mừng! ${winner} đã chạm mốc 20 điểm và giành chiến thắng!`);
    checkBadge(2); // Badge 3: Trọng tài tích chẵn lẻ
    awardXP(50);
    sounds.playLevelUp();
    scoreE = 0;
    scoreO = 0;
    updatePairScores();
  }
}

function autoPlayMatch() {
  sounds.playClick();
  scoreE = 0;
  scoreO = 0;

  while (scoreE < 20 && scoreO < 20) {
    const d1 = Math.floor(Math.random() * 6) + 1;
    const d2 = Math.floor(Math.random() * 6) + 1;
    if ((d1 * d2) % 2 === 0) scoreE++;
    else scoreO++;
  }

  updatePairScores();
  const winner = scoreE >= 20 ? 'Người chơi E (Tích Chẵn)' : 'Người chơi O (Tích Lẻ)';
  alert(`⚡ Trận đấu kết thúc! ${winner} đã thắng với tỉ số E: ${scoreE} - O: ${scoreO}!`);
  checkBadge(2);
  awardXP(30);
  sounds.playLevelUp();
}

function updatePairScores() {
  document.getElementById('scoreE').textContent = `${scoreE} / 20`;
  document.getElementById('scoreO').textContent = `${scoreO} / 20`;
}

// ==================== 5. SGK ARENA (10 COMPREHENSIVE QUESTIONS) ====================
const quizQuestions = [
  {
    badge: 'Khái niệm SGK (Trang 94)',
    text: 'Khả năng xảy ra một sự kiện trong thí nghiệm hoặc trò chơi được thể hiện bằng con số trong phạm vi nào?',
    options: [
      'Từ -1 đến 1',
      'Từ 0 đến 1 (hay từ 0% đến 100%)',
      'Từ 1 đến 100',
      'Bất kỳ số nguyên dương nào'
    ],
    correct: 1,
    explanation: 'SGK trang 94 nêu rõ: Khả năng xảy ra một sự kiện được thể hiện bằng một con số từ 0 đến 1 (hay từ 0% đến 100%).'
  },
  {
    badge: 'Hình 9.28 - Thước đo (Trang 94)',
    text: 'Một sự kiện có khả năng xảy ra bằng 0 mang ý nghĩa gì?',
    options: [
      'Sự kiện đó luôn luôn xảy ra trong mọi lần thử.',
      'Sự kiện đó không bao giờ xảy ra (sự kiện không thể).',
      'Sự kiện đó có xác suất là 50%.',
      'Số lần thử nghiệm bị lỗi.'
    ],
    correct: 1,
    explanation: 'Hình 9.28 chỉ rõ: Khả năng bằng 0 (hay 0%) có nghĩa sự kiện đó không bao giờ xảy ra. Khả năng bằng 1 (hay 100%) có nghĩa sự kiện đó chắc chắn xảy ra.'
  },
  {
    badge: 'Công thức k/n (Trang 94)',
    text: 'Nếu thực hiện một trò chơi n lần, trong đó sự kiện A xảy ra đúng k lần, thì xác suất thực nghiệm của sự kiện A được tính bằng công thức:',
    options: [
      'k + n',
      'k / n',
      'n / k',
      'k × n'
    ],
    correct: 1,
    explanation: 'Công thức vàng SGK trang 94: Xác suất thực nghiệm = (Số lần sự kiện xảy ra) / (Tổng số lần thực hiện) = k / n.'
  },
  {
    badge: 'Ví dụ SGK (Trang 95)',
    text: 'Trong buổi thực hành đo thể tích, lớp 6A có 40 học sinh thực hiện phép đo thì có 35 học sinh đo thành công. Xác suất thực nghiệm của sự kiện "Phép đo được thực hiện thành công" là:',
    options: [
      '35/40 = 87,5%',
      '40/35 = 114%',
      '5/40 = 12,5%',
      '35/100 = 35%'
    ],
    correct: 0,
    explanation: 'Tổng số lần thử n = 40, số lần thành công k = 35. Xác suất thực nghiệm = k / n = 35/40 = 7/8 = 87,5%.'
  },
  {
    badge: 'Luyện tập SGK (Trang 95)',
    text: 'An gieo hai con xúc xắc cùng lúc 80 lần. Nếu tổng số chấm lớn hơn 6 thì An thắng. Biết số lần tổng chấm lớn hơn 6 là: 14 + 12 + 9 + 6 + 4 + 3 = 48 lần. Xác suất thực nghiệm của sự kiện An thắng là:',
    options: [
      '48/80 = 60%',
      '32/80 = 40%',
      '48/100 = 48%',
      '6/80 = 7,5%'
    ],
    correct: 0,
    explanation: 'Tổng số lần gieo n = 80. Số lần An thắng k = 48. Xác suất thực nghiệm = 48/80 = 3/5 = 60%.'
  },
  {
    badge: 'Tranh luận Vuông & Tròn (Trang 95)',
    text: 'Vuông gieo đồng xu 50 lần thấy 30 lần mặt sấp (30/50 = 60%). Tròn gieo 100 lần thấy 55 lần mặt sấp (55/100 = 55%). Bạn nào phát biểu đúng?',
    options: [
      'Chỉ có bạn Vuông nói đúng.',
      'Chỉ có bạn Tròn nói đúng vì gieo nhiều lần hơn.',
      'Cả hai bạn đều nói đúng kết quả xác suất thực nghiệm của riêng mình.',
      'Cả hai bạn đều tính sai vì xác suất đồng xu bắt buộc phải là 50%.'
    ],
    correct: 2,
    explanation: 'Xác suất thực nghiệm phụ thuộc vào từng người và số lần thực hiện độc lập. Cả Vuông (30/50) và Tròn (55/100) đều phản ánh trung thực kết quả phép thử của mình nên cả hai đều ĐÚNG.'
  },
  {
    badge: 'Bài tập 9.29a (Trang 96)',
    text: 'Minh gieo xúc xắc 100 lần. Số lần các mặt chẵn xuất hiện gồm: mặt 2 chấm (20 lần), mặt 4 chấm (22 lần), mặt 6 chấm (15 lần). Xác suất thực nghiệm sự kiện "Số chấm xuất hiện là số chẵn" là:',
    options: [
      '57/100 = 57%',
      '43/100 = 43%',
      '20/100 = 20%',
      '50/100 = 50%'
    ],
    correct: 0,
    explanation: 'Số lần xuất hiện mặt chẵn k = 20 + 22 + 15 = 57 lần. Tổng số lần gieo n = 100. Xác suất thực nghiệm = 57/100 = 57%.'
  },
  {
    badge: 'Bài tập 9.29b (Trang 96)',
    text: 'Trong 100 lần gieo của Minh, các mặt xuất hiện lớn hơn 2 gồm mặt 3 (18 lần), mặt 4 (22 lần), mặt 5 (10 lần), mặt 6 (15 lần). Xác suất thực nghiệm sự kiện "Số chấm xuất hiện lớn hơn 2" là:',
    options: [
      '65/100 = 65%',
      '35/100 = 35%',
      '75/100 = 75%',
      '50/100 = 50%'
    ],
    correct: 0,
    explanation: 'Số lần xuất hiện mặt > 2 là: k = 18 + 22 + 10 + 15 = 65 lần. Xác suất thực nghiệm = 65/100 = 65%.'
  },
  {
    badge: 'Bài tập 9.30 (Trang 96)',
    text: 'An quay tấm bìa và ghi chép: Ô Xanh có 17 gạch kiểm đếm, Ô Vàng có 7 gạch kiểm đếm. Xác suất thực nghiệm của sự kiện "Mũi tên chỉ vào ô màu xanh" là:',
    options: [
      '17/24',
      '7/24',
      '17/7',
      '17/100'
    ],
    correct: 0,
    explanation: 'Tổng số lần quay n = 17 + 7 = 24 lần. Số lần vào ô Xanh k = 17. Xác suất thực nghiệm = 17/24.'
  },
  {
    badge: 'Bài tập 9.32 (Trang 96)',
    text: 'Bình lấy bóng 100 lần: Xanh: 43, Đỏ: 22, Tím: 18, Vàng: 17. Xác suất thực nghiệm của sự kiện "Quả bóng được lấy ra KHÔNG là màu đỏ" là:',
    options: [
      '22/100 = 22%',
      '78/100 = 78%',
      '43/100 = 43%',
      '60/100 = 60%'
    ],
    correct: 1,
    explanation: 'Số bóng không phải màu đỏ = Tổng số bóng - Bóng đỏ = 100 - 22 = 78 lần (hoặc 43 + 18 + 17 = 78). Xác suất thực nghiệm = 78/100 = 78%.'
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
  if ((qIdx === 2 || qIdx === 3) && isCorrect) checkBadge(0); // Badge 1: Thợ rèn tỉ số
  if (qIdx === 4 && isCorrect) checkBadge(2); // Badge 3: Trọng tài tích chẵn lẻ
  if ((qIdx === 8 || qIdx === 9) && isCorrect) checkBadge(3); // Badge 4: Bậc thầy kiểm đếm

  if (getCorrectArenaCount() === 10) {
    checkBadge(4); // Badge 5: Đại sư
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
        setTimeout(drawSimCanvas, 50);
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
    if (confirm('Bạn có chắc muốn đặt lại toàn bộ điểm và bài tập Đấu trường Bài 43 không?')) {
      state = { ...defaultState };
      resetSim();
      scoreE = 0;
      scoreO = 0;
      updatePairScores();
      saveState();
      updateHUD();
      buildQuizUI();
      sounds.playClick();
    }
  });

  // Scenario buttons
  document.querySelectorAll('.btn-sim').forEach(btn => {
    btn.addEventListener('click', () => {
      sounds.playClick();
      document.querySelectorAll('.btn-sim').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      currentScenarioKey = btn.dataset.scenario;
      resetSim();
    });
  });

  // Roll simulation buttons
  document.querySelectorAll('[data-rolls]').forEach(btn => {
    btn.addEventListener('click', () => {
      const count = parseInt(btn.dataset.rolls);
      runSimulation(count);
    });
  });

  document.getElementById('resetSimBtn').addEventListener('click', resetSim);

  // Lab 2 Buttons
  document.getElementById('rollPairBtn').addEventListener('click', rollDicePair);
  document.getElementById('autoMatchBtn').addEventListener('click', autoPlayMatch);

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
    drawSimCanvas();
  });
}

// ==================== 7. INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateHUD();
  buildQuizUI();
  setupListeners();
  updateSimUI();

  setTimeout(() => {
    drawSimCanvas();
  }, 100);
});
