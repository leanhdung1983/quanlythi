// APP.JS - BÀI 34: ĐOẠN THẲNG. ĐỘ DÀI ĐOẠN THẲNG
// Toán 6 Tập 2 - Kết Nối Tri Thức Với Cuộc Sống (Trang 51 - 54)

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
      this.beep(750, 0.04, 'sine');
    }
  }

  const sfx = new SoundFX();

  // --- TRẠNG THÁI ỨNG DỤNG ---
  const state = {
    studentName: 'Kỹ Sư Đo Đạc Lớp 6',
    avatar: '📏',
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
    if (confirm('Em có muốn đặt lại tiến trình đo đạc và làm lại câu hỏi không?')) {
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
      hudRank.textContent = 'Đại Kiện Tướng Trắc Địa';
    } else if (state.score >= 500) {
      hudRank.textContent = 'Chuyên Gia Đo Lường';
    } else if (state.score >= 200) {
      hudRank.textContent = 'Thợ Đo Lành Nghề';
    } else {
      hudRank.textContent = 'Tập Sự Thước Kẻ';
    }
  }

  // ==========================================
  // LAB 1: CANVAS THƯỚC ĐO & ĐOẠN THẲNG
  // ==========================================
  const rulerCanvas = document.getElementById('ruler-canvas');
  const rulerCtx = rulerCanvas.getContext('2d');
  const rulerInfoBox = document.getElementById('ruler-info-box');

  const btnNormalRuler = document.getElementById('btn-normal-ruler');
  const btnBrokenRuler = document.getElementById('btn-broken-ruler');
  const btnPresetSplit = document.getElementById('btn-preset-split');
  const btnResetPoints = document.getElementById('btn-reset-points');

  let rulerMode = 'normal'; // 'normal', 'broken', 'split'

  // Ruler parameters: 1 cm = 36 pixels. Origin at x = 60px. Total 15 cm.
  const CM_PX = 36;
  const RULER_X = 50;
  const RULER_Y = 110;
  const RULER_H = 65;

  const points = [
    { label: 'A', cm: 0, color: '#d97706' },
    { label: 'B', cm: 9, color: '#2563eb' },
    { label: 'C', cm: 14, color: '#10b981' }
  ];

  let draggedPoint = null;

  function cmToPx(cm) {
    return RULER_X + cm * CM_PX;
  }

  function pxToCm(px) {
    return Math.max(0, Math.min(15, (px - RULER_X) / CM_PX));
  }

  function drawRuler() {
    rulerCtx.clearRect(0, 0, rulerCanvas.width, rulerCanvas.height);

    // 1. Draw ruler body
    const rulerWidth = 15.5 * CM_PX;

    if (rulerMode === 'broken') {
      // Broken ruler: left side jagged/broken up to 2.5 cm
      rulerCtx.fillStyle = '#fef3c7';
      rulerCtx.strokeStyle = '#d97706';
      rulerCtx.lineWidth = 2;

      rulerCtx.beginPath();
      // Jagged break line at left (around 2.5 cm = 90px)
      const breakX = RULER_X + 2.5 * CM_PX;
      rulerCtx.moveTo(breakX, RULER_Y);
      rulerCtx.lineTo(breakX + 10, RULER_Y + 15);
      rulerCtx.lineTo(breakX - 8, RULER_Y + 35);
      rulerCtx.lineTo(breakX + 12, RULER_Y + 50);
      rulerCtx.lineTo(breakX, RULER_Y + RULER_H);
      // Bottom edge
      rulerCtx.lineTo(RULER_X + rulerWidth, RULER_Y + RULER_H);
      // Right edge
      rulerCtx.lineTo(RULER_X + rulerWidth, RULER_Y);
      rulerCtx.closePath();
      rulerCtx.fill();
      rulerCtx.stroke();

      // Broken notice label
      rulerCtx.fillStyle = '#ef4444';
      rulerCtx.font = 'bold 12px sans-serif';
      rulerCtx.fillText('⚠️ Thước bị gãy mất đầu 0 cm - 2 cm (Bài 8.11)', breakX - 10, RULER_Y - 20);
    } else {
      // Normal full ruler
      rulerCtx.fillStyle = '#fef3c7';
      rulerCtx.strokeStyle = '#d97706';
      rulerCtx.lineWidth = 2;
      rulerCtx.fillRect(RULER_X - 10, RULER_Y, rulerWidth + 20, RULER_H);
      rulerCtx.strokeRect(RULER_X - 10, RULER_Y, rulerWidth + 20, RULER_H);
    }

    // 2. Draw Ticks & Numbers
    rulerCtx.strokeStyle = '#78350f';
    rulerCtx.fillStyle = '#78350f';
    rulerCtx.font = '11px sans-serif';

    const startCm = (rulerMode === 'broken') ? 3 : 0;

    for (let cm = startCm; cm <= 15; cm++) {
      const x = cmToPx(cm);

      // Centimeter tick
      rulerCtx.lineWidth = 1.8;
      rulerCtx.beginPath();
      rulerCtx.moveTo(x, RULER_Y);
      rulerCtx.lineTo(x, RULER_Y + 22);
      rulerCtx.stroke();

      // Number label
      rulerCtx.fillText(`${cm}`, x - 4, RULER_Y + 36);

      // Millimeter & half-cm ticks
      if (cm < 15) {
        for (let mm = 1; mm < 10; mm++) {
          const mmX = x + (mm * CM_PX) / 10;
          const tickH = (mm === 5) ? 14 : 7;
          rulerCtx.lineWidth = (mm === 5) ? 1.2 : 0.8;
          rulerCtx.beginPath();
          rulerCtx.moveTo(mmX, RULER_Y);
          rulerCtx.lineTo(mmX, RULER_Y + tickH);
          rulerCtx.stroke();
        }
      }
    }

    rulerCtx.font = 'bold italic 12px sans-serif';
    rulerCtx.fillText('cm', RULER_X + rulerWidth - 10, RULER_Y + 36);

    // 3. Draw measured segment(s) above ruler
    const lineY = RULER_Y - 45;

    if (rulerMode === 'split') {
      // Segment AB and BC with different colors
      const ax = cmToPx(points[0].cm);
      const bx = cmToPx(points[1].cm);
      const cx = cmToPx(points[2].cm);

      // Segment AB (Green)
      rulerCtx.strokeStyle = '#10b981';
      rulerCtx.lineWidth = 5;
      rulerCtx.beginPath();
      rulerCtx.moveTo(ax, lineY);
      rulerCtx.lineTo(bx, lineY);
      rulerCtx.stroke();

      // Segment BC (Blue)
      rulerCtx.strokeStyle = '#2563eb';
      rulerCtx.beginPath();
      rulerCtx.moveTo(bx, lineY);
      rulerCtx.lineTo(cx, lineY);
      rulerCtx.stroke();

      // Distance labels above segments
      rulerCtx.font = 'bold 12px sans-serif';
      rulerCtx.fillStyle = '#059669';
      rulerCtx.fillText(`AB = ${(points[1].cm - points[0].cm).toFixed(1)} cm`, (ax + bx) / 2 - 35, lineY - 12);

      rulerCtx.fillStyle = '#1d4ed8';
      rulerCtx.fillText(`BC = ${(points[2].cm - points[1].cm).toFixed(1)} cm`, (bx + cx) / 2 - 35, lineY - 12);
    } else {
      // Single segment AB
      const ax = cmToPx(points[0].cm);
      const bx = cmToPx(points[1].cm);

      rulerCtx.strokeStyle = '#d97706';
      rulerCtx.lineWidth = 5;
      rulerCtx.beginPath();
      rulerCtx.moveTo(ax, lineY);
      rulerCtx.lineTo(bx, lineY);
      rulerCtx.stroke();

      const len = Math.abs(points[1].cm - points[0].cm).toFixed(1);
      rulerCtx.font = 'bold 14px sans-serif';
      rulerCtx.fillStyle = '#b45309';
      rulerCtx.fillText(`Độ dài AB = ${len} cm`, (ax + bx) / 2 - 50, lineY - 14);
    }

    // 4. Draw Guide Drop Lines from points to ruler ticks
    points.forEach((p, idx) => {
      if (rulerMode !== 'split' && idx === 2) return; // Hide C when not split
      const px = cmToPx(p.cm);

      rulerCtx.strokeStyle = '#94a3b8';
      rulerCtx.lineWidth = 1.5;
      rulerCtx.setLineDash([3, 3]);
      rulerCtx.beginPath();
      rulerCtx.moveTo(px, lineY);
      rulerCtx.lineTo(px, RULER_Y);
      rulerCtx.stroke();
      rulerCtx.setLineDash([]);

      // Draw point dot
      rulerCtx.beginPath();
      rulerCtx.arc(px, lineY, 8, 0, Math.PI * 2);
      rulerCtx.fillStyle = p.color;
      rulerCtx.fill();
      rulerCtx.strokeStyle = '#ffffff';
      rulerCtx.lineWidth = 2.5;
      rulerCtx.stroke();

      // Label letter
      rulerCtx.fillStyle = '#1e1b4b';
      rulerCtx.font = 'bold 15px sans-serif';
      rulerCtx.fillText(p.label, px - 6, lineY - 15);
    });
  }

  function updateRulerInfo() {
    let html = '';
    const ab = Math.abs(points[1].cm - points[0].cm).toFixed(1);

    if (rulerMode === 'broken') {
      html = `<strong>Mô hình SGK Bài 8.11:</strong> Điểm A ở vạch <strong>${points[0].cm.toFixed(1)} cm</strong>, điểm B ở vạch <strong>${points[1].cm.toFixed(1)} cm</strong>.<br>`;
      html += `• Độ dài đoạn thẳng $AB = ${points[1].cm.toFixed(1)} - ${points[0].cm.toFixed(1)} = \\mathbf{${ab}\\text{ cm}}$.<br>`;
      html += `<span style="color:#d97706;">💡 Khi thước bị mất vạch 0, ta chỉ cần lấy số đo ở vạch đích trừ đi số đo ở vạch xuất phát!</span>`;
    } else if (rulerMode === 'split') {
      const bc = Math.abs(points[2].cm - points[1].cm).toFixed(1);
      const ac = Math.abs(points[2].cm - points[0].cm).toFixed(1);
      html = `<strong>Mô hình Tính Chất Cộng Độ Dài (Điểm B nằm giữa A và C):</strong><br>`;
      html += `• $AB = ${ab}\\text{ cm}$, $BC = ${bc}\\text{ cm}$.<br>`;
      html += `• Tổng độ dài: $AB + BC = ${ab} + ${bc} = \\mathbf{${ac}\\text{ cm}} = AC$.<br>`;
      html += `<span style="color:#10b981;">✅ Định lý được kiểm chứng hoàn toàn chính xác!</span>`;
    } else {
      html = `<strong>Đo độ dài tiêu chuẩn:</strong> Điểm A ở vạch <strong>${points[0].cm.toFixed(1)} cm</strong>, điểm B ở vạch <strong>${points[1].cm.toFixed(1)} cm</strong>.<br>`;
      html += `• Khoảng cách giữa hai điểm A và B là: <strong>${ab} cm</strong> (hoặc ${(ab * 10).toFixed(0)} mm).<br>`;
      html += `Kéo các chấm tròn để thay đổi vị trí mút trên thước đo!`;
    }

    rulerInfoBox.innerHTML = html;
  }

  // Mouse / Touch Dragging on Ruler Canvas
  function getRulerPos(e) {
    const rect = rulerCanvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return {
      x: (clientX - rect.left) * (rulerCanvas.width / rect.width),
      y: (clientY - rect.top) * (rulerCanvas.height / rect.height)
    };
  }

  rulerCanvas.addEventListener('mousedown', (e) => {
    const pos = getRulerPos(e);
    const lineY = RULER_Y - 45;
    points.forEach((p, idx) => {
      if (rulerMode !== 'split' && idx === 2) return;
      const px = cmToPx(p.cm);
      const dist = Math.hypot(pos.x - px, pos.y - lineY);
      if (dist < 18) {
        draggedPoint = p;
      }
    });
  });

  window.addEventListener('mousemove', (e) => {
    if (draggedPoint) {
      const pos = getRulerPos(e);
      let newCm = Math.round(pxToCm(pos.x) * 10) / 10; // snap to 1 mm
      if (rulerMode === 'broken' && draggedPoint.label === 'A') {
        newCm = Math.max(3, newCm); // cannot go into broken zone
      }
      draggedPoint.cm = newCm;
      drawRuler();
      updateRulerInfo();
    }
  });

  window.addEventListener('mouseup', () => {
    draggedPoint = null;
  });

  // Touch Support
  rulerCanvas.addEventListener('touchstart', (e) => {
    const pos = getRulerPos(e);
    const lineY = RULER_Y - 45;
    points.forEach((p, idx) => {
      if (rulerMode !== 'split' && idx === 2) return;
      const px = cmToPx(p.cm);
      const dist = Math.hypot(pos.x - px, pos.y - lineY);
      if (dist < 25) {
        draggedPoint = p;
      }
    });
  });

  window.addEventListener('touchmove', (e) => {
    if (draggedPoint) {
      const pos = getRulerPos(e);
      let newCm = Math.round(pxToCm(pos.x) * 10) / 10;
      if (rulerMode === 'broken' && draggedPoint.label === 'A') {
        newCm = Math.max(3, newCm);
      }
      draggedPoint.cm = newCm;
      drawRuler();
      updateRulerInfo();
    }
  });

  window.addEventListener('touchend', () => {
    draggedPoint = null;
  });

  // Mode Buttons
  btnNormalRuler.addEventListener('click', () => {
    rulerMode = 'normal';
    points[0].cm = 0;
    points[1].cm = 8.5;
    drawRuler();
    updateRulerInfo();
    sfx.click();
  });

  btnBrokenRuler.addEventListener('click', () => {
    rulerMode = 'broken';
    points[0].cm = 3; // SGK 8.11
    points[1].cm = 12; // SGK 8.11
    drawRuler();
    updateRulerInfo();
    sfx.click();
  });

  btnPresetSplit.addEventListener('click', () => {
    rulerMode = 'split';
    points[0].cm = 1;
    points[1].cm = 6;
    points[2].cm = 13;
    drawRuler();
    updateRulerInfo();
    sfx.click();
  });

  btnResetPoints.addEventListener('click', () => {
    points[0].cm = 0;
    points[1].cm = 9;
    points[2].cm = 14;
    drawRuler();
    updateRulerInfo();
    sfx.click();
  });

  drawRuler();
  updateRulerInfo();

  // ==========================================
  // LAB 2: THỰC ĐỊA BÀI TOÁN SGK
  // ==========================================
  const btnCalcTree = document.getElementById('btn-calc-tree');
  const treeResult = document.getElementById('tree-result');
  const btnCalcRoom = document.getElementById('btn-calc-room');
  const roomResult = document.getElementById('room-result');
  const btnCalcIsland = document.getElementById('btn-calc-island');
  const islandResult = document.getElementById('island-result');

  btnCalcTree.addEventListener('click', () => {
    treeResult.style.display = treeResult.style.display === 'block' ? 'none' : 'block';
    sfx.click();
  });

  btnCalcRoom.addEventListener('click', () => {
    roomResult.style.display = roomResult.style.display === 'block' ? 'none' : 'block';
    sfx.click();
  });

  btnCalcIsland.addEventListener('click', () => {
    islandResult.style.display = islandResult.style.display === 'block' ? 'none' : 'block';
    sfx.click();
  });

  // ==========================================
  // SECTION 3: ĐẤU TRƯỜNG SGK (10 CÂU HỎI BÀI 34)
  // ==========================================
  const quizQuestions = [
    {
      id: 1,
      tag: 'SGK Trang 51',
      title: 'Đoạn thẳng AB (hay đoạn thẳng BA) là hình gồm những điểm nào?',
      options: [
        'Gồm hai điểm A, B cùng với tất cả các điểm nằm giữa A và B',
        'Chỉ gồm duy nhất hai điểm A và B',
        'Gồm điểm A và tất cả các điểm nằm về một phía của A',
        'Gồm hai điểm A, B và đường thẳng kéo dài vô tận qua hai đầu'
      ],
      correct: 0,
      exp: 'Chính xác! Đoạn thẳng AB là hình gồm hai điểm A, B cùng với tất cả các điểm nằm giữa A và B. Hai điểm A, B gọi là hai đầu mút.'
    },
    {
      id: 2,
      tag: 'SGK 8.10 Trang 54',
      title: 'Dùng compa vẽ đường tròn tâm O bán kính 2 cm. Gọi M và N là hai điểm tùy ý trên đường tròn đó. Hai đoạn thẳng OM và ON có mối quan hệ gì?',
      options: [
        'Hai đoạn thẳng OM và ON bằng nhau (OM = ON = 2 cm)',
        'Đoạn thẳng OM dài gấp đôi ON',
        'Đoạn thẳng OM ngắn hơn ON',
        'Không thể so sánh được vì M và N là hai điểm tùy ý'
      ],
      correct: 0,
      exp: 'Chính xác! Mọi điểm nằm trên đường tròn đều cách tâm O một khoảng bằng bán kính. Vì vậy OM = ON = 2 cm.'
    },
    {
      id: 3,
      tag: 'SGK 8.11 Trang 54',
      title: 'Việt dùng thước đo đoạn thẳng AB. Vì thước bị gãy mất một đầu nên Việt đặt điểm A trùng với vạch 3 cm, khi đó điểm B trùng với vạch 12 cm. Em hãy giúp Việt tính độ dài đoạn thẳng AB:',
      options: [
        'AB = 9 cm (lấy 12 cm - 3 cm = 9 cm)',
        'AB = 12 cm',
        'AB = 15 cm (lấy 12 cm + 3 cm)',
        'AB = 3 cm'
      ],
      correct: 0,
      exp: 'Chính xác! Khi đầu mút không trùng với vạch 0 cm, độ dài đoạn thẳng bằng hiệu số chỉ của hai vạch: AB = 12 - 3 = 9 cm!'
    },
    {
      id: 4,
      tag: 'SGK 8.12 Trang 54',
      title: 'Nam dùng bước chân đo chiều dài lớp học từ đầu lớp đến cuối lớp được đúng 18 bước chân. Mỗi bước chân dài khoảng 0,6 m. Lớp học dài khoảng bao nhiêu mét?',
      options: [
        'Khoảng 10,8 m (lấy 18 × 0,6 = 10,8 m)',
        'Khoảng 18,6 m',
        'Khoảng 12,4 m',
        'Khoảng 30 m'
      ],
      correct: 0,
      exp: 'Chính xác! Chiều dài lớp học ước lượng là: 18 × 0,6 = 10,8 m.'
    },
    {
      id: 5,
      tag: 'SGK 8.14 Trang 54',
      title: 'Một cái cây đang mọc thẳng thì bị bão làm gãy phần ngọn. Người ta đo được phần ngọn bị gãy dài 1,75 m và phần thân còn lại dài 3 m. Trước khi bị gãy, cây cao bao nhiêu mét?',
      options: [
        '4,75 m (lấy 3 m + 1,75 m = 4,75 m)',
        '1,25 m (lấy 3 m - 1,75 m)',
        '5,25 m',
        '4,25 m'
      ],
      correct: 0,
      exp: 'Chính xác! Chiều cao ban đầu của cái cây bằng tổng chiều dài phần thân còn lại và phần ngọn bị gãy gập xuống: 3 + 1,75 = 4,75 m.'
    },
    {
      id: 6,
      tag: 'SGK Vận Dụng 1 Trang 52',
      title: 'Có 5 hòn đảo biểu thị bởi 5 điểm A, B, C, D, E. Đã có 1 cây cầu nối hai đảo A và B. Hỏi phải xây thêm ít nhất bao nhiêu cây cầu nữa để có thể đi lại giữa cả 5 hòn đảo qua những cây cầu?',
      options: [
        'Ít nhất 3 cây cầu nữa',
        'Ít nhất 4 cây cầu nữa',
        'Ít nhất 5 cây cầu nữa',
        'Ít nhất 2 cây cầu nữa'
      ],
      correct: 0,
      exp: 'Chính xác! Để kết nối liên thông 5 đỉnh ta cần ít nhất 5 - 1 = 4 cây cầu. Vì đã có 1 cây cầu nối A và B nên cần xây thêm ít nhất 4 - 1 = 3 cây cầu nữa.'
    },
    {
      id: 7,
      tag: 'Định Lý Cộng Độ Dài',
      title: 'Cho điểm M nằm giữa hai điểm P và Q. Biết PM = 4 cm và MQ = 5 cm. Độ dài đoạn thẳng PQ là bao nhiêu?',
      options: [
        'PQ = 9 cm (lấy 4 cm + 5 cm)',
        'PQ = 1 cm (lấy 5 cm - 4 cm)',
        'PQ = 20 cm (lấy 4 cm × 5 cm)',
        'PQ = 4,5 cm'
      ],
      correct: 0,
      exp: 'Chính xác! Vì M nằm giữa P và Q nên áp dụng tính chất cộng độ dài: PQ = PM + MQ = 4 + 5 = 9 cm.'
    },
    {
      id: 8,
      tag: 'Nhận Biết Điểm Nằm Giữa',
      title: 'Cho ba điểm E, F, K cùng thuộc một đường thẳng. Biết EF = 3 cm, FK = 4 cm và EK = 7 cm. Khẳng định nào sau đây là ĐÚNG?',
      options: [
        'Điểm F nằm giữa hai điểm E và K (vì EF + FK = EK = 7 cm)',
        'Điểm E nằm giữa F và K',
        'Điểm K nằm giữa E và F',
        'Không có điểm nào nằm giữa'
      ],
      correct: 0,
      exp: 'Chính xác! Ta thấy EF + FK = 3 + 4 = 7 cm = EK. Theo định lý đảo của tính chất cộng đoạn thẳng, điểm F nằm giữa hai điểm E và K!'
    },
    {
      id: 9,
      tag: 'SGK Hình 8.26 Trang 52',
      title: 'Cho hình tam giác có 3 đỉnh phân biệt A, B, C. Có tất cả bao nhiêu đoạn thẳng nối từng cặp điểm trong 3 đỉnh này?',
      options: [
        '3 đoạn thẳng (đoạn thẳng AB, BC và CA)',
        '6 đoạn thẳng',
        '1 đoạn thẳng',
        '4 đoạn thẳng'
      ],
      correct: 0,
      exp: 'Chính xác! Có 3 đoạn thẳng tạo thành các cạnh của tam giác: đoạn thẳng AB, đoạn thẳng BC và đoạn thẳng CA.'
    },
    {
      id: 10,
      tag: 'SGK 8.13 So Sánh Độ Dài',
      title: 'Cho hai đoạn thẳng: AB dài 45 mm và đoạn thẳng CD dài 5 cm. Khẳng định so sánh nào sau đây là ĐÚNG?',
      options: [
        'Đoạn thẳng AB ngắn hơn đoạn thẳng CD (AB < CD vì 45 mm < 50 mm)',
        'Đoạn thẳng AB dài hơn đoạn thẳng CD (vì 45 > 5)',
        'Hai đoạn thẳng AB và CD có độ dài bằng nhau',
        'Không thể so sánh được vì khác đơn vị'
      ],
      correct: 0,
      exp: 'Chính xác! Đổi cùng đơn vị: 5 cm = 50 mm. Vì 45 mm < 50 mm nên đoạn thẳng AB ngắn hơn đoạn thẳng CD (AB < CD).'
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
          <span style="font-size: 0.8rem; color: #b45309; background: #fef3c7; padding: 2px 8px; border-radius: 12px; height: fit-content; white-space: nowrap;">${q.tag}</span>
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
    // Badge 2: Question 3 (broken ruler) correct
    if (state.answeredQuestions[3] === 0 && !state.unlockedBadges.has(2)) {
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
