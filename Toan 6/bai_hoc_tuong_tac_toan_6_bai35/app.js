// APP.JS - BÀI 35: TRUNG ĐIỂM CỦA ĐOẠN THẲNG
// Toán 6 Tập 2 - Kết Nối Tri Thức Với Cuộc Sống (Trang 55 - 57)

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
    balance() {
      const notes = [392, 523.25, 659.25, 1046.5];
      notes.forEach((f, i) => {
        setTimeout(() => this.beep(f, 0.18, 'sine'), i * 90);
      });
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
    studentName: 'Kỹ Sư Cân Bằng Lớp 6',
    avatar: '⚖️',
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
    if (confirm('Em có chắc muốn đặt lại toàn bộ điểm số và bài tập về ban đầu?')) {
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
      hudRank.textContent = 'Đại Kiện Tướng Cân Bằng';
    } else if (state.score >= 500) {
      hudRank.textContent = 'Chuyên Gia Trung Điểm';
    } else if (state.score >= 200) {
      hudRank.textContent = 'Thợ Cân Điểm Trẻ';
    } else {
      hudRank.textContent = 'Tập Sự Trung Điểm';
    }
  }

  // ==========================================
  // LAB 1: CANVAS TÌM TRUNG ĐIỂM & ĐO CÂN BẰNG
  // ==========================================
  const midCanvas = document.getElementById('midpoint-canvas');
  const midCtx = midCanvas.getContext('2d');
  const midInfoBox = document.getElementById('midpoint-info-box');

  const btnSnapMidpoint = document.getElementById('btn-snap-midpoint');
  const btnChangeLength = document.getElementById('btn-change-length');
  const btnNestedMidpoints = document.getElementById('btn-nested-midpoints');

  let modeNested = false;

  // Segment endpoints
  let segA = { x: 80, y: 100, label: 'A' };
  let segB = { x: 560, y: 100, label: 'B' };
  let segM = { x: 260, y: 100, label: 'M' }; // movable
  let segF = { x: 200, y: 100, label: 'F' }; // for nested mode

  let isDraggingM = false;
  let isBalanced = false;

  function totalLengthCm() {
    return 10.0; // scale: (segB.x - segA.x) corresponds to 10 cm
  }

  function getCmFromX(x) {
    const ratio = (x - segA.x) / (segB.x - segA.x);
    return Math.max(0, Math.min(totalLengthCm(), ratio * totalLengthCm()));
  }

  function drawMidpointLab() {
    midCtx.clearRect(0, 0, midCanvas.width, midCanvas.height);

    const totalCm = totalLengthCm();
    const amCm = getCmFromX(segM.x);
    const mbCm = totalCm - amCm;
    const diff = Math.abs(amCm - mbCm);
    const perfectMid = diff < 0.15;

    if (perfectMid && !isBalanced) {
      isBalanced = true;
      sfx.balance();
    } else if (!perfectMid) {
      isBalanced = false;
    }

    const y = segA.y;

    // 1. Draw main segment AB
    midCtx.strokeStyle = '#334155';
    midCtx.lineWidth = 4;
    midCtx.beginPath();
    midCtx.moveTo(segA.x, y);
    midCtx.lineTo(segB.x, y);
    midCtx.stroke();

    // 2. Halves coloring
    // AM half
    midCtx.strokeStyle = perfectMid ? '#0d9488' : '#38bdf8';
    midCtx.lineWidth = 6;
    midCtx.beginPath();
    midCtx.moveTo(segA.x, y);
    midCtx.lineTo(segM.x, y);
    midCtx.stroke();

    // MB half
    midCtx.strokeStyle = perfectMid ? '#0d9488' : '#f59e0b';
    midCtx.lineWidth = 6;
    midCtx.beginPath();
    midCtx.moveTo(segM.x, y);
    midCtx.lineTo(segB.x, y);
    midCtx.stroke();

    // 3. Tick marks for equality if balanced
    if (perfectMid) {
      const midLeft = (segA.x + segM.x) / 2;
      const midRight = (segM.x + segB.x) / 2;
      drawEqualityTicks(midLeft, y);
      drawEqualityTicks(midRight, y);

      // "AM = MB" banner
      midCtx.fillStyle = '#0f766e';
      midCtx.font = 'bold 15px sans-serif';
      midCtx.fillText('✨ AM = MB = 5,0 cm (M LÀ TRUNG ĐIỂM) ✨', midCanvas.width / 2 - 160, y - 40);
    }

    // 4. Draw Endpoints A, B
    drawPoint(segA.x, y, segA.label, '#0f172a');
    drawPoint(segB.x, y, segB.label, '#0f172a');

    // 5. Draw Nested Midpoint F if active
    if (modeNested) {
      segF.x = (segA.x + segM.x) / 2;
      drawPoint(segF.x, y, 'F', '#ec4899');
      midCtx.font = 'bold 12px sans-serif';
      midCtx.fillStyle = '#db2777';
      midCtx.fillText(`F (Trung điểm AM = ${(amCm / 2).toFixed(1)} cm)`, segF.x - 60, y + 35);
    }

    // 6. Draw Point M
    drawPoint(segM.x, y, segM.label, perfectMid ? '#0d9488' : '#ea580c', 11);

    // 7. Distance labels
    midCtx.font = 'bold 13px sans-serif';
    midCtx.fillStyle = '#0284c7';
    midCtx.fillText(`AM = ${amCm.toFixed(1)} cm`, (segA.x + segM.x) / 2 - 30, y - 18);

    midCtx.fillStyle = '#d97706';
    midCtx.fillText(`MB = ${mbCm.toFixed(1)} cm`, (segM.x + segB.x) / 2 - 30, y - 18);

    // 8. Balance Spirit Scale at Bottom
    drawBalanceScale(amCm, mbCm, perfectMid);
  }

  function drawEqualityTicks(x, y) {
    midCtx.strokeStyle = '#0f766e';
    midCtx.lineWidth = 2.5;
    midCtx.beginPath();
    midCtx.moveTo(x - 4, y - 10);
    midCtx.lineTo(x - 2, y + 10);
    midCtx.moveTo(x + 2, y - 10);
    midCtx.lineTo(x + 4, y + 10);
    midCtx.stroke();
  }

  function drawPoint(x, y, label, color, r = 8) {
    midCtx.beginPath();
    midCtx.arc(x, y, r, 0, Math.PI * 2);
    midCtx.fillStyle = color;
    midCtx.fill();
    midCtx.strokeStyle = '#ffffff';
    midCtx.lineWidth = 2.5;
    midCtx.stroke();

    midCtx.font = 'bold 16px "Segoe UI", sans-serif';
    midCtx.fillStyle = color;
    midCtx.fillText(label, x - 6, y - 16);
  }

  function drawBalanceScale(am, mb, balanced) {
    const scaleY = 195;
    const centerX = midCanvas.width / 2;

    // Track
    midCtx.fillStyle = '#e2e8f0';
    midCtx.fillRect(centerX - 150, scaleY - 6, 300, 12);
    midCtx.strokeStyle = '#94a3b8';
    midCtx.lineWidth = 1;
    midCtx.strokeRect(centerX - 150, scaleY - 6, 300, 12);

    // Center target indicator
    midCtx.fillStyle = '#10b981';
    midCtx.fillRect(centerX - 4, scaleY - 12, 8, 24);

    // Scale balance bubble
    const tilt = (am - mb) * 18; // px offset
    const bubbleX = Math.max(centerX - 140, Math.min(centerX + 140, centerX + tilt));

    midCtx.beginPath();
    midCtx.arc(bubbleX, scaleY, 9, 0, Math.PI * 2);
    midCtx.fillStyle = balanced ? '#10b981' : '#f59e0b';
    midCtx.fill();
    midCtx.strokeStyle = '#ffffff';
    midCtx.lineWidth = 2;
    midCtx.stroke();

    midCtx.font = '11px sans-serif';
    midCtx.fillStyle = '#64748b';
    midCtx.fillText('Độ lệch cân bằng: ' + (am - mb).toFixed(1) + ' cm', centerX - 60, scaleY + 25);
  }

  function updateMidInfo() {
    const totalCm = totalLengthCm();
    const am = getCmFromX(segM.x).toFixed(1);
    const mb = (totalCm - am).toFixed(1);

    if (Math.abs(am - mb) < 0.15) {
      midInfoBox.innerHTML = `
        <span style="color:#0f766e; font-weight:700;">🎉 ĐÃ ĐẠT ĐIỂM CÂN BẰNG TRUNG ĐIỂM!</span><br>
        • Đoạn thẳng $AB = 10\\text{ cm}$.<br>
        • $AM = ${am}\\text{ cm}$ và $MB = ${mb}\\text{ cm}$.<br>
        • Điểm $M$ nằm giữa $A$ và $B$, đồng thời $AM = MB = \\frac{AB}{2} = 5{,}0\\text{ cm}$. Điểm $M$ chính là <strong>trung điểm của đoạn thẳng AB</strong>!
      `;
    } else {
      midInfoBox.innerHTML = `
        <strong>Khoảng cách hiện tại:</strong> $AM = ${am}\\text{ cm}$, $MB = ${mb}\\text{ cm}$.<br>
        • Điểm $M$ chưa cách đều hai đầu mút ($AM \\neq MB$). Hãy kéo điểm $M$ về gần vạch $5{,}0\\text{ cm}$ để tạo thành trung điểm!
      `;
    }
  }

  // Dragging event handlers
  function getMidPos(e) {
    const rect = midCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (midCanvas.width / rect.width),
      y: (clientY - rect.top) * (midCanvas.height / rect.height)
    };
  }

  midCanvas.addEventListener('mousedown', (e) => {
    const pos = getMidPos(e);
    const dist = Math.hypot(pos.x - segM.x, pos.y - segM.y);
    if (dist < 22) {
      isDraggingM = true;
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (isDraggingM) {
      const pos = getMidPos(e);
      segM.x = Math.max(segA.x + 10, Math.min(segB.x - 10, pos.x));
      drawMidpointLab();
      updateMidInfo();
    }
  });

  window.addEventListener('mouseup', () => {
    isDraggingM = false;
  });

  // Touch Support
  midCanvas.addEventListener('touchstart', (e) => {
    const pos = getMidPos(e);
    const dist = Math.hypot(pos.x - segM.x, pos.y - segM.y);
    if (dist < 28) {
      isDraggingM = true;
    }
  });

  window.addEventListener('touchmove', (e) => {
    if (isDraggingM) {
      const pos = getMidPos(e);
      segM.x = Math.max(segA.x + 10, Math.min(segB.x - 10, pos.x));
      drawMidpointLab();
      updateMidInfo();
    }
  });

  window.addEventListener('touchend', () => {
    isDraggingM = false;
  });

  // Controls for Lab 1
  btnSnapMidpoint.addEventListener('click', () => {
    segM.x = (segA.x + segB.x) / 2;
    drawMidpointLab();
    updateMidInfo();
    sfx.balance();
  });

  btnChangeLength.addEventListener('click', () => {
    if (segB.x === 560) {
      segB.x = 480;
    } else {
      segB.x = 560;
    }
    segM.x = (segA.x + segB.x) / 2;
    drawMidpointLab();
    updateMidInfo();
    sfx.click();
  });

  btnNestedMidpoints.addEventListener('click', () => {
    modeNested = !modeNested;
    segM.x = (segA.x + segB.x) / 2;
    drawMidpointLab();
    updateMidInfo();
    sfx.click();
  });

  drawMidpointLab();
  updateMidInfo();

  // ==========================================
  // LAB 2: VÒNG QUAY MẶT TRỜI & BẬP BÊNH VẬT LÝ
  // ==========================================
  const wheelCanvas = document.getElementById('wheel-canvas');
  const wheelCtx = wheelCanvas.getContext('2d');
  const btnCalcWheel = document.getElementById('btn-calc-wheel');
  const wheelResult = document.getElementById('wheel-result');
  const btnCalcSeesaw = document.getElementById('btn-calc-seesaw');
  const seesawResult = document.getElementById('seesaw-result');

  let wheelAngle = 0;
  let seesawAngle = 0;
  let seesawDir = 1;

  btnCalcWheel.addEventListener('click', () => {
    wheelResult.style.display = wheelResult.style.display === 'block' ? 'none' : 'block';
    sfx.click();
  });

  btnCalcSeesaw.addEventListener('click', () => {
    seesawResult.style.display = seesawResult.style.display === 'block' ? 'none' : 'block';
    sfx.click();
  });

  function animateLab2() {
    wheelCtx.clearRect(0, 0, wheelCanvas.width, wheelCanvas.height);

    // 1. Draw Ferris Wheel (Left side: x = 160, y = 105, r = 70)
    const wx = 160;
    const wy = 105;
    const wr = 65;

    wheelAngle += 0.008;

    // Wheel support legs
    wheelCtx.strokeStyle = '#475569';
    wheelCtx.lineWidth = 3;
    wheelCtx.beginPath();
    wheelCtx.moveTo(wx, wy);
    wheelCtx.lineTo(wx - 45, wy + 85);
    wheelCtx.moveTo(wx, wy);
    wheelCtx.lineTo(wx + 45, wy + 85);
    wheelCtx.stroke();

    // Ground
    wheelCtx.strokeStyle = '#334155';
    wheelCtx.lineWidth = 2;
    wheelCtx.beginPath();
    wheelCtx.moveTo(20, wy + 85);
    wheelCtx.lineTo(wheelCanvas.width - 20, wy + 85);
    wheelCtx.stroke();

    // Wheel rim
    wheelCtx.strokeStyle = '#0d9488';
    wheelCtx.lineWidth = 3;
    wheelCtx.beginPath();
    wheelCtx.arc(wx, wy, wr, 0, Math.PI * 2);
    wheelCtx.stroke();

    // Spokes and Cabins
    const cabins = 8;
    for (let i = 0; i < cabins; i++) {
      const a = wheelAngle + (i * Math.PI * 2) / cabins;
      const cx = wx + Math.cos(a) * wr;
      const cy = wy + Math.sin(a) * wr;

      wheelCtx.strokeStyle = 'rgba(45, 212, 191, 0.4)';
      wheelCtx.lineWidth = 1.5;
      wheelCtx.beginPath();
      wheelCtx.moveTo(wx, wy);
      wheelCtx.lineTo(cx, cy);
      wheelCtx.stroke();

      // Cabin circle
      wheelCtx.beginPath();
      wheelCtx.arc(cx, cy, 6, 0, Math.PI * 2);
      wheelCtx.fillStyle = '#f59e0b';
      wheelCtx.fill();
    }

    // Center Axis Point
    wheelCtx.beginPath();
    wheelCtx.arc(wx, wy, 6, 0, Math.PI * 2);
    wheelCtx.fillStyle = '#ef4444';
    wheelCtx.fill();
    wheelCtx.strokeStyle = '#ffffff';
    wheelCtx.lineWidth = 2;
    wheelCtx.stroke();

    // Wheel Labels
    wheelCtx.font = 'bold 11px sans-serif';
    wheelCtx.fillStyle = '#38bdf8';
    wheelCtx.fillText('Đỉnh: 60 m', wx - 28, wy - wr - 8);

    wheelCtx.fillStyle = '#f59e0b';
    wheelCtx.fillText('Đáy: 6 m', wx - 22, wy + wr + 18);

    wheelCtx.fillStyle = '#ef4444';
    wheelCtx.fillText('Trục: 33 m (Trung điểm)', wx + 12, wy + 4);

    // 2. Draw Seesaw (Right side: x = 460, y = 145)
    const sx = 460;
    const sy = 150;
    const sLen = 140;

    seesawAngle += 0.02 * seesawDir;
    if (seesawAngle > 0.22) seesawDir = -1;
    if (seesawAngle < -0.22) seesawDir = 1;

    // Fulcrum triangle
    wheelCtx.fillStyle = '#64748b';
    wheelCtx.beginPath();
    wheelCtx.moveTo(sx, sy);
    wheelCtx.lineTo(sx - 20, sy + 40);
    wheelCtx.lineTo(sx + 20, sy + 40);
    wheelCtx.closePath();
    wheelCtx.fill();

    // Seesaw board
    wheelCtx.save();
    wheelCtx.translate(sx, sy);
    wheelCtx.rotate(seesawAngle);

    wheelCtx.fillStyle = '#f59e0b';
    wheelCtx.fillRect(-sLen / 2, -6, sLen, 12);
    wheelCtx.strokeStyle = '#b45309';
    wheelCtx.lineWidth = 2;
    wheelCtx.strokeRect(-sLen / 2, -6, sLen, 12);

    // Seats at both ends
    wheelCtx.fillStyle = '#0f766e';
    wheelCtx.fillRect(-sLen / 2 - 2, -18, 14, 12);
    wheelCtx.fillRect(sLen / 2 - 12, -18, 14, 12);

    // Fulcrum center dot
    wheelCtx.beginPath();
    wheelCtx.arc(0, 0, 5, 0, Math.PI * 2);
    wheelCtx.fillStyle = '#ffffff';
    wheelCtx.fill();
    wheelCtx.strokeStyle = '#0f766e';
    wheelCtx.lineWidth = 2;
    wheelCtx.stroke();

    wheelCtx.restore();

    // Seesaw label
    wheelCtx.font = 'bold 11px sans-serif';
    wheelCtx.fillStyle = '#2dd4bf';
    wheelCtx.fillText('Thanh bập bênh 3 m (Trục chính giữa = 1,5 m)', sx - 110, sy + 35);

    requestAnimationFrame(animateLab2);
  }

  animateLab2();

  // ==========================================
  // SECTION 3: ĐẤU TRƯỜNG SGK (10 CÂU HỎI BÀI 35)
  // ==========================================
  const quizQuestions = [
    {
      id: 1,
      tag: 'SGK Trang 55',
      title: 'Điểm I được gọi là trung điểm của đoạn thẳng AB khi thỏa mãn đồng thời hai điều kiện nào sau đây?',
      options: [
        'Điểm I nằm giữa hai điểm A, B và IA = IB',
        'Điểm I nằm giữa hai điểm A, B và IA > IB',
        'Điểm I trùng với điểm A',
        'Điểm I nằm ngoài đoạn thẳng AB và IA = IB'
      ],
      correct: 0,
      exp: 'Chính xác! Theo định nghĩa SGK, nếu điểm I nằm giữa hai điểm A và B sao cho IA = IB thì điểm I gọi là trung điểm của đoạn thẳng AB.'
    },
    {
      id: 2,
      tag: 'Công Thức SGK Trang 55',
      title: 'Cho M là trung điểm của đoạn thẳng AB có độ dài 8 cm. Độ dài của đoạn thẳng AM là bao nhiêu?',
      options: [
        'AM = 4 cm (vì AM = AB : 2 = 8 : 2 = 4 cm)',
        'AM = 8 cm',
        'AM = 16 cm (vì lấy 8 × 2)',
        'AM = 2 cm'
      ],
      correct: 0,
      exp: 'Chính xác! Vì M là trung điểm của AB nên AM = MB = AB / 2 = 8 / 2 = 4 cm.'
    },
    {
      id: 3,
      tag: 'SGK 8.16 Trang 56',
      title: 'Tính độ dài của đoạn thẳng AB nếu biết trung điểm I của đoạn thẳng AB nằm cách mút A một khoảng bằng 4,5 cm:',
      options: [
        'AB = 9 cm (lấy 4,5 cm × 2 = 9 cm)',
        'AB = 4,5 cm',
        'AB = 2,25 cm',
        'AB = 13,5 cm'
      ],
      correct: 0,
      exp: 'Chính xác! Vì I là trung điểm của đoạn thẳng AB nên AB = 2 × IA = 2 × 4,5 = 9 cm.'
    },
    {
      id: 4,
      tag: 'SGK 8.17 Trang 56',
      title: 'Cho C là trung điểm của đoạn thẳng AB, D là trung điểm của đoạn thẳng AC. Biết CD = 2 cm, tính độ dài đoạn thẳng AB:',
      options: [
        'AB = 8 cm',
        'AB = 4 cm',
        'AB = 6 cm',
        'AB = 10 cm'
      ],
      correct: 0,
      exp: 'Chính xác! D là trung điểm AC nên AC = 2 × CD = 2 × 2 = 4 cm. Lại có C là trung điểm AB nên AB = 2 × AC = 2 × 4 = 8 cm!'
    },
    {
      id: 5,
      tag: 'SGK Luyện Tập Trang 56',
      title: 'Cho đoạn thẳng PQ dài 12 đơn vị. Gọi E là trung điểm của đoạn thẳng PQ và F là trung điểm của đoạn thẳng PE. Tính độ dài đoạn thẳng EF:',
      options: [
        'EF = 3 đơn vị (vì PE = 6 và EF = 6 : 2 = 3)',
        'EF = 6 đơn vị',
        'EF = 4 đơn vị',
        'EF = 1,5 đơn vị'
      ],
      correct: 0,
      exp: 'Chính xác! E là trung điểm PQ nên PE = 12 : 2 = 6 đơn vị. F là trung điểm PE nên EF = PE : 2 = 6 : 2 = 3 đơn vị.'
    },
    {
      id: 6,
      tag: 'SGK Vận Dụng Trang 56',
      title: 'Vòng quay mặt trời có điểm cao nhất là 60 m, điểm thấp nhất là 6 m (so với mặt đất). Trục của vòng quay nằm ở độ cao bao nhiêu mét?',
      options: [
        '33 m (lấy (60 + 6) : 2 = 33 m)',
        '30 m',
        '27 m',
        '54 m'
      ],
      correct: 0,
      exp: 'Chính xác! Đường kính vòng quay là 60 - 6 = 54 m, bán kính là 54 : 2 = 27 m. Độ cao của trục so với mặt đất là 6 + 27 = 33 m (hoặc tính nhanh bằng trung bình cộng (60 + 6) / 2 = 33 m).'
    },
    {
      id: 7,
      tag: 'SGK HĐ2 Trang 55',
      title: 'Một sợi dây dài 120 cm. Gấp đôi sợi dây lại để hai đầu trùng nhau. Chỗ nếp gấp đánh dấu điểm A. Khoảng cách từ điểm A đến mỗi đầu sợi dây là:',
      options: [
        '60 cm (lấy 120 cm : 2 = 60 cm)',
        '120 cm',
        '30 cm',
        '40 cm'
      ],
      correct: 0,
      exp: 'Chính xác! Khi gấp đôi sợi dây, nếp gấp chính là trung điểm chia sợi dây làm 2 nửa bằng nhau: 120 : 2 = 60 cm.'
    },
    {
      id: 8,
      tag: 'SGK 8.18 Trang 56',
      title: 'Để tìm điểm chính giữa của một cây gậy mà chỉ dùng một sợi dây đủ dài (không có thước kẻ), ta làm thế nào?',
      options: [
        'Cắt hoặc đo đoạn dây bằng chiều dài cây gậy rồi gập đôi sợi dây lại, nếp gấp cho ta vị trí điểm chính giữa',
        'Quấn sợi dây quanh thân cây gậy 5 vòng',
        'Buộc hai đầu gậy lại với nhau',
        'Không thể làm được nếu không có thước đo milimet'
      ],
      correct: 0,
      exp: 'Chính xác! Căng sợi dây dọc thân cây gậy lấy chiều dài bằng gậy, gập đôi sợi dây lại thì nếp gấp xác định chính xác trung điểm cây gậy.'
    },
    {
      id: 9,
      tag: 'SGK 8.21 Trang 57',
      title: 'Cho điểm M trên tia Om sao cho OM = 5 cm. Điểm N nằm trên tia đối của tia Om sao cho ON = 7 cm. Gọi K là trung điểm của MN. Tính độ dài đoạn thẳng OK:',
      options: [
        'OK = 1 cm',
        'OK = 6 cm',
        'OK = 2 cm',
        'OK = 3,5 cm'
      ],
      correct: 0,
      exp: 'Chính xác! Vì M và N thuộc hai tia đối nhau gốc O nên O nằm giữa M và N, MN = OM + ON = 5 + 7 = 12 cm. K là trung điểm MN nên MK = 12 : 2 = 6 cm. Vì MK > OM (6 > 5) nên O nằm giữa M và K, suy ra OK = MK - OM = 6 - 5 = 1 cm!'
    },
    {
      id: 10,
      tag: 'SGK 8.22 Trang 57',
      title: 'Cho hai điểm phân biệt A và B cùng nằm trên tia Ox sao cho OA = 4 cm, OB = 6 cm. Gọi M là trung điểm của đoạn thẳng AB. Tính độ dài đoạn thẳng OM:',
      options: [
        'OM = 5 cm',
        'OM = 2 cm',
        'OM = 1 cm',
        'OM = 3 cm'
      ],
      correct: 0,
      exp: 'Chính xác! Vì OA < OB (4 < 6) nên A nằm giữa O và B, AB = OB - OA = 6 - 4 = 2 cm. M là trung điểm AB nên AM = 2 : 2 = 1 cm. Do đó OM = OA + AM = 4 + 1 = 5 cm.'
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
          <span style="font-size: 0.8rem; color: #0f766e; background: #ccfbf1; padding: 2px 8px; border-radius: 12px; height: fit-content; white-space: nowrap;">${q.tag}</span>
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
    // Badge 2: Question 6 (Ferris wheel) correct
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
