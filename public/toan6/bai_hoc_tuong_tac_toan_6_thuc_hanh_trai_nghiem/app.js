/* ================================================================
   HOẠT ĐỘNG THỰC HÀNH TRẢI NGHIỆM - TOÁN 6 TẬP 2
   Logic Game hóa, Web Audio API, Canvas Donut/Bars, GeoGebra Mini,
   Đấu Trường Trải Nghiệm và Chứng Nhận Tốt Nghiệp Toàn Khóa.
   ================================================================ */

// --- 1. ÂM THANH WEB AUDIO API ---
class SoundController {
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

  playBeep(freq = 440, type = 'sine', duration = 0.15, vol = 0.1) {
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
      console.warn('Audio error:', e);
    }
  }

  playCorrect() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      setTimeout(() => this.playBeep(freq, 'triangle', 0.12, 0.15), idx * 70);
    });
  }

  playWrong() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    this.playBeep(260, 'sawtooth', 0.2, 0.2);
    setTimeout(() => this.playBeep(195, 'sawtooth', 0.3, 0.2), 150);
  }

  playLevelUp() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    [440, 554.37, 659.25, 880, 1108.7].forEach((f, i) => {
      setTimeout(() => this.playBeep(f, 'square', 0.18, 0.15), i * 90);
    });
  }

  playFanfare() {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;
    const notes = [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => this.playBeep(freq, 'triangle', 0.22, 0.2), idx * 110);
    });
  }
}

const sound = new SoundController();

// --- 2. TRẠNG THÁI TOÀN CỤC (STATE) ---
const STATE_KEY = 'toan6_thuc_hanh_trai_nghiem_state';

const appState = {
  xp: 0,
  streak: 0,
  maxStreak: 0,
  avatar: '👑',
  userTitle: 'Đại Kiện Tướng Toàn Năng Toán 6',
  userName: 'Chiến Binh Toán Học 🌟',
  badges: {
    budget: false,
    geo: false,
    sports: false,
    arena: false,
    graduate: false
  },
  soundEnabled: true
};

function loadState() {
  try {
    const saved = localStorage.getItem(STATE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      Object.assign(appState, parsed);
    }
  } catch (e) {
    console.warn('LocalStorage error:', e);
  }
  updateHud();
}

function saveState() {
  try {
    localStorage.setItem(STATE_KEY, JSON.stringify(appState));
  } catch (e) {
    console.warn('LocalStorage save error:', e);
  }
}

function addXP(amount) {
  appState.xp += amount;
  sound.playLevelUp();
  updateHud();
  checkGraduateBadge();
  saveState();
}

function updateHud() {
  const xpEl = document.getElementById('xpDisplay');
  const streakEl = document.getElementById('streakDisplay');
  const starRatingEl = document.getElementById('starRating');
  const avatarBtn = document.getElementById('avatarBtn');
  const userTitleEl = document.getElementById('userTitle');
  const userNameDisplay = document.getElementById('userNameDisplay');
  const certStudentName = document.getElementById('certStudentName');
  const certHonorsTitle = document.getElementById('certHonorsTitle');

  if (xpEl) xpEl.textContent = appState.xp;
  if (streakEl) streakEl.textContent = `🔥 ${appState.streak}`;
  if (avatarBtn) avatarBtn.textContent = appState.avatar;
  if (userTitleEl) userTitleEl.textContent = appState.userTitle;
  if (userNameDisplay) userNameDisplay.textContent = appState.userName;
  if (certStudentName) certStudentName.textContent = `${appState.avatar} ${appState.userName}`;
  if (certHonorsTitle) certHonorsTitle.textContent = `${appState.userTitle} 🏅`;

  // Star calculation
  let stars = '⭐☆☆☆☆';
  if (appState.xp >= 1000) stars = '⭐⭐⭐⭐⭐';
  else if (appState.xp >= 700) stars = '⭐⭐⭐⭐☆';
  else if (appState.xp >= 400) stars = '⭐⭐⭐☆☆';
  else if (appState.xp >= 150) stars = '⭐⭐☆☆☆';
  if (starRatingEl) starRatingEl.textContent = stars;

  // Update badge UI
  for (const [key, unlocked] of Object.entries(appState.badges)) {
    const el = document.getElementById(`badge-${key}`);
    if (el) {
      if (unlocked) {
        el.classList.add('unlocked');
        el.classList.remove('locked');
      } else {
        el.classList.remove('unlocked');
        el.classList.add('locked');
      }
    }
  }
}

function unlockBadge(badgeKey) {
  if (!appState.badges[badgeKey]) {
    appState.badges[badgeKey] = true;
    addXP(100);
    sound.playFanfare();
    updateHud();
    saveState();
  }
}

function checkGraduateBadge() {
  if (appState.badges.budget && appState.badges.geo && appState.badges.sports && appState.badges.arena) {
    if (!appState.badges.graduate) {
      appState.badges.graduate = true;
      appState.xp += 250;
      sound.playFanfare();
      updateHud();
      saveState();
    }
  }
}

// --- 3. ĐIỀU HƯỚNG TABS ---
function initTabs() {
  const tabs = document.querySelectorAll('.nav-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sound.playBeep(520, 'sine', 0.08);
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetId = `tab-${tab.dataset.tab}`;
      const target = document.getElementById(targetId);
      if (target) target.classList.add('active');

      if (tab.dataset.tab === 'labs') {
        renderBudgetCharts();
        drawSportsChart();
        redrawGeoCanvas();
      }
    });
  });

  // Sublab switcher in Tab 2
  const btnSub1 = document.getElementById('btnSublab1');
  const btnSub2 = document.getElementById('btnSublab2');
  const sub1 = document.getElementById('sublab1-content');
  const sub2 = document.getElementById('sublab2-content');

  if (btnSub1 && btnSub2 && sub1 && sub2) {
    btnSub1.addEventListener('click', () => {
      sound.playBeep(450, 'sine', 0.08);
      btnSub1.classList.add('active');
      btnSub2.classList.remove('active');
      sub1.style.display = 'block';
      sub2.style.display = 'none';
      renderBudgetCharts();
    });

    btnSub2.addEventListener('click', () => {
      sound.playBeep(500, 'sine', 0.08);
      btnSub2.classList.add('active');
      btnSub1.classList.remove('active');
      sub2.style.display = 'block';
      sub1.style.display = 'none';
      redrawGeoCanvas();
      drawSportsChart();
    });
  }
}

// --- 4. LAB 1: STUDIO LẬP NGÂN SÁCH THÔNG MINH ---
const budgetState = {
  totalIncome: 15000000,
  costEssential: 7500000,
  costFlexible: 4000000,
  costExtra: 1500000
};

function formatVND(amount) {
  return amount.toLocaleString('vi-VN') + ' đ';
}

function initBudgetLab() {
  const sliderIncome = document.getElementById('sliderTotalIncome');
  const sliderEssential = document.getElementById('sliderCostEssential');
  const sliderFlexible = document.getElementById('sliderCostFlexible');
  const sliderExtra = document.getElementById('sliderCostExtra');

  const btnStudent = document.getElementById('loadStudentBudget');
  const btnFamily = document.getElementById('loadFamilyBudget');

  if (sliderIncome) {
    sliderIncome.addEventListener('input', (e) => {
      budgetState.totalIncome = parseInt(e.target.value);
      renderBudgetCharts();
    });
  }

  if (sliderEssential) {
    sliderEssential.addEventListener('input', (e) => {
      budgetState.costEssential = parseInt(e.target.value);
      renderBudgetCharts();
    });
  }

  if (sliderFlexible) {
    sliderFlexible.addEventListener('input', (e) => {
      budgetState.costFlexible = parseInt(e.target.value);
      renderBudgetCharts();
    });
  }

  if (sliderExtra) {
    sliderExtra.addEventListener('input', (e) => {
      budgetState.costExtra = parseInt(e.target.value);
      renderBudgetCharts();
    });
  }

  if (btnStudent) {
    btnStudent.addEventListener('click', () => {
      sound.playBeep(550, 'sine', 0.1);
      budgetState.totalIncome = 300000;
      budgetState.costEssential = 150000;
      budgetState.costFlexible = 80000;
      budgetState.costExtra = 30000;
      syncSliders();
      renderBudgetCharts();
    });
  }

  if (btnFamily) {
    btnFamily.addEventListener('click', () => {
      sound.playBeep(600, 'sine', 0.1);
      budgetState.totalIncome = 15000000;
      budgetState.costEssential = 7500000;
      budgetState.costFlexible = 4000000;
      budgetState.costExtra = 1500000;
      syncSliders();
      renderBudgetCharts();
    });
  }

  renderBudgetCharts();
}

function syncSliders() {
  const sliderIncome = document.getElementById('sliderTotalIncome');
  const sliderEssential = document.getElementById('sliderCostEssential');
  const sliderFlexible = document.getElementById('sliderCostFlexible');
  const sliderExtra = document.getElementById('sliderCostExtra');

  if (sliderIncome) {
    sliderIncome.max = Math.max(budgetState.totalIncome * 1.5, 1000000);
    sliderIncome.value = budgetState.totalIncome;
  }
  if (sliderEssential) {
    sliderEssential.max = budgetState.totalIncome;
    sliderEssential.value = budgetState.costEssential;
  }
  if (sliderFlexible) {
    sliderFlexible.max = budgetState.totalIncome;
    sliderFlexible.value = budgetState.costFlexible;
  }
  if (sliderExtra) {
    sliderExtra.max = budgetState.totalIncome;
    sliderExtra.value = budgetState.costExtra;
  }
}

function renderBudgetCharts() {
  const { totalIncome, costEssential, costFlexible, costExtra } = budgetState;
  const remaining = totalIncome - (costEssential + costFlexible + costExtra);

  const pctEssential = Math.round((costEssential / totalIncome) * 1000) / 10;
  const pctFlexible = Math.round((costFlexible / totalIncome) * 1000) / 10;
  const pctExtra = Math.round((costExtra / totalIncome) * 1000) / 10;
  const pctSavings = Math.round((remaining / totalIncome) * 1000) / 10;

  // Text updates
  const txtIncome = document.getElementById('txtTotalIncome');
  const txtEss = document.getElementById('txtCostEssential');
  const txtFlex = document.getElementById('txtCostFlexible');
  const txtExt = document.getElementById('txtCostExtra');
  const txtSav = document.getElementById('txtRemainingSavings');

  if (txtIncome) txtIncome.textContent = formatVND(totalIncome);
  if (txtEss) txtEss.textContent = `${formatVND(costEssential)} (${pctEssential}%)`;
  if (txtFlex) txtFlex.textContent = `${formatVND(costFlexible)} (${pctFlexible}%)`;
  if (txtExt) txtExt.textContent = `${formatVND(costExtra)} (${pctExtra}%)`;

  if (txtSav) {
    txtSav.textContent = `${formatVND(remaining)} (${pctSavings}%)`;
    if (remaining < 0) {
      txtSav.style.color = '#f43f5e';
    } else {
      txtSav.style.color = '#34d399';
    }
  }

  // Update progress bar
  const barEss = document.getElementById('barEssential');
  const barFlex = document.getElementById('barFlexible');
  const barExt = document.getElementById('barExtra');
  const barSav = document.getElementById('barSavings');

  if (barEss) {
    barEss.style.width = `${Math.max(pctEssential, 0)}%`;
    barEss.textContent = pctEssential > 5 ? `${pctEssential}%` : '';
  }
  if (barFlex) {
    barFlex.style.width = `${Math.max(pctFlexible, 0)}%`;
    barFlex.textContent = pctFlexible > 5 ? `${pctFlexible}%` : '';
  }
  if (barExt) {
    barExt.style.width = `${Math.max(pctExtra, 0)}%`;
    barExt.textContent = pctExtra > 5 ? `${pctExtra}%` : '';
  }
  if (barSav) {
    const positiveSavPct = Math.max(pctSavings, 0);
    barSav.style.width = `${positiveSavPct}%`;
    barSav.textContent = positiveSavPct > 5 ? `${positiveSavPct}%` : '';
  }

  // Advisor logic
  const advisorBox = document.getElementById('advisorBox');
  const advisorIcon = document.getElementById('advisorIcon');
  const advisorTitle = document.getElementById('advisorTitle');
  const advisorText = document.getElementById('advisorText');

  if (advisorBox && advisorTitle && advisorText) {
    advisorBox.className = 'budget-advisor-card';
    if (remaining < 0) {
      advisorBox.classList.add('danger');
      advisorIcon.textContent = '⚠️';
      advisorTitle.textContent = 'Cảnh Báo: Ngân Sách Thâm Hụt!';
      advisorText.textContent = `Tổng các khoản chi vượt quá thu nhập ${formatVND(Math.abs(remaining))}. Bạn cần khẩn cấp cắt giảm chi phí phát sinh và xem lại các khoản chi linh hoạt theo khuyến cáo SGK!`;
    } else if (pctExtra > 25) {
      advisorBox.classList.add('warning');
      advisorIcon.textContent = '💡';
      advisorTitle.textContent = 'Khoản Chi Phát Sinh Quá Cao!';
      advisorText.textContent = `Chi phát sinh/giải trí đang chiếm tới ${pctExtra}% ngân sách (vượt mức 15-20% thông thường). Hãy hạn chế các khoản ăn vặt, mua sắm bộc phát để gia tăng tiền tiết kiệm!`;
    } else if (pctSavings >= 15 && pctEssential <= 55) {
      advisorIcon.textContent = '🌟';
      advisorTitle.textContent = 'Phân Bổ Ngân Sách Hoàn Hảo!';
      advisorText.textContent = `Tuyệt vời! Bạn đang thực hiện rất chuẩn quy tắc SGK: Chi thiết yếu chiếm ${pctEssential}%, Tiết kiệm tích lũy đạt ${pctSavings}%. Tài chính của bạn cực kỳ an toàn và vững chắc!`;
      unlockBadge('budget');
    } else {
      advisorIcon.textContent = '🤖';
      advisorTitle.textContent = 'Ngân Sách Cân Bằng Ổn Định';
      advisorText.textContent = `Ngân sách đang có số dư dương ${formatVND(remaining)}. Hãy tiếp tục theo dõi chặt chẽ nhật ký chi tiêu gia đình/cá nhân để duy trì sự ổn định này!`;
    }
  }

  // Draw Donut Canvas
  drawBudgetDonut(pctEssential, pctFlexible, pctExtra, pctSavings);
}

function drawBudgetDonut(pEss, pFlex, pExt, pSav) {
  const canvas = document.getElementById('budgetDonutCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const cx = w / 2;
  const cy = h / 2;
  const outerR = 105;
  const innerR = 60;

  const validSav = Math.max(pSav, 0);
  const total = pEss + pFlex + pExt + validSav;
  if (total <= 0) return;

  const slices = [
    { pct: pEss, color: '#38bdf8', label: 'Thiết yếu' },
    { pct: pFlex, color: '#a855f7', label: 'Linh hoạt' },
    { pct: pExt, color: '#fb7185', label: 'Phát sinh' },
    { pct: validSav, color: '#34d399', label: 'Tiết kiệm' }
  ];

  let currentAngle = -Math.PI / 2;

  slices.forEach(slice => {
    if (slice.pct <= 0) return;
    const sliceAngle = (slice.pct / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, currentAngle, currentAngle + sliceAngle);
    ctx.arc(cx, cy, innerR, currentAngle + sliceAngle, currentAngle, true);
    ctx.closePath();
    ctx.fillStyle = slice.color;
    ctx.shadowColor = slice.color;
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    currentAngle += sliceAngle;
  });

  // Center text
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 15px Segoe UI';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('QUẢN LÝ', cx, cy - 10);
  ctx.fillStyle = '#fbbf24';
  ctx.font = 'bold 14px Segoe UI';
  ctx.fillText('CHI TIÊU', cx, cy + 12);
}

// --- 5. LAB 2: GEOGEBRA MINI & BIỂU ĐỒ THỂ THAO HÈ ---
const geoState = {
  activeTool: 'point',
  points: [],
  segments: [],
  midpoints: [],
  angles: [],
  polygons: [],
  selectedPoints: []
};

function initGeoLab() {
  const canvas = document.getElementById('geoCanvas');
  const hintEl = document.getElementById('geoHint');
  const toolBtns = document.querySelectorAll('.geo-tool-btn[data-tool]');
  const btnClear = document.getElementById('btnGeoClear');

  toolBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      toolBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      geoState.activeTool = btn.dataset.tool;
      geoState.selectedPoints = [];
      sound.playBeep(480, 'sine', 0.08);

      const hints = {
        point: 'Đang chọn: Vẽ Điểm (Nhấp chuột để chấm điểm A, B, C...)',
        segment: 'Đang chọn: Vẽ Đoạn Thẳng (Nhấp vào 2 điểm hoặc 2 vị trí bất kỳ để nối)',
        midpoint: 'Đang chọn: Trung Điểm (Nhấp chọn 2 điểm để tạo trung điểm chính giữa)',
        angle: 'Đang chọn: Đo Góc (Nhấp chọn lần lượt 3 điểm: A, đỉnh B, và C)',
        triangle: 'Đang chọn: Tam Giác Đều (Nhấp vào bảng để đặt tam giác đều)',
        square: 'Đang chọn: Hình Vuông (Nhấp vào bảng để đặt hình vuông)',
        hexagon: 'Đang chọn: Lục Giác Đều (Nhấp vào bảng để đặt lục giác đều)'
      };
      if (hintEl) hintEl.textContent = hints[geoState.activeTool] || '';
    });
  });

  if (btnClear) {
    btnClear.addEventListener('click', () => {
      sound.playBeep(250, 'square', 0.1);
      geoState.points = [];
      geoState.segments = [];
      geoState.midpoints = [];
      geoState.angles = [];
      geoState.polygons = [];
      geoState.selectedPoints = [];
      redrawGeoCanvas();
    });
  }

  if (canvas) {
    canvas.addEventListener('click', (e) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      handleGeoCanvasClick(x, y);
    });
  }

  redrawGeoCanvas();
}

function handleGeoCanvasClick(x, y) {
  sound.playBeep(620, 'sine', 0.08);
  const tool = geoState.activeTool;

  // Helper to find nearby existing point
  const findPoint = (px, py, radius = 18) => {
    return geoState.points.find(p => Math.hypot(p.x - px, p.y - py) <= radius);
  };

  const clickedPt = findPoint(x, y);

  if (tool === 'point') {
    const label = String.fromCharCode(65 + (geoState.points.length % 26));
    geoState.points.push({ x, y, label });
  } else if (tool === 'segment') {
    let p = clickedPt;
    if (!p) {
      const label = String.fromCharCode(65 + (geoState.points.length % 26));
      p = { x, y, label };
      geoState.points.push(p);
    }
    geoState.selectedPoints.push(p);

    if (geoState.selectedPoints.length === 2) {
      geoState.segments.push({
        p1: geoState.selectedPoints[0],
        p2: geoState.selectedPoints[1]
      });
      geoState.selectedPoints = [];
      sound.playCorrect();
    }
  } else if (tool === 'midpoint') {
    let p = clickedPt;
    if (!p) {
      const label = String.fromCharCode(65 + (geoState.points.length % 26));
      p = { x, y, label };
      geoState.points.push(p);
    }
    geoState.selectedPoints.push(p);

    if (geoState.selectedPoints.length === 2) {
      const p1 = geoState.selectedPoints[0];
      const p2 = geoState.selectedPoints[1];
      const mx = (p1.x + p2.x) / 2;
      const my = (p1.y + p2.y) / 2;
      const mPoint = { x: mx, y: my, label: `M` };
      geoState.points.push(mPoint);
      geoState.midpoints.push({ x: mx, y: my, p1, p2 });
      geoState.selectedPoints = [];
      sound.playLevelUp();
    }
  } else if (tool === 'angle') {
    let p = clickedPt;
    if (!p) {
      const label = String.fromCharCode(65 + (geoState.points.length % 26));
      p = { x, y, label };
      geoState.points.push(p);
    }
    geoState.selectedPoints.push(p);

    if (geoState.selectedPoints.length === 3) {
      const [A, B, C] = geoState.selectedPoints;
      // Angle at vertex B
      const angle1 = Math.atan2(A.y - B.y, A.x - B.x);
      const angle2 = Math.atan2(C.y - B.y, C.x - B.x);
      let diff = Math.abs(angle1 - angle2) * (180 / Math.PI);
      if (diff > 180) diff = 360 - diff;
      geoState.angles.push({ A, B, C, deg: Math.round(diff) });
      geoState.selectedPoints = [];
      sound.playCorrect();
    }
  } else if (tool === 'triangle') {
    // Equilateral triangle
    const r = 50;
    const pts = [];
    for (let i = 0; i < 3; i++) {
      const ang = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      const px = x + r * Math.cos(ang);
      const py = y + r * Math.sin(ang);
      const pt = { x: px, y: py, label: String.fromCharCode(65 + (geoState.points.length % 26)) };
      geoState.points.push(pt);
      pts.push(pt);
    }
    geoState.polygons.push({ type: 'triangle', points: pts });
    sound.playLevelUp();
  } else if (tool === 'square') {
    // Regular Square
    const r = 55;
    const pts = [];
    for (let i = 0; i < 4; i++) {
      const ang = -Math.PI / 4 + (i * 2 * Math.PI) / 4;
      const px = x + r * Math.cos(ang);
      const py = y + r * Math.sin(ang);
      const pt = { x: px, y: py, label: String.fromCharCode(65 + (geoState.points.length % 26)) };
      geoState.points.push(pt);
      pts.push(pt);
    }
    geoState.polygons.push({ type: 'square', points: pts });
    sound.playLevelUp();
  } else if (tool === 'hexagon') {
    // Regular Hexagon
    const r = 60;
    const pts = [];
    for (let i = 0; i < 6; i++) {
      const ang = (i * 2 * Math.PI) / 6;
      const px = x + r * Math.cos(ang);
      const py = y + r * Math.sin(ang);
      const pt = { x: px, y: py, label: String.fromCharCode(65 + (geoState.points.length % 26)) };
      geoState.points.push(pt);
      pts.push(pt);
    }
    geoState.polygons.push({ type: 'hexagon', points: pts });
    sound.playLevelUp();
  }

  // Check badge unlock if user made several shapes
  if (geoState.points.length >= 4 || geoState.segments.length >= 2 || geoState.polygons.length >= 1) {
    unlockBadge('geo');
  }

  redrawGeoCanvas();
}

function redrawGeoCanvas() {
  const canvas = document.getElementById('geoCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  // Background
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, w, h);

  // Grid
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 30;
  for (let x = 0; x < w; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  for (let y = 0; y < h; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Draw Polygons
  geoState.polygons.forEach(poly => {
    ctx.beginPath();
    poly.points.forEach((p, idx) => {
      if (idx === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.closePath();
    ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
    ctx.fill();
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2.5;
    ctx.stroke();
  });

  // Draw Segments
  geoState.segments.forEach(seg => {
    ctx.beginPath();
    ctx.moveTo(seg.p1.x, seg.p1.y);
    ctx.lineTo(seg.p2.x, seg.p2.y);
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Length label
    const dist = Math.hypot(seg.p1.x - seg.p2.x, seg.p1.y - seg.p2.y);
    const mx = (seg.p1.x + seg.p2.x) / 2;
    const my = (seg.p1.y + seg.p2.y) / 2;
    ctx.fillStyle = '#94a3b8';
    ctx.font = '11px Segoe UI';
    ctx.fillText(`d = ${(dist / 30).toFixed(1)} cm`, mx + 6, my - 6);
  });

  // Draw Angles
  geoState.angles.forEach(ang => {
    const { A, B, C, deg } = ang;
    ctx.beginPath();
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(B.x, B.y);
    ctx.lineTo(C.x, C.y);
    ctx.strokeStyle = '#fbbf24';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#fbbf24';
    ctx.font = 'bold 12px Segoe UI';
    ctx.fillText(`${deg}°`, B.x + 12, B.y - 12);
  });

  // Draw Midpoints markers
  geoState.midpoints.forEach(m => {
    ctx.beginPath();
    ctx.arc(m.x, m.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = '#10b981';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // Draw Points
  geoState.points.forEach(p => {
    const isSelected = geoState.selectedPoints.includes(p);
    ctx.beginPath();
    ctx.arc(p.x, p.y, isSelected ? 8 : 6, 0, Math.PI * 2);
    ctx.fillStyle = isSelected ? '#ec4899' : '#f59e0b';
    ctx.fill();
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px Segoe UI';
    ctx.fillText(p.label, p.x + 8, p.y - 8);
  });
}

// --- BIỂU ĐỒ CỘT KÉP THỂ THAO HÈ ---
let sportsMode = 'grade'; // 'grade' or 'gender'

function initSportsChart() {
  const btnGrade = document.getElementById('btnSportsGrade');
  const btnGender = document.getElementById('btnSportsGender');

  if (btnGrade) {
    btnGrade.addEventListener('click', () => {
      sportsMode = 'grade';
      btnGrade.style.borderColor = 'var(--gold-light)';
      if (btnGender) btnGender.style.borderColor = 'rgba(255,255,255,0.15)';
      sound.playBeep(520, 'sine', 0.08);
      drawSportsChart();
      unlockBadge('sports');
    });
  }

  if (btnGender) {
    btnGender.addEventListener('click', () => {
      sportsMode = 'gender';
      btnGender.style.borderColor = 'var(--gold-light)';
      if (btnGrade) btnGrade.style.borderColor = 'rgba(255,255,255,0.15)';
      sound.playBeep(560, 'sine', 0.08);
      drawSportsChart();
      unlockBadge('sports');
    });
  }

  drawSportsChart();
}

function drawSportsChart() {
  const canvas = document.getElementById('sportsCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;
  ctx.clearRect(0, 0, w, h);

  const sports = ['Bơi lội', 'Bóng đá', 'Cầu lông', 'Bóng rổ', 'Cờ vua'];

  let col1Label = 'Khối 6-7';
  let col2Label = 'Khối 8-9';
  let data1 = [45, 52, 36, 28, 15];
  let data2 = [38, 60, 42, 35, 10];
  let col1Color = '#38bdf8';
  let col2Color = '#f59e0b';

  if (sportsMode === 'gender') {
    col1Label = 'Học sinh Nam';
    col2Label = 'Học sinh Nữ';
    data1 = [48, 75, 32, 40, 14];
    data2 = [35, 37, 46, 23, 11];
    col1Color = '#06b6d4';
    col2Color = '#ec4899';
  }

  const paddingLeft = 60;
  const paddingRight = 40;
  const paddingTop = 40;
  const paddingBottom = 50;

  const chartW = w - paddingLeft - paddingRight;
  const chartH = h - paddingTop - paddingBottom;
  const maxVal = 80;

  // Draw Grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px Segoe UI';
  ctx.textAlign = 'right';

  for (let v = 0; v <= maxVal; v += 20) {
    const y = paddingTop + chartH - (v / maxVal) * chartH;
    ctx.beginPath();
    ctx.moveTo(paddingLeft, y);
    ctx.lineTo(w - paddingRight, y);
    ctx.stroke();
    ctx.fillText(v, paddingLeft - 8, y + 4);
  }

  // Draw bars
  const groupW = chartW / sports.length;
  const barW = groupW * 0.32;

  sports.forEach((name, i) => {
    const gx = paddingLeft + i * groupW + groupW * 0.18;

    // Bar 1
    const h1 = (data1[i] / maxVal) * chartH;
    const y1 = paddingTop + chartH - h1;
    ctx.fillStyle = col1Color;
    ctx.fillRect(gx, y1, barW, h1);

    // Value 1
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px Segoe UI';
    ctx.textAlign = 'center';
    ctx.fillText(data1[i], gx + barW / 2, y1 - 4);

    // Bar 2
    const gx2 = gx + barW + 6;
    const h2 = (data2[i] / maxVal) * chartH;
    const y2 = paddingTop + chartH - h2;
    ctx.fillStyle = col2Color;
    ctx.fillRect(gx2, y2, barW, h2);

    // Value 2
    ctx.fillText(data2[i], gx2 + barW / 2, y2 - 4);

    // Category Label
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Segoe UI';
    ctx.fillText(name, gx + barW + 3, paddingTop + chartH + 20);
  });

  // Legend
  ctx.textAlign = 'left';
  ctx.fillStyle = col1Color;
  ctx.fillRect(paddingLeft + 10, 14, 14, 14);
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 12px Segoe UI';
  ctx.fillText(col1Label, paddingLeft + 30, 26);

  ctx.fillStyle = col2Color;
  ctx.fillRect(paddingLeft + 160, 14, 14, 14);
  ctx.fillStyle = '#f8fafc';
  ctx.fillText(col2Label, paddingLeft + 180, 26);
}

// --- 6. TAB 3: ĐẤU TRƯỜNG TRẢI NGHIỆM (10 CÂU HỎI SGK) ---
const arenaQuestions = [
  {
    q: "Câu 1: Khoản tiền chi trả cho tiền điện, nước sinh hoạt gia đình hàng tháng thuộc nhóm chi tiêu nào theo SGK?",
    options: [
      "A. Nhóm chi cố định, thiết yếu",
      "B. Nhóm chi cần thiết nhưng linh hoạt",
      "C. Nhóm chi phát sinh",
      "D. Khoản đầu tư sinh lời"
    ],
    correct: 0,
    explanation: "Đúng! Tiền điện, nước, ăn ở, học phí là các nhu cầu thiết yếu bắt buộc phải chi trả hàng tháng cố định."
  },
  {
    q: "Câu 2: Một bạn học sinh được bố mẹ cho 200.000 đồng tiền tiêu vặt trong tháng. Bạn dành ra 50.000 đồng mua sách tham khảo Toán. Tỉ số phần trăm của khoản chi mua sách so với tổng ngân sách là:",
    options: [
      "A. 15%",
      "B. 20%",
      "C. 25%",
      "D. 30%"
    ],
    correct: 2,
    explanation: "Chính xác! Tỉ số phần trăm = (50.000 / 200.000) × 100% = 1/4 × 100% = 25%."
  },
  {
    q: "Câu 3: Theo nguyên tắc quản lý tài chính thông minh 50/30/20, khoản tích lũy tiết kiệm hoặc quỹ dự phòng nên chiếm tỉ lệ tối thiểu khoảng bao nhiêu?",
    options: [
      "A. 5%",
      "B. 10%",
      "C. 20%",
      "D. 50%"
    ],
    correct: 2,
    explanation: "Chính xác! Quy tắc 50/30/20 khuyến nghị 50% cho nhu cầu thiết yếu, 30% cho chi linh hoạt & giải trí, và 20% cho tiết kiệm tích lũy."
  },
  {
    q: "Câu 4: Khi điều tra về môn thể thao hè được yêu thích nhất của 300 học sinh khối 6, phương pháp thu thập dữ liệu nào thuận tiện và chuẩn xác nhất?",
    options: [
      "A. Đo đạc bằng thước cuộn",
      "B. Lập phiếu hỏi hoặc khảo sát trực tuyến",
      "C. Tung đồng xu ngẫu nhiên",
      "D. Đo nhiệt độ cơ thể"
    ],
    correct: 1,
    explanation: "Đúng! Sử dụng phiếu hỏi hoặc form khảo sát trực tuyến giúp thu thập ý kiến định tính và sở thích nhanh chóng, đầy đủ."
  },
  {
    q: "Câu 5: Dựa trên bảng thống kê thể thao hè: số bạn nữ chọn Cầu lông là 46 bạn, số bạn nam chọn Cầu lông là 32 bạn. Số bạn nữ thích cầu lông nhiều hơn nam là bao nhiêu bạn?",
    options: [
      "A. 10 bạn",
      "B. 12 bạn",
      "C. 14 bạn",
      "D. 16 bạn"
    ],
    correct: 2,
    explanation: "Đúng! Phép trừ đơn giản: 46 - 32 = 14 bạn."
  },
  {
    q: "Câu 6: Trên biểu đồ cột kép so sánh thể thao giữa Khối 6-7 và Khối 8-9, nếu cột Bóng đá của Khối 8-9 cao hơn Khối 6-7 thì ta rút ra kết luận gì?",
    options: [
      "A. Khối 6-7 không bạn nào biết đá bóng",
      "B. Khối 8-9 có số lượng học sinh yêu thích môn Bóng đá nhiều hơn Khối 6-7",
      "C. Khối 8-9 chỉ chơi mỗi môn bóng đá",
      "D. Bóng đá là môn thể thao nguy hiểm"
    ],
    correct: 1,
    explanation: "Chính xác! Chiều cao của cột tỉ lệ thuận với số liệu tần số học sinh lựa chọn môn thể thao đó."
  },
  {
    q: "Câu 7: Trong phần mềm hình học GeoGebra, để tìm điểm chính giữa chia đôi đoạn thẳng AB, em sử dụng công cụ nào?",
    options: [
      "A. Công cụ Điểm (Point)",
      "B. Công cụ Đoạn thẳng (Segment)",
      "C. Công cụ Trung điểm hoặc tâm (Midpoint or Center)",
      "D. Công cụ Đường tròn (Circle)"
    ],
    correct: 2,
    explanation: "Đúng! Công cụ 'Trung điểm hoặc tâm' (Midpoint or Center) trong GeoGebra xác định ngay vị trí điểm M chia đoạn thẳng thành 2 phần bằng nhau."
  },
  {
    q: "Câu 8: Khi sử dụng công cụ 'Đa giác đều' (Regular Polygon) trong GeoGebra để vẽ một hình lục giác đều, hộp thoại hỏi số đỉnh ta cần nhập số mấy?",
    options: [
      "A. 3 đỉnh",
      "B. 4 đỉnh",
      "C. 5 đỉnh",
      "D. 6 đỉnh"
    ],
    correct: 3,
    explanation: "Chính xác! Lục giác đều có 6 cạnh và 6 đỉnh bằng nhau nên cần nhập số 6."
  },
  {
    q: "Câu 9: Dùng công cụ Đo góc trong GeoGebra đo được một góc có số đo bằng 125°. Đây là loại góc gì?",
    options: [
      "A. Góc nhọn (nhỏ hơn 90°)",
      "B. Góc vuông (bằng 90°)",
      "C. Góc tù (lớn hơn 90° và nhỏ hơn 180°)",
      "D. Góc bẹt (bằng 180°)"
    ],
    correct: 2,
    explanation: "Chính xác! Vì 90° < 125° < 180° nên góc 125° là một góc tù."
  },
  {
    q: "Câu 10: Toàn bộ chương trình môn Toán 6 Tập 2 (Phân số, Số thập phân, Hình học, Dữ liệu & Xác suất) rèn luyện cho học sinh năng lực then chốt nào?",
    options: [
      "A. Chỉ cần học thuộc lòng công thức",
      "B. Năng lực tư duy logic, tính toán số liệu và vận dụng toán học để giải quyết các vấn đề thực tiễn trong cuộc sống",
      "C. Chơi game trên máy tính cả ngày",
      "D. Vẽ tranh nghệ thuật trừu tượng"
    ],
    correct: 1,
    explanation: "Tuyệt vời! Toán học là chìa khóa mở ra tư duy logic, quản lý tài chính và ra quyết định thông minh dựa trên dữ liệu đời thực."
  }
];

let arenaCurrentIdx = 0;
let arenaScore = 0;

function initArena() {
  arenaCurrentIdx = 0;
  arenaScore = 0;
  renderArenaQuestion();

  const btnNext = document.getElementById('btnNextQuestion');
  const btnRestart = document.getElementById('btnRestartArena');

  if (btnNext) {
    btnNext.addEventListener('click', () => {
      sound.playBeep(450, 'sine', 0.08);
      arenaCurrentIdx++;
      if (arenaCurrentIdx < arenaQuestions.length) {
        renderArenaQuestion();
      } else {
        finishArena();
      }
    });
  }

  if (btnRestart) {
    btnRestart.addEventListener('click', () => {
      sound.playBeep(520, 'sine', 0.1);
      arenaCurrentIdx = 0;
      arenaScore = 0;
      renderArenaQuestion();
    });
  }
}

function renderArenaQuestion() {
  const qObj = arenaQuestions[arenaCurrentIdx];
  const qEl = document.getElementById('arenaQuestion');
  const optsEl = document.getElementById('arenaOptions');
  const fbEl = document.getElementById('arenaFeedback');
  const progEl = document.getElementById('arenaProgressText');
  const scoreEl = document.getElementById('arenaScoreText');
  const btnNext = document.getElementById('btnNextQuestion');
  const btnRestart = document.getElementById('btnRestartArena');

  if (btnNext) btnNext.style.display = 'none';
  if (btnRestart) btnRestart.style.display = 'none';
  if (fbEl) fbEl.style.display = 'none';

  if (progEl) progEl.textContent = `Câu hỏi ${arenaCurrentIdx + 1} / ${arenaQuestions.length}`;
  if (scoreEl) scoreEl.textContent = `Điểm: ${arenaScore} XP`;
  if (qEl) qEl.textContent = qObj.q;

  if (optsEl) {
    optsEl.innerHTML = '';
    qObj.options.forEach((optText, idx) => {
      const btn = document.createElement('button');
      btn.className = 'arena-opt-btn';
      btn.innerHTML = `<span>${optText}</span>`;
      btn.addEventListener('click', () => handleArenaAnswer(idx));
      optsEl.appendChild(btn);
    });
  }
}

function handleArenaAnswer(chosenIdx) {
  const qObj = arenaQuestions[arenaCurrentIdx];
  const opts = document.querySelectorAll('.arena-opt-btn');
  const fbEl = document.getElementById('arenaFeedback');
  const btnNext = document.getElementById('btnNextQuestion');

  opts.forEach(b => (b.disabled = true));

  if (chosenIdx === qObj.correct) {
    opts[chosenIdx].classList.add('correct');
    sound.playCorrect();
    appState.streak++;
    const bonus = 20 + appState.streak * 5;
    arenaScore += bonus;
    addXP(bonus);
    if (fbEl) {
      fbEl.style.display = 'block';
      fbEl.style.borderLeftColor = 'var(--accent-emerald)';
      fbEl.innerHTML = `<strong>🎉 CHÍNH XÁC (+${bonus} XP)!</strong><br>${qObj.explanation}`;
    }
  } else {
    opts[chosenIdx].classList.add('wrong');
    opts[qObj.correct].classList.add('correct');
    sound.playWrong();
    appState.streak = 0;
    if (fbEl) {
      fbEl.style.display = 'block';
      fbEl.style.borderLeftColor = 'var(--accent-rose)';
      fbEl.innerHTML = `<strong>Chưa chính xác!</strong><br>${qObj.explanation}`;
    }
  }

  updateHud();
  if (btnNext) {
    btnNext.style.display = 'inline-block';
    if (arenaCurrentIdx === arenaQuestions.length - 1) {
      btnNext.textContent = 'Xem Kết Quả Đấu Trường 🏆';
    } else {
      btnNext.textContent = 'Câu Tiếp Theo ➡️';
    }
  }
}

function finishArena() {
  const qEl = document.getElementById('arenaQuestion');
  const optsEl = document.getElementById('arenaOptions');
  const fbEl = document.getElementById('arenaFeedback');
  const btnNext = document.getElementById('btnNextQuestion');
  const btnRestart = document.getElementById('btnRestartArena');

  if (btnNext) btnNext.style.display = 'none';
  if (optsEl) optsEl.innerHTML = '';

  sound.playFanfare();
  if (arenaScore >= 160) {
    unlockBadge('arena');
  }

  if (qEl) {
    qEl.innerHTML = `
      <div style="text-align: center; padding: 20px 0;">
        <div style="font-size: 3rem; margin-bottom: 10px;">🏆</div>
        <h2 style="color: var(--gold-light); margin-bottom: 8px;">ĐẤU TRƯỜNG HOÀN THÀNH XUẤT SẮC!</h2>
        <p style="color: var(--text-secondary); font-size: 1.05rem;">
          Bạn đã ghi được tổng cộng <strong>${arenaScore} XP</strong> trong Đấu Trường Thực Hành Trải Nghiệm!
        </p>
      </div>
    `;
  }

  if (fbEl) {
    fbEl.style.display = 'block';
    fbEl.style.borderLeftColor = 'var(--gold-light)';
    fbEl.innerHTML = `
      <strong>🌟 Đánh giá từ Ban Giám Khảo:</strong><br>
      Bạn đã làm chủ hoàn hảo cả 3 dự án: Lập ngân sách tài chính, Thống kê thể thao hè và Thực hành hình học động GeoGebra! Hãy xem Tab <strong>Huy Hiệu & Giấy Chứng Nhận</strong> để in Bằng Tốt Nghiệp A4!
    `;
  }

  if (btnRestart) btnRestart.style.display = 'inline-block';
}

// --- 7. MODAL CHỌN AVATAR & TIỆN ÍCH ---
function initAvatarModal() {
  const btn = document.getElementById('avatarBtn');
  const modal = document.getElementById('avatarModal');
  const btnClose = document.getElementById('btnCloseModal');
  const choices = document.querySelectorAll('.avatar-choice');

  if (btn && modal) {
    btn.addEventListener('click', () => {
      sound.playBeep(450, 'sine', 0.08);
      modal.classList.add('active');
    });
  }

  if (btnClose && modal) {
    btnClose.addEventListener('click', () => {
      sound.playBeep(520, 'sine', 0.08);
      modal.classList.remove('active');
      saveState();
    });
  }

  choices.forEach(choice => {
    choice.addEventListener('click', () => {
      sound.playBeep(600, 'triangle', 0.1);
      choices.forEach(c => c.classList.remove('selected'));
      choice.classList.add('selected');
      appState.avatar = choice.dataset.avatar;
      appState.userTitle = choice.dataset.title;
      updateHud();
    });
  });
}

function initActions() {
  const soundBtn = document.getElementById('soundToggle');
  const resetBtn = document.getElementById('resetProgress');

  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      sound.enabled = !sound.enabled;
      appState.soundEnabled = sound.enabled;
      soundBtn.textContent = sound.enabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      sound.playBeep(500, 'sine', 0.08);
    });
  }

  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn đặt lại toàn bộ tiến trình học tập của bài học này?')) {
        localStorage.removeItem(STATE_KEY);
        location.reload();
      }
    });
  }

  // Set date in certificate
  const certDate = document.getElementById('certDate');
  if (certDate) {
    const d = new Date();
    certDate.textContent = `Hà Nội, ngày ${d.getDate()} tháng ${d.getMonth() + 1} năm ${d.getFullYear()}`;
  }
}

// --- 8. KHỞI CHẠY (INITIALIZATION) ---
window.addEventListener('DOMContentLoaded', () => {
  loadState();
  initTabs();
  initBudgetLab();
  initGeoLab();
  initSportsChart();
  initArena();
  initAvatarModal();
  initActions();
});
