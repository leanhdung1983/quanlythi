/* ==========================================================================
   TOÁN 6 - BÀI 2: CÁCH GHI SỐ TỰ NHIÊN (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
   Game Engine: Decimal & Roman Numerals, Matchsticks, Currency Counter,
   Web Audio FX, Streak System, Trophies & Personalized Certificate
   ========================================================================== */

// Global Game State
const state = {
  playerName: 'Nhà Toán Học Nhí',
  playerAvatar: '🎓',
  soundEnabled: true,
  stars: 0,
  streak: 0,
  maxStreak: 0,
  currentSection: 'warmup',
  completedSteps: new Set(),
  unlockedBadges: new Set(),

  // Warm-up selected numbers
  warmupSelected: new Set(),

  // Activity 1: Market bills
  bills: { '100k': 0, '10k': 0, '1k': 0 },

  // Activity 2: Matchsticks
  matchstickChoices: new Set(),

  // Game Challenge
  gameIndex: 0,
  gameScore: 0,
  gameAnsweredCurrent: false
};

// ================= AUDIO SYNTHESIZER =================
class SoundController {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) this.ctx = new AudioCtx();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, delay = 0, vol = 0.15) {
    if (!state.soundEnabled) return;
    try {
      this.init();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      const startTime = this.ctx.currentTime + delay;
      osc.type = type;
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(vol, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(startTime);
      osc.stop(startTime + duration);
    } catch (e) {
      console.log('Audio error:', e);
    }
  }

  playCorrect() {
    this.playTone(523.25, 'sine', 0.15, 0);       // C5
    this.playTone(659.25, 'sine', 0.15, 0.09);    // E5
    this.playTone(783.99, 'sine', 0.2, 0.18);     // G5
    this.playTone(1046.50, 'triangle', 0.35, 0.27); // C6
  }

  playStreak() {
    this.playTone(440, 'triangle', 0.12, 0);
    this.playTone(554.37, 'triangle', 0.12, 0.08);
    this.playTone(659.25, 'triangle', 0.15, 0.16);
    this.playTone(880, 'triangle', 0.3, 0.24);
  }

  playIncorrect() {
    this.playTone(330, 'sawtooth', 0.18, 0, 0.1);
    this.playTone(260, 'sawtooth', 0.25, 0.14, 0.1);
  }

  playClick() {
    this.playTone(600, 'sine', 0.05, 0, 0.08);
  }

  playBadgeUnlock() {
    const chord = [523.25, 659.25, 783.99, 1046.50, 1318.51, 1567.98];
    chord.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.4, idx * 0.08, 0.2);
    });
  }

  playFanfare() {
    const melody = [
      { f: 523.25, d: 0.15, t: 0 },
      { f: 659.25, d: 0.15, t: 0.12 },
      { f: 783.99, d: 0.2, t: 0.24 },
      { f: 1046.50, d: 0.4, t: 0.38 },
      { f: 880, d: 0.2, t: 0.58 },
      { f: 1046.50, d: 0.6, t: 0.78 }
    ];
    melody.forEach(m => this.playTone(m.f, 'triangle', m.d, m.t, 0.2));
  }
}

const sounds = new SoundController();

// ================= FLOATING SCORE POPUPS =================
function spawnFloatingScore(text, sourceEvent = null) {
  const el = document.createElement('div');
  el.className = 'floating-score';
  el.textContent = text;

  let x = window.innerWidth / 2;
  let y = window.innerHeight / 2;

  if (sourceEvent && sourceEvent.clientX) {
    x = sourceEvent.clientX;
    y = sourceEvent.clientY;
  } else {
    x += (Math.random() - 0.5) * 80;
    y += (Math.random() - 0.5) * 60;
  }

  el.style.left = `${Math.max(20, Math.min(window.innerWidth - 160, x))}px`;
  el.style.top = `${Math.max(40, y)}px`;

  document.body.appendChild(el);
  setTimeout(() => {
    if (el.parentNode) el.parentNode.removeChild(el);
  }, 1300);
}

// ================= INITIALIZATION =================
document.addEventListener('DOMContentLoaded', () => {
  const soundBtn = document.getElementById('soundToggleBtn');
  if (soundBtn) {
    soundBtn.addEventListener('click', () => {
      state.soundEnabled = !state.soundEnabled;
      soundBtn.textContent = state.soundEnabled ? '🔊' : '🔇';
      soundBtn.title = state.soundEnabled ? 'Tắt âm thanh' : 'Bật âm thanh';
    });
  }

  initConfetti();
  updateMasterProgress();
});

// ================= START SCREEN & PLAYER PROFILE =================
function chooseAvatar(el, avatarEmoji) {
  sounds.playClick();
  document.querySelectorAll('.avatar-opt').forEach(opt => opt.classList.remove('selected'));
  el.classList.add('selected');
  state.playerAvatar = avatarEmoji;
}

function startGameMission() {
  const nameInput = document.getElementById('playerNameInput');
  let enteredName = nameInput ? nameInput.value.trim() : '';
  if (!enteredName) enteredName = 'Nhà Toán Học Nhí';
  state.playerName = enteredName;

  const hudName = document.getElementById('hudPlayerName');
  const hudAvatar = document.getElementById('hudAvatar');
  if (hudName) hudName.textContent = state.playerName;
  if (hudAvatar) hudAvatar.textContent = state.playerAvatar;

  const overlay = document.getElementById('startScreenOverlay');
  if (overlay) overlay.classList.add('hidden');

  sounds.playStreak();
  triggerConfetti(60);
  spawnFloatingScore(`Chào ${state.playerName}! 🚀`);
}

// ================= STARS, SCORE & STREAKS =================
function addStars(num, evt = null) {
  state.stars += num;
  const starEl = document.getElementById('starCounter');
  if (starEl) {
    starEl.textContent = state.stars;
    starEl.parentElement.style.transform = 'scale(1.25)';
    setTimeout(() => {
      starEl.parentElement.style.transform = 'scale(1)';
    }, 300);
  }
  spawnFloatingScore(`+${num} ⭐`, evt);

  if (state.stars >= 50 && !state.unlockedBadges.has('stars')) {
    unlockBadge('stars');
  }
}

function registerCorrectAnswer(evt = null) {
  state.streak++;
  if (state.streak > state.maxStreak) {
    state.maxStreak = state.streak;
  }

  const streakPill = document.getElementById('hudStreakPill');
  const streakCount = document.getElementById('hudStreakCount');

  if (state.streak >= 2) {
    if (streakPill && streakCount) {
      streakPill.classList.add('show');
      streakCount.textContent = `x${state.streak} COMBO!`;
    }
    sounds.playStreak();
    spawnFloatingScore(`🔥 COMBO x${state.streak}!`, evt);
  } else {
    sounds.playCorrect();
  }

  if (state.streak >= 3 && !state.unlockedBadges.has('streak')) {
    unlockBadge('streak');
  }
}

function registerWrongAnswer() {
  state.streak = 0;
  const streakPill = document.getElementById('hudStreakPill');
  if (streakPill) streakPill.classList.remove('show');
  sounds.playIncorrect();
}

function unlockBadge(badgeKey) {
  state.unlockedBadges.add(badgeKey);
  sounds.playBadgeUnlock();
  triggerConfetti(90);

  const badgeElemMap = {
    decimal: 'badge-decimal',
    roman: 'badge-roman',
    market: 'badge-market',
    streak: 'badge-streak',
    stars: 'badge-stars'
  };

  const elId = badgeElemMap[badgeKey];
  const el = document.getElementById(elId);
  if (el) {
    el.classList.add('unlocked');
    const status = el.querySelector('.badge-status');
    if (status) status.textContent = '✅';
  }

  spawnFloatingScore(`🏆 MỞ KHÓA HUY HIỆU MỚI!`);
}

// ================= NAVIGATION =================
const SECTIONS = ['warmup', 'explore', 'practice', 'game', 'summary'];

function switchSection(secId) {
  sounds.playClick();
  state.currentSection = secId;

  const currentIdx = SECTIONS.indexOf(secId);
  for (let i = 0; i < currentIdx; i++) {
    state.completedSteps.add(SECTIONS[i]);
  }

  document.querySelectorAll('.step-btn').forEach(btn => {
    const step = btn.getAttribute('data-step');
    btn.classList.toggle('active', step === secId);
    if (state.completedSteps.has(step)) {
      btn.classList.add('completed');
    }
  });

  document.querySelectorAll('.lesson-section').forEach(sec => {
    sec.classList.remove('active');
  });
  const activeSec = document.getElementById(`sec-${secId}`);
  if (activeSec) {
    activeSec.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  updateMasterProgress();

  if (secId === 'game' && state.gameIndex === 0 && !state.gameAnsweredCurrent) {
    loadGameQuestion(0);
  }
  if (secId === 'summary') {
    renderCertificate();
  }
}

function updateMasterProgress() {
  const currentIdx = SECTIONS.indexOf(state.currentSection);
  const percent = Math.min(100, Math.round(((currentIdx + 1) / SECTIONS.length) * 100));
  const fill = document.getElementById('masterProgressFill');
  if (fill) fill.style.width = `${percent}%`;
}

// ================= 1. KHỞI ĐỘNG =================
function toggleWarmupNum(btn) {
  sounds.playClick();
  const val = btn.getAttribute('data-val');
  if (state.warmupSelected.has(val)) {
    state.warmupSelected.delete(val);
    btn.classList.remove('btn-primary');
    btn.classList.add('btn-secondary');
  } else {
    state.warmupSelected.add(val);
    btn.classList.remove('btn-secondary');
    btn.classList.add('btn-primary');
  }
}

function checkWarmupAnswer(evt) {
  const expected = new Set(['102', '120', '201', '210']);
  const invalidPicks = ['012', '021'];

  const hasInvalid = invalidPicks.some(num => state.warmupSelected.has(num));
  const missing = Array.from(expected).filter(num => !state.warmupSelected.has(num));

  const fb = document.getElementById('warmupFeedback');

  if (!hasInvalid && missing.length === 0 && state.warmupSelected.size === 4) {
    registerCorrectAnswer(evt);
    triggerConfetti(70);
    addStars(15, evt);
    fb.className = 'feedback-box show correct';
    fb.innerHTML = `
      🎉 <strong>Xuất sắc ${state.playerName}!</strong> Em đã tìm đúng toàn bộ 4 số có ba chữ số: <strong>102; 120; 201; 210</strong>!
      <br>💡 <strong>Ghi nhớ:</strong> Các số <em>012</em> hay <em>021</em> không phải số có 3 chữ số vì chữ số đầu tiên bên trái luôn phải khác 0!
    `;
    state.completedSteps.add('warmup');
    updateMasterProgress();
  } else if (hasInvalid) {
    registerWrongAnswer();
    fb.className = 'feedback-box show incorrect';
    fb.innerHTML = `
      ⚠️ <strong>Chú ý của bạn Pi:</strong> Trong hệ thập phân, <em>chữ số đầu tiên từ trái sang phải phải khác 0</em>. Do đó số <strong>012</strong> và <strong>021</strong> chỉ là số có 2 chữ số (12 và 21), không hợp lệ nhé!
    `;
  } else {
    registerWrongAnswer();
    fb.className = 'feedback-box show incorrect';
    fb.innerHTML = `
      💡 <strong>Gợi ý:</strong> ${state.playerName} còn thiếu một số trường hợp. Tổng cộng có đúng <strong>4 số</strong> có ba chữ số khác nhau ghép từ 0, 1, 2. Hãy tìm thêm nào!
    `;
  }
}

// ================= 2. KHÁM PHÁ (ROMAN CLOCK) =================
function inspectClockNum(roman, decimal) {
  sounds.playClick();
  const fb = document.getElementById('clockFeedback');

  let breakdown = '';
  if (roman === 'IV') breakdown = 'IV = V (5) trừ đi I (1) đứng trước = 4';
  else if (roman === 'IX') breakdown = 'IX = X (10) trừ đi I (1) đứng trước = 9';
  else if (roman === 'VI') breakdown = 'VI = V (5) cộng thêm I (1) đứng sau = 6';
  else if (roman === 'VII') breakdown = 'VII = V (5) + 2 = 7';
  else if (roman === 'VIII') breakdown = 'VIII = V (5) + 3 = 8';
  else if (roman === 'XI') breakdown = 'XI = X (10) + 1 = 11';
  else if (roman === 'XII') breakdown = 'XII = X (10) + 2 = 12';
  else breakdown = `Kí hiệu ${roman} đại diện cho số ${decimal}`;

  fb.innerHTML = `
    <span style="font-size: 1.35rem; font-weight: 900; color: #b45309; font-family: 'Times New Roman';">
      Số La Mã: ${roman} ⟷ Giá trị Thập Phân: ${decimal}
    </span>
    <br><span style="font-size: 1rem; color: #78350f;">${breakdown}</span>
  `;
}

// ================= 3. HOẠT ĐỘNG 1: ĐI CHỢ CÙNG BÁC HOA =================
function changeBillCount(type, delta) {
  sounds.playClick();
  const current = state.bills[type];
  const nextVal = Math.max(0, Math.min(9, current + delta)); // max 9 bills per problem
  state.bills[type] = nextVal;

  document.getElementById(`count_${type}`).textContent = nextVal;

  const total = (state.bills['100k'] * 100000) + (state.bills['10k'] * 10000) + (state.bills['1k'] * 1000);
  document.getElementById('currentMarketTotal').textContent = total.toLocaleString('vi-VN');
}

function checkMarketBillAnswer(evt) {
  const fb = document.getElementById('marketFeedback');
  const count100 = state.bills['100k'];
  const count10 = state.bills['10k'];
  const count1 = state.bills['1k'];

  if (count100 === 4 && count10 === 9 && count1 === 2) {
    registerCorrectAnswer(evt);
    triggerConfetti(70);
    addStars(20, evt);
    unlockBadge('market');

    fb.className = 'feedback-box show correct';
    fb.innerHTML = `
      🎉 <strong>CHÍNH XÁC TUYỆT ĐỐI!</strong> (+20 ⭐)
      <br>• 4 tờ 100 nghìn = 400 000 đồng (hàng trăm nghìn).
      <br>• 9 tờ 10 nghìn = 90 000 đồng (hàng chục nghìn).
      <br>• 2 tờ 1 nghìn = 2 000 đồng (hàng nghìn).
      <br>👉 Tổng cộng: <strong>492 000 đồng</strong>. ${state.playerName} đã mở khóa danh hiệu <strong>Thủ Quỹ Thông Thái 💰</strong>!
    `;
  } else {
    registerWrongAnswer();
    const current = (count100 * 100000) + (count10 * 10000) + (count1 * 1000);
    fb.className = 'feedback-box show incorrect';
    fb.innerHTML = `
      💡 <strong>Gợi ý:</strong> Tổng tiền bác Hoa cần trả là <strong>492 000 đồng</strong> (hiện tại em đang chọn ${current.toLocaleString('vi-VN')} đồng).
      <br>Hãy phân tích: 492 nghìn = (4 × 100 nghìn) + (9 × 10 nghìn) + (2 × 1 nghìn) nhé!
    `;
  }
}

function resetMarketBills() {
  sounds.playClick();
  state.bills = { '100k': 0, '10k': 0, '1k': 0 };
  ['100k', '10k', '1k'].forEach(t => {
    document.getElementById(`count_${t}`).textContent = '0';
  });
  document.getElementById('currentMarketTotal').textContent = '0';
  document.getElementById('marketFeedback').className = 'feedback-box';
}

// ================= 3. HOẠT ĐỘNG 2: THỬ THÁCH 7 QUE TÍNH =================
function toggleMatchstickChoice(btn) {
  sounds.playClick();
  const roman = btn.getAttribute('data-roman');
  if (state.matchstickChoices.has(roman)) {
    state.matchstickChoices.delete(roman);
    btn.classList.remove('selected-correct');
  } else {
    state.matchstickChoices.add(roman);
    btn.classList.add('selected-correct');
  }
}

function checkMatchsticksAnswer(evt) {
  const fb = document.getElementById('matchsticksFeedback');
  const validSevens = new Set(['XXIII', 'XXIV', 'XVIII', 'XXVI']);
  const invalidPicks = ['XX', 'XV'];

  const hasInvalid = invalidPicks.some(r => state.matchstickChoices.has(r));
  const pickedValidCount = Array.from(state.matchstickChoices).filter(r => validSevens.has(r)).length;

  if (!hasInvalid && pickedValidCount === 4) {
    registerCorrectAnswer(evt);
    triggerConfetti(80);
    addStars(20, evt);
    unlockBadge('roman');

    fb.className = 'feedback-box show correct';
    fb.innerHTML = `
      🎉 <strong>XUẤT SẮC TOÀN DIỆN!</strong> (+20 ⭐)
      <br>Với đúng 7 que tính, cả 4 số sau đều xếp được:
      <br>• <strong>XXIII (23):</strong> 2 que X + 2 que X + 1 + 1 + 1 que I = 7 que.
      <br>• <strong>XXIV (24):</strong> 2 que X + 2 que X + 1 que I + 2 que V = 7 que.
      <br>• <strong>XVIII (18):</strong> 2 que X + 2 que V + 1 + 1 + 1 que I = 7 que.
      <br>• <strong>XXVI (26):</strong> 2 que X + 2 que X + 2 que V + 1 que I = 7 que.
      <br>🏆 ${state.playerName} đã mở khóa huy hiệu <strong>Bậc Thầy La Mã 🏛️</strong>!
    `;
  } else if (hasInvalid) {
    registerWrongAnswer();
    fb.className = 'feedback-box show incorrect';
    fb.innerHTML = `
      💡 <strong>Gợi ý:</strong> Số XX chỉ cần 2+2 = 4 que tính. Số XV chỉ cần 2+2 = 4 que tính. Hãy bỏ chọn 2 số này và tìm đủ 4 số có đúng 7 que nhé!
    `;
  } else {
    registerWrongAnswer();
    fb.className = 'feedback-box show incorrect';
    fb.innerHTML = `
      💡 <strong>Gợi ý:</strong> Có tất cả <strong>4 số La Mã</strong> ở trên được ghép bởi chính xác 7 que tính. Em hãy kiểm tra xem số nào chưa được chọn nhé!
    `;
  }
}

// ================= 3. HOẠT ĐỘNG 3: MẬT MÃ HỌC =================
function checkCipher1(choice, isCorrect, evt = null) {
  const fb = document.getElementById('cipher1Feedback');
  if (isCorrect) {
    registerCorrectAnswer(evt);
    addStars(10, evt);
    fb.className = 'feedback-box show correct';
    fb.innerHTML = `
      🎉 <strong>Chính xác!</strong> Đó là số <strong>909 090</strong> (chín trăm linh chín nghìn không trăm chín mươi).
      <br>Chữ số đầu tiên phải khác 0 nên không thể là 090 909!
    `;
  } else {
    registerWrongAnswer();
    fb.className = 'feedback-box show incorrect';
    fb.innerHTML = `❌ Chưa đúng rồi! Nhớ rằng chữ số đầu tiên bên trái của một số tự nhiên luôn phải khác 0 nhé!`;
  }
}

function checkCipher2(choice, isCorrect, evt = null) {
  const fb = document.getElementById('cipher2Feedback');
  if (isCorrect) {
    registerCorrectAnswer(evt);
    addStars(10, evt);
    fb.className = 'feedback-box show correct';
    fb.innerHTML = `
      🎉 <strong>Rất giỏi!</strong> Số đó là <strong>350</strong> (ba trăm năm mươi).
      <br>Chữ số 5 có giá trị là 50 nên đứng ở hàng chục. Chữ số hàng trăm phải khác 0 nên là 3. Hàng đơn vị là 0!
    `;
  } else {
    registerWrongAnswer();
    fb.className = 'feedback-box show incorrect';
    fb.innerHTML = `❌ Chưa đúng! Chữ số 5 có giá trị bằng 50 nghĩa là 5 phải đứng ở hàng chục. Em hãy thử lại nhé!`;
  }
}

// ================= 3. HOẠT ĐỘNG 4: CỬA HÀNG BÁNH KẸO =================
function checkCandyStore(val, isCorrect, evt = null) {
  const fb = document.getElementById('candyFeedback');
  if (isCorrect) {
    registerCorrectAnswer(evt);
    triggerConfetti(70);
    addStars(15, evt);
    fb.className = 'feedback-box show correct';
    fb.innerHTML = `
      🎉 <strong>CHÍNH XÁC!</strong> Người đó đã mua <strong>9 990 cái kẹo</strong>! (+15 ⭐)
      <br>• 9 thùng = 9 × 1 000 = 9 000 cái.
      <br>• 9 hộp = 9 × 100 = 900 cái.
      <br>• 9 gói = 9 × 10 = 90 cái.
      <br>Tổng cộng = 9 000 + 900 + 90 = 9 990 cái kẹo!
    `;
  } else {
    registerWrongAnswer();
    fb.className = 'feedback-box show incorrect';
    fb.innerHTML = `
      💡 <strong>Gợi ý:</strong> 1 gói = 10 cái; 1 hộp = 10 gói = 100 cái; 1 thùng = 10 hộp = 1 000 cái.
      <br>9 thùng + 9 hộp + 9 gói = (9 × 1 000) + (9 × 100) + (9 × 10). Em hãy tính lại xem nào!
    `;
  }
}

// ================= 4. GAME CHALLENGE (8 CÂU HỎI BÁM SÁT SGK) =================
const GAME_QUESTIONS = [
  {
    title: 'Câu 1 (SGK Bài 1.6b): Trong số 27 501, chữ số 7 có giá trị bằng bao nhiêu?',
    options: [
      { text: '70', correct: false },
      { text: '700', correct: false },
      { text: '7 000', correct: true },
      { text: '70 000', correct: false }
    ],
    explanation: 'Chính xác! Chữ số 7 đứng ở hàng nghìn nên có giá trị là 7 × 1 000 = 7 000.'
  },
  {
    title: 'Câu 2 (SGK Bài 1.7a): Chữ số 4 đứng ở hàng nào trong một số tự nhiên nếu nó có giá trị bằng 400?',
    options: [
      { text: 'Hàng đơn vị', correct: false },
      { text: 'Hàng chục', correct: false },
      { text: 'Hàng trăm', correct: true },
      { text: 'Hàng nghìn', correct: false }
    ],
    explanation: 'Rất chuẩn! Giá trị bằng 400 tức là 4 × 100, do đó chữ số 4 đứng ở hàng trăm.'
  },
  {
    title: 'Câu 3 (SGK Bài 1.8): Số La Mã XIV biểu diễn số nào trong hệ thập phân?',
    options: [
      { text: '16', correct: false },
      { text: '14', correct: true },
      { text: '24', correct: false },
      { text: '15', correct: false }
    ],
    explanation: 'Chính xác! XIV = X (10) + IV (4) = 14.'
  },
  {
    title: 'Câu 4 (SGK Bài 1.8): Số La Mã XXIII biểu diễn số nào trong hệ thập phân?',
    options: [
      { text: '18', correct: false },
      { text: '23', correct: true },
      { text: '28', correct: false },
      { text: '32', correct: false }
    ],
    explanation: 'Tuyệt vời! XXIII = X (10) + X (10) + III (3) = 23.'
  },
  {
    title: 'Câu 5 (SGK Bài 1.9): Số 25 được viết bằng số La Mã là:',
    options: [
      { text: 'XV', correct: false },
      { text: 'XXV', correct: true },
      { text: 'XXXV', correct: false },
      { text: 'VVVVV', correct: false }
    ],
    explanation: 'Rất giỏi! 25 = 20 + 5 = XX + V = XXV.'
  },
  {
    title: 'Câu 6 (SGK Trang 11): Khẳng định nào sau đây là ĐÚNG về số La Mã?',
    options: [
      { text: 'Chữ số O biểu diễn số 0 trong hệ La Mã', correct: false },
      { text: 'Không có chữ số La Mã nào biểu diễn số 0', correct: true },
      { text: 'Chữ số V có thể lặp lại 3 lần liên tiếp', correct: false },
      { text: 'Chữ số I có giá trị bằng 5', correct: false }
    ],
    explanation: 'Chính xác! Trong hệ số La Mã, người cổ đại không có chữ số nào để biểu diễn số 0.'
  },
  {
    title: 'Câu 7 (SGK Trang 10): Biểu diễn số 32 019 thành tổng giá trị các chữ số là:',
    options: [
      { text: '(3 × 1 000) + (2 × 100) + 19', correct: false },
      { text: '(3 × 10 000) + (2 × 1 000) + (1 × 10) + 9', correct: true },
      { text: '3 + 2 + 0 + 1 + 9', correct: false },
      { text: '(3 × 10 000) + (2 × 100) + 9', correct: false }
    ],
    explanation: 'Xuất sắc! Số 32 019 = 3 chục nghìn + 2 nghìn + 1 chục + 9 đơn vị = (3 × 10 000) + (2 × 1 000) + (1 × 10) + 9.'
  },
  {
    title: 'Câu 8 (SGK Mục Em có biết Trang 12): Trong hệ La Mã mở rộng, chữ số M biểu diễn giá trị nào?',
    options: [
      { text: '50', correct: false },
      { text: '100', correct: false },
      { text: '500', correct: false },
      { text: '1 000', correct: true }
    ],
    explanation: 'Tuyệt đỉnh! Trong hệ La Mã mở rộng: L = 50, C = 100, D = 500, và M = 1 000.'
  }
];

function loadGameQuestion(index) {
  state.gameIndex = index;
  state.gameAnsweredCurrent = false;

  const total = GAME_QUESTIONS.length;
  document.getElementById('gameQuestionCounter').textContent = `Câu hỏi: ${index + 1} / ${total}`;
  document.getElementById('gameCurrentScore').textContent = Math.round(state.gameScore);

  const q = GAME_QUESTIONS[index];
  document.getElementById('gameQuestionTitle').textContent = q.title;

  const optContainer = document.getElementById('gameOptionsContainer');
  optContainer.innerHTML = '';

  const letters = ['A', 'B', 'C', 'D'];
  q.options.forEach((opt, idx) => {
    const btn = document.createElement('button');
    btn.className = 'btn btn-secondary';
    btn.style.textAlign = 'left';
    btn.style.justifyContent = 'flex-start';
    btn.style.padding = '1rem 1.25rem';
    btn.style.fontSize = '1.05rem';
    btn.innerHTML = `<strong>${letters[idx]}.</strong> ${opt.text}`;
    btn.onclick = (e) => selectGameOption(btn, opt, q, e);
    optContainer.appendChild(btn);
  });

  const expEl = document.getElementById('gameExplanation');
  expEl.className = 'feedback-box';
  expEl.style.display = 'none';

  document.getElementById('gameNavGroup').style.display = 'none';
}

function selectGameOption(selectedBtn, chosenOpt, questionData, evt) {
  if (state.gameAnsweredCurrent) return;
  state.gameAnsweredCurrent = true;

  const allBtns = document.querySelectorAll('#gameOptionsContainer button');
  allBtns.forEach(btn => btn.disabled = true);

  const expEl = document.getElementById('gameExplanation');

  if (chosenOpt.correct) {
    registerCorrectAnswer(evt);
    selectedBtn.style.background = '#dcfce7';
    selectedBtn.style.borderColor = '#22c55e';
    selectedBtn.style.color = '#15803d';
    state.gameScore += 12.5; // 8 * 12.5 = 100
    addStars(10, evt);
    spawnFloatingScore(`+12.5 ĐIỂM!`, evt);

    expEl.className = 'feedback-box show correct';
    expEl.innerHTML = `🎉 <strong>Chính xác ${state.playerName}!</strong> ${questionData.explanation}`;
  } else {
    registerWrongAnswer();
    selectedBtn.style.background = '#fee2e2';
    selectedBtn.style.borderColor = '#ef4444';
    selectedBtn.style.color = '#b91c1c';

    allBtns.forEach((btn, idx) => {
      if (questionData.options[idx].correct) {
        btn.style.background = '#dcfce7';
        btn.style.borderColor = '#22c55e';
        btn.style.color = '#15803d';
      }
    });

    expEl.className = 'feedback-box show incorrect';
    expEl.innerHTML = `💡 <strong>Giải thích chi tiết:</strong> ${questionData.explanation}`;
  }

  document.getElementById('gameCurrentScore').textContent = Math.round(state.gameScore);

  const nextBtn = document.getElementById('gameNextBtn');
  if (state.gameIndex === GAME_QUESTIONS.length - 1) {
    nextBtn.textContent = 'Xem Giấy Chứng Nhận & Huy Hiệu 🏆';
  } else {
    nextBtn.textContent = 'Câu Tiếp Theo ➡';
  }
  document.getElementById('gameNavGroup').style.display = 'flex';
}

function nextGameQuestion() {
  sounds.playClick();
  if (state.gameIndex < GAME_QUESTIONS.length - 1) {
    loadGameQuestion(state.gameIndex + 1);
  } else {
    state.completedSteps.add('game');
    state.completedSteps.add('summary');
    switchSection('summary');
  }
}

// ================= 5. TỔNG KẾT & CHỨNG NHẬN =================
function renderCertificate() {
  sounds.playFanfare();
  triggerConfetti(120);

  const finalScore = Math.round(state.gameScore);

  if (finalScore >= 90) {
    unlockBadge('decimal');
  }

  const nameEl = document.getElementById('certPlayerName');
  const avatarEl = document.getElementById('certPlayerAvatar');
  const dateEl = document.getElementById('certCompletionDate');

  if (nameEl) nameEl.textContent = state.playerName;
  if (avatarEl) avatarEl.textContent = state.playerAvatar;

  const now = new Date();
  if (dateEl) {
    dateEl.textContent = `Hoàn thành: Ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} • Toán 6`;
  }

  document.getElementById('certScore').textContent = `${finalScore}/100`;
  document.getElementById('certStars').textContent = `${state.stars} ⭐`;

  let rank = 'Huy Hiệu Đồng 🥉';
  let badgeIcon = '🥉';
  if (finalScore >= 90) {
    rank = 'Chiến Binh Vàng 🥇';
    badgeIcon = '🥇';
  } else if (finalScore >= 70) {
    rank = 'Bậc Thầy Bạc 🥈';
    badgeIcon = '🥈';
  }

  document.getElementById('certRank').textContent = rank;
  const certIcon = document.getElementById('certBadgeIcon');
  if (certIcon) certIcon.textContent = badgeIcon;

  // Refresh badges in gallery
  state.unlockedBadges.forEach(bKey => {
    const badgeElemMap = {
      decimal: 'badge-decimal',
      roman: 'badge-roman',
      market: 'badge-market',
      streak: 'badge-streak',
      stars: 'badge-stars'
    };
    const elId = badgeElemMap[bKey];
    const el = document.getElementById(elId);
    if (el) {
      el.classList.add('unlocked');
      const status = el.querySelector('.badge-status');
      if (status) status.textContent = '✅';
    }
  });
}

function restartLesson() {
  sounds.playClick();
  state.gameIndex = 0;
  state.gameScore = 0;
  state.stars = 0;
  state.streak = 0;
  state.maxStreak = 0;
  state.completedSteps.clear();
  state.unlockedBadges.clear();
  state.warmupSelected.clear();
  state.matchstickChoices.clear();

  document.getElementById('starCounter').textContent = '0';
  const streakPill = document.getElementById('hudStreakPill');
  if (streakPill) streakPill.classList.remove('show');

  document.querySelectorAll('.badge-item').forEach(b => {
    b.classList.remove('unlocked');
    const s = b.querySelector('.badge-status');
    if (s) s.textContent = '🔒';
  });

  resetMarketBills();

  // Reset matchsticks buttons
  document.querySelectorAll('#matchsticksGrid button').forEach(b => {
    b.classList.remove('selected-correct');
  });

  // Reset warmup buttons
  document.querySelectorAll('#warmupChoices button').forEach(b => {
    b.classList.remove('btn-primary');
    b.classList.add('btn-secondary');
  });

  const overlay = document.getElementById('startScreenOverlay');
  if (overlay) overlay.classList.remove('hidden');

  switchSection('warmup');
}

// ================= CONFETTI CANVAS ENGINE =================
let confettiParticles = [];
let confettiCtx = null;
let confettiAnimId = null;

function initConfetti() {
  const canvas = document.getElementById('confettiCanvas');
  if (!canvas) return;
  confettiCtx = canvas.getContext('2d');
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
}

function resizeCanvas() {
  const canvas = document.getElementById('confettiCanvas');
  if (canvas) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
}

function triggerConfetti(count = 70) {
  const colors = ['#d97706', '#f59e0b', '#4338ca', '#10b981', '#ef4444', '#8b5cf6', '#06b6d4'];
  const w = window.innerWidth;
  const h = window.innerHeight;

  for (let i = 0; i < count; i++) {
    confettiParticles.push({
      x: w / 2 + (Math.random() - 0.5) * 300,
      y: h / 3 + (Math.random() - 0.5) * 100,
      vx: (Math.random() - 0.5) * 14,
      vy: Math.random() * -12 - 4,
      size: Math.random() * 8 + 6,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotSpeed: (Math.random() - 0.5) * 10,
      alpha: 1
    });
  }

  if (!confettiAnimId) {
    animateConfetti();
  }
}

function animateConfetti() {
  if (!confettiCtx) return;
  const canvas = document.getElementById('confettiCanvas');
  confettiCtx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = confettiParticles.length - 1; i >= 0; i--) {
    const p = confettiParticles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.35;
    p.vx *= 0.98;
    p.rotation += p.rotSpeed;
    p.alpha -= 0.012;

    if (p.alpha <= 0 || p.y > canvas.height + 20) {
      confettiParticles.splice(i, 1);
      continue;
    }

    confettiCtx.save();
    confettiCtx.globalAlpha = p.alpha;
    confettiCtx.translate(p.x, p.y);
    confettiCtx.rotate((p.rotation * Math.PI) / 180);
    confettiCtx.fillStyle = p.color;
    confettiCtx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    confettiCtx.restore();
  }

  if (confettiParticles.length > 0) {
    confettiAnimId = requestAnimationFrame(animateConfetti);
  } else {
    confettiAnimId = null;
  }
}
