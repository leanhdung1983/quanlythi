// JAVASCRIPT CHO BÀI 38: DỮ LIỆU VÀ THU THẬP DỮ LIỆU - TOÁN 6 TẬP 2

document.addEventListener('DOMContentLoaded', () => {
  // --- TRẠNG THÁI NGƯỜI CHƠI ---
  const state = {
    playerName: 'Nhà Thống Kê 6',
    playerAvatar: '👨‍🔬',
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
      this.playTone(550, 'triangle', 0.08, 0.1);
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
        [220, 160].forEach((f, idx) => {
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

    let rank = 'Thực Tập Thống Kê';
    if (state.score >= 200) rank = 'Bậc Thầy Khoa Học Dữ Liệu 6';
    else if (state.score >= 120) rank = 'Chuyên Viên Phân Tích Dữ Liệu';
    else if (state.score >= 50) rank = 'Thám Tử Dữ Liệu';
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

  // --- LAB 1: PHÂN LOẠI DỮ LIỆU & THÁM TỬ BẤT HỢP LÍ ---
  const initialChips = [
    { id: 'c1', text: 'Cân nặng trẻ sơ sinh: 3200 gam', isNumber: true },
    { id: 'c2', text: 'Quốc tịch: Việt Nam, Pháp, Nhật', isNumber: false },
    { id: 'c3', text: 'Nhiệt độ cao nhất: 34°C', isNumber: true },
    { id: 'c4', text: 'Tên món ăn: Bánh chưng, Pizza', isNumber: false },
    { id: 'c5', text: 'Chiều cao cây gỗ: 12,5 mét', isNumber: true },
    { id: 'c6', text: 'Thực vật: Dương xỉ, Thông, Bưởi', isNumber: false }
  ];

  const poolElem = document.getElementById('data-chips-pool');
  const poolNumbers = document.getElementById('pool-numbers');
  const poolTexts = document.getElementById('pool-texts');
  let classifiedCount = 0;

  function renderChips() {
    poolElem.innerHTML = '';
    initialChips.forEach(item => {
      const chip = document.createElement('div');
      chip.className = 'data-chip';
      chip.id = `chip-${item.id}`;
      chip.textContent = item.text;
      chip.addEventListener('click', () => classifyChip(item, chip));
      poolElem.appendChild(chip);
    });
  }

  function classifyChip(item, elem) {
    if (elem.dataset.classified) return;
    AudioEngine.correct();
    elem.dataset.classified = 'true';

    if (item.isNumber) {
      elem.classList.add('classified-number');
      poolNumbers.appendChild(elem);
    } else {
      elem.classList.add('classified-text');
      poolTexts.appendChild(elem);
    }

    classifiedCount++;
    addScore(10);

    if (classifiedCount === initialChips.length) {
      state.stars = Math.max(state.stars, 2);
      checkBadges();
      updateHUD();
    }
  }

  renderChips();

  // Thám tử soi dữ liệu bất hợp lí (Bài 9.4)
  const detectButtons = document.querySelectorAll('.btn-detect-item');
  const detectResultBox = document.getElementById('detective-result-box');
  const detectedInvalids = new Set();

  detectButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const word = btn.getAttribute('data-word');
      const isInvalid = btn.getAttribute('data-invalid') === 'true';

      detectResultBox.style.display = 'block';

      if (isInvalid) {
        AudioEngine.correct();
        btn.style.background = '#fee2e2';
        btn.style.borderColor = '#ef4444';
        btn.style.color = '#991b1b';
        detectedInvalids.add(word);

        if (word === 'Paris') {
          detectResultBox.style.background = '#fef2f2';
          detectResultBox.style.color = '#991b1b';
          detectResultBox.innerHTML = `🎯 <strong>Chính xác!</strong> "Paris" là thủ đô của nước Pháp (thuộc Châu Âu), không thuộc phạm vi thủ đô các quốc gia Châu Á!`;
        } else if (word === 'Đà Nẵng') {
          detectResultBox.style.background = '#fef2f2';
          detectResultBox.style.color = '#991b1b';
          detectResultBox.innerHTML = `🎯 <strong>Chính xác!</strong> "Đà Nẵng" là thành phố trực thuộc trung ương của Việt Nam, không phải là thủ đô của một quốc gia!`;
        }

        if (detectedInvalids.size === 2) {
          addScore(30);
          state.stars = Math.max(state.stars, 4);
          checkBadges();
          updateHUD();
          detectResultBox.innerHTML += `<br>⭐ <strong>Tuyệt vời!</strong> Bạn đã phát hiện trọn vẹn cả hai dữ liệu bất hợp lí trong Bài 9.4 SGK!`;
        }
      } else {
        AudioEngine.click();
        btn.style.background = '#dcfce7';
        btn.style.borderColor = '#10b981';
        btn.style.color = '#166534';
        detectResultBox.style.background = '#ecfdf5';
        detectResultBox.style.color = '#065f46';
        detectResultBox.innerHTML = `ℹ️ <strong>"${word}"</strong> là thủ đô hợp lệ của một quốc gia châu Á (Hà Nội - VN, Bắc Kinh - TQ, Tokyo - Nhật Bản).`;
      }
    });
  });

  // --- LAB 2: GIEO ĐỒNG XU & CAMERA GIAO THÔNG ---
  const coinElement = document.getElementById('coin-element');
  const tallyCountS = document.getElementById('tally-count-s');
  const tallyCountN = document.getElementById('tally-count-n');
  const tallyCountTotal = document.getElementById('tally-count-total');
  const tallyMarkS = document.getElementById('tally-mark-s');
  const tallyMarkN = document.getElementById('tally-mark-n');
  const tallyValS = document.getElementById('tally-val-s');
  const tallyValN = document.getElementById('tally-val-n');

  let countS = 0;
  let countN = 0;

  function formatTally(count) {
    if (count === 0) return '-';
    const groupsOfFive = Math.floor(count / 5);
    const remainder = count % 5;
    let res = '';
    for (let i = 0; i < groupsOfFive; i++) {
      res += '卌 ';
    }
    if (remainder > 0) {
      res += '|'.repeat(remainder);
    }
    return res;
  }

  function updateCoinDisplay() {
    tallyCountS.textContent = countS;
    tallyCountN.textContent = countN;
    tallyCountTotal.textContent = countS + countN;
    tallyValS.textContent = countS;
    tallyValN.textContent = countN;
    tallyMarkS.textContent = formatTally(countS);
    tallyMarkN.textContent = formatTally(countN);
  }

  function tossOnce() {
    coinElement.classList.add('flipping');
    AudioEngine.click();

    setTimeout(() => {
      coinElement.classList.remove('flipping');
      const isHead = Math.random() < 0.5;
      if (isHead) {
        countS++;
        coinElement.textContent = 'S';
        coinElement.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
      } else {
        countN++;
        coinElement.textContent = 'N';
        coinElement.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
      }
      updateCoinDisplay();
      state.stars = Math.max(state.stars, 3);
      checkBadges();
      updateHUD();
    }, 400);
  }

  document.getElementById('btn-toss-1').addEventListener('click', tossOnce);

  document.getElementById('btn-toss-10').addEventListener('click', () => {
    AudioEngine.fanfare();
    for (let i = 0; i < 10; i++) {
      if (Math.random() < 0.5) countS++;
      else countN++;
    }
    updateCoinDisplay();
    state.stars = Math.max(state.stars, 3);
    addScore(15);
    checkBadges();
    updateHUD();
  });

  document.getElementById('btn-toss-reset').addEventListener('click', () => {
    AudioEngine.click();
    countS = 0;
    countN = 0;
    updateCoinDisplay();
  });

  // Tranh luận Camera giao thông (Trang 72)
  const btnTrafficAsk = document.getElementById('btn-traffic-ask');
  const btnTrafficCam = document.getElementById('btn-traffic-cam');
  const trafficExpBox = document.getElementById('traffic-explanation-box');

  btnTrafficAsk.addEventListener('click', () => {
    AudioEngine.wrong();
    btnTrafficAsk.style.borderColor = 'var(--danger)';
    btnTrafficCam.style.borderColor = 'var(--border)';
    trafficExpBox.style.display = 'block';
    trafficExpBox.style.background = '#fef2f2';
    trafficExpBox.style.color = '#991b1b';
    trafficExpBox.innerHTML = `
      ❌ <strong>Chưa hợp lí (Ý kiến của Vuông):</strong> Việc hỏi trực tiếp người đi đường rất khó thu được kết quả chính xác, 
      vì hành vi vượt đèn đỏ vi phạm luật giao thông nên người vi phạm thường ngại ngùng, không dám thừa nhận hoặc không nhớ hết!
    `;
  });

  btnTrafficCam.addEventListener('click', () => {
    AudioEngine.correct();
    btnTrafficCam.style.borderColor = 'var(--success)';
    btnTrafficAsk.style.borderColor = 'var(--border)';
    trafficExpBox.style.display = 'block';
    trafficExpBox.style.background = '#dcfce7';
    trafficExpBox.style.color = '#166534';
    trafficExpBox.innerHTML = `
      ✅ <strong>Hoàn toàn chính xác (Ý kiến của Tròn)!</strong> 
      Đặt máy quay giám sát tại ngã tư là phương pháp QUAN SÁT KHÁCH QUAN, ghi nhận hình ảnh trung thực 24/7, 
      đo đạc chính xác số lượng phương tiện vi phạm mà không phụ thuộc vào lời khai chủ quan của người tham gia giao thông.
    `;
    addScore(20);
    checkBadges();
    updateHUD();
  });

  // --- SECTION 3: ĐẤU TRƯỜNG SGK ARENA (10 CÂU HỎI TRANG 68-72) ---
  const questions = [
    {
      id: 1,
      source: 'SGK Trang 69 - Khái niệm',
      text: 'Trong thống kê, các thông tin thu thập được như nhiệt độ, số học sinh, tên quốc gia... được gọi chung là gì?',
      options: ['Dữ liệu', 'Công thức', 'Biểu đồ', 'Phương trình'],
      correct: 0,
      explain: 'Các thông tin thu thập được từ thực tế được gọi chung là dữ liệu. Dữ liệu là số được gọi là số liệu.'
    },
    {
      id: 2,
      source: 'SGK Trang 72 - Bài 9.1(1)',
      text: '"Cân nặng của trẻ sơ sinh (đơn vị tính là gam)" thuộc loại dữ liệu nào?',
      options: [
        'Dữ liệu là số (số liệu)',
        'Dữ liệu không phải là số',
        'Dữ liệu hình ảnh',
        'Dữ liệu âm thanh'
      ],
      correct: 0,
      explain: 'Cân nặng của trẻ sơ sinh được đo bằng các con số cụ thể (ví dụ 3200 gam, 3500 gam) nên là dữ liệu số (số liệu).'
    },
    {
      id: 3,
      source: 'SGK Trang 72 - Bài 9.1(2)',
      text: '"Quốc tịch của các học sinh trong một trường quốc tế" thuộc loại dữ liệu nào?',
      options: [
        'Dữ liệu không phải là số',
        'Dữ liệu là số (số liệu)',
        'Số thập phân',
        'Phân số'
      ],
      correct: 0,
      explain: 'Quốc tịch được thể hiện bằng tên gọi các quốc gia (Việt Nam, Hàn Quốc, Mỹ, Pháp...) nên là dữ liệu không phải là số.'
    },
    {
      id: 4,
      source: 'SGK Trang 72 - Bài 9.1(3)',
      text: '"Chiều cao trung bình của một số loài cây thân gỗ (đơn vị tính là mét)" thuộc loại dữ liệu nào?',
      options: [
        'Dữ liệu là số (số liệu)',
        'Dữ liệu không phải là số',
        'Dữ liệu văn bản thuần túy',
        'Dữ liệu logic'
      ],
      correct: 0,
      explain: 'Chiều cao được đo bằng số mét (ví dụ 10 m, 15,5 m) nên là dữ liệu là số (số liệu).'
    },
    {
      id: 5,
      source: 'SGK Trang 72 - Bài 9.2',
      text: 'Đọc bản tin: "Địa phương có nhiều ca mắc mới nhất là Hà Nội 20 ca, kế đó là Bình Thuận 9 ca, TP.HCM 9 ca". Số liệu ca mắc mới của Hà Nội là:',
      options: ['20 ca', '9 ca', '60 ca', '12 ca'],
      correct: 0,
      explain: 'Bản tin nêu rõ: Hà Nội có nhiều ca mắc mới nhất với 20 trường hợp.'
    },
    {
      id: 6,
      source: 'SGK Trang 72 - Bài 9.3',
      text: 'Bảng thống kê số anh chị em ruột của 35 học sinh lớp 6A có số liệu: 0 em (18 bạn), 1 em (12 bạn), 2 em (5 bạn), 3 em (1 bạn). Điểm bất hợp lí là gì?',
      options: [
        'Tổng số học sinh trong bảng là 36 bạn, vượt quá 35 bạn của lớp 6A',
        'Số học sinh có 0 anh chị em quá nhiều',
        'Không thể có học sinh có 3 anh chị em ruột',
        'Bảng thống kê hoàn toàn hợp lí'
      ],
      correct: 0,
      explain: 'Tổng số học sinh được thống kê là: 18 + 12 + 5 + 1 = 36 học sinh. Con số này không khớp với tổng số 35 học sinh của lớp 6A, do đó bảng số liệu không hợp lí!'
    },
    {
      id: 7,
      source: 'SGK Trang 72 - Bài 9.4',
      text: 'Dãy dữ liệu "Thủ đô của một số quốc gia châu Á: Hà Nội, Bắc Kinh, Paris, Tokyo, Đà Nẵng". Các dữ liệu KHÔNG hợp lí là:',
      options: [
        'Paris và Đà Nẵng',
        'Hà Nội và Bắc Kinh',
        'Tokyo và Paris',
        'Chỉ có Đà Nẵng'
      ],
      correct: 0,
      explain: 'Paris là thủ đô của nước Pháp (Châu Âu, không thuộc Châu Á). Đà Nẵng là thành phố của Việt Nam (không phải thủ đô).'
    },
    {
      id: 8,
      source: 'SGK Trang 72 - Bài 9.5',
      text: 'Để hoàn thiện bảng dữ liệu về môi trường sống, dạng thân, kiểu lá của cây Đậu và cây Bèo tây, phương pháp thu thập dữ liệu phù hợp nhất là:',
      options: [
        'Quan sát trực tiếp hoặc tra cứu tài liệu khoa học',
        'Làm thí nghiệm gieo đồng xu',
        'Đo bằng thước đo góc',
        'Phỏng vấn ngẫu nhiên người đi đường'
      ],
      correct: 0,
      explain: 'Để tìm hiểu về đặc điểm sinh học của thực vật (thân, lá, môi trường sống), phương pháp quan sát thực tế trong tự nhiên hoặc tra cứu sách báo, tài liệu khoa học là phù hợp và chuẩn xác nhất.'
    },
    {
      id: 9,
      source: 'SGK Trang 72 - Bài 9.6',
      text: 'Để thu thập dữ liệu về phương tiện đến trường của các thầy cô giáo trong trường, phương pháp nào sau đây là tối ưu nhất?',
      options: [
        'Lập phiếu hỏi (bảng khảo sát) gửi cho các thầy cô',
        'Đặt camera đếm cả ngày ngoài cổng trường',
        'Làm thí nghiệm tung xúc xắc',
        'Tự đoán mò số lượng'
      ],
      correct: 0,
      explain: 'Lập phiếu hỏi với danh sách các phương tiện (xe máy, xe đạp, ô tô, xe buýt...) phát cho các thầy cô điền là cách thu thập đầy đủ, nhanh chóng và lịch sự nhất.'
    },
    {
      id: 10,
      source: 'SGK Trang 72 - Tranh luận',
      text: 'Muốn thống kê chính xác số lượng người tham gia giao thông vượt đèn đỏ tại một ngã tư trong 1 ngày, phương pháp tốt nhất là:',
      options: [
        'Đặt máy quay giám sát tại ngã tư để ghi nhận khách quan',
        'Đứng hỏi từng người xem họ có vượt đèn đỏ không',
        'Đọc sách lịch sử giao thông',
        'Gieo đồng xu 100 lần'
      ],
      correct: 0,
      explain: 'Đặt camera giám sát tại ngã tư là phương pháp quan sát khách quan, lưu trữ dữ liệu trung thực 24/7 mà không làm cản trở giao thông hay phụ thuộc vào tâm lí che giấu lỗi của người vi phạm.'
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
