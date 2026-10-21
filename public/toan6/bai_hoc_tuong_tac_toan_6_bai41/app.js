/**
 * Bài 41: Biểu đồ cột kép - Toán 6 Tập 2 Kết Nối Tri Thức
 * Fully Gamified Interactive Web Application
 */

// ==================== 1. SOUND SYSTEM (Web Audio API) ====================
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
    this.playTone(523.25, 'triangle', 0.1, 0.25); // C5
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.25), 100); // E5
    setTimeout(() => this.playTone(783.99, 'triangle', 0.2, 0.25), 220); // G5
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
}

const sounds = new SoundManager();

// ==================== 2. STATE MANAGEMENT ====================
const STORAGE_KEY = 'toan6_bai41_data';

const avatars = ['🦊', '🦁', '🐯', '🐼', '🦉', '🚀', '🤖', '🦄', '🦅', '🐬'];

const defaultState = {
  avatarIndex: 0,
  xp: 0,
  streak: 0,
  stars: 1,
  badges: [false, false, false, false, false],
  arenaScore: 0,
  answeredQuestions: {}, // qIndex: { chosen, correct }
  labOrientation: 'vertical', // 'vertical' or 'horizontal'
  showBarValues: true,
  currentPreset: 'hocLuc'
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
  
  // Stars calculation based on XP and Arena
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

  // Title calculation
  const titles = [
    'Tập Sự Thống Kê',
    'Nhà Phân Tích Cột Kép',
    'Chuyên Gia Biểu Đồ Song Hành',
    'Thám Tử Dữ Liệu Đa Chiều',
    'Đại Kiện Tướng Cột Kép Toàn Năng'
  ];
  document.getElementById('userTitle').textContent = titles[Math.min(starCount - 1, 4)];

  // Update badges UI
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

  // Update Arena Progress
  const answeredCount = Object.keys(state.answeredQuestions).length;
  document.getElementById('arenaProgressText').textContent = `${answeredCount}/10`;
  document.getElementById('arenaProgressBar').style.width = `${(answeredCount / 10) * 100}%`;
  document.getElementById('arenaScore').textContent = state.arenaScore;

  // Save after update
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

// ==================== 3. DATASETS (SGK BÀI 41) ====================
const presets = {
  hocLuc: {
    title: 'Học lực của học sinh lớp 6A và lớp 6B (Hình 9.14)',
    series1Name: 'Lớp 6A',
    series2Name: 'Lớp 6B',
    unit: 'học sinh',
    categories: ['Giỏi', 'Khá', 'Trung bình', 'Yếu'],
    series1: [13, 16, 9, 2],
    series2: [9, 18, 10, 5],
    yStep: 5
  },
  messiRonaldo: {
    title: 'Số bàn thắng của L.Messi và C.Ronaldo (Hình 9.19)',
    series1Name: 'L.Messi',
    series2Name: 'C.Ronaldo',
    unit: 'bàn thắng',
    categories: ['Năm 2016', 'Năm 2017', 'Năm 2018'],
    series1: [59, 54, 51],
    series2: [55, 53, 49],
    yStep: 10
  },
  chieuCao: {
    title: 'Chiều cao trung bình của nam và nữ ở một số quốc gia châu Á (Hình 9.21)',
    series1Name: 'Nam',
    series2Name: 'Nữ',
    unit: 'cm',
    categories: ['Việt Nam', 'Singapore', 'Nhật Bản', 'Hàn Quốc'],
    series1: [162.1, 171.0, 172.0, 170.7],
    series2: [152.2, 160.0, 158.0, 157.4],
    yStep: 20
  },
  banQuat: {
    title: 'Số lượng quạt trần và quạt cây bán được năm 2018 (Hình 9.23)',
    series1Name: 'Quạt trần',
    series2Name: 'Quạt cây',
    unit: 'chiếc',
    categories: ['Th 1', 'Th 2', 'Th 3', 'Th 4', 'Th 5', 'Th 6', 'Th 7', 'Th 8', 'Th 9', 'Th 10', 'Th 11', 'Th 12'],
    series1: [11, 4, 8, 19, 35, 41, 37, 26, 21, 15, 17, 20],
    series2: [18, 13, 15, 39, 51, 49, 32, 25, 18, 13, 23, 17],
    yStep: 10
  },
  theThao: {
    title: 'Môn thể thao yêu thích của học sinh nam và nữ (Hình 9.24)',
    series1Name: 'Nam',
    series2Name: 'Nữ',
    unit: 'học sinh',
    categories: ['Bóng đá', 'Cầu lông', 'Cờ vua', 'Bóng bàn'],
    series1: [20, 15, 10, 17],
    series2: [5, 6, 12, 9],
    yStep: 5
  }
};

let activeData = JSON.parse(JSON.stringify(presets.hocLuc));

// ==================== 4. LAB 1: CANVAS CHART ENGINE ====================
const canvas = document.getElementById('chartCanvas');
const ctx = canvas.getContext('2d');
const tooltip = document.getElementById('chartTooltip');

let barHitBoxes = [];

function drawChart() {
  if (!canvas || !ctx) return;

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  barHitBoxes = [];

  const isVertical = state.labOrientation === 'vertical';
  const showValues = state.showBarValues;

  // Find max value
  const allValues = [...activeData.series1, ...activeData.series2];
  let maxVal = Math.max(...allValues, 10);
  const step = activeData.yStep || 10;
  maxVal = Math.ceil((maxVal * 1.15) / step) * step;

  // Chart title
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px "Segoe UI", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(activeData.title, width / 2, 28);

  // Colors
  const col1 = '#f59e0b'; // Amber Gold
  const col2 = '#06b6d4'; // Cyan Aqua
  const gridColor = 'rgba(255, 255, 255, 0.08)';
  const textColor = '#94a3b8';

  if (isVertical) {
    // ========== VERTICAL DUAL BAR CHART ==========
    const margin = { top: 60, right: 30, bottom: 65, left: 65 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    // Y Axis Grid & Labels
    const numSteps = Math.min(8, Math.round(maxVal / step));
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    for (let i = 0; i <= numSteps; i++) {
      const v = (maxVal / numSteps) * i;
      const y = margin.top + chartH - (v / maxVal) * chartH;

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(margin.left + chartW, y);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.fillText(v.toFixed(v % 1 === 0 ? 0 : 1), margin.left - 10, y);
    }

    // Y axis title
    ctx.save();
    ctx.translate(18, margin.top + chartH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.textAlign = 'center';
    ctx.fillStyle = '#38bdf8';
    ctx.font = 'bold 12px "Segoe UI", sans-serif';
    ctx.fillText(`Số lượng (${activeData.unit})`, 0, 0);
    ctx.restore();

    // Axes lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartH);
    ctx.lineTo(margin.left + chartW, margin.top + chartH);
    ctx.stroke();

    // Bars
    const groupCount = activeData.categories.length;
    const groupWidth = chartW / groupCount;
    const barWidth = Math.min(groupWidth * 0.36, 36);

    activeData.categories.forEach((cat, idx) => {
      const groupCenterX = margin.left + idx * groupWidth + groupWidth / 2;
      const x1 = groupCenterX - barWidth - 2;
      const x2 = groupCenterX + 2;

      const v1 = activeData.series1[idx];
      const v2 = activeData.series2[idx];

      const h1 = (v1 / maxVal) * chartH;
      const h2 = (v2 / maxVal) * chartH;

      const y1 = margin.top + chartH - h1;
      const y2 = margin.top + chartH - h2;

      // Draw Bar 1 (Col 1)
      ctx.fillStyle = col1;
      drawRoundedRect(ctx, x1, y1, barWidth, h1, 4, true);

      // Draw Bar 2 (Col 2)
      ctx.fillStyle = col2;
      drawRoundedRect(ctx, x2, y2, barWidth, h2, 4, true);

      // Record hit boxes for tooltips
      barHitBoxes.push({
        x: x1, y: y1, w: barWidth, h: h1,
        cat: cat, series: activeData.series1Name, val: v1, unit: activeData.unit
      });
      barHitBoxes.push({
        x: x2, y: y2, w: barWidth, h: h2,
        cat: cat, series: activeData.series2Name, val: v2, unit: activeData.unit
      });

      // Values above bars
      if (showValues) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(v1, x1 + barWidth / 2, Math.max(margin.top + 10, y1 - 6));
        ctx.fillText(v2, x2 + barWidth / 2, Math.max(margin.top + 10, y2 - 6));
      }

      // Category label on X axis
      ctx.fillStyle = '#e2e8f0';
      ctx.font = groupCount > 8 ? '10px "Segoe UI"' : '12px "Segoe UI"';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(cat, groupCenterX, margin.top + chartH + 10);
    });

  } else {
    // ========== HORIZONTAL DUAL BAR CHART ==========
    const margin = { top: 60, right: 40, bottom: 50, left: 110 };
    const chartW = width - margin.left - margin.right;
    const chartH = height - margin.top - margin.bottom;

    // X Axis Grid & Labels
    const numSteps = Math.min(8, Math.round(maxVal / step));
    ctx.font = '12px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';

    for (let i = 0; i <= numSteps; i++) {
      const v = (maxVal / numSteps) * i;
      const x = margin.left + (v / maxVal) * chartW;

      ctx.strokeStyle = gridColor;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, margin.top);
      ctx.lineTo(x, margin.top + chartH);
      ctx.stroke();

      ctx.fillStyle = textColor;
      ctx.fillText(v.toFixed(v % 1 === 0 ? 0 : 1), x, margin.top + chartH + 8);
    }

    // Axes lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(margin.left, margin.top);
    ctx.lineTo(margin.left, margin.top + chartH);
    ctx.lineTo(margin.left + chartW, margin.top + chartH);
    ctx.stroke();

    // Bars
    const groupCount = activeData.categories.length;
    const groupHeight = chartH / groupCount;
    const barHeight = Math.min(groupHeight * 0.36, 24);

    activeData.categories.forEach((cat, idx) => {
      const groupCenterY = margin.top + idx * groupHeight + groupHeight / 2;
      const y1 = groupCenterY - barHeight - 2;
      const y2 = groupCenterY + 2;

      const v1 = activeData.series1[idx];
      const v2 = activeData.series2[idx];

      const w1 = (v1 / maxVal) * chartW;
      const w2 = (v2 / maxVal) * chartW;

      // Draw Bar 1
      ctx.fillStyle = col1;
      drawRoundedRect(ctx, margin.left, y1, w1, barHeight, 4, false);

      // Draw Bar 2
      ctx.fillStyle = col2;
      drawRoundedRect(ctx, margin.left, y2, w2, barHeight, 4, false);

      // Hit boxes
      barHitBoxes.push({
        x: margin.left, y: y1, w: w1, h: barHeight,
        cat: cat, series: activeData.series1Name, val: v1, unit: activeData.unit
      });
      barHitBoxes.push({
        x: margin.left, y: y2, w: w2, h: barHeight,
        cat: cat, series: activeData.series2Name, val: v2, unit: activeData.unit
      });

      // Values beside bars
      if (showValues) {
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 11px "Segoe UI", sans-serif';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'middle';
        ctx.fillText(v1, margin.left + w1 + 6, y1 + barHeight / 2);
        ctx.fillText(v2, margin.left + w2 + 6, y2 + barHeight / 2);
      }

      // Category label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = '12px "Segoe UI"';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(cat, margin.left - 12, groupCenterY);
    });
  }

  // Update Legend Labels
  document.getElementById('legendLabel1').textContent = activeData.series1Name;
  document.getElementById('legendLabel2').textContent = activeData.series2Name;

  // Run Detective analysis on current data
  runDetectiveAnalysis();
}

function drawRoundedRect(ctx, x, y, w, h, r, isVertical) {
  if (w <= 0 || h <= 0) return;
  ctx.beginPath();
  if (isVertical) {
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h);
  } else {
    ctx.moveTo(x, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x, y + h);
  }
  ctx.closePath();
  ctx.fill();
}

// Tooltip Mouse Interaction
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;

  const mouseX = (e.clientX - rect.left) * scaleX;
  const mouseY = (e.clientY - rect.top) * scaleY;

  let hit = null;
  for (let box of barHitBoxes) {
    if (mouseX >= box.x && mouseX <= box.x + box.w &&
        mouseY >= box.y && mouseY <= box.y + box.h) {
      hit = box;
      break;
    }
  }

  if (hit) {
    tooltip.style.display = 'block';
    tooltip.style.left = `${e.clientX - rect.left}px`;
    tooltip.style.top = `${e.clientY - rect.top}px`;
    tooltip.innerHTML = `
      <div style="font-weight:700; color:#38bdf8;">${hit.cat}</div>
      <div style="color:#e2e8f0;">${hit.series}: <span style="font-weight:800; color:#fbbf24;">${hit.val}</span> ${hit.unit}</div>
    `;
    canvas.style.cursor = 'pointer';
  } else {
    tooltip.style.display = 'none';
    canvas.style.cursor = 'default';
  }
});

canvas.addEventListener('mouseleave', () => {
  tooltip.style.display = 'none';
});

// ==================== 5. EDITABLE DATA TABLE BUILDER ====================
function buildEditableTable() {
  const table = document.getElementById('editableTable');
  if (!table) return;

  let html = `<thead><tr><th>Nhóm Dữ Liệu</th>`;
  activeData.categories.forEach((cat) => {
    html += `<th>${cat}</th>`;
  });
  html += `</tr></thead><tbody>`;

  // Series 1 row
  html += `<tr><td style="font-weight:bold; color:var(--accent-col1);">${activeData.series1Name}</td>`;
  activeData.series1.forEach((val, idx) => {
    html += `<td><input type="number" step="any" data-series="1" data-idx="${idx}" value="${val}"></td>`;
  });
  html += `</tr>`;

  // Series 2 row
  html += `<tr><td style="font-weight:bold; color:var(--accent-col2);">${activeData.series2Name}</td>`;
  activeData.series2.forEach((val, idx) => {
    html += `<td><input type="number" step="any" data-series="2" data-idx="${idx}" value="${val}"></td>`;
  });
  html += `</tr></tbody>`;

  table.innerHTML = html;

  // Add change listeners
  table.querySelectorAll('input').forEach(input => {
    input.addEventListener('input', (e) => {
      const s = parseInt(e.target.dataset.series);
      const idx = parseInt(e.target.dataset.idx);
      const val = parseFloat(e.target.value) || 0;

      if (s === 1) activeData.series1[idx] = val;
      if (s === 2) activeData.series2[idx] = val;

      drawChart();
      awardXP(2);
    });
  });
}

// ==================== 6. LAB 2: DETECTIVE ANALYZER ====================
function runDetectiveAnalysis() {
  const cats = activeData.categories;
  const s1 = activeData.series1;
  const s2 = activeData.series2;

  let maxDiff = -1;
  let maxCat = '';
  let minDiff = 999999;
  let minCat = '';

  let sum1 = 0;
  let sum2 = 0;

  for (let i = 0; i < cats.length; i++) {
    const diff = Math.abs(s1[i] - s2[i]);
    sum1 += s1[i];
    sum2 += s2[i];

    if (diff > maxDiff) {
      maxDiff = diff;
      maxCat = cats[i];
    }
    if (diff < minDiff) {
      minDiff = diff;
      minCat = cats[i];
    }
  }

  const elMax = document.getElementById('detMaxDiff');
  const elMin = document.getElementById('detMinDiff');
  const elTot = document.getElementById('detTotalRatio');
  const elSum = document.getElementById('detSummary');

  if (elMax) {
    elMax.textContent = `${maxCat} (Chênh lệch: ${maxDiff.toFixed(1)} ${activeData.unit})`;
  }
  if (elMin) {
    elMin.textContent = `${minCat} (Chênh lệch: ${minDiff.toFixed(1)} ${activeData.unit})`;
  }
  if (elTot) {
    elTot.textContent = `${activeData.series1Name}: ${sum1.toFixed(1)} vs ${activeData.series2Name}: ${sum2.toFixed(1)}`;
  }
  if (elSum) {
    const leader = sum1 > sum2 ? activeData.series1Name : (sum2 > sum1 ? activeData.series2Name : 'Cả 2 nhóm cân bằng');
    const pct = Math.abs(sum1 - sum2) > 0 ? ((Math.abs(sum1 - sum2) / Math.max(sum1, sum2)) * 100).toFixed(1) : 0;
    elSum.textContent = `Tổng thể nhóm "${leader}" đang chiếm ưu thế hơn với mức chênh lệch tổng cộng khoảng ${pct}%. Biểu đồ cột kép đã giúp ta so sánh trực quan từng phân khúc mà không bị nhầm lẫn!`;
  }
}

// ==================== 7. SGK ARENA (10 COMPREHENSIVE QUESTIONS) ====================
const quizQuestions = [
  {
    badge: 'Khái niệm SGK (Trang 82)',
    text: 'Khi nào người ta nên ưu tiên sử dụng biểu đồ cột kép thay vì biểu đồ cột đơn?',
    options: [
      'Khi chỉ cần thể hiện một đại lượng duy nhất của một đối tượng.',
      'Khi cần so sánh hai tập dữ liệu cùng loại của các đối tượng kề cận nhau.',
      'Khi cần tính chu vi và diện tích của hình chữ nhật.',
      'Khi số liệu là các phân số có mẫu số bằng nhau.'
    ],
    correct: 1,
    explanation: 'SGK trang 82 chỉ rõ: Để dễ dàng so sánh hai tập dữ liệu cùng loại của các đối tượng (như học lực 6A vs 6B, doanh thu 2 năm...), người ta ghép hai biểu đồ cột đơn lại thành biểu đồ cột kép.'
  },
  {
    badge: 'Bảng 9.6 & Hình 9.14 (Trang 82)',
    text: 'Quan sát biểu đồ học lực Hình 9.14 (SGK trang 82): Khẳng định nào sau đây là ĐÚNG khi so sánh hai lớp 6A và 6B?',
    options: [
      'Lớp 6A có số học sinh giỏi nhiều hơn (13 > 9) và số học sinh yếu ít hơn (2 < 5) so với lớp 6B.',
      'Lớp 6B có nhiều học sinh giỏi hơn lớp 6A.',
      'Cả hai lớp đều có số học sinh trung bình bằng nhau.',
      'Số học sinh khá của lớp 6A nhiều hơn lớp 6B.'
    ],
    correct: 0,
    explanation: 'Hình 9.14 cho thấy: Học sinh Giỏi: 6A có 13 em > 6B có 9 em. Học sinh Yếu: 6A có 2 em < 6B có 5 em. Do đó lớp 6A có nhiều học sinh giỏi hơn và ít học sinh yếu hơn.'
  },
  {
    badge: 'Luyện tập 1 - Hình 9.18 (Trang 83)',
    text: 'Bảng 9.7 ghi nhận số trẻ sinh ra trong 3 ngày đầu năm 2020 tại một bệnh viện. Ngày nào số bé trai và số bé gái sinh ra BẰNG NHAU?',
    options: [
      'Ngày 1 (9 trai, 5 gái)',
      'Ngày 2 (6 trai, 6 gái)',
      'Ngày 3 (7 trai, 4 gái)',
      'Không có ngày nào bằng nhau'
    ],
    correct: 1,
    explanation: 'Trong Bảng 9.7 và Hình 9.18, vào Ngày 2: Số bé trai = 6 và số bé gái = 6. Hai cột có chiều cao bằng nhau, biểu thị số lượng sinh ra hoàn toàn ngang nhau.'
  },
  {
    badge: 'Hình 9.19 - Ví dụ SGK (Trang 84)',
    text: 'Quan sát biểu đồ Hình 9.19 về số bàn thắng của L.Messi và C.Ronaldo (2016 - 2018): Năm nào khoảng cách số bàn thắng giữa hai cầu thủ là LỚN NHẤT?',
    options: [
      'Năm 2016 (chênh lệch 59 - 55 = 4 bàn)',
      'Năm 2017 (chênh lệch 54 - 53 = 1 bàn)',
      'Năm 2018 (chênh lệch 51 - 49 = 2 bàn)',
      'Khoảng cách cả ba năm đều bằng nhau'
    ],
    correct: 0,
    explanation: 'Khoảng cách bàn thắng từng năm: 2016: 59 - 55 = 4 bàn; 2017: 54 - 53 = 1 bàn; 2018: 51 - 49 = 2 bàn. Như vậy năm 2016 có độ chênh lệch lớn nhất (4 bàn).'
  },
  {
    badge: 'Luyện tập 2 - Hình 9.20 (Trang 84)',
    text: 'Biểu đồ Hình 9.20 thể hiện lượng mưa trung bình các tháng năm 2018 tại Tuyên Quang và Nha Trang. Tháng nào trạm Nha Trang có lượng mưa cao đột biến, vượt mốc 700 mm?',
    options: [
      'Tháng 7',
      'Tháng 8',
      'Tháng 11',
      'Tháng 12'
    ],
    correct: 2,
    explanation: 'Hình 9.20 cho thấy cột màu cam (Nha Trang) ở Tháng 11 vọt lên đỉnh cao nhất vượt qua vạch 700 mm. Đây là thời kỳ cao điểm của mùa mưa bão tại khu vực duyên hải Nam Trung Bộ.'
  },
  {
    badge: 'Hình 9.21 - Chiều cao châu Á (Trang 85)',
    text: 'Dựa vào biểu đồ Hình 9.21: Độ chênh lệch chiều cao trung bình giữa nam và nữ tại Việt Nam là bao nhiêu cm?',
    options: [
      '7,5 cm',
      '9,9 cm',
      '11,0 cm',
      '14,0 cm'
    ],
    correct: 1,
    explanation: 'Tại Việt Nam (Hình 9.21): Nam = 162,1 cm; Nữ = 152,2 cm. Độ chênh lệch là: 162,1 - 152,2 = 9,9 cm.'
  },
  {
    badge: 'Tranh luận - Hình 9.22 (Trang 85)',
    text: 'Khi muốn so sánh trực quan sự thay đổi độ mặn giữa năm 2015 và 2016 TẠI TỪNG TRẠM QUAN TRẮC (Cầu Nổi và Bến Lức), cách vẽ nào thuận lợi hơn?',
    options: [
      'Cách vẽ của bạn Vuông (Hình 9.22a): Gom theo từng Trạm, mỗi trạm có 2 cột tương ứng 2 năm kề nhau.',
      'Cách vẽ của bạn Tròn (Hình 9.22b): Gom theo từng Năm.',
      'Cả hai cách đều hoàn toàn không so sánh được độ mặn.',
      'Nên vẽ thành biểu đồ hình tròn có 360 độ.'
    ],
    correct: 0,
    explanation: 'Hình 9.22a của Vuông nhóm theo từng Trạm, đặt 2 năm 2015 và 2016 sát cạnh nhau nên người xem chỉ cần liếc mắt là thấy ngay độ mặn tăng vọt tại mỗi trạm mà không cần phải nhìn đảo qua đảo lại giữa 2 cụm xa nhau.'
  },
  {
    badge: 'Bài tập 9.18 & 9.19 (Trang 86)',
    text: 'Quan sát biểu đồ bán quạt Hình 9.23: Ba tháng cửa hàng bán được NHIỀU QUẠT TRẦN nhất là những tháng nào?',
    options: [
      'Tháng 1, 2, 3',
      'Tháng 4, 5, 6',
      'Tháng 5, 6, 7 (lần lượt 35, 41, 37 chiếc)',
      'Tháng 10, 11, 12'
    ],
    correct: 2,
    explanation: 'Nhìn vào các cột màu vàng (quạt trần) trên Hình 9.23: Tháng 6 cao nhất (41), tiếp đến Tháng 7 (37) và Tháng 5 (35). Vậy 3 tháng bán nhiều quạt trần nhất là Tháng 5, 6, 7.'
  },
  {
    badge: 'Bài tập 9.20 & 9.21 (Trang 86)',
    text: 'Tính tổng số lượng quạt cả hai loại bán được trong 3 tháng mùa hè (Tháng 5, 6, 7) so với 3 tháng mùa đông (Tháng 10, 11, 12):',
    options: [
      'Mùa hè: 245 chiếc; Mùa đông: 105 chiếc (Mùa hè bán gấp hơn 2,3 lần)',
      'Mùa hè: 180 chiếc; Mùa đông: 180 chiếc (Hai mùa bằng nhau)',
      'Mùa hè: 150 chiếc; Mùa đông: 220 chiếc',
      'Mùa hè: 300 chiếc; Mùa đông: 50 chiếc'
    ],
    correct: 0,
    explanation: 'Tháng 5, 6, 7: Quạt trần (35+41+37 = 113) + Quạt cây (51+49+32 = 132) = 245 chiếc. Tháng 10, 11, 12: Quạt trần (15+17+20 = 52) + Quạt cây (13+23+17 = 53) = 105 chiếc. Rõ ràng mùa hè bán chạy hơn hẳn do thời tiết nắng nóng gay gắt!'
  },
  {
    badge: 'Bài tập 9.24 (Trang 86)',
    text: 'Bảng thống kê và Hình 9.24 cho biết môn thể thao yêu thích của nam và nữ. Môn nào số bạn NỮ yêu thích lại NHIỀU HƠN số bạn NAM?',
    options: [
      'Bóng đá (Nam: 20, Nữ: 5)',
      'Cầu lông (Nam: 15, Nữ: 6)',
      'Cờ vua (Nam: 10, Nữ: 12)',
      'Bóng bàn (Nam: 17, Nữ: 9)'
    ],
    correct: 2,
    explanation: 'Chỉ riêng môn Cờ vua thì cột màu xanh của Nữ (12 bạn) cao hơn cột màu vàng của Nam (10 bạn). Ở cả 3 môn còn lại (Bóng đá, Cầu lông, Bóng bàn), số bạn nam đều chiếm ưu thế áp đảo.'
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

  // Attach button events
  container.querySelectorAll('.opt-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const qIdx = parseInt(btn.dataset.q);
      const optIdx = parseInt(btn.dataset.opt);
      handleAnswer(qIdx, optIdx);
    });
  });
}

function handleAnswer(qIdx, optIdx) {
  if (state.answeredQuestions[qIdx]) return; // Already answered

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

  // Check specific badges
  if (qIdx === 0 && isCorrect) checkBadge(0); // Badge 1: Nhận diện kép
  if ((qIdx === 3 || qIdx === 9) && isCorrect) checkBadge(2); // Badge 3: Trọng tài thể thao
  if ((qIdx === 4 || qIdx === 7 || qIdx === 8) && isCorrect) checkBadge(3); // Badge 4: Bậc thầy dự báo

  // Check Badge 5 if all 10 are correct
  if (getCorrectArenaCount() === 10) {
    checkBadge(4);
    sounds.playLevelUp();
  }

  // Update UI
  buildQuizUI();
  updateHUD();
}

// ==================== 8. SETUP EVENT LISTENERS ====================
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
        setTimeout(drawChart, 50);
      }
    });
  });

  // Avatar toggle
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
    if (confirm('Bạn có chắc muốn làm mới toàn bộ điểm XP, chuỗi đúng và bài tập Đấu Trường không?')) {
      state = { ...defaultState };
      activeData = JSON.parse(JSON.stringify(presets.hocLuc));
      saveState();
      updateHUD();
      buildQuizUI();
      buildEditableTable();
      drawChart();
      sounds.playClick();
    }
  });

  // Presets in Lab 1
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => {
      sounds.playClick();
      document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const presetKey = btn.dataset.preset;
      state.currentPreset = presetKey;
      activeData = JSON.parse(JSON.stringify(presets[presetKey]));
      buildEditableTable();
      drawChart();
      awardXP(5);
    });
  });

  // Toggle Orientation in Lab 1
  const orientBtn = document.getElementById('toggleOrientationBtn');
  orientBtn.addEventListener('click', () => {
    sounds.playClick();
    state.labOrientation = state.labOrientation === 'vertical' ? 'horizontal' : 'vertical';
    orientBtn.textContent = state.labOrientation === 'vertical' ? '🔄 Đổi dạng: Cột Đứng' : '🔄 Đổi dạng: Thanh Ngang';
    drawChart();
    checkBadge(1); // Badge 2: Họa sĩ thống kê
    awardXP(10);
  });

  // Toggle Bar Values
  const valBtn = document.getElementById('toggleValuesBtn');
  valBtn.addEventListener('click', () => {
    sounds.playClick();
    state.showBarValues = !state.showBarValues;
    valBtn.textContent = state.showBarValues ? '🔢 Hiện số đỉnh cột: BẬT' : '🔢 Hiện số đỉnh cột: TẮT';
    drawChart();
  });

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

  // Window Resize
  window.addEventListener('resize', () => {
    drawChart();
  });
}

// ==================== 9. INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateHUD();
  buildEditableTable();
  buildQuizUI();
  setupListeners();

  // Initial render
  setTimeout(() => {
    drawChart();
  }, 100);
});
