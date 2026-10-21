// APP.JS - BÀI 28: SỐ THẬP PHÂN (TOÁN 6 TẬP 2)
// Audio Synthesizer, Gamified State, Interactive Labs, SGK 7.1-7.4 Arena, Badges & Cert

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
    studentName: 'Thám Hiểm Cực Bắc Lớp 6',
    avatar: '❄️',
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

  // --- 10 ARENA QUESTIONS (SGK 7.1 - 7.4 + SGK EXERCISES) ---
  const questions = [
    {
      id: 1,
      source: 'SGK Bài 7.1a',
      title: 'Phân số thập phân nào dưới đây được viết chính xác thành số thập phân?',
      options: [
        'A. 21/10 = 2,1 và -35/10 = -3,5',
        'B. 21/10 = 0,21 và -35/10 = -0,35',
        'C. 21/10 = 2,1 và -35/10 = 3,5',
        'D. 21/10 = 21,0 và -35/10 = -35,0'
      ],
      correctIndex: 0,
      hint: 'Mẫu số 10 có một chữ số 0, do đó phần thập phân chỉ có 1 chữ số.',
      explanation: 'Ta có: 21/10 = 2,1 và -35/10 = -3,5. Cả hai phân số đều có mẫu là 10 nên dịch dấu phẩy từ phải sang trái 1 chữ số.'
    },
    {
      id: 2,
      source: 'SGK Bài 7.1a',
      title: 'Viết các phân số thập phân -125/100 và -89/1000 dưới dạng số thập phân:',
      options: [
        'A. -12,5 và -8,9',
        'B. -1,25 và -0,089',
        'C. -1,25 và -0,89',
        'D. -0,125 và -0,0089'
      ],
      correctIndex: 1,
      hint: 'Mẫu 100 lùi 2 chữ số thập phân, mẫu 1000 lùi 3 chữ số thập phân.',
      explanation: 'Ta có: -125/100 = -1,25 (2 chữ số thập phân) và -89/1000 = -0,089 (3 chữ số thập phân, thêm số 0 trước chữ số 8).'
    },
    {
      id: 3,
      source: 'SGK Bài 7.1b',
      title: 'Trong các số: 2,1; -3,5; -1,25; -0,089, có bao nhiêu số thập phân âm?',
      options: [
        'A. 1 số',
        'B. 2 số',
        'C. 3 số',
        'D. 4 số'
      ],
      correctIndex: 2,
      hint: 'Số thập phân âm là các số mang dấu "-" đằng trước.',
      explanation: 'Có 3 số thập phân âm là: -3,5; -1,25 và -0,089. Số 2,1 là số thập phân dương.'
    },
    {
      id: 4,
      source: 'SGK Bài 7.2',
      title: 'Số đối của các số thập phân: -1,2; 4,15; 19,2 lần lượt là:',
      options: [
        'A. 1,2; -4,15; -19,2',
        'B. -1,2; 4,15; 19,2',
        'C. 1,2; 4,15; -19,2',
        'D. 2,1; -5,14; -2,91'
      ],
      correctIndex: 0,
      hint: 'Số đối của a là -a; số đối của -a là a.',
      explanation: 'Số đối của -1,2 là 1,2; số đối của 4,15 là -4,15; số đối của 19,2 là -19,2.'
    },
    {
      id: 5,
      source: 'SGK Bài 7.3a',
      title: 'So sánh hai số thập phân: -421,3 và 0,15:',
      options: [
        'A. -421,3 > 0,15',
        'B. -421,3 = 0,15',
        'C. -421,3 < 0,15',
        'D. Không so sánh được'
      ],
      correctIndex: 2,
      hint: 'Mọi số thập phân âm luôn nhỏ hơn mọi số thập phân dương.',
      explanation: 'Vì -421,3 là số thập phân âm và 0,15 là số thập phân dương nên -421,3 < 0,15.'
    },
    {
      id: 6,
      source: 'SGK Bài 7.3b & Tranh luận',
      title: 'So sánh hai số thập phân âm: -7,52 và -7,6:',
      options: [
        'A. -7,52 < -7,6',
        'B. -7,52 > -7,6',
        'C. -7,52 = -7,6',
        'D. -7,52 ≤ -7,6'
      ],
      correctIndex: 1,
      hint: 'So sánh số đối: 7,52 và 7,6 (tức 7,60). Số đối nào bé hơn thì số âm đó lớn hơn.',
      explanation: 'Ta có: 7,52 < 7,6 (vì ở hàng phần mười 5 < 6). Theo quy tắc so sánh hai số âm: Nếu a < b thì -a > -b. Vậy -7,52 > -7,6.'
    },
    {
      id: 7,
      source: 'SGK Bài 7.4a',
      title: 'Nhiệt độ đông đặc của Rượu (-117°C), Thuỷ ngân (-38,83°C), Nước (0°C). Sắp xếp từ thấp đến cao:',
      options: [
        'A. Nước < Thuỷ ngân < Rượu',
        'B. Rượu < Nước < Thuỷ ngân',
        'C. Thuỷ ngân < Rượu < Nước',
        'D. Rượu < Thuỷ ngân < Nước'
      ],
      correctIndex: 3,
      hint: 'Nhiệt độ càng âm sâu thì càng thấp: 117 > 38,83 > 0 => -117 < -38,83 < 0.',
      explanation: 'Ta có: -117 < -38,83 < 0. Do đó thứ tự từ thấp đến cao là: Rượu (-117°C) < Thuỷ ngân (-38,83°C) < Nước (0°C).'
    },
    {
      id: 8,
      source: 'SGK Bài 7.4b',
      title: 'Theo SGK 7.4, điểm đông đặc của Rượu hay của Thuỷ ngân thấp hơn?',
      options: [
        'A. Điểm đông đặc của Thuỷ ngân thấp hơn',
        'B. Điểm đông đặc của Rượu thấp hơn',
        'C. Hai chất có điểm đông đặc bằng nhau',
        'D. Cả hai đều cao hơn nước'
      ],
      correctIndex: 1,
      hint: 'So sánh -117°C và -38,83°C.',
      explanation: 'Vì -117°C < -38,83°C nên điểm đông đặc của rượu thấp hơn điểm đông đặc của thuỷ ngân.'
    },
    {
      id: 9,
      source: 'SGK Luyện tập 2',
      title: 'Sắp xếp các số sau theo thứ tự từ bé đến lớn: -8,9; -8,152; 0,12; 0',
      options: [
        'A. -8,9 < -8,152 < 0 < 0,12',
        'B. -8,152 < -8,9 < 0 < 0,12',
        'C. 0 < 0,12 < -8,152 < -8,9',
        'D. -8,9 < -8,152 < 0,12 < 0'
      ],
      correctIndex: 0,
      hint: 'So sánh hai số âm: 8,9 > 8,152 => -8,9 < -8,152.',
      explanation: 'So sánh hai số âm: 8,9 > 8,152 nên -8,9 < -8,152. Số 0 đứng giữa các số âm và số dương. Số dương là 0,12. Vậy thứ tự từ bé đến lớn là: -8,9 < -8,152 < 0 < 0,12.'
    },
    {
      id: 10,
      source: 'Vận dụng tổng hợp SGK',
      title: 'Khẳng định nào sau đây là ĐÚNG khi nói về số thập phân?',
      options: [
        'A. Số đối của một số thập phân luôn là số âm',
        'B. Số thập phân âm có phần nguyên luôn là số 0',
        'C. Tổng của một số thập phân và số đối của nó luôn bằng 0',
        'D. Mẫu số của phân số thập phân có thể là bất kỳ số tự nhiên nào'
      ],
      correctIndex: 2,
      hint: 'Hai số đối nhau x và -x luôn có tổng bằng 0.',
      explanation: 'Khẳng định đúng: Tổng của một số thập phân và số đối của nó luôn bằng 0: x + (-x) = 0.'
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
    btnSubstances: document.querySelectorAll('.btn-substance'),
    currentTempVal: document.getElementById('current-temp-val'),
    thermoIndicator: document.getElementById('thermo-indicator'),
    tempSlider: document.getElementById('temp-slider'),
    thermoDetailText: document.getElementById('thermo-detail-text'),
    // Lab 2
    inputNumerator: document.getElementById('input-numerator'),
    selectDenominator: document.getElementById('select-denominator'),
    resFraction: document.getElementById('res-fraction'),
    resDecimal: document.getElementById('res-decimal'),
    resType: document.getElementById('res-type'),
    resIntegerPart: document.getElementById('res-integer-part'),
    resDecimalPart: document.getElementById('res-decimal-part'),
    resOpposite: document.getElementById('res-opposite'),
    btnQuick21: document.getElementById('btn-quick-21'),
    btnQuickM35: document.getElementById('btn-quick-m35'),
    btnQuickM89: document.getElementById('btn-quick-m89'),
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

  // --- INIT EVENT LISTENERS ---
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

    // Setup Lab 1 (Thermometer)
    setupLab1();

    // Setup Lab 2 (Decimal Machine)
    setupLab2();

    // Render Quiz
    renderQuiz();

    // Certificate Button
    el.btnShowCert.addEventListener('click', () => {
      SoundFX.click();
      showCertificate();
    });
  }

  // --- LAB 1: THERMOMETER LOGIC ---
  function setupLab1() {
    function setTemperature(temp) {
      temp = parseFloat(temp);
      el.currentTempVal.textContent = `${temp.toString().replace('.', ',')}°C`;
      el.tempSlider.value = temp;

      // Map -150 to +50 onto 0% to 100%
      // Range: 200 degrees => percent = (temp - (-150)) / 200 * 100
      let percent = ((temp + 150) / 200) * 100;
      percent = Math.max(0, Math.min(100, percent));
      el.thermoIndicator.style.left = `${percent}%`;

      // Update detail explanation
      let desc = '';
      if (temp === -117) {
        desc = '<strong>🍷 Rượu (-117°C):</strong> Cực lạnh! Rượu đông đặc ở nhiệt độ rất thấp so với thuỷ ngân và nước.';
      } else if (temp === -38.83) {
        desc = '<strong>🧪 Thuỷ ngân (-38,83°C):</strong> Kim loại lỏng đông đặc ở -38,83°C. Vẫn cao hơn điểm đông đặc của rượu (-117°C).';
      } else if (temp === 0) {
        desc = '<strong>💧 Nước (0°C):</strong> Nước bắt đầu đóng băng thành băng đá tại 0°C. 0°C cao hơn mọi nhiệt độ âm!';
      } else if (temp < 0) {
        desc = `<strong>❄️ Nhiệt độ âm (${temp.toString().replace('.', ',')}°C):</strong> Nằm bên trái số 0 trên trục số.`;
      } else {
        desc = `<strong>☀️ Nhiệt độ dương (${temp.toString().replace('.', ',')}°C):</strong> Nằm bên phải số 0 trên trục số.`;
      }
      el.thermoDetailText.innerHTML = desc;

      state.labExplored.lab1 = true;
      checkLabBadges();
    }

    el.btnSubstances.forEach(btn => {
      btn.addEventListener('click', () => {
        el.btnSubstances.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const temp = btn.getAttribute('data-temp');
        setTemperature(temp);
        SoundFX.click();
      });
    });

    el.tempSlider.addEventListener('input', (e) => {
      el.btnSubstances.forEach(b => b.classList.remove('active'));
      setTemperature(e.target.value);
    });
  }

  // --- LAB 2: DECIMAL CONVERSION MACHINE ---
  function setupLab2() {
    function calculateConversion() {
      const num = parseInt(el.inputNumerator.value, 10);
      const den = parseInt(el.selectDenominator.value, 10);

      if (isNaN(num) || isNaN(den) || den <= 0) return;

      const decimalVal = num / den;
      const decStr = decimalVal.toLocaleString('vi-VN', { maximumFractionDigits: 6 });

      el.resFraction.textContent = `${num} / ${den}`;
      el.resDecimal.textContent = decStr;

      if (num < 0) {
        el.resType.textContent = 'Số thập phân âm';
        el.resType.style.background = '#fee2e2';
        el.resType.style.color = '#b91c1c';
      } else {
        el.resType.textContent = 'Số thập phân dương';
        el.resType.style.background = '#e0f2fe';
        el.resType.style.color = '#0369a1';
      }

      // Integer part & Decimal part
      const intPart = Math.trunc(decimalVal);
      const zeros = Math.log10(den);
      el.resIntegerPart.textContent = intPart.toString();
      el.resDecimalPart.textContent = `${zeros} chữ số sau dấu phẩy`;

      // Opposite
      const oppVal = -decimalVal;
      el.resOpposite.textContent = oppVal.toLocaleString('vi-VN', { maximumFractionDigits: 6 });

      state.labExplored.lab2 = true;
      checkLabBadges();
    }

    el.inputNumerator.addEventListener('input', calculateConversion);
    el.selectDenominator.addEventListener('change', calculateConversion);

    el.btnQuick21.addEventListener('click', () => {
      el.inputNumerator.value = 21;
      el.selectDenominator.value = 10;
      calculateConversion();
      SoundFX.click();
    });

    el.btnQuickM35.addEventListener('click', () => {
      el.inputNumerator.value = -35;
      el.selectDenominator.value = 10;
      calculateConversion();
      SoundFX.click();
    });

    el.btnQuickM89.addEventListener('click', () => {
      el.inputNumerator.value = -89;
      el.selectDenominator.value = 10;
      calculateConversion();
      SoundFX.click();
    });

    calculateConversion();
  }

  function checkLabBadges() {
    if (state.labExplored.lab1 && state.labExplored.lab2 && !state.badges.b2) {
      unlockBadge('b2');
    }
  }

  // --- QUIZ SYSTEM ---
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
      btn.addEventListener('click', (e) => {
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

    // If already answered, don't allow re-clicking
    if (card.classList.contains('answered-correct') || card.classList.contains('answered-wrong')) {
      return;
    }

    const allBtns = card.querySelectorAll('.opt-btn');
    allBtns.forEach(b => b.disabled = true);

    state.answeredCount++;

    if (selectedOpt === q.correctIndex) {
      // CORRECT
      btn.classList.add('correct');
      card.classList.add('answered-correct');
      state.score += 100;
      state.stars += 1;
      state.streak += 1;
      if (state.streak > state.maxStreak) state.maxStreak = state.streak;
      SoundFX.correct();
    } else {
      // WRONG
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
      el.hudRankDisplay.textContent = 'Đại Kiện Tướng Thập Phân';
    } else if (state.stars >= 7) {
      el.hudRankDisplay.textContent = 'Chuyên Gia Số Âm';
    } else if (state.stars >= 4) {
      el.hudRankDisplay.textContent = 'Nhà Khám Phá Cực Bắc';
    } else {
      el.hudRankDisplay.textContent = 'Tân Binh Băng Giá';
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
