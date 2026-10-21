// APP.JS - ÔN TẬP CUỐI CHƯƠNG VII: SỐ THẬP PHÂN (TOÁN 6 TẬP 2)
// Audio Synthesizer, Gamified State, Interactive Labs, SGK 7.26-7.31 Arena, Badges & Cert

(function() {
  'use strict';

  // --- AUDIO SYNTHESIZER ---
  const SoundFX = {
    audioCtx: null,
    enabled: true,

    init() {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.audioCtx = new AudioContext();
        }
      }
    },

    playTone(freq, duration, type = 'sine', gainVal = 0.15) {
      if (!this.enabled || !this.audioCtx) return;
      try {
        if (this.audioCtx.state === 'suspended') {
          this.audioCtx.resume();
        }
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start();
        osc.stop(this.audioCtx.currentTime + duration);
      } catch (e) {
        console.warn('Audio error:', e);
      }
    },

    correct() {
      this.playTone(523.25, 0.1, 'triangle', 0.15); // C5
      setTimeout(() => this.playTone(659.25, 0.1, 'triangle', 0.15), 100); // E5
      setTimeout(() => this.playTone(783.99, 0.2, 'triangle', 0.18), 200); // G5
    },

    wrong() {
      this.playTone(320, 0.15, 'sawtooth', 0.15);
      setTimeout(() => this.playTone(240, 0.25, 'sawtooth', 0.15), 150);
    },

    badgeUnlock() {
      const notes = [440, 554.37, 659.25, 880];
      notes.forEach((freq, idx) => {
        setTimeout(() => this.playTone(freq, 0.15, 'sine', 0.2), idx * 120);
      });
    },

    click() {
      this.playTone(400, 0.05, 'sine', 0.05);
    }
  };

  // --- STATE MANAGEMENT ---
  const state = {
    studentName: 'Đại Kiện Tướng Thập Phân Lớp 6',
    avatar: '👑',
    score: 0,
    stars: 0,
    streak: 0,
    maxStreak: 0,
    answeredCount: 0,
    labExplored: { lab1: false, lab2: false },
    badges: {
      b1: false,
      b2: false,
      b3: false,
      b4: false,
      b5: false
    }
  };

  // --- 10 ARENA QUESTIONS (SGK 7.26 - 7.31) ---
  const questions = [
    {
      id: 1,
      source: 'SGK Bài 7.26a',
      title: 'Tính giá trị biểu thức: 15,3 - 21,5 - 3 · 1,5',
      options: [
        'A. -10,7',
        'B. 10,7',
        'C. -1,7',
        'D. -11,7'
      ],
      correctIndex: 0,
      hint: 'Nhân trước: 3 · 1,5 = 4,5. Sau đó tính từ trái sang phải: 15,3 - 21,5 - 4,5 = -6,2 - 4,5 = -10,7.',
      explanation: 'Ta có: 15,3 - 21,5 - 3 · 1,5 = 15,3 - 21,5 - 4,5 = -6,2 - 4,5 = -10,7.'
    },
    {
      id: 2,
      source: 'SGK Bài 7.26b',
      title: 'Tính giá trị biểu thức: 2 và 1/4 · [(-0,4) - 0,1]',
      options: [
        'A. -1,125',
        'B. 1,125',
        'C. -0,9',
        'D. -1,25'
      ],
      correctIndex: 0,
      hint: 'Trong ngoặc: (-0,4) - 0,1 = -0,5. Hỗn số 2 và 1/4 = 9/4 = 2,25. Tích: 2,25 · (-0,5) = -1,125.',
      explanation: 'Ta có: 2 và 1/4 = 2,25. Trong ngoặc: (-0,4) - 0,1 = -0,5. Biểu thức = 2,25 · (-0,5) = -1,125.'
    },
    {
      id: 3,
      source: 'SGK Bài 7.27a',
      title: 'Tìm x, biết: x - 5,01 = 7,02 - 2 · 1,5',
      options: [
        'A. x = 9,03',
        'B. x = 4,02',
        'C. x = 12,03',
        'D. x = 9,3'
      ],
      correctIndex: 0,
      hint: 'Vế phải: 7,02 - 3 = 4,02. Suy ra x = 4,02 + 5,01 = 9,03.',
      explanation: 'Ta có: x - 5,01 = 7,02 - 3 = 4,02. Do đó x = 4,02 + 5,01 = 9,03.'
    },
    {
      id: 4,
      source: 'SGK Bài 7.27b',
      title: 'Tìm x, biết: x : 2,5 = 1,02 + 3 · 1,5',
      options: [
        'A. x = 13,8',
        'B. x = 5,52',
        'C. x = 12,5',
        'D. x = 15,2'
      ],
      correctIndex: 0,
      hint: 'Vế phải: 1,02 + 4,5 = 5,52. Suy ra x = 5,52 · 2,5 = 13,8.',
      explanation: 'Ta có: x : 2,5 = 1,02 + 4,5 = 5,52. Vậy x = 5,52 · 2,5 = 13,8.'
    },
    {
      id: 5,
      source: 'SGK Bài 7.28a',
      title: 'Làm tròn số π ≈ 3,14159... đến hàng phần nghìn:',
      options: [
        'A. 3,141',
        'B. 3,142',
        'C. 3,14',
        'D. 3,1416'
      ],
      correctIndex: 1,
      hint: 'Chữ số ngay sau hàng phần nghìn là chữ số 5 (≥ 5) nên ta cộng thêm 1 vào 1 thành 2: 3,142.',
      explanation: 'Chữ số hàng phần nghìn là 1, chữ số ngay sau nó là 5 ≥ 5 nên ta cộng 1 vào 1 thành 2: 3,14159... ≈ 3,142.'
    },
    {
      id: 6,
      source: 'SGK Bài 7.28b',
      title: 'Làm tròn số thập phân âm -124,56 đến hàng phần mười:',
      options: [
        'A. -124,5',
        'B. -124,6',
        'C. -125',
        'D. 124,6'
      ],
      correctIndex: 1,
      hint: 'Làm tròn số đối 124,56 đến hàng phần mười được 124,6 (vì 6 ≥ 5). Vậy -124,56 ≈ -124,6.',
      explanation: 'Xét số đối 124,56 có chữ số ngay sau hàng phần mười là 6 ≥ 5 nên 124,56 ≈ 124,6. Do đó -124,56 ≈ -124,6.'
    },
    {
      id: 7,
      source: 'SGK Bài 7.29a',
      title: 'Ngựa lùn Thumbelina cao 44,5 cm. Ngựa Big Jake cao gấp 4,72 lần. Chiều cao của Big Jake là:',
      options: [
        'A. 210,04 cm',
        'B. 210,4 cm',
        'C. 209,04 cm',
        'D. 208 cm'
      ],
      correctIndex: 0,
      hint: 'Lấy 44,5 nhân 4,72.',
      explanation: 'Chiều cao của chú ngựa Big Jake là: 44,5 · 4,72 = 210,04 cm.'
    },
    {
      id: 8,
      source: 'SGK Bài 7.29b',
      title: 'Làm tròn chiều cao của Big Jake (210,04 cm) đến hàng đơn vị:',
      options: [
        'A. 210 cm',
        'B. 211 cm',
        'C. 200 cm',
        'D. 210,0 cm'
      ],
      correctIndex: 0,
      hint: 'Chữ số hàng phần mười là 0 < 5 nên giữ nguyên 210 cm.',
      explanation: 'Chữ số ngay sau hàng đơn vị là 0 < 5 nên ta giữ nguyên chữ số hàng đơn vị và bỏ phần thập phân: 210,04 cm ≈ 210 cm.'
    },
    {
      id: 9,
      source: 'SGK Bài 7.30',
      title: 'Bộ robot giá niêm yết 800 000 đ, cửa hàng giảm giá 15%. Số tiền khách hàng phải thanh toán là:',
      options: [
        'A. 680 000 đ',
        'B. 720 000 đ',
        'C. 650 000 đ',
        'D. 120 000 đ'
      ],
      correctIndex: 0,
      hint: 'Số tiền giảm: 800 000 · 15% = 120 000 đ. Phải trả: 800 000 - 120 000 = 680 000 đ.',
      explanation: 'Số tiền được giảm: 800 000 · 15 / 100 = 120 000 đồng. Số tiền phải thanh toán: 800 000 - 120 000 = 680 000 đồng.'
    },
    {
      id: 10,
      source: 'SGK Bài 7.31',
      title: 'Cầu Bạch Đằng dài 5,4 km. Trên bản đồ tỉ lệ 1 : 100 000, chiều dài cây cầu này là:',
      options: [
        'A. 5,4 cm',
        'B. 54 cm',
        'C. 0,54 cm',
        'D. 540 cm'
      ],
      correctIndex: 0,
      hint: 'Đổi: 5,4 km = 5 400 m = 540 000 cm. Trên bản đồ: 540 000 : 100 000 = 5,4 cm.',
      explanation: 'Đổi: 5,4 km = 540 000 cm. Chiều dài trên bản đồ là: 540 000 : 100 000 = 5,4 cm.'
    }
  ];

  // --- DOM ELEMENTS ---
  const el = {
    startModal: document.getElementById('start-modal'),
    btnEnterGame: document.getElementById('btn-enter-game'),
    studentNameInput: document.getElementById('student-name-input'),
    avatarBtns: document.querySelectorAll('.avatar-btn'),
    hudAvatarDisplay: document.getElementById('hud-avatar-display'),
    hudNameDisplay: document.getElementById('hud-name-display'),
    hudRankDisplay: document.getElementById('hud-rank-display'),
    hudScore: document.getElementById('hud-score'),
    hudStars: document.getElementById('hud-stars'),
    hudStreak: document.getElementById('hud-streak'),
    btnToggleSound: document.getElementById('btn-toggle-sound'),
    btnResetGame: document.getElementById('btn-reset-game'),
    // Lab 1
    btnSolve726a: document.getElementById('btn-solve-726a'),
    btnSolve726b: document.getElementById('btn-solve-726b'),
    btnSolve727a: document.getElementById('btn-solve-727a'),
    btnSolve727b: document.getElementById('btn-solve-727b'),
    solverStepDisplay: document.getElementById('solver-step-display'),
    // Lab 2
    btnSimHorse: document.getElementById('btn-sim-horse'),
    resHorse: document.getElementById('res-horse'),
    btnSimRobot: document.getElementById('btn-sim-robot'),
    resRobot: document.getElementById('res-robot'),
    btnSimBridge: document.getElementById('btn-sim-bridge'),
    resBridge: document.getElementById('res-bridge'),
    // Quiz & Badges
    quizContainer: document.getElementById('quiz-container'),
    quizProgressText: document.getElementById('quiz-progress-text'),
    btnShowCert: document.getElementById('btn-show-cert'),
    printableCertificate: document.getElementById('printable-certificate'),
    certStudentName: document.getElementById('cert-student-name'),
    certRank: document.getElementById('cert-rank'),
    certScore: document.getElementById('cert-score'),
    certDate: document.getElementById('cert-date')
  };

  // --- INIT APPLICATION ---
  function initApp() {
    SoundFX.init();

    // Avatar Selection
    el.avatarBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        el.avatarBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        state.avatar = btn.getAttribute('data-avatar');
        SoundFX.click();
      });
    });

    // Enter Game Modal
    el.btnEnterGame.addEventListener('click', () => {
      SoundFX.init();
      const val = el.studentNameInput.value.trim();
      if (val) state.studentName = val;
      el.hudNameDisplay.textContent = state.studentName;
      el.hudAvatarDisplay.textContent = state.avatar;
      el.startModal.classList.add('hidden');
      SoundFX.badgeUnlock();
      unlockBadge('b1');
    });

    // Sound Toggle
    el.btnToggleSound.addEventListener('click', () => {
      SoundFX.enabled = !SoundFX.enabled;
      el.btnToggleSound.textContent = SoundFX.enabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      SoundFX.click();
    });

    // Reset Game
    el.btnResetGame.addEventListener('click', () => {
      if (confirm('Em có chắc chắn muốn đặt lại toàn bộ điểm ôn tập?')) {
        state.score = 0;
        state.stars = 0;
        state.streak = 0;
        state.answeredCount = 0;
        updateHUD();
        renderQuiz();
        SoundFX.click();
      }
    });

    // Setup Labs
    setupLab1();
    setupLab2();

    // Render Quiz
    renderQuiz();

    // Certificate Button
    el.btnShowCert.addEventListener('click', () => {
      SoundFX.click();
      showCertificate();
    });
  }

  // --- LAB 1: SOLVER LOGIC ---
  function setupLab1() {
    el.btnSolve726a.addEventListener('click', () => {
      el.solverStepDisplay.innerHTML = `
        <strong>Bài 7.26a: $15,3 - 21,5 - 3 \\cdot 1,5$</strong><br>
        • Bước 1: Nhân ưu tiên: $3 \\cdot 1,5 = 4,5$.<br>
        • Bước 2: Thực hiện trừ từ trái sang phải: $15,3 - 21,5 = -6,2$.<br>
        • Bước 3: Tiếp tục trừ: $-6,2 - 4,5 = -(6,2 + 4,5) = \\mathbf{-10,7}$.
      `;
      SoundFX.click();
      state.labExplored.lab1 = true;
      checkLabBadges();
    });

    el.btnSolve726b.addEventListener('click', () => {
      el.solverStepDisplay.innerHTML = `
        <strong>Bài 7.26b: $2\\frac{1}{4} \\cdot [(-0,4) - 0,1]$</strong><br>
        • Bước 1: Tính trong ngoặc vuông: $(-0,4) - 0,1 = -(0,4 + 0,1) = -0,5$.<br>
        • Bước 2: Chuyển hỗn số sang số thập phân: $2\\frac{1}{4} = 2,25$.<br>
        • Bước 3: Nhân hai số khác dấu: $2,25 \\cdot (-0,5) = -(2,25 \\cdot 0,5) = \\mathbf{-1,125}$.
      `;
      SoundFX.click();
      state.labExplored.lab1 = true;
      checkLabBadges();
    });

    el.btnSolve727a.addEventListener('click', () => {
      el.solverStepDisplay.innerHTML = `
        <strong>Bài 7.27a: Tìm x: $x - 5,01 = 7,02 - 2 \\cdot 1,5$</strong><br>
        • Bước 1: Rút gọn vế phải: $2 \\cdot 1,5 = 3 \\implies 7,02 - 3 = 4,02$.<br>
        • Bước 2: Phương trình trở thành: $x - 5,01 = 4,02$.<br>
        • Bước 3: Chuyển vế đổi dấu: $x = 4,02 + 5,01 = \\mathbf{9,03}$.
      `;
      SoundFX.click();
      state.labExplored.lab1 = true;
      checkLabBadges();
    });

    el.btnSolve727b.addEventListener('click', () => {
      el.solverStepDisplay.innerHTML = `
        <strong>Bài 7.27b: Tìm x: $x : 2,5 = 1,02 + 3 \\cdot 1,5$</strong><br>
        • Bước 1: Tính vế phải: $3 \\cdot 1,5 = 4,5 \\implies 1,02 + 4,5 = 5,52$.<br>
        • Bước 2: Phương trình trở thành: $x : 2,5 = 5,52$.<br>
        • Bước 3: Tìm số bị chia: $x = 5,52 \\cdot 2,5 = \\mathbf{13,8}$.
      `;
      SoundFX.click();
      state.labExplored.lab1 = true;
      checkLabBadges();
    });
  }

  // --- LAB 2: WORLD RECORDS & BRIDGE ---
  function setupLab2() {
    el.btnSimHorse.addEventListener('click', () => {
      el.resHorse.style.display = 'block';
      SoundFX.click();
      state.labExplored.lab2 = true;
      checkLabBadges();
    });

    el.btnSimRobot.addEventListener('click', () => {
      el.resRobot.style.display = 'block';
      SoundFX.click();
      state.labExplored.lab2 = true;
      checkLabBadges();
    });

    el.btnSimBridge.addEventListener('click', () => {
      el.resBridge.style.display = 'block';
      SoundFX.click();
      state.labExplored.lab2 = true;
      checkLabBadges();
    });
  }

  function checkLabBadges() {
    if (state.labExplored.lab1 && state.labExplored.lab2 && !state.badges.b2) {
      unlockBadge('b2');
    }
  }

  // --- ARENA QUIZ ---
  function renderQuiz() {
    el.quizContainer.innerHTML = '';
    questions.forEach((q, idx) => {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.id = `q-card-${idx}`;

      card.innerHTML = `
        <div class="q-title">
          <span>Câu ${idx + 1}: ${q.title}</span>
          <span style="font-size: 0.8rem; color: #64748b; font-weight: normal;">[${q.source}]</span>
        </div>
        <div class="options-grid">
          ${q.options.map((opt, oIdx) => `
            <button class="opt-btn" data-q="${idx}" data-opt="${oIdx}">${opt}</button>
          `).join('')}
        </div>
        <div class="explanation-box" id="expl-${idx}">
          <strong>💡 Giải thích:</strong> ${q.explanation}
        </div>
      `;

      el.quizContainer.appendChild(card);
    });

    // Attach click events
    document.querySelectorAll('.opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const qIdx = parseInt(btn.getAttribute('data-q'), 10);
        const optIdx = parseInt(btn.getAttribute('data-opt'), 10);
        handleAnswer(qIdx, optIdx, btn);
      });
    });

    updateQuizProgress();
  }

  function handleAnswer(qIdx, selectedOpt, btn) {
    const q = questions[qIdx];
    const card = document.getElementById(`q-card-${qIdx}`);
    const expl = document.getElementById(`expl-${qIdx}`);

    if (card.classList.contains('answered-correct') || card.classList.contains('answered-wrong')) {
      return;
    }

    const allBtns = card.querySelectorAll('.opt-btn');
    allBtns.forEach(b => b.disabled = true);

    state.answeredCount++;

    if (selectedOpt === q.correctIndex) {
      btn.classList.add('correct');
      card.classList.add('answered-correct');
      state.score += 100;
      state.stars += 1;
      state.streak += 1;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;
      SoundFX.correct();
    } else {
      btn.classList.add('wrong');
      allBtns[q.correctIndex].classList.add('correct');
      card.classList.add('answered-wrong');
      state.streak = 0;
      SoundFX.wrong();
    }

    expl.classList.add('show');
    updateHUD();
    updateQuizProgress();
    checkBadges();
  }

  function updateQuizProgress() {
    el.quizProgressText.textContent = `${state.stars}/10 Hoàn thành xuất sắc`;
  }

  function updateHUD() {
    el.hudScore.textContent = state.score;
    el.hudStars.textContent = state.stars;
    el.hudStreak.textContent = state.streak;

    if (state.stars >= 10) {
      el.hudRankDisplay.textContent = 'Đại Kiện Tướng Chương VII';
    } else if (state.stars >= 7) {
      el.hudRankDisplay.textContent = 'Bậc Thầy Phương Trình';
    } else if (state.stars >= 4) {
      el.hudRankDisplay.textContent = 'Nhà Toán Học Kỳ Lục';
    } else {
      el.hudRankDisplay.textContent = 'Tập Sự Ôn Tập';
    }
  }

  function checkBadges() {
    if (state.stars >= 5 && !state.badges.b3) {
      unlockBadge('b3');
    }
    if (state.streak >= 5 && !state.badges.b4) {
      unlockBadge('b4');
    }
    if (state.stars === 10 && !state.badges.b5) {
      unlockBadge('b5');
    }
  }

  function unlockBadge(badgeKey) {
    state.badges[badgeKey] = true;
    const badgeNum = badgeKey.replace('b', '');
    const badgeEl = document.getElementById(`badge-${badgeNum}`);
    if (badgeEl) {
      badgeEl.classList.add('unlocked');
      SoundFX.badgeUnlock();
    }
  }

  // --- CERTIFICATE DISPLAY ---
  function showCertificate() {
    el.certStudentName.textContent = state.studentName;
    el.certRank.textContent = el.hudRankDisplay.textContent;
    el.certScore.textContent = state.score;
    const now = new Date();
    el.certDate.textContent = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
    el.printableCertificate.style.display = 'flex';
  }

  // Auto-init on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', initApp);

})();
