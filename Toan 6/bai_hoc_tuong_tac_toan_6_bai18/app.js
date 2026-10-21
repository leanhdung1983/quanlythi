/* =========================================================
   BÀI 18: TAM GIÁC ĐỀU • HÌNH VUÔNG • HÌNH LỤC GIÁC ĐỀU
   Logic & Mini-game Engine - Toán 6 Kết Nối Tri Thức
   ========================================================= */

(function () {
  'use strict';

  // --- AUDIO SYNTHESIZER (WEB AUDIO API) ---
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
    playTone(523.25, 0.12, 'sine', 0.2); // C5
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.2), 100); // E5
    setTimeout(() => playTone(783.99, 0.25, 'triangle', 0.25), 220); // G5
  }

  function playErrorSound() {
    playTone(220, 0.2, 'sawtooth', 0.2); // A3
    setTimeout(() => playTone(185, 0.3, 'sawtooth', 0.25), 150); // F#3
  }

  function playFanfareSound() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      setTimeout(() => playTone(freq, 0.25, 'triangle', 0.25), idx * 120);
    });
  }

  // --- APPLICATION STATE ---
  const STORAGE_KEY = 'toan6_bai18_progress';

  let state = {
    studentName: 'Kiến Trúc Sư Lớp 6',
    avatar: '🐝',
    score: 0,
    stars: 0,
    streak: 0,
    maxStreak: 0,
    sound: true,
    badges: [false, false, false, false, false],
    answeredQuestions: {}, // qIndex: { correct: bool }
    hexPuzzlePieces: [false, false, false, false, false, false]
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

  // --- QUIZ QUESTIONS (SGK BT 4.1 - 4.7 & VẬN DỤNG) ---
  const quizData = [
    {
      id: 1,
      source: 'SGK BT 4.1',
      question: 'Trong các đồ vật sau đây, đồ vật nào thường có hình dạng là một hình tam giác đều?',
      options: [
        'A. Biển báo giao thông nguy hiểm hình tam giác viền đỏ',
        'B. Bàn cờ vua hình vuông',
        'C. Khung cửa sổ chữ nhật',
        'D. Mặt đồng hồ hình tròn'
      ],
      correct: 0,
      explanation: 'Biển báo giao thông hình tam giác cảnh báo nguy hiểm trong thực tế là hình ảnh quen thuộc của hình tam giác đều.'
    },
    {
      id: 2,
      source: 'SGK Định nghĩa & Tính chất',
      question: 'Một hình tam giác đều có chu vi bằng 18 cm. Hỏi độ dài mỗi cạnh của tam giác đều đó bằng bao nhiêu?',
      options: [
        'A. 6 cm',
        'B. 9 cm',
        'C. 4.5 cm',
        'D. 3 cm'
      ],
      correct: 0,
      explanation: 'Tam giác đều có 3 cạnh bằng nhau, do đó độ dài mỗi cạnh là 18 : 3 = 6 (cm).'
    },
    {
      id: 3,
      source: 'SGK Góc tam giác đều',
      question: 'Trong hình tam giác đều ABC, số đo của ba góc tại các đỉnh A, B, C bằng bao nhiêu?',
      options: [
        'A. Đều bằng 90°',
        'B. Đều bằng 60°',
        'C. Đều bằng 45°',
        'D. Đều bằng 120°'
      ],
      correct: 1,
      explanation: 'Trong tam giác đều, 3 góc ở 3 đỉnh bằng nhau và mỗi góc đều có số đo bằng 60°.'
    },
    {
      id: 4,
      source: 'SGK BT 4.3 & Chu vi',
      question: 'Một hình vuông có độ dài cạnh bằng 5 cm. Chu vi của hình vuông đó là:',
      options: [
        'A. 20 cm',
        'B. 25 cm',
        'C. 15 cm',
        'D. 10 cm'
      ],
      correct: 0,
      explanation: 'Chu vi hình vuông có cạnh a là C = 4 × a = 4 × 5 = 20 (cm).'
    },
    {
      id: 5,
      source: 'SGK Đường chéo hình vuông',
      question: 'Khẳng định nào sau đây là ĐÚNG về hai đường chéo của hình vuông ABCD?',
      options: [
        'A. Hai đường chéo không bằng nhau',
        'B. Hai đường chéo bằng nhau, cắt nhau tại trung điểm mỗi đường và vuông góc với nhau',
        'C. Hai đường chéo luôn song song với nhau',
        'D. Hình vuông có 3 đường chéo bằng nhau'
      ],
      correct: 1,
      explanation: 'Trong hình vuông, 2 đường chéo bằng nhau (AC = BD), vuông góc với nhau tại trung điểm của mỗi đường.'
    },
    {
      id: 6,
      source: 'SGK BT 4.6 (Que tính)',
      question: 'Để lần lượt xếp được một hình tam giác đều, một hình vuông và một hình lục giác đều, số que tính bằng nhau ít nhất cần dùng tương ứng là:',
      options: [
        'A. 3 que, 4 que, 6 que',
        'B. 3 que, 4 que, 5 que',
        'C. 4 que, 4 que, 6 que',
        'D. 3 que, 5 que, 6 que'
      ],
      correct: 0,
      explanation: 'Tam giác đều có 3 cạnh (3 que), hình vuông có 4 cạnh (4 que), hình lục giác đều có 6 cạnh (6 que).'
    },
    {
      id: 7,
      source: 'SGK BT 4.4 & Lục giác đều',
      question: 'Có thể ghép bao nhiêu hình tam giác đều bằng nhau có chung một đỉnh tâm O để tạo thành một hình lục giác đều?',
      options: [
        'A. 4 hình tam giác đều',
        'B. 5 hình tam giác đều',
        'C. 6 hình tam giác đều',
        'D. 8 hình tam giác đều'
      ],
      correct: 2,
      explanation: 'Hình lục giác đều có thể ghép vừa khít từ đúng 6 hình tam giác đều bằng nhau có chung đỉnh O.'
    },
    {
      id: 8,
      source: 'SGK Đường chéo lục giác đều',
      question: 'Trong hình lục giác đều ABCDEF có tâm O, có bao nhiêu đường chéo chính bằng nhau và cùng đi qua tâm O?',
      options: [
        'A. 2 đường chéo',
        'B. 3 đường chéo (AD, BE, CF)',
        'C. 6 đường chéo',
        'D. 4 đường chéo'
      ],
      correct: 1,
      explanation: 'Hình lục giác đều ABCDEF có 3 đường chéo chính là AD, BE, CF. Cả 3 đường này đều bằng nhau và cắt nhau tại trung điểm O.'
    },
    {
      id: 9,
      source: 'SGK BT 4.7 (Nhận dạng)',
      question: 'Một hình tứ giác có 4 cạnh bằng nhau nhưng 4 góc không phải là góc vuông thì hình đó:',
      options: [
        'A. Vẫn là hình vuông',
        'B. Không phải là hình vuông (đó là hình thoi)',
        'C. Là hình tam giác đều',
        'D. Là hình chữ nhật'
      ],
      correct: 1,
      explanation: 'Hình vuông bắt buộc phải có đủ 2 điều kiện: 4 cạnh bằng nhau VÀ 4 góc đều là góc vuông (90°).'
    },
    {
      id: 10,
      source: 'SGK Vận dụng thực tiễn',
      question: 'Bác thợ làm một khung đèn trang trí hình lục giác đều có mỗi cạnh bằng 30 cm. Bác cần thanh nhôm dài bao nhiêu để uốn thành viền khung ngoài?',
      options: [
        'A. 180 cm',
        'B. 120 cm',
        'C. 90 cm',
        'D. 240 cm'
      ],
      correct: 0,
      explanation: 'Chu vi viền ngoài của khung lục giác đều là: 6 × 30 = 180 (cm).'
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

  // Lab 1: Tam giác đều Elements
  const triSideSlider = document.getElementById('tri-side-slider');
  const triSideVal = document.getElementById('tri-side-val');
  const btnToggleTriAngles = document.getElementById('btn-toggle-tri-angles');
  const btnToggleTriSides = document.getElementById('btn-toggle-tri-sides');
  const triSvg = document.getElementById('tri-svg');
  const triReadout = document.getElementById('tri-readout');
  let showTriAngles = true;
  let showTriSides = true;

  // Lab 2: Hình vuông Elements
  const btnToggleSqDiag = document.getElementById('btn-toggle-sq-diag');
  const btnToggleSqRightangles = document.getElementById('btn-toggle-sq-rightangles');
  const sqSvg = document.getElementById('sq-svg');
  const sqReadout = document.getElementById('sq-readout');
  let showSqDiag = true;
  let showSqRightangles = true;

  // Lab 3: Lục giác đều Elements
  const puzzleTriBtns = document.querySelectorAll('.puzzle-tri-btn');
  const btnResetHexPuzzle = document.getElementById('btn-reset-hex-puzzle');
  const hexSvg = document.getElementById('hex-svg');
  const hexReadout = document.getElementById('hex-readout');

  // --- INITIALIZATION ---
  function init() {
    loadState();
    updateHUD();
    renderLab1();
    renderLab2();
    renderLab3();
    renderQuiz();
    checkBadges();

    // Check if user already set name
    if (localStorage.getItem(STORAGE_KEY)) {
      startModal.classList.add('hidden');
    }

    // Modal Events
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

    // Sound toggle
    btnToggleSound.addEventListener('click', () => {
      soundEnabled = !soundEnabled;
      state.sound = soundEnabled;
      btnToggleSound.textContent = soundEnabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      saveState();
    });

    // Reset game
    btnResetGame.addEventListener('click', () => {
      if (confirm('Em có chắc chắn muốn đặt lại điểm số và bài tập của Bài 18 không?')) {
        state.score = 0;
        state.stars = 0;
        state.streak = 0;
        state.badges = [false, false, false, false, false];
        state.answeredQuestions = {};
        state.hexPuzzlePieces = [false, false, false, false, false, false];
        saveState();
        updateHUD();
        renderLab3();
        renderQuiz();
        checkBadges();
      }
    });

    btnReplayLesson.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    setupLabEvents();
  }

  // --- HUD & CERTIFICATE UPDATE ---
  function getRank(score) {
    if (score >= 200) return 'Đại Kiện Tướng Hình Học';
    if (score >= 140) return 'Kiến Trúc Sư Cao Cấp';
    if (score >= 80) return 'Nhà Khám Phá Hình Học';
    return 'Tập Sự Hình Học';
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

  // --- CHECK BADGES ---
  function checkBadges() {
    // Badge 1: Explore Lab 1 (slider changed or toggled)
    const b1 = document.getElementById('badge-1');
    if (state.badges[0] && b1) {
      b1.classList.remove('locked');
      b1.classList.add('unlocked');
    }

    // Badge 2: Explore Lab 2
    const b2 = document.getElementById('badge-2');
    if (state.badges[1] && b2) {
      b2.classList.remove('locked');
      b2.classList.add('unlocked');
    }

    // Badge 3: Completed 6 Hexagon puzzle pieces
    const b3 = document.getElementById('badge-3');
    if (state.badges[2] && b3) {
      b3.classList.remove('locked');
      b3.classList.add('unlocked');
    }

    // Badge 4: Streak >= 3
    const b4 = document.getElementById('badge-4');
    if (state.badges[3] && b4) {
      b4.classList.remove('locked');
      b4.classList.add('unlocked');
    }

    // Badge 5: All 10 questions correct
    const b5 = document.getElementById('badge-5');
    if (state.badges[4] && b5) {
      b5.classList.remove('locked');
      b5.classList.add('unlocked');
    }
  }

  function unlockBadge(index) {
    if (!state.badges[index]) {
      state.badges[index] = true;
      saveState();
      checkBadges();
      playFanfareSound();
    }
  }

  // --- LAB 1: TAM GIÁC ĐỀU ---
  function renderLab1() {
    const a = parseFloat(triSideSlider.value);
    triSideVal.textContent = a;
    
    // Scale for SVG rendering: center at x=150, y=190
    const scale = 28 * (a / 4);
    const sidePx = 140 * (a / 4);
    const heightPx = sidePx * (Math.sqrt(3) / 2);
    
    const Ax = 150;
    const Ay = 200 - heightPx;
    const Bx = 150 - sidePx / 2;
    const By = 200;
    const Cx = 150 + sidePx / 2;
    const Cy = 200;

    let svgHtml = `
      <!-- TAM GIÁC ABC -->
      <polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy}" 
        fill="#fef3c7" stroke="#d97706" stroke-width="3" stroke-linejoin="round" />
    `;

    // Angle arcs (60 deg)
    if (showTriAngles) {
      svgHtml += `
        <!-- Góc A (đỉnh trên) -->
        <path d="M ${Ax - 12} ${Ay + 20} A 24 24 0 0 0 ${Ax + 12} ${Ay + 20}" fill="none" stroke="#dc2626" stroke-width="2" />
        <text x="${Ax}" y="${Ay + 35}" font-size="11" font-weight="bold" fill="#dc2626" text-anchor="middle">60°</text>

        <!-- Góc B -->
        <path d="M ${Bx + 22} ${By} A 24 24 0 0 0 ${Bx + 11} ${By - 19}" fill="none" stroke="#dc2626" stroke-width="2" />
        <text x="${Bx + 28}" y="${By - 8}" font-size="11" font-weight="bold" fill="#dc2626">60°</text>

        <!-- Góc C -->
        <path d="M ${Cx - 11} ${Cy - 19} A 24 24 0 0 0 ${Cx - 22} ${Cy}" fill="none" stroke="#dc2626" stroke-width="2" />
        <text x="${Cx - 38}" y="${Cy - 8}" font-size="11" font-weight="bold" fill="#dc2626">60°</text>
      `;
    }

    // Side equality tick marks and labels
    if (showTriSides) {
      const midABx = (Ax + Bx) / 2;
      const midABy = (Ay + By) / 2;
      const midBCx = (Bx + Cx) / 2;
      const midBCy = (By + Cy) / 2;
      const midCAx = (Cx + Ax) / 2;
      const midCAy = (Cy + Ay) / 2;

      svgHtml += `
        <text x="${midABx - 24}" y="${midABy}" font-size="12" font-weight="bold" fill="#b45309">${a} cm</text>
        <text x="${midBCx}" y="${midBCy + 18}" font-size="12" font-weight="bold" fill="#b45309" text-anchor="middle">${a} cm</text>
        <text x="${midCAx + 8}" y="${midCAy}" font-size="12" font-weight="bold" fill="#b45309">${a} cm</text>
      `;
    }

    // Vertex points & labels
    svgHtml += `
      <circle cx="${Ax}" cy="${Ay}" r="4" fill="#d97706" />
      <text x="${Ax}" y="${Ay - 10}" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">A</text>
      <circle cx="${Bx}" cy="${By}" r="4" fill="#d97706" />
      <text x="${Bx - 14}" y="${By + 5}" font-size="13" font-weight="bold" fill="#0f172a">B</text>
      <circle cx="${Cx}" cy="${Cy}" r="4" fill="#d97706" />
      <text x="${Cx + 6}" y="${By + 5}" font-size="13" font-weight="bold" fill="#0f172a">C</text>
    `;

    triSvg.innerHTML = svgHtml;
    triReadout.innerHTML = `Tam giác đều $ABC$: 3 cạnh bằng nhau $AB = BC = CA = ${a}\\text{ cm}$, 3 góc bằng nhau $\\widehat{A} = \\widehat{B} = \\widehat{C} = 60^\\circ$. Chu vi: $P = ${a * 3}\\text{ cm}$.`;
  }

  // --- LAB 2: HÌNH VUÔNG ---
  function renderLab2() {
    const size = 140;
    const Ax = 70, Ay = 60;
    const Bx = 70 + size, By = 60;
    const Cx = 70 + size, Cy = 60 + size;
    const Dx = 70, Dy = 60 + size;
    const Ox = 70 + size / 2, Oy = 60 + size / 2;

    let svgHtml = `
      <!-- HÌNH VUÔNG ABCD -->
      <polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy} ${Dx},${Dy}" 
        fill="#f0fdfa" stroke="#0d9488" stroke-width="3" />
    `;

    // Right angle corner boxes (90 deg)
    if (showSqRightangles) {
      const box = 14;
      svgHtml += `
        <!-- Góc A -->
        <polyline points="${Ax},${Ay + box} ${Ax + box},${Ay + box} ${Ax + box},${Ay}" fill="none" stroke="#0d9488" stroke-width="2" />
        <!-- Góc B -->
        <polyline points="${Bx - box},${By} ${Bx - box},${By + box} ${Bx},${By + box}" fill="none" stroke="#0d9488" stroke-width="2" />
        <!-- Góc C -->
        <polyline points="${Cx},${Cy - box} ${Cx - box},${Cy - box} ${Cx - box},${Cy}" fill="none" stroke="#0d9488" stroke-width="2" />
        <!-- Góc D -->
        <polyline points="${Dx + box},${Dy} ${Dx + box},${Dy - box} ${Dx},${Dy - box}" fill="none" stroke="#0d9488" stroke-width="2" />
      `;
    }

    // Diagonals AC and BD
    if (showSqDiag) {
      svgHtml += `
        <line x1="${Ax}" y1="${Ay}" x2="${Cx}" y2="${Cy}" stroke="#e11d48" stroke-width="2" stroke-dasharray="4" />
        <line x1="${Bx}" y1="${By}" x2="${Dx}" y2="${Dy}" stroke="#6366f1" stroke-width="2" stroke-dasharray="4" />
        <circle cx="${Ox}" cy="${Oy}" r="4" fill="#0f172a" />
        <text x="${Ox + 6}" y="${Oy - 6}" font-size="12" font-weight="bold" fill="#0f172a">O</text>
        <!-- Vuông góc tại O -->
        <rect x="${Ox - 5}" y="${Oy - 5}" width="10" height="10" fill="none" stroke="#0f172a" stroke-width="1.5" transform="rotate(45, ${Ox}, ${Oy})" />
      `;
    }

    // Vertices and labels
    svgHtml += `
      <circle cx="${Ax}" cy="${Ay}" r="4" fill="#0d9488" />
      <text x="${Ax - 14}" y="${Ay - 6}" font-size="13" font-weight="bold" fill="#0f172a">A</text>
      <circle cx="${Bx}" cy="${By}" r="4" fill="#0d9488" />
      <text x="${Bx + 6}" y="${By - 6}" font-size="13" font-weight="bold" fill="#0f172a">B</text>
      <circle cx="${Cx}" cy="${Cy}" r="4" fill="#0d9488" />
      <text x="${Cx + 6}" y="${Cy + 14}" font-size="13" font-weight="bold" fill="#0f172a">C</text>
      <circle cx="${Dx}" cy="${Dy}" r="4" fill="#0d9488" />
      <text x="${Dx - 14}" y="${Dy + 14}" font-size="13" font-weight="bold" fill="#0f172a">D</text>
      <text x="140" y="50" font-size="12" font-weight="bold" fill="#0d9488" text-anchor="middle">cạnh a</text>
    `;

    sqSvg.innerHTML = svgHtml;
    sqReadout.innerHTML = `Hình vuông $ABCD$: 4 cạnh bằng nhau $AB=BC=CD=DA$, 4 góc vuông $90^\\circ$. ${showSqDiag ? 'Hai đường chéo $AC = BD$, vuông góc tại trung điểm $O$.' : ''}`;
  }

  // --- LAB 3: LỤC GIÁC ĐỀU PUZZLE ---
  function renderLab3() {
    const Ox = 150, Oy = 140, R = 90;
    // Angles for 6 vertices A, B, C, D, E, F: 0, 60, 120, 180, 240, 300 deg
    const points = [];
    const labels = ['A', 'B', 'C', 'D', 'E', 'F'];
    for (let i = 0; i < 6; i++) {
      const angleRad = (i * 60 - 30) * Math.PI / 180;
      points.push({
        x: Ox + R * Math.cos(angleRad),
        y: Oy + R * Math.sin(angleRad),
        label: labels[i]
      });
    }

    let svgHtml = `
      <!-- OUTLINE DOTTED LỤC GIÁC -->
      <polygon points="${points.map(p => `${p.x},${p.y}`).join(' ')}" 
        fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="5" />
    `;

    // Colors for the 6 triangle slices
    const sliceColors = ['#fde68a', '#99f6e4', '#fed7aa', '#c7d2fe', '#fbcfe8', '#bbf7d0'];
    const borderColors = ['#d97706', '#0d9488', '#ea580c', '#4f46e5', '#db2777', '#16a34a'];

    let countPlaced = 0;
    for (let i = 0; i < 6; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % 6];
      const placed = state.hexPuzzlePieces[i];
      if (placed) {
        countPlaced++;
        svgHtml += `
          <polygon points="${Ox},${Oy} ${p1.x},${p1.y} ${p2.x},${p2.y}" 
            fill="${sliceColors[i]}" stroke="${borderColors[i]}" stroke-width="2.5" />
        `;
      }
    }

    // Draw main diagonals if all 6 are placed
    if (countPlaced === 6) {
      svgHtml += `
        <line x1="${points[0].x}" y1="${points[0].y}" x2="${points[3].x}" y2="${points[3].y}" stroke="#dc2626" stroke-width="2" stroke-dasharray="3" />
        <line x1="${points[1].x}" y1="${points[1].y}" x2="${points[4].x}" y2="${points[4].y}" stroke="#2563eb" stroke-width="2" stroke-dasharray="3" />
        <line x1="${points[2].x}" y1="${points[2].y}" x2="${points[5].x}" y2="${points[5].y}" stroke="#059669" stroke-width="2" stroke-dasharray="3" />
      `;
    }

    // Draw vertices and center
    svgHtml += `<circle cx="${Ox}" cy="${Oy}" r="5" fill="#0f172a" />
      <text x="${Ox}" y="${Oy - 10}" font-size="12" font-weight="bold" fill="#0f172a" text-anchor="middle">O</text>`;

    points.forEach(p => {
      svgHtml += `
        <circle cx="${p.x}" cy="${p.y}" r="4" fill="#0f172a" />
        <text x="${p.x + (p.x > Ox ? 8 : -14)}" y="${p.y + (p.y > Oy ? 14 : -6)}" font-size="13" font-weight="bold" fill="#0f172a">${p.label}</text>
      `;
    });

    hexSvg.innerHTML = svgHtml;

    // Update buttons state
    puzzleTriBtns.forEach((btn, idx) => {
      if (state.hexPuzzlePieces[idx]) {
        btn.classList.add('placed');
        btn.textContent = `✓ Mảnh ${idx + 1} (Đã ghép)`;
      } else {
        btn.classList.remove('placed');
        btn.textContent = `Mảnh ${idx + 1}: △O${labels[idx]}${labels[(idx + 1) % 6]}`;
      }
    });

    if (countPlaced === 6) {
      hexReadout.innerHTML = `🎉 <strong>Hoàn thành xuất sắc!</strong> Lục giác đều $ABCDEF$ được ghép từ đúng 6 tam giác đều quanh tâm $O$. Có 3 đường chéo chính $AD, BE, CF$ bằng nhau!`;
      unlockBadge(2);
    } else {
      hexReadout.innerHTML = `Đã ghép: <strong>${countPlaced}/6</strong> hình tam giác đều. Bấm các nút mảnh ghép để tiếp tục!`;
    }
  }

  // --- SETUP LAB EVENTS ---
  function setupLabEvents() {
    // Lab 1
    triSideSlider.addEventListener('input', () => {
      renderLab1();
      unlockBadge(0);
    });

    btnToggleTriAngles.addEventListener('click', () => {
      showTriAngles = !showTriAngles;
      btnToggleTriAngles.textContent = showTriAngles ? '📐 Tắt Số Đo Góc' : '📐 Bật Số Đo Góc (60°)';
      renderLab1();
      unlockBadge(0);
    });

    btnToggleTriSides.addEventListener('click', () => {
      showTriSides = !showTriSides;
      btnToggleTriSides.textContent = showTriSides ? '📏 Tắt Nhãn Cạnh' : '📏 Bật Nhãn Cạnh Bằng Nhau';
      renderLab1();
      unlockBadge(0);
    });

    // Lab 2
    btnToggleSqDiag.addEventListener('click', () => {
      showSqDiag = !showSqDiag;
      btnToggleSqDiag.textContent = showSqDiag ? '✖️ Tắt Đường Chéo' : '✖️ Bật 2 Đường Chéo (AC = BD)';
      renderLab2();
      unlockBadge(1);
    });

    btnToggleSqRightangles.addEventListener('click', () => {
      showSqRightangles = !showSqRightangles;
      btnToggleSqRightangles.textContent = showSqRightangles ? '📐 Tắt Góc Vuông' : '📐 Bật Ký Hiệu 4 Góc Vuông (90°)';
      renderLab2();
      unlockBadge(1);
    });

    // Lab 3
    puzzleTriBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        initAudio();
        const triIdx = parseInt(btn.dataset.tri);
        state.hexPuzzlePieces[triIdx] = !state.hexPuzzlePieces[triIdx];
        playTone(350 + triIdx * 60, 0.15, 'sine');
        renderLab3();
        saveState();
      });
    });

    btnResetHexPuzzle.addEventListener('click', () => {
      state.hexPuzzlePieces = [false, false, false, false, false, false];
      renderLab3();
      saveState();
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

      if (state.streak >= 3) {
        unlockBadge(3); // Streak 3 badge
      }
    } else {
      state.streak = 0;
      playErrorSound();
    }

    // Check Badge 5: All 10 correct
    const correctCount = Object.values(state.answeredQuestions).filter(a => a.correct).length;
    if (correctCount === 10) {
      unlockBadge(4); // Champion badge
    }

    saveState();
    updateHUD();
    renderQuiz();
  }

  // RUN APP ON DOM READY
  document.addEventListener('DOMContentLoaded', init);
})();
