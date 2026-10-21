// APP.JS - BÀI 32: ĐIỂM VÀ ĐƯỜNG THẲNG (TOÁN 6 TẬP 2)
// Audio Synthesizer, Gamified State, Canvas Geometry Engine, SGK 8.1-8.5 Arena, Badges & Cert

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
    studentName: 'Kỹ Sư Hình Học Lớp 6',
    avatar: '📐',
    score: 0,
    stars: 0,
    streak: 0,
    maxStreak: 0,
    answeredCount: 0,
    points: [
      { id: 'A', x: 100, y: 140, dragging: false },
      { id: 'B', x: 300, y: 140, dragging: false },
      { id: 'C', x: 500, y: 140, dragging: false }
    ],
    mode: 'collinear',
    labExplored: { lab1: false, lab2: false },
    badges: {
      b1: false,
      b2: false,
      b3: false,
      b4: false,
      b5: false
    }
  };

  // --- 10 ARENA QUESTIONS (SGK 8.1 - 8.5) ---
  const questions = [
    {
      id: 1,
      source: 'SGK Bài 8.1a',
      title: 'Quan sát Hình 8.11, giao điểm của hai đường thẳng a và b là:',
      options: [
        'A. Điểm P',
        'B. Điểm A',
        'C. Điểm B',
        'D. Không có giao điểm'
      ],
      correctIndex: 0,
      hint: 'Giao điểm là điểm chung duy nhất của hai đường thẳng cắt nhau.',
      explanation: 'Hai đường thẳng a và b cắt nhau tại điểm chung duy nhất là điểm P. Vậy giao điểm là điểm P.'
    },
    {
      id: 2,
      source: 'SGK Bài 8.1b',
      title: 'Quan sát Hình 8.11, câu nào sau đây diễn đạt đúng quan hệ thuộc/không thuộc của điểm A?',
      options: [
        'A. A ∈ b và A ∉ a',
        'B. A ∈ a và A ∉ b',
        'C. A ∈ a và A ∈ b',
        'D. A ∉ a và A ∉ b'
      ],
      correctIndex: 0,
      hint: 'Điểm A nằm trên đường thẳng b và không nằm trên đường thẳng a.',
      explanation: 'Ta thấy điểm A nằm trên đường thẳng b nên A ∈ b; điểm A không nằm trên đường thẳng a nên A ∉ a.'
    },
    {
      id: 3,
      source: 'SGK Bài 8.2a',
      title: 'Quan sát Hình 8.12, có bao nhiêu bộ ba điểm thẳng hàng?',
      options: [
        'A. 1 bộ ba điểm (A, B, C)',
        'B. 2 bộ ba điểm',
        'C. 3 bộ ba điểm',
        'D. 4 bộ ba điểm'
      ],
      correctIndex: 0,
      hint: 'Chỉ có 3 điểm A, B, C cùng nằm trên một đường thẳng đứng.',
      explanation: 'Chỉ có ba điểm A, B, C cùng nằm trên một đường thẳng nên có 1 bộ ba điểm thẳng hàng duy nhất là (A, B, C).'
    },
    {
      id: 4,
      source: 'SGK Bài 8.2b',
      title: 'Quan sát Hình 8.12, bộ ba điểm nào sau đây KHÔNG thẳng hàng?',
      options: [
        'A. Ba điểm S, A, B',
        'B. Ba điểm A, B, C',
        'C. Không có bộ nào',
        'D. Tất cả các bộ ba điểm đều thẳng hàng'
      ],
      correctIndex: 0,
      hint: 'Điểm S không cùng nằm trên đường thẳng đi qua A và B.',
      explanation: 'Vì điểm S không nằm trên đường thẳng đi qua A và B nên ba điểm S, A, B không thẳng hàng.'
    },
    {
      id: 5,
      source: 'SGK Bài 8.2c',
      title: 'Bốn điểm A, B, C, S trong Hình 8.12 có thẳng hàng không?',
      options: [
        'A. Không thẳng hàng',
        'B. Có thẳng hàng',
        'C. Thẳng hàng khi nối với nhau',
        'D. Chỉ thẳng hàng khi kéo dài đường thẳng'
      ],
      correctIndex: 0,
      hint: 'Bốn điểm thẳng hàng là 4 điểm cùng thuộc một đường thẳng. Ở đây điểm S nằm ngoài đường thẳng chứa A, B, C.',
      explanation: 'Bốn điểm A, B, C, S không thẳng hàng vì điểm S không thuộc đường thẳng chứa ba điểm A, B, C.'
    },
    {
      id: 6,
      source: 'SGK Bài 8.3',
      title: 'Cho bốn điểm A, B, C, D thẳng hàng theo thứ tự đó. Có bao nhiêu bộ ba điểm thẳng hàng?',
      options: [
        'A. 4 bộ ba: (A, B, C), (A, B, D), (A, C, D), (B, C, D)',
        'B. 2 bộ ba điểm',
        'C. 3 bộ ba điểm',
        'D. 1 bộ ba điểm'
      ],
      correctIndex: 0,
      hint: 'Chọn 3 điểm bất kì trong 4 điểm thẳng hàng: C(4, 3) = 4 bộ.',
      explanation: 'Mọi bộ ba điểm lấy từ 4 điểm thẳng hàng đều thẳng hàng. Đó là: (A, B, C); (A, B, D); (A, C, D); (B, C, D).'
    },
    {
      id: 7,
      source: 'SGK Bài 8.4',
      title: 'Hình 8.13 mô tả 4 đường thẳng và 5 điểm A, B, C, D, E. Điểm D nằm trên 3 đường thẳng, D là điểm nào?',
      options: [
        'A. Đỉnh chung (giao điểm của 3 đường thẳng)',
        'B. Điểm nằm trên đáy cùng với A, B, C',
        'C. Điểm nằm ngoài tất cả các đường thẳng',
        'D. Điểm E'
      ],
      correctIndex: 0,
      hint: 'Chỉ có giao điểm đỉnh là nơi hội tụ của 3 đường thẳng.',
      explanation: 'Quan sát Hình 8.13, chỉ có duy nhất một đỉnh là điểm giao nhau của 3 đường thẳng, đó chính là vị trí của điểm D.'
    },
    {
      id: 8,
      source: 'SGK Bài 8.5',
      title: 'Hai đường thẳng song song là hai đường thẳng:',
      options: [
        'A. Không có điểm chung nào',
        'B. Có đúng một điểm chung',
        'C. Có vô số điểm chung',
        'D. Cắt nhau tại một góc 90 độ'
      ],
      correctIndex: 0,
      hint: 'Định nghĩa SGK trang 46: Hai đường thẳng song song là hai đường thẳng không có điểm chung.',
      explanation: 'Theo định nghĩa trong SGK Toán 6: Hai đường thẳng song song là hai đường thẳng không có điểm chung.'
    },
    {
      id: 9,
      source: 'SGK Luyện tập 2',
      title: 'Cho ba điểm A, B, C không thẳng hàng. Vẽ các đường thẳng đi qua từng cặp điểm. Số đường thẳng vẽ được là:',
      options: [
        'A. 3 đường thẳng (AB, BC, CA)',
        'B. 1 đường thẳng',
        'C. 2 đường thẳng',
        'D. 4 đường thẳng'
      ],
      correctIndex: 0,
      hint: 'Qua 2 điểm vẽ được 1 đường thẳng. Ba cặp điểm tạo nên 3 đường thẳng đôi một cắt nhau.',
      explanation: 'Ba điểm không thẳng hàng tạo thành 3 đường thẳng: đường thẳng AB, đường thẳng BC và đường thẳng CA. Chúng cắt nhau đôi một.'
    },
    {
      id: 10,
      source: 'SGK Thử thách nhỏ',
      title: 'Cho đường thẳng d và hai điểm phân biệt A, B ∉ d. Khi nào KHÔNG THỂ tìm được điểm C ∈ d sao cho A, B, C thẳng hàng?',
      options: [
        'A. Khi đường thẳng AB song song với đường thẳng d',
        'B. Khi đường thẳng AB cắt đường thẳng d',
        'C. Khi điểm A và B nằm khác phía so với d',
        'D. Luôn luôn tìm được điểm C'
      ],
      correctIndex: 0,
      hint: 'A, B, C thẳng hàng tức là C phải là giao điểm của đường thẳng AB và đường thẳng d. Nếu AB // d thì không có giao điểm!',
      explanation: 'Để A, B, C thẳng hàng thì C phải thuộc đường thẳng AB. Do C ∈ d nên C là giao điểm của AB và d. Nếu AB song song với d thì chúng không có điểm chung, do đó không thể tìm được điểm C.'
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
    // Canvas & Lab 1
    canvas: document.getElementById('geo-canvas'),
    geoInfoBox: document.getElementById('geo-info-box'),
    btnDrawCollinear: document.getElementById('btn-draw-collinear'),
    btnDrawTriangle: document.getElementById('btn-draw-triangle'),
    btnDrawIntersect: document.getElementById('btn-draw-intersect'),
    btnClearCanvas: document.getElementById('btn-clear-canvas'),
    // Lab 2
    btnInspect811: document.getElementById('btn-inspect-811'),
    res811: document.getElementById('res-811'),
    btnInspect812: document.getElementById('btn-inspect-812'),
    res812: document.getElementById('res-812'),
    btnInspect813: document.getElementById('btn-inspect-813'),
    res813: document.getElementById('res-813'),
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

  let ctx = null;

  // --- INIT APPLICATION ---
  function initApp() {
    SoundFX.init();
    if (el.canvas) {
      ctx = el.canvas.getContext('2d');
    }

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

    // Setup Canvas Lab 1
    setupLab1Canvas();

    // Setup Lab 2
    setupLab2();

    // Render Quiz
    renderQuiz();

    // Certificate Button
    el.btnShowCert.addEventListener('click', () => {
      SoundFX.click();
      showCertificate();
    });
  }

  // --- LAB 1: INTERACTIVE CANVAS GEOMETRY ---
  function setupLab1Canvas() {
    if (!ctx) return;

    function draw() {
      ctx.clearRect(0, 0, el.canvas.width, el.canvas.height);

      // Draw grid
      ctx.strokeStyle = '#f1f5f9';
      ctx.lineWidth = 1;
      for (let x = 0; x < el.canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, el.canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < el.canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(el.canvas.width, y);
        ctx.stroke();
      }

      const pA = state.points[0];
      const pB = state.points[1];
      const pC = state.points[2];

      // Draw line AB extended
      if (pA && pB) {
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        const dx = pB.x - pA.x;
        const dy = pB.y - pA.y;
        ctx.moveTo(pA.x - dx * 3, pA.y - dy * 3);
        ctx.lineTo(pB.x + dx * 3, pB.y + dy * 3);
        ctx.stroke();
      }

      // Check collinearity of A, B, C
      // Area of triangle = 0.5 * |x1(y2 - y3) + x2(y3 - y1) + x3(y1 - y2)|
      const area = 0.5 * Math.abs(pA.x * (pB.y - pC.y) + pB.x * (pC.y - pA.y) + pC.x * (pA.y - pB.y));
      const isCollinear = area < 150; // tolerance

      if (isCollinear) {
        el.geoInfoBox.innerHTML = `<strong>✨ Kết luận:</strong> Ba điểm A, B, C <strong>THẲNG HÀNG</strong>! Chúng cùng thuộc một đường thẳng.`;
        el.geoInfoBox.style.borderLeftColor = '#10b981';
      } else {
        el.geoInfoBox.innerHTML = `<strong>🔺 Kết luận:</strong> Ba điểm A, B, C <strong>KHÔNG THẲNG HÀNG</strong>! Điểm C không thuộc đường thẳng AB. Ba điểm này tạo thành 3 đỉnh của một tam giác.`;
        el.geoInfoBox.style.borderLeftColor = '#0284c7';

        // Draw triangle outline
        ctx.strokeStyle = '#bae6fd';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.beginPath();
        ctx.moveTo(pB.x, pB.y);
        ctx.lineTo(pC.x, pC.y);
        ctx.lineTo(pA.x, pA.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw points
      state.points.forEach((pt) => {
        ctx.fillStyle = pt.id === 'C' && !isCollinear ? '#ea580c' : '#0284c7';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'white';
        ctx.stroke();

        ctx.font = 'bold 14px Segoe UI, sans-serif';
        ctx.fillStyle = '#0f172a';
        ctx.fillText(pt.id, pt.x + 10, pt.y - 10);
      });
    }

    // Dragging logic
    let activePoint = null;

    function getMousePos(evt) {
      const rect = el.canvas.getBoundingClientRect();
      const scaleX = el.canvas.width / rect.width;
      const scaleY = el.canvas.height / rect.height;
      return {
        x: (evt.clientX - rect.left) * scaleX,
        y: (evt.clientY - rect.top) * scaleY
      };
    }

    el.canvas.addEventListener('mousedown', (e) => {
      const pos = getMousePos(e);
      state.points.forEach(pt => {
        const dist = Math.hypot(pt.x - pos.x, pt.y - pos.y);
        if (dist < 15) {
          activePoint = pt;
          pt.dragging = true;
          SoundFX.click();
        }
      });
    });

    el.canvas.addEventListener('mousemove', (e) => {
      if (activePoint && activePoint.dragging) {
        const pos = getMousePos(e);
        activePoint.x = Math.max(20, Math.min(el.canvas.width - 20, pos.x));
        activePoint.y = Math.max(20, Math.min(el.canvas.height - 20, pos.y));
        draw();
        state.labExplored.lab1 = true;
        checkLabBadges();
      }
    });

    window.addEventListener('mouseup', () => {
      if (activePoint) {
        activePoint.dragging = false;
        activePoint = null;
      }
    });

    // Quick Buttons
    el.btnDrawCollinear.addEventListener('click', () => {
      state.points[0] = { id: 'A', x: 100, y: 140, dragging: false };
      state.points[1] = { id: 'B', x: 300, y: 140, dragging: false };
      state.points[2] = { id: 'C', x: 500, y: 140, dragging: false };
      draw();
      SoundFX.click();
      state.labExplored.lab1 = true;
      checkLabBadges();
    });

    el.btnDrawTriangle.addEventListener('click', () => {
      state.points[0] = { id: 'A', x: 120, y: 200, dragging: false };
      state.points[1] = { id: 'B', x: 480, y: 200, dragging: false };
      state.points[2] = { id: 'C', x: 300, y: 60, dragging: false };
      draw();
      SoundFX.click();
      state.labExplored.lab1 = true;
      checkLabBadges();
    });

    el.btnDrawIntersect.addEventListener('click', () => {
      state.points[0] = { id: 'A', x: 150, y: 80, dragging: false };
      state.points[1] = { id: 'B', x: 450, y: 200, dragging: false };
      state.points[2] = { id: 'C', x: 150, y: 200, dragging: false };
      draw();
      SoundFX.click();
      state.labExplored.lab1 = true;
      checkLabBadges();
    });

    el.btnClearCanvas.addEventListener('click', () => {
      state.points[0] = { id: 'A', x: 100, y: 140, dragging: false };
      state.points[1] = { id: 'B', x: 300, y: 140, dragging: false };
      state.points[2] = { id: 'C', x: 300, y: 60, dragging: false };
      draw();
      SoundFX.click();
    });

    draw();
  }

  // --- LAB 2: SHAPES INSPECTION ---
  function setupLab2() {
    el.btnInspect811.addEventListener('click', () => {
      el.res811.style.display = 'block';
      SoundFX.click();
      state.labExplored.lab2 = true;
      checkLabBadges();
    });

    el.btnInspect812.addEventListener('click', () => {
      el.res812.style.display = 'block';
      SoundFX.click();
      state.labExplored.lab2 = true;
      checkLabBadges();
    });

    el.btnInspect813.addEventListener('click', () => {
      el.res813.style.display = 'block';
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
      el.hudRankDisplay.textContent = 'Đại Kiện Tướng Hình Học Phẳng';
    } else if (state.stars >= 7) {
      el.hudRankDisplay.textContent = 'Kỹ Sư Điểm & Đường Thẳng';
    } else if (state.stars >= 4) {
      el.hudRankDisplay.textContent = 'Nhà Hình Học Trẻ';
    } else {
      el.hudRankDisplay.textContent = 'Tập Sự Hình Học';
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
