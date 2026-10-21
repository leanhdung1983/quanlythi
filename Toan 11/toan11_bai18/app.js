// ================================================================
// BÀI 18: LUỸ THỪA VỚI SỐ MŨ THỰC - TOÁN 11 KẾT NỐI TRI THỨC
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
  userTitle: 'Nhà Thám Hiểm Luỹ Thừa Mũ',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// ==========================================
// QUIZ DATA: 10 CÂU CHUẨN SGK TRANG 9
// ==========================================
const quizData = [
  {
    id: 1,
    title: "Câu 1 • SGK 6.1a: Luỹ thừa số mũ âm",
    pts: 20,
    question: "Tính giá trị của biểu thức luỹ thừa số mũ nguyên âm: $A = \\left(\\frac{1}{5}\\right)^{-2}$.",
    options: [
      { text: "$25$", correct: true },
      { text: "$\\frac{1}{25}$", correct: false },
      { text: "$-25$", correct: false },
      { text: "$-10$", correct: false }
    ],
    explanation: "Theo định nghĩa luỹ thừa với số mũ nguyên âm: $\\left(\\frac{1}{5}\\right)^{-2} = \\frac{1}{(1/5)^2} = \\frac{1}{1/25} = 25$."
  },
  {
    id: 2,
    title: "Câu 2 • SGK 6.1b: Luỹ thừa số mũ hữu tỉ",
    pts: 20,
    question: "Tính giá trị của biểu thức luỹ thừa với số mũ phân số: $B = 4^{\\frac{3}{2}}$.",
    options: [
      { text: "$6$", correct: false },
      { text: "$8$", correct: true },
      { text: "$16$", correct: false },
      { text: "$\\sqrt{8}$", correct: false }
    ],
    explanation: "Theo định nghĩa luỹ thừa hữu tỉ $a^{\\frac{m}{n}} = \\sqrt[n]{a^m}$: $4^{\\frac{3}{2}} = (\\sqrt{4})^3 = 2^3 = 8$."
  },
  {
    id: 3,
    title: "Câu 3 • SGK 6.2a: Phối hợp phép tính luỹ thừa",
    pts: 20,
    question: "Thực hiện phép tính: $P = 27^{\\frac{2}{3}} + 81^{-0{,}75} - 25^{0{,}5}$.",
    options: [
      { text: "$\\frac{109}{27}$", correct: true },
      { text: "$4$", correct: false },
      { text: "$\\frac{100}{27}$", correct: false },
      { text: "$\\frac{28}{3}$", correct: false }
    ],
    explanation: "Ta biến đổi từng thành phần về luỹ thừa cơ số nguyên tố:<br>• $27^{\\frac{2}{3}} = (3^3)^{\\frac{2}{3}} = 3^2 = 9$.<br>• $81^{-0{,}75} = 81^{-\\frac{3}{4}} = (3^4)^{-\\frac{3}{4}} = 3^{-3} = \\frac{1}{27}$.<br>• $25^{0{,}5} = 25^{\\frac{1}{2}} = \\sqrt{25} = 5$.<br>Vậy $P = 9 + \\frac{1}{27} - 5 = 4 + \\frac{1}{27} = \\frac{109}{27}$."
  },
  {
    id: 4,
    title: "Câu 4 • SGK 6.2b: Luỹ thừa với số mũ vô tỉ",
    pts: 20,
    question: "Rút gọn biểu thức luỹ thừa có số mũ chứa căn thức: $Q = 4^{2-3\\sqrt{7}} \\cdot 8^{2\\sqrt{7}}$.",
    options: [
      { text: "$8$", correct: false },
      { text: "$16$", correct: true },
      { text: "$32$", correct: false },
      { text: "$64$", correct: false }
    ],
    explanation: "Đưa về cùng cơ số $2$:<br>$Q = (2^2)^{2-3\\sqrt{7}} \\cdot (2^3)^{2\\sqrt{7}} = 2^{4-6\\sqrt{7}} \\cdot 2^{6\\sqrt{7}} = 2^{4-6\\sqrt{7}+6\\sqrt{7}} = 2^4 = 16$."
  },
  {
    id: 5,
    title: "Câu 5 • SGK 6.3a: Rút gọn biểu thức chứa biến",
    pts: 20,
    question: "Rút gọn biểu thức $A = \\frac{x^5 y^{-2}}{x^3 y}$ với $x, y \\ne 0$.",
    options: [
      { text: "$\\frac{x^2}{y^3}$", correct: true },
      { text: "$x^2 y$", correct: false },
      { text: "$\\frac{x^2}{y}$", correct: false },
      { text: "$\\frac{y^3}{x^2}$", correct: false }
    ],
    explanation: "Áp dụng công thức $\\frac{a^m}{a^n} = a^{m-n}$:<br>$A = x^{5-3} \\cdot y^{-2-1} = x^2 y^{-3} = \\frac{x^2}{y^3}$."
  },
  {
    id: 6,
    title: "Câu 6 • SGK 6.4a: Rút gọn căn thức về luỹ thừa hữu tỉ",
    pts: 20,
    question: "Cho $x, y > 0$. Rút gọn biểu thức: $M = \\frac{x^{\\frac{1}{3}}\\sqrt{y} + y^{\\frac{1}{3}}\\sqrt{x}}{\\sqrt[6]{x} + \\sqrt[6]{y}}$.",
    options: [
      { text: "$\\sqrt{xy}$", correct: false },
      { text: "$\\sqrt[3]{xy}$", correct: true },
      { text: "$xy$", correct: false },
      { text: "$\\sqrt[6]{xy}$", correct: false }
    ],
    explanation: "Đổi tất cả căn và phân số về mẫu số chung $6$:<br>• $x^{\\frac{1}{3}}\\sqrt{y} = x^{\\frac{2}{6}} y^{\\frac{3}{6}} = x^{\\frac{2}{6}} y^{\\frac{2}{6}} \\cdot y^{\\frac{1}{6}} = (xy)^{\\frac{1}{3}} \\cdot y^{\\frac{1}{6}}$.<br>Đặt nhân tử chung ở tử số là $(xy)^{\\frac{1}{3}} = x^{\\frac{2}{6}} y^{\\frac{2}{6}}$:<br>Tử số $= x^{\\frac{2}{6}} y^{\\frac{2}{6}} (y^{\\frac{1}{6}} + x^{\\frac{1}{6}}) = (xy)^{\\frac{1}{3}} (\\sqrt[6]{x} + \\sqrt[6]{y})$.<br>Chia cho mẫu số $\\sqrt[6]{x} + \\sqrt[6]{y}$, ta được $M = (xy)^{\\frac{1}{3}} = \\sqrt[3]{xy}$."
  },
  {
    id: 7,
    title: "Câu 7 • SGK 6.6a: So sánh hai luỹ thừa cùng cơ số",
    pts: 20,
    question: "So sánh hai số: $5^{6\\sqrt{3}}$ và $5^{3\\sqrt{6}}$. Kết luận nào sau đây đúng?",
    options: [
      { text: "$5^{6\\sqrt{3}} > 5^{3\\sqrt{6}}$", correct: true },
      { text: "$5^{6\\sqrt{3}} < 5^{3\\sqrt{6}}$", correct: false },
      { text: "$5^{6\\sqrt{3}} = 5^{3\\sqrt{6}}$", correct: false },
      { text: "Không thể so sánh được", correct: false }
    ],
    explanation: "Vì cơ số $5 > 1$ nên luỹ thừa đồng biến theo số mũ. Ta so sánh hai số mũ:<br>• $6\\sqrt{3} = \\sqrt{36 \\times 3} = \\sqrt{108}$.<br>• $3\\sqrt{6} = \\sqrt{9 \\times 6} = \\sqrt{54}$.<br>Vì $\\sqrt{108} > \\sqrt{54} \\implies 6\\sqrt{3} > 3\\sqrt{6} \\implies 5^{6\\sqrt{3}} > 5^{3\\sqrt{6}}$."
  },
  {
    id: 8,
    title: "Câu 8 • SGK 6.6b: So sánh luỹ thừa khác dạng",
    pts: 20,
    question: "So sánh hai số: $A = \\left(\\frac{1}{2}\\right)^{-\\frac{4}{3}}$ và $B = \\sqrt{2} \\cdot 2^{\\frac{2}{3}}$.",
    options: [
      { text: "$A > B$", correct: true },
      { text: "$A < B$", correct: false },
      { text: "$A = B$", correct: false },
      { text: "$A = 2B$", correct: false }
    ],
    explanation: "Đưa cả hai số về luỹ thừa cơ số $2$:<br>• $A = (2^{-1})^{-\\frac{4}{3}} = 2^{\\frac{4}{3}} = 2^{\\frac{8}{6}}$.<br>• $B = 2^{\\frac{1}{2}} \\cdot 2^{\\frac{2}{3}} = 2^{\\frac{1}{2} + \\frac{2}{3}} = 2^{\\frac{7}{6}}$.<br>Vì cơ số $2 > 1$ và số mũ $\\frac{8}{6} > \\frac{7}{6}$ nên $A > B$."
  },
  {
    id: 9,
    title: "Câu 9 • SGK 6.7: Bài toán lãi kép kì hạn",
    pts: 20,
    question: "Bác An gửi tiết kiệm 120 triệu đồng theo kì hạn 6 tháng với lãi suất $5\\%$/năm không đổi. Hỏi sau 2 năm, tổng số tiền cả gốc và lãi bác An nhận được xấp xỉ bao nhiêu?",
    options: [
      { text: "Khoảng $132{,}46$ triệu đồng", correct: true },
      { text: "Khoảng $130{,}00$ triệu đồng", correct: false },
      { text: "Khoảng $138{,}60$ triệu đồng", correct: false },
      { text: "Khoảng $126{,}00$ triệu đồng", correct: false }
    ],
    explanation: "Kì hạn 6 tháng $\\implies$ một năm có $n = 2$ kì gửi. Lãi suất mỗi kì là $r = \\frac{5\\%}{2} = 2{,}5\\% = 0{,}025$.<br>Thời gian 2 năm tương ứng với $N = 2 \\times 2 = 4$ kì gửi.<br>Số tiền nhận được: $A = 120 \\cdot (1 + 0{,}025)^4 = 120 \\cdot (1{,}025)^4 \\approx 120 \\cdot 1{,}103813 \\approx 132{,}46$ triệu đồng."
  },
  {
    id: 10,
    title: "Câu 10 • SGK 6.8: Bài toán tăng trưởng dân số",
    pts: 20,
    question: "Dân số một quốc gia năm 2021 là 19 triệu người và ước tính tăng gấp đôi sau mỗi 30 năm theo công thức $A = 19 \\cdot 2^{\\frac{t}{30}}$ (triệu người). Sau 20 năm nữa, dân số quốc gia này là khoảng bao nhiêu?",
    options: [
      { text: "Khoảng $30$ triệu người", correct: true },
      { text: "Khoảng $38$ triệu người", correct: false },
      { text: "Khoảng $25$ triệu người", correct: false },
      { text: "Khoảng $34$ triệu người", correct: false }
    ],
    explanation: "Sau $t = 20$ năm, số dân là:<br>$A = 19 \\cdot 2^{\\frac{20}{30}} = 19 \\cdot 2^{\\frac{2}{3}} = 19 \\cdot \\sqrt[3]{4} \\approx 19 \\cdot 1{,}5874 \\approx 30{,}16$ triệu người.<br>Làm tròn đến chữ số hàng triệu ta được 30 triệu người."
  }
];

// ==========================================
// RENDER MATH HELPER (KaTeX + Fallback)
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
// LAB 1: KÍNH HIỂN VI XẤP XỈ LUỸ THỪA VÔ TỈ
// ==========================================
function initLab1() {
  const baseSlider = document.getElementById('baseSlider');
  const baseVal = document.getElementById('baseVal');
  const decSlider = document.getElementById('decSlider');
  const decVal = document.getElementById('decVal');
  const irrationalSelect = document.getElementById('irrationalSelect');
  const canvas = document.getElementById('irrationalCanvas');
  const output = document.getElementById('irrationalOutput');
  if (!canvas || !baseSlider || !decSlider) return;

  const ctx = canvas.getContext('2d');

  const irrationalMap = {
    sqrt2: { name: '\\sqrt{2}', val: Math.SQRT2, str: '1.414213562373' },
    sqrt3: { name: '\\sqrt{3}', val: Math.sqrt(3), str: '1.732050807568' },
    pi: { name: '\\pi', val: Math.PI, str: '3.141592653589' }
  };

  function update() {
    const a = parseFloat(baseSlider.value);
    const n = parseInt(decSlider.value);
    const irKey = irrationalSelect.value;
    const ir = irrationalMap[irKey];

    baseVal.textContent = a.toFixed(1);
    decVal.textContent = n;

    // Tính xấp xỉ hữu tỉ r_n
    const rStr = ir.val.toFixed(n);
    const r_n = parseFloat(rStr);
    const val_rn = Math.pow(a, r_n);
    const trueVal = Math.pow(a, ir.val);
    const err = Math.abs(val_rn - trueVal);

    // Vẽ Canvas
    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#0a0f1d');
    bgGrad.addColorStop(1, '#05070e');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.12)';
    ctx.lineWidth = 1;
    for (let x = 60; x < w; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 20);
      ctx.lineTo(x, h - 30);
      ctx.stroke();
    }

    // Vẽ 2 trục số đối chiếu:
    // Trục trên: Trục số mũ r_n -> alpha
    // Trục dưới: Trục giá trị a^{r_n} -> a^{alpha}
    const axisY1 = 110;
    const axisY2 = 250;

    // Title text
    ctx.fillStyle = '#818cf8';
    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`TRỤC 1: SỐ MŨ HỮU TỈ r_n TIẾN TỚI ${ir.name.replace(/\\/g, '')} = ${ir.val.toFixed(6)}...`, 50, 60);
    ctx.fillText(`TRỤC 2: GIÁ TRỊ LUỸ THỪA a^{r_n} TIẾN TỚI a^α = ${trueVal.toFixed(6)}...`, 50, 200);

    // Trục 1
    ctx.strokeStyle = '#6366f1';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, axisY1);
    ctx.lineTo(w - 50, axisY1);
    ctx.stroke();

    // Trục 2
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(50, axisY2);
    ctx.lineTo(w - 50, axisY2);
    ctx.stroke();

    // Map số mũ lên trục 1
    const minExp = Math.floor(ir.val);
    const maxExp = Math.ceil(ir.val);
    const scaleExp = (val) => 50 + ((val - minExp) / (maxExp - minExp)) * (w - 100);

    // Điểm đích alpha trên trục 1
    const targetX1 = scaleExp(ir.val);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(targetX1, 75);
    ctx.lineTo(targetX1, axisY1 + 35);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(targetX1, axisY1, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`α = ${ir.val.toFixed(4)}`, targetX1 - 25, axisY1 + 25);

    // Điểm hiện tại r_n trên trục 1
    const curX1 = scaleExp(r_n);
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath();
    ctx.arc(curX1, axisY1, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`r_${n} = ${r_n.toFixed(n)}`, curX1 - 20, axisY1 - 12);

    // Map giá trị lên trục 2
    const minVal = Math.pow(a, minExp);
    const maxVal = Math.pow(a, maxExp);
    const scaleVal = (val) => 50 + ((val - minVal) / (maxVal - minVal)) * (w - 100);

    // Điểm đích a^alpha trên trục 2
    const targetX2 = scaleVal(trueVal);
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(targetX2, 215);
    ctx.lineTo(targetX2, axisY2 + 35);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(targetX2, axisY2, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`a^α = ${trueVal.toFixed(4)}`, targetX2 - 25, axisY2 + 25);

    // Điểm hiện tại a^{r_n} trên trục 2
    const curX2 = scaleVal(val_rn);
    ctx.fillStyle = '#10b981';
    ctx.beginPath();
    ctx.arc(curX2, axisY2, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(`${a}^{${r_n.toFixed(n)}} = ${val_rn.toFixed(4)}`, curX2 - 35, axisY2 - 12);

    // Nối liên kết động giữa 2 điểm xấp xỉ
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(curX1, axisY1);
    ctx.lineTo(curX2, axisY2);
    ctx.stroke();

    // Thanh đo sai số Epsilon
    ctx.fillStyle = '#94a3b8';
    ctx.font = '13px sans-serif';
    ctx.fillText(`Sai số tuyệt đối: |${a}^{r_${n}} - ${a}^α| = ${err.toExponential(4)}`, 50, h - 15);

    // Output Box HTML
    output.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px;">
        <div><strong>Cơ số $a$:</strong> $${a}$</div>
        <div><strong>Số mũ vô tỉ:</strong> $${ir.name} \\approx ${ir.val.toFixed(8)}$</div>
        <div><strong>Xấp xỉ hữu tỉ $r_{${n}}$:</strong> $${r_n.toFixed(n)}$</div>
        <div><strong>Giá trị luỹ thừa:</strong> $${a}^{${r_n.toFixed(n)}} = ${val_rn.toFixed(6)}$</div>
        <div><strong>Giá trị chính xác:</strong> $${a}^{${ir.name}} = ${trueVal.toFixed(6)}$</div>
        <div><strong>Độ lệch sai số $\\epsilon$:</strong> $${err.toExponential(3)}$</div>
      </div>
    `;
    renderMathInTree(output);

    unlockBadge(1);
  }

  baseSlider.addEventListener('input', () => { update(); sound.playClick(); });
  decSlider.addEventListener('input', () => { update(); sound.playClick(); });
  irrationalSelect.addEventListener('change', () => { update(); sound.playClick(); });

  update();
}

// ==========================================
// LAB 2: MÁY KHẢO SÁT CHIỀU BIẾN THIÊN $a^x$
// ==========================================
function initLab2() {
  const curveBaseSlider = document.getElementById('curveBaseSlider');
  const curveBaseVal = document.getElementById('curveBaseVal');
  const alphaSlider = document.getElementById('alphaSlider');
  const alphaVal = document.getElementById('alphaVal');
  const betaSlider = document.getElementById('betaSlider');
  const betaVal = document.getElementById('betaVal');
  const canvas = document.getElementById('curveCanvas');
  const output = document.getElementById('curveOutput');
  if (!canvas || !curveBaseSlider || !alphaSlider || !betaSlider) return;

  const ctx = canvas.getContext('2d');

  function update() {
    const a = parseFloat(curveBaseSlider.value);
    const alpha = parseFloat(alphaSlider.value);
    const beta = parseFloat(betaSlider.value);

    curveBaseVal.textContent = a.toFixed(2);
    alphaVal.textContent = alpha.toFixed(2);
    betaVal.textContent = beta.toFixed(2);

    const valAlpha = Math.pow(a, alpha);
    const valBeta = Math.pow(a, beta);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#070a14';
    ctx.fillRect(0, 0, w, h);

    // Coordinate system: Origin at (w/2, h - 80)
    const ox = w / 2;
    const oy = h - 80;
    const scaleX = 100; // 100px per unit x
    const scaleY = 60;  // 60px per unit y

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = ox % scaleX; x < w; x += scaleX) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = oy % scaleY; y < h; y += scaleY) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    // Ox
    ctx.beginPath(); ctx.moveTo(30, oy); ctx.lineTo(w - 30, oy); ctx.stroke();
    // Oy
    ctx.beginPath(); ctx.moveTo(ox, 20); ctx.lineTo(ox, h - 20); ctx.stroke();

    // Điểm (0; 1)
    const y1 = oy - scaleY;
    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(ox, y1, 5, 0, Math.PI * 2); ctx.fill();
    ctx.font = '12px sans-serif';
    ctx.fillText('(0; 1)', ox + 8, y1 - 4);

    // Vẽ đường cong y = a^x
    ctx.strokeStyle = a > 1 ? '#38bdf8' : '#ec4899';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let started = false;
    for (let px = 30; px <= w - 30; px += 2) {
      const x = (px - ox) / scaleX;
      const y = Math.pow(a, x);
      const py = oy - y * scaleY;
      if (py >= 10 && py <= h - 10) {
        if (!started) { ctx.moveTo(px, py); started = true; }
        else { ctx.lineTo(px, py); }
      }
    }
    ctx.stroke();

    // Điểm Alpha
    const pxAlpha = ox + alpha * scaleX;
    const pyAlpha = oy - valAlpha * scaleY;
    if (pyAlpha >= 10 && pyAlpha <= h - 10) {
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.5)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(pxAlpha, oy); ctx.lineTo(pxAlpha, pyAlpha); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, pyAlpha); ctx.lineTo(pxAlpha, pyAlpha); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#10b981';
      ctx.beginPath(); ctx.arc(pxAlpha, pyAlpha, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(`α = ${alpha.toFixed(1)}`, pxAlpha - 15, oy + 16);
      ctx.fillText(`a^α = ${valAlpha.toFixed(2)}`, ox - 65, pyAlpha + 4);
    }

    // Điểm Beta
    const pxBeta = ox + beta * scaleX;
    const pyBeta = oy - valBeta * scaleY;
    if (pyBeta >= 10 && pyBeta <= h - 10) {
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
      ctx.setLineDash([3, 3]);
      ctx.beginPath(); ctx.moveTo(pxBeta, oy); ctx.lineTo(pxBeta, pyBeta); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, pyBeta); ctx.lineTo(pxBeta, pyBeta); ctx.stroke();
      ctx.setLineDash([]);

      ctx.fillStyle = '#ef4444';
      ctx.beginPath(); ctx.arc(pxBeta, pyBeta, 6, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(`β = ${beta.toFixed(1)}`, pxBeta - 15, oy + 16);
      ctx.fillText(`a^β = ${valBeta.toFixed(2)}`, ox - 65, pyBeta + 4);
    }

    // Nhận định so sánh
    const compExp = alpha > beta ? '>' : (alpha < beta ? '<' : '=');
    const compVal = valAlpha > valBeta ? '>' : (valAlpha < valBeta ? '<' : '=');
    const monotonicity = a > 1 ? 'ĐỒNG BIẾN (cùng chiều)' : 'NGHỊCH BIẾN (ngược chiều)';

    output.innerHTML = `
      <div style="line-height: 1.8;">
        <div><strong>Hàm số:</strong> $y = ${a.toFixed(2)}^x$ • <strong>Tính chất:</strong> <span style="color: ${a > 1 ? '#38bdf8' : '#ec4899'}; font-weight: bold;">${monotonicity}</span></div>
        <div><strong>So sánh số mũ:</strong> $\\alpha = ${alpha.toFixed(2)} \\; ${compExp} \\; \\beta = ${beta.toFixed(2)}$</div>
        <div><strong>So sánh luỹ thừa:</strong> $${a.toFixed(2)}^{\\alpha} = ${valAlpha.toFixed(3)} \\; ${compVal} \\; ${a.toFixed(2)}^{\\beta} = ${valBeta.toFixed(3)}$</div>
        <div style="color: #94a3b8; font-size: 13px;"><em>Kết luận:</em> ${a > 1 ? 'Do cơ số $a > 1$ nên chiều so sánh luỹ thừa bảo toàn cùng chiều với số mũ.' : 'Do cơ số $0 < a < 1$ nên chiều so sánh luỹ thừa bị đảo ngược chiều so với số mũ!'}</div>
      </div>
    `;
    renderMathInTree(output);

    unlockBadge(2);
  }

  curveBaseSlider.addEventListener('input', () => { update(); sound.playClick(); });
  alphaSlider.addEventListener('input', () => { update(); sound.playClick(); });
  betaSlider.addEventListener('input', () => { update(); sound.playClick(); });

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

    // Explanation Box (ẩn ban đầu)
    const expBox = document.createElement('div');
    expBox.className = 'explanation-box';
    expBox.innerHTML = `<strong>💡 Lời giải chi tiết:</strong> ${q.explanation}`;
    card.appendChild(expBox);

    container.appendChild(card);
  });

  // KaTeX quét và render toàn bộ công thức trong quiz
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
    // Highlight đáp án đúng
    q.options.forEach((o, idx) => {
      if (o.correct) allBtns[idx].classList.add('correct');
    });
  }

  updateHUD();
  updateArenaScore();

  // Kiểm tra huy hiệu
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
  // Navigation Tabs
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

  // Sound Toggle
  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      sound.enabled = !sound.enabled;
      soundToggle.textContent = sound.enabled ? '🔊 Âm thanh: BẬT' : '🔇 Âm thanh: TẮT';
      sound.playClick();
    });
  }

  // Reset Progress
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

  // Avatar Modal
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

  // Print Cert
  const btnPrintCert = document.getElementById('btnPrintCert');
  if (btnPrintCert) {
    btnPrintCert.addEventListener('click', () => {
      window.print();
    });
  }

  // Khởi động
  updateHUD();
  initLab1();
  initLab2();
  renderQuiz();

  // KaTeX toàn trang
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
