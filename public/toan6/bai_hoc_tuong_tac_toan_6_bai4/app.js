/**
 * ==============================================================================
 * TOÁN 6 - BÀI 4: PHÉP CỘNG VÀ PHÉP TRỪ SỐ TỰ NHIÊN
 * KẾT NỐI TRI THỨC VỚI CUỘC SỐNG (TRANG 15 - 16)
 * MINI-GAME HỌC TẬP TƯƠNG TÁC, WEB AUDIO API & ĐẤU TRƯỜNG QUIZ
 * ==============================================================================
 */

// ==============================================================================
// 1. GAME STATE & AUDIO ENGINE
// ==============================================================================
const GameState = {
  playerName: "Kiện Tướng Tính Nhanh",
  playerAvatar: "⚡",
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
    this.playTone(650, 'sine', 0.08);
  }

  correct() {
    this.playTone(523.25, 'triangle', 0.15, 0);       // C5
    this.playTone(659.25, 'triangle', 0.15, 0.1);     // E5
    this.playTone(783.99, 'triangle', 0.25, 0.2);     // G5
    this.playTone(1046.50, 'triangle', 0.35, 0.3);    // C6
  }

  wrong() {
    this.playTone(280, 'sawtooth', 0.2, 0);
    this.playTone(200, 'sawtooth', 0.3, 0.15);
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
  const colors = ['#f97316', '#fb923c', '#4f46e5', '#818cf8', '#fbbf24', '#10b981', '#ef4444'];
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
    p.vy += 0.4;
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

function showFloatingScore(text, x, y) {
  const el = document.createElement('div');
  el.className = 'floating-score';
  el.textContent = text;
  el.style.left = `${x || window.innerWidth / 2}px`;
  el.style.top = `${y || window.innerHeight / 2}px`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1000);
}

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
// 3. START SCREEN & INITIALIZATION
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

  // Start adventure
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

  // Init Modules
  renderJumpDemo('add');
  loadPairMission(1);
  initQuizArena();
  updateCertificate();
});

// ==============================================================================
// 4. SECTION 1: GIỎ ĐI CHỢ CỦA MAI (TRANG 15 & VẬN DỤNG 2 TRANG 16)
// ==============================================================================
const marketPicked = {
  catim: false,
  cachua: false,
  raucai: false
};
const marketPrices = {
  catim: 18000,
  cachua: 21000,
  raucai: 30000
};

function toggleVeggie(itemKey, price) {
  marketPicked[itemKey] = !marketPicked[itemKey];
  const el = document.getElementById(`item-${itemKey}`);
  if (marketPicked[itemKey]) {
    el.classList.add('picked');
  } else {
    el.classList.remove('picked');
  }
  sounds.click();

  let total = 0;
  if (marketPicked.catim) total += marketPrices.catim;
  if (marketPicked.cachua) total += marketPrices.cachua;
  if (marketPicked.raucai) total += marketPrices.raucai;

  document.getElementById('basket-total').textContent = `${total.toLocaleString('vi-VN')} đ`;

  const fb = document.getElementById('market-feedback');
  if (marketPicked.catim && marketPicked.cachua && marketPicked.raucai) {
    const change = 100000 - total;
    document.getElementById('basket-change').textContent = `${change.toLocaleString('vi-VN')} đ`;
    fb.innerHTML =
      `🎉 <strong>XUẤT SẮC!</strong> Tổng tiền mua là <strong>69 000 đ</strong>. Số tiền cô bán hàng thối lại cho Mai là 100 000 - 69 000 = <strong>31 000 đ</strong>!`;
    fb.style.color = '#15803d';
    addRewards(20, 1);
    unlockBadge(1, "Thủ Lĩnh Đi Chợ");
  } else {
    document.getElementById('basket-change').textContent = '? đ';
    fb.innerHTML = '👉 Hãy chọn tiếp các món hàng còn lại của bạn Mai!';
    fb.style.color = '#9a3412';
  }
}

// ==============================================================================
// 5. SECTION 2: BƯỚC NHẢY TRÊN TIA SỐ (HÌNH 1.6, 1.7, 1.8)
// ==============================================================================
function renderJumpDemo(mode) {
  document.querySelectorAll('.btn-jump-action').forEach(b => b.classList.remove('active'));
  const svg = document.getElementById('svg-jump-canvas');
  svg.innerHTML = '';

  const startX = 60;
  const stepX = 65;
  const axisY = 100;
  const totalTicks = 10;

  // Draw axis
  const axis = document.createElementNS('http://www.w3.org/2000/svg', 'line');
  axis.setAttribute('x1', startX - 20);
  axis.setAttribute('y1', axisY);
  axis.setAttribute('x2', startX + totalTicks * stepX + 30);
  axis.setAttribute('y2', axisY);
  axis.setAttribute('stroke', '#1e293b');
  axis.setAttribute('stroke-width', '4');
  axis.setAttribute('stroke-linecap', 'round');
  svg.appendChild(axis);

  // Arrowhead
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  const ax = startX + totalTicks * stepX + 35;
  arrow.setAttribute('points', `${ax},${axisY} ${ax - 12},${axisY - 6} ${ax - 12},${axisY + 6}`);
  arrow.setAttribute('fill', '#1e293b');
  svg.appendChild(arrow);

  // Ticks & Labels 0 to 10
  for (let i = 0; i <= totalTicks; i++) {
    const x = startX + i * stepX;

    const tick = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    tick.setAttribute('x1', x);
    tick.setAttribute('y1', axisY - 6);
    tick.setAttribute('x2', x);
    tick.setAttribute('y2', axisY + 6);
    tick.setAttribute('stroke', '#64748b');
    tick.setAttribute('stroke-width', '2');
    svg.appendChild(tick);

    const txt = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    txt.setAttribute('x', x);
    txt.setAttribute('y', axisY + 24);
    txt.setAttribute('font-size', '15');
    txt.setAttribute('font-weight', '700');
    txt.setAttribute('fill', i === 0 ? '#ef4444' : '#1e293b');
    txt.setAttribute('text-anchor', 'middle');
    txt.textContent = i;
    svg.appendChild(txt);
  }

  const expBox = document.getElementById('jump-explanation');

  if (mode === 'add') {
    document.getElementById('btn-demo-add').classList.add('active');
    // Jump 1: 0 to 3
    const x0 = startX;
    const x3 = startX + 3 * stepX;
    const arc1 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arc1.setAttribute('d', `M ${x0} ${axisY - 5} Q ${(x0 + x3) / 2} ${axisY - 45} ${x3} ${axisY - 5}`);
    arc1.setAttribute('fill', 'none');
    arc1.setAttribute('stroke', '#3b82f6');
    arc1.setAttribute('stroke-width', '3');
    svg.appendChild(arc1);

    const t1 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t1.setAttribute('x', (x0 + x3) / 2);
    t1.setAttribute('y', axisY - 50);
    t1.setAttribute('fill', '#3b82f6');
    t1.setAttribute('font-weight', '800');
    t1.setAttribute('text-anchor', 'middle');
    t1.textContent = '+3';
    svg.appendChild(t1);

    // Jump 2: 3 to 7
    const x7 = startX + 7 * stepX;
    const arc2 = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arc2.setAttribute('d', `M ${x3} ${axisY - 5} Q ${(x3 + x7) / 2} ${axisY - 55} ${x7} ${axisY - 5}`);
    arc2.setAttribute('fill', 'none');
    arc2.setAttribute('stroke', '#10b981');
    arc2.setAttribute('stroke-width', '3');
    svg.appendChild(arc2);

    const t2 = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t2.setAttribute('x', (x3 + x7) / 2);
    t2.setAttribute('y', axisY - 60);
    t2.setAttribute('fill', '#10b981');
    t2.setAttribute('font-weight', '800');
    t2.setAttribute('text-anchor', 'middle');
    t2.textContent = '+4';
    svg.appendChild(t2);

    // Big landing circle at 7
    const c7 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c7.setAttribute('cx', x7);
    c7.setAttribute('cy', axisY);
    c7.setAttribute('r', '8');
    c7.setAttribute('fill', '#f59e0b');
    c7.setAttribute('stroke', '#b45309');
    c7.setAttribute('stroke-width', '3');
    svg.appendChild(c7);

    expBox.innerHTML =
      '🟢 <strong>Minh họa phép cộng 3 + 4 = 7:</strong> Bắt đầu từ điểm 0, nhảy tiến 3 bước đến điểm 3. Tiếp tục nhảy tiến 4 bước sang phải, ta đáp xuống <strong>điểm 7</strong>!';
    sounds.correct();
    addRewards(10, 1);
  } else if (mode === 'sub') {
    document.getElementById('btn-demo-sub').classList.add('active');
    // Start at 7, jump back 4 to 3
    const x7 = startX + 7 * stepX;
    const x3 = startX + 3 * stepX;

    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arc.setAttribute('d', `M ${x7} ${axisY - 5} Q ${(x7 + x3) / 2} ${axisY - 60} ${x3} ${axisY - 5}`);
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', '#ef4444');
    arc.setAttribute('stroke-width', '3');
    arc.setAttribute('stroke-dasharray', '6,4');
    svg.appendChild(arc);

    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', (x7 + x3) / 2);
    t.setAttribute('y', axisY - 65);
    t.setAttribute('fill', '#ef4444');
    t.setAttribute('font-weight', '800');
    t.setAttribute('text-anchor', 'middle');
    t.textContent = 'Lùi 4 bước (-4)';
    svg.appendChild(t);

    const c3 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    c3.setAttribute('cx', x3);
    c3.setAttribute('cy', axisY);
    c3.setAttribute('r', '8');
    c3.setAttribute('fill', '#10b981');
    c3.setAttribute('stroke', '#047857');
    c3.setAttribute('stroke-width', '3');
    svg.appendChild(c3);

    expBox.innerHTML =
      '🔴 <strong>Minh họa phép trừ 7 - 4 = 3:</strong> Bắt đầu từ điểm 7, nhảy lùi 4 bước về phía bên trái (ngược chiều mũi tên). Ta dừng lại ở <strong>điểm 3</strong>!';
    sounds.correct();
    addRewards(10, 1);
    unlockBadge(2, "Kiện Tướng Tia Số");
  } else if (mode === 'fail') {
    document.getElementById('btn-demo-fail').classList.add('active');
    // From 7 jump back 8 steps -> past 0 (-1)
    const x7 = startX + 7 * stepX;
    const xMinus1 = startX - stepX;

    const arc = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    arc.setAttribute('d', `M ${x7} ${axisY - 5} Q ${(x7 + xMinus1) / 2} ${axisY - 80} ${xMinus1} ${axisY - 5}`);
    arc.setAttribute('fill', 'none');
    arc.setAttribute('stroke', '#dc2626');
    arc.setAttribute('stroke-width', '3');
    arc.setAttribute('stroke-dasharray', '4,4');
    svg.appendChild(arc);

    const t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    t.setAttribute('x', (x7 + xMinus1) / 2);
    t.setAttribute('y', axisY - 85);
    t.setAttribute('fill', '#dc2626');
    t.setAttribute('font-weight', '800');
    t.setAttribute('text-anchor', 'middle');
    t.textContent = '⚠️ Lùi 8 bước vượt qua gốc O!';
    svg.appendChild(t);

    // X mark
    const cross = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    cross.setAttribute('x', xMinus1);
    cross.setAttribute('y', axisY + 8);
    cross.setAttribute('font-size', '24');
    cross.setAttribute('fill', '#dc2626');
    cross.setAttribute('text-anchor', 'middle');
    cross.textContent = '❌';
    svg.appendChild(cross);

    expBox.innerHTML =
      '⚠️ <strong>THỬ THÁCH 7 - 8 (Hình 1.8 SGK):</strong> Từ điểm 7, nếu lùi 8 bước thì sẽ <strong>rơi ra khỏi tia số các số tự nhiên (vượt qua mốc 0)</strong>! Do đó, trong tập hợp $\\mathbb{N}$, phép trừ $a - b$ <strong>chỉ thực hiện được khi $a \\ge b$</strong>!';
    sounds.wrong();
  }
}

// ==============================================================================
// 6. SECTION 3: ĐẤU TRƯỜNG GHÉP CẶP TRÒN TRĂM (TÍNH HỢP LÍ)
// ==============================================================================
const pairMissions = {
  1: {
    hint: "Ví dụ SGK: 66 + 289 + 134 + 311",
    numbers: [66, 289, 134, 311],
    pairs: [
      { a: 66, b: 134, sum: 200 },
      { a: 289, b: 311, sum: 600 }
    ],
    totalSum: 800,
    solutionText: "(66 + 134) + (289 + 311) = 200 + 600 = 800"
  },
  2: {
    hint: "Luyện tập 1 SGK: 117 + 68 + 23",
    numbers: [117, 68, 23],
    pairs: [
      { a: 117, b: 23, sum: 140 }
    ],
    totalSum: 208,
    solutionText: "(117 + 23) + 68 = 140 + 68 = 208"
  },
  3: {
    hint: "Bài 1.22a SGK: 285 + 470 + 115 + 230",
    numbers: [285, 470, 115, 230],
    pairs: [
      { a: 285, b: 115, sum: 400 },
      { a: 470, b: 230, sum: 700 }
    ],
    totalSum: 1100,
    solutionText: "(285 + 115) + (470 + 230) = 400 + 700 = 1 100"
  },
  4: {
    hint: "Bài 1.22b SGK: 571 + 216 + 129 + 124",
    numbers: [571, 216, 129, 124],
    pairs: [
      { a: 571, b: 129, sum: 700 },
      { a: 216, b: 124, sum: 340 }
    ],
    totalSum: 1040,
    solutionText: "(571 + 129) + (216 + 124) = 700 + 340 = 1 040"
  }
};

let currentPairMissionId = 1;
let selectedPairCards = [];
let matchedPairCount = 0;

function loadPairMission(id) {
  currentPairMissionId = id;
  selectedPairCards = [];
  matchedPairCount = 0;

  const m = pairMissions[id];
  document.getElementById('pair-mission-hint').innerHTML = `Nhiệm vụ: <strong>${m.hint}</strong>`;
  document.getElementById('pair-formula-display').innerHTML =
    '👉 Click chọn 2 số có tổng tròn chục / tròn trăm để nhóm lại!';
  document.getElementById('pair-feedback').innerHTML = '';

  const container = document.getElementById('pair-puzzle-container');
  container.innerHTML = '';

  m.numbers.forEach(num => {
    const card = document.createElement('div');
    card.className = 'puzzle-number-card';
    card.textContent = num;
    card.setAttribute('data-num', num);
    card.addEventListener('click', () => handlePairCardClick(num, card));
    container.appendChild(card);
  });
}

function handlePairCardClick(num, card) {
  if (card.classList.contains('matched') || card.classList.contains('selected')) return;

  card.classList.add('selected');
  selectedPairCards.push({ num, card });
  sounds.click();

  if (selectedPairCards.length === 2) {
    const [c1, c2] = selectedPairCards;
    const m = pairMissions[currentPairMissionId];

    // Check if this pair exists in m.pairs
    const validPair = m.pairs.find(p =>
      (p.a === c1.num && p.b === c2.num) || (p.a === c2.num && p.b === c1.num)
    );

    if (validPair) {
      c1.card.className = 'puzzle-number-card matched';
      c2.card.className = 'puzzle-number-card matched';
      matchedPairCount++;
      addRewards(20, 1);
      sounds.correct();

      document.getElementById('pair-formula-display').innerHTML =
        `🎉 <strong>GHÉP ĐÚNG!</strong> (${c1.num} + ${c2.num}) = <strong>${validPair.sum}</strong> (tròn trăm/chục)!`;

      if (matchedPairCount === m.pairs.length) {
        document.getElementById('pair-feedback').innerHTML =
          `🏆 <strong>HOÀN THÀNH TÍNH HỢP LÍ:</strong> ${m.solutionText}!`;
        document.getElementById('pair-feedback').style.color = '#059669';
        unlockBadge(3, "Bậc Thầy Tròn Trăm");
      }
    } else {
      sounds.wrong();
      resetStreak();
      document.getElementById('pair-formula-display').innerHTML =
        `⚠️ Cặp (${c1.num} + ${c2.num} = ${c1.num + c2.num}) chưa phải là cặp tròn chục/tròn trăm đẹp nhất. Hãy chọn lại!`;
      setTimeout(() => {
        c1.card.classList.remove('selected');
        c2.card.classList.remove('selected');
      }, 700);
    }
    selectedPairCards = [];
  }
}

// ==============================================================================
// 7. SECTION 4: CỖ MÁY TÌM ẨN SỐ X (BÀI 1.19 SGK)
// ==============================================================================
const solvedEquations = { a: false, b: false, c: false };

function checkEquation(eqKey, expectedVal) {
  const input = document.getElementById(`input-eq-${eqKey}`);
  const fb = document.getElementById(`feedback-eq-${eqKey}`);
  const val = parseInt(input.value.trim(), 10);

  if (val === expectedVal) {
    fb.innerHTML = `✅ <strong>CHÍNH XÁC!</strong> x = ${expectedVal}`;
    fb.style.color = '#15803d';
    solvedEquations[eqKey] = true;
    addRewards(25, 1);
    sounds.correct();

    if (solvedEquations.a && solvedEquations.b && solvedEquations.c) {
      unlockBadge(4, "Chuyên Gia Tìm x");
    }
  } else {
    sounds.wrong();
    resetStreak();
    fb.innerHTML = '❌ Chưa đúng rồi! Hãy kiểm tra lại quy tắc tính nhé.';
    fb.style.color = '#dc2626';
  }
}

// ==============================================================================
// 8. SECTION 5: DÂN SỐ VIỆT NAM & SÂN BAY (BÀI 1.20, 1.21 SGK)
// ==============================================================================
function checkPopulation() {
  const input = document.getElementById('input-population').value.replace(/\s+/g, '');
  const fb = document.getElementById('pop-feedback');

  if (input === '97338579') {
    fb.innerHTML = '🎉 <strong>ĐÚNG CHÍNH XÁC!</strong> Dân số năm 2020: 97 338 579 người!';
    fb.style.color = '#15803d';
    addRewards(30, 2);
    sounds.correct();
    launchConfetti(40);
  } else {
    sounds.wrong();
    resetStreak();
    fb.innerHTML = '⚠️ Chưa đúng! Em hãy đặt tính cộng: 96 462 106 + 876 473 nhé!';
    fb.style.color = '#dc2626';
  }
}

function checkAirport() {
  const input = document.getElementById('input-airport').value.replace(/\s+/g, '');
  const fb = document.getElementById('air-feedback');

  if (input === '12810400') {
    fb.innerHTML = '🎉 <strong>ĐÚNG CHÍNH XÁC!</strong> Nhà ga số 3 đón: 12 810 400 lượt khách!';
    fb.style.color = '#15803d';
    addRewards(30, 2);
    sounds.correct();
    launchConfetti(40);
  } else {
    sounds.wrong();
    resetStreak();
    fb.innerHTML = '⚠️ Chưa đúng! Gợi ý: Lấy 22 851 200 - (6 526 300 + 3 514 500).';
    fb.style.color = '#dc2626';
  }
}

// ==============================================================================
// 9. SECTION 6: ĐẤU TRƯỜNG 8 CÂU HỎI TRỌNG TÂM (ARENA QUIZ)
// ==============================================================================
const quizBank = [
  {
    q: "Câu 1: Cho phép cộng a + b = c. Trong đó, a và b được gọi là gì, c được gọi là gì?",
    options: [
      "a, b là số bị trừ; c là hiệu",
      "a, b là số hạng; c là tổng",
      "a, b là thừa số; c là tích",
      "a, b là số trừ; c là thương"
    ],
    correct: 1,
    explain: "SGK tr.15: Trong phép cộng a + b = c, a và b gọi là các số hạng, c gọi là tổng."
  },
  {
    q: "Câu 2: Tính chất giao hoán của phép cộng các số tự nhiên được viết là:",
    options: [
      "a + b = b + a",
      "(a + b) + c = a + (b + c)",
      "a + 0 = 0 + a = a",
      "a - b = b - a"
    ],
    correct: 0,
    explain: "SGK tr.15: Tính chất giao hoán: Khi đổi chỗ các số hạng trong một tổng thì tổng không đổi: a + b = b + a."
  },
  {
    q: "Câu 3: (Bài 1.18 SGK) Thay dấu \"?\" bằng số thích hợp trong đẳng thức: ? + 2 895 = 2 895 + 6 789",
    options: [
      "2 895",
      "6 789",
      "9 684",
      "3 894"
    ],
    correct: 1,
    explain: "Theo tính chất giao hoán a + b = b + a, ta có: 6 789 + 2 895 = 2 895 + 6 789. Vậy ? = 6 789."
  },
  {
    q: "Câu 4: Trong tập hợp các số tự nhiên ℕ, phép trừ a - b chỉ thực hiện được khi nào?",
    options: [
      "Luôn luôn thực hiện được với mọi a và b",
      "Chỉ thực hiện được nếu a < b",
      "Chỉ thực hiện được nếu a ≥ b (số bị trừ lớn hơn hoặc bằng số trừ)",
      "Chỉ thực hiện được nếu a và b cùng là số chẵn"
    ],
    correct: 2,
    explain: "SGK tr.16: Trong tập hợp ℕ, phép trừ a - b chỉ thực hiện được nếu a ≥ b."
  },
  {
    q: "Câu 5: (Bài 1.17a SGK) Kết quả của phép tính 63 548 + 19 256 là:",
    options: [
      "82 804",
      "81 704",
      "82 794",
      "83 804"
    ],
    correct: 0,
    explain: "Đặt tính cộng: 63 548 + 19 256 = 82 804."
  },
  {
    q: "Câu 6: (Bài 1.17b SGK) Kết quả của phép tính 129 107 - 34 693 là:",
    options: [
      "94 414",
      "95 514",
      "94 514",
      "93 414"
    ],
    correct: 0,
    explain: "Đặt tính trừ: 129 107 - 34 693 = 94 414."
  },
  {
    q: "Câu 7: (Vận dụng 1 SGK tr.15) Diện tích lúa vụ Thu Đông năm 2019 là 713 200 ha, giảm 14 500 ha so với năm 2018. Diện tích năm 2018 là:",
    options: [
      "698 700 ha",
      "727 700 ha",
      "728 700 ha",
      "714 650 ha"
    ],
    correct: 1,
    explain: "Vì năm 2019 giảm 14 500 ha so với năm 2018 nên diện tích năm 2018 là: 713 200 + 14 500 = 727 700 ha."
  },
  {
    q: "Câu 8: (Bài 1.22a SGK) Tính hợp lí: 285 + 470 + 115 + 230 bằng cách nhóm:",
    options: [
      "(285 + 470) + (115 + 230) = 755 + 345 = 1 100",
      "(285 + 115) + (470 + 230) = 400 + 700 = 1 100",
      "(285 + 230) + (470 + 115) = 515 + 585 = 1 100",
      "Cộng lần lượt từ trái sang phải"
    ],
    correct: 1,
    explain: "Ta nhóm các số có tổng tròn trăm: (285 + 115) + (470 + 230) = 400 + 700 = 1 100."
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

  const nextBtn = document.getElementById('btn-next-quiz');
  if (currentQuizIdx < quizBank.length - 1) {
    nextBtn.textContent = 'Câu Tiếp Theo ➡️';
  } else {
    nextBtn.textContent = '🎓 Hoàn Thành & Nhận Chứng Nhận';
    unlockBadge(5, "Đại Hiệp Phép Tính");
  }
  nextBtn.style.display = 'inline-block';
}

function handleNextQuiz() {
  if (currentQuizIdx < quizBank.length - 1) {
    currentQuizIdx++;
    loadQuizQuestion(currentQuizIdx);
  } else {
    const certEl = document.getElementById('certificate-section');
    certEl.scrollIntoView({ behavior: 'smooth' });
    sounds.fanfare();
    launchConfetti(100);
  }
}

// ==============================================================================
// 10. CERTIFICATE UPDATES & RESTART
// ==============================================================================
function updateCertificate() {
  document.getElementById('cert-student-name-display').textContent = GameState.playerName;
  document.getElementById('cert-score-display').textContent = GameState.score;
  document.getElementById('cert-stars-display').textContent = GameState.stars;

  let rank = "Học Viên Tích Cực";
  if (GameState.score >= 260) rank = "Đại Kiện Tướng Cộng Trừ 👑";
  else if (GameState.score >= 160) rank = "Kiện Tướng Tính Nhanh ⚡";
  else if (GameState.score >= 80) rank = "Chiến Binh Số Học 🔥";

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

  marketPicked.catim = false;
  marketPicked.cachua = false;
  marketPicked.raucai = false;
  document.querySelectorAll('.veggie-item').forEach(v => v.classList.remove('picked'));
  document.getElementById('basket-total').textContent = '0 đ';
  document.getElementById('basket-change').textContent = '? đ';

  renderJumpDemo('add');
  loadPairMission(1);
  initQuizArena();
  updateCertificate();

  window.scrollTo({ top: 0, behavior: 'smooth' });
  sounds.click();
}
