/* =========================================================
   BÀI 24: SO SÁNH PHÂN SỐ. HỖN SỐ DƯƠNG - APP.JS
   Gamification Engine, Sound Synthesizer & Comparison Labs
   ========================================================= */

// --- ÂM THANH WEB AUDIO SYNTHESIZER ---
class SoundSystem {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioCtx();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playCorrect() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(523.25, now);       // C5
    osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
    osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
    osc.frequency.setValueAtTime(1046.50, now + 0.3); // C6

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.6);
  }

  playWrong() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.setValueAtTime(200, now + 0.15);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.35);
  }

  playBadge() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const freqs = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      gain.gain.setValueAtTime(0.18, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.4);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.4);
    });
  }

  playClick() {
    if (this.muted) return;
    this.init();
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.08);
  }
}

const sound = new SoundSystem();

// --- STATE MANAGEMENT ---
const gameState = {
  studentName: 'Bậc Thầy So Sánh Lớp 6',
  avatar: '⚖️',
  score: 0,
  stars: 0,
  streak: 0,
  answeredQuestions: new Set(),
  unlockedBadges: new Set()
};

// --- DANH SÁCH 10 CÂU HỎI ĐẤU TRƯỜNG SGK (BÀI 6.8 – 6.13) ---
const quizData = [
  {
    id: 1,
    title: 'Bài 6.8a: Quy Đồng Mẫu Hai Phân Số',
    question: 'Quy đồng mẫu hai phân số 2/3 và (-6)/7 với mẫu số chung nhỏ nhất bằng 21 ta được cặp phân số:',
    options: [
      { text: '14/21 và (-18)/21', correct: true },
      { text: '2/21 và (-6)/21', correct: false },
      { text: '14/21 và 18/21', correct: false },
      { text: '7/21 và (-9)/21', correct: false }
    ],
    hint: '2/3 = (2 · 7) / (3 · 7) = 14/21 ; (-6)/7 = [(-6) · 3] / (7 · 3) = (-18)/21.',
    explanation: 'Mẫu số chung là BCNN(3, 7) = 21. Thừa số phụ của 3 là 7, của 7 là 3. Nhân cả tử và mẫu ta được 14/21 và (-18)/21.'
  },
  {
    id: 2,
    title: 'Bài 6.8b: Quy Đồng Mẫu Dưới Dạng Thừa Số Nguyên Tố',
    question: 'Quy đồng mẫu hai phân số 5/(2² · 3²) và (-7)/(2² · 3) với mẫu số chung 36 ta được:',
    options: [
      { text: '5/36 và (-21)/36', correct: true },
      { text: '5/36 và (-7)/36', correct: false },
      { text: '15/36 và (-21)/36', correct: false },
      { text: '5/36 và 21/36', correct: false }
    ],
    hint: 'Mẫu 1 là 4 · 9 = 36. Mẫu 2 là 4 · 3 = 12. Thừa số phụ của mẫu 2 là 36 : 12 = 3.',
    explanation: 'Mẫu số chung là 2² · 3² = 36. Phân số thứ nhất giữ nguyên 5/36. Phân số thứ hai nhân cả tử và mẫu với 3: (-7 · 3) / (12 · 3) = -21/36.'
  },
  {
    id: 3,
    title: 'Bài 6.9a: So Sánh Phân Số Âm Với Phân Số Dương',
    question: 'Khi so sánh hai phân số (-11)/8 và 1/24, khẳng định nào sau đây là ĐÚNG?',
    options: [
      { text: '(-11)/8 < 1/24 (vì phân số âm nhỏ hơn phân số dương)', correct: true },
      { text: '(-11)/8 > 1/24', correct: false },
      { text: '(-11)/8 = 1/24', correct: false },
      { text: 'Không so sánh được vì mẫu khác nhau', correct: false }
    ],
    hint: '(-11)/8 < 0 mà 0 < 1/24.',
    explanation: 'Vì (-11)/8 < 0 và 1/24 > 0 nên (-11)/8 < 1/24. Phân số âm luôn nhỏ hơn phân số dương.'
  },
  {
    id: 4,
    title: 'Bài 6.9b: So Sánh Sau Khi Rút Gọn',
    question: 'So sánh hai phân số 3/20 và 6/15:',
    options: [
      { text: '3/20 < 6/15', correct: true },
      { text: '3/20 > 6/15', correct: false },
      { text: '3/20 = 6/15', correct: false },
      { text: '3/20 ≥ 6/15', correct: false }
    ],
    hint: 'Rút gọn 6/15 = 2/5 = 8/20. So sánh 3/20 với 8/20.',
    explanation: 'Ta có 6/15 = 2/5 = 8/20. Vì 3 < 8 nên 3/20 < 8/20 hay 3/20 < 6/15.'
  },
  {
    id: 5,
    title: 'Bài 6.10: Môn Thể Thao Được Yêu Thích Nhất',
    question: 'Lớp 6A có 4/5 số HS thích bóng bàn, 7/10 thích bóng đá và 1/2 thích bóng chuyền. Môn thể thao nào được yêu thích nhất?',
    options: [
      { text: 'Bóng bàn', correct: true },
      { text: 'Bóng đá', correct: false },
      { text: 'Bóng chuyền', correct: false },
      { text: 'Cả 3 môn bằng nhau', correct: false }
    ],
    hint: 'Quy đồng mẫu số chung là 10: 4/5 = 8/10 ; 7/10 ; 1/2 = 5/10.',
    explanation: 'Quy đồng mẫu 10: 4/5 = 8/10; 1/2 = 5/10. Vì 8/10 > 7/10 > 5/10 nên số học sinh thích bóng bàn là nhiều nhất.'
  },
  {
    id: 6,
    title: 'Bài 6.11a: So Sánh Khối Lượng',
    question: 'Khối lượng nào lớn hơn giữa 5/3 kg và 15/11 kg?',
    options: [
      { text: '5/3 kg', correct: true },
      { text: '15/11 kg', correct: false },
      { text: 'Bằng nhau', correct: false },
      { text: 'Không so sánh được', correct: false }
    ],
    hint: 'Quy đồng mẫu 33: 5/3 = 55/33 ; 15/11 = 45/33.',
    explanation: 'Ta có 5/3 = 55/33 và 15/11 = 45/33. Vì 55 > 45 nên 5/3 kg lớn hơn 15/11 kg.'
  },
  {
    id: 7,
    title: 'Bài 6.11b: Vận Tốc Nhỏ Hơn',
    question: 'Vận tốc nào nhỏ hơn trong hai vận tốc: 5/6 km/h hay 4/5 km/h?',
    options: [
      { text: '4/5 km/h', correct: true },
      { text: '5/6 km/h', correct: false },
      { text: 'Hai vận tốc bằng nhau', correct: false },
      { text: 'Không xác định', correct: false }
    ],
    hint: 'Quy đồng mẫu 30: 5/6 = 25/30 ; 4/5 = 24/30.',
    explanation: 'Ta có 5/6 = 25/30 km/h và 4/5 = 24/30 km/h. Vì 24 < 25 nên vận tốc 4/5 km/h nhỏ hơn.'
  },
  {
    id: 8,
    title: 'Bài 6.12: Sắp Xếp Động Vật Nhỏ Nhất Thế Giới',
    question: 'Chiều dài (feet) của các loài động vật: Chuột chũi 5/12, Dơi Kitti 83/100, Chuột túi có gai 1/4, Sóc chuột 1/3. Sắp xếp từ lớn đến bé:',
    options: [
      { text: 'Dơi Kitti > Chuột chũi > Sóc chuột > Chuột túi', correct: true },
      { text: 'Chuột chũi > Dơi Kitti > Sóc chuột > Chuột túi', correct: false },
      { text: 'Dơi Kitti > Sóc chuột > Chuột chũi > Chuột túi', correct: false },
      { text: 'Chuột túi > Sóc chuột > Chuột chũi > Dơi Kitti', correct: false }
    ],
    hint: 'Quy đồng mẫu số chung 300: Dơi Kitti = 249/300; Chuột chũi = 125/300; Sóc chuột = 100/300; Chuột túi = 75/300.',
    explanation: 'Quy đồng mẫu 300: 83/100 = 249/300; 5/12 = 125/300; 1/3 = 100/300; 1/4 = 75/300. Thứ tự từ lớn đến bé là: Dơi Kitti > Chuột chũi > Sóc chuột > Chuột túi.'
  },
  {
    id: 9,
    title: 'Bài 6.13: Chia Táo & Biểu Diễn Hỗn Số',
    question: 'Mẹ có 15 quả táo chia đều cho 4 anh em. Hỏi mỗi người nhận được mấy quả táo và mấy phần của quả táo?',
    options: [
      { text: '3 quả táo và 3/4 quả táo (tức 3 ¾ quả)', correct: true },
      { text: '3 quả táo và 1/4 quả táo', correct: false },
      { text: '4 quả táo và 1/4 quả táo', correct: false },
      { text: '3 quả táo và 1/2 quả táo', correct: false }
    ],
    hint: '15 chia cho 4 được thương là 3, số dư là 3 ⇒ 15/4 = 3 + 3/4 = 3 ¾.',
    explanation: 'Ta có 15 : 4 = 3 (dư 3). Do đó 15/4 = 3 + 3/4 = 3 ¾ quả táo. Mỗi người được 3 quả táo và 3/4 quả táo.'
  },
  {
    id: 10,
    title: 'Luyện Tập 4: Chuyển Hỗn Số Sang Phân Số',
    question: 'Viết hỗn số 5 ⅔ dưới dạng phân số ta được kết quả là:',
    options: [
      { text: '17/3', correct: true },
      { text: '13/3', correct: false },
      { text: '10/3', correct: false },
      { text: '31/3', correct: false }
    ],
    hint: 'Lấy phần nguyên nhân mẫu cộng tử: (5 · 3 + 2) / 3.',
    explanation: 'Ta có: 5 ⅔ = (5 · 3 + 2) / 3 = (15 + 2) / 3 = 17/3.'
  }
];

// --- RENDER GIAO DIỆN CÂU HỎI ĐẤU TRƯỜNG ---
function renderQuiz() {
  const quizList = document.getElementById('quiz-list');
  if (!quizList) return;
  quizList.innerHTML = '';

  quizData.forEach((q, index) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `quiz-card-${q.id}`;

    const titleEl = document.createElement('div');
    titleEl.className = 'quiz-num';
    titleEl.innerHTML = `Câu ${index + 1}: ${q.title}`;

    const qText = document.createElement('div');
    qText.className = 'quiz-question';
    qText.innerHTML = q.question;

    const optGrid = document.createElement('div');
    optGrid.className = 'quiz-options';

    q.options.forEach((opt) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = opt.text;
      btn.onclick = () => handleAnswer(q.id, opt, btn, card);
      optGrid.appendChild(btn);
    });

    const expBox = document.createElement('div');
    expBox.className = 'quiz-explanation';
    expBox.id = `exp-${q.id}`;
    expBox.innerHTML = `<strong>💡 Lời giải chi tiết:</strong> ${q.explanation}`;

    card.appendChild(titleEl);
    card.appendChild(qText);
    card.appendChild(optGrid);
    card.appendChild(expBox);

    quizList.appendChild(card);
  });
}

// --- XỬ LÝ TRẢ LỜI CÂU HỎI ---
function handleAnswer(qId, selectedOpt, btnEl, cardEl) {
  if (gameState.answeredQuestions.has(qId)) return;

  const optButtons = cardEl.querySelectorAll('.quiz-opt-btn');
  optButtons.forEach(b => b.disabled = true);

  if (selectedOpt.correct) {
    sound.playCorrect();
    btnEl.classList.add('correct');
    gameState.score += 100;
    gameState.stars += 1;
    gameState.streak += 1;
    gameState.answeredQuestions.add(qId);

    // Khen thưởng chuyên gia động vật học & hỗn số
    if (qId === 8) unlockBadge('badge-3');
    if (qId === 9 || qId === 10) unlockBadge('badge-2');

    // Combo streak
    if (gameState.streak >= 3) {
      unlockBadge('badge-4');
    }
  } else {
    sound.playWrong();
    btnEl.classList.add('wrong');
    gameState.streak = 0;
    optButtons.forEach(b => {
      const q = quizData.find(item => item.id === qId);
      const correctOpt = q.options.find(o => o.correct);
      if (b.innerHTML === correctOpt.text) {
        b.classList.add('correct');
      }
    });
  }

  // Hiển thị lời giải
  const expBox = document.getElementById(`exp-${qId}`);
  if (expBox) expBox.style.display = 'block';

  // Kiểm tra hoàn thành 10 câu
  if (gameState.stars === 10) {
    unlockBadge('badge-5');
  }

  updateHUD();
}

// --- MỞ KHÓA HUY HIỆU ---
function unlockBadge(badgeId) {
  if (gameState.unlockedBadges.has(badgeId)) return;
  gameState.unlockedBadges.add(badgeId);
  const badgeEl = document.getElementById(badgeId);
  if (badgeEl) {
    badgeEl.classList.remove('locked');
    badgeEl.classList.add('unlocked');
    sound.playBadge();
  }
}

// --- CẬP NHẬT HUD & CERTIFICATE ---
function updateHUD() {
  document.getElementById('hud-score').textContent = gameState.score;
  document.getElementById('hud-stars').textContent = gameState.stars;
  document.getElementById('hud-streak').textContent = gameState.streak;

  let rank = 'Tập Sự So Sánh';
  if (gameState.stars >= 4 && gameState.stars < 8) rank = 'Kỹ Sư Quy Đồng Mẫu';
  else if (gameState.stars >= 8 && gameState.stars < 10) rank = 'Bậc Thầy Cân Bằng Phân Số';
  else if (gameState.stars === 10) rank = 'Đại Kiện Tướng So Sánh';

  document.getElementById('hud-rank-display').textContent = rank;

  // Cập nhật giấy chứng nhận
  document.getElementById('cert-name').textContent = gameState.studentName;
  document.getElementById('cert-score').textContent = gameState.score;
  document.getElementById('cert-stars').textContent = gameState.stars;
  document.getElementById('cert-rank').textContent = rank;

  const today = new Date();
  const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  document.getElementById('cert-date').textContent = dateStr;
}

// --- THÍ NGHIỆM 1: MÁY SO SÁNH PHÂN SỐ TỰ ĐỘNG ---
function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    let t = b;
    b = a % b;
    a = t;
  }
  return a;
}

function lcm(a, b) {
  return (Math.abs(a * b)) / gcd(a, b);
}

function runCompareLab() {
  sound.playClick();
  unlockBadge('badge-1');

  let a = parseInt(document.getElementById('frac1-a').value) || 0;
  let b = parseInt(document.getElementById('frac1-b').value) || 1;
  let c = parseInt(document.getElementById('frac2-c').value) || 0;
  let d = parseInt(document.getElementById('frac2-d').value) || 1;

  const outEl = document.getElementById('compare-lab-output');
  if (!outEl) return;

  if (b === 0 || d === 0) {
    outEl.innerHTML = `<span style="color: #ef4444; font-weight: bold;">⚠️ Mẫu số phải khác 0!</span>`;
    return;
  }

  // Đổi mẫu dương
  if (b < 0) { a = -a; b = -b; }
  if (d < 0) { c = -c; d = -d; }

  const commonM = lcm(b, d);
  const factor1 = commonM / b;
  const factor2 = commonM / d;

  const newA = a * factor1;
  const newC = c * factor2;

  let relation = '=';
  let relationWord = 'bằng nhau';
  let color = '#2563eb';
  if (newA > newC) {
    relation = '>';
    relationWord = 'lớn hơn';
    color = '#16a34a';
  } else if (newA < newC) {
    relation = '<';
    relationWord = 'nhỏ hơn';
    color = '#dc2626';
  }

  // Calculate percentage width for visual bars (clamped 0 to 100)
  const maxAbs = Math.max(Math.abs(newA), Math.abs(newC), commonM);
  const w1 = Math.min(100, Math.max(5, Math.round((Math.abs(newA) / maxAbs) * 100)));
  const w2 = Math.min(100, Math.max(5, Math.round((Math.abs(newC) / maxAbs) * 100)));

  let html = `<div style="text-align: left; line-height: 1.8;">`;
  html += `<div style="font-size: 1.15rem; color: #1e40af; font-weight: 800; margin-bottom: 8px;">
    ⚖️ Quá Trình Quy Đồng & So Sánh:
  </div>`;
  html += `<p>• <strong>Bước 1:</strong> Tìm Mẫu Số Chung Nhỏ Nhất: BCNN(${b}, ${d}) = <strong>${commonM}</strong>.</p>`;
  html += `<p>• <strong>Bước 2:</strong> Quy đồng hai phân số về mẫu chung ${commonM}:</p>`;
  html += `<p style="padding: 6px 12px; background: #f8fafc; border-radius: 6px; font-family: monospace; font-size: 1.1rem; border: 1px solid #e2e8f0;">
    Phân số 1: ${a}/${b} = (${a} · ${factor1}) / (${b} · ${factor1}) = <strong>${newA}/${commonM}</strong><br>
    Phân số 2: ${c}/${d} = (${c} · ${factor2}) / (${d} · ${factor2}) = <strong>${newC}/${commonM}</strong>
  </p>`;
  html += `<p>• <strong>Bước 3:</strong> So sánh tử số: ${newA} ${relation} ${newC}.</p>`;

  html += `<div style="margin: 14px 0;">
    <div style="font-weight: 700; font-size: 0.9rem;">Thanh độ lớn phân số 1 (${a}/${b}):</div>
    <div class="bar-track"><div class="bar-fill" style="width: ${w1}%; background: #1e40af;"></div></div>
    <div style="font-weight: 700; font-size: 0.9rem;">Thanh độ lớn phân số 2 (${c}/${d}):</div>
    <div class="bar-track"><div class="bar-fill" style="width: ${w2}%; background: #059669;"></div></div>
  </div>`;

  html += `<div style="padding: 12px; background: #eff6ff; border: 2px solid #bfdbfe; border-radius: 8px; font-size: 1.25rem; font-weight: bold; color: ${color}; text-align: center;">
    ✨ KẾT QUẢ: ${a}/${b} ${relation} ${c}/${d} (Phân số thứ nhất ${relationWord} phân số thứ hai)
  </div>`;
  html += `</div>`;

  outEl.innerHTML = html;
}

// --- THÍ NGHIỆM 2: MÁY CHUYỂN ĐỔI HỖN SỐ ---
function runMixedLab(choice) {
  sound.playClick();
  unlockBadge('badge-2');

  document.querySelectorAll('button[data-mixed]').forEach(b => b.classList.remove('active'));
  const activeBtn = document.querySelector(`button[data-mixed="${choice}"]`);
  if (activeBtn) activeBtn.classList.add('active');

  const outEl = document.getElementById('mixed-lab-output');
  if (!outEl) return;

  if (choice === '23,5') {
    outEl.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <div style="font-size: 1.15rem; color: #1e40af; font-weight: bold;">Đổi phân số 23/5 ra hỗn số dương:</div>
        <p>• <strong>Bước 1:</strong> Thực hiện phép chia có dư: $23 : 5 = 4$ (dư 3).</p>
        <p>• <strong>Bước 2:</strong> Viết thành tổng: $23/5 = 4 + 3/5$.</p>
        <p>• <strong>Bước 3:</strong> Viết gọn thành hỗn số: <strong style="color: #059669; font-size: 1.3rem;">4 ⅗</strong> (gồm phần nguyên là 4, phần phân số là ⅗).</p>
      </div>
    `;
  } else if (choice === '15,4') {
    outEl.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <div style="font-size: 1.15rem; color: #1e40af; font-weight: bold;">Bài toán chia 15 quả táo cho 4 anh em (BT 6.13):</div>
        <p>• <strong>Phép chia:</strong> 15 quả chia đều cho 4 người: $15 : 4 = 3$ (dư 3 quả).</p>
        <p>• <strong>Chia 3 quả còn lại:</strong> 3 quả chia đều 4 người, mỗi người được thêm ¾ quả.</p>
        <p>• <strong>Kết quả hỗn số:</strong> Mỗi người nhận được <strong style="color: #059669; font-size: 1.3rem;">3 ¾ quả táo</strong> (tức 3 quả nguyên vẹn và ¾ quả táo).</p>
      </div>
    `;
  } else if (choice === '24,7') {
    outEl.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <div style="font-size: 1.15rem; color: #1e40af; font-weight: bold;">Luyện tập 4a: Viết phân số 24/7 dưới dạng hỗn số:</div>
        <p>• <strong>Thực hiện phép chia:</strong> $24 : 7 = 3$ (dư 3).</p>
        <p>• <strong>Kết luận:</strong> $24/7 = $ <strong style="color: #059669; font-size: 1.3rem;">3 ³/₇</strong>.</p>
      </div>
    `;
  } else if (choice === '17,3') {
    outEl.innerHTML = `
      <div style="text-align: left; line-height: 1.8;">
        <div style="font-size: 1.15rem; color: #1e40af; font-weight: bold;">Luyện tập 4b: Viết hỗn số 5 ⅔ dưới dạng phân số:</div>
        <p>• <strong>Công thức:</strong> $A \\frac{b}{c} = \\frac{A \\cdot c + b}{c}$.</p>
        <p>• <strong>Tính toán:</strong> $5 \\frac{2}{3} = \\frac{5 \\cdot 3 + 2}{3} = \\frac{15 + 2}{3} = $ <strong style="color: #059669; font-size: 1.3rem;">17/3</strong>.</p>
      </div>
    `;
  }
}

// --- KHỞI TẠO SỰ KIỆN ---
function initEvents() {
  // Modal chọn avatar
  const avatarButtons = document.querySelectorAll('.avatar-btn');
  avatarButtons.forEach(btn => {
    btn.onclick = () => {
      sound.playClick();
      avatarButtons.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      gameState.avatar = btn.getAttribute('data-avatar');
    };
  });

  // Nút Vào Học
  const btnEnter = document.getElementById('btn-enter-game');
  if (btnEnter) {
    btnEnter.onclick = () => {
      sound.playCorrect();
      const nameInput = document.getElementById('student-name-input');
      if (nameInput && nameInput.value.trim() !== '') {
        gameState.studentName = nameInput.value.trim();
      }
      document.getElementById('hud-avatar-display').textContent = gameState.avatar;
      document.getElementById('hud-name-display').textContent = gameState.studentName;
      document.getElementById('start-modal').classList.add('hidden');
      updateHUD();
    };
  }

  // Toggle Sound
  const btnToggleSound = document.getElementById('btn-toggle-sound');
  if (btnToggleSound) {
    btnToggleSound.onclick = () => {
      sound.muted = !sound.muted;
      btnToggleSound.textContent = sound.muted ? '🔇 Âm thanh: TẮT' : '🔊 Âm thanh: BẬT';
    };
  }

  // Reset Game
  const btnReset = document.getElementById('btn-reset-game');
  if (btnReset) {
    btnReset.onclick = resetGame;
  }
  const btnReplay = document.getElementById('btn-replay-lesson');
  if (btnReplay) {
    btnReplay.onclick = resetGame;
  }

  // Nút Lab 1
  const btnComp = document.getElementById('btn-compare-fractions');
  if (btnComp) {
    btnComp.onclick = runCompareLab;
  }

  // Nút Lab 2
  document.querySelectorAll('button[data-mixed]').forEach(btn => {
    btn.onclick = () => runMixedLab(btn.getAttribute('data-mixed'));
  });
}

function resetGame() {
  sound.playClick();
  gameState.score = 0;
  gameState.stars = 0;
  gameState.streak = 0;
  gameState.answeredQuestions.clear();
  gameState.unlockedBadges.clear();

  document.querySelectorAll('.badge-card').forEach(b => {
    b.classList.remove('unlocked');
    b.classList.add('locked');
  });

  renderQuiz();
  updateHUD();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- BOOTSTRAP ---
document.addEventListener('DOMContentLoaded', () => {
  renderQuiz();
  initEvents();
  updateHUD();
  runCompareLab();
  runMixedLab('23,5');
});
