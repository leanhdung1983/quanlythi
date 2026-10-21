/* ==========================================================================
   TOÁN 6 - BÀI 1: TẬP HỢP (KẾT NỐI TRI THỨC VỚI CUỘC SỐNG)
   Game Engine: Start Screen, Player Profile, Streak Combos, Floating Score Popups,
   Web Audio FX, Badge Trophy Showcase & Replay System
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
  
  // Warm-up state
  warmupSelected: new Set(),
  
  // Activity 1: Venn numbers
  act1Locations: {}, // num -> 'pool' | 'inside' | 'outside'
  
  // Activity 2: True/False
  act2Answered: {},
  
  // Activity 3: Matching
  matchSelectedLeft: null,
  matchSelectedRight: null,
  matchesFound: 0,
  
  // Activity 4: Symbol Chooser
  act4Results: { a_A: null, a_B: null, u_A: null, b_A: null },

  // Game Challenge
  gameIndex: 0,
  gameScore: 0,
  gameAnsweredCurrent: false
};

// ================= AUDIO SYNTHESIZER (WEB AUDIO API) =================
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
  initWarmup();
  initActivity1();
  initActivity3();
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

  // Update HUD
  const hudName = document.getElementById('hudPlayerName');
  const hudAvatar = document.getElementById('hudAvatar');
  if (hudName) hudName.textContent = state.playerName;
  if (hudAvatar) hudAvatar.textContent = state.playerAvatar;

  // Hide overlay
  const overlay = document.getElementById('startScreenOverlay');
  if (overlay) {
    overlay.classList.add('hidden');
  }

  sounds.playStreak();
  triggerConfetti(60);
  spawnFloatingScore(`Chào ${state.playerName}! 🚀`);
}

// ================= STARS, SCORE & STREAK SYSTEM =================
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

  // Check Star Trophy
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
  if (streakPill) {
    streakPill.classList.remove('show');
  }
  sounds.playIncorrect();
}

// ================= BADGE SYSTEM =================
function unlockBadge(badgeKey) {
  state.unlockedBadges.add(badgeKey);
  sounds.playBadgeUnlock();
  triggerConfetti(90);

  const badgeElemMap = {
    master: 'badge-master',
    venn: 'badge-venn',
    detective: 'badge-detective',
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

  spawnFloatingScore(`🏆 ĐÃ MỞ KHÓA HUY HIỆU MỚI!`);
}

// ================= MASTER STEPPER & NAVIGATION =================
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
  if (fill) {
    fill.style.width = `${percent}%`;
  }
}

// ================= 1. KHỞI ĐỘNG (WARMUP) =================
function initWarmup() {
  state.warmupSelected.clear();
}

function toggleWarmupItem(el) {
  sounds.playClick();
  el.classList.toggle('selected');
  const name = el.querySelector('.item-name').textContent;

  if (el.classList.contains('selected')) {
    state.warmupSelected.add(name);
  } else {
    state.warmupSelected.delete(name);
  }
}

function checkWarmupAnswer(evt) {
  const selectedElements = Array.from(document.querySelectorAll('#warmupItemsContainer .draggable-item.selected'));
  const feedback = document.getElementById('warmupFeedback');

  const selectedTypes = selectedElements.map(el => el.getAttribute('data-type'));
  const schoolCount = selectedTypes.filter(t => t === 'school').length;
  const otherCount = selectedTypes.filter(t => t === 'other').length;

  if (schoolCount === 4 && otherCount === 0) {
    registerCorrectAnswer(evt);
    triggerConfetti(70);
    addStars(10, evt);
    feedback.className = 'feedback-box show correct';
    feedback.innerHTML = `
      🎉 <strong>Xuất sắc ${state.playerName}!</strong> Em đã chọn đúng 4 đồ dùng học tập: <em>Vở, Bút chì, Thước kẻ, Cục tẩy</em>!
      <br>👉 Những đồ vật này tập hợp lại thành một <strong>TẬP HỢP</strong> trong Toán học. Em nhận được <strong>+10 ⭐</strong>!
    `;
    state.completedSteps.add('warmup');
    updateMasterProgress();
  } else if (otherCount > 0) {
    registerWrongAnswer();
    feedback.className = 'feedback-box show incorrect';
    feedback.innerHTML = `
      💡 <strong>Gợi ý của Pi:</strong> Ồ ${state.playerName} ơi, <em>Con cá vàng</em> và <em>Bông hoa hồng</em> không phải đồ dùng học tập mang đến trường đâu nhé! Hãy bỏ chọn chúng và thử lại nào.
    `;
  } else {
    registerWrongAnswer();
    feedback.className = 'feedback-box show incorrect';
    feedback.innerHTML = `
      💡 <strong>Gợi ý:</strong> ${state.playerName} còn thiếu đồ dùng học tập nào chưa cho vào cặp không? Hãy tìm đủ 4 món đồ nhé!
    `;
  }
}

// ================= 2. KHÁM PHÁ (INTERACTIVE VENN) =================
function inspectVennPoint(val, isInside) {
  sounds.playClick();
  const feedback = document.getElementById('vennDemoFeedback');
  if (isInside) {
    feedback.innerHTML = `
      <span style="color: #4338ca;">✨ Số <strong>${val}</strong> nằm <strong>BÊN TRONG</strong> vòng tròn M:</span>
      <span style="display: block; font-size: 1.25rem; margin-top: 0.2rem; font-family: 'Times New Roman';">
        Ta viết: <strong>${val} ∈ M</strong> (Đọc là: "${val} thuộc M" hoặc "M chứa ${val}")
      </span>
    `;
  } else {
    feedback.innerHTML = `
      <span style="color: #be123c;">⚠️ Số <strong>${val}</strong> nằm <strong>BÊN NGOÀI</strong> vòng tròn M:</span>
      <span style="display: block; font-size: 1.25rem; margin-top: 0.2rem; font-family: 'Times New Roman';">
        Ta viết: <strong>${val} ∉ M</strong> (Đọc là: "${val} không thuộc M")
      </span>
    `;
  }
}

// ================= 3. HOẠT ĐỘNG 1: SƠ ĐỒ VEN P =================
function initActivity1() {
  const chips = [0, 2, 3, 4, 5, 6, 7, 8, 9];
  chips.forEach(n => {
    state.act1Locations[n] = 'pool';
  });
}

function moveChip(chipEl) {
  sounds.playClick();
  const num = parseInt(chipEl.getAttribute('data-num'), 10);
  const currentLoc = state.act1Locations[num];

  let nextLoc = 'inside';
  if (currentLoc === 'inside') nextLoc = 'outside';
  else if (currentLoc === 'outside') nextLoc = 'pool';

  setChipLocation(chipEl, num, nextLoc);
}

function handleZoneClick(zone) {
  sounds.playClick();
}

function setChipLocation(chipEl, num, targetZone) {
  state.act1Locations[num] = targetZone;
  if (targetZone === 'inside') {
    document.getElementById('zoneInsideContainer').appendChild(chipEl);
    chipEl.style.borderColor = '#16a34a';
  } else if (targetZone === 'outside') {
    document.getElementById('zoneOutsideContainer').appendChild(chipEl);
    chipEl.style.borderColor = '#e11d48';
  } else {
    document.getElementById('dragPool').appendChild(chipEl);
    chipEl.style.borderColor = '#cbd5e1';
  }
}

function checkActivity1(evt) {
  const expectedInside = [0, 2, 4, 6, 8];
  const expectedOutside = [3, 5, 7, 9];

  let correct = true;
  let wrongInside = [];
  let wrongOutside = [];

  for (let n of expectedInside) {
    if (state.act1Locations[n] !== 'inside') {
      correct = false;
      wrongInside.push(n);
    }
  }

  for (let n of expectedOutside) {
    if (state.act1Locations[n] !== 'outside') {
      correct = false;
      wrongOutside.push(n);
    }
  }

  const fb = document.getElementById('act1Feedback');
  if (correct) {
    registerCorrectAnswer(evt);
    triggerConfetti(70);
    addStars(15, evt);
    unlockBadge('venn');

    fb.className = 'feedback-box show correct';
    fb.innerHTML = `
      🎉 <strong>CHÍNH XÁC TUYỆT ĐỐI!</strong> (+15 ⭐)
      <br>• Các số chẵn nhỏ hơn 10: <strong>0; 2; 4; 6; 8 ∈ P</strong> (ở bên trong).
      <br>• Các số lẻ: <strong>3; 5; 7; 9 ∉ P</strong> (ở bên ngoài). ${state.playerName} đã mở khóa huy hiệu <strong>Thần Đồng Sơ Đồ Ven 🧩</strong>!
    `;
  } else {
    registerWrongAnswer();
    fb.className = 'feedback-box show incorrect';
    let hint = `💡 <strong>Gợi ý:</strong> Tập P chỉ gồm các số tự nhiên chẵn nhỏ hơn 10: {0; 2; 4; 6; 8}.`;
    if (wrongInside.length > 0) {
      hint += `<br>• Em chưa đưa các số chẵn sau vào trong: <strong>${wrongInside.join(', ')}</strong>.`;
    }
    if (wrongOutside.length > 0) {
      hint += `<br>• Các số lẻ sau phải ở bên ngoài: <strong>${wrongOutside.join(', ')}</strong>.`;
    }
    fb.innerHTML = hint;
  }
}

function resetActivity1() {
  sounds.playClick();
  const pool = document.getElementById('dragPool');
  document.querySelectorAll('#sec-practice .num-chip').forEach(chip => {
    const num = parseInt(chip.getAttribute('data-num'), 10);
    state.act1Locations[num] = 'pool';
    chip.style.borderColor = '#cbd5e1';
    pool.appendChild(chip);
  });
  const fb = document.getElementById('act1Feedback');
  fb.className = 'feedback-box';
}

// ================= 3. HOẠT ĐỘNG 2: THÁM TỬ BẮT LỖI (ĐÚNG/SAI) =================
function answerDetective(caseNum, answerBool, evt = null) {
  if (caseNum === 1) {
    const fb = document.getElementById('case1Feedback');
    if (answerBool === false) {
      registerCorrectAnswer(evt);
      addStars(10, evt);
      state.act2Answered[1] = true;
      fb.className = 'feedback-box show correct';
      fb.innerHTML = `
        🎉 <strong>Chính xác! Bạn Nam viết SAI!</strong> (+10 ⭐)
        <br><strong>Lí do:</strong> Trong từ "NHA TRANG", chữ <strong>N</strong> và chữ <strong>A</strong> xuất hiện 2 lần.
        <br>Theo quy tắc vàng SGK: <em>Mỗi phần tử chỉ được viết một lần</em>.
        <br>Cách viết chuẩn là: <code style="font-size: 1.1rem; color: #15803d;">L = {N; H; A; T; R; G}</code>.
      `;
    } else {
      registerWrongAnswer();
      fb.className = 'feedback-box show incorrect';
      fb.innerHTML = `
        ❌ <strong>Chưa đúng rồi!</strong>
        <br>Hãy quan sát kĩ tập hợp của bạn Nam: chữ <strong>'N'</strong> và chữ <strong>'A'</strong> có bị lặp lại không?
        <br>Quy tắc SGK: <em>"Mỗi phần tử chỉ được viết một lần."</em> Em hãy bấm chọn lại nhé!
      `;
    }
  } else if (caseNum === 2) {
    const fb = document.getElementById('case2Feedback');
    if (answerBool === true) {
      registerCorrectAnswer(evt);
      addStars(10, evt);
      state.act2Answered[2] = true;
      fb.className = 'feedback-box show correct';
      fb.innerHTML = `
        🎉 <strong>Rất giỏi ${state.playerName}! Bạn Hoa viết ĐÚNG!</strong> (+10 ⭐)
        <br>Từ "ĐIỆN BIÊN PHỦ" có các chữ cái: Đ, I, Ê, N, B, P, H, U (mỗi chữ chỉ viết đúng 1 lần).
      `;
    } else {
      registerWrongAnswer();
      fb.className = 'feedback-box show incorrect';
      fb.innerHTML = `
        ❌ <strong>Chưa chính xác!</strong>
        <br>Bạn Hoa đã gom các chữ cái không lặp lại: Đ, I, Ê, N, B, P, H, U.
        <br>Mỗi chữ chỉ xuất hiện đúng 1 lần nên bạn Hoa làm hoàn toàn đúng theo SGK!
      `;
    }
  }

  // Check detective badge
  if (state.act2Answered[1] && state.act2Answered[2] && !state.unlockedBadges.has('detective')) {
    unlockBadge('detective');
  }
}

// ================= 3. HOẠT ĐỘNG 3: GHÉP CẶP =================
function initActivity3() {
  state.matchSelectedLeft = null;
  state.matchSelectedRight = null;
  state.matchesFound = 0;
}

function selectMatchCard(cardEl, side, evt = null) {
  sounds.playClick();
  if (cardEl.classList.contains('matched')) return;

  const container = side === 'left' ? document.getElementById('colProps') : document.getElementById('colElements');
  container.querySelectorAll('.match-card').forEach(c => c.classList.remove('selected'));
  cardEl.classList.add('selected');

  if (side === 'left') {
    state.matchSelectedLeft = cardEl;
  } else {
    state.matchSelectedRight = cardEl;
  }

  if (state.matchSelectedLeft && state.matchSelectedRight) {
    const idL = state.matchSelectedLeft.getAttribute('data-match');
    const idR = state.matchSelectedRight.getAttribute('data-match');

    const fb = document.getElementById('act3Feedback');

    if (idL === idR) {
      registerCorrectAnswer(evt);
      state.matchSelectedLeft.classList.remove('selected');
      state.matchSelectedRight.classList.remove('selected');
      state.matchSelectedLeft.classList.add('matched');
      state.matchSelectedRight.classList.add('matched');

      state.matchSelectedLeft = null;
      state.matchSelectedRight = null;
      state.matchesFound++;

      if (state.matchesFound === 4) {
        triggerConfetti(80);
        addStars(20, evt);
        fb.className = 'feedback-box show correct';
        fb.innerHTML = `🎉 <strong>Tuyệt vời ${state.playerName}!</strong> Em đã ghép đúng toàn bộ 4 cặp tập hợp tương ứng! (+20 ⭐)`;
      }
    } else {
      registerWrongAnswer();
      const elL = state.matchSelectedLeft;
      const elR = state.matchSelectedRight;
      elL.style.borderColor = '#ef4444';
      elR.style.borderColor = '#ef4444';

      setTimeout(() => {
        elL.style.borderColor = '';
        elR.style.borderColor = '';
        elL.classList.remove('selected');
        elR.classList.remove('selected');
        state.matchSelectedLeft = null;
        state.matchSelectedRight = null;
      }, 500);

      fb.className = 'feedback-box show incorrect';
      fb.innerHTML = '💡 <strong>Chưa khớp:</strong> Hãy đối chiếu kĩ các phần tử số tự nhiên và tháng 30 ngày nhé!';
    }
  }
}

// ================= 3. HOẠT ĐỘNG 4: KÍ HIỆU ∈ HOẶC ∉ =================
function checkSymbolQuiz(slotKey, chosenSymbol, isCorrect, evt = null) {
  const slotEl = document.getElementById(`slot_${slotKey}`);
  const fb = document.getElementById('act4Feedback');

  if (isCorrect) {
    registerCorrectAnswer(evt);
    addStars(5, evt);
    slotEl.textContent = chosenSymbol === 'in' ? '∈' : '∉';
    slotEl.style.backgroundColor = '#dcfce7';
    slotEl.style.borderColor = '#22c55e';
    slotEl.style.color = '#15803d';
    state.act4Results[slotKey] = true;

    const allDone = Object.values(state.act4Results).every(v => v === true);
    if (allDone) {
      triggerConfetti(60);
      fb.className = 'feedback-box show correct';
      fb.innerHTML = `🎉 <strong>Xuất sắc ${state.playerName}!</strong> Em đã điền chính xác toàn bộ kí hiệu thuộc (∈) và không thuộc (∉)!`;
    }
  } else {
    registerWrongAnswer();
    slotEl.textContent = chosenSymbol === 'in' ? '∈' : '∉';
    slotEl.style.backgroundColor = '#fee2e2';
    slotEl.style.borderColor = '#ef4444';
    slotEl.style.color = '#b91c1c';

    fb.className = 'feedback-box show incorrect';
    fb.innerHTML = '💡 <strong>Gợi ý:</strong> Hãy dò lại phần tử trong tập A = {a; b; c; x; y} và B = {b; d; y; t; u; v} để chọn lại nhé!';
    setTimeout(() => {
      slotEl.textContent = '?';
      slotEl.style.backgroundColor = '';
      slotEl.style.borderColor = '';
      slotEl.style.color = '';
    }, 900);
  }
}

// ================= 4. GAME CHALLENGE (8 CÂU HỎI BÁM SÁT SGK) =================
const GAME_QUESTIONS = [
  {
    title: 'Câu 1 (Hình 1.3 SGK): Cho tập hợp M = {1; 4; 8; 9}. Khẳng định nào sau đây là ĐÚNG?',
    options: [
      { text: '7 ∈ M', correct: false },
      { text: '4 ∉ M', correct: false },
      { text: '1 ∈ M', correct: true },
      { text: '9 ∉ M', correct: false }
    ],
    explanation: 'Chính xác! Trong Hình 1.3 SGK, các số 1, 4, 8, 9 nằm trong vòng tròn M nên 1 ∈ M. Còn số 7 nằm ngoài nên 7 ∉ M.'
  },
  {
    title: 'Câu 2 (SGK Trang 7): Kí hiệu ℕ* dùng để chỉ tập hợp nào sau đây?',
    options: [
      { text: 'Tập hợp các số tự nhiên chẵn', correct: false },
      { text: 'Tập hợp các số tự nhiên khác 0, nghĩa là ℕ* = {1; 2; 3;...}', correct: true },
      { text: 'Tập hợp các số tự nhiên nhỏ hơn 10', correct: false },
      { text: 'Tập hợp gồm các số 0; 1; 2; 3;...', correct: false }
    ],
    explanation: 'Rất chuẩn! ℕ là tập các số tự nhiên (bắt đầu từ 0), còn ℕ* là tập các số tự nhiên khác 0 (bắt đầu từ 1).'
  },
  {
    title: 'Câu 3 (Luyện tập 2 SGK): Viết tập hợp A = {x ∈ ℕ | x < 5} bằng cách liệt kê phần tử ta được:',
    options: [
      { text: 'A = {1; 2; 3; 4; 5}', correct: false },
      { text: 'A = {0; 1; 2; 3; 4}', correct: true },
      { text: 'A = {0; 1; 2; 3; 4; 5}', correct: false },
      { text: 'A = {1; 2; 3; 4}', correct: false }
    ],
    explanation: 'Chính xác! x ∈ ℕ nên x lấy từ 0. Và x < 5 nên chỉ lấy đến số 4: A = {0; 1; 2; 3; 4}.'
  },
  {
    title: 'Câu 4 (Luyện tập 2 SGK): Viết tập hợp B = {x ∈ ℕ* | x < 5} bằng cách liệt kê phần tử ta được:',
    options: [
      { text: 'B = {0; 1; 2; 3; 4}', correct: false },
      { text: 'B = {1; 2; 3; 4}', correct: true },
      { text: 'B = {1; 2; 3; 4; 5}', correct: false },
      { text: 'B = {0; 1; 2; 3}', correct: false }
    ],
    explanation: 'Tuyệt vời! x ∈ ℕ* nên x không thể bằng 0. Kết hợp x < 5 ta có: B = {1; 2; 3; 4}.'
  },
  {
    title: 'Câu 5 (Bài 1.2 SGK): Cho tập hợp U = {x ∈ ℕ | x chia hết cho 3}. Trong các số {3; 5; 6; 0; 7}, số nào KHÔNG thuộc tập U?',
    options: [
      { text: 'Số 3 và số 6', correct: false },
      { text: 'Số 5 và số 7', correct: true },
      { text: 'Số 0', correct: false },
      { text: 'Số 0 và số 3', correct: false }
    ],
    explanation: 'Chính xác! 0, 3, 6 đều chia hết cho 3 nên thuộc U. Còn 5 và 7 không chia hết cho 3 nên 5 ∉ U và 7 ∉ U.'
  },
  {
    title: 'Câu 6 (Bài 1.3b SGK): Tập hợp D tên các tháng (dương lịch) có 30 ngày gồm bao nhiêu phần tử?',
    options: [
      { text: '3 phần tử', correct: false },
      { text: '4 phần tử (Tháng 4; Tháng 6; Tháng 9; Tháng 11)', correct: true },
      { text: '5 phần tử', correct: false },
      { text: '7 phần tử', correct: false }
    ],
    explanation: 'Rất giỏi! Các tháng dương lịch có 30 ngày là: Tháng 4, Tháng 6, Tháng 9 và Tháng 11 (tổng cộng 4 phần tử).'
  },
  {
    title: 'Câu 7 (Bài 1.5 SGK): Hệ Mặt Trời gồm Mặt Trời và 8 hành tinh quay quanh. Nếu S là tập hợp các hành tinh của Hệ Mặt Trời, khẳng định nào ĐÚNG?',
    options: [
      { text: 'Mặt Trời ∈ S (Mặt Trời là hành tinh)', correct: false },
      { text: 'Trái Đất ∈ S (Trái Đất là một hành tinh)', correct: true },
      { text: 'Mặt Trăng ∈ S (Mặt Trăng là hành tinh)', correct: false },
      { text: 'Tập hợp S có 9 phần tử', correct: false }
    ],
    explanation: 'Chính xác! Mặt Trời là ngôi sao ở trung tâm, Mặt Trăng là vệ tinh của Trái Đất. Chỉ có 8 thiên thể là hành tinh gồm: Thuỷ tinh, Kim tinh, Trái Đất, Hoả tinh, Mộc tinh, Thổ tinh, Thiên Vương tinh, Hải Vương tinh. Do đó Trái Đất ∈ S!'
  },
  {
    title: 'Câu 8 (Mục Em có biết SGK Trang 8): Nhà toán học người Đức phát triển Lý thuyết tập hợp vào cuối thế kỉ XIX là ai?',
    options: [
      { text: 'Pythagore (Pi-ta-go)', correct: false },
      { text: 'Archimedes (Ác-si-mét)', correct: false },
      { text: 'Georg Cantor (Căng-to)', correct: true },
      { text: 'Isaac Newton (Niu-tơn)', correct: false }
    ],
    explanation: 'Xuất sắc! Nhà toán học Georg Cantor (Căng-to, 1845 – 1918) chính là người sáng lập ra lý thuyết tập hợp, nền tảng của Toán học hiện đại!'
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
    btn.className = 'option-btn';
    btn.innerHTML = `
      <span class="option-letter">${letters[idx]}</span>
      <span class="option-text">${opt.text}</span>
    `;
    btn.onclick = (e) => selectGameOption(btn, opt, q, e);
    optContainer.appendChild(btn);
  });

  const expEl = document.getElementById('gameExplanation');
  expEl.className = 'game-explanation';
  expEl.innerHTML = '';

  document.getElementById('gameNavGroup').style.display = 'none';
}

function selectGameOption(selectedBtn, chosenOpt, questionData, evt) {
  if (state.gameAnsweredCurrent) return;
  state.gameAnsweredCurrent = true;

  const allBtns = document.querySelectorAll('#gameOptionsContainer .option-btn');
  allBtns.forEach(btn => btn.disabled = true);

  const expEl = document.getElementById('gameExplanation');

  if (chosenOpt.correct) {
    registerCorrectAnswer(evt);
    selectedBtn.classList.add('correct');
    state.gameScore += 12.5; // 8 * 12.5 = 100 max
    addStars(10, evt);
    spawnFloatingScore(`+12.5 ĐIỂM!`, evt);

    expEl.className = 'game-explanation show';
    expEl.style.borderColor = '#10b981';
    expEl.innerHTML = `🎉 <strong>Chính xác ${state.playerName}!</strong> ${questionData.explanation}`;
  } else {
    registerWrongAnswer();
    selectedBtn.classList.add('incorrect');
    allBtns.forEach((btn, idx) => {
      if (questionData.options[idx].correct) {
        btn.classList.add('correct');
      }
    });
    expEl.className = 'game-explanation show';
    expEl.style.borderColor = '#f43f5e';
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

// ================= 5. TỔNG KẾT & VINH DANH =================
function renderCertificate() {
  sounds.playFanfare();
  triggerConfetti(120);

  const finalScore = Math.round(state.gameScore);
  
  // Check Master Badge
  if (finalScore >= 90) {
    unlockBadge('master');
  }

  // Update Honors Info
  const nameEl = document.getElementById('certPlayerName');
  const avatarEl = document.getElementById('certPlayerAvatar');
  const dateEl = document.getElementById('certCompletionDate');
  
  if (nameEl) nameEl.textContent = state.playerName;
  if (avatarEl) avatarEl.textContent = state.playerAvatar;

  const now = new Date();
  const dateStr = `Hoàn thành: Ngày ${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()} • Toán 6`;
  if (dateEl) dateEl.textContent = dateStr;

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
      master: 'badge-master',
      venn: 'badge-venn',
      detective: 'badge-detective',
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

  // Reset UI elements
  document.getElementById('starCounter').textContent = '0';
  const streakPill = document.getElementById('hudStreakPill');
  if (streakPill) streakPill.classList.remove('show');

  // Reset Badges
  document.querySelectorAll('.badge-item').forEach(b => {
    b.classList.remove('unlocked');
    const s = b.querySelector('.badge-status');
    if (s) s.textContent = '🔒';
  });

  initWarmup();
  initActivity1();
  initActivity3();

  // Re-open Start Screen
  const overlay = document.getElementById('startScreenOverlay');
  if (overlay) overlay.classList.remove('hidden');

  switchSection('warmup');
}

// ================= CONFETTI PARTICLE SYSTEM =================
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
  const colors = ['#f43f5e', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];
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
