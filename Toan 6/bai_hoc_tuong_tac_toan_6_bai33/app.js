// APP.JS - BÀI 33: ĐIỂM NẰM GIỮA HAI ĐIỂM. TIA
// Toán 6 Tập 2 - Kết Nối Tri Thức Với Cuộc Sống (Trang 48 - 50)

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
      this.beep(250, 0.15, 'sawtooth');
      setTimeout(() => this.beep(196, 0.25, 'sawtooth'), 150);
    }
    badge() {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((f, i) => {
        setTimeout(() => this.beep(f, 0.2, 'sine'), i * 120);
      });
    }
    click() {
      this.beep(800, 0.04, 'sine');
    }
  }

  const sfx = new SoundFX();

  // --- TRẠNG THÁI ỨNG DỤNG ---
  const state = {
    studentName: 'Nhà Thám Hiểm Toán 6',
    avatar: '🪐',
    score: 0,
    stars: 0,
    streak: 0,
    answeredQuestions: {},
    unlockedBadges: new Set(),
    soundOn: true
  };

  // --- CÁC PHẦN TỬ DOM CHÍNH ---
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
    if (confirm('Em có chắc chắn muốn đặt lại điểm số và bài tập về ban đầu không?')) {
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
      hudRank.textContent = 'Đại Kiện Tướng Vũ Trụ';
    } else if (state.score >= 500) {
      hudRank.textContent = 'Chuyên Gia Hình Học';
    } else if (state.score >= 200) {
      hudRank.textContent = 'Nhà Thám Hiểm Trẻ';
    } else {
      hudRank.textContent = 'Tập Sự Không Gian';
    }
  }

  // ==========================================
  // LAB 1: CANVAS TƯƠNG TÁC ĐIỂM NẰM GIỮA VÀ TIA
  // ==========================================
  const geoCanvas = document.getElementById('geo-canvas');
  const geoCtx = geoCanvas.getContext('2d');
  const geoInfoBox = document.getElementById('geo-info-box');

  const btnPreset86 = document.getElementById('btn-preset-sgk86');
  const btnPreset87 = document.getElementById('btn-preset-sgk87');
  const btnHighlightBetween = document.getElementById('btn-highlight-between');
  const btnHighlightRays = document.getElementById('btn-highlight-rays');

  const points = [
    { label: 'A', x: 120, y: 130, color: '#4f46e5' },
    { label: 'C', x: 230, y: 130, color: '#06b6d4' },
    { label: 'B', x: 380, y: 130, color: '#f59e0b' },
    { label: 'D', x: 520, y: 130, color: '#ec4899' }
  ];

  let draggedPoint = null;
  let highlightBetweenMode = false;
  let highlightRaysMode = false;

  function drawGeoCanvas() {
    geoCtx.clearRect(0, 0, geoCanvas.width, geoCanvas.height);

    const centerY = 130;

    // Draw grid background subtle
    geoCtx.strokeStyle = '#f1f5f9';
    geoCtx.lineWidth = 1;
    for (let x = 0; x < geoCanvas.width; x += 30) {
      geoCtx.beginPath();
      geoCtx.moveTo(x, 0);
      geoCtx.lineTo(x, geoCanvas.height);
      geoCtx.stroke();
    }
    for (let y = 0; y < geoCanvas.height; y += 30) {
      geoCtx.beginPath();
      geoCtx.moveTo(0, y);
      geoCtx.lineTo(geoCanvas.width, y);
      geoCtx.stroke();
    }

    // 1. Draw line xy
    geoCtx.beginPath();
    geoCtx.moveTo(30, centerY);
    geoCtx.lineTo(geoCanvas.width - 30, centerY);
    geoCtx.strokeStyle = '#334155';
    geoCtx.lineWidth = 4;
    geoCtx.stroke();

    // Arrows at ends of line xy
    drawArrowHead(30, centerY, Math.PI, '#334155');
    drawArrowHead(geoCanvas.width - 30, centerY, 0, '#334155');

    // Label x and y
    geoCtx.font = 'italic bold 18px "Segoe UI", sans-serif';
    geoCtx.fillStyle = '#1e293b';
    geoCtx.fillText('x', 20, centerY - 15);
    geoCtx.fillText('y', geoCanvas.width - 25, centerY - 15);

    // Sort points by x to determine current order
    const sorted = [...points].sort((a, b) => a.x - b.x);

    // 2. Rays Mode visualization
    if (highlightRaysMode) {
      const origin = sorted[1] || sorted[0]; // Take 2nd point as origin
      // Ray to left (toward x)
      geoCtx.strokeStyle = '#ef4444';
      geoCtx.lineWidth = 6;
      geoCtx.beginPath();
      geoCtx.moveTo(origin.x, centerY);
      geoCtx.lineTo(35, centerY);
      geoCtx.stroke();

      // Ray to right (toward y)
      geoCtx.strokeStyle = '#10b981';
      geoCtx.lineWidth = 6;
      geoCtx.beginPath();
      geoCtx.moveTo(origin.x, centerY);
      geoCtx.lineTo(geoCanvas.width - 35, centerY);
      geoCtx.stroke();

      // Annotations
      geoCtx.font = 'bold 13px sans-serif';
      geoCtx.fillStyle = '#ef4444';
      geoCtx.fillText(`Tia ${origin.label}x (Sang trái)`, origin.x - 130, centerY + 45);
      geoCtx.fillStyle = '#10b981';
      geoCtx.fillText(`Tia ${origin.label}y (Sang phải)`, origin.x + 30, centerY + 45);
    }

    // 3. Highlight Between Mode
    if (highlightBetweenMode && sorted.length >= 3) {
      const pLeft = sorted[0];
      const pMid = sorted[1];
      const pRight = sorted[2];

      geoCtx.strokeStyle = '#8b5cf6';
      geoCtx.lineWidth = 6;
      geoCtx.beginPath();
      geoCtx.moveTo(pLeft.x, centerY);
      geoCtx.lineTo(pRight.x, centerY);
      geoCtx.stroke();

      // Pulse circle around middle point
      geoCtx.beginPath();
      geoCtx.arc(pMid.x, centerY, 18, 0, Math.PI * 2);
      geoCtx.strokeStyle = '#f59e0b';
      geoCtx.lineWidth = 3;
      geoCtx.setLineDash([4, 4]);
      geoCtx.stroke();
      geoCtx.setLineDash([]);

      geoCtx.fillStyle = '#7c3aed';
      geoCtx.font = 'bold 12px sans-serif';
      geoCtx.fillText(`Điểm ${pMid.label} NẰM GIỮA ${pLeft.label} và ${pRight.label}`, pMid.x - 70, centerY - 35);
    }

    // 4. Draw Points
    points.forEach((p) => {
      // Glow shadow
      geoCtx.beginPath();
      geoCtx.arc(p.x, centerY, 9, 0, Math.PI * 2);
      geoCtx.fillStyle = p.color;
      geoCtx.fill();
      geoCtx.lineWidth = 2.5;
      geoCtx.strokeStyle = '#ffffff';
      geoCtx.stroke();

      // Inner dot
      geoCtx.beginPath();
      geoCtx.arc(p.x, centerY, 3, 0, Math.PI * 2);
      geoCtx.fillStyle = '#ffffff';
      geoCtx.fill();

      // Label
      geoCtx.font = 'bold 16px "Segoe UI", sans-serif';
      geoCtx.fillStyle = '#1e1b4b';
      geoCtx.fillText(p.label, p.x - 6, centerY - 14);
    });
  }

  function drawArrowHead(x, y, angle, color) {
    geoCtx.save();
    geoCtx.translate(x, y);
    geoCtx.rotate(angle);
    geoCtx.beginPath();
    geoCtx.moveTo(0, 0);
    geoCtx.lineTo(-12, -7);
    geoCtx.lineTo(-12, 7);
    geoCtx.closePath();
    geoCtx.fillStyle = color;
    geoCtx.fill();
    geoCtx.restore();
  }

  function updateGeoInfo() {
    const sorted = [...points].sort((a, b) => a.x - b.x);
    const orderStr = sorted.map(p => p.label).join(' ➔ ');

    let html = `<strong>Thứ tự các điểm trên đường thẳng xy:</strong> <span style="color:#4f46e5; font-weight:700;">x ➔ ${orderStr} ➔ y</span><br>`;
    html += `• <strong>Điểm nằm giữa:</strong> `;
    if (sorted.length >= 3) {
      html += `Điểm <strong>${sorted[1].label}</strong> nằm giữa <em>${sorted[0].label}</em> và <em>${sorted[2].label}</em>. `;
      if (sorted.length >= 4) {
        html += `Điểm <strong>${sorted[2].label}</strong> nằm giữa <em>${sorted[1].label}</em> và <em>${sorted[3].label}</em>.`;
      }
    }
    html += `<br>• <strong>Vị trí cùng phía / khác phía:</strong> `;
    if (sorted.length >= 3) {
      const left = sorted[0].label;
      const mid = sorted[1].label;
      const right = sorted[2].label;
      html += `Hai điểm <em>${left}</em> và <em>${mid}</em> cùng phía đối với <em>${right}</em>; hai điểm <em>${left}</em> và <em>${right}</em> khác phía đối với <em>${mid}</em>.`;
    }

    geoInfoBox.innerHTML = html;
  }

  // Canvas Mouse / Touch events for dragging points along horizontal axis
  function getPos(e) {
    const rect = geoCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (geoCanvas.width / rect.width),
      y: (clientY - rect.top) * (geoCanvas.height / rect.height)
    };
  }

  geoCanvas.addEventListener('mousedown', (e) => {
    const pos = getPos(e);
    points.forEach(p => {
      const dist = Math.hypot(p.x - pos.x, p.y - pos.y);
      if (dist < 20) {
        draggedPoint = p;
      }
    });
  });

  window.addEventListener('mousemove', (e) => {
    if (draggedPoint) {
      const pos = getPos(e);
      // Constrain within line boundaries
      draggedPoint.x = Math.max(50, Math.min(geoCanvas.width - 50, pos.x));
      drawGeoCanvas();
      updateGeoInfo();
    }
  });

  window.addEventListener('mouseup', () => {
    draggedPoint = null;
  });

  // Touch Support
  geoCanvas.addEventListener('touchstart', (e) => {
    const pos = getPos(e);
    points.forEach(p => {
      const dist = Math.hypot(p.x - pos.x, p.y - pos.y);
      if (dist < 25) {
        draggedPoint = p;
      }
    });
  });

  window.addEventListener('touchmove', (e) => {
    if (draggedPoint) {
      const pos = getPos(e);
      draggedPoint.x = Math.max(50, Math.min(geoCanvas.width - 50, pos.x));
      drawGeoCanvas();
      updateGeoInfo();
    }
  });

  window.addEventListener('touchend', () => {
    draggedPoint = null;
  });

  // Buttons for Lab 1
  btnPreset86.addEventListener('click', () => {
    // SGK 8.6: A - C - B - D
    points[0].label = 'A'; points[0].x = 120;
    points[1].label = 'C'; points[1].x = 240;
    points[2].label = 'B'; points[2].x = 380;
    points[3].label = 'D'; points[3].x = 520;
    highlightBetweenMode = false;
    highlightRaysMode = false;
    drawGeoCanvas();
    updateGeoInfo();
    sfx.click();
  });

  btnPreset87.addEventListener('click', () => {
    // SGK 8.7: A - B - C (hide D or move to right edge)
    points[0].label = 'A'; points[0].x = 150;
    points[1].label = 'B'; points[1].x = 320;
    points[2].label = 'C'; points[2].x = 500;
    points[3].label = 'D'; points[3].x = 600; // parked at edge
    highlightBetweenMode = false;
    highlightRaysMode = false;
    drawGeoCanvas();
    updateGeoInfo();
    sfx.click();
  });

  btnHighlightBetween.addEventListener('click', () => {
    highlightBetweenMode = !highlightBetweenMode;
    highlightRaysMode = false;
    drawGeoCanvas();
    updateGeoInfo();
    sfx.click();
  });

  btnHighlightRays.addEventListener('click', () => {
    highlightRaysMode = !highlightRaysMode;
    highlightBetweenMode = false;
    drawGeoCanvas();
    updateGeoInfo();
    sfx.click();
  });

  drawGeoCanvas();
  updateGeoInfo();

  // ==========================================
  // LAB 2: MÔ PHỎNG THIÊN VĂN (NHẬT THỰC & NGUYỆT THỰC)
  // ==========================================
  const astroCanvas = document.getElementById('astro-canvas');
  const astroCtx = astroCanvas.getContext('2d');
  const btnSimSolar = document.getElementById('btn-sim-solar');
  const btnSimLunar = document.getElementById('btn-sim-lunar');
  const solarDesc = document.getElementById('solar-desc');
  const lunarDesc = document.getElementById('lunar-desc');

  let currentAstroMode = 'solar'; // 'solar' or 'lunar'
  let astroAngle = 0;

  function renderAstro() {
    astroCtx.clearRect(0, 0, astroCanvas.width, astroCanvas.height);

    // Starfield background
    astroCtx.fillStyle = '#0f172a';
    astroCtx.fillRect(0, 0, astroCanvas.width, astroCanvas.height);

    // Random stars twinkling
    astroCtx.fillStyle = '#ffffff';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 73 + 17) % astroCanvas.width;
      const sy = (i * 97 + 23) % astroCanvas.height;
      const size = (i % 3 === 0) ? 1.5 : 1;
      astroCtx.fillRect(sx, sy, size, size);
    }

    const centerY = astroCanvas.height / 2;
    const sunX = 90;
    let midX = 330;
    let rightX = 530;

    // 1. Sun (Mặt Trời)
    const sunGrad = astroCtx.createRadialGradient(sunX, centerY, 10, sunX, centerY, 55);
    sunGrad.addColorStop(0, '#fffbeb');
    sunGrad.addColorStop(0.3, '#fde047');
    sunGrad.addColorStop(0.7, '#f59e0b');
    sunGrad.addColorStop(1, 'rgba(234, 88, 12, 0)');

    astroCtx.beginPath();
    astroCtx.arc(sunX, centerY, 55, 0, Math.PI * 2);
    astroCtx.fillStyle = sunGrad;
    astroCtx.fill();

    astroCtx.beginPath();
    astroCtx.arc(sunX, centerY, 32, 0, Math.PI * 2);
    astroCtx.fillStyle = '#f59e0b';
    astroCtx.fill();

    astroCtx.fillStyle = '#ffffff';
    astroCtx.font = 'bold 12px sans-serif';
    astroCtx.fillText('Mặt Trời', sunX - 25, centerY + 45);

    if (currentAstroMode === 'solar') {
      // NHẬT THỰC: Mặt Trăng ở giữa, Trái Đất bên phải
      const moonX = midX;
      const earthX = rightX;

      // Draw light cone / shadow from Moon to Earth
      astroCtx.fillStyle = 'rgba(254, 240, 138, 0.15)';
      astroCtx.beginPath();
      astroCtx.moveTo(sunX, centerY - 30);
      astroCtx.lineTo(earthX, centerY - 25);
      astroCtx.lineTo(earthX, centerY + 25);
      astroCtx.lineTo(sunX, centerY + 30);
      astroCtx.closePath();
      astroCtx.fill();

      // Umbra cone (bóng tối Mặt Trăng in lên Trái Đất)
      astroCtx.fillStyle = 'rgba(15, 23, 42, 0.7)';
      astroCtx.beginPath();
      astroCtx.moveTo(moonX, centerY - 10);
      astroCtx.lineTo(earthX, centerY - 6);
      astroCtx.lineTo(earthX, centerY + 6);
      astroCtx.lineTo(moonX, centerY + 10);
      astroCtx.closePath();
      astroCtx.fill();

      // Draw Moon (Mặt Trăng ở giữa)
      astroCtx.beginPath();
      astroCtx.arc(moonX, centerY, 12, 0, Math.PI * 2);
      astroCtx.fillStyle = '#94a3b8';
      astroCtx.fill();
      astroCtx.strokeStyle = '#f8fafc';
      astroCtx.lineWidth = 1.5;
      astroCtx.stroke();

      astroCtx.fillStyle = '#fde68a';
      astroCtx.font = 'bold 11px sans-serif';
      astroCtx.fillText('Mặt Trăng (Ở GIỮA)', moonX - 50, centerY - 20);

      // Draw Earth (Trái Đất bên phải)
      astroCtx.beginPath();
      astroCtx.arc(earthX, centerY, 24, 0, Math.PI * 2);
      const earthGrad = astroCtx.createLinearGradient(earthX - 24, centerY, earthX + 24, centerY);
      earthGrad.addColorStop(0, '#0284c7');
      earthGrad.addColorStop(0.6, '#10b981');
      earthGrad.addColorStop(1, '#0f172a');
      astroCtx.fillStyle = earthGrad;
      astroCtx.fill();

      // Eclipse spot on Earth
      astroCtx.beginPath();
      astroCtx.arc(earthX - 18, centerY, 5, 0, Math.PI * 2);
      astroCtx.fillStyle = '#020617';
      astroCtx.fill();

      astroCtx.fillStyle = '#67e8f9';
      astroCtx.fillText('Trái Đất', earthX - 20, centerY + 40);

      // Title in canvas
      astroCtx.font = 'bold 14px sans-serif';
      astroCtx.fillStyle = '#f59e0b';
      astroCtx.fillText('☀️ HIỆN TƯỢNG NHẬT THỰC (MẶT TRĂNG NẰM GIỮA)', 170, 25);
    } else {
      // NGUYỆT THỰC: Trái Đất ở giữa, Mặt Trăng bên phải
      const earthX = midX;
      const moonX = rightX;

      // Earth's shadow cone engulfing Moon
      astroCtx.fillStyle = 'rgba(15, 23, 42, 0.75)';
      astroCtx.beginPath();
      astroCtx.moveTo(earthX, centerY - 24);
      astroCtx.lineTo(moonX + 30, centerY - 35);
      astroCtx.lineTo(moonX + 30, centerY + 35);
      astroCtx.lineTo(earthX, centerY + 24);
      astroCtx.closePath();
      astroCtx.fill();

      // Draw Earth (Trái Đất ở giữa)
      astroCtx.beginPath();
      astroCtx.arc(earthX, centerY, 24, 0, Math.PI * 2);
      const earthGrad = astroCtx.createLinearGradient(earthX - 24, centerY, earthX + 24, centerY);
      earthGrad.addColorStop(0, '#38bdf8');
      earthGrad.addColorStop(0.5, '#22c55e');
      earthGrad.addColorStop(1, '#1e293b');
      astroCtx.fillStyle = earthGrad;
      astroCtx.fill();

      astroCtx.fillStyle = '#38bdf8';
      astroCtx.font = 'bold 11px sans-serif';
      astroCtx.fillText('Trái Đất (Ở GIỮA)', earthX - 45, centerY - 32);

      // Draw Moon (Mặt Trăng đỏ sẫm vào bóng tối Trái Đất)
      astroCtx.beginPath();
      astroCtx.arc(moonX, centerY, 12, 0, Math.PI * 2);
      astroCtx.fillStyle = '#dc2626'; // Blood Moon
      astroCtx.fill();
      astroCtx.strokeStyle = '#fca5a5';
      astroCtx.lineWidth = 1;
      astroCtx.stroke();

      astroCtx.fillStyle = '#f87171';
      astroCtx.fillText('Mặt Trăng Máu', moonX - 35, centerY + 30);

      // Title in canvas
      astroCtx.font = 'bold 14px sans-serif';
      astroCtx.fillStyle = '#818cf8';
      astroCtx.fillText('🌕 HIỆN TƯỢNG NGUYỆT THỰC (TRÁI ĐẤT NẰM GIỮA)', 170, 25);
    }

    // Straight axis dotted line through centers
    astroCtx.beginPath();
    astroCtx.setLineDash([4, 6]);
    astroCtx.moveTo(sunX, centerY);
    astroCtx.lineTo(rightX + 40, centerY);
    astroCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    astroCtx.lineWidth = 1.5;
    astroCtx.stroke();
    astroCtx.setLineDash([]);
  }

  btnSimSolar.addEventListener('click', () => {
    currentAstroMode = 'solar';
    solarDesc.style.display = 'block';
    lunarDesc.style.display = 'none';
    renderAstro();
    sfx.click();
  });

  btnSimLunar.addEventListener('click', () => {
    currentAstroMode = 'lunar';
    lunarDesc.style.display = 'block';
    solarDesc.style.display = 'none';
    renderAstro();
    sfx.click();
  });

  renderAstro();

  // ==========================================
  // SECTION 3: ĐẤU TRƯỜNG TOÁN HỌC SGK (10 CÂU HỎI)
  // ==========================================
  const quizQuestions = [
    {
      id: 1,
      tag: 'SGK 8.6 Trang 50',
      title: 'Cho bốn điểm A, B, C, D cùng thuộc đường thẳng xy theo thứ tự A - C - B - D (Hình 8.21). Điểm nào sau đây nằm giữa điểm A và điểm D?',
      options: [
        'Cả điểm B và điểm C đều nằm giữa điểm A và D',
        'Chỉ có duy nhất điểm B',
        'Chỉ có duy nhất điểm C',
        'Không có điểm nào nằm giữa A và D'
      ],
      correct: 0,
      exp: 'Chính xác! Vì thứ tự trên đường thẳng là A ➔ C ➔ B ➔ D nên cả điểm C và điểm B đều nằm giữa hai điểm A và D.'
    },
    {
      id: 2,
      tag: 'SGK 8.6 Trang 50',
      title: 'Quan sát Hình 8.21 (A - C - B - D trên xy). Hai điểm nào sau đây nằm CÙNG PHÍA đối với điểm D?',
      options: [
        'Hai điểm A và C (cùng nằm về phía bên trái của điểm D)',
        'Điểm A và điểm y',
        'Điểm D và điểm B',
        'Điểm x và điểm y'
      ],
      correct: 0,
      exp: 'Chính xác! Cả điểm A, C và B đều nằm về phía bên trái điểm D (về phía x), do đó A và C nằm cùng phía đối với điểm D.'
    },
    {
      id: 3,
      tag: 'SGK 8.6 Trang 50',
      title: 'Trong các câu sau đây về Hình 8.21 (A - C - B - D trên xy), câu nào KHẲNG ĐỊNH SAI?',
      options: [
        'Điểm B nằm khác phía với điểm A đối với điểm D',
        'Điểm B nằm giữa điểm A và điểm D',
        'Hai điểm A và C nằm cùng phía đối với điểm D',
        'Hai điểm B và C nằm cùng phía đối với điểm D'
      ],
      correct: 0,
      exp: 'Chính xác! Câu "Điểm B nằm khác phía với điểm A đối với điểm D" là SAI vì cả A và B đều cùng nằm về một phía (bên trái) so với điểm D.'
    },
    {
      id: 4,
      tag: 'SGK 8.7a Trang 50',
      title: 'Quan sát Hình 8.22 với 3 điểm A, B, C trên đường thẳng xy. Có tất cả bao nhiêu tia phân biệt có gốc là một trong các điểm A, B, C?',
      options: [
        '6 tia (Ax, Ay, Bx, By, Cx, Cy)',
        '3 tia (Ax, By, Cy)',
        '4 tia (Ax, Ay, Bx, By)',
        '8 tia'
      ],
      correct: 0,
      exp: 'Chính xác! Mỗi điểm trên đường thẳng chia đường thẳng làm 2 tia đối nhau. Có 3 điểm A, B, C nên có 3 × 2 = 6 tia: Ax, Ay, Bx, By, Cx, Cy.'
    },
    {
      id: 5,
      tag: 'SGK 8.7b Trang 50',
      title: 'Trên Hình 8.22 (thứ tự x - A - B - C - y), điểm B nằm trên những tia nào dưới đây?',
      options: [
        'Tia Ay, tia By, tia Bx và tia Cx',
        'Chỉ nằm trên tia Ax',
        'Chỉ nằm trên tia Cy',
        'Điểm B không thuộc bất kì tia nào'
      ],
      correct: 0,
      exp: 'Chính xác! Điểm B nằm về phía bên phải A (thuộc tia Ay), là gốc của tia Bx và By (thuộc cả hai tia này), và nằm về phía bên trái C (thuộc tia Cx).'
    },
    {
      id: 6,
      tag: 'SGK 8.7c Trang 50',
      title: 'Tia AC và tia CA có phải là hai tia đối nhau không? Vì sao?',
      options: [
        'Không phải, vì hai tia đối nhau bắt buộc phải có chung gốc (tia AC gốc A, tia CA gốc C)',
        'Phải, vì hai tia này có hướng ngược nhau trên đường thẳng',
        'Phải, vì cả hai tia đều chứa điểm B',
        'Không phải, vì độ dài của hai tia khác nhau'
      ],
      correct: 0,
      exp: 'Chính xác! Theo định nghĩa SGK, hai tia đối nhau bắt buộc phải có CHUNG GỐC. Tia AC có gốc A, tia CA có gốc C nên không thể là hai tia đối nhau!'
    },
    {
      id: 7,
      tag: 'SGK 8.8 Trang 50',
      title: 'Cho điểm C nằm trên tia Ax, điểm B nằm trên tia Cx. Ba điểm A, B, C phân biệt. Khẳng định nào sau đây là ĐÚNG?',
      options: [
        'Điểm C vừa nằm trên tia AB vừa nằm trên tia BA',
        'Điểm A nằm trên tia CB',
        'Tia CB và tia BC là hai tia đối nhau',
        'Điểm B nằm giữa hai điểm A và C'
      ],
      correct: 0,
      exp: 'Chính xác! Vì C thuộc tia Ax và B thuộc tia Cx nên theo thứ tự là A ➔ C ➔ B. Điểm C nằm giữa A và B nên C vừa thuộc tia AB vừa thuộc tia BA!'
    },
    {
      id: 8,
      tag: 'SGK 8.8 Trang 50',
      title: 'Cũng với giả thiết trên (thứ tự A - C - B trên tia Ax), hai tia CA và tia Cx là hai tia gì?',
      options: [
        'Hai tia đối nhau (vì chung gốc C và đi về hai hướng ngược nhau trên đường thẳng Ax)',
        'Hai tia trùng nhau',
        'Hai tia cắt nhau',
        'Hai đường thẳng song song'
      ],
      correct: 0,
      exp: 'Chính xác! Điểm C nằm giữa A và các điểm thuộc hướng x, do đó tia CA và tia Cx chung gốc C và tạo thành đường thẳng chứa tia Ax, nên là hai tia đối nhau.'
    },
    {
      id: 9,
      tag: 'SGK 8.9 Trang 50',
      title: 'Cho ba điểm A, B, C không thẳng hàng. Có bao nhiêu tia chứa hai trong ba điểm A, B, C?',
      options: [
        '6 tia (tia AB, tia AC, tia BA, tia BC, tia CA, tia CB)',
        '3 tia',
        '4 tia',
        '9 tia'
      ],
      correct: 0,
      exp: 'Chính xác! Từ 3 điểm phân biệt không thẳng hàng, mỗi cặp điểm tạo ra 2 tia có gốc khác nhau. Có 3 cặp điểm (AB, BC, CA) nên tạo được 3 × 2 = 6 tia.'
    },
    {
      id: 10,
      tag: 'Thiên Văn SGK Trang 50',
      title: 'Khi xảy ra hiện tượng NHẬT THỰC, thứ tự thẳng hàng của ba thiên thể trong không gian là gì?',
      options: [
        'Mặt Trời ➔ Mặt Trăng ➔ Trái Đất (Mặt Trăng nằm ở giữa)',
        'Mặt Trời ➔ Trái Đất ➔ Mặt Trăng (Trái Đất nằm ở giữa)',
        'Mặt Trăng ➔ Mặt Trời ➔ Trái Đất (Mặt Trời nằm ở giữa)',
        'Trái Đất ➔ Mặt Trời ➔ Mặt Trăng'
      ],
      correct: 0,
      exp: 'Chính xác! Trong hiện tượng Nhật thực, Mặt Trăng đi vào giữa Trái Đất và Mặt Trời làm che khuất một phần hoặc toàn bộ ánh sáng Mặt Trời chiếu xuống Trái Đất!'
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
          <span style="font-size: 0.8rem; color: #4f46e5; background: #e0e7ff; padding: 2px 8px; border-radius: 12px; height: fit-content; white-space: nowrap;">${q.tag}</span>
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

    // Add listeners to option buttons
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
    // Badge 2: Streak >= 3
    if (state.streak >= 3 && !state.unlockedBadges.has(2)) {
      unlockBadge(2);
    }
    // Badge 3: 500 XP
    if (state.score >= 500 && !state.unlockedBadges.has(3)) {
      unlockBadge(3);
    }
    // Badge 4: Question 10 correct
    if (state.answeredQuestions[10] === 0 && !state.unlockedBadges.has(4)) {
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
