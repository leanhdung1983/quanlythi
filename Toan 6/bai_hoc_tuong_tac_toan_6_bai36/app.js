// APP.JS - BÀI 36: GÓC
// Toán 6 Tập 2 - Kết Nối Tri Thức Với Cuộc Sống (Trang 58 - 60)

document.addEventListener('DOMContentLoaded', () => {
  // --- ÂM THANH WEB AUDIO SYNTHESIZER ---
  class SoundFX {
    constructor() {
      this.ctx = null;
      this.enabled = true;
    }
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AudioContext();
      }
    }
    beep(freq, duration, type = 'sine') {
      if (!this.enabled) return;
      this.init();
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.15, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn(e);
      }
    }
    correct() {
      this.beep(523.25, 0.1, 'triangle'); // C5
      setTimeout(() => this.beep(659.25, 0.15, 'triangle'), 100); // E5
      setTimeout(() => this.beep(783.99, 0.25, 'triangle'), 200); // G5
    }
    wrong() {
      this.beep(240, 0.15, 'sawtooth');
      setTimeout(() => this.beep(180, 0.25, 'sawtooth'), 150);
    }
    badge() {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((f, i) => {
        setTimeout(() => this.beep(f, 0.2, 'sine'), i * 120);
      });
    }
    click() {
      this.beep(700, 0.04, 'sine');
    }
  }

  const sfx = new SoundFX();

  // --- TRẠNG THÁI ỨNG DỤNG ---
  const state = {
    studentName: 'Kỹ Sư Góc Lớp 6',
    avatar: '📐',
    score: 0,
    stars: 0,
    streak: 0,
    answeredQuestions: {},
    unlockedBadges: new Set(),
    soundOn: true
  };

  // --- DOM ELEMENTS ---
  const startModal = document.getElementById('start-modal');
  const btnEnterGame = document.getElementById('btn-enter-game');
  const studentNameInput = document.getElementById('student-name-input');
  const avatarBtns = document.querySelectorAll('.avatar-btn');

  const hudAvatar = document.getElementById('hud-avatar-display');
  const hudName = document.getElementById('hud-name-display');
  const hudRank = document.getElementById('hud-rank-display');
  const hudScore = document.getElementById('hud-score');
  const hudStars = document.getElementById('hud-stars');
  const hudStreak = document.getElementById('hud-streak');
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  const btnResetGame = document.getElementById('btn-reset-game');

  // Avatar Selection
  avatarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      avatarBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.avatar = btn.getAttribute('data-avatar');
      sfx.click();
    });
  });

  // Enter Game
  btnEnterGame.addEventListener('click', () => {
    const val = studentNameInput.value.trim();
    if (val) state.studentName = val;
    startModal.classList.add('hidden');
    sfx.init();
    sfx.correct();
    updateHUD();
    renderQuiz();
    checkBadges();
  });

  // Sound Toggle
  btnToggleSound.addEventListener('click', () => {
    state.soundOn = !state.soundOn;
    sfx.enabled = state.soundOn;
    btnToggleSound.textContent = state.soundOn ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
    sfx.click();
  });

  // Reset Game
  btnResetGame.addEventListener('click', () => {
    if (confirm('Em có chắc chắn muốn đặt lại điểm số và câu hỏi về trạng thái đầu?')) {
      state.score = 0;
      state.stars = 0;
      state.streak = 0;
      state.answeredQuestions = {};
      state.unlockedBadges.clear();
      updateHUD();
      renderQuiz();
      checkBadges();
      sfx.click();
    }
  });

  function updateHUD() {
    hudAvatar.textContent = state.avatar;
    hudName.textContent = state.studentName;
    hudScore.textContent = state.score;
    hudStars.textContent = state.stars;
    hudStreak.textContent = state.streak;

    if (state.score >= 800) {
      hudRank.textContent = 'Đại Kiện Tướng Hình Học';
    } else if (state.score >= 500) {
      hudRank.textContent = 'Chuyên Gia Góc Phẳng';
    } else if (state.score >= 200) {
      hudRank.textContent = 'Nhà Nghiên Cứu Góc';
    } else {
      hudRank.textContent = 'Tập Sự Góc Phẳng';
    }
  }

  // ==========================================
  // LAB 1: CANVAS XOAY GÓC & ĐIỂM TRONG
  // ==========================================
  const angleCanvas = document.getElementById('angle-canvas');
  const angleCtx = angleCanvas.getContext('2d');
  const angleInfoBox = document.getElementById('angle-info-box');

  const btnAcute = document.getElementById('btn-preset-acute');
  const btnRight = document.getElementById('btn-preset-right');
  const btnStraight = document.getElementById('btn-preset-straight');
  const btnResetPts = document.getElementById('btn-reset-points');

  // Vertex O
  const origin = { x: 325, y: 190, label: 'O' };
  const rayLength = 170;

  // Angles in radians from standard math orientation (0 = pointing right)
  let angleX = 0; // ray Ox along horizontal right
  let angleY = -Math.PI / 3; // ray Oy at 60 deg up
  let pointM = { x: 380, y: 100, label: 'M' }; // test point inside or outside

  let draggedEntity = null; // 'rayX', 'rayY', 'pointM'

  function isAngleStraight() {
    // Check if ray Ox and ray Oy are opposite (difference close to PI)
    const diff = Math.abs(normalizeAngle(angleX - angleY));
    return Math.abs(diff - Math.PI) < 0.08;
  }

  function normalizeAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a <= -Math.PI) a += Math.PI * 2;
    return a;
  }

  function isPointInsideAngle(px, py) {
    if (isAngleStraight()) return false; // straight angle does not have standard interior

    // Vector from O to M
    const dx = px - origin.x;
    const dy = py - origin.y;
    const angleM = Math.atan2(dy, dx);

    // Cross product signs relative to rayX and rayY
    const vx = Math.cos(angleX);
    const vy = Math.sin(angleX);
    const uy = Math.cos(angleY);
    const ux = Math.sin(angleY);

    // Using angle difference
    let diffXY = normalizeAngle(angleY - angleX);
    let diffXM = normalizeAngle(angleM - angleX);

    if (diffXY > 0) {
      return diffXM > 0 && diffXM < diffXY;
    } else {
      return diffXM < 0 && diffXM > diffXY;
    }
  }

  function drawAngleLab() {
    angleCtx.clearRect(0, 0, angleCanvas.width, angleCanvas.height);

    const rx = origin.x + Math.cos(angleX) * rayLength;
    const ry = origin.y + Math.sin(angleX) * rayLength;
    const qx = origin.x + Math.cos(angleY) * rayLength;
    const qy = origin.y + Math.sin(angleY) * rayLength;

    const inside = isPointInsideAngle(pointM.x, pointM.y);
    const straight = isAngleStraight();

    // 1. Shaded Interior Sector
    if (!straight) {
      angleCtx.save();
      angleCtx.beginPath();
      angleCtx.moveTo(origin.x, origin.y);
      let startA = angleX;
      let endA = angleY;
      let diff = normalizeAngle(endA - startA);
      let anticlockwise = diff < 0;

      angleCtx.arc(origin.x, origin.y, rayLength, startA, endA, anticlockwise);
      angleCtx.closePath();
      angleCtx.fillStyle = 'rgba(139, 92, 246, 0.12)';
      angleCtx.fill();
      angleCtx.restore();
    }

    // 2. Angle Arc indicator at origin
    angleCtx.beginPath();
    let arcR = 36;
    let diff = normalizeAngle(angleY - angleX);
    angleCtx.arc(origin.x, origin.y, arcR, angleX, angleY, diff < 0);
    angleCtx.strokeStyle = '#8b5cf6';
    angleCtx.lineWidth = 2.5;
    angleCtx.stroke();

    // 3. Draw Rays Ox and Oy
    // Ray Ox
    angleCtx.strokeStyle = '#6d28d9';
    angleCtx.lineWidth = 4;
    angleCtx.beginPath();
    angleCtx.moveTo(origin.x, origin.y);
    angleCtx.lineTo(rx, ry);
    angleCtx.stroke();
    drawArrow(rx, ry, angleX, '#6d28d9');

    // Ray Oy
    angleCtx.strokeStyle = '#ec4899';
    angleCtx.lineWidth = 4;
    angleCtx.beginPath();
    angleCtx.moveTo(origin.x, origin.y);
    angleCtx.lineTo(qx, qy);
    angleCtx.stroke();
    drawArrow(qx, qy, angleY, '#ec4899');

    // Labels for rays
    angleCtx.font = 'bold italic 16px "Segoe UI", sans-serif';
    angleCtx.fillStyle = '#6d28d9';
    angleCtx.fillText('x', rx + Math.cos(angleX) * 15, ry + Math.sin(angleX) * 15);

    angleCtx.fillStyle = '#ec4899';
    angleCtx.fillText('y', qx + Math.cos(angleY) * 15, qy + Math.sin(angleY) * 15);

    // 4. Vertex O
    angleCtx.beginPath();
    angleCtx.arc(origin.x, origin.y, 8, 0, Math.PI * 2);
    angleCtx.fillStyle = '#1e1b4b';
    angleCtx.fill();
    angleCtx.strokeStyle = '#ffffff';
    angleCtx.lineWidth = 2;
    angleCtx.stroke();

    angleCtx.font = 'bold 16px sans-serif';
    angleCtx.fillStyle = '#1e1b4b';
    angleCtx.fillText('Đỉnh O', origin.x - 22, origin.y + 25);

    // 5. Test Point M
    angleCtx.beginPath();
    angleCtx.arc(pointM.x, pointM.y, 9, 0, Math.PI * 2);
    angleCtx.fillStyle = straight ? '#64748b' : (inside ? '#10b981' : '#ef4444');
    angleCtx.fill();
    angleCtx.strokeStyle = '#ffffff';
    angleCtx.lineWidth = 2.5;
    angleCtx.stroke();

    angleCtx.font = 'bold 15px sans-serif';
    angleCtx.fillStyle = straight ? '#64748b' : (inside ? '#047857' : '#b91c1c');
    angleCtx.fillText('Điểm M', pointM.x - 22, pointM.y - 14);

    // Degree readout
    let deg = Math.round(Math.abs(normalizeAngle(angleY - angleX)) * 180 / Math.PI);
    angleCtx.font = 'bold 15px sans-serif';
    angleCtx.fillStyle = '#7c3aed';
    angleCtx.fillText(`Góc xOy ≈ ${deg}°`, origin.x - 45, origin.y - 50);
  }

  function drawArrow(x, y, angle, color) {
    angleCtx.save();
    angleCtx.translate(x, y);
    angleCtx.rotate(angle);
    angleCtx.beginPath();
    angleCtx.moveTo(0, 0);
    angleCtx.lineTo(-12, -6);
    angleCtx.lineTo(-12, 6);
    angleCtx.closePath();
    angleCtx.fillStyle = color;
    angleCtx.fill();
    angleCtx.restore();
  }

  function updateAngleInfo() {
    let deg = Math.round(Math.abs(normalizeAngle(angleY - angleX)) * 180 / Math.PI);
    const straight = isAngleStraight();
    const inside = isPointInsideAngle(pointM.x, pointM.y);

    let html = `<strong>Kí hiệu:</strong> $\\widehat{xOy}$ (Đỉnh: <strong>O</strong>, hai cạnh: tia <strong>Ox</strong> và tia <strong>Oy</strong>). Độ mở: <strong>${deg}°</strong>.<br>`;

    if (straight) {
      html += `<span style="color:#6d28d9; font-weight:700;">↔️ GÓC BẸT:</span> Hai tia Ox và Oy là <strong>hai tia đối nhau</strong> tạo thành một đường thẳng trọn vẹn $180^\\circ$.`;
    } else if (inside) {
      html += `<span style="color:#10b981; font-weight:700;">✅ ĐIỂM M NẰM TRONG GÓC xOy:</span> Điểm M nằm trong phần mặt phẳng được giới hạn bởi hai tia Ox và Oy.`;
    } else {
      html += `<span style="color:#ef4444; font-weight:700;">❌ ĐIỂM M NẰM NGOÀI GÓC xOy:</span> Điểm M không thuộc miền trong của góc. Hãy thử kéo điểm M vào giữa hai tia!`;
    }

    angleInfoBox.innerHTML = html;
  }

  // Mouse / Touch handlers for Lab 1
  function getAnglePos(e) {
    const rect = angleCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (angleCanvas.width / rect.width),
      y: (clientY - rect.top) * (angleCanvas.height / rect.height)
    };
  }

  angleCanvas.addEventListener('mousedown', (e) => {
    const pos = getAnglePos(e);
    const rx = origin.x + Math.cos(angleX) * rayLength;
    const ry = origin.y + Math.sin(angleX) * rayLength;
    const qx = origin.x + Math.cos(angleY) * rayLength;
    const qy = origin.y + Math.sin(angleY) * rayLength;

    if (Math.hypot(pos.x - pointM.x, pos.y - pointM.y) < 20) {
      draggedEntity = 'pointM';
    } else if (Math.hypot(pos.x - rx, pos.y - ry) < 25) {
      draggedEntity = 'rayX';
    } else if (Math.hypot(pos.x - qx, pos.y - qy) < 25) {
      draggedEntity = 'rayY';
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (draggedEntity) {
      const pos = getAnglePos(e);
      if (draggedEntity === 'pointM') {
        pointM.x = Math.max(20, Math.min(angleCanvas.width - 20, pos.x));
        pointM.y = Math.max(20, Math.min(angleCanvas.height - 20, pos.y));
      } else if (draggedEntity === 'rayX') {
        angleX = Math.atan2(pos.y - origin.y, pos.x - origin.x);
      } else if (draggedEntity === 'rayY') {
        angleY = Math.atan2(pos.y - origin.y, pos.x - origin.x);
      }
      drawAngleLab();
      updateAngleInfo();
    }
  });

  window.addEventListener('mouseup', () => {
    draggedEntity = null;
  });

  // Touch handlers
  angleCanvas.addEventListener('touchstart', (e) => {
    const pos = getAnglePos(e);
    const rx = origin.x + Math.cos(angleX) * rayLength;
    const ry = origin.y + Math.sin(angleX) * rayLength;
    const qx = origin.x + Math.cos(angleY) * rayLength;
    const qy = origin.y + Math.sin(angleY) * rayLength;

    if (Math.hypot(pos.x - pointM.x, pos.y - pointM.y) < 28) {
      draggedEntity = 'pointM';
    } else if (Math.hypot(pos.x - rx, pos.y - ry) < 30) {
      draggedEntity = 'rayX';
    } else if (Math.hypot(pos.x - qx, pos.y - qy) < 30) {
      draggedEntity = 'rayY';
    }
  });

  window.addEventListener('touchmove', (e) => {
    if (draggedEntity) {
      const pos = getAnglePos(e);
      if (draggedEntity === 'pointM') {
        pointM.x = Math.max(20, Math.min(angleCanvas.width - 20, pos.x));
        pointM.y = Math.max(20, Math.min(angleCanvas.height - 20, pos.y));
      } else if (draggedEntity === 'rayX') {
        angleX = Math.atan2(pos.y - origin.y, pos.x - origin.x);
      } else if (draggedEntity === 'rayY') {
        angleY = Math.atan2(pos.y - origin.y, pos.x - origin.x);
      }
      drawAngleLab();
      updateAngleInfo();
    }
  });

  window.addEventListener('touchend', () => {
    draggedEntity = null;
  });

  // Presets
  btnAcute.addEventListener('click', () => {
    angleX = 0;
    angleY = -Math.PI / 4; // 45 deg
    pointM = { x: 420, y: 150, label: 'M' };
    drawAngleLab();
    updateAngleInfo();
    sfx.click();
  });

  btnRight.addEventListener('click', () => {
    angleX = 0;
    angleY = -Math.PI / 2; // 90 deg
    pointM = { x: 400, y: 110, label: 'M' };
    drawAngleLab();
    updateAngleInfo();
    sfx.click();
  });

  btnStraight.addEventListener('click', () => {
    angleX = 0; // right
    angleY = Math.PI; // left
    pointM = { x: 325, y: 100, label: 'M' };
    drawAngleLab();
    updateAngleInfo();
    sfx.click();
  });

  btnResetPts.addEventListener('click', () => {
    angleX = 0;
    angleY = -Math.PI / 3;
    pointM = { x: 380, y: 100, label: 'M' };
    drawAngleLab();
    updateAngleInfo();
    sfx.click();
  });

  drawAngleLab();
  updateAngleInfo();

  // ==========================================
  // LAB 2: ĐỒNG HỒ 8H15 & GÓC SÚT BÓNG ĐÁ
  // ==========================================
  const clockCanvas = document.getElementById('clock-canvas');
  const clockCtx = clockCanvas.getContext('2d');
  const btnInspectClock = document.getElementById('btn-inspect-clock');
  const clockResult = document.getElementById('clock-result');
  const btnInspectGoal = document.getElementById('btn-inspect-goal');
  const goalResult = document.getElementById('goal-result');

  btnInspectClock.addEventListener('click', () => {
    clockResult.style.display = clockResult.style.display === 'block' ? 'none' : 'block';
    sfx.click();
  });

  btnInspectGoal.addEventListener('click', () => {
    goalResult.style.display = goalResult.style.display === 'block' ? 'none' : 'block';
    sfx.click();
  });

  function drawClockLab() {
    clockCtx.clearRect(0, 0, clockCanvas.width, clockCanvas.height);

    // 1. Clock Face (Left: cx = 180, cy = 105, r = 80)
    const cx = 180;
    const cy = 105;
    const cr = 80;

    // Clock background
    clockCtx.beginPath();
    clockCtx.arc(cx, cy, cr, 0, Math.PI * 2);
    clockCtx.fillStyle = '#1e1b4b';
    clockCtx.fill();
    clockCtx.strokeStyle = '#8b5cf6';
    clockCtx.lineWidth = 3;
    clockCtx.stroke();

    // 8h15: minute hand at 3 (angle = 0 rad relative to 3 o'clock)
    // hour hand at 8h15: (8 + 15/60) / 12 * 2PI - PI/2 = 8.25/12 * 2PI - PI/2 = 4.32 - 1.57 = 2.75 rad
    const minAngle = 0; // 3 o'clock in standard math (cos=1, sin=0)
    const hourAngle = (8.25 / 12) * Math.PI * 2 - Math.PI / 2;

    // Shaded angle sector between minute hand (at 3) and hour hand (at 8:15) through 4, 5, 6, 7, 8
    clockCtx.beginPath();
    clockCtx.moveTo(cx, cy);
    clockCtx.arc(cx, cy, cr - 4, minAngle, hourAngle, false);
    clockCtx.closePath();
    clockCtx.fillStyle = 'rgba(236, 72, 153, 0.25)';
    clockCtx.fill();

    // Numbers 1 to 12
    clockCtx.font = 'bold 12px sans-serif';
    for (let num = 1; num <= 12; num++) {
      const a = (num / 12) * Math.PI * 2 - Math.PI / 2;
      const nx = cx + Math.cos(a) * (cr - 18);
      const ny = cy + Math.sin(a) * (cr - 18) + 4;

      // Highlight numbers 4, 5, 6, 7, 8 inside the angle
      if (num >= 4 && num <= 8) {
        clockCtx.fillStyle = '#fde047';
        clockCtx.beginPath();
        clockCtx.arc(nx, ny - 4, 9, 0, Math.PI * 2);
        clockCtx.fill();
        clockCtx.fillStyle = '#0f172a';
      } else {
        clockCtx.fillStyle = '#cbd5e1';
      }
      clockCtx.fillText(`${num}`, nx - 4, ny);
    }

    // Minute Hand (pointing at 3)
    clockCtx.strokeStyle = '#38bdf8';
    clockCtx.lineWidth = 3;
    clockCtx.beginPath();
    clockCtx.moveTo(cx, cy);
    clockCtx.lineTo(cx + Math.cos(minAngle) * 58, cy + Math.sin(minAngle) * 58);
    clockCtx.stroke();

    // Hour Hand (pointing at ~8:15)
    clockCtx.strokeStyle = '#f43f5e';
    clockCtx.lineWidth = 4.5;
    clockCtx.beginPath();
    clockCtx.moveTo(cx, cy);
    clockCtx.lineTo(cx + Math.cos(hourAngle) * 44, cy + Math.sin(hourAngle) * 44);
    clockCtx.stroke();

    // Center pin
    clockCtx.beginPath();
    clockCtx.arc(cx, cy, 4, 0, Math.PI * 2);
    clockCtx.fillStyle = '#ffffff';
    clockCtx.fill();

    // Label Clock
    clockCtx.font = 'bold 12px sans-serif';
    clockCtx.fillStyle = '#e2e8f0';
    clockCtx.fillText('Đồng hồ 8:15', cx - 35, cy + cr + 18);

    // 2. Football Goal Kick (Right side: gx = 480, gy = 105)
    const gx = 480;
    const gy = 105;

    // Goal posts
    const postTop = { x: 580, y: 55 };
    const postBot = { x: 580, y: 155 };
    const ball = { x: 400, y: 105 };

    // Net line
    clockCtx.strokeStyle = '#ffffff';
    clockCtx.lineWidth = 3;
    clockCtx.beginPath();
    clockCtx.moveTo(postTop.x, postTop.y);
    clockCtx.lineTo(postBot.x, postBot.y);
    clockCtx.stroke();

    // Shooting cone / angle
    clockCtx.beginPath();
    clockCtx.moveTo(ball.x, ball.y);
    clockCtx.lineTo(postTop.x, postTop.y);
    clockCtx.lineTo(postBot.x, postBot.y);
    clockCtx.closePath();
    clockCtx.fillStyle = 'rgba(16, 185, 129, 0.2)';
    clockCtx.fill();

    // Two rays of kick angle
    clockCtx.strokeStyle = '#10b981';
    clockCtx.lineWidth = 2;
    clockCtx.beginPath();
    clockCtx.moveTo(ball.x, ball.y);
    clockCtx.lineTo(postTop.x, postTop.y);
    clockCtx.moveTo(ball.x, ball.y);
    clockCtx.lineTo(postBot.x, postBot.y);
    clockCtx.stroke();

    // Football
    clockCtx.beginPath();
    clockCtx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
    clockCtx.fillStyle = '#ffffff';
    clockCtx.fill();
    clockCtx.strokeStyle = '#0f172a';
    clockCtx.lineWidth = 2;
    clockCtx.stroke();

    clockCtx.font = 'bold 12px sans-serif';
    clockCtx.fillStyle = '#10b981';
    clockCtx.fillText('Góc Sút Khung Thành', gx - 60, gy + 70);
  }

  drawClockLab();

  // ==========================================
  // SECTION 3: ĐẤU TRƯỜNG SGK (10 CÂU HỎI BÀI 36)
  // ==========================================
  const quizQuestions = [
    {
      id: 1,
      tag: 'SGK Trang 58',
      title: 'Góc là hình gồm hai yếu tố nào dưới đây?',
      options: [
        'Hai tia chung gốc (gốc chung là đỉnh, hai tia là hai cạnh của góc)',
        'Hai đường thẳng song song không có điểm chung',
        'Hai đoạn thẳng cắt nhau tại trung điểm của mỗi đoạn',
        'Một điểm và một đường tròn bao quanh'
      ],
      correct: 0,
      exp: 'Chính xác! Định nghĩa SGK: Góc là hình gồm hai tia chung gốc. Gốc chung của hai tia là đỉnh của góc, hai tia là hai cạnh của góc.'
    },
    {
      id: 2,
      tag: 'SGK Trang 58',
      title: 'Trong góc xOy, điểm O được gọi là gì và hai tia Ox, Oy được gọi là gì?',
      options: [
        'Điểm O là đỉnh, hai tia Ox và Oy là hai cạnh của góc',
        'Điểm O là cạnh, hai tia Ox và Oy là hai đỉnh',
        'Điểm O là trung điểm, hai tia Ox và Oy là hai đường thẳng',
        'Điểm O là góc bẹt, hai tia Ox và Oy là hai đoạn thẳng'
      ],
      correct: 0,
      exp: 'Chính xác! Gốc chung O là đỉnh của góc xOy, hai tia Ox và Oy là hai cạnh của góc.'
    },
    {
      id: 3,
      tag: 'Kí Hiệu SGK Trang 58',
      title: 'Góc có đỉnh là M, hai cạnh là hai tia Mx và My được viết kí hiệu chuẩn là:',
      options: [
        'Góc xMy, kí hiệu là xMy (hoặc yMx, có dấu mũ ở trên)',
        'Góc Mxy',
        'Góc xyM',
        'Góc Mx'
      ],
      correct: 0,
      exp: 'Chính xác! Khi viết tên góc bằng 3 chữ cái, chữ cái chỉ đỉnh luôn luôn phải viết ở CHÍNH GIỮA: góc xMy (hoặc yMx).'
    },
    {
      id: 4,
      tag: 'Khái Niệm Góc Bẹt',
      title: 'Khi hai tia Ox và Oy là hai tia đối nhau, ta có góc gì?',
      options: [
        'Góc bẹt xOy',
        'Góc nhọn xOy',
        'Góc vuông xOy',
        'Góc không có cạnh'
      ],
      correct: 0,
      exp: 'Chính xác! Khi hai tia Ox và Oy là hai tia đối nhau, chúng tạo thành một đường thẳng trọn vẹn và góc xOy khi đó là một góc bẹt.'
    },
    {
      id: 5,
      tag: 'SGK 8.26 Trang 60',
      title: 'Cho đường thẳng xy. Lấy hai điểm phân biệt A và B nằm trên đường thẳng xy. Các góc bẹt tạo thành có đỉnh là A và B lần lượt là:',
      options: [
        'Góc bẹt xAy và góc bẹt xBy',
        'Chỉ có góc bẹt xAy',
        'Góc xBy và góc ABx',
        'Không có góc bẹt nào được tạo thành'
      ],
      correct: 0,
      exp: 'Chính xác! Tại điểm A có hai tia đối nhau Ax và Ay tạo thành góc bẹt xAy. Tương tự tại B có góc bẹt xBy.'
    },
    {
      id: 6,
      tag: 'SGK 8.27 Trang 60',
      title: 'Quan sát mặt đồng hồ lúc 8 giờ 15 phút. Trong các vạch chỉ số trên mặt đồng hồ, những vạch nào nằm trong góc (nhỏ hơn góc bẹt) tạo bởi kim giờ và kim phút?',
      options: [
        'Các vạch số: 4, 5, 6, 7, 8',
        'Các vạch số: 1, 2, 3',
        'Các vạch số: 9, 10, 11, 12',
        'Tất cả các số từ 1 đến 12'
      ],
      correct: 0,
      exp: 'Chính xác! Kim phút ở số 3, kim giờ qua số 8 một chút. Miền góc nhỏ hơn góc bẹt nằm theo chiều kim đồng hồ từ số 3 đến kim giờ, chứa các vạch số: 4, 5, 6, 7, 8!'
    },
    {
      id: 7,
      tag: 'SGK 8.28 Trang 60',
      title: 'Cho ba tia chung gốc Oa, Ob, Oc, trong đó không có hai tia nào đối nhau. Có tất cả bao nhiêu góc có hai cạnh là hai trong ba tia đã cho?',
      options: [
        '3 góc (góc aOb, góc bOc, góc aOc)',
        '2 góc',
        '4 góc',
        '6 góc'
      ],
      correct: 0,
      exp: 'Chính xác! Chọn 2 tia bất kì trong 3 tia để tạo thành 1 góc: có 3 × 2 : 2 = 3 góc, gồm góc aOb, góc bOc và góc aOc.'
    },
    {
      id: 8,
      tag: 'SGK 8.30 Trang 60',
      title: 'Lấy ba điểm không thẳng hàng A, B, C. Phần hình phẳng chứa tất cả các điểm trong của cả ba góc BAC, ACB, CBA chính là:',
      options: [
        'Phần bên trong (miền trong) của tam giác ABC',
        'Phần bên ngoài tam giác ABC',
        'Chính là đoạn thẳng AB',
        'Là hình tròn tâm A'
      ],
      correct: 0,
      exp: 'Chính xác! Điểm thuộc miền trong của cả 3 góc tam giác chính là các điểm nằm trọn vẹn trong tam giác ABC (miền trong của tam giác ABC).'
    },
    {
      id: 9,
      tag: 'Điểm Trong Của Góc',
      title: 'Cho góc xOy (không bẹt). Điểm nào sau đây KHÔNG PHẢI là điểm trong của góc xOy?',
      options: [
        'Điểm nằm trên tia Ox hoặc tia Oy (điểm trên cạnh không phải điểm trong)',
        'Điểm nằm trong phần mặt phẳng kẹp giữa hai tia Ox và Oy',
        'Điểm nối với đỉnh O tạo thành một tia nằm giữa Ox và Oy',
        'Điểm thuộc miền trong góc'
      ],
      correct: 0,
      exp: 'Chính xác! Theo định nghĩa SGK trang 59: Các điểm nằm trên hai cạnh của góc và các điểm bên ngoài không phải là điểm trong của góc.'
    },
    {
      id: 10,
      tag: 'SGK Vận Dụng 1 Trang 59',
      title: 'Khi mở một chiếc compa học sinh ra, ta thấy hình ảnh của một góc. Đỉnh của góc đó ứng với bộ phận nào của chiếc compa?',
      options: [
        'Khớp xoay nối hai chân compa (đỉnh compa)',
        'Đầu nhọn kim loại của compa',
        'Đầu cắm ngòi bút chì',
        'Toàn bộ vòng tròn do compa vẽ ra'
      ],
      correct: 0,
      exp: 'Chính xác! Đỉnh của chiếc compa (khớp xoay) chính là đỉnh của góc, hai thanh kim loại mở ra là hình ảnh hai cạnh của góc.'
    }
  ];

  const quizContainer = document.getElementById('quiz-container');
  const quizProgressText = document.getElementById('quiz-progress-text');

  function renderQuiz() {
    quizContainer.innerHTML = '';
    let answeredCount = 0;

    quizQuestions.forEach((q, index) => {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.id = `q-card-${q.id}`;

      const answered = state.answeredQuestions[q.id];
      if (answered !== undefined) {
        answeredCount++;
        card.classList.add(answered === q.correct ? 'answered-correct' : 'answered-wrong');
      }

      let optionsHtml = '';
      q.options.forEach((opt, optIdx) => {
        let optClass = 'opt-btn';
        if (answered !== undefined) {
          if (optIdx === q.correct) optClass += ' correct';
          else if (optIdx === answered) optClass += ' wrong';
        }

        optionsHtml += `
          <button class="${optClass}" data-qid="${q.id}" data-opt="${optIdx}" ${answered !== undefined ? 'disabled' : ''}>
            <strong>${String.fromCharCode(65 + optIdx)}.</strong> ${opt}
          </button>
        `;
      });

      card.innerHTML = `
        <div class="q-title">
          <span><strong>Câu ${index + 1}:</strong> ${q.title}</span>
          <span style="font-size: 0.8rem; color: #6d28d9; background: #f3e8ff; padding: 2px 8px; border-radius: 12px; height: fit-content; white-space: nowrap;">${q.tag}</span>
        </div>
        <div class="options-grid">
          ${optionsHtml}
        </div>
        <div class="explanation-box ${answered !== undefined ? 'show' : ''}" id="exp-${q.id}">
          ${q.exp}
        </div>
      `;

      quizContainer.appendChild(card);
    });

    quizProgressText.textContent = `${answeredCount}/${quizQuestions.length} Hoàn thành`;

    const buttons = quizContainer.querySelectorAll('.opt-btn');
    buttons.forEach(btn => {
      btn.addEventListener('click', handleAnswer);
    });
  }

  function handleAnswer(e) {
    const qid = parseInt(e.currentTarget.getAttribute('data-qid'), 10);
    const chosen = parseInt(e.currentTarget.getAttribute('data-opt'), 10);
    const q = quizQuestions.find(item => item.id === qid);

    if (state.answeredQuestions[qid] !== undefined) return;

    state.answeredQuestions[qid] = chosen;

    if (chosen === q.correct) {
      state.score += 100;
      state.stars += 1;
      state.streak += 1;
      sfx.correct();
    } else {
      state.streak = 0;
      sfx.wrong();
    }

    updateHUD();
    renderQuiz();
    checkBadges();
  }

  // ==========================================
  // BADGES & CERTIFICATE
  // ==========================================
  function checkBadges() {
    // Badge 1: 200 XP
    if (state.score >= 200 && !state.unlockedBadges.has(1)) {
      unlockBadge(1);
    }
    // Badge 2: Question 6 (clock 8:15) correct
    if (state.answeredQuestions[6] === 0 && !state.unlockedBadges.has(2)) {
      unlockBadge(2);
    }
    // Badge 3: Streak >= 3
    if (state.streak >= 3 && !state.unlockedBadges.has(3)) {
      unlockBadge(3);
    }
    // Badge 4: 500 XP
    if (state.score >= 500 && !state.unlockedBadges.has(4)) {
      unlockBadge(4);
    }
    // Badge 5: 10/10 stars
    if (state.stars >= 10 && !state.unlockedBadges.has(5)) {
      unlockBadge(5);
    }
  }

  function unlockBadge(id) {
    state.unlockedBadges.add(id);
    const badgeEl = document.getElementById(`badge-${id}`);
    if (badgeEl) {
      badgeEl.classList.add('unlocked');
      sfx.badge();
    }
  }

  // Print Certificate Button
  const btnPrintCert = document.getElementById('btn-print-cert');
  const printContainer = document.getElementById('printable-certificate');
  const certStudentName = document.getElementById('cert-student-name');
  const certScore = document.getElementById('cert-score');
  const certStars = document.getElementById('cert-stars');
  const certRank = document.getElementById('cert-rank');

  btnPrintCert.addEventListener('click', () => {
    certStudentName.textContent = state.studentName.toUpperCase();
    certScore.textContent = `${state.score} XP`;
    certStars.textContent = `${state.stars}/10 ⭐`;
    certRank.textContent = hudRank.textContent;

    printContainer.style.display = 'block';
    window.print();
    setTimeout(() => {
      printContainer.style.display = 'none';
    }, 1000);
  });
});
