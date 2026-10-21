// JAVASCRIPT CHO BÀI 40: BIỂU ĐỒ CỘT - TOÁN 6 TẬP 2

document.addEventListener('DOMContentLoaded', () => {
  // --- TRẠNG THÁI NGƯỜI CHƠI ---
  const state = {
    playerName: 'Nhà Phân Tích Cột 6',
    playerAvatar: '👨‍💼',
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
      } catch (e) {}
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
        [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = f;
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
        [220, 160].forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = f;
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
        notes.forEach((f, i) => {
          setTimeout(() => this.playTone(f, 'sine', 0.35, 0.2), i * 120);
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

    let rank = 'Thực Tập Biểu Đồ Cột';
    if (state.score >= 200) rank = 'Bậc Thầy Biểu Đồ Cột 6';
    else if (state.score >= 120) rank = 'Kỹ Sư Trực Quan Hóa Cột';
    else if (state.score >= 50) rank = 'Chuyên Viên Phân Tích Cột';
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

  // Sound toggle
  const soundBtn = document.getElementById('btn-sound-toggle');
  soundBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundBtn.textContent = state.soundEnabled ? '🔊 Âm thanh: Bật' : '🔇 Âm thanh: Tắt';
    AudioEngine.click();
  });

  // --- LAB 1: BIỂU ĐỒ CỘT THỜI GIAN TỰ HỌC CỦA AN (HÌNH 9.12) ---
  const studyCanvas = document.getElementById('study-chart-canvas');
  const studyCtx = studyCanvas.getContext('2d');
  const inputSunday = document.getElementById('input-sunday-study');
  const displaySunday = document.getElementById('display-sunday-study');
  const studyAnalysisBox = document.getElementById('study-analysis-box');

  const studyData = [
    { label: 'Thứ Hai', value: 80 },
    { label: 'Thứ Ba', value: 100 },
    { label: 'Thứ Tư', value: 60 },
    { label: 'Thứ Năm', value: 80 },
    { label: 'Thứ Sáu', value: 120 },
    { label: 'Thứ Bảy', value: 90 },
    { label: 'Chủ Nhật', value: 0 }
  ];

  function drawStudyChart() {
    const W = studyCanvas.width;
    const H = studyCanvas.height;
    studyCtx.clearRect(0, 0, W, H);

    const padLeft = 60;
    const padRight = 30;
    const padTop = 40;
    const padBottom = 55;
    const chartW = W - padLeft - padRight;
    const chartH = H - padTop - padBottom;
    const maxVal = 140;

    // 1. Tiêu đề biểu đồ
    studyCtx.fillStyle = '#1e3a8a';
    studyCtx.font = 'bold 16px sans-serif';
    studyCtx.textAlign = 'center';
    studyCtx.fillText('Thời gian tự học ở nhà của An (Hình 9.12)', W / 2, 24);

    // 2. Lưới toạ độ & Trục tung (Thời gian - phút)
    studyCtx.strokeStyle = '#e2e8f0';
    studyCtx.lineWidth = 1;
    studyCtx.font = '11px sans-serif';
    studyCtx.fillStyle = '#64748b';
    studyCtx.textAlign = 'right';

    for (let v = 0; v <= maxVal; v += 20) {
      const y = padTop + chartH - (v / maxVal) * chartH;
      studyCtx.beginPath();
      studyCtx.moveTo(padLeft, y);
      studyCtx.lineTo(W - padRight, y);
      studyCtx.stroke();

      studyCtx.fillText(v.toString(), padLeft - 8, y + 4);
    }

    // Nhãn trục tung
    studyCtx.save();
    studyCtx.translate(18, padTop + chartH / 2);
    studyCtx.rotate(-Math.PI / 2);
    studyCtx.textAlign = 'center';
    studyCtx.fillStyle = '#0284c7';
    studyCtx.font = 'bold 12px sans-serif';
    studyCtx.fillText('Thời gian (phút)', 0, 0);
    studyCtx.restore();

    // 3. Trục hoành và Trục đứng chính
    studyCtx.strokeStyle = '#334155';
    studyCtx.lineWidth = 2;
    studyCtx.beginPath();
    studyCtx.moveTo(padLeft, padTop);
    studyCtx.lineTo(padLeft, padTop + chartH);
    studyCtx.lineTo(W - padRight, padTop + chartH);
    studyCtx.stroke();

    // 4. Vẽ các cột
    const colCount = studyData.length;
    const colWidth = 42;
    const colGap = (chartW - colCount * colWidth) / (colCount + 1);

    let totalMinutes = 0;
    let maxStudyDay = studyData[0];
    let minStudyDay = studyData[0];

    studyData.forEach((item, idx) => {
      totalMinutes += item.value;
      if (item.value > maxStudyDay.value) maxStudyDay = item;
      if (item.value < minStudyDay.value) minStudyDay = item;

      const x = padLeft + colGap + idx * (colWidth + colGap);
      const h = (item.value / maxVal) * chartH;
      const y = padTop + chartH - h;

      if (item.value > 0) {
        // Gradient cho cột sapphire
        const grad = studyCtx.createLinearGradient(x, y, x + colWidth, y + h);
        if (item.label === 'Chủ Nhật') {
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(1, '#d97706');
        } else if (item.value === 120) {
          grad.addColorStop(0, '#38bdf8');
          grad.addColorStop(1, '#0284c7');
        } else {
          grad.addColorStop(0, '#60a5fa');
          grad.addColorStop(1, '#2563eb');
        }

        studyCtx.fillStyle = grad;
        studyCtx.fillRect(x, y, colWidth, h);

        // Viền cột
        studyCtx.strokeStyle = item.label === 'Chủ Nhật' ? '#b45309' : '#1d4ed8';
        studyCtx.lineWidth = 1.5;
        studyCtx.strokeRect(x, y, colWidth, h);

        // Số liệu trên đỉnh cột
        studyCtx.fillStyle = item.label === 'Chủ Nhật' ? '#b45309' : '#1e3a8a';
        studyCtx.font = 'bold 12px sans-serif';
        studyCtx.textAlign = 'center';
        studyCtx.fillText(`${item.value}p`, x + colWidth / 2, y - 6);
      }

      // Nhãn ngày dưới trục hoành
      studyCtx.fillStyle = '#1e293b';
      studyCtx.font = '11px sans-serif';
      studyCtx.textAlign = 'center';
      studyCtx.fillText(item.label, x + colWidth / 2, padTop + chartH + 18);
    });

    // 5. Cập nhật thẻ phân tích
    const sunVal = studyData[6].value;
    studyAnalysisBox.innerHTML = `
      <strong>📊 Phân Tích Dữ Liệu Thời Gian Tự Học (Bài 9.11 - 9.15):</strong><br>
      • <strong>Ngày tự học nhiều nhất:</strong> ${maxStudyDay.label} (${maxStudyDay.value} phút = ${maxStudyDay.value / 60} giờ) ➔ Cột cao nhất!<br>
      • <strong>Ngày không tự học (0 phút):</strong> ${sunVal === 0 ? 'Chủ nhật (Bài 9.12)' : 'Không có ngày nào (cả tuần đều tự học)'}.<br>
      • <strong>Tổng thời gian tự học trong tuần:</strong> <strong>${totalMinutes} phút</strong> (${Math.floor(totalMinutes / 60)} giờ ${totalMinutes % 60} phút).<br>
      ${sunVal === 50 ? '⭐ <em>Khi Chủ nhật tự học 50 phút (Bài 9.14): Tổng thời gian cả tuần tăng từ 530 phút lên đúng 580 phút!</em>' : ''}
    `;
  }

  inputSunday.addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    displaySunday.textContent = `${val} phút`;
    studyData[6].value = val;
    drawStudyChart();
    if (val === 50) {
      AudioEngine.correct();
      addScore(20);
      state.stars = Math.max(state.stars, 2);
      checkBadges();
      updateHUD();
    }
  });

  document.getElementById('btn-sunday-preset-50').addEventListener('click', () => {
    AudioEngine.click();
    inputSunday.value = 50;
    displaySunday.textContent = '50 phút';
    studyData[6].value = 50;
    drawStudyChart();
    addScore(20);
    state.stars = Math.max(state.stars, 2);
    checkBadges();
    updateHUD();
  });

  document.getElementById('btn-sunday-reset').addEventListener('click', () => {
    AudioEngine.click();
    inputSunday.value = 0;
    displaySunday.textContent = '0 phút';
    studyData[6].value = 0;
    drawStudyChart();
  });

  drawStudyChart();

  // --- LAB 2: CUỘC ĐUA TỐC ĐỘ ĐỘNG VẬT & BIỂU ĐỒ CỘT ÂM ---
  const lab2Canvas = document.getElementById('lab2-chart-canvas');
  const lab2Ctx = lab2Canvas.getContext('2d');
  const lab2AnalysisBox = document.getElementById('lab2-analysis-box');
  const btnModeAnimals = document.getElementById('btn-mode-animals');
  const btnModeProfit = document.getElementById('btn-mode-profit');

  let lab2Mode = 'animals'; // 'animals' | 'profit'

  const animalData = [
    { name: 'Mèo', speed: 30 },
    { name: 'Voi', speed: 25 },
    { name: 'Nai', speed: 45 },
    { name: 'Thỏ', speed: 35 },
    { name: 'Tuần lộc', speed: 32 },
    { name: 'Sóc', speed: 12 },
    { name: 'Gà rừng', speed: 15 },
    { name: 'Ngựa vằn', speed: 40 }
  ];

  const profitData = [
    { name: 'Tháng 1', value: -10 },
    { name: 'Tháng 2', value: -8 },
    { name: 'Tháng 3', value: 5 }
  ];

  function drawLab2Chart() {
    const W = lab2Canvas.width;
    const H = lab2Canvas.height;
    lab2Ctx.clearRect(0, 0, W, H);

    if (lab2Mode === 'animals') {
      // HÌNH 9.9: TỐC ĐỘ TỐI ĐA CỦA MỘT SỐ LOÀI ĐỘNG VẬT
      const padLeft = 60;
      const padRight = 30;
      const padTop = 40;
      const padBottom = 55;
      const chartW = W - padLeft - padRight;
      const chartH = H - padTop - padBottom;
      const maxVal = 50;

      // Tiêu đề
      lab2Ctx.fillStyle = '#1e3a8a';
      lab2Ctx.font = 'bold 15px sans-serif';
      lab2Ctx.textAlign = 'center';
      lab2Ctx.fillText('Tốc độ tối đa của một số loài động vật (Hình 9.9 - Niên giám thế giới)', W / 2, 24);

      // Lưới ngang
      lab2Ctx.strokeStyle = '#e2e8f0';
      lab2Ctx.lineWidth = 1;
      lab2Ctx.font = '11px sans-serif';
      lab2Ctx.fillStyle = '#64748b';
      lab2Ctx.textAlign = 'right';

      for (let v = 0; v <= maxVal; v += 10) {
        const y = padTop + chartH - (v / maxVal) * chartH;
        lab2Ctx.beginPath();
        lab2Ctx.moveTo(padLeft, y);
        lab2Ctx.lineTo(W - padRight, y);
        lab2Ctx.stroke();
        lab2Ctx.fillText(v.toString(), padLeft - 8, y + 4);
      }

      // Nhãn trục tung
      lab2Ctx.save();
      lab2Ctx.translate(18, padTop + chartH / 2);
      lab2Ctx.rotate(-Math.PI / 2);
      lab2Ctx.textAlign = 'center';
      lab2Ctx.fillStyle = '#0284c7';
      lab2Ctx.font = 'bold 11px sans-serif';
      lab2Ctx.fillText('Tốc độ (dặm/giờ)', 0, 0);
      lab2Ctx.restore();

      // Trục toạ độ
      lab2Ctx.strokeStyle = '#334155';
      lab2Ctx.lineWidth = 2;
      lab2Ctx.beginPath();
      lab2Ctx.moveTo(padLeft, padTop);
      lab2Ctx.lineTo(padLeft, padTop + chartH);
      lab2Ctx.lineTo(W - padRight, padTop + chartH);
      lab2Ctx.stroke();

      // Vẽ các cột
      const colWidth = 38;
      const colGap = (chartW - animalData.length * colWidth) / (animalData.length + 1);

      animalData.forEach((item, idx) => {
        const x = padLeft + colGap + idx * (colWidth + colGap);
        const h = (item.speed / maxVal) * chartH;
        const y = padTop + chartH - h;

        const grad = lab2Ctx.createLinearGradient(x, y, x + colWidth, y + h);
        if (item.name === 'Nai') {
          grad.addColorStop(0, '#f59e0b');
          grad.addColorStop(1, '#b45309');
        } else if (item.name === 'Sóc') {
          grad.addColorStop(0, '#ec4899');
          grad.addColorStop(1, '#be185d');
        } else {
          grad.addColorStop(0, '#34d399');
          grad.addColorStop(1, '#059669');
        }

        lab2Ctx.fillStyle = grad;
        lab2Ctx.fillRect(x, y, colWidth, h);

        lab2Ctx.strokeStyle = '#0f172a';
        lab2Ctx.lineWidth = 1;
        lab2Ctx.strokeRect(x, y, colWidth, h);

        lab2Ctx.fillStyle = '#0f172a';
        lab2Ctx.font = 'bold 11px sans-serif';
        lab2Ctx.textAlign = 'center';
        lab2Ctx.fillText(item.speed.toString(), x + colWidth / 2, y - 6);

        lab2Ctx.fillText(item.name, x + colWidth / 2, padTop + chartH + 18);
      });

      lab2AnalysisBox.innerHTML = `
        <strong>🐆 Khám Phá Thú Vị Về Tốc Độ Động Vật (Trang 79 - 80):</strong><br>
        • <strong>Chạy nhanh nhất:</strong> <strong>Nai (45 dặm/giờ ≈ 72,4 km/h)</strong> ➔ Cột cao nhất!<br>
        • <strong>Chạy chậm nhất trong nhóm:</strong> <strong>Sóc (12 dặm/giờ ≈ 19,3 km/h)</strong> ➔ Cột thấp nhất!<br>
        • <strong>Giải mã câu nói dân gian "Nhanh như sóc":</strong> Thực tế thỏ (35 dặm/h) chạy nhanh gấp gần 3 lần sóc (12 dặm/h). Sóc nhanh nhẹn leo trèo luồn lách nhưng chạy nước rút trên mặt đất thì chậm hơn nai và thỏ!<br>
        • <strong>Nhóm tốc độ từ 10 - 19 dặm/h:</strong> Sóc (12), Gà rừng (15).<br>
        • <strong>Nhóm tốc độ từ 40 - 49 dặm/h:</strong> Ngựa vằn (40), Nai (45).
      `;

    } else {
      // HÌNH 9.11: BIỂU ĐỒ LỢI NHUẬN CÓ SỐ ÂM (QUÝ I NĂM 2020)
      const padLeft = 70;
      const padRight = 40;
      const padTop = 45;
      const padBottom = 45;
      const chartW = W - padLeft - padRight;
      const chartH = H - padTop - padBottom;
      const zeroY = padTop + (chartH * 0.4); // Vị trí đường trục 0

      // Tiêu đề
      lab2Ctx.fillStyle = '#1e3a8a';
      lab2Ctx.font = 'bold 15px sans-serif';
      lab2Ctx.textAlign = 'center';
      lab2Ctx.fillText('Lợi nhuận Quý I năm 2020 của cửa hàng (Hình 9.11)', W / 2, 24);

      // Đường chuẩn 0 màu đỏ
      lab2Ctx.strokeStyle = '#94a3b8';
      lab2Ctx.lineWidth = 2;
      lab2Ctx.beginPath();
      lab2Ctx.moveTo(padLeft, zeroY);
      lab2Ctx.lineTo(W - padRight, zeroY);
      lab2Ctx.stroke();

      lab2Ctx.fillStyle = '#0f172a';
      lab2Ctx.font = 'bold 12px sans-serif';
      lab2Ctx.textAlign = 'right';
      lab2Ctx.fillText('0', padLeft - 8, zeroY + 4);

      // Trục tung
      [-10, -5, 0, 5].forEach(v => {
        const y = zeroY - (v / 15) * (chartH * 0.4);
        if (v !== 0) {
          lab2Ctx.strokeStyle = '#e2e8f0';
          lab2Ctx.beginPath();
          lab2Ctx.moveTo(padLeft, y);
          lab2Ctx.lineTo(W - padRight, y);
          lab2Ctx.stroke();
          lab2Ctx.fillText(`${v}`, padLeft - 8, y + 4);
        }
      });

      // Nhãn trục
      lab2Ctx.save();
      lab2Ctx.translate(20, H / 2);
      lab2Ctx.rotate(-Math.PI / 2);
      lab2Ctx.textAlign = 'center';
      lab2Ctx.fillStyle = '#c2410c';
      lab2Ctx.font = 'bold 11px sans-serif';
      lab2Ctx.fillText('Lợi nhuận (triệu đồng)', 0, 0);
      lab2Ctx.restore();

      // Vẽ các cột âm và dương
      const colWidth = 70;
      const colGap = (chartW - profitData.length * colWidth) / (profitData.length + 1);

      profitData.forEach((item, idx) => {
        const x = padLeft + colGap + idx * (colWidth + colGap);
        const h = Math.abs(item.value / 15) * (chartH * 0.4);

        if (item.value >= 0) {
          // Cột dương chúc lên trên
          const y = zeroY - h;
          lab2Ctx.fillStyle = '#10b981';
          lab2Ctx.fillRect(x, y, colWidth, h);
          lab2Ctx.fillStyle = '#047857';
          lab2Ctx.font = 'bold 13px sans-serif';
          lab2Ctx.textAlign = 'center';
          lab2Ctx.fillText(`+${item.value} tr`, x + colWidth / 2, y - 8);
        } else {
          // Cột âm chúc xuống dưới
          const y = zeroY;
          lab2Ctx.fillStyle = '#ef4444';
          lab2Ctx.fillRect(x, y, colWidth, h);
          lab2Ctx.fillStyle = '#b91c1c';
          lab2Ctx.font = 'bold 13px sans-serif';
          lab2Ctx.textAlign = 'center';
          lab2Ctx.fillText(`${item.value} tr`, x + colWidth / 2, y + h + 18);
        }

        lab2Ctx.strokeStyle = '#0f172a';
        lab2Ctx.lineWidth = 1.5;
        lab2Ctx.strokeRect(x, item.value >= 0 ? zeroY - h : zeroY, colWidth, h);

        lab2Ctx.fillStyle = '#1e293b';
        lab2Ctx.font = 'bold 12px sans-serif';
        lab2Ctx.textAlign = 'center';
        lab2Ctx.fillText(item.name, x + colWidth / 2, item.value >= 0 ? zeroY + 18 : zeroY - 10);
      });

      lab2AnalysisBox.innerHTML = `
        <strong>📉 Ý Nghĩa Của Biểu Đồ Cột Có Số Âm (Thử thách nhỏ Trang 80):</strong><br>
        • Các cột <strong>nằm phía dưới trục ngang 0</strong> thể hiện <strong>lợi nhuận âm (kinh doanh bị lỗ)</strong>: Tháng 1 lỗ 10 triệu đồng, Tháng 2 lỗ 8 triệu đồng.<br>
        • Cột <strong>vươn lên phía trên trục ngang 0</strong> thể hiện <strong>lợi nhuận dương (kinh doanh có lãi)</strong>: Tháng 3 lãi 5 triệu đồng.<br>
        • Biểu đồ bạn Minh vẽ hoàn toàn chính xác và khoa học!
      `;
    }
  }

  btnModeAnimals.addEventListener('click', () => {
    AudioEngine.click();
    lab2Mode = 'animals';
    btnModeAnimals.classList.add('active');
    btnModeAnimals.style.background = '#dbeafe';
    btnModeAnimals.style.color = 'var(--primary-dark)';
    btnModeProfit.classList.remove('active');
    btnModeProfit.style.background = 'white';
    btnModeProfit.style.color = 'var(--text-muted)';
    drawLab2Chart();
    state.stars = Math.max(state.stars, 3);
    checkBadges();
    updateHUD();
  });

  btnModeProfit.addEventListener('click', () => {
    AudioEngine.click();
    lab2Mode = 'profit';
    btnModeProfit.classList.add('active');
    btnModeProfit.style.background = '#dbeafe';
    btnModeProfit.style.color = 'var(--primary-dark)';
    btnModeAnimals.classList.remove('active');
    btnModeAnimals.style.background = 'white';
    btnModeAnimals.style.color = 'var(--text-muted)';
    drawLab2Chart();
    state.stars = Math.max(state.stars, 4);
    checkBadges();
    updateHUD();
  });

  drawLab2Chart();

  // --- SECTION 3: ĐẤU TRƯỜNG SGK ARENA (10 CÂU HỎI TRANG 77-81) ---
  const questions = [
    {
      id: 1,
      source: 'SGK Trang 81 - Bài 9.11',
      text: 'Quan sát biểu đồ Hình 9.12, ngày nào trong tuần bạn An dành thời gian tự học ở nhà nhiều nhất?',
      options: ['Thứ Sáu (120 phút)', 'Thứ Ba (100 phút)', 'Thứ Bảy (90 phút)', 'Thứ Hai (80 phút)'],
      correct: 0,
      explain: 'Cột cao nhất trong Hình 9.12 là cột ngày Thứ Sáu ứng với 120 phút (tương đương 2 tiếng đồng hồ).'
    },
    {
      id: 2,
      source: 'SGK Trang 81 - Bài 9.12',
      text: 'Quan sát biểu đồ Hình 9.12, ngày nào trong tuần bạn An không tự học ở nhà?',
      options: ['Chủ nhật (0 phút)', 'Thứ Tư', 'Thứ Bảy', 'Thứ Hai'],
      correct: 0,
      explain: 'Ngày Chủ nhật không có cột nào trên biểu đồ, điều đó có nghĩa là thời gian tự học bằng 0 phút.'
    },
    {
      id: 3,
      source: 'SGK Trang 81 - Bài 9.13',
      text: 'Tổng thời gian trong tuần An tự học ở nhà (từ Thứ Hai đến Thứ Bảy) là bao nhiêu phút?',
      options: ['530 phút', '500 phút', '480 phút', '600 phút'],
      correct: 0,
      explain: 'Tổng thời gian = 80 + 100 + 60 + 80 + 120 + 90 = 530 phút (tương đương 8 giờ 50 phút).'
    },
    {
      id: 4,
      source: 'SGK Trang 81 - Bài 9.14',
      text: 'Nếu ngày Chủ nhật An dành thêm 50 phút tự học ở nhà thì tổng thời gian tự học cả tuần của An là bao nhiêu?',
      options: ['580 phút', '550 phút', '530 phút', '620 phút'],
      correct: 0,
      explain: 'Tổng thời gian mới = 530 + 50 = 580 phút.'
    },
    {
      id: 5,
      source: 'SGK Trang 81 - Bài 9.16',
      text: 'Lớp Khoa bình chọn CLB Ngoại hạng Anh yêu thích: Man City (12 bạn), Man United (11 bạn), Liverpool (15 bạn). CLB nào được nhiều bạn hâm mộ nhất?',
      options: ['Liverpool (15 bạn)', 'Manchester City (12 bạn)', 'Manchester United (11 bạn)', 'Cả 3 bằng nhau'],
      correct: 0,
      explain: 'Liverpool có số bạn bình chọn nhiều nhất là 15 bạn (cột cao nhất).'
    },
    {
      id: 6,
      source: 'SGK Trang 81 - Bài 9.16',
      text: 'Tổng số học sinh lớp Khoa tham gia bình chọn cho 3 câu lạc bộ bóng đá trên là bao nhiêu bạn?',
      options: ['38 bạn', '35 bạn', '40 bạn', '32 bạn'],
      correct: 0,
      explain: 'Tổng số học sinh = 12 + 11 + 15 = 38 bạn.'
    },
    {
      id: 7,
      source: 'SGK Trang 81 - Bài 9.17',
      text: 'Bảng số lượng bạn thích các thể loại phim: Hành động (6), Viễn tưởng (5), Hoạt hình (12), Hài (8). Khi vẽ biểu đồ cột, cột cao nhất thuộc về thể loại nào?',
      options: ['Hoạt hình (12 bạn)', 'Hài (8 bạn)', 'Hành động (6 bạn)', 'Khoa học viễn tưởng (5 bạn)'],
      correct: 0,
      explain: 'Thể loại Hoạt hình có 12 bạn yêu thích, nhiều nhất trong 4 thể loại nên cột sẽ cao nhất.'
    },
    {
      id: 8,
      source: 'SGK Trang 79 - Hình 9.9',
      text: 'Trong biểu đồ tốc độ tối đa của các loài động vật (Hình 9.9), loài động vật nào chạy nhanh nhất?',
      options: ['Nai (45 dặm/giờ)', 'Ngựa vằn (40 dặm/giờ)', 'Thỏ (35 dặm/giờ)', 'Mèo (30 dặm/giờ)'],
      correct: 0,
      explain: 'Nai đạt tốc độ tối đa 45 dặm/giờ (tương đương hơn 72 km/h), có cột cao nhất trong biểu đồ Hình 9.9.'
    },
    {
      id: 9,
      source: 'SGK Trang 80 - Hình 9.10',
      text: 'Biểu đồ GDP Việt Nam từ 2014 đến 2017 lần lượt là: 186, 193, 205, 224 tỉ đô la. Xu hướng kinh tế Việt Nam qua biểu đồ là:',
      options: [
        'Liên tục tăng trưởng qua từng năm',
        'Liên tục giảm sút',
        'Dao động lên xuống không ổn định',
        'Không có sự thay đổi nào'
      ],
      correct: 0,
      explain: 'Chiều cao các cột từ năm 2014 đến 2017 tăng đều đặn (186 -> 193 -> 205 -> 224), thể hiện xu hướng tăng trưởng kinh tế liên tục.'
    },
    {
      id: 10,
      source: 'SGK Trang 80 - Hình 9.11',
      text: 'Trong biểu đồ lợi nhuận Quý I (Hình 9.11), các cột nằm ở phía dưới trục ngang 0 (Tháng 1 và Tháng 2) biểu thị điều gì?',
      options: [
        'Cửa hàng kinh doanh bị lỗ (lợi nhuận âm)',
        'Cửa hàng kinh doanh có lãi',
        'Cửa hàng không hoạt động',
        'Biểu đồ bị vẽ sai'
      ],
      correct: 0,
      explain: 'Cột nằm dưới trục ngang 0 thể hiện các số liệu âm, trong kinh tế ứng với lợi nhuận âm (bị lỗ).'
    }
  ];

  const questionsListElem = document.getElementById('questions-list');
  const arenaProgressText = document.getElementById('arena-progress-text');

  function renderQuestions() {
    questionsListElem.innerHTML = '';
    questions.forEach(q => {
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
