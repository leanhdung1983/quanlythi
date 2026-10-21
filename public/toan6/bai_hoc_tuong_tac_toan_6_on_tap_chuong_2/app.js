/* =========================================================
   ÔN TẬP CUỐI CHƯƠNG II: TÍNH CHIA HẾT TRONG SỐ TỰ NHIÊN
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
  const STORAGE_KEY = 'toan6_on_tap_c2_progress';

  let state = {
    studentName: 'Thợ Săn Số Nguyên Tố Lớp 6',
    avatar: '✨',
    score: 0,
    stars: 0,
    streak: 0,
    maxStreak: 0,
    sound: true,
    badges: [false, false, false, false, false],
    answeredQuestions: {}
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

  // --- PRIME FACTORIZATION UTILS ---
  function getPrimeFactors(n) {
    const factors = {};
    let d = 2;
    while (d * d <= n) {
      while (n % d === 0) {
        factors[d] = (factors[d] || 0) + 1;
        n /= d;
      }
      d++;
    }
    if (n > 1) {
      factors[n] = (factors[n] || 0) + 1;
    }
    return factors;
  }

  function formatFactors(factors) {
    return Object.entries(factors)
      .map(([p, exp]) => exp === 1 ? `${p}` : `${p}<sup>${exp}</sup>`)
      .join(' · ');
  }

  function gcd(a, b) {
    while (b !== 0) {
      const t = b;
      b = a % b;
      a = t;
    }
    return a;
  }

  function lcm(a, b) {
    return (a * b) / gcd(a, b);
  }

  // --- QUIZ DATA (SGK BT 2.53 - 2.62) ---
  const quizData = [
    {
      id: 1,
      source: 'SGK BT 2.53 a (Tính chất chia hết của một hiệu)',
      question: 'Cho tập hợp X = {50; 108; 189; 1 234; 2 019; 2 020}. Những số x nào làm cho hiệu (x - 12) chia hết cho 2?',
      options: [
        'A. {50; 108; 1 234; 2 020}',
        'B. {108; 189; 2 019}',
        'C. {50; 2 020}',
        'D. {108; 189}'
      ],
      correct: 0,
      explanation: 'Vì 12 chia hết cho 2 nên để (x - 12) chia hết cho 2 thì x cũng phải chia hết cho 2 (tức là x phải là số chẵn): {50; 108; 1 234; 2 020}.'
    },
    {
      id: 2,
      source: 'SGK BT 2.53 b (Chia hết cho 3)',
      question: 'Cũng từ tập hợp X trên, những số x nào làm cho hiệu (x - 27) chia hết cho 3?',
      options: [
        'A. {108; 189; 2 019}',
        'B. {50; 108; 1 234}',
        'C. {50; 2 020}',
        'D. {189; 2 019}'
      ],
      correct: 0,
      explanation: 'Vì 27 chia hết cho 3 nên để (x - 27) chia hết cho 3 thì x phải chia hết cho 3 (tổng các chữ số chia hết cho 3): 108 (1+0+8=9), 189 (1+8+9=18), 2 019 (2+0+1+9=12).'
    },
    {
      id: 3,
      source: 'SGK BT 2.54 a (Phân tích thừa số nguyên tố)',
      question: 'Thực hiện phép tính 14² + 5² + 2² rồi phân tích kết quả ra thừa số nguyên tố, ta được:',
      options: [
        'A. 3² · 5²',
        'B. 2² · 3 · 5',
        'C. 2 · 3² · 5',
        'D. 5² · 7'
      ],
      correct: 0,
      explanation: '14² + 5² + 2² = 196 + 25 + 4 = 225. Ta có 225 = 9 × 25 = 3² · 5².'
    },
    {
      id: 4,
      source: 'SGK BT 2.55 a (ƯCLN và BCNN của 21 và 98)',
      question: 'Ước chung lớn nhất và Bội chung nhỏ nhất của hai số 21 và 98 lần lượt là:',
      options: [
        'A. ƯCLN = 7, BCNN = 294',
        'B. ƯCLN = 14, BCNN = 196',
        'C. ƯCLN = 21, BCNN = 294',
        'D. ƯCLN = 7, BCNN = 588'
      ],
      correct: 0,
      explanation: '21 = 3 · 7; 98 = 2 · 7². Do đó ƯCLN = 7; BCNN = 2 · 3 · 7² = 294.'
    },
    {
      id: 5,
      source: 'SGK BT 2.55 b (ƯCLN và BCNN của 36 và 54)',
      question: 'Ước chung lớn nhất và Bội chung nhỏ nhất của hai số 36 và 54 lần lượt là:',
      options: [
        'A. ƯCLN = 18, BCNN = 108',
        'B. ƯCLN = 9, BCNN = 216',
        'C. ƯCLN = 18, BCNN = 216',
        'D. ƯCLN = 6, BCNN = 108'
      ],
      correct: 0,
      explanation: '36 = 2² · 3²; 54 = 2 · 3³. Do đó ƯCLN = 2 · 3² = 18; BCNN = 2² · 3³ = 108.'
    },
    {
      id: 6,
      source: 'SGK BT 2.56 (Rút gọn phân số tối giản)',
      question: 'Rút gọn các phân số 27/123 và 33/77 về phân số tối giản, ta thu được:',
      options: [
        'A. 9/41 và 3/7',
        'B. 9/41 và 3/11',
        'C. 3/41 và 3/7',
        'D. 9/31 và 3/7'
      ],
      correct: 0,
      explanation: '27/123 = (27:3)/(123:3) = 9/41; 33/77 = (33:11)/(77:11) = 3/7.'
    },
    {
      id: 7,
      source: 'SGK BT 2.57 a (Cộng phân số bằng BCNN)',
      question: 'Thực hiện phép tính 5/12 + 3/16 bằng cách tìm mẫu số chung là BCNN(12, 16):',
      options: [
        'A. 29/48',
        'B. 19/48',
        'C. 8/28',
        'D. 1/4'
      ],
      correct: 0,
      explanation: 'BCNN(12, 16) = 48. Quy đồng: 5/12 = 20/48; 3/16 = 9/48. Tổng: 20/48 + 9/48 = 29/48.'
    },
    {
      id: 8,
      source: 'SGK BT 2.58 (Chia túi quà nhiều nhất)',
      question: 'Có 12 quả cam, 18 quả xoài và 30 quả bơ chia đều vào các túi quà. Hỏi có thể chia được NHIỀU NHẤT bao nhiêu túi quà?',
      options: [
        'A. 6 túi quà',
        'B. 3 túi quà',
        'C. 12 túi quà',
        'D. 4 túi quà'
      ],
      correct: 0,
      explanation: 'Số túi quà nhiều nhất là ƯCLN(12, 18, 30). Ta có 12 = 2²·3, 18 = 2·3², 30 = 2·3·5 => ƯCLN = 2·3 = 6 (túi quà).'
    },
    {
      id: 9,
      source: 'SGK BT 2.59 (Thay dầu & Xoay lốp)',
      question: 'Bác Nam 3 tháng thay dầu một lần, 6 tháng xoay lốp một lần. Nếu bác làm cả hai việc vào tháng 4 năm nay thì lần gần nhất tiếp theo làm cùng lúc vào tháng mấy?',
      options: [
        'A. Tháng 10 năm nay',
        'B. Tháng 7 năm nay',
        'C. Tháng 12 năm nay',
        'D. Tháng 4 năm sau'
      ],
      correct: 0,
      explanation: 'Khoảng thời gian gặp lại là BCNN(3, 6) = 6 tháng. Sau 6 tháng kể từ tháng 4 là: 4 + 6 = 10 (tháng 10 năm nay).'
    },
    {
      id: 10,
      source: 'SGK BT 2.62 (Bài toán cổ đàn vịt)',
      question: 'Đàn vịt chưa đến 200 con thỏa mãn: xếp hàng 2 chưa vừa, hàng 3 thừa 1 con, hàng 4 chưa tròn, hàng 5 thiếu 1 con mới đầy, xếp hàng 7 vừa đẹp. Đàn vịt có bao nhiêu con?',
      options: [
        'A. 49 con',
        'B. 119 con',
        'C. 79 con',
        'D. 140 con'
      ],
      correct: 0,
      explanation: 'Hàng 2 không vừa (số lẻ); Hàng 5 thiếu 1 (tận cùng là 4 hoặc 9 => tận cùng là 9); Hàng 7 vừa đẹp (chia hết cho 7) => thử 49: 49:3 = 16 dư 1; 49 không chia hết cho 4. Đúng 49 con!'
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

  // Lab 1
  const numAInput = document.getElementById('num-a');
  const numBInput = document.getElementById('num-b');
  const btnCalcGcdLcm = document.getElementById('btn-calc-gcd-lcm');
  const gcdLcmOutput = document.getElementById('gcd-lcm-output');

  // Lab 2
  const duckBtns = document.querySelectorAll('[data-duck]');
  const duckPuzzleOutput = document.getElementById('duck-puzzle-output');

  // --- INITIALIZATION ---
  function init() {
    loadState();
    updateHUD();
    renderGcdLcm();
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
      if (confirm('Em có chắc chắn muốn đặt lại điểm số và bài tập Ôn tập Chương II không?')) {
        state.score = 0;
        state.stars = 0;
        state.streak = 0;
        state.badges = [false, false, false, false, false];
        state.answeredQuestions = {};
        saveState();
        updateHUD();
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
    if (score >= 200) return 'Đại Kiện Tướng Tính Chia Hết';
    if (score >= 140) return 'Chiến Binh Số Nguyên Tố';
    if (score >= 80) return 'Nhà Khám Phá Chương II';
    return 'Tập Sự Chương II';
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

  // --- LAB 1: GCD & LCM CALCULATOR ---
  function renderGcdLcm() {
    const a = parseInt(numAInput.value) || 36;
    const b = parseInt(numBInput.value) || 54;

    const fA = getPrimeFactors(a);
    const fB = getPrimeFactors(b);
    const g = gcd(a, b);
    const l = lcm(a, b);

    gcdLcmOutput.innerHTML = `
      <div style="font-size: 0.95rem; line-height: 1.8;">
        <div>1) Phân tích thừa số nguyên tố:</div>
        <div style="margin-left: 15px; color: #065f46; font-weight: bold;">
          • $a = ${a} = ${formatFactors(fA)}$<br>
          • $b = ${b} = ${formatFactors(fB)}$
        </div>
        <div style="margin-top: 8px;">2) Kết quả tính toán:</div>
        <div style="margin-left: 15px;">
          • <strong>ƯCLN(${a}, ${b}) = <span style="color:#059669; font-size:1.15rem;">${g}</span></strong> (dùng để rút gọn phân số $\\frac{${a}}{${b}} = \\frac{${a/g}}{${b/g}}$ tối giản).<br>
          • <strong>BCNN(${a}, ${b}) = <span style="color:#d97706; font-size:1.15rem;">${l}</span></strong> (dùng làm mẫu số chung khi quy đồng mẫu số).
        </div>
      </div>
    `;
  }

  // --- SETUP LAB EVENTS ---
  function setupLabEvents() {
    btnCalcGcdLcm.addEventListener('click', () => {
      initAudio();
      playTone(550, 0.15, 'sine');
      renderGcdLcm();
      unlockBadge(0);
    });

    duckBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        initAudio();
        const n = parseInt(btn.dataset.duck);

        const r2 = n % 2 !== 0; // Hàng 2 chưa vừa (Lẻ)
        const r3 = n % 3 === 1; // Hàng 3 thừa 1 con
        const r4 = n % 4 !== 0; // Hàng 4 chưa tròn
        const r5 = n % 5 === 4; // Hàng 5 thiếu 1
        const r7 = n % 7 === 0; // Hàng 7 vừa đẹp

        const allPassed = r2 && r3 && r4 && r5 && r7;

        if (allPassed) {
          playSuccessSound();
          duckPuzzleOutput.innerHTML = `
            <div style="color: #059669; font-size: 1.1rem; margin-bottom: 6px;">🎉 CHÍNH XÁC HOÀN TOÀN! Số vịt là: <strong>${n} con</strong></div>
            <div style="line-height: 1.7;">
              ✅ Hàng 2 xếp chưa vừa: ${n} là số lẻ (49 : 2 = 24 dư 1)<br>
              ✅ Hàng 3 xếp thừa 1 con: 49 : 3 = 16 dư 1<br>
              ✅ Hàng 4 xếp chưa tròn: 49 : 4 = 12 dư 1<br>
              ✅ Hàng 5 xếp thiếu 1 con: 49 : 5 = 9 dư 4 (thiếu 1 nữa là 50 con tròn)<br>
              ✅ Xếp thành hàng 7 đẹp thay: 49 : 7 = 7 vừa khít không thừa con nào!
            </div>
          `;
          unlockBadge(1);
        } else {
          playErrorSound();
          duckPuzzleOutput.innerHTML = `
            <div style="color: #dc2626; margin-bottom: 6px;">❌ Số vịt = <strong>${n} con</strong> chưa thỏa mãn bài thơ:</div>
            <div style="line-height: 1.6; font-size: 0.9rem;">
              • Hàng 2 (số lẻ): ${r2 ? '✅ Đạt' : '❌ Lỗi (là số chẵn)'}<br>
              • Hàng 3 (dư 1): ${r3 ? '✅ Đạt' : `❌ Lỗi (${n} : 3 dư ${n % 3})`}<br>
              • Hàng 5 (dư 4, thiếu 1): ${r5 ? '✅ Đạt' : `❌ Lỗi (${n} : 5 dư ${n % 5})`}<br>
              • Hàng 7 (chia hết): ${r7 ? '✅ Đạt' : `❌ Lỗi (${n} : 7 dư ${n % 7})`}
            </div>
          `;
        }
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

      // Badge 3: Question 8 (Chia túi quà cam, xoài, bơ)
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
