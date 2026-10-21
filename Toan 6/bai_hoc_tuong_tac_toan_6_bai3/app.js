/**
 * ==============================================================================
 * TOÁN 6 - BÀI 3: THỨ TỰ TRONG TẬP HỢP CÁC SỐ TỰ NHIÊN
 * KẾT NỐI TRI THỨC VỚI CUỘC SỐNG (TRANG 13 - 14)
 * LOGIC MINI-GAME, TƯƠNG TÁC TIA SỐ, WEB AUDIO API & ĐẤU TRƯỜNG QUIZ
 * ==============================================================================
 */

// ==============================================================================
// 1. GAME STATE & AUDIO ENGINE
// ==============================================================================
const GameState = {
  playerName: "Nhà Toán Học Nhí",
  playerAvatar: "🏃",
  score: 0,
  stars: 0,
  streak: 0,
  soundEnabled: true,
  unlockedBadges: new Set()
};

// Web Audio API Synthesizer (100% offline, standalone)
class SoundEngine {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type, duration, delay = 0) {
    if (!GameState.soundEnabled) return;
    try {
      this.init();
      setTimeout(() => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start();
        osc.stop(this.ctx.currentTime + duration);
      }, delay * 1000);
    } catch (e) {
      console.warn("Audio not supported or blocked", e);
    }
  }

  click() {
    this.playTone(600, 'sine', 0.08);
  }

  correct() {
    this.playTone(523.25, 'triangle', 0.15, 0);       // C5
    this.playTone(659.25, 'triangle', 0.15, 0.1);     // E5
    this.playTone(783.99, 'triangle', 0.25, 0.2);     // G5
    this.playTone(1046.50, 'triangle', 0.35, 0.3);    // C6
  }

  wrong() {
    this.playTone(300, 'sawtooth', 0.2, 0);
    this.playTone(220, 'sawtooth', 0.3, 0.15);
  }

  fanfare() {
    const notes = [440, 554, 659, 880, 1108];
    notes.forEach((freq, idx) => {
      this.playTone(freq, 'triangle', 0.35, idx * 0.12);
    });
  }
}

const sounds = new SoundEngine();

// ==============================================================================
// 2. CONFETTI PARTICLES ENGINE
// ==============================================================================
const canvas = document.getElementById('confetti-canvas');
const ctx = canvas.getContext('2d');
let particles = [];
let animationId = null;

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

function launchConfetti(count = 70) {
  const colors = ['#10b981', '#059669', '#38bdf8', '#0284c7', '#fbbf24', '#f59e0b', '#ec4899'];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      vx: (Math.random() - 0.5) * 16,
      vy: (Math.random() - 0.7) * 16,
      size: Math.random() * 8 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 10,
      opacity: 1
    });
  }
  if (!animationId) {
    animateConfetti();
  }
}

function animateConfetti() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vy += 0.4; // gravity
    p.rotation += p.vRot;
    p.opacity -= 0.012;

    if (p.opacity <= 0) {
      particles.splice(i, 1);
      continue;
    }

    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate((p.rotation * Math.PI) / 180);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.opacity;
    ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
    ctx.restore();
  }

  if (particles.length > 0) {
    animationId = requestAnimationFrame(animateConfetti);
  } else {
    animationId = null;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
}

// Floating Score notification
function showFloatingScore(text, x, y) {
  const el = document.createElement('div');
  el.className = 'floating-score';
  el.textContent = text;
  el.style.left = `${x || window.innerWidth / 2}px`;
  el.style.top = `${y || window.innerHeight / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

// Reward Points Helper
function addRewards(points, stars = 1, e = null) {
  GameState.score += points;
  GameState.stars += stars;
  GameState.streak += 1;

  document.getElementById('hud-score').textContent = GameState.score;
  document.getElementById('hud-stars').textContent = GameState.stars;

  const comboEl = document.getElementById('hud-combo');
  if (GameState.streak >= 2) {
    comboEl.classList.add('active');
    comboEl.textContent = `🔥 Combo x${GameState.streak}!`;
  } else {
    comboEl.classList.remove('active');
  }

  sounds.correct();
  const posX = e ? (e.clientX || e.pageX) : (window.innerWidth / 2);
  const posY = e ? (e.clientY || e.pageY) : (window.innerHeight / 2);
  showFloatingScore(`+${points} 🪙`, posX, posY);

  updateCertificate();
}

function resetStreak() {
  GameState.streak = 0;
  const comboEl = document.getElementById('hud-combo');
  comboEl.classList.remove('active');
}

// Badge Unlocking
function unlockBadge(id, title) {
  if (GameState.unlockedBadges.has(id)) return;
  GameState.unlockedBadges.add(id);
  const el = document.getElementById(`badge-${id}`);
  if (el) {
    el.classList.add('unlocked');
  }
  sounds.fanfare();
  launchConfetti(80);
}

// ==============================================================================
// 3. START SCREEN & HUD INITIALIZATION
// ==============================================================================
document.addEventListener('DOMContentLoaded', () => {
  // Avatar selection
  document.querySelectorAll('.avatar-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.avatar-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      GameState.playerAvatar = btn.getAttribute('data-avatar');
      sounds.click();
    });
  });

  // Sound toggle
  const soundBtn = document.getElementById('btn-sound-toggle');
  soundBtn.addEventListener('click', () => {
    GameState.soundEnabled = !GameState.soundEnabled;
    soundBtn.textContent = GameState.soundEnabled ? '🔊' : '🔇';
    sounds.click();
  });

  // Start adventure button
  const startBtn = document.getElementById('btn-start-adventure');
  startBtn.addEventListener('click', () => {
    const nameInput = document.getElementById('player-name-input').value.trim();
    if (nameInput) {
      GameState.playerName = nameInput;
    }
    document.getElementById('hud-name-display').textContent = GameState.playerName;
    document.getElementById('hud-avatar-display').textContent = GameState.playerAvatar;
    document.getElementById('cert-student-name-display').textContent = GameState.playerName;

    document.getElementById('start-screen').classList.add('hidden');
    sounds.fanfare();
    launchConfetti(50);
  });

  // Init all modules
  initQueueActivity();
  initSvgNumberLine();
  initNeighborGame();
  initPoleGame();
  loadSetMission(1);
  initQuizArena();
  updateCertificate();
});

// ==============================================================================
// 4. SECTION 1: XẾP HÀNG MUA VÉ BÓNG ĐÁ (KHỞI ĐỘNG TRANG 13)
// ==============================================================================
const queuePeople = [
  { id: 1, name: "Bác Ba", emoji: "🧔", tag: "Người thứ 1", order: 1 },
  { id: 2, name: "Cô Hoa", emoji: "👩", tag: "Người thứ 2", order: 2 },
  { id: 3, name: "Bạn Nam", emoji: "👦", tag: "Người thứ 3", order: 3 },
  { id: 4, name: "Bạn Mai", emoji: "👧", tag: "Người thứ 4", order: 4 },
  { id: 5, name: "Anh Hải", emoji: "👨", tag: "Người thứ 5", order: 5 }
];
let currentExpectedOrder = 1;

function initQueueActivity() {
  const track = document.getElementById('queue-interactive-track');
  track.innerHTML = '';
  currentExpectedOrder = 1;

  queuePeople.forEach(person => {
    const el = document.createElement('div');
    el.className = 'queue-person';
    el.id = `queue-p-${person.id}`;
    el.innerHTML = `
      <span class="person-emoji">${person.emoji}</span>
      <span class="person-tag">${person.tag}</span>
      <div class="person-number">Số: ?</div>
      <div style="font-size:0.85rem; font-weight:700; color:#334155;">${person.name}</div>
    `;
    el.addEventListener('click', (e) => handleQueueClick(person, el, e));
    track.appendChild(el);
  });
}

function handleQueueClick(person, el, e) {
  if (el.classList.contains('correct')) return;

  if (person.order === currentExpectedOrder) {
    el.classList.add('correct');
    el.querySelector('.person-number').textContent = `Số ${person.order}`;
    el.querySelector('.person-number').style.color = '#059669';
    addRewards(15, 1, e);
    currentExpectedOrder++;

    if (currentExpectedOrder > 5) {
      document.getElementById('queue-status-text').innerHTML =
        '🎉 <strong>XUẤT SẮC!</strong> Em đã đánh số đúng thứ tự từ 1 đến 5 cho dòng người xếp hàng!';
      unlockBadge(1, "Kiện Tướng Tia Số");
    } else {
      document.getElementById('queue-status-text').innerHTML =
        `👉 Chính xác! Hãy chọn tiếp <strong>Người thứ ${currentExpectedOrder}</strong>!`;
    }
  } else {
    sounds.wrong();
    resetStreak();
    document.getElementById('queue-status-text').innerHTML =
      `⚠️ Chưa đúng rồi! Người tiếp theo phải là <strong>Người thứ ${currentExpectedOrder}</strong> cơ!`;
    el.style.transform = 'translateX(6px)';
    setTimeout(() => el.style.transform = '', 200);
  }
}

// ==============================================================================
// 5. SECTION 2: TIA SỐ TRỰC QUAN SVG & HOẠT ĐỘNG 1, 2, 3
// ==============================================================================
const maxTicks = 13;
const svgWidth = 920;
const startX = 60;
const stepX = (svgWidth - 100) / maxTicks;
const axisY = 60;

function initSvgNumberLine() {
  const svg = document.getElementById('svg-number-line');
  svg.innerHTML = '';

  // 1. Draw axis line
  const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  line.setAttribute('x1', startX - 20);
  line.setAttribute('y1', axisY);
  line.setAttribute('x2', svgWidth - 15);
  line.setAttribute('y2', axisY);
  line.setAttribute('class', 'axis-line');
  svg.appendChild(line);

  // 2. Draw Arrowhead
  const marker = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  marker.setAttribute('points', `${svgWidth - 10},${axisY} ${svgWidth - 25},${axisY - 7} ${svgWidth - 25},${axisY + 7}`);
  marker.setAttribute('class', 'arrow-head');
  svg.appendChild(marker);

  // 3. Draw ticks and points from 0 to 13
  for (let i = 0; i <= maxTicks; i++) {
    const x = startX + i * stepX;

    // Tick line
    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', x);
    tick.setAttribute('y1', axisY - 8);
    tick.setAttribute('x2', x);
    tick.setAttribute('y2', axisY + 8);
    tick.setAttribute('class', 'tick-line');
    svg.appendChild(tick);

    // Interactive Circle Point
    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', x);
    circle.setAttribute('cy', axisY);
    circle.setAttribute('r', i === 0 ? 8 : 7);
    circle.setAttribute('class', i === 0 ? 'point-circle active-point' : 'point-circle');
    circle.setAttribute('id', `nl-pt-${i}`);
    circle.setAttribute('data-val', i);
    circle.addEventListener('click', (e) => onPointClicked(i, e));
    svg.appendChild(circle);

    // Label under tick (0, 1, 2, ...)
    const label = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    label.setAttribute('x', x);
    label.setAttribute('y', axisY + 32);
    label.setAttribute('class', 'point-label');
    label.textContent = i;
    label.addEventListener('click', (e) => onPointClicked(i, e));
    svg.appendChild(label);

    // Label for Origin O
    if (i === 0) {
      const originO = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      originO.setAttribute('x', x);
      originO.setAttribute('y', axisY - 18);
      originO.setAttribute('class', 'point-origin');
      originO.textContent = 'O';
      svg.appendChild(originO);
    }
  }

  document.getElementById('btn-reset-nl').addEventListener('click', () => {
    resetNumberLineHighlight();
    document.getElementById('nl-current-info').innerHTML =
      '👉 <em>Click vào các chấm tròn trên tia số để khám phá vị trí và tính chất!</em>';
    sounds.click();
  });
}

function resetNumberLineHighlight() {
  for (let i = 0; i <= maxTicks; i++) {
    const c = document.getElementById(`nl-pt-${i}`);
    if (c) {
      c.setAttribute('class', i === 0 ? 'point-circle active-point' : 'point-circle');
      c.style.fill = '';
    }
  }
}

function onPointClicked(val, e) {
  resetNumberLineHighlight();
  const c = document.getElementById(`nl-pt-${val}`);
  if (c) {
    c.style.fill = '#f59e0b';
    c.setAttribute('r', '11');
  }

  sounds.click();
  const infoEl = document.getElementById('nl-current-info');
  if (val === 0) {
    infoEl.innerHTML =
      '📍 <strong>Gốc O biểu diễn số 0:</strong> Số 0 là số tự nhiên <strong>nhỏ nhất</strong> và <strong>không có số liền trước</strong>!';
  } else {
    infoEl.innerHTML =
      `📍 <strong>Điểm ${val}:</strong> Số liền trước là <strong>${val - 1}</strong> (ở bên trái), số liền sau là <strong>${val + 1 <= maxTicks ? val + 1 : val + 1}</strong> (ở bên phải)!`;
  }
}

function highlightTwoPoints(a, b) {
  resetNumberLineHighlight();
  const ptA = document.getElementById(`nl-pt-${a}`);
  const ptB = document.getElementById(`nl-pt-${b}`);
  if (ptA) ptA.style.fill = '#10b981';
  if (ptB) ptB.style.fill = '#ef4444';

  sounds.correct();
  document.getElementById('nl-current-info').innerHTML =
    `🔴 <strong>So sánh ${a} và ${b}:</strong> Điểm ${a} (xanh) nằm <strong>bên trái</strong> điểm ${b} (đỏ). Ta có $${a} < ${b}$ hay điểm ${a} nằm <strong>trước</strong> điểm ${b}!`;
  addRewards(10, 1);
}

function highlightNeighbors(val) {
  resetNumberLineHighlight();
  const ptMain = document.getElementById(`nl-pt-${val}`);
  const ptPrev = document.getElementById(`nl-pt-${val - 1}`);
  const ptNext = document.getElementById(`nl-pt-${val + 1}`);

  if (ptMain) ptMain.style.fill = '#f59e0b';
  if (ptPrev) ptPrev.style.fill = '#3b82f6';
  if (ptNext) ptNext.style.fill = '#10b981';

  sounds.correct();
  document.getElementById('nl-current-info').innerHTML =
    `🟡 <strong>Lân cận của ${val}:</strong> Điểm ngay bên trái là <strong>${val - 1}</strong> (liền trước). Điểm ngay bên phải là <strong>${val + 1}</strong> (liền sau). Hai số ${val} và ${val + 1} là hai số tự nhiên liên tiếp!`;
  addRewards(10, 1);
}

function highlightSmallerThan(n) {
  resetNumberLineHighlight();
  for (let i = 0; i < n; i++) {
    const pt = document.getElementById(`nl-pt-${i}`);
    if (pt) pt.style.fill = '#10b981';
  }
  const ptN = document.getElementById(`nl-pt-${n}`);
  if (ptN) ptN.style.fill = '#ef4444';

  sounds.correct();
  document.getElementById('nl-current-info').innerHTML =
    `🟢 <strong>Các số nhỏ hơn ${n}:</strong> Tất cả các điểm 0, 1, 2, 3, 4, 5, 6 (xanh) đều <strong>nằm bên trái</strong> điểm ${n} (đỏ)!`;
  addRewards(15, 1);
}

// ==============================================================================
// 6. SECTION 3: MINI-GAME 1: TRUY TÌM SỐ LIỀN TRƯỚC & LIỀN SAU
// ==============================================================================
const neighborLevels = [
  {
    target: 3532,
    prev: 3531,
    next: 3533,
    candidates: [3530, 3531, 3533, 3534, 3529]
  },
  {
    target: 3529,
    prev: 3528,
    next: 3530,
    candidates: [3527, 3528, 3530, 3531, 3529]
  },
  {
    target: 999,
    prev: 998,
    next: 1000,
    candidates: [997, 998, 1000, 1001, 990]
  }
];
let currentNeighborLevelIdx = 0;
let userPrevSelected = null;
let userNextSelected = null;

function initNeighborGame() {
  loadNeighborLevel(currentNeighborLevelIdx);
  document.getElementById('btn-next-neighbor-level').addEventListener('click', () => {
    currentNeighborLevelIdx = (currentNeighborLevelIdx + 1) % neighborLevels.length;
    loadNeighborLevel(currentNeighborLevelIdx);
  });
}

function loadNeighborLevel(idx) {
  const level = neighborLevels[idx];
  userPrevSelected = null;
  userNextSelected = null;

  document.getElementById('target-number-display').textContent = level.target.toLocaleString('vi-VN');
  const slotPrev = document.getElementById('slot-prev');
  const slotNext = document.getElementById('slot-next');

  slotPrev.className = 'slot-box';
  slotNext.className = 'slot-box';
  document.getElementById('slot-prev-val').textContent = '?';
  document.getElementById('slot-next-val').textContent = '?';

  document.getElementById('neighbor-feedback').innerHTML =
    `👇 Bấm số liền trước <em>(${level.target - 1})</em> hoặc số liền sau <em>(${level.target + 1})</em>:`;
  document.getElementById('btn-next-neighbor-level').style.display = 'none';

  const candidatesBox = document.getElementById('neighbor-candidates-box');
  candidatesBox.innerHTML = '';

  level.candidates.forEach(num => {
    const btn = document.createElement('button');
    btn.className = 'btn-candidate';
    btn.textContent = num.toLocaleString('vi-VN');
    btn.addEventListener('click', (e) => handleCandidatePick(num, btn, e));
    candidatesBox.appendChild(btn);
  });
}

function handleCandidatePick(num, btn, e) {
  const level = neighborLevels[currentNeighborLevelIdx];

  if (num === level.prev) {
    userPrevSelected = num;
    const slot = document.getElementById('slot-prev');
    slot.classList.add('filled');
    document.getElementById('slot-prev-val').textContent = num.toLocaleString('vi-VN');
    btn.classList.add('disabled');
    addRewards(20, 1, e);
    sounds.correct();
    document.getElementById('neighbor-feedback').innerHTML =
      `🎉 Chính xác! <strong>${num}</strong> là số liền trước của <strong>${level.target}</strong>!`;
  } else if (num === level.next) {
    userNextSelected = num;
    const slot = document.getElementById('slot-next');
    slot.classList.add('filled');
    document.getElementById('slot-next-val').textContent = num.toLocaleString('vi-VN');
    btn.classList.add('disabled');
    addRewards(20, 1, e);
    sounds.correct();
    document.getElementById('neighbor-feedback').innerHTML =
      `🎉 Chính xác! <strong>${num}</strong> là số liền sau của <strong>${level.target}</strong>!`;
  } else {
    sounds.wrong();
    resetStreak();
    document.getElementById('neighbor-feedback').innerHTML =
      `⚠️ Số <strong>${num}</strong> không phải là số liền kề của <strong>${level.target}</strong>. Hãy thử lại!`;
    return;
  }

  // Both filled
  if (userPrevSelected && userNextSelected) {
    unlockBadge(2, "Chiến Binh Liền Kề");
    document.getElementById('neighbor-feedback').innerHTML =
      `🏆 <strong>HOÀN HẢO!</strong> Bộ ba số liên tiếp: <strong>${level.prev} &lt; ${level.target} &lt; ${level.next}</strong>!`;
    document.getElementById('btn-next-neighbor-level').style.display = 'inline-block';
  }
}

// ==============================================================================
// 7. SECTION 4: MINI-GAME 2: CÁN CÂN SO SÁNH (<, =, >)
// ==============================================================================
function checkScaleAnswer(op) {
  const panLeft = document.getElementById('pan-left');
  const panRight = document.getElementById('pan-right');
  const opDisplay = document.getElementById('scale-op-display');
  const feedback = document.getElementById('scale-feedback');

  opDisplay.textContent = op;

  if (op === '>') {
    panLeft.className = 'scale-pan tilt-down';
    panRight.className = 'scale-pan tilt-up';
    feedback.innerHTML =
      '🎉 <strong>CHÍNH XÁC!</strong> $12\,036\,001 > 12\,035\,987$ vì so sánh từ trái sang phải, chữ số hàng nghìn có $6 > 5$! Cán cân đã nghiêng về bên trái!';
    feedback.style.color = '#059669';
    addRewards(25, 2);
    unlockBadge(3, "Chuyên Gia Cán Cân");
  } else {
    sounds.wrong();
    resetStreak();
    panLeft.className = 'scale-pan';
    panRight.className = 'scale-pan';
    feedback.innerHTML =
      '⚠️ Chưa chính xác rồi! Hai số có cùng 8 chữ số, các hàng triệu, trăm nghìn, chục nghìn đều là $1203...$. Nhưng đến hàng nghìn thì $6 > 5$ nên số bên trái phải lớn hơn!';
    feedback.style.color = '#dc2626';
  }
}

// ==============================================================================
// 8. SECTION 5: THỬ THÁCH CÂY SÀO ĐO CHIỀU CAO (BÀI 1.16 SGK)
// ==============================================================================
let selectedFriendId = null;
const friendsData = {
  an: { name: "Bạn An", height: 150, avatar: "👦" },
  bac: { name: "Bạn Bắc", height: 153, avatar: "🧑" },
  cuong: { name: "Bạn Cường", height: 148, avatar: "🧒" }
};
const polePlacements = {
  top: null, // Should be Bắc (153 cm)
  mid: null, // Should be An (150 cm)
  bot: null  // Should be Cường (148 cm)
};

function selectFriend(friendId) {
  selectedFriendId = friendId;
  document.querySelectorAll('.friend-item').forEach(item => {
    item.classList.remove('selected');
    if (item.getAttribute('data-id') === friendId) {
      item.classList.add('selected');
    }
  });
  sounds.click();
  document.getElementById('pole-feedback').innerHTML =
    `👉 Em đang chọn <strong>${friendsData[friendId].name} (${friendsData[friendId].height} cm)</strong>. Giờ hãy bấm vào một vạch trên cây sào (A, B hoặc C)!`;
}

function initPoleGame() {
  document.querySelectorAll('.pole-mark.dropzone').forEach(zone => {
    zone.addEventListener('click', () => {
      const pos = zone.getAttribute('data-pos');
      if (!selectedFriendId) {
        document.getElementById('pole-feedback').innerHTML =
          '👉 Vui lòng chọn một bạn trong danh sách bên phải trước!';
        return;
      }
      polePlacements[pos] = selectedFriendId;
      renderPolePlacements();
      sounds.click();
    });
  });
}

function renderPolePlacements() {
  ['top', 'mid', 'bot'].forEach(pos => {
    const friendId = polePlacements[pos];
    const displayEl = document.getElementById(`dropped-${pos}`);
    if (friendId) {
      const f = friendsData[friendId];
      displayEl.innerHTML = `<strong>${f.avatar} ${f.name}</strong> (${f.height} cm)`;
      displayEl.style.color = '#047857';
    } else {
      displayEl.textContent = pos === 'top' ? '❓ Vạch cao nhất (Trên cùng)' :
                              pos === 'mid' ? '❓ Vạch ở giữa' : '❓ Vạch thấp nhất (Dưới cùng)';
      displayEl.style.color = '';
    }
  });
}

function resetPoleGame() {
  polePlacements.top = null;
  polePlacements.mid = null;
  polePlacements.bot = null;
  selectedFriendId = null;
  document.querySelectorAll('.friend-item').forEach(item => item.classList.remove('selected'));
  renderPolePlacements();
  document.getElementById('pole-feedback').innerHTML =
    'Đã làm mới! Cường nói từ dưới lên là A (An), B (Bắc), C (Cường) có đúng không?';
}

function checkPoleSolution() {
  const fb = document.getElementById('pole-feedback');
  if (!polePlacements.top || !polePlacements.mid || !polePlacements.bot) {
    fb.innerHTML = '⚠️ Em cần xếp đủ 3 bạn vào 3 vạch của cây sào trước khi kiểm tra nhé!';
    fb.style.color = '#f59e0b';
    sounds.wrong();
    return;
  }

  // Check correct order:
  // Cây sào dựng từ đất lên:
  // bot = Cường (148cm - thấp nhất)
  // mid = An (150cm - ở giữa)
  // top = Bắc (153cm - cao nhất)
  const isCorrect = (polePlacements.bot === 'cuong' && polePlacements.mid === 'an' && polePlacements.top === 'bac');

  if (isCorrect) {
    fb.innerHTML =
      '🎉 <strong>CHÍNH XÁC TUYỆT ĐỐI!</strong> Cường giải thích là <strong>SAI</strong>! Vì chiều cao $148 < 150 < 153$, nên từ dưới lên phải là: <strong>Vạch A (Cường 148 cm) &rarr; Vạch B (An 150 cm) &rarr; Vạch C (Bắc 153 cm)</strong>!';
    fb.style.color = '#059669';
    addRewards(30, 2);
    unlockBadge(4, "Kỷ Lục Đo Sào");
  } else {
    sounds.wrong();
    resetStreak();
    fb.innerHTML =
      '⚠️ Chưa đúng rồi! Chiều cao của 3 bạn: Cường ($148$ cm) &lt; An ($150$ cm) &lt; Bắc ($153$ cm). Cây sào cắm từ đất lên thì bạn thấp nhất phải ở vạch dưới cùng chứ!';
    fb.style.color = '#dc2626';
  }
}

// ==============================================================================
// 9. SECTION 6: MINI-GAME 4: BẮT PHẦN TỬ VỚI KÍ HIỆU ≤ VÀ ≥ (BÀI 1.15 SGK)
// ==============================================================================
const setMissions = {
  1: {
    title: "Tập hợp M = {x ∈ ℕ | 10 ≤ x < 15}",
    desc: "Nhiệm vụ: Chọn các số tự nhiên từ 10 đến dưới 15 (chứa số 10 nhưng KHÔNG chứa số 15)!",
    numbers: [8, 9, 10, 11, 12, 13, 14, 15, 16],
    solution: new Set([10, 11, 12, 13, 14]),
    explanation: "M = {10; 11; 12; 13; 14}. Chú ý vì có dấu ≤ 10 nên lấy 10, nhưng dấu < 15 nên không lấy 15!"
  },
  2: {
    title: "Tập hợp K = {x ∈ ℕ* | x ≤ 3}",
    desc: "Nhiệm vụ: Chọn các số thuộc ℕ* (số tự nhiên KHÁC 0) nhỏ hơn hoặc bằng 3!",
    numbers: [0, 1, 2, 3, 4, 5],
    solution: new Set([1, 2, 3]),
    explanation: "K = {1; 2; 3}. Lưu ý tập ℕ* không chứa số 0!"
  },
  3: {
    title: "Tập hợp L = {x ∈ ℕ | x ≤ 3}",
    desc: "Nhiệm vụ: Chọn các số thuộc ℕ (tập hợp số tự nhiên BẮT ĐẦU TỪ 0) nhỏ hơn hoặc bằng 3!",
    numbers: [0, 1, 2, 3, 4, 5],
    solution: new Set([0, 1, 2, 3]),
    explanation: "L = {0; 1; 2; 3}. Khác với K, tập L thuộc ℕ nên chứa cả số 0!"
  }
};
let currentMissionId = 1;
let selectedBubbles = new Set();

function loadSetMission(id) {
  currentMissionId = id;
  selectedBubbles.clear();
  const m = setMissions[id];

  document.getElementById('set-mission-title').innerHTML = m.title;
  document.getElementById('set-mission-desc').innerHTML = m.desc;
  document.getElementById('set-feedback').innerHTML = '';

  const grid = document.getElementById('bubbles-box');
  grid.innerHTML = '';

  m.numbers.forEach(num => {
    const btn = document.createElement('button');
    btn.className = 'bubble-btn';
    btn.textContent = num;
    btn.addEventListener('click', () => {
      if (selectedBubbles.has(num)) {
        selectedBubbles.delete(num);
        btn.classList.remove('selected');
      } else {
        selectedBubbles.add(num);
        btn.classList.add('selected');
      }
      sounds.click();
    });
    grid.appendChild(btn);
  });
}

function checkSetBubbles() {
  const m = setMissions[currentMissionId];
  const fb = document.getElementById('set-feedback');

  // Check equality
  const sol = m.solution;
  const isMatch = (selectedBubbles.size === sol.size && [...selectedBubbles].every(val => sol.has(val)));

  if (isMatch) {
    fb.innerHTML = `🎉 <strong>TUYỆT VỜI!</strong> ${m.explanation}`;
    fb.style.color = '#059669';
    addRewards(25, 2);
    launchConfetti(50);
  } else {
    sounds.wrong();
    resetStreak();
    fb.innerHTML = `⚠️ Chưa đúng rồi! Hãy nhớ: ${m.desc}. Bấm chọn lại nhé!`;
    fb.style.color = '#dc2626';
  }
}

// ==============================================================================
// 10. SECTION 7: ĐẤU TRƯỜNG 8 CÂU HỎI TRỌNG TÂM (ARENA QUIZ)
// ==============================================================================
const quizBank = [
  {
    q: "Câu 1: Trên tia số nằm ngang có gốc O, nếu điểm a nằm bên trái điểm b thì kết luận nào sau đây đúng?",
    options: [
      "a > b",
      "a < b (điểm a nằm trước điểm b)",
      "a = b",
      "Điểm b nằm trước điểm a"
    ],
    correct: 1,
    explain: "SGK tr.13: Nếu số a nhỏ hơn số b thì trên tia số nằm ngang điểm a nằm bên trái điểm b. Khi đó ta viết a < b và nói điểm a nằm trước điểm b."
  },
  {
    q: "Câu 2: Số tự nhiên nhỏ nhất trong tập hợp ℕ là số nào?",
    options: [
      "Số 1",
      "Số 0 (và số 0 không có số liền trước)",
      "Không có số tự nhiên nhỏ nhất",
      "Số 10"
    ],
    correct: 1,
    explain: "SGK tr.13: Số 0 không có số liền trước và là số tự nhiên nhỏ nhất trong tập hợp ℕ."
  },
  {
    q: "Câu 3: (Bài 1.13 SGK) Số liền trước và số liền sau của số 3 532 lần lượt là:",
    options: [
      "3 530 và 3 531",
      "3 531 và 3 533",
      "3 533 và 3 534",
      "3 531 và 3 532"
    ],
    correct: 1,
    explain: "Số liền trước của 3 532 là 3 532 - 1 = 3 531; số liền sau là 3 532 + 1 = 3 533."
  },
  {
    q: "Câu 4: (Bài 1.14 SGK) Cho ba số tự nhiên a, b, c với a nhỏ nhất. Biết trên tia số, điểm b nằm giữa điểm a và c. Thứ tự 3 số là:",
    options: [
      "b < a < c",
      "c < b < a",
      "a < b < c",
      "a < c < b"
    ],
    correct: 2,
    explain: "Vì a là số nhỏ nhất nên điểm a nằm ngoài cùng bên trái. Điểm b nằm giữa a và c nên a < b < c."
  },
  {
    q: "Câu 5: (Bài 1.15b SGK) Liệt kê các phần tử của tập hợp K = {x ∈ ℕ* | x ≤ 3}:",
    options: [
      "K = {0; 1; 2; 3}",
      "K = {1; 2; 3}",
      "K = {1; 2}",
      "K = {0; 1; 2}"
    ],
    correct: 1,
    explain: "Vì x ∈ ℕ* nên x là các số tự nhiên khác 0. Kết hợp điều kiện x ≤ 3, ta được K = {1; 2; 3}."
  },
  {
    q: "Câu 6: (Bài 1.15c SGK) Liệt kê các phần tử của tập hợp L = {x ∈ ℕ | x ≤ 3}:",
    options: [
      "L = {1; 2; 3}",
      "L = {0; 1; 2; 3}",
      "L = {0; 1; 2}",
      "L = {0; 3}"
    ],
    correct: 1,
    explain: "Tập hợp ℕ bao gồm cả số 0, do đó x ∈ ℕ và x ≤ 3 cho ta L = {0; 1; 2; 3}."
  },
  {
    q: "Câu 7: (Bài luyện tập SGK) So sánh hai số m = 12 036 001 và n = 12 035 987, điểm nào nằm trước trên tia số?",
    options: [
      "m < n và điểm m nằm trước điểm n",
      "m > n và điểm n nằm trước điểm m",
      "m = n và hai điểm trùng nhau",
      "m > n và điểm m nằm trước điểm n"
    ],
    correct: 1,
    explain: "So sánh chữ số hàng nghìn 6 > 5 nên m > n, tức n < m. Trên tia số nằm ngang, số bé hơn (điểm n) sẽ nằm trước số lớn hơn (điểm m)!"
  },
  {
    q: "Câu 8: Tính chất bắc cầu của thứ tự trong ℕ phát biểu rằng:",
    options: [
      "Nếu a < b và b < c thì a = c",
      "Nếu a < b và b < c thì a < c",
      "Nếu a < b và b < c thì a > c",
      "Nếu a < b thì b < a"
    ],
    correct: 1,
    explain: "SGK tr.13: Nếu a < b và b < c thì a < c (tính chất bắc cầu). Chẳng hạn a < 5 và 5 < 7 thì suy ra a < 7."
  }
];

let currentQuizIdx = 0;
let answeredCurrentQuiz = false;

function initQuizArena() {
  currentQuizIdx = 0;
  loadQuizQuestion(currentQuizIdx);
}

function loadQuizQuestion(idx) {
  answeredCurrentQuiz = false;
  const qData = quizBank[idx];

  document.getElementById('quiz-question-number').textContent = `Câu hỏi ${idx + 1} / ${quizBank.length}`;
  document.getElementById('quiz-question-title').textContent = qData.q;

  const fbBox = document.getElementById('quiz-feedback-box');
  fbBox.className = 'quiz-feedback';
  fbBox.innerHTML = '';

  document.getElementById('btn-next-quiz').style.display = 'none';

  const optBox = document.getElementById('quiz-options-box');
  optBox.innerHTML = '';

  const keyLetters = ['A', 'B', 'C', 'D'];
  qData.options.forEach((optText, oIdx) => {
    const btn = document.createElement('button');
    btn.className = 'option-btn';
    btn.innerHTML = `
      <span class="opt-key">${keyLetters[oIdx]}</span>
      <span>${optText}</span>
    `;
    btn.addEventListener('click', (e) => handleQuizOptionClick(oIdx, btn, e));
    optBox.appendChild(btn);
  });
}

function handleQuizOptionClick(chosenIdx, btn, e) {
  if (answeredCurrentQuiz) return;
  answeredCurrentQuiz = true;

  const qData = quizBank[currentQuizIdx];
  const allBtns = document.querySelectorAll('.option-btn');
  const fbBox = document.getElementById('quiz-feedback-box');

  if (chosenIdx === qData.correct) {
    btn.classList.add('correct');
    addRewards(30, 2, e);
    fbBox.className = 'quiz-feedback show';
    fbBox.innerHTML = `🎉 <strong>CHÍNH XÁC!</strong> ${qData.explain}`;
    launchConfetti(40);
  } else {
    btn.classList.add('wrong');
    allBtns[qData.correct].classList.add('correct');
    sounds.wrong();
    resetStreak();
    fbBox.className = 'quiz-feedback show error';
    fbBox.innerHTML = `⚠️ <strong>CHƯA ĐÚNG!</strong> Đáp án đúng là <strong>${['A', 'B', 'C', 'D'][qData.correct]}</strong>.<br>${qData.explain}`;
  }

  // Check if reached end
  const nextBtn = document.getElementById('btn-next-quiz');
  if (currentQuizIdx < quizBank.length - 1) {
    nextBtn.textContent = 'Câu Tiếp Theo ➡️';
  } else {
    nextBtn.textContent = '🎓 Hoàn Thành & Nhận Chứng Nhận';
    unlockBadge(5, "Đại Hiệp Thứ Tự");
  }
  nextBtn.style.display = 'inline-block';
}

function handleNextQuiz() {
  if (currentQuizIdx < quizBank.length - 1) {
    currentQuizIdx++;
    loadQuizQuestion(currentQuizIdx);
  } else {
    // Scroll to certificate
    const certEl = document.getElementById('certificate-section');
    certEl.scrollIntoView({ behavior: 'smooth' });
    sounds.fanfare();
    launchConfetti(100);
  }
}

// ==============================================================================
// 11. CERTIFICATE UPDATES & RESTART
// ==============================================================================
function updateCertificate() {
  document.getElementById('cert-student-name-display').textContent = GameState.playerName;
  document.getElementById('cert-score-display').textContent = GameState.score;
  document.getElementById('cert-stars-display').textContent = GameState.stars;

  let rank = "Học Viên Tích Cực";
  if (GameState.score >= 250) rank = "Đại Kiện Tướng Thứ Tự 👑";
  else if (GameState.score >= 150) rank = "Kiện Tướng Toán Học 🌟";
  else if (GameState.score >= 80) rank = "Chiến Binh Tia Số ⚡";

  document.getElementById('cert-rank-display').textContent = rank;

  const now = new Date();
  document.getElementById('cert-date-display').textContent =
    `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}`;
}

function restartLesson() {
  GameState.score = 0;
  GameState.stars = 0;
  GameState.streak = 0;
  GameState.unlockedBadges.clear();

  document.getElementById('hud-score').textContent = '0';
  document.getElementById('hud-stars').textContent = '0';
  document.getElementById('hud-combo').classList.remove('active');

  for (let i = 1; i <= 5; i++) {
    const el = document.getElementById(`badge-${i}`);
    if (el) el.classList.remove('unlocked');
  }

  initQueueActivity();
  resetNumberLineHighlight();
  initNeighborGame();
  resetPoleGame();
  loadSetMission(1);
  initQuizArena();
  updateCertificate();

  window.scrollTo({ top: 0, behavior: 'smooth' });
  sounds.click();
}
