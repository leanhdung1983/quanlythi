// APP.JS - BÀI 30: LÀM TRÒN VÀ ƯỚC LƯỢNG (TOÁN 6 TẬP 2)
// Audio Synthesizer, Gamified State, Interactive Labs, SGK 7.12-7.16 Arena, Badges & Cert

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
    studentName: 'Kỹ Sư Ước Lượng Lớp 6',
    avatar: '🎯',
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

  // --- 10 ARENA QUESTIONS (SGK 7.12 - 7.16) ---
  const questions = [
    {
      id: 1,
      source: 'SGK Bài 7.12a',
      title: 'Làm tròn số thập phân âm -10,349 đến hàng phần mười:',
      options: [
        'A. -10,3',
        'B. -10,4',
        'C. -10',
        'D. 10,3'
      ],
      correctIndex: 0,
      hint: 'Làm tròn 10,349 đến hàng phần mười: Chữ số ngay sau (hàng phần trăm) là 4 < 5 nên giữ nguyên 10,3. Do đó kết quả là -10,3.',
      explanation: 'Ta xét số đối 10,349. Chữ số ngay sau hàng phần mười là 4 (< 5) nên 10,349 ≈ 10,3. Vậy -10,349 ≈ -10,3.'
    },
    {
      id: 2,
      source: 'SGK Bài 7.12a',
      title: 'Làm tròn số thập phân 1983,571 đến hàng phần mười:',
      options: [
        'A. 1983,5',
        'B. 1983,6',
        'C. 1984',
        'D. 1983,57'
      ],
      correctIndex: 1,
      hint: 'Chữ số ngay sau hàng phần mười là chữ số 7 (≥ 5) nên cộng thêm 1 vào hàng phần mười: 5 + 1 = 6.',
      explanation: 'Chữ số hàng phần mười là 5, chữ số ngay sau nó là 7 ≥ 5 nên cộng thêm 1 vào 5 thành 6. Kết quả là 1983,6.'
    },
    {
      id: 3,
      source: 'SGK Bài 7.12b',
      title: 'Làm tròn số 4983 đến hàng trăm:',
      options: [
        'A. 4900',
        'B. 5000',
        'C. 4980',
        'D. 5100'
      ],
      correctIndex: 1,
      hint: 'Chữ số hàng trăm là 9, chữ số ngay sau (hàng chục) là 8 ≥ 5 => cộng thêm 1 vào 49 thành 50.',
      explanation: 'Chữ số ngay sau hàng trăm là 8 ≥ 5 nên ta cộng 1 vào 49 thành 50 và thay các chữ số sau bằng số 0: 4983 ≈ 5000.'
    },
    {
      id: 4,
      source: 'SGK Bài 7.12b',
      title: 'Làm tròn số nguyên âm -10349 đến hàng trăm:',
      options: [
        'A. -10300',
        'B. -10400',
        'C. -10000',
        'D. 10300'
      ],
      correctIndex: 0,
      hint: 'Làm tròn 10349 đến hàng trăm: chữ số hàng chục là 4 < 5 nên giữ nguyên 10300. Vậy là -10300.',
      explanation: 'Số đối 10349 có chữ số ngay sau hàng trăm là 4 < 5 nên giữ nguyên: 10349 ≈ 10300. Vậy -10349 ≈ -10300.'
    },
    {
      id: 5,
      source: 'SGK Bài 7.13a',
      title: 'Ước lượng kết quả của phép tính: 256,3 + 892,37 (làm tròn đến hàng đơn vị):',
      options: [
        'A. 1148',
        'B. 1150',
        'C. 1140',
        'D. 1200'
      ],
      correctIndex: 0,
      hint: 'Làm tròn 256,3 ≈ 256 và 892,37 ≈ 892. Tính tổng: 256 + 892.',
      explanation: 'Làm tròn đến hàng đơn vị: 256,3 ≈ 256; 892,37 ≈ 892. Tổng ước lượng = 256 + 892 = 1148 (kết quả chính xác là 1148,67).'
    },
    {
      id: 6,
      source: 'SGK Bài 7.13b',
      title: 'Ước lượng kết quả phép tính: (-35,6) · (-4,1) (làm tròn đến hàng đơn vị):',
      options: [
        'A. -144',
        'B. 144',
        'C. 140',
        'D. 150'
      ],
      correctIndex: 1,
      hint: '(-35,6) ≈ -36; (-4,1) ≈ -4. Âm nhân âm ra dương: (-36) · (-4) = 144.',
      explanation: 'Làm tròn: -35,6 ≈ -36; -4,1 ≈ -4. Ước lượng tích = (-36) · (-4) = 144 (tích chính xác là 145,96).'
    },
    {
      id: 7,
      source: 'SGK Bài 7.14',
      title: 'Bác Toàn cưa thanh gỗ dài 6,32 m thành 4 đoạn bằng nhau. Chiều dài mỗi đoạn gỗ làm tròn đến hàng phần mười là:',
      options: [
        'A. 1,5 m',
        'B. 1,6 m',
        'C. 1,58 m',
        'D. 2,0 m'
      ],
      correctIndex: 1,
      hint: 'Chia đều: 6,32 : 4 = 1,58 m. Làm tròn đến hàng phần mười: chữ số ngay sau là 8 ≥ 5.',
      explanation: 'Chiều dài mỗi đoạn là: 6,32 : 4 = 1,58 m. Vì chữ số hàng phần trăm là 8 ≥ 5 nên làm tròn đến hàng phần mười ta được 1,6 m.'
    },
    {
      id: 8,
      source: 'SGK Bài 7.15a',
      title: '1 AU ≈ 149 597 870,7 km. Làm tròn số này đến hàng chục triệu ta được:',
      options: [
        'A. 140 000 000 km',
        'B. 150 000 000 km',
        'C. 149 000 000 km',
        'D. 200 000 000 km'
      ],
      correctIndex: 1,
      hint: 'Hàng chục triệu là chữ số 4, chữ số ngay sau (hàng triệu) là 9 ≥ 5 nên cộng 1 vào 4 thành 5.',
      explanation: 'Chữ số ngay sau hàng chục triệu là 9 ≥ 5 nên cộng thêm 1: 149 597 870,7 km ≈ 150 000 000 km (150 triệu km).'
    },
    {
      id: 9,
      source: 'SGK Bài 7.15c',
      title: 'Làm tròn số 149 597 870,7 km đến hàng trăm ta được:',
      options: [
        'A. 149 597 800 km',
        'B. 149 597 900 km',
        'C. 149 598 000 km',
        'D. 149 597 870 km'
      ],
      correctIndex: 1,
      hint: 'Hàng trăm là chữ số 8, chữ số ngay sau (hàng chục) là 7 ≥ 5 nên 8 cộng 1 thành 9.',
      explanation: 'Chữ số ngay sau hàng trăm là 7 ≥ 5 nên cộng 1 vào 8 thành 9 và bỏ phần thập phân, thay hàng chục và đơn vị bằng 0: 149 597 900 km.'
    },
    {
      id: 10,
      source: 'SGK Bài 7.16',
      title: 'Nam có 100 000 đ mua: 5 vở (7 800 đ/q), 3 bút (4 200 đ/c), 1 hộp màu (32 500 đ). Ước lượng xem Nam có đủ tiền không?',
      options: [
        'A. Nam đủ tiền vì tổng ước lượng khoảng 85 000 đ < 100 000 đ',
        'B. Nam không đủ tiền vì tổng tiền vượt quá 105 000 đ',
        'C. Nam vừa đủ từng xu không thừa đồng nào',
        'D. Không đủ dữ kiện để ước lượng'
      ],
      correctIndex: 0,
      hint: 'Ước lượng: 5 x 8 000 + 3 x 4 000 + 33 000 = 40 000 + 12 000 + 33 000 = 85 000 đ.',
      explanation: 'Ước lượng tổng tiền: 5 · 8 000 + 3 · 4 000 + 33 000 = 85 000 đ < 100 000 đ. Vậy Nam hoàn toàn đủ tiền mua (số tiền thực tế là 84 100 đ).'
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
    inputRoundNum: document.getElementById('input-round-num'),
    selectRoundPlace: document.getElementById('select-round-place'),
    resRoundVal: document.getElementById('res-round-val'),
    resRoundExpl: document.getElementById('res-round-expl'),
    btnDemo712a: document.getElementById('btn-demo-712a'),
    btnDemo712b: document.getElementById('btn-demo-712b'),
    btnDemo4983: document.getElementById('btn-demo-4983'),
    btnDemoAU: document.getElementById('btn-demo-au'),
    // Lab 2
    btnSimMarket: document.getElementById('btn-sim-market'),
    resMarket: document.getElementById('res-market'),
    btnSimWood: document.getElementById('btn-sim-wood'),
    resWood: document.getElementById('res-wood'),
    btnSimSpace: document.getElementById('btn-sim-space'),
    resSpace: document.getElementById('res-space'),
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

  // --- LAB 1: ROUNDING MACHINE ---
  function setupLab1() {
    function calculateRound() {
      const val = parseFloat(el.inputRoundNum.value);
      const place = parseFloat(el.selectRoundPlace.value);

      if (isNaN(val) || isNaN(place)) return;

      const isNegative = val < 0;
      const absVal = Math.abs(val);

      // Perform rounding on positive number
      let roundedAbs;
      if (place >= 1) {
        roundedAbs = Math.round(absVal / place) * place;
      } else {
        const factor = Math.round(1 / place);
        roundedAbs = Math.round(absVal * factor) / factor;
      }

      const finalVal = isNegative ? -roundedAbs : roundedAbs;

      // Format Vietnamese style
      let strVal = finalVal.toLocaleString('vi-VN', { maximumFractionDigits: 4 });
      el.resRoundVal.textContent = strVal;

      // Explanation
      let expl = '';
      if (isNegative) {
        expl += `• Số ban đầu là số âm nên ta làm tròn số đối: <strong>${absVal.toLocaleString('vi-VN')}</strong>.<br>`;
      }
      expl += `• Hàng làm tròn tương ứng với giá trị: <strong>${place.toLocaleString('vi-VN')}</strong>.<br>`;
      expl += `• Sau khi làm tròn theo quy tắc SGK, ta được: <strong>${finalVal.toLocaleString('vi-VN')}</strong>.`;
      el.resRoundExpl.innerHTML = expl;

      state.labExplored.lab1 = true;
      checkLabBadges();
    }

    el.inputRoundNum.addEventListener('input', calculateRound);
    el.selectRoundPlace.addEventListener('change', calculateRound);

    el.btnDemo712a.addEventListener('click', () => {
      el.inputRoundNum.value = -10.349;
      el.selectRoundPlace.value = 0.1;
      calculateRound();
      SoundFX.click();
    });

    el.btnDemo712b.addEventListener('click', () => {
      el.inputRoundNum.value = 1983.571;
      el.selectRoundPlace.value = 0.1;
      calculateRound();
      SoundFX.click();
    });

    el.btnDemo4983.addEventListener('click', () => {
      el.inputRoundNum.value = 4983;
      el.selectRoundPlace.value = 100;
      calculateRound();
      SoundFX.click();
    });

    el.btnDemoAU.addEventListener('click', () => {
      el.inputRoundNum.value = 149597870.7;
      el.selectRoundPlace.value = 10000000;
      calculateRound();
      SoundFX.click();
    });

    calculateRound();
  }

  // --- LAB 2: ESTIMATION LAB ---
  function setupLab2() {
    el.btnSimMarket.addEventListener('click', () => {
      el.resMarket.style.display = 'block';
      SoundFX.click();
      state.labExplored.lab2 = true;
      checkLabBadges();
    });

    el.btnSimWood.addEventListener('click', () => {
      el.resWood.style.display = 'block';
      SoundFX.click();
      state.labExplored.lab2 = true;
      checkLabBadges();
    });

    el.btnSimSpace.addEventListener('click', () => {
      el.resSpace.style.display = 'block';
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
      el.hudRankDisplay.textContent = 'Đại Kiện Tướng Làm Tròn';
    } else if (state.stars >= 7) {
      el.hudRankDisplay.textContent = 'Chuyên Gia Ước Lượng';
    } else if (state.stars >= 4) {
      el.hudRankDisplay.textContent = 'Nhà Phân Tích Số Liệu';
    } else {
      el.hudRankDisplay.textContent = 'Tập Sự Làm Tròn';
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
