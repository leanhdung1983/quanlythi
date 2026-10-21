/* =========================================================
   BÀI 19: HÌNH CHỮ NHẬT • HÌNH THOI • HÌNH BÌNH HÀNH • HÌNH THANG CÂN
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
    playTone(523.25, 0.12, 'sine', 0.2); // C5
    setTimeout(() => playTone(659.25, 0.15, 'sine', 0.2), 100); // E5
    setTimeout(() => playTone(783.99, 0.25, 'triangle', 0.25), 220); // G5
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
  const STORAGE_KEY = 'toan6_bai19_progress';

  let state = {
    studentName: 'Kỹ Sư Hình Học Lớp 6',
    avatar: '💎',
    score: 0,
    stars: 0,
    streak: 0,
    maxStreak: 0,
    sound: true,
    badges: [false, false, false, false, false],
    answeredQuestions: {},
    viewedTabs: { rect: true, rhombus: false, parallelogram: false, trapezoid: false }
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

  // --- QUIZ DATA (SGK BT 4.8 - 4.15 & THỰC TẾ) ---
  const quizData = [
    {
      id: 1,
      source: 'SGK BT 4.8 (Hai đường chéo bằng nhau)',
      question: 'Trong các hình: hình chữ nhật, hình thoi, hình bình hành, hình thang cân, những hình nào LUÔN CÓ hai đường chéo bằng nhau?',
      options: [
        'A. Hình chữ nhật và hình thang cân',
        'B. Hình thoi và hình bình hành',
        'C. Chỉ có hình thoi',
        'D. Tất cả 4 hình trên'
      ],
      correct: 0,
      explanation: 'Hình chữ nhật và hình thang cân là hai hình luôn có hai đường chéo bằng nhau. (Hình vuông cũng có, nhưng không nằm trong danh sách câu hỏi này).'
    },
    {
      id: 2,
      source: 'SGK BT 4.9 (Hai đường chéo vuông góc)',
      question: 'Trong các hình đã học ở Bài 19, hình nào LUÔN CÓ hai đường chéo vuông góc với nhau?',
      options: [
        'A. Hình thoi',
        'B. Hình chữ nhật',
        'C. Hình bình hành',
        'D. Hình thang cân'
      ],
      correct: 0,
      explanation: 'Hình thoi luôn có hai đường chéo vuông góc với nhau tại trung điểm của mỗi đường.'
    },
    {
      id: 3,
      source: 'SGK BT 4.11 (Chu vi hình thoi)',
      question: 'Một hình thoi có độ dài cạnh bằng 6 cm. Chu vi của hình thoi đó là:',
      options: [
        'A. 24 cm',
        'B. 36 cm',
        'C. 12 cm',
        'D. 18 cm'
      ],
      correct: 0,
      explanation: 'Hình thoi có 4 cạnh bằng nhau, do đó chu vi là: C = 4 × 6 = 24 (cm).'
    },
    {
      id: 4,
      source: 'SGK Tính chất hình bình hành',
      question: 'Trong hình bình hành ABCD, khẳng định nào sau đây là SAI?',
      options: [
        'A. AB song song với CD và AB = CD',
        'B. AD song song với BC và AD = BC',
        'C. Hai đường chéo AC và BD luôn bằng nhau',
        'D. Hai đường chéo cắt nhau tại trung điểm của mỗi đường'
      ],
      correct: 2,
      explanation: 'Hai đường chéo của hình bình hành nói chung không bằng nhau (chỉ bằng nhau khi nó trở thành hình chữ nhật).'
    },
    {
      id: 5,
      source: 'SGK BT 4.12 (Ứng dụng cổng xếp)',
      question: 'Cánh cổng xếp kéo dãn ở cổng trường học, cơ quan được ghép nối từ các thanh kim loại đan chéo tạo thành các mắt lưới hình gì?',
      options: [
        'A. Hình thoi',
        'B. Hình tròn',
        'C. Hình thang cân',
        'D. Hình tam giác vuông'
      ],
      correct: 0,
      explanation: 'Khung cổng xếp được cấu tạo từ các mắt hình thoi có 4 cạnh bằng nhau, có thể co dãn dễ dàng bằng cách thay đổi góc đỉnh.'
    },
    {
      id: 6,
      source: 'SGK Hình thang cân (Đặc điểm)',
      question: 'Cho hình thang cân ABCD với hai cạnh đáy là AB và CD. Khẳng định nào sau đây là ĐÚNG?',
      options: [
        'A. Hai cạnh bên bằng nhau: AD = BC',
        'B. Hai cạnh đáy bằng nhau: AB = CD',
        'C. Hai đường chéo vuông góc với nhau',
        'D. Bốn góc ở 4 đỉnh đều bằng 90°'
      ],
      correct: 0,
      explanation: 'Hình thang cân có hai cạnh bên bằng nhau (AD = BC), hai góc kề một đáy bằng nhau và hai đường chéo bằng nhau.'
    },
    {
      id: 7,
      source: 'SGK BT 4.13 (Mối liên hệ)',
      question: 'Nếu một hình bình hành có một góc vuông (90°) thì hình bình hành đó trở thành:',
      options: [
        'A. Hình chữ nhật',
        'B. Hình thoi',
        'C. Hình thang cân',
        'D. Hình tam giác đều'
      ],
      correct: 0,
      explanation: 'Hình bình hành có 1 góc vuông thì 3 góc còn lại cũng vuông (90°), do đó nó chính là hình chữ nhật.'
    },
    {
      id: 8,
      source: 'SGK Cắt nhau tại trung điểm',
      question: 'Hai đường chéo của hình thoi cắt nhau tại điểm O. Khẳng định nào sau đây ĐÚNG về điểm O?',
      options: [
        'A. O là trung điểm của cả hai đường chéo AC và BD',
        'B. O nằm ngoài hình thoi',
        'C. O là một đỉnh của hình thoi',
        'D. OA dài gấp đôi OC'
      ],
      correct: 0,
      explanation: 'Hai đường chéo của hình thoi luôn cắt nhau tại trung điểm của mỗi đường (OA = OC, OB = OD).'
    },
    {
      id: 9,
      source: 'SGK BT 4.14 (Thang leo)',
      question: 'Một chiếc thang leo có hai thanh dọc đối xứng bằng nhau và các bậc thang song song với nhau. Mỗi ô giữa hai bậc thang liền kề có dạng là:',
      options: [
        'A. Hình thang cân',
        'B. Hình thoi',
        'C. Hình tam giác đều',
        'D. Hình ngũ giác'
      ],
      correct: 0,
      explanation: 'Do hai thanh dọc nghiêng đối xứng và các bậc thang song song có độ rộng thu nhỏ dần lên đỉnh, mỗi ô tạo thành một hình thang cân.'
    },
    {
      id: 10,
      source: 'SGK BT 4.15 (Chu vi hình chữ nhật)',
      question: 'Một mảnh vườn hình chữ nhật có chiều dài 12 m và chiều rộng 8 m. Chu vi của mảnh vườn đó là:',
      options: [
        'A. 40 m',
        'B. 96 m',
        'C. 20 m',
        'D. 24 m'
      ],
      correct: 0,
      explanation: 'Chu vi hình chữ nhật bằng: C = 2 × (chiều dài + chiều rộng) = 2 × (12 + 8) = 40 (m).'
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

  // Tab elements
  const tabBtns = document.querySelectorAll('.shape-tab-btn');
  const tabPanes = document.querySelectorAll('.shape-tab-pane');

  // Lab 1: Morph Parallelogram -> Rect
  const angleSlider = document.getElementById('angle-slider');
  const angleVal = document.getElementById('angle-val');
  const btnSnap90 = document.getElementById('btn-snap-90');
  const btnToggleMorphDiag = document.getElementById('btn-toggle-morph-diag');
  const morphSvg = document.getElementById('morph-svg');
  const morphReadout = document.getElementById('morph-readout');
  let showMorphDiag = true;

  // Lab 2: Rhombus
  const btnToggleRhombusPerp = document.getElementById('btn-toggle-rhombus-perp');
  const btnToggleRhombusTriangles = document.getElementById('btn-toggle-rhombus-triangles');
  const rhombusSvg = document.getElementById('rhombus-svg');
  const rhombusReadout = document.getElementById('rhombus-readout');
  let showRhombusPerp = true;
  let showRhombusTriangles = false;

  // --- INITIALIZATION ---
  function init() {
    loadState();
    updateHUD();
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
      if (confirm('Em có chắc chắn muốn đặt lại điểm số và bài tập của Bài 19 không?')) {
        state.score = 0;
        state.stars = 0;
        state.streak = 0;
        state.badges = [false, false, false, false, false];
        state.answeredQuestions = {};
        state.viewedTabs = { rect: true, rhombus: false, parallelogram: false, trapezoid: false };
        saveState();
        updateHUD();
        renderQuiz();
        checkBadges();
      }
    });

    btnReplayLesson.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    setupTabs();
    setupLabEvents();
  }

  // --- TAB CONTROLLER ---
  function setupTabs() {
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        initAudio();
        const tabKey = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.remove('active'));
        tabPanes.forEach(p => p.classList.remove('active'));

        btn.classList.add('active');
        const targetPane = document.getElementById(`pane-${tabKey}`);
        if (targetPane) targetPane.classList.add('active');

        state.viewedTabs[tabKey] = true;
        playTone(400, 0.1, 'sine');
        saveState();

        // Check Badge 3: Viewed all 4 tabs
        const allViewed = Object.values(state.viewedTabs).every(v => v === true);
        if (allViewed) {
          unlockBadge(2);
        }
      });
    });
  }

  // --- HUD & BADGES ---
  function getRank(score) {
    if (score >= 200) return 'Đại Sư Tứ Giác';
    if (score >= 140) return 'Kỹ Sư Hình Học';
    if (score >= 80) return 'Nhà Khám Phá Tứ Giác';
    return 'Tập Sự Tứ Giác';
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

  // --- LAB 1: MORPH PARALLELOGRAM -> RECTANGLE ---
  function renderLab1() {
    const angleDeg = parseInt(angleSlider.value);
    angleVal.textContent = angleDeg;
    const angleRad = (angleDeg * Math.PI) / 180;

    const baseWidth = 160;
    const sideLen = 110;
    const height = sideLen * Math.sin(angleRad);
    const offsetX = sideLen * Math.cos(angleRad);

    const startX = 60;
    const startY = 175;

    // Vertices D, C, B, A
    const Dx = startX;
    const Dy = startY;
    const Cx = Dx + baseWidth;
    const Cy = startY;
    const Ax = Dx + offsetX;
    const Ay = Dy - height;
    const Bx = Ax + baseWidth;
    const By = Ay;

    let svgHtml = `
      <polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy} ${Dx},${Dy}" 
        fill="${angleDeg === 90 ? '#e0e7ff' : '#f8fafc'}" 
        stroke="${angleDeg === 90 ? '#4f46e5' : '#64748b'}" 
        stroke-width="3" />
    `;

    // Angle indicator at D
    svgHtml += `
      <path d="M ${Dx + 24} ${Dy} A 24 24 0 0 0 ${Dx + 24 * Math.cos(angleRad)} ${Dy - 24 * Math.sin(angleRad)}" fill="none" stroke="#e11d48" stroke-width="2" />
      <text x="${Dx + 34}" y="${Dy - 10}" font-size="12" font-weight="bold" fill="#e11d48">${angleDeg}°</text>
    `;

    // Diagonals AC and BD
    if (showMorphDiag) {
      svgHtml += `
        <line x1="${Ax}" y1="${Ay}" x2="${Cx}" y2="${Cy}" stroke="#e11d48" stroke-width="2" stroke-dasharray="4" />
        <line x1="${Bx}" y1="${By}" x2="${Dx}" y2="${Dy}" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="4" />
      `;
    }

    // Right-angle marker if angle == 90
    if (angleDeg === 90) {
      const box = 14;
      svgHtml += `
        <polyline points="${Dx},${Dy - box} ${Dx + box},${Dy - box} ${Dx + box},${Dy}" fill="none" stroke="#4f46e5" stroke-width="2" />
        <polyline points="${Ax},${Ay + box} ${Ax + box},${Ay + box} ${Ax + box},${Ay}" fill="none" stroke="#4f46e5" stroke-width="2" />
      `;
    }

    // Vertex dots & labels
    svgHtml += `
      <circle cx="${Ax}" cy="${Ay}" r="4" fill="#4f46e5" />
      <text x="${Ax - 12}" y="${Ay - 6}" font-size="13" font-weight="bold" fill="#0f172a">A</text>
      <circle cx="${Bx}" cy="${By}" r="4" fill="#4f46e5" />
      <text x="${Bx + 6}" y="${By - 6}" font-size="13" font-weight="bold" fill="#0f172a">B</text>
      <circle cx="${Cx}" cy="${Cy}" r="4" fill="#4f46e5" />
      <text x="${Cx + 6}" y="${Cy + 14}" font-size="13" font-weight="bold" fill="#0f172a">C</text>
      <circle cx="${Dx}" cy="${Dy}" r="4" fill="#4f46e5" />
      <text x="${Dx - 14}" y="${Dy + 14}" font-size="13" font-weight="bold" fill="#0f172a">D</text>
    `;

    morphSvg.innerHTML = svgHtml;

    if (angleDeg === 90) {
      morphReadout.innerHTML = `🎉 <strong>Góc đạt 90°!</strong> Hình bình hành đã biến đổi thành <strong>HÌNH CHỮ NHẬT</strong>: 4 góc vuông, 2 đường chéo $AC = BD$ bằng nhau!`;
      unlockBadge(0);
    } else {
      morphReadout.innerHTML = `Hình Bình Hành $ABCD$ (góc $\\widehat{D} = ${angleDeg}^\\circ$): Cạnh đối song song và bằng nhau. Hai đường chéo không bằng nhau.`;
    }
  }

  // --- LAB 2: RHOMBUS DIAGONALS ---
  function renderLab2() {
    const Ox = 160, Oy = 120;
    const d1 = 110; // AC half-length
    const d2 = 70;  // BD half-length

    const Ax = Ox - d1, Ay = Oy;
    const Cx = Ox + d1, Cy = Oy;
    const Bx = Ox, By = Oy - d2;
    const Dx = Ox, Dy = Oy + d2;

    let svgHtml = '';

    // Triangles fill
    if (showRhombusTriangles) {
      svgHtml += `
        <polygon points="${Ox},${Oy} ${Ax},${Ay} ${Bx},${By}" fill="#fed7aa" stroke="none" />
        <polygon points="${Ox},${Oy} ${Bx},${By} ${Cx},${Cy}" fill="#bfdbfe" stroke="none" />
        <polygon points="${Ox},${Oy} ${Cx},${Cy} ${Dx},${Dy}" fill="#bbf7d0" stroke="none" />
        <polygon points="${Ox},${Oy} ${Dx},${Dy} ${Ax},${Ay}" fill="#fbcfe8" stroke="none" />
      `;
    }

    // Rhombus outline
    svgHtml += `
      <polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy} ${Dx},${Dy}" 
        fill="${showRhombusTriangles ? 'none' : '#ffe4e6'}" 
        stroke="#e11d48" stroke-width="3" />
    `;

    // Diagonals AC and BD
    svgHtml += `
      <line x1="${Ax}" y1="${Ay}" x2="${Cx}" y2="${Cy}" stroke="#4f46e5" stroke-width="2.5" />
      <line x1="${Bx}" y1="${By}" x2="${Dx}" y2="${Dy}" stroke="#0d9488" stroke-width="2.5" />
    `;

    // Perpendicular symbol at center O
    if (showRhombusPerp) {
      const b = 12;
      svgHtml += `
        <polyline points="${Ox},${Oy - b} ${Ox + b},${Oy - b} ${Ox + b},${Oy}" fill="none" stroke="#0f172a" stroke-width="2" />
        <text x="${Ox + 16}" y="${Oy - 14}" font-size="11" font-weight="bold" fill="#0f172a">90°</text>
      `;
    }

    // Center point & vertices
    svgHtml += `
      <circle cx="${Ox}" cy="${Oy}" r="4" fill="#0f172a" />
      <text x="${Ox - 14}" y="${Oy - 8}" font-size="12" font-weight="bold" fill="#0f172a">O</text>
      <circle cx="${Ax}" cy="${Ay}" r="4" fill="#e11d48" />
      <text x="${Ax - 18}" y="${Ay + 5}" font-size="13" font-weight="bold" fill="#0f172a">A</text>
      <circle cx="${Bx}" cy="${By}" r="4" fill="#e11d48" />
      <text x="${Bx}" y="${By - 8}" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">B</text>
      <circle cx="${Cx}" cy="${Cy}" r="4" fill="#e11d48" />
      <text x="${Cx + 8}" y="${Cy + 5}" font-size="13" font-weight="bold" fill="#0f172a">C</text>
      <circle cx="${Dx}" cy="${Dy}" r="4" fill="#e11d48" />
      <text x="${Dx}" y="${Dy + 18}" font-size="13" font-weight="bold" fill="#0f172a" text-anchor="middle">D</text>
    `;

    rhombusSvg.innerHTML = svgHtml;
    rhombusReadout.innerHTML = `Hình thoi $ABCD$: $AB = BC = CD = DA$. Hai đường chéo $AC \\perp BD$ tại trung điểm $O$ chia hình thoi thành 4 tam giác vuông bằng nhau.`;
  }

  // --- SETUP LAB EVENTS ---
  function setupLabEvents() {
    angleSlider.addEventListener('input', () => {
      renderLab1();
    });

    btnSnap90.addEventListener('click', () => {
      angleSlider.value = 90;
      renderLab1();
      playTone(600, 0.2, 'triangle');
    });

    btnToggleMorphDiag.addEventListener('click', () => {
      showMorphDiag = !showMorphDiag;
      renderLab1();
    });

    btnToggleRhombusPerp.addEventListener('click', () => {
      showRhombusPerp = !showRhombusPerp;
      renderLab2();
      unlockBadge(1);
    });

    btnToggleRhombusTriangles.addEventListener('click', () => {
      showRhombusTriangles = !showRhombusTriangles;
      renderLab2();
      unlockBadge(1);
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
