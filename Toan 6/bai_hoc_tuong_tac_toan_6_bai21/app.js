/* =========================================================
   BÀI 21: HÌNH CÓ TRỤC ĐỐI XỨNG
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
  const STORAGE_KEY = 'toan6_bai21_progress';

  let state = {
    studentName: 'Họa Sĩ Đối Xứng Lớp 6',
    avatar: '🦋',
    score: 0,
    stars: 0,
    streak: 0,
    maxStreak: 0,
    sound: true,
    badges: [false, false, false, false, false],
    answeredQuestions: {},
    mirrorShape: 'butterfly', // 'butterfly' | 'heart' | 'letter_a' | 'letter_h'
    isFolded: false,
    laserShape: 'tri' // 'tri' | 'sq' | 'rect' | 'rhombus' | 'circle'
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

  // --- QUIZ DATA (SGK BT 5.1 - 5.6) ---
  const quizData = [
    {
      id: 1,
      source: 'SGK Định nghĩa Trục đối xứng',
      question: 'Đường thẳng d được gọi là trục đối xứng của một hình nếu:',
      options: [
        'A. Khi gấp hình theo đường thẳng d thì hai phần của hình chồng khít lên nhau',
        'B. Đường thẳng d đi qua một đỉnh bất kỳ của hình',
        'C. Đường thẳng d chia hình thành hai hình có diện tích khác nhau',
        'D. Đường thẳng d luôn là một cạnh của hình'
      ],
      correct: 0,
      explanation: 'Trục đối xứng d là đường thẳng mà khi gấp hình theo đường đó, hai nửa của hình sẽ chồng khít hoàn toàn lên nhau.'
    },
    {
      id: 2,
      source: 'SGK BT 5.1 (Chữ cái in hoa)',
      question: 'Trong các chữ cái in hoa sau: M, N, P, Q, chữ cái nào CÓ trục đối xứng?',
      options: [
        'A. Chữ M (có 1 trục đối xứng thẳng đứng)',
        'B. Chữ N',
        'C. Chữ P',
        'D. Chữ Q'
      ],
      correct: 0,
      explanation: 'Chữ M có một trục đối xứng thẳng đứng đi qua chính giữa, chia chữ thành hai nửa đối xứng nhau.'
    },
    {
      id: 3,
      source: 'SGK BT 5.1 b (Hai trục đối xứng)',
      question: 'Chữ cái in hoa nào sau đây có ĐÚNG HAI trục đối xứng (gồm 1 trục thẳng đứng và 1 trục nằm ngang)?',
      options: [
        'A. Chữ H',
        'B. Chữ A',
        'C. Chữ C',
        'D. Chữ E'
      ],
      correct: 0,
      explanation: 'Chữ H có đúng 2 trục đối xứng: một trục thẳng đứng và một trục nằm ngang đi qua thanh nối giữa.'
    },
    {
      id: 4,
      source: 'SGK BT 5.2 (Tam giác đều)',
      question: 'Một hình tam giác đều có tất cả bao nhiêu trục đối xứng?',
      options: [
        'A. 3 trục đối xứng',
        'B. 1 trục đối xứng',
        'C. 2 trục đối xứng',
        'D. 0 trục đối xứng'
      ],
      correct: 0,
      explanation: 'Tam giác đều có 3 trục đối xứng, chính là 3 đường thẳng đi qua mỗi đỉnh và vuông góc với cạnh đối diện.'
    },
    {
      id: 5,
      source: 'SGK BT 5.2 (Hình vuông)',
      question: 'Một hình vuông có tất cả bao nhiêu trục đối xứng?',
      options: [
        'A. 4 trục đối xứng',
        'B. 2 trục đối xứng',
        'C. 1 trục đối xứng',
        'D. 8 trục đối xứng'
      ],
      correct: 0,
      explanation: 'Hình vuông có 4 trục đối xứng: 2 đường trung trực của 2 cặp cạnh đối diện và 2 đường thẳng chứa 2 đường chéo.'
    },
    {
      id: 6,
      source: 'SGK Trục đối xứng Hình chữ nhật',
      question: 'Khẳng định nào sau đây là ĐÚNG về trục đối xứng của hình chữ nhật (không phải hình vuông)?',
      options: [
        'A. Có 2 trục đối xứng là 2 đường trung trực của các cạnh đối diện',
        'B. Có 2 trục đối xứng là 2 đường chéo của nó',
        'C. Có 4 trục đối xứng',
        'D. Không có trục đối xứng nào'
      ],
      correct: 0,
      explanation: 'Hình chữ nhật có 2 trục đối xứng nối trung điểm các cạnh đối. Hai đường chéo KHÔNG phải là trục đối xứng vì khi gấp theo đường chéo, hai nửa không chồng khít lên nhau.'
    },
    {
      id: 7,
      source: 'SGK BT 5.2 (Hình tròn)',
      question: 'Hình tròn có bao nhiêu trục đối xứng?',
      options: [
        'A. Vô số trục đối xứng (mọi đường thẳng đi qua tâm)',
        'B. 1 trục đối xứng',
        'C. 2 trục đối xứng',
        'D. 4 trục đối xứng'
      ],
      correct: 0,
      explanation: 'Mọi đường thẳng đi qua tâm của hình tròn đều là trục đối xứng của hình tròn đó, do vậy hình tròn có vô số trục đối xứng.'
    },
    {
      id: 8,
      source: 'SGK BT 5.4 (Biển báo giao thông)',
      question: 'Biển báo cấm đi ngược chiều (hình tròn màu đỏ, ở giữa có một vạch ngang màu trắng) có bao nhiêu trục đối xứng?',
      options: [
        'A. 2 trục đối xứng (1 trục dọc và 1 trục ngang)',
        'B. Vô số trục đối xứng',
        'C. 1 trục đối xứng',
        'D. Không có trục nào'
      ],
      correct: 0,
      explanation: 'Biển cấm đi ngược chiều có 2 trục đối xứng: một trục thẳng đứng đi qua tâm và một trục nằm ngang đi qua tâm dọc theo vạch trắng.'
    },
    {
      id: 9,
      source: 'SGK Hình thang cân',
      question: 'Hình thang cân có bao nhiêu trục đối xứng?',
      options: [
        'A. 1 trục đối xứng (đường thẳng nối trung điểm hai đáy)',
        'B. 2 trục đối xứng',
        'C. 4 trục đối xứng',
        'D. 0 trục đối xứng'
      ],
      correct: 0,
      explanation: 'Hình thang cân có duy nhất 1 trục đối xứng là đường trung trực của hai cạnh đáy.'
    },
    {
      id: 10,
      source: 'SGK Vận dụng tự nhiên',
      question: 'Trong tự nhiên, hình ảnh nào sau đây là ví dụ điển hình nhất về hình có trục đối xứng?',
      options: [
        'A. Đôi cánh của con bướm đang xòe rộng',
        'B. Cành cây khẳng khiu uốn lượn tự nhiên',
        'C. Hòn đá sỏi ven suối',
        'D. Vệt cát lượn sóng trên bờ biển'
      ],
      correct: 0,
      explanation: 'Đôi cánh bướm với thân bướm ở giữa là một tuyệt tác đối xứng tự nhiên: hai cánh bên trái và bên phải hoàn toàn giống hệt nhau về hoa văn và kích thước.'
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

  // Lab 1: Mirror Fold
  const btnShapeButterfly = document.getElementById('btn-shape-butterfly');
  const btnShapeHeart = document.getElementById('btn-shape-heart');
  const btnShapeLetterA = document.getElementById('btn-shape-letter-a');
  const btnShapeLetterH = document.getElementById('btn-shape-letter-h');
  const btnFoldAction = document.getElementById('btn-fold-action');
  const btnUnfoldAction = document.getElementById('btn-unfold-action');
  const mirrorSvg = document.getElementById('mirror-svg');
  const mirrorReadout = document.getElementById('mirror-readout');

  // Lab 2: Laser Scanner
  const btnLaserTri = document.getElementById('btn-laser-tri');
  const btnLaserSq = document.getElementById('btn-laser-sq');
  const btnLaserRect = document.getElementById('btn-laser-rect');
  const btnLaserRhombus = document.getElementById('btn-laser-rhombus');
  const btnLaserCircle = document.getElementById('btn-laser-circle');
  const laserSvg = document.getElementById('laser-svg');
  const laserReadout = document.getElementById('laser-readout');

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
      if (confirm('Em có chắc chắn muốn đặt lại điểm số và bài tập của Bài 21 không?')) {
        state.score = 0;
        state.stars = 0;
        state.streak = 0;
        state.badges = [false, false, false, false, false];
        state.answeredQuestions = {};
        state.isFolded = false;
        saveState();
        updateHUD();
        renderLab1();
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
    if (score >= 200) return 'Đại Kiện Tướng Trục Đối Xứng';
    if (score >= 140) return 'Họa Sĩ Hình Học Cấp Cao';
    if (score >= 80) return 'Nhà Thám Hiểm Đối Xứng';
    return 'Tập Sự Đối Xứng';
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

  // --- LAB 1: MIRROR FOLD SIMULATOR ---
  function renderLab1() {
    const cx = 170; // Center axis line x = 170
    let svgHtml = '';

    // Draw axis line d
    svgHtml += `
      <line x1="${cx}" y1="20" x2="${cx}" y2="220" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="6" />
      <text x="${cx + 8}" y="32" font-size="13" font-weight="bold" fill="#dc2626">Trục d</text>
    `;

    const folded = state.isFolded;

    if (state.mirrorShape === 'butterfly') {
      // Wings: Right wing and Left wing
      // Left wing: M 170,120 C 130,50 70,70 90,110 C 60,140 100,180 170,140 Z
      // Right wing is symmetric across x=170 (x' = 340 - x)
      const leftWingPath = "M 170,120 C 130,50 70,70 90,110 C 60,140 100,180 170,140 Z";
      const rightWingPath = "M 170,120 C 210,50 270,70 250,110 C 280,140 240,180 170,140 Z";

      if (!folded) {
        svgHtml += `
          <!-- Cánh trái -->
          <path d="${leftWingPath}" fill="#c084fc" stroke="#7e22ce" stroke-width="2.5" />
          <circle cx="115" cy="100" r="12" fill="#f43f5e" />
          <circle cx="120" cy="145" r="8" fill="#fbbf24" />
          <!-- Cánh phải -->
          <path d="${rightWingPath}" fill="#c084fc" stroke="#7e22ce" stroke-width="2.5" />
          <circle cx="225" cy="100" r="12" fill="#f43f5e" />
          <circle cx="220" cy="145" r="8" fill="#fbbf24" />
        `;
      } else {
        // Left wing folded over to the right wing!
        svgHtml += `
          <!-- Nửa phải đã được nửa trái gấp trùng khít lên -->
          <path d="${rightWingPath}" fill="#e879f9" stroke="#c026d3" stroke-width="3" />
          <circle cx="225" cy="100" r="12" fill="#f43f5e" />
          <circle cx="220" cy="145" r="8" fill="#fbbf24" />
          <!-- Hiệu ứng viền phát sáng -->
          <text x="70" y="125" font-size="13" font-weight="bold" fill="#9333ea">Đã gấp sang phải ➔</text>
        `;
      }

      // Butterfly Body
      svgHtml += `
        <ellipse cx="170" cy="130" rx="6" ry="32" fill="#3b0764" />
        <circle cx="170" cy="94" r="7" fill="#3b0764" />
        <line x1="170" y1="90" x2="158" y2="70" stroke="#3b0764" stroke-width="2" />
        <line x1="170" y1="90" x2="182" y2="70" stroke="#3b0764" stroke-width="2" />
      `;

      mirrorReadout.innerHTML = folded ? 
        `🎉 <strong>Hai cánh bướm trùng khít hoàn hảo!</strong> Nửa trái gập sang phải trùng khớp từng đường nét và hoa văn qua trục $d$.` :
        `Đôi cánh bướm đối xứng qua thân chính giữa (trục $d$). Bấm <strong>"Gấp Nếp Trùng Khít"</strong> để kiểm tra!`;

    } else if (state.mirrorShape === 'heart') {
      const leftHeart = "M 170,190 C 130,160 80,120 80,80 C 80,50 110,40 140,55 C 158,65 166,80 170,95 Z";
      const rightHeart = "M 170,190 C 210,160 260,120 260,80 C 260,50 230,40 200,55 C 182,65 174,80 170,95 Z";

      if (!folded) {
        svgHtml += `
          <path d="${leftHeart}" fill="#fda4af" stroke="#e11d48" stroke-width="2.5" />
          <path d="${rightHeart}" fill="#fda4af" stroke="#e11d48" stroke-width="2.5" />
        `;
      } else {
        svgHtml += `
          <path d="${rightHeart}" fill="#f43f5e" stroke="#be123c" stroke-width="3" />
          <text x="60" y="120" font-size="13" font-weight="bold" fill="#e11d48">Đã gấp nếp ➔</text>
        `;
      }
      mirrorReadout.innerHTML = folded ?
        `🎉 Hình trái tim có 1 trục đối xứng dọc, hai nửa úp khít vào nhau!` :
        `Hình trái tim có 1 trục đối xứng thẳng đứng.`;

    } else if (state.mirrorShape === 'letter_a') {
      // Letter A
      if (!folded) {
        svgHtml += `
          <!-- Chữ A đầy đủ -->
          <polygon points="170,50 100,190 125,190 145,150 195,150 215,190 240,190" fill="#ede9fe" stroke="#7c3aed" stroke-width="3" />
          <polygon points="170,90 152,130 188,130" fill="white" stroke="#7c3aed" stroke-width="2.5" />
        `;
      } else {
        svgHtml += `
          <!-- Nửa phải của chữ A khi gấp -->
          <polygon points="170,50 170,190 215,190 240,190 195,150 170,150" fill="#c4b5fd" stroke="#6d28d9" stroke-width="3" />
          <text x="60" y="125" font-size="13" font-weight="bold" fill="#7c3aed">Gấp đôi chữ A ➔</text>
        `;
      }
      mirrorReadout.innerHTML = `Chữ cái <strong>A</strong> có 1 trục đối xứng thẳng đứng chia đôi chữ thành 2 phần cân xứng.`;

    } else {
      // Letter H (2 axes)
      svgHtml += `
        <line x1="30" y1="120" x2="310" y2="120" stroke="#0ea5e9" stroke-width="2" stroke-dasharray="4" />
        <text x="260" y="112" font-size="12" font-weight="bold" fill="#0ea5e9">Trục ngang</text>
      `;
      if (!folded) {
        svgHtml += `
          <!-- Chữ H -->
          <rect x="115" y="55" width="25" height="130" fill="#ddd6fe" stroke="#6d28d9" stroke-width="2.5" />
          <rect x="200" y="55" width="25" height="130" fill="#ddd6fe" stroke="#6d28d9" stroke-width="2.5" />
          <rect x="140" y="105" width="60" height="30" fill="#ddd6fe" stroke="#6d28d9" stroke-width="2.5" />
        `;
      } else {
        svgHtml += `
          <rect x="200" y="55" width="25" height="130" fill="#a78bfa" stroke="#5b21b6" stroke-width="3" />
          <rect x="170" y="105" width="30" height="30" fill="#a78bfa" stroke="#5b21b6" stroke-width="3" />
          <text x="50" y="125" font-size="13" font-weight="bold" fill="#6d28d9">Gấp khít qua trục dọc ➔</text>
        `;
      }
      mirrorReadout.innerHTML = `Chữ cái <strong>H</strong> có tới <strong>2 trục đối xứng</strong>: 1 trục thẳng đứng và 1 trục nằm ngang!`;
    }

    mirrorSvg.innerHTML = svgHtml;
  }

  // --- LAB 2: LASER SYMMETRY SCANNER ---
  function renderLab2() {
    let svgHtml = '';
    const cx = 160, cy = 120;

    // Reset styles
    [btnLaserTri, btnLaserSq, btnLaserRect, btnLaserRhombus, btnLaserCircle].forEach(b => b.classList.remove('active'));

    if (state.laserShape === 'tri') {
      btnLaserTri.classList.add('active');
      const R = 80;
      const pA = { x: cx, y: cy - R };
      const pB = { x: cx - R * Math.cos(Math.PI / 6), y: cy + R * Math.sin(Math.PI / 6) };
      const pC = { x: cx + R * Math.cos(Math.PI / 6), y: cy + R * Math.sin(Math.PI / 6) };

      svgHtml = `
        <polygon points="${pA.x},${pA.y} ${pB.x},${pB.y} ${pC.x},${pC.y}" 
          fill="#ede9fe" stroke="#7c3aed" stroke-width="3" />
        <!-- 3 Trục đối xứng (laser đỏ) -->
        <line x1="${pA.x}" y1="${pA.y - 15}" x2="${pA.x}" y2="${cy + R + 10}" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4" />
        <line x1="${pB.x - 15}" y1="${pB.y + 8}" x2="${(pA.x + pC.x) / 2 + 10}" y2="${(pA.y + pC.y) / 2 - 8}" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4" />
        <line x1="${pC.x + 15}" y1="${pC.y + 8}" x2="${(pA.x + pB.x) / 2 - 10}" y2="${(pA.y + pB.y) / 2 - 8}" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4" />
      `;
      laserReadout.innerHTML = `Tam Giác Đều: có đúng <strong>3 trục đối xứng</strong> (3 đường trung trực kẻ từ 3 đỉnh).`;

    } else if (state.laserShape === 'sq') {
      btnLaserSq.classList.add('active');
      const s = 120;
      const x0 = cx - s / 2, y0 = cy - s / 2;

      svgHtml = `
        <rect x="${x0}" y="${y0}" width="${s}" height="${s}" fill="#fce7f3" stroke="#db2777" stroke-width="3" />
        <!-- 2 trục trung trực -->
        <line x1="${cx}" y1="${y0 - 20}" x2="${cx}" y2="${y0 + s + 20}" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4" />
        <line x1="${x0 - 20}" y1="${cy}" x2="${x0 + s + 20}" y2="${cy}" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4" />
        <!-- 2 trục đường chéo -->
        <line x1="${x0 - 15}" y1="${y0 - 15}" x2="${x0 + s + 15}" y2="${y0 + s + 15}" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="4" />
        <line x1="${x0 + s + 15}" y1="${y0 - 15}" x2="${x0 - 15}" y2="${y0 + s + 15}" stroke="#0284c7" stroke-width="2.5" stroke-dasharray="4" />
      `;
      laserReadout.innerHTML = `Hình Vuông: có đúng <strong>4 trục đối xứng</strong> (2 đường trung trực + 2 đường chéo).`;

    } else if (state.laserShape === 'rect') {
      btnLaserRect.classList.add('active');
      const w = 150, h = 90;
      const x0 = cx - w / 2, y0 = cy - h / 2;

      svgHtml = `
        <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="#e0e7ff" stroke="#4f46e5" stroke-width="3" />
        <!-- 2 trục trung trực -->
        <line x1="${cx}" y1="${y0 - 20}" x2="${cx}" y2="${y0 + h + 20}" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4" />
        <line x1="${x0 - 20}" y1="${cy}" x2="${x0 + w + 20}" y2="${cy}" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4" />
      `;
      laserReadout.innerHTML = `Hình Chữ Nhật: có đúng <strong>2 trục đối xứng</strong> (2 đường trung trực). Chú ý: Hai đường chéo KHÔNG phải trục đối xứng!`;

    } else if (state.laserShape === 'rhombus') {
      btnLaserRhombus.classList.add('active');
      const d1 = 140, d2 = 90;
      const Ax = cx - d1 / 2, Ay = cy;
      const Bx = cx, By = cy - d2 / 2;
      const Cx = cx + d1 / 2, Cy = cy;
      const Dx = cx, Dy = cy + d2 / 2;

      svgHtml = `
        <polygon points="${Ax},${Ay} ${Bx},${By} ${Cx},${Cy} ${Dx},${Dy}" 
          fill="#fef3c7" stroke="#d97706" stroke-width="3" />
        <!-- 2 trục là 2 đường chéo -->
        <line x1="${Ax - 20}" y1="${Ay}" x2="${Cx + 20}" y2="${Cy}" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4" />
        <line x1="${Bx}" y1="${By - 20}" x2="${Dx}" y2="${Dy + 20}" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="4" />
      `;
      laserReadout.innerHTML = `Hình Thoi: có đúng <strong>2 trục đối xứng</strong> (chính là 2 đường thẳng chứa hai đường chéo).`;

    } else {
      btnLaserCircle.classList.add('active');
      const R = 65;

      svgHtml = `
        <circle cx="${cx}" cy="${cy}" r="${R}" fill="#d1fae5" stroke="#059669" stroke-width="3" />
        <circle cx="${cx}" cy="${cy}" r="4" fill="#0f172a" />
        <!-- Vài đường kính minh họa vô số trục đối xứng -->
        <line x1="${cx}" y1="${cy - R - 20}" x2="${cx}" y2="${cy + R + 20}" stroke="#dc2626" stroke-width="2" stroke-dasharray="3" />
        <line x1="${cx - R - 20}" y1="${cy}" x2="${cx + R + 20}" y2="${cy}" stroke="#dc2626" stroke-width="2" stroke-dasharray="3" />
        <line x1="${cx - 60}" y1="${cy - 60}" x2="${cx + 60}" y2="${cy + 60}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3" />
        <line x1="${cx + 60}" y1="${cy - 60}" x2="${cx - 60}" y2="${cy + 60}" stroke="#f59e0b" stroke-width="1.5" stroke-dasharray="3" />
        <text x="${cx + 8}" y="${cy - 8}" font-size="12" font-weight="bold" fill="#0f172a">Tâm O</text>
      `;
      laserReadout.innerHTML = `Hình Tròn: có <strong>VÔ SỐ trục đối xứng</strong> (bất kỳ đường thẳng nào đi qua tâm $O$ đều là trục đối xứng).`;
    }

    laserSvg.innerHTML = svgHtml;
  }

  // --- SETUP LAB EVENTS ---
  function setupLabEvents() {
    // Lab 1
    const shapeBtns = [
      { btn: btnShapeButterfly, id: 'butterfly' },
      { btn: btnShapeHeart, id: 'heart' },
      { btn: btnShapeLetterA, id: 'letter_a' },
      { btn: btnShapeLetterH, id: 'letter_h' }
    ];

    shapeBtns.forEach(item => {
      item.btn.addEventListener('click', () => {
        initAudio();
        shapeBtns.forEach(b => b.btn.classList.remove('active'));
        item.btn.classList.add('active');
        state.mirrorShape = item.id;
        state.isFolded = false;
        playTone(400, 0.1, 'sine');
        renderLab1();
      });
    });

    btnFoldAction.addEventListener('click', () => {
      initAudio();
      state.isFolded = true;
      playSuccessSound();
      renderLab1();
      unlockBadge(0);
    });

    btnUnfoldAction.addEventListener('click', () => {
      initAudio();
      state.isFolded = false;
      playTone(350, 0.1, 'sine');
      renderLab1();
    });

    // Lab 2
    const laserBtns = [
      { btn: btnLaserTri, id: 'tri' },
      { btn: btnLaserSq, id: 'sq' },
      { btn: btnLaserRect, id: 'rect' },
      { btn: btnLaserRhombus, id: 'rhombus' },
      { btn: btnLaserCircle, id: 'circle' }
    ];

    laserBtns.forEach(item => {
      item.btn.addEventListener('click', () => {
        initAudio();
        state.laserShape = item.id;
        playTone(550, 0.12, 'triangle');
        renderLab2();
        unlockBadge(1);
      });
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

      // Badge 3: Question 2 or 3 correct (Chữ cái in hoa)
      if (qIdx === 1 || qIdx === 2) {
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
