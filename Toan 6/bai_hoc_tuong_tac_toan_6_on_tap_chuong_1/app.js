/* =========================================================
   ÔN TẬP CUỐI CHƯƠNG I: TẬP HỢP CÁC SỐ TỰ NHIÊN
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
  const STORAGE_KEY = 'toan6_on_tap_c1_progress';

  let state = {
    studentName: 'Nhà Vô Địch Số Tự Nhiên Lớp 6',
    avatar: '👑',
    score: 0,
    stars: 0,
    streak: 0,
    maxStreak: 0,
    sound: true,
    badges: [false, false, false, false, false],
    answeredQuestions: {},
    calcStep: 0
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

  // --- STEPS FOR LAB 1 (BT 1.57) ---
  const expressionSteps = [
    {
      title: "Biểu thức ban đầu:",
      math: "E = 21 \\cdot [(1\\,245 + 987) : 2^3 - 15 \\cdot 12] + 21",
      note: "Quy tắc: Thực hiện tính toán trong ngoặc tròn ( ) trước tiên!"
    },
    {
      title: "Bước 1: Tính trong ngoặc tròn (1 245 + 987)",
      math: "1\\,245 + 987 = 2\\,232 \\implies E = 21 \\cdot [2\\,232 : 2^3 - 15 \\cdot 12] + 21",
      note: "Đã triệt tiêu ngoặc tròn ( ). Bây giờ xử lý các phép toán trong ngoặc vuông [ ]."
    },
    {
      title: "Bước 2: Tính lũy thừa và phép nhân trong ngoặc vuông",
      math: "2^3 = 8 \\text{ và } 15 \\cdot 12 = 180 \\implies E = 21 \\cdot [2\\,232 : 8 - 180] + 21",
      note: "Lũy thừa được ưu tiên thực hiện trước, cùng với phép nhân 15 × 12."
    },
    {
      title: "Bước 3: Thực hiện phép chia trong ngoặc vuông",
      math: "2\\,232 : 8 = 279 \\implies E = 21 \\cdot [279 - 180] + 21",
      note: "Thực hiện phép chia trước phép trừ trong ngoặc vuông."
    },
    {
      title: "Bước 4: Hoàn thành phép trừ trong ngoặc vuông [ ]",
      math: "279 - 180 = 99 \\implies E = 21 \\cdot 99 + 21",
      note: "Đã hoàn thành toàn bộ phép tính trong ngoặc vuông!"
    },
    {
      title: "Bước 5: Áp dụng tính chất phân phối để tính nhanh",
      math: "E = 21 \\cdot (99 + 1) = 21 \\cdot 100 = 2\\,100",
      note: "🎉 Đặt 21 ra làm thừa số chung, thu được kết quả tuyệt đẹp là 2 100!"
    }
  ];

  // --- QUIZ DATA (SGK BT 1.54 - 1.59) ---
  const quizData = [
    {
      id: 1,
      source: 'SGK BT 1.54 a (Đếm chữ số & Tập hợp)',
      question: 'Số tự nhiên a = 15 267 021 908 có bao nhiêu chữ số và tập hợp các chữ số của nó có bao nhiêu phần tử?',
      options: [
        'A. Số a có 11 chữ số, tập hợp các chữ số gồm 8 phần tử: {0; 1; 2; 5; 6; 7; 8; 9}',
        'B. Số a có 11 chữ số, tập hợp các chữ số gồm 11 phần tử',
        'C. Số a có 10 chữ số, tập hợp gồm 8 phần tử',
        'D. Số a có 12 chữ số, tập hợp gồm 9 phần tử'
      ],
      correct: 0,
      explanation: 'Số a có đúng 11 chữ số. Trong đó các chữ số 0, 1, 2 bị lặp lại nên tập hợp các chữ số chỉ chứa mỗi phần tử 1 lần: {0; 1; 2; 5; 6; 7; 8; 9} (8 phần tử).'
    },
    {
      id: 2,
      source: 'SGK BT 1.54 b (Hàng triệu)',
      question: 'Trong số a = 15 267 021 908, chữ số hàng triệu là chữ số nào?',
      options: [
        'A. Chữ số 7',
        'B. Chữ số 6',
        'C. Chữ số 2',
        'D. Chữ số 5'
      ],
      correct: 0,
      explanation: 'Lớp triệu gồm: 2 (trăm triệu), 6 (chục triệu), 7 (triệu). Do đó chữ số hàng triệu là 7.'
    },
    {
      id: 3,
      source: 'SGK BT 1.55 a (Số liền trước & liền sau)',
      question: 'Số 2 020 lần lượt là số liền sau và số liền trước của các số nào?',
      options: [
        'A. Là số liền sau của 2 019 và là số liền trước của 2 021',
        'B. Là số liền sau của 2 021 và là số liền trước của 2 019',
        'C. Là số liền sau của 2 020 và là số liền trước của 2 020',
        'D. Là số liền sau của 2 018 và là số liền trước của 2 022'
      ],
      correct: 0,
      explanation: '2020 đứng ngay sau 2019 (2019 + 1 = 2020) và đứng ngay trước 2021 (2021 - 1 = 2020).'
    },
    {
      id: 4,
      source: 'SGK BT 1.55 c (Đặc điểm số 0)',
      question: 'Trong tập hợp các số tự nhiên N, khẳng định nào sau đây là ĐÚNG?',
      options: [
        'A. Số 0 không có số liền trước; Mọi số tự nhiên đều có số liền sau',
        'B. Số 0 không có số liền sau',
        'C. Số tự nhiên lớn nhất là một tỉ',
        'D. Số 1 không có số liền trước'
      ],
      correct: 0,
      explanation: 'Số 0 là số tự nhiên nhỏ nhất nên không có số liền trước trong N. Mọi số tự nhiên a đều có số liền sau là a + 1.'
    },
    {
      id: 5,
      source: 'SGK BT 1.56 a (Phép nhân số lớn)',
      question: 'Kết quả của phép nhân 21 759 × 1 862 là:',
      options: [
        'A. 40 515 258',
        'B. 40 515 248',
        'C. 40 514 258',
        'D. 39 515 258'
      ],
      correct: 0,
      explanation: 'Đặt tính nhân: 21 759 × 1 862 = 40 515 258.'
    },
    {
      id: 6,
      source: 'SGK BT 1.56 b (Phép chia có dư)',
      question: 'Khi thực hiện phép chia 3 789 : 231, ta thu được thương và số dư lần lượt là:',
      options: [
        'A. Thương là 16, số dư là 93',
        'B. Thương là 15, số dư là 93',
        'C. Thương là 16, số dư là 83',
        'D. Thương là 17, số dư là 0'
      ],
      correct: 0,
      explanation: '3 789 : 231 = 16 (dư 93) vì 231 × 16 + 93 = 3 696 + 93 = 3 789.'
    },
    {
      id: 7,
      source: 'SGK BT 1.57 (Biểu thức ngoặc lồng)',
      question: 'Giá trị của biểu thức: 21 · [(1 245 + 987) : 2³ - 15 · 12] + 21 bằng bao nhiêu?',
      options: [
        'A. 2 100',
        'B. 2 079',
        'C. 1 890',
        'D. 2 121'
      ],
      correct: 0,
      explanation: 'E = 21 · [2 232 : 8 - 180] + 21 = 21 · [279 - 180] + 21 = 21 · 99 + 21 = 21 · 100 = 2 100.'
    },
    {
      id: 8,
      source: 'SGK BT 1.58 (Bài toán thuê xe ô tô)',
      question: 'Khối 6 có 320 học sinh đi tham quan. Nhà trường cần thuê ÍT NHẤT bao nhiêu xe ô tô loại 45 chỗ ngồi để chở hết học sinh?',
      options: [
        'A. 8 xe',
        'B. 7 xe',
        'C. 9 xe',
        'D. 6 xe'
      ],
      correct: 0,
      explanation: 'Ta có 320 : 45 = 7 (dư 5 học sinh). Vì còn thừa 5 học sinh nên bắt buộc phải thuê thêm 1 xe nữa, tổng cộng cần ít nhất 7 + 1 = 8 xe.'
    },
    {
      id: 9,
      source: 'SGK BT 1.59 a (Bán vé rạp chiếu phim)',
      question: 'Một phòng chiếu phim có 18 hàng ghế, mỗi hàng có 18 ghế. Giá vé 50 000 đồng/vé. Tối thứ Bảy bán hết vé thì thu được:',
      options: [
        'A. 16 200 000 đồng',
        'B. 18 000 000 đồng',
        'C. 15 500 000 đồng',
        'D. 16 000 000 đồng'
      ],
      correct: 0,
      explanation: 'Tổng số ghế trong phòng là: 18 × 18 = 324 (ghế). Số tiền thu được: 324 × 50 000 = 16 200 000 (đồng).'
    },
    {
      id: 10,
      source: 'SGK BT 1.59 c (Vé chưa bán)',
      question: 'Tối thứ Hai, số tiền bán vé rạp phim thu được là 10 550 000 đồng. Hỏi có bao nhiêu vé KHÔNG bán được?',
      options: [
        'A. 113 vé',
        'B. 211 vé',
        'C. 124 vé',
        'D. 105 vé'
      ],
      correct: 0,
      explanation: 'Số vé đã bán là: 10 550 000 : 50 000 = 211 (vé). Số vé không bán được là: 324 - 211 = 113 (vé).'
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

  // Lab 1: Expression Steps
  const btnNextStep = document.getElementById('btn-next-step');
  const btnResetSteps = document.getElementById('btn-reset-steps');
  const stepsContainer = document.getElementById('steps-container');

  // Lab 2: Number Scanner
  const btnScanDigits = document.getElementById('btn-scan-digits');
  const btnScanMillions = document.getElementById('btn-scan-millions');
  const btnScanTens = document.getElementById('btn-scan-tens');
  const scanOutput = document.getElementById('scan-output');

  // --- INITIALIZATION ---
  function init() {
    loadState();
    updateHUD();
    renderSteps();
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
      if (confirm('Em có chắc chắn muốn đặt lại điểm số và bài tập Ôn tập Chương I không?')) {
        state.score = 0;
        state.stars = 0;
        state.streak = 0;
        state.badges = [false, false, false, false, false];
        state.answeredQuestions = {};
        state.calcStep = 0;
        saveState();
        updateHUD();
        renderSteps();
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
    if (score >= 200) return 'Đại Kiện Tướng Số Tự Nhiên';
    if (score >= 140) return 'Chiến Binh Số Học';
    if (score >= 80) return 'Nhà Khám Phá Chương I';
    return 'Tập Sự Chương I';
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

  // --- LAB 1: EXPRESSION STEPS ---
  function renderSteps() {
    stepsContainer.innerHTML = '';
    const currentSteps = expressionSteps.slice(0, state.calcStep + 1);

    currentSteps.forEach((s, idx) => {
      const box = document.createElement('div');
      box.className = 'step-box';
      box.innerHTML = `
        <div style="color: #b45309; font-size: 0.88rem;">${s.title}</div>
        <div style="font-size: 1.05rem; margin: 4px 0; color: #0f172a;">$${s.math}$</div>
        <div style="font-size: 0.85rem; color: #64748b; font-weight: normal;">${s.note}</div>
      `;
      stepsContainer.appendChild(box);
    });

    if (state.calcStep === expressionSteps.length - 1) {
      btnNextStep.disabled = true;
      btnNextStep.textContent = '✓ Đã Hoàn Thành Toàn Bộ Bước';
      unlockBadge(0);
    } else {
      btnNextStep.disabled = false;
      btnNextStep.textContent = `➔ Bước Tiếp Theo (${state.calcStep + 1}/${expressionSteps.length - 1})`;
    }
  }

  // --- SETUP LAB EVENTS ---
  function setupLabEvents() {
    btnNextStep.addEventListener('click', () => {
      initAudio();
      if (state.calcStep < expressionSteps.length - 1) {
        state.calcStep++;
        playTone(400 + state.calcStep * 60, 0.15, 'sine');
        renderSteps();
      }
    });

    btnResetSteps.addEventListener('click', () => {
      state.calcStep = 0;
      renderSteps();
    });

    // Lab 2
    btnScanDigits.addEventListener('click', () => {
      initAudio();
      playTone(500, 0.15, 'triangle');
      scanOutput.innerHTML = `
        <div style="color: #0369a1; margin-bottom: 6px;">🔍 KẾT QUẢ QUÉT TẬP HỢP CHỮ SỐ CỦA a:</div>
        <div>Số $a = 15\\,267\\,021\\,908$ có đúng <strong>11 chữ số</strong>.</div>
        <div>Tập hợp các chữ số khác nhau của $a$ là: <span style="background: #e0f2fe; padding: 2px 8px; border-radius: 6px; color: #0369a1;">$\\{0; 1; 2; 5; 6; 7; 8; 9\\}$</span> (gồm <strong>8 phần tử</strong>).</div>
      `;
      unlockBadge(1);
    });

    btnScanMillions.addEventListener('click', () => {
      initAudio();
      playTone(600, 0.15, 'triangle');
      scanOutput.innerHTML = `
        <div style="color: #059669; margin-bottom: 6px;">💎 KẾT QUẢ QUÉT CHỮ SỐ HÀNG TRIỆU:</div>
        <div>Lớp triệu của số $a$ là $267$ triệu:</div>
        <div>• Hàng trăm triệu: chữ số <strong>2</strong></div>
        <div>• Hàng chục triệu: chữ số <strong>6</strong></div>
        <div>• <strong>Hàng triệu: chữ số 7</strong> (có giá trị bằng $7\\,000\\,000$).</div>
      `;
      unlockBadge(1);
    });

    btnScanTens.addEventListener('click', () => {
      initAudio();
      playTone(700, 0.15, 'triangle');
      scanOutput.innerHTML = `
        <div style="color: #b45309; margin-bottom: 6px;">✨ VỊ TRÍ VÀ GIÁ TRỊ CỦA HAI CHỮ SỐ 1:</div>
        <div>1) Chữ số 1 thứ nhất nằm ở <strong>hàng chục tỉ</strong>, có giá trị bằng: <strong>$10\\,000\\,000\\,000$</strong>.</div>
        <div>2) Chữ số 1 thứ hai nằm ở <strong>hàng đơn vị nghìn</strong> (hàng nghìn), có giá trị bằng: <strong>$1\\,000$</strong> (ở cụm $021$ nghìn).</div>
      `;
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

      // Badge 3: Correct question 8 (Xe ô tô 320 học sinh)
      if (qIdx === 7) {
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
