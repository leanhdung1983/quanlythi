// APP.JS - BÀI 31: MỘT SỐ BÀI TOÁN VỀ TỈ SỐ VÀ TỈ SỐ PHẦN TRĂM (TOÁN 6 TẬP 2)
// Audio Synthesizer, Gamified State, Interactive Labs, SGK 7.17-7.25 Arena, Badges & Cert

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
    studentName: 'Chuyên Gia Tài Chính Lớp 6',
    avatar: '📊',
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

  // --- 10 ARENA QUESTIONS (SGK 7.17 - 7.25) ---
  const questions = [
    {
      id: 1,
      source: 'SGK Bài 7.17a',
      title: 'Tính giá trị của 25% của số 8:',
      options: [
        'A. 2',
        'B. 4',
        'C. 0,2',
        'D. 20'
      ],
      correctIndex: 0,
      hint: 'Áp dụng công thức tìm m% của số a: a · (m/100). 8 · 25/100 = 8 · 0,25 = 2.',
      explanation: 'Ta có: 25% của 8 là: 8 · 25/100 = 8 · 1/4 = 2.'
    },
    {
      id: 2,
      source: 'SGK Bài 7.17b',
      title: 'Tính 7,5% của 180:',
      options: [
        'A. 135',
        'B. 13,5',
        'C. 1,35',
        'D. 12,5'
      ],
      correctIndex: 1,
      hint: 'Tính: 180 · 7,5 / 100 = 180 · 0,075 = 13,5.',
      explanation: 'Ta có: 7,5% của 180 là: 180 · 7,5 / 100 = 13,5.'
    },
    {
      id: 3,
      source: 'SGK Bài 7.18',
      title: 'Bác An gửi 150 triệu đồng kỳ hạn 1 năm với lãi suất 7,4%/năm. Số tiền lãi sau 1 năm là:',
      options: [
        'A. 11,1 triệu đồng',
        'B. 111 triệu đồng',
        'C. 7,4 triệu đồng',
        'D. 1,11 triệu đồng'
      ],
      correctIndex: 0,
      hint: 'Tiền lãi = 150 · 7,4% = 150 · 0,074 = 11,1 triệu.',
      explanation: 'Số tiền lãi bác An nhận được là: 150 · 7,4 / 100 = 11,1 triệu đồng (tức 11 100 000 đồng).'
    },
    {
      id: 4,
      source: 'SGK Bài 7.19a',
      title: 'Một thiết bị giá niêm yết 625 000 đ được giảm giá 10%. Số tiền được giảm giá là:',
      options: [
        'A. 6 250 đ',
        'B. 62 500 đ',
        'C. 625 đ',
        'D. 562 500 đ'
      ],
      correctIndex: 1,
      hint: 'Số tiền giảm = 625 000 · 10% = 62 500 đ.',
      explanation: 'Số tiền được giảm giá là: 625 000 · 10 / 100 = 62 500 đồng.'
    },
    {
      id: 5,
      source: 'SGK Bài 7.19b',
      title: 'Giá bán thực tế của thiết bị đó sau khi đã giảm giá 10% là:',
      options: [
        'A. 562 500 đ',
        'B. 560 000 đ',
        'C. 572 500 đ',
        'D. 600 000 đ'
      ],
      correctIndex: 0,
      hint: 'Lấy giá niêm yết trừ đi số tiền được giảm: 625 000 - 62 500.',
      explanation: 'Giá thực tế sau khi giảm là: 625 000 - 62 500 = 562 500 đồng.'
    },
    {
      id: 6,
      source: 'SGK Bài 7.20',
      title: 'Dân tộc Mường có 1 450 000 người, chiếm 1,5% dân số cả nước. Dân số Việt Nam lúc đó khoảng:',
      options: [
        'A. 96,7 triệu người',
        'B. 86,7 triệu người',
        'C. 100 triệu người',
        'D. 967 triệu người'
      ],
      correctIndex: 0,
      hint: 'Bài toán tìm số khi biết %: 1 450 000 : 1,5% = 1 450 000 : 0,015 ≈ 96,67 triệu.',
      explanation: 'Dân số Việt Nam lúc đó là: 1 450 000 : (1,5 / 100) = 1 450 000 : 0,015 ≈ 96 666 667 người (xấp xỉ 96,7 triệu người).'
    },
    {
      id: 7,
      source: 'SGK Bài 7.21',
      title: 'Tỉ số phần trăm của hai số 5 và 8 là:',
      options: [
        'A. 62,5%',
        'B. 6,25%',
        'C. 58%',
        'D. 40%'
      ],
      correctIndex: 0,
      hint: 'Tỉ số phần trăm = (5 · 100 / 8)% = 500 / 8 % = 62,5%.',
      explanation: 'Ta có: (5 · 100 / 8)% = 500/8 % = 62,5%.'
    },
    {
      id: 8,
      source: 'SGK Bài 7.22',
      title: 'Trong 40 kg nước biển có 2 kg muối. Tỉ số phần trăm của muối trong nước biển là:',
      options: [
        'A. 2%',
        'B. 5%',
        'C. 8%',
        'D. 20%'
      ],
      correctIndex: 1,
      hint: 'Tỉ số phần trăm = (2 · 100 / 40)% = 200 / 40 % = 5%.',
      explanation: 'Tỉ số phần trăm muối là: (2 · 100 / 40)% = 5%.'
    },
    {
      id: 9,
      source: 'SGK Bài 7.23',
      title: 'Trong 100 g gạo tẻ chứa 6,4 g chất đạm. Tỉ số phần trăm khối lượng chất đạm trong gạo tẻ là:',
      options: [
        'A. 64%',
        'B. 6,4%',
        'C. 0,64%',
        'D. 16%'
      ],
      correctIndex: 1,
      hint: '(6,4 · 100 / 100)% = 6,4%.',
      explanation: 'Tỉ số phần trăm là: (6,4 · 100 / 100)% = 6,4%.'
    },
    {
      id: 10,
      source: 'SGK Bài 7.24 & Thực tế',
      title: 'Hoá đơn tiền hàng là 500 000 đ chưa thuế. Nếu thuế VAT là 10% thì tổng số tiền khách phải thanh toán là:',
      options: [
        'A. 550 000 đ',
        'B. 505 000 đ',
        'C. 450 000 đ',
        'D. 600 000 đ'
      ],
      correctIndex: 0,
      hint: 'Thuế VAT = 500 000 · 10% = 50 000 đ. Tổng thanh toán = 500 000 + 50 000 = 550 000 đ.',
      explanation: 'Tiền thuế VAT: 500 000 · 10% = 50 000 đồng. Tổng số tiền phải thanh toán là: 500 000 + 50 000 = 550 000 đồng.'
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
    inputDeposit: document.getElementById('input-deposit'),
    inputRate: document.getElementById('input-rate'),
    resDepositVal: document.getElementById('res-deposit-val'),
    resInterestVal: document.getElementById('res-interest-val'),
    resTotalVal: document.getElementById('res-total-val'),
    resCalcDesc: document.getElementById('res-calc-desc'),
    btnQuickAn: document.getElementById('btn-quick-an'),
    btnQuick25of8: document.getElementById('btn-quick-25of8'),
    btnQuick75of180: document.getElementById('btn-quick-75of180'),
    // Lab 2
    btnSimPhone: document.getElementById('btn-sim-phone'),
    resPhone: document.getElementById('res-phone'),
    btnSimSalt: document.getElementById('btn-sim-salt'),
    resSalt: document.getElementById('res-salt'),
    btnSimPop: document.getElementById('btn-sim-pop'),
    resPop: document.getElementById('res-pop'),
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
      if (confirm('Em có chắc chắn muốn đặt lại điểm số và bài làm?')) {
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

  // --- LAB 1: INTEREST & RATIO MACHINE ---
  function setupLab1() {
    function calculateInterest() {
      const dep = parseFloat(el.inputDeposit.value);
      const rate = parseFloat(el.inputRate.value);

      if (isNaN(dep) || isNaN(rate)) return;

      const interest = (dep * rate) / 100;
      const total = dep + interest;

      el.resDepositVal.textContent = `${dep.toLocaleString('vi-VN')} triệu VNĐ`;
      el.resInterestVal.textContent = `${interest.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} triệu VNĐ`;
      el.resTotalVal.textContent = `${total.toLocaleString('vi-VN', { maximumFractionDigits: 3 })} triệu VNĐ`;
      el.resCalcDesc.innerHTML = `Công thức: $${dep.toLocaleString('vi-VN')} \\times \\frac{${rate}}{100} = ${interest.toLocaleString('vi-VN', { maximumFractionDigits: 3 })}$ triệu VNĐ.`;

      state.labExplored.lab1 = true;
      checkLabBadges();
    }

    el.inputDeposit.addEventListener('input', calculateInterest);
    el.inputRate.addEventListener('input', calculateInterest);

    el.btnQuickAn.addEventListener('click', () => {
      el.inputDeposit.value = 150;
      el.inputRate.value = 7.4;
      calculateInterest();
      SoundFX.click();
    });

    el.btnQuick25of8.addEventListener('click', () => {
      el.inputDeposit.value = 8;
      el.inputRate.value = 25;
      calculateInterest();
      SoundFX.click();
    });

    el.btnQuick75of180.addEventListener('click', () => {
      el.inputDeposit.value = 180;
      el.inputRate.value = 7.5;
      calculateInterest();
      SoundFX.click();
    });

    calculateInterest();
  }

  // --- LAB 2: DISCOUNT & REAL APPLICATIONS ---
  function setupLab2() {
    el.btnSimPhone.addEventListener('click', () => {
      el.resPhone.style.display = 'block';
      SoundFX.click();
      state.labExplored.lab2 = true;
      checkLabBadges();
    });

    el.btnSimSalt.addEventListener('click', () => {
      el.resSalt.style.display = 'block';
      SoundFX.click();
      state.labExplored.lab2 = true;
      checkLabBadges();
    });

    el.btnSimPop.addEventListener('click', () => {
      el.resPop.style.display = 'block';
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
      el.hudRankDisplay.textContent = 'Đại Kiện Tướng Tài Chính';
    } else if (state.stars >= 7) {
      el.hudRankDisplay.textContent = 'Chuyên Gia Tỉ Số';
    } else if (state.stars >= 4) {
      el.hudRankDisplay.textContent = 'Nhà Phân Tích Kinh Tế';
    } else {
      el.hudRankDisplay.textContent = 'Tập Sự Tỉ Số';
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
