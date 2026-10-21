// ================================================================
// BÀI 20: HÀM SỐ MŨ VÀ HÀM SỐ LÔGARIT - TOÁN 11 KẾT NỐI TRI THỨC
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
  userTitle: 'Chuyên Gia Khảo Sát Hàm Số Mũ',
  stars: 2,
  xp: 0,
  streak: 0,
  sound: true,
  answered: {},
  badges: [false, false, false, false, false]
};

// ==========================================
// QUIZ DATA: 10 CÂU CHUẨN SGK TRANG 16 - 19
// ==========================================
const quizData = [
  {
    id: 1,
    title: "Câu 1 • SGK tr. 16: Nhận dạng hàm số mũ",
    pts: 20,
    question: "Trong các hàm số sau đây, hàm số nào là một hàm số mũ?",
    options: [
      { text: "$y = (\\sqrt{2})^x$", correct: true },
      { text: "$y = x^{-2}$", correct: false },
      { text: "$y = 8^3$", correct: false },
      { text: "$y = x^\\pi$", correct: false }
    ],
    explanation: "Định nghĩa: Hàm số mũ có dạng $y = a^x$ với cơ số $0 < a \\ne 1$ và biến số $x$ nằm ở số mũ. Do đó $y = (\\sqrt{2})^x$ là hàm số mũ cơ số $\\sqrt{2}$. Các hàm số $y = x^{-2}, y = x^\\pi$ là hàm luỹ thừa, còn $y = 8^3 = 512$ là hàm hằng."
  },
  {
    id: 2,
    title: "Câu 2 • SGK 6.17a: Tìm tập xác định hàm số lôgarit",
    pts: 20,
    question: "Tìm tập xác định của hàm số: $y = \\log|x + 3|$.",
    options: [
      { text: "$D = \\mathbb{R} \\setminus \\{-3\\}$", correct: true },
      { text: "$D = (-3; +\\infty)$", correct: false },
      { text: "$D = \\mathbb{R}$", correct: false },
      { text: "$D = (-\\infty; -3)$", correct: false }
    ],
    explanation: "Hàm số $y = \\log|x+3|$ xác định khi và chỉ khi biểu thức lấy logarit dương: $|x+3| > 0 \\iff x+3 \\ne 0 \\iff x \\ne -3$. Vậy tập xác định là $D = \\mathbb{R} \\setminus \\{-3\\}$."
  },
  {
    id: 3,
    title: "Câu 3 • SGK 6.17b: Tập xác định hàm số logarit bậc 2",
    pts: 20,
    question: "Tìm tập xác định của hàm số lôgarit tự nhiên: $y = \\ln(4 - x^2)$.",
    options: [
      { text: "$D = (-2; 2)$", correct: true },
      { text: "$D = [-2; 2]$", correct: false },
      { text: "$D = (-\\infty; -2) \\cup (2; +\\infty)$", correct: false },
      { text: "$D = (0; 2)$", correct: false }
    ],
    explanation: "Điều kiện xác định: $4 - x^2 > 0 \\iff x^2 < 4 \\iff -2 < x < 2$. Vậy $D = (-2; 2)$."
  },
  {
    id: 4,
    title: "Câu 4 • SGK 6.15: Tính chất đồ thị hàm số mũ đối lập",
    pts: 20,
    question: "Cho hai hàm số $y = 3^x$ và $y = \\left(\\frac{1}{3}\\right)^x$. Phát biểu nào sau đây là SAI?",
    options: [
      { text: "Cả hai đồ thị đều đi qua điểm $(1; 0)$", correct: true },
      { text: "Cả hai đồ thị đều đi qua điểm $(0; 1)$", correct: false },
      { text: "Đồ thị $y = 3^x$ đồng biến, đồ thị $y = (1/3)^x$ nghịch biến", correct: false },
      { text: "Hai đồ thị đối xứng nhau qua trục tung $Oy$", correct: false }
    ],
    explanation: "Hàm số mũ $y = a^x$ có $y(0) = a^0 = 1$ nên luôn đi qua $(0; 1)$ trên trục tung, KHÔNG đi qua $(1; 0)$ trên trục hoành. Do đó phát biểu A sai."
  },
  {
    id: 5,
    title: "Câu 5 • SGK tr. 17 - 18: Đường tiệm cận của hàm mũ & lôgarit",
    pts: 20,
    question: "Khẳng định nào sau đây là ĐÚNG về đường tiệm cận của hàm số $y = 2^x$ và $y = \\log_2 x$?",
    options: [
      { text: "$y = 2^x$ có tiệm cận ngang $y = 0$, $y = \\log_2 x$ có tiệm cận đứng $x = 0$", correct: true },
      { text: "$y = 2^x$ có tiệm cận đứng $x = 0$, $y = \\log_2 x$ có tiệm cận ngang $y = 0$", correct: false },
      { text: "Cả hai đồ thị đều không có đường tiệm cận nào", correct: false },
      { text: "Cả hai đồ thị đều nhận đường thẳng $y = x$ làm tiệm cận xiên", correct: false }
    ],
    explanation: "Đồ thị hàm số mũ $y = 2^x$ nhận trục hoành $y = 0$ làm tiệm cận ngang (khi $x \\to -\\infty$). Đồ thị hàm số lôgarit $y = \\log_2 x$ nhận trục tung $x = 0$ làm tiệm cận đứng (khi $x \\to 0^+$)."
  },
  {
    id: 6,
    title: "Câu 6 • SGK tr. 18: Đối xứng qua đường phân giác y = x",
    pts: 20,
    question: "Biết điểm $M(2; 4)$ thuộc đồ thị hàm số $y = 2^x$. Điểm đối xứng với $M$ qua đường thẳng $y = x$ là điểm nào và thuộc đồ thị hàm số nào?",
    options: [
      { text: "$M'(4; 2)$ thuộc đồ thị $y = \\log_2 x$", correct: true },
      { text: "$M'(-2; -4)$ thuộc đồ thị $y = -2^x$", correct: false },
      { text: "$M'(2; -4)$ thuộc đồ thị $y = \\log_2 x$", correct: false },
      { text: "$M'(4; 2)$ thuộc đồ thị $y = 2^x$", correct: false }
    ],
    explanation: "Phép đối xứng qua đường thẳng $y = x$ hoán đổi hoành độ và tung độ: $M(2; 4) \\implies M'(4; 2)$. Vì $y = \\log_2 x$ là hàm ngược của $y = 2^x$ nên $M'(4; 2)$ thuộc đồ thị $y = \\log_2 x$ (kiểm tra: $\\log_2 4 = 2$)."
  },
  {
    id: 7,
    title: "Câu 7 • SGK tr. 16: Dự báo dân số Việt Nam năm 2050",
    pts: 20,
    question: "Năm 2020 dân số Việt Nam khoảng $97{,}34$ triệu người và tỉ lệ tăng hàng năm ước tính $r = 0{,}91\\%$. Theo mô hình tăng trưởng mũ liên tục $A = P e^{rt}$, dự báo dân số Việt Nam năm 2050 là khoảng bao nhiêu?",
    options: [
      { text: "Khoảng $127{,}88$ triệu người", correct: true },
      { text: "Khoảng $115{,}40$ triệu người", correct: false },
      { text: "Khoảng $142{,}10$ triệu người", correct: false },
      { text: "Khoảng $105{,}00$ triệu người", correct: false }
    ],
    explanation: "Từ năm 2020 đến 2050 là $t = 30$ năm. Tỉ lệ $r = 0{,}91\\% = 0{,}0091$.<br>Dân số dự báo: $A = 97{,}34 \\cdot e^{0{,}0091 \\times 30} = 97{,}34 \\cdot e^{0{,}273} \\approx 97{,}34 \\cdot 1{,}3139 \\approx 127{,}88$ triệu người."
  },
  {
    id: 8,
    title: "Câu 8 • SGK 6.18a: Khối lượng phóng xạ ban đầu",
    pts: 20,
    question: "Một chất phóng xạ phân rã theo hàm số $m(t) = 13e^{-0{,}015t}$ ($m(t)$ tính bằng kg, $t$ tính bằng ngày). Khối lượng của chất phóng xạ đó tại thời điểm ban đầu $t = 0$ là bao nhiêu?",
    options: [
      { text: "$13\\text{ kg}$", correct: true },
      { text: "$0\\text{ kg}$", correct: false },
      { text: "$13e\\text{ kg}$", correct: false },
      { text: "$12{,}8\\text{ kg}$", correct: false }
    ],
    explanation: "Tại thời điểm ban đầu $t = 0$, khối lượng là: $m(0) = 13 \\cdot e^{-0{,}015 \\times 0} = 13 \\cdot e^0 = 13 \\cdot 1 = 13\\text{ kg}$."
  },
  {
    id: 9,
    title: "Câu 9 • SGK 6.18b: Khối lượng phóng xạ còn lại sau 45 ngày",
    pts: 20,
    question: "Với chất phóng xạ phân rã $m(t) = 13e^{-0{,}015t}$, sau 45 ngày khối lượng còn lại xấp xỉ bao nhiêu?",
    options: [
      { text: "Khoảng $6{,}62\\text{ kg}$", correct: true },
      { text: "Khoảng $8{,}50\\text{ kg}$", correct: false },
      { text: "Khoảng $4{,}25\\text{ kg}$", correct: false },
      { text: "Khoảng $10{,}12\\text{ kg}$", correct: false }
    ],
    explanation: "Sau $t = 45$ ngày: $m(45) = 13 \\cdot e^{-0{,}015 \\times 45} = 13 \\cdot e^{-0{,}675} \\approx 13 \\cdot 0{,}509156 \\approx 6{,}62\\text{ kg}$."
  },
  {
    id: 10,
    title: "Câu 10 • SGK 6.19: Khả năng ghi nhớ theo đường cong Ebbinghaus",
    pts: 20,
    question: "Khả năng ghi nhớ danh sách động vật của học sinh sau $t$ tháng được mô hình hoá bởi $M(t) = 75 - 20\\ln(t+1)$ (\\%). Hỏi sau 6 tháng, khả năng nhớ trung bình của nhóm học sinh là bao nhiêu?",
    options: [
      { text: "Khoảng $36{,}08\\%$", correct: true },
      { text: "Khoảng $45{,}20\\%$", correct: false },
      { text: "Khoảng $55{,}00\\%$", correct: false },
      { text: "Khoảng $28{,}50\\%$", correct: false }
    ],
    explanation: "Thay $t = 6$ vào công thức: $M(6) = 75 - 20\\ln(6+1) = 75 - 20\\ln 7 \\approx 75 - 20 \\times 1{,}94591 = 75 - 38{,}918 = 36{,}08\\%$."
  }
];

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
// LAB 1: ĐỒ THỊ SOI GƯƠNG QUA Y = X
// ==========================================
function initLab1() {
  const baseSlider = document.getElementById('mirrorBaseSlider');
  const baseVal = document.getElementById('mirrorBaseVal');
  const xSlider = document.getElementById('pointXSlider');
  const xVal = document.getElementById('pointXVal');
  const btnInvert = document.getElementById('btnToggleInvert');
  const canvas = document.getElementById('mirrorCanvas');
  const output = document.getElementById('mirrorOutput');
  if (!canvas || !baseSlider || !xSlider) return;

  const ctx = canvas.getContext('2d');

  function update() {
    const a = parseFloat(baseSlider.value);
    const x0 = parseFloat(xSlider.value);
    const y0 = Math.pow(a, x0); // Điểm trên hàm mũ (x0; y0)
    const x0_inv = y0;          // Điểm đối xứng trên hàm log (y0; x0)
    const y0_inv = x0;

    baseVal.textContent = a.toFixed(2);
    xVal.textContent = x0.toFixed(2);

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#070a14';
    ctx.fillRect(0, 0, w, h);

    // Origin at center (w/2, h/2)
    const ox = w / 2;
    const oy = h / 2;
    const scale = 50; // 50px per unit

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let x = ox % scale; x < w; x += scale) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = oy % scale; y < h; y += scale) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    // Ox
    ctx.beginPath(); ctx.moveTo(20, oy); ctx.lineTo(w - 20, oy); ctx.stroke();
    // Oy
    ctx.beginPath(); ctx.moveTo(ox, 20); ctx.lineTo(ox, h - 20); ctx.stroke();

    // Trục đối xứng y = x (vàng đứt đoạn)
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.7)';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(ox - 250, oy + 250);
    ctx.lineTo(ox + 250, oy - 250);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 13px sans-serif';
    ctx.fillText('Đường đối xứng y = x', ox + 140, oy - 150);

    // 1. Vẽ đồ thị hàm số mũ: y = a^x (Xanh Cyan)
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let startedM = false;
    for (let px = 20; px <= w - 20; px += 2) {
      const vx = (px - ox) / scale;
      const vy = Math.pow(a, vx);
      const py = oy - vy * scale;
      if (py >= 10 && py <= h - 10) {
        if (!startedM) { ctx.moveTo(px, py); startedM = true; }
        else { ctx.lineTo(px, py); }
      }
    }
    ctx.stroke();

    // 2. Vẽ đồ thị hàm số lôgarit: y = log_a(x) (Tím Neon)
    ctx.strokeStyle = '#c084fc';
    ctx.lineWidth = 3;
    ctx.beginPath();
    let startedL = false;
    for (let px = ox + 1; px <= w - 20; px += 2) {
      const vx = (px - ox) / scale;
      if (vx > 0) {
        const vy = Math.log(vx) / Math.log(a);
        const py = oy - vy * scale;
        if (py >= 10 && py <= h - 10) {
          if (!startedL) { ctx.moveTo(px, py); startedL = true; }
          else { ctx.lineTo(px, py); }
        }
      }
    }
    ctx.stroke();

    // Điểm đặc biệt: (0; 1) trên hàm mũ và (1; 0) trên hàm log
    const p01_y = oy - 1 * scale;
    ctx.fillStyle = '#06b6d4';
    ctx.beginPath(); ctx.arc(ox, p01_y, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillText('(0; 1)', ox - 35, p01_y + 4);

    const p10_x = ox + 1 * scale;
    ctx.fillStyle = '#c084fc';
    ctx.beginPath(); ctx.arc(p10_x, oy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillText('(1; 0)', p10_x - 10, oy + 20);

    // Điểm động M(x0; y0) trên hàm mũ
    const pxM = ox + x0 * scale;
    const pyM = oy - y0 * scale;
    if (pyM >= 10 && pyM <= h - 10) {
      ctx.fillStyle = '#38bdf8';
      ctx.beginPath(); ctx.arc(pxM, pyM, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(`M(${x0.toFixed(2)}; ${y0.toFixed(2)})`, pxM + 10, pyM - 6);
    }

    // Điểm đối xứng M'(y0; x0) trên hàm log
    const pxM_inv = ox + x0_inv * scale;
    const pyM_inv = oy - y0_inv * scale;
    if (pxM_inv <= w - 10 && pyM_inv >= 10 && pyM_inv <= h - 10) {
      ctx.fillStyle = '#e879f9';
      ctx.beginPath(); ctx.arc(pxM_inv, pyM_inv, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillText(`M'(${x0_inv.toFixed(2)}; ${y0_inv.toFixed(2)})`, pxM_inv + 10, pyM_inv + 16);

      // Đoạn nối vuông góc giữa 2 điểm phản chiếu qua y = x
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.beginPath();
      ctx.moveTo(pxM, pyM);
      ctx.lineTo(pxM_inv, pyM_inv);
      ctx.stroke();
      ctx.setLineDash([]);
    }

    // Chú thích nhãn hàm
    ctx.font = 'bold 15px sans-serif';
    ctx.fillStyle = '#06b6d4';
    ctx.fillText(`y = ${a.toFixed(2)}^x`, 50, 45);
    ctx.fillStyle = '#c084fc';
    ctx.fillText(`y = log_{${a.toFixed(2)}}(x)`, 50, 75);

    output.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 12px; line-height: 1.8;">
        <div><strong>Cơ số $a$:</strong> $${a.toFixed(2)}$ (${a > 1 ? 'Đồng biến ↗' : 'Nghịch biến ↘'})</div>
        <div><strong>Điểm trên hàm mũ:</strong> $M(${x0.toFixed(2)}; ${y0.toFixed(2)})$</div>
        <div><strong>Điểm soi gương qua $y=x$:</strong> $M'(${x0_inv.toFixed(2)}; ${y0_inv.toFixed(2)})$</div>
        <div><strong>Kiểm chứng lôgarit:</strong> $\\log_{${a.toFixed(2)}}(${x0_inv.toFixed(2)}) = ${y0_inv.toFixed(2)}$</div>
        <div><strong>Tiệm cận hàm mũ:</strong> $y = 0$ (Trục hoành $Ox$)</div>
        <div><strong>Tiệm cận hàm lôgarit:</strong> $x = 0$ (Trục tung $Oy$)</div>
      </div>
    `;
    renderMathInTree(output);

    unlockBadge(1);
  }

  baseSlider.addEventListener('input', () => { update(); sound.playClick(); });
  xSlider.addEventListener('input', () => { update(); sound.playClick(); });

  if (btnInvert) {
    btnInvert.addEventListener('click', () => {
      const curA = parseFloat(baseSlider.value);
      const newA = Math.max(0.2, Math.min(3.5, 1 / curA));
      baseSlider.value = newA.toFixed(2);
      update();
      sound.playClick();
    });
  }

  update();
}

// ==========================================
// LAB 2: MÔ PHỎNG EBBINGHAUS & PHÂN RÃ HẠT NHÂN
// ==========================================
function initLab2() {
  const timeSlider = document.getElementById('timeSlider');
  const timeVal = document.getElementById('timeVal');
  const modeSelect = document.getElementById('modeSelect');
  const canvas = document.getElementById('appCanvas');
  const output = document.getElementById('appOutput');
  if (!canvas || !timeSlider || !modeSelect) return;

  const ctx = canvas.getContext('2d');

  function update() {
    const t = parseInt(timeSlider.value);
    const mode = modeSelect.value;
    timeVal.textContent = t;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = '#080c18';
    ctx.fillRect(0, 0, w, h);

    const ox = 70;
    const oy = h - 60;
    const graphW = w - 120;
    const graphH = h - 100;

    // Grid
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 1;
    for (let x = ox; x <= ox + graphW; x += graphW / 10) {
      ctx.beginPath(); ctx.moveTo(x, 40); ctx.lineTo(x, oy); ctx.stroke();
    }
    for (let y = oy; y >= 40; y -= graphH / 5) {
      ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + graphW, y); ctx.stroke();
    }

    // Axes
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + graphW + 20, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, 30); ctx.stroke();

    let maxT = 60;
    let maxY = 100;
    let func = (vt) => 0;
    let curVal = 0;
    let titleStr = '';
    let unitStr = '';

    if (mode === 'ebbinghaus') {
      maxT = 12;
      maxY = 100;
      timeSlider.max = 12;
      func = (vt) => Math.max(0, 75 - 20 * Math.log(vt + 1));
      curVal = func(t);
      titleStr = 'Đường cong quên lãng Ebbinghaus M(t) = 75 - 20ln(t + 1)';
      unitStr = '%';
    } else if (mode === 'decay') {
      maxT = 60;
      maxY = 14;
      timeSlider.max = 60;
      func = (vt) => 13 * Math.exp(-0.015 * vt);
      curVal = func(t);
      titleStr = 'Phân rã phóng xạ m(t) = 13e^{-0.015t}';
      unitStr = 'kg';
    } else {
      maxT = 40;
      maxY = 150;
      timeSlider.max = 40;
      func = (vt) => 97.34 * Math.exp(0.0091 * vt);
      curVal = func(t);
      titleStr = 'Tăng trưởng dân số Việt Nam A(t) = 97.34e^{0.0091t}';
      unitStr = 'Triệu người';
    }

    // Vẽ đường cong đồ thị
    ctx.strokeStyle = mode === 'ebbinghaus' ? '#38bdf8' : (mode === 'decay' ? '#f43f5e' : '#10b981');
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let px = 0; px <= graphW; px += 2) {
      const vt = (px / graphW) * maxT;
      const vy = func(vt);
      const py = oy - (vy / maxY) * graphH;
      if (px === 0) ctx.moveTo(ox + px, py);
      else ctx.lineTo(ox + px, py);
    }
    ctx.stroke();

    // Điểm tại thời gian t
    const curPx = ox + (t / maxT) * graphW;
    const curPy = oy - (curVal / maxY) * graphH;

    ctx.strokeStyle = 'rgba(245, 158, 11, 0.6)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(curPx, oy); ctx.lineTo(curPx, curPy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, curPy); ctx.lineTo(curPx, curPy); ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = '#f59e0b';
    ctx.beginPath(); ctx.arc(curPx, curPy, 7, 0, Math.PI * 2); ctx.fill();

    ctx.font = 'bold 14px sans-serif';
    ctx.fillText(`${curVal.toFixed(2)} ${unitStr}`, curPx + 10, curPy - 8);

    // Header Canvas
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText(titleStr, ox + 20, 25);

    output.innerHTML = `
      <div style="line-height: 1.8;">
        <div><strong>Mô hình:</strong> ${titleStr}</div>
        <div><strong>Thời gian khảo sát:</strong> $t = ${t}$ (${mode === 'ebbinghaus' ? 'Tháng' : (mode === 'decay' ? 'Ngày' : 'Năm kể từ 2020')})</div>
        <div><strong>Giá trị tính toán:</strong> <span style="color: #f59e0b; font-weight: bold; font-size: 16px;">${curVal.toFixed(2)} ${unitStr}</span></div>
      </div>
    `;
    renderMathInTree(output);

    unlockBadge(2);
  }

  timeSlider.addEventListener('input', () => { update(); sound.playClick(); });
  modeSelect.addEventListener('change', () => { update(); sound.playClick(); });

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
