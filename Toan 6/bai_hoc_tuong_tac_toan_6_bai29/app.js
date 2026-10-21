// APP.JS - BÀI 29: TÍNH TOÁN VỚI SỐ THẬP PHÂN (TOÁN 6 TẬP 2)
// Audio Synthesizer, Gamified State, Interactive Labs, SGK 7.5-7.11 Arena, Badges & Cert

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
    studentName: 'Siêu Máy Tính Số Học Lớp 6',
    avatar: '⚡',
    score: 0,
    stars: 0,
    streak: 0,
    maxStreak: 0,
    answeredCount: 0,
    currentOp: '+',
    labExplored: { lab1: false, lab2: false },
    badges: {
      b1: false,
      b2: false,
      b3: false,
      b4: false,
      b5: false
    }
  };

  // --- 10 ARENA QUESTIONS (SGK 7.5 - 7.11) ---
  const questions = [
    {
      id: 1,
      source: 'SGK Bài 7.5a',
      title: 'Tính kết quả của phép cộng hai số thập phân âm: (-12,245) + (-8,235)',
      options: [
        'A. -20,48',
        'B. 20,48',
        'C. -4,01',
        'D. -20,47'
      ],
      correctIndex: 0,
      hint: 'Cộng hai số âm: (-a) + (-b) = -(a + b). Lấy 12,245 + 8,235 rồi đặt dấu âm.',
      explanation: 'Ta có: (-12,245) + (-8,235) = -(12,245 + 8,235) = -20,480 = -20,48.'
    },
    {
      id: 2,
      source: 'SGK Bài 7.5b',
      title: 'Tính kết quả của phép cộng khác dấu: (-8,451) + 9,79',
      options: [
        'A. -1,339',
        'B. 1,339',
        'C. 18,241',
        'D. 1,349'
      ],
      correctIndex: 1,
      hint: 'Vì 9,79 > 8,451 nên kết quả mang dấu dương: 9,79 - 8,451.',
      explanation: 'Ta có: (-8,451) + 9,79 = 9,790 - 8,451 = 1,339.'
    },
    {
      id: 3,
      source: 'SGK Bài 7.5c',
      title: 'Tính giá trị của phép trừ số thập phân: 8,62 - (-2,38)',
      options: [
        'A. 6,24',
        'B. -11',
        'C. 11',
        'D. 10,9'
      ],
      correctIndex: 2,
      hint: 'Trừ đi số âm tương đương phép cộng với số đối: a - (-b) = a + b.',
      explanation: 'Ta có: 8,62 - (-2,38) = 8,62 + 2,38 = 11,00 = 11.'
    },
    {
      id: 4,
      source: 'SGK Bài 7.5d',
      title: 'Tính kết quả: (-0,325) - 4,215',
      options: [
        'A. 3,89',
        'B. -4,54',
        'C. 4,54',
        'D. -3,89'
      ],
      correctIndex: 1,
      hint: '(-a) - b = -(a + b).',
      explanation: 'Ta có: (-0,325) - 4,215 = -(0,325 + 4,215) = -4,540 = -4,54.'
    },
    {
      id: 5,
      source: 'SGK Bài 7.6a',
      title: 'Tính tích của hai số thập phân khác dấu: 8,5 · (-4,2)',
      options: [
        'A. 35,7',
        'B. -35,7',
        'C. -34,7',
        'D. -357'
      ],
      correctIndex: 1,
      hint: 'Dương nhân Âm ra Âm. 8,5 x 4,2 = 35,70.',
      explanation: 'Ta có: 8,5 · (-4,2) = -(8,5 · 4,2) = -35,7.'
    },
    {
      id: 6,
      source: 'SGK Bài 7.6b',
      title: 'Tính tích của hai số thập phân cùng dấu âm: (-6,2) · (-7,5)',
      options: [
        'A. -46,5',
        'B. 46,5',
        'C. 45,5',
        'D. 465'
      ],
      correctIndex: 1,
      hint: 'Âm nhân Âm ra Dương.',
      explanation: 'Ta có: (-6,2) · (-7,5) = 6,2 · 7,5 = 46,5.'
    },
    {
      id: 7,
      source: 'SGK Bài 7.6c, d & 7.7',
      title: 'Tính giá trị của hai phép chia: (-2,59) : (-0,7) và (-0,037) : 0,1',
      options: [
        'A. 3,7 và -0,37',
        'B. -3,7 và -0,37',
        'C. 3,7 và -0,0037',
        'D. 0,37 và -3,7'
      ],
      correctIndex: 0,
      hint: '(-2,59) : (-0,7) = 2,59 : 0,7 = 3,7. Chia cho 0,1 là nhân với 10.',
      explanation: 'Ta có: (-2,59) : (-0,7) = 3,7 và (-0,037) : 0,1 = -0,037 · 10 = -0,37.'
    },
    {
      id: 8,
      source: 'SGK Bài 7.9',
      title: 'Thuỷ ngân đông đặc ở -38,83°C và sôi ở 356,73°C. Nhiệt độ sôi cao hơn nhiệt độ đông đặc bao nhiêu °C?',
      options: [
        'A. 317,9°C',
        'B. 395,56°C',
        'C. 394,56°C',
        'D. -395,56°C'
      ],
      correctIndex: 1,
      hint: 'Lấy nhiệt độ sôi trừ đi nhiệt độ đông đặc: 356,73 - (-38,83).',
      explanation: 'Độ chênh lệch nhiệt độ là: 356,73 - (-38,83) = 356,73 + 38,83 = 395,56°C.'
    },
    {
      id: 9,
      source: 'SGK Bài 7.10',
      title: 'Một khối nước đá có nhiệt độ -4,5°C. Sau khi tăng thêm 2,3°C, nhiệt độ mới của khối nước đá là:',
      options: [
        'A. -6,8°C',
        'B. 2,2°C',
        'C. -2,2°C',
        'D. -2,8°C'
      ],
      correctIndex: 2,
      hint: 'Tính: (-4,5) + 2,3 = -(4,5 - 2,3).',
      explanation: 'Nhiệt độ mới là: (-4,5) + 2,3 = -(4,5 - 2,3) = -2,2°C.'
    },
    {
      id: 10,
      source: 'SGK Bài 7.11',
      title: 'Sản xuất 1 tấn giấy cần 4,4 m³ gỗ. Năm 2019 Việt Nam sản xuất 3,674 triệu tấn giấy thì cần bao nhiêu triệu m³ gỗ?',
      options: [
        'A. 16,1656 triệu m³',
        'B. 15,1656 triệu m³',
        'C. 8,074 triệu m³',
        'D. 161,656 triệu m³'
      ],
      correctIndex: 0,
      hint: 'Lấy sản lượng giấy nhân với lượng gỗ cần cho 1 tấn: 3,674 · 4,4.',
      explanation: 'Lượng gỗ cần dùng là: 3,674 · 4,4 = 16,1656 triệu m³ gỗ.'
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
    calcA: document.getElementById('calc-a'),
    calcB: document.getElementById('calc-b'),
    opBtns: document.querySelectorAll('.op-select-btn'),
    calcResultDisplay: document.getElementById('calc-result-display'),
    calcStepsText: document.getElementById('calc-steps-text'),
    btnDemo75a: document.getElementById('btn-demo-75a'),
    btnDemo75c: document.getElementById('btn-demo-75c'),
    btnDemo76a: document.getElementById('btn-demo-76a'),
    btnDemo76c: document.getElementById('btn-demo-76c'),
    // Lab 2
    btnSimMercury: document.getElementById('btn-sim-mercury'),
    resMercury: document.getElementById('res-mercury'),
    btnSimIce: document.getElementById('btn-sim-ice'),
    resIce: document.getElementById('res-ice'),
    btnSimPaper: document.getElementById('btn-sim-paper'),
    resPaper: document.getElementById('res-paper'),
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
      if (confirm('Em có chắc chắn muốn đặt lại toàn bộ kết quả?')) {
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

  // --- LAB 1: CALCULATOR & STEPS ---
  function setupLab1() {
    function compute() {
      const a = parseFloat(el.calcA.value);
      const b = parseFloat(el.calcB.value);
      const op = state.currentOp;

      if (isNaN(a) || isNaN(b)) return;

      let res = 0;
      let steps = '';

      if (op === '+') {
        res = a + b;
        if (a < 0 && b < 0) {
          steps = `<strong>Quy tắc cộng 2 số âm:</strong> $(-${Math.abs(a)}) + (-${Math.abs(b)}) = -(${Math.abs(a)} + ${Math.abs(b)}) = ${res.toString().replace('.', ',')}`;
        } else if (a * b < 0) {
          steps = `<strong>Quy tắc cộng khác dấu:</strong> Lấy phần dương lớn hơn trừ phần dương bé hơn, lấy dấu của số có phần dương lớn hơn.`;
        } else {
          steps = `<strong>Cộng 2 số dương:</strong> Thực hiện cộng như số tự nhiên, đặt dấu phẩy thẳng cột.`;
        }
      } else if (op === '-') {
        res = a - b;
        if (b < 0) {
          steps = `<strong>Trừ đi số âm:</strong> $${a} - (${b}) = ${a} + ${Math.abs(b)} = ${res.toString().replace('.', ',')}$ (chuyển thành cộng số đối).`;
        } else {
          steps = `<strong>Phép trừ:</strong> Thực hiện trừ đặt dấu phẩy thẳng cột.`;
        }
      } else if (op === '*') {
        res = a * b;
        const signText = (a * b < 0) ? 'Khác dấu ra kết quả ÂM (-)' : 'Cùng dấu ra kết quả DƯƠNG (+)';
        steps = `<strong>Quy tắc dấu nhân:</strong> ${signText}. Tích bằng ${res.toString().replace('.', ',')}.`;
      } else if (op === '/') {
        if (b === 0) {
          el.calcResultDisplay.textContent = 'Không chia cho 0';
          el.calcStepsText.innerHTML = 'Số chia phải khác 0!';
          return;
        }
        res = a / b;
        const signText = (a * b < 0) ? 'Khác dấu ra kết quả ÂM (-)' : 'Cùng dấu ra kết quả DƯƠNG (+)';
        steps = `<strong>Quy tắc chia:</strong> Dời dấu phẩy số chia thành số nguyên, sau đó chia như bình thường. ${signText}.`;
      }

      // Round to prevent floating point inaccuracies
      res = Math.round(res * 1000000) / 1000000;
      el.calcResultDisplay.textContent = res.toString().replace('.', ',');
      el.calcResultDisplay.style.color = res < 0 ? '#ef4444' : '#10b981';
      el.calcStepsText.innerHTML = steps;

      state.labExplored.lab1 = true;
      checkLabBadges();
    }

    el.opBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        el.opBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.currentOp = btn.getAttribute('data-op');
        compute();
        SoundFX.click();
      });
    });

    el.calcA.addEventListener('input', compute);
    el.calcB.addEventListener('input', compute);

    // Preset Demo Buttons
    el.btnDemo75a.addEventListener('click', () => {
      el.calcA.value = -12.245;
      el.calcB.value = -8.235;
      setOp('+');
      compute();
      SoundFX.click();
    });

    el.btnDemo75c.addEventListener('click', () => {
      el.calcA.value = 8.62;
      el.calcB.value = -2.38;
      setOp('-');
      compute();
      SoundFX.click();
    });

    el.btnDemo76a.addEventListener('click', () => {
      el.calcA.value = 8.5;
      el.calcB.value = -4.2;
      setOp('*');
      compute();
      SoundFX.click();
    });

    el.btnDemo76c.addEventListener('click', () => {
      el.calcA.value = -2.59;
      el.calcB.value = -0.7;
      setOp('/');
      compute();
      SoundFX.click();
    });

    function setOp(opChar) {
      state.currentOp = opChar;
      el.opBtns.forEach(b => {
        if (b.getAttribute('data-op') === opChar) b.classList.add('active');
        else b.classList.remove('active');
      });
    }

    compute();
  }

  // --- LAB 2: REAL-WORLD APPLICATIONS ---
  function setupLab2() {
    el.btnSimMercury.addEventListener('click', () => {
      el.resMercury.style.display = 'block';
      SoundFX.click();
      state.labExplored.lab2 = true;
      checkLabBadges();
    });

    el.btnSimIce.addEventListener('click', () => {
      el.resIce.style.display = 'block';
      SoundFX.click();
      state.labExplored.lab2 = true;
      checkLabBadges();
    });

    el.btnSimPaper.addEventListener('click', () => {
      el.resPaper.style.display = 'block';
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
      el.hudRankDisplay.textContent = 'Đại Kiện Tướng Phép Tính';
    } else if (state.stars >= 7) {
      el.hudRankDisplay.textContent = 'Chuyên Viên Số Thập Phân';
    } else if (state.stars >= 4) {
      el.hudRankDisplay.textContent = 'Nhà Toán Học Trẻ';
    } else {
      el.hudRankDisplay.textContent = 'Tập Sự Phép Tính';
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
