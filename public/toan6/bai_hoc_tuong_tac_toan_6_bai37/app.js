// JAVASCRIPT CHO BÀI 37: SỐ ĐO GÓC - TOÁN 6 KẾT NỐI TRI THỨC

document.addEventListener('DOMContentLoaded', () => {
  // --- TRẠNG THÁI NGƯỜI CHƠI & ĐIỂM SỐ ---
  const state = {
    playerName: 'Nhà Thám Hiểm Toán Học',
    playerAvatar: '👨‍🎓',
    score: 0,
    stars: 0,
    streak: 0,
    soundEnabled: true,
    answeredQuestions: new Set(),
    unlockedBadges: new Set()
  };

  // --- ÂM THANH TỔNG HỢP WEB AUDIO API ---
  const AudioEngine = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
    },
    playTone(freq, type = 'sine', duration = 0.2, gainVal = 0.15) {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;

      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {
        console.warn('Audio error:', e);
      }
    },
    click() {
      this.playTone(600, 'triangle', 0.08, 0.1);
    },
    correct() {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.25);
        });
      } catch (e) {}
    },
    wrong() {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [240, 180].forEach((freq, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.15, now + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.25);
        });
      } catch (e) {}
    },
    fanfare() {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((freq, i) => {
          setTimeout(() => this.playTone(freq, 'sine', 0.35, 0.2), i * 120);
        });
      } catch (e) {}
    }
  };

  // --- CẬP NHẬT GIAO DIỆN HUD ---
  function updateHUD() {
    document.getElementById('hud-score').textContent = `${state.score} XP`;
    document.getElementById('hud-stars').textContent = `${state.stars} / 5`;
    document.getElementById('hud-streak').textContent = `${state.streak} Chuỗi`;
    document.getElementById('hud-name').textContent = state.playerName;
    document.getElementById('hud-avatar').textContent = state.playerAvatar;

    let rank = 'Thực Tập Đo Góc';
    if (state.score >= 200) rank = 'Bậc Thầy Thước Bán Nguyệt';
    else if (state.score >= 120) rank = 'Kỹ Sư Đo Đạc 6';
    else if (state.score >= 50) rank = 'Trinh Sát Hình Học';
    document.getElementById('hud-rank').textContent = rank;

    checkBadges();
  }

  function addScore(pts) {
    state.score += pts;
    state.streak += 1;
    updateHUD();
  }

  function resetStreak() {
    state.streak = 0;
    updateHUD();
  }

  // --- HỆ THỐNG HUY HIỆU ---
  function checkBadges() {
    if (state.score >= 50 && !state.unlockedBadges.has('b1')) {
      unlockBadge('b1', 'badge-1');
    }
    if (state.stars >= 2 && !state.unlockedBadges.has('b2')) {
      unlockBadge('b2', 'badge-2');
    }
    if (state.stars >= 3 && !state.unlockedBadges.has('b3')) {
      unlockBadge('b3', 'badge-3');
    }
    if (state.stars >= 4 && !state.unlockedBadges.has('b4')) {
      unlockBadge('b4', 'badge-4');
    }
    if (state.score >= 180 && !state.unlockedBadges.has('b5')) {
      unlockBadge('b5', 'badge-5');
    }
  }

  function unlockBadge(bId, elemId) {
    state.unlockedBadges.add(bId);
    const elem = document.getElementById(elemId);
    if (elem) {
      elem.classList.add('unlocked');
    }
    AudioEngine.fanfare();
  }

  // --- MODAL KHỞI TẠO ---
  const startModal = document.getElementById('start-modal');
  const avatarBtns = document.querySelectorAll('.avatar-btn');
  const playerNameInput = document.getElementById('player-name-input');
  const btnStart = document.getElementById('btn-start');

  avatarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      AudioEngine.click();
      avatarBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.playerAvatar = btn.getAttribute('data-avatar');
    });
  });

  btnStart.addEventListener('click', () => {
    AudioEngine.click();
    const val = playerNameInput.value.trim();
    if (val) state.playerName = val;
    startModal.classList.add('hidden');
    updateHUD();
  });

  // Sound toggle button
  const soundBtn = document.getElementById('btn-sound-toggle');
  soundBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundBtn.textContent = state.soundEnabled ? '🔊 Âm thanh: Bật' : '🔇 Âm thanh: Tắt';
    AudioEngine.click();
  });

  // --- THÍ NGHIỆM 1: THƯỚC ĐO GÓC BÁN NGUYỆT 180° ---
  const protCanvas = document.getElementById('prot-canvas');
  const protCtx = protCanvas.getContext('2d');
  const angleSlider = document.getElementById('angle-slider');
  const sliderAngleVal = document.getElementById('slider-angle-val');
  const protAnalysisBox = document.getElementById('prot-analysis-box');

  let currentAngle = 60; // in degrees
  let isDraggingProt = false;

  function classifyAngle(deg) {
    if (deg === 0) return { type: 'Góc không', color: '#64748b', desc: 'Hai tia trùng nhau' };
    if (deg > 0 && deg < 90) return { type: 'Góc nhọn', color: '#0284c7', desc: '0° < α < 90° (nhỏ hơn góc vuông)' };
    if (deg === 90) return { type: 'Góc vuông', color: '#16a34a', desc: 'α = 90° (bằng một góc vuông)' };
    if (deg > 90 && deg < 180) return { type: 'Góc tù', color: '#d97706', desc: '90° < α < 180° (lớn hơn góc vuông, nhỏ hơn góc bẹt)' };
    if (deg === 180) return { type: 'Góc bẹt', color: '#dc2626', desc: 'α = 180° (hai tia đối nhau tạo thành đường thẳng)' };
    return { type: 'Góc', color: '#475569', desc: '' };
  }

  function drawProtractor() {
    const W = protCanvas.width;
    const H = protCanvas.height;
    protCtx.clearRect(0, 0, W, H);

    const ox = W / 2;
    const oy = H - 55;
    const R = 230;

    // 1. Nền mờ thước đo góc
    protCtx.save();
    protCtx.beginPath();
    protCtx.arc(ox, oy, R, Math.PI, 0, false);
    protCtx.closePath();
    protCtx.fillStyle = 'rgba(236, 254, 255, 0.45)';
    protCtx.fill();
    protCtx.strokeStyle = '#0891b2';
    protCtx.lineWidth = 2.5;
    protCtx.stroke();
    protCtx.restore();

    // 2. Vạch chia độ & Số đo (Dual scale: 0->180 và 180->0)
    protCtx.save();
    protCtx.font = '10px sans-serif';
    protCtx.textAlign = 'center';
    protCtx.textBaseline = 'middle';

    for (let deg = 0; deg <= 180; deg++) {
      const rad = deg * (Math.PI / 180);
      const isTen = deg % 10 === 0;
      const isFive = deg % 5 === 0;
      const tickLen = isTen ? 16 : (isFive ? 10 : 5);

      const x1 = ox - R * Math.cos(rad);
      const y1 = oy - R * Math.sin(rad);
      const x2 = ox - (R - tickLen) * Math.cos(rad);
      const y2 = oy - (R - tickLen) * Math.sin(rad);

      protCtx.beginPath();
      protCtx.moveTo(x1, y1);
      protCtx.lineTo(x2, y2);
      protCtx.strokeStyle = isTen ? '#0e7490' : '#67e8f9';
      protCtx.lineWidth = isTen ? 1.8 : 1;
      protCtx.stroke();

      if (isTen && deg > 0 && deg < 180) {
        // Vòng trong: từ phải qua trái (0 -> 180)
        const numRIn = R - 26;
        const xIn = ox + numRIn * Math.cos(rad);
        const yIn = oy - numRIn * Math.sin(rad);
        protCtx.fillStyle = '#0f172a';
        protCtx.fillText(deg.toString(), xIn, yIn);

        // Vòng ngoài: từ trái qua phải (180 -> 0)
        const numROut = R - 38;
        const xOut = ox + numROut * Math.cos(rad);
        const yOut = oy - numROut * Math.sin(rad);
        protCtx.fillStyle = '#64748b';
        protCtx.fillText((180 - deg).toString(), xOut, yOut);
      }
    }

    // Tâm O và vạch cơ sở Ox
    protCtx.beginPath();
    protCtx.arc(ox, oy, 6, 0, Math.PI * 2);
    protCtx.fillStyle = '#0891b2';
    protCtx.fill();
    protCtx.strokeStyle = 'white';
    protCtx.lineWidth = 2;
    protCtx.stroke();

    // Điểm O label
    protCtx.fillStyle = '#0e7490';
    protCtx.font = 'bold 14px sans-serif';
    protCtx.fillText('O (Tâm)', ox, oy + 20);

    // 3. Cung biểu diễn góc tô sáng
    const radCurrent = currentAngle * (Math.PI / 180);
    const info = classifyAngle(currentAngle);

    protCtx.beginPath();
    protCtx.moveTo(ox, oy);
    protCtx.arc(ox, oy, 70, 0, -radCurrent, true);
    protCtx.closePath();
    protCtx.fillStyle = info.color + '33'; // 20% opacity
    protCtx.fill();
    protCtx.strokeStyle = info.color;
    protCtx.lineWidth = 2.5;
    protCtx.stroke();

    // 4. Tia cố định Ox (sang phải)
    protCtx.beginPath();
    protCtx.moveTo(ox, oy);
    protCtx.lineTo(ox + R + 25, oy);
    protCtx.strokeStyle = '#0891b2';
    protCtx.lineWidth = 3.5;
    protCtx.stroke();

    protCtx.fillStyle = '#0e7490';
    protCtx.font = 'bold 15px sans-serif';
    protCtx.fillText('x (Vạch 0°)', ox + R + 30, oy - 10);

    // 5. Tia chuyển động Oy theo góc currentAngle
    const oyX = ox + (R + 25) * Math.cos(-radCurrent);
    const oyY = oy + (R + 25) * Math.sin(-radCurrent);

    protCtx.beginPath();
    protCtx.moveTo(ox, oy);
    protCtx.lineTo(oyX, oyY);
    protCtx.strokeStyle = info.color;
    protCtx.lineWidth = 4;
    protCtx.stroke();

    // Núm kéo tương tác ở đầu tia Oy
    protCtx.beginPath();
    protCtx.arc(oyX, oyY, 10, 0, Math.PI * 2);
    protCtx.fillStyle = '#f59e0b';
    protCtx.fill();
    protCtx.strokeStyle = 'white';
    protCtx.lineWidth = 2;
    protCtx.stroke();

    protCtx.fillStyle = info.color;
    protCtx.font = 'bold 16px sans-serif';
    protCtx.fillText(`y`, oyX + 16 * Math.cos(-radCurrent), oyY + 16 * Math.sin(-radCurrent));

    // Hiển thị số đo ở giữa cung
    if (currentAngle > 0) {
      const midRad = (-radCurrent) / 2;
      const textDist = 95;
      const tx = ox + textDist * Math.cos(midRad);
      const ty = oy + textDist * Math.sin(midRad);

      protCtx.fillStyle = info.color;
      protCtx.font = 'bold 15px sans-serif';
      protCtx.fillText(`${currentAngle}°`, tx, ty);
    }

    protCtx.restore();

    // Cập nhật thẻ phân tích
    protAnalysisBox.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:8px;">
        <span style="font-size:1.1rem; font-weight:800; color:${info.color};">
          Góc $\\widehat{xOy} = ${currentAngle}^\\circ$ ➔ <strong>${info.type.toUpperCase()}</strong>
        </span>
        <span style="background:${info.color}15; color:${info.color}; border:1px solid ${info.color}; padding:2px 10px; border-radius:12px; font-weight:700;">
          ${info.desc}
        </span>
      </div>
      <div style="margin-top:6px; color:#475569; font-size:0.88rem;">
        ${currentAngle === 90 ? '⭐ Góc vuông ký hiệu góc vuông vuông vắn, có ứng dụng trong hầu hết các công trình kiến trúc!' : ''}
        ${currentAngle === 180 ? '⭐ Góc bẹt có hai tia Ox và Oy đối nhau, tạo thành một đường thẳng xy hoàn chỉnh!' : ''}
        ${currentAngle < 90 && currentAngle > 0 ? 'Mẹo: Dùng êke đặt vào đỉnh O, nếu tia Oy nằm bên trong góc vuông của êke thì đó chắc chắn là góc nhọn.' : ''}
        ${currentAngle > 90 && currentAngle < 180 ? 'Mẹo: Đặt êke vào góc, nếu tia Oy vượt ra bên ngoài góc vuông của êke thì đó là góc tù.' : ''}
      </div>
    `;
  }

  function setAngle(deg) {
    currentAngle = Math.max(0, Math.min(180, Math.round(deg)));
    angleSlider.value = currentAngle;
    sliderAngleVal.textContent = `${currentAngle}°`;
    drawProtractor();
  }

  angleSlider.addEventListener('input', (e) => {
    setAngle(parseFloat(e.target.value));
  });

  document.getElementById('btn-snap-30').addEventListener('click', () => { AudioEngine.click(); setAngle(30); });
  document.getElementById('btn-snap-90').addEventListener('click', () => { AudioEngine.click(); setAngle(90); });
  document.getElementById('btn-snap-135').addEventListener('click', () => { AudioEngine.click(); setAngle(135); });
  document.getElementById('btn-snap-180').addEventListener('click', () => { AudioEngine.click(); setAngle(180); });
  document.getElementById('btn-random-angle').addEventListener('click', () => {
    AudioEngine.click();
    const rand = Math.floor(Math.random() * 37) * 5; // bội số của 5
    setAngle(rand);
  });

  // Tương tác chuột / cảm ứng trực tiếp trên thước đo
  function handleProtPointer(e) {
    const rect = protCanvas.getBoundingClientRect();
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    if (!clientX || !clientY) return;

    const scaleX = protCanvas.width / rect.width;
    const scaleY = protCanvas.height / rect.height;
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    const ox = protCanvas.width / 2;
    const oy = protCanvas.height - 55;

    const dx = x - ox;
    const dy = oy - y; // vì trục Y hướng xuống

    if (dy >= -20) {
      let rad = Math.atan2(dy, dx);
      let deg = rad * (180 / Math.PI);
      if (deg < 0) deg = 0;
      if (deg > 180) deg = 180;
      setAngle(deg);
    }
  }

  protCanvas.addEventListener('mousedown', (e) => {
    isDraggingProt = true;
    handleProtPointer(e);
  });
  window.addEventListener('mousemove', (e) => {
    if (isDraggingProt) handleProtPointer(e);
  });
  window.addEventListener('mouseup', () => {
    if (isDraggingProt) {
      isDraggingProt = false;
      state.stars = Math.max(state.stars, 2);
      checkBadges();
      updateHUD();
    }
  });

  protCanvas.addEventListener('touchstart', (e) => {
    isDraggingProt = true;
    handleProtPointer(e);
  }, { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (isDraggingProt) handleProtPointer(e);
  }, { passive: true });
  window.addEventListener('touchend', () => {
    isDraggingProt = false;
    state.stars = Math.max(state.stars, 2);
    checkBadges();
    updateHUD();
  });

  drawProtractor();

  // --- THÍ NGHIỆM 2A: MÔ PHỎNG KÊ THANG AN TOÀN (BÀI 8.38) ---
  const ladderCanvas = document.getElementById('ladder-canvas');
  const ladderCtx = ladderCanvas.getContext('2d');
  const ladderSlider = document.getElementById('ladder-angle-slider');
  const ladderAngleDisplay = document.getElementById('ladder-angle-display');
  const ladderStatusBox = document.getElementById('ladder-status-box');

  let ladderAngle = 75;

  function drawLadder() {
    const W = ladderCanvas.width;
    const H = ladderCanvas.height;
    ladderCtx.clearRect(0, 0, W, H);

    const floorY = H - 25;
    const wallX = W - 35;

    // Mặt đất & Bờ tường
    ladderCtx.fillStyle = '#94a3b8';
    ladderCtx.fillRect(0, floorY, W, 25);

    ladderCtx.fillStyle = '#cbd5e1';
    ladderCtx.fillRect(wallX, 15, 35, floorY - 15);

    // Kẻ gạch trên tường
    ladderCtx.strokeStyle = '#94a3b8';
    ladderCtx.lineWidth = 1;
    for (let y = 25; y < floorY; y += 20) {
      ladderCtx.beginPath();
      ladderCtx.moveTo(wallX, y);
      ladderCtx.lineTo(W, y);
      ladderCtx.stroke();
    }

    // Tính toạ độ thang (chiều dài thang L = 160)
    const L = 155;
    const rad = ladderAngle * (Math.PI / 180);
    const ladderHeight = L * Math.sin(rad);
    const ladderBase = L * Math.cos(rad);

    const footX = wallX - ladderBase;
    const footY = floorY;
    const topX = wallX;
    const topY = floorY - ladderHeight;

    // Vẽ cung đo góc tại chân thang
    ladderCtx.beginPath();
    ladderCtx.arc(footX, footY, 30, 0, -rad, true);
    ladderCtx.strokeStyle = '#f59e0b';
    ladderCtx.lineWidth = 2;
    ladderCtx.stroke();

    ladderCtx.fillStyle = '#b45309';
    ladderCtx.font = 'bold 11px sans-serif';
    ladderCtx.fillText(`${ladderAngle}°`, footX + 35, footY - 10);

    // Vẽ thân thang
    ladderCtx.save();
    ladderCtx.strokeStyle = '#0891b2';
    ladderCtx.lineWidth = 5;
    ladderCtx.lineCap = 'round';
    ladderCtx.beginPath();
    ladderCtx.moveTo(footX, footY);
    ladderCtx.lineTo(topX, topY);
    ladderCtx.stroke();

    // Các bậc thang
    const steps = 6;
    ladderCtx.strokeStyle = '#e0f2fe';
    ladderCtx.lineWidth = 3;
    for (let i = 1; i < steps; i++) {
      const stepX = footX + (topX - footX) * (i / steps);
      const stepY = footY + (topY - footY) * (i / steps);
      ladderCtx.beginPath();
      ladderCtx.arc(stepX, stepY, 2.5, 0, Math.PI * 2);
      ladderCtx.stroke();
    }
    ladderCtx.restore();

    // Trạng thái an toàn
    ladderAngleDisplay.textContent = `${ladderAngle}°`;

    if (ladderAngle < 65) {
      ladderStatusBox.style.background = '#fee2e2';
      ladderStatusBox.style.color = '#991b1b';
      ladderStatusBox.innerHTML = `⚠️ <strong>Góc ${ladderAngle}° quá nhỏ (dốc thấp):</strong> Thang dễ bị trượt chân nguy hiểm do lực kéo ngang lớn!`;
    } else if (ladderAngle > 78) {
      ladderStatusBox.style.background = '#fef3c7';
      ladderStatusBox.style.color = '#92400e';
      ladderStatusBox.innerHTML = `⚠️ <strong>Góc ${ladderAngle}° quá đứng:</strong> Trọng tâm thang quá sát tường, dễ bị ngửa thang ra sau khi leo!`;
    } else {
      ladderStatusBox.style.background = '#dcfce7';
      ladderStatusBox.style.color = '#166534';
      ladderStatusBox.innerHTML = `✅ <strong>Góc ${ladderAngle}° ĐẠT CHUẨN AN TOÀN!</strong> Góc khuyến nghị 75° giúp thang bám chắc cả vào tường và mặt sàn.`;
    }
  }

  ladderSlider.addEventListener('input', (e) => {
    ladderAngle = parseInt(e.target.value);
    drawLadder();
    state.stars = Math.max(state.stars, 3);
    checkBadges();
    updateHUD();
  });

  drawLadder();

  // --- THÍ NGHIỆM 2B: ĐỒNG HỒ KIM & GÓC (BÀI 8.33) ---
  const clockCanvas = document.getElementById('clock-canvas');
  const clockCtx = clockCanvas.getContext('2d');
  const clockAnalysisBox = document.getElementById('clock-analysis-box');
  const clockBtns = document.querySelectorAll('.btn-clock-time');

  let currentClockHour = 3;
  let currentClockMin = 0;

  function drawClock(hour, min) {
    const W = clockCanvas.width;
    const H = clockCanvas.height;
    const cx = W / 2;
    const cy = H / 2;
    const R = 85;

    clockCtx.clearRect(0, 0, W, H);

    // Viền mặt đồng hồ
    clockCtx.beginPath();
    clockCtx.arc(cx, cy, R, 0, Math.PI * 2);
    clockCtx.fillStyle = '#ffffff';
    clockCtx.fill();
    clockCtx.strokeStyle = '#0891b2';
    clockCtx.lineWidth = 3;
    clockCtx.stroke();

    // Vạch số 1 đến 12
    clockCtx.font = 'bold 12px sans-serif';
    clockCtx.textAlign = 'center';
    clockCtx.textBaseline = 'middle';
    clockCtx.fillStyle = '#0f172a';

    for (let num = 1; num <= 12; num++) {
      const ang = (num * 30) * (Math.PI / 180);
      const nx = cx + (R - 16) * Math.sin(ang);
      const ny = cy - (R - 16) * Math.cos(ang);
      clockCtx.fillText(num.toString(), nx, ny);
    }

    // Góc tạo bởi hai kim
    const minDeg = min * 6; // 360 / 60 = 6 deg/min
    const hourDeg = (hour % 12) * 30 + min * 0.5; // 360 / 12 = 30 deg/hour
    let diffDeg = Math.abs(hourDeg - minDeg);
    if (diffDeg > 180) diffDeg = 360 - diffDeg;

    // Vẽ kim giờ (ngắn, đậm)
    const hRad = (hourDeg - 90) * (Math.PI / 180);
    clockCtx.beginPath();
    clockCtx.moveTo(cx, cy);
    clockCtx.lineTo(cx + 45 * Math.cos(hRad), cy + 45 * Math.sin(hRad));
    clockCtx.strokeStyle = '#0e7490';
    clockCtx.lineWidth = 4.5;
    clockCtx.lineCap = 'round';
    clockCtx.stroke();

    // Vẽ kim phút (dài, mảnh)
    const mRad = (minDeg - 90) * (Math.PI / 180);
    clockCtx.beginPath();
    clockCtx.moveTo(cx, cy);
    clockCtx.lineTo(cx + 65 * Math.cos(mRad), cy + 65 * Math.sin(mRad));
    clockCtx.strokeStyle = '#f59e0b';
    clockCtx.lineWidth = 3;
    clockCtx.lineCap = 'round';
    clockCtx.stroke();

    // Trục kim
    clockCtx.beginPath();
    clockCtx.arc(cx, cy, 5, 0, Math.PI * 2);
    clockCtx.fillStyle = '#0891b2';
    clockCtx.fill();

    // Phân loại
    const info = classifyAngle(diffDeg);
    clockAnalysisBox.innerHTML = `
      <strong>⏱️ Lúc ${hour}:${min < 10 ? '0' + min : min}:</strong><br>
      • Kim phút chỉ số 12, kim giờ chỉ số ${hour}.<br>
      • Số đo góc: <strong>${diffDeg}°</strong> (${hour} khoảng × 30° = ${diffDeg}°).<br>
      • Phân loại: <strong style="color:${info.color}; font-size:1rem;">${info.type.toUpperCase()}</strong>.
    `;
  }

  clockBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      AudioEngine.click();
      clockBtns.forEach(b => b.style.borderColor = 'var(--border)');
      btn.style.borderColor = 'var(--primary)';
      currentClockHour = parseInt(btn.getAttribute('data-hour'));
      currentClockMin = parseInt(btn.getAttribute('data-min'));
      drawClock(currentClockHour, currentClockMin);
      state.stars = Math.max(state.stars, 4);
      checkBadges();
      updateHUD();
    });
  });

  drawClock(3, 0);

  // --- SECTION 3: ĐẤU TRƯỜNG SGK ARENA (10 CÂU HỎI) ---
  const questions = [
    {
      id: 1,
      source: 'SGK Trang 62 - Quy tắc phân loại',
      text: 'Góc có số đo chính xác bằng 90° được gọi là loại góc gì?',
      options: ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'],
      correct: 1,
      explain: 'Theo định nghĩa trong SGK Toán 6 (Trang 62): Góc có số đo bằng 90° là góc vuông.'
    },
    {
      id: 2,
      source: 'SGK Trang 62 - Bài 8.31',
      text: 'Một góc có số đo là 135°. Góc này thuộc loại góc nào dưới đây?',
      options: ['Góc nhọn', 'Góc vuông', 'Góc tù', 'Góc bẹt'],
      correct: 2,
      explain: 'Vì 90° < 135° < 180°, nên góc có số đo 135° là góc tù.'
    },
    {
      id: 3,
      source: 'SGK Trang 62 - Bài 8.31',
      text: 'Góc bẹt là góc tạo bởi hai tia đối nhau, số đo của góc bẹt là:',
      options: ['90°', '120°', '180°', '360°'],
      correct: 2,
      explain: 'Góc bẹt có hai cạnh là hai tia đối nhau và có số đo bằng 180°.'
    },
    {
      id: 4,
      source: 'SGK Trang 63 - Bài 8.32',
      text: 'Dụng cụ học tập nào dưới đây thường được dùng để kiểm tra góc vuông một cách nhanh chóng nhất?',
      options: ['Thước thẳng có chia milimét', 'Thước đo góc bán nguyệt', 'Thước êke', 'Compa'],
      correct: 2,
      explain: 'Thước êke có một góc vuông chuẩn 90°, nên thường được áp vào góc để kiểm tra nhanh góc vuông, góc nhọn hay góc tù.'
    },
    {
      id: 5,
      source: 'SGK Trang 65 - Bài 8.33',
      text: 'Vào lúc 3 giờ đúng, góc tạo bởi kim giờ và kim phút trên mặt đồng hồ là góc gì?',
      options: ['Góc nhọn (60°)', 'Góc vuông (90°)', 'Góc tù (120°)', 'Góc bẹt (180°)'],
      correct: 1,
      explain: 'Lúc 3 giờ, kim phút chỉ số 12, kim giờ chỉ số 3. Hai kim vuông góc với nhau và tạo thành góc vuông 90°.'
    },
    {
      id: 6,
      source: 'SGK Trang 65 - Bài 8.33',
      text: 'Vào lúc 6 giờ đúng, góc tạo bởi hai kim giờ và kim phút là góc gì và có số đo bao nhiêu?',
      options: ['Góc vuông (90°)', 'Góc bẹt (180°)', 'Góc tù (150°)', 'Góc nhọn (30°)'],
      correct: 1,
      explain: 'Lúc 6 giờ, kim phút chỉ số 12, kim giờ chỉ số 6, tạo thành hai tia đối nhau. Do đó góc tạo bởi hai kim là góc bẹt 180°.'
    },
    {
      id: 7,
      source: 'SGK Trang 65 - Bài 8.33',
      text: 'Vào lúc 2 giờ đúng, góc tạo bởi kim giờ và kim phút có số đo bằng bao nhiêu?',
      options: ['30°', '45°', '60°', '90°'],
      correct: 2,
      explain: 'Mỗi khoảng cách giữa hai số liền nhau trên mặt đồng hồ ứng với 360° : 12 = 30°. Lúc 2 giờ gồm 2 khoảng: 2 × 30° = 60° (góc nhọn).'
    },
    {
      id: 8,
      source: 'SGK Trang 65 - Bài 8.36',
      text: 'Cho tam giác đều ABC (mỗi góc bằng 60°). Vẽ tia Ax nằm giữa hai tia AB và AC sao cho góc ∠BAx = 20°. Tính số đo góc ∠xAC:',
      options: ['20°', '30°', '40°', '50°'],
      correct: 2,
      explain: 'Vì tia Ax nằm giữa hai tia AB và AC nên: ∠BAC = ∠BAx + ∠xAC. Do đó ∠xAC = ∠BAC - ∠BAx = 60° - 20° = 40°.'
    },
    {
      id: 9,
      source: 'SGK Trang 66 - Bài 8.37',
      text: 'Cho góc vuông ∠xOy = 90°. Trong góc này vẽ hai tia Om và On sao cho ∠xOm = 15° và ∠yOn = 30°. Tính số đo của góc ∠mOn:',
      options: ['45°', '35°', '55°', '60°'],
      correct: 0,
      explain: 'Vì hai tia Om, On nằm trong góc vuông xOy nên: ∠mOn = 90° - ∠xOm - ∠yOn = 90° - 15° - 30° = 45°.'
    },
    {
      id: 10,
      source: 'SGK Trang 66 - Bài 8.38',
      text: 'Khi kê thang dựa vào tường để leo trèo, theo tiêu chuẩn kỹ thuật an toàn, góc nghiêng tạo bởi thân thang và mặt đất được khuyến nghị là:',
      options: ['Xấp xỉ 45°', 'Xấp xỉ 60°', 'Xấp xỉ 75°', 'Xấp xỉ 90°'],
      correct: 2,
      explain: 'Bài 8.38 SGK Toán 6 nêu rõ: Để đảm bảo an toàn, góc nghiêng tạo bởi thang và mặt đất nên đạt khoảng 75° (vừa chống trượt chân thang, vừa chống đổ ngửa).'
    }
  ];

  const questionsListElem = document.getElementById('questions-list');
  const arenaProgressText = document.getElementById('arena-progress-text');

  function renderQuestions() {
    questionsListElem.innerHTML = '';
    questions.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.id = `q-card-${q.id}`;

      card.innerHTML = `
        <div class="q-title">
          <span>Câu ${q.id}: ${q.text}</span>
          <span style="font-size:0.75rem; font-weight:600; color:var(--primary);">${q.source}</span>
        </div>
        <div class="options-grid" id="opt-grid-${q.id}">
          ${q.options.map((opt, oIdx) => `
            <button type="button" class="opt-btn" data-qid="${q.id}" data-oidx="${oIdx}">
              <strong>${String.fromCharCode(65 + oIdx)}.</strong> ${opt}
            </button>
          `).join('')}
        </div>
        <div class="explanation-box" id="explain-${q.id}">
          💡 <strong>Lời giải chi tiết:</strong> ${q.explain}
        </div>
      `;

      questionsListElem.appendChild(card);
    });

    // Gắn sự kiện trả lời
    document.querySelectorAll('.opt-btn').forEach(btn => {
      btn.addEventListener('click', handleAnswerClick);
    });
  }

  function handleAnswerClick(e) {
    const btn = e.currentTarget;
    const qid = parseInt(btn.getAttribute('data-qid'));
    const oidx = parseInt(btn.getAttribute('data-oidx'));

    if (state.answeredQuestions.has(qid)) return;

    const q = questions.find(item => item.id === qid);
    const card = document.getElementById(`q-card-${qid}`);
    const explainBox = document.getElementById(`explain-${qid}`);
    const allBtns = card.querySelectorAll('.opt-btn');

    state.answeredQuestions.add(qid);
    allBtns.forEach(b => b.disabled = true);

    if (oidx === q.correct) {
      btn.classList.add('correct');
      card.classList.add('answered-correct');
      AudioEngine.correct();
      addScore(20);
    } else {
      btn.classList.add('wrong');
      allBtns[q.correct].classList.add('correct');
      card.classList.add('answered-wrong');
      AudioEngine.wrong();
      resetStreak();
    }

    explainBox.classList.add('show');
    arenaProgressText.textContent = `Đã hoàn thành: ${state.answeredQuestions.size} / ${questions.length}`;

    if (state.answeredQuestions.size === questions.length) {
      state.stars = 5;
      checkBadges();
      updateHUD();
      AudioEngine.fanfare();
    }
  }

  renderQuestions();

  // --- NÚT IN GIẤY KHEN A4 ---
  const btnPrintCert = document.getElementById('btn-print-certificate');
  btnPrintCert.addEventListener('click', () => {
    AudioEngine.click();
    document.getElementById('cert-player-name').textContent = state.playerName;
    document.getElementById('cert-score-display').textContent = `Tổng điểm thành tích: ${state.score} XP (Đạt ${state.stars}/5 Sao)`;
    window.print();
  });
});
