/* =========================================================
   BÀI 22: HÌNH CÓ TÂM ĐỐI XỨNG
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
  const STORAGE_KEY = 'toan6_bai22_progress';

  let state = {
    studentName: 'Kỹ Sư Đối Xứng Tâm Lớp 6',
    avatar: '🌀',
    score: 0,
    stars: 0,
    streak: 0,
    maxStreak: 0,
    sound: true,
    badges: [false, false, false, false, false],
    answeredQuestions: {},
    spinShape: 'pinwheel', // 'pinwheel' | 'n' | 's' | 'rect' | 'tri' | 'a'
    spinAngle: 0
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

  // --- QUIZ DATA (SGK BT 5.7 - 5.12) ---
  const quizData = [
    {
      id: 1,
      source: 'SGK Định nghĩa Tâm đối xứng',
      question: 'Điểm O được gọi là tâm đối xứng của hình H nếu:',
      options: [
        'A. Khi quay hình H quanh điểm O đúng 180° (nửa vòng) thì hình đó trùng khít với chính nó ở vị trí ban đầu',
        'B. Khi quay hình H quanh điểm O đúng 90° (một góc vuông) thì hình trùng khít',
        'C. Điểm O là một đỉnh thuộc viền ngoài của hình H',
        'D. Điểm O chia hình H thành hai phần có chu vi khác nhau'
      ],
      correct: 0,
      explanation: 'Tâm đối xứng O là điểm mà khi quay hình quanh O đúng nửa vòng (180°), hình sẽ trùng khít hoàn toàn với chính nó ở vị trí xuất phát.'
    },
    {
      id: 2,
      source: 'SGK BT 5.7 a (Đoạn thẳng)',
      question: 'Tâm đối xứng của đoạn thẳng AB là điểm nào?',
      options: [
        'A. Trung điểm của đoạn thẳng AB',
        'B. Điểm mút A',
        'C. Điểm mút B',
        'D. Đoạn thẳng không có tâm đối xứng'
      ],
      correct: 0,
      explanation: 'Trung điểm của đoạn thẳng AB chính là tâm đối xứng của đoạn thẳng đó, vì khi quay 180° quanh trung điểm, A chuyển thành B và B chuyển thành A.'
    },
    {
      id: 3,
      source: 'SGK BT 5.7 b (Hình bình hành)',
      question: 'Tâm đối xứng của hình bình hành ABCD là:',
      options: [
        'A. Giao điểm của hai đường chéo AC và BD',
        'B. Trung điểm của cạnh đáy AB',
        'C. Đỉnh A của hình bình hành',
        'D. Hình bình hành không có tâm đối xứng'
      ],
      correct: 0,
      explanation: 'Giao điểm hai đường chéo của hình bình hành chính là tâm đối xứng của nó.'
    },
    {
      id: 4,
      source: 'SGK BT 5.8 (Chữ cái in hoa có tâm)',
      question: 'Trong các chữ cái in hoa sau: N, S, Z, H, O, I, X, nhóm chữ cái nào CÓ tâm đối xứng?',
      options: [
        'A. Tất cả các chữ cái trên đều có tâm đối xứng',
        'B. Chỉ có chữ O và H',
        'C. Chỉ có chữ N và Z',
        'D. Không có chữ nào có tâm đối xứng'
      ],
      correct: 0,
      explanation: 'Các chữ N, S, Z, H, O, I, X khi quay nửa vòng 180° đều giữ nguyên hình dạng ban đầu, do đó chúng đều là các chữ cái có tâm đối xứng.'
    },
    {
      id: 5,
      source: 'SGK Chữ cái KHÔNG có tâm',
      question: 'Chữ cái in hoa nào sau đây KHÔNG CÓ tâm đối xứng?',
      options: [
        'A. Chữ A',
        'B. Chữ N',
        'C. Chữ S',
        'D. Chữ Z'
      ],
      correct: 0,
      explanation: 'Chữ A khi quay 180° sẽ bị lộn ngược đỉnh nhọn xuống dưới đất, không trùng khít với ban đầu. Vì vậy chữ A không có tâm đối xứng.'
    },
    {
      id: 6,
      source: 'SGK Lục giác đều (Tâm đối xứng)',
      question: 'Tâm đối xứng của hình lục giác đều ABCDEF là điểm nào?',
      options: [
        'A. Giao điểm của 3 đường chéo chính AD, BE, CF',
        'B. Điểm chính giữa cạnh AB',
        'C. Đỉnh A của lục giác',
        'D. Hình lục giác đều không có tâm đối xứng'
      ],
      correct: 0,
      explanation: 'Ba đường chéo chính AD, BE, CF cắt nhau tại trung điểm O của mỗi đường, điểm O này chính là tâm đối xứng của hình lục giác đều.'
    },
    {
      id: 7,
      source: 'SGK CẢNH BÁO (Tam giác đều)',
      question: 'Khẳng định nào sau đây là ĐÚNG về tâm đối xứng của hình tam giác đều?',
      options: [
        'A. Tam giác đều KHÔNG CÓ tâm đối xứng',
        'B. Tam giác đều có 1 tâm đối xứng là trọng tâm',
        'C. Tam giác đều có 3 tâm đối xứng',
        'D. Mọi đỉnh đều là tâm đối xứng'
      ],
      correct: 0,
      explanation: 'Khi quay tam giác đều 180° quanh trọng tâm, đỉnh nhọn phía trên sẽ chúc xuống dưới, không trùng khít với hình gốc. Do đó tam giác đều KHÔNG CÓ tâm đối xứng!'
    },
    {
      id: 8,
      source: 'SGK BT 5.9 (Vừa có trục, vừa có tâm)',
      question: 'Hình nào sau đây VỪA CÓ trục đối xứng, VỪA CÓ tâm đối xứng?',
      options: [
        'A. Hình vuông, hình chữ nhật, hình thoi',
        'B. Hình bình hành (không phải hình chữ nhật)',
        'C. Hình thang cân',
        'D. Tam giác đều'
      ],
      correct: 0,
      explanation: 'Hình vuông, hình chữ nhật, hình thoi đều vừa có trục đối xứng vừa có tâm đối xứng. Hình bình hành chỉ có tâm mà không có trục; hình thang cân và tam giác đều chỉ có trục mà không có tâm.'
    },
    {
      id: 9,
      source: 'SGK BT 5.10 (Chong chóng quay)',
      question: 'Vì sao chong chóng 4 cánh có tâm đối xứng?',
      options: [
        'A. Vì khi quay 180° quanh trục giữa, mỗi cánh quay đúng vào vị trí của cánh đối diện',
        'B. Vì chong chóng có 4 cạnh bằng nhau',
        'C. Vì chong chóng bay được trong gió',
        'D. Vì chong chóng có 4 góc vuông'
      ],
      correct: 0,
      explanation: 'Cứ mỗi cặp 2 cánh đối diện qua trục tâm tạo thành một đường thẳng và cách đều tâm, do đó khi quay 180° quanh tâm thì 4 cánh trùng khít hoàn toàn.'
    },
    {
      id: 10,
      source: 'SGK Hình tròn (Tâm đối xứng)',
      question: 'Tâm đối xứng của hình tròn tâm O bán kính R là:',
      options: [
        'A. Chính là tâm O của hình tròn',
        'B. Một điểm bất kỳ nằm trên đường tròn',
        'C. Trung điểm của một bán kính',
        'D. Hình tròn không có tâm đối xứng'
      ],
      correct: 0,
      explanation: 'Tâm O của hình tròn chính là tâm đối xứng duy nhất của hình tròn đó.'
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

  // Lab 1: Rotational Spinner Elements
  const btnSpinPinwheel = document.getElementById('btn-spin-pinwheel');
  const btnSpinN = document.getElementById('btn-spin-n');
  const btnSpinS = document.getElementById('btn-spin-s');
  const btnSpinRect = document.getElementById('btn-spin-rect');
  const btnSpinTri = document.getElementById('btn-spin-tri');
  const btnSpinA = document.getElementById('btn-spin-a');

  const spinSlider = document.getElementById('spin-slider');
  const spinDegVal = document.getElementById('spin-deg-val');
  const btnQuick180 = document.getElementById('btn-quick-180');
  const btnQuick0 = document.getElementById('btn-quick-0');
  const spinSvg = document.getElementById('spin-svg');
  const spinReadout = document.getElementById('spin-readout');

  // --- INITIALIZATION ---
  function init() {
    loadState();
    updateHUD();
    renderSpinner();
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
      if (confirm('Em có chắc chắn muốn đặt lại điểm số và bài tập của Bài 22 không?')) {
        state.score = 0;
        state.stars = 0;
        state.streak = 0;
        state.badges = [false, false, false, false, false];
        state.answeredQuestions = {};
        state.spinAngle = 0;
        spinSlider.value = 0;
        saveState();
        updateHUD();
        renderSpinner();
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
    if (score >= 200) return 'Đại Kiện Tướng Đối Xứng Tâm';
    if (score >= 140) return 'Kỹ Sư Hình Học Cấp Cao';
    if (score >= 80) return 'Nhà Khám Phá Tâm Quay';
    return 'Tập Sự Đối Xứng Tâm';
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

  // --- LAB 1: 180° ROTATIONAL SPINNER ---
  function getShapeFragment(shapeType) {
    const cx = 170, cy = 130;
    if (shapeType === 'pinwheel') {
      // 4 pinwheel blades
      return `
        <polygon points="${cx},${cy} ${cx},${cy - 75} ${cx - 35},${cy - 40}" fill="#0891b2" stroke="#0e7490" stroke-width="2" />
        <polygon points="${cx},${cy} ${cx + 75},${cy} ${cx + 40},${cy - 35}" fill="#f97316" stroke="#c2410c" stroke-width="2" />
        <polygon points="${cx},${cy} ${cx},${cy + 75} ${cx + 35},${cy + 40}" fill="#10b981" stroke="#047857" stroke-width="2" />
        <polygon points="${cx},${cy} ${cx - 75},${cy} ${cx - 40},${cy + 35}" fill="#8b5cf6" stroke="#6d28d9" stroke-width="2" />
      `;
    } else if (shapeType === 'n') {
      // Letter N centered at (170, 130)
      return `
        <polygon points="120,60 145,60 145,150 195,60 220,60 220,200 195,200 195,110 145,200 120,200" fill="#0284c7" stroke="#0369a1" stroke-width="2.5" />
      `;
    } else if (shapeType === 's') {
      // Letter S
      return `
        <path d="M 210,85 C 210,65 190,60 170,60 C 140,60 130,75 130,95 C 130,125 210,125 210,165 C 210,190 190,200 170,200 C 140,200 125,185 125,165 L 145,165 C 145,178 155,185 170,185 C 185,185 192,178 192,165 C 192,140 112,140 112,95 C 112,70 135,45 170,45 C 205,45 228,68 228,85 Z" fill="#ec4899" stroke="#be185d" stroke-width="2" />
      `;
    } else if (shapeType === 'rect') {
      // Rectangle 140x80
      return `
        <rect x="100" y="90" width="140" height="80" fill="#cffafe" stroke="#0891b2" stroke-width="3" />
        <line x1="100" y1="90" x2="240" y2="170" stroke="#0891b2" stroke-width="1.5" stroke-dasharray="3" />
        <line x1="100" y1="170" x2="240" y2="90" stroke="#0891b2" stroke-width="1.5" stroke-dasharray="3" />
      `;
    } else if (shapeType === 'tri') {
      // Equilateral triangle (height ~ 120)
      return `
        <polygon points="170,55 95,185 245,185" fill="#fef3c7" stroke="#d97706" stroke-width="3" />
      `;
    } else {
      // Letter A
      return `
        <polygon points="170,55 110,195 135,195 150,155 190,155 205,195 230,195" fill="#e0e7ff" stroke="#4f46e5" stroke-width="3" />
        <polygon points="170,95 155,135 185,135" fill="white" stroke="#4f46e5" stroke-width="2" />
      `;
    }
  }

  function renderSpinner() {
    const theta = state.spinAngle;
    const cx = 170, cy = 130;
    spinDegVal.textContent = theta;

    const baseShapeHtml = getShapeFragment(state.spinShape);

    let svgHtml = `
      <!-- BÓNG MA VỊ TRÍ BAN ĐẦU (GÓC 0 ĐỘ) -->
      <g opacity="0.25">
        ${baseShapeHtml}
      </g>

      <!-- HÌNH ĐANG QUAY QUANH TÂM O -->
      <g transform="rotate(${theta}, ${cx}, ${cy})">
        ${baseShapeHtml}
      </g>

      <!-- TÂM ĐỐI XỨNG O -->
      <circle cx="${cx}" cy="${cy}" r="6" fill="#dc2626" />
      <text x="${cx + 8}" y="${cy - 8}" font-size="13" font-weight="bold" fill="#dc2626">Tâm O</text>
    `;

    spinSvg.innerHTML = svgHtml;

    // Check symmetry result at 180 deg
    const hasSymmetry = ['pinwheel', 'n', 's', 'rect'].includes(state.spinShape);

    if (theta === 180) {
      if (hasSymmetry) {
        spinReadout.innerHTML = `🎉 <strong>Góc quay 180° - Trùng khít 100%!</strong> Hình này <strong>CÓ TÂM ĐỐI XỨNG</strong> là điểm $O$.`;
        unlockBadge(0);
        if (state.spinShape === 'n' || state.spinShape === 's') {
          unlockBadge(1);
        }
      } else {
        spinReadout.innerHTML = `⚠️ <strong>Góc quay 180° - Bị ngược hướng!</strong> Đỉnh bị lộn xuống dưới, không trùng khít với bóng mờ ban đầu. Hình này <strong>KHÔNG CÓ TÂM ĐỐI XỨNG</strong>!`;
        unlockBadge(2);
      }
    } else {
      spinReadout.innerHTML = `Đang quay góc $\\theta = ${theta}^\\circ$. Tiếp tục kéo đến $180^\\circ$ để kiểm tra trùng khít!`;
    }
  }

  // --- SETUP LAB EVENTS ---
  function setupLabEvents() {
    const shapeBtns = [
      { btn: btnSpinPinwheel, id: 'pinwheel' },
      { btn: btnSpinN, id: 'n' },
      { btn: btnSpinS, id: 's' },
      { btn: btnSpinRect, id: 'rect' },
      { btn: btnSpinTri, id: 'tri' },
      { btn: btnSpinA, id: 'a' }
    ];

    shapeBtns.forEach(item => {
      item.btn.addEventListener('click', () => {
        initAudio();
        shapeBtns.forEach(b => b.btn.classList.remove('active'));
        item.btn.classList.add('active');
        state.spinShape = item.id;
        state.spinAngle = 0;
        spinSlider.value = 0;
        playTone(450, 0.1, 'sine');
        renderSpinner();
      });
    });

    spinSlider.addEventListener('input', () => {
      state.spinAngle = parseInt(spinSlider.value);
      renderSpinner();
    });

    btnQuick180.addEventListener('click', () => {
      initAudio();
      state.spinAngle = 180;
      spinSlider.value = 180;
      playSuccessSound();
      renderSpinner();
    });

    btnQuick0.addEventListener('click', () => {
      initAudio();
      state.spinAngle = 0;
      spinSlider.value = 0;
      playTone(350, 0.1, 'sine');
      renderSpinner();
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
