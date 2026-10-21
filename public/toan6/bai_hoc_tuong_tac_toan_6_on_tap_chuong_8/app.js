// JAVASCRIPT CHO ÔN TẬP CUỐI CHƯƠNG VIII: NHỮNG HÌNH HÌNH HỌC CƠ BẢN
// SGK TOÁN 6 - KẾT NỐI TRI THỨC VỚI CUỘC SỐNG (TRANG 67)

document.addEventListener('DOMContentLoaded', () => {
  // --- TRẠNG THÁI NGƯỜI CHƠI ---
  const state = {
    playerName: 'Hiệp Sĩ Hình Học 6',
    playerAvatar: '🧙‍♂️',
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
      this.playTone(650, 'triangle', 0.08, 0.1);
    },
    correct() {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [587.33, 739.99, 880.00, 1174.66].forEach((f, idx) => {
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

    let rank = 'Tập Sự Không Gian Phẳng';
    if (state.score >= 200) rank = 'Đại Kiện Tướng Hình Học 6';
    else if (state.score >= 120) rank = 'Chỉ Huy Trắc Địa Hoàng Gia';
    else if (state.score >= 50) rank = 'Hiệp Sĩ Hình Học';
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

  // --- LAB 1: MÁY THÁM TỬ HÌNH HỌC (HÌNH 8.55, 8.56, 8.57) ---
  const lab1Canvas = document.getElementById('lab1-canvas');
  const lab1Ctx = lab1Canvas.getContext('2d');
  const lab1Infobar = document.getElementById('lab1-infobar');
  const modeBtns = document.querySelectorAll('.mode-tab-btn');

  let lab1Mode = '855'; // '855' | '856' | '857'
  let draggingPoint = null;

  // Dữ liệu toạ độ cho các chế độ
  const data855 = {
    lineD: { x1: 50, y1: 70, x2: 320, y2: 170, label: 'd' },
    lineM: { x1: 370, y1: 160, x2: 600, y2: 160, label: 'm' },
    ptA: { x: 120, y: 160, label: 'A', name: 'A' },
    ptC: { x: 190, y: 122, label: 'C', name: 'C' }, // nằm trên d
    ptB: { x: 260, y: 100, label: 'B', name: 'B' },
    ptD: { x: 420, y: 160, label: 'D', name: 'D' }, // nằm trên m
    ptE: { x: 540, y: 160, label: 'E', name: 'E' }, // nằm trên m
    ptF: { x: 450, y: 80, label: 'F', name: 'F' }
  };

  const data856 = {
    lineY: 160,
    ptA: { x: 150, y: 160, label: 'A' },
    ptB: { x: 320, y: 160, label: 'B' },
    ptC: { x: 500, y: 160, label: 'C' }
  };

  const data857 = {
    ox: 325,
    oy: 250,
    rayLen: 220,
    ptB: { x: 450, y: 140, label: 'B' } // B nằm trong góc yOz
  };

  function renderLab1() {
    const W = lab1Canvas.width;
    const H = lab1Canvas.height;
    lab1Ctx.clearRect(0, 0, W, H);

    if (lab1Mode === '855') {
      // HÌNH 8.55 (SGK Trang 67)
      // Đường thẳng d
      lab1Ctx.strokeStyle = '#0284c7';
      lab1Ctx.lineWidth = 2.5;
      lab1Ctx.beginPath();
      lab1Ctx.moveTo(data855.lineD.x1, data855.lineD.y1);
      lab1Ctx.lineTo(data855.lineD.x2, data855.lineD.y2);
      lab1Ctx.stroke();
      lab1Ctx.fillStyle = '#0284c7';
      lab1Ctx.font = 'bold 16px sans-serif';
      lab1Ctx.fillText('d', data855.lineD.x1 + 10, data855.lineD.y1 - 10);

      // Đường thẳng m
      lab1Ctx.strokeStyle = '#059669';
      lab1Ctx.lineWidth = 2.5;
      lab1Ctx.beginPath();
      lab1Ctx.moveTo(data855.lineM.x1, data855.lineM.y1);
      lab1Ctx.lineTo(data855.lineM.x2, data855.lineM.y2);
      lab1Ctx.stroke();
      lab1Ctx.fillStyle = '#059669';
      lab1Ctx.fillText('m', data855.lineM.x1 + 10, data855.lineM.y1 - 10);

      // Vẽ các điểm
      const pts = [
        { pt: data855.ptA, color: '#ef4444' },
        { pt: data855.ptC, color: '#0284c7' },
        { pt: data855.ptB, color: '#ef4444' },
        { pt: data855.ptD, color: '#059669' },
        { pt: data855.ptE, color: '#059669' },
        { pt: data855.ptF, color: '#ef4444' }
      ];

      pts.forEach(({ pt, color }) => {
        lab1Ctx.beginPath();
        lab1Ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        lab1Ctx.fillStyle = color;
        lab1Ctx.fill();
        lab1Ctx.strokeStyle = 'white';
        lab1Ctx.lineWidth = 2;
        lab1Ctx.stroke();

        lab1Ctx.fillStyle = '#0f172a';
        lab1Ctx.font = 'bold 15px sans-serif';
        lab1Ctx.fillText(pt.label, pt.x + 8, pt.y - 8);
      });

      lab1Infobar.innerHTML = `
        <strong>🔍 Khảo sát Hình 8.55 (Bài 8.39):</strong><br>
        • Điểm $C \\in d$; hai điểm $A \\notin d$ và $B \\notin d$.<br>
        • Ba điểm $A, B, C$ <strong>không thẳng hàng</strong> (không cùng nằm trên bất kỳ đường thẳng nào).<br>
        • Điểm $F \\notin m$; hai điểm $D, E \\in m$. Ba điểm $D, E, F$ <strong>không thẳng hàng</strong>.
      `;

    } else if (lab1Mode === '856') {
      // HÌNH 8.56 (SGK Trang 67)
      const y = data856.lineY;

      // Đường thẳng chứa 3 điểm A, B, C
      lab1Ctx.strokeStyle = '#7c3aed';
      lab1Ctx.lineWidth = 3;
      lab1Ctx.beginPath();
      lab1Ctx.moveTo(40, y);
      lab1Ctx.lineTo(610, y);
      lab1Ctx.stroke();

      // Vẽ các đoạn AB, BC bằng thanh màu phía trên
      lab1Ctx.strokeStyle = '#f59e0b';
      lab1Ctx.lineWidth = 4;
      lab1Ctx.beginPath();
      lab1Ctx.moveTo(data856.ptA.x, y - 25);
      lab1Ctx.lineTo(data856.ptB.x, y - 25);
      lab1Ctx.stroke();
      lab1Ctx.fillStyle = '#b45309';
      lab1Ctx.font = 'bold 12px sans-serif';
      lab1Ctx.fillText(`Đoạn AB: ${Math.round((data856.ptB.x - data856.ptA.x) / 50 * 10) / 10} cm`, (data856.ptA.x + data856.ptB.x) / 2 - 40, y - 35);

      lab1Ctx.strokeStyle = '#10b981';
      lab1Ctx.lineWidth = 4;
      lab1Ctx.beginPath();
      lab1Ctx.moveTo(data856.ptB.x, y - 25);
      lab1Ctx.lineTo(data856.ptC.x, y - 25);
      lab1Ctx.stroke();
      lab1Ctx.fillStyle = '#047857';
      lab1Ctx.fillText(`Đoạn BC: ${Math.round((data856.ptC.x - data856.ptB.x) / 50 * 10) / 10} cm`, (data856.ptB.x + data856.ptC.x) / 2 - 40, y - 35);

      // Vẽ các điểm A, B, C
      [data856.ptA, data856.ptB, data856.ptC].forEach(pt => {
        lab1Ctx.beginPath();
        lab1Ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
        lab1Ctx.fillStyle = pt.label === 'B' ? '#f59e0b' : '#7c3aed';
        lab1Ctx.fill();
        lab1Ctx.strokeStyle = 'white';
        lab1Ctx.lineWidth = 2.5;
        lab1Ctx.stroke();

        lab1Ctx.fillStyle = '#0f172a';
        lab1Ctx.font = 'bold 16px sans-serif';
        lab1Ctx.fillText(pt.label, pt.x - 5, pt.y + 25);
      });

      lab1Infobar.innerHTML = `
        <strong>🔍 Khảo sát Hình 8.56 (Bài 8.40):</strong><br>
        • Ba điểm $A, B, C$ <strong>thẳng hàng</strong> và điểm $B$ <strong>nằm giữa</strong> hai điểm $A$ và $C$.<br>
        • Hai tia $BA$ và $BC$ là <strong>hai tia đối nhau</strong> (chung gốc $B$, hướng về hai phía ngược nhau).<br>
        • Ba đoạn thẳng $AB, BC, AC$ thỏa mãn công thức vàng: <strong>$AB + BC = AC$</strong>. 
        <em>(Bạn có thể kéo điểm B sang trái/phải để quan sát trực tiếp!)</em>
      `;

    } else if (lab1Mode === '857') {
      // HÌNH 8.57 (SGK Trang 67)
      const { ox, oy, rayLen, ptB } = data857;

      // Đường thẳng xy (ngang)
      lab1Ctx.strokeStyle = '#7c3aed';
      lab1Ctx.lineWidth = 3;
      lab1Ctx.beginPath();
      lab1Ctx.moveTo(ox - rayLen, oy);
      lab1Ctx.lineTo(ox + rayLen, oy);
      lab1Ctx.stroke();

      lab1Ctx.fillStyle = '#7c3aed';
      lab1Ctx.font = 'bold 16px sans-serif';
      lab1Ctx.fillText('x', ox - rayLen - 15, oy + 5);
      lab1Ctx.fillText('y', ox + rayLen + 10, oy + 5);

      // Tia Oz thẳng đứng (Oz vuông góc xy)
      lab1Ctx.strokeStyle = '#7c3aed';
      lab1Ctx.lineWidth = 3;
      lab1Ctx.beginPath();
      lab1Ctx.moveTo(ox, oy);
      lab1Ctx.lineTo(ox, oy - rayLen);
      lab1Ctx.stroke();
      lab1Ctx.fillText('z', ox - 5, oy - rayLen - 10);

      // Ký hiệu góc vuông tại O (giữa Oz và Oy)
      lab1Ctx.strokeStyle = '#10b981';
      lab1Ctx.lineWidth = 2;
      lab1Ctx.strokeRect(ox, oy - 20, 20, 20);

      // Tia OB (kết nối O với điểm B)
      lab1Ctx.strokeStyle = '#ef4444';
      lab1Ctx.lineWidth = 2.5;
      lab1Ctx.beginPath();
      lab1Ctx.moveTo(ox, oy);
      lab1Ctx.lineTo(ptB.x, ptB.y);
      lab1Ctx.stroke();

      // Cung góc xOB
      const angleRad = Math.atan2(oy - ptB.y, ptB.x - ox);
      const angleDeg = Math.round((180 - angleRad * (180 / Math.PI)));

      lab1Ctx.beginPath();
      lab1Ctx.arc(ox, oy, 50, Math.PI, -angleRad, false);
      lab1Ctx.strokeStyle = '#ea580c';
      lab1Ctx.lineWidth = 2.5;
      lab1Ctx.stroke();
      lab1Ctx.fillStyle = '#ea580c';
      lab1Ctx.font = 'bold 14px sans-serif';
      lab1Ctx.fillText(`${angleDeg}°`, ox - 45, oy - 35);

      // Điểm O và B
      lab1Ctx.beginPath();
      lab1Ctx.arc(ox, oy, 6, 0, Math.PI * 2);
      lab1Ctx.fillStyle = '#7c3aed';
      lab1Ctx.fill();
      lab1Ctx.fillText('O', ox - 5, oy + 25);

      lab1Ctx.beginPath();
      lab1Ctx.arc(ptB.x, ptB.y, 8, 0, Math.PI * 2);
      lab1Ctx.fillStyle = '#ef4444';
      lab1Ctx.fill();
      lab1Ctx.strokeStyle = 'white';
      lab1Ctx.lineWidth = 2;
      lab1Ctx.stroke();
      lab1Ctx.fillText('B', ptB.x + 10, ptB.y);

      lab1Infobar.innerHTML = `
        <strong>🔍 Khảo sát Hình 8.57 (Bài 8.43):</strong><br>
        • Hai tia đối nhau: <strong>Ox và Oy</strong>.<br>
        • Hai góc vuông: <strong>$\\widehat{xOz} = 90^\\circ$</strong> và <strong>$\\widehat{yOz} = 90^\\circ$</strong>; Một góc bẹt: <strong>$\\widehat{xOy} = 180^\\circ$</strong>.<br>
        • Khi điểm $B$ nằm trong góc vuông $yOz$ ($0^\\circ < \\widehat{yOB} < 90^\\circ$), thì: 
        $\\widehat{xOB} = \\widehat{xOz} + \\widehat{zOB} = 90^\\circ + \\widehat{zOB} = ${angleDeg}^\\circ$ ➔ <strong>GÓC TÙ</strong>! 
        <em>(Bạn có thể kéo điểm B trong góc yOz để quan sát góc xOB luôn là góc tù).</em>
      `;
    }
  }

  modeBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      AudioEngine.click();
      modeBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      lab1Mode = btn.getAttribute('data-mode');
      renderLab1();
      state.stars = Math.max(state.stars, 4);
      checkBadges();
      updateHUD();
    });
  });

  // Tương tác kéo thả điểm trên Lab 1
  lab1Canvas.addEventListener('mousedown', (e) => {
    const rect = lab1Canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (lab1Mode === '856') {
      const d = Math.hypot(x - data856.ptB.x, y - data856.ptB.y);
      if (d < 25) draggingPoint = '856_B';
    } else if (lab1Mode === '857') {
      const d = Math.hypot(x - data857.ptB.x, y - data857.ptB.y);
      if (d < 25) draggingPoint = '857_B';
    }
  });

  window.addEventListener('mousemove', (e) => {
    if (!draggingPoint) return;
    const rect = lab1Canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (draggingPoint === '856_B') {
      data856.ptB.x = Math.max(data856.ptA.x + 20, Math.min(data856.ptC.x - 20, x));
      renderLab1();
    } else if (draggingPoint === '857_B') {
      const ox = data857.ox;
      const oy = data857.oy;
      // Giới hạn B nằm trong góc yOz (x > ox, y < oy)
      data857.ptB.x = Math.max(ox + 15, Math.min(ox + 180, x));
      data857.ptB.y = Math.max(oy - 180, Math.min(oy - 15, y));
      renderLab1();
    }
  });

  window.addEventListener('mouseup', () => {
    if (draggingPoint) {
      draggingPoint = null;
      AudioEngine.click();
    }
  });

  renderLab1();

  // --- LAB 2: SA BÀN ĐO ĐẠC HÌNH THANG (8.42) & TRUNG ĐIỂM (8.41) ---
  const lab2Canvas = document.getElementById('lab2-canvas');
  const lab2Ctx = lab2Canvas.getContext('2d');
  const lab2Infobar = document.getElementById('lab2-infobar');

  let showMidpointTask = false;
  let activeTrapezoidAngle = null;

  const trapezoid = {
    A: { x: 210, y: 70, label: 'A', angle: 118, type: 'Góc tù' },
    B: { x: 440, y: 70, label: 'B', angle: 115, type: 'Góc tù' },
    C: { x: 530, y: 230, label: 'C', angle: 65, type: 'Góc nhọn' },
    D: { x: 120, y: 230, label: 'D', angle: 62, type: 'Góc nhọn' }
  };

  function renderLab2() {
    const W = lab2Canvas.width;
    const H = lab2Canvas.height;
    lab2Ctx.clearRect(0, 0, W, H);

    if (!showMidpointTask) {
      // HÌNH THANG ABCD (Bài 8.42)
      lab2Ctx.strokeStyle = '#5b21b6';
      lab2Ctx.lineWidth = 3;
      lab2Ctx.fillStyle = 'rgba(237, 233, 254, 0.45)';

      lab2Ctx.beginPath();
      lab2Ctx.moveTo(trapezoid.A.x, trapezoid.A.y);
      lab2Ctx.lineTo(trapezoid.B.x, trapezoid.B.y);
      lab2Ctx.lineTo(trapezoid.C.x, trapezoid.C.y);
      lab2Ctx.lineTo(trapezoid.D.x, trapezoid.D.y);
      lab2Ctx.closePath();
      lab2Ctx.fill();
      lab2Ctx.stroke();

      // Vẽ các đỉnh A, B, C, D
      Object.keys(trapezoid).forEach(key => {
        const pt = trapezoid[key];
        const isActive = activeTrapezoidAngle === key;

        lab2Ctx.beginPath();
        lab2Ctx.arc(pt.x, pt.y, 6, 0, Math.PI * 2);
        lab2Ctx.fillStyle = isActive ? '#f59e0b' : '#7c3aed';
        lab2Ctx.fill();
        lab2Ctx.strokeStyle = 'white';
        lab2Ctx.lineWidth = 2;
        lab2Ctx.stroke();

        lab2Ctx.fillStyle = '#0f172a';
        lab2Ctx.font = 'bold 16px sans-serif';
        const offsetY = (key === 'A' || key === 'B') ? -12 : 22;
        const offsetX = (key === 'A' || key === 'D') ? -18 : 10;
        lab2Ctx.fillText(pt.label, pt.x + offsetX, pt.y + offsetY);

        // Nếu đỉnh được chọn đo, vẽ thước đo góc / cung góc
        if (isActive) {
          lab2Ctx.save();
          lab2Ctx.beginPath();
          lab2Ctx.arc(pt.x, pt.y, 32, 0, Math.PI * 2);
          lab2Ctx.strokeStyle = '#f59e0b';
          lab2Ctx.lineWidth = 3;
          lab2Ctx.stroke();

          lab2Ctx.fillStyle = '#b45309';
          lab2Ctx.font = 'bold 13px sans-serif';
          lab2Ctx.fillText(`${pt.angle}° (${pt.type})`, pt.x + offsetX, pt.y + offsetY + (key === 'A' || key === 'B' ? -15 : 18));
          lab2Ctx.restore();
        }
      });

      if (activeTrapezoidAngle) {
        const cur = trapezoid[activeTrapezoidAngle];
        lab2Infobar.innerHTML = `
          <strong>📏 Kết quả đo góc đỉnh ${cur.label}:</strong> Số đo xấp xỉ <strong>${cur.angle}°</strong> ➔ 
          <span style="color:${cur.type === 'Góc nhọn' ? '#0284c7' : '#d97706'}; font-weight:800; font-size:1.05rem;">
            ${cur.type.toUpperCase()}
          </span>.<br>
          • <strong>Hai góc nhọn:</strong> $\\widehat{D} \\approx 62^\\circ$ và $\\widehat{C} \\approx 65^\\circ$ (thuộc đáy lớn $CD$).<br>
          • <strong>Hai góc tù:</strong> $\\widehat{A} \\approx 118^\\circ$ và $\\widehat{B} \\approx 115^\\circ$ (thuộc đáy nhỏ $AB$).
        `;
      } else {
        lab2Infobar.innerHTML = `
          Nhấn các nút <strong>"Đo Đỉnh A, B, C, D"</strong> bên trên để quan sát số đo và phân loại chính xác các góc nhọn, góc tù của hình thang $ABCD$ (Bài 8.42)!
        `;
      }

    } else {
      // BÀI TOÁN TRUNG ĐIỂM ĐOẠN THẲNG MN = 7 CM (Bài 8.41)
      const startX = 150;
      const startY = 130;
      const totalLen = 350; // 7cm * 50px/cm
      const midX = startX + totalLen / 2; // 3.5cm = 175px

      // Thước kẻ milimét ảo
      lab2Ctx.fillStyle = '#fef3c7';
      lab2Ctx.fillRect(startX - 20, startY + 20, totalLen + 40, 50);
      lab2Ctx.strokeStyle = '#d97706';
      lab2Ctx.lineWidth = 2;
      lab2Ctx.strokeRect(startX - 20, startY + 20, totalLen + 40, 50);

      // Vạch chia cm trên thước
      lab2Ctx.font = '11px sans-serif';
      lab2Ctx.textAlign = 'center';
      for (let cm = 0; cm <= 7; cm++) {
        const vx = startX + cm * 50;
        lab2Ctx.beginPath();
        lab2Ctx.moveTo(vx, startY + 20);
        lab2Ctx.lineTo(vx, startY + 40);
        lab2Ctx.strokeStyle = '#92400e';
        lab2Ctx.lineWidth = 1.8;
        lab2Ctx.stroke();

        lab2Ctx.fillStyle = '#92400e';
        lab2Ctx.fillText(cm.toString(), vx, startY + 55);

        // Vạch nửa cm (0.5cm)
        if (cm < 7) {
          lab2Ctx.beginPath();
          lab2Ctx.moveTo(vx + 25, startY + 20);
          lab2Ctx.lineTo(vx + 25, startY + 32);
          lab2Ctx.strokeStyle = '#b45309';
          lab2Ctx.lineWidth = 1;
          lab2Ctx.stroke();
        }
      }

      // Đoạn thẳng MN
      lab2Ctx.strokeStyle = '#7c3aed';
      lab2Ctx.lineWidth = 5;
      lab2Ctx.lineCap = 'round';
      lab2Ctx.beginPath();
      lab2Ctx.moveTo(startX, startY);
      lab2Ctx.lineTo(startX + totalLen, startY);
      lab2Ctx.stroke();

      // Điểm M, N, I
      const pts = [
        { x: startX, label: 'M (0cm)', color: '#7c3aed' },
        { x: midX, label: 'I (Trung điểm 3,5cm)', color: '#ef4444' },
        { x: startX + totalLen, label: 'N (7cm)', color: '#7c3aed' }
      ];

      pts.forEach(p => {
        lab2Ctx.beginPath();
        lab2Ctx.arc(p.x, startY, 7, 0, Math.PI * 2);
        lab2Ctx.fillStyle = p.color;
        lab2Ctx.fill();
        lab2Ctx.strokeStyle = 'white';
        lab2Ctx.lineWidth = 2;
        lab2Ctx.stroke();

        lab2Ctx.fillStyle = p.color;
        lab2Ctx.font = 'bold 14px sans-serif';
        lab2Ctx.fillText(p.label, p.x, startY - 14);
      });

      lab2Infobar.innerHTML = `
        <strong>📏 Lời giải thực hành Bài 8.41 (SGK Trang 67):</strong><br>
        • Đoạn thẳng $MN = 7\\text{ cm}$.<br>
        • Vì $I$ là trung điểm của đoạn thẳng $MN$ nên điểm $I$ nằm giữa $M, N$ và cách đều hai mút:<br>
        <strong>$MI = IN = \\frac{MN}{2} = \\frac{7}{2} = 3,5\\text{ cm}$</strong>.<br>
        • Cách vẽ: Dùng thước thẳng có vạch chia, đặt vạch $0\\text{ cm}$ trùng điểm $M$, đánh dấu điểm $I$ tại vạch $3,5\\text{ cm}$!
      `;
    }
  }

  document.getElementById('btn-measure-A').addEventListener('click', () => { AudioEngine.click(); showMidpointTask = false; activeTrapezoidAngle = 'A'; renderLab2(); state.stars = Math.max(state.stars, 3); checkBadges(); updateHUD(); });
  document.getElementById('btn-measure-B').addEventListener('click', () => { AudioEngine.click(); showMidpointTask = false; activeTrapezoidAngle = 'B'; renderLab2(); state.stars = Math.max(state.stars, 3); checkBadges(); updateHUD(); });
  document.getElementById('btn-measure-C').addEventListener('click', () => { AudioEngine.click(); showMidpointTask = false; activeTrapezoidAngle = 'C'; renderLab2(); state.stars = Math.max(state.stars, 3); checkBadges(); updateHUD(); });
  document.getElementById('btn-measure-D').addEventListener('click', () => { AudioEngine.click(); showMidpointTask = false; activeTrapezoidAngle = 'D'; renderLab2(); state.stars = Math.max(state.stars, 3); checkBadges(); updateHUD(); });
  document.getElementById('btn-lab2-toggle-midpoint').addEventListener('click', () => {
    AudioEngine.click();
    showMidpointTask = !showMidpointTask;
    renderLab2();
    state.stars = Math.max(state.stars, 2);
    checkBadges();
    updateHUD();
  });

  renderLab2();

  // --- SECTION 3: ĐẤU TRƯỜNG SGK ARENA (10 CÂU HỎI TRANG 67) ---
  const questions = [
    {
      id: 1,
      source: 'SGK Trang 67 - Bài 8.39a',
      text: 'Quan sát Hình 8.55, khẳng định nào sau đây là khẳng định ĐÚNG?',
      options: [
        'Điểm C thuộc d, hai điểm A và B không thuộc d',
        'Cả ba điểm A, B, C đều thuộc đường thẳng d',
        'Điểm A thuộc d, điểm C không thuộc d',
        'Hai điểm A và B thuộc d'
      ],
      correct: 0,
      explain: 'Trong Hình 8.55, đường thẳng d chỉ đi qua điểm C (C ∈ d), còn hai điểm A và B nằm ngoài d (A ∉ d, B ∉ d).'
    },
    {
      id: 2,
      source: 'SGK Trang 67 - Bài 8.39b,d',
      text: 'Trong Hình 8.55, nhận xét nào sau đây về tính thẳng hàng là ĐÚNG?',
      options: [
        'Ba điểm A, B, C không thẳng hàng; ba điểm D, E, F không thẳng hàng',
        'Ba điểm A, B, C thẳng hàng',
        'Ba điểm D, E, F thẳng hàng',
        'Điểm F thuộc đường thẳng m'
      ],
      correct: 0,
      explain: 'Vì ba điểm A, B, C không cùng thuộc một đường thẳng nên chúng không thẳng hàng. Tương tự F nằm ngoài đường thẳng m chứa D và E nên D, E, F không thẳng hàng.'
    },
    {
      id: 3,
      source: 'SGK Trang 67 - Bài 8.40a',
      text: 'Hình 8.56 biểu diễn đường thẳng chứa 3 điểm A, B, C theo thứ tự. Ba điểm A, B, C có quan hệ gì?',
      options: [
        'Ba điểm A, B, C thẳng hàng và B nằm giữa A và C',
        'Ba điểm A, B, C không thẳng hàng',
        'Điểm A nằm giữa B và C',
        'Điểm C nằm giữa A và B'
      ],
      correct: 0,
      explain: 'Ba điểm A, B, C cùng nằm trên một đường thẳng nên chúng thẳng hàng. Điểm B nằm trong khoảng giữa A và C nên B nằm giữa hai điểm A và C.'
    },
    {
      id: 4,
      source: 'SGK Trang 67 - Bài 8.40b',
      text: 'Trong Hình 8.56 (điểm B nằm giữa A và C), hai tia BA và BC là hai tia:',
      options: [
        'Hai tia đối nhau',
        'Hai tia trùng nhau',
        'Hai tia vuông góc',
        'Hai tia phân biệt không chung gốc'
      ],
      correct: 0,
      explain: 'Hai tia BA và BC chung gốc B và tạo thành một đường thẳng nên chúng là hai tia đối nhau.'
    },
    {
      id: 5,
      source: 'SGK Trang 67 - Bài 8.40c',
      text: 'Trong Hình 8.56, mối quan hệ giữa độ dài ba đoạn thẳng AB, BC và AC được biểu diễn bởi hệ thức nào?',
      options: [
        'AB + BC = AC',
        'AB + AC = BC',
        'BC + AC = AB',
        'AB = BC = AC'
      ],
      correct: 0,
      explain: 'Định lý cơ bản: Nếu điểm B nằm giữa hai điểm A và C thì AB + BC = AC.'
    },
    {
      id: 6,
      source: 'SGK Trang 67 - Bài 8.41',
      text: 'Cho đoạn thẳng MN dài 7 cm. Trung điểm I của đoạn thẳng MN cách điểm đầu mút M một khoảng bằng:',
      options: [
        '3,5 cm',
        '3 cm',
        '4 cm',
        '14 cm'
      ],
      correct: 0,
      explain: 'Vì I là trung điểm của MN nên: MI = IN = MN : 2 = 7 : 2 = 3,5 cm.'
    },
    {
      id: 7,
      source: 'SGK Trang 67 - Bài 8.42a',
      text: 'Trong hình thang ABCD (với đáy nhỏ AB và đáy lớn CD), hình vẽ có tất cả bao nhiêu góc ở các đỉnh?',
      options: [
        '4 góc: ∠DAB, ∠ABC, ∠BCD, ∠CDA',
        '2 góc đáy lớn',
        '3 góc',
        '6 góc'
      ],
      correct: 0,
      explain: 'Hình thang ABCD là một tứ giác có 4 đỉnh nên có 4 góc trong tương ứng: góc A, góc B, góc C, góc D.'
    },
    {
      id: 8,
      source: 'SGK Trang 67 - Bài 8.42b',
      text: 'Quan sát và đo đạc hình thang ABCD trong SGK Hình 8.56b/8.42, hai góc nhọn của hình thang là:',
      options: [
        'Góc ∠CDA (đỉnh D) và góc ∠BCD (đỉnh C)',
        'Góc ∠DAB (đỉnh A) và góc ∠ABC (đỉnh B)',
        'Góc ∠DAB và góc ∠CDA',
        'Góc ∠ABC và góc ∠BCD'
      ],
      correct: 0,
      explain: 'Hai góc ở đáy lớn CD là góc D (khoảng 62°) và góc C (khoảng 65°) đều nhỏ hơn 90°, nên đây là hai góc nhọn. Hai góc ở đáy nhỏ AB là hai góc tù (> 90°).'
    },
    {
      id: 9,
      source: 'SGK Trang 67 - Bài 8.43a,b',
      text: 'Cho Hình 8.57, tia Oz vuông góc với đường thẳng xy tại O. Hai tia nào đối nhau và có bao nhiêu góc vuông?',
      options: [
        'Ox và Oy đối nhau; có 2 góc vuông (∠xOz và ∠yOz)',
        'Ox và Oz đối nhau; có 1 góc vuông',
        'Oy và Oz đối nhau; có 2 góc vuông',
        'Không có tia đối nhau nào'
      ],
      correct: 0,
      explain: 'Đường thẳng xy đi qua O nên Ox và Oy là hai tia đối nhau. Tia Oz ⊥ xy tạo ra 2 góc vuông là ∠xOz = 90° và ∠yOz = 90°.'
    },
    {
      id: 10,
      source: 'SGK Trang 67 - Bài 8.43c',
      text: 'Trong Hình 8.57, nếu lấy điểm B nằm bên trong góc yOz thì góc ∠xOB thuộc loại góc nào?',
      options: [
        'Góc tù',
        'Góc nhọn',
        'Góc vuông',
        'Góc bẹt'
      ],
      correct: 0,
      explain: 'Vì tia Oz nằm giữa hai tia Ox và OB nên ∠xOB = ∠xOz + ∠zOB = 90° + ∠zOB. Vì B nằm trong góc vuông yOz nên 0° < ∠zOB < 90°, suy ra 90° < ∠xOB < 180°. Do đó ∠xOB là GÓC TÙ!'
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
          💡 <strong>Lời giải chuẩn SGK:</strong> ${q.explain}
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

  // --- IN GIẤY KHEN A4 ---
  const btnPrintCert = document.getElementById('btn-print-certificate');
  btnPrintCert.addEventListener('click', () => {
    AudioEngine.click();
    document.getElementById('cert-player-name').textContent = state.playerName;
    document.getElementById('cert-score-display').textContent = `Tổng điểm thành tích: ${state.score} XP (Đạt ${state.stars}/5 Sao)`;
    window.print();
  });
});
