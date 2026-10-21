/* =========================================================
   BÀI 20: CHU VI VÀ DIỆN TÍCH CỦA MỘT SỐ TỨ GIÁC ĐÃ HỌC
   Logic & Mini-game Engine - Toán 6 Kết Nối Tri Thức
   ========================================================= */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIZER ---
  let audioCtx = null;
  let soundEnabled = true;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playTone(freq, duration, type = 'sine', gainVal = 0.15) {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainVal, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  function playSuccessSound() {
    playTone(523.25, 0.12, 'sine', 0.2);
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.2), 100);
    setTimeout(() => playTone(783.99, 0.25, 'triangle', 0.25), 220);
  }

  function playErrorSound() {
    playTone(220, 0.2, 'sawtooth', 0.2);
    setTimeout(() => playTone(185, 0.3, 'sawtooth', 0.25), 150);
  }

  function playFanfareSound() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 0.25, 'triangle', 0.25), idx * 120);
    });
  }

  // --- APPLICATION STATE ---
  const STORAGE_KEY = 'toan6_bai20_progress';

  let state = {
    studentName: 'Kỹ Sư Trắc Địa Lớp 6',
    avatar: '🏡',
    score: 0,
    stars: 0,
    streak: 0,
    maxStreak: 0,
    sound: true,
    badges: [false, false, false, false, false],
    answeredQuestions: {},
    calculatorShape: 'parallelogram',
    cutState: 'normal', // 'normal' | 'cut' | 'slid'
    usedShapes: { parallelogram: true, rhombus: false, trapezoid: false }
  };

  function loadState() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        state = { ...state, ...parsed };
      }
    } catch (e) {
      console.warn('Cannot read localStorage', e);
    }
  }

  function saveState() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.warn('Cannot save localStorage', e);
    }
  }

  // --- QUIZ DATA (SGK BT 4.16 - 4.22) ---
  const quizData = [
    {
      id: 1,
      source: 'SGK BT 4.16 (Diện tích hình bình hành)',
      question: 'Một mảnh vườn hình bình hành có độ dài một cạnh đáy bằng 15 m và chiều cao tương ứng bằng 8 m. Diện tích của mảnh vườn đó là:',
      options: [
        'A. 120 m²',
        'B. 60 m²',
        'C. 46 m²',
        'D. 23 m²'
      ],
      correct: 0,
      explanation: 'Diện tích hình bình hành bằng: S = a × h = 15 × 8 = 120 (m²).'
    },
    {
      id: 2,
      source: 'SGK BT 4.17 (Diện tích hình thoi)',
      question: 'Một tấm biển quảng cáo hình thoi có độ dài hai đường chéo lần lượt là 10 dm và 14 dm. Diện tích của tấm biển đó là:',
      options: [
        'A. 70 dm²',
        'B. 140 dm²',
        'C. 24 dm²',
        'D. 48 dm²'
      ],
      correct: 0,
      explanation: 'Diện tích hình thoi bằng: S = (m × n) : 2 = (10 × 14) : 2 = 70 (dm²).'
    },
    {
      id: 3,
      source: 'SGK BT 4.18 (Diện tích hình thang cân)',
      question: 'Một thửa ruộng hình thang cân có độ dài hai đáy lần lượt là 8 m và 12 m, khoảng cách giữa hai đáy (chiều cao) là 5 m. Diện tích thửa ruộng đó là:',
      options: [
        'A. 50 m²',
        'B. 100 m²',
        'C. 25 m²',
        'D. 40 m²'
      ],
      correct: 0,
      explanation: 'Diện tích hình thang cân bằng: S = [(a + b) × h] : 2 = [(8 + 12) × 5] : 2 = (20 × 5) : 2 = 50 (m²).'
    },
    {
      id: 4,
      source: 'SGK Công thức tính',
      question: 'Muốn tính diện tích của một hình thoi khi biết độ dài hai đường chéo m và n, ta thực hiện:',
      options: [
        'A. Lấy tích độ dài hai đường chéo chia cho 2',
        'B. Lấy tổng độ dài hai đường chéo chia cho 2',
        'C. Lấy tích hai đường chéo nhân với 2',
        'D. Lấy chu vi nhân với chiều cao'
      ],
      correct: 0,
      explanation: 'Công thức tính diện tích hình thoi là S = 1/2 × m × n (tích hai đường chéo chia cho 2).'
    },
    {
      id: 5,
      source: 'SGK BT 4.19 (Tìm cạnh từ chu vi)',
      question: 'Một khu đất hình chữ nhật có chu vi bằng 48 m, chiều dài là 16 m. Chiều rộng của khu đất đó là bao nhiêu?',
      options: [
        'A. 8 m',
        'B. 16 m',
        'C. 32 m',
        'D. 4 m'
      ],
      correct: 0,
      explanation: 'Nửa chu vi khu đất là 48 : 2 = 24 (m). Chiều rộng là: 24 - 16 = 8 (m).'
    },
    {
      id: 6,
      source: 'SGK BT 4.20 (Bài toán lát nền)',
      question: 'Một căn phòng hình chữ nhật có chiều dài 6 m, chiều rộng 4 m. Người ta dùng các viên gạch men hình vuông cạnh 40 cm để lát kín sàn phòng. Hỏi cần bao nhiêu viên gạch?',
      options: [
        'A. 150 viên',
        'B. 1500 viên',
        'C. 60 viên',
        'D. 240 viên'
      ],
      correct: 0,
      explanation: 'Diện tích phòng: 6 × 4 = 24 m² = 240 000 cm². Diện tích 1 viên gạch: 40 × 40 = 1600 cm². Số gạch: 240 000 : 1600 = 150 (viên).'
    },
    {
      id: 7,
      source: 'SGK BT 4.21 a (Bồn hoa hình thoi)',
      question: 'Trên một mảnh đất hình vuông cạnh 10 m, người ta xây một bồn hoa hình thoi có hai đường chéo dài 6 m và 8 m. Diện tích của bồn hoa đó là:',
      options: [
        'A. 24 m²',
        'B. 48 m²',
        'C. 100 m²',
        'D. 14 m²'
      ],
      correct: 0,
      explanation: 'Diện tích bồn hoa hình thoi là: (6 × 8) : 2 = 24 (m²).'
    },
    {
      id: 8,
      source: 'SGK BT 4.21 b (Phần đất còn lại)',
      question: 'Từ câu 7, phần diện tích đất còn lại của mảnh vườn để trồng cỏ xung quanh bồn hoa là bao nhiêu?',
      options: [
        'A. 76 m²',
        'B. 52 m²',
        'C. 124 m²',
        'D. 24 m²'
      ],
      correct: 0,
      explanation: 'Diện tích mảnh đất vuông là: 10 × 10 = 100 (m²). Diện tích trồng cỏ là: 100 - 24 = 76 (m²).'
    },
    {
      id: 9,
      source: 'SGK BT 4.22 (Tìm chiều cao)',
      question: 'Một hình bình hành có diện tích bằng 72 cm² và độ dài cạnh đáy bằng 12 cm. Chiều cao tương ứng với cạnh đáy đó là:',
      options: [
        'A. 6 cm',
        'B. 12 cm',
        'C. 3 cm',
        'D. 8.5 cm'
      ],
      correct: 0,
      explanation: 'Chiều cao hình bình hành bằng: h = S : a = 72 : 12 = 6 (cm).'
    },
    {
      id: 10,
      source: 'SGK Chu vi hình thang cân',
      question: 'Một mảnh đất hình thang cân có hai cạnh đáy lần lượt là 15 m và 25 m, hai cạnh bên đều bằng 10 m. Chu vi của mảnh đất đó là:',
      options: [
        'A. 60 m',
        'B. 50 m',
        'C. 100 m',
        'D. 40 m'
      ],
      correct: 0,
      explanation: 'Chu vi hình thang cân là tổng độ dài 4 cạnh: C = 15 + 25 + 10 + 10 = 60 (m).'
    }
  ];

  // --- DOM ELEMENTS ---
  const startModal = document.getElementById('start-modal');
  const btnEnterGame = document.getElementById('btn-enter-game');
  const studentNameInput = document.getElementById('student-name-input');
  const avatarBtns = document.querySelectorAll('.avatar-btn');

  const hudAvatarDisplay = document.getElementById('hud-avatar-display');
  const hudNameDisplay = document.getElementById('hud-name-display');
  const hudRankDisplay = document.getElementById('hud-rank-display');
  const hudScore = document.getElementById('hud-score');
  const hudStars = document.getElementById('hud-stars');
  const hudStreak = document.getElementById('hud-streak');
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  const btnResetGame = document.getElementById('btn-reset-game');

  const certName = document.getElementById('cert-name');
  const certScore = document.getElementById('cert-score');
  const certStars = document.getElementById('cert-stars');
  const certRank = document.getElementById('cert-rank');
  const certDate = document.getElementById('cert-date');
  const btnReplayLesson = document.getElementById('btn-replay-lesson');

  const quizListEl = document.getElementById('quiz-list');

  // Lab 1: Interactive Calculator
  const btnSelectBinhHanh = document.getElementById('btn-select-bình-hành');
  const btnSelectThoi = document.getElementById('btn-select-thoi');
  const btnSelectThang = document.getElementById('btn-select-thang');
  const dynamicControls = document.getElementById('dynamic-controls');
  const calcSvg = document.getElementById('calc-svg');
  const calcReadout = document.getElementById('calc-readout');

  // Lab 2: Cut & Paste
  const btnToggleCut = document.getElementById('btn-toggle-cut');
  const btnSlideTriangle = document.getElementById('btn-slide-triangle');
  const btnResetCut = document.getElementById('btn-reset-cut');
  const cutSvg = document.getElementById('cut-svg');
  const cutReadout = document.getElementById('cut-readout');

  // Parameters for Calculator
  let calcParams = {
    // Parallelogram: a, h
    para_a: 14,
    para_h: 8,
    // Rhombus: m, n
    rho_m: 16,
    rho_n: 10,
    // Trapezoid: a (top), b (bottom), h
    trap_a: 8,
    trap_b: 16,
    trap_h: 7
  };

  // --- INITIALIZATION ---
  function init() {
    loadState();
    updateHUD();
    renderCalculatorControls();
    renderLab1();
    renderLab2();
    renderQuiz();
    checkBadges();

    if (localStorage.getItem(STORAGE_KEY)) {
      startModal.classList.add('hidden');
    }

    avatarBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        avatarBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.avatar = btn.dataset.avatar;
      });
    });

    btnEnterGame.addEventListener('click', () => {
      initAudio();
      const name = studentNameInput.value.trim();
      if (name) state.studentName = name;
      startModal.classList.add('hidden');
      saveState();
      updateHUD();
      playSuccessSound();
    });

    btnToggleSound.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      state.sound = soundEnabled;
      btnToggleSound.textContent = soundEnabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      saveState();
    });

    btnResetGame.addEventListener('click', () => {
      if (confirm('Em có chắc chắn muốn đặt lại điểm số và bài tập của Bài 20 không?')) {
        state.score = 0;
        state.stars = 0;
        state.streak = 0;
        state.badges = [false, false, false, false, false];
        state.answeredQuestions = {};
        state.usedShapes = { parallelogram: true, rhombus: false, trapezoid: false };
        state.cutState = 'normal';
        saveState();
        updateHUD();
        renderLab2();
        renderQuiz();
        checkBadges();
      }
    });

    btnReplayLesson.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    setupLabEvents();
  }

  // --- HUD & BADGES ---
  function getRank(score) {
    if (score >= 200) return 'Đại Sư Đo Đạc';
    if (score >= 140) return 'Kỹ Sư Trắc Địa';
    if (score >= 80) return 'Nhà Khảo Sát Đất Đai';
    return 'Tập Sự Đo Đạc';
  }

  function updateHUD() {
    hudAvatarDisplay.textContent = state.avatar;
    hudNameDisplay.textContent = state.studentName;
    const rank = getRank(state.score);
    hudRankDisplay.textContent = rank;
    hudScore.textContent = state.score;
    hudStars.textContent = state.stars;
    hudStreak.textContent = state.streak;

    if (certName) certName.textContent = state.studentName;
    if (certScore) certScore.textContent = state.score;
    if (certStars) certStars.textContent = state.stars;
    if (certRank) certRank.textContent = rank;
    if (certDate) {
      const now = new Date();
      certDate.textContent = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()}`;
    }
  }

  function checkBadges() {
    const bIds = ['badge-1', 'badge-2', 'badge-3', 'badge-4', 'badge-5'];
    bIds.forEach((id, idx) => {
      const el = document.getElementById(id);
      if (state.badges[idx] && el) {
        el.classList.remove('locked');
        el.classList.add('unlocked');
      }
    });
  }

  function unlockBadge(index) {
    if (!state.badges[index]) {
      state.badges[index] = true;
      saveState();
      checkBadges();
      playFanfareSound();
    }
  }

  // --- LAB 1: CALCULATOR & VISUALIZER ---
  function renderCalculatorControls() {
    [btnSelectBinhHanh, btnSelectThoi, btnSelectThang].forEach(b => b.classList.remove('active'));
    
    if (state.calculatorShape === 'parallelogram') {
      btnSelectBinhHanh.classList.add('active');
      dynamicControls.innerHTML = `
        <label style="font-weight:700;">Độ dài đáy a: <span id="val-para-a">${calcParams.para_a}</span> m</label>
        <input type="range" id="range-para-a" min="6" max="22" step="1" value="${calcParams.para_a}">
        <label style="font-weight:700; margin-left:14px;">Chiều cao h: <span id="val-para-h">${calcParams.para_h}</span> m</label>
        <input type="range" id="range-para-h" min="4" max="14" step="1" value="${calcParams.para_h}">
      `;
    } else if (state.calculatorShape === 'rhombus') {
      btnSelectThoi.classList.add('active');
      dynamicControls.innerHTML = `
        <label style="font-weight:700;">Đường chéo m: <span id="val-rho-m">${calcParams.rho_m}</span> cm</label>
        <input type="range" id="range-rho-m" min="8" max="22" step="2" value="${calcParams.rho_m}">
        <label style="font-weight:700; margin-left:14px;">Đường chéo n: <span id="val-rho-n">${calcParams.rho_n}</span> cm</label>
        <input type="range" id="range-rho-n" min="6" max="18" step="2" value="${calcParams.rho_n}">
      `;
    } else {
      btnSelectThang.classList.add('active');
      dynamicControls.innerHTML = `
        <label style="font-weight:700;">Đáy nhỏ a: <span id="val-trap-a">${calcParams.trap_a}</span> m</label>
        <input type="range" id="range-trap-a" min="4" max="12" step="1" value="${calcParams.trap_a}">
        <label style="font-weight:700; margin-left:14px;">Đáy lớn b: <span id="val-trap-b">${calcParams.trap_b}</span> m</label>
        <input type="range" id="range-trap-b" min="14" max="26" step="1" value="${calcParams.trap_b}">
        <label style="font-weight:700; margin-left:14px;">Chiều cao h: <span id="val-trap-h">${calcParams.trap_h}</span> m</label>
        <input type="range" id="range-trap-h" min="4" max="12" step="1" value="${calcParams.trap_h}">
      `;
    }

    bindCalculatorSliders();
  }

  function bindCalculatorSliders() {
    if (state.calculatorShape === 'parallelogram') {
      const ra = document.getElementById('range-para-a');
      const rh = document.getElementById('range-para-h');
      ra.addEventListener('input', () => {
        calcParams.para_a = parseInt(ra.value);
        document.getElementById('val-para-a').textContent = calcParams.para_a;
        renderLab1();
      });
      rh.addEventListener('input', () => {
        calcParams.para_h = parseInt(rh.value);
        document.getElementById('val-para-h').textContent = calcParams.para_h;
        renderLab1();
      });
    } else if (state.calculatorShape === 'rhombus') {
      const rm = document.getElementById('range-rho-m');
      const rn = document.getElementById('range-rho-n');
      rm.addEventListener('input', () => {
        calcParams.rho_m = parseInt(rm.value);
        document.getElementById('val-rho-m').textContent = calcParams.rho_m;
        renderLab1();
      });
      rn.addEventListener('input', () => {
        calcParams.rho_n = parseInt(rn.value);
        document.getElementById('val-rho-n').textContent = calcParams.rho_n;
        renderLab1();
      });
    } else {
      const ra = document.getElementById('range-trap-a');
      const rb = document.getElementById('range-trap-b');
      const rh = document.getElementById('range-trap-h');
      ra.addEventListener('input', () => {
        calcParams.trap_a = parseInt(ra.value);
        document.getElementById('val-trap-a').textContent = calcParams.trap_a;
        renderLab1();
      });
      rb.addEventListener('input', () => {
        calcParams.trap_b = parseInt(rb.value);
        document.getElementById('val-trap-b').textContent = calcParams.trap_b;
        renderLab1();
      });
      rh.addEventListener('input', () => {
        calcParams.trap_h = parseInt(rh.value);
        document.getElementById('val-trap-h').textContent = calcParams.trap_h;
        renderLab1();
      });
    }
  }

  function renderLab1() {
    let svgHtml = '';

    if (state.calculatorShape === 'parallelogram') {
      const a = calcParams.para_a;
      const h = calcParams.para_h;
      const area = a * h;

      const pxScale = 10;
      const basePx = a * pxScale;
      const hPx = h * pxScale;
      const slantPx = hPx * 0.55;

      const startX = 60;
      const startY = 170;

      const Dx = startX, Dy = startY;
      const Cx = Dx + basePx, Cy = startY;
      const Ax = Dx + slantPx, Ay = Dy - hPx;
      const Bx = Ax + basePx, By = Ay;

      svgHtml = `
        <polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy} ${Dx},${Dy}" 
          fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5" />
        <!-- Chiều cao h -->
        <line x1="${Ax}" y1="${Ay}" x2="${Ax}" y2="${Dy}" stroke="#e11d48" stroke-width="2" stroke-dasharray="4" />
        <text x="${Ax - 18}" y="${(Ay + Dy) / 2}" font-size="12" font-weight="bold" fill="#e11d48">h = ${h} m</text>
        <polyline points="${Ax},${Dy - 8} ${Ax + 8},${Dy - 8} ${Ax + 8},${Dy}" fill="none" stroke="#e11d48" stroke-width="1.5" />
        <!-- Đáy a -->
        <text x="${(Dx + Cx) / 2}" y="${Dy + 18}" font-size="12" font-weight="bold" fill="#0284c7" text-anchor="middle">đáy a = ${a} m</text>
      `;

      calcReadout.innerHTML = `Hình Bình Hành: $S = a \\cdot h = ${a} \\times ${h} = <strong>${area}\\text{ m}^2</strong>$.`;
    } else if (state.calculatorShape === 'rhombus') {
      const m = calcParams.rho_m;
      const n = calcParams.rho_n;
      const area = (m * n) / 2;

      const Ox = 180, Oy = 110;
      const d1Px = m * 6;
      const d2Px = n * 6;

      const Ax = Ox - d1Px / 2, Ay = Oy;
      const Cx = Ox + d1Px / 2, Cy = Oy;
      const Bx = Ox, By = Oy - d2Px / 2;
      const Dx = Ox, Dy = Oy + d2Px / 2;

      svgHtml = `
        <polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy} ${Dx},${Dy}" 
          fill="#fef3c7" stroke="#d97706" stroke-width="2.5" />
        <!-- 2 đường chéo m và n -->
        <line x1="${Ax}" y1="${Ay}" x2="${Cx}" y2="${Cy}" stroke="#0284c7" stroke-width="2" stroke-dasharray="3" />
        <line x1="${Bx}" y1="${By}" x2="${Dx}" y2="${Dy}" stroke="#059669" stroke-width="2" stroke-dasharray="3" />
        <text x="${Cx + 10}" y="${Ay + 4}" font-size="12" font-weight="bold" fill="#0284c7">m = ${m} cm</text>
        <text x="${Bx + 8}" y="${By - 4}" font-size="12" font-weight="bold" fill="#059669">n = ${n} cm</text>
      `;

      calcReadout.innerHTML = `Hình Thoi: $S = \\frac{1}{2} m \\cdot n = \\frac{${m} \\times ${n}}{2} = <strong>${area}\\text{ cm}^2</strong>$.`;
    } else {
      const a = calcParams.trap_a;
      const b = calcParams.trap_b;
      const h = calcParams.trap_h;
      const area = ((a + b) * h) / 2;

      const pxScale = 8;
      const bPx = b * pxScale;
      const aPx = a * pxScale;
      const hPx = h * pxScale;
      const diffPx = (bPx - aPx) / 2;

      const startX = 60;
      const startY = 175;

      const Dx = startX, Dy = startY;
      const Cx = Dx + bPx, Cy = startY;
      const Ax = Dx + diffPx, Ay = Dy - hPx;
      const Bx = Ax + aPx, By = Ay;

      svgHtml = `
        <polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy} ${Dx},${Dy}" 
          fill="#ecfdf5" stroke="#059669" stroke-width="2.5" />
        <!-- Chiều cao h -->
        <line x1="${Ax}" y1="${Ay}" x2="${Ax}" y2="${Dy}" stroke="#e11d48" stroke-width="2" stroke-dasharray="4" />
        <text x="${Ax - 18}" y="${(Ay + Dy) / 2}" font-size="12" font-weight="bold" fill="#e11d48">h = ${h} m</text>
        <!-- Đáy nhỏ a & đáy lớn b -->
        <text x="${(Ax + Bx) / 2}" y="${Ay - 8}" font-size="12" font-weight="bold" fill="#059669" text-anchor="middle">đáy nhỏ a = ${a} m</text>
        <text x="${(Dx + Cx) / 2}" y="${Dy + 18}" font-size="12" font-weight="bold" fill="#059669" text-anchor="middle">đáy lớn b = ${b} m</text>
      `;

      calcReadout.innerHTML = `Hình Thang Cân: $S = \\frac{(a + b) \\cdot h}{2} = \\frac{(${a} + ${b}) \\times ${h}}{2} = <strong>${area}\\text{ m}^2</strong>$.`;
    }

    calcSvg.innerHTML = svgHtml;
  }

  // --- LAB 2: CUT & PASTE SIMULATOR ---
  function renderLab2() {
    const baseWidth = 140;
    const h = 75;
    const cutW = 45;

    const startX = 50;
    const startY = 150;

    const Dx = startX, Dy = startY;
    const Cx = Dx + baseWidth, Cy = startY;
    const Ax = Dx + cutW, Ay = Dy - h;
    const Bx = Ax + baseWidth, By = Ay;

    let svgHtml = '';

    if (state.cutState === 'normal') {
      svgHtml = `
        <polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy} ${Dx},${Dy}" 
          fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5" />
        <line x1="${Ax}" y1="${Ay}" x2="${Ax}" y2="${Dy}" stroke="#e11d48" stroke-width="2" stroke-dasharray="4" />
        <text x="${Ax - 15}" y="${(Ay + Dy) / 2}" font-size="11" font-weight="bold" fill="#e11d48">h</text>
        <text x="${(Dx + Cx) / 2}" y="${Dy + 16}" font-size="12" font-weight="bold" fill="#0284c7" text-anchor="middle">đáy a</text>
      `;
      cutReadout.innerHTML = `Hình bình hành ban đầu có cạnh đáy $a$ và chiều cao $h$.`;
    } else if (state.cutState === 'cut') {
      svgHtml = `
        <!-- Phần tứ giác còn lại -->
        <polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy} ${Ax},${Dy}" 
          fill="#e0f2fe" stroke="#0284c7" stroke-width="2.5" />
        <!-- Miếng tam giác bị cắt (màu vàng) -->
        <polygon points="${Ax},${Ay} ${Ax},${Dy} ${Dx},${Dy}" 
          fill="#fef08a" stroke="#ca8a04" stroke-width="2.5" stroke-dasharray="3" />
        <text x="${(Dx + Ax) / 2 - 8}" y="${Dy - 15}" font-size="12" font-weight="bold" fill="#ca8a04">✂️</text>
      `;
      cutReadout.innerHTML = `Đã cắt rời tam giác vuông bên trái dọc theo chiều cao $h$! Hãy bấm "Di Chuyển & Ghép Sang Phải".`;
    } else if (state.cutState === 'slid') {
      // Slid: Triangle moves from (Dx, Dy) to (Cx, Cy)
      const newDx = Cx, newDy = Cy;
      const newAx = Cx + cutW, newAy = Cy - h;

      svgHtml = `
        <!-- Phần thân cũ -->
        <polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy} ${Ax},${Dy}" 
          fill="#e0f2fe" stroke="#0284c7" stroke-width="2" />
        <!-- Tam giác đã ghép sang phải -->
        <polygon points="${Bx},${By} ${newAx},${newAy} ${Cx},${Cy}" 
          fill="#bbf7d0" stroke="#16a34a" stroke-width="2.5" />
        <!-- Khung hình chữ nhật tổng thể -->
        <rect x="${Ax}" y="${Ay}" width="${baseWidth}" height="${h}" 
          fill="none" stroke="#059669" stroke-width="3" stroke-dasharray="4" />
        <text x="${Ax + baseWidth / 2}" y="${Ay - 8}" font-size="12" font-weight="bold" fill="#059669" text-anchor="middle">Chiều dài a</text>
        <text x="${Ax + baseWidth + 10}" y="${Ay + h / 2}" font-size="12" font-weight="bold" fill="#059669">Chiều rộng h</text>
      `;
      cutReadout.innerHTML = `🎉 <strong>Thành hình chữ nhật hoàn hảo!</strong> Kích thước dài $a$, rộng $h$. Diện tích $S = a \\cdot h$.`;
      unlockBadge(1);
    }

    cutSvg.innerHTML = svgHtml;
  }

  // --- SETUP LAB EVENTS ---
  function setupLabEvents() {
    btnSelectBinhHanh.addEventListener('click', () => {
      initAudio();
      state.calculatorShape = 'parallelogram';
      state.usedShapes.parallelogram = true;
      renderCalculatorControls();
      renderLab1();
      checkShapeBadge();
    });

    btnSelectThoi.addEventListener('click', () => {
      initAudio();
      state.calculatorShape = 'rhombus';
      state.usedShapes.rhombus = true;
      renderCalculatorControls();
      renderLab1();
      checkShapeBadge();
    });

    btnSelectThang.addEventListener('click', () => {
      initAudio();
      state.calculatorShape = 'trapezoid';
      state.usedShapes.trapezoid = true;
      renderCalculatorControls();
      renderLab1();
      checkShapeBadge();
    });

    function checkShapeBadge() {
      if (state.usedShapes.parallelogram && state.usedShapes.rhombus && state.usedShapes.trapezoid) {
        unlockBadge(0);
      }
    }

    btnToggleCut.addEventListener('click', () => {
      initAudio();
      state.cutState = 'cut';
      playTone(480, 0.15, 'sawtooth');
      renderLab2();
    });

    btnSlideTriangle.addEventListener('click', () => {
      initAudio();
      state.cutState = 'slid';
      playSuccessSound();
      renderLab2();
    });

    btnResetCut.addEventListener('click', () => {
      state.cutState = 'normal';
      renderLab2();
    });
  }

  // --- QUIZ RENDERING & HANDLING ---
  function renderQuiz() {
    quizListEl.innerHTML = '';

    quizData.forEach((q, idx) => {
      const qCard = document.createElement('div');
      qCard.className = 'quiz-card';
      qCard.id = `quiz-card-${idx}`;

      const answered = state.answeredQuestions[idx];
      if (answered) {
        qCard.classList.add(answered.correct ? 'answered-correct' : 'answered-wrong');
      }

      const qHeader = document.createElement('div');
      qHeader.className = 'quiz-header';
      qHeader.innerHTML = `
        <span class="quiz-qnum">Câu ${idx + 1}/10</span>
        <span class="quiz-badge-src">${q.source}</span>
      `;

      const qTitle = document.createElement('div');
      qTitle.className = 'quiz-question';
      qTitle.textContent = q.question;

      const optionsGrid = document.createElement('div');
      optionsGrid.className = 'quiz-options';

      q.options.forEach((optText, optIdx) => {
        const btn = document.createElement('button');
        btn.className = 'quiz-option-btn';
        btn.textContent = optText;

        if (answered) {
          btn.disabled = true;
          if (optIdx === q.correct) {
            btn.classList.add('selected-correct');
          } else if (optIdx === answered.userChoice && !answered.correct) {
            btn.classList.add('selected-wrong');
          }
        } else {
          btn.addEventListener('click', () => handleQuizAnswer(idx, optIdx));
        }

        optionsGrid.appendChild(btn);
      });

      const explanation = document.createElement('div');
      explanation.className = `quiz-explanation ${answered ? 'show' : ''}`;
      explanation.id = `quiz-exp-${idx}`;
      explanation.innerHTML = `<strong>💡 Giải thích chi tiết:</strong> ${q.explanation}`;

      qCard.appendChild(qHeader);
      qCard.appendChild(qTitle);
      qCard.appendChild(optionsGrid);
      qCard.appendChild(explanation);
      quizListEl.appendChild(qCard);
    });
  }

  function handleQuizAnswer(qIdx, userChoice) {
    initAudio();
    const q = quizData[qIdx];
    const isCorrect = userChoice === q.correct;

    state.answeredQuestions[qIdx] = {
      correct: isCorrect,
      userChoice: userChoice
    };

    if (isCorrect) {
      state.score += 20;
      state.stars += 1;
      state.streak += 1;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;
      playSuccessSound();

      // Badge 3: Correct question 6 (Lát gạch)
      if (qIdx === 5) {
        unlockBadge(2);
      }

      if (state.streak >= 3) {
        unlockBadge(3);
      }
    } else {
      state.streak = 0;
      playErrorSound();
    }

    const correctCount = Object.values(state.answeredQuestions).filter(a => a.correct).length;
    if (correctCount === 10) {
      unlockBadge(4);
    }

    saveState();
    updateHUD();
    renderQuiz();
  }

  document.addEventListener('DOMContentLoaded', init);
})();
