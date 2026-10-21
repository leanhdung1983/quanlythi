// JAVASCRIPT CHO BÀI 39: BẢNG THỐNG KÊ VÀ BIỂU ĐỒ TRANH - TOÁN 6 TẬP 2

document.addEventListener('DOMContentLoaded', () => {
  // --- TRẠNG THÁI NGƯỜI CHƠI ---
  const state = {
    playerName: 'Nhà Thống Kê Tranh 6',
    playerAvatar: '👨‍🎨',
    score: 0,
    stars: 0,
    streak: 0,
    soundEnabled: true,
    answeredQuestions: new Set(),
    unlockedBadges: new Set()
  };

  // --- ÂM THANH TỔNG HỢP WEB AUDIO API ---
  const AudioEngine = {
    ctx: null,
    init() {
      if (!this.ctx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
          this.ctx = new AudioContext();
        }
      }
    },
    playTone(freq, type = 'sine', duration = 0.2, gainVal = 0.15) {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(gainVal, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      } catch (e) {}
    },
    click() {
      this.playTone(600, 'triangle', 0.08, 0.1);
    },
    correct() {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [523.25, 659.25, 783.99, 1046.50].forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = f;
          gain.gain.setValueAtTime(0.12, now + idx * 0.08);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.08);
          osc.stop(now + idx * 0.08 + 0.25);
        });
      } catch (e) {}
    },
    wrong() {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        [240, 180].forEach((f, idx) => {
          const osc = this.ctx.createOscillator();
          const gain = this.ctx.createGain();
          osc.type = 'sawtooth';
          osc.frequency.value = f;
          gain.gain.setValueAtTime(0.15, now + idx * 0.15);
          gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.25);
          osc.connect(gain);
          gain.connect(this.ctx.destination);
          osc.start(now + idx * 0.15);
          osc.stop(now + idx * 0.15 + 0.25);
        });
      } catch (e) {}
    },
    fanfare() {
      if (!state.soundEnabled) return;
      this.init();
      if (!this.ctx) return;
      try {
        const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51];
        notes.forEach((f, i) => {
          setTimeout(() => this.playTone(f, 'sine', 0.35, 0.2), i * 120);
        });
      } catch (e) {}
    }
  };

  // --- CẬP NHẬT GIAO DIỆN HUD ---
  function updateHUD() {
    document.getElementById('hud-score').textContent = `${state.score} XP`;
    document.getElementById('hud-stars').textContent = `${state.stars} / 5`;
    document.getElementById('hud-streak').textContent = `${state.streak} Chuỗi`;
    document.getElementById('hud-name').textContent = state.playerName;
    document.getElementById('hud-avatar').textContent = state.playerAvatar;

    let rank = 'Thực Tập Biểu Đồ Tranh';
    if (state.score >= 200) rank = 'Kiến Trúc Sư Biểu Đồ Tranh 6';
    else if (state.score >= 120) rank = 'Chuyên Gia Trực Quan Hóa';
    else if (state.score >= 50) rank = 'Họa Sĩ Thống Kê';
    document.getElementById('hud-rank').textContent = rank;

    checkBadges();
  }

  function addScore(pts) {
    state.score += pts;
    state.streak += 1;
    updateHUD();
  }

  function resetStreak() {
    state.streak = 0;
    updateHUD();
  }

  // --- HỆ THỐNG HUY HIỆU ---
  function checkBadges() {
    if (state.score >= 50 && !state.unlockedBadges.has('b1')) {
      unlockBadge('b1', 'badge-1');
    }
    if (state.stars >= 2 && !state.unlockedBadges.has('b2')) {
      unlockBadge('b2', 'badge-2');
    }
    if (state.stars >= 3 && !state.unlockedBadges.has('b3')) {
      unlockBadge('b3', 'badge-3');
    }
    if (state.stars >= 4 && !state.unlockedBadges.has('b4')) {
      unlockBadge('b4', 'badge-4');
    }
    if (state.score >= 180 && !state.unlockedBadges.has('b5')) {
      unlockBadge('b5', 'badge-5');
    }
  }

  function unlockBadge(bId, elemId) {
    state.unlockedBadges.add(bId);
    const elem = document.getElementById(elemId);
    if (elem) {
      elem.classList.add('unlocked');
    }
    AudioEngine.fanfare();
  }

  // --- MODAL KHỞI TẠO ---
  const startModal = document.getElementById('start-modal');
  const avatarBtns = document.querySelectorAll('.avatar-btn');
  const playerNameInput = document.getElementById('player-name-input');
  const btnStart = document.getElementById('btn-start');

  avatarBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      AudioEngine.click();
      avatarBtns.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      state.playerAvatar = btn.getAttribute('data-avatar');
    });
  });

  btnStart.addEventListener('click', () => {
    AudioEngine.click();
    const val = playerNameInput.value.trim();
    if (val) state.playerName = val;
    startModal.classList.add('hidden');
    updateHUD();
  });

  // Sound toggle
  const soundBtn = document.getElementById('btn-sound-toggle');
  soundBtn.addEventListener('click', () => {
    state.soundEnabled = !state.soundEnabled;
    soundBtn.textContent = state.soundEnabled ? '🔊 Âm thanh: Bật' : '🔇 Âm thanh: Tắt';
    AudioEngine.click();
  });

  // --- LAB 1: TRÌNH CHUYỂN ĐỔI BẢNG THỐNG KÊ SANG BIỂU ĐỒ TRANH (ÁO S, M, L) ---
  const inputS = document.getElementById('input-s');
  const inputM = document.getElementById('input-m');
  const inputL = document.getElementById('input-l');
  const valS = document.getElementById('val-s');
  const valM = document.getElementById('val-m');
  const valL = document.getElementById('val-l');

  const rowS = document.getElementById('picto-row-s');
  const rowM = document.getElementById('picto-row-m');
  const rowL = document.getElementById('picto-row-l');
  const countS = document.getElementById('picto-count-s');
  const countM = document.getElementById('picto-count-m');
  const countL = document.getElementById('picto-count-l');
  const legendText = document.getElementById('picto-legend-text');
  const scaleBtns = document.querySelectorAll('.btn-scale-select');

  let shirtScale = 2; // 1 icon = 2 shirts (or 5)

  function renderPictograph() {
    const s = parseInt(inputS.value);
    const m = parseInt(inputM.value);
    const l = parseInt(inputL.value);

    valS.textContent = `${s} chiếc`;
    valM.textContent = `${m} chiếc`;
    valL.textContent = `${l} chiếc`;

    countS.textContent = s;
    countM.textContent = m;
    countL.textContent = l;

    function buildIcons(qty, scale) {
      const fullCount = Math.floor(qty / scale);
      const remainder = qty % scale;
      let html = '';
      for (let i = 0; i < fullCount; i++) {
        html += '<span class="icon-item">👕</span>';
      }
      if (remainder > 0) {
        html += `<span class="icon-item" style="opacity:0.6; filter:grayscale(0.5); font-size:1.1rem;" title="${remainder} chiếc">👕</span>`;
      }
      return html;
    }

    rowS.innerHTML = buildIcons(s, shirtScale);
    rowM.innerHTML = buildIcons(m, shirtScale);
    rowL.innerHTML = buildIcons(l, shirtScale);

    legendText.textContent = `(Mỗi 👕 ứng với ${shirtScale} chiếc áo)`;
  }

  [inputS, inputM, inputL].forEach(inp => {
    inp.addEventListener('input', () => {
      renderPictograph();
      state.stars = Math.max(state.stars, 2);
      checkBadges();
      updateHUD();
    });
  });

  scaleBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      AudioEngine.click();
      scaleBtns.forEach(b => {
        b.classList.remove('active');
        b.style.background = 'white';
        b.style.color = 'var(--text-muted)';
      });
      btn.classList.add('active');
      btn.style.background = '#ffedd5';
      btn.style.color = 'var(--primary-dark)';
      shirtScale = parseInt(btn.getAttribute('data-scale'));
      renderPictograph();
      addScore(15);
      state.stars = Math.max(state.stars, 3);
      checkBadges();
      updateHUD();
    });
  });

  renderPictograph();

  // --- SECTION 3: ĐẤU TRƯỜNG SGK ARENA (10 CÂU HỎI TRANG 73-76) ---
  const questions = [
    {
      id: 1,
      source: 'SGK Trang 74 - Khái niệm',
      text: 'Trong một biểu đồ tranh, thông tin quan trọng nhất cần đọc trước tiên để biết mỗi biểu tượng đại diện cho bao nhiêu đơn vị là:',
      options: [
        'Phần chú giải (quy ước) biểu tượng ở cuối biểu đồ',
        'Tiêu đề của biểu đồ',
        'Số dòng của biểu đồ',
        'Màu sắc của các hình vẽ'
      ],
      correct: 0,
      explain: 'Phần chú giải (quy ước) ở cuối biểu đồ tranh xác định chính xác mỗi biểu tượng tương ứng với bao nhiêu đối tượng.'
    },
    {
      id: 2,
      source: 'SGK Trang 76 - Bài 9.7a',
      text: 'Trong biểu đồ tranh khảo sát cán bộ phường (Bài 9.7), cả tuần có tất cả bao nhiêu lượt người cho ý kiến đánh giá?',
      options: [
        '41 lượt người',
        '35 lượt người',
        '45 lượt người',
        '50 lượt người'
      ],
      correct: 0,
      explain: 'Số lượt đánh giá từng ngày: T2 (9) + T3 (8) + T4 (8) + T5 (10) + T6 (6) = 41 lượt người.'
    },
    {
      id: 3,
      source: 'SGK Trang 76 - Bài 9.7b',
      text: 'Trong biểu đồ tranh Bài 9.7, cả tuần có bao nhiêu lượt người đánh giá "Hài lòng" (😄)?',
      options: [
        '14 lượt',
        '10 lượt',
        '18 lượt',
        '12 lượt'
      ],
      correct: 0,
      explain: 'Đếm số mặt cười 😄 các ngày: T2(4) + T3(3) + T4(2) + T5(3) + T6(2) = 14 lượt hài lòng.'
    },
    {
      id: 4,
      source: 'SGK Trang 76 - Bài 9.7c',
      text: 'Trong biểu đồ tranh Bài 9.7, cả tuần có bao nhiêu lượt người đánh giá "Không hài lòng" (🙁)?',
      options: [
        '8 lượt',
        '5 lượt',
        '12 lượt',
        '15 lượt'
      ],
      correct: 0,
      explain: 'Đếm số mặt buồn 🙁 các ngày: T2(2) + T3(1) + T4(2) + T5(2) + T6(1) = 8 lượt không hài lòng.'
    },
    {
      id: 5,
      source: 'SGK Trang 76 - Bài 9.8a',
      text: 'Biểu đồ tranh bãi đỗ xe (mỗi 🚗 = 3 ô tô). Ngày Thứ Ba có 7 biểu tượng 🚗, số ô tô gửi vào bãi là:',
      options: [
        '21 ô tô',
        '14 ô tô',
        '7 ô tô',
        '28 ô tô'
      ],
      correct: 0,
      explain: 'Mỗi biểu tượng ứng với 3 xe, nên ngày Thứ Ba có: 7 × 3 = 21 chiếc ô tô.'
    },
    {
      id: 6,
      source: 'SGK Trang 76 - Bài 9.8b',
      text: 'Trong biểu đồ tranh bãi đỗ xe (Bài 9.8), ngày nào trong tuần có số lượng ô tô gửi vào bãi ít nhất?',
      options: [
        'Thứ Tư (chỉ có 2 biểu tượng 🚗 = 6 xe)',
        'Thứ Năm',
        'Thứ Hai',
        'Thứ Sáu'
      ],
      correct: 0,
      explain: 'Thứ Tư chỉ có 2 biểu tượng 🚗 tương ứng với 2 × 3 = 6 ô tô, ít nhất trong cả tuần.'
    },
    {
      id: 7,
      source: 'SGK Trang 76 - Bài 9.8c',
      text: 'Tổng số lượt ô tô gửi vào bãi đỗ xe trong cả tuần (từ Thứ Hai đến Thứ Sáu) là bao nhiêu chiếc?',
      options: [
        '69 ô tô',
        '60 ô tô',
        '72 ô tô',
        '65 ô tô'
      ],
      correct: 0,
      explain: 'Tổng số biểu tượng: 5 + 7 + 2 + 3 + 6 = 23 biểu tượng. Tổng số xe = 23 × 3 = 69 chiếc ô tô.'
    },
    {
      id: 8,
      source: 'SGK Trang 76 - Bài 9.9a',
      text: 'Lớp 6A có 36 bạn đăng ký 3 CLB: Tiếng Anh (18 bạn), Tiếng Pháp (12 bạn), Tiếng Nga (6 bạn). Nếu mỗi biểu tượng 🗣️ ứng với 3 học sinh, số biểu tượng cần vẽ cho CLB Tiếng Anh là:',
      options: [
        '6 biểu tượng',
        '9 biểu tượng',
        '4 biểu tượng',
        '3 biểu tượng'
      ],
      correct: 0,
      explain: 'Số biểu tượng cho Tiếng Anh = 18 : 3 = 6 biểu tượng 🗣️.'
    },
    {
      id: 9,
      source: 'SGK Trang 76 - Bài 9.9b',
      text: 'Cũng với số liệu 3 CLB trên, nếu dùng mỗi biểu tượng 🗣️ ứng với 6 học sinh, số biểu tượng lần lượt cho Anh, Pháp, Nga là:',
      options: [
        '3 biểu tượng, 2 biểu tượng, 1 biểu tượng',
        '6 biểu tượng, 4 biểu tượng, 2 biểu tượng',
        '2 biểu tượng, 2 biểu tượng, 1 biểu tượng',
        '3 biểu tượng, 3 biểu tượng, 1 biểu tượng'
      ],
      correct: 0,
      explain: 'Tiếng Anh: 18 : 6 = 3 biểu tượng; Tiếng Pháp: 12 : 6 = 2 biểu tượng; Tiếng Nga: 6 : 6 = 1 biểu tượng.'
    },
    {
      id: 10,
      source: 'SGK Trang 76 - Bài 9.10',
      text: 'Bảng số tin nhắn: T2(6), T3(4), T4(4), T5(2), T6(8). Dùng mỗi biểu tượng ✉️ ứng với 2 tin nhắn. Số biểu tượng ✉️ cần vẽ cho ngày Thứ Sáu là:',
      options: [
        '4 biểu tượng',
        '8 biểu tượng',
        '6 biểu tượng',
        '2 biểu tượng'
      ],
      correct: 0,
      explain: 'Thứ Sáu có 8 tin nhắn, mỗi ✉️ ứng với 2 tin nhắn nên cần vẽ: 8 : 2 = 4 biểu tượng ✉️.'
    }
  ];

  const questionsListElem = document.getElementById('questions-list');
  const arenaProgressText = document.getElementById('arena-progress-text');

  function renderQuestions() {
    questionsListElem.innerHTML = '';
    questions.forEach(q => {
      const card = document.createElement('div');
      card.className = 'question-card';
      card.id = `q-card-${q.id}`;

      card.innerHTML = `
        <div class="q-title">
          <span>Câu ${q.id}: ${q.text}</span>
          <span style="font-size:0.75rem; font-weight:600; color:var(--primary);">${q.source}</span>
        </div>
        <div class="options-grid" id="opt-grid-${q.id}">
          ${q.options.map((opt, oIdx) => `
            <button type="button" class="opt-btn" data-qid="${q.id}" data-oidx="${oIdx}">
              <strong>${String.fromCharCode(65 + oIdx)}.</strong> ${opt}
            </button>
          `).join('')}
        </div>
        <div class="explanation-box" id="explain-${q.id}">
          💡 <strong>Lời giải chi tiết:</strong> ${q.explain}
        </div>
      `;

      questionsListElem.appendChild(card);
    });

    document.querySelectorAll('.opt-btn').forEach(btn => {
      btn.addEventListener('click', handleAnswerClick);
    });
  }

  function handleAnswerClick(e) {
    const btn = e.currentTarget;
    const qid = parseInt(btn.getAttribute('data-qid'));
    const oidx = parseInt(btn.getAttribute('data-oidx'));

    if (state.answeredQuestions.has(qid)) return;

    const q = questions.find(item => item.id === qid);
    const card = document.getElementById(`q-card-${qid}`);
    const explainBox = document.getElementById(`explain-${qid}`);
    const allBtns = card.querySelectorAll('.opt-btn');

    state.answeredQuestions.add(qid);
    allBtns.forEach(b => b.disabled = true);

    if (oidx === q.correct) {
      btn.classList.add('correct');
      card.classList.add('answered-correct');
      AudioEngine.correct();
      addScore(20);
    } else {
      btn.classList.add('wrong');
      allBtns[q.correct].classList.add('correct');
      card.classList.add('answered-wrong');
      AudioEngine.wrong();
      resetStreak();
    }

    explainBox.classList.add('show');
    arenaProgressText.textContent = `Đã hoàn thành: ${state.answeredQuestions.size} / ${questions.length}`;

    if (state.answeredQuestions.size === questions.length) {
      state.stars = 5;
      checkBadges();
      updateHUD();
      AudioEngine.fanfare();
    }
  }

  renderQuestions();

  // --- NÚT IN GIẤY KHEN A4 ---
  const btnPrintCert = document.getElementById('btn-print-certificate');
  btnPrintCert.addEventListener('click', () => {
    AudioEngine.click();
    document.getElementById('cert-player-name').textContent = state.playerName;
    document.getElementById('cert-score-display').textContent = `Tổng điểm thành tích: ${state.score} XP (Đạt ${state.stars}/5 Sao)`;
    window.print();
  });
});
