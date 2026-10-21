/**
 * Bài 42: Kết quả có thể và sự kiện trong trò chơi, thí nghiệm
 * Gamified Interactive Application - Sách Toán 6 KNTT
 */

// ==================== 1. SOUND SYSTEM ====================
class SoundManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.15, vol = 0.2) {
    if (!this.enabled) return;
    this.init();
    if (!this.ctx) return;

    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = type;
      osc.frequency.setValueAtTime(freq, this.ctx.currentTime);

      gain.gain.setValueAtTime(vol, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start();
      osc.stop(this.ctx.currentTime + duration);
    } catch (e) {
      console.warn("Audio error:", e);
    }
  }

  playCorrect() {
    this.playTone(523.25, 'triangle', 0.1, 0.25);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.25), 100);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.2, 0.25), 220);
  }

  playWrong() {
    this.playTone(280, 'sawtooth', 0.15, 0.2);
    setTimeout(() => this.playTone(200, 'sawtooth', 0.25, 0.25), 120);
  }

  playLevelUp() {
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.18, 0.3), i * 110);
    });
  }

  playBadge() {
    const notes = [587.33, 739.99, 880, 1174.66];
    notes.forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.2, 0.3), i * 130);
    });
  }

  playClick() {
    this.playTone(700, 'sine', 0.05, 0.1);
  }

  playRoll() {
    for (let i = 0; i < 6; i++) {
      setTimeout(() => this.playTone(300 + Math.random() * 300, 'sine', 0.05, 0.15), i * 80);
    }
  }
}

const sounds = new SoundManager();

// ==================== 2. STATE MANAGEMENT ====================
const STORAGE_KEY = 'toan6_bai42_data';

const avatars = ['🎲', '🦊', '🦁', '🐯', '🐼', '🦉', '🚀', '🤖', '🦄', '🦅'];

const defaultState = {
  avatarIndex: 0,
  xp: 0,
  streak: 0,
  stars: 1,
  badges: [false, false, false, false, false],
  arenaScore: 0,
  answeredQuestions: {},
  activeLabMode: 'dice' // 'dice', 'wheel', 'coin'
};

let state = { ...defaultState };

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      state = Object.assign({}, defaultState, JSON.parse(saved));
    }
  } catch (e) {
    console.warn("Storage load error:", e);
  }
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Storage save error:", e);
  }
}

function updateHUD() {
  document.getElementById('avatarBtn').textContent = avatars[state.avatarIndex];
  document.getElementById('xpDisplay').textContent = state.xp;
  document.getElementById('streakDisplay').textContent = `🔥 ${state.streak}`;

  let starCount = 1;
  if (state.xp >= 100) starCount = 2;
  if (state.xp >= 250) starCount = 3;
  if (state.xp >= 450) starCount = 4;
  if (state.xp >= 700 && getCorrectArenaCount() >= 8) starCount = 5;
  state.stars = starCount;

  let starsStr = '';
  for (let i = 1; i <= 5; i++) {
    starsStr += i <= starCount ? '⭐' : '☆';
  }
  document.getElementById('starRating').textContent = starsStr;

  const titles = [
    'Tập Sự May Rủi',
    'Thám Tử Biến Cố',
    'Chuyên Gia Kết Quả Có Thể',
    'Nhà Phán Quyết Sự Kiện',
    'Đại Pháp Sư Xác Suất Khai Sáng'
  ];
  document.getElementById('userTitle').textContent = titles[Math.min(starCount - 1, 4)];

  for (let i = 0; i < 5; i++) {
    const badgeEl = document.getElementById(`badge-${i + 1}`);
    if (badgeEl) {
      if (state.badges[i]) {
        badgeEl.classList.add('unlocked');
      } else {
        badgeEl.classList.remove('unlocked');
      }
    }
  }

  const answeredCount = Object.keys(state.answeredQuestions).length;
  document.getElementById('arenaProgressText').textContent = `${answeredCount}/10`;
  document.getElementById('arenaProgressBar').style.width = `${(answeredCount / 10) * 100}%`;
  document.getElementById('arenaScore').textContent = state.arenaScore;

  saveState();
}

function awardXP(points) {
  state.xp += points;
  updateHUD();
}

function checkBadge(index) {
  if (!state.badges[index]) {
    state.badges[index] = true;
    sounds.playBadge();
    saveState();
    updateHUD();
  }
}

function getCorrectArenaCount() {
  let count = 0;
  for (let k in state.answeredQuestions) {
    if (state.answeredQuestions[k].correct) count++;
  }
  return count;
}

// ==================== 3. LAB 1: EXPERIMENTS ENGINE ====================
let experimentLogs = [];

// --- Dice Logic ---
const diceRotations = {
  1: { x: 0, y: 0 },
  2: { x: 0, y: -90 },
  3: { x: -90, y: 0 },
  4: { x: 90, y: 0 },
  5: { x: 0, y: 90 },
  6: { x: 0, y: 180 }
};

let isDiceRolling = false;

function rollDice() {
  if (isDiceRolling) return;
  isDiceRolling = true;
  sounds.playRoll();

  const cube = document.getElementById('diceCube');
  const result = Math.floor(Math.random() * 6) + 1;

  // Add random spins
  const extraSpinsX = (Math.floor(Math.random() * 3) + 2) * 360;
  const extraSpinsY = (Math.floor(Math.random() * 3) + 2) * 360;
  const rot = diceRotations[result];

  cube.style.transform = `rotateX(${extraSpinsX + rot.x}deg) rotateY(${extraSpinsY + rot.y}deg)`;

  setTimeout(() => {
    isDiceRolling = false;
    processDiceResult(result);
  }, 1200);
}

function processDiceResult(num) {
  document.getElementById('currentResultText').textContent = `Mặt ${num} chấm (Xúc xắc)`;

  // Event checks
  const isPrime = [2, 3, 5].includes(num);
  const isEven = num % 2 === 0;
  const isGreaterThan4 = num > 4;
  const isNot6 = num !== 6;

  const html = `
    <div>• Sự kiện "Số chấm là số nguyên tố" ({2;3;5}): <strong style="color:${isPrime ? '#34d399' : '#ef4444'}">${isPrime ? 'XẢY RA ✅' : 'KHÔNG XẢY RA ❌'}</strong></div>
    <div>• Sự kiện "Số chấm là số chẵn" ({2;4;6}): <strong style="color:${isEven ? '#34d399' : '#ef4444'}">${isEven ? 'XẢY RA ✅' : 'KHÔNG XẢY RA ❌'}</strong></div>
    <div>• Sự kiện "Số chấm lớn hơn 4" ({5;6}): <strong style="color:${isGreaterThan4 ? '#34d399' : '#ef4444'}">${isGreaterThan4 ? 'XẢY RA ✅' : 'KHÔNG XẢY RA ❌'}</strong></div>
    <div>• Sự kiện "Số chấm không phải là 6": <strong style="color:${isNot6 ? '#34d399' : '#ef4444'}">${isNot6 ? 'XẢY RA ✅' : 'KHÔNG XẢY RA ❌'}</strong></div>
  `;
  document.getElementById('eventCheckList').innerHTML = html;

  addLog(`Gieo xúc xắc ra mặt ${num} chấm (${isPrime ? 'Nguyên tố' : 'Hợp số/1'}, ${isEven ? 'Chẵn' : 'Lẻ'})`);
  awardXP(10);
  checkBadge(0); // Badge 1: Thần xúc xắc
}

// --- Wheel Logic (Hình 9.26 SGK: 4 Cáo, 2 Gấu, 2 Nai) ---
const wheelSlices = [
  { name: 'Cáo', color: '#0284c7' }, // 0: Cáo
  { name: 'Cáo', color: '#0369a1' }, // 1: Cáo
  { name: 'Gấu', color: '#16a34a' }, // 2: Gấu
  { name: 'Nai', color: '#f59e0b' }, // 3: Nai
  { name: 'Nai', color: '#d97706' }, // 4: Nai
  { name: 'Gấu', color: '#15803d' }, // 5: Gấu
  { name: 'Cáo', color: '#0284c7' }, // 6: Cáo
  { name: 'Cáo', color: '#0369a1' }  // 7: Cáo
];

let currentWheelAngle = 0;
let isWheelSpinning = false;

function drawWheel() {
  const canvas = document.getElementById('wheelCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const size = canvas.width;
  const center = size / 2;
  const radius = center - 8;
  const numSlices = wheelSlices.length;
  const arc = (2 * Math.PI) / numSlices;

  ctx.clearRect(0, 0, size, size);

  wheelSlices.forEach((slice, i) => {
    const angle = i * arc;
    ctx.beginPath();
    ctx.fillStyle = slice.color;
    ctx.moveTo(center, center);
    ctx.arc(center, center, radius, angle, angle + arc);
    ctx.lineTo(center, center);
    ctx.fill();
    ctx.stroke();

    // Text
    ctx.save();
    ctx.translate(center, center);
    ctx.rotate(angle + arc / 2);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px "Segoe UI", sans-serif';
    ctx.fillText(slice.name, radius - 18, 5);
    ctx.restore();
  });

  // Center hub
  ctx.beginPath();
  ctx.arc(center, center, 18, 0, 2 * Math.PI);
  ctx.fillStyle = '#1e293b';
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 3;
  ctx.stroke();
}

function spinWheel() {
  if (isWheelSpinning) return;
  isWheelSpinning = true;
  sounds.playRoll();

  const canvas = document.getElementById('wheelCanvas');
  const randRounds = Math.floor(Math.random() * 5) + 5;
  const sliceIndex = Math.floor(Math.random() * wheelSlices.length);
  const arcDeg = 360 / wheelSlices.length;

  // The pointer is at top (270 deg or -90 deg). We align slice center with top pointer.
  // slice i center is at angle: (i * arcDeg + arcDeg/2)
  // Target rotation: pointer (270) - sliceAngle
  const targetDeg = (270 - (sliceIndex * arcDeg + arcDeg / 2) + 360) % 360;
  currentWheelAngle += randRounds * 360 + targetDeg - (currentWheelAngle % 360);

  canvas.style.transform = `rotate(${currentWheelAngle}deg)`;

  setTimeout(() => {
    isWheelSpinning = false;
    processWheelResult(sliceIndex);
  }, 4100);
}

function processWheelResult(idx) {
  const chosen = wheelSlices[idx].name;
  document.getElementById('currentResultText').textContent = `Mũi tên chỉ vào: Ô "${chosen}"`;

  const isFox = chosen === 'Cáo';
  const isBearOrDeer = chosen === 'Gấu' || chosen === 'Nai';
  const isNotDeer = chosen !== 'Nai';

  const html = `
    <div>• Sự kiện "Mũi tên chỉ vào ô Cáo": <strong style="color:${isFox ? '#34d399' : '#ef4444'}">${isFox ? 'XẢY RA ✅' : 'KHÔNG XẢY RA ❌'}</strong></div>
    <div>• Sự kiện "Mũi tên chỉ vào ô Gấu hoặc Nai": <strong style="color:${isBearOrDeer ? '#34d399' : '#ef4444'}">${isBearOrDeer ? 'XẢY RA ✅' : 'KHÔNG XẢY RA ❌'}</strong></div>
    <div>• Sự kiện "Mũi tên KHÔNG chỉ vào ô Nai": <strong style="color:${isNotDeer ? '#34d399' : '#ef4444'}">${isNotDeer ? 'XẢY RA ✅' : 'KHÔNG XẢY RA ❌'}</strong></div>
  `;
  document.getElementById('eventCheckList').innerHTML = html;

  addLog(`Xoay vòng quay 8 ô trúng ô "${chosen}"`);
  awardXP(10);
  checkBadge(1); // Badge 2: Vòng quay thần tốc
}

// --- Coin Flip Logic ---
function flipCoin() {
  sounds.playRoll();
  const coin = document.getElementById('coinVisual');
  const isHeads = Math.random() > 0.5; // N (Ngửa) or S (Sấp)

  coin.style.transition = 'transform 0.8s ease-out';
  coin.style.transform = 'rotateY(1080deg) scale(1.15)';

  setTimeout(() => {
    coin.textContent = isHeads ? 'N' : 'S';
    coin.style.transform = 'rotateY(0deg) scale(1)';
    const resultName = isHeads ? 'Mặt Ngửa (N)' : 'Mặt Sấp (S)';
    document.getElementById('currentResultText').textContent = `${resultName}`;

    const isNgua = isHeads;
    const isSap = !isHeads;

    const html = `
      <div>• Sự kiện "Xuất hiện mặt Ngửa (N)": <strong style="color:${isNgua ? '#34d399' : '#ef4444'}">${isNgua ? 'XẢY RA ✅' : 'KHÔNG XẢY RA ❌'}</strong></div>
      <div>• Sự kiện "Xuất hiện mặt Sấp (S)": <strong style="color:${isSap ? '#34d399' : '#ef4444'}">${isSap ? 'XẢY RA ✅' : 'KHÔNG XẢY RA ❌'}</strong></div>
    `;
    document.getElementById('eventCheckList').innerHTML = html;

    addLog(`Tung đồng xu ra ${resultName}`);
    awardXP(10);
  }, 800);
}

function addLog(text) {
  experimentLogs.unshift(text);
  if (experimentLogs.length > 20) experimentLogs.pop();

  const container = document.getElementById('logItems');
  if (!container) return;

  container.innerHTML = experimentLogs.map((item, idx) => `
    <div class="log-entry">
      <span>#${experimentLogs.length - idx}</span>
      <span>${item}</span>
    </div>
  `).join('');
}

// ==================== 4. LAB 2: MATCH AN VS BÌNH (9.27) ====================
function playMatchSGK() {
  sounds.playClick();
  const anRolls = [2, 3, 6, 4, 3];
  const binhRolls = [4, 3, 4, 5, 4];

  calculateAndDisplayMatch(anRolls, binhRolls, true);
}

function playMatchRandom() {
  sounds.playRoll();
  const anRolls = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);
  const binhRolls = Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1);

  calculateAndDisplayMatch(anRolls, binhRolls, false);
}

function calculateAndDisplayMatch(anRolls, binhRolls, isSgk) {
  // An scores (chosen number: 3)
  let anScore = 0;
  anRolls.forEach(r => {
    if (r === 3) anScore += 10;
    else anScore -= 5;
  });

  // Binh scores (chosen number: 4)
  let binhScore = 0;
  binhRolls.forEach(r => {
    if (r === 4) binhScore += 10;
    else binhScore -= 5;
  });

  document.getElementById('anRolls').textContent = anRolls.join(' , ');
  document.getElementById('anScore').textContent = anScore;

  document.getElementById('binhRolls').textContent = binhRolls.join(' , ');
  document.getElementById('binhScore').textContent = binhScore;

  const alertBox = document.getElementById('matchWinnerAlert');
  if (binhScore > anScore) {
    alertBox.textContent = `🏆 KẾT QUẢ: BẠN BÌNH THẮNG (+${binhScore} điểm so với An ${anScore} điểm)!`;
    alertBox.style.color = '#38bdf8';
  } else if (anScore > binhScore) {
    alertBox.textContent = `🏆 KẾT QUẢ: BẠN AN THẮNG (+${anScore} điểm so với Bình ${binhScore} điểm)!`;
    alertBox.style.color = '#fbbf24';
  } else {
    alertBox.textContent = `🤝 KẾT QUẢ: HAI BẠN HÒA NHAU (${anScore} đều)!`;
    alertBox.style.color = '#a78bfa';
  }

  awardXP(20);
  checkBadge(2); // Badge 3: Phán quyết công bằng
}

// ==================== 5. SGK ARENA (10 COMPREHENSIVE QUESTIONS) ====================
const quizQuestions = [
  {
    badge: 'Khái niệm SGK (Trang 89)',
    text: 'Đặc điểm then chốt nhất của kết quả trong các trò chơi, thí nghiệm ngẫu nhiên là gì?',
    options: [
      'Ta luôn luôn tính toán và biết chắc chắn trước kết quả sẽ xảy ra.',
      'Ta không thể biết trước chắc chắn kết quả nào sẽ xảy ra.',
      'Mọi kết quả đều phải có giá trị là số nguyên tố.',
      'Chỉ có đúng một kết quả duy nhất có thể xảy ra trong mọi lần thử.'
    ],
    correct: 1,
    explanation: 'SGK trang 89 khẳng định: Khi thực hiện trò chơi hoặc thí nghiệm (như gieo xúc xắc, quay số, tung đồng xu), ta không thể biết trước chắc chắn kết quả nào sẽ xảy ra.'
  },
  {
    badge: 'Tranh luận Vuông & Tròn (Trang 91)',
    text: 'Bạn Vuông gieo xúc xắc 7 lần và thu được các mặt: 1; 4; 5; 1; 1; 3; 5. Vuông nói: "Tập tất cả các kết quả có thể của thí nghiệm gieo xúc xắc là S = {1; 3; 4; 5}". Em có đồng ý với Vuông không?',
    options: [
      'Đồng ý với Vuông vì chỉ có các mặt đó xuất hiện trong 7 lần gieo.',
      'Không đồng ý, vì tập tất cả các kết quả có thể của thí nghiệm gieo con xúc xắc luôn là S = {1; 2; 3; 4; 5; 6}.',
      'Đồng ý, nhưng phải bổ sung thêm số 0 vào tập hợp S.',
      'Không đồng ý, vì xúc xắc chỉ có thể ra các mặt chẵn.'
    ],
    correct: 1,
    explanation: 'Vuông nhầm lẫn giữa "kết quả thực tế của 7 lần gieo" với "tất cả các kết quả có thể của thí nghiệm". Con xúc xắc 6 mặt luôn có 6 kết quả có thể là các mặt 1, 2, 3, 4, 5, 6 chấm, bất kể các lần gieo cụ thể ra mặt nào!'
  },
  {
    badge: 'Bài tập 9.25a (Trang 93)',
    text: 'Gieo một con xúc xắc. Hãy liệt kê các kết quả có thể để sự kiện "Số chấm xuất hiện là số nguyên tố" xảy ra:',
    options: [
      'Mặt 1, 2, 3 chấm',
      'Mặt 2, 3, 5 chấm',
      'Mặt 3, 5, 7 chấm',
      'Mặt 2, 4, 6 chấm'
    ],
    correct: 1,
    explanation: 'Trong các số từ 1 đến 6 trên mặt xúc xắc, chỉ có 2, 3, 5 là các số nguyên tố. Do đó sự kiện xảy ra khi và chỉ khi xúc xắc xuất hiện mặt 2, 3 hoặc 5 chấm.'
  },
  {
    badge: 'Bài tập 9.25b (Trang 93)',
    text: 'Gieo một con xúc xắc. Nếu số chấm xuất hiện là 5 thì sự kiện "Số chấm xuất hiện không phải là 6" có xảy ra hay không?',
    options: [
      'Có xảy ra (vì số chấm xuất hiện là 5 thỏa mãn điều kiện khác 6).',
      'Không xảy ra (vì số 5 là số lẻ).',
      'Chỉ xảy ra khi gieo lại lần thứ hai.',
      'Không thể xác định được.'
    ],
    correct: 0,
    explanation: 'Vì 5 khác 6, nên phát biểu "số chấm xuất hiện không phải là 6" là đúng. Do đó sự kiện này CÓ XẢY RA.'
  },
  {
    badge: 'Bài tập 9.26a (Trang 93)',
    text: 'Vòng quay ở Hình 9.26 gồm 8 ô: 4 ô Cáo, 2 ô Gấu, 2 ô Nai. Liệt kê TẤT CẢ các kết quả có thể của thí nghiệm quay tấm bìa:',
    options: [
      'Mũi tên chỉ vào ô Cáo; Mũi tên chỉ vào ô Gấu; Mũi tên chỉ vào ô Nai.',
      'Chỉ có 1 kết quả duy nhất là ô Cáo vì Cáo chiếm nhiều ô nhất.',
      'Mũi tên chỉ vào ô Hổ, Báo, Sư tử.',
      'Không có kết quả nào xảy ra vì vòng quay chuyển động liên tục.'
    ],
    correct: 0,
    explanation: 'Dù số lượng ô Cáo nhiều hơn, nhưng mũi tên chỉ có thể dừng lại ở một trong 3 loại hình con vật: Cáo, Gấu hoặc Nai. Đó chính là 3 kết quả có thể của thí nghiệm.'
  },
  {
    badge: 'Bài tập 9.26b (Trang 93)',
    text: 'Trong vòng quay Hình 9.26, hãy liệt kê các kết quả có thể để sự kiện "Mũi tên KHÔNG chỉ vào ô Nai" xảy ra:',
    options: [
      'Mũi tên chỉ vào ô Nai',
      'Mũi tên chỉ vào ô Cáo hoặc Mũi tên chỉ vào ô Gấu',
      'Mũi tên chỉ vào vách ngăn',
      'Không có kết quả nào thỏa mãn'
    ],
    correct: 1,
    explanation: 'Để mũi tên không chỉ vào ô Nai thì mũi tên phải chỉ vào các ô con vật còn lại, tức là chỉ vào ô Cáo hoặc ô Gấu.'
  },
  {
    badge: 'Bài tập 9.26c (Trang 93)',
    text: 'Nếu mũi tên chỉ vào ô Nai như Hình 9.26 thì sự kiện "Mũi tên chỉ vào ô Gấu hoặc Nai" có xảy ra không?',
    options: [
      'Có xảy ra (vì kết quả là ô Nai, thuộc tập hợp {Gấu, Nai}).',
      'Không xảy ra (vì mũi tên không chỉ vào ô Gấu).',
      'Chỉ xảy ra nếu mũi tên chỉ vào cả hai ô cùng lúc.',
      'Không thể kết luận.'
    ],
    correct: 0,
    explanation: 'Từ "hoặc" có nghĩa là chỉ cần rơi vào ít nhất một trong hai con vật (Gấu hoặc Nai). Vì mũi tên rơi vào ô Nai nên sự kiện đã CÓ XẢY RA.'
  },
  {
    badge: 'Bài tập 9.27 (Trang 93)',
    text: 'An chọn số 3, Bình chọn số 4. Mỗi bạn gieo 5 lần. Ra số chọn: +10 điểm; số khác: -5 điểm. An gieo: 2; 3; 6; 4; 3. Bình gieo: 4; 3; 4; 5; 4. Ai là người thắng cuộc?',
    options: [
      'An thắng với 20 điểm.',
      'Bình thắng (Bình được 20 điểm, An được 5 điểm).',
      'Hai bạn hòa nhau với 15 điểm.',
      'An thắng vì Bình bị trừ điểm nhiều hơn.'
    ],
    correct: 1,
    explanation: 'Điểm của An: 2 lần trúng 3 (+20 điểm), 3 lần trượt (-15 điểm) => Tổng: 20 - 15 = 5 điểm. Điểm của Bình: 3 lần trúng 4 (+30 điểm), 2 lần trượt (-10 điểm) => Tổng: 30 - 10 = 20 điểm. Vậy Bình là người chiến thắng!'
  },
  {
    badge: 'Thử thách nhỏ (Trang 92)',
    text: 'Minh và Khoa mỗi bạn lấy 10 lần từ hộp (5 bi xanh, 3 bi đỏ, 2 bi vàng). Người nào lấy được nhiều bi đỏ hơn là thắng. Kết quả: Minh lấy được 2 lần bi đỏ, Khoa lấy được 2 lần bi đỏ. Sự kiện "Minh thắng" có xảy ra không?',
    options: [
      'Có xảy ra vì Minh rút trước.',
      'Không xảy ra, vì cả hai bạn đều rút được 2 lần bi đỏ nên kết quả là hòa nhau.',
      'Có xảy ra vì Khoa rút nhiều bi xanh hơn.',
      'Cả hai cùng thắng cuộc.'
    ],
    correct: 1,
    explanation: 'Điều kiện để sự kiện "Minh thắng" xảy ra là số bi đỏ của Minh phải LỚN HƠN của Khoa. Vì số bi đỏ của cả hai bằng nhau (2 = 2, hòa), nên sự kiện "Minh thắng" KHÔNG XẢY RA.'
  },
  {
    badge: 'Lịch sử Xác suất (Trang 93)',
    text: 'Cuốn sách đầu tiên viết về Lý thuyết Xác suất được xuất bản năm 1657 bởi nhà toán học nào, bắt nguồn từ trao đổi giữa Blaise Pascal và Pierre de Fermat?',
    options: [
      'Isaac Newton',
      'Christiaan Huygens',
      'René Descartes',
      'Leonhard Euler'
    ],
    correct: 1,
    explanation: 'Mục "Em có biết?" (SGK trang 93) ghi rõ: Dựa trên các trao đổi giữa Pascal và Fermat, năm 1657 nhà bác học Hà Lan Christiaan Huygens đã viết cuốn sách đầu tiên về chủ đề này, khai sinh ra Lý thuyết Xác suất.'
  }
];

function buildQuizUI() {
  const container = document.getElementById('quizContainer');
  if (!container) return;

  container.innerHTML = '';

  quizQuestions.forEach((q, idx) => {
    const qBox = document.createElement('div');
    qBox.className = 'question-box';
    qBox.id = `qbox-${idx}`;

    const answered = state.answeredQuestions[idx];

    let optHtml = '';
    const letters = ['A', 'B', 'C', 'D'];
    q.options.forEach((opt, oIdx) => {
      let extraClass = '';
      if (answered) {
        if (oIdx === q.correct) extraClass = 'correct';
        else if (oIdx === answered.chosen && !answered.correct) extraClass = 'wrong';
      }

      optHtml += `
        <button class="opt-btn ${extraClass}" data-q="${idx}" data-opt="${oIdx}" ${answered ? 'disabled' : ''}>
          <span class="opt-letter">${letters[oIdx]}</span>
          <span>${opt}</span>
        </button>
      `;
    });

    const isExpShown = answered ? 'show' : '';

    qBox.innerHTML = `
      <span class="q-badge">${q.badge}</span>
      <div class="q-text"><strong>Câu ${idx + 1}:</strong> ${q.text}</div>
      <div class="q-options">${optHtml}</div>
      <div class="explanation-card ${isExpShown}" id="exp-${idx}">
        <div class="exp-title">💡 Lời Giải Chi Tiết SGK:</div>
        <div class="exp-desc">${q.explanation}</div>
      </div>
    `;

    container.appendChild(qBox);
  });

  container.querySelectorAll('.opt-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const qIdx = parseInt(btn.dataset.q);
      const optIdx = parseInt(btn.dataset.opt);
      handleAnswer(qIdx, optIdx);
    });
  });
}

function handleAnswer(qIdx, optIdx) {
  if (state.answeredQuestions[qIdx]) return;

  sounds.init();
  const q = quizQuestions[qIdx];
  const isCorrect = (optIdx === q.correct);

  state.answeredQuestions[qIdx] = {
    chosen: optIdx,
    correct: isCorrect
  };

  if (isCorrect) {
    sounds.playCorrect();
    state.streak++;
    state.arenaScore += 10;
    awardXP(25 + state.streak * 5);
  } else {
    sounds.playWrong();
    state.streak = 0;
    awardXP(5);
  }

  // Badges logic
  if (qIdx === 1 && isCorrect) checkBadge(0); // Badge 1: Thần xúc xắc
  if ((qIdx === 4 || qIdx === 5 || qIdx === 6) && isCorrect) checkBadge(1); // Badge 2: Vòng quay thần tốc
  if (qIdx === 7 && isCorrect) checkBadge(2); // Badge 3: Phán quyết công bằng
  if (qIdx === 8 && isCorrect) checkBadge(3); // Badge 4: Quan sát tần số

  if (getCorrectArenaCount() === 10) {
    checkBadge(4); // Badge 5: Đại pháp sư
    sounds.playLevelUp();
  }

  buildQuizUI();
  updateHUD();
}

// ==================== 6. EVENT LISTENERS ====================
function setupListeners() {
  // Tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      sounds.playClick();
      document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const target = document.getElementById(`tab-${tab.dataset.tab}`);
      if (target) target.classList.add('active');

      if (tab.dataset.tab === 'labs') {
        drawWheel();
      }
    });
  });

  // Avatar button
  document.getElementById('avatarBtn').addEventListener('click', () => {
    sounds.playClick();
    state.avatarIndex = (state.avatarIndex + 1) % avatars.length;
    updateHUD();
  });

  // Sound toggle
  const soundBtn = document.getElementById('soundToggle');
  soundBtn.addEventListener('click', () => {
    sounds.enabled = !sounds.enabled;
    soundBtn.textContent = sounds.enabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
    if (sounds.enabled) sounds.playClick();
  });

  // Reset Progress
  document.getElementById('resetProgress').addEventListener('click', () => {
    if (confirm('Bạn có chắc muốn đặt lại toàn bộ điểm và bài tập Đấu trường Bài 42 không?')) {
      state = { ...defaultState };
      experimentLogs = [];
      saveState();
      updateHUD();
      buildQuizUI();
      sounds.playClick();
      document.getElementById('currentResultText').textContent = 'Chưa thực hiện';
      document.getElementById('eventCheckList').innerHTML = '<div>- Gieo thử để kiểm tra sự kiện!</div>';
      document.getElementById('logItems').innerHTML = 'Chưa có lượt thử nào.';
    }
  });

  // Lab 1 Mode Switchers
  const diceWrapper = document.getElementById('diceWrapper');
  const wheelWrapper = document.getElementById('wheelWrapper');
  const coinWrapper = document.getElementById('coinWrapper');

  const modeDiceBtn = document.getElementById('modeDiceBtn');
  const modeWheelBtn = document.getElementById('modeWheelBtn');
  const modeCoinBtn = document.getElementById('modeCoinBtn');

  function setLabMode(mode) {
    sounds.playClick();
    state.activeLabMode = mode;

    modeDiceBtn.style.background = mode === 'dice' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.08)';
    modeDiceBtn.style.color = mode === 'dice' ? '#fff' : 'var(--text-main)';

    modeWheelBtn.style.background = mode === 'wheel' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.08)';
    modeWheelBtn.style.color = mode === 'wheel' ? '#fff' : 'var(--text-main)';

    modeCoinBtn.style.background = mode === 'coin' ? 'var(--accent-purple)' : 'rgba(255,255,255,0.08)';
    modeCoinBtn.style.color = mode === 'coin' ? '#fff' : 'var(--text-main)';

    diceWrapper.style.display = mode === 'dice' ? 'block' : 'none';
    wheelWrapper.style.display = mode === 'wheel' ? 'block' : 'none';
    coinWrapper.style.display = mode === 'coin' ? 'block' : 'none';

    if (mode === 'wheel') {
      setTimeout(drawWheel, 50);
    }
  }

  modeDiceBtn.addEventListener('click', () => setLabMode('dice'));
  modeWheelBtn.addEventListener('click', () => setLabMode('wheel'));
  modeCoinBtn.addEventListener('click', () => setLabMode('coin'));

  // Experiment buttons
  document.getElementById('rollDiceBtn').addEventListener('click', rollDice);
  document.getElementById('spinWheelBtn').addEventListener('click', spinWheel);
  document.getElementById('flipCoinBtn').addEventListener('click', flipCoin);

  // Lab 2 Match buttons
  document.getElementById('runMatchSgkBtn').addEventListener('click', playMatchSGK);
  document.getElementById('runRandomMatchBtn').addEventListener('click', playMatchRandom);

  // Certificate Unlock
  const certBtn = document.getElementById('unlockCertBtn');
  const certPaper = document.getElementById('certificatePaper');
  certBtn.addEventListener('click', () => {
    sounds.playClick();
    const correctCount = getCorrectArenaCount();
    if (correctCount < 7) {
      alert(`Bạn cần đạt ít nhất 7/10 câu hỏi Đấu trường SGK để mở khóa Giấy Chứng Nhận! (Hiện tại: ${correctCount}/10)`);
      return;
    }

    certPaper.classList.add('show');
    const today = new Date();
    document.getElementById('certDate').textContent = `Ngày cấp: ${today.toLocaleDateString('vi-VN')}`;
    sounds.playLevelUp();
    certPaper.scrollIntoView({ behavior: 'smooth' });
  });
}

// ==================== 7. INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
  loadState();
  updateHUD();
  buildQuizUI();
  setupListeners();

  setTimeout(() => {
    drawWheel();
  }, 100);
});
