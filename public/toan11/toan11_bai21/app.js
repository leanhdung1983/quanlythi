// ================================================================
// BÀI 21: PHƯƠNG TRÌNH, BẤT PHƯƠNG TRÌNH MŨ & LÔGARIT
// Pure Vanilla JS • Web Audio API • Canvas 2D • KaTeX Offline
// ================================================================

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.enabled = true;
  }

  init() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) this.ctx = new AudioContext();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTone(freq, type = 'sine', duration = 0.1, gainVal = 0.1) {
    if (!this.enabled) return;
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
    } catch (e) {
      console.warn('Audio error:', e);
    }
  }

  playClick() { this.playTone(800, 'sine', 0.04, 0.06); }
  playCorrect() {
    this.playTone(523.25, 'triangle', 0.1, 0.1);
    setTimeout(() => this.playTone(659.25, 'triangle', 0.12, 0.1), 80);
    setTimeout(() => this.playTone(783.99, 'triangle', 0.2, 0.12), 160);
  }
  playWrong() {
    this.playTone(300, 'sawtooth', 0.12, 0.08);
    setTimeout(() => this.playTone(220, 'sawtooth', 0.2, 0.09), 90);
  }
  playFanfare() {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, idx) => {
      setTimeout(() => this.playTone(f, 'triangle', 0.25, 0.12), idx * 120);
    });
  }
}

const sound = new SoundEngine();

// App State
const appState = {
  avatar: '👑',
  userName: 'Chiến Binh Logic',
  userTitle: 'Chuyên Gia Giải Phương Trình Mũ',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// ==========================================
// QUIZ DATA: 10 CÂU CHUẨN SGK TRANG 24
// ==========================================
const quizData = [
  {
    id: 1,
    title: "Câu 1 • SGK 6.20a: Phương trình mũ cơ bản",
    pts: 20,
    question: "Giải phương trình mũ: $3^{x - 1} = 27$.",
    options: [
      { text: "$x = 4$", correct: true },
      { text: "$x = 3$", correct: false },
      { text: "$x = 10$", correct: false },
      { text: "$x = 2$", correct: false }
    ],
    explanation: "Đưa vế phải về cơ số $3$: $27 = 3^3$.<br>Phương trình trở thành $3^{x-1} = 3^3 \\iff x - 1 = 3 \\iff x = 4$."
  },
  {
    id: 2,
    title: "Câu 2 • SGK 6.20b: Phương trình mũ bậc hai",
    pts: 20,
    question: "Tìm tập nghiệm của phương trình mũ: $100^{2x^2 - 3} = 0{,}1^{2x^2 - 18}$.",
    options: [
      { text: "$S = \\{-2; 2\\}$", correct: true },
      { text: "$S = \\{2\\}$", correct: false },
      { text: "$S = \\{-4; 4\\}$", correct: false },
      { text: "$S = \\emptyset$", correct: false }
    ],
    explanation: "Đưa hai vế về cùng cơ số $10$:<br>• $100^{2x^2 - 3} = (10^2)^{2x^2 - 3} = 10^{4x^2 - 6}$.<br>• $0{,}1^{2x^2 - 18} = (10^{-1})^{2x^2 - 18} = 10^{-2x^2 + 18}$.<br>Đồng nhất số mũ: $4x^2 - 6 = -2x^2 + 18 \\iff 6x^2 = 24 \\iff x^2 = 4 \\iff x = \\pm 2$."
  },
  {
    id: 3,
    title: "Câu 3 • SGK 6.21a: Phương trình lôgarit cơ bản",
    pts: 20,
    question: "Giải phương trình lôgarit thập phân: $\\log(x + 1) = 2$.",
    options: [
      { text: "$x = 99$", correct: true },
      { text: "$x = 19$", correct: false },
      { text: "$x = 101$", correct: false },
      { text: "$x = 9$", correct: false }
    ],
    explanation: "Điều kiện: $x + 1 > 0 \\iff x > -1$.<br>Phương trình: $\\log_{10}(x + 1) = 2 \\iff x + 1 = 10^2 = 100 \\iff x = 99$ (thoả mãn điều kiện)."
  },
  {
    id: 4,
    title: "Câu 4 • SGK 6.21b: Phương trình lôgarit khác cơ số",
    pts: 20,
    question: "Tìm nghiệm của phương trình: $2\\log_4 x + \\log_2(x - 3) = 2$.",
    options: [
      { text: "$x = 4$", correct: true },
      { text: "$x = -1$", correct: false },
      { text: "$x = 4$ và $x = -1$", correct: false },
      { text: "$x = 5$", correct: false }
    ],
    explanation: "Điều kiện xác định: $\\begin{cases} x > 0 \\\\ x - 3 > 0 \\end{cases} \\iff x > 3$.<br>Biến đổi cơ số: $2\\log_4 x = 2\\log_{2^2} x = 2 \\cdot \\frac{1}{2}\\log_2 x = \\log_2 x$.<br>Phương trình trở thành: $\\log_2 x + \\log_2(x - 3) = 2 \\iff \\log_2[x(x - 3)] = 2 \\iff x(x - 3) = 2^2 = 4$.<br>$\\iff x^2 - 3x - 4 = 0 \\iff x = 4$ (nhận) hoặc $x = -1$ (loại vì $x > 3$)."
  },
  {
    id: 5,
    title: "Câu 5 • SGK 6.21c: Phương trình logarit tự nhiên",
    pts: 20,
    question: "Giải phương trình: $\\ln x + \\ln(x - 1) = \\ln 4x$.",
    options: [
      { text: "$x = 5$", correct: true },
      { text: "$x = 0$ và $x = 5$", correct: false },
      { text: "$x = 4$", correct: false },
      { text: "$x = 1$", correct: false }
    ],
    explanation: "Điều kiện: $\\begin{cases} x > 0 \\\\ x - 1 > 0 \\\\ 4x > 0 \\end{cases} \\iff x > 1$.<br>Phương trình: $\\ln[x(x - 1)] = \\ln 4x \\iff x(x - 1) = 4x \\iff x^2 - x - 4x = 0 \\iff x(x - 5) = 0$.<br>Vì $x > 1$ nên ta chỉ nhận nghiệm duy nhất $x = 5$."
  },
  {
    id: 6,
    title: "Câu 6 • SGK 6.22a: Bất phương trình mũ cơ số nhỏ hơn 1",
    pts: 20,
    question: "Giải bất phương trình: $0{,}1^x > 0{,}1^{4 - 2x}$.",
    options: [
      { text: "$x < \\frac{4}{3}$", correct: true },
      { text: "$x > \\frac{4}{3}$", correct: false },
      { text: "$x < 4$", correct: false },
      { text: "$x > 2$", correct: false }
    ],
    explanation: "Vì cơ số $0 < 0{,}1 < 1$ nên hàm số mũ nghịch biến. Khi bỏ cơ số, bắt buộc PHẢI ĐẢO CHIỀU bất đẳng thức:<br>$x < 4 - 2x \\iff 3x < 4 \\iff x < \\frac{4}{3}$."
  },
  {
    id: 7,
    title: "Câu 7 • SGK 6.22d: Bất phương trình lôgarit đổi chiều",
    pts: 20,
    question: "Tập nghiệm của bất phương trình $\\log_{0{,}5}(x + 7) \\ge \\log_{0{,}5}(2x - 1)$ là:",
    options: [
      { text: "$S = [8; +\\infty)$", correct: false },
      { text: "$S = (0{,}5; 8]$", correct: true },
      { text: "$S = (-\\infty; 8]$", correct: false },
      { text: "$S = (0{,}5; +\\infty)$", correct: false }
    ],
    explanation: "Điều kiện xác định: $\\begin{cases} x + 7 > 0 \\\\ 2x - 1 > 0 \\end{cases} \\iff x > 0{,}5$.<br>Do cơ số $0 < 0{,}5 < 1$ nên bất đẳng thức đổi chiều:<br>$x + 7 \\le 2x - 1 \\iff x \\ge 8$.<br>Ủa, chú ý: vế trái $\\ge$ vế phải đổi thành $x + 7 \\le 2x - 1 \\iff 2x - x \\ge 7 + 1 \\iff x \\ge 8$.<br>Kết hợp điều kiện $x > 0{,}5$, nghiệm là $x \\ge 8$, tức $S = [8; +\\infty)$."
  },
  {
    id: 8,
    title: "Câu 8 • SGK 6.23: Thời gian gửi tiết kiệm đạt mục tiêu",
    pts: 20,
    question: "Bác Minh gửi tiết kiệm $500$ triệu đồng với lãi suất $7{,}5\\%$/năm kì hạn 12 tháng. Hỏi sau ít nhất bao nhiêu năm thì bác Minh nhận được số tiền cả gốc và lãi không dưới $800$ triệu đồng?",
    options: [
      { text: "$7$ năm", correct: true },
      { text: "$6$ năm", correct: false },
      { text: "$8$ năm", correct: false },
      { text: "$5$ năm", correct: false }
    ],
    explanation: "Công thức số tiền thu được sau $n$ năm: $A = 500 \\cdot (1 + 0{,}075)^n = 500 \\cdot (1{,}075)^n$.<br>Yêu cầu: $500 \\cdot (1{,}075)^n \\ge 800 \\iff (1{,}075)^n \\ge 1{,}6$.<br>Lấy logarit hai vế cơ số $1{,}075 > 1$: $n \\ge \\log_{1{,}075}(1{,}6) = \\frac{\\ln 1{,}6}{\\ln 1{,}075} \\approx \\frac{0{,}47000}{0{,}07232} \\approx 6{,}499$ năm.<br>Vì kì hạn 12 tháng nên số năm gửi phải là số nguyên $\\implies n = 7$ năm."
  },
  {
    id: 9,
    title: "Câu 9 • SGK 6.24: Thời gian tăng trưởng vi khuẩn",
    pts: 20,
    question: "Số lượng vi khuẩn phát triển theo công thức $N(t) = 500e^{0{,}4t}$ ($t$ tính bằng giờ). Sau bao nhiêu giờ thì số lượng vi khuẩn vượt mức $80\\,000$ con?",
    options: [
      { text: "Khoảng $12{,}69$ giờ (hơn $12{,}7$ giờ)", correct: true },
      { text: "Khoảng $8{,}5$ giờ", correct: false },
      { text: "Khoảng $16{,}2$ giờ", correct: false },
      { text: "Khoảng $20{,}0$ giờ", correct: false }
    ],
    explanation: "Yêu cầu: $500e^{0{,}4t} > 80\\,000 \\iff e^{0{,}4t} > 160 \\iff 0{,}4t > \\ln 160 \\approx 5{,}07517 \\iff t > \\frac{5{,}07517}{0{,}4} \\approx 12{,}69$ giờ."
  },
  {
    id: 10,
    title: "Câu 10 • SGK 6.26: Nồng độ ion Hydrogen từ độ pH",
    pts: 20,
    question: "Biết độ $\\text{pH} = -\\log[H^+]$. Một dung dịch có độ $\\text{pH} = 8$. Nồng độ ion hydrogen $[H^+]$ của dung dịch này bằng bao nhiêu?",
    options: [
      { text: "$10^{-8}\\text{ mol/L}$", correct: true },
      { text: "$10^8\\text{ mol/L}$", correct: false },
      { text: "$8 \\times 10^{-7}\\text{ mol/L}$", correct: false },
      { text: "$-8\\text{ mol/L}$", correct: false }
    ],
    explanation: "Từ công thức: $\\text{pH} = -\\log[H^+] \\iff \\log_{10}[H^+] = -\\text{pH} \\iff [H^+] = 10^{-\\text{pH}}$.<br>Với $\\text{pH} = 8$, ta có $[H^+] = 10^{-8}\\text{ mol/L}$."
  }
];

// Chỉnh lại Câu 7 đúng đáp án
quizData[6].options = [
  { text: "$S = [8; +\\infty)$", correct: true },
  { text: "$S = (0{,}5; 8]$", correct: false },
  { text: "$S = (-\\infty; 8]$", correct: false },
  { text: "$S = (0{,}5; +\\infty)$", correct: false }
];
quizData[6].explanation = "Điều kiện: $2x - 1 > 0 \\iff x > 0{,}5$. Do cơ số $0 < 0{,}5 < 1$ nên bất đẳng thức đổi chiều: $x + 7 \\le 2x - 1 \\iff x \\ge 8$. Kết hợp điều kiện ta được $S = [8; +\\infty)$.";

// ==========================================
// RENDER MATH HELPER
// ==========================================
function renderMathInTree(root) {
  if (typeof renderMathInElement === 'function') {
    renderMathInElement(root, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false,
      strict: false
    });
  }
}

// ==========================================
// LAB 1: MÁY QUÉT NGHIỆM GIAO ĐIỂM
// ==========================================
function initLab1() {
  const baseSlider = document.getElementById('eqBaseSlider');
  const baseVal = document.getElementById('eqBaseVal');
  const bSlider = document.getElementById('eqBSlider');
  const bVal = document.getElementById('eqBVal');
  const typeSelect = document.getElementById('eqTypeSelect');
  const canvas = document.getElementById('eqCanvas');
  const output = document.getElementById('eqOutput');
  if (!canvas || !baseSlider || !bSlider) return;

  const ctx = canvas.getContext('2d');

  function update() {
    const a = parseFloat(baseSlider.value);
    const b = parseFloat(bSlider.value);
    const type = typeSelect.value;

    baseVal.textContent = a.toFixed(1);
    bVal.textContent = b.toFixed(1);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#070a14';
    ctx.fillRect(0, 0, w, h);

    const ox = w / 2;
    const oy = h / 2 + 30;
    const scaleX = 60;
    const scaleY = 35;

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = ox % scaleX; x < w; x += scaleX) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = oy % scaleY; y < h; y += scaleY) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(20, oy); ctx.lineTo(w - 20, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, 20); ctx.lineTo(ox, h - 20); ctx.stroke();

    // 1. Vẽ đồ thị hàm số
    let hasRoot = false;
    let rootX = 0;

    if (type === 'exp') {
      // y = a^x
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 3;
      ctx.beginPath();
      let started = false;
      for (let px = 20; px <= w - 20; px += 2) {
        const vx = (px - ox) / scaleX;
        const vy = Math.pow(a, vx);
        const py = oy - vy * scaleY;
        if (py >= 10 && py <= h - 10) {
          if (!started) { ctx.moveTo(px, py); started = true; }
          else { ctx.lineTo(px, py); }
        }
      }
      ctx.stroke();

      // Kiểm tra nghiệm a^x = b
      if (b > 0) {
        hasRoot = true;
        rootX = Math.log(b) / Math.log(a);
      }
    } else {
      // y = log_a(x)
      ctx.strokeStyle = '#c084fc';
      ctx.lineWidth = 3;
      ctx.beginPath();
      let started = false;
      for (let px = ox + 1; px <= w - 20; px += 2) {
        const vx = (px - ox) / scaleX;
        if (vx > 0) {
          const vy = Math.log(vx) / Math.log(a);
          const py = oy - vy * scaleY;
          if (py >= 10 && py <= h - 10) {
            if (!started) { ctx.moveTo(px, py); started = true; }
            else { ctx.lineTo(px, py); }
          }
        }
      }
      ctx.stroke();

      // Nghiệm log_a(x) = b luôn có với mọi b
      hasRoot = true;
      rootX = Math.pow(a, b);
    }

    // 2. Vẽ đường thẳng y = b (Đỏ cam)
    const pyB = oy - b * scaleY;
    ctx.strokeStyle = '#f43f5e';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(20, pyB);
    ctx.lineTo(w - 20, pyB);
    ctx.stroke();

    ctx.fillStyle = '#f43f5e';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`Đường thẳng y = ${b.toFixed(1)}`, w - 160, pyB - 8);

    // 3. Đánh dấu giao điểm (nếu có)
    if (hasRoot) {
      const pxRoot = ox + rootX * scaleX;
      if (pxRoot >= 20 && pxRoot <= w - 20 && pyB >= 20 && pyB <= h - 20) {
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(pxRoot, oy); ctx.lineTo(pxRoot, pyB); ctx.stroke();
        ctx.setLineDash([]);

        ctx.fillStyle = '#f59e0b';
        ctx.beginPath(); ctx.arc(pxRoot, pyB, 7, 0, Math.PI * 2); ctx.fill();

        ctx.font = 'bold 14px sans-serif';
        ctx.fillText(`Nghiệm x = ${rootX.toFixed(3)}`, pxRoot - 20, oy + 20);
      }
    }

    // Header Canvas
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    const eqTitle = type === 'exp' ? `${a.toFixed(1)}^x = ${b.toFixed(1)}` : `\\log_{${a.toFixed(1)}}(x) = ${b.toFixed(1)}`;
    ctx.fillText(`Khảo sát: ${type === 'exp' ? `${a.toFixed(1)}^x = ${b.toFixed(1)}` : `log_{${a.toFixed(1)}}(x) = ${b.toFixed(1)}`}`, 40, 35);

    output.innerHTML = `
      <div style="line-height: 1.8;">
        <div><strong>Phương trình:</strong> $${type === 'exp' ? `${a.toFixed(1)}^x = ${b.toFixed(1)}` : `\\log_{${a.toFixed(1)}}(x) = ${b.toFixed(1)}`}$</div>
        <div><strong>Trạng thái nghiệm:</strong> ${hasRoot ? `<span style="color: #10b981; font-weight: bold;">Có nghiệm duy nhất: $x = ${rootX.toFixed(4)}$</span>` : '<span style="color: #ef4444; font-weight: bold;">VÔ NGHIỆM (do vế phải $b \\le 0$, đường thẳng không cắt đồ thị hàm số mũ)</span>'}</div>
        <div style="color: #94a3b8; font-size: 13px;"><em>Nhận định hình học:</em> Số nghiệm của phương trình chính là số giao điểm của đồ thị hàm số $y = f(x)$ với đường thẳng nằm ngang $y = b$.</div>
      </div>
    `;
    renderMathInTree(output);

    unlockBadge(1);
  }

  baseSlider.addEventListener('input', () => { update(); sound.playClick(); });
  bSlider.addEventListener('input', () => { update(); sound.playClick(); });
  typeSelect.addEventListener('change', () => { update(); sound.playClick(); });

  update();
}

// ==========================================
// LAB 2: SA BÀN BẤT PHƯƠNG TRÌNH ĐỔI CHIỀU
// ==========================================
function initLab2() {
  const ineqBaseSlider = document.getElementById('ineqBaseSlider');
  const ineqBaseVal = document.getElementById('ineqBaseVal');
  const ineqBSlider = document.getElementById('ineqBSlider');
  const ineqBVal = document.getElementById('ineqBVal');
  const btnNewton = document.getElementById('btnNewtonDemo');
  const canvas = document.getElementById('ineqCanvas');
  const output = document.getElementById('ineqOutput');
  if (!canvas || !ineqBaseSlider || !ineqBSlider) return;

  const ctx = canvas.getContext('2d');

  function update() {
    const a = parseFloat(ineqBaseSlider.value);
    const b = parseFloat(ineqBSlider.value);
    const isDecreasing = a < 1;

    ineqBaseVal.textContent = a.toFixed(1);
    ineqBVal.textContent = b.toFixed(1);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#080c18';
    ctx.fillRect(0, 0, w, h);

    const ox = w / 2;
    const oy = h - 80;
    const scaleX = 80;
    const scaleY = 50;

    // Grid & Axes
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = ox % scaleX; x < w; x += scaleX) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = oy % scaleY; y < h; y += scaleY) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(20, oy); ctx.lineTo(w - 20, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, 20); ctx.lineTo(ox, h - 20); ctx.stroke();

    // Điểm giao x0 = log_a(b)
    const x0 = Math.log(b) / Math.log(a);
    const px0 = ox + x0 * scaleX;
    const pyB = oy - b * scaleY;

    // Tô miền nghiệm của bất phương trình a^x >= b
    // Nếu a > 1 (đồng biến): a^x >= b <=> x >= x0 (miền bên phải)
    // Nếu a < 1 (nghịch biến): a^x >= b <=> x <= x0 (miền bên trái)
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    if (!isDecreasing) {
      // x >= x0
      ctx.fillRect(px0, 30, w - px0 - 20, oy - 30);
    } else {
      // x <= x0
      ctx.fillRect(20, 30, px0 - 20, oy - 30);
    }

    // Vẽ đường cong y = a^x
    ctx.strokeStyle = isDecreasing ? '#ec4899' : '#38bdf8';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let started = false;
    for (let px = 20; px <= w - 20; px += 2) {
      const vx = (px - ox) / scaleX;
      const vy = Math.pow(a, vx);
      const py = oy - vy * scaleY;
      if (py >= 10 && py <= h - 10) {
        if (!started) { ctx.moveTo(px, py); started = true; }
        else { ctx.lineTo(px, py); }
      }
    }
    ctx.stroke();

    // Đường thẳng y = b
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(20, pyB); ctx.lineTo(w - 20, pyB); ctx.stroke();

    // Điểm giao
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(px0, pyB, 6, 0, Math.PI * 2); ctx.fill();

    // Gióng trục hoành
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.beginPath(); ctx.moveTo(px0, pyB); ctx.lineTo(px0, oy); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText(`x_0 = log_${a.toFixed(1)}(${b.toFixed(1)}) = ${x0.toFixed(2)}`, px0 - 40, oy + 20);

    // Chú thích miền nghiệm
    ctx.fillStyle = '#10b981';
    ctx.font = 'bold 15px sans-serif';
    if (!isDecreasing) {
      ctx.fillText(`Miền nghiệm: x ≥ ${x0.toFixed(2)} (Cùng chiều)`, px0 + 20, 70);
    } else {
      ctx.fillText(`Miền nghiệm: x ≤ ${x0.toFixed(2)} (ĐẢO CHIỀU 🔄)`, 40, 70);
    }

    output.innerHTML = `
      <div style="line-height: 1.8;">
        <div><strong>Bất phương trình đang xét:</strong> $${a.toFixed(1)}^x \\ge ${b.toFixed(1)}$</div>
        <div><strong>Tính chất cơ số:</strong> $a = ${a.toFixed(1)}$ ${isDecreasing ? '($0 < a < 1$ nghịch biến)' : '($a > 1$ đồng biến)'}</div>
        <div><strong>Tập nghiệm:</strong> <span style="color: #10b981; font-weight: bold;">${!isDecreasing ? `$S = [${x0.toFixed(3)}; +\\infty)$` : `$S = (-\\infty; ${x0.toFixed(3)}]`}</span></div>
        <div style="color: #94a3b8; font-size: 13px;"><em>Lưu ý sống còn:</em> ${isDecreasing ? 'Vì $0 < a < 1$ nên đồ thị dốc xuống, phần đường cong nằm TRÊN đường thẳng $y=b$ nằm ở phía TRÁI giao điểm $\\implies$ đảo chiều $x \\le x_0$!' : 'Vì $a > 1$ nên đồ thị đi lên, phần nằm TRÊN đường $y=b$ nằm ở phía PHẢI $\\implies x \\ge x_0$.'}</div>
      </div>
    `;
    renderMathInTree(output);

    unlockBadge(2);
  }

  ineqBaseSlider.addEventListener('input', () => { update(); sound.playClick(); });
  ineqBSlider.addEventListener('input', () => { update(); sound.playClick(); });

  if (btnNewton) {
    btnNewton.addEventListener('click', () => {
      // Newton Law of cooling demo: T(t) = 25 + 70e^(-0.5t) = 30
      // => 70e^(-0.5t) = 5 => e^(-0.5t) = 5/70 = 1/14 => -0.5t = ln(1/14) = -ln 14 => t = 2 ln 14 ≈ 5.28 phút
      alert("Định luật làm nguội Newton (SGK 6.25):\nNhiệt độ T(t) = 25 + 70·e^(-0,5t) (°C).\nĐể vật nguội còn 30°C:\n25 + 70·e^(-0,5t) = 30 ⟺ 70·e^(-0,5t) = 5\n⟺ e^(-0,5t) = 1/14 ⟺ -0,5t = -ln(14)\n⟺ t = 2·ln(14) ≈ 5,28 phút (khoảng 5 phút 17 giây)!");
      sound.playClick();
    });
  }

  update();
}

// ==========================================
// TAB 3: RENDER QUIZ & INTERACTION
// ==========================================
function renderQuiz() {
  const container = document.getElementById('quizContainer');
  if (!container) return;

  container.innerHTML = '';
  const labels = ['A', 'B', 'C', 'D'];

  quizData.forEach((q, qIndex) => {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.id = `q-${q.id}`;

    // Header
    const head = document.createElement('div');
    head.className = 'quiz-card-header';
    head.innerHTML = `
      <span>${q.title}</span>
      <span class="quiz-badge">+${q.pts} XP</span>
    `;
    card.appendChild(head);

    // Question
    const questionP = document.createElement('p');
    questionP.className = 'quiz-question';
    questionP.innerHTML = q.question;
    card.appendChild(questionP);

    // Options grid
    const optsWrap = document.createElement('div');
    optsWrap.className = 'quiz-options';

    q.options.forEach((opt, optIndex) => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt-btn';
      btn.innerHTML = `<span class="opt-label">${labels[optIndex]}.</span> <span class="opt-text">${opt.text}</span>`;

      btn.addEventListener('click', () => handleAnswer(q, opt, btn, card));
      optsWrap.appendChild(btn);
    });

    card.appendChild(optsWrap);

    // Explanation Box
    const expBox = document.createElement('div');
    expBox.className = 'explanation-box';
    expBox.innerHTML = `<strong>💡 Lời giải chi tiết:</strong> ${q.explanation}`;
    card.appendChild(expBox);

    container.appendChild(card);
  });

  renderMathInTree(container);
  updateArenaScore();
}

function handleAnswer(q, opt, selectedBtn, card) {
  if (appState.answered[q.id]) return;

  appState.answered[q.id] = { chosen: opt.text, correct: opt.correct };
  const allBtns = card.querySelectorAll('.quiz-opt-btn');
  allBtns.forEach(b => b.disabled = true);

  const expBox = card.querySelector('.explanation-box');
  if (expBox) expBox.classList.add('show');

  if (opt.correct) {
    selectedBtn.classList.add('correct');
    appState.xp += q.pts;
    appState.streak += 1;
    sound.playCorrect();
  } else {
    selectedBtn.classList.add('wrong');
    appState.streak = 0;
    sound.playWrong();
    q.options.forEach((o, idx) => {
      if (o.correct) allBtns[idx].classList.add('correct');
    });
  }

  updateHUD();
  updateArenaScore();

  const totalCorrect = Object.values(appState.answered).filter(a => a.correct).length;
  if (appState.xp >= 160) unlockBadge(3);
  if (totalCorrect === 10) {
    unlockBadge(4);
    sound.playFanfare();
  }
}

function updateArenaScore() {
  const answeredCount = Object.keys(appState.answered).length;
  const progressDisp = document.getElementById('arenaProgress');
  const scoreDisp = document.getElementById('arenaScore');
  if (progressDisp) progressDisp.textContent = `Tiến Độ: ${answeredCount}/10`;
  if (scoreDisp) scoreDisp.textContent = `Điểm Arena: ${appState.xp} XP`;
}

// ==========================================
// BADGES & CERTIFICATE
// ==========================================
function unlockBadge(index) {
  if (appState.badges[index]) return;
  appState.badges[index] = true;
  const badgeCard = document.getElementById(`badge-${index + 1}`);
  if (badgeCard) {
    badgeCard.classList.remove('locked');
    badgeCard.classList.add('unlocked');
  }
}

function updateHUD() {
  const xpDisp = document.getElementById('xpDisplay');
  const streakDisp = document.getElementById('streakDisplay');
  const starRating = document.getElementById('starRating');
  const certXP = document.getElementById('certXP');
  const certStudentName = document.getElementById('certStudentName');

  if (xpDisp) xpDisp.textContent = appState.xp;
  if (streakDisp) streakDisp.textContent = `🔥 ${appState.streak}`;

  let stars = '⭐⭐☆☆☆';
  if (appState.xp >= 200) stars = '⭐⭐⭐⭐⭐';
  else if (appState.xp >= 160) stars = '⭐⭐⭐⭐☆';
  else if (appState.xp >= 100) stars = '⭐⭐⭐☆☆';
  else if (appState.xp >= 40) stars = '⭐⭐☆☆☆';
  if (starRating) starRating.textContent = stars;

  if (certXP) certXP.textContent = `${appState.xp} XP`;
  if (certStudentName) certStudentName.textContent = appState.userName;
}

// ==========================================
// EVENT LISTENERS & INIT
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.nav-tab');
  const contents = document.querySelectorAll('.tab-content');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      sound.playClick();
      const target = tab.getAttribute('data-tab');
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));

      tab.classList.add('active');
      const targetContent = document.getElementById(`tab-${target}`);
      if (targetContent) targetContent.classList.add('active');

      if (target === 'theory') unlockBadge(0);
      if (target === 'labs') {
        setTimeout(() => {
          initLab1();
          initLab2();
        }, 50);
      }
    });
  });

  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      sound.enabled = !sound.enabled;
      soundToggle.textContent = sound.enabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      sound.playClick();
    });
  }

  const resetBtn = document.getElementById('resetProgress');
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      if (confirm('Bạn có chắc chắn muốn làm mới toàn bộ tiến trình không?')) {
        appState.xp = 0;
        appState.streak = 0;
        appState.answered = {};
        appState.badges = [false, false, false, false, false];
        for (let i = 1; i <= 5; i++) {
          const b = document.getElementById(`badge-${i}`);
          if (b) {
            b.classList.add('locked');
            b.classList.remove('unlocked');
          }
        }
        updateHUD();
        renderQuiz();
        sound.playClick();
      }
    });
  }

  const avatarBtn = document.getElementById('avatarBtn');
  const avatarModal = document.getElementById('avatarModal');
  const btnCloseModal = document.getElementById('btnCloseModal');
  const avOptions = document.querySelectorAll('.av-opt');

  if (avatarBtn && avatarModal) {
    avatarBtn.addEventListener('click', () => {
      avatarModal.style.display = 'flex';
      sound.playClick();
    });
  }
  if (btnCloseModal && avatarModal) {
    btnCloseModal.addEventListener('click', () => {
      avatarModal.style.display = 'none';
      sound.playClick();
    });
  }
  avOptions.forEach(btn => {
    btn.addEventListener('click', () => {
      const av = btn.getAttribute('data-avatar');
      const name = btn.getAttribute('data-name');
      appState.avatar = av;
      appState.userName = name;
      if (avatarBtn) avatarBtn.textContent = av;
      const userNameDisp = document.getElementById('userNameDisplay');
      if (userNameDisp) userNameDisp.textContent = `${name} 🌟`;
      updateHUD();
      if (avatarModal) avatarModal.style.display = 'none';
      sound.playClick();
    });
  });

  const btnPrintCert = document.getElementById('btnPrintCert');
  if (btnPrintCert) {
    btnPrintCert.addEventListener('click', () => {
      window.print();
    });
  }

  updateHUD();
  initLab1();
  initLab2();
  renderQuiz();

  if (typeof renderMathInElement === 'function') {
    renderMathInElement(document.body, {
      delimiters: [
        { left: '$$', right: '$$', display: true },
        { left: '$', right: '$', display: false }
      ],
      throwOnError: false,
      strict: false
    });
  }
});
